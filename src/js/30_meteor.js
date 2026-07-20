// meteor + trail
const meteor=new THREE.Mesh(new THREE.SphereGeometry(2.6,16,12),new THREE.MeshBasicMaterial({color:0xfff1c2}));
const mGlow=makeGlowSprite(0xffb24d, .95, 34);
meteor.visible=mGlow.visible=false;scene.add(meteor);scene.add(mGlow);
let trail=null,trailPts=[];
function rebuildTrail(){
  trail = disposeLine(trail);
  if(trailPts.length<2){trail=null;return;}const P=[],C=[],n=trailPts.length;
  for(let k=0;k<n;k++){const v=trailPts[k];P.push(v.x,v.y,v.z);const f=k/(n-1);C.push(f,.72*f,.30*f);}
  trail=new THREE.Line(positionColorGeometry(P,C),new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false}));
  scene.add(trail);}
