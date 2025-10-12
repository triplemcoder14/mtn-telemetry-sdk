import { buildProviders } from './providers';
import { buildResource } from './resource';
import { installFetchInstrumentation } from './instrumentations/fetch';
import { installReactNavigationInstrumentation } from './instrumentations/react-nav';
// import { installReactNavigationInstrumentation } from './instrumentations/react-navigation';
import { installAppStateInstrumentation } from './instrumentations/app-state';
import type { OTelRNOptions } from './types';


export class MTNOTel {
private static _instance: MTNOTel | null = null;
private shutdownFns: Array<() => Promise<void>> = [];


static init(opts: OTelRNOptions) {
if (MTNOTel._instance) return MTNOTel._instance;


const resource = buildResource(opts);
const { tracerProvider, meterProvider, shutdown } = buildProviders({
resource,
tracesUrl: opts.otlp.tracesUrl,
metricsUrl: opts.otlp.metricsUrl,
headers: opts.otlp.headers,
samplingRatio: opts.samplingRatio ?? 1.0,
});


const sdk = new MTNOTel();
sdk.shutdownFns.push(shutdown);


if (opts.enableFetch) {
sdk.shutdownFns.push(installFetchInstrumentation(tracerProvider));
}
if (opts.enableNavigation) {
sdk.shutdownFns.push(installReactNavigationInstrumentation(tracerProvider));
}
if (opts.enableAppState) {
sdk.shutdownFns.push(installAppStateInstrumentation(tracerProvider, meterProvider));
}


MTNOTel._instance = sdk;
return sdk;
}


async flushAndShutdown() {
for (const fn of this.shutdownFns.reverse()) {
try { await fn(); } catch {}
}
MTNOTel._instance = null;
}
}


export * from './types';
export * from './context';
export * from './business';
