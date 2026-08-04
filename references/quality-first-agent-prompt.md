# Quality-first agent prompt

Use this template when delegating a polished asset or forward-testing the skill. Keep the original user request intact and replace bracketed fields. Remove irrelevant clauses instead of adding arbitrary constraints.

## Builder prompt

```text
Use $build-web-3d-models at [absolute skill path] to deliver a visually finished Web 3D showcase of [subject] for [purpose and audience].

Fidelity lane: [polished stylized | reference-faithful | photoreal hero]. Treat this as a finished visual deliverable, not a blockout or a procedural-geometry exercise. Choose Blender, procedural code, selective image-assisted authoring, or a hybrid from the closest required view and finish target. Do not restrict the work to Three.js primitives, zero textures, or a universal geometry budget unless the user explicitly requires that constraint.

Before building:
- Inspect the workspace and local instructions.
- Write a short asset brief covering target device, closest/typical view, desired screen coverage, real scale, final mood, required semantic states, and asset-specific performance budgets.
- Gather or inspect evidence for silhouette/dimensions, construction, material response, and presentation. Record observation separately from inference. If the user supplied no images, assemble a compact target board from 3–8 factual references or authored concepts. When an original polished asset still lacks a unique visual direction, read references/image-assisted-asset-workflow.md and invoke a dedicated image-generation skill to create the missing concept or texture target. Label generated images as art direction, never factual evidence; text-only facts do not define the visible finish.
- Declare the image role as none, factual reference, generated concept, generated texture source, decal/mask, or background plate. Record provenance, projection, scale, tiling/alpha requirements, post-processing, runtime budget, and proof view. Do not generate decoration that will not survive the validated camera.
- List 5–12 identity-critical features and map each to geometry, material/texture, hierarchy, or an explicit omission.
- For each identity-critical material, write a compact contract covering its real identity, layer stack, state/age, real scale, response evidence, shader features, runtime support, fallback, texture budget, and proof views. Use references/material-realism.md for material-critical, reference-faithful, photoreal/AAA, or close-up hero work.
- Explain why the chosen pipeline can meet the requested finish. If a procedural-only route cannot provide the required edge treatment, surface variation, unique detail, or art-directed silhouette, switch to Blender or hybrid.

Build in gated passes:
1. Macro silhouette and proportions.
2. Construction, thickness, joints, openings, attachment, and mechanism endpoints.
3. Material families, edge highlights, roughness/normal/detail variation, and neutral-light response. Treat generated rasters only as source layers: remove baked light and perspective, build seamless repeats when required, and derive aligned PBR channels from one reviewed source.
4. Asset-aware camera, lighting, exposure, background/contact treatment, hero state, and final detail.
5. Actual browser/runtime integration and performance verification.

After passes 2 and 4, capture deterministic screenshots and record the three largest visible defects. Correct the highest-impact defect before continuing. The last review must inspect the exact final files; any later pixel-affecting change invalidates it. Do not use a self-authored checklist, filename, generated source preview, or prose claim as visual proof.

Required final evidence:
- hero view at a fixed semantic state and fixed time; it may retain the intended page UI;
- two non-degenerate orbit views in asset-review mode with nonessential UI hidden;
- neutral material view in asset-review mode;
- one asset-review subject-proof view that visibly isolates the claimed close-up, silhouette, endpoint, interior, scale, or identity-critical material evidence; use it as a readable material close-up when material realism is the primary risk;
- actual browser triangles/draw calls including shadow/depth/reflection passes;
- console/runtime result;
- retained generated-image provenance, role, source-to-runtime transformations, and unsupported claims;
- quality-evidence JSON validated with scripts/validate_visual_evidence.py;
- known limitations and status: complete, partial, blockout, or failed-validation.

For a polished result, run at least two screenshot review rounds. If fresh subagents are available, ask an independent critic to review only the original request, fidelity lane, and exact final rendered views. Do not reveal implementation constraints, self-scores, suspected defects, or intended fixes. Treat the builder score/status as provisional. If the critic returns a lower score or status, either run one bounded repair and a fresh critique or record the lower critic status in the manifest and delivery.

Performance is a constraint on the declared appearance target. Derive budgets from the subject, device, repetition, materials, and screen coverage. Once the target passes, do not simplify visible identity, silhouette, material separation, or grounding for extra metric headroom.

Do not claim complete while a required view, critical feature, material pass, review round, or runtime gate is missing. Preserve and clearly label the best partial result when evidence or tools cannot support the requested fidelity.
```

## Independent critic prompt

Run this in a fresh context after the builder returns. Supply only the original request and rendered evidence.

```text
Review these rendered views as a [fidelity lane] Web 3D deliverable for: [original request]. Do not infer quality from implementation notes, polygon counts, or the author's claims.

First identify the subject and intended mood from the pixels alone. Then:
1. Rank the five largest visible defects by impact.
2. Score silhouette/proportion /25, construction/attachment /20, material/light response /20, surface detail/variation /15, motion/interaction evidence /10, and Web presentation /10.
3. Name any identity-critical feature that is missing, visually weak, detached, implausible, clipped, or hidden by presentation.
4. Distinguish a true finish defect from a deliberate stylization choice.
5. Return one highest-value next change and a status: complete, partial, blockout, or failed-validation.

Treat a broken critical feature as a gate even if the total score is high. Treat absent views as missing evidence, not as a pass.
```

