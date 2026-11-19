
/* Pidemás · sugerencia de mayúsculas: si escriben o pegan una palabra TODA EN MAYÚSCULAS, se sugiere
   cambiarla (solo la primera letra en mayúscula, o mayúscula al iniciar cada palabra). Nada se cambia solo.
   No sugiere en correos, contraseñas, enlaces, números, códigos, placas, DNI/RUC ni buscadores. */
(function(){
  if(window.__pdMinusculas)return;window.__pdMinusculas=1;
  const NO=/correo|e-?mail|clave|contrase|password|url|enlace|link|maps|ubicaci|c[oó]digo|cup[oó]n|placa|ruc|dni|documento|usuario|gu[ií]a|token|buscar|search/i;
  function sirve(el){
    if(!el||el.readOnly||el.disabled)return false;
    if(el.closest&&el.closest('[data-pd-mayus]'))return false;
    if(el.tagName==='INPUT'){if(!['','text'].includes((el.getAttribute('type')||'').toLowerCase()))return false}
    else if(el.tagName!=='TEXTAREA')return false;
    const im=(el.getAttribute('inputmode')||'').toLowerCase();if(/numeric|decimal|tel|email|url/.test(im))return false;
    const ac=(el.getAttribute('autocomplete')||'').toLowerCase();if(/email|username|password|url|one-time/.test(ac))return false;
    const pista=[el.id,el.name,el.placeholder,el.getAttribute('aria-label'),el.dataset&&el.dataset.in,el.dataset&&el.dataset.hin,(el.labels&&el.labels[0]&&el.labels[0].textContent)||''].join(' ');
    return !NO.test(pista);
  }
  const L='a-záéíóúñü',U='A-ZÁÉÍÓÚÑÜ';
  const hayGritos=v=>new RegExp('(^|[^'+L+U+'])['+U+']{3,}(?=$|[^'+L+U+'])').test(String(v||''));
  const lower=s=>s.toLocaleLowerCase('es'),upper=s=>s.toLocaleUpperCase('es');
  function oracion(v){const s=lower(String(v));const i=s.search(new RegExp('['+L+']'));return i<0?s:s.slice(0,i)+upper(s.charAt(i))+s.slice(i+1)}
  function titulo(v){return lower(String(v)).replace(new RegExp('(^|[^'+L+'])(['+L+'])','g'),(m,a,b)=>a+upper(b))}

  let host=null,root=null,campo=null,tOcultar=0;
  function capa(){
    if(host&&host.isConnected)return;
    host=document.createElement('pd-sugerencia');host.setAttribute('data-pd-aislado','1');root=host.attachShadow({mode:'open'});
    root.innerHTML=`<style>:host{all:initial;position:fixed;z-index:2147483647;left:12px;right:12px;top:0;display:none;font-family:PdInter,Inter,system-ui,sans-serif}
.c{background:#FFFFFF;border:1px solid #F1E4DA;border-radius:16px;box-shadow:0 10px 28px rgba(31,26,23,.16);padding:10px 12px;display:flex;flex-direction:column;gap:8px;max-width:520px;margin:0 auto;animation:a .16s ease-out}
@keyframes a{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.h{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800;color:#6B5E55}.h span{flex:1 1 0%}
.x{all:unset;cursor:pointer;width:30px;height:30px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#6B5E55;font-size:20px}
.o{all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;gap:1px;padding:9px 12px;border-radius:12px;border:1px solid #F1E4DA;background:#FFF9F5;color:#1F1A17;font-size:15px;font-weight:700;overflow:hidden}
.o small{font-size:12px;font-weight:600;color:#9A330A}.o b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.o:active{background:#FDEBDF}
</style><div class="c" role="dialog" aria-label="Sugerencia de mayúsculas"><div class="h"><span>¿Lo escribimos así?</span><button type="button" class="x" data-k="x" aria-label="Dejar como está">×</button></div><div id="op" style="display:flex;flex-direction:column;gap:6px"></div></div>`;
    root.addEventListener('pointerdown',e=>e.preventDefault());
    root.addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(!b)return;const k=b.dataset.k;
      if(k!=='x'&&campo){const v=k==='o'?oracion(campo.value):titulo(campo.value);campo.value=v;campo.dispatchEvent(new Event('input',{bubbles:true,composed:true}));campo.dispatchEvent(new Event('change',{bubbles:true,composed:true}))}
      ocultar()});
    document.body.appendChild(host);
  }
  function ocultar(){if(host)host.style.display='none';campo=null;clearTimeout(tOcultar)}
  function sugerir(el){
    if(!sirve(el)||!hayGritos(el.value)){if(campo===el)ocultar();return}
    const a=oracion(el.value),b=titulo(el.value);
    capa();campo=el;
    const ops=[['o',a,'Solo la primera letra en mayúscula']];if(b!==a)ops.push(['t',b,'Mayúscula al iniciar cada palabra']);
    const E=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    root.getElementById('op').innerHTML=ops.map(o=>`<button type="button" class="o" data-k="${o[0]}"><small>${o[2]}</small><b>${E(o[1].length>60?o[1].slice(0,60)+'…':o[1])}</b></button>`).join('');
    const r=el.getBoundingClientRect();host.style.display='block';
    const h=root.querySelector('.c').getBoundingClientRect().height||130;
    let top=r.bottom+6;if(top+h>innerHeight-80)top=Math.max(8,r.top-h-6);
    host.style.top=top+'px';
    clearTimeout(tOcultar);tOcultar=setTimeout(ocultar,12000);
  }
  const real=e=>(e.composedPath&&e.composedPath()[0])||e.target;
  const vistos=new WeakSet();
  function escuchar(r){if(!r||vistos.has(r))return;vistos.add(r);
    /* al salir del campo, la sugerencia se va (no tapa el siguiente campo) */
    r.addEventListener('focusout',e=>{const el=real(e);if(campo===el)setTimeout(()=>{if(campo===el)ocultar()},150)},true)}
  /* mientras escribe o al pegar: la sugerencia sale debajo del mismo campo */
  let tEsc=0;
  document.addEventListener('input',e=>{if(!e.isTrusted)return;const el=real(e);clearTimeout(tEsc);if(campo&&campo!==el)ocultar();
    if(campo===el&&!hayGritos(el.value)){ocultar();return}
    tEsc=setTimeout(()=>{const a=el.getRootNode&&el.getRootNode().activeElement;if(a===el||document.activeElement===el)sugerir(el)},e.inputType==='insertFromPaste'?50:700)},true);
  escuchar(document);
  const orig=Element.prototype.attachShadow;
  Element.prototype.attachShadow=function(o){const r=orig.call(this,o);try{escuchar(r)}catch(_){}return r};
  const barrer=()=>{for(const el of document.querySelectorAll('body *')){if(el.shadowRoot)escuchar(el.shadowRoot)}};
  barrer();setTimeout(barrer,1500);setTimeout(barrer,5000);
  addEventListener('scroll',()=>{if(campo)ocultar()},true);
})();

