// Props for the "dead wax" short: a vinyl record (grooves, track gaps, dead wax with a hand-scratched code, paper
// label), a macro groove surface for fly-overs, a stylus, sleeves and a crate, a cutting lathe, a record press and
// an attic with a sun shaft and dust. Record units: radius 1 = 6 inches (multiply by REC to get metres).
import * as THREE from 'three';
import { glowTexture, rng } from './textures.js';

export const REC = 0.1524;
const TAU = Math.PI * 2;
const shadow = o => { o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };
const canvas = (w, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const tex = (c, srgb = true) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t; };

// The code collectors read in the dead wax (invented, not a real release)
export const CODE_A = '△7  HLX-4471-A1  J.R.';
export const CODE_B = '△31  HLX-4471-A9';
export const LABEL_RED = '#c8372d';

// radii (record units)
const R_EDGE = 1, R_LEADIN = 0.975, R_LAST = 0.42, R_LABEL = 0.34, R_HOLE = 0.024;
const TRACK_GAPS = [0.86, 0.75, 0.64, 0.53];

// ---------- record surface textures (colour / bump / roughness), drawn once and shared ----------
let RT = null;
function recordTextures() {
  if (RT) return RT;
  const S = 4096, C = S / 2, px = r => r * C;
  const [cc, g] = canvas(S), [bc, b] = canvas(S), [rc, r] = canvas(S);
  const rand = rng(8);
  g.fillStyle = '#0a0a0b'; g.fillRect(0, 0, S, S);
  b.fillStyle = '#808080'; b.fillRect(0, 0, S, S);
  r.fillStyle = '#2a2a2a'; r.fillRect(0, 0, S, S);          // smooth areas: glossy
  const inGap = rr => TRACK_GAPS.some(t => Math.abs(rr - t) < 0.006);
  // grooves: one line per revolution, ~3 px apart
  for (let rr = R_LEADIN; rr > R_LAST; rr -= 1.45 / C) {
    if (inGap(rr)) continue;
    const v = 18 + rand() * 10;
    g.strokeStyle = `rgb(${v},${v},${v + 2})`; g.lineWidth = 1.1; g.beginPath(); g.arc(C, C, px(rr), 0, TAU); g.stroke();
    b.strokeStyle = '#3c3c3c'; b.lineWidth = 1.2; b.beginPath(); b.arc(C, C, px(rr), 0, TAU); b.stroke();
    r.strokeStyle = '#6a6a6a'; r.lineWidth = 1.4; r.beginPath(); r.arc(C, C, px(rr), 0, TAU); r.stroke();
  }
  // lead-out: a few wide spirals into the dead wax, and the locked groove
  for (const rr of [0.405, 0.388, 0.372]) { b.strokeStyle = '#4a4a4a'; b.lineWidth = 2; b.beginPath(); b.arc(C, C, px(rr), 0, TAU); b.stroke(); }
  // label paper
  const lg = g.createRadialGradient(C, C, 0, C, C, px(R_LABEL));
  lg.addColorStop(0, '#e4d9c2'); lg.addColorStop(1, '#d6c8aa');
  g.fillStyle = lg; g.beginPath(); g.arc(C, C, px(R_LABEL), 0, TAU); g.fill();
  r.fillStyle = '#c8c8c8'; r.beginPath(); r.arc(C, C, px(R_LABEL), 0, TAU); r.fill();
  b.fillStyle = '#808080'; b.beginPath(); b.arc(C, C, px(R_LABEL), 0, TAU); b.fill();
  g.strokeStyle = LABEL_RED; g.lineWidth = 34; g.beginPath(); g.arc(C, C, px(R_LABEL) - 40, 0, TAU); g.stroke();
  g.lineWidth = 6; g.beginPath(); g.arc(C, C, px(R_LABEL) - 78, 0, TAU); g.stroke();
  g.fillStyle = '#2b2522'; g.textAlign = 'center';
  g.font = '700 92px Georgia, serif'; g.fillText('HELIX', C, C - px(0.17));
  g.font = '600 46px Georgia, serif'; g.fillText('RECORDS', C, C - px(0.12));
  g.font = '600 44px Georgia, serif'; g.fillText('SIDE A', C - px(0.18), C + 14); g.fillText('33⅓', C + px(0.18), C + 14);
  g.font = 'italic 40px Georgia, serif'; g.fillText('1. Morning Line   2. Copper Sky', C, C + px(0.13));
  g.fillText('3. Old Station   4. Paper Moon', C, C + px(0.18));
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(120,90,50,${rand() * 0.06})`; const a = rand() * TAU, d = rand() * px(R_LABEL); g.beginPath(); g.arc(C + Math.cos(a) * d, C + Math.sin(a) * d, 2 + rand() * 9, 0, TAU); g.fill(); }
  // spindle hole
  g.fillStyle = '#050505'; g.beginPath(); g.arc(C, C, px(R_HOLE), 0, TAU); g.fill();
  // light surface wear: fine hairline scuffs
  for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(140,140,150,${0.03 + rand() * 0.05})`; g.lineWidth = 0.8; const a = rand() * TAU, d = px(0.45 + rand() * 0.5); g.beginPath(); g.arc(C, C, d, a, a + 0.05 + rand() * 0.2); g.stroke(); }
  const flip = t => { t.center.set(0.5, 0.5); return t; };
  RT = { map: flip(tex(cc)), bump: flip(tex(bc, false)), rough: flip(tex(rc, false)) };
  return RT;
}
// scratched code as a strip texture (u = along the arc, v = across); `n` = characters shown (for the etching shot)
export function codeTexture(code, n = code.length, glow = 0, bright = false) {
  const [c, g] = canvas(2048, 256);
  g.clearRect(0, 0, 2048, 256);
  g.font = '500 150px "Courier New", monospace'; g.textBaseline = 'middle';
  let x = 40; const rand = rng(code.length * 13);
  for (let i = 0; i < Math.min(n, code.length); i++) {
    const ch = code[i], w = g.measureText(ch).width;
    g.save(); g.translate(x, 128 + (rand() - 0.5) * 10); g.rotate((rand() - 0.5) * 0.08);
    // a hand-scratched character: three slightly offset passes
    for (let k = 0; k < 3; k++) { g.fillStyle = k === 2 ? (bright ? 'rgba(235,238,245,.95)' : 'rgba(150,150,158,.75)') : (bright ? 'rgba(170,175,190,.5)' : 'rgba(95,95,105,.35)'); g.fillText(ch, (rand() - 0.5) * 3, (rand() - 0.5) * 3); }
    if (glow) { g.shadowColor = `rgba(255,220,150,${glow})`; g.shadowBlur = 30; g.fillStyle = `rgba(255,236,190,${glow})`; g.fillText(ch, 0, 0); g.shadowBlur = 0; }
    g.restore(); x += w * 0.92;
  }
  const t = tex(c); t.userData.endU = x / 2048; t.userData.nextW = g.measureText(code[Math.min(n, code.length - 1)] || ' ').width * 0.92 / 2048; return t;
}
// an arc-shaped strip lying on the record top (y up), centred at 6 o'clock towards the viewer (+z)
export function codeStrip(code, r = 0.385, span = 0.95) {
  const a0 = -Math.PI / 2 - span / 2;
  const geo = new THREE.RingGeometry(r - 0.016, r + 0.016, 96, 1, a0, span);
  // re-map uv: u along the arc (reversed so text reads left-to-right from outside), v across
  const uv = geo.attributes.uv, p = geo.attributes.position;
  for (let i = 0; i < uv.count; i++) {
    const x = p.getX(i), y = p.getY(i), a = Math.atan2(y, x), rr = Math.hypot(x, y);
    let aa = a; if (aa > Math.PI / 2) aa -= Math.PI * 2;
    uv.setXY(i, (aa - a0) / span, 1 - (rr - (r - 0.016)) / 0.032);
  }
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: codeTexture(code), transparent: true, roughness: 0.55, metalness: 0.2, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.0064; m.renderOrder = 2;
  return m;
}

