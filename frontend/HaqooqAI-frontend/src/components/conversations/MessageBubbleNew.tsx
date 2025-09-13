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
  const [showSources, setShowSources] = useState(false)

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
    // Handle content that might be a string or an AIResponse object
    let responseContent = "";
    let sources: Source[] = [];
    let showDisclaimer = false;
    
    if (typeof content === "string") {
      // If it's a string, use it directly
      responseContent = content;
    } else if (content && typeof content === "object") {
      // If it's an AIResponse object, extract the fields
      responseContent = content.response || "";
      sources = content.sources || [];
      showDisclaimer = content.show_disclaimer || false;
    }

    // Standard disclaimer text to show when show_disclaimer is true
    const disclaimerText = "This response is for informational purposes only and does not constitute legal advice.";

    return (
      <div className="space-y-5">
        {/* Main response */}
        <div
          className={cn(
            "prose prose-slate dark:prose-invert max-w-none",
            // Typography tuning
            "prose-sm md:prose-base text-[17px]",
            "prose-headings:font-semibold prose-h2:mt-4 prose-h2:mb-2",
            "prose-p:leading-7 prose-li:leading-9",
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
            {responseContent}
          </ReactMarkdown>
        </div>

        {/* Sources */}
        {sources.length > 0 && (
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--hover-color)] overflow-hidden">  {/* Card style */}
            <button
              onClick={() => setShowSources(!showSources)}
              className="w-full px-4 py-3 text-left font-medium text-[var(--text-primary)] flex items-center justify-between hover:bg-[var(--hover-color)] transition-colors text-[15px]" 
              aria-expanded={showSources}
              aria-label="Toggle sources"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[var(--secondary-color)]">library_books</span>
                Sources ({sources.length})
              </span>
              <span className="material-symbols-outlined transition-transform">{showSources ? 'expand_less' : 'expand_more'}</span>
            </button>
            {showSources && (
              <div className="px-4 pb-4">
                <ul className="space-y-1 text-[15px] text-[var(--text-secondary)] list-disc list-inside"> 
                  {sources.map((src, idx) => (
                    <li key={idx}>
                      {src.url ? (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--secondary-color)] hover:underline focus-visible:underline text-[15px]" 
                        >
                          {src.title || src.url}
                        </a>
                      ) : (
                        <span className="text-[15px]">{src.title}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer - only show when show_disclaimer is true */}
        {showDisclaimer && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50/90 px-4 py-3 text-[13.5px] md:text-[15px] text-amber-900">
            <span className="material-symbols-outlined text-base md:text-[18px]">warning</span>
            <span>{disclaimerText}</span>
          </div>
        )}
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
      <div
        className={cn(
          "flex flex-col",
          // Wider & more readable line length; responsive so it doesn’t stretch on large screens
          "max-w-[95%] sm:max-w-[90%] lg:max-w-[85%]", 
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Sender label */}
        <div
          className={cn(
            "mb-2 font-semibold tracking-wide text-[13px]", 
            isUser ? "text-pink-400" : "text-purple-400"
          )}
        >
          {isUser ? "You" : "HaqooqAI"}
        </div>

        {/* Bubble */}
        <div
          className={cn(
            "relative px-6 py-5 rounded-2xl leading-relaxed shadow-md text-[17px] tracking-[0.25px] space-y-4",
            isUser
              ? "bg-[var(--primary-color)]/90 text-white rounded-br-lg"
              : "bg-[var(--bubble-assistant-bg)] text-[var(--text-primary)] border border-[var(--border-color)]"
          )}
          title={timestamp.toLocaleString()}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap text-[17px]">
              {typeof message.content === "string"
                ? message.content
                : typeof message.content === "object" && message.content !== null
                ? (message.content as any).response || ""
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

        {/* Timestamp */}
        <div
          className={cn(
            "mt-2 text-[var(--text-secondary)] text-[13px]",
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
