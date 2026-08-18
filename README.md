# AI Engineering Governance

> ⚠️ **Public Beta**
>
> This project is currently being validated with real development workflows.
> Expect changes to rules, guards, commands and configuration between releases.
> Feedback and bug reports are welcome.

Local engineering guardrails for Cursor Agents.

AI Engineering Governance standardizes how Cursor Agents work on a repository by combining task classification, Git workflow protection, human-approved plans, progressive implementation and configurable safety guards.

It is framework-agnostic and does not require MCP, an external backend or framework-specific packs.

---

## Features

* Task classification:

  * `READ_ONLY`
  * `SIMPLE`
  * `PLAN_REQUIRED`
  * `HIGH_RISK`
* Task-specific Git branches
* Protected branch guard
* Human-approved implementation plans
* SHA-256 plan approval validation
* Progressive staged implementation
* Per-stage allowed paths
* Manual or automatic stage gates
* Dangerous shell command guard
* Dependency modification guard
* High-risk path protection
* Quality gates
* Local task state
* Local audit trail
* Task handoff between Agent sessions

---

## What problem does it solve?

Text instructions alone do not guarantee that an Agent will consistently respect engineering workflows such as:

* task branches;
* planning before complex changes;
* human approvals;
* implementation scope;
* stage boundaries;
* dangerous command restrictions;
* dependency policies;
* verification before completion.

AI Engineering Governance adds a local governance layer around supported Cursor Agent events.

```text
Rules     → steering
Skills    → procedures
Hooks     → deterministic guardrails
Commands  → explicit human actions
```

The goal is not to prevent the Agent from working.

The goal is to give it clear engineering rails.

---

## Quick Start

### 1. Install the plugin

Install AI Engineering Governance with **Project scope** for the repository where you want governance enabled.

### 2. Open the repository

Requirements:

* Git repository
* Trusted Cursor workspace
* Node.js 18+
* Git available in `PATH`

### 3. Work normally

Describe the task to Cursor as usual.

Example:

```text
Implement validation to prevent duplicate users.
```

The governance workflow can classify the task and apply the appropriate process.

A small change may proceed as:

```text
REQUEST
  → SIMPLE
  → TASK BRANCH
  → IMPLEMENTATION
  → VERIFICATION
```

A larger or high-risk change may require:

```text
REQUEST
  → PLAN_REQUIRED
  → TASK BRANCH
  → PLAN
  → HUMAN APPROVAL
  → STAGE 1
  → VERIFICATION
  → STAGE APPROVAL
  → STAGE 2
  → FINAL VERIFICATION
  → REVIEW
```

To inspect the current governance state, use:

```text
/validate-task
```

---

## Architecture

The plugin separates advisory behavior from deterministic enforcement.

| Component                | Responsibility                                  | Behavior                   |
| ------------------------ | ----------------------------------------------- | -------------------------- |
| Rules                    | Describe expected Agent behavior                | Advisory                   |
| Skills                   | Define reusable engineering procedures          | Advisory                   |
| Hooks                    | Apply guardrails on supported Agent events      | Enforced where supported   |
| Commands / manual skills | Explicit sensitive actions initiated by a human | Agent must not self-invoke |

Conceptually:

```text
REQUEST
  ↓
TASK ASSESSMENT
  ↓
READ_ONLY / SIMPLE / PLAN_REQUIRED / HIGH_RISK
  ↓
TASK BRANCH
  ↓
PLAN if required
  ↓
HUMAN PLAN APPROVAL
  ↓
STAGE N
  ↓
VERIFICATION
  ↓
STAGE GATE
  ↓
NEXT STAGE
  ↓
FINAL VERIFICATION
  ↓
REVIEW
  ↓
DONE
```

---

## Rules, Skills, Hooks and Commands

### Rules

Rules describe how the Agent is expected to behave.

Examples:

```text
Do not implement directly on protected branches.
```

```text
Complex changes should be planned before implementation.
```

Rules guide the model but are not treated as a security boundary.

---

### Skills

Skills define reusable procedures.

Current skills include:

```text
assess-task
start-task
create-plan
execute-approved-plan
finish-task
debug-bug
review-task
handoff-task
```

A Skill answers:

> How should this engineering procedure be performed?

---

### Hooks

Hooks provide deterministic guardrails where Cursor exposes interceptable Agent events.

They are used for controls such as:

* protected branches;
* plan approval;
* plan hash validation;
* stage scope;
* dangerous commands;
* dependency changes;
* high-risk paths;
* simple-task file thresholds.

