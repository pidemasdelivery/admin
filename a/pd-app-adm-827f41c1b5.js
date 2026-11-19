
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
    'inicio':{t:'Pedidos',ic:'box'},
    'h:caja':{t:'Caja',ic:'cash',k:'Control de caja y sueldos',sec:[['',[['t:caja','Cajas de motorizados','cash'],['yape por confirmar','Yape por confirmar','phone'],['resumen del día','Resumen del día','chart'],['alerta de caja alta','Alerta de caja alta','alert'],['cancelados con cobro','Cancelados con cobro','x']]],['Sueldos',[['t:sueldo','Sueldos de motorizados','wallet'],['planilla de sueldos','Planilla de sueldos','list']]]]},
    'h:neg':{t:'Negocios',ic:'store',k:'Negocios',sec:[['',[['configurar negocios','Configurar negocios','store'],['crear negocio','Crear negocio','plus'],['solicitudes de afiliación','Solicitudes de afiliación','tag'],['por cobrar a negocios','Por cobrar a negocios','cash'],['por pagar a negocios','Por pagar a negocios','wallet']]],['Servicios',[['recojo y entrega','Recojo y entrega','swap'],['compra','Compra','cash'],['encomienda','Encomienda','box'],['tarifas','Tarifas','tag'],['agencias','Agencias','pin']]]]},
    'h:eq':{t:'Equipo',ic:'group',k:'Equipo',sec:[['Motorizados',[['motorizados / gps','Motorizados y GPS','pin'],['crear motorizado','Crear motorizado','plus'],['suspender / reactivar cuentas','Suspender o reactivar','shield']]],['Clientes',[['t:clientes','Clientes','group'],['lista negra','Lista negra','x'],['mensajes masivos por whatsapp','Mensajes masivos','send']]]]},
    'h:mas':{t:'Más',ic:'grid',k:'Más',sec:[['Pedidos',[['pedidos con demora','Pedidos con demora','clock'],['asignación automática','Asignación automática','swap'],['calificaciones','Calificaciones','star'],['reportes de pedidos','Reportes de pedidos','chart'],['ranking de negocios y motorizados','Ranking','star']]],['Configuración',[['horario','Horario de Pidemás','clock'],['qr yape','QR Yape','phone'],['códigos de descuento','Códigos de descuento','tag'],['registro de acciones','Registro de acciones','list']]],['Mi cuenta',[['a:perfil','Mi perfil','user']]]]}
  };
  const NAVK=['inicio','h:caja','h:neg','h:eq','h:mas'];
  const HUBDE={caja:'h:caja',sueldo:'h:caja',clientes:'h:eq',menu:'h:mas'};
  const bdOf=k=>{const b=document.querySelector(`#pdMenu .m3It[data-txt="${CSS.escape(k)}"]`);return b?Number(((b.querySelector('.pdCtlBdg,.bdg')||{}).textContent||'').trim())||0:0};
  const hubBd=h=>h==='inicio'?L().filter(CH[1][2]).length:(HUBS[h].sec||[]).reduce((s,[,its])=>s+its.reduce((a,x)=>a+(/^[ta]:/.test(x[0])?0:bdOf(x[0])),0),0);
  const GIC={'Negocios':IC.store,'Servicios':IC.swap,'Motorizados':IC.moto,'Control de caja y sueldos':IC.cash,'Control de pedidos':IC.shield,'Clientes':IC.group,'Más':IC.tag};
  const ESTILO=PdPasos.css+`
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
.chips{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px}
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
  let host=null,root=null,topH=null,topR=null,tab='inicio',key='',keyTop='',scrollMem={},tocando=false;
  let ultimo='',marca='inicio',kick='Administración',chip='',q='',selModo=false,limite=40,abiertoGr=null,mq='',movido=null;
  const SEL=()=>{try{return selectedOrders}catch(e){return null}};

  /* =============== INICIO (pedidos) =============== */
  const CH=[['','Todos',()=>true],['nuevo','Por atender',o=>['pendiente','confirmado','pedido_recibido','nuevo'].includes(est(o))],['asignado','Asignados',o=>est(o)==='asignado'],['camino','En camino',o=>['aceptado','pedido_aceptado','en_camino','camino_recojo'].includes(est(o))],['entrega','En entrega',o=>['en_entrega','camino_entrega','confirmando_pago'].includes(est(o))],['entregado','Entregados',o=>est(o)==='entregado'],['cancelado','Cancelados',o=>['cancelado','rechazado'].includes(est(o))]];
  const fase=o=>{try{if(window.pdUDatos&&pdUDatos.fase)return pdUDatos.fase(o)}catch(e){}const s=est(o);return s==='entregado'?{n:5,txt:'Entregado',k:'ok'}:s==='cancelado'?{n:0,txt:'Cancelado',k:'no'}:{n:1,txt:typeof orderStatusLabel==='function'?orderStatusLabel(s):s,k:'new'}};
  function tarjeta(o){
    const f=fase(o),n=NEG(o.negocio_id||o.restaurante_id),sv=svc(o),s=SEL(),marc=selModo&&s&&s.has(String(o.id));
    const bars=[1,2,3,4,5].map(k=>`<i class="${f.n===0?'':k<f.n||f.n===5?'d':k===f.n?'a':''}"></i>`).join('');
    const mo=o.motorizado_id?(MOTOS().find(m=>String(m.id)===String(o.motorizado_id))||{}).nombre_completo||o.motorizado_nombre||'':'';
    const hace=o.creado_en?Math.max(0,Math.round((Date.now()-T(o.creado_en))/60000)):null;
    return `<button type="button" class="oc${marc?' sl2':f.k==='new'?' a':''}" data-o="${E(o.id)}"><span class="r1">${selModo?`<span class="sel${marc?' on':''}">${marc?IC.check:''}</span>`:''}<b>${E(ref(o.id))}</b><small>${hace==null?'':hace<1?'ahora':hace<60?'hace '+hace+' min':fecha(o.creado_en)}</small><em>${M(o.total)}</em></span>
      <span class="pls"><span class="pl${f.k==='ok'?' g':f.k==='no'?' r':''}">${E(f.txt)}</span><span class="pl n">${E(n.nombre||sv||'Pedido')}</span>${mo?`<span class="pl n">${E(mo.split(' ')[0])}</span>`:''}</span>
      ${f.n?`<span class="bars" style="grid-template-columns:repeat(5,minmax(0,1fr))">${bars}</span>`:''}
      <span class="ad">${IC.user}<span style="min-width:0"><b>${E(o.nombre_cliente||o.nombre_remitente||'Cliente')}</b><span>${E([o.telefono_cliente,o.direccion_entrega].filter(Boolean).join(' · '))}</span></span></span></button>`;
  }
  let nuevoAb=false;
  function inicio(){
    const sal=document.querySelector('.pdSal');const kp=[...(sal?sal.querySelectorAll('.pmaAcc > button b'):[])].map(b=>b.textContent.trim());if(window.__pdaSueldoTotal!=null)kp[1]=M(window.__pdaSueldoTotal);if(window.__pdaCajaTotal!=null)kp[2]=M(window.__pdaCajaTotal);
    const con=sal&&sal.querySelector('.con');const nom=((sal&&sal.querySelector('.pmaTx strong'))||{}).textContent||'Hola, Admin';
    const av=document.querySelector('#pdMenu .m3Av');const foto=window.__pdAdminFoto||'';
    const todos=L(),cnt=CH.map(c=>todos.filter(c[2]).length);
    const ql=q.trim().toLowerCase();const fil=todos.filter((CH.find(c=>c[0]===chip)||CH[0])[2]).filter(o=>!ql||[o.id,ref(o.id),o.nombre_cliente,o.telefono_cliente,o.nombre_remitente,NEG(o.negocio_id).nombre].join(' ').toLowerCase().includes(ql));
    let h=`<div class="cols2"><button type="button" class="mt" data-t="sueldo"><span>Sueldos</span><b>${E(kp[1]||'—')}</b></button><button type="button" class="mt" data-t="caja"><span>Cajas</span><b>${E(kp[2]||'—')}</b></button></div>`;
    h+=`<div class="fld"><label for="aQ" style="position:absolute;width:1px;height:1px;overflow:hidden">Buscar pedido</label><input id="aQ" type="search" placeholder="N.º de pedido, cliente o teléfono" value="${E(q)}" data-in="q"></div>`;
    {const AT=[['pedidos con demora','Con demora',IC.clock],['asignación automática','Asignación automática',IC.swap],['calificaciones','Calificaciones',IC.star],['reportes de pedidos','Reportes',IC.chart]];
     h+=`<div class="atj">${AT.map(([k,n,ic])=>{const x=bdOf(k);return `<button type="button" data-it="${E(k)}" data-gk="Pedidos">${ic}${E(n)}${x?`<span class="bd">${x}</span>`:''}</button>`}).join('')}</div>`}
    h+=`<div class="chW"><div class="chips">${CH.map((c,i)=>`<button type="button" data-c="${c[0]}" class="${chip===c[0]?'on':''}">${c[1]}${cnt[i]?' · '+cnt[i]:''}</button>`).join('')}</div></div>`;
    h+=`<div class="row" style="justify-content:space-between"><div class="lbl" style="margin:0">${fil.length} pedido${fil.length===1?'':'s'}</div><button type="button" class="b" style="height:40px;padding:0 14px" data-a="selmodo">${selModo?'Listo':'Seleccionar'}</button></div>`;
    h+=`<div id="aLista" style="display:flex;flex-direction:column;gap:10px">${lista(fil)}</div>`;
    if(!selModo){h+=`<div style="height:76px"></div><button type="button" class="fabN" data-a="nuevo" aria-label="Nuevo servicio">${IC.plus}</button>`;
      if(nuevoAb)h+=`<div class="fabV" data-a="nuevoX"></div><div class="fabS" role="dialog" aria-label="Nuevo servicio"><div class="lbl" style="margin:0 0 4px">Nuevo servicio</div>${[['recojo y entrega','Recojo y entrega','Recoge y lleva a otro lugar',IC.swap],['compra','Compra','Compramos lo que el cliente pida',IC.cash||IC.swap],['encomienda','Encomienda','Lleva paquetes a la agencia',IC.box||IC.swap]].map(x=>`<button type="button" class="tl" data-it="${x[0]}"><span class="ic">${x[3]}</span><span class="tx"><b>${x[1]}</b><span>${x[2]}</span></span>${IC.chev}</button>`).join('')}</div>`}
    const nb=Number((($('pdaBell')||{}).querySelector?.('.pdaBadge,.badge,b,span')||{}).textContent)||0;
    const f=new Date().toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'short',timeZone:'America/Lima'}).replace('.','');
    const s=SEL(),ns=s?s.size:0;
    return {head:`<div class="hd"><span class="ava"${foto?` style="background-image:url('${E(foto)}')"`:''}>${foto?'':E(((av||{}).textContent||'A').trim().charAt(0))}</span><div style="flex:1 1 0%;min-width:0"><div class="kick" style="color:#6B5E55">${E(f)}</div><div class="h1" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${E(nom)}</div>${con?`<span class="con ${E(con.className.replace('con','').trim())}"><i></i>${E((con.textContent||'').trim())}</span>`:''}</div><button type="button" class="ib" data-a="act" aria-label="Actualizar">${IC.refresh}</button><button type="button" class="ib" data-a="bell" aria-label="Avisos">${IC.bell}${nb?`<span class="bd">${nb>99?'99+':nb}</span>`:''}</button></div>`,
      body:h,foot:selModo?`<div style="display:flex;gap:10px"><button type="button" class="b" style="flex:1 1 0;height:54px;font-size:16px;${ns===1?'':'opacity:.45'}" data-a="seleditar"${ns===1?'':' disabled'}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>Editar</button><button type="button" class="b o" style="flex:1.4 1 0;height:54px;font-size:16px;background:${ns?'#B42318':'#D8CBC1'}" data-a="borrar"${ns?'':' disabled'}>${IC.trash}Eliminar${ns?' '+ns:''}</button></div>${ns>1?'<div style="text-align:center;font-size:13px;color:#6B5E55;margin-top:6px">Para editar, marca un solo pedido</div>':''}`:''};
  }
  function lista(fil){return fil.length?fil.slice(0,limite).map(tarjeta).join('')+(fil.length>limite?`<button type="button" class="b mas" data-a="mas">Ver ${Math.min(40,fil.length-limite)} más</button>`:''):`<div class="vac">${q||chip?'No hay pedidos con ese filtro.':'Todavía no hay pedidos.'}</div>`}

  /* =============== MENÚ =============== */
  function menu(){
    const m=$('pdMenu');let h='';
    const top=m&&m.querySelector('.m3Top'),nom=top?(top.querySelector('strong')||{}).textContent||'Admin':'Admin';const foto=window.__pdAdminFoto||'';
    h+=`<button type="button" class="yo" data-a="perfil"><span class="ava"${foto?` style="background-image:url('${E(foto)}')"`:''}>${foto?'':E(nom.trim().charAt(0))}</span><span style="flex:1 1 0%;min-width:0"><b style="display:block;font-size:18px">${E(nom)}</b><span style="font-size:13px;color:#6B5E55">Ver mi perfil</span></span>${IC.chev}</button>`;
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
    if(h==='h:caja'){try{caja()}catch(_){}try{sueldos()}catch(_){}const t=window.__pdaCajaTotal,ts=window.__pdaSueldoTotal;b+=`<div class="hkp"><div><span>En cajas</span><b class="o">${t!=null?M(t):'—'}</b></div><div><span>Sueldos por pagar</span><b>${ts!=null?M(ts):'—'}</b></div></div>`}
    if(h==='h:mas'){const m=$('pdMenu'),top=m&&m.querySelector('.m3Top'),nom=top?(top.querySelector('strong')||{}).textContent||'Admin':'Admin',foto=window.__pdAdminFoto||'';
      b+=`<button type="button" class="yo" data-a="perfil"><span class="ava"${foto?` style="background-image:url('${E(foto)}')"`:''}>${foto?'':E(nom.trim().charAt(0))}</span><span style="flex:1 1 0%;min-width:0"><b style="display:block;font-size:18px">${E(nom)}</b><span style="font-size:13px;color:#6B5E55">Ver mi perfil</span></span>${IC.chev}</button>`;
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
    const fila=(x,del)=>{const k=P.kind(x),a=P.amount(x),inc=x.tipo==='ingreso',rv=String(x.revision||'');
      return `<div class="mv"><span class="ic" style="background:${inc?'#FDEBDF':'#F6EFE9'};color:${inc?'#C4410C':'#6B5E55'}">${inc?IC.cash:IC.wallet}</span><span class="tx"><b>${E(P.LABEL[k]||'Movimiento')}${rv==='pendiente'?' <span class="pl m">Por revisar</span>':rv==='rechazado'?' <span class="pl r">Rechazado</span>':rv==='aprobado'?' <span class="pl g">Aprobado</span>':''}</b><span>${E(P.clean(x))} · ${E(hora(x.creado_en))}${x.pedido_id?' · '+E(ref(x.pedido_id)):''}</span>${x.comprobante_url?`<span><a href="${E(x.comprobante_url)}" target="_blank" rel="noopener" style="color:#C4410C;font-weight:700">Ver comprobante</a>${rv==='pendiente'&&del?` · <a href="#" data-rv="aprobado:${E(x.id)}" style="color:#0F5E2E;font-weight:700">Aprobar</a> · <a href="#" data-rv="rechazado:${E(x.id)}" style="color:#B42318;font-weight:700">Rechazar</a>`:''}</span>`:''}</span><span class="am">${inc?'+':'−'} ${M(a)}</span>${del?`<button type="button" class="ib" style="width:34px;height:34px;flex:0 0 34px;color:#B42318" data-del="${E(x.id)}" aria-label="Borrar movimiento">${IC.x}</button>`:''}</div>`};
    const grp=(L2,del)=>{last='';return L2.map(x=>{const k=diaL(x.creado_en);const t=k!==last?`<div class="lbl" style="margin:10px 0 0">${E(k)}</div>`:'';last=k;return t+fila(x,del)}).join('')};
    h+=`<div class="cd"><div class="lbl">Movimientos de la caja abierta</div>${cur.length?grp(cur.slice(0,CJ.lim),true)+(cur.length>CJ.lim?`<button type="button" class="b" data-a="cj:mas">Ver ${cur.length-CJ.lim} más</button>`:''):'<div style="color:#6B5E55;font-size:15px">Sin movimientos desde la última entrega.</div>'}</div>`;
    const cl=sp.closed;
    h+=`<div class="cd"><div class="lbl">Cajas entregadas</div>${cl.length?cl.slice(0,15).map((x,i)=>{const amt=P.amount(x.closer),rs=P.kind(x.closer)==='reinicio',df=Number(x.closer.diferencia)||0,ab=CJ.abierta===i;
      return `<button type="button" class="mv" style="width:100%;background:transparent;border-left:0;border-right:0;border-top:0;text-align:left;cursor:pointer;font:inherit;color:inherit" data-cl="${i}"><span class="ic" style="background:#E9F6EE;color:#15803D">${IC.check}</span><span class="tx"><b>${rs?'Reinicio de caja':'Entregó '+M(x.closer.recibido!=null?x.closer.recibido:amt)}${df<-0.004?' <span class="pl r">Faltó '+M(-df)+'</span>':df>0.004?' <span class="pl g">Sobró '+M(df)+'</span>':''}</b><span>${E(dtl(x.closer.creado_en))} · ${x.summary.count} movimientos</span></span>${ab?IC.x:IC.chev}</button>${ab?`<div style="padding:0 0 8px">${x.movs.length?grp(x.movs,false):'<div style="color:#6B5E55">Sin movimientos.</div>'}</div>`:''}`}).join(''):'<div style="color:#6B5E55;font-size:15px">Todavía no te ha entregado ninguna caja.</div>'}</div>`;
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
      const v=D2.saldo,total=Math.abs(v-bal)<0.005;
      if(!(await conf('¿Recibir la caja del '+diaTxt(k).replace(/^(Hoy|Ayer) · /,'')+' de '+nom+' por '+M(v)+'?\nLos demás días quedan como están.')))return;
      const q=await D().from('movimientos_caja').insert(Object.assign({motorizado_id:m.id,tipo:'retiro',monto:v,descripcion:(total?'LIQUIDACIÓN DE CAJA':'ENTREGA PARCIAL DE CAJA')+' · Día '+k},total?{esperado:bal,recibido:v,diferencia:0}:{})).select('id');
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
  async function cajaBorrar(id){const mt=window.pdPedir?await pdPedir('¿Por qué borras este movimiento? (ej. monto mal escrito)'):prompt('Motivo');if(mt===null)return;if(!String(mt).trim()){(window.pdAviso||alert)('Escribe un motivo para borrar el movimiento.');return}
    const q=await D().from('movimientos_caja').delete().eq('id',id).eq('motorizado_id',CJ.moto.id).select('id');if(q.error||!q.data||!q.data.length){CJ.msg='No se pudo borrar: '+(q.error?q.error.message:'revisa el permiso de borrar.');key='';pintar();return}
    console.info('[Caja] Movimiento borrado',id,'motivo:',String(mt).trim());await recargaMoto();CJ.ok='Movimiento borrado.'}
  async function cajaRevision(v){const [st,id]=v.split(':');let upd;
    if(st==='aprobado')upd={revision:'aprobado',revisado_en:new Date().toISOString(),revision_nota:null};
    else{const n=window.pdPedir?await pdPedir('¿Por qué lo rechazas? (el motorizado lo verá):\nMotivo:',''):prompt('Motivo');if(n===null)return;upd={revision:'rechazado',revisado_en:new Date().toISOString(),revision_nota:String(n).trim()||'Sin comprobante válido'}}
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
    const A=c.data;let h=`<div class="cols3"><div class="kp"><span>Clientes</span><b>${A.length}</b></div><div class="kp"><span>Con mapa</span><b>${A.filter(x=>cliU(x)||x.latitud).length}</b></div><div class="kp"><span>Con DNI</span><b>${A.filter(x=>x.documento||x.dni).length}</b></div></div>`;
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
    let h=`<div class="g2"><div class="kp"><span>Clientes</span><b>${LC?LC.length:'–'}</b></div><div class="kp"><span>Con ubicación</span><b>${LC?LC.filter(c=>c.latitud!=null||/maps|goo\.gl|-?\d+\.\d+\s*,\s*-?\d+\.\d+/i.test(String(cliU(c)||''))).length:'–'}</b></div></div>`;
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
    const q=f.id?await D().from('clientes').update(base).eq('id',f.id).select('*').single():await D().from('clientes').insert(base).select('*').single();
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
    const link=neg?'https://pidemasdelivery.github.io/negocio/':'https://pidemasdelivery.github.io/motorizado/';
    const txt=neg
      ?`¡Hola${nom?', '+nom:''}! 🎉\n\nTu negocio fue *aprobado* en *Pidemás Delivery*. Ya creamos tu cuenta de acceso a tu panel:\n\n👤 *Usuario (correo):* ${o.email}\n🔑 *Contraseña:* ${o.password}\n\n👉 Ingresa aquí: ${link}\n\n🔒 *Por tu seguridad, cambia tu contraseña* apenas ingreses: Perfil › Contraseña. No la compartas con nadie.\n\nDesde tu panel recibes tus pedidos, subes tus productos y configuras tu horario. Cualquier duda, escríbenos por aquí. ¡Bienvenido a Pidemás! 🧡`
      :`¡Hola${nom?', '+nom.split(' ')[0]:''}! 🎉\n\nTu registro como *motorizado* fue *aprobado* en *Pidemás Delivery*. Ya creamos tu cuenta de acceso a la app:\n\n👤 *Usuario (correo):* ${o.email}\n🔑 *Contraseña:* ${o.password}\n\n👉 Ingresa aquí: ${link}\n\n🔒 *Por tu seguridad, cambia tu contraseña* apenas ingreses. No la compartas con nadie.\n\nAhí verás los pedidos que te asignemos. Cualquier duda, escríbenos por aquí. ¡Bienvenido al equipo! 🧡`;
    const dig=String(tel).replace(/\D/g,''),wa=dig?(dig.length===9?'51'+dig:dig):'';
    const Es=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const bs=[];if(wa)bs.push({k:'wa',t:'Enviar por WhatsApp',sub:tel?'Al '+tel:'',c:'g',queda:true});bs.push({k:'copiar',t:'Copiar mensaje',c:wa?'':'o',queda:true});
    if(!window.pdVentana){try{await navigator.clipboard.writeText(txt)}catch(_){}(window.pdAviso||alert)('Cuenta creada. Copiamos el mensaje para enviarlo.');return}
    window.pdVentana({ic:'ok',titulo:'Cuenta creada',cancelar:'Cerrar',
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
      const L=mv||[],cobro=L.filter(x=>x.tipo==='ingreso'&&!/^INGRESO MANUAL/i.test(String(x.descripcion||''))).reduce((a,x)=>a+Number(x.monto||0),0),corr=L.filter(x=>/Corrección de pago/i.test(String(x.descripcion||''))).reduce((a,x)=>a+(x.tipo==='ingreso'?1:-1)*Number(x.monto||0),0);
      const enCaja=Math.round((cobro+(corr<0?corr:0))*100)/100;
      if(d==='efectivo'&&enCaja<0.005)await D().from('movimientos_caja').insert({motorizado_id:o.motorizado_id,pedido_id:o.id,tipo:'ingreso',monto:tot,descripcion:'Cobro de pedido · Corrección de pago: Yape → Efectivo (administración) · total S/ '+tot.toFixed(2)});
      else if(d!=='efectivo'&&enCaja>0.004)await D().from('movimientos_caja').insert({motorizado_id:o.motorizado_id,pedido_id:o.id,tipo:'retiro',monto:enCaja,descripcion:'Corrección de pago: Efectivo → Yape (administración) · ese cobro no fue en efectivo'});
      try{C2.caja&&(C2.caja.t=0)}catch(_){}
    }catch(e){console.warn('[caja] corrección de pago',e)}
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
  const optsDe=id=>{const e=document.getElementById(id);return e?[...e.options].filter(o=>o.value).map(o=>[o.value,o.textContent.trim()]):[]};
  function svcDatos(o,sv){
    const obs=o.observaciones||'',pagado=String(o.pago_servicio_momento||'').toLowerCase()==='pagado'||/Servicio marcado como PAGADO/i.test(obs);
    const met=pagado?'pagado':String(o.metodo_pago||'efectivo').toLowerCase();
    const b={id:o.id,sv,tipo:sv==='Recojo y entrega'?'recojo':sv==='Compra'?'compra':'enc',msg:'',costo:String(Number(sv==='Compra'?o.costo_delivery:o.total)||0)};
    if(b.tipo==='recojo')Object.assign(b,{rnom:o.nombre_remitente||o.nombre_cliente||'',rtel:o.telefono_remitente||o.telefono_cliente||'',rdir:o.direccion_recojo||'',rref:o.referencia_recojo||tagDe(obs,'Referencia de recojo'),rubi:o.ubicacion_recojo||tagDe(obs,'Ubicación de recojo','Ubicacion de recojo'),
      enom:o.nombre_receptor||'',etel:o.telefono_receptor||'',edir:o.direccion_entrega||'',eref:o.referencia_entrega||'',eubi:o.ubicacion_entrega||tagDe(obs,'Ubicación de entrega','Ubicacion de entrega'),lleva:o.que_se_lleva||tagDe(obs,'Qué se lleva'),
      pago:met,quien:o.quien_paga||(/^recojo_/.test(String(o.pago_servicio_momento||''))?'envia':'recibe')});
    else if(b.tipo==='compra')Object.assign(b,{nom:o.nombre_cliente||'',tel:o.telefono_cliente||'',dir:o.direccion_entrega||'',ref:o.referencia_entrega||'',ubi:o.ubicacion_entrega||tagDe(obs,'Ubicación','Ubicación del cliente'),
      lugar:o.direccion_recojo||o.lugar_compra||tagDe(obs,'Lugar de compra'),detalle:o.detalle_compra||tagDe(obs,'Compra solicitada'),obs:libreDe(obs),comp:o.tipo_comprobante||tagDe(obs,'Comprobante').replace(/^No especificado$/i,''),doc:o.documento_comprobante||tagDe(obs,'DNI/RUC'),pago:met});
    else{const m=String(o.pago_servicio_momento||'').toLowerCase();
      Object.assign(b,{rnom:o.nombre_remitente||o.nombre_cliente||'',rdni:o.dni_remitente||tagDe(obs,'DNI de quien envía'),rtel:o.telefono_remitente||o.telefono_cliente||'',rdir:o.direccion_recojo||'',rref:o.referencia_recojo||tagDe(obs,'Referencia de recojo'),rubi:o.ubicacion_recojo||tagDe(obs,'Ubicación de recojo'),
      enom:o.nombre_receptor||'',edni:o.dni_receptor||tagDe(obs,'DNI de quien recibe'),etel:o.telefono_receptor||'',tenv:o.tipo_encomienda||tagDe(obs,'Tipo de encomienda'),obs:libreDe(obs),
      ag:o.agencia_destino||'',dest:o.destino_final||o.direccion_entrega||'',tpago:o.tipo_pago_encomienda||'',
      pago:pagado?'pagado':m==='al_final'?'al_final':m==='recojo_yape'?'yape':String(o.metodo_pago||'efectivo').toLowerCase()==='yape'?'yape':'efectivo'})}
    return b;
  }
  function svcForm(f){
    const fl=(id,l,k,ph,o)=>`<div class="fld"><label for="${id}">${l}</label><input id="${id}" value="${E(f[k]??'')}" data-in="pe:${k}"${ph?` placeholder="${E(ph)}"`:''}${o||''}></div>`;
    const ta=(id,l,k,ph)=>`<div class="fld"><label for="${id}">${l}</label><textarea id="${id}" data-in="pe:${k}" placeholder="${E(ph||'')}" style="min-height:96px;padding:14px 16px;border-radius:14px;border:1.5px solid #F1E4DA;font:inherit;font-size:16px;width:100%;box-sizing:border-box">${E(f[k]??'')}</textarea></div>`;
    const sl=(id,l,k,ops,ph)=>`<div class="fld"><label for="${id}">${l}</label><select id="${id}" data-in="pe:${k}" style="height:56px;border-radius:14px;border:1.5px solid #F1E4DA;padding:0 14px;font:inherit;font-size:16px;font-weight:700;width:100%;background:#fff">${ph?`<option value="">${E(ph)}</option>`:''}${ops.map(x=>`<option value="${E(x[0])}"${String(f[k])===String(x[0])?' selected':''}>${E(x[1])}</option>`).join('')}${f[k]&&!ops.some(x=>String(x[0])===String(f[k]))?`<option value="${E(f[k])}" selected>${E(f[k])}</option>`:''}</select></div>`;
    const sg=(l,k,ops)=>`<div class="fld"><label>${l}</label><div class="seg" style="grid-template-columns:repeat(${ops.length},minmax(0,1fr))">${ops.map(x=>`<button type="button" class="${f[k]===x[0]?'on':''}" data-a="pe:set:${k}:${x[0]}">${E(x[1])}</button>`).join('')}</div></div>`;
    const card=(t,h)=>`<div class="cd"><div class="lbl">${t}</div>${h}</div>`;
    const tel=' type="tel" inputmode="tel" maxlength="20"';
    const costo=card('Información de pago del servicio',fl('peCo','Costo del servicio','costo','S/ 0.00',' inputmode="decimal"')+`<div class="chips" style="flex-wrap:wrap">${[5,6,7,8,10,12,15].map(v=>`<button type="button" class="${Number(f.costo)===v?'on':''}" data-a="pe:set:costo:${v}">S/ ${v}</button>`).join('')}</div>`+
      (f.tipo==='enc'?sg('¿Cómo paga el servicio?','pago',[['efectivo','Efectivo al recoger'],['yape','Yape al recoger'],['pagado','Pagado'],['al_final','Al recibir la guía']])
       :sg(f.tipo==='compra'?'¿Cómo paga el cliente la compra y el servicio?':'¿Cómo paga el servicio?','pago',[['efectivo','Efectivo'],['yape','Yape'],['pagado','Pagado']]))+
      (f.tipo==='recojo'&&f.pago!=='pagado'?sg('¿Quién paga el servicio?','quien',[['envia','Quien envía'],['recibe','Quien recibe']]):''));
    let h='';
    if(f.tipo==='recojo'){
      h+=card('Información de quien envía',fl('peRn','Nombre y apellido','rnom','')+fl('peRt','Teléfono','rtel','',tel)+fl('peRd','Dirección','rdir','')+fl('peRr','Referencia','rref','Ej. frente al parque, portón negro')+fl('peRu','Ubicación (Google Maps)','rubi','Pega el enlace de Google Maps'));
      h+=card('Información de quien recibe',fl('peEn','Nombre y apellido','enom','')+fl('peEt','Teléfono','etel','',tel)+fl('peEd','Dirección','edir','')+fl('peEr','Referencia','eref','Ej. edificio azul, dpto. 302')+fl('peEu','Ubicación (Google Maps)','eubi','Pega el enlace de Google Maps')+fl('peQl','¿Qué se lleva?','lleva','Ej. sobre con documentos, caja pequeña'));
      h+=costo;
    }else if(f.tipo==='compra'){
      h+=card('Información del cliente',fl('peN','Nombre y apellido','nom','')+fl('peT','Teléfono','tel','',tel)+fl('peD','Dirección','dir','')+fl('peR','Referencia','ref','Ej. frente a la bodega, casa verde')+fl('peU','Ubicación (Google Maps)','ubi','Pega el enlace de Google Maps'));
      h+=card('Información de la compra',fl('peLg','¿De dónde desea la compra?','lugar','')+ta('peDt','¿Qué desea que compremos?','detalle','')+ta('peOb','Observaciones','obs',''));
      const oc=optsDe('admCompraComprobante');
      h+=card('Información del comprobante',sl('peCp','Boleta o factura','comp',oc.length?oc:[['Boleta','Boleta'],['Factura','Factura']],'No especificado')+fl('peDc','DNI / RUC','doc','',' inputmode="numeric" maxlength="11"'));
      h+=costo;
    }else{
      h+=card('Información de quien envía',fl('peRn','Nombre y apellido','rnom','')+fl('peRi','DNI','rdni','',' inputmode="numeric" maxlength="12"')+fl('peRt','Teléfono','rtel','',tel)+fl('peRd','Dirección de recojo','rdir','')+fl('peRr','Referencia','rref','Ej. casa de dos pisos, reja negra')+fl('peRu','Ubicación (Google Maps)','rubi','Pega el enlace de Google Maps'));
      h+=card('Información de quien recibe',fl('peEn','Nombre y apellido','enom','')+fl('peEi','DNI','edni','',' inputmode="numeric" maxlength="12"')+fl('peEt','Teléfono','etel','',tel));
      const ot=optsDe('encTipoEnvio');
      h+=card('Información de la encomienda',sl('peTe','Tipo de encomienda','tenv',ot,'Seleccionar tipo')+ta('peOb','Observaciones','obs','Describe el contenido u otras indicaciones'));
      const tp=optsDe('encTipoPago');
      h+=card('Paquetes de la encomienda',fl('peAg','Agencia','ag','')+fl('peDs','Destino','dest','')+sl('peTp','Modalidad de pago de encomienda','tpago',tp.length?tp:[['pago_en_agencia','Pago en agencia'],['pago_destino','Pago en destino']],'Seleccionar modalidad'));
      h+=costo;
    }
    if(f.msg)h+=`<div class="err">${E(f.msg)}</div>`;
    return h;
  }
  async function svcGuardar(f,o){
    const n=v=>{const x=Number(String(v??'').replace(',','.'));return Number.isFinite(x)&&x>=0?Math.round(x*100)/100:0};
    const costo=n(f.costo),pagado=f.pago==='pagado',yaCobro=o.pago_confirmado===true&&Number(o.monto_recibido)>0;
    let p={},obs=o.observaciones||'';
    if(f.tipo==='recojo'){
      if(!f.rnom.trim()){f.msg='Escribe el nombre de quien envía.';return false}
      const mom=pagado?'pagado':(f.quien==='envia'?(f.pago==='yape'?'recojo_yape':'recojo_efectivo'):null);
      p={nombre_cliente:f.rnom.trim(),telefono_cliente:f.rtel.trim(),nombre_remitente:f.rnom.trim(),telefono_remitente:f.rtel.trim(),direccion_recojo:f.rdir.trim(),referencia_recojo:f.rref.trim()||null,ubicacion_recojo:f.rubi.trim()||null,
        nombre_receptor:f.enom.trim(),telefono_receptor:f.etel.trim(),direccion_entrega:f.edir.trim(),referencia_entrega:f.eref.trim()||null,ubicacion_entrega:f.eubi.trim()||null,que_se_lleva:f.lleva.trim()||null,
        costo_delivery:costo,subtotal:0,total:costo,metodo_pago:pagado?'efectivo':f.pago,pago_servicio_momento:mom,quien_paga:pagado?null:f.quien};
      obs=rehacerObs(obs,{'Ubicación de recojo':f.rubi,'Ubicación de entrega':f.eubi,'Referencia de recojo':f.rref,'Qué se lleva':f.lleva});
      obs=[pagado?'Servicio marcado como PAGADO; no cobrar monto al cliente':(f.pago==='efectivo'?'Pago en efectivo: S/ '+costo.toFixed(2):'Pago por Yape: pendiente de captura y confirmación del administrador'),pagado?'':(f.quien==='envia'?'Paga quien envía, al recoger':'Paga quien recibe, al entregar')].filter(Boolean).concat(segs(obs)).join(' | ');
      const cr=coordsDe(f.rubi),ce=coordsDe(f.eubi);if(cr){p.latitud_recojo=cr.lat;p.longitud_recojo=cr.lng}if(ce){p.latitud_entrega=ce.lat;p.longitud_entrega=ce.lng}
    }else if(f.tipo==='compra'){
      if(!f.nom.trim()){f.msg='Escribe el nombre del cliente.';return false}
      p={nombre_cliente:f.nom.trim(),telefono_cliente:f.tel.trim(),nombre_remitente:f.nom.trim(),telefono_remitente:f.tel.trim(),direccion_entrega:f.dir.trim(),referencia_entrega:f.ref.trim()||null,ubicacion_entrega:f.ubi.trim()||null,
        direccion_recojo:f.lugar.trim(),tipo_comprobante:f.comp||null,documento_comprobante:f.doc.trim()||null,costo_delivery:costo,total:Math.round((n(o.subtotal)+costo)*100)/100,metodo_pago:pagado?'efectivo':f.pago};
      obs=rehacerObs(obs,{'Ubicación':f.ubi,'Compra solicitada':f.detalle,'Comprobante':f.comp||'No especificado','DNI/RUC':f.doc},f.obs);
      if(pagado)obs='Servicio marcado como PAGADO; no cobrar monto al cliente | '+obs;
      const ce=coordsDe(f.ubi);if(ce){p.latitud_entrega=ce.lat;p.longitud_entrega=ce.lng}
    }else{
      if(!f.rnom.trim()){f.msg='Escribe el nombre de quien envía.';return false}
      const mom=pagado?'pagado':f.pago==='al_final'?'al_final':f.pago==='yape'?'recojo_yape':'recojo_efectivo';
      p={nombre_cliente:f.rnom.trim(),telefono_cliente:f.rtel.trim(),nombre_remitente:f.rnom.trim(),telefono_remitente:f.rtel.trim(),dni_remitente:f.rdni.trim()||null,direccion_recojo:f.rdir.trim(),referencia_recojo:f.rref.trim()||null,ubicacion_recojo:f.rubi.trim()||null,
        nombre_receptor:f.enom.trim(),telefono_receptor:f.etel.trim(),dni_receptor:f.edni.trim()||null,tipo_encomienda:f.tenv||null,
        agencia_destino:f.ag.trim(),referencia_entrega:f.ag.trim(),destino_final:f.dest.trim(),direccion_entrega:f.dest.trim(),tipo_pago_encomienda:f.tpago||null,
        costo_delivery:costo,subtotal:0,total:costo,metodo_pago:pagado?'efectivo':(f.pago==='al_final'?'yape':f.pago),pago_servicio_momento:mom};
      if(f.ag.trim()!==String(o.agencia_destino||'').trim()){const op=optsDe('encAgencia').find(x=>x[1].toLowerCase()===f.ag.trim().toLowerCase());p.agencia_id=op?op[0]:null}
      obs=rehacerObs(obs,{'Tipo de encomienda':f.tenv,'DNI de quien envía':f.rdni,'DNI de quien recibe':f.edni,'Ubicación de recojo':f.rubi,'Referencia de recojo':f.rref},f.obs);
      obs=[pagado?'Servicio marcado como PAGADO; no cobrar monto al cliente':'',f.pago==='al_final'?'El cliente paga al final por Yape, después de recibir la guía y la clave; no cobrar al recoger':''].filter(Boolean).concat(segs(obs)).join(' | ');
      const cr=coordsDe(f.rubi);if(cr){p.latitud_recojo=cr.lat;p.longitud_recojo=cr.lng}
    }
    if(!yaCobro)p.pago_confirmado=pagado;
    p.observaciones=obs;
    let r=await D().from('pedidos').update(p).eq('id',o.id).select('id').maybeSingle();
    if(r.error&&/column|schema cache|PGRST204|42703/i.test(String(r.error.message)+String(r.error.code))){['referencia_recojo','ubicacion_recojo','ubicacion_entrega','que_se_lleva','quien_paga','tipo_comprobante','documento_comprobante','tipo_encomienda'].forEach(k=>delete p[k]);r=await D().from('pedidos').update(p).eq('id',o.id).select('id').maybeSingle()}
    if(r.error)throw r.error;if(!r.data)throw new Error('Supabase no guardó el cambio. Revisa los permisos.');
    const metAntes=o.metodo_pago;Object.assign(o,p);await cajaPorCambioPago(o,metAntes,p.metodo_pago);return true;
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
    if(f.tipo)return {head:top3(f.sv+' · '+ref(f.id),'Editar pedido'),body:svcForm(f),foot:`<button type="button" class="b o" style="height:54px;font-size:16px" data-a="pe:guardar">Guardar cambios</button>`};
    const fl=(id,l,k,ph,o)=>`<div class="fld"><label for="${id}">${l}</label><input id="${id}" value="${E(f[k])}" data-in="pe:${k}"${ph?` placeholder="${E(ph)}"`:''}${o||''}></div>`;
    let h=`<div class="cd" style="flex-direction:row;align-items:center;gap:10px"><span style="font-size:14px;color:#6B5E55">Corrige lo que se envió mal. Si ya hay un motorizado asignado, le avisamos del cambio.</span></div>`;
    if(f.sv)h+=`<div class="cd"><div class="lbl">Quien envía / recojo</div>${fl('peRn','Nombre','rnom','')}${fl('peRt','Teléfono','rtel','',' type="tel" inputmode="numeric" maxlength="15"')}${fl('peRd','Dirección de recojo','rdir','')}</div>`;
    h+=`<div class="cd"><div class="lbl">${f.sv==='Recojo y entrega'?'Quien recibe / entrega':'Cliente y entrega'}</div>${fl('peN','Nombre','nombre','')}${fl('peT','Teléfono','tel','',' type="tel" inputmode="numeric" maxlength="15"')}${fl('peD','Dirección de entrega','dir','')}${fl('peR','Referencia','ref','Ej. puerta azul')}</div>`;
    if(f.items===null)h+=`<div class="load">Cargando productos…</div>`;
    else if(f.items.length)h+=`<div class="cd"><div class="lbl">Productos</div>${f.items.map((x,i)=>`<div style="display:flex;flex-direction:column;gap:6px;padding:8px 0;border-bottom:1px solid #F1E4DA"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b style="font-size:15px;overflow-wrap:anywhere">${E(x.n)}</b><button type="button" class="ib" style="width:36px;height:36px;color:#B42318" data-a="pe:quitar:${i}" aria-label="Quitar ${E(x.n)}">${IC.trash}</button></div><div class="two"><div class="fld"><label for="peQ${i}">Cantidad</label><input id="peQ${i}" inputmode="numeric" value="${E(x.q)}" data-in="peq:${i}"></div><div class="fld"><label for="peP${i}">Precio c/u (S/)</label><input id="peP${i}" inputmode="decimal" value="${E(x.p)}" data-in="pep:${i}"></div></div></div>`).join('')}</div>`;
    h+=`<div class="cd"><div class="lbl">Montos</div>${f.items&&f.items.length?'':fl('peS',f.sv==='Compra'?'Gasto de la compra (S/)':'Productos (S/)','sub','0.00',' inputmode="decimal"')}${fl('peL','Delivery / servicio (S/)','del','0.00',' inputmode="decimal"')}
      <div class="li"><span>Productos</span><b id="peSu">${M(peSub(f))}</b></div>${f.extra?`<div class="li"><span>${f.extra>0?'Otros cargos (bolsa, etc.)':'Descuento'}</span><b>${M(f.extra)}</b></div>`:''}<div class="li" style="font-size:17px"><span>Total</span><b id="peTo">${M(peTot(f))}</b></div></div>`;
    h+=`<div class="cd"><div class="lbl">Pago</div><div class="seg" style="grid-template-columns:1fr 1fr">${[['efectivo','Efectivo'],['yape','Yape']].map(x=>`<button type="button" class="${f.metodo===x[0]?'on':''}" data-a="pe:met:${x[0]}">${x[1]}</button>`).join('')}</div></div>`;
    h+=`<div class="cd">${fl('peO','Observaciones','obs','')}</div>`;
    if(f.msg)h+=`<div class="err">${E(f.msg)}</div>`;
    return {head:top3('Pedido '+ref(f.id),'Editar pedido'),body:h,foot:`<button type="button" class="b o" style="height:54px;font-size:16px" data-a="pe:guardar">Guardar cambios · ${M(peTot(f))}</button>`};
  }
  function peVivo(){const f=PE.f;if(!f)return;const a=root.getElementById('peSu'),b=root.getElementById('peTo'),g=root.querySelector('[data-a="pe:guardar"]');if(a)a.textContent=M(peSub(f));if(b)b.textContent=M(peTot(f));if(g)g.textContent='Guardar cambios · '+M(peTot(f))}
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
      {const metAntes=o.metodo_pago;Object.assign(o,patch);await cajaPorCambioPago(o,metAntes,patch.metodo_pago)}try{window.loadOrders().catch(()=>{})}catch(_){}
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
  function secVista(){const S=SEC[secK];if(!S)return {head:top3('Administración','Sección'),body:''};const v=S.v();return {head:top3(S.g,S.t,S.rf?`<button type="button" class="ib" data-a="sec:rf" aria-label="Actualizar">${IC.refresh}</button>`:''),body:v.body,foot:v.foot}}
  const datos=(k,fn)=>cargar('s:'+k,fn);
  const recargar=k=>{if(C2['s:'+k])C2['s:'+k].t=0;cargar('s:'+k,SEC[k].load,true)};

  /* --- Yape por confirmar --- */
  SEC['yape por confirmar']={g:'Control de caja y sueldos',t:'Yape por confirmar',rf:1,
    load:async()=>{const b=await baseCtl();const {data,error}=await D().from('cobros').select('id,pedido_id,motorizado_id,monto,confirmado_en,yape_recibido_en').eq('metodo_pago','yape').eq('confirmado',true).is('yape_recibido_en',null).gte('confirmado_en',new Date(Date.now()-45*864e5).toISOString()).order('confirmado_en',{ascending:false}).limit(300);if(error)throw error;
      const ids=[...new Set((data||[]).map(c=>c.pedido_id).filter(Boolean))];const peds={};if(ids.length){const r=await D().from('pedidos').select('id,nombre_cliente,total,estado').in('id',ids);(r.data||[]).forEach(p=>peds[p.id]=p)}
      return {b,peds,L:(data||[]).filter(c=>{const p=peds[c.pedido_id];return !p||!['cancelado','rechazado'].includes(est(p))})}},
    v(){const c=datos('yape por confirmar',this.load);if(!c.data)return {body:cargando(c)};const {b,peds,L}=c.data;const tot=L.reduce((s,x)=>s+(Number(x.monto)||0),0);
      let h=`<div class="amt"><div class="k">Yapes por confirmar</div><div class="n">${M(tot)}</div><div class="pill">${L.length} cobro${L.length===1?'':'s'}</div></div>`+U.note('Cobros que el motorizado marcó como pagados por Yape. Confirma cuando el dinero haya llegado al QR de Pidemás.');
      h+=L.length?`<div class="cd">${L.map(x=>{const p=peds[x.pedido_id]||{};return fila(M(x.monto)+' · '+E(p.nombre_cliente||'Cliente'),E(ref(x.pedido_id))+' · '+E(mN(b,x.motorizado_id))+' · '+E(fch(x.confirmado_en)),`<button type="button" class="b" style="height:40px;padding:0 12px;color:#0F5E2E;border-color:#CFEBDA" data-sa="yok:${E(x.id)}">${IC.check}Recibido</button>`)}).join('')}</div>`:vacio('No hay Yapes pendientes de confirmar.');
      return {body:h,foot:L.length>1?`<button type="button" class="b o" style="height:54px;font-size:16px" data-sa="yall">Marcar todos como recibidos</button>`:''}},
    async a(x){const c=C2['s:yape por confirmar'];const ids=x==='yall'?c.data.L.map(y=>y.id):[x.split(':')[1]];if(x==='yall'&&!(await conf('¿Marcar '+ids.length+' Yapes como recibidos?')))return;
      const u=(await D().auth.getUser()).data.user;const q=await D().from('cobros').update({yape_recibido_en:new Date().toISOString(),yape_recibido_por:u&&u.id}).in('id',ids);if(q.error){mal('No se pudo guardar: '+q.error.message);return}
      ok(ids.length===1?'Yape confirmado':'Yapes confirmados');recargar('yape por confirmar');try{window.pdCtl&&pdCtl.contar()}catch(_){}}};

  /* --- Por cobrar a negocios --- */
  SEC['por cobrar a negocios']={g:'Control de caja y sueldos',t:'Por cobrar a negocios',rf:1,
    load:async()=>{const b=await baseCtl();const {data,error}=await D().from('pedidos').select('id,negocio_id,costo_delivery,nombre_cliente,entregado_en,creado_en').in('pago_acordado',['pagado','yape_negocio']).eq('estado','entregado').is('delivery_negocio_cobrado_en',null).order('creado_en',{ascending:true}).limit(1000);if(error)throw error;return {b,P:data||[]}},
    v(){const c=datos('por cobrar a negocios',this.load);if(!c.data)return {body:cargando(c)};const {b,P}=c.data,f=SF['por cobrar a negocios'];f.off=f.off||{};f.quien=f.quien||{};
      const g=new Map();P.forEach(p=>{const k=String(p.negocio_id||'');if(!g.has(k))g.set(k,[]);g.get(k).push(p)});const tot=P.reduce((s,p)=>s+(Number(p.costo_delivery)||0),0);
      let h=`<div class="amt"><div class="k">Total por cobrar</div><div class="n">${M(tot)}</div><div class="pill">${g.size} negocio${g.size===1?'':'s'}</div></div>`+U.note('Pedidos donde el cliente pagó todo al negocio: el negocio le debe el delivery a Pidemás.');
      if(!g.size)return {body:h+vacio('Ningún negocio te debe delivery.')};
      h+=[...g.entries()].map(([nid,L])=>{const n=b.negs.find(x=>String(x.id)===nid)||{};const t=L.reduce((s,p)=>s+(Number(p.costo_delivery)||0),0);
        const msg=['Hola, '+(n.nombre||'')+' 👋','Te escribimos de *Pidemás Delivery*.','Tienes pendiente el pago del delivery de '+L.length+' pedido'+(L.length===1?'':'s')+':',...L.map(p=>'• '+ref(p.id)+' · '+fch(p.entregado_en||p.creado_en)+' · '+M(p.costo_delivery)),'','*Total: '+M(t)+'*','¿Nos confirmas cuándo lo cancelas? ¡Gracias!'].join('\n');const w=telW(n.telefono);
        const q=f.quien[nid]||'admin';
        return `<div class="cd"><div class="row"><div style="flex:1 1 0%;min-width:0"><b style="display:block;font-size:17px">${E(n.nombre||'Negocio')}</b><span style="font-size:13px;color:#6B5E55">${L.length} pedido${L.length===1?'':'s'} · ${M(t)}</span></div>${w?`<a class="b g" style="height:40px;padding:0 12px" target="_blank" rel="noopener" href="https://wa.me/${w}?text=${encodeURIComponent(msg)}">${U.I.wa}Recordar</a>`:''}</div>
          ${L.map(p=>{const on=!f.off[p.id];return `<button type="button" class="opt${on?' on':''}" style="flex-direction:row;align-items:center;gap:10px" data-sa="tg:${E(p.id)}"><span class="sel${on?' on':''}">${on?IC.check:''}</span><span style="flex:1 1 0%"><b style="font-size:15px">${E(ref(p.id))}</b> <span>· ${E(fch(p.entregado_en||p.creado_en))}</span></span><b>${M(p.costo_delivery)}</b></button>`}).join('')}
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

  /* --- Cancelados con cobro --- */
  SEC['cancelados con cobro']={g:'Control de caja y sueldos',t:'Cancelados con cobro',rf:1,
    load:async()=>{const b=await baseCtl();const {data,error}=await D().from('pedidos').select('id,nombre_cliente,total,estado,observaciones,motorizado_id,creado_en').in('estado',['cancelado','rechazado']).gte('creado_en',new Date(Date.now()-60*864e5).toISOString()).limit(500);if(error)throw error;if(!data||!data.length)return {b,L:[]};
      const r=await D().from('movimientos_caja').select('id,pedido_id,motorizado_id,tipo,monto,descripcion').in('pedido_id',data.map(p=>p.id));const mv=r.data||[];
      return {b,L:data.filter(p=>!/DEVOLUCION_REVISADA/.test(p.observaciones||'')).map(p=>{const ing=mv.filter(m=>String(m.pedido_id)===String(p.id)&&m.tipo==='ingreso'),dev=mv.some(m=>String(m.pedido_id)===String(p.id)&&m.tipo==='retiro'&&/^DEVOLUCI/i.test(m.descripcion||''));return {p,ing,cob:r2(ing.reduce((s,m)=>s+(Number(m.monto)||0),0)),dev}}).filter(x=>x.cob>0&&!x.dev)}},
    v(){const c=datos('cancelados con cobro',this.load);if(!c.data)return {body:cargando(c)};const {b,L}=c.data;
      let h=U.note('Pedidos anulados que ya tenían un cobro en la caja del motorizado. Indica si el dinero se le devolvió al cliente.');
      h+=L.length?L.map(x=>`<div class="cd"><b style="font-size:16px">${E(ref(x.p.id))} · ${E(x.p.nombre_cliente||'Cliente')}</b><span style="font-size:14px;color:#6B5E55">Cobrado ${M(x.cob)} · caja de ${E(mN(b,x.ing[0].motorizado_id))} · ${E(fch(x.p.creado_en))}</span><div class="btns b2"><button type="button" class="b o" data-sa="dev:si:${E(x.p.id)}">Sí, se devolvió</button><button type="button" class="b" data-sa="dev:no:${E(x.p.id)}">No, se queda</button></div></div>`).join(''):vacio('No hay pedidos anulados con cobro pendiente.');
      return {body:h}},
    async a(x){const k='cancelados con cobro',[,si,id]=x.split(':'),c=C2['s:'+k],it=c.data.L.find(y=>String(y.p.id)===id);if(!it)return;
      if(si==='si'){const r=await D().from('movimientos_caja').insert({motorizado_id:it.ing[0].motorizado_id,pedido_id:id,tipo:'retiro',monto:it.cob,descripcion:'DEVOLUCIÓN AL CLIENTE · Pedido '+ref(id)+' anulado'});if(r.error){mal('No se pudo guardar: '+r.error.message);return}}
      const obs=String(it.p.observaciones||'');const q=await D().from('pedidos').update({observaciones:(obs?obs+' | ':'')+'DEVOLUCION_REVISADA'+(si==='si'?'':' (sin devolución)')}).eq('id',id);if(q.error){mal('No se pudo guardar: '+q.error.message);return}
      ok(si==='si'?'Devolución registrada':'Listo: el cobro se queda en su caja');recargar(k);try{window.pdCtl&&pdCtl.contar()}catch(_){}}};

  /* --- Resumen del día --- */
  const tope=async()=>{try{const {data}=await D().from('ajustes_pidemas').select('valor').eq('clave','caja_alerta').maybeSingle();return Number(data&&data.valor&&data.valor.monto)||0}catch(e){return 0}};
  SEC['resumen del día']={g:'Control de caja y sueldos',t:'Resumen del día',rf:1,
    load:async()=>{const b=await baseCtl();const P=CA();const movs=await movsDe();const hoy=diaLima(Date.now()),ini=new Date(hoy+'T00:00:00-05:00').toISOString();const yp=await D().from('cobros').select('motorizado_id,monto').eq('metodo_pago','yape').gte('confirmado_en',ini);const T=await tope();
      const F=b.motos.map(m=>{const all=movs.filter(x=>String(x.motorizado_id)===String(m.id)),L2=all.filter(x=>diaLima(x.creado_en)===hoy);const s={ef:0,pg:0,ent:0,yape:0};
        L2.forEach(x=>{const k=P.kind(x),a=P.amount(x);if(x.tipo==='ingreso'){if(k!=='fondo')s.ef+=a}else if(k==='entrega'||k==='liquidacion')s.ent+=(x.recibido!=null?Number(x.recibido):a);else if(k!=='reinicio')s.pg+=a});
        (yp.data||[]).filter(c=>String(c.motorizado_id)===String(m.id)).forEach(c=>s.yape+=Number(c.monto)||0);return {m,s,bal:P.balance(all),hay:L2.length||s.yape>0}}).filter(f=>f.hay||Math.abs(f.bal)>0.004);return {F,T}},
    v(){const c=datos('resumen del día',this.load);if(!c.data)return {body:cargando(c)};const {F,T}=c.data,tot=F.reduce((s,f)=>s+f.bal,0);
      let h=`<div class="amt"><div class="k">Total en cajas</div><div class="n">${M(tot)}</div><div class="pill">${new Date().toLocaleDateString('es-PE',{timeZone:'America/Lima',weekday:'long',day:'2-digit',month:'long'})}</div></div>`;
      h+=F.length?F.map(f=>`<div class="cd"><div class="row"><b style="flex:1 1 0%;font-size:16px">${E(f.m.nombre_completo)}</b>${T>0&&f.bal>=T?`<span class="pl r">Supera ${M(T)}</span>`:''}</div><div class="li"><span>Saldo en caja</span><b>${M(f.bal)}</b></div><div class="g2"><div class="kp"><span>Efectivo</span><b style="font-size:18px">${M(f.s.ef)}</b></div><div class="kp"><span>Yape</span><b style="font-size:18px">${M(f.s.yape)}</b></div><div class="kp"><span>Pagos y gastos</span><b style="font-size:18px">${M(f.s.pg)}</b></div><div class="kp"><span>Entregó</span><b style="font-size:18px">${M(f.s.ent)}</b></div></div></div>`).join(''):vacio('Hoy todavía no hay movimientos.');
      const txt=['*Resumen del día · Pidemás Delivery*',new Date().toLocaleDateString('es-PE',{timeZone:'America/Lima',weekday:'long',day:'2-digit',month:'long'}),'',...F.map(f=>'*'+f.m.nombre_completo+'*\nEfectivo '+M(f.s.ef)+' · Yape '+M(f.s.yape)+' · Pagos/gastos '+M(f.s.pg)+' · Entregó '+M(f.s.ent)+'\nSaldo en caja: '+M(f.bal)),'','*Total en cajas: '+M(tot)+'*'].join('\n');
      return {body:h,foot:`<a class="b g" style="height:54px;font-size:16px" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(txt)}">${U.I.wa}Compartir por WhatsApp</a>`}}};

  /* --- Alerta de caja alta --- */
  SEC['alerta de caja alta']={g:'Control de caja y sueldos',t:'Alerta de caja alta',
    load:async()=>({T:await tope()}),
    v(){const c=datos('alerta de caja alta',this.load);if(!c.data)return {body:cargando(c)};const f=SF['alerta de caja alta'];if(f.v==null)f.v=c.data.T?String(c.data.T):'';
      return {body:U.note('Cuando la caja de un motorizado llegue a este monto, verá un aviso para entregarte el efectivo, y en el Resumen del día saldrá en rojo. Deja 0 para desactivar.')+`<div class="cd"><div class="fld"><label for="alT">Monto máximo en caja (S/)</label><input id="alT" inputmode="decimal" value="${E(f.v)}" data-in="sf:v" placeholder="0"></div></div>`,
        foot:`<button type="button" class="b o" style="height:54px;font-size:16px" data-sa="guardar">Guardar</button>`}},
    async a(){const f=SF['alerta de caja alta'];const v=Math.max(0,r2(String(f.v).replace(',','.')));const q=await D().from('ajustes_pidemas').upsert({clave:'caja_alerta',valor:{monto:v},actualizado_en:new Date().toISOString()});if(q.error){mal('No se pudo guardar: '+q.error.message);return}ok(v?'Alerta guardada en '+M(v):'Alerta desactivada');volverSub()}};

  /* --- Pedidos con demora --- */
  const UMB={negocio:5,asignar:5,aceptar:3,extra:40};
  function programado(o){try{if(o.programado_para)return T(o.programado_para);const d=window.pdTarifa&&pdTarifa.desgloseDePedido(o.observaciones);if(d&&d.programado)return T(d.programado)}catch(e){}return 0}
  function alertasP(){const now=Date.now(),out=[],mn=ms=>Math.round(ms/60000);
    L().forEach(o=>{const s=est(o);if(['entregado','cancelado','rechazado'].includes(s))return;const prog=programado(o);if(prog&&prog-now>45*60000)return;
      const base=prog&&prog>T(o.creado_en)?Math.max(T(o.creado_en),prog-45*60000):T(o.creado_en);
      if(prog&&!o.motorizado_id&&prog-now<=30*60000){out.push({o,k:'prog',t:'Programado para las '+new Date(prog).toLocaleTimeString('es-PE',{timeZone:'America/Lima',hour:'numeric',minute:'2-digit'})+' y sin motorizado'});return}
      if(o.negocio_id&&s==='pendiente'&&!o.negocio_aceptado_en&&now-base>UMB.negocio*60000){out.push({o,k:'neg',t:(NEG(o.negocio_id).nombre||'El negocio')+' no lo acepta hace '+mn(now-base)+' min'});return}
      if(!o.motorizado_id&&['pendiente','confirmado'].includes(s)&&(!o.negocio_id||o.negocio_aceptado_en)){const d=o.negocio_aceptado_en?T(o.negocio_aceptado_en):base;if(now-d>UMB.asignar*60000){out.push({o,k:'asig',t:'Sin motorizado hace '+mn(now-d)+' min'});return}}
      if(s==='asignado'&&!o.aceptado_en&&o.asignado_en&&now-T(o.asignado_en)>UMB.aceptar*60000){out.push({o,k:'acep',t:(o.motorizado_nombre||'El motorizado')+' no acepta hace '+mn(now-T(o.asignado_en))+' min'});return}
      if(['aceptado','en_camino','en_entrega','asignado'].includes(s)){const lim=(Number(o.tiempo_preparacion_min)||20)+UMB.extra,e=mn(now-base);if(e>lim)out.push({o,k:'tarde',t:'Demorado: '+e+' min desde que se pidió'})}});
    return out}
  SEC['pedidos con demora']={g:'Control de pedidos',t:'Pedidos con demora',rf:1,
    load:async()=>{let sug=new Map();try{if(window.pdPedCtl&&pdPedCtl.sugerencias)sug=await pdPedCtl.sugerencias()}catch(e){}return {sug}},
    v(){const c=datos('pedidos con demora',this.load);const A=alertasP();const sug=(c.data&&c.data.sug)||new Map();
      let h=`<div class="amt"><div class="k">Necesitan atención</div><div class="n">${A.length}</div><div class="pill">${A.length?'Revisa y actúa':'Todo en orden'}</div></div>`;
      h+=A.length?A.map(a=>{const s=['acep','asig','prog'].includes(a.k)?(sug.get(String(a.o.id))||[]).filter(x=>String(x.m.id)!==String(a.o.motorizado_id))[0]:null;
        return `<div class="cd"><b style="font-size:16px">${E(ref(a.o.id))} · ${E(a.o.nombre_cliente||'Cliente')}</b><span class="pl r" style="align-self:flex-start">${E(a.t)}</span><div class="btns${s?' b2':''}" style="${s?'':'grid-template-columns:1fr'}"><button type="button" class="b" data-o="${E(a.o.id)}">Ver pedido</button>${s?`<button type="button" class="b o" data-sa="asig:${E(a.o.id)}:${E(s.m.id)}">Asignar a ${E(String(s.m.nombre_completo||'').split(' ')[0])}${s.km!=null?' · '+s.km.toFixed(1)+' km':''}</button>`:''}</div></div>`}).join(''):vacio('Todo en orden. Ningún pedido tiene demora.');
      return {body:h}},
    async a(x){const [,id,m]=x.split(':');if(typeof assignOrder!=='function')return;await assignOrder(id,m);ok('Motorizado asignado');recargar('pedidos con demora')}};

  /* --- Por pagar a negocios --- */
  SEC['por pagar a negocios']={g:'Control de pedidos',t:'Por pagar a negocios',rf:1,
    load:async()=>{const b=await baseCtl();const {data,error}=await D().from('pedidos').select('id,negocio_id,subtotal,total,pago_acordado,metodo_pago,nombre_cliente,entregado_en,creado_en,motorizado_id').not('negocio_id','is',null).eq('estado','entregado').is('negocio_pagado_en',null).order('creado_en',{ascending:true}).limit(1000);if(error)throw error;
      return {b,P:(data||[]).filter(p=>!['solo_delivery','pagado','yape_negocio'].includes(String(p.pago_acordado||''))&&Number(p.subtotal)>0)}},
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

  /* --- Reportes de pedidos --- */
  SEC['reportes de pedidos']={g:'Control de pedidos',t:'Reportes de pedidos',rf:1,
    load:async()=>{const b=await baseCtl();const dias=SF['reportes de pedidos'].d||7;const {data,error}=await D().from('pedidos').select('id,estado,negocio_id,motorizado_id,tipo_servicio,total,subtotal,costo_delivery,creado_en,asignado_en,aceptado_en,en_camino_en,entregado_en,cancelado_por,motivo_cancelacion').gte('creado_en',new Date(Date.now()-dias*864e5).toISOString()).limit(5000);if(error)throw error;return {b,P:data||[],dias}},
    v(){const f=SF['reportes de pedidos'];f.d=f.d||7;const c=datos('reportes de pedidos',this.load);
      let h=`<div class="seg" style="grid-template-columns:repeat(3,minmax(0,1fr))">${[[1,'Hoy'],[7,'7 días'],[30,'30 días']].map(x=>`<button type="button" class="${f.d===x[0]?'on':''}" data-sa="d:${x[0]}">${x[1]}</button>`).join('')}</div>`;
      if(!c.data||c.data.dias!==f.d)return {body:h+cargando(c)};const {b,P}=c.data,ent=P.filter(p=>est(p)==='entregado'),can=P.filter(p=>est(p)==='cancelado');
      const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0,dur=(a,b2)=>ent.map(p=>p[a]&&p[b2]?(T(p[b2])-T(p[a]))/60000:null).filter(x=>x!=null&&x>=0&&x<600);
      const hr=new Array(24).fill(0);P.forEach(p=>{hr[+new Date(p.creado_en).toLocaleString('en-US',{timeZone:'America/Lima',hour:'numeric',hour12:false})%24]++});const mx=Math.max(1,...hr);
      const pN=new Map();ent.filter(p=>p.negocio_id).forEach(p=>{const x=pN.get(String(p.negocio_id))||{n:0,v:0};x.n++;x.v+=Number(p.subtotal)||0;pN.set(String(p.negocio_id),x)});
      const pM=new Map();ent.filter(p=>p.motorizado_id).forEach(p=>{const x=pM.get(String(p.motorizado_id))||{n:0,d:0};x.n++;x.d+=Number(p.costo_delivery)||0;pM.set(String(p.motorizado_id),x)});
      const mo=new Map();can.forEach(p=>{const k=(p.cancelado_por?p.cancelado_por+': ':'')+(p.motivo_cancelacion||'Sin motivo');mo.set(k,(mo.get(k)||0)+1)});
      const venta=ent.reduce((s,p)=>s+(Number(p.total)||0),0),nN=id=>(b.negs.find(n=>String(n.id)===String(id))||{}).nombre||'Negocio';
      h+=`<div class="amt"><div class="k">Venta entregada</div><div class="n">${M(venta)}</div><div class="pill">${ent.length} entregados · ticket ${M(ent.length?venta/ent.length:0)}</div></div>`;
      h+=`<div class="cols3"><div class="kp"><span>Pedidos</span><b>${P.length}</b></div><div class="kp"><span>Anulados</span><b>${can.length}</b></div><div class="kp"><span>Delivery</span><b style="font-size:17px">${M(ent.reduce((s,p)=>s+(Number(p.costo_delivery)||0),0))}</b></div></div>`;
      h+=`<div class="cd"><div class="lbl">Tiempo promedio por etapa</div><div class="li"><span>Pedido → asignado</span><b>${Math.round(avg(dur('creado_en','asignado_en')))} min</b></div><div class="li"><span>Asignado → aceptado</span><b>${Math.round(avg(dur('asignado_en','aceptado_en')))} min</b></div><div class="li"><span>Aceptado → en camino</span><b>${Math.round(avg(dur('aceptado_en','en_camino_en')))} min</b></div><div class="li"><span>Total hasta entregar</span><b>${Math.round(avg(dur('creado_en','entregado_en')))} min</b></div></div>`;
      if(hr.some(Boolean))h+=`<div class="cd"><div class="lbl">Pedidos por hora</div>${hr.map((n,x)=>n?`<div style="display:flex;align-items:center;gap:10px"><span style="width:44px;font-size:13px;color:#6B5E55">${x%12||12} ${x<12?'am':'pm'}</span><div class="bar" style="flex:1"><s style="width:${Math.max(4,Math.round(n*100/mx))}%"></s></div><b style="width:24px;text-align:right">${n}</b></div>`:'').join('')}</div>`;
      h+=`<div class="cd"><div class="lbl">Venta por negocio</div>${[...pN].sort((a,b2)=>b2[1].v-a[1].v).map(([id,x])=>fila(E(nN(id)),x.n+' pedido'+(x.n===1?'':'s'),`<span class="am">${M(x.v)}</span>`)).join('')||'<div style="color:#6B5E55">Sin ventas.</div>'}</div>`;
      h+=`<div class="cd"><div class="lbl">Entregas por motorizado</div>${[...pM].sort((a,b2)=>b2[1].n-a[1].n).map(([id,x])=>fila(E(mN(b,id)),'Delivery '+M(x.d),`<span class="am">${x.n}</span>`)).join('')||'<div style="color:#6B5E55">Sin entregas.</div>'}</div>`;
      if(mo.size)h+=`<div class="cd"><div class="lbl">Motivos de anulación</div>${[...mo].sort((a,b2)=>b2[1]-a[1]).map(([k,n])=>`<div class="li"><span>${E(k)}</span><b>${n}</b></div>`).join('')}</div>`;
      const csv=['Pedido;Estado;Tipo;Negocio;Motorizado;Total;Delivery;Creado;Entregado;Anulado por;Motivo',...P.map(p=>[ref(p.id),p.estado,p.tipo_servicio||'',p.negocio_id?nN(p.negocio_id):'',p.motorizado_id?mN(b,p.motorizado_id):'',p.total||0,p.costo_delivery||0,fecha(p.creado_en),p.entregado_en?fecha(p.entregado_en):'',p.cancelado_por||'',p.motivo_cancelacion||''].join(';'))].join('\n');
      return {body:h,foot:`<a class="b" style="height:50px" download="pedidos-${f.d}d.csv" href="data:text/csv;charset=utf-8,${encodeURIComponent('﻿'+csv)}">${IC.list}Descargar Excel (CSV)</a>`}},
    async a(x){SF['reportes de pedidos'].d=+x.split(':')[1];recargar('reportes de pedidos')}};

  /* --- Asignación automática --- */
  SEC['asignación automática']={g:'Control de pedidos',t:'Asignación automática',
    load:async()=>{const r=await D().from('ajustes').select('valor').eq('clave','auto_asignar').maybeSingle();return Object.assign({on:false,min:3},(r.data&&r.data.valor)||{})},
    v(){const c=datos('asignación automática',this.load);if(!c.data)return {body:cargando(c)};const a=c.data;
      return {body:U.note('Si un pedido listo para asignar se queda sin motorizado, el sistema lo asigna solo al sugerido: el más cercano y con menos pedidos. No se asigna a quien está en descanso.')+
        `<div class="cd"><div class="row"><div style="flex:1 1 0%"><b style="display:block;font-size:16px">${a.on?'Activada':'Desactivada'}</b><span style="font-size:13px;color:#6B5E55">${a.on?'Asigna después de '+a.min+' min sin motorizado':'Tú asignas todos los pedidos'}</span></div><button type="button" class="sw${a.on?' on':''}" role="switch" aria-checked="${a.on}" aria-label="Asignación automática" data-sa="on" style="position:relative;flex:0 0 52px;width:52px;height:32px;border-radius:999px;border:0;background:${a.on?'#C4410C':'#EADFD6'};cursor:pointer"><span style="position:absolute;top:3px;left:${a.on?23:3}px;width:26px;height:26px;border-radius:50%;background:#FFFFFF;box-shadow:0 1px 3px rgba(31,26,23,.25)"></span></button></div></div>`+
        `<div class="lbl">Esperar antes de asignar</div><div class="grid4" style="grid-template-columns:repeat(5,minmax(0,1fr))">${[1,2,3,5,10].map(m=>`<button type="button" class="${m===a.min?'on':''}" data-sa="min:${m}">${m} min</button>`).join('')}</div>`+U.note('Funciona mientras tengas este panel abierto en algún teléfono o computadora.')}},
    async a(x){const c=C2['s:asignación automática'],v=Object.assign({},c.data);if(x==='on')v.on=!v.on;else v.min=+x.split(':')[1];
      const q=await D().from('ajustes').upsert({clave:'auto_asignar',valor:v,actualizado_en:new Date().toISOString()});if(q.error){mal(/relation|column|schema/i.test(q.error.message)?'Falta aplicar un cambio en la base de datos (tabla ajustes).':'No se pudo guardar: '+q.error.message);return}c.data=v}};

  /* --- Ranking --- */
  SEC['ranking de negocios y motorizados']={g:'Control de pedidos',t:'Ranking',rf:1,
    load:async()=>{const dias=SF['ranking de negocios y motorizados'].d||30,desde=new Date(Date.now()-dias*864e5).toISOString();
      let r=await D().from('pedidos').select('id,estado,negocio_id,motorizado_id,subtotal,total,creado_en,negocio_aceptado_en,asignado_en,aceptado_en,listo_para_recojo_en,en_camino_en,entregado_en,tiempo_preparacion_min,cancelado_por,no_entregado').gte('creado_en',desde).limit(8000);
      if(r.error)r=await D().from('pedidos').select('id,estado,negocio_id,motorizado_id,subtotal,total,creado_en,negocio_aceptado_en,asignado_en,aceptado_en,listo_para_recojo_en,en_camino_en,entregado_en,tiempo_preparacion_min').gte('creado_en',desde).limit(8000);if(r.error)throw r.error;
      const [b,cal]=await Promise.all([baseCtl(),D().from('calificaciones').select('negocio_id,motorizado_id,estrellas_negocio,estrellas_motorizado').gte('creado_en',desde)]);return {P:r.data||[],b,cal:cal.data||[],dias}},
    v(){const f=SF['ranking de negocios y motorizados'];f.d=f.d||30;const c=datos('ranking de negocios y motorizados',this.load);
      let h=`<div class="seg" style="grid-template-columns:repeat(3,minmax(0,1fr))">${[7,30,90].map(d=>`<button type="button" class="${f.d===d?'on':''}" data-sa="d:${d}">${d} días</button>`).join('')}</div>`;
      if(!c.data||c.data.dias!==f.d)return {body:h+cargando(c)};const {P,b,cal}=c.data;
      const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null,mi=(a,z)=>a&&z?(T(z)-T(a))/60000:null,okk=x=>x!=null&&x>=0&&x<300;
      const agr=k=>{const g=new Map();P.forEach(p=>{const id=p[k];if(!id)return;const x=g.get(String(id))||{id:String(id),P:[]};x.P.push(p);g.set(String(id),x)});return [...g.values()]};
      const es=(k,id)=>avg(cal.filter(x=>String(x[k+'_id'])===id&&Number(x['estrellas_'+k])>0).map(x=>Number(x['estrellas_'+k])));
      const fm=v=>v==null?'—':Math.round(v)+' min',fs=v=>v==null?'—':'★ '+v.toFixed(1);
      const ng=agr('negocio_id').map(x=>{const e=x.P.filter(p=>est(p)==='entregado');return {n:(b.negs.find(n=>String(n.id)===x.id)||{}).nombre||'Negocio',ped:x.P.length,venta:e.reduce((s,p)=>s+(Number(p.subtotal)||0),0),acep:avg(x.P.map(p=>mi(p.creado_en,p.negocio_aceptado_en)).filter(okk)),prep:avg(x.P.map(p=>mi(p.negocio_aceptado_en,p.listo_para_recojo_en)).filter(okk)),anul:x.P.filter(p=>est(p)==='cancelado'&&p.cancelado_por==='negocio').length,est:es('negocio',x.id)}}).sort((a,z)=>z.venta-a.venta);
      const mo=agr('motorizado_id').map(x=>{const e=x.P.filter(p=>est(p)==='entregado');return {n:mN(b,x.id),ent:e.length,acep:avg(x.P.map(p=>mi(p.asignado_en,p.aceptado_en)).filter(okk)),viaje:avg(e.map(p=>mi(p.en_camino_en,p.entregado_en)).filter(okk)),noE:x.P.filter(p=>p.no_entregado).length,est:es('motorizado',x.id)}}).sort((a,z)=>z.ent-a.ent);
      const pos=(i)=>`<span style="flex:0 0 30px;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;background:${i<3?'#C4410C':'#F6EFE9'};color:${i<3?'#FFFFFF':'#6B5E55'}">${i+1}</span>`;
      h+=`<div class="cd"><div class="lbl">Negocios · por ventas</div>${ng.length?ng.map((x,i)=>`<div class="mv">${pos(i)}<span class="tx"><b>${E(x.n)}</b><span>${x.ped} pedidos · acepta en ${fm(x.acep)} · prepara en ${fm(x.prep)} · anuló ${x.anul} · ${fs(x.est)}</span></span><span class="am">${M(x.venta)}</span></div>`).join(''):'<div style="color:#6B5E55">Sin datos.</div>'}</div>`;
      h+=`<div class="cd"><div class="lbl">Motorizados · por entregas</div>${mo.length?mo.map((x,i)=>`<div class="mv">${pos(i)}<span class="tx"><b>${E(x.n)}</b><span>acepta en ${fm(x.acep)} · viaje ${fm(x.viaje)} · no entregados ${x.noE} · ${fs(x.est)}</span></span><span class="am">${x.ent}</span></div>`).join(''):'<div style="color:#6B5E55">Sin datos.</div>'}</div>`;
      return {body:h+U.note('«Acepta en» cuenta desde que llega el pedido (negocio) o desde que se le asigna (motorizado).')}},
    async a(x){SF['ranking de negocios y motorizados'].d=+x.split(':')[1];recargar('ranking de negocios y motorizados')}};

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

  /* --- Registro de acciones --- */
  SEC['registro de acciones']={g:'Clientes',t:'Registro de acciones',rf:1,
    load:async()=>{const [a,c,pf]=await Promise.all([D().from('acciones_admin').select('*').order('creado_en',{ascending:false}).limit(300),D().from('pedidos_cambios').select('*').in('rol',['administrador','admin']).order('creado_en',{ascending:false}).limit(300),D().from('perfiles').select('id,nombre_completo').eq('rol','administrador')]);
      const qn=id=>((pf.data||[]).find(p=>String(p.id)===String(id))||{}).nombre_completo||'Administrador';
      const TB={movimientos_caja:'Caja',negocios:'Negocio',motorizados:'Motorizado',clientes_bloqueados:'Lista negra',ajustes:'Ajustes',productos_negocio:'Producto'},AC={insert:'creó',update:'editó',delete:'borró'};
      return (a.data||[]).map(x=>({t:x.creado_en,u:qn(x.usuario_id),txt:(TB[x.tabla]||x.tabla)+' · '+(AC[x.accion]||x.accion),det:x.detalle||''})).concat((c.data||[]).map(x=>({t:x.creado_en,u:qn(x.usuario_id),txt:'Pedido '+ref(x.pedido_id)+' · '+x.campo,det:(x.antes||'—')+' → '+(x.despues||'—')}))).sort((p,q)=>T(q.t)-T(p.t))},
    v(){const k='registro de acciones',c=datos(k,this.load),f=SF[k];f.q=f.q||'';
      let h=U.note('Todo lo que hace cada administrador en pedidos, caja, negocios, motorizados, productos y lista negra.')+`<div class="fld"><label for="rgQ" style="position:absolute;width:1px;height:1px;overflow:hidden">Buscar</label><input id="rgQ" type="search" placeholder="Buscar pedido, negocio o administrador" value="${E(f.q)}" data-in="sf:q" data-vivo="rgL"></div>`;
      if(!c.data)return {body:h+cargando(c)};
      return {body:h+`<div id="rgL">${this.lista()}</div>`}},
    lista(){const f=SF['registro de acciones'],c=C2['s:registro de acciones'];const q=(f.q||'').trim().toLowerCase();const L2=(c&&c.data||[]).filter(r=>!q||(r.txt+' '+r.det+' '+r.u).toLowerCase().includes(q));
      return L2.length?`<div class="cd">${L2.slice(0,200).map(r=>fila(E(r.txt),E(r.u)+' · '+E(fecha(r.t))+(r.det?' · '+E(r.det.slice(0,180)):''))).join('')}</div>`:vacio('Sin acciones registradas todavía.')}};

  /* --- Mensajes masivos --- */
  const KENV='pidemas-admin-masivo-enviados';
  SEC['mensajes masivos por whatsapp']={g:'Clientes',t:'Mensajes masivos',rf:1,
    load:async()=>{const [r,bl,cl]=await Promise.all([D().from('pedidos').select('telefono_cliente,nombre_cliente,creado_en,estado').gte('creado_en',new Date(Date.now()-180*864e5).toISOString()).limit(8000),D().from('clientes_bloqueados').select('telefono'),D().from('clientes').select('*')]);
      const ult=new Map(),cu=new Map();(r.data||[]).forEach(p=>{const t=d9(p.telefono_cliente);if(t.length!==9)return;const ts=T(p.creado_en);if(ts>(ult.get(t)||0))ult.set(t,ts);if(est(p)==='entregado')cu.set(t,(cu.get(t)||0)+1)});
      const B=new Set((bl.data||[]).map(x=>x.telefono)),base=new Map();(cl.data||[]).filter(c=>c.activo!==false).forEach(c=>{const t=d9(cliT(c));if(t.length===9&&!B.has(t))base.set(t,{t,n:cliN(c)})});
      (r.data||[]).forEach(p=>{const t=d9(p.telefono_cliente);if(t.length===9&&!B.has(t)&&!base.has(t))base.set(t,{t,n:p.nombre_cliente||''})});return {ult,cu,base:[...base.values()]}},
    v(){const k='mensajes masivos por whatsapp',c=datos(k,this.load),f=SF[k];if(f.msg==null)f.msg='Hola {nombre} 👋, te escribimos de *Pidemás Delivery*. ';f.fl=f.fl||'todos';
      let h=U.note('Escribe el mensaje, elige a quiénes y toca «Enviar» en cada cliente: se abre WhatsApp con el mensaje listo. {nombre} se cambia por el nombre del cliente.');
      h+=`<div class="fld"><label for="mvT">Mensaje</label><textarea id="mvT" rows="4" maxlength="900" data-in="sf:msg" data-vivo="mvL" style="width:100%;min-height:110px;border-radius:14px;border:1.5px solid #F1E4DA;padding:12px 16px;font:500 16px PdInter,Inter,system-ui,sans-serif;color:#1F1A17;box-sizing:border-box;outline:none;resize:vertical">${E(f.msg)}</textarea></div>`;
      h+=`<div class="chips" style="flex-wrap:wrap">${[['todos','Todos'],['recientes','Pidieron en 30 días'],['inactivos','Sin pedir 30+ días'],['fieles','5+ pedidos']].map(x=>`<button type="button" class="${f.fl===x[0]?'on':''}" data-sa="fl:${x[0]}">${x[1]}</button>`).join('')}</div>`;
      if(!c.data)return {body:h+cargando(c)};
      return {body:h+`<div id="mvL">${this.lista()}</div>`,foot:`<button type="button" class="b" style="height:48px" data-sa="reset">Empezar nueva campaña (borrar marcas de enviado)</button>`}},
    lista(){const k='mensajes masivos por whatsapp',f=SF[k],c=C2['s:'+k];if(!c||!c.data)return '';const {ult,cu,base}=c.data,now=Date.now();let env=new Set();try{env=new Set(JSON.parse(localStorage.getItem(KENV)||'[]'))}catch(e){}
      const L2=base.filter(x=>{const u=ult.get(x.t)||0;if(f.fl==='recientes')return u&&now-u<=30*864e5;if(f.fl==='inactivos')return !u||now-u>30*864e5;if(f.fl==='fieles')return (cu.get(x.t)||0)>=5;return true}).sort((a,z)=>(ult.get(z.t)||0)-(ult.get(a.t)||0));
      return `<div class="lbl">${L2.length} cliente${L2.length===1?'':'s'} · enviados ${L2.filter(x=>env.has(x.t)).length}</div><div class="cd">${L2.slice(0,300).map(x=>{const txt=f.msg.replace(/\{nombre\}/g,String(x.n||'').split(' ')[0]||'').replace(/\s+,/g,',');const sent=env.has(x.t);
        return fila(E(x.n||'Cliente'),E(x.t)+(ult.get(x.t)?' · último pedido '+E(fecha(ult.get(x.t))):''),`<a class="b${sent?'':' g'}" style="height:38px;padding:0 12px" target="_blank" rel="noopener" data-env="${x.t}" href="https://wa.me/51${x.t}?text=${encodeURIComponent(txt)}">${sent?IC.check+'Enviado':'Enviar'}</a>`)}).join('')||'<div style="color:#6B5E55">No hay clientes en este grupo.</div>'}</div>`},
    async a(x){const f=SF['mensajes masivos por whatsapp'];if(x==='reset'){try{localStorage.setItem(KENV,'[]')}catch(_){}return}f.fl=x.split(':')[1]}};

  /* --- Suspender / reactivar cuentas --- */
  SEC['suspender / reactivar cuentas']={g:'Motorizados',t:'Suspender o reactivar',rf:1,
    load:async()=>{const r=await D().from('motorizados').select('id,nombre_completo,telefono,activo').order('nombre_completo',{ascending:true});if(r.error)throw r.error;return r.data||[]},
    v(){const k='suspender / reactivar cuentas',c=datos(k,this.load),f=SF[k];f.f=f.f||'todas';f.q=f.q||'';if(!c.data)return {body:cargando(c)};const R=c.data,on=R.filter(m=>m.activo!==false).length;
      let h=`<div class="g2"><div class="kp"><span>Cuentas activas</span><b>${on}</b></div><div class="kp"><span>Suspendidas</span><b>${R.length-on}</b></div></div><div class="fld"><input type="search" placeholder="Buscar motorizado" value="${E(f.q)}" data-in="sf:q" data-vivo="spL" aria-label="Buscar motorizado"></div><div class="seg" style="grid-template-columns:repeat(3,minmax(0,1fr))">${[['todas','Todas'],['on','Activas'],['off','Suspendidas']].map(x=>`<button type="button" class="${f.f===x[0]?'on':''}" data-sa="f:${x[0]}">${x[1]}</button>`).join('')}</div>`;
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
      let h=`<div class="cols3"><div class="kp"><span>En línea</span><b>${on}</b></div><div class="kp"><span>Sin señal</span><b>${S2.length-on}</b></div><div class="kp"><span>En ruta</span><b>${S2.filter(s=>s.n).length}</b></div></div>`;
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

  /* --- QR Yape --- */
  SEC['qr yape']={g:'Más',t:'QR Yape',
    load:async()=>Object.assign({url:'',numero:'986233533',titular:'Grupo Pidemás EIRL',whatsapp_admin:'986233533'},(await leerCfg())||{}),
    v(){const k='qr yape',c=datos(k,this.load),f=SF[k];if(!c.data)return {body:cargando(c)};if(f.num==null){f.num=c.data.numero||'';f.tit=c.data.titular||''}
      const u=f.prev||c.data.url;
      return {body:U.note('Es el QR que el motorizado le muestra al cliente para que pague por Yape a Pidemás.')+`<div class="qrbox" style="display:flex;align-items:center;justify-content:center;min-height:220px;border-radius:18px;background:#FFFFFF;border:1px dashed #E3CFC2;color:#6B5E55;font-size:15px;text-align:center;padding:12px">${u?`<img src="${E(u)}" alt="QR de Yape" style="max-width:220px;max-height:220px">`:'Usando el QR actual del sistema<br>(Grupo Pidemás EIRL)'}</div>
        <label class="b" style="cursor:pointer">${IC.plus}${u?'Cambiar imagen del QR':'Subir imagen del QR'}<input type="file" accept="image/png,image/jpeg,image/webp" data-in="qrfile" style="display:none"></label>
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

  /* --- Mi perfil --- */
  SEC['__perfil']={g:'Mi cuenta',t:'Mi perfil',
    load:async()=>{const {data:{session}}=await D().auth.getSession();const uid=session&&session.user&&session.user.id;let p={};if(uid){const r=await D().from('perfiles').select('*').eq('id',uid).maybeSingle();p=r.data||{}}const cfg=await leerCfg();return {uid,email:session&&session.user&&session.user.email,p,wa:(cfg&&cfg.whatsapp_admin)||'986233533'}},
    v(){const k='__perfil',c=datos(k,this.load),f=SF[k];if(!c.data)return {body:cargando(c)};const d=c.data;if(f.nom==null){f.nom=d.p.nombre_completo||d.p.nombre||'';f.wa=d.wa;f.p1='';f.p2=''}
      const foto=f.prev||d.p.foto_url||window.__pdAdminFoto||'';
      let h=`<div class="ph"><span class="ava"${foto?` style="background-image:url('${E(foto)}')"`:''}>${foto?'':E(String(f.nom||'A').charAt(0).toUpperCase())}</span><div style="flex:1 1 0%;min-width:0"><b style="display:block;font-size:20px">${E(f.nom||'Administrador')}</b><span style="font-size:13px;color:#6B5E55">Administrador · ${E(d.email||'')}</span></div><label class="b" style="height:44px;cursor:pointer">${IC.plus}Foto<input type="file" accept="image/jpeg,image/png,image/webp" data-in="pfoto" style="display:none"></label></div>`;
      h+=`<div class="cd"><div class="lbl">Tus datos</div><div class="fld"><label for="pfN">Tu nombre</label><input id="pfN" maxlength="40" value="${E(f.nom)}" data-in="sf:nom"></div><div class="fld"><label for="pfW">WhatsApp de administración</label><input id="pfW" type="tel" inputmode="numeric" maxlength="15" value="${E(f.wa)}" data-in="sf:wa"></div><span style="font-size:13px;color:#6B5E55">A este número los motorizados envían la guía y clave de las encomiendas y los avisos de problemas.</span><button type="button" class="b o" data-sa="guardar">Guardar cambios</button></div>`;
      h+=`<div class="cd"><div class="lbl">Seguridad</div><div class="fld"><label for="pfP1">Nueva contraseña</label><input id="pfP1" type="password" autocomplete="new-password" value="${E(f.p1)}" data-in="sf:p1" placeholder="Mínimo 6 caracteres"></div><div class="fld"><label for="pfP2">Repite la contraseña</label><input id="pfP2" type="password" autocomplete="new-password" value="${E(f.p2)}" data-in="sf:p2"></div><button type="button" class="b" data-sa="clave">${IC.lock||''}Cambiar contraseña</button></div>`;
      if(f.msg)h+=`<div class="err">${E(f.msg)}</div>`;
      h+=`<button type="button" class="b" style="color:#B42318;border-color:#F4C7C3" data-a="salir">${IC.logout}Cerrar sesión</button>`;
      return {body:h}},
    async a(x){const k='__perfil',f=SF[k],d=C2['s:'+k].data;f.msg='';
      if(x==='guardar'){const n=String(f.nom||'').trim();if(!n){f.msg='Escribe tu nombre.';return}const w=String(f.wa||'').replace(/\D/g,'');if(w&&w.length!==9&&w.length!==11){f.msg='El WhatsApp de administración debe tener 9 dígitos.';return}
        if(d.uid){const q=await D().from('perfiles').update({nombre_completo:n}).eq('id',d.uid).select('id').maybeSingle();if(q.error){f.msg='No se pudo guardar: '+q.error.message;return}}
        try{localStorage.setItem('pd_admin_name',n)}catch(_){}window.__pdAdminNombre=n;
        const cfg=await leerCfg();if(cfg&&(cfg.whatsapp_admin||'')!==w){cfg.whatsapp_admin=w;cfg.actualizado_en=new Date().toISOString();try{await guardarCfg(cfg)}catch(e){f.msg='Se guardó tu nombre, pero no el WhatsApp: '+(e.message||e);return}}
        ok('Cambios guardados');recargar(k);f.nom=null;return}
      if(x==='clave'){if(String(f.p1).length<6){f.msg='La contraseña debe tener al menos 6 caracteres.';return}if(f.p1!==f.p2){f.msg='Las dos contraseñas no coinciden.';return}
        const q=await D().auth.updateUser({password:f.p1});if(q.error){f.msg='No se pudo cambiar: '+q.error.message;return}f.p1='';f.p2='';ok('Contraseña actualizada')}}};

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
      const par=(a,b)=>b===null||b===undefined||b===''?'':`<div class="li" style="align-items:flex-start"><span>${E(a)}</span><b style="white-space:normal;text-align:right">${E(Array.isArray(b)?b.join(', '):b)}</b></div>`;
      h+=V.length?V.map(r=>{const ab=!!f.ab[r.id],w=telW(r.rep_celular),u=solMapa(r);
        return `<div class="cd"><div class="row"><span class="ic" style="flex:0 0 44px;width:44px;height:44px;border-radius:12px;background:#FDEBDF;color:#C4410C;display:flex;align-items:center;justify-content:center;font-weight:800">${E((String(r.nombre_negocio||'?').trim()[0]||'?').toUpperCase())}</span><div style="flex:1 1 0%;min-width:0"><b style="display:block;font-size:16px">${E(r.nombre_negocio||'Negocio')}</b><span style="font-size:13px;color:#6B5E55">${E([r.categoria,r.distrito||r.ciudad].filter(Boolean).join(' · '))}</span></div><span class="pl${r.estado==='aprobada'?' g':r.estado==='rechazada'?' r':''}">${E(ESTS[r.estado]||r.estado)}</span></div>
          ${par('Contacto',r.rep_nombre)}${par('Celular',r.rep_celular)}${par('Recibida',fecha(r.created_at))}
          <button type="button" class="b" style="height:42px" data-sa="ab:${E(r.id)}">${ab?'Ocultar detalle':'Ver detalle'}</button>
          ${ab?`<div class="lbl">Negocio</div>${par('Razón social',r.razon_social)}${par('RUC',r.ruc)}${par('Tipo',r.categoria)}${par('Dirección',r.direccion)}${par('Distrito',r.distrito)}${par('Ciudad',r.ciudad)}${par('Referencia',r.referencia)}${par('Redes / web',r.redes)}${u?`<a class="b" style="height:42px" href="${E(u.url)}" target="_blank" rel="noopener">${IC.pin}Ver en el mapa</a>`:''}
            <div class="lbl">Representante</div>${par('Nombre',r.rep_nombre)}${par('DNI',r.rep_dni)}${par('Cargo',r.rep_cargo)}${par('Celular',r.rep_celular)}${par('Correo',r.rep_correo)}
            <div class="lbl">Productos</div>${par('Productos',r.productos)}${par('Cantidad en carta',r.num_productos)}${par('Stock aproximado',r.stock_aprox)}${par('Controla inventario',r.maneja_stock)}${par('Fotos / catálogo',r.tiene_fotos)}
            <div class="lbl">Atención</div>${par('Horario',r.horario)}${par('Pedidos por día',r.pedidos_dia)}${par('Preparación',r.tiempo_prep?r.tiempo_prep+' min':'')}${par('Repartidores propios',r.delivery_propio)}${par('Pagos',r.pagos)}${par('Comentarios',r.comentarios)}
            <div class="fld"><label>Notas internas</label><textarea data-in="sf:n_${E(r.id)}" style="width:100%;min-height:80px;border-radius:14px;border:1.5px solid #F1E4DA;padding:12px;font:500 15px PdInter,Inter,sans-serif;box-sizing:border-box">${E(f['n_'+r.id]!=null?f['n_'+r.id]:r.notas_admin||'')}</textarea></div><button type="button" class="b" style="height:42px" data-sa="nota:${E(r.id)}">Guardar nota</button>`:''}
          <div class="btns" style="grid-template-columns:repeat(${[w,r.estado!=='revision',r.estado!=='rechazada',r.estado!=='aprobada'].filter(Boolean).length||1},minmax(0,1fr))">${w?`<a class="b g" href="https://wa.me/${w}" target="_blank" rel="noopener">${U.I.wa}</a>`:''}${r.estado!=='revision'?`<button type="button" class="b" data-sa="est:${E(r.id)}:revision">Revisión</button>`:''}${r.estado!=='rechazada'?`<button type="button" class="b" style="color:#B42318;border-color:#F4C7C3" data-sa="est:${E(r.id)}:rechazada">Rechazar</button>`:''}${r.estado!=='aprobada'?`<button type="button" class="b o" data-sa="est:${E(r.id)}:aprobada">Aprobar</button>`:''}</div>
          <button type="button" class="b" data-sa="crear:${E(r.id)}">${IC.store}Crear negocio con estos datos</button><button type="button" class="b" style="height:40px;color:#B42318;border:0;background:transparent" data-sa="del:${E(r.id)}">Eliminar solicitud</button></div>`}).join(''):vacio('No hay solicitudes en esta lista.');
      return {body:h}},
    async a(x){const k='solicitudes de afiliación',f=SF[k],R=C2['s:'+k].data,p=x.split(':'),r=R.find(y=>String(y.id)===p[1]);
      if(p[0]==='f'){f.f=p[1];return}if(!r)return;
      if(p[0]==='ab'){f.ab[r.id]=!f.ab[r.id];return}
      const upd=async(cb,msg)=>{const q=await D().from('solicitudes_afiliacion').update(cb).eq('id',r.id);if(q.error){mal('No se pudo guardar el cambio.');return}Object.assign(r,cb);ok(msg)};
      if(p[0]==='est')return upd({estado:p[2]},'Solicitud marcada como '+ESTS[p[2]].toLowerCase());
      if(p[0]==='nota')return upd({notas_admin:String(f['n_'+r.id]??r.notas_admin??'').trim()||null},'Nota guardada');
      if(p[0]==='del'){if(!(await conf('¿Eliminar esta solicitud? No se puede deshacer.')))return;const q=await D().from('solicitudes_afiliacion').delete().eq('id',r.id);if(q.error){mal('No se pudo eliminar.');return}C2['s:'+k].data=R.filter(y=>y!==r);ok('Solicitud eliminada');return}
      if(p[0]==='crear'){marca='menu';kick='Negocios';await (window.__pdmOpen&&window.__pdmOpen('crear-negocio'));const set=(i,v)=>{const e=$(i);if(e&&v){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))}};
        set('rNombre',r.nombre_negocio);set('rTelefono',r.rep_celular);set('rDireccion',[r.direccion,r.distrito].filter(Boolean).join(', '));set('rDescripcion',r.productos);set('rTiempo',r.tiempo_prep?r.tiempo_prep+' min':'');const u=solMapa(r);if(u){set('rGoogleMaps',u.url);set('rLatitud',String(u.lat));set('rLongitud',String(u.lng))}}}};

  /* --- Códigos de descuento --- */
  const dcSt=p=>{if(p.activo!==true)return 'Inactivo';const now=Date.now(),i=p.fecha_inicio?Date.parse(p.fecha_inicio):null,f=p.fecha_fin?Date.parse(p.fecha_fin):null;if(i&&now<i)return 'Programado';if(f&&now>f)return 'Vencido';const mx=Number(p.max_usos||0);if(mx>0&&Number(p.usos||0)>=mx)return 'Agotado';return 'Activo'};
  const pad2=n=>String(n).padStart(2,'0'),toLoc=v=>{if(!v)return '';const d=new Date(v);if(isNaN(d))return '';return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate())+'T'+pad2(d.getHours())+':'+pad2(d.getMinutes())},fromLoc=v=>{if(!v)return null;const d=new Date(v);return isNaN(d)?null:d.toISOString()};
  SEC['códigos de descuento']={g:'Más',t:'Códigos de descuento',rf:1,
    load:async()=>{const r=await D().from('codigos_delivery').select('*');if(r.error)throw r.error;return (r.data||[]).sort((a,b)=>(Date.parse(b.creado_en||b.created_at||b.fecha_inicio||0)||0)-(Date.parse(a.creado_en||a.created_at||a.fecha_inicio||0)||0))},
    v(){const k='códigos de descuento',c=datos(k,this.load),f=SF[k];f.fl=f.fl||'todos';
      if(f.ed)return this.form();if(!c.data)return {body:cargando(c)};const R=c.data,S2=R.map(dcSt);
      let h=`<div class="cols3"><div class="kp"><span>Activos</span><b>${S2.filter(s=>s==='Activo').length}</b></div><div class="kp"><span>Usos</span><b>${R.reduce((a,p)=>a+Number(p.usos||0),0)}</b></div><div class="kp"><span>Vencidos</span><b>${S2.filter(s=>s==='Vencido'||s==='Agotado').length}</b></div></div>`;
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
  function pintarNav(show){
    const H=document.documentElement;
    if(!show){if(navH&&navH.style.display!=='none')navH.style.display='none';if(host)host.style.bottom='';if(H.style.getPropertyValue('--pda-nav')!=='0px')H.style.setProperty('--pda-nav','0px');return}
    if(!navH){navH=document.createElement('pd-app-adm-nav');$('pdAppShell').appendChild(navH);navR=navH.attachShadow({mode:'open'});
      navR.addEventListener('click',e=>{const b=e.target.closest('[data-n]');if(!b)return;cajon=false;nuevoAb=false;mq='';const k=b.dataset.n;if(k===navG&&!sub&&!paginaVieja()&&tab===k){const l=root&&root.querySelector('.list');if(l)l.scrollTo({top:0,behavior:'smooth'});return}ir(k)})}
    if(navH.style.display==='none')navH.style.display='';
    if(host&&host.style.bottom!==NAVALTO)host.style.bottom=NAVALTO;
    if(H.style.getPropertyValue('--pda-nav')!==NAVALTO)H.style.setProperty('--pda-nav',NAVALTO);
    const h=NAVK.map(k=>{const n=hubBd(k);return `<button type="button" data-n="${k}" class="${navG===k?'on':''}"${navG===k?' aria-current="page"':''}><span class="pi">${IC[HUBS[k].ic]}${n?`<span class="bd">${n>99?'99+':n}</span>`:''}</span><span class="lb">${HUBS[k].t}</span></button>`}).join('');
    if(h===navKey)return;navKey=h;
    navR.innerHTML=`<style>:host{all:initial;position:fixed;left:0;right:0;bottom:0;z-index:2147482700;display:block;font-family:PdInter,Inter,system-ui,sans-serif}
nav{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));height:70px;padding:0 4px env(safe-area-inset-bottom,0px);background:#FFFFFF;border-top:1px solid #F1E4DA;box-shadow:0 -4px 16px rgba(31,26,23,.05)}
button{all:unset;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#6B5E55;font-size:12px;font-weight:700;-webkit-tap-highlight-color:transparent;min-width:0}
.pi{position:relative;width:58px;height:32px;border-radius:999px;display:flex;align-items:center;justify-content:center;transition:background .18s}
.pi svg{width:23px;height:23px}
button.on{color:#C4410C;font-weight:800}button.on .pi{background:#FDEBDF}
button:active .pi{transform:scale(.92)}
.bd{position:absolute;top:-5px;right:5px;min-width:20px;height:20px;padding:0 6px;box-sizing:border-box;border-radius:999px;background:#C4410C;color:#FFFFFF;font-size:11.5px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #FFFFFF}
.lb{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
</style><nav aria-label="Menú del admin">${h}</nav>`;
  }
  function nav(){
    if(!cajon)return '';
    const m=$('pdMenu'),top=m&&m.querySelector('.m3Top'),nom=top?(top.querySelector('strong')||{}).textContent||'Admin':'Admin',foto=window.__pdAdminFoto||'',nP=L().filter(CH[1][2]).length;
    const act=sub==='sec'?'':tab;
    const it=[['inicio','Pedidos',IC.box,nP],['caja','Cajas',IC.cash],['sueldo','Sueldos',IC.wallet],['clientes','Clientes',IC.group]];
    return `<div class="dwb" data-a="cajon"></div><aside class="dw" aria-label="Menú"><div class="dwh"><button type="button" class="yo" data-a="perfil" style="border:0;padding:0;background:transparent"><span class="ava"${foto?` style="background-image:url('${E(foto)}')"`:''}>${foto?'':E(nom.trim().charAt(0))}</span><span style="flex:1 1 0%;min-width:0"><b style="display:block;font-size:18px">${E(nom)}</b><span style="font-size:13px;color:#6B5E55">Ver mi perfil</span></span></button><button type="button" class="ib" data-a="cajon" aria-label="Cerrar menú">${IC.x}</button></div>
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
      if(inp.readOnly||inp.disabled||inp.closest('.pgw'))return;
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
      root.addEventListener('click',clic);root.addEventListener('input',entrada);
      root.addEventListener('pointerdown',()=>{tocando=true});root.addEventListener('click',()=>setTimeout(()=>{tocando=false},60),true);root.addEventListener('pointercancel',()=>{tocando=false});
    }
    if(host.style.display==='none')host.style.display='';
    cls(H,'pdaApp',1);
    const pv=paginaVieja();
    if(movido&&!pv){movido.ph.parentNode&&(movido.ph.parentNode.insertBefore(movido.t,movido.ph),movido.ph.remove());movido=null}
    cls(host,'cargaPag',!pv&&Date.now()<pagHasta);
    if(pv){cls(H,'pdaPag',1);cls(host,'solo',1);pintarTop(pv)}
    else if(Date.now()<pagHasta){return}
    else{cls(H,'pdaPag',0);cls(host,'solo',0);if(topH&&topH.style.display!=='none')topH.style.display='none';keyTop=''}
    {const vv=pv?null:vista();pintarNav(!(vv&&vv.foot)||!!(window.PdPasos&&PdPasos.isOpen()));}
    if(tocando)return;
    const act=root.activeElement;if(act&&(act.tagName==='INPUT'||act.tagName==='TEXTAREA'||act.tagName==='SELECT'))return;
    const v=pv?{head:'',body:'',foot:''}:vista();const pag=pv?'vieja':sub==='sueldomoto'?'sl:'+SL.pest+':'+(SL.vista||''):(sub||tab);
    const k=pag+'|'+v.head+v.body+(v.foot||'')+nav();
    if(k===key)return;key=k;
    const lst=root.querySelector('.list');if(lst&&root.__pag)scrollMem[root.__pag]=lst.scrollTop;
    root.innerHTML=`<style>${ESTILO}</style><div class="app">${pv?'':v.head+`<div class="list">${v.body}</div>`+(v.foot?`<div class="foot">${v.foot}</div>`:'')}${nav()}</div>`;
    const nl=root.querySelector('.list');if(nl)nl.scrollTop=root.__pag===pag?(scrollMem[pag]||0):0;root.__pag=pag;
    if(sub==='pedidoform'&&PE.f&&PE.f.sv)try{pegarEn(root)}catch(_){}
    if(!pv&&H.style.overflow!=='hidden')H.style.overflow='hidden';
  }
  function abrirSeccion(k,m,kk){ultimo='';prepararPag();if(window.PdPasos&&PdPasos.isOpen())PdPasos.close();marca=m;kick=kk||'Administración';if(movido)volverLista();try{window.__pdmOpen&&window.__pdmOpen(k)}catch(e){console.warn(e)}key='';setTimeout(pintar,60)}
  function ir(t){
    if(window.PdPasos&&PdPasos.isOpen())PdPasos.close();
    if(paginaVieja())cerrarVieja();
    if(sub&&history.state?.pdApp){ignorarPop=true;history.back()}sub=null;
    if(t==='menu')t='h:mas';
    if(t!=='h:mas')mq='';navG=HUBDE[t]||(NAVK.includes(t)?t:navG);
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
    if(k.startsWith('sf:')){SF[secK][k.slice(3)]=el.value;const vv=el.dataset.vivo;if(vv&&SEC[secK].lista){clearTimeout(entrada.t);entrada.t=setTimeout(()=>{const b=root.getElementById(vv);if(b)b.innerHTML=SEC[secK].lista()},250)}return}
    if(k==='qrfile'){const fl=el.files&&el.files[0];el.value='';if(!fl)return;if(!/^image\//.test(fl.type)||fl.size>5*1024*1024){mal('Elige una imagen (PNG o JPG) de menos de 5 MB.');return}SF['qr yape'].file=fl;SF['qr yape'].prev=URL.createObjectURL(fl);key='';pintar();return}
    if(k==='pfoto'){const fl=el.files&&el.files[0];el.value='';const i=$('pdhFotoFile');if(!fl||!i)return;try{const dt=new DataTransfer();dt.items.add(fl);i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}))}catch(_){}SF['__perfil'].prev=URL.createObjectURL(fl);key='';pintar();return}
    if(k.startsWith('hr:')){const [,d,c]=k.split(':');SF['horario'].C.dias[d][c]=el.value;return}
    if(k.startsWith('dc:')){const f=SF['códigos de descuento'];if(f&&f.ed){let v=el.value;if(k==='dc:codigo'){v=v.toUpperCase().replace(/\s+/g,'');el.value=v}f.ed[k.slice(3)]=v;clearTimeout(entrada.d);entrada.d=setTimeout(()=>{const t=document.createElement('template');t.innerHTML=SEC['códigos de descuento'].form().body;const n=t.content.querySelector('.note'),o=root.querySelector('.list .note:last-of-type');const all=root.querySelectorAll('.list .note');if(n&&all.length)all[all.length-1].innerHTML=n.innerHTML},200)}return}
    if(k.startsWith('cf:')){CL.f[k.slice(3)]=el.value;return}
    if(PE.f&&k.startsWith('pe:')){PE.f[k.slice(3)]=el.value;peVivo();return}
    if(PE.f&&(k.startsWith('peq:')||k.startsWith('pep:'))){const x=PE.f.items[+k.slice(4)];if(x)x[k[2]==='q'?'q':'p']=el.value;peVivo();return}
    if(k==='mq'){mq=el.value;const g=root.getElementById('mG');if(g)g.innerHTML=HUBS[tab]&&tab!=='inicio'?hubSecs(tab):grupos()}}
  async function clic(e){
    tocando=false;
    const t=e.target.closest('[data-t]');if(t){cajon=false;ir(t.dataset.t);return}
    const c=e.target.closest('[data-c]');if(c){chip=c.dataset.c;limite=40;key='';pintar();return}
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
    const dl=e.target.closest('[data-del]');if(dl){await cajaBorrar(dl.dataset.del);key='';pintar();return}
    const rv=e.target.closest('[data-rv]');if(rv){e.preventDefault();await cajaRevision(rv.dataset.rv);key='';pintar();return}
    const g=e.target.closest('[data-g]');if(g){abiertoGr=abiertoGr===g.dataset.g?null:g.dataset.g;key='';pintar();return}
    const it=e.target.closest('[data-it]');if(it){cajon=false;nuevoAb=false}if(it&&it.dataset.it==='pedidos'){ir('inicio');return}if(it&&(it.dataset.it==='cajas'||it.dataset.it==='sueldos'||it.dataset.it==='clientes')&&!SEC[it.dataset.it]){ir(it.dataset.it==='cajas'?'caja':it.dataset.it==='sueldos'?'sueldo':'clientes');return}if(it&&SEC[it.dataset.it]){abrirSec(it.dataset.it);return}if(it){const b=document.querySelector(`#pdMenu .m3It[data-txt="${CSS.escape(it.dataset.it)}"]`);if(b){marca='menu';kick=it.dataset.gk||'Administración';ultimo=((it.querySelector('.tx')||it.querySelector('span')||{}).textContent||'').trim();if(movido)volverLista();prepararPag();b.click();key='';pintar();setTimeout(pintar,80)}return}
    const chm=e.target.closest('[data-chmas]');if(chm){const c=chm.parentNode.querySelector('.chips');if(c){const fin=c.scrollLeft+c.clientWidth>=c.scrollWidth-4;c.scrollTo({left:fin?0:c.scrollLeft+Math.max(160,c.clientWidth*.6),behavior:'smooth'});setTimeout(()=>chm.classList.toggle('fin',c.scrollLeft+c.clientWidth>=c.scrollWidth-4),400)}return}
    const a=e.target.closest('[data-a]');if(!a)return;
    if(a.dataset.a.startsWith('cj:dia:')){if(a.disabled)return;a.disabled=true;try{await cajaAccion(a.dataset.a,a)}finally{key='';pintar()}return}
    if(PE.f&&a.dataset.a.startsWith('pe:set:')){const [,,k,v]=a.dataset.a.split(':');PE.f[k]=v;key='';pintar();return}
    if(PE.f&&a.dataset.a.startsWith('pe:met:')){PE.f.metodo=a.dataset.a.slice(7);key='';pintar();return}
    if(PE.f&&a.dataset.a.startsWith('pe:quitar:')){const i=+a.dataset.a.slice(10),x=PE.f.items[i];if(x&&PE.f.items.length>1){PE.f.quitar.push(x.id);PE.f.items.splice(i,1);key='';pintar()}else if(x){(window.pdAviso||alert)('El pedido debe tener al menos un producto.')}return}
    switch(a.dataset.a){
      case 'hub':ir(HUBDE[tab]||'inicio');break;
      case 'cajon':if(!cajon&&paginaVieja())cerrarVieja();cajon=!cajon;if(cajon){abiertoGr=null;mq='';cajonT=Date.now();try{history.pushState({pdApp:1,cajon:1},'')}catch(_){}}else if(history.state&&history.state.cajon){ignorarPop=true;history.back()}key='';pintar();break;
      case 'act':{a.classList.add('spin');const r=$('refreshOrders');if(r)r.click();else try{await window.loadOrders()}catch(_){}setTimeout(()=>{key='';pintar()},800);break}
      case 'bell':{ultimo='Avisos';marca=tab;kick='Avisos';$('pdaBell')?.click();setTimeout(()=>{key='';pintar()},120);break}
      case 'atendidos':chip='entregado';limite=40;tab='inicio';key='';pintar();break;
      case 'nuevo':nuevoAb=!nuevoAb;key='';pintar();break;
      case 'nuevoX':nuevoAb=false;key='';pintar();break;
      case 'selmodo':{selModo=!selModo;const s=SEL();if(!selModo&&s)s.clear();key='';pintar();break}
      case 'seleditar':{const s2=SEL();if(!s2||s2.size!==1)break;const id=[...s2][0];selModo=false;s2.clear();await pedidoEditar(id);break}
      case 'borrar':{const s=SEL();if(!s||!s.size)break;try{await window.deleteSelectedOrders()}catch(err){(window.pdAviso||alert)(String(err.message||err))}if(!s.size)selModo=false;key='';pintar();break}
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
      case 'perfil':{cajon=false;abrirSec('__perfil');break;ultimo='Mi perfil';marca='menu';kick='Mi cuenta';const b=document.querySelector('#pdMenu .m3Top');if(b)b.click();setTimeout(()=>{key='';pintar()},120);break}
      case 'salir':{const b=document.querySelector('#pdMenu .m3Out');if(b)b.click();break}
    }
  }
  addEventListener('popstate',()=>{if(ignorarPop){ignorarPop=false;return}if(cajon){if(Date.now()-cajonT<600)return;cajon=false;key='';pintar();return}if(sub==='sueldomoto'&&SL.vista){SL.vista=null;SL.msg='';key='';pintar();return}if(sub){sub=null;key='';pintar()}});
  setInterval(pintar,600);
  window.pdAppAdm={pintar,ir,navH:()=>navH&&navH.style.display!=='none'?navH.getBoundingClientRect().height:0};
})();

