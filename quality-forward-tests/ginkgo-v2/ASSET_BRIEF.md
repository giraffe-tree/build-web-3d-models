# Asset brief — Ginkgo / light wind study

## Acceptance lane and purpose

- Fidelity lane: **polished stylized**. This is a visually finished desktop portfolio hero, not a botanical reconstruction or a blockout.
- Purpose: a single mature *Ginkgo biloba* specimen that remains credible from a close full-tree hero camera and two user-controlled orbit angles.
- Status gate: “complete” requires the five fixed browser-rendered views, two bounded review rounds, a clean runtime/console check, passing deterministic budgets, and a validated `quality-evidence.json`.

## Viewing and presentation

- Real-scale interpretation: approximately 12 m tall, 8.5–9 m crown spread, 1.35 m root-flare diameter. The leaf mesh uses a deliberately enlarged stylized height range of 18–26 cm (rather than the observed 5–8 cm) so the characteristic fan silhouette survives a full-tree desktop view; this exaggeration is a declared art-direction choice, not a botanical measurement.
- Fixed review viewport: 1440 × 900 CSS px; renderer DPR capped at 1.5.
- Hero: 28° FOV, camera around 18–22 m from the crown centre, tree occupies 65–75% of usable height while keeping the root flare visible.
- Orbit A: rear three-quarter view that proves crown depth, major-bough attachment, and asymmetric branching.
- Orbit B: lower side view that proves root contact, trunk taper, and under-canopy construction.
- Neutral material: broad neutral illumination and low-saturation background, with restrained grading.
- Subject proof: a close branch-and-leaf cluster showing fan/notch silhouette, petioles, short shoots, and bark transition.
- Presentation mood: an editorial botanical gallery at the start of autumn—warm parchment, limestone ground, quiet golden rim light, and large negative space. This is an art-direction inference rather than a claimed habitat reconstruction.

## Evidence: observation versus inference

The task supplied no reference images, so this is explicitly a generic, art-directed species interpretation. Four institutional sources were used to resolve identity rather than to claim one-tree fidelity.

