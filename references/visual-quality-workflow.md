# Visual quality and finish workflow

## Contents

1. Choose a fidelity lane
2. Translate 3A or AAA intent
3. Establish visual evidence
4. Select a pipeline from the finish target
5. Use pass gates
6. Build an asset-aware presentation
7. Review rendered evidence
8. Protect quality during optimization
9. Delivery evidence and anti-patterns

## Choose a fidelity lane

Record one lane in the asset brief before choosing tools:

- **Blockout**: proves scale, silhouette, hierarchy, interaction, or feasibility. Flat or provisional materials and explicit omissions are acceptable. Call it blockout or partial, never finished.
- **Polished stylized**: coherent art direction, softened/highlight-bearing edges, deliberate material separation, secondary construction, controlled variation, and a composed final presentation. This is the default when a user asks for a finished showcase without asking for photorealism.
- **Reference-faithful**: matches supplied or collected evidence for proportions, construction, identity features, materials, and visible wear. Hidden regions remain labelled by confidence.
- **Photoreal hero**: survives close inspection with authored high-frequency surface response, accurate light transport cues, reference-grade proportions, and a production presentation rig.

Do not lower the lane because the easiest available implementation is procedural. If the requested lane cannot be reached with the current tools or evidence, change pipeline, request input, or deliver a clearly labelled partial result.

## Translate 3A or AAA intent

Treat 3A/AAA as a production-scope request, not a fifth fidelity lane or a synonym for “more polygons.” Keep one existing fidelity lane, then classify the deliverable:

- **Static hero**: one asset or fixed scene judged at declared close, typical, and silhouette views. It may reach an `AAA-inspired hero finish`, but a beauty render alone cannot prove full game-production parity.
- **Interactive hero**: add mechanism endpoints, animation/deformation quality, temporal stability, response states, and deterministic interaction evidence.
- **Explorable scene**: add spatial coverage, near/mid/far content tiers, collision/navigation as applicable, component LOD/HLOD, streaming, culling, shadow/light tiers, and traversal-time stability.

Convert the label into a compact gap matrix before production. Record `verified`, `partial`, or `missing` for:

1. proportion, silhouette, and human scale;
2. construction/anatomy, joints, thickness, and contact;
3. topology, UVs, texel density, baking, and tangent parity;
4. material identity, physical layers, macro/meso/micro response, and causal state;
5. lighting, indirect response, shadows, exposure, and temporal stability;
6. environment, ground, vegetation, and near-camera hero modules when in scope;
7. LOD, streaming, compression, memory, passes, and target-device performance;
8. source editability, naming, export validation, runtime diagnostics, and evidence traceability.

Declare the target device, closest distance, FOV, screen coverage, runtime states, scene extent, file/download/memory budgets, and the evidence that closes each applicable row. A high total score cannot compensate for a `missing` identity-critical row.

Set `aaaTarget: true` in new schema-v3 quality evidence when the user explicitly requests 3A/AAA production intent. Keep it `false` for ordinary polished work; do not infer the label from visual ambition alone.

For 3A/AAA architecture, apply the assembly-sheet, exact-runtime construction/material spike, and independent pre-production review gates routed through `architecture-environment-quality.md`.

Do not claim full AAA production parity when only a static hero, one camera, one LOD, uncompressed source textures, or untested animation states exist. State the narrower achievement and list the missing production rows.

## Establish visual evidence

For polished work, collect or produce evidence for four different questions:

1. Front/side/three-quarter silhouette and real dimensions.
2. Construction, joints, openings, thickness, and negative spaces.
3. Material close-ups under neutral and grazing light.
4. Final presentation mood, camera height, lens character, and background relationship.

When the user supplies no images, use four to eight strong factual sources if browsing is available. Prefer official dimensions plus real photographs; do not treat a single marketing render as construction evidence. For an original polished asset, assemble a compact visual target board with at least three images covering silhouette/construction, material response, and presentation mood. When real references do not define a unique original direction, apply the image-assisted workflow routed by SKILL.md and invoke a dedicated image-generation skill to author the missing concept or texture target. Label generated images as art direction: they cannot prove dimensions, hidden construction, manufacturing, anatomy, material physics, or reference fidelity. Text pages can establish dimensions and facts, but they cannot by themselves anchor visible finish. When browsing and image generation are unavailable, state that the asset is a generic art-directed interpretation.

