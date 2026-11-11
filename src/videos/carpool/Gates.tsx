// "Two gates" overlay (2026-11-11): a top-down cartoon map of the colony with a FRONT gate (bottom, guard booth, road to
// the tech park) and a BACK gate (top). Arjun's blue car waits at one, Kabir at the other. Full-screen 2D overlay driven
// by story.json `gates` texts and cues:
//   both  - "I'm literally at the gate" bubbles over both of them
//   two   - the cloud hiding the middle of the colony blows away, gate signs flip from "THE GATE" to FRONT / BACK,
//           a "2 GATES" stamp lands
//   apart - a dimension line between the gates
//   swap  - each walks/drives to the other gate along a different side path, they cross, "where r u??"
//   pin   - both head for the chai stall in the middle, a PICKUP POINT pin drops on it
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CUE, STORY, hasCue } from "./story";

const UI = "Manrope, 'Helvetica Neue', Arial, sans-serif";
const INK = "#141414", YELLOW = "#f6cf4a", RED = "#d8362b";
const cl = (t: number, a: number[], b: number[], e = Easing.inOut(Easing.cubic)) => interpolate(t, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
type P = [number, number];
const G = (STORY as unknown as { gates?: Record<string, string> }).gates ?? {};
const tx = (k: string, d: string) => G[k] ?? d;

// map layout (1080 x 1920 px)
const WALL = { x0: 110, x1: 970, y0: 470, y1: 1640 };
const BACK: P = [540, 470], FRONT: P = [540, 1640], STALL: P = [655, 1060];
const A_FRONT: P = [540, 1735], K_BACK: P = [540, 395]; // waiting spots, just outside each gate
const A_BACK: P = [540, 385], K_FRONT: P = [470, 1730];
const LEFT_PATH: P[] = [A_FRONT, [540, 1790], [60, 1790], [60, 330], [540, 330], A_BACK]; // the car goes round the outside, left
const RIGHT_PATH: P[] = [K_BACK, [800, 395], [800, 1700], [470, 1700], K_FRONT];       // Kabir walks inside, down the right
const along = (pts: P[], u: number): { p: P; ang: number } => {
  const seg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  const tot = seg.reduce((a, b) => a + b, 0);
  let d = Math.max(0, Math.min(1, u)) * tot;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) {
      const k = seg[i] ? Math.min(1, d / seg[i]) : 1, a = pts[i], b = pts[i + 1];
      return { p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
    }
    d -= seg[i];
  }
  return { p: pts[pts.length - 1], ang: 0 };
};

