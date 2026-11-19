
/* Pidemás · texto sin mayúsculas: al terminar de escribir o al pegar, el texto queda en minúsculas
   salvo la primera letra. No toca correos, contraseñas, enlaces, números, códigos, placas, DNI/RUC ni buscadores. */
(function(){
  if(window.__pdMinusculas)return;window.__pdMinusculas=1;
  const NO=/correo|e-?mail|clave|contrase|password|url|enlace|link|maps|ubicaci|c[oó]digo|cup[oó]n|placa|ruc|dni|documento|usuario|yape|gu[ií]a|token|buscar|search/i;
  const TIPOS=['','text'];
  function sirve(el){
    if(!el||el.readOnly||el.disabled)return false;
    if(el.closest&&el.closest('[data-pd-mayus]'))return false;
    if(el.tagName==='INPUT'){if(!TIPOS.includes((el.getAttribute('type')||'').toLowerCase()))return false}
    else if(el.tagName!=='TEXTAREA')return false;
    const im=(el.getAttribute('inputmode')||'').toLowerCase();if(/numeric|decimal|tel|email|url/.test(im))return false;
    const ac=(el.getAttribute('autocomplete')||'').toLowerCase();if(/email|username|password|url|one-time/.test(ac))return false;
    const pista=[el.id,el.name,el.placeholder,el.getAttribute('aria-label'),el.dataset&&el.dataset.in,el.dataset&&el.dataset.hin,(el.labels&&el.labels[0]&&el.labels[0].textContent)||''].join(' ');
    return !NO.test(pista);
  }
  function arreglar(v){
    const s=String(v||'');if(!/[A-ZÁÉÍÓÚÑÜ]/.test(s))return s;
    const low=s.toLocaleLowerCase('es');const i=low.search(/[a-záéíóúñü]/);
    return i<0?low:low.slice(0,i)+low.charAt(i).toLocaleUpperCase('es')+low.slice(i+1);
  }
  function aplicar(el){
    if(!sirve(el))return;const v=el.value,n=arreglar(v);if(n===v)return;
    const a=el.selectionStart,b=el.selectionEnd;el.value=n;
    try{if(document.activeElement===el||(el.getRootNode&&el.getRootNode().activeElement===el))el.setSelectionRange(a,b)}catch(_){}
    el.dispatchEvent(new Event('input',{bubbles:true,composed:true}));el.dispatchEvent(new Event('change',{bubbles:true,composed:true}));
  }
  const real=e=>(e.composedPath&&e.composedPath()[0])||e.target;
  /* el foco que pasa de un campo a otro dentro de una misma pantalla (shadow) no llega a document: se escucha en cada una */
  const vistos=new WeakSet();
  function escuchar(r){if(!r||vistos.has(r))return;vistos.add(r);
    r.addEventListener('focusout',e=>{e.__pdMin=1;aplicar(real(e))},true);
    r.addEventListener('paste',e=>{if(e.__pdMin)return;e.__pdMin=1;const el=real(e);setTimeout(()=>aplicar(el),0)},true)}
  escuchar(document);
  const orig=Element.prototype.attachShadow;
  Element.prototype.attachShadow=function(o){const r=orig.call(this,o);try{escuchar(r)}catch(_){}return r};
  const barrer=()=>{for(const el of document.querySelectorAll('body *')){if(el.shadowRoot)escuchar(el.shadowRoot)}};
  barrer();setTimeout(barrer,1500);setTimeout(barrer,5000);
  /* el botón «Pegar» de los formularios escribe el valor y avisa con «input»: también se corrige */
  document.addEventListener('pd-pegado',e=>aplicar(real(e)),true);
  window.pdMinusculas=arreglar;window.pdMinusculasAplicar=aplicar;
})();

