// ---- RIPPLE ROOM: a full-screen 3D space, a noise-displaced softly-lit panel as its centerpiece ----
// Its own tiny THREE.js renderer/scene/camera — not a spot inside the chord-map scene, so it
// can be shown from any mode/page, not just while that scene happens to be rendering.
// Still just one shared requestAnimationFrame loop: its per-frame render is one added line
// inside 90_init.js's existing frame(), not a second rAF registration (the test harness's
// stubbed requestAnimationFrame only tracks one callback slot). Continuously animating on its
// own clock, and audio-reactive via lastPlayedAt/lastPlayedFreqs (35_audio.js) — every caller of
// playFreqs anywhere in the app makes this pulse, with no per-call-site wiring.
// show/hideRipple() toggle it from the persistent header (#rippleToggleBtn), reachable anywhere.
//
// A real vertex-displaced shader (not a flat canvas-gradient texture): a subdivided plane whose
// height comes from fractal simplex noise, lit with basic directional shading so relief reads
// through shadow/highlight rather than flat color bands. Pitch shows up as a tint (via
// Palette.noteHue — the same hue math the logo/wheel/every surface already uses) blended into
// the shading, not painted as a dominant rainbow.
const RIPPLE_VERT = `
uniform float uTime;
varying vec3 vNormal;

vec3 permute(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i = 0; i < 4; i++){
    v += a * snoise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}
void main(){
  vec2 seed = position.xy * 0.15 + uTime * 0.12;
  float h = fbm(seed);
  float eps = 0.4;
  float hx = fbm(seed + vec2(eps, 0.0));
  float hy = fbm(seed + vec2(0.0, eps));
  vec3 tangentX = vec3(eps, 0.0, (hx - h) * 3.0);
  vec3 tangentY = vec3(0.0, eps, (hy - h) * 3.0);
  vNormal = normalize(cross(tangentX, tangentY));
  vec3 displaced = position + vec3(0.0, 0.0, h * 3.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;
const RIPPLE_FRAG = `
uniform vec3 uHSL;
uniform float uPulse;
uniform float uOpacity;
varying vec3 vNormal;

