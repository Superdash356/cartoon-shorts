// "Wrong bus safari" overlays (2026-11-17): the story is narrated like a wildlife documentary. Full-screen 2D overlays
// driven by story.json `hunt` texts and cues, plus a documentary camera bug drawn over every other shot.
//   chase - side view of the colony road: Rohan sprinting after the yellow 8:15 bus. The narration's "Week n" lines pick
//           his props (week 2: one shoe gone; week 3: laptop bag, tiffin, toothbrush). cues: nose (SLAM, bounce back),
//           shoe (a shoe flies off), leap (he leaps for the bus), bye (the driver's hand waves out of the window)
//   chai  - the bus at the stop: Rohan hands the driver a cutting chai. cues: drinks (driver sips), leaves (bus pulls away,
//           8:15 stamp, Rohan left holding nothing)
//   bus   - the reveal: full side of the bus, SCHOOL BUS, kids in every window. cue kids: they wave a GO UNCLE GO banner
//   mail  - the office inbox, thousands unread, the shuttle-cancelled email circled. cue email: UNREAD stamp
//   calm  - the lane: Rohan strolls, toothbrush in mouth, to Arjun's waiting blue car; a live-map card counts the metres
//   chai2 - callback: the school bus slowing at the colony gate, Rohan passing a chai up to the driver's window
// DocBug: viewfinder corners + REC + running timecode, and lower-third labels (hunt.labels [[line, word, title, sub]]).
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CUE, STORY, WL, WORDS_T, hasCue } from "./story";

