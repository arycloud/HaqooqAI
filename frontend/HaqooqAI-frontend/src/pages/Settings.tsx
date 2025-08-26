import { useEffect } from 'react'
import { ApiKeySettings } from '@/components/settings/ApiKeySettings'
import { QuotaSettings } from '@/components/settings/QuotaSettings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function Settings() {
  useEffect(() => {
    document.title = 'Settings - HaqooqAI'
  }, [])

  return (
    <div className="h-full overflow-y-auto bg-transparent">
      <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Manage your account, quota and API configuration in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quota Information */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-xl md:text-2xl">Usage & Quota</CardTitle>
              <CardDescription className="text-sm md:text-sm text-gray-600">
                Monitor daily query usage and manage quota limits.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <QuotaSettings />
            </CardContent>
          </Card>

          {/* API Key Settings */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-xl md:text-2xl">Groq API Key</CardTitle>
              <CardDescription className="text-sm md:text-sm text-gray-600">
                Connect your Groq API key for unlimited queries and improved performance.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ApiKeySettings />
            </CardContent>
          </Card>

          {/* About - full width */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">About HaqooqAI</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 dark:bg-slate-800/50 p-5 md:p-6 rounded-lg h-full">
                <h4 className="font-medium text-sm md:text-base text-gray-900 dark:text-white mb-1">Version</h4>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">2.0.0</p>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800/50 p-5 md:p-6 rounded-lg h-full">
                <h4 className="font-medium text-sm md:text-base text-gray-900 dark:text-white mb-1">What we do</h4>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  AI-powered legal assistant focused on Pakistani law — concise answers with
                  sourced citations to help you find reliable information quickly.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-slate-800/50 p-5 md:p-6 rounded-lg h-full">
                <h4 className="font-medium text-sm md:text-base text-gray-900 dark:text-white mb-1">Support</h4>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  For issues or feedback, open a discussion or issue on the project GitHub.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}