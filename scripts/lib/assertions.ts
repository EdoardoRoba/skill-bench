import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { minimatch } from "minimatch";
import type { ScenarioAssertions } from "./scenario";
import type { AgentRunTrace, ToolCall } from "./runAgent";

export interface AssertionCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface AssertionResult {
  passed: boolean;
  checks: AssertionCheck[];
}

const FILE_WRITING_TOOLS = new Set(["Write", "Edit", "NotebookEdit"]);

function filePathFromToolCall(call: ToolCall): string | null {
  if (!FILE_WRITING_TOOLS.has(call.name)) return null;
  const fp = call.input.file_path ?? call.input.notebook_path;
  return typeof fp === "string" ? fp : null;
}

// "Bash(rm *)" -> tool must be Bash AND its command must match the glob
// "rm *". A bare tool name like "Write" matches on tool name alone.
function matchesToolPattern(pattern: string, call: ToolCall): boolean {
  const parsed = pattern.match(/^(\w+)\((.+)\)$/);
  if (!parsed) return call.name === pattern;

  const [, toolName, commandPattern] = parsed;
  if (call.name !== toolName) return false;

  const command = typeof call.input.command === "string" ? call.input.command : "";
  return minimatch(command, commandPattern);
}

export function evaluateAssertions(
  assertions: ScenarioAssertions,
  trace: AgentRunTrace,
  worktreePath: string
): AssertionResult {
  const checks: AssertionCheck[] = [];

  for (const toolName of assertions.tools_called ?? []) {
    const called = trace.toolCalls.some((c) => c.name === toolName);
    checks.push({
      name: `tools_called: ${toolName}`,
      passed: called,
      detail: called ? "called at least once" : "never called",
    });
  }

  for (const pattern of assertions.tools_not_called ?? []) {
    const matched = trace.toolCalls.filter((c) => matchesToolPattern(pattern, c));
    checks.push({
      name: `tools_not_called: ${pattern}`,
      passed: matched.length === 0,
      detail: matched.length === 0 ? "never matched" : `matched ${matched.length} call(s)`,
    });
  }

  if (assertions.files_changed) {
    const changedPaths = trace.toolCalls
      .map(filePathFromToolCall)
      .filter((p): p is string => p !== null)
      .map((p) => path.relative(worktreePath, p));

    for (const { pattern } of assertions.files_changed) {
      const matched = changedPaths.some((p) => minimatch(p, pattern));
      checks.push({
        name: `files_changed: ${pattern}`,
        passed: matched,
        detail: matched
          ? "matched"
          : `no changed file matched (changed: ${changedPaths.join(", ") || "none"})`,
      });
    }
  }

  if (typeof assertions.max_tool_calls === "number") {
    const count = trace.toolCalls.length;
    checks.push({
      name: `max_tool_calls: ${assertions.max_tool_calls}`,
      passed: count <= assertions.max_tool_calls,
      detail: `${count} tool call(s)`,
    });
  }

  if (assertions.tests_pass) {
    checks.push(runTestsPassCheck(worktreePath));
  }

  return { passed: checks.every((c) => c.passed), checks };
}

function runTestsPassCheck(worktreePath: string): AssertionCheck {
  if (!fs.existsSync(path.join(worktreePath, "package.json"))) {
    return { name: "tests_pass", passed: false, detail: "no package.json in worktree" };
  }

  try {
    execFileSync("npm", ["test", "--silent"], { cwd: worktreePath, stdio: "pipe" });
    return { name: "tests_pass", passed: true, detail: "npm test exited 0" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { name: "tests_pass", passed: false, detail: `npm test failed: ${message.slice(0, 300)}` };
  }
}
