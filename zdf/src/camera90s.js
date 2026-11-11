// Props for "dad's camera": a 1990s 35 mm point-and-shoot (sliding lens cover, telescoping zoom lens, pop flash,
// LCD frame counter, hinged back door, film canister), a donate box with a lamp and cables, a light table with
// negatives, a phone, and a flat cap. Metres. The camera's lens points +z, top +y, origin at the body centre.
// All brand words are invented.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { rng } from './textures.js';

const TAU = Math.PI * 2;
const shadow = o => { o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };
const canvas = (w, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const tex = (c, srgb = true) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

function plasticBump() {
  const [c, g] = canvas(256); const r = rng(4);
  g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9000; i++) { const v = 110 + r() * 40; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(r() * 256, r() * 256, 1.5, 1.5); }
  const t = tex(c, false); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t;
}
let M = null;
function mats() {
  if (M) return M;
  const bump = plasticBump();
  M = {
    body: new THREE.MeshPhysicalMaterial({ color: 0x1c1c1f, roughness: 0.5, bumpMap: bump, bumpScale: 0.6, clearcoat: 0.25, clearcoatRoughness: 0.5 }),
    cover: new THREE.MeshPhysicalMaterial({ color: 0x2a2b2f, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2, metalness: 0.2 }),
    chrome: new THREE.MeshPhysicalMaterial({ color: 0xd4d7dc, metalness: 1, roughness: 0.18 }),
    satin: new THREE.MeshPhysicalMaterial({ color: 0x8d9198, metalness: 1, roughness: 0.38 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x0a0f18, roughness: 0.02, metalness: 0.1, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [200, 520], envMapIntensity: 2 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x111113, roughness: 0.85 }),
    cardboard: new THREE.MeshStandardMaterial({ color: 0x9a7a52, roughness: 0.95 }),
  };
  return M;
}
function label(text, w = 512, h = 96, font = '600 52px sans-serif', fg = '#d8d8dc', bg = null) {
  const [c, g] = canvas(w, h); if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); } else g.clearRect(0, 0, w, h);
  g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2);
  return tex(c);
}

