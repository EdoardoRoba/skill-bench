---
description: Explains the skillgen plugin itself — how /skillgen:generate produces candidate SKILL.md files from a repo and how /skillgen:eval A/B tests a candidate skill against YAML scenarios. Use when the user asks what skillgen does, how to generate skills for a repo, how to evaluate/A-B test a skill, or how the generate/eval workflow fits together.
---

# skillgen: Skill Generator + Eval Harness

skillgen closes the loop between writing a `SKILL.md` by hand and knowing
whether it actually changes agent behavior for the better.

## The two modules

**Module A — Generator (`/skillgen:generate [repo-path]`)**
Analyzes a repo (folder structure, config files, naming conventions, recent
`git log`) and proposes 2-3 candidate skills, each scoped to one functional
area, recurring task, or tooling convention. Candidates are written to
`skills/<name>/SKILL.md` plus a `metadata.json` (domain, signal source,
confidence) but are **not** installed/activated automatically — they are
proposals for review.

**Module B — Eval Harness (`/skillgen:eval <scenario-or-skill>`)**
Runs a YAML scenario (a task + assertions about expected tool calls / files
changed) against an isolated copy of the target repo, twice: once with the
candidate skill active, once without. It compares the two runs and produces
a markdown report showing whether the skill measurably changed agent
behavior (and whether that change was an improvement).

## Current status

This is the MVP skeleton (phase 1 of the build). `/skillgen:generate` and
`/skillgen:eval` exist as commands but their underlying logic (Module A and
Module B) has not been implemented yet — invoking them currently reports
their planned behavior rather than performing it. See the repo README for
the build plan and current phase.

## When to reach for skillgen

- The user wants to bootstrap `SKILL.md` files for a codebase instead of
  writing them from scratch.
- The user has a candidate skill and wants evidence it helps (or doesn't
  hurt) before committing it.
- The user is iterating on an existing skill after a failed/regressed eval
  and wants to re-run scenarios after edits.
