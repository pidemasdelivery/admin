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
const faltas=new Map(),pagos=[],jornadas=[],descs=[];
(rows||[]).forEach(r=>{const t=norm(r.tipo),f=String(r.fecha||'').slice(0,10);if(t==='falta'&&f&&!faltas.has(f))faltas.set(f,r);else if(t==='pago')pagos.push(r);else if(t==='descuento')descs.push(r);else if(t==='jornada'&&f)jornadas.push(r)});
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
const passed=di<today||(di===today&&nowMin>=endMin);
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
descs.forEach(r=>{const k=String(r.periodo||'');let P=periods.get(k);if(!P){const f=String(r.fecha||'').slice(0,10);P=f?getP(periodOf(f)):null}if(!P)P=periods.get(cur.key);if(P){P.desc+=Number(r.monto||0);P.descSet=true;P.descRows.push(r)}});
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

/* ===== pdsl-js ===== */
try{
(function(){
const S=window.PdSueldo;if(!S)return;
const $=id=>document.getElementById(id);
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'S/ '+Number(n||0).toFixed(2);
const fmtD=i=>S.parse(i).toLocaleDateString('es-PE',{day:'2-digit',month:'short'});
const DAYS=['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];
const SHORT={lunes:'Lun',martes:'Mar',miercoles:'Mié',jueves:'Jue',viernes:'Vie',sabado:'Sáb',domingo:'Dom'};
let motos=[],current=null,rows=[],res=null,loading=null;
const say=(t)=>{const m=$('pdAdminSalaryMsg');if(m)m.textContent=t||''};
const db=()=>window.db;
async function loadMotos(force){
if(loading&&!force)return loading;
loading=(async()=>{
for(let i=0;i<20&&!db();i++)await new Promise(r=>setTimeout(r,300));
if(!db()){$('pdslMotos').innerHTML='<span class="pdslMuted">Sin conexión con Supabase.</span>';return}
const {data,error}=await db().from('motorizados').select('*').order('nombre_completo',{ascending:true});
if(error){$('pdslMotos').innerHTML='<span class="pdslMuted">No se pudo cargar la lista: '+E(error.message)+'</span>';return}
motos=(data||[]).filter(m=>m.activo!==false||(current&&String(current.id)===String(m.id)));
const sel=$('pdSalaryMotoSelect');if(sel)sel.innerHTML='<option value="">Selecciona</option>'+motos.map(m=>`<option value="${E(m.id)}">${E(m.nombre_completo||'Motorizado')}</option>`).join('');
renderMotos();
if(current){const fresh=motos.find(m=>String(m.id)===String(current.id));if(fresh){current=fresh;await loadRows()}}
})();
try{await loading}finally{loading=null}
}
window.pdLoadSalaryMotorizados=()=>loadMotos(true);
let dues=null,duesLoading=false;
async function loadDues(){
if(duesLoading||!motos.length||!db())return;duesLoading=true;
try{const {data,error}=await db().from('control_sueldos').select('*').in('motorizado_id',motos.map(m=>m.id));if(error)throw error;
const by=new Map();(data||[]).forEach(r=>{const k=String(r.motorizado_id);if(!by.has(k))by.set(k,[]);by.get(k).push(r)});
dues=new Map(motos.map(m=>{try{const r=S.calc(m,by.get(String(m.id))||[]);return [String(m.id),r.ok?{v:Math.max(0,r.current.balance)+r.previousDue,hourly:r.hourly}:{v:null,miss:true}]}catch(e){return [String(m.id),{v:null}]}}));
}catch(e){dues=new Map()}finally{duesLoading=false;renderMotos(true);paintTotal()}
}
function paintTotal(){const c=$('pdslTotal');if(!c)return;const a=c.querySelector('.pdslHeroAmt'),b=c.querySelector('.pdslHeroSub');if(!a||!b)return;if(!dues){a.textContent='—';b.textContent='Calculando…';return}let t=0,n=0,miss=0;dues.forEach(d=>{if(d&&d.miss)miss++;if(d&&d.v!=null&&d.v>0.004){t+=d.v;n++}});a.textContent='S/ '+t.toFixed(2);b.textContent=n+' de '+motos.length+' motorizados con sueldo pendiente de pagar'+(miss?' · '+miss+' sin configurar':'')}
function renderMotos(skipDues){
if(!dues)paintTotal();
const sq=($('pdslSearch')?.value||'').trim().toLowerCase();const shownM=motos.filter(m=>!sq||String(m.nombre_completo||'').toLowerCase().includes(sq));
$('pdslMotos').innerHTML=!motos.length?'<span class="pdslMuted">No hay motorizados registrados.</span>':!shownM.length?'<span class="pdslMuted">Ningún motorizado coincide con la búsqueda.</span>':shownM.map(m=>{const n=String(m.nombre_completo||'Motorizado').trim();const d=dues&&dues.get(String(m.id));
const amt=!dues?'<b class="zero">…</b>':d&&d.miss?'<b class="zero">Sin configurar</b>':d&&d.v!=null?`<b class="${d.v>0.004?'':'zero'}">${d.v>0.004?'Debe S/ '+d.v.toFixed(2):'Al día'}</b>`:'<b class="zero">—</b>';
return `<button type="button" class="pdslMoto ${current&&String(current.id)===String(m.id)?'on':''}" data-id="${E(m.id)}"><i>${E(n.split(/\s+/).map(w=>w[0]||'').slice(0,2).join('').toUpperCase())}</i><span>${E(n)}</span>${amt}</button>`}).join('');
if(!skipDues&&!dues)loadDues();
}
$('pdslSearch')?.addEventListener('input',()=>renderMotos(true));
$('pdslMotos').addEventListener('click',e=>{const b=e.target.closest('.pdslMoto');if(!b)return;const m=motos.find(x=>String(x.id)===String(b.dataset.id));if(!m)return;current=m;renderMotos();cfgOpen=null;$('pdslPayAmount').value='';delete $('pdslPayAmount').dataset.touched;loadRows()});
$('pdSalaryRefreshMotos').addEventListener('click',async()=>{const b=$('pdSalaryRefreshMotos');b.classList.add('spin');try{await loadMotos(true)}finally{b.classList.remove('spin')}});
async function loadRows(){
if(!current)return;dues=null;setTimeout(()=>renderMotos(),50);
$('pdslEmpty').hidden=true;$('pdslBody').hidden=false;
say('Cargando…');
try{
const cfg=S.config(current);
let q=db().from('control_sueldos').select('*').eq('motorizado_id',current.id).order('fecha',{ascending:true});
if(cfg.hire)q=q.gte('fecha',S.periodOf(cfg.hire).start);
const {data,error}=await q;if(error)throw error;
rows=data||[];say('');
}catch(e){rows=[];say('No se pudo leer control_sueldos: '+(e.message||e))}
render();
}
let cfgOpen=null;
function breakdown(P,res){
const r2=n=>Math.round((Number(n)||0)*100)/100;
const gas=res.hourly?r2(P.gasTotal):r2(P.gasDays*S.GAS);
const sueldo=r2(P.earned-gas);
const dias=P.worked+P.adj+P.rest;
const sSub=res.hourly?`${P.worked} jornada${P.worked===1?'':'s'} · ${P.hours} h`:`${dias} día${dias===1?'':'s'} pagado${dias===1?'':'s'}`;
const gSub=res.hourly?`${P.hours} h trabajadas`:`${P.gasDays} día${P.gasDays===1?'':'s'} × ${money(S.GAS)}`;
const row=(l,sub,v,c)=>`<div class="pdslBrRow${c?' '+c:''}"><span>${l}${sub?`<small>${sub}</small>`:''}</span><b>${v}</b></div>`;
return `<div class="pdslBreak">${row('Sueldo',sSub,money(sueldo))}${row('Gasolina',gSub,money(gas))}${row('Ganado','',money(P.earned),'tot')}${(P.descSet||P.desc>0.004)?row('Descuento AFP/ONP','','− '+money(P.desc),'neg'):''}${row('Pagado','',money(P.paid))}${row('Por cobrar','',money(Math.max(0,P.balance)),'fin')}</div>`;
}
function render(){
if(!current)return;
res=S.calc(current,rows);
const cfg=res.cfg,P=res.current;
const name=E(current.nombre_completo||'Motorizado');
if(!res.ok){
$('pdslHero').innerHTML=`<span class="pdslKick">${E(P.label)}</span><span class="pdslHeroName">${name}</span><div class="pdslAlert">El sueldo no se cuenta hasta completar: ${E(cfg.missing.join(', '))}.</div>`;
}else if(res.hourly){
$('pdslHero').innerHTML=`<span class="pdslKick">${E(P.label)} · por horas</span><span class="pdslHeroName">${name}</span>
        <span class="pdslHeroAmt">${money(Math.max(0,P.balance))}</span><span class="pdslHeroSub">Pendiente de esta quincena${P.balance<-0.004?' · adelantado: '+money(-P.balance):''}</span>
        <div class="pdslStats"><div><span>Jornadas</span><strong>${P.worked}</strong></div><div><span>Horas</span><strong>${P.hours}</strong></div><div><span>Gasolina</span><strong>${money(P.gasTotal)}</strong></div><div><span>Pagado</span><strong>${money(P.paid)}</strong></div></div>
        ${breakdown(P,res)}${P.needsDesc&&!P.descSet?'<div class="pdslAlert">Falta el descuento AFP/ONP de fin de mes. Regístralo en Pagos antes de pagar.</div>':''}
        <span class="pdslHeroSub">Solo suma las jornadas que registras abajo.</span>
        ${res.previousDue>0.004?`<div class="pdslAlert">Quincenas anteriores sin pagar: ${money(res.previousDue)}</div>`:''}`;
}else{
$('pdslHero').innerHTML=`<span class="pdslKick">${E(P.label)}</span><span class="pdslHeroName">${name}</span>
        <span class="pdslHeroAmt">${money(Math.max(0,P.balance))}</span><span class="pdslHeroSub">Pendiente de esta quincena${P.balance<-0.004?' · adelantado: '+money(-P.balance):''}</span>
        <div class="pdslStats"><div><span>Trabajados</span><strong>${P.worked+P.adj}</strong></div><div><span>Descansos</span><strong>${P.rest}</strong></div><div><span>Gasolina</span><strong>${P.gasDays}</strong></div><div><span>Faltas</span><strong>${P.faltas}</strong></div></div>
        ${breakdown(P,res)}${P.needsDesc&&!P.descSet?'<div class="pdslAlert">Falta el descuento AFP/ONP de fin de mes. Regístralo en Pagos antes de pagar.</div>':''}
        <span class="pdslHeroSub">Cada jornada se suma automáticamente ${E(res.endAt)} (hora de salida). Mes de 30 días${P.start>=S.FIXED_FROM?' · sueldo fijo S/ 480.38 por quincena'+(P.gasAdj>0?' (incluye ajuste de gasolina '+money(P.gasAdj)+')':''):''}.</span>
        ${res.previousDue>0.004?`<div class="pdslAlert">Quincenas anteriores sin pagar: ${money(res.previousDue)}</div>`:''}`;
}
{const box=$('pdslCfgSummary');box.classList.add('pdslInfo');const fecha=cfg.hire?E(S.parse(cfg.hire).toLocaleDateString('es-PE')):'Pendiente';
box.innerHTML=cfg.hourly?`<span>Tipo</span><b>Por horas</b><span>Ingreso</span><b>${fecha}</b>`:(res.ok||cfg.hire||cfg.times||cfg.days.length)?`<span>Ingreso</span><b>${fecha}</b><span>Horario</span><b>${cfg.times?E(S.fmtTime(cfg.times.start)+' – '+S.fmtTime(cfg.times.end)):'Pendiente'}</b><span>Días</span><b>${cfg.days.length?E(DAYS.filter(d=>cfg.days.includes(d)).map(d=>SHORT[d]).join(', ')):'Pendiente'}</b>`:'<span>Estado</span><b>Sin configurar</b>';}
if(cfgOpen===null)cfgOpen=!res.ok;
$('pdslCfgForm').hidden=!cfgOpen;$('pdslCfgToggle').textContent=cfgOpen?'Cerrar':'Editar';
fillCfg(cfg);
$('pdslAttCard').hidden=!!cfg.hourly;$('pdslShiftCard').hidden=!cfg.hourly;if(cfg.hourly)renderShifts();
$('pdslCalTitle').textContent=P.label?P.label.charAt(0).toUpperCase()+P.label.slice(1):'Quincena actual';
$('pdslCal').innerHTML=res.ok?(P.days||[]).map(d=>{
const n=d.adjDay||S.parse(d.date).getDate();
const sub={ajuste:'Ajuste 30 días',ajusteFuturo:'Se suma al cerrar',dia31:'Incluido en el 30',trabajado:'Trabajado'+(d.gas?' + gas':''),descanso:d.holiday?'Feriado pagado':'Descanso pagado',falta:'Falta',hoy:'Hoy · '+res.endAt,futuro:d.work?'Laborable':(d.rest?'Descanso':'—'),libre:'Libre',antes:'Antes del ingreso'}[d.status]||'';
return `<button type="button" class="pdslDay ${d.status}" data-date="${d.date}"${d.adjDay?' data-adj="1"':''}><small>${E(d.adjDay?'Feb':SHORT[d.dow])}</small><b>${n}</b><small>${E(sub)}</small></button>`;
}).join(''):'<span class="pdslMuted" style="grid-column:1/-1">Completa la configuración para ver la asistencia.</span>';
if(res.ok){const adv=new Map();rows.forEach(r=>{if(String(r.tipo||'').toLowerCase()==='pago'&&/^adelanto/i.test(String(r.descripcion||''))){const k=String(r.fecha).slice(0,10);adv.set(k,(adv.get(k)||0)+(Number(r.monto)||0))}});
$('pdslCal').querySelectorAll('.pdslDay').forEach(b=>{const v=adv.get(b.dataset.date);if(v>0&&!b.dataset.adj)b.insertAdjacentHTML('beforeend',`<i class="pdslAdvTag">Adelanto<br><span style="white-space:nowrap">${money(v)}</span></i>`)})}
fillPayPeriods();
const pays=rows.filter(r=>String(r.tipo||'').toLowerCase()==='pago').sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))).slice(0,8);
$('pdslPayList').innerHTML=pays.length?'<div class="pdslKick" style="margin-top:4px">Últimos pagos</div>'+pays.map(r=>`<div class="pdslRow"><span><strong>${money(r.monto)}</strong><small>${E(fmtD(r.fecha))}${r.descripcion?' · '+E(r.descripcion):''}${r.periodo?' · '+E(S.periodOf(String(r.periodo).slice(0,10)).label):''}</small></span><button type="button" class="pdslMini" data-del-pay="${E(r.id)}">Anular</button></div>`).join(''):'';
const hist=res.ok?res.periods.filter(p=>!p.isCurrent):[];
$('pdslHistory').innerHTML=hist.length?hist.map(p=>`<div class="pdslRow"><span><strong>${E(p.label.charAt(0).toUpperCase()+p.label.slice(1))}</strong><small>${res.hourly?p.worked+' jornadas · '+p.hours+' h':p.worked+p.adj+' trabajados · '+p.rest+' descansos · '+p.faltas+' faltas'} · ganado ${money(p.earned)}${p.descSet?' · AFP/ONP − '+money(p.desc):''} · pagado ${money(p.paid)}</small></span>${p.balance>0.004?`<button type="button" class="pdslMini" data-pay-period="${E(p.key)}">Pagar ${money(p.balance)}</button>`:'<span class="pdslPill">Pagado</span>'}</div>`).join(''):'<span class="pdslMuted">Aún no hay quincenas anteriores.</span>';
}
/* Adelanto de sueldo: se puede pagar por adelantado la quincena actual o la siguiente */
let payMode='pago';
function advPeriods(){
const cur=S.periodOf(S.todayIso());
const d=S.parse(cur.end);d.setDate(d.getDate()+1);
const nxt=S.periodOf(S.iso?S.iso(d):d.toISOString().slice(0,10));
const paidOf=key=>rows.filter(r=>String(r.tipo||'').toLowerCase()==='pago'&&String(r.periodo||'')===key).reduce((a,r)=>a+(Number(r.monto)||0),0);
return [cur,nxt].map((p,i)=>{const full=res&&res.ok?res.periods.find(x=>x.key===p.key):null;return {key:p.key,label:p.label,start:p.start,paid:full?full.paid:paidOf(p.key),earned:full?full.earned:null,balance:full?full.balance:0,actual:i===0}});
}
function fillPayPeriods(){
const sel=$('pdslPayPeriod');if(!sel)return;const prev=sel.value;
const adv=payMode==='adelanto';
{const n=$('pdslAdvNote');if(n)n.hidden=!adv;const l=$('pdslPayPeriodLbl');if(l)l.textContent=adv?'Quincena que adelantas':'Quincena que pagas';}
if(adv){
const opts=current?advPeriods():[];
const corto=l=>String(l).replace(/ de (\d{4})$/,'').replace(/ de (ene|feb|mar|abr|may|jun|jul|ago|set|sep|oct|nov|dic)[a-zñ]*/i,' de $1.');
sel.innerHTML=opts.map(p=>`<option value="${E(p.key)}">${E(corto(p.label))} · ${p.actual?'en curso':'siguiente'}${p.paid>0.004?' · '+money(p.paid):''}</option>`).join('')||'<option value="">—</option>';
if([...sel.options].some(o=>o.value===prev))sel.value=prev;
const n=$('pdslPayNote');if(n&&!n.value.trim())n.placeholder='Ej. Adelanto por Yape';
$('pdslPayAmount').value='';delete $('pdslPayAmount').dataset.touched;
const btn=$('pdslPaySave');if(btn&&!btn.dataset.busy){btn.disabled=false;btn.textContent='Registrar adelanto'}
const box=$('pdslDescBox');if(box)box.hidden=true;
return;
}
const n=$('pdslPayNote');if(n)n.placeholder='Ej. Yape, efectivo';
const opts=res&&res.ok?res.periods.filter(p=>p.isCurrent||p.balance>0.004||p.paid>0):[];
const corto2=l=>String(l).replace(/ de (\d{4})$/,'').replace(/ de (ene|feb|mar|abr|may|jun|jul|ago|set|sep|oct|nov|dic)[a-zñ]*/i,' de $1.');
sel.innerHTML=opts.map(p=>`<option value="${E(p.key)}">${E(corto2(p.label))} · ${p.needsDesc&&!p.descSet?'falta descuento AFP/ONP':p.balance>0.004?'debe '+money(p.balance):'al día'}</option>`).join('')||'<option value="">—</option>';
if([...sel.options].some(o=>o.value===prev))sel.value=prev;else{const due=opts.filter(p=>p.balance>0.004).sort((a,b)=>a.start.localeCompare(b.start))[0];if(due)sel.value=due.key}
suggestAmount();descUI();
}
function suggestAmount(){
if(payMode==='adelanto')return;
if(!res||!res.ok){$('pdslPayAmount').value='';descUI();return}const p=res.periods.find(x=>x.key===$('pdslPayPeriod').value);
const blocked=!!(p&&p.needsDesc&&!p.descSet);
if(p&&!$('pdslPayAmount').dataset.touched)$('pdslPayAmount').value=blocked?'':(p.balance>0.004?p.balance.toFixed(2):'');
descUI();
}
let descFor='';
function descUI(){
const box=$('pdslDescBox');if(!box)return;
if(payMode==='adelanto'){box.hidden=true;return}
const p=res&&res.ok&&current?res.periods.find(x=>x.key===$('pdslPayPeriod').value):null;
const show=!!(p&&(p.needsDesc||p.descSet));
box.hidden=!show;
const blocked=!!(p&&p.needsDesc&&!p.descSet);
const btn=$('pdslPaySave');if(btn&&!btn.dataset.busy){btn.disabled=blocked;btn.textContent=blocked?'Primero registra el descuento AFP/ONP':'Registrar pago'}
if(!show)return;
const sig=String(current.id)+'|'+p.key+'|'+p.descSet+'|'+p.desc;
if(descFor!==sig){descFor=sig;
const last=p.descRows[p.descRows.length-1];
$('pdslDescAmount').value=p.descSet?Number(p.desc).toFixed(2):'';
$('pdslDescType').value=last&&/onp/i.test(String(last.descripcion||''))?'ONP':'AFP';
$('pdslDescSave').textContent=p.descSet?'Actualizar descuento':'Guardar descuento';}
$('pdslDescNote').innerHTML=p.descSet?'Descuento registrado: <b>'+money(p.desc)+'</b>. Ganado '+money(p.earned)+' − descuento = <b>'+money(Math.max(0,p.earned-p.desc))+'</b> a pagar en total.':'<b>Obligatorio</b> en la 2.ª quincena: escribe el descuento de este mes (pon 0 si no tiene) y guárdalo. Sin esto no se puede registrar el pago.';
}
$('pdslDescSave')?.addEventListener('click',async()=>{
if(!current||!res||!res.ok)return;
const key=$('pdslPayPeriod').value;if(!key)return;
const raw=$('pdslDescAmount').value.trim();const monto=Number(raw);
if(raw===''||!Number.isFinite(monto)||monto<0){say('Escribe el monto del descuento (pon 0 si no tiene).');$('pdslDescAmount').focus();return}
const tipo=$('pdslDescType').value;const btn=$('pdslDescSave');const prevTxt=btn.textContent;btn.disabled=true;btn.textContent='Guardando…';
let failed='';
const slow=new Promise((_,rej)=>setTimeout(()=>rej(new Error('Tiempo agotado: Supabase no respondió.')),15000));
try{await Promise.race([(async()=>{
const del=await db().from('control_sueldos').delete().eq('motorizado_id',current.id).eq('tipo','descuento').eq('periodo',key);
if(del.error)throw del.error;
const {error}=await db().from('control_sueldos').insert({motorizado_id:current.id,fecha:S.todayIso(),tipo:'descuento',monto:Math.round(monto*100)/100,descripcion:'Descuento '+tipo,periodo:key});
if(error)throw error;
descFor='';await loadRows();say('Descuento '+tipo+' guardado: '+money(monto)+'.');
})(),slow]);
}catch(e){failed='No se pudo guardar: '+(e.message||e)+(/check|constraint|tipo|violates/i.test(String(e.message||e))?' · La tabla control_sueldos no permite el tipo "descuento".':'');say(failed)}
finally{btn.disabled=false;btn.textContent=prevTxt==='Guardando…'?'Guardar descuento':prevTxt;descFor='';descUI();if(failed){const n=$('pdslDescNote');if(n)n.innerHTML='<b style="color:#b3261e">'+E(failed)+'</b>'}}
});
$('pdslPayPeriod').addEventListener('change',()=>{delete $('pdslPayAmount').dataset.touched;suggestAmount()});
$('pdslPayMode')?.addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(!b)return;payMode=b.dataset.mode;$('pdslPayMode').querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('on',x===b));fillPayPeriods()});
$('pdslPayAmount').addEventListener('input',()=>{$('pdslPayAmount').dataset.touched='1'});
function fillCfg(cfg){
if($('pdslCfgForm').dataset.for===String(current.id))return;
$('pdslCfgForm').dataset.for=String(current.id);
$('pdslHire').value=cfg.hire||'';
setType(cfg.hourly?'por_horas':'completo');
const pad=n=>String(n).padStart(2,'0'),hm=m=>pad(Math.floor(m/60))+':'+pad(m%60);
$('pdslStart').value=cfg.times?hm(cfg.times.start):'08:00';$('pdslEnd').value=cfg.times?hm(cfg.times.end):'13:00';
const sel=cfg.days.length?cfg.days:['lunes','martes','miercoles','jueves','viernes','sabado'];
$('pdslDays').innerHTML=DAYS.map(d=>`<button type="button" data-day="${d}" class="${sel.includes(d)?'on':''}">${SHORT[d]}</button>`).join('');
}
$('pdslDays').addEventListener('click',e=>{const b=e.target.closest('[data-day]');if(b)b.classList.toggle('on')});
function setType(t){$('pdslType').querySelectorAll('[data-type]').forEach(b=>b.classList.toggle('on',b.dataset.type===t));$('pdslFullFields').hidden=t==='por_horas';$('pdslHourlyNote').hidden=t!=='por_horas'}
const getType=()=>$('pdslType').querySelector('.on')?.dataset.type||'completo';
$('pdslType').addEventListener('click',e=>{const b=e.target.closest('[data-type]');if(b)setType(b.dataset.type)});
$('pdslCfgToggle').addEventListener('click',()=>{cfgOpen=!cfgOpen;$('pdslCfgForm').hidden=!cfgOpen;$('pdslCfgToggle').textContent=cfgOpen?'Cerrar':'Editar'});
$('pdslCfgSave').addEventListener('click',async()=>{
if(!current)return;
const hire=$('pdslHire').value,a=$('pdslStart').value,b=$('pdslEnd').value;
const days=[...$('pdslDays').querySelectorAll('.on')].map(x=>x.dataset.day);
const tipo=getType();
if(tipo==='completo'){
if(!hire||!a||!b||!days.length){say('Completa fecha de ingreso, horario y al menos un día laborable.');return}
if(a===b){say('La hora de entrada y salida no pueden ser iguales.');return}
}
const btn=$('pdslCfgSave');btn.disabled=true;btn.textContent='Guardando…';
try{
const patch=tipo==='por_horas'?{tipo_sueldo:'por_horas',fecha_ingreso:hire||null}:{tipo_sueldo:'completo',fecha_ingreso:hire,horario_trabajo:a+' – '+b,dias_laborables:days};
const {data,error}=await db().from('motorizados').update(patch).eq('id',current.id).select('*').maybeSingle();
if(error){if(/tipo_sueldo/.test(error.message||''))throw new Error('falta la columna tipo_sueldo en motorizados (ejecuta el SQL nuevo).');throw error}if(!data)throw new Error('No se actualizó el motorizado (revisa permisos).');
Object.assign(current,data);cfgOpen=false;$('pdslCfgForm').dataset.for='';
await loadRows();say('Configuración guardada.');
}catch(e){say('No se pudo guardar: '+(e.message||e))}
finally{btn.disabled=false;btn.textContent='Guardar configuración'}
});
function shTotal(){const p=Number($('pdslShPay').value||0),g=Number($('pdslShGas').value||0);$('pdslShTotal').innerHTML=`<span>Total de la jornada</span><b>${money(p+g)}</b>`}
function shSuggest(){const s=S.hourly($('pdslShHours').value,$('pdslShDate').value);$('pdslShGas').placeholder=s.sunday?'Domingo: sin gasolina':'0.00';if(s.sunday)delete $('pdslShGas').dataset.touched;if(!$('pdslShPay').dataset.touched)$('pdslShPay').value=s.sueldo?s.sueldo.toFixed(2):'';if(!$('pdslShGas').dataset.touched)$('pdslShGas').value=s.gas?s.gas.toFixed(2):'';shTotal()}
$('pdslShHours').addEventListener('input',shSuggest);$('pdslShDate').addEventListener('change',shSuggest);
['pdslShPay','pdslShGas'].forEach(id=>$(id).addEventListener('input',()=>{$(id).dataset.touched='1';shTotal()}));
function renderShifts(){
if(!$('pdslShDate').value)$('pdslShDate').value=S.todayIso();shTotal();
const list=rows.filter(r=>String(r.tipo||'').toLowerCase()==='jornada').sort((a,b)=>String(b.fecha).localeCompare(String(a.fecha))).slice(0,15);
$('pdslShList').innerHTML=list.length?'<div class="pdslKick" style="margin-top:4px">Jornadas registradas</div>'+list.map(r=>{const s=S.shift(r);return `<div class="pdslRow"><span><strong>${E(fmtD(r.fecha))} · ${s.horas} h · ${money(s.sueldo+s.gas)}</strong><small>Sueldo ${money(s.sueldo)} · gasolina ${money(s.gas)}</small></span><button type="button" class="pdslMini" data-del-shift="${E(r.id)}">Anular</button></div>`}).join(''):'<span class="pdslMuted">Aún no hay jornadas registradas.</span>';
}
$('pdslShList').addEventListener('click',async e=>{const b=e.target.closest('[data-del-shift]');if(!b)return;if(!(await pdConfirmar('¿Anular esta jornada? Dejará de sumarse al sueldo.')))return;const {error}=await db().from('control_sueldos').delete().eq('id',b.dataset.delShift);if(error){say('No se pudo anular: '+error.message);return}say('Jornada anulada.');loadRows()});
$('pdslShSave').addEventListener('click',async()=>{
if(!current)return;
const fecha=$('pdslShDate').value,horas=Number($('pdslShHours').value),pay=Number($('pdslShPay').value||0),gas=Number($('pdslShGas').value||0);
if(!fecha){say('Elige la fecha de la jornada.');return}
if(!(horas>0)){say('Escribe las horas trabajadas.');return}
if(fecha>S.todayIso()){say('No puedes registrar una jornada de una fecha futura.');return}
if(rows.some(r=>String(r.tipo||'').toLowerCase()==='jornada'&&String(r.fecha).slice(0,10)===fecha)&&!(await pdConfirmar('Ya hay una jornada el '+fmtD(fecha)+'. ¿Registrar otra?')))return;
const btn=$('pdslShSave');btn.disabled=true;btn.textContent='Guardando…';
const base={motorizado_id:current.id,fecha,tipo:'jornada',monto:Math.round(pay*100)/100,descripcion:horas+' h · gasolina S/ '+gas.toFixed(2),periodo:S.periodOf(fecha).key};
try{
let {error}=await db().from('control_sueldos').insert({...base,horas,gasolina:Math.round(gas*100)/100});
if(error&&/horas|gasolina/.test(error.message||''))({error}=await db().from('control_sueldos').insert(base));
if(error)throw error;
$('pdslShHours').value='';$('pdslShPay').value='';$('pdslShGas').value='';delete $('pdslShPay').dataset.touched;delete $('pdslShGas').dataset.touched;
say('Jornada registrada.');await loadRows();
}catch(e){say('No se pudo registrar la jornada: '+(e.message||e))}
finally{btn.disabled=false;btn.textContent='Registrar jornada'}
});
const offDays=()=>{const a=$('pdslOffFrom').value,b=$('pdslOffTo').value||a;if(!a||b<a)return [];const out=[];for(let d=S.parse(a);S.iso(d)<=b;d.setDate(d.getDate()+1))out.push(S.iso(d));return out};
function offInfo(){const L=offDays();if(!L.length){$('pdslOffInfo').textContent='Elige el rango de fechas.';return}
const cfg=S.config(current||{});const pay=L.filter(di=>{const d=S.parse(di);return d.getDate()!==31&&(cfg.days.includes(S.KEYS[d.getDay()])||d.getDay()===0)}).length;
$('pdslOffInfo').textContent=`${L.length} día${L.length===1?'':'s'}: no se pagarán ni sumarán al costo del motorizado${pay!==L.length?' ('+pay+' eran días pagados)':''}.`}
$('pdslOffToggle').addEventListener('click',()=>{const f=$('pdslOffForm');f.hidden=!f.hidden;if(!f.hidden){if(!$('pdslOffFrom').value)$('pdslOffFrom').value=S.todayIso();if(!$('pdslOffTo').value)$('pdslOffTo').value=$('pdslOffFrom').value;offInfo()}});
['pdslOffFrom','pdslOffTo'].forEach(id=>$(id).addEventListener('change',()=>{if(id==='pdslOffFrom'&&(!$('pdslOffTo').value||$('pdslOffTo').value<$('pdslOffFrom').value))$('pdslOffTo').value=$('pdslOffFrom').value;offInfo()}));
$('pdslOffSave').addEventListener('click',async()=>{
if(!current)return;const L=offDays();if(!L.length){say('Elige fechas válidas (Hasta no puede ser antes de Desde).');return}
if(L.length>62){say('Máximo 62 días por registro.');return}
const have=new Set(rows.filter(r=>String(r.tipo||'').toLowerCase()==='falta').map(r=>String(r.fecha).slice(0,10)));
const why=$('pdslOffWhy').value.trim()||'Día sin pago';
const ins=L.filter(d=>!have.has(d)).map(d=>({motorizado_id:current.id,fecha:d,tipo:'falta',monto:0,descripcion:why,periodo:S.periodOf(d).key}));
if(!ins.length){say('Esas fechas ya estaban registradas como días sin pago.');return}
const btn=$('pdslOffSave');btn.disabled=true;
try{const {error}=await db().from('control_sueldos').insert(ins);if(error)throw error;$('pdslOffForm').hidden=true;$('pdslOffWhy').value='';await loadRows();say(ins.length+' día'+(ins.length===1?'':'s')+' sin pago registrado'+(ins.length===1?'':'s')+'.');try{window.pdhReload&&window.pdhReload()}catch(e){}}
catch(e){say('No se pudo registrar: '+(e.message||e))}finally{btn.disabled=false}
});
$('pdslOffDel').addEventListener('click',async()=>{
if(!current)return;const L=new Set(offDays());const del=rows.filter(r=>String(r.tipo||'').toLowerCase()==='falta'&&L.has(String(r.fecha).slice(0,10)));
if(!del.length){say('No hay días sin pago en esas fechas.');return}
if(!(await pdConfirmar('¿Quitar '+del.length+' día'+(del.length===1?'':'s')+' sin pago? Volverán a pagarse.')))return;
for(const r of del){const {error}=await db().from('control_sueldos').delete().eq('id',r.id);if(error){say('No se pudo quitar: '+error.message);break}}
await loadRows();say('Días sin pago quitados.');try{window.pdhReload&&window.pdhReload()}catch(e){}
});
/* Al tocar un día del calendario: registrar o quitar una falta, o dar un adelanto de sueldo ese día */
function diaHoja(d){
let h=document.getElementById('pdslDiaSheet');
if(!h){h=document.createElement('div');h.id='pdslDiaSheet';h.className='pdslDiaWrap';document.body.appendChild(h);
  h.addEventListener('click',ev=>{if(ev.target===h)cerrarDia()})}
const base=money(S.baseFor(current)+(d.work&&d.dow!=='domingo'?S.GAS:0));
const advs=rows.filter(r=>String(r.tipo||'').toLowerCase()==='pago'&&String(r.fecha).slice(0,10)===d.date&&/^adelanto/i.test(String(r.descripcion||'')));
const puedeFalta=!!((d.work||d.rest)&&d.status!=='antes'&&d.status!=='libre'&&d.status!=='falta');
const titulo=S.parse(d.date).toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'long'});
h.innerHTML=`<div class="pdslDiaSheet" role="dialog" aria-modal="true" aria-label="Día ${E(titulo)}">
 <div class="pdslDiaHead"><span><span class="pdslKick">${E(current.nombre_completo||'Motorizado')}</span><strong>${E(titulo.charAt(0).toUpperCase()+titulo.slice(1))}</strong></span><button type="button" class="pdslDiaX" aria-label="Cerrar">×</button></div>
 <div class="pdslDiaBody">
  ${d.status==='falta'?`<section class="pdslCard"><span class="pdslKick">Asistencia</span><strong class="pdslDiaT">Este día está marcado como falta</strong><p class="pdslNote">${E(d.falta&&d.falta.descripcion||'Falta')}</p><button type="button" class="pdslMini pdslOffBtn" data-dia="quitar">Quitar falta</button></section>`:''}
  ${puedeFalta?`<section class="pdslCard"><span class="pdslKick">Asistencia</span><strong class="pdslDiaT">Registrar falta</strong><p class="pdslNote">Ese día no se pagará (${E(base)}).</p><div class="pdslField"><label for="pdslDiaMotivo">Motivo (opcional)</label><input id="pdslDiaMotivo" maxlength="200" placeholder="Ej. No se presentó"></div><button type="button" class="pdslMini pdslOffBtn" data-dia="falta">Registrar falta</button></section>`:''}
  <section class="pdslCard"><span class="pdslKick">Sueldo</span><strong class="pdslDiaT">Adelanto de sueldo este día</strong><p class="pdslNote">Se descuenta de la ${E(S.periodOf(d.date).label)}.</p>
   ${advs.map(r=>`<div class="pdslRow"><span><strong>${money(r.monto)}</strong><small>${E(r.descripcion||'Adelanto de sueldo')}</small></span><button type="button" class="pdslMini" data-dia-del="${E(r.id)}">Anular</button></div>`).join('')}
   <div class="pdslTwo"><div class="pdslField"><label for="pdslDiaMonto">Monto (S/)</label><input type="number" id="pdslDiaMonto" min="0.01" step="0.01" inputmode="decimal" placeholder="0.00"></div><div class="pdslField"><label for="pdslDiaDet">Detalle</label><input id="pdslDiaDet" maxlength="200" placeholder="Ej. Yape"></div></div>
   <button type="button" class="pdslBtn" data-dia="adelanto">Registrar adelanto</button></section>
  <div class="pdslMsg" id="pdslDiaMsg" role="status"></div>
 </div></div>`;
