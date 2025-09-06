import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Save, Eye, EyeOff, ExternalLink, CheckCircle, Zap, Shield, Plus, Edit, AlertCircle, Activity, Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { aiService } from '@/services/backend/aiService'
import { ProviderStatus } from '@/types/api'
import { LLM_PROVIDERS, PROVIDER_DISPLAY_NAMES, PROVIDER_KEY_FORMATS } from '@/utils/constants'
import toast from 'react-hot-toast'

interface ProviderPlan {
  provider: 'groq' | 'gemini' | 'openai'
  name: string
  price: string
  description: string
  features: string[]
  popular?: boolean
  ctaText: string
  documentationUrl: string
  keyFormat: {
    prefix: string
    minLength: number
    placeholder: string
  }
  quota: {
    daily: string
    cost: string
    context: string
  }
}

const PROVIDER_PLANS: ProviderPlan[] = [
  {
    provider: 'groq',
    name: 'Groq',
    price: 'Free',
    description: 'Lightning-fast inference with Qwen models',
    features: [
      '14,400 daily requests',
      'Ultra-fast inference',
      '32K token context',
      'Cost effective',
      'System default provider'
    ],
    popular: true,
    ctaText: 'Connect API Key',
    documentationUrl: 'https://console.groq.com/keys',
    keyFormat: PROVIDER_KEY_FORMATS.groq,
    quota: {
      daily: '14,400 requests',
      cost: 'Free',
      context: '32K tokens'
    }
  },
  {
    provider: 'gemini',
    name: 'Google Gemini',
    price: '$0.075',
    description: 'Advanced AI with massive context windows',
    features: [
      'Unlimited daily requests*',
      'Massive 1M context',
      'Multimodal support',
      'Complex reasoning',
      'Advanced capabilities'
    ],
    ctaText: 'Connect API Key',
    documentationUrl: 'https://makersuite.google.com/app/apikey',
    keyFormat: PROVIDER_KEY_FORMATS.gemini,
    quota: {
      daily: 'Unlimited*',
      cost: '$0.075/$0.30 per 1K',
      context: '1M tokens'
    }
  },
  {
    provider: 'openai',
    name: 'OpenAI',
    price: '$10.00',
    description: 'Industry-leading AI models',
    features: [
      'BYOK only access',
      'Industry standard',
      'High quality output',
      '128K token context',
      'Professional grade'
    ],
    ctaText: 'Connect API Key',
    documentationUrl: 'https://platform.openai.com/api-keys',
    keyFormat: PROVIDER_KEY_FORMATS.openai,
    quota: {
      daily: 'BYOK Only',
      cost: '$10/$30 per 1K',
      context: '128K tokens'
    }
  }
]

