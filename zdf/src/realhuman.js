// A realistic rigged person posed in code (no baked animation). Model: Microsoft Rocketbox avatar (3ds Max Biped
// skeleton, ARKit face shapes). Every helper works from bone positions, so it does not depend on bone axes.
//   const h = makeRealHuman(); scene.add(h.root);
//   each frame: h.reset(); h.armsDown(); h.reach('R', worldPoint, pole); h.aimHand('R', dir, palm); h.curl('R', 0.8);
//               h.look(worldPoint); h.face({ smile: 0.6, jaw: 0.1, blink: 0, browUp: 0.3 });
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { ASSETS } from './assets.js';

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), _pq = new THREE.Quaternion(), _bq = new THREE.Quaternion();
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const FACE = {
  smile: ['AK_44_MouthSmileLeft', 'AK_45_MouthSmileRight'], jaw: ['AK_25_JawOpen'], blink: ['AK_09_EyeBlinkLeft', 'AK_10_EyeBlinkRight'],
  browUp: ['AK_03_BrowInnerUp', 'AK_04_BrowOuterUpLeft', 'AK_05_BrowOuterUpRight'], browDown: ['AK_01_BrowDownLeft', 'AK_02_BrowDownRight'],
  wide: ['AK_21_EyeWideLeft', 'AK_22_EyeWideRight'], squint: ['AK_19_EyeSquintLeft', 'AK_20_EyeSquintRight'], cheek: ['AK_07_CheekSquintLeft', 'AK_08_CheekSquintRight'],
  frown: ['AK_30_MouthFrownLeft', 'AK_31_MouthFrownRight'], pucker: ['AK_38_MouthPucker'], press: ['AK_36_MouthPressLeft', 'AK_37_MouthPressRight'],
  lookDown: ['AK_11_EyeLookDownLeft', 'AK_12_EyeLookDownRight'], lookUp: ['AK_17_EyeLookUpLeft', 'AK_18_EyeLookUpRight'],
};
let MATS = null;
function mats() {
  if (MATS) return MATS;
  const T = ASSETS.tex;
  MATS = {
    body: new THREE.MeshStandardMaterial({ map: T.body_color, normalMap: T.body_normal, roughness: 0.78, metalness: 0, envMapIntensity: 0.7 }),
    head: new THREE.MeshPhysicalMaterial({ map: T.head_color, normalMap: T.head_normal, roughness: 0.52, metalness: 0, sheen: 0.35, sheenColor: new THREE.Color(0xffb9a0), sheenRoughness: 0.5, envMapIntensity: 0.75 }),
    opacity: new THREE.MeshStandardMaterial({ map: T.opacity_color, alphaTest: 0.35, transparent: false, side: THREE.DoubleSide, roughness: 0.6, envMapIntensity: 0.6 }),
  };
  return MATS;
}

