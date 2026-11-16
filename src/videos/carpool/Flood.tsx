// "Lane four forecast" overlays (2026-11-16): the monsoon-flood story told as a deadpan TV weather report. Full-screen 2D
// overlays driven by story.json `flood` texts and cues. One component, four modes (= four shot ids):
//   forecast - TV weather set: "LANE 4 FORECAST" banner with a (suspicious) sunny icon, a day chip per flood.days
//              [[line, word, "MON", "ANKLE DEEP", level 0..1, riders]], a side-view lane with the water gauge rising and
//              Arjun's tall blue SUV ferrying more and more neighbours (cue cycle: the guard's cycle lands on the roof)
//   fare     - the petrol-money fight: three payment rows popping on cues upi / cash / bless, a heart that fills on cue
//              full and a fuel gauge that drops to E on cue empty; cue cancel: FERRY CANCELLED stamp
//   boat     - top-down lane under water: a paper boat drifting away from Arjun's gate; cue drift: current arrows
//              radiate from his gate; cue atgate: his gate circled; cue tank: the roof tank pours over; cue pump: PUMP: ON
//   dry      - tomorrow's forecast: the gauge at zero, the SUV parked, cue sprinkle: scattered blessings drift down
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CUE, STORY, WL, hasCue } from "./story";

