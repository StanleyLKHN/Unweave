'use client'

import { useState, useEffect } from 'react'

export default function InstallBanner() {
  const [show, setShow]       = useState(false)
  const [isIOS, setIsIOS]     = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [installed, setInstalled] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    if (ios) {
      // Show iOS banner after 3 seconds
      const timer = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(timer)
    }

    // Android/Chrome — listen for install prompt
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (isIOS) {
      setShowIOSGuide(true)
      return
    }
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShow(false)
      setInstalled(true)
    }
    setDeferredPrompt(null)
  }

  if (installed || !show) return null

  return (
    <>
      {/* iOS step-by-step guide */}
      {showIOSGuide && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(44,31,20,0.5)',
          zIndex: 500,
          display: 'flex', alignItems: 'flex-end',
        }}
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            style={{
              background: '#FDFAF5',
              width: '100%',
              padding: '2rem 1.5rem 3rem',
              borderRadius: '16px 16px 0 0',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 300, color: '#2C1F14' }}>
                Add to Home Screen
              </p>
              <button onClick={() => setShowIOSGuide(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#8C7B6E' }}>×</button>
            </div>

            {[
              { step: '1', text: 'Tap the Share button', sub: 'The square with an arrow at the bottom of Safari' },
              { step: '2', text: 'Scroll down and tap', sub: '"Add to Home Screen"' },
              { step: '3', text: 'Tap "Add"', sub: 'Unweave will appear on your home screen' },
            ].map(({ step, text, sub }) => (
              <div key={step} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: '#2C1F14', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#F5F0E8', fontSize: '12px', fontWeight: 400,
                  fontFamily: 'Jost, sans-serif',
                }}>{step}</div>
                <div>
                  <p style={{ fontSize: '14px', color: '#2C1F14', fontWeight: 400, marginBottom: '2px' }}>{text}</p>
                  <p style={{ fontSize: '12px', color: '#8C7B6E', fontWeight: 300 }}>{sub}</p>
                </div>
              </div>
            ))}

            {/* Share icon illustration */}
            <div style={{ textAlign: 'center', marginTop: '1rem', padding: '1rem', background: '#F5F0E8', borderRadius: '8px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7A5C45" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              <p style={{ fontSize: '11px', color: '#8C7B6E', marginTop: '6px', letterSpacing: '0.1em' }}>Tap this icon in Safari</p>
            </div>
          </div>
        </div>
      )}

      {/* Install banner */}
      <div style={{
        position: 'fixed',
        bottom: '90px',
        left: '16px',
        right: '16px',
        background: '#2C1F14',
        padding: '16px 20px',
        zIndex: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        boxShadow: '0 8px 32px rgba(44,31,20,0.3)',
        borderRadius: '2px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '8px',
            background: '#F5F0E8', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Cormorant Garamond, serif', fontSize: '22px',
            color: '#2C1F14', fontWeight: 300,
          }}>U</div>
          <div>
            <p style={{ fontSize: '13px', color: '#F5F0E8', fontWeight: 400, marginBottom: '2px' }}>Install Unweave</p>
            <p style={{ fontSize: '11px', color: '#D4C9B0', fontWeight: 300 }}>Add to your home screen</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => setShow(false)}
            style={{
              background: 'none', border: '0.5px solid #4A3728',
              color: '#8C7B6E', padding: '8px 14px',
              fontSize: '10px', letterSpacing: '0.15em',
              textTransform: 'uppercase', cursor: 'pointer',
              fontFamily: 'Jost, sans-serif',
            }}
          >Later</button>
          <button
            onClick={handleInstall}
            style={{
              background: '#F5F0E8', border: 'none',
              color: '#2C1F14', padding: '8px 16px',
              fontSize: '10px', letterSpacing: '0.15em',
              textTransform: 'uppercase', cursor: 'pointer',
              fontFamily: 'Jost, sans-serif', fontWeight: 400,
            }}
          >Install</button>
        </div>
      </div>
    </>
  )
}