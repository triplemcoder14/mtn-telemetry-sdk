import { AppState } from 'react-native';
import { trace, SpanKind, type Meter } from '@opentelemetry/api';

/**
 * instruments react native appstate to record when the app
 * triplemcoder14
 * enters foreground/background and emits spans + metrics.
 */
export function installAppStateInstrumentation(
  _tracerProvider: any,
  meter: Meter
) {
  const tracer = trace.getTracer('mtn-sdk:appstate');

  const fgCounter = meter.createCounter('app.foreground.count');
  const bgCounter = meter.createCounter('app.background.count');

  let lastState = AppState.currentState;

  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active' && lastState !== 'active') {
      fgCounter.add(1);
      tracer.startActiveSpan('App Foreground', { kind: SpanKind.INTERNAL }, (span) => span.end());
    } else if ((state === 'background' || state === 'inactive') && lastState === 'active') {
      bgCounter.add(1);
      tracer.startActiveSpan('App Background', { kind: SpanKind.INTERNAL }, (span) => span.end());
    }
    lastState = state as any;
  });

  // return a cleanup function
  return async () => {
    sub.remove();
  };
}


// import { AppState } from 'react-native';
// import { trace, SpanKind } from '@opentelemetry/api';
// import type { MeterProvider } from '@opentelemetry/sdk-metrics';
//
//
// export function installAppStateInstrumentation(_tracerProvider: any, meterProvider: MeterProvider) {
// const tracer = trace.getTracer('mtn-sdk:appstate');
// const meter = meterProvider.getMeter('mtn-sdk:appstate');
// const fgCounter = meter.createCounter('app.foreground.count');
// const bgCounter = meter.createCounter('app.background.count');
//
//
// let lastState = AppState.currentState;
// const sub = AppState.addEventListener('change', (state) => {
// if (state === 'active' && lastState !== 'active') {
// fgCounter.add(1);
// tracer.startActiveSpan('App Foreground', { kind: SpanKind.INTERNAL }, (span) => span.end());
// } else if ((state === 'background' || state === 'inactive') && lastState === 'active') {
// bgCounter.add(1);
// tracer.startActiveSpan('App Background', { kind: SpanKind.INTERNAL }, (span) => span.end());
// }
// lastState = state as any;
// });
//
//
// return async () => { sub.remove(); };
// }
