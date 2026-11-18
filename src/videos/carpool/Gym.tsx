// "Gym car park" overlays (2026-11-18): two gym buddies hide from each other in the gym car park, told through Rohan's
// smartwatch stats. Full-screen 2D overlays driven by story.json `gym` and cues:
//   park  - front view of the gym car park at dawn: Rohan's white car in bay 1, Arjun's blue car in bay 3, both drivers
//           lit by their phones. Before cue arrive1 both cars are there (the cold open); from arrive1 only Rohan, Arjun's
//           car rolls in on arrive2. Text bubbles: gym.texts [[line, word, who(0|1), msg]]. Props by cue: recline (Rohan's
//           seat goes flat), pillow (Arjun), curtains (Arjun's windscreen). cue knock: the parking attendant steps between
//           the cars and knocks on both windows; cue bays: a "2 BAYS" measuring arrow
//   watch - Rohan's smartwatch filling the frame: stats gym.watch [[line, word, label, value]] pop in during the shot
//   bet   - two phones: the ₹500 skip bet; cue pay: both payments fly across; cue net: "NET GAINS ₹0" stamp
//   flex  - the parking attendant at his booth; before cue outlift he shows off the membership card his parking money
//           bought, from outlift he curls a giant dumbbell while the two buddies wobble tiny ones
//   enter - one blue car parked, Rohan and Arjun walking in through the gym door
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CUE, STORY, WL, hasCue } from "./story";

