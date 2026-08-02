# Runtime and Performance Check

## Environment

- Local route: `http://127.0.0.1:4177/?view=hero`
- Development server: Vite 7.1.3 on Node 22.15.0
- Browser verification: Codex in-app Chromium/WebGL browser
- Fixed evidence viewport: 1440 × 900 CSS pixels; renderer DPR cap 1.5
- Semantic state: `rest`; fixed time: 0 seconds; no automatic animation

## Deterministic asset audit

Repository `audit_gltf.py` result for `public/assets/vela-chair.glb`:

| Metric | Result | Budget | Status |
| --- | ---: | ---: | --- |
| File size | 1,254,244 bytes | ≤ 4 MiB | pass |
| Unique vertices | 33,041 | ≤ 180,000 | pass |
| Unique triangles | 56,320 | ≤ 240,000 | pass |
| Meshes / primitives | 82 / 82 | information | pass |
| Estimated asset draw calls | 82 | ≤ 85 target, ≤ 110 ceiling | pass |
| Materials | 7 | ≤ 7 authored families | pass |
| Animation / skins | 0 / 0 | rest-state brief | pass |

The GLB warning for alpha blending is expected from the authored suspension material; the runtime replaces it with the current deterministic woven physical material.

## Actual browser frame submission

Values below are `renderer.info.render` after the complete visible + shadow frame. They are not source-only triangle counts.

| Fixed view | Submitted triangles | Calls | Diagnostic FPS sample | Viewport | Runtime |
| --- | ---: | ---: | ---: | --- | --- |
| hero | 105,824 | 156 | 43 | 1440×900 | WEBGL / LIVE |
| orbit A | 105,824 | 156 | 28 | 1440×900 | WEBGL / LIVE |
| orbit B | 105,824 | 156 | 32 | 1440×900 | WEBGL / LIVE |
| neutral material | 105,824 | 156 | 28 | 1440×900 | WEBGL / LIVE |
| subject proof | 98,016 | 140 | 27 | 1440×900 | WEBGL / LIVE |

Deterministic hero targets (≤170 calls, ≤480k submitted triangles) pass. The FPS sample was collected during automation and PNG capture; it is device-/thermal-/capture-dependent and is retained as diagnostic evidence rather than a hard gate. A separate 1280 × 720 resize pass loaded all five states without error.

## Browser functional result

- Asset load: pass (`WEBGL / LIVE`).
- Fixed views: pass for all five query-driven presets.
- Visible control path: pass; clicking the unique `Hero view` button changed the active semantic view and URL to `?view=hero`, with 156 calls / 105,824 triangles.
- Pointer orbit and wheel zoom: enabled with damped OrbitControls and bounded distance/polar angles.
- Resize: pass at 1280×720 and 1440×900.
- Fresh-tab console errors: 0.
- Fresh-tab console warnings after PMREM correction: 0.
- Context loss: no synthetic context-loss cycle was injected; reload recovery and deterministic re-entry passed.

## Build result

`npm run build` passes. The generated JavaScript chunk is about 605 kB / 155 kB gzip; Vite reports its advisory 500 kB chunk-size warning. This does not include the 1.2 MiB GLB. A production pass could split Three.js loader/runtime code, but the current transfer remains within the declared desktop showcase budget.
