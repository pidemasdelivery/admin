
/* Botón para instalar (descargar) la app, igual que en la Tienda. Android: botón «Instalar». iPhone: guía «Agregar a inicio». */
(function(){
  if(window.__pdInstalar)return;window.__pdInstalar=true;
  const NOMBRE='Pidemás Admin';
  const ls={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  const instalada=()=>matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true;
  const ua=navigator.userAgent||'';
  const iOS=/iphone|ipad|ipod/i.test(ua)||(/macintosh/i.test(ua)&&navigator.maxTouchPoints>1);
  const android=/android/i.test(ua)&&!/wv\)|; wv/i.test(ua);
  const iOSSafari=iOS&&/safari/i.test(ua)&&!/crios|fxios|edgios|opios|gsa\//i.test(ua);
  const NO='pdInstalarNo:'+location.pathname.replace(/[^/]*$/,''),DIAS=1; /* cada app guarda su propia respuesta */
  const descartado=()=>{const t=Number(ls.get(NO)||0);return t&&Date.now()-t<DIAS*864e5};
  function hayVentana(){const W=innerWidth,H=innerHeight;
    for(const el of document.querySelectorAll('body > *')){if(el.id==='pdInstalar'||el.matches('header,script,style'))continue;if(/^PD-(VENTANA|APP-|TIENDA)/.test(el.tagName)&&!(el.shadowRoot&&el.shadowRoot.querySelector('[role=dialog],#dl > *')))continue;
      const cs=getComputedStyle(el);if(cs.position!=='fixed'||cs.display==='none'||cs.visibility==='hidden'||el.hidden)continue;
      const r=el.getBoundingClientRect();if(r.width*r.height>W*H*0.45)return true}return false}
  let aviso=null,card=null,intentos=0;
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();aviso=e;programar(400)});
  setTimeout(function(){if(!aviso&&android&&!instalada())programar(0)},3000);
  addEventListener('appinstalled',()=>{ls.set(NO,String(Date.now()+3650*864e5));if(card)card.hidden=true});
  function programar(ms){if(instalada()||descartado()||card&&!card.hidden)return;clearTimeout(programar.t);programar.t=setTimeout(intentar,ms)}
  function intentar(){
    if(instalada()||descartado())return;
    if(!aviso&&!iOSSafari&&!android)return;
    if(hayVentana()||document.activeElement&&/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){if(++intentos<40)programar(1500);return}
    mostrar();
  }
  function mostrar(){
    if(!card){card=document.createElement('div');card.id='pdInstalar';card.setAttribute('role','dialog');card.setAttribute('aria-label','Instalar '+NOMBRE);document.body.appendChild(card)}
    const icono=(document.querySelector('link[rel="apple-touch-icon"]')||{}).href;
    const ico='<span class="ico"'+(icono?' style="background-image:url(\''+icono.replace(/'/g,'%27')+'\')"':'')+'>'+(icono?'':'P')+'</span>';
    card.innerHTML=aviso
      ?ico+'<span class="tx"><b>Instala '+NOMBRE+'</b><small>Ábrela desde tu inicio, más rápida y a pantalla completa.</small></span><span class="bt"><button type="button" class="si">Instalar</button><button type="button" class="no">Ahora no</button></span>'
      :android?ico+'<span class="tx"><b>Instala '+NOMBRE+'</b><small>Toca ⋮ (arriba a la derecha) y luego «Instalar app» o «Agregar a pantalla principal». Si ya la tienes, ábrela desde tu inicio.</small></span><span class="bt"><button type="button" class="no">Entendido</button></span>'
      :ico+'<span class="tx"><b>Instala '+NOMBRE+'</b><small>Toca <svg class="shr" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg> Compartir y luego «Agregar a inicio».</small></span><span class="bt"><button type="button" class="no">Entendido</button></span>';
    card.hidden=false;
    const hd=document.querySelector('header.top,header');const r=hd&&hd.getBoundingClientRect();
    if(r&&r.height&&r.bottom>0)card.style.top=(r.bottom+8)+'px';
    card.querySelector('.no').onclick=()=>{ls.set(NO,String(Date.now()));card.hidden=true};
    const si=card.querySelector('.si');
    if(si)si.onclick=async()=>{const ev=aviso;aviso=null;card.hidden=true;if(!ev)return;try{ev.prompt();const r=await ev.userChoice;if(r&&r.outcome!=='accepted')ls.set(NO,String(Date.now()))}catch(e){}};
  }
  if(iOSSafari&&!instalada())programar(400);
})();