export function makeRealHuman() {
  const root = new THREE.Group();
  const model = cloneSkinned(ASSETS.human); model.scale.setScalar(0.01); root.add(model);
  const B = {}; let mesh = null;
  model.traverse(o => {
    if (o.isBone) B[o.name.replace('Bip01_', '')] = o;
    if (o.isMesh) {
      mesh = o; o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
      const M = mats();
      o.material = [].concat(o.material).map(m => /head/.test(m.name) ? M.head : /opacity/.test(m.name) ? M.opacity : M.body);
    }
  });
  const dict = {}; for (const k in mesh.morphTargetDictionary) dict[k.replace('blendShape1.', '')] = mesh.morphTargetDictionary[k];
  const rest = {}; for (const k in B) rest[k] = B[k].quaternion.clone();
  const sync = () => root.updateMatrixWorld(true);
  const wpos = (b, v = new THREE.Vector3()) => b.getWorldPosition(v);
  function applyWorld(bone, q) { // pre-multiply a world-space rotation onto the bone
    bone.getWorldQuaternion(_bq); bone.parent.getWorldQuaternion(_pq);
    bone.quaternion.copy(_pq.invert().multiply(q).multiply(_bq));
  }
  function aim(bone, child, dir) {
    sync(); wpos(bone, _a); wpos(child, _b);
    applyWorld(bone, _q.setFromUnitVectors(_b.sub(_a).normalize(), dir.clone().normalize()));
  }
  const side = S => (S === 'L' ? 1 : -1);
  const arm = S => [B[S + '_UpperArm'], B[S + '_Forearm'], B[S + '_Hand']];
  function palmNormal(S) { // points out of the palm
    sync();
    const hnd = wpos(B[S + '_Hand']), i = wpos(B[S + '_Finger1']).sub(hnd), p = wpos(B[S + '_Finger4']).sub(hnd);
    return new THREE.Vector3().crossVectors(i, p).normalize().multiplyScalar(-side(S));
  }
  const h = {
    root, bones: B, mesh, sync,
    reset() { for (const k in B) B[k].quaternion.copy(rest[k]); mesh.morphTargetInfluences.fill(0); },
    armsDown(spread = 0.1, bend = 0.22) {
      const rq = root.getWorldQuaternion(new THREE.Quaternion());
      for (const S of ['L', 'R']) {
        const [up, lo, hand] = arm(S);
        const fwd = V3(0, 0, 1).applyQuaternion(rq), out = V3(side(S), 0, 0).applyQuaternion(rq);
        aim(B[S + '_Clavicle'], up, out.clone().addScaledVector(V3(0, -1, 0), 0.12));
        aim(up, lo, V3(0, -1, 0).addScaledVector(out, spread).addScaledVector(fwd, 0.03));
        aim(lo, hand, V3(0, -1, 0).addScaledVector(out, spread * 0.4).addScaledVector(fwd, bend));
        h.aimHand(S, V3(0, -1, 0).addScaledVector(fwd, bend * 0.9), out.clone().negate());
        h.curl(S, 0.3);
      }
    },
    // two-bone IK: the wrist goes to the world point `target`; the elbow leans towards `pole` (world direction)
    reach(S, target, pole = V3(0, -1, -0.3)) {
      const [up, lo, hand] = arm(S);
      sync();
      const A = wpos(up), Bp = wpos(lo), C = wpos(hand);
      const a = A.distanceTo(Bp), b = Bp.distanceTo(C);
      const D = target.clone().sub(A); const d = Math.min(D.length(), (a + b) * 0.999); const dir = D.normalize();
      const cosA = THREE.MathUtils.clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1), sinA = Math.sqrt(1 - cosA * cosA);
      const p = pole.clone(); p.addScaledVector(dir, -p.dot(dir)).normalize();
      const E = A.clone().addScaledVector(dir, a * cosA).addScaledVector(p, a * sinA);
      aim(up, lo, E.clone().sub(A));
      aim(lo, hand, A.clone().addScaledVector(dir, d).sub(E));
    },
    // point the hand (wrist -> middle knuckle) along `dir` with the palm facing `palm`
    aimHand(S, dir, palm) {
      const hand = B[S + '_Hand'], mid = B[S + '_Finger2'];
      aim(hand, mid, dir);
      if (!palm) return;
      sync(); wpos(hand, _a); wpos(mid, _b);
      const along = _b.sub(_a).normalize();
      const cur = palmNormal(S); cur.addScaledVector(along, -cur.dot(along)).normalize();
      const w = palm.clone(); w.addScaledVector(along, -w.dot(along)); if (w.lengthSq() < 1e-8) return; w.normalize();
      let ang = Math.acos(THREE.MathUtils.clamp(cur.dot(w), -1, 1));
      if (new THREE.Vector3().crossVectors(cur, w).dot(along) < 0) ang = -ang;
      // share the twist with the forearm so the wrist does not pinch
      const lo = B[S + '_Forearm']; wpos(lo, _a); wpos(hand, _b);
      const fa = _b.sub(_a).normalize();
      applyWorld(lo, new THREE.Quaternion().setFromAxisAngle(fa, ang * 0.35 * Math.sign(fa.dot(along) || 1)));
      sync(); aim(hand, mid, dir);
      sync(); wpos(hand, _a); wpos(mid, _b);
      const al2 = _b.sub(_a).normalize();
      const c2 = palmNormal(S); c2.addScaledVector(al2, -c2.dot(al2)).normalize();
      const w2 = palm.clone(); w2.addScaledVector(al2, -w2.dot(al2)).normalize();
      let a2 = Math.acos(THREE.MathUtils.clamp(c2.dot(w2), -1, 1));
      if (new THREE.Vector3().crossVectors(c2, w2).dot(al2) < 0) a2 = -a2;
      applyWorld(hand, new THREE.Quaternion().setFromAxisAngle(al2, a2));
    },
    // finger curl 0 (flat) .. 1 (fist). fingers: array of 1..4 (index..pinky) or null for all; thumb 0..1
    curl(S, k, thumb = k * 0.6, fingers = null) {
      const pn = palmNormal(S);
      for (let f = 1; f <= 4; f++) {
        if (fingers && !fingers.includes(f)) continue;
        for (const [suffix, amt] of [['', 1.05], ['1', 1.3], ['2', 0.9]]) {
          const bn = B[`${S}_Finger${f}${suffix}`]; bn.quaternion.copy(rest[`${S}_Finger${f}${suffix}`]);
        }
        sync();
        const base = B[`${S}_Finger${f}`], d = wpos(B[`${S}_Finger${f}1`]).sub(wpos(base)).normalize();
        const axis = new THREE.Vector3().crossVectors(d, pn).normalize(); // rotating about it bends towards the palm
        for (const [suffix, amt] of [['', 1.05], ['1', 1.3], ['2', 0.9]]) {
          applyWorld(B[`${S}_Finger${f}${suffix}`], new THREE.Quaternion().setFromAxisAngle(axis, k * amt)); sync();
        }
      }
      for (const sfx of ['', '1', '2']) B[`${S}_Finger0${sfx}`].quaternion.copy(rest[`${S}_Finger0${sfx}`]);
      sync();
      const t0 = B[`${S}_Finger0`], td = wpos(B[`${S}_Finger01`]).sub(wpos(t0)).normalize();
      const idx = wpos(B[`${S}_Finger1`]).sub(wpos(B[S + '_Hand'])).normalize();
      const tAxis = new THREE.Vector3().crossVectors(td, idx).normalize(); // swings the thumb towards the index finger
      applyWorld(t0, new THREE.Quaternion().setFromAxisAngle(tAxis, thumb * 0.5)); sync();
      applyWorld(t0, new THREE.Quaternion().setFromAxisAngle(idx, -side(S) * thumb * 0.5)); sync();
      for (const sfx of ['1', '2']) { applyWorld(B[`${S}_Finger0${sfx}`], new THREE.Quaternion().setFromAxisAngle(tAxis, thumb * 0.55)); sync(); }
    },
    // turn head and neck so the face points at a world point; eyes follow
    look(target, weight = 1) {
      sync();
      const head = B.Head;
      const eye = wpos(B.LEye).lerp(wpos(B.REye), 0.5);
      const fwd = wpos(B.MNose).sub(wpos(head)); fwd.y = 0; // rest facing direction (horizontal)
      const up0 = wpos(B.Head).sub(wpos(B.Neck)).normalize();
      fwd.addScaledVector(up0, -fwd.dot(up0)).normalize();
      const want = target.clone().sub(eye).normalize();
      const full = new THREE.Quaternion().setFromUnitVectors(fwd, want);
      for (const [bn, w] of [[B.Neck, 0.3 * weight], [B.Head, 0.55 * weight]]) { sync(); applyWorld(bn, new THREE.Quaternion().slerp(full, w)); }
      for (const e of [B.LEye, B.REye]) { sync(); applyWorld(e, new THREE.Quaternion().slerp(full, 0.12 * weight)); }
    },
    lean(x = 0, y = 0, z = 0) { // bend the spine: x forward, y twist, z sideways (radians, world axes of the root)
      const rq = root.getWorldQuaternion(new THREE.Quaternion());
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(x / 3, y / 3, z / 3, 'YXZ'));
      const wq = rq.clone().multiply(q).multiply(rq.clone().invert());
      for (const n of ['Spine', 'Spine1', 'Spine2']) { sync(); applyWorld(B[n], wq); }
    },
    face(f = {}) {
      for (const k in f) for (const n of FACE[k] || [k]) if (dict[n] != null) mesh.morphTargetInfluences[dict[n]] = f[k];
    },
    world(name) { sync(); return wpos(B[name]); },
    palm(S) { return palmNormal(S); },
    // the point between thumb tip and index tip (where a pinched object sits)
    pinch(S) { sync(); return wpos(B[S + '_Finger02']).lerp(wpos(B[S + '_Finger12']), 0.5); },
  };
  return h;
}
