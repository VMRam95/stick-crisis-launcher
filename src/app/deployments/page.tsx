import Link from "next/link";
import {
  PixelCard,
  PixelBadge,
  PixelButton,
  PlatformIcon,
} from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { supabaseServer } from "@/lib/supabase/server";
import type { Deployment } from "@/types";

// Force dynamic rendering to always fetch fresh data
export const dynamic = "force-dynamic";

interface DeploymentsPageProps {
  searchParams: { page?: string };
}

interface PaginatedResult {
  data: Deployment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

async function getDeployments(page: number): Promise<PaginatedResult> {
  const limit = 10;
  const offset = (page - 1) * limit;

  // Get total count
  const { count } = await supabaseServer
    .from("deployments")
    .select("*", { count: "exact", head: true });

  // Get paginated data - sorted by deployed_at DESC
  const { data, error } = await supabaseServer
    .from("deployments")
    .select("*")
    .order("deployed_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching deployments:", error);
    return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit);

  return {
    data: data || [],
    total,
    page,
    limit,
    totalPages,
  };
}

export default async function DeploymentsPage({
  searchParams,
}: DeploymentsPageProps) {
  const currentPage = parseInt(searchParams.page || "1", 10);
  const { data: deployments, page, totalPages, total } = await getDeployments(currentPage);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (page > 3) {
        pages.push("...");
      }
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) {
        pages.push("...");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="min-h-screen bg-pixel-bg-primary">
      {/* Header */}
      <div className="bg-pixel-bg-secondary border-b-2 border-pixel-accent-cyan">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-mono text-pixel-accent-cyan hover:text-pixel-accent-green transition-colors duration-200 mb-4"
              >
                <span>←</span>
                <span>Back to Home</span>
              </Link>
              <h1 className="font-pixel text-pixel-md text-pixel-text-primary uppercase">
                All Deployments
              </h1>
              <p className="font-mono text-pixel-text-secondary mt-2">
                Complete history of game releases and builds
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Deployment List */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {deployments.length === 0 ? (
            <PixelCard className="text-center">
              <p className="text-pixel-text-muted font-mono">
                No deployments found.
              </p>
            </PixelCard>
          ) : (
            <>
              <div className="space-y-4 mb-8">
                {deployments.map((deployment) => (
                  <Link
                    key={deployment.id}
                    href={`/deployments/${deployment.id}`}
                    className="block group"
                  >
                    <PixelCard
                      variant="outlined"
                      className="relative overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:border-pixel-accent-cyan"
                    >
                      {/* Version Badge */}
                      <div className="absolute top-0 right-0 bg-pixel-accent-green text-pixel-bg-primary font-pixel text-pixel-xs px-3 py-1">
                        v{deployment.version}
                      </div>

                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        {/* Status Badge */}
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
                        <span className="font-mono text-pixel-text-muted text-sm">
                          {formatDateTime(deployment.deployed_at)}
                        </span>
                      </div>

                      {/* Build Info - only show if sizeFormatted contains actual numeric size data */}
                      {deployment.build_info && (
                        <div className="flex flex-wrap gap-4 text-xs font-mono text-pixel-text-muted">
                          {deployment.build_info.mac?.sizeFormatted &&
                           /\d/.test(deployment.build_info.mac.sizeFormatted) && (
                            <span className="flex items-center gap-1">
                              <span className="text-pixel-accent-green">
                                <PlatformIcon platform="mac" />
                              </span>
                              {deployment.build_info.mac.sizeFormatted}
                            </span>
                          )}
                          {deployment.build_info.windows?.sizeFormatted &&
                           /\d/.test(deployment.build_info.windows.sizeFormatted) && (
                            <span className="flex items-center gap-1">
                              <span className="text-pixel-accent-cyan">
                                <PlatformIcon platform="windows" />
                              </span>
                              {deployment.build_info.windows.sizeFormatted}
                            </span>
                          )}
                        </div>
                      )}

                      {/* View Details Arrow */}
                      <div className="flex items-center gap-2 mt-3 text-xs font-mono text-pixel-accent-cyan group-hover:text-pixel-accent-green transition-colors duration-200">
                        <span>View details</span>
                        <span className="group-hover:translate-x-1 transition-transform duration-200">
                          →
                        </span>
                      </div>
                    </PixelCard>
                  </Link>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {/* Previous Button */}
                  {page > 1 ? (
                    <Link href={`/deployments?page=${page - 1}`}>
                      <PixelButton variant="secondary" size="sm">
                        <span className="flex items-center gap-1">
                          <span>←</span>
                          <span>Previous</span>
                        </span>
                      </PixelButton>
                    </Link>
                  ) : (
                    <PixelButton variant="secondary" size="sm" disabled>
                      <span className="flex items-center gap-1">
                        <span>←</span>
                        <span>Previous</span>
                      </span>
                    </PixelButton>
                  )}

                  {/* Page Numbers */}
                  {pageNumbers.map((pageNum, index) =>
                    pageNum === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="px-2 font-mono text-pixel-text-muted"
                      >
                        ...
                      </span>
                    ) : (
                      <Link
                        key={pageNum}
                        href={`/deployments?page=${pageNum}`}
                        className={pageNum === page ? "pointer-events-none" : ""}
                      >
                        <PixelButton
                          variant={pageNum === page ? "primary" : "secondary"}
                          size="sm"
                          className="min-w-[40px]"
                        >
                          {pageNum}
                        </PixelButton>
                      </Link>
                    )
                  )}

                  {/* Next Button */}
                  {page < totalPages ? (
                    <Link href={`/deployments?page=${page + 1}`}>
                      <PixelButton variant="secondary" size="sm">
                        <span className="flex items-center gap-1">
                          <span>Next</span>
                          <span>→</span>
                        </span>
                      </PixelButton>
                    </Link>
                  ) : (
                    <PixelButton variant="secondary" size="sm" disabled>
                      <span className="flex items-center gap-1">
                        <span>Next</span>
                        <span>→</span>
                      </span>
                    </PixelButton>
                  )}
                </div>
              )}

              {/* Pagination Info */}
              <div className="text-center mt-6">
                <p className="font-mono text-pixel-text-muted text-sm">
                  Page {page} of {totalPages} ({total} total
                  {total === 1 ? " deployment" : " deployments"})
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
