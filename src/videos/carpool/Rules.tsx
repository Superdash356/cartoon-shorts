// "Boss's lift" overlays (2026-11-14): two secret rule lists.
// RulesOverlay page 0 ("rules" shot): the intern's phone notes app, rules ticking in one by one.
// RulesOverlay page 1 ("rules2" shot): the boss's spiral notebook in handwriting, with a "PLOT TWIST" stamp.
// Driven by story.json:
//   rulePages: [{ title, sub, items: [[line, word, text]] }]   - each item pops in on its word; the newest one glows
//   cue twist: the PLOT TWIST stamp slams onto the notebook page
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import { CUE, STORY, WL, hasCue } from "./story";

loadFont({ family: "Caveat", url: staticFile("fonts/Caveat.ttf"), weight: "400 700" });
const HAND = "Caveat, 'Comic Sans MS', cursive";
const UI = "Manrope, 'Helvetica Neue', Arial, sans-serif";
const INK = "#141414", YELLOW = "#f6cf4a", RED = "#d8362b", PEN = "#1c2f7a";
const cl = (t: number, a: number[], b: number[], e = Easing.out(Easing.cubic)) => interpolate(t, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });

type Page = { title: string; sub?: string; items: [number, number, string][] };
const PAGES = ((STORY as unknown as { rulePages?: Page[] }).rulePages ?? []).map((p) => ({
  ...p, items: p.items.map(([L, k, text]) => ({ t: WL(L, k) - 0.08, text })),
}));

const Item: React.FC<{ t: number; f: number; fps: number; it: { t: number; text: string }; i: number; newest: boolean; hand: boolean }> = ({ t, f, fps, it, i, newest, hand }) => {
  if (t < it.t) return null;
  const s = spring({ frame: f - Math.round(it.t * fps), fps, config: { damping: 12, stiffness: 220 } });
  const glow = newest ? 1 : 0;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 22, transform: `translateX(${(1 - s) * 140}px) scale(${0.85 + 0.15 * s})`, opacity: Math.min(1, s * 1.8),
      transformOrigin: "0% 50%", padding: "14px 18px", borderRadius: 22, background: glow ? (hand ? "rgba(246,207,74,.55)" : "rgba(246,207,74,.95)") : "transparent" }}>
      <div style={{ minWidth: 74, height: 74, borderRadius: 37, background: hand ? "transparent" : INK, border: hand ? `5px solid ${RED}` : "none", color: hand ? RED : YELLOW,
        fontFamily: hand ? HAND : UI, fontWeight: 800, fontSize: hand ? 62 : 44, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>{i + 1}</div>
      <div style={{ fontFamily: hand ? HAND : UI, fontWeight: hand ? 700 : 800, fontSize: hand ? 76 : 58, lineHeight: hand ? 1.0 : 1.12, color: hand ? PEN : INK,
        letterSpacing: hand ? 0 : -1 }}>{it.text}</div>
    </div>
  );
};

export const RulesOverlay: React.FC<{ t0: number; t1: number; page: number }> = ({ t0, t1, page }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  const P = PAGES[page] ?? { title: "", items: [] };
  const pop = spring({ frame: f - Math.round(t0 * fps), fps, config: { damping: 14, stiffness: 170 } });
  const out = cl(t, [t1 - 0.18, t1], [1, 0]);
  const shown = P.items.filter((x) => t >= x.t);
  const hand = page === 1;
  const twist = hand && hasCue("twist") ? spring({ frame: f - Math.round((CUE.twist - 0.05) * fps), fps, config: { damping: 9, stiffness: 260 } }) : 0;
  const shake = hand && hasCue("twist") && t > CUE.twist && t < CUE.twist + 0.22 ? Math.sin(f * 2.8) * 10 : 0;
  return (
    <AbsoluteFill style={{ background: hand ? `rgba(60,38,24,${0.55 * out})` : `rgba(14,18,26,${0.55 * out})`, opacity: out, alignItems: "center", justifyContent: "flex-start" }}>
      {!hand ? (
        // phone, notes app
        <div style={{ marginTop: 170, width: 800, height: 1260, borderRadius: 96, background: "#111", padding: 22, boxShadow: "0 40px 90px rgba(0,0,0,.5)",
          transform: `scale(${0.6 + 0.4 * pop}) rotate(${(1 - pop) * 7 - 1.5}deg)` }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 76, background: "#fffdf6", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "64px 54px 10px", fontFamily: UI, fontSize: 34, fontWeight: 700, color: "#d9a520" }}>‹ Notes</div>
            <div style={{ padding: "6px 54px 0", fontFamily: UI, fontSize: 62, fontWeight: 800, color: INK, letterSpacing: -1.5, lineHeight: 1.05 }}>{P.title}</div>
            {P.sub ? <div style={{ padding: "12px 54px 26px", fontFamily: UI, fontSize: 34, fontWeight: 700, color: RED }}>{P.sub}</div> : null}
            <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: "10px 34px" }}>
              {P.items.map((it, i) => <Item key={i} t={t} f={f} fps={fps} it={it} i={i} newest={it === shown[shown.length - 1]} hand={false} />)}
            </div>
          </div>
        </div>
      ) : (
        // spiral notebook page, handwriting
        <div style={{ marginTop: 230, width: 860, height: 1140, position: "relative", transform: `scale(${0.6 + 0.4 * pop}) rotate(${(1 - pop) * -8 + 2}deg) translateX(${shake}px)` }}>
          <div style={{ position: "absolute", inset: 0, background: "#fbfaf2", borderRadius: 18, boxShadow: "0 30px 70px rgba(0,0,0,.45)",
            backgroundImage: "repeating-linear-gradient(0deg, transparent 0 77px, rgba(70,110,200,.2) 77px 80px)" }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 118, width: 5, background: "rgba(216,54,43,.55)" }} />
          {Array.from({ length: 11 }, (_, i) => (
            <div key={i} style={{ position: "absolute", left: 40 + i * 76, top: -34, width: 30, height: 70, borderRadius: 15, border: "7px solid #8a8f98", background: "transparent" }} />
          ))}
          <div style={{ position: "absolute", left: 150, right: 40, top: 70, fontFamily: HAND, fontWeight: 700, fontSize: 104, color: PEN, lineHeight: 1 }}>{P.title}</div>
          {P.sub ? <div style={{ position: "absolute", left: 152, top: 190, fontFamily: HAND, fontWeight: 700, fontSize: 56, color: RED }}>{P.sub}</div> : null}
          <div style={{ position: "absolute", left: 130, right: 40, top: 300, display: "flex", flexDirection: "column", gap: 30 }}>
            {P.items.map((it, i) => <Item key={i} t={t} f={f} fps={fps} it={it} i={i} newest={it === shown[shown.length - 1]} hand />)}
          </div>
          {twist > 0 ? (
            <div style={{ position: "absolute", right: -30, bottom: 70, transform: `rotate(-9deg) scale(${2.4 - 1.4 * twist})`, opacity: Math.min(1, twist * 1.6), fontFamily: UI, fontWeight: 800,
              fontSize: 96, letterSpacing: -2, color: INK, background: YELLOW, border: `9px solid ${INK}`, borderRadius: 26, padding: "4px 38px 10px", boxShadow: `12px 12px 0 ${INK}` }}>PLOT TWIST</div>
          ) : null}
        </div>
      )}
    </AbsoluteFill>
  );
};
