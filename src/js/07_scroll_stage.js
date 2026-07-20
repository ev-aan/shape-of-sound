// ---- SCROLL STAGE: shared scroll-to-progress math for scroll-driven concept pages ----
// the scroll-to-progress math every scroll-driven concept page in this app needs: read
// home.scrollTop, treat wrap's own offsetTop as the zero point, divide by rangePx to get a
// t in [0,1], and skip redundant calls on sub-pixel scroll deltas. Owns no state itself —
// callers keep their own `t`/render-result variables (e.g. Science's amplitude slider reads
// its own sciT independent of a scroll event), this just wires the listener and dispatches.
// See 92_mode_science.js's wireSciScrollStage() and 93_mode_lessons.js's
// wireLessonsScrollStage(), which both call this instead of hand-rolling the same math.
function wireScrollRange(home, wrap, rangePx, onScroll){
  if(!home || !wrap) return;
  let last = -1;
  home.addEventListener('scroll', () => {
    const base = wrap.offsetTop || 0;
    const t = Math.max(0, Math.min(1, (home.scrollTop - base) / rangePx));
    if(Math.abs(t - last) < 0.002) return;
    last = t;
    onScroll(t);
  });
}

// ---- SCROLL LESSON ENGINE: a data format for discrete-step scroll-driven lessons ----
// A scroll-driven lesson is a flat step list: [{ bright, dim, surface, data?, opts?, play? }].
// `surface` is a Surfaces id; `data` is only meaningful for the two-arg surfaces (staff,
// pianoroll — see 05_surfaces.js) — everything else just gets `opts`. `play`, if present, is
// { midi, dur } — the note this step sounds on step-index change. This is the whole contract a
// new lesson needs to satisfy — no new render function, no new wiring block. Not every
// scroll-driven page fits this shape (92_mode_science.js's wave continuum is a continuous
// formula across 3 zones with an extra slider input, not a discrete step list — it stays its
// own bespoke thing rather than being forced into this format).
function renderScrollLessonStage(visualEl, captionEl, lesson, t){
  t = Math.max(0, Math.min(1, t != null ? t : 0));
  const idx = Math.min(lesson.steps.length - 1, Math.floor(t * lesson.steps.length));
  const step = lesson.steps[idx];
  const surface = Surfaces.get(step.surface);
  if(step.data !== undefined) surface.render(visualEl, step.data, step.opts);
  else surface.render(visualEl, step.opts);
  captionEl.innerHTML = '<span class="sciCaptionBright">'+step.bright+'</span> <span class="sciCaptionDim">'+step.dim+'</span>';
  return { idx, play: step.play };
}
// wires a lesson's step list to a scroll range, handling the render-on-scroll + audio-on-step-
// change plumbing (built on wireScrollRange above). Returns { reset() } so the caller (a mode's
// onEnter) can restart the lesson at step 0 on every entry without re-wiring the listener.
function makeScrollLessonStage(lesson, home, wrap, visualEl, captionEl){
  let t = 0, lastPlayedIdx = null;
  const renderStage = () => {
    const r = renderScrollLessonStage(visualEl, captionEl, lesson, t);
    if(r.idx !== lastPlayedIdx){ lastPlayedIdx = r.idx; if(r.play) playFreqs([m2f(r.play.midi)], r.play.dur); }
  };
  wireScrollRange(home, wrap, lesson.rangePx, newT => { t = newT; renderStage(); });
  return { reset(){ t = 0; lastPlayedIdx = null; renderScrollLessonStage(visualEl, captionEl, lesson, t); } };
}
