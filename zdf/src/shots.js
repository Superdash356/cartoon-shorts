// "Rubies in a dead watch" - a 40 s test short. The edit follows the voice: shot boundaries come from timing.js.
import * as THREE from 'three';
import { makeRealHuman } from './realhuman.js';
import { watch, movement, pivotDemo, bin, phone, tweezers, scanBeam, glow, jewel } from './watch.js';
import { sparks } from './props.js';
import { kf, lerp, smooth, easeOut, easeIn, easeInOut, range, clamp, V, cam, place, shake } from './anim.js';
import { WORDS, LINES, CAPTIONS as CAPS, DURATION } from './timing.js';

export const CAPTIONS = CAPS;
export { DURATION };
const L = i => LINES[i][0];
// start time of the n-th occurrence of `word` in voice line `line`
const at = (line, word, n = 0) => WORDS.filter(w => w[0] === line && w[1].toLowerCase().replace(/[^a-z-]/g, '') === word)[n][2];
export const FADES = [[L(2) - 0.16, L(2) - 0.03, L(2) + 0.03, L(2) + 0.2]];

const WS = 0.024; // watch scale in the real-world shots (case radius in metres)
const blink = t => { const p = (t + 0.7) % 3.1; return p < 0.14 ? Math.sin(p / 0.14 * Math.PI) : 0; };
const ov = (html, top, extra = '') => `<div style="position:absolute;left:0;right:0;top:${top}px;text-align:center;${extra}">${html}</div>`;
const big = 'font-weight:700;letter-spacing:-1px;text-shadow:0 4px 18px rgba(0,0,0,.6),0 0 3px rgba(0,0,0,.6);';

// the man holds the watch by its strap, dangling from his right hand
function dangle(man, w, wrist, t, { open = 0, lookAt = null, face = {} } = {}) {
  man.reset(); man.armsDown(0.1, 0.2 + Math.sin(t * 1.3) * 0.01);
  man.reach('R', wrist, V(-1, -0.5, -0.6));
  man.aimHand('R', V(0.15, -0.55, 1), V(0.2, -1, -0.2));
  man.curl('R', 0.55 - open * 0.4, 0.85 - open * 0.7);
  man.curl('R', 0.8 - open * 0.7, 0.85 - open * 0.7, [1]);
  const p = man.pinch('R');
  man.look(lookAt || p.clone().add(V(0, -0.09, 0)), 0.9);
  man.face({ blink: blink(t), ...face });
  return p;
}
function hangWatch(w, p, t, drop = 0) {
  const sw = Math.sin(t * 2.1) * 0.1;
  w.position.set(p.x + Math.sin(t * 2.1) * 0.006, p.y - 0.094 - drop, p.z);
  w.rotation.set(0, sw + 0.15, Math.sin(t * 2.1 + 1) * 0.05);
}

