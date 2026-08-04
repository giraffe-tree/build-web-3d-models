# Image-assisted Web 3D asset workflow

## Contents

1. Decide whether image generation adds value
2. Declare the image role
3. Generate concepts without inventing evidence
4. Generate texture and decal sources
5. Convert source images into PBR assets
6. Integrate images into geometry and Web delivery
7. Review and iterate
8. Hard failures and completion rules

## Decide whether image generation adds value

Invoke a dedicated image-generation skill when an authored raster can materially improve pixels that survive the closest or typical view. High-value uses include:

- an original polished asset has no coherent silhouette, material, or presentation target;
- irregular organic, weathered, woven, printed, painted, stained, or deposited variation would be weak as uniform noise;
- a fictional label, decal, motif, atlas element, cutout, background plate, or state mask needs deliberate art direction;
- editing a supplied or generated image can produce a cleaner source plate, transparent cutout, or controlled variant;
- a concept pass can resolve a meaningful design choice before expensive modeling.

Skip generation when the user already supplied sufficient visual evidence, the retained result is deliberately graphic or procedural, a deterministic pattern is cheaper and stronger, or the generated pixels would be sub-pixel at the validated view. Do not generate decoration merely because the tool is available.

For reference-faithful work, collect real evidence first. Generated images may visualize an explicitly inferred hidden side or repair plan, but they cannot raise confidence or replace photographs, scans, drawings, dimensions, or material-response evidence.

## Declare the image role

Before calling an image-generation tool, record:

- role: target-board concept, texture source, decal/label, mask/cutout, atlas element, or background plate;
- subject and fidelity lane;
- projection: UV, triplanar, planar decal, cylindrical, card, sprite, or background;
- output dimensions, aspect ratio, alpha requirement, real-world coverage, texel-density target, and whether it must tile;
- retained cues: the few visible features the image must contribute;
- prohibited content: perspective, cast shadows, highlights, AO, object borders, unwanted text, logo, watermark, seams, or inconsistent scale;
- provenance label and output path;
- deterministic post-processing and target-runtime proof view.

If those fields are unknown, resolve the material contract, UV/projection plan, and closest view before generating. Do not let a generated image silently define the asset scale or structure.

## Generate concepts without inventing evidence

For an original polished asset, make a compact target board that resolves three questions: silhouette/construction intent, material response, and presentation mood. Prefer a small coherent set over many unrelated attractive images. Select one primary design direction before modeling and record which details are binding versus inspirational.

Prompt concepts with the intended object class, proportions, construction logic, material families, age/state, camera character, lighting purpose, and visual exclusions. Ask for views that answer distinct questions. Do not treat separately generated views as a geometrically consistent turnaround unless landmarks, part count, and proportions actually agree.

Generated concepts are authored art direction. Never cite them as proof of real dimensions, manufacturing, anatomy, material chemistry, hidden construction, or branded product fidelity. If generation is unavailable, use collected references or state that the result is a generic art-directed interpretation.

## Generate texture and decal sources

Generate a source plate, not an assumed finished material. For a tileable surface, request an orthographic, evenly diffuse, scan-like field with consistent scale and no perspective, object boundary, directional lighting, cast shadow, highlight, AO, text, or watermark. Specify the physical area represented, such as `1 m × 1 m`, before choosing resolution.

Use image generation selectively for:

- base-color motifs, fiber/color breakup, stains, oxidation, dirt, lichen, bark, stone boundaries, or other non-uniform fields;
- fictional print, packaging, labels, symbols, painted marks, posters, or planar decals;
- cutout silhouettes and atlas candidates for leaves, petals, debris, paper, or distant detail;
- semantic concepts for wear, moisture, deposit, age, or damage masks that will be rebuilt and validated against physical causes.

