// ============================================
// Dogendary Wallet - Input Component
// Futuristic input field with validation states
// ============================================

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  success?: boolean;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    label,
    error,
    helperText,
    success,
    rightIcon,
    leftIcon,
    id,
    type = 'text',
    disabled,
    ...props 
  }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    
    const baseStyles = 'w-full py-3 bg-surface-2 border rounded-lg text-text-primary placeholder-text-tertiary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';
    const paddingStyles = leftIcon && rightIcon 
      ? 'px-10' 
      : leftIcon 
        ? 'pl-10 pr-4' 
        : rightIcon 
          ? 'pl-4 pr-10' 
          : 'px-4';
    const normalStyles = 'border-surface-3 focus:border-neon-cyan focus:ring-neon-cyan/30';
    const errorStyles = 'border-red-500 focus:border-red-500 focus:ring-red-500/30';
    const successStyles = 'border-neon-green focus:border-neon-green focus:ring-neon-green/30';
    const disabledStyles = 'opacity-50 cursor-not-allowed bg-surface-1';

    const getStateStyles = () => {
      if (error) return errorStyles;
      if (success) return successStyles;
      return normalStyles;
    };

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            className={cn(
              baseStyles,
              paddingStyles,
              getStateStyles(),
              disabled && disabledStyles,
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-text-tertiary">{helperText}</p>
        )}
        {success && !error && !helperText && (
          <p className="mt-1.5 text-sm text-neon-green">✓ Valid</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
