# Sound for the clip explainer: an original soft lo-fi bed (pad + plucked arpeggio + light drums, all synthesized),
# ducked under the narration, plus UI sounds on the script's own cue words: a whoosh per scene, soft pops when cards
# appear, typing for links/comments, a riser into the chat spike, a cash sting on the hot number, a sparkle on the logo.
# usage: python audio/clip_mix.py <script.json> <words.json> <voice.wav> <total seconds> <out.wav>
import json, sys
import numpy as np
from dsp import SR, ns, tt, rng, pan, place, dbg, lp, hp, bp, fades, make_ir, convolve_st, integrated, true_peak, read_wav, write_wav
import instruments as I
from sfx_gen import whoosh

script = json.load(open(sys.argv[1]))
words = json.load(open(sys.argv[2]))
voice, vsr = read_wav(sys.argv[3])
assert vsr == SR, vsr
DUR = float(sys.argv[4]); OUT = sys.argv[5]
N = ns(DUR)
r = rng(11)
F = I.m2f

by_line = {}
for w in words: by_line.setdefault(w["line"], []).append(w["start"])
def T(at, fb=None):
    if not at: return fb
    l = by_line.get(at[0])
    if not l: return fb
    return max(0.0, l[min(at[1], len(l) - 1)] - 0.1)

scenes = sorted(script["scenes"], key=lambda s: T(s["at"], 0) if s["at"] != [0, 0] else 0)

# ---------------------------------------------------------------- music bed (92 bpm, 4-chord loop)
BPM = 92; B = 60 / BPM; BAR = 4 * B
CHORDS = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]  # Fmaj7 Em7 Dm7 Cmaj7
music = np.zeros((2, N + SR * 3))

def kick(vel=0.8):
    t = tt(0.32); f = 48 + 90 * np.exp(-t / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12) * vel
def hat(vel=0.25):
    t = tt(0.06); return hp(r.standard_normal(len(t)), 7000) * np.exp(-t / 0.012) * vel
def snap(vel=0.35):
    t = tt(0.18); return bp(r.standard_normal(len(t)), 1200, 4500) * np.exp(-t / 0.035) * vel

bars = int(DUR / BAR) + 2
for b in range(bars):
    t0 = b * BAR; ch = CHORDS[b % 4]
    if t0 > DUR + 1: break
    place(music, I.pad([F(m) for m in ch], BAR * 0.98, vel=0.22, r=rng(b), att=0.25, rel=0.6, warm=1400), t0)
    place(music, pan(I.pluck(F(ch[0] - 12), vel=0.55, r=rng(b + 50), dur=1.4), 0), t0)
    place(music, pan(I.pluck(F(ch[0] - 12), vel=0.4, r=rng(b + 60), dur=1.0), 0), t0 + 2.5 * B)
    arp = [ch[1] + 12, ch[2] + 12, ch[3] + 12, ch[2] + 12, ch[1] + 12, ch[3] + 12, ch[2] + 12, ch[0] + 24]
    for k, m in enumerate(arp):
        place(music, pan(I.pluck(F(m), vel=0.16 + 0.05 * (k % 2 == 0), r=rng(b * 9 + k), dur=0.7, bright=0.7), 0.35 * (1 if k % 2 else -1)), t0 + k * B / 2)
    if b >= 1:  # drums enter after the first bar
        for k in range(4):
            if k in (0, 2): place(music, pan(kick(0.55), 0), t0 + k * B)
            if k in (1, 3): place(music, pan(snap(0.22), 0.1), t0 + k * B)
        for k in range(8): place(music, pan(hat(0.10 + 0.05 * (k % 2)), -0.25), t0 + k * B / 2 + (0.012 if k % 2 else 0))
music = lp(music, 9000)
music = music[:, :N]
music[:, -ns(2.0):] *= np.linspace(1, 0, ns(2.0))[None, :] ** 1.5

# duck under speech: -10 dB with smooth attack/release
env = np.ones(N)
for w in words:
    a, b2 = ns(max(0, w["start"] - 0.06)), ns(min(DUR, w["end"] + 0.15))
    env[a:b2] = dbg(-10)
k = ns(0.12); env = np.convolve(env, np.ones(k) / k, mode="same")
music *= env[None, :]

# ---------------------------------------------------------------- SFX
sfx = np.zeros((2, N + SR * 2))
def pop_s(f0=900, vel=0.22):
    t = tt(0.12); f = f0 * (1 + 0.6 * np.exp(-t / 0.02))
    return fades(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.035) * vel, 0.001, 0.02)
