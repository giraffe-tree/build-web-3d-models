# Ergonomic chair forward-test brief

## Purpose and acceptance

- Purpose: deterministic procedural hero prop for testing recognizable furniture, repeated rolling hardware, load-bearing attachment hierarchy, and a small articulated mechanism in the shared Three.js showcase.
- Recognition gate: the silhouette must read as a premium ergonomic office chair through its five-star rolling base, gas lift, broad seat, high mesh-like back, adjustable-looking lumbar pad, and paired armrests before small details are considered.
- Viewing: three-quarter front is the default; front, side, rear three-quarter, and grazing close views should all preserve real volume. Typical full-object coverage is approximately 70% of the viewport with a 35–50 degree FOV; the nearest useful view is the seat/back junction and recline linkage.
- Scale: modeled in coherent meter-like units. The seat is about 0.60 m wide by 0.53 m deep, its top is about 0.59 m above the floor, arm pads are about 0.80 m high, and the back reaches about 1.31 m.
- Realism target: 78/100. Priority order is silhouette/proportion, mechanical attachment, material separation, mesh/lumbar cues, then tertiary controls.

## Observed requirements

- Premium ergonomic office chair.
- Five-star rolling base.
- Gas lift, seat, mesh-like back, lumbar support, and armrests.
- A subtle, physically legible recline mechanism.
- Deterministic procedural Three.js only, with no external assets or runtime infrastructure.

## Inferences

- The front of the chair faces positive Z and the back hinge sits at the rear edge of the seat.
- A premium product is communicated with restrained graphite polymer, satin metal, deep teal upholstery, a brighter teal lumbar accent, rounded edges, and clearly separated structural parts.
- “Mesh-like” is represented by a thin translucent tension surface plus a deterministic line lattice. This preserves the visual construction cue without dense woven geometry or texture assets.
- The recline is a synchronized lower-back hinge and two visible side links. It is a mechanically plausible explanatory abstraction rather than a reproduction of a specific patented chair mechanism.

## Hierarchy and motion

```text
ergonomic-chair
├── five-star-rolling-base
│   ├── five-star-base-arms (instanced x5)
│   ├── caster-forks (instanced x5)
│   ├── caster-axles (instanced x5)
│   ├── caster-wheels (instanced x10)
│   └── central-hub
├── gas-lift
│   ├── lower-column
│   ├── telescoping-piston
│   └── protective-collar
└── seat-assembly
    ├── under-seat-mechanism
    ├── seat-shell
    ├── seat-cushion
    ├── left-armrest
    ├── right-armrest
    ├── recline-linkage (fixed anchors with moving rods)
    └── back-recline-pivot
        ├── hinge-caps
        ├── back-frame
        ├── tension-mesh and lattice
        └── lumbar-support
```

- The semantic recline value is normalized from 0 (upright) to 1 (maximum demo recline).
- The back pivot is placed at the lower rear frame, not at the chair origin. The motion range is intentionally small: roughly 5 degrees from a slightly reclined rest pose.
- Link rods are recomputed between fixed under-seat anchors and moving back-frame anchors, so their length and direction make the hinge action visible.
- Motion is deterministic from `elapsedSeconds` and occurs only while `motionEnabled` is true. Disabled and reset states return exactly to the upright/rest endpoint.

## Materials and construction cues

- Graphite painted polymer: base, under-seat shell, arm supports, back rails, and mechanism housing; metalness 0 with broad rough highlights.
- Satin steel: gas piston, caster axles, hinge pins, and control lever; high metalness with restrained roughness.
- Deep teal upholstery: thick rounded seat cushion.
- Dark teal mesh: double-sided translucent tension surface with a low-contrast line lattice.
- Bright teal elastomer: lumbar pad and small control accent.
- All load paths are explicit: casters to five-star arms, arms to hub, hub to lift, lift to mechanism, mechanism to seat shell, and the back through its rear hinge.

## Budgets

- Rendered triangles: target under 24,000; hard contract limit 80,000.
- Draw calls: target 32 or fewer; hard contract limit 45 in the shared runtime.
- Materials: target 7 or fewer.
- Textures: 0.
- Repeated topology: five base arms, five fork bodies, five axles, and ten caster wheels are instanced.
- Shadow policy: no local lights are added; the shared runtime decides shadow participation.
- Runtime update: one hinge angle and two short linkage transforms per frame while motion is enabled.

## Omissions and limitations

- No branded controls, woven fiber-scale geometry, upholstery stitching, tilt tension dial markings, height adjustment animation, wheel steering, collision, or ergonomic fit controls.
- The casters are modeled in a fixed straight-ahead orientation; their twin-wheel silhouette is the target, not rolling simulation.
- The mesh surface is an economical visual abstraction and will not deform under load.
- The recline linkage is intentionally exposed for mechanism readability and is not a manufacturing drawing.

## Verification checklist

- [x] Ground contact remains near `y = 0`, with all ten caster tires touching the floor plane.
- [x] Front and side silhouettes clearly show a rolling task chair and coherent human scale.
- [x] Back, lumbar pad, armrests, seat, gas lift, base arms, and casters have semantic names and real volume.
- [x] The lower-back pivot is physically located at the hinge, and the linkage remains attached through rest, intermediate, and maximum recline poses.
- [x] `motionEnabled = false` and `reset()` produce the same deterministic rest pose.
- [x] No renderer, camera, controls, DOM, random values, remote assets, or post-processing are created.
- [x] Syntax/import check passes and measured triangles/drawable objects remain inside the declared budgets.
