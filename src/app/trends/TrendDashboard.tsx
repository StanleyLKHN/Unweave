'use client'

// =========================================================================
// TrendDashboard
//
// Client component. Displays the most recent trend report and runs the
// "Generate new report" streaming flow against /api/agents/agent2/generate.
// =========================================================================

import { useRouter } from 'next/navigation'
import { useState, useRef } from 'react'

export type TrendHighlight = {
  title: string
  description: string
  source_urls?: string[]
}

export type Report = {
  id: string
  generated_at: string
  model: string
  summary: string
  trend_highlights: TrendHighlight[]
  brand_implications: string
  next_week_focus: string
  citations: string[]
}

export type ProductContent = {
  id: string
  product_slug: string
  product_name: string
  social_caption: string
  email_blurb: string
  expanded_description: string
}

type StatusEntry = { id: number; label: string; kind: 'status' | 'search' | 'tool' | 'result' | 'error' }

type Props = {
  initialReport: Report | null
  initialProductContent: ProductContent[]
}

export default function TrendDashboard({ initialReport, initialProductContent }: Props) {
  const router = useRouter()

  const [running, setRunning] = useState(false)
  const [statuses, setStatuses] = useState<StatusEntry[]>([])
  const idRef = useRef(0)

  function pushStatus(kind: StatusEntry['kind'], label: string) {
    idRef.current += 1
    setStatuses(prev => [...prev, { id: idRef.current, kind, label }])
  }

  async function generate() {
    if (running) return
    setRunning(true)
    setStatuses([])

    try {
      const res = await fetch('/api/agents/agent2/generate', { method: 'POST' })
      if (!res.body) throw new Error('No response stream')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let nl
        while ((nl = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, nl)
          buffer = buffer.slice(nl + 2)
          const dataLine = frame.split('\n').find(l => l.startsWith('data: '))
          if (!dataLine) continue
          let p: { type?: string; label?: string; query?: string; name?: string; summary?: string; reportId?: string; message?: string }
          try { p = JSON.parse(dataLine.slice(6)) } catch { continue }

          if (p.type === 'status' && p.label) pushStatus('status', p.label)
          else if (p.type === 'search' && p.query) pushStatus('search', `Searching: "${p.query}"`)
          else if (p.type === 'tool_use' && p.label) pushStatus('tool', p.label)
          else if (p.type === 'tool_result' && p.summary) pushStatus('result', `✓ ${p.summary}`)
          else if (p.type === 'error' && p.message) pushStatus('error', `✗ ${p.message}`)
          else if (p.type === 'done') {
            pushStatus('result', '✓ Report saved.')
            // Re-fetch the page so the new report renders.
            router.refresh()
          }
        }
      }
    } catch (err) {
      pushStatus('error', `✗ ${err instanceof Error ? err.message : 'unknown error'}`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F5F0E8', padding: '3rem 2rem 6rem' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', gap: '1rem' }}>
          <div>
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#7A5C45', marginBottom: '8px' }}>
              Agent · Trend Intelligence
            </p>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '52px', fontWeight: 300, color: '#2C1F14', lineHeight: 1, marginBottom: '12px' }}>
              This week&apos;s read
            </h1>
            {initialReport && (
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '12px', color: '#8C7B6E', letterSpacing: '0.05em' }}>
                Generated {new Date(initialReport.generated_at).toLocaleString()} · {initialReport.model}
              </p>
            )}
          </div>
          <button
            onClick={generate}
            disabled={running}
            style={{
              background: running ? '#8C7B6E' : '#2C1F14',
              color: '#F5F0E8',
              border: 'none',
              padding: '14px 28px',
              fontFamily: 'Jost, sans-serif',
              fontSize: '10px',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              cursor: running ? 'wait' : 'pointer',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            {running ? 'Generating…' : initialReport ? 'Generate new report' : 'Run first report'}
          </button>
        </div>

        {/* ── Live status feed (only while running) ── */}
        {(running || statuses.length > 0) && (
          <div style={{
            background: '#FDFAF5',
            border: '0.5px solid #D4C9B0',
            padding: '1.25rem 1.5rem',
            marginBottom: '2.5rem',
            fontFamily: 'JetBrains Mono, ui-monospace, monospace',
            fontSize: '12px',
            color: '#4A3728',
          }}>
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7A5C45', marginBottom: '12px' }}>
              Agent activity
            </p>
            {statuses.map(s => (
              <div key={s.id} style={{ marginBottom: '4px', color: s.kind === 'error' ? '#A83232' : s.kind === 'result' ? '#0F6E56' : '#4A3728' }}>
                {s.label}
              </div>
            ))}
            {running && <Cursor />}
          </div>
        )}

        {!initialReport ? (
          <EmptyState />
        ) : (
          <ReportView report={initialReport} productContent={initialProductContent} />
        )}
      </div>
    </main>
  )
}