Create an identity inventory with five to twelve cues. Each cue must map to geometry, material/texture, hierarchy, or an explicit omission, and is recorded as a triple: the visible cue, its attachment/construction logic (how it physically connects or is built, per the joint vocabulary below), and the proof view that will isolate it. Examples:

- A laptop: shell wedge, closed-stack thickness, hinge exposure, keyboard field, trackpad proportion, port recess, display glass, edge radius, material break.
- A mature tree: crown envelope, trunk taper, primary branch rhythm, branch-to-trunk junction, terminal density, leaf silhouette, biological attachment, bark response, grounded root flare.
- An ergonomic chair: human-scale seat/back relationship, load path, five-star stance, caster scale, mesh tension, lumbar mechanism, arm connection, control hardware, edge softness, upholstery response.

“Recognizable as a chair/tree/laptop” is a blockout gate, not a finish gate.

### Joint vocabulary

Declare the mechanical type of every part connection in the brief, before production: bolted, welded, press-fit, hinged, bearing, glued, or monolithic (formed as one continuous piece). Bind each declared joint to a dedicated close proof view that isolates the connection at readable scale. The declared type drives the geometry: a bolted joint shows fasteners and washers, a welded joint shows a bead and transition, a press-fit shows an interference seam, a hinge shows pin and knuckle, a bearing shows race and axle.

Named failure mode: implying a connection by making two parts tangent and changing their color. The chair-v2 blind review hit this repeatedly—reviewers read tangent-plus-color-change as parts floating next to each other, not as a joint. A connection whose type is not declared in the brief counts as not established in review, regardless of how the render looks.

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

For procedural-only polished work, replace self-reported answers with an exact-runtime finish spike before full production. Render the highest-risk edge, construction junction, material transition, and support/contact at the closest view with the final renderer and representative compression. Record a pass or the pipeline escalation. If the spike still reads as bare primitives, constant roughness, unscaled noise, missing thickness, or floating contact, switch to Blender or hybrid before building the rest. For exterior buildings, use the routed roof/eave, opening/envelope, and base/site spike.

## Use pass gates

Do not skip from blockout to final integration.

### Pass 0 — brief and evidence

- Fidelity lane, target device, closest/typical view, screen coverage, identity inventory, material families, motion states, delivery budget, and required screenshots are declared.
- Every identity-critical material has a compact contract covering its real identity, layer stack, state, scale, response evidence, runtime support, fallback, and proof view.
- References distinguish observation from inference.
- Every part connection has a declared mechanical type from the joint vocabulary and a bound close proof view.
- Generated concepts and texture sources declare their role and provenance and are not counted as factual evidence.
- A polished original has a visual target board; every identity-critical feature has at least one pixel reference or an explicit art-direction decision.
- Pipeline route, closest-view quality risks, finish-spike requirement, escalation condition, and proof views are declared.

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
- Identity-critical materials preserve their physical layer order and dominant reflection, transmission, sheen, anisotropy, or subsurface cue; wear follows contact, use, gravity, flow, and material chemistry instead of uniform noise.
- Neutral, grazing, and final lighting separate materials without relying on labels or arbitrary colors.
- The exported GLB in the actual runtime matches the authored material identity; unsupported source features have an explicit, reviewed fallback.
- No large unintended clipping, crushed black regions, plastic-looking roughness uniformity, or emissive washout remains.
- Every identity-critical material closes evidence or art direction → authored representation → exact runtime binding → proof. Macro, meso, and micro scale bands are recorded; an omitted band has a view-based reason.

### Pass 4 — detail and presentation

- High-frequency detail is represented at the cheapest form that survives projected size.
- Camera, FOV, target, exposure, background, floor/contact treatment, hero state, and lighting are asset-aware rather than inherited blindly from a generic demo shell.
- The subject occupies the intended frame; UI and titles do not obscure the review area.
- Declared support and ground contacts remain readable and do not float, intersect, or rely on a broad shadow to hide missing construction.

### Pass 5 — runtime proof

- The actual Web route loads the current asset, reaches important semantic states through visible controls, resizes correctly, and reports clean console/runtime diagnostics.
- Browser frame counts include shadow, depth, reflection, and post passes.
- Fixed screenshots correspond to the current asset version and declared semantic state.
- The production build and exported-asset hashes match the reviewed material bindings, lighting profile, and final evidence.

