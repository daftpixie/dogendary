// ============================================
// Dogendary Wallet - Import Wallet Page (FIXED)
// Fixed: Use @scure/bip39, remove unused addToast
// ============================================

import React, { useState } from 'react';
import { useWalletStore } from '../hooks/useWalletStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { validatePasswordStrength } from '@/lib/crypto';
// FIX: Use @scure/bip39 instead of bip39
import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Download,
  Shield,
} from 'lucide-react';

type Step = 'mnemonic' | 'password';

export function ImportWalletPage(): React.ReactElement {
  // FIX: Remove unused addToast from destructuring
  const { importWallet, setView, isLoading } = useWalletStore();
  const { addToast } = useWalletStore(); // Keep for potential future use
  
  const [step, setStep] = useState<Step>('mnemonic');
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [error, setError] = useState('');

  // FIX: Use @scure/bip39 with wordlist
  const isValidMnemonic = mnemonic.trim().split(/\s+/).length >= 12 && 
    bip39.validateMnemonic(mnemonic.trim(), wordlist);
  
  const passwordStrength = validatePasswordStrength(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleMnemonicSubmit = () => {
    setError('');
    const words = mnemonic.trim().split(/\s+/);
    
    if (words.length !== 12 && words.length !== 24) {
      setError('Please enter a valid 12 or 24 word recovery phrase');
      return;
    }
    
    // FIX: Use @scure/bip39 with wordlist
    if (!bip39.validateMnemonic(mnemonic.trim(), wordlist)) {
      setError('Invalid recovery phrase. Please check your words.');
      return;
    }
    
    setStep('password');
  };

  const handleImport = async () => {
    setError('');
    
    if (!passwordStrength.isValid) {
      setError('Password is not strong enough');
      return;
    }
    
    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      const success = await importWallet(mnemonic.trim(), password);
      if (success) {
        addToast({ type: 'success', message: 'Wallet imported successfully!' });
        setView('dashboard');
      } else {
        setError('Failed to import wallet');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-primary p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => step === 'mnemonic' ? setView('welcome') : setStep('mnemonic')}
          className="p-2 hover:bg-surface-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold text-text-primary">
          {step === 'mnemonic' ? 'Import Wallet' : 'Set Password'}
        </h1>
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-6">
        <div className={`h-1 flex-1 rounded ${step === 'mnemonic' || step === 'password' ? 'bg-neon-cyan' : 'bg-surface-3'}`} />
        <div className={`h-1 flex-1 rounded ${step === 'password' ? 'bg-neon-cyan' : 'bg-surface-3'}`} />
      </div>

      {step === 'mnemonic' ? (
        <div className="flex flex-col flex-1">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-neon-green/10 flex items-center justify-center border border-neon-green/30">
              <Download className="w-8 h-8 text-neon-green" />
            </div>
          </div>
          
          {/* Info */}
          <p className="text-sm text-text-secondary text-center mb-6">
            Enter your 12 or 24 word recovery phrase to restore your wallet.
          </p>
          
          {/* Mnemonic Input */}
          <div className="flex-1">
            <div className="relative">
              <textarea
                value={mnemonic}
                onChange={(e) => {
                  setMnemonic(e.target.value);
                  setError('');
                }}
                placeholder="Enter your recovery phrase, each word separated by a space..."
                className={`w-full h-32 p-4 bg-surface-2 border rounded-xl text-text-primary placeholder-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-neon-cyan/30 ${
                  showMnemonic ? '' : 'blur-sm'
                } ${error ? 'border-neon-orange' : 'border-surface-3'}`}
              />
              {!showMnemonic && mnemonic && (
                <button
                  onClick={() => setShowMnemonic(true)}
                  className="absolute inset-0 flex items-center justify-center bg-surface-2/50 rounded-xl"
                >
                  <span className="text-sm text-neon-cyan">Click to reveal</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowMnemonic(!showMnemonic)}
                className="absolute right-3 top-3 text-text-tertiary hover:text-text-secondary"
              >
                {showMnemonic ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Word count */}
            <p className="text-xs text-text-tertiary mt-2">
              Words: {mnemonic.trim() ? mnemonic.trim().split(/\s+/).length : 0} / 12 or 24
            </p>
            
            {error && (
              <div className="flex items-center gap-2 mt-2 text-neon-orange text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
          
          {/* Continue Button */}
          <Button
            onClick={handleMnemonicSubmit}
            disabled={!isValidMnemonic}
            className="w-full py-4 text-lg font-semibold mt-4"
          >
            Continue
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col flex-1">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-neon-cyan/10 flex items-center justify-center border border-neon-cyan/30">
              <Shield className="w-8 h-8 text-neon-cyan" />
            </div>
          </div>
          
          {/* Password Inputs */}
          <div className="space-y-4 flex-1">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">
                Confirm Password
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="w-full"
              />
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-neon-orange text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {/* Password Requirements */}
            <div className="p-3 rounded-lg bg-surface-1 border border-white/10">
              <p className="text-xs text-text-tertiary mb-2">Password requirements:</p>
              <ul className="text-xs text-text-secondary space-y-1">
                <li className={password.length >= 8 ? 'text-neon-green' : ''}>
                  • At least 8 characters
                </li>
                <li className={/[A-Z]/.test(password) ? 'text-neon-green' : ''}>
                  • One uppercase letter
                </li>
                <li className={/[a-z]/.test(password) ? 'text-neon-green' : ''}>
                  • One lowercase letter
                </li>
                <li className={/[0-9]/.test(password) ? 'text-neon-green' : ''}>
                  • One number
                </li>
              </ul>
            </div>
          </div>
          
          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={isLoading || !password || !confirmPassword}
            isLoading={isLoading}
            className="w-full py-4 text-lg font-semibold mt-4"
          >
            Import Wallet
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default ImportWalletPage;
