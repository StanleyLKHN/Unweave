import Navbar from '../components/Navbar'
import Link from 'next/link'
import { products as allProducts } from '../lib/products-data'
import type { Product } from '../lib/types'

const steps = [
  { num: '01', title: 'You reserve.', desc: 'No payment yet. Just your commitment that this piece deserves to exist.' },
  { num: '02', title: 'Ten people agree.', desc: 'Once 10 reservations are placed, the run is confirmed. Not before.' },
  { num: '03', title: 'We buy the fabric.', desc: 'Exactly what\'s needed. Down to the last centimetre. From certified deadstock mills.' },
  { num: '04', title: 'Artisans make it.', desc: 'Handcrafted by partners who are paid fairly, named on your garment\'s passport.' },
  { num: '05', title: 'It comes to you.', desc: 'One piece. Made for you. Carbon-neutral shipping. Zero leftovers.' },
]

const manifesto = [
  'Fashion doesn\'t have a waste problem.',
  'It has a timing problem.',
  'The industry makes clothes before anyone wants them.',
  'Then discards what\'s left.',
  'We reversed the order.',
  'You want it first. Then we make it.',
  'That\'s the whole model.',
]

export default function HomePage() {
  const items: Product[] = allProducts
    .filter(p => p.in_stock)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 4)

  return (
    <main>
      <Navbar />

      {/* HERO */}
      <section className="hero-section" style={{ height: '70svh', minHeight: '500px', maxHeight: '800px', background: '#2C1F14', display: 'flex', position: 'relative', overflow: 'hidden' }}>

        {/* Left column — text */}
        <div className="hero-left" style={{ width: '50%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 'clamp(2rem,4vw,4rem)', position: 'relative', zIndex: 2 }}>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '10px', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#7A5C45', marginBottom: '1.5rem', fontWeight: 400 }}>
            Pre-order fashion
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(40px,5.5vw,76px)', fontWeight: 300, lineHeight: 0.95, color: '#F5F0E8', marginBottom: '1.5rem', letterSpacing: '-1px' }}>
            Nothing is made<br />
            until someone<br />
            <em style={{ fontStyle: 'italic', color: '#D4C9B0' }}>wants it.</em>
          </h1>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 'clamp(13px,1.2vw,14px)', lineHeight: 1.7, color: '#8C7B6E', maxWidth: '360px', marginBottom: '2rem', fontWeight: 300 }}>
            Unweave is a zero-waste fashion label built on one rule — we only produce what has already been reserved. Ten pre-orders. Then we buy the fabric. Not before.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <Link href="/collection" style={{ background: '#F5F0E8', color: '#2C1F14', padding: '14px 36px', textDecoration: 'none', fontFamily: 'Jost, sans-serif', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 400 }}>
              See Open Pre-orders
            </Link>
            <span style={{ fontFamily: 'Jost, sans-serif', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4A3728', fontWeight: 300 }}>
              No charge until production begins
            </span>
          </div>
        </div>

        {/* Right column — image */}
        <div className="hero-right" style={{ width: '50%', position: 'relative', overflow: 'hidden' }}>
          <img
            src="/products/oatmeal-trench.png"
            alt="Unweave"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block', opacity: 0.85, position: 'absolute', inset: 0 }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #2C1F14 0%, transparent 40%)' }} />
          <div style={{ position: 'absolute', bottom: '2rem', right: '2rem', background: 'rgba(44,31,20,0.88)', padding: '1.25rem 1.75rem', borderLeft: '2px solid #7A5C45', zIndex: 2 }}>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', fontWeight: 300, color: '#F5F0E8', lineHeight: 1 }}>7 / 10</p>
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7A5C45', marginTop: '4px' }}>Reserved — 3 spots left</p>
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '11px', color: '#D4C9B0', marginTop: '6px', fontWeight: 300 }}>Oatmeal Trench · $2,450</p>
          </div>
        </div>

      </section>

      {/* TICKER */}
      <div style={{ background: '#F5F0E8', borderBottom: '0.5px solid #D4C9B0', borderTop: '0.5px solid #D4C9B0', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-flex', gap: '4rem', padding: '1rem 2rem', animation: 'ticker 24s linear infinite' }}>
          {[...manifesto, ...manifesto].map((line, i) => (
            <span key={i} style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '15px', fontWeight: 300, fontStyle: 'italic', color: '#4A3728', flexShrink: 0 }}>
              {line}
            </span>
          ))}
        </div>
        <style>{`@keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }`}</style>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', background: '#FDFAF5', borderBottom: '0.5px solid #D4C9B0' }}>
        {[
          { num: '10',   label: 'Reservations to trigger production' },
          { num: '0',    label: 'Items ever made without a buyer' },
          { num: '100%', label: 'On-demand, no surplus, no waste' },
          { num: '∞',    label: 'Pieces returned, repaired, reborn' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '2.5rem 2rem', textAlign: 'center', borderRight: i < 3 ? '0.5px solid #D4C9B0' : 'none' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '44px', fontWeight: 300, color: '#2C1F14', lineHeight: 1 }}>{s.num}</div>
            <div style={{ fontFamily: 'Jost, sans-serif', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8C7B6E', marginTop: '8px', lineHeight: 1.4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* COLLECTION */}
      <section style={{ padding: 'clamp(3rem,6vw,6rem) clamp(1.5rem,5vw,5rem)', background: '#FDFAF5' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#7A5C45', marginBottom: '0.75rem' }}>Open for reservation</p>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(32px,4vw,52px)', fontWeight: 300, color: '#2C1F14', lineHeight: 1.05 }}>The Collection</h2>
          </div>
          <Link href="/collection" style={{ fontFamily: 'Jost, sans-serif', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7A5C45', textDecoration: 'none', borderBottom: '0.5px solid #7A5C45', paddingBottom: '2px' }}>
            View all pieces →
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1.5rem' }}>
          {items.map((p) => (
            <Link key={p.slug} href={`/collection/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div style={{ background: '#E8E0D0', aspectRatio: '3/4', overflow: 'hidden', marginBottom: '1rem', position: 'relative' }}>
                {p.images && p.images.length > 0 ? (
                  <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.5s ease' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '60px', height: '100px', background: '#4A3728', borderRadius: '30px 30px 4px 4px', opacity: 0.4 }} />
                  </div>
                )}
                {p.status === 'preorder' && (
                  <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#2C1F14', color: '#F5F0E8', fontFamily: 'Jost, sans-serif', fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '4px 10px' }}>Pre-order</div>
                )}
                {p.status === 'in_production' && (
                  <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#3B6D11', color: '#EAF3DE', fontFamily: 'Jost, sans-serif', fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '4px 10px' }}>In Production</div>
                )}
              </div>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 400, color: '#2C1F14', marginBottom: '4px' }}>{p.name}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'Jost, sans-serif', fontSize: '13px', color: '#8C7B6E', fontWeight: 300 }}>${p.price.toLocaleString()}</span>
                <span style={{ fontFamily: 'Jost, sans-serif', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#7A5C45' }}>{p.material}</span>
              </div>
              {p.status === 'preorder' && p.preorder_count != null && p.preorder_target != null && (
                <div>
                  <div style={{ height: '2px', background: '#E8E0D0', borderRadius: '1px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min((p.preorder_count / p.preorder_target) * 100, 100)}%`, background: '#7A5C45', borderRadius: '1px' }} />
                  </div>
                  <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '9px', color: '#8C7B6E', marginTop: '4px', fontWeight: 300 }}>{p.preorder_count} of {p.preorder_target} reserved</p>
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: '#2C1F14', padding: 'clamp(3rem,6vw,6rem) clamp(1.5rem,5vw,5rem)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '10px', letterSpacing: '0.4em', textTransform: 'uppercase', color: '#7A5C45', marginBottom: '1.5rem' }}>The model</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(36px,5vw,64px)', fontWeight: 300, color: '#F5F0E8', lineHeight: 1.05, marginBottom: '4rem' }}>
            Five steps.<br /><em style={{ fontStyle: 'italic', color: '#D4C9B0' }}>Zero leftovers.</em>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {steps.map((step, i) => (
              <div key={step.num} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '2rem', padding: '2rem 0', borderTop: '0.5px solid #3A2A1C' }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '48px', fontWeight: 300, color: '#3A2A1C', lineHeight: 1 }}>{step.num}</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', color: '#F5F0E8', marginBottom: '6px' }}>{step.title}</p>
                    <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '13px', color: '#6B5544', lineHeight: 1.7, fontWeight: 300, maxWidth: '480px' }}>{step.desc}</p>
                  </div>
                  {i === steps.length - 1 && (
                    <Link href="/collection" style={{ background: '#F5F0E8', color: '#2C1F14', padding: '12px 28px', textDecoration: 'none', fontFamily: 'Jost, sans-serif', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', flexShrink: 0 }}>
                      Reserve Now
                    </Link>
                  )}
                </div>
              </div>
            ))}
            <div style={{ borderTop: '0.5px solid #3A2A1C' }} />
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section style={{ background: '#F5F0E8', padding: 'clamp(4rem,8vw,8rem) clamp(1.5rem,5vw,5rem)', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(22px,4vw,48px)', fontWeight: 300, color: '#2C1F14', lineHeight: 1.3, maxWidth: '800px', margin: '0 auto 2rem', fontStyle: 'italic' }}>
          "The most sustainable garment is the one made for someone who actually wants it — not one hoping to find a home after the fact."
        </p>
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#8C7B6E' }}>Unweave, 2026</p>
      </section>

      {/* WHY IT MATTERS */}
      <section style={{ background: '#FDFAF5', padding: 'clamp(3rem,6vw,6rem) clamp(1.5rem,5vw,5rem)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '2px' }}>
          {[
            { label: 'The problem', title: 'Fashion makes 30% more than it sells.', desc: 'Every year, billions of garments are manufactured, shipped, and discarded — never worn, never wanted. The industry calls it inventory risk. We call it a design flaw.' },
            { label: 'Our fix', title: 'We produce after demand, not before.', desc: 'No forecasting. No surplus. No sales. When 10 people reserve a piece, we buy exactly that fabric, cut exactly those patterns, and make exactly those garments. Nothing more.' },
            { label: 'Your role', title: 'Your reservation is an act of creation.', desc: 'When you pre-order from Unweave, you\'re not buying a product that exists. You\'re commissioning one into existence. That changes what fashion can be.' },
          ].map((card) => (
            <div key={card.label} style={{ background: '#FDFAF5', padding: 'clamp(2rem,4vw,3.5rem)', border: '0.5px solid #E8E0D0' }}>
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#7A5C45', marginBottom: '0.75rem' }}>{card.label}</p>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', fontWeight: 400, color: '#2C1F14', marginBottom: '1rem', lineHeight: 1.2 }}>{card.title}</h3>
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '13px', color: '#8C7B6E', lineHeight: 1.8, fontWeight: 300 }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#2C1F14', padding: 'clamp(3rem,6vw,5rem) clamp(1.5rem,5vw,5rem) 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '3rem', paddingBottom: '3rem', borderBottom: '0.5px solid #3A2A1C', marginBottom: '2rem' }}>
          <div>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 300, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#F5F0E8', display: 'block', marginBottom: '1rem' }}>Unweave</span>
            <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '12px', color: '#6B5544', lineHeight: 1.75, fontWeight: 300, maxWidth: '220px' }}>Fashion made only when someone wants it. Pre-order, then we produce.</p>
          </div>
          {[
            { title: 'Shop', links: ['New Arrivals','Outerwear','Dresses','Sets','Accessories'] },
            { title: 'About', links: ['Our Model','Sustainability','Artisan Partners','Material Sourcing'] },
            { title: 'Help', links: ['How Pre-orders Work','Shipping','Returns & Repairs','Contact'] },
          ].map(col => (
            <div key={col.title}>
              <span style={{ fontFamily: 'Jost, sans-serif', fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#D4C9B0', display: 'block', marginBottom: '1.25rem' }}>{col.title}</span>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {col.links.map(l => (
                  <li key={l}><Link href="#" style={{ fontFamily: 'Jost, sans-serif', fontSize: '12px', color: '#6B5544', textDecoration: 'none', fontWeight: 300 }}>{l}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <span style={{ fontFamily: 'Jost, sans-serif', fontSize: '11px', color: '#4A3728', fontWeight: 300 }}>© 2026 Unweave. All rights reserved.</span>
          <span style={{ fontFamily: 'Jost, sans-serif', fontSize: '11px', color: '#7A5C45', letterSpacing: '0.1em' }}>Zero stock · Zero surplus · Zero waste</span>
        </div>
      </footer>
    </main>
  )
}