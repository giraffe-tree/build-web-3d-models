# Evidence-led reference reconstruction

## Contents

1. Intake contract
2. Detail inventory
3. Camera and review contract
4. Multi-signal decisions
5. Bounded correction
6. Runtime handoff

## Intake contract

Before modeling, record an evidence table with one row per source:

- source identifier and image dimensions;
- view direction, pose, crop, and lens uncertainty;
- dimensions or construction facts the source directly supports;
- surfaces, connections, and mechanisms it does not show;
- whether it is a photograph, drawing, marketing render, or inferred example.

Reject or request replacement for an undecodable, empty, extremely small, duplicate, or severely occluded source when it cannot support the requested fidelity. A usable single view may still proceed when hidden regions are non-critical, but label those regions as inferred rather than exact.

Keep observations and inferences separate. “Orange tube visible between these two joints” is evidence; exact tube diameter, hidden weld shape, and opposite-side symmetry may be inference. Use official dimensions for scale and real photographs for gaps, occlusion, wear, and material response.

## Detail inventory

Scan the subject from large to small:

- Macro: overall silhouette, stance, proportions, major voids, and screen coverage.
- Meso: component boundaries, joints, panels, tubes, handles, openings, and material regions.
- Micro: fasteners, tread, seams, decals, scratches, perforations, edge wear, and roughness variation.

For each retained detail, record:

- evidence source and confidence;
- owning component or material;
- intended representation: geometry, instance, texture, normal/height, decal, shader, or omission;
- validation view and projected size at the typical camera.

An inventory item is not implemented until it maps to an actual node, geometry/material parameter, texture region, or explicit omission. Do not let tertiary detail consume budget while macro silhouette or mechanical attachment is still wrong.

## Camera and review contract

Lock a reproducible reference view before iterative comparison:

- camera transform, FOV, aspect ratio, and target;
- viewport, DPR, background, exposure, tone mapping, and lighting state;
- asset seed, animation time, and semantic state.

Keep two additional, non-degenerate orbit views for any volumetric subject. Their purpose is to prove thickness, attachment, hidden-side plausibility, and hierarchy. Do not compare those views to the reference image as if the reference showed the same angle.

After every material revision, store a compact review ledger:

1. what changed, using parts, parameters, or coordinates;
2. why it changed and which evidence or defect caused it;
3. what visibly improved;
4. what still differs or remains inferred;
5. one next action: continue, revise structure, revise implementation, request input, or stop.

Use “improved” instead of “complete” when a named mismatch remains.

## Multi-signal decisions

Combine deterministic diagnostics with visual and structural review:

- silhouette overlap and screen coverage;
- bounding-box scale and centre offset;
- proportion or landmark error;
- edge and tonal distribution;
- named critical-feature checks;
- multi-angle volume and attachment integrity;
- runtime, performance, and interaction gates.

Deterministic image metrics are useful for regression and triage, but they are sensitive to background, lighting, crop, and camera calibration. Do not use one universal score as the sole gate for every subject. A small metric miss may continue with a recorded warning when structure is sound; a missing identity-defining feature or impossible mechanism may block even when the global image score passes.

Choose hard gates from the asset brief. Suitable hard gates include invalid input, missing critical component, degenerate orbit volume, detached hierarchy, broken runtime, exceeded delivery budget, or an explicit user-defined likeness threshold.

## Bounded correction

Keep refinement finite. Default to no more than three correction rounds in one phase without materially new evidence or a changed strategy.

Stop the loop when any condition repeats:

- the same defect survives two attempted fixes;
- scores or appearance oscillate between two states;
- measurable improvement plateaus twice;
- the requested fidelity depends on an unseen or unreadable region;
- further work would violate the declared performance budget.

At a stop, preserve the best known result and report one of: complete, partial, request-input, or failed-validation. A partial result must name unfinished passes and visible omissions; it must not be presented as complete.

## Runtime handoff

Keep the asset factory independent from the presentation scene. Prefer a reusable root object plus structured runtime metadata containing the parts the product actually needs, such as:

- stable nodes and named meshes;
- semantic pivots and sockets;
- colliders or interaction bounds;
- animation roles and physical limits;
- hidden-side assumptions and source confidence.

Build the webpage, camera, lights, controls, metrics, and screenshots around that asset contract. This allows the same model to be validated in a neutral review scene, a production page, or an interactive mechanism test without rewriting its geometry.
