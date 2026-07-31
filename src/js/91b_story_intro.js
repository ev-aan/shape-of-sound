// ---- STORY INTRO: "The Hidden Shape of Sound" ----
// The homepage's scrollytelling sequence, living inside #simpleFront between the static hero
// (.heroHero) and the 4-row mode picker (.heroRows) -- ported from a standalone prototype once it
// was iterated to completion there. Motion -> Time -> Amplitude -> Frequency -> Middle C, ending
// in two links into the Lessons/Science learning paths.
//
// Everything below is wrapped in its own local IIFE (unlike most files in this app) because it
// ports ~90 short, generic top-level names (CX, project, lerp, smoothstep, renderStory, ...) from
// the prototype verbatim -- wrapping keeps every one of them out of the shared build-wide scope
// that all these files are concatenated into, so nothing here can collide with another file's own
// identifiers. The single thing this file actually exports is `wireStoryIntro`, called once from
// 99_boot.js's boot chain (same "one file, one call" convention every other mode/section follows),
// plus `tickStoryIntro`, called every frame from 96_simple.js's heroFrameStep -- this app's rAF
// stub (tests/harness.js) only holds ONE callback slot, so a second independent
// requestAnimationFrame loop of this file's own would silently stop the hero's own ticking (or
// vice versa) in tests; hooking into the one already-shared per-frame call site avoids that.
var wireStoryIntro, tickStoryIntro;
(function(){
  "use strict";

  // colour: the moving point is always pitch class 0 (C), via the same Palette every other note
  // colour in the app comes from -- not a locally hand-rolled hue formula.
  var C_COLOR = Palette.noteCss(0, .72, .58);

  function smoothstep(x){ x = Math.max(0, Math.min(1, x)); return x*x*(3-2*x); }
  function easeOutCubic(x){ x = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1-x, 3); }
  function lerp(a, b, t){ return a + (b-a)*t; }

  // ---- the script, broken into short narrator beats, grouped into numbered concepts ----
  // Each scene gets an equal amount of scroll PER LINE (PX_PER_LINE below), not equal scroll per
  // scene -- so a long scene and a short one each feel like the same pace beat-to-beat, rather
  // than the short one flying by relative to the long one.
  //
  // Scene 3's lines carry extra keyframe fields (tilt/yaw/tail/grid/label) -- see renderScene3 --
  // each line is a keyframe for those parameters, smoothly interpolated by lineT rather than cut
  // between, so "the circle should adjust into 3D smoothly" is true at the render-math level, not
  // just true between scenes.
  var SCENES = [
    { n:1, concept:'The Point', lines:[
      'Everything begins here.',
      'Just a point.',
      'It has no sound.',
      'No direction.',
      'No motion.',
      'It’s simply a location.',
      'Everything changes when objects start to move.'
    ]},
    { n:2, concept:'Motion', pxPerLine:900, lines:[
      'The instant something moves…',
      'energy appears.',
      '**Motion** is the first ingredient of sound.'
    ]},
    { n:3, concept:'Motion in Time', lines:[
      // The steady "grid floor" camera is a single fixed relationship: looking from 33deg above
      // (tilt) while the plane itself is pivoted 33deg toward the camera (yaw) -- line 1 ("Time.")
      // eases into that pair, then it holds constant through the trace-forming lines. The final
      // pivot (the last 3 lines) is calculated backward from the one hard constraint: at the very
      // end the traced line must read as perfectly horizontal. That's only true at tilt=0 (so the
      // wave's own height stops leaking into the depth axis) combined with yaw=-90 (so the
      // circle's own x fully collapses and the depth/time axis alone becomes the screen's
      // horizontal) -- so tilt and yaw both animate together, down to exactly that pair, not
      // yaw alone.
      { text:'There is another dimension hiding once we have motion.', tilt:0,  yaw:0,   tail:0,    grid:0,   label:'Motion in Time' },
      { text:'Time.',                                        tilt:33, yaw:-33, tail:0,    grid:0.5, label:'Motion in Time' },
      { text:'Now we can see both Motion in Time as the point moves', tilt:33, yaw:-33, tail:0, grid:1, label:'Motion in Time' },
      { text:'from place to place.',                          tilt:33, yaw:-33, tail:0,    grid:1,   label:'Motion in Time' },
      { text:'But watch what happens when it leaves a trace.', tilt:33, yaw:-33, tail:0.15, grid:1, label:'Motion in Time' },
      { text:'Every position it’s ever been…',                tilt:33, yaw:-33, tail:0.6,  grid:1,   label:'Motion in Time' },
      { text:'…traces a shape through time.',                 tilt:33, yaw:-33, tail:1,    grid:1,   label:'Motion in Time' },
      { text:'Now, let’s shift our perspective.',             tilt:22, yaw:-52, tail:1,    grid:1,   label:'Motion in Time' },
      { text:'From the side we can start to see cycles and repeating patterns.', tilt:11, yaw:-71, tail:1, grid:1, label:'Motion in Time' },
      { text:'Only the up‑and‑down motion remains.',          tilt:0,  yaw:-90, tail:1,    grid:0.6, label:'Motion in Time' },
      { text:'This is the sine wave.',                        tilt:0,  yaw:-90, tail:1,    grid:0.15, label:'The Sine Wave' }
    ]},
    { n:4, concept:'Amplitude', lines:[
      { text:'This wave can tell us a lot.',                  radius:70 },
      { text:'When the waves are small, the sound is quiet.', radius:70 },
      { text:'As waves grow taller',                          radius:190 },
      { text:'There is more movement and more energy.',       radius:190 },
      { text:'This makes louder sound.',                      radius:190 },
      { text:'We call this **Amplitude**.',                   radius:190 }
    ]},
    { n:5, concept:'Frequency', pxPerLine:700, lines:[
      // hz is the only new keyframe field here -- interpolated line to line exactly like
      // tilt/yaw/radius elsewhere, and it's the single value that drives the wave's own speed,
      // the Hz counter text, and the oscillator's real pitch all at once (see renderFreqScene).
      { text:'This wave is repeating.', hz:1 },
      { text:'Every complete rise and fall is called one cycle.', hz:1 },
      { text:'When one cycle happens every second…', hz:1 },
      { text:'we call it one Hertz.', hz:1 },
      { text:'Or simply…', hz:1 },
      { text:'1 Hz.', hz:1 },
      { text:'The wave slowly repeats once each second.', hz:1 },
      { text:'Hertz is simply a way of measuring repetition.', hz:1 },
      { text:'It tells us how many times a motion repeats every second.', hz:1 },
      { text:'2 Hz…', hz:2 },
      { text:'5 Hz…', hz:5 },
      { text:'10 Hz…', hz:10 },
      { text:'20 Hz… still silent.', hz:20 }
    ]},
    { n:6, concept:'When Motion Becomes Sound', pxPerLine:700, lines:[
      { text:'30 Hz…', hz:30 },
      { text:'40 Hz…', hz:40 },
      { text:'60 Hz…', hz:60 },
      { text:'80 Hz…', hz:80 },
      { text:'120 Hz…', hz:120 },
      { text:'As the frequency increases…', hz:120 },
      { text:'the wave completes more and more cycles every second.', hz:120 },
      { text:'The motion hasn’t changed. Only its speed.', hz:120 },
      { text:'150 Hz…', hz:150 },
      { text:'180 Hz…', hz:180 },
      { text:'220 Hz…', hz:220 },
      { text:'At first, the repetitions are so slow that we don’t hear a musical note.', hz:220 },
      { text:'We only sense a vibration.', hz:220 },
      { text:'But as the cycles become faster… something remarkable happens.', hz:220 },
      { text:'The vibration becomes pitch.', hz:220 },
      // ramps to exactly 261.63 across this final line rather than holding at 220 -- otherwise
      // the counter would jump discontinuously the instant Scene 7 begins, contradicting its own
      // opening line ("the counter settles"), which implies arriving there, not snapping to it.
      { text:'The sound rises continuously with the scroll.', hz:261.63 }
    ]},
    { n:7, concept:'Middle C', pxPerLine:850, lines:[
      { text:'The waveform now repeats 261.63 times every second.', hz:261.63 },
      { text:'This wave is now repeating…', hz:261.63 },
      { text:'261.63 times every second.', hz:261.63 },
      { text:'That frequency has a name.', hz:261.63 },
      { text:'**Middle C.**', hz:261.63 }
    ]},
    { n:8, concept:'Every Note', pxPerLine:700, lines:[
      { text:'Motion creates change.', words:['motion'] },
      { text:'Time allows that change to repeat.', words:['motion','time'] },
      { text:'Amplitude determines the strength of each movement.', words:['motion','time','amplitude'] },
      { text:'Frequency determines how many times that movement repeats every second.', words:['motion','time','amplitude','frequency'] },
      { text:'When those four things come together…', words:['motion','time','amplitude','frequency'] },
      { text:'a vibration becomes a musical note.', words:['motion','time','amplitude','frequency'] },
      { text:'This… is **Middle C**.', words:['motion','time','amplitude','frequency','middlec'] },
      { text:'Every note you’ll ever hear is created the same way.', words:['motion','time','amplitude','frequency','middlec'] },
      { text:'Change the amplitude, and you change the loudness.', words:['motion','time','amplitude','frequency','middlec'] },
      { text:'Change the frequency, and you change the note.', words:['motion','time','amplitude','frequency','middlec'] },
      { text:'From these four simple ideas… all of music is born.', words:['motion','time','amplitude','frequency','middlec'] }
    ]}
  ];

  // each scene may override how much scroll its own lines get (scene.pxPerLine)
  var PX_PER_LINE = 420;
  var scenePx = SCENES.map(function(s){ return (s.pxPerLine || PX_PER_LINE) * s.lines.length; });
  var cumPx = [0];
  scenePx.forEach(function(px, i){ cumPx.push(cumPx[i] + px); });
  var totalRangePx = cumPx[cumPx.length - 1];

  // fade envelope for a single line: eases in over its first quarter, holds, eases out over its
  // last quarter -- a pure function of local line progress, so it's exactly scroll-scrubbable.
  function fadeEnvelope(lineT){
    if(lineT < 0.25) return smoothstep(lineT/0.25);
    if(lineT > 0.75) return 1 - smoothstep((lineT-0.75)/0.25);
    return 1;
  }
  // the very first line is the landing state -- already fully visible before any scroll, so it
  // only ever fades OUT (same tail as every other line, just no fade-in half).
  function fadeEnvelopeFirst(lineT){
    if(lineT > 0.75) return 1 - smoothstep((lineT-0.75)/0.25);
    return 1;
  }

  var CX = 400, CY = 250, DOT_R = 12;
  // DOM refs -- assigned once, lazily, inside wireStoryIntro() (called from 99_boot.js), not at
  // file-eval time, matching this app's convention (wireSimpleFront/wireSciScrollStage etc. all
  // look up their own elements at wiring time, not file-load time).
  var home, wrap, pointDot, labelEl, lineEl, hzEl, endLinksEl;

  // resolves a scroll position to everything the renderer needs -- shared by renderStory and the
  // one-time entrance animation.
  function resolveProgress(scrollTop){
    var st = Math.max(0, Math.min(totalRangePx - 0.01, scrollTop));
    var sceneIdx = 0;
    for(var i=0;i<SCENES.length;i++){ if(st >= cumPx[i]) sceneIdx = i; }
    var scene = SCENES[sceneIdx];
    var perLine = scene.pxPerLine || PX_PER_LINE;
    var withinScenePx = st - cumPx[sceneIdx];
    var withinScene = withinScenePx / perLine;
    var lineIdx = Math.min(scene.lines.length - 1, Math.floor(withinScene));
    var lineT = withinScene - lineIdx;
    return { sceneIdx:sceneIdx, scene:scene, lineIdx:lineIdx, lineT:lineT };
  }
  // the story's own scroll position: #simpleFront is the real scrollable container (see
  // wireHeroParallax in 96_simple.js) -- wrap.offsetTop is #storyStage's own zero point within it.
  function storyScrollTop(){
    if(!home || !wrap) return 0;
    return Math.max(0, (home.scrollTop||0) - (wrap.offsetTop||0));
  }

  // ---- Scene 1 -- The Point: the dot appears and grows on its own, once, on load -- the one
  // deliberate exception to "everything is a pure function of scroll" in this file. If the visitor
  // scrolls past Scene 1 before the 1.3s grow-in finishes, this bows out immediately and hands the
  // dot back to renderStory.
  var introDone = false, introT0 = null;
  var INTRO_DUR = 1300;
  function renderScene1(){
    if(!introDone) return; // the intro tick (below) owns the dot until it finishes
    pointDot.setAttribute('r', DOT_R);
    pointDot.setAttribute('cx', CX); pointDot.setAttribute('cy', CY);
  }

  // ---- Scene 2 -- Motion: "up, down, all over" -- a deterministic Lissajous-style wander (two
  // out-of-step sine pairs per axis) rather than true randomness. Unlike every other scene, this
  // one runs on its own persistent real-time clock rather than scroll position: once the story
  // reaches Motion, the dot keeps wandering on its own, scrolling or not -- only the caption text
  // (handled by the normal scroll-driven renderStory below) advances/fades with scroll. It always
  // starts eased in from dead centre (CX,CY) -- exactly where Scene 1 leaves the dot at rest.
  var MOTION_AMP_X = 260, MOTION_AMP_Y = 150, MOTION_EASE_MS = 900;
  var motionEnterTime = null;
  function motionPos(elapsedMs){
    var ease = easeOutCubic(elapsedMs/MOTION_EASE_MS);
    var t = elapsedMs/1000;
    var x = CX + ease*MOTION_AMP_X*(0.6*Math.sin(t*0.9) + 0.4*Math.sin(t*1.6 + 1.3));
    var y = CY + ease*MOTION_AMP_Y*(0.5*Math.sin(t*1.3 + 0.7) + 0.5*Math.sin(t*0.7 + 2.1));
    return { x:x, y:y };
  }
  var MOTION_TAIL_N = 28, MOTION_TAIL_DT_MS = 46;
  var motionTailEls = [];
  function buildMotionTail(){
    var trail = document.getElementById('storyTrail3d');
    for(var i=0;i<MOTION_TAIL_N;i++){
      var seg = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      // the "energy" tail as a spectrum: each segment's hue steps evenly around the same
      // circle-of-fifths wheel every note colour in the app comes from, via Palette.noteHue
      // walked in FIFTHS_ORDER -- consecutive steps land 1/12 apart in hue by construction.
      var pc = FIFTHS_ORDER[i % 12];
      seg.setAttribute('stroke', Palette.noteCss(pc, .75, .58));
      seg.setAttribute('stroke-width', 3); seg.setAttribute('opacity', 0);
      trail.appendChild(seg);
      motionTailEls.push(seg);
    }
  }
  function clearMotionTail(){ motionTailEls.forEach(function(s){ s.setAttribute('opacity', 0); }); }
  function tickMotion(r){
    if(motionEnterTime === null) motionEnterTime = performance.now();
    var elapsed = performance.now() - motionEnterTime;
    var here = motionPos(elapsed);
    pointDot.setAttribute('r', DOT_R);
    pointDot.setAttribute('cx', here.x.toFixed(1)); pointDot.setAttribute('cy', here.y.toFixed(1));
    var tailOn = r.lineIdx < 1 ? 0 : 1;
    for(var i=0;i<MOTION_TAIL_N;i++){
      var pt = motionPos(Math.max(0, elapsed - (i+1)*MOTION_TAIL_DT_MS));
      var next = i===0 ? here : motionPos(Math.max(0, elapsed - i*MOTION_TAIL_DT_MS));
      motionTailEls[i].setAttribute('x1', next.x.toFixed(1)); motionTailEls[i].setAttribute('y1', next.y.toFixed(1));
      motionTailEls[i].setAttribute('x2', pt.x.toFixed(1)); motionTailEls[i].setAttribute('y2', pt.y.toFixed(1));
      motionTailEls[i].setAttribute('opacity', (tailOn * Math.max(0, 1 - i/MOTION_TAIL_N) * 0.5).toFixed(3));
    }
  }

  // ---- Scene 3 -- Circular Motion -> Motion in Time -> The Sine Wave: a hand-rolled 3D pipeline
  // (world coords -> tilt (rotate around the horizontal/X axis) -> yaw (rotate around the
  // now-vertical Y axis) -> perspective divide). Nothing like this exists elsewhere in the app
  // (its only other 3D visual is the THREE.js chord map) -- this is genuinely new math, not a
  // duplicate of a shared helper. tilt swings the circle's own plane from facing the viewer flat
  // (tilt 0) down into a floor viewed at an angle; yaw then orbits the camera around that floor's
  // vertical axis until it's a pure side view, at which point World-Z (the trail's own "how far
  // back in time" axis) becomes the new horizontal screen axis.
  // ANGULAR_SPEED is a real rate (radians per SECOND), not tied to scroll at all -- that's what
  // makes "the wave is always moving regardless of scroll position" literally true: orbitWorld
  // takes a wall-clock time, so the dot/trail/grid keep animating every frame even while scroll
  // sits still, driven by tickStoryIntro (see bottom). Scroll only ever drives the *camera*
  // (tilt/yaw/grid-opacity/tail-amount/radius), never the oscillation itself.
  var ORBIT_R = 110, ANGULAR_SPEED = Math.PI*2/1.6; // one revolution every 1.6s
  var CAMERA_DIST = 480, FOCAL = 620, PROJ_SCALE = 1 + CAMERA_DIST/FOCAL;
  function rotateTilt(y, z, tiltDeg){
    var a = tiltDeg*Math.PI/180;
    return { y: y*Math.cos(a) - z*Math.sin(a), z: y*Math.sin(a) + z*Math.cos(a) };
  }
  function rotateYaw(x, z, yawDeg){
    var a = yawDeg*Math.PI/180;
    return { x: x*Math.cos(a) + z*Math.sin(a), z: -x*Math.sin(a) + z*Math.cos(a) };
  }
  function project(x, y, z, tiltDeg, yawDeg){
    var t = rotateTilt(y, z, tiltDeg);
    var yw = rotateYaw(x, t.z, yawDeg);
    var divisor = 1 + (yw.z + CAMERA_DIST) / FOCAL;
    var k = PROJ_SCALE / divisor;
    return { x: CX + yw.x*k, y: CY - t.y*k };
  }
  function orbitWorld(timeSec, radius){
    if(radius === undefined) radius = ORBIT_R;
    var angle = timeSec * ANGULAR_SPEED;
    return { x: radius*Math.cos(angle), y: radius*Math.sin(angle) };
  }

  var GRID_SPACING = 90, GRID_DEPTH_LINES = 12, GRID_SIDE_LINES = 9;
  var GRID_X_SPAN = 380, GRID_Z_NEAR = -90, GRID_Z_FAR = GRID_Z_NEAR + GRID_DEPTH_LINES*GRID_SPACING;
  var GRID_FLOW_SPEED = 60;
  var gridDepthEls = [], gridSideEls = [];
  function buildGrid(){
    var grid = document.getElementById('storyGrid3d');
    var i, el;
    for(i=0;i<GRID_DEPTH_LINES;i++){
      el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      el.setAttribute('stroke', '#5c6480'); el.setAttribute('stroke-width', 1); el.setAttribute('opacity', 0);
      grid.appendChild(el); gridDepthEls.push(el);
    }
    for(i=0;i<GRID_SIDE_LINES;i++){
      el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      el.setAttribute('stroke', '#5c6480'); el.setAttribute('stroke-width', 1); el.setAttribute('opacity', 0);
      grid.appendChild(el); gridSideEls.push(el);
    }
  }
  function renderGrid(tiltDeg, yawDeg, gridOn, timeSec){
    if(gridOn <= 0.001){
      gridDepthEls.forEach(function(e){ e.setAttribute('opacity', 0); });
      gridSideEls.forEach(function(e){ e.setAttribute('opacity', 0); });
      return;
    }
    var zOffset = ((timeSec*GRID_FLOW_SPEED) % GRID_SPACING + GRID_SPACING) % GRID_SPACING;
    var i, z, a, b, fade;
    for(i=0;i<GRID_DEPTH_LINES;i++){
      z = GRID_Z_NEAR + i*GRID_SPACING - zOffset;
      a = project(-GRID_X_SPAN, 0, z, tiltDeg, yawDeg);
      b = project(GRID_X_SPAN, 0, z, tiltDeg, yawDeg);
      fade = 1 - Math.max(0, Math.min(1, (z-GRID_Z_NEAR)/(GRID_Z_FAR-GRID_Z_NEAR)));
      gridDepthEls[i].setAttribute('x1', a.x.toFixed(1)); gridDepthEls[i].setAttribute('y1', a.y.toFixed(1));
      gridDepthEls[i].setAttribute('x2', b.x.toFixed(1)); gridDepthEls[i].setAttribute('y2', b.y.toFixed(1));
      gridDepthEls[i].setAttribute('opacity', (gridOn*fade*0.5).toFixed(3));
    }
    for(i=0;i<GRID_SIDE_LINES;i++){
      var x = -GRID_X_SPAN + i*(2*GRID_X_SPAN/(GRID_SIDE_LINES-1));
      a = project(x, 0, GRID_Z_NEAR - zOffset, tiltDeg, yawDeg);
      b = project(x, 0, GRID_Z_FAR - zOffset, tiltDeg, yawDeg);
      gridSideEls[i].setAttribute('x1', a.x.toFixed(1)); gridSideEls[i].setAttribute('y1', a.y.toFixed(1));
      gridSideEls[i].setAttribute('x2', b.x.toFixed(1)); gridSideEls[i].setAttribute('y2', b.y.toFixed(1));
      gridSideEls[i].setAttribute('opacity', (gridOn*0.35).toFixed(3));
    }
  }
  function clearGrid(){
    gridDepthEls.forEach(function(e){ e.setAttribute('opacity', 0); });
    gridSideEls.forEach(function(e){ e.setAttribute('opacity', 0); });
  }

  var TAIL_N = 64, TAIL_MAX_REACH_SEC = ANGULAR_SPEED > 0 ? (2*Math.PI/ANGULAR_SPEED)*3 : 4.8;
  var TAIL_DEPTH_PER_SEC = 130;
  var tailEls = [];
  function buildTail(){
    var trail = document.getElementById('storyTrail3d');
    for(var i=0;i<TAIL_N;i++){
      var seg = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      seg.setAttribute('stroke', C_COLOR); seg.setAttribute('stroke-width', 2); seg.setAttribute('opacity', 0);
      trail.appendChild(seg); tailEls.push(seg);
    }
  }
  function renderTail(nowSec, tailAmt, tiltDeg, yawDeg, radius){
    if(tailAmt <= 0.001){ tailEls.forEach(function(s){ s.setAttribute('opacity', 0); }); return; }
    var reach = tailAmt*TAIL_MAX_REACH_SEC;
    var prevScreen = null;
    for(var i=0;i<TAIL_N;i++){
      var back = (i/(TAIL_N-1))*reach;
      var t = nowSec - back;
      var w = orbitWorld(t, radius);
      var z = back*TAIL_DEPTH_PER_SEC;
      var s = project(w.x, w.y, z, tiltDeg, yawDeg);
      if(prevScreen){
        tailEls[i-1].setAttribute('x1', prevScreen.x.toFixed(1)); tailEls[i-1].setAttribute('y1', prevScreen.y.toFixed(1));
        tailEls[i-1].setAttribute('x2', s.x.toFixed(1)); tailEls[i-1].setAttribute('y2', s.y.toFixed(1));
        tailEls[i-1].setAttribute('opacity', (tailAmt * Math.max(0.12, 1-i/TAIL_N) * 0.85).toFixed(3));
      }
      prevScreen = s;
    }
    tailEls[TAIL_N-1].setAttribute('opacity', 0);
  }
  function clearTail(){ tailEls.forEach(function(s){ s.setAttribute('opacity', 0); }); }

  function renderScene3(scene, lineIdx, lineT){
    var kf0 = scene.lines[lineIdx];
    var kf1 = scene.lines[Math.min(scene.lines.length-1, lineIdx+1)];
    var m = smoothstep(lineT);
    var tilt = lerp(kf0.tilt, kf1.tilt, m);
    var yaw = lerp(kf0.yaw, kf1.yaw, m);
    var tail = lerp(kf0.tail, kf1.tail, m);
    var gridOn = lerp(kf0.grid, kf1.grid, m);
    var nowSec = performance.now()/1000;

    var w = orbitWorld(nowSec);
    var s = project(w.x, w.y, 0, tilt, yaw);
    pointDot.setAttribute('r', DOT_R);
    pointDot.setAttribute('cx', s.x.toFixed(1)); pointDot.setAttribute('cy', s.y.toFixed(1));

    renderGrid(tilt, yaw, gridOn, nowSec);
    renderTail(nowSec, tail, tilt, yaw);
    clearAmpLines();

    return kf0.label;
  }

  // ---- Scene 4 -- Amplitude: continues straight on from Scene 3's final camera (tilt 0, yaw -90
  // -- already a pure side view of the wave). The only thing that changes is the orbit's own
  // radius -- a bigger wave means a taller one.
  var AMPLITUDE_TILT = 0, AMPLITUDE_YAW = -90;
  var AMP_QUIET_R = 70, AMP_LOUD_R = 190;
  var ampLineEls = [];
  function buildAmpLines(){
    var g = document.getElementById('storyAmpLines');
    ['quietTop','quietBottom','loudTop','loudBottom'].forEach(function(){
      var el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      el.setAttribute('x1', CX-360); el.setAttribute('x2', CX+360);
      el.setAttribute('stroke', '#5c6480'); el.setAttribute('stroke-width', 1);
      el.setAttribute('stroke-dasharray', '5 5'); el.setAttribute('opacity', 0);
      g.appendChild(el); ampLineEls.push(el);
    });
  }
  function clearAmpLines(){ ampLineEls.forEach(function(e){ e.setAttribute('opacity', 0); }); }
  function renderAmpLines(radius){
    var quietFrac = 1 - smoothstep((radius-AMP_QUIET_R)/(AMP_LOUD_R-AMP_QUIET_R));
    var loudFrac = 1 - quietFrac;
    ampLineEls[0].setAttribute('y1', CY-AMP_QUIET_R); ampLineEls[0].setAttribute('y2', CY-AMP_QUIET_R);
    ampLineEls[1].setAttribute('y1', CY+AMP_QUIET_R); ampLineEls[1].setAttribute('y2', CY+AMP_QUIET_R);
    ampLineEls[2].setAttribute('y1', CY-AMP_LOUD_R); ampLineEls[2].setAttribute('y2', CY-AMP_LOUD_R);
    ampLineEls[3].setAttribute('y1', CY+AMP_LOUD_R); ampLineEls[3].setAttribute('y2', CY+AMP_LOUD_R);
    ampLineEls[0].setAttribute('opacity', (quietFrac*0.45).toFixed(3));
    ampLineEls[1].setAttribute('opacity', (quietFrac*0.45).toFixed(3));
    ampLineEls[2].setAttribute('opacity', (loudFrac*0.45).toFixed(3));
    ampLineEls[3].setAttribute('opacity', (loudFrac*0.45).toFixed(3));
  }
  function renderScene4(scene, lineIdx, lineT){
    var kf0 = scene.lines[lineIdx];
    var kf1 = scene.lines[Math.min(scene.lines.length-1, lineIdx+1)];
    var radius = lerp(kf0.radius, kf1.radius, smoothstep(lineT));
    var nowSec = performance.now()/1000;

    var w = orbitWorld(nowSec, radius);
    var s = project(w.x, w.y, 0, AMPLITUDE_TILT, AMPLITUDE_YAW);
    pointDot.setAttribute('r', DOT_R);
    pointDot.setAttribute('cx', s.x.toFixed(1)); pointDot.setAttribute('cy', s.y.toFixed(1));

    clearGrid();
    renderTail(nowSec, 1, AMPLITUDE_TILT, AMPLITUDE_YAW, radius);
    renderAmpLines(radius);
  }

  // ---- Scenes 5-8 -- Frequency -> When Motion Becomes Sound -> Middle C -> Every Note: one
  // continuous wave whose only changing property is now its own SPEED (hz). hz comes from scroll
  // (interpolated line to line, same pattern as tilt/yaw/radius), but the wave's own PHASE is an
  // accumulator driven by real elapsed time at that hz rather than phase = time*hz -- accumulating
  // is what lets hz change continuously without the wave ever jumping when it does. The real
  // oscillator (35_audio.js's ensureToneOsc/setTone) is tied to the same hz, so what you see
  // roughly matches what you hear (the VISUAL bob speed is deliberately compressed -- see
  // visualHzFor -- so it stays legible even once the real pitch is well above what the eye could
  // track).
  var FREQ_TILT = 0, FREQ_YAW = -90, FREQ_RADIUS = AMP_LOUD_R;
  var freqPhase = 0, freqLastT = null;
  function tickFreqPhase(hz){
    var now = performance.now()/1000;
    if(freqLastT === null) freqLastT = now;
    var dt = Math.max(0, Math.min(0.1, now - freqLastT));
    freqLastT = now;
    freqPhase += hz * Math.PI*2 * dt;
    return freqPhase;
  }
  function visualHzFor(hz){ return 0.6 * Math.pow(hz, 0.35); }
  var freqHistory = [];
  var FREQ_HISTORY_MAX_AGE = 2.2;
  function renderFreqTrail(nowSec, tiltDeg, yawDeg, fade){
    if(fade === undefined) fade = 1;
    var hist = freqHistory;
    if(fade <= 0.001 || hist.length < 2){ tailEls.forEach(function(s){ s.setAttribute('opacity', 0); }); return; }
    var n = Math.min(TAIL_N, hist.length);
    var prevScreen = null;
    for(var i=0;i<n;i++){
      var idx = hist.length - 1 - Math.round(i*(hist.length-1)/(n-1));
      var pt = hist[idx];
      var age = nowSec - pt.t;
      var z = age*TAIL_DEPTH_PER_SEC;
      var s = project(0, pt.y, z, tiltDeg, yawDeg);
      if(prevScreen){
        tailEls[i-1].setAttribute('x1', prevScreen.x.toFixed(1)); tailEls[i-1].setAttribute('y1', prevScreen.y.toFixed(1));
        tailEls[i-1].setAttribute('x2', s.x.toFixed(1)); tailEls[i-1].setAttribute('y2', s.y.toFixed(1));
        tailEls[i-1].setAttribute('opacity', (Math.max(0.12, 1-i/n) * 0.85 * fade).toFixed(3));
      }
      prevScreen = s;
    }
    for(var k=n-1;k<TAIL_N;k++) tailEls[k].setAttribute('opacity', 0);
  }

  // ---- the "Hz" concept pause -- Scene 5's first 9 lines freeze the wave into ONE isolated,
  // labelled cycle instead of the normal live bob, so the viewer can read what a cycle/peak/
  // trough/"1 Hz" mean before the motion resumes and starts compressing.
  var HZ_X0 = CX-210, HZ_X1 = CX+210, HZ_AMP = 70;
  function buildOneCyclePath(x0, x1, amp, cy){
    var d = '';
    for(var i=0;i<=60;i++){
      var t = i/60, x = x0 + (x1-x0)*t, y = cy - amp*Math.sin(t*Math.PI*2);
      d += (i===0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
    }
    return d;
  }
  var hzConceptEls = {};
  function buildHzConcept(){
    var g = document.getElementById('storyHzConcept');
    function svgEl(tag, attrs){
      var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for(var k in attrs) el.setAttribute(k, attrs[k]);
      el.style.transition = 'opacity .6s ease';
      el.style.opacity = 0;
      g.appendChild(el);
      return el;
    }
    hzConceptEls.curve = svgEl('path', { d: buildOneCyclePath(HZ_X0,HZ_X1,HZ_AMP,CY), fill:'none', stroke:C_COLOR, 'stroke-width':2 });
    hzConceptEls.baseline = svgEl('line', { x1:HZ_X0, y1:CY, x2:HZ_X1, y2:CY, stroke:'#5c6480', 'stroke-width':1, 'stroke-dasharray':'4 4' });
    hzConceptEls.bracket = svgEl('line', { x1:HZ_X0, y1:CY+110, x2:HZ_X1, y2:CY+110, stroke:'#5c6480', 'stroke-width':1 });
    hzConceptEls.bracketL1 = svgEl('line', { x1:HZ_X0, y1:CY+104, x2:HZ_X0, y2:CY+116, stroke:'#5c6480', 'stroke-width':1 });
    hzConceptEls.bracketL2 = svgEl('line', { x1:HZ_X1, y1:CY+104, x2:HZ_X1, y2:CY+116, stroke:'#5c6480', 'stroke-width':1 });
    hzConceptEls.bracketLabel = svgEl('text', { x:(HZ_X0+HZ_X1)/2, y:CY+138, 'text-anchor':'middle', fill:'#8892ac', 'font-size':13, 'letter-spacing':'1px' });
    hzConceptEls.bracketLabel.textContent = 'ONE CYCLE';
    hzConceptEls.peakLabel = svgEl('text', { x:HZ_X0+(HZ_X1-HZ_X0)*0.25, y:CY-HZ_AMP-16, 'text-anchor':'middle', fill:'#8892ac', 'font-size':12, 'letter-spacing':'1px' });
    hzConceptEls.peakLabel.textContent = 'PEAK';
    hzConceptEls.troughLabel = svgEl('text', { x:HZ_X0+(HZ_X1-HZ_X0)*0.75, y:CY+HZ_AMP+22, 'text-anchor':'middle', fill:'#8892ac', 'font-size':12, 'letter-spacing':'1px' });
    hzConceptEls.troughLabel.textContent = 'TROUGH';
    hzConceptEls.hzTag = svgEl('text', { x:(HZ_X0+HZ_X1)/2, y:CY-HZ_AMP-40, 'text-anchor':'middle', fill:C_COLOR, 'font-size':15, 'font-weight':'700' });
    hzConceptEls.hzTag.textContent = '1 Hz = 1 cycle per second';
  }
  function renderHzConceptDiagram(lineIdx){
    var peakX = HZ_X0 + (HZ_X1-HZ_X0)*0.25, peakY = CY - HZ_AMP;
    pointDot.setAttribute('r', DOT_R);
    pointDot.setAttribute('fill-opacity', 1);
    pointDot.setAttribute('cx', peakX.toFixed(1)); pointDot.setAttribute('cy', peakY.toFixed(1));
    hzConceptEls.curve.style.opacity = 1;
    hzConceptEls.baseline.style.opacity = 1;
    var cycleOn = lineIdx >= 1 ? 1 : 0;
    hzConceptEls.bracket.style.opacity = cycleOn;
    hzConceptEls.bracketL1.style.opacity = cycleOn;
    hzConceptEls.bracketL2.style.opacity = cycleOn;
    hzConceptEls.bracketLabel.style.opacity = cycleOn;
    var partsOn = lineIdx >= 3 ? 1 : 0;
    hzConceptEls.peakLabel.style.opacity = partsOn;
    hzConceptEls.troughLabel.style.opacity = partsOn;
    hzConceptEls.hzTag.style.opacity = lineIdx >= 5 ? 1 : 0;
  }
  function clearHzConcept(){
    for(var k in hzConceptEls) hzConceptEls[k].style.opacity = 0;
  }

  // ---- Middle C resolution -- Scene 7: the wave eases to a stop and the dot grows, hollows out,
  // and morphs into a whole note resting on a ledger line one line-space below a 5-line staff --
  // real treble-clef placement for Middle C -- while a "C" label fades in above it. `resolve`
  // (0..1, computed in renderFreqScene) drives the whole crossfade; Scene 8 (the finale) holds it
  // at 1 throughout so the resolved note stays on screen while the closing narration plays.
  var STAFF_X0 = CX-180, STAFF_X1 = CX+180, STAFF_TOP = CY-100, STAFF_GAP = 20;
  var wholeNoteEl, cLabelEl;
  var staffLineEls = [], ledgerLineEl = null;
  function buildStaff(){
    var g = document.getElementById('storyStaffGroup');
    for(var i=0;i<5;i++){
      var el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      el.setAttribute('x1', STAFF_X0); el.setAttribute('x2', STAFF_X1);
      el.setAttribute('y1', STAFF_TOP+i*STAFF_GAP); el.setAttribute('y2', STAFF_TOP+i*STAFF_GAP);
      el.setAttribute('stroke', '#5c6480'); el.setAttribute('stroke-width', 1.5); el.setAttribute('opacity', 0);
      g.appendChild(el); staffLineEls.push(el);
    }
    ledgerLineEl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    ledgerLineEl.setAttribute('x1', CX-24); ledgerLineEl.setAttribute('x2', CX+24);
    ledgerLineEl.setAttribute('y1', CY); ledgerLineEl.setAttribute('y2', CY);
    ledgerLineEl.setAttribute('stroke', '#5c6480'); ledgerLineEl.setAttribute('stroke-width', 1.5); ledgerLineEl.setAttribute('opacity', 0);
    g.appendChild(ledgerLineEl);
  }
  function renderMiddleCVisual(resolve){
    staffLineEls.forEach(function(el){ el.setAttribute('opacity', (resolve*0.6).toFixed(3)); });
    ledgerLineEl.setAttribute('opacity', (resolve*0.7).toFixed(3));
    wholeNoteEl.setAttribute('cx', CX); wholeNoteEl.setAttribute('cy', CY);
    wholeNoteEl.setAttribute('rx', (resolve*24).toFixed(1));
    wholeNoteEl.setAttribute('ry', (resolve*16).toFixed(1));
    wholeNoteEl.setAttribute('opacity', resolve.toFixed(3));
    cLabelEl.setAttribute('opacity', resolve.toFixed(3));
  }
  function clearMiddleCVisual(){
    staffLineEls.forEach(function(el){ el.setAttribute('opacity', 0); });
    if(ledgerLineEl) ledgerLineEl.setAttribute('opacity', 0);
    if(wholeNoteEl) wholeNoteEl.setAttribute('opacity', 0);
    if(cLabelEl) cLabelEl.setAttribute('opacity', 0);
    pointDot.setAttribute('fill-opacity', 1);
    pointDot.setAttribute('r', DOT_R);
  }

  // ---- audio: the shared oscillator/gain from 35_audio.js (ensureToneOsc/setTone/stopTone),
  // connected to that file's own shared `master` gain -- so it automatically respects the site's
  // existing mute toggle and gesture-unlock (unlockAudio, wired to 'pointerdown' site-wide) rather
  // than needing its own separate AudioContext/unlock plumbing. The tone stays fully silent
  // through Scenes 5-6 ("only fade it in when the vibrations = C"), fades in across Scene 7 as the
  // note resolves, holds at full volume into the finale, then fades back out as the user keeps
  // scrolling on toward the very end.
  var TONE_PEAK_GAIN = 0.16;
  function toneEnvelopeFor(scene, lineIdx, lineT){
    if(scene.n < 7) return 0;
    var lineCount = scene.lines.length;
    var pos = lineIdx + lineT;
    if(scene.n === 7) return smoothstep(pos / (lineCount*0.7));
    return 1 - smoothstep((pos/lineCount - 0.35) / 0.6); // scene 8 (the finale): fade out
  }

  function renderFreqScene(scene, lineIdx, lineT){
    var nowSec = performance.now()/1000;

    // Scene 5's first 9 lines pause the live wave entirely and show one isolated, labelled cycle.
    if(scene.n === 5 && lineIdx <= 8){
      renderHzConceptDiagram(lineIdx);
      clearGrid(); clearAmpLines(); clearTail(); clearMiddleCVisual();
      ensureToneOsc(); setTone(1, 0);
      hzEl.style.opacity = 1; hzEl.textContent = '1 Hz';
      return scene.concept;
    }
    clearHzConcept();

    var kf0 = scene.lines[lineIdx];
    var kf1 = scene.lines[Math.min(scene.lines.length-1, lineIdx+1)];
    var isFinale = scene.n === 8;
    var hz = isFinale ? 261.63 : lerp(kf0.hz, kf1.hz, smoothstep(lineT));

    // Scene 7 (Middle C) eases the wave to a stop and morphs it into a whole note on a staff;
    // Scene 8 (the finale) holds that fully-resolved state throughout.
    var resolve = isFinale ? 1 : (scene.n === 7 ? smoothstep((lineIdx+lineT-1)/3.5) : 0);

    tickFreqPhase(visualHzFor(hz));
    var oscY = FREQ_RADIUS*Math.sin(freqPhase);
    var y = lerp(oscY, 0, resolve);
    freqHistory.push({ y:y, t:nowSec });
    var cutoff = nowSec - FREQ_HISTORY_MAX_AGE - 0.3;
    while(freqHistory.length && freqHistory[0].t < cutoff) freqHistory.shift();

    var s = project(0, y, 0, FREQ_TILT, FREQ_YAW);
    pointDot.setAttribute('r', lerp(DOT_R, DOT_R*2.2, resolve).toFixed(1));
    pointDot.setAttribute('fill-opacity', (1-resolve).toFixed(3));
    pointDot.setAttribute('cx', s.x.toFixed(1)); pointDot.setAttribute('cy', s.y.toFixed(1));

    clearGrid();
    clearAmpLines();
    renderFreqTrail(nowSec, FREQ_TILT, FREQ_YAW, 1-resolve);
    if(scene.n >= 7) renderMiddleCVisual(resolve); else clearMiddleCVisual();

    ensureToneOsc();
    setTone(hz, TONE_PEAK_GAIN * toneEnvelopeFor(scene, lineIdx, lineT));

    hzEl.style.opacity = 1;
    hzEl.textContent = scene.n === 7 || isFinale
      ? '261.63 Hz · Middle C (C4)'
      : (Number.isInteger(hz) ? hz : hz.toFixed(2)) + ' Hz';

    if(isFinale){
      var lit = kf0.words || [];
      document.querySelectorAll('.storyFinaleWord').forEach(function(el){
        el.classList.toggle('lit', lit.indexOf(el.dataset.word) !== -1);
      });
      // the two closing links live right here, next to the narrator words -- revealed once the
      // finale has assembled all 4 words into "Middle C" (line 7, "This... is Middle C."), not
      // held back for a separate trailing section the visitor would otherwise have to keep
      // scrolling past to ever see them.
      if(endLinksEl) endLinksEl.classList.toggle('show', lit.indexOf('middlec') !== -1);
    }

    return scene.concept;
  }
  function clearFreqScene(){
    hzEl.style.opacity = 0;
    document.querySelectorAll('.storyFinaleWord').forEach(function(el){ el.classList.remove('lit'); });
    if(endLinksEl) endLinksEl.classList.remove('show');
    stopTone();
    clearHzConcept();
    clearMiddleCVisual();
  }

  // a line can mark a word for emphasis with **word**.
  function renderLineMarkup(text){ return text.replace(/\*\*(.+?)\*\*/g, '<b class="hl">$1</b>'); }

  function renderStory(scrollTop){
    var r = resolveProgress(scrollTop);
    var scene = r.scene, lineIdx = r.lineIdx, lineT = r.lineT, sceneIdx = r.sceneIdx;
    var lineObj = scene.lines[lineIdx];
    var text = typeof lineObj === 'string' ? lineObj : lineObj.text;
    var label = '0' + scene.n + ' · ' + scene.concept.toUpperCase();

    if(sceneIdx === 0){ renderScene1(); clearMotionTail(); clearGrid(); clearTail(); clearAmpLines(); clearFreqScene(); }
    else if(sceneIdx === 1){ /* dot+tail are owned by tickStoryIntro's own per-frame motion tick */ clearGrid(); clearTail(); clearAmpLines(); clearFreqScene(); }
    else if(sceneIdx === 2){ var liveLabel = renderScene3(scene, lineIdx, lineT); clearMotionTail(); clearFreqScene(); label = liveLabel.toUpperCase(); }
    else if(sceneIdx === 3){ renderScene4(scene, lineIdx, lineT); clearMotionTail(); clearFreqScene(); }
    else { var freqLabel = renderFreqScene(scene, lineIdx, lineT); clearMotionTail(); label = '0' + scene.n + ' · ' + freqLabel.toUpperCase(); }

    // while the entrance is still playing, the caption stays silent.
    if(sceneIdx === 0 && lineIdx === 0 && !introDone){
      labelEl.textContent = ''; lineEl.innerHTML = ''; lineEl.style.opacity = 0;
      return;
    }
    labelEl.textContent = label;
    lineEl.innerHTML = renderLineMarkup(text);
    var envelope = (sceneIdx === 0 && lineIdx === 0) ? fadeEnvelopeFirst(lineT) : fadeEnvelope(lineT);
    lineEl.style.opacity = envelope.toFixed(3);
  }

  // ---- the one per-frame tick, called from 96_simple.js's heroFrameStep (already gated on
  // #simpleFront being the visible thing) -- covers the Scene-1 grow-in, Scene 2's continuous
  // wander, and Scenes 3+'s continuously-moving wave, all of which must keep animating in real
  // time regardless of scroll position.
  var wired = false;
  tickStoryIntro = function(){
    if(!wired) return;
    var scrollTop = storyScrollTop();
    if(!introDone){
      var now = performance.now();
      if(introT0 === null) introT0 = now;
      if(resolveProgress(scrollTop).sceneIdx !== 0){ introDone = true; }
      else {
        var p = Math.min(1, (now-introT0)/INTRO_DUR);
        pointDot.setAttribute('r', (DOT_R*easeOutCubic(p)).toFixed(2));
        pointDot.setAttribute('cx', CX); pointDot.setAttribute('cy', CY);
        if(p >= 1){ introDone = true; renderStory(scrollTop); }
      }
    }
    var r = resolveProgress(scrollTop);
    if(r.sceneIdx === 1) tickMotion(r);
    else if(r.sceneIdx >= 2) renderStory(scrollTop);
  };

  wireStoryIntro = function(){
    home = document.getElementById('simpleFront');
    wrap = document.getElementById('storyStage');
    pointDot = document.getElementById('storyDot');
    labelEl = document.getElementById('storyLabel');
    lineEl = document.getElementById('storyLine');
    hzEl = document.getElementById('storyHz');
    wholeNoteEl = document.getElementById('storyWholeNote');
    cLabelEl = document.getElementById('storyCLabel');
    if(!home || !wrap || !pointDot) return;
    hzEl.style.opacity = 0;

    buildMotionTail();
    buildGrid();
    buildTail();
    buildAmpLines();
    buildHzConcept();
    buildStaff();

    wrap.style.height = totalRangePx + 'px';

    endLinksEl = document.getElementById('storyEndLinks');
    var music101 = document.getElementById('storyMusic101');
    var science102 = document.getElementById('storyScience102');
    if(music101) music101.addEventListener('click', function(e){ e.preventDefault(); showAdvanced(); switchMode('lessons'); });
    if(science102) science102.addEventListener('click', function(e){ e.preventDefault(); showAdvanced(); switchMode('science'); });

    wireScrollRange(home, wrap, totalRangePx, function(t){ renderStory(t*totalRangePx); });
    wired = true;
    renderStory(0);
  };
})();
