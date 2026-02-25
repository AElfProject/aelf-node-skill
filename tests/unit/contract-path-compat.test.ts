import { afterEach, describe, expect, it } from 'bun:test';
import { getContractViewMethods } from '../../src/core/query.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('contract view method list path compatibility', () => {
  it('must call /api/contract/contractViewMethodList instead of legacy blockChain path', async () => {
    let requestedUrl = '';
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      requestedUrl = String(input);
      return new Response(JSON.stringify(['GetTokenInfo']), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }) as typeof fetch;

    const result = await getContractViewMethods({
      rpcUrl: 'https://mock-node.test',
      contractAddress: 'mock-address',
    });

    expect(result.ok).toBe(true);
    expect(requestedUrl.includes('/api/contract/contractViewMethodList')).toBe(true);
    expect(requestedUrl.includes('/api/blockChain/ContractViewMethodList')).toBe(false);
  });
});
