/* ===== Pidemás · Admin: ubicación en vivo del motorizado dentro del pedido =====
   En los pasos «Recoger» y «Entrega y cobro» se muestra un mapa con el motorizado, el recojo y el cliente,
   la distancia, hace cuánto llegó la última ubicación y el tiempo estimado. «Ver en grande» lo abre a pantalla
   completa con el recorrido de los últimos 30 minutos. Si no llega ubicación en 5 min se muestra «Sin señal».
   Uso (desde pd-pasos-admin): pdMapaPedido.slot() devuelve el hueco del mapa (HTML fijo, no provoca repintados)
   y pdMapaPedido.montar(root, datos) lo llena después de cada pintado. */
(function(){
  if(window.pdMapaPedido)return;
  const O='#C4410C',G='#15803D',T='#1F1A17',M='#6B5E55',B='#F1E4DA';
  const SIN_SENAL_MS=5*60*1000,CADA_MS=10000,VEL_KMH=20;
  const D=()=>{try{return db}catch(e){return window.db||window.sb}};
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>{const n=Number(v);return Number.isFinite(n)&&n!==0?n:null};
  const pt=(la,lo)=>{la=num(la);lo=num(lo);return la!=null&&lo!=null&&Math.abs(la)<=90&&Math.abs(lo)<=180?{lat:la,lng:lo}:null};
  function kmEntre(a,b){if(!a||!b)return null;const R=6371,t=x=>x*Math.PI/180;const dLa=t(b.lat-a.lat),dLo=t(b.lng-a.lng);
    const h=Math.sin(dLa/2)**2+Math.cos(t(a.lat))*Math.cos(t(b.lat))*Math.sin(dLo/2)**2;return 2*R*Math.atan2(Math.sqrt(h),Math.sqrt(1-h))}
  const fDist=k=>k==null?'':k<1?Math.max(10,Math.round(k*1000/10)*10)+' m':k.toFixed(1)+' km';
  const fHace=ms=>{const s=Math.max(0,Math.round(ms/1000));if(s<60)return 'hace '+s+' s';const m=Math.round(s/60);if(m<60)return 'hace '+m+' min';const h=Math.floor(m/60);return 'hace '+h+' h'+(m%60?' '+(m%60)+' min':'')};
  const fHora=d=>{try{return new Date(d).toLocaleTimeString('es-PE',{hour:'numeric',minute:'2-digit',timeZone:'America/Lima'}).replace(/\s/g,' ')}catch(_){return ''}};
  const svg=(d,s,c,w)=>`<svg viewBox="0 0 24 24" width="${s||20}" height="${s||20}" fill="none" stroke="${c||'currentColor'}" stroke-width="${w||2.2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const IC={
    exp:svg('<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>'),
    maps:svg('<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>'),
    x:svg('<path d="M6 6l12 12M18 6L6 18"/>',24),
    tgt:svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',22),
    tel:svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>'),
    moto:svg('<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M9 17h6l-3-7H8M15 10h3l2 4"/>',20,'#FFFFFF',2.4)
  };

  /* ---------- Estilos (dentro de la pantalla del pedido, que está aislada) ---------- */
  let leafletCss=null,cssPromesa=null;
  function cargarLeafletCss(){
    if(leafletCss!=null)return Promise.resolve(leafletCss);
    if(cssPromesa)return cssPromesa;
    try{for(const sh of document.styleSheets){if(sh.href&&/leaflet(\.min)?\.css/.test(sh.href)){const t=[...sh.cssRules].map(r=>r.cssText).join('\n');if(t){leafletCss=t;return Promise.resolve(t)}}}}catch(_){}
    cssPromesa=fetch('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css').then(r=>r.ok?r.text():'').catch(()=>'').then(t=>{leafletCss=t||'';return leafletCss});
    return cssPromesa;
  }
  const CSS=`
.pmW{display:flex;flex-direction:column;gap:12px}
.pmMapBox{position:relative;height:230px;border-radius:18px;overflow:hidden;border:1px solid ${B};background:#ECEFE6}
.pmMap{position:absolute!important;inset:0;width:100%;height:100%;z-index:0}
.pmW.gris .pmMap{filter:grayscale(.85)}
.pmChip{position:absolute;left:10px;top:10px;z-index:500;display:flex;align-items:center;gap:6px;background:#FFFFFF;border:1px solid ${B};border-radius:999px;padding:6px 11px;font-size:13px;font-weight:800;color:${G}}
.pmChip i{width:8px;height:8px;border-radius:50%;background:#22C55E;display:block}
.pmW.gris .pmChip{color:${M}}.pmW.gris .pmChip i{background:#A8A29E}
.pmBtnI{position:absolute;right:10px;top:10px;z-index:500;width:44px;height:44px;border-radius:12px;border:1px solid ${B};background:#FFFFFF;color:${T};display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer}
.pmCentrar{top:auto;bottom:10px}
.pmCerrar{display:none;left:10px;right:auto}
.pmInfo{display:flex;align-items:center;gap:12px}
.pmTx{flex:1 1 0%;min-width:0}.pmTx b{display:block;font-size:17px;font-weight:800;color:${T}}.pmTx span{display:block;font-size:14px;color:${M};margin-top:2px}
.pmEta{flex:0 0 auto;background:#E7F5EC;color:${G};font-weight:800;font-size:15px;padding:8px 12px;border-radius:12px}
.pmW.gris .pmEta{background:#F1EDEA;color:${M}}
.pmEta:empty{display:none}
.pmAviso{background:#FFF7ED;border:1px solid #FED7AA;border-radius:14px;padding:12px 14px;font-size:15px;line-height:1.45;color:#7C2D12}
.pmAviso[hidden]{display:none}
.pmBtns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.pmBtns button,.pmBtns a{height:46px;border-radius:14px;border:1px solid ${B};background:#FFFFFF;color:${T};font:800 15px PdInter,Inter,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;cursor:pointer}
.pmLey{display:none;gap:14px;font-size:13px;color:${M};flex-wrap:wrap}
.pmLey span{display:flex;align-items:center;gap:6px}
.pmSep{height:1px;background:${B}}
/* pantalla completa */
.pmW.full{position:fixed;inset:0;z-index:2147483600;background:#FFFFFF;gap:0;display:block}
.pmW.full .pmMapBox{position:absolute;inset:0;height:auto;border-radius:0;border:0}
.pmW.full .pmCerrar{display:flex}
.pmW.full .pmChip{left:64px;top:calc(env(safe-area-inset-top,0px) + 16px);padding:9px 13px}
.pmW.full .pmCerrar{top:calc(env(safe-area-inset-top,0px) + 12px);width:48px;height:48px;border-radius:16px;box-shadow:0 2px 8px rgba(31,26,23,.12)}
.pmW.full .pmExp{display:none}
.pmW.full .pmCentrar{bottom:auto;top:calc(env(safe-area-inset-top,0px) + 12px);right:12px;width:48px;height:48px;border-radius:16px}
.pmW.full .pmPanel{position:absolute;left:0;right:0;bottom:0;z-index:600;background:#FFFFFF;border-radius:24px 24px 0 0;padding:14px 18px calc(env(safe-area-inset-bottom,0px) + 18px);box-shadow:0 -6px 20px rgba(31,26,23,.12);display:flex;flex-direction:column;gap:12px}
.pmW.full .pmLey{display:flex}
.pmW.full .pmSep{display:none}
.pmPanel{display:flex;flex-direction:column;gap:12px}
/* marcadores */
.pmPin{display:flex;flex-direction:column;align-items:center}
.pmPin .g{width:34px;height:34px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);border:3px solid #FFFFFF;box-shadow:0 2px 6px rgba(31,26,23,.25);display:flex;align-items:center;justify-content:center}
.pmPin .g b{transform:rotate(45deg);color:#FFFFFF;font:800 14px PdInter,Inter,system-ui,sans-serif}
.pmPin .l{margin-top:4px;background:#FFFFFF;border-radius:8px;padding:2px 7px;font:700 12px PdInter,Inter,system-ui,sans-serif;color:${T};box-shadow:0 1px 3px rgba(31,26,23,.18);white-space:nowrap}
.pmPin.tenue{opacity:.5}
.pmMoto{width:44px;height:44px;border-radius:50%;background:${O};border:3px solid #FFFFFF;box-shadow:0 0 0 8px rgba(196,65,12,.18),0 2px 8px rgba(31,26,23,.3);display:flex;align-items:center;justify-content:center}
.pmW.gris .pmMoto{background:#A8A29E;box-shadow:0 2px 8px rgba(31,26,23,.3)}
.pmDivIcon{background:transparent;border:0}
`;
  function ponerEstilos(root){
    if(!root.querySelector('style[data-pmapa]')){const st=document.createElement('style');st.setAttribute('data-pmapa','');st.textContent=CSS;root.appendChild(st)}
    if(!root.querySelector('style[data-leaflet]')){
      const st=document.createElement('style');st.setAttribute('data-leaflet','');root.appendChild(st);
      cargarLeafletCss().then(t=>{st.textContent=t;Object.values(VIVOS).forEach(v=>{try{v.map&&v.map.invalidateSize()}catch(_){}})});
    }
  }

  /* ---------- Un mapa vivo por pedido y fase ---------- */
  const VIVOS={};
  function slot(){return '<div data-pdmapa="1" style="min-height:330px"></div>'}

  function montar(root,d){
    const hueco=root&&root.querySelector('[data-pdmapa]');if(!hueco)return;
    ponerEstilos(root);
    const k=d.pedidoId+'|'+d.fase;
    Object.keys(VIVOS).forEach(x=>{if(x!==k)apagar(x)});
    let v=VIVOS[k];
    if(!v){v=VIVOS[k]=crear(d)}else{v.d=d}
    /* si está a pantalla completa, el hueco nuevo queda guardado para devolverlo ahí al cerrar */
    if(v.full){v.ph=hueco;hueco.style.display='none';root.appendChild(v.el)}else hueco.replaceWith(v.el);
    if(v.nuevo){v.nuevo=false;iniciarMapa(v);tick(v)}
    if(v.map)setTimeout(()=>{try{v.map.invalidateSize()}catch(_){}},30);
    pintar(v);
  }

  function crear(d){
    const el=document.createElement('div');el.className='pmW';
    el.innerHTML=`<div class="pmMapBox"><div class="pmMap"></div>
      <span class="pmChip"><i></i><span class="pmChipTx">En vivo</span></span>
      <button type="button" class="pmBtnI pmCerrar" aria-label="Cerrar mapa">${IC.x}</button>
      <button type="button" class="pmBtnI pmExp" aria-label="Ver mapa en grande">${IC.exp}</button>
      <button type="button" class="pmBtnI pmCentrar" aria-label="Centrar en el motorizado">${IC.tgt}</button></div>
      <div class="pmPanel">
        <div class="pmInfo"><div class="pmTx"><b class="pmL1">Buscando la ubicación…</b><span class="pmL2"></span></div><span class="pmEta"></span></div>
        <div class="pmAviso" hidden></div>
        <div class="pmLey"><span><i style="width:18px;height:4px;border-radius:99px;background:${O};opacity:.55;display:block"></i>Recorrido (30 min)</span><span><i style="width:18px;border-top:3px dotted ${O};display:block"></i>Falta por recorrer</span></div>
        <div class="pmBtns"><button type="button" class="pmBig">${IC.exp}Ver en grande</button><a class="pmGm" href="#" target="_blank" rel="noopener">${IC.maps}Google Maps</a></div>
      </div>
      <div class="pmSep"></div>`;
    const v={d,el,map:null,mk:{},linea:null,trail:null,pos:null,ts:null,primera:true,full:false,fuera:0,timer:null,trailEn:0};
    const ir=sel=>el.querySelector(sel);
    const grande=on=>{if(on===v.full)return;v.full=on;
      /* a pantalla completa se saca de la lista para que nada la recorte; al cerrar vuelve a su lugar */
      if(on){const r=el.getRootNode();v.ph=document.createComment('pdmapa');el.before(v.ph);(r&&r.appendChild?r:document.body).appendChild(el)}
      else if(v.ph&&v.ph.isConnected){if(v.ph.style)v.ph.style.display='';v.ph.replaceWith(el);v.ph=null}
      el.classList.toggle('full',on);
      if(on)cargarTrail(v,true);
      setTimeout(()=>{try{v.map&&v.map.invalidateSize();ajustar(v,true)}catch(_){}},60)};
    v.grande=grande;
    ir('.pmBig').onclick=()=>grande(true);ir('.pmExp').onclick=()=>grande(true);
    ir('.pmCerrar').onclick=()=>grande(false);
    ir('.pmCentrar').onclick=()=>{if(v.map&&v.pos)v.map.setView([v.pos.lat,v.pos.lng],Math.max(v.map.getZoom(),16))};
    if(!window.L){ir('.pmMapBox').style.display='none'}
    v.timer=setInterval(()=>tick(v),CADA_MS);
    v.reloj=setInterval(()=>{if(!v.el.isConnected)return;pintar(v)},5000);
    v.nuevo=true;
    return v;
  }

  /* El mapa se crea ya puesto en la pantalla (si se crea fuera, Leaflet lo deja con alto 0 y no se ve) */
  function iniciarMapa(v){
    if(v.map||!window.L)return;
    try{
      const map=v.map=L.map(v.el.querySelector('.pmMap'),{zoomControl:false,attributionControl:true});
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
      map.setView([-5.1945,-80.6328],14);
      setTimeout(()=>{try{map.invalidateSize();ajustar(v,true)}catch(_){}},120);
    }catch(e){v.map=null;v.el.querySelector('.pmMapBox').style.display='none'}
  }
  function apagar(k){const v=VIVOS[k];if(!v)return;clearInterval(v.timer);clearInterval(v.reloj);try{v.map&&v.map.remove()}catch(_){}delete VIVOS[k]}

  async function tick(v){
    if(!v.el.isConnected){if(++v.fuera>=2){apagar(v.d.pedidoId+'|'+v.d.fase)}return}
    v.fuera=0;
    try{
      const {data}=await D().from('motorizados').select('latitud,longitud,ultima_ubicacion').eq('id',v.d.motoId).maybeSingle();
      if(data){v.pos=pt(data.latitud,data.longitud);v.ts=data.ultima_ubicacion?new Date(data.ultima_ubicacion).getTime():null}
    }catch(_){}
    if(v.full||Date.now()-v.trailEn>60000)cargarTrail(v);
    pintar(v);
  }

  async function cargarTrail(v,forzar){
    if(!v.map)return;if(!forzar&&Date.now()-v.trailEn<25000)return;v.trailEn=Date.now();
    try{
      const desde=new Date(Date.now()-30*60*1000).toISOString();
      const {data}=await D().from('ubicaciones_motorizados').select('latitud,longitud,creado_en').eq('motorizado_id',v.d.motoId).gte('creado_en',desde).order('creado_en',{ascending:true}).limit(400);
      const pts=(data||[]).map(x=>pt(x.latitud,x.longitud)).filter(Boolean).map(p=>[p.lat,p.lng]);
      if(v.trail){v.trail.setLatLngs(pts)}else if(pts.length>1){v.trail=L.polyline(pts,{color:O,weight:5,opacity:.45,lineJoin:'round'}).addTo(v.map)}
    }catch(_){}
  }

  function icono(html,w,h,ax,ay){return L.divIcon({className:'pmDivIcon',html,iconSize:[w,h],iconAnchor:[ax,ay]})}

  function ajustar(v,forzar){
    if(!v.map)return;const d=v.d,obj=d.fase==='recojo'?d.rec:d.ent;
    const pts=[v.pos,obj].filter(Boolean);
    if(!pts.length){const o=d.rec||d.ent;if(o)v.map.setView([o.lat,o.lng],15);return}
    if(pts.length===1){v.map.setView([pts[0].lat,pts[0].lng],16);return}
    v.map.fitBounds(L.latLngBounds(pts.map(p=>[p.lat,p.lng])),{padding:v.full?[90,60]:[46,46],maxZoom:17});
  }

  function pintar(v){
    const d=v.d,el=v.el,ir=s=>el.querySelector(s);
    const obj=d.fase==='recojo'?d.rec:d.ent,dondeTx=d.fase==='recojo'?(d.recTx||'del recojo'):(d.entTx||'del cliente');
    const link=d.fase==='recojo'?d.recLink:d.entLink,soloLink=!obj&&!!link;
    const edad=v.ts?Date.now()-v.ts:null;
    const sinSenal=!v.pos||edad==null||edad>SIN_SENAL_MS;
    el.classList.toggle('gris',sinSenal);
    ir('.pmChipTx').textContent=sinSenal?'Sin señal':'En vivo';
    const k=kmEntre(v.pos,obj),nom=d.motoNombre||'El motorizado';
    let l1,l2,eta='',aviso='';
    if(!v.pos){l1='Aún no llega la ubicación';l2=nom+' todavía no compartió su ubicación';aviso='Se mostrará apenas '+nom+' abra su app con el GPS encendido.'}
    else if(sinSenal){l1='Sin señal desde las '+fHora(v.ts);l2=fHace(edad).replace(/^h/,'H')+(k!=null?' · estaba a '+fDist(k)+' '+dondeTx:'');eta='—';aviso='La app de '+nom+' está cerrada o sin internet. Se muestra su última ubicación conocida.'}
    else{l1=k!=null?'A '+fDist(k)+' '+dondeTx:'Ubicación en vivo';l2='Actualizado '+fHace(edad);if(k!=null)eta='~'+Math.max(1,Math.round(k*1.3/VEL_KMH*60))+' min'}
    if(v.pos&&!obj)aviso=(aviso?aviso+' ':'')+(soloLink?(d.fase==='recojo'?(d.recQuien||'El recojo'):(d.entQuien||'El cliente'))+' mandó su ubicación solo como enlace, por eso no sale en el mapa ni se calcula la distancia. «Google Maps» abre ese enlace.':'Este pedido no tiene el punto '+(d.fase==='recojo'?'de recojo':'de entrega')+' en el mapa.');
    ir('.pmL1').textContent=l1;ir('.pmL2').textContent=l2;ir('.pmEta').textContent=eta;
    const av=ir('.pmAviso');av.textContent=aviso;av.hidden=!aviso;
    const gm=ir('.pmGm');
    /* solo el punto, sin ruta trazada */
    if(obj)gm.href='https://www.google.com/maps/search/?api=1&query='+obj.lat+','+obj.lng;
    else if(soloLink)gm.href=link;
    else if(v.pos)gm.href='https://www.google.com/maps/search/?api=1&query='+v.pos.lat+','+v.pos.lng;
    else if(obj)gm.href='https://www.google.com/maps/search/?api=1&query='+obj.lat+','+obj.lng;
    if(!v.map)return;
    const pin=(letra,color,label,tenue)=>icono(`<div class="pmPin${tenue?' tenue':''}"><span class="g" style="background:${color}"><b>${letra}</b></span><span class="l">${E(label)}</span></div>`,70,62,35,40);
    const pone=(key,p,ic,z)=>{if(!p){if(v.mk[key]){v.mk[key].remove();delete v.mk[key]}return}
      if(v.mk[key]){v.mk[key].setLatLng([p.lat,p.lng]);v.mk[key].setIcon(ic)}else v.mk[key]=L.marker([p.lat,p.lng],{icon:ic,zIndexOffset:z||0,keyboard:false}).addTo(v.map)};
    pone('rec',d.rec,pin('R','#1F1A17',d.recPin||'Recojo',d.fase!=='recojo'),100);
    pone('ent',d.ent,pin('E',G,d.entPin||'Cliente',d.fase!=='entrega'),100);
    pone('moto',v.pos,icono(`<div class="pmMoto" title="${E(nom)}">${IC.moto}</div>`,44,44,22,22),1000);
    const lin=v.pos&&obj?[[v.pos.lat,v.pos.lng],[obj.lat,obj.lng]]:null;
    if(lin){if(v.linea)v.linea.setLatLngs(lin);else v.linea=L.polyline(lin,{color:O,weight:4,dashArray:'2 9',lineCap:'round',opacity:.9}).addTo(v.map)}
    else if(v.linea){v.linea.remove();v.linea=null}
    if(v.primera&&(v.pos||obj)){v.primera=false;ajustar(v,true)}
  }

  /* saca coordenadas de un enlace largo de Google Maps (…/@-5.18,-80.63… o ?q=-5.18,-80.63); los enlaces cortos no las traen */
  function ptDeLink(u){u=String(u||'');let m=u.match(/@(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/)||u.match(/[?&](?:q|query|ll|destination|daddr)=(-?\d{1,2}\.\d+)(?:,|%2C)\s*(-?\d{1,3}\.\d+)/i)||u.match(/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/)||u.match(/^\s*(-?\d{1,2}\.\d{3,}),\s*(-?\d{1,3}\.\d{3,})\s*$/);return m?pt(m[1],m[2]):null}
  const linkDe=u=>{const m=String(u||'').match(/https?:\/\/\S+/);return m?m[0]:''};
  window.pdMapaPedido={slot,montar,puntos:{pt,ptDeLink,linkDe}};
})();
