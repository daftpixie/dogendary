/**
 * Wallet Store - Global state management using Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ViewType,
  WalletAccount,
  Balance,
  Inscription,
  DRC20Token,
  DunesToken,
  TransactionRecord,
  WalletSettings,
  ToastData,
  DAppPermission
} from '@/types';

// Re-export ViewType for convenience
export type { ViewType } from '@/types';

// Default settings with all required properties
const defaultSettings: WalletSettings = {
  network: 'mainnet',
  currency: 'USD',
  autoLockMinutes: 5,
  autoLock: 5,
  enableNotifications: true,
  notifications: true,
  theme: 'dark',
  showTestnetWarning: true
};

// Wallet state interface
export interface WalletState {
  // Auth state
  isLocked: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  
  // View state
  currentView: ViewType;
  setView: (view: ViewType) => void;
  
  // Accounts
  accounts: WalletAccount[];
  activeAccountIndex: number;
  activeAccount: WalletAccount | null;
  setActiveAccountIndex: (index: number) => void;
  setActiveAccount: (index: number) => void; // Alias for setActiveAccountIndex
  
  // Balance
  balance: Balance;
  isLoadingBalance: boolean;
  
  // Inscriptions
  inscriptions: Inscription[];
  isLoadingInscriptions: boolean;
  
  // Tokens
  drc20Tokens: DRC20Token[];
  dunesTokens: DunesToken[];
  isLoadingTokens: boolean;
  
  // Transactions
  transactions: TransactionRecord[];
  isLoadingTransactions: boolean;
  
  // Settings
  settings: WalletSettings;
  updateSettings: (settings: Partial<WalletSettings>) => void;
  
  // Toast notifications
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: string) => void;
  
  // Connected dApps
  connectedDApps: DAppPermission[];
  
  // Wallet actions
  unlock: (password: string) => Promise<boolean>;
  unlockWallet: (password: string) => Promise<boolean>; // Alias for unlock
  lock: () => void;
  lockWallet: () => void; // Alias for lock
  createWallet: (password: string) => Promise<string[]>;
  importWallet: (mnemonic: string, password: string) => Promise<boolean>;
  sendTransaction: (to: string, amount: number) => Promise<string>;
  refreshData: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  refreshInscriptions: () => Promise<void>;
  refreshDRC20: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
}

// Helper to generate toast ID
const generateToastId = () => Math.random().toString(36).substring(2, 9);

// Send message to service worker
async function sendMessage(type: string, data?: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      // Mock for development
      console.log('sendMessage:', type, data);
      resolve({});
      return;
    }
    
    chrome.runtime.sendMessage({ type, data }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response?.success !== false) {
        resolve(response?.data ?? response?.result ?? response);
      } else {
        reject(new Error(response?.error || 'Unknown error'));
      }
    });
  });
}

// Create the store
export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // Initial state
      isLocked: true,
      isInitialized: false,
      isLoading: false,
      currentView: 'welcome',
      accounts: [],
      activeAccountIndex: 0,
      activeAccount: null,
      balance: { confirmed: 0, unconfirmed: 0, total: 0 },
      isLoadingBalance: false,
      inscriptions: [],
      isLoadingInscriptions: false,
      drc20Tokens: [],
      dunesTokens: [],
      isLoadingTokens: false,
      transactions: [],
      isLoadingTransactions: false,
      settings: defaultSettings,
      toasts: [],
      connectedDApps: [],

      // View management
      setView: (view) => set({ currentView: view }),

      // Account management
      setActiveAccountIndex: (index) => {
        const { accounts } = get();
        if (index >= 0 && index < accounts.length) {
          set({ 
            activeAccountIndex: index,
            activeAccount: accounts[index] || null
          });
        }
      },

      // Alias for setActiveAccountIndex
      setActiveAccount: (index) => {
        get().setActiveAccountIndex(index);
      },

      // Settings management
      updateSettings: (newSettings) => {
        const { settings } = get();
        const updated = { ...settings, ...newSettings };
        // Keep aliases in sync
        if (newSettings.autoLock !== undefined) {
          updated.autoLockMinutes = newSettings.autoLock;
        }
        if (newSettings.autoLockMinutes !== undefined) {
          updated.autoLock = newSettings.autoLockMinutes;
        }
        if (newSettings.notifications !== undefined) {
          updated.enableNotifications = newSettings.notifications;
        }
        if (newSettings.enableNotifications !== undefined) {
          updated.notifications = newSettings.enableNotifications;
        }
        set({ settings: updated });
      },

      // Toast management
      addToast: (toast) => {
        const id = generateToastId();
        const newToast: ToastData = { ...toast, id };
        set((state) => ({ toasts: [...state.toasts, newToast] }));
        
        // Auto-remove after duration
        const duration = toast.duration || 5000;
        setTimeout(() => {
          get().removeToast(id);
        }, duration);
      },

      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id)
        }));
      },

      // Wallet unlock
      unlock: async (password) => {
        set({ isLoading: true });
        try {
          const result = await sendMessage('UNLOCK_WALLET', { password });
          if (result) {
            const accounts = await sendMessage('GET_ACCOUNTS') as WalletAccount[];
            set({ 
              isLocked: false, 
              accounts,
              activeAccount: accounts[0] || null,
              currentView: 'dashboard'
            });
            get().refreshData();
            return true;
          }
          return false;
        } catch (error) {
          get().addToast({ type: 'error', message: 'Failed to unlock wallet' });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      // Alias for unlock
      unlockWallet: async (password) => {
        return get().unlock(password);
      },

      // Wallet lock
      lock: () => {
        sendMessage('LOCK_WALLET');
        set({ 
          isLocked: true, 
          currentView: 'unlock',
          accounts: [],
          activeAccount: null,
          balance: { confirmed: 0, unconfirmed: 0, total: 0 }
        });
      },

      // Alias for lock
      lockWallet: () => {
        get().lock();
      },

      // Create wallet
      createWallet: async (password) => {
        set({ isLoading: true });
        try {
          const mnemonic = await sendMessage('CREATE_WALLET', { password }) as string[];
          const accounts = await sendMessage('GET_ACCOUNTS') as WalletAccount[];
          set({ 
            isLocked: false,
            isInitialized: true,
            accounts,
            activeAccount: accounts[0] || null,
            currentView: 'dashboard'
          });
          return mnemonic;
        } catch (error) {
          get().addToast({ type: 'error', message: 'Failed to create wallet' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Import wallet
      importWallet: async (mnemonic, password) => {
        set({ isLoading: true });
        try {
          await sendMessage('IMPORT_WALLET', { mnemonic, password });
          const accounts = await sendMessage('GET_ACCOUNTS') as WalletAccount[];
          set({ 
            isLocked: false,
            isInitialized: true,
            accounts,
            activeAccount: accounts[0] || null,
            currentView: 'dashboard'
          });
          return true;
        } catch (error) {
          get().addToast({ type: 'error', message: 'Failed to import wallet' });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      // Send transaction
      sendTransaction: async (to, amount) => {
        set({ isLoading: true });
        try {
          const txid = await sendMessage('SEND_TRANSACTION', { to, amount }) as string;
          get().addToast({ type: 'success', message: 'Transaction sent!' });
          get().refreshData();
          return txid;
        } catch (error) {
          get().addToast({ type: 'error', message: 'Transaction failed' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // Refresh all data
      refreshData: async () => {
        const { refreshBalance, refreshInscriptions, refreshDRC20, refreshTransactions } = get();
        await Promise.all([
          refreshBalance(),
          refreshInscriptions(),
          refreshDRC20(),
          refreshTransactions()
        ]);
      },

      // Refresh balance
      refreshBalance: async () => {
        set({ isLoadingBalance: true });
        try {
          const balance = await sendMessage('GET_BALANCE') as Balance;
          if (balance) {
            set({ balance });
          }
        } catch (error) {
          console.error('Failed to refresh balance:', error);
        } finally {
          set({ isLoadingBalance: false });
        }
      },

      // Refresh inscriptions
      refreshInscriptions: async () => {
        set({ isLoadingInscriptions: true });
        try {
          const inscriptions = await sendMessage('GET_INSCRIPTIONS') as Inscription[];
          if (inscriptions) {
            set({ inscriptions });
          }
        } catch (error) {
          console.error('Failed to refresh inscriptions:', error);
        } finally {
          set({ isLoadingInscriptions: false });
        }
      },

      // Refresh DRC-20 tokens
      refreshDRC20: async () => {
        set({ isLoadingTokens: true });
        try {
          const tokens = await sendMessage('GET_DRC20_TOKENS') as DRC20Token[];
          if (tokens) {
            set({ drc20Tokens: tokens });
          }
        } catch (error) {
          console.error('Failed to refresh DRC-20 tokens:', error);
        } finally {
          set({ isLoadingTokens: false });
        }
      },

      // Refresh transactions
      refreshTransactions: async () => {
        set({ isLoadingTransactions: true });
        try {
          const transactions = await sendMessage('GET_TRANSACTIONS') as TransactionRecord[];
          if (transactions) {
            set({ transactions });
          }
        } catch (error) {
          console.error('Failed to refresh transactions:', error);
        } finally {
          set({ isLoadingTransactions: false });
        }
      }
    }),
    {
      name: 'dogendary-wallet-storage',
      partialize: (state) => ({
        settings: state.settings,
        activeAccountIndex: state.activeAccountIndex
      })
    }
  )
);

// Selector for active account - export for use in components
export const selectActiveAccount = (state: WalletState) => state.activeAccount;

// Additional selectors
export const selectBalance = (state: WalletState) => state.balance;
export const selectAccounts = (state: WalletState) => state.accounts;
export const selectSettings = (state: WalletState) => state.settings;
export const selectInscriptions = (state: WalletState) => state.inscriptions;
export const selectDRC20Tokens = (state: WalletState) => state.drc20Tokens;
export const selectTransactions = (state: WalletState) => state.transactions;

export default useWalletStore;
