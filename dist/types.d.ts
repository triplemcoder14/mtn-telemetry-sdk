export type OTelRNOptions = {
    serviceName: string;
    otlp: {
        tracesUrl: string;
        metricsUrl?: string;
        headers?: Record<string, string>;
    };
    environment?: string;
    release?: string;
    enableFetch?: boolean;
    enableNavigation?: boolean;
    enableAppState?: boolean;
    samplingRatio?: number;
};
