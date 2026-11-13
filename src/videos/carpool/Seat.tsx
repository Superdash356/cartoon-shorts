// "Dupatta seat" overlays (2026-11-13).
// SeatOverlay: top-down cartoon cabin of the pool car (right-hand drive, nose up). Driven by story.json:
//   seatItems: [[line, word, kind, place]]  kind = dupatta | tiffin | flask | cushion, place = front | back
//              each item drops onto its seat on its word and stays (they pile up on the front passenger seat)
//   seatTag:   text on the luggage tag tied to the dupatta (cue "tag" pops it on)
//   cue swap:  the dupatta slides from the passenger seat onto the driver's seat (a seat shot starting late in the
//              story, after the tag, shows only the dupatta + tag: the callback)
// TossOverlay: low side view at the gate: a coin flips, lands, rolls under the car's tyre into the drain. Driven by
//   tosses: [[line, word, coins]]  - each toss starts on its word; a "COINS LOST" counter ticks up as each one goes PLINK
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import { CUE, STORY, WL, hasCue } from "./story";

loadFont({ family: "Caveat", url: staticFile("fonts/Caveat.ttf"), weight: "400 700" });
const HAND = "Caveat, 'Comic Sans MS', cursive";
const UI = "Manrope, 'Helvetica Neue', Arial, sans-serif";
const INK = "#141414", YELLOW = "#f6cf4a", RED = "#d8362b";
const cl = (t: number, a: number[], b: number[], e = Easing.inOut(Easing.cubic)) => interpolate(t, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });

type Kind = "dupatta" | "tiffin" | "flask" | "cushion";
const S = STORY as unknown as { seatItems?: [number, number, Kind, string][]; seatTag?: string; tosses?: [number, number, number][] };
const ITEMS = (S.seatItems ?? []).map(([L, k, kind, place]) => ({ t: L === 0 && k === 0 ? -1 : WL(L, k) - 0.06, kind, place }));

// cabin layout (px)
const CAR = { x: 170, y: 250, w: 740, h: 1300 };
const FRONT_SEAT = { x: 250, y: 600, w: 270, h: 300 }; // passenger (left)
const DRIVER_SEAT = { x: 560, y: 600, w: 270, h: 300 }; // driver (right)
const BACK_SEAT = { x: 250, y: 1060, w: 580, h: 270 };
const SPOT: Record<string, [number, number]> = { front: [385, 720], driver: [695, 720], back: [380, 1170] };
const PILE: Record<Kind, [number, number, number]> = { dupatta: [0, 0, -8], tiffin: [-40, -95, 0], flask: [70, 60, 0], cushion: [0, 0, 6] };

const Seat: React.FC<{ r: { x: number; y: number; w: number; h: number }; bench?: boolean }> = ({ r, bench }) => (
  <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: r.h * 0.66, borderRadius: 34, background: "linear-gradient(180deg, #4d5563, #3b414c)",
      boxShadow: "inset 0 -10px 0 rgba(0,0,0,.18), 0 6px 0 #22262d" }}>
      {(bench ? [0.33, 0.66] : [0.5]).map((k, i) => <div key={i} style={{ position: "absolute", top: 20, bottom: 20, left: `${k * 100}%`, width: 6, background: "rgba(0,0,0,.18)", borderRadius: 3 }} />)}
    </div>
    <div style={{ position: "absolute", left: -10, right: -10, top: r.h * 0.62, height: r.h * 0.3, borderRadius: 26, background: "linear-gradient(180deg, #353a44, #2a2e36)", boxShadow: "0 8px 0 #1b1e24" }} />
    {(bench ? [0.17, 0.5, 0.83] : [0.5]).map((k, i) => (
      <div key={i} style={{ position: "absolute", left: `calc(${k * 100}% - 55px)`, top: r.h * 0.84, width: 110, height: 52, borderRadius: 22, background: "#2f343d", boxShadow: "0 5px 0 #1b1e24" }} />
    ))}
  </div>
);

