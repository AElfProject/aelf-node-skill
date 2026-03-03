import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import AElf from 'aelf-sdk';
import { resolvePrivateKeyContext } from '../../lib/signer-context.js';
import { setActiveWalletProfile } from '../../lib/wallet-context.js';

describe('lib/signer-context', () => {
  let tempDir: string | null = null;

  afterEach(() => {
    delete process.env.PORTKEY_SKILL_WALLET_CONTEXT_PATH;
    delete process.env.PORTKEY_WALLET_PASSWORD;
    delete process.env.AELF_PRIVATE_KEY;
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = null;
    }
  });

  test('resolves explicit private key', () => {
    const wallet = AElf.wallet.createNewWallet();
    const resolved = resolvePrivateKeyContext({
      signerMode: 'explicit',
      privateKey: wallet.privateKey,
    });
    expect(resolved.provider).toBe('explicit');
    expect(resolved.privateKey).toBe(wallet.privateKey);
  });

  test('resolves active EOA context with password env', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'aelf-node-signer-context-'));
    const contextPath = join(tempDir, 'context.v1.json');
    const walletFile = join(tempDir, 'wallet.json');
    process.env.PORTKEY_SKILL_WALLET_CONTEXT_PATH = contextPath;

    const password = 'secret';
    const wallet = AElf.wallet.createNewWallet();
    writeFileSync(
      walletFile,
      JSON.stringify(
        {
          address: wallet.address,
          AESEncryptPrivateKey: AElf.wallet.AESEncrypt(wallet.privateKey, password),
        },
        null,
        2,
      ),
    );

    setActiveWalletProfile(
      {
        walletType: 'EOA',
        source: 'eoa-local',
        address: wallet.address,
        walletFile,
      },
      { skill: 'test', version: '0.0.0' },
    );

    process.env.PORTKEY_WALLET_PASSWORD = password;
    const resolved = resolvePrivateKeyContext({ signerMode: 'context' });
    expect(resolved.provider).toBe('context');
    expect(resolved.privateKey).toBe(wallet.privateKey);
  });

  test('auto mode falls back to env', () => {
    const wallet = AElf.wallet.createNewWallet();
    process.env.AELF_PRIVATE_KEY = wallet.privateKey;
    const resolved = resolvePrivateKeyContext({ signerMode: 'auto' });
    expect(resolved.provider).toBe('env');
    expect(resolved.privateKey).toBe(wallet.privateKey);
  });
});
