'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useCartStore } from '../store/cartStore'
import CartDrawer from './CartDrawer'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [showInstall, setShowInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const count = useCartStore(s => s.count)()

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)
    setShowInstall(true)

    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (isIOS) { setShowIOSGuide(true); setMenuOpen(false); return }
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setShowInstall(false)
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-hair border-sand">
        <div className="hidden md:flex items-center justify-between px-16 py-6">

          <Link href="/" className="font-serif text-lg font-light tracking-[0.3em] uppercase text-espresso no-underline">
            Unweave
          </Link>

          <ul className="hidden md:flex gap-10 list-none">
            <li><Link href="/collection" className="nav-link">Collection</Link></li>
            <li><Link href="/try-on"     className="nav-link">Try-On</Link></li>
            <li><Link href="/school"     className="nav-link">School</Link></li>
            <li><Link href="/journal"    className="nav-link">Journal</Link></li>
          </ul>

          <div className="flex items-center gap-6">
            <button aria-label="Search" className="text-espresso-mid hover:text-espresso transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
            <button aria-label="Wishlist" className="text-espresso-mid hover:text-espresso transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            <button aria-label="Cart" onClick={() => setCartOpen(true)} className="text-espresso-mid hover:text-espresso transition-colors" style={{ position: 'relative' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              {count > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-6px',
                  background: 'var(--color-espresso)', color: 'var(--color-cream)',
                  borderRadius: '50%', width: '16px', height: '16px',
                  fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{count}</span>
              )}
            </button>

            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

            <button
              className="md:hidden text-espresso-mid hover:text-espresso"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                {menuOpen
                  ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                  : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-hair border-sand px-6 py-8 flex flex-col gap-6">
            {['collection', 'school', 'journal'].map(link => (
              <Link key={link} href={`/${link}`} className="nav-link capitalize" onClick={() => setMenuOpen(false)}>
                {link}
              </Link>
            ))}

            {/* Install button in mobile menu */}
            {showInstall && (
              <button
                onClick={(e) => { e.stopPropagation(); handleInstall() }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: 'var(--color-espresso)', color: 'var(--color-cream)',
                  border: 'none', padding: '12px 20px', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: '10px',
                  letterSpacing: '0.2em', textTransform: 'uppercase',
                  width: '100%', marginTop: '8px',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v13M7 11l5 5 5-5"/><path d="M3 18v2a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-2"/>
                </svg>
                Install App
              </button>
            )}
          </div>
        )}
      </nav>

      {/* iOS Guide modal */}
      {showIOSGuide && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(44,31,20,0.5)',
            zIndex: 500,
            display: 'flex', alignItems: 'flex-end',
          }}
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            style={{ background: '#FDFAF5', width: '100%', padding: '2rem 1.5rem 3rem', borderRadius: '16px 16px 0 0' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 300, color: '#2C1F14' }}>
                Install Unweave
              </p>
              <button onClick={() => setShowIOSGuide(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: '#8C7B6E' }}>×</button>
            </div>
            {[
              { step: '1', text: 'Tap the Share button', sub: 'Square with arrow ↑ at the bottom of Safari' },
              { step: '2', text: 'Tap "Add to Home Screen"', sub: 'Scroll down in the share menu' },
              { step: '3', text: 'Tap "Add"', sub: 'Unweave appears on your home screen' },
            ].map(({ step, text, sub }) => (
              <div key={step} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: '#2C1F14', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#F5F0E8', fontSize: '12px',
                }}>{step}</div>
                <div>
                  <p style={{ fontSize: '14px', color: '#2C1F14', marginBottom: '2px' }}>{text}</p>
                  <p style={{ fontSize: '12px', color: '#8C7B6E', fontWeight: 300 }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}