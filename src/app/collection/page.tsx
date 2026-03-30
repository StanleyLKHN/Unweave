'use client'

import { useState } from 'react'
import Navbar from '../../components/Navbar'
import Link from 'next/link'
import { useProducts } from '../../hooks/useProducts'
import PreorderBar from '../../components/PreorderBar'

const categories = [
  { label: 'All',         value: undefined },
  { label: 'Outerwear',   value: 'outerwear' },
  { label: 'Dresses',     value: 'dresses' },
  { label: 'Sets',        value: 'sets' },
  { label: 'Accessories', value: 'accessories' },
]

export default function CollectionPage() {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined)
  const { products, loading, error } = useProducts(activeCategory)

  return (
    <main>
      <Navbar />

      {/* Header */}
      <div style={{
        background: 'var(--color-white)',
        borderBottom: '0.5px solid var(--color-sand)',
        padding: '64px 80px 48px',
      }}>
        <span className="section-tag">Zero Waste Collection</span>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(40px, 5vw, 68px)',
          fontWeight: 300,
          color: 'var(--color-espresso)',
          lineHeight: 1.0,
          marginBottom: '32px',
        }}>
          Every piece.<br /><em style={{ fontStyle: 'italic', color: 'var(--color-brown)' }}>Zero</em> off-cuts.
        </h1>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(cat.value)}
              style={{
                background: activeCategory === cat.value ? 'var(--color-espresso)' : 'transparent',
                color: activeCategory === cat.value ? 'var(--color-cream)' : 'var(--color-espresso-mid)',
                border: '0.5px solid',
                borderColor: activeCategory === cat.value ? 'var(--color-espresso)' : 'var(--color-sand)',
                padding: '8px 20px',
                fontSize: '10px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.2s',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div style={{ padding: '56px 80px', background: 'var(--color-cream)' }}>

        {/* Loading state */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '28px' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div style={{
                  background: 'var(--color-oatmeal)',
                  aspectRatio: '3/4',
                  marginBottom: '14px',
                  animation: 'shimmer 1.5s ease infinite',
                }} />
                <div style={{ height: '16px', background: 'var(--color-oatmeal)', width: '70%', marginBottom: '8px', animation: 'shimmer 1.5s ease infinite' }} />
                <div style={{ height: '12px', background: 'var(--color-oatmeal)', width: '40%', animation: 'shimmer 1.5s ease infinite' }} />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-light)' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', marginBottom: '8px' }}>Something went wrong</p>
            <p style={{ fontSize: '13px' }}>{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && products.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--color-espresso)', marginBottom: '8px' }}>
              No pieces in this category yet.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>Check back soon — the collection is growing.</p>
          </div>
        )}

        {/* Products */}
        {!loading && !error && products.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '28px' }}>
            {products.map(product => (
              <Link
                key={product.id}
                href={`/collection/${product.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="product-card-hover" style={{ cursor: 'pointer' }}>

                  {/* Image placeholder */}
                  <div style={{
                    background: 'var(--color-oatmeal)',
                    aspectRatio: '3/4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '14px',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'background 0.3s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-sand)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-oatmeal)')}
                  >
                    {/* Garment silhouette by category */}
                    {product.category === 'outerwear' && (
                      <svg width="90" height="160" viewBox="0 0 90 160" fill="none">
                        <path d="M20 38 C15 60 12 100 13 148 L77 148 C78 100 75 60 70 38 C65 26 57 20 45 18 C33 20 25 26 20 38Z" fill="#4A3728" opacity="0.75"/>
                        <path d="M45 20 L36 42 L45 48 L54 42Z" fill="#2C1F14" opacity="0.7"/>
                        <rect x="15" y="88" width="60" height="5" rx="2.5" fill="#2C1F14" opacity="0.4"/>
                      </svg>
                    )}
                    {product.category === 'dresses' && (
                      <svg width="75" height="155" viewBox="0 0 75 155" fill="none">
                        <path d="M16 30 Q18 75 14 148 L61 148 Q57 75 59 30 Q51 18 37 16 Q23 18 16 30Z" fill="#7A5C45" opacity="0.7"/>
                        <path d="M16 30 Q26 42 37 38 Q48 42 59 30" fill="none" stroke="#6B4C35" strokeWidth="0.8"/>
                      </svg>
                    )}
                    {product.category === 'sets' && (
                      <svg width="100" height="150" viewBox="0 0 100 150" fill="none">
                        <path d="M18 32 C14 55 12 90 13 132 L50 132 L50 68 L52 68 L52 132 L88 132 C89 90 87 55 83 32 C78 22 68 16 50 14 C32 16 22 22 18 32Z" fill="#2C1F14" opacity="0.75"/>
                        <path d="M50 16 L40 38 L50 44 L60 38Z" fill="#1E1108" opacity="0.7"/>
                      </svg>
                    )}
                    {product.category === 'accessories' && (
                      <svg width="120" height="88" viewBox="0 0 120 88" fill="none">
                        <rect x="8" y="16" width="104" height="60" rx="12" fill="#8C7B6E" opacity="0.75"/>
                        <path d="M36 16 Q60 4 84 16" stroke="#C8B89A" strokeWidth="2" strokeLinecap="round" fill="none"/>
                        <rect x="20" y="28" width="80" height="38" rx="8" fill="#7A6A5A" opacity="0.5"/>
                      </svg>
                    )}

                    {/* Zero waste badge */}
                    {product.is_zero_waste && (
                      <div style={{
                        position: 'absolute', top: '12px', left: '12px',
                        background: 'var(--color-espresso)',
                        color: 'var(--color-cream)',
                        fontSize: '8px', letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        padding: '4px 10px',
                        fontFamily: 'var(--font-sans)',
                      }}>
                        Zero Waste
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <p style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '18px',
                    fontWeight: 400,
                    color: 'var(--color-espresso)',
                    marginBottom: '4px',
                  }}>{product.name}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-light)', fontWeight: 300 }}>
                      ${product.price.toLocaleString()}
                    </span>
                    <span style={{
                      fontSize: '9px', letterSpacing: '0.15em',
                      textTransform: 'uppercase', color: 'var(--color-brown)',
                    }}>
                      {product.material}
                    </span>
                  </div>
                  <PreorderBar product={product} size="sm" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </main>
  )
}