
/* ===== antes pedidos.js ===== */
/* Pidemás · Administrador · pedidos.js
   Gestión de pedidos: lista, detalle, seguimiento, avisos, tarifas y los servicios (recojo, compra, encomienda). */

/* ===== pidemas-pedidos-al-instante ===== */
try{
(function(){
const K='pd_adm_pedidos_v1';
const C=window.pdPedidosCache={uid:null,
  guardar(){
    if(!C.uid||!Array.isArray(allOrders))return;
    const L=allOrders.slice(0,60);
    const ids=new Set(L.map(o=>String(o.negocio_id||o.restaurante_id||'')));
    const neg=[...(adminRestaurantsById||new Map()).entries()].filter(([k])=>ids.has(k)).map(([,v])=>v);
    try{localStorage.setItem(K,JSON.stringify({uid:C.uid,t:Date.now(),o:L,m:allMotos||[],n:neg}))}catch(e){try{localStorage.removeItem(K)}catch(x){}}
  },
  pintar(uid){
    C.uid=uid;
    if(Array.isArray(allOrders)&&allOrders.length)return;
    let c=null;try{c=JSON.parse(localStorage.getItem(K)||'null')}catch(e){}
    if(c&&c.uid===uid&&Array.isArray(c.o)&&c.o.length){
      allOrders=c.o;allMotos=Array.isArray(c.m)?c.m:[];
      adminRestaurantsById=new Map((c.n||[]).map(r=>[String(r.id),r]));window.adminRestaurantsById=adminRestaurantsById;
      try{renderOrders();return}catch(e){console.warn('Pedidos guardados:',e)}
    }
    const l=document.getElementById('orderList');
    if(l&&!l.children.length)l.innerHTML='<div class="pdSk" aria-hidden="true"><i></i><i></i><i></i></div><div class="pdSk" aria-hidden="true"><i></i><i></i><i></i></div><div class="pdSk" aria-hidden="true"><i></i><i></i><i></i></div><p class="pdSkTxt" role="status">Cargando pedidos…</p>';
  }
};
try{db.auth.onAuthStateChange(e=>{if(e==='SIGNED_OUT'){try{localStorage.removeItem(K)}catch(x){}}})}catch(e){}
})();
}catch(e){console.error("[pidemas-pedidos-al-instante]",e)}

/* ===== pd-fix-cobro-vuelto-js ===== */
try{
(function(){
if(window.__pdFixCobro)return;window.__pdFixCobro=true;
const DB=()=>{try{return db}catch(e){return window.db}};
const ME=()=>{try{return typeof moto!=='undefined'?moto:null}catch(e){return null}};
const IS_MOTO=false;
function totalDe(desc){
const d=String(desc||'');if(!/vuelto/i.test(d))return null;
const m=d.match(/total(?:\s+pedido)?\s*S\/\s*([0-9]+(?:[.,][0-9]{1,2})?)/i);if(!m)return null;
const t=Number(m[1].replace(',','.'));return Number.isFinite(t)&&t>0?t:null;
}
window.pdCobroCorrecto=m=>{if(!m||m.tipo!=='ingreso'||!/^\s*cobro de pedido/i.test(String(m.descripcion||'')))return null;const t=totalDe(m.descripcion);return t!=null&&Number(m.monto)>t+0.004?t:null};
(function(){
const c=DB();if(!c||c.__pdCajaFix)return;c.__pdCajaFix=true;const orig=c.from.bind(c);
const info=window.__pdPedInfo=window.__pdPedInfo||{};
const skip=m=>{const i=m.pedido_id&&info[m.pedido_id];return !!(i&&i.compra&&!i.pagaCon)};
const fixRes=async r=>{try{if(r&&Array.isArray(r.data)){
const cand=r.data.filter(m=>window.pdCobroCorrecto(m)!=null);
const need=[...new Set(cand.map(m=>m.pedido_id).filter(id=>id&&!info[id]))];
if(need.length){try{const {data:ps}=await new Promise((ok,ko)=>orig('pedidos').select('id,tipo_servicio,observaciones').in('id',need.slice(0,200)).then(ok,ko));(ps||[]).forEach(p=>{info[p.id]={compra:String(p.tipo_servicio||'').toLowerCase().includes('compra'),pagaCon:String(p.observaciones||'').includes('__PIDEMAS_PAGO_EFECTIVO__')}})}catch(e){}}
cand.forEach(m=>{if(skip(m))return;const t=window.pdCobroCorrecto(m);if(t!=null){m.monto_original=m.monto;m.monto=t}})}}catch(e){}return r};
const wrap=q=>new Proxy(q,{get(tg,p){
if(p==='then')return (res,rej)=>new Promise((ok,ko)=>tg.then(ok,ko)).then(fixRes).then(res,rej);
const v=tg[p];
if(typeof v==='function')return (...a)=>{const out=v.apply(tg,a);return out&&(typeof out==='object'||typeof out==='function')&&typeof out.then==='function'?wrap(out):out};
return v}});
c.from=function(t){const q=orig(t);return t==='movimientos_caja'&&q&&(typeof q==='object'||typeof q==='function')?wrap(q):q};
})();
async function run(){
const c=DB();if(!c)return false;
let q=c.from('movimientos_caja').select('id,motorizado_id,pedido_id,tipo,monto,descripcion,creado_en').eq('tipo','ingreso').not('pedido_id','is',null).ilike('descripcion','%vuelto%').limit(2000);
if(IS_MOTO){const me=ME();if(!me||!me.id)return false;q=q.eq('motorizado_id',me.id)}
const {data,error}=await q;if(error){console.warn('Revisión de cobros con vuelto:',error.message);return true}
let bq=c.from('movimientos_caja').select('motorizado_id,creado_en,descripcion').or('descripcion.ilike.%LIQUIDACI%,descripcion.ilike.%REINICIO DE CAJA%').limit(5000);
if(IS_MOTO)bq=bq.eq('motorizado_id',ME().id);
const {data:bs,error:be}=await bq;if(be){console.warn('Revisión de cobros con vuelto:',be.message);return true}
const lastClose={};(bs||[]).forEach(b=>{const k=String(b.motorizado_id),tm=new Date(b.creado_en).getTime();if(!(lastClose[k]>=tm))lastClose[k]=tm});
let fixed=0;
for(const m of (data||[])){
const lc=lastClose[String(m.motorizado_id)];if(lc&&!(new Date(m.creado_en).getTime()>lc))continue;
const t=(m.monto_original!=null&&Number(m.monto_original)>Number(m.monto)+0.004)?Number(m.monto):null;if(t==null)continue;
const desc=String(m.descripcion||'');
const {data:u,error:ue}=await c.from('movimientos_caja').update({monto:t}).eq('id',m.id).eq('tipo','ingreso').select('id');
if(!ue&&u&&u.length)fixed++;else console.warn('No se pudo corregir el cobro',m.id,ue&&ue.message);
}
if(fixed){
try{if(typeof window.loadCash==='function')await window.loadCash()}catch(e){}
try{document.getElementById('refreshCashAdmin')?.click()}catch(e){}
}
return true;
}
let n=0;const t=setInterval(async()=>{n++;let done=false;try{done=await run()}catch(e){done=true}if(done||n>600)clearInterval(t)},3000);
})();
}catch(e){console.error("[pd-fix-cobro-vuelto-js]",e)}

/* ===== admin-recojo-open-location ===== */
try{
document.addEventListener("click",function(e){
const b=e.target.closest(".adminRecojoLocationBtn"); if(!b)return;
const el=document.getElementById(b.dataset.target); const raw=(el?.value||"").trim();
if(!raw){pdAviso("Primero ingresa o selecciona la ubicación.");return;}
const url=/^https?:\/\//i.test(raw)?raw:"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(raw);
window.open(url,"_blank","noopener");
});
}catch(e){console.error("[admin-recojo-open-location]",e)}