const UI = "Manrope, 'Helvetica Neue', Arial, sans-serif";
const INK = "#141414", YELLOW = "#f6cf4a", RED = "#d8362b", GREEN = "#2f9e4f";
const ROHAN = { car: "#f2efe8", shirt: "#3d6db5", skin: "#c99a6e" };
const ARJUN = { car: "#3d6db5", shirt: "#4f8a3a", skin: "#b9845a" };
const cl = (t: number, a: number[], b: number[], e = Easing.inOut(Easing.cubic)) => interpolate(t, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
type GymCfg = { name?: string; texts?: [number, number, number, string][]; watch?: [number, number, string, string][]; bet?: string; net?: string; card?: string };
const G = ((STORY as unknown as { gym?: GymCfg }).gym ?? {}) as GymCfg;
const T = (k: string) => (hasCue(k) ? CUE[k] : 1e6);
const sp = (f: number, fps: number, t: number, damping = 12, stiffness = 200) => (t > 1e5 ? 0 : spring({ frame: f - Math.round(t * fps), fps, config: { damping, stiffness } }));

const Stamp: React.FC<{ text: string; s: number; bg: string; x: number; y: number; rot?: number; size?: number; fg?: string }> = ({ text, s, bg, x, y, rot = -8, size = 110, fg = "#fff" }) =>
  s > 0.01 ? (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${2.2 - 1.2 * Math.min(1, s)})`, opacity: Math.min(1, s * 1.6),
      fontFamily: UI, fontWeight: 800, fontSize: size, letterSpacing: -3, color: fg, background: bg, border: `9px solid ${INK}`, borderRadius: 26,
      padding: "4px 40px 10px", boxShadow: `12px 12px 0 ${INK}`, whiteSpace: "nowrap" }}>{text}</div>
  ) : null;

// ---------------- props ----------------
/** a head + shoulders; look: -1 down at phone, 0 ahead */
const Head: React.FC<{ skin: string; shirt: string; down?: number; hairUp?: boolean; mouth?: "flat" | "o" | "smile"; lit?: number }> = ({ skin, shirt, down = 0, mouth = "flat", lit = 0 }) => (
  <g>
    <path d="M -70 90 Q -70 40 -30 34 L 30 34 Q 70 40 70 90 Z" fill={shirt} stroke={INK} strokeWidth={5} />
    <g transform={`translate(0 ${down * 8})`}>
      <circle r={44} fill={skin} stroke={INK} strokeWidth={5} />
      {lit > 0 ? <circle r={44} fill="#bfe6ff" opacity={0.28 * lit} /> : null}
      <path d="M -44 -6 Q -36 -58 10 -50 Q 44 -44 44 -10 Q 20 -32 -14 -26 Q -32 -22 -44 -6 Z" fill="#1f1712" stroke={INK} strokeWidth={4} />
      <circle cx={-15} cy={4 + down * 8} r={5.5} fill={INK} /><circle cx={15} cy={4 + down * 8} r={5.5} fill={INK} />
      {mouth === "o" ? <ellipse cx={0} cy={26} rx={8} ry={10} fill={INK} /> : mouth === "smile" ? <path d="M -14 20 Q 0 34 14 20" stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
        : <path d="M -10 25 H 10" stroke={INK} strokeWidth={5} strokeLinecap="round" />}
    </g>
  </g>
);
/** a car seen from the front with its driver behind the windscreen */
const FrontCar: React.FC<{ x: number; y: number; who: typeof ROHAN; t: number; recline?: number; pillow?: number; curtains?: number; phone?: boolean; mouth?: "flat" | "o" | "smile"; scale?: number; driver?: boolean }> =
  ({ x, y, who, t, recline = 0, pillow = 0, curtains = 0, phone = true, mouth = "flat", scale = 1, driver = true }) => (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx={0} cy={8} rx={230} ry={26} fill="rgba(0,0,0,.22)" />
      {/* roof + windscreen */}
      <path d="M -150 -170 Q -140 -260 -80 -270 L 80 -270 Q 140 -260 150 -170 Z" fill={who.car} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <clipPath id={`ws${x}`}><path d="M -128 -178 Q -120 -248 -72 -254 L 72 -254 Q 120 -248 128 -178 Z" /></clipPath>
      <path d="M -128 -178 Q -120 -248 -72 -254 L 72 -254 Q 120 -248 128 -178 Z" fill="#cfe9fb" stroke={INK} strokeWidth={6} />
      <g clipPath={`url(#ws${x})`}>
        {pillow > 0.01 ? <g transform={`translate(-52 ${-205 + recline * 40}) scale(${pillow})`}><rect x={-62} y={-40} width={124} height={70} rx={30} fill="#f6f1ff" stroke={INK} strokeWidth={5} /><path d="M -40 -6 h 80" stroke="#c9c2e0" strokeWidth={4} /></g> : null}
        {driver ? <g transform={`translate(-52 ${-176 + recline * 58}) rotate(${recline * -14}) scale(0.82)`}><Head skin={who.skin} shirt={who.shirt} down={phone ? 1 : 0} mouth={mouth} lit={phone ? 0.6 + 0.4 * Math.sin(t * 3) : 0} /></g> : null}
        {driver && phone ? <g transform={`translate(-30 ${-150 + recline * 50})`}><rect x={-16} y={-24} width={32} height={46} rx={6} fill="#222" stroke={INK} strokeWidth={3} /><rect x={-12} y={-20} width={24} height={36} rx={3} fill="#bfe6ff" /></g> : null}
        {/* curtains drawn across the windscreen */}
        {curtains > 0.01 ? [-1, 1].map((s) => (
          <g key={s}>
            <path d={`M ${s * 140} -260 L ${s * (140 - 120 * curtains)} -260 Q ${s * (140 - 110 * curtains)} -215 ${s * (140 - 125 * curtains)} -170 L ${s * 140} -170 Z`} fill="#d8506a" stroke={INK} strokeWidth={5} />
            {[0.33, 0.66].map((k) => <path key={k} d={`M ${s * (140 - 120 * curtains * k)} -258 Q ${s * (140 - 110 * curtains * k - 6)} -215 ${s * (140 - 120 * curtains * k)} -172`} stroke="#a83a50" strokeWidth={4} fill="none" />)}
          </g>
        )) : null}
        {curtains > 0.01 ? <rect x={-140} y={-266} width={280} height={12} fill="#8a5a2b" stroke={INK} strokeWidth={3} /> : null}
      </g>
      {/* body */}
      <path d="M -200 -40 L -200 -120 Q -198 -170 -150 -175 L 150 -175 Q 198 -170 200 -120 L 200 -40 Q 200 -10 170 -10 L -170 -10 Q -200 -10 -200 -40 Z" fill={who.car} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <rect x={-200} y={-125} width={400} height={14} fill="rgba(0,0,0,.08)" />
      {[-1, 1].map((s) => <g key={s}><ellipse cx={s * 138} cy={-112} rx={40} ry={24} fill="#fff6c8" stroke={INK} strokeWidth={6} /><rect x={s * 218 - 14} y={-170} width={28} height={30} rx={8} fill={who.car} stroke={INK} strokeWidth={5} /></g>)}
      <rect x={-70} y={-125} width={140} height={34} rx={10} fill="#2a2a2e" stroke={INK} strokeWidth={5} />
      <rect x={-56} y={-66} width={112} height={34} rx={6} fill="#fff" stroke={INK} strokeWidth={4} />
      {[-150, 150].map((wx) => <rect key={wx} x={wx - 34} y={-24} width={68} height={34} rx={10} fill="#2a2a2e" stroke={INK} strokeWidth={5} />)}
    </g>
  );
/** the parking attendant: khaki uniform, cap, whistle. arms: 0 down, 1 out to both sides (knocking) */
const Attendant: React.FC<{ x: number; y: number; arms?: number; t: number; scale?: number; curl?: number; card?: number; buff?: number }> = ({ x, y, arms = 0, t, scale = 1, curl = -1, card = 0, buff = 0 }) => {
  const knock = arms > 0.5 ? Math.sin(t * 22) * 8 : 0, w = 1 + buff * 0.45;
  const arm = (s: number) => (
    <g transform={`translate(${s * 62 * w} -300) rotate(${s * (-20 - 80 * arms)})`}>
      <rect x={-17 * w} y={0} width={34 * w} height={150} rx={17 * w} fill="#b59a62" stroke={INK} strokeWidth={6} />
      <circle cx={0} cy={158 + (s > 0 ? knock : -knock)} r={22 * w} fill="#a8744c" stroke={INK} strokeWidth={5} />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={-40} y={-150} width={34} height={150} rx={12} fill="#4a4030" stroke={INK} strokeWidth={6} />
      <rect x={6} y={-150} width={34} height={150} rx={12} fill="#4a4030" stroke={INK} strokeWidth={6} />
      {curl < 0 ? arm(-1) : null}{curl < 0 ? arm(1) : null}
      <rect x={-64 * w} y={-330} width={128 * w} height={190} rx={40} fill="#c9ad72" stroke={INK} strokeWidth={6} />
      <rect x={-64 * w} y={-180} width={128 * w} height={18} fill="#5a4630" />
      <circle cx={30} cy={-290} r={10} fill="#d8d8d8" stroke={INK} strokeWidth={3} /><path d="M 0 -330 Q 20 -300 30 -290" stroke={RED} strokeWidth={4} fill="none" />
      <g transform="translate(0 -385)">
        <circle r={52} fill="#a8744c" stroke={INK} strokeWidth={6} />
        <path d="M -56 -14 Q -50 -66 0 -66 Q 50 -66 56 -14 Z" fill="#3a5a8a" stroke={INK} strokeWidth={5} /><rect x={-10} y={-20} width={86} height={14} rx={7} fill="#2c4670" stroke={INK} strokeWidth={4} />
        <circle cx={-17} cy={6} r={6} fill={INK} /><circle cx={17} cy={6} r={6} fill={INK} />
        <path d="M -24 24 Q 0 18 24 24" stroke={INK} strokeWidth={8} strokeLinecap="round" />
        <path d={buff > 0.5 || card > 0.5 ? "M -14 36 Q 0 48 14 36" : "M -10 38 H 10"} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      </g>
      {curl >= 0 ? (
        <>
          {/* left arm holds up the card, right arm curls the dumbbell */}
          <g transform={`translate(${-62 * w} -300) rotate(${card > 0 ? 150 : 20})`}>
            <rect x={-17 * w} y={0} width={34 * w} height={150} rx={17 * w} fill="#b59a62" stroke={INK} strokeWidth={6} />
            {card > 0 ? <g transform={`translate(0 175) rotate(-150) scale(${card})`}><rect x={-110} y={-70} width={220} height={140} rx={16} fill={INK} stroke="#fff" strokeWidth={5} />
              <text x={0} y={-12} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={34} fill={YELLOW}>{(G.name ?? "PUMP HOUSE").toUpperCase()}</text>
              <text x={0} y={36} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={40} fill="#fff">MEMBER</text></g> : <circle cx={0} cy={160} r={22 * w} fill="#a8744c" stroke={INK} strokeWidth={5} />}
          </g>
          {buff > 0 ? (() => {
            const a = 30 + 120 * (0.5 + 0.5 * Math.sin(t * 4.2));
            return (
              <g transform={`translate(${62 * w + 30} -300) rotate(-40)`}>
                <rect x={-20 * w} y={0} width={40 * w} height={80} rx={20 * w} fill="#b59a62" stroke={INK} strokeWidth={6} />
                <g transform={`translate(0 76) rotate(${-a})`}>
                  <rect x={-18 * w} y={0} width={36 * w} height={84} rx={18} fill="#a8744c" stroke={INK} strokeWidth={6} />
                  <g transform="translate(0 96)"><rect x={-110} y={-12} width={220} height={24} rx={8} fill="#666" stroke={INK} strokeWidth={5} />
                    {[-1, 1].map((s) => <rect key={s} x={s * 110 - 34} y={-62} width={68} height={124} rx={14} fill="#2a2a2e" stroke={INK} strokeWidth={6} />)}</g>
                </g>
              </g>
            );
          })() : null}
        </>
      ) : null}
    </g>
  );
};
/** dawn sky, the gym wall with its sign and glass door, the car park tarmac with bay lines 1-4 */
const Lot: React.FC<{ t: number; bays?: boolean; doorOpen?: number }> = ({ t, bays = true, doorOpen = 0 }) => (
  <>
    <defs><linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5b6fb0" /><stop offset="0.55" stopColor="#f2a98a" /><stop offset="1" stopColor="#ffe2b0" /></linearGradient></defs>
    <rect x={0} y={0} width={1080} height={1920} fill="url(#gsky)" />
    <circle cx={180} cy={640} r={70} fill="#ffd27a" opacity={0.9} />
    {/* gym building */}
    <rect x={40} y={420} width={1000} height={560} fill="#e8e1d4" stroke={INK} strokeWidth={8} />
    <rect x={40} y={420} width={1000} height={40} fill="#cfc6b4" stroke={INK} strokeWidth={6} />
    <g transform="translate(540 540)"><rect x={-380} y={-56} width={760} height={112} rx={18} fill={INK} stroke="#fff" strokeWidth={5} />
      <text x={0} y={22} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={70} letterSpacing={2} fill={YELLOW} opacity={0.75 + 0.25 * Math.sin(t * 9) ** 2}>{(G.name ?? "PUMP HOUSE GYM").toUpperCase()}</text></g>
    {[120, 300, 780, 960].map((x) => <g key={x}><rect x={x - 70} y={650} width={140} height={150} rx={6} fill="#ffe8a8" stroke={INK} strokeWidth={6} /><path d={`M ${x - 40} 760 h 80 M ${x - 20} 740 v 40 M ${x + 20} 740 v 40`} stroke="#8a7a50" strokeWidth={8} strokeLinecap="round" /></g>)}
    {/* glass door */}
    <rect x={455} y={640} width={170} height={340} fill="#ffe8a8" stroke={INK} strokeWidth={7} />
    <g transform={`translate(${455 - doorOpen * 120} 0)`}><rect x={0} y={640} width={85} height={340} fill="rgba(160,210,240,.85)" stroke={INK} strokeWidth={6} /></g>
    <rect x={540} y={640} width={85} height={340} fill="rgba(160,210,240,.85)" stroke={INK} strokeWidth={6} />
    <text x={540} y={625} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={30} fill={INK}>OPEN 6 AM</text>
    {/* tarmac + bays */}
    <rect x={0} y={980} width={1080} height={940} fill="#5b5f66" />
    {bays ? [0, 1, 2, 3, 4].map((i) => <path key={i} d={`M ${40 + i * 250} 1010 L ${-40 + i * 270} 1860`} stroke="#f4f1ea" strokeWidth={12} />) : null}
    {bays ? [1, 2, 3, 4].map((i) => <text key={i} x={30 + i * 258 - 128} y={1830} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={64} fill="rgba(244,241,234,.6)">{i}</text>) : null}
  </>
);
/** a chat bubble (above a car) */
const Bubble: React.FC<{ x: number; y: number; s: number; text: string; mine: boolean }> = ({ x, y, s, text, mine }) =>
  s > 0.01 ? (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-100%) scale(${s}) rotate(${mine ? -3 : 3}deg)`, transformOrigin: "50% 100%",
      background: mine ? "#d6f5c6" : "#fff", border: `6px solid ${INK}`, borderRadius: 34, padding: "16px 28px", maxWidth: 470, fontFamily: UI, fontWeight: 800, fontSize: 44,
      color: INK, boxShadow: `8px 8px 0 ${INK}`, lineHeight: 1.1 }}>{text}</div>
  ) : null;

// ---------------- the overlay ----------------
export type GymMode = "park" | "watch" | "bet" | "flex" | "enter";
const WATCH = (G.watch ?? []).map(([L, k, label, value]) => ({ t: WL(L, k) - 0.08, label, value }));
const TEXTS = (G.texts ?? []).map(([L, k, who, msg]) => ({ t: WL(L, k) - 0.08, who, msg }));

export const GymOverlay: React.FC<{ t0: number; t1: number; mode: GymMode }> = ({ t0, t1, mode }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps, u = t - t0;
  const pop = sp(f, fps, t0, 14, 170);
  const out = cl(t, [t1 - 0.12, t1], [1, 0]);

  if (mode === "watch") {
    const items = WATCH.filter((x) => x.t >= t0 - 0.3 && x.t < t1);
    const best = items.some((x) => /best/i.test(x.value) || /best/i.test(x.label));
    return (
      <AbsoluteFill style={{ background: `rgba(10,14,22,${0.82 * out})`, opacity: out, alignItems: "center" }}>
        {/* strap */}
        <div style={{ position: "absolute", top: 120, width: 420, height: 1680, left: 330, background: "#2b2f38", borderRadius: 60, transform: `scale(${0.7 + 0.3 * pop})` }} />
        <div style={{ marginTop: 430, width: 780, height: 900, borderRadius: 190, background: "#0c0d10", border: "22px solid #3a3f4a", boxShadow: "0 40px 90px rgba(0,0,0,.6)",
          transform: `scale(${0.7 + 0.3 * pop}) rotate(${(1 - pop) * 8 - 2}deg)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 34, fontFamily: UI, position: "relative" }}>
          <div style={{ position: "absolute", top: 70, fontSize: 40, fontWeight: 700, color: "#9aa3b5" }}>ROHAN · 06:0{Math.min(9, 2 + Math.floor(u))}</div>
          {items.map((it, i) => {
            const s = sp(f, fps, it.t, 11, 220);
            return (
              <div key={i} style={{ transform: `scale(${s})`, opacity: Math.min(1, s * 1.6), textAlign: "center" }}>
                <div style={{ fontSize: 46, fontWeight: 800, color: ["#7fe08a", "#ff8a5c", "#6ec6ff"][i % 3], letterSpacing: 3 }}>{it.label}</div>
                <div style={{ fontSize: it.value.length > 9 ? 92 : 150, fontWeight: 800, color: "#fff", letterSpacing: -4, lineHeight: 1 }}>{it.value}</div>
              </div>
            );
          })}
          {best ? Array.from({ length: 18 }, (_, i) => {
            const a = (i / 18) * Math.PI * 2, r = 140 + 420 * cl(u, [0.3, 1.4], [0, 1], Easing.out(Easing.cubic));
            return <div key={i} style={{ position: "absolute", left: 370 + Math.cos(a) * r, top: 430 + Math.sin(a) * r * 1.1 + 60 * u * u, width: 22, height: 34, borderRadius: 4, background: ["#f6cf4a", "#7fe08a", "#ff8a5c", "#6ec6ff"][i % 4], transform: `rotate(${i * 40 + u * 400}deg)` }} />;
          }) : null}
        </div>
      </AbsoluteFill>
    );
  }

  if (mode === "bet") {
    const tPay = T("pay"), tNet = T("net");
    const fly = cl(t, [tPay - 0.1, tPay + 0.7], [0, 1]);
    const phone = (x: number, who: string, col: string, paid: boolean, rot: number) => (
      <div style={{ position: "absolute", left: x, top: 470, width: 420, height: 780, borderRadius: 64, background: "#111", padding: 16, transform: `scale(${0.6 + 0.4 * pop}) rotate(${rot}deg)`, boxShadow: "0 30px 70px rgba(0,0,0,.45)" }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 50, background: "#fff", fontFamily: UI, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 70, gap: 22 }}>
          <div style={{ width: 120, height: 120, borderRadius: 60, background: col, color: "#fff", fontSize: 58, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{who[0]}</div>
          <div style={{ fontSize: 44, fontWeight: 800, color: INK }}>{who}</div>
          <div style={{ fontSize: 92, fontWeight: 800, color: INK, letterSpacing: -3 }}>₹500</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", background: paid ? GREEN : "#9aa3b5", borderRadius: 30, padding: "10px 34px" }}>{paid ? "PAID ✓" : "PAY"}</div>
        </div>
      </div>
    );
    return (
      <AbsoluteFill style={{ background: `rgba(14,18,26,${0.75 * out})`, opacity: out }}>
        <div style={{ position: "absolute", top: 170, left: 0, right: 0, textAlign: "center", transform: `scale(${pop})` }}>
          <span style={{ fontFamily: UI, fontWeight: 800, fontSize: 64, color: INK, background: YELLOW, border: `8px solid ${INK}`, borderRadius: 24, padding: "10px 34px", boxShadow: `10px 10px 0 ${INK}` }}>{G.bet ?? "SKIP = PAY ₹500"}</span>
        </div>
        {phone(60, "Rohan → Arjun", ROHAN.shirt, t > tPay + 0.5, -4)}
        {phone(600, "Arjun → Rohan", ARJUN.shirt, t > tPay + 0.5, 4)}
        {fly > 0 && fly < 1 ? [0, 1].map((k) => {
          const x = k === 0 ? 270 + 540 * fly : 810 - 540 * fly, y = 860 + (k ? 1 : -1) * 120 - 260 * Math.sin(fly * Math.PI);
          return <div key={k} style={{ position: "absolute", left: x - 70, top: y - 70, width: 140, height: 140, borderRadius: 70, background: YELLOW, border: `7px solid ${INK}`, fontFamily: UI, fontWeight: 800, fontSize: 64, display: "flex", alignItems: "center", justifyContent: "center", transform: `rotate(${fly * 720}deg)` }}>₹</div>;
        }) : null}
        <Stamp text={G.net ?? "NET GAINS: ₹0"} s={sp(f, fps, tNet - 0.05, 9, 260)} bg={RED} x={540} y={1340} rot={-7} size={96} />
      </AbsoluteFill>
    );
  }

  if (mode === "flex") {
    const tOut = T("outlift"), lifting = t >= tOut - 0.15;
    const cardS = lifting ? 0 : sp(f, fps, t0 + 0.25, 11, 200);
    return (
      <AbsoluteFill style={{ opacity: out }}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
          <Lot t={t} bays={false} />
          {/* booth */}
          <g transform="translate(860 1240)"><rect x={-150} y={-330} width={300} height={330} fill="#f2e3c0" stroke={INK} strokeWidth={8} /><rect x={-110} y={-290} width={220} height={130} fill="#cfe9fb" stroke={INK} strokeWidth={6} />
            <rect x={-170} y={-370} width={340} height={56} rx={8} fill="#3a5a8a" stroke={INK} strokeWidth={6} /><text x={0} y={-330} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={40} fill="#fff">PARKING ₹</text></g>
          <Attendant x={lifting ? 540 : 430} y={1500} t={t} scale={lifting ? 1.5 : 1.45} curl={0} card={cardS} buff={lifting ? 1 : 0} />
          {lifting ? [0, 1].map((k) => {
            const wob = Math.sin(t * 13 + k * 2) * 7;
            return (
              <g key={k} transform={`translate(${k ? 930 : 150} 1480) scale(0.55)`}>
                <rect x={-36} y={-160} width={30} height={160} rx={12} fill="#26324a" stroke={INK} strokeWidth={6} /><rect x={6} y={-160} width={30} height={160} rx={12} fill="#26324a" stroke={INK} strokeWidth={6} />
                <rect x={-56} y={-340} width={112} height={190} rx={40} fill={k ? ARJUN.shirt : ROHAN.shirt} stroke={INK} strokeWidth={6} />
                <g transform="translate(0 -390)"><circle r={50} fill={k ? ARJUN.skin : ROHAN.skin} stroke={INK} strokeWidth={6} /><path d="M -50 -8 Q -40 -64 10 -56 Q 48 -48 48 -10 Q 20 -36 -16 -28 Q -36 -24 -50 -8 Z" fill="#1f1712" />
                  <circle cx={-16} cy={6} r={6} fill={INK} /><circle cx={16} cy={6} r={6} fill={INK} /><ellipse cx={0} cy={30} rx={10} ry={13} fill={INK} />
                  <path d="M 44 -30 q 8 14 0 24" stroke="#7fc6ef" strokeWidth={6} fill="none" /></g>
                <g transform={`translate(60 -300) rotate(${-40 + wob})`}><rect x={-14} y={0} width={28} height={120} rx={14} fill={k ? ARJUN.skin : ROHAN.skin} stroke={INK} strokeWidth={5} />
                  <g transform="translate(0 130)"><rect x={-30} y={-6} width={60} height={12} fill="#888" /><circle cx={-32} cy={0} r={16} fill="#f39ac0" stroke={INK} strokeWidth={4} /><circle cx={32} cy={0} r={16} fill="#f39ac0" stroke={INK} strokeWidth={4} /></g></g>
              </g>
            );
          }) : null}
        </svg>
        {!lifting ? <Stamp text={G.card ?? "PAID IN PARKING"} s={sp(f, fps, t0 + 0.7, 9, 260)} bg={GREEN} x={540} y={330} rot={-6} size={84} /> : <Stamp text="BEAST MODE" s={sp(f, fps, tOut + 0.4, 9, 260)} bg={YELLOW} fg={INK} x={540} y={330} rot={5} size={96} />}
      </AbsoluteFill>
    );
  }

  if (mode === "enter") {
    const walk = cl(t, [t0 + 0.1, t1], [0, 1], Easing.linear);
    return (
      <AbsoluteFill style={{ opacity: out }}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
          <Lot t={t} doorOpen={cl(walk, [0.45, 0.7], [0, 1])} />
          <FrontCar x={290} y={1560} who={ARJUN} t={t} driver={false} scale={1.05} />
          {[0, 1].map((k) => {
            const sx = 560 + k * 150, sy = 1500, ex = 520 + k * 50, ey = 990, p = walk, sc = 1 - 0.55 * p;
            const x = sx + (ex - sx) * p, y = sy + (ey - sy) * p, bob = Math.abs(Math.sin(u * 9 + k)) * 14;
            const who = k ? ARJUN : ROHAN;
            return (
              <g key={k} transform={`translate(${x} ${y - bob}) scale(${0.9 * sc})`} opacity={1 - cl(p, [0.85, 1], [0, 1])}>
                <rect x={-36} y={-160} width={30} height={160} rx={12} fill="#26324a" stroke={INK} strokeWidth={6} /><rect x={6} y={-160} width={30} height={160} rx={12} fill="#26324a" stroke={INK} strokeWidth={6} />
                <rect x={-56} y={-340} width={112} height={190} rx={40} fill={who.shirt} stroke={INK} strokeWidth={6} />
                <rect x={-80} y={-260} width={40} height={60} rx={10} fill="#f04e3e" stroke={INK} strokeWidth={5} />
                <g transform="translate(0 -390)"><circle r={50} fill={who.skin} stroke={INK} strokeWidth={6} /><path d="M -50 -8 Q -40 -64 10 -56 Q 48 -48 48 -10 Q 20 -36 -16 -28 Q -36 -24 -50 -8 Z" fill="#1f1712" /></g>
              </g>
            );
          })}
        </svg>
        <Stamp text="ACTUALLY INSIDE" s={sp(f, fps, t0 + 0.35, 9, 260)} bg={GREEN} x={540} y={470} rot={-5} size={88} />
      </AbsoluteFill>
    );
  }

  // ---- park ----
  const a1 = T("arrive1"), a2 = T("arrive2");
  const cold = t < a1 - 0.15; // the cold open: both already hiding
  const rohanIn = cold ? 1 : cl(t, [a1 - 0.15, a1 + 0.6], [0, 1], Easing.out(Easing.cubic));
  const arjunIn = cold ? 1 : cl(t, [a2 - 0.15, a2 + 0.6], [0, 1], Easing.out(Easing.cubic));
  const recline = cl(t, [T("recline") - 0.1, T("recline") + 0.5], [0, 1]);
  const pillow = sp(f, fps, T("pillow"), 10, 220);
  const curtains = cl(t, [T("curtains") - 0.1, T("curtains") + 0.4], [0, 1]);
  const tK = T("knock"), knockOn = t > tK - 0.6;
  const attX = 540, attIn = cl(t, [tK - 0.6, tK - 0.1], [0, 1], Easing.out(Easing.cubic));
  const arms = cl(t, [tK - 0.15, tK + 0.05], [0, 1]);
  const startled = t > tK + 0.25;
  const tB = T("bays"), bays = cl(t, [tB - 0.15, tB + 0.35], [0, 1], Easing.out(Easing.cubic));
  const shown = TEXTS.filter((x) => t >= x.t && x.t >= t0 - 0.2);
  const zoom = 1 + 0.05 * Math.min(1, u / 3);
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(540 1400) scale(${zoom}) translate(-540 -1400)`}>
          <Lot t={t} />
          {rohanIn > 0.01 ? <FrontCar x={228} y={1350 + (1 - rohanIn) * 700} scale={1.08} who={ROHAN} t={t} recline={recline} mouth={startled ? "o" : "flat"} phone={!startled} /> : null}
          {arjunIn > 0.01 ? <FrontCar x={852} y={1350 + (1 - arjunIn) * 700} scale={1.08} who={ARJUN} t={t} pillow={pillow} curtains={startled ? Math.min(curtains, 0.35) : curtains} mouth={startled ? "o" : "flat"} phone={!startled} /> : null}
          {knockOn ? <Attendant x={attX} y={1500 + (1 - attIn) * 600} t={t} arms={arms} scale={1.05} /> : null}
          {knockOn && arms > 0.5 ? [-1, 1].map((s) => <g key={s} transform={`translate(${540 + s * 300} 1060) rotate(${s * 8}) scale(${0.9 + 0.1 * Math.sin(t * 22)})`}>
            <path d="M 0 -80 L 22 -28 L 80 -40 L 40 6 L 76 46 L 20 34 L 0 84 L -20 34 L -76 46 L -40 6 L -80 -40 L -22 -28 Z" fill={YELLOW} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <text x={0} y={14} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={36} fill={INK}>KNOCK</text></g>) : null}
          {bays > 0.01 ? (
            <g opacity={bays}>
              <path d={`M 228 1790 L ${228 + 624 * bays} 1790`} stroke={RED} strokeWidth={14} strokeLinecap="round" />
              <path d="M 228 1750 v 80" stroke={RED} strokeWidth={14} strokeLinecap="round" />
              {bays > 0.95 ? <path d="M 852 1750 v 80" stroke={RED} strokeWidth={14} strokeLinecap="round" /> : null}
            </g>
          ) : null}
        </g>
      </svg>
      {shown.map((x, i) => {
        const s = sp(f, fps, x.t, 11, 220), newest = i === shown.length - 1;
        return <Bubble key={i} x={x.who === 0 ? 300 : 780} y={x.who === 0 ? 990 : 870} s={s * (newest ? 1 : 0.85)} text={x.msg} mine={x.who === 0} />;
      })}
      <Stamp text="2 BAYS" s={sp(f, fps, tB + 0.2, 9, 260)} bg={RED} x={540} y={330} rot={-5} size={100} />
      {cold && u > 0.4 ? <Stamp text="BOTH 'INSIDE'" s={sp(f, fps, t0 + 0.5, 9, 260)} bg={YELLOW} fg={INK} x={540} y={300} rot={-5} size={92} /> : null}
    </AbsoluteFill>
  );
};
