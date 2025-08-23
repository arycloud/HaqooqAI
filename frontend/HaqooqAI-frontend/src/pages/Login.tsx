import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Scale, Shield, Zap, BookOpen } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { GitHubLogin } from '@/components/auth/GitHubLogin'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function Login() {
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    document.title = 'Login - HaqooqAI'
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(139,92,246,0.1)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.1)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(139,92,246,0.05)_0%,transparent_50%)] pointer-events-none" />

      <div className="max-w-none w-full grid lg:grid-cols-2 gap-16 lg:gap-20 xl:gap-24 items-center relative z-10 px-8 lg:px-12 xl:px-16">
        {/* Enhanced Left side - Branding with larger elements */}
        <div className="text-center lg:text-left space-y-12 lg:space-y-16">
          <div className="flex items-center justify-center lg:justify-start mb-12 fade-in">
            <div className="w-20 h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 rounded-3xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-2xl mr-6">
              <Scale className="w-10 h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-blue-800 bg-clip-text text-transparent">
                HaqooqAI
              </h1>
              <p className="text-lg lg:text-xl xl:text-2xl text-gray-500 dark:text-gray-400 mt-2">v2.0</p>
            </div>
          </div>

          <div className="slide-up">
            <h2 className="text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 dark:text-white mb-8 lg:mb-12 leading-tight">
              Your AI-Powered
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent block">
                Legal Assistant
              </span>
            </h2>

            <p className="text-2xl lg:text-3xl xl:text-4xl text-gray-600 dark:text-gray-300 mb-12 lg:mb-16 leading-relaxed">
              Get instant answers to your legal questions regarding Pakistan with AI-powered research and comprehensive source citations.
            </p>
          </div>

          {/* Enhanced Features with larger elements */}
          <div className="space-y-8 lg:space-y-10 scale-in">
            <div className="flex items-center justify-center lg:justify-start group">
              <div className="w-16 h-16 lg:w-18 lg:h-18 xl:w-20 xl:h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center mr-6 group-hover:scale-110 transition-transform duration-200">
                <Zap className="w-8 h-8 lg:w-9 lg:h-9 xl:w-10 xl:h-10 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <span className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-800 dark:text-gray-200 block">Instant Legal Answers</span>
                <span className="text-lg lg:text-xl xl:text-2xl text-gray-600 dark:text-gray-400">Get responses in seconds</span>
              </div>
            </div>
            <div className="flex items-center justify-center lg:justify-start group">
              <div className="w-16 h-16 lg:w-18 lg:h-18 xl:w-20 xl:h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 flex items-center justify-center mr-6 group-hover:scale-110 transition-transform duration-200">
                <BookOpen className="w-8 h-8 lg:w-9 lg:h-9 xl:w-10 xl:h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <span className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-800 dark:text-gray-200 block">Source Citations</span>
                <span className="text-lg lg:text-xl xl:text-2xl text-gray-600 dark:text-gray-400">Verified legal references</span>
              </div>
            </div>
            <div className="flex items-center justify-center lg:justify-start group">
              <div className="w-16 h-16 lg:w-18 lg:h-18 xl:w-20 xl:h-20 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 flex items-center justify-center mr-6 group-hover:scale-110 transition-transform duration-200">
                <Shield className="w-8 h-8 lg:w-9 lg:h-9 xl:w-10 xl:h-10 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <span className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-800 dark:text-gray-200 block">Secure & Private</span>
                <span className="text-lg lg:text-xl xl:text-2xl text-gray-600 dark:text-gray-400">Your data stays protected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Right side - Login with larger elements */}
        <div className="w-full max-w-2xl lg:max-w-3xl mx-auto slide-up">
          <Card className="border-0 shadow-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl">
            <CardHeader className="text-center pb-10 lg:pb-12">
              <CardTitle className="text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4 lg:mb-6">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-xl lg:text-2xl xl:text-3xl text-gray-600 dark:text-gray-400">
                Sign in to access your AI legal assistant (HaqooqAI)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-10 lg:space-y-12">
              <GitHubLogin className="w-full" />

              <div className="text-center">
                <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                  By signing in, you agree to our terms of service and privacy policy.
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-8 lg:p-10 rounded-3xl border border-blue-200/50 dark:border-blue-700/50">
                <div className="flex items-start space-x-4 lg:space-x-6">
                  <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl lg:text-2xl font-semibold text-blue-900 dark:text-blue-100 mb-3 lg:mb-4">Free Daily Quota</h4>
                    <p className="text-lg lg:text-xl text-blue-700 dark:text-blue-300 leading-relaxed">
                      Get 5 free questions per day. Add your own Groq API key for unlimited queries.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
