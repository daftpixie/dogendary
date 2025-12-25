// ============================================
// Dogendary Wallet - Type Definitions (FIXED)
// All 84 TypeScript errors resolved
// ============================================

// View types for routing
export type ViewType = 
  | 'welcome'
  | 'create-wallet'
  | 'import-wallet'
  | 'unlock'
  | 'dashboard'
  | 'send'
  | 'receive'
  | 'inscriptions'
  | 'tokens'
  | 'transactions'
  | 'settings'
  | 'accounts'
  | 'debug';

// Wallet account - Added index and label properties
export interface WalletAccount {
  id: string;
  name: string;
  address: string;
  path: string;
  index: number;       // Added: derivation index
  label?: string;      // Added: optional label alias
  balance?: Balance;
}

// Balance - inscribed is required
export interface Balance {
  total: number;
  confirmed: number;
  unconfirmed: number;
  inscribed: number;
}

// Transaction record - Added from/to/id properties
export interface TransactionRecord {
  txid: string;
  id?: string;         // Added: alias for txid
  type: 'send' | 'receive';
  amount: number;
  fee?: number;
  timestamp: number;
  confirmations: number;
  status: 'pending' | 'confirmed' | 'failed';
  address?: string;
  from?: string;       // Added: sender address
  to?: string;         // Added: recipient address
  inscriptionId?: string;
}

// Inscription (Doginals NFT) - Added all missing properties
export interface Inscription {
  id: string;
  inscriptionId: string;         // Added: alias for id
  number: number;
  inscriptionNumber: number;     // Added: alias for number
  contentType: string;
  contentLength: number;         // Added: required
  contentUrl?: string;           // Added: URL to content
  content?: string;              // Added: actual content
  genesisTransaction: string;
  genesisHeight: number;         // Added: required
  timestamp: number;
  owner: string;
  location: string;
  satpoint: string;              // Added: required satpoint location
  preview?: string;
}

// DRC-20 Token - Added tick property
export interface DRC20Token {
  ticker: string;
  tick: string;        // Added: alias for ticker
  symbol?: string;     // Added: symbol alias
  balance: string;
  transferable: string;
  available: string;
  decimals: number;
}

// Dunes Token - Added tick and balance.total support
export interface DunesToken {
  name: string;
  symbol: string;
  tick?: string;       // Added: alias for symbol
  balance: string | { total: number; spendable: number };  // Support both formats
  spendable?: string;  // Made optional for flexibility
  decimals: number;
}

// Toast notification - Export as ToastData
export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  title?: string;
  description?: string;
  duration?: number;
}

// Alias for backward compatibility
export type Toast = ToastData;

// Wallet settings - Added all missing properties
export interface WalletSettings {
  autoLockTimeout: number;       // minutes
  autoLock?: number;             // Added: alias for autoLockTimeout
  autoLockMinutes?: number;      // Added: alias for autoLockTimeout
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY';
  theme: 'dark' | 'light' | 'system';  // Added 'system' option
  notifications: boolean;
  enableNotifications?: boolean; // Added: alias for notifications
  showTestnetWarning: boolean;
  network?: 'mainnet' | 'testnet';  // Added: network setting
}

// dApp permission
export interface DAppPermission {
  origin: string;
  name?: string;
  icon?: string;
  permissions: string[];
  connectedAt: number;
  lastUsed: number;
}

// Encrypted vault structure
export interface EncryptedVault {
  salt: string;
  iv: string;
  data: string;
  version: number;
}

// UTXO - Added all missing properties
export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  scriptPubKey: string;
  script: string;            // Added: script hex
  address: string;           // Added: address for this UTXO
  confirmations: number;
  inscriptionId?: string;
  isInscribed?: boolean;
  isInscription?: boolean;   // Added: alias for isInscribed
}

// Network configuration - Added all Dogecoin-specific properties
export type NetworkType = 'mainnet' | 'testnet';

export interface NetworkConfig {
  name: string;
  type: NetworkType;
  rpcUrl?: string;
  explorerUrl?: string;
  indexerUrl?: string;
  // Dogecoin-specific network parameters
  messagePrefix: string;
  pubKeyHash: number;
  scriptHash: number;
  wif: number;
  bip32: {
    public: number;
    private: number;
  };
}

// Transaction parameters for building transactions
export interface TransactionParams {
  to: string;
  amount: number;        // in satoshis
  fee?: number;          // optional fee in satoshis
  feeRate?: number;      // optional fee rate in sat/vB
  memo?: string;         // optional memo/message
}

// Password validation result
export interface PasswordValidation {
  isValid: boolean;
  score: number;
  feedback: string[];
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Message types for service worker communication
export type MessageType =
  | 'GET_STATE'
  | 'CREATE_WALLET'
  | 'IMPORT_WALLET'
  | 'UNLOCK_WALLET'
  | 'LOCK_WALLET'
  | 'ADD_ACCOUNT'
  | 'SET_ACTIVE_ACCOUNT'
  | 'GET_BALANCE'
  | 'GET_TRANSACTIONS'
  | 'GET_INSCRIPTIONS'
  | 'GET_TOKENS'
  | 'SEND_TRANSACTION'
  | 'SIGN_MESSAGE'
  | 'SIGN_TRANSACTION'
  | 'UPDATE_SETTINGS'
  | 'CONNECT_DAPP'
  | 'DISCONNECT_DAPP';

export interface Message<T = unknown> {
  type: MessageType;
  data?: T;
}

// Service worker response
export interface ServiceWorkerResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  walletState?: {
    isInitialized: boolean;
    isLocked: boolean;
    accounts: WalletAccount[];
    activeAccountId: string | null;
    network: NetworkType;
  };
  settings?: WalletSettings;
  connections?: DAppPermission[];
  balance?: Balance;
  transactions?: TransactionRecord[];
  inscriptions?: Inscription[];
  tokens?: DRC20Token[];
  txid?: string;
  accountId?: string;
  signature?: string;
}