const UI = "Manrope, 'Helvetica Neue', Arial, sans-serif";
const INK = "#141414", YELLOW = "#f6cf4a", RED = "#d8362b", GREEN = "#2f9e4f", NAVY = "#1d2b4f";
const WATER = "#4f9fd4", WATER2 = "#7cc0e8";
const SKIN = ["#c99a6e", "#b9845a", "#d2a678", "#a8744c", "#c08a60"];
const SHIRT = ["#3d6db5", "#c8577a", "#4f8a32", "#e3b53a", "#7a5ab5", "#2f8f8a", "#e07b39", "#8a8f98", "#c8423a"];
const cl = (t: number, a: number[], b: number[], e = Easing.inOut(Easing.cubic)) => interpolate(t, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
type P = [number, number];
type FloodCfg = { lane?: string; days?: [number, number, string, string, number, number][]; fare?: [string, string][]; cancel?: string; pump?: string; dry?: string; tomorrow?: string };
const FC = ((STORY as unknown as { flood?: FloodCfg }).flood ?? {}) as FloodCfg;
const DAYS = (FC.days ?? []).map(([L, k, day, depth, level, riders]) => ({ t: WL(L, k) - 0.1, day, depth, level, riders }));
const T = (k: string) => (hasCue(k) ? CUE[k] : 1e6);

const Stamp: React.FC<{ text: string; s: number; bg: string; x?: number; y?: number; rot?: number; size?: number }> = ({ text, s, bg, x = 540, y = 960, rot = -8, size = 130 }) =>
  s > 0.01 ? (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${2.2 - 1.2 * s})`, opacity: Math.min(1, s * 1.6),
      fontFamily: UI, fontWeight: 800, fontSize: size, letterSpacing: -4, color: "#fff", background: bg, border: `10px solid ${INK}`, borderRadius: 30,
      padding: "4px 46px 12px", boxShadow: `14px 14px 0 ${INK}`, whiteSpace: "nowrap" }}>{text}</div>
  ) : null;
const Tag: React.FC<{ p: P; text: string; c: string; fg?: string; size?: number }> = ({ p, text, c, fg = "#fff", size = 40 }) => {
  const w = text.length * size * 0.7 + 44;
  return (
    <g transform={`translate(${p[0]} ${p[1]})`}>
      <rect x={-w / 2} y={-size * 0.78} width={w} height={size * 1.56} rx={14} fill={c} stroke={INK} strokeWidth={5} />
      <text x={0} y={size * 0.34} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={size} fill={fg}>{text}</text>
    </g>
  );
};
/** a head (front view) with hair; k picks skin/shirt */
const Head: React.FC<{ p: P; k: number; r?: number; happy?: boolean }> = ({ p, k, r = 26, happy = true }) => (
  <g transform={`translate(${p[0]} ${p[1]})`}>
    <rect x={-r * 0.95} y={r * 0.7} width={r * 1.9} height={r * 1.1} rx={r * 0.5} fill={SHIRT[k % SHIRT.length]} stroke={INK} strokeWidth={4} />
    <circle cx={0} cy={0} r={r} fill={SKIN[k % SKIN.length]} stroke={INK} strokeWidth={4} />
    <path d={`M ${-r} ${-r * 0.2} Q 0 ${-r * 1.6} ${r} ${-r * 0.2} Q ${r * 0.1} ${-r * 0.8} ${-r} ${-r * 0.2} Z`} fill={k === 3 ? "#8a8f98" : "#1f1712"} />
    <circle cx={-r * 0.35} cy={r * 0.05} r={r * 0.12} fill={INK} /><circle cx={r * 0.35} cy={r * 0.05} r={r * 0.12} fill={INK} />
    <path d={happy ? `M ${-r * 0.35} ${r * 0.4} Q 0 ${r * 0.65} ${r * 0.35} ${r * 0.4}` : `M ${-r * 0.3} ${r * 0.5} Q 0 ${r * 0.35} ${r * 0.3} ${r * 0.5}`} stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" />
  </g>
);
/** wavy water surface path across the frame at height y */
const wave = (y: number, t: number, amp = 10, x0 = 0, x1 = 1080) => {
  let d = `M ${x0} ${y}`;
  for (let x = x0; x <= x1; x += 30) d += ` L ${x} ${y + Math.sin(x / 60 + t * 3) * amp}`;
  return d;
};
/** the sun icon, slowly turning */
const Sun: React.FC<{ p: P; r: number; t: number }> = ({ p, r, t }) => (
  <g transform={`translate(${p[0]} ${p[1]}) rotate(${t * 20})`}>
    {Array.from({ length: 10 }, (_, i) => <rect key={i} x={-7} y={-r * 1.55} width={14} height={r * 0.4} rx={7} fill={YELLOW} stroke={INK} strokeWidth={4} transform={`rotate(${i * 36})`} />)}
    <circle r={r} fill={YELLOW} stroke={INK} strokeWidth={6} />
  </g>
);
/** a tall SUV, side view, nose to the right; riders = heads in windows + on the roof */
const SUV: React.FC<{ p: P; riders: number; cycle: number; t: number; bob: number }> = ({ p, riders, cycle, t, bob }) => {
  const win: P[] = [[95, -150], [-15, -150], [-125, -150]]; // driver (front), two rear windows
  const roof: P[] = [[-160, -265], [-95, -275], [-30, -268], [35, -275], [100, -265], [-125, -330]];
  const heads = Array.from({ length: riders }, (_, i) => i);
  return (
    <g transform={`translate(${p[0]} ${p[1] + Math.sin(t * 2.2) * bob}) rotate(${Math.sin(t * 1.7) * bob * 0.25})`}>
      {/* roof rack + cycle */}
      <rect x={-200} y={-232} width={340} height={14} rx={6} fill="#555" stroke={INK} strokeWidth={4} />
      {cycle > 0.01 ? (
        <g transform={`translate(-20 ${-330 + (1 - cycle) * -200}) scale(${0.9})`} opacity={Math.min(1, cycle * 2)}>
          <circle cx={-70} cy={60} r={42} fill="none" stroke={INK} strokeWidth={9} /><circle cx={70} cy={60} r={42} fill="none" stroke={INK} strokeWidth={9} />
          <path d="M -70 60 L -10 0 L 40 0 L 70 60 M -10 0 L 10 60 L -70 60 M 40 0 L 30 -25 M 0 -10 L -25 -10" stroke={RED} strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : null}
      {heads.slice(3).map((i) => <Head key={"r" + i} p={roof[(i - 3) % roof.length]} k={i + 2} r={24} />)}
      {/* body */}
      <path d="M -230 -40 L -230 -205 Q -228 -228 -200 -228 L 120 -228 Q 150 -226 170 -190 L 210 -110 L 245 -100 Q 262 -96 262 -70 L 262 -40 Q 262 -10 232 -10 L -200 -10 Q -230 -10 -230 -40 Z"
        fill="#3d6db5" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      {/* windows */}
      <path d="M 60 -205 L 140 -205 L 185 -118 L 60 -118 Z" fill="#cfe9fb" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <rect x={-60} y={-205} width={100} height={87} rx={8} fill="#cfe9fb" stroke={INK} strokeWidth={6} />
      <rect x={-205} y={-205} width={125} height={87} rx={8} fill="#cfe9fb" stroke={INK} strokeWidth={6} />
      {heads.slice(0, 3).map((i) => (
        <g key={"w" + i}>
          <clipPath id={`win${i}`}><rect x={win[i][0] - 60} y={-205} width={120} height={87} /></clipPath>
          <g clipPath={`url(#win${i})`}><Head p={[win[i][0], win[i][1] + 5]} k={i === 0 ? 2 : i - 1} r={26} /></g>
        </g>
      ))}
      <rect x={-225} y={-85} width={490} height={12} fill="#2c4f86" />
      <circle cx={245} cy={-70} r={12} fill={YELLOW} stroke={INK} strokeWidth={4} />
      {/* big wheels */}
      {[-140, 165].map((x) => <g key={x}><circle cx={x} cy={-5} r={58} fill="#2a2a2e" stroke={INK} strokeWidth={6} /><circle cx={x} cy={-5} r={24} fill="#b9bec6" stroke={INK} strokeWidth={4} /></g>)}
    </g>
  );
};
/** praying hands (blessings) */
const Hands: React.FC<{ p: P; s?: number; rot?: number }> = ({ p, s = 1, rot = 0 }) => (
  <g transform={`translate(${p[0]} ${p[1]}) scale(${s}) rotate(${rot})`}>
    <path d="M 0 -70 Q -38 -40 -40 30 L -46 60 L -4 60 Z" fill="#e6b98f" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M 0 -70 Q 38 -40 40 30 L 46 60 L 4 60 Z" fill="#e6b98f" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    {[-60, -30, 0, 30, 60].map((a) => <path key={a} d="M 0 -95 L 0 -125" stroke={YELLOW} strokeWidth={9} strokeLinecap="round" transform={`rotate(${a} 0 0)`} />)}
  </g>
);

