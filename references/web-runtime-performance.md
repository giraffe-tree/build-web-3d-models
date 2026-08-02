# Web runtime and performance

## Contents

1. Runtime architecture
2. Rendering choices
3. Motion and interaction
4. Performance diagnosis
5. Optimization ladder
6. Regression strategy

## Runtime architecture

- Keep core asset generation or parsing separate from renderer-specific scene objects.
- Make geometry, materials, animation, environment, interaction, UI, export, and diagnostics independent modules.
- Preserve deterministic seeds and stable IDs so screenshots and budgets are reproducible.
- Cache immutable geometry and textures. Instance repeated topology and vary transform, color, phase, or material parameters.
- Dispose geometries, textures, render targets, skeleton data, and materials when replacing assets.

For glTF, configure all decoders before loading. Preload shared textures and decoder binaries. Precompile important shaders before revealing the hero asset when first-frame stutter matters.

## Rendering choices

- Use as few material families as the art direction allows, but do not merge objects that need independent culling, animation, or material response.
- Treat draw calls as one dimension only. A six-draw scene can still be slow when millions of triangles are repeated through shadow and depth passes.
- Fit shadow cameras tightly. Use lower-detail shadow casters and reduce or disable distant fine-structure shadows before removing visible silhouette.
- Prefer alpha test or alpha-to-coverage for foliage/cutouts when sorting is unnecessary. Alpha blend increases ordering and overdraw costs.
- Avoid double-sided materials on closed solids. Thin leaves, paper, fabric, and open shells may require them.
- Use environment lighting for stable fill and a limited number of dynamic lights.

## Motion and interaction

Store local rest transforms and attachment anchors. Update parent-to-child. For wind or flexible chains, use a spring-damper response at coarse structural levels and shader flutter at fine levels. Keep high-frequency motion small; otherwise silhouettes vibrate and shadow maps become noisy.

For mechanisms, expose semantic controls such as open angle, wheel rotation, page index, or water flow rather than raw bone transforms. Clamp to physical limits.

## Performance diagnosis

Capture these metrics:

- FPS and frame interval: user experience, but affected by VSync and throttling.
- CPU update plus render submission: JavaScript, animation, culling, and driver submission.
- WebGL/WebGPU GPU time when supported: actual render workload, excluding some browser composition.
- Draw calls and triangles per frame: include visible, depth, shadow, reflection, and other passes.
- Unique vertices and index count: geometry size, not per-frame submission.
- Geometry, texture, render-target, bone, morph, and animation memory proxies.
- Camera distance, active LOD, screen coverage estimate, shadow mode, DPR, and viewport size.

Do not use unstable FPS or software-renderer GPU timings as CI pass/fail values. Use deterministic topology, active LOD, pass counts, file size, animation metadata, and console errors for hard regression tests. Print timing only as diagnostic evidence.

## Optimization ladder

### Geometry or vertex bound

1. Find multiplicative counts: recursive branches, repeated fasteners, grass blades, spokes, petals, fur, or subdivision.
2. Remove vertices that do not affect required silhouette or deformation.
3. Instance repeated parts.
4. Add LOD with hysteresis.
5. Split a monolithic close-up mesh into cullable spatial chunks.
6. Use an impostor only beyond meaningful parallax.

### Fragment or overdraw bound

1. Reduce screen-filling transparent/alpha-tested overlap.
2. Reduce DPR or use slow adaptive resolution with hysteresis.
3. Simplify distant material features such as sheen, clearcoat, bump, transmission, refraction, and anisotropy.
4. Reduce full-screen post-processing and shadow filtering cost.
5. Keep opaque depth ordering effective.

### Shadow bound

1. Tighten the shadow frustum and map resolution.
2. Remove tiny distant casters or use a simplified proxy.
3. Update slowly changing shadows less often.
4. Preserve contact and primary form shadows; avoid eliminating all grounding cues.

### Load or memory bound

1. Remove unused nodes, attributes, morphs, clips, materials, and images.
2. Quantize and compress meshes; compress textures to KTX2/Basis when supported.
3. Share and instance.
4. Stream optional high LOD and release staging buffers.
5. Avoid flattening many copies of the same mesh into one huge buffer.

## Budget heuristics

Set budgets from target device and repetition count. Use these only as starting questions, not universal limits:

- Small repeated prop: tens of thousands of triangles at LOD0, far lower after instancing/LOD.
- Desktop hero prop: roughly 100k–500k triangles when materials and shadows are moderate.
- Complex hero organic/vehicle: 0.5M–1.5M may be acceptable on desktop only with measured passes and lower LODs.
- A scene containing many objects must budget the visible sum, shadow sum, pixels, and textures, not each asset independently.

Texture memory often dominates mobile delivery. A decoded RGBA 2048² texture is about 16 MiB before mip overhead; compressed download size is not runtime memory.

## Regression strategy

- Fix asset seed, viewport, camera, season/state, animation time, and lighting.
- Record near, typical, and far deterministic counts.
- Assert reductions against the previous known baseline when optimizing.
- Keep appearance screenshots for silhouette, material, shadow, and motion.
- Wait for the performance sample to match the current asset ID and vertex count; do not accept a stale snapshot from the previous asset.
- Test runtime errors and warnings after every reload or asset switch.

## Official references

- Three.js GLTFLoader: https://threejs.org/docs/#examples/en/loaders/GLTFLoader
- Khronos glTF registry: https://registry.khronos.org/glTF/
- Khronos glTF tools and validator: https://www.khronos.org/gltf/

Configure DRACO, KTX2, and Meshopt decoders explicitly when the asset requires their extensions. Loader support and extension coverage are version-dependent; verify against the project's installed runtime rather than assuming the latest documentation matches it.
