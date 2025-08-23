import { Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

interface GitHubLoginProps {
  className?: string
}

export function GitHubLogin({ className }: GitHubLoginProps) {
  const { login, loading } = useAuth()

  return (
    <Button
      onClick={login}
      disabled={loading}
      className={className}
      size="lg"
    >
      <Github className="w-5 h-5 mr-2" />
      {loading ? 'Connecting...' : 'Continue with GitHub'}
    </Button>
  )
}
