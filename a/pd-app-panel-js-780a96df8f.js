
(function(){
  if(window.__pdAppPanel)return;window.__pdAppPanel=true;
  /* 1 · Sin zoom (pellizcar, doble toque, Ctrl + rueda o teclas) */
  var vp=document.querySelector('meta[name="viewport"]');
  if(!vp){vp=document.createElement('meta');vp.name='viewport';document.head.appendChild(vp)}
  vp.setAttribute('content','width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover');
  ['gesturestart','gesturechange','gestureend'].forEach(function(ev){document.addEventListener(ev,function(e){e.preventDefault()},{passive:false})});
  document.addEventListener('touchmove',function(e){if(e.touches&&e.touches.length>1&&e.cancelable)e.preventDefault()},{passive:false,capture:true});
  var ult=0;
  document.addEventListener('touchend',function(e){var n=Date.now();if(n-ult<350&&e.cancelable&&!(e.composedPath?e.composedPath():[e.target]).some(function(x){return x&&x.matches&&x.matches('input,textarea,select,a,button,label,[role=button],[data-a],[data-k]')}))e.preventDefault();ult=n},{passive:false});
  document.addEventListener('wheel',function(e){if(e.ctrlKey)e.preventDefault()},{passive:false});
  /* 2 · Sin recargar (F5, Ctrl+R); el jalón hacia abajo lo bloquea overscroll-behavior */
  document.addEventListener('keydown',function(e){var k=(e.key||'').toLowerCase();
    if((e.ctrlKey||e.metaKey)&&(k==='+'||k==='-'||k==='='||k==='0'||k==='r'))e.preventDefault();
    if(k==='f5')e.preventDefault()});

  /* 3 · Login fijo a la pantalla */
  function loginVisible(){var l=document.getElementById('loginView');if(!l)return false;if(l.classList.contains('hidden')||l.hidden)return false;var cs=getComputedStyle(l);return cs.display!=='none'&&cs.visibility!=='hidden'}
  var antes=null;
  function revisarLogin(){var v=loginVisible();if(!v&&document.documentElement.classList.contains('pdCarga'))return;if(v===antes)return;antes=v;document.documentElement.classList.toggle('pdLoginFijo',v);if(v)window.scrollTo(0,0)}
  function iniciarLogin(){revisarLogin();var l=document.getElementById('loginView');
    if(l)new MutationObserver(revisarLogin).observe(l,{attributes:true,attributeFilter:['class','hidden','style']});
    new MutationObserver(revisarLogin).observe(document.body,{attributes:true,attributeFilter:['class']});new MutationObserver(revisarLogin).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
    setInterval(revisarLogin,1000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciarLogin);else iniciarLogin();

  /* 4 · Ventanas (hojas) que se cierran deslizando hacia abajo, como en la tienda */

  /* 5 · Fondo oscuro detrás de todas las ventanas (igual que la primera ventana del motorizado) */
  (function(){
    var fondo=null;
    function crear(){fondo=document.createElement('div');fondo.id='pdFondoHoja';fondo.setAttribute('aria-hidden','true');document.body.appendChild(fondo);
      fondo.addEventListener('click',function(e){e.stopPropagation()});return fondo}
    function alfa(c){var m=/rgba?\(([^)]+)\)/.exec(c);if(!m)return 0;var p=m[1].split(',');return p.length>3?parseFloat(p[3]):1}
    var CAND='section.pdmSheet,section.panelSection,.notifDialog,[class*="Sheet"],[class*="sheet"],dialog[open],[role="dialog"]';
    function hojaAbierta(){
      var best=null,bz=-1;
      document.querySelectorAll(CAND).forEach(function(e){
        if(e.id==='pdFondoHoja'||!e.getClientRects().length)return;
        var cs=getComputedStyle(e);if(cs.position!=='fixed'||cs.visibility==='hidden'||cs.display==='none'||parseFloat(cs.opacity)<0.5)return;
        var r=e.getBoundingClientRect();if(!(r.bottom>=innerHeight-2&&r.top>24&&r.height>120))return;
        var z=parseInt(cs.zIndex,10)||0;if(z>bz){bz=z;best=e}
      });
      return best?{h:best,z:bz}:null}
    function yaTieneFondo(z){
      var els=document.elementsFromPoint(Math.round(innerWidth/2),12);
      for(var i=0;i<els.length;i++){var e=els[i];if(e.id==='pdFondoHoja')continue;var cs=getComputedStyle(e);if(cs.position!=='fixed')continue;
        var r=e.getBoundingClientRect();if(r.top<=1&&r.height>=innerHeight-2&&r.width>=innerWidth-2&&alfa(cs.backgroundColor)>=0.2&&(parseInt(cs.zIndex,10)||0)<z)return true}
      return false}
    function zReal(h){for(var e=h;e&&e!==document.body;e=e.parentElement){var z=parseInt(getComputedStyle(e).zIndex,10);if(z)return z}return 0}
    function revisar(){
      var a=hojaAbierta();
      if(!a){if(fondo&&!fondo.hidden){fondo.classList.remove('on');fondo.hidden=true}return}
      /* si la hoja vive dentro de una capa fija transparente, el fondo va justo debajo de esa capa */
      var z=a.z||zReal(a.h);
      /* si la hoja vive dentro de una capa fija a pantalla completa: si esa capa ya oscurece, no se agrega nada; si es transparente, el fondo va debajo de ella */
      for(var e=a.h.parentElement;e&&e!==document.body;e=e.parentElement){var cs=getComputedStyle(e);if(cs.position!=='fixed')continue;var r=e.getBoundingClientRect();
        if(r.top<=1&&r.height>=innerHeight-2&&r.width>=innerWidth-2){
          var oscura=alfa(cs.backgroundColor)>=0.2||[].some.call(e.children,function(k){if(k===a.h||k.contains(a.h))return false;var kc=getComputedStyle(k),kr=k.getBoundingClientRect();return kr.height>=innerHeight-2&&kr.width>=innerWidth-2&&alfa(kc.backgroundColor)>=0.2});
          if(oscura){if(fondo&&!fondo.hidden){fondo.classList.remove('on');fondo.hidden=true}return}
          z=parseInt(cs.zIndex,10)||z;break}}
      if(fondo&&!fondo.hidden&&fondo.__hoja===a.h)return;
      if(fondo&&!fondo.hidden){fondo.hidden=true}
      if(yaTieneFondo(z))return;
      var f=fondo||crear();f.style.zIndex=String(z-1)
      f.__hoja=a.h;f.hidden=false;void f.offsetWidth;f.classList.add('on')}
    setInterval(revisar,250);
  })();
  if(document.documentElement.dataset.pdSinArrastre==='1')return;
  var quieto=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CERRAR='[aria-label^="Cerrar"],[aria-label^="cerrar"],[data-close],.close,.pdpm-x,.pdmX,.notifClose,.pnaX,.pdoX';
  function visible(b){return b&&b.offsetParent!==null&&b.getClientRects().length>0}
  function botonCerrar(h){
    var zonas=[h];var p=h.parentElement;for(var i=0;i<2&&p&&p!==document.body;i++){zonas.push(p);p=p.parentElement}
    for(var z=0;z<zonas.length;z++){
      var bs=zonas[z].querySelectorAll(CERRAR+',button');
      for(var j=0;j<bs.length;j++){var b=bs[j];if(!visible(b))continue;
        if(b.matches(CERRAR)||/^[×✕✖x]$/i.test((b.textContent||'').trim()))return b}
    }
    return null}
  /* Una hoja es un bloque fijo pegado al borde inferior que no ocupa toda la pantalla */
  /* se busca la hoja más externa: así se mueve entera (cabecera y cuerpo), no solo el cuerpo con scroll */
  function hojaDe(t){
    var mejor=null;
    for(var e=t;e&&e!==document.body;e=e.parentElement){
      if(e.id==='nav'||(e.tagName==='HEADER'&&e.classList.contains('top'))||e.id==='loginView')return null;
      var cs=getComputedStyle(e),pa=e.parentElement,enCapa=pa&&pa!==document.body&&getComputedStyle(pa).position==='fixed';
      if(cs.position==='fixed'||cs.position==='absolute'||enCapa){
        var r=e.getBoundingClientRect();
        if(r.bottom>=innerHeight-2&&r.top>24&&r.height>120&&r.width>=Math.min(innerWidth,320)-2){
          if(cs.position==='absolute'&&!enCapa){var pp=e.offsetParent;if(!pp||getComputedStyle(pp).position!=='fixed')continue}
          mejor=e}
      }
    }
    return mejor}
  function desplazado(t,h){for(var e=t;e&&e!==h.parentElement;e=e.parentElement){if(e.scrollTop>0)return true;if(e===h)break}return false}
  function vibrar(ms){try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}}
  var g=null;
  function inicio(x,y,t){
    if(quieto||!t||!t.closest)return;
    if(t.closest('input,textarea,select,[contenteditable],.leaflet-container'))return;
    var h=hojaDe(t);if(!h)return;
    /* filas que se deslizan de lado (chips, pestañas): ahí no se arrastra la hoja */
    for(var e=t;e&&e!==h;e=e.parentElement){var ox=getComputedStyle(e).overflowX;if((ox==='auto'||ox==='scroll')&&e.scrollWidth>e.clientWidth+2)return}
    if(desplazado(t,h))return;
    g={h:h,x0:x,y0:y,dy:0,t0:Date.now(),activo:false};
  }
  function mover(x,y,ev){
    if(!g)return;var dx=x-g.x0,dy=y-g.y0;
    if(!g.activo){
      /* desde el primer movimiento hacia abajo se toma el gesto, para que el navegador no estire el contenido */
      if(dy>0&&dy>=Math.abs(dx)&&ev&&ev.cancelable)ev.preventDefault();
      if(Math.abs(dy)<10&&Math.abs(dx)<10)return;
      if(dy<=0||Math.abs(dx)>Math.abs(dy)||!botonCerrar(g.h)){g=null;return}
      g.activo=true;g.h.classList.add('pdArrastrando')}
    g.dy=Math.max(0,dy);var ahora=Date.now();g.v=(g.dy-(g.dyAnt||0))/Math.max(1,ahora-(g.tAnt||g.t0));g.dyAnt=g.dy;g.tAnt=ahora;
    g.h.style.setProperty('translate','0 '+(g.dy<120?g.dy:120+(g.dy-120)*0.85)+'px','important');
    if(ev&&ev.cancelable)ev.preventDefault();
  }
  function fin(){
    if(!g)return;var s=g;g=null;if(!s.activo)return;
    var v=(Date.now()-(s.tAnt||0))<90?(s.v||0):0;var h=s.h;h.classList.remove('pdArrastrando');h.classList.add('pdSoltando');
    if(s.dy>110||(v>0.55&&s.dy>40)){
      h.style.setProperty('translate','0 '+(h.offsetHeight+40)+'px','important');vibrar(8);
      setTimeout(function(){var b=botonCerrar(h);if(b)b.click();setTimeout(function(){h.style.removeProperty('translate');h.classList.remove('pdSoltando')},60)},230);
    }else{h.style.setProperty('translate','0 0px','important');setTimeout(function(){h.style.removeProperty('translate');h.classList.remove('pdSoltando')},300)}
    var anular=function(e){if(!e.isTrusted)return;e.stopPropagation();e.preventDefault();window.removeEventListener('click',anular,true)};
    window.addEventListener('click',anular,true);setTimeout(function(){window.removeEventListener('click',anular,true)},350);
  }
  /* en fase de captura: algunas ventanas detienen los toques y así igual se detecta el arrastre */
  document.addEventListener('touchstart',function(e){if(e.touches.length===1)inicio(e.touches[0].clientX,e.touches[0].clientY,e.target)},{passive:true,capture:true});
  document.addEventListener('touchstart',function(e){for(var el=e.target;el&&el.nodeType===1&&el!==document.body;el=el.parentElement){var oy=getComputedStyle(el).overflowY;if((oy==='auto'||oy==='scroll')&&el.style.getPropertyValue('overscroll-behavior-y')!=='none')el.style.setProperty('overscroll-behavior-y','none','important')}},{passive:true,capture:true});
  document.addEventListener('touchmove',function(e){if(g&&e.touches.length===1)mover(e.touches[0].clientX,e.touches[0].clientY,e)},{passive:false,capture:true});
  document.addEventListener('touchend',fin,true);document.addEventListener('touchcancel',fin,true);
  document.addEventListener('mousedown',function(e){if(e.button===0)inicio(e.clientX,e.clientY,e.target)},true);
  document.addEventListener('mousemove',function(e){if(g)mover(e.clientX,e.clientY,e)},true);
  document.addEventListener('mouseup',fin,true);
  window.pdHojaDe=hojaDe;window.pdBotonCerrar=botonCerrar;
})();
