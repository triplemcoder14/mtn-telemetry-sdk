import { diag, ValueType } from '@opentelemetry/api';
import type { Attributes, HrTime, Link, SpanAttributes } from '@opentelemetry/api';
import type { Resource } from '@opentelemetry/resources';
import type { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-base';
import { ExportResultCode } from '@opentelemetry/core';
import {
  AggregationTemporality,
  DataPointType,
  type GaugeMetricData,
  type HistogramMetricData,
  type MetricData,
  type PushMetricExporter,
  type ResourceMetrics,
  type ScopeMetrics,
  type SumMetricData,
} from '@opentelemetry/sdk-metrics';

type FetchFn = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: unknown;
  }
) => Promise<{ ok: boolean; status: number }>;

interface AbortControllerLike {
  readonly signal?: unknown;
  abort(): void;
}

const runtimeGlobals = globalThis as typeof globalThis & {
  fetch?: FetchFn;
  AbortController?: new () => AbortControllerLike;
  btoa?: (data: string) => string;
  Buffer?: {
    from(data: Uint8Array | string, encoding?: string): { toString(encoding: string): string };
  };
};

type ExportResultCallback = (result: {
  code: ExportResultCode;
  error?: Error;
}) => void;

interface ExporterOptions {
  url: string;
  headers?: Record<string, string>;
  timeoutMillis?: number;
}

type AnyValue =
  | { stringValue: string }
  | { boolValue: boolean }
  | { doubleValue: number }
  | { intValue: number }
  | { bytesValue: string }
  | { arrayValue: { values: AnyValue[] } }
  | { kvlistValue: { values: KeyValue[] } };

interface KeyValue {
  key: string;
  value: AnyValue;
}

interface OtlpSpanEvent {
  timeUnixNano: string;
  name: string;
  attributes: KeyValue[];
  droppedAttributesCount: number;
}

interface OtlpLink {
  traceId: string;
  spanId: string;
  traceState?: string;
  attributes: KeyValue[];
  droppedAttributesCount: number;
}

interface OtlpSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: number;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  attributes: KeyValue[];
  droppedAttributesCount: number;
  events: OtlpSpanEvent[];
  droppedEventsCount: number;
  links: OtlpLink[];
  droppedLinksCount: number;
  status: { code: number; message?: string };
}

interface ScopeSpans {
  scope: {
    name: string;
    version?: string;
    attributes?: KeyValue[];
  };
  spans: OtlpSpan[];
  schemaUrl?: string;
}

interface ResourceSpans {
  resource: {
    attributes: KeyValue[];
    droppedAttributesCount: number;
  };
  scopeSpans: ScopeSpans[];
  schemaUrl?: string;
}

interface TraceExportRequest {
  resourceSpans: ResourceSpans[];
}

type NumberDataPoint = {
  attributes: KeyValue[];
  startTimeUnixNano: string;
  timeUnixNano: string;
  value: { asDouble?: number; asInt?: number };
};

type HistogramDataPoint = {
  attributes: KeyValue[];
  startTimeUnixNano: string;
  timeUnixNano: string;
  bucketCounts: string[];
  explicitBounds: number[];
  sum?: number;
  count: string;
  min?: number;
  max?: number;
};

interface Sum {
  aggregationTemporality: number;
  isMonotonic: boolean;
  dataPoints: NumberDataPoint[];
}

interface Gauge {
  dataPoints: NumberDataPoint[];
}

interface Histogram {
  aggregationTemporality: number;
  dataPoints: HistogramDataPoint[];
}

interface OtlpMetric {
  name: string;
  description: string;
  unit: string;
  sum?: Sum;
  gauge?: Gauge;
  histogram?: Histogram;
}

interface ScopeMetricsEnvelope {
  scope: {
    name: string;
    version?: string;
    attributes?: KeyValue[];
  };
  metrics: OtlpMetric[];
  schemaUrl?: string;
}

interface ResourceMetricsEnvelope {
  resource: {
    attributes: KeyValue[];
    droppedAttributesCount: number;
  };
  scopeMetrics: ScopeMetricsEnvelope[];
  schemaUrl?: string;
}

