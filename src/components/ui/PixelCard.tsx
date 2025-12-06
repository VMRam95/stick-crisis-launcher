"use client";

import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface PixelCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outlined" | "glow";
}

const PixelCard = forwardRef<HTMLDivElement, PixelCardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variants = {
      default: "bg-pixel-bg-card border-2 border-pixel-text-muted",
      outlined: "bg-transparent border-2 border-pixel-accent-green",
      glow: "bg-pixel-bg-card border-2 border-pixel-accent-green shadow-glow",
    };

    return (
      <div
        ref={ref}
        className={cn("p-4", variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PixelCard.displayName = "PixelCard";

export { PixelCard };