/* ===== admin-order-tracking-functionality ===== */
try{
(function(){
const steps=[['Pedido recibido','Tu pedido fue registrado'],['Motorizado asignado','El administrador asignó tu pedido'],['Pedido aceptado','El motorizado aceptó el pedido'],['En camino','El motorizado inició el recorrido'],['En entrega','Tu pedido va hacia la dirección indicada'],['Entregado','Pedido entregado correctamente']];
let timer=null,channel=null,activeId=null,activeBox=null;
function idx(status){let s=String(status||'pendiente').toLowerCase();if(['cancelado','cancelada','rechazado','anulado'].includes(s))return -1;if(['entregado','completado','finalizado'].includes(s))return 5;if(['en_entrega','camino_entrega','entrega','confirmando_pago'].includes(s))return 4;if(['en_camino','camino_recojo','en camino'].includes(s))return 3;if(['aceptado','pedido_aceptado'].includes(s))return 2;if(['asignado','asignada'].includes(s))return 1;return 0;}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function draw(o,box,id){if(!box||!box.isConnected)return;const i=idx(o.estado),code=String(o.id||id||'').slice(0,8).toUpperCase();
const tf=v=>{if(!v)return '';const d=new Date(v);return isNaN(d)?'':d.toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'});};
const times=[o.creado_en,o.asignado_en,o.aceptado_en,o.en_camino_en,o.en_entrega_en,o.entregado_en];
const label=i<0?'Pedido cancelado':steps[i][0];
const bars=steps.map((_,n)=>`<span class="${i>=0&&n<=i?'on':''}"></span>`).join('');
const list=i<0?'<div class="pdTrkCancel">El pedido fue cancelado.</div>':steps.map((st,n)=>{const done=n<i,cur=n===i,t=tf(times[n]);return `<div class="pdTrkStep${done?' is-done':''}${cur?' is-cur':''}${n===steps.length-1?' is-last':''}"><span class="pdTrkDot"></span><div class="pdTrkBody"><div class="pdTrkName"><span>${st[0]}</span>${cur?'<span class="pdTrkNow">Ahora</span>':(t&&n<=i?`<span class="pdTrkTime">${t}</span>`:'')}</div>${cur?`<div class="pdTrkDesc">${st[1]}${t?' · '+t:''}</div>`:''}</div></div>`;}).join('');
box.innerHTML=`<div class="pdTrkBand"><div class="pdTrkTop"><span class="pdTrkKicker">Seguimiento del pedido</span><button class="pdTrkClose" type="button" aria-label="Cerrar seguimiento" data-close-inline-tracking="${esc(id)}">×</button></div><div class="pdTrkCode">#${esc(code)}</div><div class="pdTrkState">${esc(label)}</div><div class="pdTrkBars">${bars}</div><div class="pdTrkLive"><span class="pdTrkLiveDot"></span>Actualización automática</div></div><div class="pdTrkList">${list}</div>`;}
async function refresh(id,box){if(!id||!box||!box.isConnected||!window.db)return;try{let res=await window.db.from('pedidos').select('*').eq('id',id).maybeSingle();if(!res.error&&res.data)draw(res.data,box,id);}catch(e){console.warn('No se pudo actualizar el seguimiento:',e)}}
function stop(){if(timer)clearInterval(timer);timer=null;if(channel&&window.db){try{window.db.removeChannel(channel)}catch(e){}}channel=null;activeId=null;activeBox=null;}
function close(box){const target=box||activeBox;if(!target)return;const card=target.closest('.adminOrderCard');const btn=card?.querySelector('.adminTrackingOpenBtn');target.remove();if(btn){btn.setAttribute('aria-expanded','false');btn.textContent='Seguimiento';}const tb=card?.querySelector('.pdRouteTrack');if(tb)tb.textContent='Seguimiento';if(target===activeBox)stop();}
async function open(btn){const id=btn.dataset.trackingOrder;const card=btn.closest('.adminOrderCard');if(!id||!card)return;const existing=card.querySelector('.adminOrderInlineTracking');if(existing){close(existing);return;}if(activeBox&&activeBox.isConnected)close(activeBox);const box=document.createElement('div');box.className='adminOrderInlineTracking';box.setAttribute('data-inline-tracking-order',String(id));const band=card.querySelector('.pdRouteBand');const banner=btn.closest('.adminServiceTypeBanner');if(band)band.insertAdjacentElement('afterend',box);else if(banner)banner.insertAdjacentElement('afterend',box);else btn.insertAdjacentElement('afterend',box);btn.setAttribute('aria-expanded','true');btn.textContent='Cerrar seguimiento';box.innerHTML='<div class="pdTrkBand"><div class="pdTrkTop"><span class="pdTrkKicker">Seguimiento del pedido</span></div><div class="pdTrkState">Cargando…</div></div>';activeId=String(id);activeBox=box;await refresh(id,box);stop();activeId=String(id);activeBox=box;timer=setInterval(()=>refresh(id,box),8000);if(window.db){try{channel=window.db.channel('admin-tracking-inline-'+id).on('postgres_changes',{event:'UPDATE',schema:'public',table:'pedidos',filter:'id=eq.'+id},()=>refresh(id,box)).subscribe();}catch(e){console.warn('Seguimiento en tiempo real no disponible:',e)}}}
document.addEventListener('click',e=>{const closeBtn=e.target.closest('[data-close-inline-tracking]');if(closeBtn){e.preventDefault();e.stopPropagation();const box=closeBtn.closest('.adminOrderInlineTracking');close(box);return;}const btn=e.target.closest('.adminTrackingOpenBtn');if(btn){e.preventDefault();e.stopPropagation();open(btn);}});
})();
}catch(e){console.error("[admin-order-tracking-functionality]",e)}

/* ===== pd-wa-js ===== */
try{
(function(){
if(window.__pdWaFix)return; window.__pdWaFix=true;
var mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent||'');
function toScheme(u){
try{
var x=new URL(String(u),location.href), h=x.hostname.toLowerCase(), phone='';
if(h==='wa.me'||h==='www.wa.me') phone=x.pathname.replace(/\D/g,'');
else if(/(^|\.)whatsapp\.com$/.test(h)&&/send/.test(x.pathname)) phone=(x.searchParams.get('phone')||'').replace(/\D/g,'');
else return null;
var p=[]; if(phone)p.push('phone='+phone);
var t=x.searchParams.get('text'); if(t)p.push('text='+encodeURIComponent(t));
return 'whatsapp://send?'+p.join('&');
}catch(e){return null}
}
function closeSheet(){var s=document.getElementById('pdWaSheet');if(s)s.remove();}
function sheet(scheme,web){
closeSheet();
var d=document.createElement('div');d.id='pdWaSheet';
d.innerHTML='<div class="pdWaBox" role="dialog" aria-label="Enviar por WhatsApp"><span class="pdWaGrip"></span>'+
'<p class="pdWaT">Enviar por WhatsApp</p><p class="pdWaP">El mensaje ya está listo. Toca el botón para abrir WhatsApp y luego pulsa Enviar.</p>'+
'<a class="pdWaGo" href="'+scheme.replace(/"/g,'&quot;')+'">Abrir WhatsApp</a>'+
'<a class="pdWaWeb" href="'+String(web).replace(/"/g,'&quot;')+'" target="_blank" rel="noopener">¿No abre? Usar WhatsApp en el navegador</a>'+
'<button type="button" class="pdWaX">Cerrar</button></div>';
d.addEventListener('click',function(e){
if(e.target===d||e.target.closest('.pdWaX'))closeSheet();
else if(e.target.closest('.pdWaGo'))setTimeout(closeSheet,400);
});
document.body.appendChild(d);
}
function go(url){
var s=toScheme(url); if(!s)return false;
var ua=navigator.userActivation;
if(ua&&ua.isActive){ try{location.href=s;}catch(e){} }
sheet(s,url);
return true;
}
window.pdOpenWhatsApp=function(url){ if(mobile&&go(url))return; window.open(url,'_blank','noopener'); };
document.addEventListener('visibilitychange',function(){ if(document.hidden)closeSheet(); });
if(!mobile)return;
var nativeOpen=window.open;
window.open=function(u,t,f){
if(!u||u==='about:blank'){
var fake={closed:false,close:function(){fake.closed=true},focus:function(){},blur:function(){},document:{write:function(){},close:function(){}},location:{}};
var setHref=function(v){ if(fake.closed)return; fake.closed=true; if(!go(v))nativeOpen.call(window,v,'_blank'); };
Object.defineProperty(fake.location,'href',{get:function(){return 'about:blank'},set:setHref});
fake.location.assign=setHref; fake.location.replace=setHref;
return fake;
}
if(typeof u==='string'&&toScheme(u)&&go(u))return null;
return nativeOpen.apply(window,arguments);
};
document.addEventListener('click',function(e){
var a=e.target&&e.target.closest&&e.target.closest('a[href]');
if(!a||a.closest('#pdWaSheet'))return;
if(!toScheme(a.href))return;
e.preventDefault();
go(a.href);
},true);
})();
}catch(e){console.error("[pd-wa-js]",e)}

/* ===== pd-horario-global-js ===== */
try{
(function(){
if(window.__pdHorarioGlobal)return; window.__pdHorarioGlobal=true;
var H=window.PD_HORARIO={abre:9*60,ultimoPedido:21*60+30,cierra:22*60};
function limaMin(){
try{var p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());
return (+p.find(function(x){return x.type==='hour'}).value%24)*60+(+p.find(function(x){return x.type==='minute'}).value);}
catch(e){var d=new Date();return d.getHours()*60+d.getMinutes();}
}
window.pdServicioAbierto=function(){var m=limaMin();return m>=H.abre&&m<H.ultimoPedido;};
})();
}catch(e){console.error("[pd-horario-global-js]",e)}

/* ===== pdflow-adm-js ===== */
try{
(function(){
if(window.__pdFlowAdm)return; window.__pdFlowAdm=true;
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const code=id=>'#'+String(id||'').slice(0,8).toUpperCase();
const ago=d=>{const m=Math.round((Date.now()-new Date(d).getTime())/60000);return !isFinite(m)?'':m<1?'ahora':m<60?'hace '+m+' min':'hace '+Math.floor(m/60)+' h'};
const list=()=>Array.isArray(window.allOrders)?window.allOrders:(typeof allOrders!=='undefined'?allOrders:[]);
const motoName=id=>{try{const m=(typeof allMotos!=='undefined'?allMotos:[]).find(x=>String(x.id)===String(id));return m?(m.nombre_completo||m.nombre||'Motorizado'):'el motorizado'}catch(e){return 'el motorizado'}};
function chips(o){
const s=String(o.estado||'').toLowerCase(),out=[];
if(o.incidencia&&o.incidencia_resuelta!==true)out.push(['bad','Problema: '+o.incidencia]);
if(o.negocio_id&&s==='pendiente')out.push(['warn','Esperando que el negocio confirme']);
const dl='S/ '+(Number(o.costo_delivery)||0).toFixed(2);
if(o.negocio_id&&o.pago_acordado&&s!=='cancelado'){
if(o.pago_acordado==='yape_negocio'&&s==='entregado')out.push(o.delivery_negocio_cobrado_en?['ok','Delivery '+dl+' cobrado al negocio']:['warn','Cobró todo con el Yape del negocio · cobrar delivery '+dl+' al negocio','cobrar']);
else if(o.pago_acordado==='pagado')out.push(o.delivery_negocio_cobrado_en?['ok','Delivery '+dl+' cobrado al negocio']:['warn','Pagó todo al negocio · cobrar delivery '+dl+' al negocio','cobrar']);
else if(s!=='entregado')out.push(['dark',o.pago_acordado==='solo_delivery'?'Pagó productos · moto cobra solo delivery '+dl:o.pago_acordado==='yape'?'Paga todo al recibir · Yape (QR)':o.pago_acordado==='yape_negocio'?'Paga todo al recibir · Yape del negocio':'Paga todo al recibir · efectivo']);
}
if(s==='asignado')out.push(['warn','Esperando que '+motoName(o.motorizado_id)+' acepte']);
if(['aceptado','pedido_aceptado','camino_recojo'].includes(s)){const tsv=String(o.tipo_servicio||'').toLowerCase();
out.push(tsv.includes('encomienda')?['','Va a recoger la encomienda']:tsv.includes('compra')?['','Va a hacer la compra']:tsv.includes('recojo')?['','Va a recoger el paquete']:(o.en_local_en?['dark',motoName(o.motorizado_id)+' está en el local']:['','Va camino al local']));}
if(String(o.tipo_servicio||'').toLowerCase().includes('recojo')&&s!=='cancelado'){const rm=String(o.pago_servicio_momento||'').toLowerCase();
if((rm==='recojo_efectivo'||rm==='recojo_yape')&&o.pago_confirmado!==true&&['asignado','aceptado','pedido_aceptado','camino_recojo','en_camino'].includes(s))out.push(['warn','Debe cobrar S/ '+(Number(o.total)||0).toFixed(2)+' al recoger (paga quien envía)']);
else if((rm==='recojo_efectivo'||rm==='recojo_yape')&&o.pago_confirmado===true&&Number(o.monto_recibido)>0)out.push(['ok','Cobró S/ '+(Number(o.total)||0).toFixed(2)+' al recoger']);
else if(!rm&&o.pago_confirmado!==true&&s!=='entregado'&&Number(o.total)>0)out.push(['','Cobra al entregar (paga quien recibe)']);}
if(String(o.tipo_servicio||'').toLowerCase().includes('encomienda')&&s!=='cancelado'){
const em=String(o.pago_servicio_momento||'').toLowerCase();
if((em==='recojo_efectivo'||em==='recojo_yape'||(!em&&o.pago_confirmado!==true))&&o.pago_confirmado!==true&&['aceptado','pedido_aceptado','camino_recojo','en_camino'].includes(s))out.push(['warn','Debe cobrar S/ '+(Number(o.total)||0).toFixed(2)+' al recoger']);
else if((em==='recojo_efectivo'||em==='recojo_yape')&&o.pago_confirmado===true&&Number(o.monto_recibido)>0)out.push(['ok','Cobró S/ '+(Number(o.total)||0).toFixed(2)+' al recoger ('+(String(o.metodo_pago||'').toLowerCase()==='yape'?'Yape':'efectivo')+')']);
if(o.pedido_en_agencia===true&&!['entregado'].includes(s))out.push(['dark','En agencia']);
}
if(o.negocio_id&&!['entregado','cancelado','pendiente'].includes(s)&&!['en_camino','en_entrega','camino_entrega','confirmando_pago'].includes(s)){
if(o.listo_para_recojo===true)out.push(['ok','Negocio: pedido listo']);
else if(o.negocio_aceptado_en&&Number(o.tiempo_preparacion_min)>0){const t=Math.round((new Date(o.negocio_aceptado_en).getTime()+Number(o.tiempo_preparacion_min)*60000-Date.now())/60000);out.push(['warn',t>0?'Negocio: listo en '+t+' min':'Negocio: tiempo de preparación vencido'])}
else if(s!=='pendiente'&&!o.pago_negocio_confirmado)out.push(['','Negocio aún no confirma'])
}
if(o.codigo_recojo&&o.negocio_id&&!['entregado','cancelado'].includes(s))out.push(['','Código de recojo '+o.codigo_recojo]);
if(String(o.tipo_servicio||'').toLowerCase().includes('compra')&&s!=='cancelado'){
const sub=Number(o.subtotal)||0,sv=Number(o.costo_delivery)||0;
if(sub>0)out.push(['ok','Compra S/ '+sub.toFixed(2)+' + servicio S/ '+sv.toFixed(2)+' = S/ '+(Number(o.total)||sub+sv).toFixed(2)]);
else if(s!=='entregado')out.push(['','Compra: el motorizado aún no registra cuánto gastó en la compra']);
}
if(o.motorizado_id&&['aceptado','pedido_aceptado','camino_recojo','en_camino','camino_entrega','en_entrega','confirmando_pago'].includes(s)){
try{const m=(typeof allMotos!=='undefined'?allMotos:[]).find(x=>String(x.id)===String(o.motorizado_id));
if(m&&'ultima_ubicacion' in m){const t=m.ultima_ubicacion?new Date(m.ultima_ubicacion).getTime():0;const min=t?Math.floor((Date.now()-t)/60000):null;
if(min===null)out.push(['bad','GPS de '+motoName(o.motorizado_id)+' sin datos']);
else if(min>=2)out.push(['bad','GPS detenido hace '+(min>=60?Math.floor(min/60)+' h '+(min%60)+' min':min+' min')+' · última '+new Date(t).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})]);}}catch(e){}
}
out.forEach(c=>{if(/^(Debe cobrar|Cobró |Cobra al entregar|Compra S\/|Compra: el motorizado|Pagó productos|Paga todo al recibir)/.test(c[1]||''))c[0]=(c[0]||'')+' pfDup'});
return out;
}
function decorate(){
const map=new Map(list().map(o=>[String(o.id),o]));
document.querySelectorAll('.adminOrderCard[data-order-id]').forEach(card=>{
const o=map.get(String(card.dataset.orderId));if(!o)return;
const est=String(o.estado||'').toLowerCase();
card.classList.toggle('pfNeg',!!o.negocio_id);
card.classList.toggle('pfNegConf',!!o.negocio_id&&est!=='pendiente');
card.classList.toggle('pfFin',['entregado','cancelado'].includes(est));
const html=chips(o).map(([c,t,act])=>`<span class="${c}">${E(t)}</span>${act==='cobrar'?`<button type="button" class="pfDelOk" data-delok="${E(o.id)}">Marcar delivery cobrado</button>`:''}`).join('');
let box=card.querySelector(':scope > .pfAdmChips');
if(!html){box&&box.remove();return}
if(!box){box=document.createElement('div');box.className='pfAdmChips';const ban=card.querySelector('.adminServiceTypeBanner');ban?ban.after(box):card.prepend(box)}
if(box.innerHTML!==html)box.innerHTML=html;
card.classList.toggle('pfNegPend',!!o.negocio_id&&String(o.estado||'').toLowerCase()==='pendiente');
});
}
let seen=null;
function beep(){try{const C=window.AudioContext||window.webkitAudioContext;const c=new C();[0,.25,.5].forEach(t=>{const o=c.createOscillator(),g=c.createGain();o.type='square';o.frequency.value=880;g.gain.setValueAtTime(.18,c.currentTime+t);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+t+.2);o.connect(g).connect(c.destination);o.start(c.currentTime+t);o.stop(c.currentTime+t+.22)});navigator.vibrate&&navigator.vibrate([300,120,300])}catch(e){}}
function incidencias(){
const abiertas=list().filter(o=>o.incidencia&&o.incidencia_resuelta!==true&&!['entregado','cancelado'].includes(String(o.estado||'').toLowerCase()));
const keys=new Set(abiertas.map(o=>o.id+'|'+o.incidencia_en));
if(seen&&[...keys].some(k=>!seen.has(k)))beep();
seen=keys;
let st=document.getElementById('pfIncStack');
if(!abiertas.length){st&&st.remove();return}
if(!st){st=document.createElement('div');st.id='pfIncStack';st.setAttribute('role','alert');document.body.appendChild(st)}
st.innerHTML=abiertas.slice(0,3).map(o=>`<div class="pfInc"><span><b>Problema en ${E(code(o.id))}</b> · ${E(motoName(o.motorizado_id))}</span><span>${E(o.incidencia)}</span><small>${E(ago(o.incidencia_en))}</small><div class="pfIncRow"><button type="button" class="pfIncSee" data-see="${E(o.id)}">Ver pedido</button><button type="button" class="pfIncOk" data-ok="${E(o.id)}">Marcar resuelto</button></div></div>`).join('');
}
document.addEventListener('click',async e=>{
const dk=e.target.closest&&e.target.closest('[data-delok]');
if(dk){const o=list().find(x=>String(x.id)===dk.dataset.delok);if(!o)return;if(!(await pdConfirmar('¿El negocio ya te pagó el delivery de S/ '+(Number(o.costo_delivery)||0).toFixed(2)+'?')))return;dk.disabled=true;const now=new Date().toISOString();const {error}=await db.from('pedidos').update({delivery_negocio_cobrado_en:now}).eq('id',o.id);if(error){pdAviso('No se pudo guardar: '+error.message);dk.disabled=false;return}o.delivery_negocio_cobrado_en=now;decorate();return}
const ok=e.target.closest&&e.target.closest('#pfIncStack [data-ok]');
if(ok){ok.disabled=true;const {error}=await db.from('pedidos').update({incidencia_resuelta:true}).eq('id',ok.dataset.ok);if(error){pdAviso('No se pudo marcar: '+error.message);ok.disabled=false;return}const o=list().find(x=>String(x.id)===ok.dataset.ok);if(o)o.incidencia_resuelta=true;incidencias();decorate();return}
const see=e.target.closest&&e.target.closest('#pfIncStack [data-see]');
if(see){if(window.pdAbrirPedidoAdmin){window.pdAbrirPedidoAdmin(see.dataset.see)}else{try{window.openAdminTab&&window.openAdminTab('pedidos')}catch(_){}try{window.pdDtAbrir&&pdDtAbrir()}catch(_){}setTimeout(()=>{const c=document.querySelector(`.adminOrderCard[data-order-id="${CSS.escape(see.dataset.see)}"]`);if(c){c.classList.add('is-expanded');c.scrollIntoView({behavior:'smooth',block:'start'})}},500)}}
});
function refresh(){try{decorate();incidencias()}catch(e){console.warn('Seguimiento coordinado:',e)}}
if(typeof window.loadOrders==='function'){const lo=window.loadOrders;window.loadOrders=async function(){const r=await lo.apply(this,arguments);refresh();return r}}
let t=null;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(decorate,120)}).observe(document.body,{childList:true,subtree:true});
setInterval(refresh,30000);
})();
}catch(e){console.error("[pdflow-adm-js]",e)}

