/**
 * Import Wallet Page - Import existing wallet from mnemonic
 */

import React, { useState, useCallback } from 'react';
import { useWalletStore } from '../hooks/useWalletStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { validatePasswordStrength } from '@/lib/crypto';
import { DogecoinHDWallet } from '@/lib/wallet-core';

export const ImportWalletPage: React.FC = () => {
  const { importWallet, setView, isLoading, addToast } = useWalletStore();
  
  // Form state
  const [step, setStep] = useState<'mnemonic' | 'password'>('mnemonic');
  const [mnemonicInput, setMnemonicInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Validation
  const mnemonicWords = mnemonicInput.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const isValidMnemonic = mnemonicWords.length === 12 && DogecoinHDWallet.validateMnemonic(mnemonicWords.join(' '));
  const passwordStrength = validatePasswordStrength(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  // Handle mnemonic step
  const handleMnemonicSubmit = () => {
    if (!isValidMnemonic) {
      addToast({ type: 'error', message: 'Invalid recovery phrase. Please check and try again.' });
      return;
    }
    setStep('password');
  };

  // Handle import
  const handleImport = useCallback(async () => {
    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      addToast({ type: 'error', message: 'Password is not strong enough' });
      return;
    }

    if (!passwordsMatch) {
      addToast({ type: 'error', message: 'Passwords do not match' });
      return;
    }

    try {
      const success = await importWallet(mnemonicWords.join(' '), password);
      if (success) {
        addToast({ type: 'success', message: 'Wallet imported successfully!' });
        setView('dashboard');
      }
    } catch (error) {
      addToast({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to import wallet' 
      });
    }
  }, [mnemonicWords, password, passwordsMatch, importWallet, addToast, setView]);

  // Get password strength color
  const getStrengthColor = () => {
    if (passwordStrength.score < 3) return 'bg-red-500';
    if (passwordStrength.score < 5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Render mnemonic input step
  const renderMnemonicStep = () => (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary mb-2">Import Recovery Phrase</h2>
        <p className="text-sm text-text-secondary">
          Enter your 12-word recovery phrase to restore your wallet.
        </p>
      </div>

      <Card variant="chrome" className="p-4 mb-4">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Recovery Phrase
        </label>
        <textarea
          value={mnemonicInput}
          onChange={(e) => setMnemonicInput(e.target.value)}
          placeholder="Enter your 12 words separated by spaces..."
          className="w-full h-32 px-4 py-3 bg-surface-2 border border-surface-3 rounded-lg text-text-primary placeholder-text-tertiary resize-none focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/30"
        />
        
        {/* Word count indicator */}
        <div className="flex items-center justify-between mt-2">
          <span className={`text-sm ${mnemonicWords.length === 12 ? 'text-green-400' : 'text-text-tertiary'}`}>
            {mnemonicWords.length}/12 words
          </span>
          {mnemonicWords.length === 12 && !isValidMnemonic && (
            <span className="text-sm text-red-400">Invalid phrase</span>
          )}
          {isValidMnemonic && (
            <span className="text-sm text-green-400">✓ Valid</span>
          )}
        </div>
      </Card>

      <div className="p-3 bg-surface-2 border border-surface-3 rounded-lg mb-4">
        <p className="text-sm text-text-secondary">
          💡 Tip: You can paste your entire recovery phrase at once, or type each word separated by spaces.
        </p>
      </div>

      <div className="mt-auto flex gap-3">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => setView('unlock')}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          disabled={!isValidMnemonic}
          onClick={handleMnemonicSubmit}
        >
          Continue
        </Button>
      </div>
    </>
  );

  // Render password step
  const renderPasswordStep = () => (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary mb-2">Set Password</h2>
        <p className="text-sm text-text-secondary">
          Create a password to encrypt your wallet on this device.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter a strong password"
          />
          
          {/* Password strength indicator */}
          <div className="mt-2">
            <div className="flex gap-1 h-1">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded ${
                    i < passwordStrength.score ? getStrengthColor() : 'bg-surface-3'
                  }`}
                />
              ))}
            </div>
            {passwordStrength.feedback.length > 0 && (
              <p className="text-xs text-text-tertiary mt-1">
                {passwordStrength.feedback[0]}
              </p>
            )}
          </div>
        </div>

        <Input
          type="password"
          label="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          error={confirmPassword && !passwordsMatch ? 'Passwords do not match' : undefined}
        />
      </div>

      <div className="mt-6 flex gap-3">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => setStep('mnemonic')}
        >
          Back
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          disabled={!passwordsMatch || !passwordStrength.isValid || isLoading}
          onClick={handleImport}
          isLoading={isLoading}
        >
          Import Wallet
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-full p-4">
      {/* Progress indicator */}
      <div className="flex gap-2 mb-6">
        <div className={`flex-1 h-1 rounded bg-neon-cyan`} />
        <div className={`flex-1 h-1 rounded ${step === 'password' ? 'bg-neon-cyan' : 'bg-surface-3'}`} />
      </div>

      {/* Step content */}
      {step === 'mnemonic' && renderMnemonicStep()}
      {step === 'password' && renderPasswordStep()}
    </div>
  );
};

export default ImportWalletPage;
