import { BasicTracerProvider } from '@opentelemetry/sdk-trace-base';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import type { Resource } from '@opentelemetry/resources';
export declare function buildProviders(args: {
    resource: Resource;
    tracesUrl: string;
    metricsUrl?: string;
    headers?: Record<string, string>;
    samplingRatio: number;
}): {
    tracerProvider: BasicTracerProvider;
    meterProvider: MeterProvider;
    shutdown: () => Promise<void>;
};
