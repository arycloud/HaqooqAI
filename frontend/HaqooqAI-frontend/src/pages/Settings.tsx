import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { QuotaDisplay } from '@/components/settings/QuotaDisplay'
import { MultiProviderApiKeySettings } from '@/components/settings/MultiProviderApiKeySettings'
import { aiService } from '@/services/backend/aiService'
import { useAuth } from '@/hooks/useAuth'

export function Settings() {
  const { user } = useAuth()
  const [routingStats, setRoutingStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [quota, setQuota] = useState<any>(null)
  const [loadingQuota, setLoadingQuota] = useState(false)

  useEffect(() => {
    document.title = 'Settings - HaqooqAI'
    loadRoutingStats()
    loadQuotaInfo()
  }, [])

  const loadRoutingStats = async () => {
    try {
      setLoadingStats(true)
      const stats = await aiService.getRoutingStats()
      // Ensure providers is always an array
      setRoutingStats({
        ...stats,
        providers: Array.isArray(stats?.providers) ? stats.providers : []
      })
    } catch (error) {
      console.error('Failed to load routing stats:', error)
      setRoutingStats({
        providers: [],
        routing_config: null
      })
    } finally {
      setLoadingStats(false)
    }
  }

  const loadQuotaInfo = async () => {
    if (!user?.github_id) return

    try {
      setLoadingQuota(true)
      const quotaData = await aiService.checkQuota(String(user.github_id))
      setQuota(quotaData)
    } catch (error) {
      console.error('Failed to load quota info:', error)
    } finally {
      setLoadingQuota(false)
    }
  }

  // Provider information with limits and descriptions
  const providerInfo = [
    {
      name: 'Groq',
      model: 'Qwen3:32B',
      speed: 'Ultra Fast',
      speedRating: 4,
      contextLength: '6k context',
      dailyLimit: '5 quries',
      costPer1kTokens: 'Free',
      features: ['Fastest inference', 'Cost effective', 'Default provider'],
      color: 'bg-orange-500',
      description: 'Lightning-fast inference with Qwen models, perfect for quick responses.',
      strengths: ['Speed', 'Free tier', 'Reliability'],
      useCases: ['Quick queries', 'High-volume usage', 'Real-time applications']
    },
    {
      name: 'Google Gemini',
      model: 'Gemini 2.0 Flash Lite',
      speed: 'Fast',
      speedRating: 4,
      contextLength: '50k context',
      dailyLimit: 'BYOK dependent',
      costPer1kTokens: 'Free limitted access',
      features: ['Massive context', 'Complex reasoning', 'Multimodal support'],
      color: 'bg-blue-500',
      description: 'Advanced AI with enormous context windows, ideal for complex documents and long conversations.',
      strengths: ['Large context', 'Multimodal', 'Complex reasoning'],
      useCases: ['Document analysis', 'Long conversations', 'Complex queries']
    },
    {
      name: 'OpenAI',
      model: 'GPT-5',
      speed: 'Moderate',
      speedRating: 4,
      contextLength: '128,000',
      dailyLimit: 'BYOK only',
      costPer1kTokens: 'Price on their Platform',
      features: ['Industry standard', 'High quality', 'Bring your own key'],
      color: 'bg-green-500',
      description: 'Industry-leading AI models with exceptional quality, requires your own API key for access.',
      strengths: ['Quality', 'Reliability', 'Industry standard'],
      useCases: ['Professional use', 'High-quality output', 'Critical applications']
    }
  ]

  return (
    <div className="h-full flex flex-col bg-[var(--background-color)]">
      {/* Header Section - Fixed at top */}
      <div className="container mx-auto px-6 py-6 max-w-7xl flex-shrink-0">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">Settings</h1>
          <p className="text-[var(--text-secondary)]">
            Manage your API keys, monitor usage, and configure AI providers
          </p>
        </div>
      </div>

      {/* Main Tabs Layout - Scrollable content */}
      <Tabs defaultValue="api-keys" className="flex flex-col flex-1 min-h-0">
        <div className="container mx-auto px-6 max-w-7xl flex-shrink-0">
          <TabsList className="grid w-full grid-cols-4 max-w-3xl mx-auto bg-[var(--input-color)] border-[var(--border-color)]">
            <TabsTrigger value="api-keys" className="flex items-center gap-2 text-[var(--text-secondary)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:bg-[var(--hover-color)]">
              <span className="material-symbols-outlined text-base">vpn_key</span>
              API Keys
            </TabsTrigger>
            <TabsTrigger value="quota" className="flex items-center gap-2 text-[var(--text-secondary)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:bg-[var(--hover-color)]">
              <span className="material-symbols-outlined text-base">bar_chart</span>
              Usage & Quota
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex items-center gap-2 text-[var(--text-secondary)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:bg-[var(--hover-color)]">
              <span className="material-symbols-outlined text-base">memory</span>
              AI Providers
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2 text-[var(--text-secondary)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:bg-[var(--hover-color)]">
              <span className="material-symbols-outlined text-base">monitoring</span>
              System Info
            </TabsTrigger>
          </TabsList>
        </div>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 max-w-7xl py-8">
            <MultiProviderApiKeySettings />
          </div>
        </TabsContent>

        {/* Quota Tab */}
        <TabsContent value="quota" className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 max-w-7xl py-8">
            <QuotaDisplay />
          </div>
        </TabsContent>

        {/* AI Providers Tab */}
        <TabsContent value="providers" className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 max-w-7xl py-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">AI Provider Information</h2>
              <p className="text-[var(--text-secondary)]">
                Compare features, performance, and capabilities of supported AI providers
              </p>
            </div>

            {/* Provider Cards - Same design as key management */}
            <div className="grid gap-6 md:gap-8 lg:gap-10 md:grid-cols-3 pb-20">
              {providerInfo.map((provider, index) => {
                const configuredProvider = routingStats?.providers && Array.isArray(routingStats.providers) 
                  ? routingStats.providers.find((p: any) => 
                      p.name?.toLowerCase() === provider.name.toLowerCase()
                    )
                  : null
                const isConfigured = configuredProvider?.has_default_key || false
                
                return (
                  <Card
                    key={provider.name}
                    className={`relative transition-all duration-300 hover:shadow-lg bg-[var(--sidebar-color)] border-[var(--border-color)] ${
                      provider.name === 'Groq'
                        ? 'ring-2 ring-[var(--primary-color)]/20 bg-gradient-to-br from-[var(--primary-color)]/10 to-[var(--secondary-color)]/10'
                        : isConfigured
                        ? 'ring-2 ring-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-500/10'
                        : 'hover:shadow-md'
                    }`}
                  >
                    {/* Status Badge */}
                    {provider.name === 'Groq' && !isConfigured ? (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-[var(--primary-color)] text-white text-xs px-3 py-1">
                          Most Popular
                        </Badge>
                      </div>
                    ) : isConfigured ? (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-green-600 text-white text-xs px-3 py-1">
                          Connected
                        </Badge>
                      </div>
                    ) : (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-gray-500 text-white text-xs px-3 py-1">
                          Not Connected
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-3">
                      <div className="flex items-center justify-between mb-3">
                        <CardTitle className="text-lg text-[var(--text-primary)]">{provider.name}</CardTitle>
                        <div className={`h-3 w-3 rounded-full ${provider.color}`} />
                      </div>
                      
                      <CardDescription className="text-sm mb-2 text-[var(--text-secondary)]">
                        {provider.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-3">
                      {/* Features List */}
                      <ul className="space-y-3 mb-5">
                        {provider.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-3 text-sm">
                            <span className="material-symbols-outlined text-green-500 text-base mt-0.5 flex-shrink-0">check_circle</span>
                            <span className="text-[var(--text-secondary)]">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {/* Specifications */}
                      <div className="space-y-3 mb-5">
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--text-secondary)]">Model:</span>
                          <span className="font-mono text-xs text-[var(--text-primary)]">{provider.model}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--text-secondary)]">Context:</span>
                          <span className="font-mono text-xs text-[var(--text-primary)]">{provider.contextLength} tokens</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--text-secondary)]">Daily Limit:</span>
                          <span className="text-[var(--text-primary)]">{provider.dailyLimit}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--text-secondary)]">Cost:</span>
                          <span className="font-mono text-xs text-[var(--text-primary)]">{provider.costPer1kTokens}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--text-secondary)]">Speed:</span>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`h-2 w-2 rounded-full mr-1 ${
                                    i < provider.speedRating ? 'bg-green-500' : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-[var(--text-secondary)]">{provider.speed}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Use Cases */}
                      <div className="border-t border-[var(--border-color)] pt-4">
                        <h4 className="text-sm font-medium mb-3 text-[var(--text-primary)]">Best Use Cases</h4>
                        <div className="flex flex-wrap gap-2">
                          {provider.useCases.map((useCase, i) => (
                            <Badge key={i} variant="secondary" className="text-xs px-2 py-1 bg-[var(--input-color)] text-[var(--text-secondary)] border-[var(--border-color)]">
                              {useCase}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </TabsContent>

        {/* System Info Tab */}
        <TabsContent value="system" className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 max-w-7xl space-y-6 pb-8">
            {/* System Status Overview */}
            <Card className="bg-[var(--sidebar-color)] border-[var(--border-color)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
                  <span className="material-symbols-outlined text-xl">monitoring</span>
                  System Status
                </CardTitle>
                <CardDescription className="text-[var(--text-secondary)]">
                  Real-time system health and provider availability
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin mr-3" />
                    <span className="text-[var(--text-secondary)]">Loading system status...</span>
                  </div>
                ) : routingStats ? (
                  <div className="space-y-6">
                    {/* Overall System Health */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border border-[var(--border-color)] rounded-lg bg-[var(--input-color)]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-green-600 text-xl">check_circle</span>
                          <span className="font-medium text-[var(--text-primary)]">System Health</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">Operational</p>
                        <p className="text-xs text-[var(--text-secondary)]">All systems functioning normally</p>
                      </div>
                      
                      <div className="p-4 border border-[var(--border-color)] rounded-lg bg-[var(--input-color)]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-blue-600 text-xl">public</span>
                          <span className="font-medium text-[var(--text-primary)]">Available Providers</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                          {(routingStats.providers && Array.isArray(routingStats.providers)) ? routingStats.providers.length : 0}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">AI providers configured</p>
                      </div>
                      
                      <div className="p-4 border border-[var(--border-color)] rounded-lg bg-[var(--input-color)]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-[var(--primary-color)] text-xl">bolt</span>
                          <span className="font-medium text-[var(--text-primary)]">Routing Engine</span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--primary-color)]">
                          {routingStats.routing_config ? 'Active' : 'Unavailable'}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">Smart request routing</p>
                      </div>
                    </div>

                    {/* Provider Status Table */}
                    {routingStats.providers && Array.isArray(routingStats.providers) && routingStats.providers.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3 text-[var(--text-primary)]">Provider Status Details</h4>
                        <Table>
                          <TableHeader>
                            <TableRow className="border-[var(--border-color)]">
                              <TableHead className="text-[var(--text-primary)]">Provider</TableHead>
                              <TableHead className="text-[var(--text-primary)]">Model</TableHead>
                              <TableHead className="text-[var(--text-primary)]">Status</TableHead>
                              <TableHead className="text-[var(--text-primary)]">Daily Limit</TableHead>
                              <TableHead className="text-[var(--text-primary)]">Configuration</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {routingStats.providers.map((provider: any) => (
                              <TableRow key={provider.name} className="border-[var(--border-color)]">
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${
                                      provider.has_default_key ? 'bg-green-500' : 'bg-yellow-500'
                                    }`} />
                                    <span className="font-medium text-[var(--text-primary)]">{provider.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono text-sm text-[var(--text-primary)]">{provider.model}</TableCell>
                                <TableCell>
                                  <Badge variant={provider.has_default_key ? "default" : "secondary"} className="bg-[var(--input-color)] text-[var(--text-secondary)] border-[var(--border-color)]">
                                    {provider.has_default_key ? "Operational" : "BYOK Required"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-[var(--text-primary)]">{provider.daily_limit?.toLocaleString() || 'Unlimited'}</TableCell>
                                <TableCell>
                                  <span className="text-xs text-[var(--text-secondary)]">
                                    {provider.has_default_key ? 'System configured' : 'User keys only'}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Routing Configuration */}
                    {routingStats.routing_config && (
                      <div>
                        <h4 className="text-sm font-medium mb-3 text-[var(--text-primary)]">Smart Routing Configuration</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-4 border border-[var(--border-color)] rounded-lg bg-[var(--input-color)]">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="material-symbols-outlined text-blue-600 text-lg">info</span>
                              <span className="text-sm font-medium text-[var(--text-primary)]">Message Threshold</span>
                            </div>
                            <p className="text-xl font-bold text-[var(--text-primary)]">{routingStats.routing_config.message_threshold || 'N/A'}</p>
                            <p className="text-xs text-[var(--text-secondary)]">Messages before provider upgrade</p>
                          </div>
                          
                          <div className="p-4 border border-[var(--border-color)] rounded-lg bg-[var(--input-color)]">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="material-symbols-outlined text-[var(--primary-color)] text-lg">storage</span>
                              <span className="text-sm font-medium text-[var(--text-primary)]">Token Threshold</span>
                            </div>
                            <p className="text-xl font-bold text-[var(--text-primary)]">
                              {routingStats.routing_config.token_threshold?.toLocaleString() || 'N/A'}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">Tokens before provider upgrade</p>
                          </div>
                          
                          <div className="p-4 border border-[var(--border-color)] rounded-lg bg-[var(--input-color)]">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="material-symbols-outlined text-orange-600 text-lg">bolt</span>
                              <span className="text-sm font-medium text-[var(--text-primary)]">Max Query Tokens</span>
                            </div>
                            <p className="text-xl font-bold text-[var(--text-primary)]">
                              {routingStats.routing_config.max_query_tokens?.toLocaleString() || 'N/A'}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">Maximum tokens per request</p>
                          </div>
                          
                          <div className="p-4 border border-[var(--border-color)] rounded-lg bg-[var(--input-color)]">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="material-symbols-outlined text-green-600 text-lg">monitoring</span>
                              <span className="text-sm font-medium text-[var(--text-primary)]">Max Messages</span>
                            </div>
                            <p className="text-xl font-bold text-[var(--text-primary)]">
                              {routingStats.routing_config.max_conversation_messages || 'N/A'}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">Maximum messages per conversation</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-amber-500 text-5xl mx-auto mb-4 block">warning</span>
                    <h4 className="text-sm font-medium mb-2 text-[var(--text-primary)]">System Information Unavailable</h4>
                    <p className="text-[var(--text-secondary)] mb-4">Unable to connect to the system monitoring service.</p>
                    <Button onClick={loadRoutingStats} variant="outline" className="border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--hover-color)]">
                      <span className="material-symbols-outlined text-base mr-2">monitoring</span>
                      Retry Connection
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}