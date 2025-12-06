import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client for server-side operations
 * Uses the stick_crisis schema
 * Service role key bypasses RLS - use only in API routes
 */
export function getSupabaseServer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    db: {
      schema: "stick_crisis",
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// For backwards compatibility - creates a new client per call
// This is fine for API routes since they're stateless
export const supabaseServer = {
  from(table: string) {
    return getSupabaseServer().from(table);
  },
};

export default getSupabaseServer;
