import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SHOTS, CAPTIONS, DURATION, FADES } from './shots.js';
import { ASSETS, loadAssets } from './assets.js';
import { plankTexture } from './textures.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const W = 720, H = 1280;
const qs0 = new URLSearchParams(location.search);
const DPR = Number(qs0.get('dpr') || 1); // 1 = 720x1280, 1.5 = 1080x1920
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(DPR);
renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').prepend(renderer.domElement);

// ---------- shared environment (reflections for the metal) ----------
const SKY_FRAG = `
  uniform vec3 top, mid, horizon, floorC; varying vec3 vDir;
  void main(){
    vec3 d = normalize(vDir);
    float y = d.y;
    vec3 c = y > 0.0 ? mix(mix(horizon, mid, smoothstep(0.0,0.12,y)), top, smoothstep(0.1,0.8,y))
                     : mix(horizon, floorC, smoothstep(0.0,-0.08,y));
    gl_FragColor = vec4(c,1.0);
    #include <colorspace_fragment>
  }`;
export function skyMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      top: { value: new THREE.Color(0x2b78d6) }, mid: { value: new THREE.Color(0x5b9fea) },
      horizon: { value: new THREE.Color(0x92c3f2) }, floorC: { value: new THREE.Color(0xa9cdf1) },
    },
    vertexShader: `varying vec3 vDir; void main(){ vDir = (modelMatrix*vec4(position,1.)).xyz - cameraPosition; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position.z = gl_Position.w; }`,
    fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, toneMapped: false,
  });
}
const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene();
{
  const s = new THREE.Mesh(new THREE.SphereGeometry(20, 64, 32), skyMaterial());
  s.material.toneMapped = true; envScene.add(s);
  const u = s.material.uniforms;
  u.top.value.set(0x9aa6b6); u.mid.value.set(0xb7c2cf); u.horizon.value.set(0xe2e6ea); u.floorC.value.set(0x5c6066);
  const panel = (w, h, pos, inten) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(inten, inten, inten), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); envScene.add(m);
  };
  panel(8, 4, [-6, 8, 6], 3.2);   // key softbox
  panel(4, 10, [9, 3, -2], 1.6); // rim strip
  panel(10, 3, [0, 4, -9], 1.0);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: 0x7d8fa6 }));
  fl.rotation.x = -Math.PI / 2; fl.position.y = -1.2; fl.material.color.set(0x55595f); envScene.add(fl);
}
const envTex = pmrem.fromScene(envScene, 0.02).texture;

