
document.addEventListener('DOMContentLoaded',()=>{const y=document.getElementById('year');if(y)y.textContent=new Date().getFullYear();});
// Toggle product subnav
(function(){const p=[...document.querySelectorAll('.nav a')].find(a=>a.textContent.trim().toLowerCase()==='product');if(!p)return;p.addEventListener('click',e=>{e.preventDefault();document.body.classList.toggle('show-subnav');scrollTo({top:0,behavior:'smooth'});});})();
// Intro fade + reveal
(function(){
  const intro=document.querySelector('.intro-full'); if(intro){const wrap=intro.querySelector('.intro-wrap'); const onS=()=>{const r=intro.getBoundingClientRect();const vh=innerHeight;const t=Math.min(1,Math.max(0,(vh-r.top)/vh)); if(t>0.12) wrap.classList.add('dim'); else wrap.classList.remove('dim');}; onS(); addEventListener('scroll',onS,{passive:true});}
  const rev=document.querySelectorAll('.reveal'); const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('show')}),{threshold:.15}); rev.forEach(el=>io.observe(el));
})();
// AX3000 scene
(function(){
  const scene=document.querySelector('.scene'); if(!scene) return;
  const items=[...scene.querySelectorAll('.h-item')];
  const hero=scene.querySelector('img.hero'); const back=scene.querySelector('img.back');
  const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('show');});},{threshold:.4}); items.forEach(i=>io.observe(i));
  function fade(){const rect=scene.getBoundingClientRect();const vh=innerHeight;const p=(vh-rect.top)/(rect.height);const front=Math.max(0,1-(p*2-0.2));const b=Math.max(0,(p*2-0.2)); if(hero){hero.style.opacity=Math.min(1,Math.max(0,front)); if(front>0.02) hero.classList.add('visible');} if(back){back.style.opacity=Math.min(1,Math.max(0,b)); if(b>0.02) back.classList.add('visible');}}
  addEventListener('scroll',fade,{passive:true}); fade();
})();


// WCF-032: refine intro + product sequence
(function(){
  // Solution intro: keep title until user actually scrolls; then fade
  const intro = document.querySelector('.intro-full');
  if(intro){
    const wrap = intro.querySelector('.intro-wrap');
    const onScroll = () => {
      const r = intro.getBoundingClientRect();
      const vh = innerHeight;
      // Fade only after ~35% scroll through the intro section
      const progress = Math.min(1, Math.max(0, (vh*0.65 - r.top)/ (vh*0.65)));
      if (progress > 0.6) wrap.classList.add('dim'); else wrap.classList.remove('dim');
    };
    onScroll();
    addEventListener('scroll', onScroll, {passive:true});
  }

  // Product page sequence
  const pIntro = document.querySelector('.product-intro');
  const scene = document.querySelector('.scene');
  if(pIntro && scene){
    const pWrap = pIntro.querySelector('.intro-wrap') || pIntro.firstElementChild;
    const hero = scene.querySelector('img.hero');
    const back = scene.querySelector('img.back');
    if(hero) hero.classList.add('start');
    if(back) back.classList.add('start');

    // As we scroll past the intro by ~25%, fade out title and fade in router
    const onScrollP = () => {
      const r = pIntro.getBoundingClientRect();
      const vh = innerHeight;
      const passed = (vh*0.75 - r.top) / (vh*0.75);
      if(pWrap){
        if(passed > 0.9) pWrap.classList.add('dim'); else pWrap.classList.remove('dim');
      }
      if(hero){
        if(passed > 0.9) hero.classList.add('on'); else hero.classList.remove('on');
      }
    };
    onScrollP();
    addEventListener('scroll', onScrollP, {passive:true});

    // Highlights cascade: reveal one-by-one
    const items = [...scene.querySelectorAll('.h-item')];
    items.forEach((el,i)=>{
      el.classList.add('step'+(i+1));
    });
    const io = new IntersectionObserver(es=>{
      es.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('show'); });
    },{threshold:.35});
    items.forEach(i=>io.observe(i));

    // Crossfade front->back during scene scroll
    function fade(){
      const rect=scene.getBoundingClientRect();
      const vh=innerHeight;
      const p=(vh-rect.top)/(rect.height); // 0..1
      if(hero) hero.style.opacity = Math.min(1, Math.max(0, 1 - (p*1.6 - 0.2)));
      if(back) back.style.opacity  = Math.min(1, Math.max(0, (p*1.6 - 0.2)));
      if(back && parseFloat(getComputedStyle(back).opacity) > 0.02) back.classList.add('on');
    }
    addEventListener('scroll', fade, {passive:true}); fade();
  }
})();


