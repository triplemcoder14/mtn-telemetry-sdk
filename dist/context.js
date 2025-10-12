"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startActiveSpan = startActiveSpan;
exports.withParent = withParent;
const api_1 = require("@opentelemetry/api");
function startActiveSpan(name, fn, kind = api_1.SpanKind.INTERNAL) {
    const tracer = api_1.trace.getTracer('mtn-sdk');
    return tracer.startActiveSpan(name, { kind }, async (span) => {
        var _a, _b;
        try {
            const result = await fn(span);
            span.setStatus({ code: api_1.SpanStatusCode.OK });
            return result;
        }
        catch (err) {
            (_a = span.recordException) === null || _a === void 0 ? void 0 : _a.call(span, err);
            span.setStatus({ code: api_1.SpanStatusCode.ERROR, message: String((_b = err === null || err === void 0 ? void 0 : err.message) !== null && _b !== void 0 ? _b : err) });
            throw err;
        }
        finally {
            span.end();
        }
    });
}
function withParent(parentContext = api_1.context.active(), fn) {
    return api_1.context.with(parentContext, fn);
}
