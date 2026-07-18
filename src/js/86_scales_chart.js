// ---- SCALES REFERENCE CHART ----
// A palette-tinted lookup table like the classic ScalesAndModes chart, but interactive:
// the current key + scale row is highlighted, cells that ARE in the scale glow with the note's palette colour.
const NAT = ['C','D','E','F','G','A','B']; // for pretty spelling; fallback to NOTE
function pcName(pc, keyRoot){
  // simple spelling: prefer sharps; keys with flats show flats
  const flatKeys = new Set([1,3,5,6,8,10]);
  const useFlats = flatKeys.has(keyRoot||0);
  const flatN = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  const shpN  = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  return (useFlats ? flatN : shpN)[mod12(pc)];
}
function renderScalesChart(){
  const host = document.getElementById('scalesChart'); if(!host) return;
  const v = View.get();
  const key = v.key == null ? 0 : v.key;
  const activeScale = v.scale || 'major';
  const rows = [];
  rows.push('<div class="sc-hdr"><div class="sc-name">Scales in '+NOTE[key]+'</div>'+
    Array.from({length:12},(_,i)=>{
      const pc = (i + key) % 12;
      const c = Palette.noteCss(pc, .72, .65);
      return '<div class="sc-col" style="--pc:'+c+'"><span class="sc-dot"></span>'+pcName(pc, key)+'</div>';
    }).join('')+'</div>');
  for(const id of Object.keys(SCALES)){
    const s = SCALES[id];
    const set = new Set(s.pcs);
    const cells = Array.from({length:12},(_,i)=>{
      const rel = i; // interval from the tonic
      const pc = (rel + key) % 12;
      if(set.has(rel)){
        const c = Palette.noteCss(pc, .72, .58);
        return '<div class="sc-cell on" style="--pc:'+c+'">'+pcName(pc, key)+'</div>';
      }
      return '<div class="sc-cell"></div>';
    }).join('');
    rows.push('<div class="sc-row '+(id===activeScale?'active':'')+'" data-sid="'+id+'"><div class="sc-name">'+s.name+'</div>'+cells+'</div>');
  }
  host.innerHTML = rows.join('');
}
// registered so it's discoverable through the same Surfaces.list() every other diagram is —
// a thin wrapper only, not a full container/opts-driven rewrite: renderScalesChart() still reads
// its own hardcoded #scalesChart element and View.get() directly, so the container/opts args
// here are accepted for shape-conformance but not actually used yet.
Surfaces.register('scaleschart', {
  label: 'Scales chart',
  render(container, opts){ renderScalesChart(); }
});
function openScalesChart(){
  document.getElementById('scalesPanel').classList.add('show');
  renderScalesChart();
}
function closeScalesChart(){
  document.getElementById('scalesPanel').classList.remove('show');
}
// clicking a row switches to that scale (only meaningful in Musical mode)
document.addEventListener('click', e => {
  const row = e.target.closest && e.target.closest('.sc-row[data-sid]');
  if(!row) return;
  const sid = row.dataset.sid;
  const ss = document.getElementById('mScaleSel');
  if(ss){ ss.value = sid; }
  View.set({ scale: sid });
  if(View.get().mode === 'musical' && typeof refreshMusicalScene === 'function') refreshMusicalScene();
  renderScalesChart();
});