export function MultiProviderApiKeySettings() {
  const { user } = useAuth()
  const [providers, setProviders] = useState<ProviderStatus[]>([])
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({})
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({})
  const [editingProvider, setEditingProvider] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [savingProvider, setSavingProvider] = useState<string | null>(null)
  const [deletingProvider, setDeletingProvider] = useState<string | null>(null)

  useEffect(() => {
    if (user?.github_id) {
      loadProviderStatuses()
    }
  }, [user?.github_id])

  const loadProviderStatuses = async () => {
    if (!user?.github_id) return

    try {
      setLoading(true)
      const statuses = await aiService.getProviderStatuses(String(user.github_id))
      setProviders(statuses)
    } catch (error) {
      console.error('Failed to load provider statuses:', error)
      toast.error('Failed to load API key statuses')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveApiKey = async (provider: 'groq' | 'gemini' | 'openai') => {
    if (!user?.github_id || !apiKeys[provider]) return

    try {
      setSavingProvider(provider)
      await aiService.saveProviderApiKey(String(user.github_id), provider, apiKeys[provider])
      
      // Clear the input field and exit editing mode
      setApiKeys(prev => ({ ...prev, [provider]: '' }))
      setShowKeys(prev => ({ ...prev, [provider]: false }))
      setEditingProvider(null)
      
      toast.success(`${PROVIDER_DISPLAY_NAMES[provider]} API key saved successfully`, {
        duration: 4000,
        icon: '✅'
      })
      
      // Reload provider statuses to update UI
      await loadProviderStatuses()
    } catch (error) {
      console.error('Failed to save API key:', error)
      
      // More specific error messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      if (errorMessage.includes('validation error') || errorMessage.includes('has_unlimited')) {
        toast.error(`Backend validation issue detected. Please try again or contact support.`, {
          duration: 6000,
          icon: '⚠️'
        })
      } else if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
        toast.error('Authentication failed. Please refresh and try again.', {
          duration: 5000,
          icon: '🔒'
        })
      } else {
        toast.error(`Failed to save ${PROVIDER_DISPLAY_NAMES[provider]} API key: ${errorMessage}`, {
          duration: 5000,
          icon: '❌'
        })
      }
    } finally {
      setSavingProvider(null)
    }
  }

  const handleDeleteApiKey = async (provider: 'groq' | 'gemini' | 'openai') => {
    if (!user?.github_id) return

    try {
      setDeletingProvider(provider)
      await aiService.deleteProviderApiKey(String(user.github_id), provider)
      
      // Clear any editing state
      setEditingProvider(null)
      setApiKeys(prev => ({ ...prev, [provider]: '' }))
      setShowKeys(prev => ({ ...prev, [provider]: false }))
      
      toast.success(`${PROVIDER_DISPLAY_NAMES[provider]} API key deleted`)
      await loadProviderStatuses()
    } catch (error) {
      console.error('Failed to delete API key:', error)
      toast.error(`Failed to delete ${PROVIDER_DISPLAY_NAMES[provider]} API key`)
    } finally {
      setDeletingProvider(null)
    }
  }

  const validateApiKey = (provider: 'groq' | 'gemini' | 'openai', key: string): boolean => {
    const plan = PROVIDER_PLANS.find(p => p.provider === provider)
    if (!plan) return false

    if (plan.keyFormat.prefix && !key.startsWith(plan.keyFormat.prefix)) {
      return false
    }

    return key.length >= plan.keyFormat.minLength
  }

  const getProviderStatus = (provider: string): ProviderStatus | undefined => {
    return providers.find(p => p.provider === provider)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">AI Provider Plans</h2>
        <p className="text-muted-foreground">
          Connect your API keys to unlock unlimited access and premium features across multiple AI providers.
        </p>
      </div>

      {/* Provider Plans - Pricing Block Style */}
      <div className="grid gap-6 md:grid-cols-3">
        {PROVIDER_PLANS.map((plan) => {
          const status = getProviderStatus(plan.provider)
          const isConfigured = status?.configured || false
          const isValid = status?.valid || false
          const currentKey = apiKeys[plan.provider] || ''
          const isValidFormat = currentKey ? validateApiKey(plan.provider, currentKey) : true
          const isEditing = editingProvider === plan.provider

          return (
            <Card
              key={plan.provider}
              className={`relative transition-all duration-300 hover:shadow-lg ${
                plan.popular
                  ? 'ring-2 ring-purple-500/20 bg-gradient-to-br from-purple-50 to-purple-100'
                  : isConfigured
                  ? 'ring-2 ring-green-500/20 bg-gradient-to-br from-green-50/50 to-emerald-50/50'
                  : 'hover:shadow-md'
              }`}
            >
              {plan.popular && !isConfigured && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white text-xs px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {isConfigured ? (
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
                  <CardTitle className="text-base flex items-center gap-2">
                    {plan.name}
                    {isConfigured && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(plan.documentationUrl, '_blank')}
                    className="opacity-60 hover:opacity-100 p-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
                
                <CardDescription className="text-xs mb-3">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-2">
                {/* Features List */}
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2 text-xs">
                      <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* API Key Management Section */}
                {isConfigured && !isEditing ? (
                  /* Connected State */
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3 rounded-lg text-center">
                      <Zap className="w-4 h-4 mx-auto mb-1" />
                      <p className="text-xs font-medium">Unlimited Access Active</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProvider(plan.provider)}
                        className="flex-1 text-xs"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Update
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteApiKey(plan.provider)}
                        disabled={deletingProvider === plan.provider}
                        className="px-3"
                      >
                        {deletingProvider === plan.provider ? (
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                    
                    {status?.last_validated && (
                      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Connected: {new Date(status.last_validated).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  /* Not Connected or Editing State */
                  <div className="space-y-3">
                    {/* API Key Input */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type={showKeys[plan.provider] ? "text" : "password"}
                          placeholder={plan.keyFormat.placeholder}
                          value={currentKey}
                          onChange={(e) => setApiKeys(prev => ({ 
                            ...prev, 
                            [plan.provider]: e.target.value 
                          }))}
                          className={`text-xs transition-colors ${
                            !isValidFormat ? "border-red-300 focus:border-red-500" : 
                            currentKey ? "border-green-300 focus:border-green-500" : ""
                          }`}
                          disabled={loading || savingProvider === plan.provider}
                        />
                        
                        {currentKey && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6"
                            onClick={() => setShowKeys(prev => ({ 
                              ...prev, 
                              [plan.provider]: !prev[plan.provider] 
                            }))}
                          >
                            {showKeys[plan.provider] ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Validation Message */}
                      {currentKey && !isValidFormat && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Invalid format. Should{plan.keyFormat.prefix && ` start with "${plan.keyFormat.prefix}" and`} be at least {plan.keyFormat.minLength} characters.
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSaveApiKey(plan.provider)}
                        disabled={
                          !currentKey || 
                          !isValidFormat || 
                          loading || 
                          savingProvider === plan.provider
                        }
                        size="sm"
                        className={`flex-1 text-xs ${
                          plan.popular ? "" : "bg-primary"
                        }`}
                      >
                        {savingProvider === plan.provider ? (
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1" />
                        ) : (
                          <Save className="w-3 h-3 mr-1" />
                        )}
                        {isEditing ? 'Update Key' : plan.ctaText}
                      </Button>
                      
                      {isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingProvider(null)
                            setApiKeys(prev => ({ ...prev, [plan.provider]: '' }))
                            setShowKeys(prev => ({ ...prev, [plan.provider]: false }))
                          }}
                          className="text-xs px-3"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Security Info Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-sm font-medium mb-2">Bank-Grade Security</h4>
              <p className="text-sm text-muted-foreground">
                Your API keys are encrypted with AES-256 encryption before storage. We never see your raw keys.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-sm font-medium mb-2">Unlimited Usage</h4>
              <p className="text-sm text-muted-foreground">
                Your own API keys provide unlimited system quota and bypass all daily limits automatically.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-sm font-medium mb-2">Smart Routing</h4>
              <p className="text-sm text-muted-foreground">
                Our system automatically selects the best provider based on your query complexity and context.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}