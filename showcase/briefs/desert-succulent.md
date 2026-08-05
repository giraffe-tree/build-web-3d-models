# Desert Succulent — asset brief

## Intent and fidelity

- **Requested object:** an additional showcase subject that demonstrates the `build-web-3d-models` skill beyond the existing tree and mushroom demos.
- **Chosen subject:** a compact desert succulent in a glazed ceramic planter.
- **Fidelity lane:** `polished-stylized`.
- **Capability focus:** master-sample-first organic construction, readable biological hierarchy, thick procedural geometry, vertex-color material variation, instanced repetition, grounded product presentation, and conservative motion.
- **Reference status:** no single reference image was supplied. The model uses common rosette-succulent morphology as an inference, not a species-faithful claim.

## Acceptance contract

The final silhouette must read immediately as a dense rosette succulent in a planter, including a broad horizontal outer ring, rising middle leaves, and a compact upright crown. Close views must prove that the repeated leaf is a closed thick volume rather than a card. The planter must show a rolled lip, tapered wheel-thrown body, recessed soil, mineral top dressing, and an explicit ground-contact foot.

The study is not complete evidence until the integration pass captures the five declared views and runs the independent screenshot review. This module therefore does not claim a numeric visual-quality score on its own.

## Observed requirements, inferences, and omissions

### Observed

- Build another object in the showcase and visibly demonstrate the skill's breadth.
- Keep generation deterministic and self-contained.
- Provide subtle organic motion with a reliable reset/dispose lifecycle.

### Inferred

- A rosette succulent complements the existing branching ginkgo: it tests a repeated radial growth law instead of branch hierarchy.
- A ceramic planter is part of the subject, because it adds product-form, ground-contact, and layered-material evidence without hiding the plant.
- Succulent leaves are structurally stiff, so motion should remain nearly imperceptible rather than behaving like grass.

### Deliberate omissions

- No species-specific botanical claim, flowers, roots, thorns, remote textures, DOM hooks, or runtime-loaded assets.
- No scanned PBR maps. This is a stylized mid-band material study; the procedural glaze and leaf surface should not be described as micro-band photorealism.
- No deformation skeleton. Instance matrices are sufficient for the very small whole-leaf flex that is claimed.

## Master sample and growth law

One indexed `ThickCuppedMasterLeafGeometry` is built first with two closed surfaces, edge walls, a basal-to-tip taper, a raised center curl, cupped edges, and computed vertex normals. Vertex colors travel from basal sage through a lighter body green to a coral mature tip. Every leaf in the plant instances this exact master geometry.

The rosette then uses four deterministic growth-age rings:

| Ring | Count | Posture | Meaning |
| --- | ---: | --- | --- |
| mature outer | 18 | broad and spreading | silhouette and weight |
| middle | 13 | rising | layered overlap |
| young inner | 9 | steep | crown transition |
| new crown | 5 | compact and upright | fresh central growth |

Angles advance by the golden angle with small seeded offsets. Scale, tint, roll, and phase variation all come from a fixed Mulberry32 seed.

## Identity-feature mapping

| Identity-critical feature | Geometry/material proof |
| --- | --- |
| thick cupped fleshy leaf | closed indexed master geometry with top, bottom, edge walls, curl, and thickness |
| layered rosette growth | four semantic growth rings with progressively steeper posture and shorter length |
| sage leaves with mature blush | per-vertex basal/body/tip color transition plus restrained per-instance tint |
| compact center | dedicated five-leaf upright crown, not a scaled copy of the outer ring layout |
| glazed ceramic planter | lathed tapered body, separate foot, physical clearcoat material, and rolled torus rim |
| soil and mineral dressing | recessed rough soil cylinder plus 22 seeded low-poly stone instances |

## Hierarchy, attachment, and load path

```text
DesertSucculentRoot
├── GroundedCeramicPlanterAssembly
│   ├── TaperedGlazedPlanterBody
│   ├── GroundContactCeramicFoot
│   ├── RolledGlazedPlanterRim
│   ├── DarkInnerLipReveal
│   ├── RecessedSoilBed
│   └── SeededMineralTopDressingInstances
├── BiologicalRosetteAssembly
│   └── MasterLeafRosetteInstances
└── WarmCeramicBounceLight
```

- **Planter joint vocabulary:** the body, foot, and rim are modeled as integral fired ceramic forms. Their static load path is `plant/soil -> planter body -> ceramic foot -> floor`.
- **Leaf attachment vocabulary:** each leaf has a biological basal-growth attachment at the crown. The instance transform originates inside the soil/crown contact volume; no floating or tangency-only connection is claimed.
- **Motion pivot:** each rigid master leaf flexes from its basal instance origin. There are no mechanical hinges or unsupported decorative parts.

## Materials and presentation

- Leaves use a vertex-colored physical material with low clearcoat and medium roughness to suggest a waxy cuticle without plastic glare.
- The planter uses a warm terracotta glaze with a distinct brighter rolled rim; the inner reveal and soil remain very rough and dark.
- Mineral instances use flat-shaded high-roughness material and seeded neutral-warm colors.
- Warm key/bounce and cool green rim colors separate the plant from the dark neutral background. The neutral-material evidence view removes the colored lighting narrative.

## Motion contract

When motion is enabled, each whole leaf receives a phase-offset basal flex of at most `0.013` radians and a breathing scale change of at most `0.25%`. The outer mature leaves move most; new central leaves move least. When motion is disabled, or after `reset()`, every instance returns deterministically to the fixed hero state. `dispose()` only releases module-owned state; the showcase runtime remains responsible for Three.js resource disposal.

## Budget rationale

- **Declared:** 32,000 triangles, 16 draw calls, 60 FPS, desktop and modern mobile.
- **Validated construction:** 45 instances of one 416-triangle leaf, 22 instances of one low-detail icosahedral stone, plus a lathed planter, two rings, foot, and soil. The demo validator reports 22,464 triangles and 7 drawables.
- **Why this budget:** screen coverage reaches `0.90` in the subject-proof view, so the master leaf needs enough longitudinal and cross segments to hold a convincing thick silhouette. Repetition is instanced, keeping drawables and per-frame matrix work small.

## Fixed evidence views

- `hero`: warm three-quarter view proving the complete rosette and glazed vessel.
- `orbitA`: opposite side proving that the radial layout is not camera-dependent.
- `orbitB`: rear three-quarter view checking overlap, crown density, and the pot silhouette.
- `neutralMaterial`: front-biased neutral-light view separating form/material response from the warm art direction.
- `subjectProof`: elevated close view proving the four growth rings, center crown, leaf thickness, soil recess, and stone scatter.

## Builder self-check

- [x] deterministic PRNG; no `Math.random()`, DOM, or remote runtime assets
- [x] one closed master leaf geometry shared by all 45 leaf instances
- [x] semantic hierarchy and explicit biological/static attachment vocabulary
- [x] five visibly distinct evidence camera directions are declared
- [x] motion is gated by `motionEnabled`; `reset()` restores the fixed state
- [x] drawables are shared/instanced and remain below the declared budget by construction
- [ ] integration owner captures the final views, runs two visual correction rounds, and validates the evidence manifest
