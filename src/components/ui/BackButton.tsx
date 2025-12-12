"use client";

import { useRouter } from "next/navigation";
import { PixelButton, type PixelButtonProps } from "./PixelButton";

interface BackButtonProps extends Omit<PixelButtonProps, "onClick"> {
  fallbackHref?: string;
  label?: string;
}

export function BackButton({
  fallbackHref = "/",
  label = "Back",
  variant = "secondary",
  size,
  className,
  ...props
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // Check if there's history to go back to
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      // Fallback to specified href if no history
      router.push(fallbackHref);
    }
  };

  return (
    <PixelButton
      variant={variant}
      size={size}
      className={className}
      onClick={handleBack}
      {...props}
    >
      <span className="flex items-center gap-2">
        <span>←</span>
        <span>{label}</span>
      </span>
    </PixelButton>
  );
}
