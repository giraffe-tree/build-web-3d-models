# Repository Instructions

## Scope

This repository is the source of truth for the `build-web-3d-models` Codex skill.

- Keep `SKILL.md` concise and procedural.
- Put detailed, task-specific guidance in one-level-deep files under `references/`.
- Put deterministic, reusable checks under `scripts/`.
- `scripts/capture_views.mjs` captures deterministic fixed-view and consecutive-frame screenshots from a running Three.js page.
- `scripts/score_silhouette.py` scores silhouette metrics as a diagnostic for organic-form failures (lattice branches, repeated canopy pads); it is a diagnostic, not a hard gate.
- `scripts/fetch_pbr.py` fetches licensed scan PBR texture sets for material-critical surfaces.
- Keep `agents/openai.yaml` aligned with `SKILL.md`.
- Do not add README, changelog, installation guide, benchmark output, generated assets, or other repository clutter unless the user explicitly requests it.

## Required workflow for every future change

1. Inspect `git status -sb` and the relevant diff before editing.
2. Preserve unrelated user changes.
3. Make one coherent functional change at a time.
4. Run the relevant validation:
   - `python3 /Users/giraffetree/.codex/skills/.system/skill-creator/scripts/quick_validate.py .`
   - `python3 -m py_compile scripts/*.py` when Python scripts change.
   - `python3 scripts/validate_visual_evidence.py --self-test` when the visual-evidence validator changes.
   - `python3 scripts/validate_visual_evidence.py <manifest.json>` when a polished artifact adds or updates a quality-evidence manifest.
   - A representative script invocation when behavior changes.
5. Review `git diff --check`, `git status -sb`, and the staged diff.
6. Commit the completed logical change with a terse imperative message.
7. Push the current branch to `origin` after every successful commit.
8. Never finish an authorized repository change with uncommitted or unpushed work. If validation or push is blocked, report the exact blocker and leave the worktree state explicit.

## Quality workflow conventions

- Motion and interaction claims require `motionEvidence`: consecutive frames captured at fixed times and fixed parameters. A still frame is not interaction evidence.
- Attachments must be declared with the joint vocabulary contract (named joint type plus load path). Tangency plus a color change is not evidence of a connection.
- Master-sample-first: for repeated or hierarchical organic structures, build one master sample (branch module, canopy unit, repeated part) and get it reviewed before instancing or repeating it.
- Fresh-eyes reviewer protocol: each review round is done by a reviewer without prior-round context; builder self-scores are not completion evidence.
- Material-critical surfaces seen at close range (the micro band) use scanned PBR textures; procedural micro-material narratives cap out around 80 points.

## Git policy

- Remote: `git@github.com:giraffe-tree/build-web-3d-models.git`
- Default branch: `main`
- Use non-interactive Git commands.
- Stage explicit paths when the worktree is mixed.
- Never rewrite published history, force-push, or use destructive reset/checkout commands unless the user explicitly requests it.

## Upstream-learning policy

Absorb ideas from other skills only when their usefulness is supported by a concrete failure mode, benchmark, or repeated workflow need.

- Prefer small, general contracts over copying a large framework.
- Record reference uncertainty and hidden-side assumptions.
- Use deterministic image metrics as diagnostics, not as a single universal hard gate.
- Keep correction loops bounded and preserve the ability to deliver a clearly labeled partial result.
- Do not copy domain-specific rules, generated caches, datasets, branding, or licensing-dependent assets without a direct need and license review.
