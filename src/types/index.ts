// =============================================================================
// CHANGELOG TYPES
// =============================================================================

export type ChangelogCategory =
  | "Feature"
  | "Bugfix"
  | "Improvement"
  | "Breaking"
  | "Security";

export interface Changelog {
  id: string;
  version: string;
  title: string;
  content: string;
  category: ChangelogCategory;
  release_date: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateChangelogInput {
  version: string;
  title: string;
  content: string;
  category: ChangelogCategory;
  release_date?: string;
  is_published?: boolean;
}

export interface UpdateChangelogInput extends Partial<CreateChangelogInput> {
  id: string;
}

// =============================================================================
// NEWSLETTER TYPES
// =============================================================================

export interface Subscriber {
  id: string;
  email: string;
  is_active: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
  unsubscribe_token: string;
  source: string;
}

export interface SubscribeInput {
  email: string;
  source?: string;
}

// =============================================================================
// EMAIL TYPES
// =============================================================================

export interface EmailLog {
  id: string;
  subject: string;
  content: string;
  recipient_count: number;
  sent_at: string;
  sent_by: string;
  status: "sent" | "failed" | "partial";
  error_details: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
}

export interface SendEmailInput {
  subject: string;
  content: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// =============================================================================
// TOAST TYPES
// =============================================================================

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// =============================================================================
// AUTH TYPES
// =============================================================================

export interface AdminSession {
  token: string;
  expiresAt: string;
}
