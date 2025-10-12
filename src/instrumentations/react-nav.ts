    import { trace, SpanKind } from '@opentelemetry/api';


export function installReactNavigationInstrumentation(_tracerProvider: any) {
const tracer = trace.getTracer('mtn-sdk:navigation');
let unsubscribe: undefined | (() => void);


function attach(navRef: any) {
if (!navRef) return;
unsubscribe = navRef.addListener?.('state', () => {
const route = navRef.getCurrentRoute?.();
const name = route?.name ?? 'unknown';
tracer.startActiveSpan(`Screen ${name}`, { kind: SpanKind.INTERNAL, attributes: { 'screen.name': name } }, (span) => span.end());
});
}


function detach() { unsubscribe?.(); }
const shutdown = async () => { detach(); };
(globalThis as any).__MTN_OTEL_ATTACH_NAV__ = attach;
return shutdown;
}
