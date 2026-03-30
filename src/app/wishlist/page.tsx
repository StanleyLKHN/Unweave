import Navbar from '../../components/Navbar'
import Link from 'next/link'

export default function WishlistPage() {
  return (
    <main>
      <Navbar />
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#F5F0E8' }}>
        <div style={{ marginBottom: '1.5rem', opacity: 0.3 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2C1F14" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#7A5C45', marginBottom: '1rem' }}>Saved Pieces</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '36px', fontWeight: 300, color: '#2C1F14', marginBottom: '1rem', textAlign: 'center' }}>Nothing saved yet</h1>
        <p style={{ fontSize: '14px', color: '#8C7B6E', fontWeight: 300, textAlign: 'center', maxWidth: '300px', marginBottom: '2.5rem', lineHeight: 1.7 }}>
          Browse the collection and save pieces you love. They'll appear here.
        </p>
        <Link href="/collection" style={{ background: '#2C1F14', color: '#F5F0E8', padding: '14px 36px', textDecoration: 'none', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', fontFamily: 'Jost, sans-serif', display: 'inline-block' }}>
          Browse Collection
        </Link>
      </div>
    </main>
  )
}