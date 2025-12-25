// ============================================
// Dogendary Wallet - Wallet Core (FIXED v2)
// Fixed: @noble/curves import issue
// ============================================

import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { HDKey } from '@scure/bip32';
import { sha256 } from '@noble/hashes/sha256';
import { ripemd160 } from '@noble/hashes/ripemd160';
import { base58check } from '@scure/base';
import * as secp256k1 from '@noble/secp256k1';
import type { WalletAccount, NetworkType } from '@/types';

interface DogecoinNetworkConfig {
  name: string;
  type: NetworkType;
  messagePrefix: string;
  pubKeyHash: number;
  scriptHash: number;
  wif: number;
  bip32: {
    public: number;
    private: number;
  };
}

const DOGECOIN_MAINNET: DogecoinNetworkConfig = {
  name: 'Dogecoin Mainnet',
  type: 'mainnet',
  messagePrefix: '\x19Dogecoin Signed Message:\n',
  pubKeyHash: 0x1e,
  scriptHash: 0x16,
  wif: 0x9e,
  bip32: {
    public: 0x02facafd,
    private: 0x02fac398,
  },
};

const DOGECOIN_TESTNET: DogecoinNetworkConfig = {
  name: 'Dogecoin Testnet',
  type: 'testnet',
  messagePrefix: '\x19Dogecoin Signed Message:\n',
  pubKeyHash: 0x71,
  scriptHash: 0xc4,
  wif: 0xf1,
  bip32: {
    public: 0x043587cf,
    private: 0x04358394,
  },
};

export function getNetworkConfig(network: NetworkType): DogecoinNetworkConfig {
  return network === 'mainnet' ? DOGECOIN_MAINNET : DOGECOIN_TESTNET;
}

const DOGECOIN_PATH = "m/44'/3'/0'/0";

export class WalletCore {
  private hdKey: HDKey | null = null;
  private network: DogecoinNetworkConfig;

  constructor(network: NetworkType = 'mainnet') {
    this.network = getNetworkConfig(network);
  }

  static generateMnemonic(strength: 128 | 256 = 128): string {
    return bip39.generateMnemonic(wordlist, strength);
  }

  static validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic, wordlist);
  }

  async initFromMnemonic(mnemonic: string): Promise<void> {
    if (!WalletCore.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }
    const seed = await bip39.mnemonicToSeed(mnemonic);
    this.hdKey = HDKey.fromMasterSeed(seed);
  }

  deriveAccount(index: number): WalletAccount {
    if (!this.hdKey) {
      throw new Error('Wallet not initialized');
    }

    const path = `${DOGECOIN_PATH}/${index}`;
    const child = this.hdKey.derive(path);

    if (!child.publicKey) {
      throw new Error('Failed to derive public key');
    }

    const address = this.publicKeyToAddress(child.publicKey);

    return {
      id: `account-${index}`,
      name: index === 0 ? 'Main Account' : `Account ${index + 1}`,
      address,
      path,
      index,
      label: index === 0 ? 'Primary' : undefined,
    };
  }

  deriveAccounts(count: number): WalletAccount[] {
    const accounts: WalletAccount[] = [];
    for (let i = 0; i < count; i++) {
      accounts.push(this.deriveAccount(i));
    }
    return accounts;
  }

  getPrivateKeyWIF(index: number): string {
    if (!this.hdKey) {
      throw new Error('Wallet not initialized');
    }

    const path = `${DOGECOIN_PATH}/${index}`;
    const child = this.hdKey.derive(path);

    if (!child.privateKey) {
      throw new Error('Failed to derive private key');
    }

    return this.privateKeyToWIF(child.privateKey);
  }

  private publicKeyToAddress(publicKey: Uint8Array): string {
    const sha = sha256(publicKey);
    const hash160 = ripemd160(sha);
    const prefixed = new Uint8Array(21);
    prefixed[0] = this.network.pubKeyHash;
    prefixed.set(hash160, 1);
    return base58check(sha256).encode(prefixed);
  }

  private privateKeyToWIF(privateKey: Uint8Array): string {
    const extended = new Uint8Array(34);
    extended[0] = this.network.wif;
    extended.set(privateKey, 1);
    extended[33] = 0x01;
    return base58check(sha256).encode(extended);
  }

  async signMessage(message: string, accountIndex: number): Promise<string> {
    if (!this.hdKey) {
      throw new Error('Wallet not initialized');
    }

    const path = `${DOGECOIN_PATH}/${accountIndex}`;
    const child = this.hdKey.derive(path);

    if (!child.privateKey) {
      throw new Error('Failed to derive private key');
    }

    const prefix = this.network.messagePrefix;
    const prefixBytes = new TextEncoder().encode(prefix);
    const messageBytes = new TextEncoder().encode(message);
    
    const fullMessage = new Uint8Array(
      1 + prefixBytes.length + 1 + messageBytes.length
    );
    fullMessage[0] = prefixBytes.length;
    fullMessage.set(prefixBytes, 1);
    fullMessage[1 + prefixBytes.length] = messageBytes.length;
    fullMessage.set(messageBytes, 2 + prefixBytes.length);

    const hash = sha256(sha256(fullMessage));

    // FIX: Use @noble/secp256k1 directly instead of dynamic import
    const signature = await secp256k1.signAsync(hash, child.privateKey);
    return Buffer.from(signature.toCompactRawBytes()).toString('base64');
  }

  async getAccountWithBalance(index: number): Promise<WalletAccount> {
    return this.deriveAccount(index);
  }

  clear(): void {
    this.hdKey = null;
  }
}

export default WalletCore;