// =========================================================================
// Sub-components
// =========================================================================

function Cursor() {
  return (
    <span style={{ display: 'inline-block', animation: 'blink 1s steps(1) infinite' }}>
      ▍
      <style>{`@keyframes blink { 50% { opacity: 0 } }`}</style>
    </span>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#FDFAF5', border: '0.5px solid #D4C9B0' }}>
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', fontWeight: 300, color: '#2C1F14', marginBottom: '1rem' }}>
        No report yet
      </p>
      <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '13px', color: '#8C7B6E', maxWidth: '440px', margin: '0 auto', lineHeight: 1.7 }}>
        Click <strong>Run first report</strong> above. The agent will pull the catalog,
        search the web for current fashion signal, and produce a structured weekly read
        with social, email, and product-page copy.
      </p>
    </div>
  )
}

function ReportView({ report, productContent }: { report: Report; productContent: ProductContent[] }) {
  return (
    <>
      {/* Summary */}
      <Section label="Summary">
        <p style={paragraphStyle}>{report.summary}</p>
      </Section>

      {/* Trend highlights */}
      <Section label={`Trends · ${report.trend_highlights.length}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {report.trend_highlights.map((t, i) => (
            <div key={i} style={{ background: '#FDFAF5', border: '0.5px solid #D4C9B0', padding: '1.5rem 1.75rem' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', fontWeight: 400, color: '#2C1F14', marginBottom: '8px' }}>
                {t.title}
              </h3>
              <p style={{ ...paragraphStyle, marginBottom: t.source_urls?.length ? '12px' : 0 }}>{t.description}</p>
              {!!t.source_urls?.length && (
                <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '11px', color: '#7A5C45', letterSpacing: '0.03em' }}>
                  {t.source_urls.map((u, j) => (
                    <span key={u}>
                      {j > 0 && ' · '}
                      <a href={u} target="_blank" rel="noopener noreferrer" style={{ color: '#7A5C45', textDecoration: 'underline', textUnderlineOffset: '2px' }}>
                        {hostname(u)}
                      </a>
                    </span>
                  ))}
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Brand implications */}
      <Section label="What this means for Unweave">
        <p style={paragraphStyle}>{report.brand_implications}</p>
      </Section>

      {/* Next week focus */}
      <Section label="Next week focus">
        <p style={paragraphStyle}>{report.next_week_focus}</p>
      </Section>

      {/* Per-product content */}
      <Section label={`Product content · ${productContent.length}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {productContent.map(pc => (
            <div key={pc.id} style={{ background: '#FDFAF5', border: '0.5px solid #D4C9B0', padding: '1.5rem 1.75rem' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 400, color: '#2C1F14', marginBottom: '14px' }}>
                {pc.product_name}
              </h3>
              <CopyBlock label="Social caption"        value={pc.social_caption} />
              <CopyBlock label="Email blurb"           value={pc.email_blurb} />
              <CopyBlock label="Expanded description"  value={pc.expanded_description} last />
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <p style={{
        fontFamily: 'Jost, sans-serif', fontSize: '10px',
        letterSpacing: '0.3em', textTransform: 'uppercase',
        color: '#7A5C45', marginBottom: '12px',
      }}>
        {label}
      </p>
      {children}
    </section>
  )
}

function CopyBlock({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const [copied, setCopied] = useState(false)
  return (
    <div style={{ marginBottom: last ? 0 : '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#8C7B6E' }}>
          {label}
        </p>
        <button
          onClick={() => {
            navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 1400)
          }}
          style={{
            background: 'none', border: '0.5px solid #D4C9B0',
            color: copied ? '#0F6E56' : '#7A5C45',
            fontFamily: 'Jost, sans-serif', fontSize: '9px',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            padding: '4px 10px', cursor: 'pointer',
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p style={{ ...paragraphStyle, marginBottom: 0 }}>{value || <em style={{ color: '#8C7B6E' }}>(empty)</em>}</p>
    </div>
  )
}

const paragraphStyle: React.CSSProperties = {
  fontFamily: 'Jost, sans-serif',
  fontSize: '14px',
  fontWeight: 300,
  lineHeight: 1.75,
  color: '#2C1F14',
  marginBottom: '8px',
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
