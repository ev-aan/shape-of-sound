"""
Harmonic Resonance Manifold -- proof-of-concept engine.

What this does, in plain language:
  1. Builds every common triad and seventh chord (pitch-class, one voicing each).
  2. Turns each chord into a "harmonic spectrum": every note plus its first 32
     overtones, with a realistic amplitude roll-off.
  3. Measures how acoustically SIMILAR every pair of chords is, by how much
     their spectra overlap (shared partials => simple frequency ratios => high
     similarity). Distance = 1 - similarity.
  4. Embeds that distance matrix into 3D with CLASSICAL MDS -- a deterministic,
     eigenvalue-based method. Same input always gives the same positions (up to a
     sign flip), which is what makes each chord's location well-defined.

It is deliberately small and readable so you can extend it. The two knobs most
worth playing with are TUNING ('ET' or 'JI') and the similarity definition.
"""

import numpy as np

# ----------------------------------------------------------------------------
# 1. NOTES, TUNING, FREQUENCIES
# ----------------------------------------------------------------------------

NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

# Just-intonation ratios for each interval in semitones, relative to the root.
# (Used only when TUNING = 'JI'. Covers 0..14 semitones so we can voice add9.)
JI_RATIOS = {
    0: 1/1,   1: 16/15, 2: 9/8,  3: 6/5,  4: 5/4,  5: 4/3,  6: 45/32,
    7: 3/2,   8: 8/5,   9: 5/3,  10: 16/9, 11: 15/8, 12: 2/1,
    13: 32/15, 14: 9/4,
}

def midi_to_freq_ET(midi):
    """Equal temperament, A4 (midi 69) = 440 Hz."""
    return 440.0 * 2 ** ((midi - 69) / 12)

ROOT_MIDI_BASE = 60  # we voice each chord's root in the octave starting at C4

def note_frequencies(root_pc, intervals, tuning='ET'):
    """Actual Hz for every note in one chord, in a fixed close voicing."""
    root_midi = ROOT_MIDI_BASE + root_pc
    if tuning == 'ET':
        return [midi_to_freq_ET(root_midi + iv) for iv in intervals]
    else:  # 'JI' -- ratios stacked on the root's frequency
        root_f = midi_to_freq_ET(root_midi)
        return [root_f * JI_RATIOS[iv] for iv in intervals]


# ----------------------------------------------------------------------------
# 2. CHORD DICTIONARY  (suffix -> intervals in semitones from the root)
# ----------------------------------------------------------------------------

QUALITIES = {
    'maj':   [0, 4, 7],
    'min':   [0, 3, 7],
    'dim':   [0, 3, 6],
    'aug':   [0, 4, 8],
    'sus2':  [0, 2, 7],
    'sus4':  [0, 5, 7],
    '7':     [0, 4, 7, 10],   # dominant 7
    'maj7':  [0, 4, 7, 11],
    'min7':  [0, 3, 7, 10],
    'm7b5':  [0, 3, 6, 10],   # half-diminished
    'dim7':  [0, 3, 6, 9],
    'mMaj7': [0, 3, 7, 11],   # minor-major 7
    '6':     [0, 4, 7, 9],    # major 6 (added tone)
    'add9':  [0, 4, 7, 14],   # added tone (9th voiced an octave up)
}

# Group qualities into broader families just for coloring the plot.
FAMILY = {
    'maj': 'major', 'maj7': 'major', '6': 'major', 'add9': 'major',
    'min': 'minor', 'min7': 'minor', 'mMaj7': 'minor',
    '7': 'dominant',
    'dim': 'diminished', 'dim7': 'diminished', 'm7b5': 'diminished',
    'aug': 'augmented',
    'sus2': 'suspended', 'sus4': 'suspended',
}

def build_chords(tuning='ET'):
    """Every root x quality, de-duplicated by pitch-class SET.

    De-duping by set keeps all 12 transpositions of ordinary chords (C maj and
    G maj are different sets) but automatically collapses the symmetric chords
    (e.g. C aug = E aug = G# aug are the identical set {0,4,8}).
    """
    chords = []
    seen = set()
    for root_pc in range(12):
        for suffix, intervals in QUALITIES.items():
            pc_set = frozenset((root_pc + iv) % 12 for iv in intervals)
            if pc_set in seen:
                continue
            seen.add(pc_set)
            chords.append({
                'name': NOTE_NAMES[root_pc] + suffix,
                'family': FAMILY[suffix],
                'freqs': note_frequencies(root_pc, intervals, tuning),
            })
    return chords


