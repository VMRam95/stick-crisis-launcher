"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { cn, getCategoryColor, getCategoryBgColor } from "@/lib/utils";
import type { ChangelogCategory } from "@/types";

export interface PixelBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  category?: ChangelogCategory;
  variant?: "default" | "outline";
}

const PixelBadge = forwardRef<HTMLSpanElement, PixelBadgeProps>(
  ({ className, category, variant = "default", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center font-pixel text-pixel-xs uppercase px-2 py-1 border";

    // If category is provided, use predefined colors
    if (category) {
      return (
        <span
          ref={ref}
          className={cn(
            baseStyles,
            getCategoryColor(category),
            variant === "default" && getCategoryBgColor(category),
            className
          )}
          {...props}
        >
          {children || category}
        </span>
      );
    }

    // Default styling if no category
    return (
      <span
        ref={ref}
        className={cn(
          baseStyles,
          "text-pixel-text-secondary border-pixel-text-secondary",
          variant === "default" && "bg-pixel-text-secondary/20",
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

PixelBadge.displayName = "PixelBadge";

export { PixelBadge };
