"use client";

import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
}: LoadingSpinnerProps) {
  const sizes = {
    sm: "text-pixel-sm",
    md: "text-pixel-base",
    lg: "text-pixel-xl",
  };

  return (
    <div
      className={cn(
        "font-pixel text-pixel-accent-green animate-pulse",
        sizes[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="inline-block animate-blink">[</span>
      <span className="inline-block" style={{ animationDelay: "0.1s" }}>
        =
      </span>
      <span className="inline-block" style={{ animationDelay: "0.2s" }}>
        =
      </span>
      <span className="inline-block" style={{ animationDelay: "0.3s" }}>
        =
      </span>
      <span className="inline-block animate-blink">]</span>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