// ---------- the record ----------
// lies flat (top = +y), centred at the origin, radius 1. code: the dead wax inscription
export function record(code = CODE_A) {
  const T = recordTextures(), g = new THREE.Group();
  const top = new THREE.MeshPhysicalMaterial({ map: T.map, bumpMap: T.bump, bumpScale: 0.6, roughnessMap: T.rough, roughness: 1, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.12, envMapIntensity: 1.1 });
  const side = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0c, roughness: 0.25, clearcoat: 0.8 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(R_EDGE, R_EDGE, 0.012, 128, 1), [side, top, top]);
  g.add(disc);
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(R_HOLE, R_HOLE, 0.014, 24), new THREE.MeshBasicMaterial({ color: 0x000000 })); g.add(hole);
  const cs = codeStrip(code); g.add(cs); g.code = cs;
  // the code is also on the underside (side B) so a tilted record never looks blank
  return shadow(g);
}

// ---------- macro groove surface ----------
// x across the grooves (1 unit = groove pitch), z along a groove, y up. One wiggle function per groove index.
const MUS = (n, z) => {
  const env = 0.55 + 0.45 * Math.sin(z * 0.11 + n * 0.37) * Math.sin(z * 0.043 + 1.3);
  return env * (0.07 * Math.sin(z * 1.3 + n * 0.21) + 0.035 * Math.sin(z * 3.1 + n * 0.9) + 0.015 * Math.sin(z * 6.7 + n * 1.7));
};
export const grooveCentre = (n, z) => n + MUS(n, z);
export function grooveSurface({ grooves = 16, length = 70, resX = 22, resZ = 9, smoothFrom = null } = {}) {
  const nx = grooves * resX, nz = Math.round(length * resZ);
  const geo = new THREE.PlaneGeometry(grooves, length, nx, nz);
  geo.rotateX(-Math.PI / 2); geo.translate(0, 0, -length / 2);       // z from 0 (near) to -length (far)
  const p = geo.attributes.position, W = 0.36, D = 0.36;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = -p.getZ(i);
    let h = 0;
    if (smoothFrom === null || x < smoothFrom) {
      const n = Math.round(x), d = Math.abs(x - grooveCentre(n, z)), d2 = Math.abs(x - grooveCentre(n + 1, z)), d0 = Math.abs(x - grooveCentre(n - 1, z));
      const dm = Math.min(d, d2, d0);
      if (dm < W) h = -D * (1 - dm / W);                              // 90° V-groove
      else if (dm < W + 0.05) h = 0.012 * Math.sin((dm - W) / 0.05 * Math.PI);  // the tiny raised lip at the edge
    }
    p.setY(i, h);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshPhysicalMaterial({ color: 0x060607, roughness: 0.22, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.12, envMapIntensity: 0.55 });
  const m = new THREE.Mesh(geo, mat); m.receiveShadow = true; m.castShadow = false;
  const g = new THREE.Group(); g.add(m);
  // dust: a few irregular specks resting on the land between grooves
  const rand = rng(5), dm = new THREE.MeshStandardMaterial({ color: 0xb9b4aa, roughness: 0.9, flatShading: true });
  for (let i = 0; i < 26; i++) {
    const d = new THREE.Mesh(new THREE.IcosahedronGeometry(0.04 + rand() * 0.06, 0), dm);
    const n = Math.floor(rand() * grooves) - grooves / 2 + 0.5;
    d.position.set(n + 0.5 * (rand() > 0.5 ? 1 : -1) * 0.95, 0.03, -rand() * length); d.rotation.set(rand() * 3, rand() * 3, rand() * 3); d.scale.set(1, 0.6 + rand(), 1.2 + rand() * 2);
    g.add(d);
  }
  g.surface = m;
  return g;
}

