// Footer year
const y=document.getElementById('year'); if (y) y.textContent=String(new Date().getFullYear());

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    e.preventDefault();
    const id=a.getAttribute('href').slice(1);
    const el=document.getElementById(id);
    if(el){ el.scrollIntoView({behavior:'smooth',block:'start'}); }
  });
});

// HALO scroll-triggered animation
const ring=document.querySelector('.halo-bg .ring');
const hero=document.querySelector('#solution');
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
if(hero) haloObs.observe(hero);

// PRODUCT sticky scene logic
const scene=document.querySelector('#product .scene');
const left=[...document.querySelectorAll('#product .left .h-item')];
const right=[...document.querySelectorAll('#product .right .h-item')];
const heroImg=document.querySelector('#product .device.hero');
const backImg=document.querySelector('#product .device.back');

const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);

function progress(){
  const r=scene.getBoundingClientRect(), v=innerHeight;
  return Math.min(1, Math.max(0, (v - r.top)/(r.height + v)));
}
function revealList(items, t){
  const n=items.length, step=1/n;
  items.forEach((el,i)=>{
    const start=i*step;
    const local=(t - start)/step;
    const clamped=Math.min(1, Math.max(0, local));
    const eased=clamped*clamped*(3-2*clamped);
    el.style.opacity=eased;
    el.style.transform=`translateY(${24 - 24*eased}px) scale(${0.98 + 0.02*eased})`;
  });
}
function renderScene(){
  if(!scene) return;
  const p=progress();
  const heroIn = Math.min(1, Math.max(0, (p-0.10)/0.15));
  const heroOut = Math.min(1, Math.max(0, (p-0.60)/0.12));
  heroImg.style.opacity = String(heroIn * (1 - heroOut));
  heroImg.style.transform = `translateY(${6 - 10*heroIn}px) scale(${1.0 - 0.015*heroIn})`;
  revealList(left, Math.min(1, Math.max(0, (p-0.18)/0.42)));
  const tSwap = Math.min(1, Math.max(0, (p-0.60)/0.12));
  backImg.style.opacity = String(tSwap);
  backImg.style.transform = `translateY(${8 - 8*tSwap}px) scale(${0.985 + 0.015*tSwap})`;
  revealList(right, Math.min(1, Math.max(0, (p-0.68)/0.18)));
  if (p>0.86){
    right.forEach(el=>{ el.style.opacity='1'; el.style.transform='translateY(0) scale(1)'; });
    backImg.style.opacity='1'; backImg.style.transform='translateY(0) scale(1)';
  }
  requestAnimationFrame(renderScene);
}
if(scene) requestAnimationFrame(renderScene);
