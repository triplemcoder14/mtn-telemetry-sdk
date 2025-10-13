//  import resource from the *build* path
//  import directly from the implementation file (not just the type index)
// import the runtime implementation (not just the type)
import ResourceImpl = require('@opentelemetry/resources/build/src/Resource');
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';
import DeviceInfo from 'react-native-device-info';
import type { OTelRNOptions } from './types';

// get the runtime Resource class
const { Resource } = ResourceImpl as unknown as {
  Resource: {
    new (init?: { attributes?: Record<string, any> }): any;
    default(): any;
  };
};

export function buildResource(opts: OTelRNOptions) {
  const attrs: Record<string, any> = {
    [SEMRESATTRS_SERVICE_NAME]: opts.serviceName,
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: opts.environment ?? 'dev',
    [SEMRESATTRS_SERVICE_VERSION]:
      opts.release ?? DeviceInfo.getVersion?.() ?? 'unknown',
    'device.manufacturer': DeviceInfo.getManufacturerSync?.() ?? 'unknown',
    'device.model': DeviceInfo.getModel?.() ?? 'unknown',
    'device.os': `${DeviceInfo.getSystemName?.() ?? 'unknown'} ${DeviceInfo.getSystemVersion?.() ?? ''}`,
    'app.bundle': DeviceInfo.getBundleId?.() ?? 'unknown',
    'app.build': DeviceInfo.getBuildNumber?.() ?? 'unknown',
    'app.isEmulator': DeviceInfo.isEmulatorSync?.() ?? false,
    ...(opts as any).attributes,
  };

  const base = Resource.default();
  const custom = new Resource({ attributes: attrs });
  return base.merge(custom);
}