// ---------- stylus: diamond tip at the origin, cantilever going up and back (+z) ----------
export function stylus() {
  const g = new THREE.Group();
  const dia = new THREE.MeshPhysicalMaterial({ color: 0x55667a, roughness: 0.08, metalness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.05, envMapIntensity: 0.9, iridescence: 0.6, iridescenceIOR: 1.8 });
  const alu = new THREE.MeshPhysicalMaterial({ color: 0xd9dde2, metalness: 1, roughness: 0.22 });
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.55, 24, 1), dia); tip.rotation.x = Math.PI; tip.position.y = 0.275 + 0.015; g.add(tip);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 8), dia); ball.position.y = 0.02; g.add(ball);
  const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.14, 20), alu); mount.position.y = 0.55; g.add(mount);
  const cant = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 6, 16), alu); cant.position.set(0, 0.55 + Math.cos(0.35) * 3, Math.sin(0.35) * 3); cant.rotation.x = 0.35; g.add(cant);
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.6, 3.4), new THREE.MeshPhysicalMaterial({ color: 0x141416, roughness: 0.35, clearcoat: 0.6 })); body.position.set(0, 0.55 + Math.cos(0.35) * 6 + 0.6, Math.sin(0.35) * 6 + 1.4); g.add(body);
  for (const sx of [-0.8, 0.8]) { const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 16), new THREE.MeshPhysicalMaterial({ color: 0xe6c070, metalness: 1, roughness: 0.25 })); sc.position.set(sx, body.position.y + 0.82, body.position.z); g.add(sc); }
  return shadow(g);
}

