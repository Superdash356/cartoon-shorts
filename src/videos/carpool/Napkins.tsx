// "Napkin maths" overlays (2026-11-10): the open glovebox where the carpool's petrol maths lives on paper napkins, and
// the engineer's doomed spreadsheet. Both are full-screen 2D overlays driven by story.json:
//   napkins: [[line, word, text]]  - each napkin lands on its word and stays (stacking) until cue "shut"
//   cues: flood (a pile of extra napkins pours out), big (the last napkin's amount gets circled), shut (napkins vanish,
//         lid closes, one samosa left), tabs / formula / error (spreadsheet beats)
//   sheet: {title, tabs[], cols[], rows[][], formula}
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import { CUE, STORY, WL, hasCue } from "./story";

loadFont({ family: "Caveat", url: staticFile("fonts/Caveat.ttf"), weight: "400 700" });
const HAND = "Caveat, 'Comic Sans MS', cursive";
const UI = "Manrope, 'Helvetica Neue', Arial, sans-serif";
const INK = "#1c2f7a", RED = "#d8362b", YELLOW = "#f6cf4a";
const cl = (t: number, a: number[], b: number[], e = Easing.out(Easing.cubic)) => interpolate(t, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });

type Napkin = { t: number; text: string };
const S = STORY as unknown as { napkins?: [number, number, string][]; sheet?: { title: string; tabs: string[]; cols: string[]; rows: string[][]; formula: string } };
const NAPKINS: Napkin[] = (S.napkins ?? []).map(([L, k, text]) => ({ t: WL(L, k) - 0.08, text }));
// the flood: scribbles on the pile that pours out at cue "flood" (deterministic pseudo-random layout)
const SCRIBBLES = ["₹??", "who paid??", "toll ✗", "samosa ×2", "Rohan → ?", "parking ₹?", "Priya ✓?", "ask Sharma ji", "petrol ÷ 4 ?", "₹ 170 (??)", "IOU", "paid? ✓✗"];
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const NapkinCard: React.FC<{ text: string; x: number; y: number; rot: number; s: number; size?: number; big?: boolean; circle?: number }> = ({ text, x, y, rot, s, size = 560, big, circle = 0 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: size, height: size, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${s})`, opacity: Math.min(1, s * 1.5) }}>
    <div style={{ position: "absolute", inset: 0, background: "#fbf7ec", borderRadius: 10, boxShadow: "0 18px 34px rgba(0,0,0,.35)",
      backgroundImage: "linear-gradient(90deg, transparent 49.6%, rgba(0,0,0,.07) 50%, transparent 50.4%), linear-gradient(0deg, transparent 49.6%, rgba(0,0,0,.07) 50%, transparent 50.4%)" }} />
    <div style={{ position: "absolute", inset: 16, border: "5px dotted rgba(120,110,90,.35)", borderRadius: 8 }} />
    <div style={{ position: "absolute", inset: 40, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", whiteSpace: "pre-line",
      fontFamily: HAND, fontWeight: 700, fontSize: big ? size * 0.15 : size * 0.12, lineHeight: 1.05, color: big ? RED : INK }}>{text}</div>
    {circle > 0 ? (
      <svg width={size} height={size} style={{ position: "absolute", inset: 0 }}>
        <ellipse cx={size / 2} cy={size * 0.7} rx={size * 0.4} ry={size * 0.16} fill="none" stroke={RED} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={2 * Math.PI * size * 0.3} strokeDashoffset={(1 - circle) * 2 * Math.PI * size * 0.3} transform={`rotate(-4 ${size / 2} ${size * 0.7})`} />
      </svg>
    ) : null}
  </div>
);

/** the open glovebox: dashboard panel, dark cavity, lid hinged at the bottom; napkins stack inside and spill out */
export const GloveboxOverlay: React.FC<{ t0: number; t1: number }> = ({ t0, t1 }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  const inA = cl(t, [t0, t0 + 0.2], [0, 1]), out = cl(t, [t1 - 0.18, t1], [1, 0]);
  const shut = hasCue("shut") ? CUE.shut : 1e6, closed = cl(t, [shut - 0.05, shut + 0.22], [0, 1], Easing.in(Easing.quad));
  const gone = t > shut - 0.35;
  const shake = Math.abs(t - shut - 0.22) < 0.12 ? Math.sin(f * 3.1) * 10 : (hasCue("flood") && t > CUE.flood && t < CUE.flood + 0.3 ? Math.sin(f * 2.3) * 8 : 0);
  const last = NAPKINS.length - 1;
  const circle = hasCue("big") ? cl(t, [CUE.big - 0.05, CUE.big + 0.35], [0, 1]) : 0;
  const floodN = hasCue("flood") ? Math.floor(cl(t, [CUE.flood - 0.1, CUE.flood + 0.6], [0, SCRIBBLES.length], Easing.linear)) : 0;
  return (
    <AbsoluteFill style={{ opacity: inA * out, background: "radial-gradient(130% 80% at 50% 35%, #5d5246 0%, #2c2620 70%, #17130f 100%)", transform: `translateX(${shake}px)` }}>
      {/* dashboard panel */}
      <div style={{ position: "absolute", left: -40, right: -40, top: 230, height: 1060, background: "linear-gradient(180deg, #7b6f61, #5d5347)", borderRadius: 80, boxShadow: "inset 0 -20px 40px rgba(0,0,0,.35)" }} />
      {/* cavity */}
      <div style={{ position: "absolute", left: 130, width: 820, top: 330, height: 620, borderRadius: 40, background: "linear-gradient(180deg, #120f0c, #2a241e)", boxShadow: "inset 0 30px 60px rgba(0,0,0,.8)" }} />
      {/* napkins in the cavity: the single samosa is all that's left after the shut */}
      {gone ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 1 - closed }}>
          <path d="M 460 860 L 540 700 L 620 860 Z" fill="#d79a3e" stroke="#7a4a14" strokeWidth={8} strokeLinejoin="round" />
        </svg>
      ) : (
        <>
          {NAPKINS.map((n, i) => {
            if (t < n.t) return null;
            const s = spring({ frame: f - Math.round(n.t * fps), fps, config: { damping: 12, stiffness: 190 } });
            const isLast = i === last && last > 0;
            // napkins after the flood land on top of the pile, centred and a bit bigger so they read
            const hero = !isLast && hasCue("flood") && n.t > CUE.flood;
            const rot = isLast ? -3 : hero ? 4 : [-8, 6, -4, 9, -10][i % 5];
            const y = isLast ? 780 : hero ? 700 : 640 + (i % 3) * 30;
            return <NapkinCard key={i} text={n.text} x={isLast || hero ? 540 : 480 + (i % 2) * 120} y={y} rot={rot} s={(isLast ? 1.5 : hero ? 1.25 : 1) * (0.6 + 0.4 * s)} size={isLast ? 600 : 560} big={isLast} circle={isLast ? circle : 0} />;
          })}
          {SCRIBBLES.slice(0, floodN).map((txt, i) => {
            const tf = (hasCue("flood") ? CUE.flood : 0) + i * 0.05;
            const s = spring({ frame: f - Math.round(tf * fps), fps, config: { damping: 13, stiffness: 210 } });
            const x = 150 + rnd(i) * 780, y = 520 + rnd(i + 40) * 760 + (1 - s) * -300, rot = -25 + rnd(i + 9) * 50;
            // the pile hides once the next napkin (Sharma ji's maths) lands so the hero napkins stay readable
            const nextT = NAPKINS.find((n) => n.t > tf + 0.5)?.t ?? 1e6;
            if (t > nextT) return null;
            return <NapkinCard key={"s" + i} text={txt} x={x} y={y} rot={rot} s={0.62 * s} size={400} />;
          })}
        </>
      )}
      {/* the lid: hinged at the cavity's bottom edge, swings up to close on "shut" */}
      {closed > 0.01 ? (
        <div style={{ position: "absolute", left: 110, width: 860, top: 310, height: 660, borderRadius: 44, transformOrigin: "50% 100%",
          transform: `perspective(1800px) rotateX(${-88 * (1 - closed)}deg)`, background: "linear-gradient(180deg, #8d8072, #6c6155)",
          boxShadow: "0 10px 30px rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 220, height: 46, borderRadius: 23, background: "#3d3630", boxShadow: "inset 0 6px 10px rgba(0,0,0,.5)" }} />
        </div>
      ) : null}
      {hasCue("samosa") && t > CUE.samosa - 0.1 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
          <g transform={`translate(540 1150) scale(${spring({ frame: f - Math.round((CUE.samosa - 0.1) * fps), fps, config: { damping: 8, stiffness: 230 } })}) rotate(-6)`}>
            <path d="M -110 70 L 0 -120 L 110 70 Z" fill="#d79a3e" stroke="#7a4a14" strokeWidth={10} strokeLinejoin="round" />
            <path d="M -40 20 Q 0 0 40 25" stroke="#a8691f" strokeWidth={8} fill="none" strokeLinecap="round" />
          </g>
        </svg>
      ) : null}
      {closed > 0.9 ? (
        <div style={{ position: "absolute", left: 540, top: 250, transform: `translate(-50%,0) rotate(-5deg) scale(${spring({ frame: f - Math.round((shut + 0.2) * fps), fps, config: { damping: 9, stiffness: 240 } })})`,
          fontFamily: UI, fontWeight: 800, fontSize: 96, color: "#141414", background: YELLOW, border: "8px solid #141414", borderRadius: 26, padding: "6px 44px", boxShadow: "10px 10px 0 #141414" }}>CLICK.</div>
      ) : null}
    </AbsoluteFill>
  );
};

/** the engineer's spreadsheet: tabs pop in, a samosa formula, then every cell turns into an error and the file greys out */
export const SheetOverlay: React.FC<{ t0: number; t1: number }> = ({ t0, t1 }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  const sh = S.sheet ?? { title: "sheet.xlsx", tabs: [], cols: [], rows: [], formula: "" };
  const pop = spring({ frame: f - Math.round(t0 * fps), fps, config: { damping: 14, stiffness: 170 } });
  const out = cl(t, [t1 - 0.2, t1], [1, 0]);
  const tabsT = hasCue("tabs") ? CUE.tabs : t0 + 0.8, fT = hasCue("formula") ? CUE.formula : t0 + 1.6, eT = hasCue("error") ? CUE.error : 1e6;
  const nTabs = Math.floor(cl(t, [tabsT - 0.15, tabsT + 0.5], [1, sh.tabs.length], Easing.linear));
  const err = t > eT - 0.05, dead = cl(t, [eT + 0.6, eT + 1.0], [0, 1]);
  const shake = t > eT - 0.05 && t < eT + 0.35 ? Math.sin(f * 2.9) * 12 : 0;
  const CC = ["#fde68a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff", "#fed7aa"];
  return (
    <AbsoluteFill style={{ background: `rgba(12,18,24,${0.6 * out})`, opacity: out, alignItems: "center", justifyContent: "center", fontFamily: UI }}>
      <div style={{ width: 980, borderRadius: 30, overflow: "hidden", background: "#fff", boxShadow: "0 40px 90px rgba(0,0,0,.5)", marginTop: 160,
        transform: `scale(${0.7 + 0.3 * pop}) translateX(${shake}px) rotate(${(1 - pop) * 5}deg)`, filter: `grayscale(${dead}) brightness(${1 - 0.35 * dead})` }}>
        <div style={{ background: "#1f7a46", color: "#fff", padding: "22px 30px", fontSize: 36, fontWeight: 800, display: "flex", gap: 18, alignItems: "center" }}>
          <div style={{ width: 46, height: 46, borderRadius: 10, background: "#fff", color: "#1f7a46", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>X</div>
          {sh.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 24px", borderBottom: "2px solid #ddd", fontSize: 32, color: "#333", background: "#f6f6f6" }}>
          <span style={{ fontStyle: "italic", fontWeight: 800, color: "#1f7a46" }}>fx</span>
          <span style={{ fontFamily: "monospace", fontSize: 30, opacity: t > fT - 0.1 ? 1 : 0, background: t > fT - 0.1 && t < fT + 0.8 ? "#fff3b0" : "transparent", padding: "2px 8px" }}>{sh.formula}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `70px repeat(${sh.cols.length}, 1fr)`, fontSize: 28 }}>
          <div style={{ background: "#eee", borderRight: "1px solid #ccc", borderBottom: "1px solid #ccc" }} />
          {sh.cols.map((c, j) => <div key={j} style={{ background: "#eee", padding: "8px 10px", fontWeight: 800, borderRight: "1px solid #ccc", borderBottom: "1px solid #ccc", color: "#444" }}>{c}</div>)}
          {sh.rows.map((row, i) => (
            <React.Fragment key={i}>
              <div style={{ background: "#eee", padding: "12px 8px", textAlign: "center", color: "#666", borderRight: "1px solid #ccc", borderBottom: "1px solid #ddd" }}>{i + 1}</div>
              {row.map((v, j) => {
                const e = err && cl(t, [eT - 0.05 + (i * 0.02 + j * 0.015), eT + 0.05 + (i * 0.02 + j * 0.015)], [0, 1]) > 0.5;
                return (
                  <div key={j} style={{ padding: "12px 10px", borderRight: "1px solid #ddd", borderBottom: "1px solid #ddd", whiteSpace: "nowrap", overflow: "hidden",
                    background: e ? "#fde2e0" : j === 0 ? "#fafafa" : CC[(i + j) % CC.length], color: e ? RED : "#222", fontWeight: e ? 800 : 600 }}>{e ? "#REF!" : v}</div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, padding: "12px 14px", background: "#f1f1f1", borderTop: "2px solid #ccc", overflow: "hidden" }}>
          {sh.tabs.slice(0, nTabs).map((x, i) => (
            <div key={i} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 22, fontWeight: 800, whiteSpace: "nowrap", background: CC[i % CC.length], border: i === nTabs - 1 ? "3px solid #1f7a46" : "3px solid transparent" }}>{x}</div>
          ))}
        </div>
      </div>
      {err ? (
        <div style={{ position: "absolute", left: 540, top: 330, transform: `translate(-50%,0) rotate(4deg) scale(${spring({ frame: f - Math.round(eT * fps), fps, config: { damping: 9, stiffness: 250 } })})`,
          fontWeight: 800, fontSize: 110, color: "#fff", background: RED, border: "8px solid #141414", borderRadius: 26, padding: "4px 46px", boxShadow: "10px 10px 0 #141414" }}>#REF!</div>
      ) : null}
    </AbsoluteFill>
  );
};
