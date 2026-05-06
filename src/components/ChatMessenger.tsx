'use client'

import { useState, useRef, useEffect } from 'react'

type Message = {
  id: number
  from: 'user' | 'agent'
  text: string
  time: string
}

const initialMessages: Message[] = [
  {
    id: 1,
    from: 'agent',
    text: 'Hi, welcome to Unweave. I\'m here to help you find the perfect zero-waste piece, answer questions about our process, or guide you through pre-ordering.',
    time: now(),
  },
]

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const quickReplies = [
  'How does pre-order work?',
  'Tell me about zero waste',
  'What\'s in the collection?',
]

export default function ChatMessenger() {
  const [open, setOpen]             = useState(false)
  const [messages, setMessages]     = useState<Message[]>(initialMessages)
  const [input, setInput]           = useState('')
  const [typing, setTyping]         = useState(false)
  const [unread, setUnread]         = useState(1)
  const [email, setEmail]           = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const bottomRef                   = useRef<HTMLDivElement>(null)
  const inputRef                    = useRef<HTMLInputElement>(null)
  const emailRef                    = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setUnread(0)
      if (!emailSubmitted) {
        setTimeout(() => emailRef.current?.focus(), 300)
      } else {
        setTimeout(() => inputRef.current?.focus(), 300)
      }
    }
  }, [open, emailSubmitted])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  async function agentReply(userText: string) {
    setTyping(true)
    try {
      const res = await fetch('/api/agents/customer-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          customerEmail: email || null,
          subject: 'Chat message',
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        id: Date.now(),
        from: 'agent',
        text: data.reply,
        time: now(),
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now(),
        from: 'agent',
        text: 'Sorry, something went wrong. Please try again.',
        time: now(),
      }])
    } finally {
      setTyping(false)
    }
  }

  function send(text?: string) {
    const msg = text ?? input.trim()
    if (!msg) return
    setInput('')
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: msg, time: now() }])
    agentReply(msg)
  }

  return (
    <>
      {/* ── CHAT PANEL ── */}
      <div style={{
        position: 'fixed',
        bottom: '96px',
        right: '32px',
        width: '360px',
        background: 'var(--color-white)',
        border: '0.5px solid var(--color-sand)',
        boxShadow: '0 24px 64px rgba(44,31,20,0.14)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 200,
        transformOrigin: 'bottom right',
        transform: open ? 'scale(1)' : 'scale(0.92)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'all' : 'none',
        transition: 'transform 0.25s ease, opacity 0.2s ease',
        maxHeight: '520px',
      }}>

        {/* Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '0.5px solid var(--color-sand)',
          background: 'var(--color-espresso)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'var(--color-brown)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-serif)', fontSize: '16px',
              color: 'var(--color-cream)', fontWeight: 300,
            }}>U</div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 400, color: 'var(--color-cream)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Unweave</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6BCB77' }} />
                <span style={{ fontSize: '10px', color: 'var(--color-sand)', letterSpacing: '0.1em' }}>Online now</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-sand)', padding: '4px' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Email gate */}
        {!emailSubmitted ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1.5rem',
            background: 'var(--color-cream)',
            gap: '1rem',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'var(--color-espresso)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--color-cream)',
            }}>U</div>
            <p style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: '22px',
              fontWeight: 300, color: 'var(--color-espresso)', textAlign: 'center',
            }}>
              Welcome to Unweave
            </p>
            <p style={{
              fontFamily: 'Jost, sans-serif', fontSize: '12px',
              color: 'var(--color-text-light)', textAlign: 'center', lineHeight: 1.6,
            }}>
              Leave your email and we'll follow up if needed.
            </p>
            <input
              ref={emailRef}
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && email.includes('@') && setEmailSubmitted(true)}
              placeholder="your@email.com"
              type="email"
              style={{
                width: '100%',
                border: '0.5px solid var(--color-sand)',
                background: 'var(--color-white)',
                color: 'var(--color-espresso)',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                padding: '10px 14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={() => email.includes('@') && setEmailSubmitted(true)}
              style={{
                width: '100%',
                background: email.includes('@') ? 'var(--color-espresso)' : 'var(--color-sand)',
                color: 'var(--color-cream)',
                border: 'none',
                padding: '12px',
                fontFamily: 'var(--font-sans)',
                fontSize: '10px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: email.includes('@') ? 'pointer' : 'default',
                transition: 'background 0.2s',
              }}
            >
              Start Chat
            </button>
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '10px', color: 'var(--color-text-light)' }}>
              or{' '}
              <span
                onClick={() => setEmailSubmitted(true)}
                style={{ textDecoration: 'underline', cursor: 'pointer' }}
              >
                continue anonymously
              </span>
            </p>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: 'var(--color-cream)',
            }}>
              {email && (
                <p style={{
                  fontFamily: 'Jost, sans-serif', fontSize: '10px',
                  color: 'var(--color-text-light)', textAlign: 'center',
                  letterSpacing: '0.05em',
                }}>
                  Chatting as {email}
                </p>
              )}

              {messages.map(m => (
                <div key={m.id} style={{
                  display: 'flex',
                  flexDirection: m.from === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  gap: '8px',
                }}>
                  {m.from === 'agent' && (
                    <div style={{
                      width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                      background: 'var(--color-espresso)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-serif)', fontSize: '11px', color: 'var(--color-cream)',
                    }}>U</div>
                  )}
                  <div style={{ maxWidth: '78%' }}>
                    <div style={{
                      padding: '10px 14px',
                      background: m.from === 'agent' ? 'var(--color-white)' : 'var(--color-espresso)',
                      color: m.from === 'agent' ? 'var(--color-espresso)' : 'var(--color-cream)',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      fontWeight: 300,
                      border: m.from === 'agent' ? '0.5px solid var(--color-sand)' : 'none',
                      borderRadius: m.from === 'agent' ? '0 10px 10px 10px' : '10px 0 10px 10px',
                    }}>{m.text}</div>
                    <p style={{
                      fontSize: '10px', color: 'var(--color-text-light)',
                      marginTop: '4px', letterSpacing: '0.05em',
                      textAlign: m.from === 'user' ? 'right' : 'left',
                    }}>{m.time}</p>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {typing && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%',
                    background: 'var(--color-espresso)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-serif)', fontSize: '11px', color: 'var(--color-cream)',
                  }}>U</div>
                  <div style={{
                    padding: '10px 16px',
                    background: 'var(--color-white)',
                    border: '0.5px solid var(--color-sand)',
                    borderRadius: '0 10px 10px 10px',
                    display: 'flex', gap: '4px', alignItems: 'center',
                  }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: 'var(--color-text-light)',
                        animation: 'typingBounce 1.2s ease infinite',
                        animationDelay: `${i * 0.2}s`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies */}
            {messages.length <= 2 && (
              <div style={{
                padding: '10px 16px',
                borderTop: '0.5px solid var(--color-sand)',
                background: 'var(--color-white)',
                display: 'flex', flexWrap: 'wrap', gap: '6px',
              }}>
                {quickReplies.map(q => (
                  <button key={q} onClick={() => send(q)} style={{
                    background: 'none',
                    border: '0.5px solid var(--color-sand)',
                    color: 'var(--color-espresso-mid)',
                    fontSize: '10px',
                    letterSpacing: '0.05em',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    borderRadius: '20px',
                    fontFamily: 'var(--font-sans)',
                  }}>{q}</button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{
              padding: '14px 16px',
              borderTop: '0.5px solid var(--color-sand)',
              background: 'var(--color-white)',
              display: 'flex', gap: '10px', alignItems: 'center',
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Message Unweave..."
                style={{
                  flex: 1,
                  border: '0.5px solid var(--color-sand)',
                  background: 'var(--color-cream)',
                  color: 'var(--color-espresso)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  fontWeight: 300,
                  padding: '10px 14px',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim()}
                style={{
                  background: input.trim() ? 'var(--color-espresso)' : 'var(--color-sand)',
                  border: 'none',
                  padding: '10px 14px',
                  cursor: input.trim() ? 'pointer' : 'default',
                  transition: 'background 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-cream)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── FLOATING BUTTON ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--color-espresso)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 201,
          boxShadow: '0 8px 32px rgba(44,31,20,0.25)',
          transition: 'transform 0.2s, background 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        aria-label="Open chat"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-cream)" strokeWidth="1.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-cream)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}

        {!open && unread > 0 && (
          <div style={{
            position: 'absolute',
            top: '2px', right: '2px',
            width: '18px', height: '18px',
            borderRadius: '50%',
            background: '#E05A3A',
            color: 'white',
            fontSize: '10px',
            fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--color-cream)',
          }}>{unread}</div>
        )}
      </button>

      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  )
}