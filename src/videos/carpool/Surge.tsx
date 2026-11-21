// "Monday Markets" overlays (2026-11-21): the rainy-Monday cab surge told as a deadpan TV business-news bulletin.
// Full-screen 2D overlays driven by story cues:
//   market - the news studio: rain on the window, a stock chart of PRIYA'S CAB FARE. Hook: the line spikes to x3 on cue
//            hook3; cue anchor slides in the MONDAY MARKETS banner, cue ticker the PRIYA FARE ticker chip. Second visit:
//            the chart restarts and steps x1.5 / x2 / x3 on cues m1 / m2 / m3 (RAINY MON n chips); cue bankrupt: her
//            umbrella droops with a BANKRUPT stamp. A crawl of fake tickers runs along the bottom.
//   brolly - the failed attempt: Priya wading along the flooded main road under her umbrella, phone card on top. Cue main:
//            MAIN ROAD sign, cue cheap: a "cheaper pin" drops; cue flip: a gust flips the umbrella inside out; cue still:
//            the phone says x3 STILL; cue soaked: SOAKED stamp and drips
//   raju   - her cab driver Raju at the wheel, wipers going; cue four: four booking pins pop on one gate; cue minute:
//            the same 8:14 clock on all four; cue techpark: four arrows to TECH PARK
//   demand - the colony gate in the rain: four yellow cabs queued, the four neighbours under umbrellas appear on cues
//            n1..n4 (ROHAN / ARJUN / SHARMA JI / YOU); cue demand: a DEMAND meter maxes out; cue neighbours: stamp
//   close  - callback: the studio again, CLOSING BELL rings, the fare line flattens on cue flat (FLAT chip), the umbrella
//            pops back open with a plaster on cue recover (RECOVERED)
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CUE, hasCue } from "./story";
import { Bust, Stamp } from "./Airport";

