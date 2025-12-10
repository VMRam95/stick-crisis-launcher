import Link from "next/link";
import {
  PixelCard,
  PixelBadge,
  PixelButton,
  ChangelogContent,
} from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { supabaseServer } from "@/lib/supabase/server";
import type { Changelog } from "@/types";

interface ChangelogPageProps {
  searchParams: { page?: string };
}

interface PaginatedResult {
  data: Changelog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

async function getChangelogs(page: number): Promise<PaginatedResult> {
  const limit = 10;
  const offset = (page - 1) * limit;

  // Get total count
  const { count } = await supabaseServer
    .from("changelog")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true);

  // Get paginated data - sorted by release_date DESC, then created_at DESC for same-day releases
  const { data, error } = await supabaseServer
    .from("changelog")
    .select("*")
    .eq("is_published", true)
    .order("release_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching changelogs:", error);
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

export default async function ChangelogPage({
  searchParams,
}: ChangelogPageProps) {
  const currentPage = parseInt(searchParams.page || "1", 10);
  const { data: changelogs, page, totalPages, total } = await getChangelogs(currentPage);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
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
                All Changelogs
              </h1>
              <p className="font-mono text-pixel-text-secondary mt-2">
                Complete history of updates and improvements
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Changelog List */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {changelogs.length === 0 ? (
            <PixelCard className="text-center">
              <p className="text-pixel-text-muted font-mono">
                No changelogs found.
              </p>
            </PixelCard>
          ) : (
            <>
              <div className="space-y-6 mb-8">
                {changelogs.map((changelog) => (
                  <Link
                    key={changelog.id}
                    href={`/changelog/${changelog.id}`}
                    className="block group"
                  >
                    <PixelCard
                      variant="outlined"
                      className="relative overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:border-pixel-accent-cyan"
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
                      <h2 className="font-pixel text-pixel-xs text-pixel-text-primary uppercase mb-3 group-hover:text-pixel-accent-cyan transition-colors duration-200">
                        {changelog.title}
                      </h2>

                      {/* Content - Rendered as HTML with truncation */}
                      <ChangelogContent
                        content={changelog.content}
                        truncate={true}
                        maxLines={3}
                      />

                      {/* View Details Arrow */}
                      <div className="flex items-center gap-2 mt-4 text-xs font-mono text-pixel-accent-cyan group-hover:text-pixel-accent-green transition-colors duration-200">
                        <span>View full details</span>
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
                    <Link href={`/changelog?page=${page - 1}`}>
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
                        href={`/changelog?page=${pageNum}`}
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
                    <Link href={`/changelog?page=${page + 1}`}>
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
                  {total === 1 ? " changelog" : " changelogs"})
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
