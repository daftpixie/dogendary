// ============================================
// Dogendary Wallet - Indexer Client (FIXED)
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

const API_PROVIDERS = {
  blockcypher: { name: 'BlockCypher', base: 'https://api.blockcypher.com/v1/doge/main' },
  sochain: { name: 'SoChain', base: 'https://chain.so/api/v3' },
  wonkyord: { name: 'Wonky-Ord', base: 'https://wonky-ord.dogeord.io' },
  drc20: { name: 'DRC-20', base: 'https://drc-20.org/api' },
};

interface BlockCypherAddressResponse {
  address: string;
  balance: number;
  unconfirmed_balance: number;
  final_balance: number;
  txrefs?: { tx_hash: string; tx_output_n: number; value: number; confirmations: number; spent: boolean }[];
}

interface WonkyOrdInscription {
  id: string;
  number: number;
  content_type: string;
  content_length: number;
  genesis_tx: string;
  genesis_height: number;
  satpoint: string;
  address: string;
}

interface DRC20Balance {
  tick: string;
  balance: string;
  available: string;
  transferable: string;
}

const CACHE_TTL = { balance: 30000, utxos: 30000, inscriptions: 300000, tokens: 60000 };

interface CacheEntry<T> { data: T; timestamp: number; }

class IndexerCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  get<T>(key: string, ttl: number): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry || Date.now() - entry.timestamp > ttl) { this.cache.delete(key); return null; }
    return entry.data;
  }
  set<T>(key: string, data: T): void { this.cache.set(key, { data, timestamp: Date.now() }); }
  invalidate(pattern?: string): void {
    if (!pattern) { this.cache.clear(); return; }
    for (const key of this.cache.keys()) { if (key.includes(pattern)) this.cache.delete(key); }
  }
}

export class IndexerClient {
  private cache = new IndexerCache();

  async getBalance(address: string): Promise<Balance> {
    const cacheKey = `balance:${address}`;
    const cached = this.cache.get<Balance>(cacheKey, CACHE_TTL.balance);
    if (cached) return cached;
    try {
      const response = await fetch(`${API_PROVIDERS.blockcypher.base}/addrs/${address}/balance`);
      if (!response.ok) throw new Error(`BlockCypher error: ${response.status}`);
      const data: BlockCypherAddressResponse = await response.json();
      const balance: Balance = {
        confirmed: data.balance,
        unconfirmed: data.unconfirmed_balance,
        total: data.final_balance,
        inscribed: 0, // FIX: Added inscribed property
      };
      this.cache.set(cacheKey, balance);
      return balance;
    } catch (error) { console.error('Failed to fetch balance:', error); throw error; }
  }

  async getUTXOs(address: string): Promise<UTXO[]> {
    const cacheKey = `utxos:${address}`;
    const cached = this.cache.get<UTXO[]>(cacheKey, CACHE_TTL.utxos);
    if (cached) return cached;
    try {
      const response = await fetch(`${API_PROVIDERS.blockcypher.base}/addrs/${address}?unspentOnly=true`);
      if (!response.ok) throw new Error(`BlockCypher error: ${response.status}`);
      const data: BlockCypherAddressResponse = await response.json();
      const utxos: UTXO[] = (data.txrefs || []).filter(tx => !tx.spent).map(tx => ({
        txid: tx.tx_hash,
        vout: tx.tx_output_n,
        value: tx.value,
        confirmations: tx.confirmations,
        script: '',
        scriptPubKey: '',
        address: address, // FIX: Added address
      }));
      this.cache.set(cacheKey, utxos);
      return utxos;
    } catch (error) { console.error('Failed to fetch UTXOs:', error); throw error; }
  }

  async getInscriptions(address: string): Promise<Inscription[]> {
    const cacheKey = `inscriptions:${address}`;
    const cached = this.cache.get<Inscription[]>(cacheKey, CACHE_TTL.inscriptions);
    if (cached) return cached;
    try {
      const response = await fetch(`${API_PROVIDERS.wonkyord.base}/inscriptions?address=${address}`);
      if (!response.ok) throw new Error(`Wonky-Ord error: ${response.status}`);
      const data: WonkyOrdInscription[] = await response.json();
      const inscriptions: Inscription[] = data.map(insc => ({
        id: insc.id,
        inscriptionId: insc.id, // FIX: Added
        number: insc.number,
        inscriptionNumber: insc.number, // FIX: Added
        contentType: insc.content_type,
        contentLength: insc.content_length, // FIX: Added
        contentUrl: `${API_PROVIDERS.wonkyord.base}/content/${insc.id}`,
        genesisTransaction: insc.genesis_tx,
        genesisHeight: insc.genesis_height, // FIX: Added
        satpoint: insc.satpoint, // FIX: Added
        timestamp: Date.now(),
        owner: insc.address,
        location: insc.satpoint,
      }));
      this.cache.set(cacheKey, inscriptions);
      return inscriptions;
    } catch (error) { console.error('Failed to fetch inscriptions:', error); return []; }
  }

  async getDRC20Tokens(address: string): Promise<DRC20Token[]> {
    const cacheKey = `drc20:${address}`;
    const cached = this.cache.get<DRC20Token[]>(cacheKey, CACHE_TTL.tokens);
    if (cached) return cached;
    try {
      const response = await fetch(`${API_PROVIDERS.drc20.base}/address/${address}/balance`);
      if (!response.ok) throw new Error(`DRC-20 API error: ${response.status}`);
      const data: DRC20Balance[] = await response.json();
      const tokens: DRC20Token[] = data.map(token => ({
        ticker: token.tick, // FIX: Added ticker
        tick: token.tick,
        symbol: token.tick,
        balance: token.balance,
        available: token.available,
        transferable: token.transferable,
        decimals: 8,
      }));
      this.cache.set(cacheKey, tokens);
      return tokens;
    } catch (error) { console.error('Failed to fetch DRC-20 tokens:', error); return []; }
  }

  async getDunesTokens(_address: string): Promise<DunesToken[]> { return []; }
  
  async getTransactions(address: string): Promise<TransactionRecord[]> {
    try {
      const response = await fetch(`${API_PROVIDERS.blockcypher.base}/addrs/${address}/full?limit=50`);
      if (!response.ok) return [];
      const data = await response.json();
      return (data.txs || []).map((tx: { hash: string; received: string; confirmations: number; fees: number; inputs: { addresses?: string[] }[]; outputs: { addresses?: string[]; value: number }[] }) => {
        const isReceive = tx.outputs.some(out => out.addresses?.includes(address));
        const amount = tx.outputs.filter(out => out.addresses?.includes(address)).reduce((sum, out) => sum + out.value, 0);
        return {
          txid: tx.hash,
          id: tx.hash,
          type: isReceive ? 'receive' : 'send',
          amount,
          fee: tx.fees,
          timestamp: new Date(tx.received).getTime() / 1000,
          confirmations: tx.confirmations,
          status: tx.confirmations > 0 ? 'confirmed' : 'pending',
          from: tx.inputs[0]?.addresses?.[0] || '',
          to: tx.outputs[0]?.addresses?.[0] || '',
        } as TransactionRecord;
      });
    } catch { return []; }
  }

  clearCache(): void { this.cache.invalidate(); }
  invalidateAddress(address: string): void { this.cache.invalidate(address); }
}

export const indexerClient = new IndexerClient();
export default IndexerClient;