h.hidden=false;document.documentElement.classList.add('pdslDiaOn');
const msg=t=>{const m=document.getElementById('pdslDiaMsg');if(m)m.textContent=t};
h.querySelector('.pdslDiaX').onclick=cerrarDia;
h.querySelector('.pdslDiaSheet').onclick=async ev=>{
 const b=ev.target.closest('[data-dia],[data-dia-del]');if(!b||b.disabled)return;
 const fin=async t=>{cerrarDia();say(t);await loadRows()};
 try{
  if(b.dataset.diaDel){if(!(await pdConfirmar('¿Anular este adelanto?')))return;b.disabled=true;
   const {error}=await db().from('control_sueldos').delete().eq('id',b.dataset.diaDel);if(error)throw error;return fin('Adelanto anulado.')}
  const a=b.dataset.dia;
  if(a==='quitar'){b.disabled=true;const {error}=await db().from('control_sueldos').delete().eq('id',d.falta.id);
   if(error)throw new Error(error.message+'. Revisa el permiso DELETE de control_sueldos.');return fin('Falta eliminada.')}
  if(a==='falta'){b.disabled=true;const mot=(document.getElementById('pdslDiaMotivo').value||'').trim();
   const {error}=await db().from('control_sueldos').insert({motorizado_id:current.id,fecha:d.date,tipo:'falta',monto:0,descripcion:mot||'Falta',periodo:S.periodOf(d.date).key});
   if(error)throw error;return fin('Falta registrada.')}
  if(a==='adelanto'){const monto=Number(document.getElementById('pdslDiaMonto').value);
   if(!Number.isFinite(monto)||monto<=0){msg('Escribe un monto válido.');document.getElementById('pdslDiaMonto').focus();return}
   b.disabled=true;b.textContent='Guardando…';const det=(document.getElementById('pdslDiaDet').value||'').trim();
   const {error}=await db().from('control_sueldos').insert({motorizado_id:current.id,fecha:d.date,tipo:'pago',monto,descripcion:'Adelanto de sueldo'+(det?' · '+det:''),periodo:S.periodOf(d.date).key});
   if(error)throw error;return fin('Adelanto registrado: '+money(monto)+'.')}
 }catch(err){b.disabled=false;if(b.dataset.dia==='adelanto')b.textContent='Registrar adelanto';msg('No se pudo guardar: '+(err.message||err))}
};
}
function cerrarDia(){const h=document.getElementById('pdslDiaSheet');if(h){h.hidden=true;h.innerHTML=''}document.documentElement.classList.remove('pdslDiaOn')}
$('pdslCal').addEventListener('click',async e=>{
const b=e.target.closest('.pdslDay');if(!b||!res||!res.ok)return;
if(b.dataset.adj)return;const d=res.current.days.find(x=>x.date===b.dataset.date&&!x.adjDay);if(!d||d.status==='dia31')return;
diaHoja(d);
});
$('pdslPaySave').addEventListener('click',async()=>{
const adv=payMode==='adelanto';
if(!current){say('Elige un motorizado.');return}
if(adv){
const key=$('pdslPayPeriod').value,monto=Number($('pdslPayAmount').value);
if(!key){say('Elige la quincena que adelantas.');return}
if(!Number.isFinite(monto)||monto<=0){say('Escribe un monto válido.');return}
const p=advPeriods().find(x=>x.key===key);
if(!(await pdConfirmar('¿Registrar un adelanto de '+money(monto)+' a '+(current.nombre_completo||'este motorizado')+' para la '+(p?p.label:'quincena elegida')+'?')))return;
const btn=$('pdslPaySave');btn.dataset.busy='1';btn.disabled=true;btn.textContent='Guardando…';
try{
const det=$('pdslPayNote').value.trim();
const {error}=await db().from('control_sueldos').insert({motorizado_id:current.id,fecha:S.todayIso(),tipo:'pago',monto,descripcion:'Adelanto de sueldo'+(det?' · '+det:''),periodo:key});
if(error)throw error;
$('pdslPayNote').value='';$('pdslPayAmount').value='';
await loadRows();say('Adelanto registrado: '+money(monto)+'.');
}catch(e){say('No se pudo registrar el adelanto: '+(e.message||e))}
finally{delete btn.dataset.busy;btn.disabled=false;btn.textContent='Registrar adelanto'}
return;
}
if(!res||!res.ok){say('Completa primero la configuración del motorizado.');return}
const key=$('pdslPayPeriod').value,monto=Number($('pdslPayAmount').value);
if(!key){say('Elige la quincena que pagas.');return}
if(!Number.isFinite(monto)||monto<=0){say('Escribe un monto válido.');return}
const p=res.periods.find(x=>x.key===key);
if(p&&p.needsDesc&&!p.descSet){say('Primero registra el descuento AFP/ONP de fin de mes (pon 0 si no tiene).');$('pdslDescAmount').focus();return}
if(p&&monto>p.balance+0.004&&!(await pdConfirmar('El monto es mayor a lo pendiente de esa quincena ('+money(Math.max(0,p.balance))+'). ¿Registrar de todas formas?')))return;
const btn=$('pdslPaySave');btn.dataset.busy='1';btn.disabled=true;btn.textContent='Guardando…';
try{
const {error}=await db().from('control_sueldos').insert({motorizado_id:current.id,fecha:S.todayIso(),tipo:'pago',monto,descripcion:$('pdslPayNote').value.trim()||'Pago de sueldo',periodo:key});
if(error)throw error;
$('pdslPayNote').value='';delete $('pdslPayAmount').dataset.touched;
await loadRows();say('Pago registrado: '+money(monto)+'.');
}catch(e){say('No se pudo registrar el pago: '+(e.message||e))}
finally{delete btn.dataset.busy;btn.disabled=false;btn.textContent='Registrar pago';descUI()}
});
document.getElementById('pdsl').addEventListener('click',async e=>{
const pp=e.target.closest('[data-pay-period]');
if(pp){$('pdslPayPeriod').value=pp.dataset.payPeriod;delete $('pdslPayAmount').dataset.touched;suggestAmount();$('pdslPayAmount').scrollIntoView({behavior:'smooth',block:'center'});return}
const dp=e.target.closest('[data-del-pay]');
if(dp){
if(!(await pdConfirmar('¿Anular este pago? Se volverá a mostrar como pendiente.')))return;
const {error}=await db().from('control_sueldos').delete().eq('id',dp.dataset.delPay);
if(error){say('No se pudo anular: '+error.message+'. Revisa el permiso DELETE de control_sueldos.');return}
say('Pago anulado.');loadRows();
}
});
setInterval(()=>{if(current&&!$('tab-sueldo')?.classList.contains('hidden'))render()},60000);
setInterval(()=>{if(current&&!document.hidden&&!$('tab-sueldo')?.classList.contains('hidden'))loadRows()},5*60000);
const boot=()=>setTimeout(()=>loadMotos(),300);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
}catch(e){console.error("[pdsl-js]",e)}

/* ===== pidemas-codigos-delivery-final-fix ===== */
try{
(function(){
function ejecutar(e){
const b=e.target && e.target.closest ? e.target.closest('#guardarCodigoDelivery') : null;
if(!b) return;
e.preventDefault();
e.stopPropagation();
e.stopImmediatePropagation();
try{
if(typeof window.guardarCodigoDelivery === 'function'){
window.guardarCodigoDelivery(document.getElementById('descuentosAdminBox'), b);
}else if(typeof window.crearCodigoDeliveryDesdeBoton === 'function'){
window.crearCodigoDeliveryDesdeBoton(b,e);
}else{
pdAviso('Error: la función de crear códigos no está cargada.');
}
}catch(err){
console.error('Crear código delivery final fix',err);
const m=document.getElementById('promoMsg');
if(m){m.textContent='ERROR AL CREAR: '+(err && err.message ? err.message : String(err));m.classList.remove('hidden');}
b.disabled=false;
b.textContent='Crear código';
}
}
document.addEventListener('click',ejecutar,true);
document.addEventListener('pointerup',function(e){
const b=e.target && e.target.closest ? e.target.closest('#guardarCodigoDelivery') : null;
if(!b) return;
if(typeof window.guardarCodigoDelivery === 'function' && !b.disabled){
e.preventDefault();
e.stopPropagation();
try{ window.guardarCodigoDelivery(document.getElementById('descuentosAdminBox'),b); }catch(err){ console.error(err); }
}
},true);
})();
}catch(e){console.error("[pidemas-codigos-delivery-final-fix]",e)}

/* ===== pidemas-gps-watchdog-final ===== */
try{
(function(){
let attempts=0, lastKick=0;
function kickGps(){
const box=document.getElementById('gpsAdminBox');
const status=document.getElementById('adminGpsStatus');
if(!box || box.classList.contains('hidden') || !box.getClientRects().length) return;
const now=Date.now();
if(now-lastKick<1800) return;
lastKick=now;
if(typeof window.initAdminGpsMap==='function'){
try{
const result=window.initAdminGpsMap();
if(result && typeof result.catch==='function') result.catch(err=>{
if(status) status.textContent='No se pudo iniciar el mapa GPS: '+(err?.message||err);
});
}catch(err){
if(status) status.textContent='No se pudo iniciar el mapa GPS: '+(err?.message||err);
}
}else if(status){
attempts++;
status.textContent=attempts<5 ? 'Iniciando módulo GPS…' : 'El módulo GPS no se inició. Recarga el Panel Administrador y vuelve a abrir Motorizados / GPS.';
}
}
function start(){
const box=document.getElementById('gpsAdminBox');
if(box && window.MutationObserver){
new MutationObserver(kickGps).observe(box,{attributes:true,attributeFilter:['class','style']});
const modal=document.getElementById('pidemasUniversalModal');
if(modal) new MutationObserver(kickGps).observe(modal,{attributes:true,attributeFilter:['class','style']});
}
document.addEventListener('click',function(e){
if(e.target?.closest?.('.serviceBtn[data-service="gps"]')) setTimeout(kickGps,250);
},true);
setInterval(kickGps,1200);
setTimeout(kickGps,500);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
}catch(e){console.error("[pidemas-gps-watchdog-final]",e)}

/* ===== pidemas-crear-motorizado-nuevo ===== */
try{
(function(){
const $ = id => document.getElementById(id);
const showMessage = (text, isError=false) => {
const box=$("nuevoMotoMsg");
if(!box)return;
box.textContent=text;
box.classList.remove("hidden");
box.style.borderColor=isError ? "#b00020" : "#ccc";
};
const clearMessage = () => {
const box=$("nuevoMotoMsg");
if(box){box.textContent="";box.classList.add("hidden");}
};
const saveButton=$("guardarNuevoMotorizadoBtn");
if(!saveButton)return;
saveButton.addEventListener("click",async function(){
clearMessage();
const nombre=($("nuevoMotoNombre")?.value||"").trim().replace(/\\s+/g," ");
const telefono=($("nuevoMotoTelefono")?.value||"").trim();
const activo=Boolean($("nuevoMotoActivo")?.checked);
if(!nombre){showMessage("Escribe el nombre y los apellidos del motorizado.",true);return;}
if(!telefono){showMessage("Escribe el teléfono o WhatsApp del motorizado.",true);return;}
const client=window.db;
if(!client || typeof client.from!=="function"){showMessage("No se encontró la conexión con Supabase.",true);return;}
saveButton.disabled=true;
saveButton.textContent="Guardando…";
try{
const payload={nombre_completo:nombre,telefono:telefono,activo:activo,disponible:false};
const {data,error}=await client.from("motorizados").insert(payload).select("id,nombre_completo,telefono").single();
if(error)throw error;
$("nuevoMotoNombre").value="";
$("nuevoMotoTelefono").value="";
$("nuevoMotoActivo").checked=true;
showMessage("Motorizado registrado correctamente.");
if(typeof window.loadAdminAgencias==="function"){
try{await window.loadAdminAgencias();}catch(refreshError){console.warn("No se pudieron actualizar las listas de motorizados:",refreshError);}
}
const select=$("accesoMotorizadoId");
if(select && data){
const opt=document.createElement("option");
opt.value=data.id;
opt.textContent=data.nombre_completo||nombre;
const exists=Array.from(select.options).some(o=>String(o.value)===String(data.id));
if(!exists)select.appendChild(opt);
}
}catch(error){
console.error("Error al crear motorizado:",error);
const detail=error?.message ? " Detalle: "+error.message : "";
showMessage("No se pudo guardar el motorizado en Supabase."+detail,true);
}finally{
saveButton.disabled=false;
saveButton.textContent="Guardar motorizado";
}
});
})();
}catch(e){console.error("[pidemas-crear-motorizado-nuevo]",e)}

/* ===== pidemas-admin-suspension-motorizados-v1 ===== */
try{
(function(){
const $id=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function showMessage(text,error=false){const el=$id('suspenderMotorizadoMsg');if(!el)return;el.textContent=text;el.style.borderColor=error?'#999':'#ddd';}
window.cargarListaSuspensionMotorizados=async function(){
const list=$id('suspenderMotorizadoList');if(!list)return;
list.innerHTML='<div class="muted">Cargando motorizados…</div>';
try{
const {data,error}=await window.db.from('motorizados').select('id,nombre_completo,telefono,activo').order('nombre_completo',{ascending:true});
if(error)throw error;
if(!data?.length){list.innerHTML='<div class="notice">No hay motorizados registrados.</div>';return;}
list.innerHTML=data.map(m=>{
const activo=m.activo!==false;
return `<div class="row" style="align-items:center"><div style="min-width:0;flex:1"><strong>${esc(m.nombre_completo||'Motorizado')}</strong><small>${esc(m.telefono||'Sin teléfono')}</small><div style="margin-top:6px"><span class="badge">${activo?'Cuenta activa':'Cuenta suspendida'}</span></div></div><div class="actions" style="margin:0"><button type="button" class="btn ${activo?'alt':''}" data-suspension-moto="${esc(m.id)}" data-next-active="${activo?'false':'true'}" style="white-space:nowrap">${activo?'Suspender cuenta':'Reactivar cuenta'}</button></div></div>`;
}).join('');
}catch(e){console.error('No se pudo cargar estado de motorizados:',e);list.innerHTML='<div class="notice">No se pudo cargar la lista. Revisa los permisos de Supabase y que exista la columna activo en motorizados.</div>';}
};
$id('actualizarSuspensionMotosBtn')?.addEventListener('click',()=>window.cargarListaSuspensionMotorizados());
$id('suspenderMotorizadoList')?.addEventListener('click',async e=>{
const btn=e.target.closest('[data-suspension-moto]');if(!btn)return;
const next=btn.dataset.nextActive==='true';
const name=btn.closest('.row')?.querySelector('strong')?.textContent||'este motorizado';
if(!(await pdConfirmar(`¿Deseas ${next?'reactivar':'suspender'} la cuenta de ${name}?`)))return;
btn.disabled=true;btn.textContent='Guardando…';
try{
const {error}=await window.db.from('motorizados').update({activo:next}).eq('id',btn.dataset.suspensionMoto);
if(error)throw error;
showMessage(next?'Cuenta reactivada en el registro de motorizados.':'Cuenta suspendida en el registro de motorizados. Para bloquear una sesión ya abierta también se debe actualizar el panel del motorizado.');
await window.cargarListaSuspensionMotorizados();
}catch(err){console.error('Error actualizando estado de cuenta:',err);showMessage('No se pudo cambiar el estado. Comprueba permisos de actualización en Supabase y la columna activo.',true);btn.disabled=false;btn.textContent=next?'Reactivar cuenta':'Suspender cuenta';}
});
})();
}catch(e){console.error("[pidemas-admin-suspension-motorizados-v1]",e)}

/* ===== pidemas-cargar-datos-herramientas ===== */
try{
(function(){
const $=id=>document.getElementById(id);
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function fillSelect(id,table,cols,label,placeholder,msgId,errText){
const sel=$(id);if(!sel||!window.db)return;
sel.innerHTML='<option value="">'+placeholder+'</option>';
const r=await window.db.from(table).select(cols).order(label.order,{ascending:true});
if(r.error){if(typeof window.msg==='function'&&$(msgId))window.msg($(msgId),errText);return;}
(r.data||[]).forEach(n=>{const o=document.createElement('option');o.value=n.id;o.textContent=n[label.field]||label.fallback;sel.appendChild(o);});
}
window.__pidemasLoadToolData=async function(key){
if(key==='suspender-motorizado'){if(typeof window.cargarListaSuspensionMotorizados==='function')await window.cargarListaSuspensionMotorizados();return;}
if(key==='gps'){if(typeof window.initAdminGpsMap==='function')await window.initAdminGpsMap();return;}
if(key==='descuentos'){if(typeof loadDeliveryPromos==='function')await loadDeliveryPromos();return;}
if(key==='recojo'||key==='compra'){
if(typeof window.loadAdminAgencias==='function')await window.loadAdminAgencias();
const motos=Array.isArray(window.adminServiceMotos)?window.adminServiceMotos:[];
const sel=$(key==='recojo'?'admRecojoMoto':'admCompraMoto');
if(sel)sel.innerHTML='<option value="">Seleccionar motorizado</option>'+motos.map(m=>'<option value="'+m.id+'">'+esc(m.nombre_completo||'')+'</option>').join('');
return;
}
if(key==='encomienda'){if(typeof window.loadAdminAgencias==='function')await window.loadAdminAgencias();return;}
if(key==='acceso-motorizado'){
await fillSelect('accesoMotorizadoId','motorizados','id,nombre_completo',{order:'nombre_completo',field:'nombre_completo',fallback:'Motorizado'},'Selecciona un motorizado','accesoMotorizadoMsg','No se pudieron cargar los motorizados.');
if(typeof clearMsg==='function')clearMsg($('accesoMotorizadoMsg'));
if(typeof cargarAccesosMotorizado==='function')await cargarAccesosMotorizado();return;
}
if(key==='acceso-negocio'){
await fillSelect('accesoNegocioId','negocios','id,nombre',{order:'nombre',field:'nombre',fallback:'Negocio'},'Selecciona un negocio','accesoNegocioMsg','No se pudieron cargar los negocios.');
if(typeof clearMsg==='function')clearMsg($('accesoNegocioMsg'));
if(typeof cargarAccesosNegocio==='function')await cargarAccesosNegocio();return;
}
};
})();
}catch(e){console.error("[pidemas-cargar-datos-herramientas]",e)}

/* ===== pidemas-fix-sueldo-pagina-independiente-v2 ===== */
try{
(function(){
function detachSalaryPage(){
const salary=document.getElementById('tab-sueldo');
const app=document.getElementById('appView');
if(!salary||!app)return;
if(salary.parentElement!==app){
const caja=document.getElementById('tab-caja');
if(caja&&caja.parentElement===app)caja.insertAdjacentElement('afterend',salary);
else app.appendChild(salary);
}
salary.classList.add('hidden');
salary.style.removeProperty('display');
salary.style.removeProperty('visibility');
salary.style.removeProperty('opacity');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',detachSalaryPage,{once:true});else detachSalaryPage();
(function(){const s=document.getElementById('tab-sueldo');if(!s||typeof MutationObserver==='undefined')return;
new MutationObserver(function(){if(s.classList.contains('hidden')){['display','visibility','opacity'].forEach(function(p){s.style.removeProperty(p);});}}).observe(s,{attributes:true,attributeFilter:['class']});})();
document.addEventListener('click',function(e){
const b=e.target&&e.target.closest&&e.target.closest('[data-side-tab="sueldo"],[data-admin-tab="sueldo"],.tab[data-tab="sueldo"]');
if(!b)return;
setTimeout(function(){
detachSalaryPage();
const salary=document.getElementById('tab-sueldo');
if(salary){salary.classList.remove('hidden');salary.style.setProperty('display','block','important');salary.style.setProperty('visibility','visible','important');salary.style.setProperty('opacity','1','important');}
['restaurantes','pedidos','clientes','agencias','caja'].forEach(function(n){const el=document.getElementById('tab-'+n);if(el)el.classList.add('hidden');});
window.scrollTo(0,0);
if(typeof window.pdLoadSalaryMotorizados==='function')window.pdLoadSalaryMotorizados();
},80);
},true);
})();
}catch(e){console.error("[pidemas-fix-sueldo-pagina-independiente-v2]",e)}

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

/* ===== pidemas-editar-negocio-visible ===== */
try{
(function(){
if(typeof window.editRestaurant!=='function')return;
const _edit=window.editRestaurant;
window.editRestaurant=function(r){
if(typeof window.__pdmOpen==='function')window.__pdmOpen('crear-negocio');
const out=_edit.apply(this,arguments);
const t=document.getElementById('pidemasStandaloneToolsTitle');
if(t)t.textContent='Editar negocio'+(r&&r.nombre?' · '+r.nombre:'');
setTimeout(()=>{const f=document.getElementById('rNombre');f&&f.focus({preventScroll:true});window.scrollTo(0,0)},50);
return out;
};
})();
}catch(e){console.error("[pidemas-editar-negocio-visible]",e)}

/* ===== pidemas-form-negocio-modelo2 ===== */
try{
(function(){
const box=document.getElementById('crearNegocioAdminBox');if(!box)return;
const card=box.querySelector('.card');const grid=card?.querySelector('.grid');if(!card||!grid)return;
const $=id=>document.getElementById(id);
const F=id=>$(id)?.closest('.field');
const CATS=['Restaurantes','Comida criolla','Pizzerías','Pollerías','Hamburgueserías','Comida rápida','Sangucherías','Paviferías','Cevicherías','Chifas','Sushi y comida japonesa','Parrillas y anticuchos','Heladerías','Cafeterías','Juguerías','Dulcerías y pastelerías','Panaderías','Bodegas y minimarkets','Fruterías y verdulerías','Carnicerías','Licorerías','Agua y gas','Farmacias y boticas','Ropa y moda','Calzado y zapatillas','Accesorios y bisutería','Tecnología','Celulares y accesorios','Belleza y cuidado personal','Hogar y decoración','Ferreterías','Deportes','Bebés y maternidad','Florerías y regalos','Mascotas','Librerías y útiles escolares','Jugueterías','Lavanderías'];
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
grid.insertAdjacentHTML('beforeend',`<div class="field"><label for="rCategoria">Categoría del negocio</label><select id="rCategoria"><option value="">Selecciona una categoría</option>${CATS.map(c=>`<option value="${E(c)}">${E(c)}</option>`).join('')}</select></div>`);
const form=document.createElement('div');form.className='pdnForm';
form.innerHTML=`<p class="pdnIntro">Completa los datos y guarda. Los cambios se ven en la tienda al recargarla.</p>
  <div class="pdnCols"><div>
    <section class="pdnSec" data-s="datos"><div class="pdnSecHead"><span class="pdnKicker">Paso 1</span><strong>Datos del negocio</strong></div></section>
    <section class="pdnSec" data-s="ubicacion"><div class="pdnSecHead"><span class="pdnKicker">Paso 2</span><strong>Ubicación</strong></div></section>
  </div><div>
    <section class="pdnSec" data-s="tienda"><div class="pdnSecHead"><span class="pdnKicker">Paso 3</span><strong>En la tienda</strong></div></section>
    <section class="pdnSec" data-s="imagenes"><div class="pdnSecHead"><span class="pdnKicker">Paso 4</span><strong>Imágenes</strong></div></section>
    <section class="pdnSec" data-s="preview"><div class="pdnSecHead"><span class="pdnKicker">Vista previa</span><strong>Así se verá en la tienda</strong></div><div class="pdnCard" id="pdnCard"></div></section>
  </div></div>
  <div class="pdnBar" id="pdnBar"></div>`;
const S=k=>form.querySelector(`[data-s="${k}"]`);
[F('rNombre'),F('rCategoria'),F('rTelefono'),F('rDescripcion')].forEach(f=>f&&S('datos').appendChild(f));
[F('rDireccion'),F('rGoogleMaps')].forEach(f=>f&&S('ubicacion').appendChild(f));
const two=document.createElement('div');two.className='pdnTwo';[F('rLatitud'),F('rLongitud')].forEach(f=>f&&two.appendChild(f));S('ubicacion').appendChild(two);
S('ubicacion').insertAdjacentHTML('beforeend','<p class="pdnHint">Pega el enlace de Google Maps y, si trae coordenadas, la latitud y longitud se completan solas. Se usan para calcular el delivery.</p>');
const two2=document.createElement('div');two2.className='pdnTwo';[F('rTiempo'),F('rOrden')].forEach(f=>f&&two2.appendChild(f));S('tienda').appendChild(two2);
S('tienda').insertAdjacentHTML('beforeend','<p class="pdnHint">El orden define la posición en la lista de negocios (1 aparece primero).</p>');
const act=$('rActivo');const actField=F('rActivo');
if(act){
const row=document.createElement('label');row.className='pdnSwitchRow';row.setAttribute('for','rActivo');
row.innerHTML='<span><strong>Negocio activo</strong><small>Si lo desactivas, deja de aparecer en la tienda.</small></span>';
row.appendChild(act);row.insertAdjacentHTML('beforeend','<i aria-hidden="true"></i>');
S('tienda').appendChild(row);actField?.classList.add('pdnHidden');
}
const imgs=document.createElement('div');imgs.className='pdnImgs';
imgs.innerHTML=`<div class="pdnImg"><label>Logo</label><div class="pdnPrev logo" id="pdnLogoPrev">Sin logo</div><label class="pdnUp" for="rLogoFile">Subir logo</label></div>
    <div class="pdnImg"><label>Portada</label><div class="pdnPrev cover" id="pdnCoverPrev">Sin portada</div><label class="pdnUp" for="rPortadaFile">Subir portada</label></div>`;
S('imagenes').appendChild(imgs);
const [logoCol,coverCol]=imgs.querySelectorAll('.pdnImg');
[['rLogo',logoCol],['rLogoFile',logoCol],['rPortada',coverCol],['rPortadaFile',coverCol]].forEach(([id,col])=>{const el=$(id);if(el)col.appendChild(el)});
if($('rLogo'))$('rLogo').placeholder='o pega la URL del logo';
if($('rPortada'))$('rPortada').placeholder='o pega la URL de la portada';
[F('rLogo'),F('rPortada')].forEach(f=>f?.classList.add('pdnHidden'));
document.querySelectorAll('#crearNegocioAdminBox .uploadBox').forEach(f=>f.classList.add('pdnHidden'));
S('imagenes').insertAdjacentHTML('beforeend','<p class="pdnHint">PNG, JPG o WebP. El logo se ve mejor cuadrado.</p>');
const bar=form.querySelector('#pdnBar');
['saveRestaurant','cancelRestaurant'].forEach(id=>{const b=$(id);if(b)bar.appendChild(b)});
const msg=$('restaurantMsg');if(msg)bar.before(msg);
const titleWrap=$('restaurantFormTitle')?.closest('div[style]')||$('restaurantFormTitle')?.parentElement;
titleWrap?.classList.add('pdnHidden');
grid.classList.add('pdnHidden');
const oldActions=card.querySelector(':scope>.actions');oldActions?.classList.add('pdnHidden');
card.insertBefore(form,grid);
const fileUrl={};
function setPrev(el,url,empty){
if(!el)return;
if(url){el.classList.add('has');el.innerHTML=`<img src="${E(url)}" alt="" onerror="this.parentElement.classList.remove('has');this.parentElement.textContent='No se pudo cargar'">`}
else{el.classList.remove('has');el.textContent=empty}
}
function refresh(){
const logo=fileUrl.logo||($('rLogo')?.value||'').trim();
const cover=fileUrl.cover||($('rPortada')?.value||'').trim();
setPrev($('pdnLogoPrev'),logo,'Sin logo');setPrev($('pdnCoverPrev'),cover,'Sin portada');
const name=($('rNombre')?.value||'').trim()||'Nombre del negocio';
const cat=$('rCategoria')?.value||'Categoría';
const eta=($('rTiempo')?.value||'').trim()||'25–40 min';
const on=$('rActivo')?.checked!==false;
$('pdnCard').innerHTML=`<span class="pdnCardLogo">${logo?`<img src="${E(logo)}" alt="" onerror="this.remove()">`:E(name.charAt(0).toUpperCase())}</span><span><strong>${E(name)}</strong><small>${E(cat)} · <i class="ti ti-gauge" aria-hidden="true"></i> ${E(eta)}</small><em class="${on?'':'off'}">${on?'Abierto':'Inactivo'}</em></span>`;
const editing=!$('cancelRestaurant')?.classList.contains('hidden');
bar.classList.toggle('two',editing);
}
function onFile(input,key){
input?.addEventListener('change',()=>{
try{if(fileUrl[key])URL.revokeObjectURL(fileUrl[key])}catch(e){}
const f=input.files&&input.files[0];fileUrl[key]=f?URL.createObjectURL(f):'';
const up=input.parentElement.querySelector('.pdnUp');if(up)up.textContent=f?('✓ '+f.name).slice(0,28):(key==='logo'?'Subir logo':'Subir portada');
refresh();
});
}
onFile($('rLogoFile'),'logo');onFile($('rPortadaFile'),'cover');
['rNombre','rCategoria','rTiempo','rActivo','rLogo','rPortada'].forEach(id=>{$(id)?.addEventListener('input',refresh);$(id)?.addEventListener('change',refresh)});
$('rGoogleMaps')?.addEventListener('input',()=>{
const u=$('rGoogleMaps').value;
const m=u.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)||u.match(/[?&](?:q|query|ll|destination)=(-?\d+\.\d+)(?:,|%2C)\s*(-?\d+\.\d+)/i)||u.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
if(m){if(!$('rLatitud').value)$('rLatitud').value=m[1];if(!$('rLongitud').value)$('rLongitud').value=m[2]}
});
function resetFiles(){['logo','cover'].forEach(k=>{try{fileUrl[k]&&URL.revokeObjectURL(fileUrl[k])}catch(e){}fileUrl[k]=''});form.querySelectorAll('.pdnUp').forEach((u,i)=>u.textContent=i?'Subir portada':'Subir logo')}
$('cancelRestaurant')?.addEventListener('click',()=>setTimeout(()=>{resetFiles();refresh()},0));
if(typeof window.editRestaurant==='function'){
const _e=window.editRestaurant;
window.editRestaurant=function(){const out=_e.apply(this,arguments);resetFiles();setTimeout(refresh,0);return out};
}
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('[data-open-service="crear-negocio"]'))setTimeout(refresh,60)},true);
refresh();
})();
}catch(e){console.error("[pidemas-form-negocio-modelo2]",e)}

/* ===== pidemas-acceso-negocio-modelo2 ===== */
try{
(function(){
const box=document.getElementById('accesoNegocioAdminBox');if(!box)return;
const $=id=>document.getElementById(id);
const F=id=>$(id)?.closest('.field');
const REFRESH='<svg viewBox="0 0 24 24" stroke-width="2"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/></svg>';
const form=document.createElement('div');form.className='pdaForm';
form.innerHTML=`<p class="pdaIntro">Crea la cuenta con la que el dueño entra a su panel de negocio, y administra las cuentas que ya existen.</p>
  <div class="pdaCols">
    <section class="pdaSec" id="pdaNew"><div class="pdaHead"><span><span class="pdaKicker">Nuevo acceso</span><strong>Crear cuenta para un negocio</strong></span></div></section>
    <section class="pdaSec" id="pdaList"><div class="pdaHead"><span><span class="pdaKicker">Cuentas</span><strong>Cuentas registradas <span class="pdaCount" id="pdaCount">–</span></strong></span><button type="button" class="pdaIcon" id="pdaRefresh" aria-label="Actualizar lista">${REFRESH}</button></div>
      <input id="pdaSearch" type="search" placeholder="Buscar por negocio o correo" autocomplete="off">
    </section>
  </div>`;
const nu=form.querySelector('#pdaNew'),li=form.querySelector('#pdaList');
[F('accesoNegocioId'),F('accesoNegocioEmail'),F('accesoNegocioPassword')].forEach(f=>f&&nu.appendChild(f));
if(F('accesoNegocioId'))F('accesoNegocioId').querySelector('label').textContent='Negocio';
if(F('accesoNegocioEmail'))F('accesoNegocioEmail').querySelector('label').textContent='Correo de acceso';
if(F('accesoNegocioPassword'))F('accesoNegocioPassword').querySelector('label').textContent='Contraseña inicial';
nu.insertAdjacentHTML('beforeend',`<div class="pdaPwTools"><span class="pdaMeter"><i><b id="pdaMeterBar" style="width:0"></b></i><span id="pdaMeterTxt">Mínimo 12 caracteres</span></span><button type="button" class="pdaLink" id="pdaGen">Generar contraseña segura</button></div>
    <div class="pdaNote">Entrega el correo y la contraseña al propietario por un medio privado. Podrá cambiarla después.</div>`);
const createBtn=$('crearAccesoNegocioBtn');
if(createBtn){createBtn.classList.add('pdaBtn');nu.appendChild(createBtn)}
const nmsg=$('accesoNegocioMsg');if(nmsg)nu.appendChild(nmsg);
const pwBox=$('cambiarPasswordNegocioBox');if(pwBox){li.appendChild(pwBox);pwBox.querySelector('h3').textContent='Nueva contraseña'}
const listEl=$('accesosNegocioList');if(listEl)li.appendChild(listEl);
if(pwBox){
const pwField=pwBox.querySelector('.field');
pwField?.insertAdjacentHTML('afterend','<div class="pdaPwTools"><span></span><button type="button" class="pdaLink" id="pdaGen2">Generar contraseña segura</button></div>');
}
[...box.children].forEach(ch=>{if(ch!==form)ch.remove()});
box.appendChild(form);
function gen(){
const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%*';
const a=new Uint32Array(14);crypto.getRandomValues(a);
return [...a].map(n=>chars[n%chars.length]).join('');
}
function show(input,val){if(!input)return;input.value=val;input.type='text';const eye=input.parentElement.querySelector('.passwordEyeBtn');if(eye){eye.textContent='⊗';eye.setAttribute('aria-label','Ocultar contraseña')}input.dispatchEvent(new Event('input'))}
$('pdaGen')?.addEventListener('click',()=>show($('accesoNegocioPassword'),gen()));
$('pdaGen2')?.addEventListener('click',()=>show($('cambiarPasswordNegocioInput'),gen()));
$('accesoNegocioPassword')?.addEventListener('input',()=>{
const v=$('accesoNegocioPassword').value;let sc=0;
if(v.length>=12)sc++;if(/[a-z]/.test(v)&&/[A-Z]/.test(v))sc++;if(/\d/.test(v))sc++;if(/[^A-Za-z0-9]/.test(v))sc++;
const pct=v?Math.max(10,sc*25):0;
$('pdaMeterBar').style.width=pct+'%';
$('pdaMeterTxt').textContent=!v?'Mínimo 12 caracteres':v.length<12?`Faltan ${12-v.length} caracteres`:sc>=3?'Contraseña segura':'Aceptable';
});
const accountNames=new Set(),accountIds=new Set();
function enhance(){
if(!listEl)return;
accountNames.clear();accountIds.clear();
const rows=[...listEl.querySelectorAll(':scope>.row')];
rows.forEach(row=>{
if(!row.dataset.pdaName)row.dataset.pdaName=(row.querySelector('strong')?.textContent||'').trim().toLowerCase();
const name=row.dataset.pdaName;
/* Solo cuenta como "con acceso" si tiene un correo real; una vinculación huérfana (sin correo) no bloquea */
const hasEmail=/@/.test(row.dataset.email||row.querySelector('small')?.textContent||'');
if(hasEmail){
if(row.dataset.negocioId)accountIds.add(row.dataset.negocioId);
else if(name&&name!=='negocio sin nombre')accountNames.add(name);
}
if(row.dataset.pda)return;row.dataset.pda='1';
const email=row.querySelector('small')?.textContent||'';
const badge=row.querySelector('.badge');const off=/inactiv/i.test(badge?.textContent||'');
const btns=[...row.querySelectorAll('button')];
btns.forEach(b=>{if(/contrase/i.test(b.textContent))b.textContent='Contraseña';else if(/correo/i.test(b.textContent))b.textContent='Correo'});
row.className='row pdaRow';row.innerHTML='';
const av=document.createElement('span');av.className='pdaAv';av.textContent=(name.trim().charAt(0)||'N').toUpperCase();
const tx=document.createElement('span');tx.className='pdaTxt';
const st=document.createElement('strong');st.textContent=name;
const pill=document.createElement('span');pill.className='pdaPill'+(off?' off':'');pill.textContent=off?'Inactiva':'Activa';st.appendChild(pill);
const sm=document.createElement('small');sm.textContent=email;tx.append(st,sm);
const ac=document.createElement('div');ac.className='pdaRowActions';btns.forEach(b=>ac.appendChild(b));
row.append(av,tx,ac);
});
$('pdaCount').textContent=rows.length?String(rows.length):'0';
filter();markOptions();
}
function filter(){
const q=($('pdaSearch')?.value||'').trim().toLowerCase();
listEl?.querySelectorAll(':scope>.pdaRow').forEach(r=>{r.style.display=!q||r.textContent.toLowerCase().includes(q)?'':'none'});
}
function markOptions(){
const s=$('accesoNegocioId');if(!s)return;
[...s.options].forEach(o=>{
if(!o.value)return;
const base=o.dataset.base||(o.dataset.base=o.textContent);
const has=accountIds.has(String(o.value))||accountNames.has(base.trim().toLowerCase());
o.textContent=has?base+' · ya tiene acceso':base;o.disabled=false;
});

}
if(listEl)new MutationObserver(()=>enhance()).observe(listEl,{childList:true});
const sel=$('accesoNegocioId');if(sel)new MutationObserver(()=>markOptions()).observe(sel,{childList:true});
$('pdaSearch')?.addEventListener('input',filter);
$('pdaRefresh')?.addEventListener('click',async()=>{
const b=$('pdaRefresh');b.classList.add('spin');b.disabled=true;
try{await window.cargarAccesosNegocio()}finally{b.classList.remove('spin');b.disabled=false}
});
createBtn?.addEventListener('click',()=>{
const t=setInterval(()=>{if(!createBtn.disabled){clearInterval(t);const m=$('accesoNegocioMsg')?.textContent||'';if(/correctamente/i.test(m))window.cargarAccesosNegocio?.()}},400);
});
enhance();
})();
}catch(e){console.error("[pidemas-acceso-negocio-modelo2]",e)}

/* ===== pidemas-agencias-modelo2 ===== */
try{
(function(){
const tab=document.getElementById('tab-agencias');if(!tab||typeof window.renderAdminAgencias!=='function')return;
const $=id=>document.getElementById(id);
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const REF='<svg viewBox="0 0 24 24" stroke-width="2"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/></svg>';
const EDIT='<svg viewBox="0 0 24 24" stroke-width="2"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>';
const DEL='<svg viewBox="0 0 24 24" stroke-width="2"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/></svg>';
const ui=document.createElement('div');
ui.innerHTML=`<div class="pdgTop"><span><span class="pdgKick">Encomiendas</span><strong>Agencias y destinos</strong></span><button type="button" class="pdgIcon" id="pdgRefresh" aria-label="Actualizar">${REF}</button></div>
  <div class="pdgStats"><div><span>Agencias</span><strong id="pdgNA">–</strong></div><div><span>Destinos</span><strong id="pdgND">–</strong></div></div>
  <div class="pdgCols">
    <section class="pdgSec new" id="pdgNew"><div class="pdgSecHead"><span class="pdgKick">Nueva</span><strong>Registrar agencia</strong></div></section>
    <section class="pdgSec" id="pdgList"><div class="pdgSecHead"><span class="pdgKick">Registradas</span><strong>Tus agencias</strong></div><input type="search" id="pdgSearch" placeholder="Buscar agencia o destino" autocomplete="off"></section>
  </div>`;
const nw=ui.querySelector('#pdgNew'),ls=ui.querySelector('#pdgList');
const fNombre=$('agNombre')?.closest('.field'),fDest=$('agDestinosInputs')?.closest('.field');
if(fNombre)nw.appendChild(fNombre);
if(fDest){nw.appendChild(fDest);fDest.querySelector('label').textContent='Destinos que atiende'}
nw.insertAdjacentHTML('beforeend','<button type="button" class="pdgLinkBtn" id="pdgAddDestInput">+ Agregar otro destino</button><p class="pdgHint">Presiona Enter en un destino para escribir el siguiente.</p>');
const save=$('agGuardar');if(save){save.textContent='Guardar agencia';nw.appendChild(save)}
const msg=$('agMsg');if(msg)nw.appendChild(msg);
const list=$('agLista');if(list)ls.appendChild(list);
[...tab.children].forEach(c=>c.classList.add('pdgHidden'));
tab.appendChild(ui);ui.style.display='block';
const box=$('agDestinosInputs');
function decorate(){
if(!box)return;
const act=document.activeElement;
box.querySelectorAll(':scope>.ag-destino-input').forEach(inp=>{
const row=document.createElement('div');row.className='pdgDestRow';inp.before(row);row.appendChild(inp);
row.insertAdjacentHTML('beforeend','<button type="button" class="pdgX" aria-label="Quitar destino">×</button>');
});
if(act&&box.contains(act)&&document.activeElement!==act)act.focus();
const rows=box.querySelectorAll('.pdgDestRow');
rows.forEach((r,i)=>{r.querySelector('.pdgX').style.visibility=rows.length>1?'visible':'hidden';const inp=r.querySelector('input');if(inp&&!inp.value)inp.placeholder=i===0?'Ej. Lima':'Otro destino'});
}
if(box){
new MutationObserver(decorate).observe(box,{childList:true});
box.addEventListener('click',e=>{const x=e.target.closest('.pdgX');if(!x)return;x.closest('.pdgDestRow').remove();decorate()});
box.addEventListener('keydown',e=>{
if(e.key!=='Enter'||!e.target.classList.contains('ag-destino-input'))return;e.preventDefault();
const all=[...box.querySelectorAll('.ag-destino-input')];
if(!e.target.value.trim())return;
if(e.target===all[all.length-1])$('agAgregarDestino')?.click();else all[all.indexOf(e.target)+1].focus();
});
decorate();
}
$('agNombre')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();box?.querySelector('.ag-destino-input')?.focus()}});
$('pdgAddDestInput')?.addEventListener('click',()=>$('agAgregarDestino')?.click());
window.renderAdminAgencias=function(){
if(!list)return;
$('pdgNA').textContent=adminAgencias.length;$('pdgND').textContent=adminDestinos.filter(d=>adminAgencias.some(a=>String(a.id)===String(d.agencia_id))).length;
if(!adminAgencias.length){list.innerHTML='<div class="pdgEmpty">Todavía no hay agencias. Registra la primera en el formulario.</div>';return}
const q=($('pdgSearch')?.value||'').trim().toLocaleLowerCase('es');
const html=adminAgencias.map(a=>{
const ds=adminDestinos.filter(d=>String(d.agencia_id)===String(a.id));
if(q&&!String(a.nombre||'').toLocaleLowerCase('es').includes(q)&&!ds.some(d=>String(d.destino_final||'').toLocaleLowerCase('es').includes(q)))return '';
return `<div class="pdgAg" data-id="${E(a.id)}">
        <div class="pdgAgHead"><span class="pdgAv">${E(String(a.nombre||'A').charAt(0).toUpperCase())}</span><span><strong>${E(a.nombre)}</strong><small>${ds.length} destino${ds.length===1?'':'s'}</small></span>
          <button type="button" class="pdgIcon" data-act="editAg" aria-label="Editar nombre">${EDIT}</button><button type="button" class="pdgIcon" data-act="delAg" aria-label="Eliminar agencia">${DEL}</button></div>
        <div class="pdgChips">${ds.length?ds.map(d=>`<span class="pdgChip">${E(d.destino_final)}<button type="button" data-act="editD" data-d="${E(d.id)}" aria-label="Editar destino">✎</button><button type="button" data-act="delD" data-d="${E(d.id)}" aria-label="Eliminar destino">×</button></span>`).join(''):'<span class="pdgNone">Sin destinos registrados</span>'}</div>
        <div class="pdgAddDest"><input type="text" placeholder="Agregar destino a ${E(a.nombre)}" autocomplete="off"><button type="button" data-act="addD">Agregar</button></div>
      </div>`;
}).join('');
list.innerHTML=html||'<div class="pdgEmpty">Ninguna agencia coincide con la búsqueda.</div>';
};
async function addDest(card){
const inp=card.querySelector('.pdgAddDest input');const name=(inp?.value||'').trim();const id=card.dataset.id;
if(!name){inp?.focus();return}
if(adminDestinos.some(d=>String(d.agencia_id)===String(id)&&String(d.destino_final||'').trim().toLowerCase()===name.toLowerCase())){msgBox($('agMsg'),'Ese destino ya está registrado en esta agencia.');return}
const btn=card.querySelector('[data-act=addD]');btn.disabled=true;btn.textContent='…';
const {error}=await db.from('agencia_destinos').insert({agencia_id:id,destino_final:name,activo:true});
btn.disabled=false;btn.textContent='Agregar';
if(error){msgBox($('agMsg'),'No se pudo agregar el destino: '+error.message);return}
await loadAdminAgencias();
setTimeout(()=>list.querySelector(`.pdgAg[data-id="${CSS.escape(String(id))}"] .pdgAddDest input`)?.focus(),50);
}
list?.addEventListener('click',e=>{
const b=e.target.closest('[data-act]');if(!b)return;const card=b.closest('.pdgAg');const id=card?.dataset.id;
const a=b.dataset.act;
if(a==='editAg')return editAdminAgencia(id);
if(a==='delAg')return deleteAdminAgencia(id);
if(a==='editD')return editAdminDestino(b.dataset.d);
if(a==='delD')return deleteAdminDestino(b.dataset.d);
if(a==='addD')return addDest(card);
});
list?.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.closest('.pdgAddDest')){e.preventDefault();addDest(e.target.closest('.pdgAg'))}});
$('pdgSearch')?.addEventListener('input',()=>window.renderAdminAgencias());
$('pdgRefresh')?.addEventListener('click',async()=>{const b=$('pdgRefresh');b.classList.add('spin');try{await loadAdminAgencias()}finally{b.classList.remove('spin')}});
try{window.renderAdminAgencias()}catch(e){}
})();
}catch(e){console.error("[pidemas-agencias-modelo2]",e)}

