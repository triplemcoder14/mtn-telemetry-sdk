export interface NavigationContainerLike {
  addListener?(event: string, listener: () => void): void | (() => void);
  removeListener?(event: string, listener: () => void): void;
  getCurrentRoute?(): { name?: string | undefined } | undefined;
}

export interface OTelRNOptions {
  serviceName: string;
  environment?: string;
  release?: string;
  otlp?: {
    tracesUrl?: string;
    metricsUrl?: string;
    headers?: Record<string, string>;
  };
  enableFetch?: boolean;
  enableNavigation?: boolean;
  enableAppState?: boolean;
  samplingRatio?: number;
  attributes?: Record<string, any>;
  navigationRef?: NavigationContainerLike | null;
}
