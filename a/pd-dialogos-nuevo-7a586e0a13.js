
/* ===== Pidemás · ventanas de aviso con el diseño nuevo =====
   Las ventanas de la app (confirmar, aviso, «Listo», vuelto, código de entrega, etc.) se siguen creando
   igual, pero se esconden y se muestran aquí, en una caja aislada con el diseño del pedido por pasos:
   tarjeta blanca abajo, sin velo ni desenfoque detrás. Los botones de aquí pulsan los originales,
   así que la lógica no cambia. */
(function(){
  if(window.__pdDialogos||!window.PdPasos)return;window.__pdDialogos=1;
  const U=PdPasos.util,E=U.E;
  const SEL='#pdDlg,#pdpeVelo,#pfSheet,#pdYNOv,#pdmmVelo,#pdsmVelo';
  const CSS=`
:host{all:initial;position:fixed;inset:0;z-index:2147483646;display:block;font-family:PdInter,Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#1F1A17;-webkit-tap-highlight-color:transparent;pointer-events:none}
*{box-sizing:border-box}button,input{font-family:inherit}
.tapa{position:absolute;inset:0;background:transparent;pointer-events:auto}
.cd{position:absolute;left:12px;right:12px;bottom:calc(var(--abajo,0px) + 12px);max-height:calc(100% - var(--abajo,0px) - 40px);overflow-y:auto;background:#FFFFFF;border:1px solid #F1E4DA;border-radius:22px;box-shadow:0 14px 40px rgba(31,26,23,.18),0 2px 6px rgba(31,26,23,.08);padding:18px 16px 16px;display:flex;flex-direction:column;gap:12px;pointer-events:auto;animation:sube .18s ease-out}
@keyframes sube{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}
.hd{display:flex;align-items:flex-start;gap:12px}
.ic{flex:0 0 44px;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#FDEBDF;color:#C4410C}
.ic.ok{background:#E9F6EE;color:#15803D}.ic.mal{background:#FDE8E8;color:#B42318}
.tt{flex:1 1 0%;min-width:0;padding-top:2px}.tt b{display:block;font-size:19px;font-weight:800;line-height:1.25}
.x{flex:0 0 40px;width:40px;height:40px;border-radius:12px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;font-size:22px;line-height:1;cursor:pointer}
p{margin:0;font-size:15px;line-height:1.5;color:#6B5E55}
p.err{padding:10px 12px;border-radius:12px;background:#FDE8E8;color:#9B1C1C;font-weight:600}
p.ok{padding:10px 12px;border-radius:12px;background:#E9F6EE;color:#0F5E2E;font-weight:700}
label{font-size:14px;font-weight:700;color:#1F1A17}
input,textarea{width:100%;height:56px;border-radius:14px;border:1.5px solid #F1E4DA;background:#FFFFFF;padding:0 16px;font-size:18px;font-weight:700;color:#1F1A17;outline:none}
input:focus{border-color:#C4410C}
input.cod{text-align:center;font-size:30px;letter-spacing:.4em;height:64px}
.op{display:flex;flex-direction:column;gap:2px;width:100%;padding:14px;border-radius:14px;border:1px solid #F1E4DA;background:#FFFFFF;text-align:left;color:#1F1A17;cursor:pointer}
.op b{font-size:16px}.op span{font-size:13px;color:#6B5E55}
.bs{display:flex;flex-direction:column;gap:8px;margin-top:4px}
.bs.dos{flex-direction:row}.bs.dos .b{flex:1 1 0}
.b{height:54px;border-radius:12px;border:1px solid #F1E4DA;background:#FFFFFF;color:#1F1A17;font-size:16px;font-weight:800;cursor:pointer;padding:0 12px}
.b.o{border:0;background:#C4410C;color:#FFFFFF}.b.r{border:0;background:#B42318;color:#FFFFFF}.b.g{border:0;background:#15803D;color:#FFFFFF}
.b.l{height:46px;font-weight:700;color:#9A330A;background:#FFF4EC;border-color:#F1C9B6}
.b[disabled]{opacity:.5}
.ts{position:absolute;left:12px;right:12px;top:calc(env(safe-area-inset-top,0px) + 12px);display:flex;flex-direction:column;gap:8px;pointer-events:none}
.t{display:flex;align-items:center;gap:10px;padding:12px 12px 12px 14px;border-radius:16px;background:#FFFFFF;border:1px solid #F1E4DA;box-shadow:0 10px 28px rgba(31,26,23,.14);font-size:15px;font-weight:600;line-height:1.35;pointer-events:auto;animation:sube .18s ease-out}
.t .d{flex:0 0 10px;width:10px;height:10px;border-radius:50%;background:#C4410C}.t.ok .d{background:#15803D}.t.mal .d{background:#B42318}
.t span{flex:1 1 0%}.t button{flex:0 0 32px;width:32px;height:32px;border-radius:10px;border:0;background:transparent;color:#6B5E55;font-size:20px;cursor:pointer}
`;
  const S=d=>'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
  const IC={ok:S('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),q:S('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 0 1 5 1c0 1.8-2.5 2.2-2.5 3.6"/><path d="M12 17h.01"/>'),mal:S('<path d="M12 8v5M12 16.5v.01"/><circle cx="12" cy="12" r="9"/>'),code:S('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>')};
  let host=null,root=null,orig=null,firma='';
  function capa(){
    if(host&&host.isConnected)return;
    host=document.createElement('pd-ventana');root=host.attachShadow({mode:'open'});
    root.innerHTML=`<style>${CSS}</style><div id="dl"></div><div class="ts" id="ts" aria-live="polite"></div>`;
    document.body.appendChild(host);
  }
  const vis=el=>{if(!el||!el.isConnected||el.hidden)return false;const cs=getComputedStyle(el);return cs.display!=='none'&&!!el.innerHTML.trim()};
  function esconder(el){if(el.dataset.pdEspejo)return;el.dataset.pdEspejo='1';['opacity:0','pointer-events:none','backdrop-filter:none','-webkit-backdrop-filter:none','background:transparent','filter:none'].forEach(x=>{const [k,v]=x.split(':');el.style.setProperty(k,v,'important')})}
  const abajo=()=>{try{return (()=>{const A=window.pdAppMoto||window.pdAppNeg||window.pdAppAdm;return A&&A.navH?A.navH():0})()}catch(e){return 0}};
  /* lee la ventana original y la arma con el diseño nuevo */
  function armar(el){
    const titulo=(el.querySelector('h2,h3,.pdsmTop strong,.hd h2,strong')||{}).textContent||'';
    const items=[];let cerrar=null;
    el.querySelectorAll('p,small.pdpeMsg,.pdpeMsg,.er,label,input,textarea,button,.mt,.pdpeTx').forEach(n=>{
      if(n.closest('h2,h3,.pdsmTop strong'))return;
      if(n.tagName==='BUTTON'){
        const tx=n.textContent.trim();
        if(/^[×✕✖]$/.test(tx)||/^cerrar$/i.test(n.getAttribute('aria-label')||'')){cerrar=n;return}
        if(n.closest('.pdVuOp')&&n!==n.closest('.pdVuOp'))return;
        items.push({t:'btn',n});return}
      if(n.closest('button'))return;
      if(n.tagName==='INPUT'||n.tagName==='TEXTAREA'){if(n.type==='hidden'||n.type==='file')return;items.push({t:'in',n});return}
      if(n.tagName==='LABEL'){if(n.querySelector('input'))return;items.push({t:'lb',n});return}
      if(n.classList.contains('mt')){items.push({t:'p',tx:n.innerText.replace(/\n+/g,' · ')});return}
      if(n.parentElement&&n.parentElement.closest('p,.mt'))return;
      const tx=n.textContent.trim();if(!tx||n.hidden)return;
      const err=n.matches('.pdpeMsg,.er')||/incorrect|no se pudo|error/i.test(tx);
      items.push({t:'p',tx,cls:err?'err':''});
    });
    return {titulo:titulo.trim(),items,cerrar};
  }
  function tipo(el,m){
    if(el.id==='pdpeVelo')return 'code';
    const ic=el.querySelector('.pdDlgIco');
    if(ic&&ic.classList.contains('exito'))return 'ok';
    if(ic&&ic.classList.contains('peligro'))return 'mal';
    return 'q';
  }
  function pintarDlg(){
    capa();const dl=root.getElementById('dl');
    const el=[...document.querySelectorAll(SEL)].reverse().find(vis);
    if(document.documentElement.classList.contains('pdDlgOn'))document.documentElement.classList.remove('pdDlgOn');
    if(!el){if(orig){orig=null;firma='';dl.innerHTML=''}return}
    esconder(el);
    const m=armar(el);const tp=tipo(el,m);
    const f=el.id+'|'+m.titulo+'|'+m.items.map(i=>i.t+':'+(i.tx||(i.n&&(i.n.textContent||'')+(i.n.disabled?'d':'')+(i.n.tagName==='INPUT'?'':''))||'')).join('|');
    if(orig===el&&f===firma){/* solo sincroniza el valor de los campos */return}
    orig=el;firma=f;
    const act=root.activeElement;const foco=act&&act.dataset?act.dataset.i:null;
    let h=`<div class="tapa"></div><div class="cd" role="dialog" aria-modal="true" aria-label="${E(m.titulo||'Aviso')}" style="--abajo:${abajo()}px"><div class="hd"><span class="ic ${tp==='ok'?'ok':tp==='mal'?'mal':''}">${tp==='code'?IC.code:IC[tp]||IC.q}</span><div class="tt"><b>${E(m.titulo||'Aviso')}</b></div>${m.cerrar?'<button type="button" class="x" data-c="1" aria-label="Cerrar">×</button>':''}</div>`;
    const btns=[];let i=0;
    m.items.forEach(it=>{const k=i++;
      if(it.t==='p')h+=`<p class="${it.cls||''}">${E(it.tx)}</p>`;
      else if(it.t==='lb')h+=`<label for="pdv${k+1}">${E(it.n.textContent.trim())}</label>`;
      else if(it.t==='in'){const cod=it.n.maxLength===4||/one-time-code/.test(it.n.autocomplete||'');h+=`<input id="pdv${k}" data-i="${k}" class="${cod?'cod':''}" inputmode="${E(it.n.inputMode||'')}" ${it.n.maxLength>0?`maxlength="${it.n.maxLength}"`:''} placeholder="${E(it.n.placeholder||'')}" value="${E(it.n.value)}">`}
      else if(it.t==='btn'){
        const n=it.n;const op=n.classList.contains('pdVuOp');
        if(op){h+=`<button type="button" class="op" data-b="${k}"><b>${E((n.querySelector('b')||n).textContent.trim())}</b>${n.querySelector('small')?`<span>${E(n.querySelector('small').textContent.trim())}</span>`:''}</button>`;return}
        btns.push({k,n});
      }
    });
    if(btns.length){
      const prim=b=>/pdDlgSi|si\b|\bok\b|btn|main|pdPrim/i.test(b.n.className)||/^(aceptar|confirmar|guardar|sí|si,|entendido|enviar|continuar)/i.test(b.n.textContent.trim());
      const cls=b=>{const tx=b.n.textContent.trim();if(/^(cancelar|no\b|cerrar|volver|ahora no)/i.test(tx))return '';if(/peligro/.test(b.n.className))return 'r';if(/foto|no tiene|otro/i.test(tx))return 'l';if(prim(b))return 'o';return ''};
      const orden=btns.slice().sort((a,b)=>(cls(a)==='o')-(cls(b)==='o'));
      const dos=btns.length===2&&btns.every(b=>b.n.textContent.trim().length<16);
      h+=`<div class="bs${dos?' dos':''}">${(dos?orden:btns.slice().sort((a,b)=>(cls(b)==='o')-(cls(a)==='o'))).map(b=>`<button type="button" class="b ${cls(b)}" data-b="${b.k}"${b.n.disabled?' disabled':''}>${E(b.n.textContent.trim())}</button>`).join('')}</div>`;
    }
    h+=`</div>`;
    dl.innerHTML=h;
    const mapa=m.items;
    dl.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{const n=mapa[+b.dataset.b].n;if(n&&!n.disabled)n.click();setTimeout(pintarDlg,30)});
    dl.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{m.cerrar&&m.cerrar.click();setTimeout(pintarDlg,30)});
    dl.querySelectorAll('[data-i]').forEach(inp=>{const n=mapa[+inp.dataset.i].n;
      inp.addEventListener('input',()=>{n.value=inp.value;n.dispatchEvent(new Event('input',{bubbles:true}));if(n.value!==inp.value)inp.value=n.value});
      inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const p=dl.querySelector('.b.o');p&&p.click()}})});
    const fi=foco!=null?dl.querySelector(`[data-i="${foco}"]`):dl.querySelector('input');if(fi)setTimeout(()=>{fi.focus();try{fi.setSelectionRange(fi.value.length,fi.value.length)}catch(_){}},40);
  }
  /* avisos cortos (arriba, se van solos) */
  function pintarToasts(){
    capa();const p=document.getElementById('pdAvisoPila');const ts=root.getElementById('ts');
    if(!p){if(ts.innerHTML)ts.innerHTML='';return}
    esconder(p);
    const L=[...p.children].filter(c=>c.textContent.trim());
    const f=L.map(c=>c.className+c.textContent).join('|');if(ts.dataset.f===f)return;ts.dataset.f=f;
    ts.innerHTML=L.map((c,i)=>`<div class="t ${c.classList.contains('error')?'mal':c.classList.contains('ok')?'ok':''}" role="status"><span class="d"></span><span>${E((c.querySelector('span')||c).textContent.trim())}</span><button type="button" data-t="${i}" aria-label="Cerrar aviso">×</button></div>`).join('');
    ts.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{const c=L[+b.dataset.t];c&&c.querySelector('button')&&c.querySelector('button').click();setTimeout(pintarToasts,20)});
  }
  /* sin velo: ningún fondo oscuro ni desenfoque detrás de las ventanas */
  function sinVelo(){
    document.querySelectorAll('#pdFondoHoja,[data-pdm-velo],[data-pd-sin-velo]').forEach(v=>{
      if(v.dataset.pdSinFondo==='1'&&v.style.getPropertyValue('background')==='transparent')return;v.dataset.pdSinFondo='1';
      ['background','background-color'].forEach(k=>v.style.setProperty(k,'transparent','important'));
      ['backdrop-filter','-webkit-backdrop-filter','filter'].forEach(k=>v.style.setProperty(k,'none','important'));
      if(!v.children.length)v.style.setProperty('pointer-events','none','important');
    });
  }
  /* Ventana propia con el mismo diseño (para elegir entre varias opciones o mostrar un mensaje para copiar).
     pdVentana({ic:'mal'|'ok'|'q', titulo, html, botones:[{k,t,c:'o'|'r'|'g'|'',sub,queda}], alTocar(k,raiz)}) → Promise(k|null) */
  window.pdVentana=function(o){return new Promise(res=>{
    const h=document.createElement('pd-ventana');h.setAttribute('data-pd-aislado','1');const r=h.attachShadow({mode:'open'});
    const ab=abajo();
    const bs=(o.botones||[]);const dos=bs.length===2&&bs.every(b=>!b.sub&&String(b.t).length<16);
    r.innerHTML=`<style>${CSS}:host{z-index:2147483647}.b small{display:block;font-size:13px;font-weight:600;opacity:.8;margin-top:2px}.b.s{height:auto;min-height:54px;padding:8px 12px}.b.x2{border:0;background:transparent;color:#6B5E55;font-weight:700;height:46px}.b:focus{outline:none}.b:focus-visible{outline:2px solid #F6CDB3;outline-offset:2px}textarea{font-family:inherit;height:auto;min-height:200px;padding:12px 14px;font-size:15px;font-weight:500;line-height:1.45;resize:vertical;background:#FFF9F5}</style>
      <div class="tapa" data-k=""></div><div class="cd" role="dialog" aria-modal="true" aria-label="${E(o.titulo||'')}" style="--abajo:${ab}px"><div class="hd"><span class="ic ${o.ic||''}">${IC[o.ic==='mal'?'mal':o.ic==='ok'?'ok':'q']}</span><div class="tt"><b>${E(o.titulo||'')}</b></div></div>${o.html||''}
      <div class="bs${dos?' dos':''}">${bs.map(b=>`<button type="button" class="b ${b.c||''}${b.sub?' s':''}" data-k="${E(b.k)}">${E(b.t)}${b.sub?`<small>${E(b.sub)}</small>`:''}</button>`).join('')}${o.cancelar===false?'':`<button type="button" class="b x2" data-k="">${E(o.cancelar||'Cancelar')}</button>`}</div></div>`;
    const fin=v=>{h.remove();res(v||null)};
    r.addEventListener('click',e=>{const x=e.target.closest('[data-k]');if(!x)return;const k=x.dataset.k;const b=bs.find(y=>String(y.k)===k);if(b&&b.queda){try{o.alTocar&&o.alTocar(k,r,x)}catch(_){}return}fin(k)});
    document.body.appendChild(h);setTimeout(()=>{const x=r.querySelector('.b.o,.b.r,.b.g');x&&x.focus()},40);
  })};
  let pend=0;const tick=()=>{pend=0;try{sinVelo();pintarDlg();pintarToasts()}catch(e){console.warn('Ventanas:',e)}};
  new MutationObserver(()=>{if(!pend)pend=requestAnimationFrame(tick)}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class','disabled','data-pdm-velo','data-pd-sin-velo'],characterData:true});
  setInterval(tick,1000);
})();

