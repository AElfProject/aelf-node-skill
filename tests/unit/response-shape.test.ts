import { afterEach, describe, expect, it } from 'bun:test';
import { getChainStatus } from '../../src/core/query.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('response shape', () => {
  it('always returns traceId and ok fields', async () => {
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          BestChainHash: '0xabc',
          BestChainHeight: 100,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }) as typeof fetch;

    const result = await getChainStatus({ rpcUrl: 'https://mock-node.test' });
    expect(typeof result.ok).toBe('boolean');
    expect(typeof result.traceId).toBe('string');
    expect(result.traceId.length > 5).toBe(true);
  });
});
