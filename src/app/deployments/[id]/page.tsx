import Link from "next/link";
import { notFound } from "next/navigation";
import {
  PixelCard,
  PixelBadge,
  PixelButton,
  PlatformIcon,
  ChangelogContent,
  BackButton,
} from "@/components/ui";
import { formatDateTime, formatDate } from "@/lib/utils";
import { supabaseServer } from "@/lib/supabase/server";
import type { Deployment, Changelog } from "@/types";

// Force dynamic rendering to always fetch fresh data
export const dynamic = "force-dynamic";

interface DeploymentDetailPageProps {
  params: { id: string };
}

interface DeploymentWithChangelog extends Omit<Deployment, "changelog"> {
  changelog?: Changelog | null;
}

async function getDeployment(id: string): Promise<DeploymentWithChangelog | null> {
  const { data, error } = await supabaseServer
    .from("deployments")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  // If deployment has a changelog_id, fetch the changelog too
  let changelog: Changelog | null = null;
  if (data.changelog_id) {
    const { data: changelogData } = await supabaseServer
      .from("changelog")
      .select("*")
      .eq("id", data.changelog_id)
      .single();
    changelog = changelogData;
  }

  return {
    ...data,
    changelog,
  };
}

export default async function DeploymentDetailPage({
  params,
}: DeploymentDetailPageProps) {
  const deployment = await getDeployment(params.id);

  if (!deployment) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-pixel-bg-primary">
      {/* Header */}
      <div className="bg-pixel-bg-secondary border-b-2 border-pixel-accent-cyan">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-4">
            <BackButton
              fallbackHref="/deployments"
              label="Back"
              size="sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <h1 className="font-pixel text-pixel-md text-pixel-text-primary uppercase">
              v{deployment.version}
            </h1>
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

          <p className="font-mono text-pixel-text-secondary mt-2">
            Deployed on {formatDateTime(deployment.deployed_at)}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Deployment Info */}
          <PixelCard>
            <h2 className="font-pixel text-pixel-xs text-pixel-accent-cyan uppercase mb-4">
              Deployment Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Version */}
              <div>
                <p className="font-mono text-xs text-pixel-text-muted mb-1">Version</p>
                <p className="font-pixel text-pixel-xs text-pixel-accent-green">
                  v{deployment.version}
                </p>
              </div>

              {/* Status */}
              <div>
                <p className="font-mono text-xs text-pixel-text-muted mb-1">Status</p>
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

              {/* Platforms */}
              <div>
                <p className="font-mono text-xs text-pixel-text-muted mb-1">Platforms</p>
                <div className="flex items-center gap-3">
                  {deployment.platforms?.map((p) => (
                    <span
                      key={p}
                      className={`flex items-center gap-1 ${
                        p === "mac" ? "text-pixel-accent-green" : "text-pixel-accent-cyan"
                      }`}
                    >
                      <PlatformIcon platform={p} />
                      <span className="font-mono text-sm">
                        {p === "mac" ? "macOS" : "Windows"}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Deploy Date */}
              <div>
                <p className="font-mono text-xs text-pixel-text-muted mb-1">Deployed At</p>
                <p className="font-mono text-sm text-pixel-text-primary">
                  {formatDateTime(deployment.deployed_at)}
                </p>
              </div>

              {/* Channels */}
              {deployment.itch_channels && deployment.itch_channels.length > 0 && (
                <div>
                  <p className="font-mono text-xs text-pixel-text-muted mb-1">Channels</p>
                  <div className="flex flex-wrap gap-2">
                    {deployment.itch_channels.map((channel) => (
                      <PixelBadge key={channel} category="Security">
                        {channel}
                      </PixelBadge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PixelCard>

          {/* Build Info */}
          {deployment.build_info && (
            <PixelCard>
              <h2 className="font-pixel text-pixel-xs text-pixel-accent-yellow uppercase mb-4">
                Build Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mac Build */}
                {deployment.build_info.mac && (
                  <div className="p-4 bg-pixel-bg-secondary rounded border border-pixel-accent-green/30">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-pixel-accent-green">
                        <PlatformIcon platform="mac" />
                      </span>
                      <span className="font-pixel text-pixel-2xs text-pixel-accent-green uppercase">
                        macOS Build
                      </span>
                    </div>
                    <div className="space-y-2 text-xs font-mono text-pixel-text-secondary">
                      {deployment.build_info.mac.sizeFormatted &&
                       /\d/.test(deployment.build_info.mac.sizeFormatted) && (
                        <p>
                          <span className="text-pixel-text-muted">Size:</span>{" "}
                          {deployment.build_info.mac.sizeFormatted}
                        </p>
                      )}
                      {deployment.build_info.mac.fileCount && (
                        <p>
                          <span className="text-pixel-text-muted">Files:</span>{" "}
                          {deployment.build_info.mac.fileCount}
                        </p>
                      )}
                      {deployment.build_info.mac.appName && (
                        <p>
                          <span className="text-pixel-text-muted">App:</span>{" "}
                          {deployment.build_info.mac.appName}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Windows Build */}
                {deployment.build_info.windows && (
                  <div className="p-4 bg-pixel-bg-secondary rounded border border-pixel-accent-cyan/30">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-pixel-accent-cyan">
                        <PlatformIcon platform="windows" />
                      </span>
                      <span className="font-pixel text-pixel-2xs text-pixel-accent-cyan uppercase">
                        Windows Build
                      </span>
                    </div>
                    <div className="space-y-2 text-xs font-mono text-pixel-text-secondary">
                      {deployment.build_info.windows.sizeFormatted &&
                       /\d/.test(deployment.build_info.windows.sizeFormatted) && (
                        <p>
                          <span className="text-pixel-text-muted">Size:</span>{" "}
                          {deployment.build_info.windows.sizeFormatted}
                        </p>
                      )}
                      {deployment.build_info.windows.fileCount && (
                        <p>
                          <span className="text-pixel-text-muted">Files:</span>{" "}
                          {deployment.build_info.windows.fileCount}
                        </p>
                      )}
                      {deployment.build_info.windows.exeName && (
                        <p>
                          <span className="text-pixel-text-muted">Exe:</span>{" "}
                          {deployment.build_info.windows.exeName}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </PixelCard>
          )}

          {/* Associated Changelog */}
          {deployment.changelog && (
            <PixelCard>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-pixel text-pixel-xs text-pixel-accent-pink uppercase">
                  Release Notes
                </h2>
                <Link href={`/changelog/${deployment.changelog.id}`}>
                  <PixelButton variant="secondary" size="sm">
                    View Full Changelog
                  </PixelButton>
                </Link>
              </div>

              <div className="mb-4">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <PixelBadge category={deployment.changelog.category}>
                    {deployment.changelog.category}
                  </PixelBadge>
                  <span className="font-mono text-pixel-text-muted text-sm">
                    {formatDate(deployment.changelog.release_date)}
                  </span>
                </div>
                <h3 className="font-pixel text-pixel-xs text-pixel-text-primary uppercase mb-3">
                  {deployment.changelog.title}
                </h3>
              </div>

              <ChangelogContent
                content={deployment.changelog.content}
                truncate={true}
                maxLines={10}
              />
            </PixelCard>
          )}

          {/* Navigation */}
          <div className="flex justify-center">
            <BackButton fallbackHref="/deployments" label="Back" />
          </div>
        </div>
      </div>
    </div>
  );
}
