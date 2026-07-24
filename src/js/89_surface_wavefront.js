// ---- SURFACE: wavefront (propagation) ----
// A row of "air molecules" (plain dots) at fixed vertical position, only ever moved horizontally
// — a longitudinal wave, unlike every other wave surface in this app (which draws the classic
// transverse sine-shape people are used to from an oscilloscope). Compression = a few dots
// pulled closer together; rarefaction = a few dots pushed further apart, right beside it. Each
// opts.stage is a hand-tuned static frame (this is a teaching diagram, not a physics sim) rather
// than one continuous formula — simpler to keep each frame's pedagogical point unambiguous.
const WF_N = 22, WF_W = 600, WF_H = 140, WF_MIDY = 70, WF_MARGIN = 24;
function wfRestX(i){ return WF_MARGIN + (WF_W - 2*WF_MARGIN) * i / (WF_N - 1); }
// a compression+rarefaction pair centred at `at` (a dot index): the two dots just left of `at`
// pulled together (compression), the two just right of `at` pushed apart (rarefaction) — one
// disturbance, immediately followed by its opposite, exactly like a real pressure pulse.
function wfPulseOffsets(at){
  const o = new Array(WF_N).fill(0);
  const set = (i, dx) => { if(i >= 0 && i < WF_N) o[i] += dx; };
  set(at-2, 3.5); set(at-1, 1.2); set(at, -1.2); set(at+1, -3.5); // compression: squeezed toward the middle
  set(at+2, -4.5); set(at+3, -1.5); set(at+4, 1.5); set(at+5, 4.5); // rarefaction: pushed apart
  return o;
}
function wfDotsSvg(offsets, opts){
  opts = opts || {};
  let out = '';
  for(let i=0; i<WF_N; i++){
    const x = (wfRestX(i) + (offsets[i]||0)).toFixed(1);
    const marked = opts.markedSet && opts.markedSet.has(i);
    out += '<circle cx="'+x+'" cy="'+WF_MIDY+'" r="'+(marked?4.4:3.2)+'" class="wfDot'+(marked?' wfDotMarked':'')+'"'+
      (opts.ghost ? ' opacity="0.25"' : '')+'></circle>';
    if(marked && !opts.ghost){
      // this dot's own tiny oscillation range -- it stays at its own index/position across
      // frames, it does not travel; only the compression/rarefaction pattern moves past it
      out += '<line x1="'+(+x-7).toFixed(1)+'" y1="'+(WF_MIDY-16)+'" x2="'+(+x+7).toFixed(1)+'" y2="'+(WF_MIDY-16)+'" class="wfArrow"></line>';
    }
  }
  return out;
}
const WF_EAR = '<path d="M574,58 q14,4 14,12 q0,10 -9,12 q6,4 2,10 q-3,5 -9,2" class="wfEar"></path>';
Surfaces.register('wavefront', {
  label: 'Wavefront',
  render(container, opts){
    if(!container) return null;
    opts = opts || {};
    const stage = opts.stage || 'rest';
    let body = '';
    if(stage === 'rest'){
      body = wfDotsSvg(new Array(WF_N).fill(0));
    } else if(stage === 'compress'){
      // isolate just the compression half of the pulse so this frame teaches one idea only
      const o = wfPulseOffsets(9); for(let i=11;i<WF_N;i++) o[i] = 0;
      body = wfDotsSvg(o);
    } else if(stage === 'rarefy'){
      // isolate just the rarefaction half (the compression half already had its own step) --
      // now show both together for the first time, so this frame reads as "and here's the
      // other half, right next to it" rather than repeating the compression from scratch
      body = wfDotsSvg(wfPulseOffsets(9));
    } else if(stage === 'travel'){
      body = wfDotsSvg(wfPulseOffsets(6), { ghost:true }) + wfDotsSvg(wfPulseOffsets(14), { markedSet: new Set([1, 10, 19]) });
    } else if(stage === 'arrive'){
      body = wfDotsSvg(wfPulseOffsets(17)) + WF_EAR;
    }
    container.innerHTML = '<svg viewBox="0 0 '+WF_W+' '+WF_H+'" class="sciWaveSvg wfSvg" data-stage="'+stage+'">'+body+'</svg>';
    return {};
  }
});
