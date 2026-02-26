import { afterEach, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';

type ContractMockState = {
  callContractViewCalls: Array<{
    rpcUrl: string;
    contractAddress: string;
    methodName: string;
    params: Record<string, unknown>;
  }>;
  sendContractTransactionCalls: Array<{
    rpcUrl: string;
    contractAddress: string;
    methodName: string;
    params: Record<string, unknown>;
    privateKey: string;
    waitForMined: boolean;
    maxRetries: number;
    retryIntervalMs: number;
  }>;
  callContractViewImpl: (
    rpcUrl: string,
    contractAddress: string,
    methodName: string,
    params: Record<string, unknown>,
  ) => Promise<unknown>;
  sendContractTransactionImpl: (
    rpcUrl: string,
    contractAddress: string,
    methodName: string,
    params: Record<string, unknown>,
    privateKey: string,
    waitForMined: boolean,
    maxRetries: number,
    retryIntervalMs: number,
  ) => Promise<unknown>;
};

function defaultState(): ContractMockState {
  return {
    callContractViewCalls: [],
    sendContractTransactionCalls: [],
    callContractViewImpl: async () => ({ balance: '100' }),
    sendContractTransactionImpl: async () => ({ transactionId: '0xtx' }),
  };
}

const g = globalThis as Record<string, unknown>;
const state = (g.__AELF_CONTRACT_CORE_MOCK_STATE as ContractMockState | undefined) || defaultState();
g.__AELF_CONTRACT_CORE_MOCK_STATE = state;

function resetState(): void {
  const next = defaultState();
  state.callContractViewCalls = next.callContractViewCalls;
  state.sendContractTransactionCalls = next.sendContractTransactionCalls;
  state.callContractViewImpl = next.callContractViewImpl;
  state.sendContractTransactionImpl = next.sendContractTransactionImpl;
}

mock.module('../../lib/sdk-client.js', () => ({
  callContractView: async (
    rpcUrl: string,
    contractAddress: string,
    methodName: string,
    params: Record<string, unknown>,
  ) => {
    state.callContractViewCalls.push({ rpcUrl, contractAddress, methodName, params });
    return state.callContractViewImpl(rpcUrl, contractAddress, methodName, params);
  },
  sendContractTransaction: async (
    rpcUrl: string,
    contractAddress: string,
    methodName: string,
    params: Record<string, unknown>,
    privateKey: string,
    waitForMined: boolean,
    maxRetries: number,
    retryIntervalMs: number,
  ) => {
    state.sendContractTransactionCalls.push({
      rpcUrl,
      contractAddress,
      methodName,
      params,
      privateKey,
      waitForMined,
      maxRetries,
      retryIntervalMs,
    });
    return state.sendContractTransactionImpl(
      rpcUrl,
      contractAddress,
      methodName,
      params,
      privateKey,
      waitForMined,
      maxRetries,
      retryIntervalMs,
    );
  },
}));

let contractCore: typeof import('../../src/core/contract.js');
const originalPrivateKey = process.env.AELF_PRIVATE_KEY;
const validContractAddress = '7RzVGiuVWkvL4VfVHdZfQF2Tri3sgLe9U991bohHFfSRZXuGX';

beforeAll(async () => {
  contractCore = await import('../../src/core/contract.js');
});

beforeEach(() => {
  resetState();
});

afterEach(() => {
  if (originalPrivateKey === undefined) {
    delete process.env.AELF_PRIVATE_KEY;
  } else {
    process.env.AELF_PRIVATE_KEY = originalPrivateKey;
  }
});

describe('core/contract', () => {
  it('calls sdk view method successfully', async () => {
    const result = await contractCore.callContractView({
      rpcUrl: 'https://mock-node.test',
      contractAddress: validContractAddress,
      methodName: 'GetBalance',
      params: { symbol: 'ELF' },
    });

    expect(result.ok).toBe(true);
    expect(state.callContractViewCalls.length).toBe(1);
    expect(state.callContractViewCalls[0]?.contractAddress).toBe(validContractAddress);
  });

  it('rejects invalid contract address before sdk call', async () => {
    const result = await contractCore.callContractView({
      rpcUrl: 'https://mock-node.test',
      contractAddress: 'invalid-address',
      methodName: 'GetBalance',
    });

    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('CALL_CONTRACT_VIEW_FAILED');
    expect(state.callContractViewCalls.length).toBe(0);
  });

  it('fails send call when private key is missing', async () => {
    delete process.env.AELF_PRIVATE_KEY;

    const result = await contractCore.sendContractTransaction({
      rpcUrl: 'https://mock-node.test',
      contractAddress: validContractAddress,
      methodName: 'Transfer',
      params: {
        to: validContractAddress,
        amount: '1',
      },
    });

    expect(result.ok).toBe(false);
    expect(result.error?.message.includes('AELF_PRIVATE_KEY is required for write operations')).toBe(true);
    expect(state.sendContractTransactionCalls.length).toBe(0);
  });

  it('uses env private key for send call', async () => {
    process.env.AELF_PRIVATE_KEY = 'test-private-key';

    const result = await contractCore.sendContractTransaction({
      rpcUrl: 'https://mock-node.test',
      contractAddress: validContractAddress,
      methodName: 'Transfer',
      params: {
        to: validContractAddress,
        amount: '1',
      },
      waitForMined: false,
    });

    expect(result.ok).toBe(true);
    expect(state.sendContractTransactionCalls.length).toBe(1);
    expect(state.sendContractTransactionCalls[0]?.privateKey).toBe('test-private-key');
  });
});
