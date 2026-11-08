// The colony world for "Four Neighbours, Four Cars": built once from the bridge short's look kit (two-tone materials,
// painted HD textures, gabled houses, cartoon trees, sky shader, card characters) and posed per frame from story.ts.
import * as THREE from "three";
import { Batch, boxGeo, house, lam, prop, quad, V } from "../bridge/build";
import { cloudHD, ctex, facadeHD, grassHD, rep, stoneHD } from "../bridge/paint";
import { CHAR, TONE, twoTone, untone } from "../bridge/shade";
import { LIGHTS, LOOK } from "../bridge/lights";
import { NOINK } from "../bridge/ink";
import { Actor, Fx, Pool } from "../bridge/cast";
import { bodyFront, bodySide, fxContact, Expr, Outfit, Pen, SKINS } from "../bridge/toon";
import {
  BAY, CAR_COL, CLOCK, CUE, hasCue, DOOR_Z, WAIT_X, WI, FPS, GATE_X, HOUSE_X, HOUSE_Z, LANE_Z, LEAD, LOT, PARK_Z, SIGNAL_LANES, STOP_X, CarPose, ShotId, V3, W,
  camAt, carsAt, clamp01, lotCar, shotAt, signalCars, smooth,
} from "./story";

// ---------------- cast ----------------
export const PEOPLE: Outfit[] = [
  { jacket: "#3f6fb5", pants: "#34384a", boots: "#2a2a30", hat: "hair", hair: "#1f1712", skin: SKINS[3] },                      // 0 blue shirt
  { jacket: "#c25a7a", pants: "#3b3f52", boots: "#5a3b2a", hat: "hair", hair: "#2a1a14", skin: SKINS[1] },                      // 1 rose kurta
  { jacket: "#5d8a3a", pants: "#3a3d33", boots: "#3a2a20", hat: "hair", hair: "#17110e", skin: SKINS[2] },                      // 2 green shirt (today's driver)
  { jacket: "#e0a93a", pants: "#3b3f52", boots: "#4a3426", hat: "hair", hair: "#241a14", skin: SKINS[3], moustache: "#2a1d16", build: "stout" }, // 3 Sharma ji
  // 4-7: the strangers' carpool in the shaded bay
  { jacket: "#7a5ab5", pants: "#34384a", boots: "#2a2a30", hat: "hair", hair: "#2a1a14", skin: SKINS[2] },
  { jacket: "#2f8f8a", pants: "#3b3f52", boots: "#3a2a20", hat: "hair", hair: "#17110e", skin: SKINS[1] },
  { jacket: "#d0643a", pants: "#3a3d33", boots: "#2a2a30", hat: "cap", cap: "#2f3a5a", skin: SKINS[3] },
  { jacket: "#f2efe8", pants: "#34384a", boots: "#4a3426", hat: "hair", hair: "#3a2a1e", skin: SKINS[2], moustache: "#2a1d16" },
];
const GUARD: Outfit = { jacket: "#7a7350", pants: "#5d5a3e", boots: "#2a2a24", hat: "cap", cap: "#3f4a6a", skin: SKINS[3], moustache: "#2a1d16", belt: "#3a2a20" };
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
/** blink: 4-frame half / shut / shut / half every 0.5-2.3 s */
const lidAt = (f: number, i: number) => {
  let s = Math.round(-50 * hh(i, 9));
  for (let n = 0; s <= f && n < 300; n++) { const k = f - s; if (k >= 0 && k < 4) return [0.5, 1, 1, 0.5][k]; s += Math.round(15 + 54 * hh(i * 31 + n, 13)); }
  return 0;
};
const tier = (d: number): [number, number, number] => d < 3.2 ? [1440, 2400, 2.4] : d < 7 ? [960, 1600, 1.6] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];
const q = (v: number) => Math.round(v * 60) / 60;

