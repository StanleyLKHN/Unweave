import Navbar from '../components/Navbar'
import Link from 'next/link'
import { createClient } from '../lib/supabase/server'
import type { Product } from '../lib/types'

const stats = [
  { num: '10',   label: 'Pre-orders needed to start production' },
  { num: '0g',   label: 'Fabric waste — we buy only what\'s needed' },
  { num: '100%', label: 'Made to order, never made to stock' },
  { num: '0',    label: 'Items left unsold, ever' },
]

const values = [
  {
    title: 'You order first. Then we buy the fabric.',
    desc: 'We don\'t hold stock. Once a piece reaches 10 pre-orders, we purchase exactly the fabric needed and send it to production. Not one centimetre more.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#7A5C45" strokeWidth="1.2" strokeLinecap="round">
        <circle cx="18" cy="18" r="14"/>
        <path d="M18 8v10l6 4"/>
      </svg>
    ),
  },
  {
    title: 'No overproduction. Ever.',
    desc: 'Traditional fashion overproduces by 30–40%. We produce exactly what\'s been reserved — nothing ends up in a landfill because nothing was made without a home.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#7A5C45" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 32V18L18 4l9 14v14"/><path d="M14 32v-9h8v9"/>
      </svg>
    ),
  },
  {
    title: 'Your purchase is the production order.',
    desc: 'When you reserve a piece, you\'re not just shopping — you\'re directly commissioning its creation. Fashion made on demand, by artisans, for people who actually want it.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#7A5C45" strokeWidth="1.2" strokeLinecap="round">
        <path d="M6 24s1.5-1.5 5-1.5 6 2.5 10 2.5 5-1.5 5-1.5V9s-1.5 1.5-5 1.5-6-2.5-10-2.5S6 9 6 9z"/>
        <line x1="6" y1="32" x2="6" y2="9"/>
      </svg>
    ),
  },
]

