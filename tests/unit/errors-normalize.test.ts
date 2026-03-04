import { describe, expect, test } from 'bun:test';
import { HttpStatusError, normalizeError } from '../../lib/errors.js';

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

  test('normalizes HttpStatusError with backend Error payload', () => {
    const err = new HttpStatusError(502, {
      Error: {
        Code: 'NODE_UNAVAILABLE',
        Message: 'upstream timeout',
        Details: 'rpc failed',
      },
    });
    const normalized = normalizeError(err, 'QUERY_FAILED');
    expect(normalized.code).toBe('NODE_UNAVAILABLE');
    expect(normalized.message).toBe('upstream timeout');
    expect(normalized.details).toBe('rpc failed');
    expect(normalized.httpStatus).toBe(502);
  });

  test('falls back when Error.code is not a string', () => {
    const err = new Error('bad input') as Error & { code?: number; details?: unknown };
    err.code = 400;
    err.details = { field: 'chainId' };

    const normalized = normalizeError(err, 'VALIDATION_FAILED');
    expect(normalized.code).toBe('VALIDATION_FAILED');
    expect(normalized.message).toBe('bad input');
    expect(normalized.details).toContain('chainId');
  });

  test('handles non-Error input values', () => {
    const normalizedString = normalizeError('raw-failure', 'SEND_FAILED');
    expect(normalizedString.code).toBe('SEND_FAILED');
    expect(normalizedString.message).toBe('Unhandled error');
    expect(normalizedString.details).toBe('raw-failure');

    const normalizedNull = normalizeError(null, 'SEND_FAILED');
    expect(normalizedNull.code).toBe('SEND_FAILED');
    expect(normalizedNull.details).toBe('');
  });
});
