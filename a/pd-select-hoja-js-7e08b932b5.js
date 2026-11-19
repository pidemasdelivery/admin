
/* Toda lista desplegable (<select>) se abre como hoja desde abajo con el diseño de Pidemás, no con la lista del navegador. */
(function(){
  if(window.__pdSelHoja)return;window.__pdSelHoja=true;
  const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const apto=s=>s&&s.tagName==='SELECT'&&!s.multiple&&!s.disabled&&!(s.size>1)&&!s.closest('[data-nativo]');
  const relleno=o=>o.value===''&&/^(selecciona|elige|seleccione|escoge)/i.test(o.text.trim());
  function titulo(s){
    let t='';
    if(s.id){const l=document.querySelector('label[for="'+CSS.escape(s.id)+'"]');if(l)t=l.textContent}
    if(!t&&s.closest('label'))t=[...s.closest('label').childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ');
    if(!t)t=s.getAttribute('aria-label')||s.title||'';
    if(!t){const f=s.closest('.field,.f,.cnxF,.profileItem,.x-eLbl');const l=f&&f.querySelector('label,span,.l');if(l&&!l.contains(s))t=l.textContent}
    if(!t){const o=s.options[0];if(o&&relleno(o))t=o.text}
    t=String(t).replace(/\s+/g,' ').replace(/\(opcional\)/i,'').trim();
    return t||'Elige una opción';
  }
  let hoja=null,actual=null;
  function cerrar(){if(!hoja||hoja.hidden)return;try{if(hoja.hidePopover&&hoja.matches(':popover-open'))hoja.hidePopover()}catch(e){}hoja.hidden=true;document.documentElement.style.overflow=hoja.__ov||'';const s=actual;actual=null;if(s)try{s.focus({preventScroll:true})}catch(e){}}
  function elegir(s,v){
    if(s.value!==v){s.value=v;s.dispatchEvent(new Event('input',{bubbles:true}));s.dispatchEvent(new Event('change',{bubbles:true}))}
    cerrar();
  }
  function abrir(s){
    if(!apto(s))return;
    actual=s;
    if(!hoja){
      hoja=document.createElement('div');hoja.id='pdSelHoja';hoja.hidden=true;if('popover' in hoja)hoja.setAttribute('popover','manual');
      hoja.setAttribute('role','dialog');hoja.setAttribute('aria-modal','true');
      hoja.addEventListener('click',e=>{if(e.target===hoja)cerrar()});
      document.addEventListener('keydown',e=>{if(e.key==='Escape'&&hoja&&!hoja.hidden){e.preventDefault();cerrar()}});
      document.body.appendChild(hoja);
    }
    const t=titulo(s),ops=[];let n=0;
    for(const el of s.children){
      if(el.tagName==='OPTGROUP'){ops.push({g:el.label});for(const o of el.children)if(o.tagName==='OPTION'&&!o.hidden){ops.push({o});n++}}
      else if(el.tagName==='OPTION'&&!el.hidden&&!relleno(el)){ops.push({o:el});n++}
    }
    const busca=n>9;
    hoja.setAttribute('aria-label',t);
    hoja.innerHTML='<div class="pdSelCard"><div class="pdSelGrab"></div><div class="pdSelHead"><b>'+E(t)+'</b><button type="button" class="pdSelX" aria-label="Cerrar">×</button></div>'
      +(busca?'<input type="search" class="pdSelQ" placeholder="Buscar" autocomplete="off" aria-label="Buscar opción">':'')
      +'<div class="pdSelList" role="listbox" aria-label="'+E(t)+'">'+ops.map(x=>x.g!=null?'<div class="pdSelGrp">'+E(x.g)+'</div>':'<button type="button" class="pdSelOpt" role="option" data-v="'+E(x.o.value)+'" aria-selected="'+(x.o.selected&&!(x.o.value===''&&s.selectedIndex<0))+'"'+(x.o.disabled?' disabled':'')+'><span>'+E(x.o.text)+'</span><i></i></button>').join('')+'</div></div>';
    hoja.querySelector('.pdSelX').onclick=cerrar;
    hoja.querySelector('.pdSelList').addEventListener('click',e=>{const b=e.target.closest('.pdSelOpt');if(b&&!b.disabled&&actual)elegir(actual,b.dataset.v)});
    const q=hoja.querySelector('.pdSelQ');
    if(q)q.addEventListener('input',()=>{const v=q.value.trim().toLowerCase();let vis=0;hoja.querySelectorAll('.pdSelOpt').forEach(b=>{const ok=!v||b.textContent.toLowerCase().includes(v);b.hidden=!ok;if(ok)vis++});hoja.querySelectorAll('.pdSelGrp').forEach(g=>g.hidden=!!v);let nd=hoja.querySelector('.pdSelNada');if(!vis&&!nd){nd=document.createElement('div');nd.className='pdSelNada';nd.textContent='No hay opciones con ese nombre.';hoja.querySelector('.pdSelList').appendChild(nd)}else if(vis&&nd)nd.remove()});
    hoja.__ov=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';
    /* siempre encima de todo: al final del documento y en la capa superior (también sobre ventanas abiertas) */
    const dlg=s.closest('dialog[open]');if(hoja.parentNode!==(dlg||document.body)||hoja.nextSibling){try{if(hoja.hidePopover&&hoja.matches(':popover-open'))hoja.hidePopover()}catch(e){}(dlg||document.body).appendChild(hoja)}
    hoja.hidden=false;
    try{if(hoja.showPopover&&!hoja.matches(':popover-open'))hoja.showPopover()}catch(e){}
    const sel=hoja.querySelector('.pdSelOpt[aria-selected="true"]')||hoja.querySelector('.pdSelOpt');
    if(sel){try{sel.scrollIntoView({block:'center'})}catch(e){}}try{const cd=hoja.querySelector('.pdSelCard');cd.tabIndex=-1;cd.focus({preventScroll:true})}catch(e){}
  }
  /* Tocar el select: se cancela la lista del navegador y se abre la hoja */
  let t0=null;
  document.addEventListener('touchstart',e=>{const s=e.target.closest&&e.target.closest('select');t0=apto(s)&&e.touches.length===1?{s,x:e.touches[0].clientX,y:e.touches[0].clientY}:null},{capture:true,passive:true});
  document.addEventListener('touchend',e=>{if(!t0)return;const s=t0.s,c=e.changedTouches[0];const mov=c&&(Math.abs(c.clientX-t0.x)>10||Math.abs(c.clientY-t0.y)>10);t0=null;if(mov)return;if(e.cancelable)e.preventDefault();abrir(s)},{capture:true,passive:false});
  document.addEventListener('mousedown',e=>{const s=e.target.closest&&e.target.closest('select');if(!apto(s))return;e.preventDefault();if(e.button===0)abrir(s)},true);
  document.addEventListener('click',e=>{const s=e.target.closest&&e.target.closest('select');if(apto(s))e.preventDefault()},true);
  document.addEventListener('keydown',e=>{const s=e.target;if(!apto(s))return;if(e.key===' '||e.key==='Enter'||(e.altKey&&e.key==='ArrowDown')||e.key==='F4'){e.preventDefault();abrir(s)}},true);
})();
