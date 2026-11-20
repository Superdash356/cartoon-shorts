#!/usr/bin/env python3
# Freshness gate for clip explainer episodes: refuses a script whose topic/hook/cta beat repeats an earlier episode,
# or whose narration shares any 5-word run with an earlier episode's narration.
# usage: python3 scripts/check_fresh_clip.py <slug>
import glob, json, os, re, sys
slug = sys.argv[1]
me = json.load(open(f"shorts/{slug}/script.json"))
norm = lambda s: re.sub(r"[^a-z0-9 ]", "", s.lower())
grams = lambda txt, n=5: {" ".join(w[i:i + n]) for w in [norm(txt).split()] for i in range(len(w) - n + 1)}
mine = grams(" ".join(l["text"] for l in me["lines"]))
bad = []
for p in sorted(glob.glob("shorts/*/script.json")):
    other = os.path.basename(os.path.dirname(p))
    if other == slug: continue
    o = json.load(open(p))
    for k in ("topic", "hook", "cta"):
        a, b = norm(me.get("beats", {}).get(k, "")), norm(o.get("beats", {}).get(k, ""))
        if a and a == b: bad.append(f"beat '{k}' repeats {other}: {a}")
    rep = mine & grams(" ".join(l["text"] for l in o["lines"]))
    # the CTA line may legitimately keep the comment keyword; ignore runs that are only the keyword sentence
    rep = {g for g in rep if "comment" not in g}
    if rep: bad.append(f"narration repeats {other}: " + " | ".join(sorted(rep)[:6]))
if bad:
    print("NOT FRESH:\n  " + "\n  ".join(bad)); sys.exit(1)
print("fresh ok:", slug)
