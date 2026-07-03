// ---- MODE: MUSICAL (theory view) ----
// A full 2D takeover, no 3D map: tap a note on the circle of fifths to make it your key, and a
// diagram below groups that key's chords by function (Subdominant -> Dominant -> Tonic) — tap
// a chord to hear it and open the same detail card Science mode uses. Modelled on what the
// best-reviewed interactive circle-of-fifths tools (Musicca, GenMusic.im) already do well:
// click a key -> see its chords -> click a chord -> hear it.
let musCofBuilt = false;

Modes.register('musical', {
  label: 'Musical',
  onEnter(){
    showMode('musical');
    document.getElementById('topbarLabel').textContent = 'Musical — theory, keys, and function';
    if(!musCofBuilt){
      Surfaces.get('cof').render(document.getElementById('musCof'), {
        onSelect(pc){ View.set({ key: pc, scale: View.get().scale || 'major' }); refreshMusicalScene(); }
      });
      musCofBuilt = true;
    }
    refreshMusicalScene();
  },
  onExit(){}
});

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
  return '<button class="chordPill" data-idx="'+item.idx+'" style="--pc:'+col+'"><span class="rn">'+item.roman+'</span><span class="cn">'+item.name+'</span></button>';
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
function refreshMusicalScene(){
  paintMusicalCircle();
  renderKeyDiagram();
  const leg = document.getElementById('mLegend');
  if(!leg) return;
  const v = View.get();
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
    const idx = +b.dataset.idx;
    playFreqs(N[idx].freqs);
    renderDetail(idx);
  });
  const sc = document.getElementById('mScalesChartBtn'); if(sc) sc.onclick = openScalesChart;
  const scClose = document.getElementById('scalesClose'); if(scClose) scClose.onclick = closeScalesChart;
  const ib = document.getElementById('mInfoBtn'); if(ib) ib.onclick = ()=>alert(
    'Tap a note on the circle to make it your key. The diagram below groups that key\'s chords by '+
    'function:\n  Subdominant (amber) — departs from home\n  Dominant (red) — tension, wants to resolve\n  Tonic (green) — home\n\n'+
    'Try C, then switch the scale from Major to Dorian and see how the chords change.');
}
