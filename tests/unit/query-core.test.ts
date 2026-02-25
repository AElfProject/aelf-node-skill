import { afterEach, describe, expect, it } from 'bun:test';
import {
  estimateTransactionFee,
  getBlock,
  getBlockHeight,
  getChainStatus,
  getContractViewMethods,
  getSystemContractAddress,
  getTransactionResult,
} from '../../src/core/query.js';

const originalFetch = globalThis.fetch;
const originalPrivateKey = process.env.AELF_PRIVATE_KEY;

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalPrivateKey === undefined) {
    delete process.env.AELF_PRIVATE_KEY;
  } else {
    process.env.AELF_PRIVATE_KEY = originalPrivateKey;
  }
});

describe('query core flows', () => {
  it('calls read endpoints through REST with expected paths', async () => {
    const requestedUrls: string[] = [];

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      requestedUrls.push(url);

      if (url.includes('/api/blockChain/chainStatus')) {
        return jsonResponse({ BestChainHeight: 123 });
      }
      if (url.includes('/api/blockChain/blockHeight')) {
        return jsonResponse(123);
      }
      if (url.includes('/api/blockChain/block?')) {
        return jsonResponse({ BlockHash: '0xblock' });
      }
      if (url.includes('/api/blockChain/transactionResult?')) {
        return jsonResponse({ Status: 'MINED' });
      }
      if (url.includes('/api/contract/systemContractAddressByName?')) {
        return jsonResponse('2dnGfQx...');
      }
      if (url.includes('/api/contract/contractViewMethodList?')) {
        return jsonResponse(['GetBalance']);
      }

      return new Response('not found', { status: 404 });
    }) as typeof fetch;

    const chain = await getChainStatus({ rpcUrl: 'https://mock-node.test' });
    const height = await getBlockHeight({ rpcUrl: 'https://mock-node.test' });
    const block = await getBlock({ rpcUrl: 'https://mock-node.test', blockHash: '0xblock', includeTransactions: true });
    const tx = await getTransactionResult({ rpcUrl: 'https://mock-node.test', transactionId: '0xtx' });
    const system = await getSystemContractAddress({
      rpcUrl: 'https://mock-node.test',
      contractName: 'AElf.ContractNames.Token',
    });
    const methods = await getContractViewMethods({
      rpcUrl: 'https://mock-node.test',
      contractAddress: '2dnGfQx...',
    });

    expect(chain.ok).toBe(true);
    expect(height.ok).toBe(true);
    expect(block.ok).toBe(true);
    expect(tx.ok).toBe(true);
    expect(system.ok).toBe(true);
    expect(methods.ok).toBe(true);

    expect(requestedUrls.some(url => url.includes('/api/blockChain/chainStatus'))).toBe(true);
    expect(requestedUrls.some(url => url.includes('/api/blockChain/blockHeight'))).toBe(true);
    expect(requestedUrls.some(url => url.includes('/api/blockChain/block?'))).toBe(true);
    expect(requestedUrls.some(url => url.includes('/api/blockChain/transactionResult?'))).toBe(true);
    expect(requestedUrls.some(url => url.includes('/api/contract/systemContractAddressByName?'))).toBe(true);
    expect(requestedUrls.some(url => url.includes('/api/contract/contractViewMethodList?'))).toBe(true);
  });

  it('estimates fee via REST when rawTransaction is provided', async () => {
    let requestBody = '';

    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      requestBody = String(init?.body || '');
      return jsonResponse({ Fee: '10000' });
    }) as typeof fetch;

    const result = await estimateTransactionFee({
      rpcUrl: 'https://mock-node.test',
      rawTransaction: '0xsignedtx',
    });

    expect(result.ok).toBe(true);
    expect((result.data as any).source).toBe('rest');
    expect((result.data as any).rawTransaction).toBe('0xsignedtx');
    expect(requestBody.includes('RawTransaction')).toBe(true);
  });

  it('returns error when fee input is incomplete', async () => {
    delete process.env.AELF_PRIVATE_KEY;

    const result = await estimateTransactionFee({ rpcUrl: 'https://mock-node.test' });

    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('ESTIMATE_TRANSACTION_FEE_FAILED');
    expect(result.error?.message.includes('Either rawTransaction or contractAddress + methodName is required')).toBe(true);
  });

  it('returns error when private key is missing for signed tx build', async () => {
    delete process.env.AELF_PRIVATE_KEY;

    const result = await estimateTransactionFee({
      rpcUrl: 'https://mock-node.test',
      contractAddress: '2dnGfQx...',
      methodName: 'Transfer',
      params: {
        to: 'address',
        amount: '1',
      },
    });

    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('ESTIMATE_TRANSACTION_FEE_FAILED');
    expect(result.error?.message.includes('AELF_PRIVATE_KEY is required when rawTransaction is not provided')).toBe(true);
  });
});
