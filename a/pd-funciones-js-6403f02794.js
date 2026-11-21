
/* ===== antes funciones.js ===== */
/* Pidemás · Administrador · funciones.js
   Funciones principales del panel: sesión, carga de datos, ventanas, navegación y utilidades comunes. */

/* ===== principal ===== */
const $ = id => document.getElementById(id);
function msg(el,text){el.textContent=text;el.classList.remove("hidden")}
function clearMsg(el){el.textContent="";el.classList.add("hidden")}
function msgBox(el,text){if(!el)return;el.textContent=String(text??"");el.classList.remove("hidden")}
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
await loadRestaurants();
await loadClientes();
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
async function loadRestaurants(){
const {data,error}=await db.from("negocios").select("*").order("nombre",{ascending:true});
if(error){console.error("Cargar negocios:",error);msg($("restaurantMsg"),"No se pudieron cargar los negocios.");const vl=$("visibilidadNegociosList");if(vl)vl.innerHTML='<div class="muted">No se pudieron cargar los negocios: '+esc(error.message||"error de conexión")+'. Toca actualizar para reintentar.</div>';return}
renderVisibilidadNegocios(data||[]);
}
async function loadVisibilidadNegocios(){
const list=$("visibilidadNegociosList"); if(!list) return;
list.innerHTML='<div class="muted">Cargando negocios…</div>';
const vm=$("visibilidadNegociosMsg"); if(vm){vm.textContent="";vm.classList.add("hidden");}
try{
const {data,error}=await db.from("negocios").select("*").order("nombre",{ascending:true});
if(error) throw error;
renderVisibilidadNegocios(data||[]);
}catch(e){
console.error("Cargar estado de negocios:",e);
list.innerHTML='<div class="muted">No se pudieron cargar los negocios ('+esc(String((e&&e.message)||"error de conexión"))+'). Toca actualizar para reintentar.</div>';
}
}
window.loadVisibilidadNegocios=loadVisibilidadNegocios;
function renderVisibilidadNegocios(data){
const list=$("visibilidadNegociosList"); if(!list) return;
const vm=$("visibilidadNegociosMsg");
const setMsg=(t)=>{ if(!vm) return; vm.textContent=t||""; vm.classList.toggle("hidden",!t); };
list.innerHTML="";
if(!data.length){ list.innerHTML='<div class="muted">Aún no hay negocios registrados.</div>'; setMsg(""); return; }
setMsg(data.some(r=>"visible_admin" in r)?"":"Falta la columna visible_admin en Supabase. Ejecuta el SQL visible_admin.sql y vuelve a abrir esta pantalla.");
data.slice().sort((a,b)=>String(a.nombre||"").localeCompare(String(b.nombre||""))).forEach(r=>{
const estado=(on)=>(on?"Visible en la tienda":"Oculto por administración")+(r.activo===false&&on?" · pausado por el negocio":"");
const on0=r.visible_admin!==false;
const row=document.createElement("label"); row.className="pdnSwitchRow";
row.innerHTML=`<span><strong>${esc(r.nombre)}</strong><small>${estado(on0)}</small></span><input type="checkbox" ${on0?"checked":""}><i aria-hidden="true"></i>`;
const input=row.querySelector("input"), small=row.querySelector("small");
input.addEventListener("change",async()=>{
const quiere=input.checked;
if(!quiere && !(await pdConfirmar(`¿Ocultar "${r.nombre||"este negocio"}" de la tienda? El negocio no podrá volver a activarla: le saldrá un aviso para que se ponga en contacto contigo.`))){ input.checked=true; return; }
input.disabled=true; setMsg("");
try{
const res=await db.from("negocios").update({visible_admin:quiere}).eq("id",r.id).select("id,visible_admin").maybeSingle();
if(res.error) throw res.error;
if(!res.data||res.data.visible_admin!==quiere) throw new Error("Supabase no confirmó el cambio.");
r.visible_admin=quiere; small.textContent=estado(quiere);
}catch(err){
console.error("Visibilidad del negocio:",err);
input.checked=!quiere;
setMsg(/visible_admin|column/i.test(String(err&&err.message))?"Falta la columna visible_admin en Supabase. Ejecuta el SQL visible_admin.sql.":"No se pudo cambiar la visibilidad de «"+(r.nombre||"negocio")+"». Intenta de nuevo.");
}finally{ input.disabled=false; }
});
list.appendChild(row);
});
}
function restaurantPhoneValue(r){
if(!r) return "";
const keys=["telefono_whatsapp","whatsapp","whatsapp_telefono","numero_whatsapp","numero_de_whatsapp","celular_whatsapp","telefono","telefono_contacto","telefono_negocio","telefono_restaurante","numero_telefono","numero","celular","phone","contacto_whatsapp","contacto"];
for(const k of keys){ const v=r[k]; if(v!==undefined && v!==null && String(v).trim()!=="") return String(v).trim(); }
return "";
}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
/* Marcas __PIDEMAS_X__{json}: lectura y limpieza con llaves anidadas (descartables) */
window.pdLeerMarca=function(t,nombre){var s=String(t||''),k='__PIDEMAS_'+nombre+'__',i=s.indexOf(k);if(i<0)return null;var j=i+k.length;while(s[j]===' ')j++;if(s[j]!=='{')return null;var p=0,ins=false,es=false,e=j;for(;e<s.length;e++){var c=s[e];if(ins){if(es)es=false;else if(c==='\\')es=true;else if(c==='"')ins=false}else if(c==='"')ins=true;else if(c==='{')p++;else if(c==='}'){p--;if(!p){e++;break}}}try{return JSON.parse(s.slice(j,e))}catch(x){return null}};
window.pdQuitarMarcas=function(t){var s=String(t||''),re=/__PIDEMAS_[A-Z_]+__\s*/g,m,out='',last=0;while((m=re.exec(s))){var j=re.lastIndex;if(s[j]!=='{')continue;var p=0,ins=false,es=false,e=j;for(;e<s.length;e++){var c=s[e];if(ins){if(es)es=false;else if(c==='\\')es=true;else if(c==='"')ins=false}else if(c==='"')ins=true;else if(c==='{')p++;else if(c==='}'){p--;if(!p){e++;break}}}out+=s.slice(last,m.index);last=e;re.lastIndex=e}return out+s.slice(last)};
function orderStatusLabel(s){return ({pendiente:"Pedido recibido",confirmado:"Pedido recibido",asignado:"Motorizado asignado",aceptado:"Pedido aceptado",pedido_aceptado:"Pedido aceptado",en_camino:"En camino",camino_recojo:"En camino",pedido_recibido:"Pedido recibido",en_entrega:"En entrega",camino_entrega:"En entrega",confirmando_pago:"Confirmando pago",entregado:"Entregado",cancelado:"Cancelado"})[s]||s||"-"}
function adminOrderFlowIndex(status){const s=String(status||"").toLowerCase();if(s==="cancelado")return -1;if(s==="entregado")return 5;if(s==="en_entrega"||s==="camino_entrega"||s==="confirmando_pago")return 4;if(s==="en_camino"||s==="camino_recojo")return 3;if(s==="aceptado"||s==="pedido_aceptado")return 2;if(s==="asignado")return 1;return 0}

function formatDate(v){if(!v)return "-";try{return new Date(v).toLocaleString("es-PE",{dateStyle:"short",timeStyle:"short"})}catch{return v}}
var allOrders=[];
const selectedOrders=new Set();
var adminRestaurantsById = window.adminRestaurantsById || new Map();
window.adminRestaurantsById = adminRestaurantsById;
const adminDeliveryDistanceCache=new Map();
var allMotos=[];
var allClientes=[];
var editingClienteId=null;
function clienteField(c, key){ return c && Object.prototype.hasOwnProperty.call(c,key) ? c[key] : ""; }
function clienteNombre(c){ return clienteField(c,"nombre_completo") || clienteField(c,"nombre") || ""; }
function clienteDocumento(c){ return clienteField(c,"documento") || clienteField(c,"dni") || ""; }
function clienteTelefono(c){ return clienteField(c,"telefono") || clienteField(c,"numero") || clienteField(c,"celular") || ""; }
function clienteDireccion(c){ return clienteField(c,"direccion") || clienteField(c,"direccion_recojo") || ""; }
function clienteUbicacion(c){
return clienteField(c,"referencia") ||
clienteField(c,"ubicacion_recojo_url") ||
clienteField(c,"ubicacion_url") || "";
}
async function loadClientes(){
const box=$("clientesList");
if(!box)return;
const {data,error}=await db.from("clientes").select("*");
if(error){
msg($("clienteMsg"),"No se pudieron cargar los clientes: "+error.message);
return;
}
allClientes=(data||[]).filter(c=>c.activo!==false);
allClientes.sort((a,b)=>clienteNombre(a).localeCompare(clienteNombre(b),"es"));
renderClientes();
}
function renderClientes(){
const box=$("clientesList");
if(!box)return;
if(!allClientes.length){
box.innerHTML='<div class="notice">No hay clientes registrados.</div>';
return;
}
const query=String($("buscarClientesRegistrados")?.value||"").trim().toLocaleLowerCase("es");
const normaliza=v=>String(v||"").toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const filtrados=allClientes.filter(c=>{
const datos=[clienteNombre(c),clienteTelefono(c),clienteDocumento(c),clienteDireccion(c),clienteUbicacion(c)].join(" ");
return normaliza(datos).includes(normaliza(query));
});
if(!filtrados.length){
box.innerHTML='<div class="notice">No se encontraron clientes con esa búsqueda.</div>';
return;
}
box.innerHTML=filtrados.map(c=>{
const dni=clienteDocumento(c), ubic=clienteUbicacion(c);
return `<div class="row" style="display:block">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap">
        <div><strong>${esc(clienteNombre(c)||"Sin nombre")}</strong><small>Cliente registrado</small></div>
        <span class="badge">${c.activo===false?"Inactivo":"Activo"}</span>
      </div>
      <div class="clientData" style="margin-top:8px">
        <div><b>DNI:</b> ${esc(dni||"—")}</div>
        <div><b>Número:</b> ${esc(clienteTelefono(c)||"—")}</div>
        <div><b>Dirección:</b> ${esc(clienteDireccion(c)||"—")}</div>
        <div><b>Ubicación:</b> ${ubic?`<a href="${esc(ubic)}" target="_blank" rel="noopener">Ver ubicación</a>`:"—"}</div>
      </div>
      <div class="actions clientButtons clientServiceButtons" style="margin-top:10px">
        <button type="button" class="btn" data-client-service="recojo" data-client-id="${esc(c.id)}">Recojo y entrega</button>
        <button type="button" class="btn" data-client-service="encomienda" data-client-id="${esc(c.id)}">Encomienda</button>
        <button type="button" class="btn" data-client-service="compra" data-client-id="${esc(c.id)}">Compra</button>
      </div>
      <div class="actions clientButtons" style="margin-top:8px">
        <button type="button" class="btn alt" onclick="editarClienteAdmin('${esc(c.id)}')">Editar</button>
        <button type="button" class="btn alt" onclick="borrarClienteAdmin('${esc(c.id)}')">Borrar</button>
      </div>
    </div>`;
}).join("");
}
function limpiarFormularioCliente(){
editingClienteId=null;
$("clienteNombre").value="";
$("clienteDocumento").value="";
$("clienteTelefono").value="";
$("clienteDireccion").value="";
$("clienteUbicacion").value="";
$("clienteFormTitle").textContent="Agregar cliente";
$("guardarCliente").textContent="Guardar cliente";
$("cancelarCliente").classList.add("hidden");
}
function editarClienteAdmin(id){
const c=allClientes.find(x=>String(x.id)===String(id));
if(!c)return;
editingClienteId=c.id;
$("clienteNombre").value=clienteNombre(c);
$("clienteDocumento").value=clienteDocumento(c);
$("clienteTelefono").value=clienteTelefono(c);
$("clienteDireccion").value=clienteDireccion(c);
$("clienteUbicacion").value=clienteUbicacion(c);
$("clienteFormTitle").textContent="Editar cliente";
$("guardarCliente").textContent="Guardar cambios";
$("cancelarCliente").classList.remove("hidden");
clearMsg($("clienteMsg"));
window.openAdminTab&&window.openAdminTab("clientes");
window.scrollTo({top:0,behavior:"smooth"});
}

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
async function guardarClienteAdmin(){
const nombre=$("clienteNombre").value.trim();
const documento=$("clienteDocumento").value.trim();
const telefono=$("clienteTelefono").value.trim();
const direccion=$("clienteDireccion").value.trim();
const ubicacion=$("clienteUbicacion").value.trim();
if(!nombre||!telefono||!direccion){
msg($("clienteMsg"),"Completa nombre, número y dirección.");
return;
}
try{
const base={
nombre_completo:nombre,
telefono:telefono,
direccion:direccion,
referencia:ubicacion||null
};
const coords=extraerCoordsCliente(ubicacion);
if(coords){
base.latitud=coords.lat;
base.longitud=coords.lng;
}else{
base.latitud=null;
base.longitud=null;
}
const docProbe=await db.from("clientes").select("documento").limit(1);
if(!docProbe.error){
base.documento=documento||null;
}
base.activo=true;
let result;
if(editingClienteId){
result=await db.from("clientes")
.update(base)
.eq("id",editingClienteId)
.select("*")
.single();
}else{
result=await db.from("clientes")
.insert(base)
.select("*")
.single();
}
if(result.error)throw result.error;
msg($("clienteMsg"),editingClienteId
?"Cliente actualizado correctamente."
:"Cliente registrado correctamente.");
limpiarFormularioCliente();
await loadClientes();
}catch(e){
console.error(e);
msg($("clienteMsg"),e.message||"No se pudo guardar el cliente.");
}
}
async function borrarClienteAdmin(id){
const c=allClientes.find(x=>String(x.id)===String(id));
if(!c)return;
if(!(await pdConfirmar(`¿Borrar el cliente "${clienteNombre(c)||""}"? Los pedidos históricos deben conservarse.`)))return;
try{
if(Object.prototype.hasOwnProperty.call(c,"activo")){
const r=await db.from("clientes").update({activo:false}).eq("id",id).select("id").maybeSingle();
if(r.error)throw r.error;
}else{
const r=await db.from("clientes").delete().eq("id",id).select("id");
if(r.error)throw r.error;
}
msg($("clienteMsg"),"Cliente borrado correctamente.");
if(String(editingClienteId)===String(id))limpiarFormularioCliente();
await loadClientes();
}catch(e){
msg($("clienteMsg"),e.message||"No se pudo borrar el cliente.");
}
}
function formatMinutes(sec){
if(sec==null || !Number.isFinite(sec)) return "—";
const total=Math.max(0,Math.round(sec));
const h=Math.floor(total/3600);
const m=Math.floor((total%3600)/60);
const s=total%60;
return h ? `${h} h ${m} min` : `${m} min ${String(s).padStart(2,"0")} s`;
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

function parseAdminDeliveryMarker(order){
const obs=String(order?.observaciones||''),hit=obs.match(/__PIDEMAS_DELIVERY__\s*(\{[^}]*\})/);
if(!hit)return null;
try{const km=Number(JSON.parse(hit[1])?.km);return Number.isFinite(km)&&km>=0?km:null;}catch(e){return null;}
}

