
/* ===== Pidemás · Administrador · app nueva =====
   Marco aislado (Shadow DOM) con el diseño del pedido por pasos: menú inferior nuevo, Inicio con los
   pedidos y Menú rehechos. Las demás secciones de siempre se muestran como página completa (sin velo,
   con flecha para volver y el menú inferior a la vista), usando su misma lógica. */
(function(){
  if(window.__pdAppAdm||!window.PdPasos)return;window.__pdAppAdm=1;
  const U=PdPasos.util,E=U.E,M=U.money;
  const $=id=>document.getElementById(id);
  const L=()=>{try{return Array.isArray(allOrders)?allOrders:[]}catch(e){return window.allOrders||[]}};
  const NEG=id=>{try{const m=window.adminRestaurantsById;return (m&&m.get&&(m.get(String(id))||m.get(id)))||{}}catch(e){return {}}};
  const MOTOS=()=>{try{return Array.isArray(allMotos)?allMotos:[]}catch(e){return []}};
  const est=o=>String(o?.estado||'').toLowerCase().trim();
  const T=v=>v?new Date(v).getTime()||0:0;
  const ref=U.ref,hora=U.hora;
  const diaLima=t=>new Date(t).toLocaleDateString('en-CA',{timeZone:'America/Lima'});
  const fecha=t=>{if(!t)return '';const d=new Date(t);return diaLima(d)===diaLima(Date.now())?'Hoy '+hora(d):d.toLocaleDateString('es-PE',{day:'2-digit',month:'short',timeZone:'America/Lima'}).replace('.','')+' · '+hora(d)};
  const svc=o=>{const t=String(o?.tipo_servicio||'').toLowerCase();return t.includes('encomienda')?'Encomienda':t.includes('compra')?'Compra':t.includes('recojo')?'Recojo y entrega':''};
  const S=d=>'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
  const IC={
    home:S('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'),cash:S('<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>'),
    wallet:S('<path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4z"/><path d="M4 7V5h12"/><path d="M16 13.5h.01"/>'),group:S('<circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a5 5 0 0 1 3 6"/>'),
    menu:S('<path d="M4 7h16M4 12h16M4 17h16"/>'),bell:S('<path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7"/><path d="M10 20a2 2 0 0 0 4 0"/>'),
    chev:S('<path d="M9 6l6 6-6 6"/>'),back:S('<path d="M15 18l-6-6 6-6"/>'),refresh:S('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>'),
    user:S('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),box:S('<path d="M4 7h16v13H4z"/><path d="M4 7l2-3h12l2 3"/><path d="M9 11h6"/>'),
    store:S('<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9"/><path d="M5 11v9h14v-9"/>'),
    swap:S('<path d="M4 8h13l-3-3M20 16H7l3 3"/>'),moto:S('<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M9 17h6l-3-7h4l2 7M12 10L10 6H7"/>'),
    shield:S('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>'),list:S('<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>'),
    tag:S('<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>'),search:S('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
    check:S('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),trash:S('<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13M9 7V4h6v3"/>'),logout:S('<path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4M6 12h10"/>'),
    plus:S('<path d="M12 5v14M5 12h14"/>'),pin:S('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),x:S('<path d="M6 6l12 12M18 6L6 18"/>')
  };
  Object.assign(IC,{clock:S('<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>'),chart:S('<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>'),star:S('<path d="m12 4 2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z"/>'),alert:S('<path d="M12 4 2.5 20h19z"/><path d="M12 10v4M12 17v.5"/>'),send:S('<path d="M4 12 20 4l-6 16-3-7z"/>'),phone:S('<rect x="6" y="3" width="12" height="18" rx="3"/><path d="M10 17h4"/>'),grid:S('<rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/>')});
  /* Menú inferior: 5 pestañas. Cada opción: [clave, nombre, ícono]. Clave «t:» = pantalla nueva, «a:» = acción, otra = opción de siempre */
  const HUBS={
    'inicio':{t:'Pedidos',ic:'nvPed'},
    'h:moto':{t:'Motorizados',ic:'nvMoto',k:'Motorizados',sec:[
      ['Motorizados',[['motorizados / gps','Motorizados y GPS','pin'],['crear motorizado','Crear motorizado','plus'],['suspender / reactivar cuentas','Suspender o reactivar','shield']]],
      ['Caja',[['t:caja','Cajas de motorizados','cash'],['yape por confirmar','Cobros pendientes y Yape','phone'],['alerta de caja alta','Alerta de caja alta','alert']]],
      ['Sueldos',[['t:sueldo','Sueldos de motorizados','wallet'],['planilla de sueldos','Planilla de sueldos','list']]]]},
    'h:neg':{t:'Negocios',ic:'nvNeg',k:'Negocios',sec:[
      ['Negocios',[['configurar negocios','Configurar negocios','store'],['crear negocio','Crear negocio','plus'],['solicitudes de afiliación','Solicitudes de afiliación','tag']]],
      ['Cobros y pagos',[['por cobrar a negocios','Por cobrar a negocios','cash'],['por pagar a negocios','Por pagar a negocios','wallet']]]]},
    'h:mas':{t:'Más',ic:'nvMas',k:'Más',sec:[
      ['Pedidos',[['asignación automática','Asignación automática','swap'],['calificaciones','Calificaciones','star']]],
      ['Servicios',[['recojo y entrega','Recojo y entrega','swap'],['clientes frecuentes','Clientes frecuentes','star'],['compra','Compra','cash'],['encomienda','Encomienda','box'],['tarifas','Tarifas','tag'],['agencias','Agencias','pin']]],
      ['Clientes',[['t:clientes','Clientes','group'],['lista negra','Lista negra','x']]],
      ['Configuración',[['horario','Horario de Pidemás','clock'],['qr yape','QR Yape','phone'],['códigos de descuento','Códigos de descuento','tag']]],
      ['Mi cuenta',[['a:perfil','Mi perfil','user']]]]}
  };
  /* Íconos del menú inferior (elegidos por el administrador) */
  Object.assign(IC,{nvPed:S('<path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2"/><path d="M9 7h6M9 11h6M13 15h2"/>'),
    nvMoto:S('<circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h2.5"/><path d="M21.12 20.12a3 3 0 1 0-4.24 0c.42.42 1.12 1.05 2.12 1.88 1.05-.89 1.76-1.52 2.12-1.88z"/><path d="M19 18v.01"/>'),
    nvNeg:S('<path d="M19 3v12h-5c-.02-3.68.18-7.41 5-12zM19 15v6h-1v-3M8 4v17M5 4v3a3 3 0 0 0 6 0V4"/>'),
    nvMas:S('<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/><path d="M14 7h6M17 4v6"/>')});
  /* Menú inferior: Pedidos · Motorizados · Negocios · Más */
  const NAVK=['inicio','h:moto','h:neg','h:mas'];
  const HUBDE={caja:'h:moto',sueldo:'h:moto',clientes:'h:mas',menu:'h:mas'};
  const bdOf=k=>{const b=document.querySelector(`#pdMenu .m3It[data-txt="${CSS.escape(k)}"]`);return b?Number(((b.querySelector('.pdCtlBdg,.bdg')||{}).textContent||'').trim())||0:0};
  const hubBd=h=>h==='inicio'?L().filter(CH[1][2]).length:(HUBS[h].sec||[]).reduce((s,[,its])=>s+its.reduce((a,x)=>a+(/^[ta]:/.test(x[0])?0:bdOf(x[0])),0),0);
  const GIC={'Negocios':IC.store,'Servicios':IC.swap,'Motorizados':IC.moto,'Control de caja y sueldos':IC.cash,'Control de pedidos':IC.shield,'Clientes':IC.group,'Más':IC.tag};
  /* ===== Tarjetas de pedido (diseño C): en curso grandes con avance y motorizado; terminados en filas ===== */
  const C_SV={'Compra':['#E1F1E6','#1F6F43','<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'],'Recojo y entrega':['#FDEBDF','#C4410C','<path d="M4 8h14l-4-4"/><path d="M20 16H6l4 4"/>'],'Encomienda':['#E2ECF8','#1D4F91','<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>'],'Negocio':['#F1E8FA','#6D3FA0','<path d="M3 10l1.5-5h15L21 10"/><path d="M4 10v10h16V10"/><path d="M9 20v-6h6v6"/>']};
  const cSvg=(d,s)=>`<svg viewBox="0 0 24 24" width="${s||14}" height="${s||14}" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const cTel=t=>{const d=String(t||'').replace(/\D/g,'');return d?(d.length===9?'51'+d:d):''};
  const C_CSS=`
.oC{display:flex;flex-direction:column;gap:12px;width:100%;box-sizing:border-box;text-align:left;color:#1F1A17;background:#FFFFFF;border:1px solid #F1E4DA;border-radius:22px;padding:16px;cursor:pointer;box-shadow:0 8px 22px rgba(31,26,23,.06)}
.oC.a{border:1.5px solid #C4410C}.oC.cNw{border:2px solid #C4410C;animation:cLate 1.6s ease-out infinite}
@keyframes cLate{0%{box-shadow:0 0 0 0 rgba(196,65,12,.45),0 8px 22px rgba(31,26,23,.06)}100%{box-shadow:0 0 0 12px rgba(196,65,12,0),0 8px 22px rgba(31,26,23,.06)}}
@media (prefers-reduced-motion:reduce){.oC.cNw{animation:none;box-shadow:0 0 0 4px rgba(196,65,12,.25)}}.oC.sl2{border:1.5px solid #C4410C;background:#FFF4EC}
.oC .cTp{display:flex;align-items:center;gap:8px;min-width:0}
.oC .cCh{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 11px;border-radius:999px;font-size:13px;font-weight:800;white-space:nowrap;min-width:0;overflow:hidden;flex:0 1 auto}.oC .cCh span{overflow:hidden;text-overflow:ellipsis}.oC .cCh svg{flex:0 0 auto}
.oC .cCod{font-size:12.5px;font-weight:800;color:#6B5E55;letter-spacing:.02em;margin-bottom:2px}
.oC .cPr{margin-left:auto;font-size:20px;font-weight:800;letter-spacing:-.01em;white-space:nowrap;flex:0 0 auto}
.oC .cNm{font-size:18px;font-weight:800;letter-spacing:-.01em;line-height:1.25;overflow-wrap:anywhere}
.oC .cDr{font-size:14px;color:#6B5E55;margin-top:2px;line-height:1.35;overflow-wrap:anywhere}
.oC .cStp{display:grid;gap:6px}
.oC .cStp>span{display:flex;flex-direction:column;gap:6px;min-width:0}
.oC .cStp i{height:5px;border-radius:3px;background:#EFE5DD}
.oC .cStp small{font-size:11px;font-weight:700;color:#8A7B71;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.oC .cStp .d i{background:#15803D}.oC .cStp .d small{color:#0F5E2E}
.oC .cStp .a i{background:#C4410C}.oC .cStp .a small{color:#9A330A}
.oC .cFt{display:flex;align-items:center;gap:10px;padding-top:12px;border-top:1px solid #F4EBE4}
.oC .cMo{flex:0 0 36px;width:36px;height:36px;border-radius:18px;background:#F6EFE9;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#6B5E55}
.oC .cMt{flex:1 1 auto;min-width:0;display:flex;flex-direction:column}.oC .cMt b{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.oC .cMt span{font-size:12px;color:#6B5E55}
.oC .cIk{flex:0 0 44px;width:44px;height:44px;border-radius:14px;border:1px solid #F1E4DA;background:#FFFFFF;display:flex;align-items:center;justify-content:center;color:#1F1A17;text-decoration:none}
.oC .cIk.g{background:#15803D;border-color:#15803D;color:#FFFFFF}
.oC .sel{flex:0 0 26px}
.oC .cAv{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:14px;background:#FDEBDF;color:#9A330A;font-size:14px;font-weight:800}.oC .cAv i{width:8px;height:8px;border-radius:4px;background:#C4410C}.oC .cAv em{margin-left:auto;font-style:normal;font-weight:700}
.oR{display:flex;align-items:center;gap:12px;width:100%;box-sizing:border-box;padding:12px 14px;background:#FFFFFF;border:1px solid #F1E4DA;border-radius:16px;text-align:left;font:inherit;color:#1F1A17;min-height:62px;cursor:pointer}
.oR.sl2{border:1.5px solid #C4410C;background:#FFF4EC}
.oR .cOk{flex:0 0 32px;width:32px;height:32px;border-radius:16px;background:#E9F6EE;color:#15803D;display:flex;align-items:center;justify-content:center}
.oR .cOk.no{background:#FDE8E8;color:#B42318}
.oR .cMd{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px}.oR .cMd b{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.oR .cMd span{font-size:13px;color:#6B5E55;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.oR .cMd i{font-style:normal;font-size:12.5px;font-weight:800;color:#6B5E55;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.oR em{font-style:normal;font-weight:800;font-size:15px;white-space:nowrap}
.oSec{display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:800;letter-spacing:.08em;color:#6B5E55;margin:6px 4px 0;text-transform:uppercase}
`;
  /* d: {id,ref,sv,neg,precio,cliente,dir,hace,fase:{n,k,txt},pasos:[5 textos],moto:{nombre,tel,rol},sel:html,arriba:html,abajo:html,act:bool,attr} */
  function cGrande(d){
    const c=C_SV[d.sv]||C_SV['Negocio'];
    const bars=(d.pasos||[]).map((t,i)=>{const k=i+1,n=d.fase.n;const cl=n===0?'':(k<n||n>=d.pasos.length)?'d':k===n?'a':'';return `<span class="${cl}"><i></i><small>${E(t)}</small></span>`}).join('');
    const m=d.moto||null,mt=m&&cTel(m.tel);
    return `<div class="oC${d.act?' a':''}${d.nuevo?' cNw':''}${d.marcado?' sl2':''}" ${d.attr||''} role="button" tabindex="0">${d.arriba||''}
      <div class="cTp">${d.sel||''}<span class="cCh" style="background:${c[0]};color:${c[1]}">${cSvg(c[2])}<span>${E(d.neg||d.sv)}</span></span><span class="cPr">${E(d.precio)}</span></div>
      <div><div class="cCod">${E(d.ref)}${d.hace?' · '+E(d.hace):''}</div><div class="cNm">${E(d.cliente||'Cliente')}</div>${d.dir?`<div class="cDr">${E(d.dir)}</div>`:''}</div>
      ${d.pasos&&d.fase.n?`<div class="cStp" style="grid-template-columns:repeat(${d.pasos.length},minmax(0,1fr))" aria-label="Avance: ${E(d.fase.txt||'')}">${bars}</div>`:''}
      ${m&&m.nombre?`<div class="cFt"><span class="cMo">${E(String(m.nombre).trim().charAt(0).toUpperCase())}</span><span class="cMt"><b>${E(m.nombre)}</b><span>${E(m.rol||'Motorizado')}</span></span>${mt?`<a class="cIk" data-lnk href="tel:+${mt}" aria-label="Llamar a ${E(m.nombre)}">${cSvg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',20)}</a><a class="cIk g" data-lnk href="https://wa.me/${mt}" target="_blank" rel="noopener" aria-label="WhatsApp a ${E(m.nombre)}">${cSvg('<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/>',20)}</a>`:''}</div>`:''}${d.abajo||''}</div>`;
  }
  function cFila(d){
    const no=d.fase.k==='no';
    return `<button type="button" class="oR${d.marcado?' sl2':''}" ${d.attr||''}>${d.sel||`<span class="cOk${no?' no':''}">${no?cSvg('<path d="M6 6l12 12M18 6L6 18"/>',16):cSvg('<path d="M5 12l5 5L19 7"/>',16)}</span>`}<span class="cMd"><i>${E([d.ref,d.cuando].filter(Boolean).join(' · '))}</i><b>${E(d.cliente||'Cliente')}</b><span>${E([d.neg||d.sv,d.moto&&d.moto.nombre?String(d.moto.nombre).split(' ')[0]:''].filter(Boolean).join(' · '))}</span></span><em>${E(d.precio)}</em></button>`;
  }
  const cPasos=(sv,neg)=>['Recibido','Asignado',sv==='Compra'?'Compra':neg?'En el local':'Recojo','En camino','Entregado'];
  const ESTILO=PdPasos.css+C_CSS+`
.nsq{counter-reset:nsq}.nsq:not(:has(.pzh)) .fld>label{display:flex;align-items:center;gap:8px}.nsq:not(:has(.pzh)) .fld>label::before{counter-increment:nsq;content:counter(nsq);flex:none;width:24px;height:24px;border-radius:50%;background:#FDEBDF;color:#9A330A;font-size:12.5px;font-weight:800;display:inline-flex;align-items:center;justify-content:center}

:host{z-index:2147482000}
.app{animation:none}
.hd{background:#FFFFFF;border-bottom:1px solid #F1E4DA;padding:calc(env(safe-area-inset-top,0px) + 14px) 16px 14px;display:flex;align-items:center;gap:12px;flex:0 0 auto}
.ib{position:relative;width:44px;height:44px;flex:0 0 44px;border-radius:12px;border:1px solid #F1E4DA;background:#FFFFFF;display:flex;align-items:center;justify-content:center;color:#1F1A17;padding:0;cursor:pointer}
.bd{position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#C4410C;color:#FFFFFF;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #FFFFFF;box-sizing:border-box}
.ava{flex:0 0 48px;width:48px;height:48px;border-radius:50%;background:#FDEBDF center/cover no-repeat;color:#C4410C;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800}
.dsp{display:flex;align-items:center;gap:12px;padding:14px;border-radius:18px;background:#FFFFFF;border:1px solid #F1E4DA}
.dsp .pt{flex:0 0 12px;width:12px;height:12px;border-radius:50%;background:#15803D;box-shadow:0 0 0 5px rgba(21,128,61,.15)}
.dsp.off .pt{background:#A8988C;box-shadow:0 0 0 5px rgba(168,152,140,.18)}
.dsp .bt{height:40px;padding:0 12px;border-radius:12px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;font-size:14px;font-weight:700;display:flex;align-items:center;gap:6px;cursor:pointer}
.dsp .bt svg{color:#C4410C;width:18px;height:18px}
.oc{display:block;width:100%;text-align:left;color:#1F1A17;background:#FFFFFF;border:1px solid #F1E4DA;border-radius:18px;padding:14px;cursor:pointer;display:flex;flex-direction:column;gap:10px}
.oc.a{border:1.5px solid #C4410C;box-shadow:0 6px 18px rgba(196,65,12,.10)}
.oc .r1{display:flex;align-items:center;gap:8px}.oc .r1 b{font-size:17px}.oc .r1 small{font-size:12px;font-weight:700;color:#6B5E55;text-transform:uppercase;letter-spacing:.05em}.oc .r1 em{margin-left:auto;font-style:normal;font-size:18px;font-weight:800;color:#1F1A17}
.oc .pls{display:flex;gap:8px;flex-wrap:wrap}
.pl{display:inline-flex;align-items:center;height:28px;padding:0 10px;border-radius:999px;background:#FDEBDF;color:#9A330A;font-size:13px;font-weight:800}
.pl.n{background:#FFFFFF;border:1px solid #F1E4DA;color:#1F1A17;font-weight:700}.pl.g{background:#E9F6EE;color:#0F5E2E}
.oc .bars{display:grid;gap:6px}
.oc .ad{display:flex;gap:10px;align-items:flex-start}.oc .ad svg{color:#C4410C;flex:0 0 20px;width:20px;height:20px}.oc .ad b{display:block;font-size:15px}.oc .ad span{font-size:14px;color:#6B5E55}
.kick{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#C4410C}
.two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.mt{text-align:left;padding:14px;border-radius:18px;background:#FFFFFF;border:1px solid #F1E4DA;display:flex;flex-direction:column;gap:4px;color:#1F1A17;cursor:pointer}
.mt span{font-size:13px;font-weight:600;color:#6B5E55}.mt b{font-size:24px;color:#1F1A17}.mt small{font-size:12px;color:#6B5E55}
.tl{display:flex;gap:12px;align-items:center;padding:14px;border-radius:18px;background:#FFFFFF;border:1px solid #F1E4DA;color:#1F1A17;cursor:pointer;width:100%;text-align:left}
.tl .ic{flex:0 0 44px;width:44px;height:44px;border-radius:12px;background:#FDEBDF;color:#C4410C;display:flex;align-items:center;justify-content:center}
.tl .tx{flex:1 1 0%;min-width:0;display:flex;flex-direction:column;gap:2px}.tl .tx b{font-size:16px}.tl .tx span{font-size:13px;color:#6B5E55}
.tl>svg{color:#6B5E55;flex:0 0 auto}
.opc{display:flex;flex-wrap:wrap;gap:8px}.opc button{flex:1 1 auto;min-height:46px;padding:8px 14px;border-radius:14px;border:1.5px solid #F1E4DA;background:#fff;color:#1F1A17;font:inherit;font-size:15px;font-weight:600;cursor:pointer;line-height:1.25}.opc button.on{border-color:#C4410C;background:#FFF4EC;color:#9A330A;box-shadow:inset 0 0 0 1px #C4410C}
.mob{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px}.mob button{display:flex;align-items:center;gap:10px;min-height:56px;padding:8px 12px;border-radius:14px;border:1.5px solid #F1E4DA;background:#fff;font:inherit;font-size:15px;font-weight:700;color:#1F1A17;text-align:left;cursor:pointer;min-width:0}.mob button span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mob button i{font-style:normal;flex:0 0 36px;width:36px;height:36px;border-radius:50%;background:#FDEBDF;color:#9A330A;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800}.mob button.on{border-color:#C4410C;background:#FFF4EC;box-shadow:inset 0 0 0 1px #C4410C}.mob button.on i{background:#C4410C;color:#fff}
select{-webkit-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236B5E55' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")!important;background-repeat:no-repeat!important;background-position:right 14px center!important;background-size:20px!important;padding-right:44px!important;color:#1F1A17}
.seg{display:grid;gap:4px;padding:4px;border-radius:14px;background:#F6EFE9}
.seg button{height:40px;border-radius:10px;border:0;background:transparent;color:#6B5E55;font-size:14px;font-weight:600;cursor:pointer}
.seg button.on{background:#FFFFFF;box-shadow:0 1px 3px rgba(31,26,23,.10);color:#1F1A17;font-weight:800}
.vac{padding:28px 16px;text-align:center;color:#6B5E55;font-size:15px;border-radius:18px;border:1px dashed #E3CFC2;background:#FFFFFF}
.nv{flex:0 0 auto;display:flex;background:#FFFFFF;border-top:1px solid #F1E4DA;padding:2px 6px calc(env(safe-area-inset-bottom,0px) + 8px)}
.nv button{position:relative;flex:1 1 0%;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 0 4px;border:0;background:transparent;color:#6B5E55;font-size:12px;font-weight:600;cursor:pointer}
.nv button span.i{width:52px;height:30px;border-radius:999px;display:flex;align-items:center;justify-content:center}
.nv button.on{color:#C4410C;font-weight:800}.nv button.on span.i{background:#FDEBDF}
.nv .bd{top:2px;right:calc(50% - 26px)}
.gps{display:flex;gap:10px;align-items:center;padding:12px 14px;border-radius:14px;background:#FDE8E8;color:#9B1C1C;font-size:14px;font-weight:700}
.gps button{margin-left:auto;height:36px;padding:0 12px;border-radius:10px;border:0;background:#C4410C;color:#FFFFFF;font-weight:800;cursor:pointer}

.back2{width:44px;height:44px;flex:0 0 44px;border-radius:12px;border:1px solid #F1E4DA;background:#FFFFFF;display:flex;align-items:center;justify-content:center;color:#1F1A17;padding:0;cursor:pointer}
.fld{display:flex;flex-direction:column;gap:6px}.fld label{font-size:14px;font-weight:700}
.fld input,.fld select{width:100%;height:54px;border-radius:14px;border:1.5px solid #F1E4DA;background:#FFFFFF;padding:0 16px;font:600 16px PdInter,Inter,system-ui,sans-serif;color:#1F1A17;outline:none;box-sizing:border-box;-webkit-appearance:none;appearance:none}
.fld input:focus,.fld select:focus{border-color:#C4410C}
.mv{display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid #F1E4DA}.mv:last-child{border-bottom:0}
.mv .ic{flex:0 0 40px;width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center}
.mv .tx{flex:1 1 0%;min-width:0}.mv .tx b{display:block;font-size:15px;overflow-wrap:anywhere}.mv .tx span{font-size:13px;color:#6B5E55}
.mv .am{font-size:16px;font-weight:800;white-space:nowrap}
.g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.kp{padding:14px;border-radius:18px;background:#FFFFFF;border:1px solid #F1E4DA;display:flex;flex-direction:column;gap:2px}
.kp span{font-size:13px;color:#6B5E55;font-weight:600}.kp b{font-size:22px}.kp small{font-size:12px;color:#6B5E55}
.cd{background:#FFFFFF;border:1px solid #F1E4DA;border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:10px}
.cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}
.slc{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}.slc>small{text-align:center;font-size:12px;font-weight:800;color:#6B5E55;padding:2px 0}.slc>div{min-height:60px;height:auto;border-radius:12px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:4px 1px;font:inherit;min-width:0}.slc>div b{font-size:17px;font-weight:800;line-height:1.1}.slc>div small{font-size:10px;font-weight:700;color:#6B5E55;line-height:1.1;text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.slc>div em{font-style:normal;font-size:9px;font-weight:800;color:#9A330A;background:#FDEBDF;border-radius:6px;padding:1px 3px;max-width:100%;overflow:hidden;white-space:nowrap}.slc .trabajado,.slc .ajuste{background:#E9F6EE;border-color:#CDEBD7}.slc .trabajado small,.slc .ajuste small{color:#0F5E2E}.slc .descanso{background:#FFF4EC;border-color:#F6D9C4}.slc .descanso small{color:#9A330A}.slc .falta{background:#FDE8E8;border-color:#F4C7C3}.slc .falta small,.slc .falta b{color:#9B1C1C}.slc .hoy{border:2px solid #C4410C}.slc .hoy small{color:#C4410C}.slc .libre,.slc .antes,.slc .dia31,.slc .ajusteFuturo{background:#F6EFE9;color:#9C8F86}.slc .adel{box-shadow:inset 0 0 0 2px #15803D}.slc>div{position:relative}.slc .vacp{background:#EAF1FE;border-color:#C9DBFB}.slc .vacp small,.slc .vacp b{color:#1D4ED8}.slc .vacn small{color:#9B1C1C}
.cal div{display:flex;flex-direction:column;align-items:center;gap:3px}.cal small{font-size:11px;color:#6B5E55;font-weight:700}
.cal i{width:100%;max-width:40px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:12px;font-weight:800;background:#F6EFE9;color:#6B5E55}
.cal i.t{background:#E9F6EE;color:#0F5E2E}.cal i.r{background:#FDEBDF;color:#9A330A}.cal i.f{background:#FDE8E8;color:#9B1C1C}.cal i.h{background:#FFFFFF;border:1.5px solid #C4410C;color:#C4410C}
.ley{display:flex;gap:14px;flex-wrap:wrap;font-size:13px;color:#6B5E55}
.bar{height:10px;border-radius:999px;background:#F6EFE9;overflow:hidden}.bar s{display:block;height:100%;background:#C4410C;border-radius:999px}
.stars{color:#C4410C;letter-spacing:2px;font-size:16px}
.cols3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.stop{display:flex;gap:12px;align-items:center;padding:12px 14px;background:#FFFFFF;border:1px solid #F1E4DA;border-radius:16px}
.stop .n{flex:0 0 30px;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;background:#C4410C;color:#FFFFFF}
.stop .tg{display:inline-flex;height:22px;align-items:center;padding:0 8px;border-radius:999px;font-size:12px;font-weight:800}
.ph{display:flex;gap:14px;align-items:center;padding:16px;border-radius:18px;background:#FFFFFF;border:1px solid #F1E4DA}
.ph .ava{flex:0 0 64px;width:64px;height:64px;font-size:26px}
.chips{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none;overscroll-behavior-x:contain}.chips::-webkit-scrollbar{display:none}.list{scrollbar-width:none}.list::-webkit-scrollbar{display:none}
.chips button{flex:0 0 auto;height:38px;padding:0 14px;border-radius:999px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;font-size:14px;font-weight:700;cursor:pointer}
.chips button.on{border:0;background:#C4410C;color:#FFFFFF}
.av2{display:flex;gap:12px;align-items:flex-start;padding:14px;border-radius:18px;background:#FFFFFF;border:1px solid #F1E4DA;text-align:left;width:100%;color:#1F1A17}
.av2 .ic{flex:0 0 40px;width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:#FDEBDF;color:#C4410C}
.av2 .tx{flex:1 1 0%;min-width:0}.av2 .tx b{display:block;font-size:15px}.av2 .tx span{display:block;font-size:14px;color:#6B5E55;margin-top:2px;line-height:1.4}.av2 .tx small{display:block;font-size:12px;color:#6B5E55;margin-top:6px;font-weight:600}
.av2 .pt{flex:0 0 10px;width:10px;height:10px;border-radius:50%;background:#C4410C;margin-top:6px}
.list{scrollbar-width:none}.list::-webkit-scrollbar{display:none}
.opt span{font-size:13px;color:#6B5E55}
.msgok{padding:10px 12px;border-radius:12px;background:#E9F6EE;color:#0F5E2E;font-size:14px;font-weight:700}
.load{padding:24px;text-align:center;color:#6B5E55;font-size:15px}
`+`
.pgw{display:flex;gap:8px;align-items:center;width:100%}.pgw>input,.pgw>textarea{flex:1 1 0%;min-width:0}
.pgb{flex:0 0 auto;height:54px;padding:0 16px;border-radius:14px;border:1.5px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;font:800 15px PdInter,Inter,system-ui,sans-serif;cursor:pointer}
.pgb:active{transform:scale(.96);background:#FFF4EC}

:host{z-index:2147482000}
.pwz{gap:6px}.pbar{display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:8px;margin-top:8px}.pbar i{height:6px;border-radius:3px;background:#F1E4DA}.pbar i.on{background:#C4410C}
.hkp{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.hkp>div{background:#FFFFFF;border:1px solid #F1E4DA;border-radius:16px;padding:12px 14px;display:flex;flex-direction:column;gap:2px}
.hkp span{font-size:13px;font-weight:700;color:#6B5E55}.hkp b{font-size:21px;font-weight:800;color:#1F1A17;white-space:nowrap}.hkp b.o{color:#C4410C}
.hl{background:#FFFFFF;border:1px solid #F1E4DA;border-radius:18px;overflow:hidden}
.hi{display:flex;align-items:center;gap:12px;width:100%;padding:12px 14px;border:0;border-top:1px solid #F6EFE9;background:transparent;color:#1F1A17;text-align:left;cursor:pointer;font:inherit}
.hi:first-child{border-top:0}.hi:active{background:#FFF4EC}
.hi .ic{flex:0 0 38px;width:38px;height:38px;border-radius:11px;background:#FDEBDF;color:#C4410C;display:flex;align-items:center;justify-content:center}.hi .ic svg{width:20px;height:20px}
.hi .tx{flex:1 1 0%;font-size:16px;font-weight:600}.hi .bd{position:static;border:0}.hi>svg:last-child{color:#B9AAA0;width:18px;height:18px}
.atj{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:0 -14px;padding:0 14px}.atj::-webkit-scrollbar{display:none}
.atj button{flex:0 0 auto;position:relative;display:inline-flex;align-items:center;gap:7px;height:40px;padding:0 13px;border-radius:12px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;font:700 14px PdInter,Inter,system-ui,sans-serif;cursor:pointer}
.atj button svg{width:18px;height:18px;color:#C4410C}.atj .bd{position:static;border:0}
.fabN{bottom:calc(86px + env(safe-area-inset-bottom,0px))!important}.fabS{bottom:calc(80px + env(safe-area-inset-bottom,0px))!important}.fabV{bottom:calc(70px + env(safe-area-inset-bottom,0px))!important}
:host(.solo){display:none!important}
:host(.cargaPag) .list,:host(.cargaPag) .foot,:host(.cargaPag) .top{visibility:hidden}
.dwb{position:absolute;inset:0;background:rgba(31,26,23,.18);z-index:20;animation:dwf .2s ease-out}
.dw{position:absolute;top:0;bottom:0;left:0;width:min(86%,360px);background:#FFF9F5;z-index:21;display:flex;flex-direction:column;box-shadow:8px 0 30px rgba(31,26,23,.12);animation:dwi .22s ease-out}
@keyframes dwi{from{transform:translateX(-100%)}to{transform:none}}@keyframes dwf{from{opacity:0}to{opacity:1}}
.dwh{display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 14px) 14px 14px;background:#FFFFFF;border-bottom:1px solid #F1E4DA}
.dwh .yo{flex:1 1 0%;min-width:0}
.dwl{flex:1 1 0%;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;scrollbar-width:none}.dwl>*{flex-shrink:0}
.dwp{display:flex;flex-direction:column;background:#FFFFFF;border:1px solid #F1E4DA;border-radius:18px;overflow:hidden}
.dwp button{display:flex;align-items:center;gap:12px;width:100%;padding:14px 16px;border:0;border-top:1px solid #F6EFE9;background:transparent;color:#1F1A17;font-size:16px;font-weight:700;text-align:left;cursor:pointer}
.dwp button:first-child{border-top:0}.dwp button span:first-of-type{flex:1 1 0%}.dwp button svg{color:#C4410C}
.dwp button.on{background:#FFF4EC;color:#9A330A}
:host(.solo) .app{background:transparent}
.sel{flex:0 0 26px;width:26px;height:26px;border-radius:8px;border:2px solid #E3CFC2;background:#FFFFFF;display:flex;align-items:center;justify-content:center;color:#FFFFFF}
.sel.on{background:#C4410C;border-color:#C4410C}
.fabN{position:fixed;right:18px;bottom:calc(22px + env(safe-area-inset-bottom));z-index:30;width:62px;height:62px;border-radius:50%;border:0;background:#C4410C;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 24px rgba(196,65,12,.35);cursor:pointer}.fabN svg{width:30px;height:30px}
.fabV{position:fixed;inset:0;z-index:31;background:rgba(31,26,23,.28)}
.fabS{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:32;background:#fff;border-radius:22px;padding:16px;display:flex;flex-direction:column;gap:8px;box-shadow:0 14px 40px rgba(31,26,23,.25);max-width:560px;margin:0 auto}
.chW{position:relative}.chW .chips{scrollbar-width:none}.chW .chips::-webkit-scrollbar{display:none}
.chA{position:absolute;right:0;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:1px solid #F1E4DA;background:#FFFFFF;color:#C4410C;display:flex;align-items:center;justify-content:center;box-shadow:-14px 0 14px #FFF9F5,0 2px 6px rgba(31,26,23,.12);cursor:pointer}.chA svg{width:22px;height:22px;transition:transform .2s}.chA.fin svg{transform:rotate(180deg)}.sel svg{width:16px;height:16px}
.oc.sl2{border:1.5px solid #C4410C;background:#FFF4EC}
.pl.r{background:#FDE8E8;color:#9B1C1C}.pl.m{background:#FFF4EC;color:#9A330A}
.con{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:#6B5E55}.con i{width:8px;height:8px;border-radius:50%;background:#A8988C}
.con.ok{color:#0F5E2E}.con.ok i{background:#15803D}.con.no{color:#9B1C1C}.con.no i{background:#B42318}
.cols2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.cols3 .mt b,.cols2 .mt b{font-size:20px}
.tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.tiles button{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:14px 12px;border-radius:16px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;font-size:14px;font-weight:800;cursor:pointer;text-align:left}
.tiles button svg{color:#C4410C}.tiles button.on{border:1.5px solid #C4410C;background:#FFF4EC}
.tiles .bd{top:8px;right:8px}
.gr{background:#FFFFFF;border:1px solid #F1E4DA;border-radius:18px;overflow:hidden}
.gr>button.gh{width:100%;display:flex;align-items:center;gap:12px;padding:14px;border:0;background:transparent;color:#1F1A17;text-align:left;cursor:pointer}
.gr .gh .ic{flex:0 0 40px;width:40px;height:40px;border-radius:12px;background:#FDEBDF;color:#C4410C;display:flex;align-items:center;justify-content:center}
.gr .gh b{flex:1 1 0%;font-size:16px}.gr .gh small{font-size:13px;color:#6B5E55;font-weight:700}
.gr .gh>svg:last-child{color:#6B5E55;transition:transform .2s}.gr.ab .gh>svg:last-child{transform:rotate(90deg)}
.gi{display:flex;align-items:center;gap:10px;width:100%;padding:14px 16px 14px 66px;border:0;border-top:1px solid #F6EFE9;background:transparent;color:#1F1A17;font-size:15px;font-weight:600;text-align:left;cursor:pointer}
.gi>span:first-child{flex:1 1 0%}.gi .bd{position:static;border:0}.gi>svg{color:#A8988C;width:18px;height:18px}
.yo{display:flex;align-items:center;gap:12px;padding:14px;border-radius:18px;background:#FFFFFF;border:1px solid #F1E4DA;width:100%;text-align:left;color:#1F1A17;cursor:pointer}
.yo .ava{flex:0 0 52px;width:52px;height:52px}
.mas{height:44px}
`;
  /* Las secciones de siempre como página completa: sin velo, de arriba hasta el menú inferior */
  const P='html.pdaPag:root body:not('+'#pdQ'.repeat(150)+')';
  const VELO=[P+' [data-pdm-velo]',P+' #pdmModal:not([hidden])',P+' #pdhSheet:not([hidden])',P+' .pdCtlVelo'].join(',');
  const HOJA=[P+' [data-pdm-hoja]',P+' #pdmModal:not([hidden]) > .m-card',P+' #pdhSheet:not([hidden]) .h-sheetCard'].join(',');
  /* Va en la capa «pda», declarada antes que todas: sus !important ganan a los estilos viejos */
  const ESTILO_DOC=`@layer pda{
:root{--fr-peach:#FDEBDF!important;--fr-peach-soft:#FFF4EC!important;--fr-orange-dark:#9A330A!important;--fr-muted:#6B5E55!important;--fr-line:#F1E4DA!important;--fr-green:#15803D!important;--fr-beige:#F6EFE9!important}
${VELO}{position:fixed!important;top:var(--pda-top,72px)!important;bottom:var(--pda-nav,74px)!important;left:0!important;right:0!important;inset:var(--pda-top,72px) 0 var(--pda-nav,74px) 0!important;width:auto!important;height:auto!important;max-height:none!important;margin:0!important;padding:0!important;background:transparent!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;z-index:2147482500!important;transform:none!important;opacity:1!important;animation:none!important}
${P} :is(.m-bg,.h-sheetBg,.pdPwBg,.pdCtlBg,[data-pdm-velo] > [data-pdm-velo]){background:transparent!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
${HOJA}{position:absolute!important;top:0!important;bottom:0!important;left:0!important;right:0!important;inset:0!important;width:auto!important;max-width:none!important;height:auto!important;max-height:none!important;min-height:0!important;margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;transform:none!important;translate:none!important;animation:none!important;background:#FFF9F5!important;overflow-y:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important}
${HOJA.split(',').map(x=>x+'::before').join(',')}{display:none!important}
${P} :is([data-pdm-hoja],#pdmModal,#pdhSheet) :is([data-pdm-cab],.m-head,.h-head){display:none!important}
${P} [data-pdm-hoja] [data-pdm-pie]{bottom:0!important}
${P} :is(.pdCtlStat){background:#FDEBDF!important;color:#1F1A17!important;box-shadow:none!important;border:0!important}
${P} .pdCtlStat *{color:inherit!important}

/* ---- tema: el contenido de las secciones de siempre con los mismos componentes del diseño nuevo ---- */
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard){font-family:PdInter,Inter,system-ui,sans-serif!important;color:#1F1A17!important;-webkit-tap-highlight-color:transparent!important;scrollbar-width:none!important;padding-bottom:20px!important}
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard)::-webkit-scrollbar{display:none!important}
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard) *{-webkit-tap-highlight-color:transparent!important;scrollbar-width:none!important}
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard) :is(button,label,a,.chip,[role=tab]){-webkit-user-select:none!important;user-select:none!important}
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard) :is(h1,h2,h3,h4,h5,[class*=Title],[class*=title],[class*=Tit]):not(button):not(label){color:#1F1A17!important;font-weight:800!important;letter-spacing:0!important}
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard) :is(h3,h4,[class*=SecHead] strong,[class*=Head] > span > strong,[class*=Head] strong){font-size:17px!important;color:#1F1A17!important}
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard) :is([class*=Kick],[class*=kick],[class*=kicker],.pdn-kicker){font-size:12px!important;font-weight:800!important;letter-spacing:.06em!important;text-transform:uppercase!important;color:#6B5E55!important}
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard) label:not(:has(input[type=checkbox],input[type=radio])){font:700 14px/1.3 PdInter,Inter,system-ui,sans-serif!important;color:#1F1A17!important;text-transform:none!important;letter-spacing:0!important}
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard) :is(input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]):not([type=hidden]),select){height:54px!important;min-height:54px!important;border-radius:14px!important;border:1.5px solid #F1E4DA!important;background-color:#FFFFFF!important;padding-top:0!important;padding-bottom:0!important;padding-right:16px!important;font:600 16px PdInter,Inter,system-ui,sans-serif!important;color:#1F1A17!important;box-shadow:none!important;outline:none!important;box-sizing:border-box!important}
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard) :is(input:not([type=search]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=file]):not([type=hidden]),select){padding-left:16px!important}
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard) textarea{min-height:96px!important;border-radius:14px!important;border:1.5px solid #F1E4DA!important;background:#FFFFFF!important;padding:12px 16px!important;font:500 16px PdInter,Inter,system-ui,sans-serif!important;color:#1F1A17!important;box-shadow:none!important;outline:none!important}
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard) :is(input,select,textarea):focus{border-color:#C4410C!important;box-shadow:none!important}
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard) :is(input,textarea)::placeholder{color:#A8988C!important;font-weight:500!important}
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard) select{-webkit-appearance:none!important;appearance:none!important;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%236B5E55' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")!important;background-repeat:no-repeat!important;background-position:right 14px center!important;padding-right:44px!important}
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard) input:is([type=checkbox],[type=radio]){accent-color:#C4410C!important;width:22px!important;height:22px!important}
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard) p:not([class*=Kick]){color:#6B5E55;line-height:1.45!important}
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard) :is([class*=Card],[class*=card]:not(.m-card),[class*=Sec]:not(section[id^=tab-]),.pdnSec,fieldset){border-radius:18px!important;border-color:#F1E4DA!important;box-shadow:none!important}
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard) :is(button,.btn,a[class*=btn],a[class*=Btn]):not(.sw):not([role=switch]):not([class*=Tog]):not([class*=tog]){border-radius:12px!important;box-shadow:none!important;font-family:PdInter,Inter,system-ui,sans-serif!important;text-transform:none!important;letter-spacing:0!important;transition:none!important}
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard) :is(button,a):hover{filter:none!important;transform:none!important}
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard) :is([class*=Bar] > i,[class*=bar] > s,[class*=Steps] > i){border-radius:3px!important}
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard) section[id^=tab-]{border:0!important;box-shadow:none!important;background:transparent!important;padding:14px!important;margin:0!important;max-width:none!important}
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard) section[id^=tab-] > :is(h2.adminPageTitle,.pdn-kicker):first-of-type,html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard) .adminPageTitle{display:none!important}
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard) :is(.pdcStats,.pdgStats,.s-stats,.d-stats,.pdcjStats){border:0!important;background:transparent!important;padding:0!important;box-shadow:none!important}
html.pdaPag :is([data-pdm-hoja],#pdmModal .m-card,#pdhSheet .h-sheetCard) #pdmBody > section[id^=tab-]{padding-top:4px!important}
html.pdaApp body{-webkit-tap-highlight-color:transparent!important;overscroll-behavior:none!important}

html.pdaPag #nav,html.pdaApp #nav{visibility:hidden!important}
html.pdaApp #pdMenu,html.pdaApp #pdMenuShade{visibility:hidden!important;pointer-events:none!important}
}`;
  /* ---------- estado ---------- */
  window.pdEnPagina=()=>{try{return !!sub||tab!=='inicio'||!!paginaVieja()||!!(window.PdPasos&&PdPasos.isOpen())}catch(e){return false}};
  let host=null,root=null,topH=null,topR=null,tab='inicio',key='',keyTop='',scrollMem={},tocando=false;
  let motoSel='';let ultimo='',marca='inicio',kick='Administración',chip='',q='',selModo=false,limite=40,abiertoGr=null,mq='',movido=null;
  const SEL=()=>{try{return selectedOrders}catch(e){return null}};

  /* =============== INICIO (pedidos) =============== */
  const CH=[['','Todos',()=>true],['nuevo','Por atender',o=>['pendiente','confirmado','pedido_recibido','nuevo'].includes(est(o))],['moto','Por motorizado',o=>!!o.motorizado_id],['asignado','Asignados',o=>est(o)==='asignado'],['camino','En camino',o=>['aceptado','pedido_aceptado','en_camino','camino_recojo'].includes(est(o))],['entrega','En entrega',o=>['en_entrega','camino_entrega','confirmando_pago'].includes(est(o))],['entregado','Entregados',o=>est(o)==='entregado'],['cancelado','Cancelados',o=>['cancelado','rechazado'].includes(est(o))]];
  const fase=o=>{try{if(window.pdUDatos&&pdUDatos.fase)return pdUDatos.fase(o)}catch(e){}const s=est(o);return s==='entregado'?{n:5,txt:'Entregado',k:'ok'}:s==='cancelado'?{n:0,txt:'Cancelado',k:'no'}:{n:1,txt:typeof orderStatusLabel==='function'?orderStatusLabel(s):s,k:'new'}};
  function tarjeta(o){
    const f=fase(o),n=NEG(o.negocio_id||o.restaurante_id),sv=svc(o)||(o.negocio_id?'Negocio':'Recojo y entrega'),s=SEL(),marc=selModo&&s&&s.has(String(o.id));
    const mm=o.motorizado_id?(MOTOS().find(m=>String(m.id)===String(o.motorizado_id))||{}):null;
    const hace=o.creado_en?Math.max(0,Math.round((Date.now()-T(o.creado_en))/60000)):null;
    const hTxt=hace==null?'':hace<1?'ahora':hace<60?'hace '+hace+' min':fecha(o.creado_en);
    const nv=!selModo&&f.k==='new'&&!o.motorizado_id;/* pedido nuevo sin motorizado: aviso y botón para asignar */
    const d={ref:ref(o.id),sv,neg:n.nombre||'',precio:M(o.total),cliente:o.nombre_cliente||o.nombre_remitente||'Cliente',dir:o.direccion_entrega||'',hace:hTxt,fase:f,pasos:cPasos(sv,!!o.negocio_id),
      moto:mm?{nombre:mm.nombre_completo||o.motorizado_nombre||'',tel:mm.telefono||''}:null,marcado:marc,act:!selModo&&(nv||f.k==='new'),
      sel:selModo?`<span class="sel${marc?' on':''}">${marc?IC.check:''}</span>`:'',attr:`data-o="${E(o.id)}"`,
      cuando:o.entregado_en?fecha(o.entregado_en):hTxt};
    if(f.k==='ok'||f.k==='no')return cFila(d);
    if(nv){d.nuevo=1;d.arriba=`<div class="cAv"><i></i>Pedido nuevo · sin motorizado<em>${E(hTxt)}</em></div>`;d.abajo=`<button type="button" class="b o" style="height:48px" data-o="${E(o.id)}">Asignar motorizado</button>`}
    return cGrande(d);
  }
  let nuevoAb=false,frecAb=false;
  function inicio(){
    if(window.__pdaCajaTotal==null)try{caja()}catch(_){}
    if(window.__pdaSueldoTotal==null)try{sueldos()}catch(_){}
    const sal=document.querySelector('.pdSal');const kp=[...(sal?sal.querySelectorAll('.pmaAcc > button b'):[])].map(b=>b.textContent.trim());if(window.__pdaSueldoTotal!=null)kp[1]=M(window.__pdaSueldoTotal);if(window.__pdaCajaTotal!=null)kp[2]=M(window.__pdaCajaTotal);
    const con=sal&&sal.querySelector('.con');const nom=((sal&&sal.querySelector('.pmaTx strong'))||{}).textContent||'Hola, Admin';
    const av=document.querySelector('#pdMenu .m3Av');const foto=window.__pdAdminFoto||'';
    const todos=L(),cnt=CH.map(c=>todos.filter(c[2]).length);
    const ql=q.trim().toLowerCase();const fil=todos.filter((CH.find(c=>c[0]===chip)||CH[0])[2]).filter(o=>chip!=='moto'||!motoSel||String(o.motorizado_id)===motoSel).filter(o=>!ql||[o.id,ref(o.id),o.nombre_cliente,o.telefono_cliente,o.nombre_remitente,NEG(o.negocio_id).nombre].join(' ').toLowerCase().includes(ql));
    let h=`<div class="cols2"><button type="button" class="mt" data-t="sueldo"><span>Sueldos</span><b>${E(kp[1]||'—')}</b></button><button type="button" class="mt" data-t="caja"><span>Cajas</span><b>${E(kp[2]||'—')}</b></button></div>`;
    h+=`<div class="fld"><label for="aQ" style="position:absolute;width:1px;height:1px;overflow:hidden">Buscar pedido</label><input id="aQ" type="search" placeholder="N.º de pedido, cliente o teléfono" value="${E(q)}" data-in="q"></div>`;
    {const AT=[['asignación automática','Asignación automática',IC.swap],['calificaciones','Calificaciones',IC.star]];
     h+=`<div class="atj">${AT.map(([k,n,ic])=>{const x=bdOf(k);return `<button type="button" data-it="${E(k)}" data-gk="Pedidos">${ic}${E(n)}${x?`<span class="bd">${x}</span>`:''}</button>`}).join('')}</div>`}
    h+=`<div class="chW"><div class="chips">${CH.map((c,i)=>`<button type="button" data-c="${c[0]}" class="${chip===c[0]?'on':''}">${c[1]}${cnt[i]?' · '+cnt[i]:''}</button>`).join('')}</div></div>`;
    if(chip==='moto'){const MS=MOTOS().map(mo=>({id:String(mo.id),n:mo.nombre_completo||'Motorizado',c:todos.filter(o=>String(o.motorizado_id)===String(mo.id)).length})).filter(x=>x.c).sort((a,b)=>b.c-a.c);
      if(motoSel&&!MS.some(x=>x.id===motoSel))motoSel='';
      h+=`<div class="chW"><div class="chips">${MS.map(x=>`<button type="button" data-mc="${E(x.id)}" class="${motoSel===x.id?'on':''}">${E(x.n.split(' ')[0])} · ${x.c}</button>`).join('')}</div></div>`;
      if(!motoSel)h+=`<div class="lbl" style="margin:0">Elige un motorizado para ver solo sus pedidos</div>`}
    h+=`<div class="row" style="justify-content:space-between"><div class="lbl" style="margin:0">${fil.length} pedido${fil.length===1?'':'s'}</div><button type="button" class="b" style="height:40px;padding:0 14px" data-a="selmodo">${selModo?'Listo':'Seleccionar'}</button></div>`;
    h+=`<div id="aLista" style="display:flex;flex-direction:column;gap:10px">${lista(fil)}</div>`;
    /* El botón «Nuevo servicio» ahora vive en el centro del menú inferior (ver pintarNav) */
    const nb=Number((($('pdaBell')||{}).querySelector?.('.pdaBadge,.badge,b,span')||{}).textContent)||0;
    const f=new Date().toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'short',timeZone:'America/Lima'}).replace('.','');
    const s=SEL(),ns=s?s.size:0;
    const fotoA=window.__pdAdminFoto||(()=>{try{return localStorage.getItem('pdAdminFoto')||''}catch(_){return ''}})(),iniA=(String(nom).replace(/^Hola,\s*/i,'').trim().charAt(0)||'A').toUpperCase();
    return {head:`<div class="hd"><button type="button" class="ava" data-a="perfil" aria-label="Mi perfil" style="border:0;padding:0;cursor:pointer${fotoA?`;background-image:url('${E(fotoA)}')`:''}">${fotoA?'':E(iniA)}</button><div style="flex:1 1 0%;min-width:0"><div class="kick" style="color:#6B5E55">${E(f)}</div><div class="h1" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${E(nom)}</div>${con?`<span class="con ${E(con.className.replace('con','').trim())}"><i></i>${E((con.textContent||'').trim())}</span>`:''}</div><button type="button" class="ib" data-a="act" aria-label="Actualizar">${IC.refresh}</button><button type="button" class="ib" data-a="bell" aria-label="Avisos">${IC.bell}${nb?`<span class="bd">${nb>99?'99+':nb}</span>`:''}</button></div>`,
      body:h,foot:selModo?`<div style="display:flex;gap:10px"><button type="button" class="b" style="flex:1 1 0;height:54px;font-size:16px;${ns===1?'':'opacity:.45'}" data-a="seleditar"${ns===1?'':' disabled'}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>Editar</button><button type="button" class="b o" style="flex:1.4 1 0;height:54px;font-size:16px;background:${ns?'#B42318':'#D8CBC1'}" data-a="borrar"${ns?'':' disabled'}>${IC.trash}Eliminar${ns?' '+ns:''}</button></div>${ns>1?'<div style="text-align:center;font-size:13px;color:#6B5E55;margin-top:6px">Para editar, marca un solo pedido</div>':''}`:''};
  }
  function lista(fil){const fin=o=>{const k=fase(o).k;return k==='ok'||k==='no'};const v=fil.slice(0,limite),ac=v.filter(o=>!fin(o)),te=v.filter(fin);
    /* terminados separados por fecha, igual que en el Motorizado */
    const dia=o=>{const t=o.entregado_en||o.cancelado_en||o.creado_en;return t?new Date(t).toLocaleDateString('en-CA',{timeZone:'America/Lima'}):''};
    const hoyK=new Date().toLocaleDateString('en-CA',{timeZone:'America/Lima'}),ayK=new Date(Date.now()-864e5).toLocaleDateString('en-CA',{timeZone:'America/Lima'});
    const tit=k=>k===hoyK?'Hoy':k===ayK?'Ayer':k?new Date(k+'T12:00:00-05:00').toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'short',timeZone:'America/Lima'}).replace('.',''):'Sin fecha';
    const grupos=[];te.forEach(o=>{const k=dia(o);let g=grupos.find(x=>x.k===k);if(!g)grupos.push(g={k,L:[]});g.L.push(o)});
    const secs=(ac.length?`<div class="oSec"><span>En curso</span><span>${ac.length} pedido${ac.length===1?'':'s'}</span></div>`+ac.map(tarjeta).join(''):'')+
      grupos.map(g=>`<div class="oSec" style="margin-top:10px"><span>${E(tit(g.k))}</span><span>${g.L.length} pedido${g.L.length===1?'':'s'}</span></div>`+g.L.map(tarjeta).join('')).join('');
    return fil.length?secs+(fil.length>limite?`<button type="button" class="b mas" data-a="mas">Ver ${Math.min(40,fil.length-limite)} más</button>`:''):`<div class="vac">${q||chip?'No hay pedidos con ese filtro.':'Todavía no hay pedidos.'}</div>`}

  /* =============== MENÚ =============== */
  function menu(){
    const m=$('pdMenu');let h='';
    const top=m&&m.querySelector('.m3Top'),nom=top?(top.querySelector('strong')||{}).textContent||'Admin':'Admin';const foto=window.__pdAdminFoto||'';
    h+=`<button type="button" class="yo" data-a="perfil"><span style="flex:1 1 0%;min-width:0"><b style="display:block;font-size:18px">${E(nom)}</b><span style="font-size:13px;color:#6B5E55">Ver mi perfil</span></span>${IC.chev}</button>`;
    h+=`<div class="fld"><label for="mQ" style="position:absolute;width:1px;height:1px;overflow:hidden">Buscar en el menú</label><input id="mQ" type="search" placeholder="Buscar en el menú" value="${E(mq)}" data-in="mq"></div>`;
    const nP=L().filter(CH[1][2]).length;
    h+=`<div class="tiles"><button type="button" data-t="inicio">${IC.box}Pedidos${nP?`<span class="bd">${nP}</span>`:''}</button><button type="button" data-t="caja">${IC.cash}Cajas</button><button type="button" data-t="sueldo">${IC.wallet}Sueldos</button></div>`;
    h+=`<div id="mG" style="display:flex;flex-direction:column;gap:10px">${grupos()}</div>`;
    h+=`<button type="button" class="b rojo" style="color:#B42318;border-color:#F4C7C3" data-a="salir">${IC.logout}Cerrar sesión</button>`;
    return {head:top2('Administración','Menú'),body:h};
  }
  function grupos(){
    const m=$('pdMenu');if(!m)return '<div class="vac">Cargando el menú…</div>';const ql=mq.trim().toLowerCase();let h='';
    m.querySelectorAll('.m3Grp').forEach((g,gi)=>{
      const tit=((g.querySelector('.m3Hd span')||{}).textContent||'').trim();
      const its=[...g.querySelectorAll('.m3It[data-txt]')].map(b=>({t:b.dataset.txt,n:((b.querySelector('span')||b).textContent||'').trim(),bd:((b.querySelector('.pdCtlBdg,.bdg')||{}).textContent||'').trim()})).filter(x=>!ql||x.n.toLowerCase().includes(ql)||tit.toLowerCase().includes(ql));
      if(!its.length)return;const ab=ql||abiertoGr===tit;const tb=its.reduce((s,x)=>s+(Number(x.bd)||0),0);
      h+=`<div class="gr${ab?' ab':''}"><button type="button" class="gh" data-g="${E(tit)}"><span class="ic">${GIC[tit]||IC.list}</span><b>${E(tit)}</b>${tb?`<span class="bd" style="position:static;border:0">${tb}</span>`:`<small>${its.length}</small>`}${IC.chev}</button>${ab?its.map(x=>`<button type="button" class="gi" data-it="${E(x.t)}" data-gk="${E(tit)}"><span>${E(x.n)}</span>${x.bd?`<span class="bd">${E(x.bd)}</span>`:''}${IC.chev}</button>`).join(''):''}</div>`});
    return h||'<div class="vac">No hay nada con ese nombre.</div>';
  }
  function hubVista(h){
    const H2=HUBS[h];if(!H2)return inicio();const ql=mq.trim().toLowerCase();let b='';
    if(h==='h:moto'){try{caja()}catch(_){}try{sueldos()}catch(_){}const t=window.__pdaCajaTotal,ts=window.__pdaSueldoTotal;void t,void ts}
    if(h==='h:mas'){const m=$('pdMenu'),top=m&&m.querySelector('.m3Top'),nom=top?(top.querySelector('strong')||{}).textContent||'Admin':'Admin',foto=window.__pdAdminFoto||'';
      b+=`<button type="button" class="yo" data-a="perfil"><span style="flex:1 1 0%;min-width:0"><b style="display:block;font-size:18px">${E(nom)}</b><span style="font-size:13px;color:#6B5E55">Ver mi perfil</span></span>${IC.chev}</button>`;
      b+=`<div class="fld"><label for="mQ" style="position:absolute;width:1px;height:1px;overflow:hidden">Buscar una opción</label><input id="mQ" type="search" placeholder="Buscar en todo el menú" value="${E(mq)}" data-in="mq"></div>`}
    b+=`<div id="mG" style="display:flex;flex-direction:column;gap:14px">${hubSecs(h)}</div>`;
    if(h==='h:mas')b+=`<button type="button" class="b" style="height:54px;font-size:16px;color:#B42318;border-color:#F4C7C3;background:#FFFFFF" data-a="salir">${IC.logout}Cerrar sesión</button>`;
    return {head:top2('Administración',H2.t),body:b};
  }
  function hubSecs(h){
    const ql=mq.trim().toLowerCase();let secs=HUBS[h].sec||[];
    if(h==='h:mas'&&ql)secs=NAVK.slice(1).flatMap(k=>HUBS[k].sec.map(([g,its])=>[g||HUBS[k].t,its]));
    let o='';
    secs.forEach(([g,its])=>{const L3=its.filter(x=>!ql||x[1].toLowerCase().includes(ql)||String(g).toLowerCase().includes(ql));if(!L3.length)return;
      o+=`<section class="hs">${g?`<div class="lbl" style="margin:0 0 6px 4px">${E(g)}</div>`:''}<div class="hl">${L3.map(([k,n,ic])=>{const at=k.startsWith('t:')?`data-t="${E(k.slice(2))}"`:k.startsWith('a:')?`data-a="${E(k.slice(2))}"`:`data-it="${E(k)}" data-gk="${E(g||HUBS[h].k||HUBS[h].t)}"`;const n2=/^[ta]:/.test(k)?0:bdOf(k);return `<button type="button" class="hi" ${at}><span class="ic">${IC[ic]||IC.list}</span><span class="tx">${E(n)}</span>${n2?`<span class="bd">${n2}</span>`:''}${IC.chev}</button>`}).join('')}</div></section>`});
    return o||'<div class="vac">No hay nada con ese nombre.</div>';
  }
  const top2=(k,t,right)=>`<div class="top"><div class="row">${HUBDE[tab]?`<button type="button" class="back2" data-a="hub" aria-label="Volver">${IC.back}</button>`:''}<div class="ttl"><div class="kick" style="color:#6B5E55">${E(k)}</div><div class="h1">${E(t)}</div></div>${right||''}</div></div>`;

  /* =============== CAJAS (rehecha) =============== */
  const D=()=>{try{return db}catch(e){return window.db}};
  const C2={};let sub=null,ignorarPop=false;
  function cargar(k,fn,force){const c=C2[k];if(c&&!force&&(c.busy||Date.now()-c.t<45000))return c;C2[k]={busy:true,t:Date.now(),data:c&&c.data,err:null};
    Promise.resolve().then(fn).then(d=>{C2[k]={t:Date.now(),data:d}},e=>{C2[k]={t:Date.now(),data:c&&c.data,err:String(e&&e.message||e)}}).finally(()=>{key='';pintar()});return C2[k]}
  const CJ={moto:null,pane:'recibir',rec:'',recNota:'',dar:'',darMot:'',darNota:'',msg:'',ok:'',lim:40,abierta:null,q:''};
  async function movsDe(motoId){const rows=[];for(let from=0;;from+=1000){let q=D().from('movimientos_caja').select('id,motorizado_id,pedido_id,tipo,monto,descripcion,creado_en,comprobante_url,revision,revision_nota,esperado,recibido,diferencia');if(motoId)q=q.eq('motorizado_id',motoId);const {data,error}=await q.order('creado_en',{ascending:false}).order('id',{ascending:false}).range(from,from+999);if(error)throw error;rows.push(...(data||[]));if(!data||data.length<1000||rows.length>=100000)break}return rows}
  function datosCaja(force){return cargar('caja',async()=>{const [mr,mv]=await Promise.all([D().from('motorizados').select('id,nombre_completo,telefono,activo').order('nombre_completo'),movsDe()]);if(mr.error)throw mr.error;const by=new Map();mv.forEach(m=>{const k=String(m.motorizado_id);if(!by.has(k))by.set(k,[]);by.get(k).push(m)});return {motos:mr.data||[],by}},force)}
  const CA=()=>window.PdCaja;
  const iniN=n=>E(String(n||'M').trim().split(/\s+/).map(w=>w[0]||'').slice(0,2).join('').toUpperCase());
  const dtl=t=>new Date(t).toLocaleString('es-PE',{timeZone:'America/Lima',day:'2-digit',month:'short',hour:'numeric',minute:'2-digit'}).replace('.','');
  const diaL=t=>new Date(t).toLocaleDateString('es-PE',{timeZone:'America/Lima',weekday:'long',day:'2-digit',month:'short'}).replace('.','');
  function caja(){
    const c=datosCaja(),P=CA();const head=top2('Control de caja','Cajas',`<button type="button" class="ib" data-a="cj:act" aria-label="Actualizar">${IC.refresh}</button>`);
    if(!c.data||!P)return {head,body:c.err?`<div class="err">${E(c.err)}</div>`:'<div class="load">Cargando las cajas…</div>'};
    const bal=m=>P.balance(c.data.by.get(String(m.id))||[]);
    const L2=c.data.motos.filter(m=>m.activo!==false||Math.abs(bal(m))>0.004);const tot=L2.reduce((s,m)=>s+bal(m),0),ab=L2.filter(m=>Math.abs(bal(m))>0.004).length;
    window.__pdaCajaTotal=tot;
    const ql=CJ.q.trim().toLowerCase();const vis=L2.filter(m=>!ql||String(m.nombre_completo||'').toLowerCase().includes(ql)||String(m.telefono||'').includes(ql)).sort((a,b)=>Math.abs(bal(b))-Math.abs(bal(a))||String(a.nombre_completo).localeCompare(String(b.nombre_completo)));
    let h=`<div class="amt"><div class="k">Saldo total en cajas</div><div class="n">${M(tot)}</div><div class="pill">${ab} de ${L2.length} con efectivo por entregar</div></div>`;
    h+=U.note('Efectivo que tiene cada motorizado: cobros, lo que le das y lo que paga. Al recibir su caja completa, empieza una nueva.');
    h+=`<div class="fld"><label for="cjQ" style="position:absolute;width:1px;height:1px;overflow:hidden">Buscar motorizado</label><input id="cjQ" type="search" placeholder="Buscar motorizado" value="${E(CJ.q)}" data-in="cjq"></div>`;
    h+=`<div id="cjL" style="display:flex;flex-direction:column;gap:10px">${cjFilas()}</div>`;
    return {head,body:h};
  }
  function cjFilas(){const c=C2.caja,P=CA();if(!c||!c.data||!P)return '';const bal=m=>P.balance(c.data.by.get(String(m.id))||[]);const L2=c.data.motos.filter(m=>m.activo!==false||Math.abs(bal(m))>0.004);const ql=CJ.q.trim().toLowerCase();const vis=L2.filter(m=>!ql||String(m.nombre_completo||'').toLowerCase().includes(ql)||String(m.telefono||'').includes(ql)).sort((a,b)=>Math.abs(bal(b))-Math.abs(bal(a))||String(a.nombre_completo).localeCompare(String(b.nombre_completo)));let h='';
    h+=vis.length?vis.map(m=>{const b=bal(m),sp=P.split(c.data.by.get(String(m.id))||[]);return `<button type="button" class="tl" data-cm="${E(m.id)}"><span class="ic" style="font-weight:800;font-size:15px">${iniN(m.nombre_completo)}</span><span class="tx"><b>${E(m.nombre_completo||'Motorizado')}</b><span>${Math.abs(b)<0.005?'Sin efectivo pendiente':b<0?'Saldo negativo':'Caja abierta'+(sp.openedAt?' desde '+E(dtl(sp.openedAt)):'')}</span></span><b style="font-size:17px;white-space:nowrap;color:${b<-0.004?'#B42318':Math.abs(b)<0.005?'#6B5E55':'#1F1A17'}">${M(b)}</b>${IC.chev}</button>`}).join(''):'<div class="vac">No hay motorizados con ese nombre.</div>';
    return h}
  const diaK=t=>new Date(t).toLocaleDateString('en-CA',{timeZone:'America/Lima'});
  const diaDe=x=>{const m=/· Día (\d{4}-\d{2}-\d{2})/.exec(String(x.descripcion||''));return m?m[1]:diaK(x.creado_en)};
  function porDias(P,cur){const g=new Map();cur.forEach(x=>{const k=diaDe(x);if(!g.has(k))g.set(k,[]);g.get(k).push(x)});
    return [...g.entries()].map(([k,L])=>({k,saldo:P.r2(P.summary(L).balance),recibido:L.some(x=>/· Día \d/.test(String(x.descripcion||''))),n:L.length})).sort((a,b)=>b.k.localeCompare(a.k))}
  const diaTxt=k=>{const d=new Date(k+'T12:00:00-05:00');const hoy=diaK(Date.now()),ay=diaK(Date.now()-864e5);return (k===hoy?'Hoy · ':k===ay?'Ayer · ':'')+d.toLocaleDateString('es-PE',{weekday:'long',day:'2-digit',month:'short',timeZone:'America/Lima'}).replace('.','')};
  function cajaMoto(){
    const c=datosCaja(),P=CA(),m=CJ.moto;if(!m||!c.data||!P)return {head:top3('Cajas','Caja'),body:'<div class="load">Cargando…</div>'};
    const all=c.data.by.get(String(m.id))||[],sp=P.split(all),s=P.summary(sp.current),bal=s.balance;
    const head=top3('Caja de',m.nombre_completo||'Motorizado',`<button type="button" class="ib" data-a="cj:uno" aria-label="Actualizar">${IC.refresh}</button>`);
    let h=`<div class="amt"><div class="k">${bal<-0.004?'Saldo negativo':'Efectivo que debe entregarte'}</div><div class="n" style="${bal<-0.004?'color:#B42318':''}">${M(bal)}</div><div class="pill">${sp.openedAt?'Caja abierta desde '+E(dtl(sp.openedAt)):'Caja nueva'}</div></div>`;
    h+=`<div class="g2"><div class="kp"><span>Cobros</span><b>${M(s.cobros)}</b></div><div class="kp"><span>Le diste</span><b>${M(s.fondos)}</b></div><div class="kp"><span>Pagos</span><b>${M(s.pagos)}</b></div><div class="kp"><span>Gastos y entregas</span><b>${M(s.gastos+s.entregas)}</b></div></div>`;
    h+=`<div class="seg" style="grid-template-columns:repeat(2,minmax(0,1fr))"><button type="button" data-cp="recibir" class="${CJ.pane==='recibir'?'on':''}">Recibir caja</button><button type="button" data-cp="dar" class="${CJ.pane==='dar'?'on':''}">Darle efectivo</button></div>`;
    let foot='';
    if(CJ.pane==='recibir'){
      if(CJ.recBal!==bal){CJ.recBal=bal;CJ.rec=bal>0.004?bal.toFixed(2):''}
      const v=P.r2(Number(String(CJ.rec).replace(',','.'))||0),d=P.r2(v-bal);
      const hint=bal<=0.004?(bal<0?'No hay efectivo por recibir: el saldo es negativo.':'No hay efectivo por recibir en esta caja.'):!(v>0)?'Si te entrega todo, la caja se cierra y empieza una nueva.':v>bal+0.004?'Es más que lo que debe entregarte ('+M(bal)+'). Revisa el monto.':Math.abs(d)<0.005?'Entrega total: la caja queda en S/ 0.00 y empieza una nueva.':'Entrega parcial: quedan '+M(bal-v)+' pendientes.';
      const DS=porDias(P,sp.current).filter(d=>Math.abs(d.saldo)>0.004||d.recibido);
      if(DS.length>1||(DS.length===1&&DS[0].k!==diaK(Date.now())))h+=`<div class="cd"><div class="lbl">Recibir por día</div><div style="font-size:14px;color:#6B5E55;line-height:1.45">Recibe solo lo de un día. Los demás días quedan como están.</div>${DS.map(d=>`<div class="mv" style="align-items:center"><span class="tx"><b style="text-transform:capitalize">${E(diaTxt(d.k))}</b><span>${d.n} movimiento${d.n===1?'':'s'}</span></span>${Math.abs(d.saldo)<0.005?`<span class="pl g">Recibido</span>`:d.saldo<0?`<b style="color:#B42318;white-space:nowrap">${M(d.saldo)}</b>`:`<button type="button" class="b o" style="height:40px;padding:0 14px;font-size:14px;white-space:nowrap" data-a="cj:dia:${d.k}">Recibir ${M(d.saldo)}</button>`}</div>`).join('')}</div>`;
      h+=`<div class="cd"><div class="fld"><label for="cjR">Monto que te entrega (S/)</label><input id="cjR" inputmode="decimal" placeholder="0.00" value="${E(CJ.rec)}" data-in="cjrec"${bal<=0.004?' disabled':''}></div>${fld2('cjRN','Observación (opcional)','cjrecn',CJ.recNota,'Ej. Entregó en efectivo / Yape')}<div style="font-size:14px;color:#6B5E55;line-height:1.45" id="cjHint">${E(hint)}</div></div>`;
      const puede=bal>0.004&&v>0&&v<=bal+0.004;const dif=bal>0.004&&v>0&&Math.abs(d)>=0.005;
      foot=`<button type="button" class="b o" style="height:54px;font-size:16px" data-a="cj:recibir"${puede?'':' disabled'}>${Math.abs(d)<0.005&&v>0?'Recibir caja completa · '+M(v):v>0&&v<bal?'Recibir entrega parcial · '+M(v):'Registrar entrega'}</button>`;
    }else{
      h+=`<div class="cd"><div class="fld"><label for="cjD">Monto que le das (S/)</label><input id="cjD" inputmode="decimal" placeholder="0.00" value="${E(CJ.dar)}" data-in="cjdar"></div><div class="fld"><label>Motivo</label><div class="chips" style="flex-wrap:wrap">${['Sencillo para vueltos','Para compra','Para encomienda','Otro'].map(x=>`<button type="button" data-mot="${E(x)}" class="${CJ.darMot===x?'on':''}">${E(x)}</button>`).join('')}</div></div>${CJ.darMot==='Otro'?fld2('cjDN','Detalle del motivo','cjdarn',CJ.darNota,'Escribe el motivo'):''}</div>`;
      foot=`<button type="button" class="b o" style="height:54px;font-size:16px" data-a="cj:dar">Darle efectivo${Number(String(CJ.dar).replace(',','.'))>0?' · '+M(Number(String(CJ.dar).replace(',','.'))):''}</button>`;
    }
    if(CJ.msg)h+=`<div class="err">${E(CJ.msg)}</div>`;if(CJ.ok)h+=`<div class="msgok">${E(CJ.ok)}</div>`;
    const cur=sp.current;let last='';
    const fila=(x,del)=>{const k=P.kind(x),a=P.amount(x),inc=x.tipo==='ingreso',rv=(x.tipo==='retiro'&&x.pedido_id&&/^PAGO DE (COMPRA|ENCOMIENDA)/i.test(String(x.descripcion||''))&&x.revision!=='rechazado')?'':String(x.revision||'');
      return `<div class="mv"><span class="ic" style="background:${inc?'#FDEBDF':'#F6EFE9'};color:${inc?'#C4410C':'#6B5E55'}">${inc?IC.cash:IC.wallet}</span><span class="tx"><b>${E(P.LABEL[k]||'Movimiento')}${rv==='pendiente'?' <span class="pl m">Por revisar</span>':rv==='rechazado'?' <span class="pl r">Rechazado</span>':rv==='aprobado'?' <span class="pl g">Aprobado</span>':''}</b><span>${E(P.clean(x))} · ${E(hora(x.creado_en))}${x.pedido_id?' · '+E(ref(x.pedido_id)):''}</span>${x.comprobante_url?`<span><a href="${E(x.comprobante_url)}" target="_blank" rel="noopener" style="color:#C4410C;font-weight:700">Ver comprobante</a>${rv==='pendiente'&&del?` · <a href="#" data-rv="aprobado:${E(x.id)}" style="color:#0F5E2E;font-weight:700">Aprobar</a> · <a href="#" data-rv="rechazado:${E(x.id)}" style="color:#B42318;font-weight:700">Rechazar</a>`:''}</span>`:''}</span><span class="am">${inc?'+':'−'} ${M(a)}</span>${del?`<button type="button" class="ib" style="width:34px;height:34px;flex:0 0 34px;color:#B42318" data-del="${E(x.id)}"${del==='c'?' data-cerrada="1"':''} aria-label="Borrar movimiento">${IC.x}</button>`:''}</div>`};
    const grp=(L2,del)=>{last='';return L2.map(x=>{const k=diaL(x.creado_en);const t=k!==last?`<div class="lbl" style="margin:10px 0 0">${E(k)}</div>`:'';last=k;return t+fila(x,del)}).join('')};
    h+=`<div class="cd"><div class="lbl">Movimientos de la caja abierta</div>${cur.length?grp(cur.slice(0,CJ.lim),true)+(cur.length>CJ.lim?`<button type="button" class="b" data-a="cj:mas">Ver ${cur.length-CJ.lim} más</button>`:''):'<div style="color:#6B5E55;font-size:15px">Sin movimientos desde la última entrega.</div>'}</div>`;
    const cl=sp.closed;
    h+=`<div class="cd"><div class="lbl">Cajas entregadas</div>${cl.length?cl.slice(0,15).map((x,i)=>{const amt=P.amount(x.closer),rs=P.kind(x.closer)==='reinicio',df=Number(x.closer.diferencia)||0,ab=CJ.abierta===i;
      return `<button type="button" class="mv" style="width:100%;background:transparent;border-left:0;border-right:0;border-top:0;text-align:left;cursor:pointer;font:inherit;color:inherit" data-cl="${i}"><span class="ic" style="background:#E9F6EE;color:#15803D">${IC.check}</span><span class="tx"><b>${rs?'Reinicio de caja':'Entregó '+M(x.closer.recibido!=null?x.closer.recibido:amt)}${df<-0.004?' <span class="pl r">Faltó '+M(-df)+'</span>':df>0.004?' <span class="pl g">Sobró '+M(df)+'</span>':''}</b><span>${E(dtl(x.closer.creado_en))} · ${x.summary.count} movimientos</span></span>${ab?IC.x:IC.chev}</button>${ab?`<div style="padding:0 0 8px">${x.movs.length?grp(x.movs,'c'):'<div style="color:#6B5E55">Sin movimientos.</div>'}</div>`:''}`}).join(''):'<div style="color:#6B5E55;font-size:15px">Todavía no te ha entregado ninguna caja.</div>'}</div>`;
    return {head,body:h,foot};
  }
  const fld2=(id,l,k,v,ph)=>`<div class="fld"><label for="${id}">${l}</label><input id="${id}" value="${E(v??'')}" data-in="${k}"${ph?` placeholder="${E(ph)}"`:''} maxlength="200"></div>`;
  const top3=(k,t,right)=>`<div class="top"><div class="row"><button type="button" class="back2" data-a="volver" aria-label="Volver">${IC.back}</button><div class="ttl"><div class="kick" style="color:#6B5E55">${E(k)}</div><div class="h1">${E(t)}</div></div>${right||''}</div></div>`;
  async function recargaMoto(){const c=C2.caja;if(!c||!c.data||!CJ.moto)return;try{c.data.by.set(String(CJ.moto.id),await movsDe(CJ.moto.id))}catch(e){CJ.msg='No se pudo actualizar: '+(e.message||e)}key='';pintar()}
  async function cajaAccion(A,el){
    const P=CA(),m=CJ.moto,c=C2.caja;if(!P||!m||!c||!c.data)return;CJ.msg='';CJ.ok='';
    const bal=P.r2(P.balance(c.data.by.get(String(m.id))||[])),nom=m.nombre_completo||'este motorizado';
    const conf=t=>pregunta(t);
    if(A==='cj:recibir'){const v=P.r2(Number(String(CJ.rec).replace(',','.'))||0),note=CJ.recNota.trim();
      if(!(v>0)||v>bal+0.004){CJ.msg='Revisa el monto.';return}
      if(/^\d+([.,]\d+)?$/.test(note)){CJ.msg='En Observación escribiste solo un número. Si es lo que te entrega, escríbelo en «Monto que te entrega».';return}
      const total=Math.abs(v-bal)<0.005;
      if(!(await conf((total?'¿Recibir la caja completa de ':'¿Registrar entrega parcial de ')+nom+' por '+M(v)+'?')))return;
      const q=await D().from('movimientos_caja').insert(Object.assign({motorizado_id:m.id,tipo:'retiro',monto:v,descripcion:(total?'LIQUIDACIÓN DE CAJA':'ENTREGA PARCIAL DE CAJA')+(note?' · '+note:'')},total?{esperado:bal,recibido:v,diferencia:0}:{})).select('id');
      if(q.error||!q.data||!q.data.length){CJ.msg='No se pudo registrar: '+(q.error?q.error.message:'Supabase no confirmó el registro.');return}
      CJ.rec='';CJ.recNota='';await recargaMoto();CJ.ok=total?'Caja recibida. Empieza una caja nueva.':'Entrega parcial registrada.';return}
    if(A.startsWith('cj:dia:')){const k=A.slice(7),D2=porDias(P,P.split(c.data.by.get(String(m.id))||[]).current).find(d=>d.k===k);if(!D2||!(D2.saldo>0.004)){CJ.msg='Ese día no tiene efectivo por recibir.';return}
      /* Si es el día más antiguo de la caja, se cierra la caja de ESE día (con la hora de su último movimiento):
         los movimientos de los días siguientes quedan en la caja abierta. Si no, queda como entrega parcial. */
      const curL=P.split(c.data.by.get(String(m.id))||[]).current,diasOrd=[...new Set(curL.map(diaDe))].sort(),masAntiguo=diasOrd[0]===k;
      const delDia=curL.filter(x=>diaDe(x)===k),ultimo=delDia.reduce((t,x)=>{const d=new Date(x.creado_en||x.created_at||0).getTime();return d>t?d:t},0);
      const cierra=masAntiguo&&ultimo>0,total=cierra||Math.abs(v-bal)<0.005;
      if(!(await conf('¿Recibir la caja del '+diaTxt(k).replace(/^(Hoy|Ayer) · /,'')+' de '+nom+' por '+M(v)+'?\nLos demás días quedan como están.')))return;
      const q=await D().from('movimientos_caja').insert(Object.assign({motorizado_id:m.id,tipo:'retiro',monto:v,descripcion:(total?'LIQUIDACIÓN DE CAJA':'ENTREGA PARCIAL DE CAJA')+' · Día '+k},total?{esperado:v,recibido:v,diferencia:0}:{},cierra?{creado_en:new Date(ultimo+1).toISOString()}:{})).select('id');
      if(q.error||!q.data||!q.data.length){CJ.msg='No se pudo registrar: '+(q.error?q.error.message:'Supabase no confirmó el registro.');return}
      CJ.rec='';await recargaMoto();CJ.ok='Caja del '+diaTxt(k).replace(/^(Hoy|Ayer) · /,'')+' recibida · '+M(v)+'.'+(total?' La caja queda en S/ 0.00.':'');return}
    if(A==='cj:dif'){const v=P.r2(Number(String(CJ.rec).replace(',','.'))||0),d=P.r2(v-bal);if(!(v>0)||Math.abs(d)<0.005)return;
      if(!(await conf('¿Cerrar la caja de '+nom+'?\nEl sistema esperaba '+M(bal)+' y te entregó '+M(v)+'. '+(d<0?'Faltan ':'Sobran ')+M(Math.abs(d))+'. La caja queda en S/ 0.00 y empieza una nueva.')))return;
      const note=CJ.recNota.trim();
      const q=await D().from('movimientos_caja').insert({motorizado_id:m.id,tipo:'retiro',monto:bal>0?bal:v,descripcion:'LIQUIDACIÓN DE CAJA · '+(d<0?'faltante ':'sobrante ')+M(Math.abs(d))+(note?' · '+note:''),esperado:bal,recibido:v,diferencia:d}).select('id');
      if(q.error||!q.data||!q.data.length){CJ.msg='No se pudo registrar: '+(q.error?q.error.message:'Supabase no confirmó el registro.');return}
      if(d<0&&window.PdSueldo&&(await conf('¿Descontar el faltante de '+M(-d)+' del sueldo de '+nom+'?'))){const S=window.PdSueldo,f=S.todayIso();const r=await D().from('control_sueldos').insert({motorizado_id:m.id,fecha:f,tipo:'descuento',monto:P.r2(-d),descripcion:'Descuento faltante de caja',periodo:S.periodOf(f).key});if(r.error)(window.pdAviso||alert)('La caja se cerró, pero no se pudo crear el descuento: '+r.error.message)}
      CJ.rec='';CJ.recNota='';await recargaMoto();CJ.ok='Caja cerrada con '+(d<0?'faltante':'sobrante')+' de '+M(Math.abs(d))+'.';return}
    if(A==='cj:dar'){const v=P.r2(Number(String(CJ.dar).replace(',','.'))||0),note=(CJ.darMot==='Otro'?CJ.darNota:CJ.darMot).trim();
      if(!(v>0)){CJ.msg='Escribe el monto que le das.';return}if(!note){CJ.msg='Elige o escribe el motivo.';return}
      const q=await D().from('movimientos_caja').insert({motorizado_id:m.id,tipo:'ingreso',monto:v,descripcion:'INGRESO DE ADMINISTRADOR · '+note});
      if(q.error){CJ.msg='No se pudo registrar: '+q.error.message;return}
      CJ.dar='';CJ.darMot='';CJ.darNota='';await recargaMoto();CJ.ok='Se agregaron '+M(v)+' a su caja.';return}
  }
  async function cajaBorrar(id,cerrada){const q0=cerrada?'Esta caja ya se cerró: al borrar el movimiento cambia lo que debía entregar en esa caja.\n¿Por qué lo borras? (ej. monto mal escrito)':'¿Por qué borras este movimiento? (ej. monto mal escrito)';const mt=await pedirL(q0);if(mt===null)return;if(!String(mt).trim()){(window.pdAviso||alert)('Escribe un motivo para borrar el movimiento.');return}
    const q=await D().from('movimientos_caja').delete().eq('id',id).eq('motorizado_id',CJ.moto.id).select('id');if(q.error||!q.data||!q.data.length){CJ.msg='No se pudo borrar: '+(q.error?q.error.message:'revisa el permiso de borrar.');key='';pintar();return}
    console.info('[Caja] Movimiento borrado',id,'motivo:',String(mt).trim());await recargaMoto();CJ.ok='Movimiento borrado.'}
  async function cajaRevision(v){const [st,id]=v.split(':');let upd;
    if(st==='aprobado')upd={revision:'aprobado',revisado_en:new Date().toISOString(),revision_nota:null};
    else{const n=await pedirL('¿Por qué lo rechazas? (el motorizado lo verá):\nMotivo:','');if(n===null)return;upd={revision:'rechazado',revisado_en:new Date().toISOString(),revision_nota:String(n).trim()||'Sin comprobante válido'}}
    const q=await D().from('movimientos_caja').update(upd).eq('id',id);if(q.error){CJ.msg='No se pudo guardar: '+q.error.message;key='';pintar();return}
    await recargaMoto();CJ.ok=st==='aprobado'?'Pago aprobado.':'Pago rechazado: ya no se descuenta de su caja.'}

  /* =============== SUELDOS (rehecha) =============== */
  const SL={moto:null,per:'',monto:'',nota:'',msg:'',ok:'',q:'',pest:'',modo:'pago',vista:null,dia:null,bol:'',hist:null,f:{},cfg:null};
  function datosSueldo(force){return cargar('sueldo',async()=>{const [mr,cr]=await Promise.all([D().from('motorizados').select('*').order('nombre_completo'),D().from('control_sueldos').select('*').order('fecha',{ascending:true}).limit(20000)]);if(mr.error)throw mr.error;if(cr.error)throw cr.error;const by=new Map();(cr.data||[]).forEach(r=>{const k=String(r.motorizado_id);if(!by.has(k))by.set(k,[]);by.get(k).push(r)});return {motos:(mr.data||[]).filter(m=>m.activo!==false),by}},force)}
  function calcS(m){const S2=window.PdSueldo,c=C2.sueldo;if(!S2||!c||!c.data)return null;try{return S2.calc(m,c.data.by.get(String(m.id))||[])}catch(e){return null}}
  const pend=r=>r&&r.ok?(r.periods||[]).reduce((s,p)=>s+Math.max(0,p.balance||0),0):0;
  function sueldos(){
    const c=datosSueldo(),S2=window.PdSueldo;const head=top2('Pagos a motorizados','Sueldos',`<button type="button" class="ib" data-a="sl:act" aria-label="Actualizar">${IC.refresh}</button>`);
    if(!c.data||!S2)return {head,body:c.err?`<div class="err">${E(c.err)}</div>`:'<div class="load">Cargando los sueldos…</div>'};
    const R=c.data.motos.map(m=>({m,r:calcS(m)}));const tot=R.reduce((s,x)=>s+pend(x.r),0),con=R.filter(x=>pend(x.r)>0.004).length,sin=R.filter(x=>!x.r||!x.r.ok).length;
    window.__pdaSueldoTotal=tot;
    let h=`<div class="amt"><div class="k">Sueldos pendientes</div><div class="n">${M(tot)}</div><div class="pill">${con} de ${R.length} por pagar${sin?' · '+sin+' sin configurar':''}</div></div>`;
    h+=U.note('Los días se suman solos al terminar cada jornada. Para ver su calendario, marcar faltas, dar adelantos o cambiar el horario, entra al motorizado.');
    h+=`<div class="fld"><label for="slQ" style="position:absolute;width:1px;height:1px;overflow:hidden">Buscar motorizado</label><input id="slQ" type="search" placeholder="Buscar motorizado" value="${E(SL.q)}" data-in="slq"></div><div id="slL" style="display:flex;flex-direction:column;gap:10px">${slFilas()}</div>`;
    return {head,body:h};
  }
  function slFilas(){const c=C2.sueldo;if(!c||!c.data)return '';const ql=SL.q.trim().toLowerCase();
    return c.data.motos.map(m=>({m,r:calcS(m)})).filter(x=>!ql||String(x.m.nombre_completo||'').toLowerCase().includes(ql)).sort((a,b)=>pend(b.r)-pend(a.r)||String(a.m.nombre_completo).localeCompare(String(b.m.nombre_completo))).map(({m,r})=>{const p=pend(r);
      return `<button type="button" class="tl" data-sm="${E(m.id)}"><span class="ic" style="font-weight:800;font-size:15px">${iniN(m.nombre_completo)}</span><span class="tx"><b>${E(m.nombre_completo||'Motorizado')}</b><span>${!r||!r.ok?'Sin configurar':p>0.004?'Por pagar':'Al día'}</span></span><b style="font-size:17px;white-space:nowrap;color:${!r||!r.ok||p<0.005?'#6B5E55':'#1F1A17'}">${!r||!r.ok?'—':M(p)}</b>${IC.chev}</button>`}).join('')||'<div class="vac">No hay motorizados con ese nombre.</div>'}
  /* =============== SUELDO DE UN MOTORIZADO (todo nativo: calendario, asistencia, pagos, descuentos, préstamos, cierre) =============== */
  const r2s=n=>Math.round((Number(n)||0)*100)/100;
  const numv=v=>Number(String(v??'').replace(',','.'));
  const fDs=i=>{try{return window.PdSueldo.parse(i).toLocaleDateString('es-PE',{day:'2-digit',month:'short'}).replace('.','')}catch(e){return i}};
  const capS=s=>String(s||'').charAt(0).toUpperCase()+String(s||'').slice(1);
  const confS=t=>pregunta(t);
  const hmS=t=>{const [a,b]=String(t||'').split(':').map(Number);return (a||0)*60+(b||0)};
  const DS=['lunes','martes','miercoles','jueves','viernes','sabado','domingo'],DSC={lunes:'Lun',martes:'Mar',miercoles:'Mié',jueves:'Jue',viernes:'Vie',sabado:'Sáb',domingo:'Dom'};
  const tipoS=x=>String(x&&x.tipo||'').toLowerCase();
  const slRows=()=>{const c=C2.sueldo;return (c&&c.data&&SL.moto&&c.data.by.get(String(SL.moto.id)))||[]};
  const muted=t=>`<div style="color:#6B5E55;font-size:15px">${t}</div>`;
  const avisos=()=>(SL.msg?`<div class="err">${E(SL.msg)}</div>`:'')+(SL.ok?`<div class="msgok">${E(SL.ok)}</div>`:'');
  function slx(force){const m=SL.moto;if(!m)return {};const id=String(m.id);return cargar('slx:'+id,async()=>{
    const r=calcS(m),P=r&&r.current,cfg=r&&r.cfg;
    const q=async p=>{try{const x=await p;return x&&!x.error?x.data:null}catch(e){return null}};
    const [c,p,j,a,t]=await Promise.all([
      q(D().from('quincenas_cerradas').select('*').eq('motorizado_id',id).order('inicio',{ascending:false})),
      q(D().from('prestamos').select('*').eq('motorizado_id',id).order('creado_en',{ascending:false})),
      q(D().from('justificaciones').select('*').eq('motorizado_id',id).order('fecha',{ascending:false}).limit(30)),
      q(D().from('asistencia_revisada').select('*').eq('motorizado_id',id)),
      q(D().from('ajustes_pidemas').select('valor').eq('clave','tardanza').maybeSingle())]);
    let gps=[];if(P&&P.start&&cfg&&cfg.ok&&!cfg.hourly){const g=await q(D().rpc('asistencia_gps',{p_moto:id,p_desde:P.start,p_hasta:P.end}));if(Array.isArray(g))gps=g}
    return {cierres:c||[],prestamos:p||[],justif:j||[],rev:a||[],tard:Object.assign({tolerancia:10,cada:15,monto:2},t&&t.valor||{}),gps,ctl:c!==null,pres:p!==null};
  },force)}
  const esperaS=k=>new Promise(res=>{const t=setInterval(()=>{if(!C2[k]||!C2[k].busy){clearInterval(t);res()}},120)});
  async function slRe(soloX){const id=String(SL.moto.id);
    if(!soloX){datosSueldo(true);await esperaS('sueldo');const n=C2.sueldo&&C2.sueldo.data&&C2.sueldo.data.motos.find(x=>String(x.id)===id);if(n)SL.moto=n}
    slx(true);await esperaS('slx:'+id);key='';pintar()}
  async function insS(row){const q=await D().from('control_sueldos').insert(row);if(q.error)throw q.error}
  async function delS(tabla,id){const q=await D().from(tabla).delete().eq('id',id);if(q.error)throw new Error(q.error.message+'. Revisa el permiso de borrar.')}
  function abrirV(v){SL.vista=v;SL.msg='';SL.ok='';try{history.pushState({pdApp:1,slv:1},'')}catch(_){}}
  function cerrarV(){SL.vista=null;if(history.state&&history.state.slv){ignorarPop=true;history.back()}}

  function sueldoMoto(){
    const m=SL.moto,S2=window.PdSueldo;
    if(SL.vista&&m&&S2&&C2.sueldo&&C2.sueldo.data){const v=slVista();if(v)return v}
    const r=m&&calcS(m);
    const head=top3('Sueldo de',m?m.nombre_completo||'Motorizado':'Motorizado',`<button type="button" class="ib" data-a="sl:act" aria-label="Actualizar">${IC.refresh}</button>`);
    if(!m||!S2||!C2.sueldo||!C2.sueldo.data)return {head,body:'<div class="load">Cargando…</div>'};
    slx();
    if(!SL.pest)SL.pest=r&&r.ok?'resumen':'ajustes';
    const T=[['resumen','Resumen'],['asis','Asistencia'],['pagos','Pagos'],['ajustes','Ajustes']];
    let h=`<div class="seg" role="tablist" style="grid-template-columns:repeat(4,minmax(0,1fr))">${T.map(t=>`<button type="button" role="tab" aria-selected="${SL.pest===t[0]}" class="${SL.pest===t[0]?'on':''}" data-sx="pest:${t[0]}">${t[1]}</button>`).join('')}</div>`+avisos();
    let foot='';
    if(SL.pest==='ajustes')h+=slAjustes(r);
    else if(!r||!r.ok)h+=`<div class="amt"><div class="k">Sueldo</div><div class="n" style="font-size:30px">Sin configurar</div><div class="pill">Falta: ${E(((r&&r.cfg&&r.cfg.missing)||['ingreso, horario y días']).join(', '))}</div></div><button type="button" class="b o" data-sx="pest:ajustes">Completar la configuración</button>`;
    else if(SL.pest==='asis')h+=r.hourly?slJornadas(r):slAsis(r);
    else if(SL.pest==='pagos'){const x=slPagos(r);h+=x.h;foot=x.foot}
    else h+=slResumen(r);
    return {head,body:h,foot};
  }
  const liS=(l,s,v,st)=>`<div class="li"><span>${l}${s?`<small style="display:block;font-size:13px;color:#6B5E55;font-weight:500">${s}</small>`:''}</span><b${st?` style="${st}"`:''}>${v}</b></div>`;
  function slResumen(r){
    const S2=window.PdSueldo,P=r.current,x=slx().data;
    const gas=r.hourly?r2s(P.gasTotal):r2s(P.gasDays*S2.GAS),dias=P.worked+P.adj+P.rest;
    let h=`<div class="amt"><div class="k">${E(capS(P.label))}</div><div class="n">${M(Math.max(0,P.balance))}</div><div class="pill">${P.balance<-0.004?'Adelantado '+M(-P.balance):'Pendiente de esta quincena'}</div></div>`;
    if(r.previousDue>0.004)h+=`<div class="err">Quincenas anteriores sin pagar: ${M(r.previousDue)}</div>`;
    const st=r.hourly?[['Jornadas',P.worked],['Horas',P.hours],['Gasolina',M(P.gasTotal)],['Pagado',M(P.paid)]]:[['Trabajados',P.worked+P.adj],['Descansos',P.rest],['Días con gasolina',P.gasDays],['Faltas',P.faltas]];
    h+=`<div class="cols2">${st.map(s=>`<div class="kp"><span>${s[0]}</span><b>${E(s[1])}</b></div>`).join('')}</div>`;
    if(!r.hourly){const cal=U.calSueldo(P,slRows());if(cal)h+=`<div class="cd"><div class="lbl">Calendario de la quincena</div>${cal}</div>`}
    const g=new Map();(P.descRows||[]).forEach(y=>{const d=String(y.descripcion||'Descuento').replace(/^Descuento\s+/i,'').replace(/\s*·.*$/,'');const k=/AFP|ONP/i.test(d)?'AFP/ONP':/^cuota/i.test(d)?'cuota de préstamo':/^tardanza/i.test(d)?'tardanzas':/faltante/i.test(d)?'faltante de caja':d;g.set(k,(g.get(k)||0)+(Number(y.monto)||0))});
    h+=`<div class="cd"><div class="lbl">Detalle de la quincena</div>${liS('Sueldo',r.hourly?`${P.worked} jornada${P.worked===1?'':'s'} · ${P.hours} h`:`${dias} día${dias===1?'':'s'} pagado${dias===1?'':'s'}`,M(P.earned-gas))}${liS('Gasolina',r.hourly?P.hours+' h trabajadas':`${P.gasDays} día${P.gasDays===1?'':'s'} × ${M(S2.GAS)}`,M(gas))}${liS('Ganado','',M(P.earned))}${[...g].map(([k,v])=>liS('Descuento '+E(k),'','− '+M(v),'color:#B42318')).join('')}${liS('Ya pagado','','− '+M(P.paid))}<div class="li" style="border-top:1px solid #F1E4DA;padding-top:8px"><span>Pendiente</span><b style="font-size:18px">${M(Math.max(0,P.balance))}</b></div></div>`;
    if(P.needsDesc&&!P.descSet)h+=`<div class="err">Falta el descuento AFP/ONP de fin de mes. Regístralo en «Pagos» antes de pagar.</div>`;
    h+=U.note(r.hourly?'Solo se suman las jornadas que registras en «Asistencia».':`Cada jornada se suma sola ${E(r.endAt)} (hora de salida). Mes de 30 días${P.start>=S2.FIXED_FROM?' · sueldo fijo S/ 480.38 por quincena'+(P.gasAdj>0?' (incluye ajuste de gasolina '+M(P.gasAdj)+')':''):''}.`);
    if(x&&x.ctl){const cie=k=>x.cierres.find(c=>c.periodo===k);const L2=(r.periods||[]).filter(p=>p.earned>0.004||p.paid>0.004||cie(p.key)).slice(0,4);
      h+=`<div class="cd"><div class="lbl">Cierre de quincena y boletas</div>${L2.length?L2.map(p=>{const q=cie(p.key),pd=q?Math.max(0,r2s(q.ganado-q.descuentos-p.paid)):Math.max(0,p.balance);
        return `<div class="mv" style="flex-wrap:wrap"><span class="tx" style="flex:1 1 0%;min-width:0"><b>${E(capS(p.label))}</b><span>Ganado ${M(q?q.ganado:p.earned)} · desc. ${M(q?q.descuentos:p.desc)} · pagado ${M(p.paid)} · pendiente ${M(pd)}</span></span>${q?(q.recibido_conforme_en?'<span class="pl g">Cerrada · conforme</span>':'<span class="pl m">Falta su conforme</span>'):'<span class="pl n">Abierta</span>'}${q?`<div class="btns b2" style="width:100%"><button type="button" class="b" data-sx="boleta:${E(p.key)}">Ver boleta</button><button type="button" class="b rojo" data-sx="reabrir:${E(p.key)}">Reabrir</button></div>`:`<button type="button" class="b" style="width:100%" data-sx="cerrar:${E(p.key)}">Cerrar quincena</button>`}</div>`}).join(''):muted('Aún no hay quincenas con sueldo.')}<div style="font-size:14px;color:#6B5E55">Al cerrar, los días, faltas y descuentos quedan congelados (se pueden seguir registrando pagos). El motorizado ve su boleta y toca «Recibí conforme».</div><button type="button" class="b" data-sx="hist">${IC.list}Historial de cambios</button></div>`}
    const hist=(r.periods||[]).filter(p=>!p.isCurrent);
    if(hist.length)h+=`<div class="cd"><div class="lbl">Quincenas anteriores</div>${hist.map(p=>`<div class="mv" style="flex-wrap:wrap"><span class="tx" style="flex:1 1 0%;min-width:0"><b>${E(capS(p.label))}</b><span>${r.hourly?p.worked+' jornadas · '+p.hours+' h':(p.worked+p.adj)+' trabajados · '+p.rest+' descansos · '+p.faltas+' faltas'} · ganado ${M(p.earned)} · pagado ${M(p.paid)}</span></span>${p.balance>0.004?`<button type="button" class="b o" style="width:auto;padding:0 14px;height:40px" data-sx="pagarper:${E(p.key)}">Pagar ${M(p.balance)}</button>`:'<span class="pl g">Pagado</span>'}</div>`).join('')}</div>`;
    return h;
  }
  function offDias(){const f=SL.f,S2=window.PdSueldo,a=f.oa,b=f.ob||a;if(!a||b<a)return [];const out=[];for(let d=S2.parse(a);S2.iso(d)<=b&&out.length<400;d.setDate(d.getDate()+1))out.push(S2.iso(d));return out}
  function offInfo(){const L2=offDias();if(!L2.length)return 'Elige desde qué día y hasta qué día.';const S2=window.PdSueldo,cfg=S2.config(SL.moto||{});const pay=L2.filter(di=>{const d=S2.parse(di);return d.getDate()!==31&&(cfg.days.includes(S2.KEYS[d.getDay()])||d.getDay()===0)}).length;
    return SL.f.vp==='sin'?`${L2.length} día${L2.length===1?'':'s'} sin pago${pay!==L2.length?' ('+pay+' eran días pagados)':''}: se descuentan del sueldo.`:`${L2.length} día${L2.length===1?'':'s'} de ${String(SL.f.vt||'vacaciones').toLowerCase()} pagado${L2.length===1?'':'s'}: se pagan como días normales.`}
  const esVac=y=>/^(vacaciones|permiso)/i.test(String(y.descripcion||''));
  function slAsis(r){
    const S2=window.PdSueldo,P=r.current,rows=slRows(),f=SL.f,x=slx().data,days=P.days||[],hoy=S2.todayIso();
    const enP=y=>{const k=String(y.fecha||'').slice(0,10);return k>=P.start&&k<=P.end};
    const vacD=new Set(rows.filter(y=>esVac(y)&&(tipoS(y)==='falta'||tipoS(y)==='jornada')).map(y=>String(y.fecha).slice(0,10)));
    if(!f.ff)f.ff=hoy;if(!f.vt)f.vt='Vacaciones';if(!f.vp)f.vp='pagado';
    let h=U.note('El calendario está en «Resumen». Aquí registras faltas, días adelantados, vacaciones y permisos.');
    const fal=rows.filter(y=>tipoS(y)==='falta'&&enP(y)&&!esVac(y)).sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)));
    h+=`<div class="cd"><div class="lbl">Faltas</div><div class="fld"><label for="slFf">Día</label><input id="slFf" type="date" value="${E(f.ff)}" min="${E(P.start)}" max="${E(P.end)}" data-in="sx:ff"></div><div class="fld"><label for="slDf">Motivo (opcional)</label><input id="slDf" maxlength="200" value="${E(f.dmot||'')}" data-in="sx:dmot" placeholder="Ej. No se presentó"></div><div style="font-size:14px;color:#6B5E55">Ese día no se pagará.</div><button type="button" class="b rojo" data-sx="falta">Registrar falta</button>${fal.length?`<div class="lbl" style="margin-top:4px">Faltas de esta quincena</div>`+fal.map(y=>`<div class="mv"><span class="tx" style="flex:1 1 0%;min-width:0"><b>${E(capS(S2.parse(y.fecha).toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'short'}).replace('.','')))}</b><span>${E(y.descripcion||'Falta')}</span></span><button type="button" class="b" style="width:auto;padding:0 14px;height:40px" data-sx="delreg:${E(y.id)}">Quitar</button></div>`).join(''):''}</div>`;
    const prox=days.filter(d=>!d.adjDay&&(d.work||d.rest)&&(d.status==='hoy'||d.status==='futuro')&&!d.adel&&!vacD.has(d.date));
    const adl=days.filter(d=>d.adel);
    if(!prox.some(d=>d.date===f.ad))f.ad=prox[0]?prox[0].date:'';
    h+=`<div class="cd"><div class="lbl">Adelantar día trabajado</div><div style="font-size:14px;color:#6B5E55">El día se cuenta como trabajado desde ahora (sin esperar la hora de salida) y se suma a esta quincena.</div>${prox.length?`<div class="chips" style="flex-wrap:wrap">${prox.map(d=>`<button type="button" class="${f.ad===d.date?'on':''}" aria-pressed="${f.ad===d.date}" data-sx="ad:${d.date}">${E(DSC[d.dow]||'')} ${S2.parse(d.date).getDate()}</button>`).join('')}</div><button type="button" class="b o" data-sx="dadel">Adelantar ${E(f.ad?fDs(f.ad):'')}</button>`:muted('No quedan días por adelantar en esta quincena.')}${adl.length?`<div class="lbl" style="margin-top:4px">Días adelantados</div>`+adl.map(d=>`<div class="mv"><span class="tx" style="flex:1 1 0%;min-width:0"><b>${E(capS(S2.parse(d.date).toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'short'}).replace('.','')))}</b><span>Cuenta como trabajado</span></span><button type="button" class="b" style="width:auto;padding:0 14px;height:40px" data-sx="delreg:${E(d.adel.id)}">Quitar</button></div>`).join(''):''}</div>`;
    const vl=rows.filter(y=>esVac(y)&&(tipoS(y)==='falta'||tipoS(y)==='jornada')&&String(y.fecha).slice(0,10)>=P.start).sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)));
    h+=`<div class="cd"><div class="lbl">Vacaciones y permisos</div><div class="seg" style="grid-template-columns:1fr 1fr"><button type="button" class="${f.vt==='Vacaciones'?'on':''}" data-sx="vt:Vacaciones">Vacaciones</button><button type="button" class="${f.vt==='Permiso'?'on':''}" data-sx="vt:Permiso">Permiso</button></div><div class="seg" style="grid-template-columns:1fr 1fr"><button type="button" class="${f.vp==='pagado'?'on':''}" data-sx="vp:pagado">Pagado</button><button type="button" class="${f.vp==='sin'?'on':''}" data-sx="vp:sin">Sin pago</button></div><div class="two"><div class="fld"><label for="slOa">Desde</label><input id="slOa" type="date" value="${E(f.oa||'')}" data-in="sx:oa"></div><div class="fld"><label for="slOb">Hasta</label><input id="slOb" type="date" value="${E(f.ob||'')}" data-in="sx:ob"></div></div><div class="fld"><label for="slOw">Motivo (opcional)</label><input id="slOw" maxlength="200" value="${E(f.ow||'')}" data-in="sx:ow" placeholder="Ej. Viaje familiar"></div><div id="slOi" style="font-size:14px;color:#6B5E55">${E(offInfo())}</div><div class="btns b2"><button type="button" class="b o" data-sx="offsi">Registrar</button><button type="button" class="b" data-sx="offno">Quitar fechas</button></div>${vl.length?`<div class="lbl" style="margin-top:4px">Registrados</div>`+vl.map(y=>`<div class="mv"><span class="tx" style="flex:1 1 0%;min-width:0"><b>${E(fDs(y.fecha))} · ${/^vacaciones/i.test(String(y.descripcion||''))?'Vacaciones':'Permiso'}</b><span>${tipoS(y)==='jornada'?'Pagado':'Sin pago'}${String(y.descripcion||'').includes('·')?' · '+E(String(y.descripcion).split('·').slice(1).join('·').trim()):''}</span></span><button type="button" class="ib" data-sx="delreg:${E(y.id)}" aria-label="Quitar">${IC.trash}</button></div>`).join(''):''}</div>`;
    if(x){const cfg=r.cfg,start=cfg.times.start,end=cfg.times.end,t=x.tard;const g=new Map(x.gps.map(y=>[String(y.fecha).slice(0,10),y])),rv=new Map(x.rev.map(y=>[String(y.fecha).slice(0,10),y]));
      const dl=days.filter(d=>!d.adjDay&&d.work&&(d.status==='trabajado'||d.status==='hoy')&&!vacD.has(d.date)).reverse();
      const fil=dl.map(d=>{const y=g.get(d.date),rr=rv.get(d.date);let est,acc='';
        if(!y){est=d.status==='hoy'?'<span class="pl n">Aún sin conexión</span>':'<span class="pl r">Sin conexión GPS</span>';if(d.status!=='hoy'&&!rr)acc=`<button type="button" class="b rojo" data-sx="gfalta:${d.date}">Marcar falta</button><button type="button" class="b" data-sx="perdonar:${d.date}">Sí estuvo</button>`}
        else{const tarde=Math.max(0,hmS(y.primera)-start-(Number(t.tolerancia)||0));est=tarde>0?`<span class="pl m">Tarde ${tarde} min</span>`:'<span class="pl g">A tiempo</span>';if(tarde>0&&!rr){const mo=r2s(Math.ceil(tarde/(Number(t.cada)||15))*(Number(t.monto)||0));acc=`<button type="button" class="b o" data-sx="tard:${d.date}:${tarde}:${mo}">Descontar ${M(mo)}</button><button type="button" class="b" data-sx="perdonar:${d.date}">Perdonar</button>`}}
        if(rr){acc='';est=`<span class="pl ${rr.decision==='perdonado'?'g':'r'}">${rr.decision==='perdonado'?'Perdonado':rr.decision==='falta'?'Falta registrada':'Tardanza descontada'}</span>`}
        return `<div class="mv" style="flex-wrap:wrap"><span class="tx" style="flex:1 1 0%;min-width:0"><b>${E(fDs(d.date))} · ${E(d.label)}</b><span>Entró ${E(y?String(y.primera).slice(0,5):'—')} · salió ${E(y?String(y.ultima).slice(0,5):'—')}</span></span>${est}${acc?`<div class="btns b2" style="width:100%">${acc}</div>`:''}</div>`}).join('');
      h+=`<div class="cd"><div class="lbl">Puntualidad por GPS</div><div style="font-size:14px;color:#6B5E55">Según la primera conexión de su app cada día. Horario ${E(S2.fmtTime(start))} – ${E(S2.fmtTime(end))} · tolerancia ${Number(t.tolerancia)||0} min · se descuenta ${M(t.monto)} por cada ${Number(t.cada)||15} min de retraso.</div>${fil||muted('Todavía no hay días trabajados en esta quincena.')}<button type="button" class="b" data-sx="vtard">Configurar tardanzas</button></div>`;
      if(x.justif.length)h+=`<div class="cd"><div class="lbl">Justificaciones enviadas</div>${x.justif.slice(0,6).map(j=>`<div class="mv" style="flex-wrap:wrap"><span class="tx" style="flex:1 1 0%;min-width:0"><b>${E(fDs(String(j.fecha).slice(0,10)))}</b><span>${E(j.motivo||'')}</span></span>${j.visto_en?'<span class="pl g">Visto</span>':''}${j.foto_url||!j.visto_en?`<div class="btns${j.foto_url&&!j.visto_en?' b2':''}" style="width:100%">${j.foto_url?`<a class="b" href="${E(j.foto_url)}" target="_blank" rel="noopener">Ver justificante</a>`:''}${j.visto_en?'':`<button type="button" class="b" data-sx="visto:${E(j.id)}">Marcar como visto</button>`}</div>`:''}</div>`).join('')}<div style="font-size:14px;color:#6B5E55">Las faltas se descuentan igual; la justificación queda como registro.</div></div>`;
    }
    return h;
  }
  function slJornadas(r){
    const S2=window.PdSueldo,f=SL.f;if(!f.shf)f.shf=S2.todayIso();
    const tot=(numv(f.shp)||0)+(numv(f.shg)||0);
    let h=`<div class="cd"><div class="lbl">Registrar jornada (por horas)</div><div class="two"><div class="fld"><label for="slShf">Fecha</label><input id="slShf" type="date" max="${S2.todayIso()}" value="${E(f.shf)}" data-in="sx:shf"></div><div class="fld"><label for="slShh">Horas</label><input id="slShh" inputmode="decimal" value="${E(f.shh||'')}" data-in="sx:shh" placeholder="0"></div></div><div class="two"><div class="fld"><label for="slShp">Sueldo (S/)</label><input id="slShp" inputmode="decimal" value="${E(f.shp||'')}" data-in="sx:shp" placeholder="0.00"></div><div class="fld"><label for="slShg">Gasolina (S/)</label><input id="slShg" inputmode="decimal" value="${E(f.shg||'')}" data-in="sx:shg" placeholder="0.00"></div></div><div class="li"><span>Total de la jornada</span><b id="slSht">${M(tot)}</b></div><button type="button" class="b o" data-sx="jor">Registrar jornada</button></div>`;
    const L2=slRows().filter(y=>tipoS(y)==='jornada').sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))).slice(0,20);
    h+=`<div class="cd"><div class="lbl">Jornadas registradas</div>${L2.length?L2.map(y=>{const s=S2.shift(y);return `<div class="mv"><span class="tx" style="flex:1 1 0%;min-width:0"><b>${E(fDs(y.fecha))} · ${s.horas} h · ${M(s.sueldo+s.gas)}</b><span>Sueldo ${M(s.sueldo)} · gasolina ${M(s.gas)}</span></span><button type="button" class="ib" data-sx="deljor:${E(y.id)}" aria-label="Anular jornada">${IC.trash}</button></div>`}).join(''):muted('Aún no hay jornadas registradas.')}</div>`;
    return h;
  }
  const afpRows=p=>(p&&p.descRows||[]).filter(y=>/AFP|ONP/i.test(String(y.descripcion||'')));
  function slPagos(r){
    const S2=window.PdSueldo,f=SL.f,rows=slRows(),x=slx().data;let foot='';
    let h=`<div class="seg" style="grid-template-columns:1fr 1fr"><button type="button" class="${SL.modo==='pago'?'on':''}" data-sx="modo:pago">Pago de quincena</button><button type="button" class="${SL.modo==='adelanto'?'on':''}" data-sx="modo:adelanto">Adelanto</button></div>`;
    const mv=numv(SL.monto);
    if(SL.modo==='adelanto'){
      const cur=S2.periodOf(S2.todayIso()),d=S2.parse(cur.end);d.setDate(d.getDate()+1);const nx=S2.periodOf(S2.iso(d));
      const opts=[cur,nx].map((p,i)=>{const full=(r.periods||[]).find(y=>y.key===p.key);const paid=full?full.paid:rows.filter(y=>tipoS(y)==='pago'&&String(y.periodo||'')===p.key).reduce((a,y)=>a+(Number(y.monto)||0),0);return {key:p.key,label:p.label,paid,i}});
      if(!opts.some(o=>o.key===SL.per))SL.per=opts[0].key;
      h+=`<div class="cd"><div class="lbl">Quincena que adelantas</div><div class="opts">${opts.map(p=>`<button type="button" class="opt${SL.per===p.key?' on':''}" data-sx="per:${E(p.key)}"><b>${E(capS(p.label))}</b><span>${p.i?'La siguiente':'En curso'}${p.paid>0.004?' · ya pagado '+M(p.paid):''}</span></button>`).join('')}</div><div class="fld"><label for="slM">Monto (S/)</label><input id="slM" inputmode="decimal" value="${E(SL.monto)}" data-in="slm" placeholder="0.00"></div><div class="fld"><label for="slN">Detalle</label><input id="slN" value="${E(SL.nota)}" data-in="sln" maxlength="200" placeholder="Ej. Adelanto por Yape"></div><div style="font-size:14px;color:#6B5E55">Se descuenta de lo que gane en esa quincena.</div></div>`;
      foot=`<button type="button" class="b o" style="height:54px;font-size:16px" data-sx="pagar">Registrar adelanto${mv>0?' · '+M(mv):''}</button>`;
    }else{
      const per=(r.periods||[]).filter(p=>p.isCurrent||p.balance>0.004).sort((a,b)=>a.start.localeCompare(b.start));
      if(!per.some(p=>p.key===SL.per)){const due=per.find(p=>p.balance>0.004)||per[per.length-1];SL.per=due?due.key:'';SL.monto=due&&due.balance>0.004&&!(due.needsDesc&&!due.descSet)?due.balance.toFixed(2):''}
      const p=per.find(y=>y.key===SL.per),blocked=!!(p&&p.needsDesc&&!p.descSet);
      h+=`<div class="cd"><div class="lbl">Quincena que pagas</div><div class="opts">${per.map(y=>`<button type="button" class="opt${SL.per===y.key?' on':''}" data-sx="per:${E(y.key)}"><b>${E(capS(y.label))}</b><span>${y.needsDesc&&!y.descSet?'Falta el descuento AFP/ONP':y.balance>0.004?'Pendiente '+M(y.balance):'Al día'}</span></button>`).join('')}</div></div>`;
      if(p&&(p.needsDesc||p.descSet)){const af=afpRows(p),sum=r2s(af.reduce((a,y)=>a+(Number(y.monto)||0),0)),sig=p.key+'|'+af.map(y=>y.id).join(',');
        if(f.dk!==sig){f.dk=sig;f.dm=af.length?sum.toFixed(2):'';const last=af[af.length-1];f.dt=last&&/onp/i.test(String(last.descripcion||''))?'ONP':'AFP'}
        h+=`<div class="cd"><div class="lbl">Descuento AFP/ONP de fin de mes</div><div class="seg" style="grid-template-columns:1fr 1fr"><button type="button" class="${f.dt==='AFP'?'on':''}" data-sx="dt:AFP">AFP</button><button type="button" class="${f.dt==='ONP'?'on':''}" data-sx="dt:ONP">ONP</button></div><div class="fld"><label for="slDm">Monto del descuento (S/)</label><input id="slDm" inputmode="decimal" value="${E(f.dm||'')}" data-in="sx:dm" placeholder="0.00"></div><div style="font-size:14px;color:#6B5E55">${af.length?`Registrado: <b>${M(sum)}</b>. Ganado ${M(p.earned)} − descuentos = <b>${M(Math.max(0,p.earned-p.desc))}</b>.`:'<b>Obligatorio</b> en la 2.ª quincena: escribe el descuento de este mes (pon 0 si no tiene). Sin esto no se puede registrar el pago.'}</div><button type="button" class="b${af.length?'':' o'}" data-sx="desc">${af.length?'Actualizar descuento':'Guardar descuento'}</button></div>`}
      if(p)h+=`<div class="cd"><div class="fld"><label for="slM">Monto (S/)</label><input id="slM" inputmode="decimal" value="${E(SL.monto)}" data-in="slm" placeholder="0.00"></div><div class="fld"><label for="slN">Detalle</label><input id="slN" value="${E(SL.nota)}" data-in="sln" maxlength="200" placeholder="Ej. Yape, efectivo"></div></div>`;
      if(p)foot=blocked?`<button type="button" class="b" style="height:54px;font-size:15px" disabled>Primero registra el descuento AFP/ONP</button>`:`<button type="button" class="b o" style="height:54px;font-size:16px" data-sx="pagar">Registrar pago${mv>0?' · '+M(mv):''}</button>`;
    }
    const pays=rows.filter(y=>tipoS(y)==='pago').sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))).slice(0,12);
    h+=`<div class="cd"><div class="lbl">Pagos hechos</div>${pays.length?pays.map(y=>{const ad=/^adelanto/i.test(String(y.descripcion||''));return `<div class="mv"><span class="ic" style="background:${ad?'#FFF4EC':'#E9F6EE'};color:${ad?'#9A330A':'#15803D'}">${ad?IC.swap:IC.check}</span><span class="tx" style="flex:1 1 0%;min-width:0"><b>${M(y.monto)} <span class="pl ${ad?'m':'g'}" style="height:22px;font-size:12px">${ad?'Adelanto':'Pago'}</span></b><span>${E(fDs(y.fecha))}${y.descripcion?' · '+E(y.descripcion):''}${y.periodo?' · '+E(S2.periodOf(String(y.periodo).slice(0,10)).label):''}</span></span><button type="button" class="ib" data-sx="delpago:${E(y.id)}" aria-label="Anular pago">${IC.trash}</button></div>`}).join(''):muted('Aún no hay pagos.')}</div>`;
    if(x&&x.pres){const P=r.current,cuo=pid=>rows.filter(y=>String(y.prestamo_id||'')===String(pid));
      h+=`<div class="cd"><div class="lbl">Préstamos en cuotas</div>${x.prestamos.length?x.prestamos.map(p=>{const cu=cuo(p.id),pag=r2s(cu.reduce((a,y)=>a+(Number(y.monto)||0),0)),rest=r2s(p.monto-pag),fin=rest<=0.004||!p.activo,ya=cu.some(y=>String(y.periodo)===String(P.key));
        return `<div class="mv" style="flex-wrap:wrap"><span class="tx" style="flex:1 1 0%;min-width:0"><b>${M(p.monto)} en ${p.cuotas} cuota${p.cuotas===1?'':'s'}${p.motivo?' · '+E(p.motivo):''}</b><span>Cuotas descontadas: ${cu.length} de ${p.cuotas} · ${M(pag)}</span></span>${fin?`<span class="pl g">${p.activo===false&&rest>0.004?'Anulado':'Pagado'}</span>`:`<span class="pl m">Faltan ${M(rest)}</span>`}${fin?'':`<div class="btns b2" style="width:100%">${ya?'<span class="pl g" style="justify-content:center;height:44px">Cuota de esta quincena aplicada</span>':`<button type="button" class="b o" data-sx="cuota:${E(p.id)}">Descontar cuota</button>`}<button type="button" class="b rojo" data-sx="anular:${E(p.id)}">Anular saldo</button></div>`}</div>`}).join(''):muted('Sin préstamos.')}
        <div class="two"><div class="fld"><label for="slPm">Monto prestado (S/)</label><input id="slPm" inputmode="decimal" value="${E(f.pm||'')}" data-in="sx:pm" placeholder="0"></div><div class="fld"><label for="slPc">Cuotas (quincenas)</label><input id="slPc" inputmode="numeric" value="${E(f.pc==null?'2':f.pc)}" data-in="sx:pc"></div></div><div class="fld"><label for="slPo">Motivo</label><input id="slPo" maxlength="80" value="${E(f.po||'')}" data-in="sx:po" placeholder="Ej. Reparación de la moto"></div><button type="button" class="b" data-sx="prestar">${IC.plus}Registrar préstamo</button><div style="font-size:14px;color:#6B5E55">Cada quincena, al cerrarla, se descuenta una cuota automáticamente.</div></div>`}
    return {h,foot};
  }
  function slAjustes(r){
    const m=SL.moto,S2=window.PdSueldo,cfg=S2.config(m);
    if(!SL.cfg||SL.cfg.id!==String(m.id)){const pad=n=>String(n).padStart(2,'0'),hm2=x=>pad(Math.floor(x/60))+':'+pad(x%60);SL.cfg={id:String(m.id),tipo:cfg.hourly?'por_horas':'completo',hire:cfg.hire||'',a:cfg.times?hm2(cfg.times.start):'08:00',b:cfg.times?hm2(cfg.times.end):'13:00',days:cfg.days.length?cfg.days.slice():['lunes','martes','miercoles','jueves','viernes','sabado']}}
    const c=SL.cfg;let h='';
    if(!r||!r.ok)h+=`<div class="amt"><div class="k">Sueldo</div><div class="n" style="font-size:30px">Sin configurar</div><div class="pill">Falta: ${E(((r&&r.cfg&&r.cfg.missing)||['ingreso, horario y días']).join(', '))}</div></div>`;
    h+=`<div class="cd"><div class="lbl">Tipo de sueldo</div><div class="seg" style="grid-template-columns:1fr 1fr"><button type="button" class="${c.tipo==='completo'?'on':''}" data-sx="tipo:completo">Sueldo fijo</button><button type="button" class="${c.tipo==='por_horas'?'on':''}" data-sx="tipo:por_horas">Por horas</button></div>
      <div class="fld"><label for="slHi">Fecha de ingreso</label><input id="slHi" type="date" value="${E(c.hire)}" data-in="sc:hire"></div>`;
    if(c.tipo==='completo')h+=`<div class="two"><div class="fld"><label for="slHa">Entrada</label><input id="slHa" type="time" value="${E(c.a)}" data-in="sc:a"></div><div class="fld"><label for="slHb">Salida</label><input id="slHb" type="time" value="${E(c.b)}" data-in="sc:b"></div></div>
      <div class="lbl" style="margin-top:4px">Días laborables</div><div class="chips" style="flex-wrap:wrap">${DS.map(d=>`<button type="button" class="${c.days.includes(d)?'on':''}" aria-pressed="${c.days.includes(d)}" data-sx="cfgdia:${d}">${DSC[d]}</button>`).join('')}</div>
      <div style="font-size:14px;color:#6B5E55">El domingo y los feriados que no trabaja se pagan como descanso. Cada jornada se suma sola a la hora de salida.</div>`;
    else h+=`<div style="font-size:14px;color:#6B5E55">Por horas: solo se suman las jornadas que registras en «Asistencia».</div>`;
    h+=`<button type="button" class="b o" data-sx="cfgsave">Guardar configuración</button></div>`;
    return h;
  }
  function slVista(){
    const m=SL.moto,S2=window.PdSueldo,r=calcS(m),f=SL.f,x=slx().data,nom=m.nombre_completo||'Motorizado';
    const hd=t=>top3(nom,t,'');
    if(SL.vista==='dia'){const d=r&&r.ok&&(r.current.days||[]).find(y=>y.date===SL.dia&&!y.adjDay);if(!d){SL.vista=null;return null}
      const titulo=capS(S2.parse(d.date).toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'long'}));
      const base=M(S2.baseFor(m)+(d.work&&d.dow!=='domingo'?S2.GAS:0));
            const puedeAdel=!!((d.work||d.rest)&&(d.status==='hoy'||d.status==='futuro'));
      const EST={trabajado:'Trabajado',descanso:d.holiday?'Feriado pagado':'Descanso pagado',falta:'Falta',hoy:'Hoy · se suma '+r.endAt,futuro:d.work?'Día laborable':d.rest?'Descanso':'Libre',libre:'Libre (no se paga)',antes:'Antes de su ingreso'};
      let h=avisos()+`<div class="cd"><div class="lbl">Estado del día</div><div style="font-size:18px;font-weight:800">${E(d.adel?'Adelantado · cuenta como trabajado':EST[d.status]||'—')}</div>${d.gas?`<div style="font-size:14px;color:#6B5E55">Incluye gasolina ${M(d.gas)}</div>`:''}</div>`;
      if(d.status==='falta')h+=`<div class="cd"><div class="lbl">Falta registrada</div><div style="font-size:15px">${E(d.falta&&d.falta.descripcion||'Falta')}</div><button type="button" class="b" data-sx="dquitar">Quitar falta</button></div>`;
      if(d.adel)h+=`<div class="cd"><div class="lbl">Día adelantado</div><div style="font-size:14px;color:#6B5E55">Ya se cuenta como trabajado (${E(base)}).</div><button type="button" class="b" data-sx="ddesadel">Quitar adelanto del día</button></div>`;
      else if(puedeAdel)h+=`<div class="cd"><div class="lbl">Adelantar día trabajado</div><div style="font-size:14px;color:#6B5E55">Se cuenta como trabajado desde ahora y se suma a la ${E(S2.periodOf(d.date).label)} (${E(base)}).</div><button type="button" class="b o" data-sx="dadel">Adelantar día trabajado</button></div>`;
      if(d.status!=='falta'&&!d.adel&&!puedeAdel)h+=U.note('Para registrar una falta ve a «Asistencia»; para dar un adelanto de sueldo, a «Pagos».');
      return {head:hd(titulo),body:h};
    }
    if(SL.vista==='boleta'){const q=x&&x.cierres.find(c=>c.periodo===SL.bol);if(!q){SL.vista=null;return null}const d=q.detalle||{};
      const txt=['*PIDEMÁS DELIVERY · Boleta de pago*',nom,(d.label||q.periodo),'','Días pagados: '+(d.dias||0)+(d.descansos?' + '+d.descansos+' descanso(s)':'')+(d.faltas?' · faltas: '+d.faltas:''),'Sueldo: '+M(d.sueldo),'Gasolina: '+M(d.gasolina),'*Ganado: '+M(q.ganado)+'*',...(d.descuentos||[]).map(y=>'− '+y.d+': '+M(y.m)),...(d.pagos||[]).map(y=>'Pago '+fDs(y.f)+': '+M(y.m)),'*Pendiente: '+M(q.pendiente)+'*',q.recibido_conforme_en?'✓ Recibió conforme':''].join('\n');
      const tel=String(m.telefono||'').replace(/\D/g,'').replace(/^(\d{9})$/,'51$1');
      let h=`<div class="amt"><div class="k">${E(capS(d.label||q.periodo))}</div><div class="n">${M(q.pendiente)}</div><div class="pill">${q.recibido_conforme_en?'Recibió conforme el '+E(dtl(q.recibido_conforme_en)):'Esperando su «Recibí conforme»'}</div></div>`;
      h+=`<div class="cd"><div class="lbl">Boleta de pago</div>${liS('Días pagados','',(d.dias||0)+(d.descansos?' + '+d.descansos+' desc.':''))}${d.faltas?liS('Faltas','',d.faltas):''}${liS('Sueldo','',M(d.sueldo))}${liS('Gasolina','',M(d.gasolina))}${liS('Ganado','',M(q.ganado))}${(d.descuentos||[]).map(y=>liS(E(y.d||'Descuento'),'','− '+M(y.m),'color:#B42318')).join('')}${(d.pagos||[]).map(y=>liS('Pago '+E(fDs(y.f)),'',M(y.m))).join('')}<div class="li" style="border-top:1px solid #F1E4DA;padding-top:8px"><span>Pendiente</span><b style="font-size:18px">${M(q.pendiente)}</b></div></div>`;
      h+=`<a class="b g" target="_blank" rel="noopener" href="https://wa.me/${E(tel)}?text=${encodeURIComponent(txt)}">${U.I&&U.I.wa||''}Enviar boleta por WhatsApp</a>`;
      return {head:hd('Boleta'),body:h};
    }
    if(SL.vista==='hist'){const T={jornada:'Jornada',falta:'Falta',pago:'Pago',descuento:'Descuento'};let h;
      if(SL.hist==null)h='<div class="load">Cargando…</div>';else if(typeof SL.hist==='string')h=`<div class="err">${E(SL.hist)}</div>`;
      else h=SL.hist.length?`<div class="cd">${SL.hist.map(y=>{const z=y.despues||y.antes||{},a=y.antes||{};return `<div class="mv"><span class="tx" style="flex:1 1 0%;min-width:0"><b>${E(T[tipoS(z)]||z.tipo||'Registro')} ${E(y.accion||'')}${z.fecha?' · '+E(fDs(String(z.fecha).slice(0,10))):''}</b><span>${E(dtl(y.creado_en))} · ${y.es_admin?'Administración':'Sistema / motorizado'}${z.monto!=null?' · '+M(z.monto):''}${y.accion==='editado'&&a.monto!=null&&String(a.monto)!==String(z.monto)?' (antes '+M(a.monto)+')':''}${z.descripcion?' · '+E(z.descripcion):''}</span></span></div>`}).join('')}</div>`:'<div class="vac">Sin cambios registrados todavía.</div>';
      return {head:hd('Historial de cambios'),body:h};
    }
    if(SL.vista==='tard'){
      return {head:hd('Tardanzas'),body:avisos()+U.note('Se compara la primera conexión de su app con la hora de entrada. Aplica a todos los motorizados.')+`<div class="cd"><div class="fld"><label for="slT1">Tolerancia (minutos sin descuento)</label><input id="slT1" inputmode="numeric" value="${E(f.t1)}" data-in="sx:t1"></div><div class="fld"><label for="slT2">Cada cuántos minutos de retraso</label><input id="slT2" inputmode="numeric" value="${E(f.t2)}" data-in="sx:t2"></div><div class="fld"><label for="slT3">Se descuenta (S/)</label><input id="slT3" inputmode="decimal" value="${E(f.t3)}" data-in="sx:t3"></div><button type="button" class="b o" data-sx="tsave">Guardar</button></div>`};
    }
    SL.vista=null;return null;
  }
  function slVivo(k,el){const f=SL.f,S2=window.PdSueldo;
    if(k==='oa'||k==='ob'){if(k==='oa'&&(!f.ob||f.ob<f.oa)){f.ob=f.oa;const b=root.getElementById('slOb');if(b)b.value=f.ob}const i=root.getElementById('slOi');if(i)i.textContent=offInfo();return}
    if(k==='shh'||k==='shp'||k==='shg'){if(k==='shp')f.shpT=1;if(k==='shg')f.shgT=1;
      if(k==='shh'){const s=S2.hourly(numv(f.shh));if(!f.shpT){f.shp=s.sueldo?s.sueldo.toFixed(2):'';const e=root.getElementById('slShp');if(e)e.value=f.shp}if(!f.shgT){f.shg=s.gas?s.gas.toFixed(2):'';const e=root.getElementById('slShg');if(e)e.value=f.shg}}
      const t=root.getElementById('slSht');if(t)t.textContent=M((numv(f.shp)||0)+(numv(f.shg)||0))}}
  function montoPer(k){const r=calcS(SL.moto),p=r&&(r.periods||[]).find(y=>y.key===k);SL.monto=p&&p.balance>0.004&&!(p.needsDesc&&!p.descSet)?p.balance.toFixed(2):''}
  async function slAccion(v){
    const i=v.indexOf(':'),a=i<0?v:v.slice(0,i),arg=i<0?'':v.slice(i+1);
    const m=SL.moto,S2=window.PdSueldo,f=SL.f;if(!m||!S2)return;const id=m.id,nom=m.nombre_completo||'este motorizado';
    switch(a){
      case 'pest':SL.pest=arg;SL.msg='';SL.ok='';return;
      case 'modo':SL.modo=arg;SL.per='';SL.monto='';SL.nota='';SL.msg='';return;
      case 'per':SL.per=arg;if(SL.modo==='pago')montoPer(arg);else SL.monto='';return;
      case 'pagarper':SL.pest='pagos';SL.modo='pago';SL.per=arg;montoPer(arg);SL.msg='';SL.ok='';return;
      case 'tipo':SL.cfg.tipo=arg;return;
      case 'cfgdia':{const s=SL.cfg.days,j=s.indexOf(arg);j<0?s.push(arg):s.splice(j,1);return}
      case 'dt':f.dt=arg;return;
      case 'vt':f.vt=arg;return;
      case 'vp':f.vp=arg;return;
      case 'ad':f.ad=arg;return;
      case 'dia':SL.dia=arg;abrirV('dia');return;
      case 'boleta':SL.bol=arg;abrirV('boleta');return;
      case 'hist':{SL.hist=null;abrirV('hist');D().from('control_sueldos_historial').select('*').eq('motorizado_id',id).order('creado_en',{ascending:false}).limit(80).then(q=>{SL.hist=q.error?q.error.message:(q.data||[]);key='';pintar()},e=>{SL.hist=String(e&&e.message||e);key='';pintar()});return}
      case 'vtard':{const t=(slx().data||{}).tard||{tolerancia:10,cada:15,monto:2};f.t1=String(t.tolerancia);f.t2=String(t.cada);f.t3=String(t.monto);abrirV('tard');return}
    }
    SL.msg='';SL.ok='';
    const fin=async(t,soloX)=>{if(SL.vista)cerrarV();await slRe(soloX);SL.ok=t};
    try{
      if(a==='pagar'){const monto=r2s(numv(SL.monto));
        if(SL.modo==='adelanto'){if(!SL.per){SL.msg='Elige la quincena que adelantas.';return}if(!(monto>0)){SL.msg='Escribe un monto válido.';return}
          const lab=S2.periodOf(SL.per.slice(0,10)).label;if(!(await confS('¿Registrar un adelanto de '+M(monto)+' a '+nom+' para la '+lab+'?')))return;
          await insS({motorizado_id:id,fecha:S2.todayIso(),tipo:'pago',monto,descripcion:'Adelanto de sueldo'+(SL.nota.trim()?' · '+SL.nota.trim():''),periodo:SL.per});
          SL.monto='';SL.nota='';return fin('Adelanto registrado: '+M(monto)+'.')}
        const r=calcS(m);if(!r||!r.ok){SL.msg='Completa primero la configuración del motorizado.';return}
        const p=(r.periods||[]).find(y=>y.key===SL.per);if(!p){SL.msg='Elige la quincena que pagas.';return}if(!(monto>0)){SL.msg='Escribe un monto válido.';return}
        if(p.needsDesc&&!p.descSet){SL.msg='Primero registra el descuento AFP/ONP de fin de mes (pon 0 si no tiene).';return}
        if(monto>p.balance+0.004&&!(await confS('El monto es mayor a lo pendiente de esa quincena ('+M(Math.max(0,p.balance))+'). ¿Registrar de todas formas?')))return;
        if(!(await confS('¿Registrar un pago de '+M(monto)+' a '+nom+' por la '+p.label+'?')))return;
        await insS({motorizado_id:id,fecha:S2.todayIso(),tipo:'pago',monto,descripcion:SL.nota.trim()||'Pago de sueldo',periodo:p.key});
        SL.per='';SL.monto='';SL.nota='';return fin('Pago registrado: '+M(monto)+'.')}
      if(a==='desc'){const r=calcS(m),p=r&&(r.periods||[]).find(y=>y.key===SL.per);if(!p)return;const raw=String(f.dm??'').trim(),monto=numv(raw);
        if(raw===''||!Number.isFinite(monto)||monto<0){SL.msg='Escribe el monto del descuento (pon 0 si no tiene).';return}
        for(const y of afpRows(p))await delS('control_sueldos',y.id);
        await insS({motorizado_id:id,fecha:S2.todayIso(),tipo:'descuento',monto:r2s(monto),descripcion:'Descuento '+(f.dt||'AFP'),periodo:p.key});
        f.dk='';await fin('Descuento '+(f.dt||'AFP')+' guardado: '+M(monto)+'.');montoPer(p.key);return}
      if(a==='delpago'){if(!(await confS('¿Anular este pago? Se volverá a mostrar como pendiente.')))return;await delS('control_sueldos',arg);return fin('Pago anulado.')}
      if(a==='offsi'||a==='offno'){const L2=offDias();if(!L2.length){SL.msg='Elige fechas válidas («Hasta» no puede ser antes de «Desde»).';return}
        const rows=slRows(),S3=new Set(L2);
        if(a==='offsi'){if(L2.length>62){SL.msg='Máximo 62 días por registro.';return}
          const ocup=new Set(rows.filter(y=>tipoS(y)==='falta'||(tipoS(y)==='jornada'&&esVac(y))).map(y=>String(y.fecha).slice(0,10)));
          const pag=f.vp!=='sin',tipo=f.vt||'Vacaciones',mot=String(f.ow||'').trim(),desc=(tipo==='Vacaciones'?(pag?'Vacaciones pagadas':'Vacaciones sin pago'):(pag?'Permiso pagado':'Permiso sin pago'))+(mot?' · '+mot:'');
          const ins=L2.filter(d=>!ocup.has(d)).map(d=>({motorizado_id:id,fecha:d,tipo:pag?'jornada':'falta',monto:0,descripcion:desc,periodo:S2.periodOf(d).key}));
          if(!ins.length){SL.msg='Esas fechas ya tienen una falta, vacaciones o permiso registrado.';return}
          if(!(await confS('¿Registrar '+ins.length+' día'+(ins.length===1?'':'s')+' de '+tipo.toLowerCase()+' '+(pag?'pagado':'sin pago')+' para '+nom+'?')))return;
          await insS(ins);f.ow='';try{window.pdhReload&&window.pdhReload()}catch(_){}return fin(tipo+' registrad'+(tipo==='Vacaciones'?'as':'o')+': '+ins.length+' día'+(ins.length===1?'':'s')+(pag?' pagado':' sin pago')+(ins.length===1?'':'s')+'.')}
        const del=rows.filter(y=>S3.has(String(y.fecha).slice(0,10))&&(tipoS(y)==='falta'||(tipoS(y)==='jornada'&&esVac(y))));if(!del.length){SL.msg='No hay faltas, vacaciones ni permisos en esas fechas.';return}
        if(!(await confS('¿Quitar '+del.length+' registro'+(del.length===1?'':'s')+' (faltas, vacaciones o permisos) entre esas fechas?')))return;
        for(const y of del)await delS('control_sueldos',y.id);try{window.pdhReload&&window.pdhReload()}catch(_){}return fin('Fechas quitadas.')}
      if(a==='delreg'){const y=slRows().find(z=>String(z.id)===arg);if(!y)return;const t=tipoS(y)==='falta'?(esVac(y)?'este día sin pago':'esta falta'):esVac(y)?'este día de vacaciones o permiso':'el adelanto de este día';
        if(!(await confS('¿Quitar '+t+' ('+fDs(y.fecha)+')?')))return;await delS('control_sueldos',arg);return fin('Listo, se quitó.')}
      if(a==='dadel'){const dd=(calcS(m).current.days||[]).find(z=>z.date===f.ad&&!z.adjDay);if(!dd){SL.msg='Elige el día que adelantas.';return}
        if(!(await confS('¿Adelantar el '+fDs(dd.date)+' como día trabajado de '+nom+'?')))return;
        await insS({motorizado_id:id,fecha:dd.date,tipo:'jornada',monto:0,descripcion:'Día adelantado',periodo:S2.periodOf(dd.date).key});f.ad='';return fin('Día adelantado: ya cuenta como trabajado.')}
      if(a==='jor'){const fecha=f.shf,horas=numv(f.shh),pay=numv(f.shp)||0,gas=numv(f.shg)||0;
        if(!fecha){SL.msg='Elige la fecha de la jornada.';return}if(!(horas>0)){SL.msg='Escribe las horas trabajadas.';return}if(fecha>S2.todayIso()){SL.msg='No puedes registrar una jornada de una fecha futura.';return}
        if(slRows().some(y=>tipoS(y)==='jornada'&&String(y.fecha).slice(0,10)===fecha)&&!(await confS('Ya hay una jornada el '+fDs(fecha)+'. ¿Registrar otra?')))return;
        const base={motorizado_id:id,fecha,tipo:'jornada',monto:r2s(pay),descripcion:horas+' h · gasolina S/ '+gas.toFixed(2),periodo:S2.periodOf(fecha).key};
        let q=await D().from('control_sueldos').insert({...base,horas,gasolina:r2s(gas)});if(q.error&&/horas|gasolina/.test(q.error.message||''))q=await D().from('control_sueldos').insert(base);if(q.error)throw q.error;
        Object.assign(f,{shh:'',shp:'',shg:'',shpT:0,shgT:0});return fin('Jornada registrada.')}
      if(a==='deljor'){if(!(await confS('¿Anular esta jornada? Dejará de sumarse al sueldo.')))return;await delS('control_sueldos',arg);return fin('Jornada anulada.')}
      if(a==='cfgsave'){const c=SL.cfg;
        if(c.tipo==='completo'){if(!c.hire||!c.a||!c.b||!c.days.length){SL.msg='Completa la fecha de ingreso, el horario y al menos un día laborable.';return}if(c.a===c.b){SL.msg='La hora de entrada y de salida no pueden ser iguales.';return}}
        const days=DS.filter(d=>c.days.includes(d));
        const patch=c.tipo==='por_horas'?{tipo_sueldo:'por_horas',fecha_ingreso:c.hire||null}:{tipo_sueldo:'completo',fecha_ingreso:c.hire,horario_trabajo:c.a+' – '+c.b,dias_laborables:days};
        const q=await D().from('motorizados').update(patch).eq('id',id).select('*').maybeSingle();
        if(q.error){if(/tipo_sueldo/.test(q.error.message||''))throw new Error('falta la columna tipo_sueldo en motorizados.');throw q.error}if(!q.data)throw new Error('No se actualizó el motorizado (revisa permisos).');
        Object.assign(m,q.data);SL.cfg=null;await fin('Configuración guardada.');const r=calcS(SL.moto);if(r&&r.ok)SL.pest='resumen';return}
      const d=SL.vista==='dia'&&calcS(m)?.current?.days?.find(y=>y.date===SL.dia&&!y.adjDay);
      if(a==='falta'){const fe=f.ff,r=calcS(m),dd=r&&r.ok&&(r.periods||[]).flatMap(y=>y.days||[]).find(y=>y.date===fe&&!y.adjDay);
        if(!fe){SL.msg='Elige el día de la falta.';return}if(!dd||!(dd.work||dd.rest)||['antes','libre','dia31'].includes(dd.status)){SL.msg='Ese día no es un día pagado para '+nom+'.';return}if(dd.status==='falta'){SL.msg='Ese día ya tiene una falta registrada.';return}
        if(!(await confS('¿Registrar falta a '+nom+' el '+fDs(fe)+'?')))return;
        await insS({motorizado_id:id,fecha:fe,tipo:'falta',monto:0,descripcion:String(f.dmot||'').trim()||'Falta',periodo:S2.periodOf(fe).key});f.dmot='';return fin('Falta registrada el '+fDs(fe)+'.')}
      if(a==='dquitar'&&d&&d.falta){await delS('control_sueldos',d.falta.id);return fin('Falta eliminada.')}
      if(a==='ddesadel'&&d&&d.adel){await delS('control_sueldos',d.adel.id);return fin('Se quitó el adelanto del día.')}
      if(a==='dfalta'&&d){await insS({motorizado_id:id,fecha:d.date,tipo:'falta',monto:0,descripcion:String(f.dmot||'').trim()||'Falta',periodo:S2.periodOf(d.date).key});return fin('Falta registrada el '+fDs(d.date)+'.')}
      if(a==='dadv'&&d){const monto=r2s(numv(f.dam));if(!(monto>0)){SL.msg='Escribe un monto válido.';return}const det=String(f.dde||'').trim();
        await insS({motorizado_id:id,fecha:d.date,tipo:'pago',monto,descripcion:'Adelanto de sueldo'+(det?' · '+det:''),periodo:S2.periodOf(d.date).key});return fin('Adelanto registrado: '+M(monto)+'.')}
      const x=slx().data||{};
      if(a==='cerrar'){const r=calcS(m);let P=r&&(r.periods||[]).find(y=>y.key===arg);if(!P)return;
        if(P.isCurrent&&S2.todayIso()<P.end&&!(await confS('Esta quincena todavía no termina (hasta el '+fDs(P.end)+'). ¿Cerrarla igual?')))return;
        if(P.needsDesc&&!P.descSet&&!(await confS('Falta registrar el descuento AFP/ONP de fin de mes. ¿Cerrar sin él?')))return;
        let n=0;for(const p of (x.prestamos||[]).filter(p=>p.activo!==false)){if(!slRows().some(y=>String(y.prestamo_id||'')===String(p.id)&&String(y.periodo)===arg)){if(await aplicarCuota(p,P))n++}}
        if(n){await slRe();P=(calcS(SL.moto).periods||[]).find(y=>y.key===arg)}
        const r3=calcS(SL.moto),gas=r3.hourly?r2s(P.gasTotal):r2s(P.gasDays*S2.GAS);
        const det={label:P.label,dias:P.worked+P.adj,descansos:P.rest,faltas:P.faltas,horas:P.hours,sueldo:r2s(P.earned-gas),gasolina:gas,descuentos:(P.descRows||[]).map(y=>({d:y.descripcion,m:Number(y.monto)})),pagos:(P.payments||[]).map(y=>({f:y.fecha,d:y.descripcion,m:Number(y.monto)}))};
        if(!(await confS('¿Cerrar la '+P.label+'?\nGanado '+M(P.earned)+' · descuentos '+M(P.desc)+' · pagado '+M(P.paid)+' · pendiente '+M(Math.max(0,P.balance))+(n?'\nSe descontó '+n+' cuota'+(n===1?'':'s')+' de préstamo.':''))))return;
        let uid=null;try{uid=(await D().auth.getUser()).data.user.id}catch(_){}
        const q=await D().from('quincenas_cerradas').insert({motorizado_id:id,periodo:arg,inicio:P.start,fin:P.end,ganado:r2s(P.earned),descuentos:r2s(P.desc),pagado:r2s(P.paid),pendiente:r2s(Math.max(0,P.balance)),detalle:det,cerrado_por:uid});if(q.error)throw q.error;
        if(m.usuario_id)try{await D().from('notificaciones').insert({usuario_id:m.usuario_id,tipo:'sistema',titulo:'Tu boleta está lista',mensaje:'Se cerró tu '+P.label+'. Revisa tu boleta y toca «Recibí conforme».'})}catch(_){}
        return fin('Quincena cerrada.',true)}
      if(a==='reabrir'){const q=(x.cierres||[]).find(c=>c.periodo===arg);if(!q)return;if(!(await confS('¿Reabrir esta quincena? Se podrán volver a cambiar días, faltas y descuentos, y el motorizado tendrá que confirmar otra vez.')))return;await delS('quincenas_cerradas',q.id);return fin('Quincena reabierta.',true)}
      if(a==='tard'){const [fe,mn,mo]=arg.split(':');if(!(await confS('¿Descontar '+M(+mo)+' por llegar '+mn+' min tarde el '+fDs(fe)+'?')))return;
        await insS({motorizado_id:id,fecha:fe,tipo:'descuento',monto:+mo,descripcion:'Tardanza '+fDs(fe)+' · '+mn+' min',periodo:S2.periodOf(fe).key});
        await D().from('asistencia_revisada').upsert({motorizado_id:id,fecha:fe,decision:'tardanza',minutos:+mn});return fin('Tardanza descontada.')}
      if(a==='gfalta'){if(!(await confS('¿Registrar falta el '+fDs(arg)+'? No tuvo ninguna conexión ese día.')))return;
        await insS({motorizado_id:id,fecha:arg,tipo:'falta',monto:0,descripcion:'Sin conexión GPS',periodo:S2.periodOf(arg).key});
        await D().from('asistencia_revisada').upsert({motorizado_id:id,fecha:arg,decision:'falta'});return fin('Falta registrada.')}
      if(a==='perdonar'){const q=await D().from('asistencia_revisada').upsert({motorizado_id:id,fecha:arg,decision:'perdonado'});if(q.error)throw q.error;return fin('Marcado como perdonado.',true)}
      if(a==='visto'){const q=await D().from('justificaciones').update({visto_en:new Date().toISOString()}).eq('id',arg);if(q.error)throw q.error;return fin('Justificación marcada como vista.',true)}
      if(a==='prestar'){const mo=r2s(numv(f.pm)),c=Math.round(numv(f.pc)||0),why=String(f.po||'').trim();if(!(mo>0)||!(c>=1&&c<=24)){SL.msg='Escribe el monto y de 1 a 24 cuotas.';return}
        if(!(await confS('¿Registrar un préstamo de '+M(mo)+' en '+c+' cuota'+(c===1?'':'s')+' de '+M(mo/c)+'?')))return;
        const q=await D().from('prestamos').insert({motorizado_id:id,monto:mo,cuotas:c,motivo:why||null});if(q.error)throw q.error;f.pm='';f.pc='2';f.po='';return fin('Préstamo registrado.',true)}
      if(a==='cuota'){const p=(x.prestamos||[]).find(y=>String(y.id)===arg);if(!p)return;const r=calcS(m);if(!(await confS('¿Descontar '+M(cuotaMonto(p))+' de la '+r.current.label+'?')))return;await aplicarCuota(p,r.current);return fin('Cuota descontada.')}
      if(a==='anular'){if(!(await confS('¿Anular el saldo pendiente de este préstamo? Ya no se descontarán más cuotas.')))return;const q=await D().from('prestamos').update({activo:false}).eq('id',arg);if(q.error)throw q.error;return fin('Saldo del préstamo anulado.',true)}
      if(a==='tsave'){const t={tolerancia:Math.max(0,Math.round(numv(f.t1)||0)),cada:Math.max(1,Math.round(numv(f.t2)||15)),monto:Math.max(0,r2s(numv(f.t3)))};
        const q=await D().from('ajustes_pidemas').upsert({clave:'tardanza',valor:t,actualizado_en:new Date().toISOString()});if(q.error)throw q.error;return fin('Tardanzas guardadas.',true)}
    }catch(err){SL.ok='';SL.msg='No se pudo guardar: '+String(err&&err.message||err)}
  }
  const cuotasP=p=>slRows().filter(y=>String(y.prestamo_id||'')===String(p.id));
  function cuotaMonto(p){const cu=cuotasP(p),pag=cu.reduce((a,y)=>a+(Number(y.monto)||0),0),rest=r2s(p.monto-pag);if(rest<=0.004)return 0;const base=r2s(p.monto/p.cuotas);return cu.length+1>=p.cuotas?rest:Math.min(base,rest)}
  async function aplicarCuota(p,P){const mo=cuotaMonto(p);if(mo<=0)return false;const n=cuotasP(p).length+1,S2=window.PdSueldo;
    await insS({motorizado_id:p.motorizado_id,fecha:P.end<=S2.todayIso()?P.end:S2.todayIso(),tipo:'descuento',monto:mo,descripcion:'Cuota de préstamo '+n+'/'+p.cuotas+(p.motivo?' · '+p.motivo:''),periodo:P.key,prestamo_id:p.id});return true}

  /* =============== CLIENTES (rehecha) =============== */
  const CL={q:'',sel:null,f:null,lim:60};
  function datosCli(force){return cargar('cli',async()=>{const r=await D().from('clientes').select('*');if(r.error)throw r.error;const L2=(r.data||[]).filter(c=>c.activo!==false);L2.sort((a,b)=>cliN(a).localeCompare(cliN(b),'es'));return L2},force)}
  const cliN=c=>String(c.nombre_completo||c.nombre||'').trim();
  const cliT=c=>String(c.telefono||c.numero||c.celular||'');
  const cliU=c=>c.referencia||c.ubicacion_recojo_url||c.ubicacion_url||'';
  const dig=v=>String(v||'').replace(/\D/g,'');
  const waL=t=>{const us=U.usuario&&U.usuario(t);if(us)return 'https://wa.me/'+us;const d=dig(t);return d?'https://wa.me/'+(d.startsWith('51')?d:d.length===9?'51'+d:d):''};
  const pedCli=c=>{const t=dig(cliT(c)).slice(-9);return t?L().filter(o=>dig(o.telefono_cliente||o.telefono_remitente).slice(-9)===t):[]};
  function clientes(){
    const c=datosCli();const head=top2('Clientes','Clientes',`<button type="button" class="ib" data-a="cl:nuevo" aria-label="Nuevo cliente">${IC.plus}</button>`);
    if(!c.data)return {head,body:c.err?`<div class="err">${E(c.err)}</div>`:'<div class="load">Cargando clientes…</div>'};
    const A=c.data;let h='';
    h+=`<div class="fld"><label for="clQ" style="position:absolute;width:1px;height:1px;overflow:hidden">Buscar cliente</label><input id="clQ" type="search" placeholder="Nombre, teléfono o DNI" value="${E(CL.q)}" data-in="clq"></div>`;
    h+=`<button type="button" class="b o" data-a="cl:nuevo">${IC.plus}Nuevo cliente</button><div id="clL" style="display:flex;flex-direction:column;gap:10px">${clFilas()}</div>`;
    return {head,body:h};
  }
  function clFilas(){const c=C2.cli;if(!c||!c.data)return '';const q=CL.q.trim().toLowerCase();
    const L2=c.data.filter(x=>!q||[cliN(x),cliT(x),x.documento||'',x.direccion||''].join(' ').toLowerCase().includes(q));let last='';
    const h=L2.slice(0,CL.lim).map(x=>{const l=(cliN(x).charAt(0)||'#').toUpperCase();const t=l!==last&&!q?`<div class="lbl" style="margin:6px 0 0">${E(l)}</div>`:'';last=l;
      return t+`<button type="button" class="tl" data-cli="${E(x.id)}"><span class="ic" style="font-weight:800;font-size:15px">${iniN(cliN(x))}</span><span class="tx"><b>${E(cliN(x)||'Sin nombre')}</b><span>${E([cliT(x),x.direccion].filter(Boolean).join(' · '))}</span></span>${IC.chev}</button>`}).join('');
    return (h||`<div class="vac">${q?'No hay clientes con ese dato.':'Todavía no hay clientes.'}</div>`)+(L2.length>CL.lim?`<button type="button" class="b" data-a="cl:mas">Ver ${Math.min(60,L2.length-CL.lim)} más</button>`:'')}
  function cliente(){
    const x=CL.sel;if(!x)return {head:top3('Clientes','Cliente'),body:''};
    const ps=pedCli(x),u=cliU(x),map=x.latitud&&x.longitud?`https://www.google.com/maps?q=${x.latitud},${x.longitud}`:/^https?:/i.test(u)?u:'';
    let h=`<div class="ph"><span class="ava">${iniN(cliN(x))}</span><div style="flex:1 1 0%;min-width:0"><b style="display:block;font-size:20px;overflow-wrap:anywhere">${E(cliN(x)||'Sin nombre')}</b><span style="font-size:14px;color:#6B5E55">${ps.length} pedido${ps.length===1?'':'s'}</span></div></div>`;
    h+=`<div class="btns b2">${cliT(x)?`<a class="b g" href="${E(waL(cliT(x)))}" target="_blank" rel="noopener">${U.I.wa}WhatsApp</a><a class="b" href="${U.usuario&&U.usuario(cliT(x))?E(waL(cliT(x))):'tel:'+E(dig(cliT(x)))}">${U.I.phone}Llamar</a>`:''}</div>`;
    h+=`<div class="cd"><div class="li"><span>Teléfono</span><b>${E(cliT(x)||'—')}</b></div><div class="li"><span>DNI</span><b>${E(x.documento||x.dni||'—')}</b></div><div class="li" style="align-items:flex-start"><span>Dirección</span><b style="white-space:normal;text-align:right">${E(x.direccion||'—')}</b></div>${u&&!/^https?:/i.test(u)?`<div class="li" style="align-items:flex-start"><span>Referencia</span><b style="white-space:normal;text-align:right">${E(u)}</b></div>`:''}</div>`;
    if(map)h+=`<a class="b" href="${E(map)}" target="_blank" rel="noopener">${IC.pin}Ver ubicación en el mapa</a>`;
    if(ps.length)h+=`<div class="cd"><div class="lbl">Pedidos</div>${ps.slice(0,15).map(o=>`<button type="button" class="mv" style="width:100%;background:transparent;border-left:0;border-right:0;border-top:0;text-align:left;font:inherit;color:inherit;cursor:pointer" data-o="${E(o.id)}"><span class="tx"><b>${E(ref(o.id))} · ${E(fase(o).txt)}</b><span>${E(fecha(o.creado_en))}${NEG(o.negocio_id).nombre?' · '+E(NEG(o.negocio_id).nombre):''}</span></span><span class="am">${M(o.total)}</span></button>`).join('')}</div>`;
    h+=`<button type="button" class="b" style="color:#B42318;border-color:#F4C7C3" data-a="cl:borrar">${IC.trash}Borrar cliente</button>`;
    return {head:top3('Clientes',cliN(x)||'Cliente'),body:h,foot:`<button type="button" class="b o" style="height:54px;font-size:16px" data-a="cl:editar">Editar datos</button>`};
  }
  function clienteForm(){
    const f=CL.f;if(!f)return {head:top3('Clientes','Cliente'),body:''};
    const fl=(id,l,k,ph,o)=>`<div class="fld"><label for="${id}">${l}</label><input id="${id}" value="${E(f[k])}" data-in="cf:${k}"${ph?` placeholder="${E(ph)}"`:''}${o||''}></div>`;
    try{datosCli()}catch(_){}
    const pa=f.paso||0,LC=(C2.cli&&C2.cli.data)||null;
    let h='';
    h+=`<div class="cd pwz"><div class="kick" style="color:#6B5E55">Paso ${pa+1} de 2</div><b style="font-size:20px">${pa?'Dirección y ubicación':'Datos del cliente'}</b><div class="pbar"><i class="on"></i><i class="${pa?'on':''}"></i></div></div>`;
    if(!pa)h+=`<div class="cd"><span style="font-size:14px;color:#6B5E55">Nombre y número con los que lo encontrarás al crear un pedido.</span>${fl('cfN','Nombre y apellido','nombre','Ej. Ana Ruiz',' maxlength="80" autocomplete="off"')}${fl('cfT','Número','tel','9 dígitos',' type="tel" inputmode="numeric" maxlength="15"')}${fl('cfD','DNI (opcional)','dni','8 dígitos',' inputmode="numeric" maxlength="12"')}</div>`;
    else h+=`<div class="cd"><span style="font-size:14px;color:#6B5E55">Dónde se le entrega. Con el enlace de Google Maps, el motorizado podrá abrir la ruta.</span>${fl('cfA','Dirección','dir','Calle, número, urbanización',' maxlength="160"')}${fl('cfU','Ubicación o referencia','ubi','Pega el enlace de Google Maps o una referencia',' maxlength="300"')}</div>`;
    if(f.msg)h+=`<div class="err">${E(f.msg)}</div>`;
    const foot=!pa?`<button type="button" class="b o" style="height:54px;font-size:16px" data-a="cl:sig">Siguiente</button>`:`<div style="display:flex;gap:10px"><button type="button" class="b" style="flex:1 1 0;height:54px;font-size:16px" data-a="cl:atras">Atrás</button><button type="button" class="b o" style="flex:1.6 1 0;height:54px;font-size:16px" data-a="cl:guardar">${f.id?'Guardar cambios':'Guardar cliente'}</button></div>`;
    return {head:top3('Clientes',f.id?'Editar cliente':'Nuevo cliente'),body:h,foot};
  }
  async function cliGuardar(){
    const f=CL.f;f.msg='';const nombre=f.nombre.trim(),tel=f.tel.trim(),dir=f.dir.trim(),ubi=f.ubi.trim();
    if(!nombre||!tel){f.paso=0;f.msg='Completa el nombre y el número.';return}if(!dir){f.msg='Escribe la dirección del cliente.';return}
    const base={nombre_completo:nombre,telefono:tel,direccion:dir,referencia:ubi||null,activo:true};
    const co=typeof extraerCoordsCliente==='function'?extraerCoordsCliente(ubi):null;if(co){base.latitud=co.lat;base.longitud=co.lng}else if(!f.id||ubi){base.latitud=null;base.longitud=null}
    const probe=await D().from('clientes').select('documento').limit(1);if(!probe.error)base.documento=f.dni.trim()||null;
    /* un cliente por nombre: si otro ya tiene ese nombre, no se duplica */
    const mismo=((C2.cli&&C2.cli.data)||[]).find(c=>agClave(cliN(c))===agClave(nombre)&&String(c.id)!==String(f.id||''));
    if(mismo&&f.id){f.msg='Ya hay otro cliente llamado «'+cliN(mismo)+'». Usa otro nombre o edita ese cliente.';return}
    const idU=f.id||(mismo&&mismo.id);
    const q=idU?await D().from('clientes').update(base).eq('id',idU).select('*').single():await D().from('clientes').insert(base).select('*').single();
    if(q.error){f.msg=q.error.message||'No se pudo guardar el cliente.';return}
    try{window.loadClientes&&window.loadClientes()}catch(_){}
    await new Promise(res=>{datosCli(true);const t=setInterval(()=>{if(C2.cli&&!C2.cli.busy){clearInterval(t);res()}},150)});
    const nuevo=(C2.cli.data||[]).find(x=>String(x.id)===String(q.data&&q.data.id));
    (window.pdExito||window.pdAviso||alert)(f.id?'Cliente actualizado':'Cliente guardado');
    CL.f=null;if(nuevo){CL.sel=nuevo;sub='cliente'}else sub=null;
  }
  async function cliBorrar(){const x=CL.sel;if(!x)return;const conf=pregunta('¿Borrar el cliente «'+cliN(x)+'»? Sus pedidos se conservan.');if(!(await conf))return;
    const q='activo' in x?await D().from('clientes').update({activo:false}).eq('id',x.id).select('id').maybeSingle():await D().from('clientes').delete().eq('id',x.id).select('id');
    if(q.error){(window.pdAviso||alert)('No se pudo borrar: '+q.error.message);return}
    try{window.loadClientes&&window.loadClientes()}catch(_){}C2.cli&&(C2.cli.t=0);datosCli(true);CL.sel=null;volverSub()}
  function volverSub(){sub=null;key='';pintar();if(history.state?.pdApp){ignorarPop=true;history.back()}}


  /* =============== EDITAR PEDIDO =============== */

  /* Confirmación propia de la app (siempre visible, nunca se queda esperando detrás de otra ventana) */
  function pregunta(t){if(window.pdVentana){const [a,...b]=String(t||'').split('\n');return window.pdVentana({ic:'q',titulo:a,html:b.length?'<p style="white-space:pre-line">'+E(b.join('\n'))+'</p>':'',botones:[{k:'0',t:'Cancelar'},{k:'1',t:'Aceptar',c:'o'}],cancelar:false}).then(v=>v==='1')}return new Promise(res=>{
    const [a,...b]=String(t||'').split('\n');const w=document.createElement('div');w.className='pdfxPregunta';w.setAttribute('data-pd-aislado','1');
    w.setAttribute('style','position:fixed;inset:0;z-index:2147483647;display:flex;align-items:flex-end;justify-content:center;background:rgba(31,26,23,.28);font-family:Inter,system-ui,sans-serif');
    w.innerHTML=`<div role="dialog" aria-modal="true" style="width:100%;max-width:560px;margin:12px;background:#fff;border-radius:22px;padding:20px 18px 16px;box-shadow:0 14px 40px rgba(31,26,23,.25);display:flex;flex-direction:column;gap:12px"><b style="font-size:19px;line-height:1.3;color:#1F1A17">${E(a)}</b>${b.length?`<div style="font-size:15px;line-height:1.5;color:#6B5E55;white-space:pre-line">${E(b.join('\n'))}</div>`:''}<div style="display:flex;gap:10px;margin-top:4px"><button type="button" data-r="0" style="flex:1;height:52px;border-radius:14px;border:1px solid #F1E4DA;background:#fff;font:700 16px Inter,system-ui,sans-serif;color:#1F1A17">Cancelar</button><button type="button" data-r="1" style="flex:1;height:52px;border-radius:14px;border:0;background:#C4410C;color:#fff;font:800 16px Inter,system-ui,sans-serif">Aceptar</button></div></div>`;
    const fin=v=>{w.remove();res(v)};w.addEventListener('click',e=>{const x=e.target.closest('[data-r]');if(x)fin(x.dataset.r==='1');else if(e.target===w)fin(false)});
    document.body.appendChild(w);setTimeout(()=>{const x=w.querySelector('[data-r="1"]');x&&x.focus()},30);
  })}
  window.pdAdmPregunta=pregunta;

  /* Mensaje listo para enviar al crear una cuenta de acceso (negocio o motorizado) */
  window.pdMensajeAcceso=async function(o){
    const neg=o.tipo!=='motorizado';let nom=o.nombre||'',tel=o.telefono||'';
    try{if(!nom||!tel){const r=neg?await D().from('negocios').select('nombre,telefono').eq('id',o.id).maybeSingle():await D().from('motorizados').select('nombre_completo,telefono').eq('id',o.id).maybeSingle();const d=r&&r.data||{};nom=nom||d.nombre||d.nombre_completo||'';tel=tel||d.telefono||''}}catch(_){}
    const link=neg?'https://pidemas.pe/negocio/':'https://pidemas.pe/motorizado/';
    const txt=neg
      ?`¡Hola${nom?', '+nom:''}! 🎉\n\nTu negocio fue *aprobado* en *Pidemás Delivery*. Ya creamos tu cuenta de acceso a tu panel:\n\n👤 *Usuario (correo):* ${o.email}\n🔑 *Contraseña:* ${o.password}\n\n👉 Ingresa aquí: ${link}\n\n🔒 *Por tu seguridad, cambia tu contraseña* apenas ingreses: Perfil › Contraseña. No la compartas con nadie.\n\n📍 *Muy importante: configura bien tu ubicación.* Entra a Perfil › Ubicación y marca en el mapa el punto exacto de tu local. Con ese punto tus clientes ven al instante cuánto cuesta el delivery desde tu negocio hasta su casa, y el motorizado llega directo a recoger. Si la ubicación está mal, el costo del delivery saldrá mal.\n\n📖 *Guía paso a paso* (cómo armar tu carta, recibir pedidos, cobrar y entregar al motorizado): https://pidemas.pe/guia/\n\nDesde tu panel recibes tus pedidos, subes tus productos y configuras tu horario. Cualquier duda, escríbenos por aquí. ¡Bienvenido a Pidemás! 🧡`
      :`¡Hola${nom?', '+nom.split(' ')[0]:''}! 🎉\n\nTu registro como *motorizado* fue *aprobado* en *Pidemás Delivery*. Ya creamos tu cuenta de acceso a la app:\n\n👤 *Usuario (correo):* ${o.email}\n🔑 *Contraseña:* ${o.password}\n\n👉 Ingresa aquí: ${link}\n\n🔒 *Por tu seguridad, cambia tu contraseña* apenas ingreses. No la compartas con nadie.\n\nAhí verás los pedidos que te asignemos. Cualquier duda, escríbenos por aquí. ¡Bienvenido al equipo! 🧡`;
    const dig=String(tel).replace(/\D/g,''),wa=dig?(dig.length===9?'51'+dig:dig):'';
    const Es=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const bs=[];if(wa)bs.push({k:'wa',t:'Enviar por WhatsApp',sub:tel?'Al '+tel:'',c:'g',queda:true});bs.push({k:'copiar',t:'Copiar mensaje',c:wa?'':'o',queda:true});
    if(!window.pdVentana){try{await navigator.clipboard.writeText(txt)}catch(_){}(window.pdAviso||alert)('Cuenta creada. Copiamos el mensaje para enviarlo.');return}
    window.pdVentana({ic:'ok',titulo:o.titulo||'Cuenta creada',cancelar:'Cerrar',
      html:`<p>Envíale este mensaje ${neg?'al negocio':'al motorizado'}. Puedes editarlo antes de enviarlo.</p><label for="pdMaTx" style="position:absolute;width:1px;height:1px;overflow:hidden">Mensaje</label><textarea id="pdMaTx" rows="11">${Es(txt)}</textarea>`,
      botones:bs,
      alTocar:async(k,r,x)=>{const t=r.getElementById('pdMaTx').value;
        if(k==='wa'){window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(t),'_blank','noopener');return}
        try{await navigator.clipboard.writeText(t)}catch(_){const a=r.getElementById('pdMaTx');a.select();try{document.execCommand('copy')}catch(__){}}
        const o2=x.innerHTML;x.textContent='¡Copiado!';setTimeout(()=>{x.innerHTML=o2},1800)}});
  };

  /* Eliminar una categoría: el usuario elige si borra también sus productos */
  window.pdElegirBorrarCat=function(nombre,n){
    const Es=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    if(window.pdVentana)return window.pdVentana({ic:'mal',titulo:'¿Eliminar la categoría «'+nombre+'»?',
      html:n?`<p>Tiene <b style="color:#1F1A17">${n} producto${n===1?'':'s'}</b>. Si no marcas la casilla, ${n===1?'se queda':'se quedan'} en tu carta sin categoría.</p><label style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;border:1px solid #F1E4DA;cursor:pointer;font-size:15px;font-weight:700"><input type="checkbox" id="pdCatTodo" style="width:22px;height:22px;accent-color:#B42318;flex:0 0 auto;margin:0">Borrar también ${n===1?'su producto':'sus '+n+' productos'}</label>`:'',
      botones:[{k:'',t:'Cancelar'},{k:'si',t:'Sí, continuar',c:'r'}],cancelar:false,
      valor:(k,r)=>k==='si'?(r.getElementById('pdCatTodo')&&r.getElementById('pdCatTodo').checked?'todo':'solo'):null});
    return Promise.resolve(confirm('¿Eliminar la categoría «'+nombre+'»?')?'solo':null)};
  window.pdElegirBorrarCatViejo=function(nombre,n){return new Promise(res=>{
    const Es=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const w=document.createElement('div');w.className='pdfxPregunta';w.setAttribute('data-pd-aislado','1');
    w.setAttribute('style','position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:rgba(31,26,23,.4);padding:16px;box-sizing:border-box;font-family:Inter,system-ui,sans-serif');
    const bt='width:100%;min-height:52px;border-radius:14px;font:800 16px Inter,system-ui,sans-serif;padding:10px 14px;cursor:pointer;';
    w.innerHTML=`<div role="dialog" aria-modal="true" style="width:100%;max-width:420px;background:#fff;border-radius:22px;padding:20px 16px 14px;box-shadow:0 14px 40px rgba(31,26,23,.25);display:flex;flex-direction:column;gap:10px;text-align:center">
      <span style="width:52px;height:52px;border-radius:50%;background:#FDE8E8;color:#B42318;display:flex;align-items:center;justify-content:center;margin:0 auto"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></span>
      <b style="font-size:19px;line-height:1.3;color:#1F1A17">Eliminar «${Es(nombre)}»</b>
      <div style="font-size:15px;line-height:1.45;color:#6B5E55">${n?`Esta categoría tiene <b style="color:#1F1A17">${n} producto${n===1?'':'s'}</b>. ¿Qué quieres hacer con ${n===1?'él':'ellos'}?`:'Esta categoría no tiene productos.'}</div>
      ${n?`<button type="button" data-r="todo" style="${bt}border:0;background:#B42318;color:#fff">${n===1?'Borrar la categoría y su producto':'Borrar la categoría y sus '+n+' productos'}</button>
      <button type="button" data-r="solo" style="${bt}border:1px solid #F1E4DA;background:#fff;color:#1F1A17">Borrar solo la categoría<br><span style="font-weight:600;font-size:13px;color:#6B5E55">Los productos se quedan, sin categoría</span></button>`
      :`<button type="button" data-r="solo" style="${bt}border:0;background:#B42318;color:#fff">Sí, eliminar</button>`}
      <button type="button" data-r="" style="${bt}border:0;background:transparent;color:#6B5E55;font-weight:700">Cancelar</button></div>`;
    const fin=v=>{w.remove();res(v||null)};w.addEventListener('click',e=>{const x=e.target.closest('[data-r]');if(x)fin(x.dataset.r);else if(e.target===w)fin(null)});
    document.body.appendChild(w);
  })};

  /* Si el pedido ya fue cobrado y se corrige el método de pago, se corrige también la caja del motorizado */
  async function cajaPorCambioPago(o,antes,despues){
    try{
      const a=String(antes||'').toLowerCase(),d=String(despues||'').toLowerCase();if(a===d||!o.motorizado_id)return;
      const pagadoAntes=String(o.pago_servicio_momento||'').toLowerCase()==='pagado'||o.pago_acordado==='pagado';
      if(pagadoAntes)return;
      if(!((o.pago_confirmado===true&&Number(o.monto_recibido)>0)||String(o.estado||'').toLowerCase()==='entregado'))return;
      const tot=Math.round((Number(o.total)||0)*100)/100;if(!(tot>0))return;
      const {data:mv}=await D().from('movimientos_caja').select('id,tipo,monto,descripcion').eq('pedido_id',o.id).eq('motorizado_id',o.motorizado_id);
      const L=mv||[],cobro=L.filter(x=>x.tipo==='ingreso'&&!/^(INGRESO MANUAL|EFECTIVO PARA (?:COMPRA|ENCOMIENDA))/i.test(String(x.descripcion||''))).reduce((a,x)=>a+Number(x.monto||0),0),corr=L.filter(x=>/Corrección de pago/i.test(String(x.descripcion||''))).reduce((a,x)=>a+(x.tipo==='ingreso'?1:-1)*Number(x.monto||0),0);
      const enCaja=Math.round((cobro+(corr<0?corr:0))*100)/100;
      if(d==='efectivo'&&enCaja<0.005)await D().from('movimientos_caja').insert({motorizado_id:o.motorizado_id,pedido_id:o.id,tipo:'ingreso',monto:tot,descripcion:'Cobro de pedido · Corrección de pago: Yape → Efectivo (Pidemás) · total S/ '+tot.toFixed(2)});
      else if(d!=='efectivo'&&enCaja>0.004)await D().from('movimientos_caja').insert({motorizado_id:o.motorizado_id,pedido_id:o.id,tipo:'retiro',monto:enCaja,descripcion:'Corrección de pago: Efectivo → Yape (Pidemás) · ese cobro no fue en efectivo'});
      /* el cobro registrado también cambia de método: así un pago que pasó a efectivo ya no queda en «Yape por confirmar» */
      try{await D().from('cobros').update({metodo_pago:d==='efectivo'?'efectivo':d}).eq('pedido_id',o.id).is('yape_recibido_en',null)}catch(_){}
      try{C2.caja&&(C2.caja.t=0)}catch(_){}
    }catch(e){console.warn('[caja] corrección de pago',e)}
  }
  /* Si se edita el monto de un pedido ya cobrado, la caja se corrige para que cuadre:
     - cobrado en efectivo: movimiento «Corrección de monto (Pidemás)» por la diferencia en la caja del motorizado
     - cobrado por Yape y aún no confirmado: se actualiza el monto del cobro en «Yape por confirmar» */
  const aCobrarDe=x=>{const pg=String(x.pago_servicio_momento||'').toLowerCase()==='pagado'||x.pago_acordado==='pagado'||/servicio marcado como pagado/i.test(String(x.observaciones||''));if(pg)return 0;
    return Math.round((x.pago_acordado==='solo_delivery'?Number(x.costo_delivery)||0:Number(x.total)||0)*100)/100};
  async function cajaPorCambioMonto(o,antes,metAntes){
    try{
      /* compra: si cambia lo que se gastó y el motorizado ya registró el pago de la compra, se corrige ese gasto en su caja */
      const sA=Math.round((Number(antes.subtotal)||0)*100)/100,sD=Math.round((Number(o.subtotal)||0)*100)/100;
      if(/compra/i.test(String(o.tipo_servicio||''))&&o.motorizado_id&&Math.abs(sD-sA)>=0.005){
        const {data:g}=await D().from('movimientos_caja').select('id').eq('pedido_id',o.id).eq('motorizado_id',o.motorizado_id).eq('tipo','retiro').ilike('descripcion','PAGO DE COMPRA%').limit(1);
        if(g&&g.length){const dg=Math.round((sD-sA)*100)/100;const {error}=await D().from('movimientos_caja').insert({motorizado_id:o.motorizado_id,pedido_id:o.id,tipo:dg>0?'retiro':'ingreso',monto:Math.abs(dg),descripcion:'Corrección de gasto de compra (Pidemás) · Pedido '+ref(o.id)+' · antes S/ '+sA.toFixed(2)+' · ahora S/ '+sD.toFixed(2)});if(error)throw error}}
      if(String(metAntes||'').toLowerCase()!==String(o.metodo_pago||'').toLowerCase())return;/* el cambio de método ya se corrige aparte */
      const a=aCobrarDe(antes),d=aCobrarDe(o),dif=Math.round((d-a)*100)/100;if(Math.abs(dif)<0.005)return;
      const cobrado=(o.pago_confirmado===true&&antes.pago_confirmado===true)||String(o.estado||'').toLowerCase()==='entregado';if(!cobrado)return;
      if(String(o.metodo_pago||'').toLowerCase()==='efectivo'&&o.motorizado_id){
        const {data:mv}=await D().from('movimientos_caja').select('id').eq('pedido_id',o.id).eq('motorizado_id',o.motorizado_id).eq('tipo','ingreso').not('descripcion','ilike','INGRESO MANUAL%').not('descripcion','ilike','EFECTIVO PARA %').limit(1);
        if(mv&&mv.length){const {error}=await D().from('movimientos_caja').insert({motorizado_id:o.motorizado_id,pedido_id:o.id,tipo:dif>0?'ingreso':'retiro',monto:Math.abs(dif),descripcion:'Corrección de monto (Pidemás) · Pedido '+ref(o.id)+' · antes S/ '+a.toFixed(2)+' · ahora S/ '+d.toFixed(2)});if(error)throw error}}
      else{const {data:c}=await D().from('cobros').select('id,yape_recibido_en').eq('pedido_id',o.id).maybeSingle();
        if(c&&!c.yape_recibido_en){const {error}=await D().from('cobros').update({monto:d}).eq('id',c.id);if(error)throw error}
        else if(c&&c.yape_recibido_en)(window.pdAviso||alert)('Ojo: el Yape de este pedido ya se confirmó por '+M(a)+'. El nuevo monto es '+M(d)+': cobra o devuelve la diferencia de '+M(Math.abs(dif))+'.')}
      try{C2.caja&&(C2.caja.t=0)}catch(_){}
    }catch(e){console.warn('[caja] corrección de monto',e);(window.pdAviso||alert)('El pedido se guardó, pero no se pudo corregir la caja: '+(e.message||e))}
  }
  const PE={f:null};
  const conTiempo=(p,ms)=>Promise.race([p,new Promise((_,no)=>setTimeout(()=>no(new Error('No hubo respuesta del servidor. Revisa tu internet y vuelve a intentar.')),ms||20000))]);
  /* --- servicios: mismos campos y mismo orden que el formulario con el que se crean --- */
  const segs=t=>String(t||'').split(/\s*\|\s*/).map(x=>x.trim()).filter(Boolean);
  const tagDe=(obs,...ls)=>{for(const x of segs(obs))for(const l of ls){const m=x.match(new RegExp('^'+l.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*:\\s*(.*)$','i'));if(m)return m[1].trim()}return ''};
  const esMarca=x=>/^__PIDEMAS_|^\[COMPROBANTE|^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+){2,}$/.test(x)||/^(Paga con|PAGA_CON)/i.test(x);
  const PAGO_RX=/^(Servicio marcado como PAGADO|Pago en efectivo:|Pago por Yape:|Paga quien (envía|recibe)|El cliente paga al final)/i;
  function rehacerObs(obs,tags,libre){
    const keys=Object.keys(tags).map(k=>k.toLowerCase());
    const quedan=segs(obs).filter(x=>{const lab=(x.split(':')[0]||'').trim().toLowerCase();if(keys.includes(lab))return false;if(PAGO_RX.test(x))return false;if(libre!==undefined&&!esMarca(x)&&!/^[^:]{2,40}:/.test(x))return false;return true});
    const nuevos=Object.keys(tags).filter(k=>String(tags[k]||'').trim()).map(k=>k+': '+String(tags[k]).trim());
    return nuevos.concat(libre!==undefined&&String(libre).trim()?[String(libre).trim()]:[],quedan).join(' | ');
  }
  const libreDe=(obs,labels)=>segs(obs).filter(x=>!esMarca(x)&&!PAGO_RX.test(x)&&!/^[^:]{2,40}:/.test(x)).join(' · ');
  const coordsDe=t=>{const m=/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/.exec(decodeURIComponent(String(t||'')));return m?{lat:Number(m[1]),lng:Number(m[2])}:null};
  const OPS={encTipoEnvio:[['sobre','Sobre'],['paquete_pequeno','Paquete pequeño'],['paquete_mediano','Paquete mediano'],['paquete_grande','Paquete grande']],encTipoPago:[['pago_en_agencia','Pago en agencia'],['pago_a_destino','Pago a destino']],admCompraComprobante:[['boleta','Boleta'],['factura','Factura']]};
  const optsDe=id=>id==='encAgencia'?(PE.ags||[]).map(a=>[a.id,a.nombre]):(OPS[id]||[]);
  function svcDatos(o,sv){
    const obs=o.observaciones||'',pagado=String(o.pago_servicio_momento||'').toLowerCase()==='pagado'||/Servicio marcado como PAGADO/i.test(obs);
    const met=pagado?'pagado':String(o.pago_servicio_momento||'').toLowerCase()==='al_final'?'al_final':String(o.metodo_pago||'efectivo').toLowerCase();
    const b={id:o.id,sv,tipo:sv==='Recojo y entrega'?'recojo':sv==='Compra'?'compra':'enc',msg:'',costo:String(Number(sv==='Compra'?o.costo_delivery:o.total)||0)};
    if(b.tipo==='recojo')Object.assign(b,{anom:o.recojo_a_nombre||tagDe(obs,'Pedido a nombre de'),rnom:o.nombre_remitente||o.nombre_cliente||'',rtel:o.telefono_remitente||o.telefono_cliente||'',rdir:o.direccion_recojo||'',rref:o.referencia_recojo||tagDe(obs,'Referencia de recojo'),rubi:o.ubicacion_recojo||tagDe(obs,'Ubicación de recojo','Ubicacion de recojo'),
      enom:o.nombre_receptor||'',etel:o.telefono_receptor||'',edir:o.direccion_entrega||'',eref:o.referencia_entrega||'',eubi:o.ubicacion_entrega||tagDe(obs,'Ubicación de entrega','Ubicacion de entrega'),lleva:o.que_se_lleva||tagDe(obs,'Qué se lleva'),
      pago:met,quien:o.quien_paga||(/^recojo_/.test(String(o.pago_servicio_momento||''))?'envia':'recibe'),
      pide:/quien recibe/i.test(tagDe(obs,'Pide el servicio'))?'recibe':'envia',
      pts:(Array.isArray(o.puntos_recojo)?o.puntos_recojo:[]).map(x=>({nom:x.nombre||'',tel:x.telefono||'',dir:x.direccion||'',ref:x.referencia||'',ubi:x.ubicacion||'',que:x.que||'',anom:x.a_nombre||'',cd:x.costo_delivery==null?'':String(x.costo_delivery)}))});
    if(b.tipo==='enc')b.quien=o.quien_paga==='recibe'?'recibe':'envia';
    if(b.tipo==='enc')b.pide=/quien recibe/i.test(tagDe(obs,'Pide el servicio'))||String(o.quien_paga||'')==='recibe'?'recibe':'envia';
    if(b.tipo==='recojo'){const k=(Array.isArray(o.puntos_recojo)?o.puntos_recojo:[]).findIndex(x=>x&&x.paga_aqui);b.pagapt=String(k>=0?k+2:1);
      b.ents=(Array.isArray(o.puntos_entrega)?o.puntos_entrega:[]).filter(Boolean).map(x=>({nom:x.nombre||'',tel:x.telefono||'',dir:x.direccion||'',ref:x.referencia||'',ubi:x.ubicacion||'',que:x.que||''}))}
    else if(b.tipo==='compra')Object.assign(b,{nom:o.nombre_cliente||'',tel:o.telefono_cliente||'',dir:o.direccion_entrega||'',ref:o.referencia_entrega||'',ubi:o.ubicacion_entrega||tagDe(obs,'Ubicación','Ubicación del cliente'),
      lugar:o.direccion_recojo||o.lugar_compra||tagDe(obs,'Lugar de compra'),detalle:o.detalle_compra||tagDe(obs,'Compra solicitada'),obs:libreDe(obs),comp:o.tipo_comprobante||tagDe(obs,'Comprobante').replace(/^No especificado$/i,''),doc:o.documento_comprobante||tagDe(obs,'DNI/RUC'),cnom:tagDe(obs,'Nombre comprobante'),craz:tagDe(obs,'Razón social'),cdir:tagDe(obs,'Dirección fiscal'),pago:met,pts:(Array.isArray(o.puntos_recojo)?o.puntos_recojo:[]).filter(Boolean).map(x=>({nom:x.nombre||'',ubi:x.ubicacion||'',que:x.que||'',obs:x.obs||'',cd:x.costo_delivery==null?'':String(x.costo_delivery)}))});
    if(b.tipo==='compra'){b.para=o.nombre_receptor||o.telefono_receptor?'otra':'mismo';b.enom=o.nombre_receptor||'';b.etel=o.telefono_receptor||'';b.quien=o.quien_paga==='recibe'?'recibe':'envia';b.fotos=Array.isArray(o.compra_fotos)?o.compra_fotos.slice():[];if(b.pago==='pagado')b.pago='efectivo'}
    if(b.tipo==='compra'){const mu=String(b.lugar||'').match(/https?:\/\/\S+/);b.lugarUrl=mu?mu[0]:'';b.lugar=String(b.lugar||'').replace(/https?:\/\/\S+/g,'').replace(/[\s·–-]+$/,'').trim()}
    else{const m=String(o.pago_servicio_momento||'').toLowerCase();
      Object.assign(b,{rnom:o.nombre_remitente||o.nombre_cliente||'',rdni:o.dni_remitente||tagDe(obs,'DNI de quien envía'),rtel:o.telefono_remitente||o.telefono_cliente||'',rdir:o.direccion_recojo||'',rref:o.referencia_recojo||tagDe(obs,'Referencia de recojo'),rubi:o.ubicacion_recojo||tagDe(obs,'Ubicación de recojo'),
      enom:o.nombre_receptor||'',edni:o.dni_receptor||tagDe(obs,'DNI de quien recibe'),etel:o.telefono_receptor||'',tenv:o.tipo_encomienda||tagDe(obs,'Tipo de encomienda'),obs:libreDe(obs),
      ag:o.agencia_destino||'',agubi:o.ubicacion_entrega||(o.latitud_entrega&&o.longitud_entrega?'https://maps.google.com/?q='+o.latitud_entrega+','+o.longitud_entrega:''),dest:o.destino_final||o.direccion_entrega||'',tpago:o.tipo_pago_encomienda||'',comp:o.tipo_comprobante||tagDe(obs,'Comprobante').replace(/^No especificado$/i,''),doc:o.documento_comprobante||tagDe(obs,'DNI/RUC'),cnom:tagDe(obs,'Nombre comprobante'),craz:tagDe(obs,'Razón social'),cdir:tagDe(obs,'Dirección fiscal'),
      pago:pagado?'pagado':m==='al_final'?'al_final':m==='recojo_yape'?'yape':String(o.metodo_pago||'efectivo').toLowerCase()==='yape'?'yape':'efectivo'});
      /* al editar: delivery de cada paquete (el paquete 1 es lo que resta del total) */
      const px=(Array.isArray(o.paquetes_extra)?o.paquetes_extra:[]).filter(x=>x&&Number(x.numero)>1);
      if(o.id&&px.length){const nn=v=>v===null||v===undefined||v===''?NaN:Number(v),ok=px.every(x=>Number.isFinite(nn(x.costo_delivery))),ex=ok?px.reduce((a,x)=>a+nn(x.costo_delivery),0):0,tot=Number(o.costo_delivery)||Number(o.total)||0;
        b.cdx=[{n:1,ag:o.agencia_destino||'',dest:o.destino_final||'',v:ok?String(Math.max(0,Math.round((tot-ex)*100)/100)):''}].concat(px.map(x=>({n:+x.numero,ag:x.agencia||'',dest:x.destino||'',v:ok?String(nn(x.costo_delivery)):''})))}}
    if((b.tipo==='recojo'||b.tipo==='compra')&&b.pts&&b.pts.length){const ex=b.pts.map(q=>cdN(q.cd));if(ex.every(Number.isFinite))b.cdp=String(Math.max(0,Math.round((Number(b.costo)-ex.reduce((a,c)=>a+c,0))*100)/100));else if(b.pts.every(q=>q.cd===''))/* pedidos antiguos sin delivery por punto: todo en el punto 1 */{b.cdp=b.costo;b.pts.forEach(q=>q.cd='0')}else b.cdp=''}
    return b;
  }
  /* Pedir un texto y avisar con ventanas propias: no esperan en la cola de avisos viejos, así nunca quedan escondidas */
  function pedirL(t,v){if(!window.pdVentana)return Promise.resolve(window.pdPedir?window.pdPedir(t,v):prompt(t,v||''));const [a,...b]=String(t||'').split('\n');
    return window.pdVentana({ic:'q',titulo:a,html:(b.length?'<p style="white-space:pre-line;margin:0 0 10px">'+E(b.join('\n'))+'</p>':'')+'<input id="pdLx" value="'+E(v||'')+'" style="width:100%;box-sizing:border-box;height:52px;border-radius:14px;border:1.5px solid #F1E4DA;padding:0 14px;font:inherit;font-size:16px">',
      botones:[{k:'0',t:'Cancelar'},{k:'1',t:'Aceptar',c:'o'}],cancelar:false,valor:(k,r)=>{if(k!=='1')return null;const i=r.getElementById('pdLx');return 'v:'+(i?i.value:'')}}).then(x=>x&&String(x).startsWith('v:')?String(x).slice(2):null)}
  function avisoL(t,txt,ok){if(!window.pdVentana)return (window.pdAviso||alert)(t+(txt?'\n'+txt:''));return window.pdVentana({ic:ok?'ok':'mal',titulo:t,html:txt?'<p style="margin:0">'+E(txt)+'</p>':'',botones:[{k:'1',t:'Aceptar',c:'o'}],cancelar:false})}
  /* Eliminar los pedidos marcados: confirma, avisa al motorizado, borra y muestra el resultado */
  async function borrarSel(s){
    const ids=[...s].map(String);const ped=ids.map(id=>L().find(o=>String(o.id)===id)||{id});
    const n=ids.length,txt=n===1?'el pedido '+ref(ids[0]):'los '+n+' pedidos marcados';
    const conf=await pregunta('¿Eliminar definitivamente '+txt+'?\nLos motorizados dejarán de verlos y recibirán una notificación.');
    if(!conf)return;
    let ok=0;const mal=[];
    for(const p of ped){
      try{
        try{if(typeof notifyMotoOrderChange==='function')await notifyMotoOrderChange(p,'Pedido eliminado por Pidemás','El pedido '+ref(p.id)+' fue eliminado por administración.','pedido_eliminado')}catch(_){}
        const d1=await D().from('detalle_pedidos').delete().eq('pedido_id',p.id);if(d1.error)throw d1.error;
        const d2=await D().from('pedidos').delete().eq('id',p.id).select('id');if(d2.error)throw d2.error;
        if(Array.isArray(d2.data)&&!d2.data.length)throw new Error('la base no permitió borrarlo');
        ok++;s.delete(String(p.id));try{if(Array.isArray(allOrders)){const i=allOrders.findIndex(o=>String(o.id)===String(p.id));if(i>=0)allOrders.splice(i,1)}}catch(_){}
      }catch(e){console.error('Eliminar pedido',p.id,e);mal.push(ref(p.id)+' ('+(e?.message||e)+')')}
    }
    try{await window.loadOrders()}catch(_){}
    if(mal.length)avisoL('Se eliminaron '+ok+' de '+n,'No se pudo eliminar: '+mal.join(', '),false);
    else avisoL(ok===1?'Pedido eliminado':ok+' pedidos eliminados','',true);
  }
  /* QR Yape de Pidemás (config/yape.json); se lee una vez y se repinta cuando llega */
  let YCFG=null,YCARGA=false;
  function yapeCfg(){if(!YCFG&&!YCARGA){YCARGA=true;leerCfg().then(c=>{YCFG=Object.assign({url:'',numero:'986233533',titular:'Grupo Pidemás EIRL'},c||{});key='';pintar()}).catch(()=>{YCARGA=false})}
    return YCFG||{url:'',numero:'986233533',titular:'Grupo Pidemás EIRL'}}
  function vueltoTxt(f){const c=Number(String(f.costo||'').replace(',','.'))||0,pc=Number(String(f.pagacon||'').replace(',','.'))||0;
    if(f.tipo!=='compra'&&pc>0&&c>0)return pc+0.004<c?`<div class="vto bad"><span>Es menos que el servicio</span><b>${M(c)}</b></div>`:(pc-c>0.004?`<div class="vto"><span>Su vuelto</span><b>${M(pc-c)}</b></div>`:`<div class="vto"><span>Paga exacto</span><b>Sin vuelto</b></div>`);
    if(f.tipo==='compra'&&pc>0)return `<div class="vto info"><span>El vuelto sale con el total de la compra</span><b>${M(pc)}</b></div>`;
    return `<span style="color:#6B5E55">Así el motorizado sabe cuánto sencillo llevar.</span>`}
  function svcForm(f){if(f.tipo==='enc'&&f.nuevo&&!f.agG)f.agG=[1+(f.paqs||[]).length];
    const fl=(id,l,k,ph,o)=>`<div class="fld"><label for="${id}">${l}</label><input id="${id}" value="${E(f[k]??'')}" data-in="pe:${k}"${ph?` placeholder="${E(ph)}"`:''}${o||''}></div>`;
    const fotosCompra=f=>{const L=f.fotos||[];
      return `<div class="fld"><label>Fotos de la compra <span style="font-weight:500;color:#6B5E55">(opcional)</span></label>`+
        (L.length?`<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">${L.map((u,i)=>`<div style="position:relative;aspect-ratio:1/1;border-radius:12px;overflow:hidden;border:1px solid #F1E4DA;background:#FFF9F5"><img src="${E(u)}" alt="Foto ${i+1} de la compra" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block"><button type="button" data-a="pe:fotox:${i}" aria-label="Quitar foto ${i+1}" style="position:absolute;top:4px;right:4px;width:32px;height:32px;border-radius:50%;border:0;background:rgba(31,26,23,.72);color:#FFFFFF;font-size:20px;line-height:1;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer">×</button></div>`).join('')}</div>`:'')+
        (f.subiendo?`<div class="load">Subiendo ${f.subiendo} foto${f.subiendo===1?'':'s'}…</div>`:'')+
        `<label class="b soft" style="cursor:pointer">${L.length?'Agregar más fotos':'Agregar fotos'}<input type="file" accept="image/*" multiple data-foto-compra="1" hidden></label>`+
        `<span style="font-size:13px;color:#6B5E55">Fotos del producto, la lista o la marca, para que el motorizado compre lo correcto.</span></div>`};
    const ta=(id,l,k,ph)=>`<div class="fld"><label for="${id}">${l}</label><textarea id="${id}" data-in="pe:${k}" placeholder="${E(ph||'')}" style="min-height:96px;padding:14px 16px;border-radius:14px;border:1.5px solid #F1E4DA;font:inherit;font-size:16px;width:100%;box-sizing:border-box">${E(f[k]??'')}</textarea></div>`;
    const sl=(id,l,k,ops,ph)=>`<div class="fld"><label for="${id}">${l}</label><select id="${id}" data-in="pe:${k}" style="height:56px;border-radius:14px;border:1.5px solid #F1E4DA;padding:0 14px;font:inherit;font-size:16px;font-weight:700;width:100%;background:#fff">${ph?`<option value="">${E(ph)}</option>`:''}${ops.map(x=>`<option value="${E(x[0])}"${String(f[k])===String(x[0])?' selected':''}>${E(x[1])}</option>`).join('')}${f[k]&&!ops.some(x=>String(x[0])===String(f[k]))?`<option value="${E(f[k])}" selected>${E(f[k])}</option>`:''}</select></div>`;
    const sg=(l,k,ops)=>`<div class="fld"><label>${l}</label><div class="opc">${ops.map(x=>`<button type="button" class="${String(f[k]??'').toLowerCase()===String(x[0]).toLowerCase()?'on':''}" data-a="pe:set:${k}:${E(x[0])}">${E(x[1])}</button>`).join('')}</div></div>`;
    const card=(t,h)=>`<!--cd:${t}--><div class="cd nsq"><div class="lbl">${t}</div>${h}</div>`;
    /* igual que en la Tienda: Boleta pide DNI y nombre; Factura pide RUC, razón social y dirección fiscal (uno debajo del otro) */
    const compCard=()=>{const oc=optsDe('admCompraComprobante'),cp=String(f.comp||'').toLowerCase();
      return card('Información del comprobante',tb('Comprobante (opcional)','comp',(oc.length?oc:[['boleta','Boleta'],['factura','Factura']]).filter(x=>x[0]),true)+
        (cp==='boleta'?fl('peDc','DNI','doc','',' inputmode="numeric" maxlength="8"')+fl('peCn','Nombre','cnom','')
        :cp==='factura'?fl('peDc','RUC','doc','',' inputmode="numeric" maxlength="11"')+fl('peCz','Razón social','craz','')+fl('peCf','Dirección fiscal','cdir',''):''))};
    const mp=(k,dk,t)=>`<button type="button" class="b" style="height:44px;margin-top:-4px" data-a="pe:mapa:${k}:${dk}:${encodeURIComponent(t)}">${coordsDe(f[k])?'Cambiar en el mapa':'Marcar en el mapa'}</button>`;
    const tel=' type="tel" inputmode="tel" maxlength="20"';
    /* Botones grandes como en la tienda (dos por fila) */
    const bG=(on,t,a)=>`<button type="button" style="height:58px;border-radius:16px;border:1.5px solid ${on?'#C4410C':'#F1E4DA'};background:${on?'#FFF4EC':'#FFFFFF'};color:#1F1A17;font:inherit;font-size:17px;font-weight:${on?800:700};cursor:pointer${on?';box-shadow:inset 0 0 0 1px #C4410C':''}" aria-pressed="${on}" data-a="${E(a)}">${E(t)}</button>`;
    const tb=(l,k,ops,opc)=>`<div class="fld"><label>${l}</label><div style="display:grid;grid-template-columns:repeat(${ops.length},minmax(0,1fr));gap:10px">${ops.map(x=>{const on=String(f[k]??'').toLowerCase()===String(x[0]).toLowerCase();return bG(on,x[1],'pe:set:'+k+':'+(on&&opc?'':x[0]))}).join('')}</div></div>`;
    /* Efectivo: con cuánto paga y vuelto. Yape: el QR de Pidemás (el que se configura en Más › QR Yape) */
    const pagoExtra=()=>{
      if(f.pago==='efectivo'){const c=Number(String(f.costo||'').replace(',','.'))||0,vals=[];if(f.tipo!=='compra'&&c>0)[10,20,50,100,200].forEach(z=>{const r=Math.ceil(c/z)*z;if(r>c+0.004&&!vals.includes(r))vals.push(r)});
        const qv=f.tipo==='compra'||!(c>0)?[]:[c].concat(vals.slice(0,3));
        return `<div class="fld"><label for="pePc">¿Con cuánto paga?</label><input id="pePc" inputmode="decimal" placeholder="${c>0&&f.tipo!=='compra'?E(M(c)):'Ej. 50'}" value="${E(f.pagacon??'')}" data-in="pe:pagacon"></div>`+
          (qv.length?`<div class="chips" style="flex-wrap:wrap;margin-top:-4px">${qv.map((z,i)=>`<button type="button" class="${String(f.pagacon??'')!==''&&Number(f.pagacon)===z?'on':''}" data-a="pe:set:pagacon:${z.toFixed(2)}">${i?'S/ '+z:'Exacto'}</button>`).join('')}</div>`:'')+
          `<div id="peVu" style="font-size:14px;line-height:1.4">${vueltoTxt(f)}</div>`}
      if(f.pago==='yape'){const y=yapeCfg();
        return `<div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px;border-radius:16px;background:#FFFFFF;border:1px dashed #E3CFC2;text-align:center">${y.url?`<img src="${E(y.url)}" alt="QR de Yape de ${E(y.titular)}" style="width:200px;max-width:100%;height:auto;border-radius:12px">`:'<div style="width:200px;height:200px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:#FFF4EC;color:#9A330A;font-size:14px;font-weight:700">Cargando QR…</div>'}<b style="font-size:15px">Yape a ${E(y.titular)}</b><span style="font-size:14px;color:#6B5E55">${E(y.numero)} · el cliente paga al QR de Pidemás</span></div>`}
      return ''};
    const cdForm=()=>{const n=1+(f.paqs||[]).length,su=cdSuma(f);let x='<span style="font-size:14px;color:#6B5E55">Escribe el delivery de cada paquete. Va en el mensaje de su guía y el total del servicio es la suma.</span>';
      for(let k=0;k<n;k++){const ag=String(pkGet(f,k,'ag')||'').trim(),ds=String(pkGet(f,k,'dest')||'').trim();
        x+=`<div class="fld"><label>Delivery · paquete ${k+1}${ag||ds?' · '+E([ag,ds].filter(Boolean).join(' → ')):''}</label><input data-in="pe:pk:${k}:cd" value="${E(pkGet(f,k,'cd')||'')}" placeholder="S/ 0.00" inputmode="decimal"></div>`}
      return x+`<div id="peCdTot" style="font-size:15px;font-weight:800">Total del servicio: ${Number.isFinite(su)?M(su):'S/ —'}</div>`};
    const cdxForm=()=>{const su=cdxSuma(f);return '<span style="font-size:14px;color:#6B5E55">Delivery de cada paquete. El total del servicio es la suma.</span>'+
      f.cdx.map((x,i)=>`<div class="fld"><label>Delivery · paquete ${x.n}${x.ag||x.dest?' · '+E([x.ag,x.dest].filter(Boolean).join(' → ')):''}</label><input data-in="pe:cdx:${i}" value="${E(x.v||'')}" placeholder="S/ 0.00" inputmode="decimal"></div>`).join('')+
      `<div id="peCdTot" style="font-size:15px;font-weight:800">Total del servicio: ${Number.isFinite(su)?M(su):'S/ —'}</div>`};
    const ptForm=()=>{const su=ptSuma(f),cmp=f.tipo==='compra',L=[{n:1,nom:cmp?f.lugar:f.rnom,dir:cmp?'':f.rdir,v:f.cdp,k:'pe:ptcd1'}].concat((f.pts||[]).map((q,i)=>({n:i+2,nom:q.nom,dir:q.dir,v:q.cd,k:'pe:pt:'+i+':cd'})));
      return `<span style="font-size:14px;color:#6B5E55">Escribe el delivery de cada ${cmp?'lugar de compra':'punto de recojo'}. El total del servicio es la suma.</span>`+L.map(x=>`<div class="fld"><label>Delivery · ${cmp?'lugar':'punto'} ${x.n}${String(x.nom||x.dir||'').trim()?' · '+E(String(x.nom||x.dir).trim()):''}</label><input data-in="${x.k}" value="${E(x.v||'')}" placeholder="S/ 0.00" inputmode="decimal"></div>`).join('')+
        `<div id="peCdTot" style="font-size:15px;font-weight:800">Total del servicio: ${Number.isFinite(su)?M(su):'S/ —'}</div>`};
    const costo=card('Información de pago del servicio',(cdMulti(f)?cdForm():ptMulti(f)?ptForm():f.cdx&&f.tipo==='enc'?cdxForm():fl('peCo','Costo del servicio','costo','S/ 0.00',' inputmode="decimal"')+`<div class="chips" style="flex-wrap:wrap">${[5,6,7,8,10,12,15].map(v=>`<button type="button" class="${Number(f.costo)===v?'on':''}" data-a="pe:set:costo:${v}">S/ ${v}</button>`).join('')}</div>`)+(f.tipo!=='enc'&&!ptMulti(f)?`<button type="button" class="b" style="height:44px" data-a="pe:tarifa">Calcular con la tarifa</button>${f.tf?`<div style="font-size:13px;color:${f.tf.mal?'#B42318':'#6B5E55'};line-height:1.45">${f.tf.t}</div>`:''}`:'')+
      (f.tipo==='enc'?sg('¿Cómo paga el servicio?','pago',[['efectivo','Efectivo al recoger'],['yape','Yape al recoger'],['al_final','Al final a Pidemás · al recibir la guía']])
       :tb(f.tipo==='compra'?'¿Cómo paga el cliente la compra y el servicio?':'¿Cómo paga el servicio?','pago',[['efectivo','Efectivo'],['yape','Yape']])+`<div style="display:grid;margin-top:-4px">${bG(f.pago==='al_final','Al final a Pidemás','pe:set:pago:'+(f.pago==='al_final'?'efectivo':'al_final'))}</div>`)+
      (f.pago==='al_final'?U.note(f.tipo==='enc'?'El motorizado no cobra: el cliente le paga a Pidemás después de recibir la guía y la clave.':f.tipo==='compra'?'El motorizado compra con su caja y no cobra al entregar. El cliente le paga a Pidemás la compra y el servicio; queda en Cobros pendientes.':'El motorizado no cobra. El cliente le paga el servicio a Pidemás; queda en Cobros pendientes.'):pagoExtra())+
      (f.tipo==='enc'&&f.pago!=='pagado'?sg('¿Quién paga el servicio?','quien',[['envia','Quien envía'],['recibe','Quien recibe']])+(f.quien==='recibe'&&(f.pago==='efectivo'||f.pago==='yape')?U.note('Quien recibe no está en el recojo: el motorizado le cobrará donde corresponda. Si paga a distancia, elige «Al final a Pidemás».'):''):'')+
      (f.tipo==='compra'&&f.para==='otra'&&f.pago!=='pagado'?sg('¿Quién paga la compra y el servicio?','quien',[['envia','Quien manda a comprar'],['recibe','Quien recibe']])+(f.quien==='envia'&&f.pago!=='al_final'?U.note('Si quien manda a comprar no estará en la entrega, que pague por Yape antes o elige «Al final a Pidemás».'):''):'')+
      (f.tipo==='recojo'&&f.pago!=='pagado'&&f.pago!=='al_final'?sg('¿Quién paga el servicio?','quien',[['envia','Quien envía'],['recibe','Quien recibe']])+
        (ptMulti(f)&&f.quien==='envia'?sg('¿En qué punto de recojo paga?','pagapt',[[ '1','Punto 1 · '+(String(f.rnom||'').trim()||'quien envía')]].concat((f.pts||[]).map((q,i)=>[String(i+2),'Punto '+(i+2)+(String(q.nom||'').trim()?' · '+String(q.nom).trim():'')])))+`<span style="font-size:13px;color:#6B5E55;margin-top:-4px">Ahí el motorizado cobra el total del servicio (${Number.isFinite(ptSuma(f))?M(ptSuma(f)):'S/ —'}).</span>`:''):''));
    let h='';
    if(f.tipo==='recojo'){
      h+=card('Quien envía y quien recibe',pzH(1,'Envía')+fl('peRn','Nombre y apellido de quien envía','rnom','')+fl('peRt','Número de quien envía','rtel','',tel)+fl('peRd','Dirección','rdir','')+fl('peRr','Referencia','rref','Ej. frente al parque, portón negro')+fl('peRa','¿A nombre de quién está el pedido?','anom','Ej. Juan Pérez · si es distinto de quien entrega')+fl('peRu','Ubicación (Google Maps)','rubi','Pega el enlace de Google Maps')+mp('rubi','rdir','Lugar de recojo'));
      {const nP=(f.pts||[]).length;const masPt=k=>k===nP&&nP<5?`<button type="button" class="b" style="height:50px;margin-top:6px" data-a="pe:pt+">${IC.plus}Agregar otro punto de recojo</button><span style="font-size:13px;color:#6B5E55;margin-top:-4px">Si no hay más puntos de recojo, toca «Siguiente».</span>`:'';
        h=h.replace(/<\/div>$/,`<div style="height:1px;background:#F1E4DA;margin:8px 0"></div>`+pzH(2,'Recibe')+fl('peEn','Nombre y apellido de quien recibe','enom','')+fl('peEt','Número de quien recibe','etel','',tel)+fl('peEd','Dirección','edir','')+fl('peEr','Referencia','eref','Ej. edificio azul, dpto. 302')+fl('peEu','Ubicación (Google Maps)','eubi','Pega el enlace de Google Maps')+mp('eubi','edir','Lugar de entrega')+fl('peQl','¿Qué se lleva?','lleva','Ej. sobre con documentos, caja pequeña')+masPt(0)+'</div>');
        (f.pts||[]).forEach((q,i)=>{h+=card('Punto de recojo '+(i+2),nsPuntoForm(f,i)+`<button type="button" class="b" style="height:44px;color:#B42318;border-color:#F4C7C3" data-a="pe:ptx:${i}">Quitar este punto</button>`+masPt(i+1))})}
      {const EN=f.ents=f.ents||[];const masEn=k=>k===EN.length&&EN.length<5?`<button type="button" class="b" style="height:50px;margin-top:6px" data-a="pe:en+">${IC.plus}Agregar otra entrega</button>`:'';
        h=h.replace(/(<!--cd:Quien envía y quien recibe-->[\s\S]*?)(<!--cd:|$)/,(m0,a,b)=>a.replace(/<\/div>$/,masEn(0)+'</div>')+b);
        EN.forEach((q,i)=>{const inp=(k,ph,o)=>`<input data-in="pe:en:${i}:${k}" value="${E(q[k]||'')}" placeholder="${E(ph||'')}"${o||''}>`,fd=(l,k,ph,o)=>`<div class="fld"><label>${l}</label>${inp(k,ph,o)}</div>`;
          h+=card('Entrega '+(i+2),`<span style="font-size:13px;color:#6B5E55">Entrega ${i+2} de ${EN.length+1} · el motorizado la deja después de la entrega ${i+1}</span>`+
            fd('Nombre y apellido de quien recibe','nom','')+fd('Número de quien recibe','tel','',' type="tel" inputmode="tel" maxlength="20"')+fd('Dirección','dir','')+fd('Referencia','ref','Ej. edificio azul, dpto. 302')+fd('Ubicación (Google Maps)','ubi','Pega el enlace de Google Maps')+
            `<button type="button" class="b" style="height:44px;margin-top:-4px" data-a="pe:enmapa:${i}">${coordsDe(q.ubi)?'Cambiar en el mapa':'Marcar en el mapa'}</button>`+fd('¿Qué se le deja?','que','Ej. 1 bolsa')+
            `<button type="button" class="b" style="height:44px;color:#B42318;border-color:#F4C7C3" data-a="pe:enx:${i}">Quitar esta entrega</button>`+masEn(i+1))})}
      h+=costo;
    }else if(f.tipo==='compra'){
      h+=card('Información del cliente',pzH(1,'Quien compra')+fl('peN','Nombre y apellido','nom','')+fl('peT','Número','tel','',tel)+`<div style="height:1px;background:#F1E4DA;margin:6px 0"></div>`+pzH(2,'Dónde se recibe')+fl('peD','Dirección de entrega','dir','')+fl('peR','Referencia','ref','Ej. frente a la bodega, casa verde')+fl('peU','Ubicación (Google Maps)','ubi','Pega el enlace de Google Maps')+mp('ubi','dir','Lugar de entrega de la compra'));
      {const nS=(f.pts||[]).length;const masSit=k=>k===nS&&nS<5?`<button type="button" class="b" style="height:50px;margin-top:6px" data-a="pe:pt+">${IC.plus}Agregar otro lugar de compra</button><span style="font-size:13px;color:#6B5E55;margin-top:-4px">Si se compra en un solo lugar, toca «Siguiente».</span>`:'';
        h+=card('Información de la compra',(nS?`<span style="font-size:13px;color:#6B5E55">Lugar 1 de ${nS+1}</span>`:'')+fl('peLg','¿De dónde desea la compra?','lugar','')+fl('peLu','Ubicación del lugar (Google Maps)','lugarUrl','Pega el enlace de Google Maps')+mp('lugarUrl','lugar','Dónde se hace la compra')+nsProds(f,-1)+fotosCompra(f)+ta('peOb','Observaciones','obs','')+masSit(0));
        (f.pts||[]).forEach((q,i)=>{h+=card('Información de la compra · lugar '+(i+2),nsSitioForm(f,i)+`<button type="button" class="b" style="height:44px;color:#B42318;border-color:#F4C7C3" data-a="pe:ptx:${i}">Quitar este lugar</button>`+masSit(i+1))})}
      h+=compCard();
      h+=costo;
    }else{
      h+=card('Información de quien envía',pzH(1,'Quien envía')+fl('peRn','Nombre y apellido de quien envía','rnom','')+fl('peRi','DNI de quien envía','rdni','',' inputmode="numeric" maxlength="12"')+fl('peRt','Número de quien envía','rtel','',tel)+fl('peRd','Dirección de recojo','rdir','')+fl('peRr','Referencia','rref','Ej. casa de dos pisos, reja negra')+fl('peRu','Ubicación (Google Maps)','rubi','Pega el enlace de Google Maps')+mp('rubi','rdir','Lugar de recojo')+ta('peOb','¿Qué envía? / Observaciones (opcional)','obs','Describe el contenido u otras indicaciones'));
      /* Encomienda en orden: primero cuántos paquetes, luego cada paquete con su agencia, destino y quien lo recibe */
      const ot=optsDe('encTipoEnvio'),tp0=optsDe('encTipoPago'),tp=tp0.length?tp0:[['pago_en_agencia','Pago en agencia'],['pago_a_destino','Pago a destino']];
      const cant=1+(f.paqs||[]).length;
      const masPaq=n=>n===cant&&cant<5?`<button type="button" class="b" style="height:50px;margin-top:6px" data-a="pe:pqadd">${IC.plus}Agregar otro paquete</button><span style="font-size:13px;color:#6B5E55;margin-top:-4px">Si no hay más paquetes, toca «Siguiente».</span>`:'';
      /* todos los paquetes con el mismo formulario (agencia y destino con selector de los registrados) */
      if(f.agG){agSync(f);let k0=0;
        f.agG.forEach((nG,gi)=>{let b='';for(let j=0;j<nG;j++){const k=k0+j;b+=nsPaqForm(f,k,cant,{sinAg:j>0,num:j+1,tit:'Paquete '+(j+1)+(nG>1?' de '+nG:'')})+(j>0?`<button type="button" class="b" style="height:44px;color:#B42318;border-color:#F4C7C3" data-a="pe:agpqx:${k}">Quitar el paquete ${j+1}</button>`:'')}
          b+=`<button type="button" class="b" style="height:46px;border-style:dashed;color:#C4410C;border-color:#E2A07E" data-a="pe:agpq:${gi}">+ Agregar paquete a esta agencia</button>`;
          if(gi>0)b+=`<button type="button" class="b" style="height:44px;color:#B42318;border-color:#F4C7C3" data-a="pe:agx:${gi}">Quitar la agencia ${gi+1}</button>`;
          if(gi===f.agG.length-1&&f.agG.length<4)b+=`<button type="button" class="b" style="height:50px;margin-top:6px" data-a="pe:ag+">${IC.plus}Agregar otra agencia</button>`;
          h+=card('Agencia '+(gi+1),b);k0+=nG})}
      else for(let k=0;k<cant;k++)h+=card('Paquete '+(k+1),nsPaqForm(f,k,cant)+(k>0?`<button type="button" class="b" style="height:44px;color:#B42318;border-color:#F4C7C3" data-a="pe:pqx:${k-1}">Quitar este paquete</button>`:'')+masPaq(k+1));
      h+=compCard();
      h+=costo;
    }
    if(f.msg)h+=`<div class="err">${E(f.msg)}</div>`;
    return h;
  }
  /* Fotos de la compra: se achican (máx. 1600 px, JPG) y se suben a restaurantes/compras/ */
  function achicarFoto(fl){return new Promise(res=>{try{const u=URL.createObjectURL(fl),im=new Image();im.onload=()=>{try{const k=Math.min(1,1600/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(b=>res(b||fl),'image/jpeg',0.82)}catch(_){res(fl)}};im.onerror=()=>{URL.revokeObjectURL(u);res(fl)};im.src=u}catch(_){res(fl)}})}
  async function fotosCompraCambio(e){const i=e.target;if(!i||!i.dataset||!i.dataset.fotoCompra||!PE.f)return;const f=PE.f;
    const fs=[...(i.files||[])].filter(x=>/^image\//.test(x.type)).slice(0,10);i.value='';if(!fs.length)return;
    f.fotos=f.fotos||[];f.subiendo=(f.subiendo||0)+fs.length;f.msg='';key='';pintar();
    for(const fl of fs){try{const bl=await achicarFoto(fl),path='compras/'+Date.now()+'-'+Math.random().toString(36).slice(2,8)+'.jpg';
        const up=await D().storage.from('restaurantes').upload(path,bl,{contentType:bl.type||'image/jpeg',upsert:false});if(up.error)throw up.error;
        f.fotos.push(D().storage.from('restaurantes').getPublicUrl(path).data.publicUrl)}catch(err){f.msg='No se pudo subir una foto: '+(err?.message||err)}
      f.subiendo=Math.max(0,f.subiendo-1);key='';pintar()}}
  function svcPayload(f,o){
    const n=v=>{const x=Number(String(v??'').replace(',','.'));return Number.isFinite(x)&&x>=0?Math.round(x*100)/100:0};
    if(cdMulti(f)){const su=cdSuma(f);if(!Number.isFinite(su)){f.msg='Escribe el delivery de cada paquete.';return false}f.costo=String(su)}
    if(ptMulti(f)){const su=ptSuma(f);if(!Number.isFinite(su)){f.msg='Escribe el delivery de cada '+(f.tipo==='compra'?'lugar de compra':'punto de recojo')+'.';return false}f.costo=String(su)}
    if(f.tipo==='enc'&&!f.nuevo&&f.cdx){const su=cdxSuma(f);if(!Number.isFinite(su)){f.msg='Escribe el delivery de cada paquete.';return false}f.costo=String(su)}
    const costo=n(f.costo),pagado=f.pago==='pagado',yaCobro=o.pago_confirmado===true&&Number(o.monto_recibido)>0;
    let p={},obs=o.observaciones||'';
    if(f.tipo==='recojo'){
      if(!f.rnom.trim())f.rnom=f.pide==='recibe'&&String(f.enom||'').trim()?'':'Cliente';
      const finalP=f.pago==='al_final';
      const mom=pagado?'pagado':finalP?'al_final':(f.quien==='envia'?(f.pago==='yape'?'recojo_yape':'recojo_efectivo'):null);
      const pideR=f.pide==='recibe'&&String(f.enom||'').trim();
      p={nombre_cliente:(pideR?f.enom:f.rnom).trim(),telefono_cliente:(pideR?f.etel:f.rtel).trim(),nombre_remitente:f.rnom.trim(),telefono_remitente:f.rtel.trim(),direccion_recojo:f.rdir.trim(),referencia_recojo:f.rref.trim()||null,recojo_a_nombre:String(f.anom||'').trim()||null,ubicacion_recojo:f.rubi.trim()||null,
        nombre_receptor:f.enom.trim(),telefono_receptor:f.etel.trim(),direccion_entrega:f.edir.trim(),referencia_entrega:f.eref.trim()||null,ubicacion_entrega:f.eubi.trim()||null,que_se_lleva:f.lleva.trim()||null,
        costo_delivery:costo,subtotal:0,total:costo,metodo_pago:pagado?'efectivo':finalP?'yape':f.pago,pago_servicio_momento:mom,quien_paga:pagado||finalP?null:f.quien};
      obs=rehacerObs(obs,{'Pide el servicio':pideR?'Quien recibe':'','Ubicación de recojo':f.rubi,'Ubicación de entrega':f.eubi,'Referencia de recojo':f.rref,'Pedido a nombre de':f.anom,'Qué se lleva':f.lleva});
      obs=[pagado?'Servicio marcado como PAGADO; no cobrar monto al cliente':finalP?'El cliente paga al final a Pidemás; el motorizado no cobra':(f.pago==='efectivo'?'Pago en efectivo: S/ '+costo.toFixed(2):'Pago por Yape: pendiente de captura y confirmación del administrador'),pagado||finalP?'':(f.quien==='envia'?'Paga quien envía, al recoger'+(ptMulti(f)?(()=>{const n=+f.pagapt||1,q=n>1?(f.pts||[])[n-2]:null,nm=String(n>1?(q&&q.nom)||'':f.rnom||'').trim();return ', en el punto '+n+(nm?' ('+nm.replace(/[|·]/g,' ')+')':'')})():''):'Paga quien recibe, al entregar')].filter(Boolean).concat(segs(obs)).join(' | ');
      const cr=coordsDe(f.rubi),ce=coordsDe(f.eubi);if(cr){p.latitud_recojo=cr.lat;p.longitud_recojo=cr.lng}if(ce){p.latitud_entrega=ce.lat;p.longitud_entrega=ce.lng}
      p.puntos_recojo=nsPuntosPayload(f,o);
      {const antes=Array.isArray(o.puntos_entrega)?o.puntos_entrega:[];p.puntos_entrega=(f.ents||[]).map(q=>({nom:String(q.nom||'').trim(),tel:String(q.tel||'').trim(),dir:String(q.dir||'').trim(),ref:String(q.ref||'').trim(),ubi:String(q.ubi||'').trim(),que:String(q.que||'').trim()})).filter(q=>q.nom||q.tel||q.dir||q.ubi)
        .map((q,i)=>{const c=coordsDe(q.ubi),ya=antes.find(x=>Number(x.n)===i+2&&x.entregado_en&&String(x.direccion||'')===q.dir);return {n:i+2,nombre:q.nom||null,telefono:q.tel||null,direccion:q.dir||null,referencia:q.ref||null,ubicacion:q.ubi||null,lat:c?c.lat:null,lng:c?c.lng:null,que:q.que||null,entregado_en:ya?ya.entregado_en:null}})}
    }else if(f.tipo==='compra'){
      if(!f.nom.trim())f.nom='Cliente';
      const otra=f.para==='otra';
      p={compra_fotos:Array.isArray(f.fotos)?f.fotos.slice(0,20):[],quien_paga:otra&&f.quien==='recibe'?'recibe':'cliente',nombre_receptor:otra?String(f.enom||'').trim()||null:null,telefono_receptor:otra?String(f.etel||'').trim()||null:null,nombre_cliente:f.nom.trim(),telefono_cliente:f.tel.trim(),nombre_remitente:f.nom.trim(),telefono_remitente:f.tel.trim(),direccion_entrega:f.dir.trim(),referencia_entrega:f.ref.trim()||null,ubicacion_entrega:f.ubi.trim()||null,
        direccion_recojo:[f.lugar.trim(),String(f.lugarUrl||'').trim()].filter(Boolean).join(' · '),tipo_comprobante:f.comp||null,documento_comprobante:f.doc.trim()||null,costo_delivery:costo,total:Math.round((n(o.subtotal)+costo)*100)/100,metodo_pago:f.pago==='al_final'?'yape':pagado?'efectivo':f.pago,pago_servicio_momento:f.pago==='al_final'?'al_final':null};
      const cpT=String(f.comp||'').toLowerCase();
      obs=rehacerObs(obs,{'Entregar a':f.para==='otra'?[f.enom,f.etel].map(x=>String(x||'').trim()).filter(Boolean).join(' · '):'','Ubicación':f.ubi,'Compra solicitada':f.detalle,'Comprobante':f.comp||'No especificado','DNI/RUC':cpT?f.doc:'','Nombre comprobante':cpT==='boleta'?f.cnom:'','Razón social':cpT==='factura'?f.craz:'','Dirección fiscal':cpT==='factura'?f.cdir:''},f.obs);
      if(pagado)obs='Servicio marcado como PAGADO; no cobrar monto al cliente | '+obs;
      if(f.pago==='al_final')obs='El cliente paga al final a Pidemás (compra y servicio); el motorizado no cobra | '+obs;
      const ce=coordsDe(f.ubi);if(ce){p.latitud_entrega=ce.lat;p.longitud_entrega=ce.lng}
    }else{
      if(!f.rnom.trim())f.rnom=f.pide==='recibe'&&String(f.enom||'').trim()?'':'Cliente';
      const mom=pagado?'pagado':f.pago==='al_final'?'al_final':f.pago==='yape'?'recojo_yape':'recojo_efectivo';
      const pideRe=f.pide==='recibe'&&String(f.enom||'').trim();
      p={quien_paga:f.quien==='recibe'?'recibe':'envia',nombre_cliente:(pideRe?f.enom:f.rnom).trim(),telefono_cliente:(pideRe?f.etel:f.rtel).trim(),nombre_remitente:f.rnom.trim(),telefono_remitente:f.rtel.trim(),dni_remitente:f.rdni.trim()||null,direccion_recojo:f.rdir.trim(),referencia_recojo:f.rref.trim()||null,ubicacion_recojo:f.rubi.trim()||null,
        nombre_receptor:f.enom.trim(),telefono_receptor:f.etel.trim(),dni_receptor:f.edni.trim()||null,tipo_encomienda:f.tenv||null,
        agencia_destino:f.ag.trim(),referencia_entrega:f.ag.trim(),destino_final:f.dest.trim(),direccion_entrega:f.dest.trim(),tipo_pago_encomienda:f.tpago||null,tipo_comprobante:f.comp||null,documento_comprobante:String(f.doc||'').trim()||null,
        costo_delivery:costo,subtotal:0,total:costo,metodo_pago:pagado?'efectivo':(f.pago==='al_final'?'yape':f.pago),pago_servicio_momento:mom};
      if(f.ag.trim()!==String(o.agencia_destino||'').trim()){const op=optsDe('encAgencia').find(x=>x[1].toLowerCase()===f.ag.trim().toLowerCase());p.agencia_id=op?op[0]:null}
      {const cpT=String(f.comp||'').toLowerCase();obs=rehacerObs(obs,{'Pide el servicio':f.pide==='recibe'?'Quien recibe':'','Tipo de encomienda':f.tenv,'DNI de quien envía':f.rdni,'DNI de quien recibe':f.edni,'Ubicación de recojo':f.rubi,'Referencia de recojo':f.rref,'Comprobante':f.comp||'','DNI/RUC':cpT?f.doc:'','Nombre comprobante':cpT==='boleta'?f.cnom:'','Razón social':cpT==='factura'?f.craz:'','Dirección fiscal':cpT==='factura'?f.cdir:''},f.obs)}
      obs=[pagado?'Servicio marcado como PAGADO; no cobrar monto al cliente':'',f.pago==='al_final'?'El cliente paga al final por Yape, después de recibir la guía y la clave; no cobrar al recoger':''].filter(Boolean).concat(segs(obs)).join(' | ');
      const cr=coordsDe(f.rubi);if(cr){p.latitud_recojo=cr.lat;p.longitud_recojo=cr.lng}
      /* ubicación de la agencia: es el punto de entrega del motorizado */
      const ca=coordsDe(f.agubi)||coordsDe(nsAgU(f.ag));if(ca){p.latitud_entrega=ca.lat;p.longitud_entrega=ca.lng;p.ubicacion_entrega=String(f.agubi||'').trim()||nsAgU(f.ag)}
    }
    if(!yaCobro)p.pago_confirmado=pagado;
    p.observaciones=obs;
    if(f.tipo==='compra')p.puntos_recojo=nsSitiosPayload(f,o);
    if(f.tipo==='enc'&&!f.nuevo&&f.cdx&&Array.isArray(o.paquetes_extra))p.paquetes_extra=o.paquetes_extra.map(x=>{const c=f.cdx.find(y=>y.n===Number(x&&x.numero));return c?Object.assign({},x,{costo_delivery:cdN(c.v)}):x});
    return p;
  }
  const SVC_OPC=['puntos_entrega','puntos_recojo','referencia_recojo','recojo_a_nombre','ubicacion_recojo','ubicacion_entrega','que_se_lleva','quien_paga','tipo_comprobante','documento_comprobante','tipo_encomienda'];
  async function svcGuardar(f,o){
    const p=svcPayload(f,o);if(!p)return false;
    let r=await D().from('pedidos').update(p).eq('id',o.id).select('id').maybeSingle();
    if(r.error&&/column|schema cache|PGRST204|42703/i.test(String(r.error.message)+String(r.error.code))){SVC_OPC.forEach(k=>delete p[k]);r=await D().from('pedidos').update(p).eq('id',o.id).select('id').maybeSingle()}
    if(r.error)throw r.error;if(!r.data)throw new Error('Supabase no guardó el cambio. Revisa los permisos.');
    const metAntes=o.metodo_pago,antes=Object.assign({},o);Object.assign(o,p);await cajaPorCambioPago(o,metAntes,p.metodo_pago);await cajaPorCambioMonto(o,antes,metAntes);
    if(f.tipo==='enc'){nsAgRegistrar(f).catch(()=>{})}
    nsGuardarClientes(f).catch(()=>{});
    return true;
  }

  /* =============== NUEVO SERVICIO (recojo, compra, encomienda) =============== */
  const NSV={'recojo y entrega':'Recojo y entrega','compra':'Compra','encomienda':'Encomienda'};
  const TSV={'Recojo y entrega':'recojo_entrega','Compra':'compra','Encomienda':'encomienda'};
  async function svcNuevo(k,fav){
    const sv=NSV[k];if(!sv)return;
    try{if(window.PdPasos&&PdPasos.isOpen())PdPasos.close()}catch(_){}
    try{if(paginaVieja())cerrarVieja()}catch(_){}
    PE.f=Object.assign(svcDatos({},sv),{nuevo:true,paso:0,costo:'',pago:'efectivo',quien:'recibe',moto:'',pagacon:'',cq:'',cli:'',ind1:'',paqs:[],pts:[]});
    if(fav&&sv==='Recojo y entrega'){FR_K.forEach(x=>{if(String(fav[x]||'').trim())PE.f[x]=String(fav[x])});PE.f.frec=fav.rnom||'Cliente frecuente';PE.f.paso=1}
    if(!sub)try{history.pushState({pdApp:1},'')}catch(_){}
    sub='pedidoform';key='';pintar();
    datosCli();
    try{const [m,a,d]=await Promise.all([D().from('motorizados').select('id,nombre_completo,telefono,usuario_id,activo').order('nombre_completo'),PE.ags?{data:PE.ags}:D().from('agencias').select('id,nombre,activo').order('nombre'),PE.dsts?{data:PE.dsts}:D().from('agencia_destinos').select('id,agencia_id,destino_final,activo').order('destino_final')]);
      PE.motos=(m.data||[]).filter(x=>x.activo!==false);PE.ags=(a.data||[]).filter(x=>x.activo!==false);PE.dsts=((d&&d.data)||[]).filter(x=>x.activo!==false)}catch(_){PE.motos=PE.motos||[];PE.ags=PE.ags||[];PE.dsts=PE.dsts||[]}
    key='';pintar();
  }
  function nsCli(f){
    const q=String(f.cq||'').trim().toLowerCase(),qd=dig(q);if(q.length<2)return '';
    const L2=((C2.cli&&C2.cli.data)||[]).filter(c=>cliN(c).toLowerCase().includes(q)||(qd.length>=3&&dig(cliT(c)).includes(qd))).slice(0,5);
    return L2.length?L2.map(c=>`<button type="button" class="b" style="height:auto;min-height:48px;padding:8px 12px;justify-content:flex-start;text-align:left;flex-direction:column;align-items:flex-start;gap:2px" data-a="pe:cli:${E(c.id)}"><b style="font-size:15px">${E(cliN(c)||'Cliente')}</b><span style="font-size:13px;color:#6B5E55;font-weight:500">${E([cliT(c),c.direccion].filter(Boolean).join(' · '))}</span></button>`).join(''):`<div style="font-size:14px;color:#6B5E55">No hay clientes con «${E(f.cq)}».</div>`;
  }
  function nsVista(f){
    const lbl=f.tipo==='compra'?'del cliente':'de quien envía';
    const busca=`<div class="cd"><div class="lbl">Buscar cliente registrado</div><div class="fld"><input id="peCq" data-sin-pegar value="${E(f.cq)}" data-in="pe:cq" placeholder="Nombre o teléfono del cliente" autocomplete="off"></div><div id="peCl" style="display:flex;flex-direction:column;gap:8px">${nsCli(f)}</div><span style="font-size:13px;color:#6B5E55">Al elegir un cliente se llenan los datos ${lbl}.</span></div>`;
    /* tarjetas del formulario, una por paso */
    const P=nsPasos(f),i=Math.min(f.paso||0,P.length-1),paso=P[i];f.paso=i;
    const form=svcForm(f).replace(/<div class="err">[\s\S]*?<\/div>$/,'');
    const cards={};form.split('<!--cd:').slice(1).forEach(x=>{const j=x.indexOf('-->');const t=x.slice(0,j);cards[t]=x.slice(j+3).replace(/^<div class="cd( nsq)?"><div class="lbl">[^<]*<\/div>/,'<div class="cd$1">')});
    let h=`<div class="cd" style="gap:8px"><div class="lbl" style="margin:0">Paso ${i+1} de ${P.length}</div><b style="font-size:18px">${E(paso)}</b>${f.frec&&i>0?`<span style="font-size:13px;color:#6B5E55">Envía <b style="color:#1F1A17">${E(f.frec)}</b> · cliente frecuente</span>`:''}<div style="display:grid;grid-template-columns:repeat(${P.length},minmax(0,1fr));gap:6px">${P.map((_,k)=>`<span style="height:5px;border-radius:9px;background:${k<=i?'#C4410C':'#EADFD6'}"></span>`).join('')}</div></div>`;
    const pideR=(f.tipo==='recojo'||f.tipo==='enc')&&f.pide==='recibe';
    if((f.tipo==='recojo'||f.tipo==='enc')&&!f.pide){f.pide='envia';if(f.tipo==='enc'&&!f.quien)f.quien='envia'}
    if(f.tipo==='compra')f.para='mismo';
    /* Recojo y entrega: buscar cliente en los dos pasos (cada uno llena su lado) */
    if(f.tipo==='recojo'){if(paso==='Quien envía y quien recibe')h+=busca;else if(/^Punto de recojo \d+$/.test(paso))h+=busca.replace('los datos de quien envía','los datos del '+paso.toLowerCase())}
    else if(paso==='Información del cliente'||paso==='Información de quien envía')h+=busca;
    if(paso==='Antes de empezar'){
      const cnt=(t,k,v,max,sub)=>`<div class="fld"><label>${t}</label><div style="display:grid;grid-template-columns:repeat(${max},minmax(0,1fr));gap:8px">${Array.from({length:max},(_,j)=>j+1).map(n=>`<button type="button" style="height:52px;border-radius:14px;border:1.5px solid ${n===v?'#C4410C':'#F1E4DA'};background:${n===v?'#FFF4EC':'#FFFFFF'};font:inherit;font-size:18px;font-weight:${n===v?800:600};color:#1F1A17;cursor:pointer" aria-pressed="${n===v}" data-a="pe:cnt:${k}:${n}">${n}</button>`).join('')}</div>${sub?`<span style="font-size:13px;color:#6B5E55">${sub}</span>`:''}</div>`;
      const np=1+(f.pts||[]).length,nq=1+(f.paqs||[]).length;
      h+=`<div class="cd nsq"><span style="font-size:14px;color:#6B5E55;line-height:1.45">Con estas respuestas armamos el formulario. Luego puedes agregar o quitar.</span>`+
        (f.tipo==='compra'?cnt('¿En cuántos lugares se compra?','pts',np,6,'Cada lugar con sus productos y su boleta.')
        :f.tipo==='recojo'?cnt('¿Cuántos recojos?','pts',np,6,'Lugares donde el motorizado recoge.')+cnt('¿Cuántas entregas?','ents',1+(f.ents||[]).length,6,'Lugares donde el motorizado deja.')
        :cnt('¿A cuántas agencias van?','ags',(f.agG||[1]).length,4,'Ej. Shalom y Olva.')+(f.agG||[1]).map((n,gi)=>cnt('¿Cuántos paquetes van a la agencia '+(gi+1)+'?','agp'+gi,n,5,gi===(f.agG||[1]).length-1?'Cada paquete con su destino y quien lo recibe.':'')).join(''))+`</div>`;
    }else if(paso==='Asignar motorizado'){
      const ms=PE.motos,ini=n=>String(n||'?').trim().split(/\s+/).map(w=>w[0]||'').slice(0,2).join('').toUpperCase();
      h+=`<div class="cd"><div class="lbl">Seleccionar motorizado</div>${ms==null?'<div class="load">Cargando motorizados…</div>':ms.length?`<div class="mob">${ms.map(m=>`<button type="button" class="${String(f.moto)===String(m.id)?'on':''}" data-a="pe:mo:${E(m.id)}" aria-pressed="${String(f.moto)===String(m.id)}"><i>${E(ini(m.nombre_completo))}</i><span>${E(m.nombre_completo||'Motorizado')}</span></button>`).join('')}</div>`:'<span style="font-size:14px;color:#6B5E55">No hay motorizados activos.</span>'}<span style="font-size:13px;color:#6B5E55">${f.moto?'Le avisamos por la app y se abre WhatsApp con el mensaje listo. Toca otra vez para quitarlo.':'Si no eliges ninguno, el pedido queda en Pedidos como «sin motorizado» para asignarlo luego.'}</span></div>`;
    }else h+=cards[paso]||'';
    if(f.msg)h+=`<div class="err">${E(f.msg)}</div>`;
    const ult=i===P.length-1,fin='Enviar '+String(f.sv||'pedido').toLowerCase();
    const foot=i===0?`<button type="button" class="b o" style="height:54px;font-size:16px" data-a="pe:sig">Siguiente</button>`
      :`<div class="row"><button type="button" class="b" style="flex:1;height:54px" data-a="pe:atr">Atrás</button><button type="button" class="b o" style="flex:1.7;height:54px;font-size:16px" data-a="${ult?'pe:crear':'pe:sig'}">${ult?E(fin):'Siguiente'}</button></div>`;
    return {head:top3('Servicios',f.sv),body:h,foot};
  }
  /* «1 · Pide» / «2 · Recibe»: encabezado numerado de cada persona en los formularios de servicio */
  function pzH(n,t,ok){return `<div class="pzh" style="display:flex;align-items:center;gap:10px;margin:2px 0 2px"><span style="width:28px;height:28px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;flex:none;background:${ok?'#E9F6EE':'#FDEBDF'};color:${ok?'#0F6B33':'#9A330A'}">${n}</span><b style="font-size:16px;color:#1F1A17">${t}</b></div>`}
  function nsPasos(f){if(f.tipo==='enc'&&f.nuevo&&!f.agG)f.agG=[1+(f.paqs||[]).length];const P=nsPasos0(f);return f.nuevo?['Antes de empezar'].concat(P):P}
  function nsPasos0(f){
    if(f.tipo==='recojo')return ['Quien envía y quien recibe'].concat((f.pts||[]).map((_,i)=>'Punto de recojo '+(i+2))).concat((f.ents||[]).map((_,i)=>'Entrega '+(i+2))).concat(['Información de pago del servicio','Asignar motorizado']);
    if(f.tipo==='compra')return ['Información del cliente','Información de la compra'].concat((f.pts||[]).map((_,i)=>'Información de la compra · lugar '+(i+2))).concat(['Información del comprobante','Información de pago del servicio','Asignar motorizado']);
    if(f.agG)return ['Información de quien envía'].concat(f.agG.map((_,i)=>'Agencia '+(i+1))).concat(['Información del comprobante','Información de pago del servicio','Asignar motorizado']);
    return ['Información de quien envía'].concat(Array.from({length:1+(f.paqs||[]).length},(_,i)=>'Paquete '+(i+1))).concat(['Información del comprobante','Información de pago del servicio','Asignar motorizado']);
  }
  /* Recojo y entrega con varios puntos de recojo: el punto 1 es «quien envía»; aquí van los demás */
  function nsPuntos(f){
    f.pts=f.pts||[];
    const inp=(i,k,v,ph,o)=>`<input data-in="pe:pt:${i}:${k}" value="${E(v||'')}" placeholder="${E(ph||'')}"${o||''}>`;
    let h=`<span style="font-size:13px;color:#6B5E55;line-height:1.45">${f.pts.length?'El motorizado recoge primero donde quien envía (punto 1) y luego en cada punto de abajo.':'¿Hay que recoger en más de un lugar? Agrega aquí cada punto.'}</span>`;
    f.pts.forEach((q,i)=>{const n=i+2;
      h+=`<div style="display:flex;flex-direction:column;gap:10px;padding:12px;border:1px dashed #E3CFC2;border-radius:16px;background:#FFFCFA">
        <div class="row" style="justify-content:space-between"><b style="font-size:16px">Punto de recojo ${n}</b><button type="button" class="b" style="height:36px;padding:0 12px;color:#B42318;border-color:#F4C7C3" data-a="pe:ptx:${i}">Quitar</button></div>
        <div class="fld"><label>Nombre de quien entrega</label>${inp(i,'nom',q.nom,'Ej. Tienda Rosa')}</div>
        <div class="fld"><label>Número de quien entrega</label>${inp(i,'tel',q.tel,'',' type="tel" inputmode="tel" maxlength="20"')}</div>
        <div class="fld"><label>Dirección</label>${inp(i,'dir',q.dir,'')}</div>
        <div class="fld"><label>Referencia</label>${inp(i,'ref',q.ref,'Ej. puerta verde')}</div>
        <div class="fld"><label>Ubicación (Google Maps)</label>${inp(i,'ubi',q.ubi,'Pega el enlace de Google Maps')}</div>
        <button type="button" class="b" style="height:44px;margin-top:-4px" data-a="pe:ptmapa:${i}">${coordsDe(q.ubi)?'Cambiar en el mapa':'Marcar en el mapa'}</button>
        <div class="fld"><label>¿Qué se recoge aquí?</label>${inp(i,'que',q.que,'Ej. 2 cajas')}</div></div>`});
    if(f.pts.length<5)h+=`<button type="button" class="b" style="height:50px" data-a="pe:pt+">${IC.plus}Agregar otro punto de recojo</button>`;
    return h;
  }
  /* cada punto de recojo extra usa el mismo formulario que el punto 1 (quien envía) */
  function nsPuntoForm(f,i){
    const q=(f.pts||[])[i]||{},n=i+2;
    const inp=(k,ph,o)=>`<input data-in="pe:pt:${i}:${k}" value="${E(q[k]||'')}" placeholder="${E(ph||'')}"${o||''}>`;
    const fld=(l,k,ph,o)=>`<div class="fld"><label>${l}</label>${inp(k,ph,o)}</div>`;
    return `<span style="font-size:13px;color:#6B5E55">Punto ${n} de ${1+(f.pts||[]).length} · el motorizado recoge aquí después del punto ${n-1}</span>`+
      fld('Nombre y apellido de quien entrega','nom','')+fld('Número de quien entrega','tel','',' type="tel" inputmode="tel" maxlength="20"')+fld('Dirección','dir','')+fld('Referencia','ref','Ej. frente al parque, portón negro')+
      fld('¿A nombre de quién está el pedido?','anom','Ej. Juan Pérez · si es distinto de quien entrega')+fld('Ubicación (Google Maps)','ubi','Pega el enlace de Google Maps')+
      `<button type="button" class="b" style="height:44px;margin-top:-4px" data-a="pe:ptmapa:${i}">${coordsDe(q.ubi)?'Cambiar en el mapa':'Marcar en el mapa'}</button>`;
  }
  /* compra en varios lugares: cada lugar con el mismo formulario que el lugar 1 */
  function nsSitioForm(f,i){
    /* mismo formulario y diseño que el lugar 1 */
    const q=(f.pts||[])[i]||{},n=i+2,TA='min-height:96px;padding:14px 16px;border-radius:14px;border:1.5px solid #F1E4DA;font:inherit;font-size:16px;width:100%;box-sizing:border-box';
    const fl2=(l,k,ph)=>`<div class="fld"><label>${l}</label><input data-in="pe:pt:${i}:${k}" value="${E(q[k]||'')}"${ph?` placeholder="${E(ph)}"`:''}></div>`;
    const ta2=(l,k,ph)=>`<div class="fld"><label>${l}</label><textarea data-in="pe:pt:${i}:${k}" placeholder="${E(ph||'')}" style="${TA}">${E(q[k]||'')}</textarea></div>`;
    return `<span style="font-size:13px;color:#6B5E55">Lugar ${n} de ${1+(f.pts||[]).length}</span>`+
      fl2('¿De dónde desea la compra?','nom','')+fl2('Ubicación del lugar (Google Maps)','ubi','Pega el enlace de Google Maps')+
      `<button type="button" class="b" style="height:44px;margin-top:-4px" data-a="pe:ptmapa:${i}">${coordsDe(q.ubi)?'Cambiar en el mapa':'Marcar en el mapa'}</button>`+
      nsProds(f,i)+ta2('Observaciones','obs','');
  }
  /* productos de cada lugar de compra (L=-1: lugar 1). Se guardan también como texto «qué comprar» */
  function prodsDe(f,L){const q=L<0?f:(f.pts||[])[L];if(!q)return [];const k=L<0?'detalle':'que';
    if(!Array.isArray(q.prods)){const t=String(q[k]||'').trim();q.prods=t?t.split(/\n+/).map(x=>{const m=x.replace(/^\s*\d+[.)]\s*/,'').match(/^(.*?)\s*[×x]\s*(\d+)\s*$/);return m?{n:m[1],c:m[2]}:{n:x.replace(/^\s*\d+[.)]\s*/,''),c:'1'}}):[{n:'',c:'1'}]}
    if(!q.prods.length)q.prods.push({n:'',c:'1'});return q.prods}
  function prodsTxt(f,L){const q=L<0?f:(f.pts||[])[L];if(!q)return;const P=prodsDe(f,L).filter(x=>String(x.n||'').trim());q[L<0?'detalle':'que']=P.map((x,j)=>(j+1)+'. '+String(x.n).trim()+(Number(x.c)>1?' × '+Number(x.c):'')).join('\n')}
  function nsProds(f,L){const P=prodsDe(f,L),st='height:48px;border-radius:12px;border:1.5px solid #F1E4DA;padding:0 12px;font:inherit;font-size:16px;box-sizing:border-box;min-width:0';
    return `<div class="fld"><label>Productos a comprar</label><div style="display:flex;flex-direction:column;gap:8px">${P.map((x,j)=>`<div style="display:flex;align-items:center;gap:8px"><span style="width:26px;height:26px;border-radius:50%;background:#FDEBDF;color:#9A330A;font-size:13px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;flex:none">${j+1}</span><input aria-label="Producto ${j+1}" style="${st};flex:1 1 0%" placeholder="Ej. Arroz 5 kg" value="${E(x.n||'')}" data-in="pe:pr:${L}:${j}:n"><input aria-label="Cantidad del producto ${j+1}" style="${st};width:64px;text-align:center" inputmode="numeric" value="${E(x.c||'1')}" data-in="pe:pr:${L}:${j}:c">${P.length>1?`<button type="button" aria-label="Quitar producto ${j+1}" style="width:40px;height:40px;border-radius:50%;border:1px solid #F4C7C3;background:#FFFFFF;color:#B42318;font-size:20px;cursor:pointer" data-a="pe:prx:${L}:${j}">×</button>`:''}</div>`).join('')}
      <button type="button" class="b" style="height:44px;border-style:dashed;color:#C4410C;border-color:#E2A07E" data-a="pe:pr+:${L}">+ Agregar producto</button></div></div>`}
  function nsSitiosPayload(f,o){
    const antes=Array.isArray(o.puntos_recojo)?o.puntos_recojo:[];
    return (f.pts||[]).map(q=>({nom:String(q.nom||'').trim(),ubi:String(q.ubi||'').trim(),que:String(q.que||'').trim(),obs:String(q.obs||'').trim(),cd:cdN(q.cd)})).filter(q=>q.nom||q.que)
      .map((q,i)=>{const c=coordsDe(q.ubi),ya=antes.find(x=>Number(x.n)===i+2&&x.recogido_en&&String(x.nombre||'')===q.nom);
        return {n:i+2,nombre:q.nom||null,direccion:q.nom||null,ubicacion:q.ubi||null,lat:c?c.lat:null,lng:c?c.lng:null,que:q.que||null,obs:q.obs||null,costo_delivery:Number.isFinite(q.cd)?q.cd:null,recogido_en:ya?ya.recogido_en:null}});
  }
  /* delivery por punto de recojo: con 2 o más puntos el costo del servicio es la suma (igual que en encomienda) */
  const ptMulti=f=>(f.tipo==='recojo'||f.tipo==='compra')&&(f.pts||[]).length>0;
  function ptSuma(f){const L=[f.cdp].concat((f.pts||[]).map(q=>q.cd)).map(cdN);return L.every(Number.isFinite)?Math.round(L.reduce((a,b)=>a+b,0)*100)/100:NaN}
  function nsPuntosPayload(f,o){
    const antes=Array.isArray(o.puntos_recojo)?o.puntos_recojo:[];
    return (f.pts||[]).map(q=>({nom:String(q.nom||'').trim(),tel:String(q.tel||'').trim(),dir:String(q.dir||'').trim(),ref:String(q.ref||'').trim(),ubi:String(q.ubi||'').trim(),que:String(q.que||'').trim(),anom:String(q.anom||'').trim(),cd:cdN(q.cd),paga:f.tipo==='recojo'&&f.quien==='envia'&&f.pago!=='al_final'&&f.pago!=='pagado'&&String(f.pagapt||'1')===String((f.pts||[]).indexOf(q)+2)}))
      .filter(q=>q.nom||q.tel||q.dir||q.ubi)
      .map((q,i)=>{const c=coordsDe(q.ubi),ya=antes.find(x=>Number(x.n)===i+2&&x.recogido_en&&String(x.direccion||'')===q.dir&&String(x.ubicacion||'')===q.ubi);
        return {n:i+2,nombre:q.nom||null,telefono:q.tel||null,direccion:q.dir||null,referencia:q.ref||null,ubicacion:q.ubi||null,lat:c?c.lat:null,lng:c?c.lng:null,que:q.que||null,a_nombre:q.anom||null,costo_delivery:Number.isFinite(q.cd)?q.cd:null,paga_aqui:q.paga||null,recogido_en:ya?ya.recogido_en:null}});
  }
  /* ---------- Paquete de encomienda: el mismo formulario para el 1, 2, 3… ---------- */
  const PK_MAP={ind:'ind1',rn:'enom',rd:'edni',rt:'etel'};
  function pkObj(f,k){return k===0?f:(f.paqs||[])[k-1]}
  function pkGet(f,k,c){const o=pkObj(f,k);if(!o)return '';return k===0?(o[PK_MAP[c]||c]??''):(o[c]??'')}
  function pkSet(f,k,c,v){const o=pkObj(f,k);if(!o)return;if(k===0)o[PK_MAP[c]||c]=v;else o[c]=v}
  /* delivery por paquete (una guía por paquete): con 2 o más paquetes el costo del servicio es la suma */
  const cdN=v=>{const x=Number(String(v??'').replace(',','.'));return String(v??'').trim()!==''&&Number.isFinite(x)&&x>=0?Math.round(x*100)/100:NaN};
  const cdMulti=f=>f.tipo==='enc'&&f.nuevo&&(f.paqs||[]).length>0;
  const cdxSuma=f=>{const L=(f.cdx||[]).map(x=>cdN(x.v));return L.length&&L.every(Number.isFinite)?Math.round(L.reduce((a,b)=>a+b,0)*100)/100:NaN};
  function cdSuma(f){const L=[f.cd].concat((f.paqs||[]).map(q=>q.cd)).map(cdN);return L.every(Number.isFinite)?Math.round(L.reduce((a,b)=>a+b,0)*100)/100:NaN}
  /* encomienda por agencias: f.agG = paquetes de cada agencia, en orden; los paquetes 2… de una agencia copian su agencia */
  function agSync(f){let k0=0;(f.agG||[]).forEach(nG=>{for(let j=1;j<nG;j++){['ag','agubi'].forEach(c=>pkSet(f,k0+j,c,pkGet(f,k0,c)))}k0+=nG})}
  function agTotal(f){f.paqs=f.paqs||[];const t=(f.agG||[]).reduce((a,b)=>a+b,0);while(f.paqs.length<t-1)f.paqs.push({ag:'',dest:'',tpago:'',tenv:'',ind:'',agubi:'',igual:'',rn:'',rd:'',rt:''});if(f.paqs.length>t-1)f.paqs.splice(t-1)}
  function nsPaqForm(f,k,cant,op){op=op||{};
    const g=c=>pkGet(f,k,c),o=pkObj(f,k)||{};
    const ag=String(g('ag')||'').trim(),ags=(PE.ags||[]).slice().sort((a,b)=>String(a.nombre).localeCompare(String(b.nombre)));
    const agReg=ags.find(x=>agClave(x.nombre)===agClave(ag));
    if(ag&&!String(g('agubi')||'').trim()){const u=nsAgU(ag);if(u)pkSet(f,k,'agubi',u)}
    const agTxt=o.agOtra||(ag&&!agReg);
    const dsL=agReg?nsDsL(agReg.nombre):[],dest=String(g('dest')||'').trim(),dsReg=dsL.find(x=>agClave(x.destino_final)===agClave(dest));
    const dsTxt=o.dsOtro||!dsL.length||(dest&&!dsReg);
    const selSt='height:56px;border-radius:14px;border:1.5px solid #F1E4DA;padding:0 14px;font:inherit;font-size:16px;font-weight:700;width:100%;background:#fff;color:#1F1A17';
    const inp=(c,ph,at)=>`<input data-in="pe:pk:${k}:${c}" value="${E(g(c)||'')}" placeholder="${E(ph||'')}"${at||''}>`;
    const chips=(c,ops)=>`<div class="opc">${ops.map(x=>`<button type="button" class="${String(g(c)||'')===String(x[0])?'on':''}" data-a="pe:pks:${k}:${c}:${E(x[0])}">${E(x[1])}</button>`).join('')}</div>`;
    const tp0=optsDe('encTipoPago'),tp=tp0.length?tp0:[['pago_en_agencia','Pago en agencia'],['pago_a_destino','Pago a destino']];
    let h=op.tit?`<div style="display:flex;align-items:center;gap:8px;margin-top:${op.sinAg?'6px':'0'}"><span style="width:28px;height:28px;border-radius:50%;background:#C4410C;color:#FFFFFF;font-weight:800;font-size:14px;display:inline-flex;align-items:center;justify-content:center">${op.num}</span><b style="font-size:16px;color:#1F1A17">${E(op.tit)}</b></div>`:cant>1?`<span style="font-size:13px;color:#6B5E55">Paquete ${k+1} de ${cant}</span>`:'';
    if(!op.sinAg){h+=`<div class="fld"><label>Agencia</label><select data-in="pe:pkag:${k}" style="${selSt}"><option value="">${ags.length?'Elige una agencia registrada':'No hay agencias registradas'}</option>${ags.map(x=>`<option value="${E(x.nombre)}"${agReg&&!o.agOtra&&x===agReg?' selected':''}>${E(x.nombre)}</option>`).join('')}<option value="__otra"${agTxt?' selected':''}>➕ Otra agencia (escribir)</option></select></div>`;
    if(agTxt)h+=`<div class="fld"><label>Nombre de la agencia nueva</label>${inp('ag','Ej. Olva Courier',' autocomplete="off"')}</div>`;
    h+=nsAgUbiFld({ag})+`<div class="fld"><label>Ubicación de la agencia (Google Maps)</label>${inp('agubi','Pega el enlace de Google Maps')}</div>`+
      `<button type="button" class="b" style="height:44px;margin-top:-4px" data-a="pe:pkmapa:${k}">${coordsDe(g('agubi'))?'Cambiar en el mapa':'Marcar en el mapa'}</button>`;}
    if(dsL.length)h+=`<div class="fld"><label>Destino</label><select data-in="pe:pkds:${k}" style="${selSt}"><option value="">Elige un destino de ${E(agReg.nombre)}</option>${dsL.map(x=>`<option value="${E(x.destino_final)}"${dsReg&&!o.dsOtro&&x===dsReg?' selected':''}>${E(x.destino_final)}</option>`).join('')}<option value="__otro"${dsTxt?' selected':''}>➕ Otro destino (escribir)</option></select></div>`;
    if(dsTxt)h+=`<div class="fld"><label>${dsL.length?'Destino nuevo':'Destino'}</label>${inp('dest','Ej. Lima')}</div>`;
    h+=`<div class="fld"><label>Modalidad de pago</label>${chips('tpago',tp)}</div><div class="fld"><label>Tipo de encomienda</label>${chips('tenv',optsDe('encTipoEnvio'))}</div>`+
      `<div class="fld"><label>Indicación para este paquete (opcional)</label>${inp('ind','Ej. entregar a nombre de la empresa')}</div>`+
      (`<div style="height:1px;background:#F1E4DA;margin:4px 0"></div><div class="lbl" style="margin:0">Quien recibe este paquete (opcional)</div><span style="font-size:13px;color:#6B5E55;margin-top:-4px">Si no lo tienes, sigue: estos datos van en el rotulado del paquete.</span>`);
    if(k>0)h+=`<button type="button" class="b" style="height:44px${o.igual?';border-color:#C4410C;background:#FFF4EC;color:#9A330A':''}" data-a="pe:pks:${k}:igual:${o.igual?'':'1'}">${o.igual?'✓ ':''}Lo recibe la misma persona del paquete 1${String(f.enom||'').trim()?' ('+E(String(f.enom).trim())+')':''}</button>`;
    if(k===0||!o.igual)h+=`<div class="fld"><label>Nombre y apellido de quien recibe</label>${inp('rn','')}</div><div class="fld"><label>DNI de quien recibe</label>${inp('rd','',' inputmode="numeric" maxlength="12"')}</div><div class="fld"><label>Número de quien recibe</label>${inp('rt','',' type="tel" inputmode="tel" maxlength="20"')}</div>`;
    return h;
  }
  /* campos de un paquete adicional (2 o 3) de la encomienda */
  function nsPaqCampos(f,q,i2,cant){
    if(!coordsDe(q.agubi)&&q.ag){const u=nsAgU(q.ag);if(u)q.agubi=u}
    const ch=(k,i2,ops,v)=>`<div class="opc">${ops.map(x=>`<button type="button" class="${String(v)===String(x[0])?'on':''}" data-a="pe:pqs:${i2}:${k}:${E(x[0])}">${E(x[1])}</button>`).join('')}</div>`;
    const inp=(k,i2,v,ph)=>`<input data-in="pe:pq:${i2}:${k}" value="${E(v)}" placeholder="${E(ph)}">`;
    return `<span style="font-size:13px;color:#6B5E55">Paquete ${i2+2} de ${cant}</span>
        <div class="fld"><label>Agencia</label>${inp('ag',i2,q.ag,'Ej. Olva Courier')}</div>${nsAgChips(q.ag,'pe:pqag:'+i2)}${nsAgUbiFld({ag:q.ag})}
        <div class="fld"><label>Ubicación de la agencia (Google Maps)</label>${inp('agubi',i2,q.agubi,'Pega el enlace de Google Maps')}</div>
        <button type="button" class="b" style="height:44px;margin-top:-4px" data-a="pe:pqmapa:${i2}">${coordsDe(q.agubi)?'Cambiar en el mapa':'Marcar en el mapa'}</button><div class="fld"><label>Destino</label>${inp('dest',i2,q.dest,'Ej. Lima')}</div>${nsDsChips(q.ag,q.dest,'pe:pqds:'+i2)}
        <div class="fld"><label>Modalidad de pago</label>${ch('tpago',i2,OPS.encTipoPago,q.tpago)}</div><div class="fld"><label>Tipo de encomienda</label>${ch('tenv',i2,OPS.encTipoEnvio,q.tenv)}</div>
        <div class="fld"><label>Indicación del cliente (opcional)</label>${inp('ind',i2,q.ind,'')}</div>
        <div style="height:1px;background:#F1E4DA;margin:4px 0"></div>
        <div class="lbl" style="margin:0">Quien recibe el paquete ${i2+2}</div>
        <button type="button" class="b${q.igual?' on':''}" style="height:44px${q.igual?';border-color:#C4410C;background:#FFF4EC;color:#9A330A':''}" data-a="pe:pqs:${i2}:igual:${q.igual?'':'1'}">${q.igual?'✓ ':''}Lo recibe la misma persona del paquete 1${String(f.enom||'').trim()?' ('+E(String(f.enom).trim())+')':''}</button>
        ${q.igual?'':`<div class="fld"><label>Nombre y apellido de quien recibe</label>${inp('rn',i2,q.rn,'')}</div><div class="fld"><label>DNI de quien recibe</label>${inp('rd',i2,q.rd,'').replace('<input','<input inputmode="numeric" maxlength="12"')}</div><div class="fld"><label>Número de quien recibe</label>${inp('rt',i2,q.rt,'').replace('<input','<input type="tel" inputmode="tel" maxlength="20"')}</div>`}`;
  }
  /* lo que falta en el paso actual (o '' si se puede seguir) */
  function nsFalta(f){
    const paso=nsPasos(f)[f.paso||0],t=v=>String(v||'').trim();
    /* se avanza con los datos que haya; solo el costo del servicio es necesario */
    if(paso==='Información de pago del servicio'&&f.tipo==='recojo'&&ptMulti(f)&&f.quien==='envia'&&f.pago!=='al_final'&&!(+f.pagapt>=1&&+f.pagapt<=1+f.pts.length))return 'Elige en qué punto de recojo paga el servicio.';
    if(paso==='Información de pago del servicio'&&ptMulti(f)){const pl=f.tipo==='compra'?'lugar':'punto';if(!Number.isFinite(cdN(f.cdp)))return 'Escribe el delivery del '+pl+' 1.';const k=f.pts.findIndex(q=>!Number.isFinite(cdN(q.cd)));if(k>=0)return 'Escribe el delivery del '+pl+' '+(k+2)+'.';f.costo=String(ptSuma(f))}
    if(paso==='Información de pago del servicio'&&cdMulti(f)){const n=1+f.paqs.length;for(let k=0;k<n;k++)if(!Number.isFinite(cdN(pkGet(f,k,'cd'))))return 'Escribe el delivery del paquete '+(k+1)+'.';f.costo=String(cdSuma(f))}
    if(paso==='Información de pago del servicio'&&!(Number(String(f.costo).replace(',','.'))>=0&&t(f.costo)))return 'Escribe el costo del servicio.';
    return '';
  }
  /* agencias y destinos registrados como botones: al tocar se llenan */
  function nsAgChips(v,acc){const L=PE.ags||[];if(!L.length)return '';return `<div class="opc" style="margin-top:-4px">${L.map((a,k)=>`<button type="button" class="${String(v||'').trim().toLowerCase()===String(a.nombre||'').trim().toLowerCase()?'on':''}" data-a="${acc}:${k}">${E(a.nombre)}</button>`).join('')}</div>`}
  function nsDsL(ag){const a=(PE.ags||[]).find(x=>String(x.nombre||'').trim().toLowerCase()===String(ag||'').trim().toLowerCase());return a?(PE.dsts||[]).filter(d=>String(d.agencia_id)===String(a.id)):[]}
  function nsDsChips(ag,v,acc){const L=nsDsL(ag);if(!L.length)return '';return `<div class="opc" style="margin-top:-4px">${L.map((d,k)=>`<button type="button" class="${String(v||'').trim().toLowerCase()===String(d.destino_final||'').trim().toLowerCase()?'on':''}" data-a="${acc}:${k}">${E(d.destino_final)}</button>`).join('')}</div>`}
  function nsUsarCli(f,id){
    const c=((C2.cli&&C2.cli.data)||[]).find(x=>String(x.id)===String(id));if(!c)return;
    f.cq='';
    const pasoA=nsPasos(f)[f.paso||0],mPt=f.tipo==='recojo'&&/^Punto de recojo (\d+)$/.exec(pasoA);
    /* punto de recojo 2, 3…: solo llena ese punto (el cliente del pedido no cambia) */
    if(mPt){const q=(f.pts||[])[+mPt[1]-2];if(q)Object.assign(q,{nom:cliN(c),tel:cliT(c),dir:c.direccion||q.dir,ubi:cliU(c)||q.ubi});return}
    const ladoR=(f.tipo==='recojo'&&f.pide==='recibe')||(f.tipo==='enc'&&pasoA==='Paquete 1');
    /* el cliente del pedido es solo quien manda a recoger */
    if((f.tipo!=='recojo'&&f.tipo!=='enc')||ladoR===(f.pide==='recibe'))f.cli=c.id;
    if(f.tipo==='compra')Object.assign(f,{nom:cliN(c),tel:cliT(c),dir:c.direccion||f.dir,ubi:cliU(c)||f.ubi});
    else if(ladoR&&f.tipo==='enc')Object.assign(f,{enom:cliN(c),etel:cliT(c),edni:c.documento||c.dni||f.edni});
    else if(ladoR)Object.assign(f,{enom:cliN(c),etel:cliT(c),edir:c.direccion||f.edir,eubi:cliU(c)||f.eubi});
    else Object.assign(f,{rnom:cliN(c),rtel:cliT(c),rdir:c.direccion||f.rdir,rubi:cliU(c)||f.rubi},f.tipo==='enc'?{rdni:c.documento||c.dni||f.rdni}:{});
  }
  async function svcCrear(f,win){
    f.msg='';const p=svcPayload(f,{});if(!p)return false;
    

    const costo=Number(p.costo_delivery)||0;
    if(f.tipo==='compra'){p.lugar_compra=String(f.lugar||'').trim()||null;p.detalle_compra=String(f.detalle||'').trim()||null;p.subtotal=0;p.total=costo}
    const pc=Number(String(f.pagacon||'').replace(',','.'));
    if(f.pago==='efectivo'&&f.tipo!=='enc'&&pc>0){if(f.tipo!=='compra'&&pc<costo){f.msg='Con cuánto paga debe ser al menos '+M(costo)+'.';return false}
      p.observaciones=[p.observaciones,'__PIDEMAS_PAGO_EFECTIVO__'+JSON.stringify(f.tipo==='compra'?{monto:r2(pc)}:{monto:r2(pc),vuelto:r2(pc-costo)})].filter(Boolean).join(' | ')}
    if(f.tipo==='enc'){

      const agId=String(f.ag||'').trim()?await nsAgencia(f.ag,f.dest):null;if(agId){p.agencia_id=agId}
      if(coordsDe(f.agubi)||(f.paqs||[]).some(q=>coordsDe(q.agubi)))try{await nsAgRegistrar(f)}catch(_){}
      const ex=[];for(const [i,q] of f.paqs.entries()){const id2=await nsAgencia(q.ag,q.dest);ex.push({n:i+2,q,id2})}
      /* datos ordenados de cada paquete adicional, con quien lo recibe */
      p.paquetes_extra=ex.map(({n,q})=>({numero:n,agencia:String(q.ag||'').trim(),destino:String(q.dest||'').trim(),tipo_pago:q.tpago||null,tipo_envio:q.tenv||null,indicacion:String(q.ind||'').trim()||null,costo_delivery:Number.isFinite(cdN(q.cd))?cdN(q.cd):null,
        recibe_nombre:(q.igual?f.enom:q.rn)?String(q.igual?f.enom:q.rn).trim():null,recibe_telefono:(q.igual?f.etel:q.rt)?String(q.igual?f.etel:q.rt).trim():null,recibe_dni:(q.igual?f.edni:q.rd)?String(q.igual?f.edni:q.rd).trim():null,agencia_ubicacion:String(q.agubi||'').trim()||null}));
      const tpN=v=>(OPS.encTipoPago.find(x=>x[0]===v)||[,v])[1],teN=v=>(OPS.encTipoEnvio.find(x=>x[0]===v)||[,v])[1];
      let extra='';if(String(f.ind1||'').trim())extra+=' | Indicación paquete 1: '+String(f.ind1).replace(/[|]/g,'/').trim();
      ex.forEach(({n,q})=>{if(q.tenv)extra+=' | Tipo paquete '+n+': '+teN(q.tenv);if(String(q.ind||'').trim())extra+=' | Indicación paquete '+n+': '+String(q.ind).replace(/[|]/g,'/').trim()});
      if(ex.length&&Number.isFinite(cdN(f.cd)))extra+=' | Delivery por paquete: '+[f.cd].concat(ex.map(({q})=>q.cd)).map((v,i)=>'Paquete '+(i+1)+' '+M(cdN(v))).join('; ');
      if(ex.length)extra+=' | PAQUETES ADICIONALES: '+ex.map(({n,q})=>`Paquete ${n}: Agencia ${String(q.ag).trim()}; destino ${String(q.dest).trim()}; modalidad ${q.tpago}`).join(' || ');
      if(extra)p.observaciones=(p.observaciones||'')+extra;
      if(f.pago==='efectivo'&&pc>0){if(pc<costo){f.msg='Con cuánto paga debe ser al menos '+M(costo)+'.';return false}p.observaciones=[p.observaciones,'__PIDEMAS_PAGO_EFECTIVO__'+JSON.stringify({monto:r2(pc),vuelto:r2(pc-costo)})].filter(Boolean).join(' | ')}
    }
    const moto=f.moto?(PE.motos||[]).find(m=>String(m.id)===String(f.moto)):null;
    Object.assign(p,{tipo_servicio:TSV[f.sv],cliente_id:f.cli||null,estado:moto?'asignado':'pendiente',motorizado_id:moto?moto.id:null,motorizado_nombre:moto?moto.nombre_completo:null});
    if(moto)p.asignado_en=new Date().toISOString();
    p.pago_modalidad=f.pago==='pagado'?'pagado':String(p.metodo_pago||'');
    p.quien_paga=f.tipo==='compra'?(f.para==='otra'&&f.quien==='recibe'?'recibe':'cliente'):f.tipo==='enc'?(f.quien==='recibe'?'recibe':'envia'):(f.pago==='pagado'?null:f.quien);
    let r=await conTiempo(D().from('pedidos').insert(p).select('id').single());
    if(r.error&&/column|schema cache|PGRST204|42703/i.test(String(r.error.message)+String(r.error.code))){SVC_OPC.concat(['paquetes_extra','motorizado_nombre','asignado_en','lugar_compra','detalle_compra','pago_modalidad','compra_fotos']).forEach(k=>delete p[k]);r=await conTiempo(D().from('pedidos').insert(p).select('id').single())}
    if(r.error)throw r.error;const id=r.data.id;
    if(moto){
      if(moto.usuario_id){const t=f.tipo==='compra'?'Nueva compra asignada':f.tipo==='enc'?'Nueva encomienda asignada':'Nuevo servicio de recojo y entrega';D().from('notificaciones').insert({usuario_id:moto.usuario_id,pedido_id:id,tipo:'pedido_asignado',titulo:t,mensaje:'Tienes '+(f.tipo==='compra'?'una nueva compra asignada.':f.tipo==='enc'?'una nueva encomienda asignada.':'un nuevo servicio de recojo y entrega asignado.'),leida:false}).then(()=>{},()=>{})}
      const w=telW(moto.telefono);
      if(w&&win){win.location.href='https://wa.me/'+w+'?text='+encodeURIComponent(['*PIDEMÁS DELIVERY*','¡Hola, '+String(moto.nombre_completo||'motorizado').trim()+'!','Tienes '+(f.tipo==='compra'?'una nueva compra':f.tipo==='enc'?'una nueva encomienda':'un nuevo servicio de recojo y entrega')+' asignado.','Pedido: '+ref(id),'Entra al panel para revisarlo:','https://pidemas.pe/motorizado/'].join('\n'))}
      else if(win)win.close();
    }else if(win)win.close();
    nsGuardarClientes(f).catch(()=>{});
    try{await window.loadOrders()}catch(_){}
    return id;
  }
  /* agencia y destino: si no están registrados, se registran (como antes) */
  async function nsAgencia(nom,dest){
    nom=String(nom||'').trim();dest=String(dest||'').trim();if(!nom)return null;
    let a=(PE.ags||[]).find(x=>agClave(x.nombre)===agClave(nom));
    /* una sola agencia por nombre: si ya existe (aunque esté desactivada) se usa esa */
    if(!a){const t=await D().from('agencias').select('id,nombre,activo');a=((t&&t.data)||[]).find(x=>agClave(x.nombre)===agClave(nom))||null;
      if(a&&a.activo===false){await D().from('agencias').update({activo:true}).eq('id',a.id);a.activo=true}
      if(!a){const r=await D().from('agencias').insert({nombre:nom,activo:true}).select('id,nombre,activo').maybeSingle();
        if(r.data)a=r.data;else{const t2=await D().from('agencias').select('id,nombre,activo');a=((t2&&t2.data)||[]).find(x=>agClave(x.nombre)===agClave(nom))||null}}
      if(!a)return null;if(!(PE.ags||[]).some(x=>x.id===a.id))(PE.ags=PE.ags||[]).push(a)}
    if(dest){try{const d=await D().from('agencia_destinos').select('id,destino_final').eq('agencia_id',a.id);if(!d.error&&!(d.data||[]).some(x=>agClave(x.destino_final)===agClave(dest)))await D().from('agencia_destinos').insert({agencia_id:a.id,destino_final:dest,activo:true})}catch(_){}}
    return a.id;
  }
  /* ubicación guardada de cada agencia (la misma que se marca en Más › Agencias) */
  function nsAgU(nom){const u=(PE.agU||{})[agClave(nom)];return u&&Number.isFinite(+u.lat)&&Number.isFinite(+u.lng)?'https://maps.google.com/?q='+Number(u.lat).toFixed(6)+','+Number(u.lng).toFixed(6):''}
  function nsAgUbiFld(f){
    if(PE.agU===undefined){PE.agU=null;agUbis().then(u=>{PE.agU=u||{};const F=PE.f;if(F&&F.tipo==='enc'&&!coordsDe(F.agubi)){const x=nsAgU(F.ag);if(x)F.agubi=x}key='';pintar()}).catch(()=>{PE.agU={}})}
    const nom=String(f.ag||'').trim();if(!nom)return '';const reg=(PE.ags||[]).some(x=>agClave(x.nombre)===agClave(nom)),u=nsAgU(nom);
    return `<span style="font-size:13px;color:#6B5E55;margin-top:-4px;line-height:1.45">${reg?(u?'Agencia registrada · su ubicación ya está guardada.':'Agencia registrada sin ubicación: márcala y se guarda para la próxima vez.'):'Agencia nueva: se registra en Agencias al guardar el pedido, con su ubicación.'}</span>`}
  /* registra agencia(s) y destino(s) nuevos y guarda la ubicación de la agencia */
  async function nsAgRegistrar(f){
    const id=await nsAgencia(f.ag,f.dest);
    for(const q of (f.paqs||[]))try{await nsAgencia(q.ag,q.dest)}catch(_){}
    /* ubicación de la agencia de cada paquete (paquete 1 y adicionales) */
    for(const [nom0,ubi] of [[f.ag,f.agubi]].concat((f.paqs||[]).map(q=>[q.ag,q.agubi]))){
      const ca=coordsDe(ubi),nom=String(nom0||'').trim();if(!ca||!nom)continue;
      const u=(PE.agU||{})[agClave(nom)];
      if(!u||Math.abs(+u.lat-ca.lat)>1e-5||Math.abs(+u.lng-ca.lng)>1e-5){const ag=(PE.ags||[]).find(x=>agClave(x.nombre)===agClave(nom));
        try{PE.agU=await agGuardarUbi(nom,ag?ag.id:null,{lat:ca.lat,lng:ca.lng,direccion:(u&&u.direccion)||''})}catch(_){}}}
    return id;
  }
  /* quien envía y quien recibe quedan en Clientes (si su número aún no está) */
  async function nsGuardarClientes(f){
    const ps=f.tipo==='compra'?[[f.nom,f.tel,f.dir,f.ubi,f.doc]]:[[f.rnom,f.rtel,f.rdir,f.rubi,f.rdni],[f.enom,f.etel,f.tipo==='recojo'?f.edir:'',f.tipo==='recojo'?f.eubi:'',f.edni]];
    const L2=(C2.cli&&C2.cli.data)||[];let n=0;
    for(const [nom,tel,dir,ubi,doc] of ps){const t=dig(tel).slice(-9);if(!String(nom||'').trim()||t.length<9)continue;
      const b={nombre_completo:String(nom).trim().replace(/\s+/g,' '),telefono:t,direccion:String(dir||'').trim()||null,referencia:String(ubi||'').trim()||null,activo:true};const co=coordsDe(ubi);if(co){b.latitud=co.lat;b.longitud=co.lng}
      /* un cliente por nombre: si ya existe, solo se actualizan sus datos (teléfono, dirección, ubicación) */
      const ya=L2.find(c=>agClave(cliN(c))===agClave(b.nombre_completo));
      if(ya){const u={};if(t!==dig(cliT(ya)).slice(-9))u.telefono=t;if(b.direccion&&b.direccion!==ya.direccion)u.direccion=b.direccion;if(b.referencia&&b.referencia!==ya.referencia)u.referencia=b.referencia;if(co){u.latitud=co.lat;u.longitud=co.lng}if(doc&&String(doc).trim()!==String(ya.documento||''))u.documento=String(doc).trim();
        if(Object.keys(u).length){let q=await D().from('clientes').update(u).eq('id',ya.id);if(q.error&&u.documento){delete u.documento;q=await D().from('clientes').update(u).eq('id',ya.id)}if(!q.error)n++}continue}
      let q=await D().from('clientes').insert(Object.assign({},b,doc?{documento:String(doc).trim()}:{}));if(q.error&&doc)q=await D().from('clientes').insert(b);if(!q.error)n++}
    if(n)datosCli(true);
  }

  const n2=v=>{const x=Number(String(v??'').replace(',','.'));return Number.isFinite(x)?x:0};
  async function pedidoEditar(id){
    const o=L().find(x=>String(x.id)===String(id));if(!o)return;
    try{if(window.PdPasos&&PdPasos.isOpen())PdPasos.close()}catch(_){}
    try{if(paginaVieja())cerrarVieja()}catch(_){}
    const sv=svc(o);
    if(sv){PE.f=svcDatos(o,sv);if(!sub)try{history.pushState({pdApp:1},'')}catch(_){}sub='pedidoform';key='';pintar();return}
    PE.f={id:o.id,sv,nombre:o.nombre_cliente||'',tel:o.telefono_cliente||'',dir:o.direccion_entrega||'',ref:o.referencia_entrega||'',
      rnom:o.nombre_remitente||'',rtel:o.telefono_remitente||'',rdir:o.direccion_recojo||'',
      sub:o.subtotal!=null?String(Number(o.subtotal).toFixed(2)):'',del:o.costo_delivery!=null?String(Number(o.costo_delivery).toFixed(2)):'',
      extra:Math.round((n2(o.total)-n2(o.subtotal)-n2(o.costo_delivery))*100)/100,
      metodo:String(o.metodo_pago||'efectivo').toLowerCase(),obs:o.observaciones||'',items:null,quitar:[],msg:''};
    if(!sub)try{history.pushState({pdApp:1},'')}catch(_){}
    sub='pedidoform';key='';pintar();
    try{const r=await D().from('detalle_pedidos').select('*').eq('pedido_id',o.id);if(PE.f&&String(PE.f.id)===String(o.id)){PE.f.items=(r.data||[]).map(d=>({id:d.id,n:d.nombre_producto||'Producto',q:String(d.cantidad||1),p:String(Number(d.precio_unitario??(n2(d.subtotal)/(Number(d.cantidad)||1))).toFixed(2))}));key='';pintar()}}catch(_){if(PE.f)PE.f.items=[]}
  }
  window.pdAdmEditarPedido=pedidoEditar;
  window.editOrder=id=>pedidoEditar(id);
  window.pdAbrirPedidoAdmin=id=>{try{if(paginaVieja())cerrarVieja()}catch(_){}const o=L().find(x=>String(x.id)===String(id));if(o&&typeof window.pdAbrirPasosAdmin==='function')return window.pdAbrirPasosAdmin(id)};
  const peSub=f=>f.items&&f.items.length?Math.round(f.items.reduce((a,x)=>a+n2(x.q)*n2(x.p),0)*100)/100:n2(f.sub);
  const peTot=f=>Math.round((peSub(f)+n2(f.del)+(f.extra||0))*100)/100;
  function pedidoForm(){
    const f=PE.f;if(!f)return {head:top3('Pedidos','Editar pedido'),body:''};
    if(f.nuevo)return nsVista(f);
    if(f.tipo)return {head:top3(f.sv+' · '+ref(f.id),'Editar pedido'),body:svcForm(f),foot:`<button type="button" class="b o" style="height:54px;font-size:16px" data-a="pe:guardar">Guardar cambios</button>`};
    const fl=(id,l,k,ph,o)=>`<div class="fld"><label for="${id}">${l}</label><input id="${id}" value="${E(f[k])}" data-in="pe:${k}"${ph?` placeholder="${E(ph)}"`:''}${o||''}></div>`;
    let h=`<div class="cd" style="flex-direction:row;align-items:center;gap:10px"><span style="font-size:14px;color:#6B5E55">Corrige lo que se envió mal. Si ya hay un motorizado asignado, le avisamos del cambio.</span></div>`;
    if(f.sv)h+=`<div class="cd"><div class="lbl">Quien envía / recojo</div>${fl('peRn','Nombre de quien envía','rnom','')}${fl('peRt','Número de quien envía','rtel','',' type="tel" inputmode="numeric" maxlength="15"')}${fl('peRd','Dirección de recojo','rdir','')}</div>`;
    h+=`<div class="cd"><div class="lbl">${f.sv==='Recojo y entrega'?'Quien recibe / entrega':'Cliente y entrega'}</div>${fl('peN',f.sv==='Recojo y entrega'?'Nombre de quien recibe':f.sv==='Compra'?'Nombre de quien pide la compra':'Nombre del cliente','nombre','')}${fl('peT',f.sv==='Recojo y entrega'?'Número de quien recibe':f.sv==='Compra'?'Número de quien pide la compra':'Número del cliente','tel','',' type="tel" inputmode="numeric" maxlength="15"')}${fl('peD','Dirección de entrega','dir','')}${fl('peR','Referencia','ref','Ej. puerta azul')}</div>`;
    if(f.items===null)h+=`<div class="load">Cargando productos…</div>`;
    else if(f.items.length)h+=`<div class="cd"><div class="lbl">Productos</div>${f.items.map((x,i)=>`<div style="display:flex;flex-direction:column;gap:6px;padding:8px 0;border-bottom:1px solid #F1E4DA"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b style="font-size:15px;overflow-wrap:anywhere">${E(x.n)}</b><button type="button" class="ib" style="width:36px;height:36px;color:#B42318" data-a="pe:quitar:${i}" aria-label="Quitar ${E(x.n)}">${IC.trash}</button></div><div class="two"><div class="fld"><label for="peQ${i}">Cantidad</label><input id="peQ${i}" inputmode="numeric" value="${E(x.q)}" data-in="peq:${i}"></div><div class="fld"><label for="peP${i}">Precio c/u (S/)</label><input id="peP${i}" inputmode="decimal" value="${E(x.p)}" data-in="pep:${i}"></div></div></div>`).join('')}</div>`;
    h+=`<div class="cd"><div class="lbl">Montos</div>${f.items&&f.items.length?'':fl('peS',f.sv==='Compra'?'Gasto de la compra (S/)':'Productos (S/)','sub','0.00',' inputmode="decimal"')}${fl('peL','Delivery / servicio (S/)','del','0.00',' inputmode="decimal"')}
      <div class="li"><span>Productos</span><b id="peSu">${M(peSub(f))}</b></div>${f.extra?`<div class="li"><span>${f.extra>0?'Otros cargos (bolsa, etc.)':'Descuento'}</span><b>${M(f.extra)}</b></div>`:''}<div class="li" style="font-size:17px"><span>Total</span><b id="peTo">${M(peTot(f))}</b></div></div>`;
    h+=`<div class="cd"><div class="lbl">Pago</div><div class="seg" style="grid-template-columns:1fr 1fr">${[['efectivo','Efectivo'],['yape','Yape']].map(x=>`<button type="button" class="${f.metodo===x[0]?'on':''}" data-a="pe:met:${x[0]}">${x[1]}</button>`).join('')}</div></div>`;
    h+=`<div class="cd">${fl('peO','Observaciones','obs','')}</div>`;
    if(f.msg)h+=`<div class="err">${E(f.msg)}</div>`;
    return {head:top3('Pedido '+ref(f.id),'Editar pedido'),body:h,foot:`<button type="button" class="b o" style="height:54px;font-size:16px" data-a="pe:guardar">Guardar cambios · ${M(peTot(f))}</button>`};
  }
  function peVivo(){const f=PE.f;if(!f)return;const vu=root.getElementById('peVu');if(vu&&f.tipo)vu.innerHTML=vueltoTxt(f);const a=root.getElementById('peSu'),b=root.getElementById('peTo'),g=root.querySelector('[data-a="pe:guardar"]');if(a)a.textContent=M(peSub(f));if(b)b.textContent=M(peTot(f));if(g)g.textContent='Guardar cambios · '+M(peTot(f))}
  async function pedidoGuardar(){
    const f=PE.f;f.msg='';const o=L().find(x=>String(x.id)===String(f.id));if(!o){f.msg='No se encontró el pedido.';return}
    if(f.tipo){
      try{if(!(await conTiempo(svcGuardar(f,o))))return;try{if(typeof notifyMotoOrderChange==='function')notifyMotoOrderChange(o,'Pedido actualizado por Pidemás',`El pedido ${ref(o.id)} fue corregido. Revisa los datos antes de seguir.`).catch(()=>{})}catch(_){}
        try{window.loadOrders().catch(()=>{})}catch(_){}(window.pdExito||window.pdAviso||alert)('Pedido actualizado');PE.f=null;volverSub()}catch(err){f.msg='No se pudo guardar: '+(err?.message||err)}return}
    if(!f.nombre.trim()||!f.dir.trim()){f.msg='Completa el nombre y la dirección de entrega.';return}
    if(f.items&&f.items.some(x=>!(n2(x.q)>0)||n2(x.p)<0)){f.msg='Revisa las cantidades y precios.';return}
    const subT=peSub(f),del=n2(f.del),tot=peTot(f);if(tot<0){f.msg='El total no puede ser negativo.';return}
    const patch={nombre_cliente:f.nombre.trim(),telefono_cliente:f.tel.trim(),direccion_entrega:f.dir.trim(),referencia_entrega:f.ref.trim(),subtotal:subT,costo_delivery:del,total:tot,metodo_pago:f.metodo,observaciones:f.obs.trim()};
    if(f.sv){patch.nombre_remitente=f.rnom.trim();patch.telefono_remitente=f.rtel.trim();patch.direccion_recojo=f.rdir.trim()}
    try{
      if(f.items){for(const x of f.items){const q=Math.round(n2(x.q)),p=Math.round(n2(x.p)*100)/100;const r=await D().from('detalle_pedidos').update({cantidad:q,precio_unitario:p,subtotal:Math.round(q*p*100)/100}).eq('id',x.id);if(r.error)throw r.error}
        for(const id of f.quitar){const r=await D().from('detalle_pedidos').delete().eq('id',id);if(r.error)throw r.error}}
      const r=await conTiempo(D().from('pedidos').update(patch).eq('id',o.id).select('id').maybeSingle());if(r.error)throw r.error;if(!r.data)throw new Error('Supabase no guardó el cambio. Revisa los permisos.');
      try{if(typeof notifyMotoOrderChange==='function')notifyMotoOrderChange(o,'Pedido actualizado por Pidemás',`El pedido ${ref(o.id)} fue corregido. Revisa los datos antes de seguir.`).catch(()=>{})}catch(_){}
      {const metAntes=o.metodo_pago,antes=Object.assign({},o);Object.assign(o,patch);await cajaPorCambioPago(o,metAntes,patch.metodo_pago);await cajaPorCambioMonto(o,antes,metAntes)}try{window.loadOrders().catch(()=>{})}catch(_){}
      (window.pdExito||window.pdAviso||alert)('Pedido actualizado');PE.f=null;volverSub();
    }catch(err){f.msg='No se pudo guardar: '+(err?.message||err)}
  }

  /* =============== SECCIONES DEL MENÚ REHECHAS (registro) =============== */
  /* Cada sección: titulo, grupo y una función que devuelve {body,foot}. Las que no están aquí abren la página de siempre. */
  const SEC={};let secK=null;const SF={};
  const r2=n=>Math.round((Number(n)||0)*100)/100;
  const fch=v=>{try{return new Date(v).toLocaleDateString('es-PE',{timeZone:'America/Lima',day:'2-digit',month:'short'}).replace('.','')}catch(e){return ''}};
  const telW=t=>{const d=dig(t);return d?(d.startsWith('51')?d:d.length===9?'51'+d:d):''};
  const conf=t=>pregunta(t);
  const ok=t=>(window.pdExito||window.pdAviso||alert)(t);
  const mal=t=>(window.pdAviso||alert)(t);
  async function baseCtl(){const [m,n]=await Promise.all([D().from('motorizados').select('id,nombre_completo,telefono,activo,usuario_id').order('nombre_completo'),D().from('negocios').select('id,nombre,telefono')]);return {motos:m.data||[],negs:n.data||[]}}
  const mN=(b,id)=>(b.motos.find(m=>String(m.id)===String(id))||{}).nombre_completo||'Motorizado';
  const fila=(t,s,der)=>`<div class="mv"><span class="tx"><b>${t}</b><span>${s}</span></span>${der||''}</div>`;
  const vacio=t=>`<div class="vac">${E(t)}</div>`;
  const cargando=c=>c.err?`<div class="err">${E(c.err)}</div>`:'<div class="load">Cargando…</div>';
  function abrirSec(k){secK=k;SF[k]=SF[k]||{};if(C2['s:'+k])C2['s:'+k].t=0;sub='sec';key='';try{history.pushState({pdApp:1},'')}catch(_){}pintar()}
  function secVista(){const S=SEC[secK];if(!S)return {head:top3('Administración','Sección'),body:''};const v=S.v();return {head:v.head||top3(S.g,S.t,S.rf?`<button type="button" class="ib" data-a="sec:rf" aria-label="Actualizar">${IC.refresh}</button>`:''),body:v.body,foot:v.foot}}
  const datos=(k,fn)=>cargar('s:'+k,fn);
  const recargar=k=>{if(C2['s:'+k])C2['s:'+k].t=0;cargar('s:'+k,SEC[k].load,true)};

  /* --- Yape por confirmar --- */
  SEC['yape por confirmar']={g:'Control de caja y sueldos',t:'Cobros pendientes y Yape',rf:1,
    load:async()=>{const b=await baseCtl();const {data,error}=await D().from('cobros').select('id,pedido_id,motorizado_id,monto,confirmado_en,yape_recibido_en').eq('metodo_pago','yape').eq('confirmado',true).is('yape_recibido_en',null).gte('confirmado_en',new Date(Date.now()-45*864e5).toISOString()).order('confirmado_en',{ascending:false}).limit(300);if(error)throw error;
      const ids=[...new Set((data||[]).map(c=>c.pedido_id).filter(Boolean))];const peds={};if(ids.length){const r=await D().from('pedidos').select('id,nombre_cliente,telefono_cliente,total,estado,pago_acordado').in('id',ids);(r.data||[]).forEach(p=>peds[p.id]=p)}
      /* encomiendas entregadas con algo pendiente: lo que Pidemás pagó en las agencias y/o el delivery que se paga al final */
      let EN=[];try{const r=await D().from('pedidos').select('id,nombre_cliente,nombre_remitente,telefono_cliente,telefono_remitente,total,estado,observaciones,pago_servicio_momento,pago_confirmado,agencias_proceso,monto_pagado_agencia,pago_agencia_cobrado_en,entregado_en,creado_en').ilike('tipo_servicio','%encomienda%').eq('estado','entregado').is('pago_agencia_cobrado_en',null).gte('creado_en',new Date(Date.now()-45*864e5).toISOString()).order('creado_en',{ascending:false}).limit(200);
        EN=(r.data||[]).map(p=>{const ap=Array.isArray(p.agencias_proceso)?p.agencias_proceso:[];const ag=Math.round((ap.reduce((a,y)=>a+(y&&y.pago_en?Number(y.pago_monto)||0:0),0)||Number(p.monto_pagado_agencia)||0)*100)/100;
          const delPag=/servicio marcado como pagado/i.test(String(p.observaciones||''))||String(p.pago_servicio_momento||'').toLowerCase()==='pagado'||p.pago_confirmado===true;const del=delPag?0:Number(p.total)||0;
          return Object.assign({},p,{ag,del,pend:Math.round((ag+del)*100)/100,ags:ap.filter(y=>y&&y.pago_en&&Number(y.pago_monto)>0)})}).filter(p=>p.pend>0.004)}catch(_){}
      /* recojos y compras que el cliente paga al final a Pidemás */
      try{const r2=await D().from('pedidos').select('id,tipo_servicio,nombre_cliente,nombre_remitente,telefono_cliente,telefono_remitente,total,subtotal,costo_delivery,estado,entregado_en,creado_en,pago_confirmado').eq('pago_servicio_momento','al_final').eq('estado','entregado').eq('pago_confirmado',false).not('tipo_servicio','ilike','%encomienda%').gte('creado_en',new Date(Date.now()-45*864e5).toISOString()).order('creado_en',{ascending:false}).limit(200);
        (r2.data||[]).forEach(p=>{const t=Math.round((Number(p.total)||0)*100)/100;if(t>0)EN.push(Object.assign({},p,{svc:/compra/i.test(p.tipo_servicio)?'compra':'recojo',ag:0,del:t,pend:t,ags:[]}))})}catch(_){}
      return {b,peds,EN,L:(data||[]).filter(c=>{const p=peds[c.pedido_id];/* el Yape al QR del negocio no llega a Pidemás: lo confirma el negocio */return !p||(!['cancelado','rechazado'].includes(est(p))&&p.pago_acordado!=='yape_negocio')})}},
    v(){const c=datos('yape por confirmar',this.load);if(!c.data)return {body:cargando(c)};const {b,peds,L}=c.data,EN=c.data.EN||[];const tot=L.reduce((s,x)=>s+(Number(x.monto)||0),0)+EN.reduce((s,x)=>s+x.pend,0);
      let h=`<div class="amt"><div class="k">Por confirmar o cobrar</div><div class="n">${M(tot)}</div><div class="pill">${L.length+EN.length} cobro${L.length+EN.length===1?'':'s'}</div></div>`;
      if(EN.length){h+=`<div class="lbl" style="margin-top:4px">Cobros pendientes · pagan al final a Pidemás</div>`+U.note('Servicios que el cliente paga después: lo pagado en agencias, la compra y el servicio. Envía el cobro por WhatsApp y marca «Recibido» cuando llegue el pago.')+
        `<div class="cd">${EN.map(p=>{const n=p.nombre_cliente||p.nombre_remitente||'',w=telW(p.telefono_cliente||p.telefono_remitente),y=(typeof yapeCfg==='function'?yapeCfg():null)||{numero:'986233533',titular:'Grupo Pidemás EIRL'};
          const det=p.svc==='compra'?['• Compra: '+M(p.subtotal),'• Servicio Pidemás: '+M(p.costo_delivery)]:p.svc==='recojo'?['• Servicio de recojo y entrega: '+M(p.del)]:[...p.ags.map(a=>'• Envío en '+a.agencia+': '+M(a.pago_monto)),...(p.ags.length||!(p.ag>0)?[]:['• Envío pagado en agencia: '+M(p.ag)]),...(p.del>0?['• Delivery Pidemás: '+M(p.del)]:[])];
          const msg=['Hola'+(n?' '+String(n).trim().split(/\s+/)[0]:'')+' 👋','Te escribimos de *Pidemás* por tu '+(p.svc==='compra'?'compra':p.svc==='recojo'?'servicio de recojo y entrega':'encomienda')+' *'+ref(p.id)+'*.','','Tienes pendiente de pago:',...det,'*Total a pagar: '+M(p.pend)+'*','','Puedes pagar por Yape a Pidemás:','📱 '+y.numero+(y.titular?' · '+y.titular:''),'','Cuando pagues, envíanos la captura del Yape por aquí. ¡Gracias!'].join('\n');
          return fila(M(p.pend)+' · '+E(n||'Cliente'),E(ref(p.id))+' · '+E(det.map(x=>x.replace(/^• /,'')).join(' · '))+' · '+E(fch(p.entregado_en||p.creado_en)),`<span style="display:flex;gap:6px;flex:0 0 auto">${w?`<a class="b g" style="height:40px;width:44px;padding:0" target="_blank" rel="noopener" aria-label="Enviar cobro por WhatsApp" title="Enviar cobro por WhatsApp" href="https://wa.me/${w}?text=${encodeURIComponent(msg)}">${U.I.wa}</a>`:''}<button type="button" class="b" style="height:40px;padding:0 12px;color:#0F5E2E;border-color:#CFEBDA" data-sa="eok:${E(p.id)}">${IC.check}Recibido</button></span>`)}).join('')}</div>`;
        if(L.length)h+=`<div class="lbl" style="margin-top:8px">Cobros del motorizado</div>`}
      h+=U.note('Cobros que el motorizado marcó como pagados por Yape. Confirma cuando el dinero haya llegado al QR de Pidemás.');
      h+=L.length?`<div class="cd">${L.map(x=>{const p=peds[x.pedido_id]||{};const w=telW(p.telefono_cliente);const msg=['Hola'+(p.nombre_cliente?' '+String(p.nombre_cliente).trim().split(/\s+/)[0]:'')+' 👋','Te escribimos de *Pidemás Delivery*.','Tu pedido *'+ref(x.pedido_id)+'* del '+fch(x.confirmado_en)+' figura como pagado por *Yape* por *'+M(x.monto)+'*.','¿Nos confirmas el pago enviándonos la captura del Yape? ¡Gracias!'].join('\n');
        return fila(M(x.monto)+' · '+E(p.nombre_cliente||'Cliente'),E(ref(x.pedido_id))+' · '+E(mN(b,x.motorizado_id))+' · '+E(fch(x.confirmado_en)),`<span style="display:flex;gap:6px;flex:0 0 auto">${w?`<a class="b g" style="height:40px;width:44px;padding:0" target="_blank" rel="noopener" aria-label="Pedir confirmación por WhatsApp" title="Pedir confirmación por WhatsApp" href="https://wa.me/${w}?text=${encodeURIComponent(msg)}">${U.I.wa}</a>`:''}<button type="button" class="b" style="height:40px;padding:0 12px;color:#0F5E2E;border-color:#CFEBDA" data-sa="yok:${E(x.id)}">${IC.check}Recibido</button></span>`)}).join('')}</div>`:(EN.length?'':vacio('No hay Yapes pendientes de confirmar.'));
      return {body:h,foot:L.length>1?`<button type="button" class="b o" style="height:54px;font-size:16px" data-sa="yall">Marcar todos como recibidos</button>`:''}},
    async a(x){const c=C2['s:yape por confirmar'];
      if(String(x).startsWith('eok:')){const id=x.slice(4),p=(c.data.EN||[]).find(y=>String(y.id)===id);if(!p)return;
        if(!(await conf('¿El cliente ya te pagó '+M(p.pend)+'?\n'+(p.svc==='compra'?'Compra ':p.svc==='recojo'?'Recojo y entrega ':'Encomienda ')+ref(p.id))))return;
        const up=p.svc?{pago_confirmado:true,monto_recibido:p.pend}:{pago_agencia_cobrado_en:new Date().toISOString()};if(!p.svc&&p.del>0)up.pago_confirmado=true;
        const q=await D().from('pedidos').update(up).eq('id',id);if(q.error){mal('No se pudo guardar: '+q.error.message);return}
        ok('Cobro confirmado');recargar('yape por confirmar');return}
      const ids=x==='yall'?c.data.L.map(y=>y.id):[x.split(':')[1]];if(x==='yall'&&!(await conf('¿Marcar '+ids.length+' Yapes como recibidos?')))return;
      const u=(await D().auth.getUser()).data.user;const q=await D().from('cobros').update({yape_recibido_en:new Date().toISOString(),yape_recibido_por:u&&u.id}).in('id',ids);if(q.error){mal('No se pudo guardar: '+q.error.message);return}
      ok(ids.length===1?'Yape confirmado':'Yapes confirmados');recargar('yape por confirmar');try{window.pdCtl&&pdCtl.contar()}catch(_){}}};

  /* --- Por cobrar a negocios --- */
  SEC['por cobrar a negocios']={g:'Control de caja y sueldos',t:'Por cobrar a negocios',rf:1,
    load:async()=>{const b=await baseCtl();const {data,error}=await D().from('pedidos').select('id,negocio_id,costo_delivery,nombre_cliente,entregado_en,creado_en,pago_acordado,metodo_pago').in('pago_acordado',['pagado','yape_negocio']).eq('estado','entregado').is('delivery_negocio_cobrado_en',null).order('creado_en',{ascending:true}).limit(1000);if(error)throw error;
      /* Yape del negocio que terminó en efectivo al motorizado: el negocio no recibió nada, no debe el delivery */
      return {b,P:(data||[]).filter(p=>!(p.pago_acordado==='yape_negocio'&&String(p.metodo_pago||'').toLowerCase()==='efectivo'))}},
    v(){const c=datos('por cobrar a negocios',this.load);if(!c.data)return {body:cargando(c)};const {b,P}=c.data,f=SF['por cobrar a negocios'];f.off=f.off||{};f.quien=f.quien||{};
      const g=new Map();P.forEach(p=>{const k=String(p.negocio_id||'');if(!g.has(k))g.set(k,[]);g.get(k).push(p)});const tot=P.reduce((s,p)=>s+(Number(p.costo_delivery)||0),0);
      let h=`<div class="amt"><div class="k">Total por cobrar</div><div class="n">${M(tot)}</div><div class="pill">${g.size} negocio${g.size===1?'':'s'}</div></div>`+U.note('Pedidos donde el cliente pagó todo al negocio: el negocio le debe el delivery a Pidemás.');
      if(!g.size)return {body:h+vacio('Ningún negocio te debe delivery.')};
      h+=[...g.entries()].map(([nid,L])=>{const n=b.negs.find(x=>String(x.id)===nid)||{};const t=L.reduce((s,p)=>s+(Number(p.costo_delivery)||0),0);
        /* Se le puede recordar todo lo pendiente; en «Cliente pagó todo, yo pago» además revisa que su Yape no haya llegado ya */
        const LR=L,tR=LR.reduce((s,p)=>s+(Number(p.costo_delivery)||0),0);
        const msg=['Hola, '+(n.nombre||'')+' 👋','Te escribimos de *Pidemás Delivery*.','Tienes pendiente el pago del delivery de '+LR.length+' pedido'+(LR.length===1?'':'s')+':',...LR.map(p=>'• '+ref(p.id)+' · '+fch(p.entregado_en||p.creado_en)+' · '+M(p.costo_delivery)),'','*Total: '+M(tR)+'*','¿Nos confirmas cuándo lo cancelas? ¡Gracias!'].join('\n');const w=LR.length?telW(n.telefono):'';
        const q=f.quien[nid]||'admin';
        return `<div class="cd"><div class="row"><div style="flex:1 1 0%;min-width:0"><b style="display:block;font-size:17px">${E(n.nombre||'Negocio')}</b><span style="font-size:13px;color:#6B5E55">${L.length} pedido${L.length===1?'':'s'} · ${M(t)}</span></div>${w?`<a class="b g" style="height:40px;padding:0 12px" target="_blank" rel="noopener" href="https://wa.me/${w}?text=${encodeURIComponent(msg)}">${U.I.wa}Recordar</a>`:''}</div>
          ${L.map(p=>{const on=!f.off[p.id];return `<button type="button" class="opt${on?' on':''}" style="flex-direction:row;align-items:center;gap:10px" data-sa="tg:${E(p.id)}"><span class="sel${on?' on':''}">${on?IC.check:''}</span><span style="flex:1 1 0%"><b style="font-size:15px">${E(ref(p.id))}</b> <span>· ${E(fch(p.entregado_en||p.creado_en))}${p.pago_acordado==='pagado'?' · ya te yapeó al pedir: revisa tu Yape':''}</span></span><b>${M(p.costo_delivery)}</b></button>`}).join('')}
          <div class="lbl" style="margin-top:4px">¿Quién recibió el dinero?</div><div class="opts">${[['admin','Administración','Me pagó directo'],...b.motos.filter(m=>m.activo!==false).map(m=>[m.id,m.nombre_completo,'Va a su caja'])].map(x=>`<button type="button" class="opt${String(q)===String(x[0])?' on':''}" data-sa="qn:${E(nid)}:${E(x[0])}"><b>${E(x[1])}</b><span>${E(x[2])}</span></button>`).join('')}</div>
          <button type="button" class="b o" data-sa="cob:${E(nid)}">Marcar como cobrado</button></div>`}).join('');
      return {body:h}},
    async a(x){const k='por cobrar a negocios',f=SF[k],c=C2['s:'+k],p=x.split(':');
      if(p[0]==='tg'){f.off[p[1]]=!f.off[p[1]];return}if(p[0]==='qn'){f.quien[p[1]]=p[2];return}
      if(p[0]==='cob'){const nid=p[1],{b,P}=c.data;const L=P.filter(y=>String(y.negocio_id||'')===nid&&!f.off[y.id]);if(!L.length){mal('Marca al menos un pedido.');return}
        const quien=f.quien[nid]||'admin',n=b.negs.find(y=>String(y.id)===nid)||{},t=r2(L.reduce((s,y)=>s+(Number(y.costo_delivery)||0),0));
        if(!(await conf('¿Registrar que '+(n.nombre||'el negocio')+' pagó '+M(t)+'?\n'+(quien==='admin'?'Lo recibiste tú directamente.':'Entra a la caja de '+mN(b,quien)+'.'))))return;
        const u=await D().from('pedidos').update({delivery_negocio_cobrado_en:new Date().toISOString()}).in('id',L.map(y=>y.id)).select('id');if(u.error){mal('No se pudo registrar: '+u.error.message);return}
        if(quien!=='admin'){const r=await D().from('movimientos_caja').insert(L.map(y=>({motorizado_id:quien,pedido_id:y.id,tipo:'ingreso',monto:r2(y.costo_delivery),descripcion:'COBRO DE DELIVERY A NEGOCIO · '+(n.nombre||'Negocio')+' · Pedido '+ref(y.id)})));if(r.error){mal('No se pudo registrar en la caja: '+r.error.message);return}}
        ok('Cobro registrado');recargar(k);try{window.pdCtl&&pdCtl.contar()}catch(_){}}}};

  /* tope de caja (lo usa la alerta de caja alta) */
  const tope=async()=>{try{const {data}=await D().from('ajustes_pidemas').select('valor').eq('clave','caja_alerta').maybeSingle();return Number(data&&data.valor&&data.valor.monto)||0}catch(e){return 0}};

  /* --- Alerta de caja alta --- */
  SEC['alerta de caja alta']={g:'Control de caja y sueldos',t:'Alerta de caja alta',
    load:async()=>({T:await tope()}),
    v(){const c=datos('alerta de caja alta',this.load);if(!c.data)return {body:cargando(c)};const f=SF['alerta de caja alta'];if(f.v==null)f.v=c.data.T?String(c.data.T):'';
      return {body:U.note('Cuando la caja de un motorizado llegue a este monto, verá un aviso para entregarte el efectivo, Deja 0 para desactivar.')+`<div class="cd"><div class="fld"><label for="alT">Monto máximo en caja (S/)</label><input id="alT" inputmode="decimal" value="${E(f.v)}" data-in="sf:v" placeholder="0"></div></div>`,
        foot:`<button type="button" class="b o" style="height:54px;font-size:16px" data-sa="guardar">Guardar</button>`}},
    async a(){const f=SF['alerta de caja alta'];const v=Math.max(0,r2(String(f.v).replace(',','.')));const q=await D().from('ajustes_pidemas').upsert({clave:'caja_alerta',valor:{monto:v},actualizado_en:new Date().toISOString()});if(q.error){mal('No se pudo guardar: '+q.error.message);return}ok(v?'Alerta guardada en '+M(v):'Alerta desactivada');volverSub()}};

  /* --- Por pagar a negocios --- */
  SEC['por pagar a negocios']={g:'Control de pedidos',t:'Por pagar a negocios',rf:1,
    load:async()=>{const b=await baseCtl();const {data,error}=await D().from('pedidos').select('id,negocio_id,subtotal,total,pago_acordado,metodo_pago,nombre_cliente,entregado_en,creado_en,motorizado_id').not('negocio_id','is',null).eq('estado','entregado').is('negocio_pagado_en',null).order('creado_en',{ascending:true}).limit(1000);if(error)throw error;
      return {b,P:(data||[]).filter(p=>{const pa=String(p.pago_acordado||'');if(pa==='yape_negocio')return String(p.metodo_pago||'').toLowerCase()==='efectivo'&&Number(p.subtotal)>0;return !['solo_delivery','pagado'].includes(pa)&&Number(p.subtotal)>0})}},
    v(){const k='por pagar a negocios',c=datos(k,this.load);if(!c.data)return {body:cargando(c)};const {b,P}=c.data,f=SF[k];f.off=f.off||{};f.quien=f.quien||{};f.met=f.met||{};
      const g=new Map();P.forEach(p=>{const x=String(p.negocio_id);if(!g.has(x))g.set(x,[]);g.get(x).push(p)});const tot=P.reduce((s,p)=>s+(Number(p.subtotal)||0),0);
      let h=`<div class="amt"><div class="k">Total por pagar</div><div class="n">${M(tot)}</div><div class="pill">${g.size} negocio${g.size===1?'':'s'}</div></div>`+U.note('Pedidos donde el cliente le pagó todo a Pidemás (al motorizado o por Yape): le debes al negocio el valor de los productos.');
      if(!g.size)return {body:h+vacio('No le debes nada a ningún negocio.')};
      h+=[...g.entries()].map(([nid,L2])=>{const n=b.negs.find(x=>String(x.id)===nid)||{},t=L2.reduce((s,p)=>s+(Number(p.subtotal)||0),0),w=telW(n.telefono);
        const msg=['Hola, '+(n.nombre||'')+' 👋','Te escribimos de *Pidemás Delivery*. Este es el resumen de lo que te pagamos por tus pedidos:',...L2.map(p=>'• '+ref(p.id)+' · '+fch(p.entregado_en||p.creado_en)+' · '+M(p.subtotal)),'','*Total: '+M(t)+'*'].join('\n');
        const q=f.quien[nid]||'admin',mt=f.met[nid]||'efectivo';
        return `<div class="cd"><div class="row"><div style="flex:1 1 0%;min-width:0"><b style="display:block;font-size:17px">${E(n.nombre||'Negocio')}</b><span style="font-size:13px;color:#6B5E55">${L2.length} pedido${L2.length===1?'':'s'} · ${M(t)}</span></div>${w?`<a class="b g" style="height:40px;padding:0 12px" target="_blank" rel="noopener" href="https://wa.me/${w}?text=${encodeURIComponent(msg)}">${U.I.wa}Resumen</a>`:''}</div>
          ${L2.map(p=>{const on=!f.off[p.id];return `<button type="button" class="opt${on?' on':''}" style="flex-direction:row;align-items:center;gap:10px" data-sa="tg:${E(p.id)}"><span class="sel${on?' on':''}">${on?IC.check:''}</span><span style="flex:1 1 0%"><b style="font-size:15px">${E(ref(p.id))}</b> <span>· ${E(fch(p.entregado_en||p.creado_en))}</span></span><b>${M(p.subtotal)}</b></button>`}).join('')}
          <div class="lbl" style="margin-top:4px">¿Cómo le pagaste?</div><div class="seg" style="grid-template-columns:repeat(2,minmax(0,1fr))"><button type="button" class="${mt==='efectivo'?'on':''}" data-sa="mt:${E(nid)}:efectivo">Efectivo</button><button type="button" class="${mt==='yape'?'on':''}" data-sa="mt:${E(nid)}:yape">Yape / transferencia</button></div>
          <div class="lbl">¿Quién le pagó?</div><div class="opts">${[['admin','Administración',''],...b.motos.filter(m=>m.activo!==false).map(m=>[m.id,m.nombre_completo,'Sale de su caja'])].map(x=>`<button type="button" class="opt${String(q)===String(x[0])?' on':''}" data-sa="qn:${E(nid)}:${E(x[0])}"><b>${E(x[1])}</b>${x[2]?`<span>${E(x[2])}</span>`:''}</button>`).join('')}</div>
          <button type="button" class="b o" data-sa="pag:${E(nid)}">Marcar como pagado</button></div>`}).join('');
      return {body:h}},
    async a(x){const k='por pagar a negocios',f=SF[k],c=C2['s:'+k],p=x.split(':');
      if(p[0]==='tg'){f.off[p[1]]=!f.off[p[1]];return}if(p[0]==='qn'){f.quien[p[1]]=p[2];return}if(p[0]==='mt'){f.met[p[1]]=p[2];return}
      if(p[0]==='pag'){const nid=p[1],{b,P}=c.data,L2=P.filter(y=>String(y.negocio_id)===nid&&!f.off[y.id]);if(!L2.length){mal('Marca al menos un pedido.');return}
        const met=f.met[nid]||'efectivo',quien=f.quien[nid]||'admin',n=b.negs.find(y=>String(y.id)===nid)||{},t=r2(L2.reduce((s,y)=>s+(Number(y.subtotal)||0),0));
        if(!(await conf('¿Registrar que le pagaste '+M(t)+' a '+(n.nombre||'el negocio')+' ('+met+')?')))return;
        const now=new Date().toISOString();for(const y of L2){const r=await D().from('pedidos').update({negocio_pagado_en:now,negocio_pagado_metodo:met,negocio_pagado_monto:r2(y.subtotal)}).eq('id',y.id);if(r.error){mal('No se pudo registrar: '+r.error.message);return}}
        if(quien!=='admin'){const r=await D().from('movimientos_caja').insert(L2.map(y=>({motorizado_id:quien,pedido_id:y.id,tipo:'retiro',monto:r2(y.subtotal),descripcion:'PAGO A NEGOCIO · '+(n.nombre||'Negocio')+' · Pedido '+ref(y.id)})));if(r.error){mal('No se pudo registrar en la caja: '+r.error.message);return}}
        ok('Pago al negocio registrado');recargar(k)}}};

  /* --- Calificaciones --- */
  SEC['calificaciones']={g:'Control de pedidos',t:'Calificaciones',rf:1,
    load:async()=>{const b=await baseCtl();const {data,error}=await D().from('calificaciones').select('*').order('creado_en',{ascending:false}).limit(500);if(error)throw error;return {b,C:data||[]}},
    v(){const c=datos('calificaciones',this.load);if(!c.data)return {body:cargando(c)};const {b,C}=c.data;
      const prom=(k,kk)=>{const g=new Map();C.forEach(x=>{const id=x[kk],v=Number(x[k]);if(!id||!v)return;const y=g.get(String(id))||{s:0,n:0};y.s+=v;y.n++;g.set(String(id),y)});return [...g].map(([id,y])=>({id,p:y.s/y.n,n:y.n})).sort((a,b2)=>b2.p-a.p)};
      const st=v=>'★'.repeat(Math.round(v))+'☆'.repeat(5-Math.round(v));const pm=prom('estrellas_motorizado','motorizado_id'),pn=prom('estrellas_negocio','negocio_id');
      const malas=C.filter(x=>Math.min(x.estrellas_negocio||5,x.estrellas_motorizado||5)<=2||x.comentario).slice(0,25);
      const lista=(L2,nom)=>L2.length?L2.map(x=>fila(E(nom(x.id)),x.n+' calificación'+(x.n===1?'':'es'),`<span style="white-space:nowrap"><span class="stars">${st(x.p)}</span> <b>${x.p.toFixed(1)}</b></span>`)).join(''):'<div style="color:#6B5E55;font-size:15px">Aún no hay.</div>';
      let h=`<div class="amt"><div class="k">Calificaciones recibidas</div><div class="n">${C.length}</div><div class="pill">Últimas 500</div></div>`;
      h+=`<div class="cd"><div class="lbl">Motorizados</div>${lista(pm,id=>mN(b,id))}</div><div class="cd"><div class="lbl">Negocios</div>${lista(pn,id=>(b.negs.find(n=>String(n.id)===id)||{}).nombre||'Negocio')}</div>`;
      h+=`<div class="cd"><div class="lbl">Comentarios y calificaciones bajas</div>${malas.length?malas.map(x=>fila(E(ref(x.pedido_id))+' · negocio '+(x.estrellas_negocio||'—')+'★ · motorizado '+(x.estrellas_motorizado||'—')+'★',E(x.comentario||'Sin comentario')+' · '+E(fecha(x.creado_en)))).join(''):'<div style="color:#6B5E55;font-size:15px">Sin comentarios.</div>'}</div>`;
      return {body:h}}};

  /* --- Asignación automática --- */
  SEC['asignación automática']={g:'Control de pedidos',t:'Asignación automática',
    load:async()=>{const r=await D().from('ajustes').select('valor').eq('clave','auto_asignar').maybeSingle();return Object.assign({on:false,min:3},(r.data&&r.data.valor)||{})},
    v(){const c=datos('asignación automática',this.load);if(!c.data)return {body:cargando(c)};const a=c.data;
      return {body:U.note('Si un pedido listo para asignar se queda sin motorizado, el sistema lo asigna solo al sugerido: el más cercano y con menos pedidos. No se asigna a quien está en descanso.')+
        `<div class="cd"><div class="row"><div style="flex:1 1 0%"><b style="display:block;font-size:16px">${a.on?'Activada':'Desactivada'}</b><span style="font-size:13px;color:#6B5E55">${a.on?'Asigna después de '+a.min+' min sin motorizado':'Tú asignas todos los pedidos'}</span></div><button type="button" class="sw${a.on?' on':''}" role="switch" aria-checked="${a.on}" aria-label="Asignación automática" data-sa="on" style="position:relative;flex:0 0 52px;width:52px;height:32px;border-radius:999px;border:0;background:${a.on?'#C4410C':'#EADFD6'};cursor:pointer"><span style="position:absolute;top:3px;left:${a.on?23:3}px;width:26px;height:26px;border-radius:50%;background:#FFFFFF;box-shadow:0 1px 3px rgba(31,26,23,.25)"></span></button></div></div>`+
        `<div class="lbl">Esperar antes de asignar</div><div class="grid4" style="grid-template-columns:repeat(5,minmax(0,1fr))">${[1,2,3,5,10].map(m=>`<button type="button" class="${m===a.min?'on':''}" data-sa="min:${m}">${m} min</button>`).join('')}</div>`+U.note('Funciona mientras tengas este panel abierto en algún teléfono o computadora.')}},
    async a(x){const c=C2['s:asignación automática'],v=Object.assign({},c.data);if(x==='on')v.on=!v.on;else v.min=+x.split(':')[1];
      const q=await D().from('ajustes').upsert({clave:'auto_asignar',valor:v,actualizado_en:new Date().toISOString()});if(q.error){mal(/relation|column|schema/i.test(q.error.message)?'Falta aplicar un cambio en la base de datos (tabla ajustes).':'No se pudo guardar: '+q.error.message);return}c.data=v}};

  /* --- Lista negra --- */
  const d9=v=>dig(v).slice(-9);
  SEC['lista negra']={g:'Clientes',t:'Lista negra',rf:1,
    load:async()=>{const r=await D().from('clientes_bloqueados').select('*').order('creado_en',{ascending:false});if(r.error)throw r.error;return r.data||[]},
    v(){const k='lista negra',c=datos(k,this.load),f=SF[k];f.tel=f.tel||'';f.mot=f.mot||'';
      let h=U.note('Los números de esta lista no pueden hacer pedidos desde la tienda. Tú sí puedes crearles pedidos desde el panel.');
      h+=`<div class="cd"><div class="fld"><label for="lnT">Número</label><input id="lnT" type="tel" inputmode="numeric" maxlength="12" placeholder="9 dígitos" value="${E(f.tel)}" data-in="sf:tel"></div><div class="fld"><label for="lnM">Motivo</label><input id="lnM" maxlength="120" placeholder="Por qué lo bloqueas" value="${E(f.mot)}" data-in="sf:mot"></div><button type="button" class="b o" data-sa="add">${IC.x}Bloquear número</button></div>`;
      if(!c.data)return {body:h+cargando(c)};
      h+=c.data.length?`<div class="cd"><div class="lbl">Números bloqueados</div>${c.data.map(x=>fila(E(x.telefono)+(x.nombre?' · '+E(x.nombre):''),E(x.motivo||'Sin motivo')+' · '+E(fecha(x.creado_en)),`<button type="button" class="b" style="height:38px;padding:0 12px" data-sa="del:${E(x.telefono)}">Quitar</button>`)).join('')}</div>`:vacio('No hay números bloqueados.');
      return {body:h}},
    async a(x){const k='lista negra',f=SF[k];
      if(x==='add'){const t=d9(f.tel);if(t.length!==9){mal('Escribe un número de 9 dígitos.');return}const cl=(C2.cli&&C2.cli.data||[]).find(c=>d9(cliT(c))===t);
        const q=await D().from('clientes_bloqueados').upsert({telefono:t,motivo:f.mot.trim()||null,nombre:cl?cliN(cl):null});if(q.error){mal(q.error.message);return}ok('Número bloqueado');f.tel='';f.mot='';recargar(k);return}
      const t=x.split(':')[1];if(!(await conf('¿Quitar '+t+' de la lista negra?')))return;const q=await D().from('clientes_bloqueados').delete().eq('telefono',t);if(q.error){mal(q.error.message);return}recargar(k)}};

  /* --- Suspender / reactivar cuentas --- */
  SEC['suspender / reactivar cuentas']={g:'Motorizados',t:'Suspender o reactivar',rf:1,
    load:async()=>{const r=await D().from('motorizados').select('id,nombre_completo,telefono,activo').order('nombre_completo',{ascending:true});if(r.error)throw r.error;return r.data||[]},
    v(){const k='suspender / reactivar cuentas',c=datos(k,this.load),f=SF[k];f.f=f.f||'todas';f.q=f.q||'';if(!c.data)return {body:cargando(c)};const R=c.data,on=R.filter(m=>m.activo!==false).length;
      let h=`<div class="fld"><input type="search" placeholder="Buscar motorizado" value="${E(f.q)}" data-in="sf:q" data-vivo="spL" aria-label="Buscar motorizado"></div><div class="seg" style="grid-template-columns:repeat(3,minmax(0,1fr))">${[['todas','Todas'],['on','Activas'],['off','Suspendidas']].map(x=>`<button type="button" class="${f.f===x[0]?'on':''}" data-sa="f:${x[0]}">${x[1]}</button>`).join('')}</div>`;
      return {body:h+`<div id="spL">${this.lista()}</div>`}},
    lista(){const k='suspender / reactivar cuentas',f=SF[k],R=(C2['s:'+k]||{}).data||[],q=(f.q||'').trim().toLowerCase();
      const L2=R.filter(m=>(f.f==='todas'||(f.f==='on')===(m.activo!==false))&&(!q||String(m.nombre_completo||'').toLowerCase().includes(q)||String(m.telefono||'').includes(q))).sort((a,b)=>((a.activo===false)-(b.activo===false))||String(a.nombre_completo||'').localeCompare(String(b.nombre_completo||''),'es'));
      return L2.length?`<div class="cd">${L2.map(m=>{const ac=m.activo!==false;return `<div class="mv"><span class="ic" style="background:${ac?'#FDEBDF':'#F6EFE9'};color:${ac?'#C4410C':'#6B5E55'};font-weight:800;font-size:14px">${iniN(m.nombre_completo)}</span><span class="tx"><b>${E(m.nombre_completo||'Motorizado')}</b><span>${ac?'Activa':'Suspendida'}${m.telefono?' · '+E(m.telefono):''}</span></span><button type="button" class="b" style="height:38px;padding:0 12px;${ac?'color:#B42318;border-color:#F4C7C3':'color:#0F5E2E;border-color:#CFEBDA'}" data-sa="t:${E(m.id)}">${ac?'Suspender':'Reactivar'}</button></div>`}).join('')}</div>`:vacio('No hay cuentas en este filtro.')},
    async a(x){const k='suspender / reactivar cuentas',p=x.split(':');if(p[0]==='f'){SF[k].f=p[1];return}
      const m=(C2['s:'+k].data||[]).find(y=>String(y.id)===p[1]);if(!m)return;const re=m.activo===false;
      if(!(await conf((re?'¿Reactivar a ':'¿Suspender a ')+(m.nombre_completo||'este motorizado')+'?\n'+(re?'Podrá volver a entrar a su panel y recibir pedidos.':'No podrá entrar a su panel ni recibir pedidos. Su caja, sueldo e historial se conservan.'))))return;
      const q=await D().from('motorizados').update({activo:re}).eq('id',m.id);if(q.error){mal('No se pudo cambiar: '+q.error.message);return}m.activo=re;ok(re?'Cuenta reactivada':'Cuenta suspendida')}};

  /* --- Motorizados / GPS (mapa dentro de la caja aislada) --- */
  let gMapa=null,gMk=new Map(),gEl=null;
  const agoT=t=>{const m=Math.max(0,Math.round((Date.now()-t)/60000));if(m<1)return 'ahora';if(m<60)return 'hace '+m+' min';const h=Math.floor(m/60);return h<24?'hace '+h+' h':'hace '+Math.floor(h/24)+' d'};
  const tsOf=r=>{for(const k of ['ultima_ubicacion','actualizado_en','updated_at','creado_en','created_at','fecha','timestamp']){const v=r&&r[k];if(v){const t=new Date(v).getTime();if(Number.isFinite(t))return t}}return null};
  SEC['motorizados / gps']={g:'Motorizados',t:'Motorizados y GPS',rf:1,
    load:async()=>{const {data:motos,error}=await D().from('motorizados').select('*').order('nombre_completo');if(error)throw error;const act=(motos||[]).filter(m=>String(m.activo??'')!=='false'),ids=act.map(m=>String(m.id)),hist=new Map();
      if(ids.length){let r=await D().from('ubicaciones_motorizados').select('*').in('motorizado_id',ids).order('creado_en',{ascending:false}).limit(600);if(r.error)r=await D().from('ubicaciones_motorizados').select('*').in('motorizado_id',ids).limit(600);
        (r.data||[]).forEach(row=>{const id=String(row.motorizado_id||'');const pt=typeof adminGpsPoint==='function'?adminGpsPoint(row):null,t=tsOf(row);if(!pt||!t)return;const p=hist.get(id);if(!p||t>p.t)hist.set(id,{pt,t})})}
      const bm=new Map();try{const {data}=await D().from('pedidos').select('id,motorizado_id,estado').in('estado',['asignado','aceptado','pedido_aceptado','camino_recojo','en_camino','en_entrega','camino_entrega']);(data||[]).forEach(o=>{const k=String(o.motorizado_id||'');if(k)bm.set(k,(bm.get(k)||0)+1)})}catch(e){}
      return act.map(m=>{const id=String(m.id);let pt=typeof adminGpsPoint==='function'?adminGpsPoint(m):null,t=tsOf(m);const h=hist.get(id);if(h&&(!pt||!t||h.t>t)){pt=h.pt;t=h.t}const age=t?(Date.now()-t)/60000:null,on=!!pt&&age!=null&&age<=5,st=!!pt&&!on&&age!=null&&age<=1440;return {m,id,pt,t,on,stale:st,n:bm.get(id)||0}})},
    v(){const k='motorizados / gps',c=datos(k,this.load),f=SF[k];f.f=f.f||'todos';if(!c.data)return {body:cargando(c)};const S2=c.data,on=S2.filter(s=>s.on).length;
      let h='';
      h+=`<div id="gMap" style="height:300px;border-radius:18px;overflow:hidden;border:1px solid #F1E4DA;background:#F6EFE9"></div>`;
      h+=`<div class="seg" style="grid-template-columns:repeat(3,minmax(0,1fr))">${[['todos','Todos'],['on','En línea'],['off','Sin señal']].map(x=>`<button type="button" class="${f.f===x[0]?'on':''}" data-sa="f:${x[0]}">${x[1]}</button>`).join('')}</div>`;
      const L2=S2.filter(s=>f.f==='todos'||(f.f==='on')===s.on).sort((a,b)=>(b.on-a.on)||(b.n-a.n)||((b.t||0)-(a.t||0)));
      h+=L2.length?`<div class="cd">${L2.map(s=>{const tl=dig(s.m.telefono);const st=s.m.en_descanso?'En descanso':s.on?'En línea · '+agoT(s.t):s.t?'Sin señal · última '+agoT(s.t):'Nunca compartió su ubicación';
        return `<div class="mv"><span class="ic" style="background:${s.on?'#E9F6EE':'#F6EFE9'};color:${s.on?'#15803D':'#6B5E55'};font-weight:800;font-size:14px">${iniN(s.m.nombre_completo)}</span><span class="tx"><b>${E(s.m.nombre_completo||'Motorizado')}</b><span>${E(st)}${s.n?' · '+s.n+' en curso':''}</span></span>${tl?`<a class="ib" style="width:38px;height:38px;flex:0 0 38px" href="tel:${E(tl)}" aria-label="Llamar">${U.I.phone}</a>`:''}${s.pt&&(s.on||s.stale)?`<button type="button" class="ib" style="width:38px;height:38px;flex:0 0 38px" data-sa="ver:${E(s.id)}" aria-label="Ver en el mapa">${IC.pin}</button>`:!s.on&&s.m.usuario_id?`<button type="button" class="b" style="height:38px;padding:0 10px" data-sa="avisar:${E(s.id)}">Avisar</button>`:''}</div>`}).join('')}</div>`:vacio('No hay motorizados en este filtro.');
      if(S2.some(s=>!s.on&&s.m.usuario_id))h+=`<button type="button" class="b" data-sa="todos">${IC.bell}Avisar a todos los que no tienen GPS</button>`;
      setTimeout(()=>this.mapa(S2),30);return {body:h}},
    mapa(S2){const el=root&&root.getElementById('gMap');const LF=window.L;if(!el||!LF)return;
      if(!root.getElementById('lfcss')){const l=document.createElement('link');l.id='lfcss';l.rel='stylesheet';l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';root.appendChild(l);const s=document.createElement('style');s.textContent='.gpin{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#C4410C;color:#fff;font:800 13px PdInter,Inter,sans-serif;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25)}.gpin.on{background:#15803D}.gpin.st{background:#A8988C}';root.appendChild(s)}
      if(gEl!==el){try{gMapa&&gMapa.remove()}catch(_){}gMapa=LF.map(el,{zoomControl:true}).setView([-5.1945,-80.6328],13);LF.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(gMapa);gMk=new Map();gEl=el}
      const pts=[];S2.forEach(s=>{if(!s.pt||!(s.on||s.stale))return;pts.push([s.pt.lat,s.pt.lng]);const ic=LF.divIcon({className:'',html:`<div class="gpin ${s.on?'on':'st'}">${iniN(s.m.nombre_completo)}</div>`,iconSize:[36,36],iconAnchor:[18,18]});
        let mk=gMk.get(s.id);if(mk){mk.setLatLng([s.pt.lat,s.pt.lng]);mk.setIcon(ic)}else{mk=LF.marker([s.pt.lat,s.pt.lng],{icon:ic}).addTo(gMapa).bindPopup(E(s.m.nombre_completo||'')+'<br>'+(s.on?'En línea':'Última ubicación')+' · '+agoT(s.t));gMk.set(s.id,mk)}});
      if(!el.__fit){el.__fit=1;if(pts.length===1)gMapa.setView(pts[0],16);else if(pts.length>1)gMapa.fitBounds(LF.latLngBounds(pts),{padding:[30,30],maxZoom:16})}setTimeout(()=>{try{gMapa.invalidateSize()}catch(_){}},150)},
    async a(x){const k='motorizados / gps',p=x.split(':'),S2=(C2['s:'+k]||{}).data||[];if(p[0]==='f'){SF[k].f=p[1];return}
      if(p[0]==='ver'){const s=S2.find(y=>y.id===p[1]);if(s&&gMapa){gMapa.setView([s.pt.lat,s.pt.lng],17);gMk.get(s.id)?.openPopup();root.getElementById('gMap')?.scrollIntoView({behavior:'smooth',block:'center'})}return}
      const L2=p[0]==='todos'?S2.filter(s=>!s.on&&s.m.usuario_id):S2.filter(s=>s.id===p[1]);if(!L2.length)return;if(p[0]==='todos'&&!(await conf('Se enviará el aviso «Activa tu GPS» a '+L2.length+' motorizado(s). ¿Continuar?')))return;
      let n=0;for(const s of L2){const b={usuario_id:s.m.usuario_id,titulo:'Activa tu GPS',mensaje:'Administración te pide activar el GPS de tu teléfono y mantener este panel abierto para poder ubicarte.',leida:false};let r=await D().from('notificaciones').insert(Object.assign({tipo:'aviso_gps'},b));if(r.error)r=await D().from('notificaciones').insert(b);if(!r.error)n++}
      ok(n+' aviso'+(n===1?'':'s')+' enviado'+(n===1?'':'s'))}};

  /* --- configuración compartida (QR Yape y WhatsApp de administración): archivo config/yape.json --- */
  const stR=()=>D().storage.from('restaurantes');
  async function leerCfg(){try{const u=stR().getPublicUrl('config/yape.json').data.publicUrl+'?t='+Date.now();const r=await fetch(u,{cache:'no-store'});if(r.ok)return await r.json();if(r.status===400||r.status===404)return {};return null}catch(e){return null}}
  async function guardarCfg(c){const r=await stR().upload('config/yape.json',new Blob([JSON.stringify(c)],{type:'application/json'}),{upsert:true,contentType:'application/json',cacheControl:'0'});if(r.error)throw r.error}


  /* =============== CLIENTES FRECUENTES (recojo y entrega): config/recojo-frecuentes.json =============== */
  const FR_P='config/recojo-frecuentes.json',FR_MAX=5,FR_K=['rnom','rtel','rdir','rref','rubi','anom','lleva','costo','quien'];
  let FREC=null,FRCARGA=false;
  async function frLeer(){const u=stR().getPublicUrl(FR_P).data.publicUrl+'?t='+Date.now();const r=await fetch(u,{cache:'no-store'});if(r.ok){const j=await r.json();return Array.isArray(j&&j.lista)?j.lista.slice(0,FR_MAX):[]}if(r.status===400||r.status===404)return [];throw new Error('No se pudo leer ('+r.status+')')}
  async function frGuardar(L2){const r=await stR().upload(FR_P,new Blob([JSON.stringify({lista:L2.slice(0,FR_MAX),actualizado_en:new Date().toISOString()})],{type:'application/json'}),{upsert:true,contentType:'application/json',cacheControl:'0'});if(r.error)throw r.error;FREC=L2.slice(0,FR_MAX)}
  function frecs(){if(!FREC&&!FRCARGA){FRCARGA=true;frLeer().then(L2=>{FREC=L2;FRCARGA=false;navKey='';pintar()}).catch(()=>{FRCARGA=false;FREC=FREC||null;navKey='';pintar()})}return FREC}
  const frIni=n=>String(n||'?').trim().split(/\s+/).map(w=>w[0]||'').slice(0,2).join('').toUpperCase();
  SEC['clientes frecuentes']={g:'Servicios',t:'Clientes frecuentes',
    load:async()=>{const L2=await frLeer();FREC=L2;return L2},
    v(){const k='clientes frecuentes',c=datos(k,this.load),f=SF[k];if(!c.data)return {body:cargando(c)};const L2=c.data;
      if(f.ed==null){
        let h=U.note('Son los '+FR_MAX+' clientes que más envían. En «Nuevo › Recojo y entrega» aparecen arriba: al tocar uno, sus datos de quien envía ya están llenos y solo escribes los de quien recibe.');
        h+=L2.length?`<div class="cd">${L2.map((x,i)=>`<div class="mv"><span class="ic" style="background:#FDEBDF;color:#C4410C;font-weight:800;font-size:14px">${E(frIni(x.rnom))}</span><span class="tx"><b>${E(x.rnom||'Cliente')}</b><span>${E([x.rtel,x.rdir].filter(Boolean).join(' · ')||'Sin dirección')}</span></span>${i?`<button type="button" class="ib" style="width:38px;height:38px;flex:0 0 38px" data-sa="up:${i}" aria-label="Subir">↑</button>`:''}<button type="button" class="b" style="height:38px;padding:0 12px" data-sa="ed:${i}">Editar</button></div>`).join('')}</div>`:vacio('Aún no tienes clientes frecuentes.');
        if(L2.length<FR_MAX)h+=`<button type="button" class="b o" style="height:54px;font-size:16px" data-sa="nuevo">${IC.plus}Agregar cliente frecuente</button>`;
        else h+=`<span style="font-size:13px;color:#6B5E55;margin:0 4px">Ya tienes ${FR_MAX}. Para agregar otro, edita o quita uno.</span>`;
        return {body:h}}
      datosCli();
      const fl=(id,l,k2,ph,o)=>`<div class="fld"><label for="${id}">${l}</label><input id="${id}" value="${E(f[k2]??'')}" data-in="sf:${k2}"${ph?` placeholder="${E(ph)}"`:''}${o||''}></div>`;
      let h=`<div class="cd"><div class="lbl">Llenar con un cliente registrado</div><div class="fld"><input type="search" value="${E(f.q||'')}" data-in="sf:q" data-vivo="frL" placeholder="Nombre o teléfono" autocomplete="off" aria-label="Buscar cliente registrado"></div><div id="frL" style="display:flex;flex-direction:column;gap:8px">${this.lista()}</div></div>`;
      h+=`<div class="cd"><div class="lbl">Quien envía</div>${fl('frN','Nombre o negocio de quien envía','rnom','Ej. Boutique Ana')}${fl('frT','Número de quien envía','rtel','',' type="tel" inputmode="tel" maxlength="20"')}${fl('frD','Dirección de recojo','rdir','')}${fl('frR','Referencia','rref','Ej. frente al parque, portón negro')}${fl('frU','Ubicación (Google Maps)','rubi','Pega el enlace de Google Maps')}${fl('frA','¿A nombre de quién? (opcional)','anom','')}</div>`;
      h+=`<div class="cd"><div class="lbl">Lo de siempre (opcional)</div>${fl('frQ','¿Qué suele enviar?','lleva','Ej. ropa en bolsa')}${fl('frC','Costo habitual (S/)','costo','Ej. 7',' inputmode="decimal"')}<div class="fld"><label>¿Quién suele pagar el servicio?</label><div class="opc">${[['envia','Quien envía'],['recibe','Quien recibe']].map(x=>`<button type="button" class="${f.quien===x[0]?'on':''}" data-sa="q:${x[0]}">${x[1]}</button>`).join('')}</div></div></div>`;
      if(f.ed!=='nuevo')h+=`<button type="button" class="b" style="height:50px;color:#B42318;border-color:#F4C7C3" data-sa="del">${IC.x}Quitar de frecuentes</button>`;
      if(f.msg)h+=`<div class="err">${E(f.msg)}</div>`;
      return {head:top3('Clientes frecuentes',f.ed==='nuevo'?'Nuevo cliente frecuente':'Editar cliente frecuente'),body:h,foot:`<div class="row"><button type="button" class="b" style="flex:1;height:54px" data-sa="cancel">Cancelar</button><button type="button" class="b o" style="flex:1.7;height:54px;font-size:16px" data-sa="guardar">Guardar</button></div>`}},
    lista(){const f=SF['clientes frecuentes'],q=String(f.q||'').trim().toLowerCase(),qd=dig(q);if(q.length<2)return '';
      const R=((C2.cli&&C2.cli.data)||[]).filter(c=>cliN(c).toLowerCase().includes(q)||(qd.length>=3&&dig(cliT(c)).includes(qd))).slice(0,5);
      return R.length?R.map(c=>`<button type="button" class="b" style="height:auto;min-height:48px;padding:8px 12px;justify-content:flex-start;text-align:left;flex-direction:column;align-items:flex-start;gap:2px" data-sa="cli:${E(c.id)}"><b style="font-size:15px">${E(cliN(c)||'Cliente')}</b><span style="font-size:13px;color:#6B5E55;font-weight:500">${E([cliT(c),c.direccion].filter(Boolean).join(' · '))}</span></button>`).join(''):`<div style="font-size:14px;color:#6B5E55">No hay clientes con «${E(f.q)}».</div>`},
    async a(x){const k='clientes frecuentes',f=SF[k],c=C2['s:'+k],L2=(c&&c.data)||[],p=x.split(':');f.msg='';
      const limpiar=()=>{FR_K.forEach(y=>delete f[y]);f.q='';f.ed=null;f.msg=''};
      if(p[0]==='nuevo'){limpiar();f.ed='nuevo';f.quien='recibe';return}
      if(p[0]==='ed'){limpiar();const it=L2[+p[1]];if(!it)return;f.ed=+p[1];FR_K.forEach(y=>f[y]=it[y]||'');return}
      if(p[0]==='cancel'){limpiar();return}
      if(p[0]==='q'){f.quien=p[1];return}
      if(p[0]==='cli'){const cl=((C2.cli&&C2.cli.data)||[]).find(y=>String(y.id)===p[1]);if(!cl)return;Object.assign(f,{rnom:cliN(cl),rtel:cliT(cl),rdir:cl.direccion||f.rdir||'',rubi:cliU(cl)||f.rubi||'',q:''});return}
      if(p[0]==='up'){const i=+p[1];if(i<1)return;const N=L2.slice();[N[i-1],N[i]]=[N[i],N[i-1]];await frGuardar(N);c.data=FREC;return}
      if(p[0]==='del'){if(typeof f.ed!=='number')return;if(!(await conf('¿Quitar a '+(L2[f.ed].rnom||'este cliente')+' de frecuentes?')))return;const N=L2.filter((_,i)=>i!==f.ed);await frGuardar(N);c.data=FREC;limpiar();ok('Quitado de frecuentes');return}
      if(p[0]==='guardar'){const it={};FR_K.forEach(y=>it[y]=String(f[y]??'').trim());
        if(!it.rnom){f.msg='Escribe el nombre de quien envía.';return}if(!it.rtel){f.msg='Escribe el teléfono de quien envía.';return}
        if(it.costo&&!(Number(it.costo.replace(',','.'))>=0)){f.msg='El costo debe ser un número.';return}
        const N=(await frLeer().catch(()=>L2)).slice();if(f.ed==='nuevo'){if(N.length>=FR_MAX){f.msg='Ya hay '+FR_MAX+' clientes frecuentes.';return}N.push(it)}else N[f.ed]=it;
        await frGuardar(N);c.data=FREC;limpiar();ok('Cliente frecuente guardado');return}}};

  /* --- QR Yape --- */
  SEC['qr yape']={g:'Más',t:'QR Yape',
    load:async()=>Object.assign({url:'',numero:'986233533',titular:'Grupo Pidemás EIRL',whatsapp_admin:'986233533'},(await leerCfg())||{}),
    v(){const k='qr yape',c=datos(k,this.load),f=SF[k];if(!c.data)return {body:cargando(c)};if(f.num==null){f.num=c.data.numero||'';f.tit=c.data.titular||''}
      const u=f.prev||c.data.url;
      return {body:U.note('Es el QR que el motorizado le muestra al cliente para que pague por Yape a Pidemás.')+`<div class="qrbox" style="display:flex;align-items:center;justify-content:center;min-height:220px;border-radius:18px;background:#FFFFFF;border:1px dashed #E3CFC2;color:#6B5E55;font-size:15px;text-align:center;padding:12px">${u?`<img src="${E(u)}" alt="QR de Yape" style="max-width:220px;max-height:220px">`:'Usando el QR actual del sistema<br>(Grupo Pidemás EIRL)'}</div>
        <label class="b soft" style="cursor:pointer">${IC.plus}${u?'Cambiar imagen del QR':'Subir imagen del QR'}<input type="file" accept="image/png,image/jpeg,image/webp" data-in="qrfile" style="display:none"></label>
        <div class="cd"><div class="fld"><label for="qN">Número de Yape</label><input id="qN" type="tel" inputmode="numeric" maxlength="15" value="${E(f.num)}" data-in="sf:num"></div><div class="fld"><label for="qT">Titular</label><input id="qT" maxlength="60" value="${E(f.tit)}" data-in="sf:tit"></div></div>${f.msg?`<div class="err">${E(f.msg)}</div>`:''}`,
        foot:`<button type="button" class="b o" style="height:54px;font-size:16px" data-sa="guardar">Guardar</button>`}},
    async a(){const k='qr yape',f=SF[k],c=C2['s:'+k];f.msg='';const num=String(f.num||'').replace(/\D/g,''),tit=String(f.tit||'').trim();
      if(num&&num.length!==9){f.msg='El número de Yape debe tener 9 dígitos.';return}
      const cur=(await leerCfg())||c.data;let url=cur.url||c.data.url;
      if(f.file){const ext=(f.file.type.split('/')[1]||'jpg').replace('jpeg','jpg'),path='config/yape-qr-'+Date.now()+'.'+ext;const up=await stR().upload(path,f.file,{upsert:true,contentType:f.file.type,cacheControl:'31536000'});if(up.error){f.msg='No se pudo subir la imagen: '+up.error.message;return}url=stR().getPublicUrl(path).data.publicUrl}
      const old=c.data.url;const d=Object.assign({},cur,{url,numero:num,titular:tit,actualizado_en:new Date().toISOString()});
      try{await guardarCfg(d)}catch(e){f.msg='No se pudo guardar: '+(e.message||e);return}
      if(f.file&&old&&old!==url){const p=old.split('/restaurantes/')[1];if(p)stR().remove([decodeURIComponent(p.split('?')[0])]).catch(()=>{})}
      c.data=d;f.file=null;f.prev='';ok('Listo: los motorizados ya ven este QR')}};


  /* --- Tarifas --- */
  const tSw=(on,sa,lbl)=>`<button type="button" role="switch" aria-checked="${!!on}" aria-label="${E(lbl)}" data-sa="${sa}" style="position:relative;flex:0 0 52px;width:52px;height:32px;border-radius:999px;border:0;background:${on?'#C4410C':'#EADFD6'};cursor:pointer"><span style="position:absolute;top:3px;left:${on?23:3}px;width:26px;height:26px;border-radius:50%;background:#FFFFFF;box-shadow:0 1px 3px rgba(31,26,23,.25)"></span></button>`;
  const tNum=v=>{const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:0};
  SEC['tarifas']={g:'Servicios',t:'Tarifas',
    load:async()=>{const T=window.pdTarifa;try{return await T.cargar(true)}catch(e){return T.config}},
    v(){const k='tarifas',c=datos(k,this.load),f=SF[k];if(!c.data)return {body:cargando(c)};
      if(!f.C){f.C=JSON.parse(JSON.stringify(c.data));f.C.zonas=f.C.zonas||[];f.C.recargos=f.C.recargos||{};f.zc=f.C.zonas.map(z=>z.lat!=null&&z.lng!=null?z.lat+', '+z.lng:'');f.km=f.km??'4';f.dest=f.dest||''}
      const C=f.C,R=C.recargos,fi=(l,p,v,ph)=>`<div class="fld"><label>${l}</label><input inputmode="decimal" data-in="tf:${p}" value="${E(v??'')}"${ph?` placeholder="${E(ph)}"`:''}></div>`;
      const fecha=C.actualizado?new Date(C.actualizado).toLocaleString('es-PE',{timeZone:'America/Lima',dateStyle:'short',timeStyle:'short'}):'nunca (valores por defecto)';
      let h=U.note('Así se calcula el delivery en la tienda y en los servicios. Última actualización: '+E(fecha)+'.');
      h+=`<div class="cd"><div class="lbl">Tarifa por distancia</div><span style="font-size:14px;color:#6B5E55">Se usa cuando la entrega no cae dentro de una zona con precio fijo. La distancia es por calles.</span>
        <div class="g2">${fi('Tarifa base (S/)','base',C.base)}${fi('Km incluidos','km_incluidos',C.km_incluidos)}</div>
        <div class="g2">${fi('Precio por km extra (S/)','por_km',C.por_km)}${fi('Tarifa mínima (S/)','minimo',C.minimo)}</div>
        ${fi('Tarifa máxima (S/)','maximo',C.maximo,'0 = sin tope')}
        <div class="fld"><label>Redondeo</label><div class="seg" style="grid-template-columns:repeat(3,minmax(0,1fr))">${[[0.1,'S/ 0.10'],[0.5,'S/ 0.50'],[1,'S/ 1.00']].map(x=>`<button type="button" class="${Number(C.redondeo)===x[0]?'on':''}" data-sa="rd:${x[0]}">${x[1]}</button>`).join('')}</div></div></div>`;
      h+=`<div class="lbl" style="margin:6px 4px 0">Zonas con precio fijo</div><span style="font-size:14px;color:#6B5E55;margin:0 4px">Si la entrega cae dentro del radio de una zona, se cobra su precio fijo. Si cae en varias, gana la más cercana.</span>`;
      h+=C.zonas.map((z,i)=>{const ok=window.pdTarifa.coords(f.zc[i]);return `<div class="cd" style="${z.activo===false?'opacity:.7':''}"><div class="row"><input style="flex:1;height:50px;border-radius:14px;border:1.5px solid #F1E4DA;padding:0 14px;font:inherit;font-size:16px;font-weight:700" placeholder="Nombre de la zona" data-in="tf:z.${i}.nombre" value="${E(z.nombre||'')}">${tSw(z.activo!==false,'zact:'+i,'Zona activa')}</div>
        <div class="g2">${fi('Precio fijo (S/)','z.'+i+'.precio',z.precio)}${fi('Radio (km)','z.'+i+'.radio_km',z.radio_km)}</div>
        <div class="fld"><label>Centro de la zona</label><input data-in="tf:zc.${i}" value="${E(f.zc[i])}" placeholder="Enlace de Maps o -5.19, -80.63"></div>
        <span style="font-size:13px;color:${ok?'#0F5E2E':'#B42318'}">${ok?'Centro: '+ok.lat.toFixed(5)+', '+ok.lng.toFixed(5):'Falta el centro de la zona.'}</span>
        <div class="row"><button type="button" class="b" style="flex:1;height:44px" data-sa="zmap:${i}">${ok?'Cambiar en el mapa':'Marcar en el mapa'}</button><button type="button" class="b" style="height:44px;padding:0 14px;color:#B42318;border-color:#F4C7C3" data-sa="zdel:${i}">Eliminar</button></div></div>`}).join('');
      h+=`<button type="button" class="b" style="height:50px" data-sa="zadd">${IC.plus}Agregar zona</button>`;
      const rg=(key,t,sub,campos)=>{const o=R[key]||{};return `<div class="swr" style="display:flex;align-items:center;gap:12px"><span style="flex:1 1 0%"><b style="display:block;font-size:16px">${t}</b><span style="font-size:13px;color:#6B5E55">${sub}</span></span>${tSw(o.activo,'rg:'+key,t)}</div>${o.activo?campos:''}`};
      h+=`<div class="cd"><div class="lbl">Recargos</div><span style="font-size:14px;color:#6B5E55">Se suman a la tarifa (por km o por zona).</span>
        ${rg('nocturno','Recargo nocturno','En el horario indicado (hora de Lima).',`<div class="g2"><div class="fld"><label>Desde</label><input type="time" data-in="tf:r.nocturno.desde" value="${E((R.nocturno||{}).desde||'21:00')}"></div><div class="fld"><label>Hasta</label><input type="time" data-in="tf:r.nocturno.hasta" value="${E((R.nocturno||{}).hasta||'06:00')}"></div></div>${fi('Monto (S/)','r.nocturno.monto',(R.nocturno||{}).monto??2)}`)}
        ${rg('lluvia','Recargo por lluvia','Actívalo solo mientras llueve y apágalo después.',fi('Monto (S/)','r.lluvia.monto',(R.lluvia||{}).monto??2))}
        ${rg('pedido_grande','Recargo por pedido grande','Cuando los productos superan un monto.',`<div class="g2">${fi('Desde (S/)','r.pedido_grande.desde_subtotal',(R.pedido_grande||{}).desde_subtotal??150)}${fi('Monto (S/)','r.pedido_grande.monto',(R.pedido_grande||{}).monto??2)}</div>`)}</div>`;
      h+=`<div class="cd"><div class="lbl">Probar la tarifa</div><span style="font-size:14px;color:#6B5E55">Calcula con lo que estás editando, aunque todavía no lo guardes.</span>
        <div class="fld"><label>Distancia (km)</label><input inputmode="decimal" data-in="sf:km" value="${E(f.km)}"></div><div class="fld"><label>Ubicación de entrega (opcional)</label><input data-in="sf:dest" value="${E(f.dest)}" placeholder="Enlace de Maps o lat, lng"></div>
        <button type="button" class="b" style="height:48px" data-sa="sim">Calcular</button>${f.sim?`<div class="sum"><div class="li t"><span>Delivery</span><b>${M(f.sim.total)}</b></div>${f.sim.detalle.map(d=>`<div class="li"><span>${E(d.concepto)}</span><b>${d.monto<0?'− ':''}${M(Math.abs(d.monto))}</b></div>`).join('')}</div>`:''}</div>`;
      if(f.msg)h+=`<div class="err">${E(f.msg)}</div>`;
      return {body:h,foot:`<button type="button" class="b o" style="height:54px;font-size:16px" data-sa="guardar">Guardar tarifas</button>`}},
    leer(){const f=SF['tarifas'],C=f.C;C.zonas.forEach((z,i)=>{const c=window.pdTarifa.coords(f.zc[i]);if(c){z.lat=c.lat;z.lng=c.lng}else{z.lat=null;z.lng=null}})},
    async a(x){const k='tarifas',f=SF[k],C=f.C,[op,arg]=x.split(':');f.msg='';
      if(op==='rd'){C.redondeo=Number(arg);return}
      if(op==='zadd'){C.zonas.push({nombre:'',precio:C.base,radio_km:1.5,lat:null,lng:null,activo:true});f.zc.push('');return}
      if(op==='zdel'){if(!(await conf('¿Eliminar esta zona?')))return;C.zonas.splice(+arg,1);f.zc.splice(+arg,1);return}
      if(op==='zact'){const z=C.zonas[+arg];z.activo=z.activo===false;return}
      if(op==='zmap'){const el2=window.pdMapa&&pdMapa.elegir;if(!el2)return;const r=await el2({titulo:'Centro de la zona',centro:window.pdTarifa.coords(f.zc[+arg])});if(r)f.zc[+arg]=Number(r.lat).toFixed(6)+', '+Number(r.lng).toFixed(6);return}
      if(op==='rg'){C.recargos[arg]=C.recargos[arg]||{};C.recargos[arg].activo=!C.recargos[arg].activo;return}
      if(op==='sim'){this.leer();f.sim=window.pdTarifa.calcularCon(JSON.parse(JSON.stringify(C)),{km:tNum(f.km),subtotal:0,destino:window.pdTarifa.coords(f.dest)});return}
      if(op==='guardar'){this.leer();
        const malas=C.zonas.filter(z=>z.activo!==false&&(!String(z.nombre||'').trim()||!(Number(z.radio_km)>0)||z.lat==null));
        if(malas.length){f.msg='Completa nombre, radio y centro de cada zona activa (o desactívala).';return}
        if(!(C.base>=0)||!(C.por_km>=0)){f.msg='Revisa la tarifa base y el precio por km.';return}
        try{const n=await window.pdTarifa.guardar(C);C.actualizado=n.actualizado;C2['s:'+k].data=n;ok('Tarifas guardadas. La tienda ya cobra con estos valores.')}
        catch(e){f.msg='No se pudo guardar: '+(e.message||e)}}}};


  /* --- Agencias --- */
  const agClave=n=>String(n||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  async function agUbis(){try{const c=D();const u=c.storage.from('restaurantes').getPublicUrl('config/agencias.json').data.publicUrl+'?t='+Date.now();const r=await fetch(u,{cache:'no-store'});if(r.ok){const j=await r.json();return (j&&j.agencias)||j||{}}}catch(_){}return {}}
  SEC['agencias']={g:'Servicios',t:'Agencias',rf:1,
    load:async()=>{const [a,d,u]=await Promise.all([D().from('agencias').select('id,nombre,activo').order('nombre'),D().from('agencia_destinos').select('id,agencia_id,destino_final,activo').order('destino_final'),agUbis()]);if(a.error)throw a.error;
      return {A:(a.data||[]).filter(x=>x.activo!==false),Ds:(d.data||[]).filter(x=>x.activo!==false),U:u}},
    v(){const k='agencias',c=datos(k,this.load),f=SF[k];f.p=f.p||'lista';f.nd=f.nd||{};if(!f.nuevo)f.nuevo={nombre:'',ds:['']};
      let h=`<div class="seg" style="grid-template-columns:1fr 1fr">${[['lista','Tus agencias'],['nueva','Nueva agencia']].map(x=>`<button type="button" class="${f.p===x[0]?'on':''}" data-sa="p:${x[0]}">${x[1]}</button>`).join('')}</div>`;
      if(f.p==='nueva'){const n=f.nuevo,P=['Nombre de la agencia','Destinos que atiende','Ubicación en el mapa'],i=n.paso=Math.min(n.paso||0,2);
        h+=`<div class="cd" style="gap:8px"><div class="lbl" style="margin:0">Paso ${i+1} de 3</div><b style="font-size:18px">${P[i]}</b><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px">${P.map((_,k2)=>`<span style="height:5px;border-radius:9px;background:${k2<=i?'#C4410C':'#EADFD6'}"></span>`).join('')}</div></div>`;
        if(i===0)h+=`<div class="cd"><span style="font-size:14px;color:#6B5E55">Por ejemplo Olva Courier o Shalom.</span><div class="fld"><label>Nombre de la agencia</label><input data-in="ag:n" value="${E(n.nombre)}" placeholder="Ej. Olva Courier o Shalom"></div></div>`;
        if(i===1)h+=`<div class="cd"><span style="font-size:14px;color:#6B5E55">Escribe cada ciudad a la que envía.</span>${n.ds.map((d,j)=>`<div class="row"><input style="flex:1 1 0%;min-width:0;height:52px;border-radius:14px;border:1.5px solid #F1E4DA;padding:0 14px;font:inherit;font-size:16px" data-in="ag:d:${j}" value="${E(d)}" placeholder="${j?'Otro destino':'Ej. Lima'}">${n.ds.length>1?`<button type="button" class="ib" style="color:#B42318" data-sa="nx:${j}" aria-label="Quitar destino">${IC.trash}</button>`:''}</div>`).join('')}<button type="button" class="b" style="height:46px" data-sa="n+">${IC.plus}Agregar otro destino</button></div>`;
        if(i===2)h+=`<div class="cd"><span style="font-size:14px;color:#6B5E55">Opcional: marca la puerta de la agencia para que el motorizado llegue directo.</span><span style="font-size:14px;color:${n.ubi?'#0F5E2E':'#6B5E55'}">${n.ubi?'✓ '+E(n.ubi.direccion||'Ubicación marcada'):'Sin ubicación marcada.'}</span><button type="button" class="b" style="height:48px" data-sa="nub">${n.ubi?'Cambiar en el mapa':'Marcar en el mapa'}</button></div>`;
        if(f.msg)h+=`<div class="err">${E(f.msg)}</div>`;
        const pie=i===0?`<button type="button" class="b o" style="height:54px;font-size:16px" data-sa="nsig">Siguiente</button>`:`<div class="row"><button type="button" class="b" style="flex:1;height:54px" data-sa="natr">Atrás</button><button type="button" class="b o" style="flex:1.7;height:54px;font-size:16px" data-sa="${i===2?'crear':'nsig'}">${i===2?'Guardar agencia':'Siguiente'}</button></div>`;
        return {body:h,foot:pie}}
      if(!c.data)return {body:h+cargando(c)};const {A,Ds,U}=c.data;
      h+=A.length?A.map(a=>{const ds=Ds.filter(d=>String(d.agencia_id)===String(a.id)),u=U[agClave(a.nombre)];
        return `<div class="cd"><div class="row" style="justify-content:space-between;align-items:flex-start"><b style="font-size:17px;overflow-wrap:anywhere">${E(a.nombre)}</b><span style="display:flex;gap:6px;flex:0 0 auto"><button type="button" class="b" style="height:38px;padding:0 12px" data-sa="ed:${E(a.id)}">Editar</button><button type="button" class="b" style="height:38px;padding:0 12px;color:#B42318;border-color:#F4C7C3" data-sa="del:${E(a.id)}">Eliminar</button></span></div>
          <div class="lbl" style="margin:2px 0 0">Destinos</div><div style="display:flex;flex-wrap:wrap;gap:8px">${ds.length?ds.map(d=>`<span style="display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 6px 0 12px;border-radius:999px;background:#FFF4EC;border:1px solid #F1E4DA;font-size:14px;font-weight:600">${E(d.destino_final)}<button type="button" aria-label="Quitar ${E(d.destino_final)}" data-sa="dd:${E(d.id)}" style="width:26px;height:26px;border-radius:50%;border:0;background:#FFFFFF;color:#B42318;font-size:16px;line-height:1;cursor:pointer">×</button></span>`).join(''):'<span style="font-size:14px;color:#6B5E55">Sin destinos.</span>'}</div>
          <div class="row"><input style="flex:1 1 0%;min-width:0;height:48px;border-radius:14px;border:1.5px solid #F1E4DA;padding:0 14px;font:inherit;font-size:16px" placeholder="Nuevo destino" data-in="ag:nd:${E(a.id)}" value="${E(f.nd[a.id]||'')}"><button type="button" class="b" style="flex:0 0 auto;height:48px;padding:0 14px" data-sa="da:${E(a.id)}">Agregar</button></div>
          <div class="row" style="align-items:center"><span style="flex:1 1 0%;font-size:14px;color:${u?'#0F5E2E':'#6B5E55'}">${u?'✓ '+E(u.direccion||'Ubicación marcada'):'Sin ubicación: el motorizado no la verá en el mapa.'}</span><button type="button" class="b" style="height:40px;padding:0 12px" data-sa="ub:${E(a.id)}">${u?'Cambiar ubicación':'Marcar en el mapa'}</button></div></div>`}).join(''):vacio('Todavía no hay agencias. Registra la primera en «Nueva agencia».');
      return {body:h}},
    async a(x){const k='agencias',f=SF[k],c=C2['s:'+k],[op,arg]=[x.split(':')[0],x.split(':').slice(1).join(':')];f.msg='';
      if(op==='p'){f.p=arg;return}
      if(op==='n+'){f.nuevo.ds.push('');return}
      if(op==='natr'){f.nuevo.paso=Math.max(0,(f.nuevo.paso||0)-1);return}
      if(op==='nsig'){const n=f.nuevo;if((n.paso||0)===0){if(!n.nombre.trim()){f.msg='Escribe el nombre de la agencia.';return}const A0=(c&&c.data&&c.data.A)||[];if(A0.some(a=>agClave(a.nombre)===agClave(n.nombre))){f.msg='Esa agencia ya está registrada.';return}}
        if(n.paso===1&&!n.ds.some(d=>d.trim())){f.msg='Agrega al menos un destino.';return}n.paso=(n.paso||0)+1;return}
      if(op==='nub'){const el2=window.pdMapa&&pdMapa.elegir;if(!el2)return;const n=f.nuevo;const r=await el2({titulo:'Ubicación de '+(n.nombre||'la agencia'),centro:n.ubi?{lat:n.ubi.lat,lng:n.ubi.lng}:null});if(!r)return;n.ubi={lat:r.lat,lng:r.lng,direccion:[r.linea,r.sub].filter(Boolean).join(', '),linea:r.linea,sub:r.sub};return}
      if(op==='nx'){f.nuevo.ds.splice(+arg,1);return}
      const A=(c&&c.data&&c.data.A)||[],ag=A.find(a=>String(a.id)===String(arg));
      if(op==='crear'){const nombre=f.nuevo.nombre.trim(),ds=[...new Set(f.nuevo.ds.map(d=>d.trim()).filter(Boolean))];
        if(!nombre){f.msg='Escribe el nombre de la agencia.';return}if(!ds.length){f.msg='Agrega al menos un destino.';return}
        if(A.some(a=>agClave(a.nombre)===agClave(nombre))){f.msg='Esa agencia ya está registrada.';return}
        let r;{const t=await D().from('agencias').select('id,nombre,activo');const vieja=((t&&t.data)||[]).find(x=>agClave(x.nombre)===agClave(nombre));
          /* si estaba eliminada, se vuelve a activar en vez de crear otra con el mismo nombre */
          r=vieja?await D().from('agencias').update({activo:true}).eq('id',vieja.id).select('id').single():await D().from('agencias').insert({nombre,activo:true}).select('id').single()}
         if(r.error){f.msg='No se pudo registrar: '+r.error.message;return}
        const r2=await D().from('agencia_destinos').insert(ds.map(d=>({agencia_id:r.data.id,destino_final:d,activo:true})));if(r2.error)mal('La agencia se guardó, pero no los destinos: '+r2.error.message);
        if(f.nuevo.ubi)try{await agGuardarUbi(nombre,r.data.id,f.nuevo.ubi)}catch(e){mal('La agencia se guardó, pero no su ubicación: '+(e.message||e))}
        ok('Agencia registrada');f.nuevo=null;f.p='lista';PE.ags=null;PE.dsts=null;recargar(k);return}
      if(op==='ed'&&ag){const n=await pedirL('Nuevo nombre de la agencia:',ag.nombre||'');if(n==null)return;const nn=String(n).trim();if(!nn){mal('El nombre no puede quedar vacío.');return}
         if(A.some(a=>a!==ag&&agClave(a.nombre)===agClave(nn))){mal('Ya hay una agencia llamada «'+nn+'».');return}
        const q=await D().from('agencias').update({nombre:nn}).eq('id',ag.id);if(q.error){mal('No se pudo editar: '+q.error.message);return}
        const u=c.data.U[agClave(ag.nombre)];if(u&&agClave(nn)!==agClave(ag.nombre))try{await agGuardarUbi(nn,ag.id,u,agClave(ag.nombre))}catch(_){}
        ok('Agencia actualizada');PE.ags=null;recargar(k);return}
      if(op==='del'&&ag){const n=c.data.Ds.filter(d=>String(d.agencia_id)===String(ag.id)).length;if(!(await conf(n?`«${ag.nombre}» tiene ${n} destino${n===1?'':'s'}. ¿Eliminarla de las agencias activas? Sus pedidos se conservan.`:`¿Eliminar la agencia «${ag.nombre}»?`)))return;
        const q=await D().from('agencias').update({activo:false}).eq('id',ag.id).select('id').maybeSingle();if(q.error||!q.data){mal('No se pudo eliminar'+(q.error?': '+q.error.message:'. Revisa los permisos.'));return}
        c.data.A=A.filter(a=>a!==ag);PE.ags=null;ok('Agencia eliminada');return}
      if(op==='dd'){const d=c.data.Ds.find(y=>String(y.id)===String(arg));if(!d||!(await conf(`¿Quitar el destino «${d.destino_final}»?`)))return;
        const q=await D().from('agencia_destinos').update({activo:false}).eq('id',d.id).select('id').maybeSingle();if(q.error||!q.data){mal('No se pudo quitar'+(q.error?': '+q.error.message:'.'));return}c.data.Ds=c.data.Ds.filter(y=>y!==d);return}
      if(op==='da'&&ag){const v=String(f.nd[ag.id]||'').trim();if(!v){mal('Escribe el destino.');return}
        if(c.data.Ds.some(d=>String(d.agencia_id)===String(ag.id)&&agClave(d.destino_final)===agClave(v))){mal('Ese destino ya está.');return}
        const q=await D().from('agencia_destinos').insert({agencia_id:ag.id,destino_final:v,activo:true}).select('id,agencia_id,destino_final,activo').single();if(q.error){mal('No se pudo agregar: '+q.error.message);return}
        c.data.Ds.push(q.data);f.nd[ag.id]='';return}
      if(op==='ub'&&ag){const el2=window.pdMapa&&pdMapa.elegir;if(!el2)return;const u=c.data.U[agClave(ag.nombre)];
        const r=await el2({titulo:'Ubicación de '+ag.nombre,centro:u?{lat:u.lat,lng:u.lng}:null});if(!r)return;
        try{c.data.U=await agGuardarUbi(ag.nombre,ag.id,r);ok('Ubicación guardada')}catch(e){mal('No se pudo guardar la ubicación: '+(e.message||e))}}}};
  /* la ubicación de cada agencia vive en config/agencias.json (la leen el motorizado y la tienda) */
  async function agGuardarUbi(nombre,id,r,claveVieja){
    const c=D();let act=await agUbis();if(claveVieja)delete act[claveVieja];
    act[agClave(nombre)]={nombre,id:id||null,lat:r.lat,lng:r.lng,direccion:r.direccion||[r.linea,r.sub].filter(Boolean).join(', '),actualizado:new Date().toISOString()};
    const {error}=await c.storage.from('restaurantes').upload('config/agencias.json',new Blob([JSON.stringify({agencias:act},null,2)],{type:'application/json'}),{upsert:true,contentType:'application/json',cacheControl:'0'});
    if(error)throw error;try{window.pdAgenciasRecargar&&window.pdAgenciasRecargar()}catch(_){}return act;
  }


  /* --- Cuentas de acceso (motorizados y negocios): mismas funciones seguras de Supabase --- */
  const ACC_K=['user_id','usuario_id','auth_user_id','auth_id','uid','userId','id_usuario','owner_id','id'];
  const accUid=c=>{for(const k of ACC_K){const v=c&&c[k];if(v!=null&&String(v).trim())return String(v)}return ''};
  const genPw=()=>{const ch='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%*';const a=new Uint32Array(14);crypto.getRandomValues(a);return [...a].map(n=>ch[n%ch.length]).join('')};
  const emailOk=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||'').trim());
  /* imágenes elegidas: se leen y se pasan a WEBP/PNG (así se ven en cualquier celular y pesan poco); si el formato no se puede leer (p. ej. HEIC), se avisa */
  async function prepImg(fl,max){
    const url=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(new Error('lectura'));r.readAsDataURL(fl)});
    const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('formato'));i.src=url});
    const W=img.naturalWidth||img.width,H=img.naturalHeight||img.height;if(!W||!H)throw new Error('formato');
    const k=Math.min(1,(max||1000)/Math.max(W,H)),w=Math.max(1,Math.round(W*k)),h=Math.max(1,Math.round(H*k));
    const cv=document.createElement('canvas');cv.width=w;cv.height=h;cv.getContext('2d').drawImage(img,0,0,w,h);
    let b=await new Promise(r=>cv.toBlob(r,'image/webp',0.86));if(!b||b.type!=='image/webp')b=await new Promise(r=>cv.toBlob(r,'image/png'));if(!b)throw new Error('formato');
    const prev=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(new Error('lectura'));r.readAsDataURL(b)});
    return {file:new File([b],'imagen.'+(b.type==='image/webp'?'webp':'png'),{type:b.type}),prev};
  }
  const IMG_MAL='No se pudo leer esa imagen. Elige una foto en JPG o PNG (las fotos HEIC del iPhone no sirven).';
  async function accInvocar(fn,body){const {data,error}=await D().functions.invoke(fn,{body});if(error){let m='';try{const c=error.context;if(c&&c.json){const j=await c.clone().json();m=j&&(j.error||j.message)||''}}catch(_){}throw new Error(m||error.message||'Error desconocido')}if(data&&data.error)throw new Error(data.error);return data}
  async function accListar(tipo){const d=await accInvocar('listar-accesos-'+tipo,{});return Array.isArray(d&&d.cuentas)?d.cuentas:(Array.isArray(d)?d:[])}
  const accNom=(tipo,c)=>tipo==='negocio'?(c.negocio_nombre||c.nombre_negocio||c.nombre||'Negocio'):(c.motorizado_nombre||c.nombre_motorizado||c.nombre_completo||c.nombre||'Motorizado');
  async function accUidDe(tipo,c){const u=accUid(c);if(u||tipo!=='negocio')return u;const nid=c.negocio_id||c.negocioId;if(!nid)return '';
    try{const r=await D().from('negocios').select('*').eq('id',nid).maybeSingle();for(const k of ['usuario_id','user_id','auth_user_id','owner_id']){if(r.data&&r.data[k])return String(r.data[k])}}catch(_){}
    try{const r=await D().from('negocio_usuarios').select('usuario_id').eq('negocio_id',nid).limit(1).maybeSingle();if(r.data&&r.data.usuario_id)return String(r.data.usuario_id)}catch(_){}return ''}
  /* campos de correo y contraseña (para crear acceso) */
  const pwTxt=n=>!n?'Mínimo 12 caracteres':n<12?'Faltan '+(12-n)+' caracteres':'✓ '+n+' caracteres',pwColor=n=>n&&n<12?'#B42318':n>=12?'#0F5E2E':'#6B5E55';
  function pwVivo(v){const e=root.getElementById('pwCnt');if(e){const n=String(v||'').length;e.textContent=pwTxt(n);e.style.color=pwColor(n)}}
  function accCampos(pfx,f){const n=String(f.pw||'').length;
    return `<div class="fld"><label>Correo de acceso</label><input type="email" inputmode="email" autocomplete="off" data-in="${pfx}:em" value="${E(f.em||'')}" placeholder="ejemplo@grupopidemas.com"></div>
      <div class="fld"><label>Contraseña</label><input type="${f.ver?'text':'password'}" autocomplete="new-password" data-in="${pfx}:pw" value="${E(f.pw||'')}" data-sin-pegar></div>
      <span id="pwCnt" style="font-size:13px;font-weight:600;color:${pwColor(n)}">${pwTxt(n)}</span>
      <div class="row"><button type="button" class="b" style="flex:1;height:44px" data-sa="gen">Generar contraseña segura</button><button type="button" class="b" style="height:44px;padding:0 14px" data-sa="ver">${f.ver?'Ocultar':'Mostrar'}</button></div>`}
  /* lista de cuentas con acciones */
  function accLista(tipo,f){
    const c=f.cuentas;if(c==null)return '<div class="load">Consultando cuentas…</div>';if(c.err)return `<div class="err">${E(c.err)}</div>`;
    if(!c.length)return vacio('Todavía no hay cuentas de acceso.');
    return c.map((x,i)=>{const nom=accNom(tipo,x),off=x.activo===false,ab=f.pwi===i;
      return `<div class="cd"><div class="row" style="align-items:center"><span style="flex:0 0 40px;width:40px;height:40px;border-radius:50%;background:#FDEBDF;color:#C4410C;display:flex;align-items:center;justify-content:center;font-weight:800">${E(nom.charAt(0).toUpperCase())}</span><span style="flex:1 1 0%;min-width:0"><b style="display:block;font-size:16px;overflow-wrap:anywhere">${E(nom)}</b><span style="font-size:13px;color:#6B5E55;overflow-wrap:anywhere">${E(x.email||'Correo no disponible')}</span></span><span class="pl${off?' r':' g'}">${off?'Inactiva':'Activa'}</span></div>
        ${ab?`<div class="fld"><label>Nueva contraseña</label><input type="${f.ver?'text':'password'}" autocomplete="new-password" data-in="acc:npw" value="${E(f.npw||'')}" data-sin-pegar></div><span id="pwCnt" style="font-size:13px;font-weight:600;color:${pwColor(String(f.npw||'').length)}">${pwTxt(String(f.npw||'').length)}</span>
          <div class="row"><button type="button" class="b" style="flex:1;height:44px" data-sa="ngen">Generar</button><button type="button" class="b" style="flex:1;height:44px" data-sa="pwx">Cancelar</button><button type="button" class="b o" style="flex:1.4;height:44px" data-sa="pwok:${i}">Guardar</button></div>`
        :`<div class="row"><button type="button" class="b" style="flex:1;height:42px" data-sa="pw:${i}">Contraseña</button><button type="button" class="b" style="flex:1;height:42px" data-sa="mail:${i}">Correo</button></div><button type="button" class="b" style="width:100%;height:42px;margin-top:8px;display:flex;align-items:center;justify-content:center;gap:8px" data-sa="reenv:${i}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>Reenviar acceso y bienvenida</button>`}</div>`}).join('')}
  async function accAccion(tipo,f,op,arg,recargarLista){
    if(op==='gen'){f.pw=genPw();f.ver=true;return true}
    if(op==='ver'){f.ver=!f.ver;return true}
    if(op==='ngen'){f.npw=genPw();f.ver=true;return true}
    if(op==='pw'){f.pwi=+arg;f.npw='';return true}
    if(op==='pwx'){f.pwi=null;f.npw='';return true}
    const x=(f.cuentas||[])[+arg];
    if(op==='pwok'&&x){if(String(f.npw||'').length<12){mal('La contraseña debe tener al menos 12 caracteres.');return true}
      const uid=await accUidDe(tipo,x);if(!uid){mal('No se identificó la cuenta. Actualiza la lista y vuelve a intentarlo.');return true}
      try{await accInvocar('cambiar-password-'+tipo,{user_id:uid,password:f.npw});ok('Contraseña actualizada. Comunícala de forma privada.');f.pwi=null;f.npw=''}catch(e){mal('No se pudo cambiar la contraseña: '+(e.message||e))}return true}
    if(op==='reenv'&&x){const uid=await accUidDe(tipo,x);if(!uid){mal('No se identificó la cuenta. Actualiza la lista y vuelve a intentarlo.');return true}
      const nom=accNom(tipo,x);
      if(!await pregunta('Reenviar acceso a '+nom+'\nPor seguridad no guardamos las contraseñas, así que se creará una contraseña nueva y la anterior dejará de funcionar.\n\nLuego podrás enviarle el mensaje de bienvenida con su correo y su nueva contraseña.'))return true;
      const pw=genPw();
      try{await accInvocar('cambiar-password-'+tipo,{user_id:uid,password:pw})}catch(e){mal('No se pudo preparar el acceso: '+(e.message||e));return true}
      try{window.pdMensajeAcceso&&window.pdMensajeAcceso({tipo,id:tipo==='negocio'?(x.negocio_id||x.negocioId||''):(x.motorizado_id||x.motorizadoId||''),nombre:tipo==='negocio'?nom:'',email:x.email||'',password:pw,titulo:'Acceso listo para reenviar'})}catch(_){}
      return true}
    if(op==='mail'&&x){const uid=await accUidDe(tipo,x);if(!uid){mal('No se identificó la cuenta. Actualiza la lista y vuelve a intentarlo.');return true}
      const n=await pedirL('Nuevo correo de acceso para '+accNom(tipo,x)+':',x.email||'');if(n==null)return true;const em=String(n).trim().toLowerCase();
      if(!emailOk(em)){mal('Escribe un correo válido.');return true}if(em===String(x.email||'').toLowerCase())return true;
      try{await accInvocar('editar-acceso-'+tipo,{user_id:uid,email:em});ok('Correo actualizado');x.email=em}catch(e){mal('No se pudo actualizar el correo: '+(e.message||e))}return true}
    return false;
  }
  async function accCargar(tipo,f){f.cuentas=null;key='';pintar();try{f.cuentas=await accListar(tipo)}catch(e){f.cuentas={err:'No se pudo cargar la lista de cuentas: '+(e.message||e)}}key='';pintar()}
  async function accCrear(tipo,id,f){
    const em=String(f.em||'').trim().toLowerCase(),pw=String(f.pw||'');
    if(/[^\x21-\x7e]/.test(em)){mal('El correo no puede llevar ñ, tildes ni espacios. Ejemplo: ellenador@grupopidemas.com');return false}if(!emailOk(em)){mal('Escribe un correo válido.');return false}if(pw.length<12){mal('La contraseña debe tener al menos 12 caracteres.');return false}
    try{await accInvocar('crear-acceso-'+tipo,tipo==='negocio'?{negocio_id:id,email:em,password:pw}:{motorizado_id:id,email:em,password:pw})}
    catch(e){mal('No se pudo crear la cuenta: '+(e.message||e));return false}
    try{window.pdMensajeAcceso&&window.pdMensajeAcceso({tipo,id,email:em,password:pw})}catch(_){}
    f.em='';f.pw='';f.ver=false;return true;
  }

  /* --- Crear motorizado --- */
  SEC['crear motorizado']={g:'Motorizados',t:'Crear motorizado',
    v(){const k='crear motorizado',f=SF[k];f.p=f.p||'nuevo';f.paso=f.paso||0;
      let h=`<div class="seg" style="grid-template-columns:1fr 1fr">${[['nuevo','Nuevo motorizado'],['cuentas','Cuentas de acceso']].map(x=>`<button type="button" class="${f.p===x[0]?'on':''}" data-sa="p:${x[0]}">${x[1]}</button>`).join('')}</div>`;
      if(f.p==='cuentas'){if(f.cuentas===undefined)accCargar('motorizado',f);
        if(f.motos===undefined){f.motos=null;D().from('motorizados').select('id,nombre_completo,usuario_id,activo').order('nombre_completo').then(r=>{f.motos=(r.data||[]);key='';pintar()},()=>{f.motos=[]})}
        const sin=(f.motos||[]).filter(m=>!m.usuario_id);
        h+=`<div class="cd"><div class="lbl">Dar acceso a uno ya registrado</div>${f.motos==null?'<div class="load">Cargando…</div>':sin.length?`<div class="fld"><label>Motorizado</label><select data-in="cm:mid" style="height:56px;border-radius:14px;border:1.5px solid #F1E4DA;padding:0 14px;font:inherit;font-size:16px;font-weight:700;width:100%;background:#fff"><option value="">Elige el motorizado</option>${sin.map(m=>`<option value="${E(m.id)}"${String(f.mid)===String(m.id)?' selected':''}>${E(m.nombre_completo||'Motorizado')}</option>`).join('')}</select></div>${f.mid?accCampos('cm',f)+`<button type="button" class="b o" style="height:50px" data-sa="acc">Crear acceso</button>`:''}`:'<div class="fld"><label>Motorizado</label><select disabled style="height:56px;border-radius:14px;border:1.5px solid #F1E4DA;padding:0 14px;font:inherit;font-size:16px;font-weight:700;width:100%;background:#fff;color:#8C8077"><option>Todos ya tienen cuenta</option></select></div>'}</div>`;
        h+=`<div class="row" style="justify-content:space-between;align-items:center;margin:4px 4px 0"><div class="lbl" style="margin:0">Cuentas registradas</div><button type="button" class="b" style="height:36px;padding:0 12px" data-sa="rf">Actualizar</button></div>`+accLista('motorizado',f);
        return {body:h}}
      if(f.paso===2)return {body:h+`<div class="cd" style="align-items:center;text-align:center;gap:10px;padding:22px 16px"><span style="width:56px;height:56px;border-radius:50%;background:#E7F6EC;color:#0F5E2E;display:flex;align-items:center;justify-content:center">${IC.check}</span><b style="font-size:19px">${f.cuenta?'Motorizado y cuenta listos':'Motorizado registrado'}</b><span style="font-size:15px;color:#6B5E55">${E(f.nombre||'')}${f.cuenta?' ya puede entrar a la app con su correo y contraseña.':' quedó registrado. Puedes crear su cuenta de acceso cuando quieras en «Cuentas de acceso».'}</span></div>`,foot:`<button type="button" class="b o" style="height:54px;font-size:16px" data-sa="otro">Registrar otro motorizado</button>`};
      if(f.paso===1)return {body:h+`<div class="cd"><div class="lbl">Paso 2 de 2 · Acceso a la app</div><span style="font-size:14px;color:#6B5E55">Con este correo y contraseña ${E(String(f.nombre||'el motorizado').split(' ')[0])} entra a la app de motorizado. Entrégale la contraseña por un medio privado.</span>${accCampos('cm',f)}</div>`,
        foot:`<div class="row"><button type="button" class="b" style="flex:1;height:54px" data-sa="luego">Ahora no</button><button type="button" class="b o" style="flex:1.6;height:54px;font-size:16px" data-sa="acc">Crear acceso</button></div>`};
      h+=`<div class="cd"><div class="lbl">Paso 1 de 2 · Datos del motorizado</div><span style="font-size:14px;color:#6B5E55">Nombre y número con los que lo verás en los pedidos.</span>
        <div class="fld"><label>Nombre y apellidos</label><input data-in="cm:nombre" value="${E(f.nombre||'')}" placeholder="Nombre completo del motorizado"></div>
        <div class="fld"><label>Teléfono / WhatsApp</label><input type="tel" inputmode="tel" maxlength="15" data-in="cm:tel" value="${E(f.tel||'')}" placeholder="Número de contacto"></div>
        <div class="row" style="align-items:center"><span style="flex:1 1 0%"><b style="display:block">Motorizado activo</b><span style="font-size:13px;color:#6B5E55">Si lo apagas no aparecerá para asignar pedidos.</span></span>${tSw(f.activo!==false,'act','Motorizado activo')}</div></div>`;
      return {body:h,foot:`<button type="button" class="b o" style="height:54px;font-size:16px" data-sa="guardar">Guardar motorizado</button>`}},
    async a(x){const k='crear motorizado',f=SF[k],op=x.split(':')[0],arg=x.split(':').slice(1).join(':');
      if(op==='p'){f.p=arg;if(arg==='cuentas'){f.cuentas=undefined;f.motos=undefined}return}
      if(op==='rf'){f.cuentas=undefined;f.motos=undefined;return}
      if(op==='act'){f.activo=f.activo===false;return}
      if(await accAccion('motorizado',f,op,arg))return;
      if(op==='guardar'){const nombre=String(f.nombre||'').trim().replace(/\s+/g,' '),tel=String(f.tel||'').trim();
        if(!nombre){mal('Escribe el nombre y los apellidos del motorizado.');return}if(!tel){mal('Escribe el teléfono o WhatsApp del motorizado.');return}
        const r=await D().from('motorizados').insert({nombre_completo:nombre,telefono:tel,activo:f.activo!==false,disponible:false}).select('id').single();
        if(r.error){mal('No se pudo guardar: '+r.error.message);return}f.id=r.data.id;f.nombre=nombre;f.paso=1;PE.motos=undefined;try{window.loadAdminMotos&&window.loadAdminMotos()}catch(_){}return}
      if(op==='acc'){const id=f.paso===1?f.id:f.mid;if(!id){mal('Elige el motorizado.');return}
        if(await accCrear('motorizado',id,f)){if(f.paso===1){f.cuenta=true;f.paso=2}else{f.mid='';f.cuentas=undefined;f.motos=undefined;ok('Cuenta creada')}}return}
      if(op==='luego'){f.cuenta=false;f.paso=2;return}
      if(op==='otro'){SF[k]={p:'nuevo',paso:0};return}}};


  /* --- Crear negocio --- */
  const CATS_NEG=['Restaurantes','Comida criolla','Pizzerías','Pollerías','Hamburgueserías','Comida rápida','Sangucherías','Paviferías','Cevicherías','Chifas','Sushi y comida japonesa','Parrillas y anticuchos','Heladerías','Cafeterías','Juguerías','Dulcerías y pastelerías','Panaderías','Bodegas y minimarkets','Fruterías y verdulerías','Carnicerías','Licorerías','Farmacias y boticas','Ropa y moda','Calzado y zapatillas','Accesorios y bisutería','Tecnología','Celulares y accesorios','Belleza y cuidado personal','Hogar y decoración','Ferreterías','Deportes','Bebés y maternidad','Florerías y regalos','Mascotas','Librerías y útiles escolares','Jugueterías','Lavanderías'];
  const PASOS_NEG=['Datos del negocio','Ubicación','En la tienda','Imágenes','Acceso al panel del negocio'];
/* sede: se guarda dentro del nombre como «Nombre (Sede)»; la tienda la muestra como pastilla */
  const sedeSep=n=>{const t=String(n||'').trim(),m=t.match(/^(.*\S)\s*\(([^()]+)\)\s*$/);return m?[m[1],m[2].trim()]:[t,'']};
  const sedeJun=(n,se)=>{n=String(n||'').trim().replace(/\s+/g,' ');se=String(se||'').replace(/[()]/g,'').trim().replace(/\s+/g,' ');return n&&se?n+' ('+se+')':n};
  const SEDE_NOTA='<span style="display:block;font-size:13px;color:#6B5E55;margin:-4px 2px 4px">Si el negocio tiene varios locales, escribe aquí cuál es (ej. Jr. Arequipa). En la tienda se ve como una pastilla al lado del nombre.</span>';
  function cnNuevo(pre){return Object.assign({p:'nuevo',paso:0,nombre:'',sede:'',cat:'',tel:'',desc:'',dir:'',maps:'',lat:'',lng:'',tiempo:'',activo:true,logo:null,portada:null,logoPrev:'',portadaPrev:''},pre||{})}
  window.pdAdmCrearNegocio=function(pre){SF['crear negocio']=cnNuevo(pre);abrirSec('crear negocio')};
  SEC['crear negocio']={g:'Negocios',t:'Crear negocio',
    v(){const k='crear negocio';if(!SF[k].p)SF[k]=cnNuevo();const f=SF[k];
      let h=`<div class="seg" style="grid-template-columns:1fr 1fr">${[['nuevo','Nuevo negocio'],['cuentas','Cuentas de acceso']].map(x=>`<button type="button" class="${f.p===x[0]?'on':''}" data-sa="p:${x[0]}">${x[1]}</button>`).join('')}</div>`;
      if(f.p==='cuentas'){if(f.cuentas===undefined)accCargar('negocio',f);
        if(f.negs===undefined){f.negs=null;Promise.all([D().from('negocios').select('id,nombre').order('nombre'),D().from('negocio_usuarios').select('negocio_id')]).then(([a,b])=>{const con=new Set((b.data||[]).map(x=>String(x.negocio_id)));f.negs=(a.data||[]).map(n=>Object.assign(n,{con:con.has(String(n.id))}));key='';pintar()},()=>{f.negs=[]})}
        const sin=(f.negs||[]).filter(n=>!n.con);
        h+=`<div class="cd"><div class="lbl">Dar acceso a uno ya registrado</div>${f.negs==null?'<div class="load">Cargando…</div>':sin.length?`<div class="fld"><label>Negocio</label><select data-in="cn:nid" style="height:56px;border-radius:14px;border:1.5px solid #F1E4DA;padding:0 14px;font:inherit;font-size:16px;font-weight:700;width:100%;background:#fff"><option value="">Elige el negocio</option>${sin.map(n=>`<option value="${E(n.id)}"${String(f.nid)===String(n.id)?' selected':''}>${E(n.nombre||'Negocio')}</option>`).join('')}</select></div>${f.nid?accCampos('cn',f)+`<button type="button" class="b o" style="height:50px" data-sa="acc">Crear acceso</button>`:''}`:'<div class="fld"><label>Negocio</label><select disabled style="height:56px;border-radius:14px;border:1.5px solid #F1E4DA;padding:0 14px;font:inherit;font-size:16px;font-weight:700;width:100%;background:#fff;color:#8C8077"><option>Todos ya tienen cuenta</option></select></div>'}</div>`;
        h+=`<div class="row" style="justify-content:space-between;align-items:center;margin:4px 4px 0"><div class="lbl" style="margin:0">Cuentas registradas</div><button type="button" class="b" style="height:36px;padding:0 12px" data-sa="rf">Actualizar</button></div>`+accLista('negocio',f);
        return {body:h}}
      if(f.paso===5)return {body:h+`<div class="cd" style="align-items:center;text-align:center;gap:10px;padding:22px 16px"><span style="width:56px;height:56px;border-radius:50%;background:#E7F6EC;color:#0F5E2E;display:flex;align-items:center;justify-content:center">${IC.check}</span><b style="font-size:19px">${f.cuenta?'Negocio y cuenta listos':'Negocio registrado'}</b><span style="font-size:15px;color:#6B5E55">${E(f.nombre)}${f.cuenta?' ya puede entrar a su panel con su correo y contraseña.':' quedó registrado. Puedes crear su acceso cuando quieras en «Cuentas de acceso».'}${f.aviso?'<br>'+E(f.aviso):''}</span></div>`,foot:`<button type="button" class="b o" style="height:54px;font-size:16px" data-sa="otro">Crear otro negocio</button>`};
      const bar=`<div class="cd" style="gap:8px"><div class="lbl" style="margin:0">Paso ${f.paso+1} de 5</div><b style="font-size:18px">${PASOS_NEG[f.paso]}</b><div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px">${PASOS_NEG.map((_,i)=>`<span style="height:5px;border-radius:9px;background:${i<f.paso?'#15803D':i===f.paso?'#C4410C':'#EADFD6'}"></span>`).join('')}</div></div>`;
      const fi=(l,c,o)=>`<div class="fld"><label>${l}</label><input data-in="cn:${c}" value="${E(f[c]??'')}"${o||''}></div>`;
      let b='';
      if(f.paso===0)b=`<div class="cd">${fi('Nombre del negocio','nombre',' placeholder="Ej. Nuevo restaurante" autocomplete="organization"')}${fi('Sede (opcional)','sede',' placeholder="Ej. Jr. Arequipa" maxlength="40" autocomplete="off"')}${SEDE_NOTA}
        <div class="fld"><label>Categoría del negocio</label><select data-in="cn:cat" style="height:56px;border-radius:14px;border:1.5px solid #F1E4DA;padding:0 14px;font:inherit;font-size:16px;font-weight:700;width:100%;background:#fff"><option value="">Selecciona una categoría</option>${CATS_NEG.map(c=>`<option${f.cat===c?' selected':''}>${E(c)}</option>`).join('')}${f.cat&&!CATS_NEG.includes(f.cat)?`<option selected>${E(f.cat)}</option>`:''}</select></div>
        ${fi('Teléfono / WhatsApp','tel',' type="tel" inputmode="tel" maxlength="15" placeholder="Número de contacto"')}
        <div class="fld"><label>Descripción</label><textarea data-in="cn:desc" placeholder="Descripción breve del negocio" style="min-height:96px;padding:14px 16px;border-radius:14px;border:1.5px solid #F1E4DA;font:inherit;font-size:16px;width:100%;box-sizing:border-box">${E(f.desc)}</textarea></div></div>`;
      if(f.paso===1){const ok2=f.lat!==''&&f.lng!==''&&Number.isFinite(Number(f.lat))&&Number.isFinite(Number(f.lng));
        b=`<div class="cd">${fi('Dirección','dir',' placeholder="Dirección del local"')}${fi('Enlace de Google Maps','maps',' placeholder="https://maps.google.com/..."')}
        <button type="button" class="b" style="height:46px" data-sa="mapa">${ok2?'Cambiar en el mapa':'Marcar en el mapa'}</button>
        <span style="font-size:14px;color:${ok2?'#0F5E2E':'#6B5E55'}">${ok2?'✓ Punto marcado: '+Number(f.lat).toFixed(5)+', '+Number(f.lng).toFixed(5):'Marca la puerta exacta del local: con ese punto se calcula el delivery.'}</span></div>`}
      if(f.paso===2)b=`<div class="cd"><div class="fld"><label>Tiempo de entrega</label><input data-in="cn:tiempo" maxlength="20" value="${E(f.tiempo)}" placeholder="Ej. 25–35 min"></div><div class="chips" style="flex-wrap:wrap">${['15–25 min','20–30 min','25–35 min','30–45 min'].map(t=>`<button type="button" class="${f.tiempo===t?'on':''}" data-sa="t:${t}">${t}</button>`).join('')}</div>
        <div class="row" style="align-items:center"><span style="flex:1 1 0%"><b style="display:block">Negocio activo</b><span style="font-size:13px;color:#6B5E55">Si lo apagas, no aparece en la tienda.</span></span>${tSw(f.activo,'act','Negocio activo')}</div></div>`;
      if(f.paso===3){const pv=(u,t)=>`<span style="flex:0 0 72px;width:72px;height:72px;border-radius:16px;background:#FDEBDF center/cover no-repeat${u?` url('${E(u)}')`:''};display:flex;align-items:center;justify-content:center;color:#9A330A;font-size:12px;font-weight:700;text-align:center">${u?'':t}</span>`;
        b=`<div class="cd"><div class="lbl">Logo</div><div class="row" style="align-items:center">${pv(f.logoPrev,'Sin logo')}<label class="b soft" style="flex:1;height:46px;cursor:pointer">${f.logo?'Cambiar logo':'Subir logo'}<input type="file" accept="image/png,image/jpeg,image/webp" data-in="cnfile:logo" style="display:none"></label></div></div>
          <div class="cd"><div class="lbl">Portada</div><div class="row" style="align-items:center">${pv(f.portadaPrev,'Sin portada')}<label class="b soft" style="flex:1;height:46px;cursor:pointer">${f.portada?'Cambiar portada':'Subir portada'}<input type="file" accept="image/png,image/jpeg,image/webp" data-in="cnfile:portada" style="display:none"></label></div></div>
          <div class="cd"><div class="lbl">Así se verá en la tienda</div><div class="row" style="align-items:center">${pv(f.logoPrev,(f.nombre||'?').charAt(0).toUpperCase())}<span style="flex:1 1 0%"><b style="display:block;font-size:16px">${E(f.nombre||'Nombre del negocio')}</b><span style="font-size:13px;color:#6B5E55">${E(f.cat||'Categoría')} · ${E(f.tiempo||'25–40 min')}</span></span><span class="pl${f.activo?' g':' r'}">${f.activo?'Abierto':'Inactivo'}</span></div></div>`}
      if(f.paso===4)b=`<div class="cd"><span style="font-size:14px;color:#6B5E55">Con este correo y contraseña el dueño entra a su panel. Entrégale la contraseña por un medio privado.</span>${accCampos('cn',f)}</div>`;
      const atras=f.paso>0&&f.paso<4?`<button type="button" class="b" style="flex:1;height:54px" data-sa="atras">Atrás</button>`:f.paso===4?`<button type="button" class="b" style="flex:1;height:54px" data-sa="luego">Ahora no</button>`:'';
      const sig=f.paso<3?'Siguiente':f.paso===3?'Guardar negocio':'Crear acceso';
      return {body:h+bar+b,foot:`<div class="row">${atras}<button type="button" class="b o" style="flex:1.6;height:54px;font-size:16px" data-sa="sig">${sig}</button></div>`}},
    async a(x){const k='crear negocio',f=SF[k],op=x.split(':')[0],arg=x.split(':').slice(1).join(':');
      if(op==='p'){f.p=arg;if(arg==='cuentas'){f.cuentas=undefined;f.negs=undefined}return}
      if(op==='rf'){f.cuentas=undefined;f.negs=undefined;return}
      if(await accAccion('negocio',f,op,arg))return;
      if(op==='act'){f.activo=!f.activo;return}
      if(op==='t'){f.tiempo=arg;return}
      if(op==='atras'){f.paso=Math.max(0,f.paso-1);return}
      if(op==='mapa'){const el2=window.pdMapa&&pdMapa.elegir;if(!el2)return;const c0=Number.isFinite(Number(f.lat))&&f.lat!==''?{lat:Number(f.lat),lng:Number(f.lng)}:coordsDe(f.maps);
        const r=await el2({titulo:'Ubicación de '+(f.nombre||'el negocio'),centro:c0});if(!r)return;f.lat=Number(r.lat).toFixed(6);f.lng=Number(r.lng).toFixed(6);f.maps='https://maps.google.com/?q='+f.lat+','+f.lng;const lin=[r.linea,r.sub].filter(Boolean).join(', ');if(!String(f.dir).trim()&&lin)f.dir=lin;return}
      if(op==='luego'){f.cuenta=false;f.paso=5;return}
      if(op==='otro'){SF[k]=cnNuevo();return}
      if(op==='acc'&&f.p==='cuentas'){if(!f.nid){mal('Elige el negocio.');return}if(await accCrear('negocio',f.nid,f)){f.nid='';f.cuentas=undefined;f.negs=undefined;ok('Cuenta creada')}return}
      if(op==='sig'){
        if(f.paso===0){if(!String(f.nombre).trim()){mal('Escribe el nombre del negocio.');return}f.paso=1;return}
        if(f.paso===1){const c=coordsDe(f.maps);if(c&&(f.lat===''||f.lng==='')){f.lat=String(c.lat);f.lng=String(c.lng)}f.paso=2;return}
        if(f.paso===2){f.paso=3;return}
        if(f.paso===3){const lat=f.lat===''?null:Number(f.lat),lng=f.lng===''?null:Number(f.lng);
          const p={nombre:sedeJun(f.nombre,f.sede),categoria_negocio:f.cat||null,telefono:String(f.tel).trim()||null,descripcion:String(f.desc).trim()||null,direccion:String(f.dir).trim()||null,google_maps_url:String(f.maps).trim()||null,
            latitud:Number.isFinite(lat)?lat:null,longitud:Number.isFinite(lng)?lng:null,tiempo_estimado:String(f.tiempo).trim()||null,activo:!!f.activo};
          let r=await D().from('negocios').insert(p).select('id').single();
          if(r.error){mal('No se pudo guardar el negocio: '+r.error.message);return}
          f.id=r.data.id;const av=[];
          for(const [cl,col,nom] of [['logo','logo_url','logo'],['portada','imagen_url','portada']]){const fl=f[cl];if(!fl)continue;
            try{const ext=/png/.test(fl.type)?'png':/webp/.test(fl.type)?'webp':'jpg',path=f.id+'/'+nom+'.'+ext;const up=await D().storage.from('restaurantes').upload(path,fl,{upsert:true,contentType:fl.type||'image/jpeg'});if(up.error)throw up.error;
              const url=D().storage.from('restaurantes').getPublicUrl(path).data.publicUrl;const q=await D().from('negocios').update({[col]:url}).eq('id',f.id);if(q.error)throw q.error}
            catch(e){av.push('La imagen de '+nom+' no se pudo subir; puedes subirla luego desde Configurar negocios.')}}
          f.aviso=av.join(' ');try{window.loadRestaurants&&window.loadRestaurants()}catch(_){}
          f.paso=4;if(!f.em&&f.correo)f.em=f.correo;return}
        if(f.paso===4){if(await accCrear('negocio',f.id,f)){f.cuenta=true;f.paso=5}return}}}};


  /* =============== CONFIGURAR NEGOCIOS (mismo contenido que el panel del negocio) =============== */
  const CX_DIAS=[['lunes','Lun','Lunes'],['martes','Mar','Martes'],['miercoles','Mié','Miércoles'],['jueves','Jue','Jueves'],['viernes','Vie','Viernes'],['sabado','Sáb','Sábado'],['domingo','Dom','Domingo']];
  const CX_T=['10–20 min','20–30 min','30–40 min'];
  const CX_MARK='\n\n[[PIDEMAS_CARACTERISTICAS_V1: ';
  const cxSplit=raw=>{const s=String(raw||'');const at=s.lastIndexOf(CX_MARK);if(at<0)return{d:s,f:[]};try{const t=s.slice(at+CX_MARK.length);if(!t.endsWith(']]'))return{d:s,f:[]};const j=JSON.parse(t.slice(0,-2));return{d:s.slice(0,at).trimEnd(),f:Array.isArray(j)?j.filter(x=>x&&String(x.name||'').trim()).map(x=>({n:String(x.name),v:String(x.value||'')})):[]}}catch(e){return{d:s,f:[]}}};
  const cxCompose=(d,f)=>{const c=String(d||'').trim();const ok=(f||[]).map(x=>({name:String(x.n||'').trim(),value:String(x.v||'').trim()})).filter(x=>x.name&&x.value);return (c+(ok.length?CX_MARK+JSON.stringify(ok)+']]':''))||null};
  const cxH24=v=>{const m=String(v||'').match(/^(\d{1,2}):(\d{2})/);return m?m[1].padStart(2,'0')+':'+m[2]:''};
  const cxHor=t=>{const o={};String(t||'').split('|').forEach(x=>{const m=x.trim().match(/^([a-z]+)=(.*)$/i);if(!m)return;const L=m[2].split(',').map(y=>y.split('-')).filter(y=>y.length===2&&cxH24(y[0])&&cxH24(y[1]));if(!L.length)return;const v={a:cxH24(L[0][0]),c:cxH24(L[0][1])};if(L[1]){v.t2=true;v.a2=cxH24(L[1][0]);v.c2=cxH24(L[1][1])}o[m[1].toLowerCase()]=v});return o};
  const cxTiempo=r=>{const ns=(String(r.tiempo_estimado||'').match(/\d+/g)||[]).map(Number);if(!ns.length)return '';const hi=ns[ns.length-1];let b=CX_T[0],d=1e9;CX_T.forEach(t=>{const n=+t.match(/\d+/g)[1];if(Math.abs(n-hi)<d){d=Math.abs(n-hi);b=t}});return b};
  const cxDsPerfil=r=>{const c=String(r&&r.categoria_negocio||'').trim().toLowerCase();if(!c)return {t:'bolsa',k:['bolsa']};if(/agua|gas\b|lavander/.test(c))return {t:'ninguno',k:[]};if(/panader/.test(c))return {t:'bolsa',k:['bolsa']};
    if(/restaur|comida|poll|pizz|hambur|sangu|pavi|cevich|chifa|sushi|japon|parrill|anticuch|helad|cafe|jugu|dulce|pastel|broaster|men[uú]|postre|marisc|criolla/.test(c))return {t:'comida',k:['taper_p','taper_g','vaso_p','vaso_g','bolsa','cubiertos']};return {t:'bolsa',k:['bolsa']}};
  const CX_DSK=[['taper_p','Taper pequeño','Se elige en cada producto'],['taper_g','Taper grande','Se elige en cada producto'],['vaso_p','Vaso pequeño','Se elige en cada producto'],['vaso_g','Vaso grande','Se elige en cada producto'],['bolsa','Bolsa','Va en cada pedido'],['cubiertos','Cubiertos','Lo pide el cliente']];
  const cxDsCfg=n=>{let c=n&&n.descartables_config;if(typeof c==='string'){try{c=JSON.parse(c)}catch(e){c=null}}return c&&typeof c==='object'?c:{}};
  const cxNum=v=>{if(v===null||v===undefined||String(v).trim()==='')return null;const n=Number(String(v).replace(',','.'));return Number.isFinite(n)&&n>=0?Math.round(n*100)/100:NaN};
  const cxTxt=v=>{const n=Number(v);return v===null||v===undefined||v===''||!Number.isFinite(n)?'':(n===0?'0':n.toFixed(2))};
  const cxIn=(l,k,v,o)=>`<div class="fld"><label>${l}</label><input data-in="cx:${k}" value="${E(v??'')}"${o||''}></div>`;
  const cxSel=(k,ops,v,ph)=>`<select data-in="cx:${k}" style="height:56px;border-radius:14px;border:1.5px solid #F1E4DA;padding:0 14px;font:inherit;font-size:16px;font-weight:700;width:100%;background:#fff">${ph?`<option value="">${E(ph)}</option>`:''}${ops.map(x=>`<option value="${E(x[0])}"${String(v)===String(x[0])?' selected':''}>${E(x[1])}</option>`).join('')}</select>`;
  const cxImg=(u,t,w)=>`<span style="flex:0 0 ${w?112:72}px;width:${w?112:72}px;height:72px;border-radius:16px;background:#FDEBDF center/cover no-repeat${u?` url('${E(u)}')`:''};display:flex;align-items:center;justify-content:center;color:#9A330A;font-size:12px;font-weight:700;text-align:center">${u?'':t}</span>`;
  function cxDatos(n){const H=cxHor(n.horario);const H2={};CX_DIAS.forEach(([k])=>{H2[k]=H[k]?{on:true,a:H[k].a,c:H[k].c,t2:!!H[k].t2,a2:H[k].a2||'18:00',c2:H[k].c2||'22:00'}:{on:false,a:'09:00',c:'22:00',t2:false,a2:'18:00',c2:'22:00'}});
    return {nombre:sedeSep(n.nombre)[0],sede:sedeSep(n.nombre)[1],cat:n.categoria_negocio||'',desc:n.descripcion||'',tel:n.telefono||'',ruc:n.ruc||'',dir:n.direccion||'',maps:n.google_maps_url||'',lat:n.latitud??'',lng:n.longitud??'',pub:n.ubicacion_publica!==false,tiempo:cxTiempo(n),ttoc:false,H:H2,ynum:n.yape_numero||'',ytit:n.yape_titular||''}}
  SEC['configurar negocios']={g:'Negocios',t:'Configurar negocios',
    load:async()=>{const r=await D().from('negocios').select('*').order('nombre',{ascending:true});if(r.error)throw r.error;return r.data||[]},
    v(){const k='configurar negocios',c=datos(k,this.load),f=SF[k];f.tab=f.tab||'perfil';f.open=f.open||{};f.more=f.more||{};
      if(!c.data)return {body:cargando(c)};const L2=c.data;const n=L2.find(x=>String(x.id)===String(f.nid));
      let h=`<div class="cd"><div class="fld"><label>Negocio</label><select data-in="cx:nid" style="height:56px;border-radius:14px;border:1.5px solid #F1E4DA;padding:0 14px;font:inherit;font-size:16px;font-weight:700;width:100%;background:#fff"><option value="">Selecciona un negocio</option>${L2.map(x=>`<option value="${E(x.id)}"${String(x.id)===String(f.nid)?' selected':''}>${E(x.nombre||'Sin nombre')}</option>`).join('')}</select></div>`;
      if(!n)return {body:h+`<span style="font-size:14px;color:#6B5E55">Elige un negocio para ver y editar lo mismo que el negocio ve en su panel: Mi perfil y Productos.</span></div>`};
      const vis=n.visible_admin!==false;
      /* Regla: para salir en la tienda necesita logo y al menos un producto disponible */
      const rq=cargar('req:'+n.id,async()=>{const q=await D().from('productos_negocio').select('id',{count:'exact',head:true}).eq('negocio_id',n.id).eq('disponible',true);if(q.error)throw q.error;return {np:q.count||0}});
      const falta=[];if(!String(n.logo_url||'').trim())falta.push('subir el logo');if(rq.data&&!rq.data.np)falta.push('agregar al menos un producto disponible');
      h+=`<div class="row" style="align-items:center"><span style="flex:1 1 0%"><b style="display:block">Visible en la tienda</b><span style="font-size:13px;color:#6B5E55">${vis?(falta.length?'Aún no sale en la tienda':n.activo===false?'Visible, pero pausado por el negocio':'Los clientes ven este negocio en la tienda'):'Oculto por Pidemás'}</span></span>${tSw(vis,'vis','Visible en la tienda')}</div>${falta.length?`<div style="margin-top:10px;padding:12px 14px;border-radius:14px;background:#FFF4E5;color:#8A4B00;font-size:14px;line-height:1.45"><b style="display:block">No sale en la tienda todavía</b>Para aparecer necesita logo y al menos un producto. Falta ${falta.join(' y ')}.</div>`:''}</div>`;
      h+=`<div class="seg" style="grid-template-columns:repeat(3,minmax(0,1fr))">${[['perfil','Mi perfil'],['productos','Productos'],['acceso','Acceso']].map(x=>`<button type="button" class="${f.tab===x[0]?'on':''}" data-sa="tab:${x[0]}">${x[1]}</button>`).join('')}</div>`;
      if(f.tab==='perfil')return this.perfil(f,n,h);
      if(f.tab==='productos')return f.e?this.prod(f,n,h):this.productos(f,n,h);
      return this.acceso(f,n,h)},
    perfil(f,n,h){if(!f.d||f.dId!==n.id){f.d=cxDatos(n);f.dId=n.id}const d=f.d,okc=d.lat!==''&&d.lng!==''&&Number.isFinite(Number(d.lat))&&Number.isFinite(Number(d.lng));
      const pz=n.pausado_hasta&&new Date(n.pausado_hasta).getTime()>Date.now()?new Date(n.pausado_hasta):null;
      const url='https://pidemas.pe/?negocio='+encodeURIComponent(n.id);
      const imgCard=(t,col,u,w,quit,kind)=>`<div class="row" style="align-items:center">${cxImg(u,'Sin '+t.toLowerCase(),w)}<span style="flex:1 1 0%;display:flex;flex-direction:column;gap:6px"><b>${t}</b><span class="row"><label class="b soft" style="flex:1;height:46px;cursor:pointer">${u?'Cambiar':'Subir'}<input type="file" accept="image/png,image/jpeg,image/webp" data-in="cxf:${kind}" style="display:none"></label>${u?`<button type="button" class="b" style="height:42px;padding:0 12px;color:#B42318;border-color:#F4C7C3" data-sa="iq:${kind}">Quitar</button>`:''}</span></span></div>`;
      h+=`<div class="cd"><div class="lbl">Imagen del negocio</div>${imgCard('Logo','logo_url',n.logo_url,false,1,'logo')}${imgCard('Portada','imagen_url',n.imagen_url,true,1,'portada')}</div>`;
      h+=`<div class="cd"><div class="lbl">Datos del negocio</div>${cxIn('Nombre del negocio','nombre',d.nombre)}${cxIn('Sede (opcional)','sede',d.sede,' placeholder="Ej. Jr. Arequipa" maxlength="40" autocomplete="off"')}${SEDE_NOTA}<div class="fld"><label>Categoría del negocio</label>${cxSel('cat',(d.cat&&!CATS_NEG.includes(d.cat)?[d.cat]:[]).concat(CATS_NEG).map(x=>[x,x]),d.cat,'Selecciona una categoría')}</div>
        <div class="fld"><label>Descripción</label><textarea data-in="cx:desc" style="min-height:90px;padding:14px 16px;border-radius:14px;border:1.5px solid #F1E4DA;font:inherit;font-size:16px;width:100%;box-sizing:border-box">${E(d.desc)}</textarea></div>
        <div class="g2">${cxIn('WhatsApp','tel',d.tel,' type="tel" inputmode="tel"')}${cxIn('RUC','ruc',d.ruc,' inputmode="numeric"')}</div></div>`;
      h+=`<div class="cd"><div class="lbl">Ubicación</div>${cxIn('Dirección del local','dir',d.dir)}<button type="button" class="b" style="height:46px" data-sa="mapa">${okc?'Cambiar en el mapa':'Marcar en el mapa'}</button>
        <span style="font-size:14px;color:${okc?'#0F5E2E':'#B42318'}">${okc?'✓ Con este punto se calcula el delivery: '+Number(d.lat).toFixed(5)+', '+Number(d.lng).toFixed(5):'Falta marcar el local. Sin ubicación, el delivery se cobra aproximado.'}</span>
        <div class="row" style="align-items:center"><span style="flex:1 1 0%"><b style="display:block">Mostrar la dirección a los clientes</b><span style="font-size:13px;color:#6B5E55">${d.pub?'Los clientes ven la dirección en la tienda.':'Privada: en la tienda sale «Solo delivery».'}</span></span>${tSw(d.pub,'pub','Mostrar la dirección')}</div></div>`;
      h+=`<div class="cd"><div class="lbl">Tiempo de entrega</div><div class="seg" style="grid-template-columns:repeat(3,minmax(0,1fr))">${CX_T.map(t=>`<button type="button" class="${d.tiempo===t?'on':''}" data-sa="t:${t}">${t}</button>`).join('')}</div></div>`;
      const nd=CX_DIAS.filter(([k])=>d.H[k].on).length;
      h+=`<div class="cd"><div class="lbl">Horario de atención</div><span style="font-size:14px;color:#6B5E55">${nd?nd+' día'+(nd===1?'':'s')+' de atención a la semana.':'No tiene días de atención.'} Toca un día para abrirlo o cerrarlo.</span>
        ${CX_DIAS.map(([k,c3,nm])=>{const x=d.H[k];return `<div class="row" style="align-items:center;gap:8px"><button type="button" class="b${x.on?' o':''}" style="flex:0 0 58px;height:44px;padding:0" data-sa="dia:${k}" aria-pressed="${x.on}" aria-label="${nm}">${c3}</button>${x.on?`<input type="time" data-in="cxh:${k}:a" value="${E(x.a)}" style="flex:1;min-width:0;height:44px;border-radius:12px;border:1.5px solid #F1E4DA;padding:0 8px;font:inherit;font-size:15px"><span style="color:#6B5E55">a</span><input type="time" data-in="cxh:${k}:c" value="${E(x.c)}" style="flex:1;min-width:0;height:44px;border-radius:12px;border:1.5px solid #F1E4DA;padding:0 8px;font:inherit;font-size:15px">${x.t2?'<span style="flex:0 0 36px"></span>':`<button type="button" class="b" style="flex:0 0 36px;width:36px;height:36px;padding:0;border-radius:50%;color:#C4410C;font-size:20px" data-sa="ht2:${k}" aria-label="Agregar segundo turno el ${nm}">+</button>`}`:'<span style="flex:1;color:#6B5E55;font-size:14px">Cerrado</span>'}</div>${x.on&&x.t2?`<div class="row" style="align-items:center;gap:8px"><span style="flex:0 0 58px;text-align:center;font-size:11px;font-weight:800;color:#6B5E55">2.º turno</span><input type="time" data-in="cxh:${k}:a2" value="${E(x.a2)}" style="flex:1;min-width:0;height:44px;border-radius:12px;border:1.5px solid #F1E4DA;padding:0 8px;font:inherit;font-size:15px"><span style="color:#6B5E55">a</span><input type="time" data-in="cxh:${k}:c2" value="${E(x.c2)}" style="flex:1;min-width:0;height:44px;border-radius:12px;border:1.5px solid #F1E4DA;padding:0 8px;font:inherit;font-size:15px"><button type="button" class="b" style="flex:0 0 36px;width:36px;height:36px;padding:0;border-radius:50%" data-sa="hx2:${k}" aria-label="Quitar segundo turno del ${nm}">×</button></div>`:''}`}).join('')}
        <div class="row"><button type="button" class="b" style="flex:1;height:44px" data-sa="hcopy">Igual todos los días</button><button type="button" class="b" style="flex:1;height:44px" data-sa="hall">Abrir toda la semana</button></div></div>`;
      h+=`<div class="cd"><div class="row" style="justify-content:space-between;align-items:center"><div class="lbl" style="margin:0">Pausar pedidos</div><span class="pl${pz?' r':' g'}">${pz?'En pausa':'Recibiendo'}</span></div><span style="font-size:14px;color:#6B5E55">${pz?'No recibe pedidos nuevos hasta las '+E(pz.toLocaleTimeString('es-PE',{hour:'numeric',minute:'2-digit',timeZone:'America/Lima'}))+'.':'Si el negocio está lleno, pausa los pedidos nuevos por un rato.'}</span>
        <div class="grid4">${[[15,'15 min'],[30,'30 min'],[60,'1 hora'],[120,'2 horas']].map(x=>`<button type="button" data-sa="pz:${x[0]}">${pz?'+ ':''}${x[1]}</button>`).join('')}</div>${pz?'<button type="button" class="b" style="height:46px" data-sa="pz:0">Reanudar ahora</button>':''}</div>`;
      h+=`<div class="cd"><div class="row" style="justify-content:space-between;align-items:center"><div class="lbl" style="margin:0">Yape del negocio</div><span class="pl${n.yape_qr_url?' g':' r'}">${n.yape_qr_url?'Listo':'Falta'}</span></div>${imgCard('QR de Yape','yape_qr_url',n.yape_qr_url,false,1,'yape')}<div class="g2">${cxIn('Número de Yape','ynum',d.ynum,' type="tel" inputmode="numeric" maxlength="9" placeholder="9 dígitos"')}${cxIn('Titular','ytit',d.ytit,' placeholder="Como sale en Yape"')}</div></div>`;
      h+=`<div class="cd"><div class="lbl">Enlace de su carta</div><div style="font-size:14px;overflow-wrap:anywhere;color:#1F1A17">${E(url)}</div><div class="row"><button type="button" class="b" style="flex:1;height:44px" data-sa="copiar">Copiar</button><a class="b g" style="flex:1;height:44px" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent('Pide en '+(n.nombre||'nuestro negocio')+' por Pidemás Delivery: '+url)}">WhatsApp</a><a class="b" style="flex:1;height:44px" target="_blank" rel="noopener" href="${E(url)}">Ver tienda</a></div></div>`;
      return {body:h,foot:`<button type="button" class="b o" style="height:54px;font-size:16px" data-sa="guardar">Guardar cambios</button>`}},
    productos(f,n,h){const P=f.P,Cs=f.C;if(!P||f.pId!==n.id){if(!f.cargando)cxCargarCarta(f,n);return {body:h+'<div class="load">Cargando productos…</div>'}}
      const q=String(f.q||'').trim().toLowerCase();const st=x=>x.stock==null?null:Number(x.stock);
      h+=`<input type="search" data-in="cx:q" data-sin-pegar value="${E(f.q||'')}" placeholder="Buscar producto" style="height:52px;border-radius:14px;border:1.5px solid #F1E4DA;padding:0 16px;font:inherit;font-size:16px;background:#fff">
        <div class="row"><button type="button" class="b o" style="flex:1;height:48px" data-sa="pnew:">Producto</button><button type="button" class="b" style="flex:1;height:48px" data-sa="cnew">Categoría</button></div>`;
      const PF=cxDsPerfil(n);if(PF.t!=='ninguno')h+=`<button type="button" class="b" style="height:48px" data-sa="ds">${PF.t==='bolsa'?'Bolsa':'Descartables'} · ${n.descartables_activo===true?'Activados':'Apagados'}</button>`;
      if(f.dsOpen&&PF.t!=='ninguno'){const c=cxDsCfg(n),ex=f.dx||(f.dx=(Array.isArray(c.extras)?c.extras:[]).map(x=>({id:x.id,n:x.n,p:cxTxt(x.p)})));f.dp=f.dp||Object.fromEntries(CX_DSK.map(([k])=>[k,cxTxt(c[k])]));
        h+=`<div class="cd"><div class="row" style="align-items:center"><span style="flex:1 1 0%"><b style="display:block">${PF.t==='bolsa'?'Cobrar bolsa':'Cobrar descartables'}</b><span style="font-size:13px;color:#6B5E55">Se suma su precio a los pedidos.</span></span>${tSw(n.descartables_activo===true,'dson','Cobrar descartables')}</div>
          ${n.descartables_activo===true?`<div class="lbl">Precio por unidad · vacío = no lo ofrece · 0 = gratis</div>${CX_DSK.filter(([k])=>PF.k.includes(k)).map(([k,nm,sub])=>`<div class="row" style="align-items:center"><span style="flex:1.4 1 0;min-width:0"><b style="display:block;font-size:15px">${nm}</b><span style="font-size:12px;color:#6B5E55">${sub}</span></span><input inputmode="decimal" maxlength="6" data-in="cxd:${k}" value="${E(f.dp[k])}" placeholder="S/" style="flex:1 1 0;min-width:0;height:48px;border-radius:12px;border:1.5px solid #F1E4DA;padding:0 12px;font:inherit;font-size:16px;font-weight:700"></div>`).join('')}
          <div class="lbl" style="margin-top:6px">Otros descartables</div>${ex.map((x,i)=>`<div class="row"><input data-in="cxx:${i}:n" value="${E(x.n)}" placeholder="Ej. Caja" style="flex:1.6 1 0;min-width:0;height:48px;border-radius:12px;border:1.5px solid #F1E4DA;padding:0 12px;font:inherit;font-size:16px"><input inputmode="decimal" data-in="cxx:${i}:p" value="${E(x.p)}" placeholder="S/" style="flex:1 1 0;min-width:0;height:48px;border-radius:12px;border:1.5px solid #F1E4DA;padding:0 12px;font:inherit;font-size:16px"><button type="button" class="ib" style="color:#B42318" data-sa="dxq:${i}" aria-label="Quitar">${IC.trash}</button></div>`).join('')}
          <button type="button" class="b" style="height:44px" data-sa="dx+">Agregar más descartables</button><span style="font-size:12px;color:#6B5E55">Si entrega bolsa de plástico, el impuesto ICBPER de S/ 0.50 va incluido en el precio.</span><button type="button" class="b o" style="height:48px" data-sa="dsg">Guardar precios</button>`:''}</div>`}
      if(f.cNew)h+=`<div class="cd"><div class="lbl">Nueva categoría</div><input data-in="cx:cn" value="${E(f.cn||'')}" placeholder="Nombre (ej. Ceviches, Bebidas)" style="height:52px;border-radius:14px;border:1.5px solid #F1E4DA;padding:0 14px;font:inherit;font-size:16px"><div class="row"><button type="button" class="b" style="flex:1;height:46px" data-sa="cnew">Cancelar</button><button type="button" class="b o" style="flex:1.4;height:46px" data-sa="csave">Guardar categoría</button></div></div>`;
      const ids=new Set(Cs.map(c=>String(c.id)));const G=Cs.map(c=>({c,l:P.filter(x=>String(x.categoria_id||'')===String(c.id))}));const sueltos=P.filter(x=>!x.categoria_id||!ids.has(String(x.categoria_id)));if(sueltos.length)G.push({c:null,l:sueltos});
      if(!P.length&&!Cs.length)h+=vacio('Aún no tiene productos. Crea una categoría (por ejemplo «Platos») y luego agrega los productos.');
      h+=G.map((g,gi)=>{const sh=q?g.l.filter(x=>String(x.nombre||'').toLowerCase().includes(q)):g.l;if(q&&!sh.length)return '';const c=g.c,cid=c?String(c.id):'_',on=!c||c.activo!==false,ab=!!q||f.open[cid];
        const z=g.l.filter(x=>{const v=st(x);return v!==null&&v<=0}).length,hid=g.l.filter(x=>x.disponible===false).length;
        const sub=[g.l.length+' producto'+(g.l.length===1?'':'s'),z?z+' sin stock':'',hid?hid+' oculto'+(hid===1?'':'s'):'',c&&!on?'Oculta en la tienda':''].filter(Boolean).join(' · ');
        return `<div class="cd" style="${on?'':'opacity:.75'}"><button type="button" data-sa="co:${cid}" style="display:flex;align-items:center;gap:10px;border:0;background:none;padding:0;text-align:left;font:inherit;cursor:pointer;color:inherit"><span style="flex:1 1 0%"><b style="display:block;font-size:16px">${c?E(c.nombre):'Sin categoría'}</b><span style="font-size:13px;color:#6B5E55">${E(sub)}</span></span><span style="transform:rotate(${ab?-90:90}deg);display:flex">${IC.chev?IC.chev:'▾'}</span></button>
          ${ab?(sh.map(x=>{const v=st(x),vi=x.disponible!==false;return `<div class="row" style="align-items:center;padding:6px 0;border-top:1px solid #F1E4DA"><button type="button" data-sa="pe:${E(x.id)}" style="flex:1 1 0%;min-width:0;display:flex;align-items:center;gap:10px;border:0;background:none;padding:0;text-align:left;font:inherit;cursor:pointer;color:inherit">${cxImg(x.imagen_url,E(String(x.nombre||'P').charAt(0).toUpperCase()))}<span style="min-width:0"><b style="display:block;font-size:15px;overflow-wrap:anywhere">${E(x.nombre||'Producto')}</b><span style="font-size:13px;color:#6B5E55"><b style="color:#1F1A17">${M(x.precio)}</b>${v===null?'':v<=0?' · Sin stock':' · Stock '+v}</span></span></button>${tSw(vi,'pv:'+x.id,vi?'Ocultar':'Mostrar')}</div>`}).join('')||'<span style="font-size:14px;color:#6B5E55">Sin productos todavía.</span>')
            +`<div class="row"><button type="button" class="b" style="flex:1;height:44px" data-sa="pnew:${c?E(c.id):''}">Producto${c?' en '+E(c.nombre):''}</button>${c?`<button type="button" class="b" style="height:44px;padding:0 14px" data-sa="cm:${cid}" aria-label="Opciones de la categoría">⋯</button>`:''}</div>`
            +(c&&f.more[cid]?`<div class="chips" style="flex-wrap:wrap"><button type="button" data-sa="cv:${cid}">${on?'Ocultar en la tienda':'Mostrar en la tienda'}</button><button type="button" data-sa="cr:${cid}">Renombrar</button><button type="button" data-sa="cu:${cid}"${gi===0?' disabled':''}>Subir</button><button type="button" data-sa="cd:${cid}"${gi>=Cs.length-1?' disabled':''}>Bajar</button><button type="button" data-sa="cx:${cid}" style="color:#B42318">Eliminar</button></div>`:''):''}</div>`}).join('')||(q?vacio('No hay productos con ese nombre.'):'');
      return {body:h}},
    prod(f,n,h){const e=f.e,c=cxDsCfg(n),PF=cxDsPerfil(n),EX=(Array.isArray(c.extras)?c.extras:[]).filter(x=>x&&x.id&&x.n);
      h+=`<div class="cd"><div class="lbl">${e.id?'Editar producto':'Nuevo producto'}</div>
        <div class="fld"><label>Categoría</label><select data-in="cxp:cat" style="height:56px;border-radius:14px;border:1.5px solid #F1E4DA;padding:0 14px;font:inherit;font-size:16px;font-weight:700;width:100%;background:#fff"><option value="">Sin categoría</option>${f.C.map(x=>`<option value="${E(x.id)}"${String(e.cat)===String(x.id)?' selected':''}>${E(x.nombre)}</option>`).join('')}</select></div>
        <div class="fld"><label>Nombre del producto</label><input data-in="cxp:nombre" value="${E(e.nombre)}"></div>
        <div class="fld"><label>Descripción</label><textarea data-in="cxp:desc" maxlength="2000" style="min-height:96px;padding:14px 16px;border-radius:14px;border:1.5px solid #F1E4DA;font:inherit;font-size:16px;width:100%;box-sizing:border-box">${E(e.desc)}</textarea></div>
        <div class="lbl">Características (opcional)</div>${e.f.map((x,i)=>`<div class="row"><input data-in="cxpf:${i}:n" value="${E(x.n)}" placeholder="Ej. Porción" style="flex:1 1 0;min-width:0;height:48px;border-radius:12px;border:1.5px solid #F1E4DA;padding:0 12px;font:inherit;font-size:15px"><input data-in="cxpf:${i}:v" value="${E(x.v)}" placeholder="Ej. 2 personas" style="flex:1 1 0;min-width:0;height:48px;border-radius:12px;border:1.5px solid #F1E4DA;padding:0 12px;font:inherit;font-size:15px"><button type="button" class="ib" style="color:#B42318" data-sa="fq:${i}" aria-label="Quitar">${IC.trash}</button></div>`).join('')}<button type="button" class="b" style="height:44px" data-sa="f+">Agregar característica</button>
        <div class="g2"><div class="fld"><label>Precio (S/)</label><input inputmode="decimal" data-in="cxp:precio" value="${E(e.precio)}"></div><div class="fld"><label>Stock</label><input inputmode="numeric" data-in="cxp:stock" value="${E(e.stock)}"></div></div>
        <div class="lbl">Imagen</div><div class="row" style="align-items:center">${cxImg(e.prev||e.img,'Sin foto')}<label class="b soft" style="flex:1;height:46px;cursor:pointer">${e.prev||e.img?'Cambiar foto':'Subir foto'}<input type="file" accept="image/png,image/jpeg,image/webp" data-in="cxpi" style="display:none"></label>${e.prev||e.img?`<button type="button" class="b" style="height:46px;padding:0 12px;color:#B42318;border-color:#F4C7C3" data-sa="iqp">Quitar</button>`:''}</div>
        <div class="row" style="align-items:center"><span style="flex:1 1 0%"><b style="display:block">Visible en la tienda</b><span style="font-size:13px;color:#6B5E55">Necesita stock mayor a 0.</span></span>${tSw(e.vis,'pvis','Visible en la tienda')}</div></div>`;
      if(n.descartables_activo===true&&(PF.t==='comida'||EX.length)){const op=(t,kk,lab)=>{const pr=kk?cxNum(c[t+'_'+kk]):0,off=kk&&pr===null;return `<button type="button" class="${e.ds[t]===kk?'on':''}" data-sa="dsp:${t}:${kk}"${off?' disabled':''}>${lab}${kk?(off?' · sin precio':' · '+M(pr)):''}</button>`};
        h+=`<div class="cd"><div class="lbl">Descartables de este producto</div><span style="font-size:13px;color:#6B5E55">Se agregan solos cuando el cliente pide este producto y su precio se suma.</span>${PF.t==='comida'?['taper','vaso'].map(t=>`<b>${t==='taper'?'Taper':'Vaso'}</b><div class="seg" style="grid-template-columns:repeat(3,minmax(0,1fr))">${op(t,'','No lleva')}${op(t,'p','Pequeño')}${op(t,'g','Grande')}</div>`).join(''):''}${EX.map(x=>{const on=e.ds.ex.includes(String(x.id));return `<b>${E(x.n)}</b><div class="seg" style="grid-template-columns:1fr 1fr"><button type="button" class="${on?'':'on'}" data-sa="dsx:${E(x.id)}:0">No lleva</button><button type="button" class="${on?'on':''}" data-sa="dsx:${E(x.id)}:1">Lleva · ${M(cxNum(x.p)||0)}</button></div>`}).join('')}</div>`}
      if(e.id)h+=`<button type="button" class="b" style="height:48px;color:#B42318;border-color:#F4C7C3" data-sa="pdel">Eliminar producto</button>`;
      return {head:top3('Configurar negocios · '+(n.nombre||''),e.id?'Editar producto':'Nuevo producto'),body:h,foot:`<div class="row"><button type="button" class="b" style="flex:1;height:54px" data-sa="pback">Cancelar</button><button type="button" class="b o" style="flex:1.6;height:54px;font-size:16px" data-sa="psave">Guardar producto</button></div>`}},
    acceso(f,n,h){if(f.acc===undefined||f.accId!==n.id){f.acc=null;f.accId=n.id;D().rpc('admin_cuentas_negocio',{p_negocio:n.id}).then(r=>{f.acc=r.error?{err:r.error.message}:(r.data||[]);key='';pintar()},e=>{f.acc={err:String(e.message||e)};key='';pintar()})}
      const A=f.acc;if(A==null)return {body:h+'<div class="load">Cargando cuentas…</div>'};if(A.err)return {body:h+`<div class="err">No se pudieron cargar las cuentas: ${E(A.err)}</div>`};
      if(!A.length)return {body:h+vacio('Este negocio no tiene una cuenta vinculada. Créala desde «Crear negocio» › Cuentas de acceso.')};
      h+=A.map((c,i)=>`<div class="cd"><div class="row" style="align-items:center"><span style="flex:0 0 40px;width:40px;height:40px;border-radius:50%;background:#FDEBDF;color:#C4410C;display:flex;align-items:center;justify-content:center;font-weight:800">${E(String(c.email||'?').charAt(0).toUpperCase())}</span><span style="flex:1 1 0%;min-width:0"><b style="display:block;overflow-wrap:anywhere">${E(c.email||'Sin correo')}</b><span style="font-size:13px;color:#6B5E55">${c.ultimo_ingreso?'Último ingreso: '+E(new Date(c.ultimo_ingreso).toLocaleString('es-PE',{timeZone:'America/Lima',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})):'Aún no ha ingresado'}</span></span></div>
        <div class="fld"><label>Nueva contraseña</label><input type="${f.ver?'text':'password'}" autocomplete="new-password" data-in="cxa:${i}:a" data-sin-pegar value="${E((f.pw||{})[i+'a']||'')}" placeholder="Mínimo 6 caracteres"></div><div class="fld"><label>Repite la contraseña</label><input type="${f.ver?'text':'password'}" autocomplete="new-password" data-in="cxa:${i}:b" data-sin-pegar value="${E((f.pw||{})[i+'b']||'')}"></div>
        <div class="row"><button type="button" class="b" style="flex:1;height:46px" data-sa="ver">${f.ver?'Ocultar':'Mostrar'}</button><button type="button" class="b o" style="flex:1.6;height:46px" data-sa="pw:${i}">Cambiar contraseña</button></div></div>`).join('')+`<span style="font-size:13px;color:#6B5E55;margin:0 4px">El negocio deberá ingresar con la nueva contraseña. Compártela por un medio seguro.</span>`;
      return {body:h}},
    async a(x){const k='configurar negocios',f=SF[k],c=C2['s:'+k],L2=(c&&c.data)||[],n=L2.find(y=>String(y.id)===String(f.nid)),[op,...rs]=x.split(':'),arg=rs.join(':');
      if(!n)return;
      const upd=async(pl,msg)=>{const r=await D().from('negocios').update(pl).eq('id',n.id).select('*').maybeSingle();if(r.error)throw r.error;if(!r.data)throw new Error('Supabase no actualizó el negocio (revisa los permisos).');Object.assign(n,r.data);if(msg)ok(msg)};
      try{
      if(op==='tab'){f.tab=arg;f.e=null;return}
      if(op==='vis'){const q=n.visible_admin===false;if(!q&&!(await conf('¿Ocultar «'+(n.nombre||'este negocio')+'» de la tienda? El negocio no podrá volver a activarlo: le saldrá un aviso para que se ponga en contacto contigo.')))return;await upd({visible_admin:q},q?'Negocio visible en la tienda':'Negocio oculto en la tienda');return}
      /* --- acceso --- */
      if(op==='ver'){f.ver=!f.ver;return}
      if(op==='pw'){const i=+arg,a=String((f.pw||{})[i+'a']||''),b=String((f.pw||{})[i+'b']||''),cu=(f.acc||[])[i];if(!cu)return;if(a.length<6){mal('La contraseña debe tener al menos 6 caracteres.');return}if(a!==b){mal('Las contraseñas no coinciden.');return}
        const r=await D().rpc('admin_cambiar_clave_negocio',{p_usuario:cu.usuario_id,p_clave:a});if(r.error)throw r.error;f.pw={};ok('Contraseña cambiada');return}
      /* --- perfil --- */
      const d=f.d;
      if(op==='mapa'){const el2=window.pdMapa&&pdMapa.elegir;if(!el2)return;const c0=d.lat!==''&&Number.isFinite(Number(d.lat))?{lat:Number(d.lat),lng:Number(d.lng)}:null;const r=await el2({titulo:'Ubicación del local',centro:c0});if(!r)return;d.lat=Number(r.lat).toFixed(6);d.lng=Number(r.lng).toFixed(6);d.maps='https://maps.google.com/?q='+d.lat+','+d.lng;const lin=[r.linea,r.sub].filter(Boolean).join(', ');if(!String(d.dir).trim()&&lin)d.dir=lin;return}
      if(op==='pub'){d.pub=!d.pub;return}
      if(op==='t'){d.tiempo=arg;d.ttoc=true;return}
      if(op==='dia'){d.H[arg].on=!d.H[arg].on;return}
      if(op==='ht2'){const y=d.H[arg];y.t2=true;if(y.c>=y.a2){y.c='15:00';if(y.a>='15:00')y.a='12:00'}return}
      if(op==='hx2'){d.H[arg].t2=false;return}
      if(op==='hcopy'){const p=CX_DIAS.map(([k2])=>d.H[k2]).find(y=>y.on);if(!p){mal('Primero abre al menos un día.');return}CX_DIAS.forEach(([k2])=>{if(d.H[k2].on){d.H[k2].a=p.a;d.H[k2].c=p.c;d.H[k2].t2=p.t2;d.H[k2].a2=p.a2;d.H[k2].c2=p.c2}});return}
      if(op==='hall'){CX_DIAS.forEach(([k2])=>d.H[k2].on=true);return}
      if(op==='pz'){const m=Number(arg)||0;const base=n.pausado_hasta&&new Date(n.pausado_hasta).getTime()>Date.now()?new Date(n.pausado_hasta).getTime():Date.now();await upd({pausado_hasta:m?new Date(base+m*60000).toISOString():null},m?'Pedidos en pausa':'El negocio ya recibe pedidos');return}
      if(op==='copiar'){const u='https://pidemas.pe/?negocio='+encodeURIComponent(n.id);try{await navigator.clipboard.writeText(u);ok('Enlace copiado')}catch(_){mal(u)}return}
      if(op==='iq'){const col={logo:'logo_url',portada:'imagen_url',yape:'yape_qr_url'}[arg];if(!(await conf('¿Quitar '+(arg==='logo'?'el logo':arg==='portada'?'la portada':'el QR de Yape')+' del negocio?')))return;await upd({[col]:null},'Imagen quitada');return}
      if(op==='guardar'){const nombre=sedeJun(d.nombre,d.sede);if(!nombre){mal('El nombre es obligatorio.');return}
        const la=d.lat===''?null:Number(d.lat),ln=d.lng===''?null:Number(d.lng);if((d.lat!==''&&!Number.isFinite(la))||(d.lng!==''&&!Number.isFinite(ln))){mal('La ubicación no es válida.');return}
        const yn=String(d.ynum).replace(/\D/g,'');if(yn&&yn.length!==9){mal('El número de Yape debe tener 9 dígitos.');return}
        const parts=[];for(const [k2,,nm] of CX_DIAS){const y=d.H[k2];if(!y.on)continue;if(!y.a||!y.c){mal(nm+': completa la hora de apertura y cierre.');return}if(y.a===y.c){mal(nm+': la apertura y el cierre no pueden ser iguales.');return}
          let t=k2+'='+y.a+'-'+y.c;if(y.t2){if(!y.a2||!y.c2){mal(nm+': completa el segundo turno.');return}if(!(y.a<y.c&&y.c<y.a2&&y.a2<y.c2)){mal(nm+': el segundo turno debe empezar después de que termine el primero.');return}t+=','+y.a2+'-'+y.c2}parts.push(t)}
        const pl={nombre,categoria_negocio:d.cat||null,descripcion:String(d.desc).trim()||null,telefono:String(d.tel).trim()||null,ruc:String(d.ruc).trim()||null,direccion:String(d.dir).trim()||null,google_maps_url:String(d.maps).trim()||null,latitud:la,longitud:ln,ubicacion_publica:!!d.pub,yape_numero:yn||null,yape_titular:String(d.ytit).trim()||null,horario:parts.join('|')||null};
        if(d.ttoc)pl.tiempo_estimado=d.tiempo||null;
        await upd(pl,'Cambios guardados');f.d=null;return}
      /* --- productos --- */
      if(op==='co'){f.open[arg]=!f.open[arg];return}
      if(op==='cm'){f.more[arg]=!f.more[arg];return}
      if(op==='cnew'){f.cNew=!f.cNew;f.cn='';return}
      if(op==='ds'){f.dsOpen=!f.dsOpen;f.dx=null;f.dp=null;return}
      if(op==='dson'){await upd({descartables_activo:n.descartables_activo!==true},'Cambios guardados');return}
      if(op==='dx+'){f.dx.push({id:'',n:'',p:''});return}
      if(op==='dxq'){f.dx.splice(+arg,1);return}
      if(op==='dsg'){const PF=cxDsPerfil(n),cfg={};for(const [k2,nm] of CX_DSK){if(!PF.k.includes(k2)){cfg[k2]=null;continue}const v=cxNum(f.dp[k2]);if(Number.isNaN(v)||v>50){mal(nm+': escribe un precio válido, por ejemplo 0.50.');return}cfg[k2]=v}
        const ex=[];for(const y of f.dx){const nm=String(y.n||'').trim(),v=cxNum(y.p);if(!nm&&v==null)continue;if(!nm){mal('Escribe el nombre de cada descartable.');return}if(v==null||Number.isNaN(v)||v>50){mal(nm+': escribe un precio válido, por ejemplo 0.50.');return}ex.push({id:y.id||('x'+Date.now().toString(36)+Math.random().toString(36).slice(2,5)),n:nm,p:v})}
        cfg.extras=ex;const ids=new Set(ex.map(y=>y.id));let pr=cxDsCfg(n).prod;if(pr&&typeof pr==='object'){pr=JSON.parse(JSON.stringify(pr));for(const pk in pr){const m=pr[pk];if(Array.isArray(m.ex)){m.ex=m.ex.filter(i=>ids.has(String(i)));if(!m.ex.length)delete m.ex}if(PF.t!=='comida'){delete m.taper;delete m.vaso}if(!Object.keys(m).length)delete pr[pk]}cfg.prod=pr}
        await upd({descartables_config:cfg},'Precios guardados');f.dx=null;f.dp=null;return}
      const cat=(f.C||[]).find(y=>String(y.id)===String(arg));
      if(op==='csave'){const nm=String(f.cn||'').trim();if(!nm){mal('Escribe el nombre de la categoría.');return}let r=await D().from('categorias_negocio').insert({negocio_id:n.id,nombre:nm,orden:f.C.length+1});if(r.error&&/orden/i.test(r.error.message||''))r=await D().from('categorias_negocio').insert({negocio_id:n.id,nombre:nm});if(r.error)throw r.error;f.cNew=false;ok('Categoría agregada');return cxCargarCarta(f,n)}
      if(op==='cv'&&cat){const r=await D().from('categorias_negocio').update({activo:cat.activo===false}).eq('id',cat.id).eq('negocio_id',n.id);if(r.error)throw r.error;cat.activo=cat.activo===false;return}
      if(op==='cr'&&cat){const nm=await pedirL('Nuevo nombre de la categoría:',cat.nombre||'');if(!nm||!String(nm).trim())return;const r=await D().from('categorias_negocio').update({nombre:String(nm).trim()}).eq('id',cat.id).eq('negocio_id',n.id);if(r.error)throw r.error;cat.nombre=String(nm).trim();return}
      if((op==='cu'||op==='cd')&&cat){const l=f.C.slice(),i=l.indexOf(cat),j=i+(op==='cu'?-1:1);if(j<0||j>=l.length)return;[l[i],l[j]]=[l[j],l[i]];for(let q=0;q<l.length;q++){if(Number(l[q].orden)===q+1)continue;const r=await D().from('categorias_negocio').update({orden:q+1}).eq('id',l[q].id).eq('negocio_id',n.id);if(r.error)throw r.error;l[q].orden=q+1}f.C=l;return}
      if(op==='cx'&&cat){const cnt=f.P.filter(y=>String(y.categoria_id)===String(cat.id)).length;const ch=window.pdElegirBorrarCat?await window.pdElegirBorrarCat(cat.nombre||'',cnt):((await conf('¿Eliminar la categoría «'+(cat.nombre||'')+'»?'))?'solo':null);if(!ch)return;
        const u=ch==='todo'?await D().from('productos_negocio').delete().eq('categoria_id',cat.id).eq('negocio_id',n.id):await D().from('productos_negocio').update({categoria_id:null}).eq('categoria_id',cat.id).eq('negocio_id',n.id);if(u.error)throw u.error;
        const r=await D().from('categorias_negocio').delete().eq('id',cat.id).eq('negocio_id',n.id);if(r.error)throw r.error;ok('Categoría eliminada');return cxCargarCarta(f,n)}
      const pr=(f.P||[]).find(y=>String(y.id)===String(arg));
      if(op==='pv'&&pr){const vis=pr.disponible!==false;if(!vis&&Number(pr.stock||0)<=0){mal('Para mostrar este producto primero agrégale stock mayor a 0 (tócalo para editar).');return}const r=await D().from('productos_negocio').update({disponible:!vis}).eq('id',pr.id).eq('negocio_id',n.id);if(r.error)throw r.error;pr.disponible=!vis;return}
      if(op==='pnew'||op==='pe'){const y=op==='pe'?pr:{categoria_id:arg||null};if(!y)return;const sp=cxSplit(y.descripcion),pc=(y.id&&cxDsCfg(n).prod&&cxDsCfg(n).prod[String(y.id)])||{};
        f.e={id:y.id||null,cat:y.categoria_id||'',nombre:y.nombre||'',desc:sp.d,f:sp.f,precio:y.precio??'',stock:y.stock??'',img:y.imagen_url||'',prev:'',file:null,quitar:false,vis:y.id?y.disponible!==false:true,ds:{taper:pc.taper==='p'||pc.taper==='g'?pc.taper:'',vaso:pc.vaso==='p'||pc.vaso==='g'?pc.vaso:'',ex:(Array.isArray(pc.ex)?pc.ex:[]).map(String)}};return}
      const e=f.e;
      if(op==='pback'){f.e=null;return}
      if(!e)return;
      if(op==='f+'){e.f.push({n:'',v:''});return}
      if(op==='fq'){e.f.splice(+arg,1);return}
      if(op==='pvis'){e.vis=!e.vis;return}
      if(op==='iqp'){e.prev='';e.file=null;if(e.img){e.quitar=true;e.img=''}return}
      if(op==='dsp'){const [t,kk]=arg.split(':');e.ds[t]=kk||'';return}
      if(op==='dsx'){const [id,v]=arg.split(':');const i=e.ds.ex.indexOf(id);if(v==='1'){if(i<0)e.ds.ex.push(id)}else if(i>=0)e.ds.ex.splice(i,1);return}
      if(op==='pdel'){if(!(await conf('¿Eliminar «'+(e.nombre||'')+'» de la carta?')))return;const r=await D().from('productos_negocio').delete().eq('id',e.id).eq('negocio_id',n.id);if(r.error)throw r.error;const old=(f.P.find(y=>String(y.id)===String(e.id))||{}).imagen_url;cxQuitarImg(old);f.e=null;ok('Producto eliminado');return cxCargarCarta(f,n)}
      if(op==='psave'){const nombre=String(e.nombre).trim(),precio=cxNum(e.precio),stk=Math.max(0,Math.floor(Number(e.stock||0)));if(!nombre||precio==null||Number.isNaN(precio)){mal('Completa el nombre y el precio.');return}
        const pl={categoria_id:e.cat||null,nombre,descripcion:cxCompose(e.desc,e.f),precio,stock:stk,disponible:stk>0&&e.vis};if(e.quitar)pl.imagen_url=null;
        let id=e.id;if(id){const r=await D().from('productos_negocio').update(pl).eq('id',id).eq('negocio_id',n.id);if(r.error)throw r.error}else{const r=await D().from('productos_negocio').insert(Object.assign({negocio_id:n.id,orden:f.P.length+1},pl)).select('id').single();if(r.error)throw r.error;id=r.data.id}
        let av='';
        if(e.file){try{const ext=/png/.test(e.file.type)?'png':/webp/.test(e.file.type)?'webp':'jpg',path='productos/'+id+'.'+ext,b=D().storage.from('negocios');const up=await b.upload(path,e.file,{upsert:true,contentType:e.file.type||'image/jpeg'});if(up.error)throw up.error;const u=b.getPublicUrl(path).data.publicUrl+'?v='+Date.now();const r=await D().from('productos_negocio').update({imagen_url:u}).eq('id',id).eq('negocio_id',n.id);if(r.error)throw r.error}catch(err){av=' (la foto no se pudo subir: '+(err.message||err)+')'}}
        else if(e.quitar){const old=(f.P.find(y=>String(y.id)===String(e.id))||{}).imagen_url;cxQuitarImg(old)}
        const cfg=Object.assign({},cxDsCfg(n)),prod=Object.assign({},cfg.prod||{}),nu={};if(e.ds.taper)nu.taper=e.ds.taper;if(e.ds.vaso)nu.vaso=e.ds.vaso;if(e.ds.ex.length)nu.ex=e.ds.ex.slice();
        if(JSON.stringify(nu)!==JSON.stringify(prod[String(id)]||{})){if(Object.keys(nu).length)prod[String(id)]=nu;else delete prod[String(id)];cfg.prod=prod;try{await upd({descartables_config:cfg})}catch(err){av+=' (los descartables no se guardaron)'}}
        f.e=null;(av?mal:ok)('Producto guardado'+av);return cxCargarCarta(f,n)}

      }catch(err){mal('No se pudo completar: '+(err&&err.message||err))}}};
  async function cxCargarCarta(f,n){f.cargando=true;try{const [c,p]=await Promise.all([D().from('categorias_negocio').select('*').eq('negocio_id',n.id),D().from('productos_negocio').select('*').eq('negocio_id',n.id).order('orden',{ascending:true})]);if(c.error)throw c.error;if(p.error)throw p.error;
    f.C=(c.data||[]).sort((a,b)=>(Number(a.orden)||0)-(Number(b.orden)||0)||String(a.nombre||'').localeCompare(String(b.nombre||'')));f.P=p.data||[];f.pId=n.id}catch(e){mal('No se pudo cargar la carta: '+(e.message||e));f.P=[];f.C=[];f.pId=n.id}f.cargando=false;key='';pintar()}
  function cxQuitarImg(u){const m='/storage/v1/object/public/negocios/',s=String(u||''),i=s.indexOf(m);if(i<0)return;try{D().storage.from('negocios').remove([decodeURIComponent(s.slice(i+m.length).split('?')[0])]).catch(()=>{})}catch(_){}}
  async function cxSubirNeg(f,kind,fl){const k='configurar negocios',c=C2['s:'+k],n=(c.data||[]).find(y=>String(y.id)===String(f.nid));if(!n)return;
    try{const ext=/png/.test(fl.type)?'png':/webp/.test(fl.type)?'webp':'jpg',st=D().storage.from('restaurantes');let path,col;
      if(kind==='yape'){path='yape/'+n.id+'/qr-'+Date.now()+'.'+ext;col='yape_qr_url'}else{path=n.id+'/'+kind+'.'+ext;col=kind==='logo'?'logo_url':'imagen_url'}
      const up=await st.upload(path,fl,{upsert:true,contentType:fl.type,cacheControl:kind==='yape'?'31536000':undefined});if(up.error)throw up.error;
      const u=st.getPublicUrl(path).data.publicUrl+(kind==='yape'?'':'?v='+Date.now());const r=await D().from('negocios').update({[col]:u}).eq('id',n.id).select('*').maybeSingle();if(r.error)throw r.error;if(r.data)Object.assign(n,r.data);ok('Imagen guardada')}
    catch(e){mal('No se pudo subir la imagen: '+(e.message||e))}key='';pintar()}

  /* --- Horario de Pidemás --- */
  const ORD=['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];
  const h12=t=>{const m=String(t||'').match(/^(\d{1,2}):(\d{2})/);if(!m)return t||'';const h=+m[1];return (h%12||12)+(m[2]!=='00'?':'+m[2]:'')+' '+(h>=12?'p. m.':'a. m.')};
  SEC['horario']={g:'Más',t:'Horario de Pidemás',
    load:async()=>{try{return await pdHorario.cargar()}catch(e){return pdHorario.config}},
    v(){const k='horario',c=datos(k,this.load),f=SF[k];if(!c.data)return {body:cargando(c)};if(!f.C)f.C=JSON.parse(JSON.stringify(c.data));const C=f.C,NOM=(window.pdHorario&&pdHorario.NOM)||{};
      let h=U.note('El horario en que la tienda recibe pedidos. Fuera de él, los clientes ven la tienda cerrada.');
      h+=`<div class="cd">${ORD.map(d=>{const x=C.dias[d]||{};const on=x.activo!==false;return `<div class="swr" style="display:flex;align-items:center;gap:12px"><span style="flex:1 1 0%"><b style="display:block;font-size:15px">${E(NOM[d]||d)}</b><span style="font-size:13px;color:#6B5E55">${on?'Pedidos de '+h12(x.abre)+' a '+h12(x.ultimo):'No atendemos'}</span></span><button type="button" role="switch" aria-checked="${on}" aria-label="Atiende el ${E(NOM[d]||d)}" data-sa="dia:${d}" style="position:relative;flex:0 0 52px;width:52px;height:32px;border-radius:999px;border:0;background:${on?'#C4410C':'#EADFD6'};cursor:pointer"><span style="position:absolute;top:3px;left:${on?23:3}px;width:26px;height:26px;border-radius:50%;background:#FFFFFF;box-shadow:0 1px 3px rgba(31,26,23,.25)"></span></button></div>${on?`<div class="g2"><div class="fld"><label>Abre</label><input type="time" value="${E(x.abre)}" data-in="hr:${d}:abre"></div><div class="fld"><label>Último pedido</label><input type="time" value="${E(x.ultimo)}" data-in="hr:${d}:ultimo"></div></div>`:''}`}).join('<div style="height:1px;background:#F1E4DA"></div>')}</div>`;
      h+=`<button type="button" class="b" data-sa="copiar">Copiar el lunes a los demás días</button>`;
      h+=`<div class="cd"><div class="lbl">Días cerrados especiales</div><span style="font-size:13px;color:#6B5E55">Feriados u otros días en que Pidemás no atiende.</span>${(C.cerrados||[]).slice().sort().map(x=>`<div class="mv"><span class="tx"><b>${E(new Date(x+'T12:00:00').toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'long',year:'numeric'}))}</b></span><button type="button" class="ib" style="width:36px;height:36px;flex:0 0 36px;color:#B42318" data-sa="fdel:${E(x)}" aria-label="Quitar">${IC.x}</button></div>`).join('')}<div class="g2"><div class="fld"><input type="date" value="${E(f.fecha||'')}" data-in="sf:fecha" aria-label="Fecha"></div><button type="button" class="b" style="height:54px" data-sa="fadd">${IC.plus}Agregar</button></div></div>`;
      h+=`<div class="cd"><div class="lbl">Aviso de último pedido</div><div class="seg" style="grid-template-columns:repeat(4,minmax(0,1fr))">${[15,30,45,60].map(v=>`<button type="button" class="${Number(C.aviso_min)===v?'on':''}" data-sa="av:${v}">${v} min</button>`).join('')}</div><span style="font-size:13px;color:#6B5E55">La tienda muestra «Último pedido» este tiempo antes del cierre.</span></div>`;
      if(f.msg)h+=`<div class="err">${E(f.msg)}</div>`;
      return {body:h,foot:`<button type="button" class="b o" style="height:54px;font-size:16px" data-sa="guardar">Guardar horario</button>`}},
    async a(x){const f=SF['horario'],C=f.C,p=x.split(':');f.msg='';
      if(p[0]==='dia'){const d=C.dias[p[1]];d.activo=d.activo===false;return}
      if(p[0]==='copiar'){const l=C.dias.lunes;ORD.forEach(k=>{if(k!=='lunes'&&C.dias[k].activo!==false){C.dias[k].abre=l.abre;C.dias[k].ultimo=l.ultimo}});return}
      if(p[0]==='fadd'){if(!f.fecha)return;C.cerrados=C.cerrados||[];if(!C.cerrados.includes(f.fecha))C.cerrados.push(f.fecha);f.fecha='';return}
      if(p[0]==='fdel'){C.cerrados=(C.cerrados||[]).filter(y=>y!==p.slice(1).join(':'));return}
      if(p[0]==='av'){C.aviso_min=+p[1];return}
      if(p[0]==='guardar'){const m=ORD.find(k=>{const d=C.dias[k];return d.activo!==false&&!(d.abre&&d.ultimo&&d.ultimo>d.abre)});if(m){f.msg='Revisa el '+((pdHorario.NOM||{})[m]||m)+': el último pedido debe ser después de la apertura.';return}
        try{await pdHorario.guardar(C);ok('Horario guardado. La tienda ya lo usa.');f.C=null;recargar('horario')}catch(e){f.msg='No se pudo guardar: '+(e.message||e)}}}};

  /* --- Avisos y actividad: separados en Pedidos, Motorizado y Negocio (mismo diseño que el panel del negocio y del motorizado) --- */
  SEC['__avisos']={g:'Avisos',t:'Avisos y actividad',rf:1,
    load:async()=>{try{window.pdaAvisos&&await window.pdaAvisos.cargarCaja()}catch(_){}return {t:Date.now()}},
    evs(){const A=window.pdaAvisos;let ev=[];try{ev=(A&&A.eventos()||[]).slice()}catch(_){}
      const lim=Date.now()-48*3600e3;
      /* Tienda = pedidos de negocios que hace el cliente · Servicios = recojos, compras y encomiendas que crea el admin */
      ev=ev.map(x=>{let cat='motorizado';if(x.k==='ped'&&/^(Nuev|Pedido cancelado)/.test(String(x.tit||''))){const o=L().find(y=>String(y.id)===String(x.id)),t=String(x.tit||'');cat=o?(o.negocio_id?'pedidos':'servicios'):(/^Nuevo pedido de tienda/.test(t)?'pedidos':/^Nuev/.test(t)?'servicios':'pedidos')}return Object.assign({},x,{cat})});
      L().forEach(o=>{if(!o.negocio_id)return;const n=NEG(o.negocio_id).nombre||'El negocio',c=String(o.nombre_cliente||'').trim(),sub=ref(o.id)+(c?' · '+c:'');
        const add=(t,tit,s2,ic)=>{if(t>lim)ev.push({cat:'negocio',k:'neg',t,tit,sub:s2,id:o.id,icN:ic})};
        add(T(o.negocio_aceptado_en),n+' aceptó el pedido',sub,'store');
        if(est(o)==='rechazado')add(T(o.rechazado_en||o.actualizado_en||o.creado_en),n+' rechazó el pedido',(o.motivo_cancelacion?'Motivo: '+o.motivo_cancelacion+' · ':'')+sub,'x');
        add(T(o.negocio_pagado_en),'Le pagaste a '+n,'Valor de los productos · '+sub,'cash');
        add(T(o.negocio_cobrado_en),n+' pagó el delivery',M(o.costo_delivery)+' · '+sub,'cash')});
      return ev.sort((a,b)=>b.t-a.t).slice(0,120)},
    v(){const k='__avisos',c=datos(k,this.load),f=SF[k];f.c=f.c||'todos';if(!c.data)return {body:cargando(c)};
      const ev=this.evs(),vis=f.vis||0;const n=x=>x==='todos'?ev.length:ev.filter(e=>e.cat===x).length;
      const CH=[['todos','Todos'],['pedidos','Tienda'],['servicios','Servicios'],['motorizado','Motorizado'],['negocio','Negocio']];
      let h=`<div class="chips">${CH.map(x=>`<button type="button" data-sa="c:${x[0]}" class="${f.c===x[0]?'on':''}">${x[1]}${n(x[0])?' · '+n(x[0]):''}</button>`).join('')}</div>`;
      const Lv=f.c==='todos'?ev:ev.filter(e=>e.cat===f.c);
      /* mismos íconos del menú inferior: Pedidos, Motorizados y Negocios (caja y sueldos son de Motorizados) */
      const icono=e=>e.cat==='negocio'?IC.nvNeg:e.cat==='pedidos'?IC.nvPed:IC.nvMoto;
      h+=Lv.length?Lv.map((e,i)=>`<button type="button" class="av2" data-sa="ir:${i}"><span class="ic"${e.k==='ocu'&&e.abierta?' style="background:#FDE8E8;color:#B42318"':''}>${icono(e)}</span><span class="tx"><b>${E((window.pdTxt||String)(e.tit))}</b><span>${E((window.pdTxt||String)(e.sub||''))}</span><small>${E(fecha(e.t))}${e.amt?' · '+E(e.amt):''}</small>${e.k==='ocu'&&e.abierta?`<span style="margin-top:8px"><span class="b" style="display:inline-flex;align-items:center;height:36px;padding:0 12px;font-size:14px" data-sa="res:${E(e.id)}">Marcar como resuelto</span></span>`:''}</span>${e.t>vis?'<span class="pt"></span>':''}</button>`).join(''):'<div class="vac">No hay avisos de las últimas 48 horas.</div>';
      f.L=Lv;return {body:h}},
    async a(x){const f=SF['__avisos'];
      if(x.startsWith('c:')){f.c=x.slice(2);return}
      if(x.startsWith('res:')){const id=x.slice(4);const q=await D().from('pedidos').update({incidencia_resuelta:true}).eq('id',id);if(q.error){mal('No se pudo guardar: '+q.error.message);return}const o=L().find(y=>String(y.id)===String(id));if(o)o.incidencia_resuelta=true;ok('Reporte resuelto');return}
      if(x.startsWith('ir:')){const e=(f.L||[])[+x.slice(3)];if(!e)return;
        if(e.sueldo){try{window.pdAppAdm.ir('sueldo')}catch(_){}return}
        if(e.caja&&!e.id){try{window.pdAppAdm.ir('caja')}catch(_){}return}
        if(e.id&&window.pdAbrirPedidoAdmin)window.pdAbrirPedidoAdmin(e.id)}}};

  /* --- Mi perfil --- */
  SEC['__perfil']={g:'Mi cuenta',t:'Mi perfil',
    load:async()=>{const {data:{session}}=await D().auth.getSession();const uid=session&&session.user&&session.user.id;let p={};if(uid){const r=await D().from('perfiles').select('*').eq('id',uid).maybeSingle();p=r.data||{}}const cfg=await leerCfg();return {uid,email:session&&session.user&&session.user.email,p,wa:(cfg&&cfg.whatsapp_admin)||'986233533'}},
    v(){const k='__perfil',c=datos(k,this.load),f=SF[k];if(f.vista==='clave')return this.clave();if(!c.data)return {body:cargando(c)};const d=c.data;if(f.nom==null){f.nom=d.p.nombre_completo||d.p.nombre||'';f.wa=d.wa;f.p1='';f.p2=''}
      const foto=f.prev||d.p.foto_url||window.__pdAdminFoto||'';
      const CAM='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';
      const CAN='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
      let h=`<div class="ph"><label class="avaW" aria-label="Cambiar mi foto"><span class="ava"${foto?` style="background-image:url('${E(foto)}')"`:''}>${foto?'':E(String(f.nom||'A').trim().charAt(0).toUpperCase()||'A')}</span><span class="avaC">${f.subiendo?'…':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>'}</span><input type="file" accept="image/png,image/jpeg,image/webp" data-in="pfoto" style="display:none"${f.subiendo?' disabled':''}></label><div style="flex:1 1 0%;min-width:0"><b style="display:block;font-size:20px;overflow-wrap:anywhere">${E(f.nom||'Administrador')}</b><span class="pl g" style="margin-top:4px">Administrador</span></div></div>`;
      if(foto&&!f.prev)h+=`<button type="button" class="b" style="height:40px;color:#B42318;border-color:#F4C7C3" data-sa="foto:quitar">Quitar foto</button>`;
      h+=`<div class="cd"><div class="lbl">Tus datos</div><div class="fld"><label for="pfN">Tu nombre</label><input id="pfN" maxlength="40" value="${E(f.nom)}" data-in="sf:nom"></div><div class="fld"><label for="pfW">WhatsApp de administración</label><input id="pfW" type="tel" inputmode="numeric" maxlength="15" value="${E(f.wa)}" data-in="sf:wa"></div><span style="font-size:13px;color:#6B5E55">A este número los motorizados envían la guía y clave de las encomiendas y los avisos de problemas.</span><div class="fld"><label>Correo</label><input value="${E(d.email||'')}" disabled></div></div>`;
      if(f.msg)h+=`<div class="err">${E(f.msg)}</div>`;
      h+=`<button type="button" class="b o" data-sa="guardar">Guardar cambios</button>`;
      h+=`<button type="button" class="tl" data-sa="clave:abrir"><span class="ic">${CAN}</span><span class="tx"><b>Contraseña</b><span>Cambia la clave de tu panel</span></span>${IC.chev}</button>`;
      if(window.PdAvisos)h+=window.PdAvisos.card('data-sa','Suena cuando entra un pedido nuevo.');
      h+=`<button type="button" class="b" style="height:54px;font-size:16px;color:#B42318;border-color:#F4C7C3;background:#FFFFFF" data-a="salir">${IC.logout}Cerrar sesión</button>`;
      return {body:h}},
    /* Cambiar contraseña: página propia, igual que en el panel del negocio */
    clave(){const f=SF['__perfil'],t=f.ver?'text':'password';
      const ojo='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
      const cmp=(id,l,c,ac)=>`<div class="fld"><label for="${id}">${l}</label><input id="${id}" type="${t}" autocomplete="${ac}" maxlength="72" value="${E(f[c]||'')}" data-in="sf:${c}"></div>`;
      let h=`<div class="cd">${cmp('pfP1','Nueva contraseña','p1','new-password')}${cmp('pfP2','Repite la nueva contraseña','p2','new-password')}<button type="button" class="b" style="height:42px" data-sa="clave:ver">${ojo}${f.ver?'Ocultar contraseñas':'Mostrar contraseñas'}</button><span style="font-size:13px;color:#6B5E55">Usa al menos 6 caracteres. Al cambiarla, entrarás con la nueva clave en todos tus teléfonos.</span></div>`;
      if(f.msg)h+=`<div class="err">${E(f.msg)}</div>`;
      return {head:top3('Seguridad','Cambiar contraseña').replace('data-a="volver"','data-sa="clave:salir"'),body:h,foot:`<button type="button" class="b o" style="height:54px;font-size:16px" data-sa="clave:guardar">Guardar contraseña</button>`}},
    async a(x){const k='__perfil',f=SF[k],d=C2['s:'+k]&&C2['s:'+k].data;f.msg='';
      if(x.startsWith('avs:')){if(window.PdAvisos)await window.PdAvisos.accion(x.slice(4));return}
      if(x==='foto:quitar'){if(!(await conf('¿Quitar tu foto de perfil?')))return;const uid=d&&d.uid;if(!uid)return;
        const q=await D().from('perfiles').update({foto_url:null}).eq('id',uid).select('id').maybeSingle();if(q.error){f.msg='No se pudo quitar la foto: '+q.error.message;return}
        if(d.p)d.p.foto_url=null;f.prev='';window.__pdAdminFoto='';try{localStorage.setItem('pdAdminFoto','')}catch(_){}ok('Foto eliminada');return}
      if(x==='clave:abrir'){f.vista='clave';f.p0='';f.p1='';f.p2='';f.ver=false;try{history.pushState({pdApp:1,pdClave:1},'')}catch(_){}return}
      if(x==='clave:salir'){f.vista=null;f.p0='';f.p1='';f.p2='';if(history.state&&history.state.pdClave){ignorarPop=true;history.back()}return}
      if(x==='clave:ver'){f.ver=!f.ver;return}
      if(x==='clave:guardar'){const n=String(f.p1||''),r=String(f.p2||'');
        if(n.length<6){f.msg='La nueva contraseña debe tener al menos 6 caracteres.';return}if(n!==r){f.msg='Las contraseñas no coinciden.';return}
        try{await accInvocar('cambiar-mi-password',{password:n})}catch(e){f.msg=e.message||String(e);return}
        f.p0='';f.p1='';f.p2='';f.vista=null;if(history.state&&history.state.pdClave){ignorarPop=true;history.back()}ok('Contraseña actualizada');return}
      if(x==='guardar'){const n=String(f.nom||'').trim();if(!n){f.msg='Escribe tu nombre.';return}const w=String(f.wa||'').replace(/\D/g,'');if(w&&w.length!==9&&w.length!==11){f.msg='El WhatsApp de administración debe tener 9 dígitos.';return}
        if(d.uid){const q=await D().from('perfiles').update({nombre_completo:n}).eq('id',d.uid).select('id').maybeSingle();if(q.error){f.msg='No se pudo guardar: '+q.error.message;return}}
        try{localStorage.setItem('pd_admin_name',n)}catch(_){}window.__pdAdminNombre=n;
        const cfg=await leerCfg();if(cfg&&(cfg.whatsapp_admin||'')!==w){cfg.whatsapp_admin=w;cfg.actualizado_en=new Date().toISOString();try{await guardarCfg(cfg)}catch(e){f.msg='Se guardó tu nombre, pero no el WhatsApp: '+(e.message||e);return}}
        ok('Cambios guardados');recargar(k);f.nom=null;return}
      if(x==='clave'){if(String(f.p1).length<6){f.msg='La contraseña debe tener al menos 6 caracteres.';return}if(f.p1!==f.p2){f.msg='Las dos contraseñas no coinciden.';return}
        try{await accInvocar('cambiar-mi-password',{password:f.p1})}catch(e){f.msg=e.message||String(e);return}f.p1='';f.p2='';ok('Contraseña actualizada')}}};

  /* --- Planilla de sueldos --- */
  SEC['planilla de sueldos']={g:'Control de caja y sueldos',t:'Planilla de sueldos',rf:1,
    load:async()=>{const Sx=window.PdSueldo,key=SF['planilla de sueldos'].k;const [mr,sr,cr]=await Promise.all([D().from('motorizados').select('*').order('nombre_completo'),D().from('control_sueldos').select('*'),D().from('quincenas_cerradas').select('*').eq('periodo',key)]);if(mr.error)throw mr.error;if(sr.error)throw sr.error;
      const by=new Map();(sr.data||[]).forEach(r=>{const k=String(r.motorizado_id);if(!by.has(k))by.set(k,[]);by.get(k).push(r)});
      const F=(mr.data||[]).map(m=>{let res;try{res=Sx.calc(m,by.get(String(m.id))||[])}catch(e){return null}if(!res||!res.ok)return null;const P=res.periods.find(p=>p.key===key);if(!P||(P.earned<0.005&&P.paid<0.005))return null;
        const gas=res.hourly?r2(P.gasTotal):r2(P.gasDays*Sx.GAS),q=(cr.data||[]).find(c=>String(c.motorizado_id)===String(m.id));return {n:m.nombre_completo||'Motorizado',sueldo:r2(P.earned-gas),gas,ganado:r2(P.earned),desc:r2(P.desc),pag:r2(P.paid),pend:r2(Math.max(0,P.balance)),q}}).filter(Boolean);return {key,F}},
    v(){const k='planilla de sueldos',f=SF[k],Sx=window.PdSueldo;if(!Sx)return {body:'<div class="load">Cargando…</div>'};const hoy=Sx.todayIso(),cur=Sx.periodOf(hoy),prev=Sx.periodOf(Sx.iso(new Date(Sx.parse(cur.start).getTime()-864e5))),prev2=Sx.periodOf(Sx.iso(new Date(Sx.parse(prev.start).getTime()-864e5)));
      f.k=f.k||cur.key;const c=datos(k,this.load);
      let h=`<div class="opts">${[cur,prev,prev2].map(o=>`<button type="button" class="opt${o.key===f.k?' on':''}" data-sa="k:${E(o.key)}"><b>${E(o.label)}</b></button>`).join('')}</div>`;
      if(!c.data||c.data.key!==f.k)return {body:h+cargando(c)};const F=c.data.F,T=x=>r2(F.reduce((s,y)=>s+y[x],0)),lab=([cur,prev,prev2].find(o=>o.key===f.k)||cur).label;
      h+=`<div class="amt"><div class="k">Total ganado</div><div class="n">${M(T('ganado'))}</div><div class="pill">Pendiente de pagar ${M(T('pend'))}</div></div><div class="g2"><div class="kp"><span>Sueldos</span><b>${M(T('sueldo'))}</b></div><div class="kp"><span>Gasolina</span><b>${M(T('gas'))}</b></div><div class="kp"><span>Descuentos</span><b>${M(T('desc'))}</b></div><div class="kp"><span>Pagado</span><b>${M(T('pag'))}</b></div></div>`;
      h+=F.length?F.map(x=>`<div class="cd"><div class="row"><b style="flex:1 1 0%;font-size:16px">${E(x.n)}</b><span class="pl${x.q?' g':' n'}">${x.q?'Cerrada':'Abierta'}</span></div><div class="li"><span>Sueldo</span><b>${M(x.sueldo)}</b></div><div class="li"><span>Gasolina</span><b>${M(x.gas)}</b></div><div class="li"><span>Descuentos</span><b>− ${M(x.desc)}</b></div><div class="li"><span>Pagado</span><b>${M(x.pag)}</b></div><div class="li" style="border-top:1px solid #F1E4DA;padding-top:8px"><span>Pendiente</span><b style="font-size:17px">${M(x.pend)}</b></div></div>`).join(''):vacio('Sin sueldos en esta quincena.');
      const csv=['Motorizado;Sueldo;Gasolina;Ganado;Descuentos;Pagado;Pendiente;Estado',...F.map(x=>[x.n,x.sueldo,x.gas,x.ganado,x.desc,x.pag,x.pend,x.q?(x.q.recibido_conforme_en?'Cerrada - conforme':'Cerrada'):'Abierta'].join(';')),['TOTAL',T('sueldo'),T('gas'),T('ganado'),T('desc'),T('pag'),T('pend'),''].join(';')].join('\n');
      const txt=['*Planilla · '+lab+'*','',...F.map(x=>'*'+x.n+'*: ganado '+M(x.ganado)+' · desc. '+M(x.desc)+' · pagado '+M(x.pag)+' · pendiente '+M(x.pend)),'','*Total ganado: '+M(T('ganado'))+'*','*Total pendiente: '+M(T('pend'))+'*'].join('\n');
      return {body:h,foot:`<div class="btns b2"><a class="b" download="planilla-${E(f.k)}.csv" href="data:text/csv;charset=utf-8,${encodeURIComponent('﻿'+csv)}">${IC.list}Excel (CSV)</a><a class="b g" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(txt)}">${U.I.wa}Compartir</a></div>`}},
    async a(x){SF['planilla de sueldos'].k=x.slice(2);recargar('planilla de sueldos')}};

  /* --- Solicitudes de afiliación --- */
  const ESTS={nueva:'Nueva',revision:'En revisión',aprobada:'Aprobada',rechazada:'Rechazada'};
  const solMapa=r=>{let la=Number(r.latitud),ln=Number(r.longitud),url=r.maps_url||'';if(!(la&&ln)){const m=String(r.referencia||'').match(/https?:\/\/\S*?q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);if(m){la=Number(m[1]);ln=Number(m[2]);url=m[0]}}if(!(la&&ln))return null;return {lat:la,lng:ln,url:url||('https://www.google.com/maps?q='+la+','+ln)}};
  SEC['solicitudes de afiliación']={g:'Negocios',t:'Solicitudes de afiliación',rf:1,
    load:async()=>{const r=await D().from('solicitudes_afiliacion').select('*').order('created_at',{ascending:false}).limit(500);if(r.error)throw r.error;return r.data||[]},
    v(){const k='solicitudes de afiliación',c=datos(k,this.load),f=SF[k];f.f=f.f||'nueva';f.ab=f.ab||{};f.nota=f.nota||{};if(!c.data)return {body:cargando(c)};const R=c.data;
      const n={nueva:0,revision:0,aprobada:0,rechazada:0,todas:R.length};R.forEach(r=>{if(n[r.estado]!=null)n[r.estado]++});
      let h=`<div class="chips" style="flex-wrap:wrap">${[['nueva','Nuevas'],['revision','En revisión'],['aprobada','Aprobadas'],['rechazada','Rechazadas'],['todas','Todas']].map(x=>`<button type="button" class="${f.f===x[0]?'on':''}" data-sa="f:${x[0]}">${x[1]} · ${n[x[0]]}</button>`).join('')}</div>`;
      const V=R.filter(r=>f.f==='todas'||r.estado===f.f);
      /* sin enlaces de mapa en el texto (la ubicación va en botones); los textos largos van debajo de su título */
      const par=(a,b)=>{if(b===null||b===undefined||b==='')return '';let v=String(Array.isArray(b)?b.join(', '):b).split(/\s*[·|]\s*/).filter(x=>!/^ubicaci[oó]n\s*:/i.test(x.trim())).join(' · ').replace(/https?:\/\/\S+/g,'').replace(/[\s·,|-]+$/,'').trim();if(!v)return '';
        return v.length>26?`<div style="display:flex;flex-direction:column;gap:2px;padding:6px 0"><span style="font-size:14px;color:#6B5E55">${E(a)}</span><b style="font-size:16px;line-height:1.4;white-space:normal;overflow-wrap:anywhere">${E(v)}</b></div>`:`<div class="li" style="align-items:flex-start"><span>${E(a)}</span><b style="white-space:normal;text-align:right">${E(v)}</b></div>`};
      h+=V.length?V.map(r=>{const ab=!!f.ab[r.id],w=telW(r.rep_celular),u=solMapa(r);
        return `<div class="cd"><div class="row"><span class="ic" style="flex:0 0 44px;width:44px;height:44px;border-radius:12px;background:#FDEBDF;color:#C4410C;display:flex;align-items:center;justify-content:center;font-weight:800">${E((String(r.nombre_negocio||'?').trim()[0]||'?').toUpperCase())}</span><div style="flex:1 1 0%;min-width:0"><b style="display:block;font-size:16px">${E(r.nombre_negocio||'Negocio')}</b><span style="font-size:13px;color:#6B5E55">${E([r.categoria,r.distrito||r.ciudad].filter(Boolean).join(' · '))}</span></div><span class="pl${r.estado==='aprobada'?' g':r.estado==='rechazada'?' r':''}">${E(ESTS[r.estado]||r.estado)}</span></div>
          ${par('Contacto',r.rep_nombre)}${par('Celular',r.rep_celular)}${par('Recibida',fecha(r.created_at))}
          <button type="button" class="b" style="height:42px" data-sa="ab:${E(r.id)}">${ab?'Ocultar detalle':'Ver detalle'}</button>
          ${ab?`<div class="lbl">Negocio</div>${par('Razón social',r.razon_social)}${par('RUC',r.ruc)}${par('Tipo',r.categoria)}${par('Dirección',r.direccion)}${par('Distrito',r.distrito)}${par('Ciudad',r.ciudad)}${par('Referencia',r.referencia)}${par('Redes / web',r.redes)}${u?`<div class="btns b2"><a class="b o" style="height:46px" href="${E(u.url)}" target="_blank" rel="noopener">${IC.pin}Ver en el mapa</a><a class="b" style="height:46px" href="https://www.google.com/maps/dir/?api=1&destination=${u.lat},${u.lng}" target="_blank" rel="noopener">Cómo llegar</a></div>`:''}
            <div class="lbl">Representante</div>${par('Nombre',r.rep_nombre)}${par('DNI',r.rep_dni)}${par('Cargo',r.rep_cargo)}${par('Celular',r.rep_celular)}${par('Correo',r.rep_correo)}
            <div class="lbl">Productos</div>${par('Productos',r.productos)}${par('Cantidad en carta',r.num_productos)}${par('Stock aproximado',r.stock_aprox)}${par('Controla inventario',r.maneja_stock)}${par('Fotos / catálogo',r.tiene_fotos)}
            <div class="lbl">Atención</div>${par('Horario',r.horario)}${par('Pedidos por día',r.pedidos_dia)}${par('Preparación',r.tiempo_prep?r.tiempo_prep+' min':'')}${par('Repartidores propios',r.delivery_propio)}${par('Pagos',r.pagos)}${par('Comentarios',r.comentarios)}
            <div class="fld"><label>Notas internas</label><textarea data-in="sf:n_${E(r.id)}" style="width:100%;min-height:80px;border-radius:14px;border:1.5px solid #F1E4DA;padding:12px;font:500 15px PdInter,Inter,sans-serif;box-sizing:border-box">${E(f['n_'+r.id]!=null?f['n_'+r.id]:r.notas_admin||'')}</textarea></div><button type="button" class="b" style="height:42px" data-sa="nota:${E(r.id)}">Guardar nota</button>`:''}
          ${w?`<a class="b g" style="display:flex;width:100%;box-sizing:border-box;justify-content:center;gap:8px" href="https://wa.me/${w}?text=${encodeURIComponent('Hola'+(r.rep_nombre?' '+String(r.rep_nombre).split(' ')[0]:'')+', te escribimos de Pidemás por tu solicitud de afiliación de '+(r.nombre_negocio||'tu negocio')+'.')}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21l1.65-3.8A9 9 0 1 1 7.6 19.6L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></svg>Escribir por WhatsApp</a>`:''}
          <div class="lbl" style="margin:4px 0 -2px">Estado de la solicitud</div>
          <div class="btns" style="grid-template-columns:repeat(${[r.estado!=='revision',r.estado!=='rechazada',r.estado!=='aprobada'].filter(Boolean).length||1},minmax(0,1fr))">${r.estado!=='revision'?`<button type="button" class="b" data-sa="est:${E(r.id)}:revision">Revisión</button>`:''}${r.estado!=='rechazada'?`<button type="button" class="b" style="color:#B42318;border-color:#F4C7C3" data-sa="est:${E(r.id)}:rechazada">Rechazar</button>`:''}${r.estado!=='aprobada'?`<button type="button" class="b o" data-sa="est:${E(r.id)}:aprobada">Aprobar</button>`:''}</div>
          <button type="button" class="b o" data-sa="crear:${E(r.id)}">${IC.store}Crear negocio con estos datos</button><button type="button" class="b" style="height:40px;color:#B42318;border:0;background:transparent" data-sa="del:${E(r.id)}">Eliminar solicitud</button></div>`}).join(''):vacio('No hay solicitudes en esta lista.');
      return {body:h}},
    async a(x){const k='solicitudes de afiliación',f=SF[k],R=C2['s:'+k].data,p=x.split(':'),r=R.find(y=>String(y.id)===p[1]);
      if(p[0]==='f'){f.f=p[1];return}if(!r)return;
      if(p[0]==='ab'){f.ab[r.id]=!f.ab[r.id];return}
      const upd=async(cb,msg)=>{const q=await D().from('solicitudes_afiliacion').update(cb).eq('id',r.id);if(q.error){mal('No se pudo guardar el cambio.');return}Object.assign(r,cb);ok(msg)};
      if(p[0]==='est')return upd({estado:p[2]},'Solicitud marcada como '+ESTS[p[2]].toLowerCase());
      if(p[0]==='nota')return upd({notas_admin:String(f['n_'+r.id]??r.notas_admin??'').trim()||null},'Nota guardada');
      if(p[0]==='del'){if(!(await conf('¿Eliminar esta solicitud? No se puede deshacer.')))return;const q=await D().from('solicitudes_afiliacion').delete().eq('id',r.id);if(q.error){mal('No se pudo eliminar.');return}C2['s:'+k].data=R.filter(y=>y!==r);ok('Solicitud eliminada');return}
      if(p[0]==='crear'){const u=solMapa(r);SF['crear negocio']=cnNuevo({nombre:r.nombre_negocio||'',tel:r.rep_celular||'',dir:[r.direccion,r.distrito].filter(Boolean).join(', '),desc:r.productos||'',tiempo:r.tiempo_prep?r.tiempo_prep+' min':'',cat:CATS_NEG.includes(r.categoria)?r.categoria:'',
          maps:u?u.url:'',lat:u?String(u.lat):'',lng:u?String(u.lng):'',correo:String(r.rep_correo||'').trim().toLowerCase()});abrirSec('crear negocio')}}};

  /* --- Códigos de descuento --- */
  const dcSt=p=>{if(p.activo!==true)return 'Inactivo';const now=Date.now(),i=p.fecha_inicio?Date.parse(p.fecha_inicio):null,f=p.fecha_fin?Date.parse(p.fecha_fin):null;if(i&&now<i)return 'Programado';if(f&&now>f)return 'Vencido';const mx=Number(p.max_usos||0);if(mx>0&&Number(p.usos||0)>=mx)return 'Agotado';return 'Activo'};
  const pad2=n=>String(n).padStart(2,'0'),toLoc=v=>{if(!v)return '';const d=new Date(v);if(isNaN(d))return '';return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate())+'T'+pad2(d.getHours())+':'+pad2(d.getMinutes())},fromLoc=v=>{if(!v)return null;const d=new Date(v);return isNaN(d)?null:d.toISOString()};
  SEC['códigos de descuento']={g:'Más',t:'Códigos de descuento',rf:1,
    load:async()=>{const r=await D().from('codigos_delivery').select('*');if(r.error)throw r.error;return (r.data||[]).sort((a,b)=>(Date.parse(b.creado_en||b.created_at||b.fecha_inicio||0)||0)-(Date.parse(a.creado_en||a.created_at||a.fecha_inicio||0)||0))},
    v(){const k='códigos de descuento',c=datos(k,this.load),f=SF[k];f.fl=f.fl||'todos';
      if(f.ed)return this.form();if(!c.data)return {body:cargando(c)};const R=c.data,S2=R.map(dcSt);
      let h='';
      h+=`<div class="chips" style="flex-wrap:wrap">${[['todos','Todos'],['Activo','Activos'],['Programado','Programados'],['fin','Vencidos'],['Inactivo','Apagados']].map(x=>`<button type="button" class="${f.fl===x[0]?'on':''}" data-sa="fl:${x[0]}">${x[1]}</button>`).join('')}</div>`;
      const L2=R.filter((p,i)=>f.fl==='todos'||(f.fl==='fin'?['Vencido','Agotado'].includes(S2[i]):S2[i]===f.fl));
      h+=L2.length?L2.map(p=>{const s=dcSt(p),mx=Number(p.max_usos||0),u=Number(p.usos||0);
        return `<div class="cd" style="${s==='Activo'||s==='Programado'?'':'opacity:.7'}"><div class="row"><span style="font:800 18px PdInter,Inter,monospace;letter-spacing:.06em;padding:6px 12px;border-radius:10px;border:1.5px dashed #C4410C;color:#9A330A">${E(p.codigo)}</span><span style="flex:1"></span><span class="pl${s==='Activo'?' g':s==='Programado'?'':' r'}">${E(s)}</span></div>
          <b style="font-size:17px">${p.tipo==='porcentaje'?Number(p.valor||0).toFixed(0)+'% del delivery':M(p.valor)+' menos en el delivery'}</b>
          <span style="font-size:13px;color:#6B5E55">${Number(p.compra_minima||0)>0?'Compra mínima '+M(p.compra_minima):'Sin compra mínima'} · ${p.fecha_fin?(s==='Vencido'?'Venció el ':'Hasta el ')+E(dtl(p.fecha_fin)):'Sin vencimiento'} · usado ${u}${mx>0?' de '+mx:''} ${u===1?'vez':'veces'}</span>
          ${mx>0?`<div class="bar"><s style="width:${Math.min(100,u/mx*100)}%"></s></div>`:''}
          <div class="row"><button type="button" role="switch" aria-checked="${p.activo===true}" aria-label="Encender código" data-sa="sw:${E(p.id)}" style="position:relative;flex:0 0 52px;width:52px;height:32px;border-radius:999px;border:0;background:${p.activo===true?'#C4410C':'#EADFD6'};cursor:pointer"><span style="position:absolute;top:3px;left:${p.activo===true?23:3}px;width:26px;height:26px;border-radius:50%;background:#FFFFFF;box-shadow:0 1px 3px rgba(31,26,23,.25)"></span></button><span style="flex:1 1 0%;font-size:14px;color:#6B5E55">${p.activo===true?'Encendido':'Apagado'}</span><button type="button" class="b" style="height:38px;padding:0 12px" data-sa="ed:${E(p.id)}">Editar</button><button type="button" class="b" style="height:38px;padding:0 12px;color:#B42318;border-color:#F4C7C3" data-sa="del:${E(p.id)}">Eliminar</button></div></div>`}).join(''):vacio(R.length?'No hay códigos en este filtro.':'Todavía no hay códigos. Crea el primero.');
      return {body:h,foot:`<button type="button" class="b o" style="height:54px;font-size:16px" data-sa="nuevo">${IC.plus}Nuevo código</button>`}},
    form(){const f=SF['códigos de descuento'],e=f.ed;const v=Number(e.valor)||0,mn=Number(e.minimo)||0,mx=Number(e.max)||0;
      let h=`<div class="cd"><div class="fld"><label>Código</label><div class="row"><input style="flex:1;text-transform:uppercase;font-weight:800;letter-spacing:.05em" maxlength="20" placeholder="EJ. ENVIOGRATIS" value="${E(e.codigo)}" data-in="dc:codigo"><button type="button" class="b" style="height:54px;padding:0 14px" data-sa="gen">Generar</button></div></div>
        <div class="fld"><label>Tipo de descuento</label><div class="seg" style="grid-template-columns:repeat(2,minmax(0,1fr))"><button type="button" class="${e.tipo!=='porcentaje'?'on':''}" data-sa="tp:fijo">Monto (S/)</button><button type="button" class="${e.tipo==='porcentaje'?'on':''}" data-sa="tp:porcentaje">Porcentaje (%)</button></div></div>
        <div class="g2"><div class="fld"><label>${e.tipo==='porcentaje'?'Descuento (%)':'Descuento (S/)'}</label><input inputmode="decimal" placeholder="0.00" value="${E(e.valor)}" data-in="dc:valor"></div><div class="fld"><label>Compra mínima (S/)</label><input inputmode="decimal" placeholder="0 = sin mínimo" value="${E(e.minimo)}" data-in="dc:minimo"></div></div>
        <div class="fld"><label>Máximo de usos</label><input inputmode="numeric" placeholder="0 = ilimitado" value="${E(e.max)}" data-in="dc:max"></div></div>
        <div class="cd"><div class="fld"><label>Desde</label><input type="datetime-local" value="${E(e.ini)}" data-in="dc:ini"></div><div class="fld"><label>Hasta</label><input type="datetime-local" value="${E(e.fin)}" data-in="dc:fin"></div><div class="grid4">${[[1,'Solo hoy'],[7,'7 días'],[30,'30 días'],[0,'Sin fin']].map(x=>`<button type="button" data-sa="q:${x[0]}">${x[1]}</button>`).join('')}</div></div>`;
      h+=`<div class="note" style="display:block;padding:12px 14px;border-radius:14px;background:#FFF4EC;font-size:14px;line-height:1.5">Con <b>${E((e.codigo||'CÓDIGO').toUpperCase())}</b> el cliente obtiene <b>${e.tipo==='porcentaje'?(v||0)+'% de descuento':M(v)+' menos'}</b> en el delivery${mn>0?' en compras desde <b>'+M(mn)+'</b>':''}${e.fin?' hasta el <b>'+E(dtl(e.fin))+'</b>':' sin fecha de vencimiento'}. ${mx>0?'Se puede usar <b>'+mx+'</b> veces.':'Usos ilimitados.'}</div>`;
      if(f.msg)h+=`<div class="err">${E(f.msg)}</div>`;
      return {body:h,foot:`<button type="button" class="b o" style="height:54px;font-size:16px" data-sa="guardar">${e.id?'Guardar cambios':'Crear código'}</button><button type="button" class="b" style="height:46px" data-sa="cancel">Cancelar</button>`}},
    async a(x){const k='códigos de descuento',f=SF[k],R=(C2['s:'+k]||{}).data||[],p=x.split(':');f.msg='';
      if(p[0]==='fl'){f.fl=p[1];return}
      if(p[0]==='nuevo'){f.ed={id:'',codigo:'',tipo:'fijo',valor:'',minimo:'',max:'',ini:toLoc(new Date()),fin:''};return}
      if(p[0]==='ed'){const r=R.find(y=>String(y.id)===p[1]);if(r)f.ed={id:r.id,codigo:r.codigo,tipo:r.tipo==='porcentaje'?'porcentaje':'fijo',valor:Number(r.valor||0),minimo:Number(r.compra_minima)>0?Number(r.compra_minima):'',max:Number(r.max_usos)>0?Number(r.max_usos):'',ini:toLoc(r.fecha_inicio),fin:toLoc(r.fecha_fin)};return}
      if(p[0]==='cancel'){f.ed=null;return}
      if(p[0]==='gen'){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='PIDE';for(let i=0;i<4;i++)s+=A[Math.floor(Math.random()*A.length)];f.ed.codigo=s;return}
      if(p[0]==='tp'){f.ed.tipo=p[1];return}
      if(p[0]==='q'){const n=+p[1],now=new Date();if(!f.ed.ini)f.ed.ini=toLoc(now);if(!n)f.ed.fin='';else{const d=new Date(now);d.setDate(d.getDate()+n-1);d.setHours(23,59,0,0);f.ed.fin=toLoc(d)}return}
      if(p[0]==='sw'){const r=R.find(y=>String(y.id)===p[1]);if(!r)return;const q=await D().from('codigos_delivery').update({activo:r.activo!==true}).eq('id',r.id);if(q.error){mal('No se pudo cambiar: '+q.error.message);return}r.activo=r.activo!==true;return}
      if(p[0]==='del'){const r=R.find(y=>String(y.id)===p[1]);if(!r||!(await conf('¿Eliminar el código '+r.codigo+'? Los clientes ya no podrán usarlo.')))return;const q=await D().from('codigos_delivery').delete().eq('id',r.id);if(q.error){mal('No se pudo eliminar: '+q.error.message);return}recargar(k);return}
      if(p[0]==='guardar'){const e=f.ed,codigo=String(e.codigo||'').trim().toUpperCase(),valor=Number(String(e.valor).replace(',','.')),minimo=Number(String(e.minimo||0).replace(',','.'))||0,max=Math.floor(Number(e.max)||0),ini=fromLoc(e.ini),fin=fromLoc(e.fin);
        if(!/^[A-Z0-9_-]{3,20}$/.test(codigo)){f.msg='El código debe tener de 3 a 20 letras o números, sin espacios.';return}if(!(valor>0)){f.msg='Escribe un descuento mayor que 0.';return}if(e.tipo==='porcentaje'&&valor>100){f.msg='El porcentaje no puede pasar de 100%.';return}
        if(minimo<0||max<0){f.msg='Los valores no pueden ser negativos.';return}if(ini&&fin&&Date.parse(ini)>Date.parse(fin)){f.msg='La fecha «Hasta» debe ser después de «Desde».';return}if(R.some(r=>r.codigo===codigo&&String(r.id)!==String(e.id))){f.msg='Ya existe un código '+codigo+'.';return}
        const pl={codigo,tipo:e.tipo,valor:r2(valor),compra_minima:r2(minimo),max_usos:max,fecha_inicio:ini,fecha_fin:fin};
        const q=e.id?await D().from('codigos_delivery').update(pl).eq('id',e.id):await D().from('codigos_delivery').insert({...pl,usos:0,activo:true});if(q.error){f.msg='No se pudo guardar: '+q.error.message;return}
        ok(e.id?'Código actualizado':'Código creado');f.ed=null;recargar(k)}}};

  /* =============== PÁGINAS DE SIEMPRE (marco) =============== */
  const DLG='#pdDlg,#pdpeVelo,#pfSheet,#pdYNOv,#pdmmVelo,#pdsmVelo,pd-ventana';
  function paginaVieja(){
    const pm=$('pdmModal');if(pm&&!pm.hidden&&pm.getClientRects().length)return pm.querySelector('.m-card')||pm;
    const hs=$('pdhSheet');if(hs&&!hs.hidden&&hs.getClientRects().length)return hs.querySelector('.h-sheetCard')||hs;
    for(const h of document.querySelectorAll('[data-pdm-hoja]')){if(h.closest(DLG)||!h.getClientRects().length)continue;const c=getComputedStyle(h);if(c.visibility==='hidden'||+c.opacity<0.05)continue;const rr=h.getBoundingClientRect();if(rr.width<200||rr.bottom<=0||rr.top>=innerHeight-60)continue;if(rr.height<160&&!h.closest('[data-pdm-velo]')&&!h.__pdmVelo)continue;if(h.closest('#appView')&&!h.closest('#pdmModal,#pdhSheet'))continue;return h}
    return null;
  }
  function tituloDe(h){const t=h.querySelector('[data-pdm-titulo],#pdmTitle,.h-head strong,[data-pdm-cab] strong,[data-pdm-cab] h2,[data-pdm-cab] h3');return ((t||{}).textContent||h.getAttribute('aria-label')||ultimo||'').trim()}
  function cerrarVieja(){pagHasta=0;
    const h=paginaVieja();if(!h)return;
    if(movido){volverLista();return}
    if(h.closest('#pdmModal')&&window.__pdmClose){window.__pdmClose();return}
    const b=h.querySelector('[data-pdm-cab] :is([data-pdm-cerrar],[data-close],[aria-label^="Cerrar"],.m-x,.h-x)')||h.querySelector('[data-pdm-cerrar],[aria-label^="Cerrar"],.h-x,.m-x,[data-close]');
    if(b){b.click();return}
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  }
  function pintarTop(h){
    if(!topH){topH=document.createElement('pd-app-adm-top');const w=$('pdAppShell');w.appendChild(topH);topR=topH.attachShadow({mode:'open'});
      topR.addEventListener('click',e=>{const a=e.target.closest('[data-a]');if(!a)return;if(a.dataset.a==='volver')cerrarVieja();else if(a.dataset.a==='rf'){const r=paginaVieja();const b=r&&r.querySelector('.m-rf,[aria-label="Actualizar"]');if(b)b.click()}})}
    topH.style.display='';
    const hayRf=!!h.querySelector('[data-pdm-cab] .m-rf:not([hidden]),.m-head .m-rf:not([hidden])');
    const tt=movido?'Pedido '+ref(movido.id):tituloDe(h)||'Sección';
    const k=kick+'|'+tt+'|'+hayRf;if(k===keyTop)return;keyTop=k;
    topR.innerHTML=`<style>${PdPasos.css}:host{bottom:auto!important;height:auto!important;z-index:2147482600}.app{position:relative;inset:auto;overflow:visible;background:transparent}.back2,.ib{width:44px;height:44px;flex:0 0 44px;border-radius:12px;border:1px solid #F1E4DA;background:#FFFFFF;display:flex;align-items:center;justify-content:center;color:#1F1A17;padding:0;cursor:pointer}</style><div class="app"><div class="top"><div class="row"><button type="button" class="back2" data-a="volver" aria-label="Volver">${IC.back}</button><div class="ttl"><div class="kick">${E(kick)}</div><div class="h1">${E(tt)}</div></div>${hayRf?`<button type="button" class="ib" data-a="rf" aria-label="Actualizar">${IC.refresh}</button>`:''}</div></div></div>`;
    requestAnimationFrame(()=>{document.documentElement.style.setProperty('--pda-top',topH.getBoundingClientRect().height+'px')});
  }
  /* pedidos de servicios (encomienda, compra, recojo): su tarjeta de siempre, como página */
  function abrirVieja(id){
    const t=$('tab-pedidos'),pm=$('pdmModal'),body=$('pdmBody');if(!t||!pm||!body)return;
    try{window.__pdmClose&&window.__pdmClose()}catch(_){}
    const ph=document.createComment('pda-vuelve');t.parentNode.insertBefore(ph,t);movido={t,ph,id:String(id)};
    body.appendChild(t);t.classList.remove('hidden');const av=$('appView');if(av&&pm.parentNode!==av)av.appendChild(pm);pm.hidden=false;
    const s=$('orderSearch');if(s){s.value=String(id).slice(0,8);try{window.renderOrders&&window.renderOrders()}catch(_){}}
    setTimeout(()=>{const c=document.querySelector(`#orderList .adminOrderCard[data-order-id="${CSS.escape(String(id))}"]`);const v=c&&[...c.querySelectorAll('button')].find(b=>/ver más/i.test(b.textContent||''));if(v)v.click()},300);
    kick='Pedidos';marca='inicio';pintar();
  }
  function volverLista(){const m=movido;movido=null;if(!m)return;const pm=$('pdmModal');if(pm)pm.hidden=true;if(m.ph.parentNode){m.ph.parentNode.insertBefore(m.t,m.ph);m.ph.remove()}
    const s=$('orderSearch');if(s){s.value='';try{window.renderOrders&&window.renderOrders()}catch(_){}}document.documentElement.style.overflow='';pintar()}

  /* =============== MENÚ INFERIOR Y PINTADO =============== */
  /* Menú lateral (sin menú inferior): se abre con el botón ☰ de la cabecera */
  let cajon=false,cajonT=0;
  let navH=null,navR=null,navKey='',navG='inicio';
  const NAVALTO='calc(70px + env(safe-area-inset-bottom, 0px))';
  /* Abanico de «Nuevo servicio»: [clave, nombre, color, desplazamiento x, altura del centro sobre el borde inferior, ícono] */
  const NUEVOS=[
    ['compra','Compra','#1F6F43',-115,138,S('<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>')],
    ['recojo y entrega','Recojo y entrega','#C4410C',0,198,IC.swap],
    ['encomienda','Encomienda','#1D4F91',115,138,S('<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>')]];
  function frecPanel(){const L2=frecs();
    const cab=`<div class="fqh"><b>Clientes frecuentes</b><button type="button" class="fqe" data-frecedit>${L2&&L2.length?'Editar':'Agregar'}</button></div>`;
    if(!L2)return `<div class="fq">${cab}<div class="fqv">${FRCARGA?'Cargando…':'No se pudo cargar. Toca Recojo y entrega otra vez para un pedido nuevo.'}</div></div>`;
    if(!L2.length)return `<div class="fq">${cab}<div class="fqv">Guarda hasta ${FR_MAX} clientes que envían seguido: al tocarlos, sus datos ya están llenos.</div><button type="button" class="fqn" data-frecedit>Agregar cliente frecuente</button></div>`;
    return `<div class="fq">${cab}${L2.map((x,i)=>`<button type="button" class="fqi" data-frec="${i}"><span class="fqa">${E(frIni(x.rnom))}</span><span class="fqt"><b>${E(x.rnom||'Cliente')}</b><span>${E(x.rdir||x.rtel||'')}</span></span>${IC.chev||''}</button>`).join('')}<div class="fqp">Para un pedido nuevo sin cliente frecuente, toca otra vez <b>Recojo y entrega</b>.</div></div>`}
  function pintarNav(show){
    const H=document.documentElement;
    if(!show){nuevoAb=false;if(navH&&navH.style.display!=='none')navH.style.display='none';if(host)host.style.bottom='';if(H.style.getPropertyValue('--pda-nav')!=='0px')H.style.setProperty('--pda-nav','0px');return}
    if(!navH){navH=document.createElement('pd-app-adm-nav');$('pdAppShell').appendChild(navH);navR=navH.attachShadow({mode:'open'});
      navR.addEventListener('click',e=>{
        if(e.target.closest('[data-nuevo]')){nuevoAb=!nuevoAb;frecAb=false;cajon=false;pintar();return}
        if(e.target.closest('[data-nuevox]')){nuevoAb=false;frecAb=false;pintar();return}
        const fq=e.target.closest('[data-frec]');if(fq){const it=(FREC||[])[+fq.dataset.frec];nuevoAb=false;frecAb=false;cajon=false;pintar();if(it)svcNuevo('recojo y entrega',it);return}
        if(e.target.closest('[data-frecedit]')){nuevoAb=false;frecAb=false;cajon=false;mq='';abrirSec('clientes frecuentes');return}
        const sv=e.target.closest('[data-svc]');if(sv){if(sv.dataset.svc==='recojo y entrega'&&!frecAb){frecAb=true;frecs();pintar();return}nuevoAb=false;frecAb=false;cajon=false;pintar();svcNuevo(sv.dataset.svc);return}
        const b=e.target.closest('[data-n]');if(!b)return;cajon=false;nuevoAb=false;mq='';const k=b.dataset.n;if(k===navG&&!sub&&!paginaVieja()&&tab===k){const l=root&&root.querySelector('.list');if(l)l.scrollTo({top:0,behavior:'smooth'});return}ir(k)})}
    if(navH.style.display==='none')navH.style.display='';
    if(host&&host.style.bottom!==NAVALTO)host.style.bottom=NAVALTO;
    if(H.style.getPropertyValue('--pda-nav')!==NAVALTO)H.style.setProperty('--pda-nav',NAVALTO);
    const bts=NAVK.map(k=>{const n=hubBd(k);return `<button type="button" data-n="${k}" class="${navG===k?'on':''}"${navG===k?' aria-current="page"':''}><span class="pi">${IC[HUBS[k].ic]}${n?`<span class="bd">${n>99?'99+':n}</span>`:''}</span><span class="lb">${HUBS[k].t}</span></button>`});
    /* Botón central «Nuevo servicio»: abre los tres servicios en abanico */
    bts.splice(2,0,`<button type="button" class="nw" data-nuevo aria-label="${nuevoAb?'Cerrar':'Nuevo servicio'}" aria-expanded="${nuevoAb}"><span class="c">${IC.plus}</span><span class="lb">Nuevo</span></button>`);
    const h=`<nav aria-label="Menú del admin" class="${nuevoAb?'ab':''}">${bts.join('')}</nav>`+(nuevoAb?`<div class="fv" data-nuevox></div>`+(frecAb?frecPanel():`<p class="ft">¿Qué servicio creamos?</p>`)+NUEVOS.map((x,i)=>`<button type="button" class="fa${frecAb&&i===1?' fon':''}" data-svc="${x[0]}" style="left:calc(50% + ${x[3]}px - 60px);bottom:calc(env(safe-area-inset-bottom,0px) + ${x[4]}px - 32px);animation-delay:${i*35}ms"><span class="fc" style="color:${x[2]}">${x[5]}</span><span class="fl">${x[1]}</span></button>`).join(''):'');
    if(h===navKey)return;navKey=h;
    navR.innerHTML=`<style>:host{all:initial;position:fixed;left:0;right:0;bottom:0;z-index:2147482700;display:block;font-family:PdInter,Inter,system-ui,sans-serif}
nav{display:grid;grid-template-columns:repeat(${NAVK.length+1},minmax(0,1fr));align-items:stretch;height:70px;box-sizing:border-box;padding:0 4px env(safe-area-inset-bottom,0px);background:#FFFFFF;border-top:1px solid #F1E4DA;box-shadow:0 -4px 16px rgba(31,26,23,.05)}
button{all:unset;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#6B5E55;font-size:12px;font-weight:700;-webkit-tap-highlight-color:transparent;min-width:0}
.pi{position:relative;width:58px;height:32px;border-radius:999px;display:flex;align-items:center;justify-content:center;transition:background .18s}
.pi svg{width:24px;height:24px;display:block;flex:0 0 auto}
button.on{color:#C4410C;font-weight:800}button.on .pi{background:#FDEBDF}
button:active .pi{transform:scale(.92)}
.bd{position:absolute;top:-5px;right:5px;min-width:20px;height:20px;padding:0 6px;box-sizing:border-box;border-radius:999px;background:#C4410C;color:#FFFFFF;font-size:11.5px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #FFFFFF}
.lb{display:block;text-align:center;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
nav{position:relative}
.nw{position:relative;z-index:5}nav.ab .nw{color:#FFFFFF}nav.ab .nw .c{border-color:transparent;box-shadow:0 6px 16px rgba(0,0,0,.35)}
.nw{color:#1F1A17}
.nw .c{width:48px;height:48px;margin-top:-26px;border-radius:50%;border:4px solid #FFF9F5;background:#C4410C;color:#FFFFFF;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(196,65,12,.32);transition:transform .2s,background .2s}
.nw .c svg{width:22px;height:22px;stroke-width:2.6;transition:transform .2s}
nav.ab .nw .c svg{transform:rotate(45deg)}
.nw:active .c{transform:scale(.92)}
.fv{position:fixed;inset:0;z-index:4;background:rgba(31,26,23,.72);animation:fvIn .18s ease-out}
.ft{position:fixed;left:0;right:0;z-index:6;margin:0;text-align:center;bottom:calc(env(safe-area-inset-bottom,0px) + 290px);color:#FFFFFF;font-size:20px;font-weight:800;pointer-events:none;animation:fvIn .18s ease-out}
.fa{position:fixed;z-index:6;width:120px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:0;animation:faIn .22s ease-out both}
.fc{width:64px;height:64px;border-radius:50%;background:#FFFFFF;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(0,0,0,.25)}
.fc svg{width:28px;height:28px}
.fa:active .fc{transform:scale(.94)}
.fl{position:absolute;top:72px;left:0;right:0;text-align:center;color:#FFFFFF;font-size:14px;font-weight:700;line-height:1.2;white-space:normal}
.fon .fc{box-shadow:0 0 0 4px #C4410C,0 6px 16px rgba(0,0,0,.25)}
.fl small{display:block;font-size:12px;font-weight:600;opacity:.85;margin-top:2px}
.fq{position:fixed;z-index:6;left:14px;right:14px;bottom:calc(env(safe-area-inset-bottom,0px) + 250px);max-height:calc(100dvh - env(safe-area-inset-bottom,0px) - 270px);overflow:auto;box-sizing:border-box;background:#FFFFFF;border-radius:22px;padding:14px;box-shadow:0 12px 32px rgba(0,0,0,.3);animation:faIn .22s ease-out both;color:#1F1A17}
.fqh{display:flex;align-items:center;gap:8px;margin:0 2px 10px}.fqh b{flex:1;font-size:17px;font-weight:800}
.fqe{height:34px;padding:0 12px;border-radius:999px;border:1.5px solid #F1E4DA;font-size:13.5px;font-weight:800;color:#C4410C;display:flex;flex-direction:row;align-items:center}
.fqi{display:flex;flex-direction:row;align-items:center;justify-content:flex-start;gap:12px;width:100%;box-sizing:border-box;padding:10px;border-radius:16px;min-height:60px}.fqi:active{background:#FFF4EC}
.fqi+.fqi{border-top:1px solid #F6EDE6}
.fqi svg{width:18px;height:18px;flex:0 0 auto;color:#B9A79A}
.fqa{width:42px;height:42px;flex:0 0 42px;border-radius:50%;background:#FDEBDF;color:#C4410C;font-weight:800;font-size:14px;display:flex;align-items:center;justify-content:center}
.fqt{flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left}.fqt b{font-size:15.5px;color:#1F1A17;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fqt span{font-size:13px;font-weight:500;color:#6B5E55;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fqv{font-size:14px;font-weight:500;color:#6B5E55;text-align:center;padding:6px 4px 12px;line-height:1.4}
.fqp{font-size:13px;font-weight:500;color:#6B5E55;text-align:center;line-height:1.4;padding:10px 6px 2px;border-top:1px solid #F6EDE6;margin-top:4px}.fqp b{color:#C4410C}
.fqn{width:100%;box-sizing:border-box;height:48px;border-radius:14px;background:#C4410C;color:#FFFFFF;font-size:15px;font-weight:800;flex-direction:row}
@keyframes fvIn{from{opacity:0}to{opacity:1}}
@keyframes faIn{from{opacity:0;transform:translateY(24px) scale(.6)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.fv,.ft,.fa{animation:none}.nw .c,.nw .c svg{transition:none}}
</style>${h}`;
  }
  function nav(){
    if(!cajon)return '';
    const m=$('pdMenu'),top=m&&m.querySelector('.m3Top'),nom=top?(top.querySelector('strong')||{}).textContent||'Admin':'Admin',foto=window.__pdAdminFoto||'',nP=L().filter(CH[1][2]).length;
    const act=sub==='sec'?'':tab;
    const it=[['inicio','Pedidos',IC.box,nP],['caja','Cajas',IC.cash],['sueldo','Sueldos',IC.wallet],['clientes','Clientes',IC.group]];
    return `<div class="dwb" data-a="cajon"></div><aside class="dw" aria-label="Menú"><div class="dwh"><button type="button" class="yo" data-a="perfil" style="border:0;padding:0;background:transparent"><span style="flex:1 1 0%;min-width:0"><b style="display:block;font-size:18px">${E(nom)}</b><span style="font-size:13px;color:#6B5E55">Ver mi perfil</span></span></button><button type="button" class="ib" data-a="cajon" aria-label="Cerrar menú">${IC.x}</button></div>
      <div class="dwl"><div class="fld"><label for="mQ" style="position:absolute;width:1px;height:1px;overflow:hidden">Buscar en el menú</label><input id="mQ" type="search" placeholder="Buscar en el menú" value="${E(mq)}" data-in="mq"></div>
      <nav class="dwp">${it.map(x=>`<button type="button" data-t="${x[0]}" class="${act===x[0]?'on':''}">${x[2]}<span>${x[1]}</span>${x[3]?`<span class="bd" style="position:static;border:0">${x[3]}</span>`:''}</button>`).join('')}</nav>
      <div id="mG" style="display:flex;flex-direction:column;gap:10px">${grupos()}</div>
      <button type="button" class="b" style="color:#B42318;border-color:#F4C7C3" data-a="salir">${IC.logout}Cerrar sesión</button></div></aside>`;
  }

  const IGN=new Set(['pdAppShell','appView','loginView','pdFondoHoja','nav','pdMenu','pdMenuShade','pdmModal']);
  function tapada(){
    const W=innerWidth,H=innerHeight;
    for(const el of document.body.children){
      if(IGN.has(el.id)||/^(PD-PASOS-PEDIDO|PD-VENTANA|SCRIPT|STYLE)$/.test(el.tagName)||el.hasAttribute('data-pdm-velo'))continue;
      const cs=getComputedStyle(el);if(cs.position!=='fixed'||cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0||cs.pointerEvents==='none')continue;
      const z=parseInt(cs.zIndex,10)||0;if(z>=2147482000)continue;
      const r=el.getBoundingClientRect();if(r.width*r.height<W*H*0.45)continue;return true;
    }
    return false;
  }
  function visible(){const av=$('appView'),lg=$('loginView');if(!av||av.classList.contains('hidden')||(lg&&!lg.classList.contains('hidden')))return false;return !tapada()}
  function vista(){if(sub==='cajamoto')return cajaMoto();if(sub==='sueldomoto')return sueldoMoto();if(sub==='cliente')return cliente();if(sub==='sec')return secVista();if(sub==='clienteform')return clienteForm();if(sub==='pedidoform')return pedidoForm();return HUBS[tab]&&tab!=='inicio'?hubVista(tab):tab==='menu'?hubVista('h:mas'):tab==='caja'?caja():tab==='sueldo'?sueldos():tab==='clientes'?clientes():inicio()}
  const cls=(el,c,on)=>{if(el&&el.classList.contains(c)!==!!on)el.classList.toggle(c,!!on)};

  /* Botón «Pegar» al costado de cada campo de todos los formularios */
  function pegarEn(r){
    r.querySelectorAll('.fld input,.fld textarea').forEach(inp=>{
      const t=(inp.type||'text').toLowerCase();
      if(inp.tagName==='INPUT'&&!['text','tel','number','search','email','url',''].includes(t))return;
      if(inp.readOnly||inp.disabled||inp.closest('.pgw')||inp.dataset.sinPegar!=null)return;
      const w=document.createElement('span');w.className='pgw';inp.before(w);w.appendChild(inp);
      if(inp.tagName==='TEXTAREA')w.style.alignItems='flex-start';
      const b=document.createElement('button');b.type='button';b.className='pgb';b.textContent='Pegar';w.appendChild(b);
      b.addEventListener('click',async ev=>{ev.preventDefault();ev.stopPropagation();
        try{let x=String(await navigator.clipboard.readText()||'').trim();if(!x){inp.focus();return}
          if(t==='number'){const m=x.replace(',','.').match(/-?\d+(?:\.\d+)?/);if(!m){inp.focus();return}x=m[0]}
          if(t==='tel'){const us=/^@?[a-z0-9._]{3,35}$/i.test(x)&&/[a-z@]/i.test(x)?(x.startsWith('@')?x:'@'+x):'';if(us)x=us;else{const d=x.replace(/[^\d+]/g,'');if(d)x=d}}
          inp.value=x;inp.dispatchEvent(new Event('input',{bubbles:true,composed:true}));inp.dispatchEvent(new Event('change',{bubbles:true,composed:true}));inp.focus();
        }catch(e){inp.focus();try{(window.pdAviso||alert)('Tu celular no dejó leer lo copiado. Mantén presionado el campo y elige «Pegar».')}catch(_){}}
      });
    });
  }
  /* Al abrir una sección de siempre: el diseño de página se pone ANTES de que aparezca, así no se ve el diseño viejo ni un instante */
  let pagHasta=0;
  function prepararPag(){const H=document.documentElement;pagHasta=Date.now()+2500;cls(H,'pdaPag',1);if(host)cls(host,'cargaPag',1);try{if(!$('pd-app-adm-css')){const st=document.createElement('style');st.id='pd-app-adm-css';st.textContent=ESTILO_DOC;document.head.appendChild(st)}if(host)pintarTop(document.createElement('div'))}catch(_){}}
  {let intentos=0,rq=0;
    const revisar=()=>{rq=0;const H=document.documentElement;if(!H.classList.contains('pdaApp'))return;
      const hay=document.querySelector('#pdmModal:not([hidden]),#pdhSheet:not([hidden]),[data-pdm-hoja]');
      if(!hay){intentos=0;return}
      if(H.classList.contains('pdaPag')&&Date.now()>=pagHasta&&!paginaVieja.__ok)return;
      if(paginaVieja()){intentos=0;if(!H.classList.contains('pdaPag')||Date.now()<pagHasta){pagHasta=0;key='';pintar()}return}
      if(++intentos<20)rq=requestAnimationFrame(revisar)};
    new MutationObserver(()=>{if(!rq)rq=requestAnimationFrame(revisar);revisarYa()}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class','data-pdm-hoja','style']});
    function revisarYa(){const H=document.documentElement;if(!H.classList.contains('pdaApp')||H.classList.contains('pdaPag'))return;if(document.querySelector('#pdmModal:not([hidden]),#pdhSheet:not([hidden]),[data-pdm-hoja]')&&paginaVieja())pintar()}
  }
  function pintar(){
    const H=document.documentElement;
    if(!visible()){pintarNav(false);if(host&&host.style.display!=='none'){host.style.display='none';cls(H,'pdaApp',0);cls(H,'pdaPag',0);H.style.overflow='';if(topH)topH.style.display='none'}return}
    if(!$('pd-app-adm-css')){const st=document.createElement('style');st.id='pd-app-adm-css';st.textContent=ESTILO_DOC;document.head.appendChild(st)}
    if(!host){
      host=document.createElement('pd-app-adm');
      const wrap=document.createElement('header');wrap.id='pdAppShell';wrap.style.cssText='display:contents';wrap.appendChild(host);document.body.appendChild(wrap);
      root=host.attachShadow({mode:'open'});{const ocultarViejo=()=>{const t=document.getElementById('pdInicioTop');if(t&&t.style.getPropertyValue('display')!=='none')t.style.setProperty('display','none','important')};ocultarViejo();setInterval(ocultarViejo,1500)}try{PdPasos.flechas(root)}catch(_){}
      root.addEventListener('click',clic);root.addEventListener('input',entrada);root.addEventListener('change',fotosCompraCambio);
      root.addEventListener('pointerdown',()=>{tocando=Date.now()});root.addEventListener('pointerup',()=>setTimeout(()=>{tocando=false},150),true);root.addEventListener('click',()=>setTimeout(()=>{tocando=false},60),true);root.addEventListener('pointercancel',()=>{tocando=false});
    }
    if(host.style.display==='none')host.style.display='';
    cls(H,'pdaApp',1);
    const pv=paginaVieja();
    if(movido&&!pv){movido.ph.parentNode&&(movido.ph.parentNode.insertBefore(movido.t,movido.ph),movido.ph.remove());movido=null}
    cls(host,'cargaPag',!pv&&Date.now()<pagHasta);
    if(pv){cls(H,'pdaPag',1);cls(host,'solo',1);pintarTop(pv)}
    else if(Date.now()<pagHasta){return}
    else{cls(H,'pdaPag',0);cls(host,'solo',0);if(topH&&topH.style.display!=='none')topH.style.display='none';keyTop=''}
    {const vv=pv?null:vista();pintarNav(!movido&&(!(vv&&vv.foot)||!!(window.PdPasos&&PdPasos.isOpen())));}
    if(tocando&&Date.now()-tocando<1500)return;tocando=false;/* un toque que no terminó no deja la pantalla congelada */
    const v=pv?{head:'',body:'',foot:''}:vista();const pag=pv?'vieja':sub==='sueldomoto'?'sl:'+SL.pest+':'+(SL.vista||''):(sub||tab);
    {const act=root.activeElement;if(act&&(act.tagName==='INPUT'||act.tagName==='TEXTAREA'||act.tagName==='SELECT')){if(root.__pag===pag)return;try{act.blur()}catch(_){}}}/* escribiendo: no redibuja; si cambió de página, sí */
    const k=pag+'|'+v.head+v.body+(v.foot||'')+nav();
    if(k===key)return;key=k;
    const lst=root.querySelector('.list');if(lst&&root.__pag)scrollMem[root.__pag]=lst.scrollTop;const chx=[...root.querySelectorAll('.chips')].map(c=>c.scrollLeft);/* las pestañas no vuelven al inicio al marcar */
    root.innerHTML=`<style>${ESTILO}</style><div class="app">${pv?'':v.head+`<div class="list">${v.body}</div>`+(v.foot?`<div class="foot">${v.foot}</div>`:'')}${nav()}</div>`;
    const nl=root.querySelector('.list');if(nl)nl.scrollTop=root.__pag===pag?(scrollMem[pag]||0):0;if(root.__pag===pag)root.querySelectorAll('.chips').forEach((c,i)=>{if(chx[i])c.scrollLeft=chx[i]});root.__pag=pag;
    if(sub==='pedidoform'&&PE.f&&PE.f.sv)try{pegarEn(root)}catch(_){}
    if(!pv&&H.style.overflow!=='hidden')H.style.overflow='hidden';
  }
  /* Volver a donde se llamó: cada página recuerda de dónde vino (pestaña, sección abierta y menú marcado) */
  var desde=[];
  function volverTab(porPop){const d=desde.pop();if(!d){ir(HUBDE[tab]||'inicio');return}
    tab=d.tab;marca=d.tab;navG=d.navG;sub=d.sub;if(d.secK)secK=d.secK;key='';
    if(porPop){if(sub)try{history.pushState({pdApp:1},'')}catch(_){}}
    else if(history.state&&history.state.pdTab){if(sub)try{history.replaceState({pdApp:1},'')}catch(_){}else{ignorarPop=true;history.back()}}
    pintar()}
  function ir(t){
    if(window.PdPasos&&PdPasos.isOpen())PdPasos.close();
    if(paginaVieja())cerrarVieja();
    if(t==='menu')t='h:mas';
    if(!NAVK.includes(t)&&t!==tab){desde.push({tab,sub,secK,navG});
      if(sub){try{history.replaceState({pdApp:1,pdTab:1},'')}catch(_){}}else{try{history.pushState({pdApp:1,pdTab:1},'')}catch(_){}}sub=null}
    else{if(NAVK.includes(t))desde=[];if(sub&&history.state?.pdApp){ignorarPop=true;history.back()}sub=null}
    if(t!=='h:mas')mq='';navG=NAVK.includes(t)?t:(desde.length?navG:(HUBDE[t]||navG));
    tab=t;marca=t;key='';if(t==='caja'&&C2.caja)C2.caja.t=0;if(t==='sueldo'&&C2.sueldo)C2.sueldo.t=0;if(t==='clientes'&&C2.cli)C2.cli.t=0;pintar();
  }
  function abrirPedido(id){
    const o=L().find(x=>String(x.id)===String(id));
    if(o&&typeof window.pdAbrirPasosAdmin==='function')return window.pdAbrirPasosAdmin(id);
    abrirVieja(id);
  }
  /* mientras escribe un monto: actualiza la ayuda y el botón sin redibujar el campo */
  function vivo(){const v=vista();const t=document.createElement('template');t.innerHTML=v.body;const nh=t.content.getElementById('cjHint'),oh=root.getElementById('cjHint');if(nh&&oh)oh.textContent=nh.textContent;const f=root.querySelector('.foot');if(f&&v.foot!=null&&f.innerHTML!==v.foot)f.innerHTML=v.foot}
  function entrada(e){const el=e.target,k=el.dataset&&el.dataset.in;if(!k)return;
    if(k==='q'){q=el.value;limite=40;const box=root.getElementById('aLista');if(box){const ql=q.trim().toLowerCase();box.innerHTML=lista(L().filter((CH.find(c=>c[0]===chip)||CH[0])[2]).filter(o=>!ql||[o.id,ref(o.id),o.nombre_cliente,o.telefono_cliente,o.nombre_remitente,NEG(o.negocio_id).nombre].join(' ').toLowerCase().includes(ql)))}}
    if(k==='cjq'){CJ.q=el.value;const b=root.getElementById('cjL');if(b)b.innerHTML=cjFilas();return}
    if(k==='cjrec'){CJ.rec=el.value.replace(/[^\d.,]/g,'');vivo();return}
    if(k==='cjrecn'){CJ.recNota=el.value;return}
    if(k==='cjdar'){CJ.dar=el.value.replace(/[^\d.,]/g,'');vivo();return}
    if(k==='cjdarn'){CJ.darNota=el.value;return}
    if(k==='slq'){SL.q=el.value;const b=root.getElementById('slL');if(b)b.innerHTML=slFilas();return}
    if(k==='slm'){SL.monto=el.value.replace(/[^\d.,]/g,'');vivo();return}
    if(k==='sln'){SL.nota=el.value;return}
    if(k.startsWith('sx:')){SL.f[k.slice(3)]=el.value;slVivo(k.slice(3),el);return}
    if(k.startsWith('sc:')){if(SL.cfg)SL.cfg[k.slice(3)]=el.value;return}
    if(k==='clq'){CL.q=el.value;CL.lim=60;const b=root.getElementById('clL');if(b)b.innerHTML=clFilas();return}
    if(k.startsWith('cm:')&&SF['crear motorizado']){const f=SF['crear motorizado'],c=k.slice(3);f[c]=el.value;if(c==='mid'){key='';pintar()}else if(c==='pw')pwVivo(el.value);return}
    if(k==='acc:npw'&&SF[secK]){SF[secK].npw=el.value;pwVivo(el.value);return}
    if(k.startsWith('cn:')&&SF['crear negocio']){const f=SF['crear negocio'],c=k.slice(3);f[c]=el.value;if(c==='nid'||c==='cat')key='';if(c==='nid')pintar();if(c==='pw')pwVivo(el.value);return}
    if(k.startsWith('cnfile:')){const f=SF['crear negocio'],c=k.slice(7),fl=el.files&&el.files[0];el.value='';if(!fl)return;if(fl.size>15*1024*1024){mal('La imagen pesa demasiado (máximo 15 MB).');return}prepImg(fl,c==='portada'?1600:800).then(r=>{f[c]=r.file;f[c+'Prev']=r.prev;key='';pintar()},()=>mal(IMG_MAL));return}
    if(k.startsWith('cx')&&SF['configurar negocios']){const f=SF['configurar negocios'],p=k.split(':');
      if(p[0]==='cx'){if(p[1]==='nid'){f.nid=el.value;f.d=null;f.e=null;f.P=null;f.acc=undefined;f.dsOpen=false;f.cNew=false;key='';pintar();return}if(p[1]==='q'){f.q=el.value;clearTimeout(entrada.cx);entrada.cx=setTimeout(()=>{key='';pintar();const i=root.querySelector('[data-in="cx:q"]');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},250);return}if(p[1]==='cn'){f.cn=el.value;return}if(f.d){f.d[p[1]]=el.value;if(p[1]==='cat'){key='';pintar()}}return}
      if(p[0]==='cxh'&&f.d){f.d.H[p[1]][p[2]]=el.value;return}
      if(p[0]==='cxd'&&f.dp){f.dp[p[1]]=el.value;return}
      if(p[0]==='cxx'&&f.dx){const y=f.dx[+p[1]];if(y)y[p[2]]=el.value;return}
      if(p[0]==='cxp'&&f.e){f.e[p[1]]=el.value;return}
      if(p[0]==='cxpf'&&f.e){const y=f.e.f[+p[1]];if(y)y[p[2]]=el.value;return}
      if(p[0]==='cxa'){f.pw=f.pw||{};f.pw[p[1]+p[2]]=el.value;return}
      if(p[0]==='cxpi'&&f.e){const fl=el.files&&el.files[0];el.value='';if(!fl)return;if(fl.size>15*1024*1024){mal('La imagen pesa demasiado (máximo 15 MB).');return}prepImg(fl,1000).then(r=>{f.e.file=r.file;f.e.prev=r.prev;f.e.quitar=false;key='';pintar()},()=>mal(IMG_MAL));return}
      if(p[0]==='cxf'){const fl=el.files&&el.files[0];el.value='';if(!fl)return;if(fl.size>15*1024*1024){mal('La imagen pesa demasiado (máximo 15 MB).');return}prepImg(fl,p[1]==='portada'?1600:800).then(r=>cxSubirNeg(f,p[1],r.file),()=>mal(IMG_MAL));return}
      return}
    if(k.startsWith('ag:')&&SF['agencias']){const f=SF['agencias'],p=k.split(':');if(p[1]==='n')f.nuevo.nombre=el.value;else if(p[1]==='d')f.nuevo.ds[+p[2]]=el.value;else if(p[1]==='nd')f.nd[p.slice(2).join(':')]=el.value;return}
    if(k.startsWith('tf:')&&SF['tarifas']&&SF['tarifas'].C){const f=SF['tarifas'],C=f.C,p=k.slice(3).split('.');const v=el.type==='time'?el.value:el.value;
      if(p[0]==='zc'){f.zc[+p[1]]=v;return}
      if(p[0]==='z'){const z=C.zonas[+p[1]];if(z)z[p[2]]=p[2]==='nombre'?v:tNum(v);return}
      if(p[0]==='r'){C.recargos[p[1]]=C.recargos[p[1]]||{};C.recargos[p[1]][p[2]]=el.type==='time'?v:tNum(v);return}
      C[p[0]]=tNum(v);return}
    if(k.startsWith('sf:')){SF[secK][k.slice(3)]=el.value;const vv=el.dataset.vivo;if(vv&&SEC[secK].lista){clearTimeout(entrada.t);entrada.t=setTimeout(()=>{const b=root.getElementById(vv);if(b)b.innerHTML=SEC[secK].lista()},250)}return}
    if(k==='qrfile'){const fl=el.files&&el.files[0];el.value='';if(!fl)return;if(!/^image\//.test(fl.type)||fl.size>5*1024*1024){mal('Elige una imagen (PNG o JPG) de menos de 5 MB.');return}SF['qr yape'].file=fl;SF['qr yape'].prev=URL.createObjectURL(fl);key='';pintar();return}
    if(k==='pfoto'){const fl=el.files&&el.files[0];el.value='';if(!fl)return;const f=SF['__perfil'],c=C2['s:__perfil'],d=c&&c.data;if(!f||!d||!d.uid)return;
      if(!/^image\/(jpeg|png|webp)$/i.test(fl.type)||fl.size>5*1024*1024){mal('La foto debe ser JPG, PNG o WEBP y pesar máximo 5 MB.');return}
      f.prev=URL.createObjectURL(fl);f.subiendo=1;f.msg='';key='';pintar();
      (async()=>{try{const ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[fl.type]||'jpg',path=d.uid+'/perfil-'+Date.now()+'.'+ext,bk=D().storage.from('fotos-motorizados');
        const up=await bk.upload(path,fl,{cacheControl:'3600',upsert:false,contentType:fl.type});if(up.error)throw up.error;
        const url=bk.getPublicUrl(path).data.publicUrl;const q=await D().from('perfiles').update({foto_url:url}).eq('id',d.uid).select('id').maybeSingle();if(q.error)throw q.error;
        if(d.p)d.p.foto_url=url;window.__pdAdminFoto=url;try{localStorage.setItem('pdAdminFoto',url)}catch(_){}ok('Foto actualizada')}
        catch(e){f.msg='No se pudo subir la foto: '+(e.message||e)}finally{f.prev='';f.subiendo=0;key='';pintar()}})();return}
    if(k.startsWith('hr:')){const [,d,c]=k.split(':');SF['horario'].C.dias[d][c]=el.value;return}
    if(k.startsWith('dc:')){const f=SF['códigos de descuento'];if(f&&f.ed){let v=el.value;if(k==='dc:codigo'){v=v.toUpperCase().replace(/\s+/g,'');el.value=v}f.ed[k.slice(3)]=v;clearTimeout(entrada.d);entrada.d=setTimeout(()=>{const t=document.createElement('template');t.innerHTML=SEC['códigos de descuento'].form().body;const n=t.content.querySelector('.note'),o=root.querySelector('.list .note:last-of-type');const all=root.querySelectorAll('.list .note');if(n&&all.length)all[all.length-1].innerHTML=n.innerHTML},200)}return}
    if(k.startsWith('cf:')){CL.f[k.slice(3)]=el.value;return}
    if(PE.f&&k==='pe:cq'){PE.f.cq=el.value;const b=root.getElementById('peCl');if(b)b.innerHTML=nsCli(PE.f);return}
    if(PE.f&&k.startsWith('pe:cdx:')){const x=(PE.f.cdx||[])[+k.slice(7)];if(x)x.v=el.value;const su=cdxSuma(PE.f);if(Number.isFinite(su))PE.f.costo=String(su);try{const t=root.getElementById('peCdTot');if(t)t.textContent='Total del servicio: '+(Number.isFinite(su)?M(su):'S/ —')}catch(_){}return}
    if(PE.f&&k.startsWith('pe:pk:')){const [,,i,c]=k.split(':');pkSet(PE.f,+i,c,el.value);if(c==='cd'){const su=cdSuma(PE.f);if(Number.isFinite(su))PE.f.costo=String(su);try{const t=(root.getElementById?root:document).getElementById('peCdTot');if(t)t.textContent='Total del servicio: '+(Number.isFinite(su)?M(su):'S/ —')}catch(_){}}return}
     if(PE.f&&k.startsWith('pe:pkag:')){const i=+k.slice(8),f=PE.f,o=pkObj(f,i),v=el.value;if(!o)return;
       if(v==='__otra'){o.agOtra=1;pkSet(f,i,'ag','');pkSet(f,i,'dest','');pkSet(f,i,'agubi','');o.dsOtro=0}
       else if(v){const antes=String(pkGet(f,i,'ag')||'');o.agOtra=0;pkSet(f,i,'ag',v);if(agClave(antes)!==agClave(v)){pkSet(f,i,'dest','');o.dsOtro=0;pkSet(f,i,'agubi',nsAgU(v)||'')}}
       f.msg='';key='';pintar();return}
     if(PE.f&&k.startsWith('pe:pkds:')){const i=+k.slice(8),f=PE.f,o=pkObj(f,i),v=el.value;if(!o)return;
       if(v==='__otro'){o.dsOtro=1;pkSet(f,i,'dest','')}else if(v){o.dsOtro=0;pkSet(f,i,'dest',v)}
       f.msg='';key='';pintar();return}
     if(PE.f&&k.startsWith('pe:en:')){const [,,i,c]=k.split(':');const q=(PE.f.ents||[])[+i];if(q)q[c]=el.value;return}
     if(PE.f&&k.startsWith('pe:pr:')){const [,,L,j,c]=k.split(':');const P=prodsDe(PE.f,+L);if(P[+j])P[+j][c]=c==='c'?el.value.replace(/\D/g,''):el.value;prodsTxt(PE.f,+L);return}
     if(PE.f&&(k==='pe:ptcd1'||k.startsWith('pe:pt:'))){if(k==='pe:ptcd1')PE.f.cdp=el.value;else{const [,,i,c]=k.split(':');const q=(PE.f.pts||[])[+i];if(q)q[c]=el.value;if(c!=='cd')return}
       const su=ptSuma(PE.f);if(Number.isFinite(su))PE.f.costo=String(su);try{const t=root.getElementById('peCdTot');if(t)t.textContent='Total del servicio: '+(Number.isFinite(su)?M(su):'S/ —')}catch(_){}return}
     if(PE.f&&k.startsWith('pe:pq:')){const [,,i,c]=k.split(':');const q=PE.f.paqs[+i];if(q)q[c]=el.value;return}
    if(PE.f&&k==='pe:moto'){PE.f.moto=el.value;key='';pintar();return}
    if(PE.f&&k.startsWith('pe:')){PE.f[k.slice(3)]=el.value;peVivo();return}
    if(PE.f&&(k.startsWith('peq:')||k.startsWith('pep:'))){const x=PE.f.items[+k.slice(4)];if(x)x[k[2]==='q'?'q':'p']=el.value;peVivo();return}
    if(k==='mq'){mq=el.value;const g=root.getElementById('mG');if(g)g.innerHTML=HUBS[tab]&&tab!=='inicio'?hubSecs(tab):grupos()}}
  async function clic(e){
    if(e.target.closest('[data-lnk]'))return;/* llamar / WhatsApp del motorizado: abre el enlace sin abrir el pedido */
    tocando=false;
    const t=e.target.closest('[data-t]');if(t){cajon=false;ir(t.dataset.t);return}
    const mc=e.target.closest('[data-mc]');if(mc){motoSel=motoSel===mc.dataset.mc?'':mc.dataset.mc;limite=40;key='';pintar();return}
    const c=e.target.closest('[data-c]');if(c){chip=c.dataset.c;if(chip!=='moto')motoSel='';limite=40;key='';pintar();return}
    const o=e.target.closest('[data-o]');if(o){const s=SEL();if(selModo&&s){const id=String(o.dataset.o);s.has(id)?s.delete(id):s.add(id);key='';pintar();return}abrirPedido(o.dataset.o);return}
    const cm=e.target.closest('[data-cm]');if(cm){const c=C2.caja;const m=c&&c.data&&c.data.motos.find(x=>String(x.id)===cm.dataset.cm);if(m){Object.assign(CJ,{moto:m,pane:'recibir',rec:'',recNota:'',dar:'',darMot:'',darNota:'',msg:'',ok:'',lim:40,abierta:null});sub='cajamoto';key='';try{history.pushState({pdApp:1},'')}catch(_){}pintar()}return}
    const sm=e.target.closest('[data-sm]');if(sm){const c=C2.sueldo;const m=c&&c.data&&c.data.motos.find(x=>String(x.id)===sm.dataset.sm);if(m){Object.assign(SL,{moto:m,per:'',monto:'',nota:'',msg:'',ok:'',pest:'',modo:'pago',vista:null,dia:null,f:{},cfg:null});sub='sueldomoto';key='';try{history.pushState({pdApp:1},'')}catch(_){}pintar()}return}
    const sp=e.target.closest('[data-sp]');if(sp){SL.per=sp.dataset.sp;const r=calcS(SL.moto);const p=r&&(r.periods||[]).find(x=>x.key===SL.per);if(p)SL.monto=Math.max(0,p.balance).toFixed(2);key='';pintar();return}
    const cli=e.target.closest('[data-cli]');if(cli){const x=(C2.cli&&C2.cli.data||[]).find(y=>String(y.id)===cli.dataset.cli);if(x){CL.sel=x;sub='cliente';key='';try{history.pushState({pdApp:1},'')}catch(_){}pintar()}return}
    const en=e.target.closest('[data-env]');if(en){let s2=[];try{s2=JSON.parse(localStorage.getItem('pidemas-admin-masivo-enviados')||'[]')}catch(_){}if(!s2.includes(en.dataset.env)){s2.push(en.dataset.env);try{localStorage.setItem('pidemas-admin-masivo-enviados',JSON.stringify(s2))}catch(_){}}setTimeout(()=>{const b=root.getElementById('mvL');if(b&&SEC[secK]&&SEC[secK].lista)b.innerHTML=SEC[secK].lista()},300);return}
    const sx=e.target.closest('[data-sx]');if(sx){e.preventDefault();if(sx.disabled)return;sx.disabled=true;try{await slAccion(sx.dataset.sx)}catch(err){SL.msg=String(err&&err.message||err)}finally{sx.disabled=false;key='';pintar()}return}
    const sa=e.target.closest('[data-sa]');if(sa&&SEC[secK]){e.preventDefault();if(sa.disabled)return;sa.disabled=true;try{await SEC[secK].a(sa.dataset.sa)}catch(err){mal(String(err&&err.message||err))}finally{sa.disabled=false;key='';pintar()}return}
    const cp=e.target.closest('[data-cp]');if(cp){CJ.pane=cp.dataset.cp;CJ.msg='';CJ.ok='';key='';pintar();return}
    const mot=e.target.closest('[data-mot]');if(mot){CJ.darMot=mot.dataset.mot;key='';pintar();return}
    const cl=e.target.closest('[data-cl]');if(cl){const i=+cl.dataset.cl;CJ.abierta=CJ.abierta===i?null:i;key='';pintar();return}
    const dl=e.target.closest('[data-del]');if(dl){await cajaBorrar(dl.dataset.del,dl.dataset.cerrada==='1');key='';pintar();return}
    const rv=e.target.closest('[data-rv]');if(rv){e.preventDefault();await cajaRevision(rv.dataset.rv);key='';pintar();return}
    const g=e.target.closest('[data-g]');if(g){abiertoGr=abiertoGr===g.dataset.g?null:g.dataset.g;key='';pintar();return}
    const it=e.target.closest('[data-it]');if(it){cajon=false;nuevoAb=false}if(it&&NSV[it.dataset.it]){svcNuevo(it.dataset.it);return}if(it&&it.dataset.it==='pedidos'){ir('inicio');return}if(it&&(it.dataset.it==='cajas'||it.dataset.it==='sueldos'||it.dataset.it==='clientes')&&!SEC[it.dataset.it]){ir(it.dataset.it==='cajas'?'caja':it.dataset.it==='sueldos'?'sueldo':'clientes');return}if(it&&SEC[it.dataset.it]){abrirSec(it.dataset.it);return}if(it){const b=document.querySelector(`#pdMenu .m3It[data-txt="${CSS.escape(it.dataset.it)}"]`);if(b){marca='menu';kick=it.dataset.gk||'Administración';ultimo=((it.querySelector('.tx')||it.querySelector('span')||{}).textContent||'').trim();if(movido)volverLista();prepararPag();b.click();key='';pintar();setTimeout(pintar,80)}return}
    const chm=e.target.closest('[data-chmas]');if(chm){const c=chm.parentNode.querySelector('.chips');if(c){const fin=c.scrollLeft+c.clientWidth>=c.scrollWidth-4;c.scrollTo({left:fin?0:c.scrollLeft+Math.max(160,c.clientWidth*.6),behavior:'smooth'});setTimeout(()=>chm.classList.toggle('fin',c.scrollLeft+c.clientWidth>=c.scrollWidth-4),400)}return}
    const a=e.target.closest('[data-a]');if(!a)return;
    if(a.dataset.a.startsWith('cj:dia:')){if(a.disabled)return;a.disabled=true;try{await cajaAccion(a.dataset.a,a)}finally{key='';pintar()}return}
    if(PE.f&&a.dataset.a.startsWith('pe:cli:')){nsUsarCli(PE.f,a.dataset.a.slice(7));key='';pintar();return}
    if(PE.f&&a.dataset.a.startsWith('pe:mapa:')){const [,,k,dk,t]=a.dataset.a.split(':');const f=PE.f;const el2=window.pdMapa&&pdMapa.elegir;if(!el2)return;
      const r=await el2({titulo:decodeURIComponent(t||''),centro:coordsDe(f[k])});if(!r)return;const link='https://maps.google.com/?q='+Number(r.lat).toFixed(6)+','+Number(r.lng).toFixed(6);
      const lin=[r.linea,r.sub].filter(Boolean).join(', ');f[k]=link;if(k==='lugarUrl'){if(!String(f.lugar||'').trim()&&lin)f.lugar=lin}else if(dk&&!String(f[dk]||'').trim()&&lin)f[dk]=lin;f.tf=null;key='';pintar();return}
    if(PE.f&&a.dataset.a==='pe:tarifa'){const f=PE.f;f.tf={t:'Calculando…'};key='';pintar();
      try{const T=window.pdTarifa;await T.cargar();const dest=coordsDe(f.tipo==='compra'?f.ubi:f.eubi),orig=coordsDe(f.tipo==='compra'?f.lugarUrl:f.rubi);
        if(!dest){f.tf={mal:1,t:'Falta la ubicación de entrega: pega el enlace o márcala en el mapa.'}}
        else{let km=0,aprox=false;if(orig){const d=await T.distanciaRuta(orig,dest);km=d.km;aprox=d.aproximado}
          const t=T.calcular({km,destino:dest,aproximado:aprox});f.costo=t.total.toFixed(2);
          f.tf={t:'<b>'+M(t.total)+'</b>'+(km?' · '+km.toFixed(2)+' km'+(aprox?' (aprox.)':''):'')+(t.zona?' · Zona '+E(t.zona):'')+(orig?'':' · Sin ubicación de '+(f.tipo==='compra'?'la compra':'recojo')+': tarifa base o de zona')}}}
      catch(err){f.tf={mal:1,t:'No se pudo calcular: '+E(err?.message||err)}}key='';pintar();return}
    if(PE.f&&a.dataset.a.startsWith('pe:fotox:')){(PE.f.fotos||[]).splice(+a.dataset.a.slice(9),1);key='';pintar();return}
    if(PE.f&&a.dataset.a==='pe:pt+'){const f=PE.f;f.pts=f.pts||[];if(f.pts.length<5){f.pts.push({nom:'',tel:'',dir:'',ref:'',ubi:'',que:'',anom:'',cd:''});if(f.nuevo)f.paso=nsPasos(f).indexOf((f.tipo==='compra'?'Información de la compra · lugar ':'Punto de recojo ')+(f.pts.length+1));f.msg=''}key='';pintar();return}
    if(PE.f&&a.dataset.a.startsWith('pe:ptx:')){(PE.f.pts||[]).splice(+a.dataset.a.slice(7),1);if(!PE.f.pts.length)PE.f.cdp='';if(+PE.f.pagapt>1+PE.f.pts.length)PE.f.pagapt='1';PE.f.paso=Math.min(PE.f.paso||0,nsPasos(PE.f).length-1);key='';pintar();return}
    if(PE.f&&a.dataset.a.startsWith('pe:ptmapa:')){const q=(PE.f.pts||[])[+a.dataset.a.slice(10)];const el2=window.pdMapa&&pdMapa.elegir;if(!q||!el2)return;
      const r=await el2({titulo:(PE.f.tipo==='compra'?'Lugar de compra ':'Punto de recojo ')+(+a.dataset.a.slice(10)+2),centro:coordsDe(q.ubi)||coordsDe(PE.f.tipo==='compra'?PE.f.lugarUrl:PE.f.rubi)});if(!r)return;
      q.ubi='https://maps.google.com/?q='+Number(r.lat).toFixed(6)+','+Number(r.lng).toFixed(6);const lin=[r.linea,r.sub].filter(Boolean).join(', ');if(PE.f.tipo==='compra'){if(!String(q.nom||'').trim()&&lin)q.nom=lin}else if(!String(q.dir||'').trim()&&lin)q.dir=lin;key='';pintar();return}
    if(PE.f&&a.dataset.a.startsWith('pe:pqmapa:')){const q=PE.f.paqs[+a.dataset.a.slice(10)];const el2=window.pdMapa&&pdMapa.elegir;if(!q||!el2)return;
      const r=await el2({titulo:'Agencia '+String(q.ag||'').trim(),centro:coordsDe(q.agubi)||coordsDe(nsAgU(q.ag))});if(!r)return;
      q.agubi='https://maps.google.com/?q='+Number(r.lat).toFixed(6)+','+Number(r.lng).toFixed(6);key='';pintar();return}
    if(PE.f&&a.dataset.a.startsWith('pe:pks:')){const [,,i,c,...v]=a.dataset.a.split(':');pkSet(PE.f,+i,c,v.join(':'));key='';pintar();return}
    if(PE.f&&a.dataset.a.startsWith('pe:pkmapa:')){const i=+a.dataset.a.slice(10),f=PE.f;const el2=window.pdMapa&&pdMapa.elegir;if(!el2||!pkObj(f,i))return;
      const r=await el2({titulo:'Agencia '+String(pkGet(f,i,'ag')||'').trim(),centro:coordsDe(pkGet(f,i,'agubi'))||coordsDe(nsAgU(pkGet(f,i,'ag')))});if(!r)return;
      pkSet(f,i,'agubi','https://maps.google.com/?q='+Number(r.lat).toFixed(6)+','+Number(r.lng).toFixed(6));key='';pintar();return}
    if(PE.f&&a.dataset.a.startsWith('pe:pr+:')){const L=+a.dataset.a.slice(7);prodsDe(PE.f,L).push({n:'',c:'1'});key='';pintar();return}
    if(PE.f&&a.dataset.a.startsWith('pe:prx:')){const [,,L,j]=a.dataset.a.split(':');prodsDe(PE.f,+L).splice(+j,1);prodsTxt(PE.f,+L);key='';pintar();return}
    if(PE.f&&PE.f.agG&&a.dataset.a.startsWith('pe:agpq:')){const f=PE.f,gi=+a.dataset.a.slice(8);if(f.agG.reduce((x,y)=>x+y,0)>=8){f.msg='Máximo 8 paquetes por encomienda.';key='';pintar();return}
      const at=f.agG.slice(0,gi+1).reduce((x,y)=>x+y,0);f.paqs.splice(at-1,0,{ag:'',dest:'',tpago:'',tenv:'',ind:'',agubi:'',igual:'',rn:'',rd:'',rt:''});f.agG[gi]++;agSync(f);f.msg='';key='';pintar();return}
    if(PE.f&&PE.f.agG&&a.dataset.a.startsWith('pe:agpqx:')){const f=PE.f,k=+a.dataset.a.slice(9);if(k<1)return;let acc=0,gi=0;for(;gi<f.agG.length;gi++){if(k<acc+f.agG[gi])break;acc+=f.agG[gi]}
      if(gi<f.agG.length&&f.agG[gi]>1){f.paqs.splice(k-1,1);f.agG[gi]--}key='';pintar();return}
    if(PE.f&&PE.f.agG&&a.dataset.a.startsWith('pe:agx:')){const f=PE.f,gi=+a.dataset.a.slice(7);if(gi<1||gi>=f.agG.length)return;const st=f.agG.slice(0,gi).reduce((x,y)=>x+y,0);f.paqs.splice(st-1,f.agG[gi]);f.agG.splice(gi,1);f.paso=Math.min(f.paso||0,nsPasos(f).length-1);key='';pintar();return}
    if(PE.f&&PE.f.agG&&a.dataset.a==='pe:ag+'){const f=PE.f;if(f.agG.length<4&&f.agG.reduce((x,y)=>x+y,0)<8){f.agG.push(1);agTotal(f);f.paso=nsPasos(f).indexOf('Agencia '+f.agG.length)}key='';pintar();return}
    if(PE.f&&a.dataset.a==='pe:en+'){const f=PE.f;f.ents=f.ents||[];if(f.ents.length<5){f.ents.push({nom:'',tel:'',dir:'',ref:'',ubi:'',que:''});f.paso=nsPasos(f).indexOf('Entrega '+(f.ents.length+1))}key='';pintar();return}
    if(PE.f&&a.dataset.a.startsWith('pe:enx:')){(PE.f.ents||[]).splice(+a.dataset.a.slice(7),1);PE.f.paso=Math.min(PE.f.paso||0,nsPasos(PE.f).length-1);key='';pintar();return}
    if(PE.f&&a.dataset.a.startsWith('pe:enmapa:')){const i=+a.dataset.a.slice(10),q=(PE.f.ents||[])[i];const el2=window.pdMapa&&pdMapa.elegir;if(!q||!el2)return;
      const r=await el2({titulo:'Entrega '+(i+2),centro:coordsDe(q.ubi)||coordsDe(PE.f.eubi)});if(!r)return;q.ubi='https://maps.google.com/?q='+Number(r.lat).toFixed(6)+','+Number(r.lng).toFixed(6);const lin=[r.linea,r.sub].filter(Boolean).join(', ');if(!String(q.dir||'').trim()&&lin)q.dir=lin;key='';pintar();return}
    if(PE.f&&a.dataset.a.startsWith('pe:cnt:')){const [,,k,v]=a.dataset.a.split(':'),n=Math.max(1,+v||1),f=PE.f;
      if(k==='pts'){f.pts=f.pts||[];while(f.pts.length<n-1)f.pts.push({nom:'',tel:'',dir:'',ref:'',ubi:'',que:'',anom:'',cd:'',prods:[{n:'',c:'1'}]});if(f.pts.length>n-1)f.pts.splice(n-1);if(!f.pts.length)f.cdp='';if(+f.pagapt>1+f.pts.length)f.pagapt='1'}
      if(k==='ents'){f.ents=f.ents||[];while(f.ents.length<n-1)f.ents.push({nom:'',tel:'',dir:'',ref:'',ubi:'',que:''});if(f.ents.length>n-1)f.ents.splice(n-1)}
      if(k==='ags'){f.agG=(f.agG||[1]).slice(0,n);while(f.agG.length<n)f.agG.push(1);agTotal(f)}
      if(/^agp\d+$/.test(k)){f.agG=f.agG||[1];const gi=+k.slice(3);if(gi<f.agG.length){f.agG[gi]=n;agTotal(f)}}
      if(k==='paqs'){f.paqs=f.paqs||[];while(f.paqs.length<n-1)f.paqs.push({ag:'',dest:'',tpago:'',tenv:'',ind:'',agubi:'',igual:'',rn:'',rd:'',rt:''});if(f.paqs.length>n-1)f.paqs.splice(n-1)}
      key='';pintar();return}
    if(PE.f&&a.dataset.a==='pe:pqadd'){const f=PE.f;f.paqs=f.paqs||[];if(f.paqs.length<4){f.paqs.push({ag:'',dest:'',tpago:'',tenv:'',ind:'',agubi:'',igual:'',rn:'',rd:'',rt:''});f.paso=nsPasos(f).indexOf('Paquete '+(f.paqs.length+1));f.msg=''}key='';pintar();return}
    if(PE.f&&a.dataset.a.startsWith('pe:cant:')){const n=Math.max(1,Math.min(3,+a.dataset.a.slice(8)||1)),f=PE.f;f.paqs=f.paqs||[];
      while(f.paqs.length<n-1)f.paqs.push({ag:'',dest:'',tpago:'',tenv:'',ind:'',agubi:'',igual:'',rn:'',rd:'',rt:''});
      if(f.paqs.length>n-1)f.paqs.splice(n-1);key='';pintar();return}
    if(PE.f&&a.dataset.a==='pe:pq+'){if(PE.f.paqs.length<2)PE.f.paqs.push({ag:'',dest:'',tpago:'',tenv:'',ind:'',agubi:'',igual:'',rn:'',rd:'',rt:''});key='';pintar();return}
    if(PE.f&&a.dataset.a.startsWith('pe:pqx:')){PE.f.paqs.splice(+a.dataset.a.slice(7),1);const P=nsPasos(PE.f);PE.f.paso=Math.min(PE.f.paso||0,P.length-1);key='';pintar();return}
    if(PE.f&&a.dataset.a==='pe:crear'){if(a.disabled)return;const f=PE.f;
      if(typeof window.pdServicioAbierto==='function'&&!window.pdServicioAbierto()&&!(await conf('Pidemás recibe pedidos de 9:00 a. m. a 9:30 p. m. ¿Quieres registrar este servicio de todas formas?')))return;
      a.disabled=true;a.textContent='Creando pedido…';const win=f.moto?window.open('about:blank','_blank'):null;
      try{const id=await svcCrear(f,win);if(id){ok('Pedido creado');PE.f=null;sub=null;key='';pintar();setTimeout(()=>{try{window.pdAbrirPasosAdmin&&window.pdAbrirPasosAdmin(id)}catch(_){}},300);return}else if(win)win.close()}
      catch(err){if(win)win.close();f.msg='No se pudo crear: '+(err?.message||err)}
      key='';pintar();if(f.msg){mal(f.msg);const er=root.querySelector('.err');if(er)er.scrollIntoView({block:'center'})}return}
    if(PE.f&&(a.dataset.a==='pe:sig'||a.dataset.a==='pe:atr')){const f=PE.f;f.msg='';
        if(a.dataset.a==='pe:sig'){const m=nsFalta(f);if(m){f.msg=m;key='';pintar();mal(m);const er=root.querySelector('.err');if(er)er.scrollIntoView({block:'center'});return}f.paso=Math.min((f.paso||0)+1,nsPasos(f).length-1)}
        else f.paso=Math.max(0,(f.paso||0)-1);
        key='';pintar();const l=root.querySelector('.list');if(l)l.scrollTop=0;return}
      if(PE.f&&a.dataset.a.startsWith('pe:mo:')){const v=a.dataset.a.slice(6);PE.f.moto=String(PE.f.moto)===v?'':v;key='';pintar();return}
      if(PE.f&&a.dataset.a.startsWith('pe:pqs:')){const [,,i,k,...v]=a.dataset.a.split(':');const q=PE.f.paqs[+i];if(q)q[k]=v.join(':');key='';pintar();return}
      if(PE.f&&/^pe:(ag|ds):\d+$/.test(a.dataset.a)){const [,t,k]=a.dataset.a.split(':'),f=PE.f;
        if(t==='ag'){const x=(PE.ags||[])[+k];if(x){if(String(f.ag).trim().toLowerCase()!==String(x.nombre).trim().toLowerCase()){f.dest='';f.agubi=''}f.ag=x.nombre;const u=nsAgU(x.nombre);if(u&&!coordsDe(f.agubi))f.agubi=u}}
        else{const x=nsDsL(f.ag)[+k];if(x)f.dest=x.destino_final}
        key='';pintar();return}
      if(PE.f&&/^pe:pq(ag|ds):\d+:\d+$/.test(a.dataset.a)){const [,t,i,k]=a.dataset.a.split(':'),q=PE.f.paqs[+i];
        if(q){if(t==='pqag'){const x=(PE.ags||[])[+k];if(x){if(String(q.ag).trim().toLowerCase()!==String(x.nombre).trim().toLowerCase()){q.dest='';q.agubi=''}q.ag=x.nombre;const u=nsAgU(x.nombre);if(u&&!coordsDe(q.agubi))q.agubi=u}}else{const x=nsDsL(q.ag)[+k];if(x)q.dest=x.destino_final}}
        key='';pintar();return}
      if(PE.f&&a.dataset.a.startsWith('pe:set:')){const [,,k,...v]=a.dataset.a.split(':');PE.f[k]=v.join(':');if(k==='pide'&&PE.f.tipo==='recojo'){PE.f.quien=PE.f.pide;PE.f.cli=null}if(k==='pide'&&PE.f.tipo==='enc'){PE.f.cli=null;PE.f.quien=PE.f.pide}if(k==='para'&&PE.f.tipo==='compra')PE.f.quien='envia';key='';pintar();return}
    if(PE.f&&a.dataset.a.startsWith('pe:met:')){PE.f.metodo=a.dataset.a.slice(7);key='';pintar();return}
    if(PE.f&&a.dataset.a.startsWith('pe:quitar:')){const i=+a.dataset.a.slice(10),x=PE.f.items[i];if(x&&PE.f.items.length>1){PE.f.quitar.push(x.id);PE.f.items.splice(i,1);key='';pintar()}else if(x){(window.pdAviso||alert)('El pedido debe tener al menos un producto.')}return}
    switch(a.dataset.a){
      case 'hub':volverTab(false);break;
      case 'cajon':if(!cajon&&paginaVieja())cerrarVieja();cajon=!cajon;if(cajon){abiertoGr=null;mq='';cajonT=Date.now();try{history.pushState({pdApp:1,cajon:1},'')}catch(_){}}else if(history.state&&history.state.cajon){ignorarPop=true;history.back()}key='';pintar();break;
      case 'act':{a.classList.add('spin');const r=$('refreshOrders');if(r)r.click();else try{await window.loadOrders()}catch(_){}setTimeout(()=>{key='';pintar()},800);break}
      case 'bell':{SF['__avisos']=SF['__avisos']||{};SF['__avisos'].vis=Number((()=>{try{return localStorage.getItem('pdaAvisosVisto')}catch(_){return 0}})())||0;SF['__avisos'].c='todos';abrirSec('__avisos');setTimeout(()=>{try{window.pdaAvisos&&window.pdaAvisos.marcarVisto()}catch(_){}},1500);break}
      case 'atendidos':chip='entregado';limite=40;tab='inicio';key='';pintar();break;
      case 'nuevo':nuevoAb=!nuevoAb;key='';pintar();break;
      case 'nuevoX':nuevoAb=false;key='';pintar();break;
      case 'selmodo':{selModo=!selModo;const s=SEL();if(!selModo&&s)s.clear();key='';pintar();break}
      case 'seleditar':{const s2=SEL();if(!s2||s2.size!==1)break;const id=[...s2][0];selModo=false;s2.clear();await pedidoEditar(id);break}
      case 'borrar':{const s=SEL();if(!s||!s.size||a.disabled)break;a.disabled=true;try{await borrarSel(s)}catch(err){console.error('Eliminar pedidos:',err);(window.pdAviso||alert)('No se pudo eliminar: '+String(err?.message||err))}finally{a.disabled=false}if(!s.size)selModo=false;key='';pintar();break}
      case 'mas':limite+=40;key='';pintar();break;
      case 'volver':if(sub==='sueldomoto'&&SL.vista){cerrarV();SL.msg='';key='';pintar();break}sub=null;key='';pintar();if(history.state?.pdApp){ignorarPop=true;history.back()}break;
      case 'cj:act':if(C2.caja)C2.caja.t=0;datosCaja(true);key='';pintar();break;
      case 'cj:uno':await recargaMoto();break;
      case 'sl:act':if(C2.sueldo)C2.sueldo.t=0;datosSueldo(true);key='';pintar();break;
      case 'cl:nuevo':CL.f={id:'',nombre:'',tel:'',dni:'',dir:'',ubi:'',msg:''};{const q=CL.q.trim();if(q){if(/^\d[\d\s]{5,}$/.test(q))CL.f.tel=q.replace(/\s/g,'');else CL.f.nombre=q}}if(!sub)try{history.pushState({pdApp:1},'')}catch(_){}sub='clienteform';key='';pintar();break;
      case 'cl:editar':{const x=CL.sel;CL.f={id:x.id,nombre:cliN(x),tel:cliT(x),dni:x.documento||x.dni||'',dir:x.direccion||'',ubi:cliU(x),msg:''};sub='clienteform';key='';pintar();break}
      case 'cl:sig':{const f=CL.f;if(!f)break;f.msg=!f.nombre.trim()?'Escribe el nombre del cliente.':!f.tel.trim()?'Escribe el número del cliente.':'';if(!f.msg)f.paso=1;key='';pintar();break}
      case 'cl:atras':if(CL.f){CL.f.paso=0;CL.f.msg=''}key='';pintar();break;
      case 'cl:guardar':{if(a.disabled)break;a.disabled=true;try{await cliGuardar()}finally{key='';pintar()}break}
      case 'cl:borrar':await cliBorrar();break;
      case 'pe:guardar':{if(a.disabled)break;a.disabled=true;a.textContent='Guardando…';try{await pedidoGuardar()}catch(err){if(PE.f)PE.f.msg='No se pudo guardar: '+(err?.message||err)}finally{if(PE.f){key='';pintar();if(PE.f.msg){(window.pdAviso||alert)(PE.f.msg);const er=root.querySelector('.err');if(er)er.scrollIntoView({block:'center'})}}}break}
      case 'cl:mas':CL.lim+=60;{const b=root.getElementById('clL');if(b)b.innerHTML=clFilas()}break;
      case 'sec:rf':recargar(secK);key='';pintar();break;
      case 'cj:mas':CJ.lim+=40;key='';pintar();break;
      case 'cj:recibir':case 'cj:dif':case 'cj:dar':{if(a.disabled)break;a.disabled=true;try{await cajaAccion(a.dataset.a,a)}finally{key='';pintar()}break}
      case 'perfil':{cajon=false;if(SF['__perfil'])SF['__perfil'].vista=null;abrirSec('__perfil');break;ultimo='Mi perfil';marca='menu';kick='Mi cuenta';const b=document.querySelector('#pdMenu .m3Top');if(b)b.click();setTimeout(()=>{key='';pintar()},120);break}
      case 'salir':{if(!(await conf('¿Cerrar sesión en este teléfono? Dejarás de recibir avisos de pedidos aquí.')))break;const b=document.querySelector('#pdMenu .m3Out');if(b)b.click();else document.getElementById('logout')?.click();break}
    }
  }
  addEventListener('popstate',()=>{if(window.__pdPopPropio)return;if(ignorarPop){ignorarPop=false;return}if(sub==='sec'&&secK==='__perfil'&&SF['__perfil']&&SF['__perfil'].vista==='clave'){SF['__perfil'].vista=null;key='';pintar();return}if(cajon){if(Date.now()-cajonT<600)return;cajon=false;key='';pintar();return}if(sub==='sueldomoto'&&SL.vista){SL.vista=null;SL.msg='';key='';pintar();return}if(sub){sub=null;key='';pintar();return}if(desde.length){volverTab(true)}});
  setInterval(pintar,600);
  /* Aviso cuando un pedido se entrega: dice si el motorizado quedó libre */
  {const FIN=/^(entregado|completado|finalizado)$/,CERR=/^(entregado|completado|finalizado|cancelad[oa]|anulado|rechazado|no_entregado)$/;let prev=null;let th=null,tr=null,tq=0;
    function tostada(t,s2,id){
      if(!th){th=document.createElement('pd-aviso-entrega');th.setAttribute('data-pd-aislado','1');tr=th.attachShadow({mode:'open'});
        tr.innerHTML=`<style>:host{all:initial;position:fixed;left:12px;right:12px;top:calc(env(safe-area-inset-top,0px) + 12px);z-index:2147483600;display:none;font-family:PdInter,Inter,system-ui,sans-serif}
.t{max-width:520px;margin:0 auto;display:flex;align-items:center;gap:12px;padding:12px 12px 12px 14px;border-radius:18px;background:#FFFFFF;border:1px solid #CDEBD8;box-shadow:0 12px 30px rgba(31,26,23,.16);cursor:pointer;animation:a .2s ease-out}
@keyframes a{from{transform:translateY(-8px);opacity:0}to{transform:none;opacity:1}}
.i{flex:0 0 42px;width:42px;height:42px;border-radius:50%;background:#E9F6EE;color:#15803D;display:flex;align-items:center;justify-content:center}
.x{flex:1 1 0%;min-width:0;display:flex;flex-direction:column}.x b{font-size:15.5px;color:#1F1A17}.x span{font-size:13.5px;color:#0F5E2E;font-weight:700}
.c{all:unset;cursor:pointer;width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#6B5E55;font-size:20px}</style>
<div class="t" role="status"><span class="i"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><span class="x"><b></b><span></span></span><button type="button" class="c" aria-label="Cerrar">×</button></div>`;
        tr.querySelector('.c').addEventListener('click',e=>{e.stopPropagation();th.style.display='none'});
        tr.querySelector('.t').addEventListener('click',()=>{th.style.display='none';const i=th.dataset.id;if(i)try{abrirPedido(i)}catch(_){}});
        document.body.appendChild(th)}
      tr.querySelector('.x b').textContent=t;tr.querySelector('.x span').textContent=s2;th.dataset.id=id||'';th.style.display='block';
      clearTimeout(tq);tq=setTimeout(()=>{th.style.display='none'},9000);
      try{if(window.PdSound&&!window.PdSound.on)throw 0;const C=window.AudioContext||window.webkitAudioContext;const c=new C();[0,.16].forEach((d,i)=>{const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=i?1046:784;g.gain.setValueAtTime(.16,c.currentTime+d);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+d+.28);o.connect(g).connect(c.destination);o.start(c.currentTime+d);o.stop(c.currentTime+d+.3)});navigator.vibrate&&navigator.vibrate([120,60,120])}catch(_){}
    }
    setInterval(()=>{const L2=L();if(!L2.length)return;
      if(!prev){prev=new Map(L2.map(o=>[String(o.id),est(o)]));return}
      for(const o of L2){const id=String(o.id),e=est(o),a=prev.get(id);prev.set(id,e);
        if(a&&a!==e&&FIN.test(e)){
          const mid=o.motorizado_id,m=MOTOS().find(x=>String(x.id)===String(mid)),nom=(m&&m.nombre_completo)||o.motorizado_nombre||'El motorizado';
          const quedan=mid?L2.filter(x=>String(x.motorizado_id)===String(mid)&&String(x.id)!==id&&!CERR.test(est(x))).length:-1;
          tostada('Pedido '+ref(id)+' entregado',quedan<0?'Pedido cerrado':quedan===0?nom+' ya está libre':nom+' sigue con '+quedan+' pedido'+(quedan===1?'':'s'),id)}}
    },2000);}
  window.pdAppAdm={pintar,ir,navEnDetalle:false,navH:()=>navH&&navH.style.display!=='none'?navH.getBoundingClientRect().height:0};
})();