const UI = "Manrope, 'Helvetica Neue', Arial, sans-serif";
const INK = "#141414", YELLOW = "#f6cf4a", RED = "#d8362b", BUSY = "#f2b51d", SKIN = "#c99a6e", SHIRT = "#3d6db5";
const cl = (t: number, a: number[], b: number[], e = Easing.inOut(Easing.cubic)) => interpolate(t, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
type HuntCfg = { route?: string; banner?: string; inbox?: { from: string; subject: string; date: string }[]; target?: number; unread?: string; stamp?: string; labels?: [number, number, string, string][]; clock?: string };
const H = ((STORY as unknown as { hunt?: HuntCfg }).hunt ?? {}) as HuntCfg;
const T = (k: string) => (hasCue(k) ? CUE[k] : 1e6);
const sp = (f: number, fps: number, t: number, damping = 12, stiffness = 200) => (t > 1e5 ? 0 : spring({ frame: f - Math.round(t * fps), fps, config: { damping, stiffness } }));

/** start times of the narration lines that open with "Week ..." */
const WEEKS = STORY.lines.map((l, i) => (/^week\s/i.test(l.text.trim()) ? WL(i, 0) - 0.1 : null)).filter((x): x is number => x !== null);
const weekAt = (t: number) => WEEKS.filter((w) => t >= w).length; // 0 before week one

const Stamp: React.FC<{ text: string; s: number; bg: string; x: number; y: number; rot?: number; size?: number; fg?: string }> = ({ text, s, bg, x, y, rot = -8, size = 110, fg = "#fff" }) =>
  s > 0.01 ? (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${2.2 - 1.2 * Math.min(1, s)})`, opacity: Math.min(1, s * 1.6),
      fontFamily: UI, fontWeight: 800, fontSize: size, letterSpacing: -3, color: fg, background: bg, border: `9px solid ${INK}`, borderRadius: 26,
      padding: "4px 40px 10px", boxShadow: `12px 12px 0 ${INK}`, whiteSpace: "nowrap" }}>{text}</div>
  ) : null;

// ---------------- props ----------------
/** Rohan, side view facing right. run = stride phase (radians), lean, props by week */
const Runner: React.FC<{ x: number; y: number; run: number; amp?: number; week: number; shoeGone: boolean; leap?: number; nose?: number; brush?: boolean; scale?: number }> =
  ({ x, y, run, amp = 1, week, shoeGone, leap = 0, nose = 0, brush, scale = 1 }) => {
    const legA = Math.sin(run) * 38 * amp * (1 - leap), legB = -legA, armA = -Math.sin(run) * 50 * amp * (1 - leap);
    const lean = 10 * amp + leap * 35;
    const leg = (a: number, back: boolean, bare: boolean) => (
      <g transform={`rotate(${a} 0 -150)`}>
        <rect x={-15} y={-155} width={30} height={150} rx={14} fill={back ? "#26324a" : "#33415e"} stroke={INK} strokeWidth={5} />
        {bare ? <ellipse cx={14} cy={-6} rx={30} ry={14} fill="#f4f1ea" stroke={INK} strokeWidth={5} />
          : <path d="M -18 -18 L 30 -18 Q 52 -16 52 2 L 52 6 L -18 6 Z" fill={back ? "#5a3a24" : "#6b4a2f"} stroke={INK} strokeWidth={5} strokeLinejoin="round" />}
      </g>
    );
    return (
      <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${lean})`}>
        {leg(legB, true, false)}
        {/* back arm */}
        <g transform={`rotate(${-armA} 0 -290)`}><rect x={-12} y={-292} width={24} height={115} rx={12} fill="#2f5796" stroke={INK} strokeWidth={5} /></g>
        {/* laptop bag strap + bag (week 3) */}
        {week >= 3 ? <g><path d="M -30 -330 L 40 -200" stroke="#3a2a1c" strokeWidth={10} /><rect x={-92} y={-235} width={95} height={70} rx={10} fill="#4a4a52" stroke={INK} strokeWidth={5} /></g> : null}
        {/* torso */}
        <rect x={-42} y={-335} width={84} height={190} rx={34} fill={SHIRT} stroke={INK} strokeWidth={6} />
        {leg(legA, false, shoeGone)}
        {/* head */}
        <g transform="translate(6 -385)">
          <circle r={52} fill={SKIN} stroke={INK} strokeWidth={6} />
          <path d="M -52 -8 Q -40 -70 20 -58 Q 52 -48 50 -12 Q 20 -40 -20 -30 Q -40 -24 -52 -8 Z" fill="#1f1712" stroke={INK} strokeWidth={4} />
          <circle cx={26} cy={-2} r={7} fill={INK} />
          <path d={leap > 0.2 ? "M 18 22 Q 34 34 46 20" : "M 14 26 Q 30 18 46 26"} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
          <circle cx={52} cy={8} r={9 + nose * 7} fill={nose > 0.05 ? "#e2584a" : SKIN} stroke={INK} strokeWidth={4} />
          {week >= 3 || brush ? <g><rect x={36} y={18} width={78} height={11} rx={5} fill="#3aa0d8" stroke={INK} strokeWidth={4} transform="rotate(-8 40 22)" /><circle cx={44} cy={30} r={7} fill="#fff" stroke={INK} strokeWidth={3} /></g> : null}
          {amp > 0.6 ? <g stroke="#7fc6ef" strokeWidth={6} strokeLinecap="round"><path d="M -40 -40 L -58 -64" /><path d="M -56 -6 L -82 -12" /></g> : null}
        </g>
        {/* front arm (+ tiffin in week 3) */}
        <g transform={`rotate(${armA} 0 -290)`}>
          <rect x={-12} y={-292} width={24} height={115} rx={12} fill={SHIRT} stroke={INK} strokeWidth={5} />
          <circle cx={0} cy={-170} r={16} fill={SKIN} stroke={INK} strokeWidth={4} />
          {week >= 3 ? <g transform="translate(0 -150)"><rect x={-24} y={0} width={48} height={70} rx={8} fill="#c9cdd3" stroke={INK} strokeWidth={5} /><path d="M -24 22 H 24 M -24 44 H 24" stroke={INK} strokeWidth={4} /></g> : null}
        </g>
      </g>
    );
  };