/* ===== pdenc-adm-js ===== */
try{
(function(){
if(window.__pdEncAdm)return; window.__pdEncAdm=true;
const YAPE_NUM='986233533',YAPE_TIT='Grupo Pidemás EIRL';
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'S/ '+(Number(n)||0).toFixed(2);
const list=()=>Array.isArray(window.allOrders)?window.allOrders:[];
const isEnc=o=>String(o?.tipo_servicio||'').toLowerCase().includes('encomienda');
const arr=v=>{if(Array.isArray(v))return v;try{const p=JSON.parse(v||'[]');return Array.isArray(p)?p:[]}catch(e){return []}};
function extras(obs){
const raw=String(obs||''),i=raw.indexOf('PAQUETES ADICIONALES:');if(i<0)return [];
const tail=raw.slice(i+21).split(/\s*\|\s*PAGO_ENCOMIENDA_/i)[0];
return tail.split(/\s*\|\|\s*/).map(part=>{const n=part.match(/Paquete\s+(\d+)/i),a=part.match(/Agencia\s+([^;]+);/i),d=part.match(/destino\s+([^;]+);/i),t=part.match(/modalidad\s+([^|;]+?)(?=\s*(?:\||$))/i);return {numero:Number(n?.[1])||0,agencia:(a?.[1]||'').trim(),destino:(d?.[1]||'').trim(),tipoPago:(t?.[1]||'').trim()}}).filter(p=>p.numero);
}
function paquetes(o){
const g=arr(o.paquetes_envio);
const base=[{numero:1,agencia:o.agencia_destino||'',destino:o.destino_final||o.direccion_entrega||'',tipoPago:o.tipo_pago_encomienda}].concat(extras(o.observaciones));
return base.filter((p,i,a)=>a.findIndex(x=>x.numero===p.numero)===i).map(p=>{
let s=g.find(x=>Number(x.numero)===p.numero);
if(!s&&p.numero===1&&o.guia_url&&o.guia_url!=='whatsapp')s={guia_url:o.guia_url,clave:String(o.clave_guia||'')==='SIN_CLAVE'?'':o.clave_guia,sin_clave:String(o.clave_guia||'')==='SIN_CLAVE'};
return {...p,guia_url:s?.guia_url||'',clave:s?.clave||'',sin_clave:!!s?.sin_clave,wa:!!s?.enviado_whatsapp,enviado_en:s?.enviado_en||''};
});
}
const ok=p=>p.wa||(p.guia_url&&(p.sin_clave||String(p.clave||'').trim()));
const CLV=window.__peAdmClaves=window.__peAdmClaves||{};
function momento(o){const m=String(o.pago_servicio_momento||'').toLowerCase();if(m)return m;if(o.pago_confirmado===true)return 'pagado';return String(o.metodo_pago||'').toLowerCase()==='yape'?'recojo_yape':'recojo_efectivo'}
const MLBL={recojo_efectivo:'Efectivo al recoger encomienda',recojo_yape:'Yape al recoger encomienda',pagado:'Pagado',al_final:'Paga después de recibir la guía'};


function cuenta(o){
const sv=Number(o.total)||0,m=momento(o);
const svPagado=o.pago_confirmado===true||m==='pagado';
const ag=Number(o.monto_pagado_agencia)||0;
const agDevuelto=String(o.observaciones||'').includes('AGENCIA_REEMBOLSADA');
const svPend=svPagado?0:sv,agPend=ag>0&&!agDevuelto?ag:0;
return {sv,svPagado,ag,agDevuelto,svPend,agPend,total:Math.round((svPend+agPend)*100)/100,m};
}
function mensaje(o){
const pk=paquetes(o),nombre=o.nombre_remitente||o.nombre_cliente||'';
const lines=['*PIDEMÁS DELIVERY*',`Hola${nombre?' '+nombre:''}, tu encomienda #${String(o.id).slice(0,8).toUpperCase()} ya está en la agencia.`,''];
pk.forEach(p=>{const ck=String(CLV[o.id+':'+p.numero]||'').trim();lines.push(`*Paquete ${p.numero}* → ${p.destino||'Destino'} · ${p.agencia||'Agencia'}`);lines.push(`Clave de recojo: ${p.sin_clave?'la agencia no dio clave':(p.wa?(ck||'te la enviamos en la foto de la guía'):p.clave)}`);if(String(p.tipoPago).includes('destino'))lines.push('El envío se paga en destino.');if(p.guia_url)lines.push(`Foto de la guía: ${p.guia_url}`);lines.push('')});
if(pk.some(p=>p.wa)){lines.push('Te enviamos la foto de la guía en este chat.');lines.push('')}
{const c=cuenta(o);
lines.push('*Detalle del cobro*');
lines.push(`• Servicio Pidemás (recojo y envío): ${money(c.sv)} ${c.svPagado?'✅ pagado':'· pendiente'}`);
if(c.ag>0)lines.push(`• Envío pagado en la agencia${pk[0]&&pk[0].agencia?' ('+pk[0].agencia+')':''}: ${money(c.ag)} ${c.agDevuelto?'✅ pagado':'· lo pagamos por ti'}`);
else if(pk.some(p=>String(p.tipoPago).includes('destino')))lines.push('• Envío: se paga en destino al recoger el paquete');
if(c.total>0){lines.push('');lines.push(`*Total a pagar: ${money(c.total)}*`);lines.push(`Yape: ${YAPE_NUM} · ${YAPE_TIT}`);lines.push('Envíanos la captura del pago por este chat.')}
else lines.push('','No tienes nada pendiente con Pidemás ✅');
lines.push('')}
lines.push('Gracias por confiar en Pidemás.');
return lines.join('\n');
}
function telefono(o){let d=String(o.telefono_remitente||o.telefono_cliente||'').replace(/\D/g,'');if(d.length===9)d='51'+d;return d}
async function copiar(t){try{await navigator.clipboard.writeText(t);return true}catch(e){try{const ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();return true}catch(_){return false}}}
function html(o){
const pk=paquetes(o),listos=pk.every(ok),m=momento(o),cu=cuenta(o),pend=cu.total>0&&listos;
const pay=`<div class="peAdmPay"><span>Servicio: ${E(MLBL[m]||m)} · ${E(money(cu.sv))}</span><span class="tag ${cu.svPagado?'ok':'warn'}">${cu.svPagado?'Pagado':'Pendiente'}</span></div>${cu.ag>0?`<div class="peAdmPay"><span>Envío pagado en agencia · ${E(money(cu.ag))}</span><span class="tag ${cu.agDevuelto?'ok':'warn'}">${cu.agDevuelto?'Cliente lo pagó':'Cobrar al cliente'}</span></div>`:''}${cu.total>0?`<div class="peAdmPay"><span>Total que debe el cliente</span><span class="tag warn">${E(money(cu.total))}</span></div>`:''}`;
const rows=pk.map(p=>p.wa?`<div class="peAdmPkg"><a class="peAdmImg peWaImg" aria-disabled="true" aria-label="Enviada por WhatsApp" style="font-size:22px">✓</a><span><b>Paquete ${p.numero} · ${E([p.agencia,p.destino].filter(Boolean).join(' → '))}</b>Guía y clave enviadas a tu WhatsApp${p.enviado_en?' · '+E(new Date(p.enviado_en).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})):''}${p.sin_clave?' · sin clave':`<input class="peAdmClave" data-pe-clv="${E(o.id)}:${p.numero}" placeholder="Escribe la clave para el mensaje" autocomplete="off">`}</span></div>`:`<div class="peAdmPkg">${p.guia_url?`<a class="peAdmImg" href="${E(p.guia_url)}" target="_blank" rel="noopener" aria-label="Ver guía del paquete ${p.numero}"><img src="${E(p.guia_url)}" alt=""></a>`:'<a class="peAdmImg" aria-disabled="true">Pendiente</a>'}<span><b>Paquete ${p.numero} · ${E([p.agencia,p.destino].filter(Boolean).join(' → '))}</b>${ok(p)?(p.sin_clave?'Sin clave':'Clave: '+E(p.clave)):'Esperando que el motorizado te envíe la guía y la clave por WhatsApp'}</span></div>`).join('');
const sent=o.guia_enviada_cliente_en?`<div class="peSent">Enviado al cliente ${E(new Date(o.guia_enviada_cliente_en).toLocaleString('es-PE',{dateStyle:'short',timeStyle:'short'}))}</div>`:'';
return `<span class="peAdmK">Guías y claves de los paquetes</span>${rows}<div class="peAdmBtns"><button type="button" class="peSend" data-pe-send="${E(o.id)}" ${listos?'':'disabled'}>${o.guia_enviada_cliente_en?'Reenviar':'Enviar'} guía y clave al cliente</button><button type="button" class="peCopy" data-pe-copy="${E(o.id)}" ${listos?'':'disabled'}>Copiar</button></div>${cu.total>0?`<button type="button" class="pePaid" data-pe-paid="${E(o.id)}">Confirmar pago del cliente recibido · ${E(money(cu.total))}</button>`:''}${sent}`;
}
function decorate(){
const map=new Map(list().map(o=>[String(o.id),o]));
document.querySelectorAll('.adminOrderCard[data-order-id]').forEach(card=>{
const o=map.get(String(card.dataset.orderId));
let box=card.querySelector('.peAdm');
if(!o||!isEnc(o)||['cancelado'].includes(String(o.estado||'').toLowerCase())||!o.motorizado_id||!(o.pedido_en_agencia===true||String(o.estado||'').toLowerCase()==='entregado'||arr(o.paquetes_envio).length||o.guia_url)){box&&box.remove();return}
const h=html(o);
if(!box||!box.isConnected||(card.querySelector('.pdRoutePay')&&box.previousElementSibling!==card.querySelector('.pdRoutePay'))){box&&box.remove();box=document.createElement('div');box.className='peAdm';const pay=card.querySelector('.pdRoute .pdRoutePay');if(pay)pay.after(box);else{const ch=card.querySelector(':scope > .pfAdmChips')||card.querySelector('.adminServiceTypeBanner');ch?ch.after(box):card.prepend(box)}}
if(box.dataset.h!==h){box.innerHTML=h;box.dataset.h=h;box.querySelectorAll('.peAdmClave').forEach(i=>{i.value=CLV[i.dataset.peClv]||''})}
card.querySelectorAll('.pdOldGuia').forEach(x=>x.style.setProperty('display','none','important'));
});
}
const find=id=>list().find(x=>String(x.id)===String(id));
document.addEventListener('input',e=>{const i=e.target.closest&&e.target.closest('.peAdmClave');if(i)CLV[i.dataset.peClv]=i.value});
document.addEventListener('click',async e=>{
const s=e.target.closest&&e.target.closest('[data-pe-send]');
if(s){
const o=find(s.dataset.peSend);if(!o)return;
const t=mensaje(o),ph=telefono(o);
await copiar(t);
const url=ph?`https://wa.me/${ph}?text=${encodeURIComponent(t)}`:`https://wa.me/?text=${encodeURIComponent(t)}`;
if(typeof window.pdOpenWhatsApp==='function')window.pdOpenWhatsApp(url);else window.open(url,'_blank','noopener');
try{const now=new Date().toISOString();const {error}=await db.from('pedidos').update({guia_enviada_cliente_en:now}).eq('id',o.id);if(!error){o.guia_enviada_cliente_en=now;decorate()}}catch(_){}
return;
}
const c=e.target.closest&&e.target.closest('[data-pe-copy]');
if(c){const o=find(c.dataset.peCopy);if(!o)return;const okc=await copiar(mensaje(o));c.textContent=okc?'Copiado':'No se pudo';setTimeout(()=>{c.textContent='Copiar'},1600);return}
const p=e.target.closest&&e.target.closest('[data-pe-paid]');
if(p){
const o=find(p.dataset.pePaid);if(!o)return;
const cu=cuenta(o);
if(!(await pdConfirmar(`¿Confirmas que el cliente ya pagó ${money(cu.total)}?${cu.svPend?'\n· Servicio '+money(cu.svPend):''}${cu.agPend?'\n· Envío pagado en agencia '+money(cu.agPend):''}`)))return;
p.disabled=true;
const upd={};if(cu.svPend)upd.pago_confirmado=true;if(cu.agPend)upd.observaciones=(o.observaciones?o.observaciones+' | ':'')+'AGENCIA_REEMBOLSADA';
const {error}=await db.from('pedidos').update(upd).eq('id',o.id);
if(error){pdAviso('No se pudo confirmar el pago: '+error.message);p.disabled=false;return}
Object.assign(o,upd);decorate();
}
});
if(typeof window.loadOrders==='function'){const lo=window.loadOrders;window.loadOrders=async function(){const r=await lo.apply(this,arguments);try{decorate()}catch(e){}return r}}
let t=null;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(()=>{try{decorate()}catch(e){}},150)}).observe(document.body,{childList:true,subtree:true});
})();
}catch(e){console.error("[pdenc-adm-js]",e)}

