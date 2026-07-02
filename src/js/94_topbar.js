// ---- TOP BAR + Why <-> How BRIDGE ----
// One primary control (mode). Bridge button in the detail card that swaps mode while keeping the selection.
function wireTopbar(){
  const bar = document.getElementById('modeToggle');
  bar.addEventListener('click', e=>{
    const b = e.target.closest('button[data-mode]'); if(!b) return;
    [...bar.querySelectorAll('button')].forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
    Modes.enter(b.dataset.mode);
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
  });
  mo.observe(detailEl, { childList:true, subtree:false });
  detailEl.addEventListener('click', e=>{
    const t = e.target.closest('[data-act="bridge"]'); if(!t) return;
    const v = View.get();
    const target = v.mode === 'science' ? 'musical' : 'science';
    // reflect the toggle in the bar
    const bar = document.getElementById('modeToggle');
    if(bar){ [...bar.querySelectorAll('button')].forEach(x=>x.classList.toggle('on', x.dataset.mode===target)); }
    Modes.enter(target);
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
  });
}
