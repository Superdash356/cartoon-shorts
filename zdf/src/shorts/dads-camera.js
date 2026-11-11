// "Dad's camera" - styled after dark rim-lit cinematic story reels: near-black silhouettes outlined by light,
// faces never visible, a warm amber world (now) and a cold blue world (memory), quiet captions.
import * as THREE from 'three';
import { makeRealHuman } from '../realhuman.js';
import { rimify } from '../rim.js';
import { camera90s, canister, donateBox, lightTable, phone, flatCap } from '../camera90s.js';
import { glowTexture } from '../textures.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake } from '../anim.js';
import { WORDS, LINES, CAPTIONS as CAPS, DURATION } from './dads-camera.timing.js';

export const CAPTIONS = CAPS;
export { DURATION };
export const FADES = [];
export const TONES = {
  amber: ['#040100', '#4a1c03', '#ff9437', '#fff1dc'],
  blue: ['#010309', '#0a2257', '#4c8cff', '#eaf2ff'],
};
export const CAP_STYLE = "top:1050px; font:500 33px/1.25 'Cap', sans-serif; letter-spacing:0.3px; -webkit-text-stroke:0; text-shadow:0 2px 12px rgba(0,0,0,.9), 0 0 2px rgba(0,0,0,.6);";
const L = i => LINES[i][0];
const at = (line, word, n = 0) => WORDS.filter(w => w[0] === line && w[1].toLowerCase().replace(/[^a-z0-9-]/g, '') === word)[n][2];

// ---------- looks ----------
// a dark room: no fill, warm bare bulbs behind the subject (they make the rim light and the bokeh)
function nightRoom(makeStage, bulbs = [[-0.7, 2.0, -1.4], [0.5, 2.3, -2.2], [1.2, 1.7, -1.1]]) {
  const scene = makeStage({ look: 'dark', shadowSize: 2.5, sunDir: [0.5, 3, -4], sun: 2.2, keyColor: 0xffc58a, rimColor: 0xffb070, env: 'studio' });
  scene.environmentIntensity = 0.06;
  scene.traverse(o => { if (o.isHemisphereLight) o.intensity = 0.02; });
  const gm = new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffd8a8, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false });
  for (const p of bulbs) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.035, 20, 12), new THREE.MeshBasicMaterial({ color: 0xfff0d8, toneMapped: false })); b.position.set(...p); scene.add(b);
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 2), new THREE.MeshBasicMaterial({ color: 0x050505 })); cord.position.set(p[0], p[1] + 1.03, p[2]); scene.add(cord);
    const s = new THREE.Sprite(gm); s.scale.setScalar(0.5); s.position.set(...p); scene.add(s);
    const l = new THREE.PointLight(0xffb878, 3.5, 6, 1.4); l.position.set(...p); scene.add(l);
  }
  return scene;
}
// dusk on a beach: a bright horizon behind the subject, dark sand and sea
function beach(makeStage) {
  const scene = makeStage({ look: 'dark', shadowSize: 3, sunDir: [0, 1.2, -8], sun: 2.5, keyColor: 0xdfeaff, rimColor: 0xcfe0ff, env: 'studio' });
  scene.environmentIntensity = 0.08;
  scene.traverse(o => { if (o.isHemisphereLight) o.intensity = 0.04; });
  const sky = scene.userData.sky; ['top', 'mid', 'horizon', 'floorC'].forEach((k, i) => sky.material.uniforms[k].value.set([0x0a1020, 0x3a4a6a, 0xf2f4ff, 0x0b0d12][i]));
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(200, 100), new THREE.MeshPhysicalMaterial({ color: 0x0b0f18, roughness: 0.12, metalness: 0.2, clearcoat: 1 })); sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.02, -55); scene.add(sea);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(40, 12), new THREE.MeshStandardMaterial({ color: 0x1a1814, roughness: 1 })); sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0.001, 0); scene.add(sand);
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffffff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false })); sun.scale.setScalar(7); sun.position.set(-11, 1.3, -40); scene.add(sun);
  return scene;
}
// people: dark clothes and skin, outlined by the rim shader (a thin line: high power), faces kept in shadow
function person(rim = 0xffc896, dad = false) {
  const h = makeRealHuman();
  rimify(h.root, { color: rim, power: 3.6, strength: 2.0, darken: 0.22 });
  if (dad) { const cap = flatCap(); cap.scale.setScalar(100); cap.position.set(0, 9, 1); cap.rotation.x = -0.1; h.bones.Head.add(cap); rimify(cap, { color: rim, power: 3.6, strength: 2.0, darken: 0.5 }); h.cap = cap; }
  return h;
}
function cameraProp(rim, str = 1.4) { const c = camera90s(); rimify(c, { color: rim, power: 2.4, strength: str }); return c; }
const AMBER_RIM = 0xffc896, BLUE_RIM = 0xd8e6ff;
const white = k => k > 0.001 ? `<div style="position:absolute;inset:0;background:#fff;opacity:${Math.min(1, k)}"></div>` : '';
const look = (o = {}) => Object.assign({ bloom: 0.9, exposure: 1.0, vignette: 0.5, grain: 0.03 }, o);