/* ===== pdtrk-adm-js ===== */
try{
(function(){
if(window.__pdTrkAdm)return; window.__pdTrkAdm=true;
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'S/ '+(Number(n)||0).toFixed(2);
const list=()=>Array.isArray(window.allOrders)?window.allOrders:[];
const tf=v=>{if(!v)return '';const d=new Date(v);return isNaN(d)?'':d.toLocaleTimeString('es-PE',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'America/Lima'})};
const moto=id=>{try{return (typeof allMotos!=='undefined'?allMotos:[]).find(m=>String(m.id)===String(id))||null}catch(e){return null}};
const negocio=id=>{try{const m=window.adminRestaurantsById;return m&&m.get?m.get(String(id)):null}catch(e){return null}};
const ORDER=['pendiente','confirmado','asignado','aceptado','en_camino','en_entrega','entregado'];
const rank=s=>{s=String(s||'').toLowerCase();if(s==='pedido_aceptado'||s==='camino_recojo')s='aceptado';if(s==='camino_entrega')s='en_camino';if(s==='confirmando_pago')s='en_entrega';return ORDER.indexOf(s)};
const PAGO={efectivo:'Paga todo al recibir · efectivo',yape:'Paga todo al recibir · Yape (QR)',yape_negocio:'Paga todo al recibir · Yape del negocio',solo_delivery:'Pagó productos · moto cobra solo delivery',pagado:'Pagó todo al negocio'};
let openId=null,timer=null;
function steps(o){
const r=rank(o.estado),enc=String(o.tipo_servicio||'').toLowerCase().includes('encomienda');
const L=[];
L.push(['Pedido recibido','',o.creado_en,true]);
if(o.negocio_id){
L.push(['El negocio confirmó',o.tiempo_preparacion_min?'Listo en '+o.tiempo_preparacion_min+' min':'',o.negocio_aceptado_en||o.pago_negocio_confirmado_en,r>=1]);
L.push(['Pedido listo en el negocio','',o.listo_para_recojo_en,o.listo_para_recojo===true]);
}else if(!enc){L.push(['Pedido aceptado por Pidemás','',null,r>=1])}
const m=moto(o.motorizado_id);
L.push(['Motorizado asignado',m?(m.nombre_completo||m.nombre||''):'',o.asignado_en,r>=2]);
L.push(['El motorizado aceptó','',o.aceptado_en,r>=3]);
const encM=String(o.pago_servicio_momento||'').toLowerCase();
if((enc||String(o.tipo_servicio||'').toLowerCase().includes('recojo'))&&(encM==='recojo_efectivo'||encM==='recojo_yape'))L.push(['Cobró al recoger',money(o.total)+(o.pago_confirmado===true?' · '+(String(o.metodo_pago||'').toLowerCase()==='yape'?'Yape':'efectivo'):''),null,o.pago_confirmado===true]);
if(String(o.tipo_servicio||'').toLowerCase().includes('compra'))L.push(['Compra registrada',Number(o.subtotal)>0?'Gastó '+money(o.subtotal):'',null,Number(o.subtotal)>0]);
if(enc){
L.push(['Recogió los paquetes','',o.en_camino_en,r>=4]);
L.push(['En la agencia','',null,o.pedido_en_agencia===true]);
L.push([o.guia_url==='whatsapp'?'Guía y clave enviadas al admin':'Guía y clave registradas','',null,!!o.guia_url&&!!o.clave_guia]);
L.push(['Enviado al cliente','',o.guia_enviada_cliente_en,!!o.guia_enviada_cliente_en]);
if(encM==='al_final')L.push(['Cliente pagó',money(o.total)+' por Yape',null,o.pago_confirmado===true]);
L.push(['Encomienda finalizada','',o.entregado_en,r>=6]);
}else{
if(o.negocio_id)L.push(['Motorizado en el local',o.codigo_recojo?'Código de recojo '+o.codigo_recojo:'',o.en_local_en,!!o.en_local_en||r>=4]);
L.push(['En camino al cliente','',o.en_camino_en,r>=4]);
L.push(['Llegó donde el cliente','',o.en_entrega_en,r>=5]);
L.push(['Entregado','',o.entregado_en,r>=6]);
}
let last=-1;L.forEach((x,i)=>{if(x[3])last=i});
const cur=last;
return L.map((x,i)=>({name:x[0],sub:x[1],t:x[2],done:i<=last,cur:i===cur&&String(o.estado).toLowerCase()!=='cancelado'}));
}
function html(o){
const m=moto(o.motorizado_id),n=negocio(o.negocio_id),cancel=String(o.estado||'').toLowerCase()==='cancelado';
const tel=m&&m.telefono?String(m.telefono).replace(/\D/g,''):'';
const st=steps(o),cur=st.find(x=>x.cur);
const info=[
['Cliente',E(o.nombre_cliente||'—')+(o.telefono_cliente?`<br><a href="tel:${E(o.telefono_cliente)}">${E(o.telefono_cliente)}</a>`:'')],
['Motorizado',m?E(m.nombre_completo||m.nombre||'Motorizado')+(tel?`<br><a href="tel:+${tel.length===9?'51'+tel:tel}">${E(m.telefono)}</a>`:''):'Sin asignar'],
n?['Negocio',E(n.nombre||n.nombre_negocio||'Negocio')]:['Servicio',E(({encomienda:'Encomienda',compra:'Compra',recojo_entrega:'Recojo y entrega'})[String(o.tipo_servicio||'').toLowerCase()]||o.tipo_servicio||'Pedido')],
['Total',E(money(o.total))+(String(o.tipo_servicio||'').toLowerCase().includes('compra')&&Number(o.subtotal)>0?'<br><span>Compra '+E(money(o.subtotal))+' + servicio '+E(money(o.costo_delivery))+'</span>':(n&&o.costo_delivery!=null?'<br><span>Delivery '+E(money(o.costo_delivery))+'</span>':''))],
o.pago_acordado?['Pago',E(PAGO[o.pago_acordado]||o.pago_acordado)]:['Pago',E((({efectivo:'Efectivo',yape:'Yape'})[String(o.metodo_pago||'').toLowerCase()]||o.metodo_pago||'—')+(String(o.tipo_servicio||'').toLowerCase().includes('encomienda')?({recojo_efectivo:' · al recoger encomienda',recojo_yape:' · al recoger encomienda',al_final:' · paga después de recibir la guía',pagado:' · pagado'})[String(o.pago_servicio_momento||'').toLowerCase()]||'':'')+(o.pago_confirmado?' · pagado':' · pendiente'))],
['Entrega',E(o.direccion_entrega||o.destino_final||'—')]
];
return `<div class="ptkTop"><span class="ptkGrip"></span><div class="ptkRow"><span><span class="ptkKick">Seguimiento del pedido</span><div class="ptkCode">#${E(String(o.id).slice(0,8).toUpperCase())}</div></span><span style="display:flex;gap:8px;align-items:center"><span class="ptkPill">${E(cancel?'Cancelado':cur?cur.name:'Entregado')}</span><button type="button" class="ptkX" aria-label="Cerrar">×</button></span></div></div>
      <div class="ptkBody">
        ${o.incidencia&&o.incidencia_resuelta!==true?`<div class="ptkAlert">Problema reportado: ${E(o.incidencia)}</div>`:''}
        ${cancel?'<div class="ptkAlert">Este pedido fue cancelado.</div>':''}
        <div class="ptkSteps">${st.map(x=>`<div class="ptkStep ${x.done?'done':''} ${x.cur?'cur':''}"><span class="ptkDot"></span><span><div class="ptkName">${E(x.name)}</div>${x.sub?`<div class="ptkSub">${E(x.sub)}</div>`:''}</span><span>${x.cur?'<span class="ptkNow">Ahora</span>':`<span class="ptkTime">${E(x.done?tf(x.t):'')}</span>`}</span></div>`).join('')}</div>
        <div class="ptkInfo">${info.map(([k,v])=>`<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>
        <div class="ptkLive">Se actualiza automáticamente</div>
      </div>`;
}
function paint(){
const box=document.getElementById('ptkModal');if(!box||!openId)return;
const o=list().find(x=>String(x.id)===String(openId));if(!o){close();return}
const body=box.querySelector('.ptkBody'),sc=body?body.scrollTop:0;
box.querySelector('.ptkCard').innerHTML=html(o);
const nb=box.querySelector('.ptkBody');if(nb)nb.scrollTop=sc;
}
function open(id){
openId=String(id);
let box=document.getElementById('ptkModal');
if(!box){box=document.createElement('div');box.id='ptkModal';box.innerHTML='<div class="ptkCard" role="dialog" aria-modal="true" aria-label="Seguimiento del pedido"></div>';document.body.appendChild(box);
box.addEventListener('click',e=>{if(e.target===box||e.target.closest('.ptkX'))close()})}
paint();document.documentElement.style.overflow='hidden';
clearInterval(timer);timer=setInterval(async()=>{try{if(typeof window.loadOrders==='function')await window.loadOrders()}catch(e){}paint()},15000);
}
function close(){openId=null;clearInterval(timer);document.getElementById('ptkModal')?.remove();document.documentElement.style.overflow=''}
window.pdAdminTrack=open;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&openId)close()});
document.addEventListener('click',e=>{
const b=e.target.closest&&e.target.closest('.adminTrackingOpenBtn');
if(!b)return;
const id=b.dataset.trackingOrder||b.closest('[data-order-id]')?.dataset.orderId;if(!id)return;
e.preventDefault();e.stopImmediatePropagation();open(id);
},true);
if(typeof window.loadOrders==='function'){const lo=window.loadOrders;window.loadOrders=async function(){const r=await lo.apply(this,arguments);try{paint()}catch(e){}return r}}
})();
}catch(e){console.error("[pdtrk-adm-js]",e)}

/* ===== pd-admin-wa-js ===== */
try{
(function(){
if(window.__pdAdminWa)return;window.__pdAdminWa=true;
const DB=()=>{try{return db}catch(e){return window.db}};
const BUCKET='restaurantes',CFG='config/yape.json';
const st=()=>DB().storage.from(BUCKET);


async function leer(){try{const u=st().getPublicUrl(CFG).data.publicUrl+'?t='+Date.now();const r=await fetch(u,{cache:'no-store'});if(r.ok)return await r.json();if(r.status===400||r.status===404)return {};return null}catch(e){return null}}
async function cargar(){const i=document.getElementById('pdhWa');if(!i||i.dataset.loaded)return;i.dataset.loaded='1';const c=await leer();i.value=(c&&c.whatsapp_admin)||'986233533'}
async function guardar(){
const i=document.getElementById('pdhWa');if(!i)return true;
const v=i.value.replace(/\D/g,'');const msg=document.getElementById('pdhMsg');
if(v&&v.length!==9&&v.length!==11){if(msg)msg.textContent='El WhatsApp de Administración debe tener 9 dígitos.';return false}
try{const c=await leer();if(!c){if(msg)msg.textContent='Sin conexión: no se pudo guardar el WhatsApp. Inténtalo de nuevo.';return false}if((c.whatsapp_admin||'')===v)return true;c.whatsapp_admin=v;c.actualizado_en=new Date().toISOString();
const r=await st().upload(CFG,new Blob([JSON.stringify(c)],{type:'application/json'}),{upsert:true,contentType:'application/json',cacheControl:'0'});if(r.error)throw r.error;
if(msg)msg.textContent='WhatsApp de Administración guardado.';return true}catch(e){if(msg)msg.textContent='No se pudo guardar el WhatsApp: '+(e.message||e);return false}
}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#pdhSave'))guardar()},true);
new MutationObserver(()=>{const sh=document.getElementById('pdhSheet');if(sh&&!sh.hidden)cargar();else{const i=document.getElementById('pdhWa');if(i)delete i.dataset.loaded}}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['hidden']});

 
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const list=()=>Array.isArray(window.allOrders)?window.allOrders:[];
const arr=v=>{if(Array.isArray(v))return v;try{const p=JSON.parse(v||'[]');return Array.isArray(p)?p:[]}catch(e){return []}};
const KEY='pdGuiaVistos';
const vistos=()=>{try{return new Set(JSON.parse(localStorage.getItem(KEY)||'[]'))}catch(e){return new Set()}};
const marcar=k=>{try{const s=vistos();s.add(k);localStorage.setItem(KEY,JSON.stringify([...s].slice(-300)))}catch(e){}};
const motoName=id=>{try{const m=(typeof allMotos!=='undefined'?allMotos:[]).find(x=>String(x.id)===String(id));return m?(m.nombre_completo||'El motorizado'):'El motorizado'}catch(e){return 'El motorizado'}};
let prev=null;
function beep(){try{const a=new (window.AudioContext||window.webkitAudioContext)();const o=a.createOscillator(),g=a.createGain();o.frequency.value=880;o.connect(g);g.connect(a.destination);g.gain.value=.08;o.start();setTimeout(()=>{o.stop();a.close()},220)}catch(e){}}
function avisos(){
const v=vistos(),lim=Date.now()-12*3600e3,items=[];
list().forEach(o=>{if(!String(o.tipo_servicio||'').toLowerCase().includes('encomienda'))return;
arr(o.paquetes_envio).forEach(p=>{if(!p.enviado_whatsapp||!p.enviado_en)return;const t=new Date(p.enviado_en).getTime();if(!(t>lim))return;const k=o.id+'|'+p.numero+'|'+p.enviado_en;if(v.has(k))return;items.push({k,o,p,t})})});
items.sort((a,b)=>b.t-a.t);
const keys=new Set(items.map(x=>x.k));if(prev&&[...keys].some(k=>!prev.has(k)))beep();prev=keys;
let box=document.getElementById('pfGuiaStack');
if(!items.length){box&&box.remove();return}
if(!box){box=document.createElement('div');box.id='pfGuiaStack';box.setAttribute('role','status');document.body.appendChild(box)}
box.innerHTML=items.slice(0,1).map(x=>`<div class="pfInc pfGuia"><span><b>Guía enviada a tu WhatsApp · #${E(String(x.o.id).slice(0,8).toUpperCase())}${items.length>1?' · 1 de '+items.length:''}</b></span><span><b>${E(motoName(x.o.motorizado_id))}</b> te envió la guía${x.p.sin_clave?' (la agencia no dio clave)':' y la clave'} del paquete ${E(x.p.numero)}. Revisa tu WhatsApp y reenvíaselas al cliente.</span><small>${E(new Date(x.t).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'}))}</small><div class="pfIncRow"><button type="button" class="pfIncSee" data-gsee="${E(x.o.id)}" data-gk="${E(x.k)}">Ver pedido</button><button type="button" class="pfIncOk" data-gok="${E(x.k)}">Entendido</button></div></div>`).join('');
}
document.addEventListener('click',e=>{
const ok=e.target.closest&&e.target.closest('#pfGuiaStack [data-gok]');if(ok){marcar(ok.dataset.gok);avisos();return}
const see=e.target.closest&&e.target.closest('#pfGuiaStack [data-gsee]');
if(see){marcar(see.dataset.gk);avisos();if(window.pdAbrirPedidoAdmin){window.pdAbrirPedidoAdmin(see.dataset.gsee)}else{try{window.openAdminTab&&window.openAdminTab('pedidos')}catch(_){}try{window.pdDtAbrir&&pdDtAbrir()}catch(_){}setTimeout(()=>{const c=document.querySelector(`.adminOrderCard[data-order-id="${CSS.escape(see.dataset.gsee)}"]`);if(c){c.classList.add('is-expanded');c.scrollIntoView({behavior:'smooth',block:'start'})}},500)}}
});
if(typeof window.loadOrders==='function'){const lo=window.loadOrders;window.loadOrders=async function(){const r=await lo.apply(this,arguments);try{avisos()}catch(e){}return r}}
setInterval(()=>{try{avisos()}catch(e){}},20000);
})();
}catch(e){console.error("[pd-admin-wa-js]",e)}

