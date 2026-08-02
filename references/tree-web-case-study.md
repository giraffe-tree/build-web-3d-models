# Tree-web case study

## Contents

1. Transferable architecture
2. Modeling lessons
3. Motion and attachment
4. Measured performance lesson
5. Validation pattern
6. Anti-patterns

## Transferable architecture

The tree project separates:

- Species/asset parameters from generators.
- Skeleton construction from mesh construction.
- Core typed mesh data from Three.js BufferGeometry.
- Materials, environment, wind, physics, UI, export, and performance monitoring.
- Deterministic generation from renderer-specific behavior.

This separation makes the same approach reusable for a bicycle hierarchy, modular house, procedural river, flower, mushroom cluster, articulated tool, or animal rig.

## Modeling lessons

- Match macro silhouette before adding recursive detail.
- Recursive count multiplies quickly. Always print node counts by depth and geometry contribution by category.
- Model attachment structures that remain visible. Silver ginkgo leaves look artificial when they share a point on a large branch; short shoots and petioles make the hierarchy readable.
- Do not spend equal topology everywhere. Use more radial segments on the trunk/primary branches and minimal cross-sections on millimeter-scale terminal shoots.
- Preserve realism while optimizing coverage. Reducing ginkgo short-shoot and leaf count was paired with a physically plausible increase in remaining leaf size.
- Color variation should come from per-element palette/attributes and lighting orientation, not a single baked brightness multiplier.

## Motion and attachment

Each vertex carries attachment and motion data:

- Cumulative flexibility weight from root to tip.
- Position along the local branch.
- Random phase.
- Local anchor and parent branch anchor.
- Hierarchy depth.
- Fine-motion flag for leaves.

Structural wind uses hierarchy-level bend; leaf flutter uses higher-frequency shader motion. The child stays attached because deformation is evaluated from the same parent anchor rather than an unrelated world-space offset.

Generalize this pattern:

- Book page: spine hinge anchor plus page curl coordinate.
- Chair cushion: frame socket plus local soft-body or blend deformation.
- Bicycle: frame hierarchy plus axle and crank pivots.
- Flower: stem bend plus petal flutter.
- Animal: armature bone plus vertex weights and secondary-motion chain.

## Measured performance lesson

Original ginkgo:

- 46,249 skeleton nodes; 43,290 were terminal short shoots.
- About 248,413 leaves.
- 3,552,340 unique vertices and 2,763,001 model triangles.
- 5,526,006 triangles per frame because the visible model was submitted again to the shadow pass.
- Only six draw calls: the bottleneck was geometry and shadow throughput, not call count.

Targeted optimization:

- Reduce terminal short-shoot count, cap each cluster at fewer leaves, and simplify the fan edge.
- Increase remaining leaf size within real ginkgo dimensions to preserve canopy coverage.
- Result: 2,495,639 vertices (-29.7%) and 1,983,588 model triangles (-28.2%).
- Disable dense leaf shadow casting beyond 1.35 tree heights; restore below 1.15 heights.
- Far frame triangles fell to about 2.89M (-47.7% from the original) and draw calls fell from six to five while near shadows remained complete.

The key sequence was: measure the actual repeated structure, remove multiplicative waste, compensate appearance, then reduce a redundant render pass by distance.

## Validation pattern

- Keep seed, season, lighting, and camera deterministic.
- Capture near and far screenshots before changing parameters.
- Assert unique vertices, model triangles, frame triangles, draw calls, active shadow/LOD state, and console cleanliness.
- Do not hard-fail CI on FPS or GPU time from software renderers or background tabs.
- Wait until the sampled asset ID or vertex count matches the selected asset; otherwise a performance panel may report stale data.
- Commit geometry and render-pass changes separately so visual and performance effects can be isolated.

## Anti-patterns

- Judging cost from draw calls alone.
- Flattening all close-up foliage into one uncullable mesh without LOD or chunks.
- Applying the same mesh density at every hierarchy depth.
- Randomizing attachment without biological or mechanical rules.
- Turning off all shadows at all distances when a distant proxy or threshold is sufficient.
- Reducing leaf/grass/petal count without preserving projected coverage.
- Treating frame interval as GPU time when timer queries are unavailable.
- Using device FPS as a deterministic regression assertion.

