// ---- SHADERTOY LOADER: paste raw Shadertoy GLSL, run it as a second ripple-room mode ----
// Shadertoy.com shaders are just a mainImage(out vec4 fragColor, in vec2 fragCoord) function
// plus a handful of standard uniforms (iTime, iResolution, iMouse, ...) — this wraps any pasted
// shader with those uniforms and a fullscreen quad, so shaders copied straight from shadertoy.com
// just work here, the same idea as the pygfx/shadertoy Python tool but native to this app's own
// three.js renderer (see 32_ripple.js, whose renderRippleFrame() branches into this mode).
const SHADERTOY_VERT = `
void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }
`; // clip-space coords directly, no camera math — a 2x2 plane exactly fills the screen this way
function wrapShadertoyGLSL(source){
  return `
precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int iFrame;
uniform vec4 iMouse;
uniform vec4 iDate;
${source}
void main(){ mainImage(gl_FragColor, gl_FragCoord.xy); }
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
  new THREE.PlaneGeometry(2, 2),
  new THREE.ShaderMaterial({ uniforms: shaderToyUniforms, vertexShader: SHADERTOY_VERT, fragmentShader: wrapShadertoyGLSL(CINESHADER_RIPPLE_EXAMPLE) })
);
const shaderToyScene = new THREE.Scene();
shaderToyScene.add(shaderToyMesh);
const shaderToyCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); // unused by the shader itself, three.js just requires *a* camera object
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
document.getElementById('shaderToySource').value = CINESHADER_RIPPLE_EXAMPLE;
document.getElementById('shaderToyOpenBtn').onclick = () => {
  document.getElementById('shaderToyPanel').style.display = 'block';
};
document.getElementById('shaderToyRunBtn').onclick = () => {
  const result = loadShadertoy(document.getElementById('shaderToySource').value);
  document.getElementById('shaderToyError').textContent = result.ok ? '' : result.error;
};
document.getElementById('shaderToyBackBtn').onclick = () => {
  rippleMode = 'room';
  document.getElementById('shaderToyPanel').style.display = 'none';
  document.getElementById('shaderToyError').textContent = '';
};
