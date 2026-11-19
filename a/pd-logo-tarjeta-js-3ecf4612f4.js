
/* Logo del negocio en cada tarjeta de pedido: grande e inclinado al fondo + insignia con el nombre */
(function(){
  if(window.__pdLogoNeg)return;window.__pdLogoNeg=true;
  const CARDS='#orderList .adminOrderCard[data-order-id], #orders article.order[data-order-id], #businessOrdersList article.x-order[data-order]';
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cli=()=>{try{return db}catch(e){return window.db}};
  const NEG=new Map(),PED=new Map(),PIDIENDO=new Set();let negListo=false,negPend=null;
  const logoDe=n=>n&&(n.logo_url||n.logo||n.imagen_logo_url||n.imagen_logo)||'';
  async function cargarNeg(){
    if(negListo||negPend)return negPend;const c=cli();if(!c)return;
    negPend=(async()=>{try{const {data,error}=await c.from('negocios').select('*');if(!error&&data){data.forEach(n=>NEG.set(String(n.id),{nombre:n.nombre||'',logo:logoDe(n)}));negListo=true}}catch(e){}negPend=null})();
    return negPend;
  }
  async function cargarPed(ids){
    const c=cli();if(!c||!ids.length)return;ids.forEach(i=>PIDIENDO.add(i));
    try{const {data,error}=await c.from('pedidos').select('*').in('id',ids);
      if(!error&&data)data.forEach(p=>PED.set(String(p.id),String(p.negocio_id||p.restaurante_id||'')));
      ids.forEach(i=>{if(!PED.has(i))PED.set(i,'')});
    }catch(e){}finally{ids.forEach(i=>PIDIENDO.delete(i))}
  }
  const idDe=c=>String(c.dataset.orderId||c.dataset.order||'');
  function decorar(card,n){
    const key=(n.logo||'')+'|'+n.nombre;
    let bg=card.querySelector(':scope > .pdNegBg');
    if(n.logo){
      if(!bg){bg=document.createElement('i');bg.className='pdNegBg';bg.setAttribute('aria-hidden','true');card.prepend(bg)}
      if(bg.dataset.k!==key){bg.dataset.k=key;bg.style.backgroundImage='url("'+n.logo.replace(/"/g,'%22')+'")'}
      card.classList.add('pdNegOn');
    }else if(bg){bg.remove();card.classList.remove('pdNegOn')}
    if(!n.nombre)return;
    const html='<em'+(n.logo?' style="background-image:url(&quot;'+E(n.logo)+'&quot;)"':'')+'>'+(n.logo?'':E(n.nombre.trim()[0]||'').toUpperCase())+'</em><span>'+E(n.nombre)+'</span>';
    /* insignia junto a la pastilla de estado */
    const todas=[...card.querySelectorAll('.pdbSub > .pdbPay, .tkChips, .pdMList > .pdMListCode')];
    const vis=todas.find(a=>a.getClientRects().length>0);
    if(!vis)return;
    const anclas=[vis];let ya=false;
    card.querySelectorAll('.pdNegB:not(.pdUNeg)').forEach(b=>{const prev=b.previousElementSibling,par=b.parentElement;const mio=(par===vis||prev===vis)&&!ya;if(mio)ya=true;else b.remove()});
    anclas.forEach(a=>{
      const enChips=a.classList.contains('tkChips');
      let b=enChips?a.querySelector(':scope > .pdNegB'):(a.nextElementSibling&&a.nextElementSibling.classList.contains('pdNegB')?a.nextElementSibling:null);
      if(!b){b=document.createElement('span');b.className='pdNegB';if(enChips)a.prepend(b);else a.after(b)}
      if(b.dataset.k!==key){b.dataset.k=key;b.innerHTML=html}
    });
  }
  let corriendo=false;
  async function pasar(){
    if(corriendo)return;corriendo=true;
    try{
      const cards=[...document.querySelectorAll(CARDS)];if(!cards.length)return;
      await cargarNeg();
      const falta=[...new Set(cards.map(idDe).filter(i=>i&&!PED.has(i)&&!PIDIENDO.has(i)))];
      for(let i=0;i<falta.length;i+=40)await cargarPed(falta.slice(i,i+40));
      cards.forEach(c=>{const nid=PED.get(idDe(c));const n=nid&&NEG.get(nid);if(n)decorar(c,n)});
    }finally{corriendo=false}
  }
  let t=null;const pronto=()=>{clearTimeout(t);t=setTimeout(pasar,120)};
  window.__pdLogoDbg=()=>({corriendo,negListo,ped:[...PED],neg:[...NEG.keys()]});
  /* al volver a dibujarse la lista se decora en el mismo instante (sin parpadeo) con lo ya conocido */
  function rapido(){document.querySelectorAll(CARDS).forEach(c=>{const nid=PED.get(idDe(c));const n=nid&&NEG.get(nid);if(n)try{decorar(c,n)}catch(e){}})}
  let enRapido=false;
  new MutationObserver(m=>{if(enRapido)return;for(const r of m){if(r.target&&r.target.closest&&r.target.closest('.pdNegB,.pdNegBg'))continue;enRapido=true;try{rapido()}finally{enRapido=false}pronto();return}}).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(pasar,1500);setTimeout(pasar,800);
})();
