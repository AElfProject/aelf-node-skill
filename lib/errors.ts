import type { SkillError, SkillResponse } from './types.js';

export class HttpStatusError extends Error {
  public readonly status: number;

  public readonly body: unknown;

  public readonly code: string;

  constructor(status: number, body: unknown, code = 'HTTP_ERROR') {
    super(`HTTP request failed with status ${status}`);
    this.name = 'HttpStatusError';
    this.status = status;
    this.body = body;
    this.code = code;
  }
}

function stringifyRaw(input: unknown): string {
  if (input == null) {
    return '';
  }
  if (typeof input === 'string') {
    return input;
  }
  try {
    return JSON.stringify(input);
  } catch {
    return String(input);
  }
}

export function normalizeError(input: unknown, fallbackCode = 'UNKNOWN_ERROR'): SkillError {
  if (input instanceof HttpStatusError) {
    const body = input.body as Record<string, unknown> | undefined;
    const error = body?.Error as Record<string, unknown> | undefined;
    return {
      code: String(error?.Code || input.code || fallbackCode),
      message: String(error?.Message || input.message || 'HTTP request failed'),
      details: String(error?.Details || ''),
      httpStatus: input.status,
      raw: input.body,
    };
  }

  if (input instanceof Error) {
    return {
      code: fallbackCode,
      message: input.message,
      raw: { name: input.name, stack: input.stack },
    };
  }

  return {
    code: fallbackCode,
    message: 'Unhandled error',
    details: stringifyRaw(input),
    raw: input,
  };
}

export function okResponse<T>(traceId: string, data: T): SkillResponse<T> {
  return { ok: true, data, traceId };
}

export function errorResponse<T>(traceId: string, error: SkillError): SkillResponse<T> {
  return { ok: false, error, traceId };
}
