import { ParentBasedSampler, TraceIdRatioBasedSampler, BasicTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import type { Resource } from '@opentelemetry/resources';


export function buildProviders(args: {
resource: Resource;
tracesUrl: string;
metricsUrl?: string;
headers?: Record<string, string>;
samplingRatio: number;
}) {
const tracerProvider = new BasicTracerProvider({
resource: args.resource,
sampler: new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(args.samplingRatio) }),
});


const traceExporter = new OTLPTraceExporter({ url: args.tracesUrl, headers: args.headers });
tracerProvider.addSpanProcessor(new BatchSpanProcessor(traceExporter, {
maxQueueSize: 2048,
scheduledDelayMillis: 5000,
exportTimeoutMillis: 10000,
maxExportBatchSize: 256,
}));
tracerProvider.register();


const meterProvider = new MeterProvider({ resource: args.resource });
if (args.metricsUrl) {
const metricExporter = new OTLPMetricExporter({ url: args.metricsUrl, headers: args.headers });
meterProvider.addMetricReader(new PeriodicExportingMetricReader({
exporter: metricExporter,
exportIntervalMillis: 60000,
exportTimeoutMillis: 15000,
}));
}


async function shutdown() {
await Promise.allSettled([
tracerProvider.shutdown(),
meterProvider.shutdown?.(),
]);
}


return { tracerProvider, meterProvider, shutdown };
}
