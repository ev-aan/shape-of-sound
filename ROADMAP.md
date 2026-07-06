# Roadmap

## Reference point

[Brian Calli's "Illustrated" method books](https://briancallimusic.com/en/libros) are a
useful outside reference for where this project is headed. Their approach, distilled:

- **Visual-first, not notation-first.** Harmony explained with shapes, arrows, and colour
  instead of (or alongside) staff notation — "the graphics speak for themselves."
- **Instrument-agnostic.** The theory content doesn't assume piano, guitar, or any one
  instrument.
- **Topical, not graded.** Content is organized by subject (harmony → modes → extensions →
  arranging) and gets cumulatively more advanced, rather than being bucketed into strict
  beginner/intermediate/advanced levels.
- **Small reusable interactive tools**, not one monolithic app: they ship several
  purpose-built visualizers (a polychord viewer, a frequency/interval visualizer, a chord
  "superstructure" map, a harmonizer, a neighbouring-chords explorer, a piano-roll view),
  each doing one thing, all sharing a common visual language.
- **Self-explanatory diagrams + short supporting text**, not long-form prose.

That maps onto what this project is already doing, structurally — we should keep leaning
into it rather than drift toward either a notation-only tool or a single do-everything
screen.

## Where we already match this vision

- **One consistent colour language everywhere** (`Palette`) — pitch class → colour is the
  same on the circle of fifths, the keyboard, and now the staff. This is our version of
  their colour-coding principle, and it's a real differentiator: it's already wired through
  every surface, not just one diagram.
- **Small, composable visual tools, not a monolith** — the `Surfaces` registry
  (`cof`, `keyboard`, `staff`) and `Modes` registry (`science`, `musical`, `play`) exist
  specifically so a new diagram or a new teaching mode is one file, not a rewrite. This is
  structurally the same idea as their suite of small apps (Polychords, Harmonizer, etc.).
- **Instrument-agnostic data model** — the measure/score engine
  ([89_surface_staff.js](src/js/89_surface_staff.js)) stores plain `{midi, dur}` data, not
  anything staff- or piano-specific, so a future fretboard or other instrument surface can
  read the same lesson data.
- **A real acoustic grounding they don't have** — the 3D overtone-distance map (Science
  mode) derives chord relationships from actual overtone-overlap physics, not just
  theory-as-given. Worth keeping and building on as a differentiator, not diluting it in
  the name of matching their approach.
- **Topical progression already forming** — Musical mode already goes circle → chord
  rings (diatonic function) → chord-tone breakdown → staff/measure engine → a real piece
  (Bach). That's the same "cumulative, not graded" shape they use.

## Gaps their catalog highlights — scheduled

Things in their lineup we don't have an equivalent of yet. All five are now scheduled,
in priority order (cheapest / most-reused-infrastructure first):

1. **Voice-leading / motion arrows.** *(done — [93_mode_musical.js](src/js/93_mode_musical.js))*
   Selecting a new chord now draws a thin arrow from each note of the previous chord to its
   nearest note in the new one (skipping common tones), on the circle — the same
   nearest-pitch-class logic `vlDist` already used for its distance score, now surfaced
   visually instead of only as a number. Still open: the same idea on the staff, once a
   passage (not just an isolated chord pair) is on screen at once.
2. **Interval visualizer.** A focused, reusable "distance between these two notes" diagram
   (semitone count, ratio, consonance) — smaller in scope than the full 3D map, good as
   its own small `Surfaces` entry.
3. **Chord "superstructure" / extensions view.** A stacked-thirds diagram (root → 3rd →
   5th → 7th → 9th → 11th → 13th) showing how extended chords build on triads — a natural
   companion to the chord-tone text label we already show above each measure.
4. **Neighbouring-chords explorer.** Systematic "what else is one common tone / one
   semitone away from this chord" — related to suggestions but framed as exploration
   rather than "what's next in a progression."
5. **A spatial/piano-roll view.** We have a keyboard surface already
   (`89_surface_keyboard.js`); a piano-roll (time along one axis, pitch along the other) is
   a distinct, useful layout for showing a whole passage at a glance — could share the
   same measure data as the staff engine.

None of these need a new architectural seam — they're all new `Surfaces` entries or
extensions of existing ones, which is exactly the point of that registry.

## Principles to hold the line on

- **Instrument-agnostic data, instrument-specific rendering.** Keep pitch/duration/voice
  data free of staff- or keyboard-specific assumptions so new surfaces (fretboard, etc.)
  can reuse it later.
- **One colour system, everywhere new.** Any new visual should use `Palette`, not invent
  its own colour logic.
- **Small self-contained tools over one growing screen.** Prefer a new `Surfaces` entry or
  `Modes` entry to bolting more state onto an existing one.
- **Diagram first, text second.** Keep captions/labels short; let the shape carry the
  meaning, the way the chord-tone label and key-signature glyphs already do.
- **Cumulative topics, not locked grade levels.** Keep structuring new teaching content the
  way Musical mode already flows (circle → function → tones → notation → real piece),
  usable by a first-time learner or an advanced student depending how far they go, not
  gated behind a level select.

## Other deferred work (not yet scheduled)

- Tuplet and tie support in the measure engine (deferred from the original staff-engine
  plan; still open).
- A lesson-content browser once there are enough small modules to need one (explicitly
  deferred until then — no browser UI for a single module).
- A second instrument surface (fretboard) once a second surface is actually needed by real
  content, to keep the instrument-agnostic data model honest.
