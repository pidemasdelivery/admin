
/* ===== antes mejoras.js ===== */
/* ===== Pidemás · Mejoras de administración =====
   Mapa en vivo con pedidos sin asignar · Asignación automática · Ficha del cliente · Lista negra */
(function(){
  if(window.__pdAdmMej)return;window.__pdAdmMej=1;
  const $=id=>document.getElementById(id);
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const M=n=>'S/ '+(Number(n)||0).toFixed(2);
  const db=()=>window.db;
  const T=v=>{const t=new Date(v).getTime();return Number.isFinite(t)?t:0};
  const ref=id=>'#'+String(id||'').slice(0,8).toUpperCase();
  const est=o=>String(o&&o.estado||'').toLowerCase();
  const d9=t=>String(t||'').replace(/\D/g,'').slice(-9);
  const wa=t=>{const d=d9(t);return d.length===9?'51'+d:''};
  const fH=v=>{try{return new Date(v).toLocaleString('es-PE',{timeZone:'America/Lima',day:'2-digit',month:'short',hour:'numeric',minute:'2-digit'})}catch(e){return ''}};
  const diaLima=v=>new Date(v).toLocaleDateString('en-CA',{timeZone:'America/Lima'});
  const hoja=t=>window.pdCtl&&pdCtl.hoja?pdCtl.hoja(t):null;
  const cerrar=()=>{try{pdCtl.cerrarHoja()}catch(e){}};
  const ok=t=>(window.pdExito||window.pdAviso||alert)(t);
  const avisar=t=>(window.pdAviso||alert)(t);
  const L=()=>{try{return Array.isArray(allOrders)?allOrders:[]}catch(e){return []}};
  const MO=()=>{try{return Array.isArray(allMotos)?allMotos:[]}catch(e){return []}};
  const CL=()=>{try{return Array.isArray(allClientes)?allClientes:[]}catch(e){return []}};
  const ACT=['pendiente','confirmado','asignado','aceptado','pedido_aceptado','camino_recojo','en_camino','en_entrega','camino_entrega'];
  const faltaMigrar=e=>/does not exist|schema cache|relation|column/i.test(String(e&&e.message||e||''));
  const AVISO_MIG='<p class="pdCtlErr">Falta activar esta función en la base de datos. Pídele a Claude que aplique los cambios pendientes.</p>';
  const inicioDia=()=>new Date(diaLima(Date.now())+'T00:00:00-05:00').toISOString();

  /* =================== 1. Mapa en vivo: pedidos sin asignar =================== */
  const pins=new Map();
  function mapaPedidos(){
    const map=window.adminGpsMap;if(!map||!window.L)return;
    const keep=new Set();
    L().filter(o=>!o.motorizado_id&&['pendiente','confirmado'].includes(est(o))).forEach(o=>{
      const lat=Number(o.latitud_recojo)||Number(o.latitud_entrega),lng=Number(o.longitud_recojo)||Number(o.longitud_entrega);if(!lat||!lng)return;
      const id=String(o.id);keep.add(id);
      const pop='<b>'+E(ref(id))+' · sin motorizado</b><br>'+E(o.nombre_cliente||'')+'<br>'+E(o.direccion_entrega||'');
      let mk=pins.get(id);if(!mk){mk=L.marker([lat,lng],{icon:L.divIcon({className:'',html:'<div class="pdPinPed">'+E(ref(id).slice(1,5))+'</div>',iconSize:[46,26],iconAnchor:[23,13]})}).addTo(map).bindPopup(pop);pins.set(id,mk)}else{mk.setLatLng([lat,lng]);mk.setPopupContent(pop)}});
    for(const [id,mk] of pins)if(!keep.has(id)){mk.remove();pins.delete(id)}
  }

  /* =================== 2. Asignación automática =================== */
  let auto={on:false,min:3},autoLeido=0;
  async function leerAuto(){if(Date.now()-autoLeido<60000)return auto;autoLeido=Date.now();try{const r=await db().from('ajustes').select('valor').eq('clave','auto_asignar').maybeSingle();if(!r.error&&r.data&&r.data.valor)auto=Object.assign({on:false,min:3},r.data.valor)}catch(e){}return auto}
  async function guardarAuto(v){const r=await db().from('ajustes').upsert({clave:'auto_asignar',valor:v,actualizado_en:new Date().toISOString()});if(r.error)throw r.error;auto=v;autoLeido=Date.now()}
  async function asignacionAuto(){
    const b=hoja('Asignación automática');if(!b)return;await leerAuto();
    const pint=()=>{b.innerHTML='<p class="pdCtlMuted">Si un pedido listo para asignar se queda sin motorizado, el sistema lo asigna solo al motorizado sugerido: el más cercano y con menos pedidos. No se asigna a quien está en descanso.</p>'
      +'<button type="button" class="pdAutoSw '+(auto.on?'on':'')+'" id="pdAutoSw"><span><b>'+(auto.on?'Activada':'Desactivada')+'</b><small>'+(auto.on?'Asigna después de '+auto.min+' min sin motorizado':'Tú asignas todos los pedidos')+'</small></span><i></i></button>'
      +'<div class="pdCtlLbl">Esperar antes de asignar</div><div class="pdChips">'+[1,2,3,5,10].map(m=>'<button type="button" data-min="'+m+'" class="'+(m===auto.min?'on':'')+'">'+m+' min</button>').join('')+'</div>'
      +'<p class="pdCtlMuted">Funciona mientras tengas este panel abierto en algún teléfono o computadora.</p>'};
    pint();
    b.onclick=async e=>{const s=e.target.closest('#pdAutoSw'),m=e.target.closest('[data-min]');if(!s&&!m)return;const v=Object.assign({},auto);if(s)v.on=!v.on;if(m)v.min=+m.dataset.min;
      try{await guardarAuto(v);pint()}catch(x){b.insertAdjacentHTML('afterbegin',faltaMigrar(x)?AVISO_MIG:'<p class="pdCtlErr">'+E(x.message)+'</p>')}};
  }
  const intentados=new Map();
  async function autoTick(){
    await leerAuto();if(!auto.on||typeof assignOrder!=='function'||!window.pdPedCtl||!pdPedCtl.sugerencias)return;
    const now=Date.now();
    const cand=L().filter(o=>!o.motorizado_id&&['pendiente','confirmado'].includes(est(o))&&(!o.negocio_id||o.negocio_aceptado_en));
    if(!cand.length)return;
    const sug=await pdPedCtl.sugerencias();
    for(const o of cand){const desde=T(o.negocio_aceptado_en)||T(o.creado_en);if(now-desde<auto.min*60000)continue;
      const k=String(o.id);if(now-(intentados.get(k)||0)<90000)continue;intentados.set(k,now);
      const top=(sug.get(k)||[]).find(x=>x.gps&&!x.m.en_descanso)||(sug.get(k)||[]).find(x=>!x.m.en_descanso);if(!top)continue;
      const r=await db().from('pedidos').select('motorizado_id,estado').eq('id',o.id).maybeSingle();if(r.error||!r.data||r.data.motorizado_id)continue;
      try{await assignOrder(o.id,top.m.id);window.pdAviso&&pdAviso('Asignación automática: '+ref(o.id)+' → '+(top.m.nombre_completo||'motorizado'))}catch(e){}
    }
  }

  /* =================== 4 y 5. Ficha del cliente y lista negra =================== */
  let bloq=null,bloqT=0;
  async function leerBloq(f){if(!f&&bloq&&Date.now()-bloqT<60000)return bloq;bloqT=Date.now();const r=await db().from('clientes_bloqueados').select('*').order('creado_en',{ascending:false});bloq=r.error?null:(r.data||[]);return bloq}
  async function ficha(c){
    const nombre=(window.clienteNombre?clienteNombre(c):c.nombre_completo)||'Cliente',tl=window.clienteTelefono?clienteTelefono(c):c.telefono;const t9=d9(tl);
    const b=hoja('Ficha · '+nombre);if(!b)return;b.innerHTML='<p class="pdCtlMuted">Cargando…</p>';
    let q=db().from('pedidos').select('id,estado,total,costo_delivery,metodo_pago,creado_en,entregado_en,no_entregado,cancelado_por,motivo_cancelacion,no_contesta_desde,negocio_id').order('creado_en',{ascending:false}).limit(500);
    const ors=[];if(c.id)ors.push('cliente_id.eq.'+c.id);if(t9.length===9)ors.push('telefono_cliente.ilike.%'+t9);
    if(!ors.length){b.innerHTML='<p class="pdCtlMuted">Este cliente no tiene teléfono registrado.</p>';return}
    let r=await q.or(ors.join(','));
    if(r.error&&/no_entregado|cancelado_por|motivo|no_contesta/.test(r.error.message))r=await db().from('pedidos').select('id,estado,total,costo_delivery,metodo_pago,creado_en,entregado_en,negocio_id').or(ors.join(',')).order('creado_en',{ascending:false}).limit(500);
    if(r.error){b.innerHTML='<p class="pdCtlErr">'+E(r.error.message)+'</p>';return}
    const P=r.data||[],ent=P.filter(p=>est(p)==='entregado'),can=P.filter(p=>est(p)==='cancelado');
    const gasto=ent.reduce((s,p)=>s+(Number(p.total)||0),0),noE=P.filter(p=>p.no_entregado).length,noC=P.filter(p=>p.no_contesta_desde).length,porCli=can.filter(p=>p.cancelado_por==='cliente').length;
    const ult=P[0]?T(P[0].creado_en):0,dias=ult?Math.floor((Date.now()-ult)/864e5):null;
    const pref=(()=>{const g=new Map();P.forEach(p=>{if(p.metodo_pago)g.set(p.metodo_pago,(g.get(p.metodo_pago)||0)+1)});return [...g].sort((a,b)=>b[1]-a[1])[0]})();
    const etiqueta=ent.length>=10?['fiel','⭐ Cliente fiel']:(noE+porCli>=2||noE>=1&&ent.length<2)?['riesgo','⚠ Cuidado: anula o no recibe']:ent.length===0&&P.length?['nuevo','Sin entregas aún']:ent.length<3?['nuevo','Cliente nuevo']:['ok','Cliente regular'];
    const lista=await leerBloq(true);const yaB=lista&&lista.find(x=>x.telefono===t9);
    b.innerHTML='<span class="pdFichaTag '+etiqueta[0]+'">'+E(etiqueta[1])+'</span>'
      +'<div class="pdCtlGrid"><div><span>Pedidos</span><b>'+P.length+'</b></div><div><span>Entregados</span><b>'+ent.length+'</b></div><div><span>Gastó en total</span><b>'+M(gasto)+'</b></div><div><span>Ticket promedio</span><b>'+M(ent.length?gasto/ent.length:0)+'</b></div><div><span>Anulados</span><b>'+can.length+(porCli?' ('+porCli+' por él)':'')+'</b></div><div><span>No recibió / no contestó</span><b>'+noE+' / '+noC+'</b></div></div>'
      +'<p class="pdCtlMuted">'+(dias!=null?'Último pedido '+(dias===0?'hoy':'hace '+dias+' día'+(dias===1?'':'s'))+'. ':'')+(pref?'Suele pagar con '+E(pref[0])+'.':'')+'</p>'
      +'<div class="pdCtlLbl">Últimos pedidos</div>'+(P.slice(0,12).map(p=>'<div class="pdCtlRow"><div class="pdCtlTx"><strong>'+E(ref(p.id))+' · '+E(p.estado)+'</strong><small>'+E(fH(p.creado_en))+(p.motivo_cancelacion?' · '+E(p.motivo_cancelacion):'')+'</small></div><b>'+M(p.total)+'</b></div>').join('')||'<p class="pdCtlMuted">Sin pedidos.</p>')
      +(t9.length===9?(lista===null?AVISO_MIG:yaB?'<div class="pdBloq">🚫 Bloqueado'+(yaB.motivo?': '+E(yaB.motivo):'')+'</div><button type="button" class="pdCtlBtn alt" data-desb="'+t9+'">Quitar de la lista negra</button>':'<label class="pdCtlLbl">Motivo (si lo vas a bloquear)<input id="pdBloqMot" maxlength="120" placeholder="Ej. Pedidos falsos"></label><button type="button" class="pdCtlBtn pdRojo" data-bloq="'+t9+'">Bloquear este número</button>'):'');
    b.onclick=async e=>{const x=e.target.closest('[data-bloq]'),y=e.target.closest('[data-desb]');
      if(x){if(!(await pdConfirmar('¿Bloquear el número '+t9+'? Ya no podrá hacer pedidos desde la tienda.')))return;const r2=await db().from('clientes_bloqueados').upsert({telefono:t9,nombre,motivo:($('pdBloqMot').value||'').trim()||null});if(r2.error)return avisar('No se pudo bloquear: '+r2.error.message);ok('Número bloqueado.');ficha(c)}
      if(y){const r2=await db().from('clientes_bloqueados').delete().eq('telefono',t9);if(r2.error)return avisar('No se pudo desbloquear: '+r2.error.message);ok('Número desbloqueado.');ficha(c)}};
  }
  async function listaNegra(){
    const b=hoja('Lista negra');if(!b)return;const lista=await leerBloq(true);
    if(lista===null){b.innerHTML=AVISO_MIG;return}
    b.innerHTML='<p class="pdCtlMuted">Los números de esta lista no pueden hacer pedidos desde la tienda. Tú sí puedes crearles pedidos desde el panel.</p>'
      +'<div class="pdCtlDos"><input id="pdBlTel" inputmode="tel" maxlength="12" placeholder="Número (9 dígitos)"><input id="pdBlMot" maxlength="120" placeholder="Motivo"></div><button type="button" class="pdCtlBtn" id="pdBlAdd">Bloquear número</button>'
      +(lista.length?lista.map(x=>'<div class="pdCtlRow"><div class="pdCtlTx"><strong>'+E(x.telefono)+(x.nombre?' · '+E(x.nombre):'')+'</strong><small>'+E(x.motivo||'Sin motivo')+' · '+E(fH(x.creado_en))+'</small></div><button type="button" class="pdcjAct" data-q="'+E(x.telefono)+'">Quitar</button></div>').join(''):'<p class="pdCtlVacio">No hay números bloqueados.</p>');
    b.onclick=async e=>{
      if(e.target.closest('#pdBlAdd')){const t=d9($('pdBlTel').value);if(t.length!==9)return avisar('Escribe un número de 9 dígitos.');const r=await db().from('clientes_bloqueados').upsert({telefono:t,motivo:($('pdBlMot').value||'').trim()||null,nombre:(CL().find(c=>d9(window.clienteTelefono?clienteTelefono(c):c.telefono)===t)||{}).nombre_completo||null});if(r.error)return avisar(r.error.message);ok('Número bloqueado.');listaNegra()}
      const q=e.target.closest('[data-q]');if(q){if(!(await pdConfirmar('¿Quitar '+q.dataset.q+' de la lista negra?')))return;const r=await db().from('clientes_bloqueados').delete().eq('telefono',q.dataset.q);if(r.error)return avisar(r.error.message);listaNegra()}};
  }
  document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-act="ficha"]');if(!b)return;e.preventDefault();e.stopPropagation();const row=b.closest('[data-id]');const c=CL().find(x=>String(x.id)===String(row&&row.dataset.id));if(c)ficha(c)},true);

  window.pdAdmMej={asignacionAuto,listaNegra,ficha};
  let n=0;
  setInterval(()=>{if(!document.querySelector('#appView:not(.hidden)')||!db())return;n++;
    try{mapaPedidos()}catch(e){}
    if(n%6===3)autoTick().catch(()=>{});
  },5000);
})();