A Hook answers:

> Is this Agent action allowed right now?

---

### Commands and manual actions

Sensitive actions should require explicit human invocation.

Examples:

```text
/approve-plan
/approve-stage
/validate-task
/deploy-qa
```

The Agent must not approve its own plan or stage.

---

## Installation

### Requirements

* Cursor with Plugin and Hook support
* Node.js 18+
* Git
* Trusted workspace

Hooks may not run in an untrusted workspace.

---

### Local development

From this repository on Windows PowerShell:

```powershell
New-Item -ItemType Directory -Force `
  -Path "$env:USERPROFILE\.cursor\plugins\local" | Out-Null

New-Item -ItemType Junction -Force `
  -Path "$env:USERPROFILE\.cursor\plugins\local\ai-engineering-governance" `
  -Target (Get-Location).Path
```

Then run:

```text
Developer: Reload Window
```

In Cursor `Customize`, verify that the plugin exposes:

* Rules
* Skills
* Commands
* Hooks

---

### Project-scoped installation

When installing the plugin from Cursor:

1. Open `Customize`.
2. Find **AI Engineering Governance**.
3. Choose **Install**.
4. Select **Project** scope.
5. Verify the plugin components are enabled.

If slash commands are not visible, verify that third-party plugins/skills are enabled.

---

## Repository state

Governance state is stored in the consumer repository under:

```text
.ai/
```

Typical structure:

```text
.ai/
├── config.json
├── active-task.json
├── audit.jsonl
│
└── tasks/
    └── <task-id>/
        ├── task.json
        ├── PLAN.md
        ├── approval.json
        └── progress.json
```

### `task.json`

Stores task identity, classification and metadata.

### `PLAN.md`

Contains the approved implementation contract.

### `approval.json`

Stores plan approval metadata and hash.

### `progress.json`

Tracks implementation stages and verification status.

### `audit.jsonl`

Stores lightweight governance events.

---

## Configuration

A consuming repository may define:

```text
.ai/config.json
```

If it does not exist, the plugin uses safe defaults.

Supported configuration includes:

```text
protectedBranches
planRequiredFileThreshold
highRiskPaths
dangerousCommands
stageApprovalMode
requirePlanApproval
qaDeployCommand
```

Example:

```json
{
  "protectedBranches": [
    "main",
    "master",
    "develop",
    "qa"
  ],
  "planRequiredFileThreshold": 2,
  "stageApprovalMode": "manual",
  "requirePlanApproval": true
}
```

If configuration required by a sensitive guard is invalid, that guard should fail closed.

See:

```text
docs/configuration.md
```

---

## Task assessment

Tasks are classified into four categories.

### `READ_ONLY`

Examples:

* explanation;
* research;
* code review;
* architecture analysis;
* planning;
* searching the codebase.

Expected behavior:

```text
No branch required
No implementation plan required
No code modification
```

---

### `SIMPLE`

Small, localized and low-risk changes.

Example:

```text
Change a validation message.
```

A SIMPLE task may proceed without an implementation plan but remains subject to branch and safety guards.

SIMPLE tasks are not allowed to grow indefinitely.

The default distinct-file threshold can be configured with:

```text
planRequiredFileThreshold
```

---

### `PLAN_REQUIRED`

Used when a change reasonably involves:

* several files;
* several layers;
* architectural changes;
* non-trivial features;
* larger refactors;
* public contracts;
* new dependencies;
* cross-cutting behavior;
* multiple implementation stages;
* ambiguous requirements.

Implementation is blocked until an approved plan exists.

---

### `HIGH_RISK`

Used for sensitive areas such as:

* authentication;
* authorization;
* security configuration;
* secrets;
* database schema;
* migrations;
* CI/CD;
* infrastructure;
* deployments;
* production;
* destructive commands;
* critical dependencies.

HIGH_RISK tasks require planning and human approval.

---

## Git workflow

Implementation work should occur on a task-specific branch.

Default protected branches:

```text
main
master
develop
qa
```

The `start-task` workflow:

1. inspects the current branch;
2. inspects the working tree;
3. determines whether the current branch already belongs to the task;
4. reuses it when appropriate;
5. searches existing local branches;
6. searches the remote;
7. reuses an existing branch when possible;
8. creates a new branch only when needed.

Typical naming:

```text
feat/<description>
fix/<description>
refactor/<description>
chore/<description>
docs/<description>
test/<description>
```

If a ticket identifier is available, it should be preserved.

Example:

```text
feat/PROJ-123-password-recovery
```

The workflow must never automatically:

```text
git reset --hard
git clean
git stash
discard uncommitted user work
```

A branch represents a unit of work, not a single prompt.

---

## Plan governance

A required implementation plan acts as a contract between planning and implementation.

Typical plan contents:

```text
Task
Goal
Context
Constraints
Risks

