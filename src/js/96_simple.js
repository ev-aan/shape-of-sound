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
  Link.writeHomePath();
}
function showAdvanced(){
  appVisible = true;
  document.getElementById('simpleFront').style.display = 'none';
  document.getElementById('advancedApp').style.display = '';
  resize();
  updateCamera();
}

// ---- decorative living field: a dense bundle of flowing sound-wave lines + a magnetic cursor ----
// Not pixel-tested (this app's canvas test stub has no getImageData) — same tier as the 3D
// scene's own rendering, which isn't logic-tested either. The one piece of this hero that's
// actually interactive (the note wheel) is a real SVG surface below, which IS tested.
// Many thin parallel traces share the same two-term sine field (phased by each line's own
// baseline Y, not independently randomized), so neighbouring lines stay correlated and the whole
// bundle reads as one flowing sheet — literally "the shape of sound" — rather than a scatter of
// unrelated wiggles. The cursor bends and brightens whichever lines pass near it.
let heroBuilt = false;
let heroCanvas, heroCtx, heroW = 0, heroH = 0, heroDPR = 1;
let heroPmx = 0, heroPmy = 0, heroT = 0;
let heroMx = 0, heroMy = 0, heroRx = 0, heroRy = 0;
const heroReduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const HERO_WAVE_LINES = 46, HERO_WAVE_STEP = 6;

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
  positionHeroWheel();
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
  heroT += reduced ? 0 : dt*0.35;
  heroCtx.clearRect(0, 0, heroW, heroH);
  heroDrawWaves(reduced);
}
// a slow, continuous drift through the same hue space every note colour lives in (01_palette.js) —
// not stepping through discrete pitch classes, just an ambient wash so the background never
// clashes with whatever note colours the wheel itself is showing
function heroDrawWaves(reduced){
  const hue = (heroT*0.012) % 1;
  const mx = heroPmx, my = heroPmy;
  for(let i=0;i<HERO_WAVE_LINES;i++){
    const k = i/(HERO_WAVE_LINES-1);
    const baseY = heroH*0.05 + k*heroH*0.9;
    const vProx = reduced ? 0 : Math.exp(-((baseY-my)*(baseY-my))/(2*220*220));
    heroCtx.beginPath();
    for(let x=0; x<=heroW; x+=HERO_WAVE_STEP){
      let y = baseY
        + 24*Math.sin(x*0.0026 + heroT*0.55 + baseY*0.012)
        + 11*Math.sin(x*0.0062 - heroT*0.38 + baseY*0.021);
      if(!reduced){
        const dx = x-mx, hProx = Math.exp(-(dx*dx)/(2*140*140));
        y += vProx*hProx*54*Math.sin(dx*0.045 - heroT*3.2);
      }
      if(x===0) heroCtx.moveTo(x,y); else heroCtx.lineTo(x,y);
    }
    const edgeFade = Math.min(1, k*7, (1-k)*7); // soften the first/last few lines in from the top/bottom edge
    const glow = vProx*0.16; // brighten whichever lines the cursor is nearest to
    heroCtx.strokeStyle = 'hsla('+Math.round(hue*360)+',60%,64%,'+(0.045+edgeFade*0.09+glow)+')';
    heroCtx.lineWidth = 1;
    heroCtx.stroke();
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

// ---- magnetic hover: small DOM targets (button/arrow) nudge toward the cursor as it nears ----
// One delegated listener per container rather than one per target — cheap, and immune to targets
// being replaced by a re-render (nothing here currently re-renders, but it's the same reasoning
// behind every other delegated listener in this file).
function wireMagnetic(el, opts){
  if(!el) return;
  const strength = (opts && opts.strength) ?? 0.35, max = (opts && opts.max) ?? 10, baseX = (opts && opts.baseX) || 0;
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    let dx = (e.clientX - (r.left+r.width/2)) * strength;
    let dy = (e.clientY - (r.top+r.height/2)) * strength;
    dx = Math.max(-max, Math.min(max, dx)); dy = Math.max(-max, Math.min(max, dy));
    el.style.transform = 'translate('+(dx+baseX).toFixed(1)+'px,'+dy.toFixed(1)+'px)';
  });
  el.addEventListener('pointerleave', () => { el.style.transform = ''; });
}
// the row arrow already slid 10px right on :hover via CSS — folded that baseline shift in here
// (baseX) instead of leaving it in CSS, since the inline style this sets on every pointermove
// would otherwise fight the CSS rule for the same transform property.
function wireHeroRowMagnetic(){
  const rows = document.getElementById('heroRows');
  if(!rows) return;
  rows.addEventListener('pointermove', e => {
    const row = e.target.closest('.heroRow'); if(!row) return;
    const arrow = row.querySelector('.heroRowArrow'); if(!arrow) return;
    const r = arrow.getBoundingClientRect();
    let dx = (e.clientX - (r.left+r.width/2)) * 0.3, dy = (e.clientY - (r.top+r.height/2)) * 0.3;
    dx = Math.max(-8, Math.min(8, dx)); dy = Math.max(-8, Math.min(8, dy));
    arrow.style.transform = 'translate('+(dx+10).toFixed(1)+'px,'+dy.toFixed(1)+'px)';
  });
  rows.addEventListener('pointerleave', () => {
    rows.querySelectorAll('.heroRowArrow').forEach(a => { a.style.transform = ''; });
  });
}
// same delegation idea for the wheel's notes — magnetism applies to the <g> wrapper, leaving the
// existing CSS hover-scale on the child <circle> alone (they compose, one transform each).
// Screen-space offsets are converted into the SVG's own user-space units (viewBox is always
// 0 0 300 300 for every cof-family surface) so the pull looks the same size regardless of how
// large this particular wheel is rendered.
function wireWheelMagnetic(container){
  if(!container) return;
  let activeNote = null;
  container.addEventListener('pointermove', e => {
    const g = e.target.closest && e.target.closest('.cofNote');
    if(activeNote && activeNote !== g) activeNote.style.transform = '';
    if(!g){ activeNote = null; return; }
    activeNote = g;
    const svg = g.closest('svg'); if(!svg) return;
    const svgRect = svg.getBoundingClientRect();
    const scale = svgRect.width ? 300/svgRect.width : 1;
    const r = g.getBoundingClientRect();
    let dx = (e.clientX - (r.left+r.width/2)) * 0.35, dy = (e.clientY - (r.top+r.height/2)) * 0.35;
    dx = Math.max(-8, Math.min(8, dx)); dy = Math.max(-8, Math.min(8, dy));
    g.style.transform = 'translate('+(dx*scale).toFixed(1)+'px,'+(dy*scale).toFixed(1)+'px)';
  });
  container.addEventListener('pointerleave', () => {
    if(activeNote){ activeNote.style.transform = ''; activeNote = null; }
  });
}

// ---- scroll parallax: the wheel lags behind the natural scroll speed, reading as "further back"
// as the hero scrolls past — a direct 1:1 scroll->transform mapping, deliberately with no CSS
// transition (a lagged transition here would fight the scroll instead of tracking it).
function wireHeroParallax(){
  const front = document.getElementById('simpleFront'), wheel = document.getElementById('heroWheel');
  if(!front || !wheel) return;
  front.addEventListener('scroll', () => {
    wheel.style.transform = 'translateY('+(front.scrollTop*0.3).toFixed(1)+'px)';
  }, { passive: true });
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
  wireHeroRowMagnetic();
  wireWheelMagnetic(document.getElementById('heroWheel'));
  wireHeroParallax();
  wireMagnetic(document.getElementById('heroCta'), { baseX: 4, max: 12 });
  document.getElementById('heroCta').onclick = () => { showAdvanced(); switchMode('science'); };
}
