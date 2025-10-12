import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';


export function installFetchInstrumentation(_tracerProvider: any) {
const tracer = trace.getTracer('mtn-sdk:fetch');
const originalFetch = globalThis.fetch;
if (!originalFetch) return async () => {};


globalThis.fetch = (async (input: any, init?: RequestInit) => {
const url = typeof input === 'string' ? input : input?.url;
const method = (init?.method || (typeof input !== 'string' ? input?.method : 'GET') || 'GET').toUpperCase();


return tracer.startActiveSpan(`HTTP ${method}`, { kind: SpanKind.CLIENT, attributes: {
'http.method': method,
'http.url': String(url),
} }, async (span) => {
try {
const headers = new Headers(init?.headers || (typeof input !== 'string' ? input?.headers : undefined) || {});
const spanContext = span.spanContext();
if (spanContext && spanContext.traceId && spanContext.spanId) {
headers.set('traceparent', `00-${spanContext.traceId}-${spanContext.spanId}-01`);
}
const res = await originalFetch(typeof input === 'string' ? url : { ...input, headers }, init ? { ...init, headers } : undefined);
span.setAttribute('http.status_code', res.status);
if (!res.ok) span.setStatus({ code: SpanStatusCode.ERROR });
return res;
} catch (e: any) {
span.recordException?.(e);
span.setStatus({ code: SpanStatusCode.ERROR, message: String(e?.message ?? e) });
throw e;
} finally {
span.end();
}
});
}) as typeof fetch;


return async () => { globalThis.fetch = originalFetch; };
}
