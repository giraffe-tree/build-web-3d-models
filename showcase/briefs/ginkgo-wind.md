# Ginkgo Wind — asset brief

## Purpose and viewing

- Purpose: deterministic organic forward test for a mature hero tree, procedural hierarchy, repeated foliage, and wind attachment.
- Typical view: full tree at roughly 8–12 m camera distance; closest useful view is a branch-and-leaf cluster; silhouette view must still read as a broad, upright ginkgo crown.
- Shared-runtime framing: camera direction `[1.45, 0.8, 1.75]`, target near mid-trunk, and a coherent tree height of about 6.3 relative units with ground contact at `y = 0`.
- Target: desktop and modern mobile WebGL at the shared showcase frame-time target; no downloads, textures, or renderer-specific setup.

## Requirements and interpretation

- Observed requirements: a mature ginkgo tree, hierarchical branching, recognizable fan leaves, grounded roots, deterministic generation, and subtle parent-to-child wind.
- Inference: “mature” is expressed by a widened root flare, a tapered segmented leader, low-to-high primary boughs, forked secondaries, and a broad irregular crown rather than a sapling pole.
- Inference: ginkgo identity depends most on the notched fan-leaf silhouette, long petioles, clustered attachment, yellow-green variation, and an upright branching habit.
- Omitted: bark textures, leaf veins, seasonal controls, collision, LOD transitions, and shadow-distance switching. These would add little to the forward-test goals at its expected scale.

## Hierarchy and motion

`GinkgoTree` owns exposed root instances, a five-segment articulated trunk chain, and global petiole/leaf instances. Primary bough pivots attach to explicit positions on trunk segments. Every primary owns a continuation and a side fork, so child transforms inherit trunk and parent-bough motion. Leaf and petiole instance matrices are rebuilt from their recorded branch attachment frame.

All structural nodes retain a local rest quaternion. Wind adds low-frequency local bend with flexibility increasing from trunk base to branch tip; leaf fans add only a small, faster flutter about their petiole endpoint. With `motionEnabled = false`, the exact rest pose is restored.

## Budget

- Geometry target: fewer than 10,000 rendered triangles, comfortably below the 80,000 contract.
- Draw-call target: 32 (5 trunk segments, 24 branch segments, one root instance set, one petiole instance set, and one leaf instance set), below the 45-call contract.
- Foliage target: roughly 220–280 fan leaves, sharing one indexed geometry and one material through instancing.
- Materials: one bark family, one petiole material, and one double-sided foliage material; metalness remains zero.

## Determinism and self-check

- Variation comes from a fixed integer-seeded PRNG; bare `Math.random()` is not used.
- The trunk begins at `y = 0`; exposed roots descend from the flare toward the floor without moving the tree origin.
- Leaf shape is real geometry with a central notch and a broad fan perimeter, not a label or texture cue.
- Branch cylinders start at their local pivot and overlap their parent slightly, preventing visible wind gaps.
- Motion is calculated only from `elapsedSeconds` and `motionEnabled`; `reset()` restores structural and foliage transforms.
- Focused verification: import the module with the installed `three`, instantiate it, run enabled/disabled updates, and inspect object, triangle, draw-call-proxy, and instance counts.
