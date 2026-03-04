import { describe, expect, test } from 'bun:test';
import { normalizeError } from '../../lib/errors.js';

describe('lib/errors normalizeError', () => {
  test('preserves explicit error code on Error-like input', () => {
    const err = new Error('missing signer context') as Error & { code: string; details: string };
    err.code = 'SIGNER_CONTEXT_NOT_FOUND';
    err.details = 'active profile missing';

    const normalized = normalizeError(err, 'SEND_CONTRACT_TRANSACTION_FAILED');
    expect(normalized.code).toBe('SIGNER_CONTEXT_NOT_FOUND');
    expect(normalized.message).toBe('missing signer context');
    expect(normalized.details).toBe('active profile missing');
  });
});
