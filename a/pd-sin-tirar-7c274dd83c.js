/* Pidemás: sin "tirar para actualizar" y sin zoom con dos dedos / doble toque.
   El scroll normal de las listas sigue funcionando. */
(function(){
  if(window.__pdSinTirar)return;window.__pdSinTirar=1;
  var css='html,body{overscroll-behavior:none!important;overscroll-behavior-y:none!important}';
  var st=document.createElement('style');st.id='pdSinTirar';st.textContent=css;
  (document.head||document.documentElement).appendChild(st);
  /* que siempre quede de último, por encima de cualquier otro estilo */
  function alFinal(){try{document.head.appendChild(st)}catch(_){}}
  window.addEventListener('load',function(){alFinal();setTimeout(alFinal,1500)});

  var y0=0,x0=0,ruta=null;
  function puedeSubir(el){
    /* ¿hay algún contenedor en la ruta del dedo que todavía pueda desplazarse hacia arriba? */
    for(var i=0;i<ruta.length;i++){var n=ruta[i];if(!n||n.nodeType!==1)continue;
      if(n.scrollTop>0){var s=getComputedStyle(n).overflowY;if(s==='auto'||s==='scroll'||n===document.scrollingElement)return true}}
    var se=document.scrollingElement||document.documentElement;return se.scrollTop>0;
  }
  function libre(){
    for(var i=0;i<ruta.length;i++){var n=ruta[i];if(!n||n.nodeType!==1)continue;
      var c=n.classList;if(c&&(c.contains('leaflet-container')||c.contains('maplibregl-canvas-container')||c.contains('gm-style')))return true;
      if(n.tagName==='INPUT'&&n.type==='range')return true;
      if(n.tagName==='TEXTAREA'&&n.scrollHeight>n.clientHeight)return true}
    return false;
  }
  document.addEventListener('touchstart',function(e){
    try{ruta=e.composedPath()}catch(_){ruta=[e.target]}
    if(e.touches.length!==1)return;
    y0=e.touches[0].clientY;x0=e.touches[0].clientX;
  },{passive:true,capture:true});
  document.addEventListener('touchmove',function(e){
    if(e.touches.length>1){if(e.cancelable&&!(ruta&&libre()))e.preventDefault();return} /* sin zoom con dos dedos (salvo en mapas) */
    if(!ruta||!e.cancelable)return;
    var dy=e.touches[0].clientY-y0,dx=e.touches[0].clientX-x0;
    if(dy<=0||Math.abs(dy)<Math.abs(dx))return;      /* solo el gesto de bajar el dedo */
    if(libre())return;
    if(!puedeSubir())e.preventDefault();             /* ya está arriba del todo: no recargar */
  },{passive:false,capture:true});
  ['gesturestart','gesturechange'].forEach(function(t){document.addEventListener(t,function(e){e.preventDefault()},{passive:false})});
})();
