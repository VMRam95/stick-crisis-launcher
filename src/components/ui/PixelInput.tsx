"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface PixelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const PixelInput = forwardRef<HTMLInputElement, PixelInputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block font-pixel text-pixel-xs text-pixel-text-secondary mb-2 uppercase"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full px-4 py-3 bg-pixel-bg-secondary border-2 border-pixel-text-muted",
            "text-pixel-text-primary font-mono text-sm",
            "placeholder:text-pixel-text-muted",
            "focus:outline-none focus:border-pixel-accent-green",
            "transition-colors duration-150",
            error && "border-pixel-accent-red focus:border-pixel-accent-red",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-pixel-xs text-pixel-accent-red font-pixel">
            {error}
          </p>
        )}
      </div>
    );
  }
);

PixelInput.displayName = "PixelInput";

export { PixelInput };