/* ===== pd-adm-avisos-js ===== */
try{
(function(){
if(window.__pdaAvisos)return;window.__pdaAvisos=true;
const DB=()=>{try{return db}catch(e){return window.db}};
const $=id=>document.getElementById(id);
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'S/ '+(Number(n)||0).toFixed(2);
const ref=id=>'#'+String(id||'').slice(0,8).toUpperCase();
const T=v=>{const t=new Date(v||0).getTime();return isFinite(t)&&t>0?t:0};
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const orders=()=>{try{return Array.isArray(allOrders)?allOrders:(window.allOrders||[])}catch(e){return window.allOrders||[]}};
const motos=()=>{try{return Array.isArray(allMotos)?allMotos:[]}catch(e){return []}};
const motoName=id=>{const m=motos().find(x=>String(x.id)===String(id));return m?String(m.nombre_completo||'Motorizado').trim().split(/\s+/).slice(0,2).join(' '):'Motorizado'};
const arr=v=>{if(Array.isArray(v))return v;try{const p=JSON.parse(v||'[]');return Array.isArray(p)?p:[]}catch(e){return []}};
const tipoN=o=>{const t=String(o.tipo_servicio||'').toLowerCase();return t.includes('encomienda')?'encomienda':t.includes('compra')?'compra':t.includes('recojo')?'recojo':'tienda'};
const TIPO={encomienda:'Encomienda',compra:'Compra',recojo:'Recojo y entrega',tienda:'Pedido de tienda'};
const cli=o=>String(o.nombre_cliente||o.nombre_receptor||'').trim();
const hace=t=>{const s=Math.max(0,(Date.now()-t)/1000);if(s<60)return 'Ahora';if(s<3600)return 'Hace '+Math.floor(s/60)+' min';if(s<86400)return 'Hace '+Math.floor(s/3600)+' h';return new Date(t).toLocaleDateString('es-PE',{day:'numeric',month:'short',timeZone:'America/Lima'})};
const VENTANA=48*3600e3;
let caja=[],cajaOk=false,tab='todos',lastSeen=+LS.get('pdaAvisosVisto',String(Date.now()-6*3600e3))||0,prevTop=0;

 
function etapas(o){
  const k=tipoN(o);
  if(k==='tienda')return [['asignado_en','Asignado'],['aceptado_en','Aceptó'],['en_local_en','En el local'],['en_camino_en','Recogió · en camino'],['en_entrega_en','Entregando'],['entregado_en','Entregado']];
  if(k==='compra')return [['asignado_en','Asignado'],['aceptado_en','Aceptó'],['en_camino_en','Comprando / en camino'],['en_entrega_en','Entregando'],['entregado_en','Entregado']];
  if(k==='encomienda')return [['asignado_en','Asignado'],['aceptado_en','Aceptó'],['en_camino_en','Recogió el paquete'],['en_entrega_en','En agencia'],['entregado_en','Entregado']];
  return [['asignado_en','Asignado'],['aceptado_en','Aceptó'],['en_camino_en','Recogió · en camino'],['en_entrega_en','Entregando'],['entregado_en','Entregado']];
}
const ESTADO_IDX={asignado:0,aceptado:1,pedido_aceptado:1,camino_recojo:1,en_camino:2,camino_entrega:2,en_entrega:3,entregado:9};
function pasoActual(o){
  const E2=etapas(o);let i=-1;E2.forEach(([c],j)=>{if(T(o[c]))i=j});
  const st=String(o.estado||'').toLowerCase();
  if(st in ESTADO_IDX){let j=ESTADO_IDX[st];if(j===9)j=E2.length-1;else if(tipoN(o)==='tienda'&&j>=2)j=j+1;if(j>i)i=Math.min(j,E2.length-1)}
  if(tipoN(o)==='tienda'&&T(o.en_local_en)&&i<2&&st!=='entregado')i=Math.max(i,2);
  return {E2,i};
}
const VERBO={asignado_en:n=>'Asignado a '+n,aceptado_en:n=>n+' aceptó el pedido',en_local_en:n=>n+' llegó al local',en_camino_en:(n,o)=>tipoN(o)==='compra'?n+' está haciendo la compra / en camino':tipoN(o)==='encomienda'?n+' recogió el paquete':n+' recogió el pedido y va en camino',en_entrega_en:(n,o)=>tipoN(o)==='encomienda'?n+' llegó a la agencia':n+' está entregando al cliente',entregado_en:n=>n+' entregó el pedido'};

function eventos(){
  const lim=Date.now()-VENTANA,ev=[];
  orders().forEach(o=>{
    const n=o.motorizado_id?motoName(o.motorizado_id):'',tp=TIPO[tipoN(o)],c=cli(o);
    const sub=tp+' '+ref(o.id)+(c?' · '+c:'');
    const t0=T(o.creado_en||o.created_at);if(t0>lim)ev.push({k:'ped',t:t0,ic:'<i class="ti ti-receipt" aria-hidden="true"></i>',tit:({tienda:'Nuevo pedido de tienda',compra:'Nueva compra',recojo:'Nuevo recojo y entrega',encomienda:'Nueva encomienda'})[tipoN(o)]||('Nuevo pedido · '+tp),sub:(c?c+' · ':'')+money(o.total)+' · '+ref(o.id),id:o.id});
    if(o.motorizado_id)Object.keys(VERBO).forEach(col=>{const t=T(o[col]);if(t>lim)ev.push({k:'ped',t,ic:col==='entregado_en'?'<i class="ti ti-receipt" aria-hidden="true"></i>':'<i class="ti ti-map-pin" aria-hidden="true"></i>',tit:VERBO[col](n,o),sub,id:o.id})});
    if(String(o.estado||'').toLowerCase()==='cancelado'){const t=T(o.cancelado_en||o.actualizado_en);if(t>lim)ev.push({k:'ped',t,ic:'<i class="ti ti-ban" aria-hidden="true"></i>',tit:'Pedido cancelado',sub,id:o.id})}
    if(o.incidencia){const t=T(o.incidencia_en)||T(o.actualizado_en);if(t>lim||o.incidencia_resuelta===false)ev.push({k:'ocu',t:t||Date.now(),ic:'<i class="ti ti-gauge" aria-hidden="true"></i>',tit:'Reporte de '+(n||'Motorizado')+(o.incidencia_resuelta===true?' · resuelto':''),sub:String(o.incidencia)+' · '+sub,id:o.id,abierta:o.incidencia_resuelta!==true})}
    {const cp=String(o.observaciones||'').match(/CAMBIO DE PAGO: ([^|]+?) → ([^|(]+?) \(lo informó el motorizado a las ([^)]+)\)/g);if(cp){const u=cp[cp.length-1].match(/CAMBIO DE PAGO: ([^|]+?) → ([^|(]+?) \(lo informó el motorizado a las ([^)]+)\)/);const t=T(o.actualizado_en)||Date.now();if(t>lim)ev.push({k:'ped',t,ic:'<i class="ti ti-credit-card" aria-hidden="true"></i>',tit:'Cambio de pago: '+u[1]+' → '+u[2],sub:(n||'El motorizado')+' avisó a las '+u[3]+' · '+sub,id:o.id})}}
    if(tipoN(o)==='encomienda')arr(o.paquetes_envio).forEach(p=>{if(!p||!p.enviado_whatsapp)return;const t=T(p.enviado_en);if(t>lim)ev.push({k:'guia',t,ic:'<i class="ti ti-package" aria-hidden="true"></i>',tit:'Guía enviada a tu WhatsApp',sub:(n||'El motorizado')+' envió la guía'+(p.sin_clave?'':' y clave')+(p.numero?' del paquete '+p.numero:'')+' · '+ref(o.id),id:o.id})});
  });
  caja.forEach(m=>{const t=T(m.creado_en);if(!(t>lim))return;const ing=String(m.tipo||'').toLowerCase()!=='retiro'&&String(m.tipo||'').toLowerCase()!=='egreso';
    ev.push({k:'caja',t,ic:'<i class="ti ti-wallet" aria-hidden="true"></i>',tit:(ing?'Ingreso en caja · ':'Salida de caja · ')+motoName(m.motorizado_id),sub:String(m.descripcion||'').replace(/__PIDEMAS[^ ]*/g,'').replace(/^\s*INGRESO MANUAL DE CAJA\s*[·:—-]?\s*/i,'').trim().slice(0,120)||(ing?'Ingreso':'Retiro'),amt:(ing?'+ ':'− ')+money(m.monto),ing,id:m.pedido_id,caja:true})});
  pagosSueldo.forEach(r=>{const t=T(r.creado_en)||T(r.actualizado_en)||T(r.fecha);if(!(t>lim))return;
    const det=String(r.descripcion||'').replace(/__PIDEMAS[^ ]*/g,'').trim();
    ev.push({k:'sueldo',t,ic:'<i class="ti ti-cash" aria-hidden="true"></i>',tit:'Pago de sueldo · '+motoName(r.motorizado_id),sub:(det&&det!=='Pago de sueldo'?det:'Sueldo pagado'),amt:'− '+money(r.monto),ing:false,sueldo:true})});
  ev.sort((a,b)=>b.t-a.t);return ev;
}
function enCurso(){
  return orders().filter(o=>o.motorizado_id&&!['entregado','cancelado','pendiente','rechazado'].includes(String(o.estado||'').toLowerCase()))
    .sort((a,b)=>T(b.asignado_en||b.creado_en)-T(a.asignado_en||a.creado_en));
}
let pagosSueldo=[];
async function cargarCaja(){
  const d=DB();if(!d)return;
  try{const r=await d.from('control_sueldos').select('*').eq('tipo','pago').order('fecha',{ascending:false}).limit(60);if(!r.error&&Array.isArray(r.data))pagosSueldo=r.data}catch(e){}
  try{const {data,error}=await d.from('movimientos_caja').select('id,motorizado_id,pedido_id,tipo,monto,descripcion,creado_en').gte('creado_en',new Date(Date.now()-VENTANA).toISOString()).order('creado_en',{ascending:false}).limit(150);
    if(!error&&Array.isArray(data)){caja=data;cajaOk=true}}catch(e){}
}

function mount(){
  const head=document.querySelector('header.top');if(!head)return;
  if(!$('pdaBell')){
    const b=document.createElement('button');b.type='button';b.id='pdaBell';b.setAttribute('aria-label','Avisos');b.hidden=true;
    b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span class="pdaBadge" hidden>0</span>';
    b.addEventListener('click',abrir);head.appendChild(b);
  }
  {const me=$('pdhMe'),bl=$('pdaBell');if(me&&bl&&(me.parentNode!==head||me.nextElementSibling!==bl))head.insertBefore(me,bl)}
  if(!head.__pdMeNav){head.__pdMeNav=1;head.addEventListener('click',e=>{if(!e.target.closest('#pdhMe'))return;const h=$('pdhHome');if(h&&!h.offsetParent&&typeof window.openAdminTab==='function')window.openAdminTab('restaurantes')},true)}
  if(!$('pdaPanel')){
    const p=document.createElement('div');p.id='pdaPanel';p.hidden=true;
    p.innerHTML='<div class="a-bg" data-x="1"></div><div class="a-card" role="dialog" aria-modal="true" aria-label="Avisos"><div class="a-head"><span><strong>Avisos y actividad</strong><small>Pedidos, motorizados, cajas, guías y reportes</small></span><button type="button" class="a-x" data-x="1" aria-label="Cerrar">×</button></div><div class="a-tabs" id="pdaTabs"></div><div class="a-body" id="pdaBody"></div></div>';
    p.addEventListener('click',clickPanel);document.body.appendChild(p);
  }
  const sh=$('pdhSheet');const card=sh&&sh.querySelector('.h-sheetCard');
  if(card&&!$('pdaLogout')){const l=document.createElement('button');l.type='button';l.id='pdaLogout';l.className='pdaLogout';l.textContent='Cerrar sesión';l.addEventListener('click',async ()=>{if((await pdConfirmar('¿Cerrar sesión del panel administrador?')))$('logout')?.click()});card.appendChild(l)}
}
let pdaListo=false;async function pdaDatos(){const espera=ms=>new Promise(r=>setTimeout(r,ms));try{if(!motos().length&&typeof loadMotos==='function')await Promise.race([loadMotos(),espera(4000)])}catch(e){}try{if(!orders().length&&typeof loadOrders==='function')await Promise.race([loadOrders(),espera(5000)])}catch(e){}for(let i=0;i<20&&(!motos().length||!orders().length);i++)await espera(150)}function abrir(){mount();tab='ped';$('pdaPanel').hidden=false;document.body.classList.add('pdaOpen');pintar();Promise.all([cargarCaja(),pdaDatos()]).then(()=>{pdaListo=true;pintar();marcarVisto()})}
function marcarVisto(){const ev=eventos();const top=ev.length?ev[0].t:Date.now();lastSeen=Math.max(top,Date.now());LS.set('pdaAvisosVisto',String(lastSeen));badge()}
function cerrar(){$('pdaPanel').hidden=true;document.body.classList.remove('pdaOpen');marcarVisto();pintar()}
function irPedido(id){
  cerrar();if(window.pdAbrirPedidoAdmin&&window.pdAppAdm){window.pdAbrirPedidoAdmin(id);return}try{window.openAdminTab&&window.openAdminTab('pedidos')}catch(_){}
  setTimeout(()=>{const c=document.querySelector(`.adminOrderCard[data-order-id="${CSS.escape(String(id))}"]`);if(c){c.classList.add('is-expanded');c.scrollIntoView({behavior:'smooth',block:'start'})}},500);
}
function clickPanel(e){
  const t=e.target;
  if(t.closest('[data-x]')){cerrar();return}
  const tb=t.closest('[data-tab]');if(tb){tab=tb.dataset.tab;pintar();return}
  const rs=t.closest('[data-resolver]');if(rs){e.stopPropagation();resolver(rs.dataset.resolver,rs);return}
  const sl=t.closest('[data-sueldo]');if(sl){cerrar();if(window.pdAppAdm){pdAppAdm.ir('sueldo');return}try{window.openAdminTab&&window.openAdminTab('sueldo')}catch(_){}return}
  const cj=t.closest('[data-caja]');if(cj&&!cj.dataset.id){cerrar();if(window.pdAppAdm){pdAppAdm.ir('caja');return}try{window.openAdminTab&&window.openAdminTab('caja')}catch(_){}return}
  const it=t.closest('[data-id]');if(it&&it.dataset.id){irPedido(it.dataset.id)}
}
async function resolver(id,btn){
  btn.disabled=true;btn.textContent='Guardando…';
  try{const {error}=await DB().from('pedidos').update({incidencia_resuelta:true}).eq('id',id);if(error)throw error;const o=orders().find(x=>String(x.id)===String(id));if(o)o.incidencia_resuelta=true;pintar();badge();try{window.loadOrders&&window.loadOrders()}catch(_){}}
  catch(e){btn.disabled=false;btn.textContent='No se pudo · reintentar'}
}
function pintar(){
  const p=$('pdaPanel');if(!p||p.hidden)return;
  if(!pdaListo){const tb=$('pdaTabs'),bd=$('pdaBody');if(tb)tb.innerHTML='';if(bd)bd.innerHTML='<div class="a-empty">Cargando avisos…</div>';return}
  const ev=eventos(),run=enCurso();
  const c={todos:ev.length,ped:ev.filter(x=>x.k==='ped').length,caja:ev.filter(x=>x.k==='caja').length,guia:ev.filter(x=>x.k==='guia').length,ocu:ev.filter(x=>x.k==='ocu').length,sueldo:ev.filter(x=>x.k==='sueldo').length};
  const TABS=[['todos','Todos'],['motos','Motorizados',run.length],['ped','Pedidos',c.ped],['caja','Cajas',c.caja],['sueldo','Sueldos',c.sueldo],['guia','Guías',c.guia],['ocu','Reportes',c.ocu]];
  $('pdaTabs').innerHTML=TABS.map(([k,l,n])=>`<button type="button" data-tab="${k}" class="${tab===k?'on':''}">${l}${n?`<i>${n}</i>`:''}</button>`).join('');
  let h='';
  if(tab==='todos'||tab==='motos'){
    h+='<div class="a-sec">En ruta ahora</div>';
    h+=run.length?'<div class="a-live">'+run.map(o=>{const {E2,i}=pasoActual(o);const sig=E2[Math.min(i+1,E2.length-1)];const ult=T(o[(E2[i]||[])[0]])||T(o.asignado_en)||T(o.creado_en);
      return `<button type="button" class="a-run" data-id="${E(o.id)}"><div class="a-runTop"><b><i class="ti ti-map-pin a-runIc" aria-hidden="true"></i> ${E(motoName(o.motorizado_id))}</b><span>${E(hace(ult))}</span></div><div class="a-runSub">${E(TIPO[tipoN(o)])} ${E(ref(o.id))}${cli(o)?' · '+E(cli(o)):''}${o.incidencia&&o.incidencia_resuelta!==true?' · '+E(o.incidencia):''}</div><div class="a-steps">${E2.map((_,j)=>`<i class="${j<i?'on':j===i?'now':''}"></i>`).join('')}</div><div class="a-stepTxt">Paso ${i+1} de ${E2.length}: ${E(String((E2[i]||E2[0])[1]).replace(/^./,c=>c.toLowerCase()))}${i<E2.length-1?' · sigue: '+E(String(sig[1]).replace(/^./,c=>c.toLowerCase())):''}</div></button>`}).join('')+'</div>':'<div class="a-empty">Ningún motorizado tiene pedidos en curso.</div>';
  }
  if(tab!=='motos'){
    const L=tab==='todos'?ev.slice(0,80):ev.filter(x=>x.k===tab);
    h+=`<div class="a-sec">${tab==='todos'?'Últimos movimientos':'Últimas 48 horas'}</div>`;
    if(tab==='caja'&&!cajaOk)h+='<div class="a-empty">Cargando movimientos de caja…</div>';
    else h+=L.length?'<div class="a-list">'+L.map(x=>`<button type="button" class="a-it k-${x.k}${x.t>lastSeen?' new':''}" ${x.id?`data-id="${E(x.id)}"`:''} ${x.caja?'data-caja="1"':''} ${x.sueldo?'data-sueldo="1"':''}><span class="a-ic">${x.ic}</span><span class="a-txt"><b>${E((window.pdTxt||String)(x.tit))}</b><span>${E((window.pdTxt||String)(x.sub))}</span><small>${E(hace(x.t))}</small>${x.k==='ocu'&&x.abierta?`<span><span class="a-ocuBtn" role="button" data-resolver="${E(x.id)}">Marcar como resuelto</span></span>`:''}</span>${x.amt?`<span class="a-amt ${x.ing?'in':'out'}">${E(x.amt)}</span>`:''}</button>`).join('')+'</div>':'<div class="a-empty">Sin avisos por ahora.</div>';
  }
  const body=$('pdaBody'),sc=body.scrollTop;body.innerHTML=h;body.scrollTop=sc;
}
function badge(){
  const b=$('pdaBell');if(!b)return;
  const ev=eventos();const n=ev.filter(x=>x.t>lastSeen).length;
  const abiertas=orders().filter(o=>o.incidencia&&o.incidencia_resuelta===false).length;
  const bd=b.querySelector('.pdaBadge');const v=n||abiertas;bd.textContent=v>99?'99+':String(v);bd.hidden=!v;bd.classList.toggle('alert',abiertas>0);
  const top=ev.length?ev[0].t:0;if(prevTop&&top>prevTop&&top>lastSeen){b.classList.remove('ring');void b.offsetWidth;b.classList.add('ring')}prevTop=top;
}
function sync(){
  mount();const b=$('pdaBell');if(!b)return;
  const logged=!$('logout')?.classList.contains('hidden');if(b.hidden===logged)b.hidden=!logged;{const me=$('pdhMe');if(me)me.hidden=b.hidden}
  if(logged){badge();pintar()}
}
let tick=0;
function loop(){tick++;sync();if(!$('pdaBell')?.hidden&&(tick%10===1))cargarCaja().then(()=>{badge();pintar()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loop,{once:true});else loop();
setInterval(loop,3000);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('pdaPanel')&&!$('pdaPanel').hidden)cerrar()});
window.pdaAvisos={abrir,eventos,enCurso,cargarCaja,marcarVisto};
})();
}catch(e){console.error("[pd-adm-avisos-js]",e)}