// ---------- sleeves, crate, signs (metres) ----------
const SLEEVE = 0.315;
function coverArt(seed) {
  const [c, g] = canvas(512); const r = rng(seed);
  const pal = [['#e9dcc0', '#c8372d', '#20323f'], ['#1f3b4d', '#e8b04b', '#f0e6d4'], ['#d9cbb0', '#2f5d50', '#b5482f'], ['#2a2626', '#d7c49e', '#7d9aa8'], ['#e7d6b8', '#4a6b8a', '#d27b3a'], ['#3d2b3d', '#e6a57e', '#f2e3c9'], ['#c9d3c2', '#21313b', '#c2452d']][seed % 7];
  g.fillStyle = pal[0]; g.fillRect(0, 0, 512, 512);
  const kind = seed % 4;
  if (kind === 0) for (let i = 0; i < 6; i++) { g.fillStyle = pal[1 + (i % 2)]; g.beginPath(); g.arc(256, 256, 230 - i * 36, 0, TAU); g.fill(); }
  else if (kind === 1) for (let i = 0; i < 9; i++) { g.fillStyle = pal[1 + (i % 2)]; g.fillRect(0, i * 58, 512, 26); }
  else if (kind === 2) { g.fillStyle = pal[1]; g.beginPath(); g.moveTo(0, 512); g.lineTo(256, 120); g.lineTo(512, 512); g.fill(); g.fillStyle = pal[2]; g.beginPath(); g.arc(380, 140, 60, 0, TAU); g.fill(); }
  else { for (let i = 0; i < 14; i++) { g.fillStyle = pal[1 + (i % 2)]; g.fillRect(r() * 512, r() * 512, 40 + r() * 140, 40 + r() * 140); } }
  // ageing: ring wear, corner fade, grime
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 14; g.beginPath(); g.arc(256, 256, 200, 0, TAU); g.stroke();
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(80,60,40,${r() * 0.07})`; g.fillRect(r() * 512, r() * 512, 2 + r() * 8, 2 + r() * 8); }
  const vg = g.createRadialGradient(256, 256, 120, 256, 256, 380); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(60,40,20,.35)'); g.fillStyle = vg; g.fillRect(0, 0, 512, 512);
  return tex(c);
}
const card = new THREE.MeshStandardMaterial({ color: 0xcdbb98, roughness: 0.95 });
export function sleeve(seed = 0) {
  const art = coverArt(seed);
  const front = new THREE.MeshStandardMaterial({ map: art, roughness: 0.75 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(SLEEVE, SLEEVE, 0.0045), [card, card, card, card, front, front]);
  m.castShadow = m.receiveShadow = true; m.geometry.translate(0, SLEEVE / 2, 0); // pivot on the bottom edge
  return m;
}
function woodTex(seed, tone = '#8a6a48') {
  const [c, g] = canvas(512, 128); const r = rng(seed);
  g.fillStyle = tone; g.fillRect(0, 0, 512, 128);
  for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(${40 + r() * 30},${25 + r() * 15},10,${0.1 + r() * 0.15})`; g.lineWidth = 1 + r() * 2; const y = r() * 128; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(170, y + (r() - .5) * 14, 340, y + (r() - .5) * 14, 512, y + (r() - .5) * 8); g.stroke(); }
  return tex(c);
}
// an open wooden crate (inside 0.33 wide) holding `n` sleeves, front at +z. returns { group, sleeves, flip(t) }
export function crate(n = 16, seed = 0, signText = '$1 EACH') {
  const g = new THREE.Group(), W = 0.36, H = 0.24, D = 0.42, th = 0.016;
  const wm = new THREE.MeshStandardMaterial({ map: woodTex(seed + 3), roughness: 0.8 });
  const board = (w, h, d, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wm); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
  board(W, th, D, 0, th / 2, 0);
  for (const sx of [-1, 1]) for (const y of [0.03, 0.12, 0.2]) board(th, 0.07, D, sx * (W / 2 - th / 2), y + 0.035, 0);
  for (const sz of [-1, 1]) for (const y of [0.03, 0.12]) board(W, 0.075, th, 0, y + 0.0375, sz * (D / 2 - th / 2));
  const sleeves = [];
  for (let i = 0; i < n; i++) { const s = sleeve(seed * 31 + i); s.position.set((i % 3 - 1) * 0.002, th, -D / 2 + 0.04 + i * 0.021); s.rotation.x = -0.2; g.add(s); sleeves.push(s); }
  // cardboard sign taped to the front
  const [c, cx] = canvas(512, 256);
  cx.fillStyle = '#c9a77a'; cx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 200; i++) { cx.fillStyle = `rgba(90,60,30,${Math.random() * 0.08})`; cx.fillRect(Math.random() * 512, Math.random() * 256, 3, 3); }
  cx.fillStyle = '#1b1b1d'; cx.font = '700 118px "Comic Sans MS", "Marker Felt", cursive'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(signText, 256, 132);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.12), new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.95 }));
  sign.position.set(0.0, 0.1, D / 2 + 0.002); sign.rotation.z = -0.05; sign.castShadow = true; g.add(sign);
  const tape = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.02), new THREE.MeshStandardMaterial({ color: 0xe8e2c8, roughness: 0.4, transparent: true, opacity: 0.8 })); tape.position.set(0, 0.16, D / 2 + 0.003); g.add(tape);
  // flip(t): sleeves tip forward one after another, as if a hand above the frame is flicking through them
  const flip = (t, rate = 5, from = n - 1) => {
    sleeves.forEach((s, i) => {
      const k = from - i, start = k / rate;
      const a = THREE.MathUtils.clamp((t - start) * 3.2, 0, 1), e = a * a * (3 - 2 * a);
      s.rotation.x = -0.2 + e * 0.55;
    });
  };
  return { group: shadow(g), sleeves, flip, sign };
}

