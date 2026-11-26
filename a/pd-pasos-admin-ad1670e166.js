
/* ===== Pidemás · Admin · pedido por pasos =====
   Al tocar un pedido de negocio se abre esta vista. Los pasos avanzan solos según lo que hacen
   el negocio y el motorizado; el admin solo asigna el motorizado y marca el delivery cobrado. */
(function(){
  if(window.__pdPasosAdm||!window.PdPasos)return;window.__pdPasosAdm=1;
  const LK=v=>{const t=String(v||'').trim();const m=t.match(/https?:\/\/\S+/);return m?m[0]:''};
  const U=PdPasos.util,E=U.E,M=U.money;
  const L=()=>{try{return Array.isArray(allOrders)?allOrders:[]}catch(e){return window.allOrders||[]}};
  const MOTOS=()=>{try{return Array.isArray(allMotos)?allMotos:[]}catch(e){return []}};
  const D=()=>{try{return db}catch(e){return window.db}};
  const NEG=id=>{try{const m=window.adminRestaurantsById;return (m&&m.get&&(m.get(String(id))||m.get(id)))||{}}catch(e){return {}}};
  const svc=o=>{const t=String(o?.tipo_servicio||'').toLowerCase();return t.includes('encomienda')?'enc':t.includes('compra')?'compra':t.includes('recojo')?'recojo':'pedido'};
  const esNegocio=o=>!!o&&svc(o)==='pedido'&&!!o.negocio_id;
  const st=o=>String(o?.estado||'').toLowerCase();
  const elegido={},tiempoSel={},pagoSel={};let abierto=null,error='';
  /* Opciones de tiempo: las mismas que ve el negocio al aceptar */
  function opcTiempo(n){const ops=['10–20 min','20–30 min','30–40 min'].map(t=>({t,n:t.match(/\d+/g).map(Number)[1]}));
    const ns=(String(n.tiempo_estimado||'').match(/\d+/g)||[]).map(Number),hi=ns.length?ns[ns.length-1]:0;let def=ops[0];if(hi)ops.forEach(x=>{if(Math.abs(x.n-hi)<Math.abs(def.n-hi))def=x});return {ops,def}}
  /* Cómo cobra el motorizado (pago_acordado): igual que cuando acepta el negocio */
  function opcPago(o,n){
    if(String(o.metodo_pago||'').toLowerCase()==='efectivo')return [['efectivo','Paga en efectivo al recibir','El motorizado cobra '+M(o.total)]];
    return [['yape','Paga todo con el Yape de Pidemás','El motorizado muestra el QR de Pidemás · cobra '+M(o.total)],
      ['yape_negocio','Paga todo con el Yape del negocio',n.yape_qr_url?'El motorizado muestra el QR del negocio · luego se le cobra el delivery':'El negocio no tiene QR de Yape subido',!n.yape_qr_url],
      ['solo_delivery','Ya pagó los productos al negocio','El motorizado cobra solo el delivery · '+M(o.costo_delivery)],
      ['pagado','Ya pagó todo','El motorizado no cobra nada · el negocio debe el delivery']];
  }
  /* El admin acepta el pedido en nombre del negocio (mismos datos que guarda la app del negocio) */
  async function aceptarPorNegocio(o,n){
    error='';const id=String(o.id),pago=pagoSel[id],min=tiempoSel[id]||opcTiempo(n).def.n;
    if(!pago){error='Elige cómo cobra el motorizado.';return}
    const now=new Date().toISOString();
    const patch={estado:'confirmado',pago_acordado:pago,
      metodo_pago:pago==='yape_negocio'?'yape':pago==='pagado'?(o.metodo_pago||'yape'):pago==='solo_delivery'?(String(o.metodo_pago||'').toLowerCase()==='efectivo'?'efectivo':'yape'):pago,
      pago_confirmado:pago==='pagado',pago_negocio_confirmado:true,pago_negocio_confirmado_en:now,negocio_aceptado_en:now,tiempo_preparacion_min:min};
    const {data,error:e}=await D().from('pedidos').update(patch).eq('id',o.id).eq('estado','pendiente').select('id');
    if(e){error='No se pudo aceptar: '+e.message;return}
    if(!data||!data.length){error='El pedido ya no está pendiente: quizá el negocio ya lo aceptó o se anuló. Actualiza la lista.';return}
    Object.assign(o,patch);
    try{(window.loadOrders||(typeof loadOrders==='function'?loadOrders:null))?.()}catch(_){}
  }
  /* El admin acepta el pedido en nombre del motorizado (lo mismo que guarda la app del motorizado) */
  async function aceptarPorMoto(o){
    error='';const mn=String(moto(o).nombre_completo||o.motorizado_nombre||'el motorizado').split(' ')[0];
    if(!(await (window.pdAdmPregunta||window.pdConfirmar||(t=>Promise.resolve(confirm(t))))('¿Aceptar el pedido por '+mn+'?\nConfírmale antes por llamada o WhatsApp que lo va a atender.')))return;
    const patch={estado:'aceptado',aceptado_en:new Date().toISOString()};
    const {data,error:e}=await D().from('pedidos').update(patch).eq('id',o.id).eq('estado','asignado').eq('motorizado_id',o.motorizado_id).select('id');
    if(e){error='No se pudo aceptar: '+e.message;return}
    if(!data||!data.length){error='El pedido ya no está esperando al motorizado: quizá ya lo aceptó, lo rechazó o se reasignó. Actualiza la lista.';return}
    Object.assign(o,patch);
    try{(window.loadOrders||(typeof loadOrders==='function'?loadOrders:null))?.()}catch(_){}
  }
  /* Compra: darle efectivo al motorizado para comprar (entra a su caja como ingreso del pedido) */
  const efV={},efC={};
  function efCargar(o){const id=String(o.id);if(efC[id]&&efC[id].t>Date.now()-60000)return;efC[id]={t:Date.now(),tot:efC[id]?efC[id].tot:null};
    D().from('movimientos_caja').select('monto').eq('pedido_id',o.id).eq('tipo','ingreso').ilike('descripcion','EFECTIVO PARA %').then(({data})=>{efC[id].tot=Math.round((data||[]).reduce((a,x)=>a+(Number(x.monto)||0),0)*100)/100;try{if(PdPasos.isOpen())PdPasos.render()}catch(_){}})}
  function efectivoBox(o,mn,k){const kn=k==='enc'?'encomienda':'compra';if(!o.motorizado_id||['entregado','cancelado'].includes(st(o)))return '';efCargar(o);const id=String(o.id),c=efC[id],v=efV[id]||'';
    return `<div class="sum" style="gap:10px"><div class="lbl">Efectivo para la ${kn}</div>`+
      (c&&c.tot>0?U.st('Ya le diste '+M(c.tot)+' a '+E(mn)+' para esta '+kn,'ok'):U.note('Si '+E(mn)+' no tiene efectivo '+(k==='enc'?'para pagar en la agencia':'para comprar')+', dale aquí. Se suma a su caja.'))+
      `<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">${[20,50,100].map(x=>`<button type="button" class="b" data-act="efq" data-v="${x}">S/ ${x}</button>`).join('')}</div>`+
      `<input class="in" data-act="efm" inputmode="decimal" placeholder="Otro monto (S/)" value="${E(v)}" aria-label="Monto de efectivo para la ${kn}" style="height:50px;border-radius:14px;border:1.5px solid #F1E4DA;padding:0 14px;font:inherit;font-size:16px;box-sizing:border-box;width:100%">`+
      `<button type="button" class="b o" data-act="efdar">Darle efectivo${Number(String(v).replace(',','.'))>0?' · '+M(Number(String(v).replace(',','.'))):''}</button></div>`}
  async function efDar(o,mn,k){const kn=k==='enc'?'encomienda':'compra';error='';const id=String(o.id),v=Math.round((Number(String(efV[id]||'').replace(',','.'))||0)*100)/100;
    if(!(v>0)){error='Escribe cuánto efectivo le das.';return}
    if(!(await (window.pdAdmPregunta||window.pdConfirmar||(t=>Promise.resolve(confirm(t))))('¿Darle '+M(v)+' a '+mn+' para la '+kn+' '+U.ref(id)+'?\nSe suma a su caja.')))return;
    const q=await D().from('movimientos_caja').insert({motorizado_id:o.motorizado_id,pedido_id:o.id,tipo:'ingreso',monto:v,descripcion:'EFECTIVO PARA '+kn.toUpperCase()+' · Pedido '+U.ref(id)}).select('id');
    if(q.error||!q.data||!q.data.length){error='No se pudo registrar: '+(q.error?q.error.message:'sin confirmación');return}
    try{const mo=moto(o);if(mo.usuario_id)D().from('notificaciones').insert({usuario_id:mo.usuario_id,pedido_id:o.id,tipo:'sistema',titulo:'Efectivo para la '+kn,mensaje:'Administración te dio '+M(v)+' para la '+kn+' '+U.ref(id)+'. Ya está en tu caja.'}).then(()=>{})}catch(_){}
    efV[id]='';if(efC[id])efC[id].t=0;efCargar(o)}
  async function pagoDespues(o,mn,si){error='';
    if(!(await (window.pdAdmPregunta||window.pdConfirmar||(t=>Promise.resolve(confirm(t))))(si?'¿Autorizar que el cliente pague después '+M(Number(o.total)||0)+'?\n'+mn+' entrega sin cobrar y queda en Cobros pendientes.':'¿Rechazar? '+mn+' tendrá que cobrar ahora.')))return;
    let uid=null;try{uid=(await D().auth.getUser()).data.user.id}catch(_){}
    const now=new Date().toISOString(),patch=si?{pago_despues_estado:'autorizado',pago_despues_resuelto_en:now,pago_despues_por:uid,pago_servicio_momento:'al_final',pago_confirmado:false}:{pago_despues_estado:'rechazado',pago_despues_resuelto_en:now,pago_despues_por:uid};
    const q=await D().from('pedidos').update(patch).eq('id',o.id).eq('pago_despues_estado','pendiente').select('id');
    if(q.error){error='No se pudo guardar: '+q.error.message;return}if(!q.data||!q.data.length){error='Esta solicitud ya no está pendiente. Actualiza la lista.';return}
    Object.assign(o,patch);
    try{const mo=moto(o);if(mo.usuario_id)D().from('notificaciones').insert({usuario_id:mo.usuario_id,pedido_id:o.id,tipo:'sistema',titulo:si?'Pago después autorizado':'Pago después no autorizado',mensaje:si?'Entrega el pedido '+U.ref(String(o.id))+' sin cobrar: el cliente le paga a Pidemás.':'Cobra el pedido '+U.ref(String(o.id))+' ahora.'}).then(()=>{})}catch(_){}
    try{(window.loadOrders||(typeof loadOrders==='function'?loadOrders:null))?.()}catch(_){}
    pdpBuscar()}
  /* Aviso flotante: pedidos donde el motorizado pide que el cliente pague después */
  let pdpL=[],pdpT=0;
  async function pdpBuscar(){try{const {data}=await D().from('pedidos').select('id,motorizado_nombre,total,pago_despues_motivo').eq('pago_despues_estado','pendiente').order('pago_despues_solicitado_en',{ascending:true}).limit(10);
      const antes=pdpL.map(x=>x.id).join(),nuevo=(data||[]).some(x=>!pdpL.some(y=>y.id===x.id));pdpL=data||[];pdpPintar();
      if(nuevo){try{navigator.vibrate&&navigator.vibrate([120,80,120])}catch(_){}try{window.PdSound&&PdSound.on&&PdSound.ready&&PdSound.ready().then(ok=>ok&&PdSound.seq&&PdSound.seq([[880,0,.18],[1175,.2,.25]],.3))}catch(_){}}}catch(_){}}
  function pdpPintar(){let el=document.getElementById('pdPagoDespues');
    if(!pdpL.length){if(el)el.remove();return}
    if(!el){el=document.createElement('button');el.type='button';el.id='pdPagoDespues';el.style.cssText='position:fixed;left:12px;right:12px;top:calc(env(safe-area-inset-top,0px) + 10px);z-index:2147483000;display:flex;align-items:center;gap:10px;padding:12px 14px;border:0;border-radius:16px;background:#8A5A00;color:#FFFFFF;font:inherit;font-family:inherit;font-size:14.5px;font-weight:800;text-align:left;box-shadow:0 10px 30px rgba(31,26,23,.3);cursor:pointer';
      el.addEventListener('click',()=>{const x=pdpL[0];if(x)abrir(x.id)});document.body.appendChild(el)}
    const x=pdpL[0];el.innerHTML='<span style="flex:1;min-width:0">'+E((x.motorizado_nombre||'Un motorizado').split(' ')[0])+' pide que el cliente pague después · '+M(Number(x.total)||0)+(pdpL.length>1?' · +'+(pdpL.length-1)+' más':'')+'<br><span style="font-weight:600;opacity:.9">Toca para autorizar o rechazar</span></span>';
    el.style.display=PdPasos.isOpen&&PdPasos.isOpen()?'none':'flex'}
  setTimeout(pdpBuscar,3000);setInterval(pdpBuscar,20000);setInterval(pdpPintar,1500);
  /* «hace X min» para saber cuánto lleva el motorizado donde el cliente */
  const hace=t=>{const m=Math.max(0,Math.round((Date.now()-new Date(t).getTime())/60000));return m<1?'hace un momento':m<60?'hace '+m+' min':'hace '+Math.floor(m/60)+' h'+(m%60?' '+(m%60)+' min':'')};
  const llego=(t,quien,mn,fin)=>{if(!t)return U.st(E(mn)+' llegó donde '+E(quien),'ok');const m=(Date.now()-new Date(t).getTime())/60000;
    return U.st(E(mn)+' llegó donde '+E(quien)+' · '+U.hora(t)+(fin?'':' · '+hace(t)),!fin&&m>=10?'':'ok')+(!fin&&m>=10?U.note('Lleva '+hace(t).replace('hace ','')+' en la entrega. Si algo pasa, llámalo.'):'')};
  const km=(a,b,c,d)=>{if([a,b,c,d].some(v=>v==null||v===''||isNaN(v)))return null;const R=6371,r=x=>x*Math.PI/180,dl=r(c-a),dn=r(d-b);const h=Math.sin(dl/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h))};
  function etapa(o){
    const s=st(o);
    if(s==='cancelado')return -1;if(s==='entregado')return 4;
    if(s==='pendiente')return 0;
    if(s==='confirmado'&&!o.motorizado_id)return 1;
    if(['asignado','aceptado','pedido_aceptado','camino_recojo','confirmado'].includes(s))return 2;
    if(['en_camino','en_entrega','camino_entrega','confirmando_pago'].includes(s))return 3;
    return 0;
  }
  function moto(o){return MOTOS().find(m=>String(m.id)===String(o.motorizado_id))||o.motorizados||{}}
  async function asignar(id){
    error='';const mid=elegido[id];if(!mid){error='Elige un motorizado.';return}
    if(typeof window.assignOrder!=='function'&&typeof assignOrder!=='function'){error='No se encontró la acción de asignar. Actualiza la app.';return}
    const box=document.getElementById('ordersMsg'),antes=box?box.textContent:'';
    try{await (window.assignOrder||assignOrder)(id,mid)}catch(e){error=String(e?.message||e)}
    const ahora=box?String(box.textContent||'').trim():'';
    if(!error&&ahora&&ahora!==antes&&/no se|primero|error/i.test(ahora))error=ahora;
  }
  async function deliveryCobrado(o){
    error='';
    if(!(await (window.pdAdmPregunta||window.pdConfirmar||(t=>Promise.resolve(confirm(t))))('¿El negocio ya te pagó el delivery de '+M(o.costo_delivery)+'?')))return;
    const now=new Date().toISOString();const {error:e}=await D().from('pedidos').update({delivery_negocio_cobrado_en:now}).eq('id',o.id);
    if(e){error='No se pudo guardar: '+e.message;return}o.delivery_negocio_cobrado_en=now;
  }


  /* ---------- Servicios (recojo y entrega, compra, encomienda) ---------- */
  const limpiar=t=>String(t||'').replace(/__PIDEMAS_[A-Z_]+__\s*\{[^{}]*\}/g,'').replace(/\[COMPROBANTE_YAPE:[^\]]*\]/gi,'').replace(/\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+){2,}\b/g,'').replace(/(?:^|[|·])\s*Ubicaci[oó]n[^:|·]*:\s*[^|·]*/gi,'').split(/[|·]/).map(x=>x.replace(/https?:\/\/\S+/g,'').trim()).filter(Boolean);
  const campo=(o,...ls)=>{const raw=String(o.observaciones||'');for(const l of ls){const x=l.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const m=raw.match(new RegExp('(?:^|[|·]\\s*)'+x+'\\s*:\\s*([^|·]*)','i'));if(m&&m[1].trim())return m[1].trim()}return ''};
  const link=v=>{const t=String(v||'').trim();if(!t)return '';return /^https?:\/\//i.test(t)?t:'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(t)};
  function etapaSvc(o){
    const s=st(o);if(s==='cancelado')return -1;if(s==='entregado')return 4;
    if(!o.motorizado_id)return 1;
    if(['en_camino','en_entrega','camino_entrega','confirmando_pago'].includes(s))return 3;
    return 2;
  }
  /* Mapa en vivo del motorizado dentro del paso «Recoger» y «Entrega y cobro» (justo debajo del estado) */
  function ponerMapa(m,steps,e,o,fase,rec,ent,mn,txt){
    try{
      const PM=window.pdMapaPedido;if(!PM||!o.motorizado_id||(e!==2&&e!==3))return;
      const s=steps[e];if(!s||!s.body)return;
      const i=s.body.indexOf('</div>');
      s.body=i<0?PM.slot()+s.body:s.body.slice(0,i+6)+PM.slot()+s.body.slice(i+6);
      const P=PM.puntos.pt,PL=PM.puntos.ptDeLink||(()=>null),LD=PM.puntos.linkDe||(()=>'');
      const pto=(c,ls)=>P(c&&c[0],c&&c[1])||ls.map(PL).find(Boolean)||null,lnk=ls=>ls.map(LD).find(Boolean)||'';
      const rL=[rec&&rec[2],o.ubicacion_recojo,o.direccion_recojo],eL=[o.ubicacion_entrega,o.direccion_entrega];
      m.mounted=root=>PM.montar(root,{pedidoId:String(o.id),motoId:o.motorizado_id,motoNombre:String(mn||'').split(' ')[0]||'El motorizado',fase,rec:pto(rec,rL),ent:pto(ent,eL),recLink:lnk(rL),entLink:lnk(eL),...(txt||{})});
    }catch(_){}
  }
  /* Solo admin: los pasos del motorizado que aún no llegan se pueden abrir para revisar los datos */
  /* Ubicación de las agencias (la que se marca en Más › Agencias o en el formulario de encomienda) */
  /* Yape de Pidemás (Más › QR Yape): número y titular para el mensaje de cobro */
  const YC={d:null,p:null};
  function yapeCfgP(){if(!YC.d&&!YC.p)YC.p=fetch('https://escxesvzndmyfuteawey.supabase.co/storage/v1/object/public/restaurantes/config/yape.json?t='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(j=>{YC.d=j||{};try{if(PdPasos.isOpen())PdPasos.render()}catch(_){}}).catch(()=>{YC.d={}});
    return Object.assign({numero:'986233533',titular:'Grupo Pidemás EIRL',url:''},YC.d||{})}
  const AGU={d:null,p:null};
  const agClaveU=n=>String(n||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  function agUbi(nom){
    if(!AGU.d&&!AGU.p)AGU.p=fetch('https://escxesvzndmyfuteawey.supabase.co/storage/v1/object/public/restaurantes/config/agencias.json?t='+Date.now(),{cache:'no-store'})
      .then(r=>r.ok?r.json():{}).then(j=>{AGU.d=(j&&j.agencias)||j||{};try{if(PdPasos.isOpen())PdPasos.render()}catch(_){}}).catch(()=>{AGU.d={}});
    const u=(AGU.d||{})[agClaveU(nom)];return u&&Number.isFinite(+u.lat)&&Number.isFinite(+u.lng)&&+u.lat!==0?{lat:+u.lat,lng:+u.lng}:null;
  }
  /* punto de cada agencia: el paquete 1 usa el punto de entrega del pedido si lo tiene */
  function agPunto(o,nom,primero){const la=Number(o.latitud_entrega),lo=Number(o.longitud_entrega);if(primero&&la&&lo)return {lat:la,lng:lo};return agUbi(nom)}
  function agBotones(o,lista){
    const vistos=new Set();let h='';
    lista.forEach((nom,i)=>{nom=String(nom||'').trim();if(!nom||vistos.has(agClaveU(nom)))return;vistos.add(agClaveU(nom));
      const pt=agPunto(o,nom,i===0);
      h+=pt?`<a class="b o" style="display:flex;width:100%;box-sizing:border-box;justify-content:center" href="https://www.google.com/maps/search/?api=1&query=${pt.lat},${pt.lng}" target="_blank" rel="noopener">${(U.I&&U.I.nav)||''}Ir a la agencia ${E(nom)}</a>`
        :(AGU.d?U.note('La agencia '+E(nom)+' no tiene ubicación guardada. Márcala en Más › Agencias.'):'');
    });
    return h;
  }
  function verPasos(steps){[2,3].forEach(i=>{const s=steps[i];if(s&&s.state==='locked'&&s.body){s.ver=true;s.body=U.note('Todavía no llega a este paso. Revisa que los datos estén bien.')+s.body}})}
  function modeloSvc(o){
    const id=String(o.id),t=svc(o),e=etapaSvc(o),s0=st(o),mo=moto(o),mn=o.motorizado_nombre||mo.nombre_completo||'El motorizado';
    const NOM={enc:'Encomienda',compra:'Compra',recojo:'Recojo y entrega'}[t]||'Pedido';
    const yape=String(o.metodo_pago||'').toLowerCase()==='yape',metodo=yape?'Yape':'Efectivo';
    const mom=String(o.pago_servicio_momento||'').toLowerCase(),alRec=mom==='recojo_efectivo'||mom==='recojo_yape';
    const remN=o.nombre_remitente||o.nombre_cliente||'Cliente',remT=o.telefono_remitente||o.telefono_cliente;
    const recN=t==='compra'?(o.nombre_receptor||o.nombre_cliente||remN):(o.nombre_receptor||o.nombre_cliente||'Quien recibe'),recT=t==='compra'?(o.telefono_receptor||o.telefono_cliente||remT):(o.telefono_receptor||o.telefono_cliente);
    const enAg=o.pedido_en_agencia===true||String(o.pedido_en_agencia||'').toLowerCase()==='true';
    let paq=[];try{paq=Array.isArray(o.paquetes_envio)?o.paquetes_envio:JSON.parse(o.paquetes_envio||'[]')}catch(_){}
    /* paquetes de la encomienda (agencia y destino) y la guía que subió el motorizado por cada uno */
    const pks=[{numero:1,agencia:o.agencia_destino||'',destino:o.destino_final||o.direccion_entrega||'',pago:o.tipo_pago_encomienda,recibe:o.nombre_receptor||'',tel:o.telefono_receptor||'',dni:o.dni_receptor||''}];
    const PX=(Array.isArray(o.paquetes_extra)?o.paquetes_extra:[]).filter(x=>x&&Number(x.numero)>1);
    if(PX.length)PX.forEach(x=>pks.push({numero:+x.numero,agencia:x.agencia||'',destino:x.destino||'',pago:x.tipo_pago,recibe:x.recibe_nombre||'',tel:x.recibe_telefono||'',dni:x.recibe_dni||'',cd:x.costo_delivery}));
    else{const m=String(o.observaciones||'').match(/PAQUETES ADICIONALES:\s*([^|]*(?:\|\|[^|]*)*)/);if(m)m[1].split('||').forEach(z=>{const r=z.match(/Paquete\s*(\d+)\s*:\s*Agencia\s*([^;]*);\s*destino\s*([^;]*)/i);if(r){const mp=z.match(/modalidad\s+([a-z_]+)/i);pks.push({numero:+r[1],agencia:r[2].trim(),destino:r[3].trim(),pago:mp?mp[1]:'',recibe:o.nombre_receptor||'',tel:o.telefono_receptor||''})}})}
    const pagoTx=v=>v==='pago_en_agencia'?'Pago en agencia':v==='pago_a_destino'?'Pago a destino':'—';
    /* delivery de cada paquete (guía): los adicionales lo guardan en paquetes_extra; el paquete 1 es el resto del total */
    {const nn=v=>v===null||v===undefined||v===''?NaN:Number(v);const tot=Number(o.costo_delivery)||0;
      if(pks.length===1)pks[0].cd=tot;
      else if(pks.slice(1).every(p=>Number.isFinite(nn(p.cd)))){const ex=pks.slice(1).reduce((a,p)=>a+nn(p.cd),0);pks[0].cd=Math.max(0,Math.round((tot-ex)*100)/100);pks.slice(1).forEach(p=>p.cd=nn(p.cd))}
      else pks.forEach(p=>p.cd=null)}
    const agK=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
    /* lo que se pagó en la agencia de ese paquete (lo registra el motorizado al pagar) */
    const pagoAg=p=>{if(p.pago!=='pago_en_agencia')return null;const L=Array.isArray(o.agencias_proceso)?o.agencias_proceso:[];const x=L.find(y=>agK(y.agencia)===agK(p.agencia)&&y.pago_en);
      if(x&&x.pago_paquetes&&x.pago_paquetes[p.numero]!=null)return {m:Number(x.pago_paquetes[p.numero])||0,solo:true};
      if(x)return {m:Number(x.pago_monto)||0,solo:mismaAg(p).filter(y=>y.pago==='pago_en_agencia').length<2};if(pks.length===1&&Number(o.monto_pagado_agencia)>0)return {m:Number(o.monto_pagado_agencia),solo:true};return null};
    const mismaAg=p=>pks.filter(y=>agK(y.agencia)===agK(p.agencia));
    /* Qué ya pagó el cliente a Pidemás. El delivery (servicio) y lo que Pidemás adelantó en las agencias son cobros distintos:
       que el delivery esté pagado NO significa que el envío de la agencia esté pagado. */
    const delPag=/servicio marcado como pagado/i.test(String(o.observaciones||''))||String(o.pago_servicio_momento||'').toLowerCase()==='pagado'||o.pago_confirmado===true;
    const agCob=!!o.pago_agencia_cobrado_en;
    const agTot=(()=>{const L=Array.isArray(o.agencias_proceso)?o.agencias_proceso:[];const x=L.reduce((a,y)=>a+(y&&y.pago_en?Number(y.pago_monto)||0:0),0);return Math.round((x||Number(o.monto_pagado_agencia)||0)*100)/100})();
    const pendTot=Math.round(((delPag?0:Number(o.total)||0)+(agCob?0:agTot))*100)/100;
    const pkgBox=p=>sumBox('Paquete '+p.numero,li('Ruta',E([p.agencia,p.destino].filter(Boolean).join(' → ')||'—'))+li('Pago del envío',pagoTx(p.pago))+li('Recibe · nombre',E(p.recibe||'—'))+li('DNI',E(p.dni||'—'))+li('Número',E(p.tel||'—')));
    const procAg=Array.isArray(o.agencias_proceso)?o.agencias_proceso:[];
    const gs=paq.filter(x=>x&&Number(x.numero)>0);
    if(!gs.some(x=>Number(x.numero)===1)&&o.guia_url&&o.guia_url!=='whatsapp')gs.push({numero:1,guia_url:o.guia_url,clave:String(o.clave_guia||'')==='SIN_CLAVE'?'':o.clave_guia,sin_clave:String(o.clave_guia||'')==='SIN_CLAVE'});
    const gDe=n=>gs.find(x=>Number(x.numero)===n);
    const okG=x=>!!(x&&(x.enviado_whatsapp||((x.sin_guia||(x.guia_url&&x.guia_url!=='whatsapp'&&x.guia_url!=='sin_guia'))&&(x.sin_clave||String(x.clave||'').trim()))));
    const guias=pks.every(p=>okG(gDe(p.numero)));
    const titulos=t==='enc'?['Pedido recibido','Asignar motorizado','Recoger los paquetes','Agencia y guía','Cerrado']:['Pedido recibido','Asignar motorizado',t==='compra'?'Hacer la compra':'Recoger','Entrega y cobro','Cerrado'];
    const steps=titulos.map((tt,i)=>({title:tt,state:e===-1?'locked':e===4||i<e?'done':i===e?'active':'locked'}));
    const cobra=o.pago_confirmado===true&&!(Number(o.monto_recibido)>0)?0:Number(o.total||0);
    const notas=limpiar(o.observaciones).filter(x=>!/^(Compra solicitada|Comprobante|DNI\/RUC|Nombre comprobante|Razón social|Dirección fiscal|Lugar de compra|¿De dónde|¿Qué desea|Monto entregado|Cambio para|Pago por Yape|Pago en efectivo|Paga quien|Servicio marcado como PAGADO|Pedido a nombre de|Pide el servicio|El cliente paga al final)/i.test(x));
    const aNom=t!=='compra'?(o.recojo_a_nombre||campo(o,'Pedido a nombre de')):'';
    const subQ=(base)=>E(base)+(aNom?`<div style="margin-top:2px">A nombre de <b style="color:#1F1A17">${E(aNom)}</b></div>`:'');
    /* Cada paso muestra solo lo de su etapa (mismo diseño que el motorizado): nada se repite */
    const pagado=/servicio marcado como pagado/i.test(String(o.observaciones||'')),qp=String(o.quien_paga||'').toLowerCase();
    const sub0=Number(o.subtotal)||0,serv0=Number(o.costo_delivery)||Math.max(0,(Number(o.total)||0)-sub0)||(Number(o.total)||0),tot0=t==='compra'&&sub0>0?sub0+serv0:(Number(o.total)||0);
    const pagaCon=(()=>{const m=String(o.observaciones||'').match(/__PIDEMAS_PAGO_EFECTIVO__\s*(\{[^{}]*\})/);if(!m)return 0;try{const x=JSON.parse(m[1]);const v=Number(x.monto??x.montoPago??x.paid);return v>0?v:0}catch(_){return 0}})();
    const sumBox=(lbl,html)=>`<div class="sum"><div class="lbl">${lbl}</div>${html}</div>`;
    const txt=v=>`<div style="font-size:15px;line-height:1.5;white-space:pre-line;color:#1F1A17;overflow-wrap:anywhere">${E(v)}</div>`;
    const li=(k,v,c)=>`<div class="li${c?' t':''}"><span>${k}</span><b>${v}</b></div>`;
    const btnIr=(url,lbl)=>`<a class="b o" style="display:flex;width:100%;box-sizing:border-box;justify-content:center${url?'':';opacity:.45;pointer-events:none'}"${url?` href="${E(url)}" target="_blank" rel="noopener"`:' aria-disabled="true"'}>${U.I.nav||''}${lbl}</a>`;
    /* 0 · Pedido recibido: quién lo pidió, cuánto cuesta el servicio y cómo paga */
    {const s=steps[0];s.sum=NOM+' · '+M(serv0)+(o.creado_en?' · '+U.hora(o.creado_en):'');
      const pagoTx=pagado?'Ya pagado':mom==='al_final'?(t==='enc'?'Al final a Pidemás · al recibir la guía':'Al final a Pidemás'):metodo+(alRec?' al recoger':'')+(t==='recojo'&&(qp==='envia'||qp==='recibe')?' · paga quien '+(qp==='envia'?'envía':'recibe'):'');
      let h=`<div class="amt"><div class="k">${t==='compra'?'Costo del servicio':'Total del servicio'}</div><div class="n">${M(serv0)}</div><div class="pill">${E(pagoTx)}</div></div>`;
      if(pagaCon>0&&!pagado&&metodo==='Efectivo')h+=t==='compra'&&!(sub0>0)?'<div class="vto info"><span>El motorizado lleva sencillo<small style="display:block;margin-top:2px;font-size:13.5px;font-weight:600;opacity:.85">El cliente paga con un billete de '+M(pagaCon)+'. El vuelto exacto sale al registrar la compra.</small></span></div>':(()=>{const sb=t=>'<small style="display:block;margin-top:2px;font-size:13.5px;font-weight:600;opacity:.85">'+t+'</small>';return pagaCon-tot0>0.004?'<div class="vto"><span>El motorizado lleva '+M(pagaCon-tot0)+' de sencillo para el vuelto'+sb('Cobra '+M(tot0)+' y el cliente paga con un billete de '+M(pagaCon))+'</span></div>':'<div class="vto"><span>No necesita sencillo'+sb('Cobra '+M(tot0)+' y el cliente paga exacto')+'</span></div>'})();
      /* solo el resumen: los datos de contacto salen en el paso donde se usan */
      const pideR=t==='recojo'&&/quien recibe/i.test(campo(o,'Pide el servicio')||'');
      /* resumen completo: quién envía, dónde se recoge (todos los puntos), a dónde va (todos los destinos) y dónde se compra (todos los lugares) */
      {const PRr=Array.isArray(o.puntos_recojo)?o.puntos_recojo.filter(Boolean):[],dc=v=>String(v||'').replace(/https?:\/\/\S+/g,'').replace(/[\s·,|-]+$/,'').trim();
        const q2=(n,d)=>E(n||'—')+(dc(d)&&dc(d)!==String(n||'').trim()?`<div style="font-weight:500;font-size:13.5px;color:#6B5E55">${E(dc(d))}</div>`:'');
        let r='';
        if(t==='compra'){const lug=dc(o.direccion_recojo||campo(o,'Lugar de compra','¿De dónde desea la compra?'));
          r+=li(recN&&recN!==remN?'Pide la compra':'Cliente',E(remN));
          r+=li(PRr.length?'Compra · lugar 1':'Compra en',q2(lug||'—',''));PRr.forEach(x=>{r+=li('Compra · lugar '+E(x.n),q2(x.nombre,''))});
          r+=li('Entrega en',q2(recN,o.direccion_entrega))}
        else if(t==='enc'){
          r+=li('Pide el servicio',pideR?'Quien recibe':'Quien envía')+li('Envía',q2(remN,o.direccion_recojo))+(aNom?li('A nombre de',E(aNom)):'');
          pks.forEach(p=>{r+=li(pks.length>1?'Paquete '+p.numero:'Destino',E([p.agencia,p.destino].filter(Boolean).join(' → ')||'—')+(p.recibe?`<div style="font-weight:500;font-size:13.5px;color:#6B5E55">Recibe ${E(p.recibe)}</div>`:''))})}
        else{
          r+=li('Pide el servicio',pideR?'Quien recibe':'Quien envía');
          r+=li(PRr.length?'Recoge · punto 1':'Recoge en',q2(remN,o.direccion_recojo))+(aNom?li('A nombre de',E(aNom)):'');
          PRr.forEach(x=>{r+=li('Recoge · punto '+E(x.n),q2(x.nombre,x.direccion))});
          r+=li('Entrega a',q2(recN,o.direccion_entrega))}
        h+=sumBox('Resumen',r+(o.creado_en?li('Pedido a las',E(U.hora(o.creado_en))):''))}
      s.body=h;}
    /* 1 · Asignar */
    {const s=steps[1];s.sum='Asignado a '+mn;
      if(e===1){const la=o.latitud_recojo,lo=o.longitud_recojo;
        const libres=MOTOS().filter(m=>m.activo!==false&&!m.en_descanso).map(m=>({m,d:km(la,lo,m.latitud,m.longitud)})).sort((a,b)=>(b.m.disponible===true)-(a.m.disponible===true)||((a.d??1e9)-(b.d??1e9))).slice(0,8);
        s.body=`<div><div class="lbl">Motorizados sugeridos (más cerca y libres)</div><div class="opts" data-act="moto">${libres.map(x=>`<button type="button" class="opt${elegido[id]===String(x.m.id)?' on':''}" data-m="${E(x.m.id)}" style="flex-direction:row;align-items:center;gap:12px"><span class="av r" style="flex:0 0 40px;width:40px;height:40px;font-size:16px">${E(U.ini(x.m.nombre_completo))}</span><span style="flex:1;min-width:0;display:flex;flex-direction:column"><b>${E(x.m.nombre_completo||'Motorizado')}</b><span>${x.m.disponible===true?'Libre':'Ocupado'}${x.m.placa?' · '+E(x.m.placa):''}</span></span><b style="font-size:14px;white-space:nowrap">${x.d!=null?x.d.toFixed(1)+' km':''}</b></button>`).join('')||'<div class="note">No hay motorizados activos.</div>'}</div></div>`;
      }else s.body=U.who(mn,'Motorizado asignado'+(o.asignado_en?' · '+U.hora(o.asignado_en):''),mo.foto_url||'',true)+U.contact(null,mo.telefono,'');}
    /* 2 · Hacer la compra / recoger: dónde, qué y cuánto se gastó */
    {const s=steps[2];s.locked='Se muestra al asignar el motorizado';
      /* ordenado y sin repetir: estado arriba, luego cada lugar (lugar o punto) con lo suyo, el comprobante y el cobro */
      const PRa=Array.isArray(o.puntos_recojo)?o.puntos_recojo.filter(Boolean):[],hr=v=>v?' · '+U.hora(v):'';
      const cap=v=>{v=String(v||'');return v.charAt(0).toUpperCase()+v.slice(1)};
      const sub2=v=>`<div style="font-weight:500;font-size:13.5px;color:#6B5E55">${v}</div>`;
      const compBox=()=>{const cmp=campo(o,'Comprobante')||o.tipo_comprobante||'',doc=campo(o,'DNI/RUC')||o.documento_comprobante||'',cnm=campo(o,'Nombre comprobante'),crz=campo(o,'Razón social'),cdf=campo(o,'Dirección fiscal');
        if(!((cmp&&!/no especificado/i.test(cmp))||doc))return '';
        return sumBox('Comprobante',(cmp?li('Tipo',E(cap(cmp))):'')+(doc?li(/factura/i.test(cmp)?'RUC':'DNI',E(doc)):'')+(cnm?li('Nombre',E(cnm)):'')+(crz?li('Razón social',E(crz)):'')+(cdf?li('Dirección fiscal',E(cdf)):''))};
      const cobroRec=()=>{if(!alRec)return '';
        if(o.pago_confirmado===true)return U.st('Cobró '+M(o.total)+' al recoger · '+E(metodo),'ok');
        const q=PRa.find(x=>x.paga_aqui),donde=t==='recojo'&&PRa.length?'Cobra todo en el punto '+(q?q.n:1)+' ('+E((q?q.nombre:remN)||'')+')':t==='enc'?'Le cobra a quien envía al recoger los paquetes':'Cobra al recoger, antes de salir a entregar';
        return `<div class="amt"><div class="k">Cobro al cliente</div><div class="n">${M(o.total)}</div><div class="pill">${mom==='recojo_yape'?'Yape':'Efectivo'}</div></div>`+U.note(donde+'.')};
      let h=s0==='asignado'?U.st('Esperando que '+E(mn)+' acepte el pedido')+U.note('Si no responde, llámalo y acéptalo tú por él.'):'';
      if(t==='compra'){
        const fotosC=o=>{const L=Array.isArray(o&&o.compra_fotos)?o.compra_fotos.filter(Boolean):[];return L.length?`<div class="lbl" style="margin-top:4px">Fotos de la compra</div><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">${L.map((u,i)=>`<a href="${E(u)}" target="_blank" rel="noopener" style="display:block;aspect-ratio:1/1;border-radius:12px;overflow:hidden;border:1px solid #F1E4DA;background:#FFF9F5"><img src="${E(u)}" alt="Foto ${i+1} de la compra" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block"></a>`).join('')}</div>`:''};
        const lr=String(o.direccion_recojo||campo(o,'Lugar de compra','¿De dónde desea la compra?')||''),lugar=lr.replace(/https?:\/\/\S+/g,'').replace(/[\s·,|-]+$/,'').trim();
        const det=campo(o,'Compra solicitada','¿Qué desea que compremos?');
        s.sum=(lugar||'Compra')+(PRa.length?' + '+PRa.length+' lugar'+(PRa.length>1?'es':''):'')+(sub0>0?' · gastó '+M(sub0):'');
        if(!h)h=U.st(E(mn)+(e>2||sub0>0?' hizo la compra'+(sub0>0?' · gastó '+M(sub0):''):' está haciendo la compra'+(PRa.length?' · '+PRa.filter(x=>x.recogido_en).length+' de '+PRa.length+' lugares adicionales listos':'')),e>2||sub0>0?'ok':'');
        const L=[{n:1,nombre:lugar||'Lugar no indicado',que:det,hecho:o.punto1_listo_en,monto:o.punto1_monto,foto:o.punto1_foto_url,url:lugar||LK(lr)||LK(o.ubicacion_recojo)?U.maps(o.latitud_recojo,o.longitud_recojo,lugar,LK(lr)||LK(o.ubicacion_recojo)):''}]
          .concat(PRa.map(x=>({n:x.n,nombre:x.nombre||'Lugar '+x.n,que:x.que,obs:x.obs,cd:x.costo_delivery,hecho:x.recogido_en,monto:x.monto,foto:x.foto_url,url:x.lat&&x.lng||x.ubicacion?U.maps(x.lat,x.lng,x.nombre,LK(x.ubicacion)):''})));
        L.forEach(q=>{h+=`<div class="sum" style="gap:10px"><div class="lbl">${L.length>1?'Lugar '+q.n+' de '+L.length+(q.hecho?' · comprado'+E(hr(q.hecho)):''):'Lugar de compra'}</div>`+
          U.who(q.nombre,'Compra aquí'+(q.n===1?' · pedido '+E(U.ref(id)):''),'')+btnIr(q.url,L.length>1?'Ir al lugar '+q.n:'Ir al lugar de compra')+(L.length>1&&(()=>{const ok=PRa.every(x=>x.costo_delivery!=null&&x.costo_delivery!=='');if(!ok)return false;q.cd1=q.n===1?Math.max(0,Math.round((serv0-PRa.reduce((a,x)=>a+(Number(x.costo_delivery)||0),0))*100)/100):Number(q.cd);return true})()?li('Delivery de este lugar',M(q.cd1)):'')+`<div class="lbl" style="margin-top:4px">Qué comprar</div>`+txt(q.que||'—')+(q.n===1?fotosC(o):'')+
          ((q.n===1?notas.join(' · '):q.obs)?`<div class="lbl" style="margin-top:4px">Observaciones</div>`+txt(q.n===1?notas.join(' · '):q.obs):'')+(q.monto!=null&&q.monto!==''?(()=>{const cliT=String(o.telefono_cliente||o.telefono_remitente||'').replace(/\D/g,''),cliN=String(o.nombre_cliente||o.nombre_remitente||'').split(' ')[0];
            const txW='Hola'+(cliN?' '+cliN:'')+', te escribimos de Pidemás. Tu compra '+U.ref(id)+' en '+q.nombre+': se gastó '+M(q.monto)+'.'+(q.foto?'\nFoto de la boleta: '+q.foto:''),wa=cliT&&q.foto?'https://wa.me/'+(cliT.length===9?'51'+cliT:cliT)+'?text='+encodeURIComponent(txW):'';
            return `<div style="display:flex;gap:12px;align-items:center">`+(q.foto?`<a href="${E(q.foto)}" target="_blank" rel="noopener" style="flex:0 0 84px"><img src="${E(q.foto)}" alt="Boleta del lugar ${q.n}" style="width:84px;height:84px;object-fit:cover;border-radius:12px;display:block"></a>`:'')+
              `<div style="flex:1;min-width:0;display:flex;flex-direction:column">`+li('Gastado',M(q.monto))+li('Boleta',q.foto?'Guardada ✓':'Sin boleta')+`</div></div>`+(!(sub0>0)?U.note('El motorizado puede cambiar este monto hasta registrar la compra.'):'')+
              (wa?`<a class="b o" style="display:flex;width:100%;box-sizing:border-box;justify-content:center" href="${E(wa)}" target="_blank" rel="noopener">Enviar boleta al cliente por WhatsApp</a>`:'')})():(e>=2&&!(sub0>0)?U.st('Falta que el motorizado guarde lo gastado aquí'):''))+`</div>`});
        h+=compBox()+efectivoBox(o,mn,'compra');
        if(!(sub0>0)&&e>=2){const LL=L.filter(q=>q.monto!=null&&q.monto!=='');h+=LL.length?U.st('Gastado hasta ahora · '+M(LL.reduce((a,q)=>a+(Number(q.monto)||0),0))+(LL.length<L.length?' ('+LL.length+' de '+L.length+' lugares)':' · falta que registre la compra')):U.note('El motorizado guarda aquí lo que gastó en cada lugar y la foto de la boleta.')}
      }else if(t==='enc'){
        s.sum='Recogido'+hr(o.en_camino_en);
        if(!h)h=U.st(E(mn)+(e>2?' recogió los paquetes'+hr(o.en_camino_en):' va a recoger los paquetes'),e>2?'ok':'');
        h+=U.who(remN,subQ('Quien envía · pedido '+U.ref(id)),'',true)+U.addr(o.direccion_recojo,o.referencia_recojo)+U.contact(U.maps(o.latitud_recojo,o.longitud_recojo,o.direccion_recojo,LK(o.ubicacion_recojo)),remT,'');
        h+=pks.map(p=>sumBox('Paquete '+p.numero+(pks.length>1?' de '+pks.length:''),li('Ruta',E([p.agencia,p.destino].filter(Boolean).join(' → ')||'—'))+li('Pago del envío',pagoTx(p.pago))+
          li('Recibe',E(p.recibe||'—')+([p.dni?'DNI '+E(p.dni):'',p.tel?E(p.tel):''].filter(Boolean).length?sub2([p.dni?'DNI: '+E(p.dni):'',p.tel?'Número: '+E(p.tel):''].filter(Boolean).join('<br>')):'')))).join('');
        h+=compBox()+cobroRec()+efectivoBox(o,mn,'enc');
      }else{
        const listos=PRa.filter(x=>x.recogido_en).length;
        s.sum=PRa.length?(e>2?'Recogido en '+(PRa.length+1)+' puntos':listos+' de '+PRa.length+' puntos adicionales'):'Recogido'+hr(o.en_camino_en);
        if(!h)h=U.st(E(mn)+(e>2?' recogió '+(PRa.length?'en los '+(PRa.length+1)+' puntos':'el pedido')+hr(o.en_camino_en):' va a recoger'+(PRa.length?' · '+listos+' de '+PRa.length+' puntos adicionales listos':'')),e>2?'ok':'');
        if(PRa.length){
          const exOk=PRa.every(x=>x.costo_delivery!=null&&x.costo_delivery!==''),ex=PRa.reduce((a,x)=>a+(Number(x.costo_delivery)||0),0),pg=PRa.find(x=>x.paga_aqui);
          const L=[{n:1,nombre:remN,direccion:o.direccion_recojo,referencia:o.referencia_recojo,a_nombre:aNom,telefono:remT,costo_delivery:exOk?Math.max(0,Math.round(((Number(o.total)||0)-ex)*100)/100):null,lat:o.latitud_recojo,lng:o.longitud_recojo,ubicacion:o.ubicacion_recojo,hecho:o.punto1_listo_en||(e>2?o.en_camino_en||'ok':null),paga:!pg}].concat(PRa.map(x=>Object.assign({},x,{hecho:x.recogido_en,paga:!!x.paga_aqui})));
          L.forEach(q=>{h+=`<div class="sum" style="gap:10px"><div class="lbl">Punto ${E(q.n)} de ${L.length}${q.hecho?' · recogido'+(q.hecho!=='ok'?E(hr(q.hecho)):''):''}</div>`+
            U.who(q.nombre||'Punto '+q.n,'Recojo aquí'+(q.n===1?' · pedido '+E(U.ref(id)):''),'',true)+U.addr(q.direccion,q.referencia)+
            U.contact(U.maps(q.lat,q.lng,q.direccion,LK(q.ubicacion)),q.telefono,'')+
            (q.a_nombre?li('Pedido a nombre de',E(q.a_nombre)):'')+(q.costo_delivery!=null&&q.costo_delivery!==''?li('Delivery de este punto',M(q.costo_delivery)):'')+(alRec&&q.paga?li('Paga el servicio','Aquí · '+M(o.total)):'')+
            `</div>`});
        }else h+=U.who(remN,subQ('Recojo aquí · pedido '+U.ref(id)),'',true)+U.addr(o.direccion_recojo,o.referencia_recojo)+U.contact(U.maps(o.latitud_recojo,o.longitud_recojo,o.direccion_recojo,LK(o.ubicacion_recojo)),remT,'');
        if(notas.length)h+=sumBox('Notas del servicio',txt(notas.join(' · ')));
        h+=cobroRec();
      }
      s.body=h;}
    /* Yape a Pidemás: la captura (o el n.° de operación) se guarda con el pedido. En encomiendas que se pagan
       al final, aquí se registra el Yape del cliente. */
    const PY=window.PdYapeP;
    const qY=t==='enc'&&delPag?{dest:'agencia',titulo:'Prueba del Yape del envío'}:null;
    /* mensaje automático de WhatsApp con lo que el cliente tiene pendiente de pagar a Pidemás */
    const cobroWa=()=>{const cliT=o.telefono_cliente||o.telefono_remitente,cliN=o.nombre_cliente||o.nombre_remitente||'',tel=String(cliT||'').replace(/\D/g,'');
      if(!tel)return U.note('El cliente no tiene teléfono registrado para enviarle el cobro.');
      const L=[];if(!agCob)procAg.filter(x=>x&&x.pago_en&&Number(x.pago_monto)>0).forEach(x=>{const ps=pks.filter(p=>agK(p.agencia)===agK(x.agencia)),pp=x.pago_paquetes||{};
          if(ps.length>1&&ps.every(p=>pp[p.numero]!=null))ps.forEach(p=>L.push('• Envío en '+x.agencia+' (paquete '+p.numero+' → '+(p.destino||'—')+'): '+M(pp[p.numero])));
          else L.push('• Envío en '+x.agencia+(ps.length?' (paquete'+(ps.length>1?'s ':' ')+ps.map(p=>p.numero).join(' y ')+' → '+ps.map(p=>p.destino||'—').join(', ')+')':'')+': '+M(x.pago_monto))});
      if(!agCob&&!L.length&&agTot>0)L.push('• Envío pagado en agencia: '+M(agTot));
      if(!delPag)L.push('• Delivery Pidemás: '+M(o.total));
      const y=yapeCfgP();
      const txt=['Hola'+(cliN?' '+String(cliN).split(' ')[0]:'')+', te escribimos de *Pidemás* por tu encomienda '+U.ref(id)+'.','','Tienes pendiente de pago:',...L,'*Total a pagar: '+M(pendTot)+'*','',
        'Puedes pagar por Yape a Pidemás:','📱 '+y.numero+(y.titular?' · '+y.titular:''),...(y.url?['QR: '+y.url]:[]),'','Cuando pagues, envíanos la captura del Yape por aquí. ¡Gracias!'].join('\n');
      return `<a class="b g" style="display:flex;width:100%;box-sizing:border-box;justify-content:center" href="https://wa.me/${tel.length===9?'51'+tel:tel}?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener">Enviar cobro al cliente por WhatsApp</a>`};
    /* recojo o compra que paga al final: mensaje de cobro por WhatsApp */
    const cobroSvcWa=()=>{const tel=String(o.telefono_cliente||o.telefono_remitente||'').replace(/\D/g,''),cliN=o.nombre_cliente||o.nombre_remitente||'';
      if(!tel)return U.note('El cliente no tiene teléfono registrado para enviarle el cobro.');const y=yapeCfgP();
      const L=t==='compra'?['• Compra: '+M(sub0),'• Servicio Pidemás: '+M(serv0)]:['• Servicio de recojo y entrega: '+M(tot0)];
      const txt=['Hola'+(cliN?' '+String(cliN).split(' ')[0]:'')+', te escribimos de *Pidemás* por tu '+(t==='compra'?'compra':'servicio de recojo y entrega')+' '+U.ref(id)+'.','','Tienes pendiente de pago:',...L,'*Total a pagar: '+M(tot0)+'*','','Puedes pagar por Yape a Pidemás:','📱 '+y.numero+(y.titular?' · '+y.titular:''),...(y.url?['QR: '+y.url]:[]),'','Cuando pagues, envíanos la captura del Yape por aquí. ¡Gracias!'].join('\n');
      return `<a class="b g" style="display:flex;width:100%;box-sizing:border-box;justify-content:center" href="https://wa.me/${tel.length===9?'51'+tel:tel}?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener">Enviar cobro al cliente por WhatsApp</a>`};
    const yapeAdm=()=>{if(!PY)return '';let h=PY.yaTiene(o)?PY.html(o):'';
      if(t==='enc'&&o.pago_agencia_prueba)h+=PY.html(o,{dest:'agencia',titulo:'Prueba del Yape del envío'});
      if(t==='enc'&&guias&&pendTot>0.004&&st(o)!=='cancelado')h+=`<div class="amt"><div class="k">El cliente debe pagar a Pidemás</div><div class="n">${M(pendTot)}</div><div class="pill">Por Yape · después de recibir la guía y la clave</div></div>`+
        sumBox('Detalle del cobro',(agTot>0&&!agCob?li('Envío pagado en agencias',M(agTot)):'')+(!delPag?li('Delivery Pidemás',M(o.total)):'')+li('Total a cobrar',M(pendTot),1))+
        (agTot>0&&!agCob&&delPag?U.note('El delivery ya está pagado; falta lo que Pidemás pagó en la agencia.'):'')+
        cobroWa()+
        U.note('Si no paga, vuelve a enviarle el cobro. Cuando llegue el Yape, confírmalo en <b>Caja › Yape por confirmar</b>.');
      return h};
    /* Pagos en agencias: una tarjeta por agencia (monto, paquetes, horas) y el total; dice si el cliente ya lo devolvió */
    const pagosAgHtml=()=>{
      const L=procAg.filter(x=>x&&x.agencia);if(!L.length)return Number(o.monto_pagado_agencia)>0?sumBox('Pagos en agencias',li('Total pagado',M(o.monto_pagado_agencia),1)):'';
      const fila=x=>{const ps=pks.filter(p=>agK(p.agencia)===agK(x.agencia)),pp=x.pago_paquetes||{};
        const sub=[x.llegada_en?'Llegó '+U.hora(x.llegada_en):'',x.pago_en?'Pagó '+U.hora(x.pago_en):'Aún no paga'].filter(Boolean).join(' · ');
        return `<div style="display:flex;flex-direction:column;gap:4px;padding:10px 0;border-top:1px solid #F1E4DA">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px"><b style="font-size:16px">${E(x.agencia)}</b><b style="font-size:17px;color:${x.pago_en?'#1F1A17':'#9A330A'}">${x.pago_en?M(x.pago_monto):'—'}</b></div>
          <span style="font-size:13px;color:#6B5E55">${E(['Paquete'+(ps.length>1?'s ':' ')+ps.map(p=>p.numero+(pp[p.numero]!=null?' ('+M(pp[p.numero])+')':'')).join(', '),sub].filter(Boolean).join(' · '))}</span></div>`};
      const tot=L.reduce((a,x)=>a+(x.pago_en?Number(x.pago_monto)||0:0),0);
      return `<div class="sum"><div class="lbl">Pagos en agencias</div>${L.map(fila).join('')}
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding-top:10px;border-top:1.5px solid #E3CFC2"><b style="font-size:15px">Total pagado por Pidemás</b><b style="font-size:18px">${M(tot)}</b></div>
        ${tot>0&&agCob?'<div class="vto"><span>El cliente ya lo devolvió</span><b>Pagado ✓</b></div>':''}</div>`};
    /* 3 · Entrega y cobro (o agencia): a dónde se lleva y cuánto se cobra */
    {const s=steps[3];s.locked=t==='compra'?'Se muestra al terminar la compra':'Se muestra al recoger';
      if(t==='enc'){s.sum=guias?'Guías enviadas':'En agencia';
        const agsL=[...new Set(pks.map(p=>p.agencia).filter(Boolean))];
        s.body=(enAg?U.st(procAg.length?'Llegó a '+E(procAg.filter(x=>x.llegada_en).map(x=>x.agencia).join(' y '))+(procAg.length<agsL.length?' · falta '+E(agsL.filter(a=>!procAg.some(x=>String(x.agencia).toLowerCase()===String(a).toLowerCase())).join(' y ')):''):'Paquetes en la agencia '+E(o.agencia_destino||''),'ok'):U.st(E(mn)+(agsL.length>1?' va a las agencias '+E(agsL.join(' y ')):' va a la agencia '+E(o.agencia_destino||''))))
            .replace(/<\/span>(<\/div>)?$/,m=>(guias?' · guías completas, mándalas al cliente':enAg?' · esperando la guía y la clave':'')+m)+
          pks.map(p=>{const g=gDe(p.numero),ruta=E([p.agencia,p.destino].filter(Boolean).join(' → ')||'Paquete'),foto=g&&g.guia_url&&g.guia_url!=='whatsapp'&&g.guia_url!=='sin_guia'&&!g.sin_guia?g.guia_url:'';
            if(!okG(g))return sumBox('Paquete '+p.numero+' · '+ruta,li('Guía','Aún no la sube'));
            const clv=g.sin_clave?'La agencia no dio clave':String(g.clave||'—');
            if(!foto&&!g.sin_guia)return sumBox('Paquete '+p.numero+' · '+ruta,li('Guía','Enviada por WhatsApp')+li('Clave','Revisa tu WhatsApp'));
            const cliT=o.telefono_cliente||o.telefono_remitente,cliN=o.nombre_cliente||o.nombre_remitente||'';
            const pq=pagoAg(p),grp=mismaAg(p).filter(y=>y.pago==='pago_en_agencia'),primero=grp[0]===p,pa=pq?pq.m:null,paLinea=!!pq&&(pq.solo||primero),del=p.cd;
            const pendG=Math.round(((paLinea&&!agCob?pa:0)+(del!=null&&!delPag?del:0))*100)/100,estado=ok=>ok?' ✅ pagado':' ⏳ pendiente';
            const mL=[];if(p.pago==='pago_en_agencia'){if(paLinea)mL.push('• Envío en '+(p.agencia||'la agencia')+(!pq.solo&&grp.length>1?' (paquetes '+grp.map(y=>y.numero).join(' y ')+')':'')+', lo pagó Pidemás: '+M(pa)+estado(agCob));else if(pa!=null)mL.push('• Envío: ya va en la guía del paquete '+grp[0].numero);}
              else if(p.pago==='pago_a_destino')mL.push('• Envío: se paga en la agencia al recoger en destino');
            if(del!=null)mL.push('• Delivery Pidemás: '+M(del)+estado(delPag));
            const montos=mL.length?'\n\n*Montos de esta guía*\n'+mL.join('\n')+((paLinea||del!=null)?(pendG>0.004?'\n*Por pagar a Pidemás: '+M(pendG)+'*':'\n*Esta guía ya está pagada* ✅'):''):'';
            const txt='Hola'+(cliN?' '+String(cliN).split(' ')[0]:'')+', te escribimos de Pidemás. Tu encomienda '+U.ref(id)+(pks.length>1?' (paquete '+p.numero+')':'')+' ya está en la agencia '+(p.agencia||'')+'.\nDestino: '+(p.destino||'—')+'\nClave de recojo: '+clv+(foto?'\nFoto de la guía: '+foto:'\nGuía: la agencia no entregó guía; para recoger usa la clave y tu DNI.')+montos;
            const tel=String(cliT||'').replace(/\D/g,''),wa=tel?'https://wa.me/'+(tel.length===9?'51'+tel:tel)+'?text='+encodeURIComponent(txt):'';
            return `<div class="sum"><div class="lbl">Paquete ${p.numero} · ${ruta}</div><div style="display:flex;gap:12px;align-items:center">${foto?`<a href="${E(foto)}" target="_blank" rel="noopener" style="flex:0 0 84px"><img src="${E(foto)}" alt="Guía del paquete ${p.numero}" style="width:84px;height:84px;object-fit:cover;border-radius:12px;display:block"></a>`:''}`+
              `<div style="flex:1;min-width:0;display:flex;flex-direction:column">`+(foto?'':li('Guía','La agencia no dio guía'))+li('Clave',g.sin_clave?'No dio clave':E(clv))+((paLinea||del!=null)?li('Por pagar',pendG>0.004?M(pendG):'Pagado ✓'):'')+`</div></div>`+
              (del==null&&pks.length>1?U.note('Este pedido se creó sin el delivery de cada paquete; el mensaje no lo incluye.'):'')+
              (wa?`<a class="b o" style="display:flex;width:100%;box-sizing:border-box;justify-content:center;margin-top:6px" href="${E(wa)}" target="_blank" rel="noopener">Enviar al cliente por WhatsApp</a>`:U.note('El cliente no tiene teléfono registrado.'))+`</div>`}).join('')+
          pagosAgHtml()+yapeAdm();}
      else{const cob=t==='compra'?(o.pago_confirmado===true&&!(Number(o.monto_recibido)>0)?0:tot0):cobra;
        s.sum=cob>0&&!alRec?'Cobrado '+M(cob)+' · '+metodo:'Entregado';
        let h=e>=4||s0==='entregado'?U.st(E(mn)+' entregó a '+E(recN)+(o.entregado_en?' · '+U.hora(o.entregado_en):'')+(o.en_entrega_en&&o.entregado_en?' · esperó '+Math.max(0,Math.round((new Date(o.entregado_en)-new Date(o.en_entrega_en))/60000))+' min':''),'ok'):['en_entrega','confirmando_pago'].includes(s0)?llego(o.en_entrega_en,recN,mn,false):U.st(E(mn)+' va camino donde '+E(recN));
        if(mom==='al_final'){/* paga al final a Pidemás: el motorizado no cobra; queda en Cobros pendientes */
          h+=`<div class="amt"><div class="k">Paga al final a Pidemás</div><div class="n">${t==='compra'&&!(sub0>0)?'S/ —':M(tot0)}</div><div class="pill">${o.pago_confirmado===true?'Pagado':'Pendiente'}</div></div>`+(t==='compra'&&sub0>0?sumBox('Montos',li('Compra',M(sub0))+li('Servicio',M(serv0))+li('Total',M(tot0),1)):'');
          if(o.pago_confirmado===true)h+=U.st('El cliente ya pagó a Pidemás','ok');
          else if(t==='compra'&&!(sub0>0))h+=U.note('El monto sale cuando el motorizado registre la compra.');
          else h+=cobroSvcWa()+U.note('Si no paga, vuelve a enviarle el cobro. Cuando llegue el pago, confírmalo en <b>Caja › Cobros pendientes y Yape</b>.');}
        else if(t==='compra'&&!(sub0>0))h+=U.note('El monto a cobrar sale cuando el motorizado registre la compra.');
        else if(!alRec&&cob>0)h+=(o.pago_confirmado===true?U.st('Cobró '+M(cob)+' · '+E(metodo),'ok'):`<div class="amt"><div class="k">Cobro al cliente</div><div class="n">${M(cob)}</div><div class="pill">${E(metodo)}</div></div>`)+(t==='compra'?sumBox('Montos',li('Compra',M(sub0))+li('Servicio',M(serv0))+li('Total',M(tot0),1)):'');
        else h+=U.st(alRec?'Se cobró al recoger: no se cobra al entregar':'Ya está pagado: no se cobra al entregar','ok');
        h+=yapeAdm();
        h+=U.who(recN,(t==='compra'?(o.nombre_receptor?'Recibe la compra (no es quien la pidió)':'Cliente'):(/Pide el servicio:\s*Quien recibe/i.test(String(o.observaciones||''))?'Quien recibe · pidió el servicio':'Quien recibe'))+' · entrega aquí','',true)+U.addr(o.direccion_entrega,o.referencia_entrega)+U.contact(U.maps(o.latitud_entrega,o.longitud_entrega,o.direccion_entrega,LK(o.ubicacion_entrega)),recT,'Hola, te escribimos de Pidemás por tu pedido '+U.ref(id)+'.');
        s.body=h;}}
    /* recojo y entrega con varias entregas: lista de las adicionales y si ya se dejaron */
    {const L=t==='recojo'&&Array.isArray(o.puntos_entrega)?o.puntos_entrega.filter(Boolean):[];if(L.length&&steps[3]){const falta=L.filter(x=>!x.entregado_en).length;
      steps[3].body=(steps[3].body||'')+`<div class="sum" style="gap:8px"><div class="lbl">Entregas adicionales · ${L.length-falta} de ${L.length} listas</div>`+L.map(x=>`<div class="li"><span>Entrega ${E(x.n)} · ${E(x.nombre||'Quien recibe')}${x.telefono?' · '+E(x.telefono):''}<br><small style="color:#6B5E55">${E(x.direccion||'')}${x.que?' · '+E(x.que):''}</small></span><b style="color:${x.entregado_en?'#0F6B33':'#9A330A'}">${x.entregado_en?'Entregado '+U.hora(x.entregado_en):'Pendiente'}</b></div>`).join('')+`</div>`}}
    /* 4 · Cerrado */
    {const s=steps[4];s.locked='Se muestra al entregar';s.sum='Entregado'+(o.entregado_en?' · '+U.hora(o.entregado_en):'');s.body=U.st('Pedido entregado'+(o.entregado_en?' a las '+U.hora(o.entregado_en):''),'ok');}

    /* «Pide el servicio» arriba, en el mismo orden en Admin y Motorizado: quién pide, qué papel tiene y quién paga */
    const pideBox=(()=>{const ob=String(o.observaciones||''),pR=/Pide el servicio:\s*Quien recibe/i.test(ob),rc=o.nombre_receptor||'';
      const rol=t==='compra'?(rc&&rc!==o.nombre_cliente?'Manda a comprar para otra persona':'Manda a comprar para sí mismo'):t==='enc'?(pR?'Quien recibe · manda a recoger la encomienda':'Quien envía la encomienda'):(pR?'Quien recibe · manda a recoger':'Quien envía · manda a recoger y entregar');
      const qp=String(o.quien_paga||''),mo2=String(o.pago_servicio_momento||'').toLowerCase();
      const paga=mo2==='pagado'?'Ya pagado':mo2==='al_final'?'Al final a Pidemás':qp==='recibe'?(t==='compra'?'Quien recibe la compra':'Quien recibe'):qp==='envia'?(t==='compra'?'Quien manda a comprar':'Quien envía'):'Quien pide el servicio';
      if(t==='compra'){const nC=o.nombre_cliente||o.nombre_remitente||'Cliente',tC=o.telefono_cliente||o.telefono_remitente,dir=String(o.direccion_entrega||'').replace(/https?:\/\/\S+/g,'').trim(),rf=o.referencia_entrega||'';
        return `<div class="sum" style="gap:8px"><div class="lbl">Compra</div><div class="lbl" style="margin:0">1 · Quien compra</div>`+U.who(nC,'Pide la compra','',true)+(tC?U.contact(null,tC,''):'')+
          `<div style="height:1px;background:#F1E4DA;margin:4px 0"></div><div class="lbl" style="margin:0">2 · Dónde se recibe</div>`+(o.nombre_receptor&&o.nombre_receptor!==nC?U.who(o.nombre_receptor,'Recibe la compra','',true)+(o.telefono_receptor?U.contact(null,o.telefono_receptor,''):''):'')+
          `<div class="li"><span>Dirección</span><b style="text-align:right">${E(dir||'—')}</b></div>`+(rf?`<div class="li"><span>Referencia</span><b style="text-align:right">${E(rf)}</b></div>`:'')+
          `<div class="li"><span>Paga</span><b>${E(paga)}</b></div></div>`}
      if(t!=='compra'){const nE=o.nombre_remitente||o.nombre_cliente||'Quien envía',tE=o.telefono_remitente||o.telefono_cliente,nR=o.nombre_receptor||'',tR=o.telefono_receptor||'';
        return `<div class="sum" style="gap:8px"><div class="lbl">${t==='enc'?'Encomienda':'Recojo y entrega'}</div>`+
          `<div class="lbl" style="margin:0">1 · Envía</div>`+U.who(nE,t==='enc'?'Entrega la encomienda':'Entrega el pedido','',true)+(tE?U.contact(null,tE,''):'')+
          `<div style="height:1px;background:#F1E4DA;margin:4px 0"></div><div class="lbl" style="margin:0">2 · Recibe</div>`+(nR?U.who(nR,t==='enc'?'Recibe la encomienda':'Recibe el pedido','',true)+(tR?U.contact(null,tR,''):''):`<div class="li"><span>Recibe</span><b>Sin nombre registrado</b></div>`)+
          `<div class="li"><span>Paga</span><b>${E(paga)}</b></div></div>`}
      return `<div class="sum" style="gap:8px"><div class="lbl">Pide el servicio</div>`+U.who(o.nombre_cliente||o.nombre_remitente||'Cliente',E(rol),'',true)+(o.telefono_cliente?U.contact(null,o.telefono_cliente,''):'')+
        (t==='compra'&&rc&&rc!==o.nombre_cliente?`<div class="lbl" style="margin-top:4px">Quien recibe la compra</div>`+U.who(rc,'Otra persona · se le entrega a ella','',true)+(o.telefono_receptor?U.contact(null,o.telefono_receptor,''):''):'')+
        `<div class="li"><span>Paga</span><b>${E(paga)}</b></div></div>`})();
    if(steps[0])steps[0].body=pideBox+(steps[0].body||'');
    /* el motorizado pide que el cliente pague después: autorizar o rechazar */
    if(String(o.pago_despues_estado||'')==='pendiente'&&e>=0&&e<4){const k=Math.min(Math.max(e,0),steps.length-1);
      steps[k].body=`<div class="sum" style="gap:10px;border-color:#E8A317"><div class="lbl" style="color:#8A5A00">${E(mn)} pide que el cliente pague después</div>`+
        `<div class="li"><span>Monto</span><b>${M(Number(o.total)||0)}</b></div>`+(o.pago_despues_motivo?`<div class="li"><span>Motivo</span><b style="text-align:right">${E(o.pago_despues_motivo)}</b></div>`:'')+
        U.note('Si autorizas, entrega sin cobrar y el pedido pasa a Caja › Cobros pendientes para cobrárselo al cliente.')+
        `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px"><button type="button" class="b" data-act="pdRech">Rechazar</button><button type="button" class="b o" data-act="pdAut">Autorizar</button></div></div>`+(steps[k].body||'')}
    else if(String(o.pago_despues_estado||'')==='autorizado'&&e>=0){const k=Math.min(Math.max(e,0),steps.length-1);steps[k].body=U.st('Autorizado: el cliente paga después a Pidemás'+(o.pago_despues_motivo?' · '+E(o.pago_despues_motivo):''),'ok')+(steps[k].body||'')}
    const m={kicker:'Admin · '+NOM+' · '+U.ref(id),steps,err:error,acts:{}};
    if(e===-1){m.title='Pedido cancelado';m.chip='Cancelado';m.chipCls='mal';m.fin={mal:true,title:'Pedido cancelado',text:(o.cancelado_por?'Lo canceló '+o.cancelado_por+'. ':'')+(o.motivo_cancelacion||'')};}
    else{m.title=e===4?'Pedido entregado':titulos[e];m.chip=e===4?'Listo':'Paso '+(e+1)+' de 5';if(e===4){m.chipCls='ok';m.fin={title:'Pedido entregado',text:o.entregado_en?'Entregado a las '+U.hora(o.entregado_en)+'.':''}}}
    if(e===1){const mm=MOTOS().find(x=>String(x.id)===elegido[id]);m.cta={label:mm?'Asignar a '+String(mm.nombre_completo||'').split(' ')[0]:'Asignar',off:!mm,hint:mm?'':'Elige un motorizado de la lista',busy:'Asignando…',run:()=>asignar(id)}}
    m.alt=[];
    if(e===2&&s0==='asignado'){m.cta={label:'Aceptar por el motorizado',busy:'Aceptando…',run:()=>aceptarPorMoto(o)};m.alt.push({label:'Cambiar motorizado',run:async()=>{try{await (window.assignOrder||assignOrder)(id,null)}catch(x){error=String(x?.message||x)}}})}
    m.acts={moto:(box,ev)=>{const b=ev.target.closest('[data-m]');if(!b)return;elegido[id]=b.dataset.m;PdPasos.render()},
      pdAut:async b=>{if(b.disabled)return;b.disabled=true;await pagoDespues(o,mn,true);PdPasos.render()},
      pdRech:async b=>{if(b.disabled)return;b.disabled=true;await pagoDespues(o,mn,false);PdPasos.render()},
      efm:b=>{efV[id]=b.value.replace(/[^\d.,]/g,'')},efq:b=>{efV[id]=b.dataset.v;PdPasos.render()},efdar:async b=>{if(b.disabled)return;b.disabled=true;b.textContent='Registrando…';await efDar(o,mn,t);PdPasos.render()}};
    if(PY){Object.assign(m.acts,PY.acts(o,t==='enc'?qY:null));m.acts.yfReg=async b=>{if(b.disabled)return;error='';const f=PY.falta(o,qY);if(f){error=f;PdPasos.render();return}
      b.disabled=true;b.textContent='Registrando…';
      try{await PY.guardar(o,qY);const up={};if(!delPag)up.pago_confirmado=true;if(agTot>0&&!agCob)up.pago_agencia_cobrado_en=new Date().toISOString();
        const {error:e2}=await D().from('pedidos').update(up).eq('id',o.id);if(e2)throw e2;Object.assign(o,up);
        try{(window.pdExito||window.pdAviso||(()=>{}))('Pago por Yape registrado.')}catch(_){}try{(window.loadOrders||(typeof loadOrders==='function'?loadOrders:null))?.()}catch(_){}}
      catch(x){error='No se pudo registrar: '+(x.message||x)}PdPasos.render()}}
    verPasos(steps);
    if(e===3&&t==='enc'&&!enAg){const ap=agPunto(o,o.agencia_destino,true);ponerMapa(m,steps,e,o,'entrega',[o.latitud_recojo,o.longitud_recojo],ap?[ap.lat,ap.lng]:[null,null],mn,{recPin:'Envía · '+String(remN).split(' ')[0],entPin:'Agencia '+String(o.agencia_destino||'').slice(0,16),recTx:'de quien envía',entTx:'de la agencia',recQuien:'Quien envía',entQuien:'La agencia'})}
    if(e===2||(e===3&&t!=='enc'))ponerMapa(m,steps,e,o,e===2?'recojo':'entrega',[o.latitud_recojo,o.longitud_recojo],[o.latitud_entrega,o.longitud_entrega],mn,
      t==='recojo'?{recPin:'Envía · '+String(remN).split(' ')[0],entPin:'Recibe · '+String(recN).split(' ')[0],recTx:'de quien envía',entTx:'de quien recibe',recQuien:'Quien envía',entQuien:'Quien recibe'}
      :t==='compra'?{recPin:'Compra',recTx:'del lugar de compra',recQuien:'El lugar de compra'}
      :{recPin:'Envía · '+String(remN).split(' ')[0],recTx:'de quien envía',recQuien:'Quien envía'});
    return m;
  }
  function modelo(){
    const o=L().find(x=>String(x.id)===String(abierto));if(!o)return null;
    if(!esNegocio(o))return modeloSvc(o);
    const id=String(o.id),e=etapa(o),n=NEG(o.negocio_id),pa=String(o.pago_acordado||'').toLowerCase();
    const negNom=n.nombre||'Negocio',cli=o.nombre_cliente||'Cliente',mo=moto(o),mn=o.motorizado_nombre||mo.nombre_completo||'El motorizado';
    const yape=String(o.metodo_pago||'').toLowerCase()==='yape';
    const metodo=pa==='yape_negocio'?'Yape del negocio':pa==='solo_delivery'?'Solo delivery':pa==='pagado'?'Todo pagado':yape?'Yape':'Efectivo';
    const cobra=pa==='pagado'?0:pa==='solo_delivery'?Number(o.costo_delivery||0):Number(o.total||0);
    const steps=['Negocio confirma','Asignar motorizado','Recojo en el local','Entrega y cobro','Cierre y pagos'].map((t,i)=>({title:t,state:e===-1?'locked':i<e?'done':i===e?'active':'locked'}));
    const finCerrado=e===4&&!((pa==='yape_negocio'||pa==='pagado')&&!o.delivery_negocio_cobrado_en);
    if(finCerrado)steps[4].state='done';
    const resumen=`<div class="sum"><div class="lbl">Resumen</div><div class="li"><span>Cliente</span><b>${E(cli)}</b></div><div class="li"><span>Productos</span><b>${M(o.subtotal)}</b></div><div class="li"><span>Delivery</span><b>${M(o.costo_delivery)}</b></div><div class="li t"><span>Total · ${E(yape?'Yape':'Efectivo')}</span><b>${M(o.total)}</b></div></div>`;
    /* 1 */
    {const s=steps[0];s.sum=negNom+' aceptó'+(o.tiempo_preparacion_min?' · listo en '+o.tiempo_preparacion_min+' min':'');
      s.body=U.who(negNom,'Recojo aquí · pedido '+E(U.ref(id)),n.logo_url||n.imagen_url||'')+U.addr(n.direccion,'')+U.contact(U.maps(n.latitud,n.longitud,n.direccion,LK(n.google_maps_url)),n.telefono,'Hola, te escribimos de Pidemás por el pedido '+U.ref(id)+'.')+resumen+
        (st(o)==='pendiente'?U.st('Esperando que el negocio acepte. También puedes aceptarlo tú por el negocio.')+
          (()=>{const OT=opcTiempo(n);if(!tiempoSel[id])tiempoSel[id]=OT.def.n;const PO=opcPago(o,n);if(PO.length===1)pagoSel[id]=PO[0][0];
            return `<div><div class="lbl">¿En cuánto estará listo?</div><div class="grid4" style="grid-template-columns:repeat(${OT.ops.length},minmax(0,1fr))">${OT.ops.map(x=>`<button type="button" data-act="tiempo" data-n="${x.n}" class="${x.n===tiempoSel[id]?'on':''}">${E(x.t)}</button>`).join('')}</div></div>`+
              `<div><div class="lbl">¿Cómo cobra el motorizado?</div><div class="opts">${PO.map(x=>`<button type="button" data-act="pago" class="opt${x[0]===pagoSel[id]?' on':''}" data-k="${x[0]}"${x[3]?' disabled style="opacity:.5"':''}><b>${E(x[1])}</b><span>${E(x[2])}</span></button>`).join('')}</div></div>`+
              U.note('Llama o escribe al negocio para confirmar que puede atenderlo antes de aceptarlo.')})():U.st('El negocio aceptó'+(o.tiempo_preparacion_min?' · listo en '+o.tiempo_preparacion_min+' min':'')+(pa?' · '+E(metodo):''),'ok'));}
    /* 2 */
    {const s=steps[1];s.locked='Se muestra cuando el negocio confirme';s.sum='Asignado a '+mn;
      if(e===1){
        const libres=MOTOS().filter(m=>m.activo!==false&&!m.en_descanso).map(m=>({m,d:km(n.latitud,n.longitud,m.latitud,m.longitud)}))
          .sort((a,b)=>(b.m.disponible===true)-(a.m.disponible===true)||((a.d??1e9)-(b.d??1e9))).slice(0,8);
        s.body=`<div><div class="lbl">Motorizados sugeridos (más cerca y libres)</div><div class="opts" data-act="moto">${libres.map(x=>`<button type="button" class="opt${elegido[id]===String(x.m.id)?' on':''}" data-m="${E(x.m.id)}" style="flex-direction:row;align-items:center;gap:12px"><span class="av r" style="flex:0 0 40px;width:40px;height:40px;font-size:16px">${E(U.ini(x.m.nombre_completo))}</span><span style="flex:1;min-width:0;display:flex;flex-direction:column"><b>${E(x.m.nombre_completo||'Motorizado')}</b><span>${x.m.disponible===true?'Libre':'Ocupado'}${x.m.placa?' · '+E(x.m.placa):''}</span></span><b style="font-size:14px;white-space:nowrap">${x.d!=null?x.d.toFixed(1)+' km':''}</b></button>`).join('')||'<div class="note">No hay motorizados activos.</div>'}</div></div>`;
      }else s.body=U.who(mn,'Motorizado asignado'+(o.asignado_en?' · '+U.hora(o.asignado_en):''),mo.foto_url||'',true)+U.contact(null,mo.telefono,'');}
    /* 3 */
    {const s=steps[2];s.locked='Se muestra al asignar el motorizado';s.sum=mn+' recogió el pedido'+(o.en_camino_en?' · '+U.hora(o.en_camino_en):'');
      const ss=st(o);
      s.body=(ss==='asignado'?U.st('Esperando que '+E(mn)+' acepte el pedido')+U.note('Si no responde, llámalo y acéptalo tú por él.'):o.en_local_en?U.st(E(mn)+' llegó al local · '+U.hora(o.en_local_en),'ok'):U.st(E(mn)+' va camino al local'))+
        (o.listo_para_recojo?U.st('El negocio marcó el pedido listo','ok'):'')+
        (o.codigo_recojo?U.code('Código de recojo',o.codigo_recojo,'El negocio lo compara antes de entregar'):'')+
        U.contact(null,mo.telefono,'')+U.note('Si el motorizado tarda más de 10 min en el local, te avisamos.');}
    /* 4 */
    {const s=steps[3];s.locked='Se muestra cuando recoja el pedido';s.sum=cobra>0?'Cobrado '+M(cobra)+' · '+metodo:'Sin cobro al cliente';
      const qn=pa==='yape_negocio';
      s.body=(o.en_entrega_en?llego(o.en_entrega_en,cli,mn,st(o)==='entregado'):U.st(E(mn)+' va camino donde '+E(cli)))+
        (cobra>0?`<div class="amt"><div class="k">${pa==='solo_delivery'?'Cobro solo del delivery':'Cobro al cliente'}</div><div class="n">${M(cobra)}</div><div class="pill">${E(metodo)}</div></div>`+
          `<div class="sum"><div class="lbl">Montos</div><div class="li"><span>Productos</span><b>${pa==='solo_delivery'?'Pagado':M(o.subtotal)}</b></div><div class="li"><span>Delivery</span><b>${M(o.costo_delivery)}</b></div></div>`:U.st('El cliente ya pagó: no se cobra nada','ok'))+
        (qn?`<div class="qr" style="cursor:default"><span class="im"${n.yape_qr_url?` style="background-image:url('${E(n.yape_qr_url)}')"`:''}>${n.yape_qr_url?'':'QR'}</span><span class="t"><span class="k">Yape del negocio</span><span class="a">${E(n.yape_titular||negNom)}</span><span class="b2">${E(n.yape_numero||'')}</span></span></div>`+
          (o.yape_negocio_estado==='esperando'?U.st('Esperando que el negocio confirme el Yape'):o.yape_negocio_estado==='llego'?U.st('El negocio confirmó el Yape','ok'):o.yape_negocio_estado==='no_llego'?U.st('Al negocio no le llegó el Yape','mal'):''):'')+
        (o.pago_confirmado===true&&cobra>0?U.st('El motorizado confirmó el cobro','ok'):'')+
        U.who(cli,'Cliente · entrega aquí','',true)+U.addr(o.direccion_entrega,o.referencia_entrega)+U.contact(U.maps(o.latitud_entrega,o.longitud_entrega,o.direccion_entrega,LK(o.ubicacion_entrega)),o.telefono_cliente,'');}
    /* Recordatorio de pago del delivery al negocio por WhatsApp */
    const recordarNeg=()=>{const tel=String(n.telefono||n.celular||'').replace(/\D/g,'');if(!tel)return U.note('El negocio no tiene teléfono registrado para recordarle el pago.');const y=yapeCfgP();
      const txt=['Hola, '+(negNom||'')+' 👋','Te escribimos de *Pidemás Delivery*.','Tienes pendiente el pago del delivery del pedido *'+U.ref(id)+'*'+(o.entregado_en?' (entregado a las '+U.hora(o.entregado_en)+')':'')+':','*Total: '+M(o.costo_delivery)+'*','',
        'Puedes pagar por Yape a Pidemás:','📱 '+y.numero+(y.titular?' · '+y.titular:''),'','Cuando pagues, envíanos la captura por aquí. ¡Gracias!'].join('\n');
      return `<a class="b g" style="display:flex;width:100%;box-sizing:border-box;justify-content:center" href="https://wa.me/${tel.length===9?'51'+tel:tel}?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener">Recordar el pago al negocio por WhatsApp</a>`};
    /* 5 */
    {const s=steps[4];s.locked='Se muestra cuando el pedido se entregue';
      const sub=Number(o.subtotal)||0,del=Number(o.costo_delivery)||0;
      let cuentas,sum;
      if(pa==='yape_negocio'||pa==='pagado'){cuentas=[[negNom+' le debe a Pidemás (delivery)',M(del)],['Pidemás le debe al negocio',M(0)]];sum=o.delivery_negocio_cobrado_en?'Delivery cobrado al negocio · '+M(del):'Cobrar '+M(del)+' de delivery al negocio'}
      else if(pa==='solo_delivery'){cuentas=[['Pidemás le debe al negocio',M(0)],[negNom+' le debe a Pidemás',M(0)]];sum='Sin cuentas pendientes'}
      else{cuentas=[['Pidemás le debe al negocio (productos)',M(sub)],[negNom+' le debe a Pidemás',M(0)]];sum=o.negocio_pagado_en?'Negocio pagado · '+M(sub):'Pagar '+M(sub)+' al negocio'}
      s.sum=sum;
      s.body=U.st('Pedido entregado'+(o.entrega_verificada?' · '+(o.entrega_verificada==='foto'?'con foto':'código del cliente verificado'):''),'ok')+
        `<div class="box"><div class="k">Cuentas</div>${cuentas.map(c=>`<div class="li"><span>${E(c[0])}</span><b>${c[1]}</b></div>`).join('')}</div>`+
        ((pa==='yape_negocio'||pa==='pagado')?(o.delivery_negocio_cobrado_en?U.st('Delivery cobrado al negocio · '+U.hora(o.delivery_negocio_cobrado_en),'ok'):U.note('El negocio ya recibió todo. Marca cuando te pague el delivery; lo ve en «Mis pagos».')+recordarNeg())
          :pa==='solo_delivery'?U.note('El negocio cobró los productos y el motorizado cobró el delivery.')
          :U.note(o.negocio_pagado_en?'Ya le pagaste al negocio.':'Está en «Por pagar a negocios».'));}

    const m={kicker:'Admin · Pedido '+U.ref(id),steps,err:error,acts:{}};
    if(e===-1){m.title='Pedido cancelado';m.chip='Cancelado';m.chipCls='mal';m.fin={mal:true,title:'Pedido cancelado',text:(o.cancelado_por?'Lo canceló '+o.cancelado_por+'. ':'')+(o.motivo_cancelacion||'')};return m}
    const titles=['Esperando al negocio','Asigna un motorizado',st(o)==='asignado'?'Esperando al motorizado':'Recojo en curso','Entrega y cobro','Cierra el pedido'];
    m.title=finCerrado?'Pedido cerrado':titles[e];m.chip=finCerrado?'Listo':'Paso '+(e+1)+' de 5';if(finCerrado)m.chipCls='ok';
    if(finCerrado)m.fin={title:'Pedido cerrado',text:'Entregado'+(o.entregado_en?' a las '+U.hora(o.entregado_en):'')+'.',lines:[E(steps[3].sum),E(steps[4].sum)]};
    if(e===0)m.cta={label:'Aceptar por el negocio',off:!pagoSel[id],hint:pagoSel[id]?'':'Elige cómo cobra el motorizado',busy:'Aceptando…',run:()=>aceptarPorNegocio(o,n)};
    else if(e===1){const mm=MOTOS().find(x=>String(x.id)===elegido[id]);m.cta={label:mm?'Asignar a '+String(mm.nombre_completo||'').split(' ')[0]:'Asignar',off:!mm,hint:mm?'':'Elige un motorizado de la lista',busy:'Asignando…',run:()=>asignar(id)}}
    else if(e===4&&!finCerrado)m.cta={label:'Delivery cobrado al negocio',green:true,busy:'Guardando…',run:()=>deliveryCobrado(o)};
    else if(e===2&&st(o)==='asignado'){m.cta={label:'Aceptar por el motorizado',busy:'Aceptando…',run:()=>aceptarPorMoto(o)};m.alt=[{label:'Cambiar motorizado',run:async()=>{try{await (window.assignOrder||assignOrder)(id,null)}catch(x){error=String(x?.message||x)}}}]}
    m.acts={moto:(box,ev)=>{const b=ev.target.closest('[data-m]');if(!b)return;elegido[id]=b.dataset.m;PdPasos.render()},
      tiempo:b=>{tiempoSel[id]=Number(b.dataset.n);PdPasos.render()},
      pago:b=>{if(b.disabled)return;pagoSel[id]=b.dataset.k;PdPasos.render()}};
    verPasos(steps);
    if(!finCerrado&&(e===2||e===3))ponerMapa(m,steps,e,o,e===2?'recojo':'entrega',[n.latitud,n.longitud,n.google_maps_url],[o.latitud_entrega,o.longitud_entrega],mn,{recPin:String(negNom).slice(0,18),recTx:'del local',recQuien:'El negocio'});
    return m;
  }
  function abrir(id){abierto=String(id);error='';PdPasos.open(modelo,{onClose:()=>{abierto=null}})}
  window.pdAbrirPasosAdmin=abrir;
  /* Tocar la tarjeta de un pedido de negocio abre esta vista (los demás servicios siguen igual) */
  window.addEventListener('click',ev=>{
    const card=ev.target.closest&&ev.target.closest('#orderList .adminOrderCard[data-order-id]');if(!card)return;
    /* abre con un toque en la tarjeta o en su botón principal; los demás botones (Seguimiento, Ver más…) siguen igual */
    const btn=ev.target.closest('button,a,input,select,textarea,label,summary');
    if(btn&&!btn.matches('.pdList,.pdbTog,[data-acc="tog"]'))return;
    if(card.classList.contains('is-expanded'))return;
    const o=L().find(x=>String(x.id)===String(card.dataset.orderId));if(!o)return;
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();abrir(o.id);
  },true);
})();

