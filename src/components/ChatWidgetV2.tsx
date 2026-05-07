"use client";

// components/ChatWidgetV2.tsx
// Unweave brand-matched chat widget. Anchored on the LEFT side.
// Email gate before chat starts (with "continue anonymously" fallback).

import { useEffect, useRef, useState, FormEvent } from "react";
import { getSupabaseV2, getClientIdV2 } from "@/lib/supabaseClientV2";
import type { ConversationV2, MessageV2 } from "@/types/chatV2";

// ──────────────────────────────────────────────────────────────
// Brand tokens — pulled from the Unweave site
// ──────────────────────────────────────────────────────────────
const BRAND = {
  cream: "#F4EDE2",
  creamSoft: "#EBE2D2",
  ink: "#2B2118",
  inkSoft: "#5A4B3C",
  taupe: "#C8B89A",
  taupeDark: "#A8946F",
  online: "#7BA679",
  border: "rgba(43, 33, 24, 0.12)",
};

export default function ChatWidgetV2() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState<ConversationV2 | null>(null);
  const [messages, setMessages] = useState<MessageV2[]>([]);
  const [draft, setDraft] = useState("");
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Existing conversation? Skip the email gate.
  useEffect(() => {
    const supabase = getSupabaseV2();
    const clientId = getClientIdV2();
    supabase
      .from("conversations_v2")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setConversation(data as ConversationV2);
          setEmail((data as ConversationV2).client_email ?? "");
          setEmailSubmitted(true);
        }
      });
  }, []);

  // Realtime messages
  useEffect(() => {
    if (!conversation) return;
    const supabase = getSupabaseV2();

    supabase
      .from("messages_v2")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data ?? []) as MessageV2[]));

    const channel = supabase
      .channel(`messages_v2:${conversation.id}`)
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
  }, [conversation]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open, emailSubmitted]);

  // Start chat: create conversation row up-front (with optional email)
  async function handleStartChat(e: FormEvent, anonymous = false) {
    e.preventDefault();
    if (!anonymous && !email.trim()) return;
    if (sending) return;
    setSending(true);

    const supabase = getSupabaseV2();
    const clientId = getClientIdV2();

    const { data, error } = await supabase
      .from("conversations_v2")
      .insert({
        client_id: clientId,
        client_email: anonymous ? null : email.trim(),
        client_name: null,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      setSending(false);
      return;
    }
    setConversation(data as ConversationV2);
    setEmailSubmitted(true);
    setSending(false);
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending || !conversation) return;
    setSending(true);

    const supabase = getSupabaseV2();
    const { error } = await supabase.from("messages_v2").insert({
      conversation_id: conversation.id,
      sender_role: "client",
      sender_name: null,
      body,
    });
    if (error) console.error(error);
    setDraft("");
    setSending(false);
  }

  return (
    <>
      {/* Inline font load — Cormorant Garamond for display */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500&display=swap");
        .uw-font-display {
          font-family: "Cormorant Garamond", "Cormorant", Georgia, serif;
          font-feature-settings: "liga", "dlig";
        }
        .uw-font-body {
          font-family: "Inter", system-ui, -apple-system, sans-serif;
        }
        .uw-tracked {
          letter-spacing: 0.18em;
        }
      `}</style>

      {/* Floating bubble — LEFT side, cream w/ italic U */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="uw-font-display fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-2xl italic shadow-md transition hover:scale-105"
        style={{
          background: BRAND.cream,
          color: BRAND.ink,
          border: `1px solid ${BRAND.border}`,
        }}
      >
        {open ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        ) : (
          <span style={{ marginTop: "-2px" }}>U</span>
        )}
      </button>

      {/* Panel — LEFT side */}
      {open && (
        <div
          className="uw-font-body fixed bottom-24 left-6 z-50 flex h-[580px] w-[400px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden shadow-2xl"
          style={{
            background: BRAND.cream,
            border: `1px solid ${BRAND.border}`,
            borderRadius: "2px",
          }}
        >
          {/* Header strip */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ background: BRAND.ink, color: BRAND.cream }}
          >
            <div className="flex items-center gap-3">
              <div
                className="uw-font-display flex h-9 w-9 items-center justify-center rounded-full text-lg italic"
                style={{
                  background: BRAND.cream,
                  color: BRAND.ink,
                }}
              >
                U
              </div>
              <div>
                <div className="uw-tracked text-[11px] font-medium uppercase">
                  Unweave
                </div>
                <div
                  className="mt-0.5 flex items-center gap-1.5 text-[11px]"
                  style={{ color: "rgba(244, 237, 226, 0.65)" }}
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: BRAND.online }}
                  />
                  Online now
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="opacity-70 transition hover:opacity-100"
              style={{ color: BRAND.cream }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </div>

          {/* EMAIL GATE */}
          {!emailSubmitted && (
            <div
              className="flex flex-1 flex-col items-center justify-center px-8 py-10 text-center"
              style={{ color: BRAND.ink }}
            >
              <div
                className="uw-font-display flex h-16 w-16 items-center justify-center rounded-full text-3xl italic"
                style={{
                  background: BRAND.creamSoft,
                  color: BRAND.ink,
                  border: `1px solid ${BRAND.border}`,
                }}
              >
                U
              </div>

              <h3 className="uw-font-display mt-6 text-3xl font-normal">
                Welcome to Unweave
              </h3>

              <p
                className="mt-3 text-sm leading-relaxed"
                style={{ color: BRAND.inkSoft }}
              >
                Leave your email and we&apos;ll follow up if needed.
              </p>

              <form onSubmit={(e) => handleStartChat(e, false)} className="mt-6 w-full">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-transparent px-3 py-3 text-center text-sm transition focus:outline-none"
                  style={{
                    border: `1px solid ${BRAND.border}`,
                    color: BRAND.ink,
                    borderRadius: "2px",
                  }}
                  required
                />
                <button
                  type="submit"
                  disabled={sending || !email.trim()}
                  className="uw-tracked mt-3 w-full px-3 py-3 text-[11px] font-medium uppercase transition disabled:opacity-50"
                  style={{
                    background: BRAND.taupe,
                    color: BRAND.ink,
                    borderRadius: "2px",
                  }}
                >
                  Start Chat
                </button>
              </form>

              <button
                onClick={(e) => handleStartChat(e, true)}
                disabled={sending}
                className="mt-5 text-xs italic underline-offset-4 hover:underline disabled:opacity-50"
                style={{ color: BRAND.inkSoft }}
              >
                or <span className="underline">continue anonymously</span>
              </button>
            </div>
          )}

          {/* CHAT THREAD */}
          {emailSubmitted && (
            <>
              <div
                ref={scrollRef}
                className="flex-1 space-y-3 overflow-y-auto px-5 py-5"
                style={{ background: BRAND.cream }}
              >
                {messages.length === 0 && (
                  <div
                    className="uw-font-display px-1 py-2 text-base italic leading-relaxed"
                    style={{ color: BRAND.inkSoft }}
                  >
                    Hello — how can we help you today?
                  </div>
                )}
                {messages.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))}
              </div>

              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 px-4 py-3"
                style={{
                  background: BRAND.creamSoft,
                  borderTop: `1px solid ${BRAND.border}`,
                }}
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a message…"
                  className="flex-1 bg-transparent px-2 py-2 text-sm focus:outline-none"
                  style={{ color: BRAND.ink }}
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  aria-label="Send"
                  className="flex h-9 w-9 items-center justify-center transition disabled:opacity-40"
                  style={{
                    background: BRAND.ink,
                    color: BRAND.cream,
                    borderRadius: "2px",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}

// ──────────────────────────────────────────────────────────────
function MessageBubble({ message }: { message: MessageV2 }) {
  const isClient = message.sender_role === "client";
  return (
    <div className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[78%] px-4 py-2.5 text-sm leading-relaxed"
        style={{
          background: isClient ? BRAND.ink : "#FFFFFF",
          color: isClient ? BRAND.cream : BRAND.ink,
          borderRadius: "2px",
          border: isClient ? "none" : `1px solid ${BRAND.border}`,
        }}
      >
        {!isClient && message.sender_name && (
          <div
            className="uw-tracked mb-1 text-[10px] font-medium uppercase"
            style={{ color: BRAND.inkSoft }}
          >
            {message.sender_name}
          </div>
        )}
        <div className="whitespace-pre-wrap break-words">{message.body}</div>
      </div>
    </div>
  );
}