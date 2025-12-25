/**
 * secp256k1-adapter.ts
 * Browser-compatible adapter that provides tiny-secp256k1 API using @noble/secp256k1 v2.x
 * This allows bitcoinjs-lib, bip32, and ecpair to work in browser environments
 * 
 * Note: Some type assertions are needed because @noble/secp256k1 types don't fully match runtime API
 */

import * as secp from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { hmac } from '@noble/hashes/hmac';

if (secp.etc) {
    secp.etc.hmacSha256Sync = (k, m) => hmac(sha256, k, m);
    secp.etc.hmacSha256Async = async (k, m) => hmac(sha256, k, m);
}

// Curve order for modular arithmetic
const CURVE_ORDER = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

// Type for Signature with methods that exist at runtime
interface SignatureWithMethods {
  r: bigint;
  s: bigint;
  recovery?: number;
  toCompactRawBytes(): Uint8Array;
  toDERRawBytes(): Uint8Array;
  normalizeS(): SignatureWithMethods;
  addRecoveryBit(recovery: number): SignatureWithMethods;
  recoverPublicKey(msgHash: Uint8Array): { toBytes(compressed?: boolean): Uint8Array };
}

// Type for Signature class with static methods
interface SignatureStatic {
  fromCompact(hex: string): SignatureWithMethods;
  fromDER(hex: string): SignatureWithMethods;
}

// Cast Signature to access static methods
const SignatureClass = secp.Signature as unknown as SignatureStatic;

// Helper: Convert Uint8Array to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper: Convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// Helper: Convert Uint8Array to BigInt
function bytesToBigInt(bytes: Uint8Array): bigint {
  return BigInt('0x' + bytesToHex(bytes));
}

// Helper: Convert BigInt to Uint8Array
function bigIntToBytes(n: bigint, length: number): Uint8Array {
  const hex = n.toString(16).padStart(length * 2, '0');
  return hexToBytes(hex);
}

/**
 * Check if a point (public key) is valid
 */
export function isPoint(p: Uint8Array): boolean {
  try {
    secp.Point.fromHex(bytesToHex(p));
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a private key is valid
 */
export function isPrivate(d: Uint8Array): boolean {
  if (d.length !== 32) return false;
  const n = bytesToBigInt(d);
  return n > 0n && n < CURVE_ORDER;
}

/**
 * Get the public key from a private key
 */
export function pointFromScalar(d: Uint8Array, compressed = true): Uint8Array | null {
  try {
    if (!isPrivate(d)) return null;
    return secp.getPublicKey(d, compressed);
  } catch {
    return null;
  }
}

/**
 * Compress a public key
 */
export function pointCompress(p: Uint8Array, compressed = true): Uint8Array {
  const point = secp.Point.fromHex(bytesToHex(p));
  return point.toBytes(compressed);
}

/**
 * Add a tweak to a point (public key): P + tweak*G
 */
export function pointAddScalar(p: Uint8Array, tweak: Uint8Array, compressed = true): Uint8Array | null {
  try {
    const point = secp.Point.fromHex(bytesToHex(p));
    const tweakNum = bytesToBigInt(tweak);
    if (tweakNum === 0n) return point.toBytes(compressed);
    if (tweakNum >= CURVE_ORDER) return null;
    
    const tweakPoint = secp.Point.BASE.multiply(tweakNum);
    const result = point.add(tweakPoint);
    return result.toBytes(compressed);
  } catch {
    return null;
  }
}

/**
 * Multiply a point by a scalar: P * tweak
 */
export function pointMultiply(p: Uint8Array, tweak: Uint8Array, compressed = true): Uint8Array | null {
  try {
    const point = secp.Point.fromHex(bytesToHex(p));
    const tweakNum = bytesToBigInt(tweak);
    if (tweakNum === 0n) return null;
    if (tweakNum >= CURVE_ORDER) return null;
    
    const result = point.multiply(tweakNum);
    return result.toBytes(compressed);
  } catch {
    return null;
  }
}

/**
 * Add a tweak to a private key: (d + tweak) mod n
 */
export function privateAdd(d: Uint8Array, tweak: Uint8Array): Uint8Array | null {
  try {
    const dNum = bytesToBigInt(d);
    const tweakNum = bytesToBigInt(tweak);
    let result = (dNum + tweakNum) % CURVE_ORDER;
    if (result < 0n) result += CURVE_ORDER;
    if (result === 0n) return null;
    return bigIntToBytes(result, 32);
  } catch {
    return null;
  }
}

/**
 * Negate a private key: n - d
 */
export function privateNegate(d: Uint8Array): Uint8Array {
  const dNum = bytesToBigInt(d);
  const result = CURVE_ORDER - dNum;
  return bigIntToBytes(result, 32);
}

/**
 * Sign a message hash with a private key (returns 64-byte compact signature)
 */
export function sign(h: Uint8Array, d: Uint8Array, e?: Uint8Array): Uint8Array {
  const options = e ? { extraEntropy: e } : undefined;
  // secp.sign returns Signature object at runtime, cast to access methods
  const sig = secp.sign(h, d, options) as unknown as SignatureWithMethods;
  return sig.toCompactRawBytes();
}

/**
 * Sign a message hash and return DER-encoded signature
 */
export function signDER(h: Uint8Array, d: Uint8Array): Uint8Array {
  const sig = secp.sign(h, d) as unknown as SignatureWithMethods;
  return sig.toDERRawBytes();
}

/**
 * Verify a signature
 */
export function verify(h: Uint8Array, Q: Uint8Array, signature: Uint8Array, strict = true): boolean {
  try {
    // Parse signature - handle both compact (64 bytes) and DER formats
    let sig: SignatureWithMethods;
    if (signature.length === 64) {
      sig = SignatureClass.fromCompact(bytesToHex(signature));
    } else {
      sig = SignatureClass.fromDER(bytesToHex(signature));
    }
    
    // Check for low-S if strict mode
    if (strict) {
      const halfN = CURVE_ORDER / 2n;
      if (sig.s > halfN) {
        sig = sig.normalizeS();
      }
    }
    
    // Verify using compact bytes
    return secp.verify(sig.toCompactRawBytes(), h, Q);
  } catch {
    return false;
  }
}

/**
 * Recover public key from signature
 */
export function recover(h: Uint8Array, signature: Uint8Array, recoveryParam: number, compressed = true): Uint8Array | null {
  try {
    const sig = SignatureClass.fromCompact(bytesToHex(signature)).addRecoveryBit(recoveryParam);
    const point = sig.recoverPublicKey(h);
    return point.toBytes(compressed);
  } catch {
    return null;
  }
}

// Default export for compatibility with dynamic imports
const adapter = {
  isPoint,
  isPrivate,
  pointFromScalar,
  pointCompress,
  pointAddScalar,
  pointMultiply,
  privateAdd,
  privateNegate,
  sign,
  signDER,
  verify,
  recover,
};

export default adapter;