1. [NC State Extension — Ginkgo biloba](https://plants.ces.ncsu.edu/plants/ginkgo-biloba/common-name/maidenhair-tree/)
   - Observed: mature height 50–80 ft and spread 30–40 ft; loosely pyramidal/horizontal form; alternate, fan-shaped 2–3 inch leaves, often in clusters of three to five; dichotomous venation; ridged grey-brown bark; long and short shoots.
   - Applied: broad uneven crown, short-shoot leaf clusters, fan/notch leaf geometry, radial vein texture, and longitudinal bark rhythm.
2. [Arnold Arboretum — Ginkgo](https://arboretum.harvard.edu/plant-bios/ginkgo/)
   - Observed: the institution calls out fan-shaped leaves, spur branches, and gray deeply fissured bark as defining characteristics.
   - Applied: these three cues are critical gates and each has a dedicated geometric/material representation.
3. [Missouri Botanical Garden — Ginkgo biloba](https://www.missouribotanicalgarden.org/PlantFinder/PlantFinderDetails.aspx?chr=15&isprofile=0&pt=14&taxonid=280988&z=6)
   - Observed: large deciduous tree; 50–80 ft typical height, 30–40 ft spread; distinctive two-lobed fan leaves; bright yellow autumn colour.
   - Applied: mature scale, a broad crown ratio, occasional pronounced central notches, and a restrained green-to-gold seasonal palette.
4. [Denver Botanic Gardens navigator — Ginkgo biloba](https://navigate.botanicgardens.org/weboi/oecgi2.exe/INET_ECM_DispPl?NAMENUM=4698)
   - Observed: conical growth-form classification and photographic sets covering bark, leaf, and root relationships.
   - Applied: an underlying tapered envelope, broken by mature horizontal boughs and a visible flared root collar.

Inferred/art-directed: exact bough placement, asymmetry, leaf count, the absence of seeds, the limestone presentation pad, the early-autumn colour mixture, wind direction, and the gallery lighting rig.

## Identity inventory

| Feature | Critical | Representation | Proof view |
| --- | --- | --- | --- |
| Mature broad-pyramidal crown with irregular shoulders | yes | art-directed hierarchical skeleton and clustered leaf volume | hero |
| Strong trunk taper and aged asymmetric root flare | yes | custom ribbed trunk mesh plus nine curved root meshes | orbitB |
| Longitudinal, deeply fissured grey-brown bark | yes | displaced trunk rings, layered groove shader, roughness variation | subjectProof |
| Primary branches visibly emerge and taper from the trunk | yes | named primary-bough groups with tapered structural segments | orbitA |
| Successive branch diameter/length reduction | yes | depth-specific radial topology and taper ratios | orbitA |
| Short spur shoots between twigs and leaf clusters | yes | explicit short-shoot geometry and cluster anchors | subjectProof |
| Fan-shaped leaves with a readable centre notch | yes | dedicated scalloped/notched fan mesh, not generic planes | subjectProof |
| Diverging vein rhythm | no | generated 256² linear/radial vein texture and material modulation | subjectProof |
| Leaves attach through visible petioles | yes | instanced tapered petiole geometry under the same bough group | subjectProof |
| Structured light-wind hierarchy | yes | low-frequency primary-bough sway with child twigs/leaves inherited; leaf-only micro flutter | hero / live runtime |
| Restrained seasonal variation | no | deterministic per-instance green/chartreuse/gold palette | neutralMaterial |
| Grounded specimen presentation | yes | root contact, tight shadow, leaf litter, limestone/moss tonal breakup | orbitB |

## Pipeline choice

Procedural Three.js is selected because the tree’s identity comes from seeded hierarchical repetition, explicit attachment, and runtime wind. It can meet the close-view finish because the implementation includes non-primitive authored leaf topology, a custom ribbed trunk, curved/tapered branch meshes, petioles and short shoots, generated vein texture, roughness/color variation, and an asset-specific lighting rig. Blender would add sculpted uniqueness but would make hierarchical wind and deterministic revision slower without improving the full-tree target enough to justify the handoff. No external image asset or texture is shipped.

## Asset-specific Web budgets

Target device: 2021-or-newer desktop/laptop with an integrated GPU, modern Chrome/Safari/Edge, WebGL2 preferred and WebGL1 fallback acceptable.

| Metric | Budget | Rationale |
| --- | ---: | --- |
| Model triangles | ≤ 450,000 | desktop organic hero; enough for ribbed trunk, branches, and geometric fan leaves |
| Unique geometry vertices | ≤ 350,000 | repeated leaves/petioles are instanced; branch topology goes only where silhouette bends |
| Browser frame triangles | ≤ 900,000 | includes the main render plus branch/foliage shadow submissions |
| Frame draw calls | ≤ 40 | material separation and bough-level culling/motion retained |
| Material families | ≤ 8 | bark, twig, leaves, petioles, ground, moss, litter, atmospheric accents |
| Textures | ≤ 4; ≤ 16 MiB decoded | generated leaf-vein map plus small procedural ground detail; no photo textures |
| Shadow casters | trunk + primary/secondary wood + instanced foliage | close hero needs leaf/contact shadows; distant LOD is outside this one-specimen page |
| JS bundle | ≤ 900 KiB gzip | Three.js and controls dominate; no large model payload |
| First interactive (local warm server) | ≤ 2.5 s | deterministic generation and shader compile included |
| CPU animation | ≤ 2 ms typical | only primary bough groups and uniforms update; no per-leaf JS transform loop |
| Target cadence | 60 fps target, ≥ 30 fps acceptable diagnostic floor | frame timing is diagnostic, not a deterministic hard gate |

## Motion states and controls

- Default semantic state: `lightWind`, deterministic phase seed `GINKGO_1976`, approximately 0.18 normalized wind strength.
- Fixed screenshot time: 2.4 s. Capture mode freezes structural and flutter phase at that time.
- User path: drag to orbit, wheel/pinch to zoom, keyboard-accessible view buttons, and a visible wind pause/resume button.
- Structural motion: each primary bough receives a depth/stiffness-specific low-frequency bend. All branches, petioles, and leaves inside that group inherit it.
- Fine motion: leaf shader adds a small, higher-frequency rotation/offset around the instance attachment; amplitude is intentionally below the fan radius.

## Deliverables

- Editable procedural source and local Web runtime.
- Five deterministic final PNGs: hero, orbit A, orbit B, neutral material, and subject proof.
- Two rounds of screenshot evidence and a review ledger.
- Runtime/performance checks, console result, known limitations, and a validator-passing `quality-evidence.json`.
