// ---- BACH: Prelude in C major, BWV 846 (WTC Book I, No. 1) — all 35 bars ----
// Not a verified Urtext transcription. Bars 1-13 follow a specific, well-sourced bar-by-bar
// analysis (including inversions/bass notes: e.g. m2 is ii7 with the 7th in the bass, m12 a
// secondary leading-tone diminished 7th over a G pedal). Bars 14-35 are a stylized reconstruction
// that follows the piece's well-documented STRUCTURE (a descending-seconds sequence with secondary
// leading-tone diminished 7ths back to the tonic, a secondary dominant tonicizing IV7, the two
// famous diminished-7th bars, an extended dominant pedal, then a tonic pedal to the final cadence)
// rather than a bar-exact transcription of that structure. Each bar's 8 notes are generated from
// its chord using the piece's own repeating broken-chord shape (root-3rd-5th-octave, twice), with
// the starting octave chosen to stay close to where the previous bar left off — real voice leading,
// not a register jump every time the chord root changes.
const BACH_CHORDS = [
  { root:0,  q:'maj',   roman:'I'          },                     // 1
  { root:2,  q:'min7',  roman:'ii7',      bassPc:0  },             // 2  Dm7, 7th (C) in bass
  { root:7,  q:'7',     roman:'V7',       bassPc:11 },             // 3  G7, 3rd (B) in bass
  { root:0,  q:'maj',   roman:'I'          },                      // 4
  { root:9,  q:'min',   roman:'vi',       bassPc:0  },             // 5  Am, 3rd (C) in bass
  { root:2,  q:'7',     roman:'V7/V',     bassPc:0  },             // 6  D7, 7th (C) in bass
  { root:7,  q:'maj',   roman:'V',        bassPc:11 },             // 7  G, 3rd (B) in bass
  { root:0,  q:'maj7',  roman:'I7'         },                      // 8  Cmaj7
  { root:9,  q:'min',   roman:'vi'          },                     // 9  Am (min7 has no root=9 entry in the data)
  { root:2,  q:'7',     roman:'V7/V'       },                      // 10 D7
  { root:7,  q:'maj',   roman:'V'          },                      // 11 G
  { root:1,  q:'dim7',  roman:'vii°7/ii',  bassPc:7  },            // 12 C#dim7, over G
  { root:2,  q:'min',   roman:'ii',       bassPc:5  },             // 13 Dm, 3rd (F) in bass
  { root:7,  q:'7',     roman:'V7'          },                     // 14 G7
  { root:0,  q:'maj',   roman:'I'           },                     // 15 C
  { root:5,  q:'maj',   roman:'IV'          },                     // 16 F
  { root:11, q:'dim',   roman:'vii°'        },                     // 17 Bdim
  { root:4,  q:'min',   roman:'iii'         },                     // 18 Em
  { root:9,  q:'min',   roman:'vi'          },                     // 19 Am
  { root:0,  q:'7',     roman:'V7/IV'       },                     // 20 C7
  { root:5,  q:'7',     roman:'IV7'         },                     // 21 F7
  { root:0,  q:'dim7',  roman:'vii°7/V'     },                     // 22 F#dim7 (same 4 notes as Cdim7 — dim7 is symmetric, only 3 canonical roots exist in the data)
  { root:2,  q:'dim7',  roman:'vii°7/I',   bassPc:8  },            // 23 Bdim7, 3rd inversion (Ab bass) (same 4 notes as Ddim7)
  { root:7,  q:'7',     roman:'V7',        bassPc:7  },            // 24 G7 — dominant pedal begins
  { root:0,  q:'maj',   roman:'I',         bassPc:7  },            // 25 C/G
  { root:7,  q:'7',     roman:'V7',        bassPc:7  },            // 26 G7
  { root:2,  q:'min7',  roman:'ii7',       bassPc:7  },            // 27 Dm7/G
  { root:0,  q:'maj',   roman:'I',         bassPc:7  },            // 28 C/G
  { root:7,  q:'7',     roman:'V7',        bassPc:7  },            // 29 G7
  { root:9,  q:'min',   roman:'vi',        bassPc:7  },            // 30 Am/G
  { root:7,  q:'7',     roman:'V7',        bassPc:7  },            // 31 G7 — pedal ends
  { root:0,  q:'maj',   roman:'I'           },                     // 32 C — tonic pedal begins
  { root:5,  q:'maj',   roman:'IV',        bassPc:0  },            // 33 F/C
  { root:7,  q:'7',     roman:'V7'          },                     // 34 G7, root position — real V-I bass motion into the final cadence
  { root:0,  q:'maj',   roman:'I'           },                     // 35 C — final
];
function buildBachBar(chord, prevLastMidi){
  const idx = N.findIndex(n => n.root===chord.root && n.q===chord.q);
  const ivs = N[idx].ivs;
  let base = 60 + chord.root; // middle-register start, near the piece's own tessitura
  if(prevLastMidi != null){ // pull into the closest octave to the previous bar's last note
    while(base - prevLastMidi > 6) base -= 12;
    while(prevLastMidi - base > 6) base += 12;
  }
  // "closest to the previous bar" only guarantees smoothness one step at a time — over 35 bars a
  // small per-bar bias compounds into register drift (this used to walk the whole passage upward
  // by over an octave). Keep the passage inside a fixed comfortable window as a backstop.
  while(base > 74) base -= 12;
  while(base < 43) base += 12;
  const seq = [];
  for(let oct=0; seq.length<5; oct++){
    for(const iv of ivs){ seq.push(base + iv + oct*12); if(seq.length>=5) break; }
  }
  const shape = [0,1,2,3,1,2,3,1]; // the prelude's own repeating broken-chord contour
  const notes = shape.map(i => seq[i]);
  const bassPc = chord.bassPc != null ? chord.bassPc : chord.root;
  const bassTarget = base - 12;
  let bass = bassTarget - ((bassTarget%12+12)%12) + bassPc;
  if(bass > bassTarget+6) bass -= 12; else if(bass < bassTarget-6) bass += 12;
  return {
    idx, roman: chord.roman,
    timeSig: [4,4],
    label: N[idx].name,
    // the left hand re-strikes the same bass note halfway through the bar (two half notes) rather
    // than holding one long tone for the whole bar — a single sustained note reads as one pitch,
    // not the piece's harmonic pulse.
    voices: { treble: notes.map(midi => ({ midi, dur:'e' })), bass: [{ midi:bass, dur:'h' }, { midi:bass, dur:'h' }] }
  };
}
let __bachPrevLast = null;
const BACH_PRELUDE = BACH_CHORDS.map(c => {
  const bar = buildBachBar(c, __bachPrevLast);
  __bachPrevLast = bar.voices.treble[bar.voices.treble.length-1].midi;
  return bar;
});

