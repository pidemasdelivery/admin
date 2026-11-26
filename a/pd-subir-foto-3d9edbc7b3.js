/* Pidemás · Subir fotos: en cualquier botón que sube una imagen, pregunta «Tomar foto» o «Elegir de la galería».
   La galería nueva de Android ya no muestra la cámara, por eso se ofrece aparte. */
(function(){
  if(window.__pdSubirFoto)return;window.__pdSubirFoto=1;
  const esImg=i=>i&&i.tagName==='INPUT'&&i.type==='file'&&(!i.accept||/image/i.test(i.accept));
  const css=document.createElement('style');
  css.textContent='#pdSf{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:flex-end;justify-content:center;background:rgba(31,26,23,.45);font-family:PdInter,Inter,system-ui,sans-serif;animation:pdSfF .15s ease-out}#pdSf .h{width:100%;max-width:520px;background:#FFFFFF;border-radius:22px 22px 0 0;padding:10px 16px calc(16px + env(safe-area-inset-bottom));box-sizing:border-box;animation:pdSfU .2s ease-out}#pdSf .g{width:40px;height:4px;border-radius:2px;background:#E8D9CE;margin:0 auto 12px}#pdSf b.t{display:block;font-size:17px;font-weight:800;color:#1F1A17;margin:0 4px 12px}#pdSf .o{all:unset;box-sizing:border-box;width:100%;display:flex;align-items:center;gap:14px;padding:14px;border-radius:16px;border:1.5px solid #F1E4DA;background:#FFF8F3;margin-bottom:10px;cursor:pointer;font-size:16px;font-weight:800;color:#1F1A17}#pdSf .o:active{transform:scale(.98)}#pdSf .o i{width:44px;height:44px;border-radius:13px;background:#C4410C;color:#FFFFFF;display:flex;align-items:center;justify-content:center;flex:none}#pdSf .o i svg{width:24px;height:24px}#pdSf .o small{display:block;font-size:13px;font-weight:500;color:#6B5E55;margin-top:2px}#pdSf .x{all:unset;display:block;width:100%;text-align:center;padding:12px;font-size:15px;font-weight:700;color:#6B5E55;cursor:pointer}@keyframes pdSfF{from{opacity:0}}@keyframes pdSfU{from{transform:translateY(40px)}}';
  (document.head||document.documentElement).appendChild(css);
  const S=d=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
  function hoja(inp){
    const v=document.getElementById('pdSf');if(v)v.remove();
    const d=document.createElement('div');d.id='pdSf';d.setAttribute('role','dialog');d.setAttribute('aria-label','Subir foto');
    d.innerHTML='<div class="h"><div class="g"></div><b class="t">Subir foto</b>'+
      '<button type="button" class="o" data-v="cam"><i>'+S('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>')+'</i><span>Tomar foto<small>Abre la cámara</small></span></button>'+
      '<button type="button" class="o" data-v="gal"><i>'+S('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>')+'</i><span>Elegir de la galería<small>Fotos o capturas guardadas</small></span></button>'+
      '<button type="button" class="x" data-v="no">Cancelar</button></div>';
    d.addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(!b&&e.target!==d)return;const v=b?b.dataset.v:'no';d.remove();if(v==='no')return;
      const c0=inp.getAttribute('capture');
      if(v==='cam')inp.setAttribute('capture','environment');else inp.removeAttribute('capture');
      window.__pdArchivoT=Date.now();inp.addEventListener('change',()=>{window.__pdArchivoT=Date.now()-240000},{once:true});inp.__pdSfOk=1;try{inp.click()}finally{inp.__pdSfOk=0}
      setTimeout(()=>{if(c0===null)inp.removeAttribute('capture');else inp.setAttribute('capture',c0)},1500)});
    document.body.appendChild(d);
  }
  /* toque directo o por etiqueta: se intercepta el clic del input (también dentro de las apps con Shadow DOM) */
  addEventListener('click',e=>{const t=e.composedPath?e.composedPath()[0]:e.target;if(!esImg(t)||t.__pdSfOk||t.disabled)return;e.preventDefault();e.stopImmediatePropagation();hoja(t)},true);
  /* botones que abren el input con .click() desde el código */
  const oc=HTMLInputElement.prototype.click;
  HTMLInputElement.prototype.click=function(){if(esImg(this)&&!this.__pdSfOk&&!this.disabled){hoja(this);return}return oc.apply(this,arguments)};
})();
