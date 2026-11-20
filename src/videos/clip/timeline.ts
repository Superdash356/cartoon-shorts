// Timing for the clip explainer: script.json (lines + scenes, cue points as [line, word]) + words.json (word onsets
// from the voice, each tagged with its line). Every [line, word] in the script resolves to seconds through tAt().
import SCRIPT_JSON from "./script.json";
import WORDS_JSON from "./words.json";
import BRAND_JSON from "./brand.json";

export const FPS = 30;
export type At = [number, number];
export type Word = { word: string; start: number; end: number; line: number };
export type Scene = { type: string; at: At; [k: string]: unknown };
export type Script = { title: string; hl?: string[]; lines: { text: string }[]; scenes: Scene[] };

export const SCRIPT = SCRIPT_JSON as unknown as Script;
export const WORDS = WORDS_JSON as unknown as Word[];
export const BRAND = BRAND_JSON as unknown as { name: string; handle: string; keyword: string };

const BY_LINE: number[][] = [];
WORDS.forEach((w) => { (BY_LINE[w.line] ??= []).push(w.start); });
export const SPEECH_END = WORDS.length ? WORDS[WORDS.length - 1].end : 10;
const LEAD = 0.1; // things appear a hair before the word is heard

/** seconds at which word `k` of line `L` starts (minus a small lead); missing words clamp to the line's last word */
export const tAt = (at?: At | null, fallback = 0): number => {
  if (!at) return fallback;
  const l = BY_LINE[at[0]];
  if (!l || !l.length) return fallback;
  return Math.max(0, l[Math.min(at[1], l.length - 1)] - LEAD);
};

export const TAIL = 2.4; // hold on the last scene after the voice ends
export const TOTAL = Math.ceil((SPEECH_END + TAIL) * FPS);
export const DUR = TOTAL / FPS;

export type Placed = Scene & { a: number; b: number; i: number };
export const SCENES: Placed[] = SCRIPT.scenes
  .map((s) => ({ ...s, a: s.at[0] === 0 && s.at[1] === 0 ? 0 : tAt(s.at) }))
  .sort((x, y) => x.a - y.a)
  .map((s, i, arr) => ({ ...s, b: i + 1 < arr.length ? arr[i + 1].a : DUR, i }));

/** true while any word is being spoken (drives the mascot's mouth) */
export const speaking = (t: number) => WORDS.some((w) => t >= w.start - 0.02 && t <= w.end + 0.02);

/** replace {name}/{handle}/{keyword} with the brand values */
export const fill = (s: string) => s.replace(/\{name\}/g, BRAND.name).replace(/\{handle\}/g, BRAND.handle).replace(/\{keyword\}/g, BRAND.keyword);
