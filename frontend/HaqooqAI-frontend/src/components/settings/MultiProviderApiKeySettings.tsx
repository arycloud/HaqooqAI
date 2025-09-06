// NEW FILE: /Users/apple/PycharmProjects/HaqooqAI_2.0/HaqooqAI/frontend/HaqooqAI-frontend/src/components/settings/MultiProviderApiKeySettings.tsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Save, Eye, EyeOff, ExternalLink, CheckCircle, Zap, Shield, Plus, Edit, AlertCircle, Activity } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { aiService } from '@/services/backend/aiService'
import { ProviderStatus } from '@/types/api'
import { LLM_PROVIDERS, PROVIDER_DISPLAY_NAMES, PROVIDER_KEY_FORMATS } from '@/utils/constants'
import toast from 'react-hot-toast'

interface ProviderConfig {
  provider: 'groq' | 'gemini' | 'openai'
  displayName: string
  description: string
  keyFormat: {
    prefix: string
    minLength: number
    placeholder: string
  }
  documentationUrl: string
  features: string[]
  color: string
  icon: string
  quota: {
    daily: string
    cost: string
    context: string
  }
}

const PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    provider: 'groq',
    displayName: 'Groq',
    description: 'Ultra-fast inference with Qwen models',
    keyFormat: PROVIDER_KEY_FORMATS.groq,
    documentationUrl: 'https://console.groq.com/keys',
    features: ['Lightning Fast', 'Cost Effective'],
    color: 'from-orange-500 to-red-500',
    icon: '⚡',
    quota: {
      daily: '14,400 requests',
      cost: 'Free',
      context: '32K tokens'
    }
  },
  {
    provider: 'gemini',
    displayName: 'Google Gemini',
    description: 'Advanced AI with massive context windows',
    keyFormat: PROVIDER_KEY_FORMATS.gemini,
    documentationUrl: 'https://makersuite.google.com/app/apikey',
    features: ['Large Context', 'Multimodal'],
    color: 'from-blue-500 to-purple-500',
    icon: '🧠',
    quota: {
      daily: 'Unlimited*',
      cost: '$0.075/$0.30 per 1K',
      context: '1M tokens'
    }
  },
  {
    provider: 'openai',
    displayName: 'OpenAI',
    description: 'Industry-leading AI models',
    keyFormat: PROVIDER_KEY_FORMATS.openai,
    documentationUrl: 'https://platform.openai.com/api-keys',
    features: ['High Quality', 'Industry Standard'],
    color: 'from-green-500 to-emerald-500',
    icon: '🎯',
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
    const config = PROVIDER_CONFIGS.find(p => p.provider === provider)
    if (!config) return false

    if (config.keyFormat.prefix && !key.startsWith(config.keyFormat.prefix)) {
      return false
    }

    return key.length >= config.keyFormat.minLength
  }

  const getProviderStatus = (provider: string): ProviderStatus | undefined => {
    return providers.find(p => p.provider === provider)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">AI Provider Management</h2>
        <p className="text-muted-foreground">
          Connect your API keys to unlock unlimited access and premium features across multiple AI providers.
        </p>
      </div>

      {/* Provider Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PROVIDER_CONFIGS.map((config) => {
          const status = getProviderStatus(config.provider)
          const isConfigured = status?.configured || false
          const isValid = status?.valid || false
          const currentKey = apiKeys[config.provider] || ''
          const isValidFormat = currentKey ? validateApiKey(config.provider, currentKey) : true
          const isEditing = editingProvider === config.provider

          return (
            <Card key={config.provider} className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
              isConfigured ? 'ring-2 ring-green-500/20 bg-gradient-to-br from-green-50/50 to-emerald-50/50' : 'hover:shadow-md'
            }`}>
              {/* Provider Header */}
              <div className={`h-2 bg-gradient-to-r ${config.color}`} />
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-white text-xl font-bold shadow-lg`}>
                      {config.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {config.displayName}
                        {isConfigured && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {config.description}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(config.documentationUrl, '_blank')}
                    className="opacity-60 hover:opacity-100"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Features */}
                <div className="flex gap-2 mt-3">
                  {config.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Configured State - Green Quota Box */}
                {isConfigured && !isEditing ? (
                  <div className="space-y-4">
                    {/* Quota Information */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-5 h-5" />
                        <span className="font-semibold">Unlimited Access Active</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="opacity-90">Daily Limit:</span>
                          <span className="font-medium">{config.quota.daily}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="opacity-90">Cost:</span>
                          <span className="font-medium">{config.quota.cost}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="opacity-90">Context:</span>
                          <span className="font-medium">{config.quota.context}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProvider(config.provider)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Update Key
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteApiKey(config.provider)}
                        disabled={deletingProvider === config.provider}
                      >
                        {deletingProvider === config.provider ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Status Info */}
                    {status?.last_validated && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Last validated: {new Date(status.last_validated).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  /* Not Configured or Editing State */
                  <div className="space-y-4">
                    {/* Input Field */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type={showKeys[config.provider] ? "text" : "password"}
                          placeholder={config.keyFormat.placeholder}
                          value={currentKey}
                          onChange={(e) => setApiKeys(prev => ({ 
                            ...prev, 
                            [config.provider]: e.target.value 
                          }))}
                          className={`text-sm transition-colors ${
                            !isValidFormat ? "border-red-300 focus:border-red-500" : 
                            currentKey ? "border-green-300 focus:border-green-500" : ""
                          }`}
                          disabled={loading || savingProvider === config.provider}
                        />
                        
                        {currentKey && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-auto"
                            onClick={() => setShowKeys(prev => ({ 
                              ...prev, 
                              [config.provider]: !prev[config.provider] 
                            }))}
                          >
                            {showKeys[config.provider] ? (
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
                          Invalid format. Should{config.keyFormat.prefix && ` start with "${config.keyFormat.prefix}" and`} be at least {config.keyFormat.minLength} characters.
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSaveApiKey(config.provider)}
                        disabled={
                          !currentKey || 
                          !isValidFormat || 
                          loading || 
                          savingProvider === config.provider
                        }
                        size="sm"
                        className="flex-1"
                      >
                        {savingProvider === config.provider ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        {isEditing ? 'Update' : 'Connect'}
                      </Button>
                      
                      {isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingProvider(null)
                            setApiKeys(prev => ({ ...prev, [config.provider]: '' }))
                            setShowKeys(prev => ({ ...prev, [config.provider]: false }))
                          }}
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

      {/* Info Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Bank-Grade Security</h3>
              <p className="text-sm text-muted-foreground">
                Your API keys are encrypted with AES-256 encryption before storage. We never see your raw keys.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Unlimited Usage</h3>
              <p className="text-sm text-muted-foreground">
                Your own API keys provide unlimited system quota and bypass all daily limits automatically.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Smart Routing</h3>
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