/* ===== pidemas-clientes-modelo2 ===== */
try{
(function(){
const tab=document.getElementById('tab-clientes');if(!tab||typeof window.renderClientes!=='function')return;
const $=id=>document.getElementById(id);
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const N=v=>String(v||'').toLocaleLowerCase('es').normalize('NFD').replace(/[̀-ͯ]/g,'');
const REF='<svg viewBox="0 0 24 24" stroke-width="2"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/></svg>';
const formCard=$('clienteFormTitle')?.closest('.card');
const search=$('buscarClientesRegistrados');const list=$('clientesList');
const ui=document.createElement('div');
ui.innerHTML=`<div class="pdcTop"><span><span class="pdcKick">Principal</span><strong>Clientes</strong></span><button type="button" class="pdcIcon" id="pdcRefresh" aria-label="Actualizar">${REF}</button></div>
    <div class="pdcStats"><div><span>Clientes</span><strong id="pdcN">–</strong></div><div><span>Con ubicación</span><strong id="pdcU">–</strong></div><div><span>Con DNI</span><strong id="pdcD">–</strong></div></div>
    <div class="pdcBar" id="pdcBar"><button type="button" class="pdcBtn" id="pdcNew">+ Nuevo</button></div>
    <div id="pdcFormSlot"></div><div id="pdcListSlot"></div>`;
[...tab.children].forEach(c=>c.classList.add('pdcHidden'));
tab.appendChild(ui);
if(search){search.placeholder='Buscar por nombre, número, DNI o dirección';$('pdcBar').prepend(search)}
if(formCard){
formCard.classList.add('pdcForm');formCard.hidden=true;formCard.removeAttribute('style');
const t=$('clienteFormTitle');const head=document.createElement('div');head.className='pdcFormHead';t.before(head);head.appendChild(t);
head.insertAdjacentHTML('beforeend','<button type="button" class="pdcClose" aria-label="Cerrar">×</button>');
const F=id=>$(id)?.closest('.field');
const grid=formCard.querySelector('.grid');
const p1=document.createElement('div');p1.className='pdcPair';[F('clienteNombre'),F('clienteTelefono')].forEach(f=>f&&p1.appendChild(f));
const p2=document.createElement('div');p2.className='pdcPair';[F('clienteDireccion'),F('clienteDocumento')].forEach(f=>f&&p2.appendChild(f));
const fu=F('clienteUbicacion');
grid.before(p1);grid.before(p2);if(fu)grid.before(fu);grid.classList.add('pdcHidden');
const u=$('clienteUbicacion');if(u){const w=document.createElement('div');w.className='pdcWithBtn';u.before(w);w.appendChild(u);w.insertAdjacentHTML('beforeend','<button type="button" class="pdcMini" id="pdcPaste">Pegar</button>')}
$('clienteTelefono')?.setAttribute('inputmode','tel');
const cancel=$('cancelarCliente');if(cancel)cancel.textContent='Cancelar';
$('pdcFormSlot').appendChild(formCard);
}
if(list)$('pdcListSlot').appendChild(list);
function openForm(){if(!formCard)return;formCard.hidden=false;setTimeout(()=>{formCard.scrollIntoView({behavior:'smooth',block:'start'});$('clienteNombre')?.focus({preventScroll:true})},30)}
function closeForm(){if(!formCard)return;try{limpiarFormularioCliente();clearMsg($('clienteMsg'))}catch(e){}formCard.hidden=true}
$('pdcNew')?.addEventListener('click',()=>{try{limpiarFormularioCliente();clearMsg($('clienteMsg'))}catch(e){}const q=(search?.value||'').trim();if(q){if(/^\d[\d\s]{5,}$/.test(q))$('clienteTelefono').value=q.replace(/\s/g,'');else $('clienteNombre').value=q}openForm()});
formCard?.querySelector('.pdcClose')?.addEventListener('click',closeForm);
$('cancelarCliente')?.addEventListener('click',()=>setTimeout(()=>{formCard.hidden=true},0));
$('pdcPaste')?.addEventListener('click',async()=>{const u=$('clienteUbicacion');try{const t=await navigator.clipboard.readText();if(t)u.value=t.trim()}catch(e){u.focus()}});
formCard?.addEventListener('keydown',e=>{if(e.key!=='Enter'||e.target.tagName!=='INPUT')return;const f=[...formCard.querySelectorAll('input')].filter(x=>x.offsetParent);const i=f.indexOf(e.target);e.preventDefault();if(f[i+1])f[i+1].focus();else $('guardarCliente')?.click()});
$('guardarCliente')?.addEventListener('click',()=>{const t0=Date.now();const t=setInterval(()=>{if(Date.now()-t0>8000){clearInterval(t);return}if(!$('clienteNombre').value&&!editingClienteId){clearInterval(t);formCard.hidden=true}},300)});
if(typeof window.editarClienteAdmin==='function'){
const _ed=window.editarClienteAdmin;
window.editarClienteAdmin=function(){const out=_ed.apply(this,arguments);openForm();return out};
}
const _origRender=window.renderClientes;
try{search?.removeEventListener('input',_origRender)}catch(e){}
const opened=new Set();let limit=60;
const digits=v=>String(v||'').replace(/\D/g,'');
const wa=t=>{const d=digits(t);if(!d)return '';return 'https://wa.me/'+(d.startsWith('51')?d:(d.length===9?'51'+d:d))};
window.renderClientes=function(){
if(!list)return;
const all=Array.isArray(allClientes)?allClientes:[];
$('pdcN').textContent=all.length;
$('pdcU').textContent=all.filter(c=>clienteUbicacion(c)).length;
$('pdcD').textContent=all.filter(c=>clienteDocumento(c)).length;
if(!all.length){list.innerHTML='<div class="pdcEmpty">Todavía no hay clientes. Toca «+ Nuevo» para registrar el primero.</div>';return}
const q=N(search?.value||'').trim();const qd=digits(search?.value||'');
const rows=all.filter(c=>{if(!q)return true;const t=N([clienteNombre(c),clienteDireccion(c),clienteUbicacion(c)].join(' '));return t.includes(q)||(qd.length>=3&&(digits(clienteTelefono(c)).includes(qd)||digits(clienteDocumento(c)).includes(qd)))});
if(!rows.length){list.innerHTML=`<div class="pdcEmpty">No hay clientes con «${E(search.value.trim())}». Toca «+ Nuevo» para registrarlo.</div>`;return}
let last='';const shown=rows.slice(0,limit);
let html=shown.map(c=>{
const name=clienteNombre(c)||'Sin nombre';const L=N(name).charAt(0).toUpperCase()||'#';
const sep=!q&&L!==last?`<div class="pdcLetter">${E(L)}</div>`:'';last=L;
const tel=clienteTelefono(c),dni=clienteDocumento(c),dir=clienteDireccion(c),ub=clienteUbicacion(c);
const id=String(c.id);const w=wa(tel);
const ubLink=/^https?:\/\//i.test(ub)?ub:(ub?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(ub):'');
return `${sep}<div class="pdcRow ${opened.has(id)?'open':''}" data-id="${E(id)}">
        <button type="button" class="pdcHead"><span class="pdcAv">${E(name.trim().split(/\s+/).map(x=>x[0]||'').slice(0,2).join('').toUpperCase())}</span><span class="pdcTxt"><strong>${E(name)}</strong><small>${E([tel,dir].filter(Boolean).join(' · ')||'Sin datos de contacto')}</small></span><span class="pdcChev">›</span></button>
        <div class="pdcBody">
          <div class="pdcInfo"><span>Número</span><b>${E(tel||'—')}</b><span>DNI</span><b>${E(dni||'—')}</b><span>Dirección</span><b>${E(dir||'—')}</b><span>Ubicación</span><b>${ubLink?`<a href="${E(ubLink)}" target="_blank" rel="noopener">Ver en mapa</a>`:'—'}</b></div>
          <div class="pdcAct"><a href="${w?E(w):'#'}" target="_blank" rel="noopener" ${w?'':'aria-disabled="true"'}>WhatsApp</a><a href="${tel?'tel:'+E(digits(tel)):'#'}" ${tel?'':'aria-disabled="true"'}>Llamar</a><button type="button" data-act="edit">Editar</button><button type="button" class="del" data-act="del">Borrar</button></div>
        </div></div>`;
}).join('');
if(rows.length>limit)html+=`<button type="button" class="pdcMore" id="pdcMore">Ver ${Math.min(60,rows.length-limit)} más (${rows.length-limit} restantes)</button>`;
list.innerHTML=html;
};
list?.addEventListener('click',e=>{
if(e.target.closest('#pdcMore')){limit+=60;window.renderClientes();return}
const row=e.target.closest('.pdcRow');if(!row)return;const id=row.dataset.id;
if(e.target.closest('.pdcHead')){row.classList.toggle('open');row.classList.contains('open')?opened.add(id):opened.delete(id);return}
const b=e.target.closest('[data-act]');if(!b)return;
if(b.dataset.act==='edit')editarClienteAdmin(id);
if(b.dataset.act==='del')borrarClienteAdmin(id);
});
search?.addEventListener('input',()=>{limit=60;window.renderClientes()});
$('pdcRefresh')?.addEventListener('click',async()=>{const b=$('pdcRefresh');b.classList.add('spin');try{await loadClientes()}finally{b.classList.remove('spin')}});
try{window.renderClientes()}catch(e){}
})();
}catch(e){console.error("[pidemas-clientes-modelo2]",e)}

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

/* ===== pdcj-js ===== */
try{
(function(){
const C=window.PdCaja,tab=document.getElementById('tab-caja');if(!C||!tab)return;
const $=id=>document.getElementById(id);
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'S/ '+(Number(n)||0).toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2});
const REF='<svg viewBox="0 0 24 24" stroke-width="2"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/></svg>';
const dayKey=d=>{const x=new Date(d);return x.toLocaleDateString('es-PE',{weekday:'long',day:'2-digit',month:'short'})};
const hm=d=>new Date(d).toLocaleTimeString('es-PE',{hour:'numeric',minute:'2-digit'});
const dt=d=>new Date(d).toLocaleString('es-PE',{day:'2-digit',month:'short',hour:'numeric',minute:'2-digit'});
const title=tab.querySelector(':scope>h2');
const sueldo=document.getElementById('tab-sueldo');
[...tab.children].forEach(ch=>{if(ch!==title&&ch!==sueldo&&!ch.contains(sueldo))ch.remove()});
const root=document.createElement('div');root.className='pdcj';
root.innerHTML=`<div class="pdcjTop"><p class="pdcjIntro">Efectivo que tiene cada motorizado: cobros de pedidos, efectivo que le entregas y pagos que hace. Al recibir su caja completa, empieza una caja nueva.</p><button type="button" class="pdcjIcon" id="pdcjRefresh" aria-label="Actualizar">${REF}</button></div>
  <section class="pdcjCard dark" id="pdcjTotal"><span class="pdcjKick">Saldo total en cajas</span><span class="pdcjAmt">—</span><span class="pdcjSub">Cargando…</span></section>
  <input class="pdcjSearch" id="pdcjSearch" type="search" placeholder="Buscar motorizado" autocomplete="off">
  <div class="pdcjMotos" id="pdcjMotos"></div>
  <div id="pdcjDetail" hidden>
    <section class="pdcjCard dark" id="pdcjHero"></section>
    <section class="pdcjCard">
      <div class="pdcjSeg" role="tablist"><button type="button" class="on" data-pane="recibir">Recibir caja</button><button type="button" data-pane="dar">Darle efectivo</button></div>
      <div class="pdcjPane" id="pdcjRecibir">
        <div class="pdcjField"><label for="pdcjRecAmount">Monto que te entrega (S/)</label><input class="big" type="number" id="pdcjRecAmount" min="0.01" step="0.01" inputmode="decimal"></div>
        <div class="pdcjField"><label for="pdcjRecNote">Observación (opcional)</label><input id="pdcjRecNote" maxlength="200" placeholder="Ej. Entregó en efectivo / Yape"></div>
        <p class="pdcjNote" id="pdcjRecHint"></p>
        <button type="button" class="pdcjBtn" id="pdcjRecBtn">Registrar entrega</button>
      </div>
      <div class="pdcjPane" id="pdcjDar" hidden>
        <div class="pdcjField"><label for="pdcjFundAmount">Monto que le das (S/)</label><input class="big" type="number" id="pdcjFundAmount" min="0.01" step="0.01" inputmode="decimal"></div>
        <div class="pdcjField"><label>Motivo</label><div class="pdcjChips" id="pdcjFundChips"><button type="button">Sencillo para vueltos</button><button type="button">Para compra</button><button type="button">Para encomienda</button><button type="button">Otro</button></div><input id="pdcjFundNote" maxlength="200" placeholder="Detalle del motivo"></div>
        <button type="button" class="pdcjBtn" id="pdcjFundBtn">Darle efectivo</button>
      </div>
      <div class="pdcjMsg" id="pdcjMsg" role="status" aria-live="polite"></div>
    </section>
    <section class="pdcjCard"><div class="pdcjHead"><span><span class="pdcjKick">Caja abierta</span><strong>Movimientos</strong></span></div><div id="pdcjMovs"></div></section>
    <section class="pdcjCard"><div class="pdcjHead"><span><span class="pdcjKick">Historial</span><strong>Cajas entregadas</strong></span></div><div id="pdcjClosed"></div></section>
  </div>`;
if(sueldo&&sueldo.parentElement===tab)tab.insertBefore(root,sueldo);else tab.appendChild(root);
const syncSueldo=()=>{const on=sueldo&&!sueldo.classList.contains('hidden');root.style.display=on?'none':'';if(title)title.style.display=on?'none':''};
if(sueldo)new MutationObserver(syncSueldo).observe(sueldo,{attributes:true,attributeFilter:['class']});syncSueldo();
let motos=[],byMoto=new Map(),current=null,limit=40,closedLimit=10,loading=null;
const db=()=>window.db;
async function fetchAll(motoId){
const rows=[];const size=1000;
for(let from=0;;from+=size){
let q=db().from('movimientos_caja').select('id,motorizado_id,pedido_id,tipo,monto,descripcion,creado_en');
if(motoId)q=q.eq('motorizado_id',motoId);
const {data,error}=await q.order('creado_en',{ascending:false}).order('id',{ascending:false}).range(from,from+size-1);
if(error)throw error;const page=data||[];rows.push(...page);
if(page.length<size||rows.length>=100000)break;
}
return rows;
}
async function loadAll(){
if(loading)return loading;
loading=(async()=>{
const b=$('pdcjRefresh');b.classList.add('spin');
try{
for(let i=0;i<20&&!db();i++)await new Promise(r=>setTimeout(r,300));
const [mr,movs]=await Promise.all([db().from('motorizados').select('id,nombre_completo,telefono,activo').order('nombre_completo'),fetchAll()]);
if(mr.error)throw mr.error;
motos=mr.data||[];byMoto=new Map();
movs.forEach(m=>{const k=String(m.motorizado_id);if(!byMoto.has(k))byMoto.set(k,[]);byMoto.get(k).push(m)});
renderList();if(current)renderDetail();
}catch(e){$('pdcjMotos').innerHTML='<div class="pdcjEmpty" style="grid-column:1/-1">No se pudo leer la caja: '+E(e.message||e)+'</div>'}
finally{b.classList.remove('spin')}
})();
try{await loading}finally{loading=null}
}
async function reloadOne(){
if(!current)return;
try{byMoto.set(String(current.id),await fetchAll(current.id))}catch(e){say('No se pudo actualizar: '+(e.message||e))}
renderList();renderDetail();
}
const balOf=m=>C.balance(byMoto.get(String(m.id))||[]);
function renderList(){
const withMov=motos.filter(m=>m.activo!==false||Math.abs(balOf(m))>0.004);
const total=withMov.reduce((s,m)=>s+balOf(m),0);
const open=withMov.filter(m=>Math.abs(balOf(m))>0.004).length;
$('pdcjTotal').innerHTML=`<span class="pdcjKick">Saldo total en cajas</span><span class="pdcjAmt">${money(total)}</span><span class="pdcjSub">${open} de ${withMov.length} motorizados con efectivo pendiente de entregar</span>`;
const st=$('pdStatCashBoxes');if(st)st.textContent=money(total);
const q=($('pdcjSearch').value||'').trim().toLowerCase();
const list=withMov.filter(m=>!q||String(m.nombre_completo||'').toLowerCase().includes(q)||String(m.telefono||'').includes(q))
.sort((a,b)=>Math.abs(balOf(b))-Math.abs(balOf(a))||String(a.nombre_completo).localeCompare(String(b.nombre_completo)));
$('pdcjMotos').innerHTML=list.length?list.map(m=>{const b=balOf(m),n=String(m.nombre_completo||'Motorizado').trim();return `<button type="button" class="pdcjMoto ${current&&String(current.id)===String(m.id)?'on':''}" data-id="${E(m.id)}"><i>${E(n.split(/\s+/).map(w=>w[0]||'').slice(0,2).join('').toUpperCase())}</i><span>${E(n)}</span><b class="${Math.abs(b)<0.005?'zero':b<0?'neg':''}">${money(b)}</b></button>`}).join(''):'<div class="pdcjEmpty" style="grid-column:1/-1">No hay motorizados que coincidan.</div>';
}
$('pdcjSearch').addEventListener('input',renderList);
$('pdcjMotos').addEventListener('click',e=>{const b=e.target.closest('.pdcjMoto');if(!b)return;const m=motos.find(x=>String(x.id)===String(b.dataset.id));if(!m)return;select(m)});
function select(m){
current=m;limit=40;closedLimit=10;window.currentAdminCashMoto=m;
['pdcjRecAmount','pdcjRecNote','pdcjFundAmount','pdcjFundNote'].forEach(id=>{$(id).value='';delete $(id).dataset.touched});
$('pdcjFundChips').querySelectorAll('button').forEach(x=>x.classList.remove('on'));say('');
renderList();renderDetail();$('pdcjDetail').hidden=false;
setTimeout(()=>$('pdcjHero').scrollIntoView({behavior:'smooth',block:'start'}),30);
}
function say(t){$('pdcjMsg').textContent=t||''}
function movRow(m,canDelete){
const k=C.kind(m),a=C.amount(m),inc=m.tipo==='ingreso';
return `<div class="pdcjMov"><span><strong>${E(C.clean(m))}<span class="pdcjTag ${inc?'in':''}">${E(C.LABEL[k])}</span></strong><small>${E(hm(m.creado_en))}${m.pedido_id?' · Pedido #'+E(String(m.pedido_id).slice(0,8).toUpperCase()):''}</small></span>
      <span class="pdcjMovR"><b class="${inc?'':'out'}">${inc?'+':'−'} ${money(a)}</b>${canDelete?`<button type="button" class="pdcjDel" data-del="${E(m.id)}" aria-label="Borrar movimiento">×</button>`:''}</span></div>`;
}
function grouped(list,canDelete){
let last='';return list.map(m=>{const k=dayKey(m.creado_en);const h=k!==last?`<div class="pdcjDay"><span>${E(k)}</span></div>`:'';last=k;return h+movRow(m,canDelete)}).join('');
}
function renderDetail(){
if(!current)return;
const all=byMoto.get(String(current.id))||[];
const sp=C.split(all),s=C.summary(sp.current);
const n=E(current.nombre_completo||'Motorizado');
$('pdcjHero').innerHTML=`<span class="pdcjKick">Caja de</span><span class="pdcjName">${n}</span>
      <span class="pdcjAmt ${s.balance<0?'neg':''}">${money(s.balance)}</span>
      <span class="pdcjSub">${s.balance<0?'Saldo negativo: pagó más de lo que cobró. Dale efectivo para cuadrar.':'Efectivo que debe entregarte'}${sp.openedAt?' · caja abierta desde '+E(dt(sp.openedAt)):''}</span>
      <div class="pdcjStats"><div><span>Cobros</span><strong>${money(s.cobros)}</strong></div><div><span>Le diste</span><strong>${money(s.fondos)}</strong></div><div><span>Pagos</span><strong>${money(s.pagos)}</strong></div><div><span>Gastos y entregas</span><strong>${money(s.gastos+s.entregas)}</strong></div></div>`;
const ra=$('pdcjRecAmount');if(!ra.dataset.touched)ra.value=s.balance>0.004?s.balance.toFixed(2):'';
updateRecHint(s.balance);
const cur=sp.current;
$('pdcjMovs').innerHTML=cur.length?grouped(cur.slice(0,limit),true)+(cur.length>limit?`<button type="button" class="pdcjMore" data-more="1">Ver más (${cur.length-limit} restantes)</button>`:''):'<div class="pdcjEmpty">Sin movimientos desde la última entrega.</div>';
const cl=sp.closed;
$('pdcjClosed').innerHTML=cl.length?cl.slice(0,closedLimit).map(c=>{const amt=C.amount(c.closer);const reset=C.kind(c.closer)==='reinicio';return `<details class="pdcjClosed"><summary><span><strong>${reset?'Reinicio de caja':'Entregó '+money(amt)}</strong><small>${E(dt(c.closer.creado_en))} · ${c.summary.count} movimientos · cobros ${money(c.summary.cobros)} · pagos ${money((c.summary.pagos||0)+(c.summary.gastos||0))}</small></span><span class="pdcjTag">${reset?'Reinicio':'Cerrada'}</span></summary><div>${c.movs.length?grouped(c.movs,false):'<div class="pdcjEmpty">Sin movimientos.</div>'}</div></details>`}).join('')+(cl.length>closedLimit?`<button type="button" class="pdcjMore" data-more-closed="1">Ver más cajas (${cl.length-closedLimit})</button>`:''):'<div class="pdcjEmpty">Todavía no te ha entregado ninguna caja.</div>';
}
function updateRecHint(bal){
if(bal===undefined)bal=current?C.balance(byMoto.get(String(current.id))||[]):0;
const v=Number($('pdcjRecAmount').value),btn=$('pdcjRecBtn'),hint=$('pdcjRecHint');
if(bal<=0.004){hint.textContent=bal<0?'No hay efectivo por recibir: el saldo es negativo.':'No hay efectivo por recibir en esta caja.';btn.disabled=true;btn.textContent='Registrar entrega';return}
btn.disabled=false;
if(!v||v<=0){hint.textContent='Saldo de la caja: '+money(bal)+'. Si te entrega todo, la caja se cierra y empieza una nueva.';btn.textContent='Registrar entrega';return}
if(v>bal+0.004){hint.textContent='El monto supera el saldo de la caja ('+money(bal)+').';btn.disabled=true;return}
if(Math.abs(v-bal)<0.005){hint.textContent='Entrega total: la caja quedará en S/ 0.00 y empezará una caja nueva.';btn.textContent='Recibir caja completa · '+money(v)}
else{hint.textContent='Entrega parcial: la caja sigue abierta con '+money(bal-v)+' pendientes.';btn.textContent='Recibir entrega parcial · '+money(v)}
}
$('pdcjRecAmount').addEventListener('input',()=>{$('pdcjRecAmount').dataset.touched='1';updateRecHint()});
root.querySelector('.pdcjSeg').addEventListener('click',e=>{const b=e.target.closest('[data-pane]');if(!b)return;root.querySelectorAll('.pdcjSeg button').forEach(x=>x.classList.toggle('on',x===b));$('pdcjRecibir').hidden=b.dataset.pane!=='recibir';$('pdcjDar').hidden=b.dataset.pane!=='dar';say('')});
$('pdcjFundChips').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$('pdcjFundChips').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));const n=$('pdcjFundNote');if(b.textContent==='Otro'){n.value='';n.focus()}else n.value=b.textContent});
$('pdcjRecBtn').addEventListener('click',async()=>{
if(!current)return;
const bal=C.balance(byMoto.get(String(current.id))||[]);
const v=C.r2($('pdcjRecAmount').value);const note=$('pdcjRecNote').value.trim();
if(!(v>0)||v>bal+0.004){say('Revisa el monto.');return}
if(/^\d+([.,]\d+)?$/.test(note)){say('En Observación escribiste solo un número ('+note+'). Eso es una nota, no el monto. Si es lo que te entrega, corrígelo arriba en "Monto que te entrega".');$('pdcjRecNote').focus();return}
const total=Math.abs(v-bal)<0.005;
if(!(await pdConfirmar((total?'¿Recibir la caja completa de ':'¿Registrar entrega parcial de ')+(current.nombre_completo||'este motorizado')+' por '+money(v)+'?')))return;
const btn=$('pdcjRecBtn');btn.disabled=true;say('Guardando…');
const descripcion=(total?'LIQUIDACIÓN DE CAJA':'ENTREGA PARCIAL DE CAJA')+(note?' · '+note:'');
const {data,error}=await db().from('movimientos_caja').insert({motorizado_id:current.id,tipo:'retiro',monto:v,descripcion}).select('id');
if(error||!data||!data.length){say('No se pudo registrar: '+(error?.message||'Supabase no confirmó el registro.'));btn.disabled=false;return}
$('pdcjRecNote').value='';delete $('pdcjRecAmount').dataset.touched;
await reloadOne();say(total?'Caja recibida. Empieza una caja nueva.':'Entrega parcial registrada.');
});
$('pdcjFundBtn').addEventListener('click',async()=>{
if(!current)return;
const v=C.r2($('pdcjFundAmount').value),note=$('pdcjFundNote').value.trim();
if(!(v>0)){say('Escribe el monto que le das.');return}
if(!note){say('Elige o escribe el motivo.');return}
const btn=$('pdcjFundBtn');btn.disabled=true;say('Guardando…');
const {error}=await db().from('movimientos_caja').insert({motorizado_id:current.id,tipo:'ingreso',monto:v,descripcion:'INGRESO DE ADMINISTRADOR · '+note});
btn.disabled=false;
if(error){say('No se pudo registrar: '+error.message);return}
$('pdcjFundAmount').value='';$('pdcjFundNote').value='';$('pdcjFundChips').querySelectorAll('button').forEach(x=>x.classList.remove('on'));
await reloadOne();say('Se agregaron '+money(v)+' a su caja.');
});
root.addEventListener('click',async e=>{
if(e.target.closest('[data-more]')){limit+=40;renderDetail();return}
if(e.target.closest('[data-more-closed]')){closedLimit+=10;renderDetail();return}
const d=e.target.closest('[data-del]');if(!d||!current)return;
const motivo=(await pdPedir('¿Por qué borras este movimiento? (ej. monto mal escrito)'));if(motivo===null)return;
if(!motivo.trim()){pdAviso('Escribe un motivo para borrar el movimiento.');return}
const {data,error}=await db().from('movimientos_caja').delete().eq('id',d.dataset.del).eq('motorizado_id',current.id).select('id');
if(error||!data||!data.length){say('No se pudo borrar: '+(error?.message||'revisa el permiso DELETE de movimientos_caja.'));return}
console.info('[Caja] Movimiento borrado',d.dataset.del,'motivo:',motivo.trim());
await reloadOne();say('Movimiento borrado.');
});
$('pdcjRefresh').addEventListener('click',()=>loadAll());
window.loadAdminCash=loadAll;
window.openAdminCashDetail=m=>{const x=motos.find(y=>String(y.id)===String(m&&m.id))||m;if(x)select(x)};
window.pidemasCycleMovsFinal=movs=>C.cycleWithAmounts(movs);
new MutationObserver(()=>{if(!tab.classList.contains('hidden'))loadAll()}).observe(tab,{attributes:true,attributeFilter:['class']});
if(!tab.classList.contains('hidden'))loadAll();
})();
}catch(e){console.error("[pdcj-js]",e)}

/* ===== pdh-js ===== */
try{
(function(){
const dash=document.getElementById('pidemasAdminDashboard');if(!dash||document.getElementById('pdhHome'))return;
const $=id=>document.getElementById(id);
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'S/ '+(Number(n)||0).toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2});
const code=id=>'#'+String(id||'').slice(0,8).toUpperCase();
const limaKey=d=>new Date(d).toLocaleDateString('en-CA',{timeZone:'America/Lima'});
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const ago=d=>{const m=Math.round((Date.now()-new Date(d).getTime())/60000);if(!(m>=0))return '';if(m<1)return 'ahora';if(m<60)return 'hace '+m+' min';const h=Math.floor(m/60);return h<24?'hace '+h+' h':new Date(d).toLocaleDateString('es-PE',{day:'2-digit',month:'short'})};
const ini=n=>String(n||'?').trim().split(/\s+/).map(w=>w[0]||'').slice(0,2).join('').toUpperCase();
const root=document.createElement('div');root.id='pdhHome';
root.innerHTML=`<button type="button" class="h-me" id="pdhMe" aria-label="Mi perfil">R</button>
    <div class="h-sheet" id="pdhSheet" hidden><div class="h-sheetBg" data-close="1"></div><div class="h-sheetCard" role="dialog" aria-modal="true" aria-label="Mi perfil">
      <div class="h-head"><span><span class="h-kick">Administrador</span><strong>Mi perfil</strong></span><button type="button" class="h-x" data-close="1" aria-label="Cerrar">×</button></div>
      <div class="h-meBig" id="pdhMeBig">R</div>
      <label class="h-lbl">Tu nombre<input id="pdhName" maxlength="40" placeholder="Ej. Roberto" autocomplete="given-name"></label>
      <label class="h-lbl">WhatsApp de Administración<input id="pdhWa" type="tel" inputmode="numeric" maxlength="15" placeholder="9 dígitos, ej. 986233533" autocomplete="off"></label>
      <p class="h-note">A este número los motorizados envían la guía y clave de las encomiendas y los avisos de problemas.</p>
      <p class="h-note" id="pdhMail"></p>
      <button type="button" class="h-btn" id="pdhQrBtn" style="background:#fff;color:var(--fr-ink);border:1px solid var(--fr-line);margin-bottom:8px">QR Yape</button>
      <button type="button" class="h-btn" id="pdhSave">Guardar</button>
      <p class="h-note" id="pdhMsg" role="status"></p>
    </div></div>`;
dash.prepend(root);
try{const hd=document.querySelector('header.top'),bl=document.getElementById('pdaBell'),me=document.getElementById('pdhMe');if(hd&&bl&&me)hd.insertBefore(me,bl)}catch(e){}
let adminName=LS.get('pd_admin_name','')||'Roberto',uid=null;
function applyName(){
$('pdhMe').textContent=ini(adminName);$('pdhMeBig').textContent=ini(adminName);
window.adminProfile=Object.assign(window.adminProfile||{},{nombre:adminName});
}
async function loadProfile(){
const db=window.db;if(!db)return;
try{const {data:{session}}=await db.auth.getSession();uid=session?.user?.id||null;$('pdhMail').textContent=session?.user?.email?'Cuenta: '+session.user.email:'';
if(uid){const {data}=await db.from('perfiles').select('*').eq('id',uid).maybeSingle();const n=data&&(data.nombre_completo||data.nombre);if(n){adminName=String(n).trim().split(/\s+/)[0];LS.set('pd_admin_name',adminName)}}
}catch(e){}
applyName();
}
$('pdhMe').onclick=()=>{$('pdhName').value=adminName;$('pdhMsg').textContent='';$('pdhSheet').hidden=false;setTimeout(()=>$('pdhName').focus(),50)};
$('pdhSheet').addEventListener('click',e=>{if(e.target.closest('[data-close]'))$('pdhSheet').hidden=true});
$('pdhQrBtn').addEventListener('click',()=>{if(typeof window.__pdmOpen==='function')window.__pdmOpen('qryape')});
$('pdhSave').onclick=async()=>{
const n=$('pdhName').value.trim();if(!n){$('pdhMsg').textContent='Escribe tu nombre.';return}
adminName=n;LS.set('pd_admin_name',n);applyName();
let saved=false;try{if(uid&&window.db){const {data,error}=await window.db.from('perfiles').update({nombre_completo:n}).eq('id',uid).select('id').maybeSingle();saved=!error&&!!data}}catch(e){}
$('pdhMsg').textContent=saved?'✓ Guardado en tu cuenta.':'✓ Guardado en este equipo.';setTimeout(()=>{$('pdhSheet').hidden=true},700);
};
window.pdhReload=function(){};
})();
}catch(e){console.error("[pdh-js]",e)}

