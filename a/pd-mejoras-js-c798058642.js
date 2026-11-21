
/* ===== antes mejoras.js ===== */
/* ===== Pidemás · Mejoras de administración =====
   Mapa en vivo con pedidos sin asignar · Asignación automática · Ficha del cliente · Lista negra */
(function(){
  if(window.__pdAdmMej)return;window.__pdAdmMej=1;
  const $=id=>document.getElementById(id);
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const M=n=>'S/ '+(Number(n)||0).toFixed(2);
  const db=()=>window.db;
  const T=v=>{const t=new Date(v).getTime();return Number.isFinite(t)?t:0};
  const ref=id=>'#'+String(id||'').slice(0,8).toUpperCase();
  const est=o=>String(o&&o.estado||'').toLowerCase();
  const d9=t=>String(t||'').replace(/\D/g,'').slice(-9);
  const wa=t=>{const d=d9(t);return d.length===9?'51'+d:''};
  const fH=v=>{try{return new Date(v).toLocaleString('es-PE',{timeZone:'America/Lima',day:'2-digit',month:'short',hour:'numeric',minute:'2-digit'})}catch(e){return ''}};
  const diaLima=v=>new Date(v).toLocaleDateString('en-CA',{timeZone:'America/Lima'});
  const hoja=t=>window.pdCtl&&pdCtl.hoja?pdCtl.hoja(t):null;
  const cerrar=()=>{try{pdCtl.cerrarHoja()}catch(e){}};
  const ok=t=>(window.pdExito||window.pdAviso||alert)(t);
  const avisar=t=>(window.pdAviso||alert)(t);
  const L=()=>{try{return Array.isArray(allOrders)?allOrders:[]}catch(e){return []}};
  const MO=()=>{try{return Array.isArray(allMotos)?allMotos:[]}catch(e){return []}};
  const CL=()=>{try{return Array.isArray(allClientes)?allClientes:[]}catch(e){return []}};
  const ACT=['pendiente','confirmado','asignado','aceptado','pedido_aceptado','camino_recojo','en_camino','en_entrega','camino_entrega'];
  const faltaMigrar=e=>/does not exist|schema cache|relation|column/i.test(String(e&&e.message||e||''));
  const AVISO_MIG='<p class="pdCtlErr">Falta activar esta función en la base de datos. Pídele a Claude que aplique los cambios pendientes.</p>';
  const inicioDia=()=>new Date(diaLima(Date.now())+'T00:00:00-05:00').toISOString();

  /* =================== 2. Asignación automática =================== */
  let auto={on:false,min:3},autoLeido=0;
  async function leerAuto(){if(Date.now()-autoLeido<60000)return auto;autoLeido=Date.now();try{const r=await db().from('ajustes').select('valor').eq('clave','auto_asignar').maybeSingle();if(!r.error&&r.data&&r.data.valor)auto=Object.assign({on:false,min:3},r.data.valor)}catch(e){}return auto}
  async function autoTick(){
    await leerAuto();if(!auto.on||typeof assignOrder!=='function'||!window.pdPedCtl||!pdPedCtl.sugerencias)return;
    const now=Date.now();
    const cand=L().filter(o=>!o.motorizado_id&&['pendiente','confirmado'].includes(est(o))&&(!o.negocio_id||o.negocio_aceptado_en));
    if(!cand.length)return;
    const sug=await pdPedCtl.sugerencias();
    for(const o of cand){const desde=T(o.negocio_aceptado_en)||T(o.creado_en);if(now-desde<auto.min*60000)continue;
      const k=String(o.id);if(now-(intentados.get(k)||0)<90000)continue;intentados.set(k,now);
      const top=(sug.get(k)||[]).find(x=>x.gps&&!x.m.en_descanso)||(sug.get(k)||[]).find(x=>!x.m.en_descanso);if(!top)continue;
      const r=await db().from('pedidos').select('motorizado_id,estado').eq('id',o.id).maybeSingle();if(r.error||!r.data||r.data.motorizado_id)continue;
      try{await assignOrder(o.id,top.m.id);window.pdAviso&&pdAviso('Asignación automática: '+ref(o.id)+' → '+(top.m.nombre_completo||'motorizado'))}catch(e){}
    }
  }

  
  let n=0;
  setInterval(()=>{if(!document.querySelector('#appView:not(.hidden)')||!db())return;n++;
    
    if(n%6===3)autoTick().catch(()=>{});
  },5000);
})();

