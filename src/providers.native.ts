import { context as otelContext, metrics, trace, type ContextManager } from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import {
  BatchSpanProcessor,
  BasicTracerProvider,
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
import {
  ReactNativeOTLPMetricsExporter,
  ReactNativeOTLPTraceExporter,
} from './exporters/otlp-http';
import type { ProviderBundle } from './providers/types';

const DEFAULT_TRACE_URL = 'http://localhost:4318/v1/traces';
const DEFAULT_METRIC_URL = 'http://localhost:4318/v1/metrics';

export function buildProviders(opts: OTelRNOptions & { resource: Resource }): ProviderBundle {
  const otlp = opts.otlp ?? {};

  const traceExporter = new ReactNativeOTLPTraceExporter({
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

  const contextManager = new StackContextManager().enable();
  const previousContextManager = (otelContext as unknown as {
    _getContextManager?: () => ContextManager | undefined;
  })._getContextManager?.();

  otelContext.setGlobalContextManager(contextManager);
  trace.setGlobalTracerProvider(tracerProvider);

  const metricReaders: MetricReader[] = [];

  if (otlp.metricsUrl) {
    const metricExporter = new ReactNativeOTLPMetricsExporter({
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
    otelContext.disable();
    contextManager.disable();

    if (previousContextManager && previousContextManager !== contextManager) {
      otelContext.setGlobalContextManager(previousContextManager);
      if (typeof (previousContextManager as { enable?: () => void }).enable === 'function') {
        (previousContextManager as { enable?: () => void }).enable?.();
      }
    }

    for (const result of results) {
      if (result.status === 'rejected') {
        throw result.reason;
      }
    }
  };

  return { tracerProvider, meterProvider, shutdown };
}

export type { ProviderBundle } from './providers/types';

