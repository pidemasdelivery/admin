
/* Actualizaciones:
   · Normales (pd-version): la app se actualiza sola, sin preguntar, en un momento en que no estés usando una ventana ni escribiendo.
   · Que requieren reinstalar (pd-instalacion: cambia ícono, nombre o pantalla de arranque): solo entonces se muestra un aviso. */
(function(){
  if(window.__pdActualizar)return;window.__pdActualizar=1;
  /* la dirección se ve limpia: sin ?v=… (número de versión que agregan los enlaces y las recargas) */
  try{var lu=new URL(location.href);if(lu.searchParams.has('v')||lu.searchParams.has('pdv')){lu.searchParams.delete('v');lu.searchParams.delete('pdv');history.replaceState(history.state,'',lu.pathname+lu.search+lu.hash)}}catch(e){}
  var mv=document.querySelector('meta[name="pd-version"]');if(!mv)return;var V=mv.content;
  var mi=document.querySelector('meta[name="pd-instalacion"]');var I=mi?mi.content:'1';
  var ls={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  var url=location.pathname,ultimo=0,pendiente=false,toque=Date.now();
  var instalada=matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true;
  ['pointerdown','keydown','scroll','touchstart'].forEach(function(e){addEventListener(e,function(){toque=Date.now()},{passive:true,capture:true})});

  /* --- 1. actualización normal: silenciosa --- */
  function chequear(){
    if(document.hidden||Date.now()-ultimo<60000)return;ultimo=Date.now();
    fetch(url+'?pdv='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.text():''}).then(function(t){
      var m=t&&t.match(/<meta name="pd-version" content="([^"]+)"/);if(m&&m[1]!==V){pendiente=true;intentar()}
    }).catch(function(){});
  }
  function ocupado(){
    var a=document.activeElement;if(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))return true;
    var hs=document.querySelectorAll('[data-pdm-hoja],.pdnSh,.pdsmHoja,.pdPwHoja,[role=dialog],dialog[open]');
    for(var i=0;i<hs.length;i++){if(hs[i].getClientRects().length&&hs[i].id!=='pdInstalar')return true}
    try{if(window.pdEnPagina&&window.pdEnPagina())return true}catch(e){}
    return Date.now()-toque<20000;
  }
  function recargar(){var fin=function(){location.reload()};
    try{if(navigator.serviceWorker)navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){try{r.update()}catch(_){}})}).catch(function(){})}catch(_){}
    fetch(location.href,{cache:'reload'}).then(fin,fin);setTimeout(fin,3000)}
  function enPag(){try{return !!(window.pdEnPagina&&window.pdEnPagina())}catch(e){return false}}
  /* nunca recarga si hay una página abierta (detalle, sección, formulario): así no te devuelve a Pedidos */
  function intentar(){if(!pendiente||enPag())return;if(document.hidden||!ocupado())recargar()}
  setInterval(intentar,5000);
  document.addEventListener('visibilitychange',function(){if(document.hidden){if(pendiente&&!enPag())recargar()}else chequear()});
  addEventListener('focus',chequear);
  setTimeout(chequear,2500);setInterval(chequear,5*60000);

  /* --- 2. actualización que requiere reinstalar: solo esta avisa --- */
  if(instalada){
    var guardada=ls.get('pd-instalacion');
    if(!guardada){ls.set('pd-instalacion',I)}
    else if(Number(I)>Number(guardada)&&ls.get('pd-instalacion-no')!==I){setTimeout(avisoReinstalar,1500)}
  }
  addEventListener('appinstalled',function(){ls.set('pd-instalacion',I)});
  function avisoReinstalar(){
    if(document.getElementById('pdReinstalar'))return;
    var d=document.createElement('div');d.id='pdReinstalar';d.setAttribute('role','status');
    d.innerHTML='<span class="pdaIco" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg></span><span class="pdaTx"><b>Reinstala la app</b><small>Hay una mejora en el ícono o la pantalla de inicio. Borra la app y vuelve a instalarla desde el enlace de siempre.</small></span><span class="pdaBt"><button type="button" class="ok">Entendido</button></span>';
    d.querySelector('.ok').onclick=function(){ls.set('pd-instalacion-no',I);d.remove()};
    document.body.appendChild(d);
  }
  var st=document.createElement('style');st.textContent='#pdReinstalar{position:fixed;left:12px;right:12px;top:calc(10px + env(safe-area-inset-top));z-index:2147483647;display:flex;align-items:center;gap:12px;padding:12px 12px 12px 14px;border-radius:16px;background:#fff;border:1px solid #F1C9B6;box-shadow:0 10px 30px rgba(31,26,23,.16);font-family:var(--font,Inter,system-ui,sans-serif)}#pdReinstalar .pdaIco{flex:0 0 38px;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:#FFF1E8;color:#C4410C}#pdReinstalar .pdaIco svg{width:20px;height:20px}#pdReinstalar .pdaTx{flex:1;min-width:0;display:flex;flex-direction:column}#pdReinstalar b{font-weight:800;font-size:14.5px;line-height:1.25;color:#1F1A17}#pdReinstalar small{font-weight:500;font-size:12.5px;line-height:1.3;color:#6E625A}#pdReinstalar button{min-height:40px;padding:0 14px;border:0;border-radius:12px;background:#C4410C;color:#fff;font-weight:800;font-size:14px;font-family:inherit;cursor:pointer}';
  document.head.appendChild(st);
})();
