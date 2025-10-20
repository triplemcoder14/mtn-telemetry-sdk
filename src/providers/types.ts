import type { BasicTracerProvider } from '@opentelemetry/sdk-trace-base';
import type { MeterProvider } from '@opentelemetry/sdk-metrics';

export interface ProviderBundle {
  tracerProvider: BasicTracerProvider;
  meterProvider: MeterProvider;
  shutdown: () => Promise<void>;
}
