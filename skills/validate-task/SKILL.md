---
name: validate-task
description: Show governance status for the active task without modifying code. Use when the user asks for task status, blockers, approval state, or /validate-task.
---

# Validate Task

Read-only.

Prefer:

```text
node <plugin-root>/scripts/cli/validate-task.mjs
```

If the CLI is unavailable, read `.ai/active-task.json` and `.ai/tasks/<id>/` and report:

- Task ID
- Classification
- Branch
- Plan required
- Plan status
- Plan approval
- Current stage
- Completed stages
- Pending stages
- Files modified
- Quality gate status
- Blocking issues

Do not modify files.
