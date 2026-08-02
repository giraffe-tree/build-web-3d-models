# Visual quality and finish workflow

## Contents

1. Choose a fidelity lane
2. Establish visual evidence
3. Select a pipeline from the finish target
4. Use pass gates
5. Build an asset-aware presentation
6. Review rendered evidence
7. Protect quality during optimization
8. Delivery evidence and anti-patterns

## Choose a fidelity lane

Record one lane in the asset brief before choosing tools:

- **Blockout**: proves scale, silhouette, hierarchy, interaction, or feasibility. Flat or provisional materials and explicit omissions are acceptable. Call it blockout or partial, never finished.
- **Polished stylized**: coherent art direction, softened/highlight-bearing edges, deliberate material separation, secondary construction, controlled variation, and a composed final presentation. This is the default when a user asks for a finished showcase without asking for photorealism.
- **Reference-faithful**: matches supplied or collected evidence for proportions, construction, identity features, materials, and visible wear. Hidden regions remain labelled by confidence.
- **Photoreal hero**: survives close inspection with authored high-frequency surface response, accurate light transport cues, reference-grade proportions, and a production presentation rig.

Do not lower the lane because the easiest available implementation is procedural. If the requested lane cannot be reached with the current tools or evidence, change pipeline, request input, or deliver a clearly labelled partial result.

## Establish visual evidence

For polished work, collect or produce evidence for four different questions:

1. Front/side/three-quarter silhouette and real dimensions.
2. Construction, joints, openings, thickness, and negative spaces.
3. Material close-ups under neutral and grazing light.
4. Final presentation mood, camera height, lens character, and background relationship.

When the user supplies no images, use four to eight strong sources if browsing is available. Prefer official dimensions plus real photographs; do not treat a single marketing render as construction evidence. When browsing is unavailable, state that the asset is a generic art-directed interpretation and do not claim reference fidelity.

Create an identity inventory with five to twelve cues. Each cue must map to geometry, material/texture, hierarchy, or an explicit omission. Examples:

- A laptop: shell wedge, closed-stack thickness, hinge exposure, keyboard field, trackpad proportion, port recess, display glass, edge radius, material break.
- A mature tree: crown envelope, trunk taper, primary branch rhythm, branch-to-trunk junction, terminal density, leaf silhouette, biological attachment, bark response, grounded root flare.
- An ergonomic chair: human-scale seat/back relationship, load path, five-star stance, caster scale, mesh tension, lumbar mechanism, arm connection, control hardware, edge softness, upholstery response.

“Recognizable as a chair/tree/laptop” is a blockout gate, not a finish gate.

## Select a pipeline from the finish target

Choose the cheapest route that can satisfy the closest required view:

- Use Three.js procedural geometry for parametric systems, repeated modules, analytical surfaces, seeded layout, runtime deformation, and intentionally graphic low-poly art direction.
- Use Blender for unique hard-surface bevel language, sculpted organic form, art-directed asymmetry, UV-dependent material work, baking, retopology, or authored wear.
- Use hybrid for authored hero modules plus procedural assembly, variation, animation, LOD, interaction, and Web diagnostics.

Before committing to procedural-only for a polished hero, answer:

- How will edges produce controlled highlight widths?
- Where do unique surface details, labels, seams, wear, grain, pores, veins, or normal variation come from?
- Can the silhouette and construction be art-directed without fighting primitive topology?
- Can the material response survive the neutral close view?

If two answers are missing, switch to Blender or hybrid. Do not ban textures, decals, environment maps, or baked maps as a proxy for good Web performance. Budget them from screen size and target device.

## Use pass gates

Do not skip from blockout to final integration.

### Pass 0 — brief and evidence

- Fidelity lane, target device, closest/typical view, screen coverage, identity inventory, material families, motion states, delivery budget, and required screenshots are declared.
- References distinguish observation from inference.

### Pass 1 — macro blockout

- Hero and two orbit silhouettes read without labels.
- Overall proportions, centre of mass, negative spaces, ground contact, and screen coverage are credible.
- For reference work, compare landmarks or overlays before adding detail.

Do not start tertiary detail until the largest silhouette and proportion defects are corrected.

### Pass 2 — construction and secondary form

- Thickness, bevel-bearing edges, joints, openings, attachment, load paths, and mechanism endpoints are present.
- Identity-critical meso features are visible at the typical camera.
- Hidden-side assumptions remain plausible from orbit views.

### Pass 3 — materials and surface response

