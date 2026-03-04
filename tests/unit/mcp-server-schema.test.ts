import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('mcp server schema', () => {
  it('uses package version and exposes signer context schema', () => {
    const serverPath = resolve(process.cwd(), 'src/mcp/server.ts');
    const source = readFileSync(serverPath, 'utf8');

    expect(source.includes('const signerContextSchema')).toBe(true);
    expect(source.includes('version: packageJson.version')).toBe(true);
  });
});
