import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, ExternalLink, Sparkles } from 'lucide-react'

interface TailarkPricingTier {
  name: string
  price: string
  description: string
  features: string[]
  popular?: boolean
  ctaText: string
  ctaLink: string
}

const PRICING_TIERS: TailarkPricingTier[] = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started with basic components',
    features: [
      '10 components access',
      'Basic animations',
      'Community support',
      'MIT License'
    ],
    ctaText: 'Get Started',
    ctaLink: 'https://tailark.com/pricing'
  },
  {
    name: 'Pro',
    price: '$29',
    description: 'Everything you need for professional projects',
    features: [
      '100+ premium components',
      'Advanced animations',
      'Priority support',
      'Commercial license',
      'Figma components',
      'Weekly updates'
    ],
    popular: true,
    ctaText: 'Upgrade to Pro',
    ctaLink: 'https://tailark.com/pricing'
  },
  {
    name: 'Team',
    price: '$99',
    description: 'For teams and larger organizations',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Custom components',
      'Dedicated support',
      'White-label license',
      'Custom integrations'
    ],
    ctaText: 'Contact Sales',
    ctaLink: 'https://tailark.com/contact'
  }
]

export function TailarkPricingBlock() {
  return (
    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-lg">Tailark Components</CardTitle>
        </div>
        <CardDescription>
          Premium Tailwind CSS components for faster development
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {PRICING_TIERS.map((tier, index) => (
            <Card
              key={tier.name}
              className={`relative transition-all duration-300 hover:shadow-md ${
                tier.popular 
                  ? 'ring-2 ring-purple-500/20 bg-gradient-to-br from-purple-50 to-purple-100' 
                  : 'hover:shadow-sm'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white text-xs px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-base">{tier.name}</CardTitle>
                <div className="text-2xl font-bold text-purple-600">
                  {tier.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    {tier.price !== '$0' ? '/month' : ''}
                  </span>
                </div>
                <CardDescription className="text-xs h-8 flex items-center justify-center">
                  {tier.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-2">
                <ul className="space-y-2 mb-4">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2 text-xs">
                      <Check className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  variant={tier.popular ? "default" : "outline"}
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => window.open(tier.ctaLink, '_blank')}
                >
                  {tier.ctaText}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground mb-2">
            Enhance your development workflow with premium components
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('https://tailark.com/docs', '_blank')}
            className="text-xs"
          >
            View Documentation
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}