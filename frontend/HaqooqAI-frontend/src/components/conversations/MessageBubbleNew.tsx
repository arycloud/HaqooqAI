import { useState, useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useAuth } from "@/hooks/useAuth"
import { Message } from "@/types/message"
import { cn } from "@/lib/utils"
import { AIResponse } from "@/types/api"

interface MessageBubbleNewProps {
  message: Message
  isLoading?: boolean
}

export function MessageBubbleNew({ message }: MessageBubbleNewProps) {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const isUser = message.role === "user"

  const timestamp = useMemo(() => {
    try {
      return message.created_at ? new Date(message.created_at) : new Date()
    } catch {
      return new Date()
    }
  }, [message.created_at])

  const timeLabel = useMemo(
    () => timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    [timestamp]
  )

  const userAvatarStyle = useMemo(() => {
    if (user?.avatar_url) {
      return {
        backgroundImage: `url("${user.avatar_url}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      } as React.CSSProperties
    }
    return undefined
  }, [user?.avatar_url])

  const handleCopy = async () => {
    try {
      const text =
        typeof message.content === "string"
          ? message.content
          : (message.content as AIResponse).response
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch (error) {
      console.error("Failed to copy text:", error)
    }
  }

  const renderAssistantContent = (content: string | AIResponse) => {
    if (typeof content === "string") {
      return (
        <div className="prose prose-base dark:prose-invert max-w-none leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      )
    }

    const disclaimer =
      "⚠️ This response is for informational purposes only and does not constitute legal advice."

    return (
      <div className="space-y-5">
        {/* Main response */}
        <div className="prose prose-base dark:prose-invert max-w-none leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content.response}
          </ReactMarkdown>
        </div>

        {/* Sources */}
        {content.sources?.length > 0 && (
          <div className="p-4 rounded-lg bg-[var(--hover-color)]/30 border border-[var(--border-color)] text-sm">
            <div className="font-semibold mb-2 flex items-center">📚 Sources</div>
            <ul className="list-disc list-inside space-y-1">
              {content.sources.map((src, idx) => (
                <li key={idx} className="text-[var(--text-secondary)]">
                  {src.title ? (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--primary-color)] hover:underline"
                    >
                      {src.title}
                    </a>
                  ) : (
                    src.url
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclaimer */}
        <div className="p-4 rounded-md bg-amber-50 text-amber-800 text-sm border-l-4 border-amber-500 shadow-sm">
          {disclaimer}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex w-full mb-6", isUser ? "justify-end" : "justify-start")}>
      {/* Assistant avatar */}
      {!isUser && (
        <div className="flex-shrink-0 mr-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm"
            style={{ background: "var(--gradient-primary)" }}
          >
            <span className="material-symbols-outlined text-sm">balance</span>
          </div>
        </div>
      )}

      {/* Bubble */}
      <div className={cn("flex flex-col max-w-[90%] md:max-w-3xl", isUser ? "items-end" : "items-start")}>
        {/* Name + time */}
        <div className="mb-1 flex items-center gap-2">
          <span className={cn("text-xs font-medium", isUser ? "text-pink-300" : "text-purple-300")}>
            {isUser ? "You" : "HaqooqAI"}
          </span>
          <span className="text-[10px] text-[var(--text-secondary)]">{timeLabel}</span>
        </div>

        {/* Bubble content */}
        <div
          className={cn(
            "relative px-5 py-4 rounded-2xl leading-relaxed text-base shadow-md",
            isUser
              ? "bg-[var(--primary-color)] text-white rounded-br-lg"
              : "bg-[var(--bubble-assistant-bg)] text-[var(--text-primary)]"
          )}
        >
          {isUser ? (
          <div className="whitespace-pre-wrap">
            {typeof message.content === "string"
              ? message.content
              : (message.content as AIResponse).response}
          </div>
        ) : (
          renderAssistantContent(message.content)
        )}

          {/* Copy + actions (assistant only) */}
          {!isUser && (
            <div className="flex items-center gap-3 mt-4 text-sm text-[var(--text-secondary)]">
              <button
                onClick={handleCopy}
                className="hover:text-[var(--primary-color)] transition"
                title={copied ? "Copied!" : "Copy"}
              >
                <span className="material-symbols-outlined text-sm">
                  {copied ? "check" : "content_copy"}
                </span>
              </button>
              <button title="Helpful" className="hover:text-[var(--primary-color)] transition">
                <span className="material-symbols-outlined text-sm">thumb_up</span>
              </button>
              <button title="Not helpful" className="hover:text-[var(--primary-color)] transition">
                <span className="material-symbols-outlined text-sm">thumb_down</span>
              </button>
              <button title="Regenerate" className="hover:text-[var(--primary-color)] transition">
                <span className="material-symbols-outlined text-sm">refresh</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="flex-shrink-0 ml-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-white"
            style={userAvatarStyle ? userAvatarStyle : { background: "var(--gradient-primary)" }}
          >
            {!user?.avatar_url && getInitials(user)}
          </div>
        </div>
      )}
    </div>
  )
}

function getInitials(u: any) {
  if (u?.username) return u.username.charAt(0).toUpperCase()
  if (u?.email) return u.email.charAt(0).toUpperCase()
  return "U"
}
