// app/api/chat-v2/send/route.ts
// V2 server endpoint for posting agent replies.
// Uses the service role key — protect this route with your auth middleware.

import { NextResponse } from "next/server";
import { getSupabaseAdminV2 } from "@/lib/supabaseAdminV2";

export async function POST(req: Request) {
  // TODO: add your auth check here (verify Supabase session cookie, etc.)
  // and 401 if the caller is not an Unweave team member.

  const { conversation_id, body, sender_name } = await req.json();

  if (!conversation_id || !body || typeof body !== "string") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = getSupabaseAdminV2();
  const { error } = await supabase.from("messages_v2").insert({
    conversation_id,
    sender_role: "agent",
    sender_name: sender_name || "Unweave Team",
    body: body.trim(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}