export type SurgeMode = "market" | "brolly" | "raju" | "demand" | "close";
export const SURGE_MODES: string[] = ["market", "brolly", "raju", "demand", "close"];
export const SURGE_CAPTION_Y: Record<string, number> = { market: 1560, brolly: 1600, raju: 1620, demand: 1640, close: 1560 };
const UI = "Manrope, 'Helvetica Neue', Arial, sans-serif";
const INK = "#141414", YELLOW = "#f6cf4a", RED = "#d8362b", GREEN = "#2f9e4f", NAVY = "#14213d", CAB = "#f2c230";
const ROHAN = { skin: "#c99a6e", shirt: "#3d6db5", hair: "#1f1712" };
const PRIYA = { skin: "#c48a62", shirt: "#d0607e", hair: "#1a120e" };
const ARJUN = { skin: "#b9845a", shirt: "#4f8a3a", hair: "#1f1712" };
const SHARMA = { skin: "#c08d63", shirt: "#e9c33a", hair: "#e8e4dc" };
const RAJU = { skin: "#a8744c", shirt: "#e8e1cf", hair: "#1a120e" };
const cl = (t: number, a: number[], b: number[], e = Easing.inOut(Easing.cubic)) => interpolate(t, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
const T = (k: string) => (hasCue(k) ? CUE[k] : 1e6);
const sp = (f: number, fps: number, t: number, damping = 12, stiffness = 200) => (t > 1e5 || f < Math.round(t * fps) ? 0 : spring({ frame: f - Math.round(t * fps), fps, config: { damping, stiffness } }));
const after = (t: number, k: string) => t >= T(k) - 0.08;

// ---------------- pieces ----------------
/** diagonal rain streaks over the whole frame */
const Rain: React.FC<{ t: number; n?: number; op?: number; color?: string }> = ({ t, n = 70, op = 0.55, color = "#cfe6ff" }) => (
  <g opacity={op}>
    {Array.from({ length: n }, (_, i) => {
      const sx = (i * 137.5) % 1180 - 50, sp0 = 1400 + (i % 5) * 160, y = ((t * sp0 + i * 331) % 2100) - 120, x = sx - (y * 0.18);
      return <path key={i} d={`M ${x} ${y} l -12 60`} stroke={color} strokeWidth={4 + (i % 3)} strokeLinecap="round" />;
    })}
  </g>
);
/** an umbrella at the origin (handle bottom at y = 0). flip 0..1 turns it inside out; droop bends it; plaster after recovery */
const Umbrella: React.FC<{ flip?: number; droop?: number; col?: string; plaster?: boolean; s?: number }> = ({ flip = 0, droop = 0, col = "#2f6fb5", plaster, s = 1 }) => {
  const e = -300 + 20 * droop - 170 * flip; // canopy edge height: rises when blown inside out
  const c = -450 + 110 * flip; // canopy peak (normal dome) -> shallow bowl centre when flipped
  const rim = (x: number) => e + (-300 - e) * (1 - Math.abs(x) / 230);
  const sc = [-230, -115, 0, 115, 230];
  let bottom = "";
  for (let i = sc.length - 1; i > 0; i--) { const x0 = sc[i], x1 = sc[i - 1], xm = (x0 + x1) / 2; bottom += ` Q ${xm} ${(rim(x0) + rim(x1)) / 2 + 34} ${x1} ${rim(x1)}`; }
  return (
    <g transform={`scale(${s}) rotate(${droop * 28})`}>
      <path d="M 0 0 L 0 -300" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      <path d="M 0 0 q 0 34 -30 34 q -26 0 -26 -26" stroke={INK} strokeWidth={10} fill="none" strokeLinecap="round" />
      <path d={`M -230 ${e} Q -190 ${c} 0 ${c} Q 190 ${c} 230 ${e}${bottom} Z`} fill={col} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <path d={`M 0 -300 L -200 ${e + 10} M 0 -300 L 200 ${e + 10}`} stroke={INK} strokeWidth={5} opacity={flip} />
      {plaster ? <g transform={`translate(-60 ${-360}) rotate(-25)`}><rect x={-60} y={-20} width={120} height={40} rx={18} fill="#f3c9a0" stroke={INK} strokeWidth={5} /><path d="M -14 -10 v 20 M 0 -10 v 20 M 14 -10 v 20" stroke={INK} strokeWidth={3} /></g> : null}
    </g>
  );
};
const Tag: React.FC<{ x: number; y: number; text: string; bg: string; fg?: string; size?: number; rot?: number; s?: number }> = ({ x, y, text, bg, fg = "#fff", size = 44, rot = 0, s = 1 }) => {
  const w = text.length * size * 0.66 + 50;
  return s > 0.01 ? (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-w / 2} y={-size * 0.82} width={w} height={size * 1.64} rx={16} fill={bg} stroke={INK} strokeWidth={6} />
      <text x={0} y={size * 0.36} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={size} fill={fg}>{text}</text>
    </g>
  ) : null;
};
/** a yellow cab from the front */
const CabFront: React.FC<{ s?: number; wipe?: number }> = ({ s = 1, wipe = 0 }) => (
  <g transform={`scale(${s})`}>
    <ellipse cx={0} cy={8} rx={170} ry={18} fill="rgba(0,0,0,.25)" />
    <rect x={-60} y={-262} width={120} height={36} rx={8} fill="#222" stroke={INK} strokeWidth={5} />
    <text x={0} y={-235} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={26} fill={YELLOW}>TAXI</text>
    <path d="M -150 -20 L -150 -110 Q -140 -130 -112 -140 L -96 -214 Q -90 -228 -70 -228 L 70 -228 Q 90 -228 96 -214 L 112 -140 Q 140 -130 150 -110 L 150 -20 Z" fill={CAB} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M -86 -208 L 86 -208 L 100 -146 L -100 -146 Z" fill="#a9d6f5" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <g transform={`translate(-60 -148) rotate(${-50 + 60 * wipe})`}><path d="M 0 0 L 70 0" stroke={INK} strokeWidth={5} strokeLinecap="round" /></g>
    <rect x={-150} y={-100} width={300} height={22} fill="#222" />
    {[-1, 1].map((d) => <circle key={d} cx={d * 110} cy={-70} r={22} fill="#fff4c4" stroke={INK} strokeWidth={5} />)}
    <rect x={-60} y={-60} width={120} height={30} rx={6} fill="#fff" stroke={INK} strokeWidth={4} />
    {[-1, 1].map((d) => <rect key={"w" + d} x={d * 120 - 22} y={-26} width={44} height={36} rx={8} fill="#222" stroke={INK} strokeWidth={4} />)}
  </g>
);

