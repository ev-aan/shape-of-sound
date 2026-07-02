// ---- SIMPLE MODE: the plain-language front door ----
// One surface (circle of fifths), one sentence, two buttons. No jargon, no controls.
// Boot picks Simple by default; Advanced only if the URL already carries a shared view.
function showSimple(){
  appVisible = false;
  document.getElementById('simpleFront').style.display = '';
  document.getElementById('advancedApp').style.display = 'none';
}
function showAdvanced(){
  appVisible = true;
  document.getElementById('simpleFront').style.display = 'none';
  document.getElementById('advancedApp').style.display = '';
  resize();
  updateCamera();
}
function wireSimpleFront(){
  Surfaces.get('cof').render(document.getElementById('simpleCof'));
  document.getElementById('simpleExplore3d').onclick = () => { showAdvanced(); Modes.enter('science'); setDim('3d'); };
  document.getElementById('simpleAdvanced').onclick = () => { showAdvanced(); Modes.enter('science'); };
  document.getElementById('backToSimpleBtn').onclick = () => showSimple();
}
