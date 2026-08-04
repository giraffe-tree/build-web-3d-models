# Quality-first agent prompt

## Contents

1. Builder prompt
2. Independent critic prompt
3. Quality-evidence manifest
4. Prompt anti-patterns

Use this template when delegating a polished asset or forward-testing the skill. Keep the original user request intact and replace bracketed fields. Remove irrelevant clauses instead of adding arbitrary constraints.

## Builder prompt

```text
Use $build-web-3d-models at [absolute skill path] to deliver a visually finished Web 3D showcase of [subject] for [purpose and audience].

Fidelity lane: [polished stylized | reference-faithful | photoreal hero]. Treat this as a finished visual deliverable, not a blockout or a procedural-geometry exercise. Choose Blender, procedural code, selective image-assisted authoring, or a hybrid from the closest required view and finish target. Do not restrict the work to Three.js primitives, zero textures, or a universal geometry budget unless the user explicitly requires that constraint.

Before building:
- Inspect the workspace and local instructions.
- Write a short asset brief covering target device, closest/typical view, desired screen coverage, real scale, final mood, required semantic states, and asset-specific performance budgets.
- Gather or inspect evidence for silhouette/dimensions, construction, material response, and presentation. Record observation separately from inference. If the user supplied no images, assemble a compact target board from 3–8 factual references or authored concepts. When an original polished asset still lacks a unique visual direction, apply the image-assisted workflow routed by the skill and invoke a dedicated image-generation skill to create the missing concept or texture target. Label generated images as art direction, never factual evidence; text-only facts do not define the visible finish.
- Declare the image role as none, factual reference, generated concept, generated texture source, decal/mask, or background plate. Record provenance, projection, scale, tiling/alpha requirements, post-processing, runtime budget, and proof view. Do not generate decoration that will not survive the validated camera.
- List 5–12 identity-critical features and map each to geometry, material/texture, hierarchy, or an explicit omission.
- For each identity-critical material, apply the material-realism contract routed by the skill: record real identity, layer stack, state/age, real scale, response evidence, shader features, runtime support, fallback, texture budget, and proof views.
- Explain why the chosen pipeline can meet the requested finish. If a procedural-only route cannot provide the required edge treatment, surface variation, unique detail, or art-directed silhouette, switch to Blender or hybrid.
- Treat procedural-only polished work as provisional. Before full production, capture an exact-runtime finish spike of the highest-risk edge, construction junction, material transition, and contact. For exterior architecture, apply the routed building gates and prove roof/eave, opening/envelope, and base/site regions. A failed spike requires Blender or hybrid before page polish.

Build in gated passes:
1. Macro silhouette and proportions.
2. Construction, thickness, joints, openings, attachment, and mechanism endpoints.
3. Material families, edge highlights, roughness/normal/detail variation, and neutral-light response. Treat generated rasters only as source layers: remove baked light and perspective, build seamless repeats when required, and derive aligned PBR channels from one reviewed source.
4. Asset-aware camera, lighting, exposure, background/contact treatment, hero state, and final detail.
5. Actual browser/runtime integration and performance verification.

After passes 2 and 4, capture deterministic screenshots and record the three largest visible defects. Correct the highest-impact defect before continuing. The last review must inspect the exact final files; any later pixel-affecting change invalidates it. Do not use a self-authored checklist, filename, generated source preview, or prose claim as visual proof.

Required final evidence:
- immutable original-request file and hash used by the blind critic;
- hero view at a fixed semantic state and fixed time; it may retain the intended page UI;
- two non-degenerate orbit views in asset-review mode with nonessential UI hidden;
- neutral material view in asset-review mode;
- one asset-review subject-proof view that visibly isolates the claimed close-up, silhouette, endpoint, interior, scale, or identity-critical material evidence; use it as a readable material close-up when material realism is the primary risk;
- conditional grazing, backlight, contact, and architecture-specific views required by the subject's declared risks;
- actual browser triangles/draw calls including shadow/depth/reflection passes;
- console/runtime result;
- retained runtime artifact paths and SHA-256 values, including the final model or procedural bundle rather than unattached digest strings;
- retained generated-image provenance, role, source-to-runtime transformations, and unsupported claims;
- schema-v3 quality-evidence JSON validated with scripts/validate_visual_evidence.py, including pipeline/finish-spike evidence, critical material contracts, lighting profile, finish checks, runtime artifact hashes, and conditional architecture groups;
- known limitations and status: complete, partial, blockout, or failed-validation.

For a polished result, run at least two screenshot review rounds and require an independent critic for `complete`. Give the critic only the original request, fidelity lane, and exact final rendered views. Do not reveal implementation constraints, self-scores, suspected defects, intended fixes, historical baselines, or expected outcome. Treat the builder score/status as provisional. If the critic is unavailable, keep the best result as `partial`. If it returns a lower score or status, either run one bounded repair and a fresh critique or record the lower critic status in the manifest and delivery.

Performance is a constraint on the declared appearance target. Derive budgets from the subject, device, repetition, materials, and screen coverage. Once the target passes, do not simplify visible identity, silhouette, material separation, or grounding for extra metric headroom.

Do not claim complete while a required view, critical feature, material pass, review round, or runtime gate is missing. Preserve and clearly label the best partial result when evidence or tools cannot support the requested fidelity.
```

