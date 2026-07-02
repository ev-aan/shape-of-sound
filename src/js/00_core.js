const FAM={major:'#7cc4f2',minor:'#b39ddb',dominant:'#66d6b8',diminished:'#ef9ac0',augmented:'#f2b56b',suspended:'#cfd58a'};
const NOTE=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const QORDER=['maj','min','dim','aug','sus2','sus4','7','maj7','min7','m7b5','dim7','mMaj7','6','add9'];
const RATIO={0:'1:1',1:'16:15',2:'9:8',3:'6:5',4:'5:4',5:'4:3',6:'7:5',7:'3:2',8:'8:5',9:'5:3',10:'9:5',11:'15:8'};
const DEG={0:{num:'I',fn:'T'},2:{num:'ii',fn:'S'},4:{num:'iii',fn:'T'},5:{num:'IV',fn:'S'},7:{num:'V',fn:'D'},9:{num:'vi',fn:'T'},11:{num:'vii°',fn:'D'}};
const DEGQ={0:['maj','maj7','6','add9'],2:['min','min7'],4:['min','min7'],5:['maj','maj7','6','add9'],7:['maj','7'],9:['min','min7'],11:['dim','m7b5']};
const FN={T:'#6ad29a',S:'#f2c14e',D:'#ef6f6f'},FNNAME={T:'tonic',S:'subdominant',D:'dominant'};
const N=DATA.nodes;let EDGES=DATA.edges,W=DATA.W;const wmin=DATA.w_min,wmax=DATA.w_max;
// stash both tunings on each node so setTuning can swap the active fields in place
N.forEach(n=>{n._et={x:n.x,y:n.y,z:n.z,freqs:n.freqs,cons:n.cons};
  n._ji={x:n.jx,y:n.jy,z:n.jz,freqs:n.freqsJI||n.freqs,cons:n.consJI!=null?n.consJI:n.cons};});
const pcsOf=n=>n.ivs.map(iv=>(n.root+iv)%12);
document.getElementById('subtitle').textContent=
  N.length+' chords · placed by shared overtones · 3D holds '+Math.round(DATA.var3*100)+'%';

const leg=document.getElementById('legend');
function setLegend(mode){leg.innerHTML='';
  if(keyRoot!=null){['T','S','D'].forEach(f=>{const d=document.createElement('div');
    d.innerHTML='<i style="background:'+FN[f]+'"></i>'+FNNAME[f];leg.appendChild(d);});return;}
  if(mode==='family'){for(const k in FAM){const d=document.createElement('div');
    d.innerHTML='<i style="background:'+FAM[k]+'"></i>'+k;leg.appendChild(d);}}
  else{const d=document.createElement('div');d.innerHTML='<span class="bar"></span>&nbsp;root, around circle of 5ths';leg.appendChild(d);}}

const canvas=document.getElementById('scene');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x060812,0.0015);
const camera3D=new THREE.PerspectiveCamera(55,1,1,6000);
const camera2D=new THREE.OrthographicCamera(-100,100,100,-100,-3000,6000);
let camera=camera3D;
let theta=0.7,phi=1.12,radius=300;const tgt=new THREE.Vector3();
function updateCamera(){
  camera3D.position.set(tgt.x+radius*Math.sin(phi)*Math.cos(theta),tgt.y+radius*Math.cos(phi),
    tgt.z+radius*Math.sin(phi)*Math.sin(theta));camera3D.lookAt(tgt);
  camera2D.position.set(tgt.x,tgt.y+radius*2,tgt.z);camera2D.up.set(0,0,-1);camera2D.lookAt(tgt);
}
function resize(){renderer.setSize(innerWidth,innerHeight);const a=innerWidth/innerHeight;
  camera3D.aspect=a;camera3D.updateProjectionMatrix();
  const h=radius*0.9,w=h*a;camera2D.left=-w;camera2D.right=w;camera2D.top=h;camera2D.bottom=-h;camera2D.updateProjectionMatrix();
  if(document.getElementById('scope').classList.contains('show'))drawScope();
  if(document.getElementById('wave').classList.contains('show'))drawWave2D();}
addEventListener('resize',resize);resize();

