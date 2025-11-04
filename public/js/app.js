// IntersectionObserver fade-in
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('show'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// Sticky scene pulse demo
const port = document.querySelector('.device-port');
let pulseId;
const pulse = () => {
  let up = true;
  pulseId = setInterval(()=>{
    const w = parseFloat(getComputedStyle(port).width);
    port.style.width = (up ? w + 6 : w - 6) + 'px';
    if (w > 360) up = false;
    if (w < 300) up = true;
  }, 50);
};
const stopPulse = ()=> { clearInterval(pulseId); port.style.width='320px'; };
const stickyObs = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if (e.isIntersecting) pulse(); else stopPulse();
  });
},{threshold:0.6});
stickyObs.observe(document.querySelector('.scene')); 

// Footer year
const y = document.getElementById('year');
if (y) y.textContent = String(new Date().getFullYear());
