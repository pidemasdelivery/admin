
/* Pidemás · botón «Pegar» al costado de todos los campos de Recojo y entrega, Compra y Encomienda */
(function(){
  if(window.__pdPegar)return;window.__pdPegar=1;
  const CAJAS=['recojoAdminBox','compraAdminBox','encomiendaAdminBox'];
  const fire=(el,...ev)=>ev.forEach(t=>el.dispatchEvent(new Event(t,{bubbles:true})));
  function poner(box){
    box.querySelectorAll('input,textarea').forEach(inp=>{
      const t=(inp.type||'text').toLowerCase();
      if(inp.tagName==='INPUT'&&!['text','tel','number','search','email','url',''].includes(t))return;
      if(inp.hidden||!inp.parentElement)return;
      let w=inp.parentElement.classList.contains('pdsWithBtn')?inp.parentElement:null;
      if(w&&w.querySelector(':scope>.pdsMini'))return;
      if(!w){w=document.createElement('div');w.className='pdsWithBtn';inp.before(w);w.appendChild(inp)}
      if(inp.tagName==='TEXTAREA')w.style.alignItems='start';
      const pr=w.closest('.pdsPair');if(pr){pr.style.setProperty('display','flex','important');pr.style.setProperty('flex-direction','column','important');pr.style.setProperty('gap','14px','important');pr.querySelectorAll(':scope>.field').forEach(f=>f.style.setProperty('width','100%','important'))}
      const b=document.createElement('button');b.type='button';b.className='pdsMini';b.textContent='Pegar';w.appendChild(b);
      b.addEventListener('click',async()=>{
        try{let x=String(await navigator.clipboard.readText()||'').trim();if(!x){inp.focus();return}
          if(t==='number'){const m=x.replace(',','.').match(/-?\d+(?:\.\d+)?/);if(!m){inp.focus();return}x=m[0]}
          if(t==='tel'){const us=/^@?[a-z0-9._]{3,35}$/i.test(x)&&/[a-z@]/i.test(x)?(x.startsWith('@')?x:'@'+x):'';if(us)x=us;else{const d=x.replace(/[^\d+]/g,'');if(d)x=d}}
          inp.value=x;fire(inp,'input','change');inp.focus();
        }catch(e){inp.focus();if(window.pdAviso)pdAviso('Tu celular no dejó leer lo copiado. Mantén presionado el campo y elige «Pegar».')}
      });
    });
  }
  function revisar(){CAJAS.forEach(id=>{const b=document.getElementById(id);if(b)poner(b)})}
  let t=null;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(revisar,120)}).observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',revisar,{once:true});else revisar();
})();

