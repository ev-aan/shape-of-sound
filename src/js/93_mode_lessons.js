// ---- MODE: LESSONS (standalone teaching-tool demos) ----
// Each demo here is fully self-contained — its own controls, no dependency on Musical mode's
// live circle-of-fifths state (activeChordIdx) the way Bach playback and neighbouring-chords are.
// One file, one call, same pattern as every other mode (Modes.register).
const LESSONS = [
  { id:'measure-basics', title:'Reading a measure', blurb:'quarter notes, eighths, a rest, a chord — the staff engine end to end' },
  { id:'key-signatures', title:'Key signatures', blurb:'why a scale in D major or F major needs no inline accidentals' },
  { id:'intervals',      title:'Intervals',        blurb:'the distance between two notes, named and measured' },
  { id:'extensions',     title:'Chord extensions',  blurb:'how 7ths, 9ths, 11ths, 13ths stack in thirds above a root' },
  { id:'triad-qualities', title:'Suspended, diminished, augmented', blurb:'how each one bends just the 3rd and/or 5th away from a major triad' },
  { id:'ratio-wheel', title:'Ratio wheel', blurb:'the circle of fifths reshaped so distance from the centre is consonance with your root' },
];
let activeLesson = LESSONS[0].id;
// hoisted out of wireLessonsHome() so selectLesson()'s seed handling (below) can reach them —
// assigned once, inside wireLessonsHome(), same lifetime as before, just a wider scope.
let ivA, ivB, ivOrientation, renderIntervalViz;
let ssRootSel, ssQuality, ssExtend, renderSuperstructure;

// ---- CONCEPT STAGE: "notes & beats", a scroll-driven single-note -> solfège-scale ->
// note-duration progression. Same family as 92_mode_science.js's wave continuum (a scroll-
// position-driven `t`, a two-tone bright/dim caption), but built on real staff notation
// (Surfaces.get('staff')) rather than hand-drawn SVG, since this is teaching notes and rhythm,
// not a continuous physical wave — discrete degrees/durations are the honest representation here.
const SOLFEGE_STEPS = [
  { name:'DO', midi:60, dim:'a single note — the starting point. In solfège, this is "do."' },
  { name:'RE', midi:62, dim:'one step up the major scale.' },
  { name:'MI', midi:64, dim:'two steps up.' },
  { name:'FA', midi:65, dim:'three steps up — a half step from mi.' },
  { name:'SO', midi:67, dim:'the fifth degree — so (or sol).' },
  { name:'LA', midi:69, dim:'the sixth degree.' },
  { name:'TI', midi:71, dim:'the seventh degree — a half step from the octave.' },
  { name:'DO', midi:72, dim:'back to do, one octave up — the scale complete.' },
];
const BEAT_STEPS = [
  { name:'QUARTER NOTE', dur:'q', beats:1,   dim:'gets one beat — the reference unit rhythm is counted against.' },
  { name:'HALF NOTE',    dur:'h', beats:2,   dim:'gets two beats — twice as long as a quarter note.' },
  { name:'WHOLE NOTE',   dur:'w', beats:4,   dim:'gets four beats — a whole measure of common time.' },
  { name:'EIGHTH NOTE',  dur:'e', beats:0.5, dim:'gets half a beat — two fit inside one quarter note.' },
];
const LESSON_STEPS = SOLFEGE_STEPS.length + BEAT_STEPS.length; // 12
// staffEl/captionEl: two separate mount points (not one shared container split via
// querySelector — this app's test harness stubs querySelector to always fabricate a match
// rather than reflecting real innerHTML, so every other surface in this codebase already takes
// its mount point(s) directly rather than searching for them; this follows the same convention).
// opts.t: scroll position in [0,1]. Returns { idx } so callers only re-trigger audio on an
// actual step change, not every sub-pixel scroll tick.
function renderLessonsNoteBeatStage(staffEl, captionEl, opts){
  opts = opts || {};
  const t = Math.max(0, Math.min(1, opts.t != null ? opts.t : 0));
  const idx = Math.min(LESSON_STEPS - 1, Math.floor(t * LESSON_STEPS));
  let measure, bright, dim, playMidi, playDur;
  if(idx < SOLFEGE_STEPS.length){
    const scaleSoFar = SOLFEGE_STEPS.slice(0, idx + 1);
    measure = [{ timeSig:[4,4], voices:{ treble: scaleSoFar.map(s => ({ midi:s.midi, dur:'q' })) } }];
    const cur = SOLFEGE_STEPS[idx];
    bright = cur.name; dim = cur.dim; playMidi = cur.midi; playDur = 0.35;
  } else {
    const b = BEAT_STEPS[idx - SOLFEGE_STEPS.length];
    measure = [{ timeSig:[4,4], voices:{ treble:[{ midi:60, dur:b.dur }] } }];
    bright = b.name; dim = b.dim; playMidi = 60; playDur = b.beats * 0.5;
  }
  Surfaces.get('staff').render(staffEl, measure);
  captionEl.innerHTML = '<span class="sciCaptionBright">'+bright+'</span> <span class="sciCaptionDim">'+dim+'</span>';
  return { idx, playMidi, playDur };
}
// plain module-local staging (mirrors sciStage/sciStageWired in 92_mode_science.js) rather than
// View state — Lessons-only, easy to unwind, matches how activeLesson is already tracked locally
let lessonsStage = 'concept', lessonsStageWired = false, lessonsT = 0, lessonsLastPlayedIdx = null;
function applyLessonsStage(){
  const concept = lessonsStage === 'concept';
  document.getElementById('lessonsIntro').style.display = concept ? '' : 'none';
  document.getElementById('lessonsGrid').style.display = concept ? 'none' : '';
}
function wireLessonsScrollStage(){
  const home = document.getElementById('lessonsHome'), wrap = document.getElementById('lessonsScrollStage');
  const staffEl = document.getElementById('lessonsStageStaff'), captionEl = document.getElementById('lessonsStageCaption');
  const renderStage = () => {
    const r = renderLessonsNoteBeatStage(staffEl, captionEl, { t: lessonsT });
    if(r.idx !== lessonsLastPlayedIdx){ lessonsLastPlayedIdx = r.idx; playFreqs([m2f(r.playMidi)], r.playDur); }
  };
  wireScrollRange(home, wrap, 2400, t => { lessonsT = t; renderStage(); });
  renderLessonsNoteBeatStage(staffEl, captionEl, { t: lessonsT }); // initial paint only — no sound until the visitor actually scrolls
}

