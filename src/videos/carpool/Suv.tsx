// "The SUV that never moved" overlays (2026-11-20): a colony mystery told as a deadpan case file.
// Full-screen 2D overlays driven by story cues:
//   suv     - side view of the green SUV in slot 9 against the colony wall. Hook: "NEVER MOVED" stamp (cue never), a
//             dashed "?" car outline behind it (cue behind); cue file drops the CASE FILE tab; months m1..m4 add dust,
//             "WASH ME" on the window, the guard's laundry on the bonnet and a pigeon family on the roof
//   theory  - corkboard with three polaroid theories (cues th1/th2/th3): wedding gift bow, spy shades, ghost (wipers
//             swing on cue wipers)
//   blocked - top-down parking row: Rohan's slot empty (SERVICE), the SUV reverses out (cue out); then REWIND (cue
//             replay): Rohan's white car slides in behind it, "EVERY NIGHT" stamp (cue every), "FOR A YEAR" (cue year)
//   iyer    - Mr Iyer, too polite to knock (hand hovering, sweat drop), then an auto rickshaw carries him to the tech
//             park where Rohan's white car is parked (cue auto, cue office: "SAME OFFICE")
//   aao     - the fourteen-point turn: the SUV jiggles in and out, turn counter, four uncles shouting; the scooter falls
//             (cue scooter); SUV snaps back into slot 9 (cue back)
//   pin     - callback: the dusty SUV with a big green map pin "Pickup point: The SUV", Rohan's car waiting in the lane,
//             pigeons flapping hearts (cue pigeons)
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CUE, hasCue } from "./story";
import { Bust, Stamp } from "./Airport";

