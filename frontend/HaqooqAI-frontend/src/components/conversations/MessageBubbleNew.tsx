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

  // Generate user initials for fallback
  const getUserInitials = (user: any) => {
    if (user?.username) {
      return user.username.charAt(0).toUpperCase()
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return 'U'
  }

  const getAvatarStyle = () => {
    if (isUser) {
      if (user?.avatar_url) {
        return { backgroundImage: `url("${user.avatar_url}")` }
      } else {
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
    } else {
      return {
        background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }
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
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "flex items-start gap-4 max-w-[75%]",
          isUser ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* Avatar */}
        <div
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 flex-shrink-0"
          style={getAvatarStyle()}
        >
          {isUser && !user?.avatar_url && (
            <span>{getUserInitials(user)}</span>
          )}
          {!isUser && (
            <span className="material-symbols-outlined text-base">balance</span>
          )}
        </div>

        {/* Message Content */}
        <div
          className={cn(
            "p-4 rounded-xl",
            isUser
              ? "bg-gradient-to-r from-pink-500/10 to-purple-500/10"
              : "bg-gradient-to-r from-purple-500/10 to-indigo-500/10 flex-1"
          )}
        >
          {/* Role Label */}
          <p
            className={cn(
              "text-sm font-bold leading-tight mb-2",
              isUser ? "text-pink-300 text-right" : "text-purple-300"
            )}
          >
            {isUser ? 'You' : 'HaqooqAI'}
          </p>

          {/* Message Content */}
          <div className="text-slate-300 text-base font-normal leading-relaxed space-y-2">
            {message.content.split('\n').map((line, index) =>
              line.trim() && <p key={index}>{line}</p>
            )}
          </div>

          {/* Action Buttons (Assistant Only) */}
          {!isUser && (
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg text-slate-400 hover:bg-[var(--hover-color)] hover:text-[var(--text-primary)] transition-colors"
                title={copied ? "Copied!" : "Copy message"}
              >
                <span className="material-symbols-outlined text-base">
                  {copied ? 'check' : 'content_copy'}
                </span>
              </button>
              <button className="p-2 rounded-lg text-slate-400 hover:bg-[var(--hover-color)] hover:text-[var(--text-primary)] transition-colors">
                <span className="material-symbols-outlined text-base">thumb_up</span>
              </button>
              <button className="p-2 rounded-lg text-slate-400 hover:bg-[var(--hover-color)] hover:text-[var(--text-primary)] transition-colors">
                <span className="material-symbols-outlined text-base">thumb_down</span>
              </button>
              <button className="p-2 rounded-lg text-slate-400 hover:bg-[var(--hover-color)] hover:text-[var(--text-primary)] transition-colors">
                <span className="material-symbols-outlined text-base">refresh</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
