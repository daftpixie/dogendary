/**
 * Transaction Builder - Build and sign Dogecoin transactions
 * Simplified version using @noble libraries for browser compatibility
 */

import { sha256 } from '@noble/hashes/sha256';
import { base58check } from '@scure/base';
import type { UTXO, TransactionParams, NetworkConfig } from '@/types';
import { DOGECOIN_MAINNET, DOGECOIN_TESTNET } from './wallet-core';
import * as ecc from './secp256k1-adapter';

// Signer interface
interface Signer {
  publicKey: Uint8Array;
  sign(hash: Uint8Array): Uint8Array;
}

/**
 * Create a signer from a private key
 */
function createSigner(privateKey: Buffer): Signer {
  const publicKeyBytes = ecc.pointFromScalar(privateKey, true);
  if (!publicKeyBytes) {
    throw new Error('Invalid private key');
  }
  
  return {
    publicKey: publicKeyBytes,
    sign(hash: Uint8Array): Uint8Array {
      return ecc.sign(new Uint8Array(hash), new Uint8Array(privateKey));
    }
  };
}

/**
 * Double SHA256 hash
 */
function hash256(data: Uint8Array): Uint8Array {
  return sha256(sha256(data));
}

/**
 * Encode a variable length integer
 */
function encodeVarInt(n: number): Uint8Array {
  if (n < 0xfd) {
    return new Uint8Array([n]);
  } else if (n <= 0xffff) {
    const buf = new Uint8Array(3);
    buf[0] = 0xfd;
    buf[1] = n & 0xff;
    buf[2] = (n >> 8) & 0xff;
    return buf;
  } else if (n <= 0xffffffff) {
    const buf = new Uint8Array(5);
    buf[0] = 0xfe;
    buf[1] = n & 0xff;
    buf[2] = (n >> 8) & 0xff;
    buf[3] = (n >> 16) & 0xff;
    buf[4] = (n >> 24) & 0xff;
    return buf;
  } else {
    throw new Error('Value too large for varint');
  }
}

/**
 * Write a 32-bit little-endian integer
 */
function writeUInt32LE(n: number): Uint8Array {
  const buf = new Uint8Array(4);
  buf[0] = n & 0xff;
  buf[1] = (n >> 8) & 0xff;
  buf[2] = (n >> 16) & 0xff;
  buf[3] = (n >> 24) & 0xff;
  return buf;
}

/**
 * Write a 64-bit little-endian integer (for satoshi amounts)
 */
function writeUInt64LE(n: number): Uint8Array {
  const buf = new Uint8Array(8);
  // JavaScript can handle up to 2^53 - 1 safely
  buf[0] = n & 0xff;
  buf[1] = (n >> 8) & 0xff;
  buf[2] = (n >> 16) & 0xff;
  buf[3] = (n >> 24) & 0xff;
  // For values > 32 bits
  const high = Math.floor(n / 0x100000000);
  buf[4] = high & 0xff;
  buf[5] = (high >> 8) & 0xff;
  buf[6] = (high >> 16) & 0xff;
  buf[7] = (high >> 24) & 0xff;
  return buf;
}

/**
 * Reverse a byte array (for txid display)
 */
function reverseBytes(bytes: Uint8Array): Uint8Array {
  const reversed = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    reversed[i] = bytes[bytes.length - 1 - i];
  }
  return reversed;
}

/**
 * Convert hex string to bytes
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Convert bytes to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Concatenate multiple Uint8Arrays
 */
