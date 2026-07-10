// ---- SURFACE: circle of fifths (SVG) ----
// The first Surfaces entry: the plain map musicians already know, no physics attached.
// Purely structural — draws the main ring, any number of extra concentric "rings" a consumer asks
// for, and (optionally) a caption strip, then hands taps to whoever asked for them. Each consumer
// decides what a tap means: the Simple front door highlights fifths-neighbours, Musical mode sets
// a key. Nothing is shared/global, so two mounted instances never fight over the same element.
//
// opts.rings: [{ id, radius, noteRadius, fn(pc)->derivedPc, suffix, sat, light }, ...] — one entry
// per extra ring, drawn before the main ring so the main ring sits on top. fn maps a main-ring
// position's pitch class to whatever this ring should show there (e.g. its relative minor).
// Adding a new ring later (secondary dominants, parallel keys, whatever) is one more list entry —
// no changes needed here. opts.viewBoxPad gives rings room to sit outside the main ring's radius.
// Mirror this file's shape for the keyboard / staff / fretboard surfaces later.
Surfaces.register('cof', {
  label: 'Circle of fifths',
  render(container, opts){
    if(!container) return;
    opts = opts || {};
    const order = Array.from({length:12}, (_,i)=>(i*7)%12); // fifths order — matches Palette's hue mapping
    const size = 300, cx = size/2, cy = size/2, R = cx-40, r = opts.noteRadius || 22;
    const pad = opts.viewBoxPad || 0;
    let svg = '<svg viewBox="'+(-pad)+' '+(-pad)+' '+(size+2*pad)+' '+(size+2*pad)+'" class="cofSvg">';
    (opts.rings || []).forEach(ring => {
      order.forEach((pc,i)=>{
        const ang = -Math.PI/2 + i*(2*Math.PI/12);
        const x = (cx+ring.radius*Math.cos(ang)).toFixed(1), y = (cy+ring.radius*Math.sin(ang)).toFixed(1);
        const derived = ring.fn(pc);
        const col = Palette.noteCss(derived, ring.sat!=null?ring.sat:.45, ring.light!=null?ring.light:.34);
        svg += '<g class="cofRing cofRing-'+ring.id+'" data-ring="'+ring.id+'" data-pc="'+derived+'"><circle cx="'+x+'" cy="'+y+'" r="'+ring.noteRadius+'" fill="'+col+'"></circle>'+
          '<text x="'+x+'" y="'+y+'" class="cofRingLabel">'+NOTE[derived]+(ring.suffix||'')+'</text></g>';
      });
    });
    order.forEach((pc,i)=>{
      const ang = -Math.PI/2 + i*(2*Math.PI/12);
      const x = (cx+R*Math.cos(ang)).toFixed(1), y = (cy+R*Math.sin(ang)).toFixed(1);
      const col = Palette.noteCss(pc, .62, .58);
      svg += '<g class="cofNote" data-pc="'+pc+'"><circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+col+'"></circle>'+
        '<text x="'+x+'" y="'+y+'" class="cofLabel">'+NOTE[pc]+'</text></g>';
    });
    svg += '</svg>';
    container.innerHTML = svg + (opts.caption === false ? '' : '<div class="cofCaption">'+(opts.initialCaption || 'Tap a note to see how it relates.')+'</div>');
    if(opts.onSelect){
      container.addEventListener('click', e => {
        const g = e.target.closest && e.target.closest('.cofNote');
        if(g) opts.onSelect(+g.dataset.pc, container);
      });
    }
    if(opts.onSelectRing){
      container.addEventListener('click', e => {
        const g = e.target.closest && e.target.closest('.cofRing');
        if(g) opts.onSelectRing(g.dataset.ring, +g.dataset.pc, container);
      });
    }
  },
  refresh(container, opts){ this.render(container, opts); }
});
