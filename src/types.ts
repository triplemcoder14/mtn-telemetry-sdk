export type OTelRNOptions = {
serviceName: string;
otlp: {
tracesUrl: string; // e.g. http://localhost:4318/v1/traces or https://apm.domain:8200/v1/traces
metricsUrl?: string; // e.g. http://localhost:4318/v1/metrics or https://apm.domain:8200/v1/metrics
headers?: Record<string, string>; // e.g. Authorization: Bearer <token>
};
environment?: string; // prod|staging|dev
release?: string; // app version/build
enableFetch?: boolean;
enableNavigation?: boolean;
enableAppState?: boolean;
samplingRatio?: number; // 0..1
};
