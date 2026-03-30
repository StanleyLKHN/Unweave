'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCartStore } from '../store/cartStore'
import CartDrawer from './CartDrawer'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const count = useCartStore(s => s.count)()

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-hair border-sand">
      <div className="flex items-center justify-between px-16 py-6">

        {/* Logo */}
        <Link href="/" className="font-serif text-lg font-light tracking-[0.3em] uppercase text-espresso no-underline">
          Unweave
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex gap-10 list-none">
          <li><Link href="/collection" className="nav-link">Collection</Link></li>
          <li><Link href="/try-on"     className="nav-link">Try-On</Link></li>
          <li><Link href="/process"    className="nav-link">Process</Link></li>
          <li><Link href="/school"     className="nav-link">School</Link></li>
          <li><Link href="/journal"    className="nav-link">Journal</Link></li>
        </ul>

        {/* Icons */}
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
                fontFamily: 'var(--font-sans)',
              }}>{count}</span>
            )}
          </button>

          <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

          {/* Mobile menu toggle */}
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
        <div className="md:hidden bg-white border-t border-hair border-sand px-16 py-8 flex flex-col gap-6">
          {['collection','try-on','process','school','journal'].map(link => (
            <Link key={link} href={`/${link}`} className="nav-link capitalize" onClick={() => setMenuOpen(false)}>
              {link}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}