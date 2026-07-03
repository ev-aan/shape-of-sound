// ---- SIMPLE MODE: the plain-language front door ----
// Two cards, one sentence each: Musical (circle of fifths) and Science (a live mini preview of the
// real 3D map, same scene/data as Advanced). Tap a card to go deeper into that lens.
function initSciPreview(){
  const cv = document.getElementById('simpleSciPreview');
  if(!cv) return null;
  const rect = cv.getBoundingClientRect();
  const cssSize = Math.max(160, Math.min(rect.width || 210, 320));
  const buf = Math.round(cssSize * Math.min(devicePixelRatio, 2));
  const rndr = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
  rndr.setSize(buf, buf, false);
  const cam = new THREE.PerspectiveCamera(50, 1, 1, 6000);
  let t = 0.9;
  return {
    frameOnce(dt){
      t += dt * 0.12;
      const r = radius * 1.15, ph = 1.05;
      cam.position.set(tgt.x + r*Math.sin(ph)*Math.cos(t), tgt.y + r*Math.cos(ph), tgt.z + r*Math.sin(ph)*Math.sin(t));
      cam.lookAt(tgt);
      rndr.render(scene, cam);
    }
  };
}
function showSimple(){
  appVisible = false;
  document.getElementById('simpleFront').style.display = '';
  document.getElementById('advancedApp').style.display = 'none';
  if(!sciPreview) sciPreview = initSciPreview();
}
function showAdvanced(){
  appVisible = true;
  document.getElementById('simpleFront').style.display = 'none';
  document.getElementById('advancedApp').style.display = '';
  resize();
  updateCamera();
}
// tap a note: highlight it and its two perfect-fifth neighbours, name the relation in plain language.
// Scoped to this one mounted circle — Musical mode's own instance does something else entirely on tap.
function exploreNeighbours(pc, container){
  container.querySelectorAll('.cofNote').forEach(n => n.classList.remove('sel','near'));
  const g = container.querySelector('.cofNote[data-pc="'+pc+'"]');
  if(g) g.classList.add('sel');
  const up = (pc+7)%12, down = (pc+5)%12;
  container.querySelectorAll('.cofNote').forEach(n => { if(+n.dataset.pc===up || +n.dataset.pc===down) n.classList.add('near'); });
  const cap = container.querySelector('.cofCaption');
  if(cap) cap.textContent = NOTE[pc]+' blends best with '+NOTE[up]+' and '+NOTE[down]+' — a perfect fifth away in either direction.';
}
function wireSimpleFront(){
  Surfaces.get('cof').render(document.getElementById('simpleCof'), { onSelect: exploreNeighbours });
  document.getElementById('simpleMusicalCard').addEventListener('click', e => {
    if(e.target.closest && e.target.closest('.cofNote')) return; // let the note's own tap-to-explore handle it
    showAdvanced(); Modes.enter('musical');
  });
  document.getElementById('simpleScienceCard').addEventListener('click', () => {
    showAdvanced(); Modes.enter('science'); setDim('3d');
  });
  document.getElementById('simpleAdvanced').onclick = () => { showAdvanced(); Modes.enter('science'); };
  document.getElementById('backToSimpleBtn').onclick = () => showSimple();
}
