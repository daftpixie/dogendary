// ============================================
// Dogendary Wallet - Transactions Page
// Transaction history with filtering
// ============================================

import React, { useState, useEffect } from 'react';
import { Send, Download, ExternalLink, RefreshCw, Filter } from 'lucide-react';
import { useWalletStore, selectActiveAccount } from '../hooks/useWalletStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatDoge, formatRelativeTime } from '@/lib/utils';
import type { TransactionRecord } from '@/types';

// Transaction row component
const TransactionRow: React.FC<{
  tx: TransactionRecord;
  address: string;
  onClick: () => void;
}> = ({ tx, address, onClick }) => {
  const isReceive = tx.type === 'receive' || tx.to === address;
  
  return (
    <Card 
      variant="chrome" 
      padding="sm" 
      hover 
      className="cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isReceive ? 'bg-neon-green/20' : 'bg-neon-orange/20'
        }`}>
          {isReceive ? (
            <Download className="w-5 h-5 text-neon-green" />
          ) : (
            <Send className="w-5 h-5 text-neon-orange" />
          )}
        </div>
        
        {/* Transaction info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary capitalize">
              {tx.type}
            </span>
            <Badge
              variant={tx.status === 'confirmed' ? 'success' : tx.status === 'pending' ? 'warning' : 'error'}
              size="sm"
            >
              {tx.status}
            </Badge>
          </div>
          <p className="text-xs text-text-secondary">
            {formatRelativeTime(tx.timestamp)}
          </p>
        </div>
        
        {/* Amount */}
        <div className="text-right">
          <p className={`font-medium ${isReceive ? 'text-neon-green' : 'text-text-primary'}`}>
            {isReceive ? '+' : '-'}{formatDoge(tx.amount)}
          </p>
          <p className="text-xs text-text-secondary">DOGE</p>
        </div>
      </div>
    </Card>
  );
};

// Transaction detail modal
const TransactionDetail: React.FC<{
  tx: TransactionRecord;
  onClose: () => void;
}> = ({ tx, onClose }) => {
  const txid = tx.txid || tx.id;
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card variant="chrome" className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary capitalize">
            {tx.type} Transaction
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-text-secondary">Amount</span>
            <span className="font-medium text-text-primary">
              {formatDoge(tx.amount)} DOGE
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-text-secondary">Fee</span>
            <span className="text-text-primary">
              {tx.fee ? formatDoge(tx.fee) : '0'} DOGE
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-text-secondary">Status</span>
            <Badge
              variant={tx.status === 'confirmed' ? 'success' : tx.status === 'pending' ? 'warning' : 'error'}
            >
              {tx.status} {tx.confirmations > 0 && `(${tx.confirmations} confirmations)`}
            </Badge>
          </div>
          
          <div>
            <p className="text-text-secondary text-sm mb-1">From</p>
            <p className="text-text-primary text-sm font-mono break-all">
              {tx.from}
            </p>
          </div>
          
          <div>
            <p className="text-text-secondary text-sm mb-1">To</p>
            <p className="text-text-primary text-sm font-mono break-all">
              {tx.to}
            </p>
          </div>
          
          <div>
            <p className="text-text-secondary text-sm mb-1">Transaction ID</p>
            <p className="text-text-primary text-sm font-mono break-all">
              {txid}
            </p>
          </div>
          
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => window.open(`https://dogechain.info/tx/${txid}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Explorer
          </Button>
        </div>
      </Card>
    </div>
  );
};

export const TransactionsPage: React.FC = () => {
  const { 
    transactions, 
    isLoadingTransactions, 
    refreshTransactions,
    setView 
  } = useWalletStore();
  
  const activeAccount = useWalletStore(selectActiveAccount);
  const [filter, setFilter] = useState<'all' | 'send' | 'receive'>('all');
  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);

  // Refresh on mount
  useEffect(() => {
    refreshTransactions();
  }, [refreshTransactions]);

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'receive') {
      return tx.type === 'receive' || tx.to === activeAccount?.address;
    }
    return tx.type === 'send' || tx.from === activeAccount?.address;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-surface-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-text-primary">
            Transactions
            <span className="ml-2 text-sm text-text-secondary">
              ({transactions.length})
            </span>
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshTransactions}
            disabled={isLoadingTransactions}
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingTransactions ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {/* Filter tabs */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'send' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('send')}
          >
            <Send className="w-3 h-3 mr-1" />
            Sent
          </Button>
          <Button
            variant={filter === 'receive' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter('receive')}
          >
            <Download className="w-3 h-3 mr-1" />
            Received
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoadingTransactions ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neon-cyan" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <Card variant="default" className="p-8 text-center">
            <Filter className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-secondary">
              {filter === 'all' 
                ? 'No transactions yet' 
                : `No ${filter} transactions`}
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((tx) => (
              <TransactionRow
                key={tx.txid || tx.id}
                tx={tx}
                address={activeAccount?.address || ''}
                onClick={() => setSelectedTx(tx)}
              />
            ))}
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

      {/* Detail modal */}
      {selectedTx && (
        <TransactionDetail
          tx={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
};

export default TransactionsPage;