let hdrEnv = null, studioEnv = null;
const SKIES = {
  blue: [0x2b78d6, 0x5b9fea, 0x92c3f2, 0xa9cdf1],
  dark: [0x05070c, 0x0b1220, 0x16233a, 0x0a0f18],
  warm: [0x6f5a48, 0x9a8068, 0xc9b199, 0x8a745f],
  lamp: [0x3a2b20, 0x2a2018, 0x221a14, 0x120e0b],
};
// look: 'room' (daylight room), 'lamp' (the same room at night under one warm lamp: low-key, hides CG flaws),
//       'desk' (dark walnut workbench under the lamp, for table-top macros), 'dark' (macro studio) or 'blue' (open sky)
export function makeStage({ shadowSize = 3, sunDir = [-3, 6, 4], sun = 2.3, look = 'room', floorY = 0, floorRepeat = 5, keyColor = null, rimColor = null, env = 'hdr' } = {}) {
  const scene = new THREE.Scene();
  if (!hdrEnv && ASSETS.hdr) hdrEnv = pmrem.fromEquirectangular(ASSETS.hdr).texture;
  // env 'studio': dark room with a few soft boxes - black glossy things (vinyl, lacquer) stay black with crisp highlights
  if (env === 'studio' && !studioEnv) studioEnv = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env === 'studio' ? studioEnv : (hdrEnv || envTex);
  scene.environmentIntensity = { dark: 0.55, lamp: 0.22, desk: 0.3 }[look] ?? 0.8;
  const sky = new THREE.Mesh(new THREE.SphereGeometry(80, 48, 24), skyMaterial());
  const cols = SKIES[look === 'room' ? 'warm' : look === 'desk' ? 'lamp' : look];
  ['top', 'mid', 'horizon', 'floorC'].forEach((k, i) => sky.material.uniforms[k].value.set(cols[i]));
  sky.frustumCulled = false; sky.renderOrder = -10;
  scene.add(sky); scene.userData.sky = sky;
  const lowKey = look === 'lamp' || look === 'desk';
  if (look === 'room' || look === 'lamp') {
    const wt = plankTexture(); wt.repeat.set(floorRepeat, floorRepeat);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshStandardMaterial({ map: wt, color: look === 'lamp' ? 0x9c8068 : 0xffffff, roughness: 0.38, metalness: 0 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = floorY; floor.receiveShadow = true; scene.add(floor);
    const wallM = new THREE.MeshStandardMaterial({ color: look === 'lamp' ? 0x6b5848 : 0xd9d2c4, roughness: 0.95 });
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(24, 6), wallM); wall.position.set(0, 3 + floorY, -3.2); wall.receiveShadow = true; scene.add(wall);
    const wall2 = new THREE.Mesh(new THREE.PlaneGeometry(24, 6), wallM); wall2.position.set(4.5, 3 + floorY, 0); wall2.rotation.y = -Math.PI / 2; wall2.receiveShadow = true; scene.add(wall2);
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(24, 0.11, 0.025), new THREE.MeshStandardMaterial({ color: 0xf2efe8, roughness: 0.6 })); skirt.position.set(0, 0.055 + floorY, -3.19); scene.add(skirt);
  } else if (look === 'desk') {
    const wt = plankTexture(9); wt.repeat.set(floorRepeat * 0.3, floorRepeat * 0.1);
    const desk = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshPhysicalMaterial({ map: wt, color: 0x6a4a32, roughness: 0.55, envMapIntensity: 0.15 }));
    desk.rotation.x = -Math.PI / 2; desk.position.y = floorY; desk.receiveShadow = true; scene.add(desk);
  } else {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ color: 0x000814, opacity: look === 'dark' ? 0.5 : 0.32 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = floorY; ground.receiveShadow = true; scene.add(ground);
  }
  const hemi = new THREE.HemisphereLight(look === 'room' || lowKey ? 0xfff1df : 0xcfe4ff, look === 'room' || lowKey ? 0x5a4636 : 0x7f93ad, lowKey ? 0.1 : look === 'dark' ? 0.25 : 0.55); scene.add(hemi);
  const key = new THREE.DirectionalLight(lowKey ? 0xffc48a : look === 'room' ? 0xffe9d2 : 0xfff3e6, sun);
  if (keyColor !== null) key.color.set(keyColor);
  key.position.set(...sunDir); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const c = key.shadow.camera; c.left = c.bottom = -shadowSize; c.right = c.top = shadowSize; c.near = 0.5; c.far = 30;
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 5;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(look === 'lamp' ? 0x9fc2ff : look === 'desk' ? 0xffe2c4 : 0xdbe9ff, lowKey ? 2.2 : look === 'dark' ? 1.6 : 0.9); rim.position.set(4, 3, -5); if (rimColor !== null) rim.color.set(rimColor); scene.add(rim);
  if (lowKey) { // a second, warmer kicker from behind-left: separates skin and metal from the dark background
    const kick = new THREE.DirectionalLight(0xffb070, 1.3); kick.position.set(-5, 2, -4); scene.add(kick);
  }
  scene.userData.key = key;
  return scene;
}

