// key selector
const keySel=document.getElementById('keySel');
keySel.innerHTML='<option value="-1">— none —</option>'+NOTE.map((nm,i)=>'<option value="'+i+'">'+nm+' major</option>').join('');
keySel.addEventListener('change',()=>{const v=+keySel.value;applyKey(v<0?null:v);});

const slider=document.getElementById('wslider'),wval=document.getElementById('wval');
function curThr(){return wAt(+slider.value);}
function applyThr(){buildEdges(curThr());wval.textContent='≥'+curThr().toFixed(2);}
slider.addEventListener('input',applyThr);
