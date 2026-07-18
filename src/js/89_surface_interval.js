// ---- SURFACE: interval visualizer ----
// A small, standalone "distance between these two notes" diagram: semitone count, interval
// name, the classic small-integer ratio (RATIO, already used in the chord detail card), and a
// consonance read derived from that ratio's simplicity (smaller numbers = smoother) — the
// simple-ratio model, not the physics-based roughness model behind the 3D map. Deliberately a
// smaller, standalone tool rather than a substitute for that map.
const INTERVAL_NAME = ['Unison','Minor 2nd','Major 2nd','Minor 3rd','Major 3rd','Perfect 4th',
  'Tritone','Perfect 5th','Minor 6th','Major 6th','Minor 7th','Major 7th'];
function intervalConsonance(iv){
  const [a, b] = (RATIO[iv] || '1:1').split(':').map(Number);
  const sum = a + b, minSum = 2, maxSum = 31; // 1:1 (unison) .. 16:15 (minor 2nd), the simplest/densest ratios in RATIO
  return Math.round(100 * (1 - (sum - minSum) / (maxSum - minSum)));
}
// horizontal reads well laid over a piano keyboard (semitones as physical key-distance); vertical
// stacks the two notes the way theory books draw an interval on a staff (lower note at the
// bottom) — same data, two honest readings of it, not one "correct" layout.
function intervalSvgHorizontal(a, b, iv, colA, colB){
  const w = 300, pad = 30, step = (w - 2*pad) / 12, y = 60, arcY = 26;
  const xFor = semis => pad + semis*step;
  const xa = xFor(0), xb = xFor(iv), midX = (xa + xb) / 2;
  return '<svg viewBox="0 0 '+w+' 90" class="ivSvg">'+
    '<line x1="'+pad+'" x2="'+(w-pad)+'" y1="'+y+'" y2="'+y+'" class="ivLine"></line>'+
    tickMarksHorizontal(xFor, y, 'ivTick')+
    (iv > 0 ? '<path d="M'+xa+' '+(y-6)+' Q '+midX+' '+arcY+' '+xb+' '+(y-6)+'" class="ivArc"></path>'+
      '<text x="'+midX+'" y="'+(arcY-4)+'" class="ivArcLabel">'+iv+' semitone'+(iv===1?'':'s')+'</text>' : '')+
    '<circle cx="'+xa+'" cy="'+y+'" r="7" style="--pc:'+colA+'" class="ivDot"></circle>'+
    '<circle cx="'+xb+'" cy="'+y+'" r="7" style="--pc:'+colB+'" class="ivDot"></circle>'+
    '<text x="'+xa+'" y="'+(y+22)+'" class="ivNoteLabel">'+NOTE[a]+'</text>'+
    '<text x="'+xb+'" y="'+(y+22)+'" class="ivNoteLabel">'+NOTE[b]+'</text>'+
    '</svg>';
}
function intervalSvgVertical(a, b, iv, colA, colB){
  const w = 195, h = 230, pad = 26, step = (h - 2*pad) / 12, cx = 70, arcX = cx + 24;
  const yFor = semis => (h - pad) - semis*step; // higher semitone = higher up, lower note at the bottom
  const ya = yFor(0), yb = yFor(iv), midY = (ya + yb) / 2;
  return '<svg viewBox="0 0 '+w+' '+h+'" class="ivSvg ivSvg-vert">'+
    '<line x1="'+cx+'" x2="'+cx+'" y1="'+pad+'" y2="'+(h-pad)+'" class="ivLine"></line>'+
    tickMarksVertical(yFor, cx, 'ivTick')+
    (iv > 0 ? '<path d="M'+(cx+6)+' '+ya+' Q '+arcX+' '+midY+' '+(cx+6)+' '+yb+'" class="ivArc"></path>'+
      '<text x="'+(arcX+5)+'" y="'+(midY+3)+'" class="ivArcLabel ivArcLabelVert">'+iv+' semitone'+(iv===1?'':'s')+'</text>' : '')+
    '<circle cx="'+cx+'" cy="'+ya+'" r="7" style="--pc:'+colA+'" class="ivDot"></circle>'+
    '<circle cx="'+cx+'" cy="'+yb+'" r="7" style="--pc:'+colB+'" class="ivDot"></circle>'+
    '<text x="'+(cx-14)+'" y="'+(ya+4)+'" class="ivNoteLabel ivNoteLabelVert">'+NOTE[a]+'</text>'+
    '<text x="'+(cx-14)+'" y="'+(yb+4)+'" class="ivNoteLabel ivNoteLabelVert">'+NOTE[b]+'</text>'+
    '</svg>';
}
Surfaces.register('interval', {
  label: 'Interval',
  render(container, opts){
    if(!container) return null;
    const a = mod12(opts.a), b = mod12(opts.b);
    const iv = mod12(b - a);
    const colA = Palette.noteCss(a, .68, .62), colB = Palette.noteCss(b, .68, .62);
    const svg = opts.orientation === 'vertical' ? intervalSvgVertical(a, b, iv, colA, colB) : intervalSvgHorizontal(a, b, iv, colA, colB);
    // an explicit opts.level, not a View.get() read — this surface stays stateless like cof and
    // superstructure, and callers that never pass level (direct-render call sites) keep seeing
    // everything, unaffected by whatever the app's Beginner/Advanced setting happens to be.
    const advanced = opts.level !== 'beginner';
    const cons = intervalConsonance(iv);
    container.innerHTML = svg +
      '<div class="ivInfo">'+
        '<div class="ivName">'+INTERVAL_NAME[iv]+'</div>'+
        (advanced ? '<div class="ivDetail">ratio '+(RATIO[iv]||'1:1')+' &nbsp;·&nbsp; consonance '+cons+'/100 <span class="r">(simple ratio = smoother)</span></div>' : '')+
      '</div>';
    return {};
  }
});
