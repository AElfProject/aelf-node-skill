import { homedir } from 'node:os';
import { join } from 'node:path';
import type { NodeProfile } from './types.js';

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRY = 1;
const DEFAULT_SDK_INSTANCE_CACHE_MAX = 32;
const DEFAULT_SDK_CONTRACT_CACHE_MAX = 256;
const DEFAULT_REST_CLIENT_CACHE_MAX = 64;

export const DEFAULT_NODES: NodeProfile[] = [
  {
    id: 'default-aelf',
    chainId: 'AELF',
    rpcUrl: 'https://aelf-public-node.aelf.io',
    enabled: true,
    source: 'default',
  },
  {
    id: 'default-tdvv',
    chainId: 'tDVV',
    rpcUrl: 'https://tdvv-public-node.aelf.io',
    enabled: true,
    source: 'default',
  },
];

function getPositiveIntFromEnv(name: string, defaultValue: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : defaultValue;
}

export function getTimeoutMs(): number {
  return getPositiveIntFromEnv('AELF_NODE_TIMEOUT_MS', DEFAULT_TIMEOUT_MS);
}

export function getRetryCount(): number {
  const value = Number(process.env.AELF_NODE_RETRY);
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : DEFAULT_RETRY;
}

export function getSdkInstanceCacheMax(): number {
  return getPositiveIntFromEnv('AELF_SDK_INSTANCE_CACHE_MAX', DEFAULT_SDK_INSTANCE_CACHE_MAX);
}

export function getSdkContractCacheMax(): number {
  return getPositiveIntFromEnv('AELF_SDK_CONTRACT_CACHE_MAX', DEFAULT_SDK_CONTRACT_CACHE_MAX);
}

export function getRestClientCacheMax(): number {
  return getPositiveIntFromEnv('AELF_REST_CLIENT_CACHE_MAX', DEFAULT_REST_CLIENT_CACHE_MAX);
}

export function getRegistryPath(): string {
  return process.env.AELF_NODE_REGISTRY_PATH || join(homedir(), '.aelf-node-skill', 'nodes.json');
}

export function getEoaPrivateKey(override?: string): string | undefined {
  return override || process.env.AELF_PRIVATE_KEY;
}

export function getEnvOverrideNodes(): NodeProfile[] {
  const result: NodeProfile[] = [];
  if (process.env.AELF_NODE_AELF_RPC_URL) {
    result.push({
      id: 'env-aelf',
      chainId: 'AELF',
      rpcUrl: process.env.AELF_NODE_AELF_RPC_URL,
      enabled: true,
      source: 'env',
    });
  }
  if (process.env.AELF_NODE_TDVV_RPC_URL) {
    result.push({
      id: 'env-tdvv',
      chainId: 'tDVV',
      rpcUrl: process.env.AELF_NODE_TDVV_RPC_URL,
      enabled: true,
      source: 'env',
    });
  }
  return result;
}