// ===== A1: he is about to drop grandpa's watch in the bin =====
function shotA1({ makeStage }) {
  const scene = makeStage({ shadowSize: 2.2, sunDir: [-2.5, 5, 3.5] });
  const man = makeRealHuman(); man.root.rotation.y = 0.12; scene.add(man.root);
  const b = bin(); b.position.set(-0.3, 0, 0.5); scene.add(b);
  const w = watch(); w.scale.setScalar(WS); scene.add(w);
  const c = cam(34);
  return { scene, camera: c, update(t) {
    const p = dangle(man, w, V(-0.3, 1.02 + Math.sin(t * 1.3) * 0.004, 0.44), t, { face: { browDown: 0.35, press: 0.4, frown: 0.25 } });
    hangWatch(w, p, t);
    const k = easeInOut(range(t, 0.1, 2.2));
    const s = shake(t, 0.5);
    place(c, [lerp(0.25, -0.12, k) + s[0], lerp(1.42, 1.0, k) + s[1], lerp(3.0, 1.15, k)], [lerp(-0.12, -0.29, k), lerp(1.22, 0.93, k), lerp(0.2, 0.45, k)]);
    return { dof: { focus: c.position.distanceTo(w.position), aperture: 0.0016, maxblur: 0.008 }, bloom: 0.3 };
  } };
}
// ===== A2: macro on the dangling watch; the rubies glow through the dial =====
function shotA2({ makeStage }, start) {
  const scene = makeStage({ shadowSize: 2.2, sunDir: [-2.5, 5, 3.5] });
  const man = makeRealHuman(); man.root.rotation.y = 0.12; scene.add(man.root);
  const b = bin(); b.position.set(-0.3, 0, 0.5); scene.add(b);
  const w = watch(); w.scale.setScalar(WS); scene.add(w);
  const light = new THREE.PointLight(0xff2040, 0, 0.5); scene.add(light);
  const c = cam(30); const tR = at(0, 'seventeen') - start;
  return { scene, camera: c, update(t) {
    const T = t + 2.1;
    const p = dangle(man, w, V(-0.3, 1.02, 0.44), T);
    hangWatch(w, p, T);
    const x = smooth(range(t, tR - 0.15, tR + 0.3));
    w.xray(x); w.movement.update(0);
    light.position.copy(w.position).add(V(0, 0, 0.04)); light.intensity = x * 0.03;
    const k = easeOut(range(t, 0, 2.2));
    const wp = w.position;
    place(c, [wp.x + lerp(0.05, 0.02, k), wp.y + 0.012, wp.z + lerp(0.26, 0.17, k)], [wp.x, wp.y + 0.006, wp.z]);
    return { dof: { focus: c.position.distanceTo(wp), aperture: 0.012, maxblur: 0.012 }, bloom: 0.35 + x * 0.3 };
  } };
}
// ===== B: from inside the bin, looking up; he lets go =====
function shotB({ makeStage }, start) {
  const scene = makeStage({ shadowSize: 2.2, sunDir: [-2, 6, 2] });
  const man = makeRealHuman(); man.root.position.set(0.05, 0, -0.05); scene.add(man.root);
  const b = bin(true); b.position.set(0, 0, 0.5); scene.add(b);
  const w = watch(); w.scale.setScalar(WS); scene.add(w);
  const fill = new THREE.PointLight(0xfff0e0, 0.12, 3); fill.position.set(0, 0.2, 0.5); scene.add(fill);
  const c = cam(66); const tD = at(1, 'scrap') - start;
  return { scene, camera: c, update(t) {
    const fall = Math.max(0, t - tD);
    man.reset(); man.armsDown(); man.lean(0.75, 0, 0);
    man.reach('R', V(-0.02, 0.72, 0.5), V(-1, 0.2, -0.6));
    man.aimHand('R', V(0.1, -0.7, 0.7), V(0.1, -1, -0.3));
    const open = smooth(range(t, tD - 0.12, tD + 0.2));
    man.curl('R', 0.55 - open * 0.4, 0.85 - open * 0.7); man.curl('R', 0.8 - open * 0.7, 0.85 - open * 0.7, [1]);
    const p = man.pinch('R');
    man.look(V(0, 0.05, 0.5), 1); man.face({ blink: blink(t), browDown: 0.3, press: 0.3 });
    const drop = 0.34 * fall * fall;
    w.position.set(p.x + 0.004, p.y - 0.094 - drop, p.z);
    w.rotation.set(-Math.PI / 2 + 0.5 - fall * 0.9, Math.sin(t * 2) * 0.12 + fall * 1.4, 0.2);
    c.position.set(0.0 + Math.sin(t * 0.9) * 0.008, 0.045, 0.5); c.up.set(0, 0, 1); c.lookAt(0.005, 1, 0.53);
    return { dof: { focus: Math.max(0.12, w.position.y - 0.045), aperture: 0.0012, maxblur: 0.006 }, bloom: 0.3, exposure: 1.1 };
  } };
}
// ===== C: the case back comes off: the movement and its rubies =====
function shotC({ makeStage }, start) {
  const scene = makeStage({ look: 'dark', shadowSize: 3, sunDir: [-3, 5, 6], sun: 2.6 });
  const w = watch({ strap: 0.75 }); w.position.set(0, 1.5, 0); w.rotation.set(0.12, Math.PI, 0); scene.add(w);
  const warm = new THREE.PointLight(0xffd9a8, 6, 8); warm.position.set(2, 3, 3); scene.add(warm);
  const c = cam(30); const tR = at(2, 'rubies') - start;
  return { scene, camera: c, update(t) {
    const o = easeInOut(range(t, 0.25, 1.35));
    w.back.rotation.z = -o * 2.2; w.back.position.set(o * o * 2.6, o * 0.5, -o * 1.3);
    w.rotation.set(0.12 + Math.sin(t * 0.6) * 0.03, Math.PI + lerp(-0.25, 0.18, range(t, 0, 4.6)), 0);
    w.movement.update(Math.max(0, t - 1.2), Math.max(0, t - 1.2) * 1.5);
    const g = smooth(range(t, tR - 0.2, tR + 0.25)) * (0.75 + 0.25 * Math.sin(t * 9));
    w.movement.setGlow(g);
    const k = easeInOut(range(t, 0.9, 4.4));
    place(c, [lerp(0.5, 0.25, k), lerp(1.75, 1.6, k), lerp(8.2, 4.3, k)], [0, 1.5, 0]);
    return { dof: { focus: c.position.z - 0.25, aperture: 0.0009, maxblur: 0.008 }, bloom: 0.45 + g * 0.9 };
  } };
}
// ===== D: steel on steel wears; steel on ruby does not =====
function shotD({ makeStage }, start) {
  const scene = makeStage({ look: 'dark', shadowSize: 4, sunDir: [-3, 6, 6], sun: 2.4 });
  const a = pivotDemo('steel'), b = pivotDemo('ruby');
  for (const g of [a, b]) { g.position.set(0, 1.2, 0); scene.add(g); }
  const hot = glow(0xff7a20, 0.9); hot.position.set(0, 1.5, 0.2); scene.add(hot);
  const sp = [0, 1, 2].map(i => { const s = sparks(70, { speed: 1.6, spread: 1.5, gravity: -3.5, life: 0.6, size: 0.02, dir: V(0.2, 1, 0.9).normalize(), seed: 5 + i, color: [1, 0.55, 0.15] }); s.position.set(0, 1.52, 0.17); scene.add(s); return s; });
  const light = new THREE.PointLight(0xff7020, 0, 4); light.position.set(0, 1.6, 0.6); scene.add(light);
  const rl = new THREE.PointLight(0xff2850, 0, 5); rl.position.set(0, 1.3, 1.2); scene.add(rl);
  const c = cam(32); const tS = at(3, 'steel', 2) - start;
  return { scene, camera: c, update(t) {
    const ruby = t >= tS; a.visible = !ruby; b.visible = ruby;
    a.update(t, 1); b.update(t, 0);
    const heat = ruby ? 0 : smooth(range(t, 0.2, 1.4)) * (0.8 + 0.2 * Math.sin(t * 40));
    hot.material.opacity = heat * 0.9; hot.scale.setScalar(0.7 + heat * 0.5); light.intensity = heat * 9;
    sp.forEach((s, i) => { s.visible = !ruby && t > 0.25; s.update((t + i * 0.2) % 0.6); });
    rl.intensity = ruby ? 5 + Math.sin(t * 5) * 1 : 0;
    if (b.rglow) b.rglow.material.opacity = 0.4 + 0.12 * Math.sin(t * 5);
    const lt = ruby ? t - tS : t, punch = ruby ? easeOut(range(lt, 0, 0.35)) : 1;
    const k = easeInOut(range(lt, 0, ruby ? 2.4 : tS));
    const s = shake(t, ruby ? 0.4 : 3.5);
    const z = (ruby ? lerp(8.6, 6.4, k) : lerp(9.5, 7.2, k)) + (1 - punch) * 1.5;
    place(c, [(ruby ? -1.3 : 1.3) + s[0], 2.5 + s[1], z], [0, 1.75, 0]);
    return { dof: { focus: z - 0.3, aperture: 0.0006, maxblur: 0.006 }, bloom: ruby ? 0.9 : 0.75,
      overlay: ov(ruby ? 'STEEL ON RUBY' : 'STEEL ON STEEL', 64, `font-size:40px;${big}color:${ruby ? '#ff6f8b' : '#ffb26b'};opacity:${range(lt, 0.1, 0.4)}`) };
  } };
}
// ===== E: the balance wheel, in slow motion =====
function shotE({ makeStage }, start) {
  const scene = makeStage({ look: 'dark', shadowSize: 3, sunDir: [-3, 5, 6], sun: 1.5 });
  const m = movement(); m.position.set(0, 1.3, 0); m.rotation.x = -0.5; scene.add(m);
  const warm = new THREE.PointLight(0xffd9a8, 2.5, 8); warm.position.set(1.5, 2.5, 2.5); scene.add(warm);
  const c = cam(30); const t8 = at(4, 'eight') - start;
  return { scene, camera: c, update(t) {
    m.update(t * 0.35, t * 0.95); m.setGlow(0.35 + 0.15 * Math.sin(t * 4));
    const f = m.balance.getWorldPosition(new THREE.Vector3());
    const k = easeInOut(range(t, 0, 4.6));
    place(c, [f.x + lerp(0.5, -0.1, k), f.y + lerp(0.5, 0.75, k), f.z + lerp(1.9, 1.45, k)], [f.x, f.y + 0.03, f.z]);
    const a = range(t, t8 - 0.1, t8 + 0.2);
    return { dof: { focus: c.position.distanceTo(f), aperture: 0.004, maxblur: 0.012 }, bloom: 0.4,
      overlay: a > 0 ? ov(`<span style="font-size:${150 * (0.8 + 0.2 * easeOut(a))}px;${big}">8×</span><br><span style="font-size:38px;${big}">every second</span>`, 120, `opacity:${a}`) + ov('shown in slow motion', 345, `font-size:22px;opacity:${a * 0.75};${big}font-weight:500;letter-spacing:0`) : '' };
  } };
}
// ===== F: the whole movement running; the daily count =====
function shotF({ makeStage }, start) {
  const scene = makeStage({ look: 'dark', shadowSize: 3, sunDir: [-3, 5, 6], sun: 1.7 });
  const m = movement(); m.position.set(0, 1.3, 0); scene.add(m);
  const warm = new THREE.PointLight(0xffd9a8, 5, 8); warm.position.set(1.5, 2.5, 2.5); scene.add(warm);
  const c = cam(30); const tDay = at(5, 'day') - start, tNo = at(5, 'no') - start;
  return { scene, camera: c, update(t) {
    m.update(t + 3, (t + 3) * 4); m.setGlow(0.4);
    m.rotation.set(-0.35, Math.sin(t * 0.5) * 0.12, t * 0.05);
    const k = easeOut(range(t, 0, 3.6));
    place(c, [lerp(-0.3, 0.1, k), lerp(1.2, 1.45, k), lerp(2.4, 4.9, k)], [0, lerp(1.1, 1.38, k), 0]);
    const n = Math.round(691200 * easeOut(range(t, 0.15, tDay + 0.1)));
    const nb = range(t, tNo - 0.05, tNo + 0.15);
    return { dof: { focus: c.position.z - 0.1, aperture: 0.0012, maxblur: 0.008 }, bloom: 0.55,
      overlay: ov(`<span style="font-size:96px;${big}font-variant-numeric:tabular-nums">${n.toLocaleString('en-US')}</span><br><span style="font-size:34px;${big}">swings a day</span>`, 130) +
        (nb > 0 ? ov(`<span style="display:inline-block;padding:10px 26px;border:4px solid #fff;border-radius:40px;font-size:34px;${big}transform:scale(${0.7 + 0.3 * easeOut(nb)})">NO BATTERY</span>`, 300, `opacity:${nb}`) : '') };
  } };
}
// ===== G1: a watchmaker's tweezers set a jewel; it starts again =====
function shotG1({ makeStage }) {
  const scene = makeStage({ shadowSize: 4, sunDir: [-3, 6, 3], floorRepeat: 0.55 });
  const w = watch({ strap: 0 }); w.rotation.x = Math.PI / 2; w.position.set(0, 0.26, 0); w.back.visible = false; scene.add(w);
  const mv = w.movement; const J = mv.jewels[5]; J.visible = false;
  const tw = tweezers(); scene.add(tw);
  const j = jewel(0.05); j.scale.setScalar(1.25 * 0.96); scene.add(j);
  const c = cam(30);
  return { scene, camera: c, update(t) {
    scene.updateMatrixWorld(true);
    const tgt = J.getWorldPosition(new THREE.Vector3());
    const d = 1 - easeInOut(range(t, 0.1, 0.95)), up = easeIn(range(t, 1.1, 1.7));
    const placed = t > 1.0;
    j.visible = !placed; J.visible = placed;
    j.position.set(tgt.x + d * 0.5, tgt.y + d * 1.6, tgt.z + d * 0.3); j.rotation.x = -Math.PI / 2;
    const tp = placed ? V(tgt.x + up * 0.8, tgt.y + up * 2.6, tgt.z + up * 0.5) : j.position;
    tw.position.copy(tp); tw.rotation.set(0.25, 0, -0.3);
    const run = Math.max(0, t - 1.25);
    mv.update(run, run * 3); mv.setGlow(placed ? 0.3 + 0.7 * Math.exp(-(t - 1) * 2.5) : 0.2);
    const k = easeInOut(range(t, 0, 2.2));
    place(c, [tgt.x + lerp(0.9, 0.5, k), lerp(2.1, 1.75, k), tgt.z + lerp(2.6, 2.1, k)], [tgt.x * 0.6, 0.35, tgt.z * 0.6]);
    return { dof: { focus: c.position.distanceTo(tgt), aperture: 0.002, maxblur: 0.01 }, bloom: 0.5 };
  } };
}
// ===== G2: ticking again =====
function shotG2({ makeStage }) {
  const scene = makeStage({ look: 'dark', shadowSize: 3, sunDir: [-3, 5, 6], sun: 2.8 });
  const w = watch({ strap: 0.7 }); w.position.set(0, 1.5, 0); scene.add(w);
  const warm = new THREE.PointLight(0xffd9a8, 6, 8); warm.position.set(-2, 3, 3); scene.add(warm);
  const c = cam(30);
  return { scene, camera: c, update(t) {
    w.setSeconds(37 + Math.floor(t * 5) / 5 * 6);
    w.rotation.set(-0.1, lerp(0.45, -0.2, easeInOut(range(t, 0, 2))), 0.05);
    place(c, [0.1, 1.6, lerp(5.6, 4.7, range(t, 0, 2))], [0, 1.5, 0]);
    return { dof: { focus: c.position.z - 0.2, aperture: 0.0009, maxblur: 0.008 }, bloom: 0.5 };
  } };
}
// ===== H: he scans it with his phone; the estimate lands =====
// watch on the open left palm, phone in the right hand just above it
function palmWatch(man, w, t, y = 1.2) {
  man.reach('L', V(0.07, y, 0.4), V(1, -1, -0.3));
  man.aimHand('L', V(-0.35, 0.12, 1), V(0, 1, -0.12));
  man.curl('L', 0.16, 0.2);
  const lp = man.world('L_Hand'), palm = man.palm('L'), along = man.world('L_Finger2').sub(lp).normalize();
  w.position.copy(lp).addScaledVector(along, 0.05).addScaledVector(palm, 0.014);
  const z = palm.clone(), yv = along.clone().addScaledVector(z, -along.dot(z)).normalize(), x = new THREE.Vector3().crossVectors(yv, z);
  w.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, yv, z));
}
function scanPose(man, ph, w, t, smile = 0, lookCam = null) {
  man.reset(); man.armsDown();
  palmWatch(man, w, t);
  man.reach('R', V(-0.1, 1.36, 0.3), V(-1, -0.8, -0.3));
  man.aimHand('R', V(0.55, 0.0, 0.85), V(0.05, 1, -0.4));
  man.curl('R', 0.14, 0.3);
  const rp = man.world('R_Hand'), rpalm = man.palm('R'), rmid = man.world('R_Finger2').sub(rp).normalize();
  ph.position.copy(rp).addScaledVector(rmid, 0.085).addScaledVector(rpalm, 0.009);
  const zAxis = rpalm.clone(), yAxis = rmid.clone().addScaledVector(zAxis, -rmid.dot(zAxis)).normalize(), xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis);
  ph.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis));
  man.look(lookCam || ph.position, 0.85);
  man.face({ blink: blink(t), smile, browUp: smile * 0.7, wide: smile * 0.35, cheek: smile * 0.5 });
}
const cardHtml = (a, pop) => `<div style="position:absolute;left:70px;right:70px;top:300px;transform:scale(${a * pop});opacity:${Math.min(1, a * 1.5)};background:rgba(10,18,22,.93);border:3px solid #27e0c4;border-radius:30px;padding:26px 20px 24px;text-align:center;box-shadow:0 18px 50px rgba(0,0,0,.45)">
  <div style="font-size:26px;font-weight:700;color:#8ff3e3;letter-spacing:1px">ESTIMATED RESALE</div>
  <div style="font-size:92px;font-weight:700;line-height:1.15">$60 – $150</div>
  <div style="margin-top:8px"><span style="display:inline-block;background:rgba(39,224,196,.16);border-radius:30px;padding:8px 20px;font-size:23px;font-weight:700;color:#d9fff9;margin:0 5px">Not running</span><span style="display:inline-block;background:rgba(39,224,196,.16);border-radius:30px;padding:8px 20px;font-size:23px;font-weight:700;color:#d9fff9;margin:0 5px">Demand: steady</span></div>
  <div style="margin-top:14px;font-size:19px;font-weight:700;color:rgba(255,255,255,.6)">AI estimate · not an appraisal</div></div>`;
