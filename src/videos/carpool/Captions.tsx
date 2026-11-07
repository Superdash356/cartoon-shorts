// Gen Z kinetic captions: 1-3 words at a time, Manrope ExtraBold, white with a heavy black outline, the spoken word in
// the app's yellow with a pop. Chunks break on long pauses (sentence ends) and after 3 words.
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { WORDS_T } from "./story";

type Chunk = { words: { w: string; s: number }[]; s: number; e: number };
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  let cur: Chunk | null = null;
  WORDS_T.forEach((x, i) => {
    const gap = i > 0 ? x.start - WORDS_T[i - 1].end : 1;
    if (!cur || cur.words.length >= 3 || gap > 0.22 || x.line !== WORDS_T[i - 1]?.line) { if (cur) out.push(cur); cur = { words: [], s: x.start, e: x.end }; }
    cur.words.push({ w: x.word, s: x.start }); cur.e = x.end;
  });
  if (cur) out.push(cur);
  return out;
})();
const BIG = new Set(["four", "bro", "sixty", "sahyatri", "live", "late", "three", "debate", "ready"]);

export const Captions: React.FC<{ y: number; size?: number }> = ({ y, size = 96 }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  const k = CHUNKS.findIndex((c, i) => t >= c.s - 0.05 && t < (CHUNKS[i + 1]?.s ?? c.e + 0.6) - 0.05);
  if (k < 0) return null;
  const c = CHUNKS[k], d = t - c.s + 0.05, pop = d < 0.12 ? 0.85 + 0.15 * Math.sin((d / 0.12) * Math.PI * 0.5) * 1.15 : 1;
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: y, width: 1000, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 26px", transform: `scale(${pop}) rotate(${(k % 2 ? 1 : -1) * 1.5}deg)` }}>
        {c.words.map((w, i) => {
          const on = t >= w.s - 0.03, active = on && (i === c.words.length - 1 || t < c.words[i + 1].s - 0.03);
          const big = BIG.has(w.w.toLowerCase().replace(/[^a-z]/g, ""));
          return (
            <span key={i} style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: size * (big ? 1.25 : 1), lineHeight: 1.08, letterSpacing: -2,
              color: active ? "#F2CF5B" : "#fff", opacity: on ? 1 : 0.0, textTransform: "uppercase",
              WebkitTextStroke: `${size * 0.16}px #000`, paintOrder: "stroke fill", textShadow: "0 8px 0 rgba(0,0,0,.55)",
              transform: active ? "scale(1.08) translateY(-4px)" : "none", display: "inline-block" }}>{w.w.replace(/'/g, "’")}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
