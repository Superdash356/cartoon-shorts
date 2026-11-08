# Generic sound for any story.json short: an original score whose sections follow each shot's "music" mode
# (groove | stop | nervous | sad | pad | lift | end), default SFX per shot type, cue-driven SFX for the cues the story
# defines, and the narration on top with the music ducked under it.
# usage: python audio/story_mix.py <story.json> <words.json> <voice.wav> <total seconds> <out.wav>
import json, sys
import numpy as np
from dsp import SR, ns, tt, rng, pan, place, dbg, lp, hp, bp, fades, make_ir, convolve_st, integrated, true_peak, read_wav, write_wav, widen
import instruments as I

story = json.load(open(sys.argv[1]))
words = json.load(open(sys.argv[2]))
voice, vsr = read_wav(sys.argv[3])
assert vsr == SR
DUR = float(sys.argv[4])
OUT = sys.argv[5]
N = ns(DUR)
F = I.m2f
r = rng(7)


def WL(L, k=0):
    l = [x["start"] for x in words if x["line"] == L]
    return l[min(k, len(l) - 1)] if l else DUR


cut = lambda L, k=0: 0.0 if (L, k) == (0, 0) else WL(L, k) - 0.1
CUE = {k: WL(*v) for k, v in story.get("cues", {}).items()}
SH = []
for i, s in enumerate(story["shots"]):
    a = cut(*s["at"])
    b = cut(*story["shots"][i + 1]["at"]) if i + 1 < len(story["shots"]) else DUR
    SH.append(dict(id=s["id"], a=a, b=b, music=s.get("music")))
# music mode carries forward until changed; "end" shot defaults to "end"
mode = "groove"
for s in SH:
    mode = s["music"] or ("end" if s["id"] == "end" else mode if mode not in ("sad", "lift") else ("pad" if mode == "sad" else "groove"))
    s["mode"] = mode

BPM = 124
B = 60 / BPM  # beat
music = np.zeros((2, N))
PROG = [("C", [48, 55, 60, 64, 67], 36), ("Am", [45, 57, 60, 64, 69], 33), ("F", [41, 53, 57, 60, 65], 29), ("G", [43, 55, 59, 62, 67], 31)]
MEL = [(0, 76), (1, 79), (1.5, 81), (2, 79), (3, 76), (4, 74), (5, 76), (5.5, 79), (6, 77), (7, 74),
       (8, 72), (9, 76), (9.5, 77), (10, 76), (11, 72), (12, 71), (13, 72), (14, 74), (15, 79)]


