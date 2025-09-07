import { useState } from 'react'
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

  // Generate initials for fallback avatar
  const getUserInitials = (user: any) => {
    if (user?.username) return user.username.charAt(0).toUpperCase()
    if (user?.email) return user.email.charAt(0).toUpperCase()
    return 'U'
  }

  const getAvatarContent = () => {
    if (isUser) {
      if (user?.avatar_url) {
        return (
          <div
            className="w-9 h-9 rounded-full bg-center bg-cover flex-shrink-0"
            style={{ backgroundImage: `url("${user.avatar_url}")` }}
          />
        )
      }
      return (
        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--primary-color)] text-white font-bold">
          {getUserInitials(user)}
        </div>
      )
    }

    return (
      <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] text-white">
        <span className="material-symbols-outlined text-base">balance</span>
      </div>
    )
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isUser ? "justify-end text-right" : "justify-start text-left"
      )}
    >
      {/* Left (Assistant) / Right (User) alignment */}
      {!isUser && getAvatarContent()}

      <div className={cn("flex flex-col max-w-[70%]")}>
        {/* Header: name + timestamp */}
        <div
          className={cn(
            "flex items-center mb-1 text-xs font-medium",
            isUser ? "justify-end text-pink-400" : "justify-start text-purple-400"
          )}
        >
          {!isUser && <span>{'HaqooqAI'}</span>}
          <span className="mx-2 text-[var(--text-secondary)] text-[11px]">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isUser && <span>{'You'}</span>}
        </div>

        {/* Bubble */}
        <div
          className={cn(
            "p-3 rounded-2xl shadow-sm",
            isUser
              ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
              : "bg-[var(--hover-color)] text-[var(--text-primary)]"
          )}
        >
          <div className="text-sm leading-relaxed whitespace-pre-line">
            {message.content}
          </div>

          {/* Actions (only for assistant) */}
          {!isUser && (
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-[var(--background-color)] hover:text-[var(--text-primary)] transition-colors"
                title={copied ? "Copied!" : "Copy message"}
              >
                <span className="material-symbols-outlined text-sm">
                  {copied ? 'check' : 'content_copy'}
                </span>
              </button>
              <button className="p-1.5 rounded-lg text-slate-400 hover:bg-[var(--background-color)] hover:text-[var(--text-primary)] transition-colors">
                <span className="material-symbols-outlined text-sm">thumb_up</span>
              </button>
              <button className="p-1.5 rounded-lg text-slate-400 hover:bg-[var(--background-color)] hover:text-[var(--text-primary)] transition-colors">
                <span className="material-symbols-outlined text-sm">thumb_down</span>
              </button>
              <button className="p-1.5 rounded-lg text-slate-400 hover:bg-[var(--background-color)] hover:text-[var(--text-primary)] transition-colors">
                <span className="material-symbols-outlined text-sm">refresh</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {isUser && getAvatarContent()}
    </div>
  )
}
