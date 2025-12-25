// ============================================
// Dogendary Wallet - Indexer Client
// Multi-provider API integration for Dogecoin data
// ============================================

import type {
  Balance,
  UTXO,
  Inscription,
  DRC20Token,
  DunesToken,
  TransactionRecord,
} from '@/types';

// API Provider configurations
const API_PROVIDERS = {
  blockcypher: {
    name: 'BlockCypher',
    base: 'https://api.blockcypher.com/v1/doge/main',
  },
  sochain: {
    name: 'SoChain',
    base: 'https://chain.so/api/v3',
  },
  wonkyord: {
    name: 'Wonky-Ord',
    base: 'https://wonky-ord.dogeord.io',
  },
  drc20: {
    name: 'DRC-20',
    base: 'https://drc-20.org/api',
  },
};

// Response types from various APIs
interface BlockCypherAddressResponse {
  address: string;
  total_received: number;
  total_sent: number;
  balance: number;
  unconfirmed_balance: number;
  final_balance: number;
  n_tx: number;
  txrefs?: BlockCypherTxRef[];
  unconfirmed_txrefs?: BlockCypherTxRef[];
}

interface BlockCypherTxRef {
  tx_hash: string;
  block_height: number;
  tx_input_n: number;
  tx_output_n: number;
  value: number;
  ref_balance: number;
  spent: boolean;
  confirmations: number;
  confirmed: string;
  double_spend: boolean;
}

interface WonkyOrdInscription {
  id: string;
  number: number;
  content_type: string;
  content_length: number;
  genesis_tx: string;
  genesis_height: number;
  sat: number;
  satpoint: string;
  address: string;
}

interface DRC20Balance {
  tick: string;
  balance: string;
  available: string;
  transferable: string;
}

