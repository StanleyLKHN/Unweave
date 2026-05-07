'use client'

import { useState, useRef, useEffect } from 'react'

type Message = {
  id: number
  from: 'user' | 'agent'
  text: string
  time: string
  toolStatus?: string
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const quickReplies = [
  'How does pre-order work?',
  'Tell me about zero waste',
  'What\'s in the collection?',
]

export default function ChatMessenger() {
  const [open, setOpen]             = useState(false)
  const [messages, setMessages]     = useState<Message[]>(initialMessages)
  const [input, setInput]           = useState('')
  const [streaming, setStreaming]   = useState(false)
  const [unread, setUnread]         = useState(1)
  const [email, setEmail]           = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const bottomRef                   = useRef<HTMLDivElement>(null)
  const inputRef                    = useRef<HTMLInputElement>(null)
  const emailRef                    = useRef<HTMLInputElement>(null)

  // Currently-streaming agent message (single in flight at a time).
  const [pending, setPending] = useState<Message | null>(null)

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
  }, [messages, pending])

  async function agentReply(userText: string) {
    setStreaming(true)
    const messageId = Date.now()
    setPending({ id: messageId, from: 'agent', text: '', time: now() })

    let buffer = ''
    let acc = ''
    let toolStatus: string | undefined

    try {
      const res = await fetch('/api/agents/customer-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, customerEmail: email || null }),
        credentials: 'same-origin',
      })
      if (!res.body) throw new Error('No response stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // SSE frames are separated by blank lines. Pull complete frames out;
        // anything trailing stays in the buffer for the next iteration.
        let nl
        while ((nl = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, nl)
          buffer = buffer.slice(nl + 2)
          const dataLine = frame.split('\n').find(l => l.startsWith('data: '))
          if (!dataLine) continue
          let payload: { type?: string; delta?: string; label?: string; summary?: string; message?: string }
          try { payload = JSON.parse(dataLine.slice(6)) } catch { continue }

          if (payload.type === 'text' && payload.delta) {
            acc += payload.delta
            toolStatus = undefined
            setPending({ id: messageId, from: 'agent', text: acc, time: now() })
          } else if (payload.type === 'tool_call' && payload.label) {
            toolStatus = payload.label
            setPending({ id: messageId, from: 'agent', text: acc, time: now(), toolStatus })
          } else if (payload.type === 'tool_result') {
            // Brief moment without status before next text/tool — clearing.
            toolStatus = undefined
            setPending({ id: messageId, from: 'agent', text: acc, time: now() })
          } else if (payload.type === 'error' && payload.message) {
            acc = acc || `Sorry, something went wrong: ${payload.message}`
            setPending({ id: messageId, from: 'agent', text: acc, time: now() })
          }
        }
      }
    } catch {
      acc = acc || 'Sorry, something went wrong. Please try again.'
    } finally {
      const finalText = acc || 'Sorry, I didn\'t catch that. Could you try again?'
      setMessages(prev => [...prev, { id: messageId, from: 'agent', text: finalText, time: now() }])
      setPending(null)
      setStreaming(false)
    }
  }

  function send(text?: string) {
    if (streaming) return
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
              Leave your email and we&apos;ll follow up if needed.
            </p>
            <input
              ref={emailRef}
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && EMAIL_RE.test(email) && setEmailSubmitted(true)}
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
              onClick={() => EMAIL_RE.test(email) && setEmailSubmitted(true)}
              style={{
                width: '100%',
                background: EMAIL_RE.test(email) ? 'var(--color-espresso)' : 'var(--color-sand)',
                color: 'var(--color-cream)',
                border: 'none',
                padding: '12px',
                fontFamily: 'var(--font-sans)',
                fontSize: '10px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: EMAIL_RE.test(email) ? 'pointer' : 'default',
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

              {/* Streaming agent message (live) */}
              {pending && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                    background: 'var(--color-espresso)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-serif)', fontSize: '11px', color: 'var(--color-cream)',
                  }}>U</div>
                  <div style={{ maxWidth: '78%' }}>
                    {pending.toolStatus && (
                      <p style={{
                        fontSize: '10px', color: 'var(--color-text-light)',
                        letterSpacing: '0.05em', marginBottom: '4px',
                        fontStyle: 'italic',
                      }}>{pending.toolStatus}</p>
                    )}
                    {pending.text ? (
                      <div style={{
                        padding: '10px 14px',
                        background: 'var(--color-white)',
                        color: 'var(--color-espresso)',
                        fontSize: '13px', lineHeight: '1.6', fontWeight: 300,
                        border: '0.5px solid var(--color-sand)',
                        borderRadius: '0 10px 10px 10px',
                      }}>{pending.text}<span style={{ opacity: 0.4 }}>▍</span></div>
                    ) : (
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
                    )}
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
                onKeyDown={e => e.key === 'Enter' && !streaming && send()}
                disabled={streaming}
                placeholder={streaming ? 'Agent is replying…' : 'Message Unweave...'}
                style={{
                  flex: 1,
                  border: '0.5px solid var(--color-sand)',
                  background: streaming ? 'var(--color-sand)' : 'var(--color-cream)',
                  color: 'var(--color-espresso)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  fontWeight: 300,
                  padding: '10px 14px',
                  outline: 'none',
                  opacity: streaming ? 0.6 : 1,
                }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || streaming}
                style={{
                  background: input.trim() && !streaming ? 'var(--color-espresso)' : 'var(--color-sand)',
                  border: 'none',
                  padding: '10px 14px',
                  cursor: input.trim() && !streaming ? 'pointer' : 'default',
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