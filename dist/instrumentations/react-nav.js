"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installReactNavigationInstrumentation = installReactNavigationInstrumentation;
const api_1 = require("@opentelemetry/api");
function installReactNavigationInstrumentation(_tracerProvider) {
    const tracer = api_1.trace.getTracer('mtn-sdk:navigation');
    let unsubscribe;
    function attach(navRef) {
        var _a;
        if (!navRef)
            return;
        unsubscribe = (_a = navRef.addListener) === null || _a === void 0 ? void 0 : _a.call(navRef, 'state', () => {
            var _a, _b;
            const route = (_a = navRef.getCurrentRoute) === null || _a === void 0 ? void 0 : _a.call(navRef);
            const name = (_b = route === null || route === void 0 ? void 0 : route.name) !== null && _b !== void 0 ? _b : 'unknown';
            tracer.startActiveSpan(`Screen ${name}`, { kind: api_1.SpanKind.INTERNAL, attributes: { 'screen.name': name } }, (span) => span.end());
        });
    }
    function detach() { unsubscribe === null || unsubscribe === void 0 ? void 0 : unsubscribe(); }
    const shutdown = async () => { detach(); };
    globalThis.__MTN_OTEL_ATTACH_NAV__ = attach;
    return shutdown;
}
