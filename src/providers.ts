import { NodeSDK } from '@opentelemetry/sdk-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { Resource } from '@opentelemetry/resources';
import type { OTelRNOptions } from './types';

export function buildProviders(opts: OTelRNOptions & { resource: Resource }) {
  const traceExporter = new OTLPTraceExporter({
    url: opts.otlp.tracesUrl ?? 'http://localhost:4318/v1/traces',
    headers: opts.otlp.headers ?? {},
  });

  const metricExporter = new OTLPMetricExporter({
    url: opts.otlp.metricsUrl ?? 'http://localhost:4318/v1/metrics',
    headers: opts.otlp.headers ?? {},
  });

  const sdk = new NodeSDK({
    resource: opts.resource,
    traceExporter,
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 60000,
    }),
  });

  const shutdown = async () => {
    await sdk.shutdown();
  };

  // start immediately
  sdk.start();

  return { sdk, shutdown, traceExporter, metricExporter };
}




// import { NodeSDK } from '@opentelemetry/sdk-node';
// import { BatchSpanProcessor, ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
// import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
// import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
// import { Resource } from '@opentelemetry/resources';
// import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
//
// export function buildProviders(args: {
//   resource: Resource;
//   tracesUrl: string;
//   metricsUrl?: string;
//   headers?: Record<string, string>;
//   samplingRatio: number;
// }) {
//   // Configure trace exporter
//   const traceExporter = new OTLPTraceExporter({
//     url: args.tracesUrl,
//     headers: args.headers,
//   });
//
//   // Configure metric exporter (optional)
//   const metricExporter = args.metricsUrl
//     ? new OTLPMetricExporter({
//         url: args.metricsUrl,
//         headers: args.headers,
//       })
//     : undefined;
//
//   // Create NodeSDK instance
//   const sdk = new NodeSDK({
//     resource: args.resource,
//     sampler: new ParentBasedSampler({
//       root: new TraceIdRatioBasedSampler(args.samplingRatio),
//     }),
//     spanProcessor: new BatchSpanProcessor(traceExporter, {
//       maxQueueSize: 2048,
//       scheduledDelayMillis: 5000,
//       exportTimeoutMillis: 10000,
//       maxExportBatchSize: 256,
//     }),
//     metricReader: metricExporter
//       ? new PeriodicExportingMetricReader({
//           exporter: metricExporter,
//           exportIntervalMillis: 60000,
//           exportTimeoutMillis: 15000,
//         })
//       : undefined,
//   });
//
//   async function shutdown() {
//     await sdk.shutdown();
//   }
//
//   return { sdk, shutdown };
// }
