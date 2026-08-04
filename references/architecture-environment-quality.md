# Architecture and environment quality gates

## Contents

1. Scope and fidelity
2. Lock construction identity
3. Prove the pipeline with a finish spike
4. Build architecture as assemblies
5. Author architectural materials and light
6. Ground the building in a site
7. Capture architecture-specific evidence
8. Hard failures and completion

## Scope and fidelity

Use this workflow for houses, buildings, rooms, streets, courtyards, and hero environments in polished-stylized, reference-faithful, or photoreal lanes. Treat words such as high-quality, premium, refined, cinematic, and highly detailed as polished intent unless the user explicitly requests a blockout or graphic low-poly result.

Set `assetProfile: architecture-exterior` for an exterior building and `environment` for a stand-alone site, street, courtyard, or interior/environment scene. Set `siteEnvironment` and `regionalStyle` explicitly. The roof/eave proof and building assembly groups are mandatory only for `architecture-exterior`; do not force them onto a room or non-building environment.

When the request names a regional, vernacular, or historical style, validate the visible construction cues as reference-faithful even if the overall presentation is stylized. Do not reduce Japanese, Scandinavian, Mediterranean, industrial, or other identities to a color palette and a few decorative props. For `architecture-exterior`, choose evidenced roof, envelope, opening, edge, drainage, and base systems. For `environment`, choose evidenced spatial organization, boundary, circulation, material, furnishing or planting, and ground/contact systems that are actually in scope.

If evidence cannot resolve an identity-critical visible assembly, request the missing view or record a generic art-direction decision. A generic interpretation may still be polished, but it cannot claim reference-faithful regional construction.

## Lock construction identity

For `architecture-exterior`, make these mandatory feature groups critical in the brief and quality evidence:

- `massing-scale`: human scale, floor heights, roof pitch, occupied openings, and overall proportions;
- `roof-system`: visible surface rhythm, overlaps or seams, ridge/hip/valley conditions, eave termination, thickness, and drainage path;
- `envelope-openings`: wall build-up, reveals, sills, frames, glazing or screens, door thresholds, and visible interior parallax;
- `edges-connections`: corners, trim, fascia/rake, posts, beams, joints, flashings, fasteners, and believable assembly order;
- `material-response`: identity-critical exterior and interior families at real scale;
- `base-ground-contact`: foundations, plinths, steps, decks, supports, grade changes, and ground transitions;
- `site-vegetation`: near/mid/far plant structure and causal placement when the requested scene includes a site;
- `regional-cues`: the evidenced assemblies that make a named regional or historical style specific rather than generic.

For `environment`, require `environment-scale`, `material-response`, and `base-ground-contact`; add `site-vegetation` and `regional-cues` when their flags are true. Do not invent a roof-system requirement for a room, street, courtyard, terrain, or other scene without a hero building.

Map each retained cue to geometry, normal/height, decal/texture, hierarchy, lighting, or an explicit omission. Do not select only easy category cues such as “two floors,” “pitched roof,” and “garden.”

## Prove the pipeline with a finish spike

Before full-scene production, make a small exact-runtime finish spike when the route is procedural-only or when the chosen pipeline has not already proved the required finish. Use the final renderer, tone mapping, target DPR, closest camera, and representative compression. For `architecture-exterior`, include:

1. one roof/eave/wall junction;
2. one opening/envelope junction;
3. one base/ground/near-vegetation contact when a site is present.

Write a `mustShow` contract for each spike. The roof view must show field rhythm, termination, eave underside, fascia/rake, wall connection, and drainage; the opening view must show wall return, frame/screen/glazing thickness, sill/track/threshold, and interior return; the base view must show support/load path, grade transition, drainage or embedment, and contact light. Frame each high-risk region large enough to inspect—normally at least 35% of the image's short axis—and remove nonessential UI.