export type SuvMode = "suv" | "theory" | "blocked" | "iyer" | "aao" | "pin";
export const SUV_MODES: string[] = ["suv", "theory", "blocked", "iyer", "aao", "pin"];
const UI = "Manrope, 'Helvetica Neue', Arial, sans-serif";
const INK = "#141414", YELLOW = "#f6cf4a", RED = "#d8362b", GREEN = "#2f9e4f";
const SUVC = "#2f6b4f", SUVD = "#24543d";
const ROHAN = { skin: "#c99a6e", shirt: "#3d6db5", hair: "#1f1712" };
const PRIYA = { skin: "#c48a62", shirt: "#d0607e", hair: "#1a120e" };
const ARJUN = { skin: "#b9845a", shirt: "#4f8a3a", hair: "#1f1712" };
const SHARMA = { skin: "#c08d63", shirt: "#e9c33a", hair: "#e8e4dc" };
const IYER = { skin: "#b88356", shirt: "#2b3f6b", hair: "#9a9a9a" };
const cl = (t: number, a: number[], b: number[], e = Easing.inOut(Easing.cubic)) => interpolate(t, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
const T = (k: string) => (hasCue(k) ? CUE[k] : 1e6);
const sp = (f: number, fps: number, t: number, damping = 12, stiffness = 200) => (t > 1e5 ? 0 : spring({ frame: f - Math.round(t * fps), fps, config: { damping, stiffness } }));
const after = (t: number, k: string) => t >= T(k) - 0.08;

// ---------------- pieces ----------------
const Pigeon: React.FC<{ x: number; y: number; s?: number; flap?: number; flip?: boolean }> = ({ x, y, s = 1, flap = 0, flip }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <ellipse cx={0} cy={0} rx={34} ry={22} fill="#9aa3b2" stroke={INK} strokeWidth={4} />
    <path d={`M -6 -6 Q -30 ${-30 - flap * 30} -46 ${-10 - flap * 40} Q -30 -2 -6 4 Z`} fill="#7d8697" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={30} cy={-18} r={15} fill="#8a93a3" stroke={INK} strokeWidth={4} />
    <circle cx={35} cy={-21} r={3.5} fill={INK} />
    <path d="M 44 -16 L 56 -13 L 44 -10 Z" fill="#e3a03a" stroke={INK} strokeWidth={2} />
    <path d="M -34 2 L -52 10 L -34 12 Z" fill="#6b7383" stroke={INK} strokeWidth={3} />
    <path d="M -6 20 V 30 M 8 20 V 30" stroke="#e3a03a" strokeWidth={4} />
  </g>
);

/** side view of the boxy green SUV, facing right, wheels on y = 0, about 700 wide */
const SuvSide: React.FC<{ t: number; dust?: number; wash?: number; laundry?: number; pigeons?: number; bow?: number; shades?: number; ghost?: number; wipe?: number; flap?: number }> =
  ({ t, dust = 0, wash = 0, laundry = 0, pigeons = 0, bow = 0, shades = 0, ghost = 0, wipe = 0, flap = 0 }) => (
    <g>
      <ellipse cx={0} cy={6} rx={380} ry={24} fill="rgba(0,0,0,.25)" />
      <path d="M -340 -40 L -340 -250 Q -340 -280 -310 -282 L 150 -286 Q 186 -286 206 -260 L 262 -180 L 330 -164 Q 360 -158 360 -126 L 360 -40 Z" fill={SUVC} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <rect x={-340} y={-60} width={700} height={22} fill={SUVD} />
      {/* windows */}
      <path d="M -310 -170 L -310 -260 L -120 -262 L -120 -170 Z" fill="#a9d6f5" stroke={INK} strokeWidth={6} />
      <path d="M -100 -170 L -100 -262 L 60 -264 L 60 -170 Z" fill="#a9d6f5" stroke={INK} strokeWidth={6} />
      <path d="M 80 -170 L 80 -264 L 146 -264 Q 170 -264 184 -246 L 234 -172 Z" fill="#a9d6f5" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {/* roof rails, door lines, handles, lamps */}
      <rect x={-300} y={-300} width={420} height={14} rx={7} fill="#3b3f46" stroke={INK} strokeWidth={4} />
      <path d="M -110 -160 V -50 M 70 -160 V -50" stroke={INK} strokeWidth={5} />
      <rect x={-60} y={-140} width={40} height={10} rx={5} fill="#cfd5d8" stroke={INK} strokeWidth={3} />
      <rect x={110} y={-140} width={40} height={10} rx={5} fill="#cfd5d8" stroke={INK} strokeWidth={3} />
      <rect x={330} y={-150} width={26} height={30} rx={6} fill="#ffe9a0" stroke={INK} strokeWidth={4} />
      <rect x={-346} y={-210} width={18} height={50} rx={5} fill={RED} stroke={INK} strokeWidth={4} />
      {[-220, 230].map((x) => (
        <g key={x}><circle cx={x} cy={-40} r={70} fill="#222" stroke={INK} strokeWidth={8} /><circle cx={x} cy={-40} r={32} fill="#b9bec6" stroke={INK} strokeWidth={5} /></g>
      ))}
      {/* wiper */}
      <g transform={`translate(226 -176) rotate(${-wipe * 50})`}><path d="M 0 0 L -60 -70" stroke={INK} strokeWidth={6} strokeLinecap="round" /></g>
      {/* dust: brown film + specks */}
      {dust > 0.01 ? (
        <g opacity={dust}>
          <path d="M -340 -40 L -340 -250 Q -340 -280 -310 -282 L 150 -286 Q 186 -286 206 -260 L 262 -180 L 330 -164 Q 360 -158 360 -126 L 360 -40 Z" fill="#a8865a" opacity={0.55} />
          {Array.from({ length: 40 }, (_, i) => <circle key={i} cx={-330 + ((i * 173) % 680)} cy={-60 - ((i * 59) % 220)} r={3 + (i % 4)} fill="#7a5e3a" opacity={0.6} />)}
        </g>
      ) : null}
      {wash > 0.01 ? <text x={-215} y={-200} textAnchor="middle" fontFamily="'Comic Sans MS', 'Chalkboard SE', cursive" fontWeight={800} fontSize={50} fill="#fff" opacity={wash} transform="rotate(-6 -215 -200)">WASH ME</text> : null}
      {laundry > 0.01 ? (
        <g opacity={laundry} transform={`translate(0 ${(1 - laundry) * -30})`}>
          <path d="M 80 -300 Q 220 -250 350 -190" stroke="#eee" strokeWidth={4} fill="none" />
          <path d="M 120 -288 L 190 -268 L 184 -200 L 150 -196 L 152 -230 L 132 -232 L 118 -196 L 94 -206 Z" fill="#e6e1d0" stroke={INK} strokeWidth={4} />
          <path d="M 230 -252 L 300 -226 L 292 -150 L 220 -172 Z" fill="#d0607e" stroke={INK} strokeWidth={4} />
          <rect x={312} y={-212} width={36} height={60} rx={8} fill="#3d6db5" stroke={INK} strokeWidth={4} />
        </g>
      ) : null}
      {pigeons > 0.01 ? (
        <g transform={`translate(-100 ${-300 - (1 - Math.min(1, pigeons)) * 120})`} opacity={Math.min(1, pigeons * 2)}>
          <path d="M -120 4 Q -100 -40 0 -40 Q 100 -40 120 4 Z" fill="#a07a44" stroke={INK} strokeWidth={5} />
          {[-110, -60, 0, 60, 110].map((x, i) => <path key={i} d={`M ${x - 20} -10 L ${x + 30} -30`} stroke="#6e5028" strokeWidth={5} />)}
          <Pigeon x={-60} y={-60} s={1.1} flap={flap * Math.abs(Math.sin(t * 20))} />
          <Pigeon x={60} y={-62} s={1.1} flip flap={flap * Math.abs(Math.sin(t * 20 + 1))} />
          <Pigeon x={0} y={-44} s={0.6} />
          <Pigeon x={-20} y={-36} s={0.5} flip />
        </g>
      ) : null}
      {bow > 0.01 ? (
        <g transform={`translate(-80 -300) scale(${bow})`}>
          <path d="M -380 160 H 420" stroke={RED} strokeWidth={34} opacity={0.9} />
          <path d="M 0 0 Q -120 -110 -150 -20 Q -120 40 0 0 Q 120 -110 150 -20 Q 120 40 0 0 Z" fill={RED} stroke={INK} strokeWidth={6} />
          <circle r={26} fill="#b02a22" stroke={INK} strokeWidth={5} />
        </g>
      ) : null}
      {shades > 0.01 ? (
        <g transform={`translate(150 -220) scale(${shades})`}>
          <path d="M -90 -20 H 90" stroke={INK} strokeWidth={10} />
          <path d="M -90 -24 Q -90 20 -50 20 Q -10 20 -10 -24 Z M 10 -24 Q 10 20 50 20 Q 90 20 90 -24 Z" fill={INK} />
          <path d="M -160 -86 Q 0 -130 160 -86 L 120 -60 Q 0 -90 -120 -60 Z" fill="#2b2b2b" stroke={INK} strokeWidth={5} />
        </g>
      ) : null}
      {ghost > 0.01 ? (
        <g transform={`translate(-210 ${-330 + Math.sin(t * 5) * 14}) scale(${ghost})`} opacity={0.92}>
          <path d="M -70 60 L -70 -20 Q -70 -90 0 -90 Q 70 -90 70 -20 L 70 60 L 46 40 L 24 60 L 0 40 L -24 60 L -46 40 Z" fill="#fff" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <ellipse cx={-22} cy={-30} rx={10} ry={14} fill={INK} /><ellipse cx={22} cy={-30} rx={10} ry={14} fill={INK} /><ellipse cx={0} cy={10} rx={14} ry={18} fill={INK} />
        </g>
      ) : null}
    </g>
  );

/** top-down car, nose up (-y), centred at the origin */
const CarTop: React.FC<{ col: string; w?: number; h?: number; label?: string; dashed?: boolean }> = ({ col, w = 190, h = 360, label, dashed }) => (
  <g>
    {dashed ? <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={40} fill="none" stroke="#fff" strokeWidth={6} strokeDasharray="22 16" />
      : <>
        <rect x={-w / 2 + 8} y={-h / 2 + 10} width={w} height={h} rx={40} fill="rgba(0,0,0,.25)" />
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={40} fill={col} stroke={INK} strokeWidth={7} />
        <rect x={-w / 2 + 24} y={-h / 2 + 70} width={w - 48} height={70} rx={16} fill="#a9d6f5" stroke={INK} strokeWidth={5} />
        <rect x={-w / 2 + 22} y={-h / 2 + 150} width={w - 44} height={h - 260} rx={18} fill="rgba(0,0,0,.12)" stroke={INK} strokeWidth={4} />
        <rect x={-w / 2 + 28} y={h / 2 - 96} width={w - 56} height={50} rx={14} fill="#a9d6f5" stroke={INK} strokeWidth={5} />
        <rect x={-w / 2 + 14} y={-h / 2 + 4} width={34} height={16} rx={6} fill="#ffe9a0" /><rect x={w / 2 - 48} y={-h / 2 + 4} width={34} height={16} rx={6} fill="#ffe9a0" />
      </>}
    {label ? <text x={0} y={10} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={40} fill={dashed ? "#fff" : INK}>{label}</text> : null}
  </g>
);

/** top-down parking row: colony wall at the top, slots 7..10, lane below */
const ROW_X = [150, 410, 670, 930]; // slot centres (slot 9 = index 2)
const SLOT_Y = 620;
const Lot: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <rect width={1080} height={1920} fill="#5c6068" />
    <rect x={0} y={0} width={1080} height={330} fill="#e9dcc0" />
    <rect x={0} y={300} width={1080} height={40} fill="#c9b892" stroke={INK} strokeWidth={5} />
    {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={60 + i * 120} cy={160} r={46} fill="#5fa04e" stroke={INK} strokeWidth={5} />)}
    {[20, 280, 540, 800, 1060].map((x) => <rect key={x} x={x - 4} y={340} width={8} height={520} fill="#f2f0e6" />)}
    {[7, 8, 9, 10].map((n, i) => <text key={n} x={ROW_X[i]} y={830} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={64} fill="#f2f0e6" opacity={0.8}>{n}</text>)}
    {Array.from({ length: 6 }, (_, i) => <rect key={i} x={30 + i * 190} y={1290} width={110} height={14} rx={7} fill="#f2f0e6" opacity={0.7} />)}
    <rect x={0} y={1700} width={1080} height={220} fill="#8fbf6a" />
    {children}
  </svg>
);