For polished work, a pass is not complete until its rendered evidence has been inspected. Code presence and self-authored checklists are insufficient. Do not begin Pass 4 or Pass 5 while a mandatory Pass 2 construction group or Pass 3 material group lacks exact-runtime evidence.

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

Add conditional proof views instead of overloading `subjectProof`: grazing light for identity-critical roughness/normal response, backlight for thin or transmissive materials, contact proof for grounded/supporting assemblies, and the routed architecture-specific views for polished exterior buildings and sites.

The hero may retain the intended page composition when Web presentation is part of the request. Orbit, neutral-material, and subject-proof evidence should normally use an asset-review mode with nonessential UI hidden. A proof filename is not proof: the pixels must isolate the claimed construction, material, endpoint, or biological feature at a readable scale.

After each review round, record:

- the three largest visible defects, ordered by impact, as ranked by the fresh-context reviewer when one is available; the builder's own ranking is recorded separately and treated as advisory;
- the evidence for each defect;
- the one defect addressed next;
- what changed and what visibly improved;
- what remains and whether status is complete or partial.

Run at least two screenshot review rounds for a finished polished showcase. Default to no more than three rounds per phase without new evidence or a changed strategy. The last round must inspect the exact final files. If any later change can alter pixels—including camera, lighting, material, semantic state, UI, capture code, or asset export—recapture the views and repeat the final review. Bind the final review to view hashes when evidence is retained.

Use the 100-point rubric as a decision aid: silhouette/proportion 25, construction/attachment 20, material/light response 20, surface detail/variation 15, motion/interaction 10, Web presentation 10. The brief may raise lane-specific minimums, but it cannot lower the schema-v3 polished policy. Never let the total hide a missing identity-critical feature, construction/material/contact gate, or broken runtime gate. Default non-compensable floors for polished-stylized are 17/25 silhouette, 13/20 construction, 13/20 material/light, 9/15 surface detail, and 7/10 Web presentation; reference-faithful and photoreal work should declare stricter floors.

When fresh subagents are available, each review round's top-defect ranking comes from a fresh-context reviewer, not the builder. A builder's screenshot self-check reliably catches only obvious breakage—clipping, missing parts, black frames; it misses the larger class of “looks right but reads wrong” defects, because the builder sees the intended semantics rather than the pixels. Give the reviewer only the original request, fidelity lane, and rendered views. Ask it to rank visible defects and score the rubric. Anti-anchoring: do not reveal implementation constraints, the author's self-score or self-ranked defects, suspected failures, or intended revisions. Treat builder scores and defect lists as advisory. The critic's lower score or status has completion authority: perform at most one bounded repair followed by a fresh critique, or deliver with the critic's lower status. Never retain `complete` merely because machine checks and a self-score passed.

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

Store those claims in a compact quality-evidence JSON when the project can retain test artifacts, then run `python3 scripts/validate_visual_evidence.py <manifest.json>`. Use schema v3 for new polished work. It adds a non-lowerable polished policy, pipeline/finish-spike evidence, critical material contracts, finish checks, runtime binding, and architecture-specific gates while preserving exact view hashes and critic authority. Older schemas remain useful for historical or partial evidence, but cannot validate a new polished `complete` claim. The validator checks evidence integrity and declared gates; it does not replace visual judgment or an independent critic.

Avoid these failure patterns:

- forcing every Web asset into primitives or zero textures;
- using the same low budget for unrelated asset families;
- using one shared light/exposure/camera rig for every subject;
- accepting one auto-framed animated screenshot as proof of quality;
- treating “recognizable” as equivalent to polished;
- treating a generated concept as factual reference evidence or assuming independently generated views are construction-consistent;
- using a self-authored brief as its own validation evidence;
- changing pixels after the final review without invalidating and recapturing it;
- claiming a subject-proof feature that the proof image does not actually isolate;
- keeping a builder's `complete` status after an available blind critic returns `partial` or `blockout`;
- polishing UI around a visibly unfinished model;
- optimizing already-passing metrics while the subject remains generic, sparse, flat, or materially uniform;
- claiming a realism score without rendered multi-view evidence and an independent critique when one is available.
