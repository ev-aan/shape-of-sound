// ---- SURFACE: simplified staff notation ----
// Not full engraving (no beam/stem rules, no spacing algorithm) — just noteheads placed correctly
// on a grand staff, enough to follow a short passage alongside audio playback. One bar = one bass
// note (held) plus up to 8 treble notes (sixteenths), matching how 97_bach_prelude.js is shaped.
const LETTER_STEP = { C:0, D:1, E:2, F:3, G:4, A:5, B:6 };
function midiToDiatonic(midi){
  const pc = ((midi%12)+12)%12, octave = Math.floor(midi/12)-1;
  const name = NOTE[pc], letter = name[0], acc = name.length>1 ? '#' : '';
  return { diatonic: octave*7 + LETTER_STEP[letter], acc };
}
Surfaces.register('staff', {
  label: 'Staff',
  render(container, bars){
    if(!container) return null;
    const lg = 8, barW = 80, startX = 56;
    const trebleTop = 20, trebleMidY = trebleTop + 2*lg, trebleMidD = 34; // B4
    const bassTop = 90, bassMidY = bassTop + 2*lg, bassMidD = 22; // D3
    const staffW = startX + Math.max(1, bars.length)*barW + 20, staffH = 150;
    function yFor(midi, clef){
      const { diatonic } = midiToDiatonic(midi);
      const midY = clef==='treble' ? trebleMidY : bassMidY, midD = clef==='treble' ? trebleMidD : bassMidD;
      return midY - (diatonic - midD) * (lg/2);
    }
    function ledgers(midi, clef, x){
      const { diatonic } = midiToDiatonic(midi);
      const midY = clef==='treble' ? trebleMidY : bassMidY, midD = clef==='treble' ? trebleMidD : bassMidD;
      const above = Math.floor((diatonic - (midD+4))/2), below = Math.floor(((midD-4) - diatonic)/2);
      let svg = '';
      for(let k=1;k<=above;k++){ const d=midD+4+2*k, y=midY-(d-midD)*(lg/2); svg += '<line x1="'+(x-6)+'" x2="'+(x+6)+'" y1="'+y+'" y2="'+y+'" class="staffLedger"/>'; }
      for(let k=1;k<=below;k++){ const d=midD-4-2*k, y=midY-(d-midD)*(lg/2); svg += '<line x1="'+(x-6)+'" x2="'+(x+6)+'" y1="'+y+'" y2="'+y+'" class="staffLedger"/>'; }
      return svg;
    }
    function notehead(midi, clef, x, bi, ni){
      const y = yFor(midi, clef), acc = midiToDiatonic(midi).acc;
      const pc = ((midi%12)+12)%12, col = Palette.noteCss(pc, .68, .62); // same note, same colour, everywhere
      return ledgers(midi, clef, x) + (acc ? '<text x="'+(x-9)+'" y="'+(y+3)+'" class="staffAcc">♯</text>' : '') +
        '<ellipse cx="'+x+'" cy="'+y+'" rx="4.2" ry="3.2" fill="'+col+'" class="staffNote" data-bar="'+bi+'" data-note="'+ni+'"></ellipse>';
    }
    let svg = '<svg viewBox="0 0 '+staffW+' '+staffH+'" class="staffSvg">';
    for(let i=0;i<5;i++){
      svg += '<line x1="'+startX+'" x2="'+(staffW-10)+'" y1="'+(trebleTop+i*lg)+'" y2="'+(trebleTop+i*lg)+'" class="staffLine"></line>';
      svg += '<line x1="'+startX+'" x2="'+(staffW-10)+'" y1="'+(bassTop+i*lg)+'" y2="'+(bassTop+i*lg)+'" class="staffLine"></line>';
    }
    // the SMuFL/Unicode clef glyphs (U+1D11E, U+1D122) aren't reliably covered by common system
    // fonts (measured ~11px wide for a 34px font here, vs ~29px for a plain letter) — plain labels
    // render everywhere, which matters more than authenticity for a simplified staff view.
    svg += '<text x="'+(startX-6)+'" y="'+(trebleMidY+4)+'" class="staffClef">treble</text>';
    svg += '<text x="'+(startX-6)+'" y="'+(bassMidY+4)+'" class="staffClef">bass</text>';
    bars.forEach((bar, bi) => {
      const barX = startX + bi*barW;
      svg += '<line x1="'+barX+'" x2="'+barX+'" y1="'+trebleTop+'" y2="'+(bassTop+4*lg)+'" class="staffBarline"></line>';
      if(bar.idx != null) svg += '<text x="'+(barX+barW/2)+'" y="12" class="staffChordName" data-bar="'+bi+'">'+N[bar.idx].name+'</text>';
      if(bar.bass != null) svg += notehead(bar.bass, 'bass', barX + barW*0.42, bi, -1);
      (bar.notes||[]).forEach((midi, ni) => {
        const nx = barX + 14 + ni*(barW-20)/Math.max(1, bar.notes.length-1 || 1);
        svg += notehead(midi, 'treble', nx, bi, ni);
      });
    });
    const lastX = startX + bars.length*barW;
    svg += '<line x1="'+lastX+'" x2="'+lastX+'" y1="'+trebleTop+'" y2="'+(bassTop+4*lg)+'" class="staffBarline staffFinal"></line>';
    svg += '</svg>';
    container.innerHTML = svg;
    return {
      highlight(bi, ni){
        container.querySelectorAll('.staffNote.on').forEach(e => e.classList.remove('on'));
        const sel = container.querySelector('.staffNote[data-bar="'+bi+'"][data-note="'+ni+'"]');
        if(sel){ sel.classList.add('on'); if(sel.scrollIntoView) sel.scrollIntoView({ block:'nearest', inline:'center', behavior:'smooth' }); }
      }
    };
  }
});
