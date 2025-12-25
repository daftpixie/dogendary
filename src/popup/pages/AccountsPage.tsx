// ============================================
// Dogendary Wallet - Accounts Page (FIXED)
// Fixed: setActiveAccount expects accountId (string), not index (number)
// ============================================

import React from 'react';
import { Plus, Check } from 'lucide-react';
import { useWalletStore } from '../hooks/useWalletStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { truncateAddress, formatDoge } from '@/lib/utils';

export const AccountsPage: React.FC = () => {
  const { 
    accounts, 
    activeAccountIndex, 
    setActiveAccount, 
    setView, 
    addToast,
    addAccount,
  } = useWalletStore();

  // FIX: Pass account.id (string) instead of index (number)
  const handleSelectAccount = (accountId: string, accountName: string) => {
    setActiveAccount(accountId);
    addToast({ type: 'success', message: `Switched to ${accountName}` });
    setView('dashboard');
  };

  const handleAddAccount = async () => {
    addToast({ type: 'info', message: 'Adding new account...' });
    await addAccount();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-surface-3">
        <h1 className="text-lg font-bold text-text-primary">Accounts</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddAccount}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Accounts list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {accounts.map((account, index) => {
          const displayName = account.name || account.label || `Account ${index + 1}`;
          return (
            <Card
              key={account.id || account.address}
              variant={index === activeAccountIndex ? 'chrome' : 'default'}
              hover
              className="cursor-pointer"
              onClick={() => handleSelectAccount(account.id, displayName)}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-white font-bold">
                  {displayName[0]}
                </div>

                {/* Account info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary">
                      {displayName}
                    </span>
                    {index === activeAccountIndex && (
                      <Check className="w-4 h-4 text-neon-cyan" />
                    )}
                  </div>
                  <p className="text-sm text-text-secondary truncate">
                    {truncateAddress(account.address, 8, 6)}
                  </p>
                </div>

                {/* Balance */}
                <div className="text-right">
                  <p className="text-sm font-medium text-text-primary">
                    {formatDoge(account.balance?.total || 0)} DOGE
                  </p>
                </div>
              </div>
            </Card>
          );
        })}

        {accounts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-text-secondary">No accounts yet</p>
          </div>
        )}
      </div>

      {/* Back button */}
      <div className="p-4 border-t border-surface-3">
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => setView('dashboard')}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default AccountsPage;