// ---------------- studio (market / close) ----------------
const Studio: React.FC<{ t: number; f: number; fps: number; close: boolean }> = ({ t, f, fps, close }) => {
  // fare multiplier over time
  const hookUp = cl(t, [T("hook3") - 0.1, T("hook3") + 0.35], [1, 3], Easing.out(Easing.back(1.4)));
  const second = t >= T("m1") - 0.12;
  const steps: [string, number][] = [["m1", 1.5], ["m2", 2], ["m3", 3]];
  let lv = close ? 3 : second ? 1 : hookUp;
  let day = 0;
  if (second && !close) steps.forEach(([k, v], i) => { if (t >= T(k) - 0.1) { lv = v === 1.5 ? 1 + 0.5 * cl(t, [T(k) - 0.1, T(k) + 0.3], [0, 1]) : steps[i - 1][1] + (v - steps[i - 1][1]) * cl(t, [T(k) - 0.1, T(k) + 0.3], [0, 1], Easing.out(Easing.back(1.5))); day = i + 1; } });
  if (close) lv = 3 - 2 * cl(t, [T("flat") - 0.15, T("flat") + 0.5], [0, 1], Easing.out(Easing.cubic));
  // chart geometry: x 120..960, y 1240 (x1) .. 640 (x3)
  const Y = (v: number) => 1240 - (v - 1) * 300;
  const pts: [number, number][] = [];
  const N = 28;
  for (let i = 0; i <= N; i++) {
    const x = 130 + (i / N) * 800, u = i / N;
    const base = close ? (u < 0.55 ? 3 - 0.2 * Math.sin(i * 1.3) : 3 + (lv - 3) * cl(u, [0.55, 0.8], [0, 1])) : 1 + (lv - 1) * Math.pow(u, 2.2);
    pts.push([x, Y(base) + Math.sin(i * 2.1 + t * 3) * (close && u > 0.8 ? 2 : 9)]);
  }
  const d = pts.map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const end = pts[pts.length - 1];
  const up = !close || lv > 1.3;
  const sAnchor = close ? 1 : sp(f, fps, T("anchor") - 0.08, 13, 180);
  const sTick = close ? 1 : sp(f, fps, T("ticker") - 0.05, 10, 220);
  const sDay = sp(f, fps, (day ? T(steps[day - 1][0]) : 1e6) - 0.08, 10, 220);
  const bank = !close && after(t, "bankrupt");
  const sBank = sp(f, fps, T("bankrupt") - 0.05, 9, 260);
  const rec = close && after(t, "recover");
  const sRec = sp(f, fps, T("recover") - 0.05, 9, 220);
  const sFlat = sp(f, fps, T("flat") - 0.05, 9, 240);
  const crawl = "PRIYA FARE ▲ 200%   ·   DRIZZLE ▲   ·   UMBRELLA ▼   ·   CUTTING CHAI —   ·   MONDAY MOOD ▼▼   ·   ";
  const ring = close ? Math.sin(t * 40) * 12 : 0;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="sg_bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#233a6b" /><stop offset="1" stopColor="#0d1630" /></linearGradient>
        </defs>
        <rect width={1080} height={1920} fill="url(#sg_bg)" />
        {/* the studio window: rainy city */}
        <rect x={40} y={360} width={1000} height={1060} rx={26} fill="#3b5a86" stroke={INK} strokeWidth={8} />
        {[[80, 820, 150], [250, 700, 120], [390, 880, 170], [580, 760, 140], [740, 840, 150], [880, 720, 120]].map(([x, y, w], i) => (
          <rect key={i} x={x} y={y} width={w} height={1420 - y} fill="#2c4569" opacity={0.85} />
        ))}
        <g><Rain t={t} n={40} op={0.35} /></g>
        {/* grid + axis */}
        {[1, 1.5, 2, 2.5, 3].map((v) => (
          <g key={v}>
            <path d={`M 120 ${Y(v)} H 960`} stroke="#ffffff" strokeOpacity={0.18} strokeWidth={3} strokeDasharray="12 12" />
            <text x={975} y={Y(v) + 14} fontFamily={UI} fontWeight={800} fontSize={34} fill="#fff" opacity={0.75}>{"x" + v}</text>
          </g>
        ))}
        <path d={`${d} L ${end[0]} 1300 L 130 1300 Z`} fill={up ? RED : GREEN} opacity={0.22} />
        <path d={d} stroke={up ? "#ff5a4d" : "#4fd27a"} strokeWidth={14} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={end[0]} cy={end[1]} r={20 + 4 * Math.sin(t * 8)} fill={up ? "#ff5a4d" : "#4fd27a"} stroke="#fff" strokeWidth={6} />
        {/* the big multiplier chip, pinned to the line's head */}
        <g transform={`translate(${Math.min(850, end[0] - 120)} ${end[1] - 110})`}>
          <rect x={-120} y={-60} width={240} height={110} rx={24} fill={up ? RED : GREEN} stroke={INK} strokeWidth={7} />
          <text x={0} y={28} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={76} fill="#fff" letterSpacing={-2}>{"x" + (Math.round(lv * 10) / 10).toFixed(1).replace(".0", "")}</text>
        </g>
        {/* umbrella in the corner: the other "stock" */}
        <g transform={`translate(300 ${930 + (bank ? 40 * sBank : 0)})`}>
          <Umbrella s={0.75} droop={bank ? sBank : 0} col={bank ? "#6f7b8c" : "#2f6fb5"} plaster={rec} flip={0} />
        </g>
        {/* bottom crawl */}
        <rect x={0} y={1800} width={1080} height={90} fill={YELLOW} stroke={INK} strokeWidth={6} />
        <rect x={0} y={1800} width={170} height={90} fill={RED} stroke={INK} strokeWidth={6} />
        <text x={85} y={1860} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={38} fill="#fff">LIVE</text>
        <g>
          <text x={180 - ((t * 260) % 1700)} y={1860} fontFamily={UI} fontWeight={800} fontSize={40} fill={INK}>{crawl + crawl + crawl}</text>
        </g>
        <rect x={0} y={1800} width={170} height={90} fill={RED} stroke={INK} strokeWidth={6} />
        <text x={85} y={1860} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={38} fill="#fff">LIVE</text>
      </svg>
      {/* banner */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 110, height: 200, transform: `translateX(${(1 - sAnchor) * -1100}px)`, background: NAVY, borderBottom: `14px solid ${YELLOW}`,
        display: "flex", alignItems: "center", gap: 26, padding: "0 50px", boxSizing: "border-box" }}>
        <div style={{ width: 26, height: 26, borderRadius: 13, background: RED, opacity: 0.5 + 0.5 * Math.sin(t * 6) }} />
        <div style={{ fontFamily: UI, fontWeight: 800, fontSize: 84, color: "#fff", letterSpacing: -3 }}>{close ? "CLOSING BELL" : "MONDAY MARKETS"}</div>
        {close ? (
          <svg width={110} height={120} viewBox="-55 -60 110 120" style={{ transform: `rotate(${ring}deg)` }}>
            <path d="M -40 30 Q -40 -40 0 -44 Q 40 -40 40 30 L 50 40 L -50 40 Z" fill={YELLOW} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <circle cx={0} cy={48} r={11} fill={YELLOW} stroke={INK} strokeWidth={5} /><rect x={-6} y={-56} width={12} height={14} rx={4} fill={INK} />
          </svg>) : null}
      </div>
      {/* the ticker chip */}
      <div style={{ position: "absolute", left: 60, top: 350, transform: `scale(${sTick}) rotate(-2deg)`, transformOrigin: "left center", fontFamily: UI, fontWeight: 800, fontSize: 52,
        background: "#fff", color: INK, border: `7px solid ${INK}`, borderRadius: 20, padding: "8px 26px", boxShadow: `9px 9px 0 ${INK}` }}>
        PRIYA'S CAB FARE <span style={{ color: up ? RED : GREEN }}>{up ? "▲" : "▬"}</span>
      </div>
      {!close && day > 0 ? (
        <div style={{ position: "absolute", right: 60, top: 470, transform: `scale(${sDay}) rotate(3deg)`, fontFamily: UI, fontWeight: 800, fontSize: 50, background: YELLOW,
          color: INK, border: `7px solid ${INK}`, borderRadius: 20, padding: "6px 24px", boxShadow: `9px 9px 0 ${INK}` }}>RAINY MON {day}</div>
      ) : null}
      {!close ? <Stamp text="BANKRUPT" s={sBank} bg={INK} x={330} y={1020} rot={-8} size={96} /> : null}
      {close ? <Stamp text="FLAT" s={sFlat} bg={GREEN} x={760} y={760} rot={-6} size={110} /> : null}
      {close ? <Stamp text="RECOVERED" s={sRec} bg={YELLOW} fg={INK} x={330} y={1060} rot={-4} size={84} /> : null}
    </AbsoluteFill>
  );
};

