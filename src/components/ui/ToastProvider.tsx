"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { Toast } from "./Toast";
import type { Toast as ToastType, ToastType as ToastVariant } from "@/types";
import { generateId } from "@/lib/utils";
import { MAX_TOASTS, TOAST_DURATION } from "@/lib/constants";

interface ToastContextValue {
  toasts: ToastType[];
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
  showToast: (message: string, type?: ToastVariant) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastVariant, message: string) => {
      const id = generateId();
      const newToast: ToastType = {
        id,
        type,
        message,
        duration: TOAST_DURATION,
      };

      setToasts((prev) => {
        // Keep only the last MAX_TOASTS - 1 toasts
        const updatedToasts = prev.slice(-(MAX_TOASTS - 1));
        return [...updatedToasts, newToast];
      });
    },
    []
  );

  const toast = {
    success: (message: string) => addToast("success", message),
    error: (message: string) => addToast("error", message),
    warning: (message: string) => addToast("warning", message),
    info: (message: string) => addToast("info", message),
  };

  const showToast = useCallback(
    (message: string, type: ToastVariant = "info") => {
      addToast(type, message);
    },
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, showToast, removeToast }}>
      {children}
      {/* Toast container */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
