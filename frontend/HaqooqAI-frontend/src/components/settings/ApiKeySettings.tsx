import { useState } from 'react'
import { Eye, EyeOff, Key, ExternalLink } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { aiService } from '@/services/backend/aiService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import toast from 'react-hot-toast'

export function ApiKeySettings() {
  const { user, updateUser } = useAuth()
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [saving, setSaving] = useState(false)

  // Check if user has an API key based on the presence of the placeholder
  const hasApiKey = !!user?.groq_api_key

  const handleSaveApiKey = async () => {
    if (!user || !apiKey.trim()) {
      toast.error('Please enter a valid API key')
      return
    }

    try {
      setSaving(true)
      await aiService.saveApiKey(user.id, apiKey.trim())
      
      // Update user in local state with a placeholder to indicate API key is set
      updateUser({
        ...user,
        groq_api_key: '******',
      })

      toast.success('API key saved successfully!')
      setApiKey('')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save API key'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveApiKey = async () => {
    if (!user) return

    try {
      setSaving(true)
      await aiService.saveApiKey(user.id, '')
      
      // Update user in local state
      updateUser({
        ...user,
        groq_api_key: undefined,
      })

      toast.success('API key removed successfully!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove API key'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {hasApiKey ? (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">API Key Active</p>
                  <p className="text-sm text-green-700">You have unlimited queries</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveApiKey}
                disabled={saving}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Get Unlimited Queries</h4>
            <p className="text-sm text-blue-700 mb-3">
              Add your own Groq API key to remove daily limits and get faster responses.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://console.groq.com/keys', '_blank')}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Get Groq API Key
            </Button>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Input
                type={showApiKey ? 'text' : 'password'}
                placeholder="Enter your Groq API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>

            <Button
              onClick={handleSaveApiKey}
              disabled={!apiKey.trim() || saving}
              className="w-full"
            >
              {saving ? 'Saving...' : 'Save API Key'}
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            <p>Your API key is encrypted and stored securely. It's only used to make requests to Groq on your behalf.</p>
          </div>
        </div>
      )}
    </div>
  )
}