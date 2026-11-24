
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
  const limpiar=t=>String(t||'').replace(/__PIDEMAS_[A-Z_]+__\s*\{[^{}]*\}/g,'').replace(/\[COMPROBANTE_YAPE:[^\]]*\]/gi,'').replace(/\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+){2,}\b/g,'').replace(/(?:^|[|·])\s*Ubicaci[oó]n[^:|·]*:\s*[^|·]*/gi,'').split(/[|·]/).map(x=>x.trim()).filter(Boolean);
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
    const recN=t==='compra'?(o.nombre_cliente||remN):(o.nombre_receptor||o.nombre_cliente||'Quien recibe'),recT=t==='compra'?(o.telefono_cliente||remT):(o.telefono_receptor||o.telefono_cliente);
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
    const pkgBox=p=>sumBox('Paquete '+p.numero,li('Ruta',E([p.agencia,p.destino].filter(Boolean).join(' → ')||'—'))+li('Pago del envío',pagoTx(p.pago))+li('Recibe',E(p.recibe||'—'))+(p.tel?li('Teléfono',E(p.tel)):'')+(p.dni?li('DNI',E(p.dni)):''));
    const procAg=Array.isArray(o.agencias_proceso)?o.agencias_proceso:[];
    const gs=paq.filter(x=>x&&Number(x.numero)>0);
    if(!gs.some(x=>Number(x.numero)===1)&&o.guia_url&&o.guia_url!=='whatsapp')gs.push({numero:1,guia_url:o.guia_url,clave:String(o.clave_guia||'')==='SIN_CLAVE'?'':o.clave_guia,sin_clave:String(o.clave_guia||'')==='SIN_CLAVE'});
    const gDe=n=>gs.find(x=>Number(x.numero)===n);
    const okG=x=>!!(x&&(x.enviado_whatsapp||(x.guia_url&&x.guia_url!=='whatsapp'&&(x.sin_clave||String(x.clave||'').trim()))));
    const guias=pks.every(p=>okG(gDe(p.numero)));
    const titulos=t==='enc'?['Pedido recibido','Asignar motorizado','Recoger los paquetes','Agencia y guía','Cerrado']:['Pedido recibido','Asignar motorizado',t==='compra'?'Hacer la compra':'Recoger','Entrega y cobro','Cerrado'];
    const steps=titulos.map((tt,i)=>({title:tt,state:e===-1?'locked':e===4||i<e?'done':i===e?'active':'locked'}));
    const cobra=o.pago_confirmado===true&&!(Number(o.monto_recibido)>0)?0:Number(o.total||0);
    const notas=limpiar(o.observaciones).filter(x=>!/^(Compra solicitada|Comprobante|DNI\/RUC|Lugar de compra|¿De dónde|¿Qué desea|Monto entregado|Cambio para|Pago por Yape|Pago en efectivo|Paga quien|Servicio marcado como PAGADO|Pedido a nombre de|Pide el servicio)/i.test(x));
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
      const pagoTx=pagado?'Ya pagado':metodo+(alRec?' al recoger':'')+(t==='recojo'&&(qp==='envia'||qp==='recibe')?' · paga quien '+(qp==='envia'?'envía':'recibe'):'');
      let h=`<div class="amt" style="padding:14px"><div class="k">${t==='compra'?'Costo del servicio':'Total del servicio'}</div><div class="n" style="font-size:36px">${M(serv0)}</div><div class="pill">${E(pagoTx)}</div></div>`;
      if(pagaCon>0&&!pagado&&metodo==='Efectivo')h+=U.note(t==='compra'&&!(sub0>0)?'El cliente pagará con <b>'+M(pagaCon)+'</b>. El vuelto se sabe cuando el motorizado registre la compra.':'El cliente paga con <b>'+M(pagaCon)+'</b>'+(pagaCon-tot0>0.004?' · vuelto '+M(pagaCon-tot0):' · paga exacto'));
      /* solo el resumen: los datos de contacto salen en el paso donde se usan */
      const pideR=t==='recojo'&&/quien recibe/i.test(campo(o,'Pide el servicio')||'');
      h+=sumBox('Resumen',(t==='compra'?li('Cliente',E(remN)):li('Pide el servicio',pideR?'Quien recibe':'Quien envía')+li('Envía',E(remN))+(aNom?li('A nombre de',E(aNom)):'')+li(t==='enc'?'Recibe en destino':'Recibe',E(recN)))+(o.creado_en?li('Pedido a las',E(U.hora(o.creado_en))):''));
      s.body=h;}
    /* 1 · Asignar */
    {const s=steps[1];s.sum='Asignado a '+mn;
      if(e===1){const la=o.latitud_recojo,lo=o.longitud_recojo;
        const libres=MOTOS().filter(m=>m.activo!==false&&!m.en_descanso).map(m=>({m,d:km(la,lo,m.latitud,m.longitud)})).sort((a,b)=>(b.m.disponible===true)-(a.m.disponible===true)||((a.d??1e9)-(b.d??1e9))).slice(0,8);
        s.body=`<div><div class="lbl">Motorizados sugeridos (más cerca y libres)</div><div class="opts" data-act="moto">${libres.map(x=>`<button type="button" class="opt${elegido[id]===String(x.m.id)?' on':''}" data-m="${E(x.m.id)}" style="flex-direction:row;align-items:center;gap:12px"><span class="av r" style="flex:0 0 40px;width:40px;height:40px;font-size:16px">${E(U.ini(x.m.nombre_completo))}</span><span style="flex:1;min-width:0;display:flex;flex-direction:column"><b>${E(x.m.nombre_completo||'Motorizado')}</b><span>${x.m.disponible===true?'Libre':'Ocupado'}${x.m.placa?' · '+E(x.m.placa):''}</span></span><b style="font-size:14px;white-space:nowrap">${x.d!=null?x.d.toFixed(1)+' km':''}</b></button>`).join('')||'<div class="note">No hay motorizados activos.</div>'}</div></div>`;
      }else s.body=U.who(mn,'Motorizado asignado'+(o.asignado_en?' · '+U.hora(o.asignado_en):''),mo.foto_url||'',true)+U.contact(null,mo.telefono,'');}
    /* 2 · Hacer la compra / recoger: dónde, qué y cuánto se gastó */
    {const s=steps[2];s.locked='Se muestra al asignar el motorizado';
      let h=s0==='asignado'?U.st('Esperando que '+E(mn)+' acepte el pedido'):U.st(E(mn)+(e>2?(t==='compra'?' hizo la compra':' recogió el pedido'):(t==='compra'?' está haciendo la compra':' va a recoger')),e>2?'ok':'');
      if(t==='compra'){
        const lr=String(o.direccion_recojo||campo(o,'Lugar de compra','¿De dónde desea la compra?')||''),lugar=lr.replace(/https?:\/\/\S+/g,'').replace(/[\s·,|-]+$/,'').trim();
        const det=campo(o,'Compra solicitada','¿Qué desea que compremos?'),cmp=campo(o,'Comprobante'),doc=campo(o,'DNI/RUC');
        s.sum=(lugar||'Compra')+(sub0>0?' · gastó '+M(sub0):'');
        h+=U.who(lugar||'Lugar no indicado','Compra aquí · pedido '+E(U.ref(id)),'')+btnIr(lugar||LK(lr)||LK(o.ubicacion_recojo)?U.maps(o.latitud_recojo,o.longitud_recojo,lugar,LK(lr)||LK(o.ubicacion_recojo)):'','Ir al lugar de compra')+
          sumBox('Qué comprar',txt(det||'—'))+(cmp||doc?sumBox('Comprobante',(cmp?li('Tipo',E(cmp)):'')+(doc?li('DNI/RUC',E(doc)):'')):'')+(notas.length?U.note(E(notas.join(' · '))):'')+
          (sub0>0?U.st('Compra registrada · gastó '+M(sub0),'ok'):U.note('El motorizado registra aquí cuánto gastó en la compra.'));
      }else{
        s.sum=(t==='enc'?'Recogido':'Recogido')+(o.en_camino_en?' · '+U.hora(o.en_camino_en):'');
        h+=U.who(remN,subQ('Recoge aquí · pedido '+U.ref(id)),'',true)+U.addr(o.direccion_recojo,o.referencia_recojo)+U.contact(U.maps(o.latitud_recojo,o.longitud_recojo,o.direccion_recojo,LK(o.ubicacion_recojo)),remT,'');
        /* más puntos de recojo (el punto 1 es quien envía) */
        const PR=t==='recojo'&&Array.isArray(o.puntos_recojo)?o.puntos_recojo.filter(Boolean):[];
        if(PR.length){h=h.replace(subQ('Recoge aquí · pedido '+U.ref(id)),subQ('Punto 1 de '+(PR.length+1)+' · pedido '+U.ref(id)));
          const listos=PR.filter(x=>x.recogido_en).length;
          h+=U.st(listos===PR.length?'Recogió en los '+(PR.length+1)+' puntos':'Recogido en '+listos+' de '+PR.length+' puntos adicionales',listos===PR.length?'ok':'');
          PR.forEach(x=>{h+=`<div class="sum"><div class="lbl">Punto ${E(x.n)} de ${PR.length+1}${x.recogido_en?' · recogido '+E(U.hora(x.recogido_en)):''}</div>`+
            (x.nombre?li('Entrega',E(x.nombre)):'')+(x.direccion?li('Dirección',E(x.direccion)):'')+(x.referencia?li('Referencia',E(x.referencia)):'')+(x.que?li('Se recoge',E(x.que)):'')+`</div>`+
            U.contact(U.maps(x.lat,x.lng,x.direccion,LK(x.ubicacion)),x.telefono,'')});
          s.sum=(listos===PR.length&&e>2?'Recogido en '+(PR.length+1)+' puntos':s.sum)}
        if(t==='recojo'&&notas.length)h+=sumBox('Notas del servicio',txt(notas.join(' · ')));
        if(t==='enc'){h+=pks.map(pkgBox).join('')}
        if(alRec)h+=o.pago_confirmado===true?U.st('Cobro al recoger registrado · '+M(o.total)+' · '+metodo,'ok'):U.st('Cobra '+M(o.total)+' al recoger ('+(mom==='recojo_yape'?'Yape':'efectivo')+')');
      }
      s.body=h;}
    /* 3 · Entrega y cobro (o agencia): a dónde se lleva y cuánto se cobra */
    {const s=steps[3];s.locked=t==='compra'?'Se muestra al terminar la compra':'Se muestra al recoger';
      if(t==='enc'){s.sum=guias?'Guías enviadas':'En agencia';
        const agsL=[...new Set(pks.map(p=>p.agencia).filter(Boolean))];
        s.body=(enAg?U.st(procAg.length?'Llegó a '+E(procAg.filter(x=>x.llegada_en).map(x=>x.agencia).join(' y '))+(procAg.length<agsL.length?' · falta '+E(agsL.filter(a=>!procAg.some(x=>String(x.agencia).toLowerCase()===String(a).toLowerCase())).join(' y ')):''):'Paquetes en la agencia '+E(o.agencia_destino||''),'ok'):U.st(E(mn)+(agsL.length>1?' va a las agencias '+E(agsL.join(' y ')):' va a la agencia '+E(o.agencia_destino||''))))+
          pks.map(pkgBox).join('')+
          (procAg.length?sumBox('Avance en agencias',procAg.map(x=>li(E(x.agencia||'Agencia'),(x.llegada_en?'Llegó '+E(U.hora(x.llegada_en)):'')+(x.pago_en?' · pagó '+M(x.pago_monto):''))).join('')):(Number(o.monto_pagado_agencia)>0?sumBox('Pago en agencia',li('Pagado',M(o.monto_pagado_agencia))):''))+
          agBotones(o,pks.map(p=>p.agencia))+
          (guias?U.st('El motorizado subió todas las guías y claves. Mándalas al cliente.','ok'):enAg?U.st('Esperando la foto de la guía y la clave'):'')+
          pks.map(p=>{const g=gDe(p.numero),ruta=E([p.agencia,p.destino].filter(Boolean).join(' → ')||'Paquete'),foto=g&&g.guia_url&&g.guia_url!=='whatsapp'?g.guia_url:'';
            if(!okG(g))return sumBox('Guía · paquete '+p.numero,li(ruta,'Aún no la sube'));
            const clv=g.sin_clave?'La agencia no dio clave':String(g.clave||'—');
            if(!foto)return sumBox('Guía · paquete '+p.numero,li(ruta,'Enviada por WhatsApp')+li('Clave','Revisa tu WhatsApp'));
            const cliT=o.telefono_cliente||o.telefono_remitente,cliN=o.nombre_cliente||o.nombre_remitente||'';
            const pq=pagoAg(p),grp=mismaAg(p).filter(y=>y.pago==='pago_en_agencia'),primero=grp[0]===p,pa=pq?pq.m:null,paLinea=!!pq&&(pq.solo||primero),del=p.cd,ya=pagado||mom==='pagado'||(o.pago_confirmado===true&&mom!=='al_final');
            const totG=Math.round(((paLinea?pa:0)+(del!=null?del:0))*100)/100;
            const mL=[];if(p.pago==='pago_en_agencia'){if(paLinea)mL.push('• Envío pagado en '+(p.agencia||'la agencia')+(!pq.solo&&grp.length>1?' (paquetes '+grp.map(y=>y.numero).join(' y ')+')':'')+': '+M(pa));else if(pa!=null)mL.push('• Envío: ya incluido en la guía del paquete '+grp[0].numero);}
              else if(p.pago==='pago_a_destino')mL.push('• Envío: se paga al recoger en destino');
            if(del!=null)mL.push('• Delivery Pidemás: '+M(del));
            const montos=mL.length?'\n\n*Montos de esta guía*\n'+mL.join('\n')+((paLinea||del!=null)?'\n*Total: '+M(totG)+'*'+(ya?' (ya pagado)':''):''):'';
            const txt='Hola'+(cliN?' '+String(cliN).split(' ')[0]:'')+', te escribimos de Pidemás. Tu encomienda '+U.ref(id)+(pks.length>1?' (paquete '+p.numero+')':'')+' ya está en la agencia '+(p.agencia||'')+'.\nDestino: '+(p.destino||'—')+'\nClave de recojo: '+clv+'\nFoto de la guía: '+foto+montos;
            const tel=String(cliT||'').replace(/\D/g,''),wa=tel?'https://wa.me/'+(tel.length===9?'51'+tel:tel)+'?text='+encodeURIComponent(txt):'';
            return `<div class="sum"><div class="lbl">Guía · paquete ${p.numero}</div><a href="${E(foto)}" target="_blank" rel="noopener"><img src="${E(foto)}" alt="Guía del paquete ${p.numero}" style="width:100%;max-height:220px;object-fit:cover;border-radius:12px;display:block"></a>`+
              li('Ruta',ruta)+li('Clave de recojo',E(clv))+(g.subido_en?li('Subida',E(U.hora(g.subido_en))):'')+
              (paLinea?li('Pagado en '+E(p.agencia||'agencia'),M(pa)):'')+(del!=null?li('Delivery Pidemás',M(del)):'')+((paLinea||del!=null)?li('Total de esta guía',M(totG),1):'')+
              (del==null&&pks.length>1?U.note('Este pedido se creó sin el delivery de cada paquete; el mensaje no lo incluye.'):'')+
              (wa?`<a class="b o" style="display:flex;width:100%;box-sizing:border-box;justify-content:center;margin-top:6px" href="${E(wa)}" target="_blank" rel="noopener">Enviar al cliente por WhatsApp</a>`:U.note('El cliente no tiene teléfono registrado.'))+`</div>`}).join('')+
          pks.filter((p,i,a)=>p.tel&&a.findIndex(y=>y.tel===p.tel)===i).map(p=>U.who(p.recibe||'—','Recibe paquete'+(pks.filter(y=>y.tel===p.tel).length>1?'s '+pks.filter(y=>y.tel===p.tel).map(y=>y.numero).join(' y '):' '+p.numero)+' · '+E(p.destino||''),'',true)+U.contact(null,p.tel,'')).join('');}
      else{const cob=t==='compra'?(o.pago_confirmado===true&&!(Number(o.monto_recibido)>0)?0:tot0):cobra;
        s.sum=cob>0&&!alRec?'Cobrado '+M(cob)+' · '+metodo:'Entregado';
        let h=['en_entrega','confirmando_pago'].includes(s0)?U.st(E(mn)+' llegó donde '+E(recN),'ok'):U.st(E(mn)+' va camino donde '+E(recN));
        if(t==='compra'&&!(sub0>0))h+=U.note('El monto a cobrar sale cuando el motorizado registre la compra.');
        else if(!alRec&&cob>0)h+=`<div class="amt"><div class="k">Cobro al cliente</div><div class="n">${M(cob)}</div><div class="pill">${E(metodo)}</div></div>`+(t==='compra'?sumBox('Montos',li('Compra',M(sub0))+li('Servicio',M(serv0))+li('Total',M(tot0),1)):'');
        else h+=U.st('Ya está pagado: no se cobra al entregar','ok');
        if(o.pago_confirmado===true&&!alRec&&cob>0)h+=U.st('El motorizado confirmó el cobro','ok');
        h+=U.who(recN,(t==='compra'?'Cliente':'Quien recibe')+' · entrega aquí','',true)+U.addr(o.direccion_entrega,o.referencia_entrega)+U.contact(U.maps(o.latitud_entrega,o.longitud_entrega,o.direccion_entrega,LK(o.ubicacion_entrega)),recT,'Hola, te escribimos de Pidemás por tu pedido '+U.ref(id)+'.');
        s.body=h;}}
    /* 4 · Cerrado */
    {const s=steps[4];s.locked='Se muestra al entregar';s.sum='Entregado'+(o.entregado_en?' · '+U.hora(o.entregado_en):'');s.body=U.st('Pedido entregado'+(o.entregado_en?' a las '+U.hora(o.entregado_en):''),'ok');}

    const m={kicker:'Admin · '+NOM+' · '+U.ref(id),steps,err:error,acts:{}};
    if(e===-1){m.title='Pedido cancelado';m.chip='Cancelado';m.chipCls='mal';m.fin={mal:true,title:'Pedido cancelado',text:(o.cancelado_por?'Lo canceló '+o.cancelado_por+'. ':'')+(o.motivo_cancelacion||'')};}
    else{m.title=e===4?'Pedido entregado':titulos[e];m.chip=e===4?'Listo':'Paso '+(e+1)+' de 5';if(e===4){m.chipCls='ok';m.fin={title:'Pedido entregado',text:o.entregado_en?'Entregado a las '+U.hora(o.entregado_en)+'.':''}}}
    if(e===1){const mm=MOTOS().find(x=>String(x.id)===elegido[id]);m.cta={label:mm?'Asignar a '+String(mm.nombre_completo||'').split(' ')[0]:'Asignar',off:!mm,hint:mm?'':'Elige un motorizado de la lista',busy:'Asignando…',run:()=>asignar(id)}}
    m.alt=[];
    if(e===2&&s0==='asignado')m.alt.push({label:'Cambiar motorizado',run:async()=>{try{await (window.assignOrder||assignOrder)(id,null)}catch(x){error=String(x?.message||x)}}});
    m.acts={moto:(box,ev)=>{const b=ev.target.closest('[data-m]');if(!b)return;elegido[id]=b.dataset.m;PdPasos.render()}};
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
    const resumen=`<div class="box"><div class="k">Resumen</div><div class="li"><span>Cliente</span><b>${E(cli)}</b></div><div class="li"><span>Productos</span><b>${M(o.subtotal)}</b></div><div class="li"><span>Delivery</span><b>${M(o.costo_delivery)}</b></div><div class="li t"><span>Total · ${E(yape?'Yape':'Efectivo')}</span><b>${M(o.total)}</b></div></div>`;
    /* 1 */
    {const s=steps[0];s.sum=negNom+' aceptó'+(o.tiempo_preparacion_min?' · listo en '+o.tiempo_preparacion_min+' min':'');
      s.body=U.who(negNom,'Negocio'+(n.direccion?' · '+E(n.direccion):''),n.logo_url||n.imagen_url||'')+resumen+
        (st(o)==='pendiente'?U.st('Esperando que el negocio acepte. También puedes aceptarlo tú por el negocio.')+
          (()=>{const OT=opcTiempo(n);if(!tiempoSel[id])tiempoSel[id]=OT.def.n;const PO=opcPago(o,n);if(PO.length===1)pagoSel[id]=PO[0][0];
            return `<div><div class="lbl">¿En cuánto estará listo?</div><div class="grid4" style="grid-template-columns:repeat(${OT.ops.length},minmax(0,1fr))">${OT.ops.map(x=>`<button type="button" data-act="tiempo" data-n="${x.n}" class="${x.n===tiempoSel[id]?'on':''}">${E(x.t)}</button>`).join('')}</div></div>`+
              `<div><div class="lbl">¿Cómo cobra el motorizado?</div><div class="opts">${PO.map(x=>`<button type="button" data-act="pago" class="opt${x[0]===pagoSel[id]?' on':''}" data-k="${x[0]}"${x[3]?' disabled style="opacity:.5"':''}><b>${E(x[1])}</b><span>${E(x[2])}</span></button>`).join('')}</div></div>`+
              U.note('Llama o escribe al negocio para confirmar que puede atenderlo antes de aceptarlo.')})():U.st('El negocio aceptó'+(o.tiempo_preparacion_min?' · listo en '+o.tiempo_preparacion_min+' min':'')+(pa?' · '+E(metodo):''),'ok'))+
        U.contact(U.maps(n.latitud,n.longitud,n.direccion,LK(n.google_maps_url)),n.telefono,'Hola, te escribimos de Pidemás por el pedido '+U.ref(id)+'.');}
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
      s.body=(ss==='asignado'?U.st('Esperando que '+E(mn)+' acepte el pedido'):o.en_local_en?U.st(E(mn)+' llegó al local · '+U.hora(o.en_local_en),'ok'):U.st(E(mn)+' va camino al local'))+
        (o.listo_para_recojo?U.st('El negocio marcó el pedido listo','ok'):'')+
        (o.codigo_recojo?U.code('Código de recojo',o.codigo_recojo,'El negocio lo compara antes de entregar'):'')+
        U.contact(null,mo.telefono,'')+U.note('Si el motorizado tarda más de 10 min en el local, te avisamos.');}
    /* 4 */
    {const s=steps[3];s.locked='Se muestra cuando recoja el pedido';s.sum=cobra>0?'Cobrado '+M(cobra)+' · '+metodo:'Sin cobro al cliente';
      const qn=pa==='yape_negocio';
      s.body=(o.en_entrega_en?U.st(E(mn)+' llegó donde '+E(cli)+' · '+U.hora(o.en_entrega_en),'ok'):U.st(E(mn)+' va camino donde '+E(cli)))+
        (cobra>0?`<div class="amt"><div class="k">Cobro al cliente</div><div class="n">${M(cobra)}</div><div class="pill">${E(metodo)}</div></div>`:U.st('El cliente ya pagó: no se cobra nada','ok'))+
        (qn?`<div class="qr" style="cursor:default"><span class="im"${n.yape_qr_url?` style="background-image:url('${E(n.yape_qr_url)}')"`:''}>${n.yape_qr_url?'':'QR'}</span><span class="t"><span class="k">Yape del negocio</span><span class="a">${E(n.yape_titular||negNom)}</span><span class="b2">${E(n.yape_numero||'')}</span></span></div>`+
          (o.yape_negocio_estado==='esperando'?U.st('Esperando que el negocio confirme el Yape'):o.yape_negocio_estado==='llego'?U.st('El negocio confirmó el Yape','ok'):o.yape_negocio_estado==='no_llego'?U.st('Al negocio no le llegó el Yape','mal'):''):'')+
        (o.pago_confirmado===true&&cobra>0?U.st('El motorizado confirmó el cobro','ok'):'')+
        U.addr(o.direccion_entrega,o.referencia_entrega)+U.contact(U.maps(o.latitud_entrega,o.longitud_entrega,o.direccion_entrega,LK(o.ubicacion_entrega)),o.telefono_cliente,'');}
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
        ((pa==='yape_negocio'||pa==='pagado')?(o.delivery_negocio_cobrado_en?U.st('Delivery cobrado al negocio · '+U.hora(o.delivery_negocio_cobrado_en),'ok'):U.note('El negocio ya recibió todo. Marca cuando te pague el delivery; lo ve en «Mis pagos».'))
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
    else if(e===2&&st(o)==='asignado')m.alt=[{label:'Cambiar motorizado',run:async()=>{try{await (window.assignOrder||assignOrder)(id,null)}catch(x){error=String(x?.message||x)}}}];
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

