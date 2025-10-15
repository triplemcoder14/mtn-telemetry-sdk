### MTN Telemetry SDK

#### MTN Telemetry SDK is a lightweight OpenTelemetry wrapper for React and React Native applications, designed to help developers collect traces, metrics, and logs with minimal configuration

### Features

* Easy initialization for React and React Native apps
* Automatic instrumentation for:
  * Navigation
  * API requests / network calls
* Supports custom spans and metrics
* TypeScript-ready, with type definitions
* Compatible with GitHub Packages for easy installation


### Installation

Install via npm:

``npm install @triplemcoder14/mtn-telemetry-sdk
``

or via yarn:

``yarn add @triplemcoder14/mtn-telemetry-sdk
``

**Make sure your project uses React >=18.0.0 and React Native >=0.72.0.**

#### Getting Started

1.  Initialize the SDK

Create a file like src/telemetry/initTelemetry.ts:

```
import { MTNOTel } from 'mtn-telemetry-sdk';
import type { OTelRNOptions } from 'mtn-telemetry-sdk/dist/types';

export async function initTelemetry(navigationRef?: any) {
  const options: OTelRNOptions = {
    serviceName: 'demo-app',
    environment: 'production',
    navigationRef,
    otlp: {
      tracesUrl: 'https://collector.example.com/v1/traces',
      headers: {
        Authorization: 'Bearer example-token',
      },
    },
  };

  await MTNOTel.init(options);
  console.log('Telemetry initialized');
}
```

2. Integrate in React / React Native App
In your root component (e.g., App.tsx):

```
import React, { useEffect, useRef } from 'react';
import { initTelemetry } from './telemetry/initTelemetry';
import { NavigationContainer } from '@react-navigation/native';
import MainStack from './screens/MainStack';

export default function App() {
  const navigationRef = useRef(null);

  useEffect(() => {
    initTelemetry(navigationRef.current);
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <MainStack />
    </NavigationContainer>
  );
}
```

3. Creating Custom Spans

You can measure the performance of any async operation:

```
import { startSpan, endSpan } from 'mtn-telemetry-sdk';

async function fetchUserData() {
  const span = startSpan('fetch_user_data', { url: '/users' });
  try {
    const response = await fetch('/users');
    const data = await response.json();
    return data;
  } finally {
    endSpan(span);
  }
}
```

4. Automatic Navigation Instrumentation (Optional)
If using React Navigation:

```
import { useNavigationContainerRef } from '@react-navigation/native';
import { MTNOTel } from 'mtn-telemetry-sdk';

const navigationRef = useNavigationContainerRef();

useEffect(() => {
  MTNOTel.attachNavigation(navigationRef);
  return () => MTNOTel.detachNavigation();
}, [navigationRef]);

return (
  <NavigationContainer ref={navigationRef}>
    <MainStack />
  </NavigationContainer>
);
```


Configuration Options

The ``OTELRNOptions`` object can include:

| Option             | Type                    | Description                                                                  |
| ------------------ | ----------------------- | ---------------------------------------------------------------------------- |
| `serviceName`      | string                  | Required service name passed to the OpenTelemetry resource.                  |
| `environment`      | string                  | Optional deployment environment tag (`dev`, `staging`, `prod`, …).           |
| `release`          | string                  | Optional release/build identifier; falls back to `react-native-device-info`. |
| `otlp`             | object                  | Optional OTLP exporter configuration.                                        |
| `otlp.tracesUrl`   | string                  | Custom OTLP HTTP traces endpoint (defaults to `http://localhost:4318`).      |
| `otlp.metricsUrl`  | string                  | Custom OTLP HTTP metrics endpoint.                                           |
| `otlp.headers`     | Record<string, string>  | Headers injected into every OTLP export request.                             |
| `enableFetch`      | boolean                 | Toggle automatic fetch instrumentation (defaults to `true`).                 |
| `enableNavigation` | boolean                 | Toggle React Navigation instrumentation (defaults to `true`).                |
| `enableAppState`   | boolean                 | Toggle React Native AppState spans and metrics (defaults to `true`).         |
| `navigationRef`    | NavigationContainerLike | Optional navigation container to attach automatically during init.          |
| `attributes`       | Record<string, unknown> | Extra resource attributes merged into the default OpenTelemetry resource.    |
| `samplingRatio`    | number                  | Root sampler trace-id ratio (defaults to `1.0`).                             |

Publishing & Versioning
* The SDK is hosted on GitHub Packages:
``npm install @triplemcoder/mtn-telemetry-sdk``

Always increment ``version`` in ``package.json`` before publishing.

Contributing
1. Fork the repo
2. Create a feature branch:
   ``git checkout -b feature/my-feature``
3. Commit changes
4. Push branch and open a PR

Example Usage in React Native

```
import { MTNOTel } from 'mtn-telemetry-sdk';

MTNOTel.init({
  serviceName: 'demo-app',
  environment: 'production'
});

// Custom span for API request
const span = MTNOTel.startSpan('fetch_users');
// ...fetch API
MTNOTel.endSpan(span);
```