function orderFinancialData(order){
const total=Number(order?.total||0);
let subtotal=Number(order?.subtotal);
let delivery=Number(order?.costo_delivery ?? order?.delivery_cost);
const obs=String(order?.observaciones||'');
const hit=obs.match(/__PIDEMAS_DELIVERY__\s*(\{[\s\S]*?\})(?=\s*·|$)/);
let marker=null;
if(hit){try{marker=JSON.parse(hit[1]);}catch(e){marker=null;}}
if(marker){
const km=Number(marker.km);
const cost=Number(marker.costo ?? marker.delivery ?? marker.delivery_cost);
if(Number.isFinite(cost))delivery=cost;
if(!Number.isFinite(delivery))delivery=0;
if(!Number.isFinite(subtotal))subtotal=total-delivery;
return {subtotal:Number.isFinite(subtotal)?subtotal:total,delivery,km:Number.isFinite(km)?km:null};
}
if(!Number.isFinite(delivery))delivery=0;
if(!Number.isFinite(subtotal))subtotal=total-delivery;
return {subtotal:Number.isFinite(subtotal)?subtotal:total,delivery,km:null};
}
function shareOrderWithRestaurantWhatsApp(orderId){
try {
const order=(Array.isArray(allOrders)?allOrders:[]).find(o=>String(o.id)===String(orderId));
if(!order){pdAviso("No se encontró el pedido. Pulsa Actualizar y vuelve a intentarlo.");return;}
const details=Array.isArray(order.detalle_pedidos)?order.detalle_pedidos:[];
const restaurantMap=window.adminRestaurantsById instanceof Map ? window.adminRestaurantsById : adminRestaurantsById;
const ids=[order.negocio_id,order.restaurante_id,order.business_id,
...details.flatMap(d=>[d.negocio_id,d.restaurante_id,d.business_id])]
.filter(v=>v!==undefined&&v!==null&&String(v).trim()!="").map(String);
let restaurant=null;
for(const id of ids){ restaurant=restaurantMap?.get(String(id)); if(restaurant)break; }
if(!restaurant){
const name=String(order.negocio_nombre||order.restaurante_nombre||order.nombre_negocio||order.restaurante||
details.find(d=>d.negocio_nombre||d.restaurante_nombre||d.nombre_negocio)?.negocio_nombre||
details.find(d=>d.restaurante_nombre||d.nombre_negocio)?.restaurante_nombre||"").trim().toLowerCase();
if(name) restaurant=[...(restaurantMap?.values?.()||[])].find(r=>String(r.nombre||r.nombre_negocio||r.nombre_restaurante||"").trim().toLowerCase()===name)||null;
}
if(!restaurant){
pdAviso("No se pudo identificar el restaurante de este pedido. Actualiza los pedidos y verifica que el pedido tenga asociado el negocio.");return;
}
const rawPhone=restaurantPhoneValue(restaurant);
let phone=String(rawPhone||"").replace(/[^\d]/g,"");
if(phone.startsWith("00"))phone=phone.slice(2);
if(phone.startsWith("0")&&phone.length===10)phone=phone.slice(1);
if(phone.length===9)phone="51"+phone;
if(phone.length<11 || phone.length>15){
pdAviso(`El restaurante "${restaurant.nombre||restaurant.nombre_negocio||""}" no tiene un número de WhatsApp válido guardado en su ficha. Revisa el teléfono en la información del restaurante.`);return;
}
const orderCode=String(order.id).slice(0,8).toUpperCase();
const items=details.length?details.map(d=>{
const qty=Number(d.cantidad||1), name=String(d.nombre_producto||d.producto||d.nombre||"Producto");
const unit=Number(d.precio_unitario??d.precio??d.price);
const subtotal=Number(d.subtotal??d.total??(Number.isFinite(unit)?unit*qty:NaN));
let line=`• ${qty} × ${name}`;
if(Number.isFinite(unit)&&unit>=0)line+=` (S/ ${unit.toFixed(2)} c/u)`;
if(Number.isFinite(subtotal)&&subtotal>=0)line+=` — S/ ${subtotal.toFixed(2)}`;
const extras=[d.tamano,d.presentacion,d.extras,d.personalizacion,d.observaciones].filter(v=>v!=null&&String(v).trim()).map(v=>typeof v==="object"?JSON.stringify(v):String(v));
if(extras.length)line+=`\n  Detalles: ${extras.join(", ")}`;
return line;
}).join("\n"):"• Revisar detalle del pedido en el panel de Pidemás";
const fin=orderFinancialData(order);
const cashTotal=Number(order.total||0);
let cashPaid=null, cashChange=null;
const cashCandidates=[order.monto_recibido,order.monto_pago,order.monto_efectivo,order.efectivo_recibido,order.cliente_paga_con,order.monto,order.monto_cliente];
for(const raw of cashCandidates){
if(raw!==null&&raw!==undefined&&String(raw).trim()!==""){
const value=Number(raw);
if(Number.isFinite(value)&&value>0){cashPaid=value;break;}
}
}
const cashMarkerMatch=String(order.observaciones||"").match(/__PIDEMAS_PAGO_EFECTIVO__\s*(\{[^{}]*\})/);
if(cashPaid===null&&cashMarkerMatch){
try{
const data=JSON.parse(cashMarkerMatch[1]);
const value=Number(data.monto??data.montoPago??data.paid??data.cliente_paga_con??data.monto_recibido??data.monto_cliente);
if(Number.isFinite(value)&&value>0)cashPaid=value;
const change=Number(data.vuelto??data.change??data.cambio);
if(Number.isFinite(change)&&change>=0)cashChange=change;
}catch(e){}
}
const rawChange=Number(order.vuelto??order.cambio);
if(cashChange===null&&Number.isFinite(rawChange)&&rawChange>=0&&(order.vuelto!=null||order.cambio!=null))cashChange=rawChange;
if(cashPaid!==null&&cashChange===null)cashChange=Math.max(0,cashPaid-cashTotal);
const location=(order.latitud_entrega!=null&&order.longitud_entrega!=null)
?`https://www.google.com/maps?q=${encodeURIComponent(order.latitud_entrega+","+order.longitud_entrega)}`
:String(order.ubicacion_entrega||order.google_maps_url||"No registrada");
const cleanNotes=window.pdQuitarMarcas(order.observaciones||"").replace(/__PIDEMAS_PAGO_EFECTIVO__\s*\{.*?\}/gs,"").replace(/__PIDEMAS_DELIVERY__\s*\{.*?\}/gs,"").replace(/\s*·\s*·/g," · ").replace(/^\s*·|·\s*$/g,"").trim();
const cashLines=String(order.metodo_pago||"").toLowerCase().includes("efectivo")&&cashPaid!==null
? [`Cliente pagará con: S/ ${cashPaid.toFixed(2)}`,`Cambio para el cliente: S/ ${Number(cashChange||0).toFixed(2)}`]
: [];
const message=[`*PIDEMÁS — NUEVO PEDIDO #${orderCode}*`,`Restaurante: ${restaurant.nombre||restaurant.nombre_negocio||"Sin nombre"}`,"","*Productos:*",items,"",`*Cliente:* ${order.nombre_cliente||order.cliente_nombre||"Sin nombre"}`,`*Teléfono:* ${order.telefono_cliente||order.cliente_telefono||"No registrado"}`,`*Dirección de entrega:* ${order.direccion_entrega||"No registrada"}`,`*Ubicación:* ${location}`,"",`Subtotal: S/ ${Number(fin.subtotal||0).toFixed(2)}`,`Delivery: S/ ${Number(fin.delivery||0).toFixed(2)}`,`*TOTAL DEL PEDIDO: S/ ${Number(order.total||0).toFixed(2)}*`,`Método de pago: ${order.metodo_pago||"No registrado"}`,...cashLines,...(cleanNotes?[`Observaciones: ${cleanNotes}`]:[]),"","Por favor, confirma la recepción de este pedido."].join("\n");
const url=`https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
const a=document.createElement("a");
a.href=url; a.target="_blank"; a.rel="noopener noreferrer"; a.style.display="none";
document.body.appendChild(a);
a.click();
setTimeout(()=>a.remove(),1500);
} catch(e) {
console.error("Error al preparar pedido para WhatsApp:",e);
pdAviso("No se pudo preparar el mensaje de WhatsApp: "+(e?.message||String(e)));
}
}
/* Inicio sin saltos: solo se repinta la lista si los datos o filtros cambiaron de verdad; al repintar se conserva scroll y altura */
let __pdRoSig="",__pdRoF="",__pdRoQ="";
function __pdRoFirma(){
try{
const f=($("orderStatusFilter")&&$("orderStatusFilter").value)||"",q=(($("orderSearch")&&$("orderSearch").value)||"").trim().toLowerCase();
const sel=[...selectedOrders].sort().join(",");
const list=$("orderList");
const exp=list?[...list.querySelectorAll(".adminOrderCard.is-expanded")].map(c=>c.getAttribute("data-order-id")).join(","):"";
const d=JSON.stringify(allOrders,(k,v)=>(k==="ultima_ubicacion"||k==="ultima_ubicacion_en")?undefined:v);
const m=(allMotos||[]).map(x=>[x.id,x.disponible,x.en_descanso,x.nombre_completo].join(":")).join(",");
const t=f+"|"+q+"|"+sel+"|"+exp+"|"+m+"|"+d;
let h=5381;for(let i=0;i<t.length;i++){h=((h<<5)+h+t.charCodeAt(i))|0}
return t.length+":"+h;
}catch(e){return null}
}
let __pdRoPend=false,__pdRoOrd=new Map();
const __pdRoRep=(k,v)=>(k==="ultima_ubicacion"||k==="ultima_ubicacion_en")?undefined:v;
function __pdRoHash(o){try{const t=JSON.stringify(o,__pdRoRep);let h=5381;for(let i=0;i<t.length;i++){h=((h<<5)+h+t.charCodeAt(i))|0}return t.length+":"+h}catch(e){return null}}
function __pdRoGuardar(){const m=new Map();try{(allOrders||[]).forEach(o=>m.set(String(o.id),__pdRoHash(o)))}catch(e){}__pdRoOrd=m}
setInterval(()=>{if(!__pdRoPend)return;const l=$("orderList");if(!l||l.querySelector(".adminOrderCard.is-expanded")||l.querySelector(".adminOrderInlineTracking"))return;__pdRoPend=false;renderOrders()},700);
function renderOrders(){
const list=$("orderList");
if(!list)return renderOrdersReal();
const sig=__pdRoFirma();
if(sig&&sig===__pdRoSig&&list.querySelector(".adminOrderCard")&&!list.querySelector(".pdSk"))return;
/* con una tarjeta abierta no se repinta si el pedido abierto no cambió: se pinta al cerrarla */
const abiertas=[...list.querySelectorAll(".adminOrderCard.is-expanded")].map(c=>c.getAttribute("data-order-id"));
if(abiertas.length&&__pdRoOrd.size){
const igual=abiertas.every(id=>{const o=(allOrders||[]).find(x=>String(x.id)===String(id));return o&&__pdRoHash(o)===__pdRoOrd.get(String(id))});
const f=($("orderStatusFilter")&&$("orderStatusFilter").value)||"",q=(($("orderSearch")&&$("orderSearch").value)||"").trim().toLowerCase();
if(igual&&f===__pdRoF&&q===__pdRoQ){__pdRoPend=true;return}
}
const y=window.scrollY||window.pageYOffset||0,h=list.offsetHeight;
if(h>0)list.style.minHeight=h+"px";
try{renderOrdersReal()}finally{
__pdRoSig=__pdRoFirma()||"";__pdRoGuardar();__pdRoPend=false;
__pdRoF=($("orderStatusFilter")&&$("orderStatusFilter").value)||"";__pdRoQ=(($("orderSearch")&&$("orderSearch").value)||"").trim().toLowerCase();
if(Math.abs((window.scrollY||0)-y)>1)window.scrollTo(0,y);
requestAnimationFrame(()=>requestAnimationFrame(()=>{list.style.minHeight=""}));
}
}
function renderOrdersReal(){
const filter=$("orderStatusFilter").value;
const q=$("orderSearch").value.trim().toLowerCase();
const list=$("orderList");
const expandedTrackingOrderId = list.querySelector(".adminOrderInlineTracking")?.getAttribute("data-inline-tracking-order") || "";
const previousMotoSelections={};
list.querySelectorAll(".motoSelect").forEach(sel=>{
const id=sel.getAttribute("data-order-id");
if(id && sel.value) previousMotoSelections[String(id)]=String(sel.value);
});
const expandedOrderProducts=new Set();
list.querySelectorAll(".toggleOrderProductsBtn[aria-expanded='true']").forEach(btn=>{
const id=btn.getAttribute("data-order-id");
if(id) expandedOrderProducts.add(String(id));
});
const expandedOrderCards=new Set();
list.querySelectorAll(".adminOrderCard.is-expanded").forEach(card=>{
const id=card.getAttribute("data-order-id") ||
card.querySelector(".editOrderBtn")?.getAttribute("data-order-id") ||
card.querySelector(".adminOrderTitle")?.textContent?.match(/Pedido\s+#?([A-Za-z0-9-]+)/i)?.[1];
if(id) expandedOrderCards.add(String(id));
});
list.innerHTML="";
let items=allOrders.filter(o=>!filter||String(o.estado||"").toLowerCase()===String(filter||"").toLowerCase());
if(q) items=items.filter(o=>String(o.id).toLowerCase().includes(q)||String(o.nombre_cliente||"").toLowerCase().includes(q)||String(o.telefono_cliente||"").toLowerCase().includes(q));
const visibleIds=new Set(items.map(o=>String(o.id)));
[...selectedOrders].forEach(id=>{if(!visibleIds.has(id))selectedOrders.delete(id)});
if(!items.length){list.innerHTML='<div class="notice">No hay pedidos que coincidan con el filtro.</div>';updateOrderBulkBar();return}
items.forEach(o=>{
const details=Array.isArray(o.detalle_pedidos)?o.detalle_pedidos:[];
const itemsText=details.length?details.map(d=>`${esc(d.nombre_producto)} × ${Number(d.cantidad||0)}`).join(" · "):"Sin detalle";
const location=(o.latitud_entrega!=null&&o.longitud_entrega!=null)?`<a href="https://www.google.com/maps?q=${encodeURIComponent(o.latitud_entrega+","+o.longitud_entrega)}" target="_blank" rel="noopener">Ver ubicación</a>`:"Sin ubicación";
const assigned=o.motorizados?.nombre_completo||"Sin asignar";
const method=String(o.metodo_pago||"").trim().toLowerCase();
const estado=String(o.estado||"").trim().toLowerCase();
const pendingOrder=["pendiente","nuevo"].includes(estado);
const proof=String(o.comprobante_pago_url||o.comprobante_url||o.constancia_pago_url||"").trim();
function parseJsonMarker(order, markerName){
const obs=String(order?.observaciones||"");
const re=new RegExp(markerName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*(\\{[\s\S]*?\\})(?=\\s*·|$)');
const hit=obs.match(re);
if(!hit)return null;
try{return JSON.parse(hit[1]);}catch(e){return null;}
}
function orderFinancialData(order){
const total=Number(order?.total||0);
let subtotal=Number(order?.subtotal);
let delivery=Number(order?.costo_delivery ?? order?.delivery_cost);
const deliveryMarker=parseJsonMarker(order,'__PIDEMAS_DELIVERY__');
if(deliveryMarker){
const km=Number(deliveryMarker.km);
const cost=Number(deliveryMarker.costo ?? deliveryMarker.delivery ?? deliveryMarker.delivery_cost);
if(Number.isFinite(cost))delivery=cost;
return {subtotal:Number.isFinite(subtotal)?subtotal:(Number.isFinite(total-delivery)?total-delivery:total),delivery:Number.isFinite(delivery)?delivery:0,km:Number.isFinite(km)?km:null};
}
if(!Number.isFinite(delivery))delivery=0;
if(!Number.isFinite(subtotal))subtotal=total-delivery;
return {subtotal:Number.isFinite(subtotal)?subtotal:total,delivery:Number.isFinite(delivery)?delivery:0,km:null};
}
function cashPaymentData(order){
const total=Number(order?.total||0);
const candidates=[order?.monto_recibido,order?.monto_pago,order?.monto_efectivo,order?.efectivo_recibido,order?.cliente_paga_con,order?.monto,order?.monto_cliente];
for(const raw of candidates){
const p=Number(raw);
if(Number.isFinite(p)&&p>0){
const c=Number(order?.vuelto ?? order?.cambio);
return {paid:p,change:Number.isFinite(c)?c:Math.max(0,p-total)};
}
}
const x=parseJsonMarker(order,'__PIDEMAS_PAGO_EFECTIVO__');
if(x){
const p=Number(x.monto ?? x.montoPago ?? x.paid ?? x.cliente_paga_con ?? x.monto_recibido ?? x.monto_cliente);
const c=Number(x.vuelto ?? x.change ?? x.cambio);
if(Number.isFinite(p)&&p>0)return {paid:p,change:Number.isFinite(c)?c:Math.max(0,p-total)};
}
const rawObs=String(order?.observaciones||'');
const markerMatch=rawObs.match(/__PIDEMAS_PAGO_EFECTIVO__\s*(\{.*?\})/s);
if(markerMatch){
try{
const data=JSON.parse(markerMatch[1]);
const p=Number(data.monto ?? data.montoPago ?? data.paid ?? data.cliente_paga_con ?? data.monto_recibido ?? data.monto_cliente);
const c=Number(data.vuelto ?? data.change ?? data.cambio);
if(Number.isFinite(p)&&p>0)return {paid:p,change:Number.isFinite(c)?c:Math.max(0,p-total)};
}catch(e){}
}
const obs=String(order?.observaciones||"");
const plain=[
/(?:cliente\s+paga\s+con|paga\s+con|monto\s+(?:de\s+)?(?:pago|efectivo))\s*[:=\-]?\s*S?\/?\s*(\d+(?:[\.,]\d{1,2})?)/i,
/(?:efectivo|pago)\s*[:=]\s*S?\/?\s*(\d+(?:[\.,]\d{1,2})?)/i
];
for(const re of plain){const hit=obs.match(re);if(hit){const p=Number(String(hit[1]).replace(',','.'));if(Number.isFinite(p)&&p>0)return {paid:p,change:Math.max(0,p-total)};}}
return {paid:null,change:null};
}
async function registerCashPayment(orderId){
const pedido=allOrders.find(o=>String(o.id)===String(orderId));
if(!pedido){msg($("ordersMsg"),"No se encontró el pedido. Actualiza la lista e inténtalo nuevamente.");return;}
const input=document.querySelector(`.cashPaidInput[data-id="${CSS.escape(String(orderId))}"]`);
const button=input?.parentElement?.querySelector('button[onclick*="registerCashPayment"]');
if(button?.disabled)return;
const previo=cashPaymentData(pedido);
if(previo.paid!=null){
msg($("ordersMsg"),"Este pedido ya tiene registrado el monto recibido. Actualiza la lista para verificarlo.");
return;
}
const raw=String(input?.value??'').trim();
const parsed=Number(raw);
const total=Number(pedido.total);
if(!raw || !Number.isFinite(parsed) || !Number.isFinite(total) || total<=0){
msg($("ordersMsg"),"El monto recibido y el total del pedido deben ser válidos.");
input?.focus();
return;
}
const p=Math.round(parsed*100)/100;
const totalCents=Math.round(total*100)/100;
if(p<totalCents){
msg($("ordersMsg"),`El monto recibido debe ser igual o mayor a S/ ${totalCents.toFixed(2)}.`);
input?.focus();
return;
}
const change=Math.round((p-totalCents)*100)/100;
const marker=`__PIDEMAS_PAGO_EFECTIVO__${JSON.stringify({monto:p,vuelto:change})}`;
const obs=String(pedido.observaciones||'').trim();
if(obs.includes('__PIDEMAS_PAGO_EFECTIVO__')){
msg($("ordersMsg"),"El pedido ya tiene información de pago registrada. Actualiza la lista antes de continuar.");
return;
}
const finalObs=[obs,marker].filter(Boolean).join(' · ');
if(button)button.disabled=true;
if(input)input.disabled=true;
msg($("ordersMsg"),"Verificando y registrando el monto recibido...");
try{
let query=db.from('pedidos').update({observaciones:finalObs}).eq('id',orderId);
query=obs ? query.eq('observaciones',obs) : query.or('observaciones.is.null,observaciones.eq.');
const {data,error}=await query.select('id').maybeSingle();
if(error)throw new Error(error.message||'No se pudo guardar el monto.');
if(!data || String(data.id)!==String(orderId))throw new Error('El pedido cambió o ya fue actualizado por otra sesión. Actualiza la lista antes de volver a intentar.');
msg($("ordersMsg"),`✓ Monto recibido registrado: S/ ${p.toFixed(2)} · Total: S/ ${totalCents.toFixed(2)} · Vuelto: S/ ${change.toFixed(2)}.`);
await loadOrders();
}catch(err){
console.error('Registro de monto recibido:',err);
msg($("ordersMsg"),"No se confirmó el registro: "+(err?.message||'error inesperado')+". Actualiza la lista y verifica el pedido antes de reintentar.");
if(input)input.disabled=false;
}finally{
if(button)button.disabled=false;
}
}
window.registerCashPayment=registerCashPayment;
const fin=orderFinancialData(o);
let paymentHtml="";
if(method==="efectivo"){
const cash=cashPaymentData(o);
const paidText=cash.paid==null?"No registrado":`S/ ${cash.paid.toFixed(2)}`;
const changeText=cash.change==null?"No registrado":`S/ ${cash.change.toFixed(2)}`;
paymentHtml=`
        <div style="margin-top:8px;padding:10px;border:1px solid var(--fr-line);border-radius:12px;background:var(--fr-surface)">
          <strong><i class="ti ti-cash" aria-hidden="true"></i> Pago en efectivo</strong><br>
          <span>Subtotal: <strong>S/ ${fin.subtotal.toFixed(2)}</strong></span><br>
          <span>Delivery: <strong>S/ ${fin.delivery.toFixed(2)}</strong>${fin.km!=null?` · ${fin.km.toFixed(2)} km`:""}</span><br>
          <span>Total: <strong>S/ ${Number(o.total||0).toFixed(2)}</strong></span><br>
          <span>Cliente paga con: <strong>${paidText}</strong></span><br>
          <span>Cambio para el cliente: <strong>${changeText}</strong></span>
          ${cash.paid==null ? `
            <div style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <input class="cashPaidInput" data-id="${esc(String(o.id))}" type="number" min="${Number(o.total||0).toFixed(2)}" step="0.01" inputmode="decimal" placeholder="Monto recibido" style="max-width:170px;padding:9px;border:1px solid var(--fr-line);border-radius:10px">
              <button type="button" class="btn" onclick="registerCashPayment('${esc(String(o.id))}')">Registrar monto</button>
            </div>
            <div style="margin-top:5px;color:var(--fr-muted);font-size:12px">Este pedido no trae guardado el monto ingresado por el cliente.</div>
          ` : ""}
        </div>`;
}else if(method==="yape"){
const confirmed=o.pago_confirmado===true;
paymentHtml=`
        <div style="margin-top:8px;padding:12px;border:1px solid var(--fr-line);border-radius:14px;background:var(--fr-surface)">
          <strong><i class="ti ti-cash" aria-hidden="true"></i> Pago con Yape</strong><br>
          <span>Monto: <strong>S/ ${Number(o.total||0).toFixed(2)}</strong></span>
          ${proof
            ? `<div style="margin-top:10px"><strong>Captura de Yape</strong><div style="margin-top:7px"><button type="button" class="btn" onclick="toggleYapeProof(\'${esc(String(o.id))}\')">Mostrar captura</button><div id="yapeProof-${esc(String(o.id))}" style="display:none;margin-top:8px"><a href="${esc(proof)}" target="_blank" rel="noopener"><img src="${esc(proof)}" alt="Captura de pago Yape" style="display:block;width:100%;max-width:360px;max-height:520px;object-fit:contain;border:1px solid var(--fr-line);border-radius:12px;background:#fff;cursor:pointer" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'\"></a><div style="display:none;margin-top:6px;color:var(--fr-muted)">No se pudo mostrar la imagen aquí. <a href="${esc(proof)}" target="_blank" rel="noopener">Abrir captura</a></div></div></div></div>`
            : `<div style="margin-top:10px;color:var(--fr-muted)">Paga con Yape al recibir: el motorizado le muestra el QR.</div>`}
          <div style="margin-top:10px">${confirmed
            ? `<strong>✓ Pago Yape confirmado</strong>`
            : proof
              ? `<div class="yape-review-actions" style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn approveOrderBtn">✓ Confirmar pago Yape</button><button type="button" class="btn alt rejectOrderBtn">✕ Rechazar pago</button></div><div style="margin-top:6px;color:var(--fr-muted);font-size:13px">Revisa la captura antes de confirmar.</div>`
              : (String(o.estado||"").toLowerCase()==="pendiente"&&!o.negocio_id?`<button type="button" class="btn approveOrderBtn">✓ Aceptar pedido</button>`:`<span style="color:var(--fr-muted)">Se cobra al recibir</span>`)}</div>
        </div>`;
}else{
paymentHtml=`<div style="margin-top:8px"><strong>Pago:</strong> ${esc(o.metodo_pago||"-")}</div>`;
}
const genericActions=(pendingOrder && method!=="yape")
? `<button type="button" class="btn approveOrderBtn" data-order-id="${esc(String(o.id))}">✓ Aceptar pedido</button><button type="button" class="btn alt rejectOrderBtn">Rechazar</button>`
: "";
const orderIdShort=String(o.id).slice(0,8).toUpperCase();
const phoneDigits=String(o.telefono_cliente||"").replace(/\D/g,"");
const phoneIntl=phoneDigits.startsWith("51")?phoneDigits:(phoneDigits.length===9?"51"+phoneDigits:phoneDigits);
const clientContact=phoneIntl?`<div class="adminOrderContact"><a href="tel:+${esc(phoneIntl)}">Llamar</a><a href="https://wa.me/${esc(phoneIntl)}" target="_blank" rel="noopener">WhatsApp</a></div>`:"";
function serviceContact(phone){ const digits=String(phone||"").replace(/\D/g,""); if(!digits)return `<div class="adminOrderContact"><span class="muted">Número no registrado</span></div>`; const intl=digits.startsWith("51")?digits:(digits.length===9?"51"+digits:digits); return `<div class="adminOrderContact"><a href="tel:+${esc(intl)}">Llamar</a><a href="https://wa.me/${esc(intl)}" target="_blank" rel="noopener noreferrer">WhatsApp</a></div>`; }
const productRows=details.length
? details.map(d=>{
const qty=Number(d.cantidad||0);
const unit=Number(d.precio_unitario ?? d.precio ?? d.price);
const sub=Number(d.subtotal ?? d.total ?? (Number.isFinite(unit)?unit*qty:NaN));
const priceText=Number.isFinite(sub)&&sub>=0?`S/ ${sub.toFixed(2)}`:"";
return `<div class="adminOrderItem"><div><div class="adminOrderItemName">${esc(d.nombre_producto||d.producto||"Producto")}</div>${Number.isFinite(unit)&&unit>=0?`<div style="font-size:12px;color:var(--fr-muted);margin-top:2px">S/ ${unit.toFixed(2)} c/u</div>`:""}</div><div class="adminOrderItemQty">× ${qty}${priceText?` · ${priceText}`:""}</div></div>`;
}).join("")
: `<div class="adminOrderValue normal">No hay productos detallados registrados.</div>`;
const storedDeliveryKm=parseAdminDeliveryMarker(o);
const deliveryKm=storedDeliveryKm!=null?`${storedDeliveryKm.toFixed(2)} km`:"No registrada";
function renderAdminServiceMapLink(notes,kind){
const label=kind==="recojo"?"Ubicación de recojo":"Ubicación de entrega";
const escapedLabel=label.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
const match=String(notes||"").match(new RegExp(escapedLabel+"\\s*:\\s*(https?:\\/\\/[^|\\s]+)","i"));
const url=match?.[1]||"";
return url ? `<a class="adminOrderLocation" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Abrir ubicación</a>` : `<span class="muted">No registrada</span>`;
}
function renderBusinessClientLocation(order,notes){
const obs=String(notes||"");
let marker={};
const hit=obs.match(/__PIDEMAS_DELIVERY__\s*(\{[\s\S]*?\})(?=\s*·|$)/);
if(hit){try{marker=JSON.parse(hit[1])||{};}catch(e){marker={};}}
const latKeys=["latitud_entrega","latitude_entrega","lat_entrega","delivery_lat","cliente_latitud","latitud_cliente","latitud","latitude","lat"];
const lngKeys=["longitud_entrega","longitude_entrega","lng_entrega","delivery_lng","cliente_longitud","longitud_cliente","longitud","longitude","lng","lon"];
let lat=null,lng=null;
for(const k of latKeys){const n=Number(order?.[k]??marker?.[k]);if(Number.isFinite(n)&&n!==0){lat=n;break;}}
for(const k of lngKeys){const n=Number(order?.[k]??marker?.[k]);if(Number.isFinite(n)&&n!==0){lng=n;break;}}
if(lat!==null&&lng!==null){
const url=`https://www.google.com/maps?q=${encodeURIComponent(lat+","+lng)}`;
return `<a class="adminOrderLocation" href="${url}" target="_blank" rel="noopener noreferrer">Abrir ubicación enviada por el cliente</a>`;
}
const urlKeys=["ubicacion_entrega","ubicación_entrega","url_ubicacion_cliente","ubicacion_cliente","delivery_url","maps_url","google_maps_url","url","link"];
for(const k of urlKeys){
const candidate=String(order?.[k]??marker?.[k]??"").trim();
if(/^https?:\/\//i.test(candidate)){
return `<a class="adminOrderLocation" href="${esc(candidate)}" target="_blank" rel="noopener noreferrer">Abrir ubicación enviada por el cliente</a>`;
}
}
const textMatch=obs.match(/(?:Ubicación de entrega|Ubicaci[oó]n del cliente|Ubicación del cliente|Ubicación para delivery)\s*:\s*(https?:\/\/[^|\s]+)/i);
if(textMatch?.[1]){
return `<a class="adminOrderLocation" href="${esc(textMatch[1])}" target="_blank" rel="noopener noreferrer">Abrir ubicación enviada por el cliente</a>`;
}
return `<span class="muted">No registrada en los campos reconocidos</span>`;
}
const rawOrderNotes=String(o.observaciones||"");
const orderNotes=window.pdQuitarMarcas(rawOrderNotes)
.replace(/__PIDEMAS_PAGO_EFECTIVO__\s*\{.*?\}/gs,"")
.replace(/__PIDEMAS_DELIVERY__\s*\{.*?\}/gs,"")
.replace(/(?:^|\s*\|\s*)Ubicación de (?:recojo|entrega):\s*https?:\/\/\S+/gi,"")
.replace(/(?:^|\s*\|\s*)Pago en efectivo:\s*S\/\s*[\d.]+/gi,"")
.replace(/(?:^|\s*\|\s*)Pago por Yape:[^|]*/gi,"")
.replace(/(?:^|\s*[|·]\s*)Pago Yape:[^|·]*/gi,"")
.replace(/(?:^|\s*\|\s*)Monto entregado por el cliente:\s*S\/\s*[\d.]+/gi,"")
.replace(/(?:^|\s*\|\s*)Cambio para el cliente:\s*S\/\s*[\d.]+/gi,"")
.replace(/\s*·\s*·/g," · ")
.replace(/\s*\|\s*\|\s*/g," | ")
.replace(/^\s*[|·]|[|·]\s*$/g,"")
.trim();
const isRecojoEntrega=String(o.tipo_servicio||"").toLowerCase().includes("recojo") || !!(o.direccion_recojo||o.nombre_remitente||o.nombre_receptor);
const isEncomienda=String(o.tipo_servicio||o.servicio||o.tipo||"").toLowerCase().includes("encomienda") || String(o.categoria_servicio||"").toLowerCase().includes("encomienda");
const serviceTypeText = (()=>{
const t=String(o.tipo_servicio||o.servicio||o.tipo||o.categoria_servicio||"").toLowerCase();
if(isEncomienda || t.includes("encomienda")) return "Servicio de encomienda";
if(t.includes("compra")) return "Servicio de compra";
if(isRecojoEntrega || t.includes("recojo") || t.includes("entrega")) return "Servicio de recojo y entrega";
if(t.includes("restaurante") || t.includes("tienda") || o.negocio_id || o.restaurante_id || o.business_id) return "Pedido de negocio";
return "Servicio";
})();
const encomiendaGuideSection=false  ? (()=>{
const guide=String(o.guia_url||"").trim();
const key=String(o.clave_guia||"").trim();
const agencyAmount=Number(o.monto_pagado_agencia||0);
const guideStatus=guide ? "Guía registrada" : "Guía pendiente de subir";
return `<div class="adminOrderSection pdOldGuia" style="border:1px solid var(--fr-line);border-radius:12px">
        <div class="adminOrderSectionTitle">Guía de encomienda</div>
        <div class="adminOrderGrid">
          <div class="adminOrderField"><span class="adminOrderLabel">Estado:</span><div class="adminOrderValue">${esc(guideStatus)}</div></div>
          <div class="adminOrderField"><span class="adminOrderLabel">Clave de guía:</span><div class="adminOrderValue">${key ? (key==="SIN_CLAVE" ? "Sin clave" : esc(key)) : "Pendiente"}</div></div>
          ${Number.isFinite(agencyAmount)&&agencyAmount>0?`<div class="adminOrderField"><span class="adminOrderLabel">Pago en agencia:</span><div class="adminOrderValue">S/ ${agencyAmount.toFixed(2)}</div></div>`:""}
        </div>
        ${guide ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><a class="btn" href="${esc(guide)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-flex;align-items:center">Abrir foto de la guía</a><button type="button" class="btn alt adminToggleGuideBtn" data-guide-order="${esc(String(o.id))}">Ver guía aquí</button></div><div id="adminGuidePreview-${esc(String(o.id))}" style="display:none;margin-top:10px"><a href="${esc(guide)}" target="_blank" rel="noopener noreferrer"><img src="${esc(guide)}" alt="Guía de encomienda" loading="lazy" style="display:block;max-width:100%;max-height:480px;object-fit:contain;border:1px solid var(--fr-line);border-radius:10px;background:#fff" onerror="this.alt='No se pudo cargar la imagen. Usa Abrir foto de la guía para intentar verla.'"></a></div>` : `<div class="muted" style="margin-top:8px">El motorizado todavía no ha guardado la foto de la guía en este pedido.</div>`}
      </div>`;
})() : "";
const recojoEntregaSection=isRecojoEntrega ? `
      <div class="adminOrderSection">
        <div class="adminOrderSectionTitle">Información de quien envía</div>
        <div class="adminOrderGrid">
          <div class="adminOrderField"><span class="adminOrderLabel">Nombre:</span><div class="adminOrderValue">${esc(o.nombre_remitente||o.nombre_cliente||"No registrado")}</div></div>
          <div class="adminOrderField"><span class="adminOrderLabel">Número:</span><div class="adminOrderValue">${esc(o.telefono_remitente||o.telefono_cliente||"No registrado")}</div>${serviceContact(o.telefono_remitente||o.telefono_cliente)}</div>
          <div class="adminOrderField"><span class="adminOrderLabel">Dirección:</span><div class="adminOrderValue normal">${esc(o.direccion_recojo||"No registrada")}</div></div>
          <div class="adminOrderField"><span class="adminOrderLabel">Ubicación:</span><div class="adminOrderValue normal">${renderAdminServiceMapLink(rawOrderNotes,"recojo")}</div></div>
        </div>
      </div>
      <div class="adminOrderSection">
        <div class="adminOrderSectionTitle">Información de quien recibe</div>
        <div class="adminOrderGrid">
          <div class="adminOrderField"><span class="adminOrderLabel">Nombre:</span><div class="adminOrderValue">${esc(o.nombre_receptor||"No registrado")}</div></div>
          <div class="adminOrderField"><span class="adminOrderLabel">Número:</span><div class="adminOrderValue">${esc(o.telefono_receptor||"No registrado")}</div>${serviceContact(o.telefono_receptor)}</div>
          <div class="adminOrderField"><span class="adminOrderLabel">Dirección:</span><div class="adminOrderValue normal">${esc(o.direccion_entrega||"No registrada")}</div></div>
          <div class="adminOrderField"><span class="adminOrderLabel">Ubicación:</span><div class="adminOrderValue normal">${renderAdminServiceMapLink(rawOrderNotes,"entrega")}</div></div>
        </div>
      </div>` : "";    const restaurantWhatsAppAction=(o.negocio_id||o.restaurante_id||o.business_id)
? `<div class="adminOrderSection"><div class="adminOrderSectionTitle">Enviar al restaurante</div><div class="adminOrderActionsButtons"><button type="button" class="btn shareRestaurantWhatsAppBtn">Enviar pedido por WhatsApp</button></div><div style="font-size:12px;color:var(--fr-muted);margin-top:7px">Se abrirá WhatsApp con el número registrado del negocio y el pedido listo para revisar y enviar.</div></div>`
: "";
const isBusinessOrder=!!(o.negocio_id||o.restaurante_id||o.business_id||o.nombre_negocio||o.negocio_nombre||o.restaurante_nombre||o.nombre_restaurante||String(o.tipo_servicio||o.servicio||o.tipo||o.categoria_servicio||"").toLowerCase().includes("negocio"));
const businessOrderDetails = isBusinessOrder ? (()=>{
const fin=orderFinancialData(o);
const businessIds=[o.negocio_id,o.restaurante_id,o.business_id].filter(v=>v!==undefined&&v!==null&&String(v).trim()!=="");
let businessProfile=null;
for(const businessId of businessIds){
businessProfile=adminRestaurantsById?.get(String(businessId))||null;
if(businessProfile)break;
}
const bp=businessProfile||o.negocios||o.restaurantes||{};
const businessName=bp.nombre||bp.nombre_negocio||bp.nombre_comercial||bp.razon_social||o.nombre_negocio||o.negocio_nombre||o.restaurante_nombre||o.nombre_restaurante||o.nombre_comercial||"No registrado";
const businessPhone=bp.telefono||bp.numero||bp.celular||bp.telefono_contacto||o.telefono_negocio||o.negocio_telefono||o.telefono_restaurante||o.restaurante_telefono||"";
const businessAddress=bp.direccion||bp.direccion_negocio||bp.direccion_completa||bp.address||o.direccion_negocio||o.negocio_direccion||o.direccion_restaurante||o.restaurante_direccion||"No registrada";
const businessLocation=bp.ubicacion||bp.ubicacion_url||bp.url_ubicacion||bp.google_maps_url||bp.mapa_url||bp.coordenadas_url||o.ubicacion_negocio||o.negocio_ubicacion||o.ubicacion_restaurante||o.restaurante_ubicacion||"";
const clientName=o.nombre_cliente||o.cliente_nombre||o.nombre_comprador||o.nombre||"No registrado";
const clientPhone=o.telefono_cliente||o.cliente_telefono||o.telefono_comprador||o.celular_cliente||"";
const clientAddress=o.direccion_entrega||o.direccion_cliente||o.direccion_destino||o.direccion||"No registrada";
const clientLocation=renderBusinessClientLocation(o,rawOrderNotes);
const pay=String(o.metodo_pago||"No registrado").trim();
const notes=String(o.observaciones||"");
const paidMatch=notes.match(/Monto entregado por el cliente:\s*S\/\s*([\d.]+)/i);
const changeMatch=notes.match(/Cambio para el cliente:\s*S\/\s*([\d.]+)/i);
const payMarker=notes.match(/__PIDEMAS_PAGO_EFECTIVO__\s*(\{[^}]*\})/);
let paidAmount=paidMatch?Number(paidMatch[1]):NaN;
let changeAmount=changeMatch?Number(changeMatch[1]):NaN;
if(payMarker){try{const pm=JSON.parse(payMarker[1]);if(!Number.isFinite(paidAmount))paidAmount=Number(pm.monto_entregado||pm.monto_pagado||pm.recibido);if(!Number.isFinite(changeAmount))changeAmount=Number(pm.vuelto||pm.cambio);}catch(e){}}
const payDetails=String(pay).toLowerCase().includes("efectivo")
? `<div class="adminOrderField"><span class="adminOrderLabel">¿Con cuánto paga?</span><div class="adminOrderValue">${Number.isFinite(paidAmount)&&paidAmount>=0?`S/ ${paidAmount.toFixed(2)}`:"No registrado"}</div></div><div class="adminOrderField"><span class="adminOrderLabel">Vuelto</span><div class="adminOrderValue">${Number.isFinite(changeAmount)&&changeAmount>=0?`S/ ${changeAmount.toFixed(2)}`:"No registrado"}</div></div>`
: `<div class="adminOrderField"><span class="adminOrderLabel">Pago</span><div class="adminOrderValue">${esc(pay)}</div></div>`;
return `<div class="adminOrderSection">
        <div class="adminOrderSectionTitle">Información del negocio</div>
        <div class="adminOrderGrid">
          <div class="adminOrderField"><span class="adminOrderLabel">Nombre del negocio</span><div class="adminOrderValue">${esc(businessName)}</div></div>
          <div class="adminOrderField"><span class="adminOrderLabel">Número del negocio</span><div class="adminOrderValue">${esc(businessPhone||"No registrado")}</div>${businessPhone?serviceContact(businessPhone):""}</div>
          <div class="adminOrderField"><span class="adminOrderLabel">Dirección del negocio</span><div class="adminOrderValue normal">${esc(businessAddress)}</div></div>
          <div class="adminOrderField"><span class="adminOrderLabel">Ubicación del negocio</span><div class="adminOrderValue normal">${businessLocation?`<a class="adminOrderLocation" href="${esc(/^https?:\/\//i.test(String(businessLocation))?businessLocation:("https://www.google.com/maps?q="+encodeURIComponent(String(businessLocation))) )}" target="_blank" rel="noopener noreferrer">Abrir ubicación</a>`:"No registrada"}</div></div>
        </div>
      </div>
      <div class="adminOrderSection">
        <div class="adminOrderSectionTitle">Resumen del pedido</div>
        <div class="adminOrderValue normal">${(Array.isArray(o.detalle_pedidos)?o.detalle_pedidos:[]).map(d=>`${esc(d.nombre_producto||d.producto_nombre||d.nombre||"Producto")} × ${Number(d.cantidad||1)}`).join(" · ") || productRows}</div>
        <div class="adminOrderValue" style="margin-top:8px;font-size:14px;color:var(--fr-muted)">
          Productos: S/ ${Number(fin.subtotal||0).toFixed(2)} · Delivery: S/ ${Number(fin.delivery||0).toFixed(2)}${fin.km!=null?` (${Number(fin.km).toFixed(1)} km)`:""}
        </div>
        <div class="adminOrderValue" style="margin-top:5px;font-weight:700">Total: S/ ${Number(o.total||0).toFixed(2)}</div>
      </div>
      <div class="adminOrderSection">
        <div class="adminOrderSectionTitle">Información de entrega</div>
        <div class="adminOrderGrid">
          <div class="adminOrderField"><span class="adminOrderLabel">Nombre del cliente</span><div class="adminOrderValue">${esc(clientName)}</div></div>
          <div class="adminOrderField"><span class="adminOrderLabel">Número del cliente</span><div class="adminOrderValue">${esc(clientPhone||"No registrado")}</div>${clientPhone?serviceContact(clientPhone):""}</div>
          <div class="adminOrderField"><span class="adminOrderLabel">Dirección del cliente</span><div class="adminOrderValue normal">${esc(clientAddress)}</div></div>
          <div class="adminOrderField"><span class="adminOrderLabel">Ubicación indicada por el cliente</span><div class="adminOrderValue normal">${clientLocation}</div></div>
        </div>
      </div>
      <div class="adminOrderSection">
        <div class="adminOrderSectionTitle">Tipo de pago</div>
        <div class="adminOrderGrid">
          <div class="adminOrderField"><span class="adminOrderLabel">Método de pago</span><div class="adminOrderValue">${esc(pay)}</div></div>
          ${payDetails}
        </div>
      </div>`;
})() : "";
let pdListHtml="";
const pdRouteHtml=(()=>{
const pdLink=v=>{const s=String(v||"").trim();if(!s)return "";return /^https?:\/\//i.test(s)?s:"https://www.google.com/maps?q="+encodeURIComponent(s);};
const pdNoteUrl=label=>{const m=rawOrderNotes.match(new RegExp(label+"\\s*:\\s*(https?:\\/\\/[^|\\s]+)","i"));return m?m[1]:"";};
const pdLatLng=(lat,lng)=>{const a=Number(lat),b=Number(lng);return Number.isFinite(a)&&Number.isFinite(b)&&a!==0&&b!==0?"https://www.google.com/maps?q="+encodeURIComponent(a+","+b):"";};
const pdChips=(phone,map)=>{
const d=String(phone||"").replace(/\D/g,"");const intl=d?(d.startsWith("51")?d:(d.length===9?"51"+d:d)):"";
let h="";
if(intl)h+=`<a class="pdRouteChip" href="tel:+${esc(intl)}">Llamar</a><a class="pdRouteChip" href="https://wa.me/${esc(intl)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>`;
if(map)h+=`<a class="pdRouteChip" href="${esc(map)}" target="_blank" rel="noopener noreferrer">Ubicación</a>`;
return h?`<div class="pdRouteChips">${h}</div>`:"";
};
const tipo=String(o.tipo_servicio||o.servicio||o.tipo||"").toLowerCase();
const isCompra=tipo.includes("compra");
let from={},to={};
if(isBusinessOrder&&!isRecojoEntrega&&!isEncomienda&&!isCompra){
let bp=null;[o.negocio_id,o.restaurante_id,o.business_id].filter(Boolean).some(id=>(bp=adminRestaurantsById?.get(String(id))||null));
bp=bp||{};
from={label:"Recojo · Negocio",name:bp.nombre||o.nombre_negocio||o.negocio_nombre||o.restaurante_nombre||"Negocio",addr:bp.direccion||o.direccion_negocio||"",phone:restaurantPhoneValue(bp)||o.telefono_negocio||"",map:pdLink(bp.google_maps_url||bp.ubicacion_url||"")||pdLatLng(bp.latitud,bp.longitud)};
to={label:"Entrega · Cliente",name:o.nombre_cliente||o.cliente_nombre||"Cliente",addr:o.direccion_entrega||"",ref:o.referencia_entrega||"",phone:o.telefono_cliente||o.cliente_telefono||"",map:pdLatLng(o.latitud_entrega,o.longitud_entrega)||pdNoteUrl("Ubicaci[oó]n de entrega")};
}else if(isEncomienda){
from={label:"Recojo · Quien envía",name:o.nombre_remitente||o.nombre_cliente||"",addr:o.direccion_recojo||"",phone:o.telefono_remitente||o.telefono_cliente||"",map:pdLatLng(o.latitud_recojo,o.longitud_recojo)||pdNoteUrl("Ubicaci[oó]n de recojo")};
to={label:"Destino · Quien recibe",name:o.nombre_receptor||"",addr:[o.agencia_destino||o.referencia_entrega,o.destino_final||o.direccion_entrega].filter(Boolean).join(" → "),phone:o.telefono_receptor||"",map:""};
}else if(isCompra){
from={label:"Compra en",name:o.direccion_recojo||"Lugar no indicado",addr:"",phone:"",map:""};
to={label:"Entrega · Cliente",name:o.nombre_cliente||"",addr:o.direccion_entrega||"",phone:o.telefono_cliente||"",map:pdNoteUrl("Ubicaci[oó]n")};
}else{
from={label:"Recojo · Quien envía",name:o.nombre_remitente||o.nombre_cliente||"",addr:o.direccion_recojo||"",phone:o.telefono_remitente||o.telefono_cliente||"",map:pdNoteUrl("Ubicaci[oó]n de recojo")};
to={label:"Entrega · Quien recibe",name:o.nombre_receptor||o.nombre_cliente||"",addr:o.direccion_entrega||"",phone:o.telefono_receptor||"",map:pdNoteUrl("Ubicaci[oó]n de entrega")||pdLatLng(o.latitud_entrega,o.longitud_entrega)};
}
const stop=(s,last)=>`<div class="pdRouteStop${last?" is-last":""}"><span class="pdRouteDot"></span><div class="pdRouteStopBody"><div class="pdRouteKicker">${esc(s.label)}</div><div class="pdRouteName">${esc(s.name||"No registrado")}</div>${s.addr?`<div class="pdRouteAddr">${esc(s.addr)}</div>`:""}${s.ref?`<div class="pdRouteRef">Referencia: ${esc(s.ref)}</div>`:""}${pdChips(s.phone,s.map)}</div></div>`;
const steps=["Pedido recibido","Motorizado asignado","Pedido aceptado","En camino","En entrega","Entregado"];
const idx=adminOrderFlowIndex(o.estado);
const bars=steps.map((_,i)=>`<span class="${idx>=0&&i<=idx?"on":""}"></span>`).join("");
const stepText=idx<0?"Pedido cancelado":`Paso ${idx+1} de 6 · ${(idx===0&&o.negocio_id&&!o.motorizado_id)?(o.listo_para_recojo===true?"Listo en el negocio · falta asignar motorizado":(String(o.estado||"").toLowerCase()==="confirmado"?"El negocio lo está preparando":"Esperando que el negocio confirme")):steps[idx]}`;
const moto=o.motorizados?.nombre_completo?` · Motorizado: ${esc(o.motorizados.nombre_completo)}`:"";
let products="";
if(details.length){
products=`<div class="pdRouteBlock"><div class="pdRouteKicker">Productos</div>${details.map(d=>{const q=Number(d.cantidad||1),u=Number(d.precio_unitario??d.precio),s=Number(d.subtotal??(Number.isFinite(u)?u*q:NaN));return `<div class="pdRouteLine"><span>${q} × ${esc(d.nombre_producto||d.producto||"Producto")}</span><span>${Number.isFinite(s)?"S/ "+s.toFixed(2):""}</span></div>`;}).join("")}</div>`;
}
const total=Number(o.total||0);
const metodoTxt=method==="yape"?"Yape":method==="efectivo"?"Efectivo":(o.metodo_pago||"No registrado");
let payState=o.pago_confirmado===true?"Pago confirmado":"Pendiente";
if(method==="yape"&&o.pago_confirmado!==true)payState=proof?"Captura por revisar":"Se cobra al recibir";
if(method==="yape"&&o.pago_confirmado!==true&&!proof&&!o.pago_acordado&&/coordin/i.test((rawOrderNotes.match(/Pago Yape:\s*([^|·]*)/i)||[])[1]||""))payState="Coordina con el negocio";
const encMom=isEncomienda?(String(o.pago_servicio_momento||"").toLowerCase()||(o.pago_confirmado===true?"pagado":(method==="yape"?"recojo_yape":"recojo_efectivo"))):"";
if(isEncomienda&&o.pago_confirmado!==true){payState=encMom==="al_final"?"Paga después de recibir la guía":encMom==="recojo_yape"?"Yape al recoger encomienda":"Efectivo al recoger encomienda";}
if(isEncomienda&&o.pago_confirmado===true&&(encMom==="recojo_efectivo"||encMom==="recojo_yape")&&Number(o.monto_recibido)>0)payState="Cobrado al recoger";
const isRecojoSvc=String(o.tipo_servicio||"").toLowerCase().includes("recojo");
if(isRecojoSvc&&method!=="pagado"){const rm=String(o.pago_servicio_momento||"").toLowerCase();
if(o.pago_confirmado!==true)payState=(rm==="recojo_efectivo"||rm==="recojo_yape")?"Se cobra al recoger (paga quien envía)":"Se cobra al entregar (paga quien recibe)";
else if((rm==="recojo_efectivo"||rm==="recojo_yape")&&Number(o.monto_recibido)>0)payState="Cobrado al recoger";}
const soloDel=!isEncomienda&&!isCompra&&o.pago_acordado==="solo_delivery";
const todoNeg=!isEncomienda&&!isCompra&&o.pago_acordado==="pagado";
let payExtra="";
if(isCompra){const sub=Number(o.subtotal)||0,sv=Number(o.costo_delivery)||(sub>0?Math.max(0,total-sub):total);payExtra+=`<div class="pdRouteLine"><span>Gasto de la compra</span><span>${sub>0?"S/ "+sub.toFixed(2):"Aún no registrado"}</span></div><div class="pdRouteLine"><span>Servicio</span><span>S/ ${sv.toFixed(2)}</span></div>`;}
else if(!isEncomienda&&(details.length||o.negocio_id||o.restaurante_id)&&(details.length||fin.delivery)){payExtra+=`<div class="pdRouteLine"><span>${todoNeg||soloDel?"Productos (pagados al negocio)":"Subtotal"}</span><span>S/ ${Number(fin.subtotal||0).toFixed(2)}</span></div>${todoNeg||soloDel?"":`<div class="pdRouteLine"><span>Delivery${fin.km!=null?" · "+Number(fin.km).toFixed(1)+" km":""}</span><span>S/ ${Number(fin.delivery||0).toFixed(2)}</span></div>`}`;}
var encAg=0,encSvPag=false,encAgPag=false,encDebe=0,encSum=total;
if(isEncomienda){encAg=Number(o.monto_pagado_agencia)||0;encSvPag=o.pago_confirmado===true||encMom==='pagado';encAgPag=encAg>0&&String(o.observaciones||'').includes('AGENCIA_REEMBOLSADA');
encSum=Math.round((total+encAg)*100)/100;encDebe=Math.round(((encSvPag?0:total)+(encAg>0&&!encAgPag?encAg:0))*100)/100;
const tag=(ok,a,b)=>`<span class="pdEncTag ${ok?'ok':'warn'}">${ok?a:b}</span>`;
payExtra+=`<div class="pdRouteLine"><span>Delivery (servicio)</span><span>S/ ${total.toFixed(2)} ${tag(encSvPag,'pagado','por cobrar')}</span></div>`;
if(encAg>0)payExtra+=`<div class="pdRouteLine"><span>Pago en agencia</span><span>S/ ${encAg.toFixed(2)} ${tag(encAgPag,'pagado','por cobrar')}</span></div>`;
else if(String(o.tipo_pago_encomienda||'').includes('destino'))payExtra+=`<div class="pdRouteLine"><span>Pago en agencia</span><span>Se paga en destino</span></div>`;}
let payActions="";
if(method==="efectivo"){
const c=cashPaymentData(o);
if(c.paid!=null){const vt=isCompra&&!(Number(o.subtotal)>0)?'Se calcula al registrar la compra':'S/ '+(isCompra?Math.max(0,c.paid-total):Number(c.change||0)).toFixed(2);payExtra+=`<div class="pdRouteLine"><span>Paga con</span><span>S/ ${c.paid.toFixed(2)}</span></div><div class="pdRouteLine"><span>Vuelto</span><span>${vt}</span></div>`;}
else if(!isCompra&&!soloDel&&!todoNeg&&(o.negocio_id||o.restaurante_id)){payExtra+=`<div class="pdRouteLine"><span>Paga con</span><span>${o.pago_acordado?"Lo registra el motorizado al cobrar":"El negocio coordina el pago"}</span></div>`;}
else if(!isCompra&&!soloDel&&!todoNeg&&o.pago_confirmado!==true&&total>0&&!["entregado","cancelado"].includes(String(o.estado||"").toLowerCase())){payActions+=`<div class="pdRouteCash"><input class="cashPaidInput" data-id="${esc(String(o.id))}" type="number" min="${total.toFixed(2)}" step="0.01" inputmode="decimal" placeholder="Monto recibido" aria-label="Monto recibido"><button type="button" class="btn alt" onclick="registerCashPayment('${esc(String(o.id))}')">Registrar monto</button></div>`;}
}
if(method==="yape"&&proof){
payActions+=`<button type="button" class="btn alt" onclick="toggleYapeProof('${esc(String(o.id))}')">Ver captura</button><div id="yapeProof-${esc(String(o.id))}" style="display:none"><a href="${esc(proof)}" target="_blank" rel="noopener"><img src="${esc(proof)}" alt="Captura de pago Yape" style="display:block;width:100%;max-height:480px;object-fit:contain;border:1px solid var(--fr-line);border-radius:12px;background:#fff"></a></div>`;
}
const pay=`<div class="pdRoutePay"><div class="pdRouteLine"><span>Método de pago</span><strong>${esc(metodoTxt)}</strong></div><div class="pdRouteLine"><span>Estado del pago</span><span class="pdRoutePill">${esc(payState)}</span></div>${soloDel||todoNeg?`<div class="pdRouteLine"><span>Total del pedido</span><strong>S/ ${total.toFixed(2)}</strong></div>`:""}${payExtra}<div class="pdRouteTotal"><span>${isEncomienda?(encDebe>0?"Monto a cobrar":"Total (todo pagado)"):soloDel?"Delivery · cobrar al cliente":todoNeg?((/DELIVERY PAGADO POR EL NEGOCIO/i.test(String(o.observaciones||""))||o.delivery_negocio_cobrado_en)?"Delivery pagado a Pidemás":"Delivery · por cobrar al negocio"):o.pago_confirmado===true?"Total cobrado":isCompra&&!(Number(o.subtotal)>0)?"Monto a cobrar (falta la compra)":"Monto a cobrar"}</span><strong>S/ ${(isEncomienda?(encDebe>0?encDebe:encSum):soloDel||todoNeg?Number(o.costo_delivery||0):total).toFixed(2)}</strong></div>${payActions?`<div class="pdRoutePayActions">${payActions}</div>`:""}</div>`;
const notes=orderNotes?`<div class="pdRouteBlock"><div class="pdRouteKicker">Notas del servicio</div><div class="pdRouteNotes">${esc(orderNotes)}</div></div>`:"";
let mainActions="";
if(method==="yape"&&o.pago_confirmado!==true&&proof)mainActions+=`<button type="button" class="btn approveOrderBtn pdRouteWide">Confirmar pago Yape</button><button type="button" class="btn alt rejectOrderBtn pdRouteWide">Rechazar pago</button>`;
else if(genericActions)mainActions+=genericActions.replace('class="btn approveOrderBtn"','class="btn approveOrderBtn pdRouteWide"').replace('class="btn alt rejectOrderBtn"','class="btn alt rejectOrderBtn pdRouteWide"');
const wa=(o.negocio_id||o.restaurante_id||o.business_id)?`<button type="button" class="btn alt shareRestaurantWhatsAppBtn pdRouteWide">Enviar pedido al restaurante por WhatsApp</button>`:"";
const pendingAttention=idx===0;
const listBars=steps.map((_,i)=>`<span class="${idx>=0&&i<=idx?"on":""}"></span>`).join("");
pdListHtml=`<button type="button" class="pdList" aria-label="Abrir pedido #${esc(orderIdShort)}">
        <span class="pdListTop"><span class="pdListKicker">${esc(serviceTypeText)}</span><span class="pdListPill${pendingAttention?" is-new":""}${idx<0?" is-off":""}">${esc(orderStatusLabel(o.estado))}</span></span>
        <span class="pdListCode">#${esc(orderIdShort)}</span>
        <span class="pdListMeta">${esc(formatDate(o.creado_en))}${o.motorizados?.nombre_completo?" · "+esc(o.motorizados.nombre_completo):" · Sin motorizado"}</span>
        <span class="pdListBars">${listBars}</span>
        <span class="pdListRoute"><span class="pdListDot"></span><span class="pdListPlace">${esc(from.name||"—")}</span><span class="pdListArrow" aria-hidden="true">→</span><span class="pdListDot is-end"></span><span class="pdListPlace">${esc(to.name||"—")}</span></span>
        <span class="pdListFoot"><span>${esc(metodoTxt)} · ${esc(payState)}</span><strong>S/ ${(isEncomienda?encSum:total).toFixed(2)}</strong></span>
      </button>`;
