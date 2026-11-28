/* Pidemás · efecto de los botones «Actualizar» (admin, motorizado y negocio).
   Al tocar cualquier botón de actualizar (también los que están dentro del panel nuevo):
   - el botón se hunde un poco y vibra apenas,
   - la flecha gira mientras se recarga (mínimo 0,9 s, hasta que desaparece el «Cargando…»),
   - al terminar sale un aviso corto «Actualizado» (o «No se pudo actualizar» si aparece un error). */
(function(){
  if(window.__pdBotonActualizar)return;window.__pdBotonActualizar=1;
  var SEL='[aria-label="Actualizar"],[aria-label^="Actualizar "],.m-rf,#refreshOrders,#refreshCash,#pdWalletRefresh,[data-pd-actualizar]';
  var CSS='@keyframes pdRfGira{to{transform:rotate(360deg)}}'+
    '.pdRfB{transition:transform .12s ease,background-color .15s ease!important}'+
    '.pdRfB:active{transform:scale(.88)!important}'+
    '.pdRfGira{pointer-events:none!important;background-color:#FFF1E8!important;color:#C4410C!important}'+
    '.pdRfGira svg{animation:pdRfGira .7s linear infinite!important;transform-origin:50% 50%}';
  var hoja=null;
  try{hoja=new CSSStyleSheet();hoja.replaceSync(CSS)}catch(e){hoja=null}
  function estilo(r){
    try{
      if(hoja&&r.adoptedStyleSheets){if(r.adoptedStyleSheets.indexOf(hoja)<0)r.adoptedStyleSheets=r.adoptedStyleSheets.concat([hoja]);return}
    }catch(e){}
    var cont=r===document?document.head:r;
    if(cont&&!cont.querySelector('style[data-pd-rf]')){var s=document.createElement('style');s.setAttribute('data-pd-rf','');s.textContent=CSS;cont.appendChild(s)}
  }
  /* documento + paneles con shadow DOM abierto */
  function raices(){
    var out=[document];
    try{
      var w=document.createTreeWalker(document.body||document.documentElement,NodeFilter.SHOW_ELEMENT);
      var n,c=0;while((n=w.nextNode())&&c<6000){c++;if(n.shadowRoot)out.push(n.shadowRoot)}
    }catch(e){}
    return out;
  }
  function marcar(){raices().forEach(function(r){estilo(r);try{r.querySelectorAll(SEL).forEach(function(b){if(!b.classList.contains('pdRfB'))b.classList.add('pdRfB');if(girando)b.classList.add('pdRfGira');else b.classList.remove('pdRfGira')})}catch(e){}})}
  function cargando(r){try{var l=r.querySelector('.load');return !!(l&&l.getClientRects().length)}catch(e){return false}}
  function errores(r){try{var n=0;r.querySelectorAll('.err').forEach(function(e){if(e.getClientRects().length)n++});return n}catch(e){return 0}}
  var girando=false,t0=0,raiz=null,err0=0,iv=null;
  function aviso(txt,mal){
    var d=document.getElementById('pdRfAviso');if(d)d.remove();
    d=document.createElement('div');d.id='pdRfAviso';d.setAttribute('role','status');d.textContent=txt;
    d.style.cssText='position:fixed;left:50%;top:calc(14px + env(safe-area-inset-top));transform:translate(-50%,-8px);z-index:2147483647;padding:9px 16px;border-radius:999px;font:700 14px/1.2 var(--font,Inter,system-ui,sans-serif);box-shadow:0 8px 24px rgba(31,26,23,.16);opacity:0;transition:opacity .2s ease,transform .2s ease;pointer-events:none;white-space:nowrap;'+(mal?'background:#FDECEC;color:#B42318;border:1px solid #F5C2C0':'background:#fff;color:#15803D;border:1px solid #CDEBD6');
    document.body.appendChild(d);
    requestAnimationFrame(function(){d.style.opacity='1';d.style.transform='translate(-50%,0)'});
    setTimeout(function(){d.style.opacity='0';d.style.transform='translate(-50%,-8px)';setTimeout(function(){d.remove()},250)},1400);
  }
  function terminar(){
    girando=false;clearInterval(iv);iv=null;marcar();
    var r=raiz&&(raiz.isConnected!==false)?raiz:document;
    aviso(errores(r)>err0?'No se pudo actualizar':'Actualizado ✓',errores(r)>err0);
  }
  function paso(){
    marcar();
    var t=Date.now()-t0;
    if(t>=900&&(!cargando(raiz||document)||t>8000))terminar();
  }
  document.addEventListener('click',function(e){
    var p=e.composedPath?e.composedPath():[e.target],b=null;
    for(var i=0;i<p.length;i++){var el=p[i];if(el&&el.nodeType===1&&el.matches&&el.matches(SEL)){b=el;break}}
    if(!b)return;
    if(girando&&Date.now()-t0<8000)return;
    try{navigator.vibrate&&navigator.vibrate(12)}catch(_){}
    raiz=b.getRootNode?b.getRootNode():document;err0=errores(raiz);
    girando=true;t0=Date.now();b.classList.add('pdRfB','pdRfGira');
    if(!iv)iv=setInterval(paso,100);paso();
  },true);
  /* deja listo el efecto de «hundirse» en los botones ya dibujados */
  setTimeout(marcar,1500);setInterval(function(){if(!girando&&!document.hidden)marcar()},4000);
})();
