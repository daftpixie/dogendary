// ============================================
// Dogendary Wallet - Receive Page
// Display address and QR code for receiving
// ============================================

import React, { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { useWalletStore, selectActiveAccount } from '../hooks/useWalletStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { copyToClipboard } from '@/lib/utils';

export const ReceivePage: React.FC = () => {
  const { setView, addToast } = useWalletStore();
  const activeAccount = useWalletStore(selectActiveAccount);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!activeAccount) return;
    
    const success = await copyToClipboard(activeAccount.address);
    if (success) {
      setCopied(true);
      addToast({ type: 'success', message: 'Address copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
    } else {
      addToast({ type: 'error', message: 'Failed to copy address' });
    }
  };

  const handleShare = async () => {
    if (!activeAccount) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Dogecoin Address',
          text: activeAccount.address,
        });
      } else {
        handleCopy();
      }
    } catch (error) {
      // User cancelled sharing
    }
  };

  if (!activeAccount) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-secondary">No account available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text-primary">Receive DOGE</h1>
        <p className="text-sm text-text-secondary">
          Share your address to receive Dogecoin
        </p>
      </div>

      {/* QR Code placeholder */}
      <Card variant="chrome" className="p-6 mb-6">
        <div className="aspect-square max-w-[200px] mx-auto bg-white rounded-xl p-4 mb-4">
          {/* In a real app, use a QR code library like qrcode.react */}
          <div className="w-full h-full bg-surface-2 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">📱</div>
              <p className="text-xs text-text-tertiary">QR Code</p>
            </div>
          </div>
        </div>

        {/* Account name */}
        <p className="text-center text-sm text-text-secondary mb-2">
          {activeAccount.name || activeAccount.label || 'Account 1'}
        </p>
      </Card>

      {/* Address display */}
      <Card variant="default" className="p-4 mb-6">
        <p className="text-xs text-text-secondary mb-2">Your Address</p>
        <p className="text-sm text-text-primary font-mono break-all">
          {activeAccount.address}
        </p>
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3 mb-6">
        <Button
          variant="primary"
          className="flex-1"
          onClick={handleCopy}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Address
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Warning */}
      <Card variant="default" className="p-3 bg-yellow-500/10 border-yellow-500/30">
        <p className="text-xs text-yellow-400">
          ⚠️ Only send Dogecoin (DOGE) to this address. Sending other assets may result in permanent loss.
        </p>
      </Card>

      {/* Back button */}
      <div className="mt-auto pt-4">
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setView('dashboard')}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default ReceivePage;
