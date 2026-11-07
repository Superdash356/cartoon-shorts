# usage: python scripts/tighten_voice.py <dir> [tempo] [keep_gap]
# Shortens pauses between sentences to keep_gap seconds, then speeds speech by tempo (ffmpeg atempo, pitch kept).
# Reads <dir>/voice.wav + words.json, writes voice_tight.wav + words_tight.json.
import json, subprocess, sys
import numpy as np, scipy.io.wavfile as wf
d = sys.argv[1]; tempo = float(sys.argv[2]) if len(sys.argv) > 2 else 1.15; keep = float(sys.argv[3]) if len(sys.argv) > 3 else 0.32
sr, a = wf.read(f"{d}/voice.wav"); a = a.astype(np.float32)
w = json.load(open(f"{d}/words.json"))
cuts = []  # (start, end) seconds removed
for i in range(len(w) - 1):
    g0, g1 = w[i]["end"], w[i + 1]["start"]
    if g1 - g0 > keep + 0.08: cuts.append((g0 + keep / 2, g1 - keep / 2))
out, pos, fade = [], 0, int(0.01 * sr)
for c0, c1 in cuts:
    s0, s1 = int(c0 * sr), int(c1 * sr)
    seg = a[pos:s0].copy()
    if out and len(seg) > fade: seg[:fade] *= np.linspace(0, 1, fade)
    if len(seg) > fade: seg[-fade:] *= np.linspace(1, 0, fade)
    out.append(seg); pos = s1
seg = a[pos:].copy(); seg[:fade] *= np.linspace(0, 1, fade); out.append(seg)
b = np.concatenate(out)
wf.write(f"{d}/_tmp.wav", sr, b.astype(np.int16))
def shift(t):
    s = t
    for c0, c1 in cuts:
        if t >= c1: s -= c1 - c0
    return s
nw = [{"word": x["word"], "start": round(shift(x["start"]) / tempo, 3), "end": round(shift(x["end"]) / tempo, 3)} for x in w]
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{d}/_tmp.wav", "-af", f"atempo={tempo}", "-ar", "48000", f"{d}/voice_tight.wav"], check=True)
subprocess.run(["rm", f"{d}/_tmp.wav"])
json.dump(nw, open(f"{d}/words_tight.json", "w"), indent=1)
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"{d}/voice_tight.wav"], capture_output=True, text=True).stdout)
print("duration", round(dur, 2)); print(" ".join(f"{x['word']}@{x['start']}" for x in nw))
