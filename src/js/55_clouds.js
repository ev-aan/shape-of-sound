// ---- clouds of sound: each chord rendered as its overtone spectrum ----
const cloudMat=new THREE.ShaderMaterial({uniforms:{uScale:{value:320}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:'attribute float psize;attribute vec3 vcolor;varying vec3 vC;void main(){vC=vcolor;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=psize*(uScale/-mv.z);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'varying vec3 vC;void main(){float d=length(gl_PointCoord-vec2(0.5));if(d>0.5)discard;float a=smoothstep(0.5,0.0,d);gl_FragColor=vec4(vC,a);}'});
let cloudPoints=null,cloudLocal=[];
function buildCloud(){const H=10,col=[],siz=[],tmp=new THREE.Color();cloudLocal=[];
  N.forEach((n,i)=>{const f0=Math.min.apply(null,n.freqs);
    n.freqs.forEach(f=>{for(let k=1;k<=H;k++){const pf=k*f,amp=1/k,pitch=Math.log2(pf),seed=(i*131+k*17+Math.round(f))%360,rad=2.2+amp*2;
      cloudLocal.push({i,ox:Math.cos(seed)*rad,oy:(pitch-Math.log2(f0))*8-14,oz:Math.sin(seed)*rad});
      siz.push(2+amp*16);const pc=((Math.round(12*Math.log2(pf/CREF))%12)+12)%12;tmp.setHSL(pc/12,.7,.6);col.push(tmp.r,tmp.g,tmp.b);}});});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(cloudLocal.length*3),3));
  g.setAttribute('vcolor',new THREE.Float32BufferAttribute(col,3));g.setAttribute('psize',new THREE.Float32BufferAttribute(siz,1));
  cloudPoints=new THREE.Points(g,cloudMat);cloudPoints.visible=false;scene.add(cloudPoints);}
function updateCloud(){if(!cloudPoints)return;const arr=cloudPoints.geometry.attributes.position.array;
  for(let p=0;p<cloudLocal.length;p++){const o=cloudLocal[p],P=pos[o.i];arr[p*3]=P.x+o.ox;arr[p*3+1]=P.y+o.oy;arr[p*3+2]=P.z+o.oz;}
  cloudPoints.geometry.attributes.position.needsUpdate=true;}
function setRender(m){renderMode=m;const cloud=(m==='clouds');
  for(let i=0;i<N.length;i++){const vis=diaVisible(i);dots[i].visible=!cloud&&vis;halos[i].visible=!cloud&&vis;picks[i].visible=vis;}
  if(cloudPoints){cloudPoints.visible=cloud;if(cloud)updateCloud();}
  if(edgeLines)edgeLines.visible=(!cloud&&keyRoot==null);setPill('renderPills',m);
  if(!cloud&&keyRoot==null)applyColors(colorMode);}
document.getElementById('renderPills').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setRender(b.dataset.k);});
buildCloud();
