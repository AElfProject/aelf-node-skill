import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('mcp server schema', () => {
  it('does not expose privateKey in mcp tool inputs and uses package version', () => {
    const serverPath = resolve(process.cwd(), 'src/mcp/server.ts');
    const source = readFileSync(serverPath, 'utf8');

    expect(source.includes("privateKey: z.string")).toBe(false);
    expect(source.includes('version: packageJson.version')).toBe(true);
  });
});
