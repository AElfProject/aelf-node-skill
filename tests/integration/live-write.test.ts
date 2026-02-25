import { describe, expect, it } from 'bun:test';
import { callContractView, getSystemContractAddress, sendContractTransaction } from '../../index.js';

const shouldRun = process.env.RUN_LIVE_TESTS === '1' && !!process.env.AELF_PRIVATE_KEY;
const maybeDescribe = shouldRun ? describe : describe.skip;

maybeDescribe('live write integration', () => {
  it('sends transfer tx on tDVV and returns finalized status branch', async () => {
    const tokenAddressResult = await getSystemContractAddress({
      chainId: 'tDVV',
      contractName: 'AElf.ContractNames.Token',
    });

    if (!tokenAddressResult.ok || typeof tokenAddressResult.data !== 'string') {
      throw new Error('Failed to resolve token contract address for tDVV');
    }

    const senderAddressResult = await callContractView({
      chainId: 'tDVV',
      contractAddress: tokenAddressResult.data,
      methodName: 'GetPrimaryTokenSymbol',
      params: {},
    });

    expect(senderAddressResult.ok).toBe(true);

    const tx = await sendContractTransaction({
      chainId: 'tDVV',
      contractAddress: tokenAddressResult.data,
      methodName: 'Transfer',
      params: {
        symbol: 'ELF',
        to: '7RzVGiuVWkvL4VfVHdZfQF2Tri3sgLe9U991bohHFfSRZXuGX',
        amount: '1',
        memo: 'aelf-node-skill-live-test',
      },
      waitForMined: true,
      maxRetries: 8,
      retryIntervalMs: 1500,
    });

    expect(tx.ok).toBe(true);

    const status = String((tx.data as any)?.txResult?.Status || '').toUpperCase();
    expect(['MINED', 'FAILED', 'NODEVALIDATIONFAILED'].includes(status)).toBe(true);
  });
});
