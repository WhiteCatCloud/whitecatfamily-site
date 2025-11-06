
document.addEventListener('DOMContentLoaded',()=>{const y=document.getElementById('year');if(y)y.textContent=new Date().getFullYear();});
// Toggle product subnav
(function(){const p=[...document.querySelectorAll('.nav a')].find(a=>a.textContent.trim().toLowerCase()==='product');if(!p)return;p.addEventListener('click',e=>{e.preventDefault();document.body.classList.toggle('show-subnav');scrollTo({top:0,behavior:'smooth'});});})();
// Solution intro fade after scroll
(function(){const intro=document.querySelector('.intro-full');if(!intro)return;const wrap=intro.querySelector('.intro-wrap');const onS=()=>{const sc=Math.max(0,scrollY||pageYOffset||0);const r=intro.getBoundingClientRect();const vh=innerHeight;const p=Math.min(1,Math.max(0,(vh-r.top)/vh));if(sc>10&&p>0.2)wrap.classList.add('dim');else wrap.classList.remove('dim');};onS();addEventListener('scroll',onS,{passive:true});})();

// Product timeline (scroll-controlled, no page scroll)
(function(){
  const root=document.querySelector('.timeline-root'); if(!root) return;
  // Prevent native scroll for this page
  document.documentElement.style.height='100%'; document.body.style.height='100%'; document.body.style.overflow='hidden';

  const stage=root.querySelector('.timeline-stage');
  const title=root.querySelector('.timeline-title');
  const specs=root.querySelector('.timeline-specs');
  const front=root.querySelector('img.device-front');
  const back=root.querySelector('img.device-back');
  const left=[...root.querySelectorAll('.hl-col.left .hl')];
  const right=[...root.querySelectorAll('.hl-col.right .hl')];
  let p=0; // 0..1 progress

  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const smooth=t=>t*t*(3-2*t);

  function render(){
    // Title (hold, then fade)
    const tFade=clamp((p-0.12)/0.10,0,1);
    if(title){ title.style.opacity=String(1-smooth(tFade)); }

    // Front router later & longer
    const fIn=smooth(clamp((p-0.24)/0.26,0,1));
    if(front){ front.style.opacity=String(fIn); }

    // Left 1,2,3 with landing
    const LM=[0.36,0.46,0.56];
    left.forEach((el,i)=>{ const a=smooth(clamp((p-LM[i])/0.10,0,1)); el.classList.toggle('on',a>0.02); el.style.opacity=String(a); el.style.transform=`translateY(${(1-a)*28}px)`; });

    // Crossfade to back
    const cross=smooth(clamp((p-0.64)/0.18,0,1));
    if(front){ front.style.opacity=String(fIn*(1-cross)); }
    if(back){ back.style.opacity=String(cross); }

    // Right 4,5,6 later with landing
    const RM=[0.82,0.88,0.94];
    right.forEach((el,i)=>{ const a=smooth(clamp((p-RM[i])/0.08,0,1)); el.classList.toggle('on',a>0.02); el.style.opacity=String(a); el.style.transform=`translateY(${(1-a)*28}px)`; });

    // Specs after full buffer
    const sT=smooth(clamp((p-0.992)/0.008,0,1));
    if(stage) stage.style.opacity=String(1-sT);
    if(specs){ specs.classList.toggle('show',sT>0.01); specs.style.opacity=String(sT); }
  }

  function step(delta){ const scale=0.0007; p=clamp(p+delta*scale,0,1); render(); }

  // Controls: wheel/touch/keys
  let touchY=null;
  addEventListener('wheel',e=>{ e.preventDefault(); step(e.deltaY); },{passive:false});
  addEventListener('touchstart',e=>{ touchY=e.touches[0].clientY; },{passive:true});
  addEventListener('touchmove',e=>{ if(touchY==null) return; const dy=touchY-e.touches[0].clientY; touchY=e.touches[0].clientY; step(dy*2); },{passive:false});
  addEventListener('touchend',()=>{ touchY=null; },{passive:true});
  addEventListener('keydown',e=>{ if(e.key==='ArrowDown'||e.key==='ArrowRight') step(120); if(e.key==='ArrowUp'||e.key==='ArrowLeft') step(-120); if(e.key==='Home'){p=0;render();} if(e.key==='End'){p=1;render();} });

  render();
})();


// WCF-038: timing refinements (slower router; later 1-3; later crossfade; specs after 6th + buffer)
(function(){
  const root=document.querySelector('.timeline-root'); if(!root) return;
  const stage=root.querySelector('.timeline-stage');
  const title=root.querySelector('.timeline-title');
  const specs=root.querySelector('.timeline-specs');
  const front=root.querySelector('img.device-front');
  const back=root.querySelector('img.device-back');
  const left=[...root.querySelectorAll('.hl-col.left .hl')];
  const right=[...root.querySelectorAll('.hl-col.right .hl')];

  let p=0; const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)); const smooth=t=>t*t*(3-2*t);

  function render(){
    // Title: unchanged
    const tFade=clamp((p-0.12)/0.10,0,1);
    if(title){ title.style.opacity=String(1-smooth(tFade)); }

    // Router (front): slower + later 0.30..0.56
    const fIn=smooth(clamp((p-0.30)/0.26,0,1));
    if(front){ front.style.opacity=String(fIn); }

    // Left 1/2/3: 0.42 / 0.52 / 0.62 with landing
    const LM=[0.42,0.52,0.62];
    left.forEach((el,i)=>{
      const a=smooth(clamp((p-LM[i])/0.10,0,1));
      el.classList.toggle('on',a>0.02);
      el.style.opacity=String(a);
      el.style.transform=`translateY(${(1-a)*28}px)`;
    });

    // Crossfade later: 0.70..0.88
    const cross=smooth(clamp((p-0.70)/0.18,0,1));
    if(front){ front.style.opacity=String(fIn*(1-cross)); }
    if(back){ back.style.opacity=String(cross); }

    // Right 4/5/6 later: 0.88 / 0.94 / 0.98
    const RM=[0.88,0.94,0.98];
    right.forEach((el,i)=>{
      const a=smooth(clamp((p-RM[i])/0.06,0,1));
      el.classList.toggle('on',a>0.02);
      el.style.opacity=String(a);
      el.style.transform=`translateY(${(1-a)*28}px)`;
    });

    // Specs only after 6th fully visible + small buffer: 0.995..1.0
    const specsT=smooth(clamp((p-0.995)/0.005,0,1));
    if(stage) stage.style.opacity=String(1-specsT);
    if(specs){ specs.classList.toggle('show',specsT>0.01); specs.style.opacity=String(specsT); }
  }

  function step(delta){ const scale=0.0006; p=clamp(p+delta*scale,0,1); render(); } // slightly slower scrub
  let touchY=null;
  addEventListener('wheel',e=>{ e.preventDefault(); step(e.deltaY); },{passive:false});
  addEventListener('touchstart',e=>{ touchY=e.touches[0].clientY; },{passive:true});
  addEventListener('touchmove',e=>{ if(touchY==null) return; const dy=touchY-e.touches[0].clientY; touchY=e.touches[0].clientY; step(dy*2); },{passive:false});
  addEventListener('touchend',()=>{ touchY=null; },{passive:true});
  addEventListener('keydown',e=>{ if(e.key==='ArrowDown'||e.key==='ArrowRight') step(120); if(e.key==='ArrowUp'||e.key==='ArrowLeft') step(-120); });
  render();
})();
