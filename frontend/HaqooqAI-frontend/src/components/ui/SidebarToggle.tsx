import { useState } from 'react';
import { Menu, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
  variant?: 'floating' | 'inline';
  showLabel?: boolean;
}

export function SidebarToggle({ 
  isOpen, 
  onToggle, 
  className,
  variant = 'floating',
  showLabel = false 
}: SidebarToggleProps) {
  const [isHovered, setIsHovered] = useState(false);

  const baseClasses = variant === 'floating' 
    ? "fixed top-4 left-4 z-50 w-12 h-12 rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300"
    : "w-10 h-10 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 transition-all duration-200";

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(baseClasses, "group")}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hover indicator */}
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
      </Button>

      {/* Tooltip/Label */}
      <AnimatePresence>
        {showLabel && isHovered && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium rounded-lg shadow-lg whitespace-nowrap"
          >
            {isOpen ? "Close conversations" : "Show conversations"}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversation count indicator */}
      {!isOpen && variant === 'floating' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
        >
          <MessageSquare className="w-3 h-3 text-white" />
        </motion.div>
      )}
    </div>
  );
}
