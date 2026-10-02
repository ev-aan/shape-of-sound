# Head-tracked 3D demos

Two browser demos where your head movement (seen by a camera) changes the perspective on screen.

- `box3d.html` - real 3D "window into a box" (off-axis projection). The stronger effect.
- `index.html` - simple layered parallax landscape (first test).

## Run (Mac Terminal)

    cd ~/Documents/shape-of-sound
    git pull origin claude/ecstatic-goodall-5gfemf
    cd head-parallax-mvp
    python3 -m http.server 8000

Then open http://localhost:8000/box3d.html (or index.html) in Chrome or Safari.
Stop the server with Ctrl+C.

## Use

1. Click "Use webcam head tracking", allow the camera, pick it from the dropdown.
2. Set "Screen width" to your monitor's real width in cm (36" 16:9 is about 80 cm).
3. Press F for full screen, H to hide the panel.
4. Wrong direction? Tick "Flip left/right".

Without a camera, moving the mouse works as a stand-in.

## Notes

- Webcam mode loads a face-detection library from the internet (needs a connection).
- Tracking is face position only (no true depth), so expect some wobble.
- Ideas next: sound-reactive scene, other scenes, smoother tracking,
  Face ID iPhone for precise head/eye tracking, real wallpaper on Windows.
