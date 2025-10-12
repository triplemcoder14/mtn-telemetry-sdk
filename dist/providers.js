"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildProviders = buildProviders;
const sdk_trace_base_1 = require("@opentelemetry/sdk-trace-base");
const exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
const sdk_metrics_1 = require("@opentelemetry/sdk-metrics");
const exporter_metrics_otlp_http_1 = require("@opentelemetry/exporter-metrics-otlp-http");
function buildProviders(args) {
    const tracerProvider = new sdk_trace_base_1.BasicTracerProvider({
        resource: args.resource,
        sampler: new sdk_trace_base_1.ParentBasedSampler({ root: new sdk_trace_base_1.TraceIdRatioBasedSampler(args.samplingRatio) }),
    });
    const traceExporter = new exporter_trace_otlp_http_1.OTLPTraceExporter({ url: args.tracesUrl, headers: args.headers });
    tracerProvider.addSpanProcessor(new sdk_trace_base_1.BatchSpanProcessor(traceExporter, {
        maxQueueSize: 2048,
        scheduledDelayMillis: 5000,
        exportTimeoutMillis: 10000,
        maxExportBatchSize: 256,
    }));
    tracerProvider.register();
    const meterProvider = new sdk_metrics_1.MeterProvider({ resource: args.resource });
    if (args.metricsUrl) {
        const metricExporter = new exporter_metrics_otlp_http_1.OTLPMetricExporter({ url: args.metricsUrl, headers: args.headers });
        meterProvider.addMetricReader(new sdk_metrics_1.PeriodicExportingMetricReader({
            exporter: metricExporter,
            exportIntervalMillis: 60000,
            exportTimeoutMillis: 15000,
        }));
    }
    async function shutdown() {
        var _a;
        await Promise.allSettled([
            tracerProvider.shutdown(),
            (_a = meterProvider.shutdown) === null || _a === void 0 ? void 0 : _a.call(meterProvider),
        ]);
    }
    return { tracerProvider, meterProvider, shutdown };
}
