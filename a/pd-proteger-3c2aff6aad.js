/* Pidemás · protección de la página
   - Sin "arrastrar para recargar" (pull-to-refresh).
   - Sin zoom con dos dedos ni doble toque.
   - Sin copiar textos (salvo dentro de campos para escribir).
   - Sin copiar, arrastrar ni descargar imágenes (mantener presionado).
   El desplazamiento normal (scroll con un dedo) no se toca. */
(function(){
  if(window.__pdProteger)return;window.__pdProteger=1;
  var CSS='html,body{overscroll-behavior:none!important}'+
    ':where(html){touch-action:pan-x pan-y}'+
    '*{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}'+
    'input,textarea,select,[contenteditable]:not([contenteditable="false"]),[contenteditable]:not([contenteditable="false"]) *{-webkit-touch-callout:default;-webkit-user-select:text;user-select:text}'+
    'img,svg,video,canvas,picture{-webkit-user-drag:none;user-drag:none}'+
    '.leaflet-container,.pd-zoom-ok{touch-action:none}';
  try{var st=document.createElement('style');st.id='pd-proteger-css';st.textContent=CSS;(document.head||document.documentElement).appendChild(st)}catch(_){}
  /* Las pantallas de la app viven dentro de Shadow DOM: se les pone la misma regla. */
  var hoja=null;try{hoja=new CSSStyleSheet();hoja.replaceSync(CSS.replace(/html,body\{[^}]*\}|html\{[^}]*\}/g,''))}catch(_){hoja=null}
  try{var orig=Element.prototype.attachShadow;Element.prototype.attachShadow=function(o){var r=orig.call(this,o);
    try{if(hoja)r.adoptedStyleSheets=[hoja].concat(r.adoptedStyleSheets||[]);else{var s=document.createElement('style');s.textContent=CSS;r.appendChild(s)}}catch(_){}
    return r}}catch(_){}
  function real(e){try{var p=e.composedPath&&e.composedPath();if(p&&p.length)return p[0]}catch(_){}return e.target}
  function editable(n){for(var x=n;x;x=x.parentNode||x.host){if(x.nodeType!==1)continue;var t=x.tagName;if(t==='INPUT'||t==='TEXTAREA'||t==='SELECT')return true;if(x.isContentEditable)return true}return false}
  /* Mantener presionado: sin menú de copiar/descargar (imágenes y textos). */
  document.addEventListener('contextmenu',function(e){if(!editable(real(e)))e.preventDefault()},true);
  /* Copiar / cortar solo dentro de campos para escribir. */
  ['copy','cut'].forEach(function(ev){document.addEventListener(ev,function(e){if(!editable(real(e)))e.preventDefault()},true)});
  /* Arrastrar imágenes o enlaces fuera de la página. */
  document.addEventListener('dragstart',function(e){if(!editable(real(e)))e.preventDefault()},true);
  /* Zoom con dos dedos (Android/iOS) y con Ctrl + rueda/teclas (computadora). */
  function enMapa(e){try{var p=e.composedPath();for(var i=0;i<p.length;i++){var c=p[i].classList;if(c&&(c.contains('leaflet-container')||c.contains('pd-zoom-ok')))return true}}catch(_){}return false}
  document.addEventListener('touchmove',function(e){if(e.touches&&e.touches.length>1&&e.cancelable&&!enMapa(e))e.preventDefault()},{passive:false,capture:true});
  ['gesturestart','gesturechange','gestureend'].forEach(function(ev){document.addEventListener(ev,function(e){if(!enMapa(e))e.preventDefault()},{passive:false})});
  document.addEventListener('wheel',function(e){if(e.ctrlKey&&e.cancelable)e.preventDefault()},{passive:false});
  document.addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&/^(\+|-|=|0)$/.test(e.key))e.preventDefault()});
})();
