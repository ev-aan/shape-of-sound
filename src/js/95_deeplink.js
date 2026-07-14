// ---- DEEP LINKS: shareable URLs like #mode=musical&key=9&scale=dorian&dim=3d&tune=JI ----
// Enables sharing a specific view (the seed for community/Discord embedding).
//
// Each major section also gets a clean, bookmarkable path (elorah.org/musical, /science, /play,
// /lessons) via history.replaceState — still one single-file app underneath (no real page load
// happens), but a visitor or a search engine sees a real distinct URL per section. Deliberately
// replaceState, never pushState: the "‹ Simple" button already gives an explicit way back home,
// so mode switches don't need to stack up separate browser-back entries, and replaceState is the
// one this app's test harness actually stubs (pushState isn't, and doesn't need to be).
const PATH_MODE = { '/musical':'musical', '/science':'science', '/play':'play', '/lessons':'lessons' };
const MODE_PATH = { musical:'/musical', science:'/science', play:'/play', lessons:'/lessons' };
const Link = (function(){
  let restoring = false;
  function modeFromPath(){
    const path = (location.pathname || '/').replace(/\/+$/, '') || '/';
    return PATH_MODE[path] || null;
  }
  function writeModePath(mode){
    if(restoring) return;
    const path = MODE_PATH[mode]; if(!path) return;
    try { history.replaceState(null, '', path + location.hash); } catch(e){}
  }
  function writeHomePath(){
    if(restoring) return;
    try { history.replaceState(null, '', '/' + location.hash); } catch(e){}
  }
  function serialize(){
    const v = View.get();
    const p = new URLSearchParams();
    p.set('mode', v.mode);
    p.set('dim', v.dim);
    p.set('tune', v.tuning);
    if(v.mode==='musical'){ if(v.key!=null) p.set('key', v.key); p.set('scale', v.scale); }
    if(v.selected!=null) p.set('sel', v.selected);
    return p.toString();
  }
  function writeHash(){
    if(restoring) return;
    const s = serialize();
    try { history.replaceState(null, '', '#'+s); } catch(e){ location.hash = s; }
  }
  function applyFromHash(){
    const h = (location.hash||'').replace(/^#/, '');
    if(!h) return false;
    const p = new URLSearchParams(h);
    restoring = true;
    try {
      const mode = p.get('mode'); const dim = p.get('dim'); const tune = p.get('tune');
      const key = p.get('key'); const scale = p.get('scale'); const sel = p.get('sel');
      if(tune && (tune==='ET'||tune==='JI') && typeof setTuning==='function') setTuning(tune);
      if(dim && (dim==='2d'||dim==='3d') && typeof setDim==='function') setDim(dim);
      if(mode && Modes.get(mode)) switchMode(mode);
      if(mode==='musical'){
        if(scale && SCALES[scale]){ const ss=document.getElementById('mScaleSel'); if(ss) ss.value=scale; View.set({scale}); }
        if(key!=null && key!==''){ const ks=document.getElementById('mKeySel'); if(ks) ks.value=key; View.set({key:+key}); }
        if(typeof refreshMusicalScene==='function') refreshMusicalScene();
      }
      if(sel!=null && sel!=='' && typeof selectNode==='function'){ const si=+sel; if(N[si]) selectNode(si); }
    } catch(e){ console.warn('deep-link restore failed', e); }
    restoring = false;
    return true;
  }
  // keep the URL live as state changes
  View.subscribe(()=>writeHash());
  function copyLink(){
    const url = location.origin + location.pathname + '#' + serialize();
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url);
    return url;
  }
  return { applyFromHash, copyLink, serialize, modeFromPath, writeModePath, writeHomePath };
})();