/** the yellow bus, side view, nose to the right; school = lettering + kids visible; tinted = dark windows (from behind) */
const Bus: React.FC<{ x: number; y: number; t: number; school: boolean; kids?: number; wave?: number; doorOpen?: number; driverArm?: number; banner?: number; route?: string }> =
  ({ x, y, t, school, kids = 0, wave = 0, doorOpen = 0, driverArm = 0, banner = 0, route = "8:15" }) => {
    const win = [-560, -440, -320, -200, -80, 40];
    return (
      <g transform={`translate(${x} ${y})`}>
        {/* body: x from -640 (rear) to 260 (nose) */}
        <path d="M -640 -60 L -640 -400 Q -640 -430 -610 -430 L 190 -430 Q 230 -430 240 -390 L 262 -240 L 262 -60 Q 262 -30 232 -30 L -610 -30 Q -640 -30 -640 -60 Z" fill={BUSY} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <rect x={-640} y={-150} width={902} height={22} fill={INK} />
        {/* windows + kids */}
        {win.map((wx, i) => (
          <g key={i}>
            <clipPath id={`bw${i}`}><rect x={wx} y={-395} width={100} height={110} rx={10} /></clipPath>
            <rect x={wx} y={-395} width={100} height={110} rx={10} fill={school ? "#cfe9fb" : "#3b4f63"} stroke={INK} strokeWidth={6} />
            {school && i < kids ? (
              <g clipPath={`url(#bw${i})`}>
                <circle cx={wx + 50} cy={-325 + Math.sin(t * 8 + i) * 4 * wave} r={30} fill={["#c99a6e", "#b9845a", "#d2a678", "#a8744c"][i % 4]} stroke={INK} strokeWidth={4} />
                <path d={`M ${wx + 22} ${-338} Q ${wx + 50} ${-380} ${wx + 78} ${-338}`} fill="#1f1712" />
                <path d={`M ${wx + 38} ${-312} Q ${wx + 50} ${-300} ${wx + 62} ${-312}`} stroke={INK} strokeWidth={4} fill="none" />
                {wave > 0 ? <g transform={`rotate(${Math.sin(t * 12 + i * 1.3) * 25} ${wx + 80} ${-300})`}><rect x={wx + 72} y={-370} width={18} height={70} rx={9} fill={["#c99a6e", "#b9845a", "#d2a678", "#a8744c"][i % 4]} stroke={INK} strokeWidth={4} /></g> : null}
              </g>
            ) : null}
            {!school ? <path d={`M ${wx + 12} ${-385} L ${wx + 40} ${-385} L ${wx + 12} ${-350} Z`} fill="rgba(255,255,255,.35)" /> : null}
          </g>
        ))}
        {/* driver window + door */}
        <path d="M 160 -395 L 205 -395 Q 222 -395 228 -378 L 246 -285 L 160 -285 Z" fill="#cfe9fb" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <g transform={`translate(${-doorOpen * 80} 0)`}><rect x={78} y={-395} width={70} height={340} rx={6} fill={school ? "#e3a614" : "#e3a614"} stroke={INK} strokeWidth={6} /><rect x={88} y={-385} width={50} height={130} rx={6} fill={school ? "#cfe9fb" : "#3b4f63"} stroke={INK} strokeWidth={4} /></g>
        {/* driver */}
        <g transform="translate(200 -330)"><circle r={30} fill="#a8744c" stroke={INK} strokeWidth={4} /><rect x={-32} y={-36} width={64} height={18} rx={6} fill="#34495e" stroke={INK} strokeWidth={4} /><path d="M -6 12 Q 14 4 30 12" stroke={INK} strokeWidth={7} strokeLinecap="round" /></g>
        {driverArm > 0 ? <g transform={`translate(240 -300) rotate(${-60 + Math.sin(t * 14) * 30 * driverArm})`}><rect x={-10} y={-90} width={22} height={90} rx={11} fill="#a8744c" stroke={INK} strokeWidth={4} /><circle cx={1} cy={-96} r={18} fill="#a8744c" stroke={INK} strokeWidth={4} /></g> : null}
        {/* route board + lettering */}
        <rect x={-610} y={-118} width={150} height={56} rx={8} fill={INK} /><text x={-535} y={-76} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={40} fill="#ffb238">{route}</text>
        {school ? <text x={-250} y={-180} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={76} letterSpacing={-2} fill={INK}>SCHOOL BUS</text> : null}
        {banner > 0.01 ? (
          <g transform={`translate(-260 ${-470 - 30 * banner}) rotate(${Math.sin(t * 6) * 3}) scale(${banner})`}>
            <rect x={-300} y={-60} width={600} height={110} rx={14} fill="#fff" stroke={INK} strokeWidth={7} />
            <text x={0} y={22} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={70} fill={RED}>{H.banner ?? "GO UNCLE GO!"}</text>
          </g>
        ) : null}
        {/* wheels */}
        {[-470, 110].map((wx) => <g key={wx}><circle cx={wx} cy={-30} r={62} fill="#2a2a2e" stroke={INK} strokeWidth={6} /><circle cx={wx} cy={-30} r={24} fill="#b9bec6" stroke={INK} strokeWidth={4} /></g>)}
        <rect x={250} y={-110} width={22} height={40} rx={6} fill={YELLOW} stroke={INK} strokeWidth={4} />
        <rect x={-652} y={-120} width={18} height={44} rx={5} fill={RED} stroke={INK} strokeWidth={4} />
      </g>
    );
  };
