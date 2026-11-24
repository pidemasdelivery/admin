
/* ===== antes admin.js ===== */
/* Pidemás · Administrador · admin.js
   Herramientas del administrador: negocios, motorizados, clientes, agencias, cajas, sueldos, GPS, descuentos, horario y menú. */

/* ===== pd-sueldo-calc ===== */
try{
window.PdSueldo=window.PdSueldo||(function(){
const BASE=25.625,GAS=8,GAS_CAP=24,HOURS=5,SBM=1230,DAY8=SBM/30;
const FIXED_FROM='2026-10-16',GAS_Q=12,DESC_FROM='2026-10-16';
const HOLIDAYS=new Set(['2026-01-01','2026-04-02','2026-04-03','2026-05-01','2026-06-07','2026-06-29','2026-07-23','2026-07-28','2026-07-29','2026-08-06','2026-08-30','2026-10-08','2026-11-01','2026-12-08','2026-12-09','2026-12-25',
'2027-01-01','2027-03-25','2027-03-26','2027-05-01','2027-06-07','2027-06-29','2027-07-23','2027-07-28','2027-07-29','2027-08-06','2027-08-30','2027-10-08','2027-11-01','2027-12-08','2027-12-09','2027-12-25']);
const KEYS=['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
const LABEL={domingo:'Domingo',lunes:'Lunes',martes:'Martes',miercoles:'Miércoles',jueves:'Jueves',viernes:'Viernes',sabado:'Sábado'};
const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parse=s=>new Date(String(s).slice(0,10)+'T12:00:00');
const norm=v=>String(v||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim();
const r2=n=>Math.round(n*100)/100;
const rHalfDown=n=>Math.ceil(Math.round(n*1e6)/1e4-0.5)/100;
function limaNow(){
const p={};new Intl.DateTimeFormat('en-US',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date()).forEach(x=>{if(x.type!=='literal')p[x.type]=x.value});
return new Date(+p.year,+p.month-1,+p.day,(+p.hour)%24,+p.minute,0);
}
const todayIso=()=>iso(limaNow());
function parseDays(raw){
let arr=raw;
if(typeof raw==='string'){try{arr=JSON.parse(raw)}catch(e){arr=raw.split(/[,;|]/)}}
return Array.isArray(arr)?arr.map(norm).filter(k=>KEYS.includes(k)):[];
}
function parseTimes(h){
const out=[...String(h||'').matchAll(/(\d{1,2}):(\d{2})\s*([ap])?\.?\s*m?\.?/gi)].map(m=>{let hh=+m[1];const ap=(m[3]||'').toLowerCase();if(ap==='p'&&hh<12)hh+=12;if(ap==='a'&&hh===12)hh=0;return hh*60+(+m[2])});
return out.length>=2?{start:out[0],end:out[1]}:null;
}
const fmtTime=min=>{const h=Math.floor(min/60),m=min%60;return (h%12||12)+(m?':'+pad(m):'')+' '+(h>=12?'p. m.':'a. m.')};
const atTime=min=>((Math.floor(min/60)%12||12)===1?'a la ':'a las ')+fmtTime(min);
function periodOf(dateIso){
const d=parse(dateIso),y=d.getFullYear(),m=d.getMonth(),first=d.getDate()<=15;
const s=new Date(y,m,first?1:16,12),e=new Date(y,m,first?15:new Date(y,m+1,0).getDate(),12);
return {start:iso(s),end:iso(e),key:iso(s)+'_'+iso(e),label:(first?'1.ª':'2.ª')+' quincena de '+s.toLocaleDateString('es-PE',{month:'long',year:'numeric'})};
}
const isHourly=m=>norm(m&&m.tipo_sueldo).replace(/\s+/g,'_')==='por_horas';
function hourly(h){h=Math.max(0,Number(h)||0);return {sueldo:r2(BASE*h/HOURS),gas:r2(GAS*h/HOURS),sunday:false}}
function shift(r){
const d=String(r.descripcion||'');
let h=Number(r.horas);if(!Number.isFinite(h)||r.horas==null){const m=d.match(/(\d+(?:[.,]\d+)?)\s*h\b/i);h=m?Number(m[1].replace(',','.')):0}
let g=Number(r.gasolina);if(!Number.isFinite(g)||r.gasolina==null){const m=d.match(/gasolina\s*S\/\s*(\d+(?:[.,]\d+)?)/i);g=m?Number(m[1].replace(',','.')):hourly(h,r.fecha).gas}
return {horas:h,sueldo:Number(r.monto||0),gas:g};
}
function config(m){
const hourlyMode=isHourly(m);
const hire=m&&m.fecha_ingreso?String(m.fecha_ingreso).slice(0,10):'';
const days=parseDays(m&&m.dias_laborables);
const times=parseTimes(m&&m.horario_trabajo);
const missing=[];
if(!hourlyMode){if(!hire)missing.push('fecha de ingreso');if(!times)missing.push('horario');if(!days.length)missing.push('días laborables')}
return {hire,days,times,hourly:hourlyMode,ok:!missing.length,missing};
}
function baseFor(m){
const t=parseTimes(m&&m.horario_trabajo);
if(!t)return BASE;
const h=t.end>t.start?(t.end-t.start)/60:HOURS;
return DAY8*Math.min(8,Math.max(0,h))/8;
}
function calc(m,rows,now){
now=now||limaNow();
const cfg=config(m);const BASE_D=baseFor(m);
const today=iso(now),nowMin=now.getHours()*60+now.getMinutes();
const cur=periodOf(today);
if(!cfg.ok)return {ok:false,cfg,current:{...cur,days:[],earned:0,paid:0,balance:0},periods:[],today};
const faltas=new Map(),pagos=[],jornadas=[],descs=[],adel=new Map();
(rows||[]).forEach(r=>{const t=norm(r.tipo),f=String(r.fecha||'').slice(0,10);if(t==='falta'&&f&&!faltas.has(f))faltas.set(f,r);else if(t==='pago')pagos.push(r);else if(t==='descuento')descs.push(r);else if(t==='jornada'&&f){if(/^d[ií]a adelantado/i.test(String(r.descripcion||''))){if(!adel.has(f))adel.set(f,r)}else jornadas.push(r)}});
const periods=new Map();const monthGas={};
const getP=k=>{if(!periods.has(k.key))periods.set(k.key,{...k,days:[],shifts:[],worked:0,rest:0,faltas:0,gasDays:0,gasAdj:0,adj:0,hours:0,gasTotal:0,earned:0,paid:0,payments:[],desc:0,descSet:false,descRows:[],needsDesc:k.start.slice(8,10)==='16'&&k.start>=DESC_FROM});return periods.get(k.key)};
getP(cur);
let endMin=null;
if(cfg.hourly){
jornadas.sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha))).forEach(r=>{
const di=String(r.fecha).slice(0,10),P=getP(periodOf(di)),s=shift(r);
P.shifts.push({...s,date:di,row:r});P.worked++;P.hours+=s.horas;P.gasTotal+=s.gas;P.earned+=s.sueldo+s.gas;
});
}else{
endMin=cfg.times.end>cfg.times.start?cfg.times.end:24*60-1;
const startIso=periodOf(cfg.hire).start;
for(let d=parse(startIso);iso(d)<=cur.end;d.setDate(d.getDate()+1)){
const di=iso(d),P=getP(periodOf(di)),key=KEYS[d.getDay()],hol=HOLIDAYS.has(di);
const isWork=cfg.days.includes(key)&&!hol;
const isRest=!isWork&&(d.getDay()===0||hol);
const day={date:di,dow:key,label:LABEL[key],holiday:hol,work:isWork,rest:isRest,status:'',base:0,gas:0};
if(di<cfg.hire){day.status='antes';P.days.push(day);continue}
const passedN=di<today||(di===today&&nowMin>=endMin);const passed=passedN||(adel.has(di)&&di<=cur.end);if(passed&&!passedN){day.adel=adel.get(di)}
if(d.getDate()===31){day.status='dia31';P.days.push(day);continue}
const falta=faltas.get(di);
if(falta&&(isWork||isRest)){day.status='falta';day.falta=falta;if(passed)P.faltas++;}
else if(isWork||isRest){
if(!passed)day.status=di===today?'hoy':'futuro';
else if(isWork){
day.status='trabajado';day.base=BASE_D;P.worked++;
const mo=di.slice(0,7);monthGas[mo]=monthGas[mo]||0;
if(P.start>=FIXED_FROM?(d.getDay()!==0&&P.gasDays<GAS_Q):(d.getDay()!==0&&monthGas[mo]<GAS_CAP)){day.gas=GAS;monthGas[mo]++;P.gasDays++;}
}else{day.status='descanso';day.base=BASE_D;P.rest++;}
}else day.status='libre';
P.earned+=day.base+day.gas;P.days.push(day);
const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
if(d.getDate()===last&&last<30){
for(let n=last+1;n<=30;n++){
const vd=(d.getDay()+(n-last))%7;
const adj={date:di,adjDay:n,dow:KEYS[vd],label:'Día '+n,status:passed?'ajuste':'ajusteFuturo',base:0,gas:0,work:false,rest:false,sunday:vd===0};
if(passed){adj.base=BASE_D;adj.gas=vd===0||(P.start>=FIXED_FROM&&P.gasDays>=GAS_Q)?0:GAS;P.adj++;if(adj.gas)P.gasDays++;P.earned+=adj.base+adj.gas}
P.days.push(adj);
}
}
if(P.start>=FIXED_FROM&&P.start>=cfg.hire&&passed&&(d.getDate()===15||d.getDate()===Math.min(last,30))){
const unpaid=Math.max(0,15-(P.worked+P.rest+P.adj));
const target=Math.max(0,GAS_Q-unpaid),delta=target-P.gasDays;
if(delta){P.gasAdj=delta*GAS;P.earned+=P.gasAdj;P.gasDays=target}
}
}
}
const list=[...periods.values()];
pagos.forEach(r=>{const k=String(r.periodo||'');let P=periods.get(k);if(!P){const f=String(r.fecha||'').slice(0,10);P=f?getP(periodOf(f)):null}if(!P)P=periods.get(cur.key);if(P){P.paid+=Number(r.monto||0);P.payments.push(r)}});
descs.forEach(r=>{const k=String(r.periodo||'');let P=periods.get(k);if(!P){const f=String(r.fecha||'').slice(0,10);P=f?getP(periodOf(f)):null}if(!P)P=periods.get(cur.key);if(P){P.desc+=Number(r.monto||0);if(/AFP|ONP/i.test(String(r.descripcion||'')))P.descSet=true;P.descRows.push(r)}});
const all=[...periods.values()];
all.forEach(P=>{P.earned=P.start.slice(8,10)==='16'?rHalfDown(P.earned):r2(P.earned);P.hours=r2(P.hours);P.gasTotal=r2(P.gasTotal);P.desc=r2(P.desc);P.balance=r2(P.earned-P.desc-P.paid);P.isCurrent=P.key===cur.key});
all.sort((a,b)=>b.start.localeCompare(a.start));
const current=periods.get(cur.key);
const previousDue=all.filter(P=>!P.isCurrent&&P.balance>0.004).reduce((s,P)=>s+P.balance,0);
return {ok:true,cfg,hourly:cfg.hourly,endMin,endLabel:endMin!=null?fmtTime(endMin):'',endAt:endMin!=null?atTime(endMin):'',today,current,periods:all,previousDue:r2(previousDue)};
}
return {BASE,baseFor,SBM,DAY8,GAS,GAS_CAP,GAS_Q,FIXED_FROM,HOURS,KEYS,LABEL,calc,config,periodOf,limaNow,todayIso,parseTimes,fmtTime,atTime,iso,parse,hourly,shift,isHourly};
})();
}catch(e){console.error("[pd-sueldo-calc]",e)}

