// "Two Minutes" overlays (2026-11-22): the friend whose "two minutes" never ends, told as a deadpan dictionary entry.
// Full-screen 2D overlays driven by story cues:
//   dict  - a dictionary page: headword "two minutes" (phrase, Priya). Definitions pop on cues d1..d4 (ten / twenty-five +
//           stopwatch / forty + pillow / "a feeling, not a location"). Arjun waits at the wheel in the corner, eyelids
//           drooping more with every definition.
//   texts - Arjun's phone: day after day, "Outside" -> "Two minutes", bubbles stacking fast
//   fake  - the failed attempt: Arjun's fake pickup times board, TOLD HER vs SHE CAME, rows on cues f1..f3, stamp on f4
//   fire  - the test: "THE CAR IS ON FIRE" (cue fire), reply "Two minutes :)" (cue reply); cue auto: the phone drops onto
//           a nightstand and Priya is revealed asleep in bed, AUTO-REPLY stamp; cue polite: SO POLITE chip
//   reply - callback: her boss asks for the report (cue boss), auto-reply answers (cue boss2), STILL ON stamp
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CUE, hasCue } from "./story";
import { Bust, Stamp } from "./Airport";

export type TwoMinMode = "dict" | "texts" | "fake" | "fire" | "reply";
export const TWOMIN_MODES: string[] = ["dict", "texts", "fake", "fire", "reply"];
export const TWOMIN_CAPTION_Y: Record<string, number> = { dict: 1640, texts: 1660, fake: 1790, fire: 1660, reply: 1770 };
const UI = "Manrope, 'Helvetica Neue', Arial, sans-serif";
const SERIF = "Georgia, 'DejaVu Serif', 'Times New Roman', serif";
const INK = "#141414", YELLOW = "#f6cf4a", RED = "#d8362b", GREEN = "#2f9e4f", PAPER = "#f6efdc";
const PRIYA = { skin: "#c48a62", shirt: "#d0607e", hair: "#1a120e" };
const ARJUN = { skin: "#b9845a", shirt: "#4f8a3a", hair: "#1f1712" };
const BOSS = { skin: "#b07e58", shirt: "#3b4a6b", hair: "#3a3a3a" };
const cl = (t: number, a: number[], b: number[], e = Easing.inOut(Easing.cubic)) => interpolate(t, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
const T = (k: string) => (hasCue(k) ? CUE[k] : 1e6);
const sp = (f: number, fps: number, t: number, damping = 12, stiffness = 200) => (t > 1e5 || f < Math.round(t * fps) ? 0 : spring({ frame: f - Math.round(t * fps), fps, config: { damping, stiffness } }));
const after = (t: number, k: string) => t >= T(k) - 0.08;

// ---------------- icons ----------------
const Stopwatch: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <rect x={-10} y={-62} width={20} height={16} rx={4} fill={INK} />
    <circle r={44} fill="#fff" stroke={INK} strokeWidth={7} />
    <path d={`M 0 0 L ${30 * Math.sin(t * 6)} ${-30 * Math.cos(t * 6)}`} stroke={RED} strokeWidth={7} strokeLinecap="round" />
    <circle r={6} fill={INK} />
  </g>
);
const Pillow: React.FC = () => (
  <g>
    <path d="M -70 -34 Q 0 -54 70 -34 Q 84 0 70 34 Q 0 54 -70 34 Q -84 0 -70 -34 Z" fill="#fff" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M -40 -10 Q 0 6 40 -10" stroke={INK} strokeWidth={4} fill="none" opacity={0.4} />
  </g>
);
const Zzz: React.FC<{ t: number; x: number; y: number; s?: number }> = ({ t, x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[0, 1, 2].map((i) => {
      const u = ((t * 0.7 + i / 3) % 1);
      return <text key={i} x={u * 90} y={-u * 170} fontFamily={UI} fontWeight={800} fontSize={50 + 30 * u} fill="#fff" stroke={INK} strokeWidth={4} opacity={1 - u}>Z</text>;
    })}
  </g>
);

