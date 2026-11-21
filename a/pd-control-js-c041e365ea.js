
/* ===== antes control.js ===== */
/* ===== Pidemás · Control de caja (admin) =====
   Yape por confirmar · Por cobrar a negocios (con WhatsApp) · Alerta de caja alta */
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
    const {data,error}=await db().from('pedidos').select('id,negocio_id,costo_delivery,nombre_cliente,entregado_en,creado_en').in('pago_acordado',['pagado','yape_negocio']).eq('estado','entregado').is('delivery_negocio_cobrado_en',null).order('creado_en',{ascending:true}).limit(1000);
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

  async function tope(){try{const {data}=await db().from('ajustes_pidemas').select('valor').eq('clave','caja_alerta').maybeSingle();return Number(data&&data.valor&&data.valor.monto)||0}catch(e){return 0}}
  async function alerta(){
    const b=hoja('Alerta de caja alta');const T=await tope();
    b.innerHTML='<p class="pdCtlMuted">Cuando la caja de un motorizado llegue a este monto, él verá un aviso para entregarte el efectivo, Deja 0 para desactivar.</p><label class="pdCtlLbl">Monto máximo en caja (S/)<input type="number" inputmode="decimal" min="0" step="10" id="pdCtlTope" value="'+E(T||'')+'"></label><button type="button" class="pdCtlBtn" id="pdCtlTopeOk">Guardar</button>';
    $('pdCtlTopeOk').onclick=async()=>{const v=Math.max(0,r2($('pdCtlTope').value));const {error}=await db().from('ajustes_pidemas').upsert({clave:'caja_alerta',valor:{monto:v},actualizado_en:new Date().toISOString()});if(error){pdAviso('No se pudo guardar: '+error.message);return}aviso(v?'Alerta guardada en '+M(v)+'.':'Alerta desactivada.');cerrarHoja()};
  }

  /* =================== contador para el menú =================== */
  async function contar(){
    try{
      const desde=new Date(Date.now()-45*864e5).toISOString();
      const [y,n]=await Promise.all([
        db().from('cobros').select('id',{count:'exact',head:true}).eq('metodo_pago','yape').eq('confirmado',true).is('yape_recibido_en',null).gte('confirmado_en',desde),
        db().from('pedidos').select('id',{count:'exact',head:true}).in('pago_acordado',['pagado','yape_negocio']).eq('estado','entregado').is('delivery_negocio_cobrado_en',null)]);
      const k={yape:y.count||0,deu:n.count||0};
      window.__pdCtlCuenta=k;badges();
    }catch(e){}
  }
  function badges(){const k=window.__pdCtlCuenta||{};document.querySelectorAll('[data-ctl]').forEach(b=>{let i=b.querySelector('.pdCtlBdg');const v=k[b.dataset.ctl]||0;if(!v){if(i)i.remove();return}if(!i){i=document.createElement('b');i.className='pdCtlBdg';b.appendChild(i)}const t=v>99?'99+':String(v);if(i.textContent!==t)i.textContent=t})}
  setInterval(badges,1500);
  window.pdCtl={yape,porCobrar,alerta,contar,hoja,cerrarHoja,planilla:()=>window.pdPlanilla&&window.pdPlanilla()};
  let t0=0;setInterval(()=>{const on=!!document.querySelector('#appView:not(.hidden)')&&window.db;if(on&&Date.now()-t0>90000){t0=Date.now();contar()}},3000);
})();

