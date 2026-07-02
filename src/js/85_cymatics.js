// ---- cymatics: a chord's standing-wave glyph (plate modes weighted by its overtones) ----
let cymNotes=new Set([0,4,7]),cymH=4,cymShape='square',cymAnim=true,cymT=0,cymTimer=null;
const cymBase=60;
function cymFreqs(){return [...cymNotes].sort((a,b)=>a-b).map(pc=>m2f(cymBase+pc));}
function drawCym(){const cv=document.getElementById('cymCanvas');const dim=140;cv.width=dim;cv.height=dim;
  const ctx=cv.getContext('2d'),img=ctx.createImageData(dim,dim),d=img.data;
  const fs=cymFreqs();if(!fs.length){ctx.clearRect(0,0,dim,dim);return;}
  const f0=Math.min.apply(null,fs),terms=[];
  fs.forEach((f,j)=>{for(let k=1;k<=cymH;k++){const ratio=k*f/f0,base=1+Math.round(3*Math.log2(ratio));
    terms.push({n:Math.max(1,Math.min(16,base)),m:Math.max(1,Math.min(16,base+j)),amp:1/k,w:ratio});}});
  const fld=new Float32Array(dim*dim);let amax=1e-6;
  for(let yy=0;yy<dim;yy++){const y=yy/(dim-1);for(let xx=0;xx<dim;xx++){const x=xx/(dim-1);let v=0;
    if(cymShape==='square'){for(const t of terms){const ph=cymAnim?Math.cos(t.w*cymT):1;
      v+=t.amp*ph*(Math.cos(t.n*Math.PI*x)*Math.cos(t.m*Math.PI*y)-Math.cos(t.m*Math.PI*x)*Math.cos(t.n*Math.PI*y));}}
    else{const dx=x-0.5,dy=y-0.5,r=Math.sqrt(dx*dx+dy*dy)*2,th=Math.atan2(dy,dx);
      if(r<=1)for(const t of terms){const ph=cymAnim?Math.cos(t.w*cymT):1;v+=t.amp*ph*Math.cos(t.n*Math.PI*r)*Math.cos(t.m*th);}}
    fld[yy*dim+xx]=v;const av=Math.abs(v);if(av>amax)amax=av;}}
  const pl=[11,16,38],sd=[255,228,170],thr=0.16*amax;let p4=0;
  for(let p=0;p<fld.length;p++){const node=Math.max(0,1-Math.abs(fld[p])/thr),b=Math.pow(node,1.4);
    d[p4++]=pl[0]+(sd[0]-pl[0])*b;d[p4++]=pl[1]+(sd[1]-pl[1])*b;d[p4++]=pl[2]+(sd[2]-pl[2])*b;d[p4++]=255;}
  ctx.putImageData(img,0,0);}
function renderCymNotes(){document.getElementById('cymNotes').innerHTML=NOTE.map((nm,pc)=>{const on=cymNotes.has(pc);const st='style="--pc:'+Palette.noteCss(pc,.72,.58)+'"';return '<button data-n="'+pc+'" '+st+' class="notebtn '+(on?'on':'')+'">'+nm+'</button>';}).join('');}
function cymStop(){if(cymTimer){clearInterval(cymTimer);cymTimer=null;}}
function cymStart(){cymStop();if(cymAnim)cymTimer=setInterval(()=>{cymT+=0.12;drawCym();},66);}
function openCym(seed){if(seed&&seed.length)cymNotes=new Set(seed);if(typeof wfMode!=='undefined'&&wfMode)closeWave();
  document.getElementById('cym').classList.add('show');renderCymNotes();drawCym();cymStart();}
function closeCym(){document.getElementById('cym').classList.remove('show');cymStop();}
document.getElementById('cymBtn').onclick=()=>{document.getElementById('cym').classList.contains('show')?closeCym():openCym();};
document.getElementById('cymClose').onclick=closeCym;
document.getElementById('cymNotes').addEventListener('click',e=>{const b=e.target.closest('[data-n]');if(!b)return;
  const pc=+b.dataset.n;cymNotes.has(pc)?cymNotes.delete(pc):cymNotes.add(pc);renderCymNotes();drawCym();});
document.getElementById('cym').addEventListener('click',e=>{const b=e.target.closest('[data-cs]');if(!b)return;
  cymShape=b.dataset.cs;document.getElementById('cymSquareBtn').classList.toggle('on',cymShape==='square');
  document.getElementById('cymCircleBtn').classList.toggle('on',cymShape==='circular');drawCym();});
document.getElementById('cymH').oninput=function(){cymH=+this.value;document.getElementById('cymHval').textContent=cymH;drawCym();};
document.getElementById('cymAnimBtn').onclick=function(){cymAnim=!cymAnim;this.classList.toggle('on',cymAnim);if(cymAnim)cymStart();else{cymStop();drawCym();}};
document.getElementById('cymPlay').onclick=()=>{unlockAudio();playFreqs(cymFreqs());};
