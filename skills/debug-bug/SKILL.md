---
name: debug-bug
description: Debug a defect using symptom, reproduction, hypotheses, evidence, root cause, minimal fix, and regression verification. Use when investigating a bug. Do not use trial-and-error coding as the strategy. Not a replacement for the built-in /debug command.
---

# Debug Bug

Do not change things until they happen to work.

```text
symptom → reproduction → hypotheses → evidence → root cause → minimal fix → regression verification
```

Start READ_ONLY. Record the symptom and a reproduction path first.

When a fix is required, normal governance applies: `assess-task`, `start-task`, plan and approval when the change is not SIMPLE.

Keep the fix minimal and verify the original reproduction plus nearby regressions using checks that actually exist in the project.
