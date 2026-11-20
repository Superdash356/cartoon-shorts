// "Real how-to" kinetic explainer for the clipping tool (1080x1920): pastel UI cards that pop in on the spoken word,
// gradient keywords, phrase captions that fill in word by word, and Snip the mascot talking in the corner.
// Content comes from script.json (scenes) + words.json (voice timing); see RUNBOOK_CLIP.md.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BRAND, DUR, FPS, SCENES, SCRIPT, TOTAL, WORDS, speaking } from "./timeline";
import { SCENE_TYPES } from "./scenes";
import { Background, clamp, easeOut, GRAD, INK, Snip, UI, GradText } from "./ui";

export const CLIP_FRAMES = TOTAL;

// ---------------------------------------------------------------- captions: one phrase at a time, words fill in
type Phrase = { words: { w: string; s: number }[]; s: number; e: number };
// punctuation comes from the script text (the voice's word list has none): a phrase may end after "word," / "word."
const PUNCT = SCRIPT.lines.map((l) => l.text.split(/\s+/).map((w) => /[,.?!:;]$/.test(w)));
const PHRASES: Phrase[] = (() => {
  const out: Phrase[] = [];
  let cur: Phrase | null = null, k = 0;
  WORDS.forEach((x, i) => {
    const prev = WORDS[i - 1], gap = prev ? x.start - prev.end : 1;
    k = prev && x.line === prev.line ? k + 1 : 0;
    const after = prev ? !!PUNCT[prev.line]?.[k - 1] : false;
    const brk = !cur || x.line !== prev?.line || cur.words.length >= 6 || gap > 0.38 || (after && cur.words.length >= 2);
    if (brk) { if (cur) out.push(cur); cur = { words: [], s: x.start, e: x.end }; }
    cur!.words.push({ w: x.word, s: x.start }); cur!.e = x.end;
  });
  if (cur) out.push(cur);
  return out;
})();
const HL = new Set((SCRIPT.hl ?? []).map((x) => x.toLowerCase()));
const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9$]/g, "");
const show = (w: string) => (norm(w) === BRAND.keyword.toLowerCase() ? BRAND.keyword : w);

const Captions: React.FC<{ t: number }> = ({ t }) => {
  const k = PHRASES.findIndex((p, i) => t >= p.s - 0.08 && t < (PHRASES[i + 1]?.s ?? p.e + 0.8) - 0.08);
  if (k < 0) return null;
  const p = PHRASES[k], d = easeOut((t - p.s + 0.08) / 0.18);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1392, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div style={{ maxWidth: 940, padding: "18px 34px", borderRadius: 26, background: "rgba(255,255,255,.92)", boxShadow: "0 14px 40px rgba(90,50,150,.16)",
        fontFamily: UI, fontWeight: 800, fontSize: 50, lineHeight: 1.2, color: INK, textAlign: "center", letterSpacing: -0.5,
        opacity: d, transform: `translateY(${(1 - d) * 14}px)` }}>
        {p.words.map((w, i) => {
          const on = t >= w.s - 0.06, hl = HL.has(norm(w.w));
          return <span key={i} style={{ opacity: on ? 1 : 0.18 }}>{hl ? <GradText>{show(w.w)}</GradText> : show(w.w)}{i < p.words.length - 1 ? " " : ""}</span>;
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- scene wrapper: soft slide/fade between scenes
const SceneLayer: React.FC<{ t: number }> = ({ t }) => (
  <>
    {SCENES.filter((s) => t >= s.a - 0.02 && t < s.b + 0.25).map((s) => {
      const C = SCENE_TYPES[s.type];
      if (!C) return null;
      const out = clamp((t - s.b) / 0.25), inn = s.i === 0 ? 1 : easeOut((t - s.a) / 0.3);
      const drift = 1 + 0.025 * clamp((t - s.a) / Math.max(1, s.b - s.a));
      return (
        <AbsoluteFill key={s.i} style={{ opacity: inn * (1 - out), transform: `translateY(${(1 - inn) * 40 - out * 60}px) scale(${drift})` }}>
          <C s={s} t={t} />
        </AbsoluteFill>
      );
    })}
  </>
);

export const ClipExplainer: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const last = SCENES[SCENES.length - 1];
  return (
    <AbsoluteFill style={{ background: "#fbf9fd" }}>
      <Background t={t} />
      <SceneLayer t={t} />
      <Captions t={t} />
      <div style={{ position: "absolute", left: 56, top: 1555 }}><Snip t={t} talk={speaking(t)} size={160} happy={!!last && t > last.a + 1.2} /></div>
      <div style={{ position: "absolute", right: 48, top: 60, fontFamily: UI, fontWeight: 800, fontSize: 30, color: "rgba(40,20,70,.28)" }}>{BRAND.handle}</div>
      <div style={{ position: "absolute", left: 0, top: 0, height: 8, width: `${(t / DUR) * 100}%`, background: GRAD, opacity: 0.85 }} />
    </AbsoluteFill>
  );
};
