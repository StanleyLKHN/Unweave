import Navbar from '../components/Navbar'
import Link from 'next/link'
import { createClient } from '../lib/supabase/server'
import type { Product } from '../lib/types'

const stats = [
  { num: '0g',   label: 'Fabric waste per garment' },
  { num: '100%', label: 'Deadstock & natural fibres' },
  { num: '340+', label: 'Certified artisan partners' },
  { num: '∞',    label: 'Repair & return programme' },
]

const values = [
  {
    title: 'Circular by Design',
    desc:  'Every pattern is engineered for zero off-cuts. What doesn\'t become a garment becomes the next collection\'s foundation.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#7A5C45" strokeWidth="1.2" strokeLinecap="round">
        <circle cx="18" cy="18" r="14"/>
        <path d="M18 4c0 7.7-3.5 14-9.3 16.9M18 4c0 7.7 3.5 14 9.3 16.9M4 18h28"/>
      </svg>
    ),
  },
  {
    title: 'Artisan Integrity',
    desc:  'Full traceability from fibre to finish. Every artisan partner is certified, paid fairly, and listed on your garment\'s digital passport.',
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#7A5C45" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 32V18L18 4l9 14v14"/><path d="M14 32v-9h8v9"/>
      </svg>
    ),
  },
  {
    title: 'Living Materials',
    desc:  'Only deadstock, organic, and upcycled fibres. Never virgin synthetics. Every fabric chosen for biodegradability or recyclability.',
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
      <section className="grid grid-cols-2 min-h-screen bg-white">

        {/* Left */}
        <div className="flex flex-col justify-center px-20 py-24">
          <p className="section-tag animate-fade-up animation-delay-100">
            Zero Waste Fashion Platform
          </p>
          <h1 className="font-serif text-display font-light leading-none text-espresso mb-7 animate-fade-up animation-delay-250">
            Wear Less.<br />
            Mean <em className="italic text-brown">more.</em><br />
            Waste nothing.
          </h1>
          <p className="text-body text-text-light max-w-sm mb-10 animate-fade-up animation-delay-400">
            Every piece is cut with purpose and nothing is left behind. Unweave is a zero-waste fashion platform where circular production meets AI-powered personal style.
          </p>
          <div className="flex items-center gap-8 animate-fade-up animation-delay-550">
            <Link href="/collection" className="btn-primary">Explore Collection</Link>
            <Link href="/process"    className="btn-text">How It Works</Link>
          </div>
        </div>

        {/* Right — illustration */}
        <div className="relative bg-oatmeal flex items-center justify-center overflow-hidden">
          {/* 0% badge */}
          <div className="absolute top-10 right-10 w-20 h-20 rounded-full bg-espresso flex flex-col items-center justify-center z-10">
            <span className="font-serif text-2xl font-light text-cream leading-none">0%</span>
            <span className="text-[7px] tracking-widest uppercase text-sand mt-1">Waste</span>
          </div>

          {/* Woman in trench coat SVG */}
          <svg width="100%" height="100%" viewBox="0 0 540 720" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
            <rect width="540" height="720" fill="#E4DDD2"/>
            <rect x="110" y="0" width="320" height="720" fill="#DDD6CB" opacity="0.5"/>
            <rect x="130" y="40" width="280" height="640" fill="none" stroke="#D0C9BE" strokeWidth="1" opacity="0.6"/>
            <line x1="0" y1="668" x2="540" y2="668" stroke="#C4BBB0" strokeWidth="0.8" opacity="0.5"/>
            <ellipse cx="270" cy="672" rx="70" ry="10" fill="#B8B0A5" opacity="0.25"/>
            <path d="M228 560 C224 600 222 635 224 668 L254 668 C256 635 258 600 256 560Z" fill="#C8BEAE"/>
            <path d="M284 560 C282 600 280 635 282 668 L312 668 C314 635 316 600 314 560Z" fill="#C0B6A6"/>
            <path d="M222 660 C218 662 212 664 210 668 L254 668 L256 660Z" fill="#2A1C10"/>
            <path d="M282 660 C282 660 280 662 280 668 L316 668 C316 664 312 662 310 660Z" fill="#221408"/>
            <path d="M190 195 C178 230 168 290 164 360 C160 430 158 500 160 560 L380 560 C382 500 380 430 376 360 C372 290 362 230 350 195 C340 172 322 160 270 157 C218 160 200 172 190 195Z" fill="#C8B898"/>
            <path d="M190 195 C178 230 168 290 164 360 C160 430 158 500 160 560 L195 560 C192 500 194 430 198 360 C202 290 210 235 218 205Z" fill="#B8A888" opacity="0.6"/>
            <path d="M350 195 C362 230 372 290 376 360 C380 430 382 500 380 560 L345 560 C348 500 346 430 342 360 C338 290 330 235 322 205Z" fill="#B0A080" opacity="0.5"/>
            <path d="M270 162 L244 205 L258 218 L270 210 L282 218 L296 205Z" fill="#E8DFC8"/>
            <path d="M244 205 C238 220 234 238 236 252 L262 248 L270 210Z" fill="#BEB090"/>
            <path d="M296 205 C302 220 306 238 304 252 L278 248 L270 210Z" fill="#BEB090"/>
            <path d="M248 195 Q260 190 270 192 Q280 190 292 195 L286 210 Q278 205 270 207 Q262 205 254 210Z" fill="#C8BA9A"/>
            <rect x="172" y="362" width="196" height="14" rx="7" fill="#8A7858"/>
            <rect x="256" y="360" width="28" height="18" rx="3" fill="#A89468"/>
            <rect x="260" y="364" width="20" height="10" rx="2" fill="none" stroke="#7A6848" strokeWidth="1.5"/>
            <path d="M188 208 C178 230 172 260 170 295 C168 325 170 355 172 375 C173 382 176 384 180 382 C184 380 185 376 184 370 C182 350 182 320 184 292 C186 264 192 238 198 218Z" fill="#C0B090"/>
            <path d="M352 208 C362 230 368 260 370 295 C372 325 370 345 366 360 C364 367 360 368 356 365 C352 362 352 358 354 352 C356 340 356 315 354 290 C352 265 346 238 342 218Z" fill="#C0B090"/>
            <circle cx="270" cy="420" r="4" fill="#9A8868" opacity="0.7"/>
            <circle cx="270" cy="460" r="4" fill="#9A8868" opacity="0.6"/>
            <circle cx="270" cy="500" r="4" fill="#9A8868" opacity="0.5"/>
            <path d="M252 170 Q262 165 270 166 Q278 165 288 170 L286 188 Q278 183 270 184 Q262 183 254 188Z" fill="#F0E8DC"/>
            <path d="M256 148 C254 155 253 162 254 170 L286 170 C287 162 286 155 284 148 C280 140 260 140 256 148Z" fill="#D8C4AA"/>
            <ellipse cx="270" cy="118" rx="44" ry="50" fill="#D8C4AA"/>
            <path d="M226 108 C226 72 236 52 270 48 C304 52 314 72 314 108 C314 98 306 88 298 84 Q284 78 270 78 Q256 78 242 84 C234 88 226 98 226 108Z" fill="#6A4C34"/>
            <ellipse cx="270" cy="162" rx="26" ry="16" fill="#5E4230"/>
            <ellipse cx="270" cy="158" rx="12" ry="7" fill="#483220"/>
            <ellipse cx="244" cy="128" rx="14" ry="10" fill="#E8C4A8" opacity="0.3"/>
            <ellipse cx="296" cy="128" rx="14" ry="10" fill="#E8C4A8" opacity="0.3"/>
            <path d="M246 102 C250 99 256 98 262 99" stroke="#4A3020" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <path d="M278 99 C284 98 290 99 294 102" stroke="#4A3020" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <rect x="236" y="103" width="30" height="18" rx="6" fill="#1A0C06" opacity="0.85"/>
            <rect x="274" y="103" width="30" height="18" rx="6" fill="#1A0C06" opacity="0.85"/>
            <path d="M238 109 Q244 107 250 109" stroke="white" strokeWidth="0.8" opacity="0.25" fill="none" strokeLinecap="round"/>
            <path d="M276 109 Q282 107 288 109" stroke="white" strokeWidth="0.8" opacity="0.25" fill="none" strokeLinecap="round"/>
            <line x1="236" y1="112" x2="224" y2="115" stroke="#1A0C06" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="304" y1="112" x2="316" y2="115" stroke="#1A0C06" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M258 144 Q262 140 270 141 Q278 140 284 144 Q278 147 270 146 Q262 147 258 144Z" fill="#C48870"/>
            <path d="M258 144 Q262 150 270 151 Q278 150 284 144 Q278 148 270 149 Q262 148 258 144Z" fill="#D4987E"/>
          </svg>

          {/* Product tag */}
          <div className="absolute bottom-10 left-10 right-10 bg-white/95 backdrop-blur-sm px-6 py-5 border-hair border-sand">
            <p className="font-serif text-base font-normal text-espresso">Oatmeal Trench — Deadstock Linen</p>
            <p className="text-caption tracking-widest uppercase text-text-light mt-1">100% circular · Zero off-cuts · $2,450</p>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <div className="grid grid-cols-4 bg-white border-b border-hair border-sand">
        {stats.map((s, i) => (
          <div key={i} className={`py-9 px-8 text-center transition-colors hover:bg-cream ${i < 3 ? 'border-r border-hair border-sand' : ''}`}>
            <div className="font-serif text-[40px] font-light text-espresso leading-none">{s.num}</div>
            <div className="text-label uppercase tracking-widest text-text-light mt-2 leading-snug">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── COLLECTION PREVIEW ── */}
      <section className="px-20 py-24 bg-white">
        <div className="flex items-end justify-between mb-14">
          <h2 className="font-serif text-heading font-light text-espresso">The Collection</h2>
          <Link href="/collection" className="text-label uppercase tracking-widest text-brown border-b border-brown pb-0.5 hover:opacity-60 transition-opacity">
            View all pieces
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-7">
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
      <section className="bg-espresso px-20 py-24 grid grid-cols-2 gap-20 items-center">
        <div>
          <span className="text-label uppercase tracking-widest text-sand block mb-5">Our Process</span>
          <h2 className="font-serif text-heading font-light text-cream leading-tight">
            Designed to leave<br /><em className="italic text-sand">nothing</em> behind.
          </h2>
          <p className="text-body text-sand mt-6 max-w-sm">
            Every centimetre of fabric is mapped before a single cut. Pattern algorithms eliminate off-cuts. Remaining material seeds the next collection.
          </p>
          <Link href="/process" className="btn-primary mt-10 inline-block" style={{ background: 'var(--cream)', color: 'var(--espresso)' }}>
            Learn Our Method
          </Link>
        </div>
        <div className="flex flex-col gap-6">
          {[
            ['01', 'Zero-Cut Pattern Design',      'AI-optimised nesting ensures 100% fabric utilisation before production begins.'],
            ['02', 'Deadstock & Natural Sourcing',  'Only certified deadstock, organic, or upcycled fibres — no virgin synthetics.'],
            ['03', 'Artisan-Made, Traceable',       'Each piece is handcrafted by certified partners with full supply-chain transparency.'],
            ['04', 'Repair, Return & Regenerate',   'Lifetime repair service. End-of-life return programme regenerates fabric into new pieces.'],
          ].map(([num, title, desc]) => (
            <div key={num} className="p-7 border border-espresso-mid hover:border-brown transition-colors">
              <div className="flex gap-6 items-start">
                <span className="font-serif text-4xl font-light text-sand opacity-60 leading-none min-w-10">{num}</span>
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
      <section className="px-20 py-24 bg-cream">
        <div className="text-center mb-16">
          <span className="section-tag">Why Unweave</span>
          <h2 className="font-serif text-heading font-light text-espresso">The values we refuse<br />to compromise.</h2>
        </div>
        <div className="grid grid-cols-3 gap-px">
          {values.map((v) => (
            <div key={v.title} className="bg-white p-12 border border-hair border-sand hover:bg-cream transition-colors">
              <div className="mb-7">{v.icon}</div>
              <h3 className="font-serif text-2xl font-normal text-espresso mb-4">{v.title}</h3>
              <p className="text-body text-text-light">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-espresso px-20 pt-20 pb-10">
        <div className="grid grid-cols-4 gap-14 pb-14 border-b border-espresso-mid">
          <div>
            <span className="font-serif text-2xl font-light tracking-[0.3em] uppercase text-cream block mb-5">Unweave</span>
            <p className="text-caption text-text-light leading-relaxed max-w-55">Zero waste fashion platform. Circular by design, curated by AI, made by artisans.</p>
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