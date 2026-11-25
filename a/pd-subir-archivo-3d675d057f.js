/* ===== Pidemás · Botón para subir archivos (mismo diseño que «Tomar foto de la guía» del Motorizado) =====
   Ningún selector de archivo del navegador queda a la vista: se reemplaza por el botón de Pidemás. */
(function(){
  if(window.__pdSubir)return;window.__pdSubir=1;
  const CSS=`.pdSubirBtn,.fileUploadButton,.pdLogoBtn:not(.pdLogoDel),#pdnYPick,.pePhoto,label:has(>input[type=file]){display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:12px!important;min-height:64px!important;height:auto!important;padding:10px 16px 10px 10px!important;box-sizing:border-box;border:1.5px dashed #E2A07E!important;border-radius:18px!important;background:#FFF4EC!important;color:#9A330A!important;font:inherit;font-size:15.5px!important;font-weight:800!important;line-height:1.25;text-align:left!important;cursor:pointer;box-shadow:0 2px 8px rgba(196,65,12,.08)!important;text-decoration:none}
.pdSubirBtn::before,.fileUploadButton::before,.pdLogoBtn:not(.pdLogoDel)::before,#pdnYPick::before,.pePhoto::before,label:has(>input[type=file])::before{content:'';flex:0 0 46px;width:46px;height:46px;border-radius:14px;background:#C4410C url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23fff%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M4%208h3l2-3h6l2%203h3v11H4z%22%2F%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%2213%22%20r%3D%223.5%22%2F%3E%3C%2Fsvg%3E') center/24px no-repeat;box-shadow:0 4px 10px rgba(196,65,12,.28)}
.pdSubirBtn{width:100%}.pePhoto small{display:block;font-weight:600;color:#9A330A;opacity:.8}.pePhoto>svg,.pdSubirBtn>svg{display:none}`;
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
