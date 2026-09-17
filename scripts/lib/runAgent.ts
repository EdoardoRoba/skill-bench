import { spawnSync } from "node:child_process";

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}

export interface AgentRunTrace {
  toolCalls: ToolCall[];
  resultText: string;
  isError: boolean;
  numTurns: number;
}

// Dev-tool set the agent-under-test needs to actually do scenario work
// without hanging on interactive permission prompts. Deliberately excludes
// anything that would let it touch .claude/ or reach outside the worktree.
const ALLOWED_TOOLS = "Bash Edit Write Read Glob Grep";

interface StreamEvent {
  type: string;
  message?: { content?: Array<Record<string, unknown>> };
  result?: string;
  is_error?: boolean;
  num_turns?: number;
}

export function runAgent(cwd: string, task: string): AgentRunTrace {
  const proc = spawnSync(
    "claude",
    ["-p", task, "--output-format", "stream-json", "--verbose", "--allowedTools", ALLOWED_TOOLS],
    { cwd, encoding: "utf8", maxBuffer: 1024 * 1024 * 64 }
  );

  if (proc.error) {
    throw proc.error;
  }

  const toolCalls: ToolCall[] = [];
  let resultText = "";
  let isError = true;
  let numTurns = 0;

  for (const line of proc.stdout.split("\n")) {
    if (!line.trim()) continue;

    let event: StreamEvent;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }

    if (event.type === "assistant") {
      for (const block of event.message?.content ?? []) {
        if (block.type === "tool_use" && typeof block.name === "string") {
          toolCalls.push({
            name: block.name,
            input: (block.input as Record<string, unknown>) ?? {},
          });
        }
      }
    } else if (event.type === "result") {
      resultText = event.result ?? "";
      isError = Boolean(event.is_error);
      numTurns = event.num_turns ?? 0;
    }
  }

  return { toolCalls, resultText, isError, numTurns };
}
