// ---- RIPPLE PANEL: sound as concentric rings, colored by pitch, radiating outward ----
// A standalone mesh in the same scene/camera/renderer that already draws the chord map (see
// 00_core.js) — not a second WebGL context, and no second requestAnimationFrame loop (its
// per-frame update is one added line inside 90_init.js's existing frame()). Continuously
// animating on its own clock, and audio-reactive via lastPlayedAt/lastPlayedFreqs (35_audio.js)
// — every caller of playFreqs anywhere in the app makes this pulse, with no per-call-site wiring.
// show/hideRipple() toggle it, so it can be called from anywhere, not just one mode.
const RIPPLE_SIZE = 256;
const rippleCanvas = document.createElement('canvas');
rippleCanvas.width = rippleCanvas.height = RIPPLE_SIZE;
const rippleCtx = rippleCanvas.getContext('2d');
const rippleTexture = new THREE.CanvasTexture(rippleCanvas);
const rippleMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(48, 48),
  new THREE.MeshBasicMaterial({ map: rippleTexture, transparent: true, opacity: 0.92, depthWrite: false })
);
rippleMesh.visible = false;
rippleMesh.position.set(90, 40, -20); // off to the side of the chord cluster — tuned live against the actual camera framing
scene.add(rippleMesh);
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
function showRipple(){ rippleMesh.visible = true; drawRipple(); }
function hideRipple(){ rippleMesh.visible = false; }
document.getElementById('sciRippleBtn').onclick = () => { rippleMesh.visible ? hideRipple() : showRipple(); };
