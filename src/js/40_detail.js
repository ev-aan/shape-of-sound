// ---- inversions / detail panel ----
function inversions(n){const pcs=pcsOf(n),out=[];
  for(let k=0;k<pcs.length;k++){const rot=pcs.slice(k).concat(pcs.slice(0,k));let m=48+rot[0];const midis=[m];
    for(let i=1;i<rot.length;i++){let cand=midis[i-1]-(midis[i-1]%12)+rot[i];if(cand<=midis[i-1])cand+=12;midis.push(cand);}
    out.push({notes:rot.map(p=>NOTE[p]),freqs:midis.map(mm=>440*Math.pow(2,(mm-69)/12))});}
  return out;}
const detailEl=document.getElementById('detail');let detailIdx=-1;
function relatedRows(i){const row=W[i],order=row.map((w,j)=>[w,j]).filter(x=>x[1]!==i).sort((a,b)=>b[0]-a[0]).slice(0,6);
  const pi=new Set(pcsOf(N[i]));
  return order.map(([w,j])=>{const sh=pcsOf(N[j]).filter(p=>pi.has(p)).length;
    return '<div class="rel" data-act="rel" data-idx="'+j+'"><span class="play">▶</span>'+
      '<span class="nm">'+N[j].name+'</span><span class="r">shares '+sh+'</span><span class="pct">'+Math.round(w*100)+'%</span>'+
      '<span class="cmp" data-act="cmp" data-idx="'+j+'">🔬</span></div>';}).join('');}
function renderDetail(i){detailIdx=i;const n=N[i];const invs=inversions(n);
  let fnline=n.family;if(keyRoot!=null){const d=diatonic(n);fnline=d?(FNNAME[d.fn]+' · '+d.num+' of '+NOTE[keyRoot]):'not in '+NOTE[keyRoot]+' major';}
  const ratios=n.ivs.map(iv=>'<span>'+NOTE[(n.root+iv)%12]+' <span class="r">'+(RATIO[iv]||'')+'</span></span>').join(' · ');
  const invRows=invs.map((v,k)=>'<div class="inv" data-act="inv" data-inv="'+k+'"><span class="play">▶</span>'+
    '<span class="nm">'+v.notes.join(' – ')+'</span><span class="sub">'+['root pos','1st inv','2nd inv','3rd inv'][k]+'</span></div>').join('');
  detailEl.innerHTML='<div class="dhead"><span class="nm serif">'+n.name+'</span><span class="fn">'+fnline+'</span>'+
    '<span class="addseq" data-act="add">＋ seq</span><span class="addseq" data-act="wave">〜 wave</span><span class="addseq" data-act="cym">◉ cym</span><span class="x" data-act="close">✕</span></div>'+
    '<div class="dsec"><div class="lbl">notes &amp; ratios to root</div><div class="kv">'+ratios+'</div></div>'+
    '<div class="dsec"><div class="lbl">consonance</div><div class="kv">'+(n.cons*100).toFixed(0)+' / 100 &nbsp;<span class="r">(higher = smoother)</span></div></div>'+
    '<div class="dsec"><div class="lbl">inversions — tap to hear</div>'+invRows+'</div>'+
    '<div class="dsec"><div class="lbl">most harmonically related</div>'+relatedRows(i)+'</div>';
  detailEl.classList.add('show');}
detailEl.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(!t)return;const act=t.dataset.act;
  if(act==='close'){detailEl.classList.remove('show');return;}
  if(act==='inv'){playFreqs(inversions(N[detailIdx])[+t.dataset.inv].freqs);return;}
  if(act==='rel'){selectNode(+t.dataset.idx);}
  if(act==='cmp'){openScope(detailIdx,+t.dataset.idx);}
  if(act==='add'){addToSeq(detailIdx);}
  if(act==='wave'){openWave(pcsOf(N[detailIdx]).map(p=>((p%12)+12)%12));}
  if(act==='cym'){openCym(pcsOf(N[detailIdx]).map(p=>((p%12)+12)%12));}});
