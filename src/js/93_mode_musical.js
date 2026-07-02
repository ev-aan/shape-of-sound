// ---- MODE: MUSICAL (theory view — scales, keys, function colouring) ----
Modes.register('musical', {
  label: 'Musical',
  panelId: 'musicalControls',
  onEnter(){
    document.getElementById('scienceControls').style.display = 'none';
    document.getElementById('musicalControls').style.display = '';
    document.getElementById('topbarLabel').textContent = 'Musical — theory, keys, and function';
    refreshMusicalScene();
  },
  onExit(){}
});

let musColorMode = 'function';

function wireMusicalControls(){
  const keySel = document.getElementById('mKeySel');
  keySel.innerHTML = '<option value="-1">— none —</option>' + NOTE.map((nm,i)=>'<option value="'+i+'">'+nm+'</option>').join('');
  const scaleSel = document.getElementById('mScaleSel');
  scaleSel.innerHTML = Object.keys(SCALES).map(id=>'<option value="'+id+'">'+SCALES[id].name+'</option>').join('');
  keySel.value = -1;
  scaleSel.value = 'major';
  keySel.onchange = ()=>{ const val = +keySel.value; View.set({ key: val<0 ? null : val }); refreshMusicalScene(); };
  scaleSel.onchange = ()=>{ View.set({ scale: scaleSel.value }); refreshMusicalScene(); };
  const cp = document.getElementById('mColorPills');
  cp.addEventListener('click', e=>{ const b=e.target.closest('button'); if(!b) return;
    [...cp.querySelectorAll('button')].forEach(x=>x.classList.remove('on'));
    b.classList.add('on'); musColorMode = b.dataset.k; refreshMusicalScene(); });
  const lp = document.getElementById('mLayoutPills');
  lp.addEventListener('click', e=>{ const b=e.target.closest('button'); if(!b) return;
    [...lp.querySelectorAll('button')].forEach(x=>x.classList.remove('on'));
    b.classList.add('on'); setLayout(b.dataset.k); });
  const nb = document.getElementById('mNamesBtn');
  nb.onclick = ()=>{ showNames = !showNames; nb.classList.toggle('on', showNames); positionLabels(); };
  const sc = document.getElementById('mScalesChartBtn'); if(sc) sc.onclick = openScalesChart;
  const scClose = document.getElementById('scalesClose'); if(scClose) scClose.onclick = closeScalesChart;
  const ib = document.getElementById('mInfoBtn'); if(ib) ib.onclick = ()=>alert(
    'Musical mode filters the map to your chosen key + scale.\n\n'+
    'Chord colours (Function mode):\n  Tonic (green) = home\n  Subdominant (amber) = departure\n  Dominant (red) = tension resolving to tonic\n\n'+
    'Try Key: C, Scale: Major. Then Dorian. Then Minor Pentatonic.\n'+
    'Switch Layout: Explained to see the same chords rearranged on the fifths cylinder.');
}

function refreshMusicalScene(){
  const v = View.get();
  if(typeof setRender === 'function') setRender(renderMode);
  applyMusicalColors();
  positionLabels();
  const leg = document.getElementById('mLegend');
  if(leg){
    if(v.key==null){ leg.textContent = '— pick a key + scale to filter the map to that scale\'s chords, coloured by function.'; }
    else {
      const s = SCALES[v.scale];
      const count = N.filter(n=>chordInScale(n, v.scale, v.key)).length;
      leg.textContent = 'Key of '+NOTE[v.key]+' '+s.name+' — '+count+' chords fit this scale. Green=tonic (home). Amber=subdominant (departure). Red=dominant (tension resolving to tonic).';
    }
  }
}

function applyMusicalColors(){
  const v = View.get();
  N.forEach((n,i)=>{
    const c = dots[i].material.color, h = halos[i].material.color;
    if(v.key==null){
      c.set(FAM[n.family]); h.set(FAM[n.family]);
      dots[i].material.opacity = 1; halos[i].material.opacity = .55;
      return;
    }
    const inScale = chordInScale(n, v.scale, v.key);
    if(!inScale){ dots[i].material.opacity = 0; halos[i].material.opacity = 0; return; }
    dots[i].material.opacity = 1; halos[i].material.opacity = .7;
    if(musColorMode === 'root'){
      Palette.applyToTHREE(c, n.root, .68, .6);
      Palette.applyToTHREE(h, n.root, .68, .6);
    } else {
      const fn = chordFn(n, v.scale, v.key) || 'ext';
      const col = Palette.FN[fn] || Palette.FN.ext;
      c.set(col); h.set(col);
    }
  });
}
