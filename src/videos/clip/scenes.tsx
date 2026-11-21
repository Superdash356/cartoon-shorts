// Scene templates for the clip explainer. Each scene gets the script entry (`s`, already timed: s.a..s.b seconds) and
// the current time `t` in seconds. Any [line, word] inside a scene is turned into seconds with T().
import React from "react";
import { At, BRAND, Placed, fill, tAt } from "./timeline";
import {
  appear, Card, Chip, clamp, easeInOut, easeOut, fadeIn, G2, GameView, GradText, GREEN, GREY, Headline, Icon, IconName, INK, Kicker,
  lerp, LiveBadge, pop, rnd, Rich, StreamTile, UI, VerticalClip, GRAD, Facecam, LINE,
} from "./ui";

type P = { s: Placed; t: number };
type Item = { text: string; at?: At; hot?: boolean; icon?: IconName; small?: boolean; label?: string };
const T = (s: Placed, at?: unknown, d = 0) => tAt(at as At | undefined, s.a + d);
const items = (x: unknown) => (x ?? []) as Item[];
const STAGE: React.CSSProperties = { position: "absolute", left: 0, right: 0, top: 210, height: 1130, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 46 };

// ---------------------------------------------------------------- big statement (+ date pill + note)
const Big: React.FC<P> = ({ s, t }) => {
  const pill = s.pill as { label: string; value: string; at: At } | undefined, note = s.note as Item | undefined;
  return (
    <div style={STAGE}>
      <div style={appear(t, s.a)}><Headline text={fill(s.headline as string)} size={150} /></div>
      {pill && <div style={appear(t, T(s, pill.at, 0.4))}><Card pad={0} style={{ overflow: "hidden", textAlign: "center", minWidth: 330 }}>
        <div style={{ background: GRAD, color: "#fff", fontWeight: 800, fontSize: 26, letterSpacing: 3, padding: "8px 0" }}>{pill.label}</div>
        <div style={{ fontWeight: 800, fontSize: 84, padding: "10px 36px 18px", letterSpacing: -2 }}>{pill.value}</div></Card></div>}
      {note && <div style={{ ...appear(t, T(s, note.at, 0.8)), fontFamily: UI, fontWeight: 700, fontSize: 52, color: INK, textAlign: "center", maxWidth: 900 }}><Rich text={fill(note.text)} /></div>}
    </div>
  );
};

// ---------------------------------------------------------------- title card
const Title: React.FC<P> = ({ s, t }) => {
  const sub = s.sub as Item | undefined;
  return (
    <div style={STAGE}>
      {s.kicker ? <div style={appear(t, s.a)}><Kicker text={s.kicker as string} /></div> : null}
      <div style={appear(t, s.a + 0.12)}><Headline text={fill(s.headline as string)} size={108} /></div>
      {sub && <div style={{ ...appear(t, T(s, sub.at, 0.5)), fontFamily: UI, fontWeight: 600, fontSize: 40, color: GREY }}><Rich text={fill(sub.text)} /></div>}
    </div>
  );
};

// ---------------------------------------------------------------- 2x2 live streams
const Grid: React.FC<P> = ({ s, t }) => {
  const dim = s.dim as Item | undefined, dt = dim ? T(s, dim.at, 99) : 99, d = easeOut((t - dt) / 0.4);
  const views = ["62K", "48K", "71K", "55K"];
  return (
    <div style={STAGE}>
      <div style={appear(t, s.a)}><Headline text={fill(s.headline as string)} size={88} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "470px 470px", gap: 26, position: "relative" }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ ...appear(t, s.a + 0.15 + i * 0.12), filter: `grayscale(${d}) blur(${d * 2}px)`, opacity: fadeIn(t, s.a + 0.15 + i * 0.12) * (1 - d * 0.55) }}>
            <StreamTile t={t + i * 3.1} w={470} h={290} seed={i + 1} viewers={views[i]} />
          </div>
        ))}
        {dim && t >= dt && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={appear(t, dt)}><Card style={{ fontWeight: 800, fontSize: 64, padding: "26px 44px" }}><Rich text={dim.text} /></Card></div></div>}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- who pays whom
