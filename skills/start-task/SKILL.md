---
name: start-task
description: Inspect git state and create or reuse a task branch before modifying versioned files. Use when the current branch is protected or before implementation on a new unit of work.
---

# Start Task

Run this before modifying versioned files unless the task is READ_ONLY.

## Safety

Never run `git reset --hard`, `git clean`, automatic stash, or silent movement of local changes.

## Steps

1. Run `git rev-parse --abbrev-ref HEAD` and `git status --porcelain`.
2. If the current branch already matches the task, reuse it.
3. Search local then remote branches for an existing task branch. Reuse it when it is the same unit of work.
4. If checkout would lose or mix dirty files, stop and explain. Do not switch.
5. Create a branch only when none exists.
6. Store the branch name on `.ai/tasks/<id>/task.json`.

## Naming

`feat/`, `fix/`, `refactor/`, `chore/`, `docs/`, `test/`. Keep a ticket id when one exists.

A branch represents a unit of work, not a prompt.
