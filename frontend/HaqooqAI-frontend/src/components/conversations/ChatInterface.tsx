import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { Scale } from 'lucide-react'
// import { MainLayout } from '@/components/layout/MainLayout'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { CyclingLoader } from '@/components/ui/CyclingLoader'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { useMessages } from '@/hooks/useMessages'
import { useConversations } from '@/hooks/useConversations'

interface ChatInterfaceProps {
  conversationId?: string
  initialPrompt?: string
}

export function ChatInterface({ conversationId, initialPrompt }: ChatInterfaceProps) {
  const navigate = useNavigate()
  const { createConversation } = useConversations()
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId)
  const [isNewConversation, setIsNewConversation] = useState(!conversationId)
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)

  const {
    messages,
    fetchingLoading,
    setupLoading,
    analyzingLoading,
    error,
    sendMessage,
    refreshMessages,
  } = useMessages(currentConversationId, isNewConversation)

  useEffect(() => {
    if (conversationId && conversationId !== currentConversationId) {
      setCurrentConversationId(conversationId)
      setIsNewConversation(false)
    }
  }, [conversationId, currentConversationId])

  useEffect(() => {
    if (initialPrompt && currentConversationId) {
      handleSendMessage(initialPrompt)
    }
  }, [initialPrompt, currentConversationId])

  const handleSendMessage = async (content: string) => {
    let targetConversationId = currentConversationId

    // If no conversation exists, create one
    if (!targetConversationId) {
      try {
        setIsCreatingConversation(true)
        const conversation = await createConversation('New Conversation')
        targetConversationId = conversation.id
        setCurrentConversationId(conversation.id)
        setIsNewConversation(true)
        navigate(`/chat/${conversation.id}`, { replace: true })
      } catch (error) {
        console.error('Failed to create conversation:', error)
        return
      } finally {
        setIsCreatingConversation(false)
      }
    }

    if (targetConversationId) {
      await sendMessage(targetConversationId, content)
    }
  }

  const conversationMessages = currentConversationId ? messages[currentConversationId] || [] : []

  const handleRetryMessage = () => {
    if (refreshMessages) {
      refreshMessages()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {setupLoading ? (
          <div className="flex items-center justify-center h-64">
            <CyclingLoader type="setup" />
          </div>
        ) : fetchingLoading ? (
          <div className="flex items-center justify-center h-64">
            <CyclingLoader type="fetching" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <ErrorDisplay 
              error={error} 
              onRetry={handleRetryMessage}
              showSettingsButton={true}
            />
          </div>
        ) : conversationMessages.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center space-y-2">
              <Scale className="w-12 h-12 mx-auto text-purple-400" />
              <p className="text-lg font-medium">Start a conversation</p>
              <p className="text-sm">Ask any question about Pakistani law</p>
            </div>
          </div>
        ) : (
          <MessageList 
            messages={conversationMessages} 
            loading={analyzingLoading}
            conversationId={currentConversationId}
            loadingType="analyzing"
          />
        )}
        
        {/* AI Thinking Indicator */}
        {analyzingLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-gray-100 rounded-lg p-4">
              <CyclingLoader type="analyzing" />
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t bg-white p-4">
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={analyzingLoading || isCreatingConversation || setupLoading}
          placeholder="Ask about Pakistani law..."
        />
      </div>
    </div>
  )
}