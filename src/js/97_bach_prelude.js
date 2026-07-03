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
function bachFlatten(){
  const flat = [];
  BACH_PRELUDE.forEach((bar, bi) => { bar.notes.forEach((midi, ni) => flat.push({ bi, ni, midi })); });
  return flat;
}
function stopBach(){
  if(bachTimer){ clearTimeout(bachTimer); bachTimer = null; }
  bachPos = 0;
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
      drawChordArc(bar.idx);
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