Stage 1
  Objective
  Allowed paths
  Implementation
  Verification
  Completion criteria

Stage 2
  ...
```

Plans should be divided into stages when the work naturally supports progressive implementation.

---

## Plan approval

A required plan cannot be executed until it is approved by a human.

Approval stores:

```text
plan identifier
plan SHA-256
approved by
approved at
```

Conceptually:

```text
PLAN.md
   ↓
SHA-256
   ↓
approval.json
```

If `PLAN.md` changes after approval:

```text
current plan hash
      ≠
approved plan hash
```

the approval becomes invalid.

Re-approval is required before implementation can continue.

---

## Human approval

The Agent must not approve its own plan.

Approval must be performed explicitly by a human.

Current CLI helpers may be executed from the consumer repository:

```powershell
node <plugin-root>\scripts\cli\approve-plan.mjs
```

and:

```powershell
node <plugin-root>\scripts\cli\approve-stage.mjs
```

The approver identity currently comes from:

```bash
git config user.email
```

If no identity is available, approval fails.

This provides **process governance and auditability**.

It is **not strong cryptographic authentication**.

---

## Progressive implementation

`execute-approved-plan` implements one stage at a time.

```text
STAGE N
   ↓
IMPLEMENT
   ↓
VERIFY
   ↓
COMPLETE
   ↓
STAGE GATE
   ↓
