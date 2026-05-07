// app/admin/chat-v2/[id]/page.tsx
import { getSupabaseAdminV2 } from "@/lib/supabaseAdminV2";
import type { ConversationV2, MessageV2 } from "@/types/chatV2";
import AgentChatPanelV2 from "./AgentChatPanelV2";

export const dynamic = "force-dynamic";

export default async function ConversationV2Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseAdminV2();

  const [{ data: convo }, { data: msgs }] = await Promise.all([
    supabase.from("conversations_v2").select("*").eq("id", id).single(),
    supabase
      .from("messages_v2")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!convo) {
    return <div className="p-8 text-red-600">Conversation not found.</div>;
  }

  return (
    <AgentChatPanelV2
      conversation={convo as ConversationV2}
      initialMessages={(msgs ?? []) as MessageV2[]}
    />
  );
}