# ----------------------------------------------------------------------------
# 3. HARMONIC SPECTRUM  (each note -> 32 overtones, amplitude ~ 1/k)
# ----------------------------------------------------------------------------

N_HARMONICS = 32

def chord_partials(freqs):
    """Return (frequencies, amplitudes) for all overtones of all notes."""
    fs, amps = [], []
    for f in freqs:
        for k in range(1, N_HARMONICS + 1):
            fs.append(k * f)
            amps.append(1.0 / k)        # realistic overtone roll-off
    return np.array(fs), np.array(amps)

# A log-frequency grid (in semitones above C4). Partials land on this grid as
# small Gaussian bumps so near-coincident partials still overlap -- that is what
# rewards simple integer ratios.
REF_FREQ = midi_to_freq_ET(ROOT_MIDI_BASE)   # C4
GRID = np.arange(0.0, 96.0, 0.1)             # 0..8 octaves, 0.1-semitone bins
SIGMA = 0.30                                  # bump width in semitones

def spectrum_vector(freqs):
    """Smoothed log-frequency amplitude vector for one chord."""
    fs, amps = chord_partials(freqs)
    pitches = 12 * np.log2(fs / REF_FREQ)     # convert Hz -> semitones on grid
    vec = np.zeros_like(GRID)
    span = int(np.ceil(3 * SIGMA / 0.1))      # how many bins a bump touches
    for p, a in zip(pitches, amps):
        if p < GRID[0] or p > GRID[-1]:
            continue
        c = int(round((p - GRID[0]) / 0.1))
        lo, hi = max(0, c - span), min(len(GRID), c + span + 1)
        vec[lo:hi] += a * np.exp(-0.5 * ((GRID[lo:hi] - p) / SIGMA) ** 2)
    return vec


# ----------------------------------------------------------------------------
# 4. ROUGHNESS  (Sethares / Plomp-Levelt) -- a per-chord dissonance score
# ----------------------------------------------------------------------------

def roughness(freqs):
    fs, amps = chord_partials(freqs)
    order = np.argsort(fs)
    fs, amps = fs[order], amps[order]
    total = 0.0
    for i in range(len(fs)):
        fi, ai = fs[i], amps[i]
        for j in range(i + 1, len(fs)):
            fj, aj = fs[j], amps[j]
            diff = fj - fi
            if diff > 0.6 * fi:               # beyond the roughness band; stop
                break
            s = 0.24 / (0.0207 * fi + 18.96)
            total += ai * aj * (np.exp(-3.5 * s * diff) - np.exp(-5.75 * s * diff))
    return total


# ----------------------------------------------------------------------------
# 5. DISTANCE MATRIX + DETERMINISTIC 3D EMBEDDING (classical MDS)
# ----------------------------------------------------------------------------

def distance_matrix(chords):
    V = np.array([spectrum_vector(c['freqs']) for c in chords])
    norms = np.linalg.norm(V, axis=1, keepdims=True)
    Vn = V / norms
    sim = Vn @ Vn.T                           # cosine similarity, in [0,1]
    D = np.sqrt(np.maximum(0.0, 1.0 - sim))   # similarity -> distance
    np.fill_diagonal(D, 0.0)
    return D

def classical_mds(D, dims=3):
    n = D.shape[0]
    D2 = D ** 2
    J = np.eye(n) - np.ones((n, n)) / n       # centering matrix
    B = -0.5 * J @ D2 @ J
    vals, vecs = np.linalg.eigh(B)            # ascending; symmetric -> real
    idx = np.argsort(vals)[::-1]              # largest first
    vals, vecs = vals[idx], vecs[:, idx]
    pos_vals = np.clip(vals, 0, None)
    coords = vecs[:, :dims] * np.sqrt(pos_vals[:dims])
    var_explained = pos_vals[:dims].sum() / pos_vals.sum()
    return coords, var_explained, pos_vals


def build_everything(tuning='ET'):
    chords = build_chords(tuning)
    for c in chords:
        c['roughness'] = roughness(c['freqs'])
    D = distance_matrix(chords)
    coords, var3, eig = classical_mds(D, dims=3)
    return chords, D, coords, var3, eig


if __name__ == '__main__':
    chords, D, coords, var3, eig = build_everything('ET')
    print(f"chords: {len(chords)}")
    cum = np.cumsum(np.clip(eig, 0, None)) / np.clip(eig, 0, None).sum()
    print(f"variance explained -- 1D {cum[0]:.0%}  2D {cum[1]:.0%}  3D {cum[2]:.0%}")
