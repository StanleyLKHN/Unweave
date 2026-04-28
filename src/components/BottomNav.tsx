'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useCartStore } from '../store/cartStore'

type DeviceType = 'android-chrome' | 'ios-safari' | 'ios-other' | 'other'

function detectDevice(): DeviceType {
  const ua = navigator.userAgent
  const isIOS = /iphone|ipad|ipod/i.test(ua)
  const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua)
  const isChrome = /chrome|crios/i.test(ua)
  const isAndroid = /android/i.test(ua)

  if (isAndroid && isChrome) return 'android-chrome'
  if (isIOS && isSafari) return 'ios-safari'
  if (isIOS) return 'ios-other'
  return 'other'
}

const GUIDES: Record<string, { title: string; steps: { text: string; sub: string }[] }> = {
  'ios-safari': {
    title: 'Install on iPhone',
    steps: [
      { text: 'Tap the Share button', sub: 'Square with arrow ↑ at the bottom of Safari' },
      { text: 'Tap "Add to Home Screen"', sub: 'Scroll down in the share sheet' },
      { text: 'Tap "Add"', sub: 'Unweave will appear on your home screen' },
    ],
  },
  'ios-other': {
    title: 'Install on iPhone',
    steps: [
      { text: 'Open this page in Safari', sub: 'Copy the URL and paste it in Safari' },
      { text: 'Tap the Share button', sub: 'Square with arrow ↑ at the bottom' },
      { text: 'Tap "Add to Home Screen"', sub: 'Scroll down in the share sheet' },
    ],
  },
  other: {
    title: 'Install Unweave',
    steps: [
      { text: 'Open browser menu', sub: 'Tap the three dots ⋮ in your browser' },
      { text: 'Tap "Add to Home Screen"', sub: 'Or "Install App" depending on your browser' },
      { text: 'Tap "Add"', sub: 'Unweave will appear on your home screen' },
    ],
  },
}

export default function BottomNav() {
  const pathname = usePathname()
  const count = useCartStore(s => s.count)()
  const [installed, setInstalled] = useState(false)
  const [device, setDevice] = useState<DeviceType>('other')
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    setDevice(detectDevice())

    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    // Android Chrome — native prompt available
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setInstalled(true)
      setDeferredPrompt(null)
      return
    }
    // All other cases — show manual guide
    setShowGuide(true)
  }

  const guide = GUIDES[device] ?? GUIDES.other

  const tabs = [
    { href: '/', label: 'Home', icon: (a: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a?'#2C1F14':'none'} stroke="#2C1F14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { href: '/collection', label: 'Shop', icon: (a: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a?'#2C1F14':'none'} stroke="#2C1F14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
    { href: '/wishlist', label: 'Saved', icon: (a: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a?'#2C1F14':'none'} stroke="#2C1F14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
    { href: '/cart', label: 'Cart', badge: count, icon: (a: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a?'#2C1F14':'none'} stroke="#2C1F14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> },
    { href: '/profile', label: 'Profile', icon: (a: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a?'#2C1F14':'none'} stroke="#2C1F14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ]

  return (
    <>
      <nav className="bottom-nav-mobile" style={{ position:'fixed', bottom:0, left:0, right:0, background:'#FDFAF5', borderTop:'0.5px solid #D4C9B0', zIndex:100, paddingBottom:'env(safe-area-inset-bottom)' }}>
        {tabs.map(tab => {
          const active = pathname === tab.href || (tab.href === '/collection' && pathname.startsWith('/collection'))
          return (
            <Link key={tab.href} href={tab.href} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'10px 4px 8px', textDecoration:'none', position:'relative', gap:'3px' }}>
              {active && <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'20px', height:'2px', background:'#2C1F14' }} />}
              <div style={{ opacity: active ? 1 : 0.4 }}>{tab.icon(active)}</div>
              {tab.badge && tab.badge > 0 && <div style={{ position:'absolute', top:'6px', right:'calc(50% - 18px)', background:'#2C1F14', color:'#F5F0E8', borderRadius:'50%', width:'16px', height:'16px', fontSize:'9px', display:'flex', alignItems:'center', justifyContent:'center' }}>{tab.badge}</div>}
              <span style={{ fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase', color: active ? '#2C1F14' : '#A08C7A', fontFamily:'Jost, sans-serif', fontWeight: active ? 400 : 300 }}>{tab.label}</span>
            </Link>
          )
        })}

        {!installed && (
          <button onClick={handleInstall} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'10px 4px 8px', background:'none', border:'none', cursor:'pointer', gap:'3px', borderLeft:'0.5px solid #D4C9B0' }}>
            <div style={{ opacity:0.7 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2C1F14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v13M7 11l5 5 5-5"/><path d="M3 18v2a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-2"/>
              </svg>
            </div>
            <span style={{ fontSize:'9px', letterSpacing:'0.1em', textTransform:'uppercase', color:'#7A5C45', fontFamily:'Jost, sans-serif', fontWeight:400 }}>Install</span>
          </button>
        )}
      </nav>

      {/* Install guide modal */}
      {showGuide && (
        <div style={{ position:'fixed', inset:0, background:'rgba(44,31,20,0.5)', zIndex:500, display:'flex', alignItems:'flex-end' }} onClick={() => setShowGuide(false)}>
          <div style={{ background:'#FDFAF5', width:'100%', padding:'2rem 1.5rem 3rem', borderRadius:'16px 16px 0 0' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'22px', fontWeight:300, color:'#2C1F14' }}>{guide.title}</p>
              <button onClick={() => setShowGuide(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'22px', color:'#8C7B6E' }}>×</button>
            </div>
            {guide.steps.map(({ text, sub }, i) => (
              <div key={i} style={{ display:'flex', gap:'1rem', alignItems:'flex-start', marginBottom:'1.25rem' }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'#2C1F14', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', color:'#F5F0E8', fontSize:'12px' }}>{i + 1}</div>
                <div>
                  <p style={{ fontSize:'14px', color:'#2C1F14', marginBottom:'2px' }}>{text}</p>
                  <p style={{ fontSize:'12px', color:'#8C7B6E', fontWeight:300 }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          .bottom-nav-mobile { display: flex; }
          @media (min-width: 768px) {
            .bottom-nav-mobile { display: none !important; }
          }
        `
      }} />
    </>
  )
}