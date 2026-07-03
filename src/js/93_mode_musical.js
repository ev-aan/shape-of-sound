// ---- MODE: MUSICAL (theory view) ----
// A full 2D takeover, no 3D map: tap a note on the circle of fifths to make it your key, and a
// diagram below groups that key's chords by function (Subdominant -> Dominant -> Tonic) — tap
// a chord to hear it and open the same detail card Science mode uses. Modelled on what the
// best-reviewed interactive circle-of-fifths tools (Musicca, GenMusic.im) already do well:
// click a key -> see its chords -> click a chord -> hear it.
let musCofBuilt = false, activeChordIdx = null;

Modes.register('musical', {
  label: 'Musical',
  onEnter(){
    showMode('musical');
    document.getElementById('topbarLabel').textContent = 'Musical — theory, keys, and function';
    if(!musCofBuilt){
      Surfaces.get('cof').render(document.getElementById('musCof'), {
        caption: false, // Musical shows its own chord-tone breakdown instead of the generic caption
        onSelect(pc){
          activeChordIdx = null; // key changed — let refreshMusicalScene re-pick the tonic below
          View.set({ key: pc, scale: View.get().scale || 'major' });
          refreshMusicalScene();
        }
      });
      musCofBuilt = true;
    }
    refreshMusicalScene();
  },
  onExit(){}
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
  const label = document.getElementById('musChordLabel');
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
}
function chordPillHTML(item){
  const col = Palette.FN[item.fn] || Palette.FN.ext;
  const on = item.idx === activeChordIdx ? ' on' : '';
  return '<button class="chordPill'+on+'" data-idx="'+item.idx+'" style="--pc:'+col+'"><span class="rn">'+item.roman+'</span><span class="cn">'+item.name+'</span></button>';
}
function fnColHTML(label, items){
  if(!items.length) return '';
  return '<div class="fnCol"><div class="fnLbl">'+label+'</div>'+items.map(chordPillHTML).join('')+'</div>';
}
function renderKeyDiagram(){
  const host = document.getElementById('musDiagram');
  const v = View.get();
  if(v.key == null){ host.innerHTML = '<div class="hint">Tap a note on the circle above to explore its key.</div>'; return; }
  const s = SCALES[v.scale];
  const groups = { T:[], S:[], D:[], ext:[] };
  s.pcs.forEach((offset, deg) => {
    const idx = repChordForDegree(v.scale, v.key, offset);
    if(idx == null) return;
    const fn = chordFn(N[idx], v.scale, v.key) || 'ext';
    (groups[fn] || groups.ext).push({ idx, roman: romanFor(deg, N[idx].q), name: N[idx].name, fn });
  });
  if(groups.S.length || groups.D.length || groups.T.length){
    host.innerHTML = '<div class="fnFlow">'+fnColHTML('subdominant', groups.S)+'<span class="fnArrow">→</span>'+
      fnColHTML('dominant', groups.D)+'<span class="fnArrow">→</span>'+fnColHTML('tonic', groups.T)+'</div>'+
      (groups.ext.length ? '<div class="fnFlow" style="margin-top:10px;">'+fnColHTML('other', groups.ext)+'</div>' : '');
  } else {
    host.innerHTML = '<div class="fnFlow">'+fnColHTML('chords', groups.ext)+'</div>';
  }
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
// the one path for "make this chord the one we're looking at" — used by both the diagram pills
// and the "where next?" suggestion chips, so clicking a suggestion behaves exactly like clicking
// its pill would: hear it, see its detail card, see its shape, and get its own suggestions in turn.
function selectMusicalChord(idx){
  playFreqs(N[idx].freqs);
  renderDetail(idx);
  drawChordArc(idx);
  renderKeyDiagram();
  renderSuggestions();
}
function refreshMusicalScene(){
  const v = View.get();
  // default the shown shape to the tonic chord whenever the key/scale changes under it
  if(v.key != null && (activeChordIdx == null || N[activeChordIdx].root !== v.key || !chordInScale(N[activeChordIdx], v.scale, v.key))){
    activeChordIdx = repChordForDegree(v.scale, v.key, 0);
  }
  paintMusicalCircle();
  renderKeyDiagram();
  drawChordArc(v.key != null ? activeChordIdx : null);
  renderSuggestions();
  const leg = document.getElementById('mLegend');
  if(!leg) return;
  if(v.key == null){ leg.textContent = 'Tap a note on the circle to explore its key.'; return; }
  const s = SCALES[v.scale], count = N.filter(n => chordInScale(n, v.scale, v.key)).length;
  leg.textContent = 'Key of '+NOTE[v.key]+' '+s.name+' — '+count+' chords fit this scale. Subdominant (amber) leads to dominant (red), which resolves to tonic (green).';
}
function wireMusicalHome(){
  const scaleSel = document.getElementById('mScaleSel');
  scaleSel.innerHTML = Object.keys(SCALES).map(id=>'<option value="'+id+'">'+SCALES[id].name+'</option>').join('');
  scaleSel.value = 'major';
  scaleSel.onchange = () => { View.set({ scale: scaleSel.value }); refreshMusicalScene(); };
  document.getElementById('musDiagram').addEventListener('click', e => {
    const b = e.target.closest('.chordPill'); if(!b) return;
    selectMusicalChord(+b.dataset.idx);
  });
  document.getElementById('musSuggest').addEventListener('click', e => {
    const b = e.target.closest('.suggChip'); if(!b) return;
    selectMusicalChord(+b.dataset.idx);
  });
  const sc = document.getElementById('mScalesChartBtn'); if(sc) sc.onclick = openScalesChart;
  const scClose = document.getElementById('scalesClose'); if(scClose) scClose.onclick = closeScalesChart;
  const ib = document.getElementById('mInfoBtn'); if(ib) ib.onclick = ()=>alert(
    'Tap a note on the circle to make it your key. The diagram below groups that key\'s chords by '+
    'function:\n  Subdominant (amber) — departs from home\n  Dominant (red) — tension, wants to resolve\n  Tonic (green) — home\n\n'+
    'Click a chord to see its shape on the circle, and "where next?" for chords that tend to follow it.\n\n'+
    'Try C, then switch the scale from Major to Dorian and see how the chords change.');
}
