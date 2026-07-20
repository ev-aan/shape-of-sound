// circle-of-fifths ring + labels
const ringGroup=[];let ringLine=null;
(function(){const pts=[];for(let cof=0;cof<=12;cof++){const a=2*Math.PI*(cof%12)/12;pts.push(R0*Math.cos(a),0,R0*Math.sin(a));}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
  ringLine=new THREE.Line(g,new THREE.LineBasicMaterial({color:0x6f86c8,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
  scene.add(ringLine);
  for(let cof=0;cof<12;cof++){const a=2*Math.PI*cof/12,sp=makeText(NOTE[(cof*7)%12],'#dfe8ff',20,10);
    sp.position.set((R0+22)*Math.cos(a),0,(R0+22)*Math.sin(a));scene.add(sp);ringGroup.push(sp);}})();

// tears down an optional line/mesh reference cleanly (scene removal + geometry/material
// disposal) — the same 3-line teardown buildEdges/highlight (below) and rebuildTrail
// (30_meteor.js) each repeat before rebuilding themselves from scratch.
function disposeLine(line){
  if(line){ scene.remove(line); line.geometry.dispose(); line.material.dispose(); }
  return null;
}
// a BufferGeometry from a flat [x,y,z,...] position array, plus an optional flat
// [r,g,b,...] vertex-color array (omit for a solid-color line, like highlight() below).
function positionColorGeometry(positions, colors){
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if(colors) g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return g;
}
let edgeLines=null;
function wAt(t){return wmin+(t/1000)*(wmax-wmin);}
function buildEdges(thr){
  edgeLines = disposeLine(edgeLines);
  const P=[],C=[],span=(wmax-wmin)||1;
  for(const e of EDGES){if(e.w<thr)continue;const a=pos[e.i],b=pos[e.j];P.push(a.x,a.y,a.z,b.x,b.y,b.z);
    const t=(e.w-wmin)/span,br=0.12+0.85*t*t;for(let k=0;k<2;k++)C.push(0.55*br,0.68*br,0.95*br);}
  edgeLines=new THREE.LineSegments(positionColorGeometry(P,C),new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.7,
    blending:THREE.AdditiveBlending,depthWrite:false}));edgeLines.visible=(keyRoot==null);scene.add(edgeLines);}

let hl=null,hlT=0;
function highlight(i){
  hl = disposeLine(hl);
  const P=[],row=W[i],order=row.map((w,j)=>[w,j]).sort((a,b)=>b[0]-a[0]).slice(1,8);
  for(const[,j]of order){const a=pos[i],b=pos[j];P.push(a.x,a.y,a.z,b.x,b.y,b.z);}
  hl=new THREE.LineSegments(positionColorGeometry(P),new THREE.LineBasicMaterial({color:new THREE.Color(FAM[N[i].family]),transparent:true,
    opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(hl);hlT=2.4;}