// WCF-033: explicit scroll sequencing
(function(){
  // --- Solution title fade only after user scrolls ---
  const intro = document.querySelector('.intro-full');
  if(intro){
    const wrap = intro.querySelector('.intro-wrap');
    const onScroll = () => {
      // Fade only when user actually scrolls (not on load paint)
      const sc = Math.max(0, window.scrollY || window.pageYOffset || 0);
      const r = intro.getBoundingClientRect();
      const vh = innerHeight;
      // progress through intro viewport
      const p = Math.min(1, Math.max(0, (vh - r.top)/vh));
      // require tiny scroll (>10px) and progress > ~0.2 before dim
      if (sc > 10 && p > 0.2) wrap.classList.add('dim'); else wrap.classList.remove('dim');
    };
    onScroll(); addEventListener('scroll', onScroll, {passive:true});
  }

  // --- Product page choreography ---
  const pIntro = document.querySelector('.product-intro');
  const scene = document.querySelector('.scene');
  if(pIntro && scene){
    const titleWrap = pIntro.querySelector('.intro-wrap') || pIntro.firstElementChild;
    const hero = scene.querySelector('img.hero') || scene.querySelector('img[src*="router-front"]');
    const back = scene.querySelector('img.back') || scene.querySelector('img[src*="router-io"]');
    const left = [...scene.querySelectorAll('.col')][0]?.querySelectorAll('.h-item') || [];
    const right = [...scene.querySelectorAll('.col')][1]?.querySelectorAll('.h-item') || [];

    function clamp(v,a,b){ return Math.min(b, Math.max(a, v)); }
    function lerp(a,b,t){ return a + (b-a)*t; }

    function onScrollProd(){
      const vh = innerHeight;

      // 1) Product intro progress: fade title out between 10%-30% scrolled
      const rIntro = pIntro.getBoundingClientRect();
      const introP = clamp((vh*0.9 - rIntro.top) / (vh*0.9), 0, 1); // 0..1 through intro
      // Title fade window
      const fadeStart = 0.10, fadeEnd = 0.30;
      const titleAlpha = 1 - clamp((introP - fadeStart)/(fadeEnd - fadeStart), 0, 1);
      if(titleWrap){
        titleWrap.style.opacity = String(titleAlpha);
        titleWrap.style.transform = `translateY(${lerp(0,-24, clamp((introP - fadeStart)/(fadeEnd - fadeStart),0,1))}px)`;
      }

      // Router (front) fades in after title: 20%..45%
      const heroInStart = 0.20, heroInEnd = 0.45;
      const heroAlpha = clamp((introP - heroInStart)/(heroInEnd - heroInStart), 0, 1);
      if(hero){
        hero.style.opacity = String(heroAlpha);
        hero.classList.toggle('show', heroAlpha > 0.02);
      }

      // 2) Scene progress for highlights and back transition
      const rScene = scene.getBoundingClientRect();
      const sceneP = clamp((vh - rScene.top) / (rScene.height || 1), 0, 1); // 0..1

      // Highlights timing:
      // Left column (1,2,3) appear at 0.15, 0.25, 0.35
      const leftMarks = [0.15, 0.25, 0.35];
      left.forEach((el, i) => {
        if(sceneP > leftMarks[i]) el.classList.add('on'); else el.classList.remove('on');
      });

      // Start crossfade to back between 0.50..0.70 of scene
      const backStart = 0.50, backEnd = 0.70;
      const cross = clamp((sceneP - backStart)/(backEnd - backStart), 0, 1);
      if(hero){
        const heroOut = 1 - cross; // fades from 1 to 0
        hero.style.opacity = String(heroAlpha * heroOut); // ensure hero only after intro
      }
      if(back){
        back.style.opacity = String(cross); // 0 -> 1
        back.classList.toggle('show', cross > 0.02);
      }

      // Right column (4,5,6) after back begins, at 0.60, 0.70, 0.80
      const rightMarks = [0.60, 0.70, 0.80];
      right.forEach((el, i) => {
        if(sceneP > rightMarks[i]) el.classList.add('on'); else el.classList.remove('on');
      });
    }

    onScrollProd();
    addEventListener('scroll', onScrollProd, {passive:true});
    addEventListener('resize', onScrollProd);
  }
})();


