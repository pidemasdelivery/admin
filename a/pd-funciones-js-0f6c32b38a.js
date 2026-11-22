
/* ===== antes funciones.js ===== */
/* Pidemás · Administrador · funciones.js
   Funciones principales del panel: sesión, carga de datos, ventanas, navegación y utilidades comunes. */

/* ===== principal ===== */
const $ = id => document.getElementById(id);
function msg(el,text){el.textContent=text;el.classList.remove("hidden")}
function clearMsg(el){el.textContent="";el.classList.add("hidden")}
let adminSessionLoadInProgress = false;
let adminSessionLoadedUser = null;
async function restoreAdminSession(session){
if(!session?.user?.id) return;
if(adminSessionLoadedUser === session.user.id || adminSessionLoadInProgress) return;
adminSessionLoadInProgress = true;
try {
await loadAdmin(session.user.id);
if(!$("loginView").classList.contains("hidden")) adminSessionLoadedUser = null;
else adminSessionLoadedUser = session.user.id;
} finally {
adminSessionLoadInProgress = false;
}
}
async function checkAdmin(){
const {data:{session}, error} = await db.auth.getSession();
if(error) throw error;
if(session) await restoreAdminSession(session);
}
db.auth.onAuthStateChange((event, session) => {
if(event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED"){
setTimeout(() => restoreAdminSession(session).catch(error => {
console.error("No se pudo restaurar la sesión:", error);
}), 0);
}
});
async function loadAdmin(uid){
const {data,error}=await db.from("perfiles").select("rol,activo").eq("id",uid).maybeSingle();
if(error || !data || data.rol!=="administrador" || data.activo!==true){
await db.auth.signOut({scope:'local'}); msg($("loginMsg"),"Esta cuenta no tiene acceso de administrador."); return;
}
$("loginView").classList.add("hidden"); $("appView").classList.remove("hidden"); $("adminBottomNav")?.classList.remove("hidden"); $("logout").classList.remove("hidden");
try{window.pdPedidosCache&&window.pdPedidosCache.pintar(uid)}catch(e){}
loadOrders();
}
function setupLoginOptions(){
const key="pidemas_admin_remember_email";
try {
const saved=window.localStorage.getItem(key);
if(saved){$("email").value=saved;$("rememberMe").checked=true;}
} catch(storageError) { console.warn("No se pudo leer el correo recordado:",storageError); }
$("togglePassword").addEventListener("click",()=>{
const input=$("password");
const show=input.type==="password";
input.type=show?"text":"password";
$("togglePassword").textContent=show?"◉":"◌";
$("togglePassword").setAttribute("aria-label",show?"Ocultar contraseña":"Mostrar contraseña");
});
}
$("loginBtn").addEventListener("click",async(event)=>{
event.preventDefault();
const btn=$("loginBtn");
clearMsg($("loginMsg"));
btn.disabled=true;
btn.textContent="Ingresando...";
try{
const {data,error}=await db.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
if(error) throw error;
if(!data?.user?.id) throw new Error("No se pudo iniciar la sesión.");
try {
if($("rememberMe").checked) window.localStorage.setItem("pidemas_admin_remember_email",$("email").value.trim());
else window.localStorage.removeItem("pidemas_admin_remember_email");
} catch(storageError) { console.warn("No se pudo guardar el correo recordado:",storageError); }
await loadAdmin(data.user.id);
}catch(e){
console.error("Error de ingreso:",e);
const detalle=String(e?.message||"").trim();
msg($("loginMsg"),detalle ? "Error de acceso: "+detalle : "No se pudo iniciar sesión. Verifica la conexión con Supabase y las credenciales.");
}finally{
btn.disabled=false;
btn.textContent="Ingresar";
}
});
$("email").addEventListener("keydown",(event)=>{
if(event.key==="Enter"){
event.preventDefault();
$("password").focus();
}
});
$("password").addEventListener("keydown",(event)=>{
if(event.key==="Enter"){
event.preventDefault();
if(!$("loginBtn").disabled) $("loginBtn").click();
}
});
setupLoginOptions();
$("logout").onclick=async()=>{await db.auth.signOut({scope:'local'});location.reload()};
checkAdmin().catch(e=>{
console.error("Error al comprobar la sesión:",e);
msg($("loginMsg"),"No se pudo comprobar la sesión. Verifica tu conexión e intenta ingresar nuevamente.");
});
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
/* Marcas __PIDEMAS_X__{json}: lectura y limpieza con llaves anidadas (descartables) */
window.pdLeerMarca=function(t,nombre){var s=String(t||''),k='__PIDEMAS_'+nombre+'__',i=s.indexOf(k);if(i<0)return null;var j=i+k.length;while(s[j]===' ')j++;if(s[j]!=='{')return null;var p=0,ins=false,es=false,e=j;for(;e<s.length;e++){var c=s[e];if(ins){if(es)es=false;else if(c==='\\')es=true;else if(c==='"')ins=false}else if(c==='"')ins=true;else if(c==='{')p++;else if(c==='}'){p--;if(!p){e++;break}}}try{return JSON.parse(s.slice(j,e))}catch(x){return null}};
window.pdQuitarMarcas=function(t){var s=String(t||''),re=/__PIDEMAS_[A-Z_]+__\s*/g,m,out='',last=0;while((m=re.exec(s))){var j=re.lastIndex;if(s[j]!=='{')continue;var p=0,ins=false,es=false,e=j;for(;e<s.length;e++){var c=s[e];if(ins){if(es)es=false;else if(c==='\\')es=true;else if(c==='"')ins=false}else if(c==='"')ins=true;else if(c==='{')p++;else if(c==='}'){p--;if(!p){e++;break}}}out+=s.slice(last,m.index);last=e;re.lastIndex=e}return out+s.slice(last)};
function orderStatusLabel(s){return ({pendiente:"Pedido recibido",confirmado:"Pedido recibido",asignado:"Motorizado asignado",aceptado:"Pedido aceptado",pedido_aceptado:"Pedido aceptado",en_camino:"En camino",camino_recojo:"En camino",pedido_recibido:"Pedido recibido",en_entrega:"En entrega",camino_entrega:"En entrega",confirmando_pago:"Confirmando pago",entregado:"Entregado",cancelado:"Cancelado"})[s]||s||"-"}
var allOrders=[];
const selectedOrders=new Set();
var adminRestaurantsById = window.adminRestaurantsById || new Map();
window.adminRestaurantsById = adminRestaurantsById;
const adminDeliveryDistanceCache=new Map();
var allMotos=[];
function extraerCoordsCliente(texto){
const t=String(texto||"").trim();
const patterns=[
/[?&](?:destination|query|q)=(-?\d+(?:\.\d+)?)[,%20]+(-?\d+(?:\.\d+)?)/i,
/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
/(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/
];
for(const p of patterns){
const m=t.match(p);
if(m)return {lat:Number(m[1]),lng:Number(m[2])};
}
return null;
}
let __pdCargaPedidos=null;
async function loadOrders(){if(__pdCargaPedidos)return __pdCargaPedidos;__pdCargaPedidos=loadOrdersReal().finally(()=>{__pdCargaPedidos=null});return __pdCargaPedidos}
async function loadOrdersReal(){
clearMsg($("ordersMsg"));
try{
const pNeg=Promise.resolve(db.from("negocios").select("*"));
const pMot=Promise.resolve(db.from("motorizados").select("id,nombre_completo,telefono,usuario_id,disponible,activo,ultima_ubicacion,en_descanso,en_descanso_desde").order("nombre_completo"));
let ordersRes=await db.from("pedidos").select("*").order("creado_en",{ascending:false});
if(ordersRes.error){
console.warn("Pedidos: fallo ordenado por creado_en, reintentando sin ordenar:",ordersRes.error);
ordersRes=await db.from("pedidos").select("*");
}
if(ordersRes.error) throw ordersRes.error;
/* si llega vacío, puede ser la sesión vencida (Supabase devuelve 0 filas sin error): se renueva y se reintenta una vez */
if(Array.isArray(ordersRes.data)&&!ordersRes.data.length){
try{
const ses=await db.auth.getSession();
if(!ses?.data?.session){console.warn("Pedidos vacíos y sin sesión activa.");}
const rf=await db.auth.refreshSession();
if(!rf?.error){const again=await db.from("pedidos").select("*").order("creado_en",{ascending:false});if(!again.error&&Array.isArray(again.data))ordersRes=again;}
else console.warn("No se pudo renovar la sesión:",rf.error);
}catch(e){console.warn("Reintento de pedidos:",e)}
}
const orders=Array.isArray(ordersRes.data)?ordersRes.data:[];
const ids=orders.map(o=>o.id).filter(Boolean);
const restRes=await pNeg;
if(!restRes.error) adminRestaurantsById=new Map((restRes.data||[]).map(r=>[String(r.id),r]));
window.adminRestaurantsById=adminRestaurantsById;
let details=[];
if(ids.length){
const d=await db.from("detalle_pedidos").select("*").in("pedido_id",ids);
if(!d.error){
details=Array.isArray(d.data)?d.data:[];
}else{
console.warn("Consulta masiva de detalle_pedidos falló. Reintentando por pedido:",d.error);
const recovered=[];
for(const pedidoId of ids){
try{
const one=await db.from("detalle_pedidos").select("*").eq("pedido_id",pedidoId);
if(!one.error && Array.isArray(one.data) && one.data.length){
recovered.push(...one.data);
}else if(one.error){
console.warn("No se pudo cargar detalle del pedido",pedidoId,one.error);
}
}catch(e){
console.warn("Error cargando detalle individual",pedidoId,e);
}
}
details=recovered;
}
}
let motosRes=await pMot;
if(motosRes.error){
console.warn("No se pudieron cargar motorizados con todas las columnas:",motosRes.error);
motosRes=await db.from("motorizados").select("id,nombre_completo,telefono,usuario_id,disponible,activo,ultima_ubicacion").order("nombre_completo");
}
if(motosRes.error){
console.error("No se pudieron cargar motorizados:",motosRes.error);
motosRes={data:[]};
}
const motoMap=new Map((motosRes.data||[]).map(m=>[String(m.id),m]));
const detailMap=new Map();
details.forEach(d=>{
const key=String(d.pedido_id ?? d.pedidoId ?? "");
if(!key)return;
if(!detailMap.has(key)) detailMap.set(key,[]);
detailMap.get(key).push(d);
});
allOrders=orders.map(o=>({
...o,
detalle_pedidos:detailMap.get(String(o.id))||[],
motorizados:o.motorizado_id?motoMap.get(String(o.motorizado_id))||null:null
}));
allOrders.sort((a,b)=>{
const da=new Date(a.creado_en||a.created_at||0).getTime();
const dbb=new Date(b.creado_en||b.created_at||0).getTime();
return dbb-da;
});
const rawMotos=Array.isArray(motosRes.data)?motosRes.data:[];
allMotos=rawMotos.filter(m=>{
const activo=String(m?.activo??"").toLowerCase();
const estado=String(m?.estado??"").toLowerCase();
return activo!=="false" && estado!=="inactivo";
});
if(!allMotos.length && rawMotos.length) allMotos=rawMotos;
renderOrders();
try{window.pdPedidosCache&&window.pdPedidosCache.guardar()}catch(e){}
if(typeof window.updatePidemasAdminDashboard==="function") window.updatePidemasAdminDashboard();
}catch(error){
console.error("Error cargando pedidos de Tienda en Admin:",error);
msg($("ordersMsg"),"No se pudieron cargar los pedidos: "+(error?.message||"error de conexión o permisos."));
if(typeof window.updatePidemasAdminDashboard==="function") window.updatePidemasAdminDashboard();
}
}
/* Inicio sin saltos: solo se repinta la lista si los datos o filtros cambiaron de verdad; al repintar se conserva scroll y altura */
let __pdRoSig="",__pdRoF="",__pdRoQ="";
let __pdRoPend=false,__pdRoOrd=new Map();
const __pdRoRep=(k,v)=>(k==="ultima_ubicacion"||k==="ultima_ubicacion_en")?undefined:v;
setInterval(()=>{if(!__pdRoPend)return;const l=$("orderList");if(!l||l.querySelector(".adminOrderCard.is-expanded")||l.querySelector(".adminOrderInlineTracking"))return;__pdRoPend=false;renderOrders()},700);
function renderOrders(){}
function updateOrderBulkBar(){
const bar=$("orderBulkBar");if(!bar)return;
const boxes=[...$("orderList").querySelectorAll(".pdSelChk input")];
bar.hidden=!boxes.length;
const n=selectedOrders.size;
const all=$("orderSelectAll");
if(all){all.checked=boxes.length>0&&boxes.every(b=>b.checked);all.indeterminate=n>0&&!all.checked}
const cnt=$("orderBulkCount");if(cnt)cnt.textContent=n===0?"Ningún pedido seleccionado":(n===1?"1 seleccionado":n+" seleccionados");
const btn=$("orderBulkDelete");if(btn){btn.disabled=n===0;btn.textContent=n>0?`Eliminar (${n})`:"Eliminar"}
}
async function deleteSelectedOrders(){
const pedidos=[...selectedOrders].map(id=>allOrders.find(o=>String(o.id)===String(id))).filter(Boolean);
if(!pedidos.length)return;
const n=pedidos.length;
const texto=n===1?`el pedido #${String(pedidos[0].id).slice(0,8).toUpperCase()}`:`los ${n} pedidos seleccionados`;
if(!(await pdConfirmar(`¿Eliminar definitivamente ${texto}?\n\nLos motorizados dejarán de verlos y recibirán una notificación.`)))return;
clearMsg($("ordersMsg"));
const btn=$("orderBulkDelete");if(btn)btn.disabled=true;
let ok=0;const fallidos=[];
for(const pedido of pedidos){
const code=String(pedido.id).slice(0,8).toUpperCase();
try{
await notifyMotoOrderChange(pedido,"Pedido eliminado por administración",`El pedido #${code} fue eliminado por administración.`,"pedido_eliminado");
const {error:detailError}=await db.from("detalle_pedidos").delete().eq("pedido_id",pedido.id);
if(detailError)throw detailError;
const {error}=await db.from("pedidos").delete().eq("id",pedido.id);
if(error)throw error;
ok++;selectedOrders.delete(String(pedido.id));
}catch(e){
console.error("Eliminar pedido:",e);
fallidos.push("#"+code);
}
}
await loadOrders();
msg($("ordersMsg"),fallidos.length?`Se eliminaron ${ok} de ${n} pedidos. No se pudo eliminar: ${fallidos.join(", ")}.`:(ok===1?"✓ Pedido eliminado correctamente.":`✓ ${ok} pedidos eliminados correctamente.`));
}
window.deleteSelectedOrders=deleteSelectedOrders;
async function notifyMotoOrderChange(pedido,titulo,mensaje,tipo="pedido_actualizado"){
try{
if(!pedido?.motorizado_id)return;
const moto=allMotos.find(m=>String(m.id)===String(pedido.motorizado_id));
if(!moto?.usuario_id)return;
const {error}=await db.from("notificaciones").insert({
usuario_id:moto.usuario_id,
pedido_id:tipo==="pedido_eliminado"?null:pedido.id,
tipo,
titulo,
mensaje,
leida:false
});
if(error)console.warn("No se pudo notificar al motorizado:",error);
}catch(e){console.warn("Notificación al motorizado:",e)}
}
async function editOrder(orderId){
const pedido=allOrders.find(o=>String(o.id)===String(orderId));
if(!pedido){msg($("ordersMsg"),"No se encontró el pedido.");return}
const nombre=(await pdPedir("Nombre:",String(pedido.nombre_cliente||"")));
if(nombre===null)return;
const telefono=(await pdPedir("Teléfono del cliente:",String(pedido.telefono_cliente||"")));
if(telefono===null)return;
const direccion=(await pdPedir("Dirección de entrega:",String(pedido.direccion_entrega||"")));
if(direccion===null)return;
const referencia=(await pdPedir("Referencia:",String(pedido.referencia_entrega||"")));
if(referencia===null)return;
const totalRaw=(await pdPedir("Total del pedido (S/):",Number(pedido.total||0).toFixed(2)));
if(totalRaw===null)return;
const total=Number(String(totalRaw).replace(',','.'));
if(!Number.isFinite(total)||total<0){msg($("ordersMsg"),"El total ingresado no es válido.");return}
const metodo=(await pdPedir("Método de pago (efectivo, yape):",String(pedido.metodo_pago||"")));
if(metodo===null)return;
const observaciones=(await pdPedir("Observaciones:",String(pedido.observaciones||"")));
if(observaciones===null)return;
const old={...pedido};
const patch={
nombre_cliente:nombre.trim(),
telefono_cliente:telefono.trim(),
direccion_entrega:direccion.trim(),
referencia_entrega:referencia.trim(),
total,
metodo_pago:metodo.trim().toLowerCase(),
observaciones:observaciones.trim()
};
clearMsg($("ordersMsg"));
const {data,error}=await db.from("pedidos").update(patch).eq("id",orderId).select("*").maybeSingle();
if(error||!data){msg($("ordersMsg"),"No se pudo editar el pedido: "+(error?.message||"sin datos"));return}
await notifyMotoOrderChange(old,"Pedido actualizado por administración",`El pedido #${String(orderId).slice(0,8).toUpperCase()} fue actualizado por administración.`);
msg($("ordersMsg"),"✓ Pedido actualizado. El motorizado verá los cambios automáticamente.");
await loadOrders();
}
window.editOrder=editOrder;
async function deleteOrder(orderId){
const pedido=allOrders.find(o=>String(o.id)===String(orderId));
if(!pedido){msg($("ordersMsg"),"No se encontró el pedido.");return}
const code=String(orderId).slice(0,8).toUpperCase();
if(!(await pdConfirmar(`¿Eliminar definitivamente el pedido #${code}?\n\nEl motorizado dejará de verlo y recibirá una notificación.`)))return;
clearMsg($("ordersMsg"));
await notifyMotoOrderChange(pedido,"Pedido eliminado por administración",`El pedido #${code} fue eliminado por administración.`,"pedido_eliminado");
try{
const {error:detailError}=await db.from("detalle_pedidos").delete().eq("pedido_id",orderId);
if(detailError)throw detailError;
const {error}=await db.from("pedidos").delete().eq("id",orderId);
if(error)throw error;
msg($("ordersMsg"),"✓ Pedido eliminado correctamente.");
await loadOrders();
}catch(e){
console.error("Eliminar pedido:",e);
msg($("ordersMsg"),"No se pudo eliminar el pedido: "+(e?.message||e));
}
}
window.deleteOrder=deleteOrder;
function toggleYapeProof(id){
const box=document.getElementById(`yapeProof-${id}`);
if(!box) return;
const btn=box.previousElementSibling;
const hidden=box.style.display==="none";
box.style.display=hidden?"block":"none";
if(btn) btn.textContent=hidden?"Ocultar captura":"Mostrar captura";
}
window.toggleYapeProof=toggleYapeProof;
async function confirmAdminYapePayment(id){
const pedido=allOrders.find(o=>String(o.id)===String(id));
if(!pedido){msg($("ordersMsg"),"No se encontró el pedido.");return;}
if(String(pedido.metodo_pago||"").toLowerCase()!=="yape"){msg($("ordersMsg"),"Este pedido no es Yape.");return;}
if(!pedido.comprobante_pago_url){
try{
const {error}=await db.from("pedidos").update({estado:"confirmado",pago_confirmado:false}).eq("id",id);
if(error)throw error;
msg($("ordersMsg"),"✓ Pedido aceptado. El cliente pagará con Yape al recibir (QR del motorizado).");
await loadOrders();
}catch(e){msg($("ordersMsg"),"No se pudo aceptar el pedido: "+(e?.message||e));}
return;
}
const buttons=[...document.querySelectorAll('.approveOrderBtn')];
buttons.forEach(b=>{b.disabled=true;b.dataset.confirmando='1';});
msg($("ordersMsg"),"Confirmando pago Yape…");
try{
const {error}=await db.from("pedidos")
.update({estado:"confirmado",pago_confirmado:true})
.eq("id",id);
if(error)throw error;
try{
const moto=allMotos.find(m=>String(m.id)===String(pedido.motorizado_id));
if(moto?.usuario_id){
await db.from("notificaciones").insert({
usuario_id:moto.usuario_id,pedido_id:id,tipo:"pago_confirmado",
titulo:"Pago Yape confirmado",
mensaje:`El pago Yape del pedido #${String(id).slice(0,8).toUpperCase()} fue confirmado por administración.`,
leida:false
});
}
}catch(notifError){console.warn("Notificación Yape:",notifError);}
msg($("ordersMsg"),"✓ Pago Yape confirmado correctamente.");
await loadOrders();
}catch(e){
console.error("Confirmación Yape:",e);
msg($("ordersMsg"),"No se pudo confirmar el pago Yape: "+(e?.message||e));
pdAviso("No se pudo confirmar el pago Yape:\n\n"+(e?.message||e));
buttons.forEach(b=>{b.disabled=false;delete b.dataset.confirmando;});
}
}
async function notifyClientByOrder(pedido,tipo,titulo,mensaje){
try{
let clienteId=pedido?.cliente_id||null;
let c=null;
if(clienteId){
const r=await db.from("clientes").select("id,usuario_id").eq("id",clienteId).maybeSingle();
if(!r.error)c=r.data||null;
}
if(!c && pedido?.telefono_cliente){
const phone=String(pedido.telefono_cliente).trim();
const r=await db.from("clientes").select("id,usuario_id").eq("telefono",phone).limit(1).maybeSingle();
if(!r.error && r.data){c=r.data;clienteId=r.data.id;}
}
if(c?.usuario_id){
await db.from("notificaciones").insert({usuario_id:c.usuario_id,pedido_id:pedido.id,tipo,titulo,mensaje,leida:false});
}
}catch(e){console.warn("Notificación cliente:",e)}
}
async function acceptCashOrder(orderId){
const pedido=allOrders.find(o=>String(o.id)===String(orderId));
if(!pedido){msg($("ordersMsg"),"No se encontró el pedido.");return}
if(String(pedido.metodo_pago||"").trim().toLowerCase()!=="efectivo"){
return approveOrder(orderId);
}
const button=document.querySelector(`.approveOrderBtn[data-order-id="${CSS.escape(String(orderId))}"]`);
if(button){button.disabled=true;button.dataset.confirmando="1";}
clearMsg($("ordersMsg"));
msg($("ordersMsg"),"Aceptando pedido en efectivo…");
try{
const {error}=await db.from("pedidos")
.update({estado:"confirmado",pago_confirmado:false})
.eq("id",orderId);
if(error) throw error;
await notifyClientByOrder(pedido,"pedido_aceptado","Pedido aceptado",`Tu pedido #${String(orderId).slice(0,8).toUpperCase()} fue aceptado por administración.`);
msg($("ordersMsg"),"✓ Pedido en efectivo aceptado correctamente.");
await loadOrders();
}catch(e){
console.error("Aceptar pedido efectivo:",e);
msg($("ordersMsg"),"No se pudo aceptar el pedido: "+(e?.message||e));
if(button){button.disabled=false;delete button.dataset.confirmando;}
}
}
async function approveOrder(orderId){
const pedido=allOrders.find(o=>String(o.id)===String(orderId));
if(!pedido){msg($("ordersMsg"),"No se encontró el pedido.");return}
const method=String(pedido.metodo_pago||"").trim().toLowerCase();
if(method==="yape"){
await confirmAdminYapePayment(orderId);
return;
}
if(method==="efectivo"){
await acceptCashOrder(orderId);
return;
}
clearMsg($("ordersMsg"));
try{
const {error}=await db.from("pedidos").update({estado:"confirmado"}).eq("id",orderId);
if(error) throw error;
}catch(e){
console.error("Aceptar pedido:",e);
msg($("ordersMsg"),"No se pudo aceptar: "+(e?.message||e));
return;
}
await notifyClientByOrder(pedido,"pedido_aceptado","Pedido aceptado",`Tu pedido #${String(orderId).slice(0,8).toUpperCase()} fue aceptado por administración.`);
msg($("ordersMsg"),"Pedido aceptado. La Tienda recibirá la actualización.");
await loadOrders();
}
async function assignOrder(orderId,motoId){
clearMsg($("ordersMsg"));
let whatsappTab=null;
const current=allOrders.find(o=>String(o.id)===String(orderId));
if(motoId&&current){
const st=String(current.estado||"").toLowerCase();
const method=String(current.metodo_pago||"").toLowerCase();
const yapeConfirmado=method==="yape" && current.pago_confirmado===true;
const estadoPermiteAsignar=["confirmado","aceptado","asignado"].includes(st);
if(!estadoPermiteAsignar && !yapeConfirmado){
msg($("ordersMsg"),"Primero acepta el pedido. En Yape debes confirmar el pago antes de asignarlo.");
return;
}
}
if(!orderId){
msg($("ordersMsg"),"No se encontró el pedido.");
return;
}
if(!motoId && current){
const st=String(current.estado||"").toLowerCase();
const motoAccepted=["aceptado","pedido_aceptado","en_camino","camino_recojo","en_entrega","camino_entrega","confirmando_pago","entregado"].includes(st);
if(motoAccepted){
msg($("ordersMsg"),"El motorizado ya aceptó el pedido. No se puede quitar la asignación.");
await loadOrders();
return;
}
}
if(motoId){
const moto=allMotos.find(m=>m.id===motoId);
if(!moto){
msg($("ordersMsg"),"No se encontró el motorizado seleccionado.");
return;
}
const patch={
motorizado_id:motoId,
estado:"asignado",
asignado_en:new Date().toISOString()
};
whatsappTab=window.open("about:blank","_blank");
const {data,error}=await db
.from("pedidos")
.update(patch)
.eq("id",orderId)
.select("id,estado,motorizado_id,asignado_en")
.single();
if(error){
if(whatsappTab)whatsappTab.close();
console.error("Error al asignar pedido:",error);
msg($("ordersMsg"),"No se pudo asignar: "+(error.message||"error de permisos o datos."));
return;
}
const motoPhone=String(moto.telefono||"").replace(/\D/g,"");
const phoneForWhatsApp=motoPhone ? (motoPhone.startsWith("51")?motoPhone:(motoPhone.length===9?"51"+motoPhone:motoPhone)) : "";
const pedidoAsignado=allOrders.find(o=>String(o.id)===String(orderId))||current||{};
const orderCode=String(orderId).slice(0,8).toUpperCase();
const panelUrl="https://pidemas.pe/motorizado/";
const whatsappMessage=[
"*PIDEMÁS DELIVERY*",
"¡Hola, "+String(moto.nombre_completo||"motorizado").trim()+"!",
"Tienes un nuevo pedido asignado por Administración.",
"Pedido: #"+orderCode,
"Por favor, ingresa al panel, revisa los detalles y confirma la asignación.",
"Entra aquí: "+panelUrl,
"Gracias por trabajar con Pidemás."
].join("\n");
if(phoneForWhatsApp){
const waUrl="https://wa.me/"+phoneForWhatsApp+"?text="+encodeURIComponent(whatsappMessage);
if(whatsappTab)whatsappTab.location.href=waUrl;
else msg($("ordersMsg"),"Pedido asignado. El navegador bloqueó WhatsApp; abre el aviso desde el teléfono del motorizado.");
}else if(whatsappTab){
whatsappTab.close();
msg($("ordersMsg"),"Pedido asignado, pero el motorizado no tiene teléfono registrado. Agrega su número para avisarle por WhatsApp.");
}
if(moto.usuario_id){
const pedido=allOrders.find(o=>o.id===orderId);
const {error:notifError}=await db.from("notificaciones").insert({
usuario_id:moto.usuario_id,
pedido_id:orderId,
tipo:"pedido_asignado",
titulo:"Nuevo pedido asignado",
mensaje:`Tienes un nuevo pedido de ${pedido?.nombre_cliente||"un cliente"}.`,
leida:false
});
if(notifError) console.warn("Pedido asignado, pero no se pudo crear la notificación:",notifError);
}
;
if(phoneForWhatsApp){
msg($("ordersMsg"),"Pedido asignado correctamente a "+moto.nombre_completo+". WhatsApp se abrió con el aviso preparado; pulsa Enviar.");
}else{
msg($("ordersMsg"),"Pedido asignado correctamente a "+moto.nombre_completo+", pero falta registrar su teléfono para avisarle por WhatsApp.");
}
await loadOrders();
return;
}
const {data,error}=await db
.from("pedidos")
.update({
motorizado_id:null,
estado:"confirmado",
asignado_en:null
})
.eq("id",orderId)
.select("id,estado,motorizado_id,asignado_en")
.single();
if(error){
console.error("Error al quitar asignación:",error);
msg($("ordersMsg"),"No se pudo quitar la asignación: "+(error.message||"error de permisos o datos."));
return;
}
;
msg($("ordersMsg"),"Asignación retirada correctamente.");
await loadOrders();
}
$("refreshOrders").onclick=loadOrders;
$("orderStatusFilter").onchange=renderOrders;
$("orderSelectAll")?.addEventListener("change",e=>{
const on=e.target.checked;
$("orderList").querySelectorAll(".adminOrderCard[data-order-id]").forEach(card=>{
const id=String(card.getAttribute("data-order-id"));
if(on)selectedOrders.add(id);else selectedOrders.delete(id);
const cb=card.querySelector(".pdSelChk input");if(cb)cb.checked=on;
});
updateOrderBulkBar();
});
$("orderBulkDelete")?.addEventListener("click",deleteSelectedOrders);
$("orderSearch").oninput=renderOrders;

function adminGpsValue(row, keys){
for(const k of keys){
if(row && row[k]!==undefined && row[k]!==null && row[k]!=="") return row[k];
}
return null;
}
function adminGpsPoint(row){
let lat=Number(adminGpsValue(row,["latitud","latitude","lat","latitud_actual"]));
let lng=Number(adminGpsValue(row,["longitud","longitude","lng","lon","longitud_actual"]));
if(!Number.isFinite(lat)||!Number.isFinite(lng)) return null;
const normalPiura =
lat>=-6.50 && lat<=-4.50 &&
lng>=-81.50 && lng<=-79.50;
if(normalPiura) return {lat,lng};
const swappedPiura =
lng>=-6.50 && lng<=-4.50 &&
lat>=-81.50 && lat<=-79.50;
if(swappedPiura) return {lat:lng,lng:lat};
return null;
}

document.querySelectorAll(".closeServiceAdmin").forEach(btn=>{
btn.onclick=()=>{
const id=btn.dataset.close;
$(id)?.classList.add("hidden");
};
});
(function startAdminOrdersRealtime(){
try{
if(window.pidemasAdminOrdersChannel){
db.removeChannel(window.pidemasAdminOrdersChannel);
}
window.pidemasAdminOrdersChannel=db.channel("admin-pedidos-pagos")
.on("postgres_changes",{event:"*",schema:"public",table:"pedidos"},async()=>{
const active=document.activeElement;
if(active && active.classList && active.classList.contains("motoSelect")) return;
if(typeof loadOrders==="function") await loadOrders();
})
.subscribe((status,err)=>console.log("Pidemás Admin Realtime pedidos:",status,err||""));
}catch(e){
console.warn("Realtime de pedidos no disponible:",e);
}
try{
if(window.pidemasAdminCashChannel){
db.removeChannel(window.pidemasAdminCashChannel);
window.pidemasAdminCashChannel=null;
}
}catch(e){ console.warn("No se pudo cerrar el canal automático de caja:",e); }
if(window.pidemasAdminCashRefreshTimer){
clearInterval(window.pidemasAdminCashRefreshTimer);
window.pidemasAdminCashRefreshTimer=null;
}
if(window.pidemasAdminOrdersTimer) clearInterval(window.pidemasAdminOrdersTimer);
window.pidemasAdminOrdersTimer=setInterval(()=>{
if(document.hidden) return;
if(typeof loadOrders!=="function") return;
if(document.querySelector(".adminOrderInlineTracking")) return;
if(document.querySelector("#orderList .adminOrderCard.is-expanded")) return;
const active=document.activeElement;
if(active && active.classList && active.classList.contains("motoSelect")) return;
loadOrders();
},3000);
window.addEventListener("focus",()=>{if(typeof loadOrders==="function"&&!document.querySelector(".adminOrderInlineTracking")&&!document.querySelector("#orderList .adminOrderCard.is-expanded"))loadOrders();});
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&typeof loadOrders==="function"&&!document.querySelector(".adminOrderInlineTracking")&&!document.querySelector("#orderList .adminOrderCard.is-expanded"))loadOrders();});
})();
(function initAdminTabs(){
const tabs = Array.from(document.querySelectorAll(".tabs .tab"));
const sections = ["restaurantes","menu","pedidos","clientes","agencias","caja","sueldo"];
function openTab(name){
if(name === "servicios") name = "restaurantes";
if(!sections.includes(name)) name = "restaurantes";
sections.forEach(section=>{
const el=document.getElementById("tab-"+section);
if(el) el.classList.toggle("hidden", section!==name);
});
tabs.forEach(btn=>{
btn.classList.toggle("active", btn.dataset.tab===name);
});
document.querySelectorAll("[data-admin-tab]").forEach(btn=>{
const btnName = btn.dataset.adminTab === "servicios" ? "restaurantes" : btn.dataset.adminTab;
btn.classList.toggle("active", btnName===name);
});
if(name==="pedidos" && typeof loadOrders==="function") loadOrders();
if(name==="clientes" && typeof loadClientes==="function") loadClientes();
if(name==="caja" && typeof loadAdminCash==="function") loadAdminCash();
if(name==="sueldo" && typeof window.pdLoadSalaryMotorizados==="function") window.pdLoadSalaryMotorizados();
if(name==="menu" && typeof loadRestaurants==="function") loadRestaurants();
window.scrollTo({top:0,behavior:"smooth"});
}
window.openAdminTab = openTab;
tabs.forEach(btn=>{
btn.type="button";
btn.addEventListener("click", function(e){
e.preventDefault();
e.stopPropagation();
openTab(this.dataset.tab);
});
});
document.querySelectorAll("[data-admin-tab]").forEach(btn=>{
btn.type="button";
btn.addEventListener("click", function(e){
e.preventDefault();
e.stopPropagation();
openTab(this.dataset.adminTab);
});
});
openTab("restaurantes");
})();;

