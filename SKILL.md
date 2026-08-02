---
name: build-web-3d-models
description: Plan, create, optimize, export, integrate, and validate web-ready 3D assets and scenes using Blender, procedural geometry, or a hybrid workflow. Use for GLB/glTF/Blend/FBX/OBJ work, Three.js/WebGL/WebGPU integration, reference-driven product reconstruction, articulated or hinged hard-surface props, PBR materials, UVs and baking, rigging and animation handoff, LOD and instancing, performance diagnosis, realism scoring, or building objects and environments such as trees, plants, books, houses, furniture, bicycles, mountains, rivers, rocks, grass, flowers, mushrooms, computers, tools, props, and animals.
---

# Build Web 3D Models

Create visually credible 3D content that fits an explicit Web performance budget. Treat modeling, materials, motion, runtime integration, measurement, and regression tests as one pipeline.

## Route the work

1. Inspect the workspace, existing asset pipeline, renderer, tests, Git state, and local instructions.
2. Read only the references needed:
   - Read references/blender-pipeline.md for Blender, mesh editing, UV, baking, rigging, animation, or export work.
   - Read references/web-runtime-performance.md for browser integration, shaders, lighting, shadows, LOD, compression, profiling, or performance fixes.
   - Read references/asset-archetypes.md for the matching object or environment family.
   - Read references/reference-driven-reconstruction.md for single-view or multi-view reconstruction, evidence tracking, fixed-camera review, detail inventories, or bounded correction loops.
   - Read references/visual-quality-workflow.md for polished showcases, hero assets, visual quality regressions, art-direction choices, screenshot gates, or any request where "done" must mean more than a recognizable blockout.
   - Read references/quality-first-agent-prompt.md when delegating a polished asset, defining a reusable build prompt, or running a before/after forward test of this skill.
   - Read references/hinged-product-case-study.md for laptops, books, doors, cases, folding furniture, or any product whose closed/open endpoints and part clearances define correctness.
   - Read references/tree-web-case-study.md for organic procedural modeling, wind, hierarchical attachment, or geometry-pressure examples.
3. If a more specific available skill covers rigging, animation, Blender MCP, image generation, or browser control, use it alongside this skill.
4. Preserve existing user changes. Commit each logical change when repository policy requires commits.

## Define acceptance criteria first

Write a short asset brief before changing code or Blender files:

- Fidelity lane: blockout, polished stylized, reference-faithful, or photoreal hero. If the user asks for a finished showcase without naming a lane, default to polished stylized—not blockout.
- Purpose: hero object, background prop, repeated instance, terrain, character, or interactive mechanism.
- Viewing: closest distance, typical distance, silhouette distance, camera FOV, and expected screen coverage.
- Targets: desktop/mobile, minimum device class, FPS or frame-time target, load-time and file-size limits.
- Deliverables: source .blend or procedural source, .glb/.gltf, textures, animation clips, runtime code, screenshots, and tests.
- Appearance: real dimensions, reference views, material response, required moving parts, endpoint clearances, and a 0–100 realism target when requested.
- Budgets: triangles per LOD, unique vertices, draw calls, texture memory, bones, morph targets, shadow casters, and pixels rendered.
- Identity and finish: five to twelve subject-defining cues, material families, presentation mood, required hero/orbit/material views, and the declared visual quality gate.

Do not use one universal polygon budget. A hero animal, a repeated grass blade, and a building need different budgets.

For realistic work, collect enough references to resolve front/side/three-quarter silhouette, construction or anatomy, close surface response, and age/variation. Six to twelve strong views are usually more useful than many redundant images. Use official dimensions or drawings for scale, but use real photographs for gaps, occlusion, finish, and how parts actually meet; marketing renders alone often hide mechanical errors.

## Choose the pipeline

Use procedural code when the asset is parametric, repeated, seeded, terrain-like, vegetation-like, or must expose runtime controls. Use Blender when form depends on sculpting, precise hard-surface construction, retopology, UV painting, baking, rigging, or art-directed edits. Use a hybrid pipeline when Blender supplies reusable modules or baked maps and code supplies layout, variation, animation, LOD, or interaction.

Choose from the closest required view and fidelity lane, not from implementation convenience. Do not force a polished hero product, furniture piece, organic asset, or environment into Three.js primitives merely because the final delivery is Web-based. If a procedural-only route cannot supply the required edge treatment, surface variation, unique detail, or art-directed silhouette, switch to Blender or hybrid. Textures, decals, baked maps, and authored GLB assets are valid Web techniques; zero textures is a constraint only when the user or target actually requires it.

Prefer the cheapest representation that survives the required closest view:

- Geometry for silhouette, parallax, joints, deformation, and contact.
- Normal/height maps for shallow surface relief.
- Alpha-tested cards for dense fine structures when ordering is unnecessary.
- Instances for repeated topology.
- Impostors or baked billboards only beyond the distance where parallax is no longer readable.

