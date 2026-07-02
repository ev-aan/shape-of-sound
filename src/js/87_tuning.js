// ---- TUNING: swap the entire map between Equal Temperament and Just Intonation ----
// This is a first-class dimension: positions, played frequencies, consonance, overtone-overlap
// matrix (W) and edges all come from the chosen tuning. The morph is Procrustes-aligned in the
// engine so tuning-invariant chords stay put and the rest visibly shift.
let TUNING = 'ET';
function rebuildDerivedForTuning(){
  // positions used by the "Discovered" and "Explained" layouts
  for(let i=0;i<N.length;i++){
    const n=N[i];
    posDisc[i].set(n.x, n.y, n.z);
    const ang=2*Math.PI*n.cof/12+(QORDER.indexOf(n.q)-(QORDER.length-1)/2)*0.05, R=(n.n>=4?R0+16:R0);
    posExpl[i].set(R*Math.cos(ang), (n.cons-0.5)*150, R*Math.sin(ang));
  }
  // rebuild the normalized feature table used by the "Musical axes" layout
  N.forEach((n,i)=>{ rawF.pitch[i]=n.freqs.reduce((s,f)=>s+Math.log2(f),0)/n.freqs.length;
    rawF.bright[i]=centroidOf(n); rawF.cons[i]=n.cons; });
  for(const k of ['pitch','bright','cons']){ const a=rawF[k],mn=Math.min.apply(null,a),mx=Math.max.apply(null,a),sp=(mx-mn)||1;
    F[k]=a.map(v=>(v-mn)/sp); }
}
function setTuning(t){
  if(t===TUNING) return;
  TUNING = t;
  const src = (t==='JI') ? '_ji' : '_et';
  N.forEach(n=>{ const s=n[src]; n.x=s.x; n.y=s.y; n.z=s.z; n.freqs=s.freqs; n.cons=s.cons; });
  W = (t==='JI' && DATA.WJI) ? DATA.WJI : DATA.W;
  EDGES = (t==='JI' && DATA.edgesJI) ? DATA.edgesJI : DATA.edges;
  rebuildDerivedForTuning();
  if(typeof buildEdges==='function' && edgeLines) buildEdges(+document.getElementById('wslider').value);
  if(renderMode==='clouds' && typeof buildCloud==='function'){ buildCloud(); if(typeof updateCloud==='function') updateCloud(); }
  setLayout(layoutName);                                        // morph to the new positions
  document.querySelectorAll('#tuneToggle button').forEach(b=>b.classList.toggle('on', b.dataset.tune===t));
  View.set({ tuning: t });
}
function wireTuneToggle(){
  const bar = document.getElementById('tuneToggle'); if(!bar) return;
  bar.addEventListener('click', e=>{ const b=e.target.closest('button[data-tune]'); if(!b) return; setTuning(b.dataset.tune); });
}
