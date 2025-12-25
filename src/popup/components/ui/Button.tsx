// ============================================
// Dogendary Wallet - Button Component (FIXED)
// Added 'outline' variant
// ============================================

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary: cn(
        'bg-gradient-to-r from-neon-cyan to-neon-blue',
        'text-bg-primary font-semibold',
        'hover:shadow-lg hover:shadow-neon-cyan/25',
        'active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none'
      ),
      secondary: cn(
        'bg-surface-2 border border-white/10',
        'text-text-primary',
        'hover:bg-surface-3 hover:border-white/20',
        'active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      ),
      ghost: cn(
        'bg-transparent',
        'text-text-primary',
        'hover:bg-white/5',
        'active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      ),
      danger: cn(
        'bg-neon-orange/10 border border-neon-orange/30',
        'text-neon-orange',
        'hover:bg-neon-orange/20',
        'active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      ),
      outline: cn(
        'bg-transparent border border-neon-cyan/50',
        'text-neon-cyan',
        'hover:bg-neon-cyan/10 hover:border-neon-cyan',
        'active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      ),
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2',
          'rounded-lg transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-neon-cyan/50',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