const Polaroid: React.FC<{ x: number; y: number; rot: number; s: number; who: typeof ROHAN; hair: "short" | "long" | "white"; tache?: boolean; label: string; children?: React.ReactNode }> =
  ({ x, y, rot, s, who, hair, tache, label, children }) => s < 0.01 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-250} y={-200} width={500} height={420} fill="#fff" stroke={INK} strokeWidth={5} />
      <rect x={-226} y={-176} width={452} height={300} fill="#cfe3f2" />
      <g transform="translate(20 100) scale(0.5)">{children}</g>
      <g transform="translate(-170 -90) scale(0.62)"><Bust who={who} hair={hair} tache={tache} mouth="o" /></g>
      <text x={0} y={186} textAnchor="middle" fontFamily="'Comic Sans MS', 'Chalkboard SE', cursive" fontWeight={800} fontSize={46} fill={INK}>{label}</text>
      <circle cx={0} cy={-206} r={16} fill={RED} stroke={INK} strokeWidth={4} />
    </g>
  );

const AutoRick: React.FC<{ t: number }> = ({ t }) => (
  <g>
    <ellipse cx={0} cy={8} rx={230} ry={18} fill="rgba(0,0,0,.25)" />
    <path d="M -200 -30 L -200 -250 Q -196 -300 -120 -300 L 90 -300 Q 150 -300 170 -240 L 210 -100 L 210 -30 Z" fill="#2f8f3a" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M -200 -150 L 210 -150 L 210 -30 L -200 -30 Z" fill={YELLOW} stroke={INK} strokeWidth={7} />
    <path d="M -160 -270 L -40 -270 L -40 -160 L -160 -160 Z" fill="#a9d6f5" stroke={INK} strokeWidth={5} />
    <g transform={`translate(-100 -200) scale(0.7) rotate(${Math.sin(t * 14) * 3})`}><Bust who={IYER} hair="white" specs mouth="flat" /></g>
    {[-140, 160].map((x) => <g key={x}><circle cx={x} cy={-30} r={44} fill="#222" stroke={INK} strokeWidth={7} /><circle cx={x} cy={-30} r={18} fill="#b9bec6" /></g>)}
  </g>
);

