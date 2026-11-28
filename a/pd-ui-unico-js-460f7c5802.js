
(function(){
if(window.__pdUiUnico)return;window.__pdUiUnico=1;
/* ---------- buscadores ---------- */
const ES_BUSCA=i=>i.tagName==='INPUT'&&(i.type==='search'||/^buscar/i.test(i.placeholder||'')||/(^|[^a-z])(search|buscar|busca)/i.test((i.id||'')+' '+(typeof i.className==='string'?i.className:'')))&&!i.closest('[data-nativo]');
function marcarBuscadores(){
  document.querySelectorAll('input').forEach(i=>{
    if(i.__pdmP===i.parentElement&&i.hasAttribute('data-pdm-busca'))return;
    if(!ES_BUSCA(i)||i.type==='hidden')return;
    const p=i.parentElement;i.__pdmP=p;
    document.querySelectorAll('[data-pdm-busca-caja],[data-pdm-busca-neutro]').forEach(w=>{if(!w.querySelector('input[data-pdm-busca]')||w.contains(i)&&w!==p){w.removeAttribute('data-pdm-busca-caja');w.removeAttribute('data-pdm-busca-neutro')}});
    const envoltura=p&&p!==document.body&&p.querySelectorAll('input,select,textarea').length===1&&p.getBoundingClientRect().height<72&&!p.matches('form,.f,.field,fieldset')&&(p.textContent||'').trim().length<=2;
    const icono=envoltura&&[...p.children].some(c=>c!==i&&(c.tagName.toLowerCase()==='svg'||(c.querySelector&&c.querySelector('svg'))));
    if(icono){i.setAttribute('data-pdm-busca','caja');p.setAttribute('data-pdm-busca-caja','')}
    else{i.setAttribute('data-pdm-busca','solo');
      if(envoltura&&p.getBoundingClientRect().width-i.getBoundingClientRect().width<120){p.setAttribute('data-pdm-busca-neutro','');
        /* el ícono de texto (⌕ 🔍) de la envoltura se oculta: el buscador ya trae su lupa */
        [...p.children].forEach(c=>{if(c!==i&&!c.querySelector('input,button')&&c.tagName!=='BUTTON'&&(c.textContent||'').trim().length<=2&&!/[a-z0-9]/i.test(c.textContent||''))c.setAttribute('data-pdm-oculto','')})}}
  });
}
let tb=0;new MutationObserver(()=>{clearTimeout(tb);tb=setTimeout(marcarBuscadores,120)}).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('DOMContentLoaded',marcarBuscadores);marcarBuscadores();

/* ---------- selector de fecha y hora (en vez del del navegador) ---------- */
const TIPOS=/^(date|time|datetime-local)$/;
/* el campo tocado, también si está dentro de un panel con shadow DOM (panel nuevo) */
const inDe=e=>{let t=e.composedPath?e.composedPath()[0]:e.target;if(!t||t.nodeType!==1)t=e.target;return t&&t.closest?t.closest('input'):null};
const apto=i=>i&&i.tagName==='INPUT'&&TIPOS.test(i.type)&&!i.disabled&&!i.readOnly&&!i.closest('[data-nativo]');
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const p2=n=>String(n).padStart(2,'0');
const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function titulo(i){let t='';if(i.id){const rn=i.getRootNode&&i.getRootNode();const l=(rn&&rn.querySelector?rn:document).querySelector('label[for="'+CSS.escape(i.id)+'"]');if(l)t=l.textContent}
  if(!t&&i.closest('label'))t=[...i.closest('label').childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ');
  if(!t)t=i.getAttribute('aria-label')||i.title||'';
  if(!t){const f=i.closest('.field,.fld,.f,.cnxF,.profileItem,.x-eLbl');const l=f&&f.querySelector('label,span,.l,b,small');if(l&&!l.contains(i))t=l.textContent}
  t=String(t).replace(/\s+/g,' ').replace(/\(opcional\)/i,'').trim();
  return t||(i.type==='time'?'Elige la hora':i.type==='date'?'Elige la fecha':'Elige fecha y hora')}
let hoja=null,inp=null,st=null;
function cerrar(){if(!hoja||hoja.hidden)return;try{if(hoja.matches(':popover-open'))hoja.hidePopover()}catch(e){}hoja.hidden=true;inp=null}
function fijar(v){if(!inp)return;
  /* si el panel se volvió a dibujar mientras la hoja estaba abierta, se usa el campo nuevo con el mismo id */
  if(!inp.isConnected&&st&&st.id){try{const n=st.rt&&st.rt.getElementById?st.rt.getElementById(st.id):document.getElementById(st.id);if(n)inp=n}catch(e){}}if(inp.value!==v){inp.value=v;inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}))}cerrar()}