const Dupatta: React.FC = () => (
  <svg width={330} height={250} viewBox="0 0 330 250" style={{ overflow: "visible" }}>
    <defs>
      <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="3.2" fill="#f7d36a" /></pattern>
    </defs>
    {/* lower fold */}
    <path d="M20 70 Q 160 40 310 78 L 300 210 Q 165 236 30 206 Z" fill="#b8175a" stroke={INK} strokeWidth={5} />
    {/* upper fold, drapes over */}
    <path d="M10 40 Q 165 0 320 44 L 312 150 Q 170 120 22 156 Z" fill="#e0307a" stroke={INK} strokeWidth={5} />
    <path d="M10 40 Q 165 0 320 44 L 312 150 Q 170 120 22 156 Z" fill="url(#dots)" opacity={0.65} />
    {/* gold borders */}
    <path d="M14 58 Q 165 18 318 62" fill="none" stroke="#f2b632" strokeWidth={12} />
    <path d="M22 140 Q 170 106 313 135" fill="none" stroke="#f2b632" strokeWidth={12} />
    {/* tassels on the hanging edge */}
    {Array.from({ length: 11 }, (_, i) => {
      const x = 40 + i * 25, y = 214 + 6 * Math.sin(i * 1.3);
      return <g key={i}><line x1={x} y1={y - 8} x2={x + 2} y2={y + 22} stroke="#f2b632" strokeWidth={5} strokeLinecap="round" /><circle cx={x + 2} cy={y + 26} r={6} fill="#f2b632" stroke={INK} strokeWidth={2} /></g>;
    })}
  </svg>
);
const Tiffin: React.FC = () => (
  <svg width={170} height={170} viewBox="0 0 170 170">
    <circle cx={85} cy={85} r={76} fill="#c7ccd3" stroke={INK} strokeWidth={5} />
    <circle cx={85} cy={85} r={58} fill="#e7eaee" stroke="#9aa1aa" strokeWidth={4} />
    <circle cx={85} cy={85} r={36} fill="#d5d9de" stroke="#9aa1aa" strokeWidth={4} />
    <rect x={12} y={77} width={146} height={16} rx={8} fill="#8d949d" stroke={INK} strokeWidth={4} />
    <circle cx={60} cy={58} r={9} fill="#fff" opacity={0.8} />
  </svg>
);
const Flask: React.FC = () => (
  <svg width={130} height={130} viewBox="0 0 130 130">
    <circle cx={65} cy={65} r={58} fill="#2d7fd0" stroke={INK} strokeWidth={5} />
    <circle cx={65} cy={65} r={38} fill="#d84b3a" stroke={INK} strokeWidth={4} />
    <circle cx={52} cy={52} r={8} fill="#fff" opacity={0.7} />
    {/* steam: still warm */}
    {[0, 1, 2].map((i) => <path key={i} d={`M${45 + i * 20} 20 q -10 -14 0 -26 q 10 -12 0 -24`} fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.85} />)}
  </svg>
);
const Cushion: React.FC = () => (
  <svg width={210} height={190} viewBox="0 0 210 190">
    <path d="M18 22 Q 105 2 192 22 Q 206 95 192 168 Q 105 188 18 168 Q 4 95 18 22 Z" fill="#8fd3c4" stroke={INK} strokeWidth={5} />
    <path d="M40 45 Q 105 30 170 45 Q 180 95 170 145 Q 105 160 40 145 Q 30 95 40 45 Z" fill="none" stroke="#5fae9f" strokeWidth={4} strokeDasharray="10 8" />
    <circle cx={105} cy={95} r={10} fill="#f0b429" stroke={INK} strokeWidth={3} />
  </svg>
);
const DRAW: Record<Kind, React.FC> = { dupatta: Dupatta, tiffin: Tiffin, flask: Flask, cushion: Cushion };
const SIZE: Record<Kind, [number, number]> = { dupatta: [330, 250], tiffin: [170, 170], flask: [130, 130], cushion: [210, 190] };

