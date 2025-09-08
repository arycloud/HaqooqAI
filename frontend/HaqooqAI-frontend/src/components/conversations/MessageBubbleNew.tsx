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

function isAIResponse(val: unknown): val is AIResponse {
  return !!val && typeof val === "object" && "response" in (val as any)
}

export function MessageBubbleNew({ message, isLoading = false }: MessageBubbleNewProps) {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)
  const isUser = message.role === "user"
  const [showActions, setShowActions] = useState(false)  // New: Collapsed menu
  const [showSources, setShowSources] = useState(false)  // New: Accordion for sources

  const timestamp = useMemo(() => {
    try {
      return message.created_at ? new Date(message.created_at) : new Date()
    } catch {
      return new Date()
    }
  }, [message.created_at])

  const timeLabel = useMemo(() => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const mins = Math.floor(diff / 60000)
    return mins < 1 ? 'Just now' : mins === 1 ? '1 min ago' : `${mins} mins ago`
  }, [timestamp])

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
          : isAIResponse(message.content)
          ? message.content.response
          : ""

      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch (error) {
      console.error("Failed to copy text:", error)
    }
  }

  /** Render AI assistant content with clean markdown + structured boxes */
  const renderAssistantContent = (content: string | AIResponse) => {
    if (!isAIResponse(content)) {
      return (
        <div className="prose prose-neutral max-w-none leading-6 font-inter">  {/* Inter, neutral prose */}
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(content ?? "")}</ReactMarkdown>
        </div>
      )
    }

    const disclaimer =
      "This response is for informational purposes only and does not constitute legal advice."

    return (
      <div className="space-y-5">
        {/* Main response */}
        <div
          className={cn(
            "prose prose-neutral max-w-none font-inter",
            // Typography tuning
            "prose-sm md:prose-base",
            "prose-headings:font-semibold prose-h2:mt-3 prose-h2:mb-1.5",
            "prose-p:leading-7 prose-li:leading-7",
            "prose-ul:my-2 prose-ol:my-2 prose-li:my-[2px]",
            "prose-a:no-underline hover:prose-a:underline",
            "prose-a:text-[var(--primary-color)]",
            "prose-strong:text-[var(--text-primary)]",
            "prose-blockquote:text-[var(--text-secondary)]",
            "prose-pre:bg-[#0b1324] prose-pre:text-slate-100 prose-pre:rounded-lg",
            "prose-code:bg-[#0b1324] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded"
          )}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content.response}
          </ReactMarkdown>
        </div>

        {/* Sources: New Accordion */}
        {content.sources?.length > 0 && (
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--hover-color)] overflow-hidden">  {/* Card style */}
            <button
              onClick={() => setShowSources(!showSources)}
              className="w-full px-4 py-3 text-left text-sm font-medium text-[var(--text-primary)] flex items-center justify-between hover:bg-[var(--hover-color)] transition-colors"
              aria-expanded={showSources}
              aria-label="Toggle sources"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[var(--secondary-color)]">library_books</span>
                Sources ({content.sources.length})
              </span>
              <span className="material-symbols-outlined transition-transform">{showSources ? 'expand_less' : 'expand_more'}</span>
            </button>
            {showSources && (
              <div className="px-4 pb-4">
                <ul className="space-y-1 text-sm text-[var(--text-secondary)] list-disc list-inside">
                  {content.sources.map((src, idx) => (
                    <li key={idx}>
                      {src.url ? (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--secondary-color)] hover:underline focus-visible:underline"
                        >
                          {src.title || src.url}
                        </a>
                      ) : (
                        src.title
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer: Inline pill */}
        <div className="flex items-center gap-2 rounded-full border border-[var(--error)]/30 bg-[var(--error)]/10 px-3 py-1.5 text-xs text-[var(--text-primary)]" aria-label="Disclaimer">
          <span className="material-symbols-outlined text-sm">info</span>  {/* Icon changed to info */}
          <span>{disclaimer}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex w-full mb-6", isUser ? "justify-end" : "justify-start")}>
      {/* Left: Assistant avatar */}
      {!isUser && (
        <div className="flex-shrink-0 self-end">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--primary-color)] text-white" aria-hidden>
            <span className="material-symbols-outlined text-sm">balance</span>
          </div>
        </div>
      )}

      {/* Message content */}
      <div
        className={cn(
          "flex flex-col",
          // Wider & more readable line length; responsive so it doesn’t stretch on large screens
          "max-w-[92%] sm:max-w-[85%] lg:max-w-[78%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Sender label */}
        <div className={cn("mb-1 text-xs font-medium tracking-tight", isUser ? "text-[var(--primary-color)]" : "text-[var(--secondary-color)]")}>
          {isUser ? "You" : "HaqooqAI"}
        </div>

        {/* Bubble */}
        <div
          className={cn(
            "relative px-4 py-3 text-base leading-6 space-y-3 max-w-full",
            isUser
              ? "bg-[var(--primary-color)]/90 text-white rounded-br-lg"
              : "bg-[var(--bubble-assistant-bg)] text-[var(--text-primary)] border border-[var(--border-color)]"
          )}
          title={timestamp.toLocaleString()}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap font-inter">
              {typeof message.content === "string"
                ? message.content
                : isAIResponse(message.content)
                ? message.content.response
                : ""}
            </div>
          ) : (
            renderAssistantContent(message.content)
          )}

          {/* Actions */}
          {!isUser && (
            <div className="flex items-center gap-3 mt-4 text-sm">
              <button
                onClick={handleCopy}
                className={cn(
                  "p-1.5 rounded-md text-slate-400 transition",
                  "hover:text-[var(--primary-color)] hover:bg-[var(--hover-color)]"
                )}
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

        {/* Actions: Collapsed menu (new) */}
        {!isUser && (
                    <div className="absolute -top-8 right-0">  {/* Positioned above for space */}
                      <button
                        onClick={() => setShowActions(!showActions)}
                        className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--primary-color)] hover:bg-[var(--hover-color)] transition"
                        aria-label="Message actions"
                        aria-expanded={showActions}
                      >
                        <span className="material-symbols-outlined text-sm">more_horiz</span>
                      </button>
                      {showActions && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[var(--sidebar-color)] rounded-lg shadow-lg border border-[var(--border-color)] py-2 z-10">
                          <button onClick={handleCopy} className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--hover-color)] flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">{copied ? "check" : "content_copy"}</span>
                            {copied ? "Copied!" : "Copy"}
                          </button>
                          {/* Add thumbs/regenerate similarly */}
                        </div>
                      )}
                    </div>
        )}
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
        <div className="flex-shrink-0 self-end">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white shadow-md"
            style={userAvatarStyle ? userAvatarStyle : { background: "var(--gradient-primary)" }}
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
