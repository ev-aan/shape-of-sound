// ---- SURFACE: staff notation (measure/score engine) ----
// Not full engraving (no beam/stem rules, no tuplets) — but genuinely general: any mix of
// note durations and rests, one measure or many, one voice (a single staff) or two (a grand
// staff), reusable by any future teaching content, not just one piece.
//
// A "measure" is: { timeSig:[4,4] (optional), label:'Cmaj' (optional), voices:{ treble:[...],
// bass:[...] } }. A voice is a list of events in time order: { midi, dur } for a note (midi
// may be an array for a chord), or { rest:true, dur }. dur is one of w/h/q/e/s, optionally
// dotted ('q.'). Which staff(s) get drawn is decided once for the whole render() call, from
// whichever voices actually appear across the measures — a single treble-only measure draws
// one staff, not a grand staff it doesn't need.
//
// render(container, measures, opts) takes one key signature for the whole call — opts.keySig,
// a signed sharps/flats count (+2 = D major, -3 = Eb major, 0/omitted = C major, matching prior
// behaviour exactly). Flat keys are spelled with the flat table below rather than forced into
// sharps, which is also why F#/Gb land on different staff lines: real notation, not just two
// names for the same key. Notes already implied by the signature drop their inline accidental;
// a note that cancels one shows a natural sign instead.
//
// Colour is a pure CSS toggle, not a render option: every notehead always carries its pitch
// class as a --pc custom property: consumers add/remove a class on the container to switch
// between the default (var(--ink), standard black & white) and var(--pc) (colour mode) —
// instant, no re-render, even at full-score width.
const LETTER_STEP = { C:0, D:1, E:2, F:3, G:4, A:5, B:6 };
const LETTER_PC = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
const NOTE_FLAT = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const SHARP_ORDER = ['F','C','G','D','A','E','B'];
const FLAT_ORDER = ['B','E','A','D','G','C','F'];
// standard key-signature glyph positions, as fixed reference pitches (all natural letters, so
// spelling-table choice can't affect them) — independent of whatever's actually in the piece.
const KEYSIG_REF_MIDI = {
  treble: { sharp:[77,72,79,74,69,76,71], flat:[71,76,69,74,67,72,65] }, // F5 C5 G5 D5 A4 E5 B4 / B4 E5 A4 D5 G4 C5 F4
  bass:   { sharp:[65,60,67,62,57,64,59], flat:[59,64,57,62,55,60,53] }, // F4 C4 G4 D4 A3 E4 B3 / B3 E4 A3 D4 G3 C4 F3
};
const DUR_BEATS = { w:4, h:2, q:1, e:.5, s:.25 };
function durBeats(dur){
  const dotted = dur[dur.length-1]==='.';
  const base = DUR_BEATS[dotted ? dur.slice(0,-1) : dur] || 1;
  return dotted ? base*1.5 : base;
}
function measureBeats(timeSig){ const ts = timeSig || [4,4]; return ts[0] * (4/ts[1]); }
function midiToDiatonic(midi, useFlats){
  const pc = ((midi%12)+12)%12, octave = Math.floor(midi/12)-1;
  const name = (useFlats ? NOTE_FLAT : NOTE)[pc], letter = name[0];
  const level = name.length>1 ? (useFlats ? -1 : 1) : 0; // +1 sharp, -1 flat, 0 natural
  return { diatonic: octave*7 + LETTER_STEP[letter], letter, level };
}
Surfaces.register('staff', {
  label: 'Staff',
  render(container, measures, opts){
    if(!container) return null;
    const keySig = (opts && opts.keySig) || 0;
    const sharpsCount = keySig > 0 ? keySig : 0, flatsCount = keySig < 0 ? -keySig : 0;
    const useFlats = flatsCount > 0;
    const alteredLetters = new Map();
    SHARP_ORDER.slice(0, sharpsCount).forEach(l => alteredLetters.set(l, 1));
    FLAT_ORDER.slice(0, flatsCount).forEach(l => alteredLetters.set(l, -1));
    function accidentalFor(letter, level){
      const keyLevel = alteredLetters.get(letter) || 0;
      if(level === keyLevel) return ''; // already implied by the key signature
      if(level === 0) return '♮'; // cancels a sharp/flat the signature implies
      return level > 0 ? '♯' : '♭';
    }
    const lg = 8, barW = 80, clefX = 56;
    const sigCount = sharpsCount + flatsCount;
    const startX = clefX + (sigCount ? sigCount*9 + 10 : 0);
    const hasTreble = measures.some(m => m.voices && m.voices.treble && m.voices.treble.length);
    const hasBass = measures.some(m => m.voices && m.voices.bass && m.voices.bass.length);
    const clefs = []; if(hasTreble || !hasBass) clefs.push('treble'); if(hasBass) clefs.push('bass');
    const geom = {}; let gy = 20;
    clefs.forEach(clef => { geom[clef] = { top:gy, midY:gy+2*lg, midD:clef==='treble'?34:22 }; gy += 70; });
    const bottomY = gy-70+4*lg, staffH = bottomY+25;
    const staffW = startX + Math.max(1, measures.length)*barW + 20;
    function yFor(midi, clef){ const { diatonic } = midiToDiatonic(midi, useFlats), g = geom[clef]; return g.midY - (diatonic-g.midD)*(lg/2); }
    function ledgers(midi, clef, x){
      const { diatonic } = midiToDiatonic(midi, useFlats), g = geom[clef];
      const above = Math.floor((diatonic-(g.midD+4))/2), below = Math.floor(((g.midD-4)-diatonic)/2);
      let svg = '';
      for(let k=1;k<=above;k++){ const d=g.midD+4+2*k, y=g.midY-(d-g.midD)*(lg/2); svg += '<line x1="'+(x-6)+'" x2="'+(x+6)+'" y1="'+y+'" y2="'+y+'" class="staffLedger"/>'; }
      for(let k=1;k<=below;k++){ const d=g.midD-4-2*k, y=g.midY-(d-g.midD)*(lg/2); svg += '<line x1="'+(x-6)+'" x2="'+(x+6)+'" y1="'+y+'" y2="'+y+'" class="staffLedger"/>'; }
      return svg;
    }
    function notehead(midi, clef, x, mi, vi, ei){
      const y = yFor(midi, clef), { letter, level } = midiToDiatonic(midi, useFlats), acc = accidentalFor(letter, level);
      const pc = ((midi%12)+12)%12, col = Palette.noteCss(pc, .68, .62); // same note, same colour, everywhere
      return ledgers(midi, clef, x) + (acc ? '<text x="'+(x-9)+'" y="'+(y+3)+'" class="staffAcc">'+acc+'</text>' : '') +
        '<ellipse cx="'+x+'" cy="'+y+'" rx="4.2" ry="3.2" style="--pc:'+col+'" class="staffNote" data-bar="'+mi+'" data-voice="'+vi+'" data-event="'+ei+'"></ellipse>';
    }
    function restGlyph(x, clef){ const y = geom[clef].midY; return '<rect x="'+(x-5)+'" y="'+(y-1.5)+'" width="10" height="3" rx="1" class="staffRest"></rect>'; }
    function keySigGlyphs(clef){
      if(!sigCount) return '';
      const refs = useFlats ? KEYSIG_REF_MIDI[clef].flat : KEYSIG_REF_MIDI[clef].sharp;
      const glyph = useFlats ? '♭' : '♯';
      let svg = '';
      for(let i=0;i<sigCount;i++){ const y = yFor(refs[i], clef); svg += '<text x="'+(clefX+8+i*9)+'" y="'+(y+3)+'" class="staffAcc">'+glyph+'</text>'; }
      return svg;
    }
    let svg = '<svg viewBox="0 0 '+staffW+' '+staffH+'" class="staffSvg">';
    clefs.forEach(clef => {
      for(let i=0;i<5;i++) svg += '<line x1="'+startX+'" x2="'+(staffW-10)+'" y1="'+(geom[clef].top+i*lg)+'" y2="'+(geom[clef].top+i*lg)+'" class="staffLine"></line>';
      // the SMuFL/Unicode clef glyphs (U+1D11E, U+1D122) aren't reliably covered by common
      // system fonts (measured ~11px wide for a 34px font here, vs ~29px for a plain letter)
      // — plain labels render everywhere, which matters more than authenticity here.
      svg += '<text x="'+(clefX-6)+'" y="'+(geom[clef].midY+4)+'" class="staffClef">'+clef+'</text>';
      svg += keySigGlyphs(clef);
    });
    measures.forEach((m, mi) => {
      const barX = startX + mi*barW, innerLeft = barX+14, innerW = barW-22;
      svg += '<line x1="'+barX+'" x2="'+barX+'" y1="'+geom[clefs[0]].top+'" y2="'+bottomY+'" class="staffBarline"></line>';
      if(m.label) svg += '<text x="'+(barX+barW/2)+'" y="12" class="staffChordName" data-bar="'+mi+'">'+m.label+'</text>';
      const totalBeats = measureBeats(m.timeSig);
      clefs.forEach(clef => {
        let cum = 0;
        ((m.voices && m.voices[clef]) || []).forEach((ev, ei) => {
          const x = innerLeft + (cum/totalBeats)*innerW;
          if(ev.rest) svg += restGlyph(x, clef);
          else (Array.isArray(ev.midi) ? ev.midi : [ev.midi]).forEach(midi => { svg += notehead(midi, clef, x, mi, clef, ei); });
          cum += durBeats(ev.dur);
        });
      });
    });
    const lastX = startX + measures.length*barW;
    svg += '<line x1="'+lastX+'" x2="'+lastX+'" y1="'+geom[clefs[0]].top+'" y2="'+bottomY+'" class="staffBarline staffFinal"></line>';
    svg += '</svg>';
    container.innerHTML = svg;
    return {
      // voice: 'treble'|'bass', mi: measure index, ei: event index within that voice —
      // selects every notehead sharing them (a chord event highlights as one unit)
      highlight(voice, mi, ei){
        container.querySelectorAll('.staffNote.on').forEach(e => e.classList.remove('on'));
        const sel = container.querySelectorAll('.staffNote[data-bar="'+mi+'"][data-voice="'+voice+'"][data-event="'+ei+'"]');
        sel.forEach(el => el.classList.add('on'));
        if(sel[0] && sel[0].scrollIntoView) sel[0].scrollIntoView({ block:'nearest', inline:'center', behavior:'smooth' });
      }
    };
  }
});
