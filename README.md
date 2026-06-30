# The Shape of Music

An interactive 3D map of Western harmony where every chord's position is derived
*only* from the physics of its overtones — not from music theory. Built as a single
self-contained HTML file that runs offline (including on iPhone).

The pipeline measures the harmonic distance between all 127 common chords (how much
their overtone spectra overlap), embeds them in 3D with classical MDS, and renders an
explorable scene. On top of that sit learning layers: a circle-of-fifths "Explained"
layout, custom musical axes, a key/function overlay with Roman numerals, an overtone
microscope, a 16-bar composer with smart next-chord suggestions, a "clouds of sound"
spectral render, and a 2D/3D waveform builder.

## Layout

```
engine/    Python: the science (chord distances + MDS) -> data/manifold_data.json
src/       the app, split by feature
  shell.html      HTML skeleton with %%CSS%% %%THREEJS%% %%DATA%% %%APP%% slots
  styles.css
  js/*.js         one file per feature, concatenated in filename order
vendor/    three.min.js (r128), vendored for offline builds
data/      generated chord data + silent-wav (regenerate with engine/export_data.py)
build/     build.py — stitches everything into one offline HTML
dist/      shape_of_music.html  (the file you open / publish)
tests/     headless smoke test (stubs three.js + the DOM)
```

## Build & run

```bash
# 1. (optional) regenerate the chord data — needs numpy + scipy
pip install numpy scipy
python engine/export_data.py

# 2. build the single offline file
python build/build.py            # -> dist/shape_of_music.html

# 3. open dist/shape_of_music.html in a browser (Safari recommended on iOS)
```

To test:

```bash
node tests/test.js               # build first
```

## Editing

Each feature lives in its own `src/js/*.js` file sharing one scope (the build wraps
them all in a single IIFE, so no imports/exports). Change a feature, run
`python build/build.py`, refresh. Files are numbered to keep load order.

## Publishing (GitHub Pages)

Commit `dist/shape_of_music.html`, enable Pages on the repo, and the file is live at a
URL you can open anywhere.

## Notes

- **iOS sound:** Web Audio is muted by the hardware Silent switch even in Safari. Flip
  it off and turn the volume up; the in-app file viewer may block audio entirely — use
  Safari.
- The 3D view captures ~42% of the full harmonic structure (it is genuinely higher-
  dimensional), which is why the "Discovered" cloud looks tangled and the circle of
  fifths only fully resolves in the "Explained" / "Musical axes" layouts.
