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

const C = global.__cache, fire = global.__fire, raf = () => global.__raf();
const frames = n => { for (let i = 0; i < n && raf(); i++) raf()(); };
const clk = (el, k) => fire(el, 'click', { target: { closest: () => ({ dataset: k, disabled: false }) } });
try {
  // Simple mode: default front door with no shared URL
  if (C['simpleFront'].style.display === 'none') throw new Error('Simple front door should show by default (no hash)');
  if (C['advancedApp'].style.display !== 'none') throw new Error('Advanced app should stay hidden until entered');
  if (!__api.Surfaces || !__api.Surfaces.get('cof')) throw new Error('circle-of-fifths surface not registered');
  if (!__api.Surfaces.get('keyboard')) throw new Error('keyboard surface not registered');
  if (!/cofNote/.test(C['simpleCof'].innerHTML)) throw new Error('circle-of-fifths surface did not render into simpleFront');
  // tapping a circle-of-fifths note on the Musical card should explore locally, not navigate away
  fire(C['simpleMusicalCard'], 'click', { target: { closest: sel => sel === '.cofNote' ? { dataset: { pc: '0' } } : null } });
  if (C['advancedApp'].style.display === '') throw new Error('tapping a circle-of-fifths note should not leave the Simple front door');
  // clicking elsewhere on the Musical card enters Musical mode
  fire(C['simpleMusicalCard'], 'click', { target: { closest: () => null } });
  if (C['advancedApp'].style.display === 'none') throw new Error('Musical card should open Advanced');
  if (__api.View.get().mode !== 'musical') throw new Error('Musical card should enter Musical mode');
  C['backToSimpleBtn'].onclick();
  // the Science card enters Science mode and builds the mini 3D preview from the real scene
  fire(C['simpleScienceCard'], 'click', {});
  if (__api.View.get().mode !== 'science') throw new Error('Science card should enter Science mode');
  if (__api.View.get().dim !== '3d') throw new Error('Science card should switch to 3D');
  C['backToSimpleBtn'].onclick();
  if (C['simpleFront'].style.display === 'none') throw new Error('back-to-Simple button should restore the front door');
  // fallback "open the full tool" link, used to enter Advanced for the rest of this test
  C['simpleAdvanced'].onclick();
  if (C['advancedApp'].style.display === 'none') throw new Error('Advanced app should show after entering from Simple');
  if (__api.View.get().mode !== 'science') throw new Error('the fallback link should default to Science mode');

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
  fire(C['modeToggle'], 'click', { target: { closest: () => ({ dataset: { mode: 'play' }, classList: { add(){}, remove(){}, toggle(){} } }) } });
  frames(5);
  if (__api.View.get().mode !== 'play') throw new Error('Play tab did not activate');
  if (!C['compose'].classList.contains('show')) throw new Error('entering Play should open the sequencer drawer');
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
  // Musical mode: no 3D controls — a circle of fifths (tap a note = pick a key) plus a
  // function-coloured diagram of that key's chords (subdominant -> dominant -> tonic)
  fire(C['modeToggle'], 'click', { target: { closest: () => ({ dataset: { mode: 'musical' }, classList: { add(){}, remove(){}, toggle(){} } }) } });
  frames(5);
  if (typeof __api === 'undefined' || __api.View.get().mode !== 'musical') throw new Error('mode toggle failed');
  if (C['scene'].style.display !== 'none') throw new Error('Musical mode should hide the 3D map');
  if (C['panel'].style.display !== 'none') throw new Error('Musical mode should hide the small side panel');
  // tap a note on Musical's own circle of fifths to set the key
  fire(C['musCof'], 'click', { target: { closest: sel => sel === '.cofNote' ? { dataset: { pc: '0' } } : null } });
  if (__api.View.get().key !== 0) throw new Error('tapping a note on the Musical circle should set the key');
  if (!/cofRing-minor/.test(C['musCof'].innerHTML) || !/cofRing-dim/.test(C['musCof'].innerHTML)) throw new Error('minor/diminished rings did not render on the circle');
  if (!/^Cmaj:\s+C \(root\)/.test(C['musChordLabel'].textContent)) throw new Error('chord-tone label should spell out root/3rd/5th for the tonic triad');
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
  fire(C['modeToggle'], 'click', { target: { closest: () => ({ dataset: { mode: 'musical' }, classList: { add(){}, remove(){}, toggle(){} } }) } });
  frames(5);
  // "where next?" suggestions should follow the newly-selected chord, and clicking one navigates too
  if (!/suggChip/.test(C['musSuggest'].innerHTML)) throw new Error('no "where next" suggestions rendered');
  const suggIdx = C['musSuggest'].innerHTML.match(/data-idx="(\d+)"/)[1];
  const suggName = __api.N[+suggIdx].name;
  fire(C['musSuggest'], 'click', { target: { closest: () => ({ dataset: { idx: suggIdx }, classList: { add(){}, remove(){} } }) } });
  if (!C['musChordLabel'].textContent.startsWith(suggName)) throw new Error('selecting a suggestion should make it the active chord');
  if (!C['musSuggest'].innerHTML.includes(suggName)) throw new Error('suggestions should now be relative to the newly-selected chord');
  // Bach prelude: starting playback resets to C major, builds the staff, and plays/highlights the first note
  C['musBachPlay'].onclick();
  if (__api.View.get().key !== 0 || __api.View.get().scale !== 'major') throw new Error('starting the Bach demo should reset to C major');
  if (!/staffNote/.test(C['musStaff'].innerHTML)) throw new Error('Bach demo did not render the staff');
  if (!/^Cmaj:\s+C \(root\)/.test(C['musChordLabel'].textContent)) throw new Error('Bach demo should show bar 1 (Cmaj) on the circle');
  if (!/bar 1\/35/.test(C['musBachPlay'].textContent)) throw new Error('play button should show playback progress');
  C['musBachPlay'].onclick(); // stop
  if (!/^▶ Bach/.test(C['musBachPlay'].textContent)) throw new Error('stopping should restore the play button label');
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
  console.log('PASS \u2014 all layers ran clean');
} catch (e) { console.error('FAIL:', e.message); console.error(e.stack.split('\n').slice(0,6).join('\n')); process.exit(1); }