// pose: holding the camera in both hands at chest height, looking down at it. p = camera position (world)
function holdAtChest(h, c, p, yaw = 0) {
  h.reset(); h.armsDown(); h.lean(0.12, 0, 0);
  const q = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw), r = v => v.clone().applyQuaternion(q);
  c.position.copy(p); c.rotation.set(-0.45, yaw, 0);
  h.reach('R', p.clone().add(r(V(-0.085, -0.012, -0.03))), r(V(-1, -0.8, -0.3))); h.aimHand('R', r(V(0.35, 0.3, 0.6)), r(V(1, 0, 0))); h.curl('R', 0.55, 0.4);
  h.reach('L', p.clone().add(r(V(0.07, -0.025, -0.03))), r(V(1, -0.8, -0.3))); h.aimHand('L', r(V(-0.3, 0.3, 0.6)), r(V(-1, 0.3, 0))); h.curl('L', 0.5, 0.4);
  h.look(p, 0.9);
}
// pose: camera raised to the right eye (his right = -x), lens forward along the root's +z. k: 0 at chest -> 1 at the eye
function raiseToEye(h, c, k = 1) {
  h.reset(); h.armsDown();
  const rq = h.root.quaternion, r = v => v.clone().applyQuaternion(rq);
  const eye = h.world('REye');
  const chest = h.root.position.clone().add(r(V(0.02, 1.13, 0.3)));
  const p = eye.clone().add(r(V(0.026, -0.02, 0.075))).lerp(chest, 1 - k);
  c.position.copy(p); c.quaternion.copy(rq); c.rotateX(-0.45 * (1 - k));
  h.reach('R', p.clone().add(r(V(-0.07, -0.03, -0.03))), r(V(-0.2, -1, 0.5))); h.aimHand('R', r(V(0.1, 0.9, 0.25)), r(V(1, 0, 0.15))); h.curl('R', 0.6, 0.5);
  h.reach('L', p.clone().add(r(V(0.055, -0.05, -0.02))), r(V(0.2, -1, 0.5))); h.aimHand('L', r(V(-0.1, 0.9, 0.3)), r(V(-0.6, 0.6, 0.2))); h.curl('L', 0.45, 0.35);
  h.look(p.clone().add(r(V(0, 0, 3))), 0.6);
}
function desk(scene, y = 0.76) {
  const d = new THREE.Mesh(new THREE.BoxGeometry(3, 0.04, 1.4), new THREE.MeshPhysicalMaterial({ color: 0x3a2618, roughness: 0.35, clearcoat: 0.4, clearcoatRoughness: 0.3 })); d.position.set(0, y - 0.02, 0); d.receiveShadow = true; scene.add(d);
  return y;
}

