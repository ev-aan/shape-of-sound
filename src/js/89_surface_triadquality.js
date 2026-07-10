// ---- SURFACE: triad quality comparison ----
// Suspended, diminished and augmented triads are usually taught as separate one-off rules.
// Drawn on the same semitone axis, against a ghost outline of the major triad they're each one
// step away from, the shared pattern shows through: sus chords swap out the 3rd only (for a
// 2nd or a 4th), diminished flattens both the 3rd and the 5th, augmented raises just the 5th.
const TQ_ROWS = [
  { q:'major', label:'Major',         ivs:[0,4,7], tones:['R','3rd','5th'] },
  { q:'sus2',  label:'Suspended 2nd', ivs:[0,2,7], tones:['R','2nd','5th'] },
  { q:'sus4',  label:'Suspended 4th', ivs:[0,5,7], tones:['R','4th','5th'] },
  { q:'dim',   label:'Diminished',    ivs:[0,3,6], tones:['R','♭3rd','♭5th'] },
  { q:'aug',   label:'Augmented',     ivs:[0,4,8], tones:['R','3rd','♯5th'] },
];
const TQ_MAJOR_IVS = TQ_ROWS[0].ivs; // [0,4,7] — the reference every other row is drawn against

function tqRowSvg(root, row){
  const w = 300, pad = 30, step = (w - 2*pad) / 12, y = 30;
  const xFor = semis => pad + semis*step;
  let ticks = '';
  for(let s=0; s<=12; s++){ const x = xFor(s); ticks += '<line x1="'+x+'" x2="'+x+'" y1="'+(y-4)+'" y2="'+(y+4)+'" class="tqTick"></line>'; }
  // ghost outlines: major-triad tone positions this row replaces (root is always shared, skip it)
  let ghosts = '';
  TQ_MAJOR_IVS.forEach(iv => {
    if(iv !== 0 && row.ivs.indexOf(iv) < 0) ghosts += '<circle cx="'+xFor(iv)+'" cy="'+y+'" r="8" class="tqGhost"></circle>';
  });
  let dots = '';
  row.ivs.forEach((iv, i) => {
    const pc = ((root+iv) % 12 + 12) % 12, col = Palette.noteCss(pc, .68, .62);
    dots += '<circle cx="'+xFor(iv)+'" cy="'+y+'" r="8" style="--pc:'+col+'" class="tqDot"></circle>'+
      '<text x="'+xFor(iv)+'" y="'+(y-13)+'" class="tqToneLabel">'+row.tones[i]+'</text>'+
      '<text x="'+xFor(iv)+'" y="'+(y+23)+'" class="tqNoteLabel">'+NOTE[pc]+'</text>';
  });
  return '<svg viewBox="0 0 '+w+' 58" class="tqSvg">'+
    '<line x1="'+pad+'" x2="'+(w-pad)+'" y1="'+y+'" y2="'+y+'" class="tqLine"></line>'+
    ticks+ghosts+dots+
    '</svg>';
}

// click-to-play is wired once by the caller via event delegation (see wireLessonsHome in
// 93_mode_lessons.js), the same pattern every pill row in this app uses — not per-row
// querySelectorAll+onclick here, which would re-wire (and stack) a new listener on every
// re-render since this surface fully replaces container.innerHTML each time it draws.
Surfaces.register('triadquality', {
  label: 'Triad quality',
  render(container, opts){
    if(!container) return null;
    const root = ((opts.root % 12) + 12) % 12;
    container.innerHTML = TQ_ROWS.map(row =>
      '<div class="tqRow" data-q="'+row.q+'" title="tap to hear it">'+
        '<div class="tqRowLbl">'+row.label+'</div>'+
        tqRowSvg(root, row)+
      '</div>'
    ).join('');
    return {};
  }
});
