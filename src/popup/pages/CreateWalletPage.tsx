// ============================================
// Dogendary Wallet - Create Wallet Page (FIXED)
// Fixed: Generate mnemonic first, then call createWallet(mnemonic, password)
// ============================================

import React, { useState, useCallback } from 'react';
import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
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

  // Handle password step submission - FIX: Generate mnemonic here
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
      // FIX: Generate mnemonic using @scure/bip39
      const mnemonicPhrase = bip39.generateMnemonic(wordlist);
      const words = mnemonicPhrase.split(' ');
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
        message: error instanceof Error ? error.message : 'Failed to generate mnemonic' 
      });
    }
  }, [password, passwordsMatch, addToast]);

  // Handle mnemonic backup confirmation
  const handleMnemonicConfirm = () => {
    setShowMnemonic(false);
    setStep('verify');
  };

  // Handle verification step - FIX: Call createWallet with mnemonic AND password
  const handleVerify = async () => {
    const correct = verifyWords.every(
      ({ index, word }) => verifyInputs[index]?.toLowerCase().trim() === word.toLowerCase()
    );

    if (correct) {
      // FIX: Now call createWallet with both mnemonic and password
      const success = await createWallet(mnemonic.join(' '), password);
      if (success) {
        addToast({ type: 'success', message: 'Wallet created successfully!' });
        setView('dashboard');
      }
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
          
          {password && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded ${
                      level <= passwordStrength.score
                        ? getStrengthColor()
                        : 'bg-surface-3'
                    }`}
                  />
                ))}
              </div>
              {passwordStrength.feedback.length > 0 && (
                <p className="text-xs text-text-tertiary">
                  {passwordStrength.feedback[0]}
                </p>
              )}
            </div>
          )}
        </div>

        <Input
          type="password"
          label="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          error={confirmPassword && !passwordsMatch ? 'Passwords do not match' : undefined}
          success={passwordsMatch}
        />
      </div>

      <div className="mt-6 space-y-3">
        <Button
          className="w-full"
          onClick={handlePasswordSubmit}
          disabled={!passwordStrength.isValid || !passwordsMatch}
          isLoading={isLoading}
        >
          Continue
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setView('welcome')}
        >
          Back
        </Button>
      </div>
    </>
  );

  // Render mnemonic step
  const renderMnemonicStep = () => (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary mb-2">Recovery Phrase</h2>
        <p className="text-sm text-text-secondary">
          Write down these 12 words in order. They are the only way to recover your wallet.
        </p>
      </div>

      <Card className="bg-surface-2 p-4 mb-4">
        <div className={`grid grid-cols-3 gap-2 ${showMnemonic ? '' : 'blur-sm'}`}>
          {mnemonic.map((word, index) => (
            <div key={index} className="flex items-center gap-2 py-1">
              <span className="text-xs text-text-tertiary w-5">{index + 1}.</span>
              <span className="text-sm text-text-primary">{word}</span>
            </div>
          ))}
        </div>
        {!showMnemonic && (
          <button
            onClick={() => setShowMnemonic(true)}
            className="absolute inset-0 flex items-center justify-center bg-surface-2/50"
          >
            <span className="text-sm text-neon-cyan">Click to reveal</span>
          </button>
        )}
      </Card>

      <div className="p-3 bg-neon-orange/10 border border-neon-orange/30 rounded-lg mb-6">
        <p className="text-xs text-neon-orange">
          ⚠️ Never share your recovery phrase. Anyone with these words can steal your funds.
        </p>
      </div>

      <div className="space-y-3">
        <Button
          className="w-full"
          onClick={handleMnemonicConfirm}
          disabled={!showMnemonic}
        >
          I've Written It Down
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setStep('password')}
        >
          Back
        </Button>
      </div>
    </>
  );

  // Render verify step
  const renderVerifyStep = () => (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary mb-2">Verify Backup</h2>
        <p className="text-sm text-text-secondary">
          Enter the following words from your recovery phrase to confirm you've saved it.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {verifyWords
          .sort((a, b) => a.index - b.index)
          .map(({ index }) => (
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

      <div className="space-y-3">
        <Button
          className="w-full"
          onClick={handleVerify}
          disabled={verifyWords.some(({ index }) => !verifyInputs[index])}
          isLoading={isLoading}
        >
          Verify & Create Wallet
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setStep('mnemonic')}
        >
          Back
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-full p-4">
      {/* Progress indicator */}
      <div className="flex gap-2 mb-6">
        {['password', 'mnemonic', 'verify'].map((s, index) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded ${
              ['password', 'mnemonic', 'verify'].indexOf(step) >= index
                ? 'bg-neon-cyan'
                : 'bg-surface-3'
            }`}
          />
        ))}
      </div>

      {step === 'password' && renderPasswordStep()}
      {step === 'mnemonic' && renderMnemonicStep()}
      {step === 'verify' && renderVerifyStep()}
    </div>
  );
};

export default CreateWalletPage;
