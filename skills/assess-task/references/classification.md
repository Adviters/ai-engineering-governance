# Classification

## READ_ONLY

Explain, investigate, search, review, analyze, or produce a plan. No project file modifications.

## SIMPLE

Small, localized, low-risk change. Default file threshold is 2 distinct project files. Crossing that threshold requires a plan.

## PLAN_REQUIRED

Use when there are multiple files, components, layers, architectural changes, non-trivial features, meaningful refactors, public contracts, dependency changes, cross-cutting work, multiple steps, or ambiguous requirements.

## HIGH_RISK

Auth, authorization, secrets, security config, database schema, migrations, CI/CD, infrastructure, deploy, production, destructive commands, or critical dependencies.

HIGH_RISK always requires a plan and human approval.
