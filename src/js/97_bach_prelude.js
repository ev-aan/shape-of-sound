// ---- BACH: Prelude in C major, BWV 846 (WTC Book I, No. 1) — first 8 bars ----
// Not a verified Urtext transcription: the chord identity per bar follows well-documented harmonic
// analysis (I - ii7 - V7 - I, then the descending-fifths sequence toward the dominant), and each
// bar's 8 notes are generated from that chord using the piece's own well-known broken-chord shape
// (root, 3rd, 5th, octave, 3rd, 5th, octave, 3rd) rather than recalled note-by-note. Treat this as
// a faithful reconstruction of the harmony, not a note-perfect score.
const BACH_CHORDS = [
  { root:0, q:'maj',  roman:'I'    },
  { root:2, q:'min7', roman:'ii7'  },
  { root:7, q:'7',    roman:'V7'   },
  { root:0, q:'maj',  roman:'I'    },
  { root:9, q:'min',  roman:'vi'   },
  { root:2, q:'7',    roman:'V7/V' },
  { root:7, q:'maj',  roman:'V'    },
  { root:7, q:'7',    roman:'V7'   },
];
function buildBachBar(chord){
  const idx = N.findIndex(n => n.root===chord.root && n.q===chord.q);
  const ivs = N[idx].ivs;
  const base = 60 + chord.root; // middle-register start, near the piece's own tessitura
  const seq = [];
  for(let oct=0; seq.length<5; oct++){
    for(const iv of ivs){ seq.push(base + iv + oct*12); if(seq.length>=5) break; }
  }
  const shape = [0,1,2,3,1,2,3,1]; // the prelude's own repeating broken-chord contour
  return { idx, roman: chord.roman, bass: base-12, notes: shape.map(i => seq[i]) };
}
const BACH_PRELUDE = BACH_CHORDS.map(buildBachBar);

let bachTimer = null, bachFlat = null, bachPos = 0, bachStaffHandle = null;
let bachArcEls = { prev:null, cur:null, next:null };
function bachFlatten(){
  const flat = [];
  BACH_PRELUDE.forEach((bar, bi) => { bar.notes.forEach((midi, ni) => flat.push({ bi, ni, midi })); });
  return flat;
}
// draws one bar's chord as a fresh, invisible polygon (fill/stroke set now, opacity animated in later)
function bachMakeArc(idx, roleClass){
  const svg = document.querySelector('#musCof svg');
  if(!svg || idx == null) return null;
  const n = N[idx];
  const fn = chordFn(n, 'major', 0) || 'ext'; // the demo is fixed to C major throughout
  const col = Palette.FN[fn] || Palette.FN.ext;
  const pts = n.ivs.map(iv => { const p = cofNotePos((n.root+iv)%12); return p.x+','+p.y; }).join(' ');
  const poly = document.createElementNS('http://www.w3.org/2000/svg','polygon');
  poly.setAttribute('points', pts);
  poly.setAttribute('class', 'chordArc bachArc '+roleClass);
  poly.setAttribute('fill', col+'22');
  poly.setAttribute('stroke', col);
  poly.style.opacity = 0;
  svg.insertBefore(poly, svg.firstChild);
  return poly;
}
// each bar, the shape that was "next" (a faint preview) becomes "cur" (solid), "cur" becomes "prev"
// and fades out, the old "prev" (fully faded by now) is removed, and a new "next" preview fades in
// for the bar after this one — so the upcoming chord is always visible before it arrives.
function bachAdvanceArcs(bi){
  if(bachArcEls.prev) bachArcEls.prev.remove();
  bachArcEls.prev = bachArcEls.cur;
  if(bachArcEls.prev) bachArcEls.prev.setAttribute('class', 'chordArc bachArc bachArc-prev');
  bachArcEls.cur = bachArcEls.next || bachMakeArc(BACH_PRELUDE[bi].idx, 'bachArc-cur');
  if(bachArcEls.cur) bachArcEls.cur.setAttribute('class', 'chordArc bachArc bachArc-cur');
  const nextIdx = bi+1 < BACH_PRELUDE.length ? BACH_PRELUDE[bi+1].idx : null;
  bachArcEls.next = bachMakeArc(nextIdx, 'bachArc-next');
  requestAnimationFrame(() => {
    if(bachArcEls.prev) bachArcEls.prev.style.opacity = 0;
    if(bachArcEls.cur) bachArcEls.cur.style.opacity = 1;
    if(bachArcEls.next) bachArcEls.next.style.opacity = 0.32;
  });
}
function bachClearArcs(){
  ['prev','cur','next'].forEach(r => { if(bachArcEls[r]){ bachArcEls[r].remove(); bachArcEls[r]=null; } });
}
function stopBach(){
  if(bachTimer){ clearTimeout(bachTimer); bachTimer = null; }
  bachPos = 0;
  bachClearArcs();
  const btn = document.getElementById('musBachPlay');
  if(btn) btn.textContent = '▶ Bach: Prelude in C (BWV 846)';
  document.querySelectorAll('#musCof .cofNote.playing').forEach(el => el.classList.remove('playing'));
}
function startBach(){
  stopBach();
  const scaleSel = document.getElementById('mScaleSel');
  View.set({ key: 0, scale: 'major' });
  if(scaleSel) scaleSel.value = 'major';
  refreshMusicalScene();
  if(!bachStaffHandle) bachStaffHandle = Surfaces.get('staff').render(document.getElementById('musStaff'), BACH_PRELUDE);
  bachFlat = bachFlatten();
  const stepMs = 200, btn = document.getElementById('musBachPlay');
  function step(){
    if(bachPos >= bachFlat.length){ stopBach(); return; }
    const ev = bachFlat[bachPos], bar = BACH_PRELUDE[ev.bi];
    if(ev.ni === 0){
      playFreqs([m2f(bar.bass)], stepMs/1000*8);
      bachAdvanceArcs(ev.bi);
      activeChordIdx = bar.idx;
      const label = document.getElementById('musChordLabel'); if(label) label.textContent = chordToneText(bar.idx);
      renderKeyDiagram();
      renderSuggestions();
    }
    playFreqs([m2f(ev.midi)], stepMs/1000*1.6);
    document.querySelectorAll('#musCof .cofNote.playing').forEach(el => el.classList.remove('playing'));
    const noteEl = document.querySelector('#musCof .cofNote[data-pc="'+(((ev.midi%12)+12)%12)+'"]');
    if(noteEl) noteEl.classList.add('playing');
    if(bachStaffHandle) bachStaffHandle.highlight(ev.bi, ev.ni);
    if(btn) btn.textContent = '■ stop — bar '+(ev.bi+1)+'/'+BACH_PRELUDE.length+': '+N[bar.idx].name+' ('+bar.roman+')';
    bachPos++;
    bachTimer = setTimeout(step, stepMs);
  }
  step();
}
function wireBachPrelude(){
  const btn = document.getElementById('musBachPlay'); if(!btn) return;
  btn.onclick = () => { if(bachTimer) stopBach(); else startBach(); };
}
