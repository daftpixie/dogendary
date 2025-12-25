/**
 * Utility functions for Dogendary Wallet
 */

/**
 * Format a number with locale-specific formatting
 */
export function formatNumber(
  num: number,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    notation?: 'standard' | 'compact' | 'scientific' | 'engineering';
  }
): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 8,
    notation = 'standard'
  } = options || {};

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
    notation
  }).format(num);
}

/**
 * Format DOGE amount with appropriate precision
 */
export function formatDoge(amount: number, decimals: number = 8): string {
  if (amount === 0) return '0';
  
  // For small amounts, show more precision
  if (amount < 0.0001) {
    return amount.toFixed(decimals);
  }
  
  // For larger amounts, reduce precision
  if (amount >= 1000000) {
    return formatNumber(amount, { notation: 'compact', maximumFractionDigits: 2 });
  }
  
  if (amount >= 1000) {
    return formatNumber(amount, { maximumFractionDigits: 2 });
  }
  
  if (amount >= 1) {
    return formatNumber(amount, { maximumFractionDigits: 4 });
  }
  
  return formatNumber(amount, { maximumFractionDigits: 8 });
}

/**
 * Truncate an address for display
 */
export function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address) return '';
  if (address.length <= startChars + endChars + 3) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Validate a Dogecoin address
 */
export function isValidDogeAddress(address: string): boolean {
  if (!address) return false;
  
  // Mainnet addresses start with D (P2PKH) or A/9 (P2SH)
  // Testnet addresses start with n or m (P2PKH) or 2 (P2SH)
  const mainnetP2PKH = /^D[1-9A-HJ-NP-Za-km-z]{33}$/;
  const mainnetP2SH = /^[A9][1-9A-HJ-NP-Za-km-z]{33}$/;
  const testnetP2PKH = /^[nm][1-9A-HJ-NP-Za-km-z]{33}$/;
  const testnetP2SH = /^2[1-9A-HJ-NP-Za-km-z]{33}$/;
  
  return (
    mainnetP2PKH.test(address) ||
    mainnetP2SH.test(address) ||
    testnetP2PKH.test(address) ||
    testnetP2SH.test(address)
  );
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Format a timestamp to relative time
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp * 1000; // Convert to milliseconds if needed
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 7) {
    return new Date(timestamp * 1000).toLocaleDateString();
  }
  if (days > 0) {
    return `${days}d ago`;
  }
  if (hours > 0) {
    return `${hours}h ago`;
  }
  if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return 'Just now';
}

/**
 * Format a date to a readable string
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Generate a short unique ID
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Parse a DOGE amount string to number
 */
export function parseDogeAmount(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Convert satoshis (koinus) to DOGE
 */
export function satoshisToDoge(satoshis: number): number {
  return satoshis / 100000000;
}

/**
 * Convert DOGE to satoshis (koinus)
 */
export function dogeToSatoshis(doge: number): number {
  return Math.round(doge * 100000000);
}

/**
 * Check if a string is a valid hexadecimal
 */
export function isValidHex(str: string): boolean {
  return /^[0-9a-fA-F]+$/.test(str);
}

/**
 * Check if a string is a valid transaction ID
 */
export function isValidTxId(txid: string): boolean {
  return txid.length === 64 && isValidHex(txid);
}

/**
 * Classnames utility for conditional classes
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
