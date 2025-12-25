/**
 * Cryptographic utilities for Dogendary Wallet
 * Handles encryption, decryption, and password validation
 */

import type { EncryptedVault, PasswordValidation } from '@/types';

// PBKDF2 iterations - high for security
const PBKDF2_ITERATIONS = 600000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;

/**
 * Generate a random ID
 */
export function generateId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert Uint8Array to base64 string
 */
function toBase64(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data));
}

/**
 * Convert base64 string to Uint8Array
 */
function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derive an encryption key from password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive the actual encryption key - create a new ArrayBuffer copy
  const saltBuffer = new ArrayBuffer(salt.length);
  new Uint8Array(saltBuffer).set(salt);

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data with password
 */
export async function encryptData(plaintext: string, password: string): Promise<EncryptedVault> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Generate random salt and IV
  const salt = new Uint8Array(SALT_LENGTH);
  const iv = new Uint8Array(IV_LENGTH);
  crypto.getRandomValues(salt);
  crypto.getRandomValues(iv);

  // Derive encryption key
  const key = await deriveKey(password, salt);

  // Create IV ArrayBuffer copy for AES-GCM
  const ivBuffer = new ArrayBuffer(iv.length);
  new Uint8Array(ivBuffer).set(iv);

  // Encrypt the data
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    data
  );

  return {
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(encryptedBuffer)),
    version: 1
  };
}

/**
 * Decrypt data with password
 */
export async function decryptData(vault: EncryptedVault, password: string): Promise<string> {
  // Decode base64 values
  const salt = fromBase64(vault.salt);
  const iv = fromBase64(vault.iv);
  const encryptedData = fromBase64(vault.data);

  // Derive the same key
  const key = await deriveKey(password, salt);

  // Create ArrayBuffer copies for WebCrypto API
  const ivBuffer = new ArrayBuffer(iv.length);
  new Uint8Array(ivBuffer).set(iv);

  const dataBuffer = new ArrayBuffer(encryptedData.length);
  new Uint8Array(dataBuffer).set(encryptedData);

  // Decrypt the data
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    dataBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): PasswordValidation {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password must be at least 8 characters');
  }

  if (password.length >= 12) {
    score += 1;
  }

  if (password.length >= 16) {
    score += 1;
  }

  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add uppercase letters');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add numbers');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Add special characters');
  }

  // Common pattern checks
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeated characters');
  }

  if (/^(123|abc|qwerty|password)/i.test(password)) {
    score -= 2;
    feedback.push('Avoid common patterns');
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(score, 7));

  return {
    isValid: score >= 4 && password.length >= 8,
    score,
    feedback
  };
}

/**
 * Hash data using SHA-256
 */
export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a secure random mnemonic entropy
 */
export function generateEntropy(bits: 128 | 256 = 128): Uint8Array {
  const bytes = bits / 8;
  const entropy = new Uint8Array(bytes);
  crypto.getRandomValues(entropy);
  return entropy;
}

/**
 * Securely clear sensitive data from memory
 */
export function secureClear(data: Uint8Array | string): void {
  if (typeof data === 'string') {
    // Can't really clear strings in JS, but we can overwrite arrays
    return;
  }
  crypto.getRandomValues(data);
  data.fill(0);
}

// Aliases for backward compatibility with service-worker
export const encryptVault = encryptData;
export const decryptVault = decryptData;
