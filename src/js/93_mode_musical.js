// ---- MODE: MUSICAL (theory view) ----
// A full 2D takeover, no 3D map: tap a note on the circle of fifths to make it your key. The
// circle itself shows that key's diatonic chords as concentric rings — minor (ii/vi) and
// diminished (vii°) — positioned by their real circle-of-fifths relationship to the key, the way
// "The Chord Wheel" (Jim Fleser) and similar reference charts do it, instead of a flat list below
// the circle. Tap any ring segment to hear it and open the same detail card Science mode uses.
let musCofBuilt = false, activeChordIdx = null, musTapMode = 'chord';

// Rings are just data: { id, radius, noteRadius, fn(pc)->derivedPc, suffix, sat, light }. Adding a
// new one later (e.g. secondary dominants, parallel major/minor) means adding an entry here and a
// paint rule below — nothing about the circle surface itself needs to change.
const MUSICAL_RINGS = [
  { id:'minor', radius:140, noteRadius:13, fn: pc => (pc+9)%12,  suffix:'m', sat:.45, light:.34 },
  { id:'dim',   radius:168, noteRadius:13, fn: pc => (pc+11)%12, suffix:'°', sat:.4,  light:.28 },
];

Modes.register('musical', {
  label: 'Musical',
  onEnter(){
    showMode('musical');
    document.getElementById('topbarLabel').textContent = 'Musical — theory, keys, and function';
    if(!musCofBuilt){
      Surfaces.get('cof').render(document.getElementById('musCof'), {
        caption: false, // Musical shows its own chord-tone breakdown instead of the generic caption
        viewBoxPad: 65, // room for the minor + diminished rings, both outside the main note ring
        rings: MUSICAL_RINGS,
        onSelect(pc){
          activeChordIdx = null; // key changed — let refreshMusicalScene re-pick the tonic below
          View.set({ key: pc, scale: View.get().scale || 'major' });
          refreshMusicalScene();
          if(musTapMode === 'note') playFreqs([m2f(60+pc)]);
          else if(activeChordIdx != null) playFreqs(N[activeChordIdx].freqs);
        },
        onSelectRing(ringId, pc){
          const q = ringId === 'dim' ? 'dim' : 'min';
          const idx = N.findIndex(n => n.root === pc && n.q === q);
          if(idx >= 0) selectMusicalChord(idx);
        }
      });
      musCofBuilt = true;
    }
    refreshMusicalScene();
  },
  onExit(){ stopBach(); }
});

// a chord's notes, in stacked (root/third/fifth/...) order, as positions on the circle of fifths —
// this is what makes the shape mean something: a major triad traces the same shape everywhere,
// a minor triad another, a diminished chord a tighter one, wherever they're rooted.
function cofNotePos(pc){
  const i = (pc*7)%12, ang = -Math.PI/2 + i*(2*Math.PI/12), cx=150, cy=150, R=110;
  return { x:+(cx+R*Math.cos(ang)).toFixed(1), y:+(cy+R*Math.sin(ang)).toFixed(1) };
}
// interval-from-root -> the chord-tone role name, for the "C (root) · E (3rd) · G (5th)" label
const IV_LABEL = {0:'root',1:'♭2',2:'2nd',3:'♭3',4:'3rd',5:'4th',6:'♭5',7:'5th',8:'♯5',9:'6th',10:'♭7',11:'7th'};
function chordToneText(idx){
  const n = N[idx];
  return n.name+':  '+n.ivs.map(iv => NOTE[(n.root+iv)%12]+' ('+(IV_LABEL[iv]||iv)+')').join('  ·  ');
}
function drawChordArc(idx){
  activeChordIdx = idx;
  const svg = document.querySelector('#musCof svg'); if(!svg) return;
  const old = svg.querySelector('.chordArc'); if(old) old.remove();
  // arrows only mean something for the transition that just happened — any redraw not
  // immediately followed by drawVoiceLeadingArrows (key change, scale change, tap-mode
  // refresh) should clear them rather than leave a stale trail on screen.
  svg.querySelectorAll('.vlArrow').forEach(el => el.remove());
  const label = document.getElementById('musChordLabel');
  const addBtn = document.getElementById('musAddSeqBtn');
  if(addBtn) addBtn.disabled = idx == null;
  if(idx == null){ if(label) label.textContent = ''; return; }
  const n = N[idx];
  const pcs = n.ivs.map(iv => (n.root+iv)%12);
  const pts = pcs.map(pc => { const p = cofNotePos(pc); return p.x+','+p.y; }).join(' ');
  const v = View.get();
  const fn = (v.key!=null ? chordFn(n, v.scale, v.key) : null) || 'ext';
  const col = Palette.FN[fn] || Palette.FN.ext;
  const poly = document.createElementNS('http://www.w3.org/2000/svg','polygon');
  poly.setAttribute('points', pts);
  poly.setAttribute('class', 'chordArc');
  poly.setAttribute('fill', col+'22');
  poly.setAttribute('stroke', col);
  svg.insertBefore(poly, svg.firstChild);
  if(label) label.textContent = chordToneText(idx);
}

