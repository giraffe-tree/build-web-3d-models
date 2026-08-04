# Material realism from Blender to Web

## Contents

1. Set the completion contract
2. Write a material contract
3. Collect response evidence
4. Choose representation by visible scale
5. Author physical layers
6. Preserve material-family identity
7. Place wear by cause
8. Validate under controlled lighting
9. Degrade for Web without losing identity
10. Score and gate the result

## Set the completion contract

Treat material identity as behavior under light, not as a color texture. Build it from real scale, construction layers, reflection or transmission, microstructure, use state, and environment. Match the dominant highlight and layer response before adding scratches, dirt, pores, or other noise.

For a material-critical, reference-faithful, photoreal, or close-up hero asset:

- Write a material contract for every identity-critical material family before authoring it.
- Keep observed response separate from inferred response when the references do not reveal thickness, back faces, ageing, or lighting conditions.
- Validate the exported GLB in the actual target renderer. A Blender node graph or viewport render is source evidence, not delivery evidence.
- Declare unsupported source features and their fallback before relying on them.
- Keep the master material editable; derive Web tiers from it rather than destructively simplifying the only source.

Do not use texture resolution, node count, procedural complexity, or a single beauty render as a proxy for material fidelity.

## Write a material contract

Record a compact contract such as:

```yaml
material_id: case-painted-steel
real_material: powder-coated steel with exposed chips
layer_stack: steel > primer > color coat > dirt and handling oil
state_and_age: three years of indoor workshop use, dry
environment_and_use: handled at grip, dust settles on upward faces
real_scale: meters; coating and wear dimensions recorded in millimeters
closest_view: 0.25 m
typical_view: 1.2 m
response_evidence: neutral, grazing, edge-chip, and used-state photographs
identity_cues: broad paint highlight, fine orange peel, dark recess dirt, sparse metal exposure
representation: bevel geometry, baked normal, roughness masks, layer-exposure mask
required_shader_features: metallic-roughness core
runtime_support: verified in the installed exporter and loader
fallback: none required
texture_budget: one 2K base/normal/ORM set at LOD0
proof_views: neutral close-up, moving grazing light, final Web hero
uncertainties: hidden underside wear inferred from comparable tools
```

Use a real material name and state, not labels such as `black`, `shiny`, or `metallic`. Describe substrate, coating, exposed layers, contamination, and moisture separately. Limit identity cues to the three to six response features that must survive the typical view. Tie every required shader feature to verified runtime support and a declared fallback.

## Collect response evidence

Collect evidence that answers different questions:

1. Neutral or diffuse light for overall color and large-scale variation.
2. Grazing light or a readable highlight for roughness, coating, and directional response.
3. A close-up with scale for pores, grain, weave, machining, or aggregate size.
4. An edge, joint, cut, back face, or cross-section for thickness and layer construction.
5. New/used, dry/wet, clean/dirty, or warm/cold comparisons when state changes the identity.
6. Backlight for thin, translucent, transmissive, fibrous, or biological materials.

Record light direction, exposure, white-balance uncertainty, and whether a source is a photograph, scan, marketing render, or synthetic example. Do not infer color, roughness, thickness, IOR, and ageing from one front-lit photograph. Do not mix references with different finishes or states without marking the intended combination.

## Choose representation by visible scale

Map each observed phenomenon to the cheapest representation that survives the closest required view:

| Visible phenomenon | Preferred representation |
| --- | --- |
| Silhouette change, deep split, chipped edge, contact, or thickness | Geometry |
| Relief with readable parallax, deep embossing, large weave, or crack | Geometry, displacement, or height |
| Shallow relief and medium surface structure | Tangent-space normal |
| Pores, fine grain, machining, and micro-scratches | Detail normal plus roughness |
| Pigment, stains, oxidation, and dirt color | Base color with independent masks |
| Local crevice occlusion | AO, never baked direct light in base color |

Inspect near, typical, and far views. Replace sub-pixel geometry at the typical view with a normal, height, decal, or texture cue. Preserve geometry when it changes silhouette, contact, layer thickness, or a grazing highlight. Keep real-world scale consistent across UVs, triplanar projections, procedural noise, and detail normals.

