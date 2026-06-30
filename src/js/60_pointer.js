// pointer
const ray=new THREE.Raycaster();let down=false,moved=0,sx=0,sy=0,dT=0,pinch=false,pinchD=0;
canvas.addEventListener('pointerdown',e=>{down=true;moved=0;sx=e.clientX;sy=e.clientY;dT=performance.now();});
canvas.addEventListener('pointermove',e=>{if(!down||pinch)return;const dx=e.clientX-sx,dy=e.clientY-sy;moved+=Math.abs(dx)+Math.abs(dy);
  theta-=dx*0.005;phi=Math.max(0.15,Math.min(Math.PI-0.15,phi-dy*0.005));sx=e.clientX;sy=e.clientY;});
canvas.addEventListener('pointerup',e=>{down=false;if(moved<6&&performance.now()-dT<400)tap(e.clientX,e.clientY);});
function tap(cx,cy){if(wfMode)return;const r=canvas.getBoundingClientRect();
  ray.setFromCamera({x:((cx-r.left)/r.width)*2-1,y:-((cy-r.top)/r.height)*2+1},camera);
  const hit=ray.intersectObjects(picks,false);if(hit.length)selectNode(hit[0].object.userData.index);}
canvas.addEventListener('wheel',e=>{e.preventDefault();radius=Math.max(80,Math.min(900,radius*(1+Math.sign(e.deltaY)*0.08)));},{passive:false});
canvas.addEventListener('touchstart',e=>{if(e.touches.length===2){pinch=true;
  pinchD=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);}},{passive:false});
canvas.addEventListener('touchmove',e=>{if(pinch&&e.touches.length===2){e.preventDefault();
  const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
  radius=Math.max(80,Math.min(900,radius*(pinchD/d)));pinchD=d;}},{passive:false});
canvas.addEventListener('touchend',e=>{if(e.touches.length<2)pinch=false;});
