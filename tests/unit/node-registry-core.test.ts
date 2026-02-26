import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { importNode, listNodes } from '../../src/core/node-registry.js';

const originalRegistryPath = process.env.AELF_NODE_REGISTRY_PATH;
let currentTempDir = '';

beforeEach(async () => {
  currentTempDir = await mkdtemp(join(tmpdir(), 'aelf-node-registry-core-test-'));
  process.env.AELF_NODE_REGISTRY_PATH = join(currentTempDir, 'nodes.json');
});

afterEach(async () => {
  if (originalRegistryPath === undefined) {
    delete process.env.AELF_NODE_REGISTRY_PATH;
  } else {
    process.env.AELF_NODE_REGISTRY_PATH = originalRegistryPath;
  }

  if (currentTempDir) {
    await rm(currentTempDir, { recursive: true, force: true });
    currentTempDir = '';
  }
});

describe('core/node-registry', () => {
  it('validates node input before writing', async () => {
    const result = await importNode({
      id: 'custom-aelf',
      chainId: 'AELF',
      rpcUrl: 'file:///tmp/not-allowed',
      enabled: true,
    });

    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe('IMPORT_NODE_FAILED');
    expect(result.error?.message.includes('rpcUrl must use http or https protocol')).toBe(true);
  });

  it('does not lose writes when importNode runs concurrently', async () => {
    const [first, second] = await Promise.all([
      importNode({
        id: 'custom-aelf',
        chainId: 'AELF',
        rpcUrl: 'https://custom-aelf-node.test',
        enabled: true,
      }),
      importNode({
        id: 'custom-tdvv',
        chainId: 'tDVV',
        rpcUrl: 'https://custom-tdvv-node.test',
        enabled: true,
      }),
    ]);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);

    const listed = await listNodes();
    expect(listed.ok).toBe(true);

    const imported = (listed.data as any).imported as Array<{ id: string }>;
    const importedIds = imported.map(item => item.id);

    expect(importedIds.includes('custom-aelf')).toBe(true);
    expect(importedIds.includes('custom-tdvv')).toBe(true);
  });
});
