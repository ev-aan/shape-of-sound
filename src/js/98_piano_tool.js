// ---- PIANO TOOL: a standalone keyboard, connected to a score and richer analysis ----
// Deliberately not a Modes.register(...) mode — it never touches switchMode/View, so it stays
// orthogonal to whatever mode/page is showing underneath (same reason the Ripple Room is a
// plain fixed overlay, see 32_ripple.js). Reachable from the Lessons Library from a cold start,
// with no dependency on the 3D chord-map scene at all — that's what makes it "standalone".
let pianoBuilt = false, pianoKeyboardHandle = null;
let pianoScoreMode = 'snapshot', pianoScoreMeasures = [];
let pianoLastChordIdx = null, pianoHeldPcs = new Set();
let pianoKeyRoot = 0, pianoScaleId = 'major';
function isPianoToolBuilt(){ return pianoBuilt; }
function getPianoLastChordIdx(){ return pianoLastChordIdx; }
function getPianoScoreMode(){ return pianoScoreMode; }
function getPianoScoreLength(){ return pianoScoreMeasures.length; }

// one whole-note block chord, spelled close-position above middle C — same base+iv idiom
// buildBachBar() uses in 97_bach_prelude.js, just without that file's broken-chord shape
function pianoMeasureFor(idx){
  const n = N[idx], base = 60 + n.root;
  return { timeSig:[4,4], label:n.name, voices:{ treble:[{ midi:n.ivs.map(iv => base+iv), dur:'w' }] } };
}
function pianoRenderStaff(){
  const container = document.getElementById('pianoStaff'); if(!container) return;
  if(pianoScoreMode === 'transcribe'){
    if(pianoScoreMeasures.length) Surfaces.get('staff').render(container, pianoScoreMeasures);
    else container.innerHTML = '';
    return;
  }
  const idx = matchChord(pianoHeldPcs);
  if(idx == null || !pianoHeldPcs.size){ container.innerHTML = ''; return; }
  Surfaces.get('staff').render(container, [pianoMeasureFor(idx)]);
}

function pianoRenderFn(idx){
  const out = document.getElementById('pianoFnOut'); if(!out) return;
  if(idx == null){ out.innerHTML = '<div class="pianoAnalysisRow dim">play a chord to see its function</div>'; return; }
  const n = N[idx], label = NOTE[pianoKeyRoot]+' '+SCALES[pianoScaleId].name;
  const deg = chordDegreeIn(n, pianoScaleId, pianoKeyRoot);
  if(deg == null){ out.innerHTML = '<div class="pianoAnalysisRow"><span class="dim">'+n.name+' isn\'t diatonic to '+label+'.</span></div>'; return; }
  const fn = chordFn(n, pianoScaleId, pianoKeyRoot), roman = romanFor(deg, n.q);
  out.innerHTML = '<div class="pianoAnalysisRow">'+roman+' in '+label+' — '+(FNNAME[fn] || 'colour/extension')+'</div>';
}
function pianoRenderVl(idx){
  const out = document.getElementById('pianoVlOut'); if(!out) return;
  if(idx == null){ out.innerHTML = '<div class="pianoAnalysisRow dim">play a recognised chord to compare it to the last one</div>'; return; }
  if(pianoLastChordIdx == null || pianoLastChordIdx === idx){
    out.innerHTML = '<div class="pianoAnalysisRow dim">play a different chord to see the motion between them</div>'; return;
  }
  const dist = vlDist(pianoLastChordIdx, idx), tag = rootTag(pianoLastChordIdx, idx);
  out.innerHTML = '<div class="pianoAnalysisRow">'+N[pianoLastChordIdx].name+' → '+N[idx].name+' — '+(tag ? tag+', ' : '')+dist.toFixed(1)+' semitones of total motion</div>';
}
// "bass" here is the first pitch class you pressed and are still holding (a Set preserves
// insertion order) — the keyboard is one octave with no register, so there's no real bass
// note to read off; this is a deliberately-labelled proxy, not a true multi-octave voicing
const PIANO_INV_LABEL = ['root position','1st inversion','2nd inversion','3rd inversion'];
function pianoRenderInversion(idx, orderedPcs){
  const out = document.getElementById('pianoInversionOut'); if(!out) return;
  if(idx == null || !orderedPcs.length){ out.innerHTML = '<div class="pianoAnalysisRow dim">play a recognised chord to see its voicing</div>'; return; }
  const n = N[idx], bassPc = orderedPcs[0], bassIv = mod12(bassPc - n.root), ivIdx = n.ivs.indexOf(bassIv);
  const label = ivIdx >= 0 ? (PIANO_INV_LABEL[ivIdx] || (ivIdx+1)+'th inversion') : 'unusual voicing';
  out.innerHTML = '<div class="pianoAnalysisRow">'+label+' — '+NOTE[bassPc]+' ('+(IV_LABEL[bassIv]||bassIv)+') is your lowest held note'+
    '<br><span class="dim">based on the first key you pressed, since this keyboard has no separate bass register</span></div>';
}
// root -> each other chord tone (not every pairwise combination) -- the standard framing, and
// keeps this from exploding combinatorially for a 7th chord
function pianoRenderIntervals(idx, orderedPcs){
  const wrap = document.getElementById('pianoIntervals'); if(!wrap) return;
  wrap.innerHTML = '';
  let root, tones;
  if(idx != null){ root = N[idx].root; tones = N[idx].ivs.slice(1).map(iv => (root+iv)%12); }
  else if(orderedPcs.length >= 2){ const sorted = [...orderedPcs].sort((a,b)=>a-b); root = sorted[0]; tones = sorted.slice(1); }
  else { wrap.innerHTML = '<div class="pianoAnalysisRow dim">hold two or more notes to see intervals</div>'; return; }
  tones.forEach(pc => {
    const cell = document.createElement('div');
    Surfaces.get('interval').render(cell, { a: root, b: pc });
    wrap.appendChild(cell);
  });
}