// ---------- the camera ----------
export function camera90s() {
  const m = mats(), g = new THREE.Group();
  const W = 0.122, H = 0.068, D = 0.042;
  const body = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 6, 0.014), m.body); g.add(body);
  // grip bulge on the right (as seen from the front: -x)
  const grip = new THREE.Mesh(new RoundedBoxGeometry(0.03, H * 0.96, D * 1.18, 5, 0.012), m.body); grip.position.set(-W / 2 + 0.016, 0, 0.002); g.add(grip);
  // lens cover track: the clamshell slides along x
  const cover = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.05, 0.006, 4, 0.0025), m.cover); cover.position.set(0.006, -0.002, D / 2 + 0.004); g.add(cover);
  const coverTxt = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.008), new THREE.MeshBasicMaterial({ map: label('LUMA ZOOM 70', 512, 80, '600 46px sans-serif', '#b9bcc4'), transparent: true, depthWrite: false })); coverTxt.position.set(0, -0.017, 0.0032); cover.add(coverTxt);
  // lens: three telescoping rings and the front element, behind the cover
  const lens = new THREE.Group(); lens.position.set(0.006, -0.002, D / 2); g.add(lens);
  const rings = [[0.0175, 0.012, m.satin], [0.0155, 0.012, m.body], [0.0138, 0.01, m.satin]].map(([r, h, mat]) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 48), mat); c.rotation.x = Math.PI / 2; lens.add(c); return c; });
  const front = new THREE.Mesh(new THREE.CylinderGeometry(0.0118, 0.0118, 0.002, 48), m.glass); front.rotation.x = Math.PI / 2; lens.add(front);
  const fring = new THREE.Mesh(new THREE.TorusGeometry(0.0122, 0.0012, 8, 48), m.rubber); lens.add(fring);
  // flash window (top right of the front) + its light
  const flashM = new THREE.MeshStandardMaterial({ color: 0xcfd6dd, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.1 });
  const flashW = new THREE.Mesh(new RoundedBoxGeometry(0.026, 0.011, 0.003, 3, 0.002), flashM); flashW.position.set(0.036, 0.022, D / 2 + 0.001); g.add(flashW);
  const flashL = new THREE.PointLight(0xf2f6ff, 0, 6, 1.6); flashL.position.set(0.036, 0.022, D / 2 + 0.03); g.add(flashL);
  // viewfinder window and AF window
  const vf = new THREE.Mesh(new RoundedBoxGeometry(0.012, 0.009, 0.003, 3, 0.002), m.glass); vf.position.set(-0.012, 0.023, D / 2 + 0.001); g.add(vf);
  const af = new THREE.Mesh(new RoundedBoxGeometry(0.008, 0.006, 0.003, 3, 0.0015), m.glass); af.position.set(0.016, 0.024, D / 2 + 0.001); g.add(af);
  // top: shutter button, LCD frame counter, mode button
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.006, 0.004, 32), m.chrome); btn.position.set(-0.04, H / 2 + 0.002, 0.004); g.add(btn);
  const [lc, lg] = canvas(256, 128);
  const lcdTex = tex(lc);
  const lcd = new THREE.Mesh(new THREE.PlaneGeometry(0.022, 0.011), new THREE.MeshStandardMaterial({ map: lcdTex, roughness: 0.15, emissive: 0x9fb39a, emissiveMap: lcdTex, emissiveIntensity: 0.35 })); lcd.rotation.x = -Math.PI / 2; lcd.position.set(0.0, H / 2 + 0.0006, 0.002); g.add(lcd);
  let shown = -1;
  g.setCount = n => {
    if (n === shown) return; shown = n;
    lg.fillStyle = '#9fb39a'; lg.fillRect(0, 0, 256, 128);
    lg.fillStyle = 'rgba(20,28,20,.12)'; lg.font = '700 96px "Courier New", monospace'; lg.textAlign = 'right'; lg.textBaseline = 'middle'; lg.fillText('88', 236, 68);
    lg.fillStyle = '#18201a'; lg.fillText(String(n).padStart(2, ' '), 236, 68);
    lg.font = '700 24px sans-serif'; lg.textAlign = 'left'; lg.fillText('▶ AF', 18, 34);
    lcdTex.needsUpdate = true;
  };
  g.setCount(0);
  // back door (hinged on the left edge as seen from behind, +x), film chamber behind it
  const door = new THREE.Group(); door.position.set(W / 2 - 0.004, 0, -D / 2); g.add(door);
  const doorP = new THREE.Mesh(new RoundedBoxGeometry(W - 0.012, H - 0.01, 0.005, 3, 0.002), m.body); doorP.position.set(-(W - 0.012) / 2, 0, -0.002); door.add(doorP);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.012), new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.1 })); win.rotation.y = Math.PI; win.position.set(-0.03, 0.012, -0.0046); door.add(win);
  const chamber = new THREE.Mesh(new THREE.BoxGeometry(W - 0.016, H - 0.016, 0.004), new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.7 })); chamber.position.set(0, 0, -D / 2 + 0.002); g.add(chamber);
  const gate = new THREE.Mesh(new THREE.PlaneGeometry(0.036, 0.024), new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.3, metalness: 0.6 })); gate.rotation.y = Math.PI; gate.position.set(0.006, 0, -D / 2 - 0.0005); g.add(gate);
  // wrist strap from the right side
  const pts = []; for (let i = 0; i <= 40; i++) { const k = i / 40; pts.push(new THREE.Vector3(-W / 2 - 0.004 - Math.sin(k * Math.PI) * 0.03, 0.02 - k * 0.11, Math.sin(k * TAU) * 0.012)); }
  const strap = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.0028, 6), m.rubber); g.add(strap);
  g.strap = strap;
  // controls
  g.setLens = k => {                      // 0 closed, 1 open and zoomed out
    const kc = THREE.MathUtils.clamp(k * 2, 0, 1), kl = THREE.MathUtils.clamp(k * 2 - 1, 0, 1);
    cover.position.x = 0.006 + kc * 0.044;
    rings[0].position.z = 0.003 + kl * 0.006; rings[1].position.z = 0.003 + kl * 0.016; rings[2].position.z = 0.003 + kl * 0.026;
    front.position.z = 0.0085 + kl * 0.026; fring.position.z = front.position.z + 0.0006;
    lens.visible = kc > 0.15;
  };
  g.flash = k => { flashM.emissiveIntensity = k * 40; flashL.intensity = k * 18; };
  g.press = k => { btn.position.y = H / 2 + 0.002 - k * 0.0016; };
  g.setDoor = k => { door.rotation.y = -k * 1.9; };
  g.setLens(0); g.flash(0); g.setDoor(0);
  g.dims = { W, H, D };
  return shadow(g);
}
// a 35 mm film canister (invented brand), axis along y
export function canister() {
  const g = new THREE.Group();
  const [c, x] = canvas(512, 256);
  const gr = x.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#d9a326'); gr.addColorStop(1, '#c48a12'); x.fillStyle = gr; x.fillRect(0, 0, 512, 256);
  x.fillStyle = '#1a1a1a'; x.font = '800 92px sans-serif'; x.fillText('AURA', 26, 120); x.font = '700 54px sans-serif'; x.fillText('400', 300, 118);
  x.fillStyle = '#7a1d12'; x.fillRect(0, 160, 512, 56); x.fillStyle = '#f5e9cf'; x.font = '700 34px sans-serif'; x.fillText('36 EXP · COLOR NEGATIVE', 24, 200);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.0125, 0.046, 40), new THREE.MeshPhysicalMaterial({ map: tex(c), roughness: 0.35, metalness: 0.3, clearcoat: 0.5 })); g.add(body);
  for (const s of [-1, 1]) { const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0128, 0.0128, 0.003, 40), mats().chrome); cap.position.y = s * 0.0245; g.add(cap); }
  const spool = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.008, 16), mats().satin); spool.position.y = 0.029; g.add(spool);
  const leader = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.035, 0.0004), new THREE.MeshStandardMaterial({ color: 0x5a2a12, roughness: 0.4 })); leader.position.set(0.026, 0, 0.0115); g.add(leader);
  return shadow(g);
}
// ---------- donate box with a lamp and cables ----------
export function donateBox() {
  const m = mats(), g = new THREE.Group(), W = 0.46, H = 0.3, D = 0.34, th = 0.005;
  const side = (w, h, x, y, z, ry) => { const p = new THREE.Mesh(new THREE.BoxGeometry(w, h, th), m.cardboard); p.position.set(x, y, z); p.rotation.y = ry; g.add(p); return p; };
  side(W, H, 0, H / 2, D / 2, 0); side(W, H, 0, H / 2, -D / 2, 0); side(D, H, W / 2, H / 2, 0, Math.PI / 2); side(D, H, -W / 2, H / 2, 0, Math.PI / 2);
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(W, th, D), m.cardboard); bottom.position.y = th / 2; g.add(bottom);
  // open flaps, hanging outward
  for (const [z, ang] of [[D / 2, 1.35], [-D / 2, -2.0]]) { const f = new THREE.Mesh(new THREE.BoxGeometry(W, D * 0.48, th), m.cardboard); f.geometry.translate(0, D * 0.24, 0); f.position.set(0, H, z); f.rotation.x = ang; g.add(f); }
  // marker word
  const [c, x] = canvas(512, 160); x.clearRect(0, 0, 512, 160); x.fillStyle = '#121212'; x.font = '700 120px "Comic Sans MS", "Marker Felt", cursive'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('DONATE', 256, 86);
  const word = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.094), new THREE.MeshStandardMaterial({ map: tex(c), transparent: true, roughness: 0.9 })); word.position.set(0, H * 0.5, D / 2 + th); word.rotation.z = -0.03; g.add(word);
  // a broken desk lamp leaning in the box
  const lamp = new THREE.Group(); lamp.position.set(-0.12, 0.05, -0.04); lamp.rotation.z = 0.5; g.add(lamp);
  const arm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.26, 12), m.satin); arm1.position.y = 0.13; lamp.add(arm1);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.08, 32, 1, true), new THREE.MeshPhysicalMaterial({ color: 0x3a3d42, metalness: 0.7, roughness: 0.35, side: THREE.DoubleSide })); head.position.set(0.04, 0.27, 0); head.rotation.z = -2.2; lamp.add(head);
  // cables: tangled tubes
  const r = rng(12), cm = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.6 });
  for (let k = 0; k < 3; k++) { const p = []; for (let i = 0; i <= 30; i++) { const a = i / 30 * TAU * (1.4 + k * 0.3); p.push(new THREE.Vector3(Math.cos(a) * (0.08 + r() * 0.03) + 0.05 * k - 0.03, 0.03 + i * 0.004 + r() * 0.01, Math.sin(a) * (0.07 + r() * 0.03))); }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p), 120, 0.0035, 6), cm)); }
  // a pile of cables lifts the camera to just below the rim
  const pile = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.18), new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.9 })); pile.position.set(0.06, 0.09, 0.02); g.add(pile);
  g.top = new THREE.Vector3(0.06, 0.215, 0.04); // where the camera rests
  return shadow(g);
}
// ---------- light table with negative strips ----------
function negatives(seed) {
  const [c, x] = canvas(1024, 192); const r = rng(seed);
  x.fillStyle = '#b8682a'; x.fillRect(0, 0, 1024, 192);      // orange mask of colour negative
  for (let i = 0; i < 26; i++) { x.fillStyle = 'rgba(40,16,4,.9)'; x.fillRect(8 + i * 39.5, 10, 18, 14); x.fillRect(8 + i * 39.5, 168, 18, 14); }
  for (let f = 0; f < 4; f++) {
    const fx = 24 + f * 250, fy = 34, fw = 232, fh = 124;
    // a negative image: inverted silhouettes (horizon, a figure, a sun) - light where the scene was dark
    const gr = x.createLinearGradient(0, fy, 0, fy + fh); gr.addColorStop(0, '#5a2a10'); gr.addColorStop(0.6, '#8a4a1c'); gr.addColorStop(1, '#d48a48'); x.fillStyle = gr; x.fillRect(fx, fy, fw, fh);
    x.fillStyle = '#efb070'; x.fillRect(fx, fy + fh * (0.55 + r() * 0.1), fw, fh * 0.45);
    x.fillStyle = '#2a1004'; x.beginPath(); x.arc(fx + fw * (0.2 + r() * 0.6), fy + fh * 0.35, 12 + r() * 10, 0, TAU); x.fill();
    if (r() > 0.3) { const px = fx + fw * (0.3 + r() * 0.4); x.fillStyle = '#f6c890'; x.fillRect(px, fy + fh * 0.35, 14, fh * 0.45); x.beginPath(); x.arc(px + 7, fy + fh * 0.3, 10, 0, TAU); x.fill(); }
    x.fillStyle = '#e8a060'; x.font = '700 14px monospace'; x.fillText(String(12 + f + seed * 4) + 'A', fx + fw - 30, fy + fh + 8);
  }
  return tex(c);
}
export function lightTable() {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.5), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2e2, emissiveIntensity: 0.4, roughness: 0.4 })); top.position.y = -0.015; g.add(top);
  top.material.userData.noRim = true;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.04, 0.54), new THREE.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.6 })); frame.position.y = -0.024; g.add(frame);
  const strips = [];
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.116), new THREE.MeshStandardMaterial({ map: negatives(i), transparent: true, opacity: 0.94, roughness: 0.25, emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0 }));
    s.material.userData.noRim = true;
    s.rotation.x = -Math.PI / 2; s.rotation.z = (i - 1.5) * 0.04; s.position.set((i % 2) * 0.02 - 0.01, 0.001 + i * 0.0006, -0.18 + i * 0.12); g.add(s); strips.push(s);
  }
  // a loupe resting on the strips
  const loupe = new THREE.Group(); loupe.position.set(0.12, 0.02, 0.05); g.add(loupe);
  const lm = new THREE.MeshPhysicalMaterial({ color: 0x18181a, roughness: 0.3, clearcoat: 0.6 });
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.04, 40, 1, true), lm); cone.material.side = THREE.DoubleSide; loupe.add(cone);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.003, 40), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0, transmission: 1, thickness: 0.01, ior: 1.5 })); lens.position.y = 0.02; loupe.add(lens);
  g.strips = strips;
  return shadow(g);
}
// ---------- phone (screen faces +z), with a live canvas screen ----------
export function phone() {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new RoundedBoxGeometry(0.072, 0.15, 0.008, 6, 0.006), new THREE.MeshPhysicalMaterial({ color: 0x101012, roughness: 0.3, metalness: 0.4, clearcoat: 0.8 })); g.add(b);
  const [c, x] = canvas(540, 1120); const t = tex(c);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.143), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); scr.position.z = 0.0042; g.add(scr);
  scr.material.userData.noRim = true;
  const glow = new THREE.PointLight(0xe8f0ff, 0, 1.2, 1.6); glow.position.set(0, 0, 0.12); g.add(glow);
  g.screen = { canvas: c, ctx: x, tex: t }; g.glow = glow;
  g.draw = fn => { fn(x, 540, 1120); t.needsUpdate = true; };
  return shadow(g);
}
// ---------- a flat cap (for dad's silhouette), sized for a head, centred at the crown ----------
export function flatCap() {
  const g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: 0x2c2620, roughness: 0.9 });
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.105, 32, 16, 0, TAU, 0, Math.PI / 2), mat); crown.scale.set(1, 0.42, 1.12); g.add(crown);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.007, 32, 1, false, -Math.PI / 2, Math.PI), mat); brim.position.set(0, -0.004, 0.085); brim.scale.set(1.15, 1, 0.62); brim.rotation.x = 0.18; g.add(brim);
  return shadow(g);
}
