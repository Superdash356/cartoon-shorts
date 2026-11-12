// "Car in service" overlay (2026-11-12): a paper carpool roster taped across the seam of the colony's steel lift doors.
// Driven by story.json:
//   liftRoster: {title, rows: [[day, name]]}
//   liftNotes: [[line, word, text]]   - yellow sticky notes slap onto the Wednesday row on their word and stack
//   cues: wed (red ring round the Wednesday row), split (the lift doors slide open and tear the roster in half)
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import { CUE, STORY, WL, hasCue } from "./story";

loadFont({ family: "Caveat", url: staticFile("fonts/Caveat.ttf"), weight: "400 700" });
const HAND = "Caveat, 'Comic Sans MS', cursive";
const UI = "Manrope, 'Helvetica Neue', Arial, sans-serif";
const INK = "#1c2f7a", RED = "#d8362b", YELLOW = "#f6cf4a";
const cl = (t: number, a: number[], b: number[], e = Easing.out(Easing.cubic)) => interpolate(t, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });

const S = STORY as unknown as { liftRoster?: { title: string; rows: [string, string][] }; liftNotes?: [number, number, string][] };
const ROSTER = S.liftRoster ?? { title: "ROSTER", rows: [] };
const NOTES = (S.liftNotes ?? []).map(([L, k, text]) => ({ t: WL(L, k) - 0.08, text }));
const WED = Math.max(0, ROSTER.rows.findIndex((r) => r[0].toUpperCase().startsWith("WED")));

// paper geometry (screen px)
const PX = 170, PY = 330, PW = 740, PH = 1000, ROW0 = 250, ROWH = 128;
// jagged tear down the middle of the paper (x in paper space), same path for both halves
const TEAR = Array.from({ length: 21 }, (_, i) => [PW / 2 + (i % 2 ? 18 : -14) + ((i * 37) % 11) - 5, (PH * i) / 20] as const);
const clipHalf = (left: boolean) => {
  const pts = TEAR.map(([x, y]) => `${x}px ${y}px`);
  return left ? `polygon(0px 0px, ${pts.join(", ")}, 0px ${PH}px)` : `polygon(${PW}px 0px, ${pts.join(", ")}, ${PW}px ${PH}px)`;
};

const Paper: React.FC<{ t: number; f: number; fps: number }> = ({ t, f, fps }) => {
  const ring = hasCue("wed") ? cl(t, [CUE.wed - 0.05, CUE.wed + 0.35], [0, 1]) : 0;
  const rowY = ROW0 + WED * ROWH;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fbfaf4", boxShadow: "0 20px 40px rgba(0,0,0,.35)", fontFamily: HAND, color: INK,
      backgroundImage: "repeating-linear-gradient(0deg, transparent 0 63px, rgba(70,110,200,.16) 63px 65px)" }}>
      <div style={{ position: "absolute", top: 70, width: "100%", textAlign: "center", fontWeight: 700, fontSize: 92, letterSpacing: 2 }}>{ROSTER.title}</div>
      <div style={{ position: "absolute", top: 180, left: 60, right: 60, height: 6, background: INK, opacity: 0.7, borderRadius: 3 }} />
      {ROSTER.rows.map(([d, n], i) => (
        <div key={i} style={{ position: "absolute", left: 70, right: 60, top: ROW0 + i * ROWH, height: ROWH, display: "flex", alignItems: "center", fontSize: 84, fontWeight: 700 }}>
          <span style={{ width: 210, color: RED }}>{d}</span>
          <span>{n}</span>
        </div>
      ))}
      {ring > 0 ? (
        <svg width={PW} height={PH} style={{ position: "absolute", inset: 0 }}>
          <ellipse cx={PW / 2} cy={rowY + ROWH / 2} rx={PW * 0.46} ry={ROWH * 0.55} fill="none" stroke={RED} strokeWidth={10} strokeLinecap="round"
            strokeDasharray={2 * Math.PI * PW * 0.36} strokeDashoffset={(1 - ring) * 2 * Math.PI * PW * 0.36} transform={`rotate(-3 ${PW / 2} ${rowY + ROWH / 2})`} />
        </svg>
      ) : null}
      {/* tape strips */}
      {[[40, -20, -12], [PW - 200, -20, 10], [40, PH - 30, 8], [PW - 200, PH - 30, -9]].map(([x, y, r], i) => (
        <div key={i} style={{ position: "absolute", left: x, top: y, width: 160, height: 50, background: "rgba(235,225,190,.75)", transform: `rotate(${r}deg)` }} />
      ))}
      {NOTES.map((n, i) => {
        if (t < n.t) return null;
        const s = spring({ frame: f - Math.round(n.t * fps), fps, config: { damping: 11, stiffness: 230 } });
        const x = PW - 330 - i * 40, y = rowY - 120 - i * 70, rot = [-7, 6, -3][i % 3];
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: 320, height: 300, transform: `rotate(${rot}deg) scale(${1.6 - 0.6 * s})`, opacity: Math.min(1, s * 2),
            background: YELLOW, boxShadow: "0 14px 22px rgba(0,0,0,.3)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
            whiteSpace: "pre-line", fontFamily: HAND, fontWeight: 700, fontSize: 64, lineHeight: 1.0, color: "#222", padding: 20, boxSizing: "border-box" }}>{n.text}</div>
        );
      })}
    </div>
  );
};