(function(){const g=new THREE.BufferGeometry(),p=[];for(let i=0;i<420;i++){const r=1400+Math.random()*1600,
  u=Math.random()*2-1,a=Math.random()*6.283,s=Math.sqrt(1-u*u);p.push(r*s*Math.cos(a),r*u,r*s*Math.sin(a));}
  g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  scene.add(new THREE.Points(g,new THREE.PointsMaterial({color:0x223052,size:2,sizeAttenuation:false})));})();

function glowTex(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');
  const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');
  g.addColorStop(.25,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(c);}
const GLOW=glowTex();
function makeText(txt,color,sx,sy){const c=document.createElement('canvas');c.width=128;c.height=64;const x=c.getContext('2d');
  x.font='bold 40px Georgia';x.fillStyle=color;x.textAlign='center';x.textBaseline='middle';x.fillText(txt,64,32);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,opacity:0,depthWrite:false}));
  sp.scale.set(sx,sy,1);return sp;}

const R0=92,posDisc=[],posExpl=[],pos=[];
N.forEach(n=>{posDisc.push(new THREE.Vector3(n.x,n.y,n.z));
  const ang=2*Math.PI*n.cof/12+(QORDER.indexOf(n.q)-(QORDER.length-1)/2)*0.05,R=(n.n>=4?R0+16:R0);
  posExpl.push(new THREE.Vector3(R*Math.cos(ang),(n.cons-0.5)*150,R*Math.sin(ang)));pos.push(new THREE.Vector3());});

const dots=[],halos=[],picks=[],pulses=new Float32Array(N.length);
const sphGeo=new THREE.SphereGeometry(1,16,12),pickGeo=new THREE.SphereGeometry(1,8,6);
N.forEach((n,i)=>{const r=1.5+n.cons*2.4;
  const dot=new THREE.Mesh(sphGeo,new THREE.MeshBasicMaterial({color:new THREE.Color(FAM[n.family]),transparent:true,opacity:1}));
  dot.scale.setScalar(r);scene.add(dot);dots.push(dot);dot.userData.r=r;
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:new THREE.Color(FAM[n.family]),transparent:true,
    opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false}));halo.userData.base=r*7;halo.scale.setScalar(r*7);
  scene.add(halo);halos.push(halo);
  const pk=new THREE.Mesh(pickGeo,new THREE.MeshBasicMaterial({visible:false}));pk.scale.setScalar(Math.max(6,r*2.6));
  pk.userData.index=i;scene.add(pk);picks.push(pk);});
// chord-name labels (one per dot)
function makeLabel(txt){const w=Math.max(64,txt.length*20+18);const c=document.createElement('canvas');c.width=w;c.height=38;
  const x=c.getContext('2d');x.font='600 24px ui-monospace,Menlo,monospace';x.fillStyle='#e8eefb';x.textAlign='center';x.textBaseline='middle';
  x.fillText(txt,w/2,20);const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,opacity:0,depthWrite:false,depthTest:false}));
  sp.scale.set(w/38*5.4,5.4,1);sp.userData.w=w;return sp;}
const nodeLabels=[];let showNames=true;
N.forEach((n,i)=>{const lab=makeLabel(n.name);scene.add(lab);nodeLabels.push(lab);});
function positionLabels(){for(let i=0;i<nodeLabels.length;i++){const lab=nodeLabels[i],P=pos[i];
  lab.position.set(P.x,P.y+dots[i].userData.r+3.4,P.z);
  const dia=(keyRoot==null)||!!diatonic(N[i]);
  lab.material.opacity=(showNames && !wfMode && dia && (keyRoot==null||!keyFocus||dia))?0.95:0;}}
function baseColor(i){const n=N[i];return colorMode==='fifths'?null:FAM[n.family];}
function applyColors(mode){N.forEach((n,i)=>{const c=dots[i].material.color,h=halos[i].material.color;
  dots[i].material.opacity=1;halos[i].material.opacity=.55;
  if(mode==='family'){c.set(FAM[n.family]);h.set(FAM[n.family]);}else{c.setHSL(n.cof/12,.62,.62);h.setHSL(n.cof/12,.62,.62);}});}