## Independent critic prompt

Run this in a fresh context after the builder returns. Supply only the original request and rendered evidence.

```text
Review these rendered views as a [fidelity lane] Web 3D deliverable for: [original request]. Do not infer quality from implementation notes, polygon counts, or the author's claims.

First identify the subject and intended mood from the pixels alone. Then:
1. Infer whether the declared asset profile and conditional site/regional flags fit the original request; fail `profileCorrect` when they suppress required evidence.
2. Rank the five largest visible defects by impact.
3. Score silhouette/proportion /25, construction/attachment /20, material/light response /20, surface detail/variation /15, motion/interaction evidence /10, and Web presentation /10.
4. Name any identity-critical feature that is missing, visually weak, detached, implausible, clipped, or hidden by presentation.
5. Distinguish a true finish defect from a deliberate stylization choice.
6. Return the schema-v3 hard-gate booleans, one highest-value next change, and a status: complete, partial, blockout, or failed-validation.

Treat a broken critical feature as a gate even if the total score is high. Treat absent views as missing evidence, not as a pass.
```

## Quality-evidence manifest

Save a manifest beside the rendered evidence. Paths may be relative to the manifest.

```json
{
  "schemaVersion": 3,
  "assetId": "ergonomic-chair-v2",
  "assetProfile": "general",
  "siteEnvironment": false,
  "regionalStyle": false,
  "fidelityLane": "polished-stylized",
  "status": "complete",
  "requestEvidence": {
    "path": "original-request.txt",
    "sha256": "<sha256 of original-request.txt>"
  },
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
    },
    {
      "name": "seat-to-back ergonomic proportion",
      "critical": true,
      "representation": "authored silhouette geometry",
      "evidenceView": "hero",
      "status": "verified"
    },
    {
      "name": "lumbar support attachment",
      "critical": true,
      "representation": "geometry and hierarchy",
      "evidenceView": "orbitB",
      "status": "verified"
    },
    {
      "name": "caster and axle construction",
      "critical": true,
      "representation": "geometry with semantic pivots",
      "evidenceView": "subjectProof",
      "status": "verified"
    },
    {
      "name": "mesh upholstery identity",
      "critical": true,
      "representation": "material contract and edge geometry",
      "evidenceView": "neutralMaterial",
      "status": "verified"
    }
  ],
  "pipelineDecision": {
    "route": "hybrid",
    "rationale": "Blender supplies authored construction and baked surface response; Web code supplies interaction and diagnostics.",
    "closestViewMeters": 0.45,
    "qualityRisks": [
      {"name": "mesh upholstery response", "mitigation": "authored normal and roughness contract", "proofView": "neutralMaterial"},
      {"name": "base and caster attachment", "mitigation": "authored joints and orbit review", "proofView": "orbitA"}
    ],
    "finishSpike": {
      "required": false,
      "status": "not-required",
      "decision": "The authored Blender route has prior exact-runtime proof for the declared risks.",
      "evidenceViews": []
    }
  },
  "materialContracts": [
    {
      "materialId": "seat-mesh",
      "realMaterial": "tensioned woven polymer mesh",
      "layerStack": "frame > woven load-bearing mesh > handling dust",
      "realScale": "meters; weave and edge dimensions recorded in millimeters",
      "runtimeBinding": "vela-chair.glb::SeatMesh",
      "critical": true,
      "status": "verified",
      "proofViews": ["neutralMaterial", "subjectProof"],
      "scaleBands": {
        "macro": {"physicalScale": "0.1-1 m", "representationOrOmission": "geometry tension and color variation"},
        "meso": {"physicalScale": "1-100 mm", "representationOrOmission": "normal, roughness, and edge geometry"},
        "micro": {"physicalScale": "0.05-1 mm", "representationOrOmission": "detail normal at the closest view"}
      }
    }
  ],
  "lightingProfile": {
    "profileId": "chair-neutral-final-v1",
    "rendererBuild": "production build ID",
    "colorManagement": "sRGB output",
    "toneMappingExposure": "ACES, exposure 1.0",
    "environment": "neutral studio HDR hash or documented procedural environment",
    "contactStrategy": "one key shadow plus reviewed contact treatment",
    "proofViews": ["neutralMaterial", "subjectProof"]
  },
  "finishChecks": {
    "edgeTreatment": {"status": "passed", "proofViews": ["subjectProof"]},
    "constructionDepth": {"status": "passed", "proofViews": ["orbitA"]},
    "materialSeparation": {"status": "passed", "proofViews": ["neutralMaterial"]},
    "surfaceVariation": {"status": "passed", "proofViews": ["neutralMaterial"]},
    "contactGrounding": {"status": "passed", "proofViews": ["hero"]}
  },
  "runtimeEvidence": {
    "buildId": "production build ID",
    "artifacts": [
      {"name": "vela-chair.glb", "kind": "model", "path": "assets/vela-chair.glb", "sha256": "<sha256>"},
      {"name": "runtime-bundle", "kind": "runtime-bundle", "path": "dist/assets/index.js", "sha256": "<sha256>"}
    ],
    "consoleErrors": 0,
    "requiredPathPassed": true
  },
  "imageLineage": [],
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
      "defects": [
        {"id": "seat-thickness", "view": "hero", "severity": "high"},
        {"id": "caster-scale", "view": "orbitA", "severity": "medium"},
        {"id": "mesh-response", "view": "neutralMaterial", "severity": "medium"}
      ],
      "selectedDefectId": "seat-thickness",
      "reviewerType": "builder",
      "inputViews": {
        "hero": {"path": "screenshots/round-0/hero.png", "sha256": "<round-0 hero sha256>"},
        "orbitA": {"path": "screenshots/round-0/orbit-a.png", "sha256": "<round-0 orbit-a sha256>"},
        "orbitB": {"path": "screenshots/round-0/orbit-b.png", "sha256": "<round-0 orbit-b sha256>"},
        "neutralMaterial": {"path": "screenshots/round-0/neutral.png", "sha256": "<round-0 neutral sha256>"},
        "subjectProof": {"path": "screenshots/round-0/subject-proof.png", "sha256": "<round-0 subject-proof sha256>"}
      },
      "outputViews": {
        "hero": {"path": "screenshots/round-1/hero.png", "sha256": "<round-1 hero sha256>"},
        "orbitA": {"path": "screenshots/round-1/orbit-a.png", "sha256": "<round-1 orbit-a sha256>"},
        "orbitB": {"path": "screenshots/round-1/orbit-b.png", "sha256": "<round-1 orbit-b sha256>"},
        "neutralMaterial": {"path": "screenshots/round-1/neutral.png", "sha256": "<round-1 neutral sha256>"},
        "subjectProof": {"path": "screenshots/round-1/subject-proof.png", "sha256": "<round-1 subject-proof sha256>"}
      },
      "change": "corrected seat thickness and caster scale",
      "result": "human-scale relationship improved; mesh response remains"
    },
    {
      "largestDefects": ["mesh response too flat", "contact shadow too broad"],
      "defects": [
        {"id": "mesh-response", "view": "neutralMaterial", "severity": "high"},
        {"id": "contact-shadow", "view": "hero", "severity": "medium"}
      ],
      "selectedDefectId": "mesh-response",
      "reviewerType": "builder",
      "inputViews": {
        "hero": {"path": "screenshots/round-1/hero.png", "sha256": "<round-1 hero sha256>"},
        "orbitA": {"path": "screenshots/round-1/orbit-a.png", "sha256": "<round-1 orbit-a sha256>"},
        "orbitB": {"path": "screenshots/round-1/orbit-b.png", "sha256": "<round-1 orbit-b sha256>"},
        "neutralMaterial": {"path": "screenshots/round-1/neutral.png", "sha256": "<round-1 neutral sha256>"},
        "subjectProof": {"path": "screenshots/round-1/subject-proof.png", "sha256": "<round-1 subject-proof sha256>"}
      },
      "outputViews": {
        "hero": {"path": "screenshots/hero.png", "sha256": "<same sha256 as views.hero>"},
        "orbitA": {"path": "screenshots/orbit-a.png", "sha256": "<same sha256 as views.orbitA>"},
        "orbitB": {"path": "screenshots/orbit-b.png", "sha256": "<same sha256 as views.orbitB>"},
        "neutralMaterial": {"path": "screenshots/neutral.png", "sha256": "<same sha256 as views.neutralMaterial>"},
        "subjectProof": {"path": "screenshots/linkage-close.png", "sha256": "<same sha256 as views.subjectProof>"}
      },
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
    },
    "provenance": {
      "requestSha256": "<sha256 of the original request>",
      "reportSha256": "<sha256 of independent-critic.md>",
      "promptSpecVersion": "quality-critic-v1",
      "criticRunId": "<external run ID>",
      "model": "<critic model>",
      "contextAllowlist": ["original-request", "fidelity-lane", "final-views"]
    },
    "hardGates": {
      "profileCorrect": true,
      "identityReadable": true,
      "notBlockout": true,
      "constructionReadable": true,
      "materialsReadable": true,
      "edgeTreatmentReadable": true,
      "noSevereArtifacts": true
    }
  },
  "limitations": ["caster steering is not simulated"]
}
```

