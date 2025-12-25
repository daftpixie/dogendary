// ============================================
// Dogendary Wallet - Type Definitions
// Complete type system for the wallet extension
// ============================================

// View types for navigation - extended to include all views
export type ViewType = 
  | 'welcome'
  | 'create'
  | 'import'
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
  | 'accounts';

// Wallet address structure (for derived addresses)
export interface WalletAddress {
  path: string;
  address: string;
  privateKey: string;
  publicKey?: string;
}

// Wallet account structure - extended with name and balance
export interface WalletAccount {
  id?: string;
  index: number;
  address: string;
  path: string;
  publicKey: string;
  label?: string;
  name?: string;
  balance?: Balance;
}

// Balance information
export interface Balance {
  confirmed: number;
  unconfirmed: number;
  total: number;
}

// UTXO structure - with all required fields
export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  script: string;
  scriptPubKey?: string;
  address: string;
  confirmations: number;
  inscriptionId?: string;
  isInscription?: boolean;
}

// Inscription data - with all aliases
export interface Inscription {
  id: string;
  inscriptionId?: string;
  number: number;
  inscriptionNumber?: number;
  contentType: string;
  contentUrl?: string;
  content?: string;
  owner: string;
  location: string;
  satpoint?: string;
  genesisTransaction: string;
  timestamp: number;
}

// DRC-20 token - with symbol alias
export interface DRC20Token {
  tick: string;
  symbol?: string;
  balance: string;
  transferable: string;
  available: string;
  decimals: number;
}

// Dunes token - with tick alias
export interface DunesToken {
  id: string;
  name: string;
  symbol: string;
  tick?: string;
  balance: {
    available: number;
    transferable: number;
    total: number;
  };
  decimals: number;
}

// Transaction record - with hash alias
export interface TransactionRecord {
  id: string;
  txid: string;
  hash?: string;
  type: 'send' | 'receive' | 'inscription' | 'token';
  amount: number;
  fee?: number;
  from: string;
  to: string;
  timestamp: number;
  confirmations: number;
  status: 'pending' | 'confirmed' | 'failed';
  metadata?: Record<string, unknown>;
}

// Wallet settings
export interface WalletSettings {
  network: 'mainnet' | 'testnet';
  currency: string;
  autoLockMinutes: number;
  autoLock: number;
  enableNotifications: boolean;
  notifications: boolean;
  theme: 'dark' | 'light' | 'system';
  showTestnetWarning: boolean;
}

// Toast notification - with title and description aliases
export interface ToastData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  description?: string;
  duration?: number;
}

// Alias for Toast (used by Toast component)
export type Toast = ToastData;

// dApp permission
export interface DAppPermission {
  origin: string;
  accounts: string[];
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

// Password validation result
export interface PasswordValidation {
  isValid: boolean;
  score: number;
  feedback: string[];
}

// Transaction parameters for building
export interface TransactionParams {
  to: string;
  amount: number;
  fee?: number;
  memo?: string;
}

// Message types for service worker communication
export type MessageType =
  | 'UNLOCK_WALLET'
  | 'LOCK_WALLET'
  | 'CREATE_WALLET'
  | 'IMPORT_WALLET'
  | 'GET_ACCOUNTS'
  | 'CREATE_ACCOUNT'
  | 'GET_BALANCE'
  | 'GET_UTXOS'
  | 'SEND_TRANSACTION'
  | 'SIGN_MESSAGE'
  | 'SIGN_TRANSACTION'
  | 'GET_INSCRIPTIONS'
  | 'GET_DRC20_TOKENS'
  | 'GET_TRANSACTIONS'
  | 'CONNECT_DAPP'
  | 'DISCONNECT_DAPP'
  | 'GET_CONNECTED_DAPPS';

// Service worker message payload
export interface MessagePayload {
  type: MessageType;
  id?: string;
  data?: unknown;
  origin?: string;
}

// Service worker response
export interface ServiceWorkerResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Wallet event for content script
export interface WalletEventMessage {
  type: string;
  id?: string;
  payload?: unknown;
}

// Network configuration - with bech32 for bitcoin.Network compatibility
export interface NetworkConfig {
  name: string;
  messagePrefix: string;
  bech32: string;
  bip32: {
    public: number;
    private: number;
  };
  pubKeyHash: number;
  scriptHash: number;
  wif: number;
}

// Export default network configs with bech32
export const DOGECOIN_MAINNET: NetworkConfig = {
  name: 'mainnet',
  messagePrefix: '\x19Dogecoin Signed Message:\n',
  bech32: 'doge', // Dogecoin doesn't really use bech32, but needed for type compatibility
  bip32: {
    public: 0x02facafd,
    private: 0x02fac398
  },
  pubKeyHash: 0x1e,
  scriptHash: 0x16,
  wif: 0x9e
};

export const DOGECOIN_TESTNET: NetworkConfig = {
  name: 'testnet',
  messagePrefix: '\x19Dogecoin Signed Message:\n',
  bech32: 'tdge',
  bip32: {
    public: 0x043587cf,
    private: 0x04358394
  },
  pubKeyHash: 0x71,
  scriptHash: 0xc4,
  wif: 0xf1
};
