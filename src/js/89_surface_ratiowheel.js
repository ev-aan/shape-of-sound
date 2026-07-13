// ---- SURFACE: ratio wheel (circle of fifths, reshaped by ratio-distance from a root) ----
// Same angular layout and note colours as the plain 'cof' surface (so it stays recognizable),
// but each note's DISTANCE FROM THE CENTRE is driven by intervalConsonance() — the same
// ratio-simplicity read the interval visualizer already uses (RATIO's two-integer sum, smaller
// sum = simpler ratio). The chosen root sits nearest the centre; the note with the most complex
// ratio against it sits at the rim. Root is the only thing that changes per render — like 'cof',
// this surface owns no state and hands taps to whoever asked for them via opts.onSelect.
Surfaces.register('ratiowheel', {
  label: 'Ratio wheel',
  render(container, opts){
    if(!container) return;
    opts = opts || {};
    const root = ((opts.root||0) % 12 + 12) % 12;
    const order = Array.from({length:12}, (_,i)=>(i*7)%12); // fifths order — matches Palette's hue mapping
    const size = 300, cx = size/2, cy = size/2, Rmax = cx-40, noteR = opts.noteRadius || 20;
    function radiusFor(pc){
      const iv = (pc - root + 12) % 12;
      const t = (100 - intervalConsonance(iv)) / 100; // 0 = root itself, 1 = the least consonant note here
      return noteR + t * (Rmax - noteR);
    }
    let svg = '<svg viewBox="0 0 '+size+' '+size+'" class="cofSvg ratioWheelSvg">';
    order.forEach(pc => {
      const i = (pc*7)%12, ang = -Math.PI/2 + i*(2*Math.PI/12);
      const r = radiusFor(pc);
      const x = (cx+r*Math.cos(ang)).toFixed(1), y = (cy+r*Math.sin(ang)).toFixed(1);
      svg += '<line x1="'+cx+'" y1="'+cy+'" x2="'+x+'" y2="'+y+'" class="ratioSpoke"></line>';
    });
    order.forEach(pc => {
      const i = (pc*7)%12, ang = -Math.PI/2 + i*(2*Math.PI/12);
      const r = radiusFor(pc);
      const x = (cx+r*Math.cos(ang)).toFixed(1), y = (cy+r*Math.sin(ang)).toFixed(1);
      const col = Palette.noteCss(pc, .62, .58);
      const iv = (pc - root + 12) % 12;
      svg += '<g class="cofNote ratioNote" data-pc="'+pc+'" data-iv="'+iv+'"><circle cx="'+x+'" cy="'+y+'" r="'+noteR+'" fill="'+col+'"></circle>'+
        '<text x="'+x+'" y="'+y+'" class="cofLabel">'+NOTE[pc]+'</text></g>';
    });
    svg += '</svg>';
    container.innerHTML = svg + (opts.caption === false ? '' :
      '<div class="cofCaption">'+(opts.initialCaption || (NOTE[root]+' at the centre — the closer a note sits, the simpler its ratio against '+NOTE[root]+'.'))+'</div>');
    if(opts.onSelect){
      container.addEventListener('click', e => {
        const g = e.target.closest && e.target.closest('.cofNote');
        if(g) opts.onSelect(+g.dataset.pc, container);
      });
    }
  }
});
