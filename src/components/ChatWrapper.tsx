'use client'

import dynamic from 'next/dynamic'

const ChatMessenger = dynamic(() => import('./ChatMessenger'), { ssr: false })

export default function ChatWrapper() {
  return <ChatMessenger />
}