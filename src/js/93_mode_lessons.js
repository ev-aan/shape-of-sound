// ---- MODE: LESSONS (standalone teaching-tool demos) ----
// Each demo here is fully self-contained — its own controls, no dependency on Musical mode's
// live circle-of-fifths state (activeChordIdx) the way Bach playback and neighbouring-chords are.
// One file, one call, same pattern as every other mode (Modes.register).
const LESSONS = [
  { id:'measure-basics', title:'Reading a measure', blurb:'quarter notes, eighths, a rest, a chord — the staff engine end to end' },
  { id:'key-signatures', title:'Key signatures', blurb:'why a scale in D major or F major needs no inline accidentals' },
  { id:'intervals',      title:'Intervals',        blurb:'the distance between two notes, named and measured' },
  { id:'extensions',     title:'Chord extensions',  blurb:'how 7ths, 9ths, 11ths, 13ths stack in thirds above a root' },
];
let activeLesson = LESSONS[0].id;

Modes.register('lessons', {
  label: 'Lessons',
  onEnter(){
    showMode('lessons');
    document.getElementById('topbarLabel').textContent = 'Lessons — small standalone music-theory demos';
  },
  onExit(){}
});

function selectLesson(id){
  activeLesson = id;
  document.querySelectorAll('#lessonsHome .lessonBody').forEach(el => el.classList.toggle('on', el.dataset.lesson === id));
  document.querySelectorAll('#lessonsHome .lessonCard').forEach(el => el.classList.toggle('on', el.dataset.lesson === id));
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
  const ivA = document.getElementById('ivNoteA'), ivB = document.getElementById('ivNoteB');
  ivA.innerHTML = ivB.innerHTML = NOTE.map((nm, pc) => '<option value="'+pc+'">'+nm+'</option>').join('');
  ivA.value = 0; ivB.value = 7; // C -> G, a perfect 5th, by default
  let ivOrientation = 'horizontal';
  const renderIntervalViz = () => Surfaces.get('interval').render(document.getElementById('musInterval'), { a:+ivA.value, b:+ivB.value, orientation:ivOrientation });
  ivA.onchange = renderIntervalViz; ivB.onchange = renderIntervalViz;
  document.getElementById('ivPlayBtn').onclick = () => playFreqs([m2f(60+ +ivA.value), m2f(60+ +ivB.value)]);
  document.getElementById('ivOrientPills').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    ivOrientation = b.dataset.k;
    document.querySelectorAll('#ivOrientPills button').forEach(x => x.classList.toggle('on', x===b));
    renderIntervalViz();
  });
  renderIntervalViz();
  document.getElementById('staffColorPills').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    document.body.classList.toggle('staffColor', b.dataset.k === 'color');
    document.querySelectorAll('#staffColorPills button').forEach(x => x.classList.toggle('on', x===b));
  });
  const ssRootSel = document.getElementById('ssRootSel');
  ssRootSel.innerHTML = NOTE.map((nm, pc) => '<option value="'+pc+'">'+nm+'</option>').join('');
  ssRootSel.value = 0;
  let ssQuality = 'major', ssExtend = 3;
  const renderSuperstructure = () => Surfaces.get('superstructure').render(document.getElementById('musSuperstructure'), { root:+ssRootSel.value, quality:ssQuality, upTo:ssExtend });
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
  selectLesson(activeLesson);
}
