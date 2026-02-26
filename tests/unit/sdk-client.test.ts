import { afterEach, describe, expect, it } from 'bun:test';
import {
  clearSdkCacheForRpc,
  clearSdkCaches,
  getAElfInstance,
  getReadOnlyWallet,
} from '../../lib/sdk-client.js';

afterEach(() => {
  clearSdkCaches();
});

describe('lib/sdk-client cache behavior', () => {
  it('reuses readonly wallet until caches are cleared', () => {
    const first = getReadOnlyWallet();
    const second = getReadOnlyWallet();

    expect(first).toBe(second);

    clearSdkCaches();

    const third = getReadOnlyWallet();
    expect(third).not.toBe(first);
  });

  it('reuses aelf instance for same rpc and clears by rpc key', () => {
    const rpcUrl = 'https://mock-node.test';

    const first = getAElfInstance(rpcUrl);
    const second = getAElfInstance(rpcUrl);
    expect(first).toBe(second);

    clearSdkCacheForRpc(rpcUrl);

    const third = getAElfInstance(rpcUrl);
    expect(third).not.toBe(first);
  });
});
