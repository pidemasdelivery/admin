
/* Tarjeta de pedido igual en admin, motorizado y negocio:
   n.º · hace cuánto · monto / estado + negocio / fase / cliente / detalle / Ver más / Seguimiento (+ acción) */
(function(){
  if(window.__pdTarjetaU)return;window.__pdTarjetaU=true;
  const ROL=document.getElementById('orderList')?'admin':document.getElementById('businessOrdersList')?'negocio':'moto';
  const CARDS='#orderList .adminOrderCard[data-order-id], #orders article.order[data-order-id], #businessOrdersList article.x-order[data-order]';
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cli=()=>{try{return db}catch(e){return window.db}};
  const money=n=>'S/ '+(Number(n)||0).toFixed(2);
  const PED=new Map(),ITEMS=new Map(),NEG=new Map();let negOk=false,ultimo=0,corriendo=false;
  const idDe=c=>String(c.dataset.orderId||c.dataset.order||'');
  const logoDe=n=>n&&(n.logo_url||n.logo||n.imagen_logo_url||n.imagen_logo)||'';
  async function cargar(ids,todo){
    const c=cli();if(!c)return;
    if(!negOk){try{const r=await c.from('negocios').select('*');if(!r.error&&r.data){r.data.forEach(n=>NEG.set(String(n.id),{nombre:n.nombre||'',logo:logoDe(n)}));negOk=true}}catch(e){}}
    const pedir=todo?ids:ids.filter(i=>!PED.has(i));
    for(let i=0;i<pedir.length;i+=40){const l=pedir.slice(i,i+40);
      try{const r=await c.from('pedidos').select('*').in('id',l);if(!r.error&&r.data)r.data.forEach(p=>PED.set(String(p.id),p))}catch(e){}
      const sin=l.filter(x=>!ITEMS.has(x));
      if(sin.length){try{const r=await c.from('detalle_pedidos').select('*').in('pedido_id',sin);if(!r.error&&r.data){sin.forEach(x=>ITEMS.set(x,[]));r.data.forEach(d=>{const k=String(d.pedido_id);(ITEMS.get(k)||ITEMS.set(k,[]).get(k)).push(d)})}}catch(e){}}
    }
  }
  /* ----- fases del seguimiento ----- */
  const PASOS=['Recibido','Preparando','Recogiendo','En camino','Entregado'];
  function fase(o){
    const s=String(o.estado||'').toLowerCase();
    if(s==='cancelado'||s==='rechazado')return {n:0,txt:s==='cancelado'?'Cancelado':'Rechazado',k:'no'};
    if(s==='entregado')return {n:5,txt:'Entregado',k:'ok'};
    if(['en_camino','camino_entrega','en_entrega','confirmando_pago'].includes(s))return {n:4,txt:s==='confirmando_pago'?'Confirmando el pago':'En camino al cliente',k:'move'};
    if(s==='camino_recojo'||o.listo_para_recojo===true)return {n:3,txt:s==='camino_recojo'?'Yendo a recoger':'Listo para recojo',k:'move'};
    if(['confirmado','aceptado','pedido_aceptado','asignado'].includes(s))return {n:2,txt:s==='asignado'?'Motorizado asignado':'Preparando el pedido',k:'prep'};
    return {n:1,txt:o.negocio_id?'Por aceptar':'Recibido',k:'new'};
  }
  function hace(d){const t=new Date(d).getTime();if(!t)return '';const m=Math.max(0,Math.round((Date.now()-t)/60000));if(m<1)return 'Ahora';if(m<60)return 'Hace '+m+' min';const h=Math.floor(m/60);if(h<24)return 'Hace '+h+' h';const dd=Math.floor(h/24);return 'Hace '+dd+' d'}
  function codigo(o,id){return '#'+String(o.codigo||id.replace(/-/g,'').slice(0,8)).toUpperCase()}
  function nombreCli(o){const n=String(o.nombre_cliente||o.cliente_nombre||o.nombre_remitente||'Cliente').trim();if(ROL!=='negocio')return n;const p=n.split(/\s+/);return p.length>1?p[0]+' '+p[1][0]+'.':n}
  function datoCli(o){
    if(ROL==='admin')return o.telefono_cliente||o.cliente_telefono||'';
    if(ROL==='moto'){const d=String(o.direccion_entrega||o.distrito||'').split(',')[0];return d.slice(0,28)}
    return /recojo|recoger|tienda/i.test(String(o.tipo_entrega||''))?'Recojo en tienda':'Delivery';
  }
  function detalle(o,id){
    const it=ITEMS.get(id)||[];
    if(it.length)return it.map(d=>'<b>'+E(Number(d.cantidad)||1)+'×</b> '+E(d.nombre_producto||d.producto_nombre||d.nombre||'Producto')).join(' · ');
    const t=o.descripcion||o.detalle||o.descripcion_paquete||o.notas||'';
    return t?E(t):'<span class="pdUMut">Sin detalle de productos</span>';
  }
  function sigue(o,f){
    if(f.n===0||f.n===5)return '';
    if(ROL==='moto'){const m=String(o.metodo_pago||'').toLowerCase();if(m==='efectivo'&&o.pago_confirmado!==true)return 'Cobrar '+money(o.total)}
    if(ROL==='admin'&&f.n===1&&o.negocio_id)return 'Sigue: que el negocio acepte';
    if(ROL==='admin'&&f.n<=2&&!o.motorizado_id)return 'Sigue: asignar motorizado';
    if(ROL==='negocio'&&f.n===1)return 'Sigue: aceptar pedido';
    return 'Sigue: '+PASOS[f.n].toLowerCase();
  }
  /* limpia restos de datos internos (descartables en JSON) que se cuelan en notas */
  const RX=/__PIDEMAS_[A-Z0-9_]+__|[\[{]\s*"(?:n|p|items|cubiertos|cubiertos_precio)"/;
  function limpiarNotas(){
    document.querySelectorAll('#pidemasOrderFullModal, #pdoModal, #orderList, #orders, #businessOrdersList').forEach(root=>{
      const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>RX.test(n.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP});
      const ns=[];while(w.nextNode())ns.push(w.currentNode);
      ns.forEach(n=>{const p=n.parentElement;if(!p||p.closest('script,style'))return;
        const v=n.nodeValue.replace(/__PIDEMAS_[A-Z0-9_]+__/g,'').replace(/[\[{]\s*"[\s\S]*[}\]]/g,'').replace(/^[\s|·,]+|[\s|·,]+$/g,'');
        if(v.trim()){n.nodeValue=v;return}
        n.nodeValue='';
        const blk=p.closest('.pdMBlock,.pdoCard,.pdRouteBlock,.pdNtFree');
        if(blk&&!(blk.textContent||'').replace(/notas del pedido|observaciones|notas|indicaci[oó]n del cliente/ig,'').trim())blk.style.display='none';
        else if(!(p.textContent||'').trim())p.style.display='none';
      });
    });
  }
  setInterval(limpiarNotas,800);
  window.pdUDatos={ped:id=>PED.get(String(id)),neg:id=>NEG.get(String(id)),fase,PASOS,money,hace,codigo,cargar:ids=>cargar(ids.map(String),true)};
  /* ----- dónde va y qué se esconde ----- */
  function host(card){
    if(ROL==='admin')return card.querySelector(':scope > button.pdList > .pdbBody');
    if(ROL==='moto')return card.querySelector(':scope > .pdMList');
    return card.querySelector(':scope > .pdbBody');
  }
  function accion(card){
    if(ROL==='admin'){const a=card.querySelector('.pdbBody [data-acc="aprobar"]');return a?{t:(a.textContent||'').trim()||'Aceptar pedido',el:a}:null}
    if(ROL==='negocio'){const a=card.querySelector(':scope > .pdbBody .pdbBtns .pdbMain');return a?{t:(a.textContent||'').trim(),el:a}:null}
    return null;
  }
  function abierto(card){
    if(ROL==='admin')return false;
    if(ROL==='moto'){const d=card.querySelector('.orderDetails');return !!d&&!d.classList.contains('hidden')}
    return false;
  }
  function pintar(card){
    const id=idDe(card),o=PED.get(id);if(!o)return;
    const h=host(card);if(!h)return;
    const f=fase(o),n=NEG.get(String(o.negocio_id||o.restaurante_id||''));
    const ac=accion(card),ab=abierto(card);
    const bars=PASOS.map((_,i)=>'<s class="'+(f.n===0?'no':i<f.n?'on':'')+'"></s>').join('');
    const sg=sigue(o,f);
    const top='<div class="pdUR1"><b>'+E(codigo(o,id))+'</b><span>'+E(hace(o.creado_en||o.created_at))+'</span><i>'+E(money(o.total))+'</i></div>'
      +'<div class="pdUR2"><span class="pdUPill '+f.k+'"><i></i>'+E(f.txt)+'</span>'
      +(n&&n.nombre?'<span class="pdNegB pdUNeg"><em'+(n.logo?' style="background-image:url(&quot;'+E(n.logo)+'&quot;)"':'')+'>'+(n.logo?'':E((n.nombre.trim()[0]||'').toUpperCase()))+'</em><span>'+E(n.nombre)+'</span></span>':'')+'</div>'
      +'<div class="pdUBars">'+bars+'</div>'
      +'<div class="pdUFase"><span>'+(f.n?'Paso '+f.n+' de 5 · '+E(PASOS[f.n-1]):E(f.txt))+'</span><span>'+E(sg)+'</span></div>'
      +'<div class="pdUCli"><strong>'+E(nombreCli(o))+'</strong>'+(datoCli(o)?'<small>· '+E(datoCli(o))+'</small>':'')+'</div>'
      +'<div class="pdUDet">'+detalle(o,id)+'</div>'
      +'<button type="button" class="pdUMas" data-u="mas">'+(ab?'Ver menos ▴':'Ver más ▾')+'</button>';
    const act='<button type="button" class="pdUBtn" data-u="seg">Seguimiento</button>'+(ac&&ac.t?'<button type="button" class="pdUBtn pri" data-u="acc">'+E(ac.t)+'</button>':'');
    let u=h.querySelector(':scope > .pdU');if(!u){u=document.createElement('div');u.className='pdU';h.prepend(u)}
    if(u.__h!==top){u.innerHTML=top;u.__h=top}
    let a=h.querySelector(':scope > .pdUAct');if(!a){a=document.createElement('div');a.className='pdUAct';h.append(a)}else if(a!==h.lastElementChild)h.append(a);
    if(a.__h!==act){a.innerHTML=act;a.__h=act}
    if(!h.classList.contains('pdUHost'))h.classList.add('pdUHost');
    if(!card.classList.contains('pdUCard'))card.classList.add('pdUCard');
  }
  /* ----- botones ----- */
  document.addEventListener('click',e=>{
    const b=e.target.closest&&e.target.closest('.pdU [data-u], .pdUAct [data-u]');if(!b)return;
    const card=b.closest(CARDS.split(',').map(s=>s.trim().replace(/^#\S+\s+/,'')).join(','));if(!card)return;
    const id=idDe(card),k=b.dataset.u;
    if(k==='mas'){
      if(ROL==='moto')return; /* el toque llega a la tarjeta y abre el detalle */
      e.preventDefault();e.stopPropagation();
      if(ROL==='admin'){const t=card.querySelector('.pdbBody [data-acc="tog"]');if(t&&t.getAttribute('aria-expanded')==='true')t.click();const bt=card.querySelector(':scope > button.pdList');if(bt)bt.click()}
      else{const d=card.querySelector(':scope > .pdbBody .pdbDet');if(d)d.click();else if(window.pdbOpen)window.pdbOpen(id)}
      return}
    e.preventDefault();e.stopPropagation();
    if(k==='seg'){if(window.pdSeguimiento&&window.pdSeguimiento.abrir)window.pdSeguimiento.abrir(id);return}
    if(k==='acc'){const ac=accion(card);ac&&ac.el&&ac.el.click()}
  },true);
  /* ----- ciclo ----- */
  function rapido(){document.querySelectorAll(CARDS).forEach(c=>{try{pintar(c)}catch(e){}})}
  async function pasar(){
    if(corriendo)return;corriendo=true;
    try{const ids=[...document.querySelectorAll(CARDS)].map(idDe).filter(Boolean);if(!ids.length)return;
      const todo=Date.now()-ultimo>8000;if(todo)ultimo=Date.now();
      await cargar([...new Set(ids)],todo);rapido();
    }finally{corriendo=false}
  }
  let t=null,en=false;
  new MutationObserver(m=>{if(en)return;for(const r of m){const x=r.target;if(x&&x.closest&&x.closest('.pdU,.pdUAct,.pdNegB'))continue;en=true;try{rapido()}finally{en=false}clearTimeout(t);t=setTimeout(pasar,150);return}}).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(pasar,2000);setTimeout(pasar,700);
})();
