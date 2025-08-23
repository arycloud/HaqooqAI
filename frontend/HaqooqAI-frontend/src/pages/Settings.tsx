import { useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { ApiKeySettings } from '@/components/settings/ApiKeySettings'
import { QuotaSettings } from '@/components/settings/QuotaSettings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function Settings() {
  useEffect(() => {
    document.title = 'Settings - HaqooqAI'
  }, [])

  return (
    <MainLayout>
      <div className="h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">
              Manage your account settings and API configuration.
            </p>
          </div>

          {/* Quota Information */}
          <Card>
            <CardHeader>
              <CardTitle>Usage & Quota</CardTitle>
              <CardDescription>
                Monitor your daily query usage and manage your quota limits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuotaSettings />
            </CardContent>
          </Card>

          {/* API Key Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Groq API Key</CardTitle>
              <CardDescription>
                Add your own Groq API key for unlimited queries and faster responses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApiKeySettings />
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About HaqooqAI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Version</h4>
                <p className="text-sm text-gray-600">2.0.0</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Description</h4>
                <p className="text-sm text-gray-600">
                  AI-powered legal assistant specialized in Pakistani law. Get instant answers 
                  to your legal questions with comprehensive source citations.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Support</h4>
                <p className="text-sm text-gray-600">
                  For technical support or feedback, please contact us through GitHub.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
