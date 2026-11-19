
/* Detecta las ventanas abiertas, les pone el mismo diseño y permite cerrarlas arrastrando hacia abajo */
(function(){
if(window.__pdmu)return;window.__pdmu=1;
/* Pantallas completas que NO son ventanas: carga, ingreso, mapas grandes, menú lateral, avisos arriba */
const NO=/pdCarga|piCartaCarga|loginView|login|Login|pdmcFull|pdubMapa|pdmpMapa|pdVerMapa|Mapa|Suspend|PermGate|Confeti|confeti|MenuShade|pdMenu|sideMenu|drawer|Drawer|pdxAlerts|toast|Toast|pdfx|pdInstalar|pdUpd|pdA\b|splash|Splash/;
const POSIBLE=/modal|Modal|sheet|Sheet|overlay|Overlay|dialog|Dialog|hoja|Hoja|velo|Velo|popup|Popup|Bg\b|Fondo|Wrap\b|pdpm|pdcf|pdDlg|pdExito|Exito|Shade/;
const vw=()=>innerWidth,vh=()=>innerHeight;
function nombre(e){return (e.id||'')+' '+(typeof e.className==='string'?e.className:'')}
function visible(e){if(!e.isConnected)return false;const c=getComputedStyle(e);if(c.display==='none'||c.visibility==='hidden'||+c.opacity<0.05)return false;const r=e.getBoundingClientRect();return r.width>40&&r.height>40}
function excluido(e){for(let x=e;x&&x!==document.body;x=x.parentElement){if(NO.test(nombre(x)))return true}return false}
function cubre(r){/* toda la pantalla, o toda la columna de la app en computadora */return r.height>=vh()*0.9&&r.top<=vh()*0.05&&(r.width>=vw()*0.95||r.width>=Math.min(vw()*0.95,340))}
function esFondo(c){/* capa de fondo dentro de la ventana: cubre todo y no tiene contenido */
  if(c.children.length&&!/(^|[\s.-])(bg|backdrop|shade|velo|fondo|overlay)/i.test(nombre(c)))return false;
  const r=c.getBoundingClientRect();return r.width>=vw()*0.95&&r.height>=vh()*0.9&&!(c.textContent||'').trim();
}
function alfa(c){const m=/rgba?\(([^)]+)\)/.exec(c||'');if(!m)return 0;const p=m[1].split(',');return p.length>3?parseFloat(p[3]):1}
/* capa fija a pantalla completa, oscura o con capa de fondo, con una tarjeta adentro: es una ventana aunque no se llame así */
function pareceVentana(e){if(!visible(e))return false;const c=getComputedStyle(e);if(c.position!=='fixed')return false;if(!cubre(e.getBoundingClientRect()))return false;
  const oscuro=alfa(c.backgroundColor)>=0.15||[...e.children].some(k=>visto(k)&&esFondo(k)&&alfa(getComputedStyle(k).backgroundColor)>=0.15);if(!oscuro)return false;
  return [...e.children].some(k=>visto(k)&&!esFondo(k)&&!cubre(k.getBoundingClientRect())&&k.getBoundingClientRect().height>80)}
function hijoMayor(v,sinFondo){let m=null,area=0;for(const c of v.children){if(/^(SCRIPT|STYLE|TEMPLATE)$/.test(c.tagName)||!visible(c)||(sinFondo&&esFondo(c)))continue;const r=c.getBoundingClientRect();const a=r.width*r.height;if(a>area){area=a;m=c}}return m}
function hojaDe(v){/* la tarjeta principal dentro del velo (baja por envoltorios que también cubren la pantalla) */
  let h=hijoMayor(v,true);
  for(let i=0;h&&i<4;i++){const r=h.getBoundingClientRect();if(!cubre(r))break;const k=hijoMayor(h,true);if(!k)break;const kr=k.getBoundingClientRect();if(kr.height<r.height*0.98||kr.width<r.width*0.98){h=k;break}h=k}
  return h;
}
const marcadas=new Set();
function marcar(h,v){
  if(h.parentElement&&h.parentElement.closest('[data-pdm-hoja]'))return;
  if(!h.hasAttribute('data-pdm-hoja')){
    /* alto: todas iguales; solo los avisos y confirmaciones cortas quedan a su medida */
    const alto=Math.max(h.scrollHeight,h.getBoundingClientRect().height);
    const chica=/Dlg|pdcf|onfirm|Exito|xito|viso|lert|regunta|Toast|toast/.test(nombre(h)+' '+nombre(v||h));
    h.setAttribute('data-pdm-hoja','auto');/* a la medida del contenido, hasta 56px del borde de arriba */
    const b=getComputedStyle(h,'::before'),bw=parseFloat(b.width)||0,bh=parseFloat(b.height)||0;
    const esBarra=b.content!=='none'&&b.display!=='none'&&bw>=24&&bw<=80&&bh>=3&&bh<=8&&+b.opacity>0.2&&b.visibility!=='hidden'&&!/rgba\(0, 0, 0, 0\)|transparent/.test(b.backgroundColor);
    const hr=h.getBoundingClientRect();
    const barraPropia=[...h.querySelectorAll('*')].slice(0,25).some(x=>{const r=x.getBoundingClientRect();if(!(r.width>=24&&r.width<=80&&r.height>=3&&r.height<=8&&r.top-hr.top<30&&!x.children.length&&!(x.textContent||'').trim()))return false;const c=getComputedStyle(x);return c.visibility!=='hidden'&&+c.opacity>0.2&&!/rgba\(0, 0, 0, 0\)|transparent/.test(c.backgroundColor)});
    if(!barraPropia)h.setAttribute('data-pdm-grip','');void esBarra;
  }
  h.__pdmVelo=v||null;
  /* en computadora la app puede ser una columna: la hoja no es más ancha que su fondo */
  if(v){const w=v.getBoundingClientRect().width;if(w<560)h.style.setProperty('--pdmu-w',Math.round(w)+'px');else h.style.removeProperty('--pdmu-w')}
  if(v&&v!==h&&!v.hasAttribute('data-pdm-velo'))v.setAttribute('data-pdm-velo','');
  marcadas.add(h);if(v)marcadas.add(v);
}
function limpiar(e){
  e.removeAttribute('data-pdm-hoja');e.removeAttribute('data-pdm-grip');e.removeAttribute('data-pdm-velo');e.style.removeProperty('--pdmu-w');
  e.classList.remove('pdmuArrastre','pdmuVuelve','pdmuSale');
  if(e.__pdmT){e.style.removeProperty('transform');e.__pdmT=0}
  if(e.hasAttribute&&e.querySelectorAll){e.__pdmFirma=0}
  marcadas.delete(e);
}

/* ---------- cabecera con un solo título y pie fijo ---------- */
function visto(e){if(!e.getClientRects().length)return false;const c=getComputedStyle(e);return c.visibility!=='hidden'&&c.display!=='none'}
const INTER='button,a,input,select,textarea,label,[role="button"],[role="tab"],[role="tablist"],[contenteditable="true"]';
function tieneInter(e){return e.matches(INTER)||!!e.querySelector(INTER)}
function letra(e){return parseFloat(getComputedStyle(e).fontSize)||0}
function titulo(head){
  let mejor=null,fs=0;
  for(const e of head.querySelectorAll('h1,h2,h3,h4,h5,strong,b,span,div,p')){
    if(!visto(e)||e.closest(INTER))continue;
    const propio=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>1);if(!propio)continue;
    const f=letra(e)+(/^H[1-4]$/.test(e.tagName)?2:0)+(getComputedStyle(e).fontWeight>=700?0.5:0);
    if(f>fs+0.4){fs=f;mejor=e}
  }
  return mejor;
}
function cabecera(h){
  const firma=h.childElementCount+':'+(h.textContent||'').length;if(h.__pdmFirma===firma)return;h.__pdmFirma=firma;
  const hr=h.getBoundingClientRect();
  /* la cabecera es el bloque de arriba que tiene el botón de cerrar */
  const zonas=[...h.querySelectorAll(CERRAR+',button')].filter(b=>visto(b)&&(b.matches(CERRAR)||/^(×|✕|✖|x|X)$/.test((b.textContent||'').trim())));
  const cb=zonas.find(b=>b.getBoundingClientRect().top-hr.top<120);
  let head=null;
  if(cb){head=cb.parentElement;while(head&&head!==h&&head.getBoundingClientRect().width<hr.width*0.8)head=head.parentElement}
  if(!head||head===h){const f=[...h.children].find(c=>visto(c)&&!c.matches('[data-pdm-oculto]'));if(f&&f.getBoundingClientRect().height<150&&f.getBoundingClientRect().top-hr.top<60)head=f;else head=null}
  if(head&&head!==h&&head.getBoundingClientRect().height<170){
    const t=titulo(head);
    if(t){
      /* lo que acompaña al título (etiqueta de arriba, subtítulo de abajo, ícono) se oculta */
      /* ya no se oculta nada de la cabecera: logos, etiquetas y subtítulos se mantienen */
    }
    const p=getComputedStyle(head).position;if(p!=='fixed'&&p!=='absolute')head.setAttribute('data-pdm-cab','');
    try{const hw=head.getBoundingClientRect().width,hj=(head.closest('[data-pdm-hoja]')||head.parentElement).getBoundingClientRect().width;if(hj&&hw>=hj*0.8)head.setAttribute('data-pdm-cab-ancho','');else head.removeAttribute('data-pdm-cab-ancho')}catch(e){}
  }
  /* pie con botones: el último bloque de abajo queda fijo */
  let cont=h;if(h.children.length===1&&h.firstElementChild!==head)cont=h.firstElementChild;
  h.querySelectorAll('[data-pdm-pie]').forEach(x=>x.removeAttribute('data-pdm-pie'));
  const kids=[...cont.children].filter(c=>visto(c)&&c!==head);const ult=kids.length>1?kids[kids.length-1]:null;
  if(ult&&ult!==head&&ult!==cont.firstElementChild&&!ult.matches(CERRAR)&&!ult.querySelector(CERRAR)&&!ult.querySelector('[data-pdm-titulo],h1,h2')&&ult.querySelector('button,a,[role="button"]')){
    const r=ult.getBoundingClientRect();
    if(r.height<230&&!ult.querySelector('ul,ol,table')&&ult.querySelectorAll('button,a').length<=4){const p=getComputedStyle(ult).position;if(p!=='fixed'&&p!=='absolute')ult.setAttribute('data-pdm-pie','')}
  }
}
let pend=0;
function revisar(){
  pend=0;
  for(const e of [...marcadas]){if(!visible(e)||excluido(e))limpiar(e)}
  /* ventanas nativas */
  document.querySelectorAll('dialog[open]').forEach(d=>{if(visible(d)&&!excluido(d)&&d.getBoundingClientRect().height>60)marcar(d,null)});
  for(const e of document.querySelectorAll('body *')){
    if(e.hasAttribute('data-pdm-hoja')||e.hasAttribute('data-pdm-velo')||e.tagName==='DIALOG')continue;
    const n=nombre(e),rol=e.getAttribute('role')==='dialog'||e.getAttribute('aria-modal')==='true';
    if(!rol&&!POSIBLE.test(n)&&!(e.parentElement===document.body&&pareceVentana(e)))continue;
    if(!visible(e)||getComputedStyle(e).position!=='fixed'||excluido(e))continue;
    if(e.parentElement&&e.parentElement.closest('[data-pdm-hoja]'))continue;
    const r=e.getBoundingClientRect();
    if(cubre(r)){
      const h=hojaDe(e);
      const fondo=[...e.children].find(c=>visible(c)&&esFondo(c));
      if(h&&!excluido(h)){
        marcar(h,e);
        /* si la ventana trae su propia capa de fondo, el velo va en esa capa y el contenedor queda transparente */
        if(fondo){e.setAttribute('data-pdm-velo','caja');fondo.setAttribute('data-pdm-velo','');marcadas.add(fondo)}
      }
      else{e.setAttribute('data-pdm-velo','');marcadas.add(e)}
    }else if(r.height>120&&r.width>200&&(rol||/sheet|Sheet|hoja|Hoja|modal|Modal|dialog|Dialog|pdpm/.test(n))){
      marcar(e,null);
    }
  }
  for(const e of marcadas){if(e.hasAttribute('data-pdm-hoja')){try{cabecera(e)}catch(x){}}}
  veloPropio();
}
let ult=0;
let miVelo=null;
function veloPropio(){
  if(window.__pdAppPanel)return;/* los paneles ya ponen su fondo (#pdFondoHoja) */
  let h=null,z=-1;
  for(const e of marcadas){if(e.hasAttribute('data-pdm-hoja')&&!e.__pdmVelo&&e.tagName!=='DIALOG'){const zz=parseInt(getComputedStyle(e).zIndex,10)||0;if(zz>z){z=zz;h=e}}}
  if(!h){if(miVelo)miVelo.remove(),miVelo=null;return}
  if(!miVelo){miVelo=document.createElement('div');miVelo.id='pdmuVelo';miVelo.setAttribute('aria-hidden','true');miVelo.addEventListener('click',()=>{if(miVelo&&miVelo.__h)cerrar(miVelo.__h)});document.body.appendChild(miVelo)}
  miVelo.__h=h;miVelo.style.zIndex=String(Math.max(0,z-1));
  if(h.parentElement&&miVelo.parentElement!==h.parentElement&&h.parentElement!==document.documentElement){try{h.parentElement.insertBefore(miVelo,h)}catch(e){}}
}
function pedir(){if(pend)return;if(Date.now()-ult>160){pend=1;ult=Date.now();try{revisar()}catch(e){pend=0}return}pend=1;const w=Math.max(30,200-(Date.now()-ult));setTimeout(()=>requestAnimationFrame(()=>{ult=Date.now();try{revisar()}catch(e){pend=0}}),w)}
new MutationObserver(function(ms){var ya=false;for(var i=0;i<ms.length&&!ya;i++){var m=ms[i];if(m.type==='childList'){for(var j=0;j<m.addedNodes.length;j++){var n=m.addedNodes[j];if(n.nodeType===1&&(POSIBLE.test(nombre(n))||n.matches('[role=dialog],dialog')||(n.querySelector&&n.querySelector('[role=dialog],dialog')))){ya=true;break}}}else{var t=m.target;if(t.nodeType===1&&t!==document.documentElement&&t!==document.body&&(POSIBLE.test(nombre(t))||t.matches('[role=dialog],dialog')))ya=true}}if(ya&&!enRev){enRev=1;try{ult=Date.now();revisar()}catch(_){}enRev=0}else pedir()}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden','open','aria-hidden']});var enRev=0;
addEventListener('resize',pedir);
/* las ventanas que aparecen con animación se revisan otra vez al terminar */
let tarde=0;function despues(){clearTimeout(tarde);tarde=setTimeout(pedir,420)}
document.addEventListener('transitionend',despues,true);document.addEventListener('animationend',despues,true);
new MutationObserver(despues).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class','hidden','open']});
document.addEventListener('DOMContentLoaded',pedir);pedir();

/* ---------- cerrar ---------- */
const CERRAR='[data-pdm-cerrar],[data-close],[data-cerrar],[data-dismiss],.close,.closeBtn,.close-btn,.btnClose,.btn-close,.modal-close,.m-close,.x-close,.sheetClose,.cerrar,[aria-label="Cerrar"],[aria-label="cerrar"],[aria-label^="Cerrar"],[title="Cerrar"]';
function botonCerrar(h,v){
  const zonas=[h,v].filter(Boolean);
  for(const z of zonas){
    const b=[...z.querySelectorAll(CERRAR)].find(x=>visible(x)&&!x.disabled);if(b)return b;
    const t=[...z.querySelectorAll('button,[role="button"],a')].find(x=>visible(x)&&/^(×|✕|✖|x|X|Cerrar|Volver|Cancelar)$/.test((x.textContent||'').trim())&&!x.disabled);if(t)return t;
  }
  return null;
}
function cerrar(h){
  const v=h.__pdmVelo;
  const b=botonCerrar(h,v);
  if(b){b.click();return}
  if(h.tagName==='DIALOG'&&h.open){try{h.close()}catch(e){}return}
  if(v){const o={bubbles:true,cancelable:true,view:window};['pointerdown','mousedown','pointerup','mouseup','click'].forEach(t=>{try{v.dispatchEvent(t.startsWith('pointer')?new PointerEvent(t,o):new MouseEvent(t,o))}catch(e){}})}
  try{document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))}catch(e){}
  setTimeout(()=>{if(visible(h)){/* último recurso: ocultar sin romper la próxima apertura */
    const x=v||h;['open','show','is-open','active','visible','abierto','on'].forEach(c=>x.classList.remove(c));
    if(visible(h)){x.classList.add('hidden');if(visible(h))x.style.display='none';x.__pdmOcultoPorMi=1}
  }},380);
}
/* si la app vuelve a abrir una ventana que ocultamos, dejamos que se vea */
new MutationObserver(ms=>{for(const m of ms){const x=m.target;if(x.__pdmOcultoPorMi&&m.attributeName==='class'&&!x.classList.contains('hidden')){x.__pdmOcultoPorMi=0;x.style.removeProperty('display')}}}).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class']});

