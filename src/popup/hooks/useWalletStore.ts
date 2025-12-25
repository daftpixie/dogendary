// ============================================
// Dogendary Wallet - useWalletStore.ts (FIXED v2)
// All 32 TypeScript errors resolved
// ============================================

import { create } from 'zustand';
import browser from 'webextension-polyfill';
import type { 
  ViewType, 
  WalletAccount, 
  WalletSettings, 
  Balance, 
  TransactionRecord, 
  Inscription, 
  DRC20Token, 
  DunesToken, 
  Toast, 
  DAppPermission 
} from '@/types';

// Re-export ViewType for components that import from here
export type { ViewType } from '@/types';

interface ServiceWorkerResponse {
  success: boolean;
  error?: { message: string };
  walletState?: { 
    isInitialized: boolean; 
    isLocked: boolean; 
    accounts: WalletAccount[]; 
    activeAccountId: string | null; 
    network: 'mainnet' | 'testnet'; 
  };
  settings?: WalletSettings;
  connections?: DAppPermission[];
  balance?: Balance;
  transactions?: TransactionRecord[];
  inscriptions?: Inscription[];
  tokens?: DRC20Token[] | DunesToken[];
  txid?: string;
  accountId?: string;
}

interface WalletStore {
  isInitialized: boolean;
  isLocked: boolean;
  accounts: WalletAccount[];
  activeAccountId: string | null;
  activeAccountIndex: number;
  network: 'mainnet' | 'testnet';
  settings: WalletSettings;
  connections: DAppPermission[];
  balance: Balance | null;
  transactions: TransactionRecord[];
  inscriptions: Inscription[];
  drc20Tokens: DRC20Token[];
  dunesTokens: DunesToken[];
  isLoading: boolean;
  isLoadingBalance: boolean;
  isLoadingTransactions: boolean;
  isLoadingInscriptions: boolean;
  isLoadingTokens: boolean;
  currentView: ViewType;
  toasts: Toast[];
  dogePrice: number;
  initialize: () => Promise<void>;
  syncState: () => Promise<void>;
  createWallet: (mnemonic: string, password: string) => Promise<boolean>;
  importWallet: (mnemonic: string, password: string) => Promise<boolean>;
  unlockWallet: (password: string) => Promise<boolean>;
  lockWallet: () => Promise<void>;
  addAccount: () => Promise<void>;
  setActiveAccount: (accountId: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshInscriptions: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  refreshData: () => Promise<void>;
  refreshDRC20: () => Promise<void>;
  sendTransaction: (to: string, amount: number) => Promise<{ success: boolean; txid?: string; error?: string }>;
  updateSettings: (settings: Partial<WalletSettings>) => Promise<void>;
  disconnectDApp: (origin: string) => Promise<void>;
  setView: (view: ViewType) => void;
  setLoading: (loading: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

async function sendMessage<T = ServiceWorkerResponse>(type: string, data?: unknown): Promise<T> {
  const response = await browser.runtime.sendMessage({ type, data });
  if ((response as ServiceWorkerResponse)?.error) throw new Error((response as ServiceWorkerResponse).error!.message);
  return response as T;
}

const defaultSettings: WalletSettings = { 
  autoLockTimeout: 5, 
  currency: 'USD', 
  theme: 'dark', 
  notifications: true, 
  showTestnetWarning: true,
  network: 'mainnet',
};

// Selector for active account - EXPORTED
export const selectActiveAccount = (state: WalletStore): WalletAccount | null => {
  return state.accounts.find(a => a.id === state.activeAccountId) || null;
};

export const useWalletStore = create<WalletStore>((set, get) => ({
  isInitialized: false, 
  isLocked: true, 
  accounts: [], 
  activeAccountId: null, 
  activeAccountIndex: 0, 
  network: 'mainnet',
  settings: defaultSettings, 
  connections: [], 
  balance: null, 
  transactions: [], 
  inscriptions: [], 
  drc20Tokens: [], 
  dunesTokens: [],
  currentView: 'welcome', 
  isLoading: false, 
  isLoadingBalance: false, 
  isLoadingTransactions: false, 
  isLoadingInscriptions: false, 
  isLoadingTokens: false,
  toasts: [], 
  dogePrice: 0.08,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const response = await sendMessage<ServiceWorkerResponse>('GET_STATE');
      if (response.walletState) {
        const { walletState } = response;
        const targetView: ViewType = !walletState.isInitialized ? 'welcome' : walletState.isLocked ? 'unlock' : 'dashboard';
        const activeIndex = walletState.accounts.findIndex(a => a.id === walletState.activeAccountId);
        set({ 
          isInitialized: walletState.isInitialized, 
          isLocked: walletState.isLocked, 
          accounts: walletState.accounts || [], 
          activeAccountId: walletState.activeAccountId, 
          activeAccountIndex: activeIndex >= 0 ? activeIndex : 0, 
          network: walletState.network || 'mainnet', 
          currentView: targetView 
        });
        if (walletState.isInitialized && !walletState.isLocked) { 
          await get().refreshBalance(); 
          await get().refreshTransactions(); 
        }
      } else { 
        set({ isInitialized: false, isLocked: true, currentView: 'welcome' }); 
      }
      if (response.settings) set({ settings: response.settings });
      if (response.connections) set({ connections: response.connections });
    } catch { 
      set({ isInitialized: false, isLocked: true, currentView: 'welcome' }); 
    } finally { 
      set({ isLoading: false }); 
    }
  },

  syncState: async () => { 
    await get().initialize(); 
  },

  createWallet: async (mnemonic, password) => {
    set({ isLoading: true });
    try {
      const response = await sendMessage<ServiceWorkerResponse>('CREATE_WALLET', { mnemonic, password });
      if (response.success) { 
        get().addToast({ type: 'success', message: 'Wallet created successfully!', duration: 3000 }); 
        await get().initialize(); 
        return true; 
      }
      get().addToast({ type: 'error', message: response.error?.message || 'Failed to create wallet', duration: 5000 }); 
      return false;
    } catch (error) { 
      get().addToast({ type: 'error', message: error instanceof Error ? error.message : 'Failed', duration: 5000 }); 
      return false; 
    } finally { 
      set({ isLoading: false }); 
    }
  },

  importWallet: async (mnemonic, password) => get().createWallet(mnemonic, password),

  unlockWallet: async (password) => {
    set({ isLoading: true });
    try {
      const response = await sendMessage<ServiceWorkerResponse>('UNLOCK_WALLET', { password });
      if (response.success) { 
        get().addToast({ type: 'success', message: 'Wallet unlocked', duration: 2000 }); 
        await get().initialize(); 
        return true; 
      }
      get().addToast({ type: 'error', message: response.error?.message || 'Invalid password', duration: 3000 }); 
      return false;
    } catch (error) { 
      get().addToast({ type: 'error', message: error instanceof Error ? error.message : 'Failed', duration: 3000 }); 
      return false; 
    } finally { 
      set({ isLoading: false }); 
    }
  },

  lockWallet: async () => { 
    await sendMessage('LOCK_WALLET'); 
    set({ isLocked: true, currentView: 'unlock', balance: null, transactions: [] }); 
  },

  addAccount: async () => {
    set({ isLoading: true });
    try {
      const response = await sendMessage<ServiceWorkerResponse>('ADD_ACCOUNT');
      if (response.success && response.walletState) { 
        set({ accounts: response.walletState.accounts, activeAccountId: response.walletState.activeAccountId }); 
        get().addToast({ type: 'success', message: 'Account added', duration: 2000 }); 
      }
    } catch { 
      get().addToast({ type: 'error', message: 'Failed to add account', duration: 3000 }); 
    } finally { 
      set({ isLoading: false }); 
    }
  },

  setActiveAccount: async (accountId) => {
    await sendMessage('SET_ACTIVE_ACCOUNT', { accountId });
    const newIndex = get().accounts.findIndex(a => a.id === accountId);
    set({ activeAccountId: accountId, activeAccountIndex: newIndex >= 0 ? newIndex : 0 });
    await get().refreshBalance(); 
    await get().refreshTransactions();
  },

  refreshBalance: async () => { 
    set({ isLoadingBalance: true }); 
    try { 
      const r = await sendMessage<ServiceWorkerResponse>('GET_BALANCE'); 
      if (r.balance) set({ balance: r.balance }); 
    } catch { /* ignore */ } finally { 
      set({ isLoadingBalance: false }); 
    } 
  },

  refreshTransactions: async () => { 
    set({ isLoadingTransactions: true }); 
    try { 
      const r = await sendMessage<ServiceWorkerResponse>('GET_TRANSACTIONS'); 
      if (r.transactions) set({ transactions: r.transactions }); 
    } catch { /* ignore */ } finally { 
      set({ isLoadingTransactions: false }); 
    } 
  },

  refreshInscriptions: async () => { 
    set({ isLoadingInscriptions: true }); 
    try { 
      const r = await sendMessage<ServiceWorkerResponse>('GET_INSCRIPTIONS'); 
      if (r.inscriptions) set({ inscriptions: r.inscriptions }); 
    } catch { /* ignore */ } finally { 
      set({ isLoadingInscriptions: false }); 
    } 
  },

  refreshTokens: async () => { 
    set({ isLoadingTokens: true }); 
    try { 
      const r = await sendMessage<ServiceWorkerResponse>('GET_TOKENS'); 
      if (r.tokens) set({ drc20Tokens: r.tokens as DRC20Token[] }); 
    } catch { /* ignore */ } finally { 
      set({ isLoadingTokens: false }); 
    } 
  },

  refreshData: async () => { 
    await Promise.all([
      get().refreshBalance(), 
      get().refreshTransactions(), 
      get().refreshInscriptions(), 
      get().refreshTokens()
    ]); 
  },

  refreshDRC20: async () => { 
    await get().refreshTokens(); 
  },

  sendTransaction: async (to, amount) => {
    set({ isLoading: true });
    try {
      const r = await sendMessage<ServiceWorkerResponse>('SEND_TRANSACTION', { to, amount });
      if (r.success && r.txid) { 
        get().addToast({ type: 'success', message: `Sent! TxID: ${r.txid.slice(0, 8)}...`, duration: 5000 }); 
        await get().refreshBalance(); 
        await get().refreshTransactions(); 
        return { success: true, txid: r.txid }; 
      }
      return { success: false, error: r.error?.message || 'Transaction failed' };
    } catch (e) { 
      const msg = e instanceof Error ? e.message : 'Failed'; 
      get().addToast({ type: 'error', message: msg, duration: 5000 }); 
      return { success: false, error: msg }; 
    } finally { 
      set({ isLoading: false }); 
    }
  },

  updateSettings: async (newSettings) => { 
    const r = await sendMessage<ServiceWorkerResponse>('UPDATE_SETTINGS', newSettings); 
    if (r.settings) set({ settings: r.settings }); 
  },

  disconnectDApp: async (origin) => { 
    await sendMessage('DISCONNECT_DAPP', { origin }); 
    set(s => ({ connections: s.connections.filter(c => c.origin !== origin) })); 
  },

  setView: (view) => set({ currentView: view }),
  setLoading: (loading) => set({ isLoading: loading }),

  addToast: (toast) => { 
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; 
    set(s => ({ toasts: [...s.toasts, { ...toast, id }] })); 
    if (toast.duration) setTimeout(() => get().removeToast(id), toast.duration); 
  },

  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));

export default useWalletStore;