// ---------- attic: sloped ceiling, rafters, a small window, the sun shaft and dust ----------
export function attic(scene, { sun = new THREE.Vector3(-1.4, 1.6, 0.8).normalize(), reach = 3.2 } = {}) {
  const g = new THREE.Group(); scene.add(g);
  const wood = new THREE.MeshStandardMaterial({ map: woodTex(17, '#6b5038'), roughness: 0.85 });
  for (let i = -6; i <= 6; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 7), wood); r.position.set(i * 0.6, 2.25, -0.4); r.rotation.x = 0; r.rotation.z = 0; g.add(r); const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.2, 0.14), wood); p.position.set(i * 0.6, 1.6, -3.1); p.rotation.x = 0.0; g.add(p); }
  const roof = new THREE.Mesh(new THREE.PlaneGeometry(9, 7), new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: 0.95, side: THREE.DoubleSide })); roof.rotation.x = Math.PI / 2; roof.position.set(0, 2.32, -0.4); g.add(roof);
  // the sun shaft: a long box with an additive vertical gradient, aligned with the sun direction
  const [c, cx] = canvas(64, 256); const gr = cx.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,248,230,.0)'); gr.addColorStop(0.25, 'rgba(255,248,230,.55)'); gr.addColorStop(1, 'rgba(255,248,230,.12)'); cx.fillStyle = gr; cx.fillRect(0, 0, 64, 256);
  const sm = new THREE.MeshBasicMaterial({ map: tex(c), transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, reach * 2, 4, 1, true), sm); shaft.rotation.y = Math.PI / 4;
  const holder = new THREE.Group(); holder.add(shaft); holder.position.copy(sun.clone().multiplyScalar(reach)).add(new THREE.Vector3(0, 0.0, 0)); holder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), sun); g.add(holder);
  // dust motes drifting inside the shaft (deterministic)
  const motes = [], mm = new THREE.SpriteMaterial({ map: glowTexture(), color: 0xfff4dc, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const r = rng(99);
  for (let i = 0; i < 140; i++) { const s = new THREE.Sprite(mm); s.scale.setScalar(0.003 + r() * 0.004); s.userData = { u: r(), v: (r() - 0.5) * 0.8, w: (r() - 0.5) * 0.8, ph: r() * 10, sp: 0.01 + r() * 0.03 }; g.add(s); motes.push(s); }
  const along = sun.clone(), side1 = new THREE.Vector3().crossVectors(along, new THREE.Vector3(0, 0, 1)).normalize(), side2 = new THREE.Vector3().crossVectors(along, side1).normalize();
  g.update = t => { for (const s of motes) { const d = s.userData; const u = ((d.u + t * d.sp) % 1) * reach * 1.6; s.position.copy(along).multiplyScalar(u).addScaledVector(side1, d.v * 0.5 + Math.sin(t * 0.7 + d.ph) * 0.03).addScaledVector(side2, d.w * 0.5 + Math.cos(t * 0.5 + d.ph) * 0.03); } };
  g.update(0);
  return g;
}

// ---------- cutting lathe: a lacquer on a platter, the cutter head with a hot stylus, and the swarf thread ----------
export function lathe() {
  const g = new THREE.Group();
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xc3c7cc, metalness: 1, roughness: 0.25 });
  const plat = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.12, 96), steel); plat.position.y = -0.07; g.add(plat);
  const lacquer = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.015, 128), new THREE.MeshPhysicalMaterial({ color: 0x0f1622, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6 }));
  g.add(lacquer);
  // already-cut band: slightly satin ring
  const T = recordTextures();
  const band = new THREE.Mesh(new THREE.RingGeometry(0.72, 0.975, 128), new THREE.MeshPhysicalMaterial({ color: 0x1a2232, bumpMap: T.bump, bumpScale: 0.8, roughnessMap: T.rough, roughness: 0.9, clearcoat: 0.8, clearcoatRoughness: 0.15 }));
  { const uv = band.geometry.attributes.uv, p = band.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 2 + 0.5, p.getY(i) / 2 + 0.5); } band.rotation.x = -Math.PI / 2; band.position.y = 0.0081; g.add(band);
  const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 16), steel); spindle.position.y = 0.05; g.add(spindle);
  // cutter head on its carriage, stylus touching the lacquer at radius 0.72
  const head = new THREE.Group(); head.position.set(-0.72, 0, 0); g.add(head);
  const bodyM = new THREE.MeshPhysicalMaterial({ color: 0x2a2d33, metalness: 0.6, roughness: 0.35 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.26), bodyM); box.position.set(0, 0.2, 0); head.add(box);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.08), steel); arm.position.set(-0.7, 0.3, 0); head.add(arm);
  const tipM = new THREE.MeshStandardMaterial({ color: 0xffb46a, emissive: 0xff7a20, emissiveIntensity: 0.9, roughness: 0.3 });
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.09, 16), tipM); tip.rotation.x = Math.PI; tip.position.y = 0.045 + 0.008; head.add(tip);
  const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xff8a30, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false })); gl.scale.setScalar(0.09); gl.position.y = 0.006; head.add(gl);
  // swarf: the thin lacquer thread curling away from the stylus (a helix that grows over time)
  const pts = []; for (let i = 0; i <= 260; i++) { const k = i / 260, a = k * 9 * TAU; pts.push(new THREE.Vector3(Math.cos(a) * 0.012 * (1 + k) + k * 0.1, 0.012 + k * 0.12, Math.sin(a) * 0.012 * (1 + k) + k * 0.05)); }
  const swarf = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.0016, 5), new THREE.MeshPhysicalMaterial({ color: 0x1b2230, roughness: 0.2, clearcoat: 1 })); head.add(swarf);
  g.platter = [plat, lacquer, band]; g.head = head; g.swarf = swarf; g.glow = gl;
  g.update = t => { for (const m of g.platter) m.rotation.y = -t * 3.5; swarf.rotation.y = t * 0.6; gl.material.opacity = 0.75 + 0.25 * Math.sin(t * 40); };
  return shadow(g);
}