export const LiftOverlay: React.FC<{ t0: number; t1: number }> = ({ t0, t1 }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  const inA = cl(t, [t0, t0 + 0.18], [0, 1]), out = cl(t, [t1 - 0.15, t1], [1, 0]);
  // the doors open on "split": each half slides out; the paper tears and its halves ride along, tilting
  const sp = hasCue("split") ? cl(t, [CUE.split - 0.05, CUE.split + 0.7], [0, 1], Easing.inOut(Easing.cubic)) : 0;
  const open = sp * 470;
  const ding = hasCue("split") && t > CUE.split - 0.35;
  const shake = hasCue("split") && t > CUE.split + 0.2 && t < CUE.split + 0.45 ? Math.sin(f * 2.9) * 9 : 0;
  const door = (left: boolean): React.CSSProperties => ({
    position: "absolute", top: 180, bottom: 0, width: 520, left: left ? 20 - open : 540 + open,
    background: "linear-gradient(90deg, #8c939b, #c9ced3 30%, #a5abb2 55%, #d7dbdf 80%, #959ca4)",
    boxShadow: left ? "inset -4px 0 0 #6e747b" : "inset 4px 0 0 #6e747b",
  });
  const half = (left: boolean): React.CSSProperties => ({
    position: "absolute", left: PX + (left ? -open : open), top: PY + sp * 60, width: PW, height: PH,
    clipPath: clipHalf(left), transform: `rotate(${(left ? -1 : 1) * sp * 9}deg)`, transformOrigin: left ? "0% 0%" : "100% 0%",
  });
  return (
    <AbsoluteFill style={{ opacity: inA * out, background: "#3a3f47", transform: `translateX(${shake}px)` }}>
      {/* lift car interior, seen when the doors part */}
      <div style={{ position: "absolute", left: 40, right: 40, top: 180, bottom: 0, background: "linear-gradient(180deg, #f3e3b8, #d9c18a)" }}>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 380, background: "#7e6a4c" }} />
      </div>
      {/* frame + floor indicator */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 180, background: "linear-gradient(180deg, #5b616a, #464b53)" }} />
      <div style={{ position: "absolute", left: 540, top: 40, transform: "translateX(-50%)", width: 220, height: 100, borderRadius: 18, background: "#111", display: "flex",
        alignItems: "center", justifyContent: "center", gap: 18, fontFamily: UI, fontWeight: 800, fontSize: 64, color: ding ? "#ff6b4a" : "#7a3a2c" }}>
        <span style={{ fontSize: 44 }}>▼</span>G
      </div>
      <div style={door(true)} />
      <div style={door(false)} />
      {sp > 0 ? (
        <>
          <div style={half(true)}><Paper t={t} f={f} fps={fps} /></div>
          <div style={half(false)}><Paper t={t} f={f} fps={fps} /></div>
        </>
      ) : (
        <div style={{ position: "absolute", left: PX, top: PY, width: PW, height: PH }}><Paper t={t} f={f} fps={fps} /></div>
      )}
      {sp > 0.35 ? (
        <div style={{ position: "absolute", left: 540, top: 1120, transform: `translate(-50%,0) rotate(-6deg) scale(${spring({ frame: f - Math.round((CUE.split + 0.3) * fps), fps, config: { damping: 9, stiffness: 240 } })})`,
          fontFamily: UI, fontWeight: 800, fontSize: 110, color: "#141414", background: YELLOW, border: "8px solid #141414", borderRadius: 26, padding: "4px 46px", boxShadow: "10px 10px 0 #141414" }}>RRRIP</div>
      ) : null}
    </AbsoluteFill>
  );
};
