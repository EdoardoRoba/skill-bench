---
description: A/B test a candidate skill against YAML scenarios, running the agent with and without the skill active and comparing tool calls, files changed, and assertion pass/fail (skillgen Module B).
argument-hint: "[skill-dir] [scenario-glob]"
---

Run skillgen's eval harness and show the resulting report. This step is
fully deterministic (assertion-checking, not generation), so just run the
script and present its output — no need to write or interpret anything
yourself beyond that.

## 1. Resolve arguments

- `$1` — path to a candidate skill's directory (must contain `SKILL.md`),
  e.g. `examples/mini-api/skillgen-candidates/api-layer-conventions`. If
  missing, ask the user which candidate to evaluate rather than guessing.
- `$2` — one or more scenario YAML paths or a glob. If omitted, default to
  every scenario whose `repo:` field matches the skill's target repo (for
  the bundled fixture that's `scenarios/mini-api/*.yaml`).

## 2. Run the harness

```bash
cd "${CLAUDE_PLUGIN_ROOT}/scripts"
[ -d node_modules ] || npm install --no-audit --no-fund --silent
npx tsx eval.ts "<skill-dir>" <scenario-file...> --runs 1
```

Each scenario runs twice per `--runs` count: once in an isolated tmp copy
of the target repo with the candidate skill installed, once without. This
actually invokes the agent (`claude -p`) for every run, so it costs real
time/tokens — for a quick check, point it at one scenario file rather than
the whole glob. Increase `--runs` only when the user asks to smooth out
non-determinism; each added run doubles the cost again.

The command prints the path to the generated markdown report (also writes
a `.json` twin alongside it in `reports/`).

## 3. Show the report

Read the markdown report the harness just wrote and show it to the user
verbatim — it already has the summary table and per-scenario failure
detail. Don't re-summarize or re-interpret the numbers; the report is the
deliverable.
