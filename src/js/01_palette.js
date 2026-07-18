// mod12: the pitch-class-wraparound idiom used all over this app (a MIDI note, an interval sum,
// a transposed root — anything that must land in 0..11 even when the input is negative, since
// JS's % keeps the sign of its operand rather than always returning a positive remainder).
// Bare top-level helper (not on Palette) since callers reach for it well before pitch/colour is
// involved — e.g. plain interval-distance math.
function mod12(x){ return ((x % 12) + 12) % 12; }
// the circle of fifths in traversal order (index 0 = the root, index 1 = a fifth above, ...) —
// matches Palette's own hue mapping below (i*7)%12, so any surface walking "around the circle"
// draws notes in the same order they're coloured.
const FIFTHS_ORDER = Array.from({ length: 12 }, (_, i) => mod12(i * 7));
// ---- PALETTE: one source of truth for note & function colours ----
// pitch class -> fifths index -> hue on the colour wheel
// C=red, G=orange, D=yellow, A=green(ish), E=green-cyan, B=teal, F#=cyan, C#=azure, G#=indigo, D#=violet, A#=magenta, F=rose
// This is the "circle of fifths" mapping (Scriabin-family). A note keeps its colour EVERYWHERE in the app.
const Palette = (function(){
  const NOTE_HUE = new Array(12);
  for(let pc=0; pc<12; pc++){ NOTE_HUE[pc] = ((pc*7)%12)/12; }
  function hsl(h,s,l){ return 'hsl('+Math.round(h*360)+','+Math.round(s*100)+'%,'+Math.round(l*100)+'%)'; }
  function noteHue(pc){ return NOTE_HUE[mod12(pc)]; }
  function noteCss(pc, s=.62, l=.62){ return hsl(noteHue(pc), s, l); }
  function applyToTHREE(color, pc, s=.62, l=.62){ color.setHSL(noteHue(pc), s, l); return color; }
  // function colours (Tonic/Subdominant/Dominant) — kept from existing FN palette
  const FN = { T:'#7BE0A5', S:'#F0C36B', D:'#F17A6E', ext:'#8fa4c9' };
  return { noteHue, noteCss, applyToTHREE, FN };
})();
