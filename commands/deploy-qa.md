---
name: deploy-qa
description: Human-only QA deploy. Never infer or auto-run a deploy command.
---

# /deploy-qa

Do not deploy automatically.

Tell the user to run this in their own terminal:

```text
node <plugin-root>/scripts/cli/deploy-qa.mjs
```

Requires an explicit `qaDeployCommand` in `.ai/config.json`.
