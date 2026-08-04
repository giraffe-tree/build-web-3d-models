# Material realism from Blender to Web

## Contents

1. Set the completion contract
2. Write a material contract
3. Collect response evidence
4. Use generated source images carefully
5. Choose representation by visible scale
6. Author physical layers
7. Preserve material-family identity
8. Place wear by cause
9. Validate under controlled lighting
10. Degrade for Web without losing identity
11. Score and gate the result

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

Close each binding material cue through one source-evidence or art-direction ID, one authored representation, one exact runtime binding, and one proof view. Record macro, meso, and micro scale bands with physical dimensions and representation; an omitted band requires a closest/typical-view justification. Free-text claims, source previews, and screenshots without a runtime material/node/slot or code binding do not close the chain.

## Collect response evidence

Collect evidence that answers different questions:

1. Neutral or diffuse light for overall color and large-scale variation.
2. Grazing light or a readable highlight for roughness, coating, and directional response.
3. A close-up with scale for pores, grain, weave, machining, or aggregate size.
4. An edge, joint, cut, back face, or cross-section for thickness and layer construction.
5. New/used, dry/wet, clean/dirty, or warm/cold comparisons when state changes the identity.
6. Backlight for thin, translucent, transmissive, fibrous, or biological materials.

Record light direction, exposure, white-balance uncertainty, and whether a source is a photograph, scan, marketing render, or synthetic example. Do not infer color, roughness, thickness, IOR, and ageing from one front-lit photograph. Do not mix references with different finishes or states without marking the intended combination.

## Use generated source images carefully

Apply the image-assisted workflow routed by SKILL.md before using generation for a material-critical asset. Invoke a dedicated image-generation skill when an authored source plate, decal, cutout, or state-layer concept can materially improve the retained surface; skip it when real scans, supplied evidence, deterministic procedural fields, or authored maps already solve the visible need.

Treat generated output as a source layer, never as material-response evidence. Require a declared physical coverage and projection; remove baked lighting, perspective, AO, and highlights; make required repeats seamless; and derive aligned PBR channels from one reviewed source. Do not trust independently generated base-color, normal, roughness, metallic, AO, or height maps as a coherent physical set.

Keep height/normal, roughness, metallic, AO, and opacity semantically independent. Never bind a roughness map as bump/height, invert base color into roughness without a reviewed remap, or reuse one convenient grayscale image across unrelated slots. A visually rich source cannot compensate for a physically wrong channel binding.

Validate the corrected derivative under the same neutral, grazing, backlit, and final-environment rig as every other material. Reject the layer if generated artifacts, inconsistent scale, implausible wear, tiling, or compression damage survive the typical view.

For 3A/AAA or photoreal work, run one exact-runtime A/B material spike before broad propagation. Use final UVs, texel density, channel packing, normal convention, representative compression, and the target renderer; compare the baseline and candidate at identical closest and typical views. A single flat color plus scalar roughness, one undifferentiated noise field, or a channel-invalid Canvas texture does not pass merely because the full scene is category-recognizable.

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

