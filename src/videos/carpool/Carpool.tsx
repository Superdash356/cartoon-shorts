// "Four Neighbours, Four Cars": Sahyatri promo short. One three.js colony world (world.ts) posed per frame from the
// story timeline (story.ts), rendered through the bridge short's post chain (ink -> lens blur -> bloom -> neutral tone
// map -> grade), with three 2D overlays in Remotion: the group-chat flood, the real app screens, the end card.
import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, noInkFallback } from "../bridge/ink";
import { LensBlur } from "../bridge/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "../bridge/grade";
import { CarpoolWorld } from "./world";
import { FPS, TOTAL, END_CARD, W, shotAt, dofAt, ShotId } from "./story";

export const CARPOOL_FRAMES = TOTAL;
const Composer = EffectComposer as unknown as React.FC<{ multisampling: number; children?: React.ReactNode }>;
const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const Inner: React.FC<{ id: ShotId }> = ({ id }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new CarpoolWorld(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
  }), [camera, scene]);
  const post = useMemo(() => (
    <Composer multisampling={4}>
      <primitive object={fx.ink} dispose={null} />
      <primitive object={fx.lens.pre} dispose={null} />
      <primitive object={fx.lens.main} dispose={null} />
      <primitive object={fx.bloom} dispose={null} />
      <primitive object={fx.tone} dispose={null} />
      <primitive object={fx.grade} dispose={null} />
    </Composer>
  ), [fx]);
  const cam = camera as THREE.PerspectiveCamera;
  const target = world.update(id, f, cam, scene);
  noInkFallback(world.root);
  const d = dofAt(id);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus); else fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  gradeFor(fx.grade, "day");
  return (<><primitive object={world.root} dispose={null} />{post}</>);
};

// ---------------- 2D overlays ----------------
const GREEN = "#3f9a3a", YELLOW = "#f6cf4a", INK = "#141414";
const font = "'Poppins', 'Inter', 'Helvetica Neue', Arial, sans-serif";

