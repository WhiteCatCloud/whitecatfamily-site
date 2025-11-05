// Footer year
const y=document.getElementById('year'); if (y) y.textContent=String(new Date().getFullYear());

const scene=document.querySelector('.scene');
const imgs=[...document.querySelectorAll('.device-stage .device')]; // img0, img1, img2
const blocks=[...document.querySelectorAll('.copy .block')]; // b0, b1, b2

const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const lerp=(a,b,t)=>a+(b-a)*t;

// p in [0..1] across scene + scrollspace
function progress(){
  const r=scene.getBoundingClientRect(), v=innerHeight;
  return clamp((v - r.top)/(r.height + v));
}

function sectionT(p, start, end){
  // Map p to 0..1 within [start,end]
  return clamp((p - start)/(end - start));
}

function render(){
  const p = progress();

  // Phases: 0-0.33, 0.33-0.66, 0.66-1.0
  const tA = sectionT(p, 0.00, 0.33);
  const tB = sectionT(p, 0.33, 0.66);
  const tC = sectionT(p, 0.66, 1.00);

  // Images crossfade per phase
  // A: img0 -> img1
  imgs[0].style.opacity = String(1 - tA);
  imgs[0].style.transform = `translateY(${lerp(10,-6,tA)}px) scale(${lerp(1.0,0.98,tA)})`;

  imgs[1].style.opacity = String(tA<1 ? tA : 1 - tB*0.6);
  imgs[1].style.transform = `translateY(${lerp(20,-8,tA)}px) scale(${lerp(0.98,1.0,tA)})`;

  // B/C: img1 -> img2
  imgs[2].style.opacity = String(tB);
  imgs[2].style.transform = `translateY(${lerp(30,0,tB)}px) scale(${lerp(0.97,1.0,tB)})`;

  // Text blocks (only one prominent at a time; each block fades in/out within its phase)
  const showBlock = (idx, t)=>{
    const el = blocks[idx];
    el.style.opacity = t;
    el.style.transform = `translateY(${lerp(16,0,t)}px)`;
  };
  showBlock(0, 1 - tA*1.1);      // A: fade out
  showBlock(1, tA<1 ? tA : 1 - tB); // B: fade in then out
  showBlock(2, tB);              // C: fade in

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
