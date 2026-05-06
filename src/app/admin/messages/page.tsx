'use client'

import { useState, useEffect } from 'react'

type Message = {
  id: string
  customer_email: string
  subject: string
  body: string
  status: string
  draft_reply: string
  follow_up_at: string
  created_at: string
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    fetch('/api/admin/messages')
      .then(r => r.json())
      .then(data => setMessages(data.messages || []))
  }, [])

  async function sendReply(msg: Message) {
    await fetch('/api/admin/send-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: msg.id, email: msg.customer_email, reply: msg.draft_reply }),
    })
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'sent' } : m))
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F5F0E8', padding: '2rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#7A5C45', marginBottom: '8px' }}>
            Admin · Messages
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '42px', fontWeight: 300, color: '#2C1F14' }}>
            Customer Messages
          </h1>
        </div>

        {messages.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ background: '#FDFAF5', border: '0.5px solid #D4C9B0', padding: '1.5rem 2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: '#2C1F14', marginBottom: '4px' }}>
                      {msg.customer_email}
                    </p>
                    <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '12px', color: '#8C7B6E' }}>
                      {msg.subject || 'No subject'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{
                      fontFamily: 'Jost, sans-serif', fontSize: '9px',
                      letterSpacing: '0.2em', textTransform: 'uppercase',
                      padding: '4px 12px',
                      background: msg.status === 'new' ? '#2C1F14' : msg.status === 'draft' ? '#EAF3DE' : msg.status === 'sent' ? '#D4C9B0' : '#EAF3DE',
                      color: msg.status === 'new' ? '#F5F0E8' : msg.status === 'draft' ? '#0F6E56' : '#8C7B6E',
                    }}>
                      {msg.status}
                    </span>
                    <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '11px', color: '#8C7B6E' }}>
                      {new Date(msg.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '13px', color: '#4A3728', lineHeight: 1.7, marginBottom: '1rem' }}>
                  {msg.body}
                </p>

                {msg.draft_reply && (
                  <div style={{ background: '#EAF3DE', border: '0.5px solid #A8D5B5', padding: '1rem 1.25rem', marginTop: '1rem' }}>
                    <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#0F6E56', marginBottom: '8px' }}>
                      Agent Draft
                    </p>
                    <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '13px', color: '#2C1F14', lineHeight: 1.7, marginBottom: '1rem' }}>
                      {msg.draft_reply}
                    </p>

                    {msg.status !== 'sent' && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => sendReply(msg)}
                          style={{
                            background: '#2C1F14', color: '#F5F0E8',
                            border: 'none', padding: '10px 24px',
                            fontFamily: 'Jost, sans-serif', fontSize: '10px',
                            letterSpacing: '0.2em', textTransform: 'uppercase',
                            cursor: 'pointer',
                          }}
                        >
                          Send Reply
                        </button>
                        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '10px', color: '#8C7B6E', alignSelf: 'center' }}>
                          Follow-up: {msg.follow_up_at ? new Date(msg.follow_up_at).toLocaleTimeString() : '—'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem', background: '#FDFAF5', border: '0.5px solid #D4C9B0' }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 300, color: '#2C1F14', marginBottom: '1rem' }}>
              No messages yet
            </p>
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '13px', color: '#8C7B6E' }}>
              When customers send messages, they will appear here with agent drafts.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}