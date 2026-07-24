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
// ---- CONCEPT STAGE: "how sound happens", a scroll-driven dot -> waveform -> frequency progression ----
// Each stage is a pure render function of (stage, current slider value) — no independent
// time-based animation, so nothing here needs a second requestAnimationFrame loop (the harness
// only supports one rAF callback slot; see 90_init.js's frame()). Which stage is showing is
// driven by scroll position (wireSciScrollStage below), following the exact same direct-
// scrollTop-reading pattern 96_simple.js's hero parallax already uses.
// buildSinePath (00_core.js) is the shared primitive reused by all the stage renderers below,
// plus 89_surface_harmonics.js's stacked overtone traces.
// stage 1: a single dot swinging vertically — no wave shape yet, just amplitude (how far it swings)
function renderSciAmplitudeStage(container, opts){
  const amp = (opts && opts.amplitude != null) ? opts.amplitude : 0.5;
  const W = 600, H = 140, midY = 70, maxSwing = 55, swing = amp*maxSwing;
  const topY = (midY-swing).toFixed(1), botY = (midY+swing).toFixed(1);
  container.innerHTML = '<svg viewBox="0 0 '+W+' '+H+'" class="sciWaveSvg" data-amplitude="'+amp.toFixed(2)+'">'+
    '<line x1="300" y1="'+topY+'" x2="300" y2="'+botY+'" class="specWave" stroke-dasharray="2 4"></line>'+
    '<circle cx="300" cy="'+topY+'" r="6" class="sciDot"></circle>'+
    '<circle cx="300" cy="'+botY+'" r="6" class="sciDot" opacity=".35"></circle></svg>'+
    '<p class="sciWaveCaption">amplitude — how far it swings. Bigger swings sound louder, not higher.</p>';
}
// stage 2: that same swinging motion, unrolled over time into the classic wave shape (fixed cycle
// count — not about pitch yet, just "this is what the motion looks like traced out")
function renderSciWaveformStage(container, opts){
  const amp = (opts && opts.amplitude != null) ? opts.amplitude : 0.5;
  const W = 600, H = 140, midY = 70;
  const d = buildSinePath(W, H, midY, 3, amp*55);
  container.innerHTML = '<svg viewBox="0 0 '+W+' '+H+'" class="sciWaveSvg" data-amplitude="'+amp.toFixed(2)+'"><path d="'+d+'" class="specWave"></path></svg>'+
    '<p class="sciWaveCaption">that same swinging motion, drawn out over time, traces this shape — a wave.</p>';
}
// stage 3: the wave tightening into audible frequency — a flat, silent line at rest, becomes a
// sine wave whose tightness tracks freqT (higher = more cycles = higher pitch), sounding a real
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
    d = buildSinePath(W, H, midY, cycles, 40);
  }
  const caption = freqT == null ? 'move your mouse — nothing is vibrating yet'
    : pcName(pc,0) + ' — the faster it vibrates, the higher the pitch you hear';
  container.innerHTML = '<svg viewBox="0 0 '+W+' '+H+'" class="sciWaveSvg" data-cycles="'+cycles+'" data-pc="'+(pc==null?'':pc)+'"><path d="'+d+'" class="specWave"></path></svg>'+
    '<p class="sciWaveCaption">'+caption+'</p>';
}
// preserved as a reusable module, not deleted, per the "iteration friendly" build guidance — no
// longer wired into onEnter (superseded by the scroll+slider flow below), but still fully
// functional if a future pass wants mouse-hover scrubbing back, here or elsewhere.
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
// ---- continuous version: the same 3 ideas (amplitude / wave / frequency), but as one shape
// that never jump-cuts — cycles densify smoothly with scroll instead of snapping between 3
// fixed renders. The caption's key word still changes at 3 zones, and a soft glow (SVG filter)
// stands in for the "lit product" depth a full 3D render would give, staying testable/lightweight.
let sciT = 0, sciAmplitude = 0.5;
function renderSciWaveContinuum(container, opts){
  opts = opts || {};
  const t = Math.max(0, Math.min(1, opts.t != null ? opts.t : 0));
  const amplitude = opts.amplitude != null ? opts.amplitude : 0.5;
  const W = 600, H = 140, midY = 70;
  const cycles = 0.5 + t*17.5; // a single hump at t=0, up to 18 tight cycles by t=1
  const d = buildSinePath(W, H, midY, cycles, amplitude*55);
  let bright, dim, pc = null;
  if(t < 0.33){
    bright = 'AMPLITUDE'; dim = 'how far it swings — bigger swings sound louder, not higher.';
  } else if(t < 0.66){
    bright = 'A WAVE'; dim = 'that same motion, drawn out and repeating.';
  } else {
    pc = Math.min(11, Math.max(0, Math.round(((t-0.66)/0.34)*11)));
    bright = pcName(pc, 0); dim = 'the faster it repeats, the higher the pitch you hear.';
  }
  container.innerHTML = '<svg viewBox="0 0 '+W+' '+H+'" class="sciWaveSvg" data-cycles="'+cycles.toFixed(2)+'" data-pc="'+(pc==null?'':pc)+'">'+
    '<defs><filter id="sciGlow" x="-50%" y="-50%" width="200%" height="200%">'+
      '<feGaussianBlur stdDeviation="4" result="sciBlur"></feGaussianBlur>'+
      '<feMerge><feMergeNode in="sciBlur"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>'+
    '</filter></defs>'+
    '<path d="'+d+'" class="specWave" filter="url(#sciGlow)"></path></svg>'+
    '<p class="sciWaveCaption"><span class="sciCaptionBright">'+bright+'</span> <span class="sciCaptionDim">'+dim+'</span></p>';
  return { cycles, pc };
}
// same 0.33/0.66 zone boundaries renderSciWaveContinuum uses for its own caption text — kept in
// sync here so the step tracker always agrees with what the caption is currently saying
function sciStepForT(t){ return t < 0.33 ? 0 : (t < 0.66 ? 1 : 2); }
function wireSciScrollStage(){
  const home = document.getElementById('scienceHome'), wrap = document.getElementById('sciScrollStage');
  const renderContinuum = () => {
    const r = renderSciWaveContinuum(document.getElementById('sciStagePanel'), { t: sciT, amplitude: sciAmplitude });
    if(sciT >= 0.66 && r.pc !== sciWaveLastPc){ sciWaveLastPc = r.pc; playFreqs([m2f(60+r.pc)], 0.3); }
    else if(sciT < 0.66){ sciWaveLastPc = null; }
    const active = sciStepForT(sciT);
    document.querySelectorAll('#sciSteps .sciStep').forEach(el => el.classList.toggle('on', +el.dataset.step === active));
  };
  wireScrollRange(home, wrap, 2000, t => { sciT = t; renderContinuum(); });
  const ampSlider = document.getElementById('sciAmpSlider');
  if(ampSlider) ampSlider.addEventListener('input', () => { sciAmplitude = ampSlider.value/100; renderContinuum(); });
  renderContinuum();
}
// ---- LESSON 2: how sound travels (propagation) ----
// A discrete step list on the generic engine (07_scroll_stage.js) -- unlike Lesson 1's bespoke
// continuum above, propagation genuinely has distinct named stages (rest/compress/rarefy/
// travel/arrive), not one smoothly-morphing quantity, so the generic engine is the honest fit.
const SCI_PROPAGATION_LESSON = { rangePx: 1600, steps: [
  { bright:'AT REST', dim:'air molecules, evenly spaced — nothing vibrating yet.', surface:'wavefront', opts:{ stage:'rest' } },
  { bright:'COMPRESSION', dim:'a vibration pushes molecules together — a small region of higher pressure.', surface:'wavefront', opts:{ stage:'compress' } },
  { bright:'RAREFACTION', dim:'right behind it, molecules spread apart — lower pressure.', surface:'wavefront', opts:{ stage:'rarefy' } },
  { bright:'TRAVELLING', dim:'that alternating pattern keeps handing off outward — the wave moves, not the molecules.', surface:'wavefront', opts:{ stage:'travel' } },
  { bright:'REACHING YOUR EAR', dim:'by the time it arrives, that pressure pattern is what your eardrum picks up as sound.', surface:'wavefront', opts:{ stage:'arrive' } }
]};
// ---- LESSON 3: timbre — same note, different sound (overtones) ----
// The note played is the same fundamental (C4/midi 60) at every step, on purpose -- Elorah's
// synth is a single triangle-wave oscillator (35_audio.js), it can't actually render each mix's
// overtone recipe audibly, so only the very first step plays a reference tone (establishing
// "this is the pitch we're talking about") rather than replaying an identical tone at every
// step and implying a change you won't actually hear.
const SCI_TIMBRE_LESSON = { rangePx: 1600, steps: [
  { bright:'A PURE TONE', dim:'just one frequency, the fundamental — no overtones at all.', surface:'harmonics', opts:{ mix:'fundamental-only' }, play:{ midi:60, dur:0.4 } },
  { bright:'ADD AN OVERTONE', dim:'real vibrating things also vibrate in halves, thirds, quarters... at the same time.', surface:'harmonics', opts:{ mix:'plus-2nd' } },
  { bright:'STACK THEM UP', dim:'enough overtones on top of the fundamental, and you get a richer, more complex wave.', surface:'harmonics', opts:{ mix:'rich-mix-a' } },
  { bright:'SAME NOTE, DIFFERENT MIX', dim:'a different balance of overtones, same fundamental pitch — this is the one thing that makes a violin and a flute unmistakable, even on the same note.', surface:'harmonics', opts:{ mix:'rich-mix-b' } }
]};
let sciPropagationHandle = null, sciTimbreHandle = null;

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
  // dimToggle/tuneToggle/levelToggle/shareBtn/topbarLabel now live inside #scienceControls
  // (see #sciSettingsAnchor, wired up by showMode()'s appendChild relocation) — hiding #panel
  // above already hides all of them along with the rest of the sidebar, no separate line needed.
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
      wireSciScrollStage();
      sciPropagationHandle = makeScrollLessonStage(SCI_PROPAGATION_LESSON,
        document.getElementById('scienceHome'), document.getElementById('sciPropagationStage'),
        document.getElementById('sciPropagationPanel'), document.getElementById('sciPropagationCaption'),
        document.getElementById('sciPropagationSteps'));
      sciTimbreHandle = makeScrollLessonStage(SCI_TIMBRE_LESSON,
        document.getElementById('scienceHome'), document.getElementById('sciTimbreStage'),
        document.getElementById('sciTimbrePanel'), document.getElementById('sciTimbreCaption'),
        document.getElementById('sciTimbreSteps'));
      const cta = document.getElementById('sciExploreCta');
      if(cta) cta.onclick = () => { sciStage = 'explore'; applySciStage(); };
      const back = document.getElementById('sciBackConceptBtn');
      if(back) back.onclick = () => { sciStage = 'concept'; applySciStage(); };
      const toLessons = document.getElementById('sciToLessonsBtn');
      if(toLessons) toLessons.onclick = () => switchMode('lessons');
      sciStageWired = true;
    }
    // showMode() already resets scienceHome.scrollTop to 0 on every entry (see the identical
    // comment in 93_mode_lessons.js) -- resetting each lesson's own tracked position to match
    // keeps captions/step-pills from ever showing a stale step on re-entry
    if(sciPropagationHandle) sciPropagationHandle.reset();
    if(sciTimbreHandle) sciTimbreHandle.reset();
  },
  onExit(){
    document.getElementById('scienceHome').style.display = 'none';
  }
});
