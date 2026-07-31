class V3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}
 clone(){return new V3(this.x,this.y,this.z);}lerp(v,a){this.x+=(v.x-this.x)*a;this.y+=(v.y-this.y)*a;this.z+=(v.z-this.z)*a;return this;}
 sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}length(){return Math.hypot(this.x,this.y,this.z);}
 normalize(){const l=this.length()||1;this.x/=l;this.y/=l;this.z/=l;return this;}multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;}lookAt(){}}
class Col{constructor(){this.r=.5;this.g=.5;this.b=.5;}set(){return this;}setHSL(){return this;}}
class V4{constructor(x=0,y=0,z=0,w=0){this.x=x;this.y=y;this.z=z;this.w=w;}
 set(x,y,z,w){this.x=x;this.y=y;this.z=z;this.w=w;return this;}copy(v){this.x=v.x;this.y=v.y;this.z=v.z;this.w=v.w;return this;}}
const sc=()=>({set(){},setScalar(){}}),quat=()=>({setFromUnitVectors(){}});
class Geo{constructor(){this.attributes={};}setAttribute(n,a){this.attributes[n]=a;return this;}dispose(){}}
class Attr{constructor(arr){this.array=arr;this.needsUpdate=false;}}
const M=class{constructor(g,m){this.geometry=g||new Geo();this.material=m||{opacity:1,color:new Col(),dispose(){}};
 this.position=new V3();this.scale=sc();this.rotation={x:0,y:0,z:0};this.quaternion=quat();this.userData={};this.visible=true;}};
const THREE={AdditiveBlending:2,
 WebGLRenderer:class{setPixelRatio(){}setSize(){}setClearColor(){}render(){}},Scene:class{add(){}remove(){}},FogExp2:class{},
 PerspectiveCamera:class{constructor(){this.position=new V3();this.up=new V3();}lookAt(){}updateProjectionMatrix(){}},
 OrthographicCamera:class{constructor(){this.position=new V3();this.up=new V3();}lookAt(){}updateProjectionMatrix(){}},
 Vector3:V3,Vector4:V4,BufferGeometry:Geo,Float32BufferAttribute:Attr,
 Points:class{constructor(g,m){this.geometry=g||new Geo();this.material=m||{};this.visible=true;}},
 PointsMaterial:class{},CanvasTexture:class{},SphereGeometry:class{dispose(){}},ConeGeometry:class{dispose(){}},PlaneGeometry:class{dispose(){}},
 MeshBasicMaterial:class{constructor(o={}){this.color=o.color&&o.color.set?o.color:new Col();this.visible=o.visible;this.opacity=o.opacity??1;this.transparent=o.transparent;}dispose(){}},
 Mesh:M,Sprite:class{constructor(m){this.material=m||{opacity:1};this.position=new V3();this.scale=sc();this.userData={};this.visible=true;}},
 SpriteMaterial:class{constructor(o={}){this.color=o.color&&o.color.set?o.color:new Col();this.opacity=o.opacity;this.map=o.map;}},
 ShaderMaterial:class{constructor(o={}){Object.assign(this,o);}},
 LineSegments:M,LineBasicMaterial:class{constructor(o={}){this.opacity=o.opacity??1;this.color=o.color||new Col();}dispose(){}},
 Line:M,Color:Col,Raycaster:class{setFromCamera(){}intersectObjects(){return global.__hit?[{object:{userData:{index:5}}}]:[];}},
 Clock:class{getDelta(){return .12;}}};
