import { Scale, MessageSquare, BookOpen, Gavel, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';

interface WelcomeScreenProps {
  onSampleQuery?: (query: string) => void;
}

const sampleQueries = [
  {
    icon: BookOpen,
    title: "Property Law",
    query: "What are the property rights in Pakistan?",
    description: "Learn about property ownership and transfer laws"
  },
  {
    icon: Gavel,
    title: "Business Registration",
    query: "How to register a business in Pakistan?",
    description: "Step-by-step guide for business incorporation"
  },
  {
    icon: FileText,
    title: "Constitutional Law",
    query: "What are the fundamental rights in Pakistan's Constitution?",
    description: "Explore constitutional rights and protections"
  },
  {
    icon: MessageSquare,
    title: "Family Law",
    query: "What are the marriage laws in Pakistan?",
    description: "Understanding family and marriage regulations"
  }
];

export function WelcomeScreen({ onSampleQuery }: WelcomeScreenProps) {
  return (
    <div className="h-full flex items-center justify-center relative overflow-hidden bg-[var(--background-color)]">
      
      <div className="text-center max-w-6xl px-8 relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="mb-12"
        >
          <div className="relative mb-8">
            <motion.div
              className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)] flex items-center justify-center mx-auto shadow-2xl"
              animate={{
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Scale className="w-12 h-12 text-white" />
            </motion.div>
            <motion.div 
              className="absolute -inset-8 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full blur-2xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
          
          <motion.h1
            className="text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Welcome to{' '}
            <span className="bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] bg-clip-text text-transparent">
              HaqooqAI
            </span>
          </motion.h1>

          <motion.p
            className="text-xl lg:text-2xl text-[var(--text-secondary)] mb-8 leading-relaxed max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Your intelligent Pakistani legal assistant powered by advanced AI.
            Get instant, accurate answers to your legal questions with verified sources.
          </motion.p>

          <motion.div
            className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="flex items-center space-x-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200/50 dark:border-gray-700/50">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>AI-Powered Legal Research</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200/50 dark:border-gray-700/50">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span>Verified Legal Sources</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200/50 dark:border-gray-700/50">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span>Pakistani Law Specialist</span>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Sample Queries Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Try asking about:
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sampleQueries.map((sample, index) => {
              const IconComponent = sample.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 1 + (index * 0.1),
                    ease: [0.4, 0, 0.2, 1]
                  }}
                >
                  <Button
                    variant="ghost"
                    onClick={() => onSampleQuery?.(sample.query)}
                    className="group h-auto p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 w-full"
                  >
                    <div className="text-left space-y-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {sample.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {sample.description}
                        </p>
                      </div>
                    </div>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
        >
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Ready to get started? Type your legal question below.
          </p>
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-2xl"
          >
            ⬇️
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
