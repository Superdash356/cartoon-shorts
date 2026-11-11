// Props for the "rubies in a dead watch" short: a mechanical wristwatch with a working movement, a pivot cutaway,
// a waste bin, a phone, tweezers and a floating result card. Everything is built in "watch units" (case radius = 1)
// and scaled by the shot; the watch faces +Z, the movement's wheels turn about Z.
import * as THREE from 'three';
import { glowTexture, rng } from './textures.js';

const TAU = Math.PI * 2;
const DIAL_ROT = Math.PI / 2;
const shadow = o => { o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };

// ---------- textures ----------
function canvasTex(S, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = c.height = S; draw(c.getContext('2d'), S);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function dialTexture() {
  return canvasTex(1024, (g, S) => {
    const r = rng(12), C = S / 2;
    const gr = g.createRadialGradient(C, C * 0.9, 40, C, C, C); gr.addColorStop(0, '#f1e9d6'); gr.addColorStop(0.75, '#e6dabf'); gr.addColorStop(1, '#cdbb96');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(120,90,40,${r() * 0.05})`; g.beginPath(); g.arc(r() * S, r() * S, 2 + r() * 16, 0, TAU); g.fill(); }
    g.translate(C, C);
    for (let i = 0; i < 60; i++) {
      g.save(); g.rotate(i / 60 * TAU); g.fillStyle = '#2a2622';
      if (i % 5 === 0) g.fillRect(-9, -470, 18, 78); else g.fillRect(-2.5, -470, 5, 26);
      g.restore();
    }
    g.fillStyle = '#2a2622'; g.textAlign = 'center';
    g.font = '600 34px Georgia, serif'; g.fillText('17 JEWELS', 0, -190);
    g.font = '500 22px Georgia, serif'; g.fillText('SHOCK RESISTANT  ·  ANTIMAGNETIC', 0, 300);
    g.strokeStyle = 'rgba(42,38,34,.75)'; g.lineWidth = 4; g.beginPath(); g.arc(0, 190, 96, 0, TAU); g.stroke();
    for (let i = 0; i < 12; i++) { g.save(); g.translate(0, 190); g.rotate(i / 12 * TAU); g.fillRect(-2, -92, 4, i % 3 === 0 ? 20 : 11); g.restore(); }
    g.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 0; i < 14; i++) { g.strokeStyle = `rgba(60,50,30,${0.05 + r() * 0.1})`; g.lineWidth = 0.8; g.beginPath(); const x = r() * S, y = r() * S; g.moveTo(x, y); g.lineTo(x + (r() - .5) * 220, y + (r() - .5) * 220); g.stroke(); }
  });
}
function stripeTexture() { // "Geneva stripes" for bridges and the main plate
  return canvasTex(512, (g, S) => {
    for (let i = 0; i < 16; i++) { const x = i * S / 16; const gr = g.createLinearGradient(x, 0, x + S / 16, 0); gr.addColorStop(0, '#9a9da2'); gr.addColorStop(0.5, '#f2f3f5'); gr.addColorStop(1, '#9a9da2'); g.fillStyle = gr; g.fillRect(x, 0, S / 16 + 1, S); }
  });
}
function perlageTexture() { // overlapping circular graining for the main plate
  return canvasTex(512, (g, S) => {
    g.fillStyle = '#b9bcc1'; g.fillRect(0, 0, S, S);
    for (let j = -1; j < 14; j++) for (let i = -1; i < 14; i++) {
      const x = i * 40 + (j % 2) * 20, y = j * 40;
      const gr = g.createRadialGradient(x, y, 2, x, y, 30); gr.addColorStop(0, '#f4f5f6'); gr.addColorStop(0.6, '#a6a9ae'); gr.addColorStop(1, '#d5d7da');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, 30, 0, TAU); g.fill();
    }
  });
}
function leatherTexture() {
  return canvasTex(256, (g, S) => {
    const r = rng(31); g.fillStyle = '#808080'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 2600; i++) { const v = 90 + r() * 80; g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.arc(r() * S, r() * S, 1 + r() * 2.6, 0, TAU); g.fill(); }
  }, false);
}

// ---------- materials ----------
let WM = null;
export function wmat() {
  if (WM) return WM;
  const stripes = stripeTexture(); stripes.wrapS = stripes.wrapT = THREE.RepeatWrapping; stripes.repeat.set(1.2, 1.2); stripes.rotation = 0.5;
  const perl = perlageTexture(); perl.wrapS = perl.wrapT = THREE.RepeatWrapping; perl.repeat.set(2, 2);
  const lea = leatherTexture(); lea.wrapS = lea.wrapT = THREE.RepeatWrapping; lea.repeat.set(2, 3);
  WM = {
    steel: new THREE.MeshPhysicalMaterial({ color: 0xcdd0d5, metalness: 1, roughness: 0.2, clearcoat: 0.3, clearcoatRoughness: 0.3 }),
    steelRough: new THREE.MeshStandardMaterial({ color: 0x8f9399, metalness: 1, roughness: 0.48 }),
    brass: new THREE.MeshPhysicalMaterial({ color: 0xe0b356, metalness: 1, roughness: 0.24 }),
    gold: new THREE.MeshPhysicalMaterial({ color: 0xf3c768, metalness: 1, roughness: 0.16 }),
    rhodium: new THREE.MeshPhysicalMaterial({ color: 0xd4d6da, map: stripes, metalness: 1, roughness: 0.36 }),
    plate: new THREE.MeshPhysicalMaterial({ color: 0xa9adb3, map: perl, metalness: 1, roughness: 0.46 }),
    blue: new THREE.MeshPhysicalMaterial({ color: 0x2747b8, metalness: 1, roughness: 0.22 }),
    ruby: new THREE.MeshPhysicalMaterial({ color: 0xe5123e, emissive: 0xb00426, emissiveIntensity: 0.85, roughness: 0.06, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.94 }),
    rubyCut: new THREE.MeshStandardMaterial({ color: 0xff3a5e, emissive: 0xd0103a, emissiveIntensity: 0.7, roughness: 0.3, side: THREE.DoubleSide }),
    steelCut: new THREE.MeshStandardMaterial({ color: 0xb7bbc2, metalness: 0.6, roughness: 0.55, side: THREE.DoubleSide }),
    dial: new THREE.MeshStandardMaterial({ map: dialTexture(), roughness: 0.55, transparent: true }),
    hand: new THREE.MeshPhysicalMaterial({ color: 0x1b2440, metalness: 1, roughness: 0.25, transparent: true }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, roughness: 0.02, metalness: 0, clearcoat: 1, envMapIntensity: 2.2, depthWrite: false }),
    leather: new THREE.MeshStandardMaterial({ color: 0x4d2c18, roughness: 0.62, bumpMap: lea, bumpScale: 1.4 }),
    black: new THREE.MeshStandardMaterial({ color: 0x17181b, roughness: 0.45, metalness: 0.2 }),
    bin: new THREE.MeshStandardMaterial({ color: 0x3b4046, roughness: 0.5, metalness: 0.7, side: THREE.DoubleSide }),
    paper: new THREE.MeshStandardMaterial({ color: 0xe9e6dd, roughness: 0.95, flatShading: true }),
  };
  return WM;
}

// ---------- small builders ----------
const zCyl = (r, h, mat, seg = 40) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); m.rotation.x = Math.PI / 2; return m; };
export function glow(color = 0xff2a50, size = 0.3, through = false) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: !through, toneMapped: false }));
  s.scale.setScalar(size); return s;
}
export function gear(R, n, th, mat, spokes = 5) {
  const s = new THREE.Shape(), ri = R * (1 - Math.min(0.16, 2.4 / n)), da = TAU / n;
  for (let i = 0; i < n; i++) {
    const a = i * da;
    for (const [r, f] of [[ri, 0], [ri, 0.26], [R, 0.4], [R, 0.6], [ri, 0.74]]) { const x = Math.cos(a + da * f) * r, y = Math.sin(a + da * f) * r; if (i === 0 && f === 0) s.moveTo(x, y); else s.lineTo(x, y); }
  }
  s.closePath();
  if (spokes) {
    const r1 = R * 0.3, r2 = ri * 0.84, gap = 0.2;
    for (let k = 0; k < spokes; k++) {
      const a0 = k / spokes * TAU + gap, a1 = (k + 1) / spokes * TAU - gap, h = new THREE.Path();
      h.absarc(0, 0, r2, a0, a1, false); h.absarc(0, 0, r1, a1 - gap * 0.4, a0 + gap * 0.4, true); h.closePath(); s.holes.push(h);
    }
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: true, bevelSize: th * 0.15, bevelThickness: th * 0.15, bevelSegments: 1, curveSegments: 14 });
  g.translate(0, 0, -th / 2);
  const grp = new THREE.Group(); grp.add(new THREE.Mesh(g, mat));
  grp.add(zCyl(R * 0.12, th * 2.6, wmat().steel, 20));
  return grp;
}
function spiral(r0, r1, turns, tube, mat, seg = 420) {
  const pts = [];
  for (let i = 0; i <= seg; i++) { const k = i / seg, a = k * turns * TAU, r = r0 + (r1 - r0) * k; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)); }
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, tube, 6), mat);
}
export function jewel(r = 0.06) {
  const M = wmat(), g = new THREE.Group();
  const ch = new THREE.Mesh(new THREE.TorusGeometry(r * 1.25, r * 0.3, 12, 36), M.gold); g.add(ch);
  const st = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 18), M.ruby); st.scale.z = 0.5; g.add(st);
  const gl = glow(0xff1e48, r * 3.2); gl.position.z = r * 0.6; gl.material.opacity = 0.35; g.add(gl); g.glow = gl;
  return g;
}
function screw(r = 0.035) {
  const M = wmat(), g = new THREE.Group();
  g.add(zCyl(r, r * 0.6, M.blue, 20));
  const slot = new THREE.Mesh(new THREE.BoxGeometry(r * 1.7, r * 0.28, r * 0.2), M.black); slot.position.z = r * 0.3; g.add(slot);
  return g;
}
// narrow "finger" bridge from the rim to a pivot, with a jewel on the pivot end
function bridge(px, py, z, w = 0.13) {
  const M = wmat(), g = new THREE.Group();
  const a = Math.atan2(py, px), d = Math.hypot(px, py), R = 0.86, len = R - d;
  const s = new THREE.Shape(); s.moveTo(0, -w); s.lineTo(len, -w * 1.25); s.lineTo(len, w * 1.25); s.lineTo(0, w); s.absarc(0, 0, w, Math.PI / 2, -Math.PI / 2, false);
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.045, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 16 }), M.rhodium);
  m.position.set(px, py, z); m.rotation.z = a; g.add(m);
  const j = jewel(0.05); j.position.set(px, py, z + 0.075); g.add(j); g.jewel = j;
  const sc = screw(); sc.position.set(Math.cos(a) * (R - 0.09), Math.sin(a) * (R - 0.09), z + 0.075); g.add(sc);
  return g;
}

// ---------- the movement (back side up, +Z towards the viewer) ----------
// update(tr, swing) : tr = running time in seconds (0 = stopped), swing = balance phase in turns
export function movement() {
  const M = wmat(), g = new THREE.Group();
  const plate = zCyl(0.9, 0.08, M.plate, 72); plate.position.z = -0.04; g.add(plate);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.03, 10, 72), M.brass); g.add(rim);
  const jewels = [];
  // going barrel with the mainspring
  const barrel = new THREE.Group(); barrel.position.set(-0.36, 0.34, 0.08); g.add(barrel);
  const drum = gear(0.36, 60, 0.05, M.brass, 0); barrel.add(drum);
  const cup = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.02, 8, 48), M.brass); cup.position.z = 0.04; barrel.add(cup);
  const spring = spiral(0.05, 0.28, 7, 0.011, M.blue); spring.position.z = 0.045; barrel.add(spring);
  // going train: [x, y, radius, teeth, z, speed (turns per second), spokes]
  const train = [[0.02, -0.02, 0.3, 64, 0.1, -0.08, 5], [0.42, 0.24, 0.24, 54, 0.15, 0.3, 5], [0.5, -0.2, 0.19, 44, 0.1, -0.9, 4], [0.24, -0.5, 0.13, 15, 0.15, 2.4, 3]];
  const wheels = [];
  train.forEach(([x, y, R, n, z, sp, spokes], i) => {
    const bw = 0.085;
    const w = gear(R, n, 0.035, i === 3 ? M.steel : M.brass, spokes); w.position.set(x, y, z); g.add(w); wheels.push([w, sp, i === 3]);
    const br = bridge(x, y, 0.2, bw); g.add(br); jewels.push(br.jewel);
  });
  { const br = bridge(-0.36, 0.34, 0.2, 0.16); g.add(br); jewels.push(br.jewel); }
  // balance wheel + hairspring under its own cock
  const bal = new THREE.Group(); bal.position.set(-0.36, -0.4, 0.12); g.add(bal);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.026, 12, 64), M.gold); bal.add(ring);
  for (let k = 0; k < 3; k++) { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.035, 0.02), M.gold); arm.rotation.z = k / 3 * TAU; arm.position.set(Math.cos(k / 3 * TAU) * 0.135, Math.sin(k / 3 * TAU) * 0.135, 0); bal.add(arm); }
  for (let k = 0; k < 12; k++) { const s = zCyl(0.016, 0.03, M.gold, 12); s.rotation.set(0, 0, 0); s.rotation.z = k / 12 * TAU; s.position.set(Math.cos(k / 12 * TAU) * 0.3, Math.sin(k / 12 * TAU) * 0.3, 0); bal.add(s); }
  bal.add(zCyl(0.022, 0.12, M.steel, 16));
  const hair = spiral(0.03, 0.17, 9, 0.0045, M.blue, 520); hair.position.set(-0.36, -0.4, 0.155); g.add(hair);
  { const br = bridge(-0.36, -0.4, 0.22, 0.075); g.add(br); jewels.push(br.jewel); br.jewel.scale.setScalar(1.25); }
  // two pallet jewels by the escape wheel
  for (const [x, y] of [[0.05, -0.52], [-0.03, -0.44]]) { const pj = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.06, 0.03), M.ruby); pj.position.set(x, y, 0.15); pj.rotation.z = 0.5; g.add(pj); }
  g.jewels = jewels; g.balance = bal;
  g.update = (tr = 0, swingT = tr) => {
    for (const [w, sp, esc] of wheels) w.rotation.z = (esc ? Math.floor(tr * 8) / 8 * 0.5 + Math.min(1, (tr * 8) % 1 * 3) / 16 : tr * sp) * TAU * (esc ? sp / Math.abs(sp) : 1);
    drum.rotation.z = tr * 0.012 * TAU;
    const a = Math.sin(swingT * TAU) * 2.2;                 // about 250 degrees of swing
    bal.rotation.z = a;
    hair.rotation.z = a * 0.12; hair.scale.setScalar(1 + Math.sin(swingT * TAU) * 0.07);
  };
  g.setGlow = k => { for (const j of jewels) { j.glow.material.opacity = 0.18 + 0.55 * k; j.glow.scale.setScalar(0.16 * (1 + 0.7 * k)); } };
  g.update(0);
  return shadow(g);
}

// ---------- the whole watch ----------
// strap: 0 = hanging straight, 1 = curled as if on a wrist. Time shown is 10:10, seconds hand at `sec`.
export function watch({ strap = 0 } = {}) {
  const M = wmat(), g = new THREE.Group();
  const pts = [[0.9, -0.2], [1.02, -0.2], [1.08, -0.12], [1.08, 0.1], [1.03, 0.2], [0.95, 0.25], [0.9, 0.22], [0.9, -0.2]].map(p => new THREE.Vector2(p[0], p[1]));
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 96), M.steel); body.rotation.x = Math.PI / 2; g.add(body);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.42, 72, 1, true), M.steelRough); inner.material = M.steelRough.clone(); inner.material.side = THREE.BackSide; inner.rotation.x = Math.PI / 2; g.add(inner);
  const dial = zCyl(0.9, 0.012, M.dial.clone(), 72); dial.material.map = M.dial.map; dial.material.map.center.set(0.5, 0.5); dial.material.map.rotation = DIAL_ROT; dial.position.z = 0.1; g.add(dial);
  { const uv = dial.geometry.attributes.uv; /* cap UVs are fine as they are */ }
  const handM = M.hand.clone();
  const mk = (len, w, z, ang) => { const p = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.012), handM); b.position.y = len * 0.42; p.add(b); p.position.z = z; p.rotation.z = -ang; g.add(p); return p; };
  const hour = mk(0.46, 0.07, 0.125, (10 + 10 / 60) / 12 * TAU), minute = mk(0.7, 0.05, 0.14, 10 / 60 * TAU);
  const sec = new THREE.Group(); { const b = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.14, 0.01), new THREE.MeshStandardMaterial({ color: 0xb3261e, roughness: 0.4, transparent: true })); b.position.y = 0.05; sec.add(b); sec.position.set(0, -0.37, 0.125); g.add(sec); }
  const cap = zCyl(0.045, 0.05, M.steel, 20); cap.position.z = 0.14; g.add(cap);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(0.93, 48, 16, 0, TAU, 0, 0.5), M.glass); glass.rotation.x = Math.PI / 2; glass.scale.z = 1; glass.position.z = 0.22 - 0.93 * Math.cos(0.5) * 0.25; glass.scale.set(1, 1, 0.25); glass.renderOrder = 5; g.add(glass);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.14, 24), M.steel); crown.rotation.z = Math.PI / 2; crown.position.set(1.15, 0, 0); g.add(crown);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const lug = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.2), M.steel); lug.position.set(sx * 0.58, sy * 1.1, -0.03); lug.rotation.x = -sy * 0.25; g.add(lug); }
  const back = new THREE.Group(); g.add(back);
  { const d = zCyl(0.93, 0.05, M.steel, 72); d.position.z = -0.2; back.add(d); const rr = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.012, 8, 64), M.steelRough); rr.position.z = -0.228; back.add(rr);
    for (let k = 0; k < 6; k++) { const n = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.02), M.black); n.position.set(Math.cos(k / 6 * TAU) * 0.82, Math.sin(k / 6 * TAU) * 0.82, -0.226); n.rotation.z = k / 6 * TAU + Math.PI / 2; back.add(n); } }
  const mv = movement(); mv.scale.setScalar(0.96); mv.rotation.y = Math.PI; mv.position.z = -0.06; g.add(mv);
  // strap: two chains of leather segments
  const straps = [];
  for (const sy of [-1, 1]) {
    let parent = new THREE.Group(); parent.position.set(0, sy * 1.12, -0.06); g.add(parent); const chain = [];
    for (let k = 0; k < 7; k++) {
      const seg = new THREE.Group(); const w = 1.0 - k * 0.035;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.42, 0.085), M.leather); b.position.y = sy * 0.2; seg.add(b);
      parent.add(seg); const nx = new THREE.Group(); nx.position.y = sy * 0.4; seg.add(nx); parent = nx; chain.push(seg);
    }
    straps.push([chain, sy]);
  }
  g.setStrap = k => { for (const [chain, sy] of straps) chain.forEach((s, i) => { s.rotation.x = sy * k * (i === 0 ? 0.55 : 0.42); }); };
  g.setStrap(strap);
  const xg = []; // ruby glows that show through the dial
  for (const j of mv.jewels) { const s = glow(0xff1740, 0.34, true); const p = j.position.clone().multiplyScalar(0.96); s.position.set(-p.x, p.y, 0.2); s.material.opacity = 0; s.renderOrder = 9; g.add(s); xg.push(s); }
  g.xray = k => {
    dial.material.opacity = 1 - 0.82 * k; handM.opacity = 1 - 0.7 * k; sec.children[0].material.opacity = 1 - 0.7 * k;
    dial.material.depthWrite = k < 0.02;
    mv.rotation.y = k > 0.01 ? 0 : Math.PI; mv.position.z = k > 0.01 ? -0.02 : -0.06;
    xg.forEach((s, i) => { s.material.opacity = k * (0.5 + 0.2 * Math.sin(i * 1.7)); s.scale.setScalar(0.2 + 0.1 * k); });
    mv.setGlow(k);
  };
  g.back = back; g.movement = mv; g.sec = sec; g.hour = hour; g.minute = minute;
  g.setSeconds = s => { sec.rotation.z = -s / 60 * TAU; };
  g.setSeconds(37);
  return shadow(g);
}

// ---------- pivot cutaway: a steel pivot turning in a hole (steel plate, or a ruby jewel set in the plate) ----------
// built around the Y axis, cut in half so the camera (on +Z) sees the section. update(t, wobble)
export function pivotDemo(kind = 'steel') {
  const M = wmat(), g = new THREE.Group();
  const half = (profile, mat, cutMat) => {
    const grp = new THREE.Group();
    const pts = profile.map(p => new THREE.Vector2(p[0], p[1]));
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 64, Math.PI / 2, Math.PI), mat); m.material = mat.clone(); m.material.side = THREE.DoubleSide; grp.add(m);
    for (const sx of [-1, 1]) { const s = new THREE.Shape(profile.map(p => new THREE.Vector2(p[0] * sx, p[1]))); const f = new THREE.Mesh(new THREE.ShapeGeometry(s), cutMat); f.position.z = 0.001; grp.add(f); }
    return grp;
  };
  const hole = kind === 'ruby' ? 0.62 : 0.17;
  g.add(half([[hole, -0.32], [2.3, -0.32], [2.3, 0.32], [hole, 0.32]], kind === 'ruby' ? M.brass : M.steelRough, kind === 'ruby' ? new THREE.MeshStandardMaterial({ color: 0xcfa24a, metalness: 0.5, roughness: 0.5, side: THREE.DoubleSide }) : M.steelCut));
  if (kind === 'ruby') {
    const prof = [[0.17, -0.3], [0.6, -0.3], [0.6, 0.3], [0.42, 0.3], [0.2, 0.14], [0.155, 0.02], [0.17, -0.3]];
    g.add(half(prof, M.ruby, M.rubyCut));
    const gl = glow(0xff2048, 2.6); gl.position.set(0, 0, 0.3); gl.material.opacity = 0.55; g.add(gl); g.rglow = gl;
  }
  const shaft = new THREE.Group(); g.add(shaft);
  const sp = [[0, -0.52], [0.09, -0.5], [0.14, -0.42], [0.14, 0.5], [0.2, 0.62], [0.42, 0.72], [0.42, 2.6], [0, 2.6]].map(p => new THREE.Vector2(p[0], p[1]));
  shaft.add(new THREE.Mesh(new THREE.LatheGeometry(sp, 48), M.steel));
  const wh = gear(1.25, 48, 0.12, M.brass, 5); wh.rotation.x = -Math.PI / 2; wh.position.y = 1.5; shaft.add(wh);
  const pin = gear(0.62, 12, 0.5, M.steel, 0); pin.rotation.x = -Math.PI / 2; pin.position.y = 2.0; shaft.add(pin);
  g.shaft = shaft;
  g.update = (t, wobble = 0) => { shaft.rotation.y = t * 5.5; shaft.rotation.z = Math.sin(t * 31) * 0.02 * wobble; shaft.position.x = Math.sin(t * 23) * 0.012 * wobble; };
  return shadow(g);
}

// ---------- everyday props (metres) ----------
export function bin(empty = false) {
  const M = wmat(), g = new THREE.Group();
  const pts = [[0.001, 0.004], [0.125, 0.004], [0.13, 0.012], [0.165, 0.34], [0.172, 0.345], [0.172, 0.352]].map(p => new THREE.Vector2(p[0], p[1]));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 56), M.bin));
  const r = rng(77);
  for (let i = 0; i < (empty ? 0 : 9); i++) { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.035 + r() * 0.02, 1), M.paper); const pa = p.geometry.attributes.position; for (let k = 0; k < pa.count; k++) pa.setXYZ(k, pa.getX(k) * (0.8 + r() * 0.5), pa.getY(k) * (0.8 + r() * 0.5), pa.getZ(k) * (0.8 + r() * 0.5)); p.geometry.computeVertexNormals(); p.position.set((r() - .5) * 0.16, 0.05 + r() * 0.07, (r() - .5) * 0.16); g.add(p); }
  return shadow(g);
}
function rrect(w, h, r) { const s = new THREE.Shape(); s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0); s.lineTo(w / 2, h / 2 - r); s.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2); s.lineTo(-w / 2 + r, h / 2); s.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI); s.lineTo(-w / 2, -h / 2 + r); s.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5); return s; }
// phone: screen faces +Z, top is +Y, the camera lens is on the back
export function phone() {
  const M = wmat(), g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.ExtrudeGeometry(rrect(0.072, 0.15, 0.011), { depth: 0.006, bevelEnabled: true, bevelSize: 0.0012, bevelThickness: 0.0012, bevelSegments: 3 }), M.black); b.position.z = -0.003; g.add(b);
  const tex = canvasTex(512, (c, S) => {
    c.fillStyle = '#0b1114'; c.fillRect(0, 0, S, S);
    c.strokeStyle = '#27e0c4'; c.lineWidth = 10; const m = 90, l = 70;
    for (const [x, y, dx, dy] of [[m, m * 1.6, 1, 1], [S - m, m * 1.6, -1, 1], [m, S - m * 1.6, 1, -1], [S - m, S - m * 1.6, -1, -1]]) { c.beginPath(); c.moveTo(x + dx * l, y); c.lineTo(x, y); c.lineTo(x, y + dy * l); c.stroke(); }
    c.fillStyle = '#27e0c4'; c.font = '600 34px sans-serif'; c.textAlign = 'center'; c.fillText('Scanning…', S / 2, S - 50);
  });
  const scr = new THREE.Mesh(new THREE.ShapeGeometry(rrect(0.066, 0.144, 0.009)), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  { const uv = scr.geometry.attributes.uv, p = scr.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 0.066 + 0.5, p.getY(i) / 0.144 + 0.5); }
  scr.position.z = 0.0046; g.add(scr);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.003, 24), M.steelRough); lens.rotation.x = Math.PI / 2; lens.position.set(0.02, 0.055, -0.005); g.add(lens);
  return shadow(g);
}
export function tweezers() {
  const M = wmat(), g = new THREE.Group(); // tips at the origin, handle up +Y
  for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.035, 3.2, 0.1), M.steel); a.geometry.translate(0, 1.6, 0); const pa = a.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { const y = pa.getY(i), k = 1 - y / 3.2; pa.setZ(i, pa.getZ(i) * (0.25 + 0.75 * (1 - k))); } a.rotation.z = s * 0.045; a.position.x = s * 0.035; g.add(a); }
  return shadow(g);
}
// floating result card (width 1 unit). lines: [small heading, big value, [chips], footer]
export function card(head, value, chips, foot) {
  const tex = canvasTex(1024, (c, S) => {
    c.clearRect(0, 0, S, S); const w = S - 40, h = 600, x = 20, y = (S - h) / 2, r = 46;
    c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = 'rgba(10,18,22,.93)'; c.fill(); c.lineWidth = 6; c.strokeStyle = '#27e0c4'; c.stroke();
    c.textAlign = 'center';
    c.fillStyle = '#8ff3e3'; c.font = '700 48px Montserrat, Cap, sans-serif'; c.fillText(head, S / 2, y + 100);
    c.fillStyle = '#ffffff'; c.font = '700 150px Montserrat, Cap, sans-serif'; c.fillText(value, S / 2, y + 270);
    c.font = '600 40px Montserrat, Cap, sans-serif'; let cx = x + 60;
    const tw = chips.map(t => c.measureText(t).width + 56), total = tw.reduce((a, b) => a + b, 0) + 26 * (chips.length - 1); cx = (S - total) / 2;
    chips.forEach((t, i) => { c.beginPath(); c.roundRect(cx, y + 340, tw[i], 76, 38); c.fillStyle = 'rgba(39,224,196,.16)'; c.fill(); c.fillStyle = '#d9fff9'; c.textAlign = 'left'; c.fillText(t, cx + 28, y + 392); cx += tw[i] + 26; });
    c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,.62)'; c.font = '500 34px Montserrat, Cap, sans-serif'; c.fillText(foot, S / 2, y + 520);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false, depthTest: false }));
  m.renderOrder = 20; return m;
}
// a teal scanning sheet (1 x 1, additive)
export function scanBeam() {
  const tex = canvasTex(256, (c, S) => { const g = c.createLinearGradient(0, 0, 0, S); g.addColorStop(0, 'rgba(39,224,196,0)'); g.addColorStop(0.46, 'rgba(39,224,196,.35)'); g.addColorStop(0.5, 'rgba(210,255,248,1)'); g.addColorStop(0.54, 'rgba(39,224,196,.35)'); g.addColorStop(1, 'rgba(39,224,196,0)'); c.fillStyle = g; c.fillRect(0, 0, S, S); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false, side: THREE.DoubleSide }));
  m.renderOrder = 15; return m;
}
