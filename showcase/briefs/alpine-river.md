# Alpine River

## Purpose and acceptance

- Purpose: a compact procedural terrain vignette that forward-tests readable drainage, layered alpine terrain, deterministic organic scatter, instancing, and subtle water motion.
- Recognition target: from the default three-quarter camera, the winding blue channel must read before the rocks or trees, and the enclosing banks must form a clear river valley silhouette.
- Grounding: the riverbed sits just above `y = 0`; the water, bank transitions, rocks, and trees remain in contact with the generated terrain.
- Motion: low-amplitude surface ripples and downstream current markers run only while `motionEnabled` is true. Disabled motion and `reset()` return the scene to the same deterministic rest state.

## Viewing and target runtime

- Typical view: elevated three-quarter view along the valley, centered near the river midpoint.
- Closest useful view: near enough to distinguish faceted rocks, stacked conifer crowns, bank strata, and water-surface undulation.
- Silhouette view: the outer slopes and conifer groups remain legible when individual rocks are no longer readable.
- Screen coverage: intended as a centered showcase subject filling most of the shared canvas.
- Camera metadata: direction `[1.35, 0.9, 1.55]`, target `[0, 1.0, 0]`; the shared runtime owns the actual camera and FOV.
- Target: desktop and capable mobile WebGL devices in the shared showcase runtime, with deterministic topology and no network-loaded assets.

## Observed requirements

- One deterministic Three.js module using only the installed `three` package.
- A compact alpine river valley with readable terrain layers, winding water, rocks, conifers or ground accents, and subtle water motion.
- Real volume, semantic names, explicit hierarchy, coherent scale, and ground contact near `y = 0`.
- No renderer, camera, controls, DOM, remote textures, downloaded assets, or post-processing in the demo.
- No more than 80,000 rendered triangles and 45 draw calls.

## Inferences and visual treatment

- The scene is a stylized late-summer alpine valley rather than a photoreal simulation, so color bands and faceted forms prioritize legibility at showcase scale.
- The river flows from positive Z toward negative Z. A shallow longitudinal drop, moving foam markers, and ripple phase make that direction readable.
- Terrain layers represent exposed riverbank, lower meadow, dark treeline band, upper rock, and high snow. They are deliberately discrete rather than texture-blended.
- Conifers use vertical trunks with three stacked crown tiers. Repeated topology is instanced while transforms and colors vary deterministically.
- Rocks are clustered rather than uniformly scattered and are partially embedded in the slope.

## Hierarchy

```text
alpineRiverValley
├── terrainSystem
│   ├── terracedValleySlopes
│   └── riverBed
├── waterSystem
│   ├── riverSurface
│   └── downstreamCurrentMarkers
├── stoneSystem
│   └── clusteredBoulders
└── vegetationSystem
    ├── coniferTrunks
    └── coniferCanopyTiers
```

The water surface owns its deforming vertex data. Current markers are attached to `waterSystem` and are repositioned along the same centerline. Repeated rocks and conifer components stay under semantic system parents and use instance transforms rather than standalone world-space meshes.

## Determinism

- Terrain elevation, meander, width, and ripple rest state are analytic functions of position.
- Scatter uses a local fixed-seed Mulberry32 generator; bare `Math.random()` is not used.
- `update()` is a pure function of `elapsedSeconds` while motion is enabled, and of zero time while disabled.
- `reset()` restores the same time-zero water vertices and current-marker transforms.

## Target budget

| Part | Representation | Approx. rendered triangles | Material draws |
| --- | --- | ---: | ---: |
| Terraced slopes | One unindexed faceted mesh | 4,480 | 1 |
| Riverbed | Indexed strip | 432 | 1 |
| Water surface | Indexed dynamic strip | 576 | 1 |
| Boulders | 42 instanced detail-1 icosahedra | 3,360 | 1 |
| Conifer trunks | 34 instanced six-sided cylinders | about 816 | 1 |
| Conifer crown tiers | 102 instanced seven-sided cones | about 1,428 | 1 |
| Current markers | 14 instanced eight-sided discs | 112 | 1 |
| **Total target** |  | **about 11,204** | **7** |

The table counts visible-pass geometry. Shadow or depth passes in the shared renderer may submit selected meshes again; fine repeated accents deliberately do not cast shadows.

## Omissions

- No reflection, refraction, foam shader, caustics, spray, underwater volume, waterfall, erosion solver, physics, terrain LOD, collision mesh, or navigation mesh.
- No texture maps or triplanar material system; vertex colors and roughness separate the terrain layers.
- No individual tree hierarchy or wind simulation. Trees are static instanced accents so the motion budget remains focused on flow.
- The river is a shallow ribbon and riverbed, not a watertight fluid volume.

## Verification notes

- Confirm the module imports and `createDemo()` returns a `THREE.Group` root with the required semantic child names.
- Traverse visible meshes and count indexed or non-indexed triangles multiplied by instance count; verify the total remains below 80,000.
- Count mesh/instanced-mesh material submissions; verify no more than 45 draws in the visible pass.
- Call `update()` with motion on and off, then `reset()`, and verify the time-zero water positions and marker matrices are restored.
- Inspect the source for bare randomness, renderer/camera/DOM creation, remote assets, and imports other than `three`.
