// ---- KEY OVERLAY ----
let keyRoot=null,keyLabels=[],keyArrows=[],keyFocus=false;
function diaVisible(i){
  const v=View.get();
  if(v.mode==='musical'){
    if(v.key==null) return true;
    return chordInScale(N[i], v.scale, v.key);
  }
  return keyRoot==null||!keyFocus||!!diatonic(N[i]);
}
function clearKeyVisuals(){keyLabels.forEach(s=>scene.remove(s));keyLabels=[];
  keyArrows.forEach(o=>{scene.remove(o);if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose();});keyArrows=[];}
function diatonic(n){const deg=(n.root-keyRoot+12)%12;if(DEG[deg]&&DEGQ[deg].indexOf(n.q)>=0)return{deg,num:DEG[deg].num,fn:DEG[deg].fn};return null;}
function buildArrow(ai,bi,color){const a=pos[ai],b=pos[bi];
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([a.x,a.y,a.z,b.x,b.y,b.z],3));
  const ln=new THREE.Line(g,new THREE.LineBasicMaterial({color:new THREE.Color(color),transparent:true,opacity:.55}));
  scene.add(ln);keyArrows.push(ln);
  const dir=b.clone().sub(a);const len=dir.length();if(len<1)return;dir.normalize();
  const cone=new THREE.Mesh(new THREE.ConeGeometry(2.6,7,12),new THREE.MeshBasicMaterial({color:new THREE.Color(color)}));
  const tip=b.clone().sub(dir.clone().multiplyScalar(6));cone.position.copy(tip);
  cone.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);scene.add(cone);keyArrows.push(cone);}
function repPerDegree(){const rep={};N.forEach((n,i)=>{const d=diatonic(n);if(!d)return;const deg=d.deg;
  const better=(deg===7?n.q==='7':['maj','min','dim'].indexOf(n.q)>=0);
  if(rep[deg]===undefined||better&&!rep[deg+'_b']){rep[deg]=i;if(better)rep[deg+'_b']=true;}});return rep;}
function applyKey(root){keyRoot=root;clearKeyVisuals();
  if(root==null){N.forEach((n,i)=>{dots[i].material.opacity=1;halos[i].material.opacity=.55;});
    applyColors(colorMode);setLegend(colorMode);if(edgeLines)edgeLines.visible=(renderMode!=='clouds');
    setRender(renderMode);positionLabels();
    document.getElementById('axiscap').textContent=axisText();return;}
  N.forEach((n,i)=>{const d=diatonic(n);const c=dots[i].material.color,h=halos[i].material.color;
    if(d){c.set(FN[d.fn]);h.set(FN[d.fn]);dots[i].material.opacity=1;halos[i].material.opacity=.7;
      const lab=makeText(d.num,FN[d.fn],15,7.5);lab.material.opacity=1;lab.userData.idx=i;scene.add(lab);keyLabels.push(lab);}
    else{c.set('#22304a');h.set('#22304a');dots[i].material.opacity=.12;halos[i].material.opacity=.04;}});
  const rep=repPerDegree();
  const A=(s,t,col)=>{if(rep[s]!==undefined&&rep[t]!==undefined)buildArrow(rep[s],rep[t],col);};
  A(2,7,FN.S);A(5,7,FN.S);A(7,0,FN.D);A(11,0,FN.D);   // ii/IV -> V -> I, vii -> I
  positionKeyVisuals();
  if(edgeLines)edgeLines.visible=false;setLegend();setRender(renderMode);positionLabels();
  document.getElementById('axiscap').textContent='Key of '+NOTE[root]+' major — I ii iii IV V vi vii°  ·  green=tonic amber=subdominant red=dominant';}
function positionKeyVisuals(){keyLabels.forEach(s=>{const p=pos[s.userData.idx];s.position.set(p.x,p.y+7,p.z);});
  if(keyRoot!=null){clearArrowsOnly();const rep=repPerDegree();
    const A=(s,t,col)=>{if(rep[s]!==undefined&&rep[t]!==undefined)buildArrow(rep[s],rep[t],col);};
    A(2,7,FN.S);A(5,7,FN.S);A(7,0,FN.D);A(11,0,FN.D);}}
function clearArrowsOnly(){keyArrows.forEach(o=>{scene.remove(o);if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose();});keyArrows=[];}
