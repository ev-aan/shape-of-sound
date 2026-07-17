// ---- RIPPLE PANEL: sound as concentric rings, colored by pitch, radiating outward ----
// Its own tiny THREE.js renderer/scene/camera — not a spot inside the chord-map scene anymore,
// so it can be shown from any mode/page, not just while that scene happens to be rendering.
// Still just one shared requestAnimationFrame loop: its per-frame render is one added line
// inside 90_init.js's existing frame(), not a second rAF registration (the test harness's
// stubbed requestAnimationFrame only tracks one callback slot). Continuously animating on its
// own clock, and audio-reactive via lastPlayedAt/lastPlayedFreqs (35_audio.js) — every caller of
// playFreqs anywhere in the app makes this pulse, with no per-call-site wiring.
// show/hideRipple() toggle it from the persistent header (#rippleToggleBtn), reachable anywhere.
const RIPPLE_SIZE = 256;
const rippleCanvas = document.createElement('canvas');
rippleCanvas.width = rippleCanvas.height = RIPPLE_SIZE;
const rippleCtx = rippleCanvas.getContext('2d');
const rippleTexture = new THREE.CanvasTexture(rippleCanvas);
const rippleMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshBasicMaterial({ map: rippleTexture, transparent: true, opacity: 0.92, depthWrite: false })
);
rippleMesh.visible = false;
const rippleRenderer = new THREE.WebGLRenderer({ canvas: document.getElementById('rippleView'), antialias: true, alpha: true });
rippleRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
rippleRenderer.setSize(160, 160);
const rippleScene = new THREE.Scene();
rippleScene.add(rippleMesh);
const rippleCamera = new THREE.PerspectiveCamera(40, 1, 1, 500);
rippleCamera.position.set(0, 0, 60);
let rippleClock = 0, ripplePc = 0;
// reuses Palette.noteCss — the same "a note keeps its colour everywhere" system the logo, the
// wheel, and every other surface already use, so the rings are the app's real 12-tone palette,
// not an arbitrary rainbow like the gallery photo this was modeled on.
function drawRipple(){
  const cx = RIPPLE_SIZE/2, cy = RIPPLE_SIZE/2, maxR = RIPPLE_SIZE/2;
  const sinceNote = (performance.now() - lastPlayedAt)/1000;
  const pulse = Math.max(0, 1 - sinceNote/1.2); // briefly brightens right after a note plays
  const g = rippleCtx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  const stops = 12, cycle = Math.floor(rippleClock*3);
  for(let i=0; i<=stops; i++){
    const pc = (ripplePc + i + cycle) % 12;
    g.addColorStop(i/stops, Palette.noteCss(pc, 0.75, 0.3 + 0.25*pulse));
  }
  rippleCtx.fillStyle = g;
  rippleCtx.fillRect(0, 0, RIPPLE_SIZE, RIPPLE_SIZE);
  rippleTexture.needsUpdate = true;
}
function updateRipple(dt){
  if(!rippleMesh.visible) return;
  rippleClock += dt;
  if(lastPlayedFreqs && lastPlayedFreqs.length){
    const semis = Math.round(12*Math.log2(lastPlayedFreqs[0]/440));
    ripplePc = ((semis % 12) + 12) % 12;
  }
  drawRipple();
}
function showRipple(){ document.getElementById('rippleView').style.display = 'block'; rippleMesh.visible = true; drawRipple(); }
function hideRipple(){ document.getElementById('rippleView').style.display = 'none'; rippleMesh.visible = false; }
document.getElementById('rippleToggleBtn').onclick = () => { rippleMesh.visible ? hideRipple() : showRipple(); };
