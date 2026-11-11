// Shared, preloaded assets (the human model and the lighting map). main.js waits for loadAssets() before the first frame.
// The person is a Microsoft Rocketbox avatar (MIT licence): assets/human/human.fbx + its textures, fetched by fetch-assets.sh.
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export const ASSETS = { human: null, hdr: null, tex: {} };
export async function loadAssets() {
  const tl = new THREE.TextureLoader();
  const names = ['body_color.jpg', 'body_normal.png', 'body_specular.jpg', 'head_color.jpg', 'head_normal.png', 'head_specular.jpg', 'opacity_color.png'];
  const mgr = new THREE.LoadingManager(); mgr.setURLModifier(u => /\.(tga|png|jpg)$/i.test(u) && !u.includes('/human/') ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' : u);
  const [fbx, hdr, ...tex] = await Promise.all([
    new FBXLoader(mgr).loadAsync('./assets/human/human.fbx'),
    new RGBELoader().loadAsync('./assets/studio.hdr'),
    ...names.map(n => tl.loadAsync('./assets/human/' + n)),
  ]);
  names.forEach((n, i) => { const t = tex[i]; t.colorSpace = /color/.test(n) ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; ASSETS.tex[n.split('.')[0]] = t; });
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  ASSETS.human = fbx; ASSETS.hdr = hdr;
  const info = { meshes: [], bones: [] };
  fbx.traverse(o => {
    if (o.isMesh) info.meshes.push({ name: o.name, skinned: !!o.isSkinnedMesh, mats: [].concat(o.material).map(m => m.name + ':' + m.type), morphs: Object.keys(o.morphTargetDictionary || {}), verts: o.geometry.attributes.position.count, groups: o.geometry.groups.length });
    if (o.isBone) info.bones.push(o.name);
  });
  const box = new THREE.Box3().setFromObject(fbx); info.box = [box.min.toArray(), box.max.toArray()]; info.scale = fbx.scale.toArray();
  window.ASSET_INFO = info;
}
