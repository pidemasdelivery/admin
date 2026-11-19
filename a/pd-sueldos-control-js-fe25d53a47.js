
/* ===== antes sueldos-control.js ===== */
/* ===== Pidemás · Control de sueldos (admin) =====
   Cierre de quincena + boleta · Asistencia por GPS y tardanzas · Justificaciones · Préstamos en cuotas
   · Historial de cambios · Planilla */
(function(){
  if(window.__pdSueldoCtl)return;window.__pdSueldoCtl=1;
  const $=id=>document.getElementById(id);
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const M=n=>'S/ '+(Number(n)||0).toFixed(2);
  const r2=n=>Math.round((Number(n)||0)*100)/100;
  const db=()=>window.db;
  const S=()=>window.PdSueldo;
  const st=()=>window.__pdsl||{};
  const fD=i=>{try{return S().parse(i).toLocaleDateString('es-PE',{day:'2-digit',month:'short'})}catch(e){return i}};
  const ok=t=>(window.pdExito||window.pdAviso||alert)(t);
  const hoja=t=>window.pdCtl&&pdCtl.hoja?pdCtl.hoja(t):null;
  const hm=t=>{const [h,m]=String(t||'').split(':').map(Number);return h*60+(m||0)};
  const fmtMin=m=>S()?S().fmtTime(m):m;

  /* ---------- datos por motorizado ---------- */
  let cierres=[],prestamos=[],justif=[],revisadas=[],gps=[],tard={tolerancia:10,cada:15,monto:2},cargado='';
  async function cargar(force){
    const s=st();if(!s.current||!db())return false;const k=String(s.current.id);if(cargado===k&&!force)return true;cargado=k;
    const cfg=s.res&&s.res.cfg;const P=s.res&&s.res.current;
    const [c,p,j,a,t]=await Promise.all([
      db().from('quincenas_cerradas').select('*').eq('motorizado_id',k).order('inicio',{ascending:false}),
      db().from('prestamos').select('*').eq('motorizado_id',k).order('creado_en',{ascending:false}),
      db().from('justificaciones').select('*').eq('motorizado_id',k).order('fecha',{ascending:false}).limit(30),
      db().from('asistencia_revisada').select('*').eq('motorizado_id',k),
      db().from('ajustes_pidemas').select('valor').eq('clave','tardanza').maybeSingle()]);
    cierres=c.data||[];prestamos=p.data||[];justif=j.data||[];revisadas=a.data||[];if(t.data&&t.data.valor)tard=Object.assign(tard,t.data.valor);
    gps=[];if(P&&P.start&&cfg&&!cfg.hourly){const g=await db().rpc('asistencia_gps',{p_moto:k,p_desde:P.start,p_hasta:P.end});gps=g.data||[]}
    return true;
  }
  const cierreDe=key=>cierres.find(c=>c.periodo===key);
  const cuotasDe=pid=>(st().rows||[]).filter(r=>String(r.prestamo_id||'')===String(pid));

  /* ---------- tarjetas ---------- */
  function tarjeta(id,after){let c=$(id);if(!c){c=document.createElement('section');c.className='pdslCard';c.id=id;const ref=$(after);if(ref)ref.insertAdjacentElement('afterend',c);else{const b=$('pdslBody');b&&b.appendChild(c)}}return c}
  async function pintar(){
    const s=st();if(!s.current||!s.res)return;
    if(!(await cargar()))return;
    pintarQuincenas();pintarAsistencia();pintarPrestamos();
  }
  function pintarQuincenas(){
    const s=st(),res=s.res;const c=tarjeta('pdscQuin','pdslHero');
    if(!res.ok){c.hidden=true;return}c.hidden=false;
    const L=(res.periods||[]).filter(P=>P.earned>0.004||P.paid>0.004||cierreDe(P.key)).slice(0,4);
    c.innerHTML='<div class="pdslHead"><span><span class="pdslKick">Quincenas</span><strong>Cierre y boletas</strong></span><button type="button" class="pdslLink" data-sc="hist">Historial de cambios</button></div>'
      +(L.length?L.map(P=>{const q=cierreDe(P.key);const est=q?(q.recibido_conforme_en?'<span class="pdcjRev ok">Cerrada · recibió conforme</span>':'<span class="pdcjRev pend">Cerrada · falta su conforme</span>'):'<span class="pdcjRev">Abierta</span>';
        const pend=q?Math.max(0,r2(q.ganado-q.descuentos-P.paid)):Math.max(0,P.balance);
        return '<div class="pdscQ"><div class="pdscQTx"><strong>'+E(P.label.charAt(0).toUpperCase()+P.label.slice(1))+'</strong>'+est+'<small>Ganado '+M(q?q.ganado:P.earned)+' · desc. '+M(q?q.descuentos:P.desc)+' · pagado '+M(P.paid)+' · pendiente '+M(pend)+'</small></div><div class="pdscQBtns">'
          +(q?'<button type="button" class="pdcjAct" data-sc="boleta" data-k="'+E(P.key)+'">Boleta</button><button type="button" class="pdcjAct bad" data-sc="reabrir" data-k="'+E(P.key)+'">Reabrir</button>':'<button type="button" class="pdcjAct fuerte" data-sc="cerrar" data-k="'+E(P.key)+'">Cerrar quincena</button>')+'</div></div>'}).join(''):'<p class="pdslNote">Aún no hay quincenas con sueldo.</p>')
      +'<p class="pdslNote">Al cerrar, los días, faltas y descuentos de esa quincena quedan congelados (los pagos se pueden seguir registrando). El motorizado ve su boleta y toca «Recibí conforme».</p>';
  }
  function pintarAsistencia(){
    const s=st(),res=s.res;const c=tarjeta('pdscAsis','pdslAttCard');
    if(!res.ok||res.hourly){c.hidden=true;return}c.hidden=false;
    const cfg=res.cfg,start=cfg.times.start,end=cfg.times.end;const P=res.current;const g=new Map(gps.map(x=>[String(x.fecha).slice(0,10),x]));const rv=new Map(revisadas.map(x=>[String(x.fecha).slice(0,10),x]));
    const dias=(P.days||[]).filter(d=>!d.adjDay&&d.work&&(d.status==='trabajado'||d.status==='hoy'));
    const filas=dias.slice().reverse().map(d=>{const x=g.get(d.date),r=rv.get(d.date);let estado,tarde=0,acc='';
      if(!x){estado=d.status==='hoy'?'<span class="pdcjRev">Aún sin conexión hoy</span>':'<span class="pdcjRev bad">Sin conexión GPS</span>';
        if(d.status!=='hoy'&&!r)acc='<button type="button" class="pdcjAct bad" data-sc="falta" data-f="'+d.date+'">Marcar falta</button><button type="button" class="pdcjAct" data-sc="perdonar" data-f="'+d.date+'">Estuvo (perdonar)</button>'}
      else{tarde=Math.max(0,hm(x.primera)-start-(Number(tard.tolerancia)||0));
        estado=tarde>0?'<span class="pdcjRev pend">Tarde '+tarde+' min</span>':'<span class="pdcjRev ok">A tiempo</span>';
        if(tarde>0&&!r){const monto=r2(Math.ceil(tarde/(Number(tard.cada)||15))*(Number(tard.monto)||0));acc='<button type="button" class="pdcjAct fuerte" data-sc="tardanza" data-f="'+d.date+'" data-min="'+tarde+'" data-m="'+monto+'">Descontar '+M(monto)+'</button><button type="button" class="pdcjAct" data-sc="perdonar" data-f="'+d.date+'">Perdonar</button>'}}
      if(r)acc='<span class="pdcjRev '+(r.decision==='perdonado'?'ok':'bad')+'">'+(r.decision==='perdonado'?'Perdonado':r.decision==='falta'?'Falta registrada':'Tardanza descontada')+'</span>';
      const ent=x?String(x.primera).slice(0,5):'—',sal=x?String(x.ultima).slice(0,5):'—';
      return '<div class="pdscA"><div class="pdscATx"><strong>'+E(fD(d.date))+' · '+E(d.label)+'</strong>'+estado+'<small>Primera conexión '+E(ent)+' · última '+E(sal)+' · horario '+E(fmtMin(start))+' – '+E(fmtMin(end))+'</small></div>'+(acc?'<div class="pdscQBtns">'+acc+'</div>':'')+'</div>'}).join('');
    const jl=justif.slice(0,6).map(j=>'<div class="pdscJ"><strong>'+E(fD(String(j.fecha).slice(0,10)))+' · '+E(j.motivo)+'</strong>'+(j.foto_url?'<a class="pdcjAct" target="_blank" rel="noopener" href="'+E(j.foto_url)+'">Ver justificante</a>':'')+(j.visto_en?'':'<button type="button" class="pdcjAct" data-sc="visto" data-id="'+E(j.id)+'">Marcar como visto</button>')+'</div>').join('');
    c.innerHTML='<div class="pdslHead"><span><span class="pdslKick">Asistencia por GPS</span><strong>Puntualidad de la quincena</strong></span><button type="button" class="pdslLink" data-sc="cfgtard">Tardanzas</button></div>'
      +'<p class="pdslNote">Según la primera conexión de su app cada día. Tolerancia '+(Number(tard.tolerancia)||0)+' min · se descuenta '+M(tard.monto)+' por cada '+(Number(tard.cada)||15)+' min de retraso.</p>'
      +(filas||'<p class="pdslNote">Todavía no hay días trabajados en esta quincena.</p>')
      +(jl?'<div class="pdslKick" style="margin-top:12px">Justificaciones enviadas</div><p class="pdslNote">Las faltas se descuentan igual; la justificación queda como registro.</p>'+jl:'');
  }
  function pintarPrestamos(){
    const s=st();const c=tarjeta('pdscPres','pdscAsis');
    const act=prestamos.map(p=>{const cu=cuotasDe(p.id),pag=cu.reduce((a,r)=>a+(Number(r.monto)||0),0);return {p,n:cu.length,pag:r2(pag),rest:r2(p.monto-pag)}});
    const P=s.res&&s.res.current;
    c.innerHTML='<div class="pdslHead"><span><span class="pdslKick">Préstamos</span><strong>Préstamos en cuotas</strong></span></div>'
      +(act.length?act.map(x=>{const fin=x.rest<=0.004||!x.p.activo;const ya=P&&cuotasDe(x.p.id).some(r=>String(r.periodo)===String(P.key));
        return '<div class="pdscQ"><div class="pdscQTx"><strong>'+M(x.p.monto)+' en '+x.p.cuotas+' cuota'+(x.p.cuotas===1?'':'s')+(x.p.motivo?' · '+E(x.p.motivo):'')+'</strong>'+(fin?'<span class="pdcjRev ok">Pagado</span>':'<span class="pdcjRev pend">Faltan '+M(x.rest)+'</span>')+'<small>Cuotas descontadas: '+x.n+' de '+x.p.cuotas+' · '+M(x.pag)+'</small></div>'
          +(fin?'':'<div class="pdscQBtns">'+(ya?'<span class="pdcjRev ok">Cuota de esta quincena aplicada</span>':'<button type="button" class="pdcjAct fuerte" data-sc="cuota" data-id="'+E(x.p.id)+'">Descontar cuota ahora</button>')+'<button type="button" class="pdcjAct bad" data-sc="anular" data-id="'+E(x.p.id)+'">Anular saldo</button></div>')+'</div>'}).join(''):'<p class="pdslNote">Sin préstamos.</p>')
      +'<div class="pdslTwo"><div class="pdslField"><label for="pdscPMonto">Monto prestado (S/)</label><input type="number" id="pdscPMonto" min="1" step="1" inputmode="decimal"></div><div class="pdslField"><label for="pdscPCuotas">Cuotas (quincenas)</label><input type="number" id="pdscPCuotas" min="1" max="24" step="1" value="2" inputmode="numeric"></div></div>'
      +'<div class="pdslField"><label for="pdscPMotivo">Motivo</label><input id="pdscPMotivo" maxlength="80" placeholder="Ej. Reparación de la moto"></div>'
      +'<button type="button" class="pdslBtn" data-sc="prestar">Registrar préstamo</button><p class="pdslNote">Cada quincena, al cerrarla, se descuenta una cuota automáticamente.</p>';
  }

  /* ---------- acciones ---------- */
  function cuotaMonto(p){const cu=cuotasDe(p.id),pag=cu.reduce((a,r)=>a+(Number(r.monto)||0),0),rest=r2(p.monto-pag);if(rest<=0.004)return 0;const base=r2(p.monto/p.cuotas);return cu.length+1>=p.cuotas?rest:Math.min(base,rest)}
  async function aplicarCuota(p,P){
    const m=cuotaMonto(p);if(m<=0)return false;const n=cuotasDe(p.id).length+1;
    const {error}=await db().from('control_sueldos').insert({motorizado_id:p.motorizado_id,fecha:P.end<=S().todayIso()?P.end:S().todayIso(),tipo:'descuento',monto:m,descripcion:'Cuota de préstamo '+n+'/'+p.cuotas+(p.motivo?' · '+p.motivo:''),periodo:P.key,prestamo_id:p.id});
    if(error)throw error;return true;
  }
  async function cerrarQ(key){
    const s=st();let P=(s.res.periods||[]).find(x=>x.key===key);if(!P)return;
    if(P.isCurrent&&S().todayIso()<P.end&&!(await pdConfirmar('Esta quincena todavía no termina (hasta el '+fD(P.end)+'). ¿Cerrarla igual?')))return;
    if(P.needsDesc&&!P.descSet&&!(await pdConfirmar('Falta registrar el descuento AFP/ONP de fin de mes. ¿Cerrar sin él?')))return;
    /* cuotas de préstamo pendientes de esta quincena */
    let n=0;for(const p of prestamos.filter(p=>p.activo)){if(!cuotasDe(p.id).some(r=>String(r.periodo)===key)){if(await aplicarCuota(p,P))n++}}
    if(n){await s.reload();P=(st().res.periods||[]).find(x=>x.key===key)}
    const gas=st().res.hourly?r2(P.gasTotal):r2(P.gasDays*S().GAS);
    const det={label:P.label,dias:P.worked+P.adj,descansos:P.rest,faltas:P.faltas,horas:P.hours,sueldo:r2(P.earned-gas),gasolina:gas,descuentos:(P.descRows||[]).map(r=>({d:r.descripcion,m:Number(r.monto)})),pagos:(P.payments||[]).map(r=>({f:r.fecha,d:r.descripcion,m:Number(r.monto)}))};
    if(!(await pdConfirmar('¿Cerrar la '+P.label+'?\nGanado '+M(P.earned)+' · descuentos '+M(P.desc)+' · pagado '+M(P.paid)+' · pendiente '+M(Math.max(0,P.balance))+(n?'\nSe descontó '+n+' cuota'+(n===1?'':'s')+' de préstamo.':''))))return;
    const u=(await db().auth.getUser()).data.user;
    const {error}=await db().from('quincenas_cerradas').insert({motorizado_id:s.current.id,periodo:key,inicio:P.start,fin:P.end,ganado:r2(P.earned),descuentos:r2(P.desc),pagado:r2(P.paid),pendiente:r2(Math.max(0,P.balance)),detalle:det,cerrado_por:u&&u.id});
    if(error){pdAviso('No se pudo cerrar: '+error.message);return}
    if(s.current.usuario_id)try{await db().from('notificaciones').insert({usuario_id:s.current.usuario_id,tipo:'sistema',titulo:'Tu boleta está lista',mensaje:'Se cerró tu '+P.label+'. Revisa tu boleta y toca «Recibí conforme».'})}catch(_){}
    ok('Quincena cerrada.');cargado='';await s.reload();
  }
  function boletaTxt(q,nom){const d=q.detalle||{};return ['*PIDEMÁS DELIVERY · Boleta de pago*',nom,(d.label||q.periodo),'','Días pagados: '+(d.dias||0)+(d.descansos?' + '+d.descansos+' descanso(s)':'')+(d.faltas?' · faltas: '+d.faltas:''),'Sueldo: '+M(d.sueldo),'Gasolina: '+M(d.gasolina),'*Ganado: '+M(q.ganado)+'*',...(d.descuentos||[]).map(x=>'− '+x.d+': '+M(x.m)),...(d.pagos||[]).map(x=>'Pago '+fD(x.f)+': '+M(x.m)),'*Pendiente: '+M(q.pendiente)+'*',q.recibido_conforme_en?'✓ Recibió conforme':''].filter(x=>x!==undefined).join('\n')}
  function boleta(key){
    const s=st(),q=cierreDe(key);if(!q)return;const d=q.detalle||{};const nom=s.current.nombre_completo||'Motorizado';
    const b=hoja('Boleta de pago');if(!b)return;
    const row=(l,v,c)=>'<div class="pdscBRow'+(c?' '+c:'')+'"><span>'+l+'</span><b>'+v+'</b></div>';
    b.innerHTML='<div class="pdscBol"><div class="pdscBolTop"><strong>Pidemás Delivery</strong><span>Boleta de pago</span></div><div class="pdscBolWho"><b>'+E(nom)+'</b><small>'+E(d.label||q.periodo)+'</small></div>'
      +row('Días pagados',(d.dias||0)+(d.descansos?' + '+d.descansos+' desc.':''))+(d.faltas?row('Faltas',d.faltas):'')+row('Sueldo',M(d.sueldo))+row('Gasolina',M(d.gasolina))+row('Ganado',M(q.ganado),'tot')
      +(d.descuentos||[]).map(x=>row(E(x.d||'Descuento'),'− '+M(x.m),'neg')).join('')+(d.pagos||[]).map(x=>row('Pago '+E(fD(x.f)),M(x.m))).join('')+row('Pendiente',M(q.pendiente),'fin')
      +'<p class="pdscBolEst">'+(q.recibido_conforme_en?'✓ Recibió conforme el '+new Date(q.recibido_conforme_en).toLocaleString('es-PE',{timeZone:'America/Lima',day:'2-digit',month:'short',hour:'numeric',minute:'2-digit'}):'Esperando que el motorizado confirme «Recibí conforme».')+'</p></div>'
      +'<a class="pdCtlWa big" target="_blank" rel="noopener" href="https://wa.me/'+((s.current.telefono||'').replace(/\D/g,'').replace(/^(\d{9})$/,'51$1'))+'?text='+encodeURIComponent(boletaTxt(q,nom))+'">Enviar boleta por WhatsApp</a>';
  }
  async function historial(){
    const s=st();const b=hoja('Historial de cambios · sueldo');if(!b)return;
    const {data,error}=await db().from('control_sueldos_historial').select('*').eq('motorizado_id',s.current.id).order('creado_en',{ascending:false}).limit(80);
    if(error){b.innerHTML='<p class="pdCtlErr">'+E(error.message)+'</p>';return}
    const T={jornada:'Jornada',falta:'Falta',pago:'Pago',descuento:'Descuento'};
    b.innerHTML=(data||[]).length?(data||[]).map(h=>{const x=h.despues||h.antes||{},a=h.antes||{};const tipo=T[String(x.tipo||'').toLowerCase()]||x.tipo||'Registro';
      return '<div class="pdCtlRow"><div class="pdCtlTx"><strong>'+E(tipo)+' '+E(h.accion)+(x.fecha?' · '+E(fD(String(x.fecha).slice(0,10))):'')+'</strong><small>'+E(new Date(h.creado_en).toLocaleString('es-PE',{timeZone:'America/Lima',day:'2-digit',month:'short',hour:'numeric',minute:'2-digit'}))+' · '+(h.es_admin?'Administración':'Sistema / motorizado')+(x.monto!=null?' · '+M(x.monto):'')+(h.accion==='editado'&&a.monto!=null&&String(a.monto)!==String(x.monto)?' (antes '+M(a.monto)+')':'')+(x.descripcion?' · '+E(x.descripcion):'')+'</small></div></div>'}).join(''):'<p class="pdCtlVacio">Sin cambios registrados todavía.</p>';
  }
  async function cfgTard(){
    const b=hoja('Tardanzas');if(!b)return;
    b.innerHTML='<p class="pdCtlMuted">Se compara la primera conexión de su app con la hora de entrada.</p><label class="pdCtlLbl">Tolerancia (minutos sin descuento)<input type="number" id="pdscT1" min="0" step="1" value="'+E(tard.tolerancia)+'"></label><label class="pdCtlLbl">Cada cuántos minutos de retraso<input type="number" id="pdscT2" min="1" step="1" value="'+E(tard.cada)+'"></label><label class="pdCtlLbl">Se descuenta (S/)<input type="number" id="pdscT3" min="0" step="0.5" value="'+E(tard.monto)+'"></label><button type="button" class="pdCtlBtn" id="pdscTOk">Guardar</button>';
    $('pdscTOk').onclick=async()=>{const v={tolerancia:Math.max(0,Math.round(+$('pdscT1').value||0)),cada:Math.max(1,Math.round(+$('pdscT2').value||15)),monto:Math.max(0,r2($('pdscT3').value))};
      const {error}=await db().from('ajustes_pidemas').upsert({clave:'tardanza',valor:v,actualizado_en:new Date().toISOString()});if(error){pdAviso(error.message);return}tard=v;ok('Tardanzas guardadas.');pdCtl.cerrarHoja();pintarAsistencia()};
  }
  document.addEventListener('click',async e=>{
    const b=e.target.closest&&e.target.closest('[data-sc]');if(!b||!b.closest('#pdslBody'))return;
    const s=st();if(!s.current)return;const a=b.dataset.sc;
    try{
      if(a==='cerrar')return await cerrarQ(b.dataset.k);
      if(a==='boleta')return boleta(b.dataset.k);
      if(a==='hist')return historial();
      if(a==='cfgtard')return cfgTard();
      if(a==='reabrir'){if(!(await pdConfirmar('¿Reabrir esta quincena? Se podrán volver a cambiar días, faltas y descuentos, y el motorizado tendrá que confirmar otra vez.')))return;const q=cierreDe(b.dataset.k);const {error}=await db().from('quincenas_cerradas').delete().eq('id',q.id);if(error)throw error;ok('Quincena reabierta.');cargado='';return s.reload()}
      if(a==='tardanza'){const f=b.dataset.f,mn=+b.dataset.min,m=+b.dataset.m;if(!(await pdConfirmar('¿Descontar '+M(m)+' por llegar '+mn+' min tarde el '+fD(f)+'?')))return;
        const r=await db().from('control_sueldos').insert({motorizado_id:s.current.id,fecha:f,tipo:'descuento',monto:m,descripcion:'Tardanza '+fD(f)+' · '+mn+' min',periodo:S().periodOf(f).key});if(r.error)throw r.error;
        await db().from('asistencia_revisada').upsert({motorizado_id:s.current.id,fecha:f,decision:'tardanza',minutos:mn});ok('Tardanza descontada.');cargado='';return s.reload()}
      if(a==='falta'){const f=b.dataset.f;if(!(await pdConfirmar('¿Registrar falta el '+fD(f)+'? No tuvo ninguna conexión ese día.')))return;
        const r=await db().from('control_sueldos').insert({motorizado_id:s.current.id,fecha:f,tipo:'falta',monto:0,descripcion:'Sin conexión GPS',periodo:S().periodOf(f).key});if(r.error)throw r.error;
        await db().from('asistencia_revisada').upsert({motorizado_id:s.current.id,fecha:f,decision:'falta'});ok('Falta registrada.');cargado='';return s.reload()}
      if(a==='perdonar'){const {error}=await db().from('asistencia_revisada').upsert({motorizado_id:s.current.id,fecha:b.dataset.f,decision:'perdonado'});if(error)throw error;cargado='';await cargar(true);return pintarAsistencia()}
      if(a==='visto'){const {error}=await db().from('justificaciones').update({visto_en:new Date().toISOString()}).eq('id',b.dataset.id);if(error)throw error;cargado='';await cargar(true);return pintarAsistencia()}
      if(a==='prestar'){const m=r2($('pdscPMonto').value),c=Math.round(+$('pdscPCuotas').value||0),mo=$('pdscPMotivo').value.trim();if(!(m>0)||!(c>=1&&c<=24)){pdAviso('Escribe el monto y de 1 a 24 cuotas.');return}
        if(!(await pdConfirmar('¿Registrar préstamo de '+M(m)+' en '+c+' cuota'+(c===1?'':'s')+' de '+M(m/c)+'?')))return;
        const {error}=await db().from('prestamos').insert({motorizado_id:s.current.id,monto:m,cuotas:c,motivo:mo||null});if(error)throw error;ok('Préstamo registrado.');cargado='';await cargar(true);return pintarPrestamos()}
      if(a==='cuota'){const p=prestamos.find(x=>String(x.id)===b.dataset.id);if(!p)return;if(!(await pdConfirmar('¿Descontar '+M(cuotaMonto(p))+' de esta quincena?')))return;await aplicarCuota(p,s.res.current);ok('Cuota descontada.');cargado='';return s.reload()}
      if(a==='anular'){if(!(await pdConfirmar('¿Anular el saldo pendiente de este préstamo? Ya no se descontarán más cuotas.')))return;const {error}=await db().from('prestamos').update({activo:false}).eq('id',b.dataset.id);if(error)throw error;cargado='';await cargar(true);return pintarPrestamos()}
    }catch(err){pdAviso(String(err&&err.message||err))}
  });
  document.addEventListener('pdsl:render',()=>{pintar().catch(e=>console.warn('sueldos-control',e))});

  /* ---------- planilla ---------- */
  window.pdPlanilla=async function(sel){
    const b=hoja('Planilla de sueldos');if(!b)return;const Sx=S();
    const hoy=Sx.todayIso(),cur=Sx.periodOf(hoy);const prev=Sx.periodOf(Sx.iso(new Date(Sx.parse(cur.start).getTime()-864e5)));const prev2=Sx.periodOf(Sx.iso(new Date(Sx.parse(prev.start).getTime()-864e5)));
    const opts=[cur,prev,prev2];const key=sel||cur.key;
    const [mr,sr,cr]=await Promise.all([db().from('motorizados').select('*').order('nombre_completo'),db().from('control_sueldos').select('*'),db().from('quincenas_cerradas').select('*').eq('periodo',key)]);
    if(mr.error||sr.error){b.innerHTML='<p class="pdCtlErr">No se pudo leer: '+E((mr.error||sr.error).message)+'</p>';return}
    const by=new Map();(sr.data||[]).forEach(r=>{const k=String(r.motorizado_id);if(!by.has(k))by.set(k,[]);by.get(k).push(r)});
    const filas=(mr.data||[]).map(m=>{let res;try{res=Sx.calc(m,by.get(String(m.id))||[])}catch(e){return null}if(!res||!res.ok)return null;const P=res.periods.find(p=>p.key===key);if(!P||(P.earned<0.005&&P.paid<0.005))return null;
      const gas=res.hourly?r2(P.gasTotal):r2(P.gasDays*Sx.GAS);const q=(cr.data||[]).find(c=>String(c.motorizado_id)===String(m.id));
      return {n:m.nombre_completo||'Motorizado',sueldo:r2(P.earned-gas),gas,ganado:r2(P.earned),desc:r2(P.desc),pag:r2(P.paid),pend:r2(Math.max(0,P.balance)),q}}).filter(Boolean);
    const T=k=>r2(filas.reduce((s,f)=>s+f[k],0));
    const lab=(opts.find(o=>o.key===key)||cur).label;
    const csv=['Motorizado;Sueldo;Gasolina;Ganado;Descuentos;Pagado;Pendiente;Estado',...filas.map(f=>[f.n,f.sueldo,f.gas,f.ganado,f.desc,f.pag,f.pend,f.q?(f.q.recibido_conforme_en?'Cerrada - conforme':'Cerrada'):'Abierta'].join(';')),['TOTAL',T('sueldo'),T('gas'),T('ganado'),T('desc'),T('pag'),T('pend'),''].join(';')].join('\n');
    const txt=['*Planilla · '+lab+'*','',...filas.map(f=>'*'+f.n+'*: ganado '+M(f.ganado)+' · desc. '+M(f.desc)+' · pagado '+M(f.pag)+' · pendiente '+M(f.pend)),'','*Total ganado: '+M(T('ganado'))+'*','*Total pendiente: '+M(T('pend'))+'*'].join('\n');
    b.innerHTML='<label class="pdCtlLbl">Quincena<select id="pdPlaSel">'+opts.map(o=>'<option value="'+E(o.key)+'"'+(o.key===key?' selected':'')+'>'+E(o.label)+'</option>').join('')+'</select></label>'
      +'<div class="pdCtlStat"><span>Total ganado</span><b>'+M(T('ganado'))+'</b></div>'
      +'<div class="pdCtlGrid"><div><span>Sueldos</span><b>'+M(T('sueldo'))+'</b></div><div><span>Gasolina</span><b>'+M(T('gas'))+'</b></div><div><span>Descuentos</span><b>'+M(T('desc'))+'</b></div><div><span>Pendiente de pagar</span><b>'+M(T('pend'))+'</b></div></div>'
      +(filas.length?filas.map(f=>'<section class="pdCtlCard"><div class="pdCtlCardHd"><span><strong>'+E(f.n)+'</strong><small>Ganado '+M(f.ganado)+' · pagado '+M(f.pag)+'</small></span>'+(f.q?'<span class="pdcjRev ok">Cerrada</span>':'<span class="pdcjRev">Abierta</span>')+'</div><div class="pdCtlGrid"><div><span>Sueldo</span><b>'+M(f.sueldo)+'</b></div><div><span>Gasolina</span><b>'+M(f.gas)+'</b></div><div><span>Descuentos</span><b>'+M(f.desc)+'</b></div><div><span>Pendiente</span><b>'+M(f.pend)+'</b></div></div></section>').join(''):'<p class="pdCtlVacio">Sin sueldos en esta quincena.</p>')
      +'<div class="pdCtlDos"><a class="pdCtlBtn alt" id="pdPlaCsv" download="planilla-'+E(key)+'.csv" href="data:text/csv;charset=utf-8,'+encodeURIComponent('﻿'+csv)+'">Descargar Excel (CSV)</a><a class="pdCtlWa big" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(txt)+'">Compartir</a></div>';
    $('pdPlaSel').onchange=e=>window.pdPlanilla(e.target.value);
  };
})();

