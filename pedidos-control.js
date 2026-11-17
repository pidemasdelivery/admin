/* ===== Pidemás · Control de pedidos (admin) =====
   Alertas de demora · Asignación sugerida · Código de entrega, historial y calificación en la tarjeta
   · Motivo de anulación · Por pagar a negocios · Calificaciones · Reportes */
(function(){
  if(window.__pdPedCtl)return;window.__pdPedCtl=1;
  const $=id=>document.getElementById(id);
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const M=n=>'S/ '+(Number(n)||0).toFixed(2);
  const r2=n=>Math.round((Number(n)||0)*100)/100;
  const ref=id=>'#'+String(id||'').slice(0,8).toUpperCase();
  const db=()=>window.db;
  const ok=t=>(window.pdExito||window.pdAviso||alert)(t);
  const hoja=t=>window.pdCtl&&pdCtl.hoja?pdCtl.hoja(t):null;
  const L=()=>{try{return Array.isArray(allOrders)?allOrders:[]}catch(e){return []}};
  const MO=()=>{try{return Array.isArray(allMotos)?allMotos:[]}catch(e){return []}};
  const T=v=>{const t=new Date(v).getTime();return Number.isFinite(t)?t:0};
  const min=ms=>Math.round(ms/60000);
  const est=o=>String(o.estado||'').toLowerCase();
  const tel=t=>{const d=String(t||'').replace(/\D/g,'');if(!d)return '';return d.startsWith('51')?d:(d.length===9?'51'+d:d)};
  const TIENDA='https://pidemasdelivery.github.io/';
  const fH=v=>{try{return new Date(v).toLocaleString('es-PE',{timeZone:'America/Lima',day:'2-digit',month:'short',hour:'numeric',minute:'2-digit'})}catch(e){return ''}};

  let negocios=[];
  async function negs(){if(negocios.length||!db())return negocios;const r=await db().from('negocios').select('id,nombre,telefono,latitud,longitud');negocios=r.data||[];return negocios}
  const negN=id=>(negocios.find(n=>String(n.id)===String(id))||{}).nombre||'Negocio';
  function programado(o){try{if(o.programado_para)return T(o.programado_para);const d=window.pdTarifa&&pdTarifa.desgloseDePedido(o.observaciones);if(d&&d.programado)return T(d.programado)}catch(e){}return 0}

  /* =================== 1. Alertas de demora =================== */
  const UMBRAL={negocio:5,asignar:5,aceptar:3,extra:40};
  function alertas(){
    const now=Date.now(),out=[];
    L().forEach(o=>{
      const s=est(o);if(['entregado','cancelado','rechazado'].includes(s))return;
      const prog=programado(o);if(prog&&prog-now>45*60000)return;
      const base=prog&&prog>T(o.creado_en)?Math.max(T(o.creado_en),prog-45*60000):T(o.creado_en);
      if(prog&&!o.motorizado_id&&prog-now<=30*60000){out.push({o,k:'prog',t:'Programado para las '+new Date(prog).toLocaleTimeString('es-PE',{timeZone:'America/Lima',hour:'numeric',minute:'2-digit'})+' y sin motorizado'});return}
      if(o.negocio_id&&s==='pendiente'&&!o.negocio_aceptado_en&&now-base>UMBRAL.negocio*60000){out.push({o,k:'neg',t:negN(o.negocio_id)+' no lo acepta hace '+min(now-base)+' min'});return}
      if(!o.motorizado_id&&['pendiente','confirmado'].includes(s)&&(!o.negocio_id||o.negocio_aceptado_en)){const desde=o.negocio_aceptado_en?T(o.negocio_aceptado_en):base;if(now-desde>UMBRAL.asignar*60000){out.push({o,k:'asig',t:'Sin motorizado hace '+min(now-desde)+' min'});return}}
      if(s==='asignado'&&!o.aceptado_en&&o.asignado_en&&now-T(o.asignado_en)>UMBRAL.aceptar*60000){out.push({o,k:'acep',t:(o.motorizado_nombre||'El motorizado')+' no acepta hace '+min(now-T(o.asignado_en))+' min'});return}
      if(['aceptado','en_camino','en_entrega','asignado'].includes(s)){const lim=(Number(o.tiempo_preparacion_min)||20)+UMBRAL.extra;const e=min(now-base);if(e>lim)out.push({o,k:'tarde',t:'Demorado: '+e+' min desde que se pidió'})}
    });
    return out;
  }
  let vistos=new Set(),ultimas=[];
  function pintarAlertas(){
    const A=alertas();ultimas=A;
    const list=$('orderList');if(!list)return;
    let b=$('pdAlertBar');
    if(!A.length){if(b)b.remove()}else{
      if(!b){b=document.createElement('button');b.type='button';b.id='pdAlertBar';b.className='pdAlertBar';b.addEventListener('click',verAlertas)}
      if(b.nextElementSibling!==list&&list.parentElement)list.parentElement.insertBefore(b,list);
      const t='⚠ '+A.length+' pedido'+(A.length===1?'':'s')+' necesita'+(A.length===1?'':'n')+' atención · Ver';if(b.textContent!==t)b.textContent=t;
    }
    const ids=new Map(A.map(a=>[String(a.o.id),a]));
    document.querySelectorAll('#orderList .adminOrderCard[data-order-id]').forEach(c=>{const a=ids.get(c.dataset.orderId);c.classList.toggle('pdAlerta',!!a);let ch=c.querySelector(':scope > .pdAlertChip');if(a){if(!ch){ch=document.createElement('div');ch.className='pdAlertChip';c.prepend(ch)}if(ch.textContent!==a.t)ch.textContent=a.t}else if(ch)ch.remove()});
    const nuevas=A.filter(a=>!vistos.has(a.k+a.o.id));nuevas.forEach(a=>vistos.add(a.k+a.o.id));
    if(nuevas.length&&window.pdAviso)pdAviso(nuevas.length===1?ref(nuevas[0].o.id)+' · '+nuevas[0].t:nuevas.length+' pedidos nuevos con demora. Toca el aviso rojo de la lista.');
  }
  /* Abre el detalle del pedido SIN pasar por el inicio: si el modal "Pedidos" ya está abierto no se vuelve a abrir ni a recargar la lista */
  function pedidosAbierto(){const pm=$('pdmModal'),t=$('pdmTitle');return !!pm&&!pm.hidden&&/pedidos/i.test((t&&t.textContent)||'')&&!!pm.querySelector('#orderList')}
  function abrirPedido(id){
    try{window.pdCtl&&pdCtl.cerrarHoja()}catch(_){}
    /* la lista ya está a la vista (inicio o modal): no se abre ningún modal; solo si no se ve, se abre Pedidos */
    const L0=$('orderList'),visible=!!L0&&L0.getClientRects().length>0;
    if(!visible&&!pedidosAbierto()){try{window.openAdminTab&&window.openAdminTab('pedidos')}catch(_){}try{window.pdDtAbrir&&pdDtAbrir()}catch(_){}}
    const sel='.adminOrderCard[data-order-id="'+CSS.escape(String(id))+'"]';let n=0;
    const tm=setInterval(()=>{
      const c=document.querySelector('#orderList '+sel)||document.querySelector(sel);
      if(c){clearInterval(tm);
        /* se abre como lo hace el toque normal en la tarjeta (button.pdList), para que se arme el diseño nuevo del detalle */
        if(!c.classList.contains('is-expanded')){const b=c.querySelector(':scope > button.pdList')||c.querySelector('.adminOrderSection');b&&b.click()}
        setTimeout(()=>{if(!c.classList.contains('is-expanded'))c.classList.add('is-expanded');try{c.scrollIntoView({behavior:'smooth',block:'start'})}catch(_){}},120);return}
      if(++n>20){clearInterval(tm);ok('No se encontró ese pedido en la lista.')}
    },250);
  }
  async function verAlertas(){
    const b=hoja('Pedidos que necesitan atención');if(!b)return;await negs();
    const sug=await sugerencias();
    b.innerHTML=ultimas.length?ultimas.map(a=>{const s=a.k==='acep'||a.k==='asig'||a.k==='prog'?(sug.get(String(a.o.id))||[]).filter(x=>String(x.m.id)!==String(a.o.motorizado_id))[0]:null;
      return '<section class="pdCtlCard"><div class="pdCtlTx"><strong>'+E(ref(a.o.id))+' · '+E(a.o.nombre_cliente||'Cliente')+'</strong><small>'+E(a.t)+'</small></div><div class="pdCtlDos"><button type="button" class="pdCtlBtn alt" data-ver="'+E(a.o.id)+'">Ver pedido</button>'+(s?'<button type="button" class="pdCtlBtn" data-asig="'+E(a.o.id)+'" data-m="'+E(s.m.id)+'">Asignar a '+E(String(s.m.nombre_completo||'').split(' ')[0])+(s.km!=null?' ('+s.km.toFixed(1)+' km)':'')+'</button>':'')+'</div></section>'}).join(''):'<p class="pdCtlVacio">Todo en orden. 🎉</p>';
    b.onclick=async e=>{const v=e.target.closest('[data-ver]');if(v)return abrirPedido(v.dataset.ver);const a=e.target.closest('[data-asig]');if(a){if(typeof assignOrder!=='function')return;a.disabled=true;await assignOrder(a.dataset.asig,a.dataset.m);try{pdCtl.cerrarHoja()}catch(_){}}};
  }

  /* =================== 2. Asignación sugerida =================== */
  const rad=x=>x*Math.PI/180;
  const km=(a,b,c,d)=>{const R=6371,dl=rad(c-a),dn=rad(d-b);const h=Math.sin(dl/2)**2+Math.cos(rad(a))*Math.cos(rad(c))*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h))};
  let gps=[],gpsT=0;
  async function leerGps(){if(Date.now()-gpsT<60000)return gps;gpsT=Date.now();try{const r=await db().rpc('motorizados_cercanos');gps=r.error?[]:(r.data||[])}catch(e){gps=[]}return gps}
  function origen(o){if(o.latitud_recojo&&o.longitud_recojo)return [o.latitud_recojo,o.longitud_recojo];const n=negocios.find(x=>String(x.id)===String(o.negocio_id));if(n&&n.latitud&&n.longitud)return [n.latitud,n.longitud];return null}
  async function sugerencias(){
    await negs();await leerGps();
    const carga=new Map();L().forEach(o=>{if(o.motorizado_id&&!['entregado','cancelado','rechazado'].includes(est(o)))carga.set(String(o.motorizado_id),(carga.get(String(o.motorizado_id))||0)+1)});
    const res=new Map();
    L().forEach(o=>{if(['entregado','cancelado'].includes(est(o)))return;const og=origen(o);
      const lst=MO().filter(m=>m.activo!==false&&!m.en_descanso).map(m=>{const g=gps.find(x=>String(x.motorizado_id)===String(m.id));const d=og&&g?km(og[0],og[1],g.latitud,g.longitud):null;return {m,km:d,carga:carga.get(String(m.id))||0,gps:!!g}})
        .sort((a,b)=>(a.carga-b.carga)*3+((a.km==null?99:a.km)-(b.km==null?99:b.km))||(b.gps-a.gps));
      res.set(String(o.id),lst)});
    return res;
  }
  async function pintarSugeridos(){
    const sels=[...document.querySelectorAll('#orderList .adminOrderCard.is-expanded .motoSelect:not([disabled])')];if(!sels.length)return;
    const sug=await sugerencias();
    sels.forEach(sel=>{const id=sel.dataset.orderId;const o=L().find(x=>String(x.id)===String(id));if(!o||o.motorizado_id)return;
      const top=(sug.get(String(id))||[]).slice(0,3);if(!top.length)return;
      let box=sel.parentElement.querySelector(':scope > .pdSugeridos');if(!box){box=document.createElement('div');box.className='pdSugeridos';sel.insertAdjacentElement('beforebegin',box)}
      const h='<span>Sugeridos:</span>'+top.map(x=>'<button type="button" data-sm="'+E(x.m.id)+'">'+E(String(x.m.nombre_completo||'').split(' ')[0])+'<small>'+(x.km!=null?x.km.toFixed(1)+' km · ':x.gps?'':'sin GPS · ')+x.carga+' en curso</small></button>').join('');
      if(box.__h!==h){box.__h=h;box.innerHTML=h;box.onclick=e=>{const b=e.target.closest('[data-sm]');if(!b)return;sel.value=b.dataset.sm;sel.dispatchEvent(new Event('change',{bubbles:true}));box.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b))}}});
  }

  /* =================== 3. Tarjeta: código, prueba de entrega, historial, calificación =================== */
  const codigos=new Map();
  async function pintarTarjetas(){
    const cards=[...document.querySelectorAll('#orderList .adminOrderCard.is-expanded[data-order-id]')];if(!cards.length)return;
    const falt=cards.map(c=>c.dataset.orderId).filter(id=>!codigos.has(id));
    if(falt.length){try{const r=await db().from('pedido_codigos').select('pedido_id,codigo').in('pedido_id',falt);falt.forEach(id=>codigos.set(id,null));(r.data||[]).forEach(x=>codigos.set(String(x.pedido_id),x.codigo))}catch(e){}}
    cards.forEach(c=>{const o=L().find(x=>String(x.id)===c.dataset.orderId);if(!o)return;const s=est(o);
      let bar=c.querySelector(':scope > .pdPcBar');if(!bar){bar=document.createElement('div');bar.className='pdPcBar';c.appendChild(bar)}
      const cod=codigos.get(String(o.id));const parts=[];
      if(cod&&o.negocio_id&&!['entregado','cancelado'].includes(s))parts.push('<span class="pdPcCod">Código de entrega <b>'+E(cod)+'</b></span>');
      if(o.entrega_verificada)parts.push('<span class="pdcjRev ok">Entrega verificada con '+(o.entrega_verificada==='foto'?'foto':'código')+'</span>');
      if(o.entrega_foto_url)parts.push('<a class="pdcjAct" target="_blank" rel="noopener" href="'+E(o.entrega_foto_url)+'">Ver foto de entrega</a>');
      if(s==='cancelado'&&(o.cancelado_por||o.motivo_cancelacion))parts.push('<span class="pdcjRev bad">Anulado'+(o.cancelado_por?' por '+E(o.cancelado_por):'')+(o.motivo_cancelacion?' · '+E(o.motivo_cancelacion):'')+'</span>');
      if(s==='entregado'&&o.telefono_cliente)parts.push('<button type="button" class="pdcjAct" data-pc="calif" data-id="'+E(o.id)+'">'+(o.calificacion_pedida_en?'Volver a pedir calificación':'Pedir calificación por WhatsApp')+'</button>');
      if(cod&&o.negocio_id&&!['entregado','cancelado'].includes(s)&&(o.telefono_cliente||o.telefono_receptor))parts.push('<button type="button" class="pdcjAct" data-pc="cod" data-id="'+E(o.id)+'">Enviar código por WhatsApp</button>');
      parts.push('<button type="button" class="pdcjAct edit pdHistBtn" data-pc="hist" data-id="'+E(o.id)+'"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg>Historial de cambios</button>');
      const h=parts.join('');if(bar.__h!==h){bar.__h=h;bar.innerHTML=h}});
  }
  document.addEventListener('click',async e=>{
    const b=e.target.closest&&e.target.closest('[data-pc]');if(!b)return;e.stopPropagation();
    const o=L().find(x=>String(x.id)===b.dataset.id);if(!o)return;
    if(b.dataset.pc==='calif'){const w=tel(o.telefono_cliente);const msg='¡Hola'+(o.nombre_cliente?' '+String(o.nombre_cliente).split(' ')[0]:'')+'! 👋 Gracias por pedir con *Pidemás Delivery*.\n¿Cómo te fue con tu pedido '+ref(o.id)+'? Califícanos aquí, toma 10 segundos:\n'+TIENDA+'?calificar='+o.id;
      window.open('https://wa.me/'+w+'?text='+encodeURIComponent(msg),'_blank','noopener');try{await db().from('pedidos').update({calificacion_pedida_en:new Date().toISOString()}).eq('id',o.id);o.calificacion_pedida_en=new Date().toISOString()}catch(_){}return}
    if(b.dataset.pc==='cod'){const w=tel(o.telefono_receptor||o.telefono_cliente);const msg='Hola, te escribimos de *Pidemás Delivery*. Tu código de entrega para el pedido '+ref(o.id)+' es: *'+codigos.get(String(o.id))+'*\nDáselo al motorizado solo cuando recibas tu pedido.';window.open('https://wa.me/'+w+'?text='+encodeURIComponent(msg),'_blank','noopener');return}
    if(b.dataset.pc==='hist'){const hb=hoja('Historial · '+ref(o.id));if(!hb)return;
      const [c,h]=await Promise.all([db().from('pedidos_cambios').select('*').eq('pedido_id',o.id).order('creado_en'),db().from('historial_pedidos').select('*').eq('pedido_id',o.id).order('creado_en')]);
      const N={estado:'Estado',total:'Total',subtotal:'Productos',costo_delivery:'Delivery',metodo_pago:'Método de pago',pago_acordado:'Pago acordado',direccion_entrega:'Dirección',referencia_entrega:'Referencia',motorizado_id:'Motorizado',telefono_cliente:'Teléfono',nombre_cliente:'Cliente',pago_confirmado:'Pago confirmado',monto_recibido:'Monto recibido',entrega_verificada:'Entrega verificada',motivo_cancelacion:'Motivo de anulación'};
      const mN=v=>{const m=MO().find(x=>String(x.id)===String(v));return m?m.nombre_completo:v};
      const rows=(c.data||[]).filter(x=>x.campo!=='estado').map(x=>({t:x.creado_en,txt:(N[x.campo]||x.campo)+': '+(x.campo==='motorizado_id'?mN(x.antes)||'—':x.antes||'—')+' → '+(x.campo==='motorizado_id'?mN(x.despues)||'—':x.despues||'—'),q:x.rol||''}))
        .concat((h.data||[]).map(x=>({t:x.creado_en||x.fecha||x.cambiado_en,txt:'Estado: '+(x.estado_anterior||'—')+' → '+(x.estado_nuevo||x.estado||''),q:''}))).sort((a,b)=>T(a.t)-T(b.t));
      hb.innerHTML=rows.length?rows.map(r=>'<div class="pdCtlRow"><div class="pdCtlTx"><strong>'+E(r.txt)+'</strong><small>'+E(fH(r.t))+(r.q?' · '+E(r.q):'')+'</small></div></div>').join(''):'<p class="pdCtlVacio">Sin cambios registrados.</p>';return}
  },true);

  /* =================== 4. Motivo de anulación =================== */

  function elegirMotivo(){return new Promise(res=>{const b=hoja('¿Por qué se anula?');if(!b){res(null);return}
    const Q=['cliente','negocio','administración'],MOT={cliente:['Ya no lo quiere','Demoró mucho','Pidió por error','No contesta / no estaba'],negocio:['Sin stock','Negocio cerrado','No puede prepararlo a tiempo'],'administración':['Pago no confirmado','Dirección fuera de zona','Pedido duplicado','Sin motorizados disponibles']};
    let q='cliente',m='';
    const pint=()=>{b.innerHTML='<div class="pdCtlLbl">¿Quién lo pidió?</div><div class="pdChips">'+Q.map(x=>'<button type="button" data-q="'+x+'" class="'+(x===q?'on':'')+'">'+x.charAt(0).toUpperCase()+x.slice(1)+'</button>').join('')+'</div><div class="pdCtlLbl">Motivo</div><div class="pdChips">'+MOT[q].concat(['Otro']).map(x=>'<button type="button" data-m="'+E(x)+'" class="'+(x===m?'on':'')+'">'+E(x)+'</button>').join('')+'</div><label class="pdCtlLbl">Detalle (opcional)<input id="pdAnDet" maxlength="120"></label><button type="button" class="pdCtlBtn" id="pdAnOk">Anular pedido</button><button type="button" class="pdCtlBtn alt" id="pdAnNo">No anular</button>'};
    pint();
    const fin=v=>{try{pdCtl.cerrarHoja()}catch(_){}res(v)};
    b.onclick=e=>{const x=e.target.closest('[data-q]');if(x){q=x.dataset.q;m='';pint();return}const y=e.target.closest('[data-m]');if(y){m=y.dataset.m;b.querySelectorAll('[data-m]').forEach(z=>z.classList.toggle('on',z===y));return}
      if(e.target.closest('#pdAnNo'))return fin(null);
      if(e.target.closest('#pdAnOk')){const det=($('pdAnDet').value||'').trim();if(!m&&!det){pdAviso('Elige un motivo.');return}fin('Anulado a pedido de'+(q==='cliente'?'l cliente':q==='negocio'?'l negocio':' administración')+': '+[m!=='Otro'?m:'',det].filter(Boolean).join(' · '))}};
    const v=$('pdCtlVelo');if(v)v.addEventListener('click',ev=>{if(ev.target===v)res(null)},{once:true});
  })}
  function envPedir(){const P0=window.pdPedir;if(typeof P0!=='function')return false;if(P0.__pdAn)return true;const w=function(t,v){if(/^Motivo del rechazo/i.test(String(t||'')))return elegirMotivo();return P0.apply(this,arguments)};w.__pdAn=1;window.pdPedir=w;return true}
  envPedir();setInterval(envPedir,1500);

  /* =================== 5. Por pagar a negocios =================== */
  async function porPagar(){
    const b=hoja('Por pagar a negocios');if(!b)return;await negs();
    const {data,error}=await db().from('pedidos').select('id,negocio_id,subtotal,total,pago_acordado,metodo_pago,nombre_cliente,entregado_en,creado_en,motorizado_id').not('negocio_id','is',null).eq('estado','entregado').is('negocio_pagado_en',null).order('creado_en',{ascending:true}).limit(1000);
    if(error){b.innerHTML='<p class="pdCtlErr">No se pudo leer: '+E(error.message)+(/negocio_pagado/.test(error.message)?' (falta aplicar los cambios de la base)':'')+'</p>';return}
    const D=(data||[]).filter(p=>!['solo_delivery','pagado','yape_negocio'].includes(String(p.pago_acordado||''))&&Number(p.subtotal)>0);
    const g=new Map();D.forEach(p=>{const k=String(p.negocio_id);if(!g.has(k))g.set(k,[]);g.get(k).push(p)});
    const total=D.reduce((s,p)=>s+(Number(p.subtotal)||0),0);
    const motos=MO().filter(m=>m.activo!==false);
    b.innerHTML='<p class="pdCtlMuted">Pedidos donde el cliente le pagó todo a Pidemás (al motorizado o por Yape): le debes al negocio el valor de los productos.</p><div class="pdCtlStat"><span>Total por pagar</span><b>'+M(total)+'</b></div>'
      +(g.size?[...g.entries()].map(([nid,P])=>{const n=negocios.find(x=>String(x.id)===nid)||{};const t=P.reduce((s,p)=>s+(Number(p.subtotal)||0),0);
        const msg=['Hola, '+(n.nombre||'')+' 👋','Te escribimos de *Pidemás Delivery*. Este es el resumen de lo que te pagamos por tus pedidos:',...P.map(p=>'• '+ref(p.id)+' · '+fH(p.entregado_en||p.creado_en)+' · '+M(p.subtotal)),'','*Total: '+M(t)+'*'].join('\n');const w=tel(n.telefono);
        return '<section class="pdCtlCard" data-n="'+E(nid)+'"><div class="pdCtlCardHd"><span><strong>'+E(n.nombre||'Negocio')+'</strong><small>'+P.length+' pedido'+(P.length===1?'':'s')+' · '+M(t)+'</small></span>'+(w?'<a class="pdCtlWa" target="_blank" rel="noopener" href="https://wa.me/'+w+'?text='+encodeURIComponent(msg)+'">Enviar resumen</a>':'')+'</div>'
          +P.map(p=>'<label class="pdCtlChk"><input type="checkbox" value="'+E(p.id)+'" checked><span>'+E(ref(p.id))+' · '+E(fH(p.entregado_en||p.creado_en))+'</span><b>'+M(p.subtotal)+'</b></label>').join('')
          +'<div class="pdCtlPay"><label>¿Cómo le pagaste?<select data-met><option value="efectivo">Efectivo</option><option value="yape">Yape / transferencia</option></select></label><label>¿Quién le pagó?<select data-quien><option value="admin">Administración</option>'+motos.map(m=>'<option value="'+E(m.id)+'">'+E(m.nombre_completo)+' (sale de su caja)</option>').join('')+'</select></label><button type="button" class="pdCtlBtn" data-pagar>Marcar como pagado</button></div></section>'}).join(''):'<p class="pdCtlVacio">No le debes nada a ningún negocio. 🎉</p>');
    b.onclick=async e=>{const btn=e.target.closest('[data-pagar]');if(!btn)return;const card=btn.closest('[data-n]');
      const ids=[...card.querySelectorAll('input[type=checkbox]:checked')].map(i=>i.value);if(!ids.length){pdAviso('Marca al menos un pedido.');return}
      const met=card.querySelector('[data-met]').value,quien=card.querySelector('[data-quien]').value;const P=D.filter(p=>ids.includes(String(p.id)));const t=r2(P.reduce((s,p)=>s+(Number(p.subtotal)||0),0));const n=negocios.find(x=>String(x.id)===card.dataset.n)||{};
      if(!(await pdConfirmar('¿Registrar que le pagaste '+M(t)+' a '+(n.nombre||'el negocio')+' ('+met+')?')))return;
      btn.disabled=true;
      try{const now=new Date().toISOString();
        for(const p of P){const r=await db().from('pedidos').update({negocio_pagado_en:now,negocio_pagado_metodo:met,negocio_pagado_monto:r2(p.subtotal)}).eq('id',p.id);if(r.error)throw r.error}
        if(quien!=='admin'){const r=await db().from('movimientos_caja').insert(P.map(p=>({motorizado_id:quien,pedido_id:p.id,tipo:'retiro',monto:r2(p.subtotal),descripcion:'PAGO A NEGOCIO · '+(n.nombre||'Negocio')+' · Pedido '+ref(p.id)})));if(r.error)throw r.error}
        ok('Pago al negocio registrado.');porPagar();contarPp();
      }catch(err){pdAviso('No se pudo registrar: '+(err.message||err));btn.disabled=false}};
  }

  /* =================== 6. Calificaciones =================== */
  async function calificaciones(){
    const b=hoja('Calificaciones');if(!b)return;await negs();
    const {data,error}=await db().from('calificaciones').select('*').order('creado_en',{ascending:false}).limit(500);
    if(error){b.innerHTML='<p class="pdCtlErr">'+E(error.message)+'</p>';return}
    const prom=(arr,k,key)=>{const g=new Map();arr.forEach(c=>{const id=c[key],v=Number(c[k]);if(!id||!v)return;const x=g.get(String(id))||{s:0,n:0};x.s+=v;x.n++;g.set(String(id),x)});return [...g].map(([id,x])=>({id,p:x.s/x.n,n:x.n})).sort((a,b)=>b.p-a.p)};
    const pm=prom(data||[],'estrellas_motorizado','motorizado_id'),pn=prom(data||[],'estrellas_negocio','negocio_id');
    const st=v=>'★'.repeat(Math.round(v))+'☆'.repeat(5-Math.round(v));
    const malas=(data||[]).filter(c=>Math.min(c.estrellas_negocio||5,c.estrellas_motorizado||5)<=2||c.comentario).slice(0,20);
    b.innerHTML='<div class="pdCtlStat"><span>Calificaciones recibidas</span><b>'+(data||[]).length+'</b></div>'
      +'<div class="pdCtlLbl">Motorizados</div>'+(pm.length?pm.map(x=>'<div class="pdCtlRow"><div class="pdCtlTx"><strong>'+E((MO().find(m=>String(m.id)===x.id)||{}).nombre_completo||'Motorizado')+'</strong><small>'+x.n+' calificación'+(x.n===1?'':'es')+'</small></div><b class="pdStars">'+st(x.p)+' '+x.p.toFixed(1)+'</b></div>').join(''):'<p class="pdCtlMuted">Aún no hay.</p>')
      +'<div class="pdCtlLbl">Negocios</div>'+(pn.length?pn.map(x=>'<div class="pdCtlRow"><div class="pdCtlTx"><strong>'+E(negN(x.id))+'</strong><small>'+x.n+' calificación'+(x.n===1?'':'es')+'</small></div><b class="pdStars">'+st(x.p)+' '+x.p.toFixed(1)+'</b></div>').join(''):'<p class="pdCtlMuted">Aún no hay.</p>')
      +'<div class="pdCtlLbl">Comentarios y calificaciones bajas</div>'+(malas.length?malas.map(c=>'<div class="pdCtlRow"><div class="pdCtlTx"><strong>'+E(ref(c.pedido_id))+' · negocio '+(c.estrellas_negocio||'-')+'★ · motorizado '+(c.estrellas_motorizado||'-')+'★</strong><small>'+E(c.comentario||'Sin comentario')+' · '+E(fH(c.creado_en))+'</small></div></div>').join(''):'<p class="pdCtlMuted">Sin comentarios.</p>');
  }

  /* =================== 7. Reportes =================== */
  async function reportes(dias){
    dias=dias||7;const b=hoja('Reportes de pedidos');if(!b)return;await negs();
    const desde=new Date(Date.now()-dias*864e5).toISOString();
    const {data,error}=await db().from('pedidos').select('id,estado,negocio_id,motorizado_id,tipo_servicio,total,subtotal,costo_delivery,creado_en,asignado_en,aceptado_en,en_camino_en,entregado_en,cancelado_por,motivo_cancelacion').gte('creado_en',desde).limit(5000);
    if(error){b.innerHTML='<p class="pdCtlErr">'+E(error.message)+'</p>';return}
    const P=data||[],ent=P.filter(p=>est(p)==='entregado'),can=P.filter(p=>est(p)==='cancelado');
    const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
    const dur=(a,b2)=>ent.map(p=>p[a]&&p[b2]?(T(p[b2])-T(p[a]))/60000:null).filter(x=>x!=null&&x>=0&&x<600);
    const hora=new Array(24).fill(0);P.forEach(p=>{const h=+new Date(p.creado_en).toLocaleString('en-US',{timeZone:'America/Lima',hour:'numeric',hour12:false})%24;hora[h]++});
    const maxH=Math.max(1,...hora);
    const porNeg=new Map();ent.filter(p=>p.negocio_id).forEach(p=>{const x=porNeg.get(String(p.negocio_id))||{n:0,v:0};x.n++;x.v+=Number(p.subtotal)||0;porNeg.set(String(p.negocio_id),x)});
    const porMot=new Map();ent.filter(p=>p.motorizado_id).forEach(p=>{const x=porMot.get(String(p.motorizado_id))||{n:0,d:0};x.n++;x.d+=Number(p.costo_delivery)||0;porMot.set(String(p.motorizado_id),x)});
    const mot=new Map();can.forEach(p=>{const k=(p.cancelado_por?p.cancelado_por+': ':'')+(p.motivo_cancelacion||'Sin motivo');mot.set(k,(mot.get(k)||0)+1)});
    const venta=ent.reduce((s,p)=>s+(Number(p.total)||0),0);
    const csv=['Pedido;Estado;Tipo;Negocio;Motorizado;Total;Delivery;Creado;Entregado;Anulado por;Motivo',...P.map(p=>[ref(p.id),p.estado,p.tipo_servicio||'',p.negocio_id?negN(p.negocio_id):'',(MO().find(m=>String(m.id)===String(p.motorizado_id))||{}).nombre_completo||'',p.total||0,p.costo_delivery||0,fH(p.creado_en),p.entregado_en?fH(p.entregado_en):'',p.cancelado_por||'',p.motivo_cancelacion||''].join(';'))].join('\n');
    b.innerHTML='<div class="pdChips">'+[1,7,30].map(d=>'<button type="button" data-d="'+d+'" class="'+(d===dias?'on':'')+'">'+(d===1?'Hoy':'Últimos '+d+' días')+'</button>').join('')+'</div>'
      +'<div class="pdCtlGrid"><div><span>Pedidos</span><b>'+P.length+'</b></div><div><span>Entregados</span><b>'+ent.length+'</b></div><div><span>Venta entregada</span><b>'+M(venta)+'</b></div><div><span>Ticket promedio</span><b>'+M(ent.length?venta/ent.length:0)+'</b></div><div><span>Anulados</span><b>'+can.length+' ('+(P.length?Math.round(can.length*100/P.length):0)+'%)</b></div><div><span>Delivery cobrado</span><b>'+M(ent.reduce((s,p)=>s+(Number(p.costo_delivery)||0),0))+'</b></div></div>'
      +'<div class="pdCtlLbl">Tiempo promedio por etapa</div><div class="pdCtlGrid"><div><span>Pedido → asignado</span><b>'+Math.round(avg(dur('creado_en','asignado_en')))+' min</b></div><div><span>Asignado → aceptado</span><b>'+Math.round(avg(dur('asignado_en','aceptado_en')))+' min</b></div><div><span>Aceptado → en camino</span><b>'+Math.round(avg(dur('aceptado_en','en_camino_en')))+' min</b></div><div><span>Total hasta entregar</span><b>'+Math.round(avg(dur('creado_en','entregado_en')))+' min</b></div></div>'
      +'<div class="pdCtlLbl">Pedidos por hora</div><div class="pdHoras">'+hora.map((n,h)=>n?'<div><span>'+h+'h</span><i style="width:'+Math.max(4,Math.round(n*100/maxH))+'%"></i><b>'+n+'</b></div>':'').join('')+'</div>'
      +'<div class="pdCtlLbl">Venta por negocio</div>'+([...porNeg].sort((a,b2)=>b2[1].v-a[1].v).map(([id,x])=>'<div class="pdCtlRow"><div class="pdCtlTx"><strong>'+E(negN(id))+'</strong><small>'+x.n+' pedido'+(x.n===1?'':'s')+'</small></div><b>'+M(x.v)+'</b></div>').join('')||'<p class="pdCtlMuted">Sin ventas.</p>')
      +'<div class="pdCtlLbl">Entregas por motorizado</div>'+([...porMot].sort((a,b2)=>b2[1].n-a[1].n).map(([id,x])=>'<div class="pdCtlRow"><div class="pdCtlTx"><strong>'+E((MO().find(m=>String(m.id)===id)||{}).nombre_completo||'Motorizado')+'</strong><small>Delivery '+M(x.d)+'</small></div><b>'+x.n+'</b></div>').join('')||'<p class="pdCtlMuted">Sin entregas.</p>')
      +'<div class="pdCtlLbl">Motivos de anulación</div>'+([...mot].sort((a,b2)=>b2[1]-a[1]).map(([k,n])=>'<div class="pdCtlRow"><div class="pdCtlTx"><strong>'+E(k)+'</strong></div><b>'+n+'</b></div>').join('')||'<p class="pdCtlMuted">Sin anulaciones.</p>')
      +'<a class="pdCtlBtn alt" download="pedidos-'+dias+'d.csv" href="data:text/csv;charset=utf-8,'+encodeURIComponent('﻿'+csv)+'">Descargar Excel (CSV)</a>';
    b.onclick=e=>{const d=e.target.closest('[data-d]');if(d)reportes(+d.dataset.d)};
  }

  function bdg(k,v){const c=window.__pdCtlCuenta=window.__pdCtlCuenta||{};c[k]=v;document.querySelectorAll('[data-ctl="'+k+'"]').forEach(b=>{let i=b.querySelector('.pdCtlBdg');if(!v){if(i)i.remove();return}if(!i){i=document.createElement('b');i.className='pdCtlBdg';b.appendChild(i)}const t=v>99?'99+':String(v);if(i.textContent!==t)i.textContent=t})}
  let ppN=0;
  async function contarPp(){try{const r=await db().from('pedidos').select('id',{count:'exact',head:true}).not('negocio_id','is',null).eq('estado','entregado').is('negocio_pagado_en',null).not('pago_acordado','in','(solo_delivery,pagado,yape_negocio)').gt('subtotal',0);if(!r.error){ppN=r.count||0;bdg('pneg',ppN)}}catch(e){}}
  window.pdPedCtl={porPagar,calificaciones,reportes,alertas:verAlertas,sugerencias};
  let n=0;setInterval(()=>{if(!document.querySelector('#appView:not(.hidden)')||!db())return;n++;try{pintarAlertas();bdg('atn',ultimas.length)}catch(e){}if(n%20===1)contarPp();else bdg('pneg',ppN);if(n%2===0){pintarSugeridos().catch(()=>{});pintarTarjetas().catch(()=>{})}},4000);
})();
