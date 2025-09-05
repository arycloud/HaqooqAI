import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ApiKeySettings } from '@/components/settings/ApiKeySettings'
import { QuotaDisplay } from '@/components/settings/QuotaDisplay'
import { aiService } from '@/services/backend/aiService'

export function Settings() {
  const [routingStats, setRoutingStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    document.title = 'Settings - HaqooqAI'
    loadRoutingStats()
  }, [])

  const loadRoutingStats = async () => {
    try {
      setLoadingStats(true)
      const stats = await aiService.getRoutingStats()
      setRoutingStats(stats)
    } catch (error) {
      console.error('Failed to load routing stats:', error)
      // Set empty stats to prevent crashes
      setRoutingStats({
        providers: [],
        routing_config: null
      })
    } finally {
      setLoadingStats(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your API keys, quota, and system preferences
          </p>
        </div>

        {/* Current Quota */}
        <QuotaDisplay />

        {/* API Key Management */}
        <ApiKeySettings />

        {/* System Information */}
        {routingStats && (
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>
                Current LLM provider configuration and routing settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {routingStats.providers && Array.isArray(routingStats.providers) && routingStats.providers.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Available Providers</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {routingStats.providers.map((provider: any) => (
                      <div key={provider.name} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{provider.name}</span>
                          <Badge variant={provider.has_default_key ? "default" : "outline"}>
                            {provider.has_default_key ? "Available" : "BYOK Only"}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Model: {provider.model}</p>
                          <p>Daily Limit: {provider.daily_limit?.toLocaleString() || 'N/A'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {routingStats.routing_config && (
                <div>
                  <h4 className="font-medium mb-3">Routing Configuration</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Message Threshold:</span>
                      <p className="font-medium">{routingStats.routing_config.message_threshold || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Token Threshold:</span>
                      <p className="font-medium">{routingStats.routing_config.token_threshold?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Max Query Tokens:</span>
                      <p className="font-medium">{routingStats.routing_config.max_query_tokens?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Max Messages:</span>
                      <p className="font-medium">{routingStats.routing_config.max_conversation_messages || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {loadingStats && (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!loadingStats && (!routingStats.providers || routingStats.providers.length === 0) && (
                <div className="text-center py-4 text-gray-500">
                  <p>System information is currently unavailable.</p>
                  <p className="text-sm">The routing statistics endpoint may not be responding.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}