export const SeatOverlay: React.FC<{ t0: number; t1: number }> = ({ t0, t1 }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  const inA = cl(t, [t0, t0 + 0.16], [0, 1]), out = cl(t, [t1 - 0.12, t1], [1, 0]);
  const final = hasCue("swap") && t0 > CUE.swap - 4; // the callback shot: only the dupatta (and its tag) is left
  const sw = final ? cl(t, [CUE.swap - 0.05, CUE.swap + 0.6], [0, 1]) : 0;
  const zoom = 1 + 0.035 * Math.min(1, (t - t0) / 3);
  const tagOn = hasCue("tag") && t > CUE.tag - 0.08;
  const tagS = tagOn ? spring({ frame: f - Math.round((CUE.tag - 0.08) * fps), fps, config: { damping: 10, stiffness: 220 } }) : 0;
  const items = ITEMS.filter((it) => (final ? it.kind === "dupatta" : true));
  return (
    <AbsoluteFill style={{ opacity: inA * out, background: "radial-gradient(circle at 50% 45%, #5c626b, #2b2f35 75%)" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        {/* car body, top-down, nose up */}
        <div style={{ position: "absolute", left: CAR.x, top: CAR.y, width: CAR.w, height: CAR.h, borderRadius: "190px 190px 150px 150px", background: "#3d6db5",
          border: `8px solid ${INK}`, boxShadow: "0 30px 50px rgba(0,0,0,.45)" }} />
        {/* cabin floor */}
        <div style={{ position: "absolute", left: CAR.x + 50, top: CAR.y + 210, width: CAR.w - 100, height: CAR.h - 330, borderRadius: 60, background: "#c9b48f", border: `6px solid ${INK}` }} />
        {/* windscreen + dashboard */}
        <div style={{ position: "absolute", left: CAR.x + 70, top: CAR.y + 60, width: CAR.w - 140, height: 140, borderRadius: "90px 90px 20px 20px", background: "linear-gradient(180deg, #bfe4ff, #8cc6ef)", border: `6px solid ${INK}` }} />
        <div style={{ position: "absolute", left: CAR.x + 50, top: CAR.y + 210, width: CAR.w - 100, height: 90, borderRadius: "40px 40px 10px 10px", background: "#2b2f36", border: `6px solid ${INK}` }} />
        {/* steering wheel (right-hand drive) */}
        <div style={{ position: "absolute", left: DRIVER_SEAT.x + DRIVER_SEAT.w / 2 - 85, top: CAR.y + 250, width: 170, height: 70, borderRadius: "50%", border: `16px solid #1c1f24`, background: "transparent" }} />
        {/* rear window */}
        <div style={{ position: "absolute", left: CAR.x + 110, top: CAR.y + CAR.h - 120, width: CAR.w - 220, height: 70, borderRadius: "16px 16px 70px 70px", background: "linear-gradient(180deg, #8cc6ef, #bfe4ff)", border: `6px solid ${INK}` }} />
        <Seat r={FRONT_SEAT} />
        <Seat r={DRIVER_SEAT} />
        <Seat r={BACK_SEAT} bench />
        {/* seat labels */}
        <div style={{ position: "absolute", left: FRONT_SEAT.x, width: FRONT_SEAT.w, top: FRONT_SEAT.y - 44, textAlign: "center", fontFamily: UI, fontWeight: 800, fontSize: 30, color: "#fff", opacity: 0.85, letterSpacing: 2 }}>FRONT SEAT</div>
        <div style={{ position: "absolute", left: DRIVER_SEAT.x, width: DRIVER_SEAT.w, top: DRIVER_SEAT.y - 44, textAlign: "center", fontFamily: UI, fontWeight: 800, fontSize: 30, color: "#fff", opacity: 0.85, letterSpacing: 2 }}>DRIVER</div>
        {items.map((it, i) => {
          if (t < it.t) return null;
          const s = it.t < 0 ? 1 : spring({ frame: f - Math.round(it.t * fps), fps, config: { damping: 11, stiffness: 230 } });
          const [w, h] = SIZE[it.kind], [dx, dy, rot] = PILE[it.kind];
          let [x, y] = SPOT[it.place] ?? SPOT.front;
          if (it.kind === "dupatta" && sw > 0) { x = interpolate(sw, [0, 1], [SPOT.front[0], SPOT.driver[0]]); y = SPOT.front[1] - 120 * Math.sin(Math.PI * sw); }
          const Comp = DRAW[it.kind];
          return (
            <div key={i} style={{ position: "absolute", left: x + dx - w / 2, top: y + dy - h / 2, width: w, height: h, zIndex: it.kind === "dupatta" ? 1 : 2,
              transform: `rotate(${rot + (it.kind === "dupatta" ? 10 * Math.sin(Math.PI * sw) : 0)}deg) scale(${1.7 - 0.7 * s})`, opacity: Math.min(1, s * 2), filter: "drop-shadow(0 12px 10px rgba(0,0,0,.35))" }}>
              <Comp />
              {it.kind === "dupatta" && tagOn ? (
                <div style={{ position: "absolute", left: 40, top: 200, transformOrigin: "0% 0%", transform: `rotate(${-(rot + 6) + 3 * Math.sin(t * 3)}deg) scale(${tagS})` }}>
                  <svg width={60} height={60} style={{ position: "absolute", left: -20, top: -30 }}><path d="M10 10 Q 30 40 50 50" stroke={INK} strokeWidth={4} fill="none" /></svg>
                  <div style={{ position: "absolute", left: 20, top: 10, padding: "6px 22px 10px 44px", background: "#fbf3d9", border: `5px solid ${INK}`, borderRadius: "40px 14px 14px 40px",
                    fontFamily: HAND, fontWeight: 700, fontSize: 52, color: "#1c2f7a", boxShadow: "8px 8px 0 rgba(0,0,0,.35)", whiteSpace: "nowrap" }}>
                    <div style={{ position: "absolute", left: 14, top: "50%", width: 18, height: 18, marginTop: -9, borderRadius: 9, background: "#2b2f35" }} />
                    {S.seatTag ?? "RESERVED"}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------- the coin toss at the gate ----------------
const TOSSES = (S.tosses ?? []).map(([L, k, n]) => ({ t: WL(L, k) - 0.05, n }));
const FLIP = 0.6, ROLL = 0.5; // s
const GROUND = 1180, DRAIN = { x: 760, y: GROUND + 30, w: 240, h: 70 };
const Coin: React.FC<{ t: number; t0: number; k: number; n: number }> = ({ t, t0, k, n }) => {
  const u = t - t0 - k * 0.12;
  if (u < 0) return null;
  const off = (k - (n - 1) / 2) * 110;
  let x = 420 + off, y = GROUND - 30, sx = 1, sy = 1, rot = 0, op = 1;
  if (u < FLIP) { const p = u / FLIP; y = GROUND - 30 - 580 * 4 * p * (1 - p); sy = Math.cos(p * Math.PI * 9); }
  else if (u < FLIP + ROLL) { const p = (u - FLIP) / ROLL; x = interpolate(p, [0, 1], [420 + off, DRAIN.x + DRAIN.w / 2 + off * 0.3], { easing: Easing.in(Easing.quad) }); sx = 0.28; rot = p * 30; y = GROUND - 30; }
  else { const p = clamp((u - FLIP - ROLL) / 0.25); x = DRAIN.x + DRAIN.w / 2 + off * 0.3; y = GROUND - 30 + 60 * p; sx = 0.28; op = 1 - p; }
  return (
    <div style={{ position: "absolute", left: x - 70, top: y - 70, width: 140, height: 140, borderRadius: 70, opacity: op, transform: `rotate(${rot}deg) scale(${sx}, ${Math.max(0.08, Math.abs(sy))})`,
      background: sy < 0 ? "radial-gradient(circle at 40% 35%, #f3d36b, #b98a1d)" : "radial-gradient(circle at 40% 35%, #ffe69a, #d9a62a)", border: `6px solid ${INK}`,
      display: "flex", alignItems: "center", justifyContent: "center", fontFamily: UI, fontWeight: 800, fontSize: 70, color: "#7a5410" }}>{sy < 0 ? "" : "1"}</div>
  );
};
const clamp = (x: number) => Math.max(0, Math.min(1, x));

export const TossOverlay: React.FC<{ t0: number; t1: number }> = ({ t0, t1 }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  const inA = cl(t, [t0, t0 + 0.16], [0, 1]), out = cl(t, [t1 - 0.12, t1], [1, 0]);
  const plinks = TOSSES.flatMap((x) => Array.from({ length: x.n }, (_, k) => x.t + k * 0.12 + FLIP + ROLL + 0.1));
  const lost = plinks.filter((p) => t >= p).length;
  const lastP = plinks.filter((p) => t >= p).pop();
  const ps = lastP !== undefined ? spring({ frame: f - Math.round(lastP * fps), fps, config: { damping: 9, stiffness: 260 } }) : 0;
  const pOut = lastP !== undefined ? cl(t, [lastP + 0.7, lastP + 0.9], [1, 0]) : 0;
  const shake = lastP !== undefined && t - lastP < 0.2 ? Math.sin(f * 2.7) * 8 : 0;
  return (
    <AbsoluteFill style={{ opacity: inA * out, background: "linear-gradient(180deg, #9fd3f2 0%, #cfe9f7 40%)", transform: `translateX(${shake}px)` }}>
      {/* colony wall + gate pillars */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 640, height: 420, background: "#e9d9b8", borderTop: `8px solid ${INK}` }} />
      {[60, 900].map((x, i) => <div key={i} style={{ position: "absolute", left: x, top: 470, width: 120, height: 600, background: "#d7b98a", border: `7px solid ${INK}`, borderRadius: "14px 14px 0 0" }} />)}
      <div style={{ position: "absolute", left: 180, right: 180, top: 560, height: 30, background: "#2f343d" }} />
      {Array.from({ length: 9 }, (_, i) => <div key={i} style={{ position: "absolute", left: 200 + i * 80, top: 560, width: 14, height: 500, background: "#2f343d" }} />)}
      {/* road */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 1060, bottom: 0, background: "linear-gradient(180deg, #6a6f77, #4d5158)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 1060, height: 26, background: "#c9c2b4", borderBottom: `5px solid ${INK}` }} />
      {/* the drain */}
      <div style={{ position: "absolute", left: DRAIN.x, top: DRAIN.y, width: DRAIN.w, height: DRAIN.h, background: "#111", border: `7px solid ${INK}`, borderRadius: 10, display: "flex", justifyContent: "space-evenly" }}>
        {Array.from({ length: 7 }, (_, i) => <div key={i} style={{ width: 12, background: "#6a6f77" }} />)}
      </div>
      {/* the car's front tyre, coins roll under it */}
      <div style={{ position: "absolute", left: 470, top: 860, width: 560, height: 220, borderRadius: "60px 60px 0 0", background: "#3d6db5", border: `8px solid ${INK}` }} />
      <div style={{ position: "absolute", left: 520, top: 960, width: 220, height: 220, borderRadius: 110, background: "#1d1f23", border: `8px solid ${INK}` }}>
        <div style={{ position: "absolute", left: 55, top: 55, width: 94, height: 94, borderRadius: 47, background: "#b9bec6", border: `6px solid ${INK}` }} />
      </div>
      {TOSSES.map((x, i) => Array.from({ length: x.n }, (_, k) => <Coin key={`${i}-${k}`} t={t} t0={x.t} k={k} n={x.n} />))}
      {lastP !== undefined ? (
        <div style={{ position: "absolute", left: DRAIN.x + DRAIN.w / 2, top: DRAIN.y - 220, transform: `translate(-50%,0) rotate(8deg) scale(${ps})`, opacity: pOut,
          fontFamily: UI, fontWeight: 800, fontSize: 92, color: INK, background: YELLOW, border: `7px solid ${INK}`, borderRadius: 24, padding: "2px 34px", boxShadow: `9px 9px 0 ${INK}` }}>PLINK</div>
      ) : null}
      <div style={{ position: "absolute", left: 540, top: 1500, transform: "translateX(-50%) rotate(-3deg)", fontFamily: UI, fontWeight: 800, fontSize: 70, color: "#fff",
        background: RED, border: `7px solid ${INK}`, borderRadius: 22, padding: "6px 36px", boxShadow: `9px 9px 0 ${INK}`, whiteSpace: "nowrap" }}>COINS LOST: {lost}</div>
    </AbsoluteFill>
  );
};
