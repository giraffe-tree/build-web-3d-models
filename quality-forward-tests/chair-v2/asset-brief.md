# VELA / 01 — Asset Brief

## Intent

- Fidelity lane: polished stylized.
- Purpose: a premium ergonomic task-chair hero for a desktop portfolio page; believable at close range and explorable from every side.
- Semantic state: quiet seated/rest state. No automatic turntable or decorative motion; pointer orbit, wheel zoom, fixed-view controls, and keyboard view shortcuts are the only motion.
- Status target: complete after five fixed evidence views, two review rounds, browser/runtime verification, and manifest validation.

## Evidence and interpretation

This is an original, art-directed product—not a reproduction of a branded chair. Public manufacturer material is used only to ground scale and ergonomic construction:

- Herman Miller Aeron B dimensions establish a mainstream envelope around 0.72 m wide, 0.70 m deep, 0.93–1.05 m tall, with a 0.43 m seat depth and adjustable suspension/back support: https://www.hermanmiller.com/products/seating/office-chairs/aeron-chair/specs/
- Steelcase Karman establishes the visual/functional precedent for a flexible seat edge, suspension textile, and weight-responsive structure in a 0.66 m square footprint: https://store.steelcase.com/steelcase-karman?cclcl=en_CA
- Haworth Fern establishes a 0.70–0.74 m wide ergonomic envelope and the plausibility of a flexible, visually legible back-support structure: https://store.haworth.com/products/fern-office-chair

Observed: premium task chairs commonly expose a five-star load path, gas lift, tilt housing, tensioned back surface, lumbar support, adjustable arms, and compact twin-wheel casters. Inferred/art-directed: VELA's forked copper yoke, asymmetric control dial, floating seat shadow-gap, color system, frame sweep, and exact hidden-side construction.

## Scale, camera, and presentation

- Model scale: meters; floor contact at Z=0; centered on the gas-lift axis.
- Modeled envelope: approximately 0.72 m wide × 0.72 m deep × 1.25 m high; seat top near 0.50 m.
- Hero viewport: 1440 × 900; target device is a recent desktop/laptop with hardware WebGL2.
- Hero view: 30° FOV, three-quarter front, eye above seat, chair covering about 68–74% of usable vertical canvas.
- Closest allowed orbit: about 1.15 m from target; typical hero distance about 2.7 m; silhouette distance about 3.4 m.
- Mood: graphite gallery, low warm floor bounce, soft architectural key, cool rim, restrained copper detail.
- Neutral material proof: light-gray background, flatter white lighting, controlled exposure, no mood vignette.

## Identity inventory

| Feature | Critical | Representation | Primary evidence |
| --- | --- | --- | --- |
| Five-star load-bearing base with real caster contact | yes | beveled authored geometry + named wheel hierarchy | orbit A |
| Human-scale seat/back relationship | yes | measured geometry | hero |
| Tensioned mesh back with visible woven response | yes | curved surface geometry + runtime alpha/normal textile maps | neutral material |
| Continuous soft-edge back frame | yes | authored closed bevel curve | hero |
| Forked metallic lumbar/yoke structure | yes | authored tube geometry + metal material | orbit B / subject proof |
| Floating upholstered seat over mechanical pan | yes | separated cushion, piping, pan, and shadow gap | hero |
| Adjustable arm posts, joints, and soft pads | yes | named multi-part geometry | orbit B |
| Gas lift, bellows, and tilt housing load path | yes | concentric/mechanical geometry | subject proof |
| Twin-wheel casters with visible fork and hubs | yes | repeated named geometry | orbit A |
| Readable control dial and lever | no | small geometry with copper accent | subject proof |
| Upholstery weave and controlled roughness variation | yes | deterministic runtime texture maps | neutral material |

No copied logos, brand marks, or decorative animation are included.

## Pipeline choice

Hybrid: Blender authors the silhouette, bevel language, curved back membrane, load-bearing structure, hierarchy, and editable `.blend`; Three.js supplies deterministic textile maps, PBR material refinement, presentation lighting, orbit interaction, semantic view controls, responsive layout, and diagnostics. This route preserves close-range edge highlights and art-directed curvature better than a primitive-only browser build while keeping the interactive runtime compact.

## Appearance and material families

- Graphite powder-coated structural polymer: non-metal, roughness about 0.32–0.45, softened highlights.
- Charcoal woven suspension mesh: non-metal, micro-normal and alpha weave, roughness about 0.56.
- Warm basalt seat textile: non-metal, fine deterministic weave/bump, roughness about 0.72.
- Satin anodized copper accent/yoke/hubs: metalness 0.85–0.95, roughness about 0.24–0.34.
- Black elastomer pads and wheels: non-metal, roughness about 0.58–0.72.
- Brushed gas lift: metallic with restrained highlight, not mirror chrome.

## Derived performance budget

The chair is a single desktop hero occupying roughly 70% of the canvas, with no copies and no animation skinning. The geometry budget is intentionally above a repeated prop but below a vehicle/organic hero.

- Runtime LOD0: target ≤ 240k triangles, ≤ 180k unique vertices, ≤ 85 visible draw calls; hard ceiling 320k / 240k / 110.
- Full frame including shadow submission: target ≤ 170 calls and ≤ 480k submitted triangles at the fixed hero view.
- Texture families: ≤ 6 generated maps, each ≤ 512²; decoded texture memory target ≤ 8 MiB including mip overhead.
- Shadow casters: primary frame, seat, yoke, base, and casters; mesh membrane does not cast a dense alpha shadow.
- Render target: 1440 × 900 CSS pixels; DPR capped at 1.5 (about 2.92 M rendered pixels), hardware WebGL2 preferred.
- Runtime goal: stable 60 fps on an Apple M1-class / modern integrated-GPU laptop at the target viewport; measured frame time is diagnostic, while topology, calls, texture sizes, load success, console errors, and screenshot identity are deterministic gates.
- Initial transfer target: ≤ 4 MiB uncompressed GLB and ≤ 1.5 MiB application dependencies after normal server compression, excluding development source maps.

## Required deliverables and gates

- Editable `blender/vela-chair.blend` and generating source `blender/build_chair.py`.
- Runtime `public/assets/vela-chair.glb`, Web source, and local start commands.
- Fixed `hero`, `orbitA`, `orbitB`, `neutralMaterial`, and `subjectProof` PNGs at a minimum 1280 × 720; the page hero target remains 1440 × 900.
- Two bounded screenshot review records, a runtime/performance report, known limitations, and `quality-evidence.json` validated by the repository validator.
- Minimum self-rubric 78/100 with no missing critical feature and no browser/runtime gate failure, followed by an independent critic whose lower score/status has completion authority.
