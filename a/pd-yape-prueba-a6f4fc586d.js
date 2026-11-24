/* ===== Pidemás · Prueba del Yape a Pidemás =====
   Todo cobro por Yape al QR de Pidemás se confirma con la foto de la captura del Yape.
   Si no se puede tomar la foto, se pide el número de operación. La hora del Yape se guarda sola
   (la de la foto, o la del momento en que se confirma). Se guarda en el pedido:
   comprobante_pago_url, yape_operacion y yape_pagado_en. */
(function(){
  if(window.PdYapeP)return;
  const S={};const st=(id,q)=>{const k=id+(q&&q.dest?':'+q.dest:'');return S[k]||(S[k]={})};const key=(id,q)=>id+(q&&q.dest?':'+q.dest:'');
  /* q.dest='agencia': cobro al cliente de lo pagado en las agencias (se guarda aparte en pago_agencia_prueba) */
  const prev=(o,q)=>{if(q&&q.dest==='agencia'){const x=o&&o.pago_agencia_prueba;return x&&(x.url||x.operacion)?{url:x.url,op:x.operacion,hora:x.hora}:null}return o&&(o.comprobante_pago_url||o.yape_operacion)?{url:o.comprobante_pago_url,op:o.yape_operacion,hora:o.yape_pagado_en}:null};
  const D=()=>{try{return db}catch(e){return window.db}};
  const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const hora=t=>{try{return new Date(t).toLocaleTimeString('es-PE',{hour:'numeric',minute:'2-digit'})}catch(_){return ''}};
  const render=()=>{try{window.PdPasos&&PdPasos.render()}catch(_){}};
  /* hora del Yape: la de la foto si es de hoy (últimas 12 h); si no, ahora */
  function horaDe(f){const t=Number(f&&f.lastModified)||0,now=Date.now();return t&&t<=now+60000&&now-t<12*3600e3?new Date(t).toISOString():new Date().toISOString()}
  function yaTiene(o,q){return !!prev(o,q)}
  function html(o,q){
    const id=String(o.id),s=st(id,q),pv=prev(o,q),tit=q&&q.titulo||'Prueba del Yape';
    if(pv&&!s.file&&!s.op)return `<div class="sum"><div class="lbl">${E(tit)}</div>${pv.url?`<a href="${E(pv.url)}" target="_blank" rel="noopener"><img src="${E(pv.url)}" alt="Captura del Yape" style="width:100%;max-height:200px;object-fit:cover;border-radius:12px;display:block"></a>`:''}${pv.op?`<div class="li"><span>N.° de operación</span><b>${E(pv.op)}</b></div>`:''}${pv.hora?`<div class="li"><span>Hora del Yape</span><b>${E(hora(pv.hora))}</b></div>`:''}</div>`;
    const h=s.file?s.hora:(String(s.op||'').trim()?new Date().toISOString():'');
    return `<div class="sum" style="gap:10px"><div class="lbl">${E(tit)} · obligatoria</div>
      <button type="button" class="b soft" data-act="yfShot">${s.file?'Captura lista · tocar para cambiar':'Tomar foto de la captura del Yape'}</button>
      <input type="file" data-act="yfFile" accept="image/jpeg,image/png,image/webp" hidden data-pd-cloud="1">
      ${s.url?`<img src="${E(s.url)}" alt="Captura del Yape" style="width:100%;max-height:200px;object-fit:cover;border-radius:12px">`:''}
      ${s.file?'':`<div><div class="lbl">¿No puedes tomar la foto? N.° de operación</div><input class="inp" data-act="yfOp" inputmode="numeric" placeholder="Ej. 01234567" value="${E(s.op||'')}"></div>`}
      ${h?`<div class="vto info"><span>Hora del Yape</span><b>${E(hora(h))}</b></div>`:''}</div>`;
  }
  function acts(o,q){const id=String(o.id),st0=()=>st(id,q);return {
    yfShot:b=>{const f=b.getRootNode().querySelector('[data-act="yfFile"]');if(f)f.click()},
    yfFile:inp=>{const f=inp.files&&inp.files[0];if(!f)return;const s=st0();try{if(s.url)URL.revokeObjectURL(s.url)}catch(_){}s.file=f;s.hora=horaDe(f);try{s.url=URL.createObjectURL(f)}catch(_){}s.op='';render()},
    yfOp:inp=>{inp.value=inp.value.replace(/[^\d]/g,'').slice(0,20);st0().op=inp.value}
  }}
  function falta(o,q){if(yaTiene(o,q))return '';const s=st(String(o.id),q);if(s.file)return '';if(String(s.op||'').trim().length>=4)return '';
    return 'Toma la foto de la captura del Yape. Si no puedes, escribe el número de operación.'}
  async function achicar(f){try{const img=await new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=URL.createObjectURL(f)});
      const k=Math.min(1,1400/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      return await new Promise(r=>c.toBlob(b=>r(b||f),'image/jpeg',.82))}catch(_){return f}}
  /* sube la foto (si hay) y guarda la prueba en el pedido; lanza error si no se pudo */
  async function guardar(o,q){
    if(yaTiene(o,q))return;const id=String(o.id),s=st(id,q),m=falta(o,q);if(m)throw new Error(m);
    const ag=q&&q.dest==='agencia',hr=s.file?s.hora:new Date().toISOString(),op=s.file?null:String(s.op).trim();
    let url=null;
    if(s.file){const {data:au}=await D().auth.getUser();const uid=au&&au.user&&au.user.id;if(!uid)throw new Error('Vuelve a iniciar sesión.');
      const blob=await achicar(s.file),path=uid+'/yape/'+id+'_'+Date.now()+'.jpg',b=D().storage.from('fotos-motorizados');
      const up=await b.upload(path,blob,{cacheControl:'3600',upsert:false,contentType:'image/jpeg'});if(up.error)throw new Error('No se pudo subir la captura: '+up.error.message);
      url=b.getPublicUrl(path)?.data?.publicUrl||null;if(!url)throw new Error('No se obtuvo el enlace de la captura.')}
    const patch=ag?{pago_agencia_prueba:{url,operacion:op,hora:hr}}:Object.assign({yape_pagado_en:hr,yape_operacion:op},url?{comprobante_pago_url:url}:{});
    const {error}=await D().from('pedidos').update(patch).eq('id',o.id);if(error)throw new Error('No se pudo guardar la prueba del Yape: '+error.message);
    Object.assign(o,patch);try{if(s.url)URL.revokeObjectURL(s.url)}catch(_){}delete S[key(id,q)];
  }
  window.PdYapeP={html,acts,falta,guardar,yaTiene};
})();
