
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
