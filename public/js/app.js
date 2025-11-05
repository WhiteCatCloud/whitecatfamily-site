// Footer year
const y=document.getElementById('year'); if (y) y.textContent=String(new Date().getFullYear());

// Scroll reveal for cards (welcome page)
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('show'); });
},{threshold:0.2});
document.querySelectorAll('.observe').forEach(el => obs.observe(el));

// Halo animation (index only)
const ring=document.querySelector('.halo-bg .ring');
const hero=document.querySelector('.hero-halo');
if (ring && hero){
  const haloObs=new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        ring.animate([
          {transform:'scale(0.7)', opacity:0.0},
          {transform:'scale(1.05)', opacity:0.9, offset:0.6},
          {transform:'scale(1.2)', opacity:0.0}
        ],{duration:2600, easing:'cubic-bezier(.2,.6,.2,1)', fill:'forwards'});
      }
    });
  },{threshold:0.4});
  haloObs.observe(hero);
}

// Product page animation (if present)
const scene=document.querySelector('.scene');
if (scene){
  const left=[...document.querySelectorAll('.left .h-item')];
  const right=[...document.querySelectorAll('.right .h-item')];
  const heroImg=document.querySelector('.device.hero');
  const backImg=document.querySelector('.device.back');

  const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>t*t*(3-2*t);

  function progress(){
    const r=scene.getBoundingClientRect(), v=innerHeight;
    return clamp((v - r.top)/(r.height + v));
  }
  function revealList(items, t){
    const n=items.length, step=1/n;
    items.forEach((el,i)=>{
      const start=i*step;
      const local=smooth(clamp((t - start)/step));
      el.style.opacity=local;
      el.style.transform=`translateY(${24 - 24*local}px) scale(${0.98 + 0.02*local})`;
    });
  }
  function renderScene(){
    const p=progress();
    const heroIn = clamp((p-0.10)/0.15);
    const heroOut = clamp((p-0.60)/0.12);
    heroImg.style.opacity = String(heroIn * (1 - heroOut));
    heroImg.style.transform = `translateY(${6 - 10*heroIn}px) scale(${1.0 - 0.015*heroIn})`;
    revealList(left, clamp((p-0.18)/0.42));
    const tSwap = clamp((p-0.60)/0.12);
    backImg.style.opacity = String(tSwap);
    backImg.style.transform = `translateY(${8 - 8*tSwap}px) scale(${0.985 + 0.015*tSwap})`;
    revealList(right, clamp((p-0.68)/0.18));
    if (p>0.86){
      right.forEach(el=>{ el.style.opacity='1'; el.style.transform='translateY(0) scale(1)'; });
      backImg.style.opacity='1'; backImg.style.transform='translateY(0) scale(1)';
    }
    requestAnimationFrame(renderScene);
  }
  requestAnimationFrame(renderScene);
}


// Welcome page parallax & lift
(function(){
  const hero = document.querySelector('.hero-halo');
  const ring = document.querySelector('.halo-bg .ring');
  if (!hero || !ring) return;
  function onScroll(){
    const r = hero.getBoundingClientRect();
    const vh = window.innerHeight;
    const t = Math.min(1, Math.max(0, (vh - r.top)/vh)); // 0..1 as hero scrolls
    ring.style.transform = `scale(${0.7 + 0.6*t})`;
    ring.style.opacity = String(0.15 + 0.75*t);
    if (t>0.15) hero.classList.add('scrolled'); else hero.classList.remove('scrolled');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, {passive:true});
})();


// Product picker: animate in + click ripple/fade
(function(){
  const menu = document.querySelector('.prod-menu.animate-in');
  if(!menu) return;
  const cards = [...menu.querySelectorAll('.prod-card')];
  // Reveal stagger
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        cards.forEach(c => c.classList.add('show'));
        io.disconnect();
      }
    });
  },{threshold:.2});
  io.observe(menu);

  // Click ripple -> fade -> navigate
  cards.forEach(card => {
    const href = card.getAttribute('href');
    if(!href) return;
    card.addEventListener('click', (e)=>{
      e.preventDefault();
      const rect = card.getBoundingClientRect();
      const rx = (e.clientX - rect.left) + 'px';
      const ry = (e.clientY - rect.top) + 'px';
      card.style.setProperty('--rx', rx);
      card.style.setProperty('--ry', ry);
      card.classList.add('clicked');
      document.body.classList.add('fade-out');
      setTimeout(()=>{ window.location.href = href; }, 220);
    });
  });
})();


// Toggle Product subnav without navigation
(function(){
  const productLink = [...document.querySelectorAll('.nav a')].find(a => a.textContent.trim() === 'Product');
  if(!productLink) return;
  productLink.addEventListener('click', (e)=>{
    // If link goes to product.html, convert to toggle
    e.preventDefault();
    document.body.classList.toggle('show-subnav');
  });
})();


// Toggle Product subnav without navigation (centered single option)
(function(){
  const navLinks = document.querySelectorAll('.nav a');
  const productLink = [...navLinks].find(a => a.textContent.trim() === 'Product');
  if(!productLink) return;
  productLink.addEventListener('click', (e)=>{
    e.preventDefault();
    document.body.classList.toggle('show-subnav');
  });
})();