function concat(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Create P2PKH scriptPubKey from address
 */
function addressToScriptPubKey(address: string, _network: NetworkConfig): Uint8Array {
  const decoded = base58check(sha256).decode(address);
  const pubKeyHash = decoded.slice(1); // Remove version byte
  
  // OP_DUP OP_HASH160 <20 bytes> OP_EQUALVERIFY OP_CHECKSIG
  return new Uint8Array([
    0x76, // OP_DUP
    0xa9, // OP_HASH160
    0x14, // Push 20 bytes
    ...pubKeyHash,
    0x88, // OP_EQUALVERIFY
    0xac  // OP_CHECKSIG
  ]);
}

/**
 * Create scriptSig for P2PKH
 */
function createScriptSig(signature: Uint8Array, publicKey: Uint8Array): Uint8Array {
  // DER signature + SIGHASH_ALL + public key
  const sigWithHashType = concat(signature, new Uint8Array([0x01])); // SIGHASH_ALL
  
  return concat(
    new Uint8Array([sigWithHashType.length]),
    sigWithHashType,
    new Uint8Array([publicKey.length]),
    publicKey
  );
}

// Dust threshold in satoshis
const DUST_THRESHOLD = 100000; // 0.001 DOGE

// Default fee per byte in satoshis
const DEFAULT_FEE_PER_BYTE = 100; // 0.000001 DOGE per byte

/**
 * UTXO Manager for tracking and selecting UTXOs
 */
export class UTXOManager {
  private utxos: UTXO[] = [];
  private inscriptionUtxos: Set<string> = new Set();

  setUtxos(utxos: UTXO[]): void {
    this.utxos = utxos;
    this.inscriptionUtxos.clear();
    utxos.forEach(utxo => {
      if (utxo.isInscription || utxo.inscriptionId) {
        this.inscriptionUtxos.add(`${utxo.txid}:${utxo.vout}`);
      }
    });
  }

  getSpendableUtxos(): UTXO[] {
    return this.utxos.filter(utxo => {
      const key = `${utxo.txid}:${utxo.vout}`;
      return !this.inscriptionUtxos.has(key);
    });
  }

  selectUtxos(targetAmount: number, feeEstimate: number = 0): { selected: UTXO[]; total: number } {
    const spendable = this.getSpendableUtxos()
      .filter(u => u.confirmations > 0)
      .sort((a, b) => b.value - a.value);

    const selected: UTXO[] = [];
    let total = 0;
    const required = targetAmount + feeEstimate;

    for (const utxo of spendable) {
      selected.push(utxo);
      total += utxo.value;
      if (total >= required) break;
    }

    return { selected, total };
  }

  getTotalBalance(): number {
    return this.getSpendableUtxos().reduce((sum, utxo) => sum + utxo.value, 0);
  }

  isInscriptionUtxo(txid: string, vout: number): boolean {
    return this.inscriptionUtxos.has(`${txid}:${vout}`);
  }
}

/**
 * Transaction Builder for Dogecoin
 */
export class TransactionBuilder {
  private utxoManager: UTXOManager;

  constructor() {
    this.utxoManager = new UTXOManager();
  }

  setUtxos(utxos: UTXO[]): void {
    this.utxoManager.setUtxos(utxos);
  }

  estimateFee(inputCount: number, outputCount: number, feePerByte: number = DEFAULT_FEE_PER_BYTE): number {
    const estimatedSize = 10 + (inputCount * 148) + (outputCount * 34);
    return estimatedSize * feePerByte;
  }

  async buildTransaction(
    params: TransactionParams,
    utxos: UTXO[],
    privateKeys: Buffer[],
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<{ txHex: string; txid: string; fee: number }> {
    const networkConfig = network === 'mainnet' ? DOGECOIN_MAINNET : DOGECOIN_TESTNET;
    
    const amountSatoshis = Math.round(params.amount * 100000000);
    this.utxoManager.setUtxos(utxos);
    
    const feeEstimate = params.fee 
      ? Math.round(params.fee * 100000000)
      : this.estimateFee(2, 2);
    
    const { selected, total } = this.utxoManager.selectUtxos(amountSatoshis, feeEstimate);
    
    if (total < amountSatoshis + feeEstimate) {
      throw new Error('Insufficient funds');
    }

    // Build outputs
    const outputs: { address: string; value: number }[] = [
      { address: params.to, value: amountSatoshis }
    ];

    // Add change output if needed
    const actualFee = feeEstimate;
    const change = total - amountSatoshis - actualFee;
    
    if (change > DUST_THRESHOLD && selected.length > 0) {
      outputs.push({ address: selected[0].address, value: change });
    }

    // Create signers
    const signers = privateKeys.map(pk => createSigner(pk));

    // SIGHASH_ALL for signing
    const hashType = writeUInt32LE(1);

    // For each input, create a signing hash and sign
    const signatures: Uint8Array[] = [];
    
    for (let i = 0; i < selected.length; i++) {
      const utxo = selected[i];
      
      // Build the transaction for signing this input
      // (simplified - proper implementation would use BIP143 for segwit)
      const txForSigning = this.buildTxForSigning(
        selected,
        outputs,
        i,
        hexToBytes(utxo.script),
        networkConfig
      );
      
      const sigHash = hash256(concat(txForSigning, hashType));
      const signature = ecc.signDER(sigHash, new Uint8Array(privateKeys[i % privateKeys.length]));
      signatures.push(signature);
    }

    // Build final transaction with signatures
    const finalTx = this.buildSignedTx(selected, outputs, signatures, signers, networkConfig);
    const txid = bytesToHex(reverseBytes(hash256(finalTx)));

    return {
      txHex: bytesToHex(finalTx),
      txid,
      fee: actualFee / 100000000
    };
  }

  private buildTxForSigning(
    inputs: UTXO[],
    outputs: { address: string; value: number }[],
    signingIndex: number,
    scriptPubKey: Uint8Array,
    network: NetworkConfig
  ): Uint8Array {
    const parts: Uint8Array[] = [];
    
    // Version
    parts.push(writeUInt32LE(1));
    
    // Inputs
    parts.push(encodeVarInt(inputs.length));
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      // Previous txid (reversed)
      parts.push(reverseBytes(hexToBytes(input.txid)));
      // Previous output index
      parts.push(writeUInt32LE(input.vout));
      // Script (only for the input being signed)
      if (i === signingIndex) {
        parts.push(encodeVarInt(scriptPubKey.length));
        parts.push(scriptPubKey);
      } else {
        parts.push(new Uint8Array([0x00])); // Empty script
      }
      // Sequence
      parts.push(writeUInt32LE(0xffffffff));
    }
    
    // Outputs
    parts.push(encodeVarInt(outputs.length));
    for (const output of outputs) {
      parts.push(writeUInt64LE(output.value));
      const scriptPubKey = addressToScriptPubKey(output.address, network);
      parts.push(encodeVarInt(scriptPubKey.length));
      parts.push(scriptPubKey);
    }
    
    // Locktime
    parts.push(writeUInt32LE(0));
    
    return concat(...parts);
  }

  private buildSignedTx(
    inputs: UTXO[],
    outputs: { address: string; value: number }[],
    signatures: Uint8Array[],
    signers: Signer[],
    network: NetworkConfig
  ): Uint8Array {
    const parts: Uint8Array[] = [];
    
    // Version
    parts.push(writeUInt32LE(1));
    
    // Inputs
    parts.push(encodeVarInt(inputs.length));
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const signer = signers[i % signers.length];
      const signature = signatures[i];
      
      // Previous txid (reversed)
      parts.push(reverseBytes(hexToBytes(input.txid)));
      // Previous output index
      parts.push(writeUInt32LE(input.vout));
      // ScriptSig
      const scriptSig = createScriptSig(signature, signer.publicKey);
      parts.push(encodeVarInt(scriptSig.length));
      parts.push(scriptSig);
      // Sequence
      parts.push(writeUInt32LE(0xffffffff));
    }
    
    // Outputs
    parts.push(encodeVarInt(outputs.length));
    for (const output of outputs) {
      parts.push(writeUInt64LE(output.value));
      const scriptPubKey = addressToScriptPubKey(output.address, network);
      parts.push(encodeVarInt(scriptPubKey.length));
      parts.push(scriptPubKey);
    }
    
    // Locktime
    parts.push(writeUInt32LE(0));
    
    return concat(...parts);
  }

  async createSendTransaction(
    to: string,
    amount: number,
    privateKey: Buffer,
    utxos: UTXO[],
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<{ txHex: string; txid: string; fee: number }> {
    return this.buildTransaction(
      { to, amount },
      utxos,
      [privateKey],
      network
    );
  }
}

export default TransactionBuilder;
