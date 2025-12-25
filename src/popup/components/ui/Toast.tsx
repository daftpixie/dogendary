// ============================================
// Dogendary Wallet - Toast Component
// Notification toast system
// ============================================

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import type { ToastData } from '@/types';

// Re-export Toast type for convenience
export type { ToastData as ToastType };

// Simple Toast component props (for direct usage in App.tsx)
interface ToastProps {
  type: ToastData['type'];
  message: string;
  title?: string;
  onClose?: () => void;
  duration?: number;
}

const icons: Record<ToastData['type'], React.ReactElement> = {
  success: <CheckCircle className="w-5 h-5 text-neon-green" />,
  error: <AlertCircle className="w-5 h-5 text-neon-orange" />,
  warning: <AlertTriangle className="w-5 h-5 text-neon-yellow" />,
  info: <Info className="w-5 h-5 text-neon-cyan" />,
};

const backgrounds: Record<ToastData['type'], string> = {
  success: 'bg-neon-green/10 border-neon-green/30',
  error: 'bg-neon-orange/10 border-neon-orange/30',
  warning: 'bg-neon-yellow/10 border-neon-yellow/30',
  info: 'bg-neon-cyan/10 border-neon-cyan/30',
};

/**
 * Simple Toast component for direct usage
 * Usage: <Toast type="success" message="Hello" onClose={() => {}} />
 */
export function Toast({ type, message, title, onClose, duration = 5000 }: ToastProps): React.ReactElement {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onClose?.(), 200);
      }, duration);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [duration, onClose]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onClose?.(), 200);
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg',
        'backdrop-blur-sm transition-all duration-200',
        backgrounds[type],
        isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      )}
    >
      {icons[type]}
      
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-medium text-text-primary">
            {title}
          </p>
        )}
        {message && (
          <p className="text-xs text-text-secondary mt-0.5">
            {message}
          </p>
        )}
      </div>
      
      {onClose && (
        <button
          onClick={handleDismiss}
          className="text-text-tertiary hover:text-text-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ToastItem for ToastContainer usage
interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

export function ToastItem({ toast, onDismiss }: ToastItemProps): React.ReactElement {
  return (
    <Toast
      type={toast.type}
      message={toast.message || toast.description || ''}
      title={toast.title}
      onClose={() => onDismiss(toast.id)}
      duration={toast.duration}
    />
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function ToastContainer({
  toasts,
  onDismiss,
  position = 'top-right',
}: ToastContainerProps): React.ReactElement | null {
  if (toasts.length === 0) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2 max-w-sm w-full',
        positionClasses[position]
      )}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    toast: {
      success: (message: string, title?: string) =>
        addToast({ type: 'success', message, title, duration: 4000 }),
      error: (message: string, title?: string) =>
        addToast({ type: 'error', message, title, duration: 6000 }),
      warning: (message: string, title?: string) =>
        addToast({ type: 'warning', message, title, duration: 5000 }),
      info: (message: string, title?: string) =>
        addToast({ type: 'info', message, title, duration: 4000 }),
    },
  };
}

// Default export
export default Toast;