// ---------------- the dictionary page ----------------
const DEFS: { k: string; n: string; txt: string; icon?: "watch" | "pillow" }[] = [
  { k: "d1", n: "1", txt: "ten minutes. fair." },
  { k: "d2", n: "2", txt: "twenty-five minutes.", icon: "watch" },
  { k: "d3", n: "3", txt: "forty minutes.", icon: "pillow" },
  { k: "d4", n: "4", txt: "a feeling, not a location." },
];
const Dict: React.FC<{ t: number; u: number; f: number; fps: number }> = ({ t, u, f, fps }) => {
  const shown = DEFS.filter((d) => after(t, d.k));
  const sHead = sp(f, fps, t - u - 0.02, 12, 170);
  const lids = Math.min(0.95, shown.filter((d) => d.k !== "d4").length * 0.3);
  const lesson = after(t, "d4");
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <rect width={1080} height={1920} fill="#2c3b55" />
        <g transform={`rotate(-2 540 900)`}>
          <rect x={70} y={140} width={940} height={1420} rx={18} fill={PAPER} stroke={INK} strokeWidth={9} />
          <path d="M 120 330 H 960" stroke={INK} strokeWidth={4} opacity={0.35} />
          {Array.from({ length: 22 }, (_, i) => <path key={i} d={`M 120 ${1190 + i * 16} H ${400 + ((i * 97) % 520)}`} stroke={INK} strokeWidth={5} opacity={i < 10 ? 0.12 : 0} />)}
          <text x={130} y={232} fontFamily={SERIF} fontSize={36} fontStyle="italic" fill={INK} opacity={0.55}>tw · tyr</text>
          <text x={950} y={232} textAnchor="end" fontFamily={SERIF} fontSize={36} fill={INK} opacity={0.55}>page 2</text>
          <g transform={`translate(130 ${430}) scale(${0.6 + 0.4 * sHead})`} opacity={Math.min(1, sHead * 1.4)}>
            <text x={0} y={0} fontFamily={SERIF} fontWeight={700} fontSize={118} fill={INK} letterSpacing={-3}>two min·utes</text>
            <text x={4} y={78} fontFamily={SERIF} fontStyle="italic" fontSize={46} fill={INK} opacity={0.75}>/tuː ˈmɪn.ɪts/ · phrase · Priya</text>
          </g>
          {DEFS.map((d, i) => {
            const s = sp(f, fps, T(d.k) - 0.08, 11, 220);
            if (s < 0.01) return null;
            const y = 640 + i * 150, hl = d.k === "d4";
            return (
              <g key={d.k} transform={`translate(${130 + (1 - s) * -60} ${y})`} opacity={Math.min(1, s * 1.5)}>
                {hl ? <rect x={-14} y={-66} width={850} height={90} rx={12} fill={YELLOW} opacity={0.85} /> : null}
                <text x={0} y={0} fontFamily={SERIF} fontWeight={700} fontSize={58} fill={INK}>{d.n}.</text>
                <text x={70} y={0} fontFamily={SERIF} fontSize={58} fill={INK}>{d.txt}</text>
                {d.icon === "watch" ? <g transform="translate(760 -22) scale(0.9)"><Stopwatch t={t} /></g> : null}
                {d.icon === "pillow" ? <g transform={`translate(680 -22) scale(0.85) rotate(${Math.sin(t * 3) * 6})`}><Pillow /></g> : null}
              </g>
            );
          })}
          {/* see also */}
          {lesson ? <text x={130} y={1300} fontFamily={SERIF} fontStyle="italic" fontSize={44} fill={INK} opacity={0.7 * sp(f, fps, T("d4") + 0.4)}>see also: still in bed.</text> : null}
        </g>
        {/* Arjun waiting at the wheel, bottom right */}
        <g transform="translate(830 1420)">
          <rect x={-200} y={-150} width={400} height={300} rx={40} fill="#3d6db5" stroke={INK} strokeWidth={8} />
          <rect x={-160} y={-120} width={320} height={200} rx={24} fill="#a9d6f5" stroke={INK} strokeWidth={6} />
          <g transform="translate(0 -10) scale(1.1)"><Bust who={ARJUN} lids={lids} mouth={lids > 0.5 ? "o" : "flat"} /></g>
          <circle cx={-40} cy={90} r={60} fill="none" stroke={INK} strokeWidth={14} />
          {lids > 0.8 ? <Zzz t={t} x={70} y={-120} s={0.8} /> : null}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ---------------- a phone with bubbles ----------------
type Msg = { who: "me" | "them"; name?: string; text: string; at: number; red?: boolean; day?: string };
const Phone: React.FC<{ t: number; f: number; fps: number; title: string; sub: string; msgs: Msg[]; x?: number; y?: number; s?: number; rot?: number }> =
  ({ t, f, fps, title, sub, msgs, x = 540, y = 860, s = 1, rot = 0 }) => {
    const vis = msgs.filter((m) => t >= m.at - 0.06);
    return (
      <div style={{ position: "absolute", left: x - 380, top: y - 680, width: 760, height: 1360, transform: `scale(${s}) rotate(${rot}deg)`, transformOrigin: "50% 50%",
        borderRadius: 90, background: "#111", padding: 22, boxSizing: "border-box", boxShadow: "0 40px 90px rgba(0,0,0,.45)" }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 70, background: "#efe7dc", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: UI }}>
          <div style={{ background: "#1f6b4a", color: "#fff", padding: "54px 36px 26px", display: "flex", alignItems: "center", gap: 22 }}>
            <div style={{ width: 82, height: 82, borderRadius: 41, background: YELLOW, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 800, color: INK }}>{title[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 44, fontWeight: 800 }}>{title}</div>
              <div style={{ fontSize: 28, opacity: 0.85 }}>{sub}</div>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "18px 26px 30px", gap: 16, overflow: "hidden" }}>
            {vis.map((m, i) => {
              const k = sp(f, fps, m.at - 0.06, 12, 240), mine = m.who === "me";
              return (
                <React.Fragment key={i}>
                  {m.day ? <div style={{ alignSelf: "center", fontSize: 26, fontWeight: 800, color: "#5d6b63", background: "#dfe8e1", borderRadius: 14, padding: "4px 18px" }}>{m.day}</div> : null}
                  <div style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "84%", background: m.red ? RED : mine ? "#d6f5c6" : "#fff", borderRadius: 30, padding: "16px 26px",
                    boxShadow: "0 2px 3px rgba(0,0,0,.12)", transform: `scale(${0.6 + 0.4 * k})`, transformOrigin: mine ? "right bottom" : "left bottom" }}>
                    {m.name ? <div style={{ fontSize: 26, fontWeight: 800, color: "#c0476b" }}>{m.name}</div> : null}
                    <div style={{ fontSize: m.red ? 54 : 44, fontWeight: m.red ? 800 : 600, color: m.red ? "#fff" : INK }}>{m.text}</div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

const Texts: React.FC<{ t: number; t0: number; t1: number; f: number; fps: number }> = ({ t, t0, t1, f, fps }) => {
  const days = ["MON", "TUE", "WED", "THU", "FRI"], span = Math.max(0.5, t1 - t0 - 0.3);
  const msgs: Msg[] = [];
  days.forEach((d, i) => {
    const a = t0 + 0.1 + span * Math.pow(i / days.length, 1.15);
    msgs.push({ who: "me", text: "Outside", at: a, day: d });
    msgs.push({ who: "them", name: "Priya", text: "Two minutes", at: a + span / days.length * 0.5 });
  });
  return (
    <AbsoluteFill style={{ background: "#2c3b55" }}>
      <Phone t={t} f={f} fps={fps} title="Priya" sub="lane 2 · pickup 8:00" msgs={msgs} y={820} />
    </AbsoluteFill>
  );
};

// ---------------- the failed attempt: fake pickup times ----------------
const Fake: React.FC<{ t: number; u: number; f: number; fps: number }> = ({ t, u, f, fps }) => {
  const rows: [string, string, string][] = [["f1", "7:40", "8:20"], ["f2", "7:20", "8:20"], ["f3", "6:00", "8:20"]];
  const n = rows.filter((r) => after(t, r[0])).length;
  const sIn = sp(f, fps, t - u, 12, 170), sAlw = sp(f, fps, T("f4") - 0.05, 9, 250);
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <rect width={1080} height={1920} fill="#5a4636" />
        <g transform={`translate(540 760) scale(${0.85 + 0.15 * sIn}) rotate(1.5)`}>
          <rect x={-460} y={-560} width={920} height={1080} rx={26} fill="#c79a62" stroke={INK} strokeWidth={10} />
          <rect x={-420} y={-520} width={840} height={1000} rx={14} fill="#fbf7ec" stroke={INK} strokeWidth={6} />
          <text x={0} y={-410} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={62} fill={INK} letterSpacing={-2}>OPERATION: EARLY</text>
          <text x={-210} y={-300} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={44} fill={INK} opacity={0.6}>TOLD HER</text>
          <text x={210} y={-300} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={44} fill={INK} opacity={0.6}>SHE CAME</text>
          <path d="M 0 -350 V 420" stroke={INK} strokeWidth={5} opacity={0.3} />
          {rows.map(([k, told, came], i) => {
            const s = sp(f, fps, T(k) - 0.08, 10, 230), s2 = sp(f, fps, T(k) + 0.32, 9, 260);
            if (s < 0.01) return null;
            const y = -160 + i * 190;
            return (
              <g key={k}>
                <g transform={`translate(-210 ${y}) scale(${s})`}>
                  <text x={0} y={30} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={104} fill={GREEN} letterSpacing={-3}>{told}</text>
                </g>
                <g transform={`translate(210 ${y}) scale(${s2}) rotate(-4)`}>
                  <text x={0} y={30} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={104} fill={RED} letterSpacing={-3}>{came}</text>
                </g>
              </g>
            );
          })}
        </g>
        {/* Arjun, more tired with every row (an alarm clock rings beside him) */}
        <g transform="translate(250 1450) scale(1.7)">
          <Bust who={ARJUN} lids={0.25 + n * 0.22} mouth={n >= 3 ? "o" : "flat"} />
        </g>
        <g transform={`translate(800 1460) rotate(${n >= 3 ? Math.sin(t * 50) * 8 : 0})`}>
          <circle r={95} fill="#f2efe8" stroke={INK} strokeWidth={9} />
          {[-1, 1].map((d) => <circle key={d} cx={d * 70} cy={-90} r={30} fill={YELLOW} stroke={INK} strokeWidth={7} />)}
          <path d={`M 0 0 L 0 -62 M 0 0 L ${n >= 3 ? 0 : 44} ${n >= 3 ? 40 : 10}`} stroke={INK} strokeWidth={10} strokeLinecap="round" />
          <text x={0} y={150} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={44} fill="#fff">{n >= 3 ? "5:45 AM" : ""}</text>
        </g>
      </svg>
      <Stamp text="8:20. ALWAYS." s={sAlw} bg={RED} x={540} y={1210} rot={-7} size={104} />
    </AbsoluteFill>
  );
};

// ---------------- the twist: the test, then the bedroom ----------------
const Fire: React.FC<{ t: number; u: number; f: number; fps: number }> = ({ t, f, fps }) => {
  const k = cl(t, [T("auto") - 0.15, T("auto") + 0.45], [0, 1], Easing.inOut(Easing.cubic));
  const sAuto = sp(f, fps, T("auto") + 0.25, 9, 250), sPol = sp(f, fps, T("polite") - 0.06, 10, 230);
  const msgs: Msg[] = [
    { who: "me", text: "Outside", at: -1, day: "FRI" },
    { who: "them", name: "Priya", text: "Two minutes", at: -1 },
    { who: "me", text: "THE CAR IS ON FIRE", at: T("fire"), red: true, day: "MON · 8:02" },
    { who: "them", name: "Priya", text: "Two minutes :)", at: T("reply") },
  ];
  const night = k > 0.02;
  return (
    <AbsoluteFill style={{ background: "#2c3b55" }}>
      {/* the bedroom, revealed behind the phone */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: k }}>
        <rect width={1080} height={1920} fill="#3a3560" />
        <rect x={620} y={180} width={340} height={420} rx={14} fill="#f7d98b" stroke={INK} strokeWidth={8} />
        <path d="M 790 180 V 600 M 620 390 H 960" stroke={INK} strokeWidth={6} />
        <circle cx={880} cy={270} r={44} fill="#fff7c2" opacity={0.9} />
        <rect x={0} y={1350} width={1080} height={570} fill="#5b4a7a" />
        {/* bed */}
        <rect x={40} y={900} width={720} height={520} rx={40} fill="#8a5a3c" stroke={INK} strokeWidth={9} />
        <rect x={60} y={980} width={680} height={300} rx={30} fill="#f2efe8" stroke={INK} strokeWidth={7} />
        <g transform="translate(220 1010) scale(0.9)"><Pillow /></g>
        <g transform="translate(250 1000) rotate(-80) scale(1.6)"><Bust who={PRIYA} hair="long" lids={1} mouth="o" /></g>
        <path d="M 330 960 Q 560 900 740 980 L 740 1260 Q 520 1290 330 1240 Z" fill="#d0607e" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        {night ? <Zzz t={t} x={300} y={820} s={1.3} /> : null}
        {/* nightstand */}
        <rect x={800} y={1050} width={240} height={340} rx={16} fill="#a8754f" stroke={INK} strokeWidth={8} />
        <path d="M 800 1200 H 1040" stroke={INK} strokeWidth={6} />
      </svg>
      <Phone t={t} f={f} fps={fps} title="Priya" sub="last seen 11:58 pm" msgs={msgs}
        x={interpolate(k, [0, 1], [540, 920])} y={interpolate(k, [0, 1], [860, 960])} s={interpolate(k, [0, 1], [1, 0.24])} rot={interpolate(k, [0, 1], [0, -8])} />
      {night ? <div style={{ position: "absolute", left: 790, top: 760, width: 260, height: 120, borderRadius: 30, background: "rgba(255,240,160,.0)",
        boxShadow: `0 0 ${80 * (0.5 + 0.5 * Math.sin(t * 10))}px rgba(255,240,160,.9)` }} /> : null}
      <Stamp text="AUTO-REPLY" s={sAuto} bg={RED} x={540} y={560} rot={-7} size={112} />
      <Stamp text="SO POLITE" s={sPol} bg={YELLOW} fg={INK} x={700} y={1480} rot={5} size={80} />
    </AbsoluteFill>
  );
};