## Protect the visual quality floor

For polished stylized, reference-faithful, or photoreal work, read references/visual-quality-workflow.md and use its pass gates.

1. Collect or create enough references to resolve silhouette, construction, material response, and presentation. For an original polished asset with no user images, make a compact visual target board from three to eight strong image references or authored concepts; text-only dimensions and descriptions do not define a finish target. Without usable evidence, label the result generic or inferred instead of quietly lowering the finish bar.
2. Lock identity-critical features before modeling. A result that is merely category-recognizable is still incomplete when those features are absent.
3. Progress through macro silhouette, secondary construction, material/surface, lighting/presentation, and runtime passes. Do not present a blockout as a finished asset because it loads and meets a budget.
4. Capture a deterministic hero view, two meaningful orbit views, and a neutral material view. Add endpoint or close-up views when the subject requires them. Keep asset-review views free of UI that obscures the feature being proved; a marketing-page hero may retain its intended UI.
5. After each polished pass, name the three largest visible defects and correct the highest-impact one. Run at least two screenshot review rounds for a finished showcase; keep rounds bounded and preserve the best result. The last review must inspect the exact final files. Any later change that affects geometry, material, lighting, camera, state, or UI invalidates that review and requires recapture.
6. Use an independent visual critic when fresh subagents are available. Give it only the request and rendered evidence—not the implementation, self-score, suspected defect, or intended fix. The builder's score and status are provisional: the critic's lower score or status controls the completion claim. Either run one bounded repair-and-recritique cycle or ship the critic-labelled partial result.

Treat performance as a constraint on a declared appearance target. Once an asset fits its target-device budget, do not keep simplifying it merely to improve an already-passing metric. If the target cannot fit, change representation, LOD, or pass cost before sacrificing identity, silhouette, contact, or material separation.

## Build from large to small

1. Establish metric scale, origin, axes, naming, pivots, and attachment hierarchy.
2. Match silhouette and proportions before surface detail.
3. Separate primary masses, secondary structures, and tertiary detail.
4. Put topology where it changes silhouette, bends, receives close highlights, or supports deformation.
5. Bind dependent parts explicitly:
   - Rigid parts: parent transforms, empties, sockets, or named nodes.
   - Deforming parts: armature and normalized weights.
   - Flexible procedural parts: parent anchor, branch/segment depth, stiffness, phase, and local rest direction.
6. Keep deterministic seeds for procedural assets and stable names for Blender nodes, clips, materials, and sockets.

## Reconstruct from references with bounded review

For reference-driven work:

1. Separate direct observations from dimensional, material, and hidden-side inferences; attach confidence and request more views when an unknown can change structure or mechanism correctness.
2. Build a macro/meso/micro detail inventory. Map every retained item to geometry, material, texture, hierarchy, or an explicit omission before implementation.
3. Lock one reproducible reference camera and keep at least two meaningful orbit views to prove real volume. Do not score an orbit view against an angle the references do not show.
4. After each review, record what changed, the evidence or failure that caused it, what still differs, and one next action.
5. Treat silhouette, scale, edge, colour, or image-similarity metrics as diagnostic signals. Never let one universal scalar block an otherwise useful delivery; hard-stop only for a declared critical feature, invalid input, broken runtime, or explicit user threshold.
6. Bound correction rounds. Stop, deliver a clearly labelled partial result, or request better input when the same defect repeats, scores oscillate, or measurable progress plateaus.

Keep reusable model generation separate from cameras, lighting, UI, and diagnostics. For interactive assets, expose stable named nodes and semantic pivots/sockets instead of returning an inert merged object.

## Validate mechanisms endpoint-first

For any hinged, sliding, telescoping, folding, or removable assembly:

1. Define the semantic state and real physical limits before adding tertiary detail.
2. Put the pivot or constraint on the mechanical axis, not at a visually convenient origin.
3. Build and inspect the most constrained endpoint first, usually the closed or fully seated state.
4. Check top, front, side, silhouette, and a grazing close-up for uniform seams, hidden layers, contact, and clearance.
5. Check the opposite endpoint and at least one intermediate pose for intersection, detachment, or impossible exposure.
6. Keep every dependent part under one explicit transform hierarchy and expose semantic controls such as open angle rather than raw transforms.

Do not treat a plausible open hero view as proof of mechanical correctness. If the closed stack is wrong, correct shell thickness, footprint, pivot height, or layer order before polishing materials.

## Author materials and lighting

- Use physically plausible PBR values. Most organic, painted, plastic, paper, stone, and wood surfaces have metalness 0.
- Treat base color and emissive maps as sRGB; treat normal, roughness, metallic, occlusion, and height data as linear.
- Use roughness variation before adding strong specular effects. Avoid using a color texture directly as a roughness map without intentional remapping.
- Validate material response under neutral light, grazing light, backlight, and the final environment.
- Keep user-selectable material variants data-driven rather than duplicating geometry.
- Budget transparent blending carefully. Prefer alpha test or alpha-to-coverage for foliage and cutouts when appropriate.