/* ===== dc-js ===== */
try{
(function(){
const box=document.getElementById('descuentosAdminBox');if(!box||document.getElementById('dcRoot'))return;
const $=id=>document.getElementById(id);
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'S/ '+(Number(n)||0).toFixed(2).replace(/\.00$/,'');
const pad=n=>String(n).padStart(2,'0');
const toLocal=v=>{if(!v)return '';const d=new Date(v);if(isNaN(d))return '';return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes())};
const fromLocal=v=>{if(!v)return null;const d=new Date(v);return isNaN(d)?null:d.toISOString()};
const fdt=v=>new Date(v).toLocaleString('es-PE',{day:'2-digit',month:'short',hour:'numeric',minute:'2-digit'});
const root=document.createElement('div');root.id='dcRoot';
root.innerHTML=`
    <div class="d-stats" id="dcStats"></div>
    <button type="button" class="d-new" id="dcNew">+ Nuevo código</button>
    <div class="d-chips" id="dcChips"><button type="button" data-f="todos" class="on">Todos</button><button type="button" data-f="Activo">Activos</button><button type="button" data-f="Programado">Programados</button><button type="button" data-f="fin">Vencidos o agotados</button><button type="button" data-f="Inactivo">Apagados</button></div>
    <p class="d-msg" id="dcListMsg"></p>
    <div class="d-list" id="dcList"><div class="d-empty">Cargando códigos…</div></div>`;
box.prepend(root);
let rows=[],filter='todos',editing=null;
function status(p){if(p.activo!==true)return 'Inactivo';const now=Date.now(),i=p.fecha_inicio?Date.parse(p.fecha_inicio):null,f=p.fecha_fin?Date.parse(p.fecha_fin):null;if(i&&now<i)return 'Programado';if(f&&now>f)return 'Vencido';const mx=Number(p.max_usos||0);if(mx>0&&Number(p.usos||0)>=mx)return 'Agotado';return 'Activo'}
const CLS={Activo:'ok',Programado:'wait',Vencido:'bad',Agotado:'bad',Inactivo:''};
async function load(){
const db=window.db;if(!db)return;
try{const {data,error}=await db.from('codigos_delivery').select('*');if(error)throw error;rows=(data||[]).sort((a,b)=>(Date.parse(b.creado_en||b.created_at||b.fecha_inicio||0)||0)-(Date.parse(a.creado_en||a.created_at||a.fecha_inicio||0)||0));$('dcListMsg').textContent='';paint()}
catch(e){$('dcList').innerHTML='<div class="d-empty">No se pudieron cargar los códigos.</div>';$('dcListMsg').textContent=e.message||String(e)}
}
function paint(){
const S=rows.map(status);
$('dcStats').innerHTML=`<div><small>Activos</small><b>${S.filter(s=>s==='Activo').length}</b></div><div><small>Usos</small><b>${rows.reduce((a,p)=>a+Number(p.usos||0),0)}</b></div><div><small>Vencidos</small><b>${S.filter(s=>s==='Vencido'||s==='Agotado').length}</b></div>`;
const L=rows.filter((p,i)=>filter==='todos'||(filter==='fin'?['Vencido','Agotado'].includes(S[i]):S[i]===filter));
$('dcList').innerHTML=L.length?L.map(p=>{
const s=status(p),mx=Number(p.max_usos||0),u=Number(p.usos||0);
const off=p.tipo==='porcentaje'?`${Number(p.valor||0).toFixed(0)}% <small>del delivery</small>`:`${money(p.valor)} <small>menos en el delivery</small>`;
const vig=p.fecha_fin?(s==='Vencido'?'Venció el '+fdt(p.fecha_fin):'Hasta el '+fdt(p.fecha_fin)):'Sin vencimiento';
return `<div class="d-code ${s==='Activo'||s==='Programado'?'':'dim'}" data-id="${E(p.id)}">
        <div class="d-row"><button type="button" class="d-tag" data-a="copy" title="Copiar código">${E(p.codigo)}</button><span class="d-pill ${CLS[s]}">${s}</span></div>
        <div class="d-off">${off}</div>
        <div class="d-meta"><span>${Number(p.compra_minima||0)>0?'Compra mínima <b>'+money(p.compra_minima)+'</b>':'Sin compra mínima'}</span><span>${E(vig)}</span>${p.fecha_inicio&&s==='Programado'?`<span>Empieza el <b>${E(fdt(p.fecha_inicio))}</b></span>`:''}</div>
        <div class="d-meta"><span>Usado <b>${u}</b> ${mx>0?'de '+mx+' veces':'veces · ilimitado'}</span></div>
        ${mx>0?`<div class="d-bar"><span style="width:${Math.min(100,u/mx*100)}%"></span></div>`:''}
        <div class="d-acts"><button type="button" class="d-sw ${p.activo===true?'on':''}" data-a="sw" aria-label="${p.activo===true?'Apagar':'Encender'} código"></button><span>${p.activo===true?'Encendido':'Apagado'}</span><button type="button" class="d-mini" data-a="edit">Editar</button><button type="button" class="d-mini red" data-a="del">Eliminar</button></div></div>`}).join(''):`<div class="d-empty">${rows.length?'No hay códigos en este filtro.':'Todavía no hay códigos. Crea el primero con «+ Nuevo código».'}</div>`;
}
$('dcChips').addEventListener('click',e=>{const b=e.target.closest('[data-f]');if(!b)return;filter=b.dataset.f;$('dcChips').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));paint()});
$('dcList').addEventListener('click',async e=>{
const b=e.target.closest('[data-a]');if(!b)return;const id=b.closest('[data-id]').dataset.id;const p=rows.find(x=>String(x.id)===String(id));if(!p)return;const a=b.dataset.a;
if(a==='copy'){try{await navigator.clipboard.writeText(p.codigo);$('dcListMsg').textContent='Código '+p.codigo+' copiado.'}catch(err){}return}
if(a==='edit')return openForm(p);
if(a==='del'){if(!(await pdConfirmar('¿Eliminar el código '+p.codigo+'? Los clientes ya no podrán usarlo.')))return;const {error}=await window.db.from('codigos_delivery').delete().eq('id',p.id);if(error){$('dcListMsg').textContent='No se pudo eliminar: '+error.message;return}return load()}
if(a==='sw'){b.disabled=true;const {error}=await window.db.from('codigos_delivery').update({activo:p.activo!==true}).eq('id',p.id);b.disabled=false;if(error){$('dcListMsg').textContent='No se pudo cambiar: '+error.message;return}p.activo=p.activo!==true;paint()}
});
const sheet=$('dcSheet');
const tipo=()=>$('dcTipo').querySelector('.on').dataset.v;
const setTipo=v=>{$('dcTipo').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));$('dcValLbl').firstChild.textContent=v==='porcentaje'?'Descuento (%)':'Descuento (S/)';prev()};
$('dcTipo').addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(b)setTipo(b.dataset.v)});
function prev(){
const c=($('dcCode').value||'CÓDIGO').trim().toUpperCase(),v=Number($('dcVal').value)||0,mn=Number($('dcMin').value)||0,mx=Number($('dcMax').value)||0;
const off=tipo()==='porcentaje'?`<b>${v||0}% de descuento</b> en el delivery`:`<b>${money(v)} menos</b> en el delivery`;
const fin=$('dcFin').value?' hasta el <b>'+fdt($('dcFin').value)+'</b>':' sin fecha de vencimiento';
$('dcPrev').innerHTML=`Con <b>${E(c)}</b> el cliente obtiene ${off}${mn>0?' en compras desde <b>'+money(mn)+'</b>':''}${fin}. ${mx>0?'Se puede usar <b>'+mx+'</b> veces.':'Usos ilimitados.'}`;
}
['dcCode','dcVal','dcMin','dcMax','dcIni','dcFin'].forEach(id=>$(id).addEventListener('input',prev));
$('dcCode').addEventListener('input',e=>{const p=e.target.selectionStart;e.target.value=e.target.value.toUpperCase().replace(/\s+/g,'');e.target.setSelectionRange(p,p)});
$('dcGen').onclick=()=>{const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='PIDE';for(let i=0;i<4;i++)s+=A[Math.floor(Math.random()*A.length)];$('dcCode').value=s;prev()};
$('dcQuick').addEventListener('click',e=>{const b=e.target.closest('[data-d]');if(!b)return;const n=+b.dataset.d;const now=new Date();if(!$('dcIni').value)$('dcIni').value=toLocal(now);if(!n){$('dcFin').value=''}else{const f=new Date(now);f.setDate(f.getDate()+n-1);f.setHours(23,59,0,0);$('dcFin').value=toLocal(f)}prev()});
function openForm(p){
editing=p||null;$('dcMsg').textContent='';
$('dcSheetTitle').textContent=p?'Editar '+p.codigo:'Nuevo código';$('dcSave').textContent=p?'Guardar cambios':'Crear código';
$('dcCode').value=p?p.codigo:'';setTipo(p?.tipo==='porcentaje'?'porcentaje':'fijo');
$('dcVal').value=p?Number(p.valor||0):'';$('dcMin').value=p&&Number(p.compra_minima)>0?Number(p.compra_minima):'';$('dcMax').value=p&&Number(p.max_usos)>0?Number(p.max_usos):'';
$('dcIni').value=p?toLocal(p.fecha_inicio):toLocal(new Date());$('dcFin').value=p?toLocal(p.fecha_fin):'';
prev();sheet.hidden=false;document.documentElement.style.overflow='hidden';setTimeout(()=>(p?$('dcVal'):$('dcCode')).focus(),80);
}
const close=()=>{sheet.hidden=true;document.documentElement.style.overflow=''};
sheet.addEventListener('click',e=>{if(e.target.closest('[data-close]'))close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden)close()});
$('dcNew').onclick=()=>openForm(null);
$('dcSave').onclick=async()=>{
const codigo=$('dcCode').value.trim().toUpperCase(),t=tipo(),valor=Number($('dcVal').value),minimo=Number($('dcMin').value)||0,max=Math.floor(Number($('dcMax').value)||0);
const ini=fromLocal($('dcIni').value),fin=fromLocal($('dcFin').value);
const err=t=>{$('dcMsg').textContent=t};
if(!/^[A-Z0-9_-]{3,20}$/.test(codigo))return err('El código debe tener de 3 a 20 letras o números, sin espacios.');
if(!(valor>0))return err('Escribe un descuento mayor que 0.');
if(t==='porcentaje'&&valor>100)return err('El porcentaje no puede pasar de 100%.');
if(minimo<0||max<0)return err('Los valores no pueden ser negativos.');
if(ini&&fin&&Date.parse(ini)>Date.parse(fin))return err('La fecha «Hasta» debe ser después de «Desde».');
if(rows.some(r=>r.codigo===codigo&&(!editing||String(r.id)!==String(editing.id))))return err('Ya existe un código '+codigo+'.');
const payload={codigo,tipo:t,valor:Math.round(valor*100)/100,compra_minima:Math.round(minimo*100)/100,max_usos:max,fecha_inicio:ini,fecha_fin:fin};
const btn=$('dcSave');btn.disabled=true;err('');
try{const r=editing?await window.db.from('codigos_delivery').update(payload).eq('id',editing.id):await window.db.from('codigos_delivery').insert({...payload,usos:0,activo:true});if(r.error)throw r.error;close();await load();$('dcListMsg').textContent=(editing?'Código actualizado: ':'Código creado: ')+codigo}
catch(e){err('No se pudo guardar: '+(e.message||e))}finally{btn.disabled=false}
};
if(typeof window.loadDeliveryPromos==='function'){const _l=window.loadDeliveryPromos;window.loadDeliveryPromos=async function(){const o=await _l.apply(this,arguments);load();return o}}
new MutationObserver(()=>{if(box.offsetParent)load()}).observe(box,{attributes:true,attributeFilter:['class','style']});
load();
})();
}catch(e){console.error("[dc-js]",e)}

/* ===== sp-js ===== */
try{
(function(){
const box=document.getElementById('suspenderMotorizadoAdminBox');if(!box||document.getElementById('spRoot'))return;
const $=id=>document.getElementById(id);
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ini=n=>String(n||'?').trim().split(/\s+/).map(w=>w[0]||'').slice(0,2).join('').toUpperCase();
const LOCK='<svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';
const OPEN='<svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.5-2"/></svg>';
const REF='<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/></svg>';
const root=document.createElement('div');root.id='spRoot';
root.innerHTML=`
    <div class="s-stats" id="spStats"></div>
    <div class="s-tool"><input type="search" id="spQ" placeholder="Buscar motorizado" autocomplete="off"><button type="button" class="s-icon" id="spRef" aria-label="Actualizar">${REF}</button></div>
    <div class="s-chips" id="spChips"><button type="button" data-f="todas" class="on">Todas</button><button type="button" data-f="on">Activas</button><button type="button" data-f="off">Suspendidas</button></div>
    <p class="s-msg" id="spMsg" role="status"></p>
    <div class="s-list" id="spList"><div class="s-empty">Cargando motorizados…</div></div>`;
box.prepend(root);
let rows=[],f='todas',q='',pending=null;
async function load(){
if(!window.db)return;$('spRef').classList.add('spin');
try{const {data,error}=await window.db.from('motorizados').select('id,nombre_completo,telefono,activo').order('nombre_completo',{ascending:true});if(error)throw error;rows=data||[];paint()}
catch(e){$('spList').innerHTML='<div class="s-empty">No se pudo cargar la lista. Revisa los permisos de Supabase.</div>'}
finally{$('spRef').classList.remove('spin')}
}
function paint(){
const on=rows.filter(m=>m.activo!==false).length;
$('spStats').innerHTML=`<div><small>Cuentas activas</small><b>${on}</b></div><div><small>Suspendidas</small><b>${rows.length-on}</b></div>`;
const L=rows.filter(m=>(f==='todas'||(f==='on')===(m.activo!==false))&&(!q||String(m.nombre_completo||'').toLowerCase().includes(q)||String(m.telefono||'').includes(q)))
.sort((a,b)=>((a.activo===false)-(b.activo===false))||String(a.nombre_completo||'').localeCompare(String(b.nombre_completo||''),'es'));
$('spList').innerHTML=L.length?L.map(m=>{const act=m.activo!==false;return `<div class="s-row ${act?'':'off'}" data-id="${E(m.id)}"><span class="s-av">${E(ini(m.nombre_completo))}</span><span class="s-txt"><strong>${E(m.nombre_completo||'Motorizado')}</strong><small><i class="s-dot"></i>${act?'Activa':'Suspendida'}${m.telefono?' · '+E(m.telefono):''}</small></span><button type="button" class="s-btn ${act?'':'re'}" data-a="${act?'off':'on'}">${act?'Suspender':'Reactivar'}</button></div>`}).join(''):`<div class="s-empty">${rows.length?'No hay cuentas en este filtro.':'No hay motorizados registrados.'}</div>`;
}
$('spQ').addEventListener('input',e=>{q=e.target.value.trim().toLowerCase();paint()});
$('spChips').addEventListener('click',e=>{const b=e.target.closest('[data-f]');if(!b)return;f=b.dataset.f;$('spChips').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));paint()});
$('spRef').onclick=load;
const sheet=$('spSheet');
const close=()=>{sheet.hidden=true;pending=null};
sheet.addEventListener('click',e=>{if(e.target.closest('[data-close]'))close()});
$('spList').addEventListener('click',e=>{
const b=e.target.closest('[data-a]');if(!b)return;const m=rows.find(x=>String(x.id)===String(b.closest('[data-id]').dataset.id));if(!m)return;
const re=b.dataset.a==='on';pending={m,next:re};
$('spIco').className='s-ico'+(re?' re':'');$('spIco').innerHTML=re?OPEN:LOCK;
$('spTitle').textContent=(re?'¿Reactivar a ':'¿Suspender a ')+(m.nombre_completo||'este motorizado')+'?';
$('spText').textContent=re?'Podrá volver a entrar a su panel y recibir pedidos.':'No podrá entrar a su panel ni recibir pedidos. Si está conectado, su sesión se cerrará. Su caja, sueldo e historial se conservan.';
$('spGo').textContent=re?'Reactivar':'Suspender';$('spGo').className='go'+(re?' re':'');
sheet.hidden=false;
});
$('spGo').onclick=async()=>{
if(!pending)return;const {m,next}=pending;const btn=$('spGo');btn.disabled=true;
try{const {error}=await window.db.from('motorizados').update({activo:next}).eq('id',m.id);if(error)throw error;m.activo=next;close();paint();const s=$('spMsg');s.className='s-msg';s.textContent=(next?'✓ Cuenta reactivada: ':'✓ Cuenta suspendida: ')+(m.nombre_completo||'')}
catch(e){const s=$('spMsg');s.className='s-msg err';s.textContent='No se pudo cambiar el estado: '+(e.message||e);close()}
finally{btn.disabled=false}
};
const _c=window.cargarListaSuspensionMotorizados;
window.cargarListaSuspensionMotorizados=async function(){try{if(_c)await _c.apply(this,arguments)}catch(e){}return load()};
load();
})();
}catch(e){console.error("[sp-js]",e)}

/* ===== gx-js ===== */
try{
(function(){
const box=document.getElementById('gpsAdminBox');const mapEl=document.getElementById('adminMotoMap');if(!box||!mapEl||document.getElementById('gxRoot'))return;
const $=id=>document.getElementById(id);
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ini=n=>String(n||'?').trim().split(/\s+/).map(w=>w[0]||'').slice(0,2).join('').toUpperCase();
const REF='<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/></svg>';
const ONLINE=5,SHOW_STALE=24*60;
const root=document.createElement('div');root.id='gxRoot';
root.innerHTML=`<div class="g-bar"><span class="g-live" id="gxLive"><i></i><span>Conectando…</span></span><button type="button" class="g-icon" id="gxRef" aria-label="Actualizar">${REF}</button></div>
    <div class="g-stats" id="gxStats"></div>
    <div class="g-mapWrap" id="gxMapWrap"><button type="button" class="g-fit" id="gxFit">Ver a todos</button></div>
    <div class="g-chips" id="gxChips"><button type="button" data-f="todos" class="on">Todos</button><button type="button" data-f="on">En línea</button><button type="button" data-f="off">Sin señal</button></div>
    <div class="g-list" id="gxList"><div class="g-empty">Cargando motorizados…</div></div>`;
box.prepend(root);$('gxMapWrap').prepend(mapEl);
let map=null,markers=new Map(),state=[],filter='todos',fitted=false,timer=null,busy=false,channel=null;
const tsOf=r=>{for(const k of ['ultima_ubicacion','actualizado_en','updated_at','creado_en','created_at','fecha','timestamp']){const v=r&&r[k];if(v){const t=new Date(v).getTime();if(Number.isFinite(t))return t}}return null};
const ago=t=>{const m=Math.max(0,Math.round((Date.now()-t)/60000));if(m<1)return 'ahora';if(m<60)return 'hace '+m+' min';const h=Math.floor(m/60);return h<24?'hace '+h+' h':'hace '+Math.floor(h/24)+' d'};
const visible=()=>!!box.offsetParent&&!document.hidden;
function ensureMap(){
if(map||!window.L)return !!map;
map=L.map(mapEl,{zoomControl:true,attributionControl:true}).setView([-5.1945,-80.6328],13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
try{window.adminGpsMap=map}catch(e){}
return true;
}
async function load(){
if(busy||!window.db)return;busy=true;$('gxRef').classList.add('spin');
const live=$('gxLive');
try{
if(!ensureMap()){live.className='g-live err';live.lastChild.textContent='No se pudo cargar el mapa. Revisa tu conexión a Internet.';return}
let {data:motos,error}=await db.from('motorizados').select('*').order('nombre_completo');if(error)throw error;
/* Si la lista llega vacía (sesión aún cargando), se reintenta y se usa la lista que ya cargó el panel */
if(!(motos&&motos.length)){try{await db.auth.getSession()}catch(_){}await new Promise(r=>setTimeout(r,800));const r2=await db.from('motorizados').select('*').order('nombre_completo');if(!r2.error&&r2.data&&r2.data.length)motos=r2.data}
if(!(motos&&motos.length)){try{const lista=(typeof allMotos!=='undefined'&&Array.isArray(allMotos)&&allMotos.length)?allMotos:(Array.isArray(window.adminServiceMotos)?window.adminServiceMotos:[]);if(lista.length)motos=lista}catch(_){}}
const act=(motos||[]).filter(m=>String(m.activo??'')!=='false');const ids=act.map(m=>String(m.id));
const hist=new Map();
if(ids.length){
let r=await db.from('ubicaciones_motorizados').select('*').in('motorizado_id',ids).order('creado_en',{ascending:false}).limit(600);
if(r.error)r=await db.from('ubicaciones_motorizados').select('*').in('motorizado_id',ids).limit(600);
(r.data||[]).forEach(row=>{const id=String(row.motorizado_id||'');const pt=typeof adminGpsPoint==='function'?adminGpsPoint(row):null;const t=tsOf(row);if(!pt||!t)return;const p=hist.get(id);if(!p||t>p.t)hist.set(id,{pt,t})});
}
let busyMap=new Map();try{const {data}=await db.from('pedidos').select('id,motorizado_id,estado').in('estado',['asignado','aceptado','pedido_aceptado','camino_recojo','en_camino','en_entrega','camino_entrega']);(data||[]).forEach(o=>{const k=String(o.motorizado_id||'');if(k)busyMap.set(k,(busyMap.get(k)||0)+1)})}catch(e){}
state=act.map(m=>{const id=String(m.id);let pt=typeof adminGpsPoint==='function'?adminGpsPoint(m):null,t=tsOf(m);const h=hist.get(id);if(h&&(!pt||!t||h.t>t)){pt=h.pt;t=h.t}
const age=t?(Date.now()-t)/60000:null;const on=!!pt&&age!=null&&age<=ONLINE;const stale=!!pt&&!on&&age!=null&&age<=SHOW_STALE;
const n=busyMap.get(id)||(m.usuario_id?busyMap.get(String(m.usuario_id)):0)||0;
return {m,id,pt,t,on,stale,n}});
paintMap();paint();
const on=state.filter(s=>s.on).length;live.className='g-live';live.lastChild.textContent=`En vivo · ${on} de ${state.length} en línea · actualizado ${new Date().toLocaleTimeString('es-PE',{hour:'numeric',minute:'2-digit'})}`;
}catch(e){live.className='g-live err';live.lastChild.textContent='No se pudieron cargar las ubicaciones: '+(e.message||e)}
finally{busy=false;$('gxRef').classList.remove('spin')}
}
function paintMap(){
const keep=new Set();
state.forEach(s=>{if(!s.pt||!(s.on||s.stale))return;keep.add(s.id);
const cls='gx-pin'+(s.on?(s.n?' busy':''):' stale');
const icon=L.divIcon({className:'',html:`<div class="${cls}">${E(ini(s.m.nombre_completo))}</div>`,iconSize:[38,38],iconAnchor:[19,19]});
const pop=`<b>${E(s.m.nombre_completo||'Motorizado')}</b><br>${s.on?'En línea':'Última ubicación'} · ${E(ago(s.t))}${s.n?'<br>'+s.n+' pedido(s) en curso':''}`;
let mk=markers.get(s.id);if(mk){mk.setLatLng([s.pt.lat,s.pt.lng]);mk.setIcon(icon);mk.setPopupContent(pop)}else{mk=L.marker([s.pt.lat,s.pt.lng],{icon}).addTo(map).bindPopup(pop);markers.set(s.id,mk)}});
for(const [id,mk] of markers){if(!keep.has(id)){mk.remove();markers.delete(id)}}
if(!fitted){fitted=true;fitAll()}
setTimeout(()=>{try{map.invalidateSize()}catch(e){}},120);
}
function fitAll(){const pts=state.filter(s=>s.pt&&(s.on||s.stale)).map(s=>[s.pt.lat,s.pt.lng]);if(pts.length===1)map.setView(pts[0],16);else if(pts.length>1)map.fitBounds(L.latLngBounds(pts),{padding:[40,40],maxZoom:16});else map.setView([-5.1945,-80.6328],13)}
function paint(){
const on=state.filter(s=>s.on).length,ruta=state.filter(s=>s.n).length;
$('gxStats').innerHTML=`<div><small>En línea</small><b>${on}</b></div><div><small>Sin señal</small><b>${state.length-on}</b></div><div><small>En ruta</small><b>${ruta}</b></div>`;
const L2=state.filter(s=>filter==='todos'||(filter==='on')===s.on).sort((a,b)=>(b.on-a.on)||(b.n-a.n)||((b.t||0)-(a.t||0)));
$('gxList').innerHTML=L2.length?L2.map(s=>{const tel=String(s.m.telefono||'').replace(/\D/g,'');
const st=s.on?`<b>En línea</b> · ${E(ago(s.t))}`:s.t?`Sin señal · última ${E(ago(s.t))}`:'Nunca compartió su ubicación';
return `<div class="g-row" data-id="${E(s.id)}"><span class="g-av ${s.on?'on':s.stale?'stale':''}">${E(ini(s.m.nombre_completo))}</span><span class="g-txt"><strong>${E(s.m.nombre_completo||'Motorizado')}</strong><small>${st}${s.n?' · '+s.n+' pedido'+(s.n===1?'':'s')+' en curso':''}</small></span><span class="g-acts">${tel?`<a class="g-mini" href="tel:${E(tel)}">Llamar</a>`:''}${s.on||!s.m.usuario_id?'':`<button type="button" class="g-mini" data-a="avisar">Avisar</button>`}<button type="button" class="g-mini dark" data-a="ver" ${s.pt&&(s.on||s.stale)?'':'disabled'}>Ver</button></span></div>`}).join(''):'<div class="g-empty">No hay motorizados en este filtro.</div>';
}
const GPS_AVISO={titulo:'Activa tu GPS',mensaje:'Administración te pide activar el GPS de tu teléfono y mantener este panel abierto para poder ubicarte.'};
async function avisarGps(list){let ok=0,fail=0;for(const s of list){const base={usuario_id:s.m.usuario_id,titulo:GPS_AVISO.titulo,mensaje:GPS_AVISO.mensaje,leida:false};let r=await db.from('notificaciones').insert(Object.assign({tipo:'aviso_gps'},base));if(r.error)r=await db.from('notificaciones').insert(base);if(r.error){fail++;console.warn('No se pudo avisar',r.error)}else ok++}return {ok,fail}}
$('gxList').addEventListener('click',async e=>{const b=e.target.closest('[data-a="avisar"]');if(!b)return;const s=state.find(x=>x.id===b.closest('[data-id]').dataset.id);if(!s)return;b.disabled=true;b.textContent='Enviando…';const r=await avisarGps([s]);b.textContent=r.ok?'Aviso enviado':'No se pudo';if(!r.ok){b.disabled=false;pdAviso('No se pudo enviar el aviso. Revisa el permiso de la tabla notificaciones en Supabase.')}});
const bt=document.createElement('button');bt.type='button';bt.id='gxAvisarTodos';bt.className='g-mini dark';bt.style.cssText='width:100%;margin:8px 0 0';bt.textContent='Avisar a todos los que no tienen GPS';$('gxChips').after(bt);
bt.onclick=async()=>{const L=state.filter(s=>!s.on&&s.m.usuario_id);if(!L.length){pdAviso('Todos tienen señal ahora.');return}if(!(await pdConfirmar('Se enviará el aviso "Activa tu GPS" a '+L.length+' motorizado(s). ¿Continuar?')))return;bt.disabled=true;bt.textContent='Enviando…';const r=await avisarGps(L);bt.disabled=false;bt.textContent='Avisar a todos los que no tienen GPS';pdAviso(r.ok+' aviso(s) enviado(s)'+(r.fail?' · '+r.fail+' con error':''))};
$('gxList').addEventListener('click',e=>{const b=e.target.closest('[data-a="ver"]');if(!b)return;const s=state.find(x=>x.id===b.closest('[data-id]').dataset.id);if(!s||!s.pt)return;map.setView([s.pt.lat,s.pt.lng],17);markers.get(s.id)?.openPopup();$('gxMapWrap').scrollIntoView({behavior:'smooth',block:'center'})});
$('gxChips').addEventListener('click',e=>{const b=e.target.closest('[data-f]');if(!b)return;filter=b.dataset.f;$('gxChips').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));paint()});
$('gxRef').onclick=load;$('gxFit').onclick=()=>fitAll();
function start(){
load();clearInterval(timer);timer=setInterval(()=>{if(visible())load()},15000);
if(!channel&&window.db){try{channel=db.channel('gx-gps').on('postgres_changes',{event:'*',schema:'public',table:'ubicaciones_motorizados'},()=>{if(visible())load()}).on('postgres_changes',{event:'UPDATE',schema:'public',table:'motorizados'},()=>{if(visible())load()}).subscribe()}catch(e){}}
}
window.initAdminGpsMap=async function(){start();return true};
window.refreshAdminGps=async function(){if(visible())return load()};
new MutationObserver(()=>{if(box.offsetParent){fitted=false;start()}else clearInterval(timer)}).observe(box,{attributes:true,attributeFilter:['class','style']});
})();
}catch(e){console.error("[gx-js]",e)}

