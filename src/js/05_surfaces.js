// ---- SURFACES: registry for clean 2D SVG diagrams (circle of fifths, keyboard, staff, fretboard...) ----
// Each surface shares Palette + View, so a note is the same colour everywhere it appears.
// New diagram = one file calling Surfaces.register(id, {label, render(container), refresh(container)}).
const Surfaces = (function(){
  const reg = {};
  function register(id, def){ reg[id] = def; }
  function get(id){ return reg[id]; }
  function list(){ return Object.keys(reg); }
  return { register, get, list };
})();
// shared semitone-axis tick marks (0..12 semitones), used by any surface that draws a note pair
// or triad along a straight axis (interval, triad quality) — one perpendicular tick per semitone,
// so the two orientations (axis drawn horizontally vs. vertically) don't each reimplement the loop.
function tickMarksHorizontal(xFor, y, cssClass){
  let ticks = '';
  for(let s=0; s<=12; s++){ const x = xFor(s); ticks += '<line x1="'+x+'" x2="'+x+'" y1="'+(y-4)+'" y2="'+(y+4)+'" class="'+cssClass+'"></line>'; }
  return ticks;
}
function tickMarksVertical(yFor, x, cssClass){
  let ticks = '';
  for(let s=0; s<=12; s++){ const yy = yFor(s); ticks += '<line x1="'+(x-4)+'" x2="'+(x+4)+'" y1="'+yy+'" y2="'+yy+'" class="'+cssClass+'"></line>'; }
  return ticks;
}
