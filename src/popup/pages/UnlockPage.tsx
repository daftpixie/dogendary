// ============================================
// Dogendary Wallet - Unlock Page
// Password entry to unlock wallet
// ============================================

import React, { useState } from 'react';
import { Wallet, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useWalletStore } from '../hooks/useWalletStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const UnlockPage: React.FC = () => {
  const { unlockWallet, isLoading, addToast } = useWalletStore();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleUnlock = async () => {
    if (!password) {
      addToast({ type: 'error', message: 'Please enter your password' });
      return;
    }

    const success = await unlockWallet(password);
    if (!success) {
      addToast({ type: 'error', message: 'Invalid password' });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  return (
    <div className="flex flex-col h-full p-6">
      {/* Logo */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-2xl opacity-50 blur-lg animate-pulse" />
          <div className="relative w-full h-full bg-gradient-to-br from-neon-cyan to-neon-purple rounded-2xl flex items-center justify-center">
            <Wallet className="w-10 h-10 text-white" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-text-primary mb-2">
          Welcome Back
        </h1>
        <p className="text-sm text-text-secondary text-center mb-8">
          Enter your password to unlock your wallet
        </p>

        {/* Password input */}
        <Card variant="default" className="w-full p-4">
          <Input
            type={showPassword ? 'text' : 'password'}
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Enter your password"
            autoFocus
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-text-tertiary hover:text-text-secondary transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
          />
        </Card>
      </div>

      {/* Unlock button */}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleUnlock}
        disabled={!password || isLoading}
        isLoading={isLoading}
      >
        Unlock Wallet
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>

      {/* Forgot password hint */}
      <p className="text-center text-xs text-text-tertiary mt-4">
        Forgot your password?{' '}
        <button 
          className="text-neon-cyan hover:underline"
          onClick={() => {
            addToast({ 
              type: 'info', 
              message: 'Use your recovery phrase to restore your wallet' 
            });
          }}
        >
          Restore with recovery phrase
        </button>
      </p>
    </div>
  );
};

export default UnlockPage;
