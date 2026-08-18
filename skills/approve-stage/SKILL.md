---
name: approve-stage
description: Human-only stage approval. Use only when the user explicitly invokes /approve-stage. Never run the approval CLI.
disable-model-invocation: true
---

# Approve Stage

This action is human-only.

Do not run `scripts/cli/approve-stage.mjs`.

Print this command for the user:

```text
node <plugin-root>/scripts/cli/approve-stage.mjs
```

The current stage must already have `verificationStatus: PASSED`. The CLI records `git config user.email`.