let bachTimer = null, bachFlat = null, bachPos = 0, bachStaffHandle = null;
let bachArcEls = { prev:null, cur:null, next:null };
function bachFlatten(){
  const flat = [];
  BACH_PRELUDE.forEach((bar, mi) => { bar.voices.treble.forEach((ev, ei) => flat.push({ mi, ei, midi:ev.midi })); });
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
    const ev = bachFlat[bachPos], bar = BACH_PRELUDE[ev.mi];
    if(ev.ei === 0){
      bachAdvanceArcs(ev.mi);
      activeChordIdx = bar.idx;
      const label = document.getElementById('musChordLabel'); if(label) label.textContent = chordToneText(bar.idx);
      renderSuggestions();
    }
    // the left hand restrikes the bass note halfway through the bar rather than holding one long
    // tone for the whole bar — without this it reads as a single sustained note, not a harmonic pulse
    if(ev.ei === 0 || ev.ei === 4) playFreqs([m2f(bar.voices.bass[ev.ei===0?0:1].midi)], stepMs/1000*4.5);
    playFreqs([m2f(ev.midi)], stepMs/1000*1.6);
    document.querySelectorAll('#musCof .cofNote.playing').forEach(el => el.classList.remove('playing'));
    const noteEl = document.querySelector('#musCof .cofNote[data-pc="'+mod12(ev.midi)+'"]');
    if(noteEl) noteEl.classList.add('playing');
    if(bachStaffHandle) bachStaffHandle.highlight('treble', ev.mi, ev.ei);
    if(btn) btn.textContent = '■ stop — bar '+(ev.mi+1)+'/'+BACH_PRELUDE.length+': '+N[bar.idx].name+' ('+bar.roman+')';
    bachPos++;
    bachTimer = setTimeout(step, stepMs);
  }
  step();
}
function wireBachPrelude(){
  const btn = document.getElementById('musBachPlay'); if(!btn) return;
  btn.onclick = () => { if(bachTimer) stopBach(); else startBach(); };
  // same 35-bar measure data the staff view above plays through one bar at a time, laid out as
  // a piano roll instead — the whole passage visible at once, for free, from the same data.
  Surfaces.get('pianoroll').render(document.getElementById('musPianoRoll'), BACH_PRELUDE);
}