const House: React.FC<{ x: number; y: number; c: string; flip?: boolean }> = ({ x, y, c, flip }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-70} y={-55} width={140} height={110} rx={10} fill={c} stroke={INK} strokeWidth={6} />
    <path d={`M -80 ${flip ? 0 : 0} L 0 -70 L 80 0 Z`} fill="#b5523b" stroke={INK} strokeWidth={6} strokeLinejoin="round" transform="translate(0 -5) scale(1 0.8)" />
    <rect x={-14} y={10} width={28} height={45} fill="#6b4a2f" stroke={INK} strokeWidth={4} />
  </g>
);
const Tree: React.FC<{ x: number; y: number; r?: number }> = ({ x, y, r = 34 }) => (
  <g><circle cx={x} cy={y} r={r} fill="#3e8f3a" stroke={INK} strokeWidth={5} /><circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.35} fill="#5fb04f" /></g>
);
/** top-down blue car (Arjun), nose along +x before rotation */
const Car: React.FC<{ p: P; ang: number; bob: number }> = ({ p, ang, bob }) => (
  <g transform={`translate(${p[0]} ${p[1] + bob}) rotate(${(ang * 180) / Math.PI})`}>
    <rect x={-78} y={-44} width={156} height={88} rx={28} fill="#3d6db5" stroke={INK} strokeWidth={7} />
    <rect x={8} y={-34} width={36} height={68} rx={10} fill="#bfe3ff" stroke={INK} strokeWidth={5} />
    <rect x={-52} y={-32} width={26} height={64} rx={8} fill="#bfe3ff" stroke={INK} strokeWidth={5} />
    <circle cx={70} cy={-28} r={7} fill={YELLOW} /><circle cx={70} cy={28} r={7} fill={YELLOW} />
  </g>
);
/** Kabir from above-ish: a round head on an orange body, a little walk wobble */
const Person: React.FC<{ p: P; walk: number }> = ({ p, walk }) => (
  <g transform={`translate(${p[0]} ${p[1]}) rotate(${Math.sin(walk) * 8})`}>
    <ellipse cx={0} cy={18} rx={36} ry={30} fill="#e58a2f" stroke={INK} strokeWidth={6} />
    <circle cx={0} cy={-22} r={30} fill="#b9845a" stroke={INK} strokeWidth={6} />
    <path d="M -28 -30 Q 0 -62 28 -30 Q 10 -42 -28 -30 Z" fill="#1f1712" />
    <circle cx={-10} cy={-20} r={4} fill={INK} /><circle cx={10} cy={-20} r={4} fill={INK} />
  </g>
);
const Tag: React.FC<{ p: P; text: string; dy: number; c: string }> = ({ p, text, dy, c }) => (
  <g transform={`translate(${p[0]} ${p[1] + dy})`}>
    <rect x={-text.length * 15 - 20} y={-30} width={text.length * 30 + 40} height={60} rx={14} fill={c} stroke={INK} strokeWidth={5} />
    <text x={0} y={12} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={40} fill="#fff">{text}</text>
  </g>
);
const Bubble: React.FC<{ p: P; text: string; s: number; up?: boolean; dx?: number }> = ({ p, text, s, up = true, dx = 0 }) => {
  if (s <= 0.01) return null;
  const w = Math.max(170, text.length * 27 + 64), h = 96, y = up ? -150 : 150;
  return (
    <g transform={`translate(${p[0] + dx} ${p[1] + y}) scale(${s})`}>
      <path d={`M ${-w / 2} ${-h / 2} H ${w / 2} V ${h / 2} H ${-dx + 24} L ${-dx} ${h / 2 + 34} L ${-dx - 18} ${h / 2} H ${-w / 2} Z`}
        transform={up ? undefined : `scale(1 -1)`} fill="#fff" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <text x={0} y={13} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={46} fill={INK}>{text}</text>
    </g>
  );
};
const GateSign: React.FC<{ p: P; text: string; flip: number; below?: boolean }> = ({ p, text, flip, below }) => (
  <g transform={`translate(${p[0]} ${p[1] + (below ? 70 : -70)}) scale(1 ${Math.abs(Math.cos(flip * Math.PI)) || 0.02})`}>
    <rect x={-150} y={-34} width={300} height={68} rx={12} fill={YELLOW} stroke={INK} strokeWidth={6} />
    <text x={0} y={13} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={38} fill={INK}>{text}</text>
  </g>
);

