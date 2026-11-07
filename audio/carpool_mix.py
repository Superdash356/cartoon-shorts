# Sound for "Four Neighbours, Four Cars" (Sahyatri promo): an original light, bouncy score (C major, 112 bpm:
# ukulele-style plucks, bass, brushes, glock hooks), synthesized SFX on the picture's events, and the narration on top
# with the music ducked under it. Uses the bridge short's DSP kit (dsp.py) and instruments (instruments.py).
# usage: python audio/carpool_mix.py <words_tight.json> <voice.wav> <total seconds> <out.wav>
import json, sys
import numpy as np
from dsp import SR, ns, tt, rng, pan, place, dbg, lp, hp, bp, fades, make_ir, convolve_st, integrated, true_peak, read_wav, write_wav, widen
import instruments as I

words = json.load(open(sys.argv[1]))
voice, vsr = read_wav(sys.argv[2])
assert vsr == SR
DUR = float(sys.argv[3])
OUT = sys.argv[4]
N = ns(DUR)


def WL(L, k=0):
    l = [x["start"] for x in words if x["line"] == L]
    return l[min(k, len(l) - 1)]


VOICE_END = words[-1]["end"]
END_CARD = WL(21) - 0.1
cut = lambda L, k=0: WL(L, k) - 0.1
T_CHAT, T_DEAD, T_MSG, T_APP, T_ONE = cut(13), cut(14), cut(15), cut(17), cut(19)
CUE = dict(wave=WL(2, 3), thumbs=WL(3, 2), outOf=WL(4, 3), years=WL(5), bro=WL(7), office=WL(8), floor=WL(9), team=WL(10), cameras=WL(11, 4),
           sixty=WL(13), tap=WL(18, 6), ready=WL(18, 9), watch=WL(18, 10), live=WL(18, 16), roster=WL(18, 1), driver=WL(18, 4),
           one=WL(19, 2), four=WL(19, 4), three=WL(19, 8), sharma=WL(20), everyone=WL(20, 8), name=WL(21, 9), check=WL(22))
F = I.m2f
r = rng(7)

# ---------------------------------------------------------------- music
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


# story groove from the top to the chat; it stops for "This went on for two years" and for "bro"
bar_section(0.0, int(np.ceil(T_CHAT / (4 * B))), mel=True, vel=0.95)
music[:, ns(T_CHAT):] *= 0.0
for t0, t1 in [(cut(5), WL(6) - 0.05), (CUE["bro"] - 0.12, WL(8) - 0.15)]:
    music[:, ns(t0):ns(t1)] *= 0.0
