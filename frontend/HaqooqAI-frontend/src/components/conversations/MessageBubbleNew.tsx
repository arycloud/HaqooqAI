import { useState, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Message } from '@/types/message'
import { cn } from '@/lib/utils'

interface MessageBubbleNewProps {
  message: Message
  isLoading?: boolean
}

function resolveTimestamp(message: Message) {
  // support different backends/fields safely
  const ts =
    (message as any).createdAt ||
    (message as any).created_at ||
    (message as any).timestamp ||
    Date.now()
  try {
    return new Date(ts)
  } catch {
    return new Date()
  }
}

export function MessageBubbleNew({ message, isLoading = false }: MessageBubbleNewProps) {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  const isUser = message.role === 'user'
  const created = useMemo(() => resolveTimestamp(message), [message])

  const getUserInitials = (u: any) => {
    if (u?.username) return u.username.charAt(0).toUpperCase()
    if (u?.email) return u.email.charAt(0).toUpperCase()
    return 'U'
  }

  const getAvatarStyle = () => {
    if (isUser) {
      if (user?.avatar_url) {
        return { backgroundImage: `url("${user.avatar_url}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
      }
      return {
        backgroundColor: 'var(--primary-color)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '14px'
      }
    }
    return {
      background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex flex-col max-w-[82%] sm:max-w-[75%]", isUser ? "items-end" : "items-start")}>
        {/* Sender name */}
        <p className={cn("text-xs sm:text-sm font-semibold mb-1 select-none",
          isUser ? "text-pink-400 text-right" : "text-purple-400 text-left"
        )}>
          {isUser ? "You" : "HaqooqAI"}
        </p>

        {/* Row with avatar and bubble */}
        <div className={cn("flex items-end gap-3 w-full", isUser ? "flex-row-reverse" : "flex-row")}>
          {/* Avatar */}
          <div
            className="rounded-full size-8 sm:size-10 bg-center bg-no-repeat bg-cover flex-shrink-0"
            style={getAvatarStyle()}
          >
            {isUser && !user?.avatar_url && <span>{getUserInitials(user)}</span>}
            {!isUser && <span className="material-symbols-outlined text-sm sm:text-base">balance</span>}
          </div>

          {/* Bubble */}
          <div
            className={cn(
              "px-4 py-3 rounded-2xl border",
              isUser
                ? "bg-[var(--primary-color)] text-white border-transparent shadow-sm"
                : "bg-[var(--hover-color)]/60 text-[var(--text-primary)] border-[var(--border-color)]"
            )}
          >
            <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </div>

            {/* Actions (assistant) */}
            {!isUser && (
              <div className="flex items-center gap-1.5 mt-3">
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-[var(--hover-color)] hover:text-[var(--text-primary)] transition-colors"
                  title={copied ? "Copied!" : "Copy message"}
                >
                  <span className="material-symbols-outlined text-base">
                    {copied ? 'check' : 'content_copy'}
                  </span>
                </button>
                <button className="p-1.5 rounded-lg text-slate-400 hover:bg-[var(--hover-color)] hover:text-[var(--text-primary)] transition-colors" title="Helpful">
                  <span className="material-symbols-outlined text-base">thumb_up</span>
                </button>
                <button className="p-1.5 rounded-lg text-slate-400 hover:bg-[var(--hover-color)] hover:text-[var(--text-primary)] transition-colors" title="Not helpful">
                  <span className="material-symbols-outlined text-base">thumb_down</span>
                </button>
                <button className="p-1.5 rounded-lg text-slate-400 hover:bg-[var(--hover-color)] hover:text-[var(--text-primary)] transition-colors" title="Regenerate">
                  <span className="material-symbols-outlined text-base">refresh</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <p className={cn("text-[11px] text-slate-400 mt-1 select-none", isUser ? "text-right" : "text-left")}>
          {created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}