/** the carpool group chat flooding before anyone leaves home; a counter races to 60 */
const CHAT = [
  ["Rohan", "Who's driving today?"], ["Priya", "Not me, I drove Monday"], ["Rohan", "Monday was a holiday"],
  ["Sharma ji", "5 min"], ["Arjun", "Leaving at 8:15 sharp"], ["Priya", "8:20?"], ["Rohan", "Who has the car today??"],
  ["Sharma ji", "2 min"], ["Arjun", "Where is everyone"], ["Priya", "Waiting at the gate"], ["Rohan", "Which gate"],
  ["Sharma ji", "Coming"], ["Arjun", "I'll just take my car"], ["Priya", "Me too"], ["Rohan", "Same"],
];
const NAME_COL: Record<string, string> = { Rohan: "#3f6fb5", Priya: "#c25a7a", Arjun: "#4f8a32", "Sharma ji": "#c98a12" };
const ChatOverlay: React.FC<{ t0: number; t1: number }> = ({ t0, t1 }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps, u = t - t0;
  const pop = spring({ frame: f - Math.round(t0 * fps), fps, config: { damping: 14, stiffness: 160 } });
  const out = interpolate(t, [t1 - 0.25, t1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // bubbles arrive faster and faster (ease-in): all 15 by the word "home"
  const n = Math.min(CHAT.length, Math.floor(CHAT.length * Math.pow(Math.max(0, u) / Math.max(0.1, W("home") - t0 - 0.2), 1.6)) + 1);
  const count = Math.min(60, Math.round(60 * Math.pow(Math.min(1, Math.max(0, u) / Math.max(0.1, W("sixty") - t0 + 0.4)), 1.3)));
  const shake = t > W("messages") - 0.1 && t < W("messages") + 0.25 ? Math.sin(f * 2.7) * 6 : 0;
  return (
    <AbsoluteFill style={{ background: `rgba(15,25,20,${0.35 * out})`, alignItems: "center", justifyContent: "center", opacity: out }}>
      <div style={{ width: 760, height: 1380, borderRadius: 90, background: "#111", padding: 22, transform: `scale(${0.6 + 0.4 * pop}) translateX(${shake}px) rotate(${(1 - pop) * -6}deg)`,
        boxShadow: "0 40px 90px rgba(0,0,0,.45)" }}>
        <div style={{ width: "100%", height: "100%", borderRadius: 70, background: "#efe7dc", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: font }}>
          <div style={{ background: "#1f6b4a", color: "#fff", padding: "54px 36px 26px", display: "flex", alignItems: "center", gap: 22 }}>
            <div style={{ width: 82, height: 82, borderRadius: 41, background: YELLOW, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 800, color: INK }}>CC</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 40, fontWeight: 700 }}>Colony Carpool</div>
              <div style={{ fontSize: 28, opacity: 0.85 }}>Rohan, Priya, Arjun, Sharma ji</div>
            </div>
            <div style={{ minWidth: 92, height: 92, borderRadius: 46, background: "#e5483a", color: "#fff", fontSize: 44, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
              transform: `scale(${1 + (t > W("sixty") - 0.1 && t < W("sixty") + 0.3 ? 0.35 : 0)})` }}>{count}</div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "18px 26px", gap: 14, overflow: "hidden" }}>
            {CHAT.slice(0, n).map(([who, msg], i) => {
              const mine = who === "Rohan";
              return (
                <div key={i} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "82%", background: mine ? "#d6f5c6" : "#fff", borderRadius: 28, padding: "16px 24px",
                  boxShadow: "0 2px 3px rgba(0,0,0,.12)" }}>
                  {!mine && <div style={{ fontSize: 26, fontWeight: 700, color: NAME_COL[who] }}>{who}</div>}
                  <div style={{ fontSize: 36, color: INK }}>{msg}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** the real app screens (cropped store screenshots), one per beat: roster -> ready -> live map */
const AppOverlay: React.FC<{ t0: number; t1: number }> = ({ t0, t1 }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  const beats: [string, number][] = [["home", t0], ["ready", W("everyone", 0) - 0.15], ["map", W("and", 0) - 0.15]];
  const i = beats.reduce((k, b, j) => (t >= b[1] ? j : k), 0);
  const [img, b0] = beats[i];
  const s = spring({ frame: f - Math.round(b0 * fps), fps, config: { damping: 15, stiffness: 170 } });
  const bg = interpolate(t, [t0, t0 + 0.2, t1 - 0.2, t1], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const zoom = 1 + 0.03 * (t - b0);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(178,214,96,${0.85 * bg}), rgba(52,140,52,${0.92 * bg}))`, alignItems: "center", justifyContent: "center" }}>
      <Img src={staticFile(`carpool/${img}.png`)} style={{ height: 1800, borderRadius: 36, opacity: bg, transform: `translateY(${(1 - s) * 260}px) scale(${(0.86 + 0.14 * s) * zoom})`,
        boxShadow: "0 30px 80px rgba(0,0,0,.35)" }} />
    </AbsoluteFill>
  );
};

/** the live map, small, popping in on "everyone can see exactly where" */
const MapCard: React.FC<{ t0: number }> = ({ t0 }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const s = spring({ frame: f - Math.round(t0 * fps), fps, config: { damping: 12, stiffness: 180 } });
  return (
    <AbsoluteFill style={{ alignItems: "flex-end", justifyContent: "flex-start", padding: "150px 60px" }}>
      <div style={{ width: 470, height: 560, borderRadius: 40, overflow: "hidden", border: "8px solid #fff", boxShadow: "0 24px 60px rgba(0,0,0,.35)",
        transform: `scale(${s}) rotate(${(1 - s) * 10 + 3}deg)`, transformOrigin: "80% 0%" }}>
        <Img src={staticFile("carpool/map.png")} style={{ width: 470, marginTop: -330, marginLeft: 0, transform: "scale(1.0)" }} />
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{ t0: number }> = ({ t0 }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const s = spring({ frame: f - Math.round(t0 * fps), fps, config: { damping: 14, stiffness: 140 } });
  const s2 = spring({ frame: f - Math.round((t0 + 0.35) * fps), fps, config: { damping: 14, stiffness: 140 } });
  const op = interpolate(f / fps, [t0, t0 + 0.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #b6db63 0%, #4fae46 55%, #2f7f34 100%)", opacity: op, alignItems: "center", justifyContent: "center", fontFamily: font }}>
      <div style={{ transform: `scale(${0.7 + 0.3 * s})`, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ fontSize: 150, fontWeight: 800, color: "#fff", letterSpacing: -3, textShadow: "0 6px 0 #2b6a2b" }}>sahyatri<span style={{ color: YELLOW }}>.</span></div>
        <div style={{ marginTop: 18, fontSize: 58, fontWeight: 700, color: INK, background: YELLOW, padding: "14px 40px", borderRadius: 26, border: `6px solid ${INK}`, transform: `rotate(-2deg) scale(${s2})` }}>
          Share the daily commute
        </div>
        <div style={{ marginTop: 60, fontSize: 44, color: "#fff", fontWeight: 600, opacity: s2 }}>Community Carpool · App Store &amp; Google Play</div>
      </div>
    </AbsoluteFill>
  );
};

export const CarpoolShort: React.FC = () => {
  const f = useCurrentFrame();
  const s = shotAt(f);
  return (
    <AbsoluteFill style={{ background: "#cfe3f2" }}>
      {s.id !== "end" && (
        <ThreeCanvas key={s.id} width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.15, far: 1500 }}>
          <Inner id={s.id} />
        </ThreeCanvas>
      )}
      {s.id === "chat" && <ChatOverlay t0={s.a / FPS} t1={s.b / FPS} />}
      {s.id === "app" && <AppOverlay t0={s.a / FPS} t1={s.b / FPS} />}
      {s.id === "where" && f / FPS > W("everyone", 2) - 0.2 && <MapCard t0={W("everyone", 2) - 0.2} />}
      {s.id === "end" && <EndCard t0={END_CARD} />}
      <Audio src={staticFile("carpool/voice.wav")} />
    </AbsoluteFill>
  );
};
