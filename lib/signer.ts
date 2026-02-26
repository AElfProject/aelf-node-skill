import AElf, { type AelfWallet } from 'aelf-sdk';

export interface Signer {
  getAddress(): string;
  getWallet(): AelfWallet;
}

export class EoaSigner implements Signer {
  private readonly wallet: AelfWallet;

  constructor(privateKey: string) {
    this.wallet = AElf.wallet.getWalletByPrivateKey(privateKey);
  }

  getAddress(): string {
    return this.wallet.address;
  }

  getWallet(): AelfWallet {
    return this.wallet;
  }
}
