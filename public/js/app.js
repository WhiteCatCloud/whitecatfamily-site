const y=document.getElementById('year'); if (y) y.textContent=String(new Date().getFullYear());

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

// Reveal list smoothly with stagger and slight scale-up
function revealList(items, t){
  const n=items.length, step=1/n;
  items.forEach((el,i)=>{
    const start=i*step;
    const local=smooth(clamp((t - start)/step));
    el.style.opacity=local;
    el.style.transform=`translateY(${lerp(22,0,local)}px) scale(${lerp(.98,1,local)})`;
  });
}

function render(){
  const p=progress();
  // 0..0.5: show left; prepare swap
  const tLeft=clamp(p/0.5);
  revealList(left,tLeft);

  // Crossfade HERO -> BACK around 0.5 with a 0.12 band
  const band=0.12;
  const f=clamp((p-0.5+band)/band);   // 0 at 0.5-band, 1 at 0.5
  const g=clamp((p-0.5)/band);        // 0 at 0.5, 1 at 0.5+band
  hero.style.opacity=String(1 - g);
  hero.style.transform=`translateY(${lerp(4,-4,tLeft)}px) scale(${lerp(1.0,.985,tLeft)})`;
  back.style.opacity=String(g);
  back.style.transform=`translateY(${lerp(8,0,g)}px) scale(${lerp(.985,1.0,g)})`;

  // 0.5..1: reveal right on back view
  const tRight=clamp((p-0.5)/0.5);
  revealList(right,tRight);

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
