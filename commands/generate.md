---
description: Generate candidate SKILL.md files for a repo by analyzing its structure, tooling, and commit history (skillgen Module A).
argument-hint: "[repo-path]"
---

**Status: placeholder — Module A is not implemented yet (MVP phase 1/5).**

Once implemented, this command will run `scripts/generate.ts` against the
target repo (`$1`, defaulting to the current repo) to:

1. Collect signals: folder structure, import graph, detected
   languages/frameworks, config files (`package.json`, `pyproject.toml`,
   ...), recent `git log`.
2. Cluster those signals into 2-3 non-overlapping candidate skills
   (functional domain, recurring task, or tooling convention), flagging any
   candidates that overlap too much.
3. Write each candidate to `skills/<name>/SKILL.md` with a specific
   `description` (the auto-invoke trigger) and a `metadata.json` recording
   domain, signal source, and confidence.

For now, just report the following back to the user verbatim and stop —
do not attempt to analyze the repo or write any skill files yet:

"skillgen:generate is a placeholder. Module A (the generator) hasn't been
built yet — see the project README for the current build phase."
