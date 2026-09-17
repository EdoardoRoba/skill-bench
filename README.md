# skillgen

Generate and empirically validate Claude Code skills — A/B test `SKILL.md`
candidates against real task scenarios before you ship them.

`skillgen` is a Claude Code plugin that closes the loop between writing a
skill and knowing whether it actually helps:

1. **`/skillgen:generate`** analyzes a repo's structure, tooling, and
   history, and proposes 2-3 candidate skills — scoped, grounded in real
   code, not installed or active yet.
2. **`/skillgen:eval`** runs a candidate against hand-written scenarios,
   twice each — once with the skill active, once without — and reports
   whether it measurably changed agent behavior.

## Status

This is the level-1 MVP: both commands work end to end against the bundled
fixture repo (`examples/mini-api`). Not yet built: automatic eval-on-skill-
edit hooks, a generator feedback loop that revises a skill after a failed
eval, CI/GitHub Action integration, and semantic (as opposed to folder-
structure) clustering. See "What's next" below.

## Install (local dev)

From this repo:

```bash
claude --plugin-dir .
```

or, to install it like a real marketplace plugin:

```
/plugin marketplace add .
/plugin install skillgen@skill-bench
```

Either way, `/skillgen:generate` and `/skillgen:eval` become available in
the session.

## Usage

### Generate candidate skills for a repo

```
/skillgen:generate examples/mini-api
```

Runs a deterministic analyzer (folder structure, `package.json`, `git
log`) over the target repo, clusters the signals into up to 3 non-
overlapping candidates, and writes each one's `SKILL.md` + `metadata.json`
to `<repo>/skillgen-candidates/<name>/` — a staging directory, not
`.claude/skills/`, so nothing auto-activates before you've reviewed it.
Omit the path to analyze the current repo.

Against the bundled `examples/mini-api` fixture this reliably produces
three candidates matching its actual layers: `api-layer-conventions`,
`data-layer-conventions`, `auth-conventions`.

### A/B test a candidate

```
/skillgen:eval examples/mini-api/skillgen-candidates/data-layer-conventions scenarios/mini-api/add-repository-method.yaml
```

For each scenario, this creates two isolated tmp copies of the target
repo — one with the candidate skill installed, one without — runs the
agent headlessly on both, checks the scenario's assertions (tool calls
made/not made, files changed, tool-call budget, tests still passing), and
writes a comparison report to `reports/<skill-name>.md` (+ a machine-
readable `.json` twin).

Each run actually invokes `claude -p`, so it costs real time and tokens —
point it at one scenario file while iterating, and widen to a glob (or add
`--runs N` to smooth out non-determinism) only once you want the full
picture.

## Repo layout

```
.claude-plugin/          plugin.json + marketplace.json (plugin manifest)
skills/skillgen-meta/     explains this plugin's own workflow to Claude
commands/                 /skillgen:generate and /skillgen:eval
scripts/                  the TypeScript implementation behind both commands
  generate.ts, lib/repoSignals.ts, lib/cluster.ts        — Module A
  eval.ts, lib/{scenario,workspace,runAgent,assertions,report}.ts  — Module B
scenarios/                YAML eval scenarios (see scenarios/README.md for the schema)
examples/mini-api/        small fixture Express API used by the examples above
```

`scripts/` is a self-contained Node/TypeScript project (`npm install` +
`npm test` + `npm run typecheck` inside it); the commands invoke it via
`npx tsx` and locate it with `${CLAUDE_PLUGIN_ROOT}` so it works regardless
of the caller's working directory.

## What's next

Deliberately out of scope for this MVP (see the original design doc):
a GitHub Action / CI wiring, a hook that re-runs eval automatically when a
skill file changes, a generator feedback loop that revises a candidate
after a failed eval, semantic clustering beyond folder/tooling signals,
and a dedicated MCP server for heavier analysis.