// ---------------- callback: the boss gets two minutes ----------------
const Reply: React.FC<{ t: number; u: number; f: number; fps: number }> = ({ t, f, fps }) => {
  const sOn = sp(f, fps, T("boss2") + 0.3, 9, 250);
  const msgs: Msg[] = [
    { who: "them", name: "Mehta sir", text: "Need the quarterly report. NOW.", at: T("boss") },
    { who: "me", text: "Two minutes :)", at: T("boss2") },
  ];
  return (
    <AbsoluteFill style={{ background: "#2c3b55" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform="translate(170 1440) scale(1.5)"><Bust who={BOSS} specs mouth={after(t, "boss2") ? "o" : "flat"} /></g>
        <g transform="translate(910 1440) scale(1.5) rotate(18)"><Bust who={PRIYA} hair="long" lids={0.9} mouth="smile" /></g>
        <Zzz t={t} x={930} y={1290} s={0.9} />
      </svg>
      <Phone t={t} f={f} fps={fps} title="Mehta sir" sub="Boss · online" msgs={msgs} y={700} s={0.86} />
      <Stamp text="STILL ON" s={sOn} bg={GREEN} x={540} y={1130} rot={-6} size={110} />
    </AbsoluteFill>
  );
};

export const TwoMinOverlay: React.FC<{ t0: number; t1: number; mode: TwoMinMode }> = ({ t0, t1, mode }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps, u = t - t0;
  const out = cl(t, [t1 - 0.1, t1], [1, 0]);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      {mode === "dict" ? <Dict t={t} u={u} f={f} fps={fps} /> : mode === "texts" ? <Texts t={t} t0={t0} t1={t1} f={f} fps={fps} />
        : mode === "fake" ? <Fake t={t} u={u} f={f} fps={fps} /> : mode === "fire" ? <Fire t={t} u={u} f={f} fps={fps} /> : <Reply t={t} u={u} f={f} fps={fps} />}
    </AbsoluteFill>
  );
};