# chat flood: nervous plucks, faster and faster
k = 0
while T_CHAT + k * B / 2 < T_DEAD - 0.1:
    t = T_CHAT + k * B / 2
    place(music, pan(I.pluck(F([72, 71, 72, 74][k % 4] + (k // 8) * 2), 0.22, r, 0.3, 0.8), 0.3 if k % 2 else -0.3), t)
    if k % 2 == 0:
        place(music, I.pluck(F(36 + (k // 8) * 2), 0.4, r, 0.35, 0.2), t)
    k += 1
# "Group, dead.": sad trombone wah-wah-wah-waaah (descending, wobbling)
for j, (m, d) in enumerate([(67, 0.32), (66, 0.32), (65, 0.32), (64, 1.1)]):
    tq = tt(d)
    fr = F(m) * (1 + 0.02 * np.sin(2 * np.pi * 5.5 * tq) * (tq > 0.15))
    y = sum(np.sin(2 * np.pi * np.cumsum(fr * h) / SR) / h ** 1.2 for h in range(1, 7))
    y = lp(y, 1600) * np.minimum(1, tq / 0.04) * np.minimum(1, (d - tq) / 0.08) * 0.28
    place(music, pan(y, 0.1), T_DEAD + 0.05 + 0.34 * j)
# the message: soft warm pad, almost nothing else
place(music, I.pad([F(57), F(60), F(64)], T_APP - T_MSG + 0.3, 0.45, r, att=0.4, rel=0.6, warm=1200), T_MSG + 0.1)
# app reveal: lift + groove back in until the CTA
place(music, I.pad([F(60), F(64), F(67), F(72)], T_ONE - T_APP + 0.5, 0.5, r, att=0.15, rel=0.5, warm=1600), T_APP)
gstart = len(music[0])
bar_section(T_APP, int(np.ceil((END_CARD - T_APP) / (4 * B))) + 1, mel=True, vel=1.05)
e0 = ns(END_CARD - 0.08)
music[:, e0:] *= np.concatenate([np.linspace(1, 0.35, ns(0.1)), np.full(max(0, N - e0 - ns(0.1)), 0.35)])[: N - e0]
# end: a bright sting on the app name
for j, m in enumerate([60, 64, 67, 72, 76, 79, 84]):
    place(music, pan(I.glock(F(m), 0.4, r, 1.6), -0.5 + j / 6), CUE["name"] - 0.05 + 0.045 * j)
place(music, I.cymbal(0.4, r, 1.8), CUE["name"] - 0.05)

# ---------------------------------------------------------------- sfx
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


# hook: a shiny "new car" sparkle, idle hum, brakes at the light
for j, m in enumerate([84, 88, 91]):
    place(sfx, pan(I.glock(F(m), 0.25, r, 0.8), 0.3), 0.15 + 0.07 * j)
for k in range(2):
    tq = tt(0.35)
    place(sfx, pan(bp(r.standard_normal(len(tq)), 2500, 6000) * np.exp(-tq / 0.12) * 0.08, -0.3 + 0.6 * k), 0.05 + 0.1 * k)
# leaving the colony: two cars roll past
car_by(cut(1) + 1.6, 0.7, -0.7, 1.4, 0.35)
car_by(cut(1) + 3.6, 0.7, -0.7, 1.4, 0.35)
# greetings: honk-honk, a ding on the thumbs up, an awkward cricket on "out of greetings"
honk(CUE["wave"] - 0.05, 430, 0.12, 0.45, -0.3); honk(CUE["wave"] + 0.12, 430, 0.12, 0.45, -0.3)
ding(CUE["thumbs"])
for k in range(3):
    tq = tt(0.12)
    place(sfx, pan(np.sin(2 * np.pi * 4300 * tq) * (np.sin(2 * np.pi * 45 * tq) > 0) * np.exp(-tq / 0.05) * 0.06, 0.5), CUE["outOf"] + 0.25 + 0.3 * k)
# two years: fast clock ticking + whoosh
for k in range(14):
    pop(cut(5) + 0.05 + k * 0.07, 2800 + 200 * (k % 2), 0.12)
whoosh(cut(5) + 0.1, 0.9, 0.35)
# window rolls down, record scratch on "bro"
tq = tt(0.6)
place(sfx, lp(r.standard_normal(len(tq)), 500) * (0.5 + 0.5 * np.sin(2 * np.pi * 30 * tq)) * 0.1, WL(6, 3))
tq = tt(0.28)
place(sfx, bp(r.standard_normal(len(tq)), 600, 5000) * np.sin(2 * np.pi * (14 - 30 * tq) * tq) * np.exp(-tq / 0.12) * 0.6, CUE["bro"] - 0.12)
# same office / floor / team: three hits, the last one biggest
for i, (tm, v) in enumerate([(CUE["office"], 0.45), (CUE["floor"], 0.55), (CUE["team"], 0.8)]):
    tq = tt(0.4)
    place(sfx, (np.sin(2 * np.pi * 55 * tq) * np.exp(-tq / 0.12) + lp(r.standard_normal(len(tq)), 1200) * np.exp(-tq / 0.03) * 0.5) * v, tm - 0.03)
# meeting: call join chime, "camera off" bloop
for j, m in enumerate([76, 81]):
    place(sfx, pan(I.glock(F(m), 0.3, r, 0.7), 0.0), cut(10) + 0.25 + 0.1 * j)
pop(CUE["cameras"] - 0.03, 500, 0.45)
# chat flood
whoosh(T_CHAT + 0.05, 0.4, 0.5)
n_msg = 15
for k in range(n_msg):
    tk = T_CHAT + (T_DEAD - 0.6 - T_CHAT) * (k / n_msg) ** (1 / 1.6)
    pop(tk, 700 + 90 * (k % 5), 0.28, 0.4 if k % 2 else -0.4)
    if k % 3 == 0:
        buzz(tk + 0.02, 0.35)
pop(CUE["sixty"], 1200, 0.4)
# group dead: four cars again
for k in range(4):
    car_by(T_DEAD + 0.4 + k * 0.35, 0.7, -0.7, 1.2, 0.3)
# app: whoosh in, screen swishes, notification ping, sticker slam, tap, success chime
whoosh(T_APP + 0.1, 0.55, 0.5)
ding(T_APP + 0.25)
whoosh(CUE["roster"] - 0.15, 0.25, 0.25)
ding(CUE["driver"] - 0.15)
tq = tt(0.15)
for tm in (CUE["driver"] + 0.25, CUE["live"]):
    place(sfx, lp(r.standard_normal(len(tq)), 900) * np.exp(-tq / 0.03) * 0.7 + np.sin(2 * np.pi * 90 * tq) * np.exp(-tq / 0.06) * 0.6, tm - 0.04)
whoosh(CUE["tap"] - 0.45, 0.25, 0.25)
pop(CUE["tap"] + 0.05, 1500, 0.4)
for j, m in enumerate([79, 84, 88]):
    place(sfx, pan(I.glock(F(m), 0.4, r, 0.9), 0.1), CUE["tap"] + 0.3 + 0.06 * j)
whoosh(CUE["watch"] - 0.1, 0.3, 0.3)
car_by(CUE["watch"] + 0.8, -0.3, 0.3, 1.2, 0.25)
# payoff
whoosh(T_ONE + 0.02, 0.4, 0.35, up=False)
car_by(T_ONE + 0.8, -0.5, 0.6, 1.8, 0.4)
honk(CUE["four"] + 0.1, 520, 0.1, 0.35)
tq = tt(0.4)
place(sfx, np.sin(2 * np.pi * (1900 + 300 * np.sin(2 * np.pi * 7 * tq)) * tq) * np.exp(-tq / 0.15) * 0.05, CUE["three"] + 1.0)
tq = tt(0.25)
place(sfx, pan(lp(r.standard_normal(len(tq)), 400) * np.exp(-tq / 0.05) * 0.6, 0.4), CUE["sharma"] + 0.05)
t = CUE["sharma"] + 0.2
while t < END_CARD - 0.2:
    step(t, 0.22)
    t += 0.19
pop(CUE["everyone"] - 0.15, 1000, 0.4)
whoosh(END_CARD + 0.05, 0.4, 0.4)
tq = tt(0.15)
place(sfx, lp(r.standard_normal(len(tq)), 900) * np.exp(-tq / 0.03) * 0.7, CUE["check"] - 0.04)

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
