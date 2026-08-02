# Blender to Web pipeline

## Contents

1. Scene contract
2. Modeling routes
3. Topology and UVs
4. Baking and materials
5. Rigging and animation
6. LOD and export
7. Validation and failure modes

## Scene contract

- Use metric units and model at real scale.
- Use Y-up at runtime; Blender is Z-up, so verify the exporter and target loader rather than manually rotating every object.
- Put the object origin at a meaningful placement point: ground contact for props, hinge for doors, axle for wheels, root for characters.
- Freeze or intentionally preserve transforms before export. Avoid hidden negative scale.
- Name collections, meshes, armatures, bones, materials, sockets, cameras, and clips predictably.
- Separate source collections from export collections. Keep high-poly, cages, bake helpers, and reference images out of the export collection.

## Select a modeling route

### Hard surface and products

Use dimensioned blockout, mirror/array, bevel, weighted normals, controlled subdivision, and explicit panel gaps. Spend polygons on silhouette, rounded highlights, openings, and movable joints. Bake tiny seams, knurling, embossed text, scratches, and fasteners unless they are close interactive features.

### Buildings and furniture

Build reusable modules with consistent grid and floor heights. Separate structure, facade, glass, trim, fixtures, and collision. Preserve openings and interior parallax visible through windows. For chairs and organic furniture, protect the seat/back silhouette and load-bearing joints.

### Organic assets and animals

Sculpt or shape primary volumes, retopologize into deformation-friendly loops, and place density around face, shoulders, hips, paws, and joints. Preserve muscle and fur silhouette; bake pore/fur direction when individual strands are not required. Use cards or shell techniques for medium-distance fur and groom geometry only for hero close-ups.

### Terrain, rocks, plants, and water

Use displacement or geometry nodes for macro variation, then decimate/retopologize. Break symmetry in rocks without adding uniform noise everywhere. Create vegetation modules that can be instanced and wind-deformed. Treat rivers as a surface/path system with flow direction, banks, depth cues, foam masks, and reflection/refraction handled in the runtime shader.

## Topology and UVs

- Keep quads while editing; judge the final triangulation before export.
- Put edges where silhouette, curvature, hard-normal transitions, UV seams, or deformation require them.
- Avoid long thin triangles, accidental internal faces, duplicate vertices, non-manifold gaps, and coplanar z-fighting.
- Use separate smoothing/hard edges deliberately. Ensure tangent-space normal maps match the runtime convention.
- Keep consistent texel density. Give more UV area to close, readable, unique surfaces.
- Pack mirrored/stacked UVs only when asymmetric wear, text, baked lighting, or unique damage is not required.
- Use a second UV set only when the runtime feature needs it, such as baked lightmaps.

## Baking and PBR

1. Keep high-poly and low-poly aligned at real scale.
2. Apply scale before calculating cages or ray distances.
3. Bake normal, ambient occlusion, curvature or thickness only when they will be used.
4. Inspect skewing, seams, gradients, and cage misses under grazing light.
5. Author base color without painted lighting. Encode surface response in roughness, metallic, normal, height, and occlusion.
6. Pack ORM channels only when the runtime material expects the same order.
7. Use texture sizes based on projected screen size, not asset importance alone.

Typical non-metal surfaces: metalness 0. Use metalness 1 only for exposed conductive metal; painted metal is non-metal at the paint surface. Avoid pure black roughness or mirror-like leaves, paper, bark, fabric, stone, and plastic unless references prove it.

## Rigging and animation

- Apply transforms before binding.
- Keep one clear root and a documented root-motion policy.
- Place bone pivots at real anatomical or mechanical joints.
- Normalize weights and inspect every extreme pose.
- Limit influences per vertex to the target runtime budget.
- Use sockets for held props, wheels, doors, pages, screens, accessories, and effect origins.
- Bake constraints and procedural motion into export clips when the runtime cannot reproduce them.
- Give clips stable names, explicit ranges, clean loop boundaries, and no unintended keyframes.

For complex armatures, retargeting, IK, or natural character motion, invoke a dedicated animation/rigging skill and validate skinning and exported clips separately.

## LOD and export

- Author LOD0 from the closest required view, then remove screen-invisible detail per distance.
- Preserve silhouette, holes, proportions, pivots, UV layout compatibility when useful, and material identity.
- Create billboard/impostor representations only where parallax and self-shadow are no longer readable.
- Add 10–15% distance hysteresis or temporal crossfade to prevent LOD chatter.
- Export glTF 2.0 / GLB with only required meshes, materials, skins, lights, cameras, and animations.
- Verify axis, scale, normals, tangents, alpha mode, color space, animation speed, and clip names in an independent viewer and in the actual runtime.

## Common failure modes

- Correct Blender viewport but wrong Web result: color-space mismatch, environment mismatch, unsupported node graph, unapplied transforms, tangent mismatch, or different alpha mode.
- Large GLB: unapplied modifiers, hidden export objects, oversized textures, duplicate materials, embedded unused images, or uncompressed animation.
- Broken animation: non-deform helper bones exported, constraints not baked, scale animation, multiple roots, or wrong clip ranges.
- Shimmering/z-fighting: coplanar surfaces, excessive thin geometry, unstable alpha cards, or insufficient depth precision.
- LOD pop: changed silhouette/coverage, material mismatch, pivot mismatch, or no hysteresis.

## Official references

- Blender glTF 2.0 manual: https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html
- Khronos glTF portal, specification, validator, and asset tools: https://www.khronos.org/gltf/
- Khronos Asset Creation Guidelines 2.0 overview: https://www.khronos.org/blog/introducing-asset-creation-guidelines-2.0-siggraph-2025

Check the manual for the Blender version actually installed. Exported material extensions, animation grouping, and compression controls change over time. Blender converts quads/ngons to triangles, splits vertices at discontinuous UVs and flat edges, and exports only supported material/animation semantics; validate the exported GLB rather than trusting source-scene counts.
