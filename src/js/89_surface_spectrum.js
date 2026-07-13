// ---- SURFACE: spectrum (sound in context of the whole wave spectrum) ----
// A horizontal, log-frequency strip from the lowest felt vibrations up through visible light and
// beyond — the point isn't precision (band edges below are rounded to the nearest illustrative
// order of magnitude, not measured constants), it's scale: audible sound is one narrow band in a
// spectrum that spans about twenty powers of ten. A single stylised wave is drawn compressing
// left-to-right across the whole width (the same convention every EM-spectrum poster uses — no
// poster literally renders 10^15 cycles, because at any pixel width that's indistinguishable from
// a solid band anyway); band colour/labels carry the actual numbers.
//
// SPECTRUM_BANDS: { id, label, log10Start, log10End, tier: 'sense'|'em', unit }. tier:'sense'
// bands (feel/hear/see) are the ones a person directly perceives and are drawn brighter; tier:'em'
// bands are the rest of the electromagnetic spectrum, drawn dimmer, giving "hear" and "see"
// somewhere to sit rather than floating in isolation.
const SPECTRUM_BANDS = [
  { id:'feel',      label:'Feel',        log10Start:0,    log10End:1.3,  tier:'sense', unit:'1 – 20 Hz (felt vibration, not heard)' },
  { id:'hear',      label:'Hear',        log10Start:1.3,  log10End:4.3,  tier:'sense', unit:'20 Hz – 20 kHz (audible sound)' },
  { id:'radio',     label:'Radio',       log10Start:4.3,  log10End:9,    tier:'em',    unit:'~kHz – 1 GHz' },
  { id:'microwave', label:'Microwave',   log10Start:9,    log10End:11.5, tier:'em',    unit:'~1 GHz – 300 GHz' },
  { id:'infrared',  label:'Infrared',    log10Start:11.5, log10End:14.5, tier:'em',    unit:'~300 GHz – 300 THz' },
  { id:'see',       label:'See',         log10Start:14.5, log10End:14.9, tier:'sense', unit:'~400 – 750 THz (visible light)' },
  { id:'ultraviolet',label:'Ultraviolet',log10Start:14.9, log10End:16.5, tier:'em',    unit:'~750 THz – 30 PHz' },
  { id:'xray',      label:'X-ray',       log10Start:16.5, log10End:19,   tier:'em',    unit:'~30 PHz – 30 EHz' },
  { id:'gamma',     label:'Gamma ray',   log10Start:19,   log10End:20,   tier:'em',    unit:'beyond ~30 EHz' },
];
const SPECTRUM_LOG_MIN = 0, SPECTRUM_LOG_MAX = 20;

Surfaces.register('spectrum', {
  label: 'Spectrum',
  bands: SPECTRUM_BANDS,
  render(container, opts){
    if(!container) return;
    opts = opts || {};
    const w = 900, h = 96, bandY = 30, bandH = 34, pad = 4;
    const xFor = log10 => pad + (log10 - SPECTRUM_LOG_MIN) / (SPECTRUM_LOG_MAX - SPECTRUM_LOG_MIN) * (w - 2*pad);

    let svg = '<svg viewBox="0 0 '+w+' '+h+'" class="specSvg" preserveAspectRatio="none">';
    SPECTRUM_BANDS.forEach(b => {
      const x0 = xFor(b.log10Start), x1 = xFor(b.log10End);
      svg += '<g class="specBand specBand-'+b.tier+'" data-band="'+b.id+'">'+
        '<rect x="'+x0.toFixed(1)+'" y="'+bandY+'" width="'+(x1-x0).toFixed(1)+'" height="'+bandH+'" class="specRect"></rect>'+
        '<text x="'+((x0+x1)/2).toFixed(1)+'" y="'+(bandY+bandH+14)+'" class="specLabel">'+b.label+'</text>'+
        '</g>';
    });
    // one stylised wave, its visual wavelength decaying smoothly left-to-right — a picture of
    // "keeps oscillating faster," not a literal per-band cycle count (see file header).
    const waveY = bandY - 6, steps = 400;
    let d = '';
    for(let i=0; i<=steps; i++){
      const x = pad + (i/steps) * (w - 2*pad);
      const t = i/steps;
      const pxWavelength = Math.max(3, 40 * Math.pow(1-t, 1.5));
      const y = waveY - Math.sin((x / pxWavelength) * Math.PI*2) * 9;
      d += (i===0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }
    svg += '<path d="'+d+'" class="specWave"></path>';
    svg += '</svg>';
    container.innerHTML = svg + (opts.caption === false ? '' :
      '<div class="cofCaption specCaption">'+(opts.initialCaption || 'Sound (the "Hear" band) is one narrow slice of a much wider spectrum — tap a band to learn its range, or "Hear" to listen to it.')+'</div>');
    if(opts.onSelect){
      container.addEventListener('click', e => {
        const g = e.target.closest && e.target.closest('.specBand');
        if(g) opts.onSelect(g.dataset.band, container);
      });
    }
  }
});
