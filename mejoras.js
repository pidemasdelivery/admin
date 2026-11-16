/* ===== Pidemás · Mejoras de administración =====
   Panel de hoy · Mapa en vivo con pedidos sin asignar · Asignación automática · Ficha del cliente
   · Lista negra · Mensajes masivos por WhatsApp · Ranking · Registro de acciones */
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

  /* =================== 3. Panel de hoy =================== */
  let hoy=null,hoyT=0;
  async function leerHoy(){
    if(Date.now()-hoyT<45000&&hoy)return hoy;hoyT=Date.now();
    const r=await db().from('pedidos').select('id,estado,total,subtotal,costo_delivery,motorizado_id,creado_en').gte('creado_en',inicioDia()).limit(3000);
    if(r.error)return hoy;
    const P=r.data||[],ent=P.filter(p=>est(p)==='entregado');
    let enLinea=0,desc=0;MO().forEach(m=>{if(m.en_descanso)desc++;else if(m.ultima_ubicacion&&Date.now()-T(m.ultima_ubicacion)<6*60000)enLinea++});
    let dem=0;try{dem=(window.pdPedCtl&&document.querySelectorAll('#orderList .adminOrderCard.pdAlerta').length)||0}catch(e){}
    hoy={n:P.length,ent:ent.length,venta:ent.reduce((s,p)=>s+(Number(p.total)||0),0),del:ent.reduce((s,p)=>s+(Number(p.costo_delivery)||0),0),curso:P.filter(p=>ACT.includes(est(p))).length,can:P.filter(p=>est(p)==='cancelado').length,enLinea,desc,dem};
    return hoy;
  }
  async function panelHoy(){
    const sal=document.querySelector('#tab-pedidos > .pdSal');if(!sal)return;
    let c=$('pdHoyCard');if(!c){c=document.createElement('section');c.id='pdHoyCard';c.className='pdHoy';
      c.addEventListener('click',e=>{const b=e.target.closest('[data-h]');if(!b)return;const k=b.dataset.h;
        if(k==='dem'&&window.pdPedCtl)return pdPedCtl.alertas();if(k==='motos'){try{window.__pdmOpen&&__pdmOpen('gps')}catch(_){}return}
        if(k==='rep'&&window.pdPedCtl)return pdPedCtl.reportes(1);
        const chip=document.querySelector('#tab-pedidos .pdn-chip[data-v="'+(k==='ent'?'entregado':k==='can'?'cancelado':'')+'"]');chip&&chip.click();$('orderList')?.scrollIntoView({behavior:'smooth',block:'start'})})}
    if(c.previousElementSibling!==sal)sal.after(c);
    const h=await leerHoy();if(!h)return;
    const html='<div class="pdHoyHd"><b>Hoy</b><button type="button" data-h="rep">Ver reporte</button></div><div class="pdHoyG">'
      +'<button type="button" data-h="todos"><small>Pedidos</small><b>'+h.n+'</b></button>'
      +'<button type="button" data-h="ent"><small>Entregados</small><b>'+h.ent+'</b></button>'
      +'<button type="button" data-h="rep"><small>Ventas</small><b>'+M(h.venta)+'</b></button>'
      +'<button type="button" data-h="rep"><small>Delivery</small><b>'+M(h.del)+'</b></button>'
      +'<button type="button" data-h="todos"><small>En curso</small><b>'+h.curso+'</b></button>'
      +'<button type="button" data-h="dem" class="'+(h.dem?'warn':'')+'"><small>Demorados</small><b>'+h.dem+'</b></button>'
      +'<button type="button" data-h="motos" class="ancho"><small>Motorizados</small><b>'+h.enLinea+' en línea'+(h.desc?' · '+h.desc+' en descanso':'')+'</b></button></div>';
    if(c.__h!==html){c.__h=html;c.innerHTML=html}
  }

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

  /* =================== 6. Mensajes masivos =================== */
  const KENV='pidemas-admin-masivo-enviados';
  async function masivos(){
    const b=hoja('Mensajes masivos');if(!b)return;b.innerHTML='<p class="pdCtlMuted">Cargando clientes…</p>';
    const r=await db().from('pedidos').select('telefono_cliente,nombre_cliente,creado_en,estado').gte('creado_en',new Date(Date.now()-180*864e5).toISOString()).limit(8000);
    const ultimo=new Map(),cuantos=new Map();(r.data||[]).forEach(p=>{const t=d9(p.telefono_cliente);if(t.length!==9)return;const ts=T(p.creado_en);if(ts>(ultimo.get(t)||0))ultimo.set(t,ts);if(est(p)==='entregado')cuantos.set(t,(cuantos.get(t)||0)+1)});
    const bl=new Set(((await leerBloq(true))||[]).map(x=>x.telefono));
    const base=new Map();CL().forEach(c=>{const t=d9(window.clienteTelefono?clienteTelefono(c):c.telefono);if(t.length===9&&!bl.has(t))base.set(t,{t,n:(window.clienteNombre?clienteNombre(c):c.nombre_completo)||''})});
    (r.data||[]).forEach(p=>{const t=d9(p.telefono_cliente);if(t.length===9&&!bl.has(t)&&!base.has(t))base.set(t,{t,n:p.nombre_cliente||''})});
    let filtro='todos',msg='Hola {nombre} 👋, te escribimos de *Pidemás Delivery*. ',env=new Set();try{env=new Set(JSON.parse(localStorage.getItem(KENV)||'[]'))}catch(e){}
    const lista=()=>{const now=Date.now();return [...base.values()].filter(x=>{const u=ultimo.get(x.t)||0;if(filtro==='recientes')return u&&now-u<=30*864e5;if(filtro==='inactivos')return !u||now-u>30*864e5;if(filtro==='fieles')return (cuantos.get(x.t)||0)>=5;return true}).sort((a,c)=>(ultimo.get(c.t)||0)-(ultimo.get(a.t)||0))};
    const pint=()=>{const Ls=lista(),hechos=Ls.filter(x=>env.has(x.t)).length;
      $('pdMvL').innerHTML='<p class="pdCtlMuted"><b>'+Ls.length+'</b> cliente'+(Ls.length===1?'':'s')+' · enviados '+hechos+'</p>'+Ls.slice(0,300).map(x=>{const txt=msg.replace(/\{nombre\}/g,String(x.n||'').split(' ')[0]||'').replace(/\s+,/g,',');return '<div class="pdCtlRow '+(env.has(x.t)?'pdMvOk':'')+'"><div class="pdCtlTx"><strong>'+E(x.n||'Cliente')+'</strong><small>'+E(x.t)+(ultimo.get(x.t)?' · último pedido '+E(fH(ultimo.get(x.t))):'')+'</small></div><a class="pdCtlWa" data-t="'+x.t+'" target="_blank" rel="noopener" href="https://wa.me/51'+x.t+'?text='+encodeURIComponent(txt)+'">'+(env.has(x.t)?'Enviado ✓':'Enviar')+'</a></div>'}).join('')};
    b.innerHTML='<p class="pdCtlMuted">Escribe el mensaje, elige a quiénes y toca «Enviar» en cada cliente: se abre WhatsApp con el mensaje listo. {nombre} se cambia por el nombre del cliente.</p>'
      +'<textarea id="pdMvTx" rows="4" maxlength="900"></textarea>'
      +'<div class="pdChips">'+[['todos','Todos'],['recientes','Pidieron en 30 días'],['inactivos','Sin pedir 30+ días'],['fieles','5+ pedidos']].map(x=>'<button type="button" data-f="'+x[0]+'" class="'+(x[0]===filtro?'on':'')+'">'+x[1]+'</button>').join('')+'</div>'
      +'<button type="button" class="pdCtlBtn alt" id="pdMvReset">Empezar una nueva campaña (borrar marcas de enviado)</button><div id="pdMvL"></div>';
    $('pdMvTx').value=msg;$('pdMvTx').oninput=e=>{msg=e.target.value;clearTimeout(b.__t);b.__t=setTimeout(pint,350)};pint();
    b.onclick=e=>{const f=e.target.closest('[data-f]');if(f){filtro=f.dataset.f;b.querySelectorAll('[data-f]').forEach(x=>x.classList.toggle('on',x===f));pint();return}
      if(e.target.closest('#pdMvReset')){env=new Set();try{localStorage.setItem(KENV,'[]')}catch(_){}pint();return}
      const a=e.target.closest('a[data-t]');if(a){env.add(a.dataset.t);try{localStorage.setItem(KENV,JSON.stringify([...env]))}catch(_){}setTimeout(pint,300)}};
  }

  /* =================== 7. Ranking =================== */
  async function ranking(dias){
    dias=dias||30;const b=hoja('Ranking');if(!b)return;b.innerHTML='<p class="pdCtlMuted">Cargando…</p>';
    const desde=new Date(Date.now()-dias*864e5).toISOString();
    let r=await db().from('pedidos').select('id,estado,negocio_id,motorizado_id,subtotal,total,creado_en,negocio_aceptado_en,asignado_en,aceptado_en,listo_para_recojo_en,en_camino_en,entregado_en,tiempo_preparacion_min,cancelado_por,no_entregado').gte('creado_en',desde).limit(8000);
    if(r.error)r=await db().from('pedidos').select('id,estado,negocio_id,motorizado_id,subtotal,total,creado_en,negocio_aceptado_en,asignado_en,aceptado_en,listo_para_recojo_en,en_camino_en,entregado_en,tiempo_preparacion_min').gte('creado_en',desde).limit(8000);
    if(r.error){b.innerHTML='<p class="pdCtlErr">'+E(r.error.message)+'</p>';return}
    const [ng,cal]=await Promise.all([db().from('negocios').select('id,nombre'),db().from('calificaciones').select('negocio_id,motorizado_id,estrellas_negocio,estrellas_motorizado').gte('creado_en',desde)]);
    const nN=id=>((ng.data||[]).find(n=>String(n.id)===String(id))||{}).nombre||'Negocio',mN=id=>(MO().find(m=>String(m.id)===String(id))||{}).nombre_completo||'Motorizado';
    const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;const mins=(a,c)=>a&&c?(T(c)-T(a))/60000:null;const ok2=x=>x!=null&&x>=0&&x<300;
    const agr=(key)=>{const g=new Map();(r.data||[]).forEach(p=>{const k=p[key];if(!k)return;const x=g.get(String(k))||{id:String(k),P:[]};x.P.push(p);g.set(String(k),x)});return [...g.values()]};
    const estr=(k,id)=>avg((cal.data||[]).filter(c=>String(c[k+'_id'])===id&&Number(c['estrellas_'+k])>0).map(c=>Number(c['estrellas_'+k])));
    const negs=agr('negocio_id').map(x=>{const e=x.P.filter(p=>est(p)==='entregado');return {n:nN(x.id),ped:x.P.length,venta:e.reduce((s,p)=>s+(Number(p.subtotal)||0),0),acep:avg(x.P.map(p=>mins(p.creado_en,p.negocio_aceptado_en)).filter(ok2)),prep:avg(x.P.map(p=>mins(p.negocio_aceptado_en,p.listo_para_recojo_en)).filter(ok2)),anul:x.P.filter(p=>est(p)==='cancelado'&&p.cancelado_por==='negocio').length,est:estr('negocio',x.id)}});
    const motos=agr('motorizado_id').map(x=>{const e=x.P.filter(p=>est(p)==='entregado');return {n:mN(x.id),ent:e.length,acep:avg(x.P.map(p=>mins(p.asignado_en,p.aceptado_en)).filter(ok2)),viaje:avg(e.map(p=>mins(p.en_camino_en,p.entregado_en)).filter(ok2)),noE:x.P.filter(p=>p.no_entregado).length,est:estr('motorizado',x.id)}});
    const f=(v,s)=>v==null?'—':Math.round(v)+(s||' min');const st=v=>v==null?'—':'★ '+v.toFixed(1);
    b.innerHTML='<div class="pdChips">'+[7,30,90].map(d=>'<button type="button" data-d="'+d+'" class="'+(d===dias?'on':'')+'">'+d+' días</button>').join('')+'</div>'
      +'<div class="pdCtlLbl">Negocios (por ventas)</div>'+(negs.sort((a,c)=>c.venta-a.venta).map((x,i)=>'<div class="pdRank"><span class="pdRankN">'+(i+1)+'</span><div class="pdCtlTx"><strong>'+E(x.n)+'</strong><small>'+x.ped+' pedidos · acepta en '+f(x.acep)+' · prepara en '+f(x.prep)+' · anuló '+x.anul+' · '+st(x.est)+'</small></div><b>'+M(x.venta)+'</b></div>').join('')||'<p class="pdCtlMuted">Sin datos.</p>')
      +'<div class="pdCtlLbl">Motorizados (por entregas)</div>'+(motos.sort((a,c)=>c.ent-a.ent).map((x,i)=>'<div class="pdRank"><span class="pdRankN">'+(i+1)+'</span><div class="pdCtlTx"><strong>'+E(x.n)+'</strong><small>acepta en '+f(x.acep)+' · viaje '+f(x.viaje)+' · no entregados '+x.noE+' · '+st(x.est)+'</small></div><b>'+x.ent+'</b></div>').join('')||'<p class="pdCtlMuted">Sin datos.</p>')
      +'<p class="pdCtlMuted">Tiempos promedio. «Acepta en» cuenta desde que llega el pedido (negocio) o desde que se le asigna (motorizado).</p>';
    b.onclick=e=>{const d=e.target.closest('[data-d]');if(d)ranking(+d.dataset.d)};
  }

  /* =================== 8. Registro de acciones =================== */
  async function registro(){
    const b=hoja('Registro de acciones');if(!b)return;b.innerHTML='<p class="pdCtlMuted">Cargando…</p>';
    const [a,c,pf]=await Promise.all([db().from('acciones_admin').select('*').order('creado_en',{ascending:false}).limit(300),
      db().from('pedidos_cambios').select('*').in('rol',['administrador','admin']).order('creado_en',{ascending:false}).limit(300),
      db().from('perfiles').select('id,nombre_completo').eq('rol','administrador')]);
    if(a.error&&faltaMigrar(a.error)&&c.error){b.innerHTML=AVISO_MIG;return}
    const quien=id=>((pf.data||[]).find(p=>String(p.id)===String(id))||{}).nombre_completo||'Administrador';
    const TAB={movimientos_caja:'Caja',negocios:'Negocio',motorizados:'Motorizado',clientes_bloqueados:'Lista negra',ajustes:'Ajustes',productos_negocio:'Producto'};
    const ACC={insert:'creó',update:'editó',delete:'borró'};
    const rows=(a.data||[]).map(x=>({t:x.creado_en,u:x.usuario_id,txt:(TAB[x.tabla]||x.tabla)+' · '+(ACC[x.accion]||x.accion),det:x.detalle||''}))
      .concat((c.data||[]).map(x=>({t:x.creado_en,u:x.usuario_id,txt:'Pedido '+ref(x.pedido_id)+' · '+x.campo,det:(x.antes||'—')+' → '+(x.despues||'—')}))).sort((p,q)=>T(q.t)-T(p.t));
    let q='';
    const pint=()=>{const Ls=rows.filter(r=>!q||(r.txt+' '+r.det+' '+quien(r.u)).toLowerCase().includes(q));$('pdRgL').innerHTML=Ls.length?Ls.slice(0,200).map(r=>'<div class="pdCtlRow"><div class="pdCtlTx"><strong>'+E(r.txt)+'</strong><small>'+E(quien(r.u))+' · '+E(fH(r.t))+(r.det?' · '+E(r.det.slice(0,180)):'')+'</small></div></div>').join(''):'<p class="pdCtlVacio">Sin acciones registradas todavía.</p>'};
    b.innerHTML='<p class="pdCtlMuted">Todo lo que hace cada administrador en pedidos, caja, negocios, motorizados, productos y lista negra.</p><input id="pdRgQ" placeholder="Buscar (pedido, negocio, administrador…)"><div id="pdRgL"></div>';
    $('pdRgQ').oninput=e=>{q=e.target.value.trim().toLowerCase();pint()};pint();
  }

  window.pdAdmMej={asignacionAuto,listaNegra,masivos,ranking,registro,ficha};
  let n=0;
  setInterval(()=>{if(!document.querySelector('#appView:not(.hidden)')||!db())return;n++;
    try{panelHoy()}catch(e){}try{mapaPedidos()}catch(e){}
    if(n%6===3)autoTick().catch(()=>{});
  },5000);
})();