export const GatesOverlay: React.FC<{ t0: number; t1: number }> = ({ t0, t1 }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  const inA = cl(t, [t0, t0 + 0.18], [0, 1]), out = cl(t, [t1 - 0.15, t1], [1, 0]);
  const T = (k: string) => (hasCue(k) ? CUE[k] : 1e6);
  const tTwo = T("two"), tSwap = T("swap"), tPin = T("pin"), tBoth = T("both"), tApart = T("apart");
  const reveal = cl(t, [tTwo - 0.08, tTwo + 0.45], [0, 1]);
  const flip = cl(t, [tTwo - 0.05, tTwo + 0.3], [0, 1]);
  // positions
  const swapU = cl(t, [tSwap - 0.1, tSwap + 2.2], [0, 1]), pinU = cl(t, [tPin - 0.35, tPin + 0.9], [0, 1]);
  const car = along(LEFT_PATH, swapU), kab = along(RIGHT_PATH, swapU);
  const lerpP = (a: P, b: P, k: number): P => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const aPos: P = pinU > 0 ? lerpP(A_BACK, [STALL[0] - 150, STALL[1]], pinU) : car.p;
  const aAng = pinU > 0 ? Math.PI / 2 : swapU > 0 && swapU < 1 ? car.ang : -Math.PI / 2;
  const kPos: P = pinU > 0 ? lerpP(K_FRONT, [STALL[0] + 20, STALL[1] + 120], pinU) : kab.p;
  const walking = (swapU > 0 && swapU < 1) || (pinU > 0 && pinU < 1);
  // bubbles
  const pop = (ta: number) => spring({ frame: f - Math.round(ta * fps), fps, config: { damping: 11, stiffness: 220 } });
  const sBoth = t > tBoth - 0.1 && t < tSwap - 0.3 ? pop(tBoth - 0.1) : 0;
  const lost = t > tSwap + 2.0 && t < tPin - 0.4 ? pop(tSwap + 2.0) : 0;
  const waiting = sBoth <= 0.01 && lost <= 0.01 && !walking && t < tPin - 0.4;
  const dots = ".".repeat(1 + (Math.floor(t * 3) % 3));
  const stamp = t > tTwo - 0.05 && t < tTwo + 1.8 ? pop(tTwo - 0.05) : 0;
  const pin = t > tPin - 0.05 ? spring({ frame: f - Math.round((tPin - 0.05) * fps), fps, config: { damping: 9, stiffness: 200 } }) : 0;
  const dim = cl(t, [tApart - 0.1, tApart + 0.3], [0, 1]) * (t < tSwap - 0.3 ? 1 : 0);
  const zoom = 1 + 0.06 * (1 - reveal) + 0.04 * Math.sin(t * 0.7) * 0.2;
  const houses: [number, number, string][] = [[300, 640, "#f3d9a4"], [300, 860, "#cfe0f0"], [300, 1240, "#f2c7c7"], [300, 1460, "#d7ecc6"],
    [790, 640, "#e8d3f2"], [790, 860, "#f3e3b5"], [790, 1240, "#cde9e6"], [790, 1460, "#f3d0b4"]];
  return (
    <AbsoluteFill style={{ opacity: inA * out, background: "#8fc66b" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ transform: `scale(${zoom})`, transformOrigin: "50% 55%" }}>
        {/* outside road ring + road to the tech park */}
        <path d="M 60 330 H 1020 M 60 1790 H 1020 M 60 330 V 1790" stroke="#a7acb2" strokeWidth={70} fill="none" strokeLinecap="round" />
        <path d="M 540 1790 V 1960" stroke="#a7acb2" strokeWidth={110} />
        <path d="M 540 1810 V 1960" stroke="#fff" strokeWidth={8} strokeDasharray="30 26" />
        {/* colony wall with two gaps (the gates) */}
        <path d={`M ${BACK[0] - 80} ${WALL.y0} H ${WALL.x0} V ${WALL.y1} H ${FRONT[0] - 80} M ${FRONT[0] + 80} ${WALL.y1} H ${WALL.x1} V ${WALL.y0} H ${BACK[0] + 80}`}
          stroke="#8a5a3c" strokeWidth={18} fill="none" strokeLinejoin="round" />
        {[BACK, FRONT].map(([x, y], i) => (
          <g key={i}>
            <rect x={x - 100} y={y - 22} width={30} height={44} fill="#c9b79c" stroke={INK} strokeWidth={5} />
            <rect x={x + 70} y={y - 22} width={30} height={44} fill="#c9b79c" stroke={INK} strokeWidth={5} />
          </g>
        ))}
        {/* the colony lane joining the gates, and Kabir's side path */}
        <path d={`M ${BACK[0]} ${WALL.y0} V ${WALL.y1}`} stroke="#b9bdc2" strokeWidth={120} />
        <path d={`M ${BACK[0]} ${WALL.y0 + 20} V ${WALL.y1 - 20}`} stroke="#fff" strokeWidth={7} strokeDasharray="28 24" />
        <path d="M 800 470 V 1700" stroke="#e6d3a8" strokeWidth={26} strokeLinecap="round" />
        {houses.map(([x, y, c], i) => <House key={i} x={x} y={y} c={c} />)}
        {[[180, 540], [930, 1060], [180, 1060], [930, 560], [180, 1580], [930, 1570]].map(([x, y], i) => <Tree key={i} x={x} y={y} />)}
        {/* chai stall in the middle */}
        <g transform={`translate(${STALL[0]} ${STALL[1]})`}>
          <rect x={-60} y={-40} width={120} height={80} rx={10} fill="#c8423a" stroke={INK} strokeWidth={6} />
          <path d="M -70 -40 h 140 l -10 -26 h -120 z" fill="#fff" stroke={INK} strokeWidth={5} />
          <text x={0} y={14} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={34} fill="#fff">{tx("stall", "CHAI")}</text>
        </g>
        {/* guard booth by the front gate */}
        <g transform={`translate(${FRONT[0] + 175} ${FRONT[1] + 60})`}>
          <rect x={-40} y={-40} width={80} height={80} rx={8} fill="#e9e1cf" stroke={INK} strokeWidth={6} />
          <circle cx={0} cy={0} r={22} fill="#5a6b8c" stroke={INK} strokeWidth={5} />
        </g>
        {/* dimension line: two hundred metres */}
        {dim > 0.01 ? (
          <g opacity={dim}>
            <path d={`M 960 ${BACK[1]} V ${FRONT[1]}`} stroke={RED} strokeWidth={9} strokeDasharray="22 16" />
            <path d={`M 935 ${BACK[1] + 30} L 960 ${BACK[1]} L 985 ${BACK[1] + 30} M 935 ${FRONT[1] - 30} L 960 ${FRONT[1]} L 985 ${FRONT[1] - 30}`} stroke={RED} strokeWidth={9} fill="none" />
            <g transform={`translate(960 ${(BACK[1] + FRONT[1]) / 2}) rotate(-90)`}>
              <rect x={-120} y={-36} width={240} height={72} rx={14} fill={RED} stroke={INK} strokeWidth={5} />
              <text x={0} y={13} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={40} fill="#fff">200 m</text>
            </g>
          </g>
        ) : null}
        {/* the cloud that hides how the colony connects, until "two gates" */}
        {reveal < 1 ? (
          <g opacity={1 - reveal} transform={`translate(${reveal * 900} 0)`}>
            <rect x={0} y={560} width={1080} height={990} fill="#eef3f7" />
            {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={90 + i * 180} cy={565} r={95} fill="#eef3f7" />)}
            {[0, 1, 2, 3, 4, 5].map((i) => <circle key={"b" + i} cx={90 + i * 180} cy={1545} r={95} fill="#eef3f7" />)}
            <text x={540} y={1090} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={220} fill="#c7d2dc">?</text>
          </g>
        ) : null}
        {/* pickup pin on the chai stall */}
        {pin > 0.01 ? (
          <g transform={`translate(${STALL[0]} ${STALL[1] - 70 - (1 - pin) * 200}) scale(${pin})`}>
            <path d="M 0 0 C -60 -70 -60 -150 0 -150 C 60 -150 60 -70 0 0 Z" fill={RED} stroke={INK} strokeWidth={6} />
            <circle cx={0} cy={-100} r={20} fill="#fff" />
            <g transform="translate(0 -205)">
              <rect x={-170} y={-36} width={340} height={72} rx={16} fill={YELLOW} stroke={INK} strokeWidth={6} />
              <text x={0} y={13} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={38} fill={INK}>{tx("pin", "PICKUP POINT")}</text>
            </g>
          </g>
        ) : null}
        {/* the two of them */}
        <Car p={aPos} ang={aAng} bob={walking ? Math.sin(t * 30) * 2 : 0} />
        <Person p={kPos} walk={walking ? t * 14 : 0} />
        <Tag p={aPos} text={tx("a", "ARJUN")} dy={aPos[1] > 1300 ? 105 : 95} c="#3d6db5" />
        <Tag p={kPos} text={tx("k", "KABIR")} dy={kPos[1] < 600 ? -95 : 85} c="#e58a2f" />
        {/* gate signs: "THE GATE" twice, until they flip to FRONT / BACK */}
        <GateSign p={[BACK[0] + 250, BACK[1] + 70]} text={flip < 0.5 ? "THE GATE" : tx("back", "BACK GATE")} flip={flip} />
        <GateSign p={[FRONT[0] - 250, FRONT[1] - 70]} text={flip < 0.5 ? "THE GATE" : tx("front", "FRONT GATE")} flip={flip} below />
        {/* speech */}
        <Bubble p={aPos} text={waiting ? dots : lost > 0 ? tx("lost", "where r u??") : tx("bubble", "I'm at the gate")} s={waiting ? 1 : Math.max(sBoth, lost)} up={aPos[1] > 1000} />
        <Bubble p={kPos} text={waiting ? dots : lost > 0 ? tx("lost", "where r u??") : tx("bubble", "I'm at the gate")} s={waiting ? 1 : Math.max(sBoth, lost)} up={kPos[1] > 1000} />
      </svg>
      {stamp > 0.01 ? (
        <div style={{ position: "absolute", left: 540, top: 960, transform: `translate(-50%,-50%) rotate(-8deg) scale(${2.2 - 1.2 * stamp})`, opacity: Math.min(1, stamp * 1.6),
          fontFamily: UI, fontWeight: 800, fontSize: 150, letterSpacing: -4, color: "#fff", background: RED, border: `10px solid ${INK}`, borderRadius: 30, padding: "4px 50px 12px", boxShadow: `14px 14px 0 ${INK}`, whiteSpace: "nowrap" }}>
          2 GATES
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
