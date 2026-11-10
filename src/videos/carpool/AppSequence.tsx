// The app section of the carpool short (v2), built from the real Sahyatri UI kit (src/sahyatri-ui: the app's own tokens,
// Manrope, Ionicons, screens and motion values). One phone in a device frame on the brand green, four beats timed to the
// narration: Home ("So they got Sahyatri") -> Roster + driver notification ("The roster picks today's driver. No debate.")
// -> Your ride, a real tap on "I'm at the pickup point" ("Tap... and the driver knows you're ready") -> Live map with the
// car gliding in ("Then watch the car pull up. Live."). Camera moves are punch-ins on the UI element being talked about.
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import { HomeScreen, LiveMapScreen, NotificationCard, RideScreen, RosterScreen, Icon, mock, tokens } from "../../sahyatri-ui";
import { CUE as CUE0, STORY, hasCue } from "./story";

const { colors, palette, fontFamily, device } = tokens;
for (const [w, f] of [["400", "Regular"], ["500", "Medium"], ["600", "SemiBold"], ["700", "Bold"], ["800", "ExtraBold"]] as const) {
  loadFont({ family: "Manrope", url: staticFile(`fonts/Manrope_${w}${f}.ttf`), weight: w });
}

const ease = Easing.bezier(0.2, 0.8, 0.2, 1);
const clampI = (t: number, a: number[], b: number[], e = ease) => interpolate(t, a, b, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });

/** device bezel around a 390 x 844 screen */
const Device: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ width: device.width + 28, height: device.height + 28, borderRadius: 66, background: "#0d0d0f", padding: 14, boxSizing: "border-box",
    boxShadow: "0 50px 90px rgba(0,0,0,.38), inset 0 0 0 2px #2b2b30", position: "relative" }}>
    <div style={{ width: device.width, height: device.height, borderRadius: 52, overflow: "hidden", position: "relative", background: "#fff" }}>
      {children}
      <div style={{ position: "absolute", top: 11, left: "50%", width: 122, height: 35, marginLeft: -61, borderRadius: 18, background: "#000" }} />
    </div>
  </div>
);

/** brand backdrop: the store-art green with drifting dashed route arcs and yellow stops */
const Backdrop: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ background: `radial-gradient(120% 70% at 50% 18%, #b7dc68 0%, ${palette.green500} 42%, ${palette.green700} 100%)` }}>
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
      {[0, 1, 2, 3].map((i) => {
        const y = 260 + i * 470 + 30 * Math.sin(t * 0.8 + i);
        return (
          <g key={i}>
            <path d={`M -60 ${y + 120} Q 540 ${y - 120} 1140 ${y + 120}`} stroke="#fff" strokeWidth={10} strokeDasharray="28 26" strokeDashoffset={-t * 90 - i * 40} fill="none" strokeLinecap="round" />
            <circle cx={60 + ((t * 70 + i * 260) % 960)} cy={y + 40} r={16} fill={palette.yellow400} />
          </g>
        );
      })}
    </svg>
  </AbsoluteFill>
);

/** a finger-tap indicator: soft dot + expanding ring */
const Tap: React.FC<{ x: number; y: number; t: number; t0: number }> = ({ x, y, t, t0 }) => {
  const d = t - t0;
  if (d < -0.35 || d > 0.7) return null;
  const inA = clampI(d, [-0.35, -0.05], [0, 1]), ring = clampI(d, [0, 0.55], [0, 1], Easing.out(Easing.quad));
  return (
    <div style={{ position: "absolute", left: x - 60, top: y - 60, width: 120, height: 120, pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 30, borderRadius: 60, background: "rgba(20,20,20,.28)", opacity: inA * (1 - ring * 0.8), transform: `scale(${d > 0 ? 0.85 : 1})` }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 60, border: "6px solid rgba(255,255,255,.95)", opacity: (1 - ring) * (d > 0 ? 1 : 0), transform: `scale(${0.4 + ring})` }} />
    </div>
  );
};

