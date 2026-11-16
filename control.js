/* ===== Pidemás · Control de caja (admin) =====
   Yape por confirmar · Por cobrar a negocios (con WhatsApp) · Cancelados con cobro (devolución)
   · Resumen del día · Alerta de caja alta */
(function(){
  if(window.pdCtl)return;
  const $=id=>document.getElementById(id);
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const M=n=>'S/ '+(Number(n)||0).toFixed(2);
  const r2=n=>Math.round((Number(n)||0)*100)/100;
  const ref=id=>'#'+String(id||'').slice(0,8).toUpperCase();
  const db=()=>window.db;
  const fecha=v=>{try{return new Date(v).toLocaleDateString('es-PE',{timeZone:'America/Lima',day:'2-digit',month:'short'})}catch(e){return ''}};
  const hoyLima=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Lima'});
  const diaLima=v=>new Date(v).toLocaleDateString('en-CA',{timeZone:'America/Lima'});
  const aviso=t=>(window.pdExito||window.pdAviso||alert)(t);
  const tel=t=>{const d=String(t||'').replace(/\D/g,'');if(!d)return '';return d.startsWith('51')?d:(d.length===9?'51'+d:d)};

  /* ---------- hoja (ventana desde abajo) ---------- */
  function hoja(titulo){
    cerrarHoja();
    const v=document.createElement('div');v.className='pdPwVelo pdCtlVelo';v.id='pdCtlVelo';
    v.innerHTML='<div class="pdPwHoja pdCtlHoja" role="dialog" aria-modal="true" aria-label="'+E(titulo)+'"><div class="pdPwTop"><strong>'+E(titulo)+'</strong><button type="button" class="pdPwX" aria-label="Cerrar">×</button></div><div class="pdCtlBody" id="pdCtlBody"><p class="pdCtlMuted">Cargando…</p></div></div>';
    document.body.appendChild(v);
    v.querySelector('.pdPwX').addEventListener('click',cerrarHoja);
    v.addEventListener('click',e=>{if(e.target===v)cerrarHoja()});
    return $('pdCtlBody');
  }
  function cerrarHoja(){const v=$('pdCtlVelo');if(v)v.remove()}
  document.addEventListener('keydown',e=>{if(e.key==='Escape')cerrarHoja()});

  let motos=[],negocios=[];
  async function base(){
    if(!motos.length){const r=await db().from('motorizados').select('id,nombre_completo,telefono,activo,usuario_id').order('nombre_completo');motos=r.data||[]}
    if(!negocios.length){const r=await db().from('negocios').select('id,nombre,telefono');negocios=r.data||[]}
  }
  const motoN=id=>(motos.find(m=>String(m.id)===String(id))||{}).nombre_completo||'Motorizado';

  /* =================== 1. Yape por confirmar =================== */
  async function yape(){
    const b=hoja('Yape por confirmar');await base();
    const desde=new Date(Date.now()-45*864e5).toISOString();
    const {data,error}=await db().from('cobros').select('id,pedido_id,motorizado_id,monto,confirmado_en,yape_recibido_en').eq('metodo_pago','yape').eq('confirmado',true).is('yape_recibido_en',null).gte('confirmado_en',desde).order('confirmado_en',{ascending:false}).limit(300);
    if(error){b.innerHTML='<p class="pdCtlErr">No se pudo leer: '+E(error.message)+'</p>';return}
    const ids=[...new Set((data||[]).map(c=>c.pedido_id).filter(Boolean))];
    let peds={};if(ids.length){const r=await db().from('pedidos').select('id,nombre_cliente,total,estado').in('id',ids);(r.data||[]).forEach(p=>peds[p.id]=p)}
    const L=(data||[]).filter(c=>{const p=peds[c.pedido_id];return !p||!['cancelado','rechazado'].includes(String(p.estado||'').toLowerCase())});
    const tot=L.reduce((s,c)=>s+(Number(c.monto)||0),0);
    b.innerHTML='<p class="pdCtlMuted">Cobros que el motorizado marcó como pagados por Yape. Revisa tu app de Yape y confirma cuando el dinero haya llegado al QR de Pidemás.</p>'
      +'<div class="pdCtlStat"><span>Por confirmar</span><b>'+L.length+' · '+M(tot)+'</b></div>'
      +(L.length?'<button type="button" class="pdCtlBtn alt" data-yall>Marcar todos como recibidos</button>':'')
      +(L.length?L.map(c=>{const p=peds[c.pedido_id]||{};return '<div class="pdCtlRow" data-c="'+E(c.id)+'"><div class="pdCtlTx"><strong>'+M(c.monto)+' · '+E(p.nombre_cliente||'Cliente')+'</strong><small>Pedido '+E(ref(c.pedido_id))+' · '+E(motoN(c.motorizado_id))+' · '+E(fecha(c.confirmado_en))+'</small></div><button type="button" class="pdCtlMini ok" data-yok="'+E(c.id)+'">Recibido</button></div>'}).join(''):'<p class="pdCtlVacio">No hay Yapes pendientes de confirmar.</p>');
    b.onclick=async e=>{
      const one=e.target.closest('[data-yok]'),all=e.target.closest('[data-yall]');if(!one&&!all)return;
      const ids=one?[one.dataset.yok]:L.map(c=>c.id);if(all&&!(await pdConfirmar('¿Marcar '+ids.length+' Yapes como recibidos?')))return;
      const u=(await db().auth.getUser()).data.user;
      const {error}=await db().from('cobros').update({yape_recibido_en:new Date().toISOString(),yape_recibido_por:u&&u.id}).in('id',ids);
      if(error){pdAviso('No se pudo guardar: '+error.message);return}
      aviso(ids.length===1?'Yape confirmado.':'Yapes confirmados.');yape();contar();
    };
  }

  /* =================== 2. Por cobrar a negocios =================== */
  async function porCobrar(){
    const b=hoja('Por cobrar a negocios');await base();
    const {data,error}=await db().from('pedidos').select('id,negocio_id,costo_delivery,nombre_cliente,entregado_en,creado_en').eq('pago_acordado','pagado').eq('estado','entregado').is('delivery_negocio_cobrado_en',null).order('creado_en',{ascending:true}).limit(1000);
    if(error){b.innerHTML='<p class="pdCtlErr">No se pudo leer: '+E(error.message)+'</p>';return}
    const g=new Map();(data||[]).forEach(p=>{const k=String(p.negocio_id||'');if(!g.has(k))g.set(k,[]);g.get(k).push(p)});
    const total=(data||[]).reduce((s,p)=>s+(Number(p.costo_delivery)||0),0);
    const opts='<option value="admin">Administración (me pagó directo)</option>'+motos.filter(m=>m.activo!==false).map(m=>'<option value="'+E(m.id)+'">'+E(m.nombre_completo)+' (va a su caja)</option>').join('');
    b.innerHTML='<p class="pdCtlMuted">Pedidos donde el cliente pagó todo al negocio: el negocio le debe el delivery a Pidemás.</p><div class="pdCtlStat"><span>Total por cobrar</span><b>'+M(total)+'</b></div>'
      +(g.size?[...g.entries()].map(([nid,L])=>{const n=negocios.find(x=>String(x.id)===nid)||{};const t=L.reduce((s,p)=>s+(Number(p.costo_delivery)||0),0);
        const msg=['Hola, '+(n.nombre||'')+' 👋','Te escribimos de *Pidemás Delivery*.','Tienes pendiente el pago del delivery de '+L.length+' pedido'+(L.length===1?'':'s')+':',...L.map(p=>'• '+ref(p.id)+' · '+fecha(p.entregado_en||p.creado_en)+' · '+M(p.costo_delivery)),'','*Total: '+M(t)+'*','¿Nos confirmas cuándo lo cancelas? ¡Gracias!'].join('\n');
        const w=tel(n.telefono);
        return '<section class="pdCtlCard" data-n="'+E(nid)+'"><div class="pdCtlCardHd"><span><strong>'+E(n.nombre||'Negocio')+'</strong><small>'+L.length+' pedido'+(L.length===1?'':'s')+' · '+M(t)+'</small></span>'+(w?'<a class="pdCtlWa" target="_blank" rel="noopener" href="https://wa.me/'+w+'?text='+encodeURIComponent(msg)+'">Recordar por WhatsApp</a>':'<span class="pdCtlMuted">Sin teléfono</span>')+'</div>'
          +L.map(p=>'<label class="pdCtlChk"><input type="checkbox" value="'+E(p.id)+'" checked><span>'+E(ref(p.id))+' · '+E(fecha(p.entregado_en||p.creado_en))+'</span><b>'+M(p.costo_delivery)+'</b></label>').join('')
          +'<div class="pdCtlPay"><label>¿Quién recibió el dinero?<select data-quien>'+opts+'</select></label><button type="button" class="pdCtlBtn" data-cobrar>Marcar como cobrado</button></div></section>'}).join(''):'<p class="pdCtlVacio">Ningún negocio te debe delivery. 🎉</p>');
    b.onclick=async e=>{
      const btn=e.target.closest('[data-cobrar]');if(!btn)return;const card=btn.closest('[data-n]');
      const ids=[...card.querySelectorAll('input[type=checkbox]:checked')].map(i=>i.value);if(!ids.length){pdAviso('Marca al menos un pedido.');return}
      const quien=card.querySelector('[data-quien]').value;const L=(data||[]).filter(p=>ids.includes(String(p.id)));const t=r2(L.reduce((s,p)=>s+(Number(p.costo_delivery)||0),0));
      const n=negocios.find(x=>String(x.id)===card.dataset.n)||{};
      if(!(await pdConfirmar('¿Registrar que '+(n.nombre||'el negocio')+' pagó '+M(t)+'?\n'+(quien==='admin'?'Lo recibiste tú directamente.':'Entra a la caja de '+motoN(quien)+'.'))))return;
      btn.disabled=true;
      try{
        const now=new Date().toISOString();
        const u=await db().from('pedidos').update({delivery_negocio_cobrado_en:now}).in('id',ids).select('id');if(u.error)throw u.error;
        if(quien!=='admin'){const rows=L.map(p=>({motorizado_id:quien,pedido_id:p.id,tipo:'ingreso',monto:r2(p.costo_delivery),descripcion:'COBRO DE DELIVERY A NEGOCIO · '+(n.nombre||'Negocio')+' · Pedido '+ref(p.id)}));const r=await db().from('movimientos_caja').insert(rows);if(r.error)throw r.error}
        aviso('Cobro registrado.');porCobrar();contar();
      }catch(err){pdAviso('No se pudo registrar: '+(err.message||err));btn.disabled=false}
    };
  }

  /* =================== 3. Cancelados con cobro en caja =================== */
  async function cancelados(){
    const {data,error}=await db().from('pedidos').select('id,nombre_cliente,total,estado,observaciones,motorizado_id,creado_en').in('estado',['cancelado','rechazado']).gte('creado_en',new Date(Date.now()-60*864e5).toISOString()).limit(500);
    if(error||!data||!data.length)return [];
    const ids=data.map(p=>p.id);
    const r=await db().from('movimientos_caja').select('id,pedido_id,motorizado_id,tipo,monto,descripcion').in('pedido_id',ids);
    const mv=r.data||[];
    return data.filter(p=>!/DEVOLUCION_REVISADA/.test(p.observaciones||'')).map(p=>{const ing=mv.filter(m=>String(m.pedido_id)===String(p.id)&&m.tipo==='ingreso'),dev=mv.some(m=>String(m.pedido_id)===String(p.id)&&m.tipo==='retiro'&&/^DEVOLUCI/i.test(m.descripcion||''));return {p,ing,cob:r2(ing.reduce((s,m)=>s+(Number(m.monto)||0),0)),dev}}).filter(x=>x.cob>0&&!x.dev);
  }
  async function devoluciones(){
    const b=hoja('Cancelados con cobro');await base();
    const L=await cancelados();
    b.innerHTML='<p class="pdCtlMuted">Pedidos anulados que ya tenían un cobro en la caja del motorizado. Indica si el dinero se le devolvió al cliente.</p>'
      +(L.length?L.map(x=>'<section class="pdCtlCard" data-p="'+E(x.p.id)+'"><div class="pdCtlTx"><strong>'+E(ref(x.p.id))+' · '+E(x.p.nombre_cliente||'Cliente')+'</strong><small>Cobrado '+M(x.cob)+' · caja de '+E(motoN(x.ing[0].motorizado_id))+' · '+E(fecha(x.p.creado_en))+'</small></div><div class="pdCtlDos"><button type="button" class="pdCtlBtn" data-dev="si">Sí, se devolvió</button><button type="button" class="pdCtlBtn alt" data-dev="no">No, el dinero se queda</button></div></section>').join(''):'<p class="pdCtlVacio">No hay pedidos anulados con cobro pendiente.</p>');
    b.onclick=async e=>{
      const btn=e.target.closest('[data-dev]');if(!btn)return;const id=btn.closest('[data-p]').dataset.p;const x=L.find(y=>String(y.p.id)===id);if(!x)return;
      btn.disabled=true;
      try{
        if(btn.dataset.dev==='si'){const r=await db().from('movimientos_caja').insert({motorizado_id:x.ing[0].motorizado_id,pedido_id:id,tipo:'retiro',monto:x.cob,descripcion:'DEVOLUCIÓN AL CLIENTE · Pedido '+ref(id)+' anulado'});if(r.error)throw r.error}
        const obs=String(x.p.observaciones||'');const r2_=await db().from('pedidos').update({observaciones:(obs?obs+' | ':'')+'DEVOLUCION_REVISADA'+(btn.dataset.dev==='si'?'':' (sin devolución)')}).eq('id',id);if(r2_.error)throw r2_.error;
        aviso(btn.dataset.dev==='si'?'Devolución registrada: se descontó de su caja.':'Listo: el cobro se queda en su caja.');devoluciones();contar();
      }catch(err){pdAviso('No se pudo guardar: '+(err.message||err));btn.disabled=false}
    };
  }

  /* =================== 4. Resumen del día + 5. Alerta de caja alta =================== */
  async function tope(){try{const {data}=await db().from('ajustes_pidemas').select('valor').eq('clave','caja_alerta').maybeSingle();return Number(data&&data.valor&&data.valor.monto)||0}catch(e){return 0}}
  async function todosMovs(){const rows=[];for(let f=0;;f+=1000){const {data,error}=await db().from('movimientos_caja').select('id,motorizado_id,pedido_id,tipo,monto,descripcion,creado_en,revision,recibido').order('creado_en',{ascending:false}).range(f,f+999);if(error)throw error;rows.push(...(data||[]));if(!data||data.length<1000||rows.length>50000)break}return rows}
  async function resumen(){
    const b=hoja('Resumen del día');await base();const C=window.PdCaja;
    let movs=[];try{movs=await todosMovs()}catch(e){b.innerHTML='<p class="pdCtlErr">No se pudo leer: '+E(e.message)+'</p>';return}
    const hoy=hoyLima(),ini=new Date(hoy+'T00:00:00-05:00').toISOString();
    const yp=await db().from('cobros').select('motorizado_id,monto').eq('metodo_pago','yape').gte('confirmado_en',ini);
    const T=await tope();
    const filas=motos.map(m=>{const all=movs.filter(x=>String(x.motorizado_id)===String(m.id));const L=all.filter(x=>diaLima(x.creado_en)===hoy);
      const s={ef:0,pg:0,ent:0,yape:0};L.forEach(x=>{const k=C.kind(x),a=C.amount(x);if(x.tipo==='ingreso'){if(k!=='fondo')s.ef+=a}else if(k==='entrega'||k==='liquidacion')s.ent+=(x.recibido!=null?Number(x.recibido):a);else if(k!=='reinicio')s.pg+=a});
      (yp.data||[]).filter(c=>String(c.motorizado_id)===String(m.id)).forEach(c=>s.yape+=Number(c.monto)||0);
      return {m,s,bal:C.balance(all),hay:L.length||s.yape>0}}).filter(f=>f.hay||Math.abs(f.bal)>0.004);
    const txt=['*Resumen del día · Pidemás Delivery*',new Date().toLocaleDateString('es-PE',{timeZone:'America/Lima',weekday:'long',day:'2-digit',month:'long'}),'',...filas.map(f=>'*'+f.m.nombre_completo+'*\nEfectivo '+M(f.s.ef)+' · Yape '+M(f.s.yape)+' · Pagos/gastos '+M(f.s.pg)+' · Entregó '+M(f.s.ent)+'\nSaldo en caja: '+M(f.bal)),'','*Total en cajas: '+M(filas.reduce((s,f)=>s+f.bal,0))+'*'].join('\n');
    b.innerHTML='<div class="pdCtlStat"><span>Total en cajas</span><b>'+M(filas.reduce((s,f)=>s+f.bal,0))+'</b></div>'
      +(filas.length?filas.map(f=>'<section class="pdCtlCard"><div class="pdCtlCardHd"><span><strong>'+E(f.m.nombre_completo)+'</strong><small>Saldo en caja '+M(f.bal)+'</small></span>'+(T>0&&f.bal>=T?'<span class="pdcjRev bad">Supera '+M(T)+'</span>':'')+'</div><div class="pdCtlGrid"><div><span>Efectivo</span><b>'+M(f.s.ef)+'</b></div><div><span>Yape</span><b>'+M(f.s.yape)+'</b></div><div><span>Pagos y gastos</span><b>'+M(f.s.pg)+'</b></div><div><span>Entregó</span><b>'+M(f.s.ent)+'</b></div></div></section>').join(''):'<p class="pdCtlVacio">Hoy todavía no hay movimientos.</p>')
      +'<a class="pdCtlWa big" target="_blank" rel="noopener" href="https://wa.me/?text='+encodeURIComponent(txt)+'">Compartir resumen por WhatsApp</a>';
  }
  async function alerta(){
    const b=hoja('Alerta de caja alta');const T=await tope();
    b.innerHTML='<p class="pdCtlMuted">Cuando la caja de un motorizado llegue a este monto, él verá un aviso para entregarte el efectivo, y en el Resumen del día se marcará en rojo. Deja 0 para desactivar.</p><label class="pdCtlLbl">Monto máximo en caja (S/)<input type="number" inputmode="decimal" min="0" step="10" id="pdCtlTope" value="'+E(T||'')+'"></label><button type="button" class="pdCtlBtn" id="pdCtlTopeOk">Guardar</button>';
    $('pdCtlTopeOk').onclick=async()=>{const v=Math.max(0,r2($('pdCtlTope').value));const {error}=await db().from('ajustes_pidemas').upsert({clave:'caja_alerta',valor:{monto:v},actualizado_en:new Date().toISOString()});if(error){pdAviso('No se pudo guardar: '+error.message);return}aviso(v?'Alerta guardada en '+M(v)+'.':'Alerta desactivada.');cerrarHoja()};
  }

  /* =================== contador para el menú =================== */
  async function contar(){
    try{
      const desde=new Date(Date.now()-45*864e5).toISOString();
      const [y,n,c]=await Promise.all([
        db().from('cobros').select('id',{count:'exact',head:true}).eq('metodo_pago','yape').eq('confirmado',true).is('yape_recibido_en',null).gte('confirmado_en',desde),
        db().from('pedidos').select('id',{count:'exact',head:true}).eq('pago_acordado','pagado').eq('estado','entregado').is('delivery_negocio_cobrado_en',null),
        cancelados()]);
      const k={yape:y.count||0,deu:n.count||0,dev:c.length};
      window.__pdCtlCuenta=k;badges();
      if(c.length&&!contar.avisado){contar.avisado=1;pdAviso&&pdAviso('Hay '+c.length+' pedido'+(c.length===1?'':'s')+' anulado'+(c.length===1?'':'s')+' con cobro en caja. Revisa «Cancelados con cobro» en el menú.')}
    }catch(e){}
  }
  function badges(){const k=window.__pdCtlCuenta||{};document.querySelectorAll('[data-ctl]').forEach(b=>{let i=b.querySelector('.pdCtlBdg');const v=k[b.dataset.ctl]||0;if(!v){if(i)i.remove();return}if(!i){i=document.createElement('b');i.className='pdCtlBdg';b.appendChild(i)}const t=v>99?'99+':String(v);if(i.textContent!==t)i.textContent=t})}
  setInterval(badges,1500);
  window.pdCtl={yape,porCobrar,devoluciones,resumen,alerta,contar,hoja,cerrarHoja,planilla:()=>window.pdPlanilla&&window.pdPlanilla()};
  let t0=0;setInterval(()=>{const on=!!document.querySelector('#appView:not(.hidden)')&&window.db;if(on&&Date.now()-t0>90000){t0=Date.now();contar()}},3000);
})();