## Author physical layers

Build the semantic stack before adding variation:

1. Substrate: metal, polymer, mineral, wood, fiber, tissue, or liquid.
2. Manufactured or biological structure: machining, grain, weave, pores, veins, or aggregate.
3. Coating: paint, glaze, varnish, clearcoat, oxide, wax, oil, or protective film.
4. Exposure and damage: chips, abrasion, compression, cracks, fraying, or delamination.
5. Deposits and state: dust, mud, water, grease, soot, frost, blood, or decay.

Follow these channel rules:

- Keep base color and emissive in sRGB; keep normal, roughness, metallic, AO, height, thickness, and masks linear.
- Keep base color free of painted lighting, specular highlights, and broad AO.
- Author roughness from micro-surface behavior. Do not copy or invert base color as roughness without evidence and deliberate remapping.
- Treat metallic as a material classification, not a gloss control. Painted metal is dielectric at the intact paint surface; expose metal only where the coating is actually absent.
- Keep normal convention, tangent generation, UV direction, and strength consistent with the target renderer.
- Use AO only as local occlusion support; do not use it to manufacture form or material separation.
- Treat emissive as visible radiance. Add lights, baking, or a supported GI strategy when the surface must illuminate its surroundings.

Use core metallic-roughness for standard conductors and dielectrics. Use clearcoat, sheen, anisotropy, transmission, IOR, volume/thickness, or a custom shader only when the phenomenon is identity-critical and the installed exporter and runtime preserve it. Blender Principled BSDF does not guarantee an equivalent glTF result. Convert, bake, approximate, or reconstruct unsupported nodes explicitly; never allow silent loss.

## Preserve material-family identity

| Material family | Preserve | Reject |
| --- | --- | --- |
| Exposed and coated metal | Conductive substrate, coating semantics, machining direction, oxide or primer layers, sparse causal chips | Making an intact painted surface metallic; using low roughness alone to signal metal; uniform bright edge wear |
| Plastic and rubber | Dielectric response, mold texture, orange peel or grain, parting lines, pressure polish, dust adhesion | One uniform roughness for every polymer; featureless pure-black rubber; metal-like plastic highlights |
| Glass and liquid | Real thickness, correct normals, IOR, transmission, absorption, boundaries, meniscus or flow direction | Low opacity as the only glass model; zero-thickness hero glass; coplanar container and liquid; untested sorting |
| Wood and stone | Structural grain direction and end grain; macro fracture or bedding before pores and aggregate | Wood grain crossing joints arbitrarily; stone made from uniform noise; color copied into roughness |
| Fabric and leather | Load-driven folds, seams, weave or nap direction, sheen, pores, oil polish, flex wear | Plastic-looking cloth; wrong weave scale; leather as brown noise; wear unrelated to handling or bending |
| Skin and hair | Regional color and oil variation, thickness cues, micro-normal, bounded SSS; fiber-aligned hair highlights and distance tiers | One face-wide roughness; waxy uniform SSS; hair cards shaded like ordinary plastic planes |
| Vegetation | Thin-sheet construction, front/back response, veins, waxy roughness, age and damage tied to biology, credible backlight | Mirror-like or cardboard leaves; plant-wide random discoloration; uniform glow; unnecessary blended overdraw |
| Ceramic, paper, and emissive surfaces | Substrate/coating separation, fiber or glaze scale, edge thickness, controlled emission and exposure | Treating glaze as bare metal; paper with no fiber/thickness cue; emissive washout used to hide missing structure |

For skin subsurface scattering, complex layered liquids, spectral effects, and other models outside the target glTF path, choose a verified custom runtime shader or declare an approximation. Do not claim physical parity when only the base color survives export.

## Place wear by cause

Derive wear and deposits from use, construction, environment, and gravity before using noise to break up their boundaries:

