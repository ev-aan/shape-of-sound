// ---- overtone microscope ----
function partials(node,H){const out=[];node.freqs.forEach(f=>{for(let k=1;k<=H;k++)out.push({f:k*f,a:1/k});});return out;}
let scopeA=-1,scopeB=-1;
function openScope(i,j){scopeA=i;scopeB=j;document.getElementById('scope').classList.add('show');drawScope();}
document.getElementById('scopeClose').onclick=()=>document.getElementById('scope').classList.remove('show');
document.getElementById('scope').addEventListener('click',e=>{const b=e.target.closest('[data-s]');if(!b)return;
  const s=b.dataset.s;unlockAudio();
  if(s==='a')playFreqs(N[scopeA].freqs);else if(s==='b')playFreqs(N[scopeB].freqs);
  else playFreqs(N[scopeA].freqs.concat(N[scopeB].freqs));});
function drawScope(){if(scopeA<0)return;
  const cv=document.getElementById('scopeCanvas'),dpr=Math.min(devicePixelRatio,2);
  const Wc=cv.getBoundingClientRect().width||320,Hc=180;
  cv.width=Wc*dpr;cv.height=Hc*dpr;const x=cv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,Wc,Hc);
  const H=16,A=partials(N[scopeA],H),B=partials(N[scopeB],H);
  const logs=A.concat(B).map(p=>Math.log2(p.f)),lo=Math.min.apply(null,logs),hi=Math.max.apply(null,logs);
  const pad=14,plotW=Wc-pad*2,mid=Hc/2,barMax=mid-22,X=f=>pad+(Math.log2(f)-lo)/(hi-lo)*plotW;
  const colA=FAM[N[scopeA].family],colB=FAM[N[scopeB].family];
  x.strokeStyle='#ffffff10';x.lineWidth=1;
  for(let oc=Math.ceil(lo);oc<=hi;oc++){const xx=pad+(oc-lo)/(hi-lo)*plotW;x.beginPath();x.moveTo(xx,8);x.lineTo(xx,Hc-8);x.stroke();}
  x.strokeStyle='#ffffff22';x.beginPath();x.moveTo(pad,mid);x.lineTo(Wc-pad,mid);x.stroke();
  const coin=new Set();
  A.forEach((pa,ia)=>{for(const pb of B){if(Math.abs(1200*Math.log2(pa.f/pb.f))<20){coin.add(ia);break;}}});
  A.forEach((pa,ia)=>{if(coin.has(ia)){const xx=X(pa.f);x.strokeStyle='rgba(255,224,130,0.45)';x.lineWidth=2;
    x.beginPath();x.moveTo(xx,12);x.lineTo(xx,Hc-12);x.stroke();
    x.fillStyle='#ffe082';x.beginPath();x.arc(xx,mid,3,0,6.283);x.fill();}});
  x.lineWidth=1.6;x.strokeStyle=colA;A.forEach(pa=>{const xx=X(pa.f);x.beginPath();x.moveTo(xx,mid);x.lineTo(xx,mid-pa.a*barMax);x.stroke();});
  x.strokeStyle=colB;B.forEach(pb=>{const xx=X(pb.f);x.beginPath();x.moveTo(xx,mid);x.lineTo(xx,mid+pb.a*barMax);x.stroke();});
  document.getElementById('scopeTitle').innerHTML='<b style="color:'+colA+'">'+N[scopeA].name+'</b> (up) ∩ <b style="color:'+colB+
    '">'+N[scopeB].name+'</b> (down) &nbsp; '+Math.round(W[scopeA][scopeB]*100)+'% overlap · '+coin.size+' overtones align (gold)';}
