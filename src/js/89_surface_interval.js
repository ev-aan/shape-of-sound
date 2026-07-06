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
Surfaces.register('interval', {
  label: 'Interval',
  render(container, opts){
    if(!container) return null;
    const a = ((opts.a % 12) + 12) % 12, b = ((opts.b % 12) + 12) % 12;
    const iv = ((b - a) % 12 + 12) % 12;
    const colA = Palette.noteCss(a, .68, .62), colB = Palette.noteCss(b, .68, .62);
    const w = 300, pad = 30, step = (w - 2*pad) / 12, y = 60, arcY = 26;
    const xFor = semis => pad + semis*step;
    const xa = xFor(0), xb = xFor(iv), midX = (xa + xb) / 2;
    let ticks = '';
    for(let s=0; s<=12; s++){ const x = xFor(s); ticks += '<line x1="'+x+'" x2="'+x+'" y1="'+(y-4)+'" y2="'+(y+4)+'" class="ivTick"></line>'; }
    const svg = '<svg viewBox="0 0 '+w+' 90" class="ivSvg">'+
      '<line x1="'+pad+'" x2="'+(w-pad)+'" y1="'+y+'" y2="'+y+'" class="ivLine"></line>'+
      ticks+
      (iv > 0 ? '<path d="M'+xa+' '+(y-6)+' Q '+midX+' '+arcY+' '+xb+' '+(y-6)+'" class="ivArc"></path>'+
        '<text x="'+midX+'" y="'+(arcY-4)+'" class="ivArcLabel">'+iv+' semitone'+(iv===1?'':'s')+'</text>' : '')+
      '<circle cx="'+xa+'" cy="'+y+'" r="7" style="--pc:'+colA+'" class="ivDot"></circle>'+
      '<circle cx="'+xb+'" cy="'+y+'" r="7" style="--pc:'+colB+'" class="ivDot"></circle>'+
      '<text x="'+xa+'" y="'+(y+22)+'" class="ivNoteLabel">'+NOTE[a]+'</text>'+
      '<text x="'+xb+'" y="'+(y+22)+'" class="ivNoteLabel">'+NOTE[b]+'</text>'+
      '</svg>';
    const cons = intervalConsonance(iv);
    container.innerHTML = svg +
      '<div class="ivInfo">'+
        '<div class="ivName">'+INTERVAL_NAME[iv]+'</div>'+
        '<div class="ivDetail">ratio '+(RATIO[iv]||'1:1')+' &nbsp;·&nbsp; consonance '+cons+'/100 <span class="r">(simple ratio = smoother)</span></div>'+
      '</div>';
    return {};
  }
});
