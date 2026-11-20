#!/usr/bin/env python3
"""Build one clip-tool explainer reel end to end from shorts/<slug>/script.json (see RUNBOOK_CLIP.md).

usage: python3 scripts/clip_daily.py <slug> [--from voice|build|render | --only voice|build|render] [--stills]
  voice : freshness gate, lines.json from script.json, "Generate voice" workflow, pull voice.wav + words.json
  build : tighten the voice, install script/words as the current ClipExplainer, typecheck, sound mix, optional stills
  render: commit + push, "Render short" workflow (ClipExplainer, 20 chunks, 1080x1920) with the mix, download mp4
"""
import json, os, shutil, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from daily import sh, sync, run_workflow, REPO  # noqa: E402  (daily.py chdirs to the repo root)

ENGINE = "src/videos/clip"


def voice(slug):
    d = f"shorts/{slug}"
    st = json.load(open(f"{d}/script.json"))
    sh(f"python3 scripts/check_fresh_clip.py {slug}")
    json.dump({"voice": st["voice"], "lines": st["lines"]}, open(f"{d}/lines.json", "w"), indent=1)
    sh(f"git add {d}/script.json {d}/lines.json && git commit -qm 'Clip script {slug}' || true", check=False)
    sync(); sh("git push -q")
    run_workflow("voice.yml", {"short": slug, "alts": ""}, timeout=1200)
    sync()
    assert os.path.exists(f"{d}/words.json"), "voice files missing after workflow"


def build(slug, stills=False):
    d = f"shorts/{slug}"
    st = json.load(open(f"{d}/script.json"))
    sh(f"python3 scripts/tighten_voice.py {d} {st.get('tempo', 1.06)} {st.get('keepGap', 0.3)} | head -1")
    w = json.load(open(f"{d}/words.json")); t = json.load(open(f"{d}/words_tight.json"))
    for a, b in zip(w, t): b["line"] = a["line"]
    json.dump(t, open(f"{ENGINE}/words.json", "w"), indent=1)
    shutil.copy(f"{d}/script.json", f"{ENGINE}/script.json")
    sh("npx tsc --noEmit")
    q = lambda expr: sh(f"npx tsx -e \"import('./{ENGINE}/timeline.ts').then(m=>console.log({expr}))\" 2>/dev/null | tail -1", cap=True).strip()
    total = float(q("m.TOTAL"))
    sh(f"cd audio && python3 clip_mix.py ../{d}/script.json ../{ENGINE}/words.json ../{d}/voice_tight.wav {total / 30:.4f} ../{d}/mix.wav")
    print("DURATION", round(total / 30, 1), "s")
    if stills:
        frames = q("m.SCENES.map(s=>Math.round(((s.a+s.b)/2+0.4)*30)).join(',')")
        os.makedirs(f"out/{slug}", exist_ok=True)
        sh(f"node scripts/stills.mjs ClipExplainer out/{slug}/s_ {frames} 0.5")
        sh(f"python3 scripts/contact.py out/{slug} {frames}")


def render(slug):
    d = f"shorts/{slug}"
    sh(f"git add -A {ENGINE} {d} && git commit -qm 'Build clip {slug}' || true", check=False)
    sync(); sh("git push -q")
    sh(f"git push -q -f origin HEAD:refs/heads/build/{slug}")
    run_workflow("render.yml", {"composition": "ClipExplainer", "chunks": "20", "audio": f"{d}/mix.wav", "tag": slug}, timeout=3600, ref=f"build/{slug}")
    sh("git fetch -q origin renders:refs/remotes/origin/renders --force")
    os.makedirs("out", exist_ok=True)
    sh(f"git show origin/renders:{slug}.mp4 > out/{slug}.mp4")
    print("VIDEO", os.path.abspath(f"out/{slug}.mp4"))
    print("RELEASE", f"https://github.com/{REPO}/releases/tag/{slug}")


if __name__ == "__main__":
    slug = sys.argv[1]
    start = sys.argv[sys.argv.index("--from") + 1] if "--from" in sys.argv else "voice"
    steps = ["voice", "build", "render"]
    todo = [sys.argv[sys.argv.index("--only") + 1]] if "--only" in sys.argv else steps[steps.index(start):]
    for s in todo:
        print(f"===== {s} =====", flush=True)
        voice(slug) if s == "voice" else build(slug, "--stills" in sys.argv) if s == "build" else render(slug)
