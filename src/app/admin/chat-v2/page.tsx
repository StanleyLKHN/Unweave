// app/admin/chat-v2/page.tsx
// Inbox for V2. Server-rendered. Protect this route with your auth.

import Link from "next/link";
import { getSupabaseAdminV2 } from "@/lib/supabaseAdminV2";
import type { ConversationV2 } from "@/types/chatV2";

export const dynamic = "force-dynamic";

export default async function AdminInboxV2Page() {
  const supabase = getSupabaseAdminV2();
  const { data, error } = await supabase
    .from("conversations_v2")
    .select("*")
    .order("last_message_at", { ascending: false })
    .limit(100);

  if (error) {
    return <div className="p-8 text-red-600">Error: {error.message}</div>;
  }

  const conversations = (data ?? []) as ConversationV2[];

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Inbox · V2</h1>
      {conversations.length === 0 && (
        <p className="text-neutral-500">No conversations yet.</p>
      )}
      <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
        {conversations.map((c) => (
          <li key={c.id}>
            <Link
              href={`/admin/chat-v2/${c.id}`}
              className="flex items-center justify-between gap-4 p-4 hover:bg-neutral-50"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {c.client_name || "Anonymous"}{" "}
                  {c.client_email && (
                    <span className="text-sm font-normal text-neutral-500">
                      · {c.client_email}
                    </span>
                  )}
                </div>
                <div className="truncate text-xs text-neutral-500">
                  client_id: {c.client_id}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-500">
                <span
                  className={`rounded-full px-2 py-0.5 ${
                    c.status === "open"
                      ? "bg-green-100 text-green-700"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {c.status}
                </span>
                <span>{new Date(c.last_message_at).toLocaleString()}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}