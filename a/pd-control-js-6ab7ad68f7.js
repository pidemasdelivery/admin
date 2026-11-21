
/* ===== antes control.js ===== */
/* ===== Pidemás · Control de caja (admin) =====
   Yape por confirmar · Por cobrar a negocios (con WhatsApp) · Alerta de caja alta */
(function(){
  if(window.pdCtl)return;
  const $=id=>document.getElementById(id);
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const M=n=>'S/ '+(Number(n)||0).toFixed(2);
  const r2=n=>Math.round((Number(n)||0)*100)/100;
  const ref=id=>'#'+String(id||'').slice(0,8).toUpperCase();
  const db=()=>window.db;
  const fecha=v=>{try{return new Date(v).toLocaleDateString('es-PE',{timeZone:'America/Lima',day:'2-digit',month:'short'})}catch(e){return ''}};
  const hoyLima=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Lima'});
  const diaLima=v=>new Date(v).toLocaleDateString('en-CA',{timeZone:'America/Lima'});
  const aviso=t=>(window.pdExito||window.pdAviso||alert)(t);
  const tel=t=>{const d=String(t||'').replace(/\D/g,'');if(!d)return '';return d.startsWith('51')?d:(d.length===9?'51'+d:d)};

  /* ---------- hoja (ventana desde abajo) ---------- */
  function hoja(titulo){
    cerrarHoja();
    const v=document.createElement('div');v.className='pdPwVelo pdCtlVelo';v.id='pdCtlVelo';
    v.innerHTML='<div class="pdPwHoja pdCtlHoja" role="dialog" aria-modal="true" aria-label="'+E(titulo)+'"><div class="pdPwTop"><strong>'+E(titulo)+'</strong><button type="button" class="pdPwX" aria-label="Cerrar">×</button></div><div class="pdCtlBody" id="pdCtlBody"><p class="pdCtlMuted">Cargando…</p></div></div>';
    document.body.appendChild(v);
    v.querySelector('.pdPwX').addEventListener('click',cerrarHoja);
    v.addEventListener('click',e=>{if(e.target===v)cerrarHoja()});
    return $('pdCtlBody');
  }
  function cerrarHoja(){const v=$('pdCtlVelo');if(v)v.remove()}
  document.addEventListener('keydown',e=>{if(e.key==='Escape')cerrarHoja()});

  let motos=[],negocios=[];
  async function base(){
    if(!motos.length){const r=await db().from('motorizados').select('id,nombre_completo,telefono,activo,usuario_id').order('nombre_completo');motos=r.data||[]}
    if(!negocios.length){const r=await db().from('negocios').select('id,nombre,telefono');negocios=r.data||[]}
  }
  const motoN=id=>(motos.find(m=>String(m.id)===String(id))||{}).nombre_completo||'Motorizado';

  /* =================== contador para el menú =================== */
  async function contar(){
    try{
      const desde=new Date(Date.now()-45*864e5).toISOString();
      const [y,n]=await Promise.all([
        db().from('cobros').select('id',{count:'exact',head:true}).eq('metodo_pago','yape').eq('confirmado',true).is('yape_recibido_en',null).gte('confirmado_en',desde),
        db().from('pedidos').select('id',{count:'exact',head:true}).in('pago_acordado',['pagado','yape_negocio']).eq('estado','entregado').is('delivery_negocio_cobrado_en',null)]);
      const k={yape:y.count||0,deu:n.count||0};
      window.__pdCtlCuenta=k;badges();
    }catch(e){}
  }
  function badges(){const k=window.__pdCtlCuenta||{};document.querySelectorAll('[data-ctl]').forEach(b=>{let i=b.querySelector('.pdCtlBdg');const v=k[b.dataset.ctl]||0;if(!v){if(i)i.remove();return}if(!i){i=document.createElement('b');i.className='pdCtlBdg';b.appendChild(i)}const t=v>99?'99+':String(v);if(i.textContent!==t)i.textContent=t})}
  setInterval(badges,1500);
  window.pdCtl={contar,hoja,cerrarHoja};
  let t0=0;setInterval(()=>{const on=!!document.querySelector('#appView:not(.hidden)')&&window.db;if(on&&Date.now()-t0>90000){t0=Date.now();contar()}},3000);
})();

