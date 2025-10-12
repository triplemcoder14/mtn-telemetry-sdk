"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installAppStateInstrumentation = installAppStateInstrumentation;
const react_native_1 = require("react-native");
const api_1 = require("@opentelemetry/api");
function installAppStateInstrumentation(_tracerProvider, meterProvider) {
    const tracer = api_1.trace.getTracer('mtn-sdk:appstate');
    const meter = meterProvider.getMeter('mtn-sdk:appstate');
    const fgCounter = meter.createCounter('app.foreground.count');
    const bgCounter = meter.createCounter('app.background.count');
    let lastState = react_native_1.AppState.currentState;
    const sub = react_native_1.AppState.addEventListener('change', (state) => {
        if (state === 'active' && lastState !== 'active') {
            fgCounter.add(1);
            tracer.startActiveSpan('App Foreground', { kind: api_1.SpanKind.INTERNAL }, (span) => span.end());
        }
        else if ((state === 'background' || state === 'inactive') && lastState === 'active') {
            bgCounter.add(1);
            tracer.startActiveSpan('App Background', { kind: api_1.SpanKind.INTERNAL }, (span) => span.end());
        }
        lastState = state;
    });
    return async () => { sub.remove(); };
}
