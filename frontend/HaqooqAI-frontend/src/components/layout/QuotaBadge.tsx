import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Zap, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { aiService } from '@/services/backend/aiService'
import { QuotaResponse } from '@/types/api'

export function QuotaBadge() {
  const { user } = useAuth()
  const [quota, setQuota] = useState<QuotaResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.github_id) {
      loadQuota()
    }
  }, [user?.github_id])

  const loadQuota = async () => {
    if (!user?.github_id) return

    try {
      setLoading(true)
      const quotaData = await aiService.checkQuota(String(user.github_id))
      setQuota(quotaData)
    } catch (error) {
      console.error('Failed to load quota:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Badge variant="outline" className="px-3 py-1.5">
        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
        <span className="text-xs font-medium">Loading...</span>
      </Badge>
    )
  }

  if (!quota) {
    return null
  }

  if (quota.unlimited) {
    return (
      <Badge variant="success" className="px-3 py-1.5">
        <Zap className="w-3 h-3 mr-2" />
        <span className="text-xs font-medium">Unlimited</span>
      </Badge>
    )
  }

  const isLowQuota = quota.remaining <= 1
  const isOutOfQuota = quota.remaining === 0

  return (
    <Badge 
      variant={isOutOfQuota ? "destructive" : isLowQuota ? "warning" : "default"} 
      className="px-3 py-1.5"
    >
      {isOutOfQuota && <AlertCircle className="w-3 h-3 mr-2" />}
      <span className="text-xs font-medium">
        {quota.remaining}/{quota.limit} queries
      </span>
    </Badge>
  )
}