// "Four Neighbours, Four Cars" (v2: Gen Z narration, Zack D. Films pacing) — a ~31 s promo short for Sahyatri Community Carpool.
// Everything is timed to the voice word onsets (words.json, tightened narration). Ground is y = 0, the colony lane runs
// along x (cars drive toward +x, Indian left-hand traffic: the outbound lane is z < 0), the colony gate is at x = 34,
// the main road (4 lanes, signal at x = 96) continues to the office car park at x ~ 135.
import WORDS from "./words.json";
import STORY_JSON from "./story.json";

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
/** onset (s) of word k of narration line L (lines.json order) */
export const WL = (L: number, k = 0) => { const l = words.filter((w) => w.line === L); return (l[Math.min(k, l.length - 1)] ?? words[words.length - 1]).start; };
// ---------------- the current story (story.json: lines, shots, cues, overlay texts) ----------------
export type StoryShot = { id: ShotId; at: [number, number]; music?: string };
export type Story = {
  title: string; lines: { text: string }[]; shots: StoryShot[]; cues: Record<string, [number, number]>; punch: [number, number][];
  chat?: { title: string; members: string; count: number; me: string; messages: [string, string][] };
  meeting?: { title: string; highlight: number[]; tiles: [string, string, boolean][] };
  end: { headline: string; tagline: string; button: string }; captionsBig?: string[]; appSticker?: string;
};
export const STORY = STORY_JSON as unknown as Story;
const NEVER = 1e6;
/** story cues (s); a cue the story does not define is NEVER (its effect simply does not fire) */
export const CUE: Record<string, number> = new Proxy({} as Record<string, number>, {
  get: (_o, k: string) => { const c = STORY.cues[k]; return c ? WL(c[0], c[1]) : NEVER; },
});
export const hasCue = (k: string) => !!STORY.cues[k];
export const WORDS_T = words;
export const VOICE_END = words[words.length - 1].end;
const endShot = STORY.shots.find((x) => x.id === "end");
export const END_CARD = endShot ? WL(endShot.at[0], endShot.at[1]) - 0.1 : words[words.length - 1].end + 0.2; // CTA over the end card
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
export type ShotId = "guard" | "hook" | "leave" | "sig1" | "sig2" | "sig5" | "years" | "ask" | "office" | "floor" | "meeting" | "doors" | "chat" | "dead" | "lonely"
  | "app" | "onecar" | "lot" | "late" | "where" | "end"
  | "street" | "walk" | "clock" | "gate" | "signal" | "signal2" | "bro"
  // the parking-spot war: three cars racing, one car rushing out at a time, the one shaded bay (canopy + "carpools only"
  // sign) empty / taken by a stranger carpool, Rohan asleep in the lot, three cars at the gate, the pool parking in the bay
  | "race" | "rushR" | "rushP" | "rushA" | "spot" | "taken" | "strangers" | "sign" | "nap" | "gate3" | "park" | "backseat"
  // napkin maths: the open glovebox full of petrol-maths napkins, and the engineer's spreadsheet (2D overlays, Napkins.tsx)
  | "napkin" | "sheet"
  // two gates: top-down colony map overlay with a front and a back gate (2D overlay, Gates.tsx)
  | "gates"
  // car in service: Rohan's parked hatchback close (it narrates), Priya inspecting it, Rohan practising engine-off in it,
  // and the paper roster on the lift door (2D overlay, Lift.tsx)
  | "mycar" | "spotted" | "practice" | "lift"
  // dupatta seat: top-down cabin with the front seat claimed by a dupatta, and the coin toss into the drain (2D overlays, Seat.tsx)
  | "seat" | "toss"
  // boss's lift: Priya's red car waiting on the lane, Priya at the wheel, the intern Dev alone in the back seat like a cab
  // passenger (wide / close on Priya / close on Dev), and the two secret rule lists (2D overlays, Rules.tsx)
  | "bosscar" | "boss" | "intern" | "rules" | "rules2";
export type Shot = { id: ShotId; a: number; b: number };
const S = (id: ShotId, t0: number, t1: number): Shot => ({ id, a: Math.round(t0 * FPS), b: Math.round(t1 * FPS) });
/** cut ~3 frames before line L (word k) */
const cl = (L: number, k = 0) => (L === 0 && k === 0 ? 0 : WL(L, k) - 0.1);
export const SHOTS: Shot[] = STORY.shots.map((x, i) => {
  const nx = STORY.shots[i + 1];
  return S(x.id, cl(x.at[0], x.at[1]), nx ? cl(nx.at[0], nx.at[1]) : TOTAL / FPS + 1);
});
SHOTS[SHOTS.length - 1].b = TOTAL;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
/** shots drawn under a full-screen 2D overlay: the 3D layer just needs a soft background */
export const OVERLAY: Partial<Record<ShotId, true>> = { chat: true, app: true, end: true, meeting: true, napkin: true, sheet: true, gates: true, lift: true, seat: true, toss: true, rules: true, rules2: true };

