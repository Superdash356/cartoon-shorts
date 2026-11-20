// "Three airport drops" overlays (2026-11-19): one night of airport runs, told as deadpan airport PA announcements.
// Full-screen 2D overlays driven by story.json `airport` texts and cues:
//   road    - night highway side view: Rohan's white car racing right under a "AIRPORT" sign, control tower + plane
//             behind. The trip cues (trip1/trip2/trip3) pick the passenger (Priya / Arjun / Sharma ji + a fridge-sized
//             suitcase on the roof), Rohan's eyelids droop more every trip, a "TRIP n" stamp and a dashboard clock.
//             Before trip1 (the hook) the car is empty and cue x3 slams a "x3" stamp.
//   pa      - the departures board: header + PA speaker "DING"; rows pop in on cues d1/d2/d3 (split-flap flicker), the
//             DRIVER column is ROHAN every time; cue no: "CANNOT SAY NO" stamp
//   calls   - 3 a.m. phone: call cards pop on c1/c2/c3, each ends "Airplane mode" with a plane icon
//   row     - the selfie post from row 14: Priya, Arjun, Sharma ji side by side in seats A/B/C (labels on sA/sB/sC);
//             cue same: "SAME FLIGHT" stamp; cue cab: each one's thought bubble shows a cab
//   parking - three airport parking tickets drop one by one (cues p1/p2/p3), "x3" stamp on cue px
//   sleep   - callback: Sunday night, Rohan asleep, his phone on the nightstand glowing an airplane icon while
//             "airport drop?" messages bounce off it
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CUE, STORY, hasCue } from "./story";

