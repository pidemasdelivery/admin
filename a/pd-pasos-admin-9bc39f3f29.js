
/* ===== Pidemás · Admin · pedido por pasos =====
   Al tocar un pedido de negocio se abre esta vista. Los pasos avanzan solos según lo que hacen
   el negocio y el motorizado; el admin solo asigna el motorizado y marca el delivery cobrado. */
(function(){
  if(window.__pdPasosAdm||!window.PdPasos)return;window.__pdPasosAdm=1;
  const U=PdPasos.util,E=U.E,M=U.money;
  const L=()=>{try{return Array.isArray(allOrders)?allOrders:[]}catch(e){return window.allOrders||[]}};
  const MOTOS=()=>{try{return Array.isArray(allMotos)?allMotos:[]}catch(e){return []}};
  const D=()=>{try{return db}catch(e){return window.db}};
  const NEG=id=>{try{const m=window.adminRestaurantsById;return (m&&m.get&&(m.get(String(id))||m.get(id)))||{}}catch(e){return {}}};
  const svc=o=>{const t=String(o?.tipo_servicio||'').toLowerCase();return t.includes('encomienda')?'enc':t.includes('compra')?'compra':t.includes('recojo')?'recojo':'pedido'};
  const esNegocio=o=>!!o&&svc(o)==='pedido'&&!!o.negocio_id;
  const st=o=>String(o?.estado||'').toLowerCase();
  const elegido={};let abierto=null,error='';
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
  function modeloSvc(o){
    const id=String(o.id),t=svc(o),e=etapaSvc(o),s0=st(o),mo=moto(o),mn=o.motorizado_nombre||mo.nombre_completo||'El motorizado';
    const NOM={enc:'Encomienda',compra:'Compra',recojo:'Recojo y entrega'}[t]||'Pedido';
    const yape=String(o.metodo_pago||'').toLowerCase()==='yape',metodo=yape?'Yape':'Efectivo';
    const mom=String(o.pago_servicio_momento||'').toLowerCase(),alRec=mom==='recojo_efectivo'||mom==='recojo_yape';
    const remN=o.nombre_remitente||o.nombre_cliente||'Cliente',remT=o.telefono_remitente||o.telefono_cliente;
    const recN=t==='compra'?(o.nombre_cliente||remN):(o.nombre_receptor||o.nombre_cliente||'Quien recibe'),recT=t==='compra'?(o.telefono_cliente||remT):(o.telefono_receptor||o.telefono_cliente);
    const enAg=o.pedido_en_agencia===true||String(o.pedido_en_agencia||'').toLowerCase()==='true';
    let paq=[];try{paq=Array.isArray(o.paquetes_envio)?o.paquetes_envio:JSON.parse(o.paquetes_envio||'[]')}catch(_){}
    const guias=!!o.guia_url||paq.some(p=>p&&(p.enviado_whatsapp||p.guia_url));
    const titulos=t==='enc'?['Pedido recibido','Asignar motorizado','Recojo de paquetes','Agencia y guía','Cerrado']:['Pedido recibido','Asignar motorizado',t==='compra'?'Compra':'Recojo','Entrega y cobro','Cerrado'];
    const steps=titulos.map((tt,i)=>({title:tt,state:e===-1?'locked':e===4||i<e?'done':i===e?'active':'locked'}));
    const cobra=o.pago_confirmado===true&&!(Number(o.monto_recibido)>0)?0:Number(o.total||0);
    const notas=limpiar(o.observaciones).filter(x=>!/^(Compra solicitada|Comprobante|DNI\/RUC|Lugar de compra|¿De dónde|¿Qué desea|Monto entregado|Cambio para|Pago por Yape)/i.test(x));
    /* 0 · Pedido recibido */
    {const s=steps[0];s.sum=NOM+' · '+M(o.total)+(o.creado_en?' · '+U.hora(o.creado_en):'');
      let h=`<div class="box"><div class="k">${E(NOM)}</div><div class="li"><span>${t==='compra'?'Cliente':'Quien envía'}</span><b>${E(remN)}</b></div>`;
      if(t==='compra'){const det=campo(o,'Compra solicitada','¿Qué desea que compremos?'),lug=o.direccion_recojo||campo(o,'Lugar de compra','¿De dónde desea la compra?'),cmp=campo(o,'Comprobante');
        h+=`<div class="li"><span>Comprar en</span><b style="text-align:right">${E(lug||'—')}</b></div><div class="li" style="align-items:flex-start"><span>Qué comprar</span><b style="text-align:right;white-space:normal">${E(det||'—')}</b></div>${cmp?`<div class="li"><span>Comprobante</span><b>${E(cmp)}</b></div>`:''}`}
      if(t==='enc')h+=`<div class="li"><span>Agencia</span><b>${E(o.agencia_destino||'—')}</b></div><div class="li"><span>Destino</span><b>${E(o.destino_final||o.direccion_entrega||'—')}</b></div><div class="li"><span>Pago del envío</span><b>${o.tipo_pago_encomienda==='pago_en_agencia'?'En agencia':'A destino'}</b></div>`;
      h+=`${Number(o.subtotal)>0?`<div class="li"><span>${t==='compra'?'Compra':'Productos'}</span><b>${M(o.subtotal)}</b></div>`:''}<div class="li"><span>Servicio</span><b>${M(o.costo_delivery||(Number(o.total)-Number(o.subtotal||0)))}</b></div><div class="li"><span>Total · ${E(metodo)}${alRec?' al recoger':''}</span><b>${M(o.total)}</b></div></div>`;
      if(notas.length)h+=`<div class="box"><div class="k">Notas</div><div style="font-size:15px;line-height:1.45">${E(notas.join(' · '))}</div></div>`;
      s.body=h+U.contact(null,remT,'Hola, te escribimos de Pidemás por tu pedido '+U.ref(id)+'.');}
    /* 1 · Asignar */
    {const s=steps[1];s.sum='Asignado a '+mn;
      if(e===1){const la=o.latitud_recojo,lo=o.longitud_recojo;
        const libres=MOTOS().filter(m=>m.activo!==false&&!m.en_descanso).map(m=>({m,d:km(la,lo,m.latitud,m.longitud)})).sort((a,b)=>(b.m.disponible===true)-(a.m.disponible===true)||((a.d??1e9)-(b.d??1e9))).slice(0,8);
        s.body=`<div><div class="lbl">Motorizados sugeridos (más cerca y libres)</div><div class="opts" data-act="moto">${libres.map(x=>`<button type="button" class="opt${elegido[id]===String(x.m.id)?' on':''}" data-m="${E(x.m.id)}" style="flex-direction:row;align-items:center;gap:12px"><span class="av r" style="flex:0 0 40px;width:40px;height:40px;font-size:16px">${E(U.ini(x.m.nombre_completo))}</span><span style="flex:1;min-width:0;display:flex;flex-direction:column"><b>${E(x.m.nombre_completo||'Motorizado')}</b><span>${x.m.disponible===true?'Libre':'Ocupado'}${x.m.placa?' · '+E(x.m.placa):''}</span></span><b style="font-size:14px;white-space:nowrap">${x.d!=null?x.d.toFixed(1)+' km':''}</b></button>`).join('')||'<div class="note">No hay motorizados activos.</div>'}</div></div>`;
      }else s.body=U.who(mn,'Motorizado asignado'+(o.asignado_en?' · '+U.hora(o.asignado_en):''),mo.foto_url||'',true)+U.contact(null,mo.telefono,'');}
    /* 2 · Recojo / compra */
    {const s=steps[2];s.locked='Se muestra al asignar el motorizado';s.sum=(t==='compra'?'Compra hecha':'Recogido')+(o.en_camino_en?' · '+U.hora(o.en_camino_en):'');
      let h=s0==='asignado'?U.st('Esperando que '+E(mn)+' acepte el pedido'):U.st(E(mn)+(t==='compra'?' está haciendo la compra':' va a recoger'),e>2?'ok':'');
      h+=U.who(t==='compra'?(o.direccion_recojo||'Lugar de compra'):remN,t==='compra'?'Compra aquí':'Quien envía · recojo aquí','',true)+(t==='compra'?'':U.addr(o.direccion_recojo,o.referencia_recojo))+U.contact(null,remT,'');
      if(t==='compra')h+=Number(o.subtotal)>0?U.st('Gasto de la compra registrado · '+M(o.subtotal),'ok'):U.note('El motorizado registra cuánto gastó en la compra.');
      if(alRec)h+=o.pago_confirmado===true?U.st('Cobro al recoger registrado · '+M(o.total)+' · '+metodo,'ok'):U.st('Cobra '+M(o.total)+' al recoger ('+(mom==='recojo_yape'?'Yape':'efectivo')+')');
      s.body=h;}
    /* 3 · Entrega o agencia */
    {const s=steps[3];s.locked=t==='compra'?'Se muestra al terminar la compra':'Se muestra al recoger';
      if(t==='enc'){s.sum=guias?'Guías enviadas':'En agencia';
        s.body=(enAg?U.st('Paquetes en la agencia '+E(o.agencia_destino||''),'ok'):U.st(E(mn)+' va a la agencia '+E(o.agencia_destino||'')))+
          (guias?U.st('Guías y claves enviadas por el motorizado. Mándalas al cliente.','ok'):enAg?U.st('Esperando la foto de la guía y la clave'):'')+
          U.who(o.nombre_receptor||'—','Recibe en destino · '+E(o.destino_final||o.direccion_entrega||''),'',true)+U.contact(null,o.telefono_receptor,'');}
      else{s.sum=(cobra>0&&!alRec?'Cobrado '+M(cobra)+' · '+metodo:'Entregado');
        s.body=(['en_entrega','confirmando_pago'].includes(s0)?U.st(E(mn)+' llegó donde '+E(recN),'ok'):U.st(E(mn)+' va camino donde '+E(recN)))+
          (!alRec&&cobra>0?`<div class="amt"><div class="k">Cobro al cliente</div><div class="n">${M(cobra)}</div><div class="pill">${E(metodo)}</div></div>`:U.st('Ya está pagado: no se cobra al entregar','ok'))+
          (o.pago_confirmado===true&&!alRec&&cobra>0?U.st('El motorizado confirmó el cobro','ok'):'')+
          U.who(recN,t==='compra'?'Cliente':'Quien recibe','',true)+U.addr(o.direccion_entrega,o.referencia_entrega)+U.contact(null,recT,'');}}
    /* 4 · Cerrado */
    {const s=steps[4];s.locked='Se muestra al entregar';s.sum='Entregado'+(o.entregado_en?' · '+U.hora(o.entregado_en):'');s.body=U.st('Pedido entregado'+(o.entregado_en?' a las '+U.hora(o.entregado_en):''),'ok');}

    const m={kicker:'Admin · '+NOM+' · '+U.ref(id),steps,err:error,acts:{}};
    if(e===-1){m.title='Pedido cancelado';m.chip='Cancelado';m.chipCls='mal';m.fin={mal:true,title:'Pedido cancelado',text:(o.cancelado_por?'Lo canceló '+o.cancelado_por+'. ':'')+(o.motivo_cancelacion||'')};}
    else{m.title=e===4?'Pedido entregado':titulos[e];m.chip=e===4?'Listo':'Paso '+(e+1)+' de 5';if(e===4){m.chipCls='ok';m.fin={title:'Pedido entregado',text:o.entregado_en?'Entregado a las '+U.hora(o.entregado_en)+'.':''}}}
    if(e===1){const mm=MOTOS().find(x=>String(x.id)===elegido[id]);m.cta={label:mm?'Asignar a '+String(mm.nombre_completo||'').split(' ')[0]:'Asignar',off:!mm,hint:mm?'':'Elige un motorizado de la lista',busy:'Asignando…',run:()=>asignar(id)}}
    m.alt=[];
    if(e===2&&s0==='asignado')m.alt.push({label:'Cambiar motorizado',run:async()=>{try{await (window.assignOrder||assignOrder)(id,null)}catch(x){error=String(x?.message||x)}}});
    m.acts={moto:(box,ev)=>{const b=ev.target.closest('[data-m]');if(!b)return;elegido[id]=b.dataset.m;PdPasos.render()}};
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
    const resumen=`<div class="box"><div class="k">Resumen</div><div class="li"><span>Cliente</span><b>${E(cli)}</b></div><div class="li"><span>Productos</span><b>${M(o.subtotal)}</b></div><div class="li"><span>Delivery</span><b>${M(o.costo_delivery)}</b></div><div class="li"><span>Total · ${E(yape?'Yape':'Efectivo')}</span><b>${M(o.total)}</b></div></div>`;
    /* 1 */
    {const s=steps[0];s.sum=negNom+' aceptó'+(o.tiempo_preparacion_min?' · listo en '+o.tiempo_preparacion_min+' min':'');
      s.body=U.who(negNom,'Negocio'+(n.direccion?' · '+E(n.direccion):''),n.logo_url||n.imagen_url||'')+resumen+
        (st(o)==='pendiente'?U.st('Esperando que el negocio acepte y coordine el pago'):U.st('El negocio aceptó'+(o.tiempo_preparacion_min?' · listo en '+o.tiempo_preparacion_min+' min':'')+(pa?' · '+E(metodo):''),'ok'))+
        U.contact(null,n.telefono,'Hola, te escribimos de Pidemás por el pedido '+U.ref(id)+'.');}
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
        U.addr(o.direccion_entrega,o.referencia_entrega)+U.contact(null,o.telefono_cliente,'');}
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
    if(e===1){const mm=MOTOS().find(x=>String(x.id)===elegido[id]);m.cta={label:mm?'Asignar a '+String(mm.nombre_completo||'').split(' ')[0]:'Asignar',off:!mm,hint:mm?'':'Elige un motorizado de la lista',busy:'Asignando…',run:()=>asignar(id)}}
    else if(e===4&&!finCerrado)m.cta={label:'Delivery cobrado al negocio',green:true,busy:'Guardando…',run:()=>deliveryCobrado(o)};
    else if(e===2&&st(o)==='asignado')m.alt=[{label:'Cambiar motorizado',run:async()=>{try{await (window.assignOrder||assignOrder)(id,null)}catch(x){error=String(x?.message||x)}}}];
    m.acts={moto:(box,ev)=>{const b=ev.target.closest('[data-m]');if(!b)return;elegido[id]=b.dataset.m;PdPasos.render()}};
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