interface MetricsExportRequest {
  resourceMetrics: ResourceMetricsEnvelope[];
}

const enum MetricTemporality {
  UNSPECIFIED = 0,
  DELTA = 1,
  CUMULATIVE = 2,
}

function toAnyValue(value: unknown): AnyValue {
  if (value == null) {
    return { stringValue: '' };
  }

  if (value instanceof Uint8Array) {
    return { bytesValue: bytesToBase64(value) };
  }

  if (value instanceof ArrayBuffer) {
    return { bytesValue: bytesToBase64(new Uint8Array(value)) };
  }

  if (ArrayBuffer.isView(value)) {
    const view = value as ArrayBufferView;
    return {
      bytesValue: bytesToBase64(new Uint8Array(view.buffer, view.byteOffset, view.byteLength)),
    };
  }

  if (value instanceof Date) {
    return { stringValue: value.toISOString() };
  }

  if (typeof value === 'string') {
    return { stringValue: value };
  }

  if (typeof value === 'boolean') {
    return { boolValue: value };
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { intValue: value };
    }
    return { doubleValue: value };
  }

  if (typeof value === 'bigint') {
    return { intValue: Number(value) };
  }

  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((item) => toAnyValue(item)) } };
  }

  if (typeof value === 'object') {
    const entries: KeyValue[] = [];
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      entries.push({ key, value: toAnyValue(val) });
    }

    return { kvlistValue: { values: entries } };
  }

  return { stringValue: String(value) };
}

function toKeyValue(attributes: SpanAttributes | Attributes | undefined): KeyValue[] {
  if (!attributes) {
    return [];
  }

  const entries = Object.entries(attributes);
  return entries.map(([key, value]) => ({ key, value: toAnyValue(value) }));
}

function hrTimeToNanos(hr: HrTime): string {
  return String(hr[0] * 1_000_000_000 + hr[1]);
}

function bytesToBase64(bytes: Uint8Array): string {
  if (runtimeGlobals.Buffer) {
    return runtimeGlobals.Buffer.from(bytes).toString('base64');
  }

  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  if (typeof runtimeGlobals.btoa === 'function') {
    return runtimeGlobals.btoa(binary);
  }

  return binary;
}

function serializeEvent(event: ReadableSpan['events'][number]): OtlpSpanEvent {
  return {
    name: event.name,
    timeUnixNano: hrTimeToNanos(event.time),
    attributes: toKeyValue(event.attributes),
    droppedAttributesCount: event.droppedAttributesCount ?? 0,
  };
}

function serializeLink(link: Link): OtlpLink {
  return {
    traceId: link.context.traceId,
    spanId: link.context.spanId,
    traceState: link.context.traceState?.serialize(),
    attributes: toKeyValue(link.attributes),
    droppedAttributesCount: link.droppedAttributesCount ?? 0,
  };
}

function serializeSpan(span: ReadableSpan): OtlpSpan {
  const status: OtlpSpan['status'] = { code: span.status.code };
  if (span.status.message) {
    status.message = span.status.message;
  }

  return {
    traceId: span.spanContext().traceId,
    spanId: span.spanContext().spanId,
    parentSpanId: span.parentSpanContext?.spanId,
    name: span.name,
    kind: span.kind,
    startTimeUnixNano: hrTimeToNanos(span.startTime),
    endTimeUnixNano: hrTimeToNanos(span.endTime),
    attributes: toKeyValue(span.attributes),
    droppedAttributesCount: span.droppedAttributesCount ?? 0,
    events: span.events.map(serializeEvent),
    droppedEventsCount: span.droppedEventsCount ?? 0,
    links: span.links.map(serializeLink),
    droppedLinksCount: span.droppedLinksCount ?? 0,
    status,
  };
}

function resourceKey(resource: Resource): string {
  const entries = Object.entries(resource.attributes)
    .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
    .sort();
  return entries.join('|');
}

function scopeKey(scope: ReadableSpan['instrumentationScope']): string {
  return [scope.name ?? '', scope.version ?? '', scope.schemaUrl ?? ''].join('|');
}

function serializeResource(resource: Resource): ResourceSpans['resource'] {
  return {
    attributes: toKeyValue(resource.attributes),
    droppedAttributesCount: 0,
  };
}

