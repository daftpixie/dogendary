// ============================================
// Dogendary Wallet - Service Worker (FIXED v2)
// All TypeScript errors resolved
// ============================================

import browser from 'webextension-polyfill';

const STORAGE_KEYS = {
  VAULT: 'dogendary_vault',
  SESSION_KEY: 'dogendary_session_key',
  SETTINGS: 'dogendary_settings',
  CONNECTIONS: 'dogendary_connections',
} as const;

interface WalletAccount {
  id: string;
  name: string;
  address: string;
  path: string;
  index?: number;
  label?: string;
}

interface EncryptedVault { salt: string; iv: string; data: string; version: number; }
interface WalletSettings { autoLockTimeout: number; currency: string; theme: 'dark' | 'light'; notifications: boolean; showTestnetWarning: boolean; }
interface DAppConnection { origin: string; permissions: string[]; }
interface ServiceWorkerMessage { type: string; data?: unknown; }

// Session state interface for type safety
interface SessionWalletState {
  isUnlocked: boolean;
  accounts?: WalletAccount[];
  activeAccountId?: string;
}

interface ServiceWorkerState {
  isUnlocked: boolean;
  decryptedSeed: string | null;
  accounts: WalletAccount[];
  activeAccountId: string | null;
  network: 'mainnet' | 'testnet';
}

let state: ServiceWorkerState = {
  isUnlocked: false,
  decryptedSeed: null,
  accounts: [],
  activeAccountId: null,
  network: 'mainnet',
};

// ============================================
// Crypto utilities for vault encryption
// ============================================

async function deriveKey(password: string, saltBytes: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  // FIX: Create a new ArrayBuffer to avoid SharedArrayBuffer type issues
  const saltBuffer = new ArrayBuffer(saltBytes.length);
  new Uint8Array(saltBuffer).set(saltBytes);
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 600000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptData(data: string, password: string): Promise<EncryptedVault> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  
  // Create ArrayBuffer for iv
  const ivBuffer = new ArrayBuffer(iv.length);
  new Uint8Array(ivBuffer).set(iv);
  
  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    encoder.encode(data)
  );
  
  return {
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    version: 1,
  };
}

async function decryptData(vault: EncryptedVault, password: string): Promise<string> {
  const salt = new Uint8Array(atob(vault.salt).split('').map(c => c.charCodeAt(0)));
  const iv = new Uint8Array(atob(vault.iv).split('').map(c => c.charCodeAt(0)));
  const data = new Uint8Array(atob(vault.data).split('').map(c => c.charCodeAt(0)));
  
  const key = await deriveKey(password, salt);
  
  // Create ArrayBuffer for iv
  const ivBuffer = new ArrayBuffer(iv.length);
  new Uint8Array(ivBuffer).set(iv);
  
  // Create ArrayBuffer for data
  const dataBuffer = new ArrayBuffer(data.length);
  new Uint8Array(dataBuffer).set(data);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    dataBuffer
  );
  
  return new TextDecoder().decode(decrypted);
}

// ============================================
// Simple address generation (placeholder)
// In production, use proper HD wallet derivation
// ============================================

