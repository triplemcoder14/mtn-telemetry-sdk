import { AppState } from 'react-native';
import { SpanKind, trace, type Meter } from '@opentelemetry/api';

/**
 * instruments react native appstate to record when the app
 * triplemcoder14
 * enters foreground/background and emits spans + metrics.
 */
export function installAppStateInstrumentation(meter: Meter) {
  const tracer = trace.getTracer('mtn-sdk:appstate');

  const fgCounter = meter.createCounter('app.foreground.count');
  const bgCounter = meter.createCounter('app.background.count');

  let lastState = AppState.currentState;

  const listener = (state: string) => {
    if (state === 'active' && lastState !== 'active') {
      fgCounter.add(1);
      tracer.startActiveSpan('App Foreground', { kind: SpanKind.INTERNAL }, (span) => span.end());
    } else if ((state === 'background' || state === 'inactive') && lastState === 'active') {
      bgCounter.add(1);
      tracer.startActiveSpan('App Background', { kind: SpanKind.INTERNAL }, (span) => span.end());
    }
    lastState = state as any;
  };

  const subscription = AppState.addEventListener('change', listener);

  // return a cleanup function
  return async () => {
    subscription.remove?.();
  };
}
