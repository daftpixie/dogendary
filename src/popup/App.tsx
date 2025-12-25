/**
 * App - Main application component
 */

import React from 'react';
import type { ViewType } from '@/types';
import { useWalletStore } from './hooks/useWalletStore';
import { Toast } from './components/ui/Toast';

// Page imports
import { CreateWalletPage } from './pages/CreateWalletPage';
import { ImportWalletPage } from './pages/ImportWalletPage';
import { SendPage } from './pages/SendPage';
import { InscriptionsPage } from './pages/InscriptionsPage';
import { TokensPage } from './pages/TokensPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { SettingsPage } from './pages/SettingsPage';

// Lazy load other pages as needed
const UnlockPage = React.lazy(() => import('./pages/UnlockPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ReceivePage = React.lazy(() => import('./pages/ReceivePage'));

// Header component
const Header: React.FC = () => {
  const { activeAccount, balance, lock } = useWalletStore();
  
  return (
    <header className="flex items-center justify-between p-4 border-b border-surface-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
          <span className="text-lg">🐕</span>
        </div>
        <div>
          <div className="text-sm font-medium text-text-primary">
            {activeAccount?.label || 'Dogendary'}
          </div>
          <div className="text-xs text-text-secondary">
            {balance.total.toFixed(4)} DOGE
          </div>
        </div>
      </div>
      <button
        onClick={lock}
        className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
        title="Lock wallet"
      >
        🔒
      </button>
    </header>
  );
};

// Navigation component
const Navigation: React.FC = () => {
  const { currentView, setView } = useWalletStore();
  
  const navItems: { view: ViewType; icon: string; label: string }[] = [
    { view: 'dashboard', icon: '🏠', label: 'Home' },
    { view: 'send', icon: '↑', label: 'Send' },
    { view: 'receive', icon: '↓', label: 'Receive' },
    { view: 'inscriptions', icon: '🖼️', label: 'NFTs' },
    { view: 'settings', icon: '⚙️', label: 'Settings' }
  ];
  
  return (
    <nav className="flex items-center justify-around p-2 border-t border-surface-3 bg-surface-1">
      {navItems.map(({ view, icon, label }) => (
        <button
          key={view}
          onClick={() => setView(view)}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            currentView === view
              ? 'text-neon-cyan bg-neon-cyan/10'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
          }`}
        >
          <span className="text-lg">{icon}</span>
          <span className="text-xs">{label}</span>
        </button>
      ))}
    </nav>
  );
};

// Main App component
export const App: React.FC = () => {
  const { currentView, isLocked, toasts, removeToast } = useWalletStore();

  // Render the appropriate page based on current view
  const renderPage = (): React.ReactNode => {
    // Auth pages (no header/nav)
    if (currentView === 'create-wallet') return <CreateWalletPage />;
    if (currentView === 'import-wallet') return <ImportWalletPage />;
    if (currentView === 'unlock' || isLocked) {
      return (
        <React.Suspense fallback={<div className="p-4">Loading...</div>}>
          <UnlockPage />
        </React.Suspense>
      );
    }

    // Main pages with header/nav
    switch (currentView) {
      case 'dashboard':
        return (
          <React.Suspense fallback={<div className="p-4">Loading...</div>}>
            <DashboardPage />
          </React.Suspense>
        );
      case 'send':
        return <SendPage />;
      case 'receive':
        return (
          <React.Suspense fallback={<div className="p-4">Loading...</div>}>
            <ReceivePage />
          </React.Suspense>
        );
      case 'inscriptions':
        return <InscriptionsPage />;
      case 'tokens':
        return <TokensPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <React.Suspense fallback={<div className="p-4">Loading...</div>}>
            <DashboardPage />
          </React.Suspense>
        );
    }
  };

  // Check if we should show header/nav
  const showChrome = !isLocked && 
    currentView !== 'create-wallet' && 
    currentView !== 'import-wallet' && 
    currentView !== 'unlock';

  return (
    <div className="flex flex-col h-screen w-[360px] bg-bg-primary text-text-primary">
      {/* Header */}
      {showChrome && <Header />}
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
      
      {/* Navigation */}
      {showChrome && <Navigation />}
      
      {/* Toast notifications */}
      <div className="fixed bottom-20 left-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default App;
