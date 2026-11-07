// "Four Neighbours, Four Cars" (v2: Gen Z narration, Zack D. Films pacing) — a ~31 s promo short for Sahyatri Community Carpool.
// Everything is timed to the voice word onsets (words.json, tightened narration). Ground is y = 0, the colony lane runs
// along x (cars drive toward +x, Indian left-hand traffic: the outbound lane is z < 0), the colony gate is at x = 34,
// the main road (4 lanes, signal at x = 96) continues to the office car park at x ~ 135.
import WORDS from "./words.json";

export const FPS = 30;
export type V3 = [number, number, number];
const words = WORDS as { word: string; start: number; end: number; line: number }[];
/** onset (s) of the n-th occurrence (0-based) of a word */
export const W = (w: string, n = 0) => {
  const l = words.filter((x) => x.word.toLowerCase().replace(/[^a-z']/g, "") === w.toLowerCase());
  return (l[n] ?? l[l.length - 1]).start;
};
/** onset (s) of word index i in words.json */
export const WI = (i: number) => words[Math.min(i, words.length - 1)].start;
export const WORDS_T = words;
export const VOICE_END = words[words.length - 1].end;
export const END_CARD = WI(98) - 0.1; // "Sahyatri. Carpool, sorted." over the end card
export const TOTAL = Math.ceil((VOICE_END + 0.75) * FPS);

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
/** reactions land 0-3 frames before their word */
export const LEAD = 2 / FPS;

// ---------------- world layout ----------------
export const HOUSE_X = [-21, -7, 7, 21];
export const HOUSE_Z = -14; // house centres (fronts at z = -10)
export const DOOR_Z = -9.6;
export const PARK_Z = -5.3; // parked cars along the lane edge, facing +x
export const LANE_Z = -1.75;
export const GATE_X = 34;
export const STOP_X = 96; // signal stop line
export const SIGNAL_LANES = [-5.4, -1.8, 1.8, 5.4];
export const LOT = { x: [131.5, 134.5, 137.5, 140.5], z: -15.5 }; // office bays (car noses toward -z)
export const CLOCK = { x: 38.68, y: 1.75, z: -7.5, r: 0.55 }; // booth wall clock (face toward +x)

// ---------------- shots ----------------
export type ShotId = "street" | "office" | "walk" | "clock" | "gate" | "signal" | "signal2" | "bro" | "doors" | "chat" | "app" | "onecar" | "lot" | "late" | "where" | "end";
export type Shot = { id: ShotId; a: number; b: number };
const S = (id: ShotId, t0: number, t1: number): Shot => ({ id, a: Math.round(t0 * FPS), b: Math.round(t1 * FPS) });
/** cut ~3 frames before word i */
const cw = (i: number) => (i === 0 ? 0 : WI(i) - 0.1);
// word indices (words.json): 0 Four 2 Same(office) 4 Same(time) 6 Four 7 Different 8 Cars 9 Every 13 wave 17 at(every single red light)
// 22 Bro 27 They 31 The(group chat) 35 sixty 43 So 46 Sahyatri 47 The(roster) 52 No 54 Tap 58 pickup 63 knows 66 Then 72 Live
// 73 Now 75 one 77 four 80 three 85 Sharma 91 But 93 everyone 98 Sahyatri
export const SHOTS: Shot[] = [
  S("street", cw(0), cw(2)),
  S("office", cw(2), cw(4)),
  S("clock", cw(4), cw(6)),
  S("gate", cw(6), cw(9)),
  S("signal", cw(9), cw(17)),
  S("signal2", cw(17), cw(22)),
  S("bro", cw(22), cw(27)),
  S("doors", cw(27), cw(31)),
  S("chat", cw(31), cw(43)),
  S("app", cw(43), cw(73)),
  S("onecar", cw(73), cw(80)),
  S("lot", cw(80), cw(85)),
  S("late", cw(85), cw(91)),
  S("where", cw(91), END_CARD),
  S("end", END_CARD, TOTAL / FPS + 1),
];
SHOTS[SHOTS.length - 1].b = TOTAL;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
/** shots drawn under a full-screen 2D overlay: the 3D layer just needs a soft background */
export const OVERLAY: Partial<Record<ShotId, true>> = { chat: true, app: true, end: true };

// ---------------- motion ----------------
// four neighbours, index i lives in house i; car i is parked in front of house i
export const CAR_COL = ["#f2efe8", "#c8423a", "#3d6db5", "#b9bec6"];
export const POOL_CAR = 2; // the blue one becomes today's carpool car
export type CarPose = { x: number; z: number; yaw: number; on: boolean; riders: number[]; owner: number };
export const WAIT_X = 14.5; // the carpool car waits here for Sharma ji
/** where every car is at time t (s), for the colony / gate shots */
export const carsAt = (id: ShotId, t: number): CarPose[] => {
  const parked = (i: number): CarPose => ({ x: HOUSE_X[i] + 2.6, z: PARK_Z, yaw: 0, on: true, riders: [], owner: i });
  switch (id) {
    case "street": case "doors": return [0, 1, 2, 3].map(parked);
    case "walk": case "office": case "clock": return [0, 1, 2, 3].map(parked);
    case "gate": {
      // nose to tail through the gate: the gate shot shows them already on the lane, rolling out one after another
      const tg = shotAt(Math.round(t * FPS)).a / FPS;
      return [3, 2, 1, 0].map((i, k) => ({ x: GATE_X - 1 + 5.5 * (t - tg) - 6.8 * k, z: LANE_Z, yaw: 0, on: true, riders: [i], owner: i }));
    }
    case "onecar": {
      const t0 = WI(75) - 0.5, s = Math.max(0, (t - t0)) * 6.5;
      return [0, 1, 3].map(parked).concat([{ x: GATE_X - 9 + s, z: LANE_Z, yaw: 0, on: true, riders: [2, 0, 1, 3], owner: POOL_CAR }]);
    }
    case "late": case "where": {
      const cars = [0, 1, 3].map(parked);
      cars.push({ x: WAIT_X, z: LANE_Z, yaw: 0, on: true, riders: [2, 0, 1], owner: POOL_CAR });
      return cars;
    }
    default: return [];
  }
};
/** the signal: four cars side by side at the stop line, braking in just after the cut */
export const signalCars = (t: number): CarPose[] => {
  const t0 = WI(9) - 0.15;
  return [0, 1, 2, 3].map((i) => {
    const u = clamp01((t - t0) / (0.7 + 0.12 * i)), x = STOP_X - 2.3 - (1 - (1 - u) ** 3) * 0 - (1 - u) ** 2 * (6 + i * 1.5) - 0.4 * [0, 1, 0, 1][i];
    const who = [1, 3, 0, 2][i];
    return { x, z: SIGNAL_LANES[i], yaw: 0, on: true, riders: [who], owner: who };
  });
};
/** the carpool car pulling into bay 1 of the office lot */
export const lotCar = (t: number): CarPose => {
  const t0 = WI(80) - 0.35, u = glide((t - t0) / 1.6);
  return { x: LOT.x[0], z: lerp(-6.5, LOT.z, u), yaw: -Math.PI / 2, on: true, riders: [2, 0, 1, 3], owner: POOL_CAR };
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
/** dolly toward the look point by k (<1 = closer) */
const dolly = (pos: V3, look: V3, k: number): V3 => [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k];
/** continuous push-in: ~rate per frame since frame f0 */
const push = (f: number, f0: number, rate = 0.0025) => Math.exp(-rate * Math.max(0, f - f0));
const tf = (s: ShotId) => SHOTS.find((x) => x.id === s)!.a;
const C = (pos: V3, look: V3, fov = 40, roll = 0): Cam => ({ pos, look, fov, roll });
/** word punches: a quick zoom-in kick that settles over ~0.25 s (Zack D. style emphasis) */
export const PUNCH = [0, 2, 4, 5, 6, 7, 8, 22, 26, 35, 52, 72, 75, 77, 80, 85];
export const punchAt = (t: number) => {
  let k = 0;
  for (const i of PUNCH) { const d = t - (WI(i) - 0.03); if (d >= 0 && d < 0.6) k = Math.max(k, Math.exp(-d / 0.09)); }
  return k;
};
export const camAt = (id: ShotId, f: number): Cam => {
  const c = camAt0(id, f), k = punchAt(f / FPS);
  return { ...c, fov: c.fov * (1 - 0.1 * k), roll: c.roll + 0.02 * k * Math.sin(f * 1.7) };
};
const camAt0 = (id: ShotId, f: number): Cam => {
  const t = f / FPS, a = tf(id);
  switch (id) {
    case "street": { // high 3/4 over the lane: four houses, four doors, four parked cars
      const L: V3 = [0, 1.5, -7.5];
      return C(dolly([-27, 5.0, 5], L, push(f, a, 0.003)), L, 42, 0);
    }
    case "walk": { // lower, closer: neighbours reach their cars in sync
      const L: V3 = [-7.5, 1.1, -7.2];
      return C(dolly([-4.6, 1.6, 4.2], L, push(f, a, 0.003)), L, 42, -0.04);
    }
    case "clock": { // tight on the booth clock: whip-roll in, hands snap to 9:00 on "time", hard punch
      const L: V3 = [CLOCK.x, CLOCK.y, CLOCK.z], u = (f - a) / FPS, whip = Math.exp(-u / 0.12);
      return C(dolly([CLOCK.x + 2.3, CLOCK.y - 0.25, CLOCK.z + 0.55], L, push(f, a, 0.012)), L, 28 * (1 + 0.5 * whip), -0.35 * whip + 0.05);
    }
    case "office": { // low and heroic on the office block: "same office"
      const L: V3 = [139, 6.5, -24];
      return C(dolly([139.3, 1.4, 6], L, push(f, a, 0.004)), L, 50, -0.03);
    }
    case "bro": { // close on Rohan in the next lane: "Bro. You live next door."
      const L: V3 = [STOP_X - 2.35, 1.3, 2.2];
      return C(dolly([STOP_X + 1.9, 1.45, 3.5], L, push(f, a, 0.004)), L, 30, 0.03);
    }
    case "gate": { // outside the gate, low: four cars nose to tail, the guard saluting each
      const L: V3 = [GATE_X - 2, 1.2, -1.2];
      return C(dolly([GATE_X + 13, 1.7, 5.5], L, push(f, a, 0.002)), L, 42, 0);
    }
    case "signal": { // front, low, centred: four windscreens side by side, four waves
      const L: V3 = [STOP_X - 2.4, 1.15, -1.0];
      return C(dolly([STOP_X + 3.6, 1.6, 10.2], L, push(f, a, 0.0028)), L, 42, 0);
    }
    case "signal2": { // high side angle, red light in frame
      const L: V3 = [STOP_X - 2.3, 1.25, 0.4];
      return C(dolly([STOP_X + 3.2, 1.75, 8.8], L, push(f, a, 0.003)), L, 40, 0.05);
    }
    case "doors": { // the four at their doors, phones out, before anyone leaves (chat overlay comes next)
      const L: V3 = [6, 1.4, -9.2];
      return C(dolly([-16, 2.2, -6.8], L, push(f, a, 0.002)), L, 36, 0);
    }
    case "chat": case "app": { // soft background behind the overlays
      const L: V3 = [0, 3, -12];
      return C(dolly([4, 4, 10], L, push(f, a, 0.001)), L, 50, 0);
    }
    case "onecar": { // one car, four friends: low front 3/4, the car drives toward us, guard salutes once
      const L: V3 = [GATE_X - 1, 1.3, LANE_Z];
      return C(dolly([GATE_X + 9, 1.35, -6.5], L, push(f, a, 0.002)), L, 40, -0.03);
    }
    case "lot": { // the office lot: one car parks, three bays stay empty
      const L: V3 = [135.5, 0.5, LOT.z];
      return C(dolly([147, 3.0, -5.5], L, push(f, a, 0.004)), L, 44, 0);
    }
    case "late": { // across the lane: Sharma ji bursts out of his door and runs for the car
      const L: V3 = [18.2, 1.2, -6.5];
      return C(dolly([12.2, 1.8, 6.0], L, push(f, a, 0.0025)), L, 46, 0);
    }
    case "where": { // closer on the friends in the car, laughing at the map; Sharma ji still running in the back
      const L: V3 = [WAIT_X + 0.4, 1.2, LANE_Z];
      return C(dolly([WAIT_X + 5.2, 1.6, 4.2], L, push(f, a, 0.003)), L, 40, 0.04);
    }
    default: return C([4, 4, 10], [0, 3, -12], 50, 0);
  }
};
/** depth of field: px radius at 1080 for things at infinity; focus = world point (default the look point) */
export const dofAt = (id: ShotId): { cInf: number; focus?: V3 } => {
  switch (id) {
    case "walk": return { cInf: 9, focus: [-7.4, 1.4, -6] };
    case "clock": return { cInf: 16 };
    case "bro": return { cInf: 13 };
    case "signal": return { cInf: 11, focus: [STOP_X - 1.2, 1.3, 0] };
    case "doors": return { cInf: 7, focus: [-7, 1.5, -9] };
    case "chat": case "app": return { cInf: 22 };
    case "onecar": return { cInf: 10 };
    case "where": return { cInf: 12, focus: [WAIT_X - 0.1, 1.3, LANE_Z] };
    default: return { cInf: 0 };
  }
};
/** impact kicks: none needed in this short; tiny bump when the chat overlay lands */
export const kickAt = (_t: number) => 0;
