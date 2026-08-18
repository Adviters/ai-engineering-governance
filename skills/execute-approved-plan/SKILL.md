---
name: execute-approved-plan
description: Implement exactly one approved plan stage, verify it, then stop at the stage gate. Use after a human approved the plan and when continuing staged implementation.
---

# Execute Approved Plan

Implement one stage only.

## Preconditions

- Task is PLAN_REQUIRED or HIGH_RISK, or a SIMPLE task that now has an approved plan.
- `approval.json` status is APPROVED.
- Recalculate SHA-256 of PLAN.md. If it differs from `planHash`, stop. Approval is invalid.

## Loop

1. Start stage N. Set `progress.json` currentStage, stageStatus IN_PROGRESS.
2. Modify only `allowed_paths` for that stage. `.ai/**` may be updated.
3. Run the stage verification declared in the plan. Do not invent a stack-specific test command.
4. Set verificationStatus PASSED or BLOCKED.
5. If `stageApprovalMode` is `manual` (default): stop and ask the human to run `approve-stage`.
6. If `automatic`: advance only when verification passed.
7. Do not start stage N+1 until the gate allows it.

Never implement the entire plan in one pass.
