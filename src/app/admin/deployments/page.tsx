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
      <h1 className="font-pixel text-pixel-sm text-pixel-text-primary uppercase mb-6">
        Deployments
      </h1>

      {/* New Deployment Section - Always Visible & Compact */}
      <PixelCard className="mb-6 border-pixel-accent-yellow p-4">
        <div className="max-w-xl mx-auto">
          <h2 className="font-pixel text-pixel-2xs text-pixel-accent-yellow uppercase mb-3 text-center">
            New Deployment
          </h2>

        {/* Show message when running on Vercel */}
        {buildStatus && buildStatus.isLocal === false ? (
          <div className="bg-pixel-bg-secondary p-4 rounded border border-pixel-accent-yellow/30">
            <div className="text-center space-y-3">
              <div className="text-2xl">🚀</div>
              <h3 className="font-pixel text-pixel-2xs text-pixel-accent-yellow uppercase">
                Local Environment Required
              </h3>
              <p className="font-mono text-xs text-pixel-text-secondary max-w-md mx-auto">
                Deployment requires local build files and butler CLI.
              </p>
              <div className="bg-pixel-bg-primary p-3 rounded border border-pixel-text-muted/20 max-w-lg mx-auto">
                <code className="font-mono text-xs text-pixel-accent-green">
                  cd stick-crisis && ./distribute_itch.sh
                </code>
              </div>
            </div>
          </div>
        ) : buildStatusLoading && !buildStatus ? (
          <div className="flex justify-center py-4">
            <LoadingSpinner size="sm" />
          </div>
        ) : buildStatus ? (
          <div className="space-y-4">
            {/* Pending Changes Section - Compact */}
            {buildStatus.hasNewCommits && buildStatus.pendingChanges && (
              <div className="bg-pixel-accent-yellow/10 p-3 rounded border border-pixel-accent-yellow">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-pixel-2xs text-pixel-accent-yellow uppercase">
                      {buildStatus.pendingChanges.totalCommits} Commits
                    </span>
                    <PixelBadge category="Improvement">
                      {buildStatus.pendingChanges.suggestedBump.toUpperCase()}
                    </PixelBadge>
                  </div>
                  <span className="font-pixel text-pixel-xs text-pixel-accent-green">
                    → v{buildStatus.pendingChanges.suggestedVersion}
                  </span>
                </div>

                {/* Change Summary - Inline */}
                <div className="flex gap-4 text-xs font-mono mb-2">
                  <span className="text-pixel-accent-green">
                    +{buildStatus.pendingChanges.features.length} feat
                  </span>
                  <span className="text-pixel-accent-red">
                    ~{buildStatus.pendingChanges.fixes.length} fix
                  </span>
                  <span className="text-pixel-accent-cyan">
                    ↑{buildStatus.pendingChanges.improvements.length} improve
                  </span>
                  <span className="text-pixel-text-muted">
                    •{buildStatus.pendingChanges.other.length} other
                  </span>
                </div>

                {/* Generated Changelog Preview */}
                <details className="group">
                  <summary className="cursor-pointer font-mono text-xs text-pixel-accent-yellow hover:text-pixel-accent-yellow/80 flex items-center gap-1">
                    <span className="group-open:rotate-90 transition-transform text-[10px]">▶</span>
                    Preview
                  </summary>
                  <div className="mt-2 bg-pixel-bg-primary p-3 rounded border border-pixel-text-muted/20 max-h-[200px] overflow-y-auto">
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
              <div className="bg-pixel-bg-secondary p-2 rounded border border-pixel-text-muted/20">
                <p className="font-mono text-xs text-pixel-text-muted text-center">
                  ✓ Up to date with <span className="text-pixel-accent-green">{buildStatus.gitTag || "initial"}</span>
                </p>
              </div>
            )}

            {/* Version Info - Compact Inline */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono bg-pixel-bg-primary p-3 rounded border border-pixel-text-muted/20">
              <span>
                <span className="text-pixel-text-muted">Tag:</span>{" "}
                <span className={buildStatus.gitTag ? "text-pixel-accent-green" : "text-pixel-accent-yellow"}>
                  {buildStatus.gitTag || "none"}
                </span>
              </span>
              <span>
                <span className="text-pixel-text-muted">Commit:</span>{" "}
                <span className="text-pixel-accent-cyan">{buildStatus.latestCommitHash?.slice(0, 7) || "N/A"}</span>
              </span>
              {buildStatus.latestChangelog && (
                <span>
                  <span className="text-pixel-text-muted">DB:</span>{" "}
                  <span className="text-pixel-accent-cyan">v{buildStatus.latestChangelog.version}</span>
                  {!buildStatus.latestChangelog.is_published && (
                    <span className="text-pixel-accent-yellow ml-1">(draft)</span>
                  )}
                </span>
              )}
            </div>

            {/* Available Builds - Compact Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Mac Build */}
              <div
                className={`p-3 rounded border cursor-pointer transition-all ${
                  buildStatus.mac?.exists
                    ? selectedPlatforms.has("mac")
                      ? "border-pixel-accent-green bg-pixel-accent-green/10"
                      : "border-pixel-text-muted/30 hover:border-pixel-accent-green/50"
                    : "border-pixel-text-muted/20 bg-pixel-bg-secondary opacity-50 cursor-not-allowed"
                }`}
                onClick={() => buildStatus.mac?.exists && togglePlatform("mac")}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.has("mac")}
                    disabled={!buildStatus.mac?.exists}
                    onChange={() => togglePlatform("mac")}
                    className="w-3 h-3 accent-pixel-accent-green"
                  />
                  <span className="text-pixel-accent-green text-sm">
                    <PlatformIcon platform="mac" />
                  </span>
                  <span className="font-pixel text-pixel-2xs uppercase">Mac</span>
                  {buildStatus.mac?.exists && (
                    <span className="text-xs font-mono text-pixel-text-muted ml-auto">
                      {buildStatus.mac.sizeFormatted}
                    </span>
                  )}
                </div>
              </div>

              {/* Windows Build */}
              <div
                className={`p-3 rounded border cursor-pointer transition-all ${
                  buildStatus.windows?.exists
                    ? selectedPlatforms.has("windows")
                      ? "border-pixel-accent-cyan bg-pixel-accent-cyan/10"
                      : "border-pixel-text-muted/30 hover:border-pixel-accent-cyan/50"
                    : "border-pixel-text-muted/20 bg-pixel-bg-secondary opacity-50 cursor-not-allowed"
                }`}
                onClick={() => buildStatus.windows?.exists && togglePlatform("windows")}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.has("windows")}
                    disabled={!buildStatus.windows?.exists}
                    onChange={() => togglePlatform("windows")}
                    className="w-3 h-3 accent-pixel-accent-cyan"
                  />
                  <span className="text-pixel-accent-cyan text-sm">
                    <PlatformIcon platform="windows" />
                  </span>
                  <span className="font-pixel text-pixel-2xs uppercase">Win</span>
                  {buildStatus.windows?.exists && (
                    <span className="text-xs font-mono text-pixel-text-muted ml-auto">
                      {buildStatus.windows.sizeFormatted}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Options & Deploy - Compact Inline */}
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publishChangelog}
                  onChange={(e) => setPublishChangelog(e.target.checked)}
                  className="w-3 h-3 accent-pixel-accent-yellow"
                />
                <span className="font-mono text-xs text-pixel-text-secondary">Changelog</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifySubscribers}
                  onChange={(e) => setNotifySubscribers(e.target.checked)}
                  className="w-3 h-3 accent-pixel-accent-pink"
                />
                <span className="font-mono text-xs text-pixel-text-secondary">Notify</span>
              </label>
              <PixelButton
                onClick={handleDeploy}
                size="sm"
                disabled={
                  isDeploying ||
                  selectedPlatforms.size === 0 ||
                  (!buildStatus.mac?.exists && !buildStatus.windows?.exists)
                }
                className="ml-auto"
              >
                {isDeploying ? (
                  <span className="flex items-center gap-1">
                    <LoadingSpinner size="sm" />
                    ...
                  </span>
                ) : (
                  `Deploy ${Array.from(selectedPlatforms).join("+").toUpperCase() || "?"}`
                )}
              </PixelButton>
            </div>

            {/* Deploy Output Terminal */}
            {deployOutput && (
              <div className="bg-pixel-bg-primary border border-pixel-text-muted/20 rounded">
                <div className="flex items-center justify-between px-2 py-1 border-b border-pixel-text-muted/20">
                  <span className="font-mono text-[10px] text-pixel-text-muted uppercase">Output</span>
                  <button
                    onClick={() => setDeployOutput("")}
                    className="font-mono text-[10px] text-pixel-text-muted hover:text-pixel-accent-red"
                  >
                    ✕
                  </button>
                </div>
                <pre className="p-2 font-mono text-[11px] text-pixel-accent-green whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                  {deployOutput}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="font-mono text-xs text-pixel-text-muted">Failed to load.</p>
            <button onClick={fetchBuildStatus} className="font-mono text-xs text-pixel-accent-cyan mt-2">
              Retry
            </button>
          </div>
        )}
        </div>
      </PixelCard>

      {/* Recent Deployments - Always Visible, Limited to 3 */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-pixel text-pixel-2xs text-pixel-text-primary uppercase">
            Recent Deployments
            {stats?.recentDeployments && stats.recentDeployments.length > 0 && (
              <span className="font-mono text-pixel-text-muted ml-2">({stats.recentDeployments.length})</span>
            )}
          </h2>
        </div>

        <div className="space-y-3">
          {!stats?.recentDeployments || stats.recentDeployments.length === 0 ? (
            <PixelCard className="text-center py-4">
              <p className="text-pixel-text-muted font-mono text-sm">No deployments yet</p>
            </PixelCard>
          ) : (
            <>
              {stats.recentDeployments.slice(0, 3).map((deployment) => {
                const changelog = deployment.changelog_id
                  ? changelogs[deployment.changelog_id]
                  : null;

                return (
                  <PixelCard key={deployment.id} variant="outlined" className="p-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {/* Main Info - Compact */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-pixel text-pixel-2xs text-pixel-accent-green">
                          v{deployment.version}
                        </span>
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
                        <span className="flex items-center gap-0.5">
                          {deployment.platforms?.map((p) => (
                            <span
                              key={p}
                              className={`text-sm ${
                                p === "mac" ? "text-pixel-accent-green" : "text-pixel-accent-cyan"
                              }`}
                            >
                              <PlatformIcon platform={p} />
                            </span>
                          ))}
                        </span>
                        <span className="font-mono text-xs text-pixel-text-muted">
                          {formatDateTime(deployment.deployed_at)}
                        </span>
                        {changelog && (
                          <span className="font-mono text-xs text-pixel-accent-yellow">
                            📋 {changelog.title}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <a
                          href={`/deployments/${deployment.id}`}
                          className="font-mono text-xs text-pixel-accent-cyan hover:text-pixel-accent-cyan/80"
                        >
                          View
                        </a>
                        <button
                          onClick={() => setConfirmDelete(deployment.id)}
                          className="font-mono text-xs text-pixel-accent-red hover:text-pixel-accent-red/80"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </PixelCard>
                );
              })}

              {/* View All Link */}
              {stats.recentDeployments.length > 3 && (
                <div className="text-center pt-2">
                  <a
                    href="/deployments"
                    className="inline-flex items-center gap-2 font-mono text-sm text-pixel-accent-cyan hover:text-pixel-accent-green transition-colors"
                  >
                    View All Deployments
                    <span>→</span>
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
