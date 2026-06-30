// meteor + trail
const meteor=new THREE.Mesh(new THREE.SphereGeometry(2.6,16,12),new THREE.MeshBasicMaterial({color:0xfff1c2}));
const mGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xffb24d,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}));
mGlow.scale.setScalar(34);meteor.visible=mGlow.visible=false;scene.add(meteor);scene.add(mGlow);
let trail=null,trailPts=[];
function rebuildTrail(){if(trail){scene.remove(trail);trail.geometry.dispose();trail.material.dispose();}
  if(trailPts.length<2){trail=null;return;}const P=[],C=[],n=trailPts.length;
  for(let k=0;k<n;k++){const v=trailPts[k];P.push(v.x,v.y,v.z);const f=k/(n-1);C.push(f,.72*f,.30*f);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
  trail=new THREE.Line(g,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(trail);}
