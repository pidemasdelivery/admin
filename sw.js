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
    const list=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    // Si el panel está abierto y a la vista, él ya avisa con su propio sonido: no se duplica.
    if(list.some(c=>c.visibilityState==='visible'&&c.focused)){
      list.forEach(c=>c.postMessage({type:'pd-push',data:d}));
      return;
    }
    await self.registration.showNotification(d.title||'Pidemás',{
      body:d.body||'',
      tag:d.tag||'pidemas',
      renotify:true,
      vibrate:[200,100,200],
      data:{pedidoId:d.pedidoId||null}
    });
  })());
});

self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const id=e.notification.data&&e.notification.data.pedidoId;
  e.waitUntil((async()=>{
    const list=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const c of list){c.postMessage({type:'pd-open',pedidoId:id});if('focus' in c)return c.focus();}
    if(self.clients.openWindow)return self.clients.openWindow(self.registration.scope+(id?'?pedido='+encodeURIComponent(id):''));
  })());
});

/* ===== App instalable: abre rápido y funciona sin conexión con lo último que se cargó =====
   Siempre intenta traer la versión nueva primero (así ves los cambios que subes a GitHub). */
const PD_CACHE='pidemas-panel-v1';
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('pidemas-panel-')&&k!==PD_CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin!==self.location.origin)return;
  e.respondWith((async()=>{
    try{
      const res=await fetch(r);
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
