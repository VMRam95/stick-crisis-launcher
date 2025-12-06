// =============================================================================
// APP CONSTANTS
// =============================================================================

export const APP_NAME = "Stick Crisis";
export const APP_DESCRIPTION =
  "Intense stick figure combat action game. Download free on itch.io!";

export const ITCH_URL =
  process.env.NEXT_PUBLIC_ITCH_URL || "https://vmram95.itch.io/stick-crisis";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// =============================================================================
// CHANGELOG CATEGORIES
// =============================================================================

export const CHANGELOG_CATEGORIES = [
  "Feature",
  "Bugfix",
  "Improvement",
  "Breaking",
  "Security",
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  Feature: "New Feature",
  Bugfix: "Bug Fix",
  Improvement: "Improvement",
  Breaking: "Breaking Change",
  Security: "Security",
};

// =============================================================================
// PAGINATION
// =============================================================================

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// =============================================================================
// TOAST
// =============================================================================

export const TOAST_DURATION = 4000; // 4 seconds
export const MAX_TOASTS = 3;

// =============================================================================
// ADMIN
// =============================================================================

export const ADMIN_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
export const ADMIN_COOKIE_NAME = "stick-crisis-admin-session";

// =============================================================================
// EMAILJS
// =============================================================================

export const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
export const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;
export const EMAILJS_WELCOME_TEMPLATE_ID =
  process.env.NEXT_PUBLIC_EMAILJS_WELCOME_TEMPLATE_ID!;
export const EMAILJS_NEWSLETTER_TEMPLATE_ID =
  process.env.NEXT_PUBLIC_EMAILJS_NEWSLETTER_TEMPLATE_ID!;
