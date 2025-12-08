import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to readable string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format date and time to readable string with full timestamp
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Delay function for async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get category color class
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Feature: "text-pixel-accent-green border-pixel-accent-green",
    Bugfix: "text-pixel-accent-red border-pixel-accent-red",
    Improvement: "text-pixel-accent-yellow border-pixel-accent-yellow",
    Breaking: "text-pixel-accent-pink border-pixel-accent-pink",
    Security: "text-pixel-accent-cyan border-pixel-accent-cyan",
  };
  return colors[category] || "text-pixel-text-secondary border-pixel-text-secondary";
}

/**
 * Get category background color class
 */
export function getCategoryBgColor(category: string): string {
  const colors: Record<string, string> = {
    Feature: "bg-pixel-accent-green/20",
    Bugfix: "bg-pixel-accent-red/20",
    Improvement: "bg-pixel-accent-yellow/20",
    Breaking: "bg-pixel-accent-pink/20",
    Security: "bg-pixel-accent-cyan/20",
  };
  return colors[category] || "bg-pixel-text-secondary/20";
}
