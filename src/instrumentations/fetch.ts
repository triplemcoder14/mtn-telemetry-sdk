import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';

const RequestCtor = (globalThis as { Request?: new (...args: any[]) => any }).Request;
const HeadersCtor = (globalThis as { Headers?: new (...args: any[]) => any }).Headers;

const canConstructRequest = typeof RequestCtor === 'function';
const canConstructHeaders = typeof HeadersCtor === 'function';

type FetchArgs = typeof globalThis.fetch extends (...args: infer P) => any ? P : [any?, any?];
type FetchInput = FetchArgs[0];
type FetchInit = FetchArgs[1];
type NormalizedInit = FetchInit extends undefined ? Record<string, unknown> : NonNullable<FetchInit>;

type RequestLike = typeof RequestCtor extends { prototype: infer P } ? P : any;

function normalizeRequest(input: FetchInput, init?: FetchInit): RequestLike | null {
  if (!canConstructRequest) {
    return null;
  }
  return new RequestCtor!(input as any, init as any);
}

function buildHeaders(
  request: RequestLike | null,
  init: FetchInit,
  input: FetchInput,
  traceparent: string | null
) {
  if (!canConstructHeaders) {
    return undefined;
  }

  const existing =
    (request as { headers?: unknown })?.headers ??
    (init as { headers?: unknown })?.headers ??
    (input as { headers?: unknown })?.headers;

  const headers = new HeadersCtor!(existing as any);
  if (traceparent) {
    headers.set('traceparent', traceparent);
  }
  return headers as unknown as NormalizedInit['headers'];
}

export function installFetchInstrumentation(): () => Promise<void> {
  const originalFetch = globalThis.fetch;
  if (typeof originalFetch !== 'function') {
    return async () => {};
  }

  const tracer = trace.getTracer('mtn-sdk:fetch');

  globalThis.fetch = (async (input: FetchInput, init?: FetchInit) => {
    const request = normalizeRequest(input, init);
    const method =
      (request as { method?: string })?.method?.toUpperCase?.() ??
      (typeof (init as { method?: string } | undefined)?.method === 'string'
        ? (init as { method?: string }).method!.toUpperCase()
        : undefined) ??
      (typeof (input as { method?: string } | undefined)?.method === 'string'
        ? (input as { method?: string }).method!.toUpperCase()
        : 'GET');
    const url =
      (request as { url?: string } | null)?.url ??
      (typeof input === 'string' ? input : (input as { url?: string })?.url);

    return tracer.startActiveSpan(
      `HTTP ${method}`,
      {
        kind: SpanKind.CLIENT,
        attributes: {
          'http.method': method,
          'http.url': String(url ?? ''),
        },
      },
      async (span) => {
        try {
          const spanContext = span.spanContext();
          const traceparent =
            spanContext?.traceId && spanContext?.spanId
              ? `00-${spanContext.traceId}-${spanContext.spanId}-01`
              : null;

          const finalInit: NormalizedInit = {
            ...((init as NormalizedInit) ?? {}),
            method,
          };

          const headers = buildHeaders(request, init, input, traceparent);
          if (headers) {
            (finalInit as { headers?: unknown }).headers = headers;
          }

          const finalInput =
            request && canConstructRequest
              ? new RequestCtor!(request as any, finalInit as any)
              : input;

          const response = await originalFetch(finalInput as any, finalInit as any);
          span.setAttribute('http.status_code', (response as { status: number }).status);
          if (!(response as { ok?: boolean }).ok) {
            span.setStatus({ code: SpanStatusCode.ERROR });
          }
          return response;
        } catch (error) {
          span.recordException(error as Error);
          span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error)?.message });
          throw error;
        } finally {
          span.end();
        }
      }
    );
  }) as typeof fetch;

  return async () => {
    globalThis.fetch = originalFetch;
  };
}
