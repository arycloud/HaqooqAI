import { useState, useEffect } from 'react'
import { Zap, RefreshCw, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { aiService } from '@/services/backend/aiService'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatQuotaText, formatQuotaResetTime } from '@/utils/formatters'

interface QuotaInfo {
  remaining: number
  limit: number
  reset_at: string
  has_api_key: boolean
  unlimited?: boolean
}

export function QuotaSettings() {
  const { user } = useAuth()
  const [quota, setQuota] = useState<QuotaInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadQuota()
    }
  }, [user])

  const loadQuota = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const quotaData = await aiService.checkQuota(user.id)
      setQuota(quotaData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load quota'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !quota) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm text-gray-600">Loading quota information...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900">Error Loading Quota</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadQuota}
            className="mt-3"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!quota) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No quota information available</p>
      </div>
    )
  }

  if (quota.unlimited || quota.has_api_key) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Unlimited Queries</p>
              <p className="text-sm text-green-700">
                You have unlimited queries with your API key
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isLowQuota = quota.remaining <= 1
  const isOutOfQuota = quota.remaining === 0

  return (
    <div className="space-y-4">
      <Card className={`${
        isOutOfQuota 
          ? 'bg-red-50 border-red-200' 
          : isLowQuota 
            ? 'bg-orange-50 border-orange-200'
            : 'bg-blue-50 border-blue-200'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className={`w-5 h-5 ${
                isOutOfQuota 
                  ? 'text-red-600' 
                  : isLowQuota 
                    ? 'text-orange-600'
                    : 'text-blue-600'
              }`} />
              <div>
                <p className={`font-medium ${
                  isOutOfQuota 
                    ? 'text-red-900' 
                    : isLowQuota 
                      ? 'text-orange-900'
                      : 'text-blue-900'
                }`}>
                  Daily Quota: {quota.remaining}/{quota.limit}
                </p>
                <p className={`text-sm ${
                  isOutOfQuota 
                    ? 'text-red-700' 
                    : isLowQuota 
                      ? 'text-orange-700'
                      : 'text-blue-700'
                }`}>
                  {formatQuotaText(quota.remaining, quota.limit)}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadQuota}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-gray-600">
        <p>
          <strong>Reset time:</strong> {formatQuotaResetTime(quota.reset_at)}
        </p>
        <p className="mt-1">
          Your daily quota resets every 24 hours. Add your own Groq API key for unlimited queries.
        </p>
      </div>
    </div>
  )
}
