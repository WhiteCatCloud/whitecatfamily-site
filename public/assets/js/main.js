
document.addEventListener('DOMContentLoaded', () => {
  const els = document.querySelectorAll('.card, .hero h1, .hero p, .illus img, .plan, .page-hero.small h1');
  const reveal = () => {
    const h = window.innerHeight * 0.9;
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < h) el.classList.add('reveal');
    });
  };
  reveal();
  window.addEventListener('scroll', reveal);
});
