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

def build_tuning(tuning):
    chords, D, coords, var3, eig = h.build_everything(tuning)
    W = np.clip(1.0 - D ** 2, 0.0, 1.0)
    np.fill_diagonal(W, 0.0)
    P = coords - coords.mean(0)
    return chords, D, P, var3, eig, W

# --- ET is the reference frame ---
chords, D, P_et, var3, eig, W = build_tuning('ET')
n = len(chords)
names = [c['name'] for c in chords]

# --- JI computed independently, then aligned onto ET so the morph is meaningful ---
chords_ji, D_ji, P_ji_raw, var3_ji, eig_ji, W_ji = build_tuning('JI')

# shared scale factor so both worlds are the same size
_scale = np.abs(P_et).max()
P_et = P_et / _scale * 100.0
P_ji_raw = P_ji_raw / np.abs(P_ji_raw).max() * 100.0

# Procrustes: find orthogonal R (rotation+reflection) that best maps JI onto ET.
# Chords whose physics is tuning-invariant then stay put; the rest visibly shift.
_M = P_ji_raw.T @ P_et
_U, _s, _Vt = np.linalg.svd(_M)
_R = _U @ _Vt
P_ji = P_ji_raw @ _R

# consonance per tuning
def cons_of(chords):
    rough = np.array([c['roughness'] for c in chords])
    return 1.0 - (rough - rough.min()) / (rough.max() - rough.min())
cons = cons_of(chords)
cons_ji = cons_of(chords_ji)
P = P_et  # keep the old variable name for the ET write-out below

# edges: union of each node's top-K strongest links (dedupe i<j)
def build_edges(Wm):
    es = {}
    for i in range(n):
        for j in np.argsort(Wm[i])[::-1][:TOP_K]:
            a, b = sorted((i, int(j)))
            if a != b:
                es[(a, b)] = float(Wm[a, b])
    return [{'i': a, 'j': b, 'w': round(w, 4)} for (a, b), w in es.items()]
edges = build_edges(W)
edges_ji = build_edges(W_ji)

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
        'jx': round(float(P_ji[i, 0]), 2),
        'jy': round(float(P_ji[i, 1]), 2),
        'jz': round(float(P_ji[i, 2]), 2),
        'freqs': [round(float(f), 2) for f in c['freqs']],
        'freqsJI': [round(float(f), 2) for f in chords_ji[i]['freqs']],
        'cons': round(float(cons[i]), 3),
        'consJI': round(float(cons_ji[i]), 3),
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
    'edgesJI': edges_ji,
    'progressions': prog_idx,
    'W': [[round(float(x), 3) for x in row] for row in W],
    'WJI': [[round(float(x), 3) for x in row] for row in W_ji],
    'axisVar': [round(float(v), 4) for v in (np.clip(eig, 0, None)[:3] / np.clip(eig, 0, None).sum())],
    'axisVarJI': [round(float(v), 4) for v in (np.clip(eig_ji, 0, None)[:3] / np.clip(eig_ji, 0, None).sum())],
    'var3': round(float(var3), 3),
    'var3JI': round(float(var3_ji), 3),
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