function groupSpans(spans: ReadableSpan[]): ResourceSpans[] {
  const byResource = new Map<string, { resource: Resource; spans: ReadableSpan[] }>();

  for (const span of spans) {
    const key = resourceKey(span.resource);
    if (!byResource.has(key)) {
      byResource.set(key, { resource: span.resource, spans: [] });
    }
    byResource.get(key)!.spans.push(span);
  }

  const resourceSpans: ResourceSpans[] = [];

  for (const { resource, spans: resourceSpanList } of byResource.values()) {
    const byScope = new Map<
      string,
      { scope: ReadableSpan['instrumentationScope']; spans: ReadableSpan[] }
    >();

    for (const span of resourceSpanList) {
      const key = scopeKey(span.instrumentationScope);
      if (!byScope.has(key)) {
        byScope.set(key, { scope: span.instrumentationScope, spans: [] });
      }
      byScope.get(key)!.spans.push(span);
    }

    const scopeSpans: ScopeSpans[] = [];

    for (const { scope, spans: scopedSpans } of byScope.values()) {
      scopeSpans.push({
        scope: {
          name: scope.name,
          version: scope.version,
        },
        spans: scopedSpans.map(serializeSpan),
        schemaUrl: scope.schemaUrl,
      });
    }

    resourceSpans.push({
      resource: serializeResource(resource),
      scopeSpans,
      schemaUrl: resource.schemaUrl,
    });
  }

  return resourceSpans;
}

function toTemporality(temporality: AggregationTemporality): MetricTemporality {
  switch (temporality) {
    case AggregationTemporality.DELTA:
      return MetricTemporality.DELTA;
    case AggregationTemporality.CUMULATIVE:
      return MetricTemporality.CUMULATIVE;
    default:
      return MetricTemporality.UNSPECIFIED;
  }
}

function serializeNumberDataPoint(
  dataPoint: SumMetricData['dataPoints'][number] | GaugeMetricData['dataPoints'][number],
  valueType: ValueType
): NumberDataPoint {
  const base = {
    attributes: toKeyValue(dataPoint.attributes),
    startTimeUnixNano: hrTimeToNanos(dataPoint.startTime),
    timeUnixNano: hrTimeToNanos(dataPoint.endTime),
  };

  if (valueType === ValueType.INT) {
    return { ...base, value: { asInt: Number(dataPoint.value) } };
  }

  return { ...base, value: { asDouble: Number(dataPoint.value) } };
}

function serializeHistogramDataPoint(
  dataPoint: HistogramMetricData['dataPoints'][number]
): HistogramDataPoint {
  const histogram = dataPoint.value;

  return {
    attributes: toKeyValue(dataPoint.attributes),
    startTimeUnixNano: hrTimeToNanos(dataPoint.startTime),
    timeUnixNano: hrTimeToNanos(dataPoint.endTime),
    bucketCounts: histogram.buckets.counts.map((count) => String(count)),
    explicitBounds: histogram.buckets.boundaries.map((boundary) => Number(boundary)),
    sum: histogram.sum,
    count: String(histogram.count),
    min: histogram.min,
    max: histogram.max,
  };
}

function groupMetrics(resourceMetrics: ResourceMetrics[]): ResourceMetricsEnvelope[] {
  return resourceMetrics.map((entry) => ({
    resource: serializeResource(entry.resource),
    scopeMetrics: entry.scopeMetrics.map((scopeMetrics) => serializeScopeMetrics(scopeMetrics)),
    schemaUrl: entry.resource.schemaUrl,
  }));
}

function serializeScopeMetrics(scopeMetrics: ScopeMetrics): ScopeMetricsEnvelope {
  return {
    scope: {
      name: scopeMetrics.scope.name,
      version: scopeMetrics.scope.version,
    },
    metrics: scopeMetrics.metrics.map(serializeMetric),
    schemaUrl: scopeMetrics.scope.schemaUrl,
  };
}

