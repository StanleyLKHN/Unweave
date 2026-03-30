'use client'

import { useState } from 'react'
import { useCartStore } from '../store/cartStore'

type Props = {
  open: boolean
  onClose: () => void
}

export default function CartDrawer({ open, onClose }: Props) {
  const { items, removeItem, updateQty, total, clearCart } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleCheckout() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            name:     i.product.name,
            price:    i.product.price,
            quantity: i.quantity,
            image:    i.product.images?.[0],
          })),
          successUrl: `${window.location.origin}/checkout/success`,
          cancelUrl:  `${window.location.origin}/collection`,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      window.location.href = data.url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(44,31,20,0.35)',
          zIndex: 300,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
          transition: 'opacity 0.3s',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '420px',
        background: 'var(--color-white)',
        zIndex: 301,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
        borderLeft: '0.5px solid var(--color-sand)',
      }}>

        {/* Header */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '0.5px solid var(--color-sand)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{
              fontFamily: 'var(--font-serif)', fontSize: '22px',
              fontWeight: 300, color: 'var(--color-espresso)',
            }}>Your Cart</p>
            <p style={{ fontSize: '11px', color: 'var(--color-text-light)', letterSpacing: '0.1em', marginTop: '2px' }}>
              {items.length === 0 ? 'Empty' : `${items.reduce((s, i) => s + i.quantity, 0)} item${items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-espresso-mid)', padding: '4px',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: '80px' }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--color-espresso)', marginBottom: '8px' }}>
                Nothing here yet.
              </p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-light)', fontWeight: 300 }}>
                Add pieces from the collection.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {items.map(({ product, quantity }) => (
                <div key={product.id} style={{
                  display: 'grid', gridTemplateColumns: '80px 1fr',
                  gap: '16px', paddingBottom: '24px',
                  borderBottom: '0.5px solid var(--color-sand)',
                }}>
                  {/* Thumbnail */}
                  <div style={{
                    background: 'var(--color-oatmeal)',
                    aspectRatio: '3/4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      width: '32px', height: '56px',
                      background: 'var(--color-espresso-mid)',
                      borderRadius: '16px 16px 4px 4px',
                      opacity: 0.7,
                    }} />
                  </div>

                  {/* Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{
                        fontFamily: 'var(--font-serif)', fontSize: '16px',
                        color: 'var(--color-espresso)', marginBottom: '4px',
                      }}>{product.name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--color-brown)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {product.material}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                      {/* Quantity */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: '0.5px solid var(--color-sand)' }}>
                        <button
                          onClick={() => updateQty(product.id, quantity - 1)}
                          style={{
                            width: '28px', height: '28px', background: 'none', border: 'none',
                            cursor: 'pointer', color: 'var(--color-espresso-mid)',
                            fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >−</button>
                        <span style={{ width: '28px', textAlign: 'center', fontSize: '13px', color: 'var(--color-espresso)' }}>
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQty(product.id, quantity + 1)}
                          style={{
                            width: '28px', height: '28px', background: 'none', border: 'none',
                            cursor: 'pointer', color: 'var(--color-espresso-mid)',
                            fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >+</button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <p style={{ fontSize: '14px', color: 'var(--color-espresso)', fontWeight: 300 }}>
                          ${(product.price * quantity).toLocaleString()}
                        </p>
                        <button
                          onClick={() => removeItem(product.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)', padding: '2px' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{
            padding: '24px 28px',
            borderTop: '0.5px solid var(--color-sand)',
            background: 'var(--color-white)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-text-light)' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 300, color: 'var(--color-espresso)' }}>
                ${total().toLocaleString()}
              </span>
            </div>

            {error && (
              <p style={{ fontSize: '12px', color: '#E24B4A', marginBottom: '12px', textAlign: 'center' }}>
                {error}
              </p>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%', textAlign: 'center',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              {loading ? 'Redirecting...' : 'Proceed to Checkout'}
            </button>
            <button
              onClick={clearCart}
              style={{
                width: '100%', marginTop: '10px', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: '10px', letterSpacing: '0.2em',
                textTransform: 'uppercase', color: 'var(--color-text-light)',
                fontFamily: 'var(--font-sans)', padding: '8px',
              }}
            >Clear cart</button>
          </div>
        )}
      </div>
    </>
  )
}