/* ===== pidemas-admin-calificaciones ===== */
try{
(function(){
const cache=new Map();let lastFetch=0,loading=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stars=n=>n?'★'.repeat(n)+'☆'.repeat(5-n):'—';
function paint(){
document.querySelectorAll('#orderList [data-order-id]').forEach(row=>{
if(!row.classList.contains('adminOrderCard'))return;
const c=cache.get(String(row.getAttribute('data-order-id')));
row.querySelector('.pdRateAdmin')?.remove();
if(!c)return;
const box=`<div class="pdRateAdmin"><span class="k">Calificación del cliente</span>${c.estrellas_negocio?`<div class="l"><span>Negocio</span><span class="s">${stars(c.estrellas_negocio)}</span></div>`:''}${c.estrellas_motorizado?`<div class="l"><span>Motorizado</span><span class="s">${stars(c.estrellas_motorizado)}</span></div>`:''}${c.comentario?`<div class="c">“${esc(c.comentario)}”</div>`:''}</div>`;
const pay=row.querySelector('.pdRoutePay');
if(pay)pay.insertAdjacentHTML('beforebegin',box);
});
}
async function load(){
if(loading||!window.db)return;
const ids=[...document.querySelectorAll('#orderList .adminOrderCard[data-order-id]')].map(r=>r.getAttribute('data-order-id')).filter(Boolean);
if(!ids.length)return;
if(Date.now()-lastFetch<60000&&ids.every(id=>cache.has(id)||cache.has('none:'+id))){paint();return}
loading=true;
try{
const {data,error}=await window.db.from('calificaciones').select('pedido_id,estrellas_negocio,estrellas_motorizado,comentario').in('pedido_id',ids.slice(0,300));
if(!error&&Array.isArray(data)){
ids.forEach(id=>cache.set('none:'+id,true));
data.forEach(x=>cache.set(String(x.pedido_id),x));
lastFetch=Date.now();
}
}catch(e){}
loading=false;paint();
}
if(typeof window.renderOrders==='function'){
const _ro=window.renderOrders;
window.renderOrders=function(){const out=_ro.apply(this,arguments);try{paint();setTimeout(load,50)}catch(e){}return out};
}
})();
}catch(e){console.error("[pidemas-admin-calificaciones]",e)}

/* ===== pd-caja-lib ===== */
try{
window.PdCaja=window.PdCaja||(function(){
const RX_ADMIN=/^INGRESO DE ADMINISTRADOR\s*[·:—-]?\s*/i;
const RX_MANUAL=/^INGRESO MANUAL DE CAJA\s*[·:—-]?\s*/i;
const RX_PAY=/^PAGO DE (ENCOMIENDA|COMPRA)\s*[·:—-]?\s*/i;
const RX_LIQ=/LIQUIDACI[ÓO]N DE CAJA/i,RX_RESET=/REINICIO DE CAJA/i,RX_PART=/^ENTREGA PARCIAL DE CAJA\s*[·:—-]?\s*/i,RX_TOADMIN=/entregu[eé] al administrador/i;
const time=m=>{const t=new Date(m&&m.creado_en).getTime();return Number.isFinite(t)?t:0};
const r2=n=>Math.round((Number(n)||0)*100)/100;
function amount(m){
let a=Number(m&&m.monto||0);
if(m&&m.tipo==='ingreso'&&m.pedido_id&&a===0){const x=String(m.descripcion||'').match(/recibido\s*S\/?\.?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i);if(x){a=Number(x[1].replace(',','.'))||0;const t=String(m.descripcion||'').match(/total(?:\s+pedido)?\s*S\/?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i);const tot=t?Number(t[1].replace(',','.')):0;if(tot>0)a=Math.min(a,tot)}}
return r2(a);
}
const isBoundary=m=>!!m&&((m.tipo==='retiro'&&RX_LIQ.test(String(m.descripcion||'')))||RX_RESET.test(String(m.descripcion||'')));
function kind(m){
const d=String(m.descripcion||'').trim();
if(m.tipo==='ingreso'){
if(RX_ADMIN.test(d)||(RX_MANUAL.test(d)&&/de administrador/i.test(d)))return 'fondo';
if(m.pedido_id||/COBRO DE PEDIDO/i.test(d))return 'cobro_pedido';
return 'cobro';
}
if(RX_LIQ.test(d))return 'liquidacion';
if(RX_RESET.test(d))return 'reinicio';
if(RX_PART.test(d)||RX_TOADMIN.test(d))return 'entrega';
if(RX_PAY.test(d))return 'pago';
return 'gasto';
}
const LABEL={fondo:'Efectivo de administración',cobro_pedido:'Cobro de pedido',cobro:'Cobro',liquidacion:'Entrega total de caja',reinicio:'Reinicio de caja',entrega:'Entrega parcial',pago:'Pago',gasto:'Gasto'};
function clean(m){
const raw=String(m.descripcion||'').trim(),pay=raw.match(RX_PAY);
if(pay){const rest=raw.replace(RX_PAY,'').trim();return (pay[1].toLowerCase()==='compra'?'Compra':'Encomienda')+(rest?' · '+rest:'')}
const d=raw
.replace(/^(INGRESO MANUAL DE CAJA|INGRESO DE ADMINISTRADOR|GASTO MANUAL|COBRO DE PEDIDO|LIQUIDACI[ÓO]N DE CAJA|REINICIO DE CAJA|ENTREGA PARCIAL DE CAJA)\s*[·:—-]?\s*/i,'').trim();
return d||LABEL[kind(m)];
}
function split(movs){
const list=(Array.isArray(movs)?movs:[]).filter(m=>m&&time(m)).slice()
.sort((a,b)=>time(a)-time(b)||(isBoundary(b)?1:0)-(isBoundary(a)?1:0));
const closed=[];let cur=[];
for(const m of list){if(isBoundary(m)){closed.push({closer:m,movs:cur});cur=[]}else cur.push(m)}
const desc=a=>a.slice().sort((x,y)=>time(y)-time(x));
return {current:desc(cur),closed:closed.reverse().map(c=>({closer:c.closer,movs:desc(c.movs),summary:summary(c.movs)})),openedAt:closed.length?closed[closed.length-1].closer.creado_en:null};
}
function summary(movs){
const s={cobros:0,fondos:0,pagos:0,gastos:0,entregas:0,ingresos:0,retiros:0,count:0};
(movs||[]).forEach(m=>{if(isBoundary(m))return;const a=amount(m),k=kind(m);s.count++;
if(m.tipo==='ingreso'){s.ingresos+=a;if(k==='fondo')s.fondos+=a;else s.cobros+=a}
else{s.retiros+=a;if(k==='pago')s.pagos+=a;else if(k==='entrega')s.entregas+=a;else s.gastos+=a}});
Object.keys(s).forEach(k=>{if(k!=='count')s[k]=r2(s[k])});
s.balance=r2(s.ingresos-s.retiros);
return s;
}
function balance(movs){return summary(split(movs).current).balance}
function cycleWithAmounts(movs){return split(movs).current.map(m=>Object.assign({},m,{monto:amount(m)}))}
return {amount,kind,LABEL,clean,split,summary,balance,isBoundary,cycleWithAmounts,r2};
})();
}catch(e){console.error("[pd-caja-lib]",e)}
try{(function(){const C=window.PdCaja;if(!C||C.vueltoTag)return;const RX=/\s*·\s*VUELTO (DE CAJA|CON DINERO PROPIO)/i;const c0=C.clean;
C.clean=function(m){return String(c0.call(this,m)||'').replace(RX,'')};
C.vueltoTag=function(m){const x=String((m&&m.descripcion)||'').match(RX);if(!x)return '';return /CAJA/i.test(x[1])?'<span class="pdcjVu caja">Vuelto de su caja</span>':'<span class="pdcjVu">Vuelto de su bolsillo</span>'};})()}catch(e){}
try{(function(){const C=window.PdCaja;if(!C||C.extra)return;
const a0=C.amount;C.amount=function(m){if(m&&m.tipo==='retiro'&&m.revision==='rechazado')return 0;return a0.call(this,m)};
const s0=C.summary;C.summary=function(movs){return s0.call(this,(movs||[]).map(m=>m&&m.tipo==='retiro'&&m.revision==='rechazado'?Object.assign({},m,{monto:0}):m))};C.balance=function(movs){return C.summary(C.split(movs).current).balance};C.cycleWithAmounts=function(movs){return C.split(movs).current.map(m=>Object.assign({},m,{monto:C.amount(m)}))};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
C.revTag=function(m){if(!m||m.tipo!=='retiro'||!m.revision)return '';return m.revision==='aprobado'?'<span class="pdcjRev ok">Aprobado</span>':m.revision==='rechazado'?'<span class="pdcjRev bad">Rechazado · no se descuenta</span>':'<span class="pdcjRev pend">Por revisar</span>'};
/* modo: 'moto' (puede adjuntar foto) o 'admin' (puede aprobar o rechazar) */
C.extra=function(m,modo,editado){let h='';
  if(m.revision==='rechazado'&&m.revision_nota)h+='<em class="pdcjNota">Motivo: '+esc(m.revision_nota)+'</em>';
  const acts=[];
  if(m.comprobante_url)acts.push('<a class="pdcjAct" href="'+esc(m.comprobante_url)+'" target="_blank" rel="noopener">Ver comprobante</a>');
  else if(m.tipo==='retiro'&&m.revision&&m.revision!=='aprobado')acts.push(modo==='moto'?'<button type="button" class="pdcjAct fuerte" data-adj="'+esc(m.id)+'">Adjuntar foto</button>':'<span class="pdcjAct gris">Sin comprobante</span>');
  if(modo==='moto'&&m.comprobante_url&&m.revision==='rechazado')acts.push('<button type="button" class="pdcjAct" data-adj="'+esc(m.id)+'">Cambiar foto</button>');
  if(modo==='admin'&&m.tipo==='retiro'&&m.revision==='pendiente'){acts.push('<button type="button" class="pdcjAct ok" data-aprobar="'+esc(m.id)+'">Aprobar</button>');acts.push('<button type="button" class="pdcjAct bad" data-rechazar="'+esc(m.id)+'">Rechazar</button>')}
  if(modo==='admin'&&m.tipo==='retiro'&&m.revision&&m.revision!=='pendiente')acts.push('<button type="button" class="pdcjAct" data-revertir="'+esc(m.id)+'">Volver a revisar</button>');
  if(editado)acts.push('<button type="button" class="pdcjAct edit" data-hist="'+esc(m.id)+'">Editado · ver cambios</button>');
  if(acts.length)h+='<span class="pdcjActs">'+acts.join('')+'</span>';
  return h};
})()}catch(e){}



