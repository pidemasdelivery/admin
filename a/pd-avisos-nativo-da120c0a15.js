/* ===== Pidemás · avisos como app nativa =====
   1) Botones del aviso: «Aceptar» (motorizado) y «Ver» abren o aceptan el pedido.
   2) Número en el ícono de la app con lo que está por atender.
   3) Motorizado: la pantalla no se apaga mientras tiene un pedido en curso. */
(function(){
  if(window.__pdAvisosNativo)return;window.__pdAvisosNativo=1;
  const P=location.pathname;
  const ROL=/\/admin/.test(P)?'admin':/\/motorizado/.test(P)?'moto':'negocio';
  const lista=()=>{try{if(ROL==='admin')return Array.isArray(allOrders)?allOrders:[]}catch(_){}
    try{if(ROL==='moto')return Array.isArray(orders)?orders:[]}catch(_){}
    try{if(ROL==='negocio')return Array.isArray(businessOrders)?businessOrders:[]}catch(_){}
    return window.allOrders||window.orders||[]};
  const esperar=async(id,ms)=>{const t0=Date.now();while(Date.now()-t0<ms){if(lista().some(o=>String(o.id)===String(id)))return true;await new Promise(r=>setTimeout(r,400))}return false};
  async function abrir(id,accion){
    if(!id)return;
    if(ROL==='moto'&&accion==='aceptar'&&typeof window.acceptOrder==='function'){
      await esperar(id,10000);
      const o=lista().find(x=>String(x.id)===String(id));
      if(o&&o.estado==='asignado'){try{await window.acceptOrder(id);window.pdAviso&&window.pdAviso('Pedido aceptado ✓')}catch(_){}}}
    if(ROL==='admin'&&typeof window.pdAbrirPasosAdmin==='function'){await esperar(id,8000);try{window.pdAbrirPasosAdmin(id)}catch(_){}}
  }
  try{navigator.serviceWorker&&navigator.serviceWorker.addEventListener('message',e=>{const d=e.data||{};if(d.type==='pd-open'&&d.pedidoId)setTimeout(()=>abrir(d.pedidoId,d.accion),300)})}catch(_){}
  try{const q=new URLSearchParams(location.search);if(q.get('pedido'))setTimeout(()=>abrir(q.get('pedido'),q.get('accion')),1500)}catch(_){}

  /* número en el ícono */
  const porAtender=()=>{const L=lista();
    if(ROL==='admin')return L.filter(o=>['pendiente','asignado'].includes(String(o.estado||''))||String(o.pago_despues_estado||'')==='pendiente').length;
    if(ROL==='moto')return L.filter(o=>String(o.estado||'')==='asignado').length;
    return L.filter(o=>String(o.estado||'')==='pendiente').length};
  let ultimo=-1;
  setInterval(()=>{try{if(!navigator.setAppBadge)return;const n=porAtender();if(n===ultimo)return;ultimo=n;n>0?navigator.setAppBadge(n):navigator.clearAppBadge()}catch(_){}},5000);

  /* motorizado: pantalla encendida mientras reparte */
  if(ROL==='moto'&&'wakeLock' in navigator){
    let lock=null;const EN=['aceptado','recogido','listo','en_camino','en_entrega','confirmando_pago','camino_entrega'];
    const activo=()=>lista().some(o=>EN.includes(String(o.estado||'')));
    const ajustar=async()=>{try{
      if(document.visibilityState==='visible'&&activo()){if(!lock){lock=await navigator.wakeLock.request('screen');lock.addEventListener('release',()=>{lock=null})}}
      else if(lock){await lock.release();lock=null}}catch(_){lock=null}};
    document.addEventListener('visibilitychange',ajustar);setInterval(ajustar,15000);setTimeout(ajustar,4000);
  }
})();
