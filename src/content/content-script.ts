// ============================================
// Dogendary Wallet - Content Script
// Bridges between page scripts and service worker
// ============================================

import browser from 'webextension-polyfill';

interface DogecoinRequest {
  type: 'DOGECOIN_REQUEST';
  id: number;
  payload: {
    method: string;
    params?: unknown[];
  };
}

interface DogecoinResponse {
  type: 'DOGECOIN_RESPONSE';
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface ServiceWorkerResponse {
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface WalletEventMessage {
  type: string;
  data?: unknown;
}

// Inject the provider script into the page
function injectProvider(): void {
  try {
    const script = document.createElement('script');
    script.src = browser.runtime.getURL('injected-provider.js');
    script.type = 'module';
    
    // Remove script after injection
    script.onload = () => {
      script.remove();
    };
    
    (document.head || document.documentElement).appendChild(script);
  } catch (error) {
    console.error('Dogendary: Failed to inject provider', error);
  }
}

// Listen for messages from the page (injected provider)
window.addEventListener('message', async (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;
  
  const data = event.data as DogecoinRequest | undefined;
  
  // Only process Dogecoin requests
  if (!data || data.type !== 'DOGECOIN_REQUEST') return;
  
  const { id, payload } = data;
  
  try {
    // Forward to service worker
    const response = await browser.runtime.sendMessage({
      type: 'PROVIDER_REQUEST',
      data: payload,
      origin: window.location.origin,
    }) as ServiceWorkerResponse;
    
    // Send response back to page
    const responseMessage: DogecoinResponse = {
      type: 'DOGECOIN_RESPONSE',
      id,
      result: response.result,
      error: response.error,
    };
    
    window.postMessage(responseMessage, '*');
  } catch (error) {
    // Send error response
    const errorMessage: DogecoinResponse = {
      type: 'DOGECOIN_RESPONSE',
      id,
      error: {
        code: 5000,
        message: error instanceof Error ? error.message : 'Internal error',
      },
    };
    
    window.postMessage(errorMessage, '*');
  }
});

// Listen for messages from service worker (events)
// Using proper type casting for the message listener
browser.runtime.onMessage.addListener((message: unknown) => {
  const msg = message as WalletEventMessage;
  if (msg.type === 'WALLET_EVENT') {
    window.postMessage({
      type: 'DOGECOIN_EVENT',
      data: msg.data,
    }, '*');
  }
  // Return undefined to indicate async response not needed
  return undefined;
});

// Inject provider immediately
injectProvider();

// Notify that wallet is available
window.dispatchEvent(new CustomEvent('dogendary#initialized'));

export {};