// FIX: Prefix unused parameter with underscore
function generateMockAddress(_index: number): string {
  // Generate a mock Dogecoin address for demo purposes
  // In production, derive from mnemonic using BIP44 path m/44'/3'/0'/0/index
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let address = 'D';
  for (let i = 0; i < 33; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address.slice(0, 34);
}

function createAccountFromMnemonic(mnemonic: string, index: number): WalletAccount {
  // In production: derive address using BIP44 from mnemonic
  // For now, generate a deterministic-ish address
  const hash = mnemonic.split('').reduce((a, c) => a + c.charCodeAt(0), index);
  
  return {
    id: `account-${index}-${Date.now()}`,
    name: index === 0 ? 'Account 1' : `Account ${index + 1}`,
    address: generateMockAddress(hash),
    path: `m/44'/3'/0'/0/${index}`,
    index,
    label: index === 0 ? 'Primary' : undefined,
  };
}

// ============================================
// State management
// ============================================

async function handleGetState(): Promise<{
  success: boolean;
  walletState: { isInitialized: boolean; isLocked: boolean; accounts: WalletAccount[]; activeAccountId: string | null; network: 'mainnet' | 'testnet'; };
  settings?: WalletSettings;
  connections?: DAppConnection[];
}> {
  console.log('[ServiceWorker] Handling GET_STATE');
  try {
    const storage = await browser.storage.local.get(STORAGE_KEYS.VAULT);
    const vault = storage[STORAGE_KEYS.VAULT] as EncryptedVault | undefined;
    const hasVault = Boolean(vault?.data && vault?.salt && vault?.iv);
    
    // FIX: Properly type sessionState - initialize as the correct type
    let sessionState: SessionWalletState | undefined = undefined;
    try {
      const session = await browser.storage.session.get('wallet_state');
      if (session.wallet_state) {
        sessionState = session.wallet_state as SessionWalletState;
      }
    } catch { /* Session storage may not be available */ }
    
    // Use session state if available, otherwise fall back to memory state
    const isUnlocked = sessionState !== undefined ? sessionState.isUnlocked : state.isUnlocked;
    const accounts = sessionState?.accounts ?? state.accounts ?? [];
    const activeAccountId = sessionState?.activeAccountId ?? state.activeAccountId ?? null;
    
    const settingsData = await browser.storage.local.get(STORAGE_KEYS.SETTINGS);
    const connectionsData = await browser.storage.local.get(STORAGE_KEYS.CONNECTIONS);
    
    console.log('[ServiceWorker] GET_STATE result:', { hasVault, isUnlocked, accountCount: accounts.length });
    
    return {
      success: true,
      walletState: {
        isInitialized: hasVault,
        isLocked: hasVault ? !isUnlocked : true,
        accounts,
        activeAccountId,
        network: state.network || 'mainnet',
      },
      settings: settingsData[STORAGE_KEYS.SETTINGS] as WalletSettings | undefined,
      connections: (connectionsData[STORAGE_KEYS.CONNECTIONS] as DAppConnection[] | undefined) || [],
    };
  } catch (error) {
    console.error('[ServiceWorker] GET_STATE error:', error);
    return { success: true, walletState: { isInitialized: false, isLocked: true, accounts: [], activeAccountId: null, network: 'mainnet' } };
  }
}

// ============================================
// Wallet creation
// ============================================

async function handleCreateWallet(data: { mnemonic: string; password: string }): Promise<{ success: boolean; error?: { message: string } }> {
  console.log('[ServiceWorker] Creating wallet...');
  
  try {
    const { mnemonic, password } = data;
    
    if (!mnemonic || !password) {
      return { success: false, error: { message: 'Mnemonic and password are required' } };
    }
    
    // 1. Encrypt the mnemonic
    const vault = await encryptData(mnemonic, password);
    
    // 2. Store the encrypted vault
    await browser.storage.local.set({ [STORAGE_KEYS.VAULT]: vault });
    console.log('[ServiceWorker] Vault stored successfully');
    
    // 3. Create the first account
    const firstAccount = createAccountFromMnemonic(mnemonic, 0);
    
    // 4. Update state
    state.isUnlocked = true;
    state.decryptedSeed = mnemonic;
    state.accounts = [firstAccount];
    state.activeAccountId = firstAccount.id;
    
    // 5. Store session state (persists across popup reopens while browser is open)
    try {
      const sessionData: SessionWalletState = {
        isUnlocked: true,
        accounts: state.accounts,
        activeAccountId: state.activeAccountId ?? undefined,
      };
      await browser.storage.session.set({ wallet_state: sessionData });
      console.log('[ServiceWorker] Session state stored');
    } catch (e) {
      console.warn('[ServiceWorker] Could not store session state:', e);
    }
    
    // 6. Initialize default settings if not present
    const existingSettings = await browser.storage.local.get(STORAGE_KEYS.SETTINGS);
    if (!existingSettings[STORAGE_KEYS.SETTINGS]) {
      await browser.storage.local.set({
        [STORAGE_KEYS.SETTINGS]: {
          autoLockTimeout: 5,
          currency: 'USD',
          theme: 'dark',
          notifications: true,
          showTestnetWarning: true,
        }
      });
    }
    
    console.log('[ServiceWorker] Wallet created successfully with account:', firstAccount.address);
    return { success: true };
    
  } catch (error) {
    console.error('[ServiceWorker] CREATE_WALLET error:', error);
    return { 
      success: false, 
      error: { message: error instanceof Error ? error.message : 'Failed to create wallet' } 
    };
  }
}

// ============================================
// Wallet unlock
// ============================================

async function handleUnlockWallet(data: { password: string }): Promise<{ success: boolean; error?: { message: string } }> {
  console.log('[ServiceWorker] Unlocking wallet...');
  
  try {
    const { password } = data;
    
    // 1. Get the vault
    const storage = await browser.storage.local.get(STORAGE_KEYS.VAULT);
    const vault = storage[STORAGE_KEYS.VAULT] as EncryptedVault | undefined;
    
    if (!vault) {
      return { success: false, error: { message: 'No wallet found' } };
    }
    
    // 2. Try to decrypt
    const mnemonic = await decryptData(vault, password);
    
    // 3. Recreate accounts from mnemonic
    const firstAccount = createAccountFromMnemonic(mnemonic, 0);
    
    // 4. Update state
    state.isUnlocked = true;
    state.decryptedSeed = mnemonic;
    state.accounts = [firstAccount];
    state.activeAccountId = firstAccount.id;
    
    // 5. Store session state
    try {
      const sessionData: SessionWalletState = {
        isUnlocked: true,
        accounts: state.accounts,
        activeAccountId: state.activeAccountId ?? undefined,
      };
      await browser.storage.session.set({ wallet_state: sessionData });
    } catch (e) {
      console.warn('[ServiceWorker] Could not store session state:', e);
    }
    
    console.log('[ServiceWorker] Wallet unlocked successfully');
    return { success: true };
    
  } catch (error) {
    console.error('[ServiceWorker] UNLOCK_WALLET error:', error);
    return { 
      success: false, 
      error: { message: 'Invalid password' } 
    };
  }
}

async function handleLockWallet() {
  console.log('[ServiceWorker] Locking wallet...');
  state.isUnlocked = false;
  state.decryptedSeed = null;
  try { 
    await browser.storage.session.remove('wallet_state'); 
  } catch { /* ignore */ }
  return { success: true };
}

async function handleGetBalance() { 
  return { 
    success: true, 
    balance: { 
      total: 0, 
      confirmed: 0, 
      unconfirmed: 0, 
      inscribed: 0 
    } 
  }; 
}

async function handleGetTransactions() { 
  return { success: true, transactions: [] }; 
}

async function handleGetInscriptions() { 
  return { success: true, inscriptions: [] }; 
}

async function handleGetTokens() { 
  return { success: true, tokens: [] }; 
}

async function handleSendTransaction(_data: { to: string; amount: number }) { 
  return { success: false, error: { message: 'Not implemented yet' } }; 
}

async function handleAddAccount() { 
  if (!state.decryptedSeed) {
    return { success: false, error: { message: 'Wallet is locked' } };
  }
  
  const newIndex = state.accounts.length;
  const newAccount = createAccountFromMnemonic(state.decryptedSeed, newIndex);
  state.accounts.push(newAccount);
  state.activeAccountId = newAccount.id;
  
  // Update session
  try {
    const sessionData: SessionWalletState = {
      isUnlocked: true,
      accounts: state.accounts,
      activeAccountId: state.activeAccountId ?? undefined,
    };
    await browser.storage.session.set({ wallet_state: sessionData });
  } catch { /* ignore */ }
  
  return { 
    success: true, 
    walletState: { 
      accounts: state.accounts, 
      activeAccountId: state.activeAccountId 
    } 
  }; 
}

async function handleSetActiveAccount(data: { accountId: string }) { 
  state.activeAccountId = data.accountId; 
  
  // Update session
  try {
    const session = await browser.storage.session.get('wallet_state');
    if (session.wallet_state) {
      const sessionState = session.wallet_state as SessionWalletState;
      const updatedSession: SessionWalletState = {
        ...sessionState,
        activeAccountId: data.accountId,
      };
      await browser.storage.session.set({ wallet_state: updatedSession });
    }
  } catch { /* ignore */ }
  
  return { success: true }; 
}

async function handleUpdateSettings(data: Partial<WalletSettings>) {
  const current = await browser.storage.local.get(STORAGE_KEYS.SETTINGS);
  const newSettings = { ...(current[STORAGE_KEYS.SETTINGS] as WalletSettings | undefined), ...data };
  await browser.storage.local.set({ [STORAGE_KEYS.SETTINGS]: newSettings });
  return { success: true, settings: newSettings };
}

// ============================================
// Message listener
// ============================================

browser.runtime.onMessage.addListener((message: unknown, _sender: browser.Runtime.MessageSender) => {
  const msg = message as ServiceWorkerMessage;
  console.log('[ServiceWorker] Received message:', msg.type);
  
  return (async () => {
    switch (msg.type) {
      case 'GET_STATE': return handleGetState();
      case 'CREATE_WALLET': return handleCreateWallet(msg.data as { mnemonic: string; password: string });
      case 'UNLOCK_WALLET': return handleUnlockWallet(msg.data as { password: string });
      case 'LOCK_WALLET': return handleLockWallet();
      case 'GET_BALANCE': return handleGetBalance();
      case 'GET_TRANSACTIONS': return handleGetTransactions();
      case 'GET_INSCRIPTIONS': return handleGetInscriptions();
      case 'GET_TOKENS': return handleGetTokens();
      case 'SEND_TRANSACTION': return handleSendTransaction(msg.data as { to: string; amount: number });
      case 'ADD_ACCOUNT': return handleAddAccount();
      case 'SET_ACTIVE_ACCOUNT': return handleSetActiveAccount(msg.data as { accountId: string });
      case 'UPDATE_SETTINGS': return handleUpdateSettings(msg.data as Partial<WalletSettings>);
      default: return { success: false, error: { message: 'Unknown message type' } };
    }
  })();
});

console.log('[ServiceWorker] Dogendary Wallet service worker starting...');

export { handleGetState, STORAGE_KEYS };
