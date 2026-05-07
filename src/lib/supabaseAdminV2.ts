// lib/supabaseAdminV2.ts
// Server-only Supabase client for V2. Uses the service role key.
// NEVER import this from a Client Component.

import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdminV2() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}