For `environment`, choose three profile-relevant regions that together prove scene scale or spatial hierarchy, the highest-risk construction/material transition, and support/ground/contact. Do not require a roof or opening when the scene does not contain one.

The spike must show the actual representation planned for the final asset, not a higher-quality offline placeholder. At the closest view:

- give every exposed primary edge expected to span at least two pixels a readable bevel or evidenced sharp treatment;
- represent visible overlaps, seams, gaps, thickness, contact, and parallax with geometry, height/normal, decal, or a reviewed material layer;
- demonstrate macro, meso, and micro material scale without constant roughness or one uniform noise field;
- prove stable neutral, grazing, and final-light response;
- prove that ground and support contacts do not float or intersect without construction logic.

For a 3A/AAA or photoreal target, capture neutral and grazing versions of every construction/material spike and add backlight for paper, glazing, foliage, or other thin layers. Give the brief and spike pixels—not implementation claims—to a fresh reviewer before full-scene production. Record the report binding, reviewer run ID, and verdict in `pipelineDecision.finishSpike.independentReview`; set `aaaTarget: true` for an explicit 3A/AAA request. Any failed mandatory group blocks UI/presentation polish and full-scene propagation; after one pipeline escalation, retain the evidence and cap the route at `partial`.

If any spike region still reads as a bare box/cylinder assembly, large unscaled surface, repeated strip pattern, constant-roughness plastic, emissive transparency substitute, or floating contact, switch to Blender or hybrid before building the full scene. After one pipeline escalation, if the same finish failure remains, preserve the spike and declare `partial` instead of hiding it with UI, mood lighting, or more procedural noise.

## Build architecture as assemblies

Model visible construction order, not only the final envelope silhouette.

Before geometry propagation, make three compact assembly sheets for any identity-critical exterior: roof/drainage, wall/opening, and base/support/ground. Record visible layer order, approximate thickness, termination, load or water path, repeated and unique modules, LOD/bake representation, and the exact view that will prove the junction. Missing a visible identity-critical layer blocks the full build even when the silhouette is already recognizable.

- Roofs: preserve near-LOD rhythm, overlap or standing-seam logic, ridges, hips, valleys, edge tiles or caps, eave undersides, fascia/rake, gutters or an evidenced no-gutter detail, and connections to walls. Move sub-pixel repetition to normal/height only after the near view proves terminations and thickness.
- Walls: preserve cladding module direction, board or panel terminations, corners, expansion/control joints, plaster depth, repairs, and water paths. Do not wrap one texture continuously across structurally unrelated faces.
- Openings: give walls, frames, glazing, screens, sills, lintels, thresholds, and recesses real thickness. Preserve interior parallax visible from the required orbit and avoid black rectangles or zero-thickness transparent planes.
- Timber and structure: show load paths, post/beam depth, joinery or plausible concealed connections, end grain where exposed, and shadow gaps at real assemblies.
- Decks, stairs, and engawa-like thresholds: preserve boards, nosings, supports, risers, edge build-up, drainage gaps, and contact with the building and site.

Use modularity for reuse, not as permission to leave hero modules primitive. Inspect one repeated module at the closest view before instancing it across the scene.

For explorable or 3A/AAA-targeted scenes, author LOD by construction component rather than uniformly decimating the whole building. Keep ridges, eaves, opening depth, base silhouette, and hero ground contacts through the mid tier; move repeated field detail to normal/height only after parallax disappears. Capture the frame immediately before and after each switch from fixed near/mid/far cameras, use hysteresis or cross-fade where needed, and reject silhouette, roughness, or contact-shadow pops. Recheck high-to-low bakes for cage misses, tangent/UV seams, padding, channel packing, compression, and double AO in the exact Web runtime.

## Author architectural materials and light

For every identity-critical material, close the chain from evidence or art direction to authored representation, exact runtime binding, and proof view. Record macro, meso, and micro scale bands with physical dimensions or a view-based omission.

