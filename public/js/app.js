// Footer year
const y=document.getElementById('year'); if (y) y.textContent=String(new Date().getFullYear());

const scene=document.querySelector('.scene');
const imgs=[...document.querySelectorAll('.device-stage .device')]; // 0,1,2
const blocks=[...document.querySelectorAll('.copy .block')];       // 0,1,2

const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t); // smoothstep

function progress(){
  const r=scene.getBoundingClientRect(), v=innerHeight;
  return clamp((v - r.top)/(r.height + v));
}

// Phase helper with tiny 0.05 crossfade band
function phase(p){
  const aEnd=0.40, bEnd=0.80; // 0-0.4, 0.4-0.8, 0.8-1.0
  if (p < aEnd) return 0;
  if (p < bEnd) return 1;
  return 2;
}
function band(p, start, end, band=0.05){
  // returns 0..1 when p is within [start, start+band] or [end-band, end] for crossfade edges
  if (p < start) return 0;
  if (p > end) return 1;
  if (p < start + band) return smooth((p-start)/band);
  if (p > end - band) return smooth(1 - (p - (end-band))/band);
  return 1;
}

function render(){
  const p=progress();
  const aEnd=0.40, bEnd=0.80;

  // Images: crossfade only near boundaries for clarity
  const tA = band(p, 0.00, aEnd, 0.06); // img0 dominance
  const tB = band(p, aEnd, bEnd, 0.06); // img1 dominance
  const tC = band(p, bEnd, 1.00, 0.06); // img2 dominance

  imgs[0].style.opacity = String(tA);
  imgs[0].style.transform = `translateY(${lerp(8,-4,1-tA)}px) scale(${lerp(1.0,0.98,1-tA)})`;

  imgs[1].style.opacity = String(tB);
  imgs[1].style.transform = `translateY(${lerp(12,-6,1-tB)}px) scale(${lerp(0.99,1.0,1-tB)})`;

  imgs[2].style.opacity = String(tC);
  imgs[2].style.transform = `translateY(${lerp(16,0,1-tC)}px) scale(${lerp(0.98,1.0,1-tC)})`;

  // Text: only one block visible per phase, with a small fade at the edges
  const ph = phase(p);
  blocks.forEach((b,i)=>b.classList.toggle('show', i===ph));

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
