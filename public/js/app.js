// Footer year
const y = document.getElementById('year'); if (y) y.textContent = String(new Date().getFullYear());

// Continuous scroll progress from 0..1 across the scene + scrollspace
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
  // When scene top hits bottom => 0; when scene bottom hits top => 1
  const total = rect.height + view;
  const p = clamp((view - rect.top) / total);
  return p;
}

function render(){
  const p = progress();

  // Image crossfade ranges
  // 0.00..0.45 : img0 -> img1
  // 0.45..0.90 : img1 -> img2
  const t1 = clamp(p / 0.45);
  const t2 = clamp((p - 0.45) / 0.45);

  // base
  imgs[0].style.opacity = String(1 - t1);
  imgs[0].style.transform = `translateY(${lerp(10, -6, t1)}px) scale(${lerp(1.0, 0.98, t1)})`;

  // mid
  imgs[1].style.opacity = String(p<0.45 ? t1 : 1 - t2*0.4);
  imgs[1].style.transform = `translateY(${lerp(20, -8, t1)}px) scale(${lerp(0.98, 1.0, t1)})`;

  // final
  imgs[2].style.opacity = String(t2);
  imgs[2].style.transform = `translateY(${lerp(30, 0, t2)}px) scale(${lerp(0.97, 1.0, t2)})`;

  // Text crossfades
  const show = (els, t)=> els.forEach(el=>{
    el.style.opacity = t;
    el.style.transform = `translateY(${lerp(18,0,t)}px)`;
  });
  show(lines0, clamp(1 - t1*1.1));
  show(lines1, clamp(p<0.45 ? t1 : 1 - t2));
  show(lines2, t2);

  requestAnimationFrame(render);
}
requestAnimationFrame(render);