function pintar(){
  const tipo=inp.type,hayF=tipo!=='time',hayH=tipo!=='date';
  let h='<div class="fhCard"><div class="fhGrab"></div><div class="fhHead"><b>'+E(st.t)+'</b><button type="button" class="fhX" data-a="x" aria-label="Cerrar">×</button></div><div class="fhBody">';
  if(hayF){
    const y=st.vy,m=st.vm,pri=new Date(y,m,1),dias=new Date(y,m+1,0).getDate(),off=(pri.getDay()+6)%7;const hoy=new Date();const hk=hoy.getFullYear()+'-'+p2(hoy.getMonth()+1)+'-'+p2(hoy.getDate());
    h+='<div class="fhMes"><button type="button" data-a="ant" aria-label="Mes anterior">‹</button><b>'+MESES[m]+' '+y+'</b><button type="button" data-a="sig" aria-label="Mes siguiente">›</button></div><div class="fhCal">'+['Lu','Ma','Mi','Ju','Vi','Sá','Do'].map(d=>'<span>'+d+'</span>').join('')+'<span></span>'.repeat(off);
    for(let d=1;d<=dias;d++){const k=y+'-'+p2(m+1)+'-'+p2(d);const fuera=(st.min&&k<st.min)||(st.max&&k>st.max);h+='<button type="button" data-d="'+k+'" class="'+(k===st.f?'on ':'')+(k===hk?'hoy':'')+'"'+(fuera?' disabled':'')+'>'+d+'</button>'}
    h+='</div>';
  }
  if(hayH){
    const H=st.h,ampm=H==null?(st.pm?'pm':'am'):(H>=12?'pm':'am');
    h+='<div class="fhLbl">Hora</div><div class="fhSeg"><button type="button" data-ap="am" class="'+(ampm==='am'?'on':'')+'">a. m.</button><button type="button" data-ap="pm" class="'+(ampm==='pm'?'on':'')+'">p. m.</button></div><div class="fhChips">';
    for(let k=1;k<=12;k++){const hh=(k%12)+(ampm==='pm'?12:0);h+='<button type="button" data-h="'+hh+'" class="'+(H===hh?'on':'')+'">'+k+'</button>'}
    h+='</div><div class="fhLbl">Minutos</div><div class="fhChips">';
    const paso=st.paso>=900?15:(st.paso>=600?10:5);
    for(let mm=0;mm<60;mm+=paso)h+='<button type="button" data-m="'+mm+'" class="'+(st.mi===mm?'on':'')+'">'+p2(mm)+'</button>';
    h+='</div>';
  }
  h+='</div>';
  const listo=(!hayF||st.f)&&(!hayH||(st.h!=null&&st.mi!=null));
  if(hayH)h+='<div class="fhFoot"><button type="button" class="fhNo" data-a="borrar">Borrar</button><button type="button" class="fhSi" data-a="ok"'+(listo?'':' disabled')+'>Listo</button></div>';
  h+='</div>';
  hoja.innerHTML=h;
}
function valor(){const t=inp.type;const hm=st.h!=null&&st.mi!=null?p2(st.h)+':'+p2(st.mi):'';if(t==='time')return hm;if(t==='date')return st.f||'';return st.f&&hm?st.f+'T'+hm:''}
function abrir(i){
  if(!apto(i))return;inp=i;
  const v=i.value||'';let f=null,H=null,M=null;
  if(i.type==='date')f=v||null;else if(i.type==='time'){const m=/^(\d\d):(\d\d)/.exec(v);if(m){H=+m[1];M=+m[2]}}else{const m=/^(\d{4}-\d\d-\d\d)T(\d\d):(\d\d)/.exec(v);if(m){f=m[1];H=+m[2];M=+m[3]}}
  const base=f?new Date(f+'T12:00'):new Date();
  st={t:titulo(i),f,h:H,mi:M==null?null:M,vy:base.getFullYear(),vm:base.getMonth(),min:(i.min||'').slice(0,10),max:(i.max||'').slice(0,10),paso:+(i.step||60)*(i.type==='date'?0:1),pm:new Date().getHours()>=12,id:i.id||'',rt:i.getRootNode?i.getRootNode():document};
  if(st.mi!=null){const p=st.paso>=900?15:(st.paso>=600?10:5);if(st.mi%p)st.mi=Math.round(st.mi/p)*p%60}
  if(!hoja){hoja=document.createElement('div');hoja.id='pdFhHoja';hoja.hidden=true;if('popover' in hoja)hoja.setAttribute('popover','manual');hoja.setAttribute('role','dialog');hoja.setAttribute('aria-modal','true');
    hoja.addEventListener('click',e=>{
      if(e.target===hoja){cerrar();return}
      const b=e.target.closest('button');if(!b||b.disabled||!inp)return;
      const a=b.dataset.a;
      if(a==='x'){cerrar();return}
      if(a==='ant'){st.vm--;if(st.vm<0){st.vm=11;st.vy--}pintar();return}
      if(a==='sig'){st.vm++;if(st.vm>11){st.vm=0;st.vy++}pintar();return}
      if(a==='borrar'){fijar('');return}
      if(a==='ok'){const v=valor();if(v)fijar(v);return}
      if(b.dataset.d){st.f=b.dataset.d;if(inp.type==='date'){fijar(st.f);return}pintar();return}
      if(b.dataset.ap){const pm=b.dataset.ap==='pm';st.pm=pm;if(st.h!=null){st.h=(st.h%12)+(pm?12:0)}pintar();return}
      if(b.dataset.h){st.h=+b.dataset.h;pintar();return}
      if(b.dataset.m){st.mi=+b.dataset.m;pintar();return}
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&hoja&&!hoja.hidden){e.preventDefault();cerrar()}});
  }
  const dlg=i.closest('dialog[open]');(dlg||document.body).appendChild(hoja);
  pintar();hoja.hidden=false;try{if(hoja.showPopover&&!hoja.matches(':popover-open'))hoja.showPopover()}catch(e){}
  try{i.blur()}catch(e){}
}
let t0=null;
document.addEventListener('touchstart',e=>{const i=inDe(e);t0=apto(i)&&e.touches.length===1?{i,x:e.touches[0].clientX,y:e.touches[0].clientY}:null},{capture:true,passive:true});
document.addEventListener('touchend',e=>{if(!t0)return;const i=t0.i,c=e.changedTouches[0];const mov=c&&(Math.abs(c.clientX-t0.x)>10||Math.abs(c.clientY-t0.y)>10);t0=null;if(mov)return;if(e.cancelable)e.preventDefault();abrir(i)},{capture:true,passive:false});
document.addEventListener('mousedown',e=>{const i=inDe(e);if(!apto(i))return;e.preventDefault();if(e.button===0)abrir(i)},true);
document.addEventListener('click',e=>{const i=inDe(e);if(apto(i))e.preventDefault()},true);
document.addEventListener('keydown',e=>{const i=inDe(e)||e.target;if(!apto(i))return;if(e.key===' '||e.key==='Enter'){e.preventDefault();abrir(i)}},true);
/* las apps que llaman showPicker() también abren el de Pidemás */
try{const orig=HTMLInputElement.prototype.showPicker;if(orig)HTMLInputElement.prototype.showPicker=function(){if(apto(this)){abrir(this);return}return orig.apply(this,arguments)}}catch(e){}
})();
