import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase client for browser-side operations
 * Uses the stick_crisis schema
 * RLS policies apply - only public data accessible
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: "stick_crisis",
  },
  auth: {
    persistSession: false,
  },
});

export default supabase;
