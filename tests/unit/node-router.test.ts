import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { resolveNode } from '../../lib/node-router.js';
import { importNode } from '../../lib/node-registry.js';

const originalRegistryPath = process.env.AELF_NODE_REGISTRY_PATH;
const originalAelfRpc = process.env.AELF_NODE_AELF_RPC_URL;

let currentTempDir: string | undefined;

async function withTempRegistry(): Promise<void> {
  currentTempDir = await mkdtemp(join(tmpdir(), 'aelf-node-skill-test-'));
  process.env.AELF_NODE_REGISTRY_PATH = join(currentTempDir, 'nodes.json');
}

afterEach(async () => {
  process.env.AELF_NODE_REGISTRY_PATH = originalRegistryPath;
  process.env.AELF_NODE_AELF_RPC_URL = originalAelfRpc;
  if (currentTempDir) {
    await rm(currentTempDir, { recursive: true, force: true });
    currentTempDir = undefined;
  }
});

describe('node-router priority', () => {
  it('uses default node when no override exists', async () => {
    await withTempRegistry();
    const resolved = await resolveNode({ chainId: 'AELF' });
    expect(resolved.node.rpcUrl).toBe('https://aelf-public-node.aelf.io');
    expect(resolved.node.source).toBe('default');
  });

  it('uses imported node before default when env override is absent', async () => {
    await withTempRegistry();
    await importNode({
      id: 'custom-aelf',
      chainId: 'AELF',
      rpcUrl: 'https://custom-aelf-node.test',
      enabled: true,
    });

    const resolved = await resolveNode({ chainId: 'AELF' });
    expect(resolved.node.id).toBe('custom-aelf');
    expect(resolved.node.source).toBe('imported');
  });

  it('uses env override before imported nodes', async () => {
    await withTempRegistry();
    await importNode({
      id: 'custom-aelf',
      chainId: 'AELF',
      rpcUrl: 'https://custom-aelf-node.test',
      enabled: true,
    });
    process.env.AELF_NODE_AELF_RPC_URL = 'https://env-aelf-node.test';

    const resolved = await resolveNode({ chainId: 'AELF' });
    expect(resolved.node.rpcUrl).toBe('https://env-aelf-node.test');
    expect(resolved.node.source).toBe('env');
  });
});
