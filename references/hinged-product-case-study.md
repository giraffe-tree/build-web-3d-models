# Hinged and folding product case study

## Contents

1. Evidence hierarchy
2. Endpoint-first construction
3. Repeated detail and Web budgets
4. Export and runtime verification
5. Failure patterns

## Evidence hierarchy

Use different reference types for different questions:

- Official specifications or dimension drawings: scale, width, depth, thickness, and advertised motion range.
- Real front, side, top, rear, and three-quarter photographs: gaps, overhang, occlusion, hinge exposure, port depth, and finish response.
- Open and closed photographs of the same product family: layer order and which parts disappear at each endpoint.
- Macro photographs: edge radius, perforation density, seam width, labels, and material roughness.

Build a small evidence matrix before modeling. Record the source, pose, camera direction, and what each image proves. Do not infer a hidden hinge, closed stack, or underside from one polished hero render.

## Endpoint-first construction

Treat the closed or fully seated state as a dimensional constraint, not an animation afterthought.

1. Block out the stationary shell at real scale.
2. Place the pivot axis and name the moving root.
3. Parent the complete moving assembly—including glass, bezel, marks, fasteners, and decals—to that root.
4. Build the closed endpoint with simple materials. Verify footprint overlap, total thickness, layer order, uniform perimeter seam, front/rear meeting, and hidden hinge parts.
5. Build the open endpoint and one middle pose. Verify travel limit, collision clearance, cable or clutch exposure, and attachment continuity.
6. Only then add bevel refinements, materials, labels, perforations, and other tertiary detail.

For a laptop-like product, the closed top should usually read as one flat cover over one continuous base sidewall. A stack of separately visible deck, bezel, glass, and lid slabs indicates incorrect layer depth, footprint, or pivot height even when the open pose looks convincing.

Capture fixed endpoint cameras early. A useful minimum is open three-quarter, open deck, closed top, closed front, closed side, and hinge close-up. Reuse the same cameras after every structural revision.

## Repeated detail and Web budgets

Judge fine detail by projected size and contrast, not by how satisfying it looks in an extreme Blender close-up.

- If a perforation, seam, or fastener is smaller than a pixel at the typical camera, prefer a texture, normal, height, or grouped material cue.
- If it remains silhouette-relevant or must survive close interaction, use shallow geometry with low contrast and the minimum segment count that preserves its highlight.
- Repeated elements multiply vertices after modifiers and export. Audit the GLB immediately after changing count or cylinder/sphere segments.
- Compare the exported asset, not only Blender statistics; flat edges, UV seams, material splits, and modifiers can increase unique vertices.
- When a detail pass exceeds budget, first reduce segment count, depth, diameter, and contrast. Then reduce density or replace the field with a baked representation. Preserve the visual frequency before preserving literal manufacturing count.

Make each detail pass reversible and record the last known-good asset metrics. Avoid spending the entire budget on tertiary holes while the silhouette or closed mechanism is still wrong.

## Export and runtime verification

Keep stable semantic nodes such as `ROOT`, `BASE`, `HINGE`, and `MOVING_ASSEMBLY`, with a named deterministic animation clip when animation is delivered. After each structural revision:

1. Export the derived GLB.
2. Run the asset audit and official validator.
3. Verify hierarchy, clip names, endpoint values, material/texture counts, and file-size limits.
4. Reload the actual Web page and wait for the current asset to load.
5. Exercise the same controls a user will use to reach closed, working, and fully open states.
6. Verify the visible state label or semantic control value and inspect the rendered endpoint.
7. Check warning/error logs after interaction, not only after initial load.
8. Repeat the essential path at a narrow mobile viewport and restore the normal viewport afterward.

Keep deterministic renders separate from runtime screenshots. The first proves source geometry and lighting; the second proves the exported hierarchy, loader, camera, UI, and interaction path.

## Failure patterns

- Correct open view, impossible closed view: pivot height, shell footprint, or layer order was never constrained by the closed endpoint.
- Oversized dark grilles or vents: detail was judged in isolation rather than at the typical camera and final material contrast.
- Raised-looking ports: dark recess cues sit outside the sidewall or are too thick.
- Exposed hinge when closed: the pivot/clutch is above the cover silhouette or the lid footprint ends too early.
- Multiple nested seams: several coplanar shells are visible instead of one continuous enclosure and one intentional gap.
- Sudden GLB growth: repeated meshes gained too many radial segments, modifiers, material splits, or unique transforms.
- Browser test passes only through direct transform edits: the UI event path, state synchronization, or animation mixer may still be broken.
