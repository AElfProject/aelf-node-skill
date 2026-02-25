import AElf from 'aelf-sdk';
import { getTimeoutMs } from './config.js';
import { EoaSigner, type Signer } from './signer.js';
import type { SendContractTransactionOutput } from './types.js';

const instanceCache: Record<string, any> = {};
const contractCache: Record<string, any> = {};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getAElfInstance(rpcUrl: string): any {
  if (!instanceCache[rpcUrl]) {
    instanceCache[rpcUrl] = new AElf(new AElf.providers.HttpProvider(rpcUrl, getTimeoutMs()));
  }
  return instanceCache[rpcUrl];
}

export function getReadOnlyWallet(): any {
  return AElf.wallet.createNewWallet();
}

export function getEoaSigner(privateKey: string): Signer {
  return new EoaSigner(privateKey);
}

async function getContractInstance(rpcUrl: string, contractAddress: string, wallet: any): Promise<any> {
  const key = `${rpcUrl}|${contractAddress}|${wallet.address}`;
  if (!contractCache[key]) {
    const instance = getAElfInstance(rpcUrl);
    contractCache[key] = await instance.chain.contractAt(contractAddress, wallet);
  }
  return contractCache[key];
}

export async function callContractView(
  rpcUrl: string,
  contractAddress: string,
  methodName: string,
  params: Record<string, unknown> = {},
): Promise<unknown> {
  const wallet = getReadOnlyWallet();
  const contract = await getContractInstance(rpcUrl, contractAddress, wallet);
  const method = contract?.[methodName];
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
  const method = contract?.[methodName];
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
  const method = contract?.[methodName];
  if (!method || typeof method !== 'function') {
    throw new Error(`Send method not found: ${methodName}`);
  }

  const sendResult = await method(params);
  const transactionId = sendResult?.result?.TransactionId || sendResult?.TransactionId;
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

export function clearSdkCaches(): void {
  Object.keys(instanceCache).forEach(key => delete instanceCache[key]);
  Object.keys(contractCache).forEach(key => delete contractCache[key]);
}
