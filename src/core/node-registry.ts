import { importNode as importNodeToRegistry, listImportedNodes } from '../../lib/node-registry.js';
import { listAvailableNodes } from '../../lib/node-router.js';
import { executeWithResponse } from './common.js';
import type { ImportNodeInput, SkillResponse } from '../../lib/types.js';

export async function importNode(input: ImportNodeInput): Promise<SkillResponse<unknown>> {
  return executeWithResponse(async () => importNodeToRegistry(input), 'IMPORT_NODE_FAILED');
}

export async function listNodes(): Promise<SkillResponse<unknown>> {
  return executeWithResponse(async () => {
    const imported = await listImportedNodes();
    const available = await listAvailableNodes();
    return {
      imported,
      available,
    };
  }, 'LIST_NODES_FAILED');
}
