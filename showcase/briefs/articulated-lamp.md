# Articulated Architect Lamp

## Asset brief

- Purpose: a deterministic hero prop that forward-tests an articulated hard-surface mechanism, local pivot hierarchy, compact procedural detail, and a small fixture-owned task light.
- Viewing: authored for a three-quarter view at typical full-object distance, with enough real volume for side and rear orbit views. The silhouette should read as a weighted-base architect lamp before small hardware is visible.
- Scale and contact: the circular base is 0.84 scene units wide and rests at `y = 0`; the shoulder axis is at `y = 0.34`, and the working head pivot is about `y = 1.49` in the rest pose.
- Appearance target: premium graphite metal, restrained brass mechanical accents, a warm visible diffuser, and grounded warm cast-light intent. Target realism is 82/100 within the shared procedural-demo constraints.
- Runtime target: desktop and modern mobile WebGL through the shared showcase renderer, 60 fps as a diagnostic goal rather than a deterministic gate.

## Requirements and assumptions

Observed requirements from the assignment:

- Weighted base, a two-link arm, shoulder/elbow/head pivots, tension hardware, shade, visible bulb or diffuser, cast-light intent, and subtle coordinated motion.
- Every moving dependency must remain attached through an explicit hierarchy.
- Generation and motion must be deterministic and must use only installed Three.js primitives.

Inferences made for the forward test:

- The lamp is a premium contemporary anglepoise-inspired product rather than a reconstruction of a named commercial design.
- Painted/anodized graphite and brass hardware provide readable material separation without textures.
- A warm diffuser is more robust than transparent bulb glass in the shared runtime and gives the spotlight a clear visual source.
- The shade is kept approximately downward-facing by counter-rotating the head pivot as the shoulder and elbow move.

## Construction and hierarchy

```text
ARTICULATED_LAMP_ROOT
├── WEIGHTED_BASE
│   ├── RUBBER_CONTACT_PAD
│   ├── CAST_WEIGHT_SHELL
│   ├── BASE_TRIM_RING
│   ├── SHOULDER_PEDESTAL
│   ├── SHOULDER_YOKE_SIDES
│   └── SHOULDER_FIXED_AXLE
└── SHOULDER_PIVOT
    ├── SHOULDER_CLUTCH
    ├── LOWER_ARM_RAIL_PAIR
    ├── LOWER_ARM_TENSION_SPRING
    ├── SPRING_ANCHOR_PINS
    ├── ELBOW_LOWER_HOUSING
    ├── ELBOW_TENSION_LINK
    └── ELBOW_PIVOT
        ├── ELBOW_BRASS_PIN
        ├── UPPER_ARM_RAIL_PAIR
        ├── HEAD_UPPER_HOUSING
        └── HEAD_PIVOT
            ├── HEAD_BRASS_PIN
            ├── SHADE_NECK
            ├── FLARED_METAL_SHADE
            ├── SHADE_CROWN
            ├── SHADE_RIM
            ├── WARM_DIFFUSER
            └── CAST_LIGHT_INTENT + TASK_LIGHT_TARGET
```

The arm rails begin at their owning pivot and terminate at the child pivot's local origin. The head and every shade/light component are descendants of `HEAD_PIVOT`. `ELBOW_TENSION_LINK` is owned by the shoulder frame, and its far endpoint is recomputed from an elbow-local anchor after every pose update so both ends remain mechanically seated.

## Motion and physical limits

- Rest angles: shoulder `0.52`, elbow `-1.14`, and head `0.62` radians.
- Motion uses low-amplitude sine offsets: shoulder ±0.052 radians, elbow ±0.068 radians, and only ±0.018 radians of residual shade aim drift after counter-rotation.
- The animated range stays far inside plausible hinge limits and avoids base, arm, and shade intersections.
- `motionEnabled === false` returns immediately to the deterministic rest pose; `reset()` applies that same pose.

## Budgets

- Rendered triangles: focused traversal measured 5,092, below the 12,000 target and 80,000 hard contract.
- Draw calls: focused traversal measured 21, below the target of 25 and hard contract of 45; paired rails, yoke sides, and spring anchor pins use instancing.
- Materials: five shared PBR material families; no textures, remote assets, morph targets, bones, or post-processing.
- Lights: one local 512×512 shadow-casting spotlight, plus the shared world lighting.
- Per-frame work: three joint rotations, one tension-link endpoint solve, and no allocations except two short-lived vectors in that solve.

## Omissions

- No electrical cord, switch, manufacturer mark, internal wiring, or threaded fastener geometry.
- No collision solver or user manipulation; motion is a fixed deterministic display cycle.
- The spring is a visual tension cue and is not a simulated elastic body.
- The spotlight expresses cast-light intent, but final contact and shadow appearance depend on the shared renderer and floor shadow settings.

## Self-check

- Ground contact: rubber pad bottom is exactly at `y = 0`.
- Recognition: base, zig-zag two-link silhouette, three visible joint axes, and flared shade remain readable without labels.
- Attachment: shoulder owns the lower link and elbow; elbow owns the upper link and head; head owns shade, diffuser, light, and target.
- Determinism: no random input, time-based pose is a pure function of `elapsedSeconds`, and disabled motion resets to one fixed pose.
- Contract: imports only `three`, creates no renderer/camera/DOM/remote asset, exports `meta` and `createDemo`, and stays inside the declared module/brief ownership boundary.
- Focused verification completed: `node --check` passed; direct module import passed; required semantic nodes were found; enabled motion changed the pose; disabled motion restored the exact rest pose; traversal measured 5,092 triangles and 21 mesh draw calls.
