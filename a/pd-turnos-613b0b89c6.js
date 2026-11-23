/* Pidemás: horarios partidos (dos turnos en el mismo día).
   Formato guardado: lunes=12:00-15:00,18:00-22:00|martes=...
   getDailySchedule(...) sigue devolviendo {open,close} (del primer al último turno)
   y además {tramos:[{open,close},...]} cuando hay más de un turno. */
(function(){
  if(window.__pdTurnos)return;window.__pdTurnos=1;
  const SEP=/\s*(?:,|;|\s+y\s+)\s*/i;
  function instalar(){
    const p0=window.parseHorario;
    if(typeof p0==='function'&&!p0.__t){
      const p=function(h){
        const raw=String(h||'').trim();
        if(!SEP.test(raw))return p0.apply(this,arguments);
        const tr=raw.split(SEP).map(x=>p0(x)).filter(Boolean).filter(t=>t.open<t.close).sort((a,b)=>a.open-b.open);
        if(!tr.length)return null;if(tr.length===1)return tr[0];
        return {open:tr[0].open,close:tr[tr.length-1].close,tramos:tr};
      };p.__t=1;window.parseHorario=p;
    }
    const g0=window.getDailySchedule;
    if(typeof g0==='function'&&!g0.__t){
      const g=function(){
        const r=g0.apply(this,arguments);if(!r||!r.tramos)return r;
        /* recorta cada turno al horario ya recortado (horario de Pidemás) */
        const tr=r.tramos.map(t=>({open:Math.max(t.open,r.open),close:Math.min(t.close,r.close)})).filter(t=>t.open<t.close);
        if(!tr.length)return null;
        const o=Object.assign({},r,{open:tr[0].open,close:tr[tr.length-1].close});if(tr.length>1)o.tramos=tr;else delete o.tramos;return o;
      };g.__t=1;window.getDailySchedule=g;
    }
    const o0=window.isRestaurantOpen;
    if(typeof o0==='function'&&!o0.__t){
      const o=function(r,ref){
        const ok=o0.apply(this,arguments);if(!ok)return false;
        try{
          const now=ref||(window.__pdProg&&window.__pdProg.fecha)||getLimaNow();
          const h=pick(r,['horario','horarios','horario_atencion','horario_atencion_negocio'],'');
          const rg=window.getDailySchedule(h,now);
          if(rg&&rg.tramos){const c=now.getHours()*60+now.getMinutes();return rg.tramos.some(t=>c>=t.open&&c<t.close)}
        }catch(e){}
        return ok;
      };o.__t=1;window.isRestaurantOpen=o;
    }
  }
  /* Turnos de un horario diario */
  window.pdTramos=rg=>rg?(rg.tramos||[{open:rg.open,close:rg.close}]):[];
  /* «12 – 3 p. m. y 6 – 10 p. m.» */
  window.pdTramosTxt=function(rg,fmt){
    const f=fmt||(m=>{m=((m%1440)+1440)%1440;const h=Math.floor(m/60),mi=m%60;return (h%12||12)+(mi?':'+String(mi).padStart(2,'0'):'')+' '+(h>=12?'p. m.':'a. m.')});
    return window.pdTramos(rg).map(t=>f(t.open)+' – '+f(t.close)).join(' y ');
  };
  instalar();
  document.addEventListener('DOMContentLoaded',instalar);
  setTimeout(instalar,0);setTimeout(instalar,400);setTimeout(instalar,1500);
})();
