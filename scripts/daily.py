#!/usr/bin/env python3
"""Build one cartoon story short end to end from shorts/<slug>/story.json.

usage: python3 scripts/daily.py <slug> [--from voice|build|render] [--stills]
  voice : write lines.json from story.json, run the "Generate voice" GitHub workflow, pull voice.wav + words.json
  build : tighten the voice (story tempo/keepGap), install story/words/voice as the current CarpoolShort, typecheck,
          make the sound mix (audio/story_mix.py), optionally render local preview stills (--stills)
  render: commit + push, run the "Render short" workflow (20 chunks, 1080p) with the mix, wait, download the mp4 from
          the renders branch to out/<slug>.mp4, print the release URL
GitHub API calls go through the session's proxy (no token needed when the repo is attached to the session).
"""
import json, os, shutil, subprocess, sys, time
REPO = "Superdash356/cartoon-shorts"
API = f"https://api.github.com/repos/{REPO}"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)


def sh(cmd, check=True, cap=False):
    print("+", cmd, flush=True)
    r = subprocess.run(cmd, shell=True, text=True, capture_output=cap)
    if check and r.returncode != 0:
        if cap: print(r.stdout, r.stderr)
        raise SystemExit(f"failed: {cmd}")
    return r.stdout if cap else ""


def api(path, data=None):
    cmd = f"curl -sS {API}{path}" if data is None else f"curl -sS -X POST -H 'Content-Type: application/json' {API}{path} -d '{json.dumps(data)}' -w '%{{http_code}}'"
    out = sh(cmd, cap=True)
    return out if data is not None else json.loads(out)


def sync():
    sh("git stash -q || true", check=False)
    sh("git pull -q --rebase")
    sh("git stash pop -q || true", check=False)


def run_workflow(wf, inputs, timeout=3600):
    before = {r["id"] for r in api(f"/actions/workflows/{wf}/runs?per_page=5")["workflow_runs"]}
    code = api(f"/actions/workflows/{wf}/dispatches", {"ref": "main", "inputs": inputs})
    if not code.strip().endswith("204"): raise SystemExit(f"dispatch failed: {code}")
    rid = None
    for _ in range(60):
        time.sleep(5)
        runs = [r for r in api(f"/actions/workflows/{wf}/runs?per_page=5")["workflow_runs"] if r["id"] not in before]
        if runs: rid = runs[0]["id"]; break
    if not rid: raise SystemExit("run did not start")
    print("run", rid, flush=True)
    t0 = time.time()
    while time.time() - t0 < timeout:
        r = api(f"/actions/runs/{rid}")
        if r["status"] == "completed":
            print("run", rid, r["conclusion"], flush=True)
            if r["conclusion"] != "success": raise SystemExit(f"workflow {wf} failed: {r['html_url']}")
            return rid
        time.sleep(30)
    raise SystemExit("workflow timed out")


def voice(slug):
    d = f"shorts/{slug}"
    st = json.load(open(f"{d}/story.json"))
    json.dump({"voice": st["voice"], "lines": st["lines"]}, open(f"{d}/lines.json", "w"), indent=1)
    sh(f"git add {d}/story.json {d}/lines.json && git commit -qm 'Story {slug}' || true", check=False)
    sync(); sh("git push -q")
    run_workflow("voice.yml", {"short": slug, "alts": ""}, timeout=1200)
    sync()
    assert os.path.exists(f"{d}/words.json"), "voice files missing after workflow"


def build(slug, stills=False):
    d = f"shorts/{slug}"
    st = json.load(open(f"{d}/story.json"))
    sh(f"python3 scripts/tighten_voice.py {d} {st.get('tempo', 1.12)} {st.get('keepGap', 0.28)} | head -1")
    w = json.load(open(f"{d}/words.json")); t = json.load(open(f"{d}/words_tight.json"))
    for a, b in zip(w, t): b["line"] = a["line"]
    json.dump(t, open("src/videos/carpool/words.json", "w"), indent=1)
    shutil.copy(f"{d}/story.json", "src/videos/carpool/story.json")
    shutil.copy(f"{d}/voice_tight.wav", "public/carpool/voice_current.wav")
    sh("npx tsc --noEmit")
    total = float(sh("npx tsx -e \"import('./src/videos/carpool/story.ts').then(m=>console.log(m.TOTAL))\" 2>/dev/null | tail -1", cap=True).strip())
    sh(f"cd audio && python3 story_mix.py ../{d}/story.json ../src/videos/carpool/words.json ../public/carpool/voice_current.wav {total / 30:.4f} ../{d}/mix.wav")
    if stills:
        frames = sh("npx tsx -e \"import('./src/videos/carpool/story.ts').then(m=>console.log(m.SHOTS.map(s=>Math.round((s.a+s.b)/2)).join(',')))\" 2>/dev/null | tail -1", cap=True).strip()
        os.makedirs(f"out/{slug}", exist_ok=True)
        sh(f"node scripts/stills.mjs CarpoolShort out/{slug}/s_ {frames} 0.5")
        sh(f"python3 scripts/contact.py out/{slug} {frames}")


def render(slug):
    d = f"shorts/{slug}"
    sh(f"git add -A src/videos/carpool public/carpool/voice_current.wav {d} && git commit -qm 'Build {slug}' || true", check=False)
    sync(); sh("git push -q")
    run_workflow("render.yml", {"composition": "CarpoolShort", "chunks": "20", "audio": f"{d}/mix.wav", "tag": slug}, timeout=3600)
    sh("git fetch -q origin renders:refs/remotes/origin/renders --force")
    os.makedirs("out", exist_ok=True)
    sh(f"git show origin/renders:{slug}.mp4 > out/{slug}.mp4")
    print("VIDEO", os.path.abspath(f"out/{slug}.mp4"))
    print("RELEASE", f"https://github.com/{REPO}/releases/tag/{slug}")


if __name__ == "__main__":
    slug = sys.argv[1]
    start = sys.argv[sys.argv.index("--from") + 1] if "--from" in sys.argv else "voice"
    steps = ["voice", "build", "render"]
    for s in steps[steps.index(start):]:
        print(f"===== {s} =====", flush=True)
        voice(slug) if s == "voice" else build(slug, "--stills" in sys.argv) if s == "build" else render(slug)
