// ============================================
// Dogendary Wallet - Card Component
// Glass morphism card with chrome styling
// ============================================

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'chrome' | 'outline' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  hoverable?: boolean; // Alias for hover
}

const variantStyles = {
  default: 'bg-surface-1 border border-surface-3',
  chrome: 'bg-gradient-to-br from-chrome-dark/20 to-chrome-light/10 border border-chrome-light/20',
  outline: 'bg-transparent border border-neon-cyan/30',
  glass: 'bg-surface-1/80 backdrop-blur-md border border-white/10 shadow-lg'
};

const paddingStyles = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6'
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant = 'default', 
    padding = 'md',
    hover = false,
    hoverable = false,
    children, 
    ...props 
  }, ref) => {
    const isHoverable = hover || hoverable;
    const baseStyles = 'rounded-xl transition-all duration-200';
    const hoverStyles = isHoverable ? 'hover:border-neon-cyan/50 hover:shadow-neon-cyan/10 hover:shadow-lg cursor-pointer' : '';

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          paddingStyles[padding],
          hoverStyles,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header component
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({
    title,
    subtitle,
    action,
    className,
    children,
    ...props
  }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn('flex items-center justify-between mb-4', className)} 
        {...props}
      >
        {children || (
          <>
            <div>
              {title && <h3 className="text-lg font-semibold text-text-primary">{title}</h3>}
              {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
          </>
        )}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// Card Title component
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-lg font-semibold text-text-primary', className)}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

CardTitle.displayName = 'CardTitle';

// Card Description component
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-text-secondary', className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);

CardDescription.displayName = 'CardDescription';

// Card Content component
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('', className)} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

// Card Footer component
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'center' | 'right' | 'between';
}

const alignStyles = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
  between: 'justify-between'
};

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({
    align = 'right',
    className,
    children,
    ...props
  }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(
          'flex items-center gap-3 mt-4 pt-4 border-t border-surface-3',
          alignStyles[align],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

export default Card;
