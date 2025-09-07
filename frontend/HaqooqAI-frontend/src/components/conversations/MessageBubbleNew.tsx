import { useState, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Message } from '@/types/message'
import { cn } from '@/lib/utils'

interface MessageBubbleNewProps {
  message: Message
  isLoading?: boolean
}

export function MessageBubbleNew({ message, isLoading = false }: MessageBubbleNewProps) {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  const isUser = message.role === 'user'

  // Parse timestamp safely
  const timestamp = useMemo(() => {
    try {
      return message.created_at ? new Date(message.created_at) : new Date()
    } catch {
      return new Date()
    }
  }, [message.created_at])

  const timeLabel = useMemo(() => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }, [timestamp])

  const getUserInitials = (u: any) => {
    if (u?.username) return u.username.charAt(0).toUpperCase()
    if (u?.email) return u.email.charAt(0).toUpperCase()
    return 'U'
  }

  const userAvatarStyle = useMemo(() => {
    if (user?.avatar_url) {
      return {
        backgroundImage: `url("${user.avatar_url}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } as React.CSSProperties
    }
    return undefined
  }, [user?.avatar_url])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  return (
    <div className={cn("flex w-full mb-4", isUser ? "justify-end" : "justify-start")}>
      {/* Left side (assistant avatar) */}
      {!isUser && (
        <div className="flex-shrink-0 mr-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm"
            style={{ background: 'linear-gradient(135deg,var(--primary-color),var(--secondary-color))' }}
            aria-hidden
          >
            <span className="material-symbols-outlined text-sm">balance</span>
          </div>
        </div>
      )}

      <div className={cn("flex flex-col max-w-[78%]", isUser ? "items-end" : "items-start")}>
        {/* Compact header: name + time */}
        <div className={cn("flex items-center gap-2 mb-1 w-full", isUser ? "justify-end" : "justify-start")}>
          {/* Name */}
          <div className={cn("text-xs font-medium", isUser ? "text-pink-400" : "text-purple-400")}>
            {isUser ? "You" : "HaqooqAI"}
          </div>
          {/* Dot separator */}
          <div className="text-[11px] text-[var(--text-secondary)] select-none">
            •
          </div>
        </div>

        {/* Bubble */}
        <div
          className={cn(
            "relative px-4 py-3 rounded-2xl leading-relaxed text-sm break-words shadow-sm",
            isUser
              ? "bg-[var(--primary-color)] text-white rounded-br-lg"
              : "bg-[var(--sidebar-color)] text-[var(--text-primary)] border border-[var(--border-color)]"
          )}
          title={timestamp.toLocaleString()}
        >
          {/* message content */}
          <div className="whitespace-pre-wrap">
            {message.content}
          </div>

          {/* action row for assistant */}
          {!isUser && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleCopy}
                className="p-1 rounded-md text-slate-400 hover:text-[var(--text-primary)] hover:bg-[var(--hover-color)] transition"
                title={copied ? "Copied!" : "Copy"}
              >
                <span className="material-symbols-outlined text-sm">
                  {copied ? 'check' : 'content_copy'}
                </span>
              </button>

              <button className="p-1 rounded-md text-slate-400 hover:text-[var(--text-primary)] hover:bg-[var(--hover-color)] transition" title="Helpful">
                <span className="material-symbols-outlined text-sm">thumb_up</span>
              </button>

              <button className="p-1 rounded-md text-slate-400 hover:text-[var(--text-primary)] hover:bg-[var(--hover-color)] transition" title="Not helpful">
                <span className="material-symbols-outlined text-sm">thumb_down</span>
              </button>

              <button className="p-1 rounded-md text-slate-400 hover:text-[var(--text-primary)] hover:bg-[var(--hover-color)] transition" title="Regenerate">
                <span className="material-symbols-outlined text-sm">refresh</span>
              </button>
            </div>
          )}
        </div>

        {/* timestamp below (subtle) */}
        <div className={cn("text-[11px] text-[var(--text-secondary)] mt-1", isUser ? "text-right" : "text-left")}>
          {timeLabel}
        </div>
      </div>

      {/* Right side (user avatar) */}
      {isUser && (
        <div className="flex-shrink-0 ml-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-white"
            style={userAvatarStyle ? userAvatarStyle : { backgroundColor: 'var(--primary-color)' }}
            aria-hidden
          >
            {!user?.avatar_url && getInitials(userAvatarStyle ? {} : user)}
            {user?.avatar_url ? null : null}
          </div>
        </div>
      )}
    </div>
  )
}

// small helper to avoid repetition (keeps linter happy)
function getInitials(u: any) {
  if (u?.username) return u.username.charAt(0).toUpperCase()
  if (u?.email) return u.email.charAt(0).toUpperCase()
  return 'U'
}
