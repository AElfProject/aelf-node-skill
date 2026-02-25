import { errorResponse, normalizeError, okResponse } from '../../lib/errors.js';
import { createTraceId } from '../../lib/trace.js';
import type { SkillResponse } from '../../lib/types.js';

export async function executeWithResponse<T>(
  action: (traceId: string) => Promise<T>,
  fallbackErrorCode = 'CORE_ERROR',
): Promise<SkillResponse<T>> {
  const traceId = createTraceId();
  try {
    const data = await action(traceId);
    return okResponse(traceId, data);
  } catch (error) {
    return errorResponse(traceId, normalizeError(error, fallbackErrorCode));
  }
}
