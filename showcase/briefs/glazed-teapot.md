# Glazed Studio Teapot — asset brief

## Intent and fidelity lane

- Subject: a compact contemporary studio teapot, presented as a polished hero prop rather than a dimensionally exact product reconstruction.
- Fidelity lane: `polished-stylized`.
- Primary proof: a recognizable vessel silhouette, credible pouring and carrying load paths, and clearly different ceramic, brass, walnut, and unglazed-clay responses.
- Target context: close desktop showcase at roughly 76% screen coverage and 60 fps.

## Observed requirements and assumptions

| Status | Requirement or inference | Implementation |
| --- | --- | --- |
| Requested | Rounded body | A high-segment pear profile is revolved as one continuous ceramic volume. |
| Requested | Natural spout/body transition | The tapered curved spout starts inside an overlapping elliptical ceramic root collar. |
| Requested | Recognizable handle | A broad open C silhouette is formed by one continuous walnut tube. |
| Requested | Lid and knob | A separately named seated dome, brass washer, and turned walnut knob establish removal hierarchy. |
| Requested | Material separation | Glossy celadon and deep glaze, brushed brass, satin walnut, and rough unglazed clay use separate materials and real volumes. |
| Inferred | Premium studio character | Proportions are low and generous, metal accents are narrow, and decoration is limited to a lower glaze band. |
| Omitted | Functional interior wall and liquid | Only the mouth/spout recesses are modeled because the closed hero state does not expose a full interior. |
| Omitted | Scanned glaze or wood maps | No external assets are allowed in this demo module; procedural physical materials make this a stylized study, not photoreal evidence. |

## Identity-feature map

| Identity feature | Geometry/material proof | Strongest view |
| --- | --- | --- |
| Pear-shaped ceramic vessel | 72-segment lathed body with shoulder, belly, and grounded foot | `hero` |
| Upswept pouring spout | Custom tapered tube, blended base collar, flared rim, dark open end | `subjectProof` |
| Carrying handle | Continuous C-shaped walnut grip, two brass ferrules, two ceramic bosses | `orbitA` |
| Removable lid | Separate lid group with dome, brass washer, and turned wood knob | `hero` |
| Lower glaze treatment | Slightly proud deep glaze shell and fine brass reveal above a clay foot | `neutralMaterial` |
| Material response | Clear-coated celadon, darker clear-coated glaze, metallic brass, rough wood/clay | `neutralMaterial` |

## Hierarchy, connections, and load paths

```text
GLAZED_TEAPOT_ROOT
└── VESSEL_ASSEMBLY
    ├── PEAR_SHAPED_CERAMIC_BODY
    ├── UNGLAZED_CLAY_FOOT_RING
    ├── UPSWEPT_SPOUT_ASSEMBLY
    │   ├── BLENDED_SPOUT_ROOT_COLLAR
    │   ├── TAPERED_CERAMIC_SPOUT
    │   └── FLARED_POURING_LIP + OPEN_SPOUT_INTERIOR
    ├── WALNUT_HANDLE_LOAD_PATH
    │   ├── ceramic bosses (bonded joint to vessel wall)
    │   ├── brass ferrules (compression sleeve joint)
    │   └── CONTINUOUS_C_SHAPED_WALNUT_GRIP
    └── REMOVABLE_LID_ASSEMBLY
        ├── DOMED_CERAMIC_LID (seated slip-fit joint)
        ├── BRASS_KNOB_WASHER
        └── TURNED_WALNUT_LID_KNOB
```

- Handle load path: hand → walnut grip → brass ferrules → ceramic bosses → vessel wall. The ferrules and bosses are visible volumes rather than color-only joint markers.
- Spout load path: pouring lip → tapered ceramic tube → enlarged root collar → vessel wall. The curve begins inside the collar to avoid a tangent-only attachment.
- Lid joint: the dome is parented to a removable lid group and visually seats over a neck ring; no hinge is implied.

## Chosen pipeline

- Use `LatheGeometry` for rotational vessel surfaces because it produces controlled shoulder and foot curvature with fewer objects than stacked primitives.
- Use a custom tapered tube for the spout so radius decreases along the pour path; a constant-radius tube would read like attached plumbing.
- Use a Bézier `TubeGeometry` for the single-piece handle because its silhouette and smooth hand path matter more than microscopic wood grain.
- Keep all assets procedural and deterministic. No random generator, DOM access, runtime fetch, texture dependency, or hidden camera state is used.

## Budget

| Constraint | Target | Rationale |
| --- | ---: | --- |
| Triangles | ≤ 48,000 | Close views need smooth lathed curves and round ceramic/metal rims. |
| Drawable objects | ≤ 26 | Separate material and connection proof is more important than aggressively merging the hero prop. |
| Target performance | 60 fps desktop | One non-instanced hero object with no texture fetches or post-processing. |
| Closest view | 88% coverage | The spout opening, glaze reveal, and ferrules must remain readable. |

## Presentation and motion

- A charcoal-green background and floor keep the celadon silhouette legible without crushing the walnut handle.
- The shared key/rim rig is strengthened slightly, with a local warm glint to separate brass and clear coat.
- Motion is a restrained display drift of at most `0.045` radians plus a sub-centimeter lid-settle cue. Both depend only on `motionEnabled`; `reset()` restores the exact authored state.

## Self-check

- Ground contact: the recessed foot shadow bottoms at approximately `y = 0.005`; the visible clay ring rests immediately above it.
- Silhouette: body, spout, handle, and knob remain individually recognizable in the hero and side proof views.
- Connections: spout root, two handle bosses/ferrules, and lid seat are explicit named geometry.
- Materials: ceramic, brass, walnut, dark recesses, and clay are separate, lighting-responsive materials.
- Determinism: no `Math.random`, DOM code, URLs, or external assets.
- Known evidence status: module and brief are ready for runtime capture, but polished completion still requires two rendered correction rounds, fresh-eyes review, and a validated evidence manifest under `showcase/evidence/glazed-teapot/`.
