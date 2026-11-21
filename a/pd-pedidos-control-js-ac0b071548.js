
/* ===== antes pedidos-control.js ===== */
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

  /* Abre el detalle del pedido SIN pasar por el inicio: si el modal "Pedidos" ya está abierto no se vuelve a abrir ni a recargar la lista */
  function pedidosAbierto(){const pm=$('pdmModal'),t=$('pdmTitle');return !!pm&&!pm.hidden&&/pedidos/i.test((t&&t.textContent)||'')&&!!pm.querySelector('#orderList')}
  window.pdAbrirPedidoAdmin=abrirPedido;
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

  function bdg(k,v){const c=window.__pdCtlCuenta=window.__pdCtlCuenta||{};c[k]=v;document.querySelectorAll('[data-ctl="'+k+'"]').forEach(b=>{let i=b.querySelector('.pdCtlBdg');if(!v){if(i)i.remove();return}if(!i){i=document.createElement('b');i.className='pdCtlBdg';b.appendChild(i)}const t=v>99?'99+':String(v);if(i.textContent!==t)i.textContent=t})}
  let ppN=0;
  async function contarPp(){try{const r=await db().from('pedidos').select('id',{count:'exact',head:true}).not('negocio_id','is',null).eq('estado','entregado').is('negocio_pagado_en',null).not('pago_acordado','in','(solo_delivery,pagado,yape_negocio)').gt('subtotal',0);if(!r.error){ppN=r.count||0;bdg('pneg',ppN)}}catch(e){}}
  window.pdPedCtl={sugerencias};
  let n=0;setInterval(()=>{if(!document.querySelector('#appView:not(.hidden)')||!db())return;n++;if(n%20===1)contarPp();else bdg('pneg',ppN)},4000);
})();

