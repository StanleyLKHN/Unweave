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

                  {/* Image */}
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
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '60px', height: '100px',
                        background: 'var(--color-espresso-mid)',
                        borderRadius: '30px 30px 4px 4px',
                        opacity: 0.4,
                      }} />
                    )}

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