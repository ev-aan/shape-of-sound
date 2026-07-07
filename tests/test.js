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
  // interval visualizer: a fresh render for a known pair should name the interval and show its ratio
  const p5 = document.createElement('div');
  __api.Surfaces.get('interval').render(p5, { a:0, b:7 });
  if (!/Perfect 5th/.test(p5.innerHTML)) throw new Error('C -> G should be identified as a Perfect 5th');
  if (!/3:2/.test(p5.innerHTML)) throw new Error('a Perfect 5th should show its 3:2 ratio');
  const m2 = document.createElement('div');
  __api.Surfaces.get('interval').render(m2, { a:0, b:1 });
  if (!/Minor 2nd/.test(m2.innerHTML)) throw new Error('C -> C# should be identified as a Minor 2nd');
  if (!/16:15/.test(m2.innerHTML)) throw new Error('a Minor 2nd should show its 16:15 ratio');
  // the note selects (wired at boot alongside the others) should default to a fifth apart, and
  // changing one should re-render the diagram for the new pair
  if (C['ivNoteA'].innerHTML.match(/<option/g).length !== 12 || C['ivNoteB'].innerHTML.match(/<option/g).length !== 12) throw new Error('interval note selects should list all 12 notes');
  if (!/Perfect 5th/.test(C['musInterval'].innerHTML)) throw new Error('interval visualizer should default to C -> G, a Perfect 5th');
  C['ivNoteB'].value = '4'; C['ivNoteB'].onchange();
  if (!/Major 3rd/.test(C['musInterval'].innerHTML)) throw new Error('changing a note select should re-render the interval diagram');
  C['ivNoteB'].value = '7'; C['ivNoteB'].onchange(); // restore the default pairing for anything downstream
  let ivOscCount = 0;
  const origIvCreateOsc = global.window.AudioContext.prototype.createOscillator;
  global.window.AudioContext.prototype.createOscillator = function(){ ivOscCount++; return origIvCreateOsc.apply(this, arguments); };
  C['ivPlayBtn'].onclick();
  global.window.AudioContext.prototype.createOscillator = origIvCreateOsc;
  if (ivOscCount !== 2) throw new Error('"hear it" should play both notes of the interval, played ' + ivOscCount);
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
  // Lessons mode: a 4th top-level surface for the standalone teaching demos only (Bach and
  // neighbouring chords stay in Musical mode since they depend on its live chord-selection state)
  fire(C['modeToggle'], 'click', { target: { closest: () => ({ dataset: { mode: 'lessons' }, classList: { add(){}, remove(){}, toggle(){} } }) } });
  frames(5);
  if (__api.View.get().mode !== 'lessons') throw new Error('Lessons tab did not activate');
  if (C['lessonsHome'].style.display === 'none') throw new Error('Lessons mode should show #lessonsHome');
  if (C['musicalHome'].style.display !== 'none') throw new Error('Lessons mode should hide #musicalHome');
  if (C['scene'].style.display !== 'none') throw new Error('Lessons mode should hide the 3D map, same as Musical');
  if (!/lessonCard/.test(C['lessonNav'].innerHTML)) throw new Error('lesson nav should render lesson cards');
  fire(C['lessonNav'], 'click', { target: { closest: sel => sel === '.lessonCard' ? { dataset: { lesson: 'intervals' } } : null } });
  if (!C['musInterval'].innerHTML) throw new Error('selecting the intervals lesson should still have its mount point populated (wired at boot)');
  fire(C['modeToggle'], 'click', { target: { closest: () => ({ dataset: { mode: 'science' }, classList: { add(){}, remove(){}, toggle(){} } }) } });
  frames(5);
  if (C['lessonsHome'].style.display === '') throw new Error('leaving Lessons should hide #lessonsHome');
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
