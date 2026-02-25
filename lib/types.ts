export type ChainId = 'AELF' | 'tDVV' | string;

export interface SkillError {
  code: string;
  message: string;
  details?: string;
  httpStatus?: number;
  raw?: unknown;
}

export interface SkillResponse<T> {
  ok: boolean;
  data?: T;
  error?: SkillError;
  traceId: string;
}

export interface NodeProfile {
  id: string;
  chainId: ChainId;
  rpcUrl: string;
  enabled: boolean;
  source: 'default' | 'env' | 'imported' | 'direct';
  createdAt?: string;
  updatedAt?: string;
}

export interface NodeRegistryFile {
  version: number;
  nodes: NodeProfile[];
}

export interface ResolveNodeInput {
  chainId?: ChainId;
  nodeId?: string;
  rpcUrl?: string;
}

export interface ResolveNodeResult {
  node: NodeProfile;
  candidates: NodeProfile[];
}

export interface ChainTargetInput {
  chainId?: ChainId;
  nodeId?: string;
  rpcUrl?: string;
}

export interface GetBlockInput extends ChainTargetInput {
  blockHash: string;
  includeTransactions?: boolean;
}

export interface GetTransactionResultInput extends ChainTargetInput {
  transactionId: string;
}

export interface GetContractViewMethodsInput extends ChainTargetInput {
  contractAddress: string;
}

export interface GetSystemContractAddressInput extends ChainTargetInput {
  contractName: string;
}

export interface CallContractViewInput extends ChainTargetInput {
  contractAddress: string;
  methodName: string;
  params?: Record<string, unknown>;
}

export interface SendContractTransactionInput extends ChainTargetInput {
  contractAddress: string;
  methodName: string;
  params?: Record<string, unknown>;
  waitForMined?: boolean;
  maxRetries?: number;
  retryIntervalMs?: number;
  privateKey?: string;
}

export interface EstimateTransactionFeeInput extends ChainTargetInput {
  rawTransaction?: string;
  contractAddress?: string;
  methodName?: string;
  params?: Record<string, unknown>;
  privateKey?: string;
}

export interface ImportNodeInput {
  id: string;
  chainId: ChainId;
  rpcUrl: string;
  enabled?: boolean;
}

export interface SendContractTransactionOutput {
  transactionId: string;
  txResult?: unknown;
}
