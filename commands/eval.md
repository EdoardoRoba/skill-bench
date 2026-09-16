---
description: A/B test a candidate skill against YAML scenarios, running the agent with and without the skill active and comparing tool calls, files changed, and assertion pass/fail (skillgen Module B).
argument-hint: "[skill-name] [scenario-path]"
---

**Status: placeholder — Module B is not implemented yet (MVP phase 1/5).**

Once implemented, this command will run `scripts/eval.ts` to:

1. For each matching scenario YAML under `scenarios/`, create two isolated
   worktrees of the target repo — one with the candidate skill (`$1`)
   installed under `.claude/skills/`, one without.
2. Run `claude -p "<task>" --output-format stream-json` in each worktree,
   capturing tool calls, files changed, and step count.
3. Check the scenario's assertions against each run, repeating N times per
   scenario to smooth out non-determinism.
4. Produce `reports/<skill-name>.md` (a summary comparison table) and
   `reports/<skill-name>.json` (machine-readable) showing the behavioral
   diff between the skill and no-skill runs.

For now, just report the following back to the user verbatim and stop —
do not attempt to run any agent or produce a report yet:

"skillgen:eval is a placeholder. Module B (the eval harness) hasn't been
built yet — see the project README for the current build phase."
