// ============================================
// Dogendary Wallet - Loading Spinner Component
// 24HRMVP Liquid Chrome Design System
// ============================================

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text,
}) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'rounded-full border-neon-cyan/30 border-t-neon-cyan animate-spin',
          sizes[size]
        )}
      />
      {text && (
        <p className="text-sm text-text-secondary font-mono animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

// Skeleton loader for content placeholders
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
}) => {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full aspect-square',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={cn(
        'bg-surface-2 animate-pulse',
        variants[variant],
        className
      )}
      style={{ width, height }}
    />
  );
};

// Dogecoin Loading Animation
export const DogeLoader: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Doge Icon with pulse */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-chrome to-amber-600 flex items-center justify-center animate-pulse">
          <span className="text-2xl font-bold text-bg-deepest font-display">Ð</span>
        </div>
        {/* Rotating ring */}
        <div className="absolute inset-0 rounded-full border-2 border-neon-cyan/50 border-t-neon-cyan animate-spin" />
      </div>
      <p className="text-sm text-text-secondary font-mono">Loading...</p>
    </div>
  );
};

// Pulse Dot Loader
export const PulseLoader: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('flex gap-1.5', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
};
