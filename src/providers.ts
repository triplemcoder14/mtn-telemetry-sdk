import { context as otelContext, metrics, trace, type ContextManager } from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import {
  BasicTracerProvider,
  BatchSpanProcessor,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-base';
import {
  MeterProvider,
  PeriodicExportingMetricReader,
  type MetricReader,
} from '@opentelemetry/sdk-metrics';
import type { OTelRNOptions } from './types';
import { StackContextManager } from './context-manager/stack';

export interface ProviderBundle {
  tracerProvider: BasicTracerProvider;
  meterProvider: MeterProvider;
  shutdown: () => Promise<void>;
}

const DEFAULT_TRACE_URL = 'http://localhost:4318/v1/traces';
const DEFAULT_METRIC_URL = 'http://localhost:4318/v1/metrics';

export function buildProviders(opts: OTelRNOptions & { resource: Resource }): ProviderBundle {
  const otlp = opts.otlp ?? {};
  const traceExporter = new OTLPTraceExporter({
    url: otlp.tracesUrl ?? DEFAULT_TRACE_URL,
    headers: otlp.headers,
  });

  const tracerProvider = new BasicTracerProvider({
    resource: opts.resource,
    sampler: new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(opts.samplingRatio ?? 1),
    }),
    spanProcessors: [new BatchSpanProcessor(traceExporter)],
  });

  const globalNavigator = globalThis as typeof globalThis & {
    navigator?: { product?: string };
  };
  const isReactNative = globalNavigator.navigator?.product === 'ReactNative';

  const contextManager = isReactNative ? new StackContextManager().enable() : null;
  const previousContextManager: ContextManager | undefined =
      (otelContext as any)?._getContextManager?.();

  if (contextManager) {
    otelContext.setGlobalContextManager(contextManager);
  }

  // const contextManager = isReactNative ? new StackContextManager().enable() : null;
  // const previousContextManager: ContextManager | undefined = contextManager
  //   ? otelContext.setGlobalContextManager(contextManager)
  //   : undefined;

  trace.setGlobalTracerProvider(tracerProvider);

  const metricReaders: MetricReader[] = [];

  if (otlp.metricsUrl) {
    const metricExporter = new OTLPMetricExporter({
      url: otlp.metricsUrl ?? DEFAULT_METRIC_URL,
      headers: otlp.headers,
    });

    metricReaders.push(
      new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: 60_000,
        exportTimeoutMillis: 15_000,
      })
    );
  }

  const meterProvider = new MeterProvider({
    resource: opts.resource,
    readers: metricReaders,
  });
  metrics.setGlobalMeterProvider(meterProvider);

  const shutdown = async () => {
    const results = await Promise.allSettled([
      tracerProvider.shutdown(),
      meterProvider.shutdown(),
    ]);

    trace.disable();

    if (contextManager) {
      otelContext.disable();
      contextManager.disable();

      if (previousContextManager && previousContextManager !== contextManager) {
        otelContext.setGlobalContextManager(previousContextManager);
        if (typeof (previousContextManager as { enable?: () => void }).enable === 'function') {
          (previousContextManager as { enable?: () => void }).enable?.();
        }
      }
    }

    for (const result of results) {
      if (result.status === 'rejected') {
        // rethrow the first rejection to surface shutdown errors
        throw result.reason;
      }
    }
  };

  return { tracerProvider, meterProvider, shutdown };
}
