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
    <div className="flex items-start gap-4">
      {/* Avatar */}
      <div 
        className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 flex-shrink-0"
        style={{
          backgroundImage: isUser 
            ? (user?.avatar_url 
                ? `url("${user.avatar_url}")` 
                : `url("https://lh3.googleusercontent.com/aida-public/AB6AXuCpUGhkvdwtrXrOTqAaaB-58kuaDmMK2lpAXk9rNDhmHZfXdLik1y0lrKXMUY51pVBCDC2-vAAAecAF81UZOf6rgBZmh5lhq6tDxyg1JXTEwygsQDbcC-iiRnPE0FfWPiybJAelyjEa10vwtNpEsGpMkwFnD8DpAIRzclOivxma3NJqugFDv2jkw_gDul1J3mUZ7IPascsoSxIYIMz5HupbZds5Ph8qSotlGKjteOHhhqVI0t5JEiJXv83O_kBu5Sb-Wye2sz2tq2w")`)
            : `url("https://lh3.googleusercontent.com/aida-public/AB6AXuCVhzVdaXxR_p3E3fMgkBz6ftAWMIQhZhO0eUcPg45HQcdqABNiD5l6e6QsmtMvjc9BB0OvnBD2tGF3S-xwL9gIbPYll5USP6s23Kp2ACsN2pS8-BL7xZuTvsl5GBDScDTeMDzmxcLqQHziqI-MLkoUT2iRVJlLOMarIe7usrFfE8Oajmt1IlKu5v4ugihjYpj3CPmESsk0vDWPxGgE5iZTajLFJF2ShkkHueRk2B1iNOrj3fEjiDXuT7ntwpGvAgSaQ5GOyihkuWw")`
        }}
      />
      
      {/* Message Content */}
      <div className={cn(
        "p-4 rounded-xl",
        isUser 
          ? "bg-gradient-to-r from-pink-500/10 to-purple-500/10"
          : "bg-gradient-to-r from-purple-500/10 to-indigo-500/10 flex-1"
      )}>
        {/* Role Label */}
        <p className={cn(
          "text-sm font-bold leading-tight mb-2",
          isUser ? "text-pink-300" : "text-purple-300"
        )}>
          {isUser ? 'You' : 'HaqooqAI'}
        </p>
        
        {/* Message Content */}
        <div className="text-slate-300 text-base font-normal leading-relaxed space-y-2">
          {message.content.split('\n').map((line, index) => (
            line.trim() && <p key={index}>{line}</p>
          ))}
        </div>
        
        {/* Action Buttons for Assistant Messages */}
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
  )
}
