import fs from "node:fs";
import yaml from "js-yaml";

export interface ScenarioAssertions {
  tools_called?: string[];
  tools_not_called?: string[];
  files_changed?: { pattern: string }[];
  max_tool_calls?: number;
  tests_pass?: boolean;
}

export interface Scenario {
  name: string;
  description?: string;
  repo: string;
  task: string;
  assertions: ScenarioAssertions;
}

export function loadScenario(filePath: string): Scenario {
  const raw = yaml.load(fs.readFileSync(filePath, "utf8"));
  if (!raw || typeof raw !== "object") {
    throw new Error(`${filePath}: not a valid YAML object`);
  }

  const data = raw as Record<string, unknown>;
  if (typeof data.name !== "string") {
    throw new Error(`${filePath}: missing required field "name"`);
  }
  if (typeof data.repo !== "string") {
    throw new Error(`${filePath}: missing required field "repo"`);
  }
  if (typeof data.task !== "string") {
    throw new Error(`${filePath}: missing required field "task"`);
  }

  return {
    name: data.name,
    description: typeof data.description === "string" ? data.description : undefined,
    repo: data.repo,
    task: data.task,
    assertions: (data.assertions as ScenarioAssertions | undefined) ?? {},
  };
}
