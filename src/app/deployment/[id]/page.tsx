"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  PixelButton,
  PixelCard,
  PixelBadge,
  LoadingSpinner,
  PlatformIcon,
  ChangelogContent,
  useToast,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { Deployment, Changelog, ChangelogCategory } from "@/types";

// Extend Deployment with full changelog data
type DeploymentWithChangelog = Omit<Deployment, "changelog"> & {
  changelog?: Changelog | null;
};

export default function DeploymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [deployment, setDeployment] = useState<DeploymentWithChangelog | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeployment() {
      try {
        const response = await fetch(`/api/deployment/${params.id}`);

        if (!response.ok) {
          if (response.status === 404) {
            showToast("Deployment not found", "error");
            router.push("/");
            return;
          }
          throw new Error("Failed to fetch deployment");
        }

        const { data } = await response.json();
        setDeployment(data);
      } catch (error) {
        console.error("Error fetching deployment:", error);
        showToast("Failed to load deployment details", "error");
        router.push("/");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchDeployment();
    }
  }, [params.id, router, showToast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-pixel-bg-primary flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!deployment) {
    return null;
  }

  const changelog = deployment.changelog;

  return (
    <div className="min-h-screen bg-pixel-bg-primary py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-8">
          <Link href="/">
            <PixelButton variant="secondary" size="sm">
              ← Back to Home
            </PixelButton>
          </Link>
        </div>

        {/* Deployment Header */}
        <PixelCard variant="outlined" className="mb-6">
          <div className="space-y-4">
            {/* Version and Status */}
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="font-pixel text-pixel-md text-pixel-accent-green">
                v{deployment.version}
              </h1>
              <PixelBadge
                category={
                  deployment.status === "completed" ? "Feature" : "Bugfix"
                }
              >
                {deployment.status}
              </PixelBadge>
            </div>

            {/* Deployment Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t-2 border-pixel-text-muted pt-4">
              {/* Platforms */}
              <div>
                <span className="font-pixel text-pixel-xs text-pixel-text-secondary uppercase block mb-2">
                  Platforms
                </span>
                <div className="flex items-center gap-2">
                  {deployment.platforms?.map((platform) => (
                    <div
                      key={platform}
                      className="flex items-center gap-2 bg-pixel-bg-secondary px-3 py-2 border-2 border-pixel-text-muted"
                    >
                      <PlatformIcon platform={platform} />
                      <span className="font-mono text-sm text-pixel-text-primary capitalize">
                        {platform}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deployed At */}
              <div>
                <span className="font-pixel text-pixel-xs text-pixel-text-secondary uppercase block mb-2">
                  Deployed
                </span>
                <span className="font-mono text-sm text-pixel-text-primary">
                  {formatDate(deployment.deployed_at)}
                </span>
              </div>

              {/* Commit Hash (if available) */}
              {deployment.commit_hash && (
                <div>
                  <span className="font-pixel text-pixel-xs text-pixel-text-secondary uppercase block mb-2">
                    Commit
                  </span>
                  <code className="font-mono text-sm text-pixel-accent-cyan">
                    {deployment.commit_hash.substring(0, 8)}
                  </code>
                </div>
              )}

              {/* Itch Channels (if available) */}
              {deployment.itch_channels && deployment.itch_channels.length > 0 && (
                <div>
                  <span className="font-pixel text-pixel-xs text-pixel-text-secondary uppercase block mb-2">
                    Channels
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {deployment.itch_channels.map((channel) => (
                      <span
                        key={channel}
                        className="font-mono text-xs text-pixel-text-muted bg-pixel-bg-secondary px-2 py-1 border border-pixel-text-muted"
                      >
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Build Info (if available) */}
            {deployment.build_info &&
              (deployment.build_info.mac || deployment.build_info.windows) && (
                <div className="border-t-2 border-pixel-text-muted pt-4">
                  <span className="font-pixel text-pixel-xs text-pixel-text-secondary uppercase block mb-2">
                    Build Info
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {deployment.build_info.mac && (
                      <div className="bg-pixel-bg-secondary p-3 border border-pixel-text-muted">
                        <div className="flex items-center gap-2 mb-1">
                          <PlatformIcon platform="mac" />
                          <span className="font-mono text-xs text-pixel-text-secondary">
                            macOS
                          </span>
                        </div>
                        <span className="font-mono text-sm text-pixel-text-primary">
                          {deployment.build_info.mac.sizeFormatted ||
                            `${deployment.build_info.mac.size} bytes`}
                        </span>
                      </div>
                    )}
                    {deployment.build_info.windows && (
                      <div className="bg-pixel-bg-secondary p-3 border border-pixel-text-muted">
                        <div className="flex items-center gap-2 mb-1">
                          <PlatformIcon platform="windows" />
                          <span className="font-mono text-xs text-pixel-text-secondary">
                            Windows
                          </span>
                        </div>
                        <span className="font-mono text-sm text-pixel-text-primary">
                          {deployment.build_info.windows.sizeFormatted ||
                            `${deployment.build_info.windows.size} bytes`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        </PixelCard>

        {/* Changelog Section */}
        {changelog ? (
          <PixelCard variant="outlined">
            <div className="space-y-4">
              {/* Changelog Header */}
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="font-pixel text-pixel-sm text-pixel-text-primary uppercase">
                  Changelog
                </h2>
                <PixelBadge category={changelog.category as ChangelogCategory}>
                  {changelog.category}
                </PixelBadge>
                {!changelog.is_published && (
                  <span className="font-mono text-xs text-pixel-accent-yellow">
                    [Draft]
                  </span>
                )}
              </div>

              {/* Changelog Title */}
              <div className="border-l-4 border-pixel-accent-green pl-4">
                <h3 className="font-pixel text-pixel-xs text-pixel-text-primary uppercase mb-2">
                  {changelog.title}
                </h3>
                <span className="font-mono text-xs text-pixel-text-muted">
                  Released: {formatDate(changelog.release_date)}
                </span>
              </div>

              {/* Full Changelog Content - NO TRUNCATION */}
              <div className="border-t-2 border-pixel-text-muted pt-4">
                <ChangelogContent content={changelog.content} />
              </div>
            </div>
          </PixelCard>
        ) : (
          <PixelCard variant="outlined">
            <div className="text-center py-8">
              <p className="font-mono text-sm text-pixel-text-muted italic">
                No changelog associated with this deployment
              </p>
            </div>
          </PixelCard>
        )}

        {/* Back Button (Bottom) */}
        <div className="mt-8 text-center">
          <Link href="/">
            <PixelButton variant="secondary">← Back to Home</PixelButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
