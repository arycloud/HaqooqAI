import { useState, useEffect, useRef } from 'react'
import { useAuth } from './useAuth'
import { useConversations } from './useConversations'
import { Message } from '@/types/message'
import { conversationService } from '@/services/backend/conversationService'
import { aiService } from '@/services/backend/aiService'
import { authService } from '@/services/backend/authService'
import toast from 'react-hot-toast'
import { AIResponse } from "@/types/api"


// import { useState, useEffect, useRef } from "react"
// import { useAuth } from "@/hooks/useAuth"
// import { useConversations } from "@/hooks/useConversations"
// import { conversationService } from "@/services/conversationService"
// import { aiService } from "@/services/aiService"
// import { toast } from "sonner"
 // Make sure AIResponse is exported from your types

export const useMessages = (conversationId?: string, isNewConversation = false) => {
  const { user } = useAuth()
  const { updateConversationTitle } = useConversations()

  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [fetchingLoading, setFetchingLoading] = useState(false)
  const [setupLoading, setSetupLoading] = useState(false)
  const [analyzingLoading, setAnalyzingLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // To prevent race conditions when conversation changes
  const activeConversationRef = useRef<string | null>(conversationId || null)

  useEffect(() => {
    if (conversationId) {
      activeConversationRef.current = conversationId
      loadMessages(conversationId)
    }
    return () => {
      activeConversationRef.current = null
    }
  }, [conversationId])

  /** Deduplicate messages by ID */
  const dedupeMessages = (list: Message[]) => {
    const seen = new Set<string>()
    return list.filter((msg) => {
      if (seen.has(msg.id)) return false
      seen.add(msg.id)
      return true
    })
  }

  /** Load messages for a conversation */
  const loadMessages = async (convId: string) => {
    if (!convId) return
    try {
      if (isNewConversation) {
        setSetupLoading(true)
      } else {
        setFetchingLoading(true)
      }
      setError(null)

      const { messages: conversationMessages } =
        await conversationService.getConversationWithMessages(convId)

      // ✅ Parse AIResponse if content is JSON
      const parsedMessages = conversationMessages.map((m) => {
        try {
          const parsed = JSON.parse(m.content as unknown as string)
          return { ...m, content: parsed }
        } catch {
          return m // fallback: keep as string
        }
      })

      if (activeConversationRef.current === convId) {
        setMessages((prev) => ({
          ...prev,
          [convId]: dedupeMessages(parsedMessages),
        }))
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load messages"
      setError(errorMessage)
      console.error("Failed to load messages:", err)
    } finally {
      if (isNewConversation) {
        setSetupLoading(false)
      } else {
        setFetchingLoading(false)
      }
    }
  }

  /** Send message and trigger AI response */
  const sendMessage = async (convId: string, content: string): Promise<void> => {
    try {
      if (!convId) throw new Error("No conversation selected")

      setAnalyzingLoading(true)
      setError(null)

      // Ensure user is authenticated
      let currentUser = user
      if (!currentUser?.github_id) {
        const session = await authService.checkExistingSession()
        if (!session?.user) {
          console.error("Authentication error:", { user })
          throw new Error("Please ensure you are properly logged in")
        }
        currentUser = session.user
      }
      const githubId = String(currentUser!.github_id)

      // Optimistic: temporary user message
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: convId,
        role: "user",
        content,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => ({
        ...prev,
        [convId]: dedupeMessages([...(prev[convId] || []), tempUserMessage]),
      }))

      // Create user message in backend
      const userMessage = await conversationService.createMessage(
        convId,
        "user",
        content
      )

      // Replace temp message with actual saved one
      setMessages((prev) => ({
        ...prev,
        [convId]: dedupeMessages([
          ...(prev[convId] || []).filter((m) => m.id !== tempUserMessage.id),
          userMessage,
        ]),
      }))

      // Update conversation title if first message
      setMessages((prev) => {
        const current = prev[convId] || []
        if (current.length === 1) {
          updateConversationTitle(convId, content)
        }
        return prev
      })

      console.log("Sending AI request with:", { content, github_id: githubId })

      // Ask AI — backend returns structured AIResponse
      const aiResponse: AIResponse = await aiService.askQuestion(
        content,
        githubId,
        convId
      )

      // Create assistant message with structured content
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        conversation_id: convId,
        role: "assistant",
        content: JSON.stringify(aiResponse.response),
        sources: aiResponse.sources,
        disclaimer: aiResponse.disclaimer,  // Add disclaimer if present
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => ({
        ...prev,
        [convId]: dedupeMessages([
          ...(prev[convId] || []),
          { ...assistantMessage, content: aiResponse }, // ✅ keep parsed in memory
        ]),
      }))
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send message"
      console.error("Message sending error:", err)
      setError(errorMessage)

      // Enhanced error handling
      if (errorMessage.includes("Invalid Groq API key")) {
        toast.error(
          "Issue with Groq API key. Please check your settings or try another provider."
        )
      } else if (errorMessage.includes("Invalid Gemini API key")) {
        toast.error("Issue with Gemini API key. Please check your settings.")
      } else if (errorMessage.includes("Invalid OpenAI API key")) {
        toast.error("Issue with OpenAI API key. Please check your settings.")
      } else if (errorMessage.includes("authenticated")) {
        toast.error("Session expired. Please log in again.")
      } else if (errorMessage.includes("Service temporarily unavailable")) {
        toast.error(
          "The AI service is temporarily unavailable. Try again later or use your own API key."
        )
      } else if (errorMessage.includes("quota exceeded")) {
        toast.error(
          "Daily quota exceeded. Please add your own API key for unlimited queries."
        )
      } else if (errorMessage.includes("All providers unavailable")) {
        toast.error(
          "All AI providers are currently unavailable. Please try again later."
        )
      } else if (errorMessage.includes("Provider routing failed")) {
        toast.error(
          "Unable to route your query to an available provider. Please try again."
        )
      } else {
        toast.error(errorMessage)
      }

      throw err
    } finally {
      setAnalyzingLoading(false)
    }
  }

  /** Delete message (future API) */
  const deleteMessage = async (_messageId: string): Promise<void> => {
    try {
      toast.success("Message deleted")
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete message"
      toast.error(errorMessage)
      throw err
    }
  }

  /** Clear all messages in conversation */
  const clearConversationMessages = async (convId: string): Promise<void> => {
    try {
      setMessages((prev) => ({ ...prev, [convId]: [] }))
      toast.success("Conversation cleared")
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to clear conversation"
      toast.error(errorMessage)
      throw err
    }
  }

  return {
    messages,
    fetchingLoading,
    setupLoading,
    analyzingLoading,
    error,
    sendMessage,
    deleteMessage,
    clearConversationMessages,
    refreshMessages: conversationId
      ? () => loadMessages(conversationId)
      : undefined,
  }
}

