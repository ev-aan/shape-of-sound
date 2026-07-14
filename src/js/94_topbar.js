// ---- TOP BAR + Why <-> How BRIDGE ----
// One primary control (mode). Bridge button in the detail card that swaps mode while keeping the selection.
// switchMode keeps the topbar pills and the Modes registry in sync — the one place that does both,
// used by the topbar click handler, the bridge button, deep-link restore, and the Play hand-off from addToSeq.
function switchMode(id){
  const bar = document.getElementById('modeToggle');
  if(bar) bar.querySelectorAll('button').forEach(b=>b.classList.toggle('on', b.dataset.mode===id));
  Modes.enter(id);
  Link.writeModePath(id);
}
function wireTopbar(){
  const bar = document.getElementById('modeToggle');
  bar.addEventListener('click', e=>{
    const b = e.target.closest('button[data-mode]'); if(!b) return;
    switchMode(b.dataset.mode);
  });
}

// Add a "Why?" / "How?" button to the detail card. Detail card is (re)rendered on selectNode;
// we hook by listening for the detail element's DOM changes via MutationObserver, cheap and decoupled.
function installBridgeButton(){
  const detailEl = document.getElementById('detail');
  const mo = new MutationObserver(()=>{
    const head = detailEl.querySelector('.dhead');
    if(!head || head.querySelector('[data-act="bridge"]')) return;
    const v = View.get();
    const isSci = v.mode === 'science';
    const bt = document.createElement('span');
    bt.className = 'addseq';
    bt.setAttribute('data-act','bridge');
    bt.textContent = isSci ? '♪ how (theory)' : '⚛ why (physics)';
    bt.title = isSci ? 'See this chord in Musical mode' : 'See the physics behind this chord';
    // insert after the last addseq, before the close
    const close = head.querySelector('.x');
    if(close) head.insertBefore(bt, close); else head.appendChild(bt);
    // two more jumps from whatever chord is open: straight into the Lessons tools that used to
    // only ever show a hardcoded C example, now seeded with this actual chord — the fix for
    // "the tools don't know what I was just looking at."
    if(!head.querySelector('[data-act="intervals-link"]')){
      const iv = document.createElement('span');
      iv.className = 'addseq'; iv.setAttribute('data-act','intervals-link');
      iv.textContent = '↔ intervals'; iv.title = 'See this chord\'s interval in the Lessons tool';
      if(close) head.insertBefore(iv, close); else head.appendChild(iv);
    }
    if(!head.querySelector('[data-act="extend-link"]')){
      const ex = document.createElement('span');
      ex.className = 'addseq'; ex.setAttribute('data-act','extend-link');
      ex.textContent = '▲ extend'; ex.title = 'See how this chord extends in the Lessons tool';
      if(close) head.insertBefore(ex, close); else head.appendChild(ex);
    }
  });
  mo.observe(detailEl, { childList:true, subtree:false });
  detailEl.addEventListener('click', e=>{
    const t = e.target.closest('[data-act]'); if(!t) return;
    const act = t.dataset.act;
    if(act === 'bridge'){
      const v = View.get();
      const target = v.mode === 'science' ? 'musical' : 'science';
      switchMode(target);
      // if switching TO musical and no key is chosen yet, pre-seed with this chord's root and a sensible scale
      if(target === 'musical'){
        const idx = detailIdx;
        if(idx != null){
          const n = N[idx];
          const cur = View.get();
          if(cur.key == null){
            const scale = (n.q === 'min' || n.q === 'min7' || n.q === 'm7b5' || n.q === 'dim' || n.q === 'mMaj7' || n.q === 'dim7') ? 'minor' : 'major';
            View.set({ key: n.root, scale });
            const ks = document.getElementById('mKeySel'); if(ks) ks.value = n.root;
            const ss = document.getElementById('mScaleSel'); if(ss) ss.value = scale;
            refreshMusicalScene();
          }
        }
      }
      // re-open the detail so the user's selection stays visible in the new mode
      if(detailIdx != null) selectNode(detailIdx);
      return;
    }
    if(act === 'intervals-link' && detailIdx != null){
      const n = N[detailIdx], otherIv = bestFifthIv(n);
      switchMode('lessons');
      selectLesson('intervals', { a: n.root, b: (n.root+otherIv)%12 });
      return;
    }
    if(act === 'extend-link' && detailIdx != null){
      const n = N[detailIdx];
      // same "is this chord minor-ish" heuristic the bridge button above already uses to guess
      // a scale — the superstructure surface only has two stacks (major/minor), so it's the
      // right approximation here too, not a new rule to invent.
      const quality = (n.q === 'min' || n.q === 'min7' || n.q === 'm7b5' || n.q === 'dim' || n.q === 'mMaj7' || n.q === 'dim7') ? 'minor' : 'major';
      switchMode('lessons');
      selectLesson('extensions', { root: n.root, quality, upTo: n.ivs.length });
      return;
    }
  });
}
