// ---- SURFACE: harmonics (timbre / overtones) ----
// A fundamental, its overtones (small traces stacked above), and their sum (one bold composite
// trace below) -- the same fundamental frequency can carry very different overtone "recipes"
// (opts.mix), and that recipe alone is what makes the composite wave shape different even
// though the pitch (how often it repeats) never changes. Reuses buildSinePath (00_core.js).
const HM_W = 600, HM_H = 140, HM_BASE_CYCLES = 4;
// weight per harmonic number (index 0 = fundamental/1st, index 1 = 2nd, ...); a 0/missing entry
// means that harmonic isn't present at all in this recipe, not just quiet.
const HM_MIXES = {
  'fundamental-only': [1],
  'plus-2nd':         [1, 0.5],
  'rich-mix-a':       [1, 0.5, 0.33, 0.22],
  'rich-mix-b':       [1, 0, 0.55, 0, 0.3] // odd harmonics only -- a genuinely different recipe, same fundamental
};
function hmCompositePath(weights){
  const total = weights.reduce((s,w) => s + Math.abs(w), 0) || 1;
  const midY = 112, ampPx = 20;
  const pts = [];
  for(let x=0; x<=HM_W; x+=4){
    let y = 0;
    weights.forEach((w,k) => { if(w) y += w * Math.sin(2*Math.PI*(k+1)*HM_BASE_CYCLES*x/HM_W); });
    pts.push((x===0?'M':'L')+x.toFixed(1)+','+(midY + ampPx*(y/total)).toFixed(1));
  }
  return pts.join(' ');
}
Surfaces.register('harmonics', {
  label: 'Harmonics',
  render(container, opts){
    if(!container) return null;
    opts = opts || {};
    const weights = HM_MIXES[opts.mix] || HM_MIXES['fundamental-only'];
    const laneYs = [14, 30, 46, 62, 78];
    let lanes = '';
    weights.forEach((w,k) => {
      if(!w) return; // this harmonic isn't part of the recipe -- no lane, not just a flat line
      const y = laneYs[k] != null ? laneYs[k] : (14 + k*16);
      const d = buildSinePath(HM_W, HM_H, y, (k+1)*HM_BASE_CYCLES, 7*Math.min(1, Math.abs(w)*1.4));
      lanes += '<path d="'+d+'" class="hmComponent"></path>';
    });
    const composite = hmCompositePath(weights);
    container.innerHTML = '<svg viewBox="0 0 '+HM_W+' '+HM_H+'" class="sciWaveSvg hmSvg" data-mix="'+opts.mix+'">'+
      lanes + '<line x1="0" y1="92" x2="'+HM_W+'" y2="92" class="hmDivider"></line>'+
      '<path d="'+composite+'" class="hmComposite"></path></svg>';
    return {};
  }
});