## Quality-evidence manifest

Save a manifest beside the rendered evidence. Paths may be relative to the manifest.

```json
{
  "schemaVersion": 2,
  "assetId": "ergonomic-chair-v2",
  "fidelityLane": "polished-stylized",
  "status": "complete",
  "acceptance": {
    "visualScoreMinimum": 75,
    "minimumWidth": 1280,
    "minimumHeight": 720,
    "minimumReviewRounds": 2,
    "independentCriticRequired": true,
    "requiredViews": ["hero", "orbitA", "orbitB", "neutralMaterial", "subjectProof"]
  },
  "identityFeatures": [
    {
      "name": "five-star load-bearing base",
      "critical": true,
      "representation": "geometry and named hierarchy",
      "evidenceView": "orbitA",
      "status": "verified"
    }
  ],
  "views": {
    "hero": {
      "path": "screenshots/hero.png",
      "semanticState": "rest",
      "fixedTimeSeconds": 0,
      "cameraDirection": [1.4, 0.8, 1.6],
      "uiMode": "page",
      "sha256": "<sha256 of hero.png>"
    },
    "orbitA": { "path": "screenshots/orbit-a.png", "semanticState": "rest", "fixedTimeSeconds": 0, "cameraDirection": [-1.4, 0.7, 1.5], "uiMode": "review", "sha256": "<sha256>" },
    "orbitB": { "path": "screenshots/orbit-b.png", "semanticState": "rest", "fixedTimeSeconds": 0, "cameraDirection": [1.2, 0.6, -1.6], "uiMode": "review", "sha256": "<sha256>" },
    "neutralMaterial": { "path": "screenshots/neutral.png", "semanticState": "rest", "fixedTimeSeconds": 0, "cameraDirection": [0, 0.5, 1.8], "uiMode": "review", "sha256": "<sha256>" },
    "subjectProof": { "path": "screenshots/linkage-close.png", "semanticState": "rest", "fixedTimeSeconds": 0, "cameraDirection": [0.7, 0.3, 1.1], "uiMode": "review", "sha256": "<sha256>" }
  },
  "reviewRounds": [
    {
      "largestDefects": ["seat too thick", "casters too large", "mesh response too flat"],
      "change": "corrected seat thickness and caster scale",
      "result": "human-scale relationship improved; mesh response remains"
    },
    {
      "largestDefects": ["mesh response too flat", "contact shadow too broad"],
      "change": "added woven normal response and tightened contact shadow",
      "result": "material and grounding improved"
    }
  ],
  "rubric": {
    "silhouetteProportion": 20,
    "constructionAttachment": 16,
    "materialLightResponse": 16,
    "surfaceDetailVariation": 11,
    "motionInteraction": 8,
    "webPresentation": 8
  },
  "finalReview": {
    "reviewedViewHashes": {
      "hero": "<same sha256 as views.hero>",
      "orbitA": "<same sha256 as views.orbitA>",
      "orbitB": "<same sha256 as views.orbitB>",
      "neutralMaterial": "<same sha256 as views.neutralMaterial>",
      "subjectProof": "<same sha256 as views.subjectProof>"
    }
  },
  "independentCritic": {
    "reportPath": "independent-critic.md",
    "status": "complete",
    "rubric": {
      "silhouetteProportion": 20,
      "constructionAttachment": 16,
      "materialLightResponse": 16,
      "surfaceDetailVariation": 11,
      "motionInteraction": 8,
      "webPresentation": 8
    },
    "reviewedViewHashes": {
      "hero": "<same sha256 as views.hero>",
      "orbitA": "<same sha256 as views.orbitA>",
      "orbitB": "<same sha256 as views.orbitB>",
      "neutralMaterial": "<same sha256 as views.neutralMaterial>",
      "subjectProof": "<same sha256 as views.subjectProof>"
    }
  },
  "limitations": ["caster steering is not simulated"]
}
```

Run:

```bash
python3 scripts/validate_visual_evidence.py path/to/quality-evidence.json
```

The schema-v2 manifest binds the final review and critic to exact evidence bytes. It does not make aesthetics objective; the independent critic's lower score/status controls the completion claim when the critic is required.

## Prompt anti-patterns

Avoid adding these constraints unless they are real user requirements:

- “Use only deterministic procedural Three.js primitives.”
- “Use no textures, authored assets, Blender, or external references.”
- “Generate separate final albedo, normal, roughness, metallic, and AO maps and trust them without channel alignment or physical review.”
- “Keep it compact/modest” when the user asked for a hero asset.
- One shared `80k triangles / 45 draws` cap for unrelated asset families.
- “Make it recognizable” as the only visual acceptance criterion.
- “Return after syntax/import checks” without rendered multi-view evidence.

Those phrases are useful for a narrow engineering exercise, but they evaluate blockout efficiency—not the skill's ability to deliver high visual quality.
