// =============================================================================
// CHANGELOG TYPES
// =============================================================================

export type ChangelogCategory =
  | "Feature"
  | "Bugfix"
  | "Improvement"
  | "Breaking"
  | "Security";

export interface Changelog {
  id: string;
  version: string;
  title: string;
  content: string;
  category: ChangelogCategory;
  release_date: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateChangelogInput {
  version: string;
  title: string;
  content: string;
  category: ChangelogCategory;
  release_date?: string;
  is_published?: boolean;
}

export interface UpdateChangelogInput extends Partial<CreateChangelogInput> {
  id: string;
}

// =============================================================================
// NEWSLETTER TYPES
// =============================================================================

export interface Subscriber {
  id: string;
  email: string;
  is_active: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
  unsubscribe_token: string;
  source: string;
}

export interface SubscribeInput {
  email: string;
  source?: string;
}

// =============================================================================
// EMAIL TYPES
// =============================================================================

export interface EmailLog {
  id: string;
  subject: string;
  content: string;
  recipient_count: number;
  sent_at: string;
  sent_by: string;
  status: "sent" | "failed" | "partial";
  error_details: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
}

export interface SendEmailInput {
  subject: string;
  content: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// =============================================================================
// TOAST TYPES
// =============================================================================

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// =============================================================================
// AUTH TYPES
// =============================================================================

export interface AdminSession {
  token: string;
  expiresAt: string;
}

// =============================================================================
// DEPLOYMENT TYPES
// =============================================================================

export type DeploymentPlatform = "mac" | "windows";
export type DeploymentStatus = "pending" | "in_progress" | "completed" | "failed";

export interface BuildInfo {
  size: number; // bytes
  sizeFormatted: string;
  path?: string;
  uploadedAt?: string;
  fileCount?: number;
  appName?: string; // mac only
  exeName?: string; // windows only
}

export interface Deployment {
  id: string;
  version: string;
  platforms: DeploymentPlatform[];
  status: DeploymentStatus;
  build_info: {
    mac?: BuildInfo;
    windows?: BuildInfo;
  };
  changelog_id?: string;
  changelog?: {
    id: string;
    version: string;
    title: string;
  };
  itch_channels: string[];
  commit_hash?: string;
  commit_message?: string;
  deployed_at: string;
  created_at: string;
}

export interface CreateDeploymentInput {
  version: string;
  platforms: DeploymentPlatform[];
  status?: DeploymentStatus;
  build_info?: {
    mac?: Partial<BuildInfo>;
    windows?: Partial<BuildInfo>;
  };
  changelog_id?: string;
  itch_channels?: string[];
  commit_hash?: string;
  commit_message?: string;
}

export interface DeploymentStats {
  totalDeployments: number;
  latestVersion: string;
  lastDeployedAt: string;
  platformCounts: {
    mac: number;
    windows: number;
  };
}

// =============================================================================
// BUILD STATUS TYPES
// =============================================================================

export interface PlatformBuildInfo {
  exists: boolean;
  path: string;
  size: number;
  sizeFormatted: string;
  fileCount: number;
  appName?: string; // For mac .app
  exeName?: string; // For windows .exe
  lastModified?: string;
}

export type CommitType = "feat" | "fix" | "update" | "refactor" | "docs" | "chore" | "other";
export type VersionBump = "major" | "minor" | "patch" | "none";

export interface ParsedCommit {
  hash: string;
  type: CommitType;
  scope?: string;
  message: string;
  fullMessage: string;
}

export interface GeneratedChangelog {
  features: ParsedCommit[];
  fixes: ParsedCommit[];
  improvements: ParsedCommit[];
  other: ParsedCommit[];
  totalCommits: number;
  suggestedBump: VersionBump;
  suggestedVersion: string;
  markdownContent: string;
}

export interface BuildStatus {
  version: string;
  buildsPath: string;
  mac: PlatformBuildInfo | null;
  windows: PlatformBuildInfo | null;
  latestChangelog: {
    id: string;
    version: string;
    title: string;
    is_published: boolean;
  } | null;
  suggestedVersion: string;
  gitTag: string;
  // Pending changes since last tag (from remote)
  pendingChanges: GeneratedChangelog | null;
  hasNewCommits: boolean;
  // Latest commit hash from origin/main
  latestCommitHash: string;
  // Timestamps for visual comparison
  tagCreatedAt: string | null;
  latestCommitDate: string | null;
}

export interface ExecuteDeploymentInput {
  platforms: DeploymentPlatform[];
  version?: string;
  notifySubscribers?: boolean;
  publishChangelog?: boolean;
}

export interface DeploymentOutput {
  success: boolean;
  output: string;
  error?: string;
  deployedVersion?: string;
  platforms?: DeploymentPlatform[];
}
