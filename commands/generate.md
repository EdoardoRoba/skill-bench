---
description: Generate candidate SKILL.md files for a repo by analyzing its structure, tooling, and commit history (skillgen Module A).
argument-hint: "[repo-path]"
---

Generate candidate skills for a target repo by running skillgen's
deterministic analyzer, then writing the proposed `SKILL.md` files yourself
from its output.

## 1. Resolve the target repo

Use `$1` as the repo path if given, otherwise use the current working
directory. Resolve it to an absolute path.

## 2. Run the analyzer

The analyzer lives in this plugin, not in the target repo, so locate it via
`${CLAUDE_PLUGIN_ROOT}`:

```bash
cd "${CLAUDE_PLUGIN_ROOT}/scripts"
[ -d node_modules ] || npm install --no-audit --no-fund --silent
npx tsx generate.ts "<resolved-repo-path>"
```

This prints one JSON object to stdout:
`{ repoPath, detectedLanguages, packageName, gitLogSampleCount, candidates, suppressedCandidates, warnings }`.
Each candidate has `id`, `name`, `domain`, `source`, `confidence`, `paths`
(glob patterns), and `signals` (concrete observations — sample file names,
folder counts — that justify the candidate). Treat this JSON as the
deterministic ground truth: every `SKILL.md` you write must be grounded in
a candidate's actual `signals`, not invented.

If `candidates` is empty, tell the user the analyzer found no clear
structural signal to build a skill from and stop here.

## 3. Write one skill per candidate

Candidates are proposals, not installed skills — write them to a staging
directory that Claude Code does **not** auto-discover (and that isn't a
dotfile, since dot-directories are treated as sensitive and blocked from
non-interactive writes), so they never silently activate before being
reviewed and evaluated. For each entry in `candidates`, write to
`<resolved-repo-path>/skillgen-candidates/<candidate.name>/`:

**`SKILL.md`** — YAML frontmatter with a `description` field that is
specific and concrete (it's the auto-invoke trigger — a vague description
means the skill never fires, or fires on everything). Ground it in the
candidate's actual `domain` and `paths`, e.g. "Use when adding or modifying
routes under src/routes/ ..." rather than "Helps with the API layer". The
body should describe the conventions actually observed (reference the real
file names from `signals`) and call out likely pitfalls specific to that
pattern (e.g. a repo where routes never touch storage directly should warn
against routes importing the DB layer directly).

**`metadata.json`** — copy the candidate's own fields verbatim:
```json
{
  "id": "...",
  "domain": "...",
  "source": "...",
  "confidence": ...,
  "paths": [...],
  "signals": [...]
}
```

## 4. Report back

Summarize what was generated: for each candidate, its path and one-line
domain description. Then:

- If `warnings` is non-empty, surface each one verbatim — these flag
  candidates whose scope overlaps and may need narrowing.
- If `suppressedCandidates` is non-empty, name them briefly and note they
  were dropped only to keep the proposal to a reviewable size.
- Remind the user these are **proposals**, not installed or activated —
  they can be A/B tested against scenarios with `/skillgen:eval` before
  being kept.
