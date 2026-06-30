// ---- axis info card ----
(function(){const v=DATA.axisVar;
  document.getElementById('info').innerHTML='<h3>How a chord’s position is found</h3>'+
   '<p>Every pair of chords gets a <b>harmonic distance</b> — one minus how much their overtones overlap. '+
   'A method called classical MDS finds the three directions that spread the chords apart the most, and those become x, y, z. '+
   'They are statistical axes, not musical ones: no axis means “pitch” or “loudness.”</p>'+
   '<p>Each axis carries only part of the picture:</p>'+
   ['x','y','z'].map((ax,k)=>'<div class="axrow"><span>'+ax+'</span><span class="bg"><span class="fg" style="width:'+
     Math.min(100,v[k]*300).toFixed(0)+'%"></span></span><span>'+(v[k]*100).toFixed(0)+'%</span></div>').join('')+
   '<p class="r">Together they capture '+Math.round(DATA.var3*100)+'%; the rest lives in higher dimensions — which is why the cloud looks tangled and the circle of fifths curves across the axes instead of lining up with one. Switch to <b>Explained</b> layout for axes you can name.</p>'+
   '<div class="scopebtns"><span class="x" id="infoClose">close</span></div>';
  document.getElementById('infoBtn').onclick=()=>document.getElementById('info').classList.toggle('show');
  document.getElementById('info').addEventListener('click',e=>{if(e.target.id==='infoClose')document.getElementById('info').classList.remove('show');});})();
