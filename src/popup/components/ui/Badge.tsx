// ============================================
// Dogendary Wallet - Badge Component
// Status badges with variants
// ============================================

import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-surface-2 text-text-secondary border-surface-3',
  success: 'bg-neon-green/10 text-neon-green border-neon-green/30',
  warning: 'bg-neon-orange/10 text-neon-orange border-neon-orange/30',
  error: 'bg-red-500/10 text-red-400 border-red-500/30',
  info: 'bg-neon-blue/10 text-neon-blue border-neon-blue/30',
  purple: 'bg-neon-purple/10 text-neon-purple border-neon-purple/30',
  gold: 'bg-gold-chrome/10 text-gold-chrome border-gold-chrome/30',
};

const dotColors: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-text-secondary',
  success: 'bg-neon-green',
  warning: 'bg-neon-orange',
  error: 'bg-red-400',
  info: 'bg-neon-blue',
  purple: 'bg-neon-purple',
  gold: 'bg-gold-chrome',
};

const sizeStyles: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
  lg: 'text-sm px-2.5 py-1',
};

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />
      )}
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';

export default Badge;