- Put abrasion and collision damage on exposed edges and contact paths.
- Put handling oil and polish on grips, buttons, seats, and frequently touched faces.
- Put dust and standing moisture on upward faces; put grime in recesses and joints.
- Align rain streaks, leaks, sediment, and drips with gravity and flow.
- Put mud and spray near wheels, feet, ground contact, and travel direction.
- Put heat discoloration, soot, oxidation, or chemical attack near plausible sources.
- Put fabric whitening, stretch, pilling, and fray along load, fold, and friction directions.
- Reveal coating layers in order: finish, primer or undercoat, then substrate.

Use semantic masks, contact history, flow direction, curvature, ambient occlusion, and hand-authored control together. Do not distribute scratches uniformly, erode every edge equally, add rust to materials that do not rust that way, or change color without the related roughness, normal, thickness, or exposed-layer response.

## Validate under controlled lighting

Build one reproducible material review rig:

1. Use a neutral environment to check color, energy, and broad reflection.
2. Use a large soft source to check the dominant highlight width and layer response.
3. Move a hard grazing source to expose roughness, normals, seams, tiling, and compression artifacts.
4. Use backlight for glass, liquid, skin, fabric, paper, foliage, and other thin or transmissive materials.
5. Use the final environment to verify art direction, exposure, and surrounding context.

Lock camera, exposure, white balance, tone mapping, background, semantic state, and material version. Capture closest, typical, and three-quarter views. For an identity-critical hero material, add a light sweep or turntable; a static image cannot fully prove directional highlights or stable transmission.

Capture final evidence from the exported GLB in the target Web runtime. Use the required `neutralMaterial` view and make `subjectProof` a readable material close-up when material fidelity is the subject's primary risk. Invalidate and recapture evidence after any pixel-affecting material, lighting, camera, compression, export, or runtime change.

## Degrade for Web without losing identity

Verify actual support in the project's Blender exporter, glTF validator, loader, renderer, and device tier. Do not hard-code a support assumption from a newer tool version.

Derive explicit runtime tiers:

- **Near**: preserve identity-defining reflection or transmission lobes, roughness, normals, thickness, and required extensions.
- **Mid**: merge compatible detail normals, reduce texture resolution, simplify secondary lobes, and retain the dominant response.
- **Far**: merge only visually compatible materials, reduce samples and transparent layers, and use cards or impostors after parallax disappears.
- **Mobile**: first reduce transparent overdraw, transmission/refraction, layered lobes, dynamic reflections, and oversized textures while retaining the material's primary cue.

Reduce cost in this order: remove invisible microdetail; compress or lower resolution; merge secondary detail layers; bake a documented approximation; simplify expensive transparency or advanced BRDF features; sacrifice identity only after reporting that the target cannot fit.

After KTX2/Basis or channel packing, recheck normal direction and strength, roughness response, alpha edges, ORM order, tiling, and banding. Record both compressed download size and decoded texture-memory cost. Inspect an independent glTF viewer for portability, then treat the actual production renderer as authoritative.

## Score and gate the result

Use this material-specific diagnostic rubric when material realism is a primary acceptance criterion:

- Material identity and layer construction: 20
- Highlight, roughness, reflection, and transmission response: 25
- Real scale and multi-scale detail: 15
- Microstructure and controlled variation: 15
- Causal wear and environmental state: 10
- Stability across neutral, grazing, backlit, and final lighting: 10
- Blender-to-Web parity: 5

Default to `80/100` for a material-critical completion gate unless the brief declares another threshold. Treat this as a diagnostic subscore alongside the overall asset rubric; the lower status controls. A passing total cannot override a hard failure.

Treat these as hard failures for an identity-critical material:

- wrong color space, tangent convention, real texture scale, or metallic semantics;
- a missing identity-defining layer, thickness, directional response, or supported fallback;
- obvious UV seams, repeated tiling, transparent sorting, z-fighting, or compression damage at the required view;
- wear that contradicts use, gravity, construction order, or material chemistry;
- a material feature that silently disappears or materially changes in the exported Web result;
- missing neutral, grazing, final-environment, or exact-final-GLB evidence;
- broken runtime, failed export validation, or exceeded declared performance budget.

When the result misses the threshold or a gate, preserve the best artifact, name the failed category and unsupported features, and label the material or asset `partial` rather than claiming AAA or photoreal completion.
