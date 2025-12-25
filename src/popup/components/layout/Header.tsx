// ============================================
// Dogendary Wallet - Header Component (FIXED)
// Fixed: balance null check
// ============================================

import React from 'react';
import { Lock, Settings, User } from 'lucide-react';
import { useWalletStore, selectActiveAccount } from '@/popup/hooks/useWalletStore';
import { truncateAddress } from '@/lib/utils';

export const Header: React.FC = () => {
  const { lockWallet, setView, balance } = useWalletStore();
  const activeAccount = useWalletStore(selectActiveAccount);

  const handleLock = () => {
    lockWallet();
    setView('unlock');
  };

  const handleSettings = () => {
    setView('settings');
  };

  const handleAccount = () => {
    setView('accounts');
  };

  // FIX: Add null check for balance
  const displayBalance = balance ? (balance.total / 100000000).toFixed(4) : '0.0000';

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-surface-3 bg-surface-1/80 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
          <span className="text-lg font-bold text-white">D</span>
        </div>
        <div>
          <h1 className="text-sm font-bold text-text-primary">Dogendary</h1>
          <p className="text-xs text-neon-cyan">
            {displayBalance} DOGE
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {activeAccount && (
          <button
            onClick={handleAccount}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-surface-2 transition-colors"
          >
            <User className="w-4 h-4 text-text-secondary" />
            <span className="text-xs text-text-secondary">
              {truncateAddress(activeAccount.address, 4, 4)}
            </span>
          </button>
        )}

        <button
          onClick={handleSettings}
          className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4 text-text-secondary" />
        </button>

        <button
          onClick={handleLock}
          className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
          aria-label="Lock wallet"
        >
          <Lock className="w-4 h-4 text-text-secondary" />
        </button>
      </div>
    </header>
  );
};

export default Header;