STAGE N+1
```

Progress is stored in:

```text
progress.json
```

Typical states:

```text
PENDING
IN_PROGRESS
VERIFYING
PASSED
BLOCKED
```

---

## Allowed paths

Each implementation stage may define:

```text
allowed_paths
```

Example:

```text
src/auth/**
src/security/**
tests/auth/**
```

If the Agent attempts to modify a file outside the stage scope, the action should be denied.

Typical response:

```text
This file is outside the scope of the current implementation stage.

Update the plan and request approval again if this change is required.
```

Changing the plan changes its hash and therefore invalidates the existing approval.

---

## Stage gates

Supported modes:

```text
manual
automatic
```

Default:

```text
manual
```

### Manual

After successful verification:

```text
Stage complete
  ↓
STOP
  ↓
Human approval
  ↓
Next stage
```

### Automatic

The next stage may start only after all required verification succeeds.

Automatic progression should be enabled deliberately.

---

## Quality gates

Before a task is considered complete, `finish-task` verifies the requirements defined by the project or implementation plan.

Potential checks include:

* tests;
* lint;
* build;
* changed-file scope;
* unexpected files;
* incomplete stages;
* TODOs introduced by the change;
* failed verification commands.

The plugin does not assume that every repository uses:

```text
npm test
npm run lint
npm run build
```

Verification should come from project configuration, task configuration or the approved plan.

A task must not be marked `DONE` while required verification is failing.

---

## Guards

### Protected branch guard

Prevents supported Agent write operations directly on configured protected branches.

Example:

```text
develop
   +
Agent write
   ↓
DENY
```

The Agent should run the `start-task` workflow first.

---

### Plan required guard

Prevents a complex task from silently turning into unplanned implementation.

A SIMPLE task may be promoted to PLAN_REQUIRED when it exceeds configured scope.

Default distinct-file threshold:

```text
2
```

Example:

```text
SIMPLE
  ↓
file 1
file 2
file 3
  ↓
DENY
  ↓
Create implementation plan
```

This threshold is configurable.

---

### High-risk path guard

Sensitive paths may require an approved plan.

Default examples may include:

```text
.github/workflows/**
migrations/**
terraform/**
infra/**
Dockerfile*
docker-compose*
package.json
package-lock.json
pnpm-lock.yaml
yarn.lock
```

Projects can override these patterns.

---

### Plan approval guard

Blocks implementation when:

```text
Plan missing
Plan DRAFT
Plan not approved
Approval invalid
```

---

### Plan hash guard

If the approved plan changes:

```text
PLAN MODIFIED
  ↓
APPROVAL INVALIDATED
  ↓
RE-APPROVAL REQUIRED
```

---

### Stage scope guard

Blocks supported Agent writes outside the current stage's allowed paths.

---

### Dependency guard

Detects dependency modification commands such as:

```text
npm install
npm add
yarn add
pnpm add
pip install
poetry add
```

If dependency modification is not explicitly part of the approved task scope, the action is denied.

---

## Dangerous command guard

Dangerous commands are parsed structurally rather than using only naive substring matching.

Examples that may be blocked include:

### Destructive Git

```bash
git reset --hard
git clean
git checkout -- .
git restore .
```

### Destructive filesystem operations

```bash
rm -rf
```

```powershell
Remove-Item -Recurse -Force
```

### Destructive database operations

```sql
DROP DATABASE
DROP TABLE
TRUNCATE
```

### Infrastructure destruction

```bash
terraform destroy
```

### Broad Kubernetes deletion

Potentially destructive delete operations may be blocked when they are insufficiently scoped.

### Publishing

Sensitive publish/release operations may also require explicit human execution.

The intention is:

> The Agent should not independently decide to perform destructive operations.

A human may still execute these commands manually outside the Agent when appropriate.

---

## Debug workflow

The `debug-bug` Skill follows an evidence-driven debugging process.

```text
SYMPTOM
  ↓
REPRODUCTION
  ↓
HYPOTHESES
  ↓
EVIDENCE
  ↓
ROOT CAUSE
  ↓
MINIMAL FIX
  ↓
REGRESSION VERIFICATION
```

The workflow should begin read-only whenever possible.

Once implementation begins, the normal governance workflow applies.

---

## Review workflow

`review-task` performs an independent review against:

* original requirement;
* approved plan;
* completed stages;
* diff;
* scope;
* verification;
* risks;
* possible regressions;
* unexpected changes.

The first review phase should not modify code.

---

## Handoff

`handoff-task` prepares a compact task state for continuation in another Agent session.

It should include:

```text
task
goal
classification
branch
plan status
approval
current stage
completed work
important decisions
pending work
verification
blockers
```

The handoff should use `.ai/tasks/...` as its primary source instead of reconstructing the full conversation.

---

## Context awareness

The plugin may provide a non-blocking warning when Cursor approaches context compaction or when context usage becomes high.

This is intentionally heuristic.

It is not based on a claim that a specific context percentage makes a model unreliable.

The warning may suggest:

* completing the current stage;
* updating task progress;
* generating a handoff;
* summarizing the conversation;
* starting a fresh Agent session when appropriate.

---

## Audit log

Relevant governance events may be stored in:

```text
.ai/audit.jsonl
```

Example event types:

```text
TASK_CREATED
TASK_CLASSIFIED
BRANCH_CREATED
BRANCH_REUSED
PLAN_CREATED
PLAN_APPROVED
PLAN_INVALIDATED
STAGE_STARTED
STAGE_COMPLETED
STAGE_APPROVED
WRITE_BLOCKED
COMMAND_BLOCKED
QUALITY_GATE_PASSED
QUALITY_GATE_FAILED
TASK_COMPLETED
```

Audit entries should contain only minimal metadata such as:

```text
timestamp
task id
event
actor when applicable
minimal event metadata
```

The audit log should not intentionally store:

* prompts;
* source code;
* secrets;
* unnecessary personal information.

Audit logging is advisory and should not break the Agent workflow if logging itself fails.

---

## Privacy

AI Engineering Governance does not provide its own telemetry backend.

Governance state is stored locally inside the consuming repository under:

```text
.ai/
```

The plugin does not include MCP servers or external service integrations.

The plugin itself does not intentionally send task state, approvals or audit logs to an additional external service.

This does **not** describe or modify how Cursor itself processes code or prompts according to the user's Cursor configuration.

---

## Security Notice

AI Engineering Governance provides workflow guardrails for Cursor Agents.

**It is not a security boundary.**

It does not replace:

* Git branch protection;
* Pull Request approvals;
* CI/CD policies;
* IAM / RBAC;
* production access controls;
* secret management;
* infrastructure permissions;
* human review.

Guardrails apply only where Cursor exposes interceptable Agent events.

For the full threat model and known bypasses, see:

```text
docs/security-model.md
```

---

## Known limitations

Current limitations include:

* task complexity classification includes a semantic LLM-driven component;
* guardrails cannot guarantee that every possible Agent action is intercepted;
* Tab completions are not blocked by these hooks;
* writes performed indirectly through Shell redirection may not pass through the same write hook;
* `stop` hooks may request follow-up work but cannot provide an absolute guarantee that an Agent session remains active;
* human approval identity currently relies on local Git configuration;
* project configuration may need tuning for repository size and workflow;
* Cursor Plugin and Hook APIs may evolve over time.

The plugin should therefore be treated as an engineering governance layer, not an isolation or sandbox mechanism.

---

## Fail closed vs fail open

Sensitive guards should fail closed where supported.

Examples:

```text
protected branches
plan approval
plan hash
stage scope
dangerous shell operations
```

Non-critical functionality may fail open to avoid breaking normal Cursor usage.

Examples:

```text
audit logging
context warning
optional follow-up behavior
```

A failure to write an optional log should not disable the entire Agent.

---

## Troubleshooting

### Hooks do not run

Verify:

* the workspace is Trusted;
* the plugin is enabled;
* Hooks appear in `Customize`;
* Node.js 18+ is installed;
* Git is available;
* Cursor has been reloaded after local plugin changes.

---

### Inspect Hook output

Open:

```text
Customize → Hooks
```

and the corresponding Cursor Hook output channel.

---

### Plugin root

Plugin scripts use:

```text
${CURSOR_PLUGIN_ROOT}
```

where required to avoid relying on inconsistent working directories.

---

### `permission: ask`

If the current Cursor Hook API does not support an effective interactive `ask` path for a specific event, this plugin uses deterministic `deny` instead.

The human can then perform the sensitive operation explicitly outside the Agent.

---

### Write hook failure

When a sensitive write guard is configured as fail-closed, a hook failure may block the operation.

Inspect Hook logs for the specific reason.

---

## Compatibility

### Requirements

```text
Cursor with Plugin support
Cursor with Hook support
Node.js 18+
Git
Trusted workspace
```

### Current release

```text
0.1.0-beta
```

### Tested platforms

Document only environments that have actually been tested.

Example:

```text
Windows 11  ✅
Linux       ⏳
macOS       ⏳
```

Do not mark a platform as supported until it has been validated.

---

## Feedback wanted

This is a public beta.

Real-world workflow feedback is especially valuable.

We are particularly interested in:

* guard false positives;
* guard false negatives;
* incorrect `SIMPLE` / `PLAN_REQUIRED` classification;
* plan workflows that feel too restrictive;
* stage granularity;
* branch workflow friction;
* dangerous command detection;
* cross-platform issues;
* Cursor compatibility changes;
* quality-gate usability.

Please open a GitHub Issue with a minimal reproduction when possible.

Useful issue categories:

```text
🐛 Bug
🚧 Guard false positive
🛡️ Guard false negative
🧭 Workflow feedback
💡 Feature request
🔌 Cursor compatibility
```

---

## Uninstall

Disable or uninstall the plugin from Cursor `Customize`.

The consuming repository may also remove:

```text
.ai/
```

if local governance state is no longer required.

Uninstalling the plugin does not:

* revert commits;
* restore modified files;
* remove remote branch protections;
* undo external CI/CD policies.

---

## Team Marketplace

The repository is structured as a Cursor Plugin.

A future organization-level deployment may distribute it through a Team Marketplace as:

```text
Default Off
Default On
Required
```

That distribution policy is outside the scope of the plugin itself.

---

## Documentation

Additional documentation:

```text
docs/architecture.md
docs/task-lifecycle.md
docs/plan-governance.md
docs/hooks.md
docs/configuration.md
docs/security-model.md
docs/creating-skills.md
docs/creating-rules.md
docs/creating-commands.md
```

---

## Contributing

Contributions and feedback are welcome during the beta.

Before submitting a change:

1. explain the problem being solved;
2. keep guards small and auditable;
3. add tests for deterministic behavior;
4. document whether the behavior is advisory or enforced;
5. avoid adding dependencies unless necessary;
6. preserve cross-platform behavior where practical.

Safety-related changes should include tests for:

```text
expected block
expected allow
basic false-positive cases
failure behavior
```

---

## Design principles

This project prioritizes:

1. Correctness
2. Safety
3. Simplicity
4. Portability
5. Extensibility

When choosing between a sophisticated abstraction and behavior that is easy to inspect and audit, prefer the auditable implementation.

---

## Philosophy

The plugin is based on a simple separation:

```text
Rule
  → what should happen

Skill
  → how to do it

Hook
  → what the Agent is not allowed to skip

Human action
  → what requires explicit approval
```

The goal is not to make Agents less capable.

The goal is to let them move faster **without silently skipping engineering discipline**.

---

## License

MIT
