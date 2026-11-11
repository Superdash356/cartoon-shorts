// Rim-light outline for the "backlit silhouette" look: adds a fresnel glow (bright where the surface turns away
// from the camera) to every material under `obj`. Faces and fronts stay dark; edges catch a thin line of light.
//   rimify(object, { color: 0xffffff, power: 3, strength: 1.5 })
import * as THREE from 'three';

export function rimify(obj, { color = 0xffffff, power = 3.0, strength = 1.4, darken = 1 } = {}) {
  const cache = new Map();
  obj.traverse(o => {
    if (!o.isMesh || o.material?.userData?.noRim) return;
    const one = m => {
      if (cache.has(m)) return cache.get(m);
      const c = m.clone();
      if (c.color && darken !== 1) c.color.multiplyScalar(darken);
      const u = { uRimColor: { value: new THREE.Color(color) }, uRimPow: { value: power }, uRimStr: { value: strength } };
      c.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, u);
        sh.fragmentShader = 'uniform vec3 uRimColor; uniform float uRimPow; uniform float uRimStr;\n' + sh.fragmentShader.replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
           { float fr = 1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
             totalEmissiveRadiance += uRimColor * pow(fr, uRimPow) * uRimStr; }`);
      };
      c.customProgramCacheKey = () => 'rim' + power + '_' + strength;
      c.userData.rim = u;
      cache.set(m, c); return c;
    };
    o.material = Array.isArray(o.material) ? o.material.map(one) : one(o.material);
  });
  return obj;
}
