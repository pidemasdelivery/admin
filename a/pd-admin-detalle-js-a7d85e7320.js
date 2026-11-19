
/* Detalle del pedido en admin: cabecera con fases + hoja para asignar motorizado (abierta al entrar, se baja para revisar) */
(function(){
  if(window.__pdAdminDet)return;window.__pdAdminDet=true;
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ini=n=>String(n||'?').trim().split(/\s+/).map(w=>w[0]||'').slice(0,2).join('').toUpperCase();
  const pedidos=()=>{try{return allOrders}catch(e){return []}};
  function cabecera(card){
    const D=window.pdUDatos;if(!D)return;
    const id=String(card.dataset.orderId||'');const o=D.ped(id)||pedidos().find(x=>String(x.id)===id);if(!o)return;
    const hd=card.querySelector('.pdRouteBand .pdAHd');if(!hd)return;
    const f=D.fase(o),n=D.neg(o.negocio_id||o.restaurante_id);
    const steps=D.PASOS.map((p,i)=>'<span class="'+(f.n===0?'':i<f.n?'on':'')+'">'+E(p)+'</span>').join('');
    const bars=D.PASOS.map((p,i)=>'<s class="'+(f.n===0?'no':i<f.n?'on':'')+'"></s>').join('');
    const h='<div class="pdDHr1"><b>'+E(D.codigo(o,id))+'</b><span>'+E(D.hace(o.creado_en||o.created_at))+'</span></div>'
      +'<div class="pdDHamt">'+E(D.money(o.total))+'</div>'
      +'<div class="pdDHr2"><span class="pdUPill '+f.k+'"><i></i>'+E(f.txt)+'</span>'+(n&&n.nombre?'<span class="pdNegB pdUNeg"><em'+(n.logo?' style="background-image:url(&quot;'+E(n.logo)+'&quot;)"':'')+'>'+(n.logo?'':E(n.nombre[0]||''))+'</em><span>'+E(n.nombre)+'</span></span>':'')+'</div>'
      +'<div class="pdUBars">'+bars+'</div><div class="pdDHsteps">'+steps+'</div>';
    let x=hd.querySelector(':scope > .pdDH');if(!x){x=document.createElement('div');x.className='pdDH';hd.prepend(x)}
    if(x.__h!==h){x.innerHTML=h;x.__h=h}
    if(!hd.classList.contains('pdDHOn'))hd.classList.add('pdDHOn');
  }
  /* ----- hoja para asignar ----- */
  function opciones(sel){return [...sel.options].filter(op=>op.value).map(op=>{const t=(op.textContent||'').trim();const p=t.split(/\s+·\s+|\s+-\s+/);return {v:op.value,n:p[0]||t,e:p.slice(1).join(' · ')}})}
  function hoja(card){
    const pie=card.querySelector(':scope .pdPie');if(!pie)return;
    const id=String(card.dataset.orderId||'');
    const ap=pie.querySelector('.approveOrderBtn'),rj=pie.querySelector('.rejectOrderBtn'),un=pie.querySelector('.unassignBtn'),sel=pie.querySelector('select.motoSelect');
    const puedeAsignar=!!sel&&sel.options.length>1&&(!sel.disabled||!!(pie.querySelector('.approveOrderBtn')&&!pie.querySelector('.approveOrderBtn').disabled));
    const o=pedidos().find(x=>String(x.id)===id)||{};
    const asignado=!!(sel&&sel.value)||!!o.motorizado_id;
    let prim=null,sec=null;
    if(ap&&!ap.disabled)prim={t:puedeAsignar?'Aceptar y asignar':'Aceptar pedido',k:'ap'};
    else if(puedeAsignar)prim={t:asignado?'Cambiar motorizado':'Asignar motorizado',k:'as'};
    if(rj&&!rj.disabled)sec={t:'Rechazar',k:'rj'};
    else if(un&&!un.disabled&&asignado&&getComputedStyle(un).display!=='none')sec={t:'Quitar',k:'un'};
    let ds=pie.querySelector(':scope > .pdDS');
    if(!prim&&!sec){
      const nom=sel&&sel.selectedIndex>0?(sel.options[sel.selectedIndex].textContent||'').trim().split(/\s+·\s+/)[0]:'';
      if(!nom){if(ds){ds.remove();pie.classList.remove('pdDSOn');card.classList.remove('pdDSAbierta')}return}
      if(!pie.classList.contains('pdDSOn'))pie.classList.add('pdDSOn');
      const h0='<div class="pdDSpeek"><span class="pdDSav">'+E(ini(nom))+'</span><span class="pdDSn"><b>'+E(nom)+'</b><small>Motorizado asignado</small></span><span class="pdDSst">Asignado</span></div>';
      if(!ds){ds=document.createElement('div');ds.className='pdDS';pie.appendChild(ds)}
      if(ds.__h!==h0){ds.innerHTML=h0;ds.__h=h0}
      if(card.classList.contains('pdDSAbierta'))card.classList.remove('pdDSAbierta');return}
    if(!pie.classList.contains('pdDSOn'))pie.classList.add('pdDSOn');
    const ops=puedeAsignar?opciones(sel):[];
    if(card.dataset.dsSel===undefined||!ops.some(x=>x.v===card.dataset.dsSel)){
      const pre=(sel&&sel.value)||(ops.find(x=>/disponible/i.test(x.e))||ops[0]||{}).v||'';card.dataset.dsSel=pre}
    if(card.dataset.dsOpen===undefined)card.dataset.dsOpen=ops.length?'1':'0';
    const abierta=card.dataset.dsOpen==='1'&&ops.length>0;
    const elegido=ops.find(x=>x.v===card.dataset.dsSel);
    const lista=ops.map(x=>'<button type="button" class="pdDSm'+(x.v===card.dataset.dsSel?' on':'')+'" data-m="'+E(x.v)+'"><span class="pdDSav">'+E(ini(x.n))+'</span><span class="pdDSn"><b>'+E(x.n)+'</b>'+(x.e?'<small>'+E(x.e)+'</small>':'')+'</span>'+(x.e?'<span class="pdDSst'+(/disponible/i.test(x.e)?'':' o')+'">'+E(/disponible/i.test(x.e)?'Disponible':x.e.split(' ')[0])+'</span>':'')+'<span class="pdDSr"></span></button>').join('');
    const h=(ops.length?'<div class="pdDSg" data-ds="tog"><span class="pdDSgrip"></span><span class="pdDShint">'+(abierta?'↓ Desliza hacia abajo para revisar el pedido':'↑ Levanta para elegir otro motorizado')+'</span></div>':'')
      +(abierta?'<div class="pdDSt">Elige el motorizado</div><div class="pdDSl">'+lista+'</div>'
        :(elegido?'<div class="pdDSpeek" data-ds="tog"><span class="pdDSav">'+E(ini(elegido.n))+'</span><span class="pdDSn"><b>'+E(elegido.n)+'</b><small>Seleccionado'+(elegido.e?' · '+E(elegido.e):'')+'</small></span><span class="pdDSup">⌃</span></div>':''))
      +'<div class="pdDSb">'+(prim?'<button type="button" class="pdDSbtn p" data-ds="'+prim.k+'">'+E(prim.t)+'</button>':'')+(sec?'<button type="button" class="pdDSbtn r" data-ds="'+sec.k+'">'+E(sec.t)+'</button>':'')+'</div>';
    if(!ds){ds=document.createElement('div');ds.className='pdDS';pie.appendChild(ds)}
    if(ds.__h!==h){ds.innerHTML=h;ds.__h=h}
    if(card.classList.contains('pdDSAbierta')!==abierta)card.classList.toggle('pdDSAbierta',abierta);
    let dim=card.querySelector(':scope > .pdDSdim');
    if(!dim){dim=document.createElement('div');dim.className='pdDSdim';dim.addEventListener('click',()=>{card.dataset.dsOpen='0';hoja(card)});card.appendChild(dim)}
  }
  async function esperar(id,ok,ms){const t=Date.now();while(Date.now()-t<ms){const o=pedidos().find(x=>String(x.id)===String(id));if(o&&ok(o))return true;await new Promise(r=>setTimeout(r,300))}return false}
  async function accion(card,k,btn){
    const pie=card.querySelector('.pdPie');const id=String(card.dataset.orderId||'');const m=card.dataset.dsSel||'';
    const ap=pie&&pie.querySelector('.approveOrderBtn'),rj=pie&&pie.querySelector('.rejectOrderBtn'),un=pie&&pie.querySelector('.unassignBtn');
    if(k==='tog'){card.dataset.dsOpen=card.dataset.dsOpen==='1'?'0':'1';hoja(card);return}
    if(k==='rj'){rj&&rj.click();return}
    if(k==='un'){un&&un.click();return}
    if(btn){btn.disabled=true;btn.textContent='Procesando…'}
    try{
      if(k==='ap'){
        ap&&ap.click();
        if(m&&typeof assignOrder==='function'){
          const listo=await esperar(id,o=>['confirmado','aceptado','asignado'].includes(String(o.estado||'').toLowerCase()),9000);
          if(listo)await assignOrder(id,m);
        }
      }else if(k==='as'){
        if(!m){window.pdAviso&&pdAviso('Elige un motorizado.');return}
        if(typeof assignOrder==='function')await assignOrder(id,m);
      }
    }finally{setTimeout(()=>{const c=document.querySelector('.adminOrderCard[data-order-id="'+CSS.escape(id)+'"]');if(c){delete c.dataset.dsOpen;hoja(c)}},400)}
  }
  document.addEventListener('click',e=>{
    const t=e.target.closest&&e.target.closest('.pdDS [data-ds], .pdDS [data-m]');if(!t)return;
    const card=t.closest('.adminOrderCard');if(!card)return;
    e.preventDefault();e.stopPropagation();
    if(t.dataset.m!==undefined){card.dataset.dsSel=t.dataset.m;hoja(card);return}
    accion(card,t.dataset.ds,t.classList.contains('pdDSbtn')?t:null);
  },true);
  /* deslizar la hoja: abajo la baja, arriba la sube */
  let g=null;
  document.addEventListener('touchstart',e=>{const s=e.target.closest&&e.target.closest('.adminOrderCard.is-expanded .pdDS');if(!s||e.touches.length!==1)return;const l=e.target.closest('.pdDSl');if(l&&l.scrollTop>0)return;g={y:e.touches[0].clientY,card:s.closest('.adminOrderCard'),d:0}},{passive:true,capture:true});
  document.addEventListener('touchmove',e=>{if(!g)return;g.d=e.touches[0].clientY-g.y},{passive:true,capture:true});
  document.addEventListener('touchend',()=>{if(!g)return;const c=g.card,d=g.d;g=null;if(d>50&&c.dataset.dsOpen==='1'){c.dataset.dsOpen='0';hoja(c)}else if(d<-40&&c.dataset.dsOpen!=='1'){c.dataset.dsOpen='1';hoja(c)}},true);
  /* un padre con transform/filter/contain hace que el pedido abierto no ocupe la pantalla: se neutraliza mientras está abierto */
  function libre(c){
    let e=c.parentElement;const marcados=[];
    while(e&&e!==document.documentElement){const s=getComputedStyle(e);
      if(s.transform!=='none'||s.filter!=='none'||(s.backdropFilter&&s.backdropFilter!=='none')||(s.webkitBackdropFilter&&s.webkitBackdropFilter!=='none')||s.perspective!=='none'||/paint|layout|strict|content/.test(s.contain||'')||/transform|filter|perspective/.test(s.willChange||'')||(s.contentVisibility&&s.contentVisibility!=='visible')||(s.containerType&&s.containerType!=='normal'))
        {if(!e.classList.contains('pdSinCB'))e.classList.add('pdSinCB')}
      if(e.classList.contains('pdSinCB'))marcados.push(e);e=e.parentElement}
    return marcados}
  /* sin destello: la tarjeta abierta queda invisible (estilo en línea !important) hasta tener la cabecera nueva; y el modal "Pedidos" de atrás se oculta */
  function dtListo(c){if(!c.dataset.dtT)c.dataset.dtT=String(Date.now());const ok=(!!c.querySelector('.pdDH')&&!!c.querySelector('.pdpaW'))||Date.now()-(+c.dataset.dtT)>2500;
    if(ok){c.classList.add('pdDetOk');c.style.setProperty('visibility','visible','important')}else{c.classList.remove('pdDetOk');c.style.setProperty('visibility','hidden','important')}}
  function dtFondo(on){if(!on&&Date.now()<(window.__dtHold||0))return;document.querySelectorAll('#pdmModal .m-card,.m-card[data-dt-fondo]').forEach(m=>{if(on){m.setAttribute('data-dt-fondo','1');m.style.setProperty('visibility','hidden','important');m.style.setProperty('box-shadow','none','important')}else if(m.hasAttribute('data-dt-fondo')){m.removeAttribute('data-dt-fondo');m.style.removeProperty('visibility');m.style.removeProperty('box-shadow')}})}
  window.pdDtAbrir=function(){window.__dtHold=Date.now()+2500;dtFondo(true);[30,120,300,600].forEach(t=>setTimeout(()=>{if(Date.now()<(window.__dtHold||0))dtFondo(true)},t))};
  function pasar(){const abiertos=[...document.querySelectorAll('#orderList .adminOrderCard.is-expanded')];
    const keep=new Set();abiertos.forEach(c=>libre(c).forEach(x=>keep.add(x)));
    document.querySelectorAll('.pdSinCB').forEach(x=>{if(!keep.has(x))x.classList.remove('pdSinCB')});
    abiertos.forEach(c=>{try{cabecera(c);hoja(c)}catch(e){console.warn('Detalle admin:',e)}finally{dtListo(c)}});dtFondo(abiertos.length>0);
    document.querySelectorAll('#orderList .adminOrderCard:not(.is-expanded)').forEach(c=>{if(c.classList.contains('pdDetOk')||c.dataset.dtT){c.classList.remove('pdDetOk');delete c.dataset.dtT;c.style.removeProperty('visibility')}if(c.dataset.dsOpen!==undefined){delete c.dataset.dsOpen;delete c.dataset.dsSel}if(c.classList.contains('pdDSAbierta'))c.classList.remove('pdDSAbierta')})}
  let t=null,en=false;
  new MutationObserver(m=>{if(en)return;for(const r of m){const x=r.target;if(x&&x.closest&&x.closest('.pdDS,.pdDH'))continue;en=true;try{pasar()}finally{en=false}clearTimeout(t);t=setTimeout(pasar,200);return}}).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(pasar,700);
  /* al abrir el pedido se arma el diseño nuevo al instante (antes esperaba hasta 700 ms y se veía el viejo) */
  new MutationObserver(m=>{for(const r of m){const x=r.target;if(x&&x.classList&&x.classList.contains('adminOrderCard')){const ab=x.classList.contains('is-expanded'),ok=x.classList.contains('pdDetOk');if(ab&&!ok){x.style.setProperty('visibility','hidden','important');dtFondo(true)}if(ab!==ok){pasar();setTimeout(pasar,60);setTimeout(pasar,250);break}}}}).observe(document.documentElement,{attributes:true,attributeFilter:['class'],subtree:true});
})();
