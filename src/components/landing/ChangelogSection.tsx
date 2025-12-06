"use client";

import { useEffect, useState } from "react";
import { PixelCard, PixelBadge, LoadingSpinner } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { Changelog } from "@/types";

export function ChangelogSection() {
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchChangelogs() {
      try {
        const response = await fetch("/api/changelog");
        if (!response.ok) {
          throw new Error("Failed to fetch changelog");
        }
        const data = await response.json();
        setChangelogs(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchChangelogs();
  }, []);

  return (
    <section id="changelog" className="py-20 bg-pixel-bg-primary">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="font-pixel text-pixel-xs text-pixel-accent-yellow uppercase tracking-wider">
            {"// Changelog"}
          </span>
          <h2 className="font-pixel text-pixel-sm md:text-pixel-md text-pixel-text-primary mt-4 uppercase">
            Latest Updates
          </h2>
          <p className="font-mono text-pixel-text-secondary mt-4 max-w-xl mx-auto">
            Stay up to date with the latest features, improvements, and bug
            fixes.
          </p>
        </div>

        {/* Changelog List */}
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <PixelCard className="text-center">
              <p className="text-pixel-accent-red font-mono">{error}</p>
            </PixelCard>
          ) : changelogs.length === 0 ? (
            <PixelCard className="text-center">
              <p className="text-pixel-text-muted font-mono">
                No updates yet. Check back soon!
              </p>
            </PixelCard>
          ) : (
            <div className="space-y-6">
              {changelogs.map((changelog) => (
                <PixelCard
                  key={changelog.id}
                  variant="outlined"
                  className="relative overflow-hidden"
                >
                  {/* Version Badge */}
                  <div className="absolute top-0 right-0 bg-pixel-accent-green text-pixel-bg-primary font-pixel text-pixel-xs px-3 py-1">
                    v{changelog.version}
                  </div>

                  {/* Header */}
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <PixelBadge category={changelog.category}>
                      {changelog.category}
                    </PixelBadge>
                    <span className="font-mono text-pixel-text-muted text-sm">
                      {formatDate(changelog.release_date)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-pixel text-pixel-xs text-pixel-text-primary uppercase mb-3">
                    {changelog.title}
                  </h3>

                  {/* Content */}
                  <p className="font-mono text-pixel-text-secondary text-sm leading-relaxed">
                    {changelog.content}
                  </p>
                </PixelCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
