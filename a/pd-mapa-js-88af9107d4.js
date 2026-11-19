
/* ===== pd-mapa: tarjeta de ubicación + mapa a pantalla completa (mismo diseño en todos los paneles) ===== */
(function(){
if(window.pdMapa)return;
const LAYER=(document.currentScript&&document.currentScript.dataset.layer)||'';
const $=id=>document.getElementById(id);
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PIURA={lat:-5.1945,lng:-80.6328};
const TILES='https://tile.openstreetmap.org/{z}/{x}/{y}.png',ATTR='© OpenStreetMap';
const PIN='<svg viewBox="0 0 44 56" width="100%" height="100%" aria-hidden="true"><path d="M22 54s19-19.4 19-32.5A19 19 0 0 0 3 21.5C3 34.6 22 54 22 54z" fill="#C4410C" stroke="#fff" stroke-width="3"/><circle cx="22" cy="21.5" r="7.5" fill="#fff"/></svg>';
const I={
 pin:'<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
 link:'<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
 mapa:'<svg viewBox="0 0 24 24"><path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z"/><path d="M9 4v13M15 7v13"/></svg>',
 gps:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>',
 exp:'<svg viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
 back:'<svg viewBox="0 0 24 24"><path d="M5 12h14M5 12l6 6M5 12l6-6"/></svg>',
 lupa:'<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/></svg>',
 ok:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 10"/></svg>',
 alerta:'<svg viewBox="0 0 24 24"><path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.01"/></svg>',
 copia:'<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg>',
 abrir:'<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></svg>',
 mas:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
 menos:'<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
 x:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};
/* ---------- estilos ---------- */
const Z='html:root body'+':not(#pdZ)'.repeat(30);
const CSS=`
${Z} .pdmc{display:flex!important;flex-direction:column!important;gap:12px!important;margin:0!important;padding:0!important;font-family:var(--font,system-ui)!important;color:#1F1A17!important}
${Z} .pdmc svg,${Z} #pdmcFull svg{display:block!important;visibility:visible!important;opacity:1!important;fill:none!important;stroke:currentColor!important;stroke-width:2!important;stroke-linecap:round!important;stroke-linejoin:round!important}
${Z} .pdmc .pdmcPin svg,${Z} #pdmcFull .pdmcPin svg{stroke:none!important;fill:initial!important}
${Z} .pdmc .pdmcPin svg path,${Z} #pdmcFull .pdmcPin svg path{fill:#C4410C!important;stroke:#fff!important;stroke-width:3!important}
${Z} .pdmc .pdmcPin svg circle,${Z} #pdmcFull .pdmcPin svg circle{fill:#fff!important;stroke:none!important}
${Z} .pdmc .pdmcPv{position:relative!important;display:block!important;height:184px!important;margin:0!important;border-radius:20px!important;overflow:hidden!important;border:1px solid #F1E4DA!important;background:linear-gradient(135deg,#FFF3EA,#FBE6DD)!important;cursor:pointer!important;isolation:isolate!important;box-shadow:0 6px 18px rgba(196,65,12,.10)!important}
${Z} .pdmc .pdmcMp{position:absolute!important;inset:0!important;z-index:1!important}
${Z} .pdmc .pdmcMp::after{content:""!important;position:absolute!important;inset:0!important;z-index:450!important;pointer-events:none!important;background:linear-gradient(180deg,rgba(31,26,23,.18),rgba(31,26,23,0) 34%,rgba(31,26,23,0) 64%,rgba(31,26,23,.26))!important}
${Z} .pdmc .leaflet-container img,${Z} #pdmcFull .leaflet-container img{max-width:none!important;max-height:none!important;width:auto;height:auto;border-radius:0!important;box-shadow:none!important}
${Z} .pdmc .leaflet-control-attribution{font-size:8px!important;background:rgba(255,255,255,.7)!important;padding:0 4px!important}
${Z} .pdmc .pdmcPin,${Z} #pdmcFull .pdmcPin{position:absolute!important;left:50%!important;top:50%!important;z-index:500!important;width:40px!important;height:51px!important;transform:translate(-50%,-100%)!important;pointer-events:none!important;filter:drop-shadow(0 6px 8px rgba(31,26,23,.28))!important;transition:transform .18s ease!important}
${Z} .pdmc .pdmcPin::after,${Z} #pdmcFull .pdmcPin::after{content:""!important;position:absolute!important;left:50%!important;bottom:-5px!important;width:14px!important;height:6px!important;margin-left:-7px!important;border-radius:50%!important;background:rgba(31,26,23,.28)!important;filter:blur(1px)!important}
${Z} .pdmc .pdmcTag{position:absolute!important;left:10px!important;top:10px!important;z-index:600!important;display:inline-flex!important;align-items:center!important;gap:6px!important;height:30px!important;padding:0 11px!important;border-radius:999px!important;background:#fff!important;color:#1F1A17!important;font:800 12px/1 var(--font,system-ui)!important;box-shadow:0 2px 8px rgba(31,26,23,.16)!important}
${Z} .pdmc .pdmcTag i{width:8px!important;height:8px!important;border-radius:50%!important;background:#1FA855!important;box-shadow:0 0 0 3px rgba(31,168,85,.18)!important}
${Z} .pdmc .pdmcTag.pend i{background:#E8890C!important;box-shadow:0 0 0 3px rgba(232,137,12,.2)!important}
${Z} .pdmc .pdmcTag.no i{background:#C62828!important;box-shadow:0 0 0 3px rgba(198,40,40,.18)!important}
${Z} .pdmc .pdmcExp{position:absolute!important;right:10px!important;bottom:10px!important;z-index:600!important;display:inline-flex!important;align-items:center!important;gap:6px!important;height:34px!important;padding:0 13px!important;border-radius:999px!important;background:#1F1A17!important;color:#fff!important;font:800 12.5px/1 var(--font,system-ui)!important;box-shadow:0 4px 12px rgba(31,26,23,.28)!important}
${Z} .pdmc .pdmcExp svg{width:15px!important;height:15px!important}
${Z} .pdmc .pdmcVacio{position:absolute!important;inset:0!important;z-index:550!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:8px!important;padding:16px!important;text-align:center!important;font:700 13.5px/1.35 var(--font,system-ui)!important;color:#7A3A1C!important;background:radial-gradient(circle at 50% 40%,#FFF8F3 0,#FBE6DD 70%)!important}
${Z} .pdmc .pdmcVacio[hidden]{display:none!important}
${Z} .pdmc .pdmcVacio span{display:grid!important;place-items:center!important;width:52px!important;height:52px!important;border-radius:18px!important;background:#C4410C!important;color:#fff!important;box-shadow:0 8px 18px rgba(196,65,12,.3)!important}
${Z} .pdmc .pdmcVacio span svg{width:26px!important;height:26px!important}
${Z} .pdmc .pdmcInfo{display:flex!important;flex-direction:column!important;margin:0!important;padding:0!important;border:1px solid #F1E4DA!important;border-radius:18px!important;background:#FFFBF8!important;overflow:hidden!important}
${Z} .pdmc .pdmcRow{display:flex!important;align-items:center!important;gap:12px!important;min-height:62px!important;margin:0!important;padding:10px 12px!important;border:0!important;background:transparent!important}
${Z} .pdmc .pdmcRow+.pdmcRow{border-top:1px solid #F1E4DA!important}
${Z} .pdmc .pdmcIco{flex:0 0 38px!important;display:grid!important;place-items:center!important;width:38px!important;height:38px!important;border-radius:12px!important;background:#FBE6DD!important;color:#C4410C!important}
${Z} .pdmc .pdmcIco svg{width:19px!important;height:19px!important}
${Z} .pdmc .pdmcTx{flex:1 1 auto!important;min-width:0!important;display:flex!important;flex-direction:column!important;gap:3px!important}
${Z} .pdmc .pdmcTx small{display:block!important;font:800 10.5px/1.1 var(--font,system-ui)!important;letter-spacing:.06em!important;text-transform:uppercase!important;color:#9A8578!important;margin:0!important}
${Z} .pdmc .pdmcTx input,${Z} .pdmc .pdmcTx textarea{display:block!important;width:100%!important;min-width:0!important;height:auto!important;min-height:0!important;margin:0!important;padding:2px 0!important;border:0!important;border-bottom:1px dashed transparent!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;outline:0!important;font:700 14.5px/1.3 var(--font,system-ui)!important;color:#1F1A17!important;-webkit-text-fill-color:#1F1A17!important}
${Z} .pdmc .pdmcTx input:focus{border-bottom-color:#C4410C!important}
${Z} .pdmc .pdmcTx input::placeholder{color:#B9A79B!important;-webkit-text-fill-color:#B9A79B!important;font-weight:600!important}
${Z} .pdmc .pdmcTx a,${Z} .pdmc .pdmcTx .pdmcUrl{display:block!important;overflow:hidden!important;white-space:nowrap!important;text-overflow:ellipsis!important;font:700 13.5px/1.3 var(--font,system-ui)!important;color:#C4410C!important;-webkit-text-fill-color:#C4410C!important;text-decoration:none!important}
${Z} .pdmc .pdmcTx .pdmcUrl.vac{color:#B9A79B!important;-webkit-text-fill-color:#B9A79B!important;font-weight:600!important}
${Z} .pdmc .pdmcTx em{font:600 11.5px/1.2 var(--font,system-ui)!important;color:#9A8578!important;font-style:normal!important}
${Z} .pdmc .pdmcMini{flex:0 0 auto!important;display:grid!important;place-items:center!important;width:38px!important;height:38px!important;min-height:0!important;margin:0!important;padding:0!important;border:1px solid #F1E4DA!important;border-radius:12px!important;background:#fff!important;color:#1F1A17!important;box-shadow:none!important;cursor:pointer!important}
${Z} .pdmc .pdmcMini svg{width:18px!important;height:18px!important}
${Z} .pdmc .pdmcMini.ok{background:#1FA855!important;border-color:#1FA855!important;color:#fff!important}
${Z} .pdmc .pdmcMini[disabled]{opacity:.4!important}
${Z} .pdmc .pdmcBts{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;margin:0!important}
${Z} .pdmc .pdmcBts button{display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;width:100%!important;height:48px!important;min-height:0!important;margin:0!important;padding:0 10px!important;border-radius:999px!important;font:800 13.5px/1 var(--font,system-ui)!important;box-shadow:none!important;cursor:pointer!important;white-space:nowrap!important}
${Z} .pdmc .pdmcBts button svg{width:18px!important;height:18px!important;flex:0 0 auto!important}
${Z} .pdmc .pdmcBts .pri{background:#C4410C!important;border:1px solid #C4410C!important;color:#fff!important;-webkit-text-fill-color:#fff!important;box-shadow:0 6px 14px rgba(196,65,12,.24)!important}
${Z} .pdmc .pdmcBts .sec{background:#fff!important;border:1px solid #F1E4DA!important;color:#1F1A17!important;-webkit-text-fill-color:#1F1A17!important}
${Z} .pdmc .pdmcSt{display:flex!important;align-items:flex-start!important;gap:8px!important;margin:0!important;padding:10px 12px!important;border-radius:14px!important;font:600 13px/1.4 var(--font,system-ui)!important;background:#EAF7EF!important;color:#17643A!important}
${Z} .pdmc .pdmcSt svg{flex:0 0 18px!important;width:18px!important;height:18px!important;margin-top:1px!important}
${Z} .pdmc .pdmcSt.pend{background:#FFF3E2!important;color:#8A4B06!important}
${Z} .pdmc .pdmcSt.bad{background:#FDECEA!important;color:#A42020!important}
${Z} .pdmc .pdmcSt[hidden]{display:none!important}
/* ---------- pantalla completa ---------- */
${Z} #pdmcFull{position:fixed!important;inset:0!important;z-index:2147483647!important;display:block!important;margin:0!important;padding:0!important;background:#FBE6DD!important;font-family:var(--font,system-ui)!important;color:#1F1A17!important;transform:none!important}
${Z} #pdmcFull[hidden]{display:none!important}
${Z} #pdmcFull .pdmcBig{position:absolute!important;inset:0!important;z-index:1!important}
${Z} #pdmcFull .pdmcPin{z-index:700!important;width:48px!important;height:61px!important}
${Z} #pdmcFull.mov .pdmcPin{transform:translate(-50%,-118%)!important}
${Z} #pdmcFull .pdmcTop{position:absolute!important;left:0!important;right:0!important;top:0!important;z-index:900!important;display:flex!important;flex-direction:column!important;gap:10px!important;padding:calc(12px + env(safe-area-inset-top,0px)) 12px 18px!important;background:linear-gradient(180deg,rgba(255,255,255,.96) 55%,rgba(255,255,255,0))!important;pointer-events:none!important}
${Z} #pdmcFull .pdmcTop > *{pointer-events:auto!important}
${Z} #pdmcFull .pdmcHd{display:flex!important;align-items:center!important;gap:10px!important}
${Z} #pdmcFull .pdmcHd b{flex:1 1 auto!important;font:800 18px/1.2 var(--font,system-ui)!important;color:#1F1A17!important}
${Z} #pdmcFull .pdmcRnd{display:grid!important;place-items:center!important;flex:0 0 44px!important;width:44px!important;height:44px!important;min-height:0!important;margin:0!important;padding:0!important;border-radius:50%!important;border:1px solid #F1E4DA!important;background:#fff!important;color:#1F1A17!important;box-shadow:0 3px 10px rgba(31,26,23,.12)!important;cursor:pointer!important}
${Z} #pdmcFull .pdmcRnd svg{width:21px!important;height:21px!important}
${Z} #pdmcFull .pdmcBus{position:relative!important;display:flex!important;align-items:center!important;gap:9px!important;height:50px!important;padding:0 8px 0 15px!important;border-radius:999px!important;background:#fff!important;border:1px solid #F1E4DA!important;box-shadow:0 6px 18px rgba(31,26,23,.12)!important;color:#9A8578!important}
${Z} #pdmcFull .pdmcBus > svg{width:20px!important;height:20px!important;flex:0 0 auto!important}
${Z} #pdmcFull .pdmcBus input{flex:1 1 auto!important;min-width:0!important;width:auto!important;height:46px!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important;outline:0!important;font:600 15px/1 var(--font,system-ui)!important;color:#1F1A17!important;-webkit-text-fill-color:#1F1A17!important}
${Z} #pdmcFull .pdmcBus button{display:grid!important;place-items:center!important;width:34px!important;height:34px!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;border-radius:50%!important;background:#F6EEE8!important;color:#7A6A60!important;box-shadow:none!important}
${Z} #pdmcFull .pdmcBus button[hidden]{display:none!important}
${Z} #pdmcFull .pdmcBus button svg{width:16px!important;height:16px!important}
${Z} #pdmcFull .pdmcRs{display:flex!important;flex-direction:column!important;max-height:46vh!important;overflow:auto!important;border-radius:18px!important;background:#fff!important;border:1px solid #F1E4DA!important;box-shadow:0 10px 26px rgba(31,26,23,.16)!important}
${Z} #pdmcFull .pdmcRs[hidden]{display:none!important}
${Z} #pdmcFull .pdmcRs button{display:flex!important;align-items:center!important;gap:11px!important;width:100%!important;height:auto!important;min-height:58px!important;margin:0!important;padding:9px 14px!important;border:0!important;border-bottom:1px solid #F6EEE8!important;border-radius:0!important;background:#fff!important;text-align:left!important;color:#1F1A17!important;box-shadow:none!important;font:700 14px/1.25 var(--font,system-ui)!important}
${Z} #pdmcFull .pdmcRs button svg{width:18px!important;height:18px!important;flex:0 0 auto!important;color:#C4410C!important}
${Z} #pdmcFull .pdmcRs button small{display:block!important;font:500 12px/1.3 var(--font,system-ui)!important;color:#9A8578!important;margin-top:2px!important}
${Z} #pdmcFull .pdmcRs .nada{padding:14px!important;font:600 13px/1.4 var(--font,system-ui)!important;color:#7A6A60!important}
${Z} #pdmcFull .pdmcTip{position:absolute!important;left:50%!important;top:50%!important;z-index:800!important;transform:translate(-50%,-128px)!important;padding:8px 13px!important;border-radius:999px!important;background:#1F1A17!important;color:#fff!important;font:700 12.5px/1 var(--font,system-ui)!important;white-space:nowrap!important;pointer-events:none!important;box-shadow:0 4px 12px rgba(31,26,23,.25)!important;transition:opacity .2s!important}
${Z} #pdmcFull.mov .pdmcTip,${Z} #pdmcFull .pdmcTip.fuera{opacity:0!important}
${Z} #pdmcFull .pdmcSide{position:absolute!important;right:12px!important;bottom:calc(200px + env(safe-area-inset-bottom,0px))!important;z-index:850!important;display:flex!important;flex-direction:column!important;gap:8px!important}
${Z} #pdmcFull .pdmcSide .gps{background:#C4410C!important;border-color:#C4410C!important;color:#fff!important}
${Z} #pdmcFull .pdmcFt{position:absolute!important;left:0!important;right:0!important;bottom:0!important;z-index:900!important;display:flex!important;flex-direction:column!important;gap:12px!important;padding:8px 16px calc(16px + env(safe-area-inset-bottom,0px))!important;border-radius:26px 26px 0 0!important;background:#fff!important;box-shadow:0 -10px 30px rgba(31,26,23,.16)!important}
${Z} #pdmcFull .pdmcFt::before{content:""!important;display:block!important;width:42px!important;height:5px!important;margin:0 auto 2px!important;border-radius:99px!important;background:#EADBD1!important}
${Z} #pdmcFull .pdmcDr{display:flex!important;align-items:center!important;gap:12px!important}
${Z} #pdmcFull .pdmcDr .pdmcIco{flex:0 0 46px!important;display:grid!important;place-items:center!important;width:46px!important;height:46px!important;border-radius:15px!important;background:#FBE6DD!important;color:#C4410C!important}
${Z} #pdmcFull .pdmcDr .pdmcIco svg{width:22px!important;height:22px!important}
${Z} #pdmcFull .pdmcDr span{flex:1 1 auto!important;min-width:0!important;display:flex!important;flex-direction:column!important;gap:3px!important}
${Z} #pdmcFull .pdmcDr small.k{font:800 10.5px/1 var(--font,system-ui)!important;letter-spacing:.06em!important;text-transform:uppercase!important;color:#9A8578!important}
${Z} #pdmcFull .pdmcDr b{font:800 16px/1.25 var(--font,system-ui)!important;color:#1F1A17!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
${Z} #pdmcFull .pdmcDr small.s{font:600 12.5px/1.3 var(--font,system-ui)!important;color:#7A6A60!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
${Z} #pdmcFull .pdmcOk{display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;width:100%!important;height:54px!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;border-radius:999px!important;background:#C4410C!important;color:#fff!important;-webkit-text-fill-color:#fff!important;font:800 16px/1 var(--font,system-ui)!important;box-shadow:0 8px 18px rgba(196,65,12,.3)!important;cursor:pointer!important}
${Z} #pdmcFull .pdmcOk svg{width:20px!important;height:20px!important}
${Z} #pdmcFull .leaflet-control-attribution{font-size:9px!important;margin-bottom:178px!important}
`;
(function(){if($('pd-mapa-css'))return;const st=document.createElement('style');st.id='pd-mapa-css';st.textContent=LAYER?'@layer '+LAYER+'{'+CSS+'}':CSS;(document.head||document.documentElement).appendChild(st)})();
/* ---------- utilidades ---------- */
let Lp=null;
function leaflet(){
 if(window.L&&L.map)return Promise.resolve(L);if(Lp)return Lp;
 Lp=new Promise((ok,ko)=>{if(!document.querySelector('link[href*="leaflet"]')){const l=document.createElement('link');l.rel='stylesheet';l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(l)}
  const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.onload=()=>ok(window.L);s.onerror=()=>{Lp=null;ko(new Error('No cargó el mapa'))};document.head.appendChild(s)});return Lp;
}
function coords(v){
 let s=String(v||'');try{s=decodeURIComponent(s)}catch(e){}
 for(const re of [/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/,/[?&](?:q|query|ll|destination|center)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/,/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,/^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/]){const m=s.match(re);if(m){const la=Number(m[1]),ln=Number(m[2]);if(la&&ln&&Math.abs(la)<=90&&Math.abs(ln)<=180)return {lat:la,lng:ln}}}
 return null;
}
const fx=n=>Number(n).toFixed(6);
const linkDe=c=>'https://www.google.com/maps?q='+fx(c.lat)+','+fx(c.lng);
const esCorto=v=>/(maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(String(v||''));
async function inversa(c){
 try{const r=await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=es&lat='+c.lat+'&lon='+c.lng);const j=await r.json();const a=j.address||{};
  const calle=[a.road||a.pedestrian||a.footway||a.residential,a.house_number].filter(Boolean).join(' ');
  const zona=a.neighbourhood||a.suburb||a.quarter||a.city_district||a.hamlet||'';const ciudad=a.city||a.town||a.village||a.county||'';
  return {linea:calle||zona||j.name||'',sub:[calle?zona:'',ciudad].filter(Boolean).join(', ')};
 }catch(e){return null}
}
async function buscar(q){
 const r=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&accept-language=es&countrycodes=pe&viewbox=-80.78,-5.08,-80.52,-5.30&q='+encodeURIComponent(q+(/piura|castilla|veintis|sullana|paita|catacaos/i.test(q)?'':', Piura')));
 const j=await r.json();return (Array.isArray(j)?j:[]).map(x=>({lat:Number(x.lat),lng:Number(x.lon),nom:(x.name||String(x.display_name).split(',')[0]),sub:String(x.display_name).split(',').slice(1,4).join(',').trim()}));
}
function aviso(t){try{if(window.pdAviso)return pdAviso(t)}catch(e){}alert(t)}
function setVal(el,v){if(!el||el.value===v)return;el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}
async function copiar(t){try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(t);return true}}catch(e){}
 const i=document.createElement('textarea');i.value=t;i.style.cssText='position:fixed;opacity:0;left:-99px';document.body.appendChild(i);i.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}i.remove();return ok}
