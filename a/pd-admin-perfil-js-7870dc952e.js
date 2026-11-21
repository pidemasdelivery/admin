
/* Mi perfil del administrador: datos de la cuenta, seguridad, este teléfono y accesos rápidos */
(function(){
  const $=id=>document.getElementById(id);
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const VERSION='13 nov 2026';
  function armar(){
    const c=document.querySelector('#pdhSheet .h-sheetCard');if(!c)return;
    const datos=c.querySelector(':scope > .pdhSec');if(!datos)return;
    if(!c.querySelector('#pdhTop')){
      const top=document.createElement('section');top.id='pdhTop';top.className='pdhSec pdhTop';
      datos.before(top);
      const seg=document.createElement('section');seg.className='pdhSec';seg.id='pdhSeg';
      seg.innerHTML='<h4>Seguridad</h4><p class="h-note">Cambia la contraseña con la que entras al panel.</p>'+
        '<label class="h-lbl">Nueva contraseña<input id="pdhPass1" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres"></label>'+
        '<label class="h-lbl">Repite la contraseña<input id="pdhPass2" type="password" autocomplete="new-password" placeholder="Escríbela otra vez"></label>'+
        '<button type="button" class="pdhSecBtn" id="pdhPassBtn">Cambiar contraseña</button><p class="h-note pdhErr" id="pdhPassMsg" role="status"></p>';
      const tel=document.createElement('section');tel.className='pdhSec';tel.id='pdhTel';
      const acc=document.createElement('section');acc.className='pdhSec';acc.id='pdhAcc';
      acc.innerHTML='<h4>Accesos rápidos</h4><div class="pdhAccs"><button type="button" data-ir="horario">Horario</button><button type="button" data-ir="qr">QR Yape</button><button type="button" data-ir="tarifas">Tarifas</button><button type="button" data-ir="descuentos">Códigos de descuento</button></div>';
      datos.after(seg);
      acc.addEventListener('click',e=>{const b=e.target.closest('[data-ir]');if(!b)return;const k=b.dataset.ir;
        const cerrar=()=>{const x=c.querySelector('.h-x');x&&x.click()};
        if(k==='horario'){const h=$('pdhoBtn');cerrar();setTimeout(()=>h&&h.click(),250)}
        else{cerrar();setTimeout(()=>window.__pdmOpen&&window.__pdmOpen(k==='qr'?'qryape':'descuentos'),250)}});
      $('pdhPassBtn').addEventListener('click',async()=>{
        const a=$('pdhPass1').value,b=$('pdhPass2').value,m=$('pdhPassMsg');m.textContent='';
        if(a.length<6){m.textContent='La contraseña debe tener al menos 6 caracteres.';return}
        if(a!==b){m.textContent='Las dos contraseñas no coinciden.';return}
        const btn=$('pdhPassBtn');btn.disabled=true;btn.textContent='Guardando…';
        try{const {error}=await window.db.auth.updateUser({password:a});if(error)throw error;$('pdhPass1').value='';$('pdhPass2').value='';
          window.pdExito?pdExito('Contraseña actualizada correctamente.'):null}
        catch(err){m.textContent='No se pudo cambiar la contraseña: '+(err.message||err)}
        finally{btn.disabled=false;btn.textContent='Cambiar contraseña'}
      });
    }
    /* Guardar al final y debajo Cerrar sesión */
    const save=$('pdhSave'),msg=$('pdhMsg'),out=$('pdaLogout'),acc=$('pdhSeg');
    if(save&&acc&&acc.nextElementSibling!==save){acc.after(save);if(msg)save.after(msg)}
    if(out&&save&&out.previousElementSibling!==(msg||save)){(msg||save).after(out)}
    pintar();
  }
  const FOTO={url:'',cargada:false,subiendo:false};
  const avisar=t=>{window.pdAviso?pdAviso(t):alert(t)};
  async function uidActual(){const r=await window.db.auth.getUser();const u=r&&r.data&&r.data.user;if(!u)throw new Error('Tu sesión no está lista. Vuelve a ingresar.');return u.id}
  async function cargarFoto(){
    FOTO.cargada=true;
    try{if(!window.db)return;const uid=await uidActual();const r=await window.db.from('perfiles').select('foto_url').eq('id',uid).maybeSingle();FOTO.url=(r&&r.data&&r.data.foto_url)||'';pintar()}catch(e){FOTO.cargada=false}
  }
  async function subirFoto(e){
    const inp=e.target,f=inp.files&&inp.files[0];if(!f)return;
    if(!/^image\/(jpeg|png|webp)$/i.test(f.type)||f.size>5*1024*1024){inp.value='';avisar('La foto debe ser JPG, PNG o WEBP y pesar máximo 5 MB.');return}
    const antes=FOTO.url;FOTO.url=URL.createObjectURL(f);FOTO.subiendo=true;pintar();
    try{
      const uid=await uidActual();
      const ext=({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[f.type]||'jpg';
      const path=`${uid}/perfil-${Date.now()}.${ext}`,bucket=window.db.storage.from('fotos-motorizados');
      const up=await bucket.upload(path,f,{cacheControl:'3600',upsert:false,contentType:f.type});
      if(up.error)throw new Error('No se pudo subir la foto: '+(up.error.message||up.error));
      const url=bucket.getPublicUrl(path)?.data?.publicUrl;if(!url)throw new Error('No se pudo obtener la dirección de la foto.');
      const r=await window.db.from('perfiles').update({foto_url:url}).eq('id',uid).select('id,foto_url').maybeSingle();
      if(r.error)throw new Error('No se pudo guardar la foto: '+r.error.message);
      if(!r.data)throw new Error('Supabase no actualizó tu perfil. Revisa los permisos de perfiles.');
      FOTO.url=url;FOTO.subiendo=false;pintar();
      window.pdExito?pdExito('Foto de perfil actualizada.'):avisar('Foto de perfil actualizada.');
    }catch(err){FOTO.url=antes;FOTO.subiendo=false;pintar();avisar(String((err&&err.message)||'No se pudo subir la foto.'))}
    finally{inp.value=''}
  }
  async function quitarFoto(){
    if(!FOTO.url)return;
    if(window.pdConfirmar&&!(await pdConfirmar('¿Quitar tu foto de perfil?')))return;
    FOTO.subiendo=true;pintar();
    try{const uid=await uidActual();const r=await window.db.from('perfiles').update({foto_url:null}).eq('id',uid).select('id').maybeSingle();
      if(r.error)throw new Error('No se pudo quitar la foto: '+r.error.message);if(!r.data)throw new Error('Supabase no actualizó tu perfil. Revisa los permisos de perfiles.');
      FOTO.url='';FOTO.subiendo=false;pintar();window.pdExito?pdExito('Foto de perfil quitada.'):avisar('Foto de perfil quitada.')}
    catch(err){FOTO.subiendo=false;pintar();avisar(String((err&&err.message)||'No se pudo quitar la foto.'))}
  }
  document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('#pdhFotoDel'))quitarFoto()});
  function pintar(){
    const top=$('pdhTop');if(!top)return;
    const nombre=($('pdhName')&&$('pdhName').value.trim())||'Administrador';
    const mail=(($('pdhMail')&&$('pdhMail').textContent)||'').replace(/^Cuenta:\s*/,'');
    const ini=nombre.split(/\s+/).map(w=>w[0]||'').slice(0,2).join('').toUpperCase()||'A';
    const foto=FOTO.url,sub=FOTO.subiendo;
    if(FOTO.cargada&&!sub&&!/^blob:/.test(foto||'')){window.__pdAdminFoto=foto||'';try{localStorage.setItem('pdAdminFoto',window.__pdAdminFoto)}catch(e){}}
    const html=`<div class="pdhTopRow"><span class="pdhAv${sub?' pdhSub':''}">${foto?`<img src="${E(foto)}" alt="Foto de perfil">`:E(ini)}</span><span class="pdhWho"><strong>${E(nombre)}</strong><small>Administrador · Pidemás Delivery</small>${mail?`<small>${E(mail)}</small>`:''}</span></div>
      <div class="pdhFotoActs"><label class="pdhFotoBtn" for="pdhFotoFile"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg><span>${foto?'Cambiar foto':'Subir foto'}</span></label>${foto?'<button type="button" class="pdhFotoDel" id="pdhFotoDel">Quitar foto</button>':''}</div>`;
    if(top.__h!==html){top.innerHTML=html;top.__h=html}
    if(!$('pdhFotoFile')){const f=document.createElement('input');f.type='file';f.id='pdhFotoFile';f.accept='image/jpeg,image/png,image/webp';f.hidden=true;f.setAttribute('data-pd-cloud','1');document.body.appendChild(f);f.addEventListener('change',subirFoto)}
    if(!FOTO.cargada)cargarFoto();
    const tel=$('pdhTel');
    if(tel){const av='Notification' in window&&Notification.permission==='granted';
      const h=`<h4>Este teléfono</h4><div class="pdhInfo"><span>Avisos de pedidos</span><b class="${av?'ok':'no'}">${av?'● Conectados':'● Sin activar'}</b><span>Versión del panel</span><b>${VERSION}</b></div>`;
      if(tel.__h!==h){tel.innerHTML=h;tel.__h=h}}
  }
  new MutationObserver(()=>{clearTimeout(armar.t);armar.t=setTimeout(armar,60)}).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('input',e=>{if(e.target&&e.target.id==='pdhName')pintar()});
  setInterval(armar,1500);armar();
})();
