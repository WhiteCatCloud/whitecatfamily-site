const y=document.getElementById('year'); if (y) y.textContent=String(new Date().getFullYear());

const scene=document.querySelector('.scene');
const left=[...document.querySelectorAll('.left .h-item')];
const right=[...document.querySelectorAll('.right .h-item')];
const hero=document.querySelector('.device.hero');
const back=document.querySelector('.device.back');
const intro=document.querySelector('.intro');

const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);

function progress(){
  const r=scene.getBoundingClientRect(), v=innerHeight;
  return clamp((v - r.top)/(r.height + v));
}

// Reveal list smoothly with stagger
function revealList(items, t){
  const n=items.length, step=1/n;
  items.forEach((el,i)=>{
    const start = i*step;
    const local = smooth(clamp((t - start)/step));
    el.style.opacity = local;
    el.style.transform = `translateY(${lerp(24,0,local)}px) scale(${lerp(.98,1,local)})`;
  });
}

function render(){
  const p=progress();
  // Phases:
  // 0..0.12 : Intro title
  // 0.12..0.5 : Fade in HERO and reveal left
  // 0.5 swap band (0.44..0.56) : HERO -> BACK
  // 0.56..0.92 : Reveal right on BACK
  // 0.92..1 : tail before release

  const tIntro = clamp(p/0.12);
  intro.style.opacity = String(1 - clamp((p-0.06)/0.06)); // fade out around 0.06..0.12

  // HERO presence
  const tHeroIn = clamp((p-0.12)/0.15);
  hero.style.opacity = String(tHeroIn * (1 - clamp((p-0.44)/0.12))); // fade in then start fading at 0.44..0.56
  hero.style.transform = `translateY(${lerp(6,-4,tHeroIn)}px) scale(${lerp(1.0,.985,tHeroIn)})`;

  // Left highlights during 0.12..0.5
  const tLeft = clamp((p-0.12)/(0.38));
  revealList(left, tLeft);

  // Swap band around 0.5
  const tSwap = clamp((p-0.44)/0.12); // 0 at 0.44, 1 at 0.56
  back.style.opacity = String(tSwap);
  back.style.transform = `translateY(${lerp(8,0,tSwap)}px) scale(${lerp(.985,1.0,tSwap)})`;

  // Right highlights during 0.56..0.92
  const tRight = clamp((p-0.56)/(0.36));
  revealList(right, tRight);

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
