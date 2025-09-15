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
  const loadMessages = async (convId: string, retryCount = 0) => {
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

      // ✅ Properly handle message content for both user and assistant messages
      const parsedMessages = conversationMessages.map((m) => {
        // For assistant messages, the content might be a string or an AIResponse object
        if (m.role === "assistant") {
          // Check if content is already an object (AIResponse) or needs to be parsed
          let content = m.content;
          let sources = m.sources || [];
          let showDisclaimer = m.show_disclaimer || false;
          
          // Debug: Log the raw content
          console.log('Raw message content from database:', { id: m.id, content, contentType: typeof content });
          
          // If content is a string that looks like JSON, try to parse it
          if (typeof m.content === "string") {
            // Only try to parse as JSON if it looks like JSON (starts with { or [)
            if (m.content.trim().startsWith('{') || m.content.trim().startsWith('[')) {
              try {
                const parsedContent = JSON.parse(m.content);
                // If parsing succeeds and it looks like an AIResponse object
                if (parsedContent && typeof parsedContent === "object" && "response" in parsedContent) {
                  content = parsedContent.response;
                  sources = parsedContent.sources || [];
                  showDisclaimer = parsedContent.show_disclaimer || false;
                }
                // If it's just a regular string that happens to be valid JSON, keep it as is
              } catch (e) {
                // If parsing fails, it's just a regular string response, which is fine
                console.log("Could not parse message content as JSON, using raw string.", e);
              }
            }
            // If it doesn't look like JSON, treat it as a regular string (no action needed)
          } else if (typeof m.content === "object" && m.content !== null) {
            // If content is already an object, extract the fields
            content = (m.content as any).response || m.content;
            sources = (m.content as any).sources || [];
            showDisclaimer = (m.content as any).show_disclaimer || false;
          }

          // Debug: Log the sources for this message
          console.log('Processing message with sources:', { id: m.id, sources, content });

          return {
            ...m,
            content,
            sources,
            show_disclaimer: showDisclaimer,
          };
        } else {
          // For user messages, content should be a string
          return m;
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
      
      // Retry mechanism for timeout errors (up to 2 retries)
      if (errorMessage.includes('timeout') && retryCount < 2) {
        console.warn(`Timeout occurred, retrying... (${retryCount + 1}/2)`);
        setTimeout(() => {
          loadMessages(convId, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      setError(errorMessage)
      console.error("Failed to load messages:", err)
      
      // Show user-friendly toast for specific errors
      if (errorMessage.includes('timeout')) {
        toast.error('Request timeout. The server is taking too long to respond. Please try again later.')
      } else if (errorMessage.includes('Network error')) {
        toast.error('Network error. Please check your internet connection and try again.')
      } else if (errorMessage.includes('Authentication expired')) {
        toast.error('Session expired. Please log in again.')
      } else {
        toast.error('Failed to load messages. Please try again.')
      }
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

      // Debug: Log the AI response
      console.log('AI Response received:', aiResponse);

      // Create assistant message with structured content
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        conversation_id: convId,
        role: "assistant",
        content: aiResponse, // Pass the entire AIResponse object to preserve structure
        sources: aiResponse.sources || [], // Explicitly set sources
        show_disclaimer: aiResponse.show_disclaimer || false,  // Use show_disclaimer flag
        created_at: new Date().toISOString(),
      }

      // Debug: Log the assistant message
      console.log('Creating assistant message:', assistantMessage);

      setMessages((prev) => ({
        ...prev,
        [convId]: dedupeMessages([
          ...(prev[convId] || []),
          assistantMessage, // ✅ keep as proper message structure
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