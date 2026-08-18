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
5. Create a branch only when none exists. Create it from the **current HEAD** with `git checkout -b <name>`. Do not check out `develop`, `main`, `master`, or `qa` first to use as a base. The new branch starts where the user is now.
6. Store the branch name on `.ai/tasks/<id>/task.json`.

## Naming

Format:

```text
<type>/<ticket>-<short-summary>
```

- `type` is one of `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, chosen from the work (bug → `fix`, new work → `feat`).
- If the user gives a Jira/Trello/Linear id (`TASK-1234`, `PROJ-99`, a Trello card id), use it in **lowercase**. If that exact branch already exists, reuse it.
- `<short-summary>` is a 2–5 word kebab-case slug of the main ask. Prefer English. Drop filler words (`the`, `a`, `to`, `de`, `el`).
- If there is no ticket id, use `<type>/<short-summary>` only.
- Lowercase everything. No spaces. No path separators.

Example: user says `TASK-1234 cambiar color` → `fix/task-1234-changed-color`.

```powershell
git checkout -b fix/task-1234-changed-color
```

A branch represents a unit of work, not a prompt.
