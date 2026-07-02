// ---- SURFACE: circle of fifths (SVG) ----
// The first Surfaces entry: the plain map musicians already know, no physics attached.
// Mirror this file's shape for the keyboard / staff / fretboard surfaces later.
Surfaces.register('cof', {
  label: 'Circle of fifths',
  render(container){
    if(!container) return;
    const order = Array.from({length:12}, (_,i)=>(i*7)%12); // fifths order — matches Palette's hue mapping
    const size = 300, cx = size/2, cy = size/2, R = cx-40, r = 22;
    let svg = '<svg viewBox="0 0 '+size+' '+size+'" class="cofSvg">';
    order.forEach((pc,i)=>{
      const ang = -Math.PI/2 + i*(2*Math.PI/12);
      const x = (cx+R*Math.cos(ang)).toFixed(1), y = (cy+R*Math.sin(ang)).toFixed(1);
      const col = Palette.noteCss(pc, .62, .58);
      svg += '<g class="cofNote" data-pc="'+pc+'"><circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+col+'"></circle>'+
        '<text x="'+x+'" y="'+y+'" class="cofLabel">'+NOTE[pc]+'</text></g>';
    });
    svg += '</svg>';
    container.innerHTML = svg + '<div class="cofCaption" id="cofCaption">Tap a note to see how it relates.</div>';
  },
  refresh(container){ this.render(container); }
});

// tap a note: highlight it and its two perfect-fifth neighbours, name the relation in plain language
document.addEventListener('click', e => {
  const g = e.target.closest && e.target.closest('.cofNote');
  if(!g) return;
  const pc = +g.dataset.pc;
  document.querySelectorAll('.cofNote').forEach(n => n.classList.remove('sel','near'));
  g.classList.add('sel');
  const up = (pc+7)%12, down = (pc+5)%12;
  document.querySelectorAll('.cofNote').forEach(n => { if(+n.dataset.pc===up || +n.dataset.pc===down) n.classList.add('near'); });
  const cap = document.getElementById('cofCaption');
  if(cap) cap.textContent = NOTE[pc]+' blends best with '+NOTE[up]+' and '+NOTE[down]+' — a perfect fifth away in either direction.';
});
