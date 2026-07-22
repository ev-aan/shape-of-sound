// ---- CURRICULUM: "Music Foundations" 13-week program ----
// Transcribed from Elorah_Music_Foundations_Curriculum.docx. One data set + one template per the
// document's own §6.7 advice ("template one week-screen layout and reuse it 13 times rather than
// designing each week bespoke") -- not 13 hand-authored bodies, the same reasoning that already
// governs the staff/keyboard/interval Surfaces elsewhere in this app.
const CURRICULUM_META = {
  duration: '13 weeks (1 session/week; 12 core weeks + 1 capstone)',
  ages: '5–12, organized into two leveled tracks that share the same weekly themes',
  tracks: 'Track A · Discoverers (5–8) and Track B · Builders (8–12)',
  format: 'Teacher- or parent-led; each week includes a hook, a drill, a main activity, and a check for understanding',
  assessment: 'Formative weekly checks + 4 unit assessments + 1 capstone performance rubric'
};
const CURRICULUM_LINEAGE = [
  { teacher:'Maria von Trapp ("Do-Re-Mi" spirit)', idea:'Teach through joy, story, and relationship before rules',
    howUsed:'Every unit opens with a curiosity hook before any drill; the capstone week is framed entirely around expressive confidence, not correctness' },
  { teacher:'Zoltán Kodály', idea:'The voice is the first instrument; folk song and solfège build the ear before the page',
    howUsed:'Solfège hand signs, movable-Do, and rhythm syllables (ta / ti-ti) are the backbone of Units 2–3' },
  { teacher:'Carl Orff (Schulwerk)', idea:'Learn through the body first — speech, movement, and simple percussion before formal instruments',
    howUsed:'Body percussion, echo clapping, and movement drills open nearly every lesson' },
  { teacher:'Edwin Gordon (Music Learning Theory)', idea:'Audiation — the ability to hear and think music internally — comes before performance or notation',
    howUsed:'Echo and "think it, don\'t sing it yet" activities precede every new pattern introduction' },
  { teacher:'Shinichi Suzuki', idea:'Immersion, repetition without drudgery, and family/community involvement build fluent musicianship',
    howUsed:'Weekly repertoire is revisited across sessions; a simple home-listening habit is suggested per unit' }
];
const CURRICULUM_PRINCIPLES = [
  { title:'1 · Progressive Disclosure', body:'Never more than one new concept per week. Every new idea (a symbol, a term, a technique) is built entirely from something introduced in a prior week. A learner should never feel a curriculum "jump."' },
  { title:'2 · Immediate, Kind Feedback', body:'Every activity has a built-in moment where the learner finds out, within seconds, whether they got it — an echo, a peer check, a teacher nod. Feedback is descriptive ("that was steady for 6 beats, then it sped up") rather than simply right/wrong.' },
  { title:'3 · Multimodal Engagement', body:'Every concept is taught through at least two of: body movement, voice, listening, and visual/symbolic representation. A learner who struggles with one mode has another way in.' },
  { title:'4 · Mastery Over Pace', body:'The weekly "Check for Understanding" is a gate, not a grade. A learner who isn\'t ready moves on with extra support rather than being marked down — assessment exists to guide re-teaching, not to sort children.' },
  { title:'5 · Story & Delight as the Wrapper for the Boring-but-Necessary', body:'Rhythm drilling, staff notation, and interval training are the least glamorous and most essential parts of music literacy. Each is deliberately framed inside a game, a mystery, or a small narrative ("Sound Detective," "Rhythm Architect," "Mystery Melody") so the repetition earns its keep without feeling like homework.' }
];
const CURRICULUM_TRACKS = {
  aspects: [
    { label:'Primary mode', a:'Body, voice, play — almost entirely pre-notation', b:'Body and voice first, but moving quickly into reading/writing' },
    { label:'Notation', a:'Icon-based symbols only; standard notation introduced by ear, not by page', b:'Standard notation introduced directly and reinforced by ear' },
    { label:'Session length', a:'20–25 minutes, high movement, short attention arcs', b:'30–40 minutes, can sustain focused seated work' },
    { label:'Vocabulary', a:'Simple English terms (fast/slow, high/low)', b:'English + informal Italian terms (forte, piano, allegro)' },
    { label:'Independence', a:'Heavy teacher scaffolding and echo-based learning', b:'Growing independent reading, writing, and self-correction' }
  ],
  bridge: 'A Track A learner is ready to bridge into Track B when they can, without support: (1) keep a steady beat for 16 counts, (2) echo a 4-beat ta/ti-ti rhythm pattern correctly, and (3) match Sol-Mi-Do by ear with hand signs. This is a readiness check, not an age cutoff — a 7-year-old who clears it should move up, and a 9-year-old who hasn\'t yet should stay in Track A a little longer without stigma.'
};
const CURRICULUM_UNITS = [
  { title:'Unit 1 · Awakening the Ear — Steady Beat & Sound Exploration', weeks:[
    { num:1, title:'What Is Sound?', bigIdea:'Sound is vibration — and every ear in the room can go on a scavenger hunt for it.',
      objectives:['Identify a sound as high/low and loud/soft','Describe how vibration creates sound','Explore 3+ sound sources with curiosity, not correctness'],
      hook:'"Sound Detective" walk: find 5 sounds around the room/house and imitate each one with your voice.',
      drill:'Feel-the-buzz: hum with a hand on the throat; tap a table vs. a drum to compare vibration.',
      mainActivity:'Sort a pile of picture cards (or real objects) into High/Low and Loud/Soft using a simple sorting mat.',
      trackA:'Keep it fully physical and playful — no writing. Sort with pictures and bodies (stand tall for high, crouch for low).',
      trackB:'Add vocabulary: pitch, volume, timbre. Ask learners to invent their own sound-sorting categories.',
      check:'Can the learner correctly sort 4/5 sound cards without teacher help?',
      materials:'Household objects for sound-making, sorting mat, picture cards.' },
    { num:2, title:'Finding the Steady Beat', bigIdea:'Music has a heartbeat — a steady pulse you can feel before you can name it.',
      objectives:['Feel and keep a steady beat with the body','Distinguish steady beat from rhythm (the words)','Match a beat to recorded music'],
      hook:'"Heartbeat of the Room": everyone finds their pulse, then the teacher plays a song and the room becomes one giant heartbeat.',
      drill:'Beat-keeping rotation: pat knees, then hands, then a rhythm instrument — same steady pulse, different textures. Repeat with 3 different songs.',
      mainActivity:'March, sway, or bounce a beanbag in time to music of varying tempo; freeze on stop.',
      trackA:'Use whole-body movement only (march, sway, clap). Celebrate any steady attempt — precision isn\'t the goal yet.',
      trackB:'Introduce the word "tempo"; have learners keep beat while also saying the song\'s rhythm words aloud, feeling the difference.',
      check:'Can the learner keep a steady beat for 8 consecutive counts without speeding up or dropping it?',
      materials:'Beanbags or rhythm sticks, 3 songs of different tempos, drum.' },
    { num:3, title:'Fast, Slow, Loud, Soft', bigIdea:'Tempo and dynamics are the first tools of musical storytelling — a lullaby and a march feel different for a reason.',
      objectives:['Use tempo and dynamics vocabulary (fast/slow, loud/soft)','Change tempo/dynamics on request while keeping the beat','Connect a tempo/dynamic choice to a feeling or story'],
      hook:'"Weather Machine": be a gentle breeze (soft/slow) that grows into a thunderstorm (loud/fast) and back again, using only voice and body percussion.',
      drill:'Conductor game: teacher\'s hand height/speed controls the group\'s volume and tempo in real time.',
      mainActivity:'In small groups, choose a tempo + dynamic pairing to represent an animal, weather, or feeling; perform for the class and let peers guess.',
      trackA:'Keep choices concrete (elephant = slow/loud, mouse = fast/soft). Use big, exaggerated gestures.',
      trackB:'Introduce Italian terms informally (forte, piano, allegro, lento) as "secret music words" alongside the English.',
      check:'Unit 1 mini-showcase: each learner performs one 8-beat pattern demonstrating a clear tempo/dynamic choice.',
      materials:'Open space for movement, optional simple percussion.' }
  ]},
  { title:'Unit 2 · Rhythm Becomes Language', weeks:[
    { num:4, title:'Rhythm Patterns & Echo Clapping', bigIdea:'Rhythm is a language of short and long sounds — and you can already speak it by echoing.',
      objectives:['Echo 2-4 beat rhythm patterns accurately','Distinguish short sounds from long sounds','Use Kodály-style rhythm syllables (ta / ti-ti) to speak rhythm'],
      hook:'"Copy Cat" clapping battle: teacher claps a pattern, class echoes; patterns grow trickier round by round.',
      drill:'Rhythm syllable drill: chant ta (quarter note) and ti-ti (two eighth notes) while clapping, building 4-beat combinations.',
      mainActivity:'Turn-taking rhythm circle: each learner claps a 4-beat pattern for the group to echo.',
      trackA:'Use only ta and ti-ti; keep patterns to 2 beats; add stomping/patting for kinesthetic reinforcement.',
      trackB:'Extend to 4-beat patterns mixing ta and ti-ti; introduce rest ("sh") as a beat of silence.',
      check:'Can the learner echo a 4-beat ta/ti-ti pattern correctly on the first or second try?',
      materials:'None required — voices and hands; optional hand drum.' },
    { num:5, title:'Naming Rhythm — Notation Begins', bigIdea:'The sounds you\'ve been clapping have symbols — and you\'re about to become someone who can read them.',
      objectives:['Match ta to a quarter note and ti-ti to two eighth notes visually','Read a 4-beat rhythm card aloud using syllables','Write a simple rhythm pattern using symbol cards'],
      hook:'"Secret Code" reveal: the rhythm patterns clapped so far have hidden symbols underneath a covered card — peel back the card to reveal notation for the first time.',
      drill:'Flash-card drill: teacher shows a rhythm card (quarter/eighth notes), learners immediately clap + say it.',
      mainActivity:'Learners arrange rhythm symbol cards (magnetic or paper) into their own 4-beat pattern, then perform it for a partner.',
      trackA:'Use large, colorful icon-style notes (not standard notation yet) that map 1:1 to ta/ti-ti.',
      trackB:'Introduce standard quarter note and eighth-note-pair notation alongside the icons, bridging to real notation.',
      check:'Can the learner correctly read and clap 3 unfamiliar 4-beat rhythm cards?',
      materials:'Rhythm symbol cards (printable), whiteboard.' },
    { num:6, title:'Building & Reading Rhythm Patterns', bigIdea:'Four beats make a measure — and measures are the building blocks every song is made of.',
      objectives:['Identify a measure and a bar line','Read and perform an 8-beat (two-measure) rhythm pattern','Compose an original 2-measure rhythm'],
      hook:'"Rhythm Architect": build a 2-measure rhythm "building" out of note-block cards, then perform your building for the class.',
      drill:'Call-and-response reading: teacher points to written rhythm cards in sequence; class reads and claps in real time (no verbal cue).',
      mainActivity:'Learners compose, notate (with cards or on paper), and perform their own 2-measure rhythm; class echoes it back.',
      trackA:'Compose with movable cards only (no handwriting required); perform with big body percussion.',
      trackB:'Notate on paper using bar lines; perform on a rhythm instrument in addition to body percussion.',
      check:'Unit 2 assessment: sight-read and clap a new 2-measure pattern with 80%+ accuracy; perform own composition.',
      materials:'Rhythm cards, paper/pencil (Track B), simple percussion instruments.',
      activity:'rhythm-blocks' }
  ]},
  { title:'Unit 3 · Finding Do — Pitch, Melody, Solfège & the Staff', weeks:[
    { num:7, title:'High and Low — Melodic Contour', bigIdea:'Melodies move like a rollercoaster — before you name the notes, you can draw the ride.',
      objectives:['Track melodic direction (up/down/same) by ear','Draw a melody\'s contour as a line','Sing a simple 3-note pattern (Do-Mi-Sol / "Sol-Mi" calls)'],
      hook:'"Melody Rollercoaster": trace the shape of a familiar tune in the air, then draw it on paper as a wavy line.',
      drill:'Sol-Mi echo singing (the classic playground "cuck-oo" interval) with Kodály hand signs, moving hands up/down with pitch.',
      mainActivity:'In pairs, one learner sings a short 3-note pattern, the other draws its contour; then switch and check against the singer\'s intent.',
      trackA:'Use only 2-3 notes (Sol-Mi, then Sol-Mi-Do). Emphasize the hand signs and big physical gestures over accuracy.',
      trackB:'Introduce the full 5-note pattern (Do-Re-Mi-Fa-Sol) with hand signs; begin naming notes aloud while singing.',
      check:'Can the learner correctly identify up/down/same for 4 out of 5 short melodic phrases played aloud?',
      materials:'Hand-sign reference chart, drawing paper, pitched instrument (piano/xylophone) or voice only.' },
    { num:8, title:'Solfège & the Musical Staff', bigIdea:'The staff is just a map — five lines and four spaces that tell your hand signs where to live.',
      objectives:['Name the lines and spaces of the treble staff','Locate Middle C and the notes of the Do pentatonic scale on the staff','Match solfège syllables/hand signs to staff positions'],
      hook:'"Staff Playground": a giant floor staff (tape on the floor) that learners physically stand on to "become" a note.',
      drill:'Line-and-space chant using familiar mnemonics (e.g., lines: Every Good Bird Does Fly; spaces: F-A-C-E), paired with pointing on a staff poster.',
      mainActivity:'Place magnetic note-heads on a staff to build the Do-Re-Mi-Fa-Sol pattern, singing each note as it\'s placed.',
      trackA:'Focus only on "line notes" vs. "space notes" as a concept, using the floor staff; no formal note-naming required yet.',
      trackB:'Name and place all 5 notes correctly on a printed staff; connect each to its solfège syllable and hand sign.',
      check:'Can the learner correctly place 4/5 notes of the Do pentatonic scale on a blank staff?',
      materials:'Floor staff tape, staff poster, magnetic note-heads or stickers, blank staff worksheets.' },
    { num:9, title:'Simple Melodies — Reading & Singing', bigIdea:'You\'ve learned the map and the notes — now you get to read and sing your first real melody.',
      objectives:['Sight-sing a simple 4-5 note melody using solfège','Follow melodic notation left to right in time','Perform a familiar folk melody by reading, not memory'],
      hook:'"Mystery Melody": read a short notated melody in solfège hand signs as a class before anyone reveals what familiar song it is — then sing it and celebrate the reveal.',
      drill:'Sight-singing warm-up: point-and-sing 2-note, then 3-note, then 4-note patterns cold, using hand signs as a guide.',
      mainActivity:'Learners sight-read and perform a simple pentatonic folk melody (e.g., "Hot Cross Buns" or "Rain, Rain") as a class, then in small groups.',
      trackA:'Sing with hand-sign support throughout; reading is guided (teacher points), not fully independent.',
      trackB:'Read independently from notation with minimal support; add the words to the melody once notes are secure.',
      check:'Unit 3 assessment: sight-sing an unfamiliar 4-note melody with 80%+ pitch accuracy using hand signs as support.',
      materials:'Notated folk melodies, hand-sign chart.' }
  ]},
  { title:'Unit 4 · Making Music Together — Harmony, Form & Expression', weeks:[
    { num:10, title:'Same or Different? Musical Form', bigIdea:'Every song is a pattern of same and different — learn to hear the shape and you can hear any song.',
      objectives:['Identify phrases as same, similar, or different','Recognize AB and ABA form by ear','Map a song\'s form using letters or shapes'],
      hook:'"Form Detective": listen to a short song and place colored blocks in a row to represent each phrase as it plays — same color for same phrase.',
      drill:'Phrase-matching game: hear two short phrases back to back and signal (thumbs up/down) same or different.',
      mainActivity:'As a class, map the form of a familiar song (AB, ABA, or verse-chorus) using large form cards, then perform it following the map.',
      trackA:'Use only two contrasting movements (e.g., tiptoe for A, stomp for B) to physically feel form; keep mapping to 2 sections.',
      trackB:'Map 3-part form (ABA) independently on paper; identify form in a new, unfamiliar piece of music.',
      check:'Can the learner correctly map the form of a new 3-phrase song using letters (A/B) after one listen?',
      materials:'Colored blocks or form cards, recorded songs with clear AB/ABA structure.' },
    { num:11, title:'Harmony Basics', bigIdea:'Notes have friends — when sounds happen together instead of one after another, you get harmony.',
      objectives:['Understand harmony as sounds occurring together','Sing or play a simple ostinato/drone under a melody','Perform a basic 2-part texture (melody + accompaniment)'],
      hook:'"Note Families": introduce the idea that some notes are "best friends" and sound good together, using a simple I-chord drone under a familiar tune.',
      drill:'Layered ostinato build: group 1 keeps a steady drone/ostinato (e.g., "Sol-Do" or a rhythmic pattern) while group 2 sings the melody on top; swap roles.',
      mainActivity:'Perform a simple two-part arrangement: half the class holds a drone or simple ostinato, half sings the melody, then switch.',
      trackA:'Keep the accompaniment to a single sustained pitch or steady beat pattern (a "heartbeat" drone) under a familiar melody.',
      trackB:'Introduce a 2-note alternating ostinato (e.g., Do-Sol) as accompaniment; discuss why certain notes "go together."',
      check:'Can the learner hold their independent part (drone/ostinato or melody) for a full phrase without being pulled to the other part?',
      materials:'Simple pitched percussion (xylophone/chime bars) if available, or voices only.' },
    { num:12, title:'Expression & Interpretation', bigIdea:'The same notes can tell a happy story or a sad one — expression is where a performer becomes an artist.',
      objectives:['Apply dynamics and tempo choices expressively, not just correctly','Describe how a musical choice changes the mood of a piece','Rehearse a piece with intentional expressive choices for the capstone'],
      hook:'"Two Ways to Tell It": perform the same short phrase twice — once flat and mechanical, once with expressive dynamics/tempo — and discuss which one "felt like a story."',
      drill:'Expression markup: take a familiar melody and mark where it should get louder/softer/faster/slower as a group, then perform it that way.',
      mainActivity:'In capstone groups, rehearse the final piece with specific expressive choices, coached like a young performer preparing to share something meaningful (this is the Maria von Trapp week — joy, storytelling, and confidence over perfection).',
      trackA:'Choose one simple expressive contrast per song (e.g., "start soft, get loud at the end") and rehearse that.',
      trackB:'Mark a full expression map on their notated piece (dynamics + tempo changes) and rehearse to it.',
      check:'Can the learner explain, in their own words, one expressive choice they made and why?',
      materials:'Capstone repertoire, expression-marking worksheet.' }
  ]}
];
const CURRICULUM_CAPSTONE = { num:13, title:'Capstone — "Share the Music"',
  body:'A showcase, not a test. Learners (solo, pairs, or small groups) perform a short piece that combines a steady beat, a simple rhythm pattern, a short melody, and one deliberate expressive choice — the same four threads that ran through Units 1–4. Family or peers are invited as the audience whenever possible; the Suzuki principle of a supportive audience and the Maria von Trapp principle of joyful performance both matter more here than technical perfection.' };
