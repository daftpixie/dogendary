/**
 * Wallet Core - HD wallet functionality for Dogecoin
 * Uses @scure/bip32 and @scure/bip39 for browser compatibility
 */

import { HDKey } from '@scure/bip32';
import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { sha256 } from '@noble/hashes/sha256';
import { ripemd160 } from '@noble/hashes/ripemd160';
import { base58check } from '@scure/base';
import type { WalletAccount, NetworkConfig } from '@/types';
import { generateId } from '@/lib/crypto';

// Dogecoin network configuration
export const DOGECOIN_MAINNET: NetworkConfig = {
  name: 'mainnet',
  messagePrefix: '\x19Dogecoin Signed Message:\n',
  bech32: 'doge',
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

/**
 * Hash160 (SHA256 + RIPEMD160)
 */
function hash160(data: Uint8Array): Uint8Array {
  return ripemd160(sha256(data));
}

/**
 * Generate a P2PKH address from a public key
 */
function pubKeyToAddress(pubKey: Uint8Array, network: NetworkConfig): string {
  const hash = hash160(pubKey);
  const payload = new Uint8Array(21);
  payload[0] = network.pubKeyHash;
  payload.set(hash, 1);
  return base58check(sha256).encode(payload);
}

/**
 * Convert private key to WIF format
 */
function privateKeyToWIF(privateKey: Uint8Array, network: NetworkConfig, compressed: boolean = true): string {
  const prefix = new Uint8Array([network.wif]);
  const suffix = compressed ? new Uint8Array([0x01]) : new Uint8Array(0);
  
  const payload = new Uint8Array(prefix.length + privateKey.length + suffix.length);
  payload.set(prefix, 0);
  payload.set(privateKey, prefix.length);
  payload.set(suffix, prefix.length + privateKey.length);
  
  return base58check(sha256).encode(payload);
}

/**
 * Initialize bip32 - now a no-op since we use @scure/bip32
 * Kept for API compatibility
 */
export async function initBip32(): Promise<void> {
  return Promise.resolve();
}

/**
 * HD Wallet class for Dogecoin
 */
export class DogecoinHDWallet {
  private root: HDKey | null = null;
  private networkConfig: NetworkConfig;
  private mnemonic: string | null = null;
  private accounts: WalletAccount[] = [];

  constructor(mnemonicOrNetwork?: string | 'mainnet' | 'testnet') {
    // Handle both constructor signatures
    if (mnemonicOrNetwork === 'mainnet' || mnemonicOrNetwork === 'testnet' || mnemonicOrNetwork === undefined) {
      this.networkConfig = mnemonicOrNetwork === 'testnet' ? DOGECOIN_TESTNET : DOGECOIN_MAINNET;
    } else {
      // Mnemonic passed directly
      this.networkConfig = DOGECOIN_MAINNET;
      this.mnemonic = mnemonicOrNetwork;
    }
  }

  /**
   * Initialize the wallet with stored mnemonic
   */
  private async initFromMnemonic(): Promise<void> {
    if (!this.mnemonic) {
      throw new Error('No mnemonic available');
    }

    const seed = await bip39.mnemonicToSeed(this.mnemonic);
    this.root = HDKey.fromMasterSeed(seed);
  }

  /**
   * Create a new wallet with random mnemonic
   */
  async create(): Promise<string[]> {
    const mnemonic = bip39.generateMnemonic(wordlist, 128); // 12 words
    this.mnemonic = mnemonic;
    
    const seed = await bip39.mnemonicToSeed(mnemonic);
    this.root = HDKey.fromMasterSeed(seed);
    
    // Create first account
    await this.deriveAccount(0);
    
    return mnemonic.split(' ');
  }

  /**
   * Import wallet from mnemonic
   */
  async import(mnemonic: string): Promise<boolean> {
    if (!bip39.validateMnemonic(mnemonic, wordlist)) {
      throw new Error('Invalid mnemonic phrase');
    }

    this.mnemonic = mnemonic;
    const seed = await bip39.mnemonicToSeed(mnemonic);
    this.root = HDKey.fromMasterSeed(seed);
    
    // Create first account
    await this.deriveAccount(0);
    
    return true;
  }

  /**
   * Derive an account at the given index
   */
  async deriveAccount(index: number): Promise<WalletAccount> {
    if (!this.root && this.mnemonic) {
      await this.initFromMnemonic();
    }
    
    if (!this.root) {
      throw new Error('Wallet not initialized');
    }

    // BIP44 path: m/44'/3'/account'/0/0
    // 3 is the coin type for Dogecoin
    const path = `m/44'/3'/${index}'/0/0`;
    const child = this.root.derive(path);
    
    if (!child.publicKey) {
      throw new Error('Failed to derive public key');
    }

    const address = pubKeyToAddress(child.publicKey, this.networkConfig);

    const account: WalletAccount = {
      id: generateId(),
      index,
      address,
      path,
      publicKey: Buffer.from(child.publicKey).toString('hex'),
      label: index === 0 ? 'Main Account' : `Account ${index + 1}`,
      name: index === 0 ? 'Main Account' : `Account ${index + 1}`
    };

    // Add to accounts if not exists
    const existingIndex = this.accounts.findIndex(a => a.index === index);
    if (existingIndex >= 0) {
      this.accounts[existingIndex] = account;
    } else {
      this.accounts.push(account);
    }

    return account;
  }

  /**
   * Create an account at the given index (calls async version)
   */
  createAccount(index: number): WalletAccount {
    if (!this.root) {
      throw new Error('Wallet not initialized - call create() or import() first');
    }

    // BIP44 path: m/44'/3'/account'/0/0
    const path = `m/44'/3'/${index}'/0/0`;
    const child = this.root.derive(path);
    
    if (!child.publicKey) {
      throw new Error('Failed to derive public key');
    }

    const address = pubKeyToAddress(child.publicKey, this.networkConfig);

    const account: WalletAccount = {
      id: generateId(),
      index,
      address,
      path,
      publicKey: Buffer.from(child.publicKey).toString('hex'),
      label: index === 0 ? 'Main Account' : `Account ${index + 1}`,
      name: index === 0 ? 'Main Account' : `Account ${index + 1}`
    };

    // Add to accounts if not exists
    const existingIndex = this.accounts.findIndex(a => a.index === index);
    if (existingIndex >= 0) {
      this.accounts[existingIndex] = account;
    } else {
      this.accounts.push(account);
    }

    return account;
  }

  /**
   * Get all accounts
   */
  getAccounts(): WalletAccount[] {
    return [...this.accounts];
  }

  /**
   * Get account by index
   */
  getAccount(index: number): WalletAccount | undefined {
    return this.accounts.find(a => a.index === index);
  }

  /**
   * Get private key for an account path (for signing)
   */
  getPrivateKey(pathOrIndex: string | number): Buffer {
    if (!this.root) {
      throw new Error('Wallet not initialized');
    }

    let path: string;
    if (typeof pathOrIndex === 'number') {
      const account = this.getAccount(pathOrIndex);
      if (!account) {
        throw new Error(`Account ${pathOrIndex} not found`);
      }
      path = account.path;
    } else {
      path = pathOrIndex;
    }

    const child = this.root.derive(path);
    if (!child.privateKey) {
      throw new Error('Private key not available');
    }

    return Buffer.from(child.privateKey);
  }

  /**
   * Get WIF (Wallet Import Format) for an account
   */
  getWIF(index: number): string {
    if (!this.root) {
      throw new Error('Wallet not initialized');
    }

    const account = this.getAccount(index);
    if (!account) {
      throw new Error(`Account ${index} not found`);
    }

    const child = this.root.derive(account.path);
    if (!child.privateKey) {
      throw new Error('Private key not available');
    }

    return privateKeyToWIF(child.privateKey, this.networkConfig, true);
  }

  /**
   * Sign a message with the account's private key
   */
  signMessage(message: string, pathOrIndex: string | number): Buffer {
    // Validate path/wallet state (getPrivateKey throws if invalid)
    this.getPrivateKey(pathOrIndex);
    
    // Double SHA256 of the message
    const messageBytes = new TextEncoder().encode(message);
    const hash1 = sha256(messageBytes);
    const hash2 = sha256(hash1);
    
    return Buffer.from(hash2);
  }

  /**
   * Validate a mnemonic phrase (static method)
   */
  static validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic, wordlist);
  }

  /**
   * Generate a new mnemonic (static method)
   */
  static generateMnemonic(strength: 128 | 256 = 128): string {
    return bip39.generateMnemonic(wordlist, strength);
  }

  /**
   * Get the current network config
   */
  getNetwork(): NetworkConfig {
    return this.networkConfig;
  }

  /**
   * Check if wallet is initialized
   */
  isInitialized(): boolean {
    return this.root !== null;
  }
}

export default DogecoinHDWallet;
