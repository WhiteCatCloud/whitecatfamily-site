// Footer year
const y=document.getElementById('year'); if (y) y.textContent=String(new Date().getFullYear());

// Intro fade-out starts later (0.08..0.18)
const introSec=document.querySelector('.intro-hero');
const introWrap=document.querySelector('.intro-wrap');
function introProgress(){
  const r=introSec.getBoundingClientRect(), v=innerHeight;
  const t=Math.min(1, Math.max(0, (v - r.top)/v)); // 0 at top, 1 when bottom hits top
  return t;
}
function renderIntro(){
  const t=introProgress();
  const start=0.08, end=0.18;
  let o=1;
  if (t<=start) o=1;
  else if (t>=end) o=0;
  else o=1 - (t-start)/(end-start);
  introWrap.style.opacity=String(o);
  introWrap.style.transform=`translateY(${(1-o)*-12}px)`;
  requestAnimationFrame(renderIntro);
}
requestAnimationFrame(renderIntro);

// Sticky scene logic
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

  // HERO appears 0.12..0.28; holds until swap
  const heroIn = clamp((p-0.12)/0.16);
  const heroOut = clamp((p-0.58)/0.12); // later swap band 0.58..0.70
  hero.style.opacity = String(heroIn * (1 - heroOut));
  hero.style.transform = `translateY(${lerp(6,-4,heroIn)}px) scale(${lerp(1.0,.985,heroIn)})`;

  // Left reveals 0.20..0.58
  revealList(left, clamp((p-0.20)/0.38));

  // Swap to BACK 0.58..0.70
  const tSwap = clamp((p-0.58)/0.12);
  back.style.opacity = String(tSwap);
  back.style.transform = `translateY(${lerp(8,0,tSwap)}px) scale(${lerp(.985,1.0,tSwap)})`;

  // Right reveals 0.70..0.96
  revealList(right, clamp((p-0.70)/0.26));

  requestAnimationFrame(renderScene);
}
requestAnimationFrame(renderScene);