/* ===== pidemas-admin-cloud-upload-js ===== */
function bindCloudUpload(fileId,nameId){
const input=$(fileId);
const box=document.querySelector(`[data-cloud-upload="${fileId}"]`);
const nameEl=$(nameId);
if(!input || !box || !nameEl) return;
input.addEventListener("change",()=>{
const file=input.files?.[0];
nameEl.textContent=file ? file.name : "PNG, JPG o WebP.";
});
["dragenter","dragover"].forEach(evt=>{
box.addEventListener(evt,e=>{
e.preventDefault();
e.stopPropagation();
box.classList.add("dragover");
});
});
["dragleave","drop"].forEach(evt=>{
box.addEventListener(evt,e=>{
e.preventDefault();
e.stopPropagation();
box.classList.remove("dragover");
});
});
box.addEventListener("drop",e=>{
const file=e.dataTransfer?.files?.[0];
if(!file) return;
try{
const dt=new DataTransfer();
dt.items.add(file);
input.files=dt.files;
nameEl.textContent=file.name;
}catch(err){
console.warn("No se pudo asignar el archivo arrastrado:",err);
}
});
}
bindCloudUpload("rPortadaFile","rPortadaFileName");
bindCloudUpload("rLogoFile","rLogoFileName");

/* ===== pidemas-final-integrity-fix ===== */
try{
(function(){
const $id=(id)=>document.getElementById(id);
const escFinal=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CAJA_CORTE_FINAL="2026-09-30T21:13:36Z";
function setTabFinal(name){
const sections=["restaurantes","menu","pedidos","clientes","servicios","agencias","caja"];
if(name==="servicios") name="restaurantes";
if(!sections.includes(name)) name="restaurantes";
sections.forEach(section=>{
const el=$id("tab-"+section);
if(el) {
el.classList.toggle("hidden",section!==name);
if(section==="restaurantes") el.style.removeProperty("display");
}
});
document.querySelectorAll(".tabs .tab").forEach(b=>{
const n=b.dataset.tab==="servicios"?"restaurantes":b.dataset.tab;
b.classList.toggle("active",n===name);
});
document.querySelectorAll("#adminBottomNav [data-admin-tab]").forEach(b=>{
const n=b.dataset.adminTab==="servicios"?"restaurantes":b.dataset.adminTab;
b.classList.toggle("active",n===name);
});
try{
if(name==="pedidos" && typeof window.loadOrders==='function') window.loadOrders();
if(name==="clientes" && typeof window.loadClientes==='function') window.loadClientes();
if(name==="caja" && typeof window.loadAdminCash==='function') window.loadAdminCash();
if(name==="menu" && typeof window.loadRestaurants==='function') window.loadRestaurants();
}catch(e){ console.error("Pidemás navegación:",e); }
window.scrollTo(0,0);
}
window.openAdminTab=setTabFinal;
document.addEventListener("click",function(e){
const navBtn=e.target?.closest?.("#adminBottomNav [data-admin-tab]");
if(navBtn){
e.preventDefault(); e.stopImmediatePropagation();
setTabFinal(navBtn.getAttribute("data-admin-tab"));
return;
}
const service=e.target?.closest?.(".serviceBtn");
if(service){
e.preventDefault(); e.stopImmediatePropagation();
const type=service.dataset.service;
if(typeof window.__pidemasOpenServiceModal==='function'){
window.__pidemasOpenServiceModal(type);
}else{
["gpsAdminBox"].forEach(id=>$id(id)?.classList.add("hidden"));
}
return;
}
const close=e.target?.closest?.(".closeServiceAdmin");
if(close){
e.preventDefault(); e.stopImmediatePropagation();
$id(close.dataset.close)?.classList.add("hidden");
return;
}
if(e.target?.closest?.("#closeCashDetail")){
e.preventDefault(); e.stopImmediatePropagation();
$id("cashDetail")?.classList.add("hidden");
}
},true);
function cycleMovs(movs){
if(window.PdCaja&&typeof window.PdCaja.cycleWithAmounts==='function')return window.PdCaja.cycleWithAmounts(movs);
const cut=new Date(CAJA_CORTE_FINAL).getTime();
const eligible=(Array.isArray(movs)?movs:[]).filter(x=>Number.isFinite(new Date(x.creado_en).getTime()) && new Date(x.creado_en).getTime()>cut);
const isBoundary=x=>x && x.tipo==='retiro' && /(?:LIQUIDACI[ÓO]N DE CAJA|REINICIO DE CAJA)/i.test(String(x.descripcion||''));
const boundaries=eligible.filter(isBoundary).sort((a,b)=>new Date(b.creado_en).getTime()-new Date(a.creado_en).getTime());
if(!boundaries.length)return eligible;
const last=new Date(boundaries[0].creado_en).getTime();
return eligible.filter(x=>{
const t=new Date(x.creado_en).getTime();
return (t>last || (t===last && !isBoundary(x))) && !isBoundary(x);
});
}
window.pidemasCycleMovsFinal=cycleMovs;

})();
}catch(e){console.error("[pidemas-final-integrity-fix]",e)}

