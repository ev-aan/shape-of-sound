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