// ---------------- materials + pieces ----------------
const asphalt = () => ctex("asphalt", 512, 512, (g, r) => {
  g.fillStyle = "#5f6068"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) { const v = 80 + r() * 40; g.fillStyle = `rgba(${v},${v},${v + 6},0.35)`; g.fillRect(r() * 512, r() * 512, 2 + r() * 3, 2 + r() * 3); }
  for (let i = 0; i < 8; i++) { g.fillStyle = "rgba(40,40,46,0.12)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 30 + r() * 60, 18 + r() * 30, r() * 3, 0, 7); g.fill(); }
});
const clockTex = () => ctex("clockFace", 512, 512, (g) => {
  g.fillStyle = "#c8423a"; g.beginPath(); g.arc(256, 256, 252, 0, 7); g.fill();          // red rim
  g.fillStyle = "#fffaf0"; g.beginPath(); g.arc(256, 256, 214, 0, 7); g.fill();
  g.lineWidth = 16; g.strokeStyle = "#241726"; g.beginPath(); g.arc(256, 256, 214, 0, 7); g.stroke();
  g.lineCap = "round";
  for (let k = 0; k < 60; k++) {
    const a = (k / 60) * Math.PI * 2, big = k % 5 === 0;
    g.lineWidth = big ? 14 : 5; g.beginPath();
    g.moveTo(256 + (big ? 160 : 182) * Math.sin(a), 256 - (big ? 160 : 182) * Math.cos(a)); g.lineTo(256 + 196 * Math.sin(a), 256 - 196 * Math.cos(a)); g.stroke();
  }
  g.fillStyle = "#241726"; g.font = "bold 64px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  for (const [n, a] of [[12, 0], [3, 90], [6, 180], [9, 270]] as [number, number][]) { const r = (a * Math.PI) / 180; g.fillText(String(n), 256 + 122 * Math.sin(r), 258 - 122 * Math.cos(r)); }
  g.fillStyle = "#3d6db5"; g.font = "bold 26px sans-serif"; g.fillText("OFFICE TIME", 256, 340);
});
const officeTex = () => facadeHD("office", 30, 13, { wall: "#e8e1d2", shutter: "#3b6fa0" });

const mkCar = (col: string) => {
  // a chunky cartoon hatchback, nose toward local +x, origin on the ground at its centre; open cabin (no glass) so the
  // riders read; right-hand drive (driver at local +z)
  const g = new THREE.Group();
  const body = lam("car" + col, () => ({ color: col })), dark = lam("carDark", () => ({ color: "#2b2b33" })), trim = lam("carTrim", () => ({ color: "#d9d6cf" }));
  const seat = lam("carSeat", () => ({ color: "#4a4450" })), lamp = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.55, 1.3) }), tail = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 0.12, 0.1) });
  const b = (min: V3, max: V3, m: THREE.Material) => { const mesh = new THREE.Mesh(boxGeo(V(...min), V(...max)), m); mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh); return mesh; };
  b([-2.05, 0.32, -0.88], [2.05, 0.98, 0.88], body);           // lower body
  b([1.05, 0.98, -0.86], [2.0, 1.06, 0.86], body);             // bonnet lip
  b([-2.1, 0.28, -0.9], [-1.95, 0.6, 0.9], trim);              // rear bumper
  b([1.95, 0.28, -0.9], [2.12, 0.6, 0.9], trim);               // front bumper
  b([-1.75, 1.52, -0.8], [0.75, 1.6, 0.8], body);              // roof
  for (const [x, z] of [[0.72, -0.78], [0.72, 0.72], [-1.72, -0.78], [-1.72, 0.72]] as [number, number][]) b([x - 0.03, 0.98, z], [x + 0.03, 1.52, z + 0.06], body); // pillars
  b([0.75, 0.98, -0.8], [1.0, 1.12, 0.8], dark);               // dashboard
  b([-0.35, 0.5, -0.78], [-0.15, 1.18, 0.78], seat);           // front seat backs
  b([-1.6, 0.5, -0.8], [-1.4, 1.12, 0.8], seat);               // rear bench back
  for (const z of [-0.6, 0.6]) b([2.08, 0.66, z - 0.2], [2.13, 0.84, z + 0.2], lamp);
  for (const z of [-0.65, 0.65]) b([-2.13, 0.68, z - 0.16], [-2.08, 0.86, z + 0.16], tail);
  const wheel = new THREE.CylinderGeometry(0.34, 0.34, 0.26, 18); wheel.rotateX(Math.PI / 2);
  const hub = new THREE.CylinderGeometry(0.15, 0.15, 0.27, 12); hub.rotateX(Math.PI / 2);
  for (const [x, z] of [[1.3, -0.8], [1.3, 0.8], [-1.3, -0.8], [-1.3, 0.8]] as [number, number][]) {
    const w = new THREE.Mesh(wheel, dark); w.position.set(x, 0.34, z); w.castShadow = true; g.add(w);
    const h2 = new THREE.Mesh(hub, trim); h2.position.set(x, 0.34, z); g.add(h2);
  }
  // number plate (white, unlit so it stays clean)
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.13), new THREE.MeshBasicMaterial({ color: "#f4f1e6" }));
  plate.position.set(2.125, 0.45, 0); plate.rotation.y = Math.PI / 2; g.add(plate);
  return g;
};
/** seats in car space (driver first): right-hand drive */
const SEATS: V3[] = [[-0.05, 0.42, 0.42], [-0.05, 0.42, -0.42], [-1.25, 0.42, 0.42], [-1.25, 0.42, -0.42]];