// ---------------- the failed attempt: wading to the main road ----------------
const Brolly: React.FC<{ t: number; u: number; f: number; fps: number }> = ({ t, u, f, fps }) => {
  const flip = cl(t, [T("flip") - 0.1, T("flip") + 0.18], [0, 1], Easing.out(Easing.back(2)));
  const gust = cl(t, [T("flip") - 0.3, T("flip"), T("flip") + 0.5], [0, 1, 0]);
  const sMain = sp(f, fps, T("main") - 0.08, 11, 200), sPin = sp(f, fps, T("cheap") - 0.08, 9, 220);
  const sStill = sp(f, fps, T("still") - 0.06, 9, 240), sSoak = sp(f, fps, T("soaked") - 0.05, 9, 260);
  const soaked = after(t, "flip");
  const x = 300 + Math.min(u, 3.5) * 60, bob = Math.sin(u * 7) * 10;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <rect width={1080} height={1920} fill="#6d859e" />
        {[[0, 900, 260], [280, 800, 200], [520, 940, 240], [800, 860, 280]].map(([x0, y, w], i) => <rect key={i} x={x0} y={y} width={w} height={600} fill="#55697f" />)}
        {/* main road sign */}
        <g transform={`translate(860 ${700 + (1 - sMain) * -500})`} opacity={Math.min(1, sMain * 2)}>
          <rect x={-8} y={0} width={16} height={560} fill="#9aa3ad" stroke={INK} strokeWidth={4} />
          <rect x={-170} y={-60} width={340} height={120} rx={14} fill={GREEN} stroke={INK} strokeWidth={6} />
          <text x={0} y={18} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={50} fill="#fff">MAIN ROAD</text>
        </g>
        {/* Priya, wading */}
        <g transform={`translate(${x} ${1010 + bob}) scale(1.45)`}>
          <g transform="translate(0 -20)"><Bust who={PRIYA} hair="long" mouth={soaked ? "o" : "flat"} /></g>
          <rect x={-70} y={110} width={140} height={260} rx={30} fill={PRIYA.shirt} stroke={INK} strokeWidth={6} />
          <g transform={`translate(70 ${130}) rotate(${-gust * 20})`}><Umbrella s={0.95} flip={flip} col="#2f6fb5" /></g>
          {soaked ? Array.from({ length: 6 }, (_, i) => <path key={i} d={`M ${-60 + i * 24} ${60 + ((u * 300 + i * 50) % 160)} q -9 16 0 22 q 9 -6 0 -22 Z`} fill="#8fd0ff" stroke={INK} strokeWidth={3} />) : null}
        </g>
        {/* gust lines */}
        {gust > 0.02 ? [0, 1, 2].map((i) => <path key={i} d={`M ${-200 + gust * 900} ${700 + i * 70} q 120 -40 240 0 t 200 0`} stroke="#fff" strokeWidth={10} fill="none" opacity={gust} strokeLinecap="round" />) : null}
        {/* water */}
        <path d={`M 0 1420 ${Array.from({ length: 37 }, (_, i) => `L ${i * 30} ${1420 + Math.sin(i / 2 + t * 3) * 10}`).join(" ")} L 1080 1920 L 0 1920 Z`} fill="#4f8fc4" opacity={0.9} />
        {/* the "cheaper" pin */}
        <g transform={`translate(700 ${1440 - sPin * 90}) scale(${sPin})`}>
          <path d="M 0 70 C -22 36 -58 12 -58 -30 A 58 58 0 1 1 58 -30 C 58 12 22 36 0 70 Z" fill={RED} stroke={INK} strokeWidth={6} />
          <circle cx={0} cy={-30} r={22} fill="#fff" stroke={INK} strokeWidth={5} />
        </g>
        <Rain t={t} n={80} op={0.6} />
      </svg>
      {/* phone card */}
      <div style={{ position: "absolute", left: 150, right: 150, top: 150, background: "#fff", border: `7px solid ${INK}`, borderRadius: 34, padding: "22px 30px",
        boxShadow: `10px 10px 0 ${INK}`, fontFamily: UI, color: INK, textAlign: "center", transform: `rotate(-2deg) scale(${0.9 + 0.1 * sp(f, fps, t - u, 12, 180)})` }}>
        <div style={{ fontSize: 34, fontWeight: 700, opacity: 0.65 }}>{sPin > 0.3 ? "Pickup moved: main road" : "Pickup: your gate"}</div>
        <div style={{ fontSize: 92, fontWeight: 800, letterSpacing: -3, color: RED }}>{sStill > 0.3 ? "x3 STILL" : "x3 SURGE"}</div>
      </div>
      <Stamp text="SOAKED" s={sSoak} bg="#1f5f99" x={560} y={1000} rot={-8} size={120} />
    </AbsoluteFill>
  );
};

