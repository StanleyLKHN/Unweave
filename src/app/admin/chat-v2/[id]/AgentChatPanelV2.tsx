"use client";

// app/admin/chat-v2/[id]/AgentChatPanelV2.tsx
// V2 agent reply UI. Reads via realtime subscription, sends via API route.

import { useEffect, useRef, useState, FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { ConversationV2, MessageV2 } from "@/types/chatV2";

export default function AgentChatPanelV2({
  conversation,
  initialMessages,
}: {
  conversation: ConversationV2;
  initialMessages: MessageV2[];
}) {
  const [messages, setMessages] = useState<MessageV2[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [agentName, setAgentName] = useState("Unweave Team");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel(`agent_v2:messages:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages_v2",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          setMessages((prev) => {
            const m = payload.new as MessageV2;
            if (prev.some((x) => x.id === m.id)) return prev;
            return [...prev, m];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    const res = await fetch("/api/chat-v2/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: conversation.id,
        body,
        sender_name: agentName,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(err);
    }
    setDraft("");
    setSending(false);
  }

  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 p-4">
        <div>
          <Link href="/admin/chat-v2" className="text-sm text-neutral-500 hover:underline">
            ← Inbox V2
          </Link>
          <h1 className="mt-1 text-lg font-semibold">
            {conversation.client_name || "Anonymous"}
            {conversation.client_email && (
              <span className="ml-2 text-sm font-normal text-neutral-500">
                · {conversation.client_email}
              </span>
            )}
          </h1>
        </div>
        <input
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          className="rounded-md border border-neutral-200 px-2 py-1 text-sm"
          placeholder="Your name"
        />
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-neutral-50 p-4">
        {messages.map((m) => {
          const isAgent = m.sender_role === "agent";
          return (
            <div key={m.id} className={`flex ${isAgent ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                  isAgent
                    ? "rounded-br-sm bg-neutral-900 text-white"
                    : "rounded-bl-sm bg-white text-neutral-900"
                }`}
              >
                <div className="mb-0.5 text-[11px] font-semibold opacity-70">
                  {m.sender_name || (isAgent ? "Agent" : "Client")}
                </div>
                <div className="whitespace-pre-wrap break-words">{m.body}</div>
                <div className="mt-1 text-[10px] opacity-50">
                  {new Date(m.created_at).toLocaleTimeString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSend} className="flex gap-2 border-t border-neutral-200 p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Reply…"
          className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="rounded-md bg-neutral-900 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}