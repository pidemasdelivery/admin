/* ===== Pidemás · Avisos en «Mi perfil» =====
   Tarjeta «Avisos de pedidos» igual a la del panel del negocio: sonido (encendido/apagado),
   Probar sonido y Activar avisos del teléfono. Usa window.PdSound (si la app no lo tiene, se crea aquí). */
(function(){
  if(window.PdAvisos)return;
  const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  if(!window.PdSound){
    const Snd={ctx:null,on:LS.get('pd_sound','on')!=='off',
      async ready(){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return false;if(!this.ctx)this.ctx=new C();if(this.ctx.state==='suspended')await this.ctx.resume();return this.ctx.state==='running'}catch(e){return false}},
      seq(notes,vol){const c=this.ctx;if(!c)return;const t0=c.currentTime+0.02;notes.forEach(([f,at,dur,type])=>{const o=c.createOscillator(),g=c.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t0+at);g.gain.setValueAtTime(0.0001,t0+at);g.gain.exponentialRampToValueAtTime(vol||0.35,t0+at+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t0+at+dur);o.connect(g);g.connect(c.destination);o.start(t0+at);o.stop(t0+at+dur+0.05)})},
      PAT:{
        nuevo:{n:[[784,0,.16,'square'],[1047,.16,.16,'square'],[1319,.32,.26,'square'],[784,.75,.16,'square'],[1047,.91,.16,'square'],[1319,1.07,.32,'square']],v:.22,vib:[400,150,400,150,600]},
        info:{n:[[988,0,.25]],v:.3,vib:[150]}},
      async play(kind){const p=this.PAT[kind]||this.PAT.info;try{if(navigator.vibrate)navigator.vibrate(p.vib)}catch(e){}if(!this.on)return true;const ok=await this.ready();if(ok)this.seq(p.n,p.v);return ok}};
    window.PdSound=Snd;
    ['click','touchend','keydown'].forEach(ev=>document.addEventListener(ev,()=>{Snd.ready()},{passive:true}));
  }
  const S=d=>'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
  const SND=S('<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>');
  const BELL=S('<path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7"/><path d="M10 20a2 2 0 0 0 4 0"/>');
  const N=()=>'Notification' in window;
  const sw=(attr,on)=>`<button type="button" role="switch" aria-checked="${!!on}" aria-label="Sonido de avisos" ${attr}="avs:snd" style="position:relative;flex:0 0 52px;width:52px;height:32px;border-radius:999px;border:0;padding:0;background:${on?'#C4410C':'#EADFD6'};cursor:pointer;transition:background .2s"><span style="position:absolute;top:3px;left:${on?23:3}px;width:26px;height:26px;border-radius:50%;background:#FFFFFF;box-shadow:0 1px 3px rgba(31,26,23,.25)"></span></button>`;
  /* attr: atributo de acción de cada app (data-a o data-sa); txt: qué avisa el sonido */
  function card(attr,txt){
    const on=!!(window.PdSound&&window.PdSound.on),p=N()?Notification.permission:'';
    const perm=!N()?'Este navegador no permite avisos.':p==='granted'?'Activados.':p==='denied'?'Bloqueados. Actívalos en los ajustes del sitio.':'Desactivados.';
    return `<div class="cd"><div class="lbl">Avisos de pedidos</div>`+
      `<div style="display:flex;align-items:center;gap:12px"><span style="flex:1 1 0%;min-width:0"><b style="display:block;font-size:15px">Sonido de avisos</b><span style="display:block;font-size:13px;color:#6B5E55;margin-top:2px;line-height:1.4">${txt||'Suena cuando llega un pedido nuevo.'}</span></span>${sw(attr,on)}</div>`+
      `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px"><button type="button" class="b" style="height:48px" ${attr}="avs:probar">${SND}Probar sonido</button><button type="button" class="b" style="height:48px" ${attr}="avs:permiso"${p==='denied'||!N()?' disabled':''}>${BELL}${p==='granted'?'Probar aviso':'Activar avisos'}</button></div>`+
      `<span style="font-size:13px;color:#6B5E55">Avisos del teléfono: ${perm}</span></div>`;
  }
  async function probarServidor(){
    /* Aviso de prueba REAL: lo manda el servidor a tus teléfonos, como un pedido. Así pruebas con la pantalla apagada. */
    try{const c=(()=>{try{return db}catch(e){return window.db}})();const t=(await c.auth.getSession()).data.session.access_token;
      const r=await fetch('https://escxesvzndmyfuteawey.supabase.co/functions/v1/enviar-push',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:JSON.stringify({type:'PRUEBA_MIA'})});
      const j=await r.json().catch(()=>({}));if(r.ok&&j.enviados>0){(window.pdAviso||alert)('Te mandamos un aviso de prueba. Apaga la pantalla: debe llegar en unos segundos.');return true}
      if(r.ok&&!j.enviados){(window.pdAviso||alert)('Este teléfono aún no está registrado para avisos. Toca «Activar avisos» otra vez.');return true}}catch(_){}
    return false}
  async function probarAviso(){if(await probarServidor())return;
    try{const r=await navigator.serviceWorker.getRegistration();if(r){await r.showNotification('Pidemás',{body:'Así se verán tus avisos de pedidos.',icon:new URL('icon-192.png',r.scope).href,badge:new URL('icon-192.png',r.scope).href,tag:'pd-prueba',vibrate:[200,100,200]});return}}catch(_){}
    try{new Notification('Pidemás',{body:'Así se verán tus avisos de pedidos.'})}catch(_){}
  }
  async function accion(k){
    const s=window.PdSound;
    if(k==='snd'&&s){s.on=!s.on;LS.set('pd_sound',s.on?'on':'off');if(s.on){await s.ready();s.play('info')}return}
    if(k==='probar'&&s){await s.ready();const was=s.on;s.on=true;await s.play('nuevo');s.on=was;return}
    if(k==='permiso'&&N()){
      if(Notification.permission==='granted'){await probarAviso();return}
      if(Notification.permission==='default'){let p='default';try{p=await Notification.requestPermission()}catch(_){}
        if(p==='granted'){window.pdAviso&&window.pdAviso('Avisos activados ✓ Te avisaremos de cada pedido.');probarAviso()}}
    }
  }
  window.PdAvisos={card,accion};
})();

/* ===== Admin · sonido de pedido nuevo (respeta «Sonido de avisos») ===== */
(function(){
  if(window.__pdSndAdm)return;window.__pdSndAdm=1;
  const L=()=>{try{return Array.isArray(allOrders)?allOrders:[]}catch(e){return window.allOrders||[]}};
  let vistos=null;
  setInterval(()=>{const l=L();if(!l.length)return;
    const ids=new Set(l.map(o=>String(o.id)));
    if(!vistos){vistos=ids;return}
    const nuevo=l.some(o=>!vistos.has(String(o.id))&&Date.now()-new Date(o.creado_en||0).getTime()<15*60e3&&!['entregado','cancelado'].includes(String(o.estado||'').toLowerCase()));
    vistos=ids;
    if(nuevo&&window.PdSound)window.PdSound.play('nuevo');
  },2000);
})();
