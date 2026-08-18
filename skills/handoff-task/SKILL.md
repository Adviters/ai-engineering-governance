---
name: handoff-task
description: Write a compact handoff from .ai task state so another conversation can continue the work. Use when context is large, compaction is near, or the user asks to hand off the task.
---

# Handoff Task

Read `.ai/active-task.json` and `.ai/tasks/<id>/`. Do not reconstruct the whole chat.

Include:

- task and goal
- classification
- branch
- plan status and approval
- current stage
- completed work
- important decisions
- pending work
- verification
- blockers

Keep it short enough to paste into a new conversation.
