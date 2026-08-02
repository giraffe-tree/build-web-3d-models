# Demo module contract

Each independent forward-test agent owns exactly two files:

- `src/demos/<id>.js` — one deterministic Three.js model module.
- `briefs/<id>.md` — its asset brief, assumptions, hierarchy, budget, and self-check.

Do not edit the shared runtime, another demo, README, dependencies, or Git state.

## JavaScript API

The module must use only the installed `three` package and export:

```js
import * as THREE from "three";

export const meta = {
  id: "kebab-case-id",
  order: 10,
  title: "Human title",
  category: "MECHANISM | ORGANIC | TERRAIN | FURNITURE | ARCHITECTURE",
  description: "One short sentence describing the tested capability.",
  accent: "#ff7a1a",
  background: "#090b0f",
  cameraDirection: [1.4, 0.9, 1.8],
  target: [0, 0.8, 0],
};

export function createDemo() {
  const root = new THREE.Group();
  return {
    root,
    update(deltaSeconds, elapsedSeconds, motionEnabled) {},
    reset() {},
    dispose() {},
  };
}
```

Only `root` is required in the returned object. The runtime owns renderer, camera, orbit controls, world lighting, floor, resize, and object disposal. A demo may add local lights under `root` when its material study needs them.

## Acceptance contract

- Make the requested subject recognizable from silhouette before relying on labels or tiny detail.
- Use real volume, semantic part names, explicit attachment hierarchy, and correct local pivots for motion.
- Keep generation deterministic. Use a seeded random function if variation is needed; do not use bare `Math.random()`.
- Use no downloaded runtime assets, remote textures, DOM code, renderer, camera, controls, or post-processing.
- Prefer shared geometries/materials and instancing for repeated parts.
- Target no more than 80,000 rendered triangles and 45 draw calls in the shared runtime.
- Keep ground contact near `y = 0`, center the subject near the origin, and model at a coherent relative scale.
- Motion must be subtle, physically legible, and controlled only by the `motionEnabled` argument.
- Put observed requirements, inferences, omissions, target budgets, and verification notes in the matching brief.
- Before returning, check syntax and inspect the module against this contract. Do not commit or push.
