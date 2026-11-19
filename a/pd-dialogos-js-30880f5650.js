
/* Reemplaza alert, confirm y prompt por tarjetas de la app.
   pdAviso(texto)             → tarjeta pequeña abajo que se va sola
   await pdConfirmar(texto)   → true / false
   await pdPedir(texto, valor)→ texto escrito, o null si cancela */
(function(){
  if(window.pdConfirmar)return;
  const ICO={ok:'<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',pregunta:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 0 1 5 1c0 1.8-2.5 2.2-2.5 3.6"/><path d="M12 17h.01"/></svg>',
    peligro:'<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>',
    lapiz:'<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>'};
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const PELIGRO=/eliminar|borrar|anular|quitar|cancelar el pedido|cerrar sesión|desactivar|suspender|vaciar|reiniciar|rechazar/i;
  let cola=Promise.resolve();
  /* separa "Título\nResto" para que se lea mejor */
  function partes(t){t=String(t??'').trim();const i=t.indexOf('\n');let a=i>0?t.slice(0,i):t,b=i>0?t.slice(i+1).trim():'';
    if(!b&&a.length>90){const k=a.search(/[.?!]\s/);if(k>20&&k<a.length-2){b=a.slice(k+2);a=a.slice(0,k+1)}}return [a,b]}
  function abrir(tipo,texto,valor){
    return new Promise(res=>{
      let d=document.getElementById('pdDlg');
      if(!d){d=document.createElement('div');d.id='pdDlg';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');document.body.appendChild(d)}
      let [t,p]=partes(texto);if(tipo==='prompt'&&!p)t=t.replace(/:\s*$/,'');const peligro=tipo==='confirm'&&PELIGRO.test(t+' '+p);
      const etiqueta=tipo==='prompt'?(p.match(/[^.\n]*:\s*$/)?.[0]||''):'';const cuerpo=etiqueta?p.slice(0,p.length-etiqueta.length).trim():p;
      d.innerHTML=`<div class="pdDlgCard"><div class="pdDlgIco${peligro?' peligro':''}${tipo==='exito'?' exito':''}">${tipo==='exito'?ICO.ok:tipo==='prompt'?ICO.lapiz:peligro?ICO.peligro:ICO.pregunta}</div>
        <h3 class="pdDlgT">${E(t)}</h3>${cuerpo?`<p class="pdDlgP">${E(cuerpo)}</p>`:''}
        ${tipo==='prompt'?`<div class="pdDlgCampo">${etiqueta?`<label for="pdDlgIn">${E(etiqueta.replace(/:\s*$/,''))}</label>`:''}<input id="pdDlgIn" autocomplete="off" value="${E(valor??'')}"></div>`:''}
        <div class="pdDlgBtns${tipo==='info'||tipo==='exito'?' uno':''}">${tipo==='info'||tipo==='exito'?'':'<button type="button" class="pdDlgNo">Cancelar</button>'}<button type="button" class="pdDlgSi${peligro?' peligro':''}">${tipo==='prompt'?'Guardar':tipo==='exito'?'Aceptar':tipo==='info'?'Entendido':peligro?'Sí, continuar':'Aceptar'}</button></div></div>`;
      d.hidden=false;document.documentElement.classList.add('pdDlgOn');
      const inp=d.querySelector('#pdDlgIn');
      const fin=v=>{d.hidden=true;d.innerHTML='';document.documentElement.classList.remove('pdDlgOn');document.removeEventListener('keydown',tecla,true);res(v)};
      const si=()=>fin(tipo==='prompt'?(inp?inp.value:''):true),no=()=>fin(tipo==='prompt'?null:false);
      function tecla(e){if(e.key==='Escape'){e.preventDefault();no()}else if(e.key==='Enter'&&(tipo!=='prompt'||document.activeElement===inp)){e.preventDefault();si()}}
      document.addEventListener('keydown',tecla,true);
      d.querySelector('.pdDlgSi').onclick=si;const nb=d.querySelector('.pdDlgNo');if(nb)nb.onclick=no;
      setTimeout(()=>{if(inp){inp.focus();inp.select()}else{const b=d.querySelector('.pdDlgSi');if(b)b.focus()}},60);
    });
  }
  /* una pregunta a la vez */
  function enCola(tipo,t,v){const p=cola.then(()=>abrir(tipo,t,v));cola=p.catch(()=>{});return p}
  window.pdConfirmar=t=>enCola('confirm',t);
  window.pdPedir=(t,v)=>enCola('prompt',t,v);
  window.pdInfo=t=>enCola('info',t);
  window.pdAviso=function(texto){
    const t=String(texto??'').trim();if(!t)return;
    let pila=document.getElementById('pdAvisoPila');
    if(!pila){pila=document.createElement('div');pila.id='pdAvisoPila';pila.setAttribute('aria-live','polite');document.body.appendChild(pila)}
    const c=document.createElement('div');c.className='pdAviso'+(/no se pudo|error|falló|inválid|obligatori|primero|debes|falta/i.test(t)?' error':/listo|guardad|registrad|actualizad|eliminad|correctamente|✓/i.test(t)?' ok':'');
    c.setAttribute('role','status');c.innerHTML='<span>'+E(t)+'</span><button type="button" aria-label="Cerrar aviso">×</button>';
    const quitar=()=>{c.remove()};c.querySelector('button').onclick=quitar;
    pila.appendChild(c);while(pila.children.length>3)pila.firstChild.remove();
    setTimeout(quitar,Math.min(9000,3500+t.length*40));
  };
  try{window.alert=function(t){window.pdAviso(t)}}catch(_){}

  /* Mensaje de éxito: ventanita con «Aceptar» cuando se guarda algo (en vez del texto pequeño dentro de la página) */
  const OK_RE=/guardad|actualizad|registrad|cread[oa]|eliminad|anulad|agregad|añadid|enviad|confirmad|recibid|correctamente|con éxito|✓/i;
  const ERR_RE=/no se pudo|error|falló|inválid|obligatori|primero |debes |falta /i;
  const BTN_RE=/guardar|registrar|crear|confirmar|enviar|agregar|añadir|recibir|anular|eliminar|borrar|quitar|pagar|subir|aceptar/i;
  let ultimoGuardar=0;
  document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button,[role=button],input[type=submit]');if(!b||b.closest('#pdDlg,#pdAvisoPila'))return;
    if(BTN_RE.test((b.textContent||b.value||'')+' '+(b.id||'')))ultimoGuardar=Date.now()},true);
  function titulo(t){return /guardad|actualizad/i.test(t)?'Cambios guardados':/registrad|recibid|agregad|añadid|cread/i.test(t)?'Registrado correctamente':/eliminad|anulad|borrad|quitad/i.test(t)?'Eliminado correctamente':/enviad/i.test(t)?'Enviado correctamente':'Listo'}
  function exito(texto){
    const t=String(texto||'').trim();const tt=titulo(t);
    const cuerpo=t.replace(/\s*✓\s*/g,' ').trim();
    return enCola('exito',tt+(cuerpo&&cuerpo.toLowerCase()!==tt.toLowerCase()?'\n'+cuerpo:''));
  }
  window.pdExito=exito;
  const reciente=()=>Date.now()-ultimoGuardar<15000;
  const SEL_MSG='[role=status],[aria-live],.notice,.msg,[id$=Msg],[id$=msg],[class*=Msg],[class*=msg]';
  const visto=new WeakMap();
  function revisarMsg(el){
    if(!el||el.closest('#pdDlg,#pdAvisoPila,#pdPermGate,#pdAlerts,#pdxAlerts,#pdAvisoStack'))return;
    if(el.closest('.pdpaW,.pdpa,.pidemas-order-modal-content,#pdoBody,.adminOrderCard,.pdDS')||el.querySelector('.pdpaW,button,input,select,textarea')||el.children.length>4)return;
    const t=(el.textContent||'').replace(/\s+/g,' ').trim();
    if(!t){if(el.dataset.pdExitoOculto){el.style.removeProperty('display');delete el.dataset.pdExitoOculto}return}
    if(visto.get(el)===t)return;visto.set(el,t);
    if(!reciente()||ERR_RE.test(t)||!OK_RE.test(t)||t.length>220)return;
    el.style.setProperty('display','none','important');el.dataset.pdExitoOculto='1';
    exito(t);
  }
  new MutationObserver(ms=>{const set=new Set();for(const m of ms){let n=m.target.nodeType===1?m.target:m.target.parentElement;if(!n)continue;const el=n.closest&&n.closest(SEL_MSG);if(el)set.add(el)}set.forEach(revisarMsg)})
    .observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  const avisoBase=window.pdAviso;
  window.pdAviso=function(t){const s=String(t??'');if(reciente()&&OK_RE.test(s)&&!ERR_RE.test(s))return exito(s);return avisoBase(t)};
  try{window.alert=function(t){window.pdAviso(t)}}catch(_){}
})();
