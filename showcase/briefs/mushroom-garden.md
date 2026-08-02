# Miniature Bioluminescent Mushroom Garden

## Purpose and viewing

- Purpose: a deterministic procedural organic-scatter forward test, presented as a small hero garden rather than a background field.
- Viewing: designed for a three-quarter orbit, with the nearest readable caps around 0.4-0.8 scene units from the target and the full garden readable from roughly 3-5 units away.
- Silhouette target: four distinct mushroom families remain identifiable without labels: broad parasols on thin stems, pendant bells on curved stems, round buttons on stout bulbous stems, and shallow luminous cups on tapered stems.
- Target: desktop and mid-tier mobile WebGL, with subtle motion that remains legible at the typical showcase camera distance.

## Observed requirements

- Use only installed `three`; no runtime downloads, textures, DOM, renderer, camera, controls, or post-processing.
- Keep generation deterministic and use no bare `Math.random()`.
- Ground the subject near `y = 0`, center it near the origin, and keep the full scene below 80,000 rendered triangles and 45 draw calls.
- Reuse geometry/materials and instance repeated forms.
- Include clustered mushroom scatter, visibly different cap/stem archetypes, rocks or moss, and motion controlled only by `motionEnabled`.
- Export the standard `meta` object and `createDemo()` factory.

## Inferences and art direction

- Bioluminescence is represented with opaque emissive PBR cap/gill materials plus two non-shadowing local point lights; bloom is intentionally not assumed.
- The setting is a humid night garden: dark soil mounds, low moss cushions, angular wet-looking rocks, sparse shoots, and small luminous motes.
- Cluster centers are separated enough to make each archetype readable, while seeded radial scatter, scale, yaw, lean, tint, and phase prevent a planted-grid appearance.
- Mushroom motion is modeled as low-amplitude bending from the ground-contact pivot plus 1-2% cap expansion, not independent world-space drift.

## Hierarchy and attachment model

```text
mushroom-garden-root
|- ground-accents
|  |- soil-mounds (instanced)
|  |- moss-cushions (instanced)
|  |- rocks (instanced)
|  `- moss-shoots (instanced)
|- mushroom-layer
|  |- parasol-family (instanced stem + cap)
|  |- bell-family (instanced curved stem + cap)
|  |- button-family (instanced stem + cap + bulb)
|  |- cup-family (instanced stem + cap + rim)
|  `- shared-gills (instanced)
|- spore-motes (points)
`- glow-lights
```

Each mushroom stores one ground-contact anchor, rest yaw/lean, scale, and motion phase. Stem, cap, gill, collar/bulb/rim matrices are rebuilt parent-to-child from that same base transform. Caps therefore remain attached to stem tips throughout sway and breathing.

## Budget

- Target visible geometry: under 20,000 triangles.
- Target visible demo draw calls: no more than 20; cap/stem/accent shadow submissions may add up to ten passes when the shared runtime enables shadows.
- Repeated geometry: four cap batches, four stem batches, one shared gill batch, three optional archetype-detail batches, and four ground-accent batches.
- Textures: zero. Bones/morph targets: zero. Dynamic matrices: mushroom batches only. Dynamic vertex buffer: one small mote point cloud.
- Lights: two local non-shadowing point lights.

## Omissions

- No alpha-blended cap membranes, refraction, subsurface scattering, bloom, procedural textures, collision, picking, or distance LOD.
- Gills are a compact emissive underside volume rather than individually modeled radial plates.
- Soil and moss use low-poly repeated volumes; the shared runtime floor supplies the broad ground plane.

## Verification notes

- `node --check` and a real ESM import/create/update/reset cycle passed using the showcase's installed `three` dependency.
- Measured scene geometry: 13,734 visible triangles across 17 visible draw calls.
- Measured optional shadow work: 8,142 triangles across 10 additional submissions, for 27 visible-plus-shadow calls total.
- Two separately created gardens produced identical instance matrices and mote positions.
- `motionEnabled = true` changed the pose; `motionEnabled = false` and `reset()` restored the exact initial arrays.
- Mesh names and `userData` identify ground pivots, stem-tip attachments, cap undersides, and family/detail roles.
- No renderer screenshot was captured because the forward-test scope limits this module to scene construction and excludes renderer/camera code; final visual composition remains a shared-runtime integration check.
