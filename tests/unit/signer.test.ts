import { describe, expect, it } from 'bun:test';
import AElf from 'aelf-sdk';
import { EoaSigner } from '../../lib/signer.js';

describe('lib/signer', () => {
  it('creates signer from private key and exposes wallet address', () => {
    const privateKey = 'f6e512a3c259e5f9af981d7f99d245aa5bc52fe448495e0b0dd56e8406be6f71';

    const signer = new EoaSigner(privateKey);
    const expectedWallet = AElf.wallet.getWalletByPrivateKey(privateKey);

    expect(signer.getAddress()).toBe(expectedWallet.address);
    expect(signer.getWallet().address).toBe(expectedWallet.address);
  });
});
