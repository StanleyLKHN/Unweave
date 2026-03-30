'use client'

import Navbar from '../../components/Navbar'
import Link from 'next/link'
import { useCartStore } from '../../store/cartStore'

export default function CartPage() {
  const { items, removeItem, updateQty, total, clearCart } = useCartStore()

  return (
    <main>
      <Navbar />
      <div style={{ minHeight: '80vh', background: '#F5F0E8', padding: '3rem 1.5rem 6rem' }}>
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#7A5C45', marginBottom: '1rem' }}>Your Cart</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '42px', fontWeight: 300, color: '#2C1F14', marginBottom: '2rem' }}>
          {items.length === 0 ? 'Your cart is empty' : `${items.reduce((s, i) => s + i.quantity, 0)} item${items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}`}
        </h1>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '3rem' }}>
            <p style={{ fontSize: '14px', color: '#8C7B6E', fontWeight: 300, marginBottom: '2rem' }}>Browse the collection and reserve a piece.</p>
            <Link href="/collection" style={{ background: '#2C1F14', color: '#F5F0E8', padding: '14px 36px', textDecoration: 'none', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', fontFamily: 'Jost, sans-serif', display: 'inline-block' }}>
              Browse Collection
            </Link>
          </div>
        ) : (
          <div>
            {items.map(({ product, quantity }) => (
              <div key={product.id} style={{ background: '#FDFAF5', padding: '1.25rem', marginBottom: '1rem', border: '0.5px solid #D4C9B0', display: 'grid', gridTemplateColumns: '72px 1fr', gap: '1rem' }}>
                <div style={{ background: '#E8E0D0', aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '28px', height: '48px', background: '#4A3728', borderRadius: '14px 14px 4px 4px', opacity: 0.6 }} />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', color: '#2C1F14', marginBottom: '2px' }}>{product.name}</p>
                    <p style={{ fontSize: '10px', color: '#7A5C45', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{product.material}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '0.5px solid #D4C9B0' }}>
                      <button onClick={() => updateQty(product.id, quantity - 1)} style={{ width: '28px', height: '28px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#4A3728' }}>−</button>
                      <span style={{ width: '28px', textAlign: 'center', fontSize: '13px', color: '#2C1F14' }}>{quantity}</span>
                      <button onClick={() => updateQty(product.id, quantity + 1)} style={{ width: '28px', height: '28px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#4A3728' }}>+</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '14px', color: '#2C1F14', fontWeight: 300 }}>${(product.price * quantity).toLocaleString()}</span>
                      <button onClick={() => removeItem(product.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C7B6E' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div style={{ background: '#FDFAF5', padding: '1.5rem', border: '0.5px solid #D4C9B0', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8C7B6E' }}>Total</span>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 300, color: '#2C1F14' }}>${total().toLocaleString()}</span>
              </div>
              <Link href="/collection/oatmeal-trench-coat" style={{ background: '#2C1F14', color: '#F5F0E8', padding: '14px', textDecoration: 'none', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', fontFamily: 'Jost, sans-serif', display: 'block', textAlign: 'center', marginBottom: '10px' }}>
                Proceed to Checkout
              </Link>
              <button onClick={clearCart} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8C7B6E', fontFamily: 'Jost, sans-serif', padding: '8px' }}>
                Clear cart
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}