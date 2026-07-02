// init
posFrom=posDisc.map(p=>p.clone());posTo=posDisc.map(p=>p.clone());mt=1;
applyColors('family');setLegend('family');updatePositions();updateCloud();applyThr();axiscap.textContent=CAP_DISC;
setTimeout(()=>{const t=document.getElementById('toast');if(t){t.style.opacity=0;setTimeout(()=>t.remove&&t.remove(),500);}},6500);

let appVisible=true; // paused while the Simple front door is showing — nothing to see, no need to render
const clock=new THREE.Clock();
function frame(){const dt=Math.min(clock.getDelta(),0.05);
  if(appVisible){
  if(!down&&!prog)theta+=dt*0.03;
  const ringTarget=(layoutName==='expl')?1:0;
  if(mt<1||Math.abs(ringO-ringTarget)>0.001){if(mt<1)mt=Math.min(1,mt+dt*2.4);
    ringO+=(ringTarget-ringO)*Math.min(1,dt*4);updatePositions();buildEdges(curThr());ringOpacity();
    if(renderMode==='clouds')updateCloud();if(keyRoot!=null)positionKeyVisuals();}
  for(let i=0;i<halos.length;i++){if(pulses[i]>0){pulses[i]=Math.max(0,pulses[i]-dt*1.8);
    halos[i].scale.setScalar(halos[i].userData.base*(1+pulses[i]));}}
  if(hl){hlT-=dt;hl.material.opacity=Math.max(0,hlT/2.4)*0.9;if(hlT<=0){scene.remove(hl);hl.geometry.dispose();hl.material.dispose();hl=null;}}
  if(prog)advanceProg(dt);
  updateCamera();renderer.render(scene,camera);}
  requestAnimationFrame(frame);}
frame();