/* ===== pdm-js ===== */
try{
(function(){
if(window.__pdmModal)return;window.__pdmModal=true;
const $=id=>document.getElementById(id);
const MAP={
gps:['gpsAdminBox','Motorizados / GPS'],
'suspender-motorizado':['suspenderMotorizadoAdminBox','Suspender / reactivar cuentas'],
descuentos:['descuentosAdminBox','Códigos de descuento'],'estado-negocios':['estadoNegociosAdminBox','Estado de negocios'],

pedidos:['tab-pedidos','Pedidos'],qryape:['pdQrCfg','QR Yape'],clientes:['tab-clientes','Clientes'],
caja:['tab-caja','Cajas'],sueldo:['tab-sueldo','Sueldos']
};
let box=null,ph=null,cur=null;
const RF={pedidos:'refreshOrders',clientes:'refreshClientes',caja:'pdcjRefresh',sueldo:'pdSalaryRefreshMotos',gps:'gxRef','suspender-motorizado':'spRef',};
let rfBtn=null,rfObs=null;
function hdr(key){
const head=document.querySelector('#pdmModal .m-head'),x=head&&head.querySelector('.m-x');if(!head||!x)return;
let g=head.querySelector('.m-acts');
if(!g){g=document.createElement('div');g.className='m-acts';head.appendChild(g);g.appendChild(x)}
if(!rfBtn){rfBtn=document.createElement('button');rfBtn.type='button';rfBtn.className='m-rf';rfBtn.setAttribute('aria-label','Actualizar');rfBtn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/></svg>';g.insertBefore(rfBtn,x);
rfBtn.addEventListener('click',()=>{const real=cur&&RF[cur]&&$(RF[cur]);if(!real){if(!cur)return;rfBtn.classList.add('spin');Promise.resolve(load(cur)).finally(()=>setTimeout(()=>rfBtn.classList.remove('spin'),400));return}rfBtn.classList.add('spin');try{real.click()}catch(e){}setTimeout(()=>{if(!real.classList.contains('spin'))rfBtn.classList.remove('spin')},900)})}
if(rfObs){rfObs.disconnect();rfObs=null}
const id=RF[key],real=id&&$(id);
rfBtn.hidden=false;rfBtn.classList.remove('spin');
if(real){real.classList.add('pdm-realrf');const p=real.parentElement;if(p&&p!==document.getElementById('pdmBody')&&p.children.length===1&&p.classList.contains('actions'))p.classList.add('pdm-realrf')}
if(real){rfObs=new MutationObserver(()=>{rfBtn.classList.toggle('spin',real.classList.contains('spin'))});rfObs.observe(real,{attributes:true,attributeFilter:['class']})}
}
const call=n=>{try{return typeof window[n]==='function'?window[n]():undefined}catch(e){console.warn('Modal:',n,e)}};
async function load(key){
try{
if(key==='pedidos'){const r=$('refreshOrders');if(r)r.click();return}
if(key==='clientes')return call('loadClientes');
if(key==='caja')return call('loadAdminCash');
if(key==='sueldo')return call('pdLoadSalaryMotorizados');
if(typeof window.__pidemasLoadToolData==='function')await window.__pidemasLoadToolData(key);
if(key==='gps')setTimeout(()=>window.dispatchEvent(new Event('resize')),150);
}catch(e){console.warn('Modal:',e)}
}
/* Pedidos vive en el Inicio del admin, debajo de la tarjeta de información: no se abre modal */
function inicioPedidos(){
close();
const t=$('tab-pedidos'),top=$('pdInicioTop');
if(t&&top&&t.parentNode!==top){const sal=top.querySelector(':scope > .pdSal');if(sal)sal.after(t);else top.appendChild(t)}
if(t)t.classList.remove('hidden');
try{const home=$('tab-restaurantes');if(home&&home.classList.contains('hidden')&&typeof window.openAdminTab==='function')window.openAdminTab('restaurantes')}catch(e){}
if(t)t.classList.remove('hidden');
const r=$('refreshOrders');if(r)r.click();
setTimeout(()=>{const L=$('orderList')||t;if(L)L.scrollIntoView({behavior:'smooth',block:'start'})},150);
}
async function open(key){
if(key==='pedidos'){inicioPedidos();return}
const m=MAP[key];if(!m)return;
const b=$(m[0]);if(!b)return;
close();
ph=document.createComment('pdm-return-'+m[0]);
b.parentNode.insertBefore(ph,b);box=b;cur=key;
$('pdmBody').appendChild(b);
b.classList.remove('hidden');
$('pdmTitle').textContent=m[1];
try{hdr(key)}catch(e){console.warn('Modal:',e)}
const av=$('appView');if(av&&$('pdmModal').parentNode!==av)av.appendChild($('pdmModal'));
$('pdmModal').hidden=false;
document.documentElement.style.overflow='hidden';
$('pdmBody').scrollTop=0;
await load(key);
if(box)box.classList.remove('hidden');
}
window.__pdmOpen=open;
function close(){
if(box&&ph&&ph.parentNode){ph.parentNode.insertBefore(box,ph);ph.remove();box.classList.add('hidden');}
box=null;ph=null;cur=null;
const m=$('pdmModal');if(m)m.hidden=true;
document.documentElement.style.overflow='';
}
window.__pdmClose=close;
function closeSide(){if(document.body.classList.contains('admin-side-open')){const t=$('adminSideMenuToggle');if(t)t.click()}}
window.__pdmRoute=function(item,e){
const key=item.dataset.openService||item.dataset.sideTab||item.dataset.adminTab;
if(key==='restaurantes'||key==='servicios'){close();return false}
if(!MAP[key])return false;
e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
closeSide();
open(key);
return true;
};
window.addEventListener('click',e=>{
const t=e.target;if(!t||!t.closest)return;
const sv=t.closest('#pdsMenu [data-sv]');
if(sv&&MAP[sv.dataset.sv]){
e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
const m=$('pdsMenu'),f=$('pdsFab');if(m&&!m.hidden&&f)f.click();
open(sv.dataset.sv);return;
}
if(t.closest('#pdmModal .m-x,#pdmModal .m-bg,#pdmModal .closeServiceAdmin')){e.preventDefault();close();}
},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('pdmModal').hidden)close()});
let orig=window.openAdminTab,base=orig,busy=false;
window.__pdmOrigTab=function(){return typeof base==='function'?base.apply(this,arguments):undefined};
const wrapper=function(name){
if(busy)return typeof base==='function'?base.apply(this,arguments):undefined;
if(name==='servicios')name='restaurantes';
if(name==='restaurantes'){
close();busy=true;
try{return typeof orig==='function'?orig.apply(this,arguments):undefined}finally{busy=false}
}
if(MAP[name]&&MAP[name][0].indexOf('tab-')===0){open(name);return}
busy=true;
try{return typeof orig==='function'?orig.apply(this,arguments):undefined}finally{busy=false}
};
try{Object.defineProperty(window,'openAdminTab',{configurable:true,get(){return wrapper},set(f){if(f&&f.__pidemasOriginal===wrapper){orig=f}else{orig=f;base=f}}})}catch(e){window.openAdminTab=wrapper}
})();
}catch(e){console.error("[pdm-js]",e)}

