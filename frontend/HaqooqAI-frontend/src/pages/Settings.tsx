import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
      model: 'Qwen2.5-7B-Instruct',
      speed: 'Ultra Fast',
      speedRating: 5,
      contextLength: '32,768',
      dailyLimit: '14,400',
      costPer1kTokens: 'Free',
      features: ['Fastest inference', 'Cost effective', 'Default provider'],
      color: 'bg-orange-500',
      description: 'Lightning-fast inference with Qwen models, perfect for quick responses and high-volume usage.',
      strengths: ['Speed', 'Free tier', 'Reliability'],
      useCases: ['Quick queries', 'High-volume usage', 'Real-time applications']
    },
    {
      name: 'Google Gemini',
      model: 'Gemini 1.5 Flash',
      speed: 'Fast',
      speedRating: 4,
      contextLength: '1,048,576',
      dailyLimit: 'BYOK dependent',
      costPer1kTokens: '$0.075 input / $0.30 output',
      features: ['Massive context', 'Complex reasoning', 'Multimodal support'],
      color: 'bg-blue-500',
      description: 'Advanced AI with enormous context windows, ideal for complex documents and long conversations.',
      strengths: ['Large context', 'Multimodal', 'Complex reasoning'],
      useCases: ['Document analysis', 'Long conversations', 'Complex queries']
    },
    {
      name: 'OpenAI',
      model: 'GPT-4 Turbo',
      speed: 'Moderate',
      speedRating: 3,
      contextLength: '128,000',
      dailyLimit: 'BYOK only',
      costPer1kTokens: '$10 input / $30 output',
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
          <div className="container mx-auto px-6 max-w-7xl space-y-6 pb-8">
            {/* Provider Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  AI Provider Comparison
                </CardTitle>
                <CardDescription>
                  Compare features, performance, and costs of all supported AI providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Speed</TableHead>
                      <TableHead>Context Length</TableHead>
                      <TableHead>Daily Limit</TableHead>
                      <TableHead>Cost (1K tokens)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providerInfo.map((provider, index) => {
                      const configuredProvider = routingStats?.providers && Array.isArray(routingStats.providers) 
                        ? routingStats.providers.find((p: any) => 
                            p.name?.toLowerCase() === provider.name.toLowerCase()
                          )
                        : null
                      
                      return (
                        <TableRow key={provider.name}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`h-3 w-3 rounded-full ${provider.color}`} />
                              <div>
                                <div className="font-medium">{provider.name}</div>
                                <div className="flex gap-1 mt-1">
                                  {provider.features.slice(0, 2).map((feature, i) => (
                                    <Badge key={i} variant="outline" className="text-xs px-1 py-0">
                                      {feature}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{provider.model}</TableCell>
                          <TableCell>
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
                              <span className="text-sm text-muted-foreground">{provider.speed}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{provider.contextLength}</TableCell>
                          <TableCell className="text-sm">{provider.dailyLimit}</TableCell>
                          <TableCell className="font-mono text-sm">{provider.costPer1kTokens}</TableCell>
                          <TableCell>
                            <Badge variant={
                              configuredProvider?.has_default_key ? "default" : 
                              provider.name === 'OpenAI' ? "secondary" : "outline"
                            }>
                              {configuredProvider?.has_default_key ? "Available" : 
                               provider.name === 'OpenAI' ? "BYOK Only" : "System Default"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Detailed Provider Cards */}
            <div className="grid gap-6">
              <h3 className="text-lg font-semibold">Detailed Provider Information</h3>
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
                          <div className={`h-4 w-4 rounded-full ${provider.color}`} />
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Specifications */}
                        <div>
                          <h4 className="font-medium mb-3 text-sm">Specifications</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Context Length:</span>
                              <span className="font-mono">{provider.contextLength} tokens</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Daily Limit:</span>
                              <span>{provider.dailyLimit}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Cost per 1K tokens:</span>
                              <span className="font-mono">{provider.costPer1kTokens}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Speed Rating:</span>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`h-2 w-2 rounded-full mr-1 ${
                                      i < provider.speedRating ? 'bg-yellow-500' : 'bg-gray-200'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Best Use Cases */}
                        <div>
                          <h4 className="font-medium mb-3 text-sm">Best Use Cases</h4>
                          <div className="space-y-2">
                            {provider.useCases.map((useCase, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                <span>{useCase}</span>
                              </div>
                            ))}
                          </div>
                          
                          <h4 className="font-medium mb-2 mt-4 text-sm">Key Strengths</h4>
                          <div className="flex flex-wrap gap-1">
                            {provider.strengths.map((strength, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {strength}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </InView>
              ))}
            </div>
            
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
                        <h4 className="font-medium mb-3">Smart Routing Configuration</h4>
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}