// a one-time arrowhead marker for the voice-leading lines below — the circle's <svg> is built
// once (musCofBuilt) and persists across chord selections, so this only ever needs to run once.
let musArrowMarkerBuilt = false;
function ensureVlArrowMarker(svg){
  if(musArrowMarkerBuilt) return;
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = '<marker id="vlArrowHead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" '+
    'markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="vlArrowHead"></path></marker>';
  svg.appendChild(defs);
  musArrowMarkerBuilt = true;
}
// nearest-note pairing from chord A to chord B, one direction only (the direction this
// transition actually moves), by pitch class — the same "nearest match" vlDist sums over both
// chords, but kept per-pair here since drawing needs to know *which* note goes *where*. A note
// that lands on itself is a held common tone, not a motion, so it's left out of the result.
function voiceLeadingPairs(fromIdx, toIdx){
  const pa = N[fromIdx].ivs.map(iv => (N[fromIdx].root+iv)%12);
  const pb = N[toIdx].ivs.map(iv => (N[toIdx].root+iv)%12);
  return pa.map(from => {
    let to = pb[0], best = 99;
    pb.forEach(q => { const d = Math.abs(from-q)%12, dd = Math.min(d, 12-d); if(dd < best){ best = dd; to = q; } });
    return { from, to };
  }).filter(pair => pair.to !== pair.from);
}
// after moving from one chord to another, draw a thin arrow for each pair above — how the
// voices actually moved, not just "here's what's next" (which the suggestion chips already say
// in words).
function drawVoiceLeadingArrows(fromIdx, toIdx){
  const svg = document.querySelector('#musCof svg');
  if(!svg || fromIdx == null || toIdx == null || fromIdx === toIdx) return;
  ensureVlArrowMarker(svg);
  voiceLeadingPairs(fromIdx, toIdx).forEach(({ from, to }) => {
    const a = cofNotePos(from), b = cofNotePos(to);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
    line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
    line.setAttribute('class', 'vlArrow');
    line.setAttribute('marker-end', 'url(#vlArrowHead)');
    svg.appendChild(line);
  });
}

