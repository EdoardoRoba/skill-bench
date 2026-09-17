import type { Scenario } from "./scenario";
import type { AgentRunTrace } from "./runAgent";
import type { AssertionResult } from "./assertions";

export type Variant = "with-skill" | "no-skill";

export interface SingleRunResult {
  runIndex: number;
  variant: Variant;
  trace: AgentRunTrace;
  assertionResult: AssertionResult;
}

export interface ScenarioReport {
  scenario: Scenario;
  withSkill: SingleRunResult[];
  noSkill: SingleRunResult[];
}

function passRate(results: SingleRunResult[]): string {
  if (results.length === 0) return "n/a";
  const passed = results.filter((r) => r.assertionResult.passed).length;
  return `${passed}/${results.length}`;
}

function avgToolCalls(results: SingleRunResult[]): string {
  if (results.length === 0) return "n/a";
  const avg = results.reduce((sum, r) => sum + r.trace.toolCalls.length, 0) / results.length;
  return avg.toFixed(1);
}

function renderRunList(runs: SingleRunResult[]): string[] {
  const lines: string[] = [];
  for (const run of runs) {
    const status = run.assertionResult.passed ? "PASS" : "FAIL";
    lines.push(`- Run ${run.runIndex + 1}: **${status}** (${run.trace.toolCalls.length} tool calls)`);
    for (const check of run.assertionResult.checks) {
      if (!check.passed) lines.push(`  - ❌ ${check.name} — ${check.detail}`);
    }
  }
  return lines;
}

export function renderReport(skillName: string, reports: ScenarioReport[]): string {
  const lines: string[] = [];

  lines.push(`# skillgen eval report: ${skillName}`, "");
  lines.push(`Generated ${new Date().toISOString()}`, "");

  lines.push(
    "| Scenario | Pass (skill) | Pass (no skill) | Avg tool calls (skill) | Avg tool calls (no skill) |"
  );
  lines.push("|---|---|---|---|---|");
  for (const { scenario, withSkill, noSkill } of reports) {
    lines.push(
      `| ${scenario.name} | ${passRate(withSkill)} | ${passRate(noSkill)} | ${avgToolCalls(withSkill)} | ${avgToolCalls(noSkill)} |`
    );
  }
  lines.push("");

  lines.push("## Details", "");
  for (const { scenario, withSkill, noSkill } of reports) {
    lines.push(`### ${scenario.name}`, "");
    if (scenario.description) lines.push(scenario.description, "");

    lines.push("**With skill:**", "", ...renderRunList(withSkill), "");
    lines.push("**Without skill:**", "", ...renderRunList(noSkill), "");
  }

  return lines.join("\n");
}