// ---------- record press: two heavy dies, a vinyl puck, steam ----------
export function press() {
  const g = new THREE.Group();
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xb5bac0, metalness: 1, roughness: 0.3 });
  const dark = new THREE.MeshPhysicalMaterial({ color: 0x2b2f35, metalness: 0.8, roughness: 0.4 });
  const lower = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.3, 0.35, 96), steel); lower.position.y = -0.2; g.add(lower);
  const upper = new THREE.Group(); g.add(upper);
  const ud = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.35, 96), steel); ud.position.y = 0.175; upper.add(ud);
  const ram = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3, 32), dark); ram.position.y = 1.85; upper.add(ram);
  for (const sx of [-1.45, 1.45]) { const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5, 24), steel); col.position.set(sx, 1.2, -0.3); g.add(col); }
  const puck = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 48), new THREE.MeshPhysicalMaterial({ color: 0x111113, roughness: 0.35, clearcoat: 0.6 })); puck.position.y = 0.06; g.add(puck);
  const rec = record(CODE_A); rec.visible = false; rec.position.y = 0.008; g.add(rec);
  const heat = new THREE.PointLight(0xff8a40, 0, 3); heat.position.set(0, 0.3, 0.8); g.add(heat);
  // steam
  const sm = new THREE.SpriteMaterial({ map: glowTexture(), color: 0xf3f3f3, transparent: true, depthWrite: false, opacity: 0 });
  const puffs = []; const r = rng(3);
  for (let i = 0; i < 28; i++) { const s = new THREE.Sprite(sm.clone()); s.userData = { a: r() * TAU, sp: 0.6 + r() * 0.8, d: r() * 0.4, sz: 0.4 + r() * 0.6 }; g.add(s); puffs.push(s); }
  // update(open 0..1, squash 0..1, steamT seconds since the press closed or -1)
  g.update = (open, squash, steamT) => {
    upper.position.y = 0.12 + open * 1.6;
    puck.visible = squash < 1; rec.visible = squash >= 1;
    puck.scale.set(1 + squash * 2.1, 1 - squash * 0.9, 1 + squash * 2.1);
    heat.intensity = steamT >= 0 ? 3 * Math.exp(-steamT * 1.5) : 0;
    for (const s of puffs) {
      const u = s.userData, k = steamT < 0 ? -1 : steamT * u.sp - u.d;
      s.visible = k > 0; if (k <= 0) continue;
      s.position.set(Math.cos(u.a) * (1.25 + k * 0.7), 0.05 + k * 0.9, Math.sin(u.a) * (1.25 + k * 0.7));
      s.scale.setScalar(u.sz * (0.5 + k)); s.material.opacity = Math.max(0, 0.32 * (1 - k / 1.6));
    }
  };
  g.update(1, 0, -1);
  return shadow(g);
}
