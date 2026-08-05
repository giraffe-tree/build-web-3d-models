# Asset archetype playbook

## Contents

1. Compact rigid props
2. Furniture and architecture
3. Vehicles and mechanisms
4. Terrain and water
5. Vegetation and organic scatter
6. Animals and characters

## Compact rigid props

Examples: book, notebook, laptop, desktop computer, extinguisher, tools, appliances.

- Use Blender hard-surface modeling for art-directed hero assets; use procedural primitives for configurable products or large variants.
- Protect silhouette, bevel highlights, openings, labels, controls, and functional pivots.
- Bake tiny seams, screws, paper fibers, key legends, vents, scratches, and embossed detail.
- Separate animated parts: book covers/pages, laptop lid, buttons, knobs, hoses, handles, screen, plugs.
- Put pivots at hinges and name sockets for interaction.
- Use decal/atlas strategies for labels and text; do not model every glyph.

Books need thickness variation, a page block, cover overhang, spine curvature, and page-edge roughness. Computers need believable material separation among metal, painted plastic, glass, rubber, and emissive display pixels. Extinguishers need a readable cylinder silhouette, valve/handle assembly, hose curve, gauge, and safety pin; labels belong in textures.

## Furniture and architecture

Examples: chair, table, room, house, building.

- Model at real dimensions and check human-scale relationships.
- Architecture benefits from modular walls, floors, roofs, windows, doors, trim, and reusable materials.
- Preserve openings, roof silhouette, facade depth, and visible interior parallax.
- Furniture needs believable joinery, thickness, load-bearing structure, edge softness, and contact with the floor.
- Keep collision and navigation meshes separate from render meshes.
- Use instancing for repeated windows, railings, tiles, fasteners, seats, and structural bays.
- Use baked lightmaps only when the target runtime and dynamic-light policy justify them.

For explorable buildings, budget by visible rooms/cells and use portals, occlusion, chunk streaming, and interior/exterior LOD. A single merged building often defeats culling.

For polished houses, buildings, rooms, courtyards, streets, or hero environments, apply the architecture/environment gates routed by SKILL.md. Treat massing/scale, roof system, envelope/openings, edges/connections, material response, and base/ground contact as mandatory critical groups for exterior buildings; add site/vegetation and regional cues when they are in scope. Prove the intended route with the exact-runtime finish spike before full-scene assembly. Legacy primitive or zero-texture demos are engineering/blockout baselines, not polished architecture precedents.

## Vehicles and mechanisms

Examples: bicycle, cart, machine, articulated equipment.

- Establish a functional hierarchy before detail: frame, steering, wheel axles, drivetrain, brakes, suspension, and controls.
- Reuse wheel, spoke, chain-link, bolt, and bearing topology with instances or procedural placement.
- Place pivots at axles and hinges; verify steering, rolling, pedals, chain, and suspension without interpenetration.
- Use baked normal detail for tire tread or chain detail at medium distance.
- Add LOD that removes spokes, chain links, cables, and fasteners in that order while preserving wheel/frame silhouette.

For a bicycle, the frame triangle, fork rake, wheel alignment, crank axis, saddle/handlebar fit, and cable routing matter more than micro-detail.

## Terrain and water

Examples: snow mountain, river, cliff, rock field, ground.

- Build macro silhouette and drainage first. Add erosion-scale forms before micro-noise.
- Use tiled/material masks, triplanar projection, macro color variation, and detail normals to avoid obvious UV repetition.
- Blend snow by slope, altitude, exposure, and accumulation; do not use altitude alone.
- Rivers need a path, width/depth profile, bank transition, flow direction, surface normals, foam/rapids masks, and downstream animation.
- Use geometry for banks, waterfalls, breaking silhouettes, and close displaced water; use shaders for broad flow and reflection.
- Rocks need scale families, asymmetric silhouette, contact embedding, orientation to slope, and clustered—not uniform—scatter.
- Chunk terrain for frustum culling, LOD, streaming, and physics.

## Vegetation and organic scatter

Examples: tree, grass, flower, mushroom, bush, moss.

- Use a hierarchical skeleton or curves for stems/branches, then attach leaves, petals, caps, or blades to explicit anchors. For trees, generate the skeleton with a growth-based algorithm and check it against the named organic-form anti-patterns (grid branches, shim crown, root-flap grounding) in tree-web-case-study.md before adding foliage.
- Separate structural motion from tip flutter.
- Preserve biological attachment rules: opposite/alternate/whorled leaves, branch taper, petiole direction, flower radial order, mushroom gill/cap/stem relation.
- Instance repeated leaves, blades, petals, and mushrooms. Vary scale, color, phase, lean, and age with deterministic seeds.
- Maintain projected canopy/ground coverage when reducing density: fewer elements may be slightly larger or clustered differently.
- Use near geometry, medium cards/clusters, and far impostors.
- Disable or proxy distant fine shadows before removing visible plant mass.

Grass performance depends on visible blade count and overdraw, not only draw calls. Flowers need readable petal count/arrangement near the camera but should collapse into colored clusters at distance. Mushrooms need cap silhouette, underside/gill cue, stem attachment, ground contact, and size/age variation.

## Animals and characters

- Start with anatomical proportion, gesture, silhouette, and joint placement.
- Sculpt primary and secondary forms; retopologize for deformation.
- Add loops around eyes, mouth, shoulders, elbows, wrists, hips, knees, ankles, tail base, and wing joints as required.
- Use a clean armature, normalized weights, IK/animation controls in the source, and baked deform bones in the runtime export.
- Represent fur by texture, cards, shells, or groom geometry according to viewing distance.
- Create facial morphs or bones only when the interaction needs them.
- Test extreme poses, foot contact, root motion, loops, eye direction, and secondary appendages.
- Build LODs that preserve face, hands/paws, and silhouette longer than hidden body topology.

Use dedicated rigging and animation workflows for natural locomotion, retargeting, IK, and clip validation.
