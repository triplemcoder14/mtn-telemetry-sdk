"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installFetchInstrumentation = installFetchInstrumentation;
const api_1 = require("@opentelemetry/api");
function installFetchInstrumentation(_tracerProvider) {
    const tracer = api_1.trace.getTracer('mtn-sdk:fetch');
    const originalFetch = globalThis.fetch;
    if (!originalFetch)
        return async () => { };
    globalThis.fetch = (async (input, init) => {
        const url = typeof input === 'string' ? input : input === null || input === void 0 ? void 0 : input.url;
        const method = ((init === null || init === void 0 ? void 0 : init.method) || (typeof input !== 'string' ? input === null || input === void 0 ? void 0 : input.method : 'GET') || 'GET').toUpperCase();
        return tracer.startActiveSpan(`HTTP ${method}`, { kind: api_1.SpanKind.CLIENT, attributes: {
                'http.method': method,
                'http.url': String(url),
            } }, async (span) => {
            var _a, _b;
            try {
                const headers = new Headers((init === null || init === void 0 ? void 0 : init.headers) || (typeof input !== 'string' ? input === null || input === void 0 ? void 0 : input.headers : undefined) || {});
                const spanContext = span.spanContext();
                if (spanContext && spanContext.traceId && spanContext.spanId) {
                    headers.set('traceparent', `00-${spanContext.traceId}-${spanContext.spanId}-01`);
                }
                const res = await originalFetch(typeof input === 'string' ? url : { ...input, headers }, init ? { ...init, headers } : undefined);
                span.setAttribute('http.status_code', res.status);
                if (!res.ok)
                    span.setStatus({ code: api_1.SpanStatusCode.ERROR });
                return res;
            }
            catch (e) {
                (_a = span.recordException) === null || _a === void 0 ? void 0 : _a.call(span, e);
                span.setStatus({ code: api_1.SpanStatusCode.ERROR, message: String((_b = e === null || e === void 0 ? void 0 : e.message) !== null && _b !== void 0 ? _b : e) });
                throw e;
            }
            finally {
                span.end();
            }
        });
    });
    return async () => { globalThis.fetch = originalFetch; };
}