def click(vel=0.14):
    t = tt(0.03); return bp(r.standard_normal(len(t)), 2000, 6000) * np.exp(-t / 0.004) * vel
def riser(dur=1.4, vel=0.25):
    t = tt(dur); x = bp(r.standard_normal(len(t)), 500, 6000) * (t / dur) ** 2.5 * vel
    return x + np.sin(2 * np.pi * np.cumsum(220 + 600 * (t / dur) ** 2) / SR) * (t / dur) ** 3 * vel * 0.4
def cash(vel=0.4):
    out = np.zeros(ns(1.6))
    for i, m in enumerate([88, 93]):
        g = I.glock(F(m), vel=vel, r=rng(90 + i), dur=1.4); s0 = ns(0.08 * i); out[s0:s0 + len(g)] += g[: len(out) - s0]
    return out
def sparkle(vel=0.3):
    out = np.zeros(ns(1.8))
    for i, m in enumerate([84, 88, 91, 96]):
        g = I.glock(F(m), vel=vel, r=rng(70 + i), dur=1.2); s0 = ns(0.06 * i); out[s0:s0 + len(g)] += g[: len(out) - s0]
    return out

last_pop = -1.0
def add_pop(t, f0=900):
    global last_pop
    if t is None or t - last_pop < 0.18: return
    last_pop = t; place(sfx, pan(pop_s(f0 + r.uniform(-60, 120)), r.uniform(-0.3, 0.3)), t)

for i, s in enumerate(scenes):
    a = T(s["at"], 0) if s["at"] != [0, 0] else 0.0
    if i > 0: place(sfx, pan(whoosh(0.5, rng(i), peak=0.22, f_lo=500, f_hi=3000, tail=0.18) * 0.32, (-0.4, 0.4)[i % 2]), max(0, a - 0.2))
    for key, v in s.items():  # nested cue points → pops
        vals = v if isinstance(v, list) and v and isinstance(v[0], dict) else [v] if isinstance(v, dict) else []
        for it in vals:
            if isinstance(it, dict) and it.get("at"): add_pop(T(it["at"]), 1150 if it.get("hot") else 900)
    ty = s["type"]
    if ty == "brand": place(sfx, pan(sparkle(), 0), T(s.get("logoAt"), a + 0.4))
    if ty == "stat":
        hot = [e for e in s.get("eq", []) if e.get("hot")]
        if hot: place(sfx, pan(cash(), 0), T(hot[0]["at"]))
    if ty == "live":
        tsp = T(s.get("spikeAt"), a + 2.5); place(sfx, pan(riser(1.2), 0), max(0, tsp - 1.2))
        tl = T(s["link"]["at"], a + 0.3)
        for k in range(len(s["link"]["text"])): place(sfx, pan(click(), 0.2), tl + k * 0.04 + r.uniform(0, 0.01))
        add_pop(T(s.get("momentAt")), 1300)
    if ty == "cta":
        ty0 = T(s.get("typeAt"), a + 0.5)
        for k in range(4): place(sfx, pan(click(0.2), 0.1), ty0 + k * 0.09)
        place(sfx, pan(pop_s(1400, 0.3), 0), T(s.get("postAt"), a + 1.2)); place(sfx, pan(sparkle(0.25), 0), T(s.get("doneAt"), a + 1.8))
    if ty == "phone": place(sfx, pan(whoosh(0.6, rng(77), peak=0.3, tail=0.2) * 0.3, 0), T(s.get("flipAt"), a + 1.5))
sfx = sfx[:, :N]

# ---------------------------------------------------------------- voice + mix
v = voice[0] if voice.shape[0] == 1 else voice.mean(0)
vb = np.zeros(N); vb[: min(N, len(v))] = v[:N]
vst = pan(vb, 0)
room = make_ir(0.35, 3)
vst = vst * 0.92 + convolve_st(vst, room)[:, :N] * 0.06

def lufs(x): return integrated(x)
vst *= dbg(-17 - lufs(vst))
music *= dbg(-31 - lufs(music))
sfx *= dbg(-27 - lufs(sfx)) if np.abs(sfx).max() > 0 else 1
mix = vst + music + sfx
mix *= dbg(-14 - lufs(mix))
mix = np.tanh(mix * 1.2) / 1.2  # gentle safety clip
pk = true_peak(mix)
if pk > -1.2: mix *= dbg(-1.2 - pk)
write_wav(OUT, mix, bits=16)
print("mix", OUT, "LUFS", round(lufs(mix), 1), "TP", round(true_peak(mix), 1), "dur", round(mix.shape[1] / SR, 2))