Do not ask an image model for separate final base-color, normal, roughness, metallic, AO, and height maps and assume they align or obey PBR semantics. Do not accept random metalness, normals with invented illumination, roughness copied from color, or AO baked into albedo. Generate or select one shared source, then derive, paint, or bake the aligned channels with deterministic image tools, Blender, or a material-authoring application.

For decals and cutouts, require clean alpha, sufficient transparent padding, edge-color bleed for mipmaps, no halo, and no unintended baked shadow. Treat generated text as unreliable: typeset required copy deterministically and use supplied logos or authorized artwork instead of invented marks.

## Convert source images into PBR assets

Inspect the full-resolution output before retention. Reject malformed repetition, impossible material transitions, lighting gradients, JPEG ringing, false depth, signatures, random text, inconsistent scale, or content that contradicts the material state.

Then perform the applicable steps:

1. Crop and rectify the intended projection.
2. Remove illumination, broad AO, highlights, and color cast from base color.
3. Make required axes tile seamlessly; test a `2 × 2` repeat and offset seams through the image center.
4. Rebuild missing borders or larger-area variation without stamping one obvious patch repeatedly.
5. Establish real scale and match texel density across adjacent parts.
6. Derive or author height, normal, roughness, metallic, AO, opacity, thickness, and masks from the same aligned source; hand-correct semantics.
7. Keep base color and emissive sRGB; keep data maps linear. Verify normal convention and channel packing.
8. Add UV padding, alpha bleed, and mip-safe borders.
9. Export reviewed source and runtime derivatives separately; compress runtime textures only after the uncompressed material passes.

Preserve the editable generated source, but treat the corrected and channel-aligned derivative as the authored material input.

## Integrate images into geometry and Web delivery

Choose geometry, normal/height, decal, card, or background from projected visibility. Generated imagery must not replace silhouette, contact, thickness, moving joints, parallax, or a readable grazing-light edge when those survive the required view.

Match UV direction to grain, weave, machining, flow, or gravity. Break repetition across large surfaces with controlled macro variation, multiple compatible patches, decals, masks, or stochastic sampling. Keep wear and deposits tied to semantic causes instead of using the generated field uniformly on every face.

Budget the retained pixels by screen coverage and device tier. Record download size and decoded GPU memory, use KTX2/Basis when the runtime supports it, and recheck alpha, normal strength, roughness, banding, and seams after compression. Do not keep an oversized generated image merely because its source resolution is high.

## Review and iterate

Run a bounded loop:

1. Inspect the candidate alone at full resolution.
2. Inspect the mapped asset under neutral, grazing, and final lighting; add backlight for thin or transmissive work.
3. Check closest, typical, and far views for scale, tiling, excessive contrast, and sub-pixel waste.
4. Compare against the declared image role and material contract.
5. Name the three largest visible defects and address the highest-impact one.
6. Generate another candidate only when the defect is in authored image content. Fix UVs, geometry, lighting, shader semantics, or compression with the appropriate deterministic tool instead of repeatedly prompting the image model.

Prefer one selected candidate plus targeted edits over unbounded regeneration. The exact final Web render—not the generated source preview—controls acceptance.

## Hard failures and completion rules

Treat these as hard failures when the generated image is identity-critical:

- a concept is presented as factual or reference-faithful evidence;
- base color contains obvious lighting, shadow, specular, or AO;
- PBR channels do not align or violate metallic, roughness, normal, alpha, or color-space semantics;
- a required tile has visible seams or repetition at the typical view;
- generated text, logos, artifacts, impossible structure, or inconsistent scale remain visible;
- the image hides missing geometry, thickness, contact, or mechanical construction;
- compression introduces halos, banding, broken normals, or lost identity cues;
- the retained asset lacks source provenance, declared role, or exact-runtime proof.

Complete the image-assisted pass only when the corrected derivative improves the intended visible cue, survives Web delivery and lighting tests, fits the budget, and makes no unsupported physical or reference claim. Otherwise retain the best artifact and label the result `partial` or remove the generated layer.
