// ---- DIM: 2D <-> 3D dimension switching (orthographic vs perspective camera) ----
// The scene stays identical; only the camera changes.
// 3D: orbit with drag; 2D: top-down orthographic, no orbit, drag/wheel = pan/zoom (existing behaviour).
function setDim(mode){
  camera = (mode === '2d') ? camera2D : camera3D;
  resize();
  updateCamera();
  document.querySelectorAll('#dimToggle button').forEach(b => b.classList.toggle('on', b.dataset.dim === mode));
  View.set({ dim: mode });
}
function wireDimToggle(){
  const bar = document.getElementById('dimToggle');
  if(!bar) return;
  bar.addEventListener('click', e => {
    const b = e.target.closest('button[data-dim]'); if(!b) return;
    setDim(b.dataset.dim);
  });
}
