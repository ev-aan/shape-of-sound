// ---- compose / 16-bar sequencer ----
let composeOpen=false,seq=new Array(16).fill(null),active=0,loopOn=false,segDur=0.7;
const setPCS=i=>new Set(pcsOf(N[i]));
function vlDist(a,b){const pa=pcsOf(N[a]),pb=pcsOf(N[b]);
  const near=(p,arr)=>Math.min.apply(null,arr.map(q=>{const d=Math.abs(p-q)%12;return Math.min(d,12-d);}));
  return (pa.reduce((s,p)=>s+near(p,pb),0)+pb.reduce((s,p)=>s+near(p,pa),0))/2;}
function rootTag(a,b){const m=(N[b].root-N[a].root+12)%12;
  return ({5:'down a 5th',7:'up a 5th',2:'up a step',10:'down a step',9:'down a 3rd',3:'up a 3rd',4:'up a 3rd',8:'down a 3rd',0:'same root'})[m]||'';}
function suggestNext(a){const out=[],pa=setPCS(a);
  for(let b=0;b<N.length;b++){if(b===a)continue;const ov=W[a][b],vl=vlDist(a,b),vlS=1/(1+vl);
    let fb=0,tag='';const m=(N[b].root-N[a].root+12)%12;
    if(m===5)fb+=0.5;else if(m===2)fb+=0.2;
    const sh=pcsOf(N[b]).filter(p=>pa.has(p)).length;
    if(keyRoot!=null){const da=diatonic(N[a]),db=diatonic(N[b]);
      if(da&&db){fb+=0.25;
        if(da.fn==='D'&&db.fn==='T'){fb+=0.6;tag='resolves D→T';}
        else if(da.fn==='S'&&db.fn==='D'){fb+=0.35;tag='S→D';}
        else if(da.fn==='T'&&db.fn==='S'){fb+=0.2;}
        if(!tag)tag=db.num;}
      else if(!db)fb-=0.35;}
    if(!tag){if(vl<=2)tag='smooth '+vl.toFixed(0)+'-step';else if(sh>=2)tag='shares '+sh;else tag=rootTag(a,b)||('shares '+sh);}
    out.push({b,score:0.45*ov+0.3*vlS+0.25*Math.min(1,fb),tag});}
  out.sort((x,y)=>y.score-x.score);return out.slice(0,6);}
function seedList(){if(keyRoot!=null){const rep=repPerDegree();
    return [0,5,7,9].map(d=>rep[d]).filter(x=>x!=null).map(b=>({b,tag:diatonic(N[b]).num}));}
  return ['Cmaj','Gmaj','Amin','Fmaj','Dmin','Emin'].map(nm=>N.findIndex(n=>n.name===nm)).filter(i=>i>=0).map(b=>({b,tag:'start'}));}
function lastFilled(){for(let k=15;k>=0;k--)if(seq[k]!=null)return seq[k];return null;}
function renderSeq(){document.getElementById('seqSlots').innerHTML=seq.map((idx,k)=>
  '<div class="slot'+(k===active?' active':'')+(idx!=null?' filled':'')+'" data-slot="'+k+'">'+(idx!=null?N[idx].name:(k+1))+'</div>').join('');}
function renderSugg(){const prev=(active>0&&seq[active-1]!=null)?seq[active-1]:lastFilled();
  const list=(prev==null)?seedList():suggestNext(prev);
  document.getElementById('sugg').innerHTML=list.map(o=>'<button class="chip" data-add="'+o.b+'">'+N[o.b].name+
    '<span class="tag">'+(o.tag||'')+'</span></button>').join('');}
function addToSeq(i){if(!composeOpen)openCompose();seq[active]=i;active=Math.min(active+1,15);
  renderSeq();renderSugg();playFreqs(N[i].freqs);}
const composeEl=document.getElementById('compose');
function openCompose(){composeOpen=true;composeEl.classList.add('show');renderSeq();renderSugg();}
function closeCompose(){composeOpen=false;composeEl.classList.remove('show');}
document.getElementById('composeBtn').onclick=()=>{composeOpen?closeCompose():openCompose();};
document.getElementById('composeClose').onclick=closeCompose;
document.getElementById('seqSlots').addEventListener('click',e=>{const s=e.target.closest('[data-slot]');if(!s)return;
  active=+s.dataset.slot;renderSeq();renderSugg();});
document.getElementById('sugg').addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(b)addToSeq(+b.dataset.add);});
document.getElementById('seqPlay').onclick=()=>{const s=seq.filter(x=>x!=null);if(s.length){unlockAudio();startProg(s,loopOn);}};
document.getElementById('seqStop').onclick=()=>{prog=null;meteor.visible=mGlow.visible=false;trailPts=[];rebuildTrail();setLocked(false);};
document.getElementById('seqClear').onclick=()=>{seq=new Array(16).fill(null);active=0;renderSeq();renderSugg();};
document.getElementById('seqDel').onclick=()=>{for(let k=15;k>=0;k--)if(seq[k]!=null){seq[k]=null;active=k;break;}renderSeq();renderSugg();};
const seqLoop=document.getElementById('seqLoop');seqLoop.onclick=()=>{loopOn=!loopOn;seqLoop.classList.toggle('on',loopOn);};
document.getElementById('seqTempo').oninput=function(){segDur=1.15-(+this.value/100)*0.8;};