// ===== 1. hook: the camera on a dark desk, bulbs behind, slow push =====
function s1({ makeStage }) {
  const scene = nightRoom(makeStage, [[-0.25, 1.05, -0.8], [0.3, 1.2, -1.4], [0.65, 0.98, -0.6]]);
  const y = desk(scene);
  const c = cameraProp(AMBER_RIM); c.position.set(0, y + 0.034, 0); c.rotation.y = 0.55; c.setCount(36); scene.add(c);
  const cm = cam(30);
  return { scene, camera: cm, update(t) {
    const k = easeOut(range(t, 0, 2.2));
    place(cm, [lerp(0.42, 0.3, k), y + lerp(0.1, 0.075, k), lerp(0.62, 0.46, k)], [0, y + 0.03, 0]);
    return look({ tone: 'amber', dof: { focus: cm.position.distanceTo(c.position), aperture: 0.02, maxblur: 0.02 } });
  } };
}
// ===== 2. his profile against the bulbs, the camera in his hands =====
function s2({ makeStage }) {
  const scene = nightRoom(makeStage, [[-0.9, 1.9, -1.6], [0.2, 2.1, -2.4], [0.9, 1.75, -1.3]]);
  const h = person(AMBER_RIM); h.root.rotation.y = Math.PI / 2; scene.add(h.root);
  const c = cameraProp(AMBER_RIM, 1.8); scene.add(c);
  const cm = cam(34);
  return { scene, camera: cm, update(t, T) {
    const breathe = Math.sin(T * 1.6) * 0.004;
    holdAtChest(h, c, V(0.3, 1.12 + breathe, 0.02), Math.PI / 2);
    const k = easeInOut(range(t, 0, 2.6));
    place(cm, [lerp(0.25, 0.32, k), lerp(1.4, 1.36, k), lerp(1.9, 1.45, k)], [0.18, lerp(1.35, 1.25, k), 0]);
    return look({ tone: 'amber', dof: { focus: cm.position.distanceTo(V(0.2, 1.2, 0)), aperture: 0.004, maxblur: 0.014 } });
  } };
}
// ===== 3. the donate box: lamp, cables, the camera on top; crane down =====
function s3({ makeStage }) {
  const scene = nightRoom(makeStage, [[-0.6, 0.9, -1.2], [0.4, 1.1, -1.8], [0.9, 0.7, -0.8]]);
  const b = donateBox(); rimify(b, { color: AMBER_RIM, power: 2.6, strength: 0.6 }); scene.add(b);
  const c = cameraProp(AMBER_RIM, 1.6); c.position.copy(b.top).add(V(0, 0.03, 0)); c.rotation.set(-0.25, -0.4, 0.12); scene.add(c);
  const front = new THREE.SpotLight(0xffc890, 6, 3, 0.55, 0.9, 1.5); front.position.set(0.5, 1.2, 1.2); front.target.position.set(0, 0.15, 0); scene.add(front, front.target);
  const inside = new THREE.PointLight(0xffb070, 0.5, 0.6); inside.position.set(0.05, 0.35, 0.05); scene.add(inside);
  const cm = cam(32);
  return { scene, camera: cm, update(t) {
    const k = easeInOut(range(t, 0, 4));
    place(cm, [lerp(0.08, 0.16, k), lerp(0.95, 0.5, k), lerp(0.8, 0.78, k)], [0.03, lerp(0.17, 0.2, k), 0.02]);
    return look({ tone: 'amber', dof: { focus: cm.position.distanceTo(c.position), aperture: 0.006, maxblur: 0.014 } });
  } };
}
// ===== 4. memory: dad on the beach raises the camera at us; the flash =====
function s4({ makeStage }, start) {
  const scene = beach(makeStage);
  const h = person(BLUE_RIM, true); scene.add(h.root);
  const c = cameraProp(BLUE_RIM, 2.2); scene.add(c);
  const cm = cam(38); const tF = at(2, 'face') - start, tP = at(2, 'point') - start;
  return { scene, camera: cm, update(t, T) {
    const k = easeInOut(range(t, tP - 0.3, tP + 0.5));
    raiseToEye(h, c, k);
    const kc = easeOut(range(t, 0, tF));
    place(cm, [lerp(0.3, 0.12, kc), lerp(1.12, 1.2, kc), lerp(2.6, 1.45, kc)], [0, lerp(1.32, 1.48, kc), 0]);
    const f = Math.max(0, 1 - Math.abs(t - tF) / 0.22) * (t > tF - 0.05 ? 1 : 0);
    c.flash(t > tF - 0.03 && t < tF + 0.12 ? 1 : 0);
    return look({ tone: 'blue', dof: { focus: cm.position.distanceTo(c.position), aperture: 0.002, maxblur: 0.01 }, overlay: white(f * 0.95 + Math.max(0, (t - tF - 0.2)) * 0) });
  } };
}
// ===== 5. click, whirr, click: the camera wakes up (macro, blue) =====
function s5({ makeStage }, start) {
  const scene = makeStage({ look: 'dark', shadowSize: 1, sunDir: [-2, 3, -3], sun: 2.5, keyColor: 0xdde8ff, rimColor: 0xbcd2ff, env: 'studio' });
  scene.environmentIntensity = 0.25;
  const c = cameraProp(BLUE_RIM, 1.4); c.rotation.set(0.25, -0.5, 0); scene.add(c); c.setCount(12);
  const fill = new THREE.PointLight(0x9fbfff, 0.6, 1); fill.position.set(0.2, 0.15, 0.25); scene.add(fill);
  const cm = cam(30); const c1 = at(3, 'click') - start, w = at(3, 'whirr') - start, c2 = at(3, 'click', 1) - start;
  return { scene, camera: cm, update(t) {
    c.press(t > c1 - 0.05 && t < c1 + 0.15 ? 1 : t > c2 - 0.05 && t < c2 + 0.15 ? 1 : 0);
    c.setLens(easeInOut(range(t, w - 0.05, w + 0.6)));
    const fl = (t > c1 && t < c1 + 0.1) || (t > c2 && t < c2 + 0.1) ? 1 : 0; c.flash(fl);
    c.setCount(t < c2 ? 12 : 13);
    const k = easeInOut(range(t, 0, 2.2));
    const sh = (t > c1 && t < c1 + 0.15) || (t > c2 && t < c2 + 0.15) ? shake(t, 3) : [0, 0];
    place(cm, [lerp(0.2, 0.09, k) + sh[0] * 0.02, lerp(0.12, 0.07, k) + sh[1] * 0.02, lerp(0.34, 0.22, k)], [0.005, 0.0, 0]);
    return look({ tone: 'blue', dof: { focus: cm.position.distanceTo(V(0, 0, 0.03)), aperture: 0.02, maxblur: 0.016 }, bloom: 0.9 + fl * 1.5, overlay: white(fl * 0.35) });
  } };
}
// ===== 6. thirty-six frames: the counter runs, he made every one count =====
function s6({ makeStage }, start, end) {
  const scene = makeStage({ look: 'dark', shadowSize: 1, sunDir: [-2, 3, -3], sun: 2.2, keyColor: 0xdde8ff, rimColor: 0xbcd2ff, env: 'studio' });
  scene.environmentIntensity = 0.25;
  const c = cameraProp(BLUE_RIM, 1.2); c.rotation.set(0, -0.3, 0); scene.add(c);
  const lamp = new THREE.PointLight(0xcfe0ff, 0.5, 0.6); lamp.position.set(0.05, 0.15, 0.1); scene.add(lamp);
  const cm = cam(30); const tc = at(3, 'count') - start;
  return { scene, camera: cm, update(t) {
    const n = Math.min(36, 13 + Math.floor(easeIn(range(t, 0.2, tc)) * 23)); c.setCount(n);
    const tick = (easeIn(range(t, 0.2, tc)) * 23) % 1 < 0.2 && t < tc ? 1 : 0;
    c.flash(tick * 0.4);
    const k = easeInOut(range(t, 0, end - start));
    place(cm, [lerp(-0.02, 0.02, k), lerp(0.13, 0.1, k), lerp(0.07, 0.05, k)], [0.0, 0.034, 0.002]);
    return look({ tone: 'blue', dof: { focus: cm.position.distanceTo(V(0, 0.034, 0.002)), aperture: 0.03, maxblur: 0.02 }, bloom: 0.8 + tick * 0.5 });
  } };
}
// ===== 7. film is back: negatives glowing on a light table =====
function s7({ makeStage }) {
  const scene = makeStage({ look: 'dark', shadowSize: 1, sunDir: [-2, 3, -3], sun: 0.6, keyColor: 0xffd0a0, rimColor: 0xffb070, env: 'studio' });
  scene.environmentIntensity = 0.1;
  const lt = lightTable(); scene.add(lt);
  for (let i = 0; i < 3; i++) { const cn = canister(); cn.position.set(-0.26 + i * 0.035, 0.024, 0.16 - i * 0.02); cn.rotation.y = i * 0.7; rimify(cn, { color: AMBER_RIM, power: 2.4, strength: 0.6 }); scene.add(cn); }
  const up = new THREE.PointLight(0xfff0e0, 1.2, 1); up.position.set(0, 0.05, 0); scene.add(up);
  const cm = cam(30);
  return { scene, camera: cm, update(t) {
    const k = easeInOut(range(t, 0, 2.2));
    place(cm, [lerp(-0.32, -0.08, k), lerp(0.16, 0.13, k), lerp(0.42, 0.34, k)], [lerp(-0.18, 0.04, k), 0.0, 0.0]);
    return look({ tone: 'amber', dof: { focus: cm.position.distanceTo(V(lerp(-0.18, 0.04, k), 0, 0)), aperture: 0.008, maxblur: 0.016 }, bloom: 0.45, exposure: 0.5, gamma: 1.25 });
  } };
}
// ===== 8. more than they cost new: the camera turns on the desk, lens out, in the bulb light =====
function s8({ makeStage }) {
  const scene = nightRoom(makeStage, [[-0.4, 1.1, -0.9], [0.35, 1.25, -1.5], [0.7, 0.95, -0.7]]);
  const y = desk(scene);
  const c = cameraProp(AMBER_RIM, 1.6); c.position.set(0, y + 0.034, 0); c.setLens(1); c.setCount(36); scene.add(c);
  const cm = cam(30);
  return { scene, camera: cm, update(t) {
    c.rotation.y = -0.8 + t * 0.32;
    place(cm, [0.05, y + 0.07, 0.36], [0, y + 0.032, 0]);
    return look({ tone: 'amber', dof: { focus: 0.37, aperture: 0.02, maxblur: 0.02 } });
  } };
}
// ===== 9. he scans it: over the shoulder, the phone glows =====
function scanScreen(x, W, H, k, phase) {
  x.fillStyle = '#0b0d10'; x.fillRect(0, 0, W, H);
  // live view: a soft silhouette of the camera
  const g = x.createRadialGradient(W / 2, H * 0.48, 20, W / 2, H * 0.48, 420); g.addColorStop(0, '#3b3f48'); g.addColorStop(1, '#0b0d10'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = '#16181c'; x.beginPath(); x.roundRect(W / 2 - 170, H * 0.48 - 95, 340, 190, 40); x.fill();
  x.fillStyle = '#2a2e36'; x.beginPath(); x.arc(W / 2 + 15, H * 0.48, 62, 0, Math.PI * 2); x.fill();
  x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 6; const m = 70, l = 70;
  for (const [a, b, dx, dy] of [[m, H * 0.3, 1, 1], [W - m, H * 0.3, -1, 1], [m, H * 0.66, 1, -1], [W - m, H * 0.66, -1, -1]]) { x.beginPath(); x.moveTo(a + dx * l, b); x.lineTo(a, b); x.lineTo(a, b + dy * l); x.stroke(); }
  if (phase === 'scan') { const yy = H * (0.3 + 0.36 * ((k * 2) % 1)); const lg = x.createLinearGradient(0, yy - 30, 0, yy + 30); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,.95)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = lg; x.fillRect(m, yy - 30, W - 2 * m, 60);
    x.fillStyle = '#fff'; x.font = '600 34px sans-serif'; x.textAlign = 'center'; x.fillText('Scanning' + '.'.repeat(1 + Math.floor(k * 9) % 3), W / 2, H * 0.82); }
}
function priceScreen(x, W, H, lo, hi, a) {
  x.fillStyle = '#0b0d10'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#16181c'; x.beginPath(); x.roundRect(70, 140, W - 140, 300, 36); x.fill();
  x.fillStyle = '#2a2e36'; x.beginPath(); x.roundRect(W / 2 - 120, 220, 240, 140, 26); x.fill(); x.beginPath(); x.arc(W / 2 + 10, 290, 44, 0, Math.PI * 2); x.fillStyle = '#3a3f4a'; x.fill();
  x.textAlign = 'center'; x.globalAlpha = a;
  x.fillStyle = 'rgba(255,255,255,.6)'; x.font = '600 30px sans-serif'; x.fillText('ESTIMATED RESALE', W / 2, 540);
  x.fillStyle = '#fff'; x.font = '700 92px sans-serif'; x.fillText(`$${lo}–$${hi}`, W / 2, 650);
  x.fillStyle = 'rgba(255,255,255,.12)'; x.beginPath(); x.roundRect(W / 2 - 160, 700, 320, 64, 32); x.fill();
  x.fillStyle = 'rgba(255,255,255,.85)'; x.font = '600 28px sans-serif'; x.fillText('Demand: high', W / 2, 742);
  x.fillStyle = 'rgba(255,255,255,.45)'; x.font = '500 24px sans-serif'; x.fillText('AI estimate · not an appraisal', W / 2, 1040);
  x.globalAlpha = 1;
}
function s9({ makeStage }, start) {
  const scene = nightRoom(makeStage, [[-0.4, 1.1, -0.9], [0.35, 1.25, -1.5], [0.7, 0.95, -0.7]]);
  const y = desk(scene);
  const c = cameraProp(AMBER_RIM, 1.6); c.position.set(0, y + 0.034, 0); c.rotation.y = 0.35; c.setLens(1); c.setCount(36); scene.add(c);
  // the scan: a thin sheet of white light sweeping over the camera
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.003), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, toneMapped: false, depthWrite: false }));
  beam.material.userData.noRim = true; beam.rotation.x = -Math.PI / 2; scene.add(beam);
  const bl = new THREE.PointLight(0xffffff, 0, 0.3); scene.add(bl);
  const cm = cam(32);
  return { scene, camera: cm, update(t, T) {
    const s2 = shake(T, 0.8), k = easeOut(range(t, 0, 2));
    place(cm, [s2[0] * 0.01 + 0.02, y + lerp(0.46, 0.38, k) + s2[1] * 0.01, lerp(0.28, 0.22, k)], [0, y + 0.02, 0]);
    const sc = range(t, 0.25, 1.9), z = lerp(-0.07, 0.07, (sc * 2) % 1), on = sc > 0 && sc < 1;
    beam.visible = on; beam.position.set(0, y + 0.075, z); bl.position.set(0, y + 0.1, z); bl.intensity = on ? 0.12 : 0;
    const a = range(t, 0.05, 0.3), dots = '.'.repeat(1 + Math.floor(t * 3) % 3);
    const corner = (x, yy, sx, sy) => `<div style="position:absolute;left:${x}px;top:${yy}px;width:54px;height:54px;border:2px solid rgba(255,255,255,.9);border-${sx}:none;border-${sy}:none;opacity:${a}"></div>`;
    return look({ tone: 'amber', dof: { focus: cm.position.distanceTo(c.position), aperture: 0.008, maxblur: 0.014 },
      overlay: corner(130, 420, 'right', 'bottom') + corner(536, 420, 'left', 'bottom') + corner(130, 806, 'right', 'top') + corner(536, 806, 'left', 'top') +
        `<div style="position:absolute;left:0;right:0;top:350px;text-align:center;font:500 22px 'Cap',sans-serif;letter-spacing:5px;color:rgba(255,255,255,.85);opacity:${a}">SCANNING${dots}</div>` });
  } };
}
// ===== 10. the estimate: the phone on the desk beside the camera =====
function s10({ makeStage }, start) {
  const scene = nightRoom(makeStage, [[-0.5, 1.1, -0.9], [0.5, 1.3, -1.6]]);
  const y = desk(scene);
  const c = cameraProp(AMBER_RIM, 1.4); c.position.set(-0.11, y + 0.034, -0.02); c.rotation.y = 0.5; scene.add(c);
  const ph = phone(); ph.rotation.x = -Math.PI / 2; ph.rotation.z = -0.15; ph.position.set(0.05, y + 0.005, 0.03); scene.add(ph);
  const cm = cam(30); const t2 = at(6, 'two') - start, t4 = at(6, 'four') - start;
  return { scene, camera: cm, update(t) {
    const lo = Math.round(200 * easeOut(range(t, 0.1, t2 + 0.3))), hi = Math.round(400 * easeOut(range(t, 0.1, t4 + 0.4)));
    ph.draw((x, W, H) => priceScreen(x, W, H, lo, hi, range(t, 0.05, 0.3))); ph.glow.intensity = 1.2;
    const k = easeOut(range(t, 0, 3));
    place(cm, [lerp(0.1, 0.06, k), y + lerp(0.46, 0.4, k), lerp(0.3, 0.24, k)], [0.0, y, 0.0]);
    return look({ tone: 'amber', dof: { focus: cm.position.distanceTo(ph.position), aperture: 0.006, maxblur: 0.014 } });
  } };
}
// ===== 11. "I didn't sell it": the screen goes dark =====
function s11({ makeStage }) {
  const scene = nightRoom(makeStage, [[-0.5, 1.1, -0.9], [0.5, 1.3, -1.6]]);
  const y = desk(scene);
  const c = cameraProp(AMBER_RIM, 1.6); c.position.set(-0.11, y + 0.034, -0.02); c.rotation.y = 0.5; scene.add(c);
  const ph = phone(); ph.rotation.x = -Math.PI / 2; ph.rotation.z = -0.15; ph.position.set(0.05, y + 0.005, 0.03); scene.add(ph);
  const cm = cam(30);
  return { scene, camera: cm, update(t) {
    const off = smooth(range(t, 0.25, 0.6));
    ph.draw((x, W, H) => { priceScreen(x, W, H, 200, 400, 1); x.fillStyle = `rgba(0,0,0,${off})`; x.fillRect(0, 0, W, H); }); ph.glow.intensity = 1.2 * (1 - off);
    place(cm, [-0.02, y + 0.32, 0.34], [-0.02, y, 0.0]);
    return look({ tone: 'amber', dof: { focus: cm.position.distanceTo(c.position), aperture: 0.01, maxblur: 0.016 } });
  } };
}
// ===== 12. "I bought a roll of film": the canister drops into the camera, the door closes, the counter resets =====
function s12({ makeStage }, start, end) {
  const scene = nightRoom(makeStage, [[-0.5, 1.1, -0.9], [0.5, 1.3, -1.6]]);
  const y = desk(scene);
  const c = cameraProp(AMBER_RIM, 1.4); c.rotation.set(Math.PI / 2, 0, 0.3); c.position.set(0, y + 0.024, 0); scene.add(c);
  const cn = canister(); rimify(cn, { color: AMBER_RIM, power: 2.4, strength: 0.6 }); c.add(cn);
  const fill = new THREE.SpotLight(0xffc890, 4, 2, 0.5, 0.9, 1.5); fill.position.set(0.3, y + 0.7, 0.4); fill.target.position.set(0, y, 0); scene.add(fill, fill.target);
  const W = c.dims.W, D = c.dims.D;
  const cm = cam(30); const dur = end - start;
  return { scene, camera: cm, update(t) {
    const drop = easeOut(range(t, 0.1, 0.7));
    cn.position.set(W / 2 - 0.02, 0, -D / 2 + 0.012 - (1 - drop) * 0.12); cn.rotation.y = (1 - drop) * 1.2;
    c.setDoor(1 - easeInOut(range(t, 0.85, 1.35)));
    c.setCount(t > 1.4 ? 1 : 0);
    const k = easeInOut(range(t, 0, dur));
    place(cm, [lerp(0.16, 0.11, k), y + lerp(0.3, 0.25, k), lerp(0.24, 0.2, k)], [0, y + 0.02, 0]);
    return look({ tone: 'amber', dof: { focus: cm.position.distanceTo(c.position), aperture: 0.01, maxblur: 0.016 } });
  } };
}
// ===== 13. now it's him: the camera to his eye, the flash =====
function s13({ makeStage }, start) {
  const scene = nightRoom(makeStage, [[-0.9, 1.9, -1.6], [0.3, 2.2, -2.4], [1.0, 1.75, -1.3]]);
  const h = person(AMBER_RIM); h.root.rotation.y = 0.35; scene.add(h.root);
  const c = cameraProp(AMBER_RIM, 2.0); scene.add(c);
  const cm = cam(36); const tF = at(8, 'check') - start;
  return { scene, camera: cm, update(t) {
    raiseToEye(h, c, easeInOut(range(t, 0.1, 1.0)));
    const k = easeOut(range(t, 0, tF));
    place(cm, [lerp(0.55, 0.42, k), lerp(1.2, 1.35, k), lerp(2.3, 1.55, k)], [0.05, lerp(1.4, 1.55, k), 0]);
    const f = t > tF - 0.03 ? Math.max(0, 1 - (t - tF) / 0.5) : 0;
    c.flash(t > tF - 0.03 && t < tF + 0.12 ? 1 : 0);
    return look({ tone: 'amber', dof: { focus: cm.position.distanceTo(c.position), aperture: 0.002, maxblur: 0.01 }, overlay: white(f) });
  } };
}
// ===== 14. end card =====
function s14({ makeStage }, start) {
  const scene = nightRoom(makeStage, [[-0.25, 1.05, -0.8], [0.3, 1.2, -1.4]]);
  const y = desk(scene);
  const c = cameraProp(AMBER_RIM); c.position.set(0, y + 0.034, 0); c.rotation.y = 0.55; c.setCount(1); scene.add(c);
  const cm = cam(30);
  return { scene, camera: cm, update(t) {
    place(cm, [0.24, y + 0.09, 0.44], [0, y + 0.05, 0]);
    const a = range(t, 0.2, 0.9);
    return look({ tone: 'amber', dof: { focus: cm.position.distanceTo(c.position), aperture: 0.02, maxblur: 0.02 },
      overlay: `<div style="position:absolute;left:0;right:0;top:250px;text-align:center;opacity:${a}"><div style="font:600 46px 'Cap',sans-serif;letter-spacing:1px;color:#fff;text-shadow:0 2px 16px rgba(0,0,0,.9)">Scan For Worth</div><div style="margin-top:12px;font:500 17px 'Cap',sans-serif;letter-spacing:4px;color:rgba(255,236,214,.8)">AI ESTIMATES · NOT APPRAISALS</div></div>` });
  } };
}

const cuts = [
  [0, s1], [at(0, 'camera') - 0.06, s2], [L(1) - 0.3, s3], [L(2) - 0.35, s4], [L(3) - 0.3, s5], [at(3, 'thirty-six') - 0.06, s6],
  [L(4) - 0.3, s7], [at(4, 'some') - 0.06, s8], [L(5) - 0.25, s9], [L(6) - 0.2, s10], [L(7) - 0.25, s11], [at(7, 'i', 1) - 0.06, s12],
  [L(8) - 0.25, s13], [at(8, 'check') + 0.35, s14],
];
export const SHOTS = cuts.map(([start, fn], i) => { const end = i + 1 < cuts.length ? cuts[i + 1][0] : DURATION; return { start, end, build: ctx => fn(ctx, start, end) }; });
