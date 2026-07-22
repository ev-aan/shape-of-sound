/* Headless smoke test: stubs three.js + the DOM, then exercises every layer.
   Build first (python build/build.py), then: node tests/test.js  */
require('./harness.js');
const fs = require('fs'), path = require('path');
const dist = path.join(__dirname, '..', 'dist', 'shape_of_music.html');
if (!fs.existsSync(dist)) { console.error('Build first: python build/build.py'); process.exit(1); }
const html = fs.readFileSync(dist, 'utf-8');
global.DATA = JSON.parse(html.match(/const DATA=(\{[\s\S]*?\});const SILENT=/)[1]);
global.SILENT = 'x';
const a = html.indexOf('(function(){"use strict";');
eval(html.slice(a, html.indexOf('</script>', a)));   // run the app against the stubs

// boot schedules one harmless setTimeout of its own (90_init.js's toast auto-dismiss, 6500ms),
// which -- since the DOM stub's #toast always exists -- itself schedules a second nested one
// (the actual .remove(), 500ms later). Drain both now so neither sits at the front of the FIFO
// queue and gets mistaken for an actual engine's own scheduled step by the first test that
// calls __fireTimeout() (Bach, rhythm blocks).
global.__fireTimeout(); global.__fireTimeout();

const C = global.__cache, fire = global.__fire, raf = () => global.__raf();
const frames = n => { for (let i = 0; i < n && raf(); i++) raf()(); };
const clk = (el, k) => fire(el, 'click', { target: { closest: () => ({ dataset: k, disabled: false }) } });
try {
  // ---- shared library primitives: mod12, FIFTHS_ORDER, guessScaleFamily, and the two newly
  // registered Surfaces (see 01_palette.js, 05_surfaces.js, 94_topbar.js, 86_scales_chart.js,
  // 06_elorah_logo.js) — extracted from duplicated inline code across many surface files
  if (__api.mod12(-1) !== 11) throw new Error('mod12(-1) should wrap to 11, not stay negative');
  if (__api.mod12(13) !== 1) throw new Error('mod12(13) should wrap to 1');
  if (__api.mod12(0) !== 0) throw new Error('mod12(0) should stay 0');
  if (__api.FIFTHS_ORDER.length !== 12 || __api.FIFTHS_ORDER[0] !== 0 || __api.FIFTHS_ORDER[1] !== 7) throw new Error('FIFTHS_ORDER should start [0, 7, ...] (root, then a fifth above)');
  if (__api.guessScaleFamily({ q: 'dim' }) !== 'minor') throw new Error('a diminished chord should guess the minor scale family');
  if (__api.guessScaleFamily({ q: 'maj7' }) !== 'major') throw new Error('a major 7th chord should guess the major scale family');
  if (!__api.Surfaces.get('scaleschart')) throw new Error('scales chart should be registered as a Surface');
  if (!__api.Surfaces.get('elorahlogo')) throw new Error('the Elorah logo should be registered as a Surface');
  const logoScratch = document.createElement('div');
  __api.Surfaces.get('elorahlogo').render(logoScratch, { size: 40 });
  if (!/class="elorahLogo"/.test(logoScratch.innerHTML) || !/width="40"/.test(logoScratch.innerHTML)) throw new Error('the registered elorahlogo surface should render the real logo svg with the requested size');
  // Simple mode: the Elorah hero front door, shown by default with no shared URL
  if (C['simpleFront'].style.display === 'none') throw new Error('Simple front door should show by default (no hash)');
  if (C['advancedApp'].style.display !== 'none') throw new Error('Advanced app should stay hidden until entered');
  // ripple panel: its own render surface (not a spot inside the chord-map scene), so it must be
  // toggleable from anywhere — proven here, before ever entering Advanced/Science/Play at all
  if (__api.rippleMesh.visible || C['rippleView'].style.display === 'block') throw new Error('the ripple panel should start hidden');
  if (__api.isRippleRoomBuilt()) throw new Error('the room\'s floor/reflection/fog should not be built until first opened');
  C['rippleToggleBtn'].onclick();
  if (!__api.rippleMesh.visible || C['rippleView'].style.display !== 'block') throw new Error('the ripple toggle should work from the Simple front door, before entering any mode');
  if (!__api.isRippleRoomBuilt()) throw new Error('opening the ripple should lazily build the room');
  const reflectionAfterFirstOpen = __api.getRippleReflectionUniforms();
  if (!reflectionAfterFirstOpen) throw new Error('opening the ripple should create the reflection uniforms');
  C['rippleToggleBtn'].onclick();
  if (__api.rippleMesh.visible) throw new Error('the ripple toggle should hide the panel again');
  C['rippleToggleBtn'].onclick();
  if (__api.getRippleReflectionUniforms() !== reflectionAfterFirstOpen) throw new Error('reopening the ripple should reuse the already-built room, not rebuild it');
  __api.updateRipple(0.016);
  const refl = __api.getRippleReflectionUniforms();
  if (refl.uTime.value !== __api.rippleUniforms.uTime.value) throw new Error('the reflection should track the main panel\'s time uniform');
  if (refl.uHSL.value.x !== __api.rippleUniforms.uHSL.value.x) throw new Error('the reflection should track the main panel\'s tint');
  C['rippleToggleBtn'].onclick();
  if (__api.rippleMesh.visible) throw new Error('the ripple toggle should hide the panel again');
  // the Elorah logo: the circle of fifths drawn as the spiral it actually is — real fifths order
  // (i*7)%12, real note colours, and a radius that compounds by the genuine Pythagorean comma
  // each step (not an arbitrary decorative curve), so it should read as strictly increasing
  const logoSvg = __api.elorahLogoSvg(22); // 22 — matches the size 99_boot.js actually mounts both slots with
  const radii = [...logoSvg.matchAll(/cx="([\d.]+)" cy="([\d.]+)"/g)].map(m => Math.hypot(+m[1]-60, +m[2]-60));
  if (radii.length !== 30) throw new Error('logo should place 30 dots (2.5 loops of the 12 fifths), got ' + radii.length);
  for (let i = 1; i < radii.length; i++) {
    if (radii[i] <= radii[i-1] + 1e-6) throw new Error('logo radius should strictly increase step to step (the comma compounding), broke at dot ' + i);
  }
  // coordinates in the SVG string are rounded to 1 decimal place, so re-deriving radius via
  // hypot from them (rather than reading the surface's own unrounded numbers) needs a tolerance
  // for that rounding, not exact equality
  const totalGrowth = radii[radii.length-1] / radii[0], expectedGrowth = Math.pow(__api.ELORAH_COMMA, 29);
  if (Math.abs(totalGrowth - expectedGrowth) / expectedGrowth > 0.01) throw new Error('logo\'s total radius growth should equal the Pythagorean comma compounded over 29 steps (~' + expectedGrowth.toFixed(4) + '), got ' + totalGrowth.toFixed(4));
  if (C['heroLogoSlot'].innerHTML !== logoSvg) throw new Error('the hero mark should be wired up with the logo at boot');
  if (C['siteHeaderLogoSlot'].innerHTML !== logoSvg) throw new Error('the persistent advanced-app header should be wired up with the same logo at boot');
  if (!__api.Surfaces || !__api.Surfaces.get('cof')) throw new Error('circle-of-fifths surface not registered');
  if (!__api.Surfaces.get('keyboard')) throw new Error('keyboard surface not registered');
  if (!/cofNote/.test(C['heroWheel'].innerHTML)) throw new Error('circle-of-fifths surface did not render into the hero wheel');
  // the noteRadius option (added for the hero's "slightly larger" dots) is additive: omitting it
  // still defaults to the original r=22 every other cof caller (Musical mode's own wheel) relies on
  const cofDefault = document.createElement('div');
  __api.Surfaces.get('cof').render(cofDefault, {});
  if (!/r="22"/.test(cofDefault.innerHTML)) throw new Error('cof surface should default to noteRadius 22 when omitted, for backward compatibility');
  const cofBig = document.createElement('div');
  __api.Surfaces.get('cof').render(cofBig, { noteRadius: 28 });
  if (!/r="28"/.test(cofBig.innerHTML)) throw new Error('cof surface should honour an explicit noteRadius');
  // tapping a wheel note plays it, and does not navigate away from the front door
  let heroOscCount = 0;
  const origHeroCreateOsc = global.window.AudioContext.prototype.createOscillator;
  global.window.AudioContext.prototype.createOscillator = function(){ heroOscCount++; return origHeroCreateOsc.apply(this, arguments); };
  fire(C['heroWheel'], 'click', { target: { closest: sel => sel === '.cofNote' ? { dataset: { pc: '0' } } : null } });
  global.window.AudioContext.prototype.createOscillator = origHeroCreateOsc;
  if (heroOscCount !== 1) throw new Error('tapping a wheel note should play it, played ' + heroOscCount);
  if (C['advancedApp'].style.display === '') throw new Error('tapping a wheel note should not leave the Simple front door');
  // each of the 4 statement rows enters its own mode via one delegated listener (same convention
  // as wireTopbar's switchMode), and the Science row additionally forces 3D, matching the old
  // Science card's behaviour
  fire(C['heroRows'], 'click', { target: { closest: sel => sel === '.heroRow' ? { dataset: { mode: 'musical' } } : null } });
  if (C['advancedApp'].style.display === 'none') throw new Error('the Musical row should open Advanced');
  if (__api.View.get().mode !== 'musical') throw new Error('the Musical row should enter Musical mode');
  C['siteHeaderHome'].onclick();
  fire(C['heroRows'], 'click', { target: { closest: sel => sel === '.heroRow' ? { dataset: { mode: 'science' } } : null } });
  if (__api.View.get().mode !== 'science') throw new Error('the Science row should enter Science mode');
  if (__api.View.get().dim !== '3d') throw new Error('the Science row should switch to 3D');
  C['siteHeaderHome'].onclick();
  fire(C['heroRows'], 'click', { target: { closest: sel => sel === '.heroRow' ? { dataset: { mode: 'play' } } : null } });
  if (__api.View.get().mode !== 'play') throw new Error('the Play row should enter Play mode');
  C['siteHeaderHome'].onclick();
  fire(C['heroRows'], 'click', { target: { closest: sel => sel === '.heroRow' ? { dataset: { mode: 'lessons' } } : null } });
  if (__api.View.get().mode !== 'lessons') throw new Error('the Lessons row should enter Lessons mode');
  C['siteHeaderHome'].onclick();
  if (C['simpleFront'].style.display === 'none') throw new Error('back-to-Simple button should restore the front door');
  // magnetic hover: the CTA and the wheel's notes nudge toward the cursor on pointermove, and
  // release (clear their transform) on pointerleave
  fire(C['heroCta'], 'pointermove', { clientX: 450, clientY: 310 });
  if (!C['heroCta'].style.transform) throw new Error('the CTA should set a magnetic transform on pointermove');
  fire(C['heroCta'], 'pointerleave', {});
  if (C['heroCta'].style.transform) throw new Error('the CTA should clear its transform on pointerleave');
  const wheelNote = document.createElement('div');
  fire(C['heroWheel'], 'pointermove', { clientX: 450, clientY: 310, target: { closest: sel => sel === '.cofNote' ? wheelNote : null } });
  if (!wheelNote.style.transform) throw new Error('hovering a wheel note should set a magnetic transform on it');
  fire(C['heroWheel'], 'pointerleave', {});
  if (wheelNote.style.transform) throw new Error('leaving the wheel should release the active note\'s transform');
  // same idea for a row's arrow, seeded via a mock row that exposes just enough (querySelector)
  // for the delegated handler to find its arrow — mirrors how every other delegated-click test
  // in this file mocks e.target.closest rather than needing a real DOM tree
  const rowArrow = document.createElement('div');
  fire(C['heroRows'], 'pointermove', { clientX: 450, clientY: 310, target: { closest: sel => sel === '.heroRow' ? { querySelector: s => s === '.heroRowArrow' ? rowArrow : null } : null } });
  if (!rowArrow.style.transform) throw new Error('hovering a row should set a magnetic transform on its arrow');
  // scroll parallax: the wheel should pick up a translateY as #simpleFront scrolls
  C['simpleFront'].scrollTop = 500;
  fire(C['simpleFront'], 'scroll', {});
  if (!/translateY/.test(C['heroWheel'].style.transform)) throw new Error('scrolling the front door should apply a parallax transform to the wheel');
  C['simpleFront'].scrollTop = 0;
  fire(C['simpleFront'], 'scroll', {});
  // the CTA button, used to enter Advanced (defaulting to Science, no forced 3D) for the rest of this test
  C['heroCta'].onclick();
  if (C['advancedApp'].style.display === 'none') throw new Error('Advanced app should show after entering from Simple');
  if (__api.View.get().mode !== 'science') throw new Error('the CTA should default to Science mode');
  // persistent header doubles as navigation: its own nav buttons jump straight to a mode via the
  // same switchMode used everywhere else, and the mark itself is a second "back to Simple" link
  fire(C['siteHeaderNav'], 'click', { target: { closest: sel => sel === 'button[data-mode]' ? { dataset: { mode: 'musical' } } : null } });
  if (__api.View.get().mode !== 'musical') throw new Error('a header nav button should switch mode via switchMode');
  fire(C['siteHeaderNav'], 'click', { target: { closest: sel => sel === 'button[data-mode]' ? { dataset: { mode: 'science' } } : null } });
  if (__api.View.get().mode !== 'science') throw new Error('the header nav should be able to switch mode again');
  C['siteHeaderHome'].onclick();
  if (C['simpleFront'].style.display === 'none') throw new Error('the header mark should act as a home link back to the Simple front door');
  // back into Advanced/Science for the rest of this test, same as the CTA does above
  C['heroCta'].onclick();
  // Science concept stage: a fresh entry always lands on the concept page first (the wave demo,
  // then the spectrum banner, then the CTA into the map) — not everything shown at once
  if (C['scienceHome'].style.display === 'none') throw new Error('a fresh entry into Science should land on the concept stage');
  if (C['scene'].style.display === '') throw new Error('the 3D map should stay hidden until "Start exploring" is clicked');
  if (C['panel'].style.display === '') throw new Error('the exploration sidebar should stay hidden on the concept stage');
  // "how sound happens" wave demo: silent/flat at rest, becomes a sine wave that tightens (more
  // cycles) as the mouse moves right, and names the real note (via pcName/m2f) it's landed on
  const waveRest = document.createElement('div');
  __api.renderSciWaveDemo(waveRest, {});
  if (!/data-cycles="0"/.test(waveRest.innerHTML)) throw new Error('the wave demo should render flat (0 cycles) at rest');
  const waveMid = document.createElement('div');
  __api.renderSciWaveDemo(waveMid, { freqT: 0.5 });
  if (!/data-cycles="10"/.test(waveMid.innerHTML)) throw new Error('the wave demo should render 10 cycles at freqT 0.5 (2 + 0.5*16)');
  if (!/data-pc="6"/.test(waveMid.innerHTML)) throw new Error('the wave demo should land on pitch class 6 at freqT 0.5');
  if (!waveMid.innerHTML.includes(__api.pcName(6, 0))) throw new Error('the wave demo caption should name the real note (pcName) it lands on');
  // stage 1 (amplitude, a swinging dot) and stage 2 (waveform, the same motion unrolled) — direct-render checks
  const ampStage = document.createElement('div');
  __api.renderSciAmplitudeStage(ampStage, { amplitude: 0.5 });
  if (!/data-amplitude="0.50"/.test(ampStage.innerHTML)) throw new Error('the amplitude stage should render the given amplitude');
  if (!/class="sciDot"/.test(ampStage.innerHTML)) throw new Error('the amplitude stage should render a dot, not a wave shape yet');
  const waveformStage = document.createElement('div');
  __api.renderSciWaveformStage(waveformStage, { amplitude: 0.5 });
  if (!/data-amplitude="0.50"/.test(waveformStage.innerHTML)) throw new Error('the waveform stage should render the given amplitude');
  if (!/class="specWave"/.test(waveformStage.innerHTML)) throw new Error('the waveform stage should draw a wave path');
  // renderSciWaveContinuum: one continuous shape (via buildSinePath) that densifies smoothly
  // with t, never jump-cutting between stages — direct-render checks first
  const contRest = document.createElement('div');
  __api.renderSciWaveContinuum(contRest, { t: 0, amplitude: 0.5 });
  if (!/data-cycles="0.50"/.test(contRest.innerHTML)) throw new Error('t=0 should render a single hump (cycles 0.5)');
  if (/data-pc="\d/.test(contRest.innerHTML)) throw new Error('t=0 should not have a pitch class yet (still in the amplitude zone)');
  if (!/<filter id="sciGlow"/.test(contRest.innerHTML)) throw new Error('the continuum renderer should draw its soft glow filter');
  const contFreq = document.createElement('div');
  __api.renderSciWaveContinuum(contFreq, { t: 0.9, amplitude: 0.5 });
  if (!/data-cycles="16.25"/.test(contFreq.innerHTML)) throw new Error('t=0.9 should render 16.25 cycles (0.5 + 0.9*17.5)');
  if (!/data-pc="8"/.test(contFreq.innerHTML)) throw new Error('t=0.9 should land on pitch class 8');
  // scroll continuously drives the same shape (RANGE_PX 2000, harness offsetTop is 0) — the
  // caption's bright word changes across 3 zones, and a real note only plays in the frequency zone
  C['scienceHome'].scrollTop = 200; // t=0.1: amplitude zone
  fire(C['scienceHome'], 'scroll', {});
  if (!/sciCaptionBright">AMPLITUDE/.test(C['sciStagePanel'].innerHTML)) throw new Error('t=0.1 should show the AMPLITUDE caption');
  let waveOscCount = 0;
  const origWaveCreateOsc = global.window.AudioContext.prototype.createOscillator;
  global.window.AudioContext.prototype.createOscillator = function(){ waveOscCount++; return origWaveCreateOsc.apply(this, arguments); };
  C['scienceHome'].scrollTop = 1000; // t=0.5: wave zone, still silent
  fire(C['scienceHome'], 'scroll', {});
  if (!/sciCaptionBright">A WAVE/.test(C['sciStagePanel'].innerHTML)) throw new Error('t=0.5 should show the A WAVE caption');
  if (waveOscCount !== 0) throw new Error('the wave zone should stay silent, played ' + waveOscCount);
  C['scienceHome'].scrollTop = 1800; // t=0.9: frequency zone — now it should sound a note
  fire(C['scienceHome'], 'scroll', {});
  global.window.AudioContext.prototype.createOscillator = origWaveCreateOsc;
  if (waveOscCount !== 1) throw new Error('entering the frequency zone should sound a note, played ' + waveOscCount);
  if (!C['sciStagePanel'].innerHTML.includes(__api.pcName(8, 0))) throw new Error('the frequency zone caption should name the real note it lands on');
  // the amplitude slider is the one always-visible interactive control, live at any scroll position
  C['sciAmpSlider'].value = '80'; fire(C['sciAmpSlider'], 'input', {});
  if (!/data-cycles="16.25"/.test(C['sciStagePanel'].innerHTML)) throw new Error('dragging the amplitude slider should keep the current scroll position\'s cycle count');
  C['scienceHome'].scrollTop = 200; fire(C['scienceHome'], 'scroll', {}); // back to the amplitude zone for a clean handoff
  // "Start exploring" reveals the existing 3D map/sidebar/legend, unchanged, and hides the concept page
  C['sciExploreCta'].onclick();
  if (C['scienceHome'].style.display !== 'none') throw new Error('starting exploring should hide the concept page');
  if (C['scene'].style.display === 'none') throw new Error('starting exploring should reveal the 3D map');
  if (C['panel'].style.display === 'none') throw new Error('starting exploring should reveal the exploration sidebar');
  // "back to concept" returns without leaving Science mode, then re-enter explore for the rest of this test
  C['sciBackConceptBtn'].onclick();
  if (C['scienceHome'].style.display === 'none') throw new Error('"back to concept" should return to the concept stage');
  if (__api.View.get().mode !== 'science') throw new Error('"back to concept" should not leave Science mode');
  C['sciExploreCta'].onclick();
  // "continue to Lessons" is a clear forward path out of the exploration stage, via the same switchMode choke point
  C['sciToLessonsBtn'].onclick();
  if (__api.View.get().mode !== 'lessons') throw new Error('"continue to Lessons" should switch to Lessons mode');
  fire(C['siteHeaderNav'], 'click', { target: { closest: sel => sel === 'button[data-mode]' ? { dataset: { mode: 'science' } } : null } });
  C['sciExploreCta'].onclick();
  // onExit cleanup: leaving Science while still on the concept stage shouldn't leave it stacked on top of another mode
  C['sciBackConceptBtn'].onclick();
  fire(C['siteHeaderNav'], 'click', { target: { closest: sel => sel === 'button[data-mode]' ? { dataset: { mode: 'musical' } } : null } });
  if (C['scienceHome'].style.display !== 'none') throw new Error('leaving Science should hide #scienceHome even if it was on the concept stage (onExit)');
  fire(C['siteHeaderNav'], 'click', { target: { closest: sel => sel === 'button[data-mode]' ? { dataset: { mode: 'science' } } : null } });
  C['sciExploreCta'].onclick();
  // spectrum banner: sound ("Hear") in context of the wider wave spectrum, wired at boot when
  // Science mode is first entered — a direct-render check first, then the live mount point
  const spec = document.createElement('div');
  __api.Surfaces.get('spectrum').render(spec, {});
  if ((spec.innerHTML.match(/class="specBand /g) || []).length !== __api.Surfaces.get('spectrum').bands.length) throw new Error('spectrum surface should draw one band per entry in SPECTRUM_BANDS');
  if (!/data-band="feel"/.test(spec.innerHTML) || !/data-band="hear"/.test(spec.innerHTML) || !/data-band="see"/.test(spec.innerHTML)) throw new Error('spectrum surface should include the feel/hear/see bands the user can directly sense');
  if (!/class="specWave"/.test(spec.innerHTML)) throw new Error('spectrum surface should draw the compressing wave path');
  if (!/class="specBand /.test(C['sciSpectrumChart'].innerHTML)) throw new Error('the spectrum banner should be wired into the live Science page at boot');
  let specOscCount = 0;
  const origSpecCreateOsc = global.window.AudioContext.prototype.createOscillator;
  global.window.AudioContext.prototype.createOscillator = function(){ specOscCount++; return origSpecCreateOsc.apply(this, arguments); };
  fire(C['sciSpectrumChart'], 'click', { target: { closest: sel => sel === '.specBand' ? { dataset: { band: 'hear' } } : null } });
  global.window.AudioContext.prototype.createOscillator = origSpecCreateOsc;
  if (specOscCount !== 1) throw new Error('tapping the "Hear" band should play a reference tone, played ' + specOscCount);
  if (!/Hear/.test(C['sciSpectrumChart'].innerHTML)) throw new Error('tapping a band should re-render with a caption describing it');
  fire(C['sciSpectrumChart'], 'click', { target: { closest: sel => sel === '.specBand' ? { dataset: { band: 'radio' } } : null } });
  if (!/Radio/.test(C['sciSpectrumChart'].innerHTML)) throw new Error('tapping an unperceived band should still update the caption, without playing anything');

  fire(document, 'pointerdown', {}); global.__hit = true;
  clk(C['layoutPills'], { k: 'axes' }); frames(40);
  C['axX'].value = 'pitch'; C['axX'].onchange(); frames(40);
  clk(C['renderPills'], { k: 'clouds' }); frames(20);
  clk(C['renderPills'], { k: 'stars' }); clk(C['layoutPills'], { k: 'disc' }); frames(40);
  fire(C['scene'], 'pointerdown', { clientX: 100, clientY: 100 });
  fire(C['scene'], 'pointerup', { clientX: 100, clientY: 100 });
  fire(C['detail'], 'click', { target: { closest: () => ({ dataset: { act: 'wave' } }) } });
  fire(C['waveNotes'], 'click', { target: { closest: () => ({ dataset: { n: '10' } }) } });
  C['waveH'].value = '12'; C['waveH'].oninput(); C['wavePlay'].onclick(); C['waveClose'].onclick();
  C['keySel'].value = '0'; fire(C['keySel'], 'change', {}); frames(5);
  // colour consistency: the key legend must draw its T/S/D swatches from the same Palette.FN
  // that Musical mode's function-colouring uses — they used to be two different colour constants
  const legendSwatches = C['legend'].children.map(c => c.innerHTML).join('');
  if (!legendSwatches.includes(__api.Palette.FN.T)) throw new Error('key legend should use Palette.FN, the single source of T/S/D colours');
  C['keySel'].value = '-1'; fire(C['keySel'], 'change', {}); frames(5);
  // progressive disclosure: Science/Musical panels start collapsed to their primary controls
  if (C['sciMore'].style.display !== 'none') throw new Error('Science "more options" should start collapsed');
  C['sciMoreBtn'].onclick();
  if (C['sciMore'].style.display === 'none') throw new Error('Science "more options" toggle should reveal secondary controls');
  C['sciMoreBtn'].onclick();
  // Play tab: keyboard + sequencer live together; the old per-panel compose buttons are gone
  if (C['composeBtn']) throw new Error('composeBtn should have been removed from the Science panel');
  fire(C['siteHeaderNav'], 'click', { target: { closest: sel => sel === 'button[data-mode]' ? { dataset: { mode: 'play' } } : null } });
  frames(5);
  if (__api.View.get().mode !== 'play') throw new Error('Play tab did not activate');
  if (!C['compose'].classList.contains('show')) throw new Error('entering Play should open the sequencer drawer');
  if (C['title'].style.display !== 'none') throw new Error('Play mode should hide #title (Science-specific copy bleeding into Play\'s own UI)');
  // the empty-state readout invites a choice ("what chord do you want to hear?") rather than
  // just instructing — checked against the source, in both the static markup and the JS reset
  // path (onPlayNotesChange with an empty set), since the harness's DOM stubs start blank and
  // don't reflect real static HTML content the way a browser would. The Piano tool (98_piano_tool.js)
  // deliberately reuses the same copy for its own static markup + JS reset path, so this is now
  // 2 pairs (4 total), not 1.
  const playReadoutCopies = (html.match(/what chord do you want to hear/ig) || []).length;
  if (playReadoutCopies !== 4) throw new Error('expected the empty-state readout text in both Play\'s and Piano\'s static markup + JS reset paths, found ' + playReadoutCopies);
  const pressKey = pc => fire(C['playKeyboard'], 'click', { target: { closest: () => ({ dataset: { pc: String(pc) }, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } } }) } });
  pressKey(0); pressKey(4); pressKey(7); // C E G
  if (C['playAddBtn'].disabled) throw new Error('C+E+G should be recognised as a chord ready to add');
  if (!/Cmaj/.test(C['playReadout'].textContent)) throw new Error('C+E+G should be named Cmaj on the keyboard readout');
  C['playAddBtn'].onclick();
  if (!/Cmaj/.test(C['seqSlots'].innerHTML)) throw new Error('adding a recognised chord should land in the sequence');
  fire(C['scene'], 'pointerdown', { clientX: 100, clientY: 100 });
  fire(C['scene'], 'pointerup', { clientX: 100, clientY: 100 });
  C['seqPlay'].onclick(); frames(120);
  // new: chord-name labels, key focus, cymatics
  C['namesBtn'].onclick(); C['namesBtn'].onclick();
  C['keyFocusBtn'].onclick(); frames(5); C['keyFocusBtn'].onclick(); frames(5);
  C['cymBtn'].onclick();
  fire(C['cymNotes'], 'click', { target: { closest: () => ({ dataset: { n: '3' } }) } });
  fire(C['cym'], 'click', { target: { closest: () => ({ dataset: { cs: 'circular' } }) } });
  C['cymH'].value = '6'; C['cymH'].oninput();
  C['cymAnimBtn'].onclick(); C['cymPlay'].onclick(); C['cymClose'].onclick();
  // ripple panel, again here (now deep into Play mode) — its own render surface keeps working
  // regardless of which mode/page is active, and stays audio-reactive. A real noise-displaced
  // shader now (not a canvas texture), so we assert against its uniforms instead of pixels.
  C['rippleToggleBtn'].onclick();
  if (!__api.rippleMesh.visible) throw new Error('the ripple toggle should still work from within Play mode');
  const uTimeBefore = __api.rippleUniforms.uTime.value;
  __api.updateRipple(0.016); // should not throw
  if (__api.rippleUniforms.uTime.value !== uTimeBefore + 0.016) throw new Error('updateRipple should advance the shader\'s uTime uniform');
  __api.playFreqs([440]); // A4 = pitch class 9 (not 0 -- 440Hz is the A-relative reference, offset back to this app's C=0 numbering)
  __api.updateRipple(0.016);
  if (__api.rippleUniforms.uHSL.value.x !== __api.Palette.noteHue(9)) throw new Error('playing a note should tint the ripple with that note\'s real hue');
  // Shadertoy loader: paste raw Shadertoy GLSL, wrapped with the standard uniforms and run as
  // a second ripple-room mode (see 33_shadertoy.js) — no headless GLSL compilation, just proving
  // the wrapping/wiring doesn't throw and the mode switch behaves, same posture as the room's own shader
  if (__api.getRippleMode() !== 'room') throw new Error('the ripple should start in room mode');
  const wrapped = __api.wrapShadertoyGLSL('void mainImage( out vec4 fragColor, in vec2 fragCoord ){ fragColor = vec4(1.0); }');
  if (!/uniform vec3 iResolution/.test(wrapped) || !/uniform float iTime/.test(wrapped) || !/mainImage\(gl_FragColor, vUv \* iResolution\.xy\)/.test(wrapped)) throw new Error('wrapShadertoyGLSL should inject the standard Shadertoy uniforms and call mainImage from the plane\'s own UV, not gl_FragCoord');
  const badResult = __api.loadShadertoy('this is not a shader');
  if (badResult.ok) throw new Error('loading a shader with no mainImage(...) should fail, not silently succeed');
  if (__api.getRippleMode() !== 'room') throw new Error('a failed shader load should not change the ripple mode');
  const goodResult = __api.loadShadertoy(__api.CINESHADER_RIPPLE_EXAMPLE);
  if (!goodResult.ok) throw new Error('loading the built-in example shader should succeed');
  if (__api.getRippleMode() !== 'shader') throw new Error('loading a valid shader should switch the ripple into shader mode');
  __api.updateShaderToy(0.016); // should not throw
  if (__api.shaderToyUniforms.iTime.value !== 0.016) throw new Error('updateShaderToy should advance iTime');
  if (__api.shaderToyUniforms.iFrame.value !== 1) throw new Error('updateShaderToy should advance iFrame');
  // the shader is mounted into the same room/scene as the noise panel (not a fullscreen overlay
  // with its own camera) — a render tick in shader mode should show the shader mesh and hide the
  // noise mesh, while the room itself stays open the whole time
  if (!__api.isRippleRoomOpen()) throw new Error('the room should still be open while a shader is loaded');
  __api.renderRippleFrame(0.016);
  if (__api.rippleMesh.visible) throw new Error('the noise panel should be hidden while the shader is showing');
  if (!__api.shaderToyMesh.visible) throw new Error('the shader mesh should be visible once rendered in shader mode');
  if (!__api.isRippleRoomOpen()) throw new Error('rendering a shader-mode frame should not close the room');
  C['rippleToggleBtn'].onclick(); // close the whole room
  if (__api.isRippleRoomOpen()) throw new Error('the ripple toggle should close the room even while a shader is loaded');
  if (__api.rippleMesh.visible) throw new Error('the ripple toggle should hide the panel again');
  if (__api.shaderToyMesh.visible) throw new Error('closing the room should hide the shader mesh too');
  if (__api.getRippleMode() !== 'room') throw new Error('closing the ripple room should reset back to room mode, not stay in shader mode');
  // Musical mode: no 3D controls — a circle of fifths (tap a note = pick a key) plus a
  // function-coloured diagram of that key's chords (subdominant -> dominant -> tonic)
  fire(C['siteHeaderNav'], 'click', { target: { closest: sel => sel === 'button[data-mode]' ? { dataset: { mode: 'musical' } } : null } });
  frames(5);
  if (typeof __api === 'undefined' || __api.View.get().mode !== 'musical') throw new Error('mode toggle failed');
  if (C['scene'].style.display !== 'none') throw new Error('Musical mode should hide the 3D map');
  if (C['panel'].style.display !== 'none') throw new Error('Musical mode should hide the small side panel');
  // cold start: land straight in C major with a chord already selected, not a blank "tap a
  // note" prompt — no tap needed for any of this
  if (__api.View.get().key !== 0) throw new Error('Musical mode should default to C major on entry, got key ' + __api.View.get().key);
  if (!/^Cmaj:\s+C \(root\)/.test(C['musChordLabel'].textContent)) throw new Error('Musical mode should default to showing the C major tonic triad on entry');
  // a second, prominent copy of the chord-tone label lives right under the circle now (the
  // original stayed above the Bach player, easy to miss unless scrolled all the way down) —
  // both should always agree, kept in sync from one place (setChordLabels)
  if (C['musChordLabelTop'].textContent !== C['musChordLabel'].textContent) throw new Error('the prominent top chord label should mirror the original one');
  // the neighbours header now lives inside renderNeighbors()'s own output (like renderSuggestions
  // already did) instead of being static markup that showed even with nothing underneath it —
  // since the cold-start default above already selects a chord, it should show right away
  if (!/neighbouring chords/.test(C['musNeighbors'].innerHTML)) throw new Error('neighbours header should appear once a chord is active (here, from the cold-start default)');
  // the cold-start legend invites a choice ("what key do you want to try?") rather than issuing a
  // bare instruction — checked against the static markup itself, since by this point in a real
  // session the cold-start default above has already moved the legend into its warm-state text.
  // Checked twice: the static shell.html copy and the JS re-render branch used to drift apart
  // (one had a leading em-dash, one didn't) — both copies must carry the same new wording now.
  const coldStartCopies = (html.match(/what key do you want to try/ig) || []).length;
  if (coldStartCopies !== 2) throw new Error('expected the cold-start legend text in both the static markup and the JS re-render branch, found ' + coldStartCopies);
  // the info button opens the shared #info panel (already used by Science mode's axis
  // explanation) instead of a blocking native alert()
  C['mInfoBtn'].onclick();
  if (!C['info'].classList.contains('show')) throw new Error('the info button should open the shared #info panel, not call alert()');
  if (!/How to use the circle/.test(C['info'].innerHTML)) throw new Error('the info panel should contain the rewritten, chunked explanation');
  fire(C['info'], 'click', { target: { id: 'infoClose' } });
  if (C['info'].classList.contains('show')) throw new Error('the existing infoClose delegated handler should close the panel regardless of which content is loaded');
  // tap a different note on Musical's own circle of fifths to move the key away from the default
  fire(C['musCof'], 'click', { target: { closest: sel => sel === '.cofNote' ? { dataset: { pc: '7' } } : null } });
  if (__api.View.get().key !== 7) throw new Error('tapping a note on the Musical circle should set the key');
  if (!/cofRing-minor/.test(C['musCof'].innerHTML) || !/cofRing-dim/.test(C['musCof'].innerHTML)) throw new Error('minor/diminished rings did not render on the circle');
  if (!/^Gmaj:\s+G \(root\)/.test(C['musChordLabel'].textContent)) throw new Error('chord-tone label should spell out root/3rd/5th for the tonic triad');
  // tap plays: Chord (default) should sound all 3 notes of the tonic triad, Note should sound just the one
  let oscCount = 0;
  const origCreateOsc = global.window.AudioContext.prototype.createOscillator;
  global.window.AudioContext.prototype.createOscillator = function(){ oscCount++; return origCreateOsc.apply(this, arguments); };
  fire(C['musCof'], 'click', { target: { closest: sel => sel === '.cofNote' ? { dataset: { pc: '0' } } : null } });
  if (oscCount !== 3) throw new Error('Chord tap mode should play all 3 tonic-triad notes, played ' + oscCount);
  fire(C['musTapPills'], 'click', { target: { closest: () => ({ dataset: { k: 'note' }, classList: { toggle(){} } }) } });
  oscCount = 0;
  fire(C['musCof'], 'click', { target: { closest: sel => sel === '.cofNote' ? { dataset: { pc: '7' } } : null } });
  if (oscCount !== 1) throw new Error('Note tap mode should play just the tapped note, played ' + oscCount);
  global.window.AudioContext.prototype.createOscillator = origCreateOsc;
  C['mScaleSel'].value = 'dorian'; C['mScaleSel'].onchange(); frames(5);
  if (__api.View.get().scale !== 'dorian') throw new Error('scale selector did not update state');
  // tapping a ring segment (minor ring, Am = vi of C major) plays that chord and opens the detail card
  fire(C['musCof'], 'click', { target: { closest: sel => sel === '.cofRing' ? { dataset: { ring: 'minor', pc: '9' } } : null } });
  if (!/^Amin:\s+A \(root\)/.test(C['musChordLabel'].textContent)) throw new Error('tapping the minor ring should select that chord');
  // "+ add to progression" sends the active chord into Play's sequencer — the missing piece for
  // building a progression (like recreating a piece) by clicking chords on the circle
  if (C['musAddSeqBtn'].disabled) throw new Error('add-to-progression button should be enabled once a chord is active');
  C['musAddSeqBtn'].onclick();
  if (__api.View.get().mode !== 'play') throw new Error('add-to-progression should hand off into Play');
  if (!/Amin/.test(C['seqSlots'].innerHTML)) throw new Error('the selected chord should land in the sequence');
  fire(C['siteHeaderNav'], 'click', { target: { closest: sel => sel === 'button[data-mode]' ? { dataset: { mode: 'musical' } } : null } });
  frames(5);
  // "where next?" suggestions should follow the newly-selected chord, and clicking one navigates too
  if (!/suggChip/.test(C['musSuggest'].innerHTML)) throw new Error('no "where next" suggestions rendered');
  const suggIdx = C['musSuggest'].innerHTML.match(/data-idx="(\d+)"/)[1];
  const suggName = __api.N[+suggIdx].name;
  fire(C['musSuggest'], 'click', { target: { closest: () => ({ dataset: { idx: suggIdx }, classList: { add(){}, remove(){} } }) } });
  if (!C['musChordLabel'].textContent.startsWith(suggName)) throw new Error('selecting a suggestion should make it the active chord');
  if (!C['musSuggest'].innerHTML.includes(suggName)) throw new Error('suggestions should now be relative to the newly-selected chord');
  // staff engine: a lone treble-only measure should draw a single staff, not a grand staff it doesn't need
  const soloContainer = document.createElement('div');
  __api.Surfaces.get('staff').render(soloContainer, [{ timeSig:[4,4], voices:{ treble:[{ midi:60, dur:'q' }, { rest:true, dur:'q' }, { midi:64, dur:'h' }] } }]);
  if (!/staffClef">treble/.test(soloContainer.innerHTML)) throw new Error('solo staff should render a treble clef');
  if (/staffClef">bass/.test(soloContainer.innerHTML)) throw new Error('a treble-only measure should not draw a grand staff');
  if (!/staffRest/.test(soloContainer.innerHTML)) throw new Error('a rest should render in a solo measure');
  // key signatures: a diatonic scale in a sharp key should carry no inline accidentals at all —
  // only the signature glyphs at the clef account for every sharp/flat in the key
  const sharpScale = document.createElement('div');
  __api.Surfaces.get('staff').render(sharpScale, [{ timeSig:[4,4], voices:{ treble:[62,64,66,67,69,71,73,74].map(midi => ({ midi, dur:'e' })) } }], { keySig:2 });
  const sharpGlyphs = (sharpScale.innerHTML.match(/♯/g) || []).length;
  if (sharpGlyphs !== 2) throw new Error('D major (2 sharps): expected exactly 2 sharp glyphs (the signature, no inline accidentals), got ' + sharpGlyphs);
  const flatScale = document.createElement('div');
  __api.Surfaces.get('staff').render(flatScale, [{ timeSig:[4,4], voices:{ treble:[65,67,69,70,72,74,76,77].map(midi => ({ midi, dur:'e' })) } }], { keySig:-1 });
  const flatGlyphs = (flatScale.innerHTML.match(/♭/g) || []).length;
  if (flatGlyphs !== 1) throw new Error('F major (1 flat): expected exactly 1 flat glyph (the signature, no inline accidentals), got ' + flatGlyphs);
  if (/♯/.test(flatScale.innerHTML)) throw new Error('a flat key should spell its notes with flats, not sharps');
  // a note that cancels the key signature's alteration should show a natural sign, and a note
  // that matches the signature should still carry no inline accidental of its own
  const cancelTest = document.createElement('div');
  __api.Surfaces.get('staff').render(cancelTest, [{ timeSig:[4,4], voices:{ treble:[{ midi:65, dur:'q' }, { midi:66, dur:'q' }, { midi:67, dur:'q' }] } }], { keySig:1 }); // F natural, F#, G in G major
  const cancelSharps = (cancelTest.innerHTML.match(/♯/g) || []).length, cancelNaturals = (cancelTest.innerHTML.match(/♮/g) || []).length;
  if (cancelSharps !== 1) throw new Error('G major (1 sharp): expected exactly 1 sharp glyph (the signature; F# itself is implied), got ' + cancelSharps);
  if (cancelNaturals !== 1) throw new Error('an F natural in G major should show a natural sign to cancel the key signature’s F#, got ' + cancelNaturals + ' naturals');
  // voice-leading arrows: nearest-note pairing from Cmaj to Gmaj should pair C->B (the shared
  // tone G is a hold, not a motion, and gets left out) and E->D, one pair per moving note
  const cIdx = __api.N.findIndex(n => n.root === 0 && n.q === 'maj'), gIdx = __api.N.findIndex(n => n.root === 7 && n.q === 'maj');
  const vlPairs = __api.voiceLeadingPairs(cIdx, gIdx);
  if (vlPairs.length !== 2) throw new Error('Cmaj->Gmaj should produce 2 voice-leading pairs (the shared G is a hold, not a move), got ' + vlPairs.length);
  if (vlPairs.some(p => p.from === 7)) throw new Error('a common tone (G, shared by both chords) should not produce a voice-leading pair');
  if (!vlPairs.some(p => p.from === 0 && p.to === 11)) throw new Error('Cmaj->Gmaj should pair C(0) with its nearest neighbour B(11)');
  if (!vlPairs.some(p => p.from === 4 && p.to === 2)) throw new Error('Cmaj->Gmaj should pair E(4) with its nearest neighbour D(2)');
  if (__api.voiceLeadingPairs(cIdx, cIdx).length !== 0) throw new Error('a chord transitioning to itself should have no voice-leading pairs at all');
  // the standalone example measure (wired at boot, alongside the Bach piece) exercises the engine's
  // range end to end: mixed durations, a rest, a chord event, and a full grand staff
  if (!/staffRest/.test(C['musExampleStaff'].innerHTML)) throw new Error('example measure did not render its rest');
  const exampleNoteCount = (C['musExampleStaff'].innerHTML.match(/class="staffNote"/g) || []).length;
  if (exampleNoteCount !== 8) throw new Error('example measure should render 8 noteheads (3 treble notes + 3-note chord + 2 bass notes), got ' + exampleNoteCount);
  // the two key-signature demo measures (wired at boot alongside the others) should each show
  // just their signature glyphs, no inline accidentals, since every note in them is diatonic
  if ((C['musKeySigSharpStaff'].innerHTML.match(/♯/g) || []).length !== 2) throw new Error('D major demo should show exactly 2 sharp glyphs');
  if ((C['musKeySigFlatStaff'].innerHTML.match(/♭/g) || []).length !== 1) throw new Error('F major demo should show exactly 1 flat glyph');
  // "from the Prelude" examples reuse BACH_PRELUDE[0] verbatim, not a copy — bar 1 is a plain
  // Cmaj triad broken into 8 running eighths (no rest, no stacked chord event) plus 2 bass notes
  if (!/staffChordName[^<]*>Cmaj</.test(C['musPreludeBar1Staff'].innerHTML)) throw new Error('the measure-basics Prelude example should label bar 1 as Cmaj');
  if (/staffRest/.test(C['musPreludeBar1Staff'].innerHTML)) throw new Error('bar 1 of the Prelude has no rests — the hand-built example above it is what demonstrates rests');
  const preludeBar1Notes = (C['musPreludeBar1Staff'].innerHTML.match(/class="staffNote"/g) || []).length;
  if (preludeBar1Notes !== 10) throw new Error('bar 1 should render 10 noteheads (8 running treble eighths + 2 bass halves), got ' + preludeBar1Notes);
  if ((C['musKeySigNaturalStaff'].innerHTML.match(/[♯♭]/g) || []).length !== 0) throw new Error('the Prelude-in-C key-signature example should show no sharps or flats at all — that\'s its whole point');
  // interval visualizer: a fresh render for a known pair should name the interval and show its ratio
  const p5 = document.createElement('div');
  __api.Surfaces.get('interval').render(p5, { a:0, b:7 });
  if (!/Perfect 5th/.test(p5.innerHTML)) throw new Error('C -> G should be identified as a Perfect 5th');
  if (!/3:2/.test(p5.innerHTML)) throw new Error('a Perfect 5th should show its 3:2 ratio');
  const m2 = document.createElement('div');
  __api.Surfaces.get('interval').render(m2, { a:0, b:1 });
  if (!/Minor 2nd/.test(m2.innerHTML)) throw new Error('C -> C# should be identified as a Minor 2nd');
  if (!/16:15/.test(m2.innerHTML)) throw new Error('a Minor 2nd should show its 16:15 ratio');
  // vertical orientation: same interval, a stacked (staff-like) layout instead of the horizontal
  // (piano-like) one — same name/ratio, different SVG class
  const p5vert = document.createElement('div');
  __api.Surfaces.get('interval').render(p5vert, { a:0, b:7, orientation:'vertical' });
  if (!/ivSvg-vert/.test(p5vert.innerHTML)) throw new Error('orientation:"vertical" should render the stacked layout');
  if (!/Perfect 5th/.test(p5vert.innerHTML)) throw new Error('vertical orientation should still identify the interval correctly');
  if (/ivSvg-vert/.test(p5.innerHTML)) throw new Error('the default (horizontal) render should not carry the vertical class');
  // the note selects (wired at boot alongside the others) should default to a fifth apart, and
  // changing one should re-render the diagram for the new pair
  if (C['ivNoteA'].innerHTML.match(/<option/g).length !== 12 || C['ivNoteB'].innerHTML.match(/<option/g).length !== 12) throw new Error('interval note selects should list all 12 notes');
  if (!/Perfect 5th/.test(C['musInterval'].innerHTML)) throw new Error('interval visualizer should default to C -> G, a Perfect 5th');
  C['ivNoteB'].value = '4'; C['ivNoteB'].onchange();
  if (!/Major 3rd/.test(C['musInterval'].innerHTML)) throw new Error('changing a note select should re-render the interval diagram');
  C['ivNoteB'].value = '7'; C['ivNoteB'].onchange(); // restore the default pairing for anything downstream
  // the orientation pills (wired at boot) should default to horizontal and switch on click
  if (/ivSvg-vert/.test(C['musInterval'].innerHTML)) throw new Error('interval visualizer should default to the horizontal layout');
  fire(C['ivOrientPills'], 'click', { target: { closest: () => ({ dataset: { k: 'vertical' }, classList: { toggle(){} } }) } });
  if (!/ivSvg-vert/.test(C['musInterval'].innerHTML)) throw new Error('selecting "Vertical (staff)" should switch to the stacked layout');
  fire(C['ivOrientPills'], 'click', { target: { closest: () => ({ dataset: { k: 'horizontal' }, classList: { toggle(){} } }) } }); // restore the default
  let ivOscCount = 0;
  const origIvCreateOsc = global.window.AudioContext.prototype.createOscillator;
  global.window.AudioContext.prototype.createOscillator = function(){ ivOscCount++; return origIvCreateOsc.apply(this, arguments); };
  C['ivPlayBtn'].onclick();
  global.window.AudioContext.prototype.createOscillator = origIvCreateOsc;
  if (ivOscCount !== 2) throw new Error('"hear it" should play both notes of the interval, played ' + ivOscCount);
  // "from the Prelude" interval quick-picks reuse selectLesson()'s existing seed branch — clicking
  // one should seed the same a/b select boxes and re-render, exactly like the cross-link buttons do
  fire(C['ivPreludePicks'], 'click', { target: { closest: () => ({ dataset: { a: '11', b: '5' } }) } });
  if (+C['ivNoteA'].value !== 11 || +C['ivNoteB'].value !== 5) throw new Error('the tritone quick-pick should seed B (11) -> F (5)');
  if (!/Tritone/.test(C['musInterval'].innerHTML)) throw new Error('B -> F should render as a Tritone, the interval hiding inside the Prelude\'s bar-3 G7');
  C['ivNoteA'].value = '0'; C['ivNoteB'].value = '7'; C['ivNoteB'].onchange(); // restore the default pairing for anything downstream
  // chord superstructure: a triad (upTo:3) lights exactly 3 nodes and leaves the rest dim
  const ssMajor = document.createElement('div');
  __api.Surfaces.get('superstructure').render(ssMajor, { root:0, quality:'major', upTo:3 });
  const ssMajorLit = (ssMajor.innerHTML.match(/class="ssNode"/g) || []).length, ssMajorDim = (ssMajor.innerHTML.match(/ssNode-dim/g) || []).length;
  if (ssMajorLit !== 3) throw new Error('a triad (upTo:3) should light exactly 3 nodes, got ' + ssMajorLit);
  if (ssMajorDim !== 4) throw new Error('a triad (upTo:3) should leave exactly 4 nodes dim (7th/9th/11th/13th), got ' + ssMajorDim);
  if (!/>E</.test(ssMajor.innerHTML)) throw new Error('a major stack on C should include E as its 3rd');
  const ssFull = document.createElement('div');
  __api.Surfaces.get('superstructure').render(ssFull, { root:0, quality:'major', upTo:7 });
  if ((ssFull.innerHTML.match(/ssNode-dim/g) || []).length !== 0) throw new Error('upTo:7 (a 13th chord) should leave nothing dim');
  const ssMinor = document.createElement('div');
  __api.Surfaces.get('superstructure').render(ssMinor, { root:0, quality:'minor', upTo:4 });
  if (!/>D#</.test(ssMinor.innerHTML)) throw new Error('a minor stack on C should include D# (the minor 3rd), not E');
  // the superstructure controls (wired at boot) should default to a triad and respond to the extend pills
  if ((C['musSuperstructure'].innerHTML.match(/class="ssNode"/g) || []).length !== 3) throw new Error('superstructure should default to a triad (3 lit nodes)');
  fire(C['ssExtendPills'], 'click', { target: { closest: () => ({ dataset: { k: '7' }, classList: { toggle(){} } }) } });
  if ((C['musSuperstructure'].innerHTML.match(/ssNode-dim/g) || []).length !== 0) throw new Error('selecting 13th should light every node in the stack');
  fire(C['ssExtendPills'], 'click', { target: { closest: () => ({ dataset: { k: '3' }, classList: { toggle(){} } }) } }); // restore the default for anything downstream
  // "from the Prelude" extension quick-picks, same seed reuse: bar 2 (Dm7, ii7) is a minor stack
  // upTo:4, not a triad — proves the pick actually drives quality and upTo, not just the root
  fire(C['ssPreludePicks'], 'click', { target: { closest: () => ({ dataset: { root: '2', q: 'minor', upto: '4' } }) } });
  if (+C['ssRootSel'].value !== 2) throw new Error('the "bar 2: Dm7" quick-pick should seed the superstructure root to D (2)');
  if (!/>F</.test(C['musSuperstructure'].innerHTML)) throw new Error('Dm7 is a minor stack — should include F (D\'s minor 3rd), not F#');
  if ((C['musSuperstructure'].innerHTML.match(/ssNode-dim/g) || []).length !== 3) throw new Error('the "bar 2: Dm7" quick-pick should seed upTo:4 (7th), leaving the 9th/11th/13th dim');
  fire(C['ssPreludePicks'], 'click', { target: { closest: () => ({ dataset: { root: '0', q: 'major', upto: '3' } }) } }); // restore the default for anything downstream
  // triad quality comparison: major/sus2/sus4/dim/aug on the same root, each row a triad (3 dots)
  const tq = document.createElement('div');
  __api.Surfaces.get('triadquality').render(tq, { root:0 });
  if ((tq.innerHTML.match(/class="tqRow"/g) || []).length !== 5) throw new Error('triad quality surface should draw 5 rows (major, sus2, sus4, dim, aug)');
  if ((tq.innerHTML.match(/class="tqDot"/g) || []).length !== 15) throw new Error('5 triads of 3 notes each should draw 15 dots, got ' + (tq.innerHTML.match(/class="tqDot"/g) || []).length);
  if (!/>D#</.test(tq.innerHTML)) throw new Error('diminished on C should include D# (its minor 3rd)');
  if (!/>F#</.test(tq.innerHTML)) throw new Error('diminished on C should include F# (its flat 5th, spelled as the tritone)');
  if (!/>G#</.test(tq.innerHTML)) throw new Error('augmented on C should include G# (its sharp 5th)');
  if (!/>D</.test(tq.innerHTML)) throw new Error('sus2 on C should include D (a major 2nd, standing in for the 3rd)');
  if (!/>F</.test(tq.innerHTML)) throw new Error('sus4 on C should include F (a perfect 4th, standing in for the 3rd)');
  // ghost markers show where the major triad's 3rd/5th sit, on every row that replaces one of them —
  // major itself has none; sus2/sus4/aug each swap one tone (1 ghost each); dim swaps both (2 ghosts)
  if ((tq.innerHTML.match(/class="tqGhost"/g) || []).length !== 5) throw new Error('sus2+sus4+aug (1 ghost each) plus dim (2 ghosts) should total 5, got ' + (tq.innerHTML.match(/class="tqGhost"/g) || []).length);
  // ratio wheel: the circle of fifths reshaped so distance from the centre is consonance with a
  // chosen root (reusing intervalConsonance — the same ratio-simplicity read the interval
  // visualizer already uses). The root itself should sit nearest the centre; C# (a minor 2nd away,
  // the least consonant interval in RATIO) should sit out near the rim.
  const rw = document.createElement('div');
  __api.Surfaces.get('ratiowheel').render(rw, { root: 0 });
  if ((rw.innerHTML.match(/class="cofNote ratioNote"/g) || []).length !== 12) throw new Error('ratio wheel should draw all 12 notes');
  if ((rw.innerHTML.match(/class="ratioSpoke"/g) || []).length !== 12) throw new Error('ratio wheel should draw 12 spokes, one per note');
  function rwDist(html, pc){
    const m = html.match(new RegExp('data-pc="'+pc+'"[^>]*><circle cx="([\\d.]+)" cy="([\\d.]+)"'));
    if (!m) throw new Error('could not find note ' + pc + ' in the ratio wheel output');
    return Math.hypot(+m[1]-150, +m[2]-150);
  }
  const rwRootDist = rwDist(rw.innerHTML, 0), rwFarDist = rwDist(rw.innerHTML, 1);
  if (rwRootDist > 25) throw new Error('the root note should sit close to the centre, got a distance of ' + rwRootDist);
  if (rwFarDist < 100) throw new Error('C# (a minor 2nd from C) should sit near the rim, got a distance of ' + rwFarDist);
  if (rwRootDist >= rwFarDist) throw new Error('the root should sit closer to the centre than a dissonant note, got root=' + rwRootDist + ' far=' + rwFarDist);
  // neighbouring chords: systematic proximity, not a ranked recommendation — Am (shares C and E
  // with Cmaj) should show up, the chord itself never should, and the list stays capped/tagged
  const nbList = __api.neighboringChords(cIdx);
  if (nbList.some(o => o.b === cIdx)) throw new Error('neighboringChords should never include the chord itself');
  if (nbList.some(o => __api.N[o.b].root === __api.N[cIdx].root)) throw new Error('neighboringChords should exclude same-root variants (Cmaj7, C7, ...) — that\'s decorating the same chord, not a neighbour');
  const eminIdx = __api.N.findIndex(n => n.root === 4 && n.q === 'min');
  if (!nbList.some(o => o.b === eminIdx)) throw new Error('Emin (shares E and G with Cmaj) should show up as a neighbouring chord');
  if (nbList.length > 8) throw new Error('neighboringChords should cap its list at 8, got ' + nbList.length);
  if (nbList.some(o => !o.tag)) throw new Error('every neighbouring-chord entry should carry an explanatory tag');
  if (!C['musNeighbors'].innerHTML) throw new Error('the neighbours panel should be populated once a chord is active');
  // context-aware cross-links: jumping from a chord's detail card into the Lessons tools should
  // seed them with THIS chord instead of always resetting to the tools' own hardcoded example —
  // Bdim (root B, quality 'dim') has no plain perfect 5th (its "5th" is a tritone), proving
  // bestFifthIv() actually picks the interval that's really in the chord, not just interval 7
  fire(C['musCof'], 'click', { target: { closest: sel => sel === '.cofRing' ? { dataset: { ring: 'dim', pc: '11' } } : null } });
  fire(C['detail'], 'click', { target: { closest: () => ({ dataset: { act: 'intervals-link' } }) } });
  if (__api.View.get().mode !== 'lessons') throw new Error('the "intervals" cross-link should switch to Lessons mode');
  if (!/Tritone/.test(C['musInterval'].innerHTML)) throw new Error('Bdim should seed the interval visualizer with B -> F, a Tritone (not a nonexistent perfect 5th), got: ' + C['musInterval'].innerHTML);
  fire(C['siteHeaderNav'], 'click', { target: { closest: sel => sel === 'button[data-mode]' ? { dataset: { mode: 'musical' } } : null } });
  frames(5);
  fire(C['musCof'], 'click', { target: { closest: sel => sel === '.cofRing' ? { dataset: { ring: 'dim', pc: '11' } } : null } });
  fire(C['detail'], 'click', { target: { closest: () => ({ dataset: { act: 'extend-link' } }) } });
  if (__api.View.get().mode !== 'lessons') throw new Error('the "extend" cross-link should switch to Lessons mode');
  if (+C['ssRootSel'].value !== 11) throw new Error('extend-link should seed the superstructure root to B (11), got ' + C['ssRootSel'].value);
  if ((C['musSuperstructure'].innerHTML.match(/class="ssNode"/g) || []).length !== 3) throw new Error('Bdim is a triad (3 notes) — extend-link should seed upTo:3');
  fire(C['siteHeaderNav'], 'click', { target: { closest: sel => sel === 'button[data-mode]' ? { dataset: { mode: 'musical' } } : null } });
  frames(5);
  // piano roll: one rect per note event, reusing exactly the staff engine's measure data shape
  const rollTest = document.createElement('div');
  __api.Surfaces.get('pianoroll').render(rollTest, [{ timeSig:[4,4], voices:{ treble:[{ midi:60, dur:'q' }, { midi:64, dur:'q' }], bass:[{ midi:48, dur:'h' }] } }]);
  const rollNoteCount = (rollTest.innerHTML.match(/class="rollNote"/g) || []).length;
  if (rollNoteCount !== 3) throw new Error('piano roll should render one bar per note event, got ' + rollNoteCount);
  // the Bach piano roll (wired at boot alongside the staff view) renders the whole 35-bar passage
  const bachRollCount = (C['musPianoRoll'].innerHTML.match(/class="rollNote"/g) || []).length;
  if (bachRollCount !== 350) throw new Error('Bach piano roll should render 350 note bars (35 bars x (8 treble + 2 bass)), got ' + bachRollCount);
  // colour toggle: black & white by default, one click recolours every staff surface on the page
  if (document.body.classList.contains('staffColor')) throw new Error('colour mode should default off');
  fire(C['staffColorPills'], 'click', { target: { closest: () => ({ dataset: { k: 'color' } }) } });
  if (!document.body.classList.contains('staffColor')) throw new Error('toggling the colour pill should switch to colour mode');
  fire(C['staffColorPills'], 'click', { target: { closest: () => ({ dataset: { k: 'bw' } }) } });
  if (document.body.classList.contains('staffColor')) throw new Error('toggling back should restore black & white');
  // Bach prelude: starting playback resets to C major, builds the staff, and plays/highlights the first note
  C['musBachPlay'].onclick();
  if (__api.View.get().key !== 0 || __api.View.get().scale !== 'major') throw new Error('starting the Bach demo should reset to C major');
  if (!/staffNote/.test(C['musStaff'].innerHTML)) throw new Error('Bach demo did not render the staff');
  if (!/^Cmaj:\s+C \(root\)/.test(C['musChordLabel'].textContent)) throw new Error('Bach demo should show bar 1 (Cmaj) on the circle');
  if (!/bar 1\/35/.test(C['musBachPlay'].textContent)) throw new Error('play button should show playback progress');
  C['musBachPlay'].onclick(); // stop
  if (!/^▶ Bach/.test(C['musBachPlay'].textContent)) throw new Error('stopping should restore the play button label');
  // Bach playback engine (setTimeout-chained note sequencer, see 97_bach_prelude.js) —
  // characterization tests for the Tier-3 audit's note-sequencing-engine investigation, driven
  // via the harness's __fireTimeout hook (mirrors the existing __raf hook) since real timers
  // never fire in this headless run
  let bachOsc = 0;
  const origBachOsc = global.window.AudioContext.prototype.createOscillator;
  global.window.AudioContext.prototype.createOscillator = function(){ bachOsc++; return origBachOsc.apply(this, arguments); };
  __api.stopBach(); // guarantee a clean slate regardless of the manual start/stop above
  bachOsc = 0;
  __api.startBach(); // synchronously runs step() once: bar 1, event 0 (a bar boundary -> bass + treble)
  let st = __api.getBachState();
  if (st.bachPos !== 1) throw new Error('starting Bach should synchronously process the first note event, bachPos should be 1, got ' + st.bachPos);
  if (st.bachTimer == null) throw new Error('starting Bach should schedule the next step via setTimeout');
  if (bachOsc !== 2) throw new Error('bar-boundary event (ei=0) should play bass + treble = 2 oscillators, played ' + bachOsc);
  bachOsc = 0;
  global.__fireTimeout(); // event 1 (ei=1, mid-bar) -> treble only
  st = __api.getBachState();
  if (st.bachPos !== 2) throw new Error('firing the scheduled timeout should advance bachPos by exactly 1, got ' + st.bachPos);
  if (bachOsc !== 1) throw new Error('a mid-bar event (ei=1) should play treble only = 1 oscillator, played ' + bachOsc);
  bachOsc = 0;
  global.__fireTimeout(); // ei=2
  global.__fireTimeout(); // ei=3
  bachOsc = 0;
  global.__fireTimeout(); // event 4 (ei=4, the bar's second bass restrike) -> bass + treble again
  if (bachOsc !== 2) throw new Error('the bar\'s second bass restrike (ei=4) should also play bass + treble = 2 oscillators, played ' + bachOsc);
  // stop mid-playback: timer/position/button all reset, not just the timer
  global.__fireTimeout(); global.__fireTimeout(); // a couple more steps into the piece
  __api.stopBach();
  st = __api.getBachState();
  if (st.bachTimer !== null) throw new Error('stopBach should clear the pending timer');
  if (st.bachPos !== 0) throw new Error('stopBach should reset playback position to 0');
  if (!/^▶ Bach/.test(C['musBachPlay'].textContent)) throw new Error('stopBach mid-playback should restore the play button label');
  // natural completion: driving every remaining event to the end should self-stop without an
  // explicit stopBach() call (step() calls it internally once bachPos reaches bachFlat.length)
  __api.startBach();
  const totalEvents = __api.getBachState().bachFlatLen;
  if (totalEvents !== 280) throw new Error('Bach prelude should flatten to 35 bars x 8 treble events = 280, got ' + totalEvents);
  for (let i = 0; i < totalEvents; i++) global.__fireTimeout(); // 1 already ran synchronously in startBach; this walks past the end
  st = __api.getBachState();
  if (st.bachTimer !== null || st.bachPos !== 0) throw new Error('reaching the end of the piece should self-stop (bachTimer null, bachPos reset to 0) with no explicit stop call');
  // single-active-instance guard: starting again while "running" should cleanly reset, not race
  // a second setTimeout chain alongside the first
  __api.startBach();
  global.__fireTimeout(); global.__fireTimeout();
  __api.startBach(); // should stop the in-flight chain and begin a fresh one
  st = __api.getBachState();
  if (st.bachPos !== 1) throw new Error('restarting Bach mid-playback should begin a fresh run (bachPos 1), not continue the old chain, got ' + st.bachPos);
  __api.stopBach();
  global.window.AudioContext.prototype.createOscillator = origBachOsc;
  // Progression playback engine (continuous rAF/dt tween, see 45_progression.js) — the other
  // half of the Tier-3 audit's note-sequencing-engine investigation. advanceProg(dt) is driven
  // directly with controlled dt values instead of via the real frame loop, so segment crossings
  // land on exact, assertable boundaries.
  __api.stopProg(); // guarantee a clean slate regardless of any earlier seqPlay-driven playback
  const progA = __api.N.findIndex(n => n.root === 0 && n.q === 'maj'); // C major
  const progB = __api.N.findIndex(n => n.root === 7 && n.q === 'maj'); // G major
  let progOsc = 0;
  const origProgOsc = global.window.AudioContext.prototype.createOscillator;
  global.window.AudioContext.prototype.createOscillator = function(){ progOsc++; return origProgOsc.apply(this, arguments); };
  progOsc = 0;
  __api.startProg([progA, progB], false); // plays the first chord immediately on start
  if (progOsc !== __api.N[progA].freqs.length) throw new Error('starting a progression should immediately play the first chord (' + __api.N[progA].freqs.length + ' notes), played ' + progOsc);
  if (__api.getProg().seg !== 0) throw new Error('a fresh progression should start at segment 0');
  progOsc = 0;
  __api.advanceProg(0.1); // well under segDur (0.7s default) -- should NOT cross into the next segment
  if (__api.getProg().seg !== 0) throw new Error('advanceProg with dt well under segDur should not cross a segment boundary');
  if (progOsc !== 0) throw new Error('a mid-segment frame should not trigger any new note (audio only fires on arrival), played ' + progOsc);
  __api.advanceProg(1.0); // pushes t past 1 regardless of remaining progress -- crosses into segment 1 and arrives
  if (__api.getProg().seg !== 1) throw new Error('advanceProg should cross into segment 1 once t reaches 1');
  if (progOsc !== __api.N[progB].freqs.length) throw new Error('crossing into a new segment should play exactly that chord\'s notes (' + __api.N[progB].freqs.length + '), played ' + progOsc);
  // natural completion: holding at the final segment for over 1s should self-stop via stopProg()
  __api.advanceProg(0.5); __api.advanceProg(0.6); // hold > 1.0s total at the last segment
  if (__api.getProg() !== null) throw new Error('holding past the final segment for over 1s should self-stop the progression');
  if (__api.meteor.visible) throw new Error('natural completion should hide the meteor');
  // loop: the same hold-past-completion path should restart instead of nulling out when loop=true
  __api.startProg([progA, progB], true);
  __api.advanceProg(1.0); // arrive at segment 1
  __api.advanceProg(0.5); __api.advanceProg(0.6); // hold past completion
  if (__api.getProg() === null) throw new Error('a looping progression should restart on completion, not stop');
  if (__api.getProg().seg !== 0) throw new Error('looping should restart back at segment 0');
  // seqStop parity: the compose sequencer's Stop button and natural completion must reach the
  // identical end-state -- the actual regression check for extracting stopProg() out of both
  // call sites (45_progression.js's advanceProg completion branch, 75_compose.js's seqStop handler)
  __api.startProg([progA, progB], false);
  C['seqStop'].onclick();
  if (__api.getProg() !== null) throw new Error('the seqStop button should clear the active progression');
  if (__api.meteor.visible) throw new Error('the seqStop button should hide the meteor, matching natural completion\'s end-state');
  global.window.AudioContext.prototype.createOscillator = origProgOsc;
  // Lessons mode: a 4th top-level surface for the standalone teaching demos only (Bach and
  // neighbouring chords stay in Musical mode since they depend on its live chord-selection state)
  fire(C['siteHeaderNav'], 'click', { target: { closest: sel => sel === 'button[data-mode]' ? { dataset: { mode: 'lessons' } } : null } });
  frames(5);
  if (__api.View.get().mode !== 'lessons') throw new Error('Lessons tab did not activate');
  if (C['lessonsHome'].style.display === 'none') throw new Error('Lessons mode should show #lessonsHome');
  if (C['musicalHome'].style.display !== 'none') throw new Error('Lessons mode should hide #musicalHome');
  if (C['scene'].style.display !== 'none') throw new Error('Lessons mode should hide the 3D map, same as Musical');
  // ---- Lessons concept intro: scroll-driven single note -> solfège scale -> note durations ----
  // direct-render checks first (pure function, scratch container), same convention as Science's
  // renderSciWaveContinuum unit checks before the live scroll wiring is exercised
  const lessonsDoStaff = document.createElement('div'), lessonsDoCap = document.createElement('div');
  __api.renderScrollLessonStage(lessonsDoStaff, lessonsDoCap, __api.NOTES_AND_BEATS_LESSON, 0);
  if ((lessonsDoStaff.innerHTML.match(/class="staffNote"/g) || []).length !== 1) throw new Error('t=0 should render a single note — the "start with a single note" moment');
  if (!/sciCaptionBright">DO/.test(lessonsDoCap.innerHTML)) throw new Error('t=0 should show the DO caption');
  const lessonsFaStaff = document.createElement('div'), lessonsFaCap = document.createElement('div');
  __api.renderScrollLessonStage(lessonsFaStaff, lessonsFaCap, __api.NOTES_AND_BEATS_LESSON, 3 / 12 + 0.01);
  if ((lessonsFaStaff.innerHTML.match(/class="staffNote"/g) || []).length !== 4) throw new Error('the 4th solfège step should show the scale built up to 4 notes (do re mi fa)');
  if (!/sciCaptionBright">FA/.test(lessonsFaCap.innerHTML)) throw new Error('the 4th solfège step should show the FA caption');
  const lessonsEighthStaff = document.createElement('div'), lessonsEighthCap = document.createElement('div');
  __api.renderScrollLessonStage(lessonsEighthStaff, lessonsEighthCap, __api.NOTES_AND_BEATS_LESSON, 0.99);
  if ((lessonsEighthStaff.innerHTML.match(/class="staffNote"/g) || []).length !== 1) throw new Error('the last beat step should render a single note (pitch fixed, only duration changes)');
  if (!/sciCaptionBright">EIGHTH NOTE/.test(lessonsEighthCap.innerHTML)) throw new Error('t=0.99 should show the EIGHTH NOTE caption');
  // the concept intro is the default landing stage — the card grid stays hidden until "explore" is chosen
  if (C['lessonsIntro'].style.display === 'none') throw new Error('Lessons mode should land on the notes & beats intro, not the card grid');
  if (C['lessonsGrid'].style.display !== 'none') throw new Error('the card grid should stay hidden until "Explore all lessons" is chosen');
  if (C['lessonsHome'].scrollTop !== 0) throw new Error('a fresh entry into Lessons should start scrolled to the top');
  // live scroll wiring: a real scroll event should advance the stage and sound exactly one note
  // per step change (RANGE_PX 2400 / 12 steps = 200px each), not once per pixel scrolled
  let lessonsOscCount = 0;
  const origLessonsCreateOsc = global.window.AudioContext.prototype.createOscillator;
  global.window.AudioContext.prototype.createOscillator = function(){ lessonsOscCount++; return origLessonsCreateOsc.apply(this, arguments); };
  C['lessonsHome'].scrollTop = 200; // exactly 1 step in
  fire(C['lessonsHome'], 'scroll', {});
  global.window.AudioContext.prototype.createOscillator = origLessonsCreateOsc;
  if (lessonsOscCount !== 1) throw new Error('scrolling into the next solfège step should sound exactly one note, played ' + lessonsOscCount);
  if (!/sciCaptionBright">RE/.test(C['lessonsStageCaption'].innerHTML)) throw new Error('scrolling 200px (1 step) should advance the caption to RE');
  // "Explore all lessons" reveals the existing card grid, unchanged
  C['lessonsExploreCta'].onclick();
  if (C['lessonsIntro'].style.display === '') throw new Error('"Explore all lessons" should hide the concept intro');
  if (C['lessonsGrid'].style.display === 'none') throw new Error('"Explore all lessons" should reveal the card grid');
  if (__api.View.get().mode !== 'lessons') throw new Error('"Explore all lessons" should not leave Lessons mode');
  // "back to notes & beats" returns to the intro without leaving Lessons mode
  C['lessonsBackConceptBtn'].onclick();
  if (C['lessonsIntro'].style.display === 'none') throw new Error('"back to notes & beats" should return to the concept intro');
  if (__api.View.get().mode !== 'lessons') throw new Error('"back to notes & beats" should not leave Lessons mode');
  C['lessonsExploreCta'].onclick(); // back to the grid for the existing lesson-card tests below
  if (!/lessonCard/.test(C['lessonNav'].innerHTML)) throw new Error('lesson nav should render lesson cards');
  fire(C['lessonNav'], 'click', { target: { closest: sel => sel === '.lessonCard' ? { dataset: { lesson: 'intervals' } } : null } });
  if (!C['musInterval'].innerHTML) throw new Error('selecting the intervals lesson should still have its mount point populated (wired at boot)');
  fire(C['lessonNav'], 'click', { target: { closest: sel => sel === '.lessonCard' ? { dataset: { lesson: 'triad-qualities' } } : null } });
  if ((C['musTriadQuality'].innerHTML.match(/class="tqRow"/g) || []).length !== 5) throw new Error('the triad-qualities lesson mount point should be wired at boot with all 5 rows');
  C['tqRootSel'].value = '2'; C['tqRootSel'].onchange(); // D
  if (!/>F#</.test(C['musTriadQuality'].innerHTML)) throw new Error('changing the root select should re-render the diagram for the new root (D major should show F#)');
  C['tqRootSel'].value = '0'; C['tqRootSel'].onchange(); // restore the default for anything downstream
  let tqOscCount = 0;
  const origTqCreateOsc = global.window.AudioContext.prototype.createOscillator;
  global.window.AudioContext.prototype.createOscillator = function(){ tqOscCount++; return origTqCreateOsc.apply(this, arguments); };
  fire(C['musTriadQuality'], 'click', { target: { closest: sel => sel === '.tqRow' ? { dataset: { q: 'dim' } } : null } });
  global.window.AudioContext.prototype.createOscillator = origTqCreateOsc;
  if (tqOscCount !== 3) throw new Error('tapping a row should play all 3 notes of that triad, played ' + tqOscCount);
  fire(C['lessonNav'], 'click', { target: { closest: sel => sel === '.lessonCard' ? { dataset: { lesson: 'ratio-wheel' } } : null } });
  if ((C['musRatioWheel'].innerHTML.match(/class="cofNote ratioNote"/g) || []).length !== 12) throw new Error('the ratio-wheel lesson mount point should be wired at boot with all 12 notes');
  C['rwRootSel'].value = '7'; C['rwRootSel'].onchange(); // G
  if (rwDist(C['musRatioWheel'].innerHTML, 7) > 25) throw new Error('changing the root select should re-render the wheel so the new root (G) sits near the centre');
  C['rwRootSel'].value = '0'; C['rwRootSel'].onchange(); // restore the default for anything downstream
  let rwOscCount = 0;
  const origRwCreateOsc = global.window.AudioContext.prototype.createOscillator;
  global.window.AudioContext.prototype.createOscillator = function(){ rwOscCount++; return origRwCreateOsc.apply(this, arguments); };
  fire(C['musRatioWheel'], 'click', { target: { closest: sel => sel === '.cofNote' ? { dataset: { pc: '7' } } : null } });
  global.window.AudioContext.prototype.createOscillator = origRwCreateOsc;
  if (rwOscCount !== 1) throw new Error('tapping a note should play it, played ' + rwOscCount);
  // ---- Library: click-to-launch links for every one-off tool/demo in the app ----
  if ((C['libraryNav'].innerHTML.match(/class="lessonCard"/g) || []).length !== 8) throw new Error('the library nav should render all 8 tool cards');
  fire(C['libraryNav'], 'click', { target: { closest: sel => sel === '.lessonCard' ? { dataset: { tool: 'ripple-room' } } : null } });
  if (!__api.isRippleRoomOpen()) throw new Error('the ripple-room library card should open the ripple room');
  __api.hideRipple(); // close it again so it doesn't linger into later tests
  fire(C['libraryNav'], 'click', { target: { closest: sel => sel === '.lessonCard' ? { dataset: { tool: 'waveform' } } : null } });
  if (__api.View.get().mode !== 'science') throw new Error('the waveform library card should switch to Science mode');
  if (C['scene'].style.display === 'none') throw new Error('the waveform library card should land on Science\'s explore stage, not the concept page');
  if (!C['wave'].classList.contains('show')) throw new Error('the waveform library card should open the wave panel');
  C['waveClose'].onclick();
  fire(C['siteHeaderNav'], 'click', { target: { closest: sel => sel === 'button[data-mode]' ? { dataset: { mode: 'lessons' } } : null } });
  frames(5);
  fire(C['libraryNav'], 'click', { target: { closest: sel => sel === '.lessonCard' ? { dataset: { tool: 'tonnetz' } } : null } });
  if (__api.getLayoutName() !== 'tonnetz') throw new Error('the tonnetz library card should switch the layout to tonnetz');
  clk(C['layoutPills'], { k: 'disc' }); // restore the default for anything downstream
  fire(C['siteHeaderNav'], 'click', { target: { closest: sel => sel === 'button[data-mode]' ? { dataset: { mode: 'lessons' } } : null } });
  frames(5);
  // ---- Piano tool: standalone keyboard + score + analysis (98_piano_tool.js) ----
  // launching from the Library, from Lessons mode, proves it never touches switchMode/View —
  // it's an overlay, not a mode, so the underlying mode should be completely undisturbed by it
  if (__api.isPianoToolBuilt()) throw new Error('the piano tool should not be built until first opened');
  fire(C['libraryNav'], 'click', { target: { closest: sel => sel === '.lessonCard' ? { dataset: { tool: 'piano' } } : null } });
  if (!__api.isPianoToolBuilt()) throw new Error('opening the piano library card should lazily build the tool');
  if (C['pianoTool'].style.display !== 'block') throw new Error('the piano tool overlay should be visible once opened');
  if (__api.View.get().mode !== 'lessons') throw new Error('opening the piano tool should not change the current mode -- it is a standalone overlay, not a mode');
  const pianoKey = pc => fire(C['pianoKeyboard'], 'click', { target: { closest: () => ({ dataset: { pc: String(pc) }, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } } }) } });
  pianoKey(0); pianoKey(4); pianoKey(7); // C then E then G, in that press order -- Cmaj, root position
  if (!/C \+ E \+ G/.test(C['pianoReadout'].textContent) || !/Cmaj/.test(C['pianoReadout'].textContent)) throw new Error('the piano readout should recognise C+E+G as Cmaj, got: ' + C['pianoReadout'].textContent);
  if (C['pianoAddBtn'].disabled) throw new Error('the add-to-score button should enable once a chord is recognised');
  if (!/staffNote/.test(C['pianoStaff'].innerHTML)) throw new Error('snapshot mode should render the held chord onto the staff');
  if (!C['pianoFnOut'].innerHTML.includes('I in C Major') || !C['pianoFnOut'].innerHTML.includes('tonic')) throw new Error('Cmaj in the default C major key should show as roman numeral I, tonic, got: ' + C['pianoFnOut'].innerHTML);
  if (!C['pianoInversionOut'].innerHTML.includes('root position')) throw new Error('C+E+G pressed in that order should read as root position (C is the first-pressed, lowest note)');
  if (C['pianoIntervals'].children.length !== 2) throw new Error('a triad should show 2 root-relative intervals (3rd, 5th), got ' + C['pianoIntervals'].children.length);
  // release C+E+G, then build Gmaj to exercise voice-leading-from-the-last-chord
  pianoKey(0); pianoKey(4); pianoKey(7);
  if (__api.getPianoLastChordIdx() == null) throw new Error('playing a recognised chord should record it as the last chord');
  const cmajIdx = __api.getPianoLastChordIdx();
  pianoKey(7); pianoKey(11); pianoKey(2); // G then B then D -- Gmaj
  if (!/Gmaj/.test(C['pianoReadout'].textContent)) throw new Error('G+B+D should be recognised as Gmaj');
  if (!C['pianoVlOut'].innerHTML.includes('Cmaj') || !C['pianoVlOut'].innerHTML.includes('Gmaj')) throw new Error('the voice-leading panel should compare the new chord (Gmaj) to the last one (Cmaj), got: ' + C['pianoVlOut'].innerHTML);
  if (__api.getPianoLastChordIdx() === cmajIdx) throw new Error('a new, different recognised chord should update the last-chord tracker');
  // transcribe mode: a manual "+ add to score" commits the current chord as a new measure
  fire(C['pianoScoreModePills'], 'click', { target: { closest: () => ({ dataset: { mode: 'transcribe' } }) } });
  if (__api.getPianoScoreMode() !== 'transcribe') throw new Error('the score-mode pill should switch to transcribe');
  if (C['pianoScoreActions'].style.display === 'none') throw new Error('transcribe mode should reveal the add/clear score actions');
  C['pianoAddBtn'].onclick();
  if (__api.getPianoScoreLength() !== 1) throw new Error('add-to-score should append one measure, got ' + __api.getPianoScoreLength());
  if (!/staffNote/.test(C['pianoStaff'].innerHTML) || !/Gmaj/.test(C['pianoStaff'].innerHTML)) throw new Error('the transcribed score should render the committed Gmaj measure');
  C['pianoClearScoreBtn'].onclick();
  if (__api.getPianoScoreLength() !== 0) throw new Error('clear-score should empty the transcription');
  // key/scale selectors drive the roman-numeral panel independently of the app's global keyRoot
  C['pianoKeySel'].value = '7'; C['pianoKeySel'].onchange(); // key of G -- Gmaj (still held) becomes the tonic
  if (!C['pianoFnOut'].innerHTML.includes('I in G Major') || !C['pianoFnOut'].innerHTML.includes('tonic')) throw new Error('Gmaj in the key of G major should read as I, tonic, got: ' + C['pianoFnOut'].innerHTML);
  C['pianoKeySel'].value = '0'; C['pianoKeySel'].onchange(); // restore the default for anything downstream
  // release G+B+D, then hold an unrecognised cluster -- panels should degrade gracefully, not throw
  pianoKey(7); pianoKey(11); pianoKey(2);
  pianoKey(0); pianoKey(1); pianoKey(2);
  if (!/not a chord we know yet/.test(C['pianoReadout'].textContent)) throw new Error('an unrecognised note cluster should say so, not silently show nothing');
  if (C['pianoIntervals'].children.length !== 2) throw new Error('interval breakdown should still work off raw held notes even without a chord match');
  pianoKey(0); pianoKey(1); pianoKey(2); // release
  // closing should reset everything (score, last-chord memory, score mode) but keep the tool
  // built -- reopening should reuse it, same idiom as the ripple room's isRippleRoomBuilt()
  C['pianoToolClose'].onclick();
  if (C['pianoTool'].style.display !== 'none') throw new Error('closing the piano tool should hide the overlay');
  if (!__api.isPianoToolBuilt()) throw new Error('closing should not un-build the tool -- reopening should reuse it');
  if (__api.getPianoScoreMode() !== 'snapshot') throw new Error('closing should reset the score mode back to snapshot');
  if (__api.getPianoScoreLength() !== 0) throw new Error('closing should clear any transcribed score');
  if (__api.getPianoLastChordIdx() !== null) throw new Error('closing should forget the last-played chord');
  if (C['pianoReadout'].textContent !== 'What chord do you want to hear?') throw new Error('closing should clear the held keys and reset the readout');
  if (__api.View.get().mode !== 'lessons') throw new Error('closing the piano tool should leave the current mode untouched');
  // ---- Music Foundations Curriculum: browsable reference content (91_curriculum.js) ----
  const curricCardCount = (C['curriculumNav'].innerHTML.match(/data-curric-kind=/g) || []).length;
  if (curricCardCount !== 15) throw new Error('the curriculum nav should render 15 cards (overview + 12 weeks + capstone + assessment), got ' + curricCardCount);
  const curricClick = (kind, key) => fire(C['curriculumNav'], 'click', { target: { closest: sel => sel === '.lessonCard' ? { dataset: { curricKind: kind, curricKey: String(key) } } : null } });
  curricClick('week', 1);
  if (!/What Is Sound\?/.test(C['curriculumDetail'].innerHTML)) throw new Error('clicking Week 1 should render its content into the detail pane');
  curricClick('overview', 'overview');
  if (!/Maria von Trapp/.test(C['curriculumDetail'].innerHTML) || !/Track A/.test(C['curriculumDetail'].innerHTML)) throw new Error('the overview card should render the teaching lineage and track comparison');
  curricClick('capstone', 'capstone');
  if (!/Share the Music/.test(C['curriculumDetail'].innerHTML)) throw new Error('the capstone card should render its content');
  curricClick('assessment', 'assessment');
  if (!/Steady Beat/.test(C['curriculumDetail'].innerHTML)) throw new Error('the assessment card should render the capstone rubric');
  // ---- Rhythm Blocks: Week 6's "Rhythm Architect" activity, made real ----
  curricClick('week', 6);
  if (!/rhythmGrid/.test(C['curriculumDetail'].innerHTML)) throw new Error('Week 6 should embed the rhythm-blocks activity');
  if ((C['rhythmGrid'].innerHTML.match(/class="rhythmSlot/g) || []).length !== 8) throw new Error('the rhythm grid should render 8 beat slots (2 measures of 4)');
  const rhythmTap = kind => fire(C['rhythmPalette'], 'click', { target: { closest: sel => sel === '[data-add]' ? { dataset: { add: kind } } : null } });
  rhythmTap('ta');
  if (JSON.stringify(__api.getRhythmSeq()) !== JSON.stringify(['ta',null,null,null,null,null,null,null])) throw new Error('tapping ta should fill slot 0, got ' + JSON.stringify(__api.getRhythmSeq()));
  rhythmTap('titi');
  if (JSON.stringify(__api.getRhythmSeq()) !== JSON.stringify(['ta','titi',null,null,null,null,null,null])) throw new Error('tapping ti-ti should auto-advance to the next empty slot and fill it, got ' + JSON.stringify(__api.getRhythmSeq()));
  C['rhythmDelBtn'].onclick();
  if (JSON.stringify(__api.getRhythmSeq()) !== JSON.stringify(['ta',null,null,null,null,null,null,null])) throw new Error('delete-last should remove the most recently filled slot');
  C['rhythmClearBtn'].onclick();
  if (__api.getRhythmSeq().some(v => v != null)) throw new Error('clear should empty the whole grid');
  rhythmTap('ta'); rhythmTap('titi'); // rebuild ta, ti-ti for the playback test -- also confirms clear reset the active slot back to 0
  if (JSON.stringify(__api.getRhythmSeq()) !== JSON.stringify(['ta','titi',null,null,null,null,null,null])) throw new Error('rebuilding after clear should start from slot 0 again');
  let clapCount = 0;
  const origCreateBufferSource = global.window.AudioContext.prototype.createBufferSource;
  global.window.AudioContext.prototype.createBufferSource = function(){ clapCount++; return origCreateBufferSource.apply(this, arguments); };
  C['rhythmPlayBtn'].onclick(); // unlockAudio() (already unlocked, no-op) + playRhythm() -> step() runs synchronously for slot 0 (ta)
  if (!__api.isRhythmPlaying()) throw new Error('play should start rhythm playback');
  if (clapCount !== 1) throw new Error('slot 0 (ta) should play exactly 1 clap synchronously on play, played ' + clapCount);
  clapCount = 0;
  global.__fireTimeout(); // advances to slot 1 (ti-ti): its first clap plays immediately, and its second clap's own sub-timer is scheduled
  if (clapCount !== 1) throw new Error('slot 1 (ti-ti) should play its first clap immediately when its step fires, played ' + clapCount);
  clapCount = 0;
  global.__fireTimeout(); // fires the ti-ti sub-timer -- the second clap of the split beat
  if (clapCount !== 1) throw new Error('ti-ti\'s second clap should fire from its own sub-timer, played ' + clapCount);
  clapCount = 0;
  global.__fireTimeout(); // advances to slot 2, which is empty
  if (clapCount !== 0) throw new Error('an empty slot should play no clap, played ' + clapCount);
  global.window.AudioContext.prototype.createBufferSource = origCreateBufferSource;
  curricClick('overview', 'overview'); // navigate away from Week 6 mid-playback
  if (__api.isRhythmPlaying()) throw new Error('navigating away from Week 6 should stop rhythm playback, not leave it clapping in the background');
  // the tune toggle (Equal/Just) has no effect on the Lessons demos (they always play back at
  // fixed equal temperament) — showMode() never relocates it into #lessonsSettingsAnchor
  if (C['lessonsSettingsAnchor'].children.includes(C['tuneToggle'])) throw new Error('Lessons mode should not have the tune toggle, which has no effect on its demos');
  // a mode switch is a fresh page: scroll position shouldn't carry over from a previous visit
  C['lessonsHome'].scrollTop = 400;
  fire(C['siteHeaderNav'], 'click', { target: { closest: sel => sel === 'button[data-mode]' ? { dataset: { mode: 'science' } } : null } });
  frames(5);
  if (C['lessonsHome'].style.display === '') throw new Error('leaving Lessons should hide #lessonsHome');
  if (!C['sciSettingsAnchor'].children.includes(C['tuneToggle'])) throw new Error('Science mode should relocate the tune toggle back into its own sidebar');
  fire(C['siteHeaderNav'], 'click', { target: { closest: sel => sel === 'button[data-mode]' ? { dataset: { mode: 'lessons' } } : null } });
  frames(5);
  if (C['lessonsHome'].scrollTop !== 0) throw new Error('re-entering Lessons should reset scroll to the top, not resume a previous scroll position');
  // re-entering should also reset the stage itself, not just the scroll position — a previous
  // visit that left off exploring the card grid shouldn't strand the next visit there
  if (C['lessonsIntro'].style.display === 'none') throw new Error('re-entering Lessons should reset back to the notes & beats intro, not stay on the card grid');
  if (C['lessonsGrid'].style.display !== 'none') throw new Error('re-entering Lessons should hide the card grid until "Explore" is chosen again');
  if (!/sciCaptionBright">DO/.test(C['lessonsStageCaption'].innerHTML)) throw new Error('re-entering Lessons should restart the notes & beats intro from DO, not a stale scroll position');
  fire(C['siteHeaderNav'], 'click', { target: { closest: sel => sel === 'button[data-mode]' ? { dataset: { mode: 'science' } } : null } });
  frames(5);
  // bridge: from Musical back to Science should work with observer callback
  fire(C['detail'], 'click', { target: { closest: () => ({ dataset: { act: 'bridge' } }) } });
  // palette sanity
  const h = __api.Palette.noteHue(9); // A
  if (Math.abs(h - 0.25) > 0.01) throw new Error('A should be hue 0.25 (green), got ' + h);
  // scale sanity: Cmaj chord (root=0, ivs=[0,4,7]) should be in C major
  const cmaj = { root: 0, ivs: [0,4,7] };
  if (!__api.chordInScale(cmaj, 'major', 0)) throw new Error('Cmaj should be in C major');
  if (__api.chordInScale({root:1, ivs:[0,4,7]}, 'major', 0)) throw new Error('C#maj should NOT be in C major');
  if (__api.chordFn(cmaj, 'major', 0) !== 'T') throw new Error('Cmaj should be tonic in C major');
  // level toggle: Beginner (default) hides jargon — consonance/ratios in the detail card and
  // "shares N tones"/"one semitone away" tags in neighbours — Advanced shows everything, exactly
  // as before this existed. The bridge-button click just above switched back to Musical mode
  // with Bdim (from the earlier cross-link test) still the open chord.
  if (__api.View.get().level !== 'beginner') throw new Error('level should default to beginner');
  if (!document.body.classList.contains('levelBeginner')) throw new Error('document.body should carry the levelBeginner class by default');
  if (/consonance/.test(C['detail'].innerHTML)) throw new Error('Beginner mode should hide the consonance section in the detail card');
  if (/suggTag/.test(C['musNeighbors'].innerHTML)) throw new Error('Beginner mode should hide the neighbour-chord tags ("shares N tones", etc.)');
  fire(C['levelToggle'], 'click', { target: { closest: () => ({ dataset: { level: 'advanced' }, classList: { toggle(){} } }) } });
  if (__api.View.get().level !== 'advanced') throw new Error('level toggle did not switch to advanced');
  if (document.body.classList.contains('levelBeginner')) throw new Error('document.body should drop levelBeginner once switched to advanced');
  if (!/consonance/.test(C['detail'].innerHTML)) throw new Error('Advanced mode should show the consonance section (re-rendered live on toggle)');
  if (!/suggTag/.test(C['musNeighbors'].innerHTML)) throw new Error('Advanced mode should show the neighbour-chord tags (re-rendered live on toggle)');
  // same toggle, checked against the Lessons-mode interval visualizer (a different render path)
  fire(C['siteHeaderNav'], 'click', { target: { closest: sel => sel === 'button[data-mode]' ? { dataset: { mode: 'lessons' } } : null } });
  frames(5);
  fire(C['lessonNav'], 'click', { target: { closest: sel => sel === '.lessonCard' ? { dataset: { lesson: 'intervals' } } : null } });
  if (!/ratio/.test(C['musInterval'].innerHTML)) throw new Error('Advanced mode should show the ratio/consonance line in the interval visualizer');
  fire(C['levelToggle'], 'click', { target: { closest: () => ({ dataset: { level: 'beginner' }, classList: { toggle(){} } }) } });
  if (/ratio/.test(C['musInterval'].innerHTML)) throw new Error('Beginner mode should hide the ratio/consonance line in the interval visualizer (re-rendered live on toggle)');
  fire(C['siteHeaderNav'], 'click', { target: { closest: sel => sel === 'button[data-mode]' ? { dataset: { mode: 'science' } } : null } });
  frames(5);
  // tuning: swapping to JI should change played frequencies and node positions
  const N0 = __api.N || (typeof N !== 'undefined' ? N : null);
  fire(C['tuneToggle'], 'click', { target: { closest: () => ({ dataset: { tune: 'JI' } }) } });
  frames(30);
  if (__api.View.get().tuning !== 'JI') throw new Error('tuning did not switch to JI');
  fire(C['tuneToggle'], 'click', { target: { closest: () => ({ dataset: { tune: 'ET' } }) } });
  frames(30);
  if (__api.View.get().tuning !== 'ET') throw new Error('tuning did not switch back to ET');
  // deep link: serialize should reflect current state; restore from a hash should apply
  const ser = __api.Link.serialize();
  if (!/mode=/.test(ser)) throw new Error('serialize missing mode');
  global.location.hash = '#mode=musical&dim=3d&tune=ET&key=9&scale=lydian';
  __api.Link.applyFromHash(); frames(5);
  if (__api.View.get().scale !== 'lydian' || __api.View.get().key !== 9) throw new Error('deep-link restore failed');
  if (!C['musChordLabel'].textContent) throw new Error('deep-link restore should re-render the chord-tone label');
  // clean per-section paths (elorah.org/musical, /science, /play, /lessons): modeFromPath() reads
  // location.pathname; writeModePath()/writeHomePath() update it via history.replaceState (spied
  // on here, since the harness's replaceState is a no-op stub that doesn't reflect back into
  // location.pathname the way a real browser would)
  global.location.pathname = '/musical';
  if (__api.Link.modeFromPath() !== 'musical') throw new Error('modeFromPath should map /musical to the musical mode');
  global.location.pathname = '/nonsense';
  if (__api.Link.modeFromPath() !== null) throw new Error('modeFromPath should return null for an unrecognised path');
  global.location.pathname = '/';
  if (__api.Link.modeFromPath() !== null) throw new Error('modeFromPath should return null at the root path \u2014 that\'s home, not a mode');
  let lastReplacedUrl = null;
  const origReplaceState = global.history.replaceState;
  global.history.replaceState = function(state, title, url){ lastReplacedUrl = url; return origReplaceState.apply(this, arguments); };
  __api.Link.writeModePath('play');
  if (!lastReplacedUrl.startsWith('/play')) throw new Error('writeModePath should replace the URL with /play, got ' + lastReplacedUrl);
  __api.Link.writeHomePath();
  if (!/^\/(#|$)/.test(lastReplacedUrl)) throw new Error('writeHomePath should replace the URL with a bare "/", got ' + lastReplacedUrl);
  lastReplacedUrl = null;
  __api.Link.writeModePath('bogus');
  if (lastReplacedUrl !== null) throw new Error('writeModePath should ignore an unrecognised mode rather than writing a garbage URL');
  global.history.replaceState = origReplaceState;
  // enterMusicalWithKeyScale: the shared "seed Musical mode" helper (the topbar Why/How bridge,
  // deep-link restore, and Musical mode's own default-entry all call this now instead of each
  // hand-rolling the same View.set + select-sync + refresh sequence) \u2014 run last since it mutates
  // View.state.key/scale and nothing downstream should depend on a particular value afterward
  __api.enterMusicalWithKeyScale(4, 'dorian');
  if (__api.View.get().key !== 4 || __api.View.get().scale !== 'dorian') throw new Error('enterMusicalWithKeyScale should update View state');
  if (C['mScaleSel'].value !== 'dorian') throw new Error('enterMusicalWithKeyScale should sync the scale select');
  if (!/Key of E /.test(C['mLegend'].textContent)) throw new Error('enterMusicalWithKeyScale should re-render the legend for the new key (E = pitch class 4)');
  console.log('PASS \u2014 all layers ran clean');
} catch (e) { console.error('FAIL:', e.message); console.error(e.stack.split('\n').slice(0,6).join('\n')); process.exit(1); }
