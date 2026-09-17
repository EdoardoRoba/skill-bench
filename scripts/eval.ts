import fs from "node:fs";
import path from "node:path";
import { loadScenario, type Scenario } from "./lib/scenario";
import { createIsolatedCopy, installSkill, cleanupWorkspace } from "./lib/workspace";
import { runAgent } from "./lib/runAgent";
import { evaluateAssertions } from "./lib/assertions";
import { renderReport, type ScenarioReport, type SingleRunResult, type Variant } from "./lib/report";

interface CliArgs {
  skillDir: string;
  scenarioFiles: string[];
  runs: number;
}

function parseArgs(argv: string[]): CliArgs {
  const args = [...argv];

  let runs = 1;
  const runsIdx = args.indexOf("--runs");
  if (runsIdx !== -1) {
    runs = Number(args[runsIdx + 1]);
    if (!Number.isInteger(runs) || runs < 1) {
      throw new Error(`--runs must be a positive integer, got "${args[runsIdx + 1]}"`);
    }
    args.splice(runsIdx, 2);
  }

  const [skillDir, ...scenarioFiles] = args;
  if (!skillDir || scenarioFiles.length === 0) {
    throw new Error("Usage: eval.ts <skill-dir> <scenario.yaml...> [--runs N]");
  }

  return {
    skillDir: path.resolve(skillDir),
    scenarioFiles: scenarioFiles.map((f) => path.resolve(f)),
    runs,
  };
}

function runVariant(
  scenario: Scenario,
  skillDir: string | null,
  runs: number,
  pluginRoot: string
): SingleRunResult[] {
  const variant: Variant = skillDir ? "with-skill" : "no-skill";
  const repoPath = path.resolve(pluginRoot, scenario.repo);
  const results: SingleRunResult[] = [];

  for (let runIndex = 0; runIndex < runs; runIndex++) {
    const worktree = createIsolatedCopy(repoPath, `${scenario.name}-${variant}`);
    try {
      if (skillDir) installSkill(worktree, skillDir);
      const trace = runAgent(worktree, scenario.task);
      const assertionResult = evaluateAssertions(scenario.assertions, trace, worktree);
      results.push({ runIndex, variant, trace, assertionResult });
    } finally {
      cleanupWorkspace(worktree);
    }
  }

  return results;
}

function main(): void {
  const { skillDir, scenarioFiles, runs } = parseArgs(process.argv.slice(2));
  const pluginRoot = path.resolve(__dirname, "..");

  if (!fs.existsSync(path.join(skillDir, "SKILL.md"))) {
    throw new Error(`${skillDir} does not contain a SKILL.md`);
  }

  const reports: ScenarioReport[] = scenarioFiles.map((file) => {
    const scenario = loadScenario(file);
    process.stderr.write(`Running scenario "${scenario.name}" (${runs} run(s) x 2 variants)...\n`);
    const withSkill = runVariant(scenario, skillDir, runs, pluginRoot);
    const noSkill = runVariant(scenario, null, runs, pluginRoot);
    return { scenario, withSkill, noSkill };
  });

  const skillName = path.basename(skillDir);
  const outDir = path.resolve(pluginRoot, "reports");
  fs.mkdirSync(outDir, { recursive: true });

  const jsonPath = path.join(outDir, `${skillName}.json`);
  const mdPath = path.join(outDir, `${skillName}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(reports, null, 2));
  fs.writeFileSync(mdPath, renderReport(skillName, reports));

  process.stdout.write(`${mdPath}\n`);
}

main();