- Every retained material family has deliberate base color, roughness, metallic response, normal/height strategy, and scale-appropriate variation.
- Neutral, grazing, and final lighting separate materials without relying on labels or arbitrary colors.
- No large unintended clipping, crushed black regions, plastic-looking roughness uniformity, or emissive washout remains.

### Pass 4 — detail and presentation

- High-frequency detail is represented at the cheapest form that survives projected size.
- Camera, FOV, target, exposure, background, floor/contact treatment, hero state, and lighting are asset-aware rather than inherited blindly from a generic demo shell.
- The subject occupies the intended frame; UI and titles do not obscure the review area.

### Pass 5 — runtime proof

- The actual Web route loads the current asset, reaches important semantic states through visible controls, resizes correctly, and reports clean console/runtime diagnostics.
- Browser frame counts include shadow, depth, reflection, and post passes.
- Fixed screenshots correspond to the current asset version and declared semantic state.

For polished work, a pass is not complete until its rendered evidence has been inspected. Code presence and self-authored checklists are insufficient.

## Build an asset-aware presentation

Keep the reusable asset factory independent, but let the presentation consume an explicit profile:

- hero camera transform or direction, FOV, target, and desired screen coverage;
- fixed semantic state and animation time for capture;
- background, floor/contact style, tone mapping, exposure, environment/fill/key/rim profile;
- shadow caster policy and close/mid/far behavior;
- neutral material-review profile separate from the final mood;
- UI-safe frame bounds so titles and diagnostics do not cover the subject.

Auto-framing a bounding sphere is a starting point, not art direction. Terrain, emissive fungi, polished metal, translucent mesh, foliage, and architecture should not share one immutable light rig or exposure.

For a hero screenshot, target deliberate occupancy—often roughly 50–75% of the usable frame on the subject's dominant axis—unless the brief calls for environmental scale or negative space. Verify the percentage from the usable canvas after excluding UI overlays.

## Review rendered evidence

Lock at least these views for polished work:

1. Final hero presentation at a named semantic state and fixed time.
2. Orbit A showing depth, attachment, and the most important hidden side.
3. Orbit B from a meaningfully different elevation or side.
4. Neutral material view with controlled exposure.
5. Subject-specific proof: close-up, mechanism endpoint, silhouette, interior, or scale view.

After each review round, record:

- the three largest visible defects, ordered by impact;
- the evidence for each defect;
- the one defect addressed next;
- what changed and what visibly improved;
- what remains and whether status is complete or partial.

Run at least two screenshot review rounds for a finished polished showcase. Default to no more than three rounds per phase without new evidence or a changed strategy.

Use the 100-point rubric as a decision aid: silhouette/proportion 25, construction/attachment 20, material/light response 20, surface detail/variation 15, motion/interaction 10, Web presentation 10. The brief may declare a lane-specific minimum; never let the total hide a missing identity-critical feature or broken runtime gate.

When fresh subagents are available, give a critic only the original request, fidelity lane, and rendered views. Ask it to rank visible defects and score the rubric. Do not reveal implementation constraints, the author's self-score, suspected failures, or intended revisions.

## Protect quality during optimization

Set asset-specific budgets from target device, screen coverage, repetition, materials, shadows, and delivery size. Never impose one universal triangle/draw limit across a tree, cabin, chair, terrain, and compact prop.

Optimize in this order:

1. Remove invisible or multiplicative waste.
2. Use instancing, LOD, culling, compressed textures, and cheaper shadow casters.
3. Replace sub-pixel geometry with normal/height/decal/texture cues.
4. Reduce pass cost that does not affect the final image.
5. Simplify visible form only after preserving identity, silhouette, contact, and material separation.

Measure the actual runtime passes. A source module with 32 visible draws may exceed a 45-draw frame budget after shadows. Once the asset fits, stop optimizing unless the user asked for more headroom.

## Delivery evidence and anti-patterns

A polished delivery should include:

- editable source and derived runtime asset/code;
- the asset brief and identity inventory;
- fixed hero/orbit/material/subject-specific screenshots;
- a compact review ledger with at least two rounds;
- deterministic asset counts and actual browser pass counts;
- known limitations and status: complete, partial, blockout, or failed-validation.

Avoid these failure patterns:

- forcing every Web asset into primitives or zero textures;
- using the same low budget for unrelated asset families;
- using one shared light/exposure/camera rig for every subject;
- accepting one auto-framed animated screenshot as proof of quality;
- treating “recognizable” as equivalent to polished;
- using a self-authored brief as its own validation evidence;
- polishing UI around a visibly unfinished model;
- optimizing already-passing metrics while the subject remains generic, sparse, flat, or materially uniform;
- claiming a realism score without rendered multi-view evidence and an independent critique when one is available.
