---
name: deploy-qa
description: Human-only QA deploy gate. Use only when the user explicitly invokes /deploy-qa. Never infer or run a deploy command automatically.
disable-model-invocation: true
---

# Deploy QA

This action is human-only. Do not run the deploy CLI or any inferred deploy command.

Print this command for the user:

```text
node <plugin-root>/scripts/cli/deploy-qa.mjs
```

The CLI checks task completion, quality gates, branch, working tree, and blockers. It runs `qaDeployCommand` from `.ai/config.json` only when that value is set explicitly. It never infers Docker, Kubernetes, GitHub Actions, or cloud deploy commands.