Modes.register('lessons', {
  label: 'Lessons',
  onEnter(){
    showMode('lessons');
    document.getElementById('topbarLabel').textContent = 'Lessons — small standalone music-theory demos';
    // showMode() already resets lessonsHome.scrollTop to 0 on every entry — resetting the JS-
    // tracked scroll position to match keeps the caption from ever showing a stale mid-scale step
    lessonsStage = 'concept';
    lessonsT = 0; lessonsLastPlayedIdx = null;
    applyLessonsStage();
    if(!lessonsStageWired){
      wireLessonsScrollStage();
      const cta = document.getElementById('lessonsExploreCta');
      if(cta) cta.onclick = () => { lessonsStage = 'explore'; applyLessonsStage(); };
      const back = document.getElementById('lessonsBackConceptBtn');
      if(back) back.onclick = () => { lessonsStage = 'concept'; applyLessonsStage(); };
      lessonsStageWired = true;
    } else {
      renderLessonsNoteBeatStage(document.getElementById('lessonsStageStaff'), document.getElementById('lessonsStageCaption'), { t: lessonsT });
    }
  },
  onExit(){}
});

// picking the interval to seed the Intervals lesson with when jumping in from a chord: most
// chords have a plain perfect 5th (interval 7) above the root, but dim/dim7/m7b5 have a
// tritone (6) instead and aug has a raised 5th (8) — falling back to interval 7 blindly would
// silently show the wrong, nonexistent interval for those qualities.
function bestFifthIv(n){
  return [7,6,8].find(iv => n.ivs.includes(iv)) ?? n.ivs[n.ivs.length-1];
}
// id: which lesson to show. seed (optional): { a, b } for 'intervals' (pitch classes), or
// { root, quality, upTo } for 'extensions' — used when arriving from a chord elsewhere in the
// app (see the "intervals"/"extend" bridge buttons in 94_topbar.js) so the lesson opens on
// that chord instead of always resetting to its own hardcoded example.
function selectLesson(id, seed){
  activeLesson = id;
  document.querySelectorAll('#lessonsHome .lessonBody').forEach(el => el.classList.toggle('on', el.dataset.lesson === id));
  document.querySelectorAll('#lessonsHome .lessonCard').forEach(el => el.classList.toggle('on', el.dataset.lesson === id));
  if(!seed) return;
  if(id === 'intervals'){
    ivA.value = seed.a; ivB.value = seed.b;
    renderIntervalViz();
  } else if(id === 'extensions'){
    ssRootSel.value = seed.root;
    ssQuality = seed.quality;
    document.querySelectorAll('#ssQualPills button').forEach(x => x.classList.toggle('on', x.dataset.k === seed.quality));
    ssExtend = seed.upTo;
    document.querySelectorAll('#ssExtendPills button').forEach(x => x.classList.toggle('on', +x.dataset.k === seed.upTo));
    renderSuperstructure();
  }
}
function lessonCardHTML(l){
  return '<div class="lessonCard" data-lesson="'+l.id+'"><div class="lessonTitle">'+l.title+'</div>'+
    '<div class="lessonBlurb">'+l.blurb+'</div></div>';
}
// a single small measure proving the staff engine's range end to end: a mix of durations, a
// rest, a chord (not just single notes), and both staves — the same engine the full 35-bar
// Bach piece uses, just with one bar of hand-written data instead of 35 generated ones.
const STAFF_EXAMPLE_MEASURE = [{
  timeSig: [4,4],
  label: 'C',
  voices: {
    treble: [
      { midi:64, dur:'q' },
      { midi:67, dur:'e' },
      { midi:69, dur:'e' },
      { rest:true, dur:'q' },
      { midi:[60,64,67], dur:'q' }
    ],
    bass: [ { midi:48, dur:'h' }, { midi:43, dur:'h' } ]
  }
}];
// two more small measures proving the key-signature feature: a diatonic scale in a sharp key
// and a flat key. Every note here belongs to its key, so none of them should carry an inline
// accidental — only the signature glyphs at the clef should show sharps/flats.
const STAFF_KEYSIG_SHARP_MEASURE = [{
  timeSig: [4,4],
  voices: { treble: [62,64,66,67,69,71,73,74].map(midi => ({ midi, dur:'e' })) } // D major scale
}];
const STAFF_KEYSIG_FLAT_MEASURE = [{
  timeSig: [4,4],
  voices: { treble: [65,67,69,70,72,74,76,77].map(midi => ({ midi, dur:'e' })) } // F major scale
}];
function wireLessonsHome(){
  document.getElementById('lessonNav').innerHTML = LESSONS.map(lessonCardHTML).join('');
  document.getElementById('lessonNav').addEventListener('click', e => {
    const c = e.target.closest('.lessonCard'); if(!c) return;
    selectLesson(c.dataset.lesson);
  });
  Surfaces.get('staff').render(document.getElementById('musExampleStaff'), STAFF_EXAMPLE_MEASURE);
  Surfaces.get('staff').render(document.getElementById('musKeySigSharpStaff'), STAFF_KEYSIG_SHARP_MEASURE, { keySig:2 });
  Surfaces.get('staff').render(document.getElementById('musKeySigFlatStaff'), STAFF_KEYSIG_FLAT_MEASURE, { keySig:-1 });
  // bar 1 of the Prelude in C — the same measure data Musical mode plays back in full, reused
  // here (not copied) so every "from the Prelude" example in this file stays truthful to BACH_CHORDS.
  Surfaces.get('staff').render(document.getElementById('musPreludeBar1Staff'), [BACH_PRELUDE[0]]);
  Surfaces.get('staff').render(document.getElementById('musKeySigNaturalStaff'), [BACH_PRELUDE[0]], { keySig:0 });
  ivA = document.getElementById('ivNoteA'); ivB = document.getElementById('ivNoteB');
  ivA.innerHTML = ivB.innerHTML = NOTE.map((nm, pc) => '<option value="'+pc+'">'+nm+'</option>').join('');
  ivA.value = 0; ivB.value = 7; // C -> G, a perfect 5th, by default
  ivOrientation = 'horizontal';
  renderIntervalViz = () => Surfaces.get('interval').render(document.getElementById('musInterval'), { a:+ivA.value, b:+ivB.value, orientation:ivOrientation, level:View.get().level });
  ivA.onchange = renderIntervalViz; ivB.onchange = renderIntervalViz;
  document.getElementById('ivPlayBtn').onclick = () => playFreqs([m2f(60+ +ivA.value), m2f(60+ +ivB.value)]);
  document.getElementById('ivOrientPills').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    ivOrientation = b.dataset.k;
    document.querySelectorAll('#ivOrientPills button').forEach(x => x.classList.toggle('on', x===b));
    renderIntervalViz();
  });
  renderIntervalViz();
  // seeding from a real bar rather than a hand-picked pair reuses selectLesson()'s existing
  // seed branch (see the "intervals"/"extend" bridge buttons in 94_topbar.js for the other caller)
  document.getElementById('ivPreludePicks').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    selectLesson('intervals', { a:+b.dataset.a, b:+b.dataset.b });
  });
  document.getElementById('staffColorPills').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    document.body.classList.toggle('staffColor', b.dataset.k === 'color');
    document.querySelectorAll('#staffColorPills button').forEach(x => x.classList.toggle('on', x===b));
  });
  ssRootSel = document.getElementById('ssRootSel');
  ssRootSel.innerHTML = NOTE.map((nm, pc) => '<option value="'+pc+'">'+nm+'</option>').join('');
  ssRootSel.value = 0;
  ssQuality = 'major'; ssExtend = 3;
  renderSuperstructure = () => Surfaces.get('superstructure').render(document.getElementById('musSuperstructure'), { root:+ssRootSel.value, quality:ssQuality, upTo:ssExtend });
  ssRootSel.onchange = renderSuperstructure;
  document.getElementById('ssQualPills').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    ssQuality = b.dataset.k;
    document.querySelectorAll('#ssQualPills button').forEach(x => x.classList.toggle('on', x===b));
    renderSuperstructure();
  });
  document.getElementById('ssExtendPills').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    ssExtend = +b.dataset.k;
    document.querySelectorAll('#ssExtendPills button').forEach(x => x.classList.toggle('on', x===b));
    renderSuperstructure();
  });
  renderSuperstructure();
  document.getElementById('ssPreludePicks').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    selectLesson('extensions', { root:+b.dataset.root, quality:b.dataset.q, upTo:+b.dataset.upto });
  });
  const tqRootSel = document.getElementById('tqRootSel');
  tqRootSel.innerHTML = NOTE.map((nm, pc) => '<option value="'+pc+'">'+nm+'</option>').join('');
  tqRootSel.value = 0;
  const renderTriadQuality = () => Surfaces.get('triadquality').render(document.getElementById('musTriadQuality'), { root:+tqRootSel.value });
  tqRootSel.onchange = renderTriadQuality;
  renderTriadQuality();
  document.getElementById('musTriadQuality').addEventListener('click', e => {
    const row = e.target.closest('.tqRow'); if(!row) return;
    const def = TQ_ROWS.find(r => r.q === row.dataset.q);
    playFreqs(def.ivs.map(iv => m2f(60 + +tqRootSel.value + iv)));
  });
  const rwRootSel = document.getElementById('rwRootSel');
  rwRootSel.innerHTML = NOTE.map((nm, pc) => '<option value="'+pc+'">'+nm+'</option>').join('');
  rwRootSel.value = 0;
  // onSelect is NOT passed through opts here — renderRatioWheel() re-runs on every root change,
  // and the surface attaches a fresh listener whenever opts.onSelect is set, so re-rendering with
  // it set each time would stack duplicate listeners (the same reason the triad-quality lesson's
  // click handling is wired separately, once, rather than passed into its own re-run render call).
  const renderRatioWheel = () => Surfaces.get('ratiowheel').render(document.getElementById('musRatioWheel'), { root:+rwRootSel.value });
  rwRootSel.onchange = renderRatioWheel;
  renderRatioWheel();
  document.getElementById('musRatioWheel').addEventListener('click', e => {
    const g = e.target.closest('.cofNote'); if(!g) return;
    playFreqs([m2f(60 + +g.dataset.pc)]);
  });
  selectLesson(activeLesson);
  // toggling Beginner/Advanced while the Intervals lesson is open should update it immediately
  View.subscribe((state, prev) => { if(state.level !== prev.level) renderIntervalViz(); });
}
