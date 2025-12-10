import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/server";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import type {
  BuildStatus,
  PlatformBuildInfo,
  ParsedCommit,
  GeneratedChangelog,
  CommitType,
  VersionBump,
} from "@/types";

// Check if running on Vercel (serverless) or locally
function isRunningLocally(): boolean {
  return process.env.VERCEL !== "1";
}

// Path to the stick-crisis game repository (relative to launcher)
const STICK_CRISIS_REPO = path.resolve(process.cwd(), "../stick-crisis");
const BUILDS_PATH = path.join(STICK_CRISIS_REPO, "Builds");

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

function getDirectorySize(dirPath: string): number {
  let totalSize = 0;
  try {
    const files = fs.readdirSync(dirPath, { recursive: true });
    for (const file of files) {
      const filePath = path.join(dirPath, file as string);
      try {
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          totalSize += stat.size;
        }
      } catch {
        // Skip files we can't read
      }
    }
  } catch {
    return 0;
  }
  return totalSize;
}

function countFiles(dirPath: string): number {
  try {
    const files = fs.readdirSync(dirPath, { recursive: true });
    return files.filter((f) => {
      try {
        return fs.statSync(path.join(dirPath, f as string)).isFile();
      } catch {
        return false;
      }
    }).length;
  } catch {
    return 0;
  }
}

function findApp(dirPath: string): string | undefined {
  try {
    const entries = fs.readdirSync(dirPath);
    const app = entries.find((e) => e.endsWith(".app"));
    return app;
  } catch {
    return undefined;
  }
}

function findExe(dirPath: string): string | undefined {
  try {
    const entries = fs.readdirSync(dirPath);
    const exe = entries.find((e) => e.endsWith(".exe"));
    return exe;
  } catch {
    return undefined;
  }
}

function getLastModified(dirPath: string): string | undefined {
  try {
    const stat = fs.statSync(dirPath);
    return stat.mtime.toISOString();
  } catch {
    return undefined;
  }
}

// Fetch latest from remote (tags and commits)
function fetchRemote(): void {
  try {
    execSync("git fetch origin --tags --prune", {
      cwd: STICK_CRISIS_REPO,
      encoding: "utf-8",
      stdio: "pipe",
    });
  } catch (error) {
    console.error("Failed to fetch from remote:", error);
  }
}

