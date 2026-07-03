// ---- MODE: PLAY (keyboard + sequencer, one workspace for building a progression) ----
let playKeyboard = null;

Modes.register('play', {
  label: 'Play',
  panelId: 'playControls',
  onEnter(){
    showMode('play');
    document.getElementById('topbarLabel').textContent = 'Play — build chords on the keyboard, or tap stars on the map';
    applyColors(colorMode);
    setRender(renderMode);
    positionLabels();
    if(!playKeyboard) playKeyboard = Surfaces.get('keyboard').render(document.getElementById('playKeyboard'), { onChange: onPlayNotesChange });
    openCompose();
  },
  onExit(){ closeCompose(); }
});

function matchChord(pcs){
  const want = [...pcs].sort((a,b)=>a-b).join(',');
  for(let i=0;i<N.length;i++){ if(N[i].pcs.slice().sort((a,b)=>a-b).join(',')===want) return i; }
  return null;
}
function onPlayNotesChange(pcs){
  const readout = document.getElementById('playReadout'), addBtn = document.getElementById('playAddBtn');
  if(!pcs.size){ readout.textContent = 'Tap keys to build a chord.'; addBtn.disabled = true; addBtn.dataset.match = ''; return; }
  const names = [...pcs].sort((a,b)=>a-b).map(pc=>NOTE[pc]).join(' + ');
  const match = matchChord(pcs);
  if(match != null){ readout.textContent = names+' — that\'s '+N[match].name+'.'; addBtn.disabled = false; addBtn.dataset.match = match; }
  else { readout.textContent = names+' — keep going, that\'s not a chord we know yet.'; addBtn.disabled = true; addBtn.dataset.match = ''; }
}
function wirePlayControls(){
  document.getElementById('playAddBtn').onclick = () => {
    const m = document.getElementById('playAddBtn').dataset.match;
    if(m !== '') addToSeq(+m);
  };
  document.getElementById('playClearKeys').onclick = () => {
    if(playKeyboard) playKeyboard.clear();
    onPlayNotesChange(new Set());
  };
}
