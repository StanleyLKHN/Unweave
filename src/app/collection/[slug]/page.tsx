'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Navbar from '../../../components/Navbar'
import Link from 'next/link'
import { useProduct } from '../../../hooks/useProducts'
import { useCartStore } from '../../../store/cartStore'
import CartDrawer from '../../../components/CartDrawer'
import PreorderBar from '../../../components/PreorderBar'

export default function ProductPage() {
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : ''
  const { product, loading, error } = useProduct(slug)
  const addItem = useCartStore(s => s.addItem)
  const [cartOpen, setCartOpen] = useState(false)
  const [added, setAdded] = useState(false)

  function handleAddToCart() {
    if (!product) return
    addItem(product)
    setAdded(true)
    setCartOpen(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <main>
      <Navbar />

      {/* Loading */}
      {loading && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          minHeight: '90vh', background: 'var(--color-white)',
        }}>
          <div style={{ background: 'var(--color-oatmeal)', animation: 'shimmer 1.5s ease infinite' }} />
          <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[200, 100, 300, 150].map((w, i) => (
              <div key={i} style={{ height: '20px', width: `${w}px`, background: 'var(--color-oatmeal)', animation: 'shimmer 1.5s ease infinite' }} />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ textAlign: 'center', padding: '120px 80px' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--color-espresso)', marginBottom: '8px' }}>Product not found</p>
          <Link href="/collection" className="btn-text">← Back to collection</Link>
        </div>
      )}

      {/* Product */}
      {!loading && !error && product && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '90vh', background: 'var(--color-white)' }}>

          {/* Image side */}
          <div style={{
            background: 'var(--color-oatmeal)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', minHeight: '600px', overflow: 'hidden',
          }}>
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
              />
            ) : (
              <svg width="200" height="360" viewBox="0 0 200 360" fill="none">
                <path d="M44 86 C33 134 28 224 30 332 L170 332 C172 224 167 134 156 86 C146 60 128 48 100 45 C72 48 54 60 44 86Z" fill="#C8B898"/>
                <path d="M100 48 L82 90 L100 100 L118 90Z" fill="#E8DFC8"/>
                <rect x="32" y="200" width="136" height="10" rx="5" fill="#8A7858"/>
              </svg>
            )}
            {product.is_zero_waste && (
              <div style={{
                position: 'absolute', top: '32px', left: '32px', zIndex: 1,
                background: 'var(--color-espresso)', color: 'var(--color-cream)',
                fontSize: '8px', letterSpacing: '0.25em', textTransform: 'uppercase',
                padding: '6px 14px', fontFamily: 'var(--font-sans)',
              }}>Zero Waste</div>
            )}
          </div>

          {/* Details side */}
          <div style={{
            padding: '80px 72px',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '32px' }}>
              <Link href="/collection" style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-text-light)', textDecoration: 'none' }}>
                Collection
              </Link>
              <span style={{ color: 'var(--color-sand)', fontSize: '10px' }}>›</span>
              <span style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-espresso-mid)' }}>
                {product.category}
              </span>
            </div>

            {/* Name & price */}
            <h1 style={{
              fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 3.5vw, 52px)',
              fontWeight: 300, color: 'var(--color-espresso)', lineHeight: 1.05,
              marginBottom: '16px',
            }}>{product.name}</h1>

            <p style={{
              fontFamily: 'var(--font-serif)', fontSize: '28px',
              fontWeight: 300, color: 'var(--color-espresso)', marginBottom: '32px',
            }}>${product.price.toLocaleString()}</p>

            {/* Material */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '16px 0', borderTop: '0.5px solid var(--color-sand)',
              borderBottom: '0.5px solid var(--color-sand)', marginBottom: '32px',
            }}>
              <span style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-text-light)' }}>Material</span>
              <span style={{ fontSize: '13px', color: 'var(--color-brown)', fontWeight: 300 }}>{product.material}</span>
            </div>

            {/* Description */}
            <p style={{
              fontSize: '14px', lineHeight: 1.85,
              color: 'var(--color-text-light)', fontWeight: 300, marginBottom: '48px',
            }}>{product.description}</p>

            {/* Preorder bar */}
            <PreorderBar
              product={product}
              onPreorder={() => {
                addItem(product)
                setCartOpen(true)
              }}
            />

            {/* Guarantees */}
            <div style={{
              marginTop: '48px', paddingTop: '32px',
              borderTop: '0.5px solid var(--color-sand)',
              display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
              {[
                'Lifetime repair guarantee',
                'Carbon neutral shipping',
                'End-of-life return programme',
              ].map(g => (
                <div key={g} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--color-brown)', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: 'var(--color-text-light)', fontWeight: 300 }}>{g}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </main>
  )
}