declare module 'aelf-sdk' {
  export interface AelfWallet {
    address: string;
    privateKey: string;
    mnemonic?: string;
    [key: string]: unknown;
  }

  export interface AelfTxResult {
    Status?: string;
    [key: string]: unknown;
  }

  export interface AelfContractMethod {
    (params?: Record<string, unknown>): Promise<unknown>;
    call?: (params?: Record<string, unknown>) => Promise<unknown>;
    getSignedTx?: (params?: Record<string, unknown>) => string;
  }

  export interface AelfContract {
    [methodName: string]: AelfContractMethod | unknown;
  }

  export interface AelfChainApi {
    contractAt(contractAddress: string, wallet: AelfWallet): Promise<AelfContract>;
    getTxResult(transactionId: string): Promise<AelfTxResult>;
    calculateTransactionFee(rawTransaction: string): Promise<unknown>;
  }

  export interface AelfInstance {
    chain: AelfChainApi;
  }

  export interface HttpProviderConstructor {
    new (rpcUrl: string, timeoutMs?: number): unknown;
  }

  export interface AelfWalletApi {
    createNewWallet(): AelfWallet;
    getWalletByPrivateKey(privateKey: string): AelfWallet;
    AESEncrypt(privateKey: string, password: string): string;
    AESDecrypt(encrypted: string, password: string): string;
  }

  export interface AelfStaticApi {
    providers: {
      HttpProvider: HttpProviderConstructor;
    };
    wallet: AelfWalletApi;
  }

  export interface AelfConstructor {
    new (provider: unknown): AelfInstance;
  }

  const AElf: AelfConstructor & AelfStaticApi;

  export default AElf;
}

declare module "aelf-sdk/src/util/keyStore.js" {
  export function getKeystore(
    account: { privateKey: string; mnemonic?: string; address?: string; nickName?: string },
    password: string,
    option?: Record<string, unknown>,
  ): unknown;
  export function unlockKeystore(keystore: unknown, password: string): {
    privateKey: string;
    mnemonic?: string;
    address?: string;
    nickName?: string;
  };
  export function checkPassword(keystore: unknown, password: string): boolean;
}
