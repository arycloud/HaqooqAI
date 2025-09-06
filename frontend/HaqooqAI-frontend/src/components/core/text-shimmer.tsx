'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import React from 'react';

interface TextShimmerProps {
  children: string;
  className?: string;
  duration?: number;
  spread?: number;
  as?: keyof React.JSX.IntrinsicElements;
}

export function TextShimmer({
  children,
  className,
  duration = 2,
  spread = 2,
  as: Component = 'p',
}: TextShimmerProps) {
  const MotionComponent = motion[Component as keyof typeof motion] as typeof motion.div;

  return (
    <MotionComponent
      className={cn(
        'relative inline-block overflow-hidden',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <span className="relative z-10">{children}</span>
      <motion.div
        className="absolute inset-0 -top-1 -bottom-1"
        style={{
          background: `linear-gradient(
            90deg,
            transparent 0%,
            transparent 40%,
            rgba(255, 255, 255, 0.8) 50%,
            transparent 60%,
            transparent 100%
          )`,
          backgroundSize: `${spread * 100}% 100%`,
        }}
        animate={{
          backgroundPosition: ['-200% 0%', '200% 0%'],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.div
        className="absolute inset-0 -top-1 -bottom-1 dark:block hidden"
        style={{
          background: `linear-gradient(
            90deg,
            transparent 0%,
            transparent 40%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 60%,
            transparent 100%
          )`,
          backgroundSize: `${spread * 100}% 100%`,
        }}
        animate={{
          backgroundPosition: ['-200% 0%', '200% 0%'],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </MotionComponent>
  );
}

// Basic implementation as requested
export function TextShimmerBasic() {
  return (
    <TextShimmer className='font-mono text-sm' duration={1}>
      There should be our dynamic messages ( from loading)
    </TextShimmer>
  );
}