/* ===== pd-qrcfg-js ===== */
try{
(function(){
const DB=()=>{try{return db}catch(e){return window.db}};
if(window.__pdQrCfg)return;window.__pdQrCfg=true;
const BUCKET='restaurantes',CFG='config/yape.json';
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let cur={url:'',numero:'986233533',titular:'Grupo Pidemás EIRL',whatsapp_admin:'986233533'},file=null;
const st=()=>DB().storage.from(BUCKET);
async function load(){
try{const u=st().getPublicUrl(CFG).data.publicUrl+'?t='+Date.now();const r=await fetch(u,{cache:'no-store'});if(r.ok){const j=await r.json();cur={...cur,...j}}}catch(e){}
paint();
}
function paint(){
const box=document.getElementById('pdQrCfg');if(!box)return;
box.querySelector('.qimg').innerHTML=file?`<img src="${E(URL.createObjectURL(file))}" alt="Nuevo QR">`:cur.url?`<img src="${E(cur.url)}" alt="QR de Yape actual">`:'Usando el QR actual del sistema<br>(Grupo Pidemás EIRL)';
box.querySelector('#pdQrNum').value=cur.numero||'';box.querySelector('#pdQrTit').value=cur.titular||'';
}
function say(t,k){const m=document.querySelector('#pdQrCfg .qMsg');if(m){m.textContent=t||'';m.className='qMsg'+(k?' '+k:'')}}
function mount(){
if(document.getElementById('pdQrCfg'))return;
const box=document.createElement('section');box.id='pdQrCfg';
box.innerHTML=`<div class="qk"><span>Cobros por Yape<strong>QR que muestra el motorizado</strong></span></div>
      <div class="qimg"></div>
      <div class="qf"><label for="pdQrNum">Número de Yape</label><input id="pdQrNum" type="tel" inputmode="numeric" maxlength="15" autocomplete="off"><label for="pdQrTit">Titular</label><input id="pdQrTit" type="text" maxlength="60" autocomplete="off"></div>
      <div class="qb"><button type="button" class="qPick">Cambiar imagen del QR</button><button type="button" class="qSave">Guardar</button></div>
      <input type="file" id="pdQrFile" accept="image/png,image/jpeg,image/webp" hidden>
      <div class="qMsg"></div>`;
let hold=document.getElementById('pdQrHolder');if(!hold){hold=document.createElement('div');hold.id='pdQrHolder';hold.hidden=true;document.body.appendChild(hold)}hold.appendChild(box);
const fi=box.querySelector('#pdQrFile');
box.querySelector('.qPick').addEventListener('click',()=>fi.click());
fi.addEventListener('change',()=>{const f=fi.files&&fi.files[0];if(!f)return;if(!/^image\//.test(f.type)){say('Elige una imagen (PNG o JPG).','err');return}if(f.size>5*1024*1024){say('La imagen pesa más de 5 MB.','err');return}file=f;paint();say('Imagen lista. Toca Guardar para aplicarla.')});
box.querySelector('.qSave').addEventListener('click',save);
load();
}
async function save(){
const btn=document.querySelector('#pdQrCfg .qSave');
const numero=document.getElementById('pdQrNum').value.replace(/\D/g,''),titular=document.getElementById('pdQrTit').value.trim(),whatsapp_admin=cur.whatsapp_admin||'';

if(numero&&numero.length!==9){say('El número de Yape debe tener 9 dígitos.','err');return}
if(!file&&!cur.url&&!numero&&!whatsapp_admin){say('Sube la imagen del QR.','err');return}
btn.disabled=true;say('Guardando…');
try{
let url=cur.url;
if(file){
const ext=(file.type.split('/')[1]||'jpg').replace('jpeg','jpg');
const path=`config/yape-qr-${Date.now()}.${ext}`;
const up=await st().upload(path,file,{upsert:true,contentType:file.type,cacheControl:'31536000'});if(up.error)throw up.error;
url=st().getPublicUrl(path).data.publicUrl;
}
const data={url,numero,titular,whatsapp_admin,actualizado_en:new Date().toISOString()};
const blob=new Blob([JSON.stringify(data)],{type:'application/json'});
const r=await st().upload(CFG,blob,{upsert:true,contentType:'application/json',cacheControl:'0'});if(r.error)throw r.error;
const old=cur.url;cur=data;file=null;paint();say('Listo: los motorizados ya ven este QR.','ok');
if(old&&old!==url){const p=old.split('/'+BUCKET+'/')[1];if(p)st().remove([decodeURIComponent(p.split('?')[0])]).catch(()=>{})}
}catch(e){say('No se pudo guardar: '+(e.message||e)+'. Revisa que el bucket "restaurantes" permita subir archivos en la carpeta config/.','err')}
finally{btn.disabled=false}
}
const boot=()=>{let n=0;const t=setInterval(()=>{if(DB()){clearInterval(t);mount()}else if(++n>40)clearInterval(t)},250)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
}catch(e){console.error("[pd-qrcfg-js]",e)}

/* ===== pdsl-selector-js ===== */
try{
(function(){
const $=id=>document.getElementById(id);
function mount(){
const grid=$('pdslMotos'),search=$('pdslSearch');
if(!grid||!search||$('pdslSelect'))return !!$('pdslSelect');
const w=document.createElement('div');w.className='pdslSelWrap';
w.innerHTML='<label for="pdslSelect">Seleccionar motorizado</label><select id="pdslSelect"><option value="">Cargando motorizados…</option></select><small id="pdslSelCount"></small>';
search.parentNode.insertBefore(w,search);
const sel=$('pdslSelect');let cleared=false;
function sync(){
const bs=[...grid.querySelectorAll('.pdslMoto')];
if(!bs.length){sel.innerHTML='<option value="">'+(grid.textContent.trim()||'Cargando motorizados…')+'</option>';$('pdslSelCount').textContent='';return}
const on=bs.find(b=>b.classList.contains('on'));
sel.innerHTML='<option value="">Selecciona un motorizado</option>'+bs.map(b=>{
const n=(b.querySelector('span')?.textContent||'').trim(),a=(b.querySelector('b')?.textContent||'').trim();
const o=document.createElement('option');o.value=b.dataset.id;o.textContent=n+(a&&a!=='…'?' · '+a:'');return o.outerHTML}).join('');
sel.value=(on&&!cleared)?on.dataset.id:'';
$('pdslSelCount').textContent=bs.length+' motorizados cargados automáticamente.';
}
const bodyEl=$('pdslBody');if(bodyEl)new MutationObserver(()=>{if(cleared&&!bodyEl.hidden)bodyEl.hidden=true}).observe(bodyEl,{attributes:true,attributeFilter:['hidden']});
new MutationObserver(sync).observe(grid,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
sel.addEventListener('change',()=>{
if(!sel.value){cleared=true;const d=$('pdslBody');if(d)d.hidden=true;return}
cleared=false;
const b=[...grid.querySelectorAll('.pdslMoto')].find(x=>x.dataset.id===sel.value);
if(b)b.click();
setTimeout(()=>{const body=$('pdslBody');if(body&&!body.hidden)body.scrollIntoView({behavior:'smooth',block:'start'})},350);
});
sync();return true;
}
function init(){if(!mount())setTimeout(init,500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
}catch(e){console.error("[pdsl-selector-js]",e)}

/* ===== pdcj-selector-js ===== */
try{
(function(){
const $=id=>document.getElementById(id);
function mount(){
const grid=$('pdcjMotos'),search=$('pdcjSearch');
if(!grid||!search)return false;
if($('pdcjSelect'))return true;
const w=document.createElement('div');w.className='pdcjSelWrap';
w.innerHTML='<label for="pdcjSelect">Seleccionar motorizado</label><select id="pdcjSelect"><option value="">Cargando motorizados…</option></select><small id="pdcjSelCount"></small>';
search.parentNode.insertBefore(w,search);
const sel=$('pdcjSelect');let cleared=false;
function sync(){
const bs=[...grid.querySelectorAll('.pdcjMoto')];
if(!bs.length){sel.innerHTML='<option value="">'+(grid.textContent.trim()||'Cargando motorizados…')+'</option>';$('pdcjSelCount').textContent='';return}
const on=bs.find(b=>b.classList.contains('on'));
sel.innerHTML='<option value="">Selecciona un motorizado</option>'+bs.map(b=>{
const n=(b.querySelector('span')?.textContent||'').trim(),a=(b.querySelector('b')?.textContent||'').trim();
const o=document.createElement('option');o.value=b.dataset.id;o.textContent=n+(a?' · '+a:'');return o.outerHTML}).join('');
sel.value=(on&&!cleared)?on.dataset.id:'';
$('pdcjSelCount').textContent=bs.length+' motorizados cargados automáticamente.';
}
new MutationObserver(sync).observe(grid,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
sel.addEventListener('change',()=>{
if(!sel.value){cleared=true;const d=$('pdcjDetail');if(d)d.hidden=true;return}
cleared=false;
const b=[...grid.querySelectorAll('.pdcjMoto')].find(x=>x.dataset.id===sel.value);
if(b)b.click();
});
sync();return true;
}
function init(){if(!mount())setTimeout(init,500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
}catch(e){console.error("[pdcj-selector-js]",e)}

/* ===== pidemas-tarifa-admin-js ===== */
try{
(function(){
const $=id=>document.getElementById(id);
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'S/ '+(Number(n)||0).toFixed(2);
let C=null;
const num=(v,d)=>{const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:d};
function abrir(){
try{document.getElementById('adminSideMenuClose')?.click()}catch(e){}
const tbx=$('tarifasAdminBox');if(tbx&&typeof window.__pdmOpen==='function'&&!tbx.closest('#pdmBody')){window.__pdmOpen('tarifas');return}
let m=$('pdtfModal');
if(!m){m=document.createElement('div');m.id='pdtfModal';m.setAttribute('role','presentation');(tbx||document.body).appendChild(m)}
m.hidden=false;document.documentElement.style.overflow='hidden';if(!tbx)document.body.classList.add('pdtf-abierto');m.innerHTML='<div class="tf-bg" data-a="cerrar"></div><div class="tf-s"><div class="tf-top"><div><b>Tarifas</b><small>Cargando…</small></div><button type="button" class="tf-x" data-a="cerrar" aria-label="Cerrar">×</button></div></div>';
m.onclick=e=>{const b=e.target.closest('[data-a]');if(b)accion(b)};
/* se abre ya llena con lo último guardado; si en Supabase hay algo distinto se actualiza sola (salvo que ya estés editando) */
let tocado=false;try{C=JSON.parse(JSON.stringify(pdTarifa.config||{}));pintar();m.addEventListener('input',()=>{tocado=true},{once:true})}catch(e){}
pdTarifa.cargar(true).then(c=>{if(tocado||$('pdtfModal')?.hidden)return;const n=JSON.stringify(c);if(n!==JSON.stringify(C)){C=JSON.parse(n);pintar()}}).catch(()=>{if(!C){C=pdTarifa.config;pintar()}});
}
function cerrar(){const m=$('pdtfModal');if(m)m.hidden=true;document.documentElement.style.overflow='';document.body.classList.remove('pdtf-abierto')}
function sw(k,t,s,on){return '<div class="tf-sw"><span><b>'+t+'</b><small>'+s+'</small></span><button type="button" class="tf-tg'+(on?' tf-on':'')+'" data-a="tg" data-k="'+k+'" aria-pressed="'+!!on+'"></button></div>'}
function zonaHTML(z,i){
const ok=pdTarifa.coords(z.lat!=null&&z.lng!=null&&z.lat!==''?{lat:z.lat,lng:z.lng}:null);
return '<div class="tf-z" data-i="'+i+'"><div class="tf-zh"><input data-z="nombre" placeholder="Nombre de la zona" value="'+E(z.nombre||'')+'"><button type="button" class="tf-tg'+(z.activo!==false?' tf-on':'')+'" data-a="zact" data-i="'+i+'" title="Activa"></button><button type="button" class="tf-zd" data-a="zdel" data-i="'+i+'" aria-label="Eliminar zona">×</button></div>'+
'<div class="tf-g"><label class="tf-f">Precio fijo (S/)<input data-z="precio" inputmode="decimal" value="'+E(z.precio??'')+'"></label><label class="tf-f">Radio (km)<input data-z="radio_km" inputmode="decimal" value="'+E(z.radio_km??'')+'"></label></div>'+
'<label class="tf-f" style="margin-top:10px">Centro de la zona<input data-z="centro" placeholder="Enlace de Maps o -5.19, -80.63" value="'+(ok?ok.lat+', '+ok.lng:'')+'"></label>'+
'<div style="display:flex;gap:8px;margin-top:8px"><button type="button" class="tf-bt" data-a="zgps" data-i="'+i+'">Usar mi ubicación</button></div>'+
'<div class="tf-zok'+(ok?'':' tf-bad')+'">'+(ok?'Centro: '+ok.lat.toFixed(5)+', '+ok.lng.toFixed(5)+' · <a href="https://www.google.com/maps?q='+ok.lat+','+ok.lng+'" target="_blank" rel="noopener">ver en el mapa</a>':'Falta el centro de la zona.')+'</div></div>';
}
function pintar(){
const m=$('pdtfModal');if(!m||!C)return;const R=C.recargos||{};
const fecha=C.actualizado?new Date(C.actualizado).toLocaleString('es-PE',{dateStyle:'short',timeStyle:'short'}):'nunca (se usan los valores por defecto)';
m.innerHTML='<div class="tf-bg" data-a="cerrar"></div><div class="tf-s"><div class="tf-top"><div><b>Tarifas</b><small>Última actualización: '+E(fecha)+'</small></div><button type="button" class="tf-x" data-a="cerrar" aria-label="Cerrar">×</button></div><div class="tf-b">'+
'<div class="tf-c"><div class="tf-ct">Tarifa por distancia</div><p class="tf-cs">Se usa cuando la dirección del cliente no está dentro de una zona con precio fijo. La distancia es por calles.</p><div class="tf-g">'+
'<label class="tf-f">Tarifa base<input data-k="base" inputmode="decimal" value="'+E(C.base)+'"></label>'+
'<label class="tf-f">Km incluidos<input data-k="km_incluidos" inputmode="decimal" value="'+E(C.km_incluidos)+'"></label>'+
'<label class="tf-f">Precio por km extra<input data-k="por_km" inputmode="decimal" value="'+E(C.por_km)+'"></label>'+
'<label class="tf-f">Redondeo<select data-k="redondeo">'+[[0.1,'S/ 0.10'],[0.5,'S/ 0.50'],[1,'S/ 1.00']].map(([v,t])=>'<option value="'+v+'"'+(Number(C.redondeo)===v?' selected':'')+'>'+t+'</option>').join('')+'</select></label>'+
'<label class="tf-f">Tarifa mínima<input data-k="minimo" inputmode="decimal" value="'+E(C.minimo)+'"></label>'+
'<label class="tf-f">Tarifa máxima<input data-k="maximo" inputmode="decimal" value="'+E(C.maximo)+'"></label></div><p class="tf-cs tf-nota">Montos en soles (S/). Tarifa máxima en 0 = sin tope.</p></div>'+
'<div class="tf-c"><div class="tf-ct">Zonas con precio fijo</div><p class="tf-cs">Si la entrega cae dentro del radio de una zona, se cobra su precio fijo en lugar de calcular por km. Si cae en varias, gana la más cercana.</p><div id="pdtfZonas">'+(C.zonas||[]).map(zonaHTML).join('')+'</div><button type="button" class="tf-bt" data-a="zadd" style="width:100%">+ Agregar zona</button></div>'+
'<div class="tf-c"><div class="tf-ct">Recargos</div><p class="tf-cs">Se suman a la tarifa (por km o por zona).</p>'+
sw('nocturno','Recargo nocturno','Se cobra en el horario indicado (hora de Lima).',R.nocturno?.activo)+
'<div class="tf-sub"'+(R.nocturno?.activo?'':' hidden')+'><label class="tf-f">Desde<input type="time" data-r="nocturno.desde" value="'+E(R.nocturno?.desde||'21:00')+'"></label><label class="tf-f">Hasta<input type="time" data-r="nocturno.hasta" value="'+E(R.nocturno?.hasta||'06:00')+'"></label><label class="tf-f">Monto (S/)<input inputmode="decimal" data-r="nocturno.monto" value="'+E(R.nocturno?.monto??2)+'"></label></div>'+
sw('lluvia','Recargo por lluvia','Actívalo solo mientras llueve y apágalo después.',R.lluvia?.activo)+
'<div class="tf-sub"'+(R.lluvia?.activo?'':' hidden')+'><label class="tf-f">Monto (S/)<input inputmode="decimal" data-r="lluvia.monto" value="'+E(R.lluvia?.monto??2)+'"></label></div>'+
sw('pedido_grande','Recargo por pedido grande','Cuando los productos superan un monto.',R.pedido_grande?.activo)+
'<div class="tf-sub"'+(R.pedido_grande?.activo?'':' hidden')+'><label class="tf-f">Desde (S/)<input inputmode="decimal" data-r="pedido_grande.desde_subtotal" value="'+E(R.pedido_grande?.desde_subtotal??150)+'"></label><label class="tf-f">Monto (S/)<input inputmode="decimal" data-r="pedido_grande.monto" value="'+E(R.pedido_grande?.monto??2)+'"></label></div>'+
'</div>'+
'<div class="tf-c"><div class="tf-ct">Probar la tarifa</div><p class="tf-cs">Simula cuánto se cobraría con las tarifas que estás editando, aunque todavía no las guardes.</p><div class="tf-g">'+
'<label class="tf-f" style="grid-column:1/-1">Distancia (km)<input id="pdtfSimKm" inputmode="decimal" value="4"></label>'+
'<label class="tf-f" style="grid-column:1/-1">Dirección de entrega (opcional)<input id="pdtfSimDest" placeholder="Enlace de Maps o lat, lng"></label></div>'+
'<button type="button" class="tf-bt tf-dk" data-a="sim" style="width:100%;margin-top:10px">Calcular</button><div id="pdtfSimRes"></div></div>'+
'</div><div class="tf-foot"><p id="pdtfMsg"></p><button type="button" class="tf-save" data-a="guardar">Guardar tarifas</button></div></div>';
m.oninput=leer;
}
function leer(){
const m=$('pdtfModal');if(!m||!C)return;
m.querySelectorAll('[data-k]').forEach(el=>{if(el.tagName==='BUTTON')return;C[el.dataset.k]=num(el.value,0)});
m.querySelectorAll('[data-r]').forEach(el=>{const [g,k]=el.dataset.r.split('.');C.recargos[g]=C.recargos[g]||{};C.recargos[g][k]=el.type==='time'?el.value:num(el.value,0)});
m.querySelectorAll('#pdtfZonas .tf-z').forEach(z=>{const i=Number(z.dataset.i),o=C.zonas[i];if(!o)return;o.nombre=z.querySelector('[data-z=nombre]').value.trim();o.precio=num(z.querySelector('[data-z=precio]').value,0);o.radio_km=num(z.querySelector('[data-z=radio_km]').value,0);const c=pdTarifa.coords(z.querySelector('[data-z=centro]').value);const ok=z.querySelector('.tf-zok');if(c){o.lat=c.lat;o.lng=c.lng;ok.className='tf-zok';ok.innerHTML='Centro: '+c.lat.toFixed(5)+', '+c.lng.toFixed(5)}else{ok.className='tf-zok tf-bad';ok.textContent=z.querySelector('[data-z=centro]').value.trim()?'No se reconoce la ubicación. Pega un enlace de Google Maps con coordenadas o escribe «lat, lng».':'Falta el centro de la zona.'}});
}
async function accion(b){
const a=b.dataset.a,msg=$('pdtfMsg');
if(a==='cerrar')return cerrar();
if(a==='tg'){leer();const g=b.dataset.k;C.recargos[g]=C.recargos[g]||{};C.recargos[g].activo=!C.recargos[g].activo;b.classList.toggle('tf-on',C.recargos[g].activo);const s=b.closest('.tf-sw').nextElementSibling;if(s&&s.classList.contains('tf-sub'))s.hidden=!C.recargos[g].activo;return}
if(a==='zadd'){leer();C.zonas=C.zonas||[];C.zonas.push({nombre:'',precio:C.base,radio_km:1.5,lat:null,lng:null,activo:true});pintar();return}
if(a==='zdel'){leer();if(!(await pdConfirmar('¿Eliminar esta zona?')))return;C.zonas.splice(Number(b.dataset.i),1);pintar();return}
if(a==='zact'){leer();const z=C.zonas[Number(b.dataset.i)];z.activo=z.activo===false;b.classList.toggle('tf-on',z.activo!==false);return}
if(a==='zgps'){leer();if(!navigator.geolocation){if(msg)msg.textContent='Este equipo no permite obtener la ubicación.';return}b.textContent='Buscando…';navigator.geolocation.getCurrentPosition(p=>{const z=C.zonas[Number(b.dataset.i)];z.lat=Number(p.coords.latitude.toFixed(6));z.lng=Number(p.coords.longitude.toFixed(6));pintar()},()=>{b.textContent='Usar mi ubicación';if(msg){msg.className='tf-bad';msg.textContent='No se pudo obtener la ubicación.'}},{enableHighAccuracy:true,timeout:15000});return}
if(a==='sim'){leer();const viejo=pdTarifa.config;const km=num($('pdtfSimKm').value,0),sub=0,dest=pdTarifa.coords($('pdtfSimDest').value);
const r=simular(km,sub,dest);$('pdtfSimRes').innerHTML='<div class="tf-res"><div class="tf-t"><span>Delivery</span><span>'+money(r.total)+'</span></div>'+r.detalle.map(d=>'<div class="tf-l"><span>'+E(d.concepto)+'</span><span>'+(d.monto<0?'− ':'')+money(Math.abs(d.monto))+'</span></div>').join('')+'</div>';return}
if(a==='guardar'){leer();
const malas=(C.zonas||[]).filter(z=>z.activo!==false&&(!z.nombre||!(Number(z.radio_km)>0)||z.lat==null));
if(malas.length){msg.className='tf-bad';msg.textContent='Completa nombre, radio y centro de cada zona activa (o desactívala).';return}
if(!(C.base>=0)||!(C.por_km>=0)){msg.className='tf-bad';msg.textContent='Revisa la tarifa base y el precio por km.';return}
b.disabled=true;b.textContent='Guardando…';msg.className='';msg.textContent='';
try{await pdTarifa.guardar(C);msg.textContent='Tarifas guardadas. La tienda ya cobra con estos valores.';const t=document.querySelector('#pdtfModal .tf-top small');if(t)t.textContent='Última actualización: ahora'}
catch(e){msg.className='tf-bad';msg.textContent='No se pudo guardar: '+(e.message||e)+'. Revisa que el Admin pueda subir archivos al bucket «restaurantes» de Supabase.'}
finally{b.disabled=false;b.textContent='Guardar tarifas'}
}
}
function simular(km,sub,dest){
return pdTarifa.calcularCon(JSON.parse(JSON.stringify(C)),{km,subtotal:sub,destino:dest});
}
function boton(){
window.pdTarifasAbrir=abrir;
}
function calcFormulario(totalId,origenIds,destinoId,etq){
const tot=$(totalId);if(!tot||tot.dataset.pdtf)return;tot.dataset.pdtf='1';
const box=document.createElement('div');box.className='pdtfCalc';box.innerHTML='<button type="button">Calcular con la tarifa</button><div class="tf-r"></div>';
(tot.closest('.field')||tot.parentElement).appendChild(box);
box.querySelector('button').onclick=async()=>{
const r=box.querySelector('.tf-r');r.className='tf-r';r.textContent='Calculando…';
try{
await pdTarifa.cargar();
const dest=pdTarifa.coords($(destinoId)?.value);
const orig=origenIds.map(id=>pdTarifa.coords($(id)?.value)).find(Boolean);
if(!dest){r.className='tf-r tf-bad';r.textContent='Falta la ubicación de entrega (enlace de Google Maps o lat, lng).';return}
let km=0,aprox=false,nota='';
if(orig){const d=await pdTarifa.distanciaRuta(orig,dest);km=d.km;aprox=d.aproximado}else nota=' Sin ubicación de '+etq+': se cobra tarifa base o de zona.';
const t=pdTarifa.calcular({km,destino:dest,aproximado:aprox});
tot.value=t.total.toFixed(2);tot.dispatchEvent(new Event('input',{bubbles:true}));tot.dispatchEvent(new Event('change',{bubbles:true}));
r.innerHTML='<b>'+money(t.total)+'</b>'+(km?' · '+km.toFixed(2)+' km'+(aprox?' (aprox.)':''):'')+(t.zona?' · Zona '+E(t.zona):'')+'<br>'+t.detalle.map(d=>E(d.concepto)+': '+money(d.monto)).join(' · ')+E(nota);
}catch(e){r.className='tf-r tf-bad';r.textContent='No se pudo calcular: '+(e.message||e)}
};
}
function formularios(){calcFormulario('admRecojoTotal',['admRecojoUbicacion'],'admRecojoUbicacionEntrega','recojo');calcFormulario('admCompraTotal',['admCompraLugar'],'admCompraUbicacion','compra')}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('pdtfModal')&&!$('pdtfModal').hidden)cerrar()});
setInterval(()=>{try{boton();formularios()}catch(e){}},1200);
})();
}catch(e){console.error("[pidemas-tarifa-admin-js]",e)}

/* ===== pidemas-mapa-admin-js ===== */
try{
(function(){
const $=id=>document.getElementById(id);
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PIURA={lat:-5.1945,lng:-80.6328};
const PIN='<svg viewBox="0 0 40 52" width="100%" height="100%" aria-hidden="true"><path d="M20 51c0 0 18-18.6 18-31A18 18 0 0 0 2 20c0 12.4 18 31 18 31z" fill="#141413"/><circle cx="20" cy="20" r="7" fill="#FFFFFF"/></svg>';
const TILES='https://tile.openstreetmap.org/{z}/{x}/{y}.png',ATTR='© OpenStreetMap';
let Lp=null;
function leaflet(){
if(window.L&&L.map)return Promise.resolve(L);if(Lp)return Lp;
Lp=new Promise((ok,ko)=>{if(!document.querySelector('link[href*="leaflet@1.9.4"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(l)}
const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.onload=()=>ok(window.L);s.onerror=()=>{Lp=null;ko(new Error('No cargó el mapa'))};document.head.appendChild(s)});return Lp;
}
function coords(v){
const s=decodeURIComponent(String(v||''));
for(const re of [/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/,/[?&](?:q|query|ll|destination|center)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,/(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/]){const m=s.match(re);if(m){const la=Number(m[1]),ln=Number(m[2]);if(Math.abs(la)<=90&&Math.abs(ln)<=180)return {lat:la,lng:ln}}}
return null;
}
const fx=n=>Number(n).toFixed(6);
const linkDe=c=>'https://www.google.com/maps?q='+fx(c.lat)+','+fx(c.lng);
const esCorto=v=>/(maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(String(v||''));
async function inversa(c){
try{const r=await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=es&lat='+c.lat+'&lon='+c.lng);const j=await r.json();const a=j.address||{};
const calle=[a.road||a.pedestrian||a.footway||a.residential,a.house_number].filter(Boolean).join(' ');
const zona=a.neighbourhood||a.suburb||a.quarter||a.city_district||a.hamlet||'';const ciudad=a.city||a.town||a.village||a.county||'';
return {linea:calle||zona||j.name||'',sub:[calle?zona:'',ciudad].filter(Boolean).join(', ')};
}catch(e){return null}
}
async function buscar(q){
const r=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=es&countrycodes=pe&viewbox=-80.78,-5.08,-80.52,-5.30&q='+encodeURIComponent(q+(/piura|castilla|veintis|sullana|paita|catacaos/i.test(q)?'':', Piura')));
const j=await r.json();return (Array.isArray(j)?j:[]).map(x=>({lat:Number(x.lat),lng:Number(x.lon),nom:(x.name||String(x.display_name).split(',')[0]),sub:String(x.display_name).split(',').slice(1,4).join(',').trim()}));
}
let big=null,tRev=null,ultima=null,resolver=null;
function elegir(o){
o=o||{};
return new Promise(res=>{
if(resolver)resolver(null);resolver=res;
let m=$('pdmpMapa');
if(!m){m=document.createElement('div');m.id='pdmpMapa';m.hidden=true;
m.innerHTML='<div class="hd"><button type="button" class="ic" data-a="x" aria-label="Cerrar"><svg class="pdmpI" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M5 12l6 6M5 12l6-6"/></svg></button><b id="pdmpTit"></b></div>'+
'<div class="bq"><div class="in"><svg class="pdmpI" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="M21 21l-6-6"/></svg><input id="pdmpQ" placeholder="Busca la calle o una referencia" enterkeyhint="search" autocomplete="off"></div><div class="rs" id="pdmpRs" hidden></div></div>'+
'<div class="mz"><div class="mp" id="pdmpBig"></div><div class="sh"></div><div class="pin">'+PIN+'</div><div class="tip" id="pdmpTip">Mueve el mapa hasta el lugar</div><button type="button" class="gps" data-a="gps" aria-label="Mi ubicación"><svg class="pdmpI" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg></button></div>'+
'<div class="ft"><div class="dr"><span id="pdmpIco"><svg class="pdmpI" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg></span><span><b id="pdmpDir">Mueve el mapa</b><small id="pdmpSub"></small></span></div><button type="button" class="ok" data-a="ok">Confirmar ubicación</button></div>';
m.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
if(a==='x')cerrar(null);
if(a==='ok'&&big){const c=big.getCenter();cerrar({lat:Number(fx(c.lat)),lng:Number(fx(c.lng)),linea:ultima&&ultima.linea||'',sub:ultima&&ultima.sub||''})}
if(a==='gps'){if(!navigator.geolocation)return;b.style.opacity=.5;navigator.geolocation.getCurrentPosition(p=>{b.style.opacity=1;big&&big.setView([p.coords.latitude,p.coords.longitude],18)},()=>{b.style.opacity=1;pdAviso('No se pudo obtener tu ubicación. Revisa el permiso de ubicación del navegador.')},{enableHighAccuracy:true,timeout:20000,maximumAge:0})}
if(a==='res'){const r=JSON.parse(b.dataset.r);$('pdmpRs').hidden=true;$('pdmpQ').blur();big&&big.setView([r.lat,r.lng],18)}
});
let tq=null;const q=m.querySelector('#pdmpQ'),rs=m.querySelector('#pdmpRs');
const correr=async()=>{const v=q.value.trim();if(v.length<3){rs.hidden=true;return}const k=coords(v);if(k){rs.hidden=true;big&&big.setView([k.lat,k.lng],18);return}
rs.hidden=false;rs.innerHTML='<div class="nada">Buscando…</div>';
try{const L2=await buscar(v);rs.innerHTML=L2.length?L2.map(r=>'<button type="button" data-a="res" data-r=\''+E(JSON.stringify({lat:r.lat,lng:r.lng}))+'\'><svg class="pdmpI" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg><span>'+E(r.nom)+'<small>'+E(r.sub)+'</small></span></button>').join(''):'<div class="nada">No encontramos esa dirección. Prueba con otra calle o mueve el mapa a mano.</div>'}catch(e){rs.innerHTML='<div class="nada">No se pudo buscar. Mueve el mapa a mano.</div>'}};
q.addEventListener('input',()=>{clearTimeout(tq);tq=setTimeout(correr,600)});
q.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();clearTimeout(tq);correr()}});
}
document.body.appendChild(m);m.hidden=false;document.documentElement.style.overflow='hidden';
$('pdmpTit').textContent=o.titulo||'Marcar ubicación';
$('pdmpTip').textContent=o.tip||'Mueve el mapa hasta el lugar';$('pdmpTip').style.display='';$('pdmpQ').value='';$('pdmpRs').hidden=true;
const ini=o.centro||PIURA,z=o.centro?18:15;ultima=null;
$('pdmpDir').textContent='Cargando mapa…';$('pdmpSub').textContent='';
leaflet().then(L=>{
if(!big){big=L.map('pdmpBig',{zoomControl:false}).setView([ini.lat,ini.lng],z);L.tileLayer(TILES,{maxZoom:19,attribution:ATTR}).addTo(big);
big.on('movestart',()=>{m.classList.add('mov');$('pdmpTip').style.display='none'});big.on('moveend',()=>{m.classList.remove('mov');rev()})}
else big.setView([ini.lat,ini.lng],z,{animate:false});
setTimeout(()=>{big.invalidateSize();rev()},60);
}).catch(()=>{$('pdmpDir').textContent='No se pudo cargar el mapa';$('pdmpSub').textContent='Revisa tu conexión e inténtalo de nuevo.'});
});
}
function rev(){
if(!big)return;const c=big.getCenter();$('pdmpDir').textContent='Buscando dirección…';$('pdmpSub').textContent=fx(c.lat)+', '+fx(c.lng);
clearTimeout(tRev);tRev=setTimeout(async()=>{const r=await inversa(c);const n=big.getCenter();if(Math.abs(n.lat-c.lat)>1e-6||Math.abs(n.lng-c.lng)>1e-6)return;ultima=r;
$('pdmpDir').textContent=r&&r.linea?r.linea:'Punto marcado en el mapa';$('pdmpSub').textContent=r&&r.sub?r.sub:fx(c.lat)+', '+fx(c.lng)},500);
}
function cerrar(v){const m=$('pdmpMapa');if(m)m.hidden=true;document.documentElement.style.overflow='';const r=resolver;resolver=null;if(r)r(v)}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('pdmpMapa')&&!$('pdmpMapa').hidden){e.stopPropagation();cerrar(null)}},true);
window.pdMapaElegir=elegir;
const CAMPOS=[
{id:'admRecojoUbicacion',dir:'admRecojoDireccion',titulo:'Lugar de recojo',icono:'ti-package'},
{id:'admRecojoUbicacionEntrega',dir:'admRecojoEntrega',titulo:'Lugar de entrega',icono:'ti-home'},
{id:'encGpsRecojo',dir:'encDireccionRecojo',titulo:'Lugar de recojo de la encomienda',icono:'ti-package'},
{id:'admCompraUbicacion',dir:'admCompraDireccion',titulo:'Lugar de entrega de la compra',icono:'ti-home'},
{id:'admCompraLugar',dir:null,titulo:'Dónde se hace la compra',icono:'ti-building-store',lugar:true},
{id:'clienteUbicacion',dir:'clienteDireccion',titulo:'Ubicación del cliente',icono:'ti-user',ancla:'.pdcWithBtn'}
];
const minis=new Map();
function setVal(el,v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}
function pintarCampo(cfg){
const inp=$(cfg.id),box=inp&&$('pdmpB_'+cfg.id);if(!box)return;
const k=coords(inp.value),pv=box.querySelector('.pdmpPv'),st=box.querySelector('.pdmpSt'),bt=box.querySelector('.pdmpBt span');
bt.textContent=k?'Cambiar en el mapa':'Marcar en el mapa';
if(k){st.className='pdmpSt';st.innerHTML=fx(k.lat)+', '+fx(k.lng)+' · <a href="'+linkDe(k)+'" target="_blank" rel="noopener">Ver en Google Maps</a>'}
else if(esCorto(inp.value)){st.className='pdmpSt bad';st.textContent='Este enlace corto no trae coordenadas: la tarifa no se puede calcular. Márcalo en el mapa.'}
else{st.className='pdmpSt';st.textContent=''}
pv.hidden=!k;
if(k&&pv.offsetWidth)leaflet().then(L=>{
let mm=minis.get(cfg.id);const el=pv.querySelector('.mp');
if(!mm||mm.getContainer()!==el){mm=L.map(el,{zoomControl:false,dragging:false,touchZoom:false,scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false,tap:false}).setView([k.lat,k.lng],17);L.tileLayer(TILES,{maxZoom:19,attribution:ATTR}).addTo(mm);minis.set(cfg.id,mm)}
else{mm.invalidateSize();mm.setView([k.lat,k.lng],17,{animate:false})}
}).catch(()=>{});
}
async function abrirCampo(cfg){
const inp=$(cfg.id);if(!inp)return;
const r=await elegir({titulo:cfg.titulo,icono:cfg.icono,centro:coords(inp.value)});
if(!r)return;
const link=linkDe(r);
if(cfg.lugar){const nombre=inp.value.replace(/https?:\/\/\S+/g,'').replace(/[\s·–-]+$/,'').trim()||[r.linea,r.sub].filter(Boolean).join(', ');setVal(inp,(nombre?nombre+' · ':'')+link)}
else setVal(inp,link);
const d=cfg.dir&&$(cfg.dir);if(d&&!d.value.trim()&&r.linea)setVal(d,[r.linea,r.sub].filter(Boolean).join(', '));
pintarCampo(cfg);
}
function montar(){
CAMPOS.forEach(cfg=>{
const inp=$(cfg.id);if(!inp)return;
if(!$('pdmpB_'+cfg.id)){
const b=document.createElement('div');b.className='pdmpBox';b.id='pdmpB_'+cfg.id;
b.innerHTML='<button type="button" class="pdmpBt"><svg class="pdmpI" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z"/><path d="M9 4v13M15 7v13"/></svg><span>Marcar en el mapa</span></button><div class="pdmpPv" hidden><div class="mp"></div><div class="pin">'+PIN+'</div></div><div class="pdmpSt"></div>';
const anc=cfg.ancla&&inp.closest(cfg.ancla);if(anc)anc.insertAdjacentElement('afterend',b);else (inp.closest('.field')||inp.parentElement).appendChild(b);
b.querySelector('.pdmpBt').onclick=e=>{e.preventDefault();abrirCampo(cfg)};
b.querySelector('.pdmpPv').onclick=()=>abrirCampo(cfg);
inp.addEventListener('input',()=>pintarCampo(cfg));
if(cfg.lugar&&!inp.placeholder)inp.placeholder='Nombre del lugar (opcional: márcalo en el mapa)';
}
const f=inp.value+'|'+!!$('pdmpB_'+cfg.id).offsetWidth;if(inp.dataset.pdmpF!==f){inp.dataset.pdmpF=f;pintarCampo(cfg)}
});
}
setInterval(()=>{try{montar()}catch(e){}},800);
})();
}catch(e){console.error("[pidemas-mapa-admin-js]",e)}

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

/* ===== pidemas-horario-admin-js ===== */
try{
(function(){
const $=id=>document.getElementById(id);
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ORDEN=['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];
let C=null;
const h12=v=>{const m=String(v||'').match(/(\d{1,2}):(\d{2})/);if(!m)return v;const h=+m[1],ap=h>=12?'pm':'am';return (h%12||12)+(m[2]!=='00'?':'+m[2]:'')+' '+ap};
const fechaTxt=s=>{try{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d).toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}catch(e){return s}};
function abrir(){
let m=$('pdhoModal');if(!m){m=document.createElement('div');m.id='pdhoModal';document.body.appendChild(m)}
m.hidden=false;document.body.classList.add('pd-modal-abierto');
m.innerHTML='<div class="bg" data-a="x"></div><div class="s"><div class="hd"><span><b>Horario de Pidemás</b><small>Cargando…</small></span><button type="button" class="x" data-a="x">×</button></div></div>';
m.onclick=e=>{const b=e.target.closest('[data-a]');if(b)acc(b)};
m.oninput=leer;
pdHorario.cargar().then(c=>{C=c;pintar()}).catch(()=>{C=pdHorario.config;pintar()});
}
function cerrar(){const m=$('pdhoModal');if(m)m.hidden=true;document.body.classList.remove('pd-modal-abierto')}
function pintar(){
const m=$('pdhoModal');if(!m||!C)return;
const fecha=C.actualizado?new Date(C.actualizado).toLocaleString('es-PE',{dateStyle:'short',timeStyle:'short'}):'nunca (valores por defecto)';
m.querySelector('.s').innerHTML='<div class="hd"><span><b>Horario de Pidemás</b><small>Última actualización: '+E(fecha)+'</small></span><button type="button" class="x" data-a="x">×</button></div><div class="bd">'+
'<div class="c">'+
ORDEN.map(k=>{const d=C.dias[k];const on=d.activo!==false;return '<div class="d"><div class="dh"><span><b>'+pdHorario.NOM[k]+'</b><small class="'+(on?'':'off')+'">'+(on?'Pedidos de '+h12(d.abre)+' a '+h12(d.ultimo):'No atendemos')+'</small></span><button type="button" class="tg'+(on?' on':'')+'" data-a="dia" data-k="'+k+'" aria-label="Atiende el '+pdHorario.NOM[k]+'"></button></div>'+
'<div class="hh"'+(on?'':' hidden')+'><label class="f">Abre<input type="time" data-k="'+k+'" data-c="abre" value="'+E(d.abre)+'"></label><label class="f">Último pedido<input type="time" data-k="'+k+'" data-c="ultimo" value="'+E(d.ultimo)+'"></label></div></div>'}).join('')+
'<button type="button" class="bt" data-a="copiar" style="width:100%;margin-top:6px">Copiar el horario del lunes a los demás días activos</button></div>'+
'<div class="c"><div class="ct">Días cerrados especiales</div><p class="cs">Feriados u otros días en que Pidemás no atiende, aunque el día de la semana esté activo.</p><div id="pdhoFe">'+
(C.cerrados||[]).slice().sort().map((f,i)=>'<div class="fe"><span>'+E(fechaTxt(f))+'</span><button type="button" data-a="fdel" data-f="'+E(f)+'" aria-label="Quitar">×</button></div>').join('')+
'</div><div class="fadd"><input type="date" id="pdhoF"><button type="button" class="bt" data-a="fadd">Agregar</button></div></div>'+
'<div class="c"><div class="ct">Aviso de último pedido</div><p class="cs">La tienda muestra una barra «Último pedido» antes del cierre.</p><label class="f">Avisar antes del último pedido<select data-c="aviso_min">'+[15,30,45,60].map(v=>'<option value="'+v+'"'+(Number(C.aviso_min)===v?' selected':'')+'>'+v+' minutos</option>').join('')+'</select></label></div>'+
'</div><div class="ft"><p id="pdhoMsg"></p><button type="button" class="save" data-a="guardar">Guardar horario</button></div>';
}
function leer(){
const m=$('pdhoModal');if(!m||!C)return;
m.querySelectorAll('input[type=time][data-k]').forEach(i=>{C.dias[i.dataset.k][i.dataset.c]=i.value});
const s=m.querySelector('select[data-c=aviso_min]');if(s)C.aviso_min=Number(s.value);
m.querySelectorAll('.d').forEach(d=>{const k=d.querySelector('[data-a=dia]').dataset.k,c=C.dias[k],sm=d.querySelector('.dh small');if(c.activo!==false)sm.textContent='Pedidos de '+h12(c.abre)+' a '+h12(c.ultimo)});
}
async function acc(b){
const a=b.dataset.a,msg=$('pdhoMsg');
if(a==='x')return cerrar();
leer();
if(a==='dia'){const d=C.dias[b.dataset.k];d.activo=d.activo===false;pintar();return}
if(a==='copiar'){const l=C.dias.lunes;ORDEN.forEach(k=>{if(k!=='lunes'&&C.dias[k].activo!==false){C.dias[k].abre=l.abre;C.dias[k].ultimo=l.ultimo}});pintar();return}
if(a==='fadd'){const v=$('pdhoF').value;if(!v)return;C.cerrados=C.cerrados||[];if(!C.cerrados.includes(v))C.cerrados.push(v);pintar();return}
if(a==='fdel'){C.cerrados=(C.cerrados||[]).filter(x=>x!==b.dataset.f);pintar();return}
if(a==='guardar'){
const mal=ORDEN.find(k=>{const d=C.dias[k];return d.activo!==false&&!(d.abre&&d.ultimo&&d.ultimo>d.abre)});
if(mal){msg.className='bad';msg.textContent='Revisa el '+pdHorario.NOM[mal]+': el último pedido debe ser después de la hora de apertura.';return}
b.disabled=true;b.textContent='Guardando…';msg.className='';msg.textContent='';
try{await pdHorario.guardar(C);msg.textContent='Horario guardado. La tienda ya lo usa.';const t=document.querySelector('#pdhoModal .hd small');if(t)t.textContent='Última actualización: ahora'}
catch(e){msg.className='bad';msg.textContent='No se pudo guardar: '+(e.message||e)}
finally{b.disabled=false;b.textContent='Guardar horario'}
}
}
function boton(){
const qr=$('pdhQrBtn');if(!qr||$('pdhoBtn'))return;
const b=document.createElement('button');b.type='button';b.id='pdhoBtn';b.className=qr.className;b.style.cssText=qr.style.cssText;b.textContent='Horario de Pidemás';
b.onclick=e=>{e.preventDefault();abrir()};qr.insertAdjacentElement('beforebegin',b);
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('pdhoModal')&&!$('pdhoModal').hidden)cerrar()});
setInterval(()=>{try{boton()}catch(e){}},1000);
})();
}catch(e){console.error("[pidemas-horario-admin-js]",e)}

/* ===== pidemas-agencias-mapa-js ===== */
try{
(function(){
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const RUTA='config/agencias.json',BUCKET='restaurantes';
  const DB=()=>{try{return db}catch(e){return window.db}};
  const clave=n=>String(n||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const PIN='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  const RUTA_ICO='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z"/><path d="M9 4v13M15 7v13"/></svg>';
  let CFG={},cargado=false;
  window.pdAgenciaUbicacion=n=>CFG[clave(n)]||null;
  window.pdAgenciasRecargar=()=>cargar();
  async function cargar(){
    try{const c=DB();if(!c||!c.storage)return;const u=c.storage.from(BUCKET).getPublicUrl(RUTA).data.publicUrl+'?t='+Date.now();
      const r=await fetch(u,{cache:'no-store'});if(r.ok){const j=await r.json();if(j&&typeof j==='object')CFG=j.agencias||j}}catch(e){}
    cargado=true;pronto();
  }
  setTimeout(cargar,700);setInterval(cargar,5*60*1000);
  const mapsLink=u=>'https://www.google.com/maps/search/?api=1&query='+u.lat+','+u.lng;
  const ruta=u=>mapsLink(u);

   
  async function guardar(nombre,id,r){
    const c=DB();if(!c||!c.storage)throw new Error('Sin conexión');
    let actual={};try{const u=c.storage.from(BUCKET).getPublicUrl(RUTA).data.publicUrl+'?t='+Date.now();const x=await fetch(u,{cache:'no-store'});if(x.ok)actual=(await x.json())||{}}catch(e){}
    actual=actual.agencias||actual;
    actual[clave(nombre)]={nombre,id:id||null,lat:r.lat,lng:r.lng,direccion:[r.linea,r.sub].filter(Boolean).join(', '),actualizado:new Date().toISOString()};
    const {error}=await c.storage.from(BUCKET).upload(RUTA,new Blob([JSON.stringify({agencias:actual},null,2)],{type:'application/json'}),{upsert:true,contentType:'application/json',cacheControl:'0'});
    if(error)throw error;CFG=actual;pronto();
  }
  window.pdMarcarAgencia=async function(nombre,id){
    if(!nombre||typeof window.pdMapaElegir!=='function')return;
    const u=CFG[clave(nombre)];
    const r=await window.pdMapaElegir({titulo:'Ubicación de '+nombre,tip:'Mueve el mapa hasta la puerta de la agencia',centro:u?{lat:u.lat,lng:u.lng}:null});
    if(!r)return;
    try{await guardar(nombre,id,r)}catch(e){pdAviso('No se pudo guardar la ubicación de la agencia: '+(e.message||e))}
  };
  const agNombre=id=>{try{const a=(adminAgencias||[]).find(x=>String(x.id)===String(id));return a?a.nombre:''}catch(e){return ''}};
  const ubic=(nombre,id)=>CFG[clave(nombre)]||(id?Object.values(CFG).find(x=>x&&String(x.id)===String(id)):null)||null;
   
  function linea(host,nombre,id,despues,pedirNombre){
    let el=host.querySelector(':scope > .pdAgUb');
    if(!nombre&&!pedirNombre){el&&(el.hidden=true);return}
    const u=nombre?ubic(nombre,id):null;const key=(nombre||'')+'|'+(u?u.lat+','+u.lng+u.direccion:'')+'|'+!!pedirNombre;
    if(!el){el=document.createElement('div');el.className='pdAgUb';despues?despues.after(el):host.appendChild(el)}
    el.hidden=false;if(el.dataset.k===key)return;el.dataset.k=key;
    el.classList.toggle('no',!u);
    el.innerHTML=u?`<span class="ic">${PIN}</span><span class="tx"><b>Ubicación marcada</b><small>${E(u.direccion||'Punto marcado en el mapa')}</small></span><span class="acc"><button type="button" class="bt">Cambiar</button><a class="bt" href="${mapsLink(u)}" target="_blank" rel="noopener">Ver mapa</a></span>`
      :`<span class="ic">${PIN}</span><span class="tx"><b>Sin ubicación</b><small>${pedirNombre&&!nombre?'Escribe el nombre para agregarla':'Agrégala para el motorizado'}</small></span><span class="acc"><button type="button" class="bt dk">Agregar ubicación en el mapa</button></span>`;
    el.querySelector('button').onclick=e=>{e.preventDefault();const n=typeof pedirNombre==='function'?pedirNombre():nombre;if(!n){const i=host.querySelector('input');i&&i.focus();return}window.pdMarcarAgencia(n,id)};
  }
  function admin(){
     
    document.querySelectorAll('#encAgencia, .encExtraAgencia').forEach(sel=>{
      const field=sel.closest('.field');if(!field)return;
      const opt=sel.options[sel.selectedIndex];const nombre=sel.value&&opt?(agNombre(sel.value)||opt.textContent.trim()):'';
      linea(field,nombre,sel.value);
    });
     
    document.querySelectorAll('#agLista .pdgAg').forEach(card=>{
      const id=card.dataset.id;const nombre=agNombre(id)||card.querySelector('.pdgAgHead strong')?.textContent.trim();
      linea(card,nombre,id,card.querySelector('.pdgAgHead'));
    });
     
    const agN=document.getElementById('agNombre');
    if(agN){const f=agN.closest('.field')||agN.parentElement;linea(f,agN.value.trim(),null,agN,()=>agN.value.trim());
      if(!agN.dataset.pdAg){agN.dataset.pdAg='1';agN.addEventListener('input',()=>pronto())}
    }
     
    document.querySelectorAll('#encAgencia, .encExtraAgencia').forEach(sel=>{
      const field=sel.closest('.field');if(!field||field.querySelector('.pdAgNueva'))return;
      const w=document.createElement('div');w.className='pdAgNueva';
      w.innerHTML=`<button type="button" class="pdAgNuevaBt">¿La agencia no está en la lista? Agrégala con el mapa</button><div class="pdAgNuevaF" hidden><input class="an" placeholder="Nombre de la agencia" autocomplete="off"><input class="ad" placeholder="Destino (ej. Lima - Los Olivos)" autocomplete="off"><button type="button" class="ok">Marcar ubicación y agregar</button><small class="msg"></small></div>`;
      field.appendChild(w);
      w.querySelector('.pdAgNuevaBt').onclick=e=>{e.preventDefault();const f=w.querySelector('.pdAgNuevaF');f.hidden=!f.hidden;if(!f.hidden)w.querySelector('.an').focus()};
      w.querySelector('.ok').onclick=e=>{e.preventDefault();nuevaAgencia(sel,w)};
    });
  }
  async function nuevaAgencia(sel,w){
    const nombre=w.querySelector('.an').value.trim(),destino=w.querySelector('.ad').value.trim(),msg=w.querySelector('.msg');
    if(!nombre){msg.textContent='Escribe el nombre de la agencia.';return}
    if(!destino){msg.textContent='Escribe el destino del paquete.';return}
    if(typeof window.pdMapaElegir!=='function')return;
    const r=await window.pdMapaElegir({titulo:'Ubicación de '+nombre,tip:'Mueve el mapa hasta la puerta de la agencia'});
    if(!r){msg.textContent='Marca la ubicación en el mapa para agregar la agencia.';return}
    const c=DB();msg.textContent='Agregando agencia…';
    try{
      let ag=null;const ya=(()=>{try{return (adminAgencias||[]).find(a=>clave(a.nombre)===clave(nombre))}catch(e){return null}})();
      if(ya)ag=ya;else{const {data,error}=await c.from('agencias').insert({nombre,activo:true}).select('id,nombre').single();if(error)throw error;ag=data}
      const {data:de,error:e2}=await c.from('agencia_destinos').insert({agencia_id:ag.id,destino_final:destino,activo:true}).select('id').single();if(e2)throw e2;
      await guardar(ag.nombre||nombre,ag.id,r);
      if(typeof loadAdminAgencias==='function')await loadAdminAgencias();
      sel.value=String(ag.id);sel.dispatchEvent(new Event('change',{bubbles:true}));
      await new Promise(x=>setTimeout(x,150));
      const row=sel.closest('.encPaqueteExtra');
      if(row&&typeof encRefreshExtraDestinos==='function')encRefreshExtraDestinos(row);
      const ds=row?row.querySelector('.encExtraDestino'):document.getElementById('encDestino');
      if(ds&&de&&[...ds.options].some(o=>o.value===String(de.id))){ds.value=String(de.id);ds.dispatchEvent(new Event('change',{bubbles:true}))}
      w.querySelector('.pdAgNuevaF').hidden=true;w.querySelector('.an').value='';w.querySelector('.ad').value='';msg.textContent='';
    }catch(err){msg.textContent='No se pudo agregar la agencia: '+(err.message||err)}
  }

   
  const list=()=>{try{return Array.isArray(orders)?orders:[]}catch(e){return []}};
  function agenciasDe(o){
    const n=[o.agencia_destino];
    try{(typeof extractEncomiendaPackages==='function'?extractEncomiendaPackages(o.observaciones):[]).forEach(p=>n.push(p.agencia))}catch(e){}
    const vistos=new Set();return n.map(x=>String(x||'').trim()).filter(x=>x&&x!=='—'&&!vistos.has(clave(x))&&vistos.add(clave(x)));
  }
  function moto(){
    const modal=document.getElementById('pidemasOrderFullModal');if(!modal)return;
    const content=modal.querySelector('#pidemasOrderFullModalContent');if(!content)return;
    const o=list().find(x=>String(x.id)===String(modal.dataset.orderId||''));
    let card=content.querySelector(':scope > .pdAgCard');
    const enc=o&&String(o.tipo_servicio||'').toLowerCase().includes('encomienda')&&!['entregado','cancelado','asignado'].includes(String(o.estado||'').toLowerCase());
    const ags=enc?agenciasDe(o).map(n=>({n,u:CFG[clave(n)]})).filter(x=>x.u):[];
    if(!ags.length){card&&card.remove();return}
    const key=ags.map(x=>x.n+x.u.lat+x.u.lng).join('|');
    if(card&&card.dataset.k===key)return;
    const w=document.createElement('div');
    w.innerHTML=`<div class="pdAgCard"><span class="k">${ags.length>1?'Ubicación de las agencias':'Ubicación de la agencia'}</span>${ags.map(x=>`<div class="r"><span><b>${E(x.u.nombre||x.n)}</b>${x.u.direccion?`<small>${E(x.u.direccion)}</small>`:''}</span><a class="go" href="${ruta(x.u)}" target="_blank" rel="noopener">${RUTA_ICO}Ver ubicación</a></div>`).join('')}</div>`;
    const nb=w.firstElementChild;nb.dataset.k=key;
    if(card)card.replaceWith(nb);else{const ref=content.querySelector(':scope > .peWrap')||content.querySelector(':scope > .pdMPay');ref?ref.before(nb):content.appendChild(nb)}
  }
  const ES_ADMIN=!!document.getElementById('orderList')||!!document.getElementById('agLista');
  function todo(){if(!cargado)return;try{ES_ADMIN?admin():(document.getElementById('pidemas-moto-encomienda-js')?null:moto())}catch(e){}}
  let q=false;function pronto(){if(q)return;q=true;queueMicrotask(()=>{q=false;todo()})}
  new MutationObserver(m=>{if(m.some(x=>!(x.target.closest&&x.target.closest('.pdAgUb,.pdAgCard'))))pronto()}).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('change',e=>{if(e.target&&e.target.matches&&e.target.matches('#encAgencia,.encExtraAgencia'))pronto()},true);
  setInterval(pronto,1500);
})();
}catch(e){console.error("[pidemas-agencias-mapa-js]",e)}

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
const cs=getComputedStyle(el);if(cs.position!=='fixed')return;
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
if(ignorar>0){ignorar--;return}
if(puestos>0){puestos--;const antes=abiertas().nivel;cerrarArriba();
setTimeout(()=>{const ahora=abiertas().nivel;if(ahora>=antes&&ahora>0){try{history.pushState({pdNivel:puestos+1},'')}catch(e){}puestos++}else sync(true)},350)}
});
let t=null;const prog=()=>{clearTimeout(t);t=setTimeout(sync,150)};
new MutationObserver(prog).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','style','open']});
setInterval(sync,1500);
window.pdAtrasDebug=()=>({puestos,nivel:abiertas().nivel,lista:abiertas().lista.map(e=>e.id||e.className)});
})();
}catch(e){console.error("[pidemas-boton-atras]",e)}

/* ===== pidemas-version ===== */
try{
(function(){
const V='20261103073944',K='pd_ver_'+location.pathname;
async function revisar(){
try{
if(location.protocol==='file:')return;
if(window.pdAtrasDebug&&pdAtrasDebug().nivel>0)return;
const a=document.activeElement;if(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName))return;
const r=await fetch(location.pathname+'?chk='+Date.now(),{cache:'no-store'});if(!r.ok)return;
const m=(await r.text()).match(/name="pd-version" content="([^"]+)"/);
if(!m||m[1]===V)return;
if(sessionStorage.getItem(K)===m[1])return;sessionStorage.setItem(K,m[1]);
const u=new URL(location.href);u.searchParams.set('v',m[1]);location.replace(u.toString());
}catch(e){}
}
setTimeout(revisar,2500);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)revisar()});
setInterval(revisar,5*60*1000);
})();
}catch(e){console.error("[pidemas-version]",e)}

