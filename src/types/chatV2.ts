// types/chatV2.ts
export type SenderRoleV2 = "client" | "agent";

export interface ConversationV2 {
  id: string;
  client_id: string;
  client_email: string | null;
  client_name: string | null;
  status: "open" | "closed";
  last_message_at: string;
  created_at: string;
}

export interface MessageV2 {
  id: string;
  conversation_id: string;
  sender_role: SenderRoleV2;
  sender_name: string | null;
  body: string;
  created_at: string;
}