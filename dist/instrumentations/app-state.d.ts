import type { MeterProvider } from '@opentelemetry/sdk-metrics';
export declare function installAppStateInstrumentation(_tracerProvider: any, meterProvider: MeterProvider): () => Promise<void>;
