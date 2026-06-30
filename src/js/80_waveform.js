// ---- waveform: notes as sines, chord as their sum (2D wave + 3D spiral) ----
let wfMode=false,wfNotes=new Set([0,4,7]),wfH=6,wfLine=null;
const wfBase=60,m2f=m=>440*Math.pow(2,(m-69)/12);
function wfFreqs(){return [...wfNotes].sort((a,b)=>a-b).map(pc=>m2f(wfBase+pc));}
function wfSamples(n3){const fs=wfFreqs();if(!fs.length)return{re:[],im:[],t:[]};
  const fmin=Math.min.apply(null,fs),total=3/fmin,re=[],im=[],ts=[];let amax=1e-6;
  for(let s=0;s<n3;s++){const t=total*s/(n3-1);let r=0,m=0;
    fs.forEach(f=>{for(let k=1;k<=wfH;k++){const a=1/k,ph=2*Math.PI*k*f*t;r+=a*Math.cos(ph);m+=a*Math.sin(ph);}});
    re.push(r);im.push(m);ts.push(s/(n3-1));amax=Math.max(amax,Math.abs(r),Math.abs(m));}
  const inv=1/amax;return{re:re.map(v=>v*inv),im:im.map(v=>v*inv),t:ts};}
function buildWave3D(){if(wfLine){scene.remove(wfLine);wfLine.geometry.dispose();wfLine.material.dispose();wfLine=null;}
  const S=wfSamples(720);if(!S.re.length)return;const P=[],C=[],tmp=new THREE.Color();
  for(let i=0;i<S.re.length;i++){P.push((S.t[i]-0.5)*220,S.re[i]*70,S.im[i]*70);
    tmp.setHSL((0.58+S.re[i]*0.12+1)%1,0.7,0.5+0.25*Math.abs(S.re[i]));C.push(tmp.r,tmp.g,tmp.b);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
  wfLine=new THREE.Line(g,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}));
  scene.add(wfLine);}
function drawWave2D(){const cv=document.getElementById('waveCanvas'),dpr=Math.min(devicePixelRatio,2);
  const Wc=cv.getBoundingClientRect().width||320,Hc=140;cv.width=Wc*dpr;cv.height=Hc*dpr;
  const x=cv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,Wc,Hc);const mid=Hc/2;
  x.strokeStyle='#ffffff14';x.lineWidth=1;x.beginPath();x.moveTo(0,mid);x.lineTo(Wc,mid);x.stroke();
  const S=wfSamples(Math.max(240,Math.floor(Wc)));if(!S.re.length)return;
  x.strokeStyle='#9ad1f0';x.lineWidth=1.8;x.beginPath();
  for(let i=0;i<S.re.length;i++){const px=i/(S.re.length-1)*Wc,py=mid-S.re[i]*(mid-12);i?x.lineTo(px,py):x.moveTo(px,py);}
  x.stroke();}
function setManifoldVisible(v){for(let i=0;i<N.length;i++){dots[i].visible=v&&renderMode==='stars';halos[i].visible=v&&renderMode==='stars';}
  if(cloudPoints)cloudPoints.visible=v&&renderMode==='clouds';
  if(edgeLines)edgeLines.visible=v&&renderMode!=='clouds'&&keyRoot==null;
  ringLine.visible=v;ringGroup.forEach(s=>s.visible=v);keyLabels.forEach(s=>s.visible=v);keyArrows.forEach(o=>o.visible=v);}
function refreshWave(){if(!wfMode)return;buildWave3D();drawWave2D();}
function renderWaveNotes(){document.getElementById('waveNotes').innerHTML=NOTE.map((nm,pc)=>'<button data-n="'+pc+'" class="'+(wfNotes.has(pc)?'on':'')+'">'+nm+'</button>').join('');}
function openWave(seed){if(seed&&seed.length)wfNotes=new Set(seed);wfMode=true;setManifoldVisible(false);
  document.getElementById('wave').classList.add('show');renderWaveNotes();refreshWave();}
function closeWave(){wfMode=false;if(wfLine){scene.remove(wfLine);wfLine.geometry.dispose();wfLine.material.dispose();wfLine=null;}
  setManifoldVisible(true);document.getElementById('wave').classList.remove('show');}
document.getElementById('wfBtn').onclick=()=>{wfMode?closeWave():openWave();};
document.getElementById('waveClose').onclick=closeWave;
document.getElementById('waveNotes').addEventListener('click',e=>{const b=e.target.closest('[data-n]');if(!b)return;
  const pc=+b.dataset.n;wfNotes.has(pc)?wfNotes.delete(pc):wfNotes.add(pc);renderWaveNotes();refreshWave();});
document.getElementById('waveH').oninput=function(){wfH=+this.value;document.getElementById('waveHval').textContent=wfH;refreshWave();};
document.getElementById('wavePlay').onclick=()=>{unlockAudio();playFreqs(wfFreqs());};
