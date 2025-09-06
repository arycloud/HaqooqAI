import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { aiService } from '@/services/backend/aiService'
import { QuotaResponse, ProviderStatus } from '@/types/api'
import { PROVIDER_DISPLAY_NAMES } from '@/utils/constants'

export function QuotaDisplay() {
  const { user } = useAuth()
  const [quota, setQuota] = useState<QuotaResponse | null>(null)
  const [providers, setProviders] = useState<ProviderStatus[]>([])
  const [loading, setLoading] = useState(true) // Start with loading true
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.github_id) {
      loadQuotaInfo()
      loadProviderStatuses()
    }
  }, [user?.github_id])

  const loadQuotaInfo = async () => {
    if (!user?.github_id) return

    try {
      setLoading(true)
      setError(null)
      const quotaData = await aiService.checkQuota(String(user.github_id))
      setQuota(quotaData)
    } catch (error) {
      console.error('Failed to load quota:', error)
      setError('Failed to load quota information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadProviderStatuses = async () => {
    if (!user?.github_id) return

    try {
      const statuses = await aiService.getProviderStatuses(String(user.github_id))
      setProviders(statuses)
    } catch (error) {
      console.error('Failed to load provider statuses:', error)
      // Don't set error here as it's less critical than quota
    }
  }

  const getUsagePercentage = () => {
    if (!quota || quota.unlimited) return 0
    return ((quota.limit - quota.remaining) / quota.limit) * 100
  }

  const formatResetTime = (resetAt: string) => {
    return new Date(resetAt).toLocaleString()
  }

  const configuredProviders = providers.filter(p => p.configured)
  const hasAnyApiKey = configuredProviders.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Usage & Quota
          {quota?.unlimited && (
            <Badge variant="default">Unlimited</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Current usage limits and API key status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-muted-foreground">Loading usage information...</span>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <div className="text-amber-600 mb-2">
              ⚠️ {error}
            </div>
            <button 
              onClick={loadQuotaInfo}
              className="text-sm text-blue-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : quota ? (
          <>
            {/* Main Quota Display */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Daily Queries</span>
                <span>
                  {quota.unlimited 
                    ? 'Unlimited' 
                    : `${quota.remaining} / ${quota.limit} remaining`
                  }
                </span>
              </div>
              
              {!quota.unlimited && (
                <Progress 
                  value={getUsagePercentage()} 
                  className="h-2"
                />
              )}
              
              <div className="text-xs text-gray-500">
                {quota.unlimited 
                  ? 'You have unlimited access with your API keys'
                  : `Resets at: ${formatResetTime(quota.reset_at)}`
                }
              </div>
            </div>

            {/* Provider-Specific Quota Information */}
            {quota.provider_quotas && Object.keys(quota.provider_quotas).length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-medium text-sm">Provider-Specific Quotas</h4>
                {Object.entries(quota.provider_quotas).map(([provider, providerQuota]) => {
                  const typedQuota = providerQuota as { remaining: number; limit: number; reset_at: string }
                  return (
                    <div key={provider} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{PROVIDER_DISPLAY_NAMES[provider as keyof typeof PROVIDER_DISPLAY_NAMES] || provider}</span>
                        <span>{typedQuota.remaining} / {typedQuota.limit} remaining</span>
                      </div>
                      <Progress 
                        value={((typedQuota.limit - typedQuota.remaining) / typedQuota.limit) * 100} 
                        className="h-1"
                      />
                    </div>
                  )
                })}
              </div>
            )}

            {/* API Key Status */}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-sm">API Key Status</h4>
                <Badge variant={hasAnyApiKey ? "default" : "outline"}>
                  {hasAnyApiKey ? `${configuredProviders.length} Configured` : 'None'}
                </Badge>
              </div>
              
              {configuredProviders.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {configuredProviders.map((provider) => (
                    <div key={provider.provider} className="flex justify-between items-center text-sm">
                      <span>{PROVIDER_DISPLAY_NAMES[provider.provider as keyof typeof PROVIDER_DISPLAY_NAMES]}</span>
                      <Badge variant={provider.valid ? "default" : "destructive"} className="text-xs">
                        {provider.valid ? 'Valid' : 'Invalid'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No API keys configured. Add your own keys for unlimited access.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="text-muted-foreground mb-2">
              Unable to load quota information. Please check your connection.
            </div>
            <button 
              onClick={loadQuotaInfo}
              className="text-sm text-blue-600 hover:underline"
            >
              Retry
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}