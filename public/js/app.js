// Build year
const y = document.getElementById('year'); if (y) y.textContent = String(new Date().getFullYear());

// Scrollytelling state
const steps = Array.from(document.querySelectorAll('.step'));
const lines = Array.from(document.querySelectorAll('.copy .line'));
const imgs = {
  0: document.querySelector('.img-base'),
  1: document.querySelector('.img-front'),
  2: document.querySelector('.img-front'), // keep front, change copy
  3: document.querySelector('.img-io')
};

// Ensure base visible initially
imgs[0]?.classList.add('show');
lines.filter(l=>l.dataset.step==='0').forEach(l=>l.classList.add('show'));

let current = 0;
const activate = (i)=>{
  if (i===current) return;
  current = i;
  // fade images
  Object.values(imgs).forEach(el=>el && el.classList.remove('show'));
  (imgs[i]||imgs[0])?.classList.add('show');
  // text
  lines.forEach(l=>l.classList.remove('show'));
  lines.filter(l=>l.dataset.step===String(i)).forEach(l=>l.classList.add('show'));
};

const io = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if (e.isIntersecting){
      activate(Number(e.target.dataset.step));
    }
  });
}, {rootMargin:'-30% 0px -50% 0px', threshold:0.01});

steps.forEach(s=>io.observe(s));