export default async function HomePage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('in_stock', true)
    .order('created_at', { ascending: false })
    .limit(4)

  const items: Product[] = products ?? []
  return (
    <main>
      <Navbar />

      {/* ── HERO ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-screen bg-white">

        {/* Left */}
        <div className="flex flex-col justify-center px-6 md:px-20 py-16 md:py-24">
          <p className="section-tag animate-fade-up animation-delay-100">
            Made to order. Zero waste.
          </p>
          <h1 className="font-serif text-display font-light leading-none text-espresso mb-7 animate-fade-up animation-delay-250">
            We make it<br />
            only when<br />
            <em className="italic text-brown">you order it.</em>
          </h1>
          <p className="text-body text-text-light max-w-sm mb-10 animate-fade-up animation-delay-400">
            No warehouses. No leftovers. No waste. Reserve a piece — once 10 orders are placed, we buy the fabric and go to production. Your order is the beginning of the garment.
          </p>
          <div className="flex items-center gap-8 animate-fade-up animation-delay-550">
            <Link href="/collection" className="btn-primary">Reserve a Piece</Link>
            <Link href="/process" className="btn-text">How It Works</Link>
          </div>
        </div>

        {/* Right — real photo */}
        <div className="relative bg-oatmeal flex items-center justify-center overflow-hidden">
          {/* 0% badge */}
          <div className="absolute top-10 right-10 w-20 h-20 rounded-full bg-espresso flex flex-col items-center justify-center z-10">
            <span className="font-serif text-2xl font-light text-cream leading-none">0%</span>
            <span className="text-[7px] tracking-widest uppercase text-sand mt-1">Waste</span>
          </div>

          <img
            src="https://uffgbzoapueylgsffehj.supabase.co/storage/v1/object/public/products/uw_1.png"
            alt="Oatmeal Trench Coat"
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
          />

          {/* Product tag */}
          <div className="absolute bottom-10 left-10 right-10 bg-white/95 backdrop-blur-sm px-6 py-5 border-hair border-sand">
            <p className="font-serif text-base font-normal text-espresso">Oatmeal Trench — Deadstock Linen</p>
            <p className="text-caption tracking-widest uppercase text-text-light mt-1">Pre-order open · 7 of 10 reserved · $2,450</p>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 bg-white border-b border-hair border-sand">
        {stats.map((s, i) => (
          <div key={i} className={`py-9 px-8 text-center transition-colors hover:bg-cream ${i < 3 ? 'border-r border-hair border-sand' : ''}`}>
            <div className="font-serif text-[40px] font-light text-espresso leading-none">{s.num}</div>
            <div className="text-label uppercase tracking-widest text-text-light mt-2 leading-snug">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── COLLECTION PREVIEW ── */}
      <section className="px-6 md:px-20 py-16 md:py-24 bg-white">
        <div className="flex items-end justify-between mb-14">
          <h2 className="font-serif text-heading font-light text-espresso">The Collection</h2>
          <Link href="/collection" className="text-label uppercase tracking-widest text-brown border-b border-brown pb-0.5 hover:opacity-60 transition-opacity">
            View all pieces
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-7">
          {items.map((p) => (
            <Link key={p.slug} href={`/collection/${p.slug}`} className="product-card group no-underline">
              <div style={{ aspectRatio: '3/4', overflow: 'hidden', marginBottom: '14px', position: 'relative', background: 'var(--color-oatmeal)' }}>
                {p.images && p.images.length > 0 ? (
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '60px', height: '100px', background: 'var(--color-espresso-mid)', borderRadius: '30px 30px 4px 4px', opacity: 0.4 }} />
                  </div>
                )}
              </div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 400, color: 'var(--color-espresso)', marginBottom: '4px' }}>{p.name}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-light)', fontWeight: 300 }}>${p.price.toLocaleString()}</span>
                <span style={{ fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-brown)' }}>{p.material}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── PROCESS (dark) ── */}
      <section className="bg-espresso px-6 md:px-20 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center">
        <div>
          <span className="text-label uppercase tracking-widest text-sand block mb-5">How It Works</span>
          <h2 className="font-serif text-heading font-light text-cream leading-tight">
            Fashion made in<br /><em className="italic text-sand">the right order.</em>
          </h2>
          <p className="text-body text-sand mt-6 max-w-sm">
            The fashion industry overproduces by billions of items every year. We do the opposite — nothing is made until it's already sold.
          </p>
          <Link href="/collection" className="btn-primary mt-10 inline-block" style={{ background: 'var(--cream)', color: 'var(--espresso)' }}>
            See Open Pre-orders
          </Link>
        </div>
        <div className="flex flex-col gap-6">
          {[
            ['01', 'Reserve your piece',        'Choose what you want and place a pre-order. No charge yet — you\'re just reserving your spot.'],
            ['02', 'We reach 10 orders',         'Once 10 people reserve the same piece, the run is confirmed. You get notified immediately.'],
            ['03', 'Fabric is purchased',        'We buy exactly the fabric needed for those 10 pieces. Not one metre more. Then it goes to our artisan partners.'],
            ['04', 'Made & delivered to you',    'Each piece is handcrafted and shipped directly to the people who ordered it. No stock, no storage, no waste.'],
          ].map(([num, title, desc]) => (
            <div key={num} className="p-7 border border-espresso-mid hover:border-brown transition-colors">
              <div className="flex gap-6 items-start">
                <span className="font-serif text-4xl font-light text-sand opacity-60 leading-none min-w-[40px]">{num}</span>
                <div>
                  <p className="font-serif text-xl text-cream mb-1">{title}</p>
                  <p className="text-caption text-text-light leading-relaxed">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="px-6 md:px-20 py-16 md:py-24 bg-cream">
        <div className="text-center mb-10 md:mb-16">
          <span className="section-tag">Why pre-order fashion</span>
          <h2 className="font-serif text-heading font-light text-espresso">The only model where<br />zero waste is <em className="italic">guaranteed.</em></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px">
          {values.map((v) => (
            <div key={v.title} className="bg-white p-8 md:p-12 border border-hair border-sand hover:bg-cream transition-colors">
              <div className="mb-7">{v.icon}</div>
              <h3 className="font-serif text-2xl font-normal text-espresso mb-4">{v.title}</h3>
              <p className="text-body text-text-light">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-espresso px-6 md:px-20 pt-14 md:pt-20 pb-8 md:pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-14 pb-10 md:pb-14 border-b border-espresso-mid">
          <div>
            <span className="font-serif text-2xl font-light tracking-[0.3em] uppercase text-cream block mb-5">Unweave</span>
            <p className="text-caption text-text-light leading-relaxed max-w-[220px]">Fashion made to order. We buy fabric only after your pre-order is confirmed. Zero stock, zero waste.</p>
          </div>
          {[
            { title: 'Shop',     links: ['New Arrivals','Outerwear','Dresses','Accessories','Deadstock Edit'] },
            { title: 'Platform', links: ['Virtual Try-On','Fashion AI School','Community','Vibe Coding'] },
            { title: 'Values',   links: ['Our Process','Circularity','Artisan Map','Repair Programme','Impact Report'] },
          ].map(col => (
            <div key={col.title}>
              <span className="text-label uppercase tracking-widest text-sand block mb-6">{col.title}</span>
              <ul className="flex flex-col gap-3 list-none">
                {col.links.map(l => (
                  <li key={l}>
                    <Link href="#" className="text-caption text-text-light hover:text-cream transition-colors no-underline">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center pt-8 flex-wrap gap-4">
          <span className="text-caption text-text-light">© 2026 Unweave. All rights reserved.</span>
          <span className="text-[11px] text-brown tracking-wider">B Corp Certified · 0% Landfill · Carbon Neutral Shipping</span>
        </div>
      </footer>
    </main>
  )
}