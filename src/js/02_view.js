// ---- VIEW STATE + MODES REGISTRY: the extensibility framework ----
// Every new mode = one file that calls Modes.register('id', {...}).
// Every new feature that cares about state subscribes via View.subscribe(fn).
// This is the seam future contributors will plug into.
const View = (function(){
  const state = { mode:'science', dim:'3d', key:null, scale:'major', tuning:'ET', selected:null };
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