/* ===== pidemas-admin-diseno-js ===== */
try{
window.pdVentanaPedido=function(cfg){
var ultimo=null,guardado={clave:null,top:0},trabajando=false;
function velo(on){
var v=document.getElementById('pdVelo');
if(on&&!v){v=document.createElement('button');v.type='button';v.id='pdVelo';v.setAttribute('aria-label','Cerrar pedido');
v.addEventListener('click',function(){var a=cfg.abierta();if(a)cfg.cerrar(a)});document.body.appendChild(v)}
if(!on&&v)v.remove();
if(document.body.classList.contains('pd-modal-abierto')!==!!on)document.body.classList.toggle('pd-modal-abierto',!!on);
}
function sync(){
if(trabajando)return;trabajando=true;
try{
var a=cfg.abierta();velo(!!a||!!(cfg.pendiente&&cfg.pendiente()));
if(!a){ultimo=null;if(!(cfg.pendiente&&cfg.pendiente()))guardado.clave=null;return}
var k=cfg.clave(a),nueva=(a!==ultimo);
if(nueva&&cfg.antes)cfg.antes(a);
var h=cfg.cabecera(a);
if(h&&!h.querySelector(':scope > .pdCerrarX')){
var x=document.createElement('button');x.type='button';x.className='pdCerrarX';x.setAttribute('aria-label','Cerrar pedido');x.textContent='×';
x.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();var o=cfg.abierta();if(o)cfg.cerrar(o)});
h.appendChild(x);
}
if(cfg.acciones){
var bs=(cfg.acciones(a)||[]).filter(function(b){return b&&b.isConnected});
var pie=a.querySelector(':scope > .pdPie');
if(bs.length){
if(!pie){pie=document.createElement('div');pie.className='pdPie'}
bs.forEach(function(b){if(b.parentElement!==pie)pie.appendChild(b)});
if(a.lastElementChild!==pie)a.appendChild(pie);
}else if(pie&&!pie.children.length)pie.remove();
}
if(nueva){
ultimo=a;
if(k===guardado.clave){
var top=guardado.top;a.scrollTop=top;
requestAnimationFrame(function(){if(ultimo===a&&Math.abs(a.scrollTop-top)>2)a.scrollTop=top});
setTimeout(function(){if(ultimo===a&&Math.abs(a.scrollTop-top)>2)a.scrollTop=top},200);
}else{guardado.clave=k;guardado.top=0;a.classList.add('pd-entrando');setTimeout(function(){a.classList.remove('pd-entrando')},260)}
}
}finally{trabajando=false}
}
document.addEventListener('scroll',function(e){
var a=ultimo;if(a&&e.target===a){guardado.clave=cfg.clave(a);guardado.top=a.scrollTop}
},true);
document.addEventListener('keydown',function(e){if(e.key==='Escape'){var a=cfg.abierta();if(a)cfg.cerrar(a)}});
new MutationObserver(sync).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
sync();
return sync;
};
(function(){
var $=function(i){return document.getElementById(i)};
window.pdVentanaPedido({
abierta:function(){return document.querySelector('#orderList .adminOrderCard.is-expanded')},
clave:function(a){return a.getAttribute('data-order-id')||''},
cabecera:function(a){return a.querySelector('.pdRouteBand')},
acciones:function(a){
var l=[].slice.call(a.querySelectorAll('.pdRouteActions .approveOrderBtn,.pdRouteActions .rejectOrderBtn'));
var asg=a.querySelector(':scope > .pdRouteAssign');if(asg)l.push(asg);
return l;
},
antes:function(a){
var cod=a.querySelector('.pdRouteBand .pdRouteCode'),trk=a.querySelector('.pdRouteTrack');
if(cod&&trk&&trk.parentElement!==cod)cod.appendChild(trk);
},
cerrar:function(a){
var bs=a.querySelectorAll('button');
for(var i=0;i<bs.length;i++){if(/^cerrar detalle$/i.test((bs[i].textContent||'').trim())){bs[i].click();return}}
a.classList.remove('is-expanded');
}
});
})();
}catch(e){console.error("[pidemas-admin-diseno-js]",e)}

