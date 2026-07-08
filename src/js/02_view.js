// ---- VIEW STATE + MODES REGISTRY: the extensibility framework ----
// Every new mode = one file that calls Modes.register('id', {...}).
// Every new feature that cares about state subscribes via View.subscribe(fn).
// This is the seam future contributors will plug into.
const View = (function(){
  // level: 'beginner' hides jargon (consonance scores, ratios, "shares N tones" tags, the
  // diminished ring) without changing anything else — 'advanced' shows everything, as before
  // this existed.
  const state = { mode:'science', dim:'3d', key:null, scale:'major', tuning:'ET', selected:null, level:'beginner' };
  const subs = [];
  function subscribe(fn){ subs.push(fn); return fn; }
  function set(patch){
    const prev = Object.assign({}, state);
    Object.assign(state, patch);
    subs.forEach(fn => { try{ fn(state, prev); } catch(e){ console.warn('View sub failed',e); } });
  }
  function get(){ return state; }
  return { get, set, subscribe };
})();

const Modes = (function(){
  const reg = {};
  let current = null;
  function register(id, def){
    // def: { label, panelHTML, onEnter?, onExit?, onSelect?(chordIndex), layout3D?, layout2D? }
    reg[id] = def;
  }
  function get(id){ return reg[id]; }
  function list(){ return Object.keys(reg); }
  function enter(id){
    if(!reg[id]) return console.warn('unknown mode', id);
    if(current && reg[current] && reg[current].onExit) reg[current].onExit();
    current = id;
    const el = document.getElementById('modePanel');
    if(el) el.innerHTML = reg[id].panelHTML || '';
    if(reg[id].onEnter) reg[id].onEnter();
    View.set({ mode:id });
  }
  function currentId(){ return current; }
  return { register, get, list, enter, currentId };
})();

// ---- MODE CHROME: which top-level surface is on screen for a given mode ----
// Single place that knows the full set of mode-owned elements, so a new mode can't forget to
// hide someone else's panel (science/play share the small #panel; musical is a full 2D takeover).
function showMode(mode){
  document.getElementById('panel').style.display = (mode === 'musical' || mode === 'lessons') ? 'none' : '';
  document.getElementById('scienceControls').style.display = (mode === 'science') ? '' : 'none';
  document.getElementById('playControls').style.display = (mode === 'play') ? '' : 'none';
  const musicalHome = document.getElementById('musicalHome'), lessonsHome = document.getElementById('lessonsHome');
  musicalHome.style.display = (mode === 'musical') ? '' : 'none';
  lessonsHome.style.display = (mode === 'lessons') ? '' : 'none';
  // a fresh page starts at the top, not wherever a previous visit happened to be scrolled to
  musicalHome.scrollTop = 0;
  lessonsHome.scrollTop = 0;
  document.getElementById('scene').style.display = (mode === 'musical' || mode === 'lessons') ? 'none' : '';
  // #title carries Science-mode-specific copy ("127 chords · placed by shared overtones...")
  // set once at boot — Play already has its own #topbarLabel text, so showing #title there too
  // just stacks two unrelated captions on screen at once.
  document.getElementById('title').style.display = (mode === 'musical' || mode === 'lessons' || mode === 'play') ? 'none' : '';
  document.getElementById('legend').style.display = (mode === 'musical' || mode === 'lessons') ? 'none' : '';
  document.getElementById('dimToggle').style.display = (mode === 'musical' || mode === 'lessons') ? 'none' : '';
  // the Lessons demos always play back at fixed equal temperament (m2f), so Equal/Just has no
  // effect there — showing it anyway is exactly the kind of chrome bleeding across pages that
  // makes each mode feel less like its own distinct page.
  document.getElementById('tuneToggle').style.display = (mode === 'lessons') ? 'none' : '';
  appVisible = (mode !== 'musical' && mode !== 'lessons');
}

// Beginner/Advanced: unlike tuning, this isn't hidden in any mode — it affects the shared
// detail card (Science and Musical), the neighbouring-chords tags and diminished ring
// (Musical), and the interval visualizer (Lessons), so it's relevant everywhere.
function wireLevelToggle(){
  const bar = document.getElementById('levelToggle'); if(!bar) return;
  bar.addEventListener('click', e => {
    const b = e.target.closest('button[data-level]'); if(!b) return;
    bar.querySelectorAll('button').forEach(x => x.classList.toggle('on', x===b));
    View.set({ level: b.dataset.level });
  });
  document.body.classList.toggle('levelBeginner', View.get().level === 'beginner');
  View.subscribe(state => document.body.classList.toggle('levelBeginner', state.level === 'beginner'));
}
