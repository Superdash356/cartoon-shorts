// Shared look for the clip explainer: pastel light UI, white cards, orange→pink→violet gradient keywords, Manrope,
// inline SVG icons (no emoji fonts needed on the render runners), the "Snip" mascot, and procedural stream visuals
// (an invented open-world game view + a cartoon streamer facecam — no real footage, no real people, no game IP).
import React from "react";
import { staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";

for (const [w, f] of [[500, "Medium"], [600, "SemiBold"], [700, "Bold"], [800, "ExtraBold"]] as const)
  loadFont({ family: "Manrope", url: staticFile(`fonts/Manrope_${w}${f}.ttf`), weight: String(w) });

export const UI = "Manrope, 'Helvetica Neue', Arial, sans-serif";
export const INK = "#16131c", GREY = "#8b8496", LINE = "rgba(40,20,70,.08)";
export const G1 = "#ff8a3d", G2 = "#ff4d8d", G3 = "#a64dff";
export const GRAD = `linear-gradient(90deg, ${G1}, ${G2} 55%, ${G3})`;
export const GREEN = "#22b26b";

// ---------------------------------------------------------------- easing
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeInOut = (x: number) => { const k = clamp(x); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
/** 0→1 with a small overshoot, starting at time `at`, over `d` seconds */
export const pop = (t: number, at: number, d = 0.42) => {
  const x = clamp((t - at) / d);
  if (x <= 0) return 0;
  const c1 = 1.5, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
export const fadeIn = (t: number, at: number, d = 0.3) => easeOut((t - at) / d);
/** style for an element that pops in at `at`: rises + scales */
export const appear = (t: number, at: number, dy = 34): React.CSSProperties => {
  const p = pop(t, at), o = fadeIn(t, at, 0.22);
  return { opacity: o, transform: `translateY(${(1 - p) * dy}px) scale(${0.92 + 0.08 * p})` };
};
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const rnd = hash;

// ---------------------------------------------------------------- text
export const GradText: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <span style={{ backgroundImage: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", ...style }}>{children}</span>
);
/** "plain **gradient** plain\nnext line" */
export const Rich: React.FC<{ text: string; style?: React.CSSProperties }> = ({ text, style }) => (
  <span style={style}>
    {text.split("\n").map((ln, i) => (
      <React.Fragment key={i}>
        {i > 0 && <br />}
        {ln.split(/(\*\*[^*]+\*\*)/).map((p, j) => p.startsWith("**") ? <GradText key={j}>{p.slice(2, -2)}</GradText> : <span key={j}>{p}</span>)}
      </React.Fragment>
    ))}
  </span>
);
export const Headline: React.FC<{ text: string; size?: number; style?: React.CSSProperties }> = ({ text, size = 92, style }) => (
  <div style={{ fontFamily: UI, fontWeight: 800, fontSize: size, lineHeight: 1.06, letterSpacing: -size * 0.035, color: INK, textAlign: "center", ...style }}>
    <Rich text={text} />
  </div>
);
export const Kicker: React.FC<{ text: string; style?: React.CSSProperties }> = ({ text, style }) => (
  <div style={{ display: "inline-block", padding: "10px 22px", borderRadius: 999, background: GRAD, color: "#fff", fontFamily: UI, fontWeight: 800, fontSize: 28, letterSpacing: 2, ...style }}>{text}</div>
);

// ---------------------------------------------------------------- cards
export const Card: React.FC<{ children: React.ReactNode; hot?: boolean; style?: React.CSSProperties; pad?: number }> = ({ children, hot, style, pad = 30 }) => (
  <div style={{ position: "relative", background: "#fff", borderRadius: 30, padding: pad, boxShadow: "0 22px 60px rgba(110,60,170,.14), 0 2px 6px rgba(0,0,0,.04)",
    border: hot ? "4px solid transparent" : `2px solid ${LINE}`, backgroundImage: hot ? `linear-gradient(#fff,#fff), ${GRAD}` : undefined,
    backgroundOrigin: "border-box", backgroundClip: hot ? "padding-box, border-box" : undefined, fontFamily: UI, color: INK, ...style }}>{children}</div>
);
export const Chip: React.FC<{ text: string; hot?: boolean; icon?: IconName; style?: React.CSSProperties }> = ({ text, hot, icon, style }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "14px 26px", borderRadius: 999, fontFamily: UI, fontWeight: 800, fontSize: 36,
    background: hot ? GRAD : "#fff", color: hot ? "#fff" : INK, boxShadow: "0 12px 30px rgba(110,60,170,.14)", border: hot ? "none" : `2px solid ${LINE}`, ...style }}>
    {icon && <Icon name={icon} size={34} color={hot ? "#fff" : icon === "x" ? "#e5484d" : icon === "warn" ? "#f5a524" : GREEN} />}
    <Rich text={text} />
  </div>
);

// ---------------------------------------------------------------- icons
export type IconName = "check" | "x" | "warn" | "scissors" | "link" | "arrow" | "bolt" | "one" | "two" | "three" | "eye" | "money" | "clock";
export const Icon: React.FC<{ name: IconName; size?: number; color?: string }> = ({ name, size = 40, color = INK }) => {
  const s = { width: size, height: size, flex: "none" as const };
  const st = { fill: "none", stroke: color, strokeWidth: 2.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "one" || name === "two" || name === "three")
    return (<div style={{ ...s, borderRadius: 999, background: GRAD, color: "#fff", fontFamily: UI, fontWeight: 800, fontSize: size * 0.55, display: "flex", alignItems: "center", justifyContent: "center" }}>{name === "one" ? 1 : name === "two" ? 2 : 3}</div>);
  return (
    <svg viewBox="0 0 24 24" style={s}>
      {name === "check" && <path d="M4.5 12.5l4.5 4.5L19.5 6.5" {...st} strokeWidth={3} />}
      {name === "x" && <><circle cx="12" cy="12" r="9.5" {...st} /><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" {...st} /></>}
      {name === "warn" && <><path d="M12 3.5L22 20.5H2z" {...st} /><path d="M12 10v4.5" {...st} /><circle cx="12" cy="17.6" r="0.6" fill={color} stroke={color} /></>}
      {name === "scissors" && <><circle cx="6" cy="6.5" r="3" {...st} /><circle cx="6" cy="17.5" r="3" {...st} /><path d="M8.4 8.2L20 18M8.4 15.8L20 6" {...st} /></>}
      {name === "link" && <><path d="M10 14a4.5 4.5 0 006.4 0l3-3a4.5 4.5 0 00-6.4-6.4l-1 1" {...st} /><path d="M14 10a4.5 4.5 0 00-6.4 0l-3 3a4.5 4.5 0 006.4 6.4l1-1" {...st} /></>}
      {name === "arrow" && <path d="M3 12h17M14 6l6 6-6 6" {...st} />}
      {name === "bolt" && <path d="M13 2.5L4.5 13.5H12L11 21.5l8.5-11H12z" {...st} fill={color} />}
      {name === "eye" && <><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" {...st} /><circle cx="12" cy="12" r="3" {...st} /></>}
      {name === "money" && <><rect x="2.5" y="6" width="19" height="12" rx="2.5" {...st} /><circle cx="12" cy="12" r="2.8" {...st} /></>}
      {name === "clock" && <><circle cx="12" cy="12" r="9.5" {...st} /><path d="M12 7v5.5l3.5 2" {...st} /></>}
    </svg>
  );
};

// ---------------------------------------------------------------- background
export const Background: React.FC<{ t: number }> = ({ t }) => {
  const a = Math.sin(t * 0.22) * 8, b = Math.cos(t * 0.17) * 10;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fbf9fd", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 1500, height: 1500, left: -700 + a * 6, top: -650 + b * 5, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,150,200,.38), rgba(255,150,200,0) 65%)" }} />
      <div style={{ position: "absolute", width: 1500, height: 1500, left: 250 - a * 5, top: 900 + b * 4, borderRadius: "50%", background: "radial-gradient(circle, rgba(140,190,255,.34), rgba(140,190,255,0) 65%)" }} />
      <div style={{ position: "absolute", width: 1100, height: 1100, left: 500 + b * 4, top: -300 - a * 3, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,150,255,.26), rgba(200,150,255,0) 65%)" }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
        <defs><pattern id="dots" width="54" height="54" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="rgba(90,60,140,.18)" /></pattern></defs>
        <rect width="1080" height="1920" fill="url(#dots)" />
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------- Snip, the channel mascot (original pixel character)
// A little film-strip creature: violet body with sprocket holes along its top and bottom edge, big eyes, tiny legs.
const SNIP = [
  "...bbbbbbbbbb...",
  "..bhbbhbbhbbhb..",
  ".bbbbbbbbbbbbbb.",
  "bbbbbbbbbbbbbbbb",
  "bbbwwwbbbbwwwbbb",
  "bbbwwkbbbbwwkbbb",
  "bbbwwkbbbbwwkbbb",
  "bbbbbbbbbbbbbbbb",
  "bbppbbbmmbbbppbb",
  "bbbbbbbbbbbbbbbb",
  ".bbbbbbbbbbbbbb.",
  "..bhbbhbbhbbhb..",
  "...bbbbbbbbbb...",
  "....dd....dd....",
];
const PAL: Record<string, string> = { b: "#7b5cff", h: "#e6e0ff", w: "#ffffff", k: "#16131c", p: "#ff8fb8", m: "#2b1f4f", d: "#4b36c9" };
export const Snip: React.FC<{ t: number; talk: boolean; size?: number; happy?: boolean }> = ({ t, talk, size = 150, happy }) => {
  const px = size / 16, blink = (t % 3.7) < 0.12, bob = Math.sin(t * 5.2) * (talk ? 4 : 2);
  const mouthOpen = talk && Math.sin(t * 38) > -0.2;
  const cells: React.ReactNode[] = [];
  SNIP.forEach((row, y) => row.split("").forEach((c, x) => {
    if (c === ".") return;
    let col = PAL[c];
    if (blink && (c === "w" || c === "k") && y !== 6) col = PAL.b;
    if (blink && (c === "w" || c === "k") && y === 6) col = PAL.k;
    if (happy && (c === "w" || c === "k")) col = y === 4 ? PAL.k : PAL.b;
    cells.push(<rect key={`${x}-${y}`} x={x * px} y={y * px} width={px + 0.6} height={px + 0.6} fill={col} />);
  }));
  if (mouthOpen) cells.push(<rect key="mo" x={6.5 * px} y={8.5 * px} width={3 * px} height={1.5 * px} rx={px * 0.5} fill={PAL.m} />);
  return (
    <svg width={size} height={size * 14 / 16} style={{ transform: `translateY(${bob}px)`, filter: "drop-shadow(0 10px 14px rgba(80,50,160,.28))", overflow: "visible" }}>{cells}</svg>
  );
};

// ---------------------------------------------------------------- stream visuals (procedural)
const SKIES = [["#ffb36b", "#ff6f91", "#7a5cff"], ["#7fd3ff", "#bfe9ff", "#ffe2a8"], ["#ff9a62", "#ffcf7a", "#8fd0ff"], ["#3a2b6b", "#a24f9b", "#ff8a5b"], ["#9ee6c9", "#d9f7ff", "#ffd6a5"]];
/** an invented sunny open-world street: sky, sun, palms, skyline, a road rushing toward camera, a car */
export const GameView: React.FC<{ t: number; seed?: number; w: number; h: number; speed?: number }> = ({ t, seed = 0, w, h, speed = 1 }) => {
  const sky = SKIES[seed % SKIES.length], hz = h * 0.52, run = (t * speed * 1.4 + seed) % 1;
  const palms = [0.08, 0.2, 0.8, 0.93].map((x, i) => ({ x: x * w + (rnd(seed + i) - 0.5) * 40, s: 0.7 + rnd(seed * 3 + i) * 0.5 }));
  const tower = Array.from({ length: 9 }, (_, i) => ({ x: (i / 9) * w + rnd(seed + i * 7) * 30, bw: 30 + rnd(seed + i) * 50, bh: 40 + rnd(seed * 2 + i) * h * 0.25 }));
  const carX = w * 0.5 + Math.sin(t * 1.3 + seed) * w * 0.08, carY = h * 0.8 + Math.sin(t * 9) * 1.5;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`sk${seed}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sky[2]} /><stop offset="0.6" stopColor={sky[1]} /><stop offset="1" stopColor={sky[0]} /></linearGradient>
      </defs>
      <rect width={w} height={hz} fill={`url(#sk${seed})`} />
      <circle cx={w * (0.3 + rnd(seed) * 0.4)} cy={hz * 0.55} r={h * 0.09} fill="#fff5c4" opacity={0.85} />
      {tower.map((b, i) => <rect key={i} x={b.x} y={hz - b.bh} width={b.bw} height={b.bh} fill="rgba(60,40,90,.35)" />)}
      <rect y={hz} width={w} height={h - hz} fill="#6f8f5a" />
      <polygon points={`${w * 0.47},${hz} ${w * 0.53},${hz} ${w * 1.05},${h} ${-w * 0.05},${h}`} fill="#4a4a55" />
      {[0, 1, 2, 3, 4].map((i) => {
        const k = ((i + run) / 5), y0 = hz + (h - hz) * k * k, y1 = hz + (h - hz) * Math.min(1, (k + 0.08) ** 2);
        const hw = (y: number) => ((y - hz) / (h - hz)) * w * 0.012 + 1;
        return <polygon key={i} points={`${w / 2 - hw(y0)},${y0} ${w / 2 + hw(y0)},${y0} ${w / 2 + hw(y1)},${y1} ${w / 2 - hw(y1)},${y1}`} fill="#ffe28a" />;
      })}
      {palms.map((p, i) => (
        <g key={i} transform={`translate(${p.x},${hz + 10}) scale(${p.s * h / 300})`}>
          <path d="M0 0 C -2 -40, 4 -70, 2 -95" stroke="#4b3a2a" strokeWidth="5" fill="none" />
          {[-60, -25, 15, 50, 85, 130].map((a, j) => <path key={j} d="M2 -95 q 18 -12 34 4" stroke="#2f6b3c" strokeWidth="7" fill="none" strokeLinecap="round" transform={`rotate(${a + Math.sin(t * 2 + j) * 4} 2 -95)`} />)}
        </g>
      ))}
      <g transform={`translate(${carX},${carY})`}>
        <rect x={-w * 0.09} y={-h * 0.09} width={w * 0.18} height={h * 0.08} rx={h * 0.02} fill={["#e8443a", "#2f7cf6", "#f5b700", "#1fbf75", "#ff5fa2"][seed % 5]} />
        <rect x={-w * 0.065} y={-h * 0.135} width={w * 0.13} height={h * 0.055} rx={h * 0.015} fill="#2a2433" />
        <rect x={-w * 0.085} y={-h * 0.015} width={w * 0.03} height={h * 0.025} rx={4} fill="#111" />
        <rect x={w * 0.055} y={-h * 0.015} width={w * 0.03} height={h * 0.025} rx={4} fill="#111" />
      </g>
    </svg>
  );
};

/** cartoon streamer facecam: headset, reacts (mouth wide, eyebrows up) when `hype` > 0 */
export const Facecam: React.FC<{ t: number; w: number; h: number; hype?: number; seed?: number }> = ({ t, w, h, hype = 0, seed = 0 }) => {
  const skin = ["#c98b5f", "#f0c29a", "#8d5a3b", "#e0a878"][seed % 4], hair = ["#1c1420", "#5a3a22", "#111", "#2b2b2b"][seed % 4];
  const bg = ["#3b2c6b", "#1f3b5c", "#5c2a45", "#28453a"][seed % 4];
  const talk = Math.max(0, Math.sin(t * 11 + seed)) * 6 + hype * 22, lean = Math.sin(t * 1.7 + seed) * 4 + hype * 6;
  return (
    <svg width={w} height={h} viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice" style={{ display: "block" }}>
      <rect width="200" height="150" fill={bg} />
      <rect x="0" y="0" width="200" height="150" fill="url(#none)" />
      <circle cx="40" cy="30" r="22" fill="rgba(255,90,200,.35)" /><circle cx="170" cy="40" r="26" fill="rgba(80,200,255,.25)" />
      <g transform={`translate(${100 + lean},${82}) scale(${1 + hype * 0.06})`}>
        <path d="M-52 70 q 52 -40 104 0 v 20 h -104z" fill="#e8443a" />
        <ellipse cx="0" cy="0" rx="34" ry="40" fill={skin} />
        <path d="M-35 -10 q 0 -42 35 -42 q 35 0 35 42 q -10 -22 -35 -24 q -25 2 -35 24z" fill={hair} />
        <path d="M-40 -2 a 40 40 0 0 1 80 0" stroke="#222" strokeWidth="7" fill="none" />
        <rect x="-46" y="-8" width="14" height="26" rx="6" fill="#222" /><rect x="32" y="-8" width="14" height="26" rx="6" fill="#222" />
        <path d={`M-20 ${-14 - hype * 6} l 12 ${-2 - hype * 2}`} stroke={hair} strokeWidth="4" strokeLinecap="round" />
        <path d={`M8 ${-16 - hype * 6} l 12 ${2 + hype * 2}`} stroke={hair} strokeWidth="4" strokeLinecap="round" />
        <circle cx="-13" cy="-4" r={4 + hype * 1.5} fill="#16131c" /><circle cx="13" cy="-4" r={4 + hype * 1.5} fill="#16131c" />
        <ellipse cx="0" cy="20" rx={9 + hype * 6} ry={2 + talk * 0.5} fill="#5a1d2a" />
      </g>
    </svg>
  );
};

export const LiveBadge: React.FC<{ viewers?: string; size?: number }> = ({ viewers, size = 22 }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#e5484d", color: "#fff", fontFamily: UI, fontWeight: 800, fontSize: size, padding: `${size * 0.2}px ${size * 0.5}px`, borderRadius: size * 0.35 }}>
    <span style={{ width: size * 0.4, height: size * 0.4, borderRadius: 99, background: "#fff" }} />LIVE{viewers ? ` · ${viewers}` : ""}
  </div>
);

/** a stream tile: game view + small facecam corner */
export const StreamTile: React.FC<{ t: number; w: number; h: number; seed: number; viewers?: string; hype?: number }> = ({ t, w, h, seed, viewers, hype = 0 }) => (
  <div style={{ position: "relative", width: w, height: h, borderRadius: 22, overflow: "hidden", boxShadow: "0 16px 40px rgba(80,40,140,.22)", border: "3px solid rgba(170,90,255,.55)" }}>
    <GameView t={t} seed={seed} w={w} h={h} />
    <div style={{ position: "absolute", left: 12, bottom: 12, width: w * 0.3, height: w * 0.3 * 0.75, borderRadius: 10, overflow: "hidden", border: "2px solid #fff" }}>
      <Facecam t={t} w={w * 0.3} h={w * 0.3 * 0.75} seed={seed} hype={hype} />
    </div>
    <div style={{ position: "absolute", left: 12, top: 12 }}><LiveBadge viewers={viewers} size={Math.max(16, w * 0.045)} /></div>
  </div>
);

/** a vertical short: facecam on top, game underneath, a caption across the middle */
export const VerticalClip: React.FC<{ t: number; w: number; seed: number; caption?: string; capT?: number }> = ({ t, w, seed, caption, capT = 0 }) => {
  const h = w * 16 / 9, top = h * 0.4;
  const words = (caption ?? "").split(" "), shown = Math.max(0, Math.min(words.length, Math.floor((t - capT) / 0.22) + 1));
  return (
    <div style={{ position: "relative", width: w, height: h, borderRadius: w * 0.09, overflow: "hidden", background: "#000", border: `${Math.max(4, w * 0.025)}px solid #18141f`, boxShadow: "0 20px 50px rgba(60,30,120,.28)" }}>
      <Facecam t={t} w={w} h={top} seed={seed} hype={0.6} />
      <GameView t={t} seed={seed + 1} w={w} h={h - top} speed={1.3} />
      {caption && t >= capT && (
        <div style={{ position: "absolute", top: top - w * 0.08, left: 0, right: 0, textAlign: "center", fontFamily: UI, fontWeight: 800, fontSize: w * 0.085, color: "#fff", lineHeight: 1.05,
          WebkitTextStroke: `${w * 0.012}px #000`, paintOrder: "stroke fill", padding: "0 6%" }}>
          {words.slice(0, shown).map((x, i) => <span key={i} style={{ color: i === shown - 1 ? "#ffd84a" : "#fff" }}>{x} </span>)}
        </div>
      )}
    </div>
  );
};
