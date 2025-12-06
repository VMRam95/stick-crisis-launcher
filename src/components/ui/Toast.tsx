"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { Toast as ToastType, ToastType as ToastVariant } from "@/types";

export interface ToastProps extends ToastType {
  onClose: (id: string) => void;
}

const icons: Record<ToastVariant, string> = {
  success: "[OK]",
  error: "[!!]",
  warning: "[!]",
  info: "[i]",
};

const colors: Record<ToastVariant, string> = {
  success: "border-pixel-accent-green text-pixel-accent-green",
  error: "border-pixel-accent-red text-pixel-accent-red",
  warning: "border-pixel-accent-yellow text-pixel-accent-yellow",
  info: "border-pixel-accent-cyan text-pixel-accent-cyan",
};

export function Toast({ id, type, message, duration = 4000, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300);
  };

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-3 px-4 py-3 bg-pixel-bg-card border-2",
        colors[type],
        isExiting ? "toast-exit" : "toast-enter"
      )}
    >
      <span className="font-pixel text-pixel-xs">{icons[type]}</span>
      <p className="font-mono text-sm text-pixel-text-primary flex-1">
        {message}
      </p>
      <button
        onClick={handleClose}
        className="font-pixel text-pixel-xs text-pixel-text-muted hover:text-pixel-text-primary transition-colors"
        aria-label="Close notification"
      >
        [X]
      </button>
    </div>
  );
}