// ---------------- world ----------------
export class CarpoolWorld {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private cars: THREE.Group[][] = [];
  private hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
  private sun = new THREE.DirectionalLight("#fff0d6", 2.6);
  private skyMat: THREE.ShaderMaterial; private sky: THREE.Mesh;
  private fog = new THREE.Fog("#bccbec", 25, 420);
  private clouds: THREE.Mesh[] = [];
  private redLamps: THREE.MeshBasicMaterial[] = [];
  private hourHand!: THREE.Mesh; private minHand!: THREE.Mesh; private secHand!: THREE.Mesh;
  private frustum = new THREE.Frustum(); private m4 = new THREE.Matrix4(); private sph = new THREE.Sphere(); private v = new THREE.Vector3();

  constructor() {
    const R = this.root;
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() }, c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el)); gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK); R.add(this.sky);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);
    const cm = [0, 1, 2, 3].map((k) => cloudHD(k, LOOK.day.cloud));
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.3, d = 600 + (i % 3) * 60, w = 130 + (i % 4) * 30;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: cm[i % 4], color: new THREE.Color(1.1, 1.1, 1.1), transparent: true, depthWrite: false, fog: false }));
      m.position.set(Math.cos(a) * d, 110 + (i % 4) * 36, Math.sin(a) * d); m.scale.set(w, w / 2, 1); m.layers.set(NOINK);
      this.clouds.push(m); R.add(m);
    }

    const b = new Batch();
    const grass = lam("grassHD", () => ({ map: grassHD() }));
    const road = lam("asphalt", () => ({ map: asphalt() }));
    const pave = lam("paveHD", () => ({ map: stoneHD("paveHD", ["#d9d1c2", "#d1c8b8", "#e0d8ca", "#cbc1b0"], "#a89e8f") }));
    const wallM = lam("compoundWall", () => ({ color: "#e9dcc0" })), capM = lam("wallCap", () => ({ color: "#c46a4e" }));
    const white = lam("paint", () => ({ color: "#f6f3ea" })), yellow = lam("paintY", () => ({ color: "#f2c94c" }));
    const flat = (x0: number, x1: number, z0: number, z1: number, y: number, m: THREE.Material, tile = 4) =>
      b.add(quad(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), (x1 - x0) / tile, (z1 - z0) / tile), m);
    // ground, lane, main road, footpaths
    flat(-400, 400, -400, 400, -0.02, grass, 8);
    flat(-60, GATE_X + 4, -3.6, 3.6, 0, road, 6);
    flat(-60, GATE_X, -8.4, -3.6, 0.005, pave, 2.5); flat(-60, GATE_X, 3.6, 8.4, 0.005, pave, 2.5);
    flat(GATE_X, 220, -7.2, 7.2, 0, road, 6);
    flat(GATE_X, 220, -10, -7.2, 0.03, pave, 2.5); flat(GATE_X, 220, 7.2, 10, 0.03, pave, 2.5);
    for (let x = -58; x < GATE_X; x += 6) flat(x, x + 3, -0.08, 0.08, 0.012, white, 1);                       // lane centre dashes
    for (const z of [-3.6, 0, 3.6]) for (let x = GATE_X + 4; x < 220; x += 6) if (x < STOP_X - 1 || x > STOP_X + 4) flat(x, x + 3, z - 0.07, z + 0.07, 0.012, white, 1);
    flat(STOP_X - 0.6, STOP_X - 0.15, -7.2, 7.2, 0.013, white, 1);                                               // stop line
    for (let z = -6.6; z < 7; z += 1.1) flat(STOP_X + 0.6, STOP_X + 3.6, z, z + 0.6, 0.012, white, 1);          // zebra
    // colony compound wall with the gate gap, pillars, a guard booth outside it
    for (const [z0, z1] of [[-60, -4.6], [4.6, 60]]) {
      b.add(boxGeo(V(GATE_X - 0.15, 0, z0), V(GATE_X + 0.15, 2.0, z1)), wallM);
      b.add(boxGeo(V(GATE_X - 0.22, 2.0, z0), V(GATE_X + 0.22, 2.12, z1)), capM);
    }
    for (const z of [-4.6, 4.6]) { b.add(boxGeo(V(GATE_X - 0.45, 0, z - 0.45), V(GATE_X + 0.45, 2.9, z + 0.45)), wallM); b.add(boxGeo(V(GATE_X - 0.55, 2.9, z - 0.55), V(GATE_X + 0.55, 3.1, z + 0.55)), capM); }
    const booth = lam("booth", () => ({ color: "#f0e2bf" })), boothRoof = lam("boothRoof", () => ({ color: "#3d6db5" }));
    b.add(boxGeo(V(37.0, 0, -9.0), V(38.6, 2.5, -6.0)), booth);
    b.add(boxGeo(V(36.8, 2.5, -9.2), V(38.8, 2.7, -5.8)), boothRoof);
      b.add(boxGeo(V(38.6, 0.7, -8.6), V(38.62, 1.05, -8.0)), lam("boothWin2", () => ({ color: "#3b4a5c" })));
    const clock = new THREE.Group(); clock.position.set(CLOCK.x, CLOCK.y, CLOCK.z); clock.rotation.y = Math.PI / 2; R.add(clock);
    const face = new THREE.Mesh(new THREE.CircleGeometry(CLOCK.r, 64), new THREE.MeshBasicMaterial({ map: clockTex(), color: 0xeeeeee }));
    face.layers.set(NOINK); clock.add(face);
    const handMat = new THREE.MeshBasicMaterial({ color: "#241726" }), secMat = new THREE.MeshBasicMaterial({ color: "#e0392b" });
    const hand = (len: number, w: number, m: THREE.Material, z: number) => {
      const g2 = new THREE.PlaneGeometry(w, len); g2.translate(0, len / 2 - len * 0.12, 0);
      const h = new THREE.Mesh(g2, m); h.position.z = z; h.layers.set(NOINK); clock.add(h); return h;
    };
    this.hourHand = hand(CLOCK.r * 0.5, 0.06, handMat, 0.01); this.minHand = hand(CLOCK.r * 0.78, 0.04, handMat, 0.02); this.secHand = hand(CLOCK.r * 0.85, 0.015, secMat, 0.03);
    const cap = new THREE.Mesh(new THREE.CircleGeometry(0.04, 20), secMat); cap.position.z = 0.04; cap.layers.set(NOINK); clock.add(cap);
    b.add(boxGeo(V(38.6, CLOCK.y - CLOCK.r - 0.06, CLOCK.z - CLOCK.r - 0.06), V(38.66, CLOCK.y + CLOCK.r + 0.06, CLOCK.z + CLOCK.r + 0.06)), lam("clockBack", () => ({ color: "#3a2e2a" })));

    // colony name board over the gate
    const board = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 1.0), new THREE.MeshBasicMaterial({ map: ctex("colonyBoard", 1024, 155, (g) => {
      g.fillStyle = "#2f6a43"; g.fillRect(0, 0, 1024, 155); g.strokeStyle = "#f2c94c"; g.lineWidth = 10; g.strokeRect(8, 8, 1008, 139);
      g.fillStyle = "#fff8e6"; g.font = "bold 88px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("GREEN PARK COLONY", 512, 82);
    }), color: 0xe4e4e4 }));
    board.position.set(GATE_X + 0.5, 3.75, 0); board.rotation.y = Math.PI / 2; board.layers.set(NOINK); R.add(board);
    b.add(boxGeo(V(GATE_X + 0.3, 3.2, -3.4), V(GATE_X + 0.45, 4.3, 3.4)), lam("boardBack", () => ({ color: "#3a2e2a" })));
    // houses: four neighbours on the north side, more opposite and along the main road
    HOUSE_X.forEach((x, i) => house(b, x, HOUSE_Z, 0, 10, 8, 6.4, [0, 1, 4, 6][i], 0));
    [-28, -14, 0, 14, 28].forEach((x, i) => house(b, x, 15, Math.PI, 10, 8, 6.2, [3, 5, 7, 2, 0][i], 0));
    for (let x = 50, i = 0; x < 200; x += 13, i++) { if (x < 112 || x > 162) house(b, x, -17, 0, 11, 8, 6 + (i % 3) * 1.2, i + 2, 0); if (x < 120 || x > 150) house(b, x + 4, 17.5, Math.PI, 11, 8, 6.4 + (i % 2) * 1.4, i + 5, 0); }
    // front walls with gates for the four houses, small gardens
    HOUSE_X.forEach((x) => {
      for (const [x0, x1] of [[x - 5, x - 0.9], [x + 0.9, x + 5]]) b.add(boxGeo(V(x0, 0, -8.7), V(x1, 0.9, -8.5)), wallM);
      flat(x - 0.9, x + 0.9, -10, -8.4, 0.01, pave, 1.5);
    });
    // trees and shrubs (cartoon plants from the look kit)
    const K = {} as Record<string, THREE.Object3D>;
    for (const x of [-27, -14, 0, 14, 27]) prop(b, K, "tree_oak", x, 0, -8.9, 6.5, x);
    for (const x of [-34, -21, -7, 7, 21, 34]) prop(b, K, "tree_fat", x, 0, 9.2, 6, x);
    for (const x of HOUSE_X) { prop(b, K, "plant_bushDetailed", x - 3.2, 0, -9.3, 1.2, x); prop(b, K, "plant_bush", x + 3.4, 0, -9.3, 1.0, x); }
    for (let x = 44; x < 200; x += 11) { if (x < 124 || x > 154) prop(b, K, x % 2 ? "tree_oak" : "tree_default", x, 0, -11.2, 6 + (x % 3), x); prop(b, K, "tree_fat", x + 5, 0, 11.2, 6, x); }
    // signal: pole with a lamp head on an arm over the near lanes, lamps on both faces
    const poleM = lam("pole", () => ({ color: "#3d414c" })), headM = lam("sigHead", () => ({ color: "#22252c" }));
    b.add(boxGeo(V(STOP_X + 1.5, 0, -8.1), V(STOP_X + 1.7, 5.6, -7.9)), poleM);
    b.add(boxGeo(V(STOP_X + 1.5, 5.4, -8.0), V(STOP_X + 1.7, 5.55, -2.6)), poleM);
    b.add(boxGeo(V(STOP_X + 1.35, 3.9, -3.05), V(STOP_X + 1.85, 5.4, -2.55)), headM);
    const red = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 0.15, 0.1) }), dim = new THREE.MeshBasicMaterial({ color: "#3a3a2c" });
    this.redLamps.push(red);
    for (const xf of [STOP_X + 1.34, STOP_X + 1.86]) for (const [y, m] of [[5.1, red], [4.65, dim], [4.2, dim]] as [number, THREE.Material][]) {
      const c = new THREE.Mesh(new THREE.CircleGeometry(0.17, 20), m); c.position.set(xf, y, -2.8); c.rotation.y = xf < STOP_X + 1.5 ? -Math.PI / 2 : Math.PI / 2; c.layers.set(NOINK); R.add(c);
    }
    // office: a flat-roofed block with a painted facade, car park with four marked bays
    const ox0 = 124, ox1 = 154, oz = -30;
    const offFront = lam("officeFront", () => ({ map: officeTex() })), offSide = lam("officeSide", () => ({ color: "#e2d9c6" }));
    b.add(quad(V(ox0, 0, oz + 6), V(ox1, 0, oz + 6), V(ox1, 13, oz + 6), V(ox0, 13, oz + 6)), offFront);
    b.add(boxGeo(V(ox0, 0, oz - 6), V(ox1, 13, oz + 5.98)), offSide);
    b.add(boxGeo(V(ox0 - 0.3, 13, oz - 6.3), V(ox1 + 0.3, 13.6, oz + 6.3)), lam("officeCap", () => ({ color: "#3d6db5" })));
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(16, 2.2), new THREE.MeshBasicMaterial({ map: ctex("officeSign", 1024, 141, (g) => {
      g.fillStyle = "#141414"; g.fillRect(0, 0, 1024, 141); g.fillStyle = "#F2CF5B"; g.fillRect(0, 128, 1024, 13);
      g.fillStyle = "#ffffff"; g.font = "bold 92px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("PRESTIGE TECH PARK", 512, 66);
    }), color: 0xe8e8e8 }));
    sign.position.set((ox0 + ox1) / 2, 11.6, oz + 6.05); sign.layers.set(NOINK); R.add(sign);
    flat(126, 152, -23.5, -7.2, 0.008, road, 6);
    for (const x of [130, 133, 136, 139, 142]) flat(x - 0.07, x + 0.07, -18.6, -12.2, 0.016, white, 1);
    flat(130, 142, -18.7, -18.55, 0.016, white, 1);
    for (const x of [134.5, 137.5, 140.5]) flat(x - 0.6, x + 0.6, -13.4, -12.9, 0.017, yellow, 1); // painted "reserved" bars in the empty bays
    // the one shaded bay: a green canopy on four posts over bay 1, and the sign at its back that nobody reads
    const canopyM = lam("canopy", () => ({ color: "#3f9a3a" })), postM = lam("canopyPost", () => ({ color: "#d9d6cf" }));
    for (const x of [BAY.x - 1.35, BAY.x + 1.35]) for (const z of [BAY.z - 2.9, BAY.z + 2.9]) b.add(boxGeo(V(x - 0.07, 0, z - 0.07), V(x + 0.07, 2.75, z + 0.07)), postM);
    b.add(boxGeo(V(BAY.x - 1.7, 2.75, BAY.z - 3.25), V(BAY.x + 1.7, 2.9, BAY.z + 3.25)), canopyM);
    b.add(boxGeo(V(BAY.x - 0.05, 0, BAY.signZ - 0.12), V(BAY.x + 0.05, 1.6, BAY.signZ - 0.04)), postM);
    b.build(R);
    const bsign = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.15), new THREE.MeshBasicMaterial({ map: ctex("carpoolSign", 512, 256, (g) => {
      g.fillStyle = "#1f6b4a"; g.fillRect(0, 0, 512, 256); g.strokeStyle = "#ffffff"; g.lineWidth = 12; g.strokeRect(10, 10, 492, 236);
      g.fillStyle = "#ffffff"; g.font = "bold 82px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("CARPOOLS", 256, 92); g.fillText("ONLY", 256, 180);
    }), color: 0xe8e8e8 }));
    bsign.position.set(BAY.x, 2.05, BAY.signZ); bsign.layers.set(NOINK); R.add(bsign);

    // cars (posed per frame): two of each colour, handed out by owner
    this.cars = CAR_COL.map((col) => [0, 1].map(() => { const c = mkCar(col); c.visible = false; R.add(c); return c; }));
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: ShotId, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, L = LIGHTS.day, K = LOOK.day;
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.15; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    // camera-relative sun, frozen per shot: from screen-right-front, high (day preset)
    const s0 = shotAt(f), c0 = camAt(id, s0.a), fx0 = c0.look[0] - c0.pos[0], fz0 = c0.look[2] - c0.pos[2], n0 = Math.hypot(fx0, fz0) || 1;
    const az = THREE.MathUtils.degToRad(L.az), el = THREE.MathUtils.degToRad(L.el), dx = fx0 / n0, dz = fz0 / n0;
    const sunDir = V((dx * Math.cos(az) - dz * Math.sin(az)) * Math.cos(el), Math.sin(el), (dz * Math.cos(az) + dx * Math.sin(az)) * Math.cos(el)).normalize();
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.2 + 9, 14, 80);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera; sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad; CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((d) => THREE.MathUtils.degToRad(d)); su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color); this.fog.near = L.fogNear; this.fog.far = L.fogFar; scene.fog = this.fog; scene.background = null;
    for (const m of this.clouds) m.lookAt(cam.position.x, m.position.y, cam.position.z);

    // ---- cars ----
    const SIG = ["signal", "signal2", "bro", "hook", "sig1", "sig2", "sig5", "ask", "lonely"];
    const poses: CarPose[] = SIG.includes(id) ? signalCars(t, id === "hook" || id === "lonely") : id === "lot" ? [lotCar(t)] : carsAt(id, t);
    const carOf: THREE.Group[] = [], usedN = CAR_COL.map(() => 0);
    for (const l of this.cars) for (const c of l) c.visible = false;
    poses.forEach((p, i) => {
      const car = this.cars[p.owner][usedN[p.owner]++];
      car.visible = true; car.position.set(p.x, 0, p.z); car.rotation.set(0, p.yaw, 0); carOf[i] = car;
    });

    // ---- cast ----
    const places: Place[] = [], fxs: FxPl[] = [];
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const light = Math.round(Math.atan2(-sunDir.y, sunDir.dot(right)) / (Math.PI / 4)) * (Math.PI / 4);
    const person = (who: number, x: number, y: number, z: number, o: Outfit, mode: "front" | "side", opts: Record<string, unknown>, mirror = false, scale = 1) => {
      const d = cam.position.distanceTo(this.v.set(x, y + 1.2, z)) / scale, [w, h, k] = tier(d);
      const lid = lidAt(f, who * 7 + 3), seed = (who * 5 + 3) % 7 + 1;
      const o2 = { ...opts, light, seed, blink: opts.sleep ? 1 : lid };
      const key = `${mode}|${who}|${JSON.stringify(o2, (_k, v) => (typeof v === "number" ? q(v) : v))}`;
      places.push({ key, x, y, z, scale, mirror, w, h, k, draw: (p) => (mode === "side" ? bodySide(p, o, o2) : bodyFront(p, o, o2)) });
      if (y < 0.05) fxs.push({ key: "blob|contact|#4b4d70", cw: 128, ch: 128, draw: (p) => fxContact(p, "#4b4d70"), x, y: 0.02, z, w: 0.62 * scale, h: 0.46 * scale });
    };
    // riders sit in their car seats, facing the lens
    poses.forEach((p, ci) => p.riders.forEach((who, si) => {
      const car = carOf[ci], s = SEATS[si];
      const wp = V(...s).applyAxisAngle(V(0, 1, 0), p.yaw).add(car.position);
      const sleep = who === 0 && (id === "nap" || id === "backseat" || id === "park");
      person(who, wp.x, wp.y, wp.z, PEOPLE[who], "front", { mode: "sit", expr: this.riderExpr(id, t, who, ci), wave: this.waveOf(id, t, who), sleep }, false, 0.92);
    }));
    this.stageWalkers(id, t, f, person);
    // ---- clock: ~9:00; on "two years" the hands whirl (time passing), decelerating at the cut ----
    {
      const sh = shotAt(f), u = id === "years" ? (f - sh.a) / FPS : 0, dur = (sh.b - sh.a) / FPS;
      const spin = id === "years" ? 360 * 7 * (u - (u * u) / (2 * Math.max(0.5, dur) * 1.4)) : 0;
      const minA = spin, hourA = -90 + spin / 12;
      this.minHand.rotation.z = (-minA * Math.PI) / 180; this.hourHand.rotation.z = (-hourA * Math.PI) / 180;
      this.secHand.rotation.z = -(Math.floor(t * 8) / 8) * Math.PI * 2 * (id === "years" ? 6 : 1.5);
    }
    // ---- red light ----
    for (const m of this.redLamps) m.color.setRGB(2.4, 0.15, 0.1);

    // ---- draw the cards ----
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0; const used: Actor[] = [];
    for (const p of places) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1, p.z), 2.5))) continue;
      const a = this.actor(ai++);
      a.r = this.pool.req(p.key, p.w, p.h, p.k, p.draw);
      a.mesh.visible = true; a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), 0);
      a.mesh.scale.set(p.mirror ? -p.scale : p.scale, p.scale, p.scale);
      a.mesh.castShadow = false; used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0; const fused: Fx[] = [];
    for (const p of fxs) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), 1.5))) continue;
      const e2 = this.fx(fi++);
      e2.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw); e2.use(false);
      e2.mesh.visible = true; e2.mesh.position.set(p.x, p.y, p.z); e2.mesh.rotation.set(-Math.PI / 2, 0, 0); e2.mesh.scale.set(p.w, p.h, 1);
      fused.push(e2);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e2 of fused) e2.bind();
    return focus;
  }

  private riderExpr(id: ShotId, t: number, who: number, _ci: number): Expr {
    const duo = who === 0 || who === 2; // Rohan, Arjun
    switch (id) {
      case "hook": return who === 0 ? "grin" : "neutral";
      case "sig1": return duo && t > CUE.wave - LEAD ? "grin" : "neutral";
      case "sig2": return duo && t > CUE.thumbs - LEAD ? "smile" as Expr : "neutral";
      case "sig5": return duo ? (t > CUE.outOf - LEAD ? "nervous" : "neutral") : "neutral";
      case "ask": return who === 0 ? (t > CUE.bro - LEAD ? "grin" : "neutral") : "neutral";
      case "lonely": return "neutral";
      case "onecar": case "lot": return who % 2 ? "laugh" : "grin";
      case "race": case "rushR": case "rushP": case "rushA": case "gate3": return "stern";
      case "taken": case "strangers": case "sign": return who % 2 ? "laugh" : "smile_closed" as Expr;
      case "nap": return who === 0 ? "smile_closed" as Expr : "smile";
      case "park": return who === 0 ? "smile_closed" as Expr : "grin";
      case "backseat": return who === 0 ? "smile_closed" as Expr : "laugh";
      case "late": return who === 2 ? "smile_closed" as Expr : "grin";
      case "where": return t > CUE.everyone - LEAD ? "laugh" : "grin";
      default: return "neutral";
    }
  }
  private waveOf(id: ShotId, t: number, who: number): number | undefined {
    const duo = who === 0 || who === 2;
    if (id === "sig1" && duo && t > CUE.wave - LEAD) return Math.sin(t * 9 + who * 1.7);
    if (id === "sig2" && duo && t > CUE.thumbs - LEAD) return 0.9;  // hand up and held: "thumbs up"
    if (id === "ask" && who === 0 && t > CUE.bro - LEAD) return 0.4 + 0.3 * Math.sin(t * 6);
    if (id === "onecar" && who === 0 && t > CUE.four - LEAD) return Math.sin(t * 8);
    return undefined;
  }

  /** people on foot: the four walking to their cars, standing at their doors with phones, the guard, Sharma ji running */
  private stageWalkers(id: ShotId, t: number, f: number, person: (who: number, x: number, y: number, z: number, o: Outfit, mode: "front" | "side", opts: Record<string, unknown>, mirror?: boolean, scale?: number) => void) {
    if (id === "street" || id === "walk") {
      // all four step out of their doors together and walk to their cars (side view, walking +z then the car door)
      const t0 = 0.25;
      HOUSE_X.forEach((x, i) => {
        // out of the gate and round the back of their own car to the driver's door (road side)
        const u = Math.max(0, t - t0), z = Math.min(DOOR_Z + u * 1.6, -3.5), walking = z < -3.5;
        person(i, x - 0.45, 0, z, PEOPLE[i], "front", walking ? { mode: "stroll", phase: (u * 2.1 + i * 0.13) % 1, expr: "neutral" } : { mode: "stand", expr: "neutral" });
      });
    }
    if (id === "doors") {
      HOUSE_X.forEach((x, i) => person(i, x, 0, -9.0, PEOPLE[i], "front", { mode: "stand", expr: i === 3 ? "nervous" : "neutral", look: i % 2 ? 1 : -1 }));
    }
    if (id === "gate" || id === "onecar" || id === "clock" || id === "leave" || id === "dead" || id === "guard" || id === "gate3" || id === "rushR" || id === "rushP" || id === "rushA") {
      // the guard by his booth, saluting each passing car (raised hand), once for the one car
      let sal = id === "gate" || id === "leave" || id === "dead" || id === "gate3" || id.startsWith("rush") ? (Math.sin(t * 6.5) > -0.2 ? 0.6 : undefined) : id === "onecar" && t > CUE.one - 0.2 ? 0.6 : undefined;
      let ex: Expr = id === "onecar" ? "smile_closed" as Expr : "stern";
      if (id === "guard") {
        // the guard's own arc, from story cues: tired salutes -> snaps -> sly grin (twist) -> one happy salute
        if (t > CUE.guardHappy - LEAD) { ex = "smile_closed" as Expr; sal = 0.6; }
        else if (t > CUE.guardTwist - LEAD) { ex = "grin"; sal = undefined; }
        else if (t > CUE.snap - LEAD) { ex = "pained"; sal = undefined; }
        else { ex = "dazed"; sal = Math.sin(t * 6.5) > -0.2 ? 0.6 : undefined; }
      }
      person(9, 37.4, 0, -5.4, GUARD, "front", { mode: "stand", expr: ex, wave: sal });
    }
    if (id === "late" || id === "where") {
      // Sharma ji (house 3) bursts out of his door and jogs for the waiting car
      const t0 = (hasCue("sharma") ? CUE.sharma : shotAt(f).a / FPS) - 0.25, u = Math.max(0, t - t0);
      const sx = HOUSE_X[3], from: V3 = [sx - 1.2, 0, DOOR_Z + 0.2], to: V3 = [WAIT_X + 2.3, 0, LANE_Z - 1.5];
      const k = clamp01(u / 5.6), x = from[0] + (to[0] - from[0]) * k, z = from[2] + (to[2] - from[2]) * smooth(Math.min(1, k * 1.8));
      person(3, x, 0, z, PEOPLE[3], "side", { mode: "march", phase: (u * 2.6) % 1, stride: 1.25, expr: "nervous" }, true);
    }
    void f;
  }
}

type Place = { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; scale: number; mirror: boolean; w: number; h: number; k: number };
type FxPl = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number };
void rep; void LOT; void SIGNAL_LANES; void STOP_X; void GATE_X;
