import AElf, {
  type AelfContract,
  type AelfContractMethod,
  type AelfInstance,
  type AelfWallet,
} from 'aelf-sdk';
import {
  getSdkContractCacheMax,
  getSdkInstanceCacheMax,
  getTimeoutMs,
} from './config.js';
import { EoaSigner, type Signer } from './signer.js';
import type { SendContractTransactionOutput } from './types.js';
import { LruCache } from './utils/lru.js';
import { sleep } from './utils/time.js';

const instanceCache = new LruCache<string, AelfInstance>(getSdkInstanceCacheMax());
const contractCache = new LruCache<string, AelfContract>(getSdkContractCacheMax());
let readOnlyWallet: AelfWallet | undefined;

function getContractMethod(contract: AelfContract, methodName: string): AelfContractMethod | undefined {
  const method = contract?.[methodName];
  if (typeof method !== 'function') {
    return undefined;
  }
  return method as AelfContractMethod;
}

export function getAElfInstance(rpcUrl: string): AelfInstance {
  const cached = instanceCache.get(rpcUrl);
  if (cached) {
    return cached;
  }

  const instance = new AElf(new AElf.providers.HttpProvider(rpcUrl, getTimeoutMs()));
  instanceCache.set(rpcUrl, instance);
  return instance;
}

export function getReadOnlyWallet(): AelfWallet {
  if (!readOnlyWallet) {
    readOnlyWallet = AElf.wallet.createNewWallet();
  }
  return readOnlyWallet;
}

export function getEoaSigner(privateKey: string): Signer {
  return new EoaSigner(privateKey);
}

async function getContractInstance(
  rpcUrl: string,
  contractAddress: string,
  wallet: AelfWallet,
): Promise<AelfContract> {
  const key = `${rpcUrl}|${contractAddress}|${wallet.address}`;
  const cached = contractCache.get(key);
  if (cached) {
    return cached;
  }

  const instance = getAElfInstance(rpcUrl);
  const contract = await instance.chain.contractAt(contractAddress, wallet);
  contractCache.set(key, contract);
  return contract;
}

export async function callContractView(
  rpcUrl: string,
  contractAddress: string,
  methodName: string,
  params: Record<string, unknown> = {},
): Promise<unknown> {
  const wallet = getReadOnlyWallet();
  const contract = await getContractInstance(rpcUrl, contractAddress, wallet);
  const method = getContractMethod(contract, methodName);

  if (!method || typeof method.call !== 'function') {
    throw new Error(`View method not found: ${methodName}`);
  }

  const result = await method.call(params);
  if (result && typeof result === 'object' && 'error' in result && (result as Record<string, unknown>).error) {
    throw new Error(`View method failed: ${JSON.stringify((result as Record<string, unknown>).error)}`);
  }

  return result;
}

export async function buildSignedTransaction(
  rpcUrl: string,
  contractAddress: string,
  methodName: string,
  params: Record<string, unknown> = {},
  privateKey: string,
): Promise<string> {
  const signer = getEoaSigner(privateKey);
  const contract = await getContractInstance(rpcUrl, contractAddress, signer.getWallet());
  const method = getContractMethod(contract, methodName);

  if (!method || typeof method.getSignedTx !== 'function') {
    throw new Error(`Method getSignedTx is unavailable for ${methodName}`);
  }

  const signedTx = method.getSignedTx(params);
  if (typeof signedTx !== 'string' || !signedTx) {
    throw new Error('Failed to build signed transaction');
  }

  return signedTx;
}

export async function pollTransactionResult(
  rpcUrl: string,
  transactionId: string,
  maxRetries = 20,
  retryIntervalMs = 1_500,
): Promise<unknown> {
  const instance = getAElfInstance(rpcUrl);
  for (let i = 0; i < maxRetries; i += 1) {
    const result = await instance.chain.getTxResult(transactionId);
    const status = String(result?.Status || '').toUpperCase();
    if (status === 'MINED' || status === 'FAILED' || status === 'NODEVALIDATIONFAILED') {
      return result;
    }
    await sleep(retryIntervalMs);
  }

  throw new Error(`Transaction ${transactionId} not finalized after ${maxRetries} retries`);
}

export async function sendContractTransaction(
  rpcUrl: string,
  contractAddress: string,
  methodName: string,
  params: Record<string, unknown> = {},
  privateKey: string,
  waitForMined = true,
  maxRetries = 20,
  retryIntervalMs = 1_500,
): Promise<SendContractTransactionOutput> {
  const signer = getEoaSigner(privateKey);
  const contract = await getContractInstance(rpcUrl, contractAddress, signer.getWallet());
  const method = getContractMethod(contract, methodName);

  if (!method) {
    throw new Error(`Send method not found: ${methodName}`);
  }

  const sendResult = await method(params);
  const sendData = sendResult as Record<string, unknown>;
  const nestedResult = sendData.result as Record<string, unknown> | undefined;
  const transactionId =
    (typeof nestedResult?.TransactionId === 'string' && nestedResult.TransactionId) ||
    (typeof sendData.TransactionId === 'string' && sendData.TransactionId) ||
    '';

  if (!transactionId) {
    throw new Error(`No TransactionId returned for ${methodName}`);
  }

  if (!waitForMined) {
    return { transactionId };
  }

  const txResult = await pollTransactionResult(rpcUrl, transactionId, maxRetries, retryIntervalMs);
  return {
    transactionId,
    txResult,
  };
}

export async function estimateTransactionFeeBySdk(
  rpcUrl: string,
  rawTransaction: string,
): Promise<unknown> {
  const instance = getAElfInstance(rpcUrl);
  return instance.chain.calculateTransactionFee(rawTransaction);
}

export function clearSdkCacheForRpc(rpcUrl: string): void {
  instanceCache.delete(rpcUrl);
  const prefix = `${rpcUrl}|`;
  contractCache.keys().forEach(key => {
    if (key.startsWith(prefix)) {
      contractCache.delete(key);
    }
  });
}

export function clearSdkCaches(): void {
  readOnlyWallet = undefined;
  instanceCache.clear();
  contractCache.clear();
}
