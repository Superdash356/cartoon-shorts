// "The code in the dead wax" - grandma's records in the attic. Object-first: no person on screen; the only hand is
// implied (sleeves tipping forward as if flicked from above the frame). Palette: attic daylight (cool white sun,
// warm dusty wood), black vinyl, cream label with a red ring; overlays white with the label red as the accent.
import * as THREE from 'three';
import { REC, record, codeStrip, codeTexture, CODE_A, CODE_B, LABEL_RED, grooveSurface, grooveCentre, stylus, crate, sleeve, attic, lathe, press } from '../vinyl.js';
import { lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake } from '../anim.js';
import { WORDS, LINES, CAPTIONS as CAPS, DURATION } from './vinyl-deadwax.timing.js';

export const CAPTIONS = CAPS;
export { DURATION };
export const FADES = [];
const L = i => LINES[i][0];
const at = (line, word, n = 0) => WORDS.filter(w => w[0] === line && w[1].toLowerCase().replace(/[^a-z-]/g, '') === word)[n][2];

const RED = LABEL_RED;
const big = 'font-weight:700;letter-spacing:-1px;text-shadow:0 4px 18px rgba(0,0,0,.6),0 0 3px rgba(0,0,0,.6);';
const ov = (html, top, extra = '') => `<div style="position:absolute;left:0;right:0;top:${top}px;text-align:center;${extra}">${html}</div>`;
const tag = (txt, x, y, a, color = '#fff') => `<div style="position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%);opacity:${a};font-size:24px;${big}letter-spacing:3px;color:${color};white-space:nowrap">${txt}</div>`;
const pill = (txt, k) => `<span style="display:inline-block;padding:9px 24px;border:3px solid ${RED};color:#fff;background:rgba(200,55,45,.25);border-radius:40px;font-size:27px;${big}letter-spacing:1px;transform:scale(${0.7 + 0.3 * easeOut(k)});opacity:${k}">${txt}</span>`;
// screen position (720x1280 page px) of a world point
const toScreen = (p, c) => { c.updateMatrixWorld(); const v = p.clone().project(c); return [(v.x + 1) * 360, (1 - v.y) * 640]; };

// attic daylight: a cool-white sun through a small window on the left, warm dusty bounce
const SUN = V(-1.5, 1.7, 0.9).normalize();
function atticStage(makeStage) {
  const scene = makeStage({ look: 'lamp', shadowSize: 1.4, sunDir: SUN.clone().multiplyScalar(6).toArray(), sun: 3.4, keyColor: 0xfff1dc, rimColor: 0x9fb8d8, floorRepeat: 4, env: 'studio' });
  scene.environmentIntensity = 0.3;
  const at = attic(scene, { sun: SUN }); scene.userData.attic = at;
  return scene;
}
// dark macro studio with a low raking light (the classic way to read dead wax)
function macroStage(makeStage, rake = V(-4, 0.9, 2)) {
  const scene = makeStage({ look: 'dark', shadowSize: 2, sunDir: rake.toArray(), sun: 2.2, keyColor: 0xfff4e6, rimColor: 0x8fb0ff, env: 'studio' });
  scene.environmentIntensity = 0.28;
  return scene;
}
// a record lying flat with its code at 6 o'clock towards +z (the camera side)
function flatRecord(scene, code = CODE_A, scale = 1) {
  const r = record(code); r.scale.setScalar(scale); scene.add(r);
  return r;
}
const CODE_ANG = Math.PI / 2;                       // the code sits at +z
const codePoint = (r = 0.385) => V(0, 0.007, r);