function serializeMetric(metric: MetricData): OtlpMetric {
  switch (metric.dataPointType) {
    case DataPointType.SUM: {
      const sumMetric = metric as SumMetricData;
      return {
        name: sumMetric.descriptor.name,
        description: sumMetric.descriptor.description ?? '',
        unit: sumMetric.descriptor.unit ?? '',
        sum: {
          aggregationTemporality: toTemporality(sumMetric.aggregationTemporality),
          isMonotonic: sumMetric.isMonotonic ?? false,
          dataPoints: sumMetric.dataPoints.map((dataPoint) =>
            serializeNumberDataPoint(dataPoint, sumMetric.descriptor.valueType)
          ),
        },
      };
    }
    case DataPointType.GAUGE: {
      const gaugeMetric = metric as GaugeMetricData;
      return {
        name: gaugeMetric.descriptor.name,
        description: gaugeMetric.descriptor.description ?? '',
        unit: gaugeMetric.descriptor.unit ?? '',
        gauge: {
          dataPoints: gaugeMetric.dataPoints.map((dataPoint) =>
            serializeNumberDataPoint(dataPoint, gaugeMetric.descriptor.valueType)
          ),
        },
      };
    }
    case DataPointType.HISTOGRAM: {
      const histogramMetric = metric as HistogramMetricData;
      return {
        name: histogramMetric.descriptor.name,
        description: histogramMetric.descriptor.description ?? '',
        unit: histogramMetric.descriptor.unit ?? '',
        histogram: {
          aggregationTemporality: toTemporality(histogramMetric.aggregationTemporality),
          dataPoints: histogramMetric.dataPoints.map((dataPoint) => serializeHistogramDataPoint(dataPoint)),
        },
      };
    }
    default:
      diag.warn(`Unsupported metric data point type: ${metric.dataPointType}`);
      return {
        name: metric.descriptor.name,
        description: metric.descriptor.description ?? '',
        unit: metric.descriptor.unit ?? '',
      };
  }
}

abstract class BaseHttpExporter {
  protected readonly url: string;

  protected readonly headers: Record<string, string>;

  private readonly timeoutMillis: number;

  private _shutdown = false;

  constructor(options: ExporterOptions) {
    this.url = options.url;
    this.headers = {
      'content-type': 'application/json',
      ...options.headers,
    };
    this.timeoutMillis = options.timeoutMillis ?? 15_000;
  }

  protected async send(body: unknown): Promise<void> {
    if (this._shutdown) {
      throw new Error('Exporter is shut down');
    }

    if (!runtimeGlobals.fetch) {
      throw new Error('global fetch is not available in this environment');
    }

    const controller = runtimeGlobals.AbortController ? new runtimeGlobals.AbortController() : undefined;

    const timeout = setTimeout(() => {
      controller?.abort();
    }, this.timeoutMillis);

    try {
      const response = await runtimeGlobals.fetch(this.url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
        signal: controller?.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to export telemetry (${response.status})`);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  async shutdown(): Promise<void> {
    this._shutdown = true;
  }
}

export class ReactNativeOTLPTraceExporter
  extends BaseHttpExporter
  implements SpanExporter
{
  export(spans: ReadableSpan[], resultCallback: ExportResultCallback): void {
    (async () => {
      try {
        const payload: TraceExportRequest = { resourceSpans: groupSpans(spans) };
        await this.send(payload);
        resultCallback({ code: ExportResultCode.SUCCESS });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        diag.error('Failed to export spans', error);
        resultCallback({ code: ExportResultCode.FAILED, error });
      }
    })();
  }

  async shutdown(): Promise<void> {
    await super.shutdown();
  }

  async forceFlush(): Promise<void> {
    return;
  }
}

export class ReactNativeOTLPMetricsExporter
  extends BaseHttpExporter
  implements PushMetricExporter
{
  export(metrics: ResourceMetrics, resultCallback: ExportResultCallback): void {
    (async () => {
      try {
        const payload: MetricsExportRequest = {
          resourceMetrics: groupMetrics([metrics]),
        };
        await this.send(payload);
        resultCallback({ code: ExportResultCode.SUCCESS });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        diag.error('Failed to export metrics', error);
        resultCallback({ code: ExportResultCode.FAILED, error });
      }
    })();
  }

  async forceFlush(): Promise<void> {
    return;
  }

  async shutdown(): Promise<void> {
    await super.shutdown();
  }
}