const Flow: React.FC<P> = ({ s, t }) => {
  const nodes = items(s.nodes), arrow = s.arrow as Item, chips = items(s.chips), ta = T(s, arrow?.at, 0.6);
  const Node = (n: Item, i: number) => (
    <div key={i} style={appear(t, T(s, n.at, 0.3 + i * 0.6))}>
      <Card hot={n.hot} style={{ width: 640, textAlign: "center", padding: "28px 30px" }}>
        <div style={{ fontWeight: 700, fontSize: 30, color: GREY, marginBottom: 6 }}>{n.label}</div>
        <div style={{ fontWeight: 800, fontSize: 62, letterSpacing: -1.5 }}><Rich text={n.text} /></div>
      </Card>
    </div>
  );
  return (
    <div style={{ ...STAGE, gap: 30 }}>
      <div style={appear(t, s.a)}><Headline text={fill(s.headline as string)} size={84} /></div>
      {nodes[0] && Node(nodes[0], 0)}
      <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: fadeIn(t, ta), fontFamily: UI, fontWeight: 800, fontSize: 46 }}>
        <svg width="40" height={110 * easeOut((t - ta) / 0.4) + 1}><path d={`M20 0 V ${Math.max(0, 110 * easeOut((t - ta) / 0.4) - 18)} M8 ${110 * easeOut((t - ta) / 0.4) - 26} l12 16 l12 -16`} stroke={G2} strokeWidth="6" fill="none" strokeLinecap="round" /></svg>
        <GradText>{arrow?.text}</GradText>
      </div>
      {nodes[1] && Node(nodes[1], 1)}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, minHeight: 170 }}>
        {chips.map((c, i) => <div key={i} style={appear(t, T(s, c.at, 1.5 + i))}><Chip text={c.text} hot={c.hot} icon={c.icon} /></div>)}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- big number + maths + chips
const Stat: React.FC<P> = ({ s, t }) => {
  const eq = items(s.eq), chips = items(s.chips);
  return (
    <div style={{ ...STAGE, gap: 34 }}>
      <div style={appear(t, s.a)}><Card style={{ textAlign: "center", padding: "30px 70px 36px" }}>
        <div style={{ fontWeight: 700, fontSize: 36, color: GREY }}>{s.label as string}</div>
        <div style={{ fontWeight: 800, fontSize: 210, lineHeight: 1, letterSpacing: -8, margin: "6px 0" }}><GradText>{s.value as string}</GradText></div>
        <div style={{ fontWeight: 700, fontSize: 40 }}>{s.sub as string}</div></Card></div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minHeight: 280 }}>
        {eq.map((e, i) => <div key={i} style={{ ...appear(t, T(s, e.at, 1 + i)), fontFamily: UI, fontWeight: 800, fontSize: e.hot ? 120 : e.small ? 48 : 72, color: e.small ? GREY : INK, letterSpacing: -2 }}>
          {e.hot ? <GradText>{e.text}</GradText> : e.text}</div>)}
      </div>
      <div style={{ display: "flex", gap: 18, minHeight: 80 }}>
        {chips.map((c, i) => <div key={i} style={appear(t, T(s, c.at, 3 + i))}><Chip text={c.text} hot={c.hot} icon={c.icon ?? "check"} style={{ fontSize: 34 }} /></div>)}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- scrubbing by hand