// Cache configuration
const CACHE_TTL = {
  balance: 30 * 1000, // 30 seconds
  utxos: 30 * 1000,
  inscriptions: 5 * 60 * 1000, // 5 minutes
  tokens: 60 * 1000, // 1 minute
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class IndexerCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string, ttl: number): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export class IndexerClient {
  private cache = new IndexerCache();

  // Fetch balance for an address
  async getBalance(address: string): Promise<Balance> {
    const cacheKey = `balance:${address}`;
    const cached = this.cache.get<Balance>(cacheKey, CACHE_TTL.balance);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${API_PROVIDERS.blockcypher.base}/addrs/${address}/balance`
      );
      
      if (!response.ok) {
        throw new Error(`BlockCypher error: ${response.status}`);
      }
      
      const data: BlockCypherAddressResponse = await response.json();
      
      const balance: Balance = {
        confirmed: data.balance,
        unconfirmed: data.unconfirmed_balance,
        total: data.final_balance,
      };
      
      this.cache.set(cacheKey, balance);
      return balance;
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      throw error;
    }
  }

  // Fetch UTXOs for an address
  async getUTXOs(address: string): Promise<UTXO[]> {
    const cacheKey = `utxos:${address}`;
    const cached = this.cache.get<UTXO[]>(cacheKey, CACHE_TTL.utxos);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${API_PROVIDERS.blockcypher.base}/addrs/${address}?unspentOnly=true&includeScript=true`
      );
      
      if (!response.ok) {
        throw new Error(`BlockCypher error: ${response.status}`);
      }
      
      const data: BlockCypherAddressResponse = await response.json();
      
      const utxos: UTXO[] = (data.txrefs || [])
        .filter(tx => !tx.spent)
        .map(tx => ({
          txid: tx.tx_hash,
          vout: tx.tx_output_n,
          value: tx.value,
          confirmations: tx.confirmations,
          script: '', // Would need separate tx fetch for full script
          scriptPubKey: '',
          address: address, // Use the queried address
        }));
      
      this.cache.set(cacheKey, utxos);
      return utxos;
    } catch (error) {
      console.error('Failed to fetch UTXOs:', error);
      throw error;
    }
  }

  // Fetch inscriptions for an address
  async getInscriptions(address: string): Promise<Inscription[]> {
    const cacheKey = `inscriptions:${address}`;
    const cached = this.cache.get<Inscription[]>(cacheKey, CACHE_TTL.inscriptions);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${API_PROVIDERS.wonkyord.base}/inscriptions?address=${address}`
      );
      
      if (!response.ok) {
        throw new Error(`Wonky-Ord error: ${response.status}`);
      }
      
      const data: WonkyOrdInscription[] = await response.json();
      
      const inscriptions: Inscription[] = data.map(insc => ({
        id: insc.id,
        inscriptionId: insc.id,
        number: insc.number,
        inscriptionNumber: insc.number,
        contentType: insc.content_type,
        content: '', // Content would need separate fetch
        contentUrl: `${API_PROVIDERS.wonkyord.base}/content/${insc.id}`,
        genesisTransaction: insc.genesis_tx,
        satpoint: insc.satpoint,
        timestamp: Date.now(), // Would need block timestamp
        owner: insc.address,
        location: insc.satpoint,
      }));
      
      this.cache.set(cacheKey, inscriptions);
      return inscriptions;
    } catch (error) {
      console.error('Failed to fetch inscriptions:', error);
      throw error;
    }
  }

  // Fetch DRC-20 tokens for an address
  async getDRC20Tokens(address: string): Promise<DRC20Token[]> {
    const cacheKey = `drc20:${address}`;
    const cached = this.cache.get<DRC20Token[]>(cacheKey, CACHE_TTL.tokens);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${API_PROVIDERS.drc20.base}/address/${address}/balance`
      );
      
      if (!response.ok) {
        throw new Error(`DRC-20 API error: ${response.status}`);
      }
      
      const data: DRC20Balance[] = await response.json();
      
      const tokens: DRC20Token[] = data.map(token => ({
        tick: token.tick,
        symbol: token.tick,
        balance: token.balance,
        available: token.available,
        transferable: token.transferable,
        decimals: 8, // Added: default decimals for DRC-20
      }));
      
      this.cache.set(cacheKey, tokens);
      return tokens;
    } catch (error) {
      console.error('Failed to fetch DRC-20 tokens:', error);
      return [];
    }
  }

  // Fetch Dunes tokens for an address
  async getDunesTokens(address: string): Promise<DunesToken[]> {
    const cacheKey = `dunes:${address}`;
    const cached = this.cache.get<DunesToken[]>(cacheKey, CACHE_TTL.tokens);
    if (cached) return cached;

    try {
      // Dunes API endpoint (adjust based on actual API)
      const response = await fetch(
        `${API_PROVIDERS.wonkyord.base}/dunes/address/${address}`
      );
      
      if (!response.ok) {
        // Dunes might not be supported yet
        return [];
      }
      
      const data = await response.json();
      
      const tokens: DunesToken[] = (data || []).map((token: { 
        id: string; 
        name: string; 
        symbol: string; 
        balance?: string;
        available?: number;
        transferable?: number;
      }) => ({
        id: token.id,
        tick: token.symbol,
        name: token.name,
        symbol: token.symbol,
        balance: {
          available: token.available || parseFloat(token.balance || '0'),
          transferable: token.transferable || 0,
          total: (token.available || parseFloat(token.balance || '0')) + (token.transferable || 0),
        },
        decimals: 8, // Default decimals
      }));
      
      this.cache.set(cacheKey, tokens);
      return tokens;
    } catch (error) {
      console.error('Failed to fetch Dunes tokens:', error);
      return [];
    }
  }

  // Fetch transaction history for an address
  async getTransactions(address: string, limit = 20): Promise<TransactionRecord[]> {
    const cacheKey = `txs:${address}:${limit}`;
    const cached = this.cache.get<TransactionRecord[]>(cacheKey, CACHE_TTL.balance);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${API_PROVIDERS.blockcypher.base}/addrs/${address}/full?limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`BlockCypher error: ${response.status}`);
      }
      
      const data = await response.json();
      
      const transactions: TransactionRecord[] = (data.txs || []).map((tx: {
        hash: string;
        block_height: number;
        confirmations: number;
        total: number;
        fees: number;
        confirmed?: string;
        inputs: Array<{ addresses?: string[] }>;
        outputs: Array<{ addresses?: string[]; value: number }>;
      }) => {
        const isIncoming = tx.outputs.some(
          (out: { addresses?: string[] }) => out.addresses?.includes(address)
        );
        
        return {
          id: tx.hash, // Added: id field
          txid: tx.hash,
          hash: tx.hash,
          type: isIncoming ? 'receive' : 'send',
          amount: tx.total,
          fee: tx.fees,
          status: tx.confirmations > 0 ? 'confirmed' : 'pending',
          confirmations: tx.confirmations,
          timestamp: tx.confirmed ? new Date(tx.confirmed).getTime() : Date.now(),
          from: tx.inputs[0]?.addresses?.[0] || '',
          to: tx.outputs[0]?.addresses?.[0] || '',
        } as TransactionRecord;
      });
      
      this.cache.set(cacheKey, transactions);
      return transactions;
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      throw error;
    }
  }

  // Broadcast a transaction
  async broadcastTransaction(hex: string): Promise<{ txid: string }> {
    try {
      const response = await fetch(`${API_PROVIDERS.blockcypher.base}/txs/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tx: hex }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Broadcast failed');
      }
      
      const data = await response.json();
      return { txid: data.tx.hash };
    } catch (error) {
      console.error('Failed to broadcast transaction:', error);
      throw error;
    }
  }

  // Get current fee estimates
  async getFeeEstimates(): Promise<{ low: number; medium: number; high: number }> {
    // Dogecoin fees are relatively stable, use defaults
    return {
      low: 100000, // 0.001 DOGE per KB
      medium: 500000, // 0.005 DOGE per KB
      high: 1000000, // 0.01 DOGE per KB
    };
  }

  // Invalidate cache for an address
  invalidateCache(address?: string): void {
    if (address) {
      this.cache.invalidate(address);
    } else {
      this.cache.invalidate();
    }
  }
}

// Singleton instance
export const indexerClient = new IndexerClient();

export default indexerClient;
