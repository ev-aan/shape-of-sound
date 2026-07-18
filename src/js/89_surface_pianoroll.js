// ---- SURFACE: piano roll ----
// Time along x, pitch along y — a whole passage at a glance, rather than one measure's worth of
// staff at a time. Reads exactly the same measure data the staff engine does (durBeats and
// measureBeats are its helpers, reused here), so any content already written for one renders in
// the other for free.
Surfaces.register('pianoroll', {
  label: 'Piano roll',
  render(container, measures){
    if(!container) return null;
    const beatW = 26, rowH = 6, padTop = 10, padBottom = 10, startX = 6;
    const events = [], barStarts = [];
    let cursor = 0;
    measures.forEach(m => {
      barStarts.push(cursor);
      const totalBeats = measureBeats(m.timeSig);
      ['treble', 'bass'].forEach(voice => {
        let cum = 0;
        ((m.voices && m.voices[voice]) || []).forEach(ev => {
          if(!ev.rest){
            (Array.isArray(ev.midi) ? ev.midi : [ev.midi]).forEach(midi => {
              events.push({ midi, startBeat: cursor + cum, beats: durBeats(ev.dur) });
            });
          }
          cum += durBeats(ev.dur);
        });
      });
      cursor += totalBeats;
    });
    if(!events.length){ container.innerHTML = ''; return null; }
    const minMidi = Math.min.apply(null, events.map(e => e.midi)) - 1;
    const maxMidi = Math.max.apply(null, events.map(e => e.midi)) + 1;
    const w = startX + cursor*beatW + 10, h = padTop + (maxMidi - minMidi)*rowH + padBottom;
    const xFor = beat => startX + beat*beatW;
    const yFor = midi => padTop + (maxMidi - midi)*rowH;
    let svg = '<svg viewBox="0 0 '+w+' '+h+'" class="rollSvg">';
    barStarts.forEach(b => { const x = xFor(b); svg += '<line x1="'+x+'" x2="'+x+'" y1="0" y2="'+h+'" class="rollBarline"></line>'; });
    const lastX = xFor(cursor);
    svg += '<line x1="'+lastX+'" x2="'+lastX+'" y1="0" y2="'+h+'" class="rollBarline rollFinal"></line>';
    events.forEach(e => {
      const x = xFor(e.startBeat), y = yFor(e.midi), width = Math.max(2, e.beats*beatW - 2);
      const pc = mod12(e.midi), col = Palette.noteCss(pc, .68, .62);
      svg += '<rect x="'+x+'" y="'+(y - rowH/2 + 1)+'" width="'+width+'" height="'+(rowH - 2)+'" rx="1.5" style="--pc:'+col+'" class="rollNote"></rect>';
    });
    svg += '</svg>';
    container.innerHTML = svg;
    return {};
  }
});
