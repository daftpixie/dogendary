// ============================================
// Dogendary Wallet - Transaction Builder (FIXED)
// Fixed: Removed unused private variables
// ============================================

import type { UTXO, TransactionParams } from '@/types';

const DUST_THRESHOLD = 100000;
const DEFAULT_FEE_RATE = 100000;

interface TransactionInput {
  txid: string;
  vout: number;
  value: number;
  script: string;
  sequence?: number;
}

interface TransactionOutput {
  address: string;
  value: number;
}

interface UnsignedTransaction {
  inputs: TransactionInput[];
  outputs: TransactionOutput[];
  fee: number;
}

export class TransactionBuilder {
  private utxos: UTXO[] = [];
  // FIX: Removed unused private _inputs and _outputs variables

  constructor(utxos: UTXO[] = []) {
    this.utxos = utxos;
  }

  setUTXOs(utxos: UTXO[]): this {
    this.utxos = utxos;
    return this;
  }

  getSpendableUTXOs(): UTXO[] {
    return this.utxos.filter(utxo => {
      const isInscribed = utxo.inscriptionId || utxo.isInscribed || utxo.isInscription;
      return !isInscribed;
    });
  }

  getInscribedUTXOs(): UTXO[] {
    return this.utxos.filter(utxo => {
      const isInscribed = utxo.inscriptionId || utxo.isInscribed || utxo.isInscription;
      return Boolean(isInscribed);
    });
  }

  selectUTXOs(targetAmount: number, feeRate: number = DEFAULT_FEE_RATE): UTXO[] {
    const spendable = this.getSpendableUTXOs();
    const sorted = [...spendable].sort((a, b) => b.value - a.value);
    const selected: UTXO[] = [];
    let total = 0;
    
    const estimateFee = (inputCount: number) => {
      const txSize = inputCount * 148 + 2 * 34 + 10;
      return Math.ceil((txSize / 1000) * feeRate);
    };
    
    for (const utxo of sorted) {
      selected.push(utxo);
      total += utxo.value;
      const fee = estimateFee(selected.length);
      if (total >= targetAmount + fee) break;
    }
    
    return selected;
  }

  buildTransaction(params: TransactionParams, changeAddress: string): UnsignedTransaction {
    const { to, amount, feeRate = DEFAULT_FEE_RATE } = params;
    const selectedUTXOs = this.selectUTXOs(amount, feeRate);
    
    if (selectedUTXOs.length === 0) {
      throw new Error('Insufficient funds');
    }
    
    const inputTotal = selectedUTXOs.reduce((sum, utxo) => sum + utxo.value, 0);
    const txSize = selectedUTXOs.length * 148 + 2 * 34 + 10;
    const fee = params.fee || Math.ceil((txSize / 1000) * feeRate);
    
    if (inputTotal < amount + fee) {
      throw new Error('Insufficient funds after fee');
    }
    
    const inputs: TransactionInput[] = selectedUTXOs.map(utxo => ({
      txid: utxo.txid,
      vout: utxo.vout,
      value: utxo.value,
      script: utxo.script || utxo.scriptPubKey || '',
      sequence: 0xffffffff,
    }));
    
    const outputs: TransactionOutput[] = [
      { address: to, value: amount },
    ];
    
    const change = inputTotal - amount - fee;
    if (change > DUST_THRESHOLD) {
      outputs.push({ address: changeAddress, value: change });
    }
    
    return { inputs, outputs, fee };
  }

  buildInscriptionTransfer(
    inscriptionUtxo: UTXO,
    recipientAddress: string,
    feeRate: number = DEFAULT_FEE_RATE
  ): UnsignedTransaction {
    const paddingUTXOs = this.selectUTXOs(100000, feeRate);
    
    if (paddingUTXOs.length === 0) {
      throw new Error('Insufficient funds for inscription transfer fee');
    }
    
    const changeAddress = paddingUTXOs[0].address || '';
    if (!changeAddress) {
      throw new Error('No change address available from UTXOs');
    }
    
    const inputs: TransactionInput[] = [
      {
        txid: inscriptionUtxo.txid,
        vout: inscriptionUtxo.vout,
        value: inscriptionUtxo.value,
        script: inscriptionUtxo.script || inscriptionUtxo.scriptPubKey || '',
        sequence: 0xffffffff,
      },
      ...paddingUTXOs.map(utxo => ({
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxo.value,
        script: utxo.script || utxo.scriptPubKey || '',
        sequence: 0xffffffff,
      })),
    ];
    
    const txSize = inputs.length * 148 + 2 * 34 + 10;
    const fee = Math.ceil((txSize / 1000) * feeRate);
    const inputTotal = inputs.reduce((sum, input) => sum + input.value, 0);
    const change = inputTotal - inscriptionUtxo.value - fee;
    
    const outputs: TransactionOutput[] = [
      { address: recipientAddress, value: inscriptionUtxo.value },
    ];
    
    if (change > DUST_THRESHOLD) {
      outputs.push({ address: changeAddress, value: change });
    }
    
    return { inputs, outputs, fee };
  }

  estimateFee(inputCount: number, outputCount: number, feeRate: number = DEFAULT_FEE_RATE): number {
    const txSize = inputCount * 148 + outputCount * 34 + 10;
    return Math.ceil((txSize / 1000) * feeRate);
  }

  getTotalBalance(): number {
    return this.utxos.reduce((sum, utxo) => sum + utxo.value, 0);
  }

  getSpendableBalance(): number {
    return this.getSpendableUTXOs().reduce((sum, utxo) => sum + utxo.value, 0);
  }
}

export default TransactionBuilder;