// ---------------- the weather set (forecast / dry) ----------------
const WeatherSet: React.FC<{ t: number; t0: number; dry: boolean; pop: (ta: number) => number }> = ({ t, t0, dry, pop }) => {
  // current day + water level (eases between days)
  let k = -1; DAYS.forEach((d, i) => { if (t >= d.t) k = i; });
  const cur = dry ? null : DAYS[Math.max(0, k)];
  const prev = k > 0 ? DAYS[k - 1] : null;
  const lv = dry ? 0 : cur ? (prev ? prev.level : 0) + (cur.level - (prev ? prev.level : 0)) * cl(t, [cur.t, cur.t + 0.7], [0, 1]) : 0;
  const G = 1440, H = 540, wy = G - lv * H; // ground line, full gauge height, water surface
  const riders = dry ? 1 : cur ? cur.riders : 1;
  const chip = dry ? { day: FC.tomorrow ?? "TOMORROW", depth: FC.dry ?? "DRY", t: T("dry") } : cur ? { day: cur.day, depth: cur.depth, t: cur.t } : null;
  const cs = chip ? pop(chip.t) : 0;
  const tCyc = T("cycle"), cyc = !dry && t > tCyc - 0.1 ? cl(t, [tCyc - 0.1, tCyc + 0.35], [0, 1], Easing.out(Easing.back(2))) : 0;
  const tSp = T("sprinkle");
  return (
    <>
      <defs>
        <linearGradient id="fsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6fb9ec" /><stop offset="1" stopColor="#d9effa" /></linearGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#fsky)" />
      {/* houses silhouette */}
      {[[40, 380], [300, 330], [560, 400], [800, 350]].map(([x, h], i) => (
        <g key={i}>
          <rect x={x} y={G - h} width={230} height={h} fill={["#f2d6a8", "#e9c2b0", "#cfe0c6", "#e8d9b6"][i]} stroke={INK} strokeWidth={6} />
          <path d={`M ${x - 15} ${G - h} L ${x + 115} ${G - h - 90} L ${x + 245} ${G - h} Z`} fill={["#c46a4e", "#8a5a3c", "#3d6db5", "#c46a4e"][i]} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <rect x={x + 85} y={G - 130} width={60} height={130} fill="#6b4a2f" stroke={INK} strokeWidth={5} />
          {i === 2 ? <g><rect x={x + 150} y={G - h - 130} width={60} height={70} rx={10} fill="#2a2a2e" stroke={INK} strokeWidth={5} /></g> : null}
        </g>
      ))}
      <rect x={0} y={G} width={1080} height={1920 - G} fill="#8a7a62" />
      <rect x={0} y={G} width={1080} height={24} fill="#a7acb2" stroke={INK} strokeWidth={5} />
      {/* SUV */}
      <g transform={`translate(600 ${G - 60 - (lv > 0.3 ? (lv - 0.3) * 80 : 0)}) scale(1.3)`}><SUV p={[0, 0]} riders={riders} cycle={cyc} t={t} bob={lv > 0.05 ? 6 : 0} /></g>
      {/* water */}
      {lv > 0.01 ? (
        <g>
          <path d={`${wave(wy, t, 9)} L 1080 1920 L 0 1920 Z`} fill={WATER} opacity={0.82} />
          <path d={wave(wy, t, 9)} stroke={WATER2} strokeWidth={10} fill="none" />
          <path d={wave(wy + 40, t + 1, 6, 0, 1080)} stroke="#ffffff" strokeWidth={5} fill="none" opacity={0.35} />
        </g>
      ) : null}
      {/* gauge pole */}
      <g>
        <rect x={52} y={G - H - 40} width={44} height={H + 40} rx={8} fill="#fff" stroke={INK} strokeWidth={6} />
        {[["ANKLE", 0.22], ["KNEE", 0.45], ["WAIST", 0.72]].map(([n, l]) => {
          const y = G - (l as number) * H;
          return <g key={n as string}><path d={`M 52 ${y} H 120`} stroke={RED} strokeWidth={7} /><text x={128} y={y + 12} fontFamily={UI} fontWeight={800} fontSize={34} fill={INK} stroke="#fff" strokeWidth={8} paintOrder="stroke">{n}</text></g>;
        })}
      </g>
      {/* scattered blessings (dry) */}
      {dry && t > tSp - 0.2 ? Array.from({ length: 9 }, (_, i) => {
        const u = t - tSp + 0.2 - i * 0.12;
        if (u < 0) return null;
        return <Hands key={i} p={[110 + ((i * 271) % 860), 620 + u * 260 + (i % 3) * 60]} s={0.42} rot={Math.sin(u * 3 + i) * 20} />;
      }) : null}
      {/* TV banner */}
      <rect x={0} y={110} width={1080} height={200} fill={NAVY} />
      <rect x={0} y={300} width={1080} height={14} fill={YELLOW} />
      <circle cx={80} cy={162} r={14} fill={RED} opacity={0.5 + 0.5 * Math.sin(t * 6)} />
      <text x={104} y={174} fontFamily={UI} fontWeight={800} fontSize={34} fill="#fff">LIVE</text>
      <text x={60} y={262} fontFamily={UI} fontWeight={800} fontSize={72} fill="#fff" letterSpacing={-2}>{(FC.lane ?? "LANE 4") + " FORECAST"}</text>
      <Sun p={[950, 210]} r={dry ? 62 : 52} t={t} />
      {/* day chip */}
      {chip && cs > 0.01 ? (
        <g transform={`translate(540 470) scale(${0.5 + 0.5 * cs}) rotate(${(1 - cs) * -12 - 3})`} opacity={Math.min(1, cs * 1.5)}>
          <rect x={-330} y={-85} width={660} height={170} rx={30} fill={YELLOW} stroke={INK} strokeWidth={9} />
          <text x={-300} y={28} fontFamily={UI} fontWeight={800} fontSize={chip.day.length > 5 ? 54 : 84} fill={INK} letterSpacing={-3}>{chip.day}</text>
          <text x={300} y={24} textAnchor="end" fontFamily={UI} fontWeight={800} fontSize={60} fill={dry ? GREEN : "#1f5f99"} letterSpacing={-2}>{chip.depth}</text>
        </g>
      ) : null}
      {void t0}
    </>
  );
};