// WCF-034: Scroll-speed-driven timeline (no page scroll)
(function(){
  const root = document.querySelector('.timeline-root');
  if(!root) return;

  // Prevent native scroll on this page
  document.documentElement.style.height = '100%';
  document.body.style.height = '100%';
  document.body.style.overflow = 'hidden';

  const title = root.querySelector('.timeline-title');
  const deviceFront = root.querySelector('img.device-front');
  const deviceBack = root.querySelector('img.device-back');
  const hls = [...root.querySelectorAll('.hl')]; // 6 items
  const specs = root.querySelector('.timeline-specs');

  let p = 0; // progress 0..1
  const clamp = (v,a,b)=>Math.min(b,Math.max(a,v));
  const smooth = (t)=>t*t*(3-2*t); // smoothstep

  function setAlpha(el, a){ if(!el) return; el.style.opacity = String(clamp(a,0,1)); }
  function setOn(el, on){ if(!el) return; el.classList.toggle('on', !!on); }
  function setShow(el, on){ if(!el) return; el.classList.toggle('show', !!on); }

  function render(){
    // Segments:
    // 0.00-0.12 Title fully visible, 0.12-0.22 fade out
    const tFade = clamp((p - 0.12)/0.10, 0, 1);
    setShow(title, true);
    setAlpha(title, 1 - smooth(tFade));

    // 0.18-0.35 Front fades in
    const fIn = smooth(clamp((p - 0.18)/0.17, 0, 1));
    setOn(deviceFront, fIn > 0.02);
    setAlpha(deviceFront, fIn);

    // 0.28 / 0.36 / 0.44 highlights 1-3
    const marksL = [0.28, 0.36, 0.44];
    for(let i=0;i<3;i++){
      const a = smooth(clamp((p - marksL[i])/0.08, 0, 1));
      setOn(hls[i], a > 0.02); setAlpha(hls[i], a);
    }

    // 0.52-0.66 crossfade to back
    const x = smooth(clamp((p - 0.52)/0.14, 0, 1));
    setAlpha(deviceFront, (1 - x) * fIn);
    setOn(deviceBack, x > 0.02);
    setAlpha(deviceBack, x);

    // 0.66 / 0.74 / 0.82 highlights 4-6
    const marksR = [0.66, 0.74, 0.82];
    for(let i=3;i<6;i++){
      const a = smooth(clamp((p - marksR[i-3])/0.08, 0, 1));
      setOn(hls[i], a > 0.02); setAlpha(hls[i], a);
    }

    // 0.90-1.00 fade whole stage out, fade specs in
    const toSpecs = smooth(clamp((p - 0.90)/0.10, 0, 1));
    const stage = root.querySelector('.timeline-stage');
    if(stage){ stage.style.opacity = String(1 - toSpecs); }
    setShow(specs, toSpecs > 0.01);
    setAlpha(specs, toSpecs);
  }

  // Input handling: wheel + touch to control p
  let touchY = null;
  function step(delta){
    // delta > 0 means scroll down
    const scale = 0.0007; // sensitivity
    p = clamp(p + delta*scale, 0, 1);
    render();
  }

  window.addEventListener('wheel', (e)=>{
    e.preventDefault();
    step(e.deltaY);
  }, {passive:false});

  window.addEventListener('touchstart', (e)=>{
    touchY = e.touches[0].clientY;
  }, {passive:true});
  window.addEventListener('touchmove', (e)=>{
    if(touchY==null) return;
    const dy = touchY - e.touches[0].clientY;
    touchY = e.touches[0].clientY;
    step(dy*2);
  }, {passive:false});
  window.addEventListener('touchend', ()=>{touchY=null;}, {passive:true});

  // Keyboard left/right for testing
  window.addEventListener('keydown', (e)=>{
    if(e.key==='ArrowDown' || e.key==='ArrowRight') step(120);
    if(e.key==='ArrowUp' || e.key==='ArrowLeft') step(-120);
    if(e.key==='Home'){ p=0; render(); }
    if(e.key==='End'){ p=1; render(); }
  });

  // Initial render
  render();
})();


