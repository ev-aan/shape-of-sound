// ---- ELORAH LOGO: the circle of fifths, drawn as the spiral it actually is ----
// Stack twelve real (justly-tuned) perfect fifths — ratio 3:2 each — and you don't land back on
// the note you started from: (3/2)^12 comes out to about 129.75x the starting frequency, not the
// 128x seven even octaves (2^7) would be. That leftover sliver, ~1.01364x (~23.5 cents), is the
// Pythagorean comma — the actual reason the "circle" of fifths is only a circle once it's been
// tempered. This logo uses that exact ratio as the spiral's per-step growth rate: real circle of
// fifths angles (30° per fifth, same order everywhere else in this app — (i*7)%12), real note
// colours (Palette.noteCss), and a radius that compounds by the genuine comma each step. No
// artistic exaggeration — 2.5 loops (30 steps) is already enough for the drift to read clearly.
const ELORAH_COMMA = Math.pow(3/2, 12) / Math.pow(2, 7); // ~1.013643
function elorahLogoSvg(size){
  size = size || 28;
  const steps = 30, cx = 60, cy = 60, r0 = 8;
  let path = '', dots = '';
  for(let i=0; i<=steps; i++){
    const ang = -Math.PI/2 + i*(Math.PI/6);
    const r = r0 * Math.pow(ELORAH_COMMA, i);
    const x = cx + r*Math.cos(ang), y = cy + r*Math.sin(ang);
    path += (i===0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    if(i < steps){
      const pc = (i*7) % 12;
      dots += '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="4.2" fill="'+Palette.noteCss(pc, .72, .6)+'"></circle>';
    }
  }
  return '<svg viewBox="0 0 120 120" width="'+size+'" height="'+size+'" class="elorahLogo" aria-hidden="true">'+
    '<path d="'+path.trim()+'" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".45"></path>'+
    dots+'</svg>';
}
// registered so it's discoverable through Surfaces.list() alongside every other diagram —
// elorahLogoSvg() itself stays a plain string-returning function (still called directly at its
// one existing call site, src/js/99_boot.js), this is just a conforming container/opts wrapper
Surfaces.register('elorahlogo', {
  label: 'Elorah logo',
  render(container, opts){
    if(!container) return;
    container.innerHTML = elorahLogoSvg(opts && opts.size);
  }
});