export type AirportMode = "road" | "pa" | "calls" | "row" | "parking" | "sleep";
export const AIRPORT_MODES: string[] = ["road", "pa", "calls", "row", "parking", "sleep"];
const UI = "Manrope, 'Helvetica Neue', Arial, sans-serif";
const INK = "#141414", YELLOW = "#f6cf4a", RED = "#d8362b", GREEN = "#2f9e4f", AMBER = "#ffb52e";
const ROHAN = { skin: "#c99a6e", shirt: "#3d6db5", hair: "#1f1712" };
const PRIYA = { skin: "#c48a62", shirt: "#d0607e", hair: "#1a120e" };
const ARJUN = { skin: "#b9845a", shirt: "#4f8a3a", hair: "#1f1712" };
const SHARMA = { skin: "#c08d63", shirt: "#e9c33a", hair: "#e8e4dc" };
type Who = typeof ROHAN;
const cl = (t: number, a: number[], b: number[], e = Easing.inOut(Easing.cubic)) => interpolate(t, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
type AirCfg = { rows?: [string, string, string][]; calls?: string[]; clocks?: string[]; flight?: string; handle?: string; ticket?: string; texts?: string[] };
const A = ((STORY as unknown as { airport?: AirCfg }).airport ?? {}) as AirCfg;
const T = (k: string) => (hasCue(k) ? CUE[k] : 1e6);
const sp = (f: number, fps: number, t: number, damping = 12, stiffness = 200) => (t > 1e5 ? 0 : spring({ frame: f - Math.round(t * fps), fps, config: { damping, stiffness } }));

export const Stamp: React.FC<{ text: string; s: number; bg: string; x: number; y: number; rot?: number; size?: number; fg?: string }> = ({ text, s, bg, x, y, rot = -8, size = 110, fg = "#fff" }) =>
  s > 0.01 ? (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${2.2 - 1.2 * Math.min(1, s)})`, opacity: Math.min(1, s * 1.6),
      fontFamily: UI, fontWeight: 800, fontSize: size, letterSpacing: -3, color: fg, background: bg, border: `9px solid ${INK}`, borderRadius: 26,
      padding: "4px 40px 10px", boxShadow: `12px 12px 0 ${INK}`, whiteSpace: "nowrap" }}>{text}</div>
  ) : null;

/** a head + shoulders bust at the origin (head centre). lids: 0 open .. 1 shut. hair: short | long | white */
export const Bust: React.FC<{ who: Who; lids?: number; hair?: "short" | "long" | "white"; tache?: boolean; mouth?: "flat" | "o" | "smile" | "grin"; specs?: boolean; tilt?: number }> =
  ({ who, lids = 0, hair = "short", tache, mouth = "flat", specs, tilt = 0 }) => (
    <g transform={`rotate(${tilt})`}>
      {hair === "long" ? <path d="M -52 -10 Q -60 -66 0 -66 Q 60 -66 52 -10 L 58 70 L -58 70 Z" fill={who.hair} stroke={INK} strokeWidth={5} /> : null}
      <path d="M -78 130 Q -78 62 -32 54 L 32 54 Q 78 62 78 130 Z" fill={who.shirt} stroke={INK} strokeWidth={5} />
      <rect x={-14} y={36} width={28} height={24} fill={who.skin} stroke={INK} strokeWidth={4} />
      <circle r={48} fill={who.skin} stroke={INK} strokeWidth={5} />
      {hair === "short" ? <path d="M -48 -6 Q -40 -62 10 -54 Q 48 -48 48 -10 Q 22 -34 -14 -28 Q -34 -24 -48 -6 Z" fill={who.hair} stroke={INK} strokeWidth={4} /> : null}
      {hair === "long" ? <path d="M -48 -4 Q -44 -56 0 -54 Q 44 -56 48 -4 Q 30 -36 0 -34 Q -30 -36 -48 -4 Z" fill={who.hair} stroke={INK} strokeWidth={4} /> : null}
      {hair === "white" ? <path d="M -48 -2 Q -50 -40 -30 -46 Q -20 -30 -46 -2 Z M 48 -2 Q 50 -40 30 -46 Q 20 -30 46 -2 Z" fill={who.hair} stroke={INK} strokeWidth={4} /> : null}
      {[-17, 17].map((x) => (
        <g key={x}>
          <circle cx={x} cy={4} r={7} fill="#fff" stroke={INK} strokeWidth={3} />
          <circle cx={x} cy={5} r={4} fill={INK} />
          {lids > 0.02 ? <rect x={x - 9} y={-5} width={18} height={18 * Math.min(1, lids) + 0.5} fill={who.skin} stroke={INK} strokeWidth={3} /> : null}
        </g>
      ))}
      {specs ? <g stroke={INK} strokeWidth={4} fill="none"><circle cx={-17} cy={4} r={13} /><circle cx={17} cy={4} r={13} /><path d="M -4 4 H 4" /></g> : null}
      {tache ? <path d="M -30 24 Q -16 12 0 20 Q 16 12 30 24 Q 16 30 0 26 Q -16 30 -30 24 Z" fill="#3a2a1e" stroke={INK} strokeWidth={3} /> : null}
      {mouth === "o" ? <ellipse cx={0} cy={32} rx={8} ry={10} fill={INK} /> : mouth === "smile" ? <path d="M -15 28 Q 0 42 15 28" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
        : mouth === "grin" ? <path d="M -20 26 Q 0 50 20 26 Z" fill="#fff" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        : <path d={tache ? "M -9 34 H 9" : "M -10 30 H 10"} stroke={INK} strokeWidth={5} strokeLinecap="round" />}
    </g>
  );

const Stars: React.FC<{ t: number; n?: number; h?: number }> = ({ t, n = 40, h = 900 }) => (
  <g>{Array.from({ length: n }, (_, i) => {
    const x = (i * 263.7) % 1080, y = (i * 97.3) % h, tw = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7);
    return <circle key={i} cx={x} cy={y} r={2 + (i % 3)} fill="#fff" opacity={0.35 + 0.5 * tw} />;
  })}</g>
);
const PlaneIcon: React.FC<{ x: number; y: number; s?: number; rot?: number; col?: string }> = ({ x, y, s = 1, rot = 0, col = "#fff" }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -40 0 L 30 -6 Q 46 -6 46 0 Q 46 6 30 6 L -40 0 Z M -4 -2 L -22 -36 L -10 -36 L 16 -3 Z M -4 2 L -22 36 L -10 36 L 16 3 Z M -36 -1 L -44 -16 L -36 -16 L -26 -2 Z M -36 1 L -44 16 L -36 16 L -26 2 Z" fill={col} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
  </g>
);

// ---------------- road ----------------
const tripAt = (t: number) => ["trip1", "trip2", "trip3"].filter((k) => t >= T(k) - 0.12).length;
const Road: React.FC<{ t: number; u: number; f: number; fps: number }> = ({ t, u, f, fps }) => {
  const trip = tripAt(t), scroll = t * 900;
  const pax = trip === 1 ? { who: PRIYA, hair: "long" as const, tache: false } : trip === 2 ? { who: ARJUN, hair: "short" as const, tache: false } : trip === 3 ? { who: SHARMA, hair: "white" as const, tache: true } : null;
  const lids = [0.15, 0.45, 0.7, 0.88][trip];
  const bob = Math.sin(t * 26) * 3, tStamp = trip ? T(`trip${trip}`) : T("x3");
  const sStamp = sp(f, fps, tStamp - 0.05, 9, 260);
  const clock = (A.clocks ?? ["03:58", "04:02", "04:41", "05:06"])[trip];
  const planeX = ((u * 260) % 1500) - 200;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#0b1430 0%, #1b2d5a 55%, #33406e 72%, #1a1d26 72%)" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <Stars t={t} h={950} />
        <circle cx={860} cy={230} r={70} fill="#fff3c4" opacity={0.95} /><circle cx={890} cy={214} r={62} fill="#0f1a3a" />
        {/* airport control tower and terminal on the horizon */}
        <g transform="translate(640 1382)">
          <rect x={-260} y={-90} width={520} height={90} fill="#2a3358" stroke={INK} strokeWidth={5} />
          {Array.from({ length: 10 }, (_, i) => <rect key={i} x={-240 + i * 50} y={-70} width={30} height={26} fill="#ffe08a" opacity={0.85} />)}
          <rect x={150} y={-330} width={44} height={240} fill="#323c66" stroke={INK} strokeWidth={5} />
          <path d="M 120 -330 L 224 -330 L 210 -390 L 134 -390 Z" fill="#9fd3ff" stroke={INK} strokeWidth={5} />
          <circle cx={172} cy={-404} r={10} fill={Math.sin(t * 8) > 0 ? "#ff4040" : "#5a1a1a"} />
        </g>
        <PlaneIcon x={planeX} y={720 - planeX * 0.25} s={1.8} rot={-14} col="#e9eef8" />
        {/* road */}
        <rect x={0} y={1382} width={1080} height={260} fill="#2b2d34" />
        <rect x={0} y={1382} width={1080} height={10} fill="#555a66" />
        {Array.from({ length: 8 }, (_, i) => <rect key={i} x={((i * 220 - scroll) % 1760 + 1760) % 1760 - 300} y={1508} width={120} height={14} rx={7} fill="#f5f0dc" />)}
        {/* passing street lights */}
        {Array.from({ length: 4 }, (_, i) => {
          const x = ((i * 420 - scroll * 0.9) % 1680 + 1680) % 1680 - 300;
          return <g key={i}><rect x={x} y={1080} width={14} height={310} fill="#41465a" /><path d={`M ${x + 7} 1082 Q ${x + 7} 1050 ${x + 70} 1050`} stroke="#41465a" strokeWidth={12} fill="none" /><ellipse cx={x + 76} cy={1058} rx={24} ry={10} fill="#ffe7a0" /><path d={`M ${x + 56} 1064 L ${x + 20} 1382 L ${x + 140} 1382 L ${x + 96} 1064 Z`} fill="#ffe7a0" opacity={0.1} /></g>;
        })}
        {/* green highway sign */}
        <g transform={`translate(${((300 - scroll * 0.35) % 1700 + 1700) % 1700 - 300} 860)`}>
          <rect x={0} y={0} width={420} height={150} rx={14} fill="#1d7a46" stroke="#fff" strokeWidth={8} />
          <text x={210} y={68} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={60} fill="#fff">AIRPORT</text>
          <PlaneIcon x={150} y={112} s={0.7} rot={-20} /><text x={260} y={128} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={40} fill="#fff">→</text>
          <rect x={196} y={150} width={24} height={240} fill="#555" />
        </g>
        {/* the white car, side view facing right */}
        <g transform={`translate(560 ${1452 + bob}) scale(1.3)`}>
          <ellipse cx={0} cy={60} rx={330} ry={22} fill="rgba(0,0,0,.35)" />
          {trip === 3 ? (
            <g transform={`translate(-20 ${-196 + Math.sin(t * 13) * 5}) rotate(${Math.sin(t * 7) * 2}) scale(1.45)`}>
              <rect x={-170} y={-280} width={340} height={300} rx={26} fill="#8a5a32" stroke={INK} strokeWidth={8} />
              <rect x={-170} y={-150} width={340} height={22} fill="#6e4424" />
              <rect x={-50} y={-310} width={100} height={36} rx={12} fill="none" stroke={INK} strokeWidth={10} />
              <path d="M -190 -20 L 190 -20 M -120 -290 L -120 20 M 120 -290 L 120 20" stroke="#3a2a1e" strokeWidth={10} />
              <rect x={20} y={-260} width={120} height={70} rx={8} fill="#fff" stroke={INK} strokeWidth={4} transform="rotate(8 80 -225)" />
              <text x={80} y={-212} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={30} fill={RED} transform="rotate(8 80 -225)">HEAVY</text>
            </g>
          ) : null}
          <path d="M -300 20 L -300 -60 Q -296 -92 -250 -98 L -160 -104 L -90 -190 Q -76 -204 -50 -204 L 120 -204 Q 150 -204 170 -184 L 240 -108 L 290 -100 Q 320 -94 320 -60 L 320 20 Z" fill="#f2efe8" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
          <path d="M -150 -108 L -88 -180 Q -80 -188 -66 -188 L 30 -188 L 30 -108 Z" fill="#a9d6f5" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <path d="M 46 -108 L 46 -188 L 116 -188 Q 140 -188 156 -170 L 214 -108 Z" fill="#a9d6f5" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          {/* driver (front, right window) and passenger (back) */}
          <clipPath id="frontWin"><path d="M 46 -108 L 46 -188 L 116 -188 Q 140 -188 156 -170 L 214 -108 Z" /></clipPath>
          <clipPath id="backWin"><path d="M -150 -108 L -88 -180 Q -80 -188 -66 -188 L 30 -188 L 30 -108 Z" /></clipPath>
          <g clipPath="url(#frontWin)"><g transform="translate(110 -128) scale(0.78)"><Bust who={ROHAN} lids={lids} mouth={trip >= 2 ? "o" : "flat"} tilt={trip >= 2 ? Math.sin(t * 2.2) * 8 : 0} /></g></g>
          {pax ? <g clipPath="url(#backWin)"><g transform="translate(-40 -126) scale(0.78)"><Bust who={pax.who} hair={pax.hair} tache={pax.tache} mouth="smile" /></g></g> : null}
          <rect x={-300} y={-40} width={620} height={14} fill="rgba(0,0,0,.08)" />
          <ellipse cx={300} cy={-62} rx={18} ry={14} fill="#fff6c8" stroke={INK} strokeWidth={5} />
          <path d={`M 318 -62 L 1100 -150 L 1100 30 Z`} fill="#fff6c8" opacity={0.18} />
          <rect x={-310} y={-70} width={20} height={26} rx={6} fill={RED} stroke={INK} strokeWidth={4} />
          {[-190, 190].map((wx) => (
            <g key={wx} transform={`translate(${wx} 20) rotate(${(t * 900) % 360})`}>
              <circle r={58} fill="#25262b" stroke={INK} strokeWidth={7} /><circle r={26} fill="#b9bec6" stroke={INK} strokeWidth={5} />
              <path d="M -26 0 H 26 M 0 -26 V 26" stroke={INK} strokeWidth={5} />
            </g>
          ))}
          {/* speed lines */}
          {[0, 1, 2].map((i) => <path key={i} d={`M ${-380 - i * 40} ${-150 + i * 60} h ${-120 - 40 * Math.sin(t * 20 + i)}`} stroke="#fff" strokeWidth={8} strokeLinecap="round" opacity={0.5} />)}
        </g>
      </svg>
      {/* dashboard clock */}
      <div style={{ position: "absolute", left: 70, top: 130, fontFamily: "'Courier New', monospace", fontWeight: 800, fontSize: 92, color: "#ff5a4a", background: "#120808", border: `7px solid ${INK}`, borderRadius: 20, padding: "6px 30px", textShadow: "0 0 18px #ff3a2a" }}>{clock}</div>
      <Stamp text={trip ? `TRIP ${trip}` : "×3"} s={sStamp} bg={trip ? YELLOW : RED} fg={trip ? INK : "#fff"} x={trip ? 760 : 780} y={trip ? 520 : 480} rot={trip ? 6 : -10} size={trip ? 120 : 200} />
    </AbsoluteFill>
  );
};

// ---------------- departures board ----------------
const ROWS: [string, string, string][] = A.rows ?? [["04:00", "PRIYA", "ROHAN"], ["04:30", "ARJUN", "ROHAN"], ["05:00", "SHARMA JI", "ROHAN"]];
const FLAP = "ABCDEFGHJKLMNOPRSTUVWXYZ0123456789";
const flap = (s: string, k: number, seed: number) => s.split("").map((c, i) => (c === " " || k >= 1 || i / s.length < k ? c : FLAP[(seed * 7 + i * 13 + Math.floor(k * 40)) % FLAP.length])).join("");
const Board: React.FC<{ t: number; f: number; fps: number; pop: number }> = ({ t, f, fps, pop }) => {
  const ding = cl(t - T("ding"), [-0.05, 0.1, 0.8], [0, 1, 0]);
  const sNo = sp(f, fps, T("no") - 0.05, 9, 260);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#1c2340, #0d1122)", fontFamily: UI }}>
      {/* PA speaker */}
      <svg width={1080} height={420} style={{ position: "absolute", top: 60, left: 0 }}>
        <g transform="translate(540 190)">
          <path d="M -70 -50 L -20 -50 L 40 -110 L 40 110 L -20 50 L -70 50 Z" fill="#c9cfdd" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
          {[0, 1, 2].map((i) => <path key={i} d={`M ${70 + i * 44} -${60 + i * 30} Q ${110 + i * 54} 0 ${70 + i * 44} ${60 + i * 30}`} stroke={YELLOW} strokeWidth={12} fill="none" strokeLinecap="round" opacity={0.25 + ding * (1 - i * 0.2)} />)}
        </g>
        <text x={540} y={390} textAnchor="middle" fontWeight={800} fontSize={72} fill={YELLOW} opacity={0.3 + 0.7 * ding} letterSpacing={6}>DING</text>
      </svg>
      <div style={{ position: "absolute", left: 50, top: 520, width: 980, borderRadius: 30, background: "#07080c", border: "10px solid #2c3142", boxShadow: "0 40px 90px rgba(0,0,0,.6)",
        transform: `scale(${0.75 + 0.25 * pop})`, padding: "26px 26px 34px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, color: AMBER, fontSize: 58, fontWeight: 800, letterSpacing: 4, paddingBottom: 18, borderBottom: "4px solid #2c3142" }}>
          <svg width={70} height={70} viewBox="-50 -50 100 100"><PlaneIcon x={0} y={0} s={1} rot={-30} col={AMBER} /></svg> DEPARTURES
          <span style={{ marginLeft: "auto", fontSize: 30, color: "#8a90a3", letterSpacing: 2 }}>COLONY GATE 1</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 260px", gap: "0 20px", color: "#8a90a3", fontSize: 30, fontWeight: 700, letterSpacing: 3, padding: "16px 6px 6px" }}>
          <span>TIME</span><span>PASSENGER</span><span>DRIVER</span>
        </div>
        {ROWS.map(([time, who, drv], i) => {
          const tk = T(`d${i + 1}`), k = cl(t, [tk - 0.1, tk + 0.45], [0, 1], Easing.linear), shown = t >= tk - 0.1;
          const blink = shown && t > T("no") - 0.1 && Math.sin(t * 14) > -0.2;
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr 260px", gap: "0 20px", padding: "16px 6px", borderTop: "3px solid #1a1d27",
              fontFamily: "'Courier New', monospace", fontWeight: 800, fontSize: 62, color: "#ffe9b0", opacity: shown ? 1 : 0.15 }}>
              <span>{shown ? flap(time, k, i) : "--:--"}</span>
              <span style={{ color: "#fff" }}>{shown ? flap(who, k, i + 3) : ""}</span>
              <span style={{ color: blink ? "#111" : AMBER, background: blink ? AMBER : "transparent", borderRadius: 8, padding: "0 8px" }}>{shown ? flap(drv, k, i + 5) : ""}</span>
            </div>
          );
        })}
      </div>
      <Stamp text="CANNOT SAY NO" s={sNo} bg={RED} x={540} y={1340} rot={-6} size={96} />
    </AbsoluteFill>
  );
};

// ---------------- calls ----------------
const CALLS: string[] = A.calls ?? ["Priya", "Arjun", "Sharma ji"];
const Calls: React.FC<{ t: number; f: number; fps: number; pop: number }> = ({ t, f, fps, pop }) => (
  <AbsoluteFill style={{ background: "radial-gradient(90% 60% at 50% 40%, #233056, #0a0d18)", alignItems: "center", fontFamily: UI }}>
    <div style={{ marginTop: 170, width: 700, height: 1300, borderRadius: 90, background: "#111", padding: 20, transform: `scale(${0.7 + 0.3 * pop}) rotate(${(1 - pop) * -6}deg)`, boxShadow: "0 40px 90px rgba(0,0,0,.6)" }}>
      <div style={{ width: "100%", height: "100%", borderRadius: 72, background: "linear-gradient(#1a1f33, #0e1120)", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 80, gap: 30 }}>
        <div style={{ fontSize: 120, fontWeight: 800, color: "#fff", letterSpacing: -4 }}>03:00</div>
        <div style={{ fontSize: 34, color: "#9aa3b5", fontWeight: 700, marginTop: -20 }}>Sunday · Recents</div>
        {CALLS.map((name, i) => {
          const tk = T(`c${i + 1}`), s = sp(f, fps, tk - 0.08, 11, 220), off = t > (hasCue("off") ? T("off") + i * 0.12 : tk + 0.35);
          return (
            <div key={i} style={{ width: 590, borderRadius: 34, background: "#fff", padding: "22px 26px", display: "flex", alignItems: "center", gap: 22, transform: `scale(${s}) rotate(${(i - 1) * 1.5}deg)`, opacity: Math.min(1, s * 1.6) }}>
              <div style={{ width: 96, height: 96, borderRadius: 48, background: [PRIYA.shirt, ARJUN.shirt, SHARMA.shirt][i], color: "#fff", fontSize: 48, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", border: `5px solid ${INK}` }}>{name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 44, fontWeight: 800, color: INK }}>{name}</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: off ? RED : "#666" }}>{off ? "Airplane mode" : "Calling…"}</div>
              </div>
              <div style={{ width: 92, height: 92, borderRadius: 46, background: off ? "#fde3e0" : "#e3f5e6", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${off ? 1 + 0.1 * Math.sin(t * 10) : 1})` }}>
                <svg width={80} height={80} viewBox="-50 -50 100 100">{off ? <PlaneIcon x={0} y={0} s={0.95} rot={-45} col={RED} /> : <circle r={18} fill={GREEN} />}</svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </AbsoluteFill>
);

