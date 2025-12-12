"use client";

import { useEffect, useState, useCallback } from "react";
import {
  PixelCard,
  PixelBadge,
  LoadingSpinner,
  ConfirmModal,
  PixelButton,
  PlatformIcon,
  useToast,
} from "@/components/ui";
import { formatDateTime, markdownToHtml } from "@/lib/utils";
import type {
  Deployment,
  DeploymentPlatform,
  Changelog,
  BuildStatus,
} from "@/types";

// Extended BuildStatus with environment info
interface BuildStatusWithEnv extends BuildStatus {
  isLocal?: boolean;
  message?: string;
}

interface DeploymentStats {
  totalDeployments: number;
  latestVersion: string;
  lastDeployedAt: string | null;
  latestBuildInfo: Record<string, { size?: number; sizeFormatted?: string }>;
  latestPlatforms: DeploymentPlatform[];
  latestChannels: string[];
  platformCounts: {
    mac: number;
    windows: number;
  };
  recentDeployments: Deployment[];
}

export default function AdminDeploymentsPage() {
  const [stats, setStats] = useState<DeploymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(5);
  const [changelogs, setChangelogs] = useState<Record<string, Changelog>>({});
  const { showToast } = useToast();

  // New deployment section state
  const [buildStatus, setBuildStatus] = useState<BuildStatusWithEnv | null>(null);
  const [buildStatusLoading, setBuildStatusLoading] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<DeploymentPlatform>>(new Set<DeploymentPlatform>(["mac", "windows"]));
  const [notifySubscribers, setNotifySubscribers] = useState(true);
  const [publishChangelog, setPublishChangelog] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployOutput, setDeployOutput] = useState<string>("");
  const [showNewDeployment, setShowNewDeployment] = useState(false);
  const [showRecentDeployments, setShowRecentDeployments] = useState(false);

  const fetchBuildStatus = useCallback(async () => {
    setBuildStatusLoading(true);
    try {
      const response = await fetch("/api/admin/deployments/build-status");
      if (!response.ok) throw new Error("Failed to fetch build status");
      const data = await response.json();
      setBuildStatus(data);

      // Auto-select platforms based on available builds
      const available = new Set<DeploymentPlatform>();
      if (data.mac?.exists) available.add("mac");
      if (data.windows?.exists) available.add("windows");
      if (available.size > 0) {
        setSelectedPlatforms(available);
      }
    } catch (error) {
      console.error("Failed to fetch build status:", error);
      showToast("Failed to load build status", "error");
    } finally {
      setBuildStatusLoading(false);
    }
  }, [showToast]);

  async function handleDeploy() {
    if (selectedPlatforms.size === 0) {
      showToast("Please select at least one platform", "error");
      return;
    }

    setIsDeploying(true);
    setDeployOutput("");

    try {
      const response = await fetch("/api/admin/deployments/execute-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platforms: Array.from(selectedPlatforms),
          version: buildStatus?.pendingChanges?.suggestedVersion,
          notifySubscribers,
          publishChangelog,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start deployment");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response stream");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "start") {
                setDeployOutput(data.message + "\n");
              } else if (data.type === "stdout" || data.type === "stderr") {
                setDeployOutput((prev) => prev + data.data);
              } else if (data.type === "complete") {
                if (data.success) {
                  if (data.tagCreated) {
                    showToast(`Deployment completed! Tag v${data.deployedVersion} created.`, "success");
                  } else if (data.tagError) {
                    showToast(`Deployed but tag failed: ${data.tagError}`, "warning");
                  } else {
                    showToast("Deployment completed successfully!", "success");
                  }
                  fetchStats();
                  fetchBuildStatus();
                } else {
                  showToast(`Deployment failed with exit code ${data.exitCode}`, "error");
                }
                setIsDeploying(false);
              } else if (data.type === "error") {
                setDeployOutput((prev) => prev + `\nError: ${data.message}\n`);
                showToast(data.message, "error");
                setIsDeploying(false);
              }
            } catch {
              // Ignore JSON parse errors
            }
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setDeployOutput((prev) => prev + `\nError: ${message}`);
      showToast(`Deployment failed: ${message}`, "error");
      setIsDeploying(false);
    }
  }

  function togglePlatform(platform: DeploymentPlatform) {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  }

  useEffect(() => {
    fetchStats();
    fetchBuildStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Fetch changelogs for deployments that have changelog_id
    if (stats?.recentDeployments) {
      stats.recentDeployments.forEach((deployment) => {
        if (deployment.changelog_id && !changelogs[deployment.changelog_id]) {
          fetchChangelog(deployment.changelog_id);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats?.recentDeployments]);

  async function fetchStats() {
    try {
      const response = await fetch("/api/admin/deployments/stats");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      showToast("Failed to load deployment stats", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchChangelog(id: string) {
    try {
      const response = await fetch(`/api/admin/changelog?id=${id}`);
      if (!response.ok) return;
      const data = await response.json();
      if (data.success && data.data) {
        setChangelogs((prev) => ({ ...prev, [id]: data.data }));
      }
    } catch (error) {
      console.error("Failed to fetch changelog:", error);
    }
  }


  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/admin/deployments?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      showToast("Deployment deleted", "success");
      setConfirmDelete(null);
      fetchStats();
    } catch (error) {
      showToast("Failed to delete deployment", "error");
      console.error(error);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-pixel text-pixel-sm text-pixel-text-primary uppercase">
          Deployments
        </h1>
        <PixelButton
          variant="secondary"
          size="sm"
          onClick={() => setShowNewDeployment(!showNewDeployment)}
        >
          {showNewDeployment ? "Hide" : "New Deploy"}
        </PixelButton>
      </div>

      {/* New Deployment Section */}
      {showNewDeployment && (
        <PixelCard className="mb-8 border-pixel-accent-yellow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-pixel text-pixel-xs text-pixel-accent-yellow uppercase">
              New Deployment
            </h2>
            <PixelButton
              size="sm"
              variant="secondary"
              onClick={fetchBuildStatus}
              disabled={buildStatusLoading}
            >
              {buildStatusLoading ? "..." : "Refresh"}
            </PixelButton>
          </div>

          {/* Show message when running on Vercel */}
          {buildStatus && buildStatus.isLocal === false ? (
            <div className="bg-pixel-bg-secondary p-6 rounded border border-pixel-accent-yellow/30">
              <div className="text-center space-y-4">
                <div className="text-4xl">🚀</div>
                <h3 className="font-pixel text-pixel-xs text-pixel-accent-yellow uppercase">
                  Local Environment Required
                </h3>
                <p className="font-mono text-sm text-pixel-text-secondary max-w-md mx-auto">
                  Deployment execution requires access to local build files and the butler CLI.
                </p>
                <div className="bg-pixel-bg-primary p-4 rounded border border-pixel-text-muted/20 max-w-lg mx-auto">
                  <p className="font-mono text-xs text-pixel-text-muted mb-2">
                    To deploy, run locally:
                  </p>
                  <code className="font-mono text-sm text-pixel-accent-green">
                    cd stick-crisis && ./distribute_itch.sh
                  </code>
                </div>
                <p className="font-mono text-xs text-pixel-text-muted">
                  Or access the admin panel from{" "}
                  <code className="text-pixel-accent-cyan">localhost:3000</code>
                </p>
              </div>
            </div>
          ) : buildStatusLoading && !buildStatus ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : buildStatus ? (
            <div className="space-y-6">
              {/* Pending Changes Section - Show first if there are new commits */}
              {buildStatus.hasNewCommits && buildStatus.pendingChanges && (
                <div className="bg-pixel-accent-yellow/10 p-4 rounded border-2 border-pixel-accent-yellow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="font-pixel text-pixel-xs text-pixel-accent-yellow uppercase">
                        {buildStatus.pendingChanges.totalCommits} New Commits
                      </span>
                      <PixelBadge category="Improvement">
                        {buildStatus.pendingChanges.suggestedBump.toUpperCase()} bump
                      </PixelBadge>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs text-pixel-text-muted">Suggested Version</p>
                      <p className="font-pixel text-pixel-sm text-pixel-accent-green">
                        v{buildStatus.pendingChanges.suggestedVersion}
                      </p>
                    </div>
                  </div>

                  {/* Change Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-pixel-bg-primary p-2 rounded text-center">
                      <p className="font-pixel text-pixel-md text-pixel-accent-green">
                        {buildStatus.pendingChanges.features.length}
                      </p>
                      <p className="font-mono text-xs text-pixel-text-muted">Features</p>
                    </div>
                    <div className="bg-pixel-bg-primary p-2 rounded text-center">
                      <p className="font-pixel text-pixel-md text-pixel-accent-red">
                        {buildStatus.pendingChanges.fixes.length}
                      </p>
                      <p className="font-mono text-xs text-pixel-text-muted">Fixes</p>
                    </div>
                    <div className="bg-pixel-bg-primary p-2 rounded text-center">
                      <p className="font-pixel text-pixel-md text-pixel-accent-cyan">
                        {buildStatus.pendingChanges.improvements.length}
                      </p>
                      <p className="font-mono text-xs text-pixel-text-muted">Improvements</p>
                    </div>
                    <div className="bg-pixel-bg-primary p-2 rounded text-center">
                      <p className="font-pixel text-pixel-md text-pixel-text-muted">
                        {buildStatus.pendingChanges.other.length}
                      </p>
                      <p className="font-mono text-xs text-pixel-text-muted">Other</p>
                    </div>
                  </div>

                  {/* Generated Changelog Preview */}
                  <details className="group">
                    <summary className="cursor-pointer font-mono text-xs text-pixel-accent-yellow hover:text-pixel-accent-yellow/80 flex items-center gap-2">
                      <span className="group-open:rotate-90 transition-transform">▶</span>
                      View Generated Changelog
                    </summary>
                    <div className="mt-3 bg-pixel-bg-primary p-4 rounded border border-pixel-text-muted/20 max-h-[300px] overflow-y-auto">
                      <div
                        className="font-mono text-xs"
                        dangerouslySetInnerHTML={{
                          __html: markdownToHtml(buildStatus.pendingChanges.markdownContent)
                        }}
                      />
                    </div>
                  </details>
                </div>
              )}

              {/* No New Commits */}
              {!buildStatus.hasNewCommits && (
                <div className="bg-pixel-bg-secondary p-4 rounded border border-pixel-text-muted/20">
                  <p className="font-mono text-sm text-pixel-text-muted text-center">
                    ✓ No new commits since <span className="text-pixel-accent-green">{buildStatus.gitTag || "initial"}</span>
                  </p>
                </div>
              )}

              {/* Version Info */}
              <div className="bg-pixel-bg-primary p-4 rounded border border-pixel-text-muted/20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="font-mono text-xs text-pixel-text-muted mb-1">
                      Current Tag
                    </p>
                    <p className={`font-pixel text-pixel-xs ${buildStatus.gitTag ? "text-pixel-text-muted" : "text-pixel-accent-yellow"}`}>
                      {buildStatus.gitTag || "No tag (initial)"}
                    </p>
                    {buildStatus.tagCreatedAt && (
                      <p className="font-mono text-xs text-pixel-accent-green mt-1">
                        {formatDateTime(buildStatus.tagCreatedAt)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="font-mono text-xs text-pixel-text-muted mb-1">
                      Latest Remote Commit
                    </p>
                    <p className="font-mono text-xs text-pixel-accent-cyan">
                      {buildStatus.latestCommitHash || "N/A"}
                    </p>
                    {buildStatus.latestCommitDate && (
                      <p className={`font-mono text-xs mt-1 ${
                        buildStatus.tagCreatedAt &&
                        new Date(buildStatus.latestCommitDate) > new Date(buildStatus.tagCreatedAt)
                          ? "text-pixel-accent-yellow"
                          : "text-pixel-text-muted"
                      }`}>
                        {formatDateTime(buildStatus.latestCommitDate)}
                        {buildStatus.tagCreatedAt &&
                         new Date(buildStatus.latestCommitDate) > new Date(buildStatus.tagCreatedAt) && (
                          <span className="ml-2 text-pixel-accent-yellow">(newer)</span>
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="font-mono text-xs text-pixel-text-muted mb-1">
                      Builds Path
                    </p>
                    <p className="font-mono text-xs text-pixel-text-primary truncate max-w-[300px]">
                      {buildStatus.buildsPath}
                    </p>
                  </div>
                </div>
                {buildStatus.latestChangelog && (
                  <div className="mt-4 pt-4 border-t border-pixel-text-muted/20">
                    <p className="font-mono text-xs text-pixel-text-muted mb-1">
                      Latest Changelog (DB)
                    </p>
                    <p className="font-mono text-xs">
                      <span className="text-pixel-accent-cyan">
                        v{buildStatus.latestChangelog.version}
                      </span>
                      <span className="text-pixel-text-muted mx-2">-</span>
                      <span className="text-pixel-text-primary">
                        {buildStatus.latestChangelog.title}
                      </span>
                      {!buildStatus.latestChangelog.is_published && (
                        <PixelBadge category="Improvement" className="ml-2">
                          unpublished
                        </PixelBadge>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Available Builds */}
              <div>
                <h3 className="font-pixel text-pixel-2xs text-pixel-text-primary uppercase mb-3">
                  Available Builds
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mac Build */}
                  <div
                    className={`p-4 rounded border-2 cursor-pointer transition-all ${
                      buildStatus.mac?.exists
                        ? selectedPlatforms.has("mac")
                          ? "border-pixel-accent-green bg-pixel-accent-green/10"
                          : "border-pixel-text-muted/30 hover:border-pixel-accent-green/50"
                        : "border-pixel-text-muted/20 bg-pixel-bg-secondary opacity-50 cursor-not-allowed"
                    }`}
                    onClick={() => buildStatus.mac?.exists && togglePlatform("mac")}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.has("mac")}
                        disabled={!buildStatus.mac?.exists}
                        onChange={() => togglePlatform("mac")}
                        className="w-4 h-4 accent-pixel-accent-green"
                      />
                      <span className="text-pixel-accent-green">
                        <PlatformIcon platform="mac" />
                      </span>
                      <span className="font-pixel text-pixel-2xs uppercase">macOS</span>
                      {buildStatus.mac?.exists ? (
                        <PixelBadge category="Feature">Ready</PixelBadge>
                      ) : (
                        <PixelBadge category="Bugfix">Not Found</PixelBadge>
                      )}
                    </div>
                    {buildStatus.mac?.exists && (
                      <div className="text-xs font-mono text-pixel-text-muted space-y-1 ml-7">
                        <p>Size: {buildStatus.mac.sizeFormatted}</p>
                        <p>Files: {buildStatus.mac.fileCount}</p>
                        {buildStatus.mac.appName && <p>App: {buildStatus.mac.appName}</p>}
                        {buildStatus.mac.lastModified && (
                          <p className="text-pixel-accent-green">
                            Built: {formatDateTime(buildStatus.mac.lastModified)}
                          </p>
                        )}
                      </div>
                    )}
                    {!buildStatus.mac?.exists && (
                      <p className="text-xs font-mono text-pixel-text-muted ml-7">
                        Build not found at expected path
                      </p>
                    )}
                  </div>

                  {/* Windows Build */}
                  <div
                    className={`p-4 rounded border-2 cursor-pointer transition-all ${
                      buildStatus.windows?.exists
                        ? selectedPlatforms.has("windows")
                          ? "border-pixel-accent-cyan bg-pixel-accent-cyan/10"
                          : "border-pixel-text-muted/30 hover:border-pixel-accent-cyan/50"
                        : "border-pixel-text-muted/20 bg-pixel-bg-secondary opacity-50 cursor-not-allowed"
                    }`}
                    onClick={() => buildStatus.windows?.exists && togglePlatform("windows")}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.has("windows")}
                        disabled={!buildStatus.windows?.exists}
                        onChange={() => togglePlatform("windows")}
                        className="w-4 h-4 accent-pixel-accent-cyan"
                      />
                      <span className="text-pixel-accent-cyan">
                        <PlatformIcon platform="windows" />
                      </span>
                      <span className="font-pixel text-pixel-2xs uppercase">Windows</span>
                      {buildStatus.windows?.exists ? (
                        <PixelBadge category="Security">Ready</PixelBadge>
                      ) : (
                        <PixelBadge category="Bugfix">Not Found</PixelBadge>
                      )}
                    </div>
                    {buildStatus.windows?.exists && (
                      <div className="text-xs font-mono text-pixel-text-muted space-y-1 ml-7">
                        <p>Size: {buildStatus.windows.sizeFormatted}</p>
                        <p>Files: {buildStatus.windows.fileCount}</p>
                        {buildStatus.windows.exeName && <p>Exe: {buildStatus.windows.exeName}</p>}
                        {buildStatus.windows.lastModified && (
                          <p className="text-pixel-accent-cyan">
                            Built: {formatDateTime(buildStatus.windows.lastModified)}
                          </p>
                        )}
                      </div>
                    )}
                    {!buildStatus.windows?.exists && (
                      <p className="text-xs font-mono text-pixel-text-muted ml-7">
                        Build not found at expected path
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publishChangelog}
                    onChange={(e) => setPublishChangelog(e.target.checked)}
                    className="w-4 h-4 accent-pixel-accent-yellow"
                  />
                  <span className="font-mono text-sm text-pixel-text-secondary">
                    Publish changelog
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifySubscribers}
                    onChange={(e) => setNotifySubscribers(e.target.checked)}
                    className="w-4 h-4 accent-pixel-accent-pink"
                  />
                  <span className="font-mono text-sm text-pixel-text-secondary">
                    Notify subscribers
                  </span>
                </label>
              </div>

              {/* Deploy Button */}
              <div className="flex items-center gap-4">
                <PixelButton
                  onClick={handleDeploy}
                  disabled={
                    isDeploying ||
                    selectedPlatforms.size === 0 ||
                    (!buildStatus.mac?.exists && !buildStatus.windows?.exists)
                  }
                  className="min-w-[200px]"
                >
                  {isDeploying ? (
                    <span className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      Deploying...
                    </span>
                  ) : (
                    `Deploy ${Array.from(selectedPlatforms).join(" + ").toUpperCase() || "Select Platform"}`
                  )}
                </PixelButton>
                {selectedPlatforms.size === 0 && (
                  <span className="font-mono text-xs text-pixel-accent-red">
                    Select at least one platform
                  </span>
                )}
              </div>

              {/* Deploy Output Terminal */}
              {deployOutput && (
                <div className="bg-pixel-bg-primary border border-pixel-text-muted/20 rounded">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-pixel-text-muted/20">
                    <span className="font-pixel text-pixel-2xs text-pixel-text-muted">
                      DEPLOYMENT OUTPUT
                    </span>
                    <PixelButton
                      size="sm"
                      variant="secondary"
                      onClick={() => setDeployOutput("")}
                    >
                      Clear
                    </PixelButton>
                  </div>
                  <pre className="p-4 font-mono text-xs text-pixel-accent-green whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                    {deployOutput}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="font-mono text-pixel-text-muted">
                Failed to load build status.
              </p>
              <PixelButton
                variant="secondary"
                size="sm"
                onClick={fetchBuildStatus}
                className="mt-4"
              >
                Retry
              </PixelButton>
            </div>
          )}
        </PixelCard>
      )}

      {/* Recent Deployments - Collapsible */}
      <div className="mb-4">
        <button
          onClick={() => setShowRecentDeployments(!showRecentDeployments)}
          className="flex items-center gap-2 font-pixel text-pixel-xs text-pixel-text-primary uppercase hover:text-pixel-accent-cyan transition-colors"
        >
          <span className={`transition-transform ${showRecentDeployments ? "rotate-90" : ""}`}>▶</span>
          Recent Deployments
          {stats?.recentDeployments && stats.recentDeployments.length > 0 && (
            <span className="font-mono text-pixel-text-muted">({stats.recentDeployments.length})</span>
          )}
        </button>
      </div>
      {showRecentDeployments && <div className="space-y-4">
        {!stats?.recentDeployments || stats.recentDeployments.length === 0 ? (
          <PixelCard className="text-center">
            <p className="text-pixel-text-muted font-mono py-4">
              No deployments recorded yet.
            </p>
            <p className="text-pixel-text-muted font-mono text-sm">
              Run <code className="text-pixel-accent-green">./distribute_itch.sh</code> to deploy and track.
            </p>
          </PixelCard>
        ) : (
          <>
            {stats.recentDeployments.slice(0, displayLimit).map((deployment) => {
              const changelog = deployment.changelog_id
                ? changelogs[deployment.changelog_id]
                : null;

              return (
                <PixelCard key={deployment.id} variant="outlined">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Main Info */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Tag/Version */}
                      <span className="font-pixel text-pixel-xs text-pixel-accent-green">
                        v{deployment.version}
                      </span>

                      {/* Status */}
                      <PixelBadge
                        category={
                          deployment.status === "completed"
                            ? "Feature"
                            : deployment.status === "failed"
                            ? "Bugfix"
                            : "Improvement"
                        }
                      >
                        {deployment.status}
                      </PixelBadge>

                      {/* Platforms */}
                      <span className="flex items-center gap-1">
                        {deployment.platforms?.map((p) => (
                          <span
                            key={p}
                            className={`${
                              p === "mac"
                                ? "text-pixel-accent-green"
                                : "text-pixel-accent-cyan"
                            }`}
                            title={p === "mac" ? "macOS" : "Windows"}
                          >
                            <PlatformIcon platform={p} />
                          </span>
                        ))}
                      </span>

                      {/* Date */}
                      <span className="font-mono text-xs text-pixel-text-muted">
                        {formatDateTime(deployment.deployed_at)}
                      </span>

                      {/* Changelog */}
                      {changelog && (
                        <a
                          href="/admin/changelog"
                          className="font-mono text-xs text-pixel-accent-yellow hover:text-pixel-accent-yellow/80"
                        >
                          📋 {changelog.title}
                        </a>
                      )}
                    </div>

                    {/* Delete Button */}
                    <PixelButton
                      size="sm"
                      variant="danger"
                      onClick={() => setConfirmDelete(deployment.id)}
                    >
                      Delete
                    </PixelButton>
                  </div>
                </PixelCard>
              );
            })}

            {/* Load More Button */}
            {stats.recentDeployments.length > displayLimit && (
              <div className="text-center pt-4">
                <PixelButton
                  variant="secondary"
                  onClick={() => setDisplayLimit((prev) => prev + 5)}
                >
                  Load More ({stats.recentDeployments.length - displayLimit} remaining)
                </PixelButton>
              </div>
            )}

            {/* Show Less Button */}
            {displayLimit > 5 && displayLimit >= stats.recentDeployments.length && (
              <div className="text-center pt-2">
                <PixelButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setDisplayLimit(5)}
                >
                  Show Less
                </PixelButton>
              </div>
            )}
          </>
        )}
      </div>}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        title="Delete Deployment"
        message="Are you sure you want to delete this deployment record? This only removes the tracking record, not the actual build on itch.io."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
