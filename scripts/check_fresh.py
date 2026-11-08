#!/usr/bin/env python3
"""Freshness gate: refuse a story that reuses earlier stories' lines, beats or ending.

usage: python3 scripts/check_fresh.py <slug> [--days 30]
Compares shorts/<slug>/story.json with every other shorts/*/story.json (dated folders within --days, plus undated
legacy ones). Fails (exit 1) when:
  - story.json has no "beats" block, or a beats field is missing / repeats an earlier story's value
    (theme, setting, conflict, failedAttempt, twist, lesson, appAngle, callback, ctaLine)
  - any narration line shares a 4-word run with an earlier story (CTA "check it out / link in bio" and runs naming Sahyatri allowed)
  - more than 2 lines are near-copies of earlier lines, or the shot order after the "app" shot matches an earlier story
"""
import glob, json, os, re, sys, datetime

FIELDS = ["theme", "setting", "conflict", "failedAttempt", "twist", "lesson", "appAngle", "callback", "ctaLine"]
ALLOWED = {"check it out link", "it out link in", "out link in bio"}
norm = lambda s: re.sub(r"[^a-z0-9' ]", " ", s.lower()).split()
grams = lambda ws, n=4: {" ".join(ws[i:i + n]) for i in range(len(ws) - n + 1)}
key = lambda s: " ".join(norm(s))

slug = sys.argv[1]
days = int(sys.argv[sys.argv.index("--days") + 1]) if "--days" in sys.argv else 30
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
new = json.load(open(f"{root}/shorts/{slug}/story.json"))
today = datetime.date.today()
old = []
for p in sorted(glob.glob(f"{root}/shorts/*/story.json")):
    s = p.split("/")[-2]
    if s == slug: continue
    m = re.match(r"(\d{4}-\d{2}-\d{2})-", s)
    if m and (today - datetime.date.fromisoformat(m.group(1))).days > days: continue
    old.append((s, json.load(open(p))))

errs = []
beats = new.get("beats") or {}
for f in FIELDS:
    if not str(beats.get(f, "")).strip(): errs.append(f'beats.{f} is missing: describe it in one short line')
for s, st in old:
    ob = st.get("beats") or {}
    for f in FIELDS:
        if beats.get(f) and ob.get(f) and key(beats[f]) == key(ob[f]):
            errs.append(f'beats.{f} "{beats[f]}" repeats {s}')

oldgrams = {}
for s, st in old:
    for l in st["lines"]:
        for g in grams(norm(l["text"])): oldgrams.setdefault(g, s)
near = 0
for i, l in enumerate(new["lines"]):
    hit = sorted({oldgrams[g] + ': "' + g + '"' for g in grams(norm(l["text"])) - ALLOWED if g in oldgrams and "sahyatri" not in g})
    if hit:
        near += 1
        errs.append(f'line {i} "{l["text"]}" reuses {", ".join(hit[:3])}')

def ending(st):
    ids = [x["id"] for x in st["shots"]]
    return ids[ids.index("app"):] if "app" in ids else []
for s, st in old:
    if ending(new) and ending(new) == ending(st): errs.append(f"shot order after the app shot is identical to {s}: {ending(st)}")
    oi = [x["id"] for x in st["shots"]]; ni = [x["id"] for x in new["shots"]]
    if oi == ni: errs.append(f"whole shot list is identical to {s}")

print(f"checked {slug} against {len(old)} earlier stories ({', '.join(s for s, _ in old) or 'none'})")
if errs:
    print("NOT FRESH - rewrite these before voicing:"); [print(" -", e) for e in errs]; sys.exit(1)
print("FRESH: no reused beats, lines or ending")