// the paper-only "Sample Progress Tracker" (a blank fill-in-the-blank checklist for a real
// teacher's binder) is deliberately not included here -- not meaningful as static app content
const CURRICULUM_ASSESSMENT = {
  formative: [
    'Exit ticket: one thumbs-up/sideways/down per learner against that week\'s Check for Understanding, logged in under a minute.',
    'Teacher observation checklist: a running per-learner list of which skills are secure vs. still emerging, updated weekly rather than tested formally.',
    'Sound badges: a small, visible token (sticker, digital badge) earned when a Check for Understanding is met — mastery-based and retry-friendly, never time-boxed or competitive.'
  ],
  unitSummatives: [
    { unit:'Unit 1', text:'Perform an 8-beat pattern showing one clear tempo AND one clear dynamic choice (see Week 3 check).' },
    { unit:'Unit 2', text:'Sight-read and clap an unfamiliar 2-measure rhythm pattern at 80%+ accuracy, then perform a self-composed 2-measure pattern.' },
    { unit:'Unit 3', text:'Sight-sing an unfamiliar 4-note melody using hand signs at 80%+ pitch accuracy.' },
    { unit:'Unit 4', text:'Correctly map the form (A/B sections) of a new 3-phrase song after one listen, and hold an independent drone/ostinato part for a full phrase.' }
  ],
  rubric: {
    levels: ['Emerging','Developing','Secure','Exceeding'],
    criteria: [
      { name:'Steady Beat & Rhythm', cells:['Needs support to keep a steady beat','Keeps beat with occasional drift','Keeps beat independently through the piece','Keeps beat and layers a second rhythmic part'] },
      { name:'Pitch & Melody', cells:['Sings with teacher support only','Sings most of the melody with accurate direction','Sings the full melody with accurate pitches','Sings independently and helps peers stay in tune'] },
      { name:'Reading Notation', cells:['Recognizes 1-2 symbols with prompting','Reads simple rhythm or pitch notation with support','Reads rhythm and pitch notation independently','Sight-reads a new short passage confidently'] },
      { name:'Expression & Confidence', cells:['Performs mechanically or hesitantly','Shows one expressive choice when prompted','Makes clear, intentional expressive choices','Performs with expressive nuance and stage presence'] }
    ]
  }
};