const Chai: React.FC<{ x: number; y: number; s?: number; steam?: number; t: number }> = ({ x, y, s = 1, steam = 1, t }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -24 -60 L 24 -60 L 18 0 L -18 0 Z" fill="rgba(220,235,245,.85)" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    <path d="M -22 -44 L 22 -44 L 18 -2 L -18 -2 Z" fill="#b5793f" />
    {steam > 0 ? [-10, 8].map((dx, i) => <path key={i} d={`M ${dx} -70 q 10 -15 0 -30 q -10 -15 0 -30`} stroke="rgba(255,255,255,.9)" strokeWidth={5} fill="none" strokeLinecap="round" opacity={steam * (0.5 + 0.5 * Math.sin(t * 5 + i))} />) : null}
  </g>
);
/** sky, colony wall + trees, road; scroll = how far the backdrop has slid left (px) */
const Backdrop: React.FC<{ scroll: number; gate?: boolean }> = ({ scroll, gate }) => {
  const trees = Array.from({ length: 7 }, (_, i) => ((i * 260 - scroll * 0.6) % 1820 + 1820) % 1820 - 260);
  const dash = -((scroll % 160) + 160) % 160;
  return (
    <>
      <defs><linearGradient id="hsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8fcdf0" /><stop offset="1" stopColor="#fdf0d2" /></linearGradient></defs>
      <rect x={0} y={0} width={1080} height={1920} fill="url(#hsky)" />
      <circle cx={860} cy={330} r={90} fill="#ffe08a" opacity={0.9} />
      {trees.map((x, i) => (
        <g key={i}><rect x={x + 50} y={860} width={26} height={140} fill="#7a5235" stroke={INK} strokeWidth={5} /><circle cx={x + 63} cy={830} r={80} fill={i % 2 ? "#5d9e48" : "#4f8a3a"} stroke={INK} strokeWidth={6} /></g>
      ))}
      <rect x={0} y={960} width={1080} height={150} fill="#e8d9b6" stroke={INK} strokeWidth={6} />
      {Array.from({ length: 12 }, (_, i) => { const x = ((i * 120 - scroll) % 1440 + 1440) % 1440 - 120; return <rect key={i} x={x} y={950} width={22} height={170} fill="#d4c39c" stroke={INK} strokeWidth={4} />; })}
      {gate ? <g><rect x={90} y={880} width={70} height={240} fill="#c9b48a" stroke={INK} strokeWidth={6} /><rect x={420} y={880} width={70} height={240} fill="#c9b48a" stroke={INK} strokeWidth={6} />
        <rect x={60} y={840} width={460} height={60} rx={8} fill="#3d6db5" stroke={INK} strokeWidth={6} /><text x={290} y={884} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={40} fill="#fff">GREEN PARK COLONY</text></g> : null}
      <rect x={0} y={1110} width={1080} height={70} fill="#b9bec6" stroke={INK} strokeWidth={6} />
      <rect x={0} y={1180} width={1080} height={340} fill="#5b5f66" />
      {Array.from({ length: 9 }, (_, i) => <rect key={i} x={dash + i * 160} y={1380} width={90} height={16} rx={8} fill="#f4f1ea" />)}
      <rect x={0} y={1520} width={1080} height={400} fill="#8a7a62" />
    </>
  );
};

