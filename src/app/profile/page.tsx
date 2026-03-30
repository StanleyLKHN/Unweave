import Navbar from '../../components/Navbar'
import Link from 'next/link'

export default function ProfilePage() {
  return (
    <main>
      <Navbar />
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#F5F0E8' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#2C1F14', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F5F0E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#7A5C45', marginBottom: '1rem' }}>Your Account</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '36px', fontWeight: 300, color: '#2C1F14', marginBottom: '1rem', textAlign: 'center' }}>Sign in to track<br />your pre-orders</h1>
        <p style={{ fontSize: '14px', color: '#8C7B6E', fontWeight: 300, textAlign: 'center', maxWidth: '320px', marginBottom: '2.5rem', lineHeight: 1.7 }}>
          Create an account to manage your reservations, track production status, and get notified when your piece ships.
        </p>
        <Link href="/collection" style={{ background: '#2C1F14', color: '#F5F0E8', padding: '14px 36px', textDecoration: 'none', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', fontFamily: 'Jost, sans-serif', display: 'inline-block' }}>
          Browse Collection
        </Link>
      </div>
    </main>
  )
}