global.THREE=THREE;
function el(){return{children:[],style:{},__h:{},dataset:{},_innerHTML:'',value:'-1',disabled:false,onclick:null,oninput:null,onchange:null,
 // a real innerHTML assignment discards existing children too -- matters for code that clears
 // a container via innerHTML='' and then repopulates it with appendChild (see 98_piano_tool.js)
 get innerHTML(){return this._innerHTML;}, set innerHTML(v){this._innerHTML=v;this.children.length=0;},
 classList:{_s:new Set(),add(c){this._s.add(c);},remove(c){this._s.delete(c);},toggle(c,f){f?this._s.add(c):this._s.delete(c);},contains(c){return this._s.has(c);}},
 addEventListener(t,f){(this.__h[t]=this.__h[t]||[]).push(f);},appendChild(c){this.children.push(c);},closest(){return this;},
 querySelector(){return el();},querySelectorAll(){return [el(),el()];},insertBefore(c){this.children.push(c);},
 // a real attribute store, not a no-op -- needed by anything built with real createElementNS +
 // setAttribute calls (updated every frame) rather than a re-stringified innerHTML (91b_story_intro.js's
 // SVG dot/trail/staff elements are the first thing in this app to need round-tripping this way).
 _attrs:{},setAttribute(n,v){this._attrs[n]=String(v);},getAttribute(n){return this._attrs[n]==null?null:this._attrs[n];},title:'',
 textContent:'',remove(){},getBoundingClientRect(){return{left:0,top:0,width:800,height:600};},
 getContext(){return{font:'',fillStyle:'',strokeStyle:'',lineWidth:1,globalAlpha:1,textAlign:'',textBaseline:'',
   fillText(){},fillRect(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},fill(){},save(){},restore(){},setTransform(){},scale(){},setLineDash(){},createRadialGradient(){return{addColorStop(){}};},createImageData(w,h){return{data:new Uint8ClampedArray(w*h*4)};},putImageData(){}};},
 width:64,height:64,play(){return{catch(){}};},src:'',loop:false};}
const cache={};
global.document={getElementById:id=>cache[id]||(cache[id]=el()),createElement:()=>el(),createElementNS:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),body:el(),__h:{},addEventListener(t,f){(this.__h[t]=this.__h[t]||[]).push(f);}};
global.window={};global.devicePixelRatio=2;global.innerWidth=800;global.innerHeight=600;global.addEventListener=()=>{};global.performance={now:()=>0};
let rafCb=null;global.requestAnimationFrame=cb=>{rafCb=cb;};let timerSeq=1;
// a FIFO queue, not a single slot -- the rhythm-blocks engine (91_curriculum.js) can have two
// timeouts pending at once (a ti-ti sub-clap plus the next step), which a single-slot capture
// can't represent. __fireTimeout() advances one at a time, in scheduling order; delay (ms) is
// ignored throughout this harness (same as the rAF stub), so ordering is purely FIFO.
let timeoutQueue=[];
global.setTimeout=(cb,ms)=>{const id=timerSeq++;timeoutQueue.push({id,cb});return id;};
global.clearTimeout=id=>{timeoutQueue=timeoutQueue.filter(t=>t.id!==id);};
global.setInterval=()=>0;global.clearInterval=()=>{};global.MutationObserver=class{constructor(cb){this.cb=cb;}observe(){}disconnect(){}};
global.location={hash:'',origin:'https://x',pathname:'/'};global.history={replaceState(){}};global.navigator={clipboard:{writeText(){}}};
const P={value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}};
global.window.AudioContext=class{constructor(){this.currentTime=0;this.state='running';this.destination={};this.sampleRate=44100;}
 createGain(){return{gain:{...P,value:0},connect(){}};}createOscillator(){return{type:'',frequency:{value:0},detune:{value:0},connect(){},start(){},stop(){}};}
 // getChannelData backs a plain writable array, not a real Float32Array -- fine, playClap()
 // only ever does numeric index reads/writes, same either way
 createBuffer(ch,length){return{getChannelData:()=>new Array(length||0).fill(0)};}
 createBufferSource(){return{buffer:null,connect(){},start(){},stop(){}};}
 createBiquadFilter(){return{type:'',frequency:{value:0},connect(){}};}
 resume(){}};
global.__cache=cache;global.__raf=()=>rafCb;global.__fireTimeout=()=>{const t=timeoutQueue.shift();if(t)t.cb();};global.__fire=(e,t,ev)=>{(e.__h[t]||[]).forEach(f=>f(ev||{}));};
