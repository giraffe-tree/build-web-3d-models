# Demo module contract

The original seven demos use the legacy blockout profile. New quality-forward-test agents own:

- `src/demos/<id>.js` — one deterministic Three.js model module.
- `briefs/<id>.md` — its asset brief, assumptions, hierarchy, budget, and self-check.
- `evidence/<id>/` — fixed rendered views, review notes, and a validated quality-evidence manifest.

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
  fidelityLane: "polished-stylized",
  identityFeatures: ["feature one", "feature two", "feature three", "feature four", "feature five"],
  budgets: { triangles: 120000, drawCalls: 60, targetFps: 45, targetDevice: "desktop" },
  presentation: {
    background: "#090b0f",
    cameraDirection: [1.4, 0.9, 1.8],
    target: [0, 0.8, 0],
    fov: 38,
    screenCoverage: 0.72,
    exposure: 1.08,
    fogDensity: 0.018,
    floorColor: "#14161b",
    hemisphereIntensity: 1.65,
    keyIntensity: 4.2,
    rimIntensity: 2.2,
  },
  evidenceViews: {
    hero: { cameraDirection: [1.4, 0.9, 1.8], fixedTimeSeconds: 0 },
    orbitA: { cameraDirection: [-1.4, 0.8, 1.5], fixedTimeSeconds: 0 },
    orbitB: { cameraDirection: [1.2, 0.7, -1.6], fixedTimeSeconds: 0 },
    neutralMaterial: { cameraDirection: [0, 0.45, 1.8], fixedTimeSeconds: 0 },
    subjectProof: { cameraDirection: [0.7, 0.25, 1.2], screenCoverage: 0.86, fixedTimeSeconds: 0 },
  },
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

Only `root` is required in the returned object. The runtime owns renderer, camera, orbit controls, default world lighting, floor, resize, and object disposal. A demo may add local lights under `root` when its material study needs them. New demos should tune the shared rig with `presentation` rather than inheriting a look designed for another subject.

Legacy top-level `background`, `cameraDirection`, and `target` fields remain supported. They are fallback compatibility fields, not the preferred quality profile.

## Acceptance contract

- Declare the requested fidelity lane and treat `polished-stylized`, `reference-faithful`, or `photoreal-hero` as a finished visual deliverable rather than a blockout.
- List at least five identity-critical features. Make the subject recognizable from silhouette, then prove construction, material response, and subject-specific detail.
- Use real volume, semantic part names, explicit attachment hierarchy, and correct local pivots for motion.
- Keep generation deterministic. Use a seeded random function if variation is needed; do not use bare `Math.random()`.
- Do not use remote runtime assets, DOM code, a second renderer, camera, controls, or post-processing. Repository-owned geometry, data textures, decals, baked maps, and local assets are valid when they materially improve the declared finish.
- Prefer shared geometries/materials and instancing for repeated parts.
- Derive `budgets` from subject, target device, repetition, materials, closest view, and screen coverage. The legacy `80,000 triangles / 45 draw calls` fallback exists only so the original seven demos keep validating.
- Keep ground contact near `y = 0`, center the subject near the origin, and model at a coherent relative scale.
- Motion must be subtle, physically legible, and controlled only by the `motionEnabled` argument.
- Put observed requirements, inferences, omissions, identity-feature mappings, chosen-pipeline rationale, target budgets, and verification notes in the matching brief.
- Capture `hero`, two distinct orbits, neutral material, and subject-proof views in fixed semantic states. Use `?capture=1&demo=<id>&view=<view-name>` to remove the lab UI and freeze time.
- Run two screenshot review/correction rounds. Save the final views and a quality-evidence manifest under `evidence/<id>/`, then validate it with `python3 ../scripts/validate_visual_evidence.py evidence/<id>/quality-evidence.json` from this directory.
- Before returning, run syntax/module validation, a production build, and rendered browser checks. Do not commit or push.