const Scrub: React.FC<P> = ({ s, t }) => {
  const quit = s.quit as Item | undefined, tq = quit ? T(s, quit.at, 99) : 99, dt = t - s.a;
  const secs = 12 * 60 + 4 + dt * 410 * (1 - 0.6 * clamp((t - tq) / 0.6)), prog = clamp(secs / (8 * 3600));
  const hms = (x: number) => `${Math.floor(x / 3600)}:${String(Math.floor(x / 60) % 60).padStart(2, "0")}:${String(Math.floor(x) % 60).padStart(2, "0")}`;
  return (
    <div style={STAGE}>
      <div style={appear(t, s.a)}><Headline text={fill(s.headline as string)} size={84} /></div>
      <div style={appear(t, s.a + 0.2)}><Card style={{ width: 940, padding: 34 }}>
        <div style={{ position: "relative", height: 440, borderRadius: 20, overflow: "hidden" }}>
          <StreamTile t={t * 0.25} w={872} h={440} seed={3} viewers="41K" />
          <div style={{ position: "absolute", right: 18, bottom: 18, background: "rgba(0,0,0,.6)", color: "#fff", fontFamily: UI, fontWeight: 800, fontSize: 30, padding: "8px 16px", borderRadius: 12 }}>▶ 1×</div>
        </div>
        <div style={{ fontWeight: 700, fontSize: 32, color: GREY, margin: "26px 0 12px" }}>{s.label as string}</div>
        <div style={{ height: 22, borderRadius: 99, background: "#efeaf6", overflow: "hidden" }}><div style={{ width: `${prog * 100}%`, height: "100%", background: GRAD }} /></div>
        <div style={{ fontWeight: 800, fontSize: 46, marginTop: 14, fontVariantNumeric: "tabular-nums" }}>{hms(secs)} <span style={{ color: GREY }}>/ {s.total as string}</span></div>
      </Card></div>
      <div style={{ minHeight: 90 }}>{quit && <div style={appear(t, tq)}><Chip text={quit.text} icon="x" style={{ fontSize: 40 }} /></div>}</div>
    </div>
  );
};

