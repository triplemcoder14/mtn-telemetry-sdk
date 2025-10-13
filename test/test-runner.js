// --- this mocks react-native-device-info ---
require.cache[require.resolve('react-native-device-info')] = {
  exports: {
    getVersion: () => '1.0.0',
    getManufacturerSync: () => 'MockBrand',
    getModel: () => 'MockPhone',
    getSystemName: () => 'MockOS',
    getSystemVersion: () => '1.0',
    getBundleId: () => 'com.mock.app',
    getBuildNumber: () => '100',
    isEmulatorSync: () => true,
  },
};

require.cache[require.resolve('react-native')] = {
  exports: {
    Platform: { OS: 'ios', Version: '1.0.0', select: (obj) => obj.ios },
    NativeModules: {},
  },
};

// --- import the built sdk ---
const { MTNOTel } = require('../dist/index');

// --- Run the SDK init + shutdown test ---
(async () => {
  try {
    const sdk = MTNOTel.init({
      serviceName: 'mtn-test-service',
      otlp: {
        tracesUrl: 'http://localhost:4318/v1/traces',
        metricsUrl: 'http://localhost:4318/v1/metrics',
        headers: {},
      },
      environment: 'dev',
      release: '1.0.0',
      enableFetch: true,
      enableNavigation: false,
      enableAppState: true,
      samplingRatio: 1.0,
    });

    console.log(' MTNOTel SDK initialized successfully.');

    // simulate app running
    await new Promise((r) => setTimeout(r, 5000));

    await sdk.flushAndShutdown();
    console.log(' SDK flushed and shut down gracefully.');
  } catch (err) {
    console.error(' Test  failed:', err);
  }
})();