// ---------------- the overlay ----------------
export type HuntMode = "chase" | "chai" | "bus" | "mail" | "calm" | "chai2";
export const HuntOverlay: React.FC<{ t0: number; t1: number; mode: HuntMode }> = ({ t0, t1, mode }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps, u = t - t0;
  const pop = sp(f, fps, t0, 14, 170);
  const out = cl(t, [t1 - 0.12, t1], [1, 0]);
  if (mode === "mail") {
    const rows = H.inbox ?? [];
    const st = sp(f, fps, T("email") - 0.05, 9, 260);
    const ring = cl(t, [T("email") - 0.2, T("email") + 0.25], [0, 1]);
    return (
      <AbsoluteFill style={{ background: `rgba(14,18,26,${0.7 * out})`, opacity: out, alignItems: "center" }}>
        <div style={{ marginTop: 170, width: 820, height: 1280, borderRadius: 96, background: "#111", padding: 22, transform: `scale(${0.6 + 0.4 * pop}) rotate(${(1 - pop) * 7 + 1.5}deg)`, boxShadow: "0 40px 90px rgba(0,0,0,.5)" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 76, background: "#fff", overflow: "hidden", fontFamily: UI, position: "relative" }}>
            <div style={{ padding: "66px 48px 18px", display: "flex", alignItems: "baseline", gap: 20 }}>
              <div style={{ fontSize: 66, fontWeight: 800, letterSpacing: -2, color: INK }}>Inbox</div>
              <div style={{ marginLeft: "auto", fontSize: 38, fontWeight: 800, color: "#fff", background: RED, borderRadius: 30, padding: "4px 22px" }}>{H.unread ?? "4,812"}</div>
            </div>
            {rows.map((r, i) => {
              const hot = i === (H.target ?? 2);
              return (
                <div key={i} style={{ padding: "22px 48px", borderTop: "2px solid #eee", background: hot && ring > 0 ? `rgba(246,207,74,${0.55 * ring})` : "transparent", position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 10, background: "#2f6fe0" }} />
                    <div style={{ fontSize: 36, fontWeight: 800, color: INK }}>{r.from}</div>
                    <div style={{ marginLeft: "auto", fontSize: 30, fontWeight: 700, color: "#888" }}>{r.date}</div>
                  </div>
                  <div style={{ fontSize: 34, fontWeight: 700, color: "#333", marginTop: 6, marginLeft: 36 }}>{r.subject}</div>
                  {hot && ring > 0 ? <div style={{ position: "absolute", left: 18, right: 18, top: 6, bottom: 6, border: `9px solid ${RED}`, borderRadius: 60, transform: `rotate(-1.5deg) scale(${0.9 + 0.1 * ring})`, opacity: ring }} /> : null}
                </div>
              );
            })}
          </div>
        </div>
        <Stamp text={H.stamp ?? "UNREAD"} s={st} bg={RED} x={560} y={1290} rot={-9} />
      </AbsoluteFill>
    );
  }
  const scrollSpeed = mode === "chase" ? 520 : mode === "calm" ? 90 : 0;
  const tLeap = T("leap"), tBye = T("bye"), tNose = T("nose"), tShoe = T("shoe");
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <g transform={mode === "chase" ? `translate(380 1250) scale(${[1, 1, 1.1, 1.2][Math.min(3, weekAt(t))] * (1 + 0.04 * Math.min(1, u))}) translate(-380 -1250)` : undefined}>
        <Backdrop scroll={u * scrollSpeed} gate={mode === "chai2" || mode === "calm"} />
        {mode === "chase" ? (() => {
          const week = weekAt(t);
          const leap = t > tLeap - 0.1 && t < tLeap + 1.2 ? Math.sin(cl(t, [tLeap - 0.1, tLeap + 0.7], [0, Math.PI], Easing.linear)) : 0;
          const bye = t > tBye - 0.2 ? cl(t, [tBye - 0.2, tBye + 0.1], [0, 1]) : 0;
          const away = t > tBye ? (t - tBye) * 900 : 0;
          const busX = 1150 - 140 * Math.sin(u * 1.3) * 0.3 + away + (week === 0 ? 0 : 20);
          const noseK = t > tNose - 0.05 && t < tNose + 0.6 ? Math.exp(-(t - tNose) / 0.25) : 0;
          const noseRed = t > tNose - 0.05 && week === 1 ? 1 : 0;
          const rx = 330 + 60 * Math.sin(u * 0.9) + leap * 260 - noseK * 120;
          const shoeU = t - tShoe;
          return (
            <>
              <Bus x={busX} y={1390} t={t} school={false} driverArm={bye} route={H.route} />
              <Runner x={rx} y={1440 - leap * 260} run={u * 15} week={week} shoeGone={week >= 2 && shoeU > 0} leap={leap} nose={noseRed} />
              {shoeU > 0 && shoeU < 1.6 ? (
                <g transform={`translate(${rx - 40 - shoeU * 420} ${1430 - 520 * shoeU + 520 * shoeU * shoeU}) rotate(${shoeU * 720})`}>
                  <path d="M -30 -14 L 20 -14 Q 40 -12 40 4 L 40 10 L -30 10 Z" fill="#6b4a2f" stroke={INK} strokeWidth={5} />
                </g>
              ) : null}
              {noseK > 0.05 ? <g transform={`translate(${rx + 120} 1010) scale(${0.6 + noseK * 0.6})`}>
                <path d="M 0 -110 L 30 -40 L 105 -60 L 55 0 L 110 50 L 30 40 L 10 110 L -20 40 L -100 60 L -50 0 L -105 -50 L -30 -40 Z" fill={YELLOW} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
                <text x={0} y={18} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={54} fill={INK}>SLAM</text></g> : null}
              {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M ${rx - 140 - i * 30} ${1180 + i * 45} h ${-80 - (i % 3) * 30}`} stroke="rgba(255,255,255,.75)" strokeWidth={8} strokeLinecap="round" />)}
            </>
          );
        })() : null}
        {mode === "chai" ? (() => {
          const tD = T("drinks"), tL = T("leaves");
          const go = t > tL ? (t - tL) * 1100 * cl(t, [tL, tL + 0.4], [0.3, 1]) : 0;
          const hand = cl(t, [t0 + 0.2, t0 + 0.7], [0, 1]);
          const took = t > tD - 0.2;
          return (
            <>
              <Bus x={760 + go} y={1390} t={t} school={false} doorOpen={go > 0 ? 0 : 1} route={H.route} />
              <Runner x={600} y={1440} run={0} amp={0} week={0} shoeGone={false} />
              {!took ? <g transform={`translate(${680 + hand * 200} ${1100 - hand * 50})`}><circle r={16} fill={SKIN} stroke={INK} strokeWidth={4} /><Chai x={0} y={-12} t={t} /></g> : null}
              {took && go < 300 ? <g transform={`translate(${960 + go} ${1040 - 30 * cl(t, [tD - 0.2, tD + 0.3], [0, 1])}) rotate(${-30 * cl(t, [tD, tD + 0.4], [0, 1])})`}><Chai x={0} y={0} t={t} steam={0.6} /></g> : null}
              <g transform="translate(860 330)"><circle r={120} fill="#fff" stroke={INK} strokeWidth={10} />
                {(() => { const m = cl(t, [t0, tL], [13, 15], Easing.linear); return <><path d={`M 0 0 L ${Math.sin((m / 60) * Math.PI * 2) * 90} ${-Math.cos((m / 60) * Math.PI * 2) * 90}`} stroke={INK} strokeWidth={10} strokeLinecap="round" /><path d={`M 0 0 L ${Math.sin(((8 + m / 60) / 12) * Math.PI * 2) * 55} ${-Math.cos(((8 + m / 60) / 12) * Math.PI * 2) * 55}`} stroke={INK} strokeWidth={14} strokeLinecap="round" /></>; })()}
                <circle r={12} fill={RED} /></g>
            </>
          );
        })() : null}
        {mode === "bus" ? (() => {
          const tk = T("kids"), wave = t > tk - 0.15 ? 1 : 0.35, ban = sp(f, fps, tk - 0.1, 10, 180);
          return (
            <>
              <g transform={`translate(${500 + 40 * (1 - pop)} 0)`}>
                <Bus x={300} y={1400} t={t} school kids={6} wave={wave} banner={ban} route={H.route} />
              </g>
              <Runner x={170} y={1460} run={0} amp={0} week={3} shoeGone scale={0.75} />
            </>
          );
        })() : null}
        {mode === "calm" ? (() => {
          const walk = cl(t, [t0, t1], [0, 1], Easing.linear);
          return (
            <>
              <g transform="translate(860 1350)">
                <path d="M -230 -20 L -230 -120 Q -225 -150 -190 -158 L -120 -230 Q -100 -250 -60 -250 L 90 -250 Q 130 -250 150 -220 L 200 -160 Q 240 -150 240 -110 L 240 -20 Z" fill="#3d6db5" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
                <path d="M -100 -225 L -10 -225 L -10 -165 L -165 -165 Z" fill="#cfe9fb" stroke={INK} strokeWidth={6} /><path d="M 10 -225 L 100 -225 L 160 -165 L 10 -165 Z" fill="#cfe9fb" stroke={INK} strokeWidth={6} />
                <g transform="translate(70 -190)"><circle r={26} fill="#b9845a" stroke={INK} strokeWidth={4} /><path d="M -26 -6 Q 0 -40 26 -6" fill="#1f1712" /></g>
                {[-140, 150].map((x) => <g key={x}><circle cx={x} cy={-20} r={48} fill="#2a2a2e" stroke={INK} strokeWidth={6} /><circle cx={x} cy={-20} r={18} fill="#b9bec6" stroke={INK} strokeWidth={4} /></g>)}
              </g>
              <Runner x={170 + walk * 330} y={1440} run={u * 5} amp={0.25} week={0} shoeGone={false} brush />
              {(() => { const s2 = sp(f, fps, t0 + 0.25, 12, 180), m = Math.max(0, Math.round(200 * (1 - cl(t, [t0 + 0.4, t1 - 0.4], [0, 1], Easing.linear)) / 10) * 10);
                return <g transform={`translate(800 420) scale(${s2}) rotate(4)`}><rect x={-200} y={-150} width={400} height={300} rx={36} fill="#fff" stroke={INK} strokeWidth={8} />
                  <path d="M -150 80 Q -40 -80 120 -40" stroke="#2f9e4f" strokeWidth={14} strokeDasharray="26 18" fill="none" strokeLinecap="round" />
                  <circle cx={120} cy={-40} r={22} fill={RED} stroke={INK} strokeWidth={5} />
                  <text x={0} y={120} textAnchor="middle" fontFamily={UI} fontWeight={800} fontSize={56} fill={INK}>{m > 0 ? `${m} m` : "HERE"}</text></g>; })()}
            </>
          );
        })() : null}
        {mode === "chai2" ? (() => {
          const slow = cl(t, [t0, t0 + 1.2], [0, 1], Easing.out(Easing.cubic)), bx = 1500 - 680 * slow;
          const pass = cl(t, [t0 + 1.0, t0 + 1.6], [0, 1]);
          return (
            <>
              <Bus x={bx} y={1390} t={t} school kids={6} wave={1} route={H.route} />
              <Runner x={720} y={1440} run={0} amp={0} week={0} shoeGone={false} />
              <g transform={`translate(${800 + pass * (bx + 180 - 800)} ${1100 - pass * 60})`}><circle r={16} fill={SKIN} stroke={INK} strokeWidth={4} /><Chai x={0} y={-12} t={t} /></g>
            </>
          );
        })() : null}
        </g>
      </svg>
      {mode === "chai" ? <Stamp text={H.clock ?? "8:15 SHARP"} s={sp(f, fps, T("leaves") + 0.15, 9, 260)} bg={RED} x={540} y={700} rot={-7} /> : null}
      {mode === "bus" && T("kids") - t0 > 1.5 ? <Stamp text="PLOT TWIST" s={sp(f, fps, t0 + 0.05, 9, 260)} bg={YELLOW} fg={INK} x={540} y={420} rot={-6} /> : null}
      {mode === "chai2" ? <Stamp text="DAILY CHAI ✓" s={sp(f, fps, t0 + 1.5, 9, 260)} bg="#2f9e4f" x={540} y={560} rot={5} size={96} /> : null}
    </AbsoluteFill>
  );
};

/** wildlife-documentary camera bug: viewfinder corners, REC, a running timecode, and lower-third species labels */
const LABELS = (H.labels ?? []).map(([L, k, title, sub]) => ({ t: WL(L, k) - 0.1, title, sub, end: (WORDS_T.filter((w) => w.line === L).slice(-1)[0]?.end ?? 0) + 0.3 }));
export const DocBug: React.FC<{ labels: boolean }> = ({ labels }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  const secs = 14 * 60 + 52 + t; // starts at 08:14:52
  const tc = `08:${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(Math.floor(secs % 60)).padStart(2, "0")}`;
  const L = labels ? LABELS.find((x) => t >= x.t && t < x.end) : undefined;
  const s = L ? spring({ frame: f - Math.round(L.t * fps), fps, config: { damping: 15, stiffness: 170 } }) : 0;
  const corner = (x: number, y: number, r: number) => <path d="M 0 70 L 0 0 L 70 0" transform={`translate(${x} ${y}) rotate(${r})`} stroke="#fff" strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.85} />;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {corner(60, 70, 0)}{corner(1020, 70, 90)}{corner(1020, 1850, 180)}{corner(60, 1850, 270)}
        <circle cx={120} cy={140} r={16} fill={RED} opacity={Math.sin(t * 6) > -0.3 ? 1 : 0.2} />
        <text x={148} y={154} fontFamily={UI} fontWeight={800} fontSize={40} fill="#fff" stroke="#000" strokeWidth={2}>REC</text>
        <text x={960} y={154} textAnchor="end" fontFamily="monospace" fontWeight={700} fontSize={40} fill="#fff" stroke="#000" strokeWidth={1.5}>{tc}</text>
      </svg>
      {L ? (
        <div style={{ position: "absolute", left: 70, top: 1600, transform: `translateX(${(1 - s) * -700}px)`, fontFamily: UI }}>
          <div style={{ background: "rgba(20,20,20,.82)", color: "#fff", fontSize: 54, fontWeight: 800, padding: "10px 30px", borderLeft: `14px solid ${YELLOW}`, letterSpacing: -1 }}>{L.title}</div>
          <div style={{ background: YELLOW, color: INK, fontSize: 38, fontWeight: 700, fontStyle: "italic", padding: "6px 30px", display: "inline-block" }}>{L.sub}</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
