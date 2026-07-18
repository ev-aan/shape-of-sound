// ---- SURFACE: chord superstructure ----
// How extended chords build on triads: a vertical stack of thirds (root, 3rd, 5th, 7th, 9th,
// 11th, 13th) above a chosen root, major or minor. Notes up to opts.upTo are "built" (lit,
// coloured); the rest are shown dim, as the next thirds still available to stack on — the same
// story every harmony method tells, just drawn instead of only described.
const SS_LABELS = ['Root','3rd','5th','7th','9th','11th','13th'];
const SS_STACK = { major: [0,4,7,11,14,17,21], minor: [0,3,7,10,14,17,20] };
Surfaces.register('superstructure', {
  label: 'Superstructure',
  render(container, opts){
    if(!container) return null;
    const root = mod12(opts.root);
    const quality = opts.quality === 'minor' ? 'minor' : 'major';
    const upTo = Math.max(1, Math.min(7, opts.upTo || 3));
    const steps = SS_STACK[quality];
    const rowH = 34, w = 220, pad = 14;
    const h = pad*2 + rowH*6;
    function yFor(i){ return h - pad - i*rowH; } // root at the bottom, 13th at the top
    let svg = '<svg viewBox="0 0 '+w+' '+h+'" class="ssSvg">';
    for(let i=0;i<7;i++){
      const y = yFor(i), built = i < upTo;
      const midi = 60 + root + steps[i], pc = mod12(midi);
      const col = Palette.noteCss(pc, .68, .62);
      if(i > 0) svg += '<line x1="'+(w/2)+'" x2="'+(w/2)+'" y1="'+(y+rowH)+'" y2="'+y+'" class="ssStem'+(built ? '' : ' ssStem-dim')+'"></line>';
      svg += '<circle cx="'+(w/2)+'" cy="'+y+'" r="11" style="--pc:'+col+'" class="ssNode'+(built ? '' : ' ssNode-dim')+'"></circle>'+
        '<text x="'+(w/2-22)+'" y="'+(y+4)+'" class="ssDegree" text-anchor="end">'+SS_LABELS[i]+'</text>'+
        '<text x="'+(w/2+22)+'" y="'+(y+4)+'" class="ssNoteName" text-anchor="start">'+NOTE[pc]+'</text>';
    }
    svg += '</svg>';
    container.innerHTML = svg;
    return {};
  }
});
