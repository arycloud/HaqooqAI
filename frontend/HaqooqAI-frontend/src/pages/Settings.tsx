import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ApiKeySettings } from '@/components/settings/ApiKeySettings'
import { QuotaDisplay } from '@/components/settings/QuotaDisplay'
import { MultiProviderApiKeySettings } from '@/components/settings/MultiProviderApiKeySettings'
import { aiService } from '@/services/backend/aiService'
import { useAuth } from '@/hooks/useAuth'
import { InView } from '@/components/motion-primitives/in-view'
import { TextEffect } from '@/components/motion-primitives/text-effect'
import { 
  Settings as SettingsIcon, 
  Key, 
  BarChart3, 
  Zap, 
  Shield, 
  Globe, 
  Clock, 
  Activity,
  AlertCircle,
  CheckCircle,
  Cpu,
  Database,
  ExternalLink,
  HelpCircle,
  Info
} from 'lucide-react'

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
      setRoutingStats(stats)
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
      model: 'Qwen2.5-7B-Instruct',
      speed: 'Ultra Fast',
      contextLength: '32K tokens',
      dailyLimit: '14,400 requests',
      costPerToken: 'Free tier',
      features: ['Fastest inference', 'Cost effective', 'Default provider'],
      color: 'bg-orange-500',
      description: 'Lightning-fast inference with Qwen models, perfect for quick responses and high-volume usage.'
    },
    {
      name: 'Google Gemini',
      model: 'Gemini 1.5 Flash',
      speed: 'Fast',
      contextLength: '1M tokens',
      dailyLimit: 'Varies by key',
      costPerToken: 'BYOK pricing',
      features: ['Massive context', 'Complex reasoning', 'Multimodal support'],
      color: 'bg-blue-500',
      description: 'Advanced AI with enormous context windows, ideal for complex documents and long conversations.'
    },
    {
      name: 'OpenAI',
      model: 'GPT-4 Turbo',
      speed: 'Moderate',
      contextLength: '128K tokens',
      dailyLimit: 'BYOK only',
      costPerToken: 'Premium pricing',
      features: ['Industry standard', 'High quality', 'Bring your own key'],
      color: 'bg-green-500',
      description: 'Industry-leading AI models with exceptional quality, requires your own API key for access.'
    }
  ]

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <InView
        variants={{
          hidden: { opacity: 0, y: 30, filter: 'blur(4px)' },
          visible: { opacity: 1, y: 0, filter: 'blur(0px)' }
        }}
        viewOptions={{ margin: '0px 0px -200px 0px' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
              <SettingsIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                <TextEffect per="char" preset="fade">
                  Settings
                </TextEffect>
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                Configure your API keys, monitor usage, and explore AI capabilities
              </p>
            </div>
          </div>
        </div>

        {/* Main Tabs Layout */}
        <Tabs defaultValue="api-keys" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="quota" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Usage & Quota
            </TabsTrigger>
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              AI Providers
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              System Info
            </TabsTrigger>
          </TabsList>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-6">
            <div className="grid gap-6">
              <Card className="border-dashed border-2">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <CardTitle>Secure API Key Management</CardTitle>
                      <CardDescription>
                        Your API keys are encrypted and stored securely. Configure multiple providers for enhanced capabilities.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
              
              <MultiProviderApiKeySettings />
              
              {/* Legacy API Key Settings for backward compatibility */}
              <details className="group">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <span className="group-open:hidden">▶ Show legacy settings</span>
                  <span className="group-open:inline hidden">▼ Hide legacy settings</span>
                </summary>
                <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                  <ApiKeySettings />
                </div>
              </details>
            </div>
          </TabsContent>

          {/* Quota Tab */}
          <TabsContent value="quota" className="space-y-6">
            <div className="grid gap-6">
              <QuotaDisplay />
              
              {/* Quota Breakdown */}
              {quota && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Usage Analytics
                    </CardTitle>
                    <CardDescription>
                      Track your API usage across different providers and time periods
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Main Quota Display */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Current Usage</span>
                            <Badge variant={quota.unlimited ? "default" : quota.remaining <= 1 ? "destructive" : "secondary"}>
                              {quota.unlimited ? 'Unlimited' : `${quota.remaining}/${quota.limit}`}
                            </Badge>
                          </div>
                          {!quota.unlimited && (
                            <Progress 
                              value={(quota.limit - quota.remaining) / quota.limit * 100} 
                              className="h-2" 
                            />
                          )}
                        </div>
                        
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Reset Time</span>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {quota.reset_at ? new Date(quota.reset_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">API Key Status</span>
                            {quota.has_api_key ? 
                              <CheckCircle className="h-4 w-4 text-green-600" /> : 
                              <AlertCircle className="h-4 w-4 text-orange-600" />
                            }
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {quota.has_api_key ? 'Custom key active' : 'Using system default'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Provider Quotas */}
                      {quota.provider_quotas && (
                        <div>
                          <h4 className="font-medium mb-3">Provider-Specific Usage</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(quota.provider_quotas).map(([provider, data]: [string, any]) => (
                              <div key={provider} className="p-3 border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium capitalize">{provider}</span>
                                  <Badge variant="outline">
                                    {data.remaining}/{data.limit}
                                  </Badge>
                                </div>
                                <Progress 
                                  value={(data.limit - data.remaining) / data.limit * 100} 
                                  className="h-1" 
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* AI Providers Tab */}
          <TabsContent value="providers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Available AI Providers
                </CardTitle>
                <CardDescription>
                  Explore the capabilities and limitations of each AI provider in our system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {providerInfo.map((provider, index) => (
                    <InView
                      key={provider.name}
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: { opacity: 1, x: 0 }
                      }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`h-3 w-3 rounded-full ${provider.color}`} />
                              <div>
                                <CardTitle className="text-lg">{provider.name}</CardTitle>
                                <CardDescription className="text-sm">
                                  {provider.model} • {provider.speed}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {provider.features.map((feature, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground mb-4">
                            {provider.description}
                          </p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                              <Database className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">Context</p>
                              <p className="text-sm font-medium">{provider.contextLength}</p>
                            </div>
                            
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                              <Activity className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">Speed</p>
                              <p className="text-sm font-medium">{provider.speed}</p>
                            </div>
                            
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                              <BarChart3 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">Daily Limit</p>
                              <p className="text-sm font-medium">{provider.dailyLimit}</p>
                            </div>
                            
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                              <span className="text-sm font-medium">💰</span>
                              <p className="text-xs text-muted-foreground">Cost</p>
                              <p className="text-sm font-medium">{provider.costPerToken}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </InView>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Routing Information */}
            {routingStats?.routing_config && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Smart Routing Configuration
                  </CardTitle>
                  <CardDescription>
                    How our system intelligently routes requests to the best provider
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-lg">
                      <Info className="h-5 w-5 mb-2 text-blue-600" />
                      <p className="text-sm font-medium">Message Threshold</p>
                      <p className="text-2xl font-bold">{routingStats.routing_config.message_threshold || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">Messages before upgrade</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <Database className="h-5 w-5 mb-2 text-purple-600" />
                      <p className="text-sm font-medium">Token Threshold</p>
                      <p className="text-2xl font-bold">
                        {routingStats.routing_config.token_threshold?.toLocaleString() || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">Tokens before upgrade</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <Zap className="h-5 w-5 mb-2 text-orange-600" />
                      <p className="text-sm font-medium">Max Query Tokens</p>
                      <p className="text-2xl font-bold">
                        {routingStats.routing_config.max_query_tokens?.toLocaleString() || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">Maximum per request</p>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <Activity className="h-5 w-5 mb-2 text-green-600" />
                      <p className="text-sm font-medium">Max Messages</p>
                      <p className="text-2xl font-bold">
                        {routingStats.routing_config.max_conversation_messages || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">Per conversation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* System Info Tab */}
          <TabsContent value="system" className="space-y-6">
            {routingStats && (
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>
                    Current provider availability and system configuration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {routingStats.providers && Array.isArray(routingStats.providers) && routingStats.providers.length > 0 ? (
                    <div>
                      <h4 className="font-medium mb-3">Provider Status</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {routingStats.providers.map((provider: any) => (
                          <div key={provider.name} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-medium">{provider.name}</span>
                              <Badge variant={provider.has_default_key ? "default" : "outline"}>
                                {provider.has_default_key ? "Available" : "BYOK Only"}
                              </Badge>
                            </div>
                            <div className="space-y-2 text-sm text-muted-foreground">
                              <div className="flex justify-between">
                                <span>Model:</span>
                                <span className="font-medium text-foreground">{provider.model}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Daily Limit:</span>
                                <span className="font-medium text-foreground">
                                  {provider.daily_limit?.toLocaleString() || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      {loadingStats ? (
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2" />
                          <span>Loading system status...</span>
                        </div>
                      ) : (
                        <div className="text-gray-500">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                          <p>System information is currently unavailable.</p>
                          <p className="text-sm">The routing statistics endpoint may not be responding.</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Help Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Need Help?
                </CardTitle>
                <CardDescription>
                  Resources and support for getting the most out of HaqooqAI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">🔐 Security</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      All API keys are encrypted before storage using industry-standard encryption.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">⚡ Usage</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Your own API keys provide unlimited system quota and bypass daily limits.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">🔄 Routing</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Our system automatically selects the best provider based on query complexity and context.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">📊 Analytics</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Track your usage patterns and optimize your API key configuration for best results.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </InView>
    </div>
  )
}