/* ---------- arrastrar hacia abajo ---------- */
let D=null;
function arribaDelTodo(t,h){for(let x=t;x&&x!==h.parentElement;x=x.parentElement){if(x.scrollTop>0){const c=getComputedStyle(x);if(/(auto|scroll)/.test(c.overflowY))return false}if(x===h)break}return true}
function inicio(y,x,t){
  const h=t&&t.closest&&t.closest('[data-pdm-hoja]');if(!h)return;
  if(t.closest('input,textarea,select,[contenteditable="true"],.leaflet-container,canvas,[data-pdm-no-arrastre]'))return;
  const r=h.getBoundingClientRect();
  D={h,y0:y,x0:x,t0:Date.now(),dy:0,on:false,zona:(y-r.top)<64,top:arribaDelTodo(t,h)};
}
function mover(y,x,ev){
  if(!D)return;const dy=y-D.y0,dx=x-D.x0;
  if(!D.on){
    if(Math.abs(dy)<8&&Math.abs(dx)<8)return;
    if(dy<=0||Math.abs(dx)>Math.abs(dy)||!(D.zona||D.top)){D=null;return}
    /* si la app ya arrastra esta hoja con su propio gesto, no se duplica */
    if(!D.espera){D.espera=1;return}
    if(D.h.classList.contains('pdArrastrando')||D.h.classList.contains('pdSoltando')){D=null;return}
    D.on=true;D.h.classList.add('pdmuArrastre');D.h.classList.remove('pdmuVuelve','pdmuSale');
  }
  D.dy=Math.max(0,dy);D.h.style.setProperty('transform','translateY('+D.dy+'px)','important');D.h.__pdmT=1;
  if(ev&&ev.cancelable)ev.preventDefault();
}
function fin(){
  if(!D)return;const d=D;D=null;if(!d.on)return;
  const h=d.h;h.classList.remove('pdmuArrastre');
  const vel=d.dy/Math.max(1,Date.now()-d.t0);
  if(d.dy>Math.min(140,h.getBoundingClientRect().height*0.3)||(d.dy>50&&vel>0.6)){
    h.classList.add('pdmuSale');h.style.setProperty('transform','translateY(110%)','important');
    /* que el toque no abra nada debajo */
    const tapa=e=>{if(!e.isTrusted)return;e.stopPropagation();e.preventDefault()};document.addEventListener('click',tapa,true);setTimeout(()=>document.removeEventListener('click',tapa,true),350);
    setTimeout(()=>{cerrar(h);setTimeout(()=>{h.classList.remove('pdmuSale');h.style.removeProperty('transform');h.__pdmT=0},420)},190);
  }else{
    h.classList.add('pdmuVuelve');h.style.removeProperty('transform');h.__pdmT=0;setTimeout(()=>h.classList.remove('pdmuVuelve'),260);
  }
}
document.addEventListener('touchstart',e=>{const p=e.touches[0];if(e.touches.length===1)inicio(p.clientY,p.clientX,e.target)},{passive:true,capture:true});
document.addEventListener('touchmove',e=>{const p=e.touches[0];if(p)mover(p.clientY,p.clientX,e)},{passive:false,capture:true});
document.addEventListener('touchend',fin,{passive:true,capture:true});
document.addEventListener('touchcancel',fin,{passive:true,capture:true});
document.addEventListener('mousedown',e=>{if(e.button===0)inicio(e.clientY,e.clientX,e.target)},true);
document.addEventListener('mousemove',e=>{if(D)mover(e.clientY,e.clientX,e)},true);
document.addEventListener('mouseup',fin,true);
window.pdModalRevisar=revisar;window.__pdmCab=cabecera;
})();
