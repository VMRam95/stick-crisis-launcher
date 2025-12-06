"use client";

import { Modal } from "./Modal";
import { PixelButton } from "./PixelButton";

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  isLoading = false,
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div className="text-center">
        {/* Icon */}
        <div
          className={`font-pixel text-pixel-2xl mb-4 ${
            variant === "danger"
              ? "text-pixel-accent-red"
              : "text-pixel-accent-yellow"
          }`}
        >
          {variant === "danger" ? "[!!]" : "[!]"}
        </div>

        {/* Title */}
        <h3 className="font-pixel text-pixel-base text-pixel-text-primary uppercase mb-3">
          {title}
        </h3>

        {/* Message */}
        <p className="font-mono text-sm text-pixel-text-secondary mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <PixelButton
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </PixelButton>
          <PixelButton
            variant={variant === "danger" ? "danger" : "primary"}
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </PixelButton>
        </div>
      </div>
    </Modal>
  );
}
