---
name: validate-task
description: Show governance status for the active task without modifying code.
---

# /validate-task

Read-only status.

Run if available:

```text
node <plugin-root>/scripts/cli/validate-task.mjs
```

Otherwise read `.ai/` and report task id, classification, branch, plan, approval, stages, files modified, quality gate, and blockers.
