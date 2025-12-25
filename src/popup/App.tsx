// ============================================
// Dogendary Wallet - App.tsx (FIXED)
// Main popup application with proper routing
// ============================================
// 
// FIX SUMMARY:
// 1. Properly calls initialize() on mount
// 2. Shows loading state during initialization
// 3. Routes based on wallet state:
//    - No vault exists → WelcomePage (create/import)
//    - Vault exists + locked → UnlockPage
//    - Vault exists + unlocked → DashboardPage
// ============================================

import React, { useEffect, useState } from 'react';
import { useWalletStore } from './hooks/useWalletStore';

// Page imports
import { WelcomePage } from './pages/WelcomePage';
import { CreateWalletPage } from './pages/CreateWalletPage';
import { ImportWalletPage } from './pages/ImportWalletPage';
import { UnlockPage } from './pages/UnlockPage';
import { DashboardPage } from './pages/DashboardPage';
import { SendPage } from './pages/SendPage';
import { ReceivePage } from './pages/ReceivePage';
import { InscriptionsPage } from './pages/InscriptionsPage';
import { TokensPage } from './pages/TokensPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AccountsPage } from './pages/AccountsPage';

// Layout imports
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { Toast } from './components/ui/Toast';

// Loading spinner component
function LoadingSpinner(): React.ReactElement {
  return (
    <div className="flex flex-col h-screen w-[360px] bg-bg-primary items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-neon-cyan border-t-transparent" />
      <p className="mt-4 text-text-secondary text-sm">Initializing wallet...</p>
    </div>
  );
}

export function App(): React.ReactElement {
  const {
    isInitialized,
    isLocked,
    currentView,
    toasts,
    removeToast,
    initialize,
  } = useWalletStore();

  // Track if we've completed initial load
  const [isLoading, setIsLoading] = useState(true);

  // Initialize wallet state on mount
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        console.log('[App] Starting initialization...');
        await initialize();
        console.log('[App] Initialization complete');
      } catch (error) {
        console.error('[App] Initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeWallet();
  }, [initialize]);

  // Debug logging for state changes
  useEffect(() => {
    console.log('[App] State changed:', {
      isInitialized,
      isLocked,
      currentView,
      isLoading,
    });
  }, [isInitialized, isLocked, currentView, isLoading]);

  // Show loading spinner during initialization
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Render the current page based on view
  const renderPage = (): React.ReactElement => {
    // Priority 1: If wallet not initialized, show welcome or create/import
    if (!isInitialized) {
      switch (currentView) {
        case 'create-wallet':
          return <CreateWalletPage />;
        case 'import-wallet':
          return <ImportWalletPage />;
        default:
          // Default for uninitialized wallet is welcome page
          return <WelcomePage />;
      }
    }

    // Priority 2: If wallet is locked, show unlock page
    if (isLocked) {
      return <UnlockPage />;
    }

    // Priority 3: Wallet is unlocked, show requested view
    switch (currentView) {
      case 'welcome':
        // If somehow we get here with initialized wallet, redirect to dashboard
        return <DashboardPage />;
      case 'create-wallet':
        return <CreateWalletPage />;
      case 'import-wallet':
        return <ImportWalletPage />;
      case 'unlock':
        return <UnlockPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'send':
        return <SendPage />;
      case 'receive':
        return <ReceivePage />;
      case 'inscriptions':
        return <InscriptionsPage />;
      case 'tokens':
        return <TokensPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'accounts':
        return <AccountsPage />;
      default:
        return <DashboardPage />;
    }
  };

  // Determine if we should show header/navigation
  // Hide chrome for onboarding and unlock flows
  const showChrome = isInitialized && !isLocked && 
    !['welcome', 'create-wallet', 'import-wallet', 'unlock'].includes(currentView);

  return (
    <div className="flex flex-col h-screen w-[360px] bg-bg-primary text-text-primary overflow-hidden">
      {/* Header - only when wallet is unlocked and not in onboarding */}
      {showChrome && <Header />}
      
      {/* Main content area */}
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
      
      {/* Bottom navigation - only when wallet is unlocked */}
      {showChrome && <Navigation />}
      
      {/* Toast notifications */}
      <div className="fixed bottom-20 left-4 right-4 flex flex-col gap-2 z-50 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              type={toast.type}
              message={toast.message}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
