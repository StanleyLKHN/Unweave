import type { Metadata, Viewport } from 'next'
import ChatWrapper from '../components/ChatWrapper'
import './globals.css'

export const metadata: Metadata = {
  title: 'Unweave — Zero Waste Fashion',
  description: 'Circular production, AI-powered curation, and a wardrobe with zero footprint.',
  keywords: ['zero waste fashion', 'sustainable clothing', 'circular fashion', 'AI try-on'],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Unweave',
  },
}

export const viewport: Viewport = {
  themeColor: '#2C1F14',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body suppressHydrationWarning>
        <div className="page-wrapper">
          {children}
        </div>
        <ChatWrapper />
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
              })
            }
          `
        }} />
        <style dangerouslySetInnerHTML={{
          __html: `
            .page-wrapper { padding-bottom: 64px; }
            @media (min-width: 768px) {
              .page-wrapper { padding-bottom: 0; }
            }
          `
        }} />
      </body>
    </html>
  )
}