return `<div class="pdRoute">
        <div class="pdRouteBand">
          <div class="pdRouteBandTop"><span class="pdRouteBandKicker">${esc(serviceTypeText)}</span><span class="pdRouteBandPill">${esc(orderStatusLabel(o.estado))}</span></div>
          <div class="pdRouteCode">#${esc(orderIdShort)}</div>
          <div class="pdRouteMeta">${esc(formatDate(o.creado_en))}${moto}</div>
          <div class="pdRouteBars">${bars}</div>
          <div class="pdRouteMeta">${stepText}</div>
          <div class="pdRouteBandBtns"><button type="button" class="pdRouteBandBtn pdRouteTrack">Seguimiento</button><button type="button" class="pdRouteBandBtn pdRouteClose">Cerrar detalle</button></div>
        </div>
        <div class="pdRouteStops">${stop(from,false)}${stop(to,true)}</div>
        ${products}${notes}${pay}
        <div class="pdRouteActions">${mainActions}<button type="button" class="btn alt pdRouteEdit">Editar</button>${wa}</div>
      </div>`;
})();
const row=document.createElement("div");
row.className="adminOrderCard";
row.setAttribute("data-order-id",String(o.id));
if(expandedOrderCards.has(String(o.id))) row.classList.add("is-expanded");
row.dataset.orderId=String(o.id);
row.innerHTML=`
      <div class="adminOrderSection adminServiceTypeBanner"><div class="adminServiceBannerRow"><div class="adminOrderSectionTitle">${esc(serviceTypeText)}</div><button type="button" class="adminTrackingOpenBtn" data-tracking-order="${esc(String(o.id))}">Seguimiento</button></div></div>
      ${pdListHtml}
      ${pdRouteHtml}
      ${encomiendaGuideSection}
      <div class="adminOrderHeader">
        <div class="adminOrderIdentity"><div class="adminOrderTitle">Pedido #${esc(orderIdShort)}</div>${o.motorizado_id && o.motorizados?.nombre_completo ? `<span class="adminMotoNamePill" aria-label="Motorizado asignado">${esc(o.motorizados.nombre_completo)}</span>` : ""}<div class="adminOrderDate">${formatDate(o.creado_en)}</div></div>
        <div class="adminOrderHeaderRight"><span class="badge">${esc(orderStatusLabel(o.estado))}</span><div class="orderIconActions"><button type="button" class="orderIconEdit editOrderBtn" aria-label="Editar pedido" title="Editar pedido">✎</button></div></div>
      </div>
      <div class="adminOrderSection pdRouteAssign">
        <div class="adminOrderSectionTitle">Motorizado asignado</div>
        <div class="adminOrderAssign">${(()=>{
          const yapeConfirmado=method==="yape" && o.pago_confirmado===true;
          const canAssign=["confirmado","aceptado","pedido_aceptado","asignado"].includes(estado) || yapeConfirmado;
          const assigned=!!o.motorizado_id;
          

          const motoAccepted=["aceptado","pedido_aceptado","en_camino","camino_recojo","en_entrega","camino_entrega","confirmando_pago","entregado"].includes(estado);
          const controlsDisabled=!canAssign || assigned || motoAccepted;
          const selectedId=previousMotoSelections[String(o.id)]||o.motorizado_id||"";
          return `<select class="motoSelect" data-order-id="${esc(String(o.id))}" ${controlsDisabled?"disabled":""}><option value="">Seleccionar motorizado</option>${allMotos.length?allMotos.map(m=>{return `<option value="${m.id}" ${String(selectedId)===String(m.id)?"selected":""}>${esc(m.nombre_completo||"Motorizado")}${m.en_descanso?" · En descanso":m.disponible?" · Disponible":""}</option>`}).join(""):'<option value="" disabled>No hay motorizados cargados</option>'}</select><button class="btn assignBtn ${motoAccepted?"accepted-state":""}" type="button" ${(!canAssign||assigned||motoAccepted)?"disabled":""}>${assigned?"Asignado":"Asignar"}</button>${assigned&&!motoAccepted?`<button class="btn alt unassignBtn" type="button">Quitar asignación</button>`:""}`;
        })()}</div>
      </div>`;
