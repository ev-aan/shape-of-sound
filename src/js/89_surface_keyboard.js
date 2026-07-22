// ---- SURFACE: piano keyboard (SVG) ----
// One octave, real key shapes, black & white at rest like an actual keyboard — a key only shows
// its note's Palette colour (the same hue used everywhere else in the app, see 01_palette.js)
// once it's pressed, so colour reads as "this key is lit" rather than a constant decorative wash.
// Play mode reads the held set via opts.onChange to figure out what chord you're building.
// Mirror this file's shape for the staff / fretboard surfaces later.
let keyboardInstanceId = 0;
Surfaces.register('keyboard', {
  label: 'Keyboard',
  render(container, opts){
    opts = opts || {};
    if(!container) return;
    const held = new Set();
    const whitePc = [0,2,4,5,7,9,11];
    const blackPc = {0:1, 1:3, 3:6, 4:8, 5:10}; // white-key index -> the black key just after it
    const w=42, H=150, bw=25, bh=96;
    // gradient ids must be unique per instance -- url(#id) refs resolve document-wide in SVG, not
    // scoped to the nearest <svg> root, so two keyboards on one page would otherwise collide
    const uid = 'k'+(keyboardInstanceId++);
    let svg = '<svg viewBox="0 0 '+(w*whitePc.length)+' '+H+'" class="keyboardSvg">'+
      '<defs><linearGradient id="pianoWhiteGrad'+uid+'" x1="0" y1="0" x2="0" y2="1">'+
        '<stop offset="0%" stop-color="#fff"></stop><stop offset="100%" stop-color="#dde1ee"></stop>'+
      '</linearGradient><linearGradient id="pianoBlackGrad'+uid+'" x1="0" y1="0" x2="0" y2="1">'+
        '<stop offset="0%" stop-color="#2a2f42"></stop><stop offset="78%" stop-color="#0c0e17"></stop>'+
      '</linearGradient></defs>';
    whitePc.forEach((pc,i)=>{
      svg += '<rect class="pianoKey white" data-pc="'+pc+'" style="--pc:'+Palette.noteCss(pc,.62,.6)+';fill:url(#pianoWhiteGrad'+uid+')" x="'+(i*w)+'" y="0" width="'+(w-1)+'" height="'+H+'" rx="0" ry="0"></rect>'+
        '<text class="pianoLabel" x="'+(i*w+w/2)+'" y="'+(H-12)+'">'+NOTE[pc]+'</text>';
    });
    Object.keys(blackPc).forEach(k=>{
      const i=+k, pc=blackPc[k], x=(i+1)*w-bw/2;
      svg += '<rect class="pianoKey black" data-pc="'+pc+'" style="--pc:'+Palette.noteCss(pc,.68,.66)+';fill:url(#pianoBlackGrad'+uid+')" x="'+x+'" y="0" width="'+bw+'" height="'+bh+'" rx="0" ry="0"></rect>';
    });
    svg += '</svg>';
    container.innerHTML = svg;
    container.addEventListener('click', e => {
      const k = e.target.closest && e.target.closest('.pianoKey'); if(!k) return;
      const pc = +k.dataset.pc;
      if(held.has(pc)){ held.delete(pc); k.classList.remove('held'); }
      else { held.add(pc); k.classList.add('held'); }
      playFreqs([m2f(60+pc)], .5);
      if(opts.onChange) opts.onChange(new Set(held));
    });
    return { clear(){ held.clear(); container.querySelectorAll('.pianoKey').forEach(k=>k.classList.remove('held')); } };
  }
});
