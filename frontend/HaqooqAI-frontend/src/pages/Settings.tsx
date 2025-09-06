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
  Info,
  TrendingUp,
  DollarSign
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
      speedRating: 5,
      contextLength: '6k for the default system key',
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
      contextLength: '50k tokens',
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
      speedRating: 3,
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
    <div className="h-full flex flex-col">
      {/* Header Section - Fixed at top */}
      <div className="container mx-auto px-6 py-6 max-w-5xl flex-shrink-0">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your API keys, monitor usage, and configure AI providers
          </p>
        </div>
      </div>

      {/* Main Tabs Layout - Scrollable content */}
      <Tabs defaultValue="api-keys" className="flex flex-col flex-1 min-h-0">
        <div className="container mx-auto px-6 max-w-5xl flex-shrink-0">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
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
        </div>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 max-w-5xl py-8">
            <MultiProviderApiKeySettings />
          </div>
        </TabsContent>

        {/* Quota Tab */}
        <TabsContent value="quota" className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 max-w-5xl py-8">
            <QuotaDisplay />
          </div>
        </TabsContent>



        {/* AI Providers Tab */}
        <TabsContent value="providers" className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 max-w-5xl py-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">AI Provider Information</h2>
              <p className="text-muted-foreground">
                Compare features, performance, and capabilities of supported AI providers
              </p>
            </div>

            {/* Provider Cards - Same design as key management */}
            <div className="grid gap-6 md:grid-cols-3">
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
                    className={`relative transition-all duration-300 hover:shadow-lg ${
                      provider.name === 'Groq'
                        ? 'ring-2 ring-purple-500/20 bg-gradient-to-br from-purple-50 to-purple-100'
                        : isConfigured
                        ? 'ring-2 ring-green-500/20 bg-gradient-to-br from-green-50/50 to-emerald-50/50'
                        : 'hover:shadow-md'
                    }`}
                  >
                    {/* Status Badge */}
                    {provider.name === 'Groq' && !isConfigured ? (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-purple-600 text-white text-xs px-3 py-1">
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
                    
                    <CardHeader className="text-center pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-base">{provider.name}</CardTitle>
                        <div className={`h-3 w-3 rounded-full ${provider.color}`} />
                      </div>
                      
                      <CardDescription className="text-xs mb-3">
                        {provider.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-2">
                      {/* Features List */}
                      <ul className="space-y-2 mb-4">
                        {provider.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-2 text-xs">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {/* Specifications */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Model:</span>
                          <span className="font-mono">{provider.model}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Context:</span>
                          <span className="font-mono">{provider.contextLength} tokens</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Daily Limit:</span>
                          <span>{provider.dailyLimit}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Cost:</span>
                          <span className="font-mono">{provider.costPer1kTokens}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Speed:</span>
                          <div className="flex items-center gap-1">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`h-1.5 w-1.5 rounded-full mr-0.5 ${
                                    i < provider.speedRating ? 'bg-green-500' : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">{provider.speed}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Use Cases */}
                      <div className="border-t pt-3">
                        <h4 className="text-xs font-medium mb-2">Best Use Cases</h4>
                        <div className="flex flex-wrap gap-1">
                          {provider.useCases.map((useCase, i) => (
                            <Badge key={i} variant="secondary" className="text-xs px-1 py-0">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Status
                </CardTitle>
                <CardDescription>
                  Real-time system health and provider availability
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-3" />
                    <span className="text-muted-foreground">Loading system status...</span>
                  </div>
                ) : routingStats ? (
                  <div className="space-y-6">
                    {/* Overall System Health */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium">System Health</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">Operational</p>
                        <p className="text-xs text-muted-foreground">All systems functioning normally</p>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe className="h-5 w-5 text-blue-600" />
                          <span className="font-medium">Available Providers</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                          {(routingStats.providers && Array.isArray(routingStats.providers)) ? routingStats.providers.length : 0}
                        </p>
                        <p className="text-xs text-muted-foreground">AI providers configured</p>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-5 w-5 text-purple-600" />
                          <span className="font-medium">Routing Engine</span>
                        </div>
                        <p className="text-2xl font-bold text-purple-600">
                          {routingStats.routing_config ? 'Active' : 'Unavailable'}
                        </p>
                        <p className="text-xs text-muted-foreground">Smart request routing</p>
                      </div>
                    </div>

                    {/* Provider Status Table */}
                    {routingStats.providers && Array.isArray(routingStats.providers) && routingStats.providers.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Provider Status Details</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Provider</TableHead>
                              <TableHead>Model</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Daily Limit</TableHead>
                              <TableHead>Configuration</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {routingStats.providers.map((provider: any) => (
                              <TableRow key={provider.name}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${
                                      provider.has_default_key ? 'bg-green-500' : 'bg-yellow-500'
                                    }`} />
                                    <span className="font-medium">{provider.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono text-sm">{provider.model}</TableCell>
                                <TableCell>
                                  <Badge variant={provider.has_default_key ? "default" : "secondary"}>
                                    {provider.has_default_key ? "Operational" : "BYOK Required"}
                                  </Badge>
                                </TableCell>
                                <TableCell>{provider.daily_limit?.toLocaleString() || 'Unlimited'}</TableCell>
                                <TableCell>
                                  <span className="text-xs text-muted-foreground">
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
                        <h4 className="text-sm font-medium mb-3">Smart Routing Configuration</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Info className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">Message Threshold</span>
                            </div>
                            <p className="text-xl font-bold">{routingStats.routing_config.message_threshold || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">Messages before provider upgrade</p>
                          </div>
                          
                          <div className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Database className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-medium">Token Threshold</span>
                            </div>
                            <p className="text-xl font-bold">
                              {routingStats.routing_config.token_threshold?.toLocaleString() || 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">Tokens before provider upgrade</p>
                          </div>
                          
                          <div className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="h-4 w-4 text-orange-600" />
                              <span className="text-sm font-medium">Max Query Tokens</span>
                            </div>
                            <p className="text-xl font-bold">
                              {routingStats.routing_config.max_query_tokens?.toLocaleString() || 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">Maximum tokens per request</p>
                          </div>
                          
                          <div className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Activity className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium">Max Messages</span>
                            </div>
                            <p className="text-xl font-bold">
                              {routingStats.routing_config.max_conversation_messages || 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">Maximum messages per conversation</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                    <h4 className="text-sm font-medium mb-2">System Information Unavailable</h4>
                    <p className="text-muted-foreground mb-4">Unable to connect to the system monitoring service.</p>
                    <Button onClick={loadRoutingStats} variant="outline">
                      <Activity className="h-4 w-4 mr-2" />
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