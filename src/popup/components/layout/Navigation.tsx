// ============================================
// Dogendary Wallet - Navigation Component (FIXED)
// Fixed: Import ViewType from types (re-exported from store)
// ============================================

import React from 'react';
import { cn } from '@/lib/utils';
import { useWalletStore, type ViewType } from '@/popup/hooks/useWalletStore';
import {
  Wallet,
  Send,
  ArrowDownToLine,
  Image,
  Coins,
} from 'lucide-react';

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Wallet', icon: <Wallet className="w-5 h-5" /> },
  { id: 'send', label: 'Send', icon: <Send className="w-5 h-5" /> },
  { id: 'receive', label: 'Receive', icon: <ArrowDownToLine className="w-5 h-5" /> },
  { id: 'inscriptions', label: 'NFTs', icon: <Image className="w-5 h-5" /> },
  { id: 'tokens', label: 'Tokens', icon: <Coins className="w-5 h-5" /> },
];

export function Navigation(): React.ReactElement {
  const { currentView, setView } = useWalletStore();

  return (
    <nav className="flex items-center justify-around px-2 py-2 bg-surface-1/50 backdrop-blur-md border-t border-white/5">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setView(item.id)}
          className={cn(
            'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200',
            currentView === item.id
              ? 'text-neon-cyan bg-neon-cyan/10'
              : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2'
          )}
        >
          {item.icon}
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default Navigation;
