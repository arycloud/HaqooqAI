import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { useConversations } from '@/hooks/useConversations'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Conversation } from '@/types/conversation'

export function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { conversations, createConversation, loading } = useConversations()

  useEffect(() => {
    document.title = 'Dashboard - HaqooqAI'
  }, [])

  const handleNewChat = async () => {
    try {
      const conversation = await createConversation('New Conversation')
      navigate(`/chat/${conversation.id}`)
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const handlePromptSelect = async (prompt: string) => {
    try {
      const conversation = await createConversation()
      navigate(`/chat/${conversation.id}`, { state: { initialPrompt: prompt } })
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  return (

    // <MainLayout className="p-0"> {/* Remove default padding to control it ourselves */}
      <div className="h-full overflow-y-auto">
        <div className="max-w-none mx-auto p-8 lg:p-12 xl:p-16 space-y-16 lg:space-y-20">
          {/* Enhanced Welcome Section with larger elements */}
          <div className="text-center relative">
            {/* Enhanced background decoration */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] lg:w-[800px] lg:h-[800px] bg-gradient-to-r from-[var(--primary-color)]/10 to-[var(--secondary-color)]/10 rounded-full blur-3xl" />
            </div>

            <div className="flex items-center justify-center mb-10 lg:mb-12 fade-in">
              <div className="w-20 h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 rounded-3xl bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)] flex items-center justify-center shadow-2xl mr-6">
                <span className="material-symbols-outlined text-white text-4xl lg:text-5xl xl:text-6xl">balance</span>
              </div>
              <div className="text-left">
                <h1 className="text-6xl lg:text-7xl xl:text-8xl font-bold bg-gradient-to-r from-[var(--primary-color)] via-[var(--secondary-color)] to-[var(--primary-color)] bg-clip-text text-transparent">
                  HaqooqAI
                </h1>
                <p className="text-lg lg:text-xl xl:text-2xl text-[var(--text-secondary)] mt-2">Pakistani Legal Assistant</p>
              </div>
            </div>

            <div className="max-w-4xl mx-auto mb-12 lg:mb-16 slide-up">
              <p className="text-3xl lg:text-4xl xl:text-5xl font-medium text-[var(--text-primary)] mb-4 lg:mb-6">
                Welcome back, <span className="text-[var(--primary-color)] font-semibold">{user?.username}</span>!
              </p>
              <p className="text-xl lg:text-2xl xl:text-3xl text-[var(--text-secondary)] leading-relaxed">
                How can I help you navigate Pakistani law today? Ask me anything about legal matters, regulations, or procedures.
              </p>
            </div>

            <Button
              onClick={handleNewChat}
              size="lg"
              className="px-12 py-6 lg:px-16 lg:py-8 text-xl lg:text-2xl font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 scale-in"
            >
              <MessageSquare className="w-6 h-6 lg:w-8 lg:h-8 mr-4" />
              Start New Conversation
            </Button>
          </div>

          {/* Enhanced Features Grid with larger cards */}
          <div className="grid lg:grid-cols-3 gap-10 lg:gap-12 xl:gap-16 mb-16 lg:mb-20">
            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-[var(--border-color)] bg-[var(--sidebar-color)]">
              <CardHeader className="text-center pb-6 lg:pb-8">
                <div className="w-20 h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 mx-auto mb-6 lg:mb-8 rounded-3xl bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)] flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
                  <span className="material-symbols-outlined text-white text-4xl lg:text-5xl xl:text-6xl">flash_on</span>
                </div>
                <CardTitle className="text-2xl lg:text-3xl xl:text-4xl font-bold text-[var(--text-primary)]">Instant Answers</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-lg lg:text-xl xl:text-2xl text-[var(--text-secondary)] leading-relaxed">
                  Get immediate responses to your legal questions powered by AI and comprehensive Pakistani legal databases.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-[var(--border-color)] bg-[var(--sidebar-color)]">
              <CardHeader className="text-center pb-6 lg:pb-8">
                <div className="w-20 h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 mx-auto mb-6 lg:mb-8 rounded-3xl bg-gradient-to-br from-[var(--secondary-color)] to-[var(--primary-color)] flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
                  <span className="material-symbols-outlined text-white text-4xl lg:text-5xl xl:text-6xl">book</span>
                </div>
                <CardTitle className="text-2xl lg:text-3xl xl:text-4xl font-bold text-[var(--text-primary)]">Source Citations</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-lg lg:text-xl xl:text-2xl text-[var(--text-secondary)] leading-relaxed">
                  Every answer includes references to relevant laws, cases, and legal documents for verification.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-[var(--border-color)] bg-[var(--sidebar-color)]">
              <CardHeader className="text-center pb-6 lg:pb-8">
                <div className="w-20 h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 mx-auto mb-6 lg:mb-8 rounded-3xl bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)] flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
                  <span className="material-symbols-outlined text-white text-4xl lg:text-5xl xl:text-6xl">balance</span>
                </div>
                <CardTitle className="text-2xl lg:text-3xl xl:text-4xl font-bold text-[var(--text-primary)]">Pakistani Law Focus</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-lg lg:text-xl xl:text-2xl text-[var(--text-secondary)] leading-relaxed">
                  Specialized in Pakistani legal system including civil, criminal, family, and business law.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Legal Prompt Cards with larger elements */}
          {/* <div className="slide-up">
            <div className="text-center mb-12 lg:mb-16">
              <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] bg-clip-text text-transparent mb-4 lg:mb-6">
                Popular Legal Questions
              </h2>
              <p className="text-xl lg:text-2xl xl:text-3xl text-[var(--text-secondary)] max-w-4xl mx-auto leading-relaxed">
                Get started with these common legal queries or ask your own question
              </p>
            </div>
            <LegalPromptCards onPromptSelect={handlePromptSelect} />
          </div> */}

          {/* Enhanced Recent Conversations with larger elements */}
          {!loading && conversations.length > 0 && (
            <div className="slide-up">
              <div className="text-center mb-12 lg:mb-16">
                <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] bg-clip-text text-transparent mb-4 lg:mb-6">
                  Recent Conversations
                </h2>
                <p className="text-xl lg:text-2xl xl:text-3xl text-[var(--text-secondary)]">
                  Continue where you left off
                </p>
              </div>
              <div className="grid gap-8 lg:gap-10">
                {(conversations as Conversation[]).slice(0, 3).map((conversation: Conversation, index: number) => (
                  <Card
                    key={conversation.id}
                    className="group cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-[var(--border-color)] bg-[var(--sidebar-color)]"
                    onClick={() => navigate(`/chat/${conversation.id}`)}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader className="pb-6 lg:pb-8">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-2xl lg:text-3xl xl:text-4xl font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary-color)] transition-colors duration-200 mb-3 lg:mb-4">
                            {conversation.title}
                          </CardTitle>
                          <CardDescription className="text-lg lg:text-xl xl:text-2xl text-[var(--text-secondary)] flex items-center">
                            <MessageSquare className="w-5 h-5 lg:w-6 lg:h-6 mr-3" />
                            Last updated: {new Date(conversation.updated_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="w-16 h-16 lg:w-18 lg:h-18 xl:w-20 xl:h-20 rounded-2xl bg-gradient-to-br from-[var(--primary-color)]/20 to-[var(--secondary-color)]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <MessageSquare className="w-7 h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9 text-[var(--primary-color)]" />
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    // </MainLayout>

  )
}