function pianoOnKeysChange(pcs){
  pianoHeldPcs = pcs;
  const readout = document.getElementById('pianoReadout'), addBtn = document.getElementById('pianoAddBtn');
  if(!readout || !addBtn) return;
  if(!pcs.size){
    readout.textContent = 'What chord do you want to hear?';
    addBtn.disabled = true; addBtn.dataset.match = '';
    pianoRenderFn(null); pianoRenderVl(null); pianoRenderInversion(null, []); pianoRenderIntervals(null, []);
    pianoRenderStaff();
    return;
  }
  const ordered = [...pcs]; // Set iteration order == insertion (press) order
  const names = [...pcs].sort((a,b)=>a-b).map(pc => NOTE[pc]).join(' + ');
  const match = matchChord(pcs);
  if(match != null){
    readout.textContent = names+' — that\'s '+N[match].name+'.';
    addBtn.disabled = false; addBtn.dataset.match = match;
  } else {
    readout.textContent = names+' — keep going, that\'s not a chord we know yet.';
    addBtn.disabled = true; addBtn.dataset.match = '';
  }
  pianoRenderFn(match);
  pianoRenderVl(match);
  pianoRenderInversion(match, ordered);
  pianoRenderIntervals(match, ordered);
  if(match != null && match !== pianoLastChordIdx) pianoLastChordIdx = match;
  pianoRenderStaff();
}

function pianoPopulateSelects(){
  const keySel = document.getElementById('pianoKeySel'), scaleSel = document.getElementById('pianoScaleSel');
  keySel.innerHTML = NOTE.map((nm,i) => '<option value="'+i+'">'+nm+'</option>').join('');
  keySel.value = pianoKeyRoot;
  scaleSel.innerHTML = Object.keys(SCALES).map(k => '<option value="'+k+'">'+SCALES[k].name+'</option>').join('');
  scaleSel.value = pianoScaleId;
  keySel.onchange = () => { pianoKeyRoot = +keySel.value; pianoRenderFn(matchChord(pianoHeldPcs)); };
  scaleSel.onchange = () => { pianoScaleId = scaleSel.value; pianoRenderFn(matchChord(pianoHeldPcs)); };
}
function buildPianoTool(){
  pianoBuilt = true;
  pianoKeyboardHandle = Surfaces.get('keyboard').render(document.getElementById('pianoKeyboard'), { onChange: pianoOnKeysChange });
  pianoPopulateSelects();
  document.getElementById('pianoAddBtn').onclick = () => {
    const m = document.getElementById('pianoAddBtn').dataset.match; if(m === '') return;
    pianoScoreMeasures.push(pianoMeasureFor(+m));
    pianoRenderStaff();
  };
  document.getElementById('pianoClearScoreBtn').onclick = () => { pianoScoreMeasures = []; pianoRenderStaff(); };
  document.getElementById('pianoScoreModePills').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    pianoScoreMode = b.dataset.mode;
    [...document.getElementById('pianoScoreModePills').children].forEach(x => x.classList.toggle('on', x===b));
    document.getElementById('pianoScoreActions').style.display = pianoScoreMode === 'transcribe' ? '' : 'none';
    pianoRenderStaff();
  });
  pianoOnKeysChange(new Set());
}
function showPianoTool(){
  if(!pianoBuilt) buildPianoTool();
  document.getElementById('pianoTool').style.display = 'block';
}
function hidePianoTool(){
  if(!pianoBuilt) return;
  document.getElementById('pianoTool').style.display = 'none';
  pianoKeyboardHandle.clear();
  pianoScoreMeasures = []; pianoLastChordIdx = null; pianoScoreMode = 'snapshot';
  [...document.getElementById('pianoScoreModePills').children].forEach(x => x.classList.toggle('on', x.dataset.mode==='snapshot'));
  document.getElementById('pianoScoreActions').style.display = 'none';
  pianoOnKeysChange(new Set());
}
document.getElementById('pianoToolClose').onclick = hidePianoTool;
