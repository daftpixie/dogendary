// ============================================
// Dogendary Wallet - Welcome Page
// Initial landing page for new/returning users
// ============================================

import React from 'react';
import { Wallet, Download, Key } from 'lucide-react';
import { useWalletStore } from '../hooks/useWalletStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const WelcomePage: React.FC = () => {
  const { setView } = useWalletStore();

  return (
    <div className="flex flex-col h-full p-6">
      {/* Logo and title */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Animated logo */}
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-2xl opacity-50 blur-xl animate-pulse" />
          <div className="relative w-full h-full bg-gradient-to-br from-neon-cyan to-neon-purple rounded-2xl flex items-center justify-center">
            <Wallet className="w-12 h-12 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Dogendary Wallet
        </h1>
        <p className="text-text-secondary mb-8 max-w-xs">
          Your gateway to Dogecoin inscriptions, DRC-20 tokens, and more.
        </p>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-3 mb-8 w-full max-w-xs">
          <Card variant="chrome" padding="sm" className="text-center">
            <div className="text-neon-cyan mb-1">🐕</div>
            <p className="text-xs text-text-secondary">Dogecoin</p>
          </Card>
          <Card variant="chrome" padding="sm" className="text-center">
            <div className="text-neon-purple mb-1">🖼️</div>
            <p className="text-xs text-text-secondary">Inscriptions</p>
          </Card>
          <Card variant="chrome" padding="sm" className="text-center">
            <div className="text-neon-green mb-1">🪙</div>
            <p className="text-xs text-text-secondary">DRC-20</p>
          </Card>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => setView('create')}
        >
          <Key className="w-5 h-5 mr-2" />
          Create New Wallet
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={() => setView('import')}
        >
          <Download className="w-5 h-5 mr-2" />
          Import Existing Wallet
        </Button>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-text-tertiary mt-6">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
};

export default WelcomePage;
