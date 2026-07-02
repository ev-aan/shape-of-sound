// ---- PALETTE: one source of truth for note & function colours ----
// pitch class -> fifths index -> hue on the colour wheel
// C=red, G=orange, D=yellow, A=green(ish), E=green-cyan, B=teal, F#=cyan, C#=azure, G#=indigo, D#=violet, A#=magenta, F=rose
// This is the "circle of fifths" mapping (Scriabin-family). A note keeps its colour EVERYWHERE in the app.
const Palette = (function(){
  const NOTE_HUE = new Array(12);
  for(let pc=0; pc<12; pc++){ NOTE_HUE[pc] = ((pc*7)%12)/12; }
  function hsl(h,s,l){ return 'hsl('+Math.round(h*360)+','+Math.round(s*100)+'%,'+Math.round(l*100)+'%)'; }
  function noteHue(pc){ return NOTE_HUE[((pc%12)+12)%12]; }
  function noteCss(pc, s=.62, l=.62){ return hsl(noteHue(pc), s, l); }
  function applyToTHREE(color, pc, s=.62, l=.62){ color.setHSL(noteHue(pc), s, l); return color; }
  // function colours (Tonic/Subdominant/Dominant) — kept from existing FN palette
  const FN = { T:'#7BE0A5', S:'#F0C36B', D:'#F17A6E', ext:'#8fa4c9' };
  return { noteHue, noteCss, applyToTHREE, FN };
})();