// Check if a tag is an ancestor of origin/develop
function isTagAncestorOfRemote(tag: string): boolean {
  try {
    execSync(`git merge-base --is-ancestor ${tag} origin/develop`, {
      cwd: STICK_CRISIS_REPO,
      encoding: "utf-8",
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}

// Get the latest tag from remote (that is reachable from origin/develop)
function getGitTag(): string {
  try {
    // Get the latest tag that's reachable from origin/develop
    const tag = execSync("git describe --tags --abbrev=0 origin/develop", {
      cwd: STICK_CRISIS_REPO,
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();
    return tag;
  } catch {
    // Fallback: try to find a tag that IS an ancestor of origin/develop
    try {
      const tags = execSync("git tag --sort=-version:refname", {
        cwd: STICK_CRISIS_REPO,
        encoding: "utf-8",
        stdio: "pipe",
      }).trim();

      if (tags) {
        // Find first tag that is ancestor of origin/develop
        for (const tag of tags.split("\n")) {
          if (tag && isTagAncestorOfRemote(tag)) {
            return tag;
          }
        }
      }
    } catch {
      // No tags exist
    }
    // No valid tag found - return empty to indicate fresh start
    return "";
  }
}

function getPlatformBuildInfo(
  platformPath: string,
  platform: "mac" | "windows"
): PlatformBuildInfo | null {
  if (!fs.existsSync(platformPath)) {
    return null;
  }

  const size = getDirectorySize(platformPath);
  const fileCount = countFiles(platformPath);

  return {
    exists: true,
    path: platformPath,
    size,
    sizeFormatted: formatSize(size),
    fileCount,
    appName: platform === "mac" ? findApp(platformPath) : undefined,
    exeName: platform === "windows" ? findExe(platformPath) : undefined,
    lastModified: getLastModified(platformPath),
  };
}

// Parse conventional commit message
function parseCommitMessage(line: string): ParsedCommit | null {
  // Format: "hash message"
  const match = line.match(/^([a-f0-9]+)\s+(.+)$/);
  if (!match) return null;

  const [, hash, fullMessage] = match;

  // Parse conventional commit format: type(scope): message
  const conventionalMatch = fullMessage.match(
    /^(feat|fix|update|refactor|docs|chore|perf|test|style|build|ci)(?:\(([^)]+)\))?:\s*(.+)$/i
  );

  if (conventionalMatch) {
    const [, type, scope, message] = conventionalMatch;
    return {
      hash,
      type: type.toLowerCase() as CommitType,
      scope: scope || undefined,
      message,
      fullMessage,
    };
  }

  // Non-conventional commit
  return {
    hash,
    type: "other",
    message: fullMessage,
    fullMessage,
  };
}

// Get commits since last tag from remote
function getPendingCommits(lastTag: string): ParsedCommit[] {
  try {
    let output: string;

    if (lastTag) {
      // Get commits from origin/develop since last tag
      output = execSync(`git log ${lastTag}..origin/develop --oneline`, {
        cwd: STICK_CRISIS_REPO,
        encoding: "utf-8",
        stdio: "pipe",
      }).trim();
    } else {
      // No valid tag - get ALL commits from origin/develop (limit to last 50)
      output = execSync("git log origin/develop --oneline -50", {
        cwd: STICK_CRISIS_REPO,
        encoding: "utf-8",
        stdio: "pipe",
      }).trim();
    }

    if (!output) return [];

    const lines = output.split("\n").filter(Boolean);
    const commits: ParsedCommit[] = [];

    for (const line of lines) {
      const parsed = parseCommitMessage(line);
      if (parsed) {
        commits.push(parsed);
      }
    }

    return commits;
  } catch {
    return [];
  }
}

// Calculate version bump based on commits
function calculateVersionBump(commits: ParsedCommit[]): VersionBump {
  if (commits.length === 0) return "none";

  // Check for breaking changes (would be major)
  const hasBreaking = commits.some(
    (c) =>
      c.fullMessage.includes("BREAKING CHANGE") ||
      c.fullMessage.includes("!:")
  );
  if (hasBreaking) return "major";

  // Check for features (minor)
  const hasFeatures = commits.some((c) => c.type === "feat");
  if (hasFeatures) return "minor";

  // Check for fixes or updates (patch)
  const hasFixes = commits.some(
    (c) => c.type === "fix" || c.type === "update" || c.type === "refactor"
  );
  if (hasFixes) return "patch";

  // Only docs/chore/other - no version bump needed for release
  return "patch";
}

// Bump version string
function bumpVersion(version: string, bump: VersionBump): string {
  // Remove leading 'v' and any suffix like '-prebeta'
  const cleanVersion = version.replace(/^v/, "");
  const match = cleanVersion.match(/^(\d+)\.(\d+)\.(\d+)(.*)$/);

  if (!match) return version;

  const [, major, minor, patch, suffix] = match;
  let majorNum = parseInt(major, 10);
  let minorNum = parseInt(minor, 10);
  let patchNum = parseInt(patch, 10);

  switch (bump) {
    case "major":
      majorNum++;
      minorNum = 0;
      patchNum = 0;
      break;
    case "minor":
      minorNum++;
      patchNum = 0;
      break;
    case "patch":
      patchNum++;
      break;
    case "none":
    default:
      break;
  }

  return `${majorNum}.${minorNum}.${patchNum}${suffix}`;
}

// Generate markdown changelog content
function generateMarkdownChangelog(
  commits: ParsedCommit[],
  version: string
): string {
  const features = commits.filter((c) => c.type === "feat");
  const fixes = commits.filter((c) => c.type === "fix");
  const improvements = commits.filter(
    (c) => c.type === "update" || c.type === "refactor"
  );
  const other = commits.filter(
    (c) =>
      !["feat", "fix", "update", "refactor"].includes(c.type) &&
      c.type !== "docs" &&
      c.type !== "chore"
  );

  let md = `## Version ${version}\n\n`;

  if (features.length > 0) {
    md += `### New Features\n`;
    for (const c of features) {
      const scope = c.scope ? `**${c.scope}:** ` : "";
      md += `- ${scope}${c.message}\n`;
    }
    md += "\n";
  }

  if (fixes.length > 0) {
    md += `### Bug Fixes\n`;
    for (const c of fixes) {
      const scope = c.scope ? `**${c.scope}:** ` : "";
      md += `- ${scope}${c.message}\n`;
    }
    md += "\n";
  }

  if (improvements.length > 0) {
    md += `### Improvements\n`;
    for (const c of improvements) {
      const scope = c.scope ? `**${c.scope}:** ` : "";
      md += `- ${scope}${c.message}\n`;
    }
    md += "\n";
  }

  if (other.length > 0) {
    md += `### Other Changes\n`;
    for (const c of other) {
      md += `- ${c.message}\n`;
    }
    md += "\n";
  }

  return md.trim();
}

// Generate changelog from pending commits
function generateChangelog(currentVersion: string, gitTag: string): GeneratedChangelog | null {
  const commits = getPendingCommits(gitTag);

  if (commits.length === 0) {
    return null;
  }

  const features = commits.filter((c) => c.type === "feat");
  const fixes = commits.filter((c) => c.type === "fix");
  const improvements = commits.filter(
    (c) => c.type === "update" || c.type === "refactor"
  );
  const other = commits.filter(
    (c) => !["feat", "fix", "update", "refactor", "docs", "chore"].includes(c.type)
  );

  const suggestedBump = calculateVersionBump(commits);
  const suggestedVersion = bumpVersion(currentVersion, suggestedBump);
  const markdownContent = generateMarkdownChangelog(commits, suggestedVersion);

  return {
    features,
    fixes,
    improvements,
    other,
    totalCommits: commits.length,
    suggestedBump,
    suggestedVersion,
    markdownContent,
  };
}

// Get latest commit hash from remote
function getLatestCommitHash(): string {
  try {
    const hash = execSync("git rev-parse --short origin/develop", {
      cwd: STICK_CRISIS_REPO,
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();
    return hash;
  } catch {
    return "";
  }
}

// Get tag creation date (ISO format)
function getTagCreatedAt(tag: string): string | null {
  try {
    // For annotated tags, get the tag date
    // For lightweight tags, get the commit date
    const date = execSync(
      `git log -1 --format=%aI ${tag}`,
      {
        cwd: STICK_CRISIS_REPO,
        encoding: "utf-8",
        stdio: "pipe",
      }
    ).trim();
    return date || null;
  } catch {
    return null;
  }
}

// Get latest commit date from remote (ISO format)
function getLatestCommitDate(): string | null {
  try {
    const date = execSync(
      "git log -1 --format=%aI origin/develop",
      {
        cwd: STICK_CRISIS_REPO,
        encoding: "utf-8",
        stdio: "pipe",
      }
    ).trim();
    return date || null;
  } catch {
    return null;
  }
}

// GET - Get current build status
export async function GET() {
  try {
    const isAuthenticated = await isAdminAuthenticated();
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if running on Vercel - return limited info
    if (!isRunningLocally()) {
      // On Vercel, we can only get DB info, not filesystem/git info
      const supabase = getSupabaseServer();
      const { data: changelog } = await supabase
        .from("changelog")
        .select("id, version, title, is_published")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      return NextResponse.json({
        isLocal: false,
        version: changelog?.version || "0.0.0",
        buildsPath: null,
        mac: null,
        windows: null,
        latestChangelog: changelog || null,
        suggestedVersion: changelog?.version || "0.0.0",
        gitTag: null,
        pendingChanges: null,
        hasNewCommits: false,
        latestCommitHash: null,
        tagCreatedAt: null,
        latestCommitDate: null,
        message: "Running on Vercel - build status requires local environment",
      });
    }

    // Fetch latest from remote before reading
    fetchRemote();

    // Get git tag for version (empty string if no valid tag on origin/develop)
    const gitTag = getGitTag();
    const version = gitTag ? gitTag.replace(/^v/, "") : "0.0.0"; // Remove leading 'v' or default

    // Always use "current" folder - builds are not versioned, only git tags are
    const versionBuildPath = path.join(BUILDS_PATH, "current");

    // Check mac and windows builds
    const macPath = path.join(versionBuildPath, "mac");
    const windowsPath = path.join(versionBuildPath, "windows");

    const macBuild = getPlatformBuildInfo(macPath, "mac");
    const windowsBuild = getPlatformBuildInfo(windowsPath, "windows");

    // Get latest changelog from database
    const supabase = getSupabaseServer();
    const { data: changelog } = await supabase
      .from("changelog")
      .select("id, version, title, is_published")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Generate changelog from pending commits
    const pendingChanges = generateChangelog(version, gitTag);
    const hasNewCommits = pendingChanges !== null && pendingChanges.totalCommits > 0;

    // Suggest version based on pending commits or existing changelog
    let suggestedVersion = version;
    if (hasNewCommits && pendingChanges) {
      suggestedVersion = pendingChanges.suggestedVersion;
    } else if (changelog && !changelog.is_published) {
      suggestedVersion = changelog.version;
    }

    // Get latest commit hash from remote
    const latestCommitHash = getLatestCommitHash();

    // Get timestamps for visual comparison
    const tagCreatedAt = gitTag ? getTagCreatedAt(gitTag) : null;
    const latestCommitDate = getLatestCommitDate();

    const buildStatus: BuildStatus & { isLocal: boolean } = {
      isLocal: true,
      version,
      buildsPath: versionBuildPath,
      mac: macBuild,
      windows: windowsBuild,
      latestChangelog: changelog || null,
      suggestedVersion,
      gitTag,
      pendingChanges,
      hasNewCommits,
      latestCommitHash,
      tagCreatedAt,
      latestCommitDate,
    };

    return NextResponse.json(buildStatus);
  } catch (error) {
    console.error("Build status error:", error);
    return NextResponse.json(
      { error: "Failed to get build status" },
      { status: 500 }
    );
  }
}
