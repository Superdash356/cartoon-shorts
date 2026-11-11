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
function dangle(man, wrist, t, { open = 0, lean = 0.35 } = {}) {
  man.reset(); man.armsDown(0.1, 0.2); man.lean(lean, 0, 0);
  man.reach('R', wrist, V(-1, -0.3, -0.7));
  man.aimHand('R', V(0.1, -0.35, 1), V(0.15, -1, -0.25));
  man.curl('R', 0.95 - open * 0.85, 0.85 - open * 0.75);
  man.face({ blink: blink(t) });
  return man.grip('R');
}
function hangWatch(w, p, t, drop = 0) {
  const a = Math.sin(t * 2.1) * 0.09;
  w.position.set(p.x + Math.sin(a) * 0.084, p.y - 0.084 * Math.cos(a) - drop, p.z);
  w.rotation.set(0, Math.sin(t * 1.3) * 0.18 + 0.12, -a);
}

// ===== A1: low by the bin. The watch hangs in focus; he is a blur behind it =====
function shotA1({ makeStage }) {
  const scene = makeStage({ shadowSize: 2.2, sunDir: [-2.5, 5, 3.5] });
  const man = makeRealHuman(); man.root.rotation.y = 0.12; scene.add(man.root);
  const b = bin(); b.position.set(-0.3, 0, 0.56); scene.add(b);
  const w = watch(); w.scale.setScalar(WS); scene.add(w);
  const c = cam(40);
  return { scene, camera: c, update(t) {
    const p = dangle(man, V(-0.3, 0.8, 0.52), t);
    hangWatch(w, p, t);
    const wp = V(p.x, p.y - 0.084, p.z);
    const k = easeInOut(range(t, 0, 2.3)), s = shake(t, 0.4);
    place(c, [wp.x + lerp(0.2, 0.06, k) + s[0], wp.y + lerp(-0.1, -0.03, k) + s[1], wp.z + lerp(0.62, 0.34, k)], [wp.x, wp.y + lerp(-0.07, -0.03, k), wp.z]);
    return { dof: { focus: c.position.distanceTo(wp), aperture: 0.02, maxblur: 0.02 }, bloom: 0.35 };
  } };
}
// ===== A2: macro on the dangling watch; the rubies glow through the dial =====
function shotA2({ makeStage }, start) {
  const scene = makeStage({ shadowSize: 2.2, sunDir: [-2.5, 5, 3.5] });
  const man = makeRealHuman(); man.root.rotation.y = 0.12; scene.add(man.root);
  const b = bin(); b.position.set(-0.3, 0, 0.56); scene.add(b);
  const w = watch(); w.scale.setScalar(WS); scene.add(w);
  const light = new THREE.PointLight(0xff2040, 0, 0.5); scene.add(light);
  const c = cam(30); const tR = at(0, 'seventeen') - start;
  return { scene, camera: c, update(t) {
    const T = t + 2.1;
    const p = dangle(man, V(-0.3, 0.8, 0.52), T);
    hangWatch(w, p, T);
    const x = smooth(range(t, tR - 0.15, tR + 0.3));
    w.xray(x); w.movement.update(0);
    light.position.copy(w.position).add(V(0, 0, 0.04)); light.intensity = x * 0.03;
    const k = easeOut(range(t, 0, 2.2));
    const wp = w.position;
    place(c, [wp.x + lerp(0.045, 0.015, k), wp.y - 0.004, wp.z + lerp(0.2, 0.15, k)], [wp.x, wp.y - 0.006, wp.z]);
    return { dof: { focus: c.position.distanceTo(wp), aperture: 0.02, maxblur: 0.018 }, bloom: 0.35 + x * 0.3 };
  } };
}
// ===== B: from inside the bin, looking up; the watch is sharp, he is soft; he lets go =====
function shotB({ makeStage }, start) {
  const scene = makeStage({ shadowSize: 2.2, sunDir: [-2, 6, 2] });
  const man = makeRealHuman(); man.root.position.set(0.05, 0, -0.05); scene.add(man.root);
  const b = bin(true); b.position.set(0, 0, 0.5); scene.add(b);
  const w = watch(); w.scale.setScalar(WS); scene.add(w);
  const fill = new THREE.PointLight(0xfff0e0, 0.12, 3); fill.position.set(0, 0.2, 0.5); scene.add(fill);
  const c = cam(50); const tD = at(1, 'scrap') - start;
  return { scene, camera: c, update(t) {
    const fall = Math.max(0, t - tD);
    const open = smooth(range(t, tD - 0.1, tD + 0.18));
    const p = dangle(man, V(-0.02, 0.56, 0.5), t, { open, lean: 0.95 });
    man.look(V(0, 0.05, 0.5), 0.8);
    const sw = Math.sin(t * 2.1) * 0.09 * (1 - Math.min(1, fall * 3));
    const drop = 0.4 * fall * fall;
    w.position.set(p.x + Math.sin(sw) * 0.084, p.y - 0.084 * Math.cos(sw) - drop, p.z);
    // it hangs edge-on to the camera, then tumbles face-down as it falls
    w.rotation.set(lerp(1.0, Math.PI / 2, smooth(range(fall, 0, 0.4))), 0, Math.sin(t * 1.3) * 0.2 + fall * 1.1);
    c.position.set(Math.sin(t * 0.9) * 0.008, 0.045, 0.5); c.up.set(0, 0, 1); c.lookAt(0.005, 1, 0.53);
    return { dof: { focus: Math.max(0.1, w.position.y - 0.045), aperture: 0.09, maxblur: 0.03 }, bloom: 0.3, exposure: 1.1 };
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
// ===== H: the phone's view. The watch on the table, a scan line, then the estimate =====
const tableWatch = scene => { const w = watch({ strap: 0 }); w.rotation.x = -Math.PI / 2; w.rotation.z = 0.35; w.position.set(0, 0.3, 0); scene.add(w); return w; };
const corner = (x, y, sx, sy, a) => `<div style="position:absolute;left:${x}px;top:${y}px;width:74px;height:74px;border:6px solid #27e0c4;border-${sx}:none;border-${sy}:none;border-radius:${sx === 'right' ? (sy === 'bottom' ? '18px 0 0 0' : '0 0 0 18px') : (sy === 'bottom' ? '0 18px 0 0' : '0 0 18px 0')};opacity:${a}"></div>`;
const finder = (a, g = 0) => corner(96 - g, 360 - g, 'right', 'bottom', a) + corner(550 + g, 360 - g, 'left', 'bottom', a) + corner(96 - g, 840 + g, 'right', 'top', a) + corner(550 + g, 840 + g, 'left', 'top', a);
const cardHtml = (a, pop) => `<div style="position:absolute;left:70px;right:70px;top:120px;transform:scale(${a * pop});opacity:${Math.min(1, a * 1.5)};background:rgba(10,18,22,.93);border:3px solid #27e0c4;border-radius:30px;padding:26px 20px 24px;text-align:center;box-shadow:0 18px 50px rgba(0,0,0,.45)">
  <div style="font-size:26px;font-weight:700;color:#8ff3e3;letter-spacing:1px">ESTIMATED RESALE</div>
  <div style="font-size:92px;font-weight:700;line-height:1.15">$60 – $150</div>
  <div style="margin-top:8px"><span style="display:inline-block;background:rgba(39,224,196,.16);border-radius:30px;padding:8px 20px;font-size:23px;font-weight:700;color:#d9fff9;margin:0 5px">Not running</span><span style="display:inline-block;background:rgba(39,224,196,.16);border-radius:30px;padding:8px 20px;font-size:23px;font-weight:700;color:#d9fff9;margin:0 5px">Demand: steady</span></div>
  <div style="margin-top:14px;font-size:19px;font-weight:700;color:rgba(255,255,255,.6)">AI estimate · not an appraisal</div></div>`;
function shotH1({ makeStage }) {
  const scene = makeStage({ shadowSize: 4, sunDir: [-3, 6, 3], floorRepeat: 0.55, sun: 1.3 });
  const w = tableWatch(scene);
  const beam = scanBeam(); beam.rotation.x = -Math.PI / 2; beam.scale.set(3.4, 0.9, 1); scene.add(beam);
  const tl = new THREE.PointLight(0x27e0c4, 0, 3); scene.add(tl);
  const c = cam(30);
  return { scene, camera: c, update(t) {
    const k = easeInOut(range(t, 0, 1.9)), s = shake(t, 1.2);
    place(c, [lerp(0.9, 0.5, k) + s[0] * 4, lerp(8.6, 7.4, k), lerp(4.2, 3.4, k) + s[1] * 4], [0, 0.2, -0.2]);
    const sc = range(t, 0.3, 1.85), z = lerp(-1.6, 1.6, (sc * 2) % 1), on = sc > 0 && sc < 1;
    beam.visible = on; beam.position.set(0, 0.62, z); tl.position.set(0, 0.9, z); tl.intensity = on ? 0.6 : 0;
    const a = range(t, 0.05, 0.3), dots = '.'.repeat(1 + Math.floor(t * 3) % 3);
    return { dof: { focus: c.position.distanceTo(w.position), aperture: 0.0012, maxblur: 0.008 }, bloom: 0.3, exposure: 0.62,
      overlay: finder(a, 10 * (1 - easeOut(a))) + ov(`Scanning${dots}`, 250, `font-size:34px;font-weight:700;color:#8ff3e3;opacity:${a};text-shadow:0 2px 10px rgba(0,0,0,.6)`) };
  } };
}
function shotH2({ makeStage }, start) {
  const scene = makeStage({ shadowSize: 4, sunDir: [-3, 6, 3], floorRepeat: 0.55, sun: 1.3 });
  const w = tableWatch(scene);
  const c = cam(30); const tV = at(7, 'sixty') - start;
  return { scene, camera: c, update(t) {
    const k = easeOut(range(t, 0, 3.6));
    place(c, [lerp(0.5, 0.2, k), lerp(7.4, 7.0, k), lerp(3.4, 3.7, k)], [0, 0.2, lerp(-0.2, -1.0, k)]);
    const a = easeOut(range(t, 0.05, 0.4)), pop = 1 + 0.06 * Math.sin(clamp((t - tV) / 0.3) * Math.PI);
    return { dof: { focus: c.position.distanceTo(w.position), aperture: 0.0012, maxblur: 0.008 }, bloom: 0.3, exposure: 0.62, overlay: cardHtml(a, pop) };
  } };
}
// ===== I: it stays on the desk, not in the bin =====
function shotI({ makeStage }) {
  const scene = makeStage({ shadowSize: 4, sunDir: [-4, 5, 2], floorRepeat: 0.55, sun: 1.3 });
  const w = tableWatch(scene);
  const warm = new THREE.PointLight(0xffc98a, 5, 12); warm.position.set(-3, 2.5, 2); scene.add(warm);
  const c = cam(30);
  return { scene, camera: c, update(t) {
    const k = easeInOut(range(t, 0, 4.8)), ang = lerp(-0.5, 0.35, k);
    place(c, [Math.sin(ang) * 5.2, lerp(3.2, 4.2, k), Math.cos(ang) * 5.2], [0, 0.3, 0]);
    const a = range(t, 0.1, 0.5);
    return { dof: { focus: c.position.distanceTo(w.position), aperture: 0.003, maxblur: 0.01 }, bloom: 0.3, exposure: 0.66,
      overlay: ov(`<span style="font-size:58px;${big}">Scan For Worth</span>`, 96, `opacity:${a}`) + ov('AI estimates · not appraisals', 172, `font-size:22px;font-weight:500;opacity:${a * 0.85};text-shadow:0 2px 8px rgba(0,0,0,.7)`) };
  } };
}

const cuts = [
  [0, shotA1], [at(0, 'you', 1) - 0.08, shotA2], [L(1) - 0.05, shotB], [L(2), shotC], [L(3) - 0.05, shotD], [L(4) - 0.05, shotE],
  [L(5) - 0.05, shotF], [L(6) - 0.05, shotG1], [at(6, 'and') - 0.08, shotG2], [L(7) - 0.05, shotH1], [at(7, 'estimated') - 0.1, shotH2], [L(8) - 0.05, shotI],
];
export const SHOTS = cuts.map(([start, fn], i) => ({ start, end: i + 1 < cuts.length ? cuts[i + 1][0] : DURATION, build: ctx => fn(ctx, start) }));