// ---------------- the twist teller: Raju at the wheel ----------------
const Raju: React.FC<{ t: number; u: number; f: number; fps: number }> = ({ t, u, f, fps }) => {
  const wipe = (Math.sin(t * 4.2) + 1) / 2;
  const s4 = [0, 1, 2, 3].map((i) => sp(f, fps, T("four") - 0.08 + i * 0.09, 10, 230));
  const sMin = sp(f, fps, T("minute") - 0.06, 10, 220), sPark = sp(f, fps, T("techpark") - 0.06, 10, 220);
  const sName = sp(f, fps, T("raju") - 0.08, 11, 200);
  const talking = Math.sin(t * 18) > 0 && u > 0.6;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <rect width={1080} height={1920} fill="#2a3442" />
        {/* windscreen with rain, wiper */}
        <path d="M 60 220 Q 540 150 1020 220 L 1000 760 Q 540 720 80 760 Z" fill="#7d97b4" stroke={INK} strokeWidth={10} />
        <g><Rain t={t} n={30} op={0.5} /></g>
        <g transform={`translate(300 760) rotate(${-150 + wipe * 120})`}><path d="M 0 0 L 460 0" stroke={INK} strokeWidth={12} strokeLinecap="round" /></g>
        {/* the gate seen through the glass with four booking pins */}
        <g transform="translate(540 600)">
          <rect x={-200} y={-150} width={30} height={150} fill="#d9d2c0" stroke={INK} strokeWidth={5} />
          <rect x={170} y={-150} width={30} height={150} fill="#d9d2c0" stroke={INK} strokeWidth={5} />
          <rect x={-200} y={-180} width={400} height={40} fill="#c46a4e" stroke={INK} strokeWidth={5} />
          <text x={0} y={-150} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={28} fill="#fff">COLONY GATE</text>
          {s4.map((s, i) => (
            <g key={i} transform={`translate(${-150 + i * 100} ${-230 - s * 60}) scale(${s})`}>
              <path d="M 0 50 C -16 26 -42 8 -42 -22 A 42 42 0 1 1 42 -22 C 42 8 16 26 0 50 Z" fill={RED} stroke={INK} strokeWidth={5} />
              <circle cx={0} cy={-22} r={15} fill="#fff" stroke={INK} strokeWidth={4} />
              {sMin > 0.3 ? <Tag x={0} y={-104} text="8:14" bg={YELLOW} fg={INK} size={28} s={sMin} /> : null}
            </g>
          ))}
        </g>
        {/* dashboard + Raju */}
        <rect x={0} y={1380} width={1080} height={540} fill="#1d232c" />
        <g transform="translate(540 1120) scale(2.3)">
          <path d="M -52 -40 Q -50 -78 0 -80 Q 50 -78 52 -40 L 56 -34 L -56 -34 Z" fill="#3b4a6b" stroke={INK} strokeWidth={4} />
          <Bust who={RAJU} tache mouth={talking ? "o" : "smile"} />
          <path d="M -54 -34 Q 0 -58 54 -34 L 70 -30 L -54 -26 Z" fill="#3b4a6b" stroke={INK} strokeWidth={4} />
        </g>
        <circle cx={540} cy={1560} r={190} fill="none" stroke="#111" strokeWidth={34} />
        <circle cx={540} cy={1560} r={190} fill="none" stroke={INK} strokeWidth={6} />
        <path d="M 360 1560 H 720" stroke="#111" strokeWidth={30} />
      </svg>
      <div style={{ position: "absolute", left: 60, top: 860, transform: `scale(${sName}) rotate(-3deg)`, transformOrigin: "left center", fontFamily: UI, fontWeight: 800, fontSize: 50,
        background: YELLOW, color: INK, border: `7px solid ${INK}`, borderRadius: 20, padding: "6px 26px", boxShadow: `9px 9px 0 ${INK}` }}>RAJU · YOUR DRIVER</div>
      <Stamp text="→ SAME TECH PARK" s={sPark} bg={RED} x={540} y={130} rot={-3} size={74} />
    </AbsoluteFill>
  );
};

