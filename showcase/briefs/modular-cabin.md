# Modular Forest Cabin — asset brief

## Purpose and viewing

- Purpose: a deterministic hero-scale architecture forward test for modular construction, interior parallax, repeated-detail instancing, and one hinged mechanism.
- Subject scale: a compact raised cabin, approximately 5.8 m wide by 4.6 m deep; the porch/stairs extend the front depth to about 6.9 m and the chimney reaches about 5.9 m.
- Intended views: closest useful view about 4 m, typical orbit distance 8–12 m, silhouette distance about 20 m, and an assumed runtime-owned camera FOV of 35–60 degrees.
- Primary view: front/right three-quarter so the entry, front glazing, right-side glazing, roof pitch, porch, stairs, and chimney read at once. Front, side, rear, and elevated orbits should still reveal real volume.
- Target: desktop and modern mobile WebGL at the shared showcase's interactive frame rate. The demo owns no renderer, camera, controls, floor, or post-processing.

## Observed requirements

- Compact modular forest cabin.
- Readable structural frame and cladding.
- Pitched roof, glazing, porch/deck, stairs, chimney, and warm interior depth.
- One subtle useful motion: the entry door opens from a physically placed hinge.
- Deterministic generation using only the installed `three` package and no runtime assets.

## Inferences and design decisions

- No reference image or exact floor plan was supplied, so proportions, dark green board-and-batten cladding, timber finish, and standing-seam roof are authored inferences.
- The floor is raised roughly 0.55 m on visible concrete piers, appropriate for a compact forest-site concept and useful for showing ground contact and load paths.
- The ridge runs front-to-back. The 32-degree roof pitch and front gable frame prioritize silhouette readability.
- Front and right wall modules leave real apertures rather than placing glass over solid walls. Warm recessed walls, floor, furniture, pendant, and a local warm light sit behind the glazing to create depth and parallax.
- The front door is 1.02 m wide by 2.24 m high. Its assembly is parented to `ENTRY_DOOR_HINGE` at the left jamb and swings outward from 0 to 52 degrees without crossing the facade or stairs.
- When motion is disabled, the door is held at the closed endpoint. When enabled, a slow cosine cycle travels through closed, intermediate, and fully open poses. `reset()` restores the closed endpoint.

## Hierarchy

```text
CABIN_ROOT
├── FOUNDATION_PIERS
├── CABIN_SHELL
│   ├── CLADDING_WALL_BAYS / CLADDING_GABLES / CLADDING_BATTENS
│   ├── STRUCTURAL_TIMBER_FRAME
│   ├── PITCHED_METAL_ROOF / ROOF_STANDING_SEAMS
│   ├── CHIMNEY_MASONRY
│   ├── WINDOW_GLAZING / WINDOW_MULLIONS
│   └── roof and facade attachment structure
├── PORCH_AND_ENTRY
│   ├── PORCH_DECK_BOARDS
│   ├── ENTRY_STAIRS
│   └── ENTRY_DOOR_HINGE
│       ├── ENTRY_DOOR_SLAB
│       ├── ENTRY_DOOR_VERTICAL_BOARDS
│       └── ENTRY_DOOR_HANDLE
└── WARM_INTERIOR_DEPTH
    ├── INTERIOR_ROOM_SHELL
    ├── INTERIOR_TABLE_AND_BENCH
    ├── INTERIOR_PENDANT_LAMP / PENDANT_CORD
    └── INTERIOR_WARM_LIGHT
```

## Budget

- Contract limits: no more than 80,000 rendered triangles and 45 draw calls.
- Verified procedural module count: 1,934 rendered triangles and 19 mesh draw objects before runtime floor/light passes, comfortably below the target of 5,000 triangles and 25 draw submissions.
- Repeated piers, wall bays, battens, frame members, roof panels/seams, chimney parts, deck boards, stair treads, glass panes, mullions, room pieces, furniture, and door boards use instancing.
- Geometry/material approach: one shared unit box for modular rectilinear parts, one tiny gable triangle geometry, and two low-segment spheres. No textures, alpha cards, downloads, or high-frequency modeled fasteners.
- Transparency is limited to a single instanced glazing material; it disables depth writes and casting to contain sorting and shadow cost.

## Omissions and limitations

- This is a stylized construction study, not a code-compliant architectural plan. There is no insulation layer, flashing, guttering, weather seal, foundation engineering, interior room layout, collision mesh, or navigation mesh.
- Box primitives keep edges sharp; close-up bevels, wood grain, fasteners, masonry joints, roof flashing, curtains, and surface weathering are omitted in favor of a small deterministic draw/triangle budget.
- The door is visually hinged but has no collision solver or user-driven control; the showcase's `motionEnabled` state alone drives it.
- Transparent glazing may sort differently when viewed from inside because the shared runtime owns render ordering.
- The local warm point light improves depth but does not cast its own shadow; the shared world light remains responsible for exterior form.

## Self-check

- Silhouette: raised rectangular cabin, deep porch, stair run, gable roof, and chimney remain recognizable without surface detail.
- Construction: piers meet the ground; corner posts, perimeter beams, window/door headers and sills, front rafters, ridge, porch posts, rails, and balusters form visible load paths.
- Openings: glass occupies actual front/right apertures and the open door reveals a recessed interior instead of an opaque facade.
- Mechanism endpoints: closed angle is 0 radians; maximum open angle is -52 degrees about the jamb-edge local Y axis; all door details are children of the same pivot.
- Determinism: no random values, clocks, external state, runtime assets, DOM calls, renderer, camera, controls, or post-processing.
- Grounding and framing: the lowest stair is about 0.02 m above `y = 0`; cabin mass is centered near the origin and metadata targets the facade/interior rather than the roof peak.
- Validation completed: Node syntax/import passed; instantiated count is 1,934 triangles across 19 mesh draw objects; the enabled door reached -51.99 degrees and `reset()`/motion-disabled returned it to 0 radians; whitespace and scope-limited Git checks passed.
