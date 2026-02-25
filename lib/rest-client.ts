import { HttpStatusError } from './errors.js';
import { getRetryCount, getTimeoutMs } from './config.js';

export interface RestRequest {
  method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH';
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

function toQueryString(query?: Record<string, string | number | boolean | undefined>): string {
  if (!query) return '';
  const usp = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) {
      usp.set(key, String(value));
    }
  });
  const text = usp.toString();
  return text ? `?${text}` : '';
}

function parseText(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const num = Number(text);
    if (!Number.isNaN(num) && text.trim() !== '') {
      return num;
    }
    return text;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class RestClient {
  private readonly baseUrl: string;

  private readonly timeoutMs: number;

  private readonly retry: number;

  constructor(baseUrl: string, timeoutMs = getTimeoutMs(), retry = getRetryCount()) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
    this.retry = retry;
  }

  async request<T = unknown>(request: RestRequest): Promise<T> {
    const path = request.path.startsWith('/api/') ? request.path : `/api/${request.path.replace(/^\//, '')}`;
    const query = toQueryString(request.query);
    const url = `${this.baseUrl}${path}${query}`;

    let lastError: unknown;

    for (let attempt = 0; attempt <= this.retry; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await fetch(url, {
          method: request.method,
          headers: {
            Accept: 'application/json, text/plain; q=0.9',
            'Content-Type': 'application/json',
          },
          body: request.body === undefined ? undefined : JSON.stringify(request.body),
          signal: controller.signal,
        });

        const text = await response.text();
        const parsed = parseText(text);

        if (!response.ok) {
          throw new HttpStatusError(response.status, parsed);
        }

        return parsed as T;
      } catch (error) {
        lastError = error;
        if (attempt < this.retry) {
          await sleep(200 * (attempt + 1));
          continue;
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError;
  }
}