export const FloodOverlay: React.FC<{ t0: number; t1: number; mode: "forecast" | "fare" | "boat" | "dry" }> = ({ t0, t1, mode }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  const inA = cl(t, [t0, t0 + 0.15], [0, 1]), out = cl(t, [t1 - 0.12, t1], [1, 0]);
  const pop = (ta: number) => (t < ta ? 0 : spring({ frame: f - Math.round(ta * fps), fps, config: { damping: 11, stiffness: 220 } }));
  const zoom = 1.02 + 0.03 * cl(t, [t0, t1], [0, 1], Easing.linear);
  let body: React.ReactNode = null, extra: React.ReactNode = null;

  if (mode === "forecast" || mode === "dry") body = <WeatherSet t={t} t0={t0} dry={mode === "dry"} pop={pop} />;

  if (mode === "fare") {
    const rows = FC.fare ?? [["UPI", "PAID"], ["CASH", "₹"], ["BLESSINGS", ""]];
    const who = ["ROHAN", "PRIYA", "SHARMA JI"], tc = [T("upi"), T("cash"), T("bless")];
    const tFull = T("full"), tEmpty = T("empty");
    const fill = cl(t, [tFull - 0.1, tFull + 0.4], [0, 1]);
    const needle = cl(t, [tEmpty - 0.15, tEmpty + 0.5], [60, -62], Easing.out(Easing.back(1.6)));
    body = (
      <>
        <rect x={0} y={0} width={1080} height={1920} fill="#f4ecd8" />
        <text x={540} y={250} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={88} fill={INK} letterSpacing={-3}>PETROL MONEY</text>
        <path d="M 250 285 H 830" stroke={RED} strokeWidth={10} strokeLinecap="round" />
        {rows.map(([kind, note], i) => {
          const s = pop(tc[i] - 0.1);
          if (s <= 0.01) return null;
          const y = 420 + i * 230;
          return (
            <g key={i} transform={`translate(${(1 - s) * 600} 0)`} opacity={Math.min(1, s * 1.5)}>
              <rect x={80} y={y - 90} width={920} height={180} rx={34} fill="#fff" stroke={INK} strokeWidth={7} />
              <Head p={[180, y - 18]} k={[0, 1, 3][i]} r={44} happy={i !== 2 || t < tFull} />
              <text x={260} y={y - 18} fontFamily={UI} fontWeight={800} fontSize={44} fill={INK}>{who[i]}</text>
              <text x={260} y={y + 46} fontFamily={UI} fontWeight={800} fontSize={58} fill={i === 2 ? "#b8860b" : GREEN} letterSpacing={-2}>{kind}</text>
              {i === 0 ? <g transform={`translate(870 ${y})`}><rect x={-48} y={-74} width={96} height={148} rx={18} fill={INK} /><rect x={-38} y={-60} width={76} height={110} rx={8} fill="#d6f5c6" /><path d="M -18 -6 L -4 10 L 22 -20" stroke={GREEN} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g> : null}
              {i === 1 ? <g transform={`translate(860 ${y})`}>{[0, 1, 2].map((j) => <g key={j} transform={`translate(${j * 10 - 10} ${j * -12 + 12}) rotate(${-8 + j * 6})`}><rect x={-80} y={-40} width={160} height={80} rx={8} fill="#9ccf8a" stroke={INK} strokeWidth={5} /><circle cx={0} cy={0} r={22} fill="none" stroke="#3f7a32" strokeWidth={5} /></g>)}</g> : null}
              {i === 2 ? <Hands p={[870, y + 20]} s={0.95} rot={Math.sin(t * 4) * 6} /> : null}
              {note && i !== 2 ? <text x={720} y={y + 14} textAnchor="end" fontFamily={UI} fontWeight={800} fontSize={40} fill="#8a8f98">{note}</text> : null}
            </g>
          );
        })}
        {/* heart + fuel gauge */}
        <g transform="translate(300 1240)" opacity={pop(tFull - 0.2) > 0.01 ? 1 : 0}>
          <clipPath id="heartfill"><rect x={-130} y={110 - 240 * fill} width={260} height={240} /></clipPath>
          <path id="heart" d="M 0 100 C -150 0 -130 -110 -60 -110 C -20 -110 0 -80 0 -60 C 0 -80 20 -110 60 -110 C 130 -110 150 0 0 100 Z" fill="#fff" stroke={INK} strokeWidth={9} />
          <path d="M 0 100 C -150 0 -130 -110 -60 -110 C -20 -110 0 -80 0 -60 C 0 -80 20 -110 60 -110 C 130 -110 150 0 0 100 Z" fill={RED} clipPath="url(#heartfill)" />
          <text x={0} y={175} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={46} fill={INK}>HEART: FULL</text>
        </g>
        <g transform="translate(780 1270)" opacity={pop(tEmpty - 0.3) > 0.01 ? 1 : 0}>
          <path d="M -150 0 A 150 150 0 0 1 150 0" fill="#fff" stroke={INK} strokeWidth={9} />
          <path d="M -150 0 A 150 150 0 0 1 -106 -106" fill="none" stroke={RED} strokeWidth={22} />
          <text x={-120} y={50} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={48} fill={RED}>E</text>
          <text x={120} y={50} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={48} fill={INK}>F</text>
          <path d={`M 0 0 L ${130 * Math.sin((needle * Math.PI) / 180)} ${-130 * Math.cos((needle * Math.PI) / 180)}`} stroke={INK} strokeWidth={12} strokeLinecap="round" />
          <circle r={18} fill={INK} />
          <text x={0} y={145} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={46} fill={INK}>TANK</text>
        </g>
      </>
    );
    extra = <Stamp text={FC.cancel ?? "FERRY CANCELLED"} s={pop(T("cancel") - 0.05)} bg={RED} y={980} size={104} />;
  }

  if (mode === "boat") {
    const tD = T("drift"), tG = T("atgate"), tT = T("tank"), tP = T("pump");
    const GX = 650, GY = 700; // Arjun's gate on the lane edge
    // the boat drifts away from Arjun's gate, down and left, slowly turning
    const u = Math.max(0, t - t0);
    const bx = GX - 70 - u * 95 + Math.sin(u * 1.4) * 20, by = GY + 230 + u * 70 + Math.sin(u * 2) * 10;
    const pour = t > tT - 0.1 ? cl(t, [tT - 0.1, tT + 0.4], [0, 1]) : 0;
    body = (
      <>
        <rect x={0} y={0} width={1080} height={1920} fill={WATER} />
        {/* ripples */}
        {Array.from({ length: 26 }, (_, i) => {
          const x = (i * 211 + t * 30) % 1180 - 50, y = 760 + ((i * 137) % 900);
          return <path key={i} d={`M ${x} ${y} q 25 -10 50 0`} stroke="#fff" strokeWidth={5} fill="none" opacity={0.35} strokeLinecap="round" />;
        })}
        {/* the houses (top), Arjun's is the third, with the roof tank */}
        <rect x={0} y={0} width={1080} height={660} fill="#8fc66b" />
        {[0, 1, 2, 3].map((i) => {
          const x = 40 + i * 260;
          return (
            <g key={i}>
              <rect x={x} y={250} width={220} height={300} rx={10} fill={["#c46a4e", "#8a5a3c", "#3d6db5", "#c46a4e"][i]} stroke={INK} strokeWidth={7} />
              <path d={`M ${x} 400 H ${x + 220}`} stroke={INK} strokeWidth={5} opacity={0.4} />
              <rect x={x + 80} y={560} width={60} height={100} fill="#d9d2c2" stroke={INK} strokeWidth={5} />
            </g>
          );
        })}
        <rect x={0} y={640} width={1080} height={26} fill="#d9d2c2" stroke={INK} strokeWidth={5} />
        {/* the roof tank on Arjun's roof */}
        <g transform="translate(650 330)">
          <circle r={58} fill="#2a2a2e" stroke={INK} strokeWidth={7} />
          <circle r={36} fill="none" stroke="#55555c" strokeWidth={6} />
          {pour > 0 ? <circle r={58 + 30 * pour + 8 * Math.sin(t * 9)} fill="none" stroke={YELLOW} strokeWidth={10} opacity={0.9} /> : null}
        </g>
        {/* the overflow: a stream from the tank, over the roof edge, out of the gate */}
        {pour > 0 ? (
          <g opacity={pour}>
            <path d="M 650 390 C 660 470 640 520 650 700" stroke={WATER2} strokeWidth={34} fill="none" strokeLinecap="round" />
            <path d="M 650 390 C 660 470 640 520 650 700" stroke="#fff" strokeWidth={8} fill="none" strokeDasharray="24 30" strokeDashoffset={-t * 220} strokeLinecap="round" />
            <Tag p={[860, 330]} text="ROOF TANK" c={YELLOW} fg={INK} size={38} />
          </g>
        ) : null}
        {/* current arrows radiating from Arjun's gate */}
        {t > tD - 0.1 ? [-150, -120, -90, -60, -30].map((a, i) => {
          const r0 = 90 + ((t * 120 + i * 40) % 160), ra = (a * Math.PI) / 180;
          const x = GX + Math.cos(ra) * -r0 * 1.6, y = GY + 40 + Math.sin(-ra) * r0;
          const rot = 180 - a + 180;
          return <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`} opacity={cl(t, [tD - 0.1, tD + 0.3], [0, 0.9])}>
            <path d="M -30 0 H 30 M 10 -18 L 30 0 L 10 18" stroke="#fff" strokeWidth={9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>;
        }) : null}
        {t > tG - 0.15 ? <g><circle cx={GX} cy={GY - 30} r={90 + 6 * Math.sin(t * 8)} fill="none" stroke={RED} strokeWidth={12} /><Tag p={[GX, GY - 160]} text="ARJUN'S" c={RED} size={40} /></g> : null}
        {/* the paper boat */}
        <g transform={`translate(${bx} ${by}) rotate(${-20 + Math.sin(u * 1.8) * 12}) scale(1.4)`}>
          <path d="M -70 0 L 70 0 L 45 30 L -45 30 Z" fill="#fdfbf4" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <path d="M -40 0 L 0 -70 L 40 0 Z" fill="#fff" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <path d="M 0 -70 L 0 0" stroke={INK} strokeWidth={4} />
        </g>
      </>
    );
    extra = <Stamp text={FC.pump ?? "PUMP: ON"} s={pop(tP - 0.05)} bg={RED} y={1080} x={540} rot={6} size={120} />;
  }

  return (
    <AbsoluteFill style={{ opacity: inA * out, background: "#cfe3f2" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ transform: `scale(${zoom})`, transformOrigin: "50% 40%" }}>{body}</svg>
      {extra}
    </AbsoluteFill>
  );
};
