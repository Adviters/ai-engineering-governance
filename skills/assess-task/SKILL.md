---
name: assess-task
description: Classify a request as READ_ONLY, SIMPLE, PLAN_REQUIRED, or HIGH_RISK before any implementation. Use when starting work, estimating scope, or deciding whether a branch or plan is required.
---

# Assess Task

Classify before writing project files. This classification is semantic. Hooks are the deterministic backstop.

## Steps

1. Read the request and inspect only what is needed.
2. Choose one classification using [references/classification.md](references/classification.md).
3. Create or update `.ai/tasks/<task-id>/task.json`.
4. Set `.ai/active-task.json` to `{ "taskId": "<task-id>" }`.
5. If READ_ONLY: do not write project files. You may write `.ai/**`.
6. If SIMPLE: continue with `start-task`.
7. If PLAN_REQUIRED or HIGH_RISK: continue with `start-task` then `create-plan`.

Task ids must match `[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}`. Prefer `feat-ticket-123` style. Do not put path separators in the id.

Do not classify a multi-file or architectural change as SIMPLE to avoid governance.
