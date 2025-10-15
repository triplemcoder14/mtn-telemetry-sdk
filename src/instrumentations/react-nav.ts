import { SpanKind, trace } from '@opentelemetry/api';
import type { NavigationContainerLike } from '../types';

export interface NavigationInstrumentation {
  attach(ref: NavigationContainerLike | null | undefined): void;
  detach(): void;
  shutdown: () => Promise<void>;
}

export function installReactNavigationInstrumentation(
  navigationRef?: NavigationContainerLike | null
): NavigationInstrumentation {
  const tracer = trace.getTracer('mtn-sdk:navigation');

  let unsubscribe: (() => void) | undefined;

  const detach = () => {
    unsubscribe?.();
    unsubscribe = undefined;
  };

  const attach = (ref: NavigationContainerLike | null | undefined) => {
    detach();
    if (!ref || typeof ref.addListener !== 'function') {
      return;
    }

    const listener = () => {
      const route = ref.getCurrentRoute?.();
      const name = route?.name ?? 'unknown';
      tracer.startActiveSpan(
        `Screen ${name}`,
        {
          kind: SpanKind.INTERNAL,
          attributes: {
            'screen.name': name,
          },
        },
        (span) => span.end()
      );
    };

    const maybeUnsubscribe = ref.addListener('state', listener);
    if (typeof maybeUnsubscribe === 'function') {
      unsubscribe = maybeUnsubscribe;
    } else if (typeof ref.removeListener === 'function') {
      unsubscribe = () => ref.removeListener?.('state', listener);
    } else {
      unsubscribe = undefined;
    }
  };

  if (navigationRef) {
    attach(navigationRef);
  }

  return {
    attach,
    detach,
    shutdown: async () => {
      detach();
    },
  };
}
