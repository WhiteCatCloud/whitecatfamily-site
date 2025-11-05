// Footer year
const y = document.getElementById('year'); if (y) y.textContent = String(new Date().getFullYear());

const scene = document.querySelector('.scene');
const imgs = [document.querySelector('.img0'), document.querySelector('.img1'), document.querySelector('.img2')];
const lines0 = Array.from(document.querySelectorAll('.l0'));
const lines1 = Array.from(document.querySelectorAll('.l1'));
const lines2 = Array.from(document.querySelectorAll('.l2'));

function lerp(a,b,t){ return a + (b-a)*t; }
function clamp(x, a=0, b=1){ return Math.min(b, Math.max(a, x)); }

function progress(){
  const rect = scene.getBoundingClientRect();
  const view = window.innerHeight;
  const total = rect.height + view;
  return clamp((view - rect.top) / total);
}

function show(els, t){
  els.forEach(el => {
    el.style.opacity = t;
    el.style.transform = `translateY(${lerp(18,0,t)}px)`;
  });
}

function render(){
  const p = progress();
  // Image crossfade
  const t1 = clamp(p / 0.45);
  const t2 = clamp((p - 0.45) / 0.45);

  imgs[0].style.opacity = String(1 - t1);
  imgs[0].style.transform = `translateY(${lerp(10, -6, t1)}px) scale(${lerp(1.0, 0.98, t1)})`;

  imgs[1].style.opacity = String(p<0.45 ? t1 : 1 - t2*0.4);
  imgs[1].style.transform = `translateY(${lerp(20, -8, t1)}px) scale(${lerp(0.98, 1.0, t1)})`;

  imgs[2].style.opacity = String(t2);
  imgs[2].style.transform = `translateY(${lerp(30, 0, t2)}px) scale(${lerp(0.97, 1.0, t2)})`;

  // Text
  show(lines0, clamp(1 - t1*1.1));
  show(lines1, clamp(p<0.45 ? t1 : 1 - t2));
  show(lines2, t2);

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