// ---------------- modes ----------------
const Wall: React.FC = () => (
  <>
    <rect width={1080} height={1920} fill="#cfe3f2" />
    <rect x={0} y={560} width={1080} height={760} fill="#efe2c4" />
    <rect x={0} y={540} width={1080} height={40} fill="#d8c79f" stroke={INK} strokeWidth={5} />
    {Array.from({ length: 7 }, (_, i) => <circle key={i} cx={80 + i * 160} cy={520} r={60} fill="#5fa04e" stroke={INK} strokeWidth={5} />)}
    <rect x={0} y={1320} width={1080} height={600} fill="#5c6068" />
    <rect x={120} y={1330} width={840} height={12} fill="#f2f0e6" />
    <text x={540} y={1460} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={90} fill="#f2f0e6" opacity={0.55}>9</text>
  </>
);

const Suv: React.FC<{ t: number; u: number; f: number; fps: number }> = ({ t, u, f, fps }) => {
  const m = (k: string) => cl(t, [T(k) - 0.1, T(k) + 0.35], [0, 1]);
  const dust = 0.35 * m("m1") + 0.35 * m("m2") + 0.3 * m("m3");
  const zoom = 1 + 0.012 * u;
  const sFile = sp(f, fps, T("file") - 0.05, 13, 180);
  const sNever = sp(f, fps, T("never") - 0.05, 9, 260);
  const q = cl(t, [T("behind") - 0.1, T("behind") + 0.3], [0, 1]) * (1 - cl(t, [T("file") - 0.2, T("file")], [0, 1]));
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(600 1150) scale(${zoom}) translate(-600 -1150)`}>
          <Wall />
          {q > 0.01 ? (
            <g opacity={q} transform="translate(250 0)">
              <path d="M -200 1330 L -200 1110 Q -196 1080 -150 1076 L 60 1072 L 120 1140 L 150 1160 L 150 1330 Z" fill="none" stroke="#fff" strokeWidth={8} strokeDasharray="24 16" />
              <text x={-140} y={1060} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={190} fill="#fff" stroke={INK} strokeWidth={6}>?</text>
            </g>
          ) : null}
          <g transform="translate(600 1330) scale(1.12)">
            <SuvSide t={t} dust={dust} wash={m("m2")} laundry={m("m3")} pigeons={cl(t, [T("m4") - 0.1, T("m4") + 0.5], [0, 1])} flap={cl(t, [T("m4"), T("m4") + 0.3, T("m4") + 1.2], [0, 1, 0.3])} />
          </g>
        </g>
      </svg>
      {sFile > 0.01 ? (
        <div style={{ position: "absolute", left: 60, top: 620, transform: `translateY(${(1 - sFile) * -200}px) rotate(-3deg)`, background: "#e3c27a", border: `7px solid ${INK}`, borderRadius: "28px 28px 10px 10px",
          padding: "18px 40px", fontFamily: UI, fontWeight: 800, color: INK, boxShadow: `10px 10px 0 ${INK}` }}>
          <div style={{ fontSize: 36, opacity: 0.75 }}>COLONY CASE FILE</div>
          <div style={{ fontSize: 76, letterSpacing: -2 }}>SLOT 9 · GREEN SUV</div>
        </div>
      ) : null}
      <Stamp text="NEVER MOVED" s={sNever * (1 - cl(t, [T("file") - 0.2, T("file")], [0, 1]))} bg={RED} x={540} y={330} rot={-6} size={110} />
    </AbsoluteFill>
  );
};

const Theory: React.FC<{ t: number; f: number; fps: number; pop: number }> = ({ t, f, fps, pop }) => {
  const s1 = sp(f, fps, T("th1") - 0.08, 12, 190), s2 = sp(f, fps, T("th2") - 0.08, 12, 190), s3 = sp(f, fps, T("th3") - 0.08, 12, 190);
  const wipe = after(t, "wipers") ? Math.abs(Math.sin((t - T("wipers")) * 6)) : 0;
  return (
    <AbsoluteFill style={{ background: "#b98a55" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 120 }, (_, i) => <circle key={i} cx={(i * 211) % 1080} cy={(i * 157) % 1920} r={3 + (i % 3)} fill="#8f6538" opacity={0.6} />)}
        <path d="M 330 420 L 760 900 L 330 1380" stroke={RED} strokeWidth={6} fill="none" opacity={Math.min(s2, 1)} />
        <text x={540} y={210} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={84} fill="#fff" stroke={INK} strokeWidth={4} opacity={pop}>THEORIES</text>
        <Polaroid x={330} y={480} rot={-5} s={s1} who={PRIYA} hair="long" label="Priya: wedding gift">
          <SuvSide t={t} bow={1} />
        </Polaroid>
        <Polaroid x={740} y={930} rot={4} s={s2} who={ARJUN} hair="short" label="Arjun: spy">
          <SuvSide t={t} shades={1} />
        </Polaroid>
        <Polaroid x={340} y={1360} rot={-3} s={s3} who={SHARMA} hair="white" tache label="Sharma ji: haunted">
          <SuvSide t={t} ghost={1} wipe={wipe} />
        </Polaroid>
      </svg>
    </AbsoluteFill>
  );
};

const Blocked: React.FC<{ t: number; f: number; fps: number }> = ({ t, f, fps }) => {
  const rew = after(t, "replay");
  // phase 1: SUV reverses out of slot 9 into the lane (Rohan's spot is empty: service)
  const outK = rew ? 0 : cl(t, [T("out") - 0.1, T("out") + 1.0], [0, 1]);
  const suvY = SLOT_Y + 40 + outK * 560, suvYaw = outK * 28;
  // phase 2 (rewind): Rohan's white car slides in behind it
  const inK = rew ? cl(t, [T("replay") + 0.1, T("replay") + 0.9], [0, 1]) : 0;
  const rohanX = -300 + inK * (ROW_X[2] + 300);
  const sEvery = sp(f, fps, T("every") - 0.05, 9, 260), sYear = sp(f, fps, T("year") - 0.05, 9, 260);
  const sFirst = rew ? 0 : sp(f, fps, T("first") - 0.05, 9, 260);
  const tint = rew ? 0.25 + 0.08 * Math.sin(t * 20) : 0;
  return (
    <AbsoluteFill>
      <Lot>
        <g transform={`translate(${ROW_X[0]} ${SLOT_Y}) rotate(0)`}><CarTop col="#c8423a" /></g>
        <g transform={`translate(${ROW_X[1]} ${SLOT_Y})`}><CarTop col="#3d6db5" /></g>
        <g transform={`translate(${ROW_X[3]} ${SLOT_Y})`}><CarTop col="#b9bec6" /></g>
        <g transform={`translate(${ROW_X[2] + outK * 60} ${suvY}) rotate(${suvYaw})`}><CarTop col={SUVC} w={220} h={400} /></g>
        {!rew ? (
          <g transform={`translate(${ROW_X[2]} 1150)`}><CarTop col="none" dashed label="SERVICE" w={330} h={170} /></g>
        ) : (
          <g transform={`translate(${rohanX} 1130) rotate(90)`}><CarTop col="#f2efe8" w={210} h={380} /></g>
        )}
        {rew ? <rect width={1080} height={1920} fill={`rgba(40,60,120,${tint})`} /> : null}
      </Lot>
      {rew ? <div style={{ position: "absolute", left: 60, top: 120, fontFamily: UI, fontWeight: 800, fontSize: 70, color: "#fff", background: INK, padding: "8px 30px", borderRadius: 18 }}>◀◀ REWIND</div> : null}
      <Stamp text="FIRST TIME EVER" s={sFirst} bg={GREEN} x={540} y={1400} rot={-5} size={96} />
      <Stamp text="EVERY NIGHT" s={sEvery} bg={RED} x={540} y={940} rot={-6} size={110} />
      <Stamp text="FOR A YEAR" s={sYear} bg={YELLOW} fg={INK} x={600} y={1360} rot={5} size={96} />
    </AbsoluteFill>
  );
};

const Iyer: React.FC<{ t: number; u: number; f: number; fps: number; pop: number }> = ({ t, u, f, fps, pop }) => {
  const ride = after(t, "auto");
  const sOff = sp(f, fps, T("office") - 0.05, 9, 260);
  const autoX = ride ? cl(t, [T("auto") - 0.1, T("auto") + 0.8], [-300, 420]) : -300;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {!ride ? (
          <g>
            <rect width={1080} height={1920} fill="#f3e6c8" />
            <rect x={0} y={1300} width={1080} height={620} fill="#5c6068" />
            {/* Rohan's white car's back, blocking */}
            <g transform="translate(540 1330)">
              <path d="M -420 0 L -420 -230 Q -410 -300 -300 -300 L 300 -300 Q 410 -300 420 -230 L 420 0 Z" fill="#f2efe8" stroke={INK} strokeWidth={8} />
              <rect x={-300} y={-280} width={600} height={110} rx={20} fill="#a9d6f5" stroke={INK} strokeWidth={6} />
              <rect x={-400} y={-150} width={90} height={44} rx={10} fill={RED} stroke={INK} strokeWidth={4} /><rect x={310} y={-150} width={90} height={44} rx={10} fill={RED} stroke={INK} strokeWidth={4} />
              <rect x={-90} y={-130} width={180} height={50} rx={6} fill="#fff" stroke={INK} strokeWidth={4} />
            </g>
            <g transform={`translate(540 ${760 + (1 - pop) * 200}) scale(3.2)`}><Bust who={IYER} hair="white" specs mouth="flat" /></g>
            {/* hovering knuckle + sweat drop */}
            <g transform={`translate(${820 + Math.sin(t * 9) * 12} ${700})`}>
              <circle r={56} fill={IYER.skin} stroke={INK} strokeWidth={6} />
              <path d="M -30 -20 H 30 M -30 0 H 30 M -30 20 H 30" stroke={INK} strokeWidth={4} />
            </g>
            <path d={`M 360 ${560 + (u * 120) % 120} q -18 30 0 40 q 18 -10 0 -40 Z`} fill="#8fd0ff" stroke={INK} strokeWidth={4} />
            <g transform="translate(830 470)">
              <rect x={-150} y={-70} width={300} height={110} rx={30} fill="#fff" stroke={INK} strokeWidth={6} />
              <text x={0} y={10} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={54} fill={INK}>knock..?</text>
            </g>
          </g>
        ) : (
          <g>
            <rect width={1080} height={1920} fill="#cfe3f2" />
            <rect x={80} y={380} width={920} height={900} fill="#d9e1ea" stroke={INK} strokeWidth={7} />
            {Array.from({ length: 24 }, (_, i) => <rect key={i} x={130 + (i % 6) * 145} y={440 + Math.floor(i / 6) * 180} width={100} height={120} fill="#8fc2e8" stroke={INK} strokeWidth={4} />)}
            <rect x={200} y={300} width={680} height={110} rx={14} fill="#1f3b6b" stroke={INK} strokeWidth={6} />
            <text x={540} y={376} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={56} fill="#fff">PRESTIGE TECH PARK</text>
            <rect x={0} y={1280} width={1080} height={640} fill="#5c6068" />
            {/* Rohan's white car parked at the office, side view */}
            <g transform="translate(820 1290) scale(0.8)">
              <path d="M -230 0 L -230 -70 Q -226 -100 -190 -104 L -120 -108 L -60 -180 Q -48 -192 -26 -192 L 110 -192 Q 136 -192 152 -176 L 210 -110 L 240 -104 Q 262 -98 262 -70 L 262 0 Z" fill="#f2efe8" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
              {[-150, 180].map((x) => <circle key={x} cx={x} cy={0} r={46} fill="#222" stroke={INK} strokeWidth={6} />)}
            </g>
            <g transform={`translate(${autoX} 1420)`}><AutoRick t={t} /></g>
          </g>
        )}
      </svg>
      {!ride ? <Stamp text="TOO POLITE" s={sp(f, fps, T("polite") - 0.05, 9, 260)} bg={YELLOW} fg={INK} x={540} y={1150} rot={-5} size={104} /> : null}
      <Stamp text="SAME OFFICE" s={sOff} bg={RED} x={540} y={200} rot={-5} size={104} />
    </AbsoluteFill>
  );
};

const SHOUTS = ["AAO AAO!", "BAS BAS!", "LEFT LEFT!", "THODA AUR!"];
const Aao: React.FC<{ t: number; u: number; f: number; fps: number }> = ({ t, u, f, fps }) => {
  const back = after(t, "back");
  const fell = cl(t, [T("scooter") - 0.05, T("scooter") + 0.35], [0, 1], Easing.in(Easing.quad));
  const turns = back ? 14 : Math.min(14, 1 + Math.floor(Math.pow(Math.max(0, u) / Math.max(0.5, T("fourteen") - (t - u)), 1.3) * 13));
  const wig = back ? 0 : Math.sin(u * 7);
  const suvY = SLOT_Y + 40 + (back ? 0 : 160 + 140 * wig), yaw = back ? 0 : 22 * Math.sin(u * 5.3);
  const sBack = sp(f, fps, T("back") - 0.05, 9, 260);
  const uncles = [{ who: ARJUN, x: 140, y: 1500, hair: "short" as const }, { who: SHARMA, x: 400, y: 1560, hair: "white" as const, tache: true },
    { who: IYER, x: 680, y: 1520, hair: "white" as const, specs: true }, { who: ROHAN, x: 940, y: 1560, hair: "short" as const }];
  return (
    <AbsoluteFill>
      <Lot>
        <g transform={`translate(${ROW_X[0]} ${SLOT_Y})`}><CarTop col="#c8423a" /></g>
        <g transform={`translate(${ROW_X[1]} ${SLOT_Y})`}><CarTop col="#3d6db5" /></g>
        {/* the scooter in slot 10, falls over */}
        <g transform={`translate(${ROW_X[3]} ${SLOT_Y}) rotate(${fell * 80})`}>
          <rect x={-40} y={-150} width={80} height={300} rx={40} fill="#e9a23a" stroke={INK} strokeWidth={6} />
          <rect x={-90} y={-150} width={180} height={22} rx={11} fill="#333" stroke={INK} strokeWidth={4} />
        </g>
        <g transform={`translate(${ROW_X[2] + (back ? 0 : 50 * wig)} ${suvY}) rotate(${yaw})`}><CarTop col={SUVC} w={220} h={400} /></g>
        {uncles.map((x, i) => (
          <g key={i}>
            <g transform={`translate(${x.x} ${x.y}) scale(1.05) rotate(${Math.sin(t * 11 + i) * 6})`}><Bust who={x.who} hair={x.hair} tache={x.tache} specs={x.specs} mouth="o" /></g>
            {Math.sin(t * 6 + i * 1.6) > -0.3 ? (
              <g transform={`translate(${x.x} ${x.y - 150 - (i % 2) * 110})`}>
                <rect x={-128} y={-46} width={256} height={80} rx={22} fill="#fff" stroke={INK} strokeWidth={5} />
                <text x={0} y={12} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={36} fill={INK}>{SHOUTS[i]}</text>
              </g>
            ) : null}
          </g>
        ))}
      </Lot>
      <div style={{ position: "absolute", left: 50, top: 110, fontFamily: UI, fontWeight: 800, fontSize: 64, color: INK, background: YELLOW, border: `7px solid ${INK}`, borderRadius: 22,
        padding: "6px 30px", boxShadow: `9px 9px 0 ${INK}` }}>TURN {turns}</div>
      <Stamp text="BACK IN SLOT 9" s={sBack} bg={RED} x={540} y={1080} rot={-5} size={100} />
    </AbsoluteFill>
  );
};

const Pin: React.FC<{ t: number; u: number; f: number; fps: number; pop: number }> = ({ t, u, f, fps, pop }) => {
  const sPin = sp(f, fps, (t - u) + 0.05, 10, 170);
  const fl = after(t, "pigeons") ? 1 : 0.15;
  const sHeart = sp(f, fps, T("pigeons") - 0.05, 10, 200);
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <Wall />
        <g transform="translate(560 1330) scale(1.2)">
          <SuvSide t={t} dust={0.9} wash={1} pigeons={1} flap={fl} />
        </g>
        {sHeart > 0.01 ? [-160, 0, 140].map((x, i) => (
          <path key={i} transform={`translate(${420 + x} ${860 - sHeart * 120 - i * 30 + Math.sin(t * 4 + i) * 10}) scale(${sHeart * 1.4})`} d="M 0 12 C -40 -14 -24 -44 0 -24 C 24 -44 40 -14 0 12 Z" fill={RED} stroke={INK} strokeWidth={4} />
        )) : null}
        {/* the map pin */}
        <g transform={`translate(560 ${560 - (1 - sPin) * 300}) scale(${0.4 + 0.6 * sPin})`} opacity={Math.min(1, sPin * 1.5)}>
          <path d="M 0 140 C -40 70 -110 20 -110 -60 A 110 110 0 1 1 110 -60 C 110 20 40 70 0 140 Z" fill={GREEN} stroke={INK} strokeWidth={8} />
          <circle cx={0} cy={-60} r={44} fill="#fff" stroke={INK} strokeWidth={6} />
        </g>
      </svg>
      <div style={{ position: "absolute", left: 140, right: 140, top: 140, transform: `scale(${pop}) rotate(-2deg)`, background: "#fff", border: `7px solid ${INK}`, borderRadius: 30,
        padding: "20px 30px", fontFamily: UI, color: INK, boxShadow: `10px 10px 0 ${INK}`, textAlign: "center" }}>
        <div style={{ fontSize: 36, fontWeight: 700, opacity: 0.7 }}>Pickup point</div>
        <div style={{ fontSize: 92, fontWeight: 800, letterSpacing: -2 }}>The SUV</div>
      </div>
    </AbsoluteFill>
  );
};

export const SuvOverlay: React.FC<{ t0: number; t1: number; mode: SuvMode }> = ({ t0, t1, mode }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps, u = t - t0;
  const pop = sp(f, fps, t0, 14, 170);
  const out = cl(t, [t1 - 0.1, t1], [1, 0]);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      {mode === "suv" ? <Suv t={t} u={u} f={f} fps={fps} /> : mode === "theory" ? <Theory t={t} f={f} fps={fps} pop={pop} /> : mode === "blocked" ? <Blocked t={t} f={f} fps={fps} />
        : mode === "iyer" ? <Iyer t={t} u={u} f={f} fps={fps} pop={pop} /> : mode === "aao" ? <Aao t={t} u={u} f={f} fps={fps} /> : <Pin t={t} u={u} f={f} fps={fps} pop={pop} />}
    </AbsoluteFill>
  );
};