function shotH1({ makeStage }) {
  const scene = makeStage({ shadowSize: 2.2, sunDir: [-2.5, 5, 3.5] });
  const man = makeRealHuman(); scene.add(man.root);
  const ph = phone(); scene.add(ph);
  const w = watch({ strap: 0.12 }); w.scale.setScalar(WS); scene.add(w);
  const beam = scanBeam(); scene.add(beam);
  const tl = new THREE.PointLight(0x27e0c4, 0, 0.4); scene.add(tl);
  const c = cam(36);
  return { scene, camera: c, update(t) {
    scanPose(man, ph, w, t);
    const k = easeInOut(range(t, 0, 1.9));
    place(c, [lerp(0.38, 0.22, k), lerp(1.5, 1.44, k), lerp(1.25, 0.92, k)], [0.0, lerp(1.34, 1.27, k), 0.38]);
    const s = range(t, 0.3, 1.8), on = s > 0 && s < 1 ? 1 : 0;
    beam.visible = !!on; beam.quaternion.copy(w.quaternion); beam.scale.set(0.085, 0.03, 1);
    const yv = V(0, 1, 0).applyQuaternion(w.quaternion), zv = V(0, 0, 1).applyQuaternion(w.quaternion);
    beam.position.copy(w.position).addScaledVector(yv, lerp(-0.04, 0.04, (s * 2) % 1)).addScaledVector(zv, 0.012);
    tl.position.copy(w.position).addScaledVector(zv, 0.05); tl.intensity = 0;
    return { dof: { focus: c.position.distanceTo(w.position), aperture: 0.003, maxblur: 0.009 }, bloom: 0.45 };
  } };
}
function shotH2({ makeStage }, start) {
  const scene = makeStage({ shadowSize: 2.2, sunDir: [-2.5, 5, 3.5] });
  const man = makeRealHuman(); scene.add(man.root);
  const ph = phone(); scene.add(ph);
  const w = watch({ strap: 0.12 }); w.scale.setScalar(WS); scene.add(w);
  const c = cam(36); const tV = at(7, 'sixty') - start;
  return { scene, camera: c, update(t) {
    const sm = smooth(range(t, tV, tV + 0.8)) * 0.9;
    scanPose(man, ph, w, t + 2, sm);
    const k = easeOut(range(t, 0, 3.4));
    place(c, [lerp(0.16, 0.1, k), 1.5, lerp(1.5, 1.38, k)], [0, 1.36, 0.2]);
    const a = easeOut(range(t, 0.05, 0.4)), pop = 1 + 0.06 * Math.sin(clamp((t - tV) / 0.3) * Math.PI);
    return { dof: { focus: c.position.distanceTo(man.world('Head')), aperture: 0.0012, maxblur: 0.006 }, bloom: 0.4, overlay: cardHtml(a, pop) };
  } };
}
// ===== I: he keeps it =====
function shotI({ makeStage }) {
  const scene = makeStage({ shadowSize: 2.2, sunDir: [-2.5, 5, 3.5] });
  const man = makeRealHuman(); man.root.rotation.y = 0.1; scene.add(man.root);
  const w = watch({ strap: 0.12 }); w.scale.setScalar(WS); scene.add(w);
  const c = cam(32);
  return { scene, camera: c, update(t) {
    man.reset(); man.armsDown();
    palmWatch(man, w, t, 1.34);
    w.setSeconds(37 + Math.floor(t * 5) / 5 * 6);
    const k = easeInOut(range(t, 0, 4.5));
    place(c, [lerp(-0.22, -0.12, k), 1.54, lerp(1.35, 1.12, k)], [0.02, 1.47, 0.2]);
    const lc = smooth(range(t, 1.7, 2.2));
    man.look(w.position.clone().lerp(c.position, lc), 0.85); man.face({ blink: blink(t), smile: 0.6 + 0.35 * lc, cheek: 0.6, browUp: 0.3, squint: 0.2 * lc });
    const a = range(t, 0.1, 0.5);
    return { dof: { focus: c.position.distanceTo(man.world('Head')), aperture: 0.0016, maxblur: 0.007 }, bloom: 0.35,
      overlay: ov(`<span style="font-size:58px;${big}">Scan For Worth</span>`, 90, `opacity:${a}`) + ov('AI estimates · not appraisals', 166, `font-size:22px;font-weight:500;opacity:${a * 0.85};text-shadow:0 2px 8px rgba(0,0,0,.7)`) };
  } };
}

const cuts = [
  [0, shotA1], [at(0, 'you', 1) - 0.08, shotA2], [L(1) - 0.05, shotB], [L(2), shotC], [L(3) - 0.05, shotD], [L(4) - 0.05, shotE],
  [L(5) - 0.05, shotF], [L(6) - 0.05, shotG1], [at(6, 'and') - 0.08, shotG2], [L(7) - 0.05, shotH1], [at(7, 'estimated') - 0.1, shotH2], [L(8) - 0.05, shotI],
];
export const SHOTS = cuts.map(([start, fn], i) => ({ start, end: i + 1 < cuts.length ? cuts[i + 1][0] : DURATION, build: ctx => fn(ctx, start) }));