// ===== 1. hook: the scratched code glints under a raking light =====
function sHook({ makeStage }) {
  const scene = macroStage(makeStage);
  const rec = flatRecord(scene);
  const sweep = new THREE.PointLight(0xfff0dc, 0, 1.2); scene.add(sweep);
  const c = cam(28);
  return { scene, camera: c, update(t) {
    rec.rotation.y = 0.12 - t * 0.05;
    sweep.position.set(lerp(-0.5, 0.5, range(t, 0, 1.2)), 0.05, 0.5); sweep.intensity = 1.6;
    place(c, [0.04 + t * 0.02, 0.07, 0.62], [0, 0.0, 0.37]);
    return { dof: { focus: 0.26, aperture: 0.03, maxblur: 0.02 }, bloom: 0.5, exposure: 1.1 };
  } };
}
// ===== 2. the crate in the attic sunbeam, $1 EACH; sleeves tip forward as if flicked from above =====
function sCrate({ makeStage }, start) {
  const scene = atticStage(makeStage);
  const cr = crate(16, 1, '$1 EACH'); scene.add(cr.group);
  const c = cam(38);
  return { scene, camera: c, update(t) {
    const T = t + start; scene.userData.attic.update(T);
    cr.flip(t + 0.2, 6);
    const k = easeOut(range(t, 0, 2.6)), s = shake(T, 0.3);
    place(c, [lerp(0.5, 0.3, k) + s[0], lerp(0.55, 0.45, k) + s[1], lerp(1.45, 1.1, k)], [0, 0.16, 0.05]);
    return { dof: { focus: c.position.distanceTo(V(0, 0.12, 0.2)), aperture: 0.006, maxblur: 0.01 }, bloom: 0.45, exposure: 1.0 };
  } };
}
// ===== 3. "this tiny ring": a record on the floor in the sun; the camera swoops to the dead wax; a ring traces it =====
function sRing({ makeStage }, start) {
  const scene = atticStage(makeStage);
  const rec = flatRecord(scene, CODE_A, REC); rec.position.set(0.05, 0.0005, 0.25); rec.rotation.y = 0.2;
  const sl = sleeve(9); sl.rotation.x = -Math.PI / 2; sl.rotation.z = 0.5; sl.position.set(-0.12, 0.003, 0.02); scene.add(sl);
  const cr = crate(14, 2, '$1 EACH'); cr.group.position.set(0.25, 0, -0.45); cr.group.rotation.y = -0.3; scene.add(cr.group);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.392, 0.005, 8, 160), new THREE.MeshBasicMaterial({ color: 0xff5a4a, transparent: true, toneMapped: false, depthWrite: false }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.01; rec.add(ring);
  const c = cam(34); const tR = at(0, 'ring') - start;
  return { scene, camera: c, update(t) {
    scene.userData.attic.update(t + start);
    const k = easeInOut(range(t, 0, 2.2)), cp = rec.position;
    place(c, [cp.x + lerp(0.25, 0.04, k), lerp(0.42, 0.13, k), cp.z + lerp(0.55, 0.2, k)], [cp.x, 0, cp.z + lerp(0, 0.045, k)]);
    const a = smooth(range(t, tR - 0.1, tR + 0.4));
    ring.material.opacity = a * (0.75 + 0.25 * Math.sin(t * 8)); ring.scale.setScalar(1 + (1 - a) * 0.4);
    return { dof: { focus: c.position.distanceTo(cp.clone().add(V(0, 0, 0.05))), aperture: 0.008, maxblur: 0.012 }, bloom: 0.55, exposure: 1.0 };
  } };
}
// ===== 4. "by the box": a row of crates with cardboard signs, low tracking shot =====
function sBoxes({ makeStage }, start) {
  const scene = atticStage(makeStage);
  const signs = ['$1 EACH', '5 FOR $3', '$1 EACH', 'ALL $2'];
  const cs = signs.map((s, i) => { const c = crate(15, 4 + i, s); c.group.position.set(-0.9 + i * 0.5, 0, 0.1 - (i % 2) * 0.08); c.group.rotation.y = (i - 1.5) * 0.06; scene.add(c.group); return c; });
  const c = cam(40);
  return { scene, camera: c, update(t) {
    scene.userData.attic.update(t + start);
    const k = easeInOut(range(t, 0, 2.6)), x = lerp(-1.05, 0.25, k);
    place(c, [x, 0.42, 1.55], [x + 0.3, 0.13, 0]);
    return { dof: { focus: 0.95, aperture: 0.005, maxblur: 0.01 }, bloom: 0.45, exposure: 1.0 };
  } };
}
// ===== 5. "But zoom in": crash zoom down onto the grooves =====
function sZoom({ makeStage }) {
  const scene = macroStage(makeStage, V(-3, 2.2, 3));
  const rec = flatRecord(scene); rec.rotation.y = 0.7;
  const c = cam(30);
  return { scene, camera: c, update(t) {
    rec.rotation.y = 0.7 - t * 0.12;
    const k = easeIn(range(t, 0, 1.15));
    const h = lerp(3.4, 0.012, k);
    place(c, [0.04, h, 0.72 + h * 0.18], [0, 0, 0.7]);
    return { dof: { focus: h, aperture: 0.0008, maxblur: 0.006 }, bloom: 0.4, exposure: 1.05 };
  } };
}
// ===== 6. inside the groove: a fly-over through the canyon; a third of a mile =====
function sCanyon({ makeStage }, start) {
  const scene = makeStage({ look: 'dark', shadowSize: 6, sunDir: [-2, 3, -6], sun: 1.6, keyColor: 0xcfe0ff, rimColor: 0xffc890, env: 'studio' });
  scene.environmentIntensity = 0.3;
  const gs = grooveSurface({ grooves: 16, length: 80 }); gs.position.set(0, 0, 10); scene.add(gs);
  const front = new THREE.DirectionalLight(0xfff0e0, 1.4); front.position.set(1.5, 2, 6); scene.add(front);
  const c = cam(55); const tT = at(2, 'third') - start;
  return { scene, camera: c, update(t) {
    const z = 6 - t * 9, cz = z;
    const cx = grooveCentre(0, -(cz - 10)) * 0.6;
    place(c, [cx + Math.sin(t * 0.8) * 0.12, 0.42 + Math.sin(t * 1.3) * 0.05, cz], [cx * 0.4, -0.1, cz - 6]);
    c.rotation.z += Math.sin(t * 0.6) * 0.04;
    const a = range(t, tT - 0.15, tT + 0.25);
    return { dof: { focus: 3, aperture: 0.002, maxblur: 0.012 }, bloom: 0.5, exposure: 1.1,
      overlay: a > 0 ? ov(`<div style="font-size:30px;${big}letter-spacing:5px;color:${RED};opacity:${a}">ONE GROOVE</div><div style="font-size:120px;${big}opacity:${a};transform:scale(${0.85 + 0.15 * easeOut(a)})">⅓ mile</div>`, 120) : '' };
  } };
}
// ===== 7. the needle riding the wiggles =====
function sNeedle({ makeStage }, start) {
  const scene = makeStage({ look: 'dark', shadowSize: 6, sunDir: [-3, 4, 2], sun: 2.2, keyColor: 0xfff2e2, rimColor: 0x9ec0ff, env: 'studio' });
  scene.environmentIntensity = 0.3;
  const gs = grooveSurface({ grooves: 12, length: 70 }); scene.add(gs);
  const st = stylus(); scene.add(st);
  const back = new THREE.DirectionalLight(0x9ec0ff, 2.2); back.position.set(2, 2, -6); scene.add(back);
  const c = cam(34);
  return { scene, camera: c, update(t) {
    const zp = 12 + t * 2.4; gs.position.z = zp;
    const x = grooveCentre(0, zp);
    st.position.set(x, -0.33, 0); st.rotation.z = (grooveCentre(0, zp + 0.05) - x) * 3;
    const k = easeInOut(range(t, 0, 4));
    place(c, [lerp(-2.4, -1.7, k), lerp(0.75, 0.45, k), lerp(2.2, 1.5, k)], [x * 0.7, 0.05, -0.3]);
    return { dof: { focus: c.position.distanceTo(V(x, 0.2, 0)), aperture: 0.004, maxblur: 0.014 }, bloom: 0.45, exposure: 1.1 };
  } };
}
// ===== 8. past the last song: glide over the last grooves onto the smooth band =====
function sGlide({ makeStage }, start) {
  const scene = macroStage(makeStage, V(-3, 1.1, 2.6));
  const rec = flatRecord(scene);
  const c = cam(36); const tB = at(4, 'band') - start;
  return { scene, camera: c, update(t) {
    rec.rotation.y = -t * 0.08;
    const k = easeInOut(range(t, 0, 2.6)), r = lerp(0.62, 0.36, k);
    place(c, [0.03, lerp(0.07, 0.11, k), r + 0.22], [0, 0, r - 0.08]);
    const a = range(t, tB - 0.1, tB + 0.3);
    return { dof: { focus: 0.24, aperture: 0.012, maxblur: 0.014 }, bloom: 0.35, exposure: 0.95 };
  } };
}
// ===== 9. the dead wax and its code, read under a moving light =====
function sDeadWax({ makeStage }, start) {
  const scene = macroStage(makeStage);
  const rec = flatRecord(scene);
  const sweep = new THREE.PointLight(0xfff2de, 0, 1.4); scene.add(sweep);
  const c = cam(30); const tC = at(4, 'dead') - start;
  return { scene, camera: c, update(t) {
    rec.rotation.y = 0.18 - t * 0.06;
    sweep.position.set(lerp(-0.6, 0.6, range(t, 0, 2.6)), 0.06, 0.55); sweep.intensity = 2.2;
    const k = easeOut(range(t, 0, 2.6));
    place(c, [lerp(0.12, 0.02, k), lerp(0.16, 0.1, k), lerp(0.75, 0.62, k)], [0, 0, 0.38]);
    const a = range(t, tC - 0.1, tC + 0.3), p = toScreen(V(0, 0.01, 0.43), c);
    return { dof: { focus: c.position.distanceTo(V(0, 0, 0.385)), aperture: 0.02, maxblur: 0.018 }, bloom: 0.4, exposure: 0.95,
      overlay: tag('DEAD WAX', p[0], p[1] + 70, a, '#fff') };
  } };
}
// ===== 10. the code is etched into the lacquer by hand: a scribe writes, the letters appear behind it =====
function sEtch({ makeStage }, start, end) {
  const scene = macroStage(makeStage, V(-3, 1.4, 2));
  const la = lathe(); scene.add(la); la.head.visible = false; la.swarf.visible = false;
  const strip = codeStrip(CODE_A, 0.6, 1.1); strip.position.y = 0.0085; la.add(strip);
  const scribe = new THREE.Group(); scene.add(scribe);
  const sm = new THREE.MeshPhysicalMaterial({ color: 0xd0d4d8, metalness: 1, roughness: 0.2 });
  const needle = new THREE.Mesh(new THREE.ConeGeometry(0.009, 0.05, 16), sm); needle.rotation.x = Math.PI; needle.position.y = 0.025; scribe.add(needle);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.009, 0.5, 16), sm); shaft.position.y = 0.3; scribe.add(shaft);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.25, 16), new THREE.MeshStandardMaterial({ color: 0x1e1e22, roughness: 0.5 })); grip.position.y = 0.42; scribe.add(grip);
  const spark = new THREE.Sprite(new THREE.SpriteMaterial({ map: (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(cv); })(), color: 0xdfe9ff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false })); spark.scale.setScalar(0.005); scribe.add(spark);
  const c = cam(30); const dur = end - start; let shown = -1;
  const SPAN = 1.1, A0 = -Math.PI / 2 - SPAN / 2, R = 0.6;
  return { scene, camera: c, update(t) {
    const fl = clamp(t / (dur - 0.4)) * CODE_A.length, n = Math.floor(fl);
    if (n !== shown) { strip.material.map.dispose(); strip.material.map = codeTexture(CODE_A, n, 0, true); strip.material.needsUpdate = true; shown = n; }
    // the pen sits at the end of what is written, moving through the current character
    const T = strip.material.map.userData, u = T.endU + (fl - n) * T.nextW;
    const th = A0 + u * SPAN, px = Math.cos(th) * R, pz = -Math.sin(th) * R;
    const wob = Math.sin(t * 40) * 0.002;
    scribe.position.set(px + wob, 0.0085 + Math.abs(Math.sin(t * 22)) * 0.003, pz); scribe.rotation.set(-0.55, 0, -0.35); spark.material.opacity = 0.6 + 0.4 * Math.sin(t * 50);
    const k = easeInOut(range(t, 0, dur));
    const k2 = easeInOut(range(t, dur * 0.62, dur));
    const cpos = V(px - lerp(0.0, 0.025, k), lerp(0.12, 0.095, k), pz + 0.21).lerp(V(0.02, 0.2, 0.6 + 0.42), k2);
    const ctgt = V(px - 0.012, 0.012, pz).lerp(V(0, 0, 0.6), k2);
    place(c, cpos.toArray(), ctgt.toArray());
    return { dof: { focus: c.position.distanceTo(ctgt), aperture: 0.006, maxblur: 0.012 }, bloom: 0.4, exposure: 1.05 };
  } };
}
// ===== 12. the press: the hot puck is squashed between the dies; steam; a record =====
function sPress({ makeStage }) {
  const scene = makeStage({ look: 'dark', shadowSize: 3, sunDir: [-3, 5, 4], sun: 2.4, keyColor: 0xfff0e0, rimColor: 0x9fbfff, env: 'studio' });
  scene.environmentIntensity = 0.5;
  const pr = press(); scene.add(pr);
  const c = cam(34);
  return { scene, camera: c, update(t) {
    const close = easeIn(range(t, 0.05, 0.38)), open = easeInOut(range(t, 0.85, 1.35));
    const o = t < 0.85 ? 1 - close : open;
    pr.update(o, smooth(range(t, 0.3, 0.42)), t > 0.38 ? t - 0.38 : -1);
    const s = t > 0.38 && t < 0.55 ? shake(t, 6) : [0, 0];
    place(c, [1.6 + s[0], lerp(0.55, 0.9, range(t, 0.8, 1.6)) + s[1], 2.7], [0, 0.25, 0]);
    return { dof: { focus: 3.4, aperture: 0.001, maxblur: 0.008 }, bloom: 0.5, exposure: 1.0 };
  } };
}
// ===== 13. same album, different pressing: a lateral macro dolly from the later pressing to the early one =====
function sCompare({ makeStage }, start) {
  const scene = macroStage(makeStage, V(-3, 1.2, 2.6));
  const a = flatRecord(scene, CODE_A); a.position.set(-1.05, 0, 0);
  const b = flatRecord(scene, CODE_B); b.position.set(1.05, 0, 0);
  const c = cam(32); const tE = at(6, 'early') - start;
  return { scene, camera: c, update(t) {
    a.rotation.y = 0.05; b.rotation.y = -0.05;
    const k = easeInOut(range(t, 0.5, tE + 0.15)), x = lerp(1.05, -1.05, k);
    place(c, [x + 0.08, 0.16, 0.86], [x, 0, 0.39]);
    const ge = smooth(range(t, tE - 0.05, tE + 0.4));
    if (ge > 0 && !a.code.userData.glow) { a.code.material.map = codeTexture(CODE_A, CODE_A.length, 0.9); a.code.material.needsUpdate = true; a.code.userData.glow = 1; }
    const pa = toScreen(V(-1.05, 0, 0.44), c), pb = toScreen(V(1.05, 0, 0.44), c);
    const s = range(t, 0.05, 0.3);
    return { dof: { focus: c.position.distanceTo(V(x, 0, 0.39)), aperture: 0.012, maxblur: 0.014 }, bloom: 0.4 + ge * 0.35, exposure: 0.95,
      overlay: tag('A9 · LATER PRESSING', pb[0], pb[1] + 60, s * (1 - k)) + tag('A1 · EARLY PRESSING', pa[0], pa[1] + 60, Math.max(k, ge), ge > 0 ? '#ffd9a0' : '#fff') };
  } };
}
// ===== 14. scan: the record on the attic floor in the sun, seen through the phone =====
const corner = (x, y, sx, sy, a) => `<div style="position:absolute;left:${x}px;top:${y}px;width:60px;height:60px;border:3px solid rgba(255,255,255,.92);border-${sx}:none;border-${sy}:none;opacity:${a};box-shadow:0 0 10px rgba(0,0,0,.4)"></div>`;
const finder = (a, g = 0) => corner(110 - g, 380 - g, 'right', 'bottom', a) + corner(550 + g, 380 - g, 'left', 'bottom', a) + corner(110 - g, 840 + g, 'right', 'top', a) + corner(550 + g, 840 + g, 'left', 'top', a);
function floorRecord(scene) {
  const rec = flatRecord(scene, CODE_A, REC); rec.position.set(0, 0.0005, 0); rec.rotation.y = 0.4;
  const sl = sleeve(9); sl.rotation.x = -Math.PI / 2; sl.rotation.z = 0.35; sl.position.set(-0.2, 0.003, -0.12); scene.add(sl);
  return rec;
}
function sScan({ makeStage }, start) {
  const scene = atticStage(makeStage);
  const rec = floorRecord(scene);
  const line = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.004), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, toneMapped: false, depthWrite: false })); line.rotation.x = -Math.PI / 2; scene.add(line);
  const c = cam(34);
  return { scene, camera: c, update(t) {
    scene.userData.attic.update(t + start);
    const k = easeInOut(range(t, 0, 1.8)), s = shake(t + start, 1);
    place(c, [s[0] * 0.3, lerp(0.75, 0.58, k) + s[1] * 0.3, lerp(0.3, 0.2, k)], [0, 0, -0.01]);
    const sc = range(t, 0.25, 1.7); line.visible = sc > 0 && sc < 1; line.position.set(0, 0.004, lerp(-0.16, 0.16, (sc * 2) % 1));
    const a = range(t, 0.05, 0.3), dots = '.'.repeat(1 + Math.floor(t * 3) % 3);
    return { dof: { focus: c.position.distanceTo(rec.position), aperture: 0.002, maxblur: 0.008 }, bloom: 0.4, exposure: 1.0,
      overlay: finder(a, 10 * (1 - easeOut(a))) + ov(`SCANNING${dots}`, 300, `font-size:26px;${big}letter-spacing:4px;opacity:${a}`) };
  } };
}
// ===== 15. the estimate lands: a rolling counter =====
function sPrice({ makeStage }, start) {
  const scene = atticStage(makeStage);
  const rec = floorRecord(scene);
  const c = cam(34); const tE = at(7, 'eighty') - start, tH = at(7, 'hundred') - start;
  return { scene, camera: c, update(t) {
    scene.userData.attic.update(t + start);
    rec.rotation.y = 0.4 + t * 0.04;
    const k = easeOut(range(t, 0, 4));
    place(c, [lerp(0.08, 0.02, k), lerp(0.58, 0.48, k), lerp(0.42, 0.34, k)], [0, 0, lerp(0.02, 0.06, k)]);
    const lo = Math.round(80 * easeOut(range(t, 0.1, tE + 0.2))), hi = Math.round(200 * easeOut(range(t, 0.1, tH + 0.35)));
    const a = range(t, 0.05, 0.35), nr = range(t, tH + 0.4, tH + 0.65);
    return { dof: { focus: c.position.distanceTo(rec.position), aperture: 0.003, maxblur: 0.01 }, bloom: 0.4, exposure: 0.95,
      overlay: ov(`<div style="font-size:24px;${big}letter-spacing:5px;color:#ffd2c8;opacity:${a}">ESTIMATED RESALE</div><div style="font-size:112px;${big}font-variant-numeric:tabular-nums;opacity:${a}">$${lo}–$${hi}</div>`, 110) +
        ov(pill('CONDITION: VG+', nr), 300) + ov('AI estimate · not an appraisal', 372, `font-size:20px;font-weight:600;opacity:${nr * 0.85};text-shadow:0 2px 8px rgba(0,0,0,.8)`) };
  } };
}
// ===== 16. end: the record back in its sleeve, leaning on the crate in the sunbeam =====
function sEnd({ makeStage }, start) {
  const scene = atticStage(makeStage);
  const cr = crate(14, 1, '$1 EACH'); scene.add(cr.group);
  const sl = sleeve(9); sl.position.set(0.02, 0, 0.27); sl.rotation.x = -0.18; scene.add(sl);
  const rec = record(CODE_A); rec.scale.setScalar(REC); rec.rotation.set(Math.PI / 2 - 0.16, 0, 0); rec.position.set(0.1, REC * Math.cos(0.16) + 0.004, 0.27 + 0.045); scene.add(rec);
  const c = cam(36);
  return { scene, camera: c, update(t) {
    scene.userData.attic.update(t + start);
    rec.rotation.z = t * 0.0;
    const k = easeInOut(range(t, 0, 5));
    place(c, [lerp(-0.35, -0.2, k), lerp(0.42, 0.36, k), lerp(1.25, 1.0, k)], [0.05, 0.25, 0.2]);
    const a = range(t, 0.1, 0.5);
    return { dof: { focus: c.position.distanceTo(rec.position), aperture: 0.004, maxblur: 0.01 }, bloom: 0.45, exposure: 1.0,
      overlay: ov(`<span style="font-size:58px;${big}">Scan For Worth</span>`, 96, `opacity:${a}`) + ov('AI ESTIMATES · NOT APPRAISALS', 172, `font-size:18px;${big}letter-spacing:3px;color:#ffd2c8;opacity:${a * 0.9}`) };
  } };
}

const cuts = [
  [0, sHook], [at(0, 'before') - 0.06, sCrate], [at(0, 'look') - 0.06, sRing], [L(1) - 0.05, sBoxes],
  [L(2) - 0.05, sZoom], [at(2, 'each') - 0.06, sCanyon], [L(3) - 0.05, sNeedle], [L(4) - 0.05, sGlide],
  [at(4, 'collectors') - 0.06, sDeadWax], [L(5) - 0.05, sEtch], [L(6) - 0.05, sPress],
  [at(6, 'pressing') - 0.06, sCompare], [L(7) - 0.05, sScan], [at(7, 'an') - 0.06, sPrice], [L(8) - 0.05, sEnd],
];
export const SHOTS = cuts.map(([start, fn], i) => { const end = i + 1 < cuts.length ? cuts[i + 1][0] : DURATION; return { start, end, build: ctx => fn(ctx, start, end) }; });