vec3 hsl2rgb(vec3 c){
  vec3 rgb = clamp(abs(mod(c.x*6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0*c.z - 1.0));
}
void main(){
  vec3 keyDir = normalize(vec3(-0.4, 0.6, 0.8));
  vec3 fillDir = normalize(vec3(0.5, -0.3, 0.6));
  float key = max(dot(normalize(vNormal), keyDir), 0.0);
  float fill = max(dot(normalize(vNormal), fillDir), 0.0);
  float shade = 0.32 + 0.55 * key + 0.2 * fill;
  vec3 tint = hsl2rgb(vec3(uHSL.x, uHSL.y, 0.5));
  vec3 base = mix(tint * 0.6, vec3(1.0), clamp(shade, 0.0, 1.0));
  base += uPulse * 0.25;
  gl_FragColor = vec4(base, uOpacity);
}
`;
const rippleUniforms = {
  uTime: { value: 0 },
  uHSL: { value: new THREE.Vector3(0, 0.7, 0.5) },
  uPulse: { value: 0 },
  uOpacity: { value: 1 }
};
const rippleMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(44, 44, 64, 64),
  new THREE.ShaderMaterial({ uniforms: rippleUniforms, vertexShader: RIPPLE_VERT, fragmentShader: RIPPLE_FRAG, transparent: true })
);
rippleMesh.visible = false;
const rippleRenderer = new THREE.WebGLRenderer({ canvas: document.getElementById('rippleView'), antialias: true });
rippleRenderer.setPixelRatio(Math.min(devicePixelRatio, 3));
rippleRenderer.setClearColor(0x04050a, 1); // opaque — this is a full room now, not a corner widget blending with the page behind it
const rippleScene = new THREE.Scene();
rippleScene.add(rippleMesh);
const rippleCamera = new THREE.PerspectiveCamera(40, 1, 1, 800);
function resizeRipple(){
  rippleRenderer.setSize(innerWidth, innerHeight);
  rippleCamera.aspect = innerWidth / innerHeight;
  rippleCamera.updateProjectionMatrix();
}
addEventListener('resize', resizeRipple);
resizeRipple();
let rippleClock = 0, ripplePc = 0, rippleRoomBuilt = false, rippleReflectionUniforms = null;
// whether the room is on screen at all — separate from rippleMesh.visible, which now only means
// "the noise panel is the object currently showing" (false while a Shadertoy shader is mounted
// instead, even though the room itself is still open)
let rippleRoomOpen = false;
// 'room' (the noise-displaced panel below) or 'shader' (a pasted Shadertoy shader, mounted onto
// the same plane in the same room — see 33_shadertoy.js, which reads/writes this shared variable)
let rippleMode = 'room';
function renderRippleFrame(dt){
  if(rippleMode === 'shader'){
    rippleMesh.visible = false;
    shaderToyMesh.visible = true;
    updateShaderToy(dt);
  } else {
    rippleMesh.visible = true;
    shaderToyMesh.visible = false;
    updateRipple(dt);
  }
  rippleRenderer.render(rippleScene, rippleCamera);
}
// the room's heavier pieces (floor, reflection, fog, the angled camera framing) are built once,
// lazily, the first time the room is actually opened — not at boot, and not refetched, just
// deferred construction, since this is a single offline HTML file with no separate bundle to load
function buildRippleRoom(){
  if(rippleRoomBuilt) return;
  rippleRoomBuilt = true;
  rippleScene.fog = new THREE.FogExp2(0x04050a, 0.006);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 300),
    new THREE.MeshBasicMaterial({ color: 0x0a0c16 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -24;
  rippleScene.add(floor);
  rippleReflectionUniforms = {
    uTime: { value: 0 },
    uHSL: { value: new THREE.Vector3(0, 0.7, 0.5) },
    uPulse: { value: 0 },
    uOpacity: { value: 0.28 }
  };
  const reflection = new THREE.Mesh(
    new THREE.PlaneGeometry(44, 44, 64, 64),
    new THREE.ShaderMaterial({ uniforms: rippleReflectionUniforms, vertexShader: RIPPLE_VERT, fragmentShader: RIPPLE_FRAG, transparent: true })
  );
  reflection.scale.y = -1;
  reflection.position.y = -48;
  rippleScene.add(reflection);
  // the Shadertoy shader mounts onto the same footprint as the noise panel, in the same room —
  // not a fullscreen overlay with its own camera, so it inherits the room's perspective, fog and
  // reflection for free (see 33_shadertoy.js for the mesh/uniforms/wrapper)
  shaderToyMesh.visible = false;
  rippleScene.add(shaderToyMesh);
  rippleCamera.position.set(0, 14, 130);
  rippleCamera.lookAt(0, -8, 0);
}
function updateRipple(dt){
  if(!rippleMesh.visible) return;
  rippleClock += dt;
  rippleUniforms.uTime.value = rippleClock;
  if(lastPlayedFreqs && lastPlayedFreqs.length){
    // 440Hz is A4 (pitch class 9, not 0) — offset the A-relative semitone count so the tint
    // actually matches the note playing, using the app's usual C=0 chromatic numbering
    const semis = Math.round(12*Math.log2(lastPlayedFreqs[0]/440));
    ripplePc = (((semis + 9) % 12) + 12) % 12;
  }
  rippleUniforms.uHSL.value.set(Palette.noteHue(ripplePc), 0.7, 0.5);
  const sinceNote = (performance.now() - lastPlayedAt)/1000;
  rippleUniforms.uPulse.value = Math.max(0, 1 - sinceNote/1.2);
  if(rippleReflectionUniforms){
    rippleReflectionUniforms.uTime.value = rippleUniforms.uTime.value;
    rippleReflectionUniforms.uHSL.value.copy(rippleUniforms.uHSL.value);
    rippleReflectionUniforms.uPulse.value = rippleUniforms.uPulse.value;
  }
}
function showRipple(){
  buildRippleRoom();
  document.getElementById('rippleView').style.display = 'block';
  document.body.classList.add('rippleOpen');
  rippleRoomOpen = true;
  rippleMesh.visible = true;
}
function hideRipple(){
  document.getElementById('rippleView').style.display = 'none';
  document.body.classList.remove('rippleOpen');
  rippleRoomOpen = false;
  rippleMesh.visible = false;
  shaderToyMesh.visible = false;
  // reopening should always start back in the noise room, not wherever a previous
  // shader-editing session left off
  rippleMode = 'room';
  const panel = document.getElementById('shaderToyPanel'); if(panel) panel.style.display = 'none';
}
document.getElementById('rippleToggleBtn').onclick = () => { rippleRoomOpen ? hideRipple() : showRipple(); };
document.getElementById('rippleRoomClose').onclick = hideRipple;
// rippleReflectionUniforms is reassigned by buildRippleRoom (starts null), so a plain __api
// reference would only ever capture its boot-time value — expose it live via a getter instead
function getRippleReflectionUniforms(){ return rippleReflectionUniforms; }
function isRippleRoomBuilt(){ return rippleRoomBuilt; }
function isRippleRoomOpen(){ return rippleRoomOpen; }