/* ===== pidemas-horario-motor ===== */
try{
(function(){
if(window.pdHorario)return;
const RUTA='config/horario.json',BUCKET='restaurantes';
const DIAS=['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
const NOM={lunes:'Lunes',martes:'Martes',miercoles:'Miércoles',jueves:'Jueves',viernes:'Viernes',sabado:'Sábado',domingo:'Domingo'};
const BASE={dias:{},cerrados:[],aviso_min:30,actualizado:null};
DIAS.forEach(d=>{BASE.dias[d]={activo:d!=='domingo',abre:'09:00',ultimo:'21:30'}});
const clon=o=>JSON.parse(JSON.stringify(o));
const mezclar=c=>{const r=clon(BASE);if(!c||typeof c!=='object')return r;DIAS.forEach(d=>{if(c.dias&&c.dias[d])r.dias[d]=Object.assign(r.dias[d],c.dias[d])});if(Array.isArray(c.cerrados))r.cerrados=c.cerrados.filter(Boolean);if(Number(c.aviso_min)>=0)r.aviso_min=Number(c.aviso_min);r.actualizado=c.actualizado||null;return r};
let cfg=clon(BASE);try{const c=JSON.parse(localStorage.getItem('pd_horario_cfg')||'null');if(c)cfg=mezclar(c)}catch(e){}
const cli=()=>{try{return sb}catch(e){}try{return db}catch(e){}return window.db||window.sb||null};
const aMin=h=>{const m=String(h||'').match(/(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):null};
const hora=m=>{m=((m%1440)+1440)%1440;const h=Math.floor(m/60),mi=m%60,ap=h>=12?'p. m.':'a. m.',h12=h%12||12;return h12+':'+String(mi).padStart(2,'0')+' '+ap};
function limaHoy(){try{return getLimaNow()}catch(e){}const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());const v={};p.forEach(x=>v[x.type]=x.value);return new Date(+v.year,+v.month-1,+v.day,+v.hour%24,+v.minute)}
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function delDia(fecha){
const d=fecha||limaHoy();const k=DIAS[d.getDay()];const c=cfg.dias[k];
if(!c||c.activo===false)return false;
if((cfg.cerrados||[]).includes(iso(d)))return false;
const a=aMin(c.abre),u=aMin(c.ultimo);if(a==null||u==null||u<=a)return false;
return {abre:a,ultimo:u};
}
function proxima(){
const n=limaHoy(),cur=n.getHours()*60+n.getMinutes();
for(let i=0;i<=14;i++){const f=new Date(n);f.setDate(n.getDate()+i);const h=delDia(f);if(!h)continue;if(i===0&&cur>=h.abre)continue;
const cuando=i===0?'hoy':i===1?'mañana':'el '+['domingo','lunes','martes','miércoles','jueves','viernes','sábado'][f.getDay()];return {cuando,hora:hora(h.abre)}}
return null;
}
let ctx=null;
function instalar(){
const H=window.PD_HORARIO;if(!H||H.__pd||typeof window.showRestaurant!=='function')return;
const val=k=>{const h=delDia(ctx||limaHoy());if(!h)return 0;if(k==='abre')return h.abre;if(k==='ultimo')return h.ultimo;if(k==='cierra')return h.ultimo+30;if(k==='aviso')return Math.max(h.abre,h.ultimo-(Number(cfg.aviso_min)||30));return 0};
Object.defineProperty(H,'abre',{get:()=>val('abre'),configurable:true});
Object.defineProperty(H,'ultimoPedido',{get:()=>val('ultimo'),configurable:true});
Object.defineProperty(H,'cierra',{get:()=>val('cierra'),configurable:true});
Object.defineProperty(H,'aviso',{get:()=>val('aviso'),configurable:true});
Object.defineProperty(H,'__pd',{value:true});
const g=window.getDailySchedule;
if(typeof g==='function'){
window.getDailySchedule=function(h,date){const f=date||limaHoy();if(!delDia(f))return null;const prev=ctx;ctx=f;try{return g.apply(this,arguments)}finally{ctx=prev}};
}
}
window.pdHoraTxt=hora;
window.pdHorarioDia=delDia;
window.pdHorarioMsgCerrado=function(){
const h=delDia(),p=proxima();
if(!h)return 'Hoy Pidemás no atiende.'+(p?' Vuelve '+p.cuando+' desde las '+p.hora:'');
return 'Pidemás recibe pedidos hoy de '+hora(h.abre)+' a '+hora(h.ultimo)+(p&&p.cuando!=='hoy'?' Vuelve '+p.cuando+' desde las '+p.hora:p?' Abrimos a las '+p.hora:'');
};
window.pdHorarioBarraCerrado=function(){
const h=delDia(),p=proxima();
if(!h)return 'Hoy no atendemos'+(p?' · abrimos '+p.cuando+' '+p.hora:'');
return 'Cerrado · pedidos de '+hora(h.abre)+' a '+hora(h.ultimo)+(p&&p.cuando!=='hoy'?' · abrimos '+p.cuando+' '+p.hora:'');
};
window.pdHorarioSemana=function(){return ['lunes','martes','miercoles','jueves','viernes','sabado','domingo'].map(k=>{const c=cfg.dias[k];return {dia:NOM[k],activo:c.activo!==false,abre:c.abre,ultimo:c.ultimo}})};
async function cargar(){
const c=cli();if(!c||!c.storage)return cfg;
try{const u=c.storage.from(BUCKET).getPublicUrl(RUTA).data.publicUrl;const r=await fetch(u+'?t='+Date.now(),{cache:'no-store'});if(r.ok){cfg=mezclar(await r.json());try{localStorage.setItem('pd_horario_cfg',JSON.stringify(cfg))}catch(e){}}}catch(e){}
try{if(typeof refreshRestaurantStatuses==='function')refreshRestaurantStatuses()}catch(e){}
try{if(typeof renderRestaurants==='function')renderRestaurants()}catch(e){}
return cfg;
}
async function guardar(nuevo){
const c=cli();if(!c||!c.storage)throw new Error('No hay conexión con Supabase.');
const datos=mezclar(nuevo);datos.actualizado=new Date().toISOString();
const {error}=await c.storage.from(BUCKET).upload(RUTA,new Blob([JSON.stringify(datos,null,2)],{type:'application/json'}),{upsert:true,contentType:'application/json',cacheControl:'0'});
if(error)throw error;cfg=datos;try{localStorage.setItem('pd_horario_cfg',JSON.stringify(cfg))}catch(e){}return cfg;
}
window.pdHorario={cargar,guardar,delDia,proxima,DIAS,NOM,get config(){return clon(cfg)},porDefecto:()=>clon(BASE)};
instalar();
setTimeout(()=>{instalar();cargar()},200);
})();
}catch(e){console.error("[pidemas-horario-motor]",e)}

/* ===== pidemas-boton-atras ===== */
try{
(function(){
if(window.__pdAtras)return;window.__pdAtras=true;
const CIERRES='.pdCerrarX,[data-a="x"],[data-a="cerrar"],[data-close],.m-x,.h-x,.phX,.pdtX,.x,.close,.pcX,[aria-label^="Cerrar"],[aria-label^="Volver"]';
const IGNORAR='header,nav,#nav,.bottom,#horarioAlert,#pdAvisoMoto,#toast,.toast,#pdxAlerts,.x-alert,#pdHorarioBar,#pcaBar,#pdCartaCartBar';
const visible=el=>{if(!el||!el.isConnected)return false;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0};
function abiertas(){
const W=innerWidth,H=innerHeight,out=[];
document.querySelectorAll('body *').forEach(el=>{
if(el.closest(IGNORAR))return;
const cs=getComputedStyle(el);if(cs.position!=='fixed')return;if(cs.pointerEvents==='none'){const sr=el.shadowRoot;if(!sr)return;/* capa transparente (p. ej. la de ventanas): solo cuenta si muestra algo */if(![...sr.querySelectorAll('*')].some(c=>{const s=getComputedStyle(c);if(s.pointerEvents==='none'||s.display==='none'||s.visibility==='hidden')return false;const q=c.getBoundingClientRect();return q.width*q.height>W*H*0.2}))return}
if(!visible(el))return;const r=el.getBoundingClientRect();
const area=Math.max(0,Math.min(r.right,W)-Math.max(r.left,0))*Math.max(0,Math.min(r.bottom,H)-Math.max(r.top,0));
if(area<W*H*0.45)return;
if(out.some(o=>o.contains(el)))return;
for(let i=out.length-1;i>=0;i--)if(el.contains(out[i]))out.splice(i,1);
out.push(el);
});
const extra=typeof window.pdAtrasExtra==='function'?(window.pdAtrasExtra()||0):0;
return {lista:out,nivel:out.length+extra,extra};
}
const z=el=>{let n=0,x=el;while(x&&x!==document.body){const v=parseInt(getComputedStyle(x).zIndex,10);if(!isNaN(v))n=Math.max(n,v);x=x.parentElement}return n};
function cerrarArriba(){
const {lista,extra}=abiertas();
if(!lista.length){if(extra&&typeof window.pdAtrasVolver==='function'){window.pdAtrasVolver();return true}return false}
const ultima=pila.slice().reverse().find(el=>lista.includes(el));
const orden=lista.slice().sort((a,b)=>z(b)-z(a)||(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING?1:-1));
const top=ultima||orden[0];
const btn=[...top.querySelectorAll(CIERRES)].find(b=>visible(b)&&!b.disabled)||[...top.querySelectorAll('button')].find(b=>visible(b)&&/^[×✕✖]$/.test(b.textContent.trim()));
if(btn){btn.click();return true}
if(top.tagName==='BUTTON'){top.click();return true}
document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
setTimeout(()=>{if(top.isConnected&&visible(top)){if('hidden' in top)top.hidden=true}},120);
return true;
}
let puestos=0,ignorar=0,pila=[];
try{history.replaceState(Object.assign({},history.state||{},{pdBase:true}),'')}catch(e){}
function sync(ya){
const ab=abiertas(),n=ab.nivel;
pila=pila.filter(el=>ab.lista.includes(el));ab.lista.forEach(el=>{if(!pila.includes(el))pila.push(el)});
if(n>puestos){for(let i=puestos;i<n;i++){try{history.pushState({pdNivel:i+1},'')}catch(e){}}puestos=n}
else if(n<puestos){
clearTimeout(sync.t);const bajar=()=>{const m=abiertas().nivel;if(m<puestos){const d=puestos-m;puestos=m;ignorar++;try{history.go(-d)}catch(e){ignorar--}}};if(ya)bajar();else sync.t=setTimeout(bajar,600);
}
}
addEventListener('popstate',()=>{
/* este «atrás» lo usó una ventana (mapa, selector…): las páginas de la app no deben moverse */
    if(ignorar>0){ignorar--;window.__pdPopPropio=true;setTimeout(()=>{window.__pdPopPropio=false},0);return}
if(puestos>0){puestos--;window.__pdPopPropio=true;setTimeout(()=>{window.__pdPopPropio=false},0);const antes=abiertas().nivel;cerrarArriba();
setTimeout(()=>{const ahora=abiertas().nivel;if(ahora>=antes&&ahora>0){try{history.pushState({pdNivel:puestos+1},'')}catch(e){}puestos++}else sync(true)},350)}
});
let t=null;const prog=()=>{clearTimeout(t);t=setTimeout(sync,150)};
new MutationObserver(prog).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','style','open']});
setInterval(sync,1500);
window.pdAtrasDebug=()=>({puestos,nivel:abiertas().nivel,lista:abiertas().lista.map(e=>e.id||e.className)});
})();
}catch(e){console.error("[pidemas-boton-atras]",e)}

/* ===== pidemas-inicio-pedidos-js ===== */
try{
/* Inicio = la lista de pedidos (sin el resumen), y menú lateral liviano. */
(function(){
  const $=id=>document.getElementById(id);
  /* --- Inicio: deja visible solo la lista de pedidos; el resumen se oculta pero sus ventanas (perfil, horario) siguen funcionando --- */
  function inicio(){
    const home=$('tab-restaurantes');if(!home)return;
    {const me=$('pdhMe'),hd=document.querySelector('header.top');if(me&&hd&&me.closest('#tab-restaurantes')){const bl=$('pdaBell');bl&&bl.parentNode===hd?hd.insertBefore(me,bl):hd.appendChild(me)}}
    home.classList.add('pdInicioOff');
    /* resto de tarjeta vacía: el borde/fondo de .card se volvía a pintar; en línea con !important no hay regla que lo gane */
    [['border','0'],['background','transparent'],['box-shadow','none'],['height','0'],['min-height','0'],['padding','0'],['margin-top','0'],['margin-bottom','-18px'],['overflow','visible']].forEach(([k,v])=>home.style.setProperty(k,v,'important'));
    const keep=new Set();
    home.querySelectorAll('.h-sheet,[role="dialog"],#pdhSheet').forEach(el=>{let a=el;while(a&&a!==home){keep.add(a);a=a.parentElement}});
    const walk=p=>{[...p.children].forEach(c=>{if(keep.has(c)){if(c.matches('.h-sheet,[role="dialog"],#pdhSheet'))return;c.classList.add('pdCadena');walk(c)}else if(!c.classList.contains('pdFueraInicio'))c.classList.add('pdFueraInicio')})};
    walk(home);
  }
  /* Pedidos en el Inicio: la lista va debajo de la tarjeta de información (#pdInicioTop > .pdSal) y siempre visible ahí */
  let obsPed=null;
  function pedidosEnInicio(){
    const t=$('tab-pedidos'),top=$('pdInicioTop');if(!t||!top)return;
    const sal=top.querySelector(':scope > .pdSal');if(!sal)return;
    const pm=$('pdmBody');if(pm&&pm.contains(t))return; /* por si otra ventana la tiene prestada */
    if(t.parentNode!==top||sal.nextElementSibling!==t)sal.after(t);
    t.classList.remove('hidden');
    if(!obsPed){obsPed=new MutationObserver(()=>{if(t.parentNode===top&&t.classList.contains('hidden'))t.classList.remove('hidden')});obsPed.observe(t,{attributes:true,attributeFilter:['class']})}
  }
  /* «Pedidos» ya está en el inicio: en vez de abrir una ventana, vuelve arriba */
  function enlazar(){
    return; /* Pedidos ahora abre su ventana (modal) desde el menú */
    const o=window.__pdmOpen;if(typeof o!=='function'||o.__pdIni)return;
    const n=function(k){if(k==='pedidos'){try{window.__pdmClose&&window.__pdmClose()}catch(e){}cerrarFab();const t=$('tab-pedidos');t&&t.scrollIntoView({behavior:'smooth',block:'start'});const r=$('refreshOrders');r&&r.click();return}return o.apply(this,arguments)};
    n.__pdIni=true;n.__pdServ=o.__pdServ;window.__pdmOpen=n;
  }
  /* --- Menú liviano --- */
  const P=d=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+d+'</svg>';
  const IC={
    ped:'<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h4"/>',
    cli:'<circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21 20a6 6 0 0 0-4-5.6"/>',
    neg:'<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v8h14v-8"/>',
    mas:'<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    key:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
    rec:'<path d="M7 7h11l-3-3M17 17H6l3 3"/>',
    com:'<path d="M3 4h2l2 11h11l2-8H7"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
    enc:'<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/>',
    tar:'<path d="M12 3v18M16 7H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H7"/>',
    age:'<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/>',
    gps:'<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    moto:'<circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0M18 8v6M15 11h6"/>',
    ban:'<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
    tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
    qr:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>',
    hor:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    sol:'<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
    cfg:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    out:'<path d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2"/><path d="M9 12h12M18 9l3 3-3 3"/>'
  };
  const abrir=k=>()=>{try{window.__pdmOpen&&window.__pdmOpen(k)}catch(e){console.warn(e)}};
  const tocar=(sel,mostrar)=>()=>{const b=document.querySelector(sel);if(!b)return;if(mostrar)b.hidden=false;b.click()};
  const ITEMS=[
    ['Negocios'],
    ['Control de caja y sueldos'],
    ['yape','Yape por confirmar',()=>{},'','','yape'],
    ['deu','Por cobrar a negocios',()=>{},'','','deu'],
    ['Control de pedidos'],
    ['pneg','Por pagar a negocios',()=>{},'','','pneg'],
    ['Más'],
    ['out','Cerrar sesión',()=>{const b=$('pdaLogout')||$('logout');b&&b.click()},'','out']
  ];
  const PANEL={tienda:IC.com,motorizado:IC.gps,negocios:IC.neg};
  IC.caja='<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2"/><path d="M17 13h.01"/>';
  IC.sueldo='<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>';
  IC.menu='<path d="M4 6h16M4 12h16M4 18h16"/>';
  IC.yape='<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M12 17h.01"/><path d="M9 11l2 2 4-4"/>';
  IC.deu='<path d="M3 9l1.5-5h15L21 9"/><path d="M5 12v8h14v-8"/><path d="M12 13v5M10 15.5h4"/>';
  IC.dev='<path d="M9 14l-4-4 4-4"/><path d="M5 10h10a5 5 0 0 1 0 10h-3"/>';
  IC.res='<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>';
  IC.ale='<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>';
  IC.pla='<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>';
  IC.atn='<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>';
  IC.pneg='<path d="M3 9l1.5-5h15L21 9"/><path d="M5 12v8h14v-8"/><path d="M9 16h6M13 14l2 2-2 2"/>';
  IC.cal='<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>';
  IC.rep='<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>';
  IC.auto='<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>';
  IC.rnk='<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>';
  IC.masv='<path d="M3 11l16-7-5 16-3-7z"/><path d="M11 13l8-9"/>';
  IC.negra='<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>';
  IC.regi='<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/>';
  IC.ctl='<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2"/><path d="M17 13h.01"/>';
  const PRINC=[['Principal'],['ped','Pedidos',abrir('pedidos'),'pedidos'],['caja','Cajas',abrir('caja')],['sueldo','Sueldos',abrir('sueldo')]];
  function cerrarFab(){cerrar()}
  function montar(){
    if($('pdMenu'))return;
    const sh=document.createElement('div');sh.id='pdMenuShade';
    const m=document.createElement('aside');m.id='pdMenu';m.className='m3';m.setAttribute('aria-label','Menú');m.setAttribute('aria-hidden','true');
    m.innerHTML='<nav></nav>';
    const nav=m.querySelector('nav');
    const S=(d,c,z)=>'<svg viewBox="0 0 24 24" aria-hidden="true" style="width:'+(z||20)+'px!important;height:'+(z||20)+'px!important;flex:0 0 '+(z||20)+'px!important;stroke:'+c+'!important">'+d+'</svg>';
    const CH='<path d="M6 9l6 6 6-6"/>';
    const ir=fn=>()=>{cerrar();cerrarTodo();setTimeout(fn,120)};
    /* perfil: foto (o inicial), nombre y "Ver mi perfil" */
    const per=document.createElement('button');per.type='button';per.className='m3Top';per.setAttribute('aria-label','Mi perfil');
    per.innerHTML='<span class="m3Av pdPerfilAv" aria-hidden="true"></span><span class="m3Who pdPerfilTx"><strong>Administrador</strong><small>Ver mi perfil</small></span>'+S('<path d="M9 6l6 6-6 6"/>','#8A7B72',18);
    per.addEventListener('click',ir(()=>{const me=$('pdhMe');if(me)me.click()}));
    nav.appendChild(per);
    /* buscador */
    const bus=document.createElement('label');bus.className='m3Busca';
    bus.innerHTML=S('<circle cx="10" cy="10" r="7"/><path d="M21 21l-6-6"/>','#8A7B72',18)+'<input type="search" id="pdMenuBuscar" placeholder="Buscar en el menú" aria-label="Buscar en el menú" autocomplete="off">';
    nav.appendChild(bus);
    /* principal: tres accesos grandes */
    const tiles=document.createElement('div');tiles.className='m3Tiles';
    PRINC.filter(it=>it.length>1).forEach(it=>{
      const b=document.createElement('button');b.type='button';b.className='m3Tile'+(it[3]==='pedidos'?' m3Main':'');if(it[3])b.dataset.k=it[3];b.dataset.txt=it[1].toLowerCase();
      b.innerHTML=S(IC[it[0]],it[3]==='pedidos'?'#FFFFFF':'#C4410C',22)+'<span>'+it[1]+'</span>'+(it[3]==='pedidos'?'<b class="bdg" hidden></b>':'');
      b.addEventListener('click',ir(it[2]));tiles.appendChild(b);
    });
    nav.appendChild(tiles);
    /* secciones: todas desplegadas al abrir */
    const GI={Negocios:'neg',Servicios:'rec',Motorizados:'gps','Control de caja y sueldos':'ctl','Más':'tag'};
    const card=document.createElement('div');card.className='m3Card';
    let grp=null,out=null;
    ITEMS.forEach(it=>{
      if(it.length===1){
        const sec=document.createElement('section');sec.className='m3Grp';
        const hd=document.createElement('button');hd.type='button';hd.className='m3Hd';hd.setAttribute('aria-expanded','false');
        hd.innerHTML=S(IC[GI[it[0]]]||IC.neg,'#C4410C')+'<span>'+it[0]+'</span><small></small>'+S(CH,'#C4410C',16);
        const bd=document.createElement('div');bd.className='m3Bd';
        hd.addEventListener('click',()=>{const on=!sec.classList.contains('open');sec.classList.toggle('open',on);hd.setAttribute('aria-expanded',String(on))});
        sec.append(hd,bd);card.appendChild(sec);grp={sec,bd,hd,n:0};return;
      }
      if(it[4]==='out'){out=it;return}
      const b=document.createElement('button');b.type='button';b.className='m3It';if(it[3])b.dataset.k=it[3];b.dataset.txt=it[1].toLowerCase();if(it[5])b.dataset.ctl=it[5];
      b.innerHTML=S(IC[it[0]],'#6E625A',19)+'<span>'+it[1]+'</span>';
      b.addEventListener('click',ir(it[2]));
      if(grp){grp.bd.appendChild(b);grp.n++;grp.hd.querySelector('small').textContent=String(grp.n)}else card.appendChild(b);
    });
    nav.appendChild(card);
    if(out){const b=document.createElement('button');b.type='button';b.className='m3Out';b.innerHTML=S(IC.out,'#B42318')+'<span>Cerrar sesión</span>';b.addEventListener('click',ir(out[2]));nav.appendChild(b)}
    /* buscar: filtra opciones y abre las secciones que coinciden */
    const q=bus.querySelector('input');
    q.addEventListener('input',()=>{
      const t=q.value.trim().toLowerCase();
      tiles.querySelectorAll('.m3Tile').forEach(b=>b.hidden=!!t&&!b.dataset.txt.includes(t));
      tiles.hidden=!!t&&![...tiles.children].some(b=>!b.hidden);
      card.querySelectorAll('.m3Grp').forEach(g=>{let n=0;g.querySelectorAll('.m3It').forEach(b=>{const ok=!t||b.dataset.txt.includes(t);b.hidden=!ok;if(ok)n++});g.hidden=!!t&&!n;if(t&&n){g.classList.add('open')}});
      let vacio=nav.querySelector('.m3Vacio');const nada=!!t&&tiles.hidden&&![...card.querySelectorAll('.m3Grp')].some(g=>!g.hidden);
      if(nada&&!vacio){vacio=document.createElement('p');vacio.className='m3Vacio';vacio.textContent='No hay opciones con ese nombre.';card.after(vacio)}else if(!nada&&vacio)vacio.remove();
    });
    sh.addEventListener('click',cerrar);
    document.body.append(sh,m);
  }
  /* antes de abrir otra ventana, cierra cualquier ventana abierta (no se apilan) */
  function cerrarTodo(){
    const vis=e=>e&&e.getClientRects().length;
    ['#pdhoModal .hd > .x','#pdaPanel .a-x','#orderList .adminOrderCard.is-expanded .pdCerrarX'].forEach(q=>{const b=document.querySelector(q);if(vis(b))try{b.click()}catch(e){}});
    const ph=$('pdhSheet');if(ph&&!ph.hidden)ph.hidden=true;
    try{const m=$('pdmModal');if(m&&!m.hidden&&window.__pdmClose)window.__pdmClose()}catch(e){}
  }
  window.pdCerrarVentanas=cerrarTodo;
  const logged=()=>!!document.querySelector('#appView:not(.hidden)')&&!$('logout')?.classList.contains('hidden');
  window.pdAbrirMenu=function(){abrirMenu()};
  function abrirMenu(){montar();pintarPerfil();const m=$('pdMenu'),sh=$('pdMenuShade');try{const q=$('pdMenuBuscar');if(q&&q.value){q.value='';q.dispatchEvent(new Event('input'))}m.querySelectorAll('.m3Grp').forEach(g=>{g.classList.remove('open');const h=g.querySelector('.m3Hd');h&&h.setAttribute('aria-expanded','false')})}catch(e){}m.classList.remove('drag');m.style.removeProperty('transform');const pm=$('pdmModal');const enInicio=!(pm&&!pm.hidden);m.querySelectorAll('[data-k="pedidos"]').forEach(b=>b.classList.toggle('act',enInicio));m.classList.add('on');sh.classList.add('on');m.setAttribute('aria-hidden','false')}
  function cerrar(){const m=$('pdMenu'),sh=$('pdMenuShade');if(!m)return;m.classList.remove('on','drag');m.style.removeProperty('transform');sh.classList.remove('on');sh.style.removeProperty('opacity');m.setAttribute('aria-hidden','true')}
  /* arrastrar de izquierda a derecha para abrir, y al revés para cerrar */
  let d=null;
  document.addEventListener('touchstart',e=>{
    if(e.touches.length!==1||!logged())return;const t=e.touches[0],m=$('pdMenu');if(!m)return;
    const abierto=m.classList.contains('on');
    if(!abierto&&t.clientX>28)return;
    if(!abierto&&e.target.closest&&e.target.closest('input,textarea,select,.leaflet-container,.maplibregl-map,#gxMapWrap'))return;
    d={x:t.clientX,y:t.clientY,abierto,w:m.getBoundingClientRect().width||300,mov:false,dx:0,t0:Date.now()};
  },{passive:true});
  document.addEventListener('touchmove',e=>{
    if(!d)return;const t=e.touches[0],dx=t.clientX-d.x,dy=t.clientY-d.y;
    if(!d.mov){if(Math.abs(dx)<8)return;if(Math.abs(dy)>Math.abs(dx)){d=null;return}d.mov=true}
    const m=$('pdMenu'),sh=$('pdMenuShade');d.dx=dx;
    const off=d.abierto?Math.min(0,dx):Math.min(0,dx-d.w);
    m.classList.add('drag');m.style.setProperty('transform','translateX('+off+'px)','important');
    sh.classList.add('on');sh.style.setProperty('opacity',String(1+off/d.w),'important');
  },{passive:true});
  /* al soltar (o si el navegador cancela el gesto) el menú siempre queda abierto o cerrado, nunca a medias */
  function soltar(){
    const m=$('pdMenu');if(!d){if(m&&m.classList.contains('drag'))(m.classList.contains('on')?abrirMenu:cerrar)();return}
    const x=d;d=null;if(!x.mov)return;
    const rapido=Date.now()-x.t0<300&&Math.abs(x.dx)>40;
    const abrir=x.abierto?!(x.dx<-x.w*0.3||(rapido&&x.dx<0)):(x.dx>x.w*0.3||(rapido&&x.dx>0));
    abrir?abrirMenu():cerrar();
  }
  document.addEventListener('touchend',soltar,{passive:true});
  document.addEventListener('touchcancel',soltar,{passive:true});
  /* tocar cualquier parte fuera del menú lo cierra */
  let tragar=0;
  document.addEventListener('pointerdown',e=>{const m=$('pdMenu');if(!m||d)return;if((m.classList.contains('on')||m.classList.contains('drag'))&&!m.contains(e.target)){tragar=Date.now();cerrar()}},true);
  /* ese mismo toque no debe abrir lo que estaba debajo */
  document.addEventListener('click',e=>{const m=$('pdMenu');if(Date.now()-tragar<700||(m&&m.classList.contains('on')&&!m.contains(e.target))){tragar=0;e.preventDefault();e.stopPropagation();cerrar()}},true);
  window.addEventListener('blur',()=>{d=null;const m=$('pdMenu');if(m&&m.classList.contains('drag'))cerrar()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')cerrar()});
  function pintarPerfil(){
    const m=$('pdMenu');if(!m)return;
    const av=m.querySelector('.m3Av'),nm=m.querySelector('.m3Who strong');if(!av||!nm)return;
    const n=nombreCompleto();
    if(nm.textContent!==n)nm.textContent=n;
    let f='';try{f=window.__pdAdminFoto!==undefined?window.__pdAdminFoto:(localStorage.getItem('pdAdminFoto')||'')}catch(e){}
    const k=f?'f:'+f:'i:'+n.charAt(0).toUpperCase();if(av.__k===k)return;av.__k=k;
    if(f){av.innerHTML='<img src="'+String(f).replace(/"/g,'&quot;')+'" alt="">';av.classList.add('foto')}
    else{av.textContent=n.charAt(0).toUpperCase()||'A';av.classList.remove('foto')}
  }
  function aviso(){const m=$('pdMenu');if(!m)return;const b=m.querySelector('.bdg');if(!b)return;let c=0;try{c=(typeof allOrders!=='undefined'&&Array.isArray(allOrders)?allOrders:[]).filter(o=>['pendiente','confirmado'].includes(String(o.estado||'').toLowerCase())&&!o.motorizado_id).length}catch(e){}b.hidden=!c;if(c&&b.textContent!==String(c))b.textContent=c>99?'99+':String(c);}
  /* --- Saludo del inicio --- */
  let okT=0;
  function vigilar(){const c=window.pdPedidosCache;if(c&&!c.__pdOk){const g=c.guardar;c.guardar=function(){okT=Date.now();return g.apply(this,arguments)};c.__pdOk=true}}
  function nombreCompleto(){
    let n=window.__pdAdminNombre||'';
    if(!n){try{const v=localStorage.getItem('pd_admin_name')||'';try{n=JSON.parse(v)}catch(e){n=v}}catch(e){}}
    if(window.__pdAdminNombre===undefined&&!window.__pdAdminNomPidiendo&&window.db&&db.auth&&logged()){window.__pdAdminNomPidiendo=1;
      db.auth.getUser().then(r=>{const u=r&&r.data&&r.data.user;if(!u)return null;return db.from('perfiles').select('nombre_completo,foto_url').eq('id',u.id).maybeSingle()})
        .then(r=>{if(!r||r.error){window.__pdAdminNomPidiendo=0;return}const d=r.data||{};window.__pdAdminNombre=String(d.nombre_completo||'').trim();
          if(window.__pdAdminNombre)try{localStorage.setItem('pd_admin_name',window.__pdAdminNombre)}catch(e){}
          if(window.__pdAdminFoto===undefined){window.__pdAdminFoto=d.foto_url||'';try{localStorage.setItem('pdAdminFoto',window.__pdAdminFoto)}catch(e){}}
          try{pintarPerfil();saludo()}catch(e){}})
        .catch(()=>{window.__pdAdminNomPidiendo=0})}
    return String(n||'').trim()||'Administrador';
  }
  function nombre(){return nombreCompleto().split(/\s+/)[0]}
  const hoyLima=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Lima'});
  const diaLima=v=>{const t=new Date(v);return isNaN(t)?'':t.toLocaleDateString('en-CA',{timeZone:'America/Lima'})};
  let cargoTot=0;
  function totales(){
    if(!logged())return;
    if(Date.now()-cargoTot<60000)return;cargoTot=Date.now();
    try{typeof window.loadAdminCash==='function'&&window.loadAdminCash()}catch(e){}
    try{typeof window.pdLoadSalaryMotorizados==='function'&&window.pdLoadSalaryMotorizados()}catch(e){}
  }
  function saludo(){
    let tab=$('pdInicioTop');if(!tab){const t0=$('tab-restaurantes');if(!t0||!t0.parentNode)return;tab=document.createElement('section');tab.id='pdInicioTop';t0.after(tab)}
    let sb=tab.querySelector(':scope > .pdSal');
    if(!sb){
      sb=document.createElement('div');sb.className='pdSal';
      sb.innerHTML='<div class="pmaTop"><div class="pmaAv" aria-hidden="true"></div><div class="pmaTx"><small></small><strong></strong><span class="con" role="status"><i></i><span></span></span></div></div>'
        +'<div class="pmaAcc"><button type="button" data-a="atendidos"><b>0</b><span>Atendidos hoy</span></button><button type="button" data-a="sueldo"><b>—</b><span>Sueldos</span></button><button type="button" data-a="caja"><b>—</b><span>Cajas</span></button></div>';
      tab.prepend(sb);
      sb.querySelector('.pmaAcc').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const k=b.dataset.a;
        if(k==='atendidos'){try{window.__pdmOpen&&window.__pdmOpen('pedidos')}catch(_){}setTimeout(()=>{const c=document.querySelector('#tab-pedidos .pdn-chip[data-v="entregado"]');c&&c.click();document.getElementById('orderList')?.scrollIntoView({behavior:'smooth',block:'start'})},450);return}
        if(typeof window.__pdmOpen==='function')window.__pdmOpen(k)});
    }
    const set=(el,v)=>{if(el&&el.textContent!==v)el.textContent=v};
    const d=new Date();
    set(sb.querySelector('.pmaTx > small'),d.toLocaleDateString('es-PE',{weekday:'short',day:'2-digit',month:'short',timeZone:'America/Lima'}).replace(/\./g,'')+' · '+d.toLocaleTimeString('es-PE',{hour:'numeric',minute:'2-digit',timeZone:'America/Lima'}));
    const n=nombre();set(sb.querySelector('.pmaTx > strong'),'Hola, '+n);(function(){const av=sb.querySelector('.pmaAv');if(!av)return;let f='';try{f=window.__pdAdminFoto!==undefined?window.__pdAdminFoto:(localStorage.getItem('pdAdminFoto')||'')}catch(e){}
      if(window.__pdAdminFoto===undefined&&!window.__pdAdminFotoPidiendo&&window.db&&db.auth){window.__pdAdminFotoPidiendo=1;db.auth.getUser().then(r=>{const u=r&&r.data&&r.data.user;if(!u)return null;return db.from('perfiles').select('foto_url').eq('id',u.id).maybeSingle()}).then(r=>{if(!r)return;window.__pdAdminFoto=(r.data&&r.data.foto_url)||'';try{localStorage.setItem('pdAdminFoto',window.__pdAdminFoto)}catch(e){}}).catch(()=>{}).finally(()=>{window.__pdAdminFotoPidiendo=0})}
      const k=f?'f:'+f:'i:'+n.charAt(0).toUpperCase();if(av.__k===k)return;av.__k=k;
      if(f){av.innerHTML='<img src="'+String(f).replace(/"/g,'&quot;')+'" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block">';av.style.setProperty('overflow','hidden','important');av.style.setProperty('padding','0','important');['width','height','min-width','max-width','min-height','max-height'].forEach(k=>av.style.setProperty(k,'44px','important'));av.style.setProperty('flex','0 0 44px','important');av.style.setProperty('border-radius','50%','important')}
      else{av.textContent=n.charAt(0).toUpperCase();av.style.removeProperty('overflow');av.style.removeProperty('padding')}})();
    const err=($('ordersMsg')&&!$('ordersMsg').classList.contains('hidden')&&$('ordersMsg').textContent.trim())?true:false;
    let cls='',txt='Conectando a la base de datos…';
    if(!navigator.onLine){cls='no';txt='Sin conexión a internet'}
    else if(okT&&Date.now()-okT<90000&&!err){cls='ok';txt='Conectado a la base de datos'}
    else if(err){cls='no';txt='Sin conexión con la base de datos'}
    const ce=sb.querySelector('.con');if(ce.className!=='con '+cls)ce.className='con '+cls;set(ce.querySelector('span'),txt);
    /* cajones */
    let at=0;try{const hoy=hoyLima();at=(typeof allOrders!=='undefined'&&Array.isArray(allOrders)?allOrders:[]).filter(o=>String(o.estado||'').toLowerCase()==='entregado'&&diaLima(o.entregado_en||o.actualizado_en||o.updated_at||o.creado_en)===hoy).length}catch(e){}
    const bs=sb.querySelectorAll('.pmaAcc > button');
    set(bs[0].querySelector('b'),String(at));set(bs[0].querySelector('span'),'Atendidos hoy');
    const amt=sel=>{const e=document.querySelector(sel);const t=e&&e.textContent.trim();return t&&/\d/.test(t)?t.replace(/\s+/g,' '):'—'};
    set(bs[1].querySelector('b'),amt('#pdslTotal .pdslHeroAmt'));
    set(bs[2].querySelector('b'),amt('#pdcjTotal .pdcjAmt'));
    bs[0].setAttribute('aria-label','Pedidos atendidos hoy: '+at);bs[1].setAttribute('aria-label','Sueldos pendientes: '+bs[1].querySelector('b').textContent);bs[2].setAttribute('aria-label','Efectivo en cajas: '+bs[2].querySelector('b').textContent);
    totales();
  }
  window.addEventListener('online',()=>{try{saludo()}catch(e){}});window.addEventListener('offline',()=>{try{saludo()}catch(e){}});
  /* al entrar al admin, abre la ventana de Pedidos una sola vez */
  function abrirPedidosAlEntrar(){
    return; /* ya no se abre sola: el modal de Pedidos espera a que lo llamen */
    if(window.__pdIniAbierto||!logged())return;
    if(!window.__pdIniT){window.__pdIniT=Date.now();return}
    if(Date.now()-window.__pdIniT<900)return;
    if(typeof window.__pdmOpen!=='function'||!$('tab-pedidos'))return;
    const pm=$('pdmModal');if(pm&&!pm.hidden)return;
    window.__pdIniAbierto=true;
    try{window.__pdmOpen('pedidos')}catch(e){console.warn(e)}
  }
  const tick=()=>{try{inicio();pedidosEnInicio();enlazar();abrirPedidosAlEntrar();if(logged())montar();pintarPerfil();aviso();vigilar();saludo()}catch(e){}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tick,{once:true});else tick();
  setInterval(tick,800);
})();
}catch(e){console.error("[pidemas-inicio-pedidos-js]",e)}

/* ===== Menú inferior · el mismo de motorizado y negocio =====
   Inicio cierra la ventana abierta y vuelve arriba; Cajas, Sueldos y Clientes abren su ventana; Menú abre el menú lateral. */
(function(){
  const nav=document.getElementById('nav');if(!nav||!nav.classList.contains('pdNavAdmin'))return;
  const $=id=>document.getElementById(id);
  const marcar=k=>nav.querySelectorAll('button[data-admin-nav]').forEach(b=>b.classList.toggle('active',b.dataset.adminNav===k));
  let pend=false;
  function estado(){
    pend=false;
    const app=$('appView'),on=!!app&&!app.classList.contains('hidden');
    nav.classList.toggle('hidden',!on);document.body.classList.toggle('pdNavAdminOn',on);
    const pm=$('pdmModal'),abierto=!!pm&&!pm.hidden&&pm.getClientRects().length>0;
    const t=(($('pdmTitle')||{}).textContent||'').toLowerCase();
    marcar(!abierto?'inicio':t.includes('caja')?'caja':t.includes('sueldo')?'sueldo':t.includes('cliente')?'clientes':'');
  }
  const pedir=()=>{if(!pend){pend=true;requestAnimationFrame(estado)}};
  nav.addEventListener('click',e=>{
    const b=e.target.closest('button[data-admin-nav]');if(!b)return;
    const k=b.dataset.adminNav;
    if(k==='menu'){if(typeof window.pdAbrirMenu==='function')window.pdAbrirMenu();return}
    if(k==='inicio'){try{window.__pdmClose&&window.__pdmClose()}catch(_){}try{window.pdCerrarVentanas&&window.pdCerrarVentanas()}catch(_){}
      window.scrollTo({top:0,behavior:'smooth'});marcar('inicio');return}
    if(typeof window.openAdminTab==='function')window.openAdminTab(k);
    marcar(k);setTimeout(pedir,80);
  });
  new MutationObserver(pedir).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class']});
  estado();
})();


/* ===== Avisos push · Pidemás (administrador) =====
   Pide permiso una vez, guarda este celular en Supabase (tabla push_suscripciones)
   y así llegan los avisos de pedidos aunque la app esté cerrada.
   En iPhone solo funciona con la app instalada en la pantalla de inicio (iOS 16.4 o más). */
(function(){
  if(window.__pdPush)return;window.__pdPush=true;
  const ROL='administrador';
  const VAPID='BJIq-YR1vRTC7KlhzD_tJH4YLBR2Hl_vUAtvyIiRj9qaD5GENjDOsNZzlFBQYE7JFNlGpU7ENq8RDNMbx_qUSXQ';
  if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))return;
  const cli=()=>{try{if(typeof db!=='undefined')return db}catch(_){}return window.db||null};
  const llave=()=>{const s=VAPID.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((VAPID.length+3)%4);const b=atob(s);return Uint8Array.from(b,c=>c.charCodeAt(0))};
  // Motorizado y negocio ya tienen su propio botón «Activar avisos»: allí solo se escucha el permiso.
  const TARJETA=ROL==='administrador';
  const NO='pdPushNo_'+ROL,DIAS=3;
  const descartado=()=>{try{const t=+localStorage.getItem(NO)||0;return t&&Date.now()-t<DIAS*864e5}catch(_){return false}};
  async function registro(){
    let r=await navigator.serviceWorker.getRegistration();
    if(!r)r=await navigator.serviceWorker.register('sw.js');
    return navigator.serviceWorker.ready.then(x=>x||r);
  }
  async function sesion(){const c=cli();if(!c)return null;try{const {data}=await c.auth.getSession();return data&&data.session}catch(_){return null}}
  async function guardar(sub){
    const j=sub.toJSON();
    const {error}=await cli().rpc('guardar_push',{p_endpoint:j.endpoint,p_p256dh:j.keys.p256dh,p_auth:j.keys.auth,p_rol:ROL});
    if(error)console.warn('Avisos push:',error.message);
    return !error;
  }
  async function suscribir(){
    const r=await registro();
    let s=await r.pushManager.getSubscription();
    if(s){const k=s.options&&s.options.applicationServerKey;
      if(k&&new Uint8Array(k).join()!==llave().join()){await s.unsubscribe();s=null}}
    if(!s)s=await r.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:llave()});
    return guardar(s);
  }
  // En la app instalada (APK) el permiso lo da Android; si no responde en 10 s, se explica cómo activarlo.
  const RP=Notification.requestPermission.bind(Notification);
  function pedir(){
    let pr;try{pr=Promise.resolve(RP())}catch(_){pr=Promise.resolve(Notification.permission)}
    return Promise.race([pr.catch(()=>Notification.permission),new Promise(r=>setTimeout(()=>r(Notification.permission),10000))]);
  }
  // Los botones propios del panel también pasan por aquí: tiempo límite, ayuda y registro del celular.
  try{Notification.requestPermission=function(){return pedir().then(p=>{if(p==='granted')setTimeout(revisar,300);else ayuda();return p})}}catch(_){}
  function ayuda(msg){
    let a=document.getElementById('pdPushAyuda');
    if(!a){a=document.createElement('div');a.id='pdPushAyuda';a.setAttribute('role','alert');
      a.style.cssText='position:fixed;left:12px;right:12px;bottom:calc(96px + env(safe-area-inset-bottom));z-index:2147483000;background:#2b1a12;color:#fff;border-radius:16px;padding:14px 16px;font:500 14px/1.4 Inter,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.25)';
      document.body.appendChild(a)}
    a.innerHTML=(msg||'Para recibir avisos, activa las notificaciones: mantén presionado el icono de la app → <b>Información de la app</b> → <b>Notificaciones</b> → Permitir. Luego vuelve a abrir la app.')+'<button type="button" style="display:block;margin-top:10px;margin-left:auto;background:#C4410C;color:#fff;border:0;border-radius:999px;padding:8px 16px;font:700 14px Inter,system-ui,sans-serif">Entendido</button>';
    a.hidden=false;a.querySelector('button').onclick=()=>{a.hidden=true};
  }
  /* Cuando Android no deja dar el permiso desde la app, se explica cómo hacerlo en Ajustes */
  function instrucciones(){
    const t='Activa las notificaciones en tu teléfono\n1. Mantén presionado el ícono de la app y toca «Información de la app».\n2. Entra a «Notificaciones» y actívalas.\n3. Vuelve a abrir la app: los avisos quedarán activados solos.';
    if(window.pdInfo)window.pdInfo(t);else ayuda();
  }
  let card=null;
  function tarjeta(){
    if(card&&!card.hidden)return;
    if(!card){card=document.createElement('div');card.id='pdPushCard';card.setAttribute('role','dialog');card.setAttribute('aria-label','Activar avisos');document.body.appendChild(card)}
    card.innerHTML='<span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></span>'+
      '<span class="tx"><b>Activa los avisos de pedidos</b><small>Te avisamos de cada pedido aunque la app esté cerrada.</small></span>'+
      '<span class="bt"><button type="button" class="si">Activar</button><button type="button" class="no">Ahora no</button></span>';
    card.hidden=false;
    const hd=document.querySelector('header');const rc=hd&&hd.getBoundingClientRect();
    if(rc&&rc.height&&rc.bottom>0)card.style.top=(rc.bottom+8)+'px';
    card.querySelector('.no').onclick=()=>{try{localStorage.setItem(NO,String(Date.now()))}catch(_){}card.hidden=true};
    card.querySelector('.si').onclick=async()=>{
      card.hidden=true;
      const p=await pedir();
      if(p==='granted')suscribir().then(ok=>{if(!ok)ayuda('No se pudo registrar este celular. Cierra sesión y vuelve a entrar.')}).catch(e=>console.warn('Avisos push:',e));
      else{try{localStorage.setItem(NO,String(Date.now()))}catch(_){}ayuda()}
    };
  }
  let revisando=false;
  async function revisar(){
    if(revisando)return;revisando=true;
    try{
      if(!(await sesion()))return;
      if(Notification.permission==='granted'){await suscribir()}
      else if(TARJETA&&Notification.permission==='default'&&!descartado()){tarjeta()}
    }catch(e){console.warn('Avisos push:',e)}finally{revisando=false}
  }
  function iniciar(){
    const c=cli();if(!c){setTimeout(iniciar,800);return}
    setTimeout(revisar,2500);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(revisar,800)});
    // si el permiso se concede desde otro botón del panel, se guarda el celular al instante
    try{navigator.permissions.query({name:'notifications'}).then(st=>{st.onchange=()=>{if(st.state==='granted')revisar()}})}catch(_){}
    document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button');if(!b)return;
      const txt=(b.textContent||'')+' '+(b.id||'');
      /* Botón «Activar avisos» del panel: se pide el permiso en el mismo toque y se explica qué pasó */
      if(/activar avisos|activa los avisos|activar notificaciones/i.test(txt)&&!b.closest('#pdPushCard')&&'Notification' in window){
        if(Notification.permission==='granted'){revisar().then(()=>window.pdAviso&&pdAviso('Los avisos ya están activados en este teléfono ✓'));return}
        pedir().then(p=>{
          if(p==='granted'){setTimeout(revisar,300);window.pdAviso&&pdAviso('Avisos activados ✓ Te avisaremos de cada pedido.')}
          else instrucciones();
        });
        return;
      }
      if(/avisos|notificaci|alerta|permiso|activar/i.test(txt))[1500,5000,12000].forEach(t=>setTimeout(revisar,t))},true);
    try{c.auth.onAuthStateChange(ev=>{
      if(ev==='SIGNED_IN')setTimeout(revisar,1500);
      if(ev==='SIGNED_OUT'){if(card)card.hidden=true;navigator.serviceWorker.getRegistration().then(r=>r&&r.pushManager.getSubscription()).then(s=>s&&s.unsubscribe()).catch(()=>{})}
    })}catch(_){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
  // Tarjeta dentro del panel cuando llega un aviso con la app abierta
  function tarjetaAviso(d){
    if(!d||!d.title)return;
    let box=document.getElementById('pdAvisoStack');
    if(!box){box=document.createElement('div');box.id='pdAvisoStack';box.style.cssText='position:fixed;left:12px;right:12px;top:calc(12px + env(safe-area-inset-top,0px));z-index:2147483001;display:flex;flex-direction:column;gap:8px;max-width:456px;margin:0 auto;pointer-events:none';document.body.appendChild(box)}
    const c=document.createElement('button');c.type='button';
    c.style.cssText='pointer-events:auto;display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:12px 14px;background:#fff;border:1px solid #EFE3DA;border-left:5px solid #C4410C;border-radius:16px;box-shadow:0 12px 32px rgba(31,26,23,.18);font-family:Inter,system-ui,sans-serif;color:#1F1A17;animation:pdPushCae .3s cubic-bezier(.2,.8,.2,1)';
    const esc=v=>String(v||'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
    c.innerHTML='<span style="flex:0 0 40px;height:40px;border-radius:12px;background:#FBE6DD;color:#C4410C;display:flex;align-items:center;justify-content:center;font-size:20px">🔔</span><span style="flex:1;min-width:0"><b style="display:block;font-size:15px;font-weight:800">'+esc(d.title)+'</b><small style="display:block;font-size:13px;color:#6B5E57;margin-top:2px">'+esc(d.body)+'</small></span>';
    const fuera=()=>{c.remove()};
    c.onclick=()=>{fuera();if(d.pedidoId){if(window.pdAbrirPedidoAdmin){window.pdAbrirPedidoAdmin(d.pedidoId)}else{try{window.openAdminTab&&window.openAdminTab('pedidos')}catch(_){}try{window.pdDtAbrir&&pdDtAbrir()}catch(_){}setTimeout(()=>{const k=document.querySelector('.adminOrderCard[data-order-id="'+CSS.escape(String(d.pedidoId))+'"]');if(k){k.classList.add('is-expanded');k.scrollIntoView({behavior:'smooth',block:'start'})}},500)}}};
    box.prepend(c);while(box.children.length>3)box.lastChild.remove();
    setTimeout(fuera,9000);
    try{window.loadOrders&&window.loadOrders()}catch(_){}
  }
  window.pdTarjetaAviso=tarjetaAviso;
  try{navigator.serviceWorker.addEventListener('message',e=>{const m=e.data||{};if(m.type==='pd-push')tarjetaAviso(m.data)})}catch(_){}
})();