// ---------------- row 14 selfie ----------------
const Row: React.FC<{ t: number; f: number; fps: number; pop: number }> = ({ t, f, fps, pop }) => {
  const sSame = sp(f, fps, T("same") - 0.05, 9, 260), cab = cl(t, [T("cab") - 0.1, T("cab") + 0.3], [0, 1]);
  const seats: { who: Who; hair: "short" | "long" | "white"; tache?: boolean; specs?: boolean; letter: string; cue: string }[] = [
    { who: PRIYA, hair: "long", letter: "A", cue: "sA" }, { who: ARJUN, hair: "short", letter: "B", cue: "sB" }, { who: SHARMA, hair: "white", tache: true, specs: true, letter: "C", cue: "sC" }];
  return (
    <AbsoluteFill style={{ background: "#e9edf3", alignItems: "center", fontFamily: UI }}>
      <div style={{ marginTop: 250, width: 940, borderRadius: 40, background: "#fff", boxShadow: "0 30px 70px rgba(0,0,0,.25)", overflow: "hidden", transform: `scale(${(0.75 + 0.25 * pop) * 1.08}) rotate(${(1 - pop) * 5}deg)`, transformOrigin: "50% 0%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "22px 26px" }}>
          <div style={{ width: 74, height: 74, borderRadius: 37, background: PRIYA.shirt, border: "5px solid #f6a04a", color: "#fff", fontSize: 38, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>P</div>
          <div><div style={{ fontSize: 36, fontWeight: 800, color: INK }}>{A.handle ?? "priya.flies"}</div><div style={{ fontSize: 26, color: "#777", fontWeight: 600 }}>{A.flight ?? "Row 14 · work trip"} ✈</div></div>
        </div>
        <svg width={940} height={940} viewBox="0 0 940 940" style={{ display: "block" }}>
          <rect width={940} height={940} fill="#cfd8e6" />
          {/* cabin wall + window */}
          <path d="M 0 0 H 940 V 300 Q 470 250 0 300 Z" fill="#eef1f6" />
          <rect x={60} y={60} width={150} height={200} rx={70} fill="#33406e" stroke="#9aa6bd" strokeWidth={12} />
          <circle cx={150} cy={120} r={14} fill="#fff3c4" />
          {[300, 520, 740].map((x) => <rect key={x} x={x} y={40} width={150} height={60} rx={16} fill="#dfe4ee" stroke="#b8c0d0" strokeWidth={4} />)}
          {/* three seats */}
          {seats.map((s, i) => {
            const x = 170 + i * 300, sl = sp(f, fps, T(s.cue) - 0.05, 10, 240);
            return (
              <g key={i}>
                <rect x={x - 130} y={300} width={260} height={560} rx={60} fill="#2d5a9a" stroke={INK} strokeWidth={7} />
                <rect x={x - 100} y={310} width={200} height={70} rx={20} fill="#f1f1f1" stroke={INK} strokeWidth={4} />
                <g transform={`translate(${x} ${520 + Math.sin(t * 3 + i) * 4}) scale(1.6)`}><Bust who={s.who} hair={s.hair} tache={s.tache} specs={s.specs} mouth={cab > 0.5 ? "o" : "grin"} /></g>
                <rect x={x - 140} y={800} width={280} height={140} rx={30} fill="#244a80" stroke={INK} strokeWidth={7} />
                {sl > 0.01 ? (
                  <g transform={`translate(${x} 760) scale(${sl})`}>
                    <rect x={-56} y={-50} width={112} height={100} rx={20} fill={YELLOW} stroke={INK} strokeWidth={7} />
                    <text x={0} y={30} textAnchor="middle" fontWeight={800} fontSize={76} fill={INK}>{s.letter}</text>
                  </g>
                ) : null}
                {cab > 0.01 ? (
                  <g transform={`translate(${x + 40} ${200}) scale(${cab})`}>
                    <circle cx={-60} cy={110} r={10} fill="#fff" stroke={INK} strokeWidth={3} /><circle cx={-40} cy={80} r={15} fill="#fff" stroke={INK} strokeWidth={3} />
                    <ellipse cx={0} cy={0} rx={100} ry={64} fill="#fff" stroke={INK} strokeWidth={5} />
                    <g transform="translate(0 6) scale(0.9)">
                      <rect x={-60} y={-20} width={120} height={40} rx={12} fill={YELLOW} stroke={INK} strokeWidth={4} /><path d="M -36 -20 L -20 -44 L 24 -44 L 40 -20 Z" fill={YELLOW} stroke={INK} strokeWidth={4} />
                      <rect x={-16} y={-60} width={32} height={14} rx={4} fill={INK} /><circle cx={-34} cy={22} r={12} fill={INK} /><circle cx={34} cy={22} r={12} fill={INK} />
                    </g>
                    <text x={60} y={-30} fontWeight={800} fontSize={54} fill={RED}>?</text>
                  </g>
                ) : null}
              </g>
            );
          })}
          {/* the selfie arm */}
          <path d="M 940 940 L 820 760" stroke={PRIYA.skin} strokeWidth={50} strokeLinecap="round" />
          <rect x={20} y={20} width={900} height={900} fill="none" stroke="#fff" strokeWidth={6} strokeDasharray="30 20" opacity={0.6} />
        </svg>
        <div style={{ display: "flex", alignItems: "center", gap: 22, padding: "18px 26px", fontSize: 32, fontWeight: 800, color: INK }}>♥ 3 · <span style={{ fontWeight: 600, color: "#555" }}>row 14 squad 🫶</span></div>
      </div>
      <Stamp text="SAME FLIGHT" s={sSame} bg={RED} x={540} y={900} rot={-8} size={120} />
      <div style={{ position: "absolute", left: 60, top: 150, fontSize: 54, fontWeight: 800, color: "#fff", background: INK, padding: "6px 26px", borderRadius: 16, transform: `rotate(-3deg) scale(${pop})` }}>ROW 14</div>
    </AbsoluteFill>
  );
};

// ---------------- parking tickets ----------------
const Parking: React.FC<{ t: number; f: number; fps: number; u: number }> = ({ t, f, fps, u }) => {
  const sx = sp(f, fps, T("px") - 0.05, 9, 260);
  const times = A.clocks ?? ["", "04:02", "04:41", "05:06"];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#26304f, #121626)", fontFamily: UI }}>
      {[0, 1, 2].map((i) => {
        const tk = hasCue(`p${i + 1}`) ? T(`p${i + 1}`) : T("px") - 0.9 + i * 0.25, d = cl(t, [tk - 0.15, tk + 0.25], [-1400, 0], Easing.out(Easing.back(1.4)));
        return (
          <div key={i} style={{ position: "absolute", left: 170 + i * 50, top: 330 + i * 230 + d, width: 640, height: 470, borderRadius: 18, background: "#fffdf4", border: `6px solid ${INK}`,
            transform: `rotate(${[-8, 5, -3][i]}deg)`, boxShadow: "0 20px 40px rgba(0,0,0,.4)", padding: "26px 36px", boxSizing: "border-box" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 40, fontWeight: 800, color: INK }}><span style={{ background: "#2c5aa0", color: "#fff", borderRadius: 10, padding: "0 14px" }}>P</span>{A.ticket ?? "AIRPORT PARKING"}</div>
            <div style={{ marginTop: 18, fontFamily: "'Courier New', monospace", fontSize: 40, fontWeight: 800, color: "#333", lineHeight: 1.35 }}>
              ENTRY {times[i + 1] || "04:0" + i}<br />VEHICLE  WHITE HATCH<br />DRIVER  ROHAN
            </div>
            <div style={{ position: "absolute", right: 30, bottom: 26, fontSize: 64, fontWeight: 800, color: RED, border: `6px solid ${RED}`, borderRadius: 14, padding: "0 18px", transform: "rotate(-12deg)" }}>PAID</div>
            <div style={{ position: "absolute", left: 36, bottom: 30, display: "flex", gap: 5 }}>{Array.from({ length: 26 }, (_, k) => <div key={k} style={{ width: (k * 7) % 3 + 3, height: 70, background: INK }} />)}</div>
          </div>
        );
      })}
      <Stamp text="×3" s={sx} bg={YELLOW} fg={INK} x={820} y={300} rot={10} size={200} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 120 + u * 0, textAlign: "center" }} />
    </AbsoluteFill>
  );
};

// ---------------- Sunday night callback ----------------
const TEXTS: string[] = A.texts ?? ["airport drop? 4am 🙏", "bhai airport? 🥺", "beta, airport, 5 sharp"];
const Sleep: React.FC<{ t: number; f: number; fps: number; u: number; pop: number }> = ({ t, f, fps, u, pop }) => {
  const glow = 0.6 + 0.4 * Math.sin(t * 4);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#141b36, #0a0d1a)", fontFamily: UI }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {/* window with the moon */}
        <rect x={640} y={150} width={320} height={380} rx={20} fill="#1f2c58" stroke="#3a4570" strokeWidth={16} />
        <path d="M 800 150 V 530 M 640 340 H 960" stroke="#3a4570" strokeWidth={10} />
        <circle cx={880} cy={240} r={44} fill="#fff3c4" /><circle cx={900} cy={228} r={40} fill="#1f2c58" />
        {/* calendar */}
        <rect x={120} y={190} width={260} height={290} rx={20} fill="#fff" stroke={INK} strokeWidth={7} />
        <rect x={120} y={190} width={260} height={80} rx={20} fill={RED} stroke={INK} strokeWidth={7} />
        <text x={250} y={250} textAnchor="middle" fontWeight={800} fontSize={44} fill="#fff">SUNDAY</text>
        <text x={250} y={420} textAnchor="middle" fontWeight={800} fontSize={130} fill={INK}>☾</text>
        {/* bed + sleeping Rohan */}
        <rect x={60} y={1050} width={720} height={260} rx={30} fill="#7a4e2e" stroke={INK} strokeWidth={8} />
        <rect x={40} y={900} width={60} height={420} rx={20} fill="#7a4e2e" stroke={INK} strokeWidth={8} />
        <rect x={110} y={960} width={210} height={110} rx={50} fill="#f4f1ea" stroke={INK} strokeWidth={6} />
        <g transform={`translate(210 ${975 + Math.sin(t * 2) * 3}) rotate(-90) scale(1.2)`}><Bust who={ROHAN} lids={1} mouth="smile" /></g>
        <path d={`M 280 1030 Q 520 ${980 + Math.sin(t * 2) * 6} 770 1040 L 770 1100 L 280 1100 Z`} fill="#4f7fc4" stroke={INK} strokeWidth={7} />
        {[0, 1, 2].map((i) => {
          const k = ((u * 0.7 + i / 3) % 1);
          return <text key={i} x={300 + k * 120 + i * 10} y={900 - k * 260} fontWeight={800} fontSize={60 + 30 * k} fill="#cfe0ff" opacity={1 - k}>z</text>;
        })}
        {/* nightstand + phone */}
        <rect x={810} y={1080} width={220} height={240} rx={14} fill="#5a3a22" stroke={INK} strokeWidth={8} />
        <g transform={`translate(920 1010) scale(${0.8 + 0.2 * pop})`}>
          <circle r={150} fill="#ffcf5a" opacity={0.18 * glow} />
          <rect x={-60} y={-110} width={120} height={200} rx={20} fill="#111" stroke={INK} strokeWidth={6} />
          <rect x={-48} y={-96} width={96} height={170} rx={12} fill="#ffcf5a" />
          <PlaneIcon x={0} y={-10} s={1.1} rot={-45} col="#fff" />
        </g>
        {/* messages bouncing off */}
        {TEXTS.map((m, i) => {
          const t0 = 0.25 + i * 0.55, k = u - t0;
          if (k < 0) return null;
          const fly = cl(k, [0, 0.4], [0, 1], Easing.in(Easing.quad)), back = cl(k, [0.4, 1.1], [0, 1], Easing.out(Easing.quad));
          const x = 160 + 520 * fly - 380 * back, y = 640 + i * 110 + 260 * fly - 500 * back * back;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${back * (i % 2 ? 40 : -40)})`} opacity={1 - cl(k, [0.9, 1.3], [0, 1])}>
              <rect x={0} y={-44} width={m.length * 22 + 50} height={80} rx={28} fill="#fff" stroke={INK} strokeWidth={5} />
              <text x={25} y={10} fontWeight={800} fontSize={36} fill={INK}>{m}</text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const AirportOverlay: React.FC<{ t0: number; t1: number; mode: AirportMode }> = ({ t0, t1, mode }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps, u = t - t0;
  const pop = sp(f, fps, t0, 14, 170);
  const out = cl(t, [t1 - 0.1, t1], [1, 0]);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      {mode === "road" ? <Road t={t} u={u} f={f} fps={fps} /> : mode === "pa" ? <Board t={t} f={f} fps={fps} pop={pop} /> : mode === "calls" ? <Calls t={t} f={f} fps={fps} pop={pop} />
        : mode === "row" ? <Row t={t} f={f} fps={fps} pop={pop} /> : mode === "parking" ? <Parking t={t} f={f} fps={fps} u={u} /> : <Sleep t={t} f={f} fps={fps} u={u} pop={pop} />}
    </AbsoluteFill>
  );
};
