'use client'

import dynamic from 'next/dynamic'

const ChatMessenger = dynamic(() => import('./ChatMessenger'), { ssr: false })
const InstallBanner = dynamic(() => import('./InstallBanner'), { ssr: false })

export default function ChatWrapper() {
  return (
    <>
      <ChatMessenger />
      <InstallBanner />
    </>
  )
}