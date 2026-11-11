// "Rubies in a dead watch" - a 40 s test short. The edit follows the voice: shot boundaries come from timing.js.
import * as THREE from 'three';
import { makeRealHuman } from './realhuman.js';
import { watch, movement, pivotDemo, bin, tweezers, scanBeam, glow, jewel } from './watch.js';
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

// Cinematography rule for this engine: the object is the hero and is always the sharp thing in frame. The person is
// only ever a hand at the frame edge or a soft, out-of-focus figure behind it; never a full, sharp body or face.
// He grips the strap in a closed fist; the watch hangs below it.
// SYNC: the hand moves first (a slow sway, a small tremor, a lift) and the watch is a real pendulum hung from the
// fist: its swing and strap twist are simulated from the hand's own acceleration, so the watch only moves because
// the hand did, a beat later. Everything is integrated from a fixed start, so a frame depends only on t.
const HANG = 0.084;                                  // fist to watch centre (m)
function handPath(base, lift = 0, liftAt = 0) {
  return t => [
    base.x + 0.011 * Math.sin(0.9 * t) + 0.003 * Math.sin(2.7 * t + 1.1),
    base.y + 0.005 * Math.sin(1.3 * t + 0.5) + lift * easeInOut(range(t, liftAt, liftAt + 0.7)),
    base.z + 0.007 * Math.sin(0.7 * t + 2.0) + 0.002 * Math.sin(3.1 * t),
  ];
}
const wristRoll = t => 0.13 * Math.sin(0.9 * t + 0.6) + 0.03 * Math.sin(2.2 * t);
// damped, driven pendulum (x and z swing) + strap twist; returns the state at time t
function pendulum(path, t, t0 = -2) {
  const dt = 1 / 300, g = 9.81, c = 1.6, kT = 14, cT = 1.4;
  let ax = 0, vx = 0, az = 0, vz = 0, tw = 0, vt = 0;
  const acc = (tt, i) => (path(tt + dt)[i] - 2 * path(tt)[i] + path(tt - dt)[i]) / (dt * dt);
  for (let tt = t0; tt < t; tt += dt) {
    vx += (-(g / HANG) * Math.sin(ax) - c * vx - acc(tt, 0) * Math.cos(ax) / HANG) * dt; ax += vx * dt;
    vz += (-(g / HANG) * Math.sin(az) - c * vz - acc(tt, 2) * Math.cos(az) / HANG) * dt; az += vz * dt;
    vt += (-kT * (tw - wristRoll(tt)) - cT * vt) * dt; tw += vt * dt;
  }
  return { ax, vx, az, vz, tw, vt };
}
function dangle(man, wrist, t, { open = 0, lean = 0.35, roll = wristRoll(t) } = {}) {
  man.reset(); man.armsDown(0.1, 0.2); man.lean(lean, 0, 0);
  man.reach('R', wrist, V(-1, -0.3, -0.7));
  const q = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), roll);
  man.aimHand('R', V(0.1, -0.35, 1).applyQuaternion(q), V(0.15, -1, -0.25).applyQuaternion(q));
  man.curl('R', 0.95 - open * 0.85, 0.85 - open * 0.75);
  man.face({ blink: blink(t) });
  return man.grip('R');
}
const _qs = new THREE.Quaternion(), _qy = new THREE.Quaternion(), _e = new THREE.Euler();
function hangWatch(w, grip, st, yaw0 = 0.12) {
  _qs.setFromEuler(_e.set(-st.az, 0, st.ax));          // swing: +x swing turns about z, +z swing about -x
  _qy.setFromAxisAngle(V(0, 1, 0), yaw0 + st.tw);       // strap twist follows the wrist roll
  w.quaternion.copy(_qs).multiply(_qy);
  w.position.copy(grip).add(V(0, -HANG, 0).applyQuaternion(_qs));
}

