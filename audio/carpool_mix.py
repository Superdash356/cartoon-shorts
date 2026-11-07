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


def W(w, n=0):
    l = [x["start"] for x in words if "".join(c for c in x["word"].lower() if c.isalpha() or c == "'") == w]
    return l[n] if n < len(l) else l[-1]


VOICE_END = words[-1]["end"]
END_CARD = VOICE_END + 0.25
cut = lambda w, n=0: W(w, n) - 0.12
T_CHAT, T_APP, T_ONE = cut("the"), cut("so"), cut("one")
F = I.m2f
r = rng(7)

# ---------------------------------------------------------------- music
BPM = 112
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


# intro to the chat: full groove with a glock hook
bar_section(0.0, int(np.ceil(T_CHAT / (4 * B))), mel=True)
# chat flood: groove drops out, nervous plucks double in speed
tc = T_CHAT
k = 0
while tc + k * B / 2 < T_APP - 0.2:
    t = tc + k * B / 2
    place(music, pan(I.pluck(F([72, 71, 72, 74][k % 4] + (k // 8) * 2), 0.22, r, 0.3, 0.8), 0.3 if k % 2 else -0.3), t)
    if k % 2 == 0:
        place(music, I.pluck(F(36 + (k // 8) * 2), 0.4, r, 0.35, 0.2), t)
    k += 1 if t < T_APP - 1.8 else 2
# app reveal: warm pad + bright groove back in, a lift
place(music, I.pad([F(60), F(64), F(67), F(72)], T_ONE - T_APP + 0.5, 0.55, r, att=0.15, rel=0.5, warm=1600), T_APP)
bar_section(T_APP, int(np.ceil((END_CARD - T_APP) / (4 * B))) + 1, mel=True, vel=1.05)
e0 = ns(END_CARD - 0.08)
music[:, e0:] *= np.concatenate([np.linspace(1, 0, ns(0.1)), np.zeros(max(0, N - e0 - ns(0.1)))])[: N - e0]  # stop under the end sting
# end sting: C major chord + glock arpeggio
for j, m in enumerate([60, 64, 67, 72, 76, 79, 84]):
    place(music, pan(I.glock(F(m), 0.4, r, 1.6), -0.5 + j / 6), END_CARD + 0.05 + 0.045 * j)
for m in [36, 48]:
    place(music, I.pluck(F(m), 0.7, r, 1.4, 0.3), END_CARD + 0.05)
place(music, I.pad([F(60), F(64), F(67)], 1.4, 0.5, r, att=0.05, rel=0.6, warm=2000), END_CARD + 0.05)
place(music, I.cymbal(0.4, r, 1.8), END_CARD + 0.05)

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


# the four step out and walk to their cars
for i in range(6):
    step(0.35 + i * 0.32, 0.16)
# four car doors, one after another on "office"
for k in range(4):
    tq = tt(0.2)
    place(sfx, pan(lp(r.standard_normal(len(tq)), 300) * np.exp(-tq / 0.04) * 0.5 + np.sin(2 * np.pi * 70 * tq) * np.exp(-tq / 0.05) * 0.4, -0.6 + 0.4 * k), W("office") + 0.05 + 0.14 * k)
# clock tick on "nine"
for k in range(3):
    pop(W("nine") - 0.3 + 0.25 * k, 2600, 0.12)
# four cars out of the gate
for k in range(4):
    car_by(cut("four", 1) + 0.25 + k * 0.32, 0.7, -0.7, 1.3, 0.35)
# signal: brakes in, a friendly double honk on "wave", then again at the next signal
for k in range(4):
    tq = tt(0.35)
    place(sfx, pan(bp(r.standard_normal(len(tq)), 2500, 6000) * np.exp(-tq / 0.12) * 0.08, -0.6 + 0.4 * k), cut("every") + 0.1 + 0.08 * k)
honk(W("wave") - 0.05, 430, 0.12, 0.45, -0.3); honk(W("wave") + 0.12, 430, 0.12, 0.45, -0.3)
honk(W("signal") - 0.05, 470, 0.1, 0.35, 0.3); honk(W("signal") + 0.1, 470, 0.1, 0.35, 0.3)
# chat flood: buzzes and pops, faster and faster
whoosh(T_CHAT + 0.05, 0.4, 0.5)
n_msg = 15
for k in range(n_msg):
    tk = T_CHAT + (W("home") - 0.2 - T_CHAT) * (k / n_msg) ** (1 / 1.6)
    pop(tk, 700 + 90 * (k % 5), 0.28, 0.4 if k % 2 else -0.4)
    if k % 3 == 0:
        buzz(tk + 0.02, 0.35)
pop(W("sixty"), 1200, 0.4)
# app reveal: whoosh in, dings on each screen
whoosh(T_APP + 0.05, 0.5, 0.45)
ding(T_APP + 0.15)
ding(W("everyone", 0) - 0.1)
pop(W("ready") + 0.05, 1400, 0.35)
ding(W("and") - 0.1)
whoosh(T_ONE + 0.02, 0.4, 0.35, up=False)
# one car out, friendly single honk at the guard
car_by(T_ONE + 0.8, -0.5, 0.6, 1.8, 0.4)
honk(W("friends") + 0.15, 520, 0.1, 0.35)
# parking: a little brake squeak
tq = tt(0.4)
place(sfx, np.sin(2 * np.pi * (1900 + 300 * np.sin(2 * np.pi * 7 * tq)) * tq) * np.exp(-tq / 0.15) * 0.05, cut("three") + 1.3)
# Sharma ji: a door bang and running steps
tq = tt(0.25)
place(sfx, pan(lp(r.standard_normal(len(tq)), 400) * np.exp(-tq / 0.05) * 0.6, 0.4), cut("sharma") + 0.15)
t = cut("sharma") + 0.3
while t < END_CARD - 0.2:
    step(t, 0.22)
    t += 0.19
# map card pop
pop(W("everyone", 2) - 0.15, 1000, 0.4)
whoosh(END_CARD + 0.05, 0.4, 0.4)

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
pk = true_peak(mix)  # dBTP
if pk > -1.0:
    mix *= dbg(-1.0 - pk)
mix = fades(mix, 0.002, 0.25)
write_wav(OUT, mix, 24)
print("written", OUT, "dur", round(N / SR, 2), "LUFS", round(integrated(mix), 1), "peak dBTP", round(true_peak(mix), 1))
