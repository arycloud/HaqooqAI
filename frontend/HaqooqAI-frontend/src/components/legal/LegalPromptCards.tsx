import { Scale, Home, Briefcase, Heart, Shield, Building } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface LegalPrompt {
  id: string
  category: string
  title: string
  description: string
  prompt: string
  icon: React.ReactNode
}

const legalPrompts: LegalPrompt[] = [
  {
    id: '1',
    category: 'Property Law',
    title: 'Property Purchase',
    description: 'Legal requirements for buying property in Pakistan',
    prompt: 'What are the legal requirements and documentation needed to purchase property in Pakistan?',
    icon: <Home className="w-5 h-5" />
  },
  {
    id: '2',
    category: 'Family Law',
    title: 'Marriage Registration',
    description: 'Process for registering marriage in Pakistan',
    prompt: 'What is the legal process for registering a marriage in Pakistan and what documents are required?',
    icon: <Heart className="w-5 h-5" />
  },
  {
    id: '3',
    category: 'Business Law',
    title: 'Company Registration',
    description: 'Steps to register a company in Pakistan',
    prompt: 'What are the steps and legal requirements to register a private limited company in Pakistan?',
    icon: <Building className="w-5 h-5" />
  },
  {
    id: '4',
    category: 'Labor Law',
    title: 'Employment Rights',
    description: 'Employee rights and protections under Pakistani law',
    prompt: 'What are the basic employment rights and protections available to workers under Pakistani labor law?',
    icon: <Briefcase className="w-5 h-5" />
  },
  {
    id: '5',
    category: 'Criminal Law',
    title: 'Bail Procedures',
    description: 'Legal process for obtaining bail in Pakistan',
    prompt: 'What is the legal process for obtaining bail in Pakistan and what factors do courts consider?',
    icon: <Shield className="w-5 h-5" />
  },
  {
    id: '6',
    category: 'Civil Law',
    title: 'Contract Disputes',
    description: 'Resolving contract disputes through legal channels',
    prompt: 'What are the legal remedies available for breach of contract under Pakistani law?',
    icon: <Scale className="w-5 h-5" />
  }
]

interface LegalPromptCardsProps {
  onPromptSelect: (prompt: string) => void
}

export function LegalPromptCards({ onPromptSelect }: LegalPromptCardsProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {legalPrompts.map((prompt) => (
        <Card
          key={prompt.id}
          className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 border border-[var(--border-color)] bg-[var(--sidebar-color)]"
          onClick={() => onPromptSelect(prompt.prompt)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-br from-[var(--primary-color)]/20 to-[var(--secondary-color)]/20 rounded-lg text-[var(--primary-color)]">
                {prompt.icon}
              </div>
              <div>
                <CardTitle className="text-sm font-medium text-[var(--text-primary)]">{prompt.title}</CardTitle>
                <p className="text-xs text-[var(--primary-color)]">{prompt.category}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-sm text-[var(--text-secondary)]">
              {prompt.description}
            </CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