Large hero surfaces cannot pass a polished gate with only a flat base color and scalar roughness, or with one scale of generic procedural noise, unless the declared art direction is intentionally graphic and the independent critic accepts it. Preserve material-specific cues such as:

- wood board layout, grain direction, end grain, finish, exposure, checking, and joint termination;
- plaster or concrete binder/aggregate scale, trowel/form marks, construction joints, porosity, repairs, and water paths;
- ceramic, slate, or metal roof rhythm, thickness, edge response, weather exposure, and runoff variation;
- glazing, paper screens, curtains, and translucent layers with real thickness or an explicit supported approximation.

Store a reproducible lighting profile for proof views: renderer/build, color space, tone mapping, exposure, environment source, light roles and transforms, shadow/contact strategy, and fallback tier. Use an environment, probes/lightmaps, or another verified indirect-light strategy when the scene depends on sky fill, interior bounce, or emissive spill. Emissive color alone does not prove that a window, screen, or lamp illuminates adjacent surfaces.

Require neutral and grazing material views. Add backlight for thin/transmissive assemblies and a contact view for foundations, decks, stairs, rocks, and near vegetation.

## Ground the building in a site

Treat the site as a designed multi-scale system rather than decorative scatter.

- Establish grade, drainage, paths, soil/gravel/stone transitions, compaction, and building-edge conditions before small props.
- Embed rocks, steps, posts, trunks, and roots with plausible contact transitions; avoid tangent placement on a flat plane plus a broad shadow.
- Use near, mid, and far vegetation tiers. When a near plant is at least 32 pixels tall, preserve readable trunk/stem/branch/leaf or blade hierarchy and ground attachment.
- Vary scale, lean, age, density, hue, and orientation deterministically. Tie distribution to paths, boundaries, light, moisture, maintenance, slope, or shelter instead of uniform random scatter.
- Preserve a small number of authored hero plants and stones near the camera; use instances, cards, and impostors farther away.

A building that is detailed above grade but floats at the foundation, deck, step, or planting edge remains incomplete.

## Capture architecture-specific evidence

For `architecture-exterior`, capture these in addition to the universal hero, two orbit, neutral-material, and subject-proof views:

- `roofEaveClose`: roof rhythm, termination, underside, thickness, and wall connection;
- `openingJunctionClose`: reveal, frame/screen/glazing thickness, sill/threshold, and interior parallax;
- `baseGroundContact`: foundation or support, grade transition, step/deck contact, and contact light;
- `landscapeNear`: required when a site is in scope; prove a near plant or rock, ground material, placement variation, and attachment.

For `environment`, require `landscapeNear` only when `siteEnvironment` is true; otherwise use subject-specific scale, construction, material, and contact views without exterior roof gates.

Use review mode without nonessential UI. One beauty view cannot substitute for these risk-isolating views. Bind the captures to the exact runtime build and lighting profile.

## Hard failures and completion

Treat these as hard failures for polished architecture:

- any mandatory feature group is missing, partial, or supported only by a label;
- a finish spike required for procedural-only work is absent or failed;
- visible roof, opening, edge, or base construction remains a bare primitive or repeated strip without readable assembly logic;
- an identity-critical large surface has unexplained constant roughness, one-scale noise, or no real-scale material response;
- opacity or emissive color substitutes for identity-critical glass, paper, screen, or interior light transport without a reviewed fallback;
- a foundation, deck, step, rock, trunk, or hero plant visibly floats or intersects without plausible embedment;
- the architecture-specific proof views are missing, hide the feature, or do not match the reviewed build;
- performance passes only after removing visible regional identity, construction depth, material separation, or grounding.

Do not begin presentation polish or final runtime integration while a mandatory construction or material group lacks exact-runtime evidence. If evidence or tools cannot close a gate, preserve the best artifact and deliver it as `partial`, `blockout`, or `failed-validation` as appropriate.