// ---------- post ----------
const rt = new THREE.WebGLRenderTarget(W * DPR, H * DPR, { samples: 4, type: THREE.HalfFloatType });
const composer = new EffectComposer(renderer, rt);
const dummyScene = new THREE.Scene(), dummyCam = new THREE.PerspectiveCamera();
const renderPass = new RenderPass(dummyScene, dummyCam);
const bokeh = new BokehPass(dummyScene, dummyCam, { focus: 2, aperture: 0.002, maxblur: 0.01 });
const bloom = new UnrealBloomPass(new THREE.Vector2(W * DPR, H * DPR), 0.25, 0.4, 1.6);
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uVig: { value: 0.28 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uVig; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uTime*7.13) * 43758.5453); }
    void main(){ vec4 c = texture2D(tDiffuse, vUv);
      vec2 q = vUv - 0.5; q.x *= 0.5625;
      c.rgb *= 1.0 - uVig * smoothstep(0.18, 0.62, length(q));
      c.rgb += (h(vUv*1280.0) - 0.5) * 0.018;
      gl_FragColor = c; }`,
});
composer.addPass(renderPass);
composer.addPass(bokeh);
composer.addPass(bloom);
composer.addPass(new OutputPass());
composer.addPass(grade);

// ---------- timeline ----------
const capEl = document.getElementById('cap');
const fadeEl = document.getElementById('fade');
const ovEl = document.getElementById('ov');
const hud = document.getElementById('hud');
const built = new Map();
function getShot(i) {
  if (!built.has(i)) built.set(i, SHOTS[i].build({ makeStage, W, H }));
  return built.get(i);
}

window.DURATION = DURATION;
window.renderAt = (t) => {
  let idx = SHOTS.findIndex(s => t >= s.start && t < s.end);
  if (idx < 0) idx = SHOTS.length - 1;
  const def = SHOTS[idx];
  const shot = getShot(idx);
  const lt = t - def.start;
  const r = shot.update(lt, t) || {};
  const cam = shot.camera;
  cam.aspect = W / H; cam.updateProjectionMatrix();
  shot.scene.userData.sky.position.copy(cam.position);
  renderPass.scene = bokeh.scene = shot.scene;
  renderPass.camera = bokeh.camera = cam;
  const dof = r.dof || { focus: 3, aperture: 0, maxblur: 0 };
  bokeh.enabled = dof.aperture > 0;
  bokeh.uniforms.focus.value = dof.focus;
  bokeh.uniforms.aperture.value = dof.aperture;
  bokeh.uniforms.maxblur.value = dof.maxblur ?? 0.012;
  bokeh.uniforms.nearClip.value = cam.near; bokeh.uniforms.farClip.value = cam.far;
  bloom.strength = (r.bloom ?? 0.35) * 0.6;
  renderer.toneMappingExposure = r.exposure ?? 1.0;
  grade.uniforms.uTime.value = t;
  composer.render();
  if (ovEl.innerHTML !== (r.overlay || '')) ovEl.innerHTML = r.overlay || '';
  // captions + fades
  const c = CAPTIONS.filter(c => t >= c[0]).pop();
  capEl.textContent = c && (c[2] == null || t < c[2]) ? c[1] : '';
  let f = 0;
  for (const [a, b, c2, d] of FADES) if (t >= a && t < d) f = Math.max(f, t < b ? (t - a) / (b - a) : t < c2 ? 1 : (d - t) / (d - c2));
  fadeEl.style.opacity = f;
  hud.textContent = `t=${t.toFixed(2)} shot ${idx}`;
  return idx;
};

// interactive preview: ?t=12.3 for a still, otherwise realtime playback
const qs = new URLSearchParams(location.search);
window.ready = Promise.all([document.fonts.ready, loadAssets()]).then(() => true);
if (qs.has('t')) window.ready.then(() => window.renderAt(parseFloat(qs.get('t'))));
else if (!qs.has('render')) {
  const audio = new Audio('./audio.m4a');
  let t0 = null;
  document.body.addEventListener('click', () => { audio.currentTime = 0; audio.play(); t0 = performance.now(); });
  const loop = () => { const t = t0 ? ((performance.now() - t0) / 1000) % DURATION : 0; window.renderAt(t); requestAnimationFrame(loop); };
  window.ready.then(loop);
}
