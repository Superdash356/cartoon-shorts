# Daily story short — runbook

One new ~35–50 s vertical cartoon story every day, in the "2D characters in a painted 3D colony" style, rendered on
GitHub Actions at 1080x1920. The owner downloads it and posts it to Reels / Shorts himself.

The product behind the channel is **Sahyatri — Community Carpool** (colony / office carpool organiser: a roster picks
the day's driver, one tap says "I'm at the pickup point", everyone sees the car arrive live). **The videos are stories,
not ads.** Viewers must come for the story; the app only appears as the thing the characters end up using to fix their
problem, in the last third, plus a soft call to action at the very end.

## 1. Find the angle (skills) — every story must be COMPLETELY new
- Run the `yt-viral` skill on the niche ("funny animated story shorts", "Zack D. Films", "office / commute / neighbour
  comedy India") when it can see YouTube; note one formula that is working this week. If it cannot reach YouTube, skip.
- **Read every earlier story first** (`shorts/*/story.json`: `title`, `beats`, `lines`) so you know what has been done.
  Then invent today's story from scratch. Do NOT open the previous story.json as a starting point and do NOT reuse its
  lines, jokes, structure or ending. Start from `scripts/story_template.json`.
- New means ALL of these differ from every earlier story: the theme/situation, the setting, the conflict, the failed
  attempt, the twist, the lesson line, which app feature fixes it (and how it is worded), the callback joke, the CTA
  line, and the order of shots after the app. Fill `beats` in story.json with one short line for each; the gate
  `scripts/check_fresh.py` (run automatically by the voice step) refuses repeats and any narration line that shares a
  4-word run with an earlier story.
- Theme menu (pick one not yet in any `beats.theme`; invent a new one when the menu is used up): the parking-spot war,
  the colleague who lives 200 m away, fuel bills split on napkins, the "2 minutes" friend, school-run chaos, monsoon
  flooded lane, the boss who carpools with the intern, the society WhatsApp group, festival traffic, the one who always
  sits in front, the aunty who reserves the front seat with a dupatta, the car that is always "in service", the cab
  surge on a rainy Monday, the new joinee with no ride, the gym buddy commute, the airport drop favour, the exam-day
  school run, the office shuttle that leaves without you, the neighbour's car that never leaves the colony.
- Failed-attempt menu (rotate; never the same as the last 30 days): a paper roster on the lift door, a spreadsheet,
  everyone turns up as driver on the same day, nobody turns up, a coin toss at the gate, a "whoever wakes first drives"
  rule, the WhatsApp group flood (use at most once a month), a fight over petrol money, waiting at the wrong gate.
- App angle menu (one or two features per story, worded freshly every time): roster picks whose turn it is; "I'm at the
  pickup point" tap; "skip today"; live map with the driver's distance; group chat in the pool; settle costs. Never claim
  anything else.
- Recurring characters stay (Rohan, Priya, Arjun, Sharma ji, the guard) but give them NEW roles and jokes; Sharma ji
  being late is allowed at most once every 7 days. New one-off characters are welcome.
- Every claim that sounds like a fact must be true or clearly a joke inside the story. Never invent statistics.
  Use web search for any real number you want to use; otherwise write the line without a number.

## 2. Write the story (`yt-script` skill)
- Use the `yt-script` skill: write 5 hooks, score them with its `hookscore.py`, keep the best. Hook = first line,
  under ~3 s, names the absurdity ("This guy bought a brand new car just to sit next to his neighbour at every red
  light."). Zack D. Films voice: deadpan, fast, third person ("this guy…"), escalation in threes, a twist, a payoff.
- Shape (≈ 18–24 lines, 150–180 words): hook → setup → escalation ×3 → twist/reveal → failed attempt → a lesson in
  one line → the app as the fix in 2–3 lines → payoff/callback joke → soft CTA naming Sahyatri. These are slots, not
  lines: write every line fresh. Vary the shape too (e.g. open on the twist and rewind, tell it from the guard's or the
  car's point of view, a countdown, a "day 1 / day 30 / day 365" diary) so two days never feel the same. Do not copy the
  example wording anywhere in this runbook.
- Gen Z English, short punchy sentences, no hashtags in the voice-over, no hard selling, never claim features the app
  does not have (it has: pools, roster with turns, "I'm at the pickup point" / ready, skip today, live map with the
  driver's distance, group chat, settle costs).
- Use `yt-package` for the post title + first caption line, and write 5 hashtags; save them in story.json `post`.

## 3. Encode it as `shorts/<YYYY-MM-DD>-<slug>/story.json`
Start from `scripts/story_template.json` (never from an earlier story) and fill `beats` first. Shot ids may repeat (e.g. cut back to "guard"). Fields:
- `title`, `voice` ("en-US-AndrewNeural"), `tempo` (1.10–1.16, aim total ≤ 50 s), `keepGap` (0.28)
- `lines`: `{text, rate, pitch, volume?, gap}` one sentence each. Modulate like a performer: hook/twist/punchlines
  lower pitch (−4…−8 Hz) and a little slower; asides/"bro" higher (+6…+10 Hz); lists fast (+20…+30 %).
  Spell names/brands the way they should be spoken.
- `shots`: `[{id, at: [line, word], music?}]` in time order; each shot starts ~3 frames before that word; the last
  shot must be `"end"` (CTA card). `music` modes: groove (default), stop, nervous, sad (trombone sting), pad, lift
  (use on "app"), end.
- `cues`: named moments `[line, word]` that drive gestures/SFX/overlays (only include those you use):
  wave, thumbs, outOf, bro, cameras, sixty, messages, roster, driver, tap, ready, watch, live, one, four, three,
  sharma, everyone, name, check, snap, guardTwist, guardHappy. App-shot cues (roster/driver/tap/ready/watch/live) are split evenly if left out.
- `punch`: `[line, word]` list of zoom punches (10–18 of them on the funniest/strongest words).
- `stopMusic`: `[[L0,k0,L1,k1]]` silence windows (e.g. right before a punchline).
- `chat` (title, members, count, me, messages[[who,msg]]) for the "chat" overlay; `meeting` (title, highlight, tiles)
  for the "meeting" overlay; `end` (headline, tagline, button); `captionsBig` (words drawn bigger in captions);
  `post` ({title, caption, hashtags}).

### Shot library (all exist in `src/videos/carpool/`)
| id | what you see |
|---|---|
| street, walk, doors | the colony lane: 4 houses, 4 parked cars, neighbours walking / standing at their doors |
| leave | Rohan (white car) then Arjun (blue) driving out of the colony gate |
| gate, dead | four cars nose-to-tail out of the gate, guard saluting |
| hook | diagonal over two cars at a red light (Rohan white, Arjun blue next to him) |
| sig1, sig2 | the two at the signal: waving (cue wave) / hand up (cue thumbs) |
| sig5, ask, lonely | close-ups: Arjun (sig5, nervous on cue outOf) / Rohan (ask, grins on cue bro) / Rohan alone, slow push |
| signal, signal2, bro | older signal framings (4 cars, side by side) |
| clock, years | booth wall clock close-up; "years" spins the hands fast (time passing) |
| guard | close-up of the gate guard: tired salutes, then cues snap (pained), guardTwist (grin), guardHappy (one happy salute) |
| office, floor | Prestige Tech Park office block, wide / push into a window |
| meeting | 2D video-call grid overlay (story.json `meeting`) |
| chat | 2D group-chat flood overlay (story.json `chat`), counter to `count` |
| app | the real Sahyatri UI kit: Home → Roster (+ "driver" notification, sticker) → Your ride with a real tap on "I'm at the pickup point" → Live map ("LIVE" sticker) |
| onecar | one car, four friends, out of the gate |
| lot | office car park: one car parks, three bays empty |
| late, where | Sharma ji running late for the waiting car; friends laughing + live-map card (cue everyone) |
| end | CTA end card (story.json `end`), App Store / Google Play badges, "Link in bio" |

Characters: Rohan (blue shirt, white car), Priya (rose kurta, red car), Arjun (green shirt, blue car, usually today's
driver), Sharma ji (yellow shirt, moustache, always late), the gate guard. Keep names consistent across days so the
channel builds recurring characters. Pick shots that serve TODAY's story; if the
story needs a place or moment the library does not have (a parking fight, rain, a school gate, a festival), add a small
new scene/prop/overlay in `src/videos/carpool/` (new ShotId + camera in story.ts, actors in world.ts, typecheck, preview
stills) rather than bending the story to fit old shots. Add at least one new shot or overlay a week.

## 4. Build and render
```bash
python3 scripts/daily.py <slug>            # voice (GitHub) -> build (tighten, mix) -> render (GitHub, 20 chunks) -> out/<slug>.mp4
python3 scripts/daily.py <slug> --from build --stills   # rebuild locally + preview stills -> out/<slug>/contact.jpg
python3 scripts/check_fresh.py <slug>                    # freshness gate (also runs before voice)
python3 scripts/daily.py <slug> --only voice             # only the voice (GitHub workflow)
python3 scripts/daily.py <slug> --from render           # only the render
```
- Check `out/<slug>/contact.jpg` (one still per shot) before rendering: subject in frame, captions readable, no
  overlay covering faces. Fix cameras in story.ts only if a new framing is needed.
- Target: total 35–50 s; the hook line under 3.5 s; no shot longer than ~3.5 s except overlays.
- After render: verify the mp4 (ffprobe: 1080x1920, audio present, duration ≈ TOTAL/30 s) and look at a contact sheet
  of the final video (ffmpeg fps=1.6 tile) before delivering.

## 5. Deliver
- Send `out/<slug>.mp4` to the owner (SendUserFile) with the post title, caption and hashtags from story.json `post`,
  and the release link `https://github.com/Superdash356/cartoon-shorts/releases/tag/<slug>`.
- Commit story.json, words, mix and any code changes to `main` (daily.py does this).
