import { useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
// import { MainLayout } from '@/components/layout/MainLayout'
import { ChatInterface } from '@/components/conversations/ChatInterface'

export function Chat() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const location = useLocation()
  const initialPrompt = location.state?.initialPrompt

  useEffect(() => {
    document.title = conversationId ? 'Chat - HaqooqAI' : 'New Chat - HaqooqAI'
  }, [conversationId])

  return (
    // <MainLayout>
      <ChatInterface 
        conversationId={conversationId}
        initialPrompt={initialPrompt}
      />
    // </MainLayout>
  )
}
