"""Assemble the single self-contained offline HTML from modular sources.

  python build/build.py   ->  dist/shape_of_music.html

Concatenates every src/js/*.js (in filename order) inside one IIFE, then inlines
the CSS, three.js, the data JSON and the silent-wav into src/shell.html.
"""
import os, glob

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
def read(rel): return open(os.path.join(ROOT, rel), encoding='utf-8').read()

three  = read('vendor/three.min.js')
data   = read('data/manifold_data.json')
silent = read('data/silent_wav.txt').strip()
css    = read('src/styles.css')
shell  = read('src/shell.html')

js_files = sorted(glob.glob(os.path.join(ROOT, 'src', 'js', '*.js')))
app = '(function(){"use strict";\n' + '\n'.join(
    open(f, encoding='utf-8').read() for f in js_files) + '\n})();'

html = (shell.replace('%%THREEJS%%', three)
             .replace('%%DATA%%', data)
             .replace('%%SILENT%%', silent)
             .replace('%%CSS%%', css)
             .replace('%%APP%%', app))

os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
out = os.path.join(ROOT, 'dist', 'shape_of_music.html')
open(out, 'w', encoding='utf-8').write(html)
print('built', out, round(len(html) / 1e6, 2), 'MB from', len(js_files), 'modules')