/* ===== pidemas-admin-atras ===== */
try{
(function(){
const vista=()=>{const s=[...document.querySelectorAll('main section[id^="tab-"]')].find(x=>!x.classList.contains('hidden')&&x.offsetParent&&!x.closest('#pdmModal'));return s?s.id.replace(/^tab-/,''):'restaurantes'};
window.pdAtrasExtra=()=>{const m=document.getElementById('pdmModal');if(m&&!m.hidden)return 0;return vista()!=='restaurantes'?1:0};
window.pdAtrasVolver=()=>{const b=document.querySelector('[data-side-tab="restaurantes"]');if(b)b.click();else if(typeof window.openAdminTab==='function')window.openAdminTab('restaurantes')};
})();
}catch(e){console.error("[pidemas-admin-atras]",e)}

/* ===== pidemas-texto-avisos ===== */
try{
window.pdTxt=function(s){
s=String(s==null?'':s).replace(/^[\s\-–—·:|]+/,'').replace(/\s+[-–—]+\s+/g,' · ').replace(/\s{2,}/g,' ').trim();
const KEEP=/^(DNI|RUC|QR|BCP|BBVA|IBK|SOAT|PDF|OK|ID|S\/)$/;
const SEP=/^(\s·\s|\.\s+|:\s+|,\s+)$/;
return s.split(/(\s·\s|\.\s+|:\s+|,\s+)/).map(part=>{
if(SEP.test(part))return part;
const L=part.replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü]/g,'');
if(L.length<4||L!==L.toUpperCase())return part;
const out=part.split(/(\s+)/).map(w=>{const c=w.replace(/[.,;:()]/g,'');if(KEEP.test(c)||(/\d/.test(c)&&/^#?[A-Z0-9]+$/.test(c)))return w;return w.toLowerCase()}).join('');
return out.replace(/^(\s*)([a-záéíóúñü])/,(m,a,b)=>a+b.toUpperCase());
}).join('');
};
}catch(e){console.error("[pidemas-texto-avisos]",e)}

