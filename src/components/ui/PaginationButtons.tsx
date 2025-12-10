import { PixelButton } from "./PixelButton";

interface PaginationButtonsProps {
  totalItems: number;
  displayLimit: number;
  defaultLimit?: number;
  onLoadMore: () => void;
  onShowLess: () => void;
  loadMoreText?: string;
  showLessText?: string;
}

/**
 * Reusable pagination buttons for Load More / Show Less pattern
 */
export function PaginationButtons({
  totalItems,
  displayLimit,
  defaultLimit = 5,
  onLoadMore,
  onShowLess,
  loadMoreText = "Load More",
  showLessText = "Show Less",
}: PaginationButtonsProps) {
  const hasMore = totalItems > displayLimit;
  const remaining = totalItems - displayLimit;
  const isExpanded = displayLimit > defaultLimit;
  const showLoadedAll = isExpanded && !hasMore;

  return (
    <div className="space-y-2">
      {/* Load More Button */}
      {hasMore && (
        <div className="text-center pt-4">
          <PixelButton variant="secondary" onClick={onLoadMore}>
            {loadMoreText} ({remaining} remaining)
          </PixelButton>
        </div>
      )}

      {/* Show Less Button */}
      {showLoadedAll && (
        <div className="text-center pt-2">
          <PixelButton variant="secondary" size="sm" onClick={onShowLess}>
            {showLessText}
          </PixelButton>
        </div>
      )}
    </div>
  );
}
