import { context, trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';


export function startActiveSpan<T>(name: string, fn: (span: any) => Promise<T> | T, kind: SpanKind = SpanKind.INTERNAL) {
const tracer = trace.getTracer('mtn-sdk');
return tracer.startActiveSpan(name, { kind }, async (span) => {
try {
const result = await fn(span);
span.setStatus({ code: SpanStatusCode.OK });
return result;
} catch (err: any) {
span.recordException?.(err);
span.setStatus({ code: SpanStatusCode.ERROR, message: String(err?.message ?? err) });
throw err;
} finally {
span.end();
}
});
}


export function withParent<T>(parentContext = context.active(), fn: () => T): T {
return context.with(parentContext, fn);
}
