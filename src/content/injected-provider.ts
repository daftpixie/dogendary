// ============================================
// Dogendary Wallet - Injected Provider
// window.dogecoin API for dApp integration
// Runs in main world (page context)
// ============================================

interface ProviderRequest {
  method: string;
  params?: unknown[];
}

interface ProviderResponse {
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface DogecoinProvider {
  isDogendary: boolean;
  isDogeWallet: boolean;
  version: string;
  request: (args: ProviderRequest) => Promise<unknown>;
  connect: () => Promise<string[]>;
  disconnect: () => Promise<void>;
  getAccounts: () => Promise<string[]>;
  getChainId: () => Promise<string>;
  getBalance: () => Promise<{ confirmed: number; unconfirmed: number; total: number }>;
  signMessage: (message: string, address: string) => Promise<string>;
  sendTransaction: (params: { to: string; amount: number }) => Promise<string>;
  getInscriptions: () => Promise<unknown[]>;
  getDRC20Balances: () => Promise<unknown[]>;
  on: (event: string, callback: (data: unknown) => void) => void;
  removeListener: (event: string, callback: (data: unknown) => void) => void;
}

/**
 * Dogendary Dogecoin Provider
 * EIP-1193-style provider adapted for Dogecoin
 */
class DogendaryProvider implements DogecoinProvider {
  isDogendary = true;
  isDogeWallet = true;
  version = '1.0.0';

  private requestId = 0;
  private pending = new Map<number, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }>();
  private eventListeners = new Map<string, Set<(data: unknown) => void>>();

  constructor() {
    this.setupMessageListener();
    this.setupEventListener();
  }

  /**
   * Set up listener for responses from content script
   */
  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      if (event.data?.type !== 'DOGECOIN_RESPONSE') return;

      const { id, result, error } = event.data as ProviderResponse;
      const pending = this.pending.get(id);
      
      if (!pending) return;
      
      this.pending.delete(id);

      if (error) {
        const err = new Error(error.message);
        (err as unknown as { code: number }).code = error.code;
        pending.reject(err);
      } else {
        pending.resolve(result);
      }
    });
  }

  /**
   * Set up listener for events from extension
   */
  private setupEventListener(): void {
    window.addEventListener('message', (event) => {
      if (event.source !== window) return;
      if (event.data?.type !== 'DOGECOIN_EVENT') return;

      const { event: eventName, data } = event.data;
      this.emit(eventName, data);
    });
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Dogendary: Event listener error', error);
        }
      });
    }
  }

  /**
   * Core request method - sends requests to extension
   */
  async request({ method, params }: ProviderRequest): Promise<unknown> {
    const id = ++this.requestId;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });

      // Send message to content script
      window.postMessage({
        type: 'DOGECOIN_REQUEST',
        id,
        payload: { method, params },
      }, '*');

      // Timeout after 60 seconds
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 60000);
    });
  }

  // ================== Convenience Methods ==================

  /**
   * Request accounts (connect)
   */
  async connect(): Promise<string[]> {
    return this.request({ method: 'doge_requestAccounts' }) as Promise<string[]>;
  }

  /**
   * Disconnect from dApp
   */
  async disconnect(): Promise<void> {
    // Note: This is a frontend-only operation
    // The connection is managed by the extension
    this.emit('disconnect', null);
  }

  /**
   * Get connected accounts
   */
  async getAccounts(): Promise<string[]> {
    return this.request({ method: 'doge_accounts' }) as Promise<string[]>;
  }

  /**
   * Get chain ID
   */
  async getChainId(): Promise<string> {
    return this.request({ method: 'doge_chainId' }) as Promise<string>;
  }

  /**
   * Get balance
   */
  async getBalance(): Promise<{ confirmed: number; unconfirmed: number; total: number }> {
    return this.request({ method: 'doge_getBalance' }) as Promise<{
      confirmed: number;
      unconfirmed: number;
      total: number;
    }>;
  }

  /**
   * Sign a message
   */
  async signMessage(message: string, address: string): Promise<string> {
    return this.request({
      method: 'doge_signMessage',
      params: [message, address],
    }) as Promise<string>;
  }

  /**
   * Send transaction
   */
  async sendTransaction(params: { to: string; amount: number }): Promise<string> {
    return this.request({
      method: 'doge_sendTransaction',
      params: [params],
    }) as Promise<string>;
  }

  /**
   * Get inscriptions
   */
  async getInscriptions(): Promise<unknown[]> {
    return this.request({ method: 'doge_getInscriptions' }) as Promise<unknown[]>;
  }

  /**
   * Get DRC-20 token balances
   */
  async getDRC20Balances(): Promise<unknown[]> {
    return this.request({ method: 'doge_getDRC20Balances' }) as Promise<unknown[]>;
  }

  // ================== Event Handling ==================

  /**
   * Subscribe to events
   */
  on(event: string, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from events
   */
  removeListener(event: string, callback: (data: unknown) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Alias for removeListener
   */
  off(event: string, callback: (data: unknown) => void): void {
    this.removeListener(event, callback);
  }
}

// ================== Initialize Provider ==================

// Don't re-inject if already present
if (typeof window !== 'undefined' && !(window as unknown as { dogecoin?: DogecoinProvider }).dogecoin) {
  const provider = new DogendaryProvider();
  
  // Expose provider on window
  Object.defineProperty(window, 'dogecoin', {
    value: provider,
    writable: false,
    configurable: false,
  });

  // Also expose as dogendary for explicit access
  Object.defineProperty(window, 'dogendary', {
    value: provider,
    writable: false,
    configurable: false,
  });

  // Dispatch event to notify dApps
  window.dispatchEvent(new Event('dogecoin#initialized'));
  window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
    detail: Object.freeze({
      info: {
        uuid: 'dogendary-wallet-v1',
        name: 'Dogendary Wallet',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="%230B192A"/><text x="16" y="22" text-anchor="middle" fill="%2304D9FF" font-size="16">Ð</text></svg>',
        rdns: 'xyz.24hrmvp.dogendary',
      },
      provider,
    }),
  }));

  console.log('Dogendary Wallet provider injected');
}

export {};