## Add motion from the hierarchy

- Drive each child from its parent attachment frame; never animate disconnected world-space parts independently.
- For wind, apply force by exposed area and orientation, transmit it through a spring-damper hierarchy, and add smaller high-frequency motion only at flexible tips or leaves.
- For mechanisms, place pivots at real hinges and verify movement limits.
- For animals or characters, use a real armature, clean weights, root motion policy, loop validation, and export-ready clips. Invoke a dedicated rigging/animation skill when available.
- Keep render animation deterministic enough for screenshot and regression tests.

## Optimize by measured bottleneck

Measure before reducing quality. Attribute costs to geometry generation, CPU update, GPU vertex work, fragment/overdraw, shadow passes, texture bandwidth, draw calls, and memory.

Apply optimizations in this order when they match the evidence:

1. Remove multiplicative topology explosions and invisible detail.
2. Add distance LOD with hysteresis; preserve silhouette and projected coverage.
3. Simplify or disable expensive distant shadow casters before removing visible geometry.
4. Instance repeated parts and share geometry/materials.
5. Split close-up geometry into spatial chunks when frustum culling cannot reject a monolithic mesh.
6. Compress meshes and textures; stream optional detail.
7. Reduce shader features or dynamic resolution only when fragment/GPU time remains the bottleneck.

Never infer performance from model triangles alone. Count every visible, depth, shadow, reflection, and post-processing pass.

When increasing repeated surface detail such as perforations, keys, fasteners, vents, petals, spokes, or blades, export and audit immediately. Compare projected size and contrast at the typical camera before keeping the added topology. If detail dominates visually or breaks the budget, reduce diameter/depth/contrast, lower count, instance or merge it, or move it to a normal/height/texture representation.

## Export and integrate

1. Keep an editable source; export a derived runtime asset.
2. Apply or intentionally preserve transforms, modifiers, triangulation, normals, tangents, UVs, and animation ranges.
3. Prefer glTF 2.0 / GLB for Web delivery. Use Meshopt or Draco and KTX2 only when the runtime is configured to decode them.
4. Run scripts/audit_gltf.py and an official glTF validator on each exported asset; enforce task-specific budgets. Example:

~~~bash
python3 scripts/audit_gltf.py model.glb \
  --max-triangles 300000 --max-vertices 400000 \
  --max-draw-calls 12 --max-textures 8
~~~
5. Load once, reuse materials and geometry, precompile important shaders, and dispose replaced GPU resources.
6. Expose runtime diagnostics for active LOD, triangles/frame, draw calls, GPU/CPU time, textures, and memory proxies.

## Validate and iterate

Validate at minimum:

- Shape: front, side, three-quarter, silhouette, close-up, and typical-distance views.
- Materials: neutral, grazing, backlit, and final-environment lighting.
- Motion: attachment continuity, pivot correctness, deformation, looping, wind response, and collision/contact if relevant.
- Mechanism endpoints: closed/seated and fully open/extended views from the axes that reveal seams, stacking, clearance, and hidden parts.
- Runtime: load, resize, mobile viewport, console errors, context loss assumptions, and interaction.
- Performance: fixed near/mid/far cameras; deterministic geometry and pass counts; device timing as diagnostic data.
- Finish: identity-critical features, screen coverage, hierarchy of detail, edge treatment, material separation, contact/grounding, highlight clipping, and whether the final lighting supports the requested mood.

Use screenshot comparison and a scored rubric for every polished showcase, not only explicit photorealism. Improve the weakest category, then remeasure. A self-authored checklist, filename, or prose claim is not visual proof; inspect the exact final pixels at the intended viewport and typical camera. A subject-proof view must visibly isolate the feature it claims to prove. Do not trade a large visual loss for a metric that is already within budget.

Suggested realism rubric: silhouette/proportion 25, construction/anatomy and attachment 20, material/light response 20, surface detail and variation 15, motion/interaction 10, and Web presentation 10. Treat broken loading, severe artifacts, or missed performance targets as gates even when the visual subtotal is high.

## Finish the task

- Run build, asset audit, runtime tests, and visual checks.
- Exercise the visible user path for important states—such as opening the control panel and pressing Close—then verify the semantic value, rendered pose, and console. Do not validate only by setting an internal transform directly.
- Report deterministic before/after metrics separately from device-dependent FPS/GPU samples.
- State known limitations and the next highest-value optimization.
- Report the fidelity lane and status as complete, partial, blockout, or failed-validation. Never label a polished deliverable complete when required views, identity-critical features, material pass, final-file review evidence, or an available independent critic gate is missing or lower.
- Keep the final Web page or artifact accessible when the user requested it.
