
/* Sin sombra oscura detrás de ninguna ventana: quita el fondo oscuro semitransparente de cualquier capa que cubra la pantalla */
(function(){
if(window.__pdSinVelo)return;window.__pdSinVelo=1;
var st=document.createElement('style');st.id='pd-sin-velo-css';
st.textContent='dialog::backdrop{background:rgba(31,26,23,.22)!important;-webkit-backdrop-filter:blur(5px)!important;backdrop-filter:blur(5px)!important}[data-pd-sin-velo]{background:rgba(31,26,23,.22)!important;background-image:none!important;-webkit-backdrop-filter:blur(5px)!important;backdrop-filter:blur(5px)!important}html body [data-pdm-velo]{background:rgba(31,26,23,.22)!important;-webkit-backdrop-filter:blur(5px)!important;backdrop-filter:blur(5px)!important}';
(document.head||document.documentElement).appendChild(st);
function oscuro(bg){var m=String(bg).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);if(!m)return false;var a=m[4]===undefined?1:+m[4];return a>0.06&&a<0.97&&+m[1]<150&&+m[2]<150&&+m[3]<150}
function revisar(){if(document.getElementById('pdAppShell')){pend=0;return}
  pend=0;var W=innerWidth,H=innerHeight,L=document.body?document.body.getElementsByTagName('*'):[];
  for(var i=0;i<L.length;i++){var e=L[i];if(e.hasAttribute('data-pd-sin-velo'))continue;
    var c=getComputedStyle(e);if(c.position!=='fixed'&&c.position!=='absolute')continue;if(c.display==='none')continue;
    var bg=c.backgroundColor,fil=c.backdropFilter||c.webkitBackdropFilter||'none';
    if(!oscuro(bg)&&(fil==='none'||!fil))continue;
    var r=e.getBoundingClientRect();if(r.width<W*0.9||r.height<H*0.6)continue;
    if(!oscuro(bg)&&fil!=='none'){var m=String(bg).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);if(m&&(m[4]===undefined||+m[4]>0.9))continue}
    e.setAttribute('data-pd-sin-velo','');e.style.setProperty('background','rgba(31,26,23,.22)','important');e.style.setProperty('background-image','none','important');e.style.setProperty('backdrop-filter','blur(5px)','important');e.style.setProperty('-webkit-backdrop-filter','blur(5px)','important');
  }
}
var pend=0;function pedir(){if(pend)return;pend=1;setTimeout(function(){requestAnimationFrame(function(){try{revisar()}catch(_){pend=0}})},16)}
function uno(e){if(!e||e.nodeType!==1||e.hasAttribute('data-pd-sin-velo'))return;var c=getComputedStyle(e);if(c.position!=='fixed'&&c.position!=='absolute')return;if(!oscuro(c.backgroundColor))return;var r=e.getBoundingClientRect();if(r.width<innerWidth*0.9||r.height<innerHeight*0.6)return;e.setAttribute('data-pd-sin-velo','');e.style.setProperty('background','rgba(31,26,23,.22)','important');e.style.setProperty('background-image','none','important');e.style.setProperty('backdrop-filter','blur(5px)','important');e.style.setProperty('-webkit-backdrop-filter','blur(5px)','important')}
function rapido(ms){for(var i=0;i<ms.length;i++){var m=ms[i],L=m.type==='childList'?m.addedNodes:[m.target];for(var j=0;j<L.length;j++){var n=L[j];if(n.nodeType!==1)continue;uno(n);var k=n.children;for(var q=0;q<k.length&&q<12;q++)uno(k[q])}}pedir()}
function iniciar(){revisar();new MutationObserver(rapido).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden','open']});document.addEventListener('transitionstart',pedir,true);document.addEventListener('animationstart',pedir,true)}
if(document.body)iniciar();else document.addEventListener('DOMContentLoaded',iniciar);
})();
