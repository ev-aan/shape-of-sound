// ---- SIMPLE MODE: the Elorah hero front door ----
// A living canvas (drifting ambient particles + a magnetic custom cursor, purely decorative,
// same untested tier as the 3D scene's own rendering) with a real, testable circle-of-fifths
// wheel (the existing 'cof' surface, reused rather than reinvented) layered on top for the
// actual interactive part: hover a note to see its letter, tap it to hear it.
//
// The decorative animation is driven by 90_init.js's single shared frame() loop (its `else`
// branch calls heroFrameStep(dt) whenever !appVisible), not a second independent
// requestAnimationFrame recursion — this app's test harness only holds one rAF callback slot,
// so two competing self-scheduling loops would fight over it and freeze one another.
function showSimple(){
  appVisible = false;
  document.getElementById('simpleFront').style.display = '';
  document.getElementById('advancedApp').style.display = 'none';
  ensureHeroField();
}
function showAdvanced(){
  appVisible = true;
  document.getElementById('simpleFront').style.display = 'none';
  document.getElementById('advancedApp').style.display = '';
  resize();
  updateCamera();
}

// ---- decorative living field: drifting particles + a magnetic cursor ----
// Not pixel-tested (this app's canvas test stub has no getImageData) — same tier as the 3D
// scene's own rendering, which isn't logic-tested either. The one piece of this hero that's
// actually interactive (the note wheel) is a real SVG surface below, which IS tested.
let heroBuilt = false;
let heroCanvas, heroCtx, heroW = 0, heroH = 0, heroDPR = 1;
let heroParticles = [];
let heroPmx = 0, heroPmy = 0, heroT = 0;
let heroMx = 0, heroMy = 0, heroRx = 0, heroRy = 0;
const heroReduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
// Palette.noteCss returns 'hsl(h,s%,l%)' — reuse it (one source of truth for note colour) rather
// than re-deriving the hue formula, just add the alpha channel these faint threads need.
function heroNoteCssA(pc, s, l, a){ return Palette.noteCss(pc, s, l).replace('hsl(', 'hsla(').replace(/\)$/, ','+a+')'); }

function heroResize(){
  if(!heroCanvas) return;
  // .heroHero (the canvas's parent) always spans the full viewport, same as #simpleFront itself —
  // read innerWidth/innerHeight directly rather than parentElement.clientWidth, matching how
  // 00_core.js's own resize() sizes the 3D scene's canvas. clientWidth/clientHeight are read-only
  // getters on a real element (assigning to them throws in strict mode) — CSS already sizes the
  // canvas box to 100%/100%, only the backing bitmap (.width/.height) needs setting below.
  heroW = innerWidth;
  heroH = innerHeight;
  heroDPR = Math.min(devicePixelRatio || 1, 2);
  heroCanvas.width = heroW * heroDPR; heroCanvas.height = heroH * heroDPR;
  heroCtx.setTransform(heroDPR, 0, 0, heroDPR, 0, 0);
  heroBuildParticles();
  positionHeroWheel();
}
function heroBuildParticles(){
  const cx = heroW*0.72, cy = heroH*0.42, R = Math.min(heroW, heroH)*0.24;
  heroParticles = [];
  const n = Math.min(90, Math.floor((heroW*heroH)/16000));
  for(let i=0;i<n;i++){
    const pc = Math.floor(Math.random()*12);
    const ang = Math.random()*Math.PI*2, rad = R*(0.35+Math.random()*1.35);
    heroParticles.push({
      pc, x: cx+Math.cos(ang)*rad, y: cy+Math.sin(ang)*rad,
      vx:(Math.random()-.5)*.15, vy:(Math.random()-.5)*.15,
      r: 1.4+Math.random()*2.2, phase: Math.random()*Math.PI*2
    });
  }
}
// called once per real frame from 90_init.js's frame() whenever !appVisible — which is also true
// in Musical/Lessons mode (they hide the 3D scene too), not only while the front door is showing.
// Skip the work entirely unless #simpleFront is the thing actually on screen.
function heroFrameStep(dt){
  const front = document.getElementById('simpleFront');
  if(!front || front.style.display === 'none') return;
  heroCursorTick();
  if(!heroCanvas) return;
  const reduced = heroReduced();
  heroT += reduced ? 0 : dt*0.48;
  heroCtx.clearRect(0, 0, heroW, heroH);
  const cx = heroW*0.72, cy = heroH*0.42;
  heroParticles.forEach(p => {
    if(!reduced){
      p.x += p.vx + Math.sin(heroT*1.3+p.phase)*0.05;
      p.y += p.vy + Math.cos(heroT*1.1+p.phase)*0.05;
      const dx = p.x-heroPmx, dy = p.y-heroPmy, d2 = dx*dx+dy*dy, R2 = 130*130;
      if(d2 < R2){ const f = (1-d2/R2)*0.9; const d = Math.sqrt(d2)||1; p.x += (dx/d)*f; p.y += (dy/d)*f; }
      if(p.x<-40) p.x=heroW+40; if(p.x>heroW+40) p.x=-40;
      if(p.y<-40) p.y=heroH+40; if(p.y>heroH+40) p.y=-40;
    }
  });
  heroCtx.lineWidth = 1;
  for(let i=0;i<heroParticles.length;i++){
    for(let j=i+1;j<heroParticles.length;j++){
      const a=heroParticles[i], b=heroParticles[j];
      const dx=a.x-b.x, dy=a.y-b.y, d=Math.sqrt(dx*dx+dy*dy);
      if(d < 92){
        const cxm=(a.x+b.x)/2-heroPmx, cym=(a.y+b.y)/2-heroPmy, cd=Math.sqrt(cxm*cxm+cym*cym);
        const near = Math.max(0, 1-cd/260);
        const alpha = (1-d/92) * (0.05 + near*0.22);
        heroCtx.strokeStyle = heroNoteCssA(a.pc, .7, .65, alpha);
        heroCtx.beginPath(); heroCtx.moveTo(a.x,a.y); heroCtx.lineTo(b.x,b.y); heroCtx.stroke();
      }
    }
  }
  heroParticles.forEach(p => {
    heroCtx.beginPath(); heroCtx.fillStyle = Palette.noteCss(p.pc, .75, .68);
    heroCtx.arc(p.x, p.y, p.r, 0, Math.PI*2); heroCtx.fill();
  });
  // faint spokes from the wheel's twelve positions to centre — the wheel itself (the real,
  // interactive part) is the SVG 'cof' surface layered on top, positioned by positionHeroWheel()
  const R = Math.min(heroW, heroH)*0.24;
  for(let i=0;i<12;i++){
    const ang = -Math.PI/2 + i*(2*Math.PI/12);
    const x = cx + R*Math.cos(ang), y = cy + R*Math.sin(ang);
    heroCtx.beginPath(); heroCtx.strokeStyle = 'hsla(0,0%,100%,.08)';
    heroCtx.moveTo(cx, cy); heroCtx.lineTo(x, y); heroCtx.stroke();
  }
}
function ensureHeroField(){
  if(heroBuilt) return;
  heroCanvas = document.getElementById('heroField');
  if(!heroCanvas) return;
  heroCtx = heroCanvas.getContext('2d');
  heroMx = heroRx = innerWidth/2; heroMy = heroRy = innerHeight/2;
  addEventListener('resize', heroResize);
  addEventListener('pointermove', e => {
    heroPmx = e.clientX; heroPmy = e.clientY; heroMx = e.clientX; heroMy = e.clientY;
  });
  heroBuilt = true;
  heroResize();
}