/* ===== pidemas-campana-pedidos-js ===== */
try{
/* Si hay pedidos nuevos por atender: la campana vibra sin parar, emite ondas y sale un aviso que lleva a Pedidos */
(function(){
  const $=id=>document.getElementById(id);
  let ultimo=0,cerrado=0,tAv=null;
  function pendientes(){
    try{return (typeof allOrders!=='undefined'&&Array.isArray(allOrders)?allOrders:[]).filter(o=>['pendiente','confirmado'].includes(String(o.estado||'').toLowerCase())&&!o.motorizado_id).length}catch(e){return 0}
  }
  function aviso(n){
    let a=$('pdCampAviso');
    if(!a){a=document.createElement('button');a.type='button';a.id='pdCampAviso';a.setAttribute('role','status');
      a.innerHTML='<i aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg></i><span><b></b><small>Toca para verlos</small></span>';
      a.addEventListener('click',()=>{a.classList.remove('on');try{window.__pdmOpen&&window.__pdmOpen('pedidos')}catch(e){}});
      document.body.appendChild(a)}
    a.querySelector('b').textContent=n===1?'Tienes 1 pedido nuevo':'Tienes '+n+' pedidos nuevos';
    a.classList.remove('on');void a.offsetWidth;a.classList.add('on');
    clearTimeout(tAv);tAv=setTimeout(()=>a.classList.remove('on'),7000);
  }
  function revisar(){
    const b=$('pdaBell');if(!b||b.hidden)return;
    const logged=!$('logout')?.classList.contains('hidden');
    const n=logged?pendientes():0;
    b.classList.toggle('pdaPend',n>0);
    if(n>ultimo&&logged){
      aviso(n);
      try{navigator.vibrate&&navigator.vibrate([200,100,200,100,350])}catch(e){}
    }
    if(n===0){const a=$('pdCampAviso');a&&a.classList.remove('on')}
    ultimo=n;
  }
  /* el primer conteo al entrar no anuncia: solo hace vibrar la campana */
  let primera=true;
  setInterval(()=>{try{if(primera){const b=$('pdaBell');if(b&&!b.hidden){ultimo=pendientes();primera=false;b.classList.toggle('pdaPend',ultimo>0)}return}revisar()}catch(e){}},1500);
})();
}catch(e){console.error("[pidemas-campana-pedidos-js]",e)}


/* Pagos de compra y de encomienda: ya tienen su pedido (compra registrada, guía de la agencia); se descuentan de la caja sin «Por revisar» */
try{(function(){const C=window.PdCaja;if(!C||C.autoPago)return;C.autoPago=1;
const auto=m=>!!(m&&m.tipo==='retiro'&&m.pedido_id&&/^PAGO DE (COMPRA|ENCOMIENDA)/i.test(String(m.descripcion||''))&&m.revision!=='rechazado');
const rt=C.revTag,ex=C.extra;
if(rt)C.revTag=function(m){return auto(m)?'':rt.apply(this,arguments)};
if(ex)C.extra=function(m){const a=[].slice.call(arguments);if(auto(m))a[0]=Object.assign({},m,{revision:null});return ex.apply(this,a)};
})()}catch(e){}
