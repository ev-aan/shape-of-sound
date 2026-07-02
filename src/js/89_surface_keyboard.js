// ---- SURFACE: piano keyboard (SVG) ----
// One octave, real key shapes, Palette-tinted. Tapping a key plays it and toggles it "held" —
// Play mode reads the held set via opts.onChange to figure out what chord you're building.
// Mirror this file's shape for the staff / fretboard surfaces later.
Surfaces.register('keyboard', {
  label: 'Keyboard',
  render(container, opts){
    opts = opts || {};
    if(!container) return;
    const held = new Set();
    const whitePc = [0,2,4,5,7,9,11];
    const blackPc = {0:1, 1:3, 3:6, 4:8, 5:10}; // white-key index -> the black key just after it
    const w=42, H=150, bw=26, bh=94;
    let svg = '<svg viewBox="0 0 '+(w*whitePc.length)+' '+H+'" class="keyboardSvg">';
    whitePc.forEach((pc,i)=>{
      svg += '<rect class="pianoKey white" data-pc="'+pc+'" x="'+(i*w)+'" y="0" width="'+(w-1)+'" height="'+H+'" rx="4" fill="'+Palette.noteCss(pc,.5,.92)+'"></rect>'+
        '<text class="pianoLabel" x="'+(i*w+w/2)+'" y="'+(H-12)+'">'+NOTE[pc]+'</text>';
    });
    Object.keys(blackPc).forEach(k=>{
      const i=+k, pc=blackPc[k], x=(i+1)*w-bw/2;
      svg += '<rect class="pianoKey black" data-pc="'+pc+'" x="'+x+'" y="0" width="'+bw+'" height="'+bh+'" rx="3" fill="'+Palette.noteCss(pc,.55,.3)+'"></rect>';
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
