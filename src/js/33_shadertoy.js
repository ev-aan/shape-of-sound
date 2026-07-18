// ---- SHADERTOY LOADER: paste raw Shadertoy GLSL, run it as a second ripple-room mode ----
// Shadertoy.com shaders are just a mainImage(out vec4 fragColor, in vec2 fragCoord) function
// plus a handful of standard uniforms (iTime, iResolution, iMouse, ...) — this wraps any pasted
// shader with those uniforms, so shaders copied straight from shadertoy.com just work here, the
// same idea as the pygfx/shadertoy Python tool but native to this app's own three.js renderer
// (see 32_ripple.js, whose renderRippleFrame() branches into this mode).
//
// Mounted onto the same plane the noise room uses (see buildRippleRoom() in 32_ripple.js), through
// the room's own perspective camera — not a fullscreen clip-space quad — so it inherits the room's
// fog/floor/reflection and reads as an object in the space rather than a flat overlay glued to the
// screen. That's why the vertex shader does real projection/modelView math and passes the plane's
// own UV through: the wrapper below maps iResolution-space fragCoord from vUv, not gl_FragCoord, so
// the shader's pattern actually texture-maps onto the tilted surface instead of staying screen-locked.
const SHADERTOY_VERT = `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
function wrapShadertoyGLSL(source){
  return `
precision highp float;
varying vec2 vUv;
uniform vec3 iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int iFrame;
uniform vec4 iMouse;
uniform vec4 iDate;
${source}
void main(){ mainImage(gl_FragColor, vUv * iResolution.xy); }
`;
}
// the built-in example — a classic ripple-and-color-cycle shader, so this feature demos itself
// with zero setup rather than starting on a blank textarea
const CINESHADER_RIPPLE_EXAMPLE = `void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord / iResolution.xy;

    // Calculate the to center distance
    float d = length(uv - 0.5) * 2.0;

    // Calculate the ripple time
    float t = d * d * 25.0 - iTime * 3.0;

    // Calculate the ripple thickness
    d = (cos(t) * 0.5 + 0.5) * (1.0 - d);

    // Time varying pixel color
    vec3 col = 0.5 + 0.5 * cos(t / 20.0 + uv.xyx + vec3(0.0,2.0,4.0));

    // Set the output color to rgb channels and the thickness to alpha channel
    fragColor = vec4(col, d);
}`;
const shaderToyUniforms = {
  iResolution: { value: new THREE.Vector3(1, 1, 1) },
  iTime: { value: 0 },
  iTimeDelta: { value: 0 },
  iFrame: { value: 0 },
  iMouse: { value: new THREE.Vector4(0, 0, 0, 0) },
  iDate: { value: new THREE.Vector4(0, 0, 0, 0) }
};
const shaderToyMesh = new THREE.Mesh(
  // same footprint as the room's noise panel (rippleMesh in 32_ripple.js) so swapping modes
  // doesn't reframe the shot — mounted into rippleScene by buildRippleRoom(), rendered through
  // the room's own rippleCamera, not a scene/camera of its own
  new THREE.PlaneGeometry(44, 44),
  new THREE.ShaderMaterial({ uniforms: shaderToyUniforms, vertexShader: SHADERTOY_VERT, fragmentShader: wrapShadertoyGLSL(CINESHADER_RIPPLE_EXAMPLE) })
);
function loadShadertoy(source){
  if(source.indexOf('mainImage(') === -1){
    return { ok: false, error: 'no mainImage(...) function found — paste a full Shadertoy shader' };
  }
  shaderToyMesh.material = new THREE.ShaderMaterial({ uniforms: shaderToyUniforms, vertexShader: SHADERTOY_VERT, fragmentShader: wrapShadertoyGLSL(source) });
  shaderToyUniforms.iTime.value = 0;
  shaderToyUniforms.iFrame.value = 0;
  rippleMode = 'shader';
  return { ok: true };
}
let shaderToyMouseDown = [0, 0];
function wireShaderToyMouse(){
  const el = document.getElementById('rippleView'); if(!el) return;
  el.addEventListener('pointermove', e => {
    shaderToyUniforms.iMouse.value.x = e.clientX;
    shaderToyUniforms.iMouse.value.y = innerHeight - e.clientY; // Shadertoy's iMouse is bottom-left origin
  });
  el.addEventListener('pointerdown', e => {
    shaderToyMouseDown = [e.clientX, innerHeight - e.clientY];
    shaderToyUniforms.iMouse.value.z = shaderToyMouseDown[0];
    shaderToyUniforms.iMouse.value.w = shaderToyMouseDown[1];
  });
  el.addEventListener('pointerup', () => {
    shaderToyUniforms.iMouse.value.z = 0;
    shaderToyUniforms.iMouse.value.w = 0;
  });
}
wireShaderToyMouse();
function updateShaderToy(dt){
  shaderToyUniforms.iTimeDelta.value = dt;
  shaderToyUniforms.iTime.value += dt;
  shaderToyUniforms.iFrame.value += 1;
  shaderToyUniforms.iResolution.value.set(innerWidth, innerHeight, 1);
}
function getRippleMode(){ return rippleMode; }
// no paste-and-run UI for now (removed per request) — loadShadertoy/getRippleMode/
// CINESHADER_RIPPLE_EXAMPLE stay as reusable, already-tested infrastructure for whenever this
// gets a new entry point (e.g. mounted onto an object inside the room, rather than a fullscreen
// overlay with its own textarea).
