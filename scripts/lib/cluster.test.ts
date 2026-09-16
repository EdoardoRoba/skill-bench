import assert from "node:assert/strict";
import test from "node:test";
import { clusterSignals } from "./cluster";
import type { RepoSignals } from "./repoSignals";

function fixtureSignals(overrides: Partial<RepoSignals> = {}): RepoSignals {
  return {
    repoPath: "/fake/repo",
    packageJson: null,
    languages: ["JavaScript"],
    folders: [],
    gitLog: [],
    ...overrides,
  };
}

test("clusters routes/db/middleware folders into api-layer, data-layer and auth", () => {
  const signals = fixtureSignals({
    folders: [
      { relPath: "src/routes", fileCount: 2, sampleFiles: ["users.js", "health.js"] },
      { relPath: "src/db", fileCount: 1, sampleFiles: ["userRepository.js"] },
      { relPath: "src/middleware", fileCount: 1, sampleFiles: ["auth.js"] },
    ],
  });

  const { candidates, warnings } = clusterSignals(signals);

  assert.deepEqual(
    candidates.map((c) => c.id).sort(),
    ["api-layer", "auth", "data-layer"]
  );
  assert.equal(warnings.length, 0);
});

test("caps output at 3 candidates and moves the rest to suppressedCandidates", () => {
  const signals = fixtureSignals({
    packageJson: { devDependencies: { jest: "^29.0.0" } },
    folders: [
      { relPath: "src/routes", fileCount: 1, sampleFiles: ["users.js"] },
      { relPath: "src/db", fileCount: 1, sampleFiles: ["userRepository.js"] },
      { relPath: "src/middleware", fileCount: 1, sampleFiles: ["auth.js"] },
      { relPath: "tests", fileCount: 1, sampleFiles: ["users.test.js"] },
    ],
  });

  const { candidates, suppressedCandidates } = clusterSignals(signals);

  assert.equal(candidates.length, 3);
  assert.deepEqual(
    suppressedCandidates.map((c) => c.id),
    ["testing-conventions"]
  );
});

test("warns when a folder matches more than one domain rule", () => {
  const signals = fixtureSignals({
    folders: [
      { relPath: "src/auth/routes", fileCount: 1, sampleFiles: ["login.js"] },
    ],
  });

  const { warnings } = clusterSignals(signals);

  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /Overlap/);
});

test("skips the tooling candidate when there is no test framework declared", () => {
  const signals = fixtureSignals({
    folders: [{ relPath: "tests", fileCount: 1, sampleFiles: ["a.test.js"] }],
  });

  const { candidates } = clusterSignals(signals);

  assert.equal(candidates.find((c) => c.id === "testing-conventions"), undefined);
});