// ---------------------------------------------------------------- brand reveal
const Brand: React.FC<P> = ({ s, t }) => {
  const tl = T(s, s.logoAt, 0.4), p = pop(t, tl, 0.55);
  return (
    <div style={STAGE}>
      <div style={appear(t, s.a)}><Headline text={fill(s.headline as string)} size={92} /></div>
      <div style={{ opacity: fadeIn(t, tl, 0.2), transform: `scale(${0.6 + 0.4 * p}) rotate(${(1 - p) * -8}deg)`, display: "flex", alignItems: "center", gap: 34 }}>
        <div style={{ width: 230, height: 230, borderRadius: 64, background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 30px 70px rgba(255,77,141,.35)" }}>
          <Icon name="scissors" size={140} color="#fff" /></div>
        <div style={{ fontFamily: UI, fontWeight: 800, fontSize: 150, letterSpacing: -6, color: INK }}>{BRAND.name}</div>
      </div>
      <div style={{ ...appear(t, tl + 0.5), display: "flex", gap: 16 }}><Chip text="watches the stream" icon="eye" /><Chip text="cuts the clips" icon="scissors" /></div>
    </div>
  );
};

// ---------------------------------------------------------------- the live panel: link → chat → spike → moment
const MSGS = ["lol", "W stream", "bro", "gg", "nahhh", "what was that", "LMAO", "chat is he serious", "lets gooo", "KEKW", "no way", "?????", "CLIP THAT", "HOLY", "NO WAYYY", "LMAOOOO", "insane", "BROOO"];
const NAMES = ["nova_99", "kxng", "jaybird", "pixelpete", "milo.exe", "zara", "trent", "big_t", "luna", "dex", "ok_boomer", "frostyy", "rio", "samwise"];
const Live: React.FC<P> = ({ s, t }) => {
  const link = s.link as Item, tl = T(s, link.at, 0.3), tc = T(s, s.chatAt, 1.2), tsp = T(s, s.spikeAt, 2.5), tm = T(s, s.momentAt, 3);
  const hype = clamp((t - tsp) / 0.4) * (1 - clamp((t - tsp - 3.5) / 1));
  const typed = link.text.slice(0, Math.max(0, Math.floor((t - tl) / 0.04)));
  // chat: message index grows with a rate that jumps at the spike
  const rate = (x: number) => (x < tc ? 0 : x < tsp ? (x - tc) * 2.2 : (tsp - tc) * 2.2 + (x - tsp) * 11);
  const n = rate(t), shown = Array.from({ length: 7 }, (_, i) => Math.floor(n) - i).filter((k) => k >= 0);
  const bars = Array.from({ length: 22 }, (_, i) => { const x = t - (21 - i) * 0.25; return x < tc ? 0.05 : x < tsp ? 0.18 + rnd(i + Math.floor(x * 4)) * 0.15 : 0.75 + rnd(i) * 0.25; });
  return (
    <div style={{ ...STAGE, gap: 22 }}>
      <div style={{ ...appear(t, s.a), width: 980 }}>
        <Card style={{ display: "flex", alignItems: "center", gap: 18, padding: "20px 26px" }}>
          <Icon name="link" size={44} color={G2} />
          <div style={{ flex: 1, fontWeight: 700, fontSize: 38, color: typed ? INK : GREY }}>{typed || "paste a stream link…"}<span style={{ opacity: t > tl && t < tc && Math.floor(t * 3) % 2 ? 1 : 0 }}>|</span></div>
          <div style={{ background: GRAD, color: "#fff", fontWeight: 800, fontSize: 32, padding: "12px 26px", borderRadius: 16, transform: `scale(${t > tc - 0.25 && t < tc ? 0.92 : 1})` }}>Watch</div>
        </Card>
      </div>
      <div style={{ ...appear(t, s.a + 0.15), position: "relative" }}>
        <StreamTile t={t} w={980} h={500} seed={2} viewers="87K" hype={hype} />
        {t > tm && <div style={{ position: "absolute", right: 22, top: 22, ...appear(t, tm, 20) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: GRAD, color: "#fff", fontFamily: UI, fontWeight: 800, fontSize: 40, padding: "14px 24px", borderRadius: 18, boxShadow: "0 16px 40px rgba(255,77,141,.45)" }}>
            <Icon name="scissors" size={40} color="#fff" />MOMENT FOUND</div></div>}
      </div>
      <div style={{ display: "flex", gap: 22, ...appear(t, s.a + 0.3) }}>
        <Card style={{ width: 560, height: 330, padding: "22px 26px", overflow: "hidden", background: "#17131f", color: "#fff", border: "none" }}>
          <div style={{ fontWeight: 800, fontSize: 26, color: "#a99fc0", marginBottom: 10 }}>LIVE CHAT</div>
          <div style={{ display: "flex", flexDirection: "column-reverse", height: 250, justifyContent: "flex-start" }}>
          {shown.map((k, i) => (
            <div key={k} style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.32, opacity: 1 - i * 0.11, whiteSpace: "nowrap" }}>
              <span style={{ color: ["#ff8a3d", "#5ec8ff", "#c38bff", "#4fe39a"][k % 4] }}>{NAMES[Math.floor(rnd(k * 3.7) * NAMES.length)]}: </span>
              {(k > (tsp - tc) * 2.2 ? MSGS.slice(11) : MSGS.slice(0, 12))[(k * 5) % (k > (tsp - tc) * 2.2 ? 7 : 12)]}
            </div>
          ))}
          </div>
        </Card>
        <Card style={{ width: 398, height: 330, padding: "22px 24px" }}>
          <div style={{ fontWeight: 800, fontSize: 26, color: GREY }}>CHAT / 10 S</div>
          <div style={{ fontWeight: 800, fontSize: 64, letterSpacing: -2, color: hype > 0.3 ? "#e5484d" : INK, fontVariantNumeric: "tabular-nums" }}>{Math.round(t < tc ? 0 : t < tsp ? 40 + rnd(Math.floor(t * 3)) * 12 : 40 + 180 * hype)}</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 150 }}>
            {bars.map((v, i) => <div key={i} style={{ flex: 1, height: `${v * 100}%`, borderRadius: 4, background: v > 0.6 ? GRAD : "#ddd6ea" }} />)}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- 16:9 stream → cut → vertical phone
