import type { RepoSignals } from "./repoSignals";

export type SkillSource = "git-log" | "folder-structure" | "tooling";

export interface SkillCandidate {
  id: string;
  name: string;
  domain: string;
  source: SkillSource;
  confidence: number;
  paths: string[];
  signals: string[];
}

export interface ClusterResult {
  candidates: SkillCandidate[];
  suppressedCandidates: SkillCandidate[];
  warnings: string[];
}

// Highest priority first: a recurring task pulled from git log would rank
// above these (not yet implemented — history is too sparse to mine
// reliably in the MVP), then folder-structure domains, then tooling.
const MAX_CANDIDATES = 3;

interface DomainRule {
  id: string;
  name: string;
  domain: string;
  label: string;
  match: (relPath: string) => boolean;
}

const DOMAIN_RULES: DomainRule[] = [
  {
    id: "api-layer",
    name: "api-layer-conventions",
    domain: "API layer",
    label: "route/controller files",
    match: (rel) =>
      /(^|\/)routes?(\/|$)/i.test(rel) || /(^|\/)controllers?(\/|$)/i.test(rel),
  },
  {
    id: "data-layer",
    name: "data-layer-conventions",
    domain: "Data layer",
    label: "data access files",
    match: (rel) => /(^|\/)(db|models?|repositor(y|ies))(\/|$)/i.test(rel),
  },
  {
    id: "auth",
    name: "auth-conventions",
    domain: "Auth",
    label: "auth/middleware files",
    match: (rel) => /(^|\/)(auth|middleware)(\/|$)/i.test(rel),
  },
];

function domainCandidates(
  signals: RepoSignals
): { candidates: SkillCandidate[]; warnings: string[] } {
  const candidates: SkillCandidate[] = [];
  const claimedBy = new Map<string, string[]>();

  for (const rule of DOMAIN_RULES) {
    const matchedFolders = signals.folders.filter((f) => rule.match(f.relPath));
    if (matchedFolders.length === 0) continue;

    const fileCount = matchedFolders.reduce((sum, f) => sum + f.fileCount, 0);
    const confidence = Math.min(0.5 + matchedFolders.length * 0.15, 0.95);

    candidates.push({
      id: rule.id,
      name: rule.name,
      domain: rule.domain,
      source: "folder-structure",
      confidence: Number(confidence.toFixed(2)),
      paths: matchedFolders.map((f) => `${f.relPath}/**`),
      signals: [
        `${matchedFolders.length} folder(s) matching "${rule.label}" (${fileCount} files total)`,
        ...matchedFolders.map((f) => `${f.relPath}: ${f.sampleFiles.join(", ")}`),
      ],
    });

    for (const f of matchedFolders) {
      const list = claimedBy.get(f.relPath) ?? [];
      list.push(rule.id);
      claimedBy.set(f.relPath, list);
    }
  }

  const warnings: string[] = [];
  for (const [relPath, ids] of claimedBy) {
    if (ids.length > 1) {
      warnings.push(
        `Overlap: folder "${relPath}" matches multiple candidates (${ids.join(
          ", "
        )}) — consider narrowing their scope.`
      );
    }
  }

  return { candidates, warnings };
}

function toolingCandidates(signals: RepoSignals): SkillCandidate[] {
  const candidates: SkillCandidate[] = [];

  const devDeps =
    (signals.packageJson?.devDependencies as Record<string, string> | undefined) ??
    {};
  const hasJest = Boolean(devDeps.jest);
  const testFolders = signals.folders.filter((f) => /(^|\/)tests?(\/|$)/i.test(f.relPath));

  if (hasJest && testFolders.length > 0) {
    candidates.push({
      id: "testing-conventions",
      name: "testing-conventions",
      domain: "Testing",
      source: "tooling",
      confidence: 0.7,
      paths: testFolders.map((f) => `${f.relPath}/**`),
      signals: [
        "jest declared in devDependencies",
        `${testFolders.length} test folder(s) mirroring source layout: ${testFolders
          .map((f) => f.relPath)
          .join(", ")}`,
      ],
    });
  }

  return candidates;
}

export function clusterSignals(signals: RepoSignals): ClusterResult {
  const { candidates: domain, warnings } = domainCandidates(signals);
  const tooling = toolingCandidates(signals);

  // Priority order: domain (folder-structure) candidates first, tooling
  // last — git-log-derived task candidates would slot in ahead of domain
  // once implemented. Cap to MAX_CANDIDATES so the output stays a small,
  // reviewable set of proposals rather than one skill per folder.
  const ranked = [...domain, ...tooling];
  const candidates = ranked.slice(0, MAX_CANDIDATES);
  const suppressedCandidates = ranked.slice(MAX_CANDIDATES);

  return { candidates, suppressedCandidates, warnings };
}
