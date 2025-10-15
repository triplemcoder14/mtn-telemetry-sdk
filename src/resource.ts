import { defaultResource, resourceFromAttributes, type Resource } from '@opentelemetry/resources';
import {
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import type { OTelRNOptions } from './types';

type DeviceInfoModule = {
  getVersion?: () => string;
  getManufacturerSync?: () => string;
  getModel?: () => string;
  getSystemName?: () => string;
  getSystemVersion?: () => string;
  getBundleId?: () => string;
  getBuildNumber?: () => string;
  isEmulatorSync?: () => boolean;
};

async function loadDeviceInfo(): Promise<DeviceInfoModule | null> {
  return import('react-native-device-info')
    .then((mod) => (mod?.default ? (mod.default as DeviceInfoModule) : (mod as DeviceInfoModule)))
    .catch(() => null);
}

export async function buildResource(opts: OTelRNOptions): Promise<Resource> {
  const deviceInfo = await loadDeviceInfo();

  const baseAttrs: Record<string, string | number | boolean> = {
    [SEMRESATTRS_SERVICE_NAME]: opts.serviceName,
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: opts.environment ?? 'dev',
    [SEMRESATTRS_SERVICE_VERSION]:
      opts.release ?? deviceInfo?.getVersion?.() ?? 'unknown',
    'device.manufacturer': deviceInfo?.getManufacturerSync?.() ?? 'unknown',
    'device.model': deviceInfo?.getModel?.() ?? 'unknown',
    'device.os': `${deviceInfo?.getSystemName?.() ?? 'unknown'} ${
      deviceInfo?.getSystemVersion?.() ?? ''
    }`.trim(),
    'app.bundle': deviceInfo?.getBundleId?.() ?? 'unknown',
    'app.build': deviceInfo?.getBuildNumber?.() ?? 'unknown',
    'app.isEmulator': deviceInfo?.isEmulatorSync?.() ?? false,
  };

  const userAttrs: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(opts.attributes ?? {})) {
    if (value == null) continue;
    const valueType = typeof value;
    if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
      userAttrs[key] = value as string | number | boolean;
    } else {
      userAttrs[key] = String(value);
    }
  }

  const attrs = { ...baseAttrs, ...userAttrs };

  return defaultResource().merge(resourceFromAttributes(attrs));
}
