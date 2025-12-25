// ============================================
// Dogendary Wallet - Debug Page
// Diagnostic component for testing
// ============================================
// 
// USAGE: Import this in App.tsx temporarily for debugging
// Add to the switch statement: case 'debug': return <DebugPage />;
// Then set view to 'debug' to see this page
// 
// OR: Add a hidden keyboard shortcut to show debug:
// useEffect(() => {
//   const handler = (e) => {
//     if (e.ctrlKey && e.shiftKey && e.key === 'D') {
//       setView('debug');
//     }
//   };
//   window.addEventListener('keydown', handler);
//   return () => window.removeEventListener('keydown', handler);
// }, []);
// ============================================

import React, { useState, useEffect } from 'react';
import { useWalletStore } from '../hooks/useWalletStore';
import { Button } from '../components/ui/Button';
import browser from 'webextension-polyfill';

interface StorageData {
  vault: unknown;
  settings: unknown;
  connections: unknown;
  session: unknown;
}

export function DebugPage(): React.ReactElement {
  const store = useWalletStore();
  const [storageData, setStorageData] = useState<StorageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch storage data
  const fetchStorageData = async () => {
    try {
      const local = await browser.storage.local.get(null);
      let session = {};
      try {
        session = await browser.storage.session.get(null);
      } catch (e) {
        session = { error: 'Session storage not available' };
      }
      
      setStorageData({
        vault: local.dogendary_vault || null,
        settings: local.dogendary_settings || null,
        connections: local.dogendary_connections || null,
        session,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch storage');
    }
  };

  // Clear all storage (DANGER!)
  const clearAllStorage = async () => {
    if (!confirm('This will DELETE all wallet data. Are you sure?')) return;
    if (!confirm('REALLY sure? This cannot be undone!')) return;
    
    try {
      await browser.storage.local.clear();
      try {
        await browser.storage.session.clear();
      } catch (e) {
        // Session might not be available
      }
      alert('Storage cleared. Refresh the extension.');
      fetchStorageData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to clear storage');
    }
  };

  // Manually trigger initialization
  const triggerInitialize = async () => {
    try {
      await store.initialize();
      alert('Initialization complete');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Initialization failed');
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchStorageData();
  }, []);

  return (
    <div className="flex flex-col h-full p-4 bg-bg-primary overflow-y-auto">
      <h1 className="text-xl font-bold text-text-primary mb-4">
        🔧 Debug Panel
      </h1>
      
      {/* Store State */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-neon-cyan mb-2">
          Zustand Store State
        </h2>
        <pre className="text-xs text-text-secondary bg-surface-1 p-3 rounded-lg overflow-x-auto">
          {JSON.stringify({
            isInitialized: store.isInitialized,
            isLocked: store.isLocked,
            currentView: store.currentView,
            accountCount: store.accounts.length,
            activeAccountId: store.activeAccountId,
            network: store.network,
          }, null, 2)}
        </pre>
      </section>
      
      {/* Storage Data */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-neon-cyan">
            Chrome Storage
          </h2>
          <Button
            onClick={fetchStorageData}
            className="text-xs px-2 py-1"
          >
            Refresh
          </Button>
        </div>
        
        {storageData && (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-text-tertiary mb-1">Vault exists:</p>
              <p className={`text-sm font-mono ${
                storageData.vault ? 'text-neon-green' : 'text-neon-orange'
              }`}>
                {storageData.vault ? 'YES' : 'NO'}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-text-tertiary mb-1">Vault data (truncated):</p>
              <pre className="text-xs text-text-secondary bg-surface-1 p-2 rounded overflow-x-auto">
                {JSON.stringify(
                  storageData.vault 
                    ? { 
                        ...storageData.vault as object, 
                        data: (storageData.vault as { data?: string }).data?.slice(0, 50) + '...' 
                      }
                    : null, 
                  null, 
                  2
                )}
              </pre>
            </div>
            
            <div>
              <p className="text-xs text-text-tertiary mb-1">Session storage:</p>
              <pre className="text-xs text-text-secondary bg-surface-1 p-2 rounded overflow-x-auto">
                {JSON.stringify(storageData.session, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </section>
      
      {/* Routing Logic */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-neon-cyan mb-2">
          Expected Routing
        </h2>
        <div className="text-xs text-text-secondary space-y-1">
          <p>
            <span className="text-text-tertiary">If vault exists:</span>{' '}
            {storageData?.vault ? 'YES' : 'NO'}
          </p>
          <p>
            <span className="text-text-tertiary">isInitialized should be:</span>{' '}
            <span className={storageData?.vault ? 'text-neon-green' : 'text-neon-orange'}>
              {storageData?.vault ? 'true' : 'false'}
            </span>
          </p>
          <p>
            <span className="text-text-tertiary">Expected view:</span>{' '}
            <span className="text-neon-cyan">
              {!storageData?.vault 
                ? 'welcome' 
                : store.isLocked 
                  ? 'unlock' 
                  : 'dashboard'}
            </span>
          </p>
          <p>
            <span className="text-text-tertiary">Actual view:</span>{' '}
            <span className={
              store.currentView === (!storageData?.vault ? 'welcome' : store.isLocked ? 'unlock' : 'dashboard')
                ? 'text-neon-green'
                : 'text-neon-orange'
            }>
              {store.currentView}
            </span>
          </p>
        </div>
      </section>
      
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-neon-orange/10 border border-neon-orange/30 rounded-lg">
          <p className="text-sm text-neon-orange">{error}</p>
        </div>
      )}
      
      {/* Actions */}
      <section className="mt-auto space-y-2">
        <h2 className="text-sm font-semibold text-neon-cyan mb-2">
          Debug Actions
        </h2>
        
        <Button
          onClick={triggerInitialize}
          className="w-full py-2 text-sm"
        >
          Re-initialize Store
        </Button>
        
        <Button
          onClick={() => store.setView('welcome')}
          variant="outline"
          className="w-full py-2 text-sm"
        >
          Force → Welcome
        </Button>
        
        <Button
          onClick={() => store.setView('unlock')}
          variant="outline"
          className="w-full py-2 text-sm"
        >
          Force → Unlock
        </Button>
        
        <Button
          onClick={() => store.setView('dashboard')}
          variant="outline"
          className="w-full py-2 text-sm"
        >
          Force → Dashboard
        </Button>
        
        <Button
          onClick={clearAllStorage}
          variant="outline"
          className="w-full py-2 text-sm text-neon-orange border-neon-orange/30 hover:bg-neon-orange/10"
        >
          ⚠️ Clear All Storage
        </Button>
      </section>
    </div>
  );
}

export default DebugPage;