/* ---------- mapa a pantalla completa ---------- */
let big=null,tRev=null,ultima=null,resolver=null;
function elegir(o){
 o=o||{};
 return new Promise(res=>{
  if(resolver)resolver(null);resolver=res;
  let m=$('pdmcFull');
  if(!m){m=document.createElement('div');m.id='pdmcFull';m.hidden=true;
   m.innerHTML='<div class="pdmcBig" id="pdmcBig"></div><div class="pdmcPin">'+PIN+'</div><div class="pdmcTip" id="pdmcTip"></div>'+
    '<div class="pdmcTop"><div class="pdmcHd"><button type="button" class="pdmcRnd" data-a="x" aria-label="Volver">'+I.back+'</button><b id="pdmcTit"></b></div>'+
    '<div class="pdmcBus">'+I.lupa+'<input id="pdmcQ" placeholder="Busca una calle o pega un enlace" enterkeyhint="search" autocomplete="off"><button type="button" data-a="limpiar" id="pdmcQx" hidden aria-label="Borrar">'+I.x+'</button></div>'+
    '<div class="pdmcRs" id="pdmcRs" hidden></div></div>'+
    '<div class="pdmcSide"><button type="button" class="pdmcRnd" data-a="mas" aria-label="Acercar">'+I.mas+'</button><button type="button" class="pdmcRnd" data-a="menos" aria-label="Alejar">'+I.menos+'</button><button type="button" class="pdmcRnd gps" data-a="gps" aria-label="Mi ubicación">'+I.gps+'</button></div>'+
    '<div class="pdmcFt"><div class="pdmcDr"><span class="pdmcIco">'+I.pin+'</span><span><small class="k" id="pdmcK">Punto elegido</small><b id="pdmcDir">Mueve el mapa</b><small class="s" id="pdmcSub"></small></span></div><button type="button" class="pdmcOk" data-a="ok">'+I.ok+'<span>Confirmar ubicación</span></button></div>';
   document.body.appendChild(m);
   m.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
    if(a==='x')cerrar(null);
    if(a==='ok'){if(!big)return;const c=big.getCenter();cerrar({lat:c.lat,lng:c.lng,linea:ultima&&ultima.linea||'',sub:ultima&&ultima.sub||''})}
    if(a==='mas'&&big)big.zoomIn();if(a==='menos'&&big)big.zoomOut();
    if(a==='gps'){if(!navigator.geolocation){aviso('Este teléfono no permite obtener la ubicación.');return}b.style.opacity=.5;navigator.geolocation.getCurrentPosition(p=>{b.style.opacity=1;big&&big.setView([p.coords.latitude,p.coords.longitude],18)},err=>{b.style.opacity=1;aviso(err&&err.code===1?'Permite el acceso a la ubicación para usar esta opción.':'No se pudo obtener tu ubicación. Intenta de nuevo o mueve el mapa.')},{enableHighAccuracy:true,timeout:20000,maximumAge:0})}
    if(a==='res'){const r=JSON.parse(b.dataset.r);$('pdmcRs').hidden=true;$('pdmcQ').blur();big&&big.setView([r.lat,r.lng],18)}
    if(a==='limpiar'){$('pdmcQ').value='';$('pdmcRs').hidden=true;$('pdmcQx').hidden=true;$('pdmcQ').focus()}
   });
   let tq=null;const q=$('pdmcQ'),rs=$('pdmcRs');
   const correr=async()=>{const v=q.value.trim();$('pdmcQx').hidden=!v;if(v.length<3){rs.hidden=true;return}const k=coords(v);if(k){rs.hidden=true;q.blur();big&&big.setView([k.lat,k.lng],18);return}
    if(esCorto(v)){rs.hidden=false;rs.innerHTML='<div class="nada">Los enlaces cortos de Google Maps no traen las coordenadas. Busca la calle o mueve el mapa hasta el lugar.</div>';return}
    rs.hidden=false;rs.innerHTML='<div class="nada">Buscando…</div>';
    try{const L2=await buscar(v);rs.innerHTML=L2.length?L2.map(r=>'<button type="button" data-a="res" data-r=\''+E(JSON.stringify({lat:r.lat,lng:r.lng}))+'\'>'+I.pin+'<span>'+E(r.nom)+'<small>'+E(r.sub)+'</small></span></button>').join(''):'<div class="nada">No encontramos ese lugar. Prueba con otra calle o mueve el mapa.</div>'}catch(e){rs.innerHTML='<div class="nada">No se pudo buscar. Mueve el mapa a mano.</div>'}};
   q.addEventListener('input',()=>{$('pdmcQx').hidden=!q.value;clearTimeout(tq);tq=setTimeout(correr,600)});
   q.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();clearTimeout(tq);correr()}});
  }
  document.body.appendChild(m);m.hidden=false;document.documentElement.style.overflow='hidden';document.body.classList.add('pdmc-abierto');
  $('pdmcTit').textContent=o.titulo||'Elige la ubicación';$('pdmcK').textContent=o.etiqueta||'Punto elegido';
  const tip=$('pdmcTip');tip.textContent=o.tip||'Mueve el mapa hasta el lugar';tip.classList.remove('fuera');
  $('pdmcQ').value='';$('pdmcQx').hidden=true;$('pdmcRs').hidden=true;
  const ini=o.centro||PIURA,z=o.centro?18:15;
  $('pdmcDir').textContent='Cargando mapa…';$('pdmcSub').textContent='';ultima=null;
  leaflet().then(L=>{
   if(!big){big=L.map('pdmcBig',{zoomControl:false,attributionControl:true}).setView([ini.lat,ini.lng],z);L.tileLayer(TILES,{maxZoom:19,attribution:ATTR}).addTo(big);
    big.on('movestart',()=>{m.classList.add('mov');tip.classList.add('fuera')});big.on('moveend',()=>{m.classList.remove('mov');rev()})}
   else big.setView([ini.lat,ini.lng],z,{animate:false});
   setTimeout(()=>{big.invalidateSize();rev()},80);
  }).catch(()=>{$('pdmcDir').textContent='No se pudo cargar el mapa';$('pdmcSub').textContent='Revisa tu conexión e inténtalo de nuevo.'});
 });
}
function rev(){
 if(!big)return;const c=big.getCenter();$('pdmcDir').textContent='Buscando dirección…';$('pdmcSub').textContent=fx(c.lat)+', '+fx(c.lng);
 clearTimeout(tRev);tRev=setTimeout(async()=>{const r=await inversa(c);const n=big.getCenter();if(Math.abs(n.lat-c.lat)>1e-6||Math.abs(n.lng-c.lng)>1e-6)return;ultima=r;
  $('pdmcDir').textContent=r&&r.linea?r.linea:'Punto marcado en el mapa';$('pdmcSub').textContent=r&&r.sub?r.sub:fx(c.lat)+', '+fx(c.lng)},500);
}
function cerrar(v){const m=$('pdmcFull');if(m)m.hidden=true;document.documentElement.style.overflow='';document.body.classList.remove('pdmc-abierto');const r=resolver;resolver=null;if(r)r(v)}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('pdmcFull')&&!$('pdmcFull').hidden){e.stopPropagation();cerrar(null)}},true);
/* ---------- tarjeta de ubicación ---------- */
const tarjetas=[];
function ocultar(el){const it=el&&(el.closest('.profileItem,.field,.cnxF,label')||el);if(it&&it.style.getPropertyValue('display')!=='none')it.style.setProperty('display','none','important')}
function tarjeta(host,o){
 if(!host||host.querySelector(':scope > .pdmc'))return null;
 const c=document.createElement('div');c.className='pdmc';
 c.innerHTML='<div class="pdmcPv" data-a="abrir" role="button" aria-label="Abrir el mapa"><div class="pdmcMp"></div><div class="pdmcPin">'+PIN+'</div><span class="pdmcTag"><i></i><b></b></span><span class="pdmcExp">'+I.exp+'Ampliar</span><div class="pdmcVacio"><span>'+I.pin+'</span>Todavía no está marcado en el mapa.<br>Toca aquí para marcarlo.</div></div>'+
  '<div class="pdmcInfo"><div class="pdmcRow pdmcRDir"><span class="pdmcIco">'+I.pin+'</span><span class="pdmcTx"><small>Dirección</small></span></div>'+
  '<div class="pdmcRow"><span class="pdmcIco">'+I.link+'</span><span class="pdmcTx"><small>Google Maps</small><span class="pdmcUrl"></span><em class="pdmcXY"></em></span><button type="button" class="pdmcMini" data-a="copiar" aria-label="Copiar enlace">'+I.copia+'</button><button type="button" class="pdmcMini" data-a="ver" aria-label="Abrir en Google Maps">'+I.abrir+'</button></div></div>'+
  '<div class="pdmcBts"><button type="button" class="pri" data-a="abrir">'+I.mapa+'<span>Elegir en el mapa</span></button><button type="button" class="sec" data-a="gps">'+I.gps+'<span>'+E(o.gpsTxt||'Estoy aquí')+'</span></button></div>'+
  '<div class="pdmcSt" role="status"></div>';
 (o.antes&&o.antes.parentElement===host)?host.insertBefore(c,o.antes):host.appendChild(c);
 const t={c,o,mini:null,pend:false,firma:''};tarjetas.push(t);
 const rd=c.querySelector('.pdmcRDir .pdmcTx');
 if(o.dir){ocultar(o.dir);o.dir.style.removeProperty('display');rd.appendChild(o.dir);if(!o.dir.placeholder)o.dir.placeholder='Escribe la dirección y referencia'}
 else c.querySelector('.pdmcRDir').remove();
 [o.lat,o.lng,o.maps].forEach(ocultar);
 c.addEventListener('click',async e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
  if(a==='abrir')abrirT(t);
  if(a==='gps'){if(!navigator.geolocation){aviso('Este teléfono no permite obtener la ubicación.');return}const h=b.innerHTML;b.innerHTML=I.gps+'<span>Buscando…</span>';b.disabled=true;
   navigator.geolocation.getCurrentPosition(p=>{b.innerHTML=h;b.disabled=false;abrirT(t,{lat:p.coords.latitude,lng:p.coords.longitude},'Revisa que el punto esté en el lugar exacto')},err=>{b.innerHTML=h;b.disabled=false;aviso(err&&err.code===1?'Permite el acceso a la ubicación para usar esta opción.':'No se pudo obtener tu ubicación. Intenta de nuevo o márcala en el mapa.')},{enableHighAccuracy:true,timeout:20000,maximumAge:0})}
  if(a==='copiar'){const u=url(t);if(!u)return;if(await copiar(u)){b.classList.add('ok');b.innerHTML=I.ok;setTimeout(()=>{b.classList.remove('ok');b.innerHTML=I.copia},1600)}}
  if(a==='ver'){const u=url(t);if(u)window.open(u,'_blank','noopener')}
 });
 if(o.guardar)document.addEventListener('click',e=>{if(e.target.closest(o.guardar))setTimeout(()=>{t.pend=false;t.firma='';pintar(t)},1500)},true);
 pintar(t);return t;
}
const pos=t=>{const la=t.o.lat,ln=t.o.lng;const a=Number(la&&la.value),b=Number(ln&&ln.value);if(la&&String(la.value).trim()!==''&&Number.isFinite(a)&&Number.isFinite(b)&&a&&b)return {lat:a,lng:b};return coords(t.o.maps&&t.o.maps.value)};
const url=t=>{const v=(t.o.maps&&t.o.maps.value||'').trim();if(/^https?:\/\//i.test(v))return v;const k=pos(t);return k?linkDe(k):''};
async function abrirT(t,centro,tip){
 const r=await elegir({titulo:t.o.titulo,etiqueta:t.o.etiqueta,tip:tip||t.o.tip,centro:centro||pos(t)});if(!r)return;
 setVal(t.o.lat,fx(r.lat));setVal(t.o.lng,fx(r.lng));if(t.o.maps)setVal(t.o.maps,linkDe(r));
 if(t.o.dir&&!t.o.dir.value.trim()&&r.linea)setVal(t.o.dir,[r.linea,r.sub].filter(Boolean).join(', '));
 t.pend=!!t.o.pendTxt;t.firma='';pintar(t);if(t.o.alConfirmar)try{t.o.alConfirmar(r)}catch(e){}
}
function pintar(t){
 const c=t.c,k=pos(t),u=url(t),mv=(t.o.maps&&t.o.maps.value||'').trim();
 const f=(k?fx(k.lat)+fx(k.lng):'-')+'|'+u+'|'+t.pend+'|'+!!c.offsetWidth;if(f===t.firma)return;t.firma=f;
 c.querySelector('.pdmcVacio').hidden=!!k;
 const tag=c.querySelector('.pdmcTag');tag.className='pdmcTag'+(k?(t.pend?' pend':''):' no');tag.querySelector('b').textContent=k?(t.pend?'Sin guardar':(t.o.etiqueta||'Ubicación')):'Sin marcar';
 const ue=c.querySelector('.pdmcUrl');ue.textContent=u?u.replace(/^https?:\/\/(www\.)?/,''):'Se crea al marcar en el mapa';ue.classList.toggle('vac',!u);
 c.querySelector('.pdmcXY').textContent=k?fx(k.lat)+', '+fx(k.lng):'';
 c.querySelectorAll('.pdmcMini').forEach(b=>b.disabled=!u);
 const st=c.querySelector('.pdmcSt');
 if(k&&t.pend){st.hidden=false;st.className='pdmcSt pend';st.innerHTML=I.alerta+'<span>'+E(t.o.pendTxt)+'</span>'}
 else if(k&&mv&&esCorto(mv)){st.hidden=false;st.className='pdmcSt pend';st.innerHTML=I.alerta+'<span>El enlace corto de Google Maps no trae coordenadas; se usa el punto marcado en el mapa.</span>'}
 else if(k){if(t.o.okTxt){st.hidden=false;st.className='pdmcSt';st.innerHTML=I.ok+'<span>'+E(t.o.okTxt)+'</span>'}else st.hidden=true}
 else{st.hidden=false;st.className='pdmcSt bad';st.innerHTML=I.alerta+'<span>'+E(t.o.faltaTxt||'Falta marcar la ubicación en el mapa.')+'</span>'}
 if(k&&c.offsetWidth)leaflet().then(L=>{const el=c.querySelector('.pdmcMp');
  if(!t.mini||t.mini.getContainer()!==el){t.mini=L.map(el,{zoomControl:false,attributionControl:true,dragging:false,touchZoom:false,scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false,tap:false}).setView([k.lat,k.lng],17);L.tileLayer(TILES,{maxZoom:19,attribution:ATTR}).addTo(t.mini)}
  else{t.mini.invalidateSize();t.mini.setView([k.lat,k.lng],17,{animate:false})}
 }).catch(()=>{});
}
setInterval(()=>{for(let i=tarjetas.length-1;i>=0;i--){const t=tarjetas[i];if(!t.c.isConnected){tarjetas.splice(i,1);continue}try{pintar(t)}catch(e){}}},700);
window.pdMapa={elegir,tarjeta,coords,linkDe,leaflet,PIN,repintar:()=>tarjetas.forEach(t=>{t.firma='';pintar(t)})};
})();
