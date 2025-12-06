"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface PixelButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const PixelButton = forwardRef<HTMLButtonElement, PixelButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "font-pixel uppercase tracking-wider border-2 transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-pixel-bg-primary";

    const variants = {
      primary:
        "bg-pixel-accent-green text-pixel-bg-primary border-pixel-accent-green hover:bg-transparent hover:text-pixel-accent-green focus:ring-pixel-accent-green pixel-btn",
      secondary:
        "bg-transparent text-pixel-accent-cyan border-pixel-accent-cyan hover:bg-pixel-accent-cyan hover:text-pixel-bg-primary focus:ring-pixel-accent-cyan pixel-btn",
      danger:
        "bg-pixel-accent-red text-pixel-bg-primary border-pixel-accent-red hover:bg-transparent hover:text-pixel-accent-red focus:ring-pixel-accent-red pixel-btn",
      ghost:
        "bg-transparent text-pixel-text-secondary border-transparent hover:text-pixel-text-primary hover:border-pixel-text-secondary",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-pixel-xs",
      md: "px-4 py-2 text-pixel-sm",
      lg: "px-6 py-3 text-pixel-base",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-blink">...</span>
            <span>LOADING</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

PixelButton.displayName = "PixelButton";

export { PixelButton };
