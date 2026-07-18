// ---- SCALES: pitch-class sets sourced from standard music theory ----
// A chord belongs to (key, scale) if every one of its pitch classes lies in the scale.
const SCALES = {
  major:      { name:'Major',            pcs:[0,2,4,5,7,9,11] },
  minor:      { name:'Natural Minor',    pcs:[0,2,3,5,7,8,10] },
  harmonic:   { name:'Harmonic Minor',   pcs:[0,2,3,5,7,8,11] },
  majharm:    { name:'Harmonic Major',   pcs:[0,2,4,5,7,8,11] },
  pentmaj:    { name:'Major Pentatonic', pcs:[0,2,4,7,9] },
  pentmin:    { name:'Minor Pentatonic', pcs:[0,3,5,7,10] },
  pmajblues:  { name:'Major Pent Blues', pcs:[0,2,3,4,7,10] },
  pminblues:  { name:'Minor Pent Blues', pcs:[0,3,5,6,7,10] },
  wholetone:  { name:'Whole Tone',       pcs:[0,2,4,6,8,10] },
  dorian:     { name:'Dorian',           pcs:[0,2,3,5,7,9,10] },
  phrygian:   { name:'Phrygian',         pcs:[0,1,3,5,7,8,10] },
  lydian:     { name:'Lydian',           pcs:[0,2,4,6,7,9,11] },
  mixolydian: { name:'Mixolydian',       pcs:[0,2,4,5,7,9,10] },
  locrian:    { name:'Locrian',          pcs:[0,1,3,5,6,8,10] }
};
// scale-degree -> functional role. Extended for 7-note scales; short scales fall through to null.
const DEG_FN_7 = ['T','S','T','S','D','T','D']; // I ii iii IV V vi vii°
function scalePcs(scaleId, keyRoot){
  const s = SCALES[scaleId]; if(!s || keyRoot==null) return null;
  const set = new Set(s.pcs.map(pc => (pc + keyRoot) % 12));
  return set;
}
function chordInScale(n, scaleId, keyRoot){
  const set = scalePcs(scaleId, keyRoot); if(!set) return true;
  const pcs = n.pcs || (n.ivs||[]).map(iv => mod12(n.root + iv));
  for(const pc of pcs){ if(!set.has(mod12(pc))) return false; }
  return true;
}
function chordDegreeIn(n, scaleId, keyRoot){
  const s = SCALES[scaleId]; if(!s || keyRoot==null) return null;
  const deg = s.pcs.indexOf(mod12(n.root - keyRoot));
  return deg >= 0 ? deg : null;
}
function chordFn(n, scaleId, keyRoot){
  const deg = chordDegreeIn(n, scaleId, keyRoot);
  if(deg == null) return null;
  const s = SCALES[scaleId];
  if(s.pcs.length === 7) return DEG_FN_7[deg];
  // for pentatonics/wholetone: tonic on degree 0, everything else neutral
  return deg === 0 ? 'T' : 'ext';
}
