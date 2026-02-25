import { describe, expect, it } from 'bun:test';
import { getBlockHeight, getChainStatus, getSystemContractAddress } from '../../index.js';

const shouldRun = process.env.RUN_LIVE_TESTS === '1';
const maybeDescribe = shouldRun ? describe : describe.skip;

maybeDescribe('live read integration', () => {
  it('reads chain status and block height from AELF and tDVV', async () => {
    const mainStatus = await getChainStatus({ chainId: 'AELF' });
    const sideStatus = await getChainStatus({ chainId: 'tDVV' });
    const mainHeight = await getBlockHeight({ chainId: 'AELF' });
    const sideHeight = await getBlockHeight({ chainId: 'tDVV' });

    expect(mainStatus.ok).toBe(true);
    expect(sideStatus.ok).toBe(true);
    expect(mainHeight.ok).toBe(true);
    expect(sideHeight.ok).toBe(true);
  });

  it('reads token system contract address from mainnet', async () => {
    const result = await getSystemContractAddress({
      chainId: 'AELF',
      contractName: 'AElf.ContractNames.Token',
    });

    expect(result.ok).toBe(true);
    expect(typeof result.data).toBe('string');
  });
});
