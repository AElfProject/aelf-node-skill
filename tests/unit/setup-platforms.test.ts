import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setupClaude, uninstallClaude } from '../../bin/platforms/claude.js';
import { setupCursor, uninstallCursor } from '../../bin/platforms/cursor.js';
import { setupOpenClaw, uninstallOpenClaw } from '../../bin/platforms/openclaw.js';
import { SERVER_NAME, mergeMcpConfig, removeMcpEntry } from '../../bin/platforms/utils.js';

let testDir = '';

beforeEach(async () => {
  testDir = await mkdtemp(join(tmpdir(), 'aelf-node-skill-setup-test-'));
});

afterEach(async () => {
  if (testDir) {
    await rm(testDir, { recursive: true, force: true });
    testDir = '';
  }
});

describe('setup utils', () => {
  it('merges and removes mcp server entries safely', () => {
    const entry = {
      command: 'bun',
      args: ['run', '/mock/server.ts'],
      env: { AELF_PRIVATE_KEY: '<YOUR_PRIVATE_KEY>' },
    };

    const created = mergeMcpConfig({}, SERVER_NAME, entry, false);
    expect(created.action).toBe('created');
    expect(created.config.mcpServers[SERVER_NAME].args[1]).toBe('/mock/server.ts');

    const skipped = mergeMcpConfig(created.config, SERVER_NAME, entry, false);
    expect(skipped.action).toBe('skipped');

    const updated = mergeMcpConfig(created.config, SERVER_NAME, {
      ...entry,
      args: ['run', '/mock/new-server.ts'],
    }, true);
    expect(updated.action).toBe('updated');
    expect(updated.config.mcpServers[SERVER_NAME].args[1]).toBe('/mock/new-server.ts');

    const removed = removeMcpEntry(updated.config, SERVER_NAME);
    expect(removed.removed).toBe(true);
    expect(removed.config.mcpServers[SERVER_NAME]).toBeUndefined();
  });

  it('merges and uninstalls openclaw tools without affecting unrelated tools', async () => {
    const configPath = join(testDir, 'openclaw.config.json');
    await writeFile(
      configPath,
      JSON.stringify(
        {
          tools: [
            {
              name: 'other-tool',
              command: 'bun',
              args: ['run', 'other.ts'],
              cwd: '/tmp/other',
            },
            {
              name: 'aelf-get-chain-status',
              command: 'bun',
              args: ['run', 'legacy.ts'],
              cwd: '/tmp/legacy',
            },
          ],
        },
        null,
        2,
      ),
      'utf8',
    );

    const merged = setupOpenClaw({
      configPath,
      cwd: '/tmp/new-cwd',
      force: false,
    });
    expect(merged).toBe(true);

    const afterMerge = JSON.parse(await readFile(configPath, 'utf8')) as { tools: Array<{ name: string; cwd?: string }> };
    const otherTool = afterMerge.tools.find(tool => tool.name === 'other-tool');
    expect(otherTool?.cwd).toBe('/tmp/other');

    const chainToolBeforeForce = afterMerge.tools.find(tool => tool.name === 'aelf-get-chain-status');
    expect(chainToolBeforeForce?.cwd).toBe('/tmp/legacy');

    const forceMerged = setupOpenClaw({
      configPath,
      cwd: '/tmp/forced-cwd',
      force: true,
    });
    expect(forceMerged).toBe(true);

    const afterForceMerge = JSON.parse(await readFile(configPath, 'utf8')) as { tools: Array<{ name: string; cwd?: string }> };
    const chainToolAfterForce = afterForceMerge.tools.find(tool => tool.name === 'aelf-get-chain-status');
    expect(chainToolAfterForce?.cwd).toBe('/tmp/forced-cwd');

    const uninstalled = uninstallOpenClaw({ configPath });
    expect(uninstalled).toBe(true);

    const afterUninstall = JSON.parse(await readFile(configPath, 'utf8')) as { tools: Array<{ name: string }> };
    expect(afterUninstall.tools.some(tool => tool.name === 'other-tool')).toBe(true);
    expect(afterUninstall.tools.some(tool => tool.name.startsWith('aelf-'))).toBe(false);
  });

  it('creates, skips, forces update, and uninstalls claude config', async () => {
    const configPath = join(testDir, 'claude.config.json');

    const created = setupClaude({
      configPath,
      serverPath: '/tmp/server-1.ts',
      force: false,
    });
    expect(created).toBe(true);

    const skipped = setupClaude({
      configPath,
      serverPath: '/tmp/server-2.ts',
      force: false,
    });
    expect(skipped).toBe(false);

    const forced = setupClaude({
      configPath,
      serverPath: '/tmp/server-2.ts',
      force: true,
    });
    expect(forced).toBe(true);

    const configAfterForce = JSON.parse(await readFile(configPath, 'utf8')) as {
      mcpServers: Record<string, { args: string[] }>;
    };
    expect(configAfterForce.mcpServers[SERVER_NAME].args[1]).toBe('/tmp/server-2.ts');

    const removed = uninstallClaude({ configPath });
    expect(removed).toBe(true);
    const removedAgain = uninstallClaude({ configPath });
    expect(removedAgain).toBe(false);
  });

  it('creates, skips, forces update, and uninstalls cursor config', async () => {
    const configPath = join(testDir, 'cursor.config.json');

    const created = setupCursor({
      configPath,
      serverPath: '/tmp/cursor-server-1.ts',
      force: false,
    });
    expect(created).toBe(true);

    const skipped = setupCursor({
      configPath,
      serverPath: '/tmp/cursor-server-2.ts',
      force: false,
    });
    expect(skipped).toBe(false);

    const forced = setupCursor({
      configPath,
      serverPath: '/tmp/cursor-server-2.ts',
      force: true,
    });
    expect(forced).toBe(true);

    const configAfterForce = JSON.parse(await readFile(configPath, 'utf8')) as {
      mcpServers: Record<string, { args: string[] }>;
    };
    expect(configAfterForce.mcpServers[SERVER_NAME].args[1]).toBe('/tmp/cursor-server-2.ts');

    const removed = uninstallCursor({ configPath });
    expect(removed).toBe(true);
    const removedAgain = uninstallCursor({ configPath });
    expect(removedAgain).toBe(false);
  });
});
