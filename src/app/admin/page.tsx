import { createClient } from '../../lib/supabase/server'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  const { count: orderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })

  return (
    <main style={{ minHeight: '100vh', background: '#F5F0E8', padding: '2rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#7A5C45', marginBottom: '8px' }}>
            Unweave
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '42px', fontWeight: 300, color: '#2C1F14' }}>
            Admin Dashboard
          </h1>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { label: 'Products', value: products?.length ?? 0 },
            { label: 'Orders', value: orderCount ?? 0 },
            { label: 'Agents', value: '2 active' },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#FDFAF5', border: '0.5px solid #D4C9B0', padding: '1.5rem 2rem' }}>
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8C7B6E', marginBottom: '8px' }}>{stat.label}</p>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '40px', fontWeight: 300, color: '#2C1F14', lineHeight: 1 }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Nav */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[
            { href: '/admin/products', label: 'Products', desc: 'Manage collection and generate content' },
            { href: '/admin/messages', label: 'Messages', desc: 'Customer messages and agent drafts' },
            { href: '/admin/agents', label: 'Agents', desc: 'Monitor and trigger AI agents' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none', background: '#FDFAF5', border: '0.5px solid #D4C9B0', padding: '1.5rem 2rem', display: 'block', transition: 'background 0.2s' }}>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 400, color: '#2C1F14', marginBottom: '6px' }}>{item.label}</p>
              <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '12px', color: '#8C7B6E', fontWeight: 300 }}>{item.desc}</p>
            </Link>
          ))}
        </div>

      </div>
    </main>
  )
}