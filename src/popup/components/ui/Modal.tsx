// ============================================
// Dogendary Wallet - Modal Component
// 24HRMVP Liquid Chrome Design System
// ============================================

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  children,
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-bg-deepest/80 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'w-[calc(100%-2rem)] max-w-sm',
            'card-glass rounded-xl shadow-glow-md',
            'animate-slide-up',
            'focus:outline-none'
          )}
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

// Modal Header
interface ModalHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  children,
  onClose,
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-between px-4 py-3 border-b border-border/50', className)}>
      <Dialog.Title className="text-lg font-semibold text-text-primary font-heading">
        {children}
      </Dialog.Title>
      {onClose && (
        <Dialog.Close asChild>
          <button
            className="text-text-tertiary hover:text-text-primary transition-colors p-1 -mr-1"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </Dialog.Close>
      )}
    </div>
  );
};

// Modal Body
interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalBody: React.FC<ModalBodyProps> = ({ children, className }) => {
  return <div className={cn('p-4', className)}>{children}</div>;
};

// Modal Footer
interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ children, className }) => {
  return (
    <div className={cn('flex gap-3 px-4 py-3 border-t border-border/50', className)}>
      {children}
    </div>
  );
};

// Confirm Modal - Pre-built confirmation dialog
interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'danger' | 'default';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  isLoading = false,
}) => {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalHeader onClose={handleCancel}>{title}</ModalHeader>
      <ModalBody>
        <p className="text-text-secondary">{description}</p>
      </ModalBody>
      <ModalFooter className="justify-end">
        <button
          onClick={handleCancel}
          className="btn-ghost px-4 py-2"
          disabled={isLoading}
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-all',
            variant === 'danger' ? 'btn-danger' : 'btn-chrome'
          )}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : confirmText}
        </button>
      </ModalFooter>
    </Modal>
  );
};
