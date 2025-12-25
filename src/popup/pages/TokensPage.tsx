// ============================================
// Dogendary Wallet - Tokens Page
// Display DRC-20 and Dunes tokens
// ============================================

import React, { useState, useEffect } from 'react';
import { Coins, RefreshCw } from 'lucide-react';
import { useWalletStore } from '../hooks/useWalletStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import type { DRC20Token, DunesToken } from '@/types';
import { formatNumber } from '@/lib/utils';

// Token card component
const TokenCard: React.FC<{
  token: DRC20Token | DunesToken;
  type: 'drc20' | 'dunes';
}> = ({ token, type }) => {
  // Get token ticker/symbol
  const ticker = type === 'drc20' 
    ? (token as DRC20Token).tick 
    : (token as DunesToken).symbol || (token as DunesToken).tick;
  
  // Get balance
  let balance: number;
  if (type === 'drc20') {
    balance = parseFloat((token as DRC20Token).balance || '0');
  } else {
    const dunesToken = token as DunesToken;
    balance = typeof dunesToken.balance === 'object' 
      ? dunesToken.balance.total 
      : 0;
  }
  
  return (
    <Card variant="chrome" padding="sm" hover>
      <div className="flex items-center gap-3">
        {/* Token icon */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-orange to-neon-purple flex items-center justify-center text-white font-bold">
          {ticker?.[0]?.toUpperCase() || '?'}
        </div>
        
        {/* Token info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary">
              {ticker}
            </span>
            <Badge 
              variant={type === 'drc20' ? 'info' : 'purple'} 
              size="sm"
            >
              {type === 'drc20' ? 'DRC-20' : 'Dunes'}
            </Badge>
          </div>
          <p className="text-xs text-text-secondary">
            {type === 'drc20' ? 'Token' : (token as DunesToken).name || 'Dune'}
          </p>
        </div>
        
        {/* Balance */}
        <div className="text-right">
          <p className="font-medium text-text-primary">
            {formatNumber(balance)}
          </p>
          <p className="text-xs text-text-secondary">{ticker}</p>
        </div>
      </div>
    </Card>
  );
};

export const TokensPage: React.FC = () => {
  const { 
    drc20Tokens, 
    dunesTokens,
    isLoadingTokens, 
    refreshDRC20,
    setView 
  } = useWalletStore();
  
  const [activeTab, setActiveTab] = useState<'drc20' | 'dunes'>('drc20');

  // Refresh on mount
  useEffect(() => {
    refreshDRC20();
  }, [refreshDRC20]);

  const tokens = activeTab === 'drc20' ? drc20Tokens : dunesTokens;
  const totalTokens = drc20Tokens.length + dunesTokens.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-surface-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold text-text-primary">
            Tokens
            <span className="ml-2 text-sm text-text-secondary">
              ({totalTokens})
            </span>
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshDRC20}
            disabled={isLoadingTokens}
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingTokens ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'drc20' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('drc20')}
          >
            DRC-20
            {drc20Tokens.length > 0 && (
              <Badge variant="default" size="sm" className="ml-2">
                {drc20Tokens.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'dunes' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('dunes')}
          >
            Dunes
            {dunesTokens.length > 0 && (
              <Badge variant="default" size="sm" className="ml-2">
                {dunesTokens.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoadingTokens ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neon-cyan" />
          </div>
        ) : tokens.length === 0 ? (
          <Card variant="default" className="p-8 text-center">
            <Coins className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
            <p className="text-text-secondary">
              No {activeTab === 'drc20' ? 'DRC-20' : 'Dunes'} tokens yet
            </p>
            <p className="text-xs text-text-tertiary mt-2">
              {activeTab === 'drc20' 
                ? 'Tokens will appear here when you receive them' 
                : 'Dunes tokens will appear here when you receive them'}
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {activeTab === 'drc20' 
              ? drc20Tokens.map((token, index) => (
                  <TokenCard
                    key={`${token.tick}-${index}`}
                    token={token}
                    type="drc20"
                  />
                ))
              : dunesTokens.map((token, index) => (
                  <TokenCard
                    key={`${token.symbol}-${index}`}
                    token={token}
                    type="dunes"
                  />
                ))
            }
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

export default TokensPage;
