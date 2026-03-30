'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useCartStore } from '../../../store/cartStore'

export default function CheckoutSuccessPage() {
  const clearCart = useCartStore(s => s.clearCart)

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <main style={{
      minHeight: '100vh',
      background: '#F5F0E8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Jost, sans-serif',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '480px', padding: '0 2rem' }}>

        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: '#EAF3DE',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 2rem',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#27500A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <p style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#7A5C45', marginBottom: '1rem' }}>
          Pre-order confirmed
        </p>

        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: '42px',
          fontWeight: 300, color: '#2C1F14', lineHeight: 1.1, marginBottom: '1.5rem',
        }}>
          Your piece is<br />
          <em style={{ fontStyle: 'italic', color: '#7A5C45' }}>reserved.</em>
        </h1>

        <p style={{ fontSize: '14px', lineHeight: 1.85, color: '#8C7B6E', fontWeight: 300, marginBottom: '2.5rem' }}>
          Thank you for your pre-order. Once 10 reservations are placed,
          we purchase exactly the fabric needed and begin production.
          You will receive an email when your piece ships.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <Link href="/collection" style={{
            background: '#2C1F14', color: '#F5F0E8',
            padding: '15px 36px', textDecoration: 'none',
            fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase',
            display: 'inline-block',
          }}>
            Continue Browsing
          </Link>
          <Link href="/" style={{
            color: '#4A3728', fontSize: '10px', letterSpacing: '0.2em',
            textTransform: 'uppercase', textDecoration: 'underline',
            textUnderlineOffset: '4px',
          }}>
            Back to Home
          </Link>
        </div>

        <div style={{
          marginTop: '3rem', padding: '20px 24px',
          border: '0.5px solid #D4C9B0', background: '#FDFAF5',
        }}>
          <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8C7B6E', marginBottom: '6px' }}>
            What happens next
          </p>
          <p style={{ fontSize: '13px', color: '#4A3728', lineHeight: 1.7, fontWeight: 300 }}>
            We collect pre-orders → reach 10 → buy exactly the fabric needed → send to artisan partners → ship to you. No waste at any step.
          </p>
        </div>

      </div>
    </main>
  )
}