For `assetProfile: "architecture-exterior"`, add `roofEaveClose`, `openingJunctionClose`, and `baseGroundContact` to `acceptance.requiredViews`; add `landscapeNear` when `siteEnvironment` is true. Use these exact `mandatoryFeatureGroups` names: `massing-scale`, `roof-system`, `envelope-openings`, `edges-connections`, `material-response`, and `base-ground-contact`; add `site-vegetation` and `regional-cues` when their flags are true. For `assetProfile: "environment"`, use `environment-scale`, `material-response`, and `base-ground-contact`, plus the same conditional groups. Every group must name a required evidence view and be `verified` for `complete`.

When `imageLineage` contains `retained-runtime`, use a texture/decal/background role; bind distinct source and processed derivative files with `path` and `sha256`; record real `operations`, `physicalCoverage`, `projection`, and `channelSemantics`; and set `runtimeBinding` to `{ "artifactName": "<runtime artifact name>", "target": "<material/slot/code target>" }`. Use `concept-only` for preserved art-direction files that contribute no generated pixels to the runtime.

Run:

```bash
python3 scripts/validate_visual_evidence.py path/to/quality-evidence.json
```

The schema-v3 manifest binds the final review and critic to exact evidence bytes and adds non-lowerable polished gates. It does not make aesthetics objective or prove critic independence cryptographically; the external critic's lower score/status controls the completion claim.

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