/* ===== pidemas-whatsapp-verde-js ===== */
try{
/* Marca con .pdWa los botones que llevan a WhatsApp por su texto (p. ej. «WhatsApp», «Coordinar pago por WhatsApp», «Abrir grupo»), para pintarlos de verde */
(function(){
  const RE=/whatsapp|wa\.me/i;
  function marcar(){
    document.querySelectorAll('button:not(.pdWa),a:not(.pdWa),[role="button"]:not(.pdWa)').forEach(b=>{
      const t=(b.textContent||'')+' '+(b.getAttribute('aria-label')||'')+' '+(b.getAttribute('title')||'')+' '+(b.getAttribute('href')||'')+' '+(b.getAttribute('onclick')||'')+' '+(b.dataset&&b.dataset.wa||'');
      if(RE.test(t)&&(b.textContent||'').trim().length<60)b.classList.add('pdWa');
    });
  }
  let p=false;const pedir=()=>{if(!p){p=true;requestAnimationFrame(()=>{p=false;marcar()})}};
  new MutationObserver(pedir).observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',marcar);else marcar();
})();
}catch(e){console.error("[pidemas-whatsapp-verde-js]",e)}

/* ===== pidemas-boton-principal-js ===== */
try{
/* Marca con .pdPrim los botones principales: fondo naranja, anchos (140 px o más) y no redondos (no son píldoras de opción) */
(function(){
  const NAR=/rgb\(196, 65, 12\)/;
  function marcar(){
    document.querySelectorAll('button:not(.pdPrim)').forEach(b=>{
      if(!b.getClientRects().length||b.closest('nav,#nav,#panNav,#adminBottomNav'))return;
      const c=getComputedStyle(b),r=b.getBoundingClientRect();
      if(NAR.test(c.backgroundColor)&&r.width>=140&&r.height>=36&&parseFloat(c.borderRadius)<=16&&(b.textContent||'').trim().length>2)b.classList.add('pdPrim');
    });
  }
  let p=false;const pedir=()=>{if(!p){p=true;requestAnimationFrame(()=>{p=false;marcar()})}};
  new MutationObserver(pedir).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden']});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',marcar);else marcar();
})();
}catch(e){console.error("[pidemas-boton-principal-js]",e)}

/* ===== pidemas-hojas-b-js ===== */
try{
/* Mi perfil: los campos van en una tarjeta, igual que en las demás hojas */
(function(){
function armar(){
  const c=document.querySelector('#pdhSheet .h-sheetCard');if(!c||c.querySelector(':scope > .pdhSec'))return;
  const ls=[...c.querySelectorAll(':scope > .h-lbl, :scope > .h-note:not(#pdhMsg)')];if(!ls.length)return;
  const s=document.createElement('section');s.className='pdhSec';s.innerHTML='<h4>Tus datos</h4>';
  ls[0].before(s);ls.forEach(e=>s.appendChild(e));
}
new MutationObserver(armar).observe(document.documentElement,{childList:true,subtree:true});armar();
})();
}catch(e){console.error("[pidemas-hojas-b-js]",e)}

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
  /* «Pedidos» ya está en el inicio: en vez de abrir una ventana, vuelve arriba */
  function enlazar(){
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
    ['cli','Clientes',abrir('clientes')],
    ['mas','Crear negocio',abrir('crear-negocio')],
    ['neg','Estado de negocios',abrir('estado-negocios')],
    ['sol','Solicitudes de afiliación',abrir('solicitudes')],
    ['cfg','Configurar negocios',abrir('config-negocios')],
    ['Servicios'],
    ['rec','Recojo y entrega',abrir('recojo')],
    ['com','Compra',abrir('compra')],
    ['enc','Encomienda',abrir('encomienda')],
    ['tar','Tarifas',()=>{if(typeof window.pdTarifasAbrir==='function')window.pdTarifasAbrir()}],
    ['age','Agencias',abrir('agencias')],
    ['Motorizados'],
    ['gps','Motorizados / GPS',abrir('gps')],
    ['moto','Crear motorizado',abrir('crear-motorizado')],
    ['ban','Suspender / reactivar cuentas',abrir('suspender-motorizado')],
    ['Más'],
    ['tag','Códigos de descuento',abrir('descuentos')],
    ['qr','QR Yape',abrir('qryape')],
    ['hor','Horario de Pidemás',tocar('#pdhoBtn')],
    ['out','Cerrar sesión',()=>{const b=$('pdaLogout')||$('logout');b&&b.click()},'','out']
  ];
  const PANEL={tienda:IC.com,motorizado:IC.gps,negocios:IC.neg};
  IC.caja='<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2"/><path d="M17 13h.01"/>';
  IC.sueldo='<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>';
  IC.menu='<path d="M4 6h16M4 12h16M4 18h16"/>';
  const PRINC=[['Principal'],['ped','Pedidos',abrir('pedidos'),'pedidos'],['caja','Cajas',abrir('caja')],['sueldo','Sueldos',abrir('sueldo')]];
  function cerrarFab(){cerrar()}
  function montar(){
    if($('pdMenu'))return;
    const sh=document.createElement('div');sh.id='pdMenuShade';
    const m=document.createElement('aside');m.id='pdMenu';m.setAttribute('aria-label','Menú');m.setAttribute('aria-hidden','true');
    const logo=document.querySelector('header.top .brand-logo img');
    m.innerHTML='<nav></nav>';
    const nav=m.querySelector('nav');
    /* Mi perfil: tarjeta propia arriba de "Principal" (abre la misma hoja de perfil que antes abría la R del encabezado) */
    const per=document.createElement('div');per.className='pdPerfil';per.setAttribute('role','button');per.tabIndex=0;per.setAttribute('aria-label','Mi perfil');
    per.innerHTML='<span class="pdPerfilAv" aria-hidden="true">R</span><span class="pdPerfilTx"><strong>Administrador</strong><small>Mi perfil</small></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
    const irPerfil=()=>{cerrar();cerrarTodo();setTimeout(()=>{const me=$('pdhMe');if(me)me.click()},120)};
    per.addEventListener('click',irPerfil);
    per.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();irPerfil()}});
    nav.appendChild(per);
    const todos=PRINC.concat(ITEMS);
    todos.forEach(it=>{
      if(it.length===1){const p=document.createElement('p');p.textContent=it[0];nav.appendChild(p);return}
      if(it[0]==='link'){const a=document.createElement('a');a.href=it[2];a.innerHTML=P(PANEL[it[1].toLowerCase()]||IC.neg)+'<span>'+it[1]+'</span>';a.addEventListener('click',()=>cerrar());nav.appendChild(a);return}
      const b=document.createElement('button');b.type='button';if(it[4])b.className=it[4];if(it[3])b.dataset.k=it[3];
      b.innerHTML=P(IC[it[0]])+'<span>'+it[1]+'</span>'+(it[3]==='pedidos'?'<b class="bdg" hidden></b>':'');
      b.addEventListener('click',()=>{cerrar();cerrarTodo();setTimeout(it[2],120)});
      nav.appendChild(b);
    });
    sh.addEventListener('click',cerrar);
    document.body.append(sh,m);
    const hd=document.querySelector('header.top');

  }
  /* antes de abrir otra ventana, cierra cualquier ventana abierta (no se apilan) */
  function cerrarTodo(){
    const vis=e=>e&&e.getClientRects().length;
    ['#pdtfModal .tf-x','#pdhoModal .hd > .x','#pdaPanel .a-x','#orderList .adminOrderCard.is-expanded .pdCerrarX'].forEach(q=>{const b=document.querySelector(q);if(vis(b))try{b.click()}catch(e){}});
    const ph=$('pdhSheet');if(ph&&!ph.hidden)ph.hidden=true;
    try{const m=$('pdmModal');if(m&&!m.hidden&&window.__pdmClose)window.__pdmClose()}catch(e){}
  }
  window.pdCerrarVentanas=cerrarTodo;
  const logged=()=>!!document.querySelector('#appView:not(.hidden)')&&!$('logout')?.classList.contains('hidden');
  window.pdAbrirMenu=function(){abrirMenu()};
  function abrirMenu(){montar();pintarPerfil();const m=$('pdMenu'),sh=$('pdMenuShade');m.classList.remove('drag');m.style.removeProperty('transform');const pm=$('pdmModal');const enInicio=!(pm&&!pm.hidden);m.querySelectorAll('[data-k="pedidos"]').forEach(b=>b.classList.toggle('act',enInicio));m.classList.add('on');sh.classList.add('on');m.setAttribute('aria-hidden','false')}
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
    const av=m.querySelector('.pdPerfilAv'),nm=m.querySelector('.pdPerfilTx strong');if(!av||!nm)return;
    const n=nombre(),me=$('pdhMe');
    const ini=((me&&me.textContent)||'').trim()||n.charAt(0).toUpperCase()||'R';
    if(av.textContent!==ini)av.textContent=ini;
    if(nm.textContent!==n)nm.textContent=n;
  }
  function aviso(){const m=$('pdMenu');if(!m)return;const b=m.querySelector('.bdg');if(!b)return;let c=0;try{c=(typeof allOrders!=='undefined'&&Array.isArray(allOrders)?allOrders:[]).filter(o=>['pendiente','confirmado'].includes(String(o.estado||'').toLowerCase())&&!o.motorizado_id).length}catch(e){}b.hidden=!c;if(c&&b.textContent!==String(c))b.textContent=c>99?'99+':String(c);}
  /* --- Saludo del inicio --- */
  let okT=0;
  function vigilar(){const c=window.pdPedidosCache;if(c&&!c.__pdOk){const g=c.guardar;c.guardar=function(){okT=Date.now();return g.apply(this,arguments)};c.__pdOk=true}}
  function nombre(){let n=($('pdhName')&&$('pdhName').value||'').trim();if(!n){try{const v=localStorage.getItem('pd_admin_name')||'';try{n=JSON.parse(v)}catch(e){n=v}}catch(e){}}n=String(n||'').trim().split(/\s+/)[0];return n||'Administrador'}
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
    const tab=$('tab-pedidos');if(!tab)return;
    let sb=tab.querySelector(':scope > .pdSal');
    if(!sb){
      sb=document.createElement('div');sb.className='pdSal';
      sb.innerHTML='<div class="pmaTop"><div class="pmaAv" aria-hidden="true"></div><div class="pmaTx"><small></small><strong></strong><span class="con" role="status"><i></i><span></span></span></div></div>'
        +'<div class="pmaAcc"><button type="button" data-a="atendidos"><b>0</b><span>Atendidos hoy</span></button><button type="button" data-a="sueldo"><b>—</b><span>Sueldos</span></button><button type="button" data-a="caja"><b>—</b><span>Cajas</span></button></div>';
      tab.prepend(sb);
      sb.querySelector('.pmaAcc').addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const k=b.dataset.a;
        if(k==='atendidos'){const c=document.querySelector('#tab-pedidos .pdn-chip[data-v="entregado"]');c&&c.click();document.getElementById('orderList')?.scrollIntoView({behavior:'smooth',block:'start'});return}
        if(typeof window.__pdmOpen==='function')window.__pdmOpen(k)});
    }
    const set=(el,v)=>{if(el&&el.textContent!==v)el.textContent=v};
    const d=new Date();
    set(sb.querySelector('.pmaTx > small'),d.toLocaleDateString('es-PE',{weekday:'short',day:'2-digit',month:'short',timeZone:'America/Lima'}).replace(/\./g,'')+' · '+d.toLocaleTimeString('es-PE',{hour:'numeric',minute:'2-digit',timeZone:'America/Lima'}));
    const n=nombre();set(sb.querySelector('.pmaTx > strong'),'Hola, '+n);set(sb.querySelector('.pmaAv'),n.charAt(0).toUpperCase());
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
  const tick=()=>{try{inicio();enlazar();if(logged())montar();pintarPerfil();aviso();vigilar();saludo()}catch(e){}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tick,{once:true});else tick();
  setInterval(tick,800);
})();
}catch(e){console.error("[pidemas-inicio-pedidos-js]",e)}

/* ===== pidemas-clientes-app-js ===== */
try{
/* «+ Nuevo cliente» sale de la barra del buscador y va arriba, a todo el ancho */
(function(){
function armar(){
  const b=document.getElementById('pdcNew'),bar=document.getElementById('pdcBar');if(!b||!bar||b.dataset.pdApp)return;
  b.dataset.pdApp='1';b.textContent='+ Nuevo cliente';bar.before(b);
  const q=document.getElementById('buscarClientesRegistrados');if(q)q.placeholder='Buscar cliente';
}
armar();new MutationObserver(armar).observe(document.documentElement,{childList:true,subtree:true});
})();
}catch(e){console.error("[pidemas-clientes-app-js]",e)}

/* ===== pidemas-guia-tienda-js ===== */
try{
/* Guía de la Tienda: reconoce botones, campos, tarjetas, pastillas, títulos, etiquetas e íconos por su forma
   y les pone las medidas de la Tienda. No cambia colores de fondo. */
(function(){
if(window.__pdGuiaTienda)return;window.__pdGuiaTienda=1;
const NO='#pdMenu, .leaflet-container, .maplibregl-map, nav, #nav, [class*="Slide"], [class*="slide"], [class*="swipe"], [class*="Swipe"], [class*="navbtn"], [class*="Nav"], [class*="gqzNo"], #pdMenuShade';
const TR=v=>!v||v==='transparent'||/rgba\([^)]*,\s*0\)$/.test(v);
const NEUTRO=v=>TR(v)||/^rgba?\((255, 255, 255|255, 249, 245|255, 251, 248|253, 240, 234|250, 247, 244|255, 250, 247)(, 1)?\)$/.test(v);
const NAR=/^rgb\((196, 65, 12|166, 53, 8|194, 65, 12|197, 66, 13)\)$/;
const CS=e=>getComputedStyle(e);
const vis=e=>{const r=e.getBoundingClientRect();return r.width>1&&r.height>1?r:null};
let CAT='gqz';const mark=(e,v)=>{e.dataset[CAT]=v};
const colorAnc=e=>{let x=e.parentElement,n=0;while(x&&x!==document.body&&n<12){const c=CS(x);if(!NEUTRO(c.backgroundColor)&&parseFloat(c.borderTopLeftRadius)>=8)return true;x=x.parentElement;n++}return false};
const fixedTop=e=>{let x=e.parentElement,n=0;while(x&&x!==document.body&&n<14){const c=CS(x);if(c.position==='fixed'){return e.getBoundingClientRect().top-x.getBoundingClientRect().top<130}x=x.parentElement;n++}return false};
function boton(b){
  const r=vis(b);if(!r)return;if(b.closest(NO))return mark(b,'x');
  const c=CS(b),txt=(b.textContent||'').trim(),ico=b.querySelector('svg,i,img');
  if(r.height>70||(ico&&txt&&/flex/.test(c.display)&&c.flexDirection==='column')||(r.height>=50&&b.childElementCount>=2)||(!txt&&!ico)||(r.width<=64&&r.height<=36&&!txt&&!ico))return mark(b,'x');
  const rad=parseFloat(c.borderTopLeftRadius)||0,sq=Math.abs(r.width-r.height)<=8&&r.width>=28&&r.width<=56;
  if(sq&&txt.length<=2){b.classList.add('gqzB-ico');if(/^[×✕x]$/i.test(txt))b.classList.add('gqzX');return mark(b,'ico')}
  if(TR(c.backgroundColor)&&parseFloat(c.borderTopWidth)===0)return mark(b,'x');
  {const p0=b.parentElement;if(p0){const pc=CS(p0),hs=[...p0.children].filter(x=>x.matches('button'));if(hs.length>=2&&hs.length===p0.children.length&&(!TR(pc.backgroundColor)||parseFloat(pc.borderTopWidth)>0)&&parseFloat(pc.borderTopLeftRadius)>=8)return mark(b,'x')}}
  if(rad>=r.height/2-2&&r.height<=46){b.classList.add(r.height<=40?'gqzB-chip':'gqzB-opt');return mark(b,'p')}
  const p=b.parentElement,pw=p?p.getBoundingClientRect().width:0,or=NAR.test(c.backgroundColor);
  if(r.width>=pw*.6||or){b.classList.add('gqzB-main');if(or)b.classList.add('gqzOr');return mark(b,'m')}
  b.classList.add('gqzB-sec');
  if(p&&[...p.querySelectorAll('button')].some(x=>x!==b&&(x.getBoundingClientRect().height>=46||x.classList.contains('gqzB-main'))))b.classList.add('gqzPar');
  mark(b,'s');
}
function campo(i){
  const r=vis(i);if(!r)return;if(i.closest(NO))return mark(i,'x');
  const t=(i.type||'').toLowerCase();
  if(['checkbox','radio','range','file','hidden','color','button','submit','image','reset'].includes(t))return mark(i,'x');
  const c=CS(i);if(TR(c.backgroundColor)&&parseFloat(c.borderTopWidth)===0)return mark(i,'x');
  i.classList.add('gqzF');mark(i,'f');
  const l=i.closest('label')||(i.id&&document.querySelector('label[for="'+CSS.escape(i.id)+'"]'))||(i.closest('.field,.f,[class*="Field"],[class*="field"]')||{}).querySelector?.call(i.closest('.field,.f,[class*="Field"],[class*="field"]')||document.createElement('i'),'label');
  if(l&&!l.dataset.gqzl&&!l.closest(NO)&&(l.textContent||'').trim().length<60){l.classList.add('gqzL');l.dataset.gqzl='1'}
}
function tarjeta(e){
  const r=vis(e);if(!r)return;
  if(r.height<44||r.width<120)return mark(e,'x');
  const c=CS(e),rad=parseFloat(c.borderTopLeftRadius)||0,bw=parseFloat(c.borderTopWidth)||0;
  if(rad<10||(bw===0&&TR(c.backgroundColor))||c.position==='fixed'||c.position==='sticky'||e.closest(NO))return mark(e,'x');
  if(!NEUTRO(c.backgroundColor))return mark(e,'x');
  if(e.parentElement&&e.parentElement.closest('.gqzC,.gqzCi')){e.classList.add('gqzCi');return mark(e,'ci')}
  e.classList.add('gqzC');
  const m=(c.borderTopColor||'').match(/\d+/g)||[];const fuerte=bw>0&&m.length>=3&&(+m[0]-+m[2]>70);
  if(bw===0)e.classList.add('gqzBl','gqzSinBorde');mark(e,'c');
}
function pastilla(e){
  const r=vis(e);if(!r)return;
  if(e.matches('button,input,select,textarea')||e.classList.contains('gqzT-hoja')||e.classList.contains('gqzT-sec'))return mark(e,'x');
  const t=(e.textContent||'').trim();
  if(r.height<=14||r.height>34||r.width>240||!t||t.length>30||e.childElementCount>2||Math.abs(r.width-r.height)<=6&&!/^\d{1,3}\+?$/.test(t)||e.closest(NO))return mark(e,'x');
  const c=CS(e);if(TR(c.backgroundColor)||(parseFloat(c.borderTopLeftRadius)||0)<8)return mark(e,'x');
  if(/^\d{1,3}\+?$/.test(t)&&r.width<=28){e.classList.add('gqzN');return mark(e,'n')}
  e.classList.add('gqzP');if(c.display==='inline'||c.display==='inline-block')e.classList.add('gqzIn');mark(e,'p');
}
function titulo(e){
  const r=vis(e);if(!r)return;if(e.closest(NO)||e.closest('button'))return mark(e,'x');
  const c=CS(e),fs=parseFloat(c.fontSize),fw=parseInt(c.fontWeight)||400,t=(e.textContent||'').trim();
  if(!t||t.length>70||/S\/\s?\d|^\d|%$/.test(t))return mark(e,'x');
  const h12=/^H[12]$/.test(e.tagName),h34=/^H[34]$/.test(e.tagName),nar=NAR.test(c.color),col=colorAnc(e);
  if(h12||(fs>=18.5&&fw>=700&&nar)){e.classList.add(fixedTop(e)?'gqzT-hoja':'gqzT-sec');if(!col)e.classList.add('gqzNar');return mark(e,'t')}
  if(h34||(fs>=15&&fs<=18&&fw>=800&&/^rgb\(166, 53, 8\)$/.test(c.color))){e.classList.add('gqzT-tarj');if(!col&&(nar||/^rgb\(166, 53, 8\)$/.test(c.color)))e.classList.add('gqzNar');return mark(e,'t')}
  if(c.textTransform==='uppercase'&&fs<=12.5&&t.length<=40&&e.childElementCount===0){e.classList.add('gqzK');if(!col)e.classList.add('gqzNar');return mark(e,'k')}
  mark(e,'x');
}
function icono(e){
  const r=vis(e);if(!r)return;if(e.closest('#pdMenu, .leaflet-container, .maplibregl-map, nav, #nav, [class*="Slide"], [class*="slide"], [class*="navbtn"], [class*="Nav"], [class*="gqzNo"]'))return mark(e,'x');
  const isSvg=e.tagName.toLowerCase()==='svg';
  if(r.width>30||r.width<12)return mark(e,'x');
  const b=e.closest('button,a,[role=button]');let k='gqzI20';
  if(b&&b.classList.contains('gqzB-ico'))k='gqzI20';
  else if(b&&(b.classList.contains('gqzB-main')||b.classList.contains('gqzB-sec')||b.classList.contains('gqzB-opt')))k='gqzI18';
  else if(b&&b.classList.contains('gqzB-chip'))k='gqzI16';
  else if(r.width<=15)return mark(e,'x');
  else if(r.width<=17)k='gqzI16';
  e.classList.add(k);
  if(isSvg){const c=CS(e),p=e.querySelector('path,circle,rect,line,polyline,polygon');const st=c.stroke!=='none'||(p&&CS(p).stroke!=='none');if(st)e.classList.add('gqzI')}
  mark(e,'i');
}
const Q=[['button,a.btn,[role="button"],input[type="button"],input[type="submit"]',boton,'gqzb'],['input,select,textarea',campo,'gqzf'],['div,section,article,li,aside,form,fieldset,details,a',tarjeta,'gqzc'],['h1,h2,h3,h4,strong,b,span,div,p,small',titulo,'gqzt'],['span,small,b,em,i,strong,time,label,div',pastilla,'gqzp'],['svg,i[class*="ti-"]',icono,'gqzi']];
/* Se aplica en el mismo instante en que algo aparece (antes de pintarse), así nada salta de tamaño */
function escanear(root){
  for(const [sel,fn,k] of Q){
    CAT=k;
    const els=root===document.body?root.querySelectorAll(sel):[...(root.matches&&root.matches(sel)?[root]:[]),...root.querySelectorAll(sel)];
    for(const e of els){if(e.dataset[k])continue;
      if(k==='gqzt'&&!/^H[1-4]$/.test(e.tagName)&&e.childElementCount>1){e.dataset[k]='x';continue}
      if(k==='gqzp'||k==='gqzc'){const r=e.getBoundingClientRect();if(r.height<=1)continue;if(k==='gqzp'&&(r.height>34||r.height<=14)){e.dataset[k]='x';continue}if(k==='gqzc'&&(r.height<44||r.width<120)){e.dataset[k]='x';continue}}
      if(k!=='gqzc'&&k!=='gqzp'&&(e.classList.contains('gqzC')||e.classList.contains('gqzCi'))){e.dataset[k]='x';continue}
      try{fn(e)}catch(err){}
    }
  }
}
let enCurso=false;
function alCambiar(recs){
  if(enCurso)return;enCurso=true;
  try{
    const roots=new Set();
    for(const r of recs){
      if(r.type==='childList'){for(const n of r.addedNodes)if(n.nodeType===1)roots.add(n)}
      else if(r.target&&r.target.nodeType===1){if(r.attributeName==='class'){const sin=v=>String(v||'').split(/\s+/).filter(x=>x&&!/^gqz/.test(x)).sort().join(' ');if(sin(r.oldValue)===sin(r.target.getAttribute('class')))continue}roots.add(r.target)}
    }
    const lista=[...roots].filter(n=>n.isConnected&&![...roots].some(o=>o!==n&&o.contains(n)));
    if(lista.length>40){escanear(document.body)}else for(const n of lista){if(n.querySelectorAll)escanear(n)}
  }finally{enCurso=false}
}
let tm=null;const repaso=()=>{if(tm)clearTimeout(tm);tm=setTimeout(()=>{tm=null;escanear(document.body)},700)};
new MutationObserver(recs=>{alCambiar(recs);repaso()}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeOldValue:true,attributeFilter:['class','hidden','open','aria-hidden','style']});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>escanear(document.body));else escanear(document.body);
window.addEventListener('load',()=>escanear(document.body));
})();
}catch(e){console.error("[pidemas-guia-tienda-js]",e)}

