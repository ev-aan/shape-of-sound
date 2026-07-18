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
