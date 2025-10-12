import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION, SEMRESATTRS_DEPLOYMENT_ENVIRONMENT } from '@opentelemetry/semantic-conventions';
import DeviceInfo from 'react-native-device-info';
import type { OTelRNOptions } from './types';


export function buildResource(opts: OTelRNOptions) {
const attrs: Record<string, any> = {
[SEMRESATTRS_SERVICE_NAME]: opts.serviceName,
[SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: opts.environment ?? 'dev',
[SEMRESATTRS_SERVICE_VERSION]: opts.release ?? DeviceInfo.getVersion(),
'device.manufacturer': DeviceInfo.getManufacturerSync?.() ?? 'unknown',
'device.model': DeviceInfo.getModel(),
'device.os': `${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}`,
'app.bundle': DeviceInfo.getBundleId(),
'app.build': DeviceInfo.getBuildNumber(),
'app.isEmulator': DeviceInfo.isEmulatorSync?.() ?? false,
};
return new Resource(attrs);
}
