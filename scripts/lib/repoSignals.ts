import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export interface FolderSignal {
  relPath: string;
  fileCount: number;
  sampleFiles: string[];
}

export interface RepoSignals {
  repoPath: string;
  packageJson: Record<string, unknown> | null;
  languages: string[];
  folders: FolderSignal[];
  gitLog: string[];
}

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".claude",
]);

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".py": "Python",
  ".go": "Go",
  ".rb": "Ruby",
};

function walk(
  dir: string,
  base: string,
  depth: number,
  maxDepth: number,
  out: FolderSignal[]
): void {
  if (depth > maxDepth) return;

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  const files = entries.filter((e) => e.isFile()).map((e) => e.name);
  if (files.length > 0) {
    out.push({
      relPath: path.relative(base, dir) || ".",
      fileCount: files.length,
      sampleFiles: files.slice(0, 8),
    });
  }

  for (const entry of entries) {
    if (entry.isDirectory() && !IGNORED_DIRS.has(entry.name)) {
      walk(path.join(dir, entry.name), base, depth + 1, maxDepth, out);
    }
  }
}

function readPackageJson(repoPath: string): Record<string, unknown> | null {
  const pkgPath = path.join(repoPath, "package.json");
  if (!fs.existsSync(pkgPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  } catch {
    return null;
  }
}

function detectLanguages(folders: FolderSignal[]): string[] {
  const languages = new Set<string>();
  for (const folder of folders) {
    for (const file of folder.sampleFiles) {
      const lang = EXTENSION_TO_LANGUAGE[path.extname(file)];
      if (lang) languages.add(lang);
    }
  }
  return Array.from(languages);
}

function readGitLog(repoPath: string): string[] {
  try {
    const out = execFileSync("git", ["log", "--oneline", "-n", "50"], {
      cwd: repoPath,
      encoding: "utf8",
    });
    return out.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

export function collectRepoSignals(repoPath: string): RepoSignals {
  const folders: FolderSignal[] = [];
  walk(repoPath, repoPath, 0, 4, folders);

  return {
    repoPath,
    packageJson: readPackageJson(repoPath),
    languages: detectLanguages(folders),
    folders,
    gitLog: readGitLog(repoPath),
  };
}
