/* ===== Pidemás · Botón para subir archivos (mismo diseño que «Tomar foto de la guía» del Motorizado) =====
   Ningún selector de archivo del navegador queda a la vista: se reemplaza por el botón de Pidemás. */
(function(){
  if(window.__pdSubir)return;window.__pdSubir=1;
  const CSS=`.pdSubirBtn,.fileUploadButton,.pdLogoBtn:not(.pdLogoDel),#pdnYPick,.pePhoto,label:has(>input[type=file]){display:flex!important;align-items:center;justify-content:center;gap:6px;min-height:46px;height:auto!important;padding:10px 14px!important;box-sizing:border-box;border:1px solid #F1C9B6!important;border-radius:12px!important;background:#FFF4EC!important;color:#9A330A!important;font:inherit;font-size:14px!important;font-weight:700!important;text-align:center;cursor:pointer;box-shadow:none!important;text-decoration:none}
.pdSubirBtn{width:100%}.pePhoto small{display:block;font-weight:600;color:#9A330A;opacity:.8}`;
  const st=document.createElement('style');st.id='pd-subir-css';st.textContent=CSS;(document.head||document.documentElement).appendChild(st);
  const oculto=i=>i.hidden||i.style.display==='none'||(i.closest('label')&&i.closest('label').contains(i));
  function arreglar(i){
    if(i.dataset.pdSubir||oculto(i))return;i.dataset.pdSubir='1';
    const b=document.createElement('button');b.type='button';b.className='pdSubirBtn';
    const txt=()=>i.files&&i.files[0]?'Foto lista · tocar para cambiar':(i.getAttribute('aria-label')||(/image/.test(i.accept||'')?'Tomar o elegir foto':'Elegir archivo'));
    b.textContent=txt();b.disabled=i.disabled;
    b.addEventListener('click',()=>{if(!i.disabled)i.click()});i.addEventListener('change',()=>{b.textContent=txt()});
    i.style.display='none';i.parentNode.insertBefore(b,i);
  }
  const revisar=()=>document.querySelectorAll('input[type=file]:not([data-pd-subir])').forEach(arreglar);
  revisar();new MutationObserver(revisar).observe(document.documentElement,{childList:true,subtree:true});
})();
