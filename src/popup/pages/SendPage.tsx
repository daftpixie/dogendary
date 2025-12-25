/**
 * Send Page - Send DOGE to another address
 * FIXED: balance null checks, sendTransaction return type handling
 */

import React, { useState } from 'react';
import { useWalletStore } from '../hooks/useWalletStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatNumber, isValidDogeAddress } from '@/lib/utils';

// Fee options
const FEE_OPTIONS = [
  { label: 'Slow', value: 0.01, description: '~30 min' },
  { label: 'Normal', value: 0.1, description: '~10 min' },
  { label: 'Fast', value: 1, description: '~1 min' }
];

export const SendPage: React.FC = () => {
  const { balance, sendTransaction, setView, isLoading, addToast } = useWalletStore();
  
  // Form state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedFee, setSelectedFee] = useState(FEE_OPTIONS[1].value);
  const [showConfirm, setShowConfirm] = useState(false);

  // FIX: Add null check for balance - default to 0 if null
  const balanceTotal = balance?.total ?? 0;

  // Validation
  const isValidAddress = recipient ? isValidDogeAddress(recipient) : true;
  const amountNum = parseFloat(amount) || 0;
  const totalAmount = amountNum + selectedFee;
  // FIX: Use balanceTotal (already null-checked)
  const hasEnoughBalance = balanceTotal >= totalAmount;
  const canSend = recipient && isValidAddress && amountNum > 0 && hasEnoughBalance;

  // Handle max amount
  const handleSetMax = () => {
    // FIX: Use balanceTotal (already null-checked)
    const maxAmount = Math.max(0, balanceTotal - selectedFee);
    setAmount(maxAmount.toFixed(8));
  };

  // Handle send
  const handleSend = async () => {
    if (!canSend) return;

    try {
      // FIX: sendTransaction returns { success: boolean; txid?: string; error?: string }
      const result = await sendTransaction(recipient, amountNum);
      if (result.success && result.txid) {
        addToast({
          type: 'success',
          message: `Transaction sent! TxID: ${result.txid.slice(0, 8)}...`
        });
        setView('dashboard');
      } else {
        addToast({
          type: 'error',
          message: result.error || 'Failed to send transaction'
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to send transaction'
      });
    }
  };

  // Confirmation view
  if (showConfirm) {
    return (
      <div className="flex flex-col h-full p-4">
        <h1 className="text-xl font-bold text-text-primary mb-6">Confirm Transaction</h1>
        
        <Card variant="chrome" className="p-4 space-y-4">
          <div className="flex justify-between">
            <span className="text-text-secondary">To</span>
            <span className="text-text-primary font-mono text-sm truncate max-w-[200px]">
              {recipient}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-text-secondary">Amount</span>
            <span className="text-text-primary font-bold">
              {formatNumber(amountNum)} DOGE
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-text-secondary">Network Fee</span>
            <span className="text-text-secondary">
              {formatNumber(selectedFee)} DOGE
            </span>
          </div>
          
          <div className="border-t border-surface-3 pt-4 flex justify-between">
            <span className="text-text-primary font-medium">Total</span>
            <span className="text-neon-cyan font-bold">
              {formatNumber(totalAmount)} DOGE
            </span>
          </div>
        </Card>

        <div className="mt-auto flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setShowConfirm(false)}
            disabled={isLoading}
          >
            Back
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleSend}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Confirm & Send'}
          </Button>
        </div>
      </div>
    );
  }

  // Main send form
  return (
    <div className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-text-primary">Send DOGE</h1>
        <Button variant="ghost" size="sm" onClick={() => setView('dashboard')}>
          Cancel
        </Button>
      </div>

      {/* Balance display */}
      <Card variant="chrome" className="p-4 mb-4">
        <div className="text-sm text-text-secondary">Available Balance</div>
        <div className="text-2xl font-bold text-text-primary">
          {/* FIX: Use balanceTotal (already null-checked) */}
          {formatNumber(balanceTotal)} DOGE
        </div>
      </Card>

      {/* Recipient input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Recipient Address
        </label>
        <Input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="D..."
          className={!isValidAddress ? 'border-red-500' : ''}
        />
        {!isValidAddress && (
          <p className="text-xs text-red-400 mt-1">Invalid Dogecoin address</p>
        )}
      </div>

      {/* Amount input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Amount
        </label>
        <div className="relative">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.00000001"
          />
          <button
            onClick={handleSetMax}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neon-cyan hover:text-neon-cyan/80"
          >
            MAX
          </button>
        </div>
        {!hasEnoughBalance && amountNum > 0 && (
          <p className="text-xs text-red-400 mt-1">Insufficient balance</p>
        )}
      </div>

      {/* Fee selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Network Fee
        </label>
        <div className="grid grid-cols-3 gap-2">
          {FEE_OPTIONS.map((fee) => (
            <button
              key={fee.label}
              onClick={() => setSelectedFee(fee.value)}
              className={`p-3 rounded-lg text-center transition-colors ${
                selectedFee === fee.value
                  ? 'bg-neon-cyan/20 border border-neon-cyan text-neon-cyan'
                  : 'bg-surface-2 border border-surface-3 text-text-secondary hover:border-neon-cyan/50'
              }`}
            >
              <div className="text-sm font-medium">{fee.label}</div>
              <div className="text-xs opacity-70">{fee.value} DOGE</div>
              <div className="text-xs opacity-50">{fee.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {amountNum > 0 && (
        <Card variant="chrome" className="p-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Total (Amount + Fee)</span>
            <span className="text-text-primary font-medium">
              {formatNumber(totalAmount)} DOGE
            </span>
          </div>
        </Card>
      )}

      {/* Submit button */}
      <Button
        variant="primary"
        className="mt-auto"
        disabled={!canSend || isLoading}
        onClick={() => setShowConfirm(true)}
      >
        Review Transaction
      </Button>
    </div>
  );
};

export default SendPage;
