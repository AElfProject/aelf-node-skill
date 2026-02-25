import { homedir } from 'node:os';
import { join } from 'node:path';
import type { NodeProfile } from './types.js';

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRY = 1;

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

export function getTimeoutMs(): number {
  const value = Number(process.env.AELF_NODE_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_TIMEOUT_MS;
}

export function getRetryCount(): number {
  const value = Number(process.env.AELF_NODE_RETRY);
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : DEFAULT_RETRY;
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
