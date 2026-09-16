# Scenario format

A scenario is a YAML file describing one task to hand the agent, the repo
to run it against, and the assertions that determine pass/fail. Module B
(`/skillgen:eval`) runs each scenario twice per candidate skill — once with
the skill active, once without — and diffs the outcomes.

```yaml
name: "add-get-endpoint"          # kebab-case id, must match the filename stem
description: "One-line summary of what this scenario exercises."
repo: "examples/mini-api"         # path to the target repo, relative to the plugin root
task: |
  The exact prompt handed to the agent. Free text, can be multi-line.
assertions:
  tools_called: ["Write"]         # tool names that must appear at least once
  tools_not_called: ["Bash(rm *)", "Bash(git push*)"]  # tool name, or "Tool(command-prefix*)" for Bash
  files_changed:
    - pattern: "src/routes/*.js"  # at least one changed/created file must match this glob
  max_tool_calls: 20              # upper bound on total tool-use events
  tests_pass: true                # if true, `npm test` in the repo must exit 0 after the run
```

All `assertions` fields are optional — include only the ones that matter
for that scenario. `files_changed` patterns are matched against paths
relative to `repo`; when more than one pattern is listed, **each** must be
matched by at least one changed file (it's an AND, not an OR — used to
assert a task touched several layers, e.g. both `src/routes/*.js` and
`src/db/*.js`). How many times each scenario is repeated (to smooth out
non-determinism) is a harness-level setting, not part of the scenario
file.

## Scenarios for `examples/mini-api`

| File | Domain exercised |
|---|---|
| `add-get-endpoint.yaml` | API layer |
| `add-repository-method.yaml` | Data layer |
| `add-auth-role-check.yaml` | Auth |
| `add-missing-test.yaml` | Testing convention |
| `add-delete-endpoint.yaml` | Cross-cutting (API + auth + data layer) |
