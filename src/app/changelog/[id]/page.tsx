"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  PixelCard,
  PixelBadge,
  LoadingSpinner,
  ChangelogContent,
  BackButton,
  useToast,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { Changelog } from "@/types";

export default function ChangelogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [changelog, setChangelog] = useState<Changelog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChangelog() {
      try {
        const response = await fetch(`/api/changelog/${params.id}`);

        if (!response.ok) {
          if (response.status === 404) {
            showToast("Changelog not found", "error");
            router.push("/#changelog");
            return;
          }
          throw new Error("Failed to fetch changelog");
        }

        const { data } = await response.json();
        setChangelog(data);
      } catch (error) {
        console.error("Error fetching changelog:", error);
        showToast("Failed to load changelog details", "error");
        router.push("/#changelog");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      fetchChangelog();
    }
  }, [params.id, router, showToast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-pixel-bg-primary flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!changelog) {
    return null;
  }

  return (
    <div className="min-h-screen bg-pixel-bg-primary py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-8">
          <BackButton fallbackHref="/#changelog" label="Back" size="sm" />
        </div>

        {/* Changelog Card */}
        <PixelCard variant="outlined" className="relative overflow-hidden">
          {/* Version Badge */}
          <div className="absolute top-0 right-0 bg-pixel-accent-green text-pixel-bg-primary font-pixel text-pixel-xs px-4 py-2">
            v{changelog.version}
          </div>

          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 flex-wrap">
              <PixelBadge category={changelog.category}>
                {changelog.category}
              </PixelBadge>
              <span className="font-mono text-sm text-pixel-text-muted">
                {formatDate(changelog.release_date)}
              </span>
            </div>

            {/* Title */}
            <div className="border-l-4 border-pixel-accent-green pl-4">
              <h1 className="font-pixel text-pixel-sm text-pixel-text-primary uppercase">
                {changelog.title}
              </h1>
            </div>

            {/* Full Content - NO TRUNCATION */}
            <div className="border-t-2 border-pixel-text-muted pt-6">
              <ChangelogContent content={changelog.content} />
            </div>
          </div>
        </PixelCard>

        {/* Back Button (Bottom) */}
        <div className="mt-8 text-center">
          <BackButton fallbackHref="/#changelog" label="Back" />
        </div>
      </div>
    </div>
  );
}
