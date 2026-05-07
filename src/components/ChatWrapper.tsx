'use client'

import dynamic from 'next/dynamic'

const ChatMessenger = dynamic(() => import('./ChatMessenger'), { ssr: false })
const ChatWidgetV2  = dynamic(() => import('./ChatWidgetV2'),  { ssr: false })
const InstallBanner = dynamic(() => import('./InstallBanner'), { ssr: false })
const BottomNav     = dynamic(() => import('./BottomNav'),     { ssr: false })

export default function ChatWrapper() {
  return (
    <>
      <ChatMessenger />
      <ChatWidgetV2 />
      <InstallBanner />
      <BottomNav />
    </>
  )
}