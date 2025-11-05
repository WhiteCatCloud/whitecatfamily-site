const y=document.getElementById('year'); if (y) y.textContent=String(new Date().getFullYear());

const scene=document.querySelector('.scene');
const leftItems=[...document.querySelectorAll('.left .h-item')];
const rightItems=[...document.querySelectorAll('.right .h-item')];
const front=document.querySelector('.device.front');
const back=document.querySelector('.device.back');

const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);

function progress(){
  const r=scene.getBoundingClientRect(), v=innerHeight;
  return clamp((v - r.top)/(r.height + v));
}

// Reveal a list of items sequentially over a range
function revealList(items, t){
  const n = items.length;
  items.forEach((el,i)=>{
    const start = i/n;
    const local = clamp((t - start) * n);
    const e = smooth(local);
    el.style.opacity = e;
    el.style.transform = `translateY(${lerp(16,0,e)}px)`;
  });
}

function render(){
  const p=progress();
  // First half (0..0.5): front view + reveal left
  const tLeft = clamp(p / 0.5);
  revealList(leftItems, tLeft);
  front.style.opacity = String(1 - clamp((p-0.45)/0.1)); // start fading near mid
  back.style.opacity  = String(clamp((p-0.45)/0.1));     // fade in near mid
  front.style.transform = `translateY(${lerp(4,-4,tLeft)}px) scale(${lerp(1.0,0.98,tLeft)})`;
  back.style.transform  = `translateY(${lerp(8,0,tLeft)}px) scale(${lerp(0.98,1.0,tLeft)})`;

  // Second half (0.5..1): back view + reveal right
  const tRight = clamp((p-0.5)/0.5);
  revealList(rightItems, tRight);

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
