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

export function MessageBubbleNew({ message, isLoading = false }: MessageBubbleNewProps) {
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
      await navigator.clipboard.writeText(
        typeof message.content === "string"
          ? message.content
          : (message.content as AIResponse).response
      )
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch (error) {
      console.error("Failed to copy text:", error)
    }
  }

  /** Render AI assistant content with formatting */
  const renderAssistantContent = (content: string | AIResponse) => {
    if (typeof content === "string") {
      return <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    }

    const disclaimer =
      "⚠️ This response is for informational purposes only and does not constitute legal advice."

    return (
      <div className="space-y-5">
        {/* Main response */}
        <div className="prose prose-base leading-relaxed dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content.response}
          </ReactMarkdown>
        </div>

        {/* Sources */}
        {content.sources?.length > 0 && (
          <div className="p-4 rounded-xl bg-[var(--hover-color)]/30 border border-[var(--border-color)]">
            <div className="text-sm font-semibold mb-2 text-[var(--text-primary)]">
              📚 Sources
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm text-[var(--text-secondary)]">
              {content.sources.map((src, idx) => (
                <li key={idx}>
                  {src.title ? (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-[var(--primary-color)]"
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
        <div className="p-3 rounded-lg bg-amber-50 text-amber-800 text-xs border border-amber-200">
          {disclaimer}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex w-full mb-6", isUser ? "justify-end" : "justify-start")}>
      {/* Left: Assistant avatar */}
      {!isUser && (
        <div className="flex-shrink-0 mr-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md"
            style={{ background: "var(--gradient-primary)" }}
            aria-hidden
          >
            <span className="material-symbols-outlined text-base">balance</span>
          </div>
        </div>
      )}

      {/* Message content */}
      <div className={cn("flex flex-col max-w-[75%]", isUser ? "items-end" : "items-start")}>
        {/* Sender label */}
        <div
          className={cn(
            "mb-2 text-xs font-semibold",
            isUser ? "text-pink-400" : "text-purple-400"
          )}
        >
          {isUser ? "You" : "HaqooqAI"}
        </div>

        {/* Bubble */}
        <div
          className={cn(
            "relative px-5 py-4 rounded-2xl leading-relaxed shadow-md text-[15px] tracking-[0.2px]",
            isUser
              ? "bg-[var(--primary-color)] text-white rounded-br-lg"
              : "bg-[var(--bubble-assistant-bg)] text-[var(--text-primary)] border border-[var(--border-color)]"
          )}
          title={timestamp.toLocaleString()}
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

          {/* Actions */}
          {!isUser && (
            <div className="flex items-center gap-3 mt-4 text-sm">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-md text-slate-400 hover:text-[var(--primary-color)] hover:bg-[var(--hover-color)] transition"
                title={copied ? "Copied!" : "Copy"}
              >
                <span className="material-symbols-outlined text-base">
                  {copied ? "check" : "content_copy"}
                </span>
              </button>
              <button
                className="p-1.5 rounded-md text-slate-400 hover:text-[var(--primary-color)] hover:bg-[var(--hover-color)] transition"
                title="Helpful"
              >
                <span className="material-symbols-outlined text-base">thumb_up</span>
              </button>
              <button
                className="p-1.5 rounded-md text-slate-400 hover:text-[var(--primary-color)] hover:bg-[var(--hover-color)] transition"
                title="Not helpful"
              >
                <span className="material-symbols-outlined text-base">thumb_down</span>
              </button>
              <button
                className="p-1.5 rounded-md text-slate-400 hover:text-[var(--primary-color)] hover:bg-[var(--hover-color)] transition"
                title="Regenerate"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
              </button>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div
          className={cn(
            "mt-2 text-[11px] text-[var(--text-secondary)]",
            isUser ? "text-right" : "text-left"
          )}
        >
          {timeLabel}
        </div>
      </div>

      {/* Right: User avatar */}
      {isUser && (
        <div className="flex-shrink-0 ml-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white shadow-md"
            style={
              userAvatarStyle
                ? userAvatarStyle
                : { background: "var(--gradient-primary)" }
            }
            aria-hidden
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
