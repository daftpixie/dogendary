/**
 * Service Worker - Background script for the Dogendary wallet extension
 * Handles wallet operations, message passing, and state management
 */

// Buffer polyfill must be first
import '@/lib/buffer-polyfill';

import type { 
  WalletAccount, 
  EncryptedVault,
  MessagePayload, 
  ServiceWorkerResponse,
  TransactionRecord,
  UTXO
} from '@/types';
import { DogecoinHDWallet } from '@/lib/wallet-core';
import { encryptVault, decryptVault, generateId } from '@/lib/crypto';
import { TransactionBuilder } from '@/lib/transaction-builder';
import { IndexerClient } from '@/lib/indexer-client';

// Use browser API (webextension-polyfill provides this)
const browser = typeof chrome !== 'undefined' ? chrome : (globalThis as typeof globalThis & { browser: typeof chrome }).browser;

// Storage keys
const STORAGE_KEYS = {
  VAULT: 'encrypted_vault',
  ACCOUNTS: 'accounts',
  SETTINGS: 'settings',
  CONNECTED_DAPPS: 'connected_dapps',
} as const;

// Session state (in-memory only, cleared on lock)
interface SessionState {
  wallet: DogecoinHDWallet | null;
  accounts: WalletAccount[];
  activeAccountIndex: number;
  unlockTime: number | null;
}

let session: SessionState = {
  wallet: null,
  accounts: [],
  activeAccountIndex: 0,
  unlockTime: null,
};

// Auto-lock timer
let lockTimer: ReturnType<typeof setTimeout> | null = null;
const AUTO_LOCK_MINUTES = 5;

// Indexer client
const indexerClient = new IndexerClient();

// Reset the auto-lock timer
function resetLockTimer(): void {
  if (lockTimer) {
    clearTimeout(lockTimer);
  }
  lockTimer = setTimeout(() => {
    handleLockWallet();
  }, AUTO_LOCK_MINUTES * 60 * 1000);
}

// Clear session data
function clearSession(): void {
  session = {
    wallet: null,
    accounts: [],
    activeAccountIndex: 0,
    unlockTime: null,
  };
  if (lockTimer) {
    clearTimeout(lockTimer);
    lockTimer = null;
  }
}

// Check if wallet is unlocked
function isUnlocked(): boolean {
  return session.wallet !== null && session.unlockTime !== null;
}

// Get active account
function getActiveAccount(): WalletAccount | null {
  if (!isUnlocked() || session.accounts.length === 0) {
    return null;
  }
  return session.accounts[session.activeAccountIndex] || null;
}

// Message handlers
async function handleCreateWallet(
  mnemonic: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const wallet = new DogecoinHDWallet(mnemonic);
    // deriveAccount is async, need to await it
    const account = await wallet.deriveAccount(0);
    
    const vault = await encryptVault(mnemonic, password);
    await browser.storage.local.set({ [STORAGE_KEYS.VAULT]: vault });
    
    session.wallet = wallet;
    session.accounts = [account];
    session.activeAccountIndex = 0;
    session.unlockTime = Date.now();
    
    resetLockTimer();
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create wallet',
    };
  }
}

async function handleUnlockWallet(
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const storage = await browser.storage.local.get(STORAGE_KEYS.VAULT);
    const vault = storage[STORAGE_KEYS.VAULT] as EncryptedVault | undefined;
    
    if (!vault) {
      return { success: false, error: 'No wallet found' };
    }
    
    const mnemonic = await decryptVault(vault, password);
    const wallet = new DogecoinHDWallet(mnemonic);
    
    // Derive all previously created accounts
    // For now, just derive account 0
    // deriveAccount is async, need to await it
    const account = await wallet.deriveAccount(0);
    
    session.wallet = wallet;
    session.accounts = [account];
    session.activeAccountIndex = 0;
    session.unlockTime = Date.now();
    
    resetLockTimer();
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid password',
    };
  }
}

function handleLockWallet(): { success: boolean } {
  clearSession();
  return { success: true };
}

async function handleGetAccounts(): Promise<{ 
  success: boolean; 
  accounts?: WalletAccount[];
  error?: string;
}> {
  if (!isUnlocked()) {
    return { success: false, error: 'Wallet is locked' };
  }
  return { success: true, accounts: session.accounts };
}

async function handleGetBalance(): Promise<{
  success: boolean;
  balance?: { confirmed: number; unconfirmed: number; total: number };
  error?: string;
}> {
  const account = getActiveAccount();
  if (!account) {
    return { success: false, error: 'No active account' };
  }
  
  try {
    const balance = await indexerClient.getBalance(account.address);
    return { success: true, balance };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get balance',
    };
  }
}

async function handleGetUTXOs(): Promise<{
  success: boolean;
  utxos?: UTXO[];
  error?: string;
}> {
  const account = getActiveAccount();
  if (!account) {
    return { success: false, error: 'No active account' };
  }
  
  try {
    const utxos = await indexerClient.getUTXOs(account.address);
    return { success: true, utxos };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get UTXOs',
    };
  }
}

