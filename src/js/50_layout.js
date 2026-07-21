// layout / morph / musical features / clouds
let colorMode='family',layoutName='disc',mt=1,ringO=0,renderMode='stars',locked=false;
let posFrom=N.map(()=>new THREE.Vector3()),posTo=N.map(()=>new THREE.Vector3());
const CAP_DISC='raw harmonic similarity — the circle of fifths, flattened';
const CAP_EXPL='around → circle of fifths  ·  up → more consonant  ·  outer ring → 7th chords';
const axiscap=document.getElementById('axiscap');
const CREF=261.6256;
function centroidOf(n){let s=0,a=0;n.freqs.forEach(f=>{for(let k=1;k<=16;k++){s+=(1/k)*(k*f);a+=1/k;}});return Math.log2(s/a);}
const rawF={pitch:[],bright:[],cons:[],fifths:[],root:[],notes:[],major:[]};
N.forEach(n=>{rawF.pitch.push(n.freqs.reduce((s,f)=>s+Math.log2(f),0)/n.freqs.length);
  rawF.bright.push(centroidOf(n));rawF.cons.push(n.cons);rawF.fifths.push(n.cof/12);rawF.root.push(n.root/12);
  rawF.notes.push(n.n);rawF.major.push(n.ivs.indexOf(4)>=0?1:(n.ivs.indexOf(3)>=0?0:.5));});
const F={};for(const k in rawF){const a=rawF[k],mn=Math.min.apply(null,a),mx=Math.max.apply(null,a),sp=(mx-mn)||1;F[k]=a.map(v=>(v-mn)/sp);}
const FLABEL={pitch:'pitch height',bright:'brightness',cons:'consonance',fifths:'circle of 5ths',root:'root (chromatic)',notes:'# of notes',major:'major↔minor'};
let xf='fifths',yf='cons',zf='bright';
function axesCaption(){return 'x: '+FLABEL[xf]+'  ·  y: '+FLABEL[yf]+'  ·  z: '+FLABEL[zf];}
function computeAxes(){return N.map((n,i)=>new THREE.Vector3((F[xf][i]-.5)*220,(F[yf][i]-.5)*220,(F[zf][i]-.5)*220));}
function curLayout(name){if(name==='expl')return posExpl;if(name==='axes')return computeAxes();if(name==='tonnetz')return computeTonnetz();return posDisc;}
function updatePositions(){const e=ease(Math.min(mt,1));
  for(let i=0;i<N.length;i++){pos[i].copy(posFrom[i]).lerp(posTo[i],e);
    dots[i].position.copy(pos[i]);halos[i].position.copy(pos[i]);picks[i].position.copy(pos[i]);}
  positionLabels();}
function ringOpacity(){ringLine.material.opacity=.5*ringO;for(const s of ringGroup)s.material.opacity=ringO;}
function updateCaption(){if(keyRoot==null)axiscap.textContent=(layoutName==='expl')?CAP_EXPL:(layoutName==='axes'?axesCaption():CAP_DISC);}
function setLayout(name){if(locked)return;posFrom=pos.map(p=>p.clone());posTo=curLayout(name).map(p=>p.clone());mt=0;layoutName=name;
  setPill('layoutPills',name);updateCaption();document.getElementById('axisSel').style.display=(name==='axes')?'flex':'none';}
// layoutName is reassigned by setLayout, so a plain __api reference would only ever capture
// its boot-time value — expose it live via a getter instead, same reason getRippleMode() etc. exist
function getLayoutName(){ return layoutName; }
function setLocked(on){locked=on;[...document.getElementById('layoutPills').children].forEach(b=>b.disabled=on);}
function setPill(id,k){[...document.getElementById(id).children].forEach(b=>b.classList.toggle('on',b.dataset.k===k));}
document.getElementById('layoutPills').addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!b.disabled)setLayout(b.dataset.k);});
document.getElementById('colorPills').addEventListener('click',e=>{const b=e.target.closest('button');
  if(b){colorMode=b.dataset.k;if(keyRoot==null&&renderMode==='stars'){applyColors(colorMode);setLegend(colorMode);}setPill('colorPills',colorMode);}});
const namesBtn=document.getElementById('namesBtn');
namesBtn.onclick=()=>{showNames=!showNames;namesBtn.classList.toggle('on',showNames);positionLabels();};
(function(){const opt=Object.keys(FLABEL).map(k=>'<option value="'+k+'">'+FLABEL[k]+'</option>').join('');
  ['axX','axY','axZ'].forEach((id,ix)=>{const s=document.getElementById(id);s.innerHTML=opt;s.value=[xf,yf,zf][ix];
    s.onchange=()=>{xf=document.getElementById('axX').value;yf=document.getElementById('axY').value;zf=document.getElementById('axZ').value;
      if(layoutName==='axes')setLayout('axes');};});})();
