import { afterEach, describe, expect, it } from 'bun:test';
import { RestClient } from '../../lib/rest-client.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('lib/rest-client', () => {
  it('keeps plain numeric text as string', async () => {
    globalThis.fetch = (async () => new Response('12345678901234567890', { status: 200 })) as typeof fetch;

    const client = new RestClient('https://mock-node.test', 100, 0);
    const result = await client.request({ method: 'GET', path: 'blockChain/blockHeight' });

    expect(typeof result).toBe('string');
    expect(result).toBe('12345678901234567890');
  });

  it('retries failed request before succeeding', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      if (calls === 1) {
        return new Response(JSON.stringify({ Error: { Code: 'TEMP', Message: 'temporary' } }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    const client = new RestClient('https://mock-node.test', 100, 1);
    const result = await client.request<{ ok: boolean }>({ method: 'GET', path: 'blockChain/chainStatus' });

    expect(calls).toBe(2);
    expect(result.ok).toBe(true);
  });

  it('aborts request on timeout', async () => {
    globalThis.fetch = ((_: RequestInfo | URL, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        const signal = init?.signal;
        signal?.addEventListener('abort', () => {
          reject(new Error('aborted'));
        });
      })) as typeof fetch;

    const client = new RestClient('https://mock-node.test', 5, 0);
    await expect(client.request({ method: 'GET', path: 'blockChain/chainStatus' })).rejects.toThrow('aborted');
  });
});