// ---------------- the reveal: four neighbours, four cabs, one gate ----------------
const Demand: React.FC<{ t: number; u: number; f: number; fps: number }> = ({ t, f, fps }) => {
  const ppl = [
    { who: ROHAN, name: "ROHAN", k: "n1", hair: "short" as const, col: "#3d6db5" },
    { who: ARJUN, name: "ARJUN", k: "n2", hair: "short" as const, col: "#4f8a3a" },
    { who: SHARMA, name: "SHARMA JI", k: "n3", hair: "white" as const, col: "#e3b53a", tache: true },
    { who: PRIYA, name: "YOU", k: "n4", hair: "long" as const, col: "#c8577a" },
  ];
  const meter = cl(t, [T("demand") - 0.1, T("demand") + 0.6], [0.25, 1], Easing.out(Easing.back(1.3)));
  const sMeter = sp(f, fps, T("demand") - 0.1, 12, 200);
  const sN = sp(f, fps, T("neighbours") - 0.05, 9, 260);
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <rect width={1080} height={1920} fill="#7d93ab" />
        {/* road with four cabs queued */}
        <rect x={0} y={520} width={1080} height={420} fill="#4c5560" />
        <path d="M 0 730 H 1080" stroke="#e8e4d8" strokeWidth={10} strokeDasharray="60 50" />
        {[0, 1, 2, 3].map((i) => <g key={i} transform={`translate(${150 + i * 260} ${900}) scale(0.72)`}><CabFront wipe={(Math.sin(t * 4 + i) + 1) / 2} /></g>)}
        {/* gate */}
        <rect x={40} y={940} width={50} height={560} fill="#d9d2c0" stroke={INK} strokeWidth={6} />
        <rect x={990} y={940} width={50} height={560} fill="#d9d2c0" stroke={INK} strokeWidth={6} />
        <rect x={0} y={1500} width={1080} height={420} fill="#8a8f98" />
        {/* the four, under umbrellas, phones out */}
        {ppl.map((p, i) => {
          const s = sp(f, fps, T(p.k) - 0.08, 10, 220), x = 160 + i * 253, y = 1330;
          return s > 0.01 ? (
            <g key={i} transform={`translate(${x} ${y + (1 - s) * 200})`} opacity={Math.min(1, s * 1.5)}>
              <g transform="translate(0 -10)"><Umbrella s={0.62} col={p.col} /></g>
              <g transform="translate(0 0) scale(0.95)"><Bust who={p.who} hair={p.hair} tache={p.tache} mouth={after(t, "neighbours") ? "o" : "flat"} /></g>
              <rect x={30} y={60} width={34} height={56} rx={8} fill="#222" stroke={INK} strokeWidth={4} />
              <rect x={35} y={66} width={24} height={40} rx={4} fill={RED} />
              <Tag x={0} y={200} text={p.name} bg={i === 3 ? RED : "#fff"} fg={i === 3 ? "#fff" : INK} size={36} s={s} />
            </g>
          ) : null;
        })}
        <Rain t={t} n={70} op={0.55} />
        {/* demand meter */}
        <g transform={`translate(540 300) scale(${sMeter})`}>
          <rect x={-420} y={-90} width={840} height={180} rx={30} fill="#fff" stroke={INK} strokeWidth={8} />
          <text x={-390} y={-26} fontFamily={UI} fontWeight={800} fontSize={44} fill={INK}>DEMAND AT YOUR GATE</text>
          <rect x={-390} y={8} width={780} height={56} rx={28} fill="#e6e6e6" stroke={INK} strokeWidth={5} />
          <rect x={-390} y={8} width={780 * meter} height={56} rx={28} fill={meter > 0.8 ? RED : YELLOW} stroke={INK} strokeWidth={5} />
        </g>
      </svg>
      <Stamp text="HER NEIGHBOURS" s={sN} bg={RED} x={540} y={1060} rot={-6} size={96} />
    </AbsoluteFill>
  );
};

export const SurgeOverlay: React.FC<{ t0: number; t1: number; mode: SurgeMode }> = ({ t0, t1, mode }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps, u = t - t0;
  const out = cl(t, [t1 - 0.1, t1], [1, 0]);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      {mode === "market" || mode === "close" ? <Studio t={t} f={f} fps={fps} close={mode === "close"} /> : mode === "brolly" ? <Brolly t={t} u={u} f={f} fps={fps} />
        : mode === "raju" ? <Raju t={t} u={u} f={f} fps={fps} /> : <Demand t={t} u={u} f={f} fps={fps} />}
    </AbsoluteFill>
  );
};
