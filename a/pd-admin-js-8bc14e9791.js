
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
    <div class="pdcStats"><div><span>Clientes</span><strong id="pdcN">–</strong></div><div><span>Con mapa</span><strong id="pdcU">–</strong></div><div><span>Con DNI</span><strong id="pdcD">–</strong></div></div>
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
const ic=d=>`<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const I={tel:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',dni:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.6-1.5 1.7-2 3-2s2.4.5 3 2M14 10h4M14 13h3"/>',dir:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',map:'<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',wa:'<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2z"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',del:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'};
const ini=name.trim().split(/\s+/).map(x=>x[0]||'').slice(0,2).join('').toUpperCase();
const linea=(k,lbl,val,link)=>`<div class="pccLi">${ic(I[k])}<span class="pccLiTx"><small>${lbl}</small>${link?`<a href="${E(link)}" target="_blank" rel="noopener">${E(val)}</a>`:`<b class="${val?'':'vacio'}">${E(val||'No registrado')}</b>`}</span></div>`;
return `${sep}<div class="pccRow ${opened.has(id)?'open':''}" data-id="${E(id)}">
        <button type="button" class="pccHead" aria-expanded="${opened.has(id)}"><span class="pccAv">${E(ini||'#')}</span><span class="pccTxt"><strong>${E(name)}</strong><small>${E(tel||'Sin número')}</small></span><svg class="pccChev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
        <div class="pccBody">
          <div class="pccInfo">${linea('tel','Número',tel)}${linea('dni','DNI',dni)}${linea('dir','Dirección',dir)}${ubLink?linea('map','Ubicación','Ver en el mapa',ubLink):linea('map','Ubicación','')}</div>
          <div class="pccMain"><a class="pccWa" href="${w?E(w):'#'}" target="_blank" rel="noopener" ${w?'':'aria-disabled="true"'}>${ic(I.wa)}WhatsApp</a><a class="pccCall" href="${tel?'tel:'+E(digits(tel)):'#'}" ${tel?'':'aria-disabled="true"'}>${ic(I.tel)}Llamar</a></div>
          <div class="pccSub"><button type="button" data-act="ficha">${ic('<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>')}Ficha</button><button type="button" data-act="edit">${ic(I.edit)}Editar</button><button type="button" class="del" data-act="del">${ic(I.del)}Borrar</button></div>
        </div></div>`;
}).join('');
if(rows.length>limit)html+=`<button type="button" class="pdcMore" id="pdcMore">Ver ${Math.min(60,rows.length-limit)} más (${rows.length-limit} restantes)</button>`;
list.innerHTML=html;
};
list?.addEventListener('click',e=>{
if(e.target.closest('#pdcMore')){limit+=60;window.renderClientes();return}
const row=e.target.closest('.pccRow');if(!row)return;const id=row.dataset.id;
if(e.target.closest('.pccHead')){row.classList.toggle('open');const on=row.classList.contains('open');on?opened.add(id):opened.delete(id);row.querySelector('.pccHead').setAttribute('aria-expanded',String(on));return}
if(e.target.closest('a[aria-disabled="true"]')){e.preventDefault();return}
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
try{(function(){const C=window.PdCaja;if(!C||C.vueltoTag)return;const RX=/\s*·\s*VUELTO (DE CAJA|CON DINERO PROPIO)/i;const c0=C.clean;
C.clean=function(m){return String(c0.call(this,m)||'').replace(RX,'')};
C.vueltoTag=function(m){const x=String((m&&m.descripcion)||'').match(RX);if(!x)return '';return /CAJA/i.test(x[1])?'<span class="pdcjVu caja">Vuelto de su caja</span>':'<span class="pdcjVu">Vuelto recibido</span>'};})()}catch(e){}
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
adminName=n;LS.set('pd_admin_name',n);window.__pdAdminNombre=n;applyName();
let saved=false;try{if(uid&&window.db){const {data,error}=await window.db.from('perfiles').update({nombre_completo:n}).eq('id',uid).select('id').maybeSingle();saved=!error&&!!data}}catch(e){}
$('pdhMsg').textContent=saved?'✓ Guardado en tu cuenta.':'✓ Guardado en este equipo.';setTimeout(()=>{$('pdhSheet').hidden=true},700);
};
window.pdhReload=function(){};
})();
}catch(e){console.error("[pdh-js]",e)}

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
    ['cfg','Configurar negocios',abrir('config-negocios')],
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
 var txt=['*PIDEMÁS DELIVERY*','¡Hola, '+String(m.nombre_completo||'motorizado').trim()+'!','Tienes un pedido asignado por Administración.','Pedido: #'+cod,'Por favor, ingresa al panel, revisa los detalles y confirma la asignación.','Entra aquí: https://pidemasdelivery.github.io/motorizado/','Gracias por trabajar con Pidemás.'].join('\n');
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
var TAB={'tab-pedidos':'Principal','tab-clientes':'Principal','tab-caja':'Motorizados','tab-sueldo':'Motorizados'};
var TOOL={'Crear negocio':'Negocios','Estado de negocios':'Negocios','Motorizados / GPS':'Motorizados','Crear motorizado':'Motorizados','Suspender / reactivar cuentas':'Motorizados','Códigos de descuento':'Marketing'};
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

  let negs=[],cur=null,cats=[],prods=[],tab='perfil',edit=null,map=null;

  function msg(t,bad){
    if(t&&!bad&&window.pdExito&&!/^(Guardando|Cargando|Cambiando)/i.test(t)&&/guardad|agregad|eliminad|actualizad|cambiad|quitad|visible|oculta|oculto/i.test(t)){const m0=$('cnxMsg');if(m0){m0.textContent='';m0.className='cnxMsg'}window.pdExito(/guardad|actualizad|cambiad/i.test(t)?'Cambios guardados':t);return}
    if(t&&!bad&&/^(Guardando|Cargando|Cambiando)/i.test(t))t='';
    const m=$('cnxMsg');if(!m)return;clearTimeout(msg.t);m.textContent=t||'';m.className='cnxMsg'+(t?' on':'')+(bad?' bad':'');if(t&&!bad)msg.t=setTimeout(()=>{m.className='cnxMsg'},3500);if(t&&bad)try{m.scrollIntoView({block:'nearest',behavior:'smooth'})}catch(e){}}
  const F=(label,id,val,extra)=>'<div class="cnxF"><label for="'+id+'">'+label+'</label><input id="'+id+'" value="'+E(val??'')+'" '+(extra||'')+'></div>';
  const SW=(id,on,txt)=>'<label class="cnxCk"><input type="checkbox" id="'+id+'"'+(on?' checked':'')+'><span>'+txt+'</span></label>';
  const TOG=(id,on,t,s)=>'<label class="cnxTog"><span class="cnxTogTx"><b>'+t+'</b>'+(s?'<small>'+s+'</small>':'')+'</span><input type="checkbox" id="'+id+'"'+(on?' checked':'')+'><i class="cnxSw" aria-hidden="true"></i></label>';
  const SEC=(paso,t)=>'<div class="cnxSec"><span>'+paso+'</span><b>'+t+'</b></div>';
  const ini=n=>String(n||'?').trim().split(/\s+/).map(w=>w[0]||'').slice(0,2).join('').toUpperCase();
  function hero(){const r=cur,lg=pick(r,LOGO),u=lg?r[lg]:'';const vis=r.activo!==false;
    return '<div class="cnxHero"><div class="cnxHeroAv">'+(u?'<img src="'+E(u)+'" alt="">':E(ini(r.nombre)))+'</div><div class="cnxHeroTx"><small>NEGOCIO</small><b>'+E(r.nombre||'Sin nombre')+'</b><span class="'+(vis?'ok':'off')+'">'+(vis?'Visible en la tienda':'Oculto en la tienda')+'</span></div></div>'}
  function imgRow(kind,label,desc,url,wide){return '<div class="cnxLogoRow" data-k="'+kind+'"><div class="cnxLogoTh'+(wide?' wide':'')+'">'+(url?'<img src="'+E(url)+'" alt="">':'<span>Sin '+label.toLowerCase()+'</span>')+'</div><div class="cnxLogoTx"><b>'+label+'</b><small>'+desc+'</small><div class="cnxLogoBt"><label class="cnxBtnSoft" for="cnx'+kind+'F">'+(url?'Cambiar':'Subir')+' '+label.toLowerCase()+'</label>'+(url?'<button type="button" class="cnxBtnGhost" data-a="img-del" data-k="'+kind+'">Quitar</button>':'')+'</div><input type="file" id="cnx'+kind+'F" accept="image/png,image/jpeg,image/webp" hidden></div></div>'}

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
    cur=negs.find(n=>String(n.id)===String(id))||null;edit=null;dsOpen=false;
    $('cnxBody').classList.toggle('cnxOff',!cur);$('cnxEmpty').classList.toggle('cnxOff',!!cur);
    msg('');if(!cur)return;
    pintarVis();
    await pintar();
  }
  function pintarVis(){
    const i=$('cnxVis'),t=$('cnxVisTx');if(!i||!cur)return;const on=cur.visible_admin!==false;
    i.checked=on;if(t)t.textContent=on?(cur.activo===false?'Visible, pero pausado por el negocio':'Los clientes ven este negocio en la tienda'):'Oculto por administración';
  }
  $('cnxVis')&&$('cnxVis').addEventListener('change',async()=>{
    const i=$('cnxVis');if(!cur)return;const quiere=i.checked;
    if(!quiere&&!(await pdConfirmar('¿Ocultar «'+(cur.nombre||'este negocio')+'» de la tienda? El negocio no podrá volver a activarlo: le saldrá un aviso para que se ponga en contacto contigo.'))){i.checked=true;return}
    i.disabled=true;
    try{
      const {data,error}=await db.from('negocios').update({visible_admin:quiere}).eq('id',cur.id).select('id,visible_admin').maybeSingle();
      if(error)throw error;if(!data||data.visible_admin!==quiere)throw new Error('Supabase no confirmó el cambio.');
      cur.visible_admin=quiere;const n=negs.find(x=>String(x.id)===String(cur.id));if(n)n.visible_admin=quiere;
      msg(quiere?'Negocio visible en la tienda.':'Negocio oculto en la tienda.');
    }catch(e){i.checked=!quiere;msg('No se pudo cambiar la visibilidad: '+(e.message||e),true)}
    finally{i.disabled=false;pintarVis()}
  });
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
      if(tab==='perfil')pPerfil(p);
      else if(tab==='productos'){if(!p.querySelector('.nxProd')&&!edit)p.innerHTML='<div class="cnxMuted">Cargando productos…</div>';await cargarCats();await cargarProds();edit?pProd(p):pProductos(p)}
      else if(tab==='datos')pDatos(p);
      else if(tab==='ubicacion')pUbic(p);
      else if(tab==='horarios')pHor(p);
      else if(tab==='acceso')await pAcc(p);
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
    p.innerHTML=hero()+((logo||port)?'<div class="cnxCard">'+SEC('PASO 1','Imagen del negocio')+(logo?imgRow('Logo','Logo','Se muestra en la tienda junto al nombre. Mejor cuadrado y con buen contraste.',r[logo]):'')+(port?imgRow('Port','Portada','Imagen ancha de cabecera del negocio en la tienda.',r[port],true):'')+'</div>':'')+'<div class="cnxCard">'+SEC((logo||port)?'PASO 2':'PASO 1','Datos del negocio')
      +F('Nombre del negocio','cnxNombre',r.nombre)
      +(tel?F('Número de WhatsApp / teléfono','cnxTel',r[tel],'type="tel" inputmode="tel"'):'')
      +(has(r,'descripcion')?'<div class="cnxF"><label for="cnxDesc">Descripción</label><textarea id="cnxDesc" rows="3">'+E(r.descripcion||'')+'</textarea></div>':'')
      +(cat?'<div class="cnxF"><label for="cnxCat">Categoría del negocio</label><select id="cnxCat"><option value="">Selecciona una categoría</option>'+opts.map(c=>'<option'+(c===catVal?' selected':'')+'>'+E(c)+'</option>').join('')+'</select></div>':'')
      +(has(r,'ruc')?F('RUC','cnxRuc',r.ruc,'inputmode="numeric"'):'')
      +(has(r,'tiempo_estimado')?F('Tiempo estimado de entrega','cnxTiempo',r.tiempo_estimado,'placeholder="Ej. 25–40 min"'):'')
      +(has(r,'orden')?F('Orden en la tienda','cnxOrden',r.orden??0,'type="number" step="1"'):'')
      +'</div>'
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
    if(lat&&lng&&window.pdMapa){
      p.innerHTML='<div class="cnxCard" id="cnxUbHost">'+(dir?F('Dirección del local','cnxDir',r[dir]):'')
        +'<input type="hidden" id="cnxLat" value="'+E(r[lat]??'')+'"><input type="hidden" id="cnxLng" value="'+E(r[lng]??'')+'">'
        +(gm?'<input type="hidden" id="cnxGm" value="'+E(r[gm]??'')+'">':'')
        +'</div><button type="button" class="btn" data-a="ubic-save">Guardar ubicación</button>';
      p._cols={dir,lat,lng,gm};
      pdMapa.tarjeta($('cnxUbHost'),{lat:$('cnxLat'),lng:$('cnxLng'),maps:gm?$('cnxGm'):null,dir:dir?$('cnxDir'):null,titulo:'Ubicación del negocio',etiqueta:'Local',tip:'Mueve el mapa hasta el local',gpsTxt:'Estoy aquí',pendTxt:'Ubicación lista. Presiona «Guardar ubicación» para guardarla.',okTxt:'Con este punto se calcula el delivery y el motorizado llega al local.',faltaTxt:'Este negocio no tiene ubicación marcada: el delivery se cobra aproximado.',guardar:'[data-a="ubic-save"]'});
      return;
    }
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
  function abiertoAhora(H){const d=new Date();const k=['domingo','lunes','martes','miercoles','jueves','viernes','sabado'][d.getDay()];const x=H[k];if(!x)return null;const m=d.getHours()*60+d.getMinutes();const t=v=>{const q=String(v).split(':');return (+q[0])*60+(+q[1]||0)};const a=t(x.abre),c=t(x.cierra);return c>a?(m>=a&&m<c):(m>=a||m<c)}
  function pHor(p){
    if(!has(cur,'horario')){p.innerHTML='<div class="cnxErr">La tabla negocios no tiene la columna horario.</div>';return}
    const H=leerHorario(cur.horario);const hoy=['domingo','lunes','martes','miercoles','jueves','viernes','sabado'][new Date().getDay()];
    const n=Object.keys(H).length,ab=abiertoAhora(H);
    p.innerHTML=hero()+'<div class="cnxCard cnxEst"><span class="cnxEstIc">◷</span><div><b>'+(n?(ab?'Abierto ahora':'Cerrado ahora'):'Cerrado')+'</b><small>'+(n?n+' día'+(n===1?'':'s')+' de atención a la semana.':'No tiene días de atención. Activa al menos uno.')+'</small></div></div>'
      +'<div class="cnxCard">'+SEC('HORARIO','Días y horas de atención')+'<p class="cnxMuted">Los clientes solo pueden pedir dentro de este horario. En la tienda se recorta al horario general de Pidemás.</p>'
      +DIAS.map(([k,nm])=>{const d=H[k];return '<div class="cnxDia" data-d="'+k+'"><label class="cnxDiaTop"><span class="cnxDiaTx"><b>'+nm+(k===hoy?' <em>Hoy</em>':'')+'</b><small class="cnxDiaSt">'+(d?E(d.abre)+' – '+E(d.cierra):'Cerrado')+'</small></span><input type="checkbox" class="ha-on"'+(d?' checked':'')+'><i class="cnxSw" aria-hidden="true"></i></label><div class="cnxHoras"><input type="time" class="ha" value="'+E(d?d.abre:'09:00')+'"><i>a</i><input type="time" class="hc" value="'+E(d?d.cierra:'21:30')+'"></div></div>'}).join('')
      +'<button type="button" class="btn alt cnxCopy" data-a="hor-copy">Copiar el horario del primer día activo a los demás</button></div><button type="button" class="btn" data-a="hor-save">Guardar horario</button>';
    p.querySelectorAll('.cnxDia').forEach(r=>{const upd=()=>{const on=r.querySelector('.ha-on').checked;r.classList.toggle('on',on);r.querySelector('.cnxDiaSt').textContent=on?(r.querySelector('.ha').value+' – '+r.querySelector('.hc').value):'Cerrado'};r.addEventListener('change',upd);r.addEventListener('input',upd);upd()});
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
        if(!(await (window.pdAdmPregunta||pdConfirmar)('¿Eliminar la categoría «'+(c.nombre||'')+'»? Sus productos quedarán sin categoría.')))return;
        const u=await db.from('productos_negocio').update({categoria_id:null}).eq('categoria_id',c.id).eq('negocio_id',cur.id);if(u.error)throw u.error;
        const {error}=await db.from('categorias_negocio').delete().eq('id',c.id).eq('negocio_id',cur.id);if(error)throw error;
        msg('Categoría eliminada.');
      }else return;
      await pintar();
    }catch(e){msg('No se pudo completar: '+(e.message||e),true)}
  }

  /* ---------- Acceso (contraseña) ---------- */
  async function pAcc(p){
    p.innerHTML=hero()+'<div class="cnxCard"><div class="cnxMuted">Cargando cuentas…</div></div>';
    const {data,error}=await db.rpc('admin_cuentas_negocio',{p_negocio:cur.id});
    if(error){p.innerHTML=hero()+'<div class="cnxErr">No se pudieron cargar las cuentas: '+E(error.message)+'<br><br>Si dice que la función no existe, ejecuta en Supabase el archivo <b>admin-claves-negocio.sql</b>.</div>';return}
    const cs=data||[];
    p.innerHTML=hero()+'<div class="cnxCard">'+SEC('ACCESO','Cuenta del negocio')+(cs.length?cs.map(c=>'<div class="cnxAcc" data-u="'+E(c.usuario_id)+'"><div class="cnxAccTop"><span class="cnxAccAv">'+E(ini(c.email))+'</span><span><b>'+E(c.email||'Sin correo')+'</b><small>'+(c.ultimo_ingreso?'Último ingreso: '+E(new Date(c.ultimo_ingreso).toLocaleString('es-PE',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})):'Aún no ha ingresado')+'</small></span></div>'
      +'<div class="cnxF"><label>Nueva contraseña</label><div class="cnxPw"><input type="password" class="pw1" autocomplete="new-password" placeholder="Mínimo 6 caracteres"><button type="button" class="cnxEye" data-a="pw-eye" aria-label="Ver">Ver</button></div></div>'
      +'<div class="cnxF"><label>Repite la contraseña</label><input type="password" class="pw2" autocomplete="new-password"></div>'
      +'<button type="button" class="btn" data-a="pw-save">Cambiar contraseña</button></div>').join('')
      :'<p class="cnxMuted">Este negocio no tiene una cuenta vinculada. Créala desde «Crear negocio» o vincula su usuario en Supabase.</p>')+'</div>'
      +'<p class="cnxMuted" style="margin:4px 2px">El negocio deberá ingresar con la nueva contraseña. Compártela por un medio seguro.</p>';
  }
  async function savePw(row){
    const a=row.querySelector('.pw1').value,b=row.querySelector('.pw2').value;
    if(a.length<6){msg('La contraseña debe tener al menos 6 caracteres.',true);return}
    if(a!==b){msg('Las contraseñas no coinciden.',true);return}
    const btn=row.querySelector('[data-a="pw-save"]');btn.disabled=true;btn.textContent='Cambiando…';
    try{const {error}=await db.rpc('admin_cambiar_clave_negocio',{p_usuario:row.dataset.u,p_clave:a});if(error)throw error;
      row.querySelector('.pw1').value='';row.querySelector('.pw2').value='';
      if(window.pdExito)pdExito('Contraseña cambiada.');else msg('Contraseña cambiada.');
    }catch(e){msg('No se pudo cambiar la contraseña: '+(e.message||e),true)}
    finally{btn.disabled=false;btn.textContent='Cambiar contraseña'}
  }

  /* ---------- Descartables (igual que en el panel del negocio) ---------- */
  const DS_RE=/restaur|comida|poll|pizz|hambur|sangu|pavi|cevich|chifa|sushi|parrill|anticuch|helad|cafe|jugu|dulce|pastel|panader|broaster|men[uú]/i;
  /* Comida y bebidas: taper, vaso, bolsa y cubiertos. Panaderías y negocios de productos: solo bolsa. Agua y gas: nada. */
  function dsPerfil(r){const c=String(r&&(r.categoria_negocio||r.categoria_comercial||r.tipo_negocio||r.categoria)||'').trim().toLowerCase();
    if(!c)return {tipo:'bolsa',keys:['bolsa']};
    if(/agua|gas\b|lavander/.test(c))return {tipo:'ninguno',keys:[]};
    if(/panader/.test(c))return {tipo:'bolsa',keys:['bolsa']};
    if(/restaur|comida|poll|pizz|hambur|sangu|pavi|cevich|chifa|sushi|japon|parrill|anticuch|helad|cafe|jugu|dulce|pastel|broaster|men[uú]|postre|marisc|criolla/.test(c))return {tipo:'comida',keys:['taper_p','taper_g','vaso_p','vaso_g','bolsa','cubiertos']};
    return {tipo:'bolsa',keys:['bolsa']}}
  const esComida=r=>!!r&&dsPerfil(r).tipo!=='ninguno';
  const DSK=[['taper_p','Taper pequeño','🥡','Se elige en cada producto','Ej. 0.30'],['taper_g','Taper grande','🥡','Se elige en cada producto','Ej. 0.50'],['vaso_p','Vaso pequeño','🥤','Se elige en cada producto','Ej. 0.20'],['vaso_g','Vaso grande','🥤','Se elige en cada producto','Ej. 0.30'],['bolsa','Bolsa','🛍️','Va en cada pedido','Ej. 0.20'],['cubiertos','Cubiertos','🍴','Lo pide el cliente','Ej. 0.30']];
  function dsCfg(){let c=cur&&cur.descartables_config;if(typeof c==='string'){try{c=JSON.parse(c)}catch(e){c=null}}return c&&typeof c==='object'?c:{}}
  const dsTxt=v=>{const n=Number(v);return v===null||v===undefined||v===''||!isFinite(n)?'':(n===0?'0':n.toFixed(2))};
  const dsP=v=>{if(v===null||v===undefined||v==='')return null;const n=Number(v);return isFinite(n)&&n>=0?n:null};
  const dsErr=e=>{const m=String((e&&e.message)||e||'');return /descartables|column|schema/i.test(m)?'Faltan las columnas de descartables en Supabase (descartables_activo y descartables_config).':'No se pudo guardar: '+m};
  let dsOpen=false;
  function dsHTML(){
    if(!esComida(cur))return '';
    const on=cur.descartables_activo===true,c=dsCfg(),PF=dsPerfil(cur),sb=PF.tipo==='bolsa';
    return '<button type="button" class="nxBtn light cnxDsBtn" data-a="ds-open"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg><span>'+(sb?'Configurar bolsa':'Configurar descartables')+'</span></button>'
      +'<div class="cnxDsPanel" id="cnxDsPanel"'+(dsOpen?'':' hidden')+'><div class="cnxDsHead"><b>'+(sb?'Bolsa':'Descartables')+'</b><button type="button" class="cnxDsX" data-a="ds-close" aria-label="Cerrar">×</button></div>'
      +TOG('cnxDsOn',on,sb?'Cobrar bolsa':'Cobrar descartables',sb?'Actívalo para sumar el precio de la bolsa a los pedidos.':'Actívalo para sumar el precio de los descartables a los pedidos.')
      +'<div class="cnxDsBox" id="cnxDsBox"'+(on?'':' hidden')+'><div class="cnxDsBoxH"><b>Precio por unidad</b><small>Vacío = no lo ofreces · 0 = gratis</small></div>'
      +DSK.filter(([k])=>PF.keys.includes(k)).map(([k,n,ic,sub,ph])=>'<label class="cnxDsRow" for="cnxDs_'+k+'"><span><b>'+n+'</b><small>'+sub+'</small></span><em>S/</em><input id="cnxDs_'+k+'" inputmode="decimal" maxlength="6" placeholder="'+ph+'" value="'+E(dsTxt(c[k]))+'" autocomplete="off"></label>').join('')
      +'<div class="cnxDsBoxH" style="margin-top:12px"><b>Otros descartables</b><small>Por ejemplo caja, sobre o bandeja. Se eligen en cada producto.</small></div><div id="cnxDxList">'+(Array.isArray(c.extras)?c.extras:[]).map(x=>dxRow(x)).join('')+'</div><button type="button" class="nxBtn light sm" data-a="dx-add">+ Agregar otro descartable</button>'
      +'<p class="cnxDsNota">Si entregas bolsa de plástico, por ley se cobra además el impuesto ICBPER de S/ 0.50 por bolsa: inclúyelo en el precio.</p><button type="button" class="btn" data-a="ds-save">'+(sb?'Guardar precio':'Guardar precios')+'</button></div></div>';
  }
  function dxRow(x){x=x||{};return '<div class="cnxDxRow" data-id="'+E(x.id||'')+'" style="display:grid!important;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr) 46px!important;gap:8px!important;align-items:center!important;margin:6px 0!important"><input class="nxIn dxN" style="width:100%!important;min-width:0!important;box-sizing:border-box!important" maxlength="30" placeholder="Ej. Caja" value="'+E(x.n||'')+'" aria-label="Nombre del descartable" autocomplete="off"><input class="nxIn dxP" style="width:100%!important;min-width:0!important;box-sizing:border-box!important" inputmode="decimal" maxlength="6" placeholder="S/ 0.50" value="'+E(x.p==null?'':dsTxt(x.p))+'" aria-label="Precio" autocomplete="off"><button type="button" style="width:46px!important;min-width:46px!important;height:46px!important;padding:0!important;border-radius:12px!important;border:1px solid #F4C7C3!important;background:#FFFFFF!important;color:#B42318!important;font-size:22px!important;line-height:1!important" data-a="dx-del" aria-label="Quitar">×</button></div>'}
  async function dsToggle(inp){
    const nuevo=inp.checked;inp.disabled=true;
    try{await guardarNegocio({descartables_activo:nuevo},'Cambios guardados');const bx=$('cnxDsBox');if(bx)bx.hidden=!nuevo}
    catch(e){inp.checked=!nuevo;msg(dsErr(e),true)}
    finally{inp.disabled=false}
  }
  async function dsSave(btn){
    const cfg={};
    const PF=dsPerfil(cur);
    for(const [k,n] of DSK){if(!PF.keys.includes(k)){cfg[k]=null;continue}const raw=String(($('cnxDs_'+k)||{}).value||'').trim().replace(',','.');
      if(raw===''){cfg[k]=null;continue}
      const v=Number(raw);if(!isFinite(v)||v<0||v>50){msg(n+': escribe un precio válido, por ejemplo 0.50.',true);return}
      cfg[k]=Math.round(v*100)/100}
    const ex=[];for(const row of document.querySelectorAll('#cnxDxList .cnxDxRow')){const n=row.querySelector('.dxN').value.trim(),raw=row.querySelector('.dxP').value.trim().replace(',','.');if(!n&&!raw)continue;if(!n){msg('Escribe el nombre de cada descartable.',true);return}const v=Number(raw);if(raw===''||!isFinite(v)||v<0||v>50){msg(n+': escribe un precio válido, por ejemplo 0.50.',true);return}ex.push({id:row.dataset.id||('x'+Date.now().toString(36)+Math.random().toString(36).slice(2,5)),n,p:Math.round(v*100)/100})}
    cfg.extras=ex;const ids=new Set(ex.map(x=>x.id));
    let pr=dsCfg().prod;if(pr&&typeof pr==='object'){pr=JSON.parse(JSON.stringify(pr));for(const k in pr){const m=pr[k];if(Array.isArray(m.ex)){m.ex=m.ex.filter(i=>ids.has(String(i)));if(!m.ex.length)delete m.ex}if(PF.tipo!=='comida'){delete m.taper;delete m.vaso}if(!Object.keys(m).length)delete pr[k]}cfg.prod=pr}
    const t0=btn.textContent;btn.disabled=true;btn.textContent='Guardando…';
    try{await guardarNegocio({descartables_config:cfg},'Cambios guardados')}
    catch(e){msg(dsErr(e),true)}
    finally{btn.disabled=false;btn.textContent=t0}
  }
  function dsProdHTML(x){
    const c=dsCfg(),EX=(Array.isArray(c.extras)?c.extras:[]).filter(e=>e&&e.id&&e.n),comida=dsPerfil(cur).tipo==='comida';
    if(cur.descartables_activo!==true||(!comida&&!EX.length))return '';
    const pc=(x&&x.id&&c.prod&&c.prod[String(x.id)])||{};
    edit.ds={taper:pc.taper==='p'||pc.taper==='g'?pc.taper:'',vaso:pc.vaso==='p'||pc.vaso==='g'?pc.vaso:'',ex:(Array.isArray(pc.ex)?pc.ex:[]).map(String)};
    const hay=['taper_p','taper_g','vaso_p','vaso_g'].some(k=>dsP(c[k])!==null);
    const fila=(t,nom)=>{const op=(k,lab)=>{const pr=k?dsP(c[t+'_'+k]):0,off=k&&pr===null;return '<button type="button" data-a="dsp" data-dt="'+t+'" data-dk="'+k+'"'+(off?' disabled':'')+' aria-pressed="'+(edit.ds[t]===k)+'">'+lab+(k?(off?' · sin precio':' · '+money(pr)):'')+'</button>'};
      return '<div class="cnxDsPRow"><b>'+nom+'</b><div class="cnxDsSeg">'+op('','No lleva')+op('p','Pequeño')+op('g','Grande')+'</div></div>'};
    return '<div class="nxSub">'+SEC('DESCARTABLES','Descartables de este producto')+'<p class="cnxMuted">'+(hay?'Lo que elijas se agrega solo cuando el cliente pide este producto, y su precio se suma al del producto.':'Primero escribe los precios de taper y vaso en Carta → Configurar descartables.')+'</p>'+(comida?fila('taper','Taper')+fila('vaso','Vaso'):'')+EX.map(e=>{const on=edit.ds.ex.includes(String(e.id));return '<div class="cnxDsPRow"><b>'+E(e.n)+'</b><div class="cnxDsSeg"><button type="button" data-a="dsx" data-x="'+E(e.id)+'" data-v="0" aria-pressed="'+(!on)+'">No lleva</button><button type="button" data-a="dsx" data-x="'+E(e.id)+'" data-v="1" aria-pressed="'+on+'">Lleva · '+money(dsP(e.p)||0)+'</button></div></div>'}).join('')+'</div>';
  }
  async function dsProdSave(id,ds){
    if(!ds||!id)return '';
    const c=Object.assign({},dsCfg()),prod=Object.assign({},c.prod||{}),k=String(id);
    const nuevo={};if(ds.taper)nuevo.taper=ds.taper;if(ds.vaso)nuevo.vaso=ds.vaso;if(ds.ex&&ds.ex.length)nuevo.ex=ds.ex.slice();
    if(JSON.stringify(nuevo)===JSON.stringify(prod[k]||{}))return '';
    if(Object.keys(nuevo).length)prod[k]=nuevo;else delete prod[k];
    c.prod=prod;
    try{const {data,error}=await db.from('negocios').update({descartables_config:c}).eq('id',cur.id).select('*').maybeSingle();if(error)throw error;if(data)Object.assign(cur,data);else cur.descartables_config=c;return ''}
    catch(e){return ' (los descartables no se guardaron: '+((e&&e.message)||e)+')'}
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
    const sinSt=prods.filter(x=>{const v=Number(x[sk]);return isFinite(v)&&v<=0}).length;
    p.innerHTML='<div class="cnxStats"><div><small>Productos</small><b>'+prods.length+'</b></div><div><small>Categorías</small><b>'+cats.length+'</b></div><div><small>Sin stock</small><b>'+sinSt+'</b></div></div><button type="button" class="btn" data-a="p-new">+ Agregar producto</button>'+dsHTML()
      +(grupos.filter(g=>g.items.length).map(g=>'<div class="cnxCard"><div class="cnxH">'+E(g.c.nombre||'')+' · '+g.items.length+'</div>'+g.items.map(card).join('')+'</div>').join('')||'<div class="cnxCard cnxMuted">Este negocio aún no tiene productos.</div>');
  }
  function pProd(p){
    const x=edit.prod||{},sp=splitDesc(x.descripcion),sk=stockKey();
    p.innerHTML='<div class="nxPanel nxProdForm"><div class="nxPanelHead"><strong>'+(x.id?'Editar producto':'Nuevo producto')+'</strong><button type="button" class="nxX" data-a="p-back" aria-label="Cerrar">×</button></div>'
      +'<div class="cnxF"><label for="cnxPCat">Categoría</label><select id="cnxPCat"><option value="">Sin categoría</option>'+cats.map(c=>'<option value="'+E(c.id)+'"'+(String(x.categoria_id||'')===String(c.id)?' selected':'')+'>'+E(c.nombre||'')+'</option>').join('')+'</select></div>'
      +F('Nombre del producto','cnxPNom',x.nombre)
      +'<div class="cnxF"><label for="cnxPDesc">Descripción detallada</label><textarea id="cnxPDesc" rows="4" maxlength="2000">'+E(sp.description)+'</textarea></div>'
      +'<div class="cnxF"><label>Características (opcional)</label><div id="cnxFeat">'+sp.features.map(f=>featRow(f.name,f.value)).join('')+'</div><button type="button" class="btn alt" data-a="feat-add">+ Agregar característica</button></div>'
      +'<div class="cnxRow2">'+F('Precio (S/)','cnxPPre',x.precio??'','type="number" step="0.01" min="0" inputmode="decimal"')+F('Stock','cnxPStk',x[sk]??'','type="number" step="1" min="0" inputmode="numeric"')+'</div>'
      +F('URL de imagen','cnxPImg',x.imagen_url||'','type="url"')
      +'<div class="cnxF"><label for="cnxPFile">Subir imagen</label><input type="file" id="cnxPFile" accept="image/png,image/jpeg,image/webp"></div>'
      +SW('cnxPAct',x.id?x.disponible!==false:true,'Visible en la tienda (necesita stock mayor a 0)')
      +dsProdHTML(x)+'<button type="button" class="nxBtn" data-a="p-save">Guardar producto</button>'+(x.id?'<button type="button" class="nxBtn light red" data-a="p-del" data-id="'+E(x.id)+'">Eliminar producto</button>':'')+'</div>';
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
    const sk=stockKey(),x=edit.prod||{},ds=edit.ds||null;
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
      let aviso=await dsProdSave(id,ds);
      if(file){
        try{const url=await subirImgProd(id,file);const u=await db.from('productos_negocio').update({imagen_url:url}).eq('id',id).eq('negocio_id',cur.id);if(u.error)throw u.error}
        catch(e){aviso+=' (la imagen no se pudo subir: '+(e.message||e)+')'}
      }
      edit=null;tab=tab==='carta'?'carta':'productos';await pintar();msg('Producto guardado.'+aviso,!!aviso);
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
        await quitarImgStorage(x.imagen_url);edit=null;msg('Producto eliminado.');
      }else return;
      await pintar();
    }catch(e){msg('No se pudo completar: '+(e.message||e),true)}
  }


  /* =====================================================================
     Configurar negocios con el mismo diseño e información que el panel Negocio
     (Mi perfil · Productos · Acceso). La visibilidad del negocio no va aquí.
     ===================================================================== */
  const TOPC=['10–20 min','20–30 min','30–40 min'];
  const DIAS_C={lunes:'Lun',martes:'Mar',miercoles:'Mié',jueves:'Jue',viernes:'Vie',sabado:'Sáb',domingo:'Dom'};
  const fmtH=v=>{const m=String(v||'').match(/^(\d{1,2}):(\d{2})/);if(!m)return v||'';let h=+m[1];const ap=h>=12?'pm':'am';h=h%12||12;return h+':'+m[2]+' '+ap};
  let nxQ='',nxCatOpen=false;const nxOpen=new Set(),nxMore=new Set();
  const tiendaUrl=r=>{try{const u=new URL('https://pidemasdelivery.github.io/');u.searchParams.set('negocio',String(r.id));return u.toString()}catch(e){return ''}};
  function tiempoSel(r){const ns=(String(r.tiempo_estimado||'').match(/\d+/g)||[]).map(Number);if(!ns.length)return '';const hi=ns[ns.length-1];let best=TOPC[0],d=1e9;TOPC.forEach(t=>{const n=+t.match(/\d+/g)[1];if(Math.abs(n-hi)<d){d=Math.abs(n-hi);best=t}});return best}

  function pPerfil(p){
    const r=cur,tel=pick(r,TEL),logo=pick(r,LOGO),port=pick(r,PORT);
    const cat=pick(r,['categoria_negocio','categoria_comercial','tipo_negocio','categoria']);
    const catVal=cat?String(r[cat]||''):'';const opts=(catVal&&!CATS.includes(catVal)?[catVal]:[]).concat(CATS);
    const dir=pick(r,['direccion','direccion_restaurante','ubicacion','direccion_comercial']),lat=pick(r,['latitud','latitude','lat']),lng=pick(r,['longitud','longitude','lng','lon']),gm=pick(r,['google_maps_url','google_maps','maps_url']);
    const lu=logo?r[logo]:'';const ts=tiempoSel(r);
    const H=leerHorario(r.horario),n=Object.keys(H).length,ab=abiertoAhora(H),hoy=['domingo','lunes','martes','miercoles','jueves','viernes','sabado'][new Date().getDay()];
    const url=tiendaUrl(r);
    p.innerHTML='<div class="nxPerf">'
      +'<section class="nxCard nxHero"><span class="nxLogo">'+(lu?'<img src="'+E(lu)+'" alt="">':E(ini(r.nombre)))+'</span><span class="nxHeroTx"><span class="nxKick">Mi perfil</span><strong>'+E(r.nombre||'Sin nombre')+'</strong>'+(catVal?'<small>'+E(catVal)+'</small>':'')+'</span></section>'
      +((logo||port)?'<section class="nxCard"><div class="nxH"><strong>Imagen del negocio</strong></div>'+(logo?imgRow('Logo','Logo','Se muestra en la tienda junto al nombre. Mejor cuadrado.',r[logo]):'')+(port?imgRow('Port','Portada','Imagen ancha de cabecera del negocio en la tienda.',r[port],true):'')+'</section>':'')
      +'<section class="nxCard"><div class="nxH"><strong>Datos del negocio</strong></div><div class="nxSec">'
        +F('Nombre del negocio','cnxNombre',r.nombre)
        +(cat?'<div class="cnxF"><label for="cnxCat">Categoría del negocio</label><select id="cnxCat"><option value="">Selecciona una categoría</option>'+opts.map(c=>'<option'+(c===catVal?' selected':'')+'>'+E(c)+'</option>').join('')+'</select></div>':'')
        +(has(r,'descripcion')?'<div class="cnxF"><label for="cnxDesc">Descripción</label><textarea id="cnxDesc" rows="3">'+E(r.descripcion||'')+'</textarea></div>':'')
        +'<div class="nxGrid2">'+(tel?F('WhatsApp','cnxTel',r[tel],'type="tel" inputmode="tel"'):'')+(has(r,'ruc')?F('RUC','cnxRuc',r.ruc,'inputmode="numeric"'):'')+'</div>'
      +'</div></section>'
      +'<section class="nxCard" id="nxUbCard"><div class="nxH"><strong>Ubicación</strong></div><div class="nxSec" id="cnxUbHost">'
        +(dir?F('Dirección del local','cnxDir',r[dir]):'')
        +((lat&&lng&&window.pdMapa)?'<input type="hidden" id="cnxLat" value="'+E(r[lat]??'')+'"><input type="hidden" id="cnxLng" value="'+E(r[lng]??'')+'">'+(gm?'<input type="hidden" id="cnxGm" value="'+E(r[gm]??'')+'">':'')
          :(gm?F('Enlace de Google Maps','cnxGm',r[gm],'type="url"'):'')+((lat&&lng)?'<div class="nxGrid2">'+F('Latitud','cnxLat',r[lat],'inputmode="decimal"')+F('Longitud','cnxLng',r[lng],'inputmode="decimal"')+'</div>':''))
      +'</div>'+(has(r,'ubicacion_publica')?'<div class="nxPubRow" style="display:flex;align-items:center;gap:12px;margin-top:12px"><span style="flex:1 1 0%;min-width:0"><b style="display:block;font-size:15px">Mostrar la dirección a los clientes</b><small class="nxMuted" id="cnxPubTx" style="display:block">'+(r.ubicacion_publica!==false?'Los clientes ven la dirección en la tienda.':'Privada: solo se usa para el delivery. En la tienda sale «Solo delivery».')+'</small></span><button type="button" class="nxSw'+(r.ubicacion_publica!==false?' on':'')+'" id="cnxPub" data-a="nx-pub" role="switch" aria-checked="'+(r.ubicacion_publica!==false)+'" aria-label="Mostrar la dirección a los clientes"><i></i></button></div>':'')+'</section>'
      +(has(r,'tiempo_estimado')?'<section class="nxCard"><div class="nxH"><strong>En la tienda</strong></div><div class="cnxF"><label>Tiempo de entrega</label><div class="nxPills" id="nxTiempo" role="radiogroup">'+TOPC.map(t=>'<button type="button" role="radio" data-a="nx-t" data-v="'+t+'" class="'+(t===ts?'on':'')+'" aria-checked="'+(t===ts)+'">'+t.replace(' min','')+'<small>min</small></button>').join('')+'</div></div></section>':'')
      +(has(r,'horario')?'<section class="nxCard"><div class="nxH"><strong>Horario de atención</strong><span class="nxPill '+(n&&ab?'ok':'off')+'">'+(n&&ab?'● Abierto':'Cerrado')+'</span></div>'
        +'<div class="nxMuted">'+(n?n+' día'+(n===1?'':'s')+' de atención a la semana.':'No tiene días de atención.')+'</div><div id="nxHor">'
        +DIAS.map(([k,nm])=>{const d=H[k];return '<div class="nxHr'+(d?' on':'')+(k===hoy?' today':'')+'" data-d="'+k+'"><button type="button" class="nxDay" data-a="nx-day" aria-pressed="'+(!!d)+'" aria-label="'+nm+'">'+DIAS_C[k]+'</button><input type="time" class="ha" value="'+E(d?d.abre:'09:00')+'" aria-label="Abre el '+nm+'"><span class="nxSep">a</span><input type="time" class="hc" value="'+E(d?d.cierra:'22:00')+'" aria-label="Cierra el '+nm+'"><span class="nxOff">Cerrado</span></div>'}).join('')
        +'</div><div class="nxGrid2"><button type="button" class="nxBtn light sm" data-a="nx-hcopy">Igual todos los días</button><button type="button" class="nxBtn light sm" data-a="nx-hall">Abrir toda la semana</button></div><p class="nxMuted">Toca un día para abrirlo o cerrarlo. Los cambios se guardan con «Guardar cambios».</p></section>':'')
      +(has(r,'pausado_hasta')?(()=>{const pz=r.pausado_hasta&&new Date(r.pausado_hasta).getTime()>Date.now()?new Date(r.pausado_hasta):null;const hh=pz?pz.toLocaleTimeString('es-PE',{hour:'numeric',minute:'2-digit',timeZone:'America/Lima'}):'';
        return '<section class="nxCard"><div class="nxH"><strong>Pausar pedidos</strong><span class="nxPill '+(pz?'off':'ok')+'">'+(pz?'En pausa':'Recibiendo')+'</span></div><div class="nxMuted">'+(pz?'No recibe pedidos nuevos hasta las '+E(hh)+'.':'Si el negocio está lleno, pausa los pedidos nuevos por un rato.')+'</div><div class="nxGrid2" style="margin-top:10px">'+[[15,'15 min'],[30,'30 min'],[60,'1 hora'],[120,'2 horas']].map(x=>'<button type="button" class="nxBtn light sm" data-a="nx-pz" data-v="'+x[0]+'">'+(pz?'+ ':'')+x[1]+'</button>').join('')+'</div>'+(pz?'<button type="button" class="nxBtn sm" style="margin-top:10px" data-a="nx-pz" data-v="0">Reanudar ahora</button>':'')+'</section>'})():'')
      +(has(r,'yape_qr_url')?'<section class="nxCard"><div class="nxH"><strong>Yape del negocio</strong>'+(r.yape_qr_url?'<span class="nxPill ok">Listo</span>':'<span class="nxPill off">Falta</span>')+'</div><div class="nxMuted">Se envía al cliente cuando paga con Yape al negocio.</div>'
        +'<div class="cnxLogoRow" data-k="Yape"><div class="cnxLogoTh">'+(r.yape_qr_url?'<img src="'+E(r.yape_qr_url)+'" alt="">':'<span>Sin QR</span>')+'</div><div class="cnxLogoTx"><b>QR de Yape</b><small>Imagen del QR tal como sale en su Yape.</small><div class="cnxLogoBt"><label class="cnxBtnSoft" for="cnxYapeF">'+(r.yape_qr_url?'Cambiar':'Subir')+' QR</label>'+(r.yape_qr_url?'<button type="button" class="cnxBtnGhost" data-a="img-del" data-k="Yape">Quitar</button>':'')+'</div><input type="file" id="cnxYapeF" accept="image/png,image/jpeg,image/webp" hidden></div></div>'
        +'<div class="nxGrid2">'+F('Número de Yape','cnxYNum',r.yape_numero||'','type="tel" inputmode="numeric" maxlength="9" placeholder="9 dígitos"')+F('Titular','cnxYTit',r.yape_titular||'','placeholder="Como sale en Yape"')+'</div></section>':'')
      +(url?'<section class="nxCard"><div class="nxH"><span><span class="nxKick">Comparte</span><strong>Enlace de carta</strong></span></div><div class="nxShare"><input class="nxIn" id="nxUrl" value="'+E(url)+'" readonly><button type="button" class="nxBtn light" data-a="nx-copy">Copiar</button></div><div class="nxGrid2"><button type="button" class="nxBtn wa sm" data-a="nx-wa">WhatsApp</button><a class="nxBtn light sm" href="'+E(url)+'" target="_blank" rel="noopener">Ver la tienda</a></div></section>':'')
      +'<button type="button" class="nxBtn" data-a="perf-save">Guardar cambios</button></div>';
    p._cols={tel,cat,logo,port,dir,lat,lng,gm};
    if(lat&&lng&&window.pdMapa){try{pdMapa.tarjeta($('cnxUbHost'),{lat:$('cnxLat'),lng:$('cnxLng'),maps:gm?$('cnxGm'):null,dir:dir?$('cnxDir'):null,titulo:'Ubicación del local',etiqueta:'Local',tip:'Mueve el mapa hasta el local',gpsTxt:'Estoy aquí',pendTxt:'Ubicación lista. Presiona «Guardar cambios» para guardarla.',okTxt:'Con este punto se calcula el delivery y el motorizado llega al local.',faltaTxt:'Falta marcar el local. Sin ubicación, el delivery se cobra aproximado.',guardar:'[data-a="perf-save"]'})}catch(e){console.warn('Mapa',e)}}
  }
  async function savePerfil(btn){
    const p=$('cnxPane'),c=p._cols||{},g=id=>$(id);
    const nombre=(g('cnxNombre')&&g('cnxNombre').value.trim())||'';if(!nombre){msg('El nombre es obligatorio.',true);return}
    const pl={nombre};
    if(c.tel&&g('cnxTel'))pl[c.tel]=g('cnxTel').value.trim()||null;
    if(g('cnxDesc'))pl.descripcion=g('cnxDesc').value.trim()||null;
    if(c.cat&&g('cnxCat'))pl[c.cat]=g('cnxCat').value||null;
    if(g('cnxRuc'))pl.ruc=g('cnxRuc').value.trim()||null;
    if(c.dir&&g('cnxDir'))pl[c.dir]=g('cnxDir').value.trim()||null;
    if(c.gm&&g('cnxGm'))pl[c.gm]=g('cnxGm').value.trim()||null;
    if(c.lat&&c.lng&&g('cnxLat')&&g('cnxLng')){const a=g('cnxLat').value.trim(),b=g('cnxLng').value.trim();const la=a===''?null:Number(a),ln=b===''?null:Number(b);if((a!==''&&!isFinite(la))||(b!==''&&!isFinite(ln))){msg('La ubicación no es válida.',true);return}pl[c.lat]=la;pl[c.lng]=ln}
    const tb=document.querySelector('#nxTiempo button.on');if(g('nxTiempo')&&g('nxTiempo').dataset.tocado)pl.tiempo_estimado=tb?tb.dataset.v:(cur.tiempo_estimado||null);
    if(g('cnxPub'))pl.ubicacion_publica=g('cnxPub').classList.contains('on');
    if(g('cnxYNum')){const yn=g('cnxYNum').value.replace(/\D/g,''),yt=g('cnxYTit').value.trim();if(yn&&yn.length!==9){msg('El número de Yape debe tener 9 dígitos.',true);return}pl.yape_numero=yn||null;pl.yape_titular=yt||null}
    if(g('nxHor')){const parts=[];for(const r of document.querySelectorAll('#nxHor .nxHr')){if(!r.classList.contains('on'))continue;const a=r.querySelector('.ha').value,z=r.querySelector('.hc').value;const nm=r.querySelector('.nxDay').getAttribute('aria-label');if(!a||!z){msg(nm+': completa la hora de apertura y cierre.',true);return}if(a===z){msg(nm+': la hora de apertura y la de cierre no pueden ser iguales.',true);return}parts.push(r.dataset.d+'='+a+'-'+z)}pl.horario=parts.join('|')||null}
    if(btn){btn.disabled=true;btn.textContent='Guardando…'}
    try{await guardarNegocio(pl,'Cambios guardados');pPerfil(p)}
    catch(e){msg('No se pudo guardar: '+(e.message||e),true)}
    finally{const b=document.querySelector('#cnxPane [data-a="perf-save"]');if(b){b.disabled=false;b.textContent='Guardar cambios'}}
  }

  const stockDe=x=>{const k=stockKey();const v=Number(x[k]);return x[k]===null||x[k]===undefined||!isFinite(v)?null:v};
  const CHEV='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  function nxRow(x){const st=stockDe(x),on=x.disponible!==false,img=x.imagen_url||'',L=E(String(x.nombre||'P').charAt(0).toUpperCase());
    return '<div class="nxPRow'+(on?'':' off')+'" data-id="'+E(x.id)+'"><button type="button" class="nxPMain" data-a="p-edit">'+(img?'<img class="nxPImg" src="'+E(img)+'" alt="" loading="lazy">':'<span class="nxPImg nxIni">'+L+'</span>')+'<span class="nxPTx"><strong>'+E(x.nombre||'Producto')+'</strong><small><b>'+money(x.precio)+'</b>'+(st===null?'':st<=0?' · <em>Sin stock</em>':' · Stock '+st)+'</small></span></button><button type="button" class="nxSw'+(on?' on':'')+'" data-a="p-vis" aria-label="'+(on?'Ocultar':'Mostrar')+' en la tienda"><i></i></button></div>'}
  function nxListHTML(){
    const ids=new Set(cats.map(c=>String(c.id)));
    const groups=cats.map(c=>({c,list:prods.filter(x=>String(x.categoria_id||'')===String(c.id))}));
    const loose=prods.filter(x=>!x.categoria_id||!ids.has(String(x.categoria_id)));if(loose.length)groups.push({c:null,list:loose});
    if(!prods.length&&!cats.length)return '<div class="nxEmpty"><b>Aún no tiene productos</b>Crea una categoría (por ejemplo «Platos») y luego agrega los productos.</div>';
    const q=nxQ.toLowerCase();
    return groups.map((g,gi)=>{
      const shown=q?g.list.filter(x=>String(x.nombre||'').toLowerCase().includes(q)):g.list;if(q&&!shown.length)return '';
      const c=g.c,on=!c||c.activo!==false,cid=c?String(c.id):'_none',open=!!q||nxOpen.has(cid);
      const z=g.list.filter(x=>{const v=stockDe(x);return v!==null&&v<=0}).length,hid=g.list.filter(x=>x.disponible===false).length;
      const sub=[g.list.length+' producto'+(g.list.length===1?'':'s'),z?z+' sin stock':'',hid?hid+' oculto'+(hid===1?'':'s'):'',c&&!on?'Oculta en la tienda':''].filter(Boolean).join(' · ');
      const more=c&&nxMore.has(cid)?'<div class="nxCatMore"><button type="button" data-a="c-vis">'+(on?'Ocultar en la tienda':'Mostrar en la tienda')+'</button><button type="button" data-a="c-ren">Renombrar</button><button type="button" data-a="c-up"'+(gi===0?' disabled':'')+'>↑ Subir</button><button type="button" data-a="c-down"'+(gi>=cats.length-1?' disabled':'')+'>↓ Bajar</button><button type="button" data-a="c-del" class="red">Eliminar</button></div>':'';
      return '<section class="nxCat'+(open?' open':'')+(on?'':' off')+'" data-cat="'+E(cid)+'"><div class="nxCatHd"><button type="button" class="nxCatBtn" data-a="c-tog" aria-expanded="'+open+'"><span><strong>'+(c?E(c.nombre):'Sin categoría')+'</strong><small>'+E(sub)+'</small></span>'+CHEV+'</button>'+'</div>'
        +(open?'<div class="nxCatBody">'+(shown.map(nxRow).join('')||'<p class="nxCatEmpty">Sin productos todavía.</p>')+'<div class="nxCatFoot"><button type="button" class="nxAddIn" data-a="c-add">+ Producto'+(c?' en '+E(c.nombre):'')+'</button>'+(c?'<button type="button" class="nxMoreBtn'+(nxMore.has(cid)?' act':'')+'" data-a="c-more" aria-label="Opciones de la categoría">⋯</button>':'')+'</div>'+more+'</div>':'')+'</section>';
    }).join('')||'<div class="nxEmpty">No hay productos con ese nombre.</div>';
  }
  function pProductos(p){
    const zero=prods.filter(x=>{const v=stockDe(x);return v!==null&&v<=0}).length;
    p.innerHTML='<div class="nxProd"><div class="nxStats"><div><span>Productos</span><strong>'+prods.length+'</strong></div><div><span>Categorías</span><strong>'+cats.length+'</strong></div><div><span>Sin stock</span><strong>'+zero+'</strong></div></div>'
      +'<input type="search" class="nxIn" id="nxQ" placeholder="Buscar producto" autocomplete="off" value="'+E(nxQ)+'">'
      +'<div class="nxGrid2"><button type="button" class="nxBtn" data-a="p-new">+ Producto</button><button type="button" class="nxBtn light" data-a="c-new">+ Categoría</button></div>'
      +dsHTML()
      +'<div class="nxPanel" id="nxCatPanel"'+(nxCatOpen?'':' hidden')+'><div class="nxPanelHead"><strong>Nueva categoría</strong><button type="button" class="nxX" data-a="c-close" aria-label="Cerrar">×</button></div><input class="nxIn" id="cnxCatN" placeholder="Nombre (ej. Ceviches, Bebidas)"><input class="nxIn" id="cnxCatD" placeholder="Descripción (opcional)"><button type="button" class="nxBtn" data-a="c-save">Guardar categoría</button></div>'
      +'<div id="nxList">'+nxListHTML()+'</div></div>';
  }
  async function nxCatAction(a,cid){
    const c=cats.find(x=>String(x.id)===String(cid));
    try{
      if(a==='c-save'){const n=$('cnxCatN').value.trim();if(!n){msg('Escribe el nombre de la categoría.',true);return}
        const pl={negocio_id:cur.id,nombre:n,descripcion:$('cnxCatD').value.trim()||null};
        let r=await db.from('categorias_negocio').insert(Object.assign({orden:cats.length+1},pl));if(r.error&&/orden/i.test(r.error.message||''))r=await db.from('categorias_negocio').insert(pl);if(r.error)throw r.error;
        nxCatOpen=false;msg('Categoría agregada.')}
      else if(a==='c-vis'&&c){const {error}=await db.from('categorias_negocio').update({activo:c.activo===false}).eq('id',c.id).eq('negocio_id',cur.id);if(error)throw error;msg(c.activo===false?'Categoría visible en la tienda.':'Categoría oculta en la tienda.')}
      else if(a==='c-ren'&&c){const n=window.pdPedir?await pdPedir('Nuevo nombre de la categoría:',c.nombre||''):null;if(!n||!String(n).trim())return;const {error}=await db.from('categorias_negocio').update({nombre:String(n).trim()}).eq('id',c.id).eq('negocio_id',cur.id);if(error)throw error;msg('Categoría guardada.')}
      else if((a==='c-up'||a==='c-down')&&c){const l=cats.slice(),i=l.indexOf(c),j=i+(a==='c-up'?-1:1);if(j<0||j>=l.length)return;[l[i],l[j]]=[l[j],l[i]];for(let k=0;k<l.length;k++){if(Number(l[k].orden)===k+1)continue;const {error}=await db.from('categorias_negocio').update({orden:k+1}).eq('id',l[k].id).eq('negocio_id',cur.id);if(error)throw new Error(error.message+' (falta la columna «orden» en categorias_negocio)')}}
      else if(a==='c-del'&&c){const n=prods.filter(x=>String(x.categoria_id)===String(c.id)).length;const ch=window.pdElegirBorrarCat?await window.pdElegirBorrarCat(c.nombre||'',n):((await pdConfirmar('¿Eliminar la categoría «'+(c.nombre||'')+'»?'))?'solo':null);if(!ch)return;
        const u=ch==='todo'?await db.from('productos_negocio').delete().eq('categoria_id',c.id).eq('negocio_id',cur.id):await db.from('productos_negocio').update({categoria_id:null}).eq('categoria_id',c.id).eq('negocio_id',cur.id);if(u.error)throw u.error;
        const {error}=await db.from('categorias_negocio').delete().eq('id',c.id).eq('negocio_id',cur.id);if(error)throw error;nxMore.delete(String(c.id));msg('Categoría eliminada.')}
      else return;
      await pintar();
    }catch(e){msg('No se pudo completar: '+(e.message||e),true)}
  }

  /* ---------- eventos ---------- */
  $('cnxNegocio').addEventListener('change',e=>{tab='perfil';nxQ='';nxCatOpen=false;elegir(e.target.value)});
  $('cnxPane').addEventListener('change',async e=>{
    const t=e.target;
    if(t&&t.id==='cnxYapeF'&&t.files&&t.files[0]){const f=t.files[0];t.value='';if(!/^image\/(jpeg|png|webp)$/i.test(f.type)||f.size>5*1024*1024){msg('La imagen debe ser JPG, PNG o WEBP y pesar máximo 5 MB.',true);return}
      const th=t.closest('.cnxLogoRow').querySelector('.cnxLogoTh');th.innerHTML='<img src="'+URL.createObjectURL(f)+'" alt="">';
      try{const ex=f.type==='image/png'?'png':f.type==='image/webp'?'webp':'jpg';const path='yape/'+cur.id+'/qr-'+Date.now()+'.'+ex;const st=db.storage.from('restaurantes');const up=await st.upload(path,f,{upsert:true,contentType:f.type,cacheControl:'31536000'});if(up.error)throw up.error;
        const old=cur.yape_qr_url;await guardarNegocio({yape_qr_url:st.getPublicUrl(path).data.publicUrl},'QR de Yape guardado.');
        if(old){const mk='/storage/v1/object/public/restaurantes/',i=old.indexOf(mk);if(i>=0)st.remove([decodeURIComponent(old.slice(i+mk.length).split('?')[0])]).catch(()=>{})}pintar()}
      catch(err){msg('No se pudo subir el QR: '+(err.message||err),true);pintar()}return}
    if(!t||!/^cnx(Logo|Port)F$/.test(t.id)||!t.files||!t.files[0])return;
    const k=t.id==='cnxLogoF'?'logo':'portada',col=k==='logo'?pick(cur,LOGO):pick(cur,PORT);if(!col)return;
    const f=t.files[0];if(!/^image\/(jpeg|png|webp)$/i.test(f.type)||f.size>5*1024*1024){msg('La imagen debe ser JPG, PNG o WEBP y pesar máximo 5 MB.',true);t.value='';return}
    const th=t.closest('.cnxLogoRow').querySelector('.cnxLogoTh');th.innerHTML='<img src="'+URL.createObjectURL(f)+'" alt="">';th.classList.add('sub');
    try{const url=await subirImgNegocio(f,k);await guardarNegocio({[col]:url},(k==='logo'?'Logo':'Portada')+' actualizado.');pintar()}
    catch(err){msg('No se pudo subir la imagen: '+(err.message||err),true);pintar()}
  });
  $('cnxTabs').addEventListener('click',e=>{const b=e.target.closest('button[data-t]');if(!b||!cur)return;tab=b.dataset.t;edit=null;dsOpen=false;msg('');pintar()});
  $('cnxPane').addEventListener('change',e=>{if(e.target&&e.target.id==='cnxDsOn')dsToggle(e.target)});
  $('cnxPane').addEventListener('input',e=>{if(e.target&&e.target.id==='nxQ'){nxQ=e.target.value.trim();const l=$('nxList');if(l)l.innerHTML=nxListHTML()}});
  $('cnxPane').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&e.target.id==='cnxCatN'){e.preventDefault();nxCatAction('c-save','')}});
  /* pestañas iguales al panel Negocio */
  (function(){const t=$('cnxTabs');if(t&&!t.querySelector('[data-t="perfil"]'))t.innerHTML='<button type="button" data-t="perfil" class="on">Mi perfil</button><button type="button" data-t="productos">Productos</button><button type="button" data-t="acceso">Acceso</button>';const em=$('cnxEmpty');if(em)em.textContent='Elige un negocio para ver y editar lo mismo que el negocio ve en su panel: Mi perfil y Productos.'})();
  $('cnxPane').addEventListener('click',e=>{
    const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,id=(b.closest('[data-id]')||{dataset:{}}).dataset.id;
    if(a==='perf-save')return savePerfil(b);
    if(a==='nx-pub'){const on=!b.classList.contains('on');b.classList.toggle('on',on);b.setAttribute('aria-checked',String(on));const t=$('cnxPubTx');if(t)t.textContent=on?'Los clientes ven la dirección en la tienda.':'Privada: solo se usa para el delivery. En la tienda sale «Solo delivery».';return}
    if(a==='nx-pz'){const m=Number(b.dataset.v)||0;(async()=>{const base=cur.pausado_hasta&&new Date(cur.pausado_hasta).getTime()>Date.now()?new Date(cur.pausado_hasta).getTime():Date.now();const hasta=m?new Date(base+m*60000).toISOString():null;try{await guardarNegocio({pausado_hasta:hasta},m?'Pedidos en pausa.':'El negocio ya recibe pedidos.');pintar()}catch(e){msg('No se pudo guardar: '+(e.message||e),true)}})();return}
    if(a==='nx-t'){b.parentElement.dataset.tocado='1';b.parentElement.querySelectorAll('button').forEach(q=>{const on=q===b;q.classList.toggle('on',on);q.setAttribute('aria-checked',String(on))});return}
    if(a==='nx-day'){const r=b.closest('.nxHr');const on=!r.classList.contains('on');r.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));return}
    if(a==='nx-hcopy'){const rows=[...document.querySelectorAll('#nxHor .nxHr')];const f=rows.find(r=>r.classList.contains('on'));if(!f){msg('Primero abre al menos un día.',true);return}const A=f.querySelector('.ha').value,C=f.querySelector('.hc').value;rows.forEach(r=>{if(r.classList.contains('on')){r.querySelector('.ha').value=A;r.querySelector('.hc').value=C}});return}
    if(a==='nx-hall'){document.querySelectorAll('#nxHor .nxHr').forEach(r=>{r.classList.add('on');r.querySelector('.nxDay').setAttribute('aria-pressed','true')});return}
    if(a==='nx-copy'){const u=$('nxUrl');if(u){try{navigator.clipboard.writeText(u.value).then(()=>{if(window.pdInfo)pdInfo('Enlace copiado.')},()=>{u.select();document.execCommand('copy')})}catch(e){u.select();try{document.execCommand('copy')}catch(_){}}}return}
    if(a==='nx-wa'){const u=$('nxUrl');if(u)window.open('https://wa.me/?text='+encodeURIComponent('Pide en '+(cur.nombre||'nuestro negocio')+' por Pidemás Delivery: '+u.value),'_blank','noopener');return}
    if(a==='c-new'){nxCatOpen=!nxCatOpen;const pn=$('nxCatPanel');if(pn){pn.hidden=!nxCatOpen;if(nxCatOpen){const dp=$('cnxDsPanel');if(dp){dp.hidden=true;dsOpen=false}setTimeout(()=>{try{pn.scrollIntoView({behavior:'smooth',block:'center'});$('cnxCatN').focus({preventScroll:true})}catch(e){}},40)}}return}
    if(a==='c-close'){nxCatOpen=false;const pn=$('nxCatPanel');if(pn)pn.hidden=true;return}
    if(a==='c-tog'||a==='c-more'||a==='c-add'||a.startsWith('c-')){const cid=(b.closest('[data-cat]')||{dataset:{}}).dataset.cat||'';
      if(a==='c-tog'){if(nxQ)return;nxOpen.has(cid)?nxOpen.delete(cid):nxOpen.add(cid);$('nxList').innerHTML=nxListHTML();return}
      if(a==='c-more'){nxMore.has(cid)?nxMore.delete(cid):nxMore.add(cid);$('nxList').innerHTML=nxListHTML();return}
      if(a==='c-add'){edit={prod:cid&&cid!=='_none'?{categoria_id:cid}:null};return pintar()}
      return nxCatAction(a,cid)}
    if(a==='datos-save')return saveDatos();
    if(a==='ubic-save')return saveUbic();
    if(a==='gmaps-open'){const la=$('cnxLat').value.trim(),ln=$('cnxLng').value.trim(),u=($('cnxGm')&&$('cnxGm').value.trim())||(la&&ln?'https://www.google.com/maps?q='+encodeURIComponent(la+','+ln):'');if(u)window.open(u,'_blank','noopener');else msg('Aún no hay ubicación para abrir.',true);return}
    if(a==='hor-save')return saveHor();
    if(a==='hor-copy'){const rows=[...document.querySelectorAll('#cnxPane .cnxDia')];const f=rows.find(r=>r.querySelector('.ha-on').checked);if(!f){msg('Activa primero un día.',true);return}const A=f.querySelector('.ha').value,C=f.querySelector('.hc').value;rows.forEach(r=>{r.querySelector('.ha-on').checked=true;r.querySelector('.ha').value=A;r.querySelector('.hc').value=C;r.dispatchEvent(new Event('change'))});msg('Horario copiado. Toca «Guardar horario».');return}
    if(a==='pw-eye'){const i=b.parentElement.querySelector('input');i.type=i.type==='password'?'text':'password';b.textContent=i.type==='password'?'Ver':'Ocultar';return}
    if(a==='pw-save')return savePw(b.closest('.cnxAcc'));
    if(a==='img-del'&&b.dataset.k==='Yape'){(async()=>{if(window.pdConfirmar&&!(await pdConfirmar('¿Quitar el QR de Yape del negocio?')))return;try{await guardarNegocio({yape_qr_url:null},'QR de Yape quitado.');pintar()}catch(e){msg('No se pudo quitar: '+(e.message||e),true)}})();return}
    if(a==='img-del'){const k=b.dataset.k,col=k==='Logo'?pick(cur,LOGO):pick(cur,PORT);if(!col)return;(async()=>{if(window.pdConfirmar&&!(await pdConfirmar('¿Quitar '+(k==='Logo'?'el logo':'la portada')+' del negocio?')))return;try{await guardarNegocio({[col]:null},(k==='Logo'?'Logo':'Portada')+' quitado.');pintar()}catch(e){msg('No se pudo quitar: '+(e.message||e),true)}})();return}
    if(a.startsWith('cat-'))return catAction(a,id);
    if(a==='p-new'){edit={prod:null};const pn=$('nxCatPanel');if(pn)nxCatOpen=false;return pintar()}
    if(a==='p-back'){edit=null;return pintar()}
    if(a==='ds-open'){dsOpen=!dsOpen;const pn=$('cnxDsPanel');if(pn){pn.hidden=!dsOpen;if(dsOpen)setTimeout(()=>{try{pn.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){}},60)}return}
    if(a==='ds-close'){dsOpen=false;const pn=$('cnxDsPanel');if(pn)pn.hidden=true;return}
    if(a==='ds-save')return dsSave(b);
    if(a==='dx-add'){const l=$('cnxDxList');if(l){l.insertAdjacentHTML('beforeend',dxRow({}));const i=l.lastElementChild&&l.lastElementChild.querySelector('.dxN');i&&i.focus()}return}
    if(a==='dx-del'){const r=b.closest('.cnxDxRow');if(r)r.remove();return}
    if(a==='dsx'){if(!edit||!edit.ds)return;const id=b.dataset.x;const L=edit.ds.ex||(edit.ds.ex=[]);const i=L.indexOf(id);if(b.dataset.v==='1'){if(i<0)L.push(id)}else if(i>=0)L.splice(i,1);b.parentElement.querySelectorAll('button').forEach(q=>q.setAttribute('aria-pressed',String((q.dataset.v==='1')===L.includes(id))));return}
    if(a==='dsp'){if(b.disabled||!edit||!edit.ds)return;const t=b.dataset.dt;edit.ds[t]=b.dataset.dk;b.parentElement.querySelectorAll('button').forEach(q=>q.setAttribute('aria-pressed',String(q.dataset.dk===edit.ds[t])));return}
    if(a==='p-save')return saveProd();
    if(a==='feat-add'){$('cnxFeat').insertAdjacentHTML('beforeend',featRow('',''));return}
    if(a==='feat-del'){b.closest('.cnxFeat').remove();return}
    if(a.startsWith('p-'))return prodAction(a,id);
  });
})();
}catch(e){console.error("[pidemas-config-negocios-js]",e)}

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