/* ===== pidemas-pasos-js ===== */
try{
/* Crear negocio / Crear motorizado: una sola ventana, paso a paso */
(function(){
const $=id=>document.getElementById(id);
const F=id=>$(id)?.closest('.field');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const OK='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const REF='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/></svg>';
function hush(el){if(el){el.textContent='';el.classList.add('hidden')}}
async function esperar(el,btn,ms){const t0=Date.now();while(Date.now()-t0<(ms||45000)){await sleep(250);const t=el&&!el.classList.contains('hidden')?el.textContent.trim():'';if(t&&!(btn&&btn.disabled))return t}return ''}
function genPw(){const c='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%*';const a=new Uint32Array(14);crypto.getRandomValues(a);return [...a].map(n=>c[n%c.length]).join('')}
function pwLink(input){const d=document.createElement('div');d.className='pdwPw';d.innerHTML='<span class="pdwCnt">Mínimo 12 caracteres</span><button type="button">Generar contraseña segura</button>';
 const cnt=d.querySelector('.pdwCnt');const pinta=()=>{const n=(input.value||'').length;cnt.className='pdwCnt'+(n&&n<12?' mal':n>=12?' ok':'');cnt.textContent=!n?'Mínimo 12 caracteres':n<12?'Faltan '+(12-n)+' caracteres ('+n+' de 12)':'✓ '+n+' caracteres'};
 input.addEventListener('input',pinta);pinta();
 d.querySelector('button').addEventListener('click',()=>{input.value=genPw();input.type='text';const eye=input.parentElement.querySelector('.passwordEyeBtn');if(eye){eye.textContent='⊗';eye.setAttribute('aria-label','Ocultar contraseña')}input.dispatchEvent(new Event('input'))});return d}
function card(t,p,nodes){const c=document.createElement('section');c.className='pdwCard';c.innerHTML=(t?'<h4>'+E(t)+'</h4>':'')+(p?'<p>'+E(p)+'</p>':'');nodes.filter(Boolean).forEach(n=>c.appendChild(n));return c}
/* guarda el id que devuelve Supabase al insertar en «tabla» (sin tocar la lógica original de guardado) */
function capturar(tabla){
 const db=window.db;let id=null;if(!db||typeof db.from!=='function')return{id:()=>null,fin:()=>{}};
 const orig=db.from;
 db.from=function(t){const qb=orig.apply(this,arguments);if(t!==tabla||!qb||typeof qb.insert!=='function')return qb;
  try{const ins=qb.insert;qb.insert=function(){const r=ins.apply(this,arguments);try{const sel=r.select;if(typeof sel==='function')r.select=function(){const r2=sel.apply(this,arguments);try{const sg=r2.single;if(typeof sg==='function')r2.single=function(){return Promise.resolve(sg.apply(this,arguments)).then(x=>{if(x&&x.data&&x.data.id!=null)id=String(x.data.id);return x})}}catch(e){}return r2}}catch(e){}return r}}catch(e){}
  return qb};
 return{id:()=>id,fin:()=>{if(db.from!==orig)db.from=orig}};
}
function ponerOpcion(sel,id,nombre){if(!sel||!id)return;let o=[...sel.options].find(x=>x.value===id);if(!o){o=document.createElement('option');o.value=id;o.textContent=nombre;sel.appendChild(o)}o.disabled=false;sel.value=id}
function pick(f,lab){if(!f)return null;f.classList.add('pdwPick');const l=f.querySelector('label');if(l)l.textContent=lab;return f}
function accNew(txt,fn){const b=document.createElement('button');b.type='button';b.className='pdwAccNew';b.textContent=txt;b.addEventListener('click',fn);return b}
function opts(sel){return new Set(sel?[...sel.options].map(o=>o.value).filter(Boolean):[])}

function wizard(cfg){
 const w=document.createElement('div');w.className='pdw';
 w.innerHTML=`<div class="pdwSeg"><button type="button" class="on" data-v="nuevo">${E(cfg.seg)}</button><button type="button" data-v="cuentas">${E(cfg.seg2||'Cuentas de acceso')}</button></div>
 <div class="pdwNew"><div class="pdwHead"><span class="pdwKick"></span><strong class="pdwTitle"></strong><div class="pdwBar">${cfg.steps.map(()=>'<i></i>').join('')}</div></div>
 <div class="pdwSteps"></div>
 <div class="pdwDone" hidden><span class="pdwOk">${OK}</span><h3></h3><p></p><div class="pdwBtns"><button type="button" class="pdwAgain">${E(cfg.again)}</button><button type="button" class="pdwClose">${E(cfg.closeLabel||'Cerrar')}</button></div></div>
 <div class="pdwFoot"><p class="pdwMsg" role="status" hidden></p><button type="button" class="pdwBack">Atrás</button><button type="button" class="pdwNext">Siguiente</button></div></div>
 <div class="pdwAcc" hidden></div><div class="pdwHold"></div>`;
 const q=c=>w.querySelector(c);if(cfg.noSeg)q('.pdwSeg').remove();
 const steps=cfg.steps.map(st=>{const d=document.createElement('div');d.className='pdwStep';d.hidden=true;st.nodes().filter(Boolean).forEach(n=>d.appendChild(n));q('.pdwSteps').appendChild(d);return Object.assign({el:d},st)});
 let i=0,busy=false;const st={};
 const msg=t=>{const m=q('.pdwMsg');m.textContent=t||'';m.hidden=!t};
 function paint(){
  const s=steps[i];steps.forEach((x,k)=>x.el.hidden=k!==i);
  q('.pdwDone').hidden=true;q('.pdwHead').hidden=false;q('.pdwFoot').hidden=false;
  q('.pdwKick').textContent='Paso '+(i+1)+' de '+steps.length;q('.pdwTitle').textContent=s.title;
  [...q('.pdwBar').children].forEach((b,k)=>b.classList.toggle('on',k<=i||!!st.existente));
  w.classList.toggle('existente',!!st.existente);if(st.existente)q('.pdwKick').textContent=cfg.yaKick||'Ya registrado';
  const back=s.back?s.back(st):(i?'Atrás':(cfg.onCancel?'Cancelar':''));
  q('.pdwBack').hidden=!back;q('.pdwBack').textContent=back||'Atrás';q('.pdwFoot').classList.toggle('solo',!back);
  q('.pdwNext').textContent=typeof s.next==='function'?s.next(st):(s.next||'Siguiente');
 }
 function done(){
  steps.forEach(x=>x.el.hidden=true);q('.pdwHead').hidden=true;q('.pdwFoot').hidden=true;msg('');
  const r=cfg.done(st);q('.pdwDone h3').textContent=r.t;q('.pdwDone p').innerHTML=r.p;q('.pdwDone').hidden=false;
  const b=$('pdmBody');if(b)b.scrollTop=0;
 }
 function go(k){i=k;msg('');paint();const b=$('pdmBody');if(b)b.scrollTop=0}
 q('.pdwNext').addEventListener('click',async()=>{
  if(busy)return;const s=steps[i];
  if(s.run){busy=true;const b=q('.pdwNext'),bk=q('.pdwBack'),t=b.textContent;b.disabled=bk.disabled=true;b.textContent=s.busy||'Guardando…';msg('');
   let r;try{r=await s.run(st)}catch(e){r={err:'No se pudo completar. '+(e&&e.message||'')}}
   busy=false;b.disabled=bk.disabled=false;b.textContent=t;
   if(r&&r.err){if(r.paso!=null&&r.paso!==i)go(r.paso);msg(r.err);return}
   if(r&&r.done){done();return}
  }else if(s.check){const e=s.check();if(e){msg(e);return}}
  if(i<steps.length-1)go(i+1);else done();
 });
 q('.pdwBack').addEventListener('click',()=>{if(busy)return;const s=steps[i];if(s.backDone){if(st.existente){w.querySelector('.pdwSeg > button[data-v="cuentas"]').click();return}done();return}if(i)go(i-1);else if(cfg.onCancel)cfg.onCancel(st)});
 q('.pdwAgain').addEventListener('click',()=>{const ya=st.existente;cfg.reset&&cfg.reset(st);for(const k in st)delete st[k];if(ya){w.acceso();return}go(0)});
 q('.pdwClose').addEventListener('click',()=>{if(cfg.onClose){cfg.onClose(st);return}if(typeof window.__pdmClose==='function')window.__pdmClose()});
 w.querySelectorAll('.pdwSeg > button').forEach(b=>b.addEventListener('click',()=>{
  w.querySelectorAll('.pdwSeg > button').forEach(x=>x.classList.toggle('on',x===b));
  const acc=b.dataset.v==='cuentas';q('.pdwNew').hidden=acc;q('.pdwAcc').hidden=!acc;
  if(acc&&cfg.loadAcc)cfg.loadAcc();
 }));
 w.open=()=>{w.querySelector('.pdwSeg > button[data-v="nuevo"]')?.click();if(!q('.pdwDone').hidden){for(const k in st)delete st[k];cfg.reset&&cfg.reset(st)}go(0)};
 w.acceso=()=>{w.querySelector('.pdwSeg > button[data-v="nuevo"]').click();for(const k in st)delete st[k];cfg.reset&&cfg.reset(st);st.existente=true;go(steps.length-1)};
 w.go=k=>{for(const x in st)delete st[x];go(k)};
 w.hold=n=>{if(n)q('.pdwHold').appendChild(n)};w.acc=q('.pdwAcc');w.st=st;
 return w;
}
function alAbrir(box,fn){
 const b=$('pdmBody');if(!b||!box)return;let dentro=false;
 new MutationObserver(()=>{const ya=box.parentNode===b;if(ya&&!dentro)fn();dentro=ya}).observe(b,{childList:true});
}

/* ---------------- NEGOCIO ---------------- */
(function(){
 const box=$('crearNegocioAdminBox'),acc=$('accesoNegocioAdminBox');if(!box||!acc||box.querySelector('.pdw'))return;
 const card0=box.querySelector(':scope > .card');const sec=k=>box.querySelector('.pdnSec[data-s="'+k+'"]');
 if(!card0||!sec('datos'))return;
 const load=()=>typeof window.__pidemasLoadToolData==='function'?window.__pidemasLoadToolData('acceso-negocio'):null;
 const editando=()=>!$('cancelRestaurant')?.classList.contains('hidden');
 const pass=$('accesoNegocioPassword');
 const W=wizard({yaKick:'Negocio ya registrado',seg:'Nuevo negocio',again:'Crear otro negocio',
  steps:[
   {title:'Datos del negocio',nodes:()=>[sec('datos')],check:()=>($('rNombre')?.value||'').trim()?'':'Escribe el nombre del negocio.'},
   {title:'Ubicación',nodes:()=>[sec('ubicacion')]},
   {title:'En la tienda',nodes:()=>[sec('tienda')]},
   {title:'Imágenes',nodes:()=>[sec('imagenes'),sec('preview')],next:()=>editando()?'Guardar cambios':'Guardar negocio',
    run:async st=>{
     const nombre=($('rNombre')?.value||'').trim();if(!nombre)return{err:'Escribe el nombre del negocio (paso 1).'};
     const ed=editando();const sel=$('accesoNegocioId');const antes=opts(sel);
     const m=$('restaurantMsg');hush(m);const cap=capturar('negocios');let t='';
     try{$('saveRestaurant').click();t=await esperar(m,null,60000)}finally{cap.fin()}
     if(!t)return{err:'No hubo respuesta al guardar. Revisa tu conexión e intenta otra vez.'};
     if(/no se pudo|escribe/i.test(t)||!/guardad/i.test(t))return{err:t};
     st.nombre=nombre;st.aviso=/columna|no se guard|SQL/i.test(t)?t:'';
     if(ed){st.editado=true;return{done:true}}
     try{await load()}catch(e){}
     if(cap.id()){ponerOpcion(sel,cap.id(),nombre);st.id=cap.id();return{}}
     let o=sel?[...sel.options].find(x=>x.value&&!antes.has(x.value)):null;
     if(!o&&sel)o=[...sel.options].reverse().find(x=>(x.dataset.base||x.textContent).trim().toLowerCase()===nombre.toLowerCase());
     if(!o){st.sinId=true;return{done:true}}
     sel.value=o.value;st.id=o.value;return{};
    }},
   {title:'Acceso al panel del negocio',nodes:()=>[card('Cuenta del dueño','Con este correo y contraseña el dueño entra a su panel de negocio. Entrégale la contraseña por un medio privado.',[pick(F('accesoNegocioId'),'Negocio'),F('accesoNegocioEmail'),F('accesoNegocioPassword'),pass&&pwLink(pass)])],
    next:'Crear acceso',back:st=>st.existente?'Cancelar':'Ahora no',backDone:true,busy:'Creando cuenta…',
    run:async st=>{
     const sel=$('accesoNegocioId');if(st.id&&sel&&!st.existente)sel.value=st.id;
     if(st.existente){const o=sel&&sel.selectedOptions[0];if(!o||!o.value)return{err:'Elige el negocio.'};st.id=o.value;st.nombre=(o.dataset.base||o.textContent).trim()}
     const mail=($('accesoNegocioEmail')?.value||'').trim().toLowerCase();
     if(!mail)return{err:'Escribe el correo de acceso.'};
     if((pass?.value||'').length<12)return{err:'La contraseña debe tener al menos 12 caracteres.'};
     const b=$('crearAccesoNegocioBtn'),m=$('accesoNegocioMsg');hush(m);b.click();
     const t=await esperar(m,b,60000);
     if(!/correctamente/i.test(t))return{err:t||'No hubo respuesta al crear la cuenta.'};
     st.mail=mail;return{done:true};
    }}
  ],
  done:st=>st.editado?{t:'Cambios guardados',p:'Los datos de <b>'+E(st.nombre)+'</b> se actualizaron.'+(st.aviso?' '+E(st.aviso):'')}
   :st.mail?{t:st.existente?'Acceso creado':'Negocio y acceso creados',p:'<b>'+E(st.nombre)+'</b> ya puede entrar a su panel con <b>'+E(st.mail)+'</b>. Entrega la contraseña al dueño por un medio privado.'}
   :st.sinId?{t:'Negocio creado',p:'<b>'+E(st.nombre)+'</b> se guardó, pero no se pudo preparar su acceso. Créalo luego desde la pestaña «Cuentas de acceso».'}
   :{t:'Negocio creado',p:'<b>'+E(st.nombre)+'</b> se guardó sin acceso al panel. Puedes crear su acceso cuando quieras.'},
  reset:()=>{const c=$('cancelRestaurant');if(c)c.click();['accesoNegocioEmail','accesoNegocioPassword'].forEach(id=>{const e=$(id);if(e){e.value='';e.dispatchEvent(new Event('input'))}});hush($('restaurantMsg'));hush($('accesoNegocioMsg'))},
  loadAcc:()=>{try{window.cargarAccesosNegocio&&window.cargarAccesosNegocio()}catch(e){}}
 });
 const head=document.createElement('div');head.className='pdwAccHead';head.innerHTML='<h4>Cuentas registradas</h4><button type="button" id="pdwRefNeg" aria-label="Actualizar">'+REF+'</button>';
 head.querySelector('button').addEventListener('click',()=>{try{load()}catch(e){}});
 W.acc.appendChild(accNew('+ Dar acceso a un negocio ya registrado',()=>W.acceso()));
 W.acc.appendChild(card('','',[head,$('pdaSearch'),$('accesosNegocioList'),$('cambiarPasswordNegocioBox')]));
 W.hold($('pdaCount'));W.hold(acc.querySelector('#pdaNew .pdaPwTools'));
 [$('crearAccesoNegocioBtn'),$('accesoNegocioMsg'),$('restaurantMsg'),$('saveRestaurant'),$('cancelRestaurant')].forEach(W.hold);
 card0.appendChild(W);acc.remove();
 alAbrir(box,()=>{W.open();try{load()}catch(e){}});
})();

/* ---------------- MOTORIZADO ---------------- */
(function(){
 const box=$('crearMotorizadoAdminBox'),acc=$('accesoMotorizadoAdminBox');if(!box||!acc||box.querySelector('.pdw'))return;
 const load=()=>typeof window.__pidemasLoadToolData==='function'?window.__pidemasLoadToolData('acceso-motorizado'):null;
 const pass=$('accesoMotorizadoPassword');
 const W=wizard({yaKick:'Motorizado ya registrado',seg:'Nuevo motorizado',again:'Crear otro motorizado',
  steps:[
   {title:'Datos del motorizado',nodes:()=>[card('','Nombre y número con los que lo verás en los pedidos.',[F('nuevoMotoNombre'),F('nuevoMotoTelefono'),F('nuevoMotoActivo')])],next:'Guardar motorizado',
    run:async st=>{
     const nombre=($('nuevoMotoNombre')?.value||'').trim();
     if(!nombre)return{err:'Escribe el nombre y los apellidos del motorizado.'};
     if(!($('nuevoMotoTelefono')?.value||'').trim())return{err:'Escribe el teléfono o WhatsApp del motorizado.'};
     const sel=$('accesoMotorizadoId');const antes=opts(sel);
     const b=$('guardarNuevoMotorizadoBtn'),m=$('nuevoMotoMsg');hush(m);const cap=capturar('motorizados');let t='';
     try{b.click();t=await esperar(m,b,60000)}finally{cap.fin()}
     if(!/correctamente/i.test(t))return{err:t||'No hubo respuesta al guardar.'};
     st.nombre=nombre;
     if(cap.id()){ponerOpcion(sel,cap.id(),nombre);st.id=cap.id();return{}}
     const o=sel?[...sel.options].find(x=>x.value&&!antes.has(x.value)):null;
     if(!o){st.sinId=true;return{done:true}}
     sel.value=o.value;st.id=o.value;return{};
    }},
   {title:'Acceso a la app del motorizado',nodes:()=>[card('Cuenta del motorizado','Con este correo y contraseña entra a su app de motorizado. Entrégale la contraseña por un medio privado.',[pick(F('accesoMotorizadoId'),'Motorizado'),F('accesoMotorizadoEmail'),F('accesoMotorizadoPassword'),pass&&pwLink(pass)])],
    next:'Crear acceso',back:st=>st.existente?'Cancelar':'Ahora no',backDone:true,busy:'Creando cuenta…',
    run:async st=>{
     const sel=$('accesoMotorizadoId');if(st.id&&sel&&!st.existente)sel.value=st.id;
     if(st.existente){const o=sel&&sel.selectedOptions[0];if(!o||!o.value)return{err:'Elige el motorizado.'};st.id=o.value;st.nombre=o.textContent.trim()}
     const mail=($('accesoMotorizadoEmail')?.value||'').trim().toLowerCase();
     if(!mail)return{err:'Escribe el correo de acceso.'};
     if((pass?.value||'').length<12)return{err:'La contraseña debe tener al menos 12 caracteres.'};
     const b=$('crearAccesoMotorizadoBtn'),m=$('accesoMotorizadoMsg');hush(m);b.click();
     const t=await esperar(m,b,60000);
     if(!/correctamente/i.test(t))return{err:t||'No hubo respuesta al crear la cuenta.'};
     st.mail=mail;return{done:true};
    }}
  ],
  done:st=>st.mail?{t:st.existente?'Acceso creado':'Motorizado y acceso creados',p:'<b>'+E(st.nombre)+'</b> ya puede entrar a su app con <b>'+E(st.mail)+'</b>. Entrégale la contraseña por un medio privado.'}
   :st.sinId?{t:'Motorizado creado',p:'<b>'+E(st.nombre)+'</b> se guardó, pero no se pudo preparar su acceso. Créalo luego desde la pestaña «Cuentas de acceso».'}
   :{t:'Motorizado creado',p:'<b>'+E(st.nombre)+'</b> se guardó sin acceso a la app. Puedes crear su acceso cuando quieras.'},
  reset:()=>{['accesoMotorizadoEmail','accesoMotorizadoPassword'].forEach(id=>{const e=$(id);if(e){e.value='';e.dispatchEvent(new Event('input'))}});hush($('nuevoMotoMsg'));hush($('accesoMotorizadoMsg'))},
  loadAcc:()=>{try{window.cargarAccesosMotorizado&&window.cargarAccesosMotorizado()}catch(e){}}
 });
 const lista=$('accesosMotorizadoList'),pw=$('cambiarPasswordMotorizadoBox');
 const head=document.createElement('div');head.className='pdwAccHead';head.innerHTML='<h4>Cuentas registradas</h4><button type="button" id="pdwRefMoto" aria-label="Actualizar">'+REF+'</button>';
 head.querySelector('button').addEventListener('click',()=>{try{load()}catch(e){}});
 W.acc.appendChild(accNew('+ Dar acceso a un motorizado ya registrado',()=>W.acceso()));
 const c=card('','',[head,lista,pw]);W.acc.appendChild(c);
 [$('crearAccesoMotorizadoBtn'),$('accesoMotorizadoMsg'),$('guardarNuevoMotorizadoBtn'),$('nuevoMotoMsg')].forEach(W.hold);
 box.appendChild(W);acc.remove();
 alAbrir(box,()=>{W.open();try{load()}catch(e){}});
})();

/* ---------------- CLIENTES ---------------- */
(function(){
 const tab=$('tab-clientes'),form=document.querySelector('#tab-clientes .pdcForm'),stats=document.querySelector('#tab-clientes .pdcStats');
 if(!tab||!form||!stats||tab.querySelector('.pdw'))return;
 const editando=()=>/editar/i.test($('clienteFormTitle')?.textContent||'');
 const limpiar=()=>{try{window.limpiarFormularioCliente&&window.limpiarFormularioCliente()}catch(e){}hush($('clienteMsg'));form.hidden=true};
 let W=null;const verLista=()=>{limpiar();W.querySelector('.pdwSeg > button[data-v="cuentas"]').click()};
 W=wizard({seg:'Nuevo cliente',seg2:'Tus clientes',again:'Registrar otro cliente',closeLabel:'Ver tus clientes',onClose:verLista,onCancel:verLista,
  steps:[
   {title:'Datos del cliente',nodes:()=>[card('','Nombre y número con los que lo encontrarás al crear un pedido.',[F('clienteNombre'),F('clienteTelefono'),F('clienteDocumento')])],
    back:()=>editando()?'Cancelar':'',
    check:()=>!($('clienteNombre')?.value||'').trim()?'Escribe el nombre del cliente.':!($('clienteTelefono')?.value||'').trim()?'Escribe el número del cliente.':''},
   {title:'Dirección y ubicación',nodes:()=>[card('','Dónde se le entrega. La ubicación sirve para calcular el delivery.',[F('clienteDireccion'),F('clienteUbicacion')])],
    next:()=>editando()?'Guardar cambios':'Guardar cliente',
    run:async st=>{
     if(!($('clienteDireccion')?.value||'').trim())return{err:'Escribe la dirección del cliente.'};
     st.nombre=($('clienteNombre').value||'').trim();st.editado=editando();
     const m=$('clienteMsg');hush(m);$('guardarCliente').click();
     const t=await esperar(m,null,45000);
     if(!/correctamente/i.test(t))return{err:t||'No hubo respuesta al guardar.'};
     return{done:true};
    }}
  ],
  done:st=>({t:st.editado?'Cambios guardados':'Cliente registrado',p:'<b>'+E(st.nombre)+'</b> '+(st.editado?'quedó actualizado.':'ya aparece en «Tus clientes».')}),
  reset:()=>limpiar(),
  loadAcc:()=>{try{window.loadClientes&&window.loadClientes()}catch(e){}}
 });
 W.acc.appendChild($('pdcBar'));W.acc.appendChild($('pdcListSlot'));
 [form.querySelector('.pdcFormHead'),form.querySelector(':scope > .actions'),$('clienteMsg'),$('pdcNew')].forEach(W.hold);
 stats.after(W);
 /* «Editar» de la lista abre el formulario original: aquí se muestra en los pasos */
 new MutationObserver(()=>{if(form.hidden)return;form.hidden=true;W.querySelector('.pdwSeg > button[data-v="nuevo"]').click();W.go(0)}).observe(form,{attributes:true,attributeFilter:['hidden']});
 form.hidden=true;
 alAbrir(tab,()=>{limpiar();W.open();W.go(0)});
})();

/* ---------------- CÓDIGOS DE DESCUENTO ---------------- */
(function(){
 const box=$('descuentosAdminBox'),root=$('dcRoot'),stats=$('dcStats'),sheet=$('dcSheet');
 if(!box||!root||!stats||!sheet||root.querySelector('.pdw'))return;
 const L=id=>$(id)?.closest('label');
 const editando=()=>/guardar cambios/i.test($('dcSave')?.textContent||'');
 let W=null,quieto=false;const nuevo=()=>{quieto=true;$('dcNew').click();setTimeout(()=>{quieto=false},0)};
 const verLista=()=>{nuevo();W.querySelector('.pdwSeg > button[data-v="cuentas"]').click()};
 const tipoLbl=$('dcTipo')?.closest('.d-lbl');
 W=wizard({seg:'Nuevo código',seg2:'Tus códigos',again:'Crear otro código',closeLabel:'Ver tus códigos',onClose:verLista,onCancel:verLista,
  steps:[
   {title:'Código y descuento',nodes:()=>[card('','El cliente lo escribe al pagar. Solo descuenta el delivery, nunca el precio de los productos.',[L('dcCode'),tipoLbl,L('dcVal')])],
    back:()=>editando()?'Cancelar':'',
    check:()=>{const c=($('dcCode').value||'').trim().toUpperCase(),v=Number($('dcVal').value);
     if(!/^[A-Z0-9_-]{3,20}$/.test(c))return 'El código debe tener de 3 a 20 letras o números, sin espacios.';
     if(!(v>0))return 'Escribe un descuento mayor que 0.';
     if($('dcTipo').querySelector('.on')?.dataset.v==='porcentaje'&&v>100)return 'El porcentaje no puede pasar de 100%.';return ''}},
   {title:'Condiciones de uso',nodes:()=>[card('','Déjalo en 0 si no quieres poner límite.',[L('dcMin'),L('dcMax')])]},
   {title:'Vigencia',nodes:()=>[card('','Desde cuándo y hasta cuándo se puede usar.',[L('dcIni'),L('dcFin'),$('dcQuick'),$('dcPrev')])],
    next:()=>editando()?'Guardar cambios':'Crear código',
    run:async st=>{
     st.codigo=($('dcCode').value||'').trim().toUpperCase();st.editado=editando();
     const m=$('dcMsg'),l=$('dcListMsg'),b=$('dcSave');m.textContent='';l.textContent='';b.click();
     const t0=Date.now();
     while(Date.now()-t0<45000){await sleep(200);const e=(m.textContent||'').trim();if(e&&!b.disabled)return{err:e};if(/creado|actualizado/i.test(l.textContent||''))break}
     document.documentElement.style.overflow='hidden';
     if(!/creado|actualizado/i.test(l.textContent||''))return{err:'No hubo respuesta al guardar.'};
     l.textContent='';return{done:true};
    }}
  ],
  done:st=>({t:st.editado?'Cambios guardados':'Código creado',p:'<b>'+E(st.codigo)+'</b> '+(st.editado?'quedó actualizado.':'ya se puede usar en la tienda.')}),
  reset:()=>nuevo(),
  loadAcc:()=>{try{window.loadDeliveryPromos&&window.loadDeliveryPromos()}catch(e){}}
 });
 [$('dcChips'),$('dcListMsg'),$('dcList')].forEach(n=>n&&W.acc.appendChild(n));
 [$('dcNew'),$('dcSave'),$('dcMsg')].forEach(W.hold);
 stats.after(W);
 /* la hoja original ya no se muestra: «Nuevo» y «Editar» se hacen en los pasos */
 new MutationObserver(()=>{if(sheet.hidden)return;sheet.hidden=true;document.documentElement.style.overflow='hidden';if(quieto)return;W.querySelector('.pdwSeg > button[data-v="nuevo"]').click();W.go(0)}).observe(sheet,{attributes:true,attributeFilter:['hidden']});
 alAbrir(box,()=>{nuevo();W.open();W.go(0)});
})();

/* ---------------- TARIFAS ---------------- */
(function(){
 const box=$('tarifasAdminBox');if(!box)return;
 let paso=0,vista='editar',hecho=false;
 const TIT=['Tarifa por distancia','Zonas con precio fijo','Recargos'];
 const o=window.__pidemasLoadToolData;
 window.__pidemasLoadToolData=async function(k){if(k==='tarifas'){paso=0;vista='editar';hecho=false;try{window.pdTarifasAbrir&&window.pdTarifasAbrir()}catch(e){}return}return typeof o==='function'?o.apply(this,arguments):undefined};
 function stats(m){const w=m.querySelector('.pdtfW');if(!w)return;const v=Number(String(m.querySelector('[data-k="base"]')?.value||'0').replace(',','.'))||0;
  w.querySelector('.pdtfBase').textContent='S/ '+v.toFixed(2);w.querySelector('.pdtfNz').textContent=m.querySelectorAll('#pdtfZonas .tf-z').length}
 function armar(){
  const m=$('pdtfModal');if(!m)return;const b=m.querySelector('.tf-b');if(!b||b.querySelector('.pdtfW'))return;
  const cards=[...b.querySelectorAll(':scope > .tf-c')];if(cards.length<4)return;
  const w=document.createElement('div');w.className='pdw pdtfW';
  w.innerHTML='<div class="pdtfStats"><div><span>Tarifa base</span><strong class="pdtfBase"></strong></div><div><span>Zonas</span><strong class="pdtfNz"></strong></div></div>'+
   '<div class="pdwSeg"><button type="button" data-v="editar">Editar tarifas</button><button type="button" data-v="probar">Probar tarifa</button></div>'+
   '<div class="pdwNew"><div class="pdwHead"><span class="pdwKick"></span><strong class="pdwTitle"></strong><div class="pdwBar"><i></i><i></i><i></i></div></div><div class="pdwSteps"></div>'+
   '<div class="pdwDone" hidden><span class="pdwOk">'+OK+'</span><h3>Tarifas guardadas</h3><p>La tienda ya cobra el delivery con estos valores.</p><div class="pdwBtns"><button type="button" class="pdwAgain">Probar tarifa</button><button type="button" class="pdwClose">Cerrar</button></div></div>'+
   '<div class="pdwFoot"><p class="pdwMsg" role="status" hidden></p><button type="button" class="pdwBack">Atrás</button><button type="button" class="pdwNext">Siguiente</button></div></div>'+
   '<div class="pdwAcc" hidden></div>';
  const q=c=>w.querySelector(c);
  cards.slice(0,3).forEach(c=>{const d=document.createElement('div');d.className='pdwStep';d.appendChild(c);q('.pdwSteps').appendChild(d)});
  q('.pdwAcc').appendChild(cards[3]);
  b.prepend(w);
  const msg=t=>{const e=q('.pdwMsg');e.textContent=t||'';e.hidden=!t};
  function paint(){
   w.querySelectorAll('.pdwSeg > button').forEach(x=>x.classList.toggle('on',x.dataset.v===vista));
   q('.pdwNew').hidden=vista!=='editar';q('.pdwAcc').hidden=vista!=='probar';
   const st=[...q('.pdwSteps').children];
   if(hecho){st.forEach(x=>x.hidden=true);q('.pdwHead').hidden=true;q('.pdwFoot').hidden=true;q('.pdwDone').hidden=false}
   else{q('.pdwDone').hidden=true;q('.pdwHead').hidden=false;q('.pdwFoot').hidden=false;st.forEach((x,k)=>x.hidden=k!==paso);
    q('.pdwKick').textContent='Paso '+(paso+1)+' de 3';q('.pdwTitle').textContent=TIT[paso];
    [...q('.pdwBar').children].forEach((x,k)=>x.classList.toggle('on',k<=paso));
    q('.pdwBack').hidden=!paso;q('.pdwFoot').classList.toggle('solo',!paso);q('.pdwNext').textContent=paso<2?'Siguiente':'Guardar tarifas'}
   stats(m);
  }
  const arriba=()=>{const p=$('pdmBody');if(p)p.scrollTop=0};
  w.querySelectorAll('.pdwSeg > button').forEach(x=>x.addEventListener('click',()=>{vista=x.dataset.v;paint();arriba()}));
  q('.pdwBack').addEventListener('click',()=>{if(paso){paso--;msg('');paint();arriba()}});
  q('.pdwNext').addEventListener('click',async()=>{
   if(paso<2){paso++;msg('');paint();arriba();return}
   const sv=m.querySelector('.tf-save'),pm=$('pdtfMsg'),nx=q('.pdwNext');if(!sv||nx.disabled)return;
   if(pm){pm.textContent='';pm.className=''}nx.disabled=true;nx.textContent='Guardando…';msg('');
   sv.click();const t0=Date.now();let t='';
   while(Date.now()-t0<45000){await sleep(200);const p2=$('pdtfMsg');t=(p2&&p2.textContent||'').trim();if(t&&!(m.querySelector('.tf-save')||{}).disabled)break}
   const ok=/guardad/i.test(t);
   const w2=m.querySelector('.pdtfW');if(!w2)return;
   if(ok){hecho=true}
   if(w2===w){nx.disabled=false;if(!ok)msg(t||'No hubo respuesta al guardar.');paint();arriba()}else armar();
  });
  q('.pdwAgain').addEventListener('click',()=>{hecho=false;paso=0;vista='probar';paint();arriba()});
  q('.pdwClose').addEventListener('click',()=>{if(typeof window.__pdmClose==='function')window.__pdmClose()});
  m.addEventListener('input',()=>stats(m));
  paint();
 }
 new MutationObserver(armar).observe(box,{childList:true,subtree:true});
 /* al cerrar la ventana, la hoja de tarifas queda cerrada */
 alAbrir(box,()=>{});
 const pb=$('pdmBody');if(pb)new MutationObserver(()=>{if(box.parentNode!==pb){document.body.classList.remove('pdtf-abierto');const m=$('pdtfModal');if(m)m.hidden=true}}).observe(pb,{childList:true});
})();
/* ---------------- RECOJO · COMPRA · ENCOMIENDA ---------------- */
function servicio(boxId,btnId,msgId,cfg){
 const box=$(boxId);if(!box||box.querySelector(':scope > .pdw'))return;
 const secs=[...box.querySelectorAll('.adminRecojoCards > section.adminRecojoCard')];if(!secs.length||!$(btnId))return;
 const busca=box.querySelector('.adminRecojoClientSearch');
 const tit=x=>{const h=x.querySelector(':scope > h3');return h?h.textContent.replace(/^\s*\d+\s*/,'').trim():''};
 const extra=cfg.extra?cfg.extra():[];const steps0=secs.map(x=>({title:tit(x)}));
 const req=sec=>{const f=[...sec.querySelectorAll('input[id]')].filter(i=>i.type!=='hidden'&&i.getClientRects().length);const nom=f.find(i=>/nombre|remitente|cliente$/i.test(i.id)&&!/buscar/i.test(i.id)),tel=f.find(i=>/tel/i.test(i.id));
  if(nom&&!nom.value.trim())return 'Escribe el nombre y apellido.';if(tel&&!tel.value.trim())return 'Escribe el número de teléfono.';return ''};
 const W=wizard({noSeg:true,again:cfg.again,
  steps:secs.map((sec,k)=>{
   const st={title:tit(sec),nodes:()=>[k===0&&busca?card('','',[busca]):null,sec].concat(extra.filter(e=>e.paso(sec)).map(e=>e.el))};
   if(k===0)st.check=()=>req(sec);
   if(k===secs.length-1)Object.assign(st,{next:cfg.enviar,busy:'Enviando…',run:async s=>{
    const b=$(btnId),m=$(msgId);const pasos=[...W.querySelectorAll('.pdwSteps > .pdwStep')];const antes=pasos.map(x=>x.hidden);
    if(m){m.textContent='';m.classList.add('hidden')}
    pasos.forEach(x=>x.hidden=false);b.click();const foc=document.activeElement;pasos.forEach((x,j)=>x.hidden=antes[j]);
    let t='';const t0=Date.now();
    while(Date.now()-t0<60000){await sleep(250);const mm=$(msgId);t=(mm&&mm.textContent||'').trim();if(t&&!b.disabled&&!/^enviando/i.test(t))break}
    if(t&&/correctamente|asignad|guardad/i.test(t)&&!/^no se pudo/i.test(t)){s.t=t.replace(/^✓\s*/,'');return{done:true}}
    let j=pasos.findIndex(x=>foc&&foc!==document.body&&x.contains(foc));
    if(j<0&&t){const T=steps0.map(x=>x.title.toLowerCase());const R=[[/paquete|agencia|destino|modalidad/i,/paquete/],[/env[ií]a|remitente/i,/quien env|cliente/],[/recibe|receptor/i,/quien recibe/],[/monto|costo|m[eé]todo de pago|cobrar/i,/pago/],[/comprobante|boleta|factura|ruc/i,/comprobante/],[/qu[eé] desea|lugar de compra/i,/de la compra/]];
     for(const [r,q] of R){if(r.test(t)){j=T.findIndex(x=>q.test(x));if(j>=0)break}}}
    return{err:t||'No hubo respuesta al enviar. Revisa tu conexión e intenta otra vez.',paso:j>=0?j:null};
   }});
   return st;
  }),
  done:s=>({t:cfg.ok,p:E(s.t)}),
  reset:()=>{const m=$(msgId);if(m){m.textContent='';m.classList.add('hidden')}}
 });
 box.prepend(W);box.classList.add('pdwServ');
 alAbrir(box,()=>W.open());
}
servicio('recojoAdminBox','admEnviarRecojoBtn','admRecojoMsg',{again:'Registrar otro recojo',enviar:'Enviar recojo y entrega',ok:'Recojo y entrega enviado',
 extra:()=>[{el:$('admRecojoYapeInfo'),paso:sec=>!!sec.querySelector('#admRecojoPago')}].filter(e=>e.el)});
servicio('compraAdminBox','admEnviarCompraBtn','admCompraMsg',{again:'Registrar otra compra',enviar:'Enviar compra',ok:'Compra enviada'});
servicio('encomiendaAdminBox','encEnviar','encMsg',{again:'Registrar otra encomienda',enviar:'Enviar encomienda',ok:'Encomienda enviada'});

/* ---------------- AGENCIAS ---------------- */
(function(){
 const tab=$('tab-agencias'),nueva=$('pdgNew'),lista=$('pdgList');if(!tab||!nueva||!lista||tab.querySelector('.pdw'))return;
 const ubic=n=>{try{return window.pdAgenciaUbicacion?window.pdAgenciaUbicacion(n):null}catch(e){return null}};
 const destF=$('agDestinosInputs')?.closest('.field');
 const estado=document.createElement('div');estado.className='pdwUb';
 const btnUb=document.createElement('button');btnUb.type='button';btnUb.className='pdwUbBtn';
 let W=null;
 const nom=()=>(W&&W.st.nombre)||($('agNombre')?.value||'').trim();
 const pintaUb=()=>{const u=nom()&&ubic(nom());estado.innerHTML=u?'<b>✓ Ubicación marcada</b><small>'+E(u.direccion||'Punto marcado en el mapa')+'</small>':'<b>Sin ubicación todavía</b><small>El motorizado la usará para llegar a la agencia.</small>';btnUb.textContent=u?'Cambiar ubicación':'Marcar en el mapa'};
 btnUb.addEventListener('click',async()=>{if(!nom()||typeof window.pdMarcarAgencia!=='function')return;try{await window.pdMarcarAgencia(nom(),W.st.id)}catch(e){}pintaUb()});
 W=wizard({seg:'Nueva agencia',seg2:'Tus agencias',again:'Registrar otra agencia',
  steps:[
   {title:'Nombre de la agencia',nodes:()=>[card('','Por ejemplo Olva Courier o Shalom.',[F('agNombre')])],
    check:()=>{const n=($('agNombre')?.value||'').trim();if(!n)return 'Escribe el nombre de la agencia.';try{if((adminAgencias||[]).some(a=>String(a.nombre||'').trim().toLowerCase()===n.toLowerCase()))return 'Esa agencia ya está registrada.'}catch(e){}return ''}},
   {title:'Destinos que atiende',nodes:()=>[card('','Escribe cada ciudad a la que envía. Presiona Enter para agregar otra.',[destF,$('pdgAddDestInput')])],
    next:'Guardar agencia',
    run:async st=>{
     const ds=[...document.querySelectorAll('#agDestinosInputs .ag-destino-input')].map(i=>i.value.trim()).filter(Boolean);
     if(!ds.length)return{err:'Agrega al menos un destino.'};
     st.nombre=($('agNombre').value||'').trim();st.n=ds.length;
     const m=$('agMsg'),b=$('agGuardar');hush(m);const cap=capturar('agencias');let t='';
     try{b.click();t=await esperar(m,b,45000)}finally{cap.fin()}
     if(!/correctamente/i.test(t))return{err:t||'No hubo respuesta al guardar.'};
     st.id=cap.id();pintaUb();return{};
    }},
   {title:'Ubicación en el mapa',nodes:()=>[card('','Opcional: marca la puerta de la agencia para que el motorizado llegue directo.',[estado,btnUb])],
    next:'Terminar',back:()=>'Ahora no',backDone:true}
  ],
  done:st=>{const u=ubic(st.nombre);return{t:'Agencia registrada',p:'<b>'+E(st.nombre)+'</b> se guardó con '+st.n+(st.n===1?' destino':' destinos')+'. '+(u?'Su ubicación ya está marcada.':'Puedes marcar su ubicación cuando quieras desde «Tus agencias».')}},
  reset:()=>{const n=$('agNombre');if(n){n.value='';n.dispatchEvent(new Event('input'))}hush($('agMsg'))},
  loadAcc:()=>{try{window.loadAdminAgencias&&window.loadAdminAgencias()}catch(e){}}
 });
 W.acc.appendChild(lista);
 [$('agGuardar'),$('agMsg'),nueva.querySelector('.pdgHint')].forEach(W.hold);
 const cols=nueva.parentElement;cols.before(W);cols.classList.add('pdwVacio');
 alAbrir(tab,()=>W.open());
})();
})();
}catch(e){console.error("[pidemas-pasos-js]",e)}

/* ===== pidemas-ventana-pedido-js ===== */
try{
/* Ventana del pedido: cabecera compacta igual en los tres paneles */
(function(){
var C={"root": "#orderList .adminOrderCard.is-expanded", "head": ".pdRouteBand > .pdAHd", "band": ".pdRouteBand", "code": ".x-code", "pill": ".x-pill", "meta": [".x-client"], "trk": "", "info": [".x-tags", ".x-prog"], "close": ".pdRouteBand > .pdCerrarX", "dele": ".pdRouteActions .pdRouteDelete"};
var TRASH='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>';
var ocupado=false;
function q(r,sel){return sel?r.querySelector(sel):null}
function armar(){
 if(ocupado)return;ocupado=true;
 try{
  var a=document.querySelector(C.root);
  document.documentElement.classList.toggle('pdpAbierto',!!a);
  if(!a)return;
  var H=a.querySelector(C.head);if(!H)return;
  var code=q(H,C.code);if(!code)return;
  var r1=H.querySelector(':scope > .pdpR1');
  var src=C.trkSrc?a.querySelector(C.trkSrc):null,mio=H.querySelector('.pdpTrk');
  if(C.trkSrc&&!src&&mio)mio.remove();
  var pl=q(H,C.pill),tk=q(H,C.trk);
  if(r1&&code.parentElement===r1&&(!q(H,'.x-kick')||q(H,'.x-kick').parentElement===r1)&&(!C.dele||!q(a,C.dele)||q(a,C.dele).parentElement===r1)&&(!pl||pl.parentElement.classList.contains('pdpR2'))&&(!tk||tk.parentElement.classList.contains('pdpR2'))&&!(src&&!mio))return;
  var r2=H.querySelector(':scope > .pdpR2'),r3=H.querySelector(':scope > .pdpR3');
  if(!r1){r1=document.createElement('div');r1.className='pdpR1'}
  if(!r2){r2=document.createElement('div');r2.className='pdpR2'}
  if(!r3){r3=document.createElement('div');r3.className='pdpR3'}
  var meta=H.querySelector(':scope > .pdpMeta');if(!meta){meta=document.createElement('div');meta.className='pdpMeta'}
  r1.appendChild(code);
  var kk=q(H,'.x-kick');if(kk)r1.appendChild(kk);
    var del=q(a,C.dele);
  if(del){if(!del.classList.contains('pdpDel')){del.classList.add('pdpDel');del.innerHTML=TRASH+'<span>Eliminar</span>';del.setAttribute('aria-label','Eliminar pedido')}r1.appendChild(del)}
  var pill=q(H,C.pill);if(pill)r2.appendChild(pill);
  C.meta.forEach(function(s){var e=q(H,s);if(e&&e.textContent.trim())meta.appendChild(e)});
  if(src&&!H.querySelector('.pdpTrk')){var nb=document.createElement('button');nb.type='button';nb.className='pdpTrk';nb.textContent='Ver seguimiento';
   nb.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();var t=a.querySelector(C.trkSrc);if(t)t.click()});r2.appendChild(nb)}
  var trk=q(H,C.trk);if(trk)r2.appendChild(trk);
  C.info.forEach(function(s){var e=q(H,s);if(e&&e.textContent.trim())r3.appendChild(e)});
  H.prepend(r1,r2,meta,r3);
 }finally{ocupado=false}
}
new MutationObserver(armar).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
armar();

/* WhatsApp al motorizado desde la tarjeta: el mismo aviso que se envía al asignar */
window.pdAvisarMotoWa=function(id){
 var o=null,m=null;
 try{o=(typeof allOrders!=='undefined'?allOrders:[]).find(function(x){return String(x.id)===String(id)})}catch(e){}
 if(!o)return;
 try{m=(typeof allMotos!=='undefined'?allMotos:[]).find(function(x){return String(x.id)===String(o.motorizado_id)})}catch(e){}
 if(!m){pdAviso('Este pedido todavía no tiene motorizado asignado.');return}
 var t=String(m.telefono||'').replace(/\D/g,'');if(t.length===9)t='51'+t;
 if(t.length<11){pdAviso('El motorizado '+(m.nombre_completo||'')+' no tiene un número de WhatsApp registrado.');return}
 var cod=String(o.id).slice(0,8).toUpperCase();
 var txt=['*PIDEMÁS DELIVERY*','¡Hola, '+String(m.nombre_completo||'motorizado').trim()+'!','Tienes un pedido asignado por Administración.','Pedido: #'+cod,'Por favor, ingresa al panel, revisa los detalles y confirma la asignación.','Entra aquí: https://pidemasdeliverypiura.infinityfreeapp.com/motorizado/','Gracias por trabajar con Pidemás.'].join('\n');
 var url='https://wa.me/'+t+'?text='+encodeURIComponent(txt);
 if(typeof window.pdOpenWhatsApp==='function')window.pdOpenWhatsApp(url);else window.open(url,'_blank','noopener');
};
})();
}catch(e){console.error("[pidemas-ventana-pedido-js]",e)}

/* ===== pidemas-admin-titulos-limpios-js ===== */
try{
(()=>{
const titleMap={

'🏢 Agencias y destinos':'Agencias',
'💰 Caja de motorizados':'Cajas'
};
const clean=()=>{
document.querySelectorAll('#appView h1,#appView h2,#appView h3').forEach(h=>{
const original=(h.textContent||'').trim();
if(titleMap[original]) h.textContent=titleMap[original];
});
const pageHeads=[...document.querySelectorAll('#appView > h1, #appView > h2, #appView > div > h1, #appView > div > h2, #appView > section > h1, #appView > section > h2')];
pageHeads.forEach(h=>{
let n=h.nextElementSibling;
if(n && n.tagName==='P' && !n.querySelector('input,button,select,a') && (n.textContent||'').trim().length>25) n.style.display='none';
});
};
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',clean); else clean();
const root=document.getElementById('appView');
if(root && window.MutationObserver){new MutationObserver(()=>clean()).observe(root,{subtree:true,childList:true});}
})();
}catch(e){console.error("[pidemas-admin-titulos-limpios-js]",e)}