1. Substrate: conductor, polymer, mineral, cementitious solid, wood, fiber, composite, porous solid, biological tissue, hard biological tissue, liquid, particulate, frozen medium, or volume.
2. Manufactured or biological structure: machining, grain, weave, pores, veins, or aggregate.
3. Coating: paint, plating, anodization, glaze, varnish, clearcoat, oxide, wax, oil, laminate, or protective film.
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
| Exposed metals | Conductive reflection color, machining direction, oxidation or patina, dents, and edge radius | Gray diffuse plus low roughness as a metal substitute; metal without an environment to reflect |
| Painted and powder-coated metal | Dielectric paint over primer and metal, orange peel, causal chips, and layer exposure in order | Making intact paint metallic; exposing bright metal on every edge; identical paint and substrate roughness |
| Plated and anodized metal | Finish-specific reflection, brushing, coating thickness cues, discoloration, and substrate-aware wear | Treating chrome, galvanized steel, and anodized aluminum as one preset; random rainbow tint |
| Plastic, resin, and acrylic | Dielectric response, molding or casting marks, weld lines, orange peel, edge highlights, and optional transmission | One roughness for every polymer; metal-like highlights; perfectly clear acrylic with no thickness or absorption |
| Rubber, silicone, and elastomers | Compression, stretch, molded grain, bloom, pressure polish, dust adhesion, and non-pure-black color | Featureless black roughness; rigid-looking soft rubber; wear unrelated to grip, load, or flex |
| Glass and optical solids | Real thickness, correct normals, IOR, transmission, absorption, inclusions, and edge response | Low opacity as the only glass model; zero-thickness hero glass; unverified nested-surface sorting |
| Water, oils, and other liquids | Closed boundaries, surface tension, meniscus, depth absorption, viscosity, flow direction, foam, and contact with containers | A flat transparent plane for every liquid; uniform tint independent of depth; coplanar liquid and vessel |
| Wood and bark | Structural grain, end grain, growth or fiber direction, pores, finish layers, splits, and moisture response | Grain crossing joints arbitrarily; one texture on side and end faces; uniform procedural rings |
| Rock, stone, and minerals | Macro fracture or bedding, mineral boundaries, weathering, chips, then pores and crystals | Uniform noise at every scale; color copied into roughness; microdetail before geological structure |
| Concrete, plaster, brick, mortar, and asphalt | Aggregate or binder scale, construction joints, trowel or form marks, cracks, repairs, porosity, and water paths | One gray noise material; identical brick and mortar response; cracks that ignore structure and drainage |
| Soil, sand, clay, gravel, and mud | Particle-size distribution, compaction, clumps, tracks, erosion, moisture gradients, and displaced silhouettes | A flat brown texture; equal-size grains; wet mud made only by lowering roughness |
| Fabric, knit, mesh, and felt | Load-driven folds, seams, weave or knit direction, fiber scale, nap, sheen, tension, and translucency | Plastic-looking cloth; wrong weave scale; printed weave with no directional response |
| Leather and suede | Grain or nap, pores, flex creases, edge construction, oil polish, compression, stitching, and handling wear | Leather as brown noise; suede with glossy plastic highlights; uniform edge wear unrelated to use |
| Skin and flesh | Regional color and oil variation, thickness, pores, wrinkles, bounded subsurface response, scars, and blood perfusion cues | One body-wide roughness or SSS value; waxy uniform skin; pores that ignore anatomy and scale |
| Hair, fur, and feathers | Fiber or barb direction, anisotropic highlights, clumping, root-to-tip variation, silhouette tiers, and grooming state | Cards shaded like ordinary plastic planes; random fiber direction; full groom geometry at every distance |
| Bone, teeth, horn, shell, and scales | Layered growth, enamel or keratin differences, thickness-dependent translucency, chips, ridges, and biological attachment | Uniform ivory plastic; metallic shells; scales pasted without anatomy or overlap |
| Vegetation and fungi | Thin-sheet or fleshy construction, front/back response, veins or gills, wax, moisture, age, damage, and credible backlight | Mirror-like or cardboard leaves; plant-wide random discoloration; uniform glow; unnecessary blended overdraw |
| Ceramic, porcelain, and enamel | Clay or metal substrate, glaze thickness, edge pooling, firing variation, crazing, chips, and exposed body | Treating glaze as bare metal or perfect glass; cracks with no glaze/body distinction |
| Paper, cardboard, ink, and printed labels | Fiber direction, ply and edge thickness, folds, absorbency, ink or toner response, coating, lamination, and wear | Paper with no thickness or fibers; all printing as geometry; glossy ink and matte paper merged into one response |
| Displays, LEDs, and emissive surfaces | Cover glass, polarizer or diffuser, pixel or segment structure, black level, angular response, controlled emission, and exposure | Emissive washout hiding missing construction; emission assumed to light the scene automatically; uniform screen black |
| Snow, ice, and frost | Grain or crystal scale, compaction, trapped air, thickness, cracks, bubbles, meltwater, accumulation, and subsurface or transmission cues | Snow as white diffuse paint; ice as a blue low-opacity shell; frost that ignores exposure and heat |
| Automotive and multilayer paint | Primer, base coat, metallic or pearlescent flakes, clearcoat, orange peel, panel orientation, chips, and repaired regions | Sparkles baked into base color; mirror clearcoat; flakes with no scale, orientation, or distance control |
| Carbon fiber, fiberglass, and laminates | Fiber direction, weave or unidirectional layup, resin depth, clearcoat, cut edges, delamination, and ply exposure | Checkerboard carbon texture; fibers crossing seams; carbon fiber treated as metallic |
| Gems, pearls, and iridescent or thin-film surfaces | Faceting or layered structure, IOR, internal absorption, inclusions, dispersion or angle-dependent color, and scale | Static rainbow base color; opaque gemstones; screen-space sparkle used in place of form and light response |
| Foam, sponge, cork, and porous insulation | Cell or pore size, broken silhouette, compression, torn cells, anisotropy, absorption, and density variation | Uniform noise with no cells; rigid foam under load; pores smaller than the validated pixel scale |
| Wax, soap, food, and soft translucent organics | Subsurface depth, moisture or oil, cut surfaces, bubbles, fibers, crust, melting, bruising, and freshness state | Generic plastic SSS; uniform gloss; food detail unrelated to preparation, gravity, or moisture |
| Burnt, charred, sooty, and ashy matter | Heat gradient, material loss, blistering, cracking, char depth, soot deposition, ash volume, and source direction | Black base color as the whole effect; equal burn on sheltered and exposed faces; soot with no emission or airflow source |
| Fog, smoke, fire, cloud, and airborne dust | Density field, phase response, self-shadowing, temperature or emission, dissipation, wind, depth, and temporal stability | One camera-facing transparent card for a hero volume; uniform density; fire represented only by emissive color |

Classify wet, dusty, muddy, mossy, rusty, bloody, frozen, burnt, aged, and damaged appearances as state layers or material transformations unless they form a separate physical body. Record the base material and state independently. A water film changes roughness, normal response, color, pooling, and thickness differently on cloth, stone, paint, and soil; do not apply one universal wetness slider. Build separate geometry or volume when snow, mud, liquid, ash, moss, or damage changes silhouette, contact, or parallax.

For skin subsurface scattering, complex layered liquids, spectral effects, hero volumes, and other models outside the target glTF path, choose a verified custom runtime shader or declare an approximation. Do not claim physical parity when only the base color survives export.

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

Store a reproducible lighting profile for each proof rig: renderer and build, color space, tone mapping, exposure, environment source and hash, light roles/types/colors/intensities/transforms, decay, shadow/contact strategy, device tier, and fallback. Neutral and grazing views are mandatory; add backlight for thin or transmissive materials and contact proof for grounded architecture or supported masses. Bind each capture to the exported asset or production-build hash and the lighting-profile hash.

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
- unexplained constant roughness, one uniform procedural-noise scale, or missing real-scale macro/meso/micro response at the required view;
- visibly floating support/contact or opacity/emissive used in place of identity-critical thickness, transmission, or illumination without a reviewed fallback;
- a material feature that silently disappears or materially changes in the exported Web result;
- missing neutral, grazing, final-environment, or exact-final-GLB evidence;
- broken runtime, failed export validation, or exceeded declared performance budget.

When the result misses the threshold or a gate, preserve the best artifact, name the failed category and unsupported features, and label the material or asset `partial` rather than claiming AAA or photoreal completion.
