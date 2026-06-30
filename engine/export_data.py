import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')
os.makedirs(DATA_DIR, exist_ok=True)

"""Compute the manifold and write a compact JSON the web scene reads.

Outputs nodes (name, family, 3D position, note frequencies, consonance),
edges (each node's strongest shared-overtone links), and a few demo
progressions referenced by node index.
"""
import json
import numpy as np
import harmonic_manifold as h

TUNING = 'ET'
TOP_K = 6          # keep each chord's K strongest links -> a clean skeleton

chords, D, coords, var3, eig = h.build_everything(TUNING)
n = len(chords)
names = [c['name'] for c in chords]

# cosine overlap weight w in [0,1]: high = many coinciding overtones
W = np.clip(1.0 - D ** 2, 0.0, 1.0)
np.fill_diagonal(W, 0.0)

# normalise positions to a tidy cube
P = coords - coords.mean(0)
P = P / np.abs(P).max() * 100.0

# consonance for sizing/glow: smoother (less rough) -> larger
rough = np.array([c['roughness'] for c in chords])
cons = 1.0 - (rough - rough.min()) / (rough.max() - rough.min())

# edges: union of each node's top-K strongest links (dedupe i<j)
edge_set = {}
for i in range(n):
    for j in np.argsort(W[i])[::-1][:TOP_K]:
        a, b = sorted((i, int(j)))
        if a != b:
            edge_set[(a, b)] = float(W[a, b])
edges = [{'i': a, 'j': b, 'w': round(w, 4)} for (a, b), w in edge_set.items()]

def chord_features(c):
    f = np.array(c['freqs'])
    order = np.argsort(f)
    midi = np.round(69 + 12 * np.log2(f / 440)).astype(int)
    pc = midi % 12
    root = int(pc[order[0]])
    ivs = []
    for k in order:                      # intervals from root, low->high, unique
        iv = (int(pc[k]) - root) % 12
        if iv not in ivs:
            ivs.append(iv)
    q = next((s for s, qi in h.QUALITIES.items()
              if tuple(sorted(set(i % 12 for i in qi))) == tuple(sorted(ivs))), '?')
    return root, (root * 7) % 12, q, len(f), ivs

nodes = []
for i, c in enumerate(chords):
    root, cof, q, nnotes, ivs = chord_features(c)
    nodes.append({
        'name': c['name'],
        'family': c['family'],
        'x': round(float(P[i, 0]), 2),
        'y': round(float(P[i, 1]), 2),
        'z': round(float(P[i, 2]), 2),
        'freqs': [round(float(f), 2) for f in c['freqs']],
        'cons': round(float(cons[i]), 3),
        'root': root, 'cof': cof, 'q': q, 'n': nnotes, 'ivs': ivs,
        'pcs': sorted(set((root + iv) % 12 for iv in ivs)),
    })

def idx(name):
    return names.index(name)

progressions = {
    'ii\u2013V\u2013I (jazz)':       ['Dmin7', 'G7', 'Cmaj7'],
    'I\u2013V\u2013vi\u2013IV (pop)': ['Cmaj', 'Gmaj', 'Amin', 'Fmaj'],
    'I\u2013vi\u2013IV\u2013V (50s)': ['Cmaj', 'Amin', 'Fmaj', 'Gmaj'],
    '12-bar blues':            ['C7', 'F7', 'C7', 'C7', 'F7', 'F7',
                                'C7', 'C7', 'G7', 'F7', 'C7', 'G7'],
}
prog_idx = {label: [idx(nm) for nm in seq] for label, seq in progressions.items()}

data = {
    'nodes': nodes,
    'edges': edges,
    'progressions': prog_idx,
    'W': [[round(float(x), 3) for x in row] for row in W],
    'axisVar': [round(float(v), 4) for v in (np.clip(eig, 0, None)[:3] / np.clip(eig, 0, None).sum())],
    'var3': round(float(var3), 3),
    'w_min': round(float(min(e['w'] for e in edges)), 4),
    'w_max': round(float(max(e['w'] for e in edges)), 4),
}
with open(os.path.join(DATA_DIR, 'manifold_data.json'), 'w') as f:
    json.dump(data, f)
print(f"nodes {len(nodes)}  edges {len(edges)}  "
      f"w range {data['w_min']}-{data['w_max']}  3D var {var3:.0%}")


# also (re)generate the tiny silent WAV used to unlock iOS audio
import struct, base64
_sr = 8000; _d = b'\x00\x00'
_hdr = (b'RIFF' + struct.pack('<I', 36 + len(_d)) + b'WAVEfmt ' +
        struct.pack('<IHHIIHH', 16, 1, 1, _sr, _sr * 2, 2, 16) +
        b'data' + struct.pack('<I', len(_d)) + _d)
open(os.path.join(DATA_DIR, 'silent_wav.txt'), 'w').write(
    'data:audio/wav;base64,' + base64.b64encode(_hdr + _d).decode())
print('wrote data/manifold_data.json and data/silent_wav.txt')
