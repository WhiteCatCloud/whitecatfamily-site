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

// Sticky scene logic (same timings as before)
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

  const heroIn = clamp((p-0.10)/0.15);
  const heroOut = clamp((p-0.60)/0.12);
  hero.style.opacity = String(heroIn * (1 - heroOut));
  hero.style.transform = `translateY(${lerp(6,-4,heroIn)}px) scale(${lerp(1.0,.985,heroIn)})`;

  revealList(left, clamp((p-0.18)/0.42));

  const tSwap = clamp((p-0.60)/0.12);
  back.style.opacity = String(tSwap);
  back.style.transform = `translateY(${lerp(8,0,tSwap)}px) scale(${lerp(.985,1.0,tSwap)})`;

  revealList(right, clamp((p-0.68)/0.18));

  if (p>0.86){
    right.forEach(el=>{ el.style.opacity='1'; el.style.transform='translateY(0) scale(1)'; });
    back.style.opacity='1'; back.style.transform='translateY(0) scale(1)';
  }

  requestAnimationFrame(renderScene);
}
requestAnimationFrame(renderScene);
