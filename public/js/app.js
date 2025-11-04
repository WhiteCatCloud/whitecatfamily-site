// Reveal on scroll
const obs = new IntersectionObserver(es => es.forEach(e=>{
  if (e.isIntersecting) e.target.classList.add('show');
}), {threshold: 0.12});
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// Light parallax for hero image
if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  const p = document.querySelector('.parallax');
  const onScroll = ()=>{
    if (!p) return;
    const r = p.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (window.innerHeight - r.top) / (window.innerHeight + r.height)));
    p.style.transform = `translateY(${(1-t)*-24}px)`;
  };
  addEventListener('scroll', onScroll, {passive:true});
  addEventListener('resize', onScroll);
  onScroll();
}

// Footer year
const y = document.getElementById('year');
if (y) y.textContent = String(new Date().getFullYear());
