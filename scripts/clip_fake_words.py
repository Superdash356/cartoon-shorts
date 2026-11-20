# usage: python3 scripts/clip_fake_words.py <script.json> <out words.json>
# Rough word timings (no voice needed) so the clip explainer can be previewed before the voice exists.
import json, sys
s = json.load(open(sys.argv[1])); t, out = 0.2, []
for i, L in enumerate(s["lines"]):
    for w in L["text"].split():
        w = w.strip(".,!?\"'")
        d = 0.12 + 0.045 * len(w)
        out.append({"word": w, "start": round(t, 3), "end": round(t + d, 3), "line": i}); t += d + 0.06
    t += L.get("gap", 0.25)
json.dump(out, open(sys.argv[2], "w"), indent=1); print("fake duration", round(t, 1))
