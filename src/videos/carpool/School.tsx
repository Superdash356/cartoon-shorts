// "School-run swap" overlays (2026-11-15): top-down cartoon maps of the school run. Full-screen 2D overlays driven by
// story.json `school` texts and cues. One component, four modes (= four shot ids):
//   school - the school road: brick school with a bell-tower clock at the top, four cars (one kid each) creeping up the
//            road bumper to bumper, a digital time card counting down (school.times [[line, word, "7:54"]]).
//            cue honk: Sharma ji's car honks in rhythm ("HONK ♪" bubbles); cue bell: the tower rings, LATE stamp
//   mixup  - four rows "parent's car -> somebody else's kid" popping in at school.mixupAt [[line, word]]; cue wrong: stamps
//   swap   - the colony gate at dawn: four parked cars, parents facing forward, kids hopping between back seats on dotted
//            arcs; cue secret: SECRET SWAP stamp; cue hop: one kid takes a big hop into the blue car ("HOP IN")
//   early  - one blue car with all four kids at the school door before the bell; cue early: EARLY stamp; cue seats: the
//            kids hop seats inside the car (callback)
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CUE, STORY, WL, hasCue } from "./story";

const UI = "Manrope, 'Helvetica Neue', Arial, sans-serif";
const INK = "#141414", YELLOW = "#f6cf4a", RED = "#d8362b", GREEN = "#2f9e4f";
const COL = ["#f2efe8", "#c8423a", "#3d6db5", "#b9bec6"]; // Rohan, Priya, Arjun, Sharma ji
const KID = ["#f08a3c", "#7a5bd6", "#2fb3a8", "#e2557a"]; // school-bag / jumper colours of the four kids
const SKIN = ["#c99a6e", "#b9845a", "#d2a678", "#a8744c"];
const cl = (t: number, a: number[], b: number[], e = Easing.inOut(Easing.cubic)) => interpolate(t, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
type P = [number, number];
type SchoolCfg = { name?: string; times?: [number, number, string][]; cars?: string[]; honk?: string; late?: string; early?: string;
  mixup?: [string, string][]; mixupAt?: [number, number][]; wrong?: string; secret?: string; seats?: string; hop?: string; gate?: string };
const SC = ((STORY as unknown as { school?: SchoolCfg }).school ?? {}) as SchoolCfg;
const NAMES = SC.cars ?? ["ROHAN", "PRIYA", "ARJUN", "SHARMA JI"];
const TIMES = (SC.times ?? []).map(([L, k, s]) => ({ t: WL(L, k) - 0.1, s }));
const timeAt = (t: number) => { let s = TIMES[0]?.s ?? "7:50"; for (const x of TIMES) if (t >= x.t) s = x.s; return s; };
const T = (k: string) => (hasCue(k) ? CUE[k] : 1e6);

/** a kid from above: round head, hair, a coloured school bag on the back */
const KidTop: React.FC<{ p: P; k: number; s?: number }> = ({ p, k, s = 1 }) => (
  <g transform={`translate(${p[0]} ${p[1]}) scale(${s})`}>
    <rect x={-17} y={8} width={34} height={24} rx={8} fill={KID[k]} stroke={INK} strokeWidth={4} />
    <circle cx={0} cy={-4} r={19} fill={SKIN[k]} stroke={INK} strokeWidth={4} />
    <path d="M -18 -8 Q 0 -32 18 -8 Q 2 -18 -18 -8 Z" fill="#1f1712" />
  </g>
);
/** a grown-up's head from above (in the driver's seat) */
const AdultTop: React.FC<{ p: P; k: number }> = ({ p, k }) => (
  <g transform={`translate(${p[0]} ${p[1]})`}>
    <circle cx={0} cy={0} r={22} fill={SKIN[(k + 1) % 4]} stroke={INK} strokeWidth={4} />
    <path d={k === 3 ? "M -21 -4 Q 0 -30 21 -4 Q 0 -14 -21 -4 Z" : "M -21 2 Q 0 -34 21 2 Q 4 -18 -21 2 Z"} fill={k === 3 ? "#8a8f98" : "#1f1712"} />
  </g>
);
/** top-down car, nose up (-y), glass roof so the heads show; kids = list of [kid index, seat 0..3] */
const CarTop: React.FC<{ p: P; c: number; kids: [number, number, P?][]; driver?: boolean; rot?: number; shake?: number }> = ({ p, c, kids, driver = true, rot = 0, shake = 0 }) => {
  const seat: P[] = [[-30, 20], [30, 20], [-30, 70], [30, 70]];
  return (
    <g transform={`translate(${p[0] + shake} ${p[1]}) rotate(${rot})`}>
      <rect x={-74} y={-110} width={148} height={230} rx={44} fill={COL[c]} stroke={INK} strokeWidth={7} />
      <rect x={-58} y={-72} width={116} height={170} rx={26} fill="#cfe9fb" stroke={INK} strokeWidth={5} />
      <rect x={-56} y={-104} width={112} height={26} rx={10} fill={COL[c]} opacity={0.6} />
      <circle cx={-48} cy={-100} r={8} fill={YELLOW} stroke={INK} strokeWidth={3} /><circle cx={48} cy={-100} r={8} fill={YELLOW} stroke={INK} strokeWidth={3} />
      {driver ? <AdultTop p={[-28, -36]} k={c} /> : null}
      {kids.map(([k, s, o], i) => <KidTop key={i} p={o ?? [seat[s][0], seat[s][1] - 20]} k={k} s={0.95} />)}
    </g>
  );
};
const Tag: React.FC<{ p: P; text: string; c: string; fg?: string; size?: number }> = ({ p, text, c, fg = "#fff", size = 40 }) => {
  const w = text.length * size * 0.72 + 44;
  return (
    <g transform={`translate(${p[0]} ${p[1]})`}>
      <rect x={-w / 2} y={-size * 0.78} width={w} height={size * 1.56} rx={14} fill={c} stroke={INK} strokeWidth={5} />
      <text x={0} y={size * 0.34} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={size} fill={fg}>{text}</text>
    </g>
  );
};
const Bubble: React.FC<{ p: P; text: string; s: number; rot?: number }> = ({ p, text, s, rot = 0 }) => {
  if (s <= 0.01) return null;
  const w = text.length * 30 + 70, h = 96;
  return (
    <g transform={`translate(${p[0]} ${p[1]}) rotate(${rot}) scale(${s})`}>
      <path d={`M ${-w / 2} ${-h / 2} H ${w / 2} V ${h / 2} H 10 L -24 ${h / 2 + 40} L -20 ${h / 2} H ${-w / 2} Z`} fill="#fff" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <text x={0} y={15} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={48} fill={INK}>{text}</text>
    </g>
  );
};
const Stamp: React.FC<{ text: string; s: number; bg: string; x?: number; y?: number; rot?: number; size?: number }> = ({ text, s, bg, x = 540, y = 960, rot = -8, size = 150 }) =>
  s > 0.01 ? (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${2.2 - 1.2 * s})`, opacity: Math.min(1, s * 1.6),
      fontFamily: UI, fontWeight: 800, fontSize: size, letterSpacing: -4, color: "#fff", background: bg, border: `10px solid ${INK}`, borderRadius: 30,
      padding: "4px 50px 12px", boxShadow: `14px 14px 0 ${INK}`, whiteSpace: "nowrap" }}>{text}</div>
  ) : null;
/** quadratic hop between two points; u 0..1 */
const hop = (a: P, b: P, u: number, hgt = 120): P => {
  const x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u - Math.sin(Math.PI * u) * hgt;
  return [x, y];
};

// ---------------- the school (top of the map) ----------------
const School: React.FC<{ t: number; ring: number; time: string }> = ({ t, ring, time }) => {
  const [hh, mm] = time.split(":").map(Number), ang = ((mm || 0) / 60) * 360, angH = (((hh % 12) + (mm || 0) / 60) / 12) * 360;
  const wob = ring > 0 ? Math.sin(t * 40) * 6 * ring : 0;
  return (
    <g>
      <rect x={120} y={210} width={840} height={330} rx={18} fill="#c9634a" stroke={INK} strokeWidth={8} />
      <rect x={120} y={210} width={840} height={40} fill="#9e4a35" stroke={INK} strokeWidth={8} />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={170 + i * 130} y={290} width={70} height={70} rx={8} fill="#cfe9fb" stroke={INK} strokeWidth={5} />)}
      <rect x={470} y={410} width={140} height={130} fill="#6b4a2f" stroke={INK} strokeWidth={6} />
      <g transform={`translate(540 470)`}>
        <rect x={-300} y={-36} width={600} height={70} rx={14} fill={YELLOW} stroke={INK} strokeWidth={6} />
        <text x={0} y={14} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={42} fill={INK}>{SC.name ?? "SCHOOL"}</text>
      </g>
      {/* bell tower with the clock */}
      <g transform={`rotate(${wob} 540 210)`}>
        <rect x={455} y={40} width={170} height={190} rx={10} fill="#e2d3b4" stroke={INK} strokeWidth={7} />
        <path d="M 440 50 L 540 -10 L 640 50 Z" fill="#9e4a35" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <circle cx={540} cy={135} r={62} fill="#fff" stroke={INK} strokeWidth={7} />
        {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={540 + 50 * Math.sin((i * Math.PI) / 6)} cy={135 - 50 * Math.cos((i * Math.PI) / 6)} r={4} fill={INK} />)}
        <path d={`M 540 135 L ${540 + 30 * Math.sin((angH * Math.PI) / 180)} ${135 - 30 * Math.cos((angH * Math.PI) / 180)}`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <path d={`M 540 135 L ${540 + 48 * Math.sin((ang * Math.PI) / 180)} ${135 - 48 * Math.cos((ang * Math.PI) / 180)}`} stroke={RED} strokeWidth={6} strokeLinecap="round" />
      </g>
      {ring > 0 ? [0, 1, 2].map((i) => {
        const r = 90 + i * 34 + ((t * 160) % 34);
        return <g key={i} opacity={ring * (1 - i * 0.28)}>
          <path d={`M ${540 - r} ${135 - r * 0.5} Q ${540 - r - 20} 135 ${540 - r} ${135 + r * 0.5}`} stroke={RED} strokeWidth={9} fill="none" strokeLinecap="round" />
          <path d={`M ${540 + r} ${135 - r * 0.5} Q ${540 + r + 20} 135 ${540 + r} ${135 + r * 0.5}`} stroke={RED} strokeWidth={9} fill="none" strokeLinecap="round" />
        </g>;
      }) : null}
      {/* gate posts */}
      <rect x={340} y={560} width={36} height={60} fill="#c9b79c" stroke={INK} strokeWidth={5} />
      <rect x={704} y={560} width={36} height={60} fill="#c9b79c" stroke={INK} strokeWidth={5} />
    </g>
  );
};
const TimeCard: React.FC<{ time: string; late: boolean; x?: number; y?: number }> = ({ time, late, x = 60, y = 640 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 250, padding: "14px 0 18px", background: late ? RED : INK, border: `8px solid ${INK}`, borderRadius: 28,
    boxShadow: `10px 10px 0 rgba(0,0,0,.35)`, textAlign: "center", fontFamily: UI, color: "#fff" }}>
    <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 2, color: YELLOW }}>BELL 8:00</div>
    <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>{time}</div>
  </div>
);
const Road: React.FC = () => (
  <g>
    <rect x={380} y={540} width={320} height={1500} fill="#a7acb2" />
    <path d="M 540 640 V 1920" stroke="#fff" strokeWidth={8} strokeDasharray="34 30" />
    <rect x={340} y={540} width={40} height={1500} fill="#d9d2c2" /><rect x={700} y={540} width={40} height={1500} fill="#d9d2c2" />
    {[700, 1000, 1300, 1600].map((y, i) => <circle key={i} cx={i % 2 ? 900 : 180} cy={y} r={46} fill="#3e8f3a" stroke={INK} strokeWidth={5} />)}
  </g>
);

export const SchoolOverlay: React.FC<{ t0: number; t1: number; mode: "school" | "mixup" | "swap" | "early" }> = ({ t0, t1, mode }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  const inA = cl(t, [t0, t0 + 0.15], [0, 1]), out = cl(t, [t1 - 0.12, t1], [1, 0]);
  const pop = (ta: number) => (t < ta ? 0 : spring({ frame: f - Math.round(ta * fps), fps, config: { damping: 11, stiffness: 220 } }));
  const zoom = 1.02 + 0.03 * cl(t, [t0, t1], [0, 1], Easing.linear);
  let body: React.ReactNode = null, extra: React.ReactNode = null;

  if (mode === "school") {
    const tBell = T("bell"), tHonk = T("honk"), ring = t > tBell - 0.05 ? cl(t, [tBell - 0.05, tBell + 0.1], [0, 1]) * cl(t, [tBell + 2.2, tBell + 2.6], [1, 0.3]) : 0;
    const time = timeAt(t), late = t > tBell - 0.1;
    // the queue creeps up in stutters, stopping bumper to bumper below the gate
    const creep = cl(t, [t0, t0 + 1.4], [1, 0], Easing.out(Easing.cubic));
    const ys = [720, 950, 1180, 1410].map((y, i) => y + creep * (260 + i * 40) + Math.max(0, Math.sin(t * 9 + i)) * 4 * creep);
    const honking = t > tHonk - 0.08 && t < tBell - 0.1, beat = ((t - tHonk) * 3.2) % 1;
    const hs = honking ? (beat < 0.55 ? spring({ frame: Math.round(beat * 30), fps, config: { damping: 9, stiffness: 300 } }) : 0) : 0;
    body = (
      <>
        <Road />
        <School t={t} ring={ring} time={time} />
        {[0, 1, 2, 3].map((i) => <CarTop key={i} p={[540, ys[i]]} c={i} kids={[[i, 2]]} shake={i === 3 && hs > 0 ? Math.sin(t * 60) * 3 : 0} />)}
        {[0, 1, 2, 3].map((i) => <Tag key={"t" + i} p={[870, ys[i] - 20]} text={NAMES[i]} c={i === 0 ? "#8a8f98" : COL[i]} size={36} />)}
        {honking ? <Bubble p={[300, ys[3] - 40]} text={SC.honk ?? "HONK ♪"} s={hs} rot={-8} /> : null}
        {honking ? [0, 1, 2].map((k) => {
          const u = ((t - tHonk) * 0.9 + k / 3) % 1;
          return <text key={k} x={640 + u * 260} y={ys[3] - 90 - u * 280} fontSize={70} fontWeight={800} fill={INK} opacity={1 - u} fontFamily={UI}>♪</text>;
        }) : null}
      </>
    );
    extra = (<><TimeCard time={time} late={late} /><Stamp text={SC.late ?? "LATE"} s={pop(tBell + 0.05) * (t < tBell + 2.6 ? 1 : 0)} bg={RED} y={1000} /></>);
  }

  if (mode === "early") {
    const tE = T("early"), tS = T("seats");
    const roll = cl(t, [t0, t0 + 1.6], [1, 0], Easing.out(Easing.cubic)), y = 760 + roll * 700;
    // kids hop seats in a loop after "seats"
    const seatP: P[] = [[-30, 0], [30, 0], [-30, 50], [30, 50]];
    const phase = t > tS ? (t - tS) * 1.6 : 0, step = Math.floor(phase), u = phase - step;
    const kids: [number, number, P?][] = [1, 2, 3, 0].map((k, i) => {
      const a = seatP[(i + step) % 4], b = seatP[(i + step + 1) % 4], ui = t > tS ? Math.min(1, u * 1.6) : 0;
      return [k, 0, t > tS ? hop(a, b, ui, 40) : seatP[i]] as [number, number, P];
    });
    // the front passenger seat stays empty (seat 1 shows kid only in the back); driver Arjun
    body = (
      <>
        <Road />
        <School t={t} ring={0} time={timeAt(t)} />
        <CarTop p={[540, y]} c={2} kids={kids.map(([k, s, o]) => [k, s, o ? [o[0], o[1] + 30] as P : undefined])} />
        <Tag p={[540, y + 170]} text={NAMES[2]} c={COL[2]} size={38} />
        {t > tS ? <Tag p={[540, y - 190]} text={SC.seats ?? "SEAT SWAP"} c={YELLOW} fg={INK} size={44} /> : null}
      </>
    );
    extra = (<><TimeCard time={timeAt(t)} late={false} /><Stamp text={SC.early ?? "EARLY"} s={pop(tE) * (t < tS - 0.15 ? 1 : 0)} bg={GREEN} y={1180} /></>);
  }

  if (mode === "mixup") {
    const rows = SC.mixup ?? [];
    const at = (SC.mixupAt ?? rows.map((_, i) => [9, i * 3] as [number, number])).map(([L, k]) => WL(L, k) - 0.12);
    const tW = T("wrong");
    body = (
      <>
        <rect x={0} y={0} width={1080} height={1920} fill="#f4ecd8" />
        {rows.map(([who, kid], i) => {
          const owner = Math.max(0, NAMES.indexOf(who)), y = 330 + i * 290, s = pop(at[i] ?? 1e6);
          if (s <= 0.01) return null;
          const kidIdx = [1, 2, 3, 0][i];
          return (
            <g key={i} transform={`translate(${(1 - s) * -500} 0)`} opacity={Math.min(1, s * 1.5)}>
              <g transform={`translate(230 ${y}) rotate(90) scale(0.85)`}><CarTop p={[0, 0]} c={owner} kids={[]} /></g>
              <Tag p={[230, y - 105]} text={who} c={owner === 0 ? "#8a8f98" : COL[owner]} size={38} />
              <path d={`M 360 ${y} H 600`} stroke={INK} strokeWidth={12} strokeDasharray="26 18" />
              <path d={`M 590 ${y - 30} L 640 ${y} L 590 ${y + 30}`} stroke={INK} strokeWidth={12} fill="none" strokeLinejoin="round" />
              {/* the kid, front view */}
              <g transform={`translate(780 ${y - 10})`}>
                <rect x={-46} y={30} width={92} height={70} rx={26} fill={KID[kidIdx]} stroke={INK} strokeWidth={6} />
                <circle cx={0} cy={-14} r={52} fill={SKIN[kidIdx]} stroke={INK} strokeWidth={6} />
                <path d="M -52 -20 Q 0 -90 52 -20 Q 10 -52 -52 -20 Z" fill="#1f1712" />
                <circle cx={-18} cy={-10} r={6} fill={INK} /><circle cx={18} cy={-10} r={6} fill={INK} />
                <path d={t > tW ? "M -16 22 Q 0 10 16 22" : "M -18 14 Q 0 30 18 14"} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
              </g>
              <text x={780} y={y + 130} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={34} fill={INK}>{kid}</text>
            </g>
          );
        })}
      </>
    );
    extra = <Stamp text={SC.wrong ?? "WRONG KID"} s={pop(tW)} bg={RED} y={760} size={130} />;
  }

  if (mode === "swap") {
    const tS = T("secret"), tH = T("hop");
    const xs = [200, 420, 640, 860], cy = 1050;
    // each kid hops along the row, back seat to back seat, on a loop (phase-shifted)
    const kidsIn: [number, number, P?][][] = [[], [], [], []];
    const hoppers: React.ReactNode[] = [];
    [0, 1, 2, 3].forEach((k) => {
      const per = 1.5, ph = (t - t0) / per + k * 0.37, n = Math.floor(ph), u = ph - n;
      const from = (k + n) % 4, to = (k + n + 1) % 4;
      const big = k === 0 && t > tH - 0.25 && t < tH + 0.6; // the "hop in" kid: one long hop into the blue car
      if (big) {
        const v = cl(t, [tH - 0.25, tH + 0.35], [0, 1]);
        hoppers.push(<g key={k}><KidTop p={hop([xs[0], cy + 40], [xs[2], cy + 40], v, 260)} k={0} s={1.5} /></g>);
      } else if (u < 0.45) {
        const v = u / 0.45, a: P = [xs[from], cy + 40], b: P = [xs[to], cy + 40];
        if (from < to) {
          hoppers.push(<g key={k}><path d={`M ${a[0]} ${a[1]} Q ${(a[0] + b[0]) / 2} ${a[1] - 260} ${b[0]} ${b[1]}`} stroke="#fff" strokeWidth={6} strokeDasharray="14 14" fill="none" opacity={0.85} />
            <KidTop p={hop(a, b, v, 130)} k={k} s={1.3} /></g>);
        } else kidsIn[to].push([k, 2 + (k % 2)]); // wrap-around: reappears at the start
      } else kidsIn[to].push([k, 2 + (k % 2)]);
    });
    body = (
      <>
        <rect x={0} y={0} width={1080} height={1920} fill="#8fc66b" />
        <rect x={0} y={880} width={1080} height={360} fill="#a7acb2" />
        <path d="M 0 1060 H 1080" stroke="#fff" strokeWidth={8} strokeDasharray="34 30" opacity={0.6} />
        {/* the colony gate arch */}
        <rect x={40} y={560} width={60} height={320} fill="#c9b79c" stroke={INK} strokeWidth={6} />
        <rect x={980} y={560} width={60} height={320} fill="#c9b79c" stroke={INK} strokeWidth={6} />
        <rect x={40} y={540} width={1000} height={90} rx={16} fill="#8a5a3c" stroke={INK} strokeWidth={7} />
        <text x={540} y={602} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={50} fill="#fff">{SC.gate ?? "COLONY GATE"}</text>
        {xs.map((x, i) => <CarTop key={i} p={[x, cy]} c={i} kids={kidsIn[i]} />)}
        {xs.map((x, i) => <Tag key={"n" + i} p={[x, cy + 180]} text={NAMES[i]} c={i === 0 ? "#8a8f98" : COL[i]} size={i === 3 ? 30 : 34} />)}
        {hoppers}
        {t > tH - 0.2 && t < tH + 1.4 ? <Bubble p={[xs[2] + 40, cy - 330]} text={SC.hop ?? "HOP IN"} s={pop(tH - 0.2)} rot={6} /> : null}
        {/* "eyes on the road": the parents never look back */}
        {xs.map((x, i) => <path key={"e" + i} d={`M ${x - 28} ${cy - 75} v -46 m -12 14 l 12 -14 l 12 14`} stroke={YELLOW} strokeWidth={6} fill="none" opacity={0.9} />)}
      </>
    );
    extra = <Stamp text={SC.secret ?? "SECRET SWAP"} s={pop(tS) * (t < tH - 0.3 ? 1 : 0)} bg={RED} y={360} size={120} />;
  }

  return (
    <AbsoluteFill style={{ opacity: inA * out, background: "#8fc66b" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ transform: `scale(${zoom})`, transformOrigin: "50% 40%" }}>{body}</svg>
      {extra}
    </AbsoluteFill>
  );
};