/** a hard sticker in the app's PopButton style (yellow face, black hard shadow) */
const Sticker: React.FC<{ text: string; t: number; t0: number; x: number; y: number; rot?: number; icon?: "checkmark-circle" | "navigate" }> = ({ text, t, t0, x, y, rot = -6, icon }) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame: Math.round((t - t0) * fps), fps, config: { damping: 10, stiffness: 220 } });
  if (t < t0) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${0.3 + 0.7 * s})`, opacity: Math.min(1, s * 2) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: palette.yellow400, border: "6px solid #000", borderRadius: 26, padding: "14px 34px", boxShadow: "8px 8px 0 #000",
        fontFamily, fontWeight: 800, fontSize: 64, color: "#000", letterSpacing: -1.5, whiteSpace: "nowrap" }}>
        {icon ? <Icon name={icon} size={60} color="#000" /> : null}{text}
      </div>
    </div>
  );
};

type Beat = { id: "home" | "roster" | "ride" | "map"; t0: number };

export const AppSequence: React.FC<{ t0: number; t1: number }> = ({ t0, t1 }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  // beat cues from the story, or an even split of the app shot when the story leaves them out
  const D = t1 - t0, dflt: Record<string, number> = { roster: 0.22, driver: 0.32, tap: 0.5, ready: 0.6, watch: 0.72, live: 0.9 };
  const CUE = new Proxy({} as Record<string, number>, { get: (_o, k: string) => (hasCue(k) ? CUE0[k] : t0 + D * (dflt[k] ?? 0.5)) });
  const beats: Beat[] = [
    { id: "home", t0 },
    { id: "roster", t0: CUE.roster - 0.12 },
    { id: "ride", t0: CUE.tap - 0.45 },
    { id: "map", t0: CUE.watch - 0.12 },
  ];
  const bi = beats.reduce((k, b, j) => (t >= b.t0 ? j : k), 0);
  const cur = beats[bi], prev = bi > 0 ? beats[bi - 1] : null;
  const ms = (b: Beat) => Math.max(0, (t - b.t0) * 1000);

  // phone entrance: flies up from below with a tilt (spring), then floats
  const enter = spring({ frame: Math.round((t - t0) * fps), fps, config: { damping: 14, stiffness: 120 } });
  const exit = clampI(t, [t1 - 0.22, t1], [0, 1], Easing.in(Easing.quad));
  const float = Math.sin(t * 2.4) * 6;
  // per-beat camera on the phone: scale + focal point in screen px (390 x 844 space)
  const S = 1.78;
  const cam = (() => {
    const u = t - cur.t0;
    switch (cur.id) {
      case "home": return { z: 1 + 0.04 * clampI(u, [0, 1.2], [0, 1]), fx: 195, fy: 422 };
      case "roster": return { z: 1 + 0.05 * clampI(u, [0, 1.5], [0, 1]), fx: 195, fy: 422 };
      case "ride": {
        // push toward the button while tapping, then onto the green "ready" notice on "knows"
        const zIn = clampI(t, [CUE.tap - 0.45, CUE.tap], [1, 1.32]);
        const zNotice = clampI(t, [CUE.ready - 0.3, CUE.ready], [0, 1]);
        return { z: zIn + 0.12 * zNotice, fx: 195, fy: 560 + 40 * zNotice };
      }
      case "map": {
        const live = clampI(t, [CUE.live - 0.12, CUE.live + 0.05], [0, 1]);
        return { z: 1 + 0.03 * clampI(u, [0, 1.5], [0, 1]) + 0.55 * live, fx: 195 + 120 * live, fy: 422 - 330 * live };
      }
    }
  })();
  // screen push transitions (iOS slide_from_right 350 ms; the map uses fade_from_bottom)
  const tr = clampI(t, [cur.t0, cur.t0 + 0.35], [0, 1], Easing.bezier(0.25, 0.9, 0.3, 1));

  const screen = (b: Beat) => {
    switch (b.id) {
      case "home":
        return <HomeScreen {...mock.home} promoImageSrc={staticFile("carpool/hero-morning.webp")} timeMs={ms(b)} />;
      case "roster":
        return <RosterScreen {...mock.roster} illustrationSrc={staticFile("carpool/calendar-roster.webp")} timeMs={ms(b)} scrollY={clampI(t, [b.t0 + 0.5, b.t0 + 1.6], [0, 60])} />;
      case "ride": {
        const pressT = CUE.tap + 0.05, pressed = clampI(t, [pressT - 0.08, pressT], [0, 1]) * (1 - clampI(t, [pressT + 0.08, pressT + 0.25], [0, 1]));
        const ready = t > pressT + 0.25;
        return ready
          ? <RideScreen {...mock.rideReady} timeMs={Math.max(0, (t - pressT - 0.25) * 1000) + 600} />
          : <RideScreen {...mock.ride} timeMs={ms(b)} readyPressed={pressed} />;
      }
      case "map": {
        const p = clampI(t, [b.t0, t1 - 0.1], [0.1, 0.4], Easing.inOut(Easing.sin));
        const km = Math.max(0.1, 1.1 - (p - 0.1) * 3.2);
        return <LiveMapScreen {...mock.liveMap} driverTitle={`Arjun is ${km.toFixed(1)} km away`} map={mock.morningMap(p, -40, 40)} timeMs={ms(b)} />;
      }
    }
  };
  const isMap = cur.id === "map";
  const curStyle: React.CSSProperties = isMap
    ? { transform: `translateY(${(1 - tr) * 120}px)`, opacity: tr }
    : { transform: `translateX(${(1 - tr) * device.width}px)` };
  const prevStyle: React.CSSProperties = isMap ? {} : { transform: `translateX(${-tr * device.width * 0.3}px)`, filter: `brightness(${1 - 0.15 * tr})` };

  const tilt = (1 - enter) * 18;
  const tapPos = { x: 195, y: 581 }; // "I'm at the pickup point" button centre on the ride screen
  return (
    <AbsoluteFill style={{ opacity: 1 - exit }}>
      <Backdrop t={t} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 300 }}>
        <div style={{ transform: `translateY(${(1 - enter) * 1300 + float}px) perspective(2400px) rotateX(${tilt}deg) rotateZ(${(1 - enter) * -8}deg) scale(${S})`, transformOrigin: "50% 0%" }}>
          <div style={{ transform: `scale(${cam.z})`, transformOrigin: `${cam.fx + 14}px ${cam.fy + 14}px` }}>
            <Device>
              {prev && tr < 1 ? <div style={{ position: "absolute", inset: 0, ...prevStyle }}>{screen(prev)}</div> : null}
              <div style={{ position: "absolute", inset: 0, ...curStyle, boxShadow: !isMap && tr < 1 ? "-12px 0 30px rgba(0,0,0,.15)" : undefined }}>{screen(cur)}</div>
              {cur.id === "ride" ? <Tap x={tapPos.x} y={tapPos.y} t={t} t0={CUE.tap + 0.05} /> : null}
            </Device>
          </div>
        </div>
      </AbsoluteFill>
      {/* the driver notification drops in over the roster on "driver" */}
      {cur.id === "roster" && t > CUE.driver - 0.2 ? (
        <div style={{ position: "absolute", left: 540, top: 380, transform: `translate(-50%, ${(1 - spring({ frame: Math.round((t - CUE.driver + 0.2) * fps), fps, config: { damping: 15, stiffness: 160 } })) * -500}px) scale(2.25)`, transformOrigin: "50% 0%" }}>
          <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 18px 40px rgba(0,0,0,.25)" }}>
            <NotificationCard {...mock.notifications.driverAssigned} title={(STORY as unknown as { appDriverNote?: string }).appDriverNote ?? "Arjun is driving today"} body="Morning ride · 08:15 · Honda City" when="Just now" width={360} />
          </div>
        </div>
      ) : null}
      {cur.id === "roster" ? <Sticker text={STORY.appSticker ?? "NO DEBATE"} icon="checkmark-circle" t={t} t0={CUE.driver + 0.25} x={540} y={1520} rot={-5} /> : null}
      {hasCue("settle") && cur.id === "home" ? <Sticker text="SETTLE COSTS" t={t} t0={CUE0.settle - 0.05} x={540} y={1560} rot={-4} /> : null}
      {hasCue("skip") ? <Sticker text="SKIP TODAY" t={t} t0={CUE0.skip - 0.05} x={600} y={1260} rot={5} /> : null}
      {cur.id === "map" ? <Sticker text="LIVE" icon="navigate" t={t} t0={CUE.live - 0.05} x={760} y={1580} rot={6} /> : null}
    </AbsoluteFill>
  );
};

export { colors };