// ===== A1: low by the bin, in lamp light. He lifts it; the watch swings from his fist =====
const A_BASE = V(-0.3, 0.8, 0.52), A_PATH = handPath(A_BASE, 0.018, 0.1);
function shotA1({ makeStage }) {
  const scene = makeStage({ look: 'lamp', shadowSize: 2.2, sunDir: [-2.2, 4, 3.2], sun: 2.8 });
  const man = makeRealHuman(); man.root.rotation.y = 0.12; scene.add(man.root);
  const b = bin(); b.position.set(-0.3, 0, 0.56); scene.add(b);
  const w = watch(); w.scale.setScalar(WS); scene.add(w);
  const c = cam(40);
  return { scene, camera: c, update(t) {
    const P = A_PATH(t), grip = dangle(man, V(...P), t);
    hangWatch(w, grip, pendulum(A_PATH, t));
    const wp = w.position;
    const k = easeInOut(range(t, 0, 2.3)), s = shake(t, 0.35);
    place(c, [wp.x + lerp(0.2, 0.06, k) + s[0], wp.y + lerp(-0.1, -0.03, k) + s[1], wp.z + lerp(0.62, 0.34, k)], [wp.x, wp.y + lerp(-0.05, -0.02, k) + 0.03, wp.z]);
    return { dof: { focus: c.position.distanceTo(wp), aperture: 0.02, maxblur: 0.02 }, bloom: 0.35, exposure: 1.15 };
  } };
}
// ===== A2: macro on the swinging watch; the rubies glow through the dial =====
function shotA2({ makeStage }, start) {
  const scene = makeStage({ look: 'lamp', shadowSize: 2.2, sunDir: [-2.2, 4, 3.2], sun: 2.8 });
  const man = makeRealHuman(); man.root.rotation.y = 0.12; scene.add(man.root);
  const b = bin(); b.position.set(-0.3, 0, 0.56); scene.add(b);
  const w = watch(); w.scale.setScalar(WS); scene.add(w);
  const light = new THREE.PointLight(0xff2040, 0, 0.5); scene.add(light);
  const c = cam(30); const tR = at(0, 'seventeen') - start;
  return { scene, camera: c, update(t) {
    const T = t + start, P = A_PATH(T), grip = dangle(man, V(...P), T);
    hangWatch(w, grip, pendulum(A_PATH, T));
    const x = smooth(range(t, tR - 0.15, tR + 0.3));
    w.xray(x); w.movement.update(0);
    light.position.copy(w.position).add(V(0, 0, 0.04)); light.intensity = x * 0.015;
    const k = easeOut(range(t, 0, 2.2)), wp = w.position;
    // the camera rides with the watch, slightly behind its swing (a handheld operator following it)
    place(c, [wp.x + lerp(0.045, 0.015, k), wp.y - 0.004, wp.z + lerp(0.2, 0.15, k)], [wp.x, wp.y - 0.006, wp.z]);
    return { dof: { focus: c.position.distanceTo(wp), aperture: 0.02, maxblur: 0.018 }, bloom: 0.3 + x * 0.15, exposure: 1.15 };
  } };
}
// ===== B: from inside the bin, looking up; the watch is sharp, he is soft; he lets go =====
const B_PATH = handPath(V(-0.02, 0.56, 0.5));
function shotB({ makeStage }, start) {
  const scene = makeStage({ look: 'lamp', shadowSize: 2.2, sunDir: [-1.5, 5, 1.5], sun: 2.6 });
  const man = makeRealHuman(); man.root.position.set(0.05, 0, -0.05); scene.add(man.root);
  const b = bin(true); b.position.set(0, 0, 0.5); scene.add(b);
  const w = watch(); w.scale.setScalar(WS); scene.add(w);
  const fill = new THREE.PointLight(0xffd6b0, 0.12, 0.4); fill.position.set(0, 0.12, 0.5); scene.add(fill);
  // the room's lamp, high behind him: rims his hair and shoulders and catches the bin's lip so we read 'inside the bin'
  const top = new THREE.SpotLight(0xffc48a, 22, 6, 0.6, 0.7, 1.4); top.position.set(0.7, 2.7, -0.6); top.target.position.set(0, 0.4, 0.5); scene.add(top, top.target);
  const lip = new THREE.PointLight(0xffd6b0, 0.5, 0.5); lip.position.set(-0.12, 0.33, 0.62); scene.add(lip);
  const c = cam(66); const tD = at(1, 'scrap') - start;
  return { scene, camera: c, update(t) {
    const fall = Math.max(0, t - tD);
    const open = smooth(range(t, tD - 0.08, tD + 0.15));
    // the hand rises a little once the weight is gone
    const P = B_PATH(t); P[1] += 0.012 * easeOut(range(t, tD, tD + 0.35));
    const grip = dangle(man, V(...P), t, { open, lean: 0.95 });
    man.look(V(0, 0.05, 0.5), 0.8);
    const tr = Math.min(t, tD), st = pendulum(B_PATH, tr);
    const g0 = fall > 0 ? dangle(man, V(...B_PATH(tD)), tD) : grip;
    hangWatch(w, g0, st, 1.0);
    if (fall > 0) {
      // released: carry on with the swing velocity it had, fall, and tumble
      man.reset(); dangle(man, V(...P), t, { open, lean: 0.95 }); man.look(V(0, 0.05, 0.5), 0.8);
      const v = V(st.vx * HANG, 0, st.vz * HANG);
      w.position.addScaledVector(v, fall).add(V(0, -4.9 * fall * fall, 0));
      w.rotateX(smooth(range(fall, 0, 0.45)) * 1.2); w.rotateZ(fall * 2.2 + st.vx * fall * 0.3);
    }
    c.position.set(Math.sin(t * 0.9) * 0.006, 0.03, 0.5); c.up.set(0, 0, 1); c.lookAt(0.005, 1, 0.53);
    return { dof: { focus: Math.max(0.1, w.position.y - 0.045), aperture: 0.09, maxblur: 0.03 }, bloom: 0.3, exposure: 1.45 };
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
  const scene = lampStage(makeStage);
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
// ===== H: the phone's view, on the watchmaker's desk under the same warm lamp as the rest of the film =====
// Visual language is the film's own: white bold type, gold accents (the watch's gold and the rubies' red), no app UI
// colours. The price lands as a rolling counter, like the "691,200" shot.
const GOLD = '#f3c768';
const deskWatch = (scene, strap = 0.0) => { const w = watch({ strap }); w.rotation.x = -Math.PI / 2; w.rotation.z = 0.35; w.position.set(0, 0.3, 0); scene.add(w); return w; };
const corner = (x, y, sx, sy, a) => `<div style="position:absolute;left:${x}px;top:${y}px;width:60px;height:60px;border:3px solid rgba(255,244,220,.92);border-${sx}:none;border-${sy}:none;opacity:${a};box-shadow:0 0 12px rgba(243,199,104,.35)"></div>`;
const finder = (a, g = 0) => corner(110 - g, 380 - g, 'right', 'bottom', a) + corner(550 + g, 380 - g, 'left', 'bottom', a) + corner(110 - g, 840 + g, 'right', 'top', a) + corner(550 + g, 840 + g, 'left', 'top', a);
const pill = (txt, k) => `<span style="display:inline-block;padding:9px 24px;border:3px solid ${GOLD};color:${GOLD};border-radius:40px;font-size:28px;${big}letter-spacing:1px;transform:scale(${0.7 + 0.3 * easeOut(k)});opacity:${k}">${txt}</span>`;
function lampStage(makeStage) {
  const scene = makeStage({ look: 'desk', shadowSize: 3.5, sunDir: [-2.4, 5, 2.2], sun: 2.6, floorRepeat: 1.2 });
  const pool = new THREE.SpotLight(0xffd29a, 42, 14, 0.42, 0.85, 1.6); pool.position.set(-1.4, 6, 1.8); pool.target.position.set(0, 0.3, 0); pool.castShadow = true; pool.shadow.mapSize.set(2048, 2048); pool.shadow.bias = -0.0003;
  scene.add(pool, pool.target);
  return scene;
}
function shotH1({ makeStage }) {
  const scene = lampStage(makeStage);
  const w = deskWatch(scene);
  const beam = scanBeam(); beam.material.color = new THREE.Color(0xffd27a); beam.rotation.x = -Math.PI / 2; beam.scale.set(3.4, 0.7, 1); scene.add(beam);
  const tl = new THREE.PointLight(0xffd27a, 0, 3); scene.add(tl);
  const c = cam(30);
  return { scene, camera: c, update(t) {
    const k = easeInOut(range(t, 0, 1.9)), s = shake(t, 1.2);
    place(c, [lerp(0.9, 0.5, k) + s[0] * 4, lerp(8.6, 7.4, k), lerp(4.2, 3.4, k) + s[1] * 4], [0, 0.2, -0.2]);
    const sc = range(t, 0.3, 1.85), z = lerp(-1.6, 1.6, (sc * 2) % 1), on = sc > 0 && sc < 1;
    beam.visible = on; beam.position.set(0, 0.62, z); tl.position.set(0, 0.9, z); tl.intensity = on ? 0.8 : 0;
    const a = range(t, 0.05, 0.3), dots = '.'.repeat(1 + Math.floor(t * 3) % 3);
    return { dof: { focus: c.position.distanceTo(w.position), aperture: 0.0012, maxblur: 0.008 }, bloom: 0.35, exposure: 0.82,
      overlay: finder(a, 10 * (1 - easeOut(a))) + ov(`SCANNING${dots}`, 300, `font-size:26px;${big}letter-spacing:4px;color:${GOLD};opacity:${a}`) };
  } };
}
function shotH2({ makeStage }, start) {
  const scene = lampStage(makeStage);
  const w = deskWatch(scene);
  // a glint of light slides across the crystal as the price lands (product-shot move)
  const glint = new THREE.PointLight(0xfff0d0, 0, 2.5); scene.add(glint);
  const c = cam(30); const tV = at(7, 'sixty') - start, tF = at(7, 'fifty') - start;
  return { scene, camera: c, update(t) {
    const k = easeOut(range(t, 0, 3.6));
    place(c, [lerp(0.6, 0.15, k), lerp(5.2, 4.2, k), lerp(4.0, 3.6, k)], [0, 0.3, lerp(-0.1, -0.5, k)]);
    const gk = range(t, tV - 0.1, tV + 0.9); glint.position.set(lerp(-1.6, 1.6, gk), 1.1, 0.4); glint.intensity = Math.sin(gk * Math.PI) * 2.2;
    const lo = Math.round(60 * easeOut(range(t, 0.1, tV))), hi = Math.round(150 * easeOut(range(t, 0.1, tF + 0.1)));
    const a = range(t, 0.05, 0.35), nr = range(t, tF + 0.2, tF + 0.45);
    return { dof: { focus: c.position.distanceTo(w.position), aperture: 0.0016, maxblur: 0.009 }, bloom: 0.4, exposure: 0.82,
      overlay: ov(`<div style="font-size:24px;${big}letter-spacing:5px;color:${GOLD};opacity:${a}">ESTIMATED RESALE</div><div style="font-size:112px;${big}font-variant-numeric:tabular-nums;opacity:${a}">$${lo}–$${hi}</div>`, 110) +
        ov(pill('NOT RUNNING', nr), 300) + ov('AI estimate · not an appraisal', 372, `font-size:20px;font-weight:600;opacity:${nr * 0.8};text-shadow:0 2px 8px rgba(0,0,0,.8)`) };
  } };
}
// ===== I: it stays on the desk, ticking again; the camera settles at desk level =====
function shotI({ makeStage }) {
  const scene = lampStage(makeStage);
  const w = deskWatch(scene, 0.75); w.rotation.set(-0.5, 0.35, 0); w.position.set(0, 1.05, 0);
  const c = cam(30);
  return { scene, camera: c, update(t) {
    w.setSeconds(37 + Math.floor(t * 5) / 5 * 6);
    const k = easeInOut(range(t, 0, 4.8)), ang = lerp(-0.45, 0.25, k);
    place(c, [Math.sin(ang) * lerp(8.2, 7.2, k), lerp(1.7, 1.5, k), Math.cos(ang) * lerp(8.2, 7.2, k)], [0, 2.15, 0]);
    const a = range(t, 0.1, 0.5);
    return { dof: { focus: c.position.distanceTo(w.position), aperture: 0.004, maxblur: 0.012 }, bloom: 0.4, exposure: 0.82,
      overlay: ov(`<span style="font-size:58px;${big}">Scan For Worth</span>`, 96, `opacity:${a}`) + ov(`<span style="letter-spacing:3px">AI ESTIMATES · NOT APPRAISALS</span>`, 172, `font-size:18px;font-weight:700;color:${GOLD};opacity:${a * 0.9};text-shadow:0 2px 8px rgba(0,0,0,.7)`) };
  } };
}

const cuts = [
  [0, shotA1], [at(0, 'you', 1) - 0.08, shotA2], [L(1) - 0.05, shotB], [L(2), shotC], [L(3) - 0.05, shotD], [L(4) - 0.05, shotE],
  [L(5) - 0.05, shotF], [L(6) - 0.05, shotG1], [at(6, 'and') - 0.08, shotG2], [L(7) - 0.05, shotH1], [at(7, 'estimated') - 0.1, shotH2], [L(8) - 0.05, shotI],
];
export const SHOTS = cuts.map(([start, fn], i) => ({ start, end: i + 1 < cuts.length ? cuts[i + 1][0] : DURATION, build: ctx => fn(ctx, start) }));
