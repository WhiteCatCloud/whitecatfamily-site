
document.addEventListener('DOMContentLoaded',()=>{const y=document.getElementById('year');if(y)y.textContent=new Date().getFullYear();});
// Toggle product subnav
(function(){const p=[...document.querySelectorAll('.nav a')].find(a=>a.textContent.trim().toLowerCase()==='product');if(!p)return;p.addEventListener('click',e=>{e.preventDefault();document.body.classList.toggle('show-subnav');scrollTo({top:0,behavior:'smooth'});});})();
// Intro fade + reveal
(function(){
  const intro=document.querySelector('.intro-full'); if(intro){const wrap=intro.querySelector('.intro-wrap'); const onS=()=>{const r=intro.getBoundingClientRect();const vh=innerHeight;const t=Math.min(1,Math.max(0,(vh-r.top)/vh)); if(t>0.12) wrap.classList.add('dim'); else wrap.classList.remove('dim');}; onS(); addEventListener('scroll',onS,{passive:true});}
  const rev=document.querySelectorAll('.reveal'); const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('show')}),{threshold:.15}); rev.forEach(el=>io.observe(el));
})();
// AX3000 scene
(function(){
  const scene=document.querySelector('.scene'); if(!scene) return;
  const items=[...scene.querySelectorAll('.h-item')];
  const hero=scene.querySelector('img.hero'); const back=scene.querySelector('img.back');
  const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('show');});},{threshold:.4}); items.forEach(i=>io.observe(i));
  function fade(){const rect=scene.getBoundingClientRect();const vh=innerHeight;const p=(vh-rect.top)/(rect.height);const front=Math.max(0,1-(p*2-0.2));const b=Math.max(0,(p*2-0.2)); if(hero){hero.style.opacity=Math.min(1,Math.max(0,front)); if(front>0.02) hero.classList.add('visible');} if(back){back.style.opacity=Math.min(1,Math.max(0,b)); if(b>0.02) back.classList.add('visible');}}
  addEventListener('scroll',fade,{passive:true}); fade();
})();
