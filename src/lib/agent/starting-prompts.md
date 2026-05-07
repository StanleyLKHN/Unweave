# Agent 1 — Customer Assistant Prompts

Prompts for building and extending the customer chat agent inside Unweave.

---

## 1. Create the API route

```
Create a Next.js API route at /app/api/agents/customer-reply/route.ts

It should:
- Accept POST with { message, customerEmail, subject }
- Save the incoming message to Supabase table customer_messages
- Call Claude API (claude-haiku-4-5-20251001) with a brand system prompt
- Save the draft reply back to Supabase
- Set follow_up_at to 24 hours from now
- Send an email alert to the admin via Resend
- Return { reply } as JSON

Use these env vars:
ANTHROPIC_API_KEY
RESEND_API_KEY
ADMIN_EMAIL
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

---

## 2. Write the brand system prompt

```
Write a Claude system prompt for Unweave customer service.

Unweave is a zero-waste fashion label. We only produce garments after 10 pre-orders.

Rules:
- Tone: warm, knowledgeable, unhurried
- Never use exclamation marks
- Never be pushy
- Keep replies to 2-4 sentences
- If the customer has an order — reference it specifically
- If asked about production status — explain the pre-order model simply
- Sign off naturally as: The Unweave Team
```

---

## 3. Add order context to the agent

```
Update /app/api/agents/customer-reply/route.ts

Before calling Claude, fetch the customer's order history from Supabase:
- Query the orders table by customer_email
- Join order_items and products
- Include: order id, status, total, product name, material, preorder_count, preorder_target
- Format as a short text block
- Append it to the Claude system prompt as "Customer order history:"

If no orders found — skip this step silently.
```

---

## 4. Create the Supabase table

```
Write a Supabase SQL migration to create the customer_messages table.

Fields:
- id: uuid, primary key, default gen_random_uuid()
- customer_email: text, not null
- subject: text
- body: text, not null
- order_id: text
- status: text, default 'new' (values: new / draft / sent / follow_up_sent)
- draft_reply: text
- follow_up_at: timestamptz
- created_at: timestamptz, default now()

Enable RLS. Add a policy that allows service role full access.
```

---

## 5. Build the admin messages page

```
Create a Next.js page at /app/admin/messages/page.tsx

It should:
- Be a 'use client' component
- Fetch messages from /api/admin/messages on load
- Display each message with: customer email, subject, body, status badge, date
- Show the agent draft reply in a green box if it exists
- Show a "Send Reply" button if status is not 'sent'
- Clicking Send Reply calls /api/admin/send-reply with messageId, email, reply
- After sending, update the status to 'sent' in the UI

Use the Unweave design system:
- Background: #F5F0E8
- Cards: #FDFAF5 with 0.5px border #D4C9B0
- Font serif: Cormorant Garamond
- Font sans: Jost
```

---

## 6. Add email gate to the chat

```
Update ChatMessenger.tsx to ask for the user's email before starting the chat.

When the chat opens:
- Show a welcome screen with Unweave logo, heading, and email input
- User enters email and clicks "Start Chat"
- Or they can click "continue anonymously"
- Once submitted, show the regular chat interface
- Display "Chatting as email@example.com" at the top of messages
- Pass the email to /api/agents/customer-reply in every request
```

---

## 7. Build the follow-up trigger

```
Create a Next.js API route at /app/api/agents/follow-up/route.ts

It should handle GET requests and:
- Query Supabase for all messages where:
  - status = 'draft'
  - follow_up_at < now()
- For each overdue message, send a reminder email via Resend to ADMIN_EMAIL
- Email should include: customer email, original message, agent draft, link to admin panel
- After sending, update the message status to 'follow_up_sent'
- Return { count } of reminders sent

Also create vercel.json in the project root with a cron job:
{ "crons": [{ "path": "/api/agents/follow-up", "schedule": "0 9 * * *" }] }
```

---

## 8. Add Send Reply API route

```
Create a Next.js API route at /app/api/admin/send-reply/route.ts

It should:
- Accept POST with { messageId, email, reply }
- Send the reply text to the customer email via Resend
- From: Unweave <onboarding@resend.dev>
- Subject: Reply from Unweave
- Update the message status to 'sent' in Supabase
- Return { success: true }
```

---

## 9. Extend the agent — add sentiment detection

```
Update the Claude system prompt and API route for customer-reply.

Add sentiment detection:
- After generating the reply, make a second Claude call to classify the message
- Classify as: happy / neutral / frustrated / urgent
- Save the sentiment to a new column in customer_messages called sentiment
- In the admin panel, show a colored dot next to each message:
  - happy: green
  - neutral: gray  
  - frustrated: amber
  - urgent: red
```

---

## 10. Extend the agent — editable drafts

```
Update /app/admin/messages/page.tsx

Instead of showing the draft reply as plain text:
- Show it in a <textarea> that the user can edit
- When the user clicks "Send Reply", send the edited content (not the original draft)
- Add a "Reset to agent draft" button that restores the original text
- Style the textarea to match the Unweave design system
```

---

## Quick test prompts for the chat

Use these to test your agent's responses:

```
"What materials do you use?"
"How does the pre-order model work?"
"Do you ship to Europe?"
"My order is late and I'm really upset."
"Can I return my item?"
"How long until my piece is made?"
"What's the difference between deadstock and organic fabric?"
"I want to cancel my order."
```

Each response should sound like Unweave — warm, informed, never pushy.