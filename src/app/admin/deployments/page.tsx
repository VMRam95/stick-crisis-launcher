"use client";

import { useEffect, useState } from "react";
import {
  PixelCard,
  PixelBadge,
  LoadingSpinner,
  ConfirmModal,
  PixelButton,
  useToast,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { Deployment, DeploymentPlatform } from "@/types";

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

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function PlatformIcon({ platform }: { platform: DeploymentPlatform }) {
  if (platform === "mac") {
    return (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    );
  }
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 12V6.75l6-1.32v6.48L3 12zm.39 1.25l5.96-.09l-.03 6.36l-5.93-1.32v-4.95zM10 5.27l8-1.77v8.32l-8 .18V5.27zm.13 7.18l7.87-.09v8.32l-7.87-1.32v-6.91z" />
    </svg>
  );
}

export default function AdminDeploymentsPage() {
  const [stats, setStats] = useState<DeploymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

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
      </div>

      {/* Current Version Card */}
      <PixelCard className="mb-8 bg-gradient-to-r from-pixel-bg-secondary to-pixel-bg-card border-pixel-accent-green">
        <div className="text-center py-4">
          <p className="font-mono text-pixel-text-muted text-sm mb-2">
            Current Version
          </p>
          <h2 className="font-pixel text-pixel-lg text-pixel-accent-green">
            {stats?.latestVersion || "No deployments"}
          </h2>
          {stats?.lastDeployedAt && (
            <p className="font-mono text-pixel-text-muted text-sm mt-2">
              Deployed {formatDate(stats.lastDeployedAt)}
            </p>
          )}
        </div>
      </PixelCard>

      {/* Platform Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Mac Platform */}
        <PixelCard variant="outlined">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded ${
                stats?.latestPlatforms?.includes("mac")
                  ? "bg-pixel-accent-green/20 text-pixel-accent-green"
                  : "bg-pixel-bg-secondary text-pixel-text-muted"
              }`}
            >
              <PlatformIcon platform="mac" />
            </div>
            <div className="flex-1">
              <h3 className="font-pixel text-pixel-xs text-pixel-text-primary uppercase">
                macOS
              </h3>
              <p className="font-mono text-sm text-pixel-text-muted">
                {stats?.latestPlatforms?.includes("mac") ? (
                  <>
                    <span className="text-pixel-accent-green">Deployed</span>
                    {stats?.latestBuildInfo?.mac?.size && (
                      <span className="ml-2">
                        ({formatBytes(stats.latestBuildInfo.mac.size)})
                      </span>
                    )}
                  </>
                ) : (
                  "Not deployed"
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm text-pixel-text-muted">
                Total: {stats?.platformCounts?.mac || 0}
              </p>
            </div>
          </div>
        </PixelCard>

        {/* Windows Platform */}
        <PixelCard variant="outlined">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded ${
                stats?.latestPlatforms?.includes("windows")
                  ? "bg-pixel-accent-cyan/20 text-pixel-accent-cyan"
                  : "bg-pixel-bg-secondary text-pixel-text-muted"
              }`}
            >
              <PlatformIcon platform="windows" />
            </div>
            <div className="flex-1">
              <h3 className="font-pixel text-pixel-xs text-pixel-text-primary uppercase">
                Windows
              </h3>
              <p className="font-mono text-sm text-pixel-text-muted">
                {stats?.latestPlatforms?.includes("windows") ? (
                  <>
                    <span className="text-pixel-accent-cyan">Deployed</span>
                    {stats?.latestBuildInfo?.windows?.size && (
                      <span className="ml-2">
                        ({formatBytes(stats.latestBuildInfo.windows.size)})
                      </span>
                    )}
                  </>
                ) : (
                  "Not deployed"
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm text-pixel-text-muted">
                Total: {stats?.platformCounts?.windows || 0}
              </p>
            </div>
          </div>
        </PixelCard>
      </div>

      {/* itch.io Channels */}
      {stats?.latestChannels && stats.latestChannels.length > 0 && (
        <PixelCard variant="outlined" className="mb-8">
          <h3 className="font-pixel text-pixel-xs text-pixel-text-primary uppercase mb-4">
            itch.io Channels
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.latestChannels.map((channel) => (
              <PixelBadge key={channel} category="Feature">
                {channel}
              </PixelBadge>
            ))}
          </div>
        </PixelCard>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <PixelCard className="text-center">
          <p className="font-mono text-pixel-text-muted text-xs mb-1">
            Total Deployments
          </p>
          <p className="font-pixel text-pixel-md text-pixel-accent-yellow">
            {stats?.totalDeployments || 0}
          </p>
        </PixelCard>
        <PixelCard className="text-center">
          <p className="font-mono text-pixel-text-muted text-xs mb-1">
            Mac Builds
          </p>
          <p className="font-pixel text-pixel-md text-pixel-accent-green">
            {stats?.platformCounts?.mac || 0}
          </p>
        </PixelCard>
        <PixelCard className="text-center">
          <p className="font-mono text-pixel-text-muted text-xs mb-1">
            Windows Builds
          </p>
          <p className="font-pixel text-pixel-md text-pixel-accent-cyan">
            {stats?.platformCounts?.windows || 0}
          </p>
        </PixelCard>
        <PixelCard className="text-center">
          <p className="font-mono text-pixel-text-muted text-xs mb-1">
            Latest Channel
          </p>
          <p className="font-pixel text-pixel-xs text-pixel-accent-pink truncate">
            {stats?.latestChannels?.[0] || "N/A"}
          </p>
        </PixelCard>
      </div>

      {/* Recent Deployments */}
      <h2 className="font-pixel text-pixel-xs text-pixel-text-primary uppercase mb-4">
        Recent Deployments
      </h2>
      <div className="space-y-4">
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
          stats.recentDeployments.map((deployment) => (
            <PixelCard key={deployment.id} variant="outlined">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-pixel text-pixel-xs text-pixel-accent-green">
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
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-mono text-pixel-text-muted">
                      {formatDate(deployment.deployed_at)}
                    </span>
                    <span className="flex items-center gap-2">
                      {deployment.platforms?.map((p) => (
                        <span
                          key={p}
                          className={`${
                            p === "mac"
                              ? "text-pixel-accent-green"
                              : "text-pixel-accent-cyan"
                          }`}
                        >
                          <PlatformIcon platform={p} />
                        </span>
                      ))}
                    </span>
                  </div>
                  {deployment.commit_message && (
                    <p className="font-mono text-xs text-pixel-text-muted mt-2 truncate">
                      {deployment.commit_message}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <PixelButton
                    size="sm"
                    variant="danger"
                    onClick={() => setConfirmDelete(deployment.id)}
                  >
                    Delete
                  </PixelButton>
                </div>
              </div>
            </PixelCard>
          ))
        )}
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
