// Prints the GitHub matrix of frame ranges: node scripts/plan-chunks.mjs <composition> <chunks> [from] [to]
import { bundle } from "@remotion/bundler";
import { selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
const [id, chunksArg = "20", fromArg = "", toArg = ""] = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const comp = await selectComposition({ serveUrl, id, chromiumOptions: { gl: "swangle" } });
const from = fromArg === "" ? 0 : Number(fromArg);
const to = toArg === "" ? comp.durationInFrames - 1 : Math.min(Number(toArg), comp.durationInFrames - 1);
const n = Math.max(1, Math.min(Number(chunksArg), to - from + 1));
const size = Math.ceil((to - from + 1) / n);
const include = [];
for (let i = 0; i < n; i++) {
  const a = from + i * size, b = Math.min(to, a + size - 1);
  if (a <= b) include.push({ idx: String(i).padStart(3, "0"), range: `${a}-${b}` });
}
const out = JSON.stringify({ include });
console.log(out);
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `matrix=${out}\n`);
