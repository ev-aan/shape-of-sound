// ---- RIPPLE PANEL: a noise-displaced, softly-lit surface, tinted by pitch ----
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
varying vec3 vNormal;

vec3 hsl2rgb(vec3 c){
  vec3 rgb = clamp(abs(mod(c.x*6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0*c.z - 1.0));
}
void main(){
  vec3 lightDir = normalize(vec3(-0.4, 0.6, 0.8));
  float diff = max(dot(normalize(vNormal), lightDir), 0.0);
  float shade = 0.35 + 0.65 * diff;
  vec3 tint = hsl2rgb(vec3(uHSL.x, uHSL.y, 0.5));
  vec3 base = mix(tint * 0.6, vec3(1.0), shade);
  base += uPulse * 0.25;
  gl_FragColor = vec4(base, 1.0);
}
`;
const rippleUniforms = {
  uTime: { value: 0 },
  uHSL: { value: new THREE.Vector3(0, 0.7, 0.5) },
  uPulse: { value: 0 }
};
const rippleMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30, 48, 48),
  new THREE.ShaderMaterial({ uniforms: rippleUniforms, vertexShader: RIPPLE_VERT, fragmentShader: RIPPLE_FRAG })
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
}
function showRipple(){ document.getElementById('rippleView').style.display = 'block'; rippleMesh.visible = true; }
function hideRipple(){ document.getElementById('rippleView').style.display = 'none'; rippleMesh.visible = false; }
document.getElementById('rippleToggleBtn').onclick = () => { rippleMesh.visible ? hideRipple() : showRipple(); };
