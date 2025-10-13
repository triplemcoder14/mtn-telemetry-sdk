export interface OTelRNOptions {
  serviceName: string;
  environment?: string;
  release?: string;
  otlp: {
    tracesUrl: string;
    metricsUrl?: string;
    headers?: Record<string, string>;
  };
//   environment?: string;
//   release?: string;
//   enableFetch?: boolean;
//   enableNavigation?: boolean;
//   enableAppState?: boolean;
//   samplingRatio?: number;
// }
  enableFetch?: boolean;
  enableNavigation?: boolean;
  enableAppState?: boolean;
  samplingRatio?: number;
  attributes?: Record<string, any>;
}
