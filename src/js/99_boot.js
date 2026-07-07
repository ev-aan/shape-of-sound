// ---- BOOT (runs last, after all modes are registered) ----
// Panels lead with the 2-3 controls that matter most; everything else sits behind "more options"
// so a newcomer sees a short list to try, not a wall of controls.
function wireMoreToggle(btnId, wrapId){
  const btn = document.getElementById(btnId), wrap = document.getElementById(wrapId);
  if(!btn || !wrap) return;
  wrap.style.display = 'none';
  btn.onclick = () => {
    const open = wrap.style.display !== 'none';
    wrap.style.display = open ? 'none' : '';
    btn.textContent = open ? '▾ more options' : '▴ fewer options';
  };
}
wireTopbar();
wireDimToggle();
wireTuneToggle();
wireMusicalHome();
wireLessonsHome();
wireBachPrelude();
wirePlayControls();
wireMoreToggle('sciMoreBtn', 'sciMore');
installBridgeButton();
wireSimpleFront();
// Simple front door by default; Advanced only if the URL already carries a shared view
const hadHash = !!(location.hash && location.hash.length > 1);
if(hadHash){
  // applyFromHash enters whatever mode the hash names; read it before anything else can overwrite location.hash
  try { Link.applyFromHash(); } catch(e){}
  if(!Modes.currentId()) Modes.enter('science');
  showAdvanced();
} else {
  showSimple();
}
// share button (added to top bar)
const shareBtn = document.getElementById('shareBtn');
if(shareBtn) shareBtn.onclick = ()=>{ const url = Link.copyLink();
  shareBtn.textContent = '✓ link copied'; setTimeout(()=>shareBtn.textContent='⤴ share view', 1400); };
// test hook (harmless in browser)
try { globalThis.__api = { View, Modes, Palette, SCALES, chordInScale, chordFn, N, setTuning, Link, Surfaces, showSimple, showAdvanced, voiceLeadingPairs, neighboringChords }; } catch(e){}
