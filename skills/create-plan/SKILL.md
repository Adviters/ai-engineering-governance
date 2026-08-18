---
name: create-plan
description: Create a staged implementation plan contract in PLAN.md. Use for PLAN_REQUIRED or HIGH_RISK work, or when a SIMPLE task exceeded its file threshold.
---

# Create Plan

Write `.ai/tasks/<id>/PLAN.md` using [templates/PLAN.md](templates/PLAN.md).

The plan is a contract, not a sketch.

## Requirements

- Include Task, Goal, Context, Constraints, Risks, and Stages.
- Split work into stages whenever it naturally divides.
- Every stage must declare `allowed_paths`.
- Put a machine-readable JSON block in the plan. Hooks parse that block.
- Leave approval as DRAFT. Do not implement yet.
- Tell the human to run `approve-plan` in their own terminal.

Do not implement from this skill.
