"use client";

import { markdownToHtml } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";

interface ChangelogContentProps {
  content: string;
  className?: string;
  truncate?: boolean;
  maxLines?: number;
}

/**
 * Renders changelog content (markdown) as styled HTML
 * Handles headers, bold text, and bullet lists
 * Supports optional truncation with expand/collapse functionality
 *
 * @example
 * // Basic usage (no truncation)
 * <ChangelogContent content={markdownText} />
 *
 * @example
 * // With truncation (default 5 lines)
 * <ChangelogContent content={markdownText} truncate={true} />
 *
 * @example
 * // Custom truncation (3 lines)
 * <ChangelogContent content={markdownText} truncate={true} maxLines={3} />
 */
export function ChangelogContent({
  content,
  className = "",
  truncate = false,
  maxLines = 5
}: ChangelogContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!truncate || !contentRef.current) {
      setIsTruncated(false);
      return;
    }

    // Check if content exceeds the max height
    const element = contentRef.current;
    const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
    const maxHeight = lineHeight * maxLines;

    setIsTruncated(element.scrollHeight > maxHeight);
  }, [content, truncate, maxLines]);

  if (!content) {
    return null;
  }

  const lineHeight = 1.625; // leading-relaxed = 1.625rem
  const maxHeight = `${lineHeight * maxLines}rem`;

  return (
    <div className="relative">
      <div
        ref={contentRef}
        className={`font-mono text-sm leading-relaxed prose prose-invert max-w-none ${className}`}
        style={
          truncate && !isExpanded
            ? {
                maxHeight,
                overflow: "hidden",
              }
            : undefined
        }
        dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
      />

      {/* Gradient fade overlay when truncated */}
      {truncate && !isExpanded && isTruncated && (
        <div
          className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-bg-card to-transparent pointer-events-none"
          style={{
            background: "linear-gradient(to top, var(--bg-card, #16213e) 0%, transparent 100%)"
          }}
        />
      )}

      {/* Expand/Collapse buttons */}
      {truncate && isTruncated && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-xs font-mono text-accent-cyan hover:text-accent-green transition-colors duration-200 flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              <span>▲</span>
              <span>Show less</span>
            </>
          ) : (
            <>
              <span>▼</span>
              <span>Show more</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
