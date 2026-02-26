import { DEFAULT_NODES, getEnvOverrideNodes } from './config.js';
import { listImportedNodes } from './node-registry.js';
import { validateChainTargetInput } from './validators.js';
import type { NodeProfile, ResolveNodeInput, ResolveNodeResult } from './types.js';

function sanitize(input: NodeProfile[]): NodeProfile[] {
  return input.filter(item => !!item.rpcUrl && item.enabled !== false);
}

export async function listAvailableNodes(): Promise<NodeProfile[]> {
  const envNodes = sanitize(getEnvOverrideNodes());
  const importedNodes = sanitize(await listImportedNodes());
  const defaults = sanitize(DEFAULT_NODES);
  return [...envNodes, ...importedNodes, ...defaults];
}

export async function resolveNode(input: ResolveNodeInput): Promise<ResolveNodeResult> {
  validateChainTargetInput(input);

  if (input.rpcUrl) {
    return {
      node: {
        id: 'direct-rpc',
        chainId: input.chainId || 'AELF',
        rpcUrl: input.rpcUrl,
        enabled: true,
        source: 'direct',
      },
      candidates: [],
    };
  }

  const candidates = await listAvailableNodes();

  if (input.nodeId) {
    const node = candidates.find(item => item.id === input.nodeId);
    if (!node) {
      throw new Error(`Node id not found: ${input.nodeId}`);
    }
    return { node, candidates };
  }

  const chainId = input.chainId || 'AELF';
  const node = candidates.find(item => item.chainId === chainId);
  if (!node) {
    throw new Error(`No available node for chainId: ${chainId}`);
  }

  return { node, candidates };
}
