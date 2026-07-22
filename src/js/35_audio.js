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
// shared "a note just played" state — one place every caller (~20 across the app) gets for
// free, so anything (like the ripple panel, 32_ripple.js) can react without its own hook per call site
let lastPlayedAt=0,lastPlayedFreqs=null;
function playFreqs(freqs,dur){if(!soundOn)return;const a=audio(),t=a.currentTime;dur=dur||0.95;
  lastPlayedAt=performance.now();lastPlayedFreqs=freqs;
  freqs.forEach(f=>{const o=a.createOscillator(),g=a.createGain();o.type='triangle';o.frequency.value=f;
    o.detune.value=(Math.random()-0.5)*4;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.16,t+0.02);
    g.gain.exponentialRampToValueAtTime(0.06,t+dur*0.5);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+0.02);});}
// a short noise burst, not a pitch -- the app's first percussive sound, for the rhythm-blocks
// activity (91_curriculum.js) where a beat needs to read as a clap. strong=true for a full beat
// (ta), false/lighter for each half of a split beat (ti-ti)
function playClap(strong){if(!soundOn)return;const a=audio(),t=a.currentTime;
  const dur=strong?0.14:0.09,n=Math.round(a.sampleRate*dur),buf=a.createBuffer(1,n,a.sampleRate),data=buf.getChannelData(0);
  for(let i=0;i<n;i++)data[i]=(Math.random()*2-1)*(1-i/n); // white noise, faded to 0 so the tail doesn't click
  const src=a.createBufferSource();src.buffer=buf;
  const hp=a.createBiquadFilter();hp.type='highpass';hp.frequency.value=800; // crisp "clap", not a dull thump
  const g=a.createGain();g.gain.setValueAtTime(strong?0.5:0.32,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  src.connect(hp);hp.connect(g);g.connect(master);src.start(t);src.stop(t+dur+0.02);}
const soundPill=document.getElementById('sound');
soundPill.onclick=()=>{unlockAudio();soundOn=!soundOn;if(master)master.gain.value=soundOn?0.5:0;
  soundPill.textContent=soundOn?'🔊 sound on':'🔇 muted';};
