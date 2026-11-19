
/* Al guardar dentro de una ventana: aviso «Guardado» como notificación y la ventana se cierra sola */
(function(){
if(window.__pdGuardadoAuto)return;window.__pdGuardadoAuto=1;
var OK=/(guardad[oa]s?|actualizad[oa]s?|registrad[oa]s?|cambios aplicados|quedaron listos?)\b/i;
var NO=/(no se|no pud|error|falt|intenta|revisa|se guardar[áa]|guardar\b|en vivo|hace \d|sin guardar|pendiente)/i;
var MSG=/msg|Msg|mensaje|Mensaje|aviso|Aviso|status|estado|Ok\b|exito|Exito|ok\b/;
var HOJA='[data-pdm-hoja],.pdnSh,.pdsmHoja,.pdPwHoja,.pdxSheetCard,.pcSheet,.sheet,[role=dialog],.pdmSheet,.pdoSheet,.pdpm-sheet';
var CERRAR='.pdnX,.pdsmX,.pdPwX,.pcX,.pdpm-x,.pdoX,[data-close],[aria-label="Cerrar"],[aria-label="cerrar"],.close,.closeBtn,.x-icon';
var ocupado=0,yaAviso=0,mio=false;
function envolver(n){var f=window[n];if(typeof f!=='function'||f.__pdGA)return;var w=function(){if(!mio)yaAviso=Date.now();return f.apply(this,arguments)};w.__pdGA=1;try{window[n]=w}catch(_){}}
setInterval(function(){envolver('pdExito');envolver('toast')},700);
function avisar(t){
  if(Date.now()-yaAviso<3000)return;/* la app ya mostró su propio aviso: no se repite */
  mio=true;setTimeout(function(){mio=false},0);
  t=String(t||'Guardado').trim().replace(/^✓\s*/,'');
  try{if(typeof window.pdExito==='function'){window.pdExito(t);return}}catch(_){}
  try{if(typeof window.toast==='function'){window.toast('✓ '+t);return}}catch(_){}
  var d=document.createElement('div');d.textContent='✓ '+t;d.setAttribute('role','status');
  d.style.cssText='position:fixed;left:16px;right:16px;bottom:calc(24px + env(safe-area-inset-bottom));z-index:2147483647;padding:14px 16px;border-radius:14px;background:#1F6B3A;color:#fff;font:700 15px var(--font,Inter,sans-serif);text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.18);transition:opacity .25s';
  document.body.appendChild(d);setTimeout(function(){d.style.opacity='0';setTimeout(function(){d.remove()},300)},2400);
}
function cerrarHoja(h){
  var b=null,L=h.querySelectorAll(CERRAR);for(var i=0;i<L.length;i++){var x=L[i];if(x.getClientRects().length&&!x.closest('input,textarea')){b=x;break}}
  if(!b){var bs=h.querySelectorAll('button');for(var j=0;j<bs.length;j++){if(/^(×|✕|✖)$/.test((bs[j].textContent||'').trim())){b=bs[j];break}}}
  if(b){b.click();return}
  try{document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))}catch(_){}
}
var hechos=new WeakMap();
var PROG=/^(guardando|actualizando|enviando|subiendo|procesando|registrando)\b/i;
function esMensaje(el,txt){return el.getAttribute('role')==='status'||el.hasAttribute('aria-live')||MSG.test((el.id||'')+' '+(typeof el.className==='string'?el.className:''))||/^✓/.test(txt)}
function ocultar(el,si){if(si){el.setAttribute('data-pd-msg-oculto','');el.style.setProperty('display','none','important')}else if(el.hasAttribute('data-pd-msg-oculto')){el.removeAttribute('data-pd-msg-oculto');el.style.removeProperty('display')}}
function revisar(el){
  if(!el||el.nodeType!==1)return;
  var txt=(el.textContent||'').trim();
  if(el.closest('button,label,h1,h2,h3,input,textarea,select'))return;
  var h=el.closest(HOJA);if(!h)return;
  if(txt.length>170)return;
  if(!txt){return}
  var msg=esMensaje(el,txt);
  /* mensaje de «guardando…»: no se muestra, el botón ya indica que está trabajando */
  if(msg&&PROG.test(txt)){ocultar(el,true);return}
  if(msg&&OK.test(txt)&&!NO.test(txt)){
    ocultar(el,true);
    if(Date.now()-ocupado<2500||hechos.get(el)===txt)return;hechos.set(el,txt);ocupado=Date.now();
    if(h.getClientRects().length)cerrarHoja(h);
    setTimeout(function(){avisar(txt)},260);
    return;
  }
  if(msg)ocultar(el,false);/* los errores sí se ven en la ventana */
}
new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var m=ms[i];var t=m.type==='characterData'?m.target.parentElement:m.target;revisar(t);if(m.type==='childList'){for(var j=0;j<m.addedNodes.length;j++){var n=m.addedNodes[j];if(n.nodeType===1){revisar(n);var k=n.querySelectorAll&&n.querySelectorAll('[role=status],[aria-live]');if(k)for(var q=0;q<k.length;q++)revisar(k[q])}}}}}).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
})();