// ---- rendering: one card template + one detail-per-kind template, not 13 bespoke bodies ----
function curriculumCardHTML(kind, key, title, blurb){
  return '<div class="lessonCard" data-curric-kind="'+kind+'" data-curric-key="'+key+'"><div class="lessonTitle">'+title+'</div>'+
    '<div class="lessonBlurb">'+blurb+'</div></div>';
}
function curriculumUnitHeadHTML(title){ return '<div class="curricUnitHead">'+title+'</div>'; }
function renderCurriculumNav(){
  const parts = [curriculumCardHTML('overview','overview','Overview & Philosophy',
    'duration, tracks, teaching lineage, and the five design principles behind every week')];
  CURRICULUM_UNITS.forEach(u => {
    parts.push(curriculumUnitHeadHTML(u.title));
    u.weeks.forEach(w => parts.push(curriculumCardHTML('week', w.num, 'Week '+w.num+': '+w.title, w.bigIdea)));
  });
  parts.push(curriculumUnitHeadHTML('Capstone'));
  parts.push(curriculumCardHTML('capstone','capstone','Week 13: '+CURRICULUM_CAPSTONE.title, CURRICULUM_CAPSTONE.body));
  parts.push(curriculumUnitHeadHTML('Reference'));
  parts.push(curriculumCardHTML('assessment','assessment','Assessment Framework',
    'formative tools, the four unit summatives, and the capstone performance rubric'));
  document.getElementById('curriculumNav').innerHTML = parts.join('');
}
function curricRow(label, bodyHTML){ return '<div class="curricRow"><b>'+label+'</b>'+bodyHTML+'</div>'; }
function curricTableHTML(headers, rows){
  return '<table class="curricTable"><thead><tr>'+headers.map(h => '<th>'+h+'</th>').join('')+'</tr></thead>'+
    '<tbody>'+rows.map(r => '<tr>'+r.map(c => '<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
}
function renderOverviewDetail(){
  const m = CURRICULUM_META;
  document.getElementById('curriculumDetail').innerHTML =
    '<h3>Music Foundations: A Semester of First Music &amp; Theory</h3>'+
    '<p class="curricBigIdea">A curriculum for ages 5–12 that balances joyful curiosity with real musical fundamentals.</p>'+
    curricRow('Duration', '<p>'+m.duration+'</p>')+
    curricRow('Ages &amp; tracks', '<p>'+m.ages+' — '+m.tracks+'</p>')+
    curricRow('Format', '<p>'+m.format+'</p>')+
    curricRow('Assessment', '<p>'+m.assessment+'</p>')+
    '<h4>Teaching lineage</h4>'+
    curricTableHTML(['Master Teacher / Method','Core Idea','How Elorah Uses It'], CURRICULUM_LINEAGE.map(l => [l.teacher,l.idea,l.howUsed]))+
    '<h4>Five design principles</h4>'+
    CURRICULUM_PRINCIPLES.map(p => curricRow(p.title, '<p>'+p.body+'</p>')).join('')+
    '<h4>Track A vs. Track B</h4>'+
    curricTableHTML(['Aspect','Track A · Discoverers (5–8)','Track B · Builders (8–12)'], CURRICULUM_TRACKS.aspects.map(a => [a.label,a.a,a.b]))+
    curricRow('Bridge assessment', '<p>'+CURRICULUM_TRACKS.bridge+'</p>');
}
function findCurriculumWeek(num){
  for(const u of CURRICULUM_UNITS){ const w = u.weeks.find(x => x.num === num); if(w) return w; }
  return null;
}
function renderWeekDetail(num){
  const w = findCurriculumWeek(num); if(!w) return;
  let html = '<h3>Week '+w.num+': '+w.title+'</h3>'+
    '<p class="curricBigIdea">'+w.bigIdea+'</p>'+
    curricRow('Learning objectives', '<ul>'+w.objectives.map(o => '<li>'+o+'</li>').join('')+'</ul>')+
    curricRow('Curiosity hook', '<p>'+w.hook+'</p>')+
    curricRow('Fundamentals drill', '<p>'+w.drill+'</p>')+
    curricRow('Main activity', '<p>'+w.mainActivity+'</p>')+
    '<div class="curricTracks"><div><b>Track A (5–8)</b><p>'+w.trackA+'</p></div><div><b>Track B (8–12)</b><p>'+w.trackB+'</p></div></div>'+
    curricRow('Check for understanding', '<p>'+w.check+'</p>')+
    curricRow('Materials', '<p>'+w.materials+'</p>');
  if(w.activity === 'rhythm-blocks') html += rhythmBlocksHTML();
  document.getElementById('curriculumDetail').innerHTML = html;
  if(w.activity === 'rhythm-blocks') wireRhythmBlocks();
}
function renderCapstoneDetail(){
  document.getElementById('curriculumDetail').innerHTML =
    '<h3>Week '+CURRICULUM_CAPSTONE.num+': '+CURRICULUM_CAPSTONE.title+'</h3>'+
    '<p class="curricBigIdea">'+CURRICULUM_CAPSTONE.body+'</p>';
}
function renderAssessmentDetail(){
  const a = CURRICULUM_ASSESSMENT;
  document.getElementById('curriculumDetail').innerHTML =
    '<h3>Assessment Framework</h3>'+
    curricRow('Formative tools (used every week)', '<ul>'+a.formative.map(f => '<li>'+f+'</li>').join('')+'</ul>')+
    '<h4>Unit summative assessments</h4>'+
    '<ul>'+a.unitSummatives.map(u => '<li><b>'+u.unit+'</b> — '+u.text+'</li>').join('')+'</ul>'+
    '<h4>Capstone performance rubric</h4>'+
    curricTableHTML(['Criteria'].concat(a.rubric.levels), a.rubric.criteria.map(c => [c.name].concat(c.cells)));
}

// ---- Rhythm Blocks: Week 6's "Rhythm Architect" activity, made real ----
// From the curriculum's own appendix sketch: "draggable rhythm blocks (ta / ti-ti) that snap
// into a 4-beat measure frame, with a play button that claps back exactly what was built." Tap-
// based, not drag -- this app has zero drag-and-drop precedent anywhere (checked); mirrors the
// compose sequencer's slot/suggestion tap idiom instead (75_compose.js's #seqSlots/#sugg).
// Playback is its own small setTimeout-chained step loop, the same fixed-interval-sequencer
// shape as Bach's (97_bach_prelude.js) rather than the compose sequencer's continuous rAF tween
// -- there's no position to animate here, just "highlight slot N, play its sound, wait."
const RHYTHM_SLOTS = 8; // 2 measures of 4 -- Week 6's own "2-measure rhythm building" activity
let rhythmSeq = new Array(RHYTHM_SLOTS).fill(null), rhythmActive = 0;
let rhythmTimer = null, rhythmSubTimer = null, rhythmPos = 0, rhythmPlaying = false;
function getRhythmSeq(){ return rhythmSeq.slice(); }
function isRhythmPlaying(){ return rhythmPlaying; }
function rhythmBlocksHTML(){
  return '<div class="curricRow"><b>Try it — build a rhythm</b>'+
    '<div class="rhythmGrid" id="rhythmGrid"></div>'+
    '<div class="rhythmPalette" id="rhythmPalette"><button class="rhythmBlock" data-add="ta">ta</button><button class="rhythmBlock" data-add="titi">ti-ti</button></div>'+
    '<div class="pills" id="rhythmActions"><button id="rhythmPlayBtn">▶ play</button><button id="rhythmDelBtn">delete last</button><button id="rhythmClearBtn">clear</button></div>'+
    '</div>';
}
function renderRhythmGrid(){
  const grid = document.getElementById('rhythmGrid'); if(!grid) return;
  grid.innerHTML = rhythmSeq.map((v,k) =>
    '<div class="rhythmSlot'+(k===rhythmActive?' active':'')+(v?' filled':'')+(k===4?' bar':'')+'" data-slot="'+k+'">'+
      (v==='ta'?'ta':v==='titi'?'ti-ti':(k+1))+'</div>').join('');
}
function firstEmptyRhythmSlotFrom(k){
  for(let i=k;i<RHYTHM_SLOTS;i++) if(rhythmSeq[i] == null) return i;
  for(let i=0;i<RHYTHM_SLOTS;i++) if(rhythmSeq[i] == null) return i;
  return rhythmActive; // grid is full -- stay put, next tap will overwrite the active slot
}
function addRhythmBlock(kind){
  rhythmSeq[rhythmActive] = kind;
  rhythmActive = firstEmptyRhythmSlotFrom(rhythmActive+1);
  renderRhythmGrid();
}
function stopRhythm(){
  if(rhythmTimer){ clearTimeout(rhythmTimer); rhythmTimer = null; }
  if(rhythmSubTimer){ clearTimeout(rhythmSubTimer); rhythmSubTimer = null; }
  rhythmPlaying = false; rhythmPos = 0;
  document.querySelectorAll('#rhythmGrid .rhythmSlot.playing').forEach(el => el.classList.remove('playing'));
  const btn = document.getElementById('rhythmPlayBtn'); if(btn) btn.textContent = '▶ play';
}
function playRhythm(){
  stopRhythm();
  rhythmPlaying = true;
  const stepMs = 400, btn = document.getElementById('rhythmPlayBtn');
  function step(){
    if(rhythmPos >= RHYTHM_SLOTS){ stopRhythm(); return; }
    document.querySelectorAll('#rhythmGrid .rhythmSlot.playing').forEach(el => el.classList.remove('playing'));
    const el = document.querySelector('#rhythmGrid [data-slot="'+rhythmPos+'"]'); if(el) el.classList.add('playing');
    const v = rhythmSeq[rhythmPos];
    if(v === 'ta') playClap(true);
    else if(v === 'titi'){ playClap(false); rhythmSubTimer = setTimeout(() => playClap(false), stepMs/2); }
    if(btn) btn.textContent = '■ stop — beat '+(rhythmPos+1)+'/'+RHYTHM_SLOTS;
    rhythmPos++;
    rhythmTimer = setTimeout(step, stepMs);
  }
  step();
}
function wireRhythmBlocks(){
  rhythmSeq = new Array(RHYTHM_SLOTS).fill(null); rhythmActive = 0;
  renderRhythmGrid();
  document.getElementById('rhythmGrid').addEventListener('click', e => {
    const s = e.target.closest('[data-slot]'); if(!s) return;
    rhythmActive = +s.dataset.slot; renderRhythmGrid();
  });
  document.getElementById('rhythmPalette').addEventListener('click', e => {
    const b = e.target.closest('[data-add]'); if(b) addRhythmBlock(b.dataset.add);
  });
  document.getElementById('rhythmPlayBtn').onclick = () => { if(rhythmPlaying) stopRhythm(); else { unlockAudio(); playRhythm(); } };
  document.getElementById('rhythmDelBtn').onclick = () => {
    for(let k=RHYTHM_SLOTS-1;k>=0;k--) if(rhythmSeq[k] != null){ rhythmSeq[k] = null; rhythmActive = k; break; }
    renderRhythmGrid();
  };
  document.getElementById('rhythmClearBtn').onclick = () => { rhythmSeq = new Array(RHYTHM_SLOTS).fill(null); rhythmActive = 0; renderRhythmGrid(); };
}

function wireCurriculum(){
  renderCurriculumNav();
  document.getElementById('curriculumNav').addEventListener('click', e => {
    const c = e.target.closest('.lessonCard'); if(!c) return;
    document.querySelectorAll('#curriculumNav .lessonCard').forEach(x => x.classList.toggle('on', x===c));
    stopRhythm(); // navigating away from Week 6 mid-playback shouldn't keep clapping in the background
    const kind = c.dataset.curricKind;
    if(kind === 'overview') renderOverviewDetail();
    else if(kind === 'week') renderWeekDetail(+c.dataset.curricKey);
    else if(kind === 'capstone') renderCapstoneDetail();
    else if(kind === 'assessment') renderAssessmentDetail();
  });
}
