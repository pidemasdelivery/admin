
/* ===== Pidemás · Pedido por pasos (motor común de admin, motorizado y negocio) =====
   Se dibuja dentro de una caja aislada (Shadow DOM): ningún CSS ni script viejo de la página
   puede cambiar su diseño. Cada panel le pasa un "modelo" con sus pasos. */
(function(){
  if(window.PdPasos)return;
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const I={
    back:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    check:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    chev:'<svg class="chev" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    lock:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8A7B70" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    arrow:'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    pin:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#C4410C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    nav:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-8-8 18-2-8-8-2z"/></svg>',
    phone:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    wa:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12.5 7.4L3 20.5l1.6-5.3A8.4 8.4 0 1 1 21 11.5z"/></svg>',
    info:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#C4410C" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9.5"/><path d="M12 11v6M12 7.5v.01"/></svg>',
    ok:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    big:'<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };
  const CSS=`
:host{all:initial;position:fixed;inset:0;z-index:2147483000;display:block;font-family:PdInter,Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#1F1A17;-webkit-text-size-adjust:100%;-webkit-tap-highlight-color:transparent}
*,*::before,*::after{box-sizing:border-box}
button{font-family:inherit;-webkit-tap-highlight-color:transparent}
.app{position:absolute;inset:0;display:flex;flex-direction:column;background:#FFF9F5;overflow:hidden}
.app.nuevo{animation:entra .22s ease-out}
@keyframes entra{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}
.top{background:#FFFFFF;border-bottom:1px solid #F1E4DA;padding:calc(env(safe-area-inset-top,0px) + 14px) 16px 12px;display:flex;flex-direction:column;gap:10px;flex:0 0 auto}
.row{display:flex;align-items:center;gap:12px}
.back{width:44px;height:44px;flex:0 0 44px;border-radius:12px;border:1px solid #F1E4DA;background:#FFFFFF;display:flex;align-items:center;justify-content:center;color:#1F1A17;padding:0;cursor:pointer}
.ttl{flex:1 1 0%;min-width:0}
.kick{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6B5E55;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.h1{font-size:20px;font-weight:800;line-height:1.2}
.chip{display:inline-flex;align-items:center;height:28px;padding:0 12px;border-radius:999px;background:#FDEBDF;color:#9A330A;font-size:13px;font-weight:800;white-space:nowrap;flex:0 0 auto}
.chip.ok{background:#E9F6EE;color:#0F5E2E}.chip.mal{background:#FDE8E8;color:#9B1C1C}
.bars{display:grid;gap:6px}.bars i{display:block;height:5px;border-radius:3px;background:#EADFD6}
.bars i.d{background:#15803D}.bars i.a{background:#C4410C}
.list{flex:1 1 0%;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:14px 14px 20px;display:flex;flex-direction:column;gap:10px}
.list>*{flex-shrink:0}
.card{flex:0 0 auto;border-radius:18px;overflow:hidden;background:#F6EFE9;border:1px solid #F1E4DA;opacity:.85;transition:border-color .2s,background .2s}
.card.d{background:#FFFFFF;opacity:1}
.card.a{background:#FFFFFF;border:1.5px solid #C4410C;box-shadow:0 6px 18px rgba(196,65,12,.10);opacity:1}
.head{width:100%;display:flex;align-items:center;gap:12px;padding:14px;background:transparent;border:0;text-align:left;color:inherit;cursor:pointer}
.card.l .head{cursor:default}
.dot{flex:0 0 34px;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;background:#EADFD6;color:#6B5E55}
.card.d .dot{background:#15803D;color:#FFFFFF}.card.a .dot{background:#C4410C;color:#FFFFFF}
.hx{flex:1 1 0%;min-width:0}
.ht{display:block;font-size:16px;font-weight:800}
.hs{display:block;font-size:13px;font-weight:500;color:#6B5E55;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chev{color:#6B5E55;transition:transform .2s;flex:0 0 auto}.open .chev{transform:rotate(180deg)}
.body{padding:0 14px 14px;display:flex;flex-direction:column;gap:12px}
.who{display:flex;gap:12px;align-items:center;padding:12px;border-radius:14px;background:#FFF9F5}
.av{flex:0 0 48px;width:48px;height:48px;border-radius:12px;background:#FDEBDF center/cover no-repeat;color:#C4410C;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;text-transform:uppercase}
.av.r{border-radius:50%}
.wn{font-size:17px;font-weight:800;overflow-wrap:anywhere}.ws{font-size:13px;color:#6B5E55;font-weight:500}
.st{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:12px;background:#FFF4EC;color:#9A330A;font-size:14px;font-weight:600;line-height:1.35}
.st .pt{width:8px;height:8px;border-radius:50%;background:#C4410C;flex:0 0 8px}
.st.ok{background:#E9F6EE;color:#0F5E2E;font-weight:700}
.b:not([aria-label])>svg,a.b:not([aria-label])>svg,.bt:not([aria-label])>svg{display:none!important}
.nvb{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:12px;background:#FDEBDF;color:#9A330A;font-size:13px;font-weight:800;line-height:1.3;width:100%;box-sizing:border-box}.nvb i{flex:0 0 8px;width:8px;height:8px;border-radius:50%;background:#C4410C}.nvb em{margin-left:auto;font-style:normal;font-variant-numeric:tabular-nums}
.nvA{display:flex;gap:8px;margin-top:-4px}.nvA .b{flex:1 1 0;height:50px;font-size:15px}.st.mal{background:#FDE8E8;color:#9B1C1C;font-weight:700}
.addr{display:flex;gap:10px;align-items:flex-start}.addr svg{flex:0 0 22px;margin-top:2px}
.at{font-size:18px;font-weight:700;line-height:1.3;overflow-wrap:anywhere}.ar{font-size:14px;color:#6B5E55;margin-top:3px;overflow-wrap:anywhere}
.btns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.btns.b2{grid-template-columns:repeat(2,minmax(0,1fr))}
.b{height:48px;border-radius:12px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;padding:0 8px;text-decoration:none}
.b.o{border:0;background:#C4410C;color:#FFFFFF}.b.g{border:0;background:#15803D;color:#FFFFFF}
.b.soft{height:46px;border:1px solid #F1C9B6;background:#FFF4EC;color:#9A330A}
.b[disabled]{opacity:.45;pointer-events:none}
.code{padding:18px 14px;border-radius:16px;background:#1F1A17;color:#FFFFFF;text-align:center}
.code .k{font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#F6C7AE}
.code .n{font-size:54px;font-weight:800;letter-spacing:.18em;margin-top:4px;line-height:1.1}
.code .s{font-size:14px;color:#E9DCD3;margin-top:4px}
.note{display:flex;gap:10px;align-items:center;padding:12px 14px;border-radius:14px;background:#FFF9F5;font-size:14px;line-height:1.45}.note svg{flex:0 0 20px}
.box{padding:12px;border-radius:14px;border:1px dashed #E3CFC2;font-size:14px;line-height:1.5}
.box .k,.lbl{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#6B5E55;margin-bottom:4px}
.li{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;min-width:0}.li>span{flex:0 1 auto;min-width:0}.li>b{flex:0 1 auto;min-width:0;text-align:right;white-space:normal;overflow-wrap:anywhere}.li.col{flex-direction:column;gap:2px}.li.col>b{text-align:left;white-space:pre-line}.li>span{color:#6B5E55;font-weight:500}.li>b{font-weight:600;color:#1F1A17}.li.t{margin-top:4px;padding-top:6px;border-top:1px dashed #E3CFC2}.li.t>span{color:#1F1A17;font-weight:700}.li.t>b{font-weight:800}.box .tx{font-size:15px;line-height:1.5;font-weight:500;color:#1F1A17;white-space:pre-line;overflow-wrap:anywhere}
.wn,.ws,.at,.ar{overflow-wrap:anywhere;min-width:0}.who>div{min-width:0;flex:1 1 auto}
.amt{padding:18px 14px;border-radius:16px;background:#FDEBDF;text-align:center}
.amt .k{font-size:13px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#9A330A}
.amt .n{font-size:44px;font-weight:800;margin-top:4px;letter-spacing:-.02em;line-height:1.1}
.pill{display:inline-flex;align-items:center;gap:6px;margin-top:8px;height:30px;padding:0 12px;border-radius:999px;background:#FFFFFF;font-size:14px;font-weight:700}
.sum{padding:12px 14px;border-radius:14px;background:#FFF9F5;font-size:15px;display:flex;flex-direction:column;gap:6px}.sum span{color:#6B5E55}
.qr{display:flex;gap:12px;align-items:center;width:100%;padding:12px;border-radius:14px;border:1.5px solid #E4D3F5;background:#FFFFFF;text-align:left;color:#1F1A17;cursor:zoom-in}
.qr .im{flex:0 0 84px;width:84px;height:84px;border-radius:10px;border:1px solid #F1E4DA;background:#FFFFFF center/contain no-repeat;display:flex;align-items:center;justify-content:center;font-size:11px;color:#6B5E55;text-align:center}
.qr .t{display:flex;flex-direction:column;gap:3px;min-width:0}
.qr .k{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#6D28D9}
.qr .a{font-size:16px;font-weight:800}.qr .b2{font-size:15px;font-weight:600}.qr .c{font-size:12px;color:#6B5E55}
.inp{width:100%;height:54px;border-radius:14px;border:1.5px solid #F1E4DA;background:#FFFFFF;padding:0 16px;font:700 20px PdInter,Inter,system-ui,sans-serif;color:#1F1A17;outline:none}
.inp:focus{border-color:#C4410C}
.rap{display:flex;flex-direction:column;gap:8px}.rap .rt{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#6B5E55}.rap .rl{display:flex;flex-direction:column;gap:6px}.rap a{display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:14px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;text-decoration:none;font-size:14.5px;font-weight:600;line-height:1.3}.rap a svg{flex:0 0 18px;width:18px;height:18px;color:#15803D}.rap a:active{background:#FFF4EC}
.quick{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.quick button{height:42px;border-radius:12px;border:1px solid #F1E4DA;background:#FFFFFF;font-size:14px;font-weight:700;color:#1F1A17;cursor:pointer}
.quick button.on{border:0;background:#C4410C;color:#FFFFFF}
.opts{display:flex;flex-direction:column;gap:8px}
.opt{display:flex;flex-direction:column;gap:2px;width:100%;padding:12px 14px;border-radius:14px;border:1px solid #F1E4DA;background:#FFFFFF;text-align:left;color:#1F1A17;cursor:pointer}
.opt b{font-size:15px}.opt span{font-size:13px;color:#6B5E55}
.opt.on{border:1.5px solid #C4410C;background:#FFF4EC}
.grid4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.grid4 button{height:44px;border-radius:12px;border:1px solid #F1E4DA;background:#FFFFFF;font-size:14px;font-weight:700;color:#1F1A17;cursor:pointer}
.grid4 button.on{border:0;background:#C4410C;color:#FFFFFF}
.msg{white-space:pre-wrap;padding:12px 14px;border-radius:14px;background:#F3FBF6;border:1px solid #CFEBDA;font-size:14px;line-height:1.45}
.fin{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding:22px 16px;border-radius:18px;background:#FFFFFF;border:1px solid #F1E4DA}
.fin .ic{width:72px;height:72px;border-radius:50%;background:#15803D;display:flex;align-items:center;justify-content:center}
.fin.mal .ic{background:#B42318}
.fin .t{font-size:22px;font-weight:800}.fin .s{font-size:15px;color:#6B5E55;line-height:1.45}
.fin .li2{display:flex;gap:8px;align-items:center;padding:10px 12px;border-radius:12px;background:#FFF9F5;font-size:14px;text-align:left;width:100%}
.foot{flex:0 0 auto;background:#FFFFFF;border-top:1px solid #F1E4DA;padding:12px 16px 12px;display:flex;flex-direction:column;gap:8px}
.sl{position:relative;width:100%;height:62px;border-radius:999px;border:0;padding:0;background:#C4410C;color:#FFFFFF;font:800 16px PdInter,Inter,system-ui,sans-serif;touch-action:none;user-select:none;-webkit-user-select:none;overflow:hidden;cursor:grab}
.sl.g{background:#15803D}
.sl.off{background:#D8CBC1;cursor:not-allowed}
.sl .fill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:rgba(255,255,255,.18);width:0}
.sl .lb{position:relative;display:block;padding-left:56px;padding-right:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sl .kn{position:absolute;left:6px;top:6px;width:50px;height:50px;border-radius:50%;background:#FFFFFF;color:#C4410C;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.18)}
.sl.g .kn{color:#15803D}.sl.off .kn{color:#A8988C}
.hint{text-align:center;font-size:13px;color:#6B5E55}
.alt{display:flex;gap:8px}
.alt button{flex:1 1 0;height:44px;border-radius:12px;border:1px solid #F1E4DA;background:#FFFFFF;color:#6B5E55;font-size:14px;font-weight:700;cursor:pointer}
.alt button.mal{color:#B42318;border-color:#F4C7C3}
.err{padding:10px 12px;border-radius:12px;background:#FDE8E8;color:#9B1C1C;font-size:14px;font-weight:600}
`;
  const KEYS=new WeakMap();
  let cur=null;

  function head(s,i,open){
    const cls=s.state==='done'?'d':s.state==='active'?'a':'l';
    const sub=s.state==='locked'?s.locked:(s.state==='done'&&!open?s.sum:'');
    return `<div class="card ${cls}${open?' open':''}" data-i="${i}"><button type="button" class="head" data-toggle="${i}" aria-expanded="${open}"><span class="dot">${s.state==='done'?I.check:(i+1)}</span><span class="hx"><span class="ht">${E(s.title)}</span>${sub?`<span class="hs">${E(sub)}</span>`:''}</span>${s.state==='locked'?I.lock:I.chev}</button>${open&&s.state!=='locked'?`<div class="body">${s.body||''}</div>`:''}</div>`;
  }

  function render(){
    if(!cur)return;
    let m;try{m=cur.model()}catch(e){console.warn('Pasos:',e);m=null}
    if(!m){close();return}
    cur.m=m;
    const ai=m.steps.findIndex(s=>s.state==='active');
    const key=ai+'|'+JSON.stringify([m.title,m.chip,m.steps.map(s=>[s.state,s.title,s.sum,s.body]),m.cta&&[m.cta.label,m.cta.off,m.cta.green,m.cta.hint],m.fin,m.alt&&m.alt.map(a=>a.label),m.err,cur.open]);
    if(key===cur.key)return;
    const act=cur.root.activeElement;
    if(act&&act.tagName==='INPUT'&&cur.lastActive===ai)return;
    cur.key=key;
    if(cur.lastActive!==ai){cur.open={};if(ai>=0)cur.open[ai]=true;cur.lastActive=ai}
    const list=cur.root.querySelector('.list');const sc=list?list.scrollTop:0;
    const n=m.steps.length;
    const bars=m.steps.map(s=>`<i class="${s.state==='done'?'d':s.state==='active'?'a':''}"></i>`).join('');
    const cards=m.steps.map((s,i)=>head(s,i,!!cur.open[i])).join('');
    const fin=m.fin?`<div class="fin${m.fin.mal?' mal':''}"><span class="ic">${m.fin.mal?'<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M7 7l10 10M17 7L7 17"/></svg>':I.big}</span><div class="t">${E(m.fin.title)}</div>${m.fin.text?`<div class="s">${E(m.fin.text)}</div>`:''}${(m.fin.lines||[]).map(l=>`<div class="li2">${I.ok}<span>${l}</span></div>`).join('')}</div>`:'';
    const cta=m.cta?`<button type="button" class="sl${m.cta.green?' g':''}${m.cta.off?' off':''}" aria-label="${E(m.cta.label)}"${m.cta.off?' aria-disabled="true"':''}><span class="fill"></span><span class="lb">${E(m.cta.label)}</span><span class="kn">${I.arrow}</span></button><div class="hint">${E(m.cta.hint||(m.cta.off?'':'Desliza hacia la derecha para avanzar'))}</div>`:'';
    const alt=m.alt&&m.alt.length?`<div class="alt">${m.alt.map((a,i)=>`<button type="button" data-alt="${i}" class="${a.mal?'mal':''}">${E(a.label)}</button>`).join('')}</div>`:'';
    cur.root.innerHTML=`<style>${CSS}</style><div class="app${cur.pintada?'':' nuevo'}" role="dialog" aria-modal="true" aria-label="${E(m.title)}">
      <div class="top"><div class="row"><button type="button" class="back" aria-label="Volver">${I.back}</button><div class="ttl"><div class="kick">${E(m.kicker)}</div><div class="h1">${E(m.title)}</div></div>${m.chip?`<span class="chip ${m.chipCls||''}">${E(m.chip)}</span>`:''}</div>
      <div class="bars" style="grid-template-columns:repeat(${n},minmax(0,1fr))">${bars}</div></div>
      <div class="list">${m.err?`<div class="err">${E(m.err)}</div>`:''}${cards}${fin}</div>
      ${cta||alt?`<div class="foot">${cta}${alt}</div>`:''}</div>`;
    cur.pintada=true;
    const nl=cur.root.querySelector('.list');if(nl)nl.scrollTop=sc;
    if(m.mounted)try{m.mounted(cur.root)}catch(e){}
    wire();
  }

  function wire(){
    const r=cur.root,m=cur.m;
    r.querySelector('.back').onclick=()=>close();
    r.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=()=>{const i=+b.dataset.toggle;const s=m.steps[i];if(!s||s.state==='locked')return;cur.open[i]=!cur.open[i];cur.key=null;render()});
    r.querySelectorAll('[data-alt]').forEach(b=>b.onclick=()=>{const a=m.alt[+b.dataset.alt];if(a&&a.run)a.run()});
    r.querySelectorAll('[data-act]').forEach(b=>{const f=m.acts&&m.acts[b.dataset.act];if(!f)return;const ev=b.tagName==='INPUT'?'input':'click';b.addEventListener(ev,e=>f(b,e))});
    const sl=r.querySelector('.sl');if(!sl||!m.cta)return;
    const kn=sl.querySelector('.kn'),fill=sl.querySelector('.fill'),lb=sl.querySelector('.lb');
    let x0=null,dx=0,busy=false;
    const max=()=>sl.clientWidth-kn.offsetWidth-12;
    const set=v=>{kn.style.transform=`translateX(${v}px)`;fill.style.width=v>0?(v+57)+'px':'0';lb.style.opacity=Math.max(0,1-v/180)};
    const reset=()=>{kn.style.transition=fill.style.transition='transform .25s,width .25s';set(0);setTimeout(()=>{kn.style.transition=fill.style.transition=''},260)};
    const go=async()=>{if(busy||m.cta.off)return;busy=true;set(max());lb.style.opacity=1;lb.textContent=m.cta.busy||'Procesando…';
      try{await m.cta.run()}catch(e){console.warn(e)}
      busy=false;cur&&(cur.key=null);if(cur)render();else return;const s2=cur.root.querySelector('.sl');if(s2===sl){lb.textContent=m.cta.label;reset()}};
    sl.addEventListener('pointerdown',e=>{if(busy||m.cta.off)return;x0=e.clientX;dx=0;try{sl.setPointerCapture(e.pointerId)}catch(_){}kn.style.transition=fill.style.transition=''});
    sl.addEventListener('pointermove',e=>{if(x0===null)return;dx=Math.max(0,Math.min(max(),e.clientX-x0));set(dx)});
    const up=()=>{if(x0===null)return;x0=null;if(dx>=max()*0.8)go();else reset()};
    sl.addEventListener('pointerup',up);sl.addEventListener('pointercancel',up);
    sl.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}});
  }

  /* Botón «atrás» del celular: si la app ya tiene su manejador (pidemas-boton-atras), este detecta
     la vista como ventana abierta y manda Escape; si no, la vista maneja su propio historial. */
  const propio=()=>!window.__pdAtras;
  function onPop(){if(!cur)return;if(history.state&&history.state.pdPasos)return;close(true)}
  function onKey(e){if(e.key==='Escape'&&cur){const d=[...document.querySelectorAll('[role="dialog"],dialog')].some(x=>x.getClientRects().length&&!x.closest('pd-pasos-pedido'));if(!d)close()}}
  /* Barras de abajo de la app (menú inferior) que quedan por encima: se ocultan mientras la vista está abierta */
  function taparBarras(c){
    const H=innerHeight;
    document.querySelectorAll('body > *').forEach(el=>{
      if(el===c.host||c.ocultas.includes(el))return;
      const cs=getComputedStyle(el);if(cs.position!=='fixed'||cs.visibility==='hidden'||cs.display==='none')return;
      const z=parseInt(cs.zIndex,10);if(!(z>2147483000))return;
      const r=el.getBoundingClientRect();if(!(r.height>0&&r.height<220&&r.top>H*0.55))return;
      if(el.matches('[role="dialog"],[aria-modal="true"],dialog'))return;
      c.ocultas.push(el);el.style.setProperty('visibility','hidden','important');
    });
  }
  function close(fromPop){
    if(!cur)return;const c=cur;cur=null;clearInterval(c.t);
    c.ocultas.forEach(el=>el.style.removeProperty('visibility'));window.removeEventListener('popstate',onPop);document.removeEventListener('keydown',onKey);
    c.host.remove();document.documentElement.style.overflow=c.ov||'';
    if(c.propio&&!fromPop&&history.state&&history.state.pdPasos)try{history.back()}catch(e){}
    if(c.onClose)try{c.onClose()}catch(e){}
  }
  function open(model,opts){
    if(cur)close(true);
    const host=document.createElement('pd-pasos-pedido');
    host.setAttribute('data-pd-aislado','1');
    const root=host.attachShadow({mode:'open'});try{flechas(root)}catch(_){}
    document.body.appendChild(host);
    /* en el motorizado el menú de abajo queda visible también en el detalle */
    try{const nh=(()=>{const A=window.pdAppMoto||window.pdAppNeg||window.pdAppAdm;return A&&A.navH&&A.navEnDetalle!==false?A.navH():0})();if(nh>0)host.style.bottom=nh+'px'}catch(_){}
    cur={host,root,model,ocultas:[],open:{},key:null,lastActive:-2,onClose:opts&&opts.onClose,ov:document.documentElement.style.overflow};
    document.documentElement.style.overflow='hidden';
    cur.propio=propio();
    if(cur.propio){try{history.pushState({pdPasos:1},'')}catch(e){}window.addEventListener('popstate',onPop)}
    document.addEventListener('keydown',onKey);
    taparBarras(cur);render();
    cur.t=setInterval(()=>{if(cur){taparBarras(cur);render()}},800);
  }
  const util={
    calSueldo(P,rows){const S2=window.PdSueldo;if(!S2||!P||!(P.days||[]).length)return '';
      const adv=new Map(),vac=new Map();(rows||[]).forEach(y=>{const t=String(y.tipo||'').toLowerCase(),k=String(y.fecha||'').slice(0,10),d=String(y.descripcion||'');if(t==='pago'&&/^adelanto/i.test(d))adv.set(k,(adv.get(k)||0)+(Number(y.monto)||0));if((t==='jornada'||t==='falta')&&/^(vacaciones|permiso)/i.test(d))vac.set(k,{v:/^vacaciones/i.test(d),pag:t==='jornada'})});
      const SUB={ajuste:'Ajuste',ajusteFuturo:'Al cerrar',dia31:'En el 30',trabajado:'Trabajó',descanso:'Pagado',falta:'Falta',hoy:'Hoy',futuro:'',libre:'Libre',antes:'—'};
      const days=P.days,re=days.filter(d=>!d.adjDay),off=re[0]?(S2.parse(re[0].date).getDay()+6)%7:0;let hayV=false;
      const cel=days.map(d=>{const n=d.adjDay||S2.parse(d.date).getDate(),vv=!d.adjDay&&vac.get(d.date);if(vv)hayV=true;
        const s=vv?(vv.v?'Vacac.':'Perm.'):d.adel?'Adel.':(d.status==='descanso'&&d.holiday?'Feriado':SUB[d.status]||'');const v=!d.adjDay&&adv.get(d.date);
        return `<div class="${E(d.status)}${d.adel?' adel':''}${vv?(vv.pag?' vacp':' vacn'):''}" role="listitem" aria-label="${E((d.label||'')+' '+n+(s?': '+s:'')+(vv?(vv.pag?' pagado':' sin pago'):'')+(v?', adelanto S/ '+v.toFixed(2):''))}"><b>${n}</b><small>${E(s)}</small>${v?`<em>S/${E(Number.isInteger(v)?String(v):v.toFixed(2))}</em>`:''}</div>`}).join('');
      return `<div class="slc" role="list">${['L','M','M','J','V','S','D'].map(y=>`<small aria-hidden="true">${y}</small>`).join('')}${'<span></span>'.repeat(off)}${cel}</div><div class="ley"><span><b style="color:#15803D">■</b> Trabajó</span><span><b style="color:#E8A27A">■</b> Descanso pagado</span><span><b style="color:#B42318">■</b> Falta</span>${hayV?'<span><b style="color:#2563EB">■</b> Vacaciones / permiso pagado</span>':''}</div>`},
    E,I,
    money:n=>'S/ '+(Number(n)||0).toFixed(2),
    ref:id=>'#'+String(id||'').replace(/-/g,'').slice(0,8).toUpperCase(),
    hora:d=>{if(!d)return '';const x=new Date(d);return isNaN(x)?'':x.toLocaleTimeString('es-PE',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'America/Lima'}).replace(/\s?a\.?\s?m\.?/i,' am').replace(/\s?p\.?\s?m\.?/i,' pm')},
    usuario:t=>{const m=/^\s*@([a-z0-9._]{3,35})\s*$/i.exec(String(t||''))||(/[a-z]/i.test(String(t||''))&&/^\s*([a-z0-9._]{3,35})\s*$/i.exec(String(t||'')));return m?m[1].toLowerCase():''},
    tel:t=>{const us=util.usuario(t);if(us)return us;const d=String(t||'').replace(/\D/g,'');if(!d)return '';return d.startsWith('51')&&d.length>9?d:(d.length===9?'51'+d:d)},
    maps:(lat,lng,txt,url)=>{if(lat!=null&&lng!=null&&lat!==''&&lng!=='')return 'https://www.google.com/maps/search/?api=1&query='+lat+','+lng;if(url)return url;return txt?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(txt):''},
    ini:t=>String(t||'?').trim().charAt(0)||'?',
    who:(nombre,sub,foto,redondo)=>`<div class="who"><span class="av${redondo?' r':''}"${foto?` style="background-image:url('${E(foto)}')"`:''}>${foto?'':E(String(nombre||'?').trim().charAt(0))}</span><div style="min-width:0"><div class="wn">${E(nombre||'—')}</div><div class="ws">${sub||''}</div></div></div>`,
    addr:(t,r)=>t?`<div class="addr">${I.pin}<div><div class="at">${E(t)}</div>${r?`<div class="ar">Ref.: ${E(r)}</div>`:''}</div></div>`:'',
    contact:(mapUrl,phone,waText,cols)=>{const t=util.tel(phone);const b=[];
      if(mapUrl!==null)b.push(`<a class="b o" ${mapUrl?`href="${E(mapUrl)}" target="_blank" rel="noopener"`:'aria-disabled="true" style="opacity:.45;pointer-events:none"'}>${I.nav}Ir</a>`);
      b.push(`<a class="b" ${t?`href="${util.usuario(phone)?'https://wa.me/'+t:'tel:+'+t}"${util.usuario(phone)?' target="_blank" rel="noopener"':''}`:'aria-disabled="true" style="opacity:.45;pointer-events:none"'}>${I.phone}Llamar</a>`);
      b.push(`<a class="b g" ${t?`href="https://wa.me/${t}${waText?'?text='+encodeURIComponent(waText):''}" target="_blank" rel="noopener"`:'aria-disabled="true" style="opacity:.45;pointer-events:none"'}>${I.wa}WhatsApp</a>`);
      return `<div class="btns${b.length===2?' b2':''}">${b.join('')}</div>`},
    rapidos:(phone,lista,titulo)=>{const t=util.tel(phone);if(!t||!lista||!lista.length)return '';
      return `<div class="rap"><div class="rt">${E(titulo||'Mensajes rápidos al cliente')}</div><div class="rl">${lista.filter(Boolean).map(m=>`<a href="https://wa.me/${t}?text=${encodeURIComponent(m[1])}" target="_blank" rel="noopener">${I.wa}<span>${E(m[0])}</span></a>`).join('')}</div></div>`},
    st:(txt,tipo)=>`<div class="st ${tipo||''}">${tipo==='ok'?I.ok:tipo==='mal'?'':'<span class="pt"></span>'}<span>${txt}</span></div>`,
    note:t=>`<div class="note">${I.info}<span>${t}</span></div>`,
    items:(titulo,det,precios)=>{const L=(det||[]).map(d=>`<div class="li"><span>${E(d.cantidad||1)} × ${E(d.nombre_producto||'Producto')}</span>${precios?`<b>${util.money(d.subtotal!=null?d.subtotal:(Number(d.precio_unitario)||0)*(Number(d.cantidad)||1))}</b>`:''}</div>`).join('');return L?`<div class="box"><div class="k">${E(titulo)}</div>${L}</div>`:''},
    code:(k,n,s)=>`<div class="code"><div class="k">${E(k)}</div><div class="n">${E(n)}</div>${s?`<div class="s">${E(s)}</div>`:''}</div>`
  };

  /* Filas que se deslizan de lado (chips, categorías): sin barra de scroll y con una flecha que avanza */
  const FL_CSS='.pdfW{position:relative}.pdfW>.pdfS{scrollbar-width:none}.pdfW>.pdfS::-webkit-scrollbar{display:none}.pdfA{position:absolute;right:0;top:50%;transform:translateY(-50%);width:40px;height:40px;border-radius:50%;border:1px solid #F1E4DA;background:#FFFFFF;color:#C4410C;display:flex;align-items:center;justify-content:center;box-shadow:-14px 0 14px rgba(255,249,245,.95),0 2px 6px rgba(31,26,23,.12);cursor:pointer;z-index:2;padding:0;margin:0}.pdfA svg{width:20px;height:20px;transition:transform .2s}.pdfA.fin svg{transform:rotate(180deg)}.pdfA[hidden]{display:none!important}';
  const FL_SEL='.chips,.cats,.chs,.dias,.qChips,.tCats';
  function flechas(root){
    if(!root||root.__pdf)return;root.__pdf=1;
    const fin=el=>el.scrollLeft+el.clientWidth>=el.scrollWidth-4;
    const ver=(el,b)=>{const h=el.scrollWidth<=el.clientWidth+4;if(b.hidden!==h)b.hidden=h;b.classList.toggle('fin',!h&&fin(el))};
    const apply=()=>{
      if(!root.querySelector('style[data-pdf]')){const st=document.createElement('style');st.setAttribute('data-pdf','');st.textContent=FL_CSS;(root.head||root).appendChild(st)}
      root.querySelectorAll(FL_SEL).forEach(el=>{
        if(el.closest('.chW')||(el.parentElement&&el.parentElement.classList.contains('pdfW')))return;
        const cs=getComputedStyle(el);if(cs.flexWrap==='wrap'||!/auto|scroll/.test(cs.overflowX))return;
        const w=document.createElement('div');w.className='pdfW';el.parentNode.insertBefore(w,el);w.appendChild(el);el.classList.add('pdfS');

      });
      root.querySelectorAll('.pdfW').forEach(w=>{const el=w.querySelector('.pdfS'),b=w.querySelector('.pdfA');if(el&&b)ver(el,b)});
    };
    let t=null;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(apply,40)}).observe(root,{childList:true,subtree:true});
    addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(apply,80)});apply();
  }
  window.PdPasos={open,close,flechas,render:()=>{if(cur){cur.key=null;render()}},isOpen:()=>!!cur,util,css:CSS};
})();

