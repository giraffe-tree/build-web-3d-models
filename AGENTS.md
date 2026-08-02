# Repository Instructions

## Scope

This repository is the source of truth for the `build-web-3d-models` Codex skill.

- Keep `SKILL.md` concise and procedural.
- Put detailed, task-specific guidance in one-level-deep files under `references/`.
- Put deterministic, reusable checks under `scripts/`.
- Keep `agents/openai.yaml` aligned with `SKILL.md`.
- Do not add README, changelog, installation guide, benchmark output, generated assets, or other repository clutter unless the user explicitly requests it.

## Required workflow for every future change

1. Inspect `git status -sb` and the relevant diff before editing.
2. Preserve unrelated user changes.
3. Make one coherent functional change at a time.
4. Run the relevant validation:
   - `python3 /Users/giraffetree/.codex/skills/.system/skill-creator/scripts/quick_validate.py .`
   - `python3 -m py_compile scripts/*.py` when Python scripts change.
   - A representative script invocation when behavior changes.
5. Review `git diff --check`, `git status -sb`, and the staged diff.
6. Commit the completed logical change with a terse imperative message.
7. Push the current branch to `origin` after every successful commit.
8. Never finish an authorized repository change with uncommitted or unpushed work. If validation or push is blocked, report the exact blocker and leave the worktree state explicit.

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
