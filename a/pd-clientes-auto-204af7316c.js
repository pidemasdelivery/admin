
/* Pidemás · Clientes automáticos
   1) Al escribir el nombre o el número en los formularios de recojo, compra y encomienda,
      aparecen los clientes ya registrados; al tocar uno se completan sus datos.
   2) Al enviar el pedido, quien envía y quien recibe se guardan (o se completan) en la base de clientes. */
(function(){
  if(window.__pdClientesAuto)return;window.__pdClientesAuto=true;
  const $=id=>document.getElementById(id);
  const val=id=>{const e=$(id);return e?String(e.value||'').trim():''};
  const sinTilde=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
  const clave=t=>{t=String(t||'').trim();const u=t.replace(/^@/,'');if(/^@/.test(t)||(/[a-z]/i.test(u)&&!/\d{6,}/.test(u)))return u?'@'+u.toLowerCase():'';const d=t.replace(/\D/g,'');return d.length>=9?d.slice(-9):''};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cN=c=>String(c.nombre_completo||c.nombre||'').trim();
  const cT=c=>String(c.telefono||c.numero||c.celular||'').trim();
  const cD=c=>String(c.direccion||c.direccion_recojo||'').trim();
  const cU=c=>String(c.ubicacion_recojo_url||c.ubicacion_url||(/^https?:/i.test(c.referencia||'')?c.referencia:'')||'').trim();
  const cDoc=c=>String(c.documento||c.dni||'').trim();

  /* Grupos de campos: cada persona de cada formulario */
  const G=[
    {f:'recojo',p:'rem',nom:'admRecojoRemitente',tel:'admRecojoTelRemitente',dir:'admRecojoDireccion',ubi:'admRecojoUbicacion',id:'admRecojoClienteId'},
    {f:'recojo',p:'rec',nom:'admRecojoReceptor',tel:'admRecojoTelReceptor',dir:'admRecojoEntrega',ubi:'admRecojoUbicacionEntrega'},
    {f:'compra',p:'rem',nom:'admCompraCliente',tel:'admCompraTelefono',dir:'admCompraDireccion',ubi:'admCompraUbicacion',doc:'admCompraDocumento',id:'admCompraClienteId'},
    {f:'enc',p:'rem',nom:'encNombreRemitente',tel:'encTelefonoRemitente',dir:'encDireccionRecojo',ubi:'encGpsRecojo',doc:'encDniRemitente',id:'encClienteId'},
    {f:'enc',p:'rec',nom:'encNombreReceptor',tel:'encTelefonoReceptor',doc:'encDniReceptor'}
  ];
  const BUSQ={admRecojoClienteNombre:0,admCompraBuscarCliente:2,encClienteNombre:3};
  const grupoDe=id=>{if(id in BUSQ)return [G[BUSQ[id]],'busq'];for(const g of G){if(g.nom===id)return [g,'nom'];if(g.tel===id)return [g,'tel']}return null};
  /* La lista nativa (datalist) se reemplaza por la nuestra */
  const sinDatalist=()=>Object.keys(BUSQ).forEach(id=>{const e=$(id);if(e&&e.hasAttribute('list'))e.removeAttribute('list')});

  /* Base de clientes en memoria */
  let CL=[],cargado=0,cargando=null;
  function cargar(f){
    if(!window.db)return Promise.resolve(CL);
    if(!f&&Date.now()-cargado<60000)return Promise.resolve(CL);
    if(cargando)return cargando;
    cargando=Promise.resolve(window.db.from('clientes').select('*')).then(r=>{if(!r.error){CL=(r.data||[]).filter(c=>c.activo!==false);cargado=Date.now()}return CL}).catch(()=>CL).finally(()=>{cargando=null});
    return cargando;
  }
  const porClave=k=>k?CL.find(c=>clave(cT(c))===k):null;

  /* Lista de sugerencias */
  let box=null,act=null;
  function css(){
    if($('pdCliAutoCss'))return;
    const s=document.createElement('style');s.id='pdCliAutoCss';
    s.textContent=`#pdCliAuto{position:fixed;z-index:2147483600;background:#fff;border:1.5px solid #F1E4DA;border-radius:16px;box-shadow:0 14px 36px rgba(60,30,10,.18);overflow:auto;max-height:280px;font-family:inherit;-webkit-overflow-scrolling:touch}
#pdCliAuto .h{font-size:12px;font-weight:800;color:#9A8B80;letter-spacing:.04em;text-transform:uppercase;padding:10px 14px 4px}
#pdCliAuto button{display:flex;align-items:center;gap:12px;width:100%;border:0;background:#fff;text-align:left;padding:10px 14px;min-height:56px;font:inherit;cursor:pointer;border-top:1px solid #F6EEE8}
#pdCliAuto button:first-of-type{border-top:0}
#pdCliAuto button:active{background:#FFF4EC}
#pdCliAuto .av{flex:0 0 36px;height:36px;border-radius:50%;background:#FFEDE0;color:#E8590C;display:grid;place-items:center;font-weight:800;font-size:14px}
#pdCliAuto .tx{min-width:0;display:flex;flex-direction:column}
#pdCliAuto b{font-size:15px;color:#2B1D14;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#pdCliAuto span.s{font-size:13px;color:#6B5E55;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`;
    document.head.appendChild(s);
  }
  function cerrar(){if(box){box.remove();box=null}act=null}
  function posicionar(inp){
    if(!box)return;const r=inp.getBoundingClientRect();
    const abajo=window.innerHeight-r.bottom,arriba=r.top;
    box.style.left=Math.max(8,r.left)+'px';box.style.width=Math.min(window.innerWidth-16,Math.max(260,r.width))+'px';
    if(abajo<200&&arriba>abajo){box.style.top='';box.style.bottom=(window.innerHeight-r.top+6)+'px';box.style.maxHeight=Math.min(280,arriba-16)+'px'}
    else{box.style.bottom='';box.style.top=(r.bottom+6)+'px';box.style.maxHeight=Math.min(280,Math.max(140,abajo-16))+'px'}
  }
  function buscar(q,campo){
    const s=sinTilde(q);if(!s)return [];
    const dig=q.replace(/\D/g,'');
    const L=CL.filter(c=>{
      if(campo==='tel'&&dig.length>=3)return cT(c).replace(/\D/g,'').includes(dig);
      if(campo==='busq'&&dig.length>=3)return cT(c).replace(/\D/g,'').includes(dig)||sinTilde(cN(c)).includes(s);
      if(campo==='tel'&&/^@/.test(q.trim()))return sinTilde(cT(c)).includes(s);
      const n=sinTilde(cN(c));return n.split(/\s+/).some(w=>w.startsWith(s))||n.startsWith(s)||(s.length>=3&&n.includes(s))||(dig.length>=4&&cT(c).replace(/\D/g,'').includes(dig));
    });
    L.sort((a,b)=>{const x=sinTilde(cN(a)).startsWith(s)?0:1,y=sinTilde(cN(b)).startsWith(s)?0:1;return x-y||cN(a).localeCompare(cN(b),'es')});
    return L.slice(0,6);
  }
  function mostrar(inp,g,campo){
    const q=String(inp.value||'');
    if(q.trim().length<2){cerrar();return}
    const L=buscar(q,campo);
    if(!L.length||(L.length===1&&sinTilde(cN(L[0]))===sinTilde(q)&&val(g.tel)&&clave(val(g.tel))===clave(cT(L[0])))){cerrar();return}
    css();
    if(!box){box=document.createElement('div');box.id='pdCliAuto';box.setAttribute('data-pd-aislado','1');document.body.appendChild(box);
      box.addEventListener('pointerdown',e=>e.preventDefault());
      box.addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(!b||!act)return;const c=CL.find(x=>String(x.id)===b.dataset.k);if(c){llenar(act.g,c);if(act.campo==='busq'&&act.inp.value!==cN(c))act.inp.value=cN(c)}cerrar()})}
    act={inp,g,campo};
    box.innerHTML='<div class="h">Clientes registrados</div>'+L.map(c=>{const ini=cN(c).split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'?';
      return `<button type="button" data-k="${esc(c.id)}"><span class="av">${esc(ini)}</span><span class="tx"><b>${esc(cN(c)||'Sin nombre')}</b><span class="s">${esc([cT(c),cD(c)].filter(Boolean).join(' · '))}</span></span></button>`}).join('');
    posicionar(inp);
  }
  function poner(id,v,forzar){const e=$(id);if(!e||v==null||v==='')return;if(!forzar&&String(e.value||'').trim())return;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}
  function llenar(g,c){
    poner(g.nom,cN(c),true);poner(g.tel,cT(c),true);
    if(g.dir)poner(g.dir,cD(c),true);
    if(g.ubi)poner(g.ubi,cU(c),true);
    if(g.doc)poner(g.doc,cDoc(c),true);
    if(g.id&&$(g.id))$(g.id).value=c.id||'';
    try{(window.pdAviso||window.pdToast||(()=>{}))('Datos de '+cN(c).split(' ')[0]+' completados')}catch(_){}
  }

  document.addEventListener('focusin',e=>{const t=e.target;if(t&&t.id&&grupoDe(t.id)){sinDatalist();cargar()}},true);
  document.addEventListener('input',e=>{
    const t=e.target;if(!t||!t.id||!e.isTrusted)return;const gc=grupoDe(t.id);if(!gc)return;
    const [g,campo]=gc;
    if(campo==='tel'){const k=clave(t.value);const c=porClave(k);if(c&&!val(g.nom)&&CL.filter(x=>clave(cT(x))===k).length===1){llenar(g,c);cerrar();return}}
    if(!CL.length&&!cargado){cargar().then(()=>{if(document.activeElement===t)mostrar(t,g,campo)});return}
    mostrar(t,g,campo);
  },true);
  document.addEventListener('focusout',e=>{if(act&&e.target===act.inp)setTimeout(()=>{if(act&&document.activeElement!==act.inp)cerrar()},150)},true);
  window.addEventListener('scroll',()=>{if(act)posicionar(act.inp)},true);
  window.addEventListener('resize',()=>{if(act)posicionar(act.inp)});

  /* Guardar clientes al enviar el pedido */
  const tipoDe=p=>{const t=String(p.tipo_servicio||'').toLowerCase();if(/encomienda/.test(t))return 'enc';if(/compra/.test(t))return 'compra';if(/recojo/.test(t))return 'recojo';return ''};
  async function guardarUno(x){
    const k=clave(x.tel);if(!k||!x.nom||x.nom.length<2)return;
    await cargar();
    const telGuardar=k.startsWith('@')?k:x.tel.replace(/\D/g,'').slice(-9);
    const nx=sinTilde(x.nom).replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();
    /* Un mismo número puede ser de varias personas (por ejemplo, el número del local): se compara también el nombre */
    const mismos=CL.filter(c=>clave(cT(c))===k);
    const c=mismos.find(c=>{const n=sinTilde(cN(c)).replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();return !n||n===nx||n.startsWith(nx+' ')||nx.startsWith(n+' ')});
    try{
      if(c){
        const up={};
        if(x.dir&&!cD(c))up.direccion=x.dir;
        if(x.doc&&!cDoc(c))up.documento=x.doc;
        if(x.ubi&&!cU(c))up.ubicacion_recojo_url=x.ubi;
        if(x.lat!=null&&c.latitud==null){up.latitud=x.lat;up.longitud=x.lng}
        if(!cN(c))up.nombre_completo=x.nom;
        if(Object.keys(up).length){const r=await window.db.from('clientes').update(up).eq('id',c.id);if(!r.error)Object.assign(c,up)}
        return;
      }
      const nuevo={nombre_completo:x.nom,telefono:telGuardar,direccion:x.dir||null,documento:x.doc||null,ubicacion_recojo_url:x.ubi||null,activo:true};
      if(x.lat!=null){nuevo.latitud=x.lat;nuevo.longitud=x.lng}
      let r=await window.db.from('clientes').insert(nuevo).select('*').single();
      if(r.error&&/column|schema cache|PGRST204|42703/i.test(String(r.error.message)+String(r.error.code))){delete nuevo.ubicacion_recojo_url;delete nuevo.documento;r=await window.db.from('clientes').insert(nuevo).select('*').single()}
      if(!r.error&&r.data)CL.push(r.data);
    }catch(e){console.warn('[clientes] no se pudo guardar',e)}
  }
  const recientes=new Map();
  function guardarDePedido(p){
    if(!p||Array.isArray(p)||!window.db)return;
    const f=tipoDe(p);if(!f)return;
    const lista=[];
    G.filter(g=>g.f===f).forEach(g=>{
      const x={nom:val(g.nom),tel:val(g.tel),dir:g.dir?val(g.dir):'',ubi:g.ubi?val(g.ubi):'',doc:g.doc?val(g.doc):''};
      if(g.p==='rem'){x.nom=x.nom||String(p.nombre_remitente||p.nombre_cliente||'').trim();x.tel=x.tel||String(p.telefono_remitente||p.telefono_cliente||'').trim();if(p.latitud_recojo!=null&&f!=='compra'){x.lat=p.latitud_recojo;x.lng=p.longitud_recojo}if(f==='compra'&&p.latitud_entrega!=null){x.lat=p.latitud_entrega;x.lng=p.longitud_entrega}}
      else{x.nom=x.nom||String(p.nombre_receptor||'').trim();x.tel=x.tel||String(p.telefono_receptor||'').trim();if(f==='recojo'&&p.latitud_entrega!=null){x.lat=p.latitud_entrega;x.lng=p.longitud_entrega}}
      if(x.doc&&!/^\d{8}$/.test(x.doc.replace(/\D/g,'')))x.doc=f==='compra'?'':x.doc;
      if(!/^https?:/i.test(x.ubi))x.ubi='';
      lista.push(x);
    });
    lista.forEach(x=>{const k=clave(x.tel);if(!k)return;const t=recientes.get(k);if(t&&Date.now()-t<30000)return;recientes.set(k,Date.now());setTimeout(()=>guardarUno(x),1500)});
  }
  function envolver(){
    const d=window.db;if(!d||!d.from)return false;if(d.__pdCliAuto)return true;
    const from=d.from;d.__pdCliAuto=true;
    d.from=function(tabla){
      const b=from.apply(this,arguments);
      if(tabla==='pedidos'&&b&&b.insert&&!b.__pdCliAuto){const ins=b.insert;b.__pdCliAuto=true;b.insert=function(payload){try{guardarDePedido(payload)}catch(_){}return ins.apply(this,arguments)}}
      return b;
    };
    return true;
  }
  if(!envolver()){let n=0;const iv=setInterval(()=>{if(envolver()||++n>120)clearInterval(iv)},250)}
  /* Otro envoltorio de window.db puede reemplazar .from después: volver a revisar */
  setInterval(()=>{const d=window.db;if(d&&d.from&&!String(d.from).includes('guardarDePedido')){d.__pdCliAuto=false;envolver()}},3000);
  window.pdClientesAuto={cargar,buscar:(q)=>buscar(q,'nom'),guardarDePedido};
})();

