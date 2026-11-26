/* Pidemás · service worker de avisos (admin, motorizado y negocio).
   Súbelo a la MISMA carpeta que el index.html del panel.
   - push: muestra el aviso que manda Supabase aunque la app esté cerrada.
   - notificationclick: al tocar el aviso abre la app en ese pedido. */
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));

self.addEventListener('push',e=>{
  let d={};
  try{d=e.data?e.data.json():{}}catch(_){d={title:'Pidemás',body:e.data?e.data.text():''}}
  e.waitUntil((async()=>{
    // Solo a las ventanas de ESTE panel: admin, motorizado y negocio comparten pidemas.pe,
    // y sin este filtro el aviso de un motorizado salía también en el Admin abierto.
    const list=(await self.clients.matchAll({type:'window',includeUncontrolled:true})).filter(c=>String(c.url||'').startsWith(self.registration.scope));
    // Siempre se muestra el aviso (también con el panel abierto) y se avisa al panel.
    list.forEach(c=>c.postMessage({type:'pd-push',data:d}));
    await self.registration.showNotification(d.title||'Pidemás',{
      body:d.body||'',
      icon:d.icon||new URL('icon-192.png',self.registration.scope).href,
      badge:new URL('badge-96.png',self.registration.scope).href,
      ...(d.image?{image:d.image}:{}),
      // botones dentro del aviso: «Aceptar» (motorizado) y «Ver»
      actions:Array.isArray(d.actions)?d.actions.slice(0,2):[],
      tag:d.tag||'pidemas',
      renotify:true,
      // se queda fijo en la pantalla (y en la de bloqueo) hasta que lo toques
      requireInteraction:d.fijo!==false,
      silent:false,
      timestamp:Date.now(),
      // vibración larga y propia de Pidemás: se distingue de WhatsApp sin mirar
      vibrate:[400,150,400,150,900],
      data:{pedidoId:d.pedidoId||null,grupo:d.grupo||''}
    });
    // número en el ícono de la app (si el teléfono lo permite)
    try{if(self.navigator.setAppBadge){const n=(await self.registration.getNotifications()).length;await self.navigator.setAppBadge(n||undefined)}}catch(_){}
    // si se juntan 3 o más pedidos nuevos, se agrupan en un solo aviso
    try{const ns=(await self.registration.getNotifications()).filter(n=>n.data&&n.data.grupo==='nuevo');
      if(ns.length>=3){const t=ns.map(n=>n.title.replace(/^(Nuevo pedido|Nuevo servicio · |Te asignaron )/,'').trim());ns.forEach(n=>n.close());
        await self.registration.showNotification(ns.length+' pedidos nuevos',{body:t.slice(0,4).join(' · ')+(t.length>4?' …':''),icon:new URL('icon-192.png',self.registration.scope).href,badge:new URL('badge-96.png',self.registration.scope).href,tag:'pd-resumen',renotify:true,requireInteraction:true,vibrate:[400,150,400,150,900],data:{pedidoId:null,grupo:'resumen'}})}}catch(_){}
  })());
});

self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const id=e.notification.data&&e.notification.data.pedidoId;
  const accion=e.action||'';
  try{if(self.navigator.clearAppBadge)self.navigator.clearAppBadge()}catch(_){}
  e.waitUntil((async()=>{
    const list=(await self.clients.matchAll({type:'window',includeUncontrolled:true})).filter(c=>String(c.url||'').startsWith(self.registration.scope));
    for(const c of list){c.postMessage({type:'pd-open',pedidoId:id,accion});if('focus' in c)return c.focus();}
    if(self.clients.openWindow)return self.clients.openWindow(self.registration.scope+(id?'?pedido='+encodeURIComponent(id)+(accion?'&accion='+encodeURIComponent(accion):''):''));
  })());
});

/* ===== App instalable: abre rápido y funciona sin conexión con lo último que se cargó =====
   Siempre intenta traer la versión nueva primero (así ves los cambios que subes a GitHub). */
const PD_CACHE='pidemas-panel-v2';
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('pidemas-panel-')&&k!==PD_CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin!==self.location.origin)return;
  /* archivos del panel con huella en el nombre (carpeta a/): no cambian nunca, se sirven guardados al instante */
  if(/\/a\/[^/]+-[0-9a-f]{10}\.(js|css|svg)$/.test(u.pathname)){
    e.respondWith(caches.open(PD_CACHE).then(async c=>{const hit=await c.match(r);if(hit)return hit;const res=await fetch(r);if(res&&res.ok)c.put(r,res.clone()).catch(()=>{});return res}));
    return;
  }
  e.respondWith((async()=>{
    try{
      /* la página siempre se pide sin caché para ver al momento lo que subes a GitHub */
      const res=await fetch(r,(r.mode==='navigate'||/\.(html|js|css)(\?|$)/.test(u.pathname+u.search))?{cache:'no-cache'}:undefined);
      if(res&&res.ok){const copia=res.clone();caches.open(PD_CACHE).then(c=>c.put(r,copia)).catch(()=>{})}
      return res;
    }catch(err){
      const hit=await caches.match(r,{ignoreSearch:r.mode==='navigate'});
      if(hit)return hit;
      if(r.mode==='navigate'){const idx=await caches.match(new URL('index.html',self.registration.scope).href);if(idx)return idx}
      return Response.error();
    }
  })());
});
