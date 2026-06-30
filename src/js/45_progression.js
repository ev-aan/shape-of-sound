// readout (progression)
const roWrap=document.getElementById('axiscap');
function axisText(){return layoutName==='expl'?CAP_EXPL:(layoutName==='axes'?axesCaption():CAP_DISC);}

function selectNode(i){pulses[i]=1.5;highlight(i);
  if(composeOpen){addToSeq(i);}else{playFreqs(N[i].freqs);renderDetail(i);}}

// progression
let prog=null;
function startProg(seqA,loop){prog={seq:seqA.slice(),seg:0,t:0,loop:!!loop};trailPts=[pos[seqA[0]].clone()];rebuildTrail();
  meteor.visible=mGlow.visible=true;meteor.position.copy(pos[seqA[0]]);mGlow.position.copy(pos[seqA[0]]);
  pulses[seqA[0]]=1.4;playFreqs(N[seqA[0]].freqs);setLocked(true);}
function stepArrive(){const cur=prog.seq[prog.seg];pulses[cur]=1.6;playFreqs(N[cur].freqs);}
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
function advanceProg(dt){if(prog.seg>=prog.seq.length-1){prog.hold=(prog.hold||0)+dt;
    if(prog.hold>1.0){if(prog.loop){startProg(prog.seq,true);}else{meteor.visible=mGlow.visible=false;trailPts=[];rebuildTrail();prog=null;setLocked(false);}}return;}
  prog.t+=dt/segDur;const a=pos[prog.seq[prog.seg]],b=pos[prog.seq[prog.seg+1]];
  const p=a.clone().lerp(b,ease(Math.min(prog.t,1)));meteor.position.copy(p);mGlow.position.copy(p);
  trailPts.push(p.clone());if(trailPts.length>90)trailPts.shift();rebuildTrail();
  if(prog.t>=1){prog.t=0;prog.seg++;stepArrive();}}
const progWrap=document.getElementById('progs');
for(const label in DATA.progressions){const b=document.createElement('button');b.textContent=label;
  b.onclick=()=>{if(prog)return;unlockAudio();startProg(DATA.progressions[label]);};progWrap.appendChild(b);}
