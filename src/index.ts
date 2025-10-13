import { buildProviders } from './providers';
import { buildResource } from './resource';
import { installFetchInstrumentation } from './instrumentations/fetch';
import { installReactNavigationInstrumentation } from './instrumentations/react-nav';
import { installAppStateInstrumentation } from './instrumentations/app-state';
import { trace, metrics } from '@opentelemetry/api';
import type { OTelRNOptions } from './types';

export class MTNOTel {
  private static _instance: MTNOTel | null = null;
  private shutdownFns: Array<() => Promise<void>> = [];

  static async init(opts: OTelRNOptions) {
    if (MTNOTel._instance) return MTNOTel._instance;

    //  await and async resource builder
    const resource = await buildResource(opts);
    const { sdk, shutdown } = buildProviders({ ...opts, resource });

    const instance = new MTNOTel();
    instance.shutdownFns.push(shutdown);

    //  using otel api to get global tracer and meter
    const tracer = trace.getTracer(opts.serviceName);
    const meter = metrics.getMeter(opts.serviceName);

   // conditionally install instrumentation
    if (opts.enableFetch) {
      instance.shutdownFns.push(installFetchInstrumentation(tracer));
    }
    if (opts.enableNavigation) {
      instance.shutdownFns.push(installReactNavigationInstrumentation(tracer));
    }
    if (opts.enableAppState) {
      instance.shutdownFns.push(installAppStateInstrumentation(tracer, meter));
    }

    MTNOTel._instance = instance;
    return instance;
  }

  async flushAndShutdown() {
    for (const fn of this.shutdownFns) {
      await fn();
    }
  }
}
