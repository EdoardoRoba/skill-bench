import path from "node:path";
import { collectRepoSignals } from "./lib/repoSignals";
import { clusterSignals } from "./lib/cluster";

function main(): void {
  const repoArg = process.argv[2] ?? ".";
  const repoPath = path.resolve(repoArg);

  const signals = collectRepoSignals(repoPath);
  const { candidates, suppressedCandidates, warnings } = clusterSignals(signals);

  const output = {
    repoPath,
    detectedLanguages: signals.languages,
    packageName: (signals.packageJson?.name as string | undefined) ?? null,
    gitLogSampleCount: signals.gitLog.length,
    candidates,
    suppressedCandidates,
    warnings,
  };

  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
}

main();
