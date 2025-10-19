import { metrics, trace } from '@opentelemetry/api';
import type { Resource } from '@opentelemetry/resources';
import type { ProviderBundle } from './providers/types';
import { buildResource } from './resource';
import { installAppStateInstrumentation } from './instrumentations/app-state';
import { installFetchInstrumentation } from './instrumentations/fetch';
import {
  installReactNavigationInstrumentation,
  type NavigationInstrumentation,
} from './instrumentations/react-nav';
import type { NavigationContainerLike, OTelRNOptions } from './types';

type BuildProvidersFn = (opts: OTelRNOptions & { resource: Resource }) => ProviderBundle;

let providerBuilder: BuildProvidersFn | null = null;

export function setProviderBuilder(builder: BuildProvidersFn) {
  providerBuilder = builder;
}

export class MTNOTel {
  private static _instance: MTNOTel | null = null;

  private shutdownFns: Array<() => Promise<void>> = [];

  private navigation?: NavigationInstrumentation;

  private options!: Required<Pick<OTelRNOptions, 'enableFetch' | 'enableNavigation' | 'enableAppState'>>;

  static async init(opts: OTelRNOptions) {
    if (!providerBuilder) {
      throw new Error('MTNOTel provider builder has not been configured');
    }

    if (MTNOTel._instance) {
      if (opts.navigationRef) {
        MTNOTel._instance.attachNavigation(opts.navigationRef);
      }
      return MTNOTel._instance;
    }

    const normalizedOptions = {
      enableFetch: opts.enableFetch ?? true,
      enableNavigation: opts.enableNavigation ?? true,
      enableAppState: opts.enableAppState ?? true,
    } as const;

    const resource = await buildResource(opts);
    const { shutdown } = providerBuilder({ ...opts, resource });

    const instance = new MTNOTel();
    instance.options = normalizedOptions;
    instance.shutdownFns.push(shutdown);

    trace.getTracer(opts.serviceName);
    const meter = metrics.getMeter(opts.serviceName);

    if (normalizedOptions.enableFetch) {
      instance.shutdownFns.push(installFetchInstrumentation());
    }
    if (normalizedOptions.enableNavigation) {
      instance.navigation = installReactNavigationInstrumentation(opts.navigationRef);
      instance.shutdownFns.push(instance.navigation.shutdown);
    }
    if (normalizedOptions.enableAppState) {
      instance.shutdownFns.push(installAppStateInstrumentation(meter));
    }

    MTNOTel._instance = instance;
    return instance;
  }

  attachNavigation(ref: NavigationContainerLike | null) {
    if (!this.options.enableNavigation) return;
    this.navigation?.attach(ref);
  }

  detachNavigation() {
    this.navigation?.detach();
  }

  static attachNavigation(ref: NavigationContainerLike | null) {
    MTNOTel._instance?.attachNavigation(ref);
  }

  static detachNavigation() {
    MTNOTel._instance?.detachNavigation();
  }

  async flushAndShutdown() {
    for (const fn of this.shutdownFns) {
      await fn();
    }
    MTNOTel._instance = null;
  }
}
