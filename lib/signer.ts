import AElf from 'aelf-sdk';

export interface Signer {
  getAddress(): string;
  getWallet(): any;
}

export class EoaSigner implements Signer {
  private readonly wallet: any;

  constructor(privateKey: string) {
    this.wallet = AElf.wallet.getWalletByPrivateKey(privateKey);
  }

  getAddress(): string {
    return this.wallet.address;
  }

  getWallet(): any {
    return this.wallet;
  }
}