const Phone: React.FC<P> = ({ s, t }) => {
  const tc = T(s, s.cutAt, 0.3), tf = T(s, s.flipAt, 1.5), tcap = T(s, s.capsAt, 2.5), labels = items(s.labels);
  const f = easeInOut((t - tf) / 0.7), cut = easeOut((t - tc) / 0.5);
  return (
    <div style={STAGE}>
      <div style={{ position: "relative", width: 1000, height: 1080 }}>
        {/* the wide stream with a timeline and the cut bracket */}
        <div style={{ position: "absolute", left: lerp(20, -200, f), top: lerp(170, 300, f), opacity: 1 - f, transform: `scale(${lerp(1, 0.6, f)})`, transformOrigin: "left top", ...(t < s.a + 0.4 ? appear(t, s.a) : {}) }}>
          <StreamTile t={t} w={960} h={540} seed={2} viewers="87K" hype={0.7} />
          <div style={{ position: "relative", height: 70, marginTop: 30, borderRadius: 16, background: "#efeaf6" }}>
            {Array.from({ length: 30 }, (_, i) => <div key={i} style={{ position: "absolute", left: i * 32 + 6, bottom: 10, width: 20, height: 12 + rnd(i) * 26 + (i === 15 ? 30 : 0), borderRadius: 4, background: i === 15 ? G2 : "#d6cfe4" }} />)}
            <div style={{ position: "absolute", top: -8, bottom: -8, left: 480 - 120 * cut, width: 240 * cut + 1, border: `5px solid ${INK}`, borderRadius: 14, opacity: cut }} />
          </div>
        </div>
        {/* the vertical clip */}
        <div style={{ position: "absolute", left: lerp(330, 40, f), top: 40, opacity: f, transform: `scale(${lerp(0.7, 1, f)})`, transformOrigin: "center top" }}>
          <VerticalClip t={t} w={520} seed={2} caption={s.caption as string} capT={tcap} />
        </div>
        <div style={{ position: "absolute", left: lerp(20, 600, f), top: lerp(850, 120, f), display: "flex", flexDirection: f < 0.5 ? "row" : "column", flexWrap: "wrap", gap: 24, width: lerp(960, 400, f) }}>
          {labels.map((l, i) => <div key={i} style={appear(t, T(s, l.at, 0.5 + i * 1.2))}><Chip text={l.text} icon="check" style={{ fontSize: 32, maxWidth: 400 }} /></div>)}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- a row of finished clips
const CAPS = ["HE DID NOT JUST", "CHAT WENT CRAZY", "WORST PARKING EVER", "THE ESCAPE", "WAIT FOR IT", "NO WAY BRO"];
const Clips: React.FC<P> = ({ s, t }) => {
  const chips = items(s.chips), count = (s.count as number) ?? 10, c = Math.round(lerp(1, count, easeOut((t - s.a) / 2.2)));
  return (
    <div style={STAGE}>
      <div style={appear(t, s.a)}><Headline text={fill(s.headline as string)} size={84} /></div>
      <div style={{ ...appear(t, s.a + 0.1), fontFamily: UI, fontWeight: 800, fontSize: 140, letterSpacing: -5, lineHeight: 1 }}><GradText>{c}</GradText><span style={{ fontSize: 50, color: GREY, letterSpacing: 0 }}> clips</span></div>
      <div style={{ display: "flex", gap: 18 }}>
        {[0, 1, 2, 3, 4].map((i) => <div key={i} style={{ ...appear(t, s.a + 0.2 + i * 0.12), marginTop: i % 2 ? 40 : 0 }}><VerticalClip t={t + i * 2} w={182} seed={i + 3} caption={CAPS[i]} capT={-9} /></div>)}
      </div>
      <div style={{ display: "flex", gap: 16 }}>{chips.map((x, i) => <div key={i} style={appear(t, T(s, x.at, 0.6 + i * 0.4))}><Chip text={x.text} icon="check" style={{ fontSize: 34 }} /></div>)}</div>
    </div>
  );
};

// ---------------------------------------------------------------- posting matrix
const Posts: React.FC<P> = ({ s, t }) => {
  const apps = (s.apps as string[]) ?? [], ats = (s.appAt as At[]) ?? [], total = s.total as Item;
  return (
    <div style={STAGE}>
      <div style={appear(t, s.a)}><Headline text={fill(s.headline as string)} size={100} /></div>
      <div style={{ display: "flex", gap: 24 }}>
        {apps.map((a, i) => { const ta = T(s, ats[i], 0.6 + i * 0.4); return (
          <div key={i} style={{ ...appear(t, s.a + 0.2 + i * 0.12), ...(t > ta ? { transform: `scale(${1 + 0.06 * Math.sin(Math.PI * clamp((t - ta) / 0.3))})` } : {}) }}><Card style={{ width: 290, padding: 26 }}>
            <div style={{ fontWeight: 800, fontSize: 42, marginBottom: 16 }}>{a}</div>
            {[1, 2, 3].map((k) => <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 700, fontSize: 34, padding: "12px 0", borderTop: `2px solid ${LINE}` }}>
              Clip {k}<span style={{ opacity: fadeIn(t, ta + k * 0.15) }}><Icon name="check" size={36} color={GREEN} /></span></div>)}
          </Card></div>); })}
      </div>
      {total && <div style={{ ...appear(t, T(s, total.at, 0.4)), fontFamily: UI, fontWeight: 800, fontSize: 96, letterSpacing: -3 }}><GradText>{total.text}</GradText></div>}
    </div>
  );
};

