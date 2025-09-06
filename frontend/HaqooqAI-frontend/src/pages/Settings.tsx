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
      <div className="container mx-auto px-6 py-8 max-w-7xl flex-shrink-0">
        <InView
          variants={{
            hidden: { opacity: 0, y: 30, filter: 'blur(4px)' },
            visible: { opacity: 1, y: 0, filter: 'blur(0px)' }
          }}
          viewOptions={{ margin: '0px 0px -200px 0px' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
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
        </InView>
      </div>

      {/* Main Tabs Layout - Scrollable content */}
      <Tabs defaultValue="api-keys" className="flex flex-col flex-1 min-h-0">
        <div className="container mx-auto px-6 max-w-7xl flex-shrink-0">
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
        </div>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 max-w-7xl space-y-6 pb-8">
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
              
              {/* Quick Setup Guide */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    Quick Setup Guide
                  </CardTitle>
                  <CardDescription>
                    Add your API keys below to unlock unlimited usage and access to premium AI models
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      <div>
                        <p className="font-medium text-sm">Groq</p>
                        <p className="text-xs text-muted-foreground">Free & Fast</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <div>
                        <p className="font-medium text-sm">Gemini</p>
                        <p className="text-xs text-muted-foreground">Large Context</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <div>
                        <p className="font-medium text-sm">OpenAI</p>
                        <p className="text-xs text-muted-foreground">Premium Quality</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
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
          </div>
        </TabsContent>

        {/* Quota Tab */}
        <TabsContent value="quota" className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 max-w-7xl space-y-6 pb-8">
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
                    <h3 className="text-lg font-semibold mb-2">System Information Unavailable</h3>
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