// ---- TONNETZ 3D LATTICE ----
// The classic music-theory grid: move by a fifth along one axis, by a major third along another.
// Neighbouring triads share two notes. This is the "Music Theory Tree" made explorable.
// We place each chord by its ROOT on the Tonnetz plane, lift TRIAD QUALITY into the 3rd dimension,
// and let sevenths/extensions sit slightly outside their triad.
//
// Tonnetz axes (pitch-class space):
//   x  = perfect fifths   (root * 7 mod 12) -> position around, but unwrapped into a line
//   y  = major thirds      (root * 4 mod 12)
// To keep the 12 roots on a readable lattice we use the standard hexagonal Tonnetz coordinates:
//   fifth index p5 = (root * 7) mod 12   (circle-of-fifths position)
//   third index m3 = (root * 4) mod 3    ... we instead use a proven layout: axial coords from
//   (a,b) where root = (7*a + 4*b) mod 12 is hard to invert uniquely, so we use the common
//   "fifths across, thirds up" integer lattice used by most Tonnetz visualisers.
function computeTonnetz(){
  const S = 34; // lattice spacing
  return N.map(n=>{
    const root = n.root;
    // fifths position on the circle (0..11), unwrapped to centre C
    let p5 = (root * 7) % 12; if(p5 > 6) p5 -= 12;         // -5..6 -> centre around 0
    // major-third row: which of the 3 augmented-triad classes the root belongs to
    const m3row = root % 3;                                 // 0,1,2
    // quality lifts into height: major up, minor down, dim lower, aug highest, sevenths outward
    const q = n.q;
    let h = 0, out = 0;
    if(q==='maj'||q==='maj7'||q==='6'||q==='add9') h = 22;
    else if(q==='min'||q==='min7'||q==='mMaj7') h = -22;
    else if(q==='dim'||q==='dim7'||q==='m7b5') h = -46;
    else if(q==='aug') h = 46;
    else h = 0; // sus etc. sit on the plane
    if(n.n>=4) out = 14;                                    // sevenths/extensions nudge outward
    const x = p5 * S;
    const y = (m3row-1) * (S*1.15) + h*0.55;
    const z = h + (out ? out : 0);
    // small quality spread so chords sharing a root don't overlap
    const spread = (QORDER.indexOf(q) - (QORDER.length-1)/2) * 5.0;
    return new THREE.Vector3(x + spread*0.3, y, z + spread*0.6 + out);
  });
}
