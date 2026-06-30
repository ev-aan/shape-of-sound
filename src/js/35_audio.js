// audio
let actx=null,master=null,unlocked=false,soundOn=true;
function audio(){if(!actx){const AC=window.AudioContext||window.webkitAudioContext;actx=new AC();
  master=actx.createGain();master.gain.value=soundOn?0.5:0;master.connect(actx.destination);}
  if(actx.state==='suspended')actx.resume();return actx;}
function unlockAudio(){if(unlocked)return;try{const a=audio();const b=a.createBuffer(1,1,22050),s=a.createBufferSource();
  s.buffer=b;s.connect(a.destination);s.start(0);const el=document.createElement('audio');el.src=SILENT;el.loop=true;
  const p=el.play();if(p&&p.catch)p.catch(()=>{});}catch(e){}unlocked=true;
  soundPill.textContent=soundOn?'🔊 sound on':'🔇 muted';}
document.addEventListener('pointerdown',unlockAudio);
function playFreqs(freqs,dur){if(!soundOn)return;const a=audio(),t=a.currentTime;dur=dur||0.95;
  freqs.forEach(f=>{const o=a.createOscillator(),g=a.createGain();o.type='triangle';o.frequency.value=f;
    o.detune.value=(Math.random()-0.5)*4;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.16,t+0.02);
    g.gain.exponentialRampToValueAtTime(0.06,t+dur*0.5);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+0.02);});}
const soundPill=document.getElementById('sound');
soundPill.onclick=()=>{unlockAudio();soundOn=!soundOn;if(master)master.gain.value=soundOn?0.5:0;
  soundPill.textContent=soundOn?'🔊 sound on':'🔇 muted';};