// ---- the custom magnetic cursor (eased-follow, driven by the same heroFrameStep tick) ----
function heroCursorTick(){
  const cursor = document.getElementById('cursor'), ring = document.getElementById('cursorRing');
  if(!cursor || !ring) return;
  cursor.style.transform = 'translate('+heroMx+'px,'+heroMy+'px) translate(-50%,-50%)';
  heroRx += (heroMx-heroRx)*0.16; heroRy += (heroMy-heroRy)*0.16;
  ring.style.transform = 'translate('+heroRx+'px,'+heroRy+'px) translate(-50%,-50%)';
}
function wireHeroCursorHover(){
  const ring = document.getElementById('cursorRing');
  if(!ring) return;
  document.querySelectorAll('#simpleFront .heroRow, #simpleFront a, #simpleFront button').forEach(el => {
    el.addEventListener('pointerenter', () => ring.classList.add('big'));
    el.addEventListener('pointerleave', () => ring.classList.remove('big'));
  });
}

// ---- the interactive note wheel: the real 'cof' surface, not hand-rolled canvas hit-testing ----
function positionHeroWheel(){
  const wheel = document.getElementById('heroWheel');
  if(!wheel) return;
  const cx = heroW*0.72, cy = heroH*0.42, R = Math.min(heroW, heroH)*0.24;
  const size = R*2 + 70; // padding for the note circles + labels sitting outside the ring radius
  wheel.style.width = size+'px'; wheel.style.height = size+'px';
  wheel.style.left = (cx-size/2)+'px'; wheel.style.top = (cy-size/2)+'px';
}
function renderHeroWheel(){
  Surfaces.get('cof').render(document.getElementById('heroWheel'), {
    noteRadius: 28,
    caption: false,
    onSelect: pc => playFreqs([m2f(60+pc)])
  });
}

// ---- the 4 statement rows: one delegated listener, same convention as wireTopbar/switchMode ----
function wireHeroRows(){
  const rows = document.getElementById('heroRows');
  rows.addEventListener('click', e => {
    const r = e.target.closest('.heroRow'); if(!r) return;
    showAdvanced();
    switchMode(r.dataset.mode);
    if(r.dataset.mode === 'science') setDim('3d');
  });
  // IntersectionObserver isn't available in every environment (notably this app's test harness) —
  // fall back to just showing the rows immediately rather than leaving them permanently at
  // opacity:0 waiting for an observer that will never fire.
  const hasIO = typeof IntersectionObserver !== 'undefined';
  const io = hasIO ? new IntersectionObserver(entries => {
    entries.forEach(en => { if(en.isIntersecting) en.target.classList.add('in'); });
  }, { threshold: .2 }) : null;
  document.querySelectorAll('.heroRow').forEach((el, i) => {
    el.style.transitionDelay = (i*0.08)+'s';
    el.style.setProperty('--row-accent', el.dataset.accent);
    if(io) io.observe(el); else el.classList.add('in');
  });
}

function wireSimpleFront(){
  renderHeroWheel();
  wireHeroCursorHover();
  wireHeroRows();
  document.getElementById('heroCta').onclick = () => { showAdvanced(); switchMode('science'); };
  document.getElementById('backToSimpleBtn').onclick = () => showSimple();
}
