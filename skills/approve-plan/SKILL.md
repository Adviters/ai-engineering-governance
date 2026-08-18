---
name: approve-plan
description: Human-only plan approval. Use only when the user explicitly invokes /approve-plan. Never run the approval CLI. Tell the user to run it in their own terminal.
disable-model-invocation: true
---

# Approve Plan

This action is human-only.

Do not run `scripts/cli/approve-plan.mjs`. Hooks will deny Agent shell execution of that CLI.

Print this command for the user. They must run it in their own terminal, with the consumer repository as the working directory:

```text
node <plugin-root>/scripts/cli/approve-plan.mjs
```

`<plugin-root>` is the install path of `ai-engineering-governance`.

The CLI records `git config user.email`. If that identity is missing, approval fails. This is process auditability, not cryptographic authentication.
