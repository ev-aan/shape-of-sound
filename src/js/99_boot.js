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
wireLevelToggle();
wireMusicalHome();
wireLessonsHome();
wireBachPrelude();
wirePlayControls();
wireMoreToggle('sciMoreBtn', 'sciMore');
installBridgeButton();
wireSimpleFront();
// Simple front door by default; Advanced (in the right mode) if the URL already names one — via
// an older #hash-only share link, or a clean path like /musical (see 95_deeplink.js). A clean
// path wins over whatever mode the hash names, if they ever disagree.
const pathMode = Link.modeFromPath();
const hadHash = !!(location.hash && location.hash.length > 1);
if(hadHash || pathMode){
  // applyFromHash enters whatever mode the hash names; read it before anything else can overwrite location.hash
  try { Link.applyFromHash(); } catch(e){}
  if(pathMode && Modes.currentId() !== pathMode) switchMode(pathMode);
  else if(!Modes.currentId()) switchMode('science');
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
