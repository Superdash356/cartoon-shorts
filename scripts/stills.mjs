// usage: node scripts/stills.mjs <composition> <outPrefix> <frame,frame,...> [scale]   (bundles once, software GL)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
const [id, prefix, frames, scale = "0.5"] = process.argv.slice(2);
const B = ["/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell"].find((p) => fs.existsSync(p));
const browserExecutable = B ?? null, chromiumOptions = { gl: "swangle" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id, browserExecutable, chromiumOptions });
console.log("frames", composition.durationInFrames);
for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: f, output: `${prefix}${f}.jpg`, imageFormat: "jpeg", jpegQuality: 85, scale: Number(scale), browserExecutable, chromiumOptions,
    timeoutInMilliseconds: 240000, onBrowserLog: (l) => { if (l.type === "error" && !/404|favicon/.test(l.text)) console.log("[err]", l.text.slice(0, 300)); } });
  console.log("still", f, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
