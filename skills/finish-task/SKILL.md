---
name: finish-task
description: Run declared verifications and check scope before marking a task done. Use when the user asks to finish, complete, or close a task.
---

# Finish Task

Do not mark DONE if a required check failed.

## Steps

1. Read the plan and `.ai/config.json` for declared verification. If none, inspect the repo for documented checks. Never assume `npm test` / `npm run build` / `npm run lint`.
2. Run only the declared or clearly documented checks.
3. If any required check fails: stop, set qualityGate FAILED, and report.
4. Review the diff, unexpected files, out-of-scope paths, and newly introduced TODOs.
5. Confirm required stages are complete.
6. If everything passed: set `progress.qualityGate` to `PASSED` and task status `COMPLETED`.

Read-only summary: `validate-task`.