async function handleSendTransaction(
  to: string,
  amount: number,
  _fee?: number // Prefixed with underscore to indicate intentionally unused
): Promise<{ success: boolean; txid?: string; error?: string }> {
  if (!session.wallet) {
    return { success: false, error: 'Wallet is locked' };
  }
  
  const account = getActiveAccount();
  if (!account) {
    return { success: false, error: 'No active account' };
  }
  
  try {
    // Get UTXOs for the account
    const utxos = await indexerClient.getUTXOs(account.address);
    
    // Get private key for signing
    const privateKey = session.wallet.getPrivateKey(account.path);
    
    // Build and send the transaction using the correct API
    const builder = new TransactionBuilder();
    const result = await builder.createSendTransaction(
      to,
      amount,
      privateKey,
      utxos,
      'mainnet'
    );
    
    // Broadcast the transaction
    const broadcastTxid = await indexerClient.broadcastTransaction(result.txHex);
    
    // Use the broadcast txid or fall back to the calculated one
    const finalTxid = typeof broadcastTxid === 'string' ? broadcastTxid : result.txid;
    
    // Record transaction
    const txRecord: TransactionRecord = {
      id: generateId(),
      txid: finalTxid,
      type: 'send',
      amount,
      fee: result.fee,
      from: account.address,
      to,
      timestamp: Date.now(),
      confirmations: 0,
      status: 'pending',
    };
    
    // Store transaction record
    const storage = await browser.storage.local.get('transactions');
    const transactions = (storage.transactions || []) as TransactionRecord[];
    transactions.unshift(txRecord);
    await browser.storage.local.set({ transactions });
    
    return { success: true, txid: finalTxid };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transaction failed',
    };
  }
}

async function handleSignMessage(
  message: string
): Promise<{ success: boolean; signature?: string; error?: string }> {
  if (!session.wallet) {
    return { success: false, error: 'Wallet is locked' };
  }
  
  const account = getActiveAccount();
  if (!account) {
    return { success: false, error: 'No active account' };
  }
  
  try {
    const signatureBuffer = session.wallet.signMessage(message, account.path);
    const signature = signatureBuffer.toString('hex');
    return { success: true, signature };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Signing failed',
    };
  }
}

async function handleGetInscriptions(): Promise<{
  success: boolean;
  inscriptions?: unknown[];
  error?: string;
}> {
  const account = getActiveAccount();
  if (!account) {
    return { success: false, error: 'No active account' };
  }
  
  try {
    const inscriptions = await indexerClient.getInscriptions(account.address);
    return { success: true, inscriptions };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get inscriptions',
    };
  }
}

async function handleGetDRC20Tokens(): Promise<{
  success: boolean;
  tokens?: unknown[];
  error?: string;
}> {
  const account = getActiveAccount();
  if (!account) {
    return { success: false, error: 'No active account' };
  }
  
  try {
    const tokens = await indexerClient.getDRC20Tokens(account.address);
    return { success: true, tokens };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tokens',
    };
  }
}

async function handleGetTransactions(): Promise<{
  success: boolean;
  transactions?: TransactionRecord[];
  error?: string;
}> {
  try {
    const storage = await browser.storage.local.get('transactions');
    const transactions = (storage.transactions || []) as TransactionRecord[];
    return { success: true, transactions };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get transactions',
    };
  }
}

// Main message handler
async function handleMessage(
  message: MessagePayload,
  _sender: chrome.runtime.MessageSender
): Promise<ServiceWorkerResponse> {
  // Reset auto-lock timer on any activity
  if (isUnlocked()) {
    resetLockTimer();
  }
  
  try {
    switch (message.type) {
      case 'CREATE_WALLET': {
        const data = message.data as { mnemonic: string; password: string };
        return await handleCreateWallet(data.mnemonic, data.password);
      }
      
      case 'UNLOCK_WALLET': {
        const data = message.data as { password: string };
        return await handleUnlockWallet(data.password);
      }
      
      case 'LOCK_WALLET':
        return handleLockWallet();
      
      case 'GET_ACCOUNTS':
        return await handleGetAccounts();
      
      case 'GET_BALANCE':
        return await handleGetBalance();
      
      case 'GET_UTXOS':
        return await handleGetUTXOs();
      
      case 'SEND_TRANSACTION': {
        const data = message.data as { to: string; amount: number; fee?: number };
        return await handleSendTransaction(data.to, data.amount, data.fee);
      }
      
      case 'SIGN_MESSAGE': {
        const data = message.data as { message: string };
        return await handleSignMessage(data.message);
      }
      
      case 'GET_INSCRIPTIONS':
        return await handleGetInscriptions();
      
      case 'GET_DRC20_TOKENS':
        return await handleGetDRC20Tokens();
      
      case 'GET_TRANSACTIONS':
        return await handleGetTransactions();
      
      default:
        return { success: false, error: `Unknown message type: ${message.type}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Listen for messages from popup and content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message as MessagePayload, sender)
    .then(sendResponse)
    .catch((error) => {
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });
  
  // Return true to indicate async response
  return true;
});

// Listen for extension install/update
browser.runtime.onInstalled.addListener((details) => {
  console.log('Dogendary Wallet installed:', details.reason);
});

// Export for testing
export { handleMessage, clearSession, isUnlocked };