// ---------------- motion ----------------
// four neighbours, index i lives in house i; car i is parked in front of house i
export const CAR_COL = ["#f2efe8", "#c8423a", "#3d6db5", "#b9bec6", "#f0b429"]; // 4: the strangers' yellow hatchback
export const STRANGER_CAR = 4;
/** the one shaded bay (bay 1 of the office lot): canopy over it, "carpools only" sign at its back */
export const BAY = { x: 131.5, z: -15.5, signZ: -19.05 };
export const POOL_CAR = 2; // the blue one becomes today's carpool car
export type CarPose = { x: number; z: number; yaw: number; on: boolean; riders: number[]; owner: number };
export const WAIT_X = 14.5;
/** Rohan's parked hatchback (car 0, in front of house 0) */
export const MYCAR_X = -21 + 2.6;
/** the boss's red car (car 1) waiting on the lane; the intern (person 4) sits in the back seat behind the empty front seat */
export const BOSS_X = WAIT_X, INTERN = 4; // the carpool car waits here for Sharma ji
/** where every car is at time t (s), for the colony / gate shots */
export const carsAt = (id: ShotId, t: number): CarPose[] => {
  const parked = (i: number): CarPose => ({ x: HOUSE_X[i] + 2.6, z: PARK_Z, yaw: 0, on: true, riders: [], owner: i });
  switch (id) {
    case "street": case "doors": case "office": case "floor": case "years": case "meeting": return [0, 1, 2, 3].map(parked);
    case "walk": case "office": case "clock": case "floor": case "years": case "meeting": case "guard": return [0, 1, 2, 3].map(parked);
    case "leave": { // Rohan (white) then Arjun (blue), nose to tail out of the gate
      const tg = shotAt(Math.round(t * FPS)).a / FPS;
      return [0, 2].map((i, k) => ({ x: GATE_X - 14 + 3.4 * (t - tg) - 7.5 * k, z: LANE_Z, yaw: 0, on: true, riders: [i], owner: i }));
    }
    case "gate": case "dead": {
      // nose to tail through the gate: the gate shot shows them already on the lane, rolling out one after another
      const tg = shotAt(Math.round(t * FPS)).a / FPS;
      return [3, 2, 1, 0].map((i, k) => ({ x: GATE_X - 1 + 5.5 * (t - tg) - 6.8 * k, z: LANE_Z, yaw: 0, on: true, riders: [i], owner: i }));
    }
    case "onecar": {
      const t0 = (hasCue("one") ? CUE.one : shotAt(Math.round(t * FPS)).a / FPS + 0.3) - 0.5, s = Math.max(0, (t - t0)) * 6.5;
      return [0, 1, 3].map(parked).concat([{ x: GATE_X - 9 + s, z: LANE_Z, yaw: 0, on: true, riders: [2, 0, 1, 3], owner: POOL_CAR }]);
    }
    case "late": case "where": {
      const cars = [0, 1, 3].map(parked);
      cars.push({ x: WAIT_X, z: LANE_Z, yaw: 0, on: true, riders: [2, 0, 1], owner: POOL_CAR });
      return cars;
    }
    case "rushR": case "rushP": case "rushA": { // one car at a time, flooring it out of the gate
      const k = id === "rushR" ? 0 : id === "rushP" ? 1 : 2, tg = shotAt(Math.round(t * FPS)).a / FPS;
      return [0, 1, 2, 3].filter((i) => i !== k).map(parked).concat([{ x: GATE_X - 11 + 8.5 * (t - tg), z: LANE_Z, yaw: 0, on: true, riders: [k], owner: k }]);
    }
    case "gate3": {
      const tg = shotAt(Math.round(t * FPS)).a / FPS;
      return [2, 1, 0].map((i, k) => ({ x: GATE_X - 1 + 5.5 * (t - tg) - 6.8 * k, z: LANE_Z, yaw: 0, on: true, riders: [i], owner: i }));
    }
    case "race": { // three neighbours side by side on the main road, jostling for the lead
      const x0 = raceX(t);
      return [0, 1, 2].map((i) => ({ x: x0 + [0.5, -0.3, 0.1][i] + 0.6 * Math.sin(t * 2.6 + i * 2.1), z: [1.8, -1.8, -5.4][i], yaw: 0, on: true, riders: [i], owner: i }));
    }
    case "taken": case "strangers": case "sign": return [strangerCar()];
    case "mycar": case "spotted": return [0, 1, 2, 3].map(parked);
    case "bosscar": case "boss": case "intern":
      return [0, 2, 3].map(parked).concat([{ x: BOSS_X, z: LANE_Z, yaw: 0, on: true, riders: [1, -1, -1, INTERN], owner: 1 }]);
    case "practice": return [{ ...parked(0), riders: [0] }, parked(1), parked(2), parked(3)];
    case "nap": return [strangerCar(), { x: LOT.x[3], z: LOT.z, yaw: -Math.PI / 2, on: true, riders: [0], owner: 0 }];
    case "park": case "backseat": {
      const t0 = shotAt(Math.round(t * FPS)).a / FPS + 0.15, u = id === "park" ? glide((t - t0) / 1.8) : 1;
      return [{ x: BAY.x, z: lerp(-6.5, BAY.z, u), yaw: -Math.PI / 2, on: true, riders: [2, 1, 0], owner: POOL_CAR }];
    }
    default: return [];
  }
};
const strangerCar = (): CarPose => ({ x: BAY.x, z: BAY.z, yaw: -Math.PI / 2, on: true, riders: [4, 5, 6, 7], owner: STRANGER_CAR });
/** lead x of the race (camera tracks it) */
export const raceX = (t: number) => 48 + 15 * (t - shotAt(Math.round(t * FPS)).a / FPS);
/** the signal: Rohan (white, lane 1.8) next to Arjun (blue, lane 5.4); the other two neighbours in the far lanes */
export const ROHAN_LANE = 1.8, ARJUN_LANE = 5.4;
export const signalCars = (t: number, brake = true): CarPose[] => {
  const t0 = shotAt(Math.round(t * FPS)).a / FPS - 0.2;
  return [[1, -5.4], [3, -1.8], [0, ROHAN_LANE], [2, ARJUN_LANE]].map(([who, z], i) => {
    const u = brake ? clamp01((t - t0) / (0.7 + 0.12 * i)) : 1, x = STOP_X - 2.3 - (1 - u) ** 2 * (6 + i * 1.5) - 0.4 * [0, 1, 0, 1][i];
    return { x, z, yaw: 0, on: true, riders: [who], owner: who };
  });
};
/** the carpool car pulling into bay 1 of the office lot */
export const lotCar = (t: number): CarPose => {
  const t0 = (hasCue("three") ? CUE.three : shotAt(Math.round(t * FPS)).a / FPS) - 0.35, u = glide((t - t0) / 1.6);
  return { x: LOT.x[0], z: lerp(-6.5, LOT.z, u), yaw: -Math.PI / 2, on: true, riders: [2, 0, 1, 3], owner: POOL_CAR };
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
/** dolly toward the look point by k (<1 = closer) */
const dolly = (pos: V3, look: V3, k: number): V3 => [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k];
/** continuous push-in: ~rate per frame since frame f0 */
const push = (f: number, f0: number, rate = 0.0025) => Math.exp(-rate * Math.max(0, f - f0));
const tf = (_s: ShotId, f = 0) => shotAt(f).a;
const C = (pos: V3, look: V3, fov = 40, roll = 0): Cam => ({ pos, look, fov, roll });
/** word punches: a quick zoom-in kick that settles over ~0.25 s (Zack D. style emphasis) */
const PT = STORY.punch.map(([L, k]) => WL(L, k));
export const PUNCH_T = (): number[] => PT;
export const punchAt = (t: number) => {
  let k = 0;
  for (const tp of PUNCH_T()) { const d = t - (tp - 0.03); if (d >= 0 && d < 0.6) k = Math.max(k, Math.exp(-d / 0.09)); }
  return k;
};
export const camAt = (id: ShotId, f: number): Cam => {
  const c = camAt0(id, f), k = punchAt(f / FPS);
  return { ...c, fov: c.fov * (1 - 0.1 * k), roll: c.roll + 0.02 * k * Math.sin(f * 1.7) };
};
const camAt0 = (id: ShotId, f: number): Cam => {
  const t = f / FPS, a = tf(id, f);
  switch (id) {
    case "guard": { // close on the gate guard by his booth
      const L: V3 = [37.4, 1.35, -5.4];
      return C(dolly([41.6, 1.5, -3.4], L, push(f, a, 0.004)), L, 30, 0.02);
    }
    case "hook": { // diagonal over the two cars at the light: new white car right next to the blue one
      const L: V3 = [STOP_X - 2.0, 1.25, 3.9];
      return C(dolly([STOP_X + 8.5, 2.1, 10.8], L, push(f, a, 0.0035)), L, 30, 0);
    }
    case "leave": { const L: V3 = [GATE_X - 2, 1.2, -1.2]; return C(dolly([GATE_X + 13, 1.7, 5.5], L, push(f, a, 0.002)), L, 42, 0); }
    case "sig1": { // front low 3/4 on both drivers: wave
      const L: V3 = [STOP_X - 2.35, 1.3, 3.8];
      return C(dolly([STOP_X + 4.4, 1.5, 9.4], L, push(f, a, 0.003)), L, 34, 0.02);
    }
    case "sig2": { // the other side, higher: thumbs up
      const L: V3 = [STOP_X - 2.35, 1.3, 3.6];
      return C(dolly([STOP_X + 5.8, 2.6, -0.2], L, push(f, a, 0.003)), L, 36, -0.04);
    }
    case "sig5": case "ask": case "lonely": { // close on one driver: Arjun out of greetings / Rohan asking / Rohan alone again
      const z = id === "sig5" ? ARJUN_LANE + 0.42 : ROHAN_LANE + 0.42, L: V3 = [STOP_X - 2.35, 1.3, z];
      const rate = id === "lonely" ? 0.006 : 0.004;
      return C(dolly([STOP_X + 1.9, 1.45, z + 1.3], L, push(f, a, rate)), L, 30, id === "lonely" ? 0 : 0.03);
    }
    case "years": { // the booth clock, hands spinning: two years
      const L: V3 = [CLOCK.x, CLOCK.y, CLOCK.z];
      return C(dolly([CLOCK.x + 2.3, CLOCK.y - 0.25, CLOCK.z + 0.55], L, push(f, a, 0.004)), L, 28, 0.05 * Math.sin((f - a) / 6));
    }
    case "floor": { // push into one office window: same floor
      const L: V3 = [134.5, 7.6, -24];
      return C(dolly([135.5, 6.6, -12], L, push(f, a, 0.01)), L, 36, 0);
    }
    case "meeting": { const L: V3 = [139, 6.5, -24]; return C(dolly([139.3, 1.4, 6], L, push(f, a, 0.001)), L, 50, 0); }
    case "dead": { const L: V3 = [GATE_X - 2, 1.2, -1.2]; return C(dolly([GATE_X + 13, 1.7, 5.5], L, push(f, a, 0.002)), L, 42, 0); }
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
    case "mycar": { // low front 3/4 on Rohan's parked white hatchback: the narrator. Slow push, slight dutch on the hook
      const L: V3 = [MYCAR_X - 0.6, 0.9, PARK_Z];
      return C(dolly([MYCAR_X + 8.2, 1.5, PARK_Z + 3.4], L, push(f, a, 0.0025)), L, 34, 0.03);
    }
    case "spotted": { // wider: Priya stops on the lane beside the car and looks it over
      const L: V3 = [MYCAR_X + 0.2, 1.0, PARK_Z + 1.2];
      return C(dolly([MYCAR_X + 11, 2.0, PARK_Z + 6.0], L, push(f, a, 0.002)), L, 34, 0);
    }
    case "practice": { // side window on the driver's seat: Rohan, engine off, turning the wheel
      const L: V3 = [MYCAR_X - 0.1, 1.15, PARK_Z + 0.42];
      return C(dolly([MYCAR_X + 5.6, 1.55, PARK_Z + 1.9], L, push(f, a, 0.003)), L, 30, 0.02);
    }
    case "bosscar": { // front 3/4 on the red car: Priya driving, Dev alone in the back like a cab passenger
      const L: V3 = [BOSS_X - 0.7, 1.15, LANE_Z - 0.1];
      return C(dolly([BOSS_X + 5.4, 1.75, LANE_Z + 4.4], L, push(f, a, 0.0025)), L, 36, 0.02);
    }
    case "boss": { // close on Priya at the wheel, through the windscreen
      const L: V3 = [BOSS_X - 0.05, 1.3, LANE_Z + 0.42];
      return C(dolly([BOSS_X + 1.9, 1.45, LANE_Z + 1.75], L, push(f, a, 0.004)), L, 30, -0.03);
    }
    case "intern": { // close on Dev in the back seat, from the front-left past the empty front seat
      const L: V3 = [BOSS_X - 1.25, 1.3, LANE_Z - 0.42];
      return C(dolly([BOSS_X + 1.7, 1.5, LANE_Z - 1.9], L, push(f, a, 0.004)), L, 30, 0.03);
    }
    case "chat": case "app": case "napkin": case "sheet": case "gates": case "lift": case "seat": case "toss": case "rules": case "rules2": { // soft background behind the overlays
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
    case "race": { // tracking alongside the three racing cars, low and wide
      const x = raceX(t), L: V3 = [x - 1.0, 1.0, -1.8];
      return C(dolly([x + 12, 2.6, 6.6], L, push(f, a, 0.002)), L, 40, 0.03 * Math.sin(t * 5));
    }
    case "rushR": case "rushP": case "rushA": { const L: V3 = [GATE_X - 2, 1.2, -1.2]; return C(dolly([GATE_X + 11, 1.5, 5.0], L, push(f, a, 0.003)), L, 40, id === "rushP" ? -0.04 : 0.04); }
    case "gate3": { const L: V3 = [GATE_X - 2, 1.2, -1.2]; return C(dolly([GATE_X + 13, 1.7, 5.5], L, push(f, a, 0.002)), L, 42, 0); }
    case "spot": { const L: V3 = [BAY.x, 1.3, BAY.z - 1]; return C(dolly([BAY.x + 6, 2.4, -6.5], L, push(f, a, 0.004)), L, 34, 0); }
    case "taken": { const L: V3 = [BAY.x + 0.5, 1.3, BAY.z - 0.5]; return C(dolly([BAY.x + 7, 2.6, -5.5], L, push(f, a, 0.003)), L, 38, -0.02); }
    case "strangers": { const L: V3 = [BAY.x, 1.25, BAY.z - 0.3]; return C(dolly([BAY.x + 0.9, 1.75, -9.6], L, push(f, a, 0.004)), L, 30, 0.03); }
    case "sign": { const L: V3 = [BAY.x, 2.1, BAY.signZ]; return C(dolly([BAY.x + 1.3, 2.4, -14.2], L, push(f, a, 0.006)), L, 28, 0); }
    case "nap": { const L: V3 = [LOT.x[3] - 0.4, 1.3, LOT.z - 0.2]; return C(dolly([LOT.x[3] + 3.0, 2.3, -8.5], L, push(f, a, 0.004)), L, 30, 0.02); }
    case "park": { const L: V3 = [BAY.x, 1.0, -12.5]; return C(dolly([BAY.x + 4, 3.0, -1.5], L, push(f, a, 0.002)), L, 44, 0); }
    case "backseat": { const L: V3 = [BAY.x - 0.4, 1.25, BAY.z - 1.0]; return C(dolly([BAY.x - 6.5, 1.9, BAY.z - 1.1], L, push(f, a, 0.003)), L, 30, 0); }
    default: return C([4, 4, 10], [0, 3, -12], 50, 0);
  }
};
/** depth of field: px radius at 1080 for things at infinity; focus = world point (default the look point) */
export const dofAt = (id: ShotId): { cInf: number; focus?: V3 } => {
  switch (id) {
    case "walk": return { cInf: 9, focus: [-7.4, 1.4, -6] };
    case "clock": case "years": return { cInf: 16 };
    case "guard": return { cInf: 12 };
    case "sig1": return { cInf: 9 };
    case "sig5": case "ask": case "lonely": return { cInf: 13 };
    case "floor": return { cInf: 6 };
    case "meeting": return { cInf: 22 };
    case "bro": return { cInf: 13 };
    case "signal": return { cInf: 11, focus: [STOP_X - 1.2, 1.3, 0] };
    case "doors": return { cInf: 7, focus: [-7, 1.5, -9] };
    case "chat": case "app": case "napkin": case "sheet": case "gates": case "lift": case "seat": case "toss": case "rules": case "rules2": return { cInf: 22 };
    case "bosscar": return { cInf: 10 };
    case "boss": case "intern": return { cInf: 13 };
    case "mycar": return { cInf: 14 };
    case "spotted": return { cInf: 10, focus: [MYCAR_X + 1.2, 1.2, PARK_Z + 2.4] };
    case "practice": return { cInf: 13 };
    case "onecar": return { cInf: 10 };
    case "where": return { cInf: 12, focus: [WAIT_X - 0.1, 1.3, LANE_Z] };
    case "strangers": case "nap": case "backseat": return { cInf: 12 };
    case "sign": return { cInf: 14 };
    case "spot": case "taken": case "park": return { cInf: 6 };
    case "race": return { cInf: 8 };
    default: return { cInf: 0 };
  }
};
/** impact kicks: none needed in this short; tiny bump when the chat overlay lands */
export const kickAt = (_t: number) => 0;