/* ===== pidemas-pages-pro-js ===== */
try{
(function(){
if(window.__pdPagesPro)return;window.__pdPagesPro=true;
var TAB={'tab-pedidos':'Principal','tab-clientes':'Principal','tab-agencias':'Servicios','tab-caja':'Motorizados','tab-sueldo':'Motorizados'};
var TOOL={'Crear negocio':'Negocios','Estado de negocios':'Negocios','Servicio de recojo y entrega':'Servicios','Servicio de compra':'Servicios','Servicio de encomienda':'Servicios','Motorizados / GPS':'Motorizados','Crear motorizado':'Motorizados','Suspender / reactivar cuentas':'Motorizados','Códigos de descuento':'Marketing'};
var QI={'Pedidos':'receipt','Clientes':'users','Caja de motorizados':'wallet','Cajas':'wallet'};
function kick(h2,txt){
if(!h2||!h2.parentNode)return;
var k=h2.previousElementSibling;
if(!(k&&k.classList.contains('pdn-kicker'))){k=document.createElement('span');k.className='pdn-kicker';h2.parentNode.insertBefore(k,h2);}
k.textContent=txt;
}
function chips(){
var sel=document.getElementById('orderStatusFilter');if(!sel||sel.dataset.pdChips)return;
sel.dataset.pdChips='1';
var f=sel.closest('.field');if(f)f.classList.add('pdn-hide');
var box=document.createElement('div');box.className='pdn-chips';
Array.prototype.forEach.call(sel.options,function(o){
var b=document.createElement('button');b.type='button';b.className='pdn-chip'+(o.value===sel.value?' on':'');b.textContent=o.textContent;b.dataset.v=o.value;
b.onclick=function(){sel.value=o.value;sel.dispatchEvent(new Event('change',{bubbles:true}));sel.dispatchEvent(new Event('input',{bubbles:true}));box.querySelectorAll('.pdn-chip').forEach(function(x){x.classList.toggle('on',x===b);});};
box.appendChild(b);
});
var g=f&&f.parentNode;if(g)g.parentNode.insertBefore(box,g.nextSibling);
}
function sync(){
Object.keys(TAB).forEach(function(id){var s=document.getElementById(id);if(!s)return;var h=s.querySelector('h2');if(!h)return;h.textContent=h.textContent.replace(/^[^A-Za-zÁÉÍÓÚÑáéíóúñ¡¿0-9]+/,'');kick(h,TAB[id]);});
var dk=document.querySelector('#tab-restaurantes .pd-dashboard-kicker');if(dk)dk.textContent='Principal';
var t=document.getElementById('pidemasStandaloneToolsTitle');
if(t){var k=TOOL[t.textContent.trim()];if(k)kick(t,k);}
document.querySelectorAll('.pd-quick-grid>button').forEach(function(b){
var st=b.querySelector('strong'),ic=b.querySelector('.pd-quick-icon'),ar=b.querySelector(':scope>b');
if(ic&&st&&QI[st.textContent.trim()]&&!ic.querySelector('i'))ic.innerHTML='<i class="ti ti-'+QI[st.textContent.trim()]+'" aria-hidden="true"></i>';
if(ar&&!ar.querySelector('i'))ar.innerHTML='<i class="ti ti-chevron-right" aria-hidden="true"></i>';
});
chips();
}
function init(){
sync();setTimeout(sync,600);setTimeout(sync,1800);
setInterval(sync,400);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
}catch(e){console.error("[pidemas-pages-pro-js]",e)}

/* ===== pd-caja-realtime-admin ===== */
try{
(function(){
if(window.__pdCajaRT)return;window.__pdCajaRT=true;
var timer=null,tries=0;
function refresh(){clearTimeout(timer);timer=setTimeout(function(){
var tab=document.getElementById('tab-caja');
if(tab&&!tab.classList.contains('hidden')&&typeof window.loadAdminCash==='function'){try{window.loadAdminCash()}catch(e){}}
},700);}
function start(){
var d=window.db;
if(!d||typeof d.channel!=='function'){if(++tries<40)setTimeout(start,1500);return}
try{d.channel('admin-caja-movimientos').on('postgres_changes',{event:'*',schema:'public',table:'movimientos_caja'},refresh).subscribe();}catch(e){console.warn('Caja en tiempo real no disponible',e)}
}
start();
})();
}catch(e){console.error("[pd-caja-realtime-admin]",e)}

/* ===== pidemas-config-negocios-js ===== */
try{
/* Configurar negocios: el administrador maneja desde aquí lo mismo que cada negocio maneja en su panel
   (datos, ubicación, horarios, categorías y carta), eligiendo el negocio en un selector. */
(function(){
  const box=document.getElementById('configNegociosAdminBox');if(!box||window.__pdCnx)return;window.__pdCnx=true;
  const $=id=>document.getElementById(id);
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const CATS=['Restaurantes','Comida criolla','Pizzerías','Pollerías','Hamburgueserías','Comida rápida','Sangucherías','Paviferías','Cevicherías','Chifas','Sushi y comida japonesa','Parrillas y anticuchos','Heladerías','Cafeterías','Juguerías','Dulcerías y pastelerías','Panaderías','Bodegas y minimarkets','Fruterías y verdulerías','Carnicerías','Licorerías','Agua y gas','Farmacias y boticas','Ropa y moda','Calzado y zapatillas','Accesorios y bisutería','Tecnología','Celulares y accesorios','Belleza y cuidado personal','Hogar y decoración','Ferreterías','Deportes','Bebés y maternidad','Florerías y regalos','Mascotas','Librerías y útiles escolares','Jugueterías','Lavanderías'];
  const DIAS=[['lunes','Lunes'],['martes','Martes'],['miercoles','Miércoles'],['jueves','Jueves'],['viernes','Viernes'],['sabado','Sábado'],['domingo','Domingo']];
  const MARK='\n\n[[PIDEMAS_CARACTERISTICAS_V1: ';
  const splitDesc=raw=>{const s=String(raw||'');const at=s.lastIndexOf(MARK);if(at<0)return{description:s,features:[]};try{const tail=s.slice(at+MARK.length);if(!tail.endsWith(']]'))return{description:s,features:[]};const j=JSON.parse(tail.slice(0,-2));return{description:s.slice(0,at).trimEnd(),features:Array.isArray(j)?j.filter(x=>x&&String(x.name||'').trim()&&String(x.value||'').trim()).map(x=>({name:String(x.name),value:String(x.value)})):[]}}catch(e){return{description:s,features:[]}}};
  const composeDesc=(d,f)=>{const clean=String(d||'').trim();const ok=(f||[]).map(x=>({name:String(x.name||'').trim(),value:String(x.value||'').trim()})).filter(x=>x.name&&x.value);return clean+(ok.length?MARK+JSON.stringify(ok)+']]':'')||null};
  const has=(o,k)=>!!o&&Object.prototype.hasOwnProperty.call(o,k);
  const pick=(o,c)=>c.find(k=>has(o,k))||null;
  const TEL=['telefono','telefono_whatsapp','whatsapp','whatsapp_telefono','numero_whatsapp','numero_de_whatsapp','celular_whatsapp','telefono_contacto','telefono_negocio','telefono_restaurante','numero_telefono','numero','celular','phone'];
  const LOGO=['logo_url','logo','imagen_logo_url','imagen_logo'],PORT=['imagen_portada_url','portada_url','imagen_portada','portada'];
  const money=n=>'S/ '+(Number(n)||0).toFixed(2);
  const ext=f=>{const t=String(f&&f.type||'').toLowerCase();return t.includes('png')?'png':t.includes('webp')?'webp':'jpg'};

  let negs=[],cur=null,cats=[],prods=[],tab='datos',edit=null,map=null;

  function msg(t,bad){const m=$('cnxMsg');if(!m)return;clearTimeout(msg.t);m.textContent=t||'';m.className='cnxMsg'+(t?' on':'')+(bad?' bad':'');if(t&&!bad)msg.t=setTimeout(()=>{m.className='cnxMsg'},3500);if(t&&bad)try{m.scrollIntoView({block:'nearest',behavior:'smooth'})}catch(e){}}
  const F=(label,id,val,extra)=>'<div class="cnxF"><label for="'+id+'">'+label+'</label><input id="'+id+'" value="'+E(val??'')+'" '+(extra||'')+'></div>';
  const SW=(id,on,txt)=>'<label class="cnxCk"><input type="checkbox" id="'+id+'"'+(on?' checked':'')+'><span>'+txt+'</span></label>';

  /* ---------- carga ---------- */
  async function load(){
    const sel=$('cnxNegocio');if(!sel)return;
    const {data,error}=await db.from('negocios').select('*').order('nombre',{ascending:true});
    if(error){msg('No se pudieron cargar los negocios: '+error.message,true);return}
    negs=data||[];
    const keep=cur?String(cur.id):sel.value;
    sel.innerHTML='<option value="">Selecciona un negocio</option>'+negs.map(n=>'<option value="'+E(n.id)+'">'+E(n.nombre||'Sin nombre')+'</option>').join('');
    sel.value=keep&&negs.some(n=>String(n.id)===keep)?keep:'';
    await elegir(sel.value);
  }
  window.cnxLoad=load;
  async function elegir(id){
    cur=negs.find(n=>String(n.id)===String(id))||null;edit=null;
    $('cnxBody').classList.toggle('cnxOff',!cur);$('cnxEmpty').classList.toggle('cnxOff',!!cur);
    msg('');if(!cur)return;
    await pintar();
  }
  async function cargarCats(){
    const {data,error}=await db.from('categorias_negocio').select('*').eq('negocio_id',cur.id);
    if(error)throw new Error('No se pudieron cargar las categorías: '+error.message);
    cats=(data||[]).slice().sort((a,b)=>(Number(a.orden)||0)-(Number(b.orden)||0)||String(a.nombre||'').localeCompare(String(b.nombre||'')));
  }
  async function cargarProds(){
    const {data,error}=await db.from('productos_negocio').select('*').eq('negocio_id',cur.id).order('orden',{ascending:true});
    if(error)throw new Error('No se pudieron cargar los productos: '+error.message);
    prods=data||[];
  }
  async function pintar(){
    box.querySelectorAll('#cnxTabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===tab));
    const p=$('cnxPane');
    if(map){try{map.remove()}catch(e){}map=null}
    try{
      if(tab==='datos')pDatos(p);
      else if(tab==='ubicacion')pUbic(p);
      else if(tab==='horarios')pHor(p);
      else if(tab==='categorias'){p.innerHTML='<div class="cnxMuted">Cargando categorías…</div>';await cargarCats();pCats(p)}
      else if(tab==='carta'){p.innerHTML='<div class="cnxMuted">Cargando carta…</div>';await cargarCats();await cargarProds();edit?pProd(p):pCarta(p)}
    }catch(e){console.error('Configurar negocios:',e);p.innerHTML='<div class="cnxErr">'+E(e&&e.message||e)+'</div>'}
  }
  async function guardarNegocio(payload,ok){
    const {data,error}=await db.from('negocios').update(payload).eq('id',cur.id).select('*').maybeSingle();
    if(error)throw error;
    if(!data)throw new Error('Supabase no actualizó el negocio (revisa los permisos).');
    Object.assign(cur,data);
    const i=negs.findIndex(n=>String(n.id)===String(cur.id));if(i>=0)negs[i]=cur;
    const o=$('cnxNegocio').querySelector('option[value="'+String(cur.id).replace(/"/g,'')+'"]');if(o)o.textContent=cur.nombre||'Sin nombre';
    msg(ok||'Guardado correctamente.');
  }

  /* ---------- Datos ---------- */
  function pDatos(p){
    const r=cur,tel=pick(r,TEL),logo=pick(r,LOGO),port=pick(r,PORT);
    const cat=pick(r,['categoria_negocio','categoria_comercial','tipo_negocio','categoria']);
    const catVal=cat?String(r[cat]||''):'';const opts=(catVal&&!CATS.includes(catVal)?[catVal]:[]).concat(CATS);
    p.innerHTML='<div class="cnxCard">'
      +F('Nombre del negocio','cnxNombre',r.nombre)
      +(tel?F('Número de WhatsApp / teléfono','cnxTel',r[tel],'type="tel" inputmode="tel"'):'')
      +(has(r,'descripcion')?'<div class="cnxF"><label for="cnxDesc">Descripción</label><textarea id="cnxDesc" rows="3">'+E(r.descripcion||'')+'</textarea></div>':'')
      +(cat?'<div class="cnxF"><label for="cnxCat">Categoría del negocio</label><select id="cnxCat"><option value="">Selecciona una categoría</option>'+opts.map(c=>'<option'+(c===catVal?' selected':'')+'>'+E(c)+'</option>').join('')+'</select></div>':'')
      +(has(r,'ruc')?F('RUC','cnxRuc',r.ruc,'inputmode="numeric"'):'')
      +(has(r,'tiempo_estimado')?F('Tiempo estimado de entrega','cnxTiempo',r.tiempo_estimado,'placeholder="Ej. 25–40 min"'):'')
      +(has(r,'orden')?F('Orden en la tienda','cnxOrden',r.orden??0,'type="number" step="1"'):'')
      +(has(r,'activo')?SW('cnxActivo',r.activo!==false,'Negocio activo (se muestra en la tienda)'):'')
      +'</div>'
      +((logo||port)?'<div class="cnxCard"><div class="cnxH">Imágenes</div><div class="cnxImgs">'
        +(logo?'<div class="cnxImg"><span>Logo</span><div class="cnxThumb">'+(r[logo]?'<img src="'+E(r[logo])+'" alt="">':'Sin logo')+'</div><input type="file" id="cnxLogoF" accept="image/png,image/jpeg,image/webp"></div>':'')
        +(port?'<div class="cnxImg"><span>Portada</span><div class="cnxThumb wide">'+(r[port]?'<img src="'+E(r[port])+'" alt="">':'Sin portada')+'</div><input type="file" id="cnxPortF" accept="image/png,image/jpeg,image/webp"></div>':'')
        +'</div></div>':'')
      +'<button type="button" class="btn" data-a="datos-save">Guardar cambios</button>';
    p._cols={tel,cat,logo,port};
  }
  async function subirImgNegocio(file,kind){
    const path=cur.id+'/'+kind+'.'+ext(file);
    const {error}=await db.storage.from('restaurantes').upload(path,file,{upsert:true,contentType:file.type||'image/jpeg'});
    if(error)throw error;
    return db.storage.from('restaurantes').getPublicUrl(path).data.publicUrl+'?v='+Date.now();
  }
  async function saveDatos(){
    const p=$('cnxPane'),c=p._cols||{},g=id=>$(id);
    const nombre=g('cnxNombre').value.trim();if(!nombre){msg('El nombre es obligatorio.',true);return}
    const pl={nombre};
    if(c.tel)pl[c.tel]=g('cnxTel').value.trim()||null;
    if(g('cnxDesc'))pl.descripcion=g('cnxDesc').value.trim()||null;
    if(c.cat)pl[c.cat]=g('cnxCat').value||null;
    if(g('cnxRuc'))pl.ruc=g('cnxRuc').value.trim()||null;
    if(g('cnxTiempo'))pl.tiempo_estimado=g('cnxTiempo').value.trim()||null;
    if(g('cnxOrden'))pl.orden=Number(g('cnxOrden').value)||0;
    if(g('cnxActivo'))pl.activo=g('cnxActivo').checked;
    msg('Guardando…');
    try{
      const lf=g('cnxLogoF')&&g('cnxLogoF').files[0],pf=g('cnxPortF')&&g('cnxPortF').files[0];
      if(lf&&c.logo)pl[c.logo]=await subirImgNegocio(lf,'logo');
      if(pf&&c.port)pl[c.port]=await subirImgNegocio(pf,'portada');
      await guardarNegocio(pl,'Datos guardados.');pDatos(p);
    }catch(e){msg('No se pudo guardar: '+(e.message||e),true)}
  }

  /* ---------- Ubicación ---------- */
  function pUbic(p){
    const r=cur,dir=pick(r,['direccion','direccion_restaurante','ubicacion','direccion_comercial']),lat=pick(r,['latitud','latitude','lat']),lng=pick(r,['longitud','longitude','lng','lon']),gm=pick(r,['google_maps_url','google_maps','maps_url']);
    if(!dir&&!lat&&!lng&&!gm){p.innerHTML='<div class="cnxErr">La tabla negocios no tiene columnas de ubicación.</div>';return}
    p.innerHTML='<div class="cnxCard">'
      +(dir?F('Dirección del local','cnxDir',r[dir]):'')
      +(gm?F('Enlace de Google Maps','cnxGm',r[gm],'type="url" placeholder="https://maps.google.com/…"'):'')
      +((lat&&lng)?'<div class="cnxRow2">'+F('Latitud','cnxLat',r[lat],'inputmode="decimal"')+F('Longitud','cnxLng',r[lng],'inputmode="decimal"')+'</div><p class="cnxMuted">Toca el mapa o arrastra el marcador para fijar el punto exacto del local.</p><div id="cnxMap" class="cnxMap"></div><button type="button" class="btn alt" data-a="gmaps-open">Abrir en Google Maps</button>':'')
      +'</div><button type="button" class="btn" data-a="ubic-save">Guardar ubicación</button>';
    p._cols={dir,lat,lng,gm};
    if(lat&&lng)setTimeout(()=>mapa(p),60);
  }
  function mapa(p){
    const el=$('cnxMap');if(!el||!window.L)return;
    const la=Number($('cnxLat').value),ln=Number($('cnxLng').value);const ok=$('cnxLat').value!==''&&$('cnxLng').value!==''&&isFinite(la)&&isFinite(ln);
    const c=ok?[la,ln]:[-5.1945,-80.6328];
    try{
      map=L.map(el,{zoomControl:true}).setView(c,ok?17:13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
      let mk=ok?L.marker(c,{draggable:true}).addTo(map):null;
      const set=(a,b)=>{$('cnxLat').value=a.toFixed(7);$('cnxLng').value=b.toFixed(7)};
      const poner=ll=>{if(!mk){mk=L.marker(ll,{draggable:true}).addTo(map);mk.on('dragend',()=>{const q=mk.getLatLng();set(q.lat,q.lng)})}else mk.setLatLng(ll);set(ll.lat,ll.lng)};
      if(mk)mk.on('dragend',()=>{const q=mk.getLatLng();set(q.lat,q.lng)});
      map.on('click',e=>poner(e.latlng));
      const mover=()=>{const a=Number($('cnxLat').value),b=Number($('cnxLng').value);if($('cnxLat').value!==''&&$('cnxLng').value!==''&&isFinite(a)&&isFinite(b)){const ll=L.latLng(a,b);if(!mk){mk=L.marker(ll,{draggable:true}).addTo(map);mk.on('dragend',()=>{const q=mk.getLatLng();set(q.lat,q.lng)})}else mk.setLatLng(ll);map.setView(ll,Math.max(map.getZoom(),16))}};
      $('cnxLat').addEventListener('change',mover);$('cnxLng').addEventListener('change',mover);
      setTimeout(()=>{try{map&&map.invalidateSize()}catch(e){}},250);
    }catch(e){console.warn('Mapa:',e)}
  }
  async function saveUbic(){
    const p=$('cnxPane'),c=p._cols||{},pl={};
    if(c.dir)pl[c.dir]=$('cnxDir').value.trim()||null;
    if(c.gm)pl[c.gm]=$('cnxGm').value.trim()||null;
    if(c.lat&&c.lng){
      const a=$('cnxLat').value.trim(),b=$('cnxLng').value.trim();
      const la=a===''?null:Number(a),ln=b===''?null:Number(b);
      if((a!==''&&!isFinite(la))||(b!==''&&!isFinite(ln))){msg('La latitud o longitud no es válida.',true);return}
      pl[c.lat]=la;pl[c.lng]=ln;
    }
    msg('Guardando…');
    try{await guardarNegocio(pl,'Ubicación guardada.')}catch(e){msg('No se pudo guardar: '+(e.message||e),true)}
  }

  /* ---------- Horarios ---------- */
  const h24=v=>{const m=String(v||'').match(/^(\d{1,2}):(\d{2})/);return m?String(m[1]).padStart(2,'0')+':'+m[2]:''};
  function leerHorario(txt){
    const out={};String(txt||'').split('|').forEach(x=>{const m=x.trim().match(/^([a-z]+)=([^-]*)-(.*)$/i);if(m)out[m[1].toLowerCase()]={abre:h24(m[2]),cierra:h24(m[3])}});return out;
  }
  function pHor(p){
    if(!has(cur,'horario')){p.innerHTML='<div class="cnxErr">La tabla negocios no tiene la columna horario.</div>';return}
    const H=leerHorario(cur.horario);
    p.innerHTML='<div class="cnxCard"><div class="cnxH">Horario de atención</div><p class="cnxMuted">Marca los días que atiende y la hora de apertura y cierre. En la tienda el horario se recorta al horario general de Pidemás.</p>'
      +DIAS.map(([k,n])=>{const d=H[k];return '<div class="cnxDia" data-d="'+k+'"><label class="cnxCk"><input type="checkbox" class="ha-on"'+(d?' checked':'')+'><span>'+n+'</span></label><div class="cnxHoras"><input type="time" class="ha" value="'+E(d?d.abre:'09:00')+'"><i>a</i><input type="time" class="hc" value="'+E(d?d.cierra:'21:30')+'"></div></div>'}).join('')
      +'</div><button type="button" class="btn" data-a="hor-save">Guardar horario</button>';
  }
  async function saveHor(){
    const parts=[];
    for(const r of document.querySelectorAll('#cnxPane .cnxDia')){
      if(!r.querySelector('.ha-on').checked)continue;
      const a=r.querySelector('.ha').value,c=r.querySelector('.hc').value;
      if(!a||!c){msg(r.querySelector('span').textContent+': completa la hora de apertura y cierre.',true);return}
      parts.push(r.dataset.d+'='+a+'-'+c);
    }
    msg('Guardando horario…');
    try{await guardarNegocio({horario:parts.join('|')||null},'Horario guardado. La tienda ya lo usa.')}catch(e){msg('No se pudo guardar el horario: '+(e.message||e),true)}
  }

  /* ---------- Categorías ---------- */
  function pCats(p){
    p.innerHTML='<div class="cnxCard"><div class="cnxH">Nueva categoría</div>'+F('Nombre','cnxCatN','','placeholder="Ej. Bebidas"')+F('Descripción (opcional)','cnxCatD','')+'<button type="button" class="btn" data-a="cat-add">Agregar categoría</button></div>'
      +'<div class="cnxCard"><div class="cnxH">Categorías de la carta ('+cats.length+')</div>'
      +(cats.length?cats.map(c=>'<div class="cnxItem" data-id="'+E(c.id)+'"><div class="cnxItemTop"><input class="cn" value="'+E(c.nombre||'')+'" aria-label="Nombre"><input class="cd" value="'+E(c.descripcion||'')+'" placeholder="Descripción" aria-label="Descripción"></div><div class="cnxActs"><span class="cnxTag'+(c.activo===false?' off':'')+'">'+(c.activo===false?'Oculta':'Visible')+'</span><button type="button" class="btn alt" data-a="cat-save">Guardar</button><button type="button" class="btn alt" data-a="cat-tog">'+(c.activo===false?'Mostrar':'Ocultar')+'</button><button type="button" class="btn alt cnxDel" data-a="cat-del">Eliminar</button></div></div>').join(''):'<div class="cnxMuted">Este negocio aún no tiene categorías.</div>')
      +'</div>';
  }
  async function catAction(a,id){
    const row=document.querySelector('#cnxPane .cnxItem[data-id="'+String(id).replace(/"/g,'')+'"]');const c=cats.find(x=>String(x.id)===String(id));
    try{
      if(a==='cat-add'){
        const n=$('cnxCatN').value.trim();if(!n){msg('Escribe el nombre de la categoría.',true);return}
        const {error}=await db.from('categorias_negocio').insert({negocio_id:cur.id,nombre:n,descripcion:$('cnxCatD').value.trim()||null});if(error)throw error;
        msg('Categoría agregada.');
      }else if(a==='cat-save'&&c){
        const n=row.querySelector('.cn').value.trim();if(!n){msg('El nombre no puede quedar vacío.',true);return}
        const {error}=await db.from('categorias_negocio').update({nombre:n,descripcion:row.querySelector('.cd').value.trim()||null}).eq('id',c.id).eq('negocio_id',cur.id);if(error)throw error;
        msg('Categoría guardada.');
      }else if(a==='cat-tog'&&c){
        const {error}=await db.from('categorias_negocio').update({activo:c.activo===false}).eq('id',c.id).eq('negocio_id',cur.id);if(error)throw error;
        msg(c.activo===false?'Categoría visible en la tienda.':'Categoría oculta en la tienda.');
      }else if(a==='cat-del'&&c){
        if(!(await pdConfirmar('¿Eliminar la categoría «'+(c.nombre||'')+'»? Sus productos quedarán sin categoría.')))return;
        const u=await db.from('productos_negocio').update({categoria_id:null}).eq('categoria_id',c.id).eq('negocio_id',cur.id);if(u.error)throw u.error;
        const {error}=await db.from('categorias_negocio').delete().eq('id',c.id).eq('negocio_id',cur.id);if(error)throw error;
        msg('Categoría eliminada.');
      }else return;
      await pintar();
    }catch(e){msg('No se pudo completar: '+(e.message||e),true)}
  }

  /* ---------- Carta ---------- */
  const stockKey=()=>pick(prods[0]||{},['stock','stock_actual','cantidad_stock','existencias','cantidad_disponible'])||'stock';
  function pCarta(p){
    const sk=stockKey();
    const grupos=cats.map(c=>({c,items:prods.filter(x=>String(x.categoria_id||'')===String(c.id))}));
    const sin=prods.filter(x=>!x.categoria_id||!cats.some(c=>String(c.id)===String(x.categoria_id)));
    if(sin.length)grupos.push({c:{nombre:'Sin categoría'},items:sin});
    const card=x=>{const st=Number(x[sk]);const vis=x.disponible!==false;const sd=splitDesc(x.descripcion).description;
      return '<div class="cnxProd'+(vis?'':' off')+'" data-id="'+E(x.id)+'"><div class="cnxPImg">'+(x.imagen_url?'<img src="'+E(x.imagen_url)+'" alt="" loading="lazy">':'<span>Sin foto</span>')+'</div><div class="cnxPTx"><b>'+E(x.nombre||'')+'</b><small>'+E(sd).slice(0,70)+'</small><div class="cnxPMeta"><strong>'+money(x.precio)+'</strong><span>Stock: '+(isFinite(st)?st:'—')+'</span><span class="cnxTag'+(vis?'':' off')+'">'+(vis?'Visible':'Oculto')+'</span></div><div class="cnxActs"><button type="button" class="btn alt" data-a="p-edit">Editar</button><button type="button" class="btn alt" data-a="p-vis">'+(vis?'Ocultar':'Mostrar')+'</button><button type="button" class="btn alt cnxDel" data-a="p-del">Eliminar</button></div></div></div>'};
    p.innerHTML='<button type="button" class="btn" data-a="p-new">+ Agregar producto</button><p class="cnxMuted" style="margin:10px 2px 0">'+prods.length+' producto'+(prods.length===1?'':'s')+' en la carta.</p>'
      +(grupos.filter(g=>g.items.length).map(g=>'<div class="cnxCard"><div class="cnxH">'+E(g.c.nombre||'')+' · '+g.items.length+'</div>'+g.items.map(card).join('')+'</div>').join('')||'<div class="cnxCard cnxMuted">Este negocio aún no tiene productos.</div>');
  }
  function pProd(p){
    const x=edit.prod||{},sp=splitDesc(x.descripcion),sk=stockKey();
    p.innerHTML='<button type="button" class="btn alt cnxBack" data-a="p-back">← Volver a la carta</button><div class="cnxCard"><div class="cnxH">'+(x.id?'Editar producto':'Nuevo producto')+'</div>'
      +'<div class="cnxF"><label for="cnxPCat">Categoría</label><select id="cnxPCat"><option value="">Sin categoría</option>'+cats.map(c=>'<option value="'+E(c.id)+'"'+(String(x.categoria_id||'')===String(c.id)?' selected':'')+'>'+E(c.nombre||'')+'</option>').join('')+'</select></div>'
      +F('Nombre del producto','cnxPNom',x.nombre)
      +'<div class="cnxF"><label for="cnxPDesc">Descripción detallada</label><textarea id="cnxPDesc" rows="4" maxlength="2000">'+E(sp.description)+'</textarea></div>'
      +'<div class="cnxF"><label>Características (opcional)</label><div id="cnxFeat">'+sp.features.map(f=>featRow(f.name,f.value)).join('')+'</div><button type="button" class="btn alt" data-a="feat-add">+ Agregar característica</button></div>'
      +'<div class="cnxRow2">'+F('Precio (S/)','cnxPPre',x.precio??'','type="number" step="0.01" min="0" inputmode="decimal"')+F('Stock','cnxPStk',x[sk]??'','type="number" step="1" min="0" inputmode="numeric"')+'</div>'
      +F('URL de imagen','cnxPImg',x.imagen_url||'','type="url"')
      +'<div class="cnxF"><label for="cnxPFile">Subir imagen</label><input type="file" id="cnxPFile" accept="image/png,image/jpeg,image/webp"></div>'
      +SW('cnxPAct',x.id?x.disponible!==false:true,'Visible en la tienda (necesita stock mayor a 0)')
      +'</div><button type="button" class="btn" data-a="p-save">Guardar producto</button>';
  }
  const featRow=(n,v)=>'<div class="cnxFeat"><input class="fn" placeholder="Característica (ej. Talla)" value="'+E(n||'')+'"><input class="fv" placeholder="Valor (ej. M)" value="'+E(v||'')+'"><button type="button" class="cnxX" data-a="feat-del" aria-label="Quitar">×</button></div>';
  async function subirImgProd(id,file){
    const path='productos/'+id+'.'+ext(file);
    const b=db.storage.from('negocios');
    const {error}=await b.upload(path,file,{upsert:true,contentType:file.type||'image/jpeg'});
    if(error)throw error;
    return b.getPublicUrl(path).data.publicUrl+'?v='+Date.now();
  }
  const pathDeUrl=u=>{const m='/storage/v1/object/public/negocios/',s=String(u||''),i=s.indexOf(m);if(i<0)return null;try{return decodeURIComponent(s.slice(i+m.length).split('?')[0])}catch(e){return s.slice(i+m.length).split('?')[0]}};
  async function quitarImgStorage(u){const pth=pathDeUrl(u);if(!pth)return;try{await db.storage.from('negocios').remove([pth])}catch(e){}}
  async function saveProd(){
    const sk=stockKey(),x=edit.prod||{};
    const nombre=$('cnxPNom').value.trim(),precio=Number($('cnxPPre').value),st=Math.max(0,Math.floor(Number($('cnxPStk').value||0)));
    if(!nombre||$('cnxPPre').value===''||!isFinite(precio)){msg('Completa el nombre y el precio.',true);return}
    const feats=[...document.querySelectorAll('#cnxFeat .cnxFeat')].map(r=>({name:r.querySelector('.fn').value,value:r.querySelector('.fv').value}));
    const pl={categoria_id:$('cnxPCat').value||null,nombre,descripcion:composeDesc($('cnxPDesc').value,feats),precio,imagen_url:$('cnxPImg').value.trim()||null,disponible:st>0&&$('cnxPAct').checked};
    pl[sk]=st;
    const file=$('cnxPFile').files[0]||null;
    msg('Guardando…');
    try{
      let id=x.id;
      if(id){const r=await db.from('productos_negocio').update(pl).eq('id',id).eq('negocio_id',cur.id);if(r.error)throw r.error}
      else{const r=await db.from('productos_negocio').insert({negocio_id:cur.id,...pl}).select('*').single();if(r.error)throw r.error;id=r.data.id}
      let aviso='';
      if(file){
        try{const url=await subirImgProd(id,file);const u=await db.from('productos_negocio').update({imagen_url:url}).eq('id',id).eq('negocio_id',cur.id);if(u.error)throw u.error}
        catch(e){aviso=' (la imagen no se pudo subir: '+(e.message||e)+')'}
      }
      edit=null;await pintar();msg('Producto guardado.'+aviso,!!aviso);
    }catch(e){msg('No se pudo guardar el producto: '+(e.message||e),true)}
  }
  async function prodAction(a,id){
    const x=prods.find(q=>String(q.id)===String(id));
    try{
      if(a==='p-edit'&&x){edit={prod:x};await pintar();$('cnxPane').scrollIntoView({behavior:'smooth',block:'start'});return}
      if(a==='p-vis'&&x){
        const sk=stockKey(),vis=x.disponible!==false;
        if(!vis&&Number(x[sk]||0)<=0){msg('Para mostrar este producto primero agrégale stock mayor a 0 (Editar).',true);return}
        const {error}=await db.from('productos_negocio').update({disponible:!vis}).eq('id',x.id).eq('negocio_id',cur.id);if(error)throw error;
        msg(vis?'Producto oculto en la tienda.':'Producto visible en la tienda.');
      }else if(a==='p-del'&&x){
        if(!(await pdConfirmar('¿Eliminar «'+(x.nombre||'')+'» de la carta?')))return;
        const {error}=await db.from('productos_negocio').delete().eq('id',x.id).eq('negocio_id',cur.id);if(error)throw error;
        await quitarImgStorage(x.imagen_url);msg('Producto eliminado.');
      }else return;
      await pintar();
    }catch(e){msg('No se pudo completar: '+(e.message||e),true)}
  }

  /* ---------- eventos ---------- */
  $('cnxNegocio').addEventListener('change',e=>{tab='datos';elegir(e.target.value)});
  $('cnxTabs').addEventListener('click',e=>{const b=e.target.closest('button[data-t]');if(!b||!cur)return;tab=b.dataset.t;edit=null;msg('');pintar()});
  $('cnxPane').addEventListener('click',e=>{
    const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,id=(b.closest('[data-id]')||{dataset:{}}).dataset.id;
    if(a==='datos-save')return saveDatos();
    if(a==='ubic-save')return saveUbic();
    if(a==='gmaps-open'){const la=$('cnxLat').value.trim(),ln=$('cnxLng').value.trim(),u=($('cnxGm')&&$('cnxGm').value.trim())||(la&&ln?'https://www.google.com/maps?q='+encodeURIComponent(la+','+ln):'');if(u)window.open(u,'_blank','noopener');else msg('Aún no hay ubicación para abrir.',true);return}
    if(a==='hor-save')return saveHor();
    if(a.startsWith('cat-'))return catAction(a,id);
    if(a==='p-new'){edit={prod:null};return pintar()}
    if(a==='p-back'){edit=null;return pintar()}
    if(a==='p-save')return saveProd();
    if(a==='feat-add'){$('cnxFeat').insertAdjacentHTML('beforeend',featRow('',''));return}
    if(a==='feat-del'){b.closest('.cnxFeat').remove();return}
    if(a.startsWith('p-'))return prodAction(a,id);
  });
})();
}catch(e){console.error("[pidemas-config-negocios-js]",e)}

/* ===== pidemas-solicitudes-afiliacion-js ===== */
try{
/* Solicitudes de afiliación: lo que los negocios llenan en el formulario público llega aquí. */
(function(){
  const box=document.getElementById('solicitudesAdminBox');if(!box||window.__pdSol)return;window.__pdSol=true;
  const $=id=>document.getElementById(id);
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const EST={nueva:'Nueva',revision:'En revisión',aprobada:'Aprobada',rechazada:'Rechazada'};
  let filas=[],filtro='nueva',abiertas=new Set();
  const msg=(t,ok)=>{const m=$('solMsg');if(!m)return;m.textContent=t||'';m.classList.toggle('hidden',!t);if(t)setTimeout(()=>m.classList.add('hidden'),3500)};
  const fecha=d=>{try{return new Date(d).toLocaleString('es-PE',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}catch(e){return''}};
  const wa=n=>{let d=String(n||'').replace(/\D/g,'');if(d.length===9)d='51'+d;return d?'https://wa.me/'+d:''};
  const par=(k,v)=>v===null||v===undefined||v===''?'':'<div class="solPar"><span>'+E(k)+'</span><b>'+E(v)+'</b></div>';
  function detalle(r){
    return '<div class="solDet">'
    +'<h5>Negocio</h5>'+par('Razón social',r.razon_social)+par('RUC',r.ruc)+par('Tipo',r.categoria)+par('Dirección',r.direccion)+par('Distrito',r.distrito)+par('Ciudad',r.ciudad)+par('Referencia',r.referencia)+par('Redes / web',r.redes)
    +'<h5>Representante</h5>'+par('Nombre',r.rep_nombre)+par('DNI',r.rep_dni)+par('Cargo',r.rep_cargo)+par('Celular',r.rep_celular)+par('Correo',r.rep_correo)
    +'<h5>Productos y stock</h5>'+par('Productos',r.productos)+par('Cantidad en carta',r.num_productos)+par('Stock aproximado',r.stock_aprox)+par('Controla inventario',r.maneja_stock)+par('Fotos / catálogo',r.tiene_fotos)
    +'<h5>Atención</h5>'+par('Horario',r.horario)+par('Pedidos por día',r.pedidos_dia)+par('Preparación',r.tiempo_prep?r.tiempo_prep+' min':'')+par('Repartidores propios',r.delivery_propio)+par('Pagos',(r.pagos||[]).join(', '))+par('Comentarios',r.comentarios)
    +'<h5>Notas del administrador</h5><textarea class="solNota" data-id="'+E(r.id)+'" placeholder="Notas internas (solo las ves tú)">'+E(r.notas_admin||'')+'</textarea>'
    +'<button type="button" class="btn alt solSaveNota" data-id="'+E(r.id)+'">Guardar nota</button>'
    +'</div>';
  }
  function tarjeta(r){
    const open=abiertas.has(r.id),link=wa(r.rep_celular);
    return '<article class="solCard" data-id="'+E(r.id)+'">'
    +'<div class="solTop"><div class="solName"><strong>'+E(r.nombre_negocio)+'</strong><span>'+E([r.categoria,r.distrito].filter(Boolean).join(' · '))+'</span></div><span class="solBadge s-'+E(r.estado)+'">'+E(EST[r.estado]||r.estado)+'</span></div>'
    +'<div class="solMeta">'+E(r.rep_nombre||'')+(r.rep_celular?' · '+E(r.rep_celular):'')+' · '+E(fecha(r.created_at))+'</div>'
    +'<button type="button" class="solVer" data-a="ver">'+(open?'Ocultar detalle':'Ver detalle')+'</button>'
    +(open?detalle(r):'')
    +'<div class="solAct">'
    +(link?'<a class="btn alt" target="_blank" rel="noopener" href="'+E(link)+'">WhatsApp</a>':'')
    +(r.estado!=='revision'?'<button type="button" class="btn alt" data-a="est" data-e="revision">En revisión</button>':'')
    +(r.estado!=='aprobada'?'<button type="button" class="btn" data-a="est" data-e="aprobada">Aprobar</button>':'')
    +(r.estado!=='rechazada'?'<button type="button" class="btn alt" data-a="est" data-e="rechazada">Rechazar</button>':'')
    +'<button type="button" class="btn alt" data-a="crear">Crear negocio con estos datos</button>'
    +'<button type="button" class="btn alt solDel" data-a="del">Eliminar</button>'
    +'</div></article>';
  }
  function pintar(){
    const c={nueva:0,revision:0,aprobada:0,rechazada:0,todas:filas.length};
    filas.forEach(r=>{if(c[r.estado]!==undefined)c[r.estado]++});
    Object.keys(c).forEach(k=>{const e=$('solCnt-'+k);if(e)e.textContent=c[k]});
    document.querySelectorAll('#solFiltros button').forEach(b=>b.classList.toggle('on',b.dataset.f===filtro));
    const v=filas.filter(r=>filtro==='todas'||r.estado===filtro);
    $('solLista').innerHTML=v.length?v.map(tarjeta).join(''):'<div class="muted solVacio">No hay solicitudes en esta lista.</div>';
  }
  window.solLoad=async function(){
    const l=$('solLista');
    try{
      const {data,error}=await db.from('solicitudes_afiliacion').select('*').order('created_at',{ascending:false}).limit(500);
      if(error)throw error;
      filas=data||[];pintar();
    }catch(e){
      console.error(e);
      l.innerHTML='<div class="notice">No se pudieron cargar las solicitudes. Revisa que ya ejecutaste el archivo SQL en Supabase.</div>';
    }
  };
  async function cambiar(id,cambios,ok){
    const {error}=await db.from('solicitudes_afiliacion').update(cambios).eq('id',id);
    if(error){console.error(error);msg('No se pudo guardar el cambio.');return false}
    const r=filas.find(x=>x.id===id);if(r)Object.assign(r,cambios);
    pintar();if(ok)msg(ok);return true;
  }
  async function crearNegocio(r){
    try{
      if(window.__pdmOpen)await window.__pdmOpen('crear-negocio');
      const set=(i,v)=>{const e=$(i);if(e&&v){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))}};
      set('rNombre',r.nombre_negocio);set('rTelefono',r.rep_celular);set('rDireccion',[r.direccion,r.distrito].filter(Boolean).join(', '));
      set('rDescripcion',r.productos);set('rTiempo',r.tiempo_prep?r.tiempo_prep+' min':'');
    }catch(e){console.warn(e)}
  }
  box.addEventListener('click',async e=>{
    const f=e.target.closest('#solFiltros button');
    if(f){filtro=f.dataset.f;pintar();return}
    if(e.target.closest('#solRefresh')){window.solLoad();return}
    const sn=e.target.closest('.solSaveNota');
    if(sn){const t=box.querySelector('.solNota[data-id="'+sn.dataset.id+'"]');await cambiar(sn.dataset.id,{notas_admin:t.value.trim()||null},'Nota guardada');return}
    const b=e.target.closest('[data-a]');if(!b)return;
    const card=b.closest('.solCard');if(!card)return;
    const id=card.dataset.id,r=filas.find(x=>x.id===id);if(!r)return;
    const a=b.dataset.a;
    if(a==='ver'){abiertas.has(id)?abiertas.delete(id):abiertas.add(id);pintar();return}
    if(a==='est'){await cambiar(id,{estado:b.dataset.e},'Solicitud marcada como '+EST[b.dataset.e].toLowerCase());return}
    if(a==='crear'){crearNegocio(r);return}
    if(a==='del'){
      if(!(await pdConfirmar('¿Eliminar esta solicitud? No se puede deshacer.')))return;
      const {error}=await db.from('solicitudes_afiliacion').delete().eq('id',id);
      if(error){console.error(error);msg('No se pudo eliminar.');return}
      filas=filas.filter(x=>x.id!==id);abiertas.delete(id);pintar();msg('Solicitud eliminada');
    }
  });
})();
}catch(e){console.error("[pidemas-solicitudes-afiliacion-js]",e)}


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
    c.onclick=()=>{fuera();if(d.pedidoId){try{window.openAdminTab&&window.openAdminTab('pedidos')}catch(_){}setTimeout(()=>{const k=document.querySelector('.adminOrderCard[data-order-id="'+CSS.escape(String(d.pedidoId))+'"]');if(k){k.classList.add('is-expanded');k.scrollIntoView({behavior:'smooth',block:'start'})}},500)}};
    box.prepend(c);while(box.children.length>3)box.lastChild.remove();
    setTimeout(fuera,9000);
    try{window.loadOrders&&window.loadOrders()}catch(_){}
  }
  window.pdTarjetaAviso=tarjetaAviso;
  try{navigator.serviceWorker.addEventListener('message',e=>{const m=e.data||{};if(m.type==='pd-push')tarjetaAviso(m.data)})}catch(_){}
})();
