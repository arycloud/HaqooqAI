// NEW FILE: /Users/apple/PycharmProjects/HaqooqAI_2.0/HaqooqAI/frontend/HaqooqAI-frontend/src/components/settings/MultiProviderApiKeySettings.tsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, Save, Eye, EyeOff, ExternalLink } from 'lucide-react'
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
}

const PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    provider: 'groq',
    displayName: 'Groq',
    description: 'Ultra-fast inference with Qwen models. Best for quick responses.',
    keyFormat: PROVIDER_KEY_FORMATS.groq,
    documentationUrl: 'https://console.groq.com/keys',
    features: ['Fast inference', 'Cost-effective', 'Default provider']
  },
  {
    provider: 'gemini',
    displayName: 'Google Gemini',
    description: 'Advanced AI with large context windows. Best for complex queries.',
    keyFormat: PROVIDER_KEY_FORMATS.gemini,
    documentationUrl: 'https://makersuite.google.com/app/apikey',
    features: ['Large context', 'Complex reasoning', 'Multimodal capabilities']
  },
  {
    provider: 'openai',
    displayName: 'OpenAI',
    description: 'Industry-leading AI models. Requires your own API key.',
    keyFormat: PROVIDER_KEY_FORMATS.openai,
    documentationUrl: 'https://platform.openai.com/api-keys',
    features: ['Industry standard', 'High quality', 'BYOK only']
  }
]

export function MultiProviderApiKeySettings() {
  const { user } = useAuth()
  const [providers, setProviders] = useState<ProviderStatus[]>([])
  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({})
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({})
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
      
      // Clear the input field
      setApiKeys(prev => ({ ...prev, [provider]: '' }))
      setShowKeys(prev => ({ ...prev, [provider]: false }))
      
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">API Key Management</h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure your API keys for different LLM providers. Your keys are encrypted and stored securely.
        </p>
      </div>

      {/* Provider Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {PROVIDER_CONFIGS.map((config) => {
          const status = getProviderStatus(config.provider)
          const isConfigured = status?.configured || false
          const isValid = status?.valid || false
          const currentKey = apiKeys[config.provider] || ''
          const isValidFormat = currentKey ? validateApiKey(config.provider, currentKey) : true

          return (
            <Card key={config.provider} className="w-full h-fit">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="text-base">{config.displayName}</CardTitle>
                    <div className="flex space-x-1">
                      {isConfigured && (
                        <Badge variant={isValid ? "default" : "destructive"} className="text-xs">
                          {isValid ? 'Active' : 'Invalid'}
                        </Badge>
                      )}
                      {config.provider === 'groq' && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                      {config.provider === 'openai' && (
                        <Badge variant="outline" className="text-xs">BYOK Only</Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(config.documentationUrl, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
                
                <CardDescription className="text-sm">
                  {config.description}
                </CardDescription>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {config.features.slice(0, 2).map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs px-2 py-0">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4 pt-0">
                {status?.last_validated && (
                  <p className="text-xs text-gray-500">
                    Last validated: {new Date(status.last_validated).toLocaleString()}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type={showKeys[config.provider] ? "text" : "password"}
                      placeholder={
                        isConfigured 
                          ? `${config.displayName} key configured`
                          : config.keyFormat.placeholder
                      }
                      value={currentKey}
                      onChange={(e) => setApiKeys(prev => ({ 
                        ...prev, 
                        [config.provider]: e.target.value 
                      }))}
                      className={`text-sm ${!isValidFormat ? "border-red-300" : ""}`}
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

                  <div className="flex space-x-2">
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
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </>
                      )}
                    </Button>

                    {isConfigured && (
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteApiKey(config.provider)}
                        disabled={loading || deletingProvider === config.provider}
                        size="sm"
                      >
                        {deletingProvider === config.provider ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    )}
                  </div>

                  {currentKey && !isValidFormat && (
                    <p className="text-xs text-red-600">
                      Invalid format. Should 
                      {config.keyFormat.prefix && ` start with "${config.keyFormat.prefix}" and`} be at least {config.keyFormat.minLength} chars.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Security Information */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="text-center">
              <div className="font-medium text-foreground mb-1">🔐 Security</div>
              <p>All API keys are encrypted before storage using industry-standard encryption.</p>
            </div>
            <div className="text-center">
              <div className="font-medium text-foreground mb-1">⚡ Unlimited Usage</div>
              <p>Your own API keys provide unlimited system quota and bypass daily limits.</p>
            </div>
            <div className="text-center">
              <div className="font-medium text-foreground mb-1">🔄 Smart Routing</div>
              <p>System automatically selects the best provider based on query complexity.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}