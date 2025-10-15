declare module 'react-native-device-info' {
  export interface DeviceInfoModule {
    getVersion?: () => string;
    getManufacturerSync?: () => string;
    getModel?: () => string;
    getSystemName?: () => string;
    getSystemVersion?: () => string;
    getBundleId?: () => string;
    getBuildNumber?: () => string;
    isEmulatorSync?: () => boolean;
  }

  const deviceInfo: DeviceInfoModule;
  export default deviceInfo;
}
