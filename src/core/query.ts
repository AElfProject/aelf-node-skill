import {
  getEoaPrivateKey,
  getRestClientCacheMax,
  getRetryCount,
  getTimeoutMs,
} from '../../lib/config.js';
import { resolveNode } from '../../lib/node-router.js';
import { RestClient } from '../../lib/rest-client.js';
import { buildSignedTransaction, estimateTransactionFeeBySdk } from '../../lib/sdk-client.js';
import { LruCache } from '../../lib/utils/lru.js';
import {
  validateChainTargetInput,
  validateContractAddress,
  validateMethodName,
  validateRequiredText,
} from '../../lib/validators.js';
import { executeWithResponse } from './common.js';
import type {
  ChainTargetInput,
  EstimateTransactionFeeInput,
  GetBlockInput,
  GetContractViewMethodsInput,
  GetSystemContractAddressInput,
  GetTransactionResultInput,
  SkillResponse,
} from '../../lib/types.js';

const restClientCache = new LruCache<string, RestClient>(getRestClientCacheMax());

function getRestClientKey(rpcUrl: string, timeoutMs: number, retry: number): string {
  return `${rpcUrl}|${timeoutMs}|${retry}`;
}

function clientFor(rpcUrl: string): RestClient {
  const timeoutMs = getTimeoutMs();
  const retry = getRetryCount();
  const key = getRestClientKey(rpcUrl, timeoutMs, retry);
  const cached = restClientCache.get(key);
  if (cached) {
    return cached;
  }

  const client = new RestClient(rpcUrl, timeoutMs, retry);
  restClientCache.set(key, client);
  return client;
}

export async function getChainStatus(input: ChainTargetInput = {}): Promise<SkillResponse<unknown>> {
  return executeWithResponse(async () => {
    validateChainTargetInput(input);
    const { node } = await resolveNode(input);
    return clientFor(node.rpcUrl).request({ method: 'GET', path: 'blockChain/chainStatus' });
  }, 'GET_CHAIN_STATUS_FAILED');
}

export async function getBlockHeight(input: ChainTargetInput = {}): Promise<SkillResponse<unknown>> {
  return executeWithResponse(async () => {
    validateChainTargetInput(input);
    const { node } = await resolveNode(input);
    return clientFor(node.rpcUrl).request({ method: 'GET', path: 'blockChain/blockHeight' });
  }, 'GET_BLOCK_HEIGHT_FAILED');
}

export async function getBlock(input: GetBlockInput): Promise<SkillResponse<unknown>> {
  return executeWithResponse(async () => {
    validateChainTargetInput(input);
    validateRequiredText(input.blockHash, 'blockHash');
    const { node } = await resolveNode(input);
    return clientFor(node.rpcUrl).request({
      method: 'GET',
      path: 'blockChain/block',
      query: {
        blockHash: input.blockHash,
        includeTransactions: input.includeTransactions === true,
      },
    });
  }, 'GET_BLOCK_FAILED');
}

export async function getTransactionResult(input: GetTransactionResultInput): Promise<SkillResponse<unknown>> {
  return executeWithResponse(async () => {
    validateChainTargetInput(input);
    validateRequiredText(input.transactionId, 'transactionId');
    const { node } = await resolveNode(input);
    return clientFor(node.rpcUrl).request({
      method: 'GET',
      path: 'blockChain/transactionResult',
      query: {
        transactionId: input.transactionId,
      },
    });
  }, 'GET_TRANSACTION_RESULT_FAILED');
}

export async function getContractViewMethods(input: GetContractViewMethodsInput): Promise<SkillResponse<unknown>> {
  return executeWithResponse(async () => {
    validateChainTargetInput(input);
    validateContractAddress(input.contractAddress);
    const { node } = await resolveNode(input);
    return clientFor(node.rpcUrl).request({
      method: 'GET',
      path: 'contract/contractViewMethodList',
      query: {
        address: input.contractAddress,
      },
    });
  }, 'GET_CONTRACT_VIEW_METHODS_FAILED');
}

export async function getSystemContractAddress(input: GetSystemContractAddressInput): Promise<SkillResponse<unknown>> {
  return executeWithResponse(async () => {
    validateChainTargetInput(input);
    validateRequiredText(input.contractName, 'contractName');
    const { node } = await resolveNode(input);
    return clientFor(node.rpcUrl).request({
      method: 'GET',
      path: 'contract/systemContractAddressByName',
      query: {
        contractName: input.contractName,
      },
    });
  }, 'GET_SYSTEM_CONTRACT_ADDRESS_FAILED');
}

async function resolveRawTransaction(input: EstimateTransactionFeeInput, rpcUrl: string): Promise<string> {
  if (input.rawTransaction) {
    return input.rawTransaction;
  }

  if (!input.contractAddress || !input.methodName) {
    throw new Error('Either rawTransaction or contractAddress + methodName is required');
  }

  validateContractAddress(input.contractAddress);
  validateMethodName(input.methodName);

  const privateKey = getEoaPrivateKey(input.privateKey);
  if (!privateKey) {
    throw new Error('AELF_PRIVATE_KEY is required when rawTransaction is not provided');
  }

  return buildSignedTransaction(
    rpcUrl,
    input.contractAddress,
    input.methodName,
    input.params || {},
    privateKey,
  );
}

export async function estimateTransactionFee(input: EstimateTransactionFeeInput): Promise<SkillResponse<unknown>> {
  return executeWithResponse(async () => {
    validateChainTargetInput(input);
    const { node } = await resolveNode(input);
    const rawTransaction = await resolveRawTransaction(input, node.rpcUrl);
    const client = clientFor(node.rpcUrl);

    try {
      const estimate = await client.request({
        method: 'POST',
        path: 'contract/estimateMethodFee',
        body: {
          RawTransaction: rawTransaction,
        },
      });
      return {
        source: 'rest',
        rawTransaction,
        estimate,
      };
    } catch {
      const estimate = await estimateTransactionFeeBySdk(node.rpcUrl, rawTransaction);
      return {
        source: 'sdk-fallback',
        rawTransaction,
        estimate,
      };
    }
  }, 'ESTIMATE_TRANSACTION_FEE_FAILED');
}
