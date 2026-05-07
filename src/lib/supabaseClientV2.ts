// lib/supabaseClientV2.ts
// Browser-side Supabase client for the V2 chat widget.
// Uses a separate localStorage key + header so it doesn't collide with V1.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const CLIENT_ID_KEY_V2 = "unweave_client_id_v2";

export function getClientIdV2(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(CLIENT_ID_KEY_V2);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY_V2, id);
  }
  return id;
}

let cachedV2: SupabaseClient | null = null;

export function getSupabaseV2(): SupabaseClient {
  if (cachedV2) return cachedV2;
  cachedV2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { "x-client-id-v2": getClientIdV2() },
    },
    realtime: { params: { eventsPerSecond: 5 } },
  });
  return cachedV2;
}