def bar_section(t0, bars, uke=True, bass=True, drums=True, mel=False, vel=1.0):
    for bi in range(bars):
        name, notes, root = PROG[bi % 4]
        tb = t0 + bi * 4 * B
        if tb >= DUR:
            break
        if uke:  # island strum: down / down-up / up-down-up
            for k, (beat, v) in enumerate([(0, .8), (1, .55), (1.5, .45), (2.5, .5), (3, .6), (3.5, .45)]):
                for j, m in enumerate(notes[1:]):
                    place(music, pan(I.pluck(F(m), 0.18 * v * vel, r, 0.6, 0.65), -0.25 + 0.12 * j), tb + beat * B + 0.008 * j)
        if bass:
            for beat, m in [(0, root), (1.5, root), (2, root + 7), (3, root + 12)]:
                place(music, I.pluck(F(m), 0.55 * vel, r, 0.5, 0.25), tb + beat * B)
        if drums:
            for beat in range(4):
                place(music, pan(I.brush(0.35 * vel, r, 0.25), 0.2), tb + beat * B)
                if beat % 2:
                    place(music, I.snare(0.32 * vel, r, 0.25, 1.15, 0.7), tb + beat * B)
                place(music, pan(I.brush(0.18 * vel, r, 0.12), -0.3), tb + (beat + 0.5) * B)
        if mel:
            for b8, m in MEL:
                if int(b8 // 4) == bi % 4:
                    place(music, pan(I.glock(F(m), 0.3 * vel, r, 1.2), 0.15), tb + (b8 % 4) * B)



# ---------------- music by section: merge consecutive shots with the same mode into runs ----------------
RUNS = []
for s0 in SH:
    if RUNS and RUNS[-1]["mode"] == s0["mode"] and s0["mode"] in ("groove", "lift", "nervous", "pad", "stop"):
        RUNS[-1]["b"] = s0["b"]
    else:
        RUNS.append(dict(a=s0["a"], b=s0["b"], mode=s0["mode"], music=s0["music"], id=s0["id"]))
for s in RUNS:
    before = music.copy()
    a, b, m = s["a"], s["b"], s["mode"]
    if m == "groove":
        bar_section(a, int(np.ceil((b - a) / (4 * B))) + 1, mel=True, vel=0.95)
        music[:, ns(b):] *= 0.0 if False else 1.0
    elif m == "lift":
        place(music, I.pad([F(60), F(64), F(67), F(72)], b - a + 0.5, 0.5, r, att=0.15, rel=0.5, warm=1600), a)
        bar_section(a, int(np.ceil((b - a) / (4 * B))) + 1, mel=True, vel=1.05)
    elif m == "nervous":
        k = 0
        while a + k * B / 2 < b - 0.1:
            t = a + k * B / 2
            place(music, pan(I.pluck(F([72, 71, 72, 74][k % 4] + (k // 8) * 2), 0.22, r, 0.3, 0.8), 0.3 if k % 2 else -0.3), t)
            if k % 2 == 0:
                place(music, I.pluck(F(36 + (k // 8) * 2), 0.4, r, 0.35, 0.2), t)
            k += 1
    elif m == "sad":
        for j, (mm, d) in enumerate([(67, 0.32), (66, 0.32), (65, 0.32), (64, 1.1)]):
            tq = tt(d)
            fr = F(mm) * (1 + 0.02 * np.sin(2 * np.pi * 5.5 * tq) * (tq > 0.15))
            y = sum(np.sin(2 * np.pi * np.cumsum(fr * h) / SR) / h ** 1.2 for h in range(1, 7))
            y = lp(y, 1600) * np.minimum(1, tq / 0.04) * np.minimum(1, (d - tq) / 0.08) * 0.28
            place(music, pan(y, 0.1), a + 0.15 + 0.34 * j)
    elif m == "pad":
        place(music, I.pad([F(57), F(60), F(64)], b - a + 0.3, 0.45, r, att=0.4, rel=0.6, warm=1200), a + 0.1)
    elif m == "end":
        tn = CUE.get("name", a + 1.2)
        for j, mm in enumerate([60, 64, 67, 72, 76, 79, 84]):
            place(music, pan(I.glock(F(mm), 0.4, r, 1.6), -0.5 + j / 6), tn - 0.05 + 0.045 * j)
        place(music, I.cymbal(0.4, r, 1.8), tn - 0.05)
        place(music, I.pad([F(60), F(64), F(67)], b - a, 0.35, r, att=0.3, rel=0.8, warm=1800), a)
    # trim anything this run left ringing past its end (0.1 s fade), except the end sting
    if s["mode"] != "end":
        d = music - before
        e0 = ns(s["b"])
        if e0 < N:
            fl = min(ns(0.1), N - e0)
            d[:, e0:e0 + fl] *= np.linspace(1, 0, fl)
            d[:, e0 + fl:] = 0
        music = before + d
# hard section edges: each section's groove is cut at the section end (no overhang into the next mode)
edges = np.ones(N)
for i, s in enumerate(SH):
    if s["mode"] in ("groove", "lift") and i + 1 < len(SH) and SH[i + 1]["mode"] not in ("groove", "lift"):
        pass
# silence windows: "stop" sections and story["stopMusic"] [[L0,k0,L1,k1], ...]
for s in SH:
    if s["mode"] == "stop":
        music[:, ns(s["a"]):ns(s["b"])] *= 0.0
for L0, k0, L1, k1 in story.get("stopMusic", []):
    music[:, ns(WL(L0, k0) - 0.12):ns(WL(L1, k1) - 0.15)] *= 0.0

# ---------------- sfx ----------------
sfx = np.zeros((2, N))
def car_by(t, p0=-0.8, p1=0.8, dur=1.6, vel=0.5):
    """a small petrol car passing: filtered rumble + tyre hiss with a doppler-ish sweep"""
    n = ns(dur)
    x = np.linspace(-1, 1, n)
    env = np.exp(-(x * 2.2) ** 2)
    rum = lp(r.standard_normal(n), 260) * 3 + np.sin(2 * np.pi * np.cumsum(85 + 30 * -np.tanh(x * 3)) / SR) * 0.4
    hiss = bp(r.standard_normal(n), 900, 4000) * 0.5
    y = (rum + hiss) * env * vel
    L = np.stack([y * np.cos((np.interp(x, [-1, 1], [p0, p1]) + 1) * np.pi / 4), y * np.sin((np.interp(x, [-1, 1], [p0, p1]) + 1) * np.pi / 4)]) * np.sqrt(2)
    place(sfx, L, t - dur / 2)


def honk(t, f0=420.0, dur=0.16, vel=0.4, p=0.0):
    tq = tt(dur)
    y = sum(np.sign(np.sin(2 * np.pi * f * tq)) * a for f, a in [(f0, 1), (f0 * 1.26, 0.8)])
    y = lp(y, 2400) * np.minimum(1, tq / 0.01) * np.minimum(1, (dur - tq) / 0.02) * vel * 0.3
    place(sfx, pan(y, p), t)


def pop(t, f=900.0, vel=0.35, p=0.0):
    tq = tt(0.12)
    y = np.sin(2 * np.pi * f * tq * (1 + 0.8 * np.exp(-tq / 0.02))) * np.exp(-tq / 0.035) * vel
    place(sfx, pan(y, p), t)


def whoosh(t, dur=0.45, vel=0.4, up=True):
    n = ns(dur)
    x = np.linspace(0, 1, n)
    y = bp(r.standard_normal(n), 500, 6000) * np.sin(np.pi * x) ** 2 * vel
    place(sfx, widen(y, r), t - dur * (0.7 if up else 0.3))


def buzz(t, vel=0.3):
    tq = tt(0.32)
    y = np.sign(np.sin(2 * np.pi * 150 * tq)) * (np.sin(2 * np.pi * 9 * tq) > -0.2) * vel * 0.12
    place(sfx, lp(y, 900), t)


def step(t, vel=0.25):
    tq = tt(0.08)
    place(sfx, lp(r.standard_normal(len(tq)), 600) * np.exp(-tq / 0.015) * vel, t)


def ding(t, vel=0.35):
    place(sfx, pan(I.glock(F(84), vel, r, 1.0), 0.1), t)
    place(sfx, pan(I.glock(F(91), vel * 0.7, r, 1.0), -0.1), t + 0.07)



SIG = {"hook", "sig1", "sig2", "sig5", "ask", "lonely", "signal", "signal2", "bro"}
for i, s in enumerate(SH):
    a, b, sid = s["a"], s["b"], s["id"]
    if i > 0 and SH[i - 1]["id"] in SIG and sid in SIG:
        pass
    elif sid in SIG:
        for k in range(2):
            tq = tt(0.35)
            place(sfx, pan(bp(r.standard_normal(len(tq)), 2500, 6000) * np.exp(-tq / 0.12) * 0.08, -0.3 + 0.6 * k), a + 0.05 + 0.1 * k)
    if sid in ("leave", "gate", "dead"):
        n = 2 if sid == "leave" else 4
        for k in range(n):
            car_by(a + 0.4 + k * (b - a - 0.6) / n, 0.7, -0.7, 1.3, 0.33)
    if sid in ("years", "clock"):
        for k in range(int((b - a) / 0.07)):
            pop(a + 0.05 + k * 0.07, 2800 + 200 * (k % 2), 0.12)
        whoosh(a + 0.1, 0.9, 0.35)
    if sid in ("office", "floor"):
        tq = tt(0.4)
        place(sfx, (np.sin(2 * np.pi * 55 * tq) * np.exp(-tq / 0.12) + lp(r.standard_normal(len(tq)), 1200) * np.exp(-tq / 0.03) * 0.5) * 0.55, a + 0.07)
    if sid == "meeting":
        for j, m in enumerate([76, 81]):
            place(sfx, pan(I.glock(F(m), 0.3, r, 0.7), 0.0), a + 0.25 + 0.1 * j)
    if sid == "chat":
        whoosh(a + 0.05, 0.4, 0.5)
        n_msg = len(story.get("chat", {}).get("messages", [])) or 12
        for k in range(n_msg):
            tk = a + (b - 0.6 - a) * (k / n_msg) ** (1 / 1.6)
            pop(tk, 700 + 90 * (k % 5), 0.28, 0.4 if k % 2 else -0.4)
            if k % 3 == 0:
                buzz(tk + 0.02, 0.35)
    if sid == "app":
        whoosh(a + 0.1, 0.55, 0.5)
        ding(a + 0.25)
    if sid == "onecar":
        whoosh(a + 0.02, 0.4, 0.35, up=False)
        car_by(a + 0.8, -0.5, 0.6, 1.8, 0.4)
    if sid == "lot":
        tq = tt(0.4)
        place(sfx, np.sin(2 * np.pi * (1900 + 300 * np.sin(2 * np.pi * 7 * tq)) * tq) * np.exp(-tq / 0.15) * 0.05, a + 1.1)
    if sid == "late":
        tq = tt(0.25)
        place(sfx, pan(lp(r.standard_normal(len(tq)), 400) * np.exp(-tq / 0.05) * 0.6, 0.4), a + 0.15)
    if sid in ("late", "where"):
        t = a + 0.3
        while t < b - 0.2:
            step(t, 0.22)
            t += 0.19
    if sid == "end":
        whoosh(a + 0.05, 0.4, 0.4)
# cue-driven sfx (only for cues the story defines)
C = CUE
if "wave" in C: honk(C["wave"] - 0.05, 430, 0.12, 0.45, -0.3); honk(C["wave"] + 0.12, 430, 0.12, 0.45, -0.3)
if "thumbs" in C: ding(C["thumbs"])
if "outOf" in C:
    for k in range(3):
        tq = tt(0.12)
        place(sfx, pan(np.sin(2 * np.pi * 4300 * tq) * (np.sin(2 * np.pi * 45 * tq) > 0) * np.exp(-tq / 0.05) * 0.06, 0.5), C["outOf"] + 0.25 + 0.3 * k)
if "bro" in C:
    tq = tt(0.28)
    place(sfx, bp(r.standard_normal(len(tq)), 600, 5000) * np.sin(2 * np.pi * (14 - 30 * tq) * tq) * np.exp(-tq / 0.12) * 0.6, C["bro"] - 0.12)
if "cameras" in C: pop(C["cameras"] - 0.03, 500, 0.45)
if "sixty" in C: pop(C["sixty"], 1200, 0.4)
tq = tt(0.15)
for k in ("driver", "live", "check"):
    if k in C:
        place(sfx, lp(r.standard_normal(len(tq)), 900) * np.exp(-tq / 0.03) * 0.7 + np.sin(2 * np.pi * 90 * tq) * np.exp(-tq / 0.06) * 0.6, C[k] + (0.25 if k == "driver" else 0) - 0.04)
if "roster" in C: whoosh(C["roster"] - 0.15, 0.25, 0.25)
if "tap" in C:
    whoosh(C["tap"] - 0.45, 0.25, 0.25)
    pop(C["tap"] + 0.05, 1500, 0.4)
    for j, m in enumerate([79, 84, 88]):
        place(sfx, pan(I.glock(F(m), 0.4, r, 0.9), 0.1), C["tap"] + 0.3 + 0.06 * j)
if "watch" in C: whoosh(C["watch"] - 0.1, 0.3, 0.3); car_by(C["watch"] + 0.8, -0.3, 0.3, 1.2, 0.25)
if "four" in C: honk(C["four"] + 0.1, 520, 0.1, 0.35)
if "everyone" in C: pop(C["everyone"] - 0.15, 1000, 0.4)
for L, k in story.get("punch", []):
    pass

# ---------------------------------------------------------------- mix
vo = np.zeros((2, N))
place(vo, voice[0] if voice.shape[0] == 1 else voice, 0.0)
# duck the music under the voice (envelope follower, 8 dB)
env = np.abs(vo[0])
k = ns(0.05)
envs = np.convolve(env, np.ones(k) / k, "same")
duck = np.interp(envs, [0.0, 0.02], [1.0, dbg(-8)])
duck = np.convolve(duck, np.ones(ns(0.15)) / ns(0.15), "same")
ir = make_ir(0.6, 3)
music_wet = convolve_st(music, ir)[:, :N] * 0.18 + music
sfx = convolve_st(sfx, ir)[:, :N] * 0.12 + sfx
# levels: voice anchor, music -15 LU under it while ducked, sfx clear but under the voice
vl = integrated(vo)
music_wet *= dbg((vl - 13) - integrated(music_wet))
sfx *= dbg((vl - 9) - integrated(sfx))
mix = vo + music_wet * duck[None, :] + sfx
mix *= dbg(-14.5 - integrated(mix))
for _ in range(3):  # soft limiter (tanh knee at -1.5 dBFS), then re-trim loudness toward -14
    ceil = dbg(-1.5)
    mix = np.tanh(mix / ceil) * ceil
    mix *= dbg(min(2.0, -14.0 - integrated(mix)))
mix = np.tanh(mix / dbg(-1.5)) * dbg(-1.5)
pk = true_peak(mix)  # dBTP
if pk > -1.0:
    mix *= dbg(-1.0 - pk)
mix = fades(mix, 0.002, 0.25)
write_wav(OUT, mix, 24)
print("written", OUT, "dur", round(N / SR, 2), "LUFS", round(integrated(mix), 1), "peak dBTP", round(true_peak(mix), 1))
