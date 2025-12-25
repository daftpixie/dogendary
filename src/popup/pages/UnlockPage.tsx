// ============================================
// Dogendary Wallet - Unlock Page (FIXED)
// Password entry to unlock existing wallet
// ============================================
// 
// FIX: Added working "Restore with recovery phrase" link
// that navigates to import-wallet page
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { useWalletStore } from '../hooks/useWalletStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  Eye, 
  EyeOff, 
  ArrowRight,
  Wallet,
  AlertCircle
} from 'lucide-react';

export function UnlockPage(): React.ReactElement {
  const { unlockWallet, setView, isLoading } = useWalletStore();
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus password input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    const success = await unlockWallet(password);
    
    if (!success) {
      setAttempts(prev => prev + 1);
      setError('Incorrect password');
      setPassword('');
      
      // Focus input after failed attempt
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Handle "forgot password" - redirect to import
  const handleForgotPassword = () => {
    setView('import-wallet');
  };

  return (
    <div className="flex flex-col h-full p-6 bg-gradient-to-b from-bg-primary to-bg-deepest">
      {/* Logo Section */}
      <div className="flex flex-col items-center pt-12 pb-8">
        {/* Wallet Icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-neon-cyan/20 blur-xl rounded-full" />
          <div className="relative w-16 h-16 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 rounded-2xl flex items-center justify-center border border-neon-cyan/30">
            <Wallet className="w-8 h-8 text-neon-cyan" />
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-2xl font-display font-bold text-text-primary mb-2">
          Welcome Back
        </h1>
        <p className="text-sm text-text-secondary text-center">
          Enter your password to unlock your wallet
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        {/* Password Input */}
        <div className="space-y-4">
          <div className="relative">
            <Input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full pr-12 ${error ? 'border-neon-orange' : ''}`}
              disabled={isLoading}
              aria-label="Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-neon-orange text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
              {attempts >= 3 && (
                <span className="text-text-tertiary ml-auto">
                  ({attempts} attempts)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <Button
            type="submit"
            disabled={isLoading || !password}
            className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-neon-cyan to-neon-blue hover:from-neon-cyan/90 hover:to-neon-blue/90 text-bg-primary rounded-xl flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-bg-primary border-t-transparent" />
                Unlocking...
              </>
            ) : (
              <>
                Unlock Wallet
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>

        {/* Forgot Password / Restore Link */}
        <div className="mt-auto pt-8 pb-4 text-center">
          <p className="text-sm text-text-tertiary">
            Forgot your password?{' '}
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-neon-cyan hover:text-neon-cyan/80 underline underline-offset-2 transition-colors"
            >
              Restore with recovery phrase
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}

export default UnlockPage;
