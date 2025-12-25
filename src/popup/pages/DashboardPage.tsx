// ============================================
// Dogendary Wallet - Dashboard Page (FIXED)
// Fixed: balance null check, selectActiveAccount export, activeAccount type
// ============================================

import React, { useEffect } from 'react';
import { Send, Download, Image, Coins, Clock, RefreshCw } from 'lucide-react';
import { useWalletStore, selectActiveAccount } from '../hooks/useWalletStore';
import type { WalletAccount } from '@/types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatDoge, formatRelativeTime, truncateAddress } from '@/lib/utils';

export const DashboardPage: React.FC = () => {
  const { 
    balance, 
    transactions,
    inscriptions,
    drc20Tokens,
    isLoadingBalance,
    setView,
    refreshData 
  } = useWalletStore();
  
  // FIX: Type activeAccount explicitly
  const activeAccount = useWalletStore(selectActiveAccount) as WalletAccount | null;

  // Refresh data on mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // FIX: Add null check for balance
  const dogeBalance = balance ? balance.total / 100000000 : 0;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Balance Card */}
      <Card variant="chrome" className="m-4 p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-sm text-text-secondary">Total Balance</span>
          {isLoadingBalance && (
            <RefreshCw className="w-3 h-3 text-text-tertiary animate-spin" />
          )}
        </div>
        <h2 className="text-3xl font-bold text-text-primary mb-1">
          {dogeBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
        </h2>
        <p className="text-neon-cyan font-medium">DOGE</p>
        
        {/* FIX: activeAccount is now properly typed */}
        {activeAccount && (
          <p className="text-xs text-text-tertiary mt-3">
            {truncateAddress(activeAccount.address, 8, 8)}
          </p>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2 px-4 mb-6">
        <Button
          variant="ghost"
          className="flex flex-col items-center gap-1 h-auto py-3"
          onClick={() => setView('send')}
        >
          <Send className="w-5 h-5 text-neon-cyan" />
          <span className="text-xs">Send</span>
        </Button>
        <Button
          variant="ghost"
          className="flex flex-col items-center gap-1 h-auto py-3"
          onClick={() => setView('receive')}
        >
          <Download className="w-5 h-5 text-neon-green" />
          <span className="text-xs">Receive</span>
        </Button>
        <Button
          variant="ghost"
          className="flex flex-col items-center gap-1 h-auto py-3"
          onClick={() => setView('inscriptions')}
        >
          <Image className="w-5 h-5 text-neon-purple" />
          <span className="text-xs">NFTs</span>
        </Button>
        <Button
          variant="ghost"
          className="flex flex-col items-center gap-1 h-auto py-3"
          onClick={() => setView('tokens')}
        >
          <Coins className="w-5 h-5 text-neon-orange" />
          <span className="text-xs">Tokens</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 mb-6">
        <Card variant="default" padding="sm" className="text-center">
          <p className="text-lg font-bold text-neon-purple">{inscriptions.length}</p>
          <p className="text-xs text-text-secondary">Inscriptions</p>
        </Card>
        <Card variant="default" padding="sm" className="text-center">
          <p className="text-lg font-bold text-neon-orange">{drc20Tokens.length}</p>
          <p className="text-xs text-text-secondary">Tokens</p>
        </Card>
        <Card variant="default" padding="sm" className="text-center">
          <p className="text-lg font-bold text-neon-cyan">{transactions.length}</p>
          <p className="text-xs text-text-secondary">Transactions</p>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div className="flex-1 px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-text-primary">Recent Activity</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('transactions')}
          >
            View All
          </Button>
        </div>

        <div className="space-y-2">
          {transactions.slice(0, 5).map((tx) => (
            <Card key={tx.txid || tx.id} variant="default" padding="sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.type === 'receive' 
                      ? 'bg-neon-green/10 text-neon-green' 
                      : 'bg-neon-cyan/10 text-neon-cyan'
                  }`}>
                    {tx.type === 'receive' ? <Download className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {tx.type === 'receive' ? 'Received' : 'Sent'}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {formatRelativeTime(tx.timestamp)}
                    </p>
                  </div>
                </div>
                <p className={`text-sm font-medium ${
                  tx.type === 'receive' ? 'text-neon-green' : 'text-text-primary'
                }`}>
                  {tx.type === 'receive' ? '+' : '-'}{formatDoge(tx.amount)} DOGE
                </p>
              </div>
            </Card>
          ))}

          {transactions.length === 0 && (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-text-secondary">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