// WCF-035: side columns + later specs fade
(function(){
  const root = document.querySelector('.timeline-root');
  if(!root) return;
  const deviceFront = root.querySelector('img.device-front');
  const deviceBack  = root.querySelector('img.device-back');
  const leftCol = root.querySelector('.hl-col.left');
  const rightCol = root.querySelector('.hl-col.right');
  if(!leftCol || !rightCol) return;
  const leftH = [...leftCol.querySelectorAll('.hl')];
  const rightH = [...rightCol.querySelectorAll('.hl')];

  // Hook into same progress variable by recomputing locally (since WCF-034 used local 'p')
  let p = 0;
  const clamp = (v,a,b)=>Math.min(b,Math.max(a,v));
  const smooth = (t)=>t*t*(3-2*t);

  // Attach to wheel/touch again to set p; reuse same handlers by layering a new controller.
  let touchY=null;
  function render(){
    // We can't access WCF-034's stage reference here cleanly, so recompute with query:
    const stage = root.querySelector('.timeline-stage');
    const title = root.querySelector('.timeline-title');
    const specs = root.querySelector('.timeline-specs');

    // Title fade (unchanged thresholds)
    const tFade = clamp((p - 0.12)/0.10, 0, 1);
    if(title){ title.style.opacity = String(1 - smooth(tFade)); }

    // Front in
    const fIn = smooth(clamp((p - 0.18)/0.17, 0, 1));
    if(deviceFront){ deviceFront.style.opacity = String(fIn); }

    // Left highlights at 0.30/0.38/0.46
    const leftMarks = [0.30, 0.38, 0.46];
    leftH.forEach((el,i)=>{
      const a = smooth(clamp((p - leftMarks[i])/0.08, 0, 1));
      el.classList.toggle('on', a>0.02); el.style.opacity = String(a);
    });

    // Crossfade to back 0.56..0.72
    const cross = smooth(clamp((p - 0.56)/0.16, 0, 1));
    if(deviceFront){ deviceFront.style.opacity = String(fIn * (1 - cross)); }
    if(deviceBack){ deviceBack.style.opacity = String(cross); }

    // Right highlights at 0.72/0.80/0.88
    const rightMarks = [0.72, 0.80, 0.88];
    rightH.forEach((el,i)=>{
      const a = smooth(clamp((p - rightMarks[i])/0.08, 0, 1));
      el.classList.toggle('on', a>0.02); el.style.opacity = String(a);
    });

    // Specs fade after 0.94 (extra dead travel), 0.94..1.00
    const specsT = smooth(clamp((p - 0.94)/0.06, 0, 1));
    if(stage) stage.style.opacity = String(1 - specsT);
    if(specs){ specs.classList.toggle('show', specsT>0.01); specs.style.opacity = String(specsT); }
  }

  function step(delta){ const scale=0.0007; p=clamp(p+delta*scale,0,1); render(); }
  window.addEventListener('wheel', e=>{ e.preventDefault(); step(e.deltaY); }, {passive:false});
  window.addEventListener('touchstart', e=>{ touchY=e.touches[0].clientY; }, {passive:true});
  window.addEventListener('touchmove', e=>{ if(touchY==null) return; const dy=touchY-e.touches[0].clientY; touchY=e.touches[0].clientY; step(dy*2); }, {passive:false});
  window.addEventListener('touchend', ()=>{ touchY=null; }, {passive:true});
  window.addEventListener('keydown', e=>{ if(e.key==='ArrowDown'||e.key==='ArrowRight') step(120); if(e.key==='ArrowUp'||e.key==='ArrowLeft') step(-120); });
  render();
})();