// ---------------------------------------------------------------- rules / warnings list
const List: React.FC<P> = ({ s, t }) => {
  const its = items(s.items), warn = !!s.warn;
  return (
    <div style={{ ...STAGE, gap: 30 }}>
      {s.kicker ? <div style={appear(t, s.a)}><Kicker text={s.kicker as string} style={warn ? { background: "linear-gradient(90deg,#ff6b3d,#e5484d)" } : undefined} /></div> : null}
      <div style={appear(t, s.a + 0.1)}><Headline text={fill(s.headline as string)} size={110} /></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 10 }}>
        {its.map((x, i) => <div key={i} style={appear(t, T(s, x.at, 0.6 + i * 0.8))}>
          <Card style={{ width: 900, display: "flex", alignItems: "center", gap: 26, padding: "28px 34px", border: warn ? "3px solid rgba(229,72,77,.35)" : undefined }}>
            <Icon name={x.icon ?? "check"} size={64} color={x.icon === "x" ? "#e5484d" : x.icon === "warn" ? "#f5a524" : GREEN} />
            <div style={{ fontWeight: 800, fontSize: 50, letterSpacing: -1 }}><Rich text={x.text} /></div>
          </Card></div>)}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- bar chart
const Bars: React.FC<P> = ({ s, t }) => {
  const v = (s.values as number[]) ?? [], labels = (s.labels as string[]) ?? [], th = T(s, s.hotAt, 1), hot = (s.hot as number) ?? 1;
  return (
    <div style={STAGE}>
      <div style={appear(t, s.a)}><Headline text={fill(s.headline as string)} size={86} /></div>
      <Card style={{ ...appear(t, s.a + 0.15), width: 940, padding: "40px 40px 26px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 22, height: 560 }}>
          {v.map((x, i) => { const g = easeOut((t - s.a - 0.3 - i * 0.08) / 0.6); return (
            <div key={i} style={{ flex: 1, height: `${x * 100 * g}%`, borderRadius: 16, background: i < hot && t > th ? GRAD : "#e3dcef", boxShadow: i < hot && t > th ? "0 14px 30px rgba(255,77,141,.3)" : "none" }} />); })}
        </div>
        <div style={{ display: "flex", gap: 22, marginTop: 16 }}>{labels.map((l, i) => <div key={i} style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 26, color: GREY }}>{l}</div>)}</div>
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------- comment CTA
const Cta: React.FC<P> = ({ s, t }) => {
  const ty = T(s, s.typeAt, 0.5), tp = T(s, s.postAt, 1.2), td = T(s, s.doneAt, 1.8), kw = BRAND.keyword;
  const typed = kw.slice(0, Math.max(0, Math.floor((t - ty) / 0.09) + 1) * (t >= ty ? 1 : 0)), press = t > tp && t < tp + 0.18 ? 0.9 : 1;
  return (
    <div style={STAGE}>
      <div style={appear(t, s.a)}><Headline text={fill(s.headline as string)} size={112} /></div>
      <div style={appear(t, s.a + 0.15)}><Card style={{ width: 900, display: "flex", alignItems: "center", gap: 22, padding: "24px 28px" }}>
        <div style={{ width: 76, height: 76, borderRadius: 99, background: "linear-gradient(135deg,#5ec8ff,#7b5cff)" }} />
        <div style={{ flex: 1, fontWeight: 800, fontSize: 64, letterSpacing: 2 }}>{typed}<span style={{ opacity: Math.floor(t * 3) % 2 && t < tp ? 1 : 0, fontWeight: 400 }}>|</span>
          {!typed && <span style={{ color: GREY, fontWeight: 600, fontSize: 40, letterSpacing: 0 }}>Add a comment…</span>}</div>
        <div style={{ background: GRAD, color: "#fff", fontWeight: 800, fontSize: 38, padding: "16px 30px", borderRadius: 18, transform: `scale(${press})` }}>Post</div>
      </Card></div>
      <div style={{ ...appear(t, td), display: "flex", alignItems: "center", gap: 18, fontFamily: UI, fontWeight: 800, fontSize: 64, color: INK }}>
        {s.done as string}<Icon name="check" size={64} color={GREEN} /></div>
      <div style={{ ...appear(t, td + 0.6), fontFamily: UI, fontWeight: 700, fontSize: 40, color: GREY }}>{BRAND.handle}</div>
    </div>
  );
};

// ---------------------------------------------------------------- terminal / command window (for tools with a CLI or prompt box)
const Term: React.FC<P> = ({ s, t }) => {
  const cmd = s.command as Item, out = items(s.output), tc = T(s, cmd?.at, 0.4);
  const typed = (cmd?.text ?? "").slice(0, Math.max(0, Math.floor((t - tc) / 0.035)));
  return (
    <div style={STAGE}>
      {s.headline ? <div style={appear(t, s.a)}><Headline text={fill(s.headline as string)} size={86} /></div> : null}
      <div style={{ ...appear(t, s.a + 0.1), width: 960, borderRadius: 26, background: "#17131f", boxShadow: "0 26px 70px rgba(40,20,80,.35)", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 10, padding: "18px 22px", background: "#221c2d" }}>{["#ff5f57", "#febc2e", "#28c840"].map((c) => <div key={c} style={{ width: 18, height: 18, borderRadius: 99, background: c }} />)}</div>
        <div style={{ padding: "28px 34px 36px", fontFamily: "'DejaVu Sans Mono', monospace", fontSize: 38, color: "#f4f0fa", minHeight: 300, lineHeight: 1.5 }}>
          <div><span style={{ color: G2 }}>&gt; </span>{typed}<span style={{ opacity: Math.floor(t * 3) % 2 }}>▍</span></div>
          {out.map((o, i) => <div key={i} style={{ opacity: fadeIn(t, T(s, o.at, 1 + i * 0.5)), color: o.hot ? "#4fe39a" : "#a99fc0" }}>{o.text}</div>)}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- facecam-only "talking" card (a quote/reaction beat)
const React_: React.FC<P> = ({ s, t }) => (
  <div style={STAGE}>
    <div style={appear(t, s.a)}><Headline text={fill(s.headline as string)} size={90} /></div>
    <div style={{ ...appear(t, s.a + 0.15), borderRadius: 30, overflow: "hidden", boxShadow: "0 20px 50px rgba(60,30,120,.28)" }}><Facecam t={t} w={800} h={600} hype={0.8} seed={1} /></div>
  </div>
);

// ---------------------------------------------------------------- campaign submission card: brief checklist → rubber stamp
// fields: headline, title, views, rows[] {text, at, ok:false = missing}, stamp {text, at, ok}, payout {text, at}
const Verdict: React.FC<P> = ({ s, t }) => {
  const rows = (s.rows ?? []) as (Item & { ok?: boolean })[], stamp = s.stamp as (Item & { ok?: boolean }) | undefined, pay = s.payout as Item | undefined;
  const ts = stamp ? T(s, stamp.at, 99) : 99, sp = pop(t, ts, 0.35), tp = pay ? T(s, pay.at, 99) : 99;
  const target = (s.views as number) ?? 0, v = Math.round(target * easeOut((t - s.a - 0.2) / 1.6));
  const col = stamp?.ok ? GREEN : "#e5484d";
  return (
    <div style={{ ...STAGE, gap: 34 }}>
      <div style={appear(t, s.a)}><Headline text={fill(s.headline as string)} size={92} /></div>
      <div style={{ ...appear(t, s.a + 0.15), position: "relative" }}>
        <Card style={{ width: 920, padding: "30px 34px" }}>
          <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
            <VerticalClip t={t} w={150} seed={4} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 28, color: GREY, letterSpacing: 2 }}>CAMPAIGN SUBMISSION</div>
              <div style={{ fontWeight: 800, fontSize: 48, letterSpacing: -1, margin: "6px 0 14px" }}>{(s.title as string) ?? "My best clip"}</div>
              {target > 0 && <div style={{ display: "flex", alignItems: "center", gap: 12, fontWeight: 800, fontSize: 44, fontVariantNumeric: "tabular-nums" }}>
                <Icon name="eye" size={44} color={G2} />{v.toLocaleString("en-US")} views</div>}
              <div style={{ marginTop: 14, display: "inline-block", fontWeight: 800, fontSize: 28, padding: "8px 18px", borderRadius: 12, background: t > ts ? (stamp?.ok ? "#e3f7ec" : "#fde8e8") : "#f1edf7", color: t > ts ? col : GREY }}>
                {t > ts ? (stamp?.ok ? "Approved" : "Rejected") : "Pending review…"}</div>
            </div>
          </div>
          {rows.length > 0 && <div style={{ marginTop: 26, borderTop: `2px solid ${LINE}` }}>
            {rows.map((r, i) => { const tr = T(s, r.at, 0.8 + i * 0.6); return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, padding: "16px 4px", borderBottom: `2px solid ${LINE}`, opacity: fadeIn(t, tr), transform: `translateX(${(1 - easeOut((t - tr) / 0.3)) * 30}px)`,
                background: r.ok === false && t > tr ? "rgba(229,72,77,.07)" : undefined, borderRadius: 10 }}>
                <Icon name={r.ok === false ? "x" : "check"} size={44} color={r.ok === false ? "#e5484d" : GREEN} />
                <div style={{ fontWeight: 800, fontSize: 40, color: r.ok === false ? "#e5484d" : INK }}><Rich text={r.text} /></div>
              </div>); })}
          </div>}
        </Card>
        {stamp && t > ts && <div style={{ position: "absolute", right: -24, bottom: rows.length ? 150 : -66, opacity: clamp(sp * 1.4), transform: `rotate(-12deg) scale(${lerp(1.8, 1, sp)})`,
          border: `9px solid ${col}`, color: col, borderRadius: 22, padding: "10px 30px", fontFamily: UI, fontWeight: 800, fontSize: rows.length ? 92 : 78, letterSpacing: 4, background: "rgba(255,255,255,.88)" }}>{stamp.text}</div>}
      </div>
      <div style={{ minHeight: 120, marginTop: rows.length ? 0 : 90 }}>{pay && <div style={{ ...appear(t, tp), fontFamily: UI, fontWeight: 800, fontSize: 92, letterSpacing: -3 }}><Rich text={pay.text} /></div>}</div>
    </div>
  );
};

// GameView is used by the stream tiles; re-exported here so new scene types can draw a bare game view too.
export { GameView };

export const SCENE_TYPES: Record<string, React.FC<P>> = {
  big: Big, title: Title, grid: Grid, flow: Flow, stat: Stat, scrub: Scrub, brand: Brand, live: Live, phone: Phone,
  clips: Clips, posts: Posts, list: List, bars: Bars, cta: Cta, term: Term, react: React_, verdict: Verdict,
};
