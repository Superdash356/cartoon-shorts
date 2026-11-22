# Daily clip-tool explainer reel — runbook

One new 60–80 s vertical "real how-to" explainer every day, promoting the owner's **clipping tool** (name, handle,
comment keyword and the ONLY features we may claim are in `src/videos/clip/brand.json`). Rendered on GitHub Actions at
1080x1920 by the `ClipExplainer` Remotion composition; the owner downloads it and posts it to Reels / Shorts himself.

Look: light pastel background, white UI cards that pop in exactly on the spoken word, orange→pink→violet gradient
keywords, a caption pill that fills in word by word, and **Snip** (the channel's own pixel film-strip mascot) talking
bottom-left. Visuals are all drawn in code: invented game views, cartoon streamer facecams, UI mockups. Never use real
stream footage, real streamers' names/faces, game logos or another product's mascot.

## 1. Pick today's angle — every episode COMPLETELY new
- Run the `yt-viral` skill on the niche ("clipping side hustle", "how to make money clipping", "Whop content rewards",
  "streamer clips") when it can reach YouTube; note one formula working this week. If it cannot, skip.
- Read every earlier `shorts/*clip*/script.json` (`title`, `beats`, `lines`) first. Then write today's from scratch.
  `scripts/check_fresh_clip.py` (runs in the voice step) refuses a repeated topic/hook/cta beat or any 5-word run of
  narration shared with an earlier episode.
- Angle menu (pick one not yet used in any `beats.topic`; invent new ones when used up): clipping the newest big game
  launch / event that week; clipping podcasts; clipping a sports stream's reactions (only campaigns that allow it); "I
  left it running overnight — here's what it caught"; the 3 hooks that get clips past 1 second; why most clips get 0
  views; clipping old VODs nobody clipped; picking campaigns (rate, budget left, rules); a day-in-the-life of a clipper;
  posting schedule maths; "chat knows before you do" (why chat spikes find moments); turning one stream into a week of
  posts; mistakes that get clips rejected; scams to avoid; editing-vs-clipping time comparison.
- Every fact must be true and current: use web search for any number (campaign rates, launch dates, platform rules)
  and keep the money claims modest ("around", "about"). As of Nov 2026 the median clipping campaign rate was about
  $1 per 1,000 views (Content Rewards' own published data). Never promise earnings. Never claim tool features that are
  not in `brand.json` `features`. Always include the honest rules: clip only creators/campaigns that allow it, never pay
  to join a campaign.

## 2. Write it (`yt-script` skill)
- 5 hooks, score with `hookscore.py`, keep the best; the hook line is under ~3 s and names a payoff or a surprise.
- Shape (18–24 lines, 190–240 words, ≈ 60–80 s): hook → promise ("step by step") → why it pays / the opportunity →
  the hard part → the tool as the fix (2–4 lines, features from brand.json, spoken name = `brand.spoken`) → how to post
  → honest warning(s) → urgency line → CTA "Comment <keyword> and I'll send you …". Vary the order and the framing
  daily (countdown, myth vs fact, "3 mistakes", diary, before/after) — not the same shape two days running.
- Friendly, confident, second person, short sentences. Spell the keyword in the voice line in lower case ("comment
  clip") — the captions show it in caps automatically.
- Use `yt-package` for the post title + first caption line; 5 hashtags → `post`.

## 3. Encode `shorts/<YYYY-MM-DD>-clip-<slug>/script.json`
Copy the shape of the first episode (`shorts/2026-11-21-clip-gta6-payday/script.json`) but none of its wording.
- `title`, `voice` ("en-US-AndrewNeural"), `tempo` (1.04–1.10), `keepGap` (0.3), `beats` {topic, hook, money, pain,
  tool, rules, warnings, cta}, `hl` (lower-case words drawn in gradient in the captions), `lines` [{text, rate, pitch,
  gap}], `scenes`, `post`.
- Cue points are `[line, word]` (0-based; words split on spaces, "GTA 6" = two words). Every scene starts on its `at`;
  items inside pop in on their own `at`. Text supports `**gradient**`, `\n`, and `{name}` / `{handle}` / `{keyword}`.
- A scene change every 1–2 lines (≈ 3–6 s). 12–18 scenes per episode.

### Scene library (`src/videos/clip/scenes.tsx`)
| type | fields | what you see |
|---|---|---|
| big | headline, pill {label,value,at}, note {text,at} | huge statement + date/number pill + note |
| title | kicker, headline, sub {text,at} | "A REAL HOW-TO" title card |
| grid | headline, dim {at,text} | 2x2 live stream tiles; later greyed with a card over them |
| flow | headline, nodes[2] {label,text,at,hot}, arrow {text,at}, chips[] | who-pays-whom diagram |
| stat | label, value, sub, eq[] {text,at,small,hot}, chips[] {text,at,icon} | big gradient number + maths + chips |
| scrub | headline, label, total, quit {at,text} | watching a long stream by hand, timer racing |
| brand | headline (use {name}), logoAt | tool logo reveal (scissors mark + name) |
| live | link {at,text}, chatAt, spikeAt, momentAt | paste link → live chat → spike meter → "MOMENT FOUND" |
| phone | cutAt, flipAt, capsAt, labels[], caption | 16:9 stream → cut bracket → vertical clip with facecam + captions |
| clips | headline, count, chips[] | counter + row of finished vertical clips |
| posts | headline, apps[], appAt[], total {text,at} | posting matrix (clips × apps) |
| list | kicker, headline, items[] {text,at,icon: one/two/three/check/x/warn}, warn | rules / warnings / steps |
| bars | headline, values[], labels[], hot, hotAt | bar chart, first `hot` bars turn gradient |
| cta | headline, typeAt, postAt, doneAt, done | comment box typing the keyword → Post → "I'll send you the link ✓" |
| term | headline, command {text,at}, output[] {text,at,hot} | dark command window typing |
| react | headline | big cartoon streamer facecam reacting |
| verdict | headline, title, views, rows[] {text,at,ok}, stamp {text,at,ok}, payout {text,at} | campaign submission card → APPROVED/REJECTED stamp |
| myth | label, myth, bustAt, fact {text,at}, note {text,at,icon} | myth card struck through + BUSTED stamp → green FACT card |
If the story needs a visual the library lacks, add a new scene type in scenes.tsx (register it in SCENE_TYPES,
typecheck, preview stills) rather than bending the story. Add at least one new scene type a week.

## 4. Build and render
```bash
python3 scripts/clip_daily.py <slug>                         # voice (GitHub) -> build -> render (GitHub) -> out/<slug>.mp4
python3 scripts/clip_daily.py <slug> --from build --stills   # rebuild locally + preview stills -> out/<slug>/contact.jpg
python3 scripts/clip_daily.py <slug> --from render
```
- Before rendering, check `out/<slug>/contact.jpg`: every scene readable, nothing overlapping the caption pill
  (y ≈ 1390–1520) or Snip (bottom-left), cue timings match the words (fix `[line, word]` indices using the printed
  words.json if something appears early/late).
- After render: ffprobe (1080x1920, audio present, duration ≈ build's DURATION) and a contact sheet of the final mp4
  (ffmpeg fps=1/3 tile) before delivering.

## 5. Deliver
Send `out/<slug>.mp4` (SendUserFile) with the post title, caption and hashtags from `post`, and the release link
`https://github.com/Superdash356/cartoon-shorts/releases/tag/<slug>`. Commit everything to `main` (the script does).
