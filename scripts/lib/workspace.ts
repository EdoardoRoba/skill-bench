import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// examples/mini-api isn't its own git repo (see scenarios/README.md for why:
// it ships as a plain subfolder of this plugin), so isolation is a plain
// recursive copy rather than a git worktree/clone.
const EXCLUDED_BASENAMES = new Set(["node_modules", "skillgen-candidates", ".git"]);

export function createIsolatedCopy(srcRepoPath: string, label: string): string {
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), `skillgen-${label}-`));
  fs.cpSync(srcRepoPath, dest, {
    recursive: true,
    filter: (source) => !EXCLUDED_BASENAMES.has(path.basename(source)),
  });

  // Symlink node_modules instead of reinstalling per run — much faster,
  // and fine because eval runs don't mutate dependencies.
  const srcNodeModules = path.join(srcRepoPath, "node_modules");
  if (fs.existsSync(srcNodeModules)) {
    fs.symlinkSync(srcNodeModules, path.join(dest, "node_modules"), "dir");
  }

  return dest;
}

// Copies a candidate skill straight onto disk so it's live for the agent
// run that follows — this is harness setup, not something the agent-under-
// test does, so it deliberately bypasses no permission system.
export function installSkill(worktreePath: string, skillDir: string): void {
  const skillName = path.basename(skillDir);
  const dest = path.join(worktreePath, ".claude", "skills", skillName);
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(skillDir, dest, { recursive: true });
}

export function cleanupWorkspace(worktreePath: string): void {
  fs.rmSync(worktreePath, { recursive: true, force: true });
}