row.querySelector(".adminServiceTypeBanner")?.addEventListener("click",()=>{
row.classList.toggle("is-expanded");
});
row.querySelector(".adminOrderHeader")?.addEventListener("click",ev=>{
if(ev.target.closest("button,a")) return;
row.classList.toggle("is-expanded");
});
row.querySelector(".adminToggleGuideBtn")?.addEventListener("click",ev=>{
const btn=ev.currentTarget;
const preview=row.querySelector(`#adminGuidePreview-${CSS.escape(String(o.id))}`);
if(!preview)return;
const opening=preview.style.display==="none";
preview.style.display=opening?"block":"none";
btn.textContent=opening?"Ocultar guía":"Ver guía aquí";
});
const motoSelect=row.querySelector(".motoSelect");
motoSelect.addEventListener("change",()=>{
motoSelect.dataset.selectedValue=motoSelect.value;
});
row.querySelector(".assignBtn").onclick=()=>assignOrder(o.id,motoSelect.value);
row.querySelector(".editOrderBtn").onclick=()=>editOrder(o.id);
const toggleProductsBtn=row.querySelector(".toggleOrderProductsBtn");
const productsContent=row.querySelector(".adminOrderProductsContent");
if(toggleProductsBtn && productsContent){
const isExpanded=expandedOrderProducts.has(String(o.id));
productsContent.style.display=isExpanded?"":"none";
toggleProductsBtn.onclick=()=>{
const hidden=productsContent.style.display==="none";
productsContent.style.display=hidden?"":"none";
toggleProductsBtn.textContent=hidden?"Ocultar pedido":"Mostrar pedido";
toggleProductsBtn.setAttribute("aria-expanded",hidden?"true":"false");
};
}
row.querySelector(".pdList")?.addEventListener("click",()=>{row.classList.add("is-expanded");row.scrollIntoView({block:"start",behavior:"smooth"});});
row.querySelector(".pdRouteEdit")?.addEventListener("click",()=>editOrder(o.id));
row.querySelector(".pdRouteClose")?.addEventListener("click",()=>row.classList.remove("is-expanded"));
row.querySelector(".pdRouteTrack")?.addEventListener("click",ev=>{const b=ev.currentTarget;row.querySelector(".adminTrackingOpenBtn")?.click();setTimeout(()=>{b.textContent=row.querySelector(".adminOrderInlineTracking")?"Ocultar seguimiento":"Seguimiento";},30);});
const shareBtn=row.querySelector(".shareRestaurantWhatsAppBtn");
if(shareBtn)shareBtn.onclick=()=>shareOrderWithRestaurantWhatsApp(o.id);
const un=row.querySelector(".unassignBtn");if(un)un.onclick=()=>assignOrder(o.id,null);
const ap=row.querySelector(".approveOrderBtn");if(ap){
ap.type="button";
ap.onclick=(ev)=>{
ev.preventDefault();ev.stopPropagation();
if(method==="yape") confirmAdminYapePayment(o.id);
else if(method==="efectivo") acceptCashOrder(o.id);
else approveOrder(o.id);
};
}
const rj=row.querySelector(".rejectOrderBtn");if(rj)rj.onclick=()=>rejectOrder(o.id);
const selBox=document.createElement("label");
selBox.className="pdSelChk";
selBox.title="Seleccionar pedido";
selBox.innerHTML='<input type="checkbox" aria-label="Seleccionar pedido"><span aria-hidden="true"></span>';
const selInput=selBox.querySelector("input");
selInput.checked=selectedOrders.has(String(o.id));
selBox.addEventListener("click",ev=>ev.stopPropagation());
selInput.addEventListener("change",()=>{
if(selInput.checked)selectedOrders.add(String(o.id));else selectedOrders.delete(String(o.id));
updateOrderBulkBar();
});
row.appendChild(selBox);
list.appendChild(row);
});
updateOrderBulkBar();
if(expandedTrackingOrderId){
window.setTimeout(()=>{
const btn=Array.from(list.querySelectorAll(".adminTrackingOpenBtn")).find(b=>String(b.dataset.trackingOrder)===String(expandedTrackingOrderId));
if(btn && !btn.closest(".adminOrderCard")?.querySelector(".adminOrderInlineTracking")) btn.click();
},0);
}
}
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
async function restoreRejectedOrderStock(pedido){
const details=Array.isArray(pedido?.detalle_pedidos)?pedido.detalle_pedidos:[];
if(!details.length) throw new Error("No se encontraron los productos del pedido; no se puede devolver el stock automáticamente.");
for(const item of details){
const qty=Math.max(1,Math.floor(Number(item.cantidad||item.quantity||1)));
let productId=item.producto_id||item.product_id||item.id_producto||item.producto_negocio_id||item.negocio_producto_id||item.id_producto_negocio||null;
let product=null;
if(productId){
const found=await db.from("productos_negocio").select("*").eq("id",productId).maybeSingle();
if(!found.error && found.data) product=found.data;
}
if(!product){
const name=String(item.nombre_producto||item.producto||item.nombre||"").trim();
if(!name) throw new Error("Un producto del pedido no tiene identificador ni nombre.");
let q=db.from("productos_negocio").select("*").eq("nombre",name);
if(pedido.negocio_id) q=q.eq("negocio_id",pedido.negocio_id);
const found=await q.limit(2);
if(found.error) throw found.error;
if(!found.data || found.data.length!==1) throw new Error("No se pudo identificar de forma única el producto: "+name);
product=found.data[0];
productId=product.id;
}
const rpc=await db.rpc("increment_product_negocio_stock",{p_product_id:productId,p_quantity:qty});
if(rpc.error){
const stockKey=["stock","stock_actual","cantidad_stock","existencias","cantidad_disponible"].find(k=>Object.prototype.hasOwnProperty.call(product,k));
if(!stockKey) throw new Error("El producto "+(product.nombre||productId)+" no tiene una columna de stock reconocida: "+rpc.error.message);
const update={ [stockKey]:Math.max(0,Number(product[stockKey]||0))+qty };
if(Object.prototype.hasOwnProperty.call(product,"disponible")) update.disponible=true;
const fallback=await db.from("productos_negocio").update(update).eq("id",productId);
if(fallback.error) throw new Error("No se pudo devolver el stock de "+(product.nombre||productId)+": "+fallback.error.message);
}
}
}
async function rejectOrder(orderId){
clearMsg($("ordersMsg"));
const pedido=allOrders.find(o=>String(o.id)===String(orderId));
if(!pedido)return;
if(String(pedido.estado||"").toLowerCase()==="cancelado"){
msg($("ordersMsg"),"Este pedido ya está cancelado. No se volverá a devolver stock para evitar duplicarlo.");
return;
}
const motivo=(await pdPedir("Motivo del rechazo (opcional):","Pago no confirmado"));
if(motivo===null)return;
try{
msg($("ordersMsg"),"Devolviendo productos al stock…");
await restoreRejectedOrderStock(pedido);
}catch(stockError){
console.error("Error devolviendo stock del pedido rechazado:",stockError);
msg($("ordersMsg"),"No se pudo rechazar el pedido porque falló la devolución del stock: "+(stockError?.message||stockError)+". No se cambió el estado del pedido.");
return;
}
const old=String(pedido.observaciones||"").trim();
const obs=(old?old+" · ":"")+"PEDIDO RECHAZADO POR ADMINISTRACIÓN · STOCK DEVUELTO"+(motivo.trim()?" · "+motivo.trim():"");
const {data,error}=await db.from("pedidos").update({estado:"cancelado",pago_confirmado:false,observaciones:obs}).eq("id",orderId).neq("estado","cancelado").select("*").maybeSingle();
if(error||!data){
msg($("ordersMsg"),"Se devolvió el stock, pero no se pudo actualizar el pedido. No vuelvas a rechazarlo para evitar duplicar stock; actualiza el pedido manualmente o avisa al soporte.");
return;
}
await notifyClientByOrder(pedido,"pedido_rechazado","Pedido rechazado",`Tu pedido #${String(orderId).slice(0,8).toUpperCase()} fue rechazado por administración.${motivo.trim()?" Motivo: "+motivo.trim():""}`);
if(pedido.motorizado_id){
const moto=allMotos.find(m=>String(m.id)===String(pedido.motorizado_id));
if(moto?.usuario_id) await db.from("notificaciones").insert({usuario_id:moto.usuario_id,pedido_id:orderId,tipo:"pedido_cancelado",titulo:"Pedido cancelado por administración",mensaje:`El pedido #${String(orderId).slice(0,8).toUpperCase()} fue rechazado/cancelado por administración.`,leida:false});
}
msg($("ordersMsg"),"Pedido rechazado y stock devuelto a la tienda.");
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
const panelUrl="https://pidemasdelivery.github.io/motorizado/";
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
$("guardarCliente")?.addEventListener("click",guardarClienteAdmin);
$("cancelarCliente")?.addEventListener("click",()=>{limpiarFormularioCliente();clearMsg($("clienteMsg"));});
$("refreshClientes")?.addEventListener("click",loadClientes);
$("buscarClientesRegistrados")?.addEventListener("input",renderClientes);
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

/* ===== pidemas-limpiar-emojis-iconos ===== */
try{
(function(){
function clean(root){
(root||document).querySelectorAll('h1,h2,h3,h4,.adminOrderSectionTitle,.adminOrderSectionTitle span,strong,label,#adminBottomNav button').forEach(el=>{
if(el.closest('.brand-logo')) return;
for(const n of [...el.childNodes]){
if(n.nodeType===3){const t=n.textContent.replace(/^\s*[\p{Extended_Pictographic}\uFE0F\u200D]+\s*/u,'');if(t!==n.textContent)n.textContent=t;}
else if(n.nodeType===1 && !n.matches('svg,img,button')) {
for(const c of [...n.childNodes]) if(c.nodeType===3){const t=c.textContent.replace(/^\s*[\p{Extended_Pictographic}\uFE0F\u200D]+\s*/u,'');if(t!==c.textContent)c.textContent=t;}
}
}
});
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>clean(document)); else clean(document);
let __ceT=0;new MutationObserver(()=>{if(__ceT)return;__ceT=setTimeout(()=>{__ceT=0;clean(document)},250)}).observe(document.documentElement,{subtree:true,childList:true});
})();
}catch(e){console.error("[pidemas-limpiar-emojis-iconos]",e)}

/* ===== pidemas-page-view-body-state ===== */
try{
(function(){
const sync=()=>{
const open=!!document.querySelector('#pidemasUniversalModal.open, #pidemasUniversalModal[aria-hidden="false"], #adminOrderTrackingModal:not([hidden]), #pidemasProductsModal:not([hidden])');
document.body.classList.toggle('pidemas-page-view-open',open);
};
const obs=new MutationObserver(sync);
document.addEventListener('DOMContentLoaded',()=>{
['pidemasUniversalModal','adminOrderTrackingModal','pidemasProductsModal'].forEach(id=>{const el=document.getElementById(id);if(el)obs.observe(el,{attributes:true,attributeFilter:['class','style','hidden','aria-hidden']});});sync();
});
document.addEventListener('click',()=>setTimeout(sync,0),true);
window.addEventListener('keydown',e=>{if(e.key==='Escape')setTimeout(sync,0)});
})();
}catch(e){console.error("[pidemas-page-view-body-state]",e)}

/* ===== pidemas-real-page-navigation ===== */
try{
(function(){
const ids=['pidemasUniversalModal','adminOrderTrackingModal','pidemasProductsModal'];
function setup(){
const wrap=document.querySelector('main.wrap'); if(!wrap)return;
ids.forEach(id=>{const el=document.getElementById(id);if(el&&el.parentElement!==wrap)wrap.appendChild(el);});
const sync=()=>{
const universal=document.getElementById('pidemasUniversalModal');
const tracking=document.getElementById('adminOrderTrackingModal');
const products=document.getElementById('pidemasProductsModal');
const open=!!((universal&&universal.classList.contains('open'))||(universal&&universal.getAttribute('aria-hidden')==='false')||(tracking&& !tracking.hidden)||(products&& !products.hidden));
document.body.classList.toggle('pidemas-page-view-open',open);
ids.forEach(id=>{
const el=document.getElementById(id);
if(!el)return;
const desired=((id==='pidemasUniversalModal'&&(el.classList.contains('open')||el.getAttribute('aria-hidden')==='false'))||(id==='adminOrderTrackingModal'&&!el.hidden)||(id==='pidemasProductsModal'&&!el.hidden))?'block':'none';
if(el.style.display!==desired)el.style.display=desired;
});
};
const obs=new MutationObserver(sync);
ids.forEach(id=>{const el=document.getElementById(id);if(el)obs.observe(el,{attributes:true,attributeFilter:['class','style','hidden','aria-hidden']});});
document.addEventListener('click',()=>setTimeout(sync,0),true);
document.addEventListener('keydown',()=>setTimeout(sync,0));
sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
}catch(e){console.error("[pidemas-real-page-navigation]",e)}

/* ===== pidemas-titulos-unificados-js ===== */
try{
(function(){
const labels={
restaurantes:'Inicio', pedidos:'Pedidos', clientes:'Clientes', caja:'Cajas', sueldo:'Sueldos',
agencias:'Agencias'
};
const app=document.getElementById('appView');
function makeTitle(el,text){
if(!el)return;
if(el.textContent!==text)el.textContent=text;
if(!el.classList.contains('adminPageTitle'))el.classList.add('adminPageTitle');
}
function ensureSectionTitle(name){
const section=document.getElementById('tab-'+name); if(!section)return;
let heading=section.querySelector(':scope > .adminPageTitle');
if(!heading){
const first=section.querySelector(':scope > div:first-child h2, :scope > h2, :scope > h1');
if(first){heading=first; makeTitle(heading,labels[name]||first.textContent.trim());}
else {heading=document.createElement('h2'); heading.className='adminPageTitle'; heading.textContent=labels[name]||name; section.insertBefore(heading,section.firstChild);}
} else makeTitle(heading,labels[name]||name);
if(heading) makeTitle(heading,labels[name]||name);
}
function updateSection(name){
if(!app)return;
Object.keys(labels).forEach(k=>{const sec=document.getElementById('tab-'+k); if(sec&&!sec.classList.contains('hidden'))ensureSectionTitle(k);});
if(name && labels[name])ensureSectionTitle(name);
}
function normalizeServiceTitle(button){
const label=button?.querySelector('.serviceTitleAdmin')?.textContent?.trim();
if(!label)return;
const modal=document.getElementById('pidemasUniversalModal');
if(!modal)return;
const body=modal.querySelector('.pidemasModalBody');
if(!body)return;
const heading=body.querySelector('h1,h2,h3');
if(heading){makeTitle(heading,label);}
}
document.addEventListener('click',function(e){
const tab=e.target.closest('[data-side-tab],[data-admin-tab],.tab[data-tab]');
if(tab){let name=tab.dataset.sideTab||tab.dataset.adminTab||tab.dataset.tab; if(name==='servicios')name='restaurantes'; setTimeout(()=>updateSection(name),50);}
const service=e.target.closest('.serviceBtn'); if(service)setTimeout(()=>normalizeServiceTitle(service),120);
},true);
const observer=new MutationObserver(()=>{
const modal=document.getElementById('pidemasUniversalModal');
if(modal && modal.getAttribute('aria-hidden')==='false' && !modal.dataset.pdTitleStyled){
const h=modal.querySelector('.pidemasModalBody h1,.pidemasModalBody h2,.pidemasModalBody h3');
if(h){if(!h.classList.contains('adminPageTitle'))h.classList.add('adminPageTitle');modal.dataset.pdTitleStyled='1';}
}
});
if(document.body)observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','style']});
document.addEventListener('DOMContentLoaded',()=>{
Object.keys(labels).forEach(ensureSectionTitle);
const active=document.querySelector('[data-side-tab].active'); updateSection(active?.dataset.sideTab||'restaurantes');
});
Object.keys(labels).forEach(ensureSectionTitle);
})();
}catch(e){console.error("[pidemas-titulos-unificados-js]",e)}

/* ===== pidemas-hide-inicio-title-final-js ===== */
try{
(function(){
function hideInicioHeading(){
var root=document.getElementById('tab-restaurantes'); if(!root)return;
root.querySelectorAll('h1,h2,.adminPageTitle,[data-section-title],.sectionHeading').forEach(function(el){
if(el.id==='adminGreetingTitle')return;
var t=(el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
if(t==='inicio'){el.style.setProperty('display','none','important');}
});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hideInicioHeading);else hideInicioHeading();
var mo=new MutationObserver(hideInicioHeading);
function watch(){var root=document.getElementById('tab-restaurantes');if(root)mo.observe(root,{childList:true,subtree:true,characterData:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch);else watch();
setTimeout(hideInicioHeading,300);setTimeout(hideInicioHeading,1000);
})();
}catch(e){console.error("[pidemas-hide-inicio-title-final-js]",e)}

/* ===== pidemas-clean-empty-footer-card ===== */
try{
(function(){
function removeEmptyCards(){
const footer=document.querySelector('.pidemas-company-footer');
if(!footer)return;
const root=document.querySelector('#pidemasAdminDashboard');
if(root){
root.querySelectorAll(':scope > .pd-dashboard-section').forEach(el=>{
if(!el.textContent.trim() && !el.querySelector('img,svg,button,input,canvas')) el.remove();
});
}
let node=footer.previousElementSibling;
while(node && (node.classList.contains('card') || node.classList.contains('pd-empty-card'))){
const text=(node.innerText||node.textContent||'').replace(/\s+/g,'').trim();
const visibleControl=[...node.querySelectorAll('button,a,input,select,textarea,img,svg,canvas')].some(x=>x.getClientRects().length);
if(!text && !visibleControl){const prev=node.previousElementSibling;node.remove();node=prev;}else break;
}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',removeEmptyCards);else removeEmptyCards();
setTimeout(removeEmptyCards,500);setTimeout(removeEmptyCards,1500);
})();
}catch(e){console.error("[pidemas-clean-empty-footer-card]",e)}

/* ===== pdlg-js ===== */
try{
(function(){
const pw=document.getElementById('password'),tg=document.getElementById('togglePassword'),em=document.getElementById('email');
const sync=()=>{if(tg&&pw){tg.textContent=pw.type==='password'?'Mostrar':'Ocultar';tg.setAttribute('aria-label',pw.type==='password'?'Mostrar contraseña':'Ocultar contraseña')}};
if(tg){tg.addEventListener('click',()=>setTimeout(sync,0));sync();setTimeout(sync,800)}
if(em&&pw)em.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();pw.focus()}});
})();
}catch(e){console.error("[pdlg-js]",e)}

/* ===== pdm-nokb-js ===== */
try{
(function(){
var lastT=0,lastEl=null,lastKey=0;
['pointerdown','touchstart','mousedown'].forEach(function(ev){document.addEventListener(ev,function(e){lastT=Date.now();lastEl=e.target},true)});
document.addEventListener('keydown',function(){lastKey=Date.now()},true);
var SEL='[role="dialog"],#pdmModal,.h-sheet,.h-sheetCard';
function inDlg(el){try{var d=el.closest&&el.closest(SEL);if(!d)return false;var h=el.closest('[hidden]');return !h}catch(e){return false}}
function userWants(el){
if(Date.now()-lastKey<700)return true;
if(Date.now()-lastT>700||!lastEl)return false;
if(lastEl===el||el.contains(lastEl))return true;
var lb=lastEl.closest&&lastEl.closest('label');
return !!(lb&&(lb.control===el||lb.contains(el)));
}
var native=HTMLElement.prototype.focus;
HTMLElement.prototype.focus=function(){
if(/^(INPUT|TEXTAREA)$/.test(this.tagName)&&inDlg(this)&&!userWants(this))return;
return native.apply(this,arguments);
};
document.addEventListener('focusin',function(e){
var t=e.target;
if(/^(INPUT|TEXTAREA)$/.test(t.tagName)&&inDlg(t)&&!userWants(t)){try{t.blur()}catch(x){}}
},true);
})();
}catch(e){console.error("[pdm-nokb-js]",e)}

/* ===== pdm-js ===== */
try{
(function(){
if(window.__pdmModal)return;window.__pdmModal=true;
const $=id=>document.getElementById(id);
const MAP={
gps:['gpsAdminBox','Motorizados / GPS'],
'suspender-motorizado':['suspenderMotorizadoAdminBox','Suspender / reactivar cuentas'],
descuentos:['descuentosAdminBox','Códigos de descuento'],'estado-negocios':['estadoNegociosAdminBox','Estado de negocios'],
'config-negocios':['configNegociosAdminBox','Configurar negocios'],
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
if(key==='estado-negocios')return call('loadVisibilidadNegocios');
if(key==='config-negocios')return call('cnxLoad');
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

/* ===== pidemas-sin-enlaces-sueltos ===== */
try{
(function(){
const RE=/https?:\/\/(?:www\.)?(?:google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)\S*/i;
const ZONAS='.adminOrderCard,.order,article.x-order,#pdSeg,.pdMListCard';
let limpiar=function(){
document.querySelectorAll(ZONAS).forEach(z=>{
const w=document.createTreeWalker(z,NodeFilter.SHOW_TEXT);let n;const L=[];
while((n=w.nextNode()))if(RE.test(n.nodeValue)&&!(n.parentElement&&n.parentElement.closest('a,input,textarea,script,style,#pidemasOrderFullModal .pdMStops')))L.push(n);
L.forEach(n=>{const v=n.nodeValue.replace(new RegExp(RE.source,'gi'),'').replace(/\s*·\s*$/,'').replace(/^\s*·\s*/,'').trim();n.nodeValue=v||'Lugar marcado en el mapa'});
});
}
const MAY=[[/DELIVERY PAGADO POR EL NEGOCIO A PIDEM[ÁA]S/g,'Delivery pagado a Pidemás'],[/CAMBIO DE PAGO:/g,'Cambio de pago:'],[/PRODUCTO_MAYOR_18_VERIFICAR_DNI/g,'Producto para mayores de 18: verificar DNI'],[/AGENCIA_REEMBOLSADA/g,'Agencia reembolsada'],[/servicio marcado como PAGADO/g,'servicio marcado como pagado'],[/\bPAGADO\b/g,'pagado'],[/\bEFECTIVO\b/g,'efectivo'],[/\bYAPE\b/g,'Yape']];
const MZ='.adminOrderCard,.order,article.x-order,#pdSeg,.pdMListCard,#pidemasOrderFullModal,#pdmModal,#pdxSheet,.pdA,.pfInc';
function minus(){
document.querySelectorAll(MZ).forEach(z=>{
const w=document.createTreeWalker(z,NodeFilter.SHOW_TEXT);let n;
while((n=w.nextNode())){const v=n.nodeValue;if(!/[A-ZÁÉÍÓÚÑ_]{5}/.test(v)||(n.parentElement&&n.parentElement.closest('input,textarea,script,style')))continue;
let r=v;MAY.forEach(([x,y])=>{r=r.replace(x,y)});if(r!==v)n.nodeValue=r}
});
}
const limpiar0=limpiar;limpiar=function(){limpiar0();minus()};
let q=false;new MutationObserver(()=>{if(q)return;q=true;queueMicrotask(()=>{q=false;limpiar()})}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
setInterval(limpiar,2000);limpiar();
})();
}catch(e){console.error("[pidemas-sin-enlaces-sueltos]",e)}

