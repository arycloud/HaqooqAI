import { useEffect } from 'react'
import { ApiKeySettings } from '@/components/settings/ApiKeySettings'
import { QuotaSettings } from '@/components/settings/QuotaSettings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function Settings() {
  useEffect(() => {
    document.title = 'Settings - HaqooqAI'
  }, [])

  return (
    <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Settings</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Manage your account settings and API configuration
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quota Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-2xl">Usage & Quota</CardTitle>
                <CardDescription className="text-lg">
                  Monitor your daily query usage and manage your quota limits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuotaSettings />
              </CardContent>
            </Card>

            {/* API Key Settings */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-2xl">Groq API Key</CardTitle>
                <CardDescription className="text-lg">
                  Add your own Groq API key for unlimited queries and faster responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ApiKeySettings />
              </CardContent>
            </Card>

            {/* About */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-2xl">About HaqooqAI</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-xl">
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">Version</h4>
                  <p className="text-gray-600 dark:text-gray-400">2.0.0</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-xl">
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">Description</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    AI-powered legal assistant specialized in Pakistani law. Get instant answers 
                    to your legal questions with comprehensive source citations.
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-xl">
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">Support</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    For technical support or feedback, please contact us through GitHub.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  )
}