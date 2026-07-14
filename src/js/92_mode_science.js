// ---- MODE: SCIENCE (the physics view) ----
// Registering a mode = one file, one call. Show/hide its permanent panel container on enter/exit.
let sciSpectrumBuilt = false, sciSpectrumBandId = null;
// re-renders the whole surface rather than patching just the caption text in place — this app's
// surfaces are stateless and cheap to redraw, and it avoids attaching a second click listener on
// top of the one wired once below (re-passing opts.onSelect into every render call would do that).
function renderSciSpectrum(){
  const b = SPECTRUM_BANDS.find(x => x.id === sciSpectrumBandId);
  const caption = b ? (b.label + ' — ' + b.unit + (b.tier === 'sense' ? ' — one of the three you can directly sense.' : '.')) : undefined;
  Surfaces.get('spectrum').render(document.getElementById('sciSpectrumChart'), { initialCaption: caption });
}
function selectSpectrumBand(bandId){
  sciSpectrumBandId = bandId;
  renderSciSpectrum();
  if(bandId === 'hear') playFreqs([m2f(69)]); // A4, a familiar reference pitch — the only band here you can actually hear
}
// ---- CONCEPT STAGE: "how sound happens" wave demo ----
// A flat, silent line until the mouse moves across it — then it becomes a sine wave whose
// tightness tracks mouse position (further right = more cycles = higher pitch), sounding a real
// note per semitone crossed. Rendered as SVG-in-innerHTML (not raw canvas) so it's directly
// testable the same way every other Surfaces.* component in this app already is.
let sciWaveLastPc = null;
function renderSciWaveDemo(container, opts){
  opts = opts || {};
  const W = 600, H = 120, midY = H/2;
  const freqT = opts.freqT; // null/undefined = at rest (silence)
  let d, cycles = 0, pc = null;
  if(freqT == null){
    d = 'M0,' + midY + ' L' + W + ',' + midY;
  } else {
    cycles = Math.round(2 + freqT*16);
    pc = Math.min(11, Math.floor(freqT*12));
    const pts = [];
    for(let x=0; x<=W; x+=4) pts.push((x===0?'M':'L')+x.toFixed(1)+','+(midY+40*Math.sin(2*Math.PI*cycles*x/W)).toFixed(1));
    d = pts.join(' ');
  }
  const caption = freqT == null ? 'move your mouse — nothing is vibrating yet'
    : pcName(pc,0) + ' — the faster it vibrates, the higher the pitch you hear';
  container.innerHTML = '<svg viewBox="0 0 '+W+' '+H+'" class="sciWaveSvg" data-cycles="'+cycles+'" data-pc="'+(pc==null?'':pc)+'"><path d="'+d+'" class="specWave"></path></svg>'+
    '<p class="sciWaveCaption">'+caption+'</p>';
}
function wireSciWaveDemo(){
  const el = document.getElementById('sciWaveDemo'); if(!el) return;
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    const freqT = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    renderSciWaveDemo(el, { freqT });
    const pc = Math.min(11, Math.floor(freqT*12));
    if(pc !== sciWaveLastPc){ sciWaveLastPc = pc; playFreqs([m2f(60+pc)], 0.3); }
  });
  el.addEventListener('pointerleave', () => { sciWaveLastPc = null; renderSciWaveDemo(el, {}); });
  renderSciWaveDemo(el, {});
}
// ---- CONCEPT / EXPLORE STAGE: not everything needs to be on screen at once ----
// A fresh entry into Science always lands on the concept page first (nav click, deep link, the
// hero's CTA/row, the bridge button from Musical); "Start exploring" reveals the existing 3D map
// unchanged. Kept as a plain local flag (mirrors how Lessons tracks activeLesson locally, not in
// View) rather than global state — this staging is Science-only and easy to unwind later.
let sciStage = 'concept', sciStageWired = false;
function applySciStage(){
  const concept = sciStage === 'concept';
  document.getElementById('scienceHome').style.display = concept ? '' : 'none';
  document.getElementById('scene').style.display = concept ? 'none' : '';
  document.getElementById('panel').style.display = concept ? 'none' : '';
  document.getElementById('legend').style.display = concept ? 'none' : '';
  document.getElementById('title').style.display = concept ? 'none' : '';
  document.getElementById('dimToggle').style.display = concept ? 'none' : '';
  appVisible = !concept; // same pause-when-not-visible convention 96_simple.js already uses
}
Modes.register('science', {
  label: 'The Science of Sound',
  panelId: 'scienceControls',
  onEnter(){
    showMode('science');
    document.getElementById('topbarLabel').textContent = 'The Science of Sound — physics from overtone overlap';
    applyColors(colorMode);
    setRender(renderMode);
    positionLabels();
    sciStage = 'concept';
    applySciStage();
    if(!sciSpectrumBuilt){
      renderSciSpectrum();
      document.getElementById('sciSpectrumChart').addEventListener('click', e => {
        const g = e.target.closest && e.target.closest('.specBand');
        if(g) selectSpectrumBand(g.dataset.band);
      });
      sciSpectrumBuilt = true;
    }
    if(!sciStageWired){
      wireSciWaveDemo();
      const cta = document.getElementById('sciExploreCta');
      if(cta) cta.onclick = () => { sciStage = 'explore'; applySciStage(); };
      const back = document.getElementById('sciBackConceptBtn');
      if(back) back.onclick = () => { sciStage = 'concept'; applySciStage(); };
      const toLessons = document.getElementById('sciToLessonsBtn');
      if(toLessons) toLessons.onclick = () => switchMode('lessons');
      sciStageWired = true;
    }
  },
  onExit(){
    document.getElementById('scienceHome').style.display = 'none';
  }
});