const ROMAN = ['I','II','III','IV','V','VI','VII'];
function romanFor(deg, quality){
  const base = ROMAN[deg] || String(deg+1);
  if(quality==='dim'||quality==='dim7'||quality==='m7b5') return base.toLowerCase()+'°';
  if(quality==='min'||quality==='min7'||quality==='mMaj7') return base.toLowerCase();
  if(quality==='aug') return base+'+';
  return base;
}
// the best-fitting simple chord (prefer plain triads over 7ths/adds) rooted at this scale degree
function repChordForDegree(scaleId, keyRoot, offset){
  const root = (keyRoot + offset) % 12;
  let best = null, bestScore = -1;
  for(let i=0;i<N.length;i++){
    const n = N[i];
    if(n.root !== root || !chordInScale(n, scaleId, keyRoot)) continue;
    const score = ['maj','min','dim'].includes(n.q) ? 3 : (['aug','sus2','sus4'].includes(n.q) ? 2 :
      (['7','maj7','min7','m7b5','dim7','mMaj7'].includes(n.q) ? 1 : 0));
    if(score > bestScore){ bestScore = score; best = i; }
  }
  return best;
}
function repChordsForKey(scaleId, keyRoot){
  return SCALES[scaleId].pcs.map(offset => repChordForDegree(scaleId, keyRoot, offset)).filter(idx => idx != null);
}
// "where next?" — reuses the same overtone-overlap (W) and voice-leading (vlDist) scoring the
// Play sequencer's suggestNext() uses, but scoped to this key's own chords and its actual scale
// (suggestNext's functional bonus only understands the major scale via the Science-mode keyRoot).
function suggestNextInKey(a, scaleId, keyRoot){
  const fa = chordFn(N[a], scaleId, keyRoot);
  const list = repChordsForKey(scaleId, keyRoot).filter(b => b !== a).map(b => {
    const ov = W[a][b], vl = vlDist(a,b), vlS = 1/(1+vl);
    const fb2 = chordFn(N[b], scaleId, keyRoot);
    let fn = 0, tag = '';
    if(fa && fb2){
      if(fa==='D' && fb2==='T'){ fn=0.6; tag='resolves home'; }
      else if(fa==='S' && fb2==='D'){ fn=0.45; tag='builds tension'; }
      else if(fa==='T' && fb2==='S'){ fn=0.25; tag='moves away'; }
      else fn=0.1;
    }
    return { b, score: 0.5*ov + 0.3*vlS + 0.2*fn, tag };
  });
  list.sort((x,y)=>y.score-x.score);
  return list;
}
function paintMusicalCircle(){
  const v = View.get();
  const inScale = v.key!=null ? scalePcs(v.scale, v.key) : null;
  document.querySelectorAll('#musCof .cofNote').forEach(el => {
    el.classList.remove('tonic','inScale','dim');
    if(!inScale) return;
    const pc = +el.dataset.pc;
    if(pc === v.key) el.classList.add('tonic');
    else if(inScale.has(pc)) el.classList.add('inScale');
    else el.classList.add('dim');
  });
  // the minor ring position at a given angular slot only "means" ii or vi of the current key if
  // it's actually at that slot AND actually a minor triad there — checked by scale degree, not by
  // "is this pc a diatonic minor somewhere" (which would wrongly also light up iii, a minor triad
  // that just isn't one of the ring's two ii/vi neighbour slots).
  document.querySelectorAll('#musCof .cofRing').forEach(el => el.classList.remove('active','dim'));
  if(v.key == null) return;
  const s = SCALES[v.scale];
  if(s.pcs.length !== 7){ document.querySelectorAll('#musCof .cofRing').forEach(el => el.classList.add('dim')); return; }
  const degreeRoot = deg => (v.key + s.pcs[deg]) % 12;
  const degreeIdx = deg => repChordForDegree(v.scale, v.key, s.pcs[deg]);
  const ii = degreeIdx(1), vi = degreeIdx(5), vii = degreeIdx(6);
  document.querySelectorAll('#musCof .cofRing-minor').forEach(el => {
    const pc = +el.dataset.pc;
    const hit = (pc===degreeRoot(1) && ii!=null && N[ii].q==='min') || (pc===degreeRoot(5) && vi!=null && N[vi].q==='min');
    el.classList.add(hit ? 'active' : 'dim');
  });
  document.querySelectorAll('#musCof .cofRing-dim').forEach(el => {
    const pc = +el.dataset.pc;
    const hit = pc===degreeRoot(6) && vii!=null && N[vii].q==='dim';
    el.classList.add(hit ? 'active' : 'dim');
  });
}
function suggChipHTML(o){
  const v = View.get(), fn = chordFn(N[o.b], v.scale, v.key) || 'ext';
  const col = Palette.FN[fn] || Palette.FN.ext;
  return '<button class="suggChip" data-idx="'+o.b+'" style="--pc:'+col+'">'+N[o.b].name+
    (o.tag ? '<span class="suggTag">'+o.tag+'</span>' : '')+'</button>';
}
function renderSuggestions(){
  const host = document.getElementById('musSuggest'); if(!host) return;
  const v = View.get();
  if(v.key == null || activeChordIdx == null){ host.innerHTML = ''; return; }
  const list = suggestNextInKey(activeChordIdx, v.scale, v.key).slice(0,4);
  if(!list.length){ host.innerHTML = ''; return; }
  host.innerHTML = '<div class="fnLbl">where next from '+N[activeChordIdx].name+'?</div><div class="suggRow">'+list.map(suggChipHTML).join('')+'</div>';
}
// the one path for "make this chord the one we're looking at" — used by the ring taps and the
// "where next?" suggestion chips, so clicking a suggestion behaves exactly like tapping its ring
// segment would: hear it, see its detail card, see its shape, and get its own suggestions in turn.
function selectMusicalChord(idx){
  const prevIdx = activeChordIdx;
  playFreqs(N[idx].freqs);
  renderDetail(idx);
  drawChordArc(idx);
  if(prevIdx != null) drawVoiceLeadingArrows(prevIdx, idx);
  renderSuggestions();
}
function refreshMusicalScene(){
  const v = View.get();
  // default the shown shape to the tonic chord whenever the key/scale changes under it
  if(v.key != null && (activeChordIdx == null || N[activeChordIdx].root !== v.key || !chordInScale(N[activeChordIdx], v.scale, v.key))){
    activeChordIdx = repChordForDegree(v.scale, v.key, 0);
  }
  paintMusicalCircle();
  drawChordArc(v.key != null ? activeChordIdx : null);
  renderSuggestions();
  const leg = document.getElementById('mLegend');
  if(!leg) return;
  if(v.key == null){ leg.textContent = 'Tap a note on the circle to explore its key.'; return; }
  const s = SCALES[v.scale], count = N.filter(n => chordInScale(n, v.scale, v.key)).length;
  leg.textContent = 'Key of '+NOTE[v.key]+' '+s.name+' — '+count+' chords fit this scale. Minor ring: ii & vi. Outer ring: vii° (diminished). Tap any of them to hear it.';
}
// a single small measure proving the staff engine's range end to end: a mix of durations, a
// rest, a chord (not just single notes), and both staves — the same engine the full 35-bar
// Bach piece uses, just with one bar of hand-written data instead of 35 generated ones.
const STAFF_EXAMPLE_MEASURE = [{
  timeSig: [4,4],
  label: 'C',
  voices: {
    treble: [
      { midi:64, dur:'q' },
      { midi:67, dur:'e' },
      { midi:69, dur:'e' },
      { rest:true, dur:'q' },
      { midi:[60,64,67], dur:'q' }
    ],
    bass: [ { midi:48, dur:'h' }, { midi:43, dur:'h' } ]
  }
}];
// two more small measures proving the key-signature feature: a diatonic scale in a sharp key
// and a flat key. Every note here belongs to its key, so none of them should carry an inline
// accidental — only the signature glyphs at the clef should show sharps/flats.
const STAFF_KEYSIG_SHARP_MEASURE = [{
  timeSig: [4,4],
  voices: { treble: [62,64,66,67,69,71,73,74].map(midi => ({ midi, dur:'e' })) } // D major scale
}];
const STAFF_KEYSIG_FLAT_MEASURE = [{
  timeSig: [4,4],
  voices: { treble: [65,67,69,70,72,74,76,77].map(midi => ({ midi, dur:'e' })) } // F major scale
}];
function wireMusicalHome(){
  Surfaces.get('staff').render(document.getElementById('musExampleStaff'), STAFF_EXAMPLE_MEASURE);
  Surfaces.get('staff').render(document.getElementById('musKeySigSharpStaff'), STAFF_KEYSIG_SHARP_MEASURE, { keySig:2 });
  Surfaces.get('staff').render(document.getElementById('musKeySigFlatStaff'), STAFF_KEYSIG_FLAT_MEASURE, { keySig:-1 });
  const ivA = document.getElementById('ivNoteA'), ivB = document.getElementById('ivNoteB');
  ivA.innerHTML = ivB.innerHTML = NOTE.map((nm, pc) => '<option value="'+pc+'">'+nm+'</option>').join('');
  ivA.value = 0; ivB.value = 7; // C -> G, a perfect 5th, by default
  const renderIntervalViz = () => Surfaces.get('interval').render(document.getElementById('musInterval'), { a:+ivA.value, b:+ivB.value });
  ivA.onchange = renderIntervalViz; ivB.onchange = renderIntervalViz;
  document.getElementById('ivPlayBtn').onclick = () => playFreqs([m2f(60+ +ivA.value), m2f(60+ +ivB.value)]);
  renderIntervalViz();
  document.getElementById('staffColorPills').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    document.body.classList.toggle('staffColor', b.dataset.k === 'color');
    document.querySelectorAll('#staffColorPills button').forEach(x => x.classList.toggle('on', x===b));
  });
  const scaleSel = document.getElementById('mScaleSel');
  scaleSel.innerHTML = Object.keys(SCALES).map(id=>'<option value="'+id+'">'+SCALES[id].name+'</option>').join('');
  scaleSel.value = 'major';
  scaleSel.onchange = () => { View.set({ scale: scaleSel.value }); refreshMusicalScene(); };
  document.getElementById('musTapPills').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    musTapMode = b.dataset.k;
    document.querySelectorAll('#musTapPills button').forEach(x => x.classList.toggle('on', x===b));
  });
  document.getElementById('musSuggest').addEventListener('click', e => {
    const b = e.target.closest('.suggChip'); if(!b) return;
    selectMusicalChord(+b.dataset.idx);
  });
  document.getElementById('musAddSeqBtn').onclick = () => { if(activeChordIdx != null) addToSeq(activeChordIdx); };
  const sc = document.getElementById('mScalesChartBtn'); if(sc) sc.onclick = openScalesChart;
  const scClose = document.getElementById('scalesClose'); if(scClose) scClose.onclick = closeScalesChart;
  const ib = document.getElementById('mInfoBtn'); if(ib) ib.onclick = ()=>alert(
    'Tap a note on the circle to make it your key. "Tap plays" decides what you hear: Chord plays the '+
    'key\'s tonic chord, Note plays just that one note.\n\n'+
    'The circle itself shows this key\'s diatonic chords as rings: the outer ring is minor (ii and vi), '+
    'further out is diminished (vii°) — tap either to hear that chord.\n\n'+
    '"+ add to progression" (by the Bach player) sends whichever chord is currently shown into Play\'s '+
    'sequencer — click your way through a set of chords and it builds a real progression, one tap at a time.\n\n'+
    'Try C, then switch the scale from Major to Dorian and see how the rings change.');
}