/* ===== pidemas-tarifa-motor ===== */
try{
(function(){
if(window.pdTarifa)return;
const RUTA='config/tarifas.json',BUCKET='restaurantes';
const BASE={
version:1,
base:6, km_incluidos:3, por_km:2, redondeo:0.1, minimo:6, maximo:0,
zonas:[],
recargos:{
nocturno:{activo:false,desde:'21:00',hasta:'06:00',monto:2},
lluvia:{activo:false,monto:2},
pedido_grande:{activo:false,desde_subtotal:150,monto:2}
},
actualizado:null
};
const cli=()=>{try{return sb}catch(e){}try{return db}catch(e){}return window.db||window.sb||null};
const clonar=o=>JSON.parse(JSON.stringify(o));
const mezclar=(a,b)=>{const r=clonar(a);if(!b||typeof b!=='object')return r;Object.keys(b).forEach(k=>{if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])&&r[k]&&typeof r[k]==='object')r[k]=mezclar(r[k],b[k]);else r[k]=b[k]});return r};
let cfg=clonar(BASE),cargadoEn=0,promesa=null;
try{const c=JSON.parse(localStorage.getItem('pd_tarifa_cfg')||'null');if(c)cfg=mezclar(BASE,c)}catch(e){}
function urlPublica(){const c=cli();if(!c||!c.storage)return '';try{return c.storage.from(BUCKET).getPublicUrl(RUTA).data.publicUrl}catch(e){return ''}}
async function cargar(forzar){
if(!forzar&&Date.now()-cargadoEn<5*60*1000)return cfg;
if(promesa)return promesa;
promesa=(async()=>{
const u=urlPublica();
if(u){try{const r=await fetch(u+'?t='+Date.now(),{cache:'no-store'});if(r.ok){const j=await r.json();cfg=mezclar(BASE,j);try{localStorage.setItem('pd_tarifa_cfg',JSON.stringify(cfg))}catch(e){}}}catch(e){}}
cargadoEn=Date.now();promesa=null;return cfg;
})();
return promesa;
}
async function guardar(nuevo){
const c=cli();if(!c||!c.storage)throw new Error('No hay conexión con Supabase.');
const datos=mezclar(BASE,nuevo);datos.actualizado=new Date().toISOString();
const blob=new Blob([JSON.stringify(datos,null,2)],{type:'application/json'});
const {error}=await c.storage.from(BUCKET).upload(RUTA,blob,{upsert:true,contentType:'application/json',cacheControl:'0'});
if(error)throw error;
cfg=datos;cargadoEn=Date.now();try{localStorage.setItem('pd_tarifa_cfg',JSON.stringify(cfg))}catch(e){}
return cfg;
}
const red=(v,p)=>{p=Number(p)||0.1;return Math.round((Number(v)+Number.EPSILON)/p)*p};
const n2=v=>Math.round((Number(v)+Number.EPSILON)*100)/100;
function recta(a,b){const R=6371,t=x=>x*Math.PI/180;const dLa=t(b.lat-a.lat),dLo=t(b.lng-a.lng);const h=Math.sin(dLa/2)**2+Math.cos(t(a.lat))*Math.cos(t(b.lat))*Math.sin(dLo/2)**2;return 2*R*Math.atan2(Math.sqrt(h),Math.sqrt(1-h))}
function coords(v){
if(!v)return null;if(typeof v==='object'){const la=Number(v.lat??v.latitude),ln=Number(v.lng??v.longitude);return Number.isFinite(la)&&Number.isFinite(ln)?{lat:la,lng:ln}:null}
const s=decodeURIComponent(String(v));
for(const re of [/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/,/[?&](?:q|query|ll|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/]){const m=s.match(re);if(m){const la=Number(m[1]),ln=Number(m[2]);if(Number.isFinite(la)&&Number.isFinite(ln))return {lat:la,lng:ln}}}
return null;
}
async function distanciaRuta(a,b){
a=coords(a);b=coords(b);if(!a||!b)throw new Error('Faltan las ubicaciones para calcular la distancia.');
try{const r=await fetch('https://router.project-osrm.org/route/v1/driving/'+a.lng+','+a.lat+';'+b.lng+','+b.lat+'?overview=false&alternatives=true');const j=await r.json();const d=(j.routes||[]).map(x=>Number(x.distance)/1000).filter(Number.isFinite);if(r.ok&&j.code==='Ok'&&d.length)return {km:Math.min(...d),aproximado:false}}catch(e){}
try{const r=await fetch('https://valhalla1.openstreetmap.de/route',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({locations:[{lat:a.lat,lon:a.lng},{lat:b.lat,lon:b.lng}],costing:'motorcycle',units:'kilometers'})});const j=await r.json();const km=Number(j?.trip?.summary?.length);if(r.ok&&Number.isFinite(km))return {km,aproximado:false}}catch(e){}
return {km:n2(recta(a,b)*1.3),aproximado:true};
}
function horaLima(fecha){try{return new Date(fecha||Date.now()).toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Lima'})}catch(e){return '12:00'}}
const aMin=h=>{const m=String(h||'').match(/(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):null};
function enFranja(h,desde,hasta){const x=aMin(h),a=aMin(desde),b=aMin(hasta);if(x==null||a==null||b==null)return false;return a<=b?(x>=a&&x<b):(x>=a||x<b)}
function calcular(o){return calcularCon(cfg,o)}
function calcularCon(c,o){
o=o||{};c=mezclar(BASE,c);const km=Math.max(0,Number(o.km)||0);const det=[];let total=0,zona=null;
const dest=coords(o.destino);
if(dest&&Array.isArray(c.zonas)){
zona=c.zonas.filter(z=>z&&z.activo!==false&&Number.isFinite(Number(z.lat))&&Number.isFinite(Number(z.lng))&&Number(z.radio_km)>0&&Number(z.precio)>=0)
.map(z=>({z,d:recta({lat:Number(z.lat),lng:Number(z.lng)},dest)})).filter(x=>x.d<=Number(x.z.radio_km)).sort((a,b)=>a.d-b.d)[0]?.z||null;
}
if(zona){total=Number(zona.precio);det.push({concepto:'Zona '+(zona.nombre||''),monto:n2(total)})}
else{
const base=Number(c.base)||0,inc=Number(c.km_incluidos)||0,pk=Number(c.por_km)||0;
total=base;det.push({concepto:'Tarifa base (hasta '+inc+' km)',monto:n2(base)});
if(km>inc){const extra=(km-inc)*pk;total+=extra;det.push({concepto:(km-inc).toFixed(1)+' km adicionales × S/ '+pk.toFixed(2),monto:n2(extra)})}
}
const R=c.recargos||{};
if(R.nocturno&&R.nocturno.activo&&enFranja(horaLima(o.fecha),R.nocturno.desde,R.nocturno.hasta)){total+=Number(R.nocturno.monto)||0;det.push({concepto:'Recargo nocturno',monto:n2(R.nocturno.monto)})}
if(R.lluvia&&R.lluvia.activo){total+=Number(R.lluvia.monto)||0;det.push({concepto:'Recargo por lluvia',monto:n2(R.lluvia.monto)})}
if(R.pedido_grande&&R.pedido_grande.activo&&Number(o.subtotal)>=Number(R.pedido_grande.desde_subtotal)){total+=Number(R.pedido_grande.monto)||0;det.push({concepto:'Pedido grande',monto:n2(R.pedido_grande.monto)})}
let fin=red(total,c.redondeo);
if(Number(c.minimo)>0&&fin<Number(c.minimo)){det.push({concepto:'Ajuste a tarifa mínima',monto:n2(Number(c.minimo)-fin)});fin=Number(c.minimo)}
if(Number(c.maximo)>0&&fin>Number(c.maximo)){det.push({concepto:'Tope de tarifa máxima',monto:n2(Number(c.maximo)-fin)});fin=Number(c.maximo)}
return {total:n2(fin),km:n2(km),zona:zona?zona.nombre:null,detalle:det,aproximado:!!o.aproximado};
}
function desgloseDePedido(obs){
const s=String(obs||'');const i=s.indexOf('__PIDEMAS_DELIVERY__');if(i<0)return null;
let j=i+'__PIDEMAS_DELIVERY__'.length,prof=0,k=j;for(;k<s.length;k++){if(s[k]==='{')prof++;else if(s[k]==='}'){prof--;if(!prof){k++;break}}}
try{const d=JSON.parse(s.slice(j,k));if(d&&typeof d.detalle==='string')d.detalle=d.detalle.split(';').filter(Boolean).map(x=>{const i=x.lastIndexOf('=');return {concepto:x.slice(0,i),monto:Number(x.slice(i+1))}});return d}catch(e){return null}
}
window.pdDetalleTxt=function(){const t=window.__pdTarifaUltima;if(!t||!Array.isArray(t.detalle)||!t.detalle.length)return null;return t.detalle.map(d=>String(d.concepto).replace(/[;=|·{}\[\]"]/g,' ')+'='+d.monto).join(';')};
window.pdTarifa={cargar,guardar,calcular,calcularCon,distanciaRuta,coords,desgloseDePedido,get config(){return clonar(cfg)},porDefecto:()=>clonar(BASE)};
setTimeout(()=>{cargar().catch(()=>{})},300);
})();
}catch(e){console.error("[pidemas-tarifa-motor]",e)}

/* ===== pidemas-seguimiento-js ===== */
try{
(function(){
var E=function(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var money=function(n){return 'S/ '+(Number(n)||0).toFixed(2)};
var hora=function(v){if(!v)return '';var d=new Date(v);return isNaN(d)?'':d.toLocaleTimeString('es-PE',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'America/Lima'})};
var ORDEN=['pendiente','confirmado','asignado','aceptado','en_camino','en_entrega','entregado'];
function rango(s){s=String(s||'').toLowerCase();if(s==='pedido_aceptado'||s==='camino_recojo')s='aceptado';if(s==='camino_entrega')s='en_camino';if(s==='confirmando_pago')s='en_entrega';return ORDEN.indexOf(s)}
function tipo(o){var t=String(o.tipo_servicio||'').toLowerCase();if(t.indexOf('encomienda')>=0)return 'encomienda';if(t.indexOf('compra')>=0)return 'compra';if(t.indexOf('recojo')>=0)return 'recojo';return 'tienda'}
var cfg={},abiertoId=null,timer=null;
function paqs(o){
var L=[{numero:1,agencia:String(o.agencia_destino||'').trim(),destino:String(o.destino_final||o.direccion_entrega||'').trim()}];
var raw=String(o.observaciones||''),i=raw.indexOf('PAQUETES ADICIONALES:');
if(i>=0)raw.slice(i+21).split(/\s*\|\s*PAGO_ENCOMIENDA_/i)[0].split(/\s*\|\|\s*/).forEach(function(part){var n=part.match(/Paquete\s+(\d+)/i),a=part.match(/Agencia\s+([^;]+);/i),d=part.match(/destino\s+([^;]+);/i);if(n)L.push({numero:Number(n[1]),agencia:a?a[1].trim():'',destino:d?d[1].trim():''})});
return L.filter(function(p,k,A){return A.findIndex(function(x){return x.numero===p.numero})===k});
}
function guias(o){var v=o.paquetes_envio;if(!Array.isArray(v)){try{v=JSON.parse(v||'[]')}catch(e){v=[]}}return Array.isArray(v)?v:[]}
function pasos(o){
var r=rango(o.estado),t=tipo(o),L=[],mn=cfg.motoNombre?cfg.motoNombre(o):'';
L.push(['Pedido recibido','',o.creado_en,true]);
if(o.negocio_id){
L.push(['El negocio confirmó',o.tiempo_preparacion_min?'Listo en '+o.tiempo_preparacion_min+' min':'',o.negocio_aceptado_en||o.pago_negocio_confirmado_en,r>=1||!!o.negocio_aceptado_en]);
L.push(['Pedido listo en el negocio','',o.listo_para_recojo_en,o.listo_para_recojo===true]);
}else if(t!=='encomienda'&&t!=='compra'&&t!=='recojo'){L.push(['Pedido aceptado por Pidemás','',null,r>=1])}
L.push(['Motorizado asignado',mn||'',o.asignado_en,r>=2||!!o.motorizado_id]);
L.push(['El motorizado aceptó','',o.aceptado_en,r>=3]);
var m=String(o.pago_servicio_momento||'').toLowerCase();
var metodo=String(o.metodo_pago||'').toLowerCase()==='yape'?'Yape':'efectivo';
if((t==='encomienda'||t==='recojo')&&(m==='recojo_efectivo'||m==='recojo_yape'))L.push(['Cobró al recoger',money(o.total)+' · '+metodo,null,o.pago_confirmado===true]);
if(t==='encomienda'){
L.push(['Recogió los paquetes','',o.en_camino_en,r>=4]);
var PK=paqs(o),ags=[];PK.forEach(function(p){if(p.agencia&&ags.indexOf(p.agencia)<0)ags.push(p.agencia)});
if(ags.length>1)L.push(['Llegó a las agencias',ags.join(' · '),null,o.pedido_en_agencia===true||r>=6]);
else L.push(['Llegó a la agencia',ags[0]||'',null,o.pedido_en_agencia===true||r>=6]);
if(PK.length>1){var G=guias(o);PK.forEach(function(p){var g=G.filter(function(x){return Number(x.numero)===p.numero})[0];L.push(['Guía del paquete '+p.numero,[p.agencia,p.destino].filter(Boolean).join(' → '),g&&g.enviado_en,!!(g&&(g.enviado_whatsapp||g.guia_url))||r>=6])})}
else L.push(['Guía y clave registradas','',null,(!!o.guia_url&&!!o.clave_guia)||guias(o).some(function(g){return g.enviado_whatsapp||g.guia_url})||r>=6]);
L.push(['Guía enviada al cliente','',o.guia_enviada_cliente_en,!!o.guia_enviada_cliente_en||r>=6]);
if(m==='al_final')L.push(['Cliente pagó',money(o.total)+' por Yape',null,o.pago_confirmado===true]);
L.push(['Encomienda terminada','',o.entregado_en,r>=6]);
}else{
if(o.negocio_id){
L.push(['Llegó al local',o.codigo_recojo?'Código de recojo '+o.codigo_recojo:'',o.en_local_en,!!o.en_local_en||r>=4]);
L.push(['Recogió el pedido','En camino al cliente',o.en_camino_en,r>=4]);
}else{
if(t==='compra')L.push(['Compra registrada',Number(o.subtotal)>0?'Gastó '+money(o.subtotal):'',null,Number(o.subtotal)>0||r>=4]);
L.push(['En camino',t==='recojo'?'Hacia quien recibe':'Hacia el cliente',o.en_camino_en,r>=4]);
}
L.push(['Llegó donde el cliente','',o.en_entrega_en,r>=5]);
var yaPagado=o.pago_acordado==='pagado'||m==='pagado'||m==='recojo_efectivo'||m==='recojo_yape'||!(Number(o.total)>0);
if(!yaPagado)L.push(['Cobro confirmado',money(o.total)+' · '+metodo,null,o.pago_confirmado===true||r>=6]);
L.push(['Pedido entregado','',o.entregado_en,r>=6]);
}
var ult=-1;L.forEach(function(x,i){if(x[3])ult=i});
var cancel=String(o.estado||'').toLowerCase()==='cancelado';
return L.map(function(x,i){return{n:x[0],s:x[1],t:hora(x[2]),hecho:i<=ult,ahora:!cancel&&i===ult&&ult<L.length-1,ultimo:i===L.length-1}});
}
function ini(n){return String(n||'?').trim().split(/\s+/).slice(0,2).map(function(p){return p[0]||''}).join('').toUpperCase()||'?'}
function haceTxt(d){var t=new Date(d).getTime();if(!t)return '';var m=Math.round((Date.now()-t)/60000);if(m<1)return 'Ahora';if(m<60)return 'Hace '+m+' min';var h=Math.floor(m/60);if(h<24)return 'Hace '+h+' h';var dd=Math.floor(h/24);return 'Hace '+dd+(dd===1?' día':' días')}
function progTxt(o){var p='';try{var dp=window.pdTarifa&&pdTarifa.desgloseDePedido(o.observaciones);if(dp&&dp.programado){p=dp.programado_txt||'';if(!p){p=new Date(dp.programado).toLocaleString('es-PE',{timeZone:'America/Lima',weekday:'long',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})}}}catch(x){}return p}
function pintar(){
var box=document.getElementById('pdSeg');if(!box||!abiertoId)return;
var o=cfg.pedido?cfg.pedido(abiertoId):null;
if(!o){box.querySelector('.sqPill').textContent='Pedido no disponible';return}
var st=pasos(o),hechos=st.filter(function(s){return s.hecho}).length,cur=st.filter(function(s){return s.ahora})[0];
var cancel=String(o.estado||'').toLowerCase()==='cancelado',t=tipo(o);
var origen=t==='tienda'?(cfg.negocioNombre?cfg.negocioNombre(o):'')||'Negocio':(o.nombre_remitente||String(o.direccion_recojo||'').replace(/https?:\/\/\S+/g,'').replace(/^[\s·\-–]+|[\s·\-–]+$/g,'')||(t==='compra'?'Lugar de compra':'Recojo'));
var destino=t==='encomienda'?(function(){var A=[];paqs(o).forEach(function(p){if(p.agencia&&A.indexOf(p.agencia)<0)A.push(p.agencia)});return A.join(' · ')||o.destino_final||'Agencia'})():(o.nombre_receptor||o.nombre_cliente||'Cliente');
var pend=String(o.estado||'').toLowerCase()==='pendiente'&&!!o.negocio_id&&!cancel;
box.querySelector('.sqCode').textContent='#'+String(o.id).slice(0,8).toUpperCase();
box.querySelector('.sqHace').textContent=haceTxt(o.creado_en||o.created_at);
box.querySelector('.sqDe').textContent=origen;box.querySelector('.sqA').textContent=destino;
var pl=box.querySelector('.sqPill');pl.textContent=cancel?'Pedido cancelado':(pend?'Esperando al negocio':(cur?cur.n:'Entregado'));
pl.className='sqPill'+(cancel?' no':(pend?' parp':(!cur?' ok':'')));
box.querySelector('.sqMonto').textContent=money(o.total);
var pr=progTxt(o),pe=box.querySelector('.sqProgr');pe.hidden=!pr;pe.querySelector('b').textContent=pr;
var pasoTxt=cancel?'Cancelado':'Paso '+Math.max(1,hechos)+' de '+st.length;
var al=box.querySelector('.sqAlerta'),inc=o.incidencia&&o.incidencia_resuelta!==true?'Problema reportado: '+o.incidencia:'';
al.textContent=inc;al.hidden=!inc;
var html='<section class="sqCard"><h3 class="sqTit">Línea de tiempo<span class="sqPasoN">'+pasoTxt+'</span></h3><ol class="sqList">'+st.map(function(s){
var cls=s.ahora?'ahora':(s.hecho?'hecho':'pend');
return '<li class="sqPaso '+cls+'"><span class="sqRiel"><i class="sqPto"></i>'+(s.ultimo?'':'<i class="sqLin"></i>')+'</span><span class="sqTxt"><b>'+E(s.n)+'</b>'+(s.s?'<small>'+E(s.s)+'</small>':'')+'</span>'+(s.ahora?'<span class="sqAhora">Ahora</span>':(s.hecho&&s.t?'<span class="sqHora">'+E(s.t)+'</span>':''))+'</li>';
}).join('')+'</ol></section>';
var c=box.querySelector('.sqBody'),top=c.scrollTop;
if(c.__html!==html){c.innerHTML=html;c.__html=html;c.scrollTop=top}
}
function cerrar(){
abiertoId=null;clearInterval(timer);timer=null;
var b=document.getElementById('pdSeg'),v=document.getElementById('pdSegVelo');if(b){try{b.close()}catch(e){}b.remove()}if(v)v.remove();
document.body.classList.remove('pd-seg-abierto');
}
function abrir(id){
if(!id)return;cerrar();abiertoId=String(id);

var b=document.createElement('dialog');b.id='pdSeg';b.setAttribute('role','dialog');b.setAttribute('aria-modal','true');b.setAttribute('aria-label','Seguimiento del pedido');
b.innerHTML='<header class="sqHead"><span class="sqGrab"></span><button type="button" class="sqX" aria-label="Cerrar seguimiento">×</button>'+
'<span class="sqKick">Seguimiento del pedido</span>'+
'<div class="sqCodeRow"><span class="sqCode"></span><span class="sqHace"></span></div>'+
'<div class="sqEstado"><span class="sqPill"></span></div>'+
'<div class="sqProgr" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></svg><span>Programado · <b></b></span></div>'+
'<div class="sqRutaRow"><div class="sqRuta"><span class="sqDe"></span><i>→</i><span class="sqA"></span></div><span class="sqMonto"></span></div>'+
'<div class="sqAlerta" hidden></div></header>'+
'<div class="sqBody"></div>'+
'<footer class="sqFoot"><span class="sqVivo"><i></i>Se actualiza automáticamente</span></footer>';
b.querySelector('.sqX').addEventListener('click',cerrar);
document.body.appendChild(b);try{b.showModal()}catch(e){b.setAttribute('open','')}b.addEventListener('click',function(e){if(e.target===b)cerrar()});b.addEventListener('cancel',function(e){e.preventDefault();cerrar()});document.body.classList.add('pd-seg-abierto');
pintar();timer=setInterval(function(){try{var d=document.getElementById('pdSeg');if(d&&!(d.matches&&d.matches(':modal'))&&document.body.lastElementChild!==d)document.body.appendChild(d)}catch(e){}pintar()},2000);try{if(!b.matches(':modal'))document.body.appendChild(b)}catch(e){}
b.setAttribute('tabindex','-1');b.focus();
}
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&abiertoId){e.stopImmediatePropagation();e.preventDefault();cerrar()}},true);
window.pdSeguimiento={configurar:function(c){cfg=c||{}},abrir:abrir,cerrar:cerrar,pintar:pintar};
})();
}catch(e){console.error("[pidemas-seguimiento-js]",e)}

/* ===== pidemas-avisos-diseno-js ===== */
try{
(function(){
const S=d=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+d+'</svg>';
const IC={
pedido:S('<path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2z"/><path d="M9 7h6M9 11h6M9 15h4"/>'),
cancel:S('<circle cx="12" cy="12" r="9"/><path d="M5.7 5.7l12.6 12.6"/>'),
caja:S('<path d="M17 8V5a1 1 0 0 0-1-1H6a2 2 0 0 0 0 4h12a1 1 0 0 1 1 1v3m0 4v3a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V6"/><path d="M20 12v4h-4a2 2 0 0 1 0-4z"/>'),
sueldo:S('<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>'),
moto:S('<circle cx="5" cy="16" r="3"/><circle cx="19" cy="16" r="3"/><path d="M7.5 14h5l4-4H13M16 7h2l1 3M10 10l2.5 4"/>'),
ok:S('<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>'),
alerta:S('<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>'),
campana:S('<path d="M18 9a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>'),
recojo:S('<path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
entrega:S('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>'),
monto:S('<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>'),
pago:S('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/>'),
cliente:S('<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>'),
lista:S('<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>'),
nota:S('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
reloj:S('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')
};
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PAGO={yape:'Yape',efectivo:'Efectivo',pagado:'Pagado',al_final:'Paga después de recibir la guía',plin:'Plin',tarjeta:'Tarjeta',transferencia:'Transferencia'};
const URL_RE=/https?:\/\/\S+/g;
function iconoDe(card,titulo){
const t=titulo.toLowerCase();
if(card.classList.contains('pfInc'))return IC.alerta;
if(card.classList.contains('cancel')||/cancel|anul|rechaz/.test(t))return IC.cancel;
if(/sueldo|jornada|falta/.test(t))return IC.sueldo;
if(/caja|administración te dio|entrega parcial|movimiento/.test(t))return IC.caja;
if(/motorizado asignado|se te asignó|motorizado lleg/.test(t))return IC.moto;
if(/recogió|entregad|listo|confirm/.test(t)&&!card.classList.contains('urgent'))return IC.ok;
if(/pedido|servicio|compra|encomienda|recojo/.test(t))return IC.pedido;
return IC.campana;
}
function filas(texto){
const partes=String(texto||'').split(/\s+·\s+/).map(x=>x.trim()).filter(Boolean);
const out=[];let libres=[];let mapa=null;
partes.forEach((p,i)=>{
const soloUrl=p.replace(URL_RE,'').trim()==='';
if(soloUrl){const u=(p.match(URL_RE)||[])[0];if(u&&out.length&&!out[out.length-1].mapa)out[out.length-1].mapa=u;return}
const limpio=p.replace(URL_RE,'').replace(/\s{2,}/g,' ').trim();
let m;
if((m=limpio.match(/^(recojo|recoger en|recoge en|origen|lugar de compra|compra en)\s*:\s*(.+)$/i)))out.push({ic:IC.recojo,k:/compra/i.test(m[1])?'Compra':'Recojo',v:m[2]});
else if((m=limpio.match(/^(entrega|entregar en|destino|dirección|direccion)\s*:\s*(.+)$/i)))out.push({ic:IC.entrega,k:'Entrega',v:m[2]});
else if((m=limpio.match(/^(cliente|recibe|para)\s*:\s*(.+)$/i)))out.push({ic:IC.cliente,k:'Cliente',v:m[2]});
else if((m=limpio.match(/^(total|monto|cobrar|a cobrar)\s*:?\s*(S\/\s*[\d.,]+.*)$/i))||(m=limpio.match(/^()(S\/\s*[\d.,]+.*)$/)))out.push({ic:IC.monto,k:'Monto',v:m[2],fuerte:true});
else if(PAGO[limpio.toLowerCase()])out.push({ic:IC.pago,k:'Pago',v:PAGO[limpio.toLowerCase()]});
else if((m=limpio.match(/^(pago|paga con|método|metodo)\s*:\s*(.+)$/i)))out.push({ic:IC.pago,k:'Pago',v:PAGO[m[2].toLowerCase()]||m[2]});
else if(/^\d+\s*[×x]\s/.test(limpio)||/,\s*\d+\s*[×x]\s/.test(limpio))out.push({ic:IC.lista,k:'Pedido',v:limpio});
else if(i===0&&partes.length>1&&limpio.length<=60&&!/[.:!?]$/.test(limpio))out.push({ic:IC.cliente,k:'Cliente',v:limpio});
else if((m=limpio.match(/^([A-Za-zÁÉÍÓÚáéíóúñÑ ]{3,18})\s*:\s*(.+)$/)))out.push({ic:IC.nota,k:m[1],v:m[2]});
else libres.push(limpio);
});
return {out,libres};
}
function cuerpo(texto){
const {out,libres}=filas(texto);
if(!out.length)return libres.length?'<div class="pdavNota">'+E(libres.join(' · '))+'</div>':'';
return out.map(f=>'<div class="pdavFila">'+f.ic+'<small>'+E(f.k)+'</small><b class="'+(f.fuerte?'fuerte':'')+'">'+E(f.v)+(f.mapa?' · <a href="'+E(f.mapa)+'" target="_blank" rel="noopener">Ver mapa</a>':'')+'</b></div>').join('')+
(libres.length?'<div class="pdavFila">'+IC.nota+'<small>Nota</small><b>'+E(libres.join(' · '))+'</b></div>':'');
}
function formatearPdA(c){
const tx=c.querySelector('.pdAText');const tit=c.querySelector('.pdATitle');const ico=c.querySelector('.pdAIcon');
const firma=(tit?tit.textContent:'')+'|'+(tx?tx.textContent:'');if(c.dataset.pdav===firma)return;
c.dataset.pdav=firma;c.classList.add('pdav');
if(ico)ico.innerHTML=iconoDe(c,tit?tit.textContent:'');
let b=c.querySelector(':scope > .pdavBody');if(!b){b=document.createElement('div');b.className='pdavBody';(tx||tit).insertAdjacentElement('afterend',b)}
b.innerHTML=cuerpo(tx?tx.textContent:'');b.hidden=!b.innerHTML;
}
function formatearInc(c){
if(c.querySelector(':scope > .pdavBody'))return;
const sp=[...c.children].filter(x=>x.tagName==='SPAN');const tEl=sp[0],dEl=sp[1];const hora=c.querySelector(':scope > small');
const titulo=tEl?(tEl.querySelector('b')?.textContent||tEl.textContent):'Problema en un pedido';
const moto=tEl?tEl.textContent.replace(titulo,'').replace(/^\s*·\s*/,'').trim():'';
c.classList.add('pdav','urgent');
const ic=document.createElement('span');ic.className='pdAIcon';ic.innerHTML=IC.alerta;
const t=document.createElement('span');t.className='pdATitle';t.innerHTML=E(titulo)+(hora?'<small>'+E(hora.textContent)+'</small>':'');
const b=document.createElement('div');b.className='pdavBody';
b.innerHTML=(moto?'<div class="pdavFila">'+IC.moto+'<small>Motorizado</small><b>'+E(moto)+'</b></div>':'')+(dEl?'<div class="pdavFila">'+IC.nota+'<small>Problema</small><b>'+E(dEl.textContent)+'</b></div>':'');
c.prepend(ic,t);const row=c.querySelector('.pfIncRow');row?c.insertBefore(b,row):c.appendChild(b);
}
function todo(){
document.querySelectorAll('#pdxAlerts .pdA,#pdAlerts .pdA').forEach(c=>{try{formatearPdA(c)}catch(e){}});
document.querySelectorAll('#pfIncStack .pfInc').forEach(c=>{try{formatearInc(c)}catch(e){}});
}
let q=false;const pronto=()=>{if(q)return;q=true;queueMicrotask(()=>{q=false;todo()})};
new MutationObserver(m=>{if(m.some(x=>{const n=x.target;return n.nodeType===1&&(n.closest('#pdxAlerts,#pdAlerts,#pfIncStack')||[...x.addedNodes].some(a=>a.nodeType===1&&(a.matches('#pdxAlerts,#pdAlerts,#pfIncStack,.pdA,.pfInc')||a.querySelector&&a.querySelector('.pdA,.pfInc'))))}))pronto()}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
setInterval(todo,1500);todo();
window.pdAvisosFormato={filas,cuerpo};
})();
}catch(e){console.error("[pidemas-avisos-diseno-js]",e)}

/* ===== pidemas-seguimiento-admin ===== */
try{
(function(){
function motoDe(o){try{return (typeof allMotos!=='undefined'&&Array.isArray(allMotos)?allMotos:[]).find(function(m){return String(m.id)===String(o.motorizado_id)})||null}catch(e){return null}}
function negDe(o){try{var m=window.adminRestaurantsById;return m&&m.get?m.get(String(o.negocio_id)):null}catch(e){return null}}
window.pdSeguimiento.configurar({
pedido:function(id){return (Array.isArray(window.allOrders)?window.allOrders:[]).find(function(o){return String(o.id)===String(id)})},
motoNombre:function(o){var m=motoDe(o);return m?(m.nombre_completo||m.nombre||''):''},
motoTel:function(o){var m=motoDe(o);return m?(m.telefono||''):''},
negocioNombre:function(o){var n=negDe(o);return n?(n.nombre||n.nombre_negocio||''):''},
negocioTel:function(o){var n=negDe(o);return n?(n.telefono||n.whatsapp||''):''}
});
window.addEventListener('click',function(e){
var b=e.target.closest&&e.target.closest('.adminTrackingOpenBtn,.pdRouteTrack');if(!b)return;
var id=b.getAttribute('data-tracking-order');
if(!id){var c=b.closest('[data-order-id]');id=c&&c.getAttribute('data-order-id')}
if(!id)return;
e.preventDefault();e.stopImmediatePropagation();window.pdSeguimiento.abrir(id);
},true);
})();
}catch(e){console.error("[pidemas-seguimiento-admin]",e)}

