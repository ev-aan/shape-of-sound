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
  // Simple mode: the Elorah hero front door, shown by default with no shared URL
  if (C['simpleFront'].style.display === 'none') throw new Error('Simple front door should show by default (no hash)');
  if (C['advancedApp'].style.display !== 'none') throw new Error('Advanced app should stay hidden until entered');
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
  C['backToSimpleBtn'].onclick();
  fire(C['heroRows'], 'click', { target: { closest: sel => sel === '.heroRow' ? { dataset: { mode: 'science' } } : null } });
  if (__api.View.get().mode !== 'science') throw new Error('the Science row should enter Science mode');
  if (__api.View.get().dim !== '3d') throw new Error('the Science row should switch to 3D');
  C['backToSimpleBtn'].onclick();
  fire(C['heroRows'], 'click', { target: { closest: sel => sel === '.heroRow' ? { dataset: { mode: 'play' } } : null } });
  if (__api.View.get().mode !== 'play') throw new Error('the Play row should enter Play mode');
  C['backToSimpleBtn'].onclick();
  fire(C['heroRows'], 'click', { target: { closest: sel => sel === '.heroRow' ? { dataset: { mode: 'lessons' } } : null } });
  if (__api.View.get().mode !== 'lessons') throw new Error('the Lessons row should enter Lessons mode');
  C['backToSimpleBtn'].onclick();
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
  fire(C['modeToggle'], 'click', { target: { closest: () => ({ dataset: { mode: 'play' }, classList: { add(){}, remove(){}, toggle(){} } }) } });
  frames(5);
  if (__api.View.get().mode !== 'play') throw new Error('Play tab did not activate');
  if (!C['compose'].classList.contains('show')) throw new Error('entering Play should open the sequencer drawer');
  if (C['title'].style.display !== 'none') throw new Error('Play mode should hide #title (Science-specific copy bleeding into Play\'s own UI)');
  // the empty-state readout invites a choice ("what chord do you want to hear?") rather than
  // just instructing — checked against the source, in both the static markup and the JS reset
  // path (onPlayNotesChange with an empty set), since the harness's DOM stubs start blank and
  // don't reflect real static HTML content the way a browser would.
  const playReadoutCopies = (html.match(/what chord do you want to hear/ig) || []).length;
  if (playReadoutCopies !== 2) throw new Error('expected the empty-state readout text in both the static markup and onPlayNotesChange, found ' + playReadoutCopies);
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
  fire(C['modeToggle'], 'click', { target: { closest: () => ({ dataset: { mode: 'musical' }, classList: { add(){}, remove(){}, toggle(){} } }) } });
  frames(5);
  fire(C['musCof'], 'click', { target: { closest: sel => sel === '.cofRing' ? { dataset: { ring: 'dim', pc: '11' } } : null } });
  fire(C['detail'], 'click', { target: { closest: () => ({ dataset: { act: 'extend-link' } }) } });
  if (__api.View.get().mode !== 'lessons') throw new Error('the "extend" cross-link should switch to Lessons mode');
  if (+C['ssRootSel'].value !== 11) throw new Error('extend-link should seed the superstructure root to B (11), got ' + C['ssRootSel'].value);
  if ((C['musSuperstructure'].innerHTML.match(/class="ssNode"/g) || []).length !== 3) throw new Error('Bdim is a triad (3 notes) — extend-link should seed upTo:3');
  fire(C['modeToggle'], 'click', { target: { closest: () => ({ dataset: { mode: 'musical' }, classList: { add(){}, remove(){}, toggle(){} } }) } });
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
  // the tune toggle (Equal/Just) has no effect on the Lessons demos (they always play back at
  // fixed equal temperament) — showing it there would be chrome bleeding across pages
  if (C['tuneToggle'].style.display === '') throw new Error('Lessons mode should hide the tune toggle, which has no effect on its demos');
  // a mode switch is a fresh page: scroll position shouldn't carry over from a previous visit
  C['lessonsHome'].scrollTop = 400;
  fire(C['modeToggle'], 'click', { target: { closest: () => ({ dataset: { mode: 'science' }, classList: { add(){}, remove(){}, toggle(){} } }) } });
  frames(5);
  if (C['lessonsHome'].style.display === '') throw new Error('leaving Lessons should hide #lessonsHome');
  if (C['tuneToggle'].style.display !== '') throw new Error('Science mode should show the tune toggle again');
  fire(C['modeToggle'], 'click', { target: { closest: () => ({ dataset: { mode: 'lessons' }, classList: { add(){}, remove(){}, toggle(){} } }) } });
  frames(5);
  if (C['lessonsHome'].scrollTop !== 0) throw new Error('re-entering Lessons should reset scroll to the top, not resume a previous scroll position');
  fire(C['modeToggle'], 'click', { target: { closest: () => ({ dataset: { mode: 'science' }, classList: { add(){}, remove(){}, toggle(){} } }) } });
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
  fire(C['modeToggle'], 'click', { target: { closest: () => ({ dataset: { mode: 'lessons' }, classList: { add(){}, remove(){}, toggle(){} } }) } });
  frames(5);
  fire(C['lessonNav'], 'click', { target: { closest: sel => sel === '.lessonCard' ? { dataset: { lesson: 'intervals' } } : null } });
  if (!/ratio/.test(C['musInterval'].innerHTML)) throw new Error('Advanced mode should show the ratio/consonance line in the interval visualizer');
  fire(C['levelToggle'], 'click', { target: { closest: () => ({ dataset: { level: 'beginner' }, classList: { toggle(){} } }) } });
  if (/ratio/.test(C['musInterval'].innerHTML)) throw new Error('Beginner mode should hide the ratio/consonance line in the interval visualizer (re-rendered live on toggle)');
  fire(C['modeToggle'], 'click', { target: { closest: () => ({ dataset: { mode: 'science' }, classList: { add(){}, remove(){}, toggle(){} } }) } });
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
  console.log('PASS \u2014 all layers ran clean');
} catch (e) { console.error('FAIL:', e.message); console.error(e.stack.split('\n').slice(0,6).join('\n')); process.exit(1); }
