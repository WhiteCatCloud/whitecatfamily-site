// Footer year
const y=document.getElementById('year'); if (y) y.textContent=String(new Date().getFullYear());

// Intro overlay fade (reappears near top)
const overlay=document.getElementById('introOverlay');
function renderOverlay(){
  const start=120, end=360;
  const s=window.scrollY;
  let o=1;
  if (s<=start) o=1;
  else if (s>=end) o=0;
  else o=1 - (s-start)/(end-start);
  overlay.style.opacity=String(o);
  requestAnimationFrame(renderOverlay);
}
requestAnimationFrame(renderOverlay);

// Sticky scene logic (timing from WCF-019)
const scene=document.querySelector('.scene');
const left=[...document.querySelectorAll('.left .h-item')];
const right=[...document.querySelectorAll('.right .h-item')];
const hero=document.querySelector('.device.hero');
const back=document.querySelector('.device.back');

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
    el.style.transform=`translateY(${lerp(24,0,local)}px) scale(${lerp(.98,1,local)})`;
  });
}

function renderScene(){
  const p=progress();

  // HERO appears 0.10..0.25; holds; swap at 0.60..0.72
  const heroIn = clamp((p-0.10)/0.15);
  const heroOut = clamp((p-0.60)/0.12);
  hero.style.opacity = String(heroIn * (1 - heroOut));
  hero.style.transform = `translateY(${lerp(6,-4,heroIn)}px) scale(${lerp(1.0,.985,heroIn)})`;

  // Left reveals 0.18..0.60
  revealList(left, clamp((p-0.18)/0.42));

  // Swap to BACK 0.60..0.72
  const tSwap = clamp((p-0.60)/0.12);
  back.style.opacity = String(tSwap);
  back.style.transform = `translateY(${lerp(8,0,tSwap)}px) scale(${lerp(.985,1.0,tSwap)})`;

  // Right reveals 0.68..0.86
  revealList(right, clamp((p-0.68)/0.18));

  // Long internal tail 0.86..0.99: lock final state
  if (p>0.86){
    right.forEach(el=>{ el.style.opacity='1'; el.style.transform='translateY(0) scale(1)'; });
    back.style.opacity='1'; back.style.transform='translateY(0) scale(1)';
  }

  requestAnimationFrame(renderScene);
}
requestAnimationFrame(renderScene);

// Observe cards for reveal
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('show');
  });
},{threshold:0.2});
document.querySelectorAll('.observe').forEach(el => obs.observe(el));

// Chip parallax (subtle) on scroll within tech section
const tech = document.querySelector('#tech');
const chip = document.querySelector('.chip');
function chipParallax(){
  if (!tech || !chip) return requestAnimationFrame(chipParallax);
  const r = tech.getBoundingClientRect();
  const v = window.innerHeight;
  const t = Math.min(1, Math.max(0, (v - r.top)/(v + r.height))); // 0..1 as section enters
  const y = (1 - t) * 20; // move up to 20px
  const s = 1 + t*0.03;   // slight scale up to 1.03
  chip.style.transform = `translateY(${y}px) scale(${s})`;
  requestAnimationFrame(chipParallax);
}
requestAnimationFrame(chipParallax);
