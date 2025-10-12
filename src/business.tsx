import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import { trace, SpanKind } from '@opentelemetry/api';

/**
 * BusinessTracer — captures business journeys and steps
 */
export class BusinessTracer {
  private static currentJourney?: { name: string; startTime: number };

  /**
   * Start a business journey (e.g. "UserOnboarding", "PurchaseFlow")
   */
  static start(journeyName: string, attrs: Record<string, any> = {}) {
    const tracer = trace.getTracer('mtn-sdk:business');
    const span = tracer.startSpan(`Journey ${journeyName}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'business.journey': journeyName,
        ...attrs,
      },
    });
    this.currentJourney = { name: journeyName, startTime: Date.now() };
    span.end(); // parent marker span; steps are separate child spans
  }

  /**
   * Record a business step within a journey (e.g. "PaymentAuthorized")
   */
  static step(stepName: string, attrs: Record<string, any> = {}) {
    const tracer = trace.getTracer('mtn-sdk:business');
    const journey = this.currentJourney?.name ?? 'unknown';
    const span = tracer.startSpan(`Step ${stepName}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'business.journey': journey,
        'business.step': stepName,
        ...attrs,
      },
    });
    span.end();
  }

  /**
   * Complete a business journey
   */
  static complete(attrs: Record<string, any> = {}) {
    const tracer = trace.getTracer('mtn-sdk:business');
    const journey = this.currentJourney?.name ?? 'unknown';
    const dur = this.currentJourney
      ? Date.now() - this.currentJourney.startTime
      : undefined;

    const span = tracer.startSpan(`Journey ${journey} Complete`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'business.journey': journey,
        'business.completed': true,
        'business.duration_ms': dur,
        ...attrs,
      },
    });

    span.end();
    this.currentJourney = undefined;
  }
}

/**
 * TrackedPressable — wraps a Pressable and records user interactions as steps
 */
export function TrackedPressable({
  onPress,
  accessibilityLabel,
  children,
  ...rest
}: PressableProps & { children?: React.ReactNode }) {
  const label =
    (accessibilityLabel as string) ||
    (typeof children === 'string' ? children : 'pressable');

  const handlePress = (e: any) => {
    BusinessTracer.step(`tap:${label}`);
    onPress?.(e);
  };

  return (
    <Pressable {...rest} onPress={handlePress}>
      {children}
    </Pressable>
  );
}
