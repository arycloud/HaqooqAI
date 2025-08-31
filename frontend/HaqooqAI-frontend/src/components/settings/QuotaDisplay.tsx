import { useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom";
import { Zap, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { aiService } from '@/services/backend/aiService'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'


export function QuotaDisplay() {
  const { user } = useAuth()
  const navigate = useNavigate();
  const [quota, setQuota] = useState<{
    remaining: number
    limit: number
    has_api_key: boolean
    unlimited?: boolean
  } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadQuota()
    }
  }, [user])

  const loadQuota = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const quotaData = await aiService.checkQuota(user.id)
      setQuota(quotaData)
    } catch (error) {
      console.error('Failed to load quota:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!quota || loading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100/50 dark:bg-slate-800/50">
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-purple-600" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Loading your quota... </span>
      </div>
    )
  }

  if (quota.unlimited || quota.has_api_key) {
    return (
      <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-3 py-1.5 font-medium shadow-sm">
        <Zap className="w-3 h-3 mr-1.5" />
        Unlimited
      </Badge>
    )
  }

  const isLowQuota = quota.remaining <= 1
  const isOutOfQuota = quota.remaining === 0

  return (
    <div className="flex items-center space-x-3">
      <Badge
        className={
          isOutOfQuota
            ? "bg-gradient-to-r from-red-500 to-red-600 text-white border-0 px-3 py-1.5 font-medium shadow-sm"
            : isLowQuota
            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 px-3 py-1.5 font-medium shadow-sm"
            : "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-3 py-1.5 font-medium shadow-sm"
        }
      >
        {isOutOfQuota ? (
          <AlertCircle className="w-3 h-3 mr-1.5" />
        ) : (
          <Zap className="w-3 h-3 mr-1.5" />
        )}
        <span className="font-semibold">{quota.remaining}</span>
        <span className="opacity-75">/{quota.limit}</span>
      </Badge>

      {isOutOfQuota && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/settings")}
          className="text-xs px-3 py-1.5 rounded-lg border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors duration-200"
        >
          Add API Key
        </Button>
      )}
    </div>
  )
}
