/**
 * Create Wallet Page - Create a new wallet with password
 */

import React, { useState, useCallback } from 'react';
import { useWalletStore } from '../hooks/useWalletStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { validatePasswordStrength } from '@/lib/crypto';

type Step = 'password' | 'mnemonic' | 'verify';

export const CreateWalletPage: React.FC = () => {
  const { createWallet, setView, isLoading, addToast } = useWalletStore();
  
  // Form state
  const [step, setStep] = useState<Step>('password');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [verifyWords, setVerifyWords] = useState<{ index: number; word: string }[]>([]);
  const [verifyInputs, setVerifyInputs] = useState<Record<number, string>>({});
  const [showMnemonic, setShowMnemonic] = useState(false);

  // Password validation
  const passwordStrength = validatePasswordStrength(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  // Handle password step submission
  const handlePasswordSubmit = useCallback(async () => {
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
      const words = await createWallet(password);
      setMnemonic(words);
      
      // Select 3 random words to verify
      const indices = new Set<number>();
      while (indices.size < 3) {
        indices.add(Math.floor(Math.random() * 12));
      }
      setVerifyWords(
        Array.from(indices).map(i => ({ index: i, word: words[i] }))
      );
      
      setStep('mnemonic');
    } catch (error) {
      addToast({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to create wallet' 
      });
    }
  }, [password, passwordsMatch, createWallet, addToast]);

  // Handle mnemonic backup confirmation
  const handleMnemonicConfirm = () => {
    setShowMnemonic(false);
    setStep('verify');
  };

  // Handle verification step
  const handleVerify = () => {
    const correct = verifyWords.every(
      ({ index, word }) => verifyInputs[index]?.toLowerCase().trim() === word.toLowerCase()
    );

    if (correct) {
      addToast({ type: 'success', message: 'Wallet created successfully!' });
      setView('dashboard');
    } else {
      addToast({ type: 'error', message: 'Verification failed. Please check your backup.' });
    }
  };

  // Get password strength color
  const getStrengthColor = () => {
    if (passwordStrength.score < 3) return 'bg-red-500';
    if (passwordStrength.score < 5) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Render password step
  const renderPasswordStep = () => (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary mb-2">Create Password</h2>
        <p className="text-sm text-text-secondary">
          This password will encrypt your wallet. Make sure it's strong and memorable.
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
          onClick={() => setView('unlock')}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          disabled={!passwordsMatch || !passwordStrength.isValid || isLoading}
          onClick={handlePasswordSubmit}
          isLoading={isLoading}
        >
          Create Wallet
        </Button>
      </div>
    </>
  );

  // Render mnemonic backup step
  const renderMnemonicStep = () => (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary mb-2">Backup Recovery Phrase</h2>
        <p className="text-sm text-text-secondary">
          Write down these 12 words in order and keep them safe. This is the only way to recover your wallet.
        </p>
      </div>

      <Card variant="chrome" className="p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-text-secondary">Recovery Phrase</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMnemonic(!showMnemonic)}
          >
            {showMnemonic ? 'Hide' : 'Show'}
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {mnemonic.map((word, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 bg-surface-2 rounded text-sm"
            >
              <span className="text-text-tertiary w-5">{i + 1}.</span>
              <span className={`text-text-primary ${showMnemonic ? '' : 'blur-sm'}`}>
                {word}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-4">
        <p className="text-sm text-yellow-400">
          ⚠️ Never share your recovery phrase with anyone. Anyone with this phrase can access your funds.
        </p>
      </div>

      <Button
        variant="primary"
        className="w-full"
        onClick={handleMnemonicConfirm}
      >
        I've Saved My Recovery Phrase
      </Button>
    </>
  );

  // Render verification step
  const renderVerifyStep = () => (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary mb-2">Verify Recovery Phrase</h2>
        <p className="text-sm text-text-secondary">
          Enter the requested words from your recovery phrase to confirm you've saved it.
        </p>
      </div>

      <div className="space-y-4">
        {verifyWords.map(({ index }) => (
          <Input
            key={index}
            label={`Word #${index + 1}`}
            value={verifyInputs[index] || ''}
            onChange={(e) => setVerifyInputs(prev => ({
              ...prev,
              [index]: e.target.value
            }))}
            placeholder={`Enter word #${index + 1}`}
          />
        ))}
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
          onClick={handleVerify}
          disabled={verifyWords.some(({ index }) => !verifyInputs[index])}
        >
          Verify & Finish
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-full p-4">
      {/* Progress indicator */}
      <div className="flex gap-2 mb-6">
        {(['password', 'mnemonic', 'verify'] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded ${
              i <= ['password', 'mnemonic', 'verify'].indexOf(step)
                ? 'bg-neon-cyan'
                : 'bg-surface-3'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      {step === 'password' && renderPasswordStep()}
      {step === 'mnemonic' && renderMnemonicStep()}
      {step === 'verify' && renderVerifyStep()}
    </div>
  );
};

export default CreateWalletPage;
