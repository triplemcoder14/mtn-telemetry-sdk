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

```import { MTNOTel } from 'mtn-telemetry-sdk';
import { OTELRNOptions } from 'mtn-telemetry-sdk/dist/types';

export function initTelemetry() {
  const options: OTELRNOptions = {
    serviceName: 'demo-app',
    // Optional: exporter endpoint, environment, etc.
  };

  MTNOTel.init(options);
  console.log('Telemetry initialized');
}
```

2. Integrate in React / React Native App
In your root component (e.g., App.tsx):

```import React, { useEffect } from 'react';
import { initTelemetry } from './telemetry/initTelemetry';
import { NavigationContainer } from '@react-navigation/native';
import MainStack from './screens/MainStack';

export default function App() {
  useEffect(() => {
    initTelemetry();
  }, []);

  return (
    <NavigationContainer>
      <MainStack />
    </NavigationContainer>
  );
}
```

3. Creating Custom Spans

You can measure the performance of any async operation:

```import { startSpan, endSpan } from 'mtn-telemetry-sdk';

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

```const navigationRef = useNavigationContainerRef();

<NavigationContainer
  ref={navigationRef}
  onStateChange={() => {
    const span = startSpan('navigation_change');
    endSpan(span);
  }}
>
  <MainStack />
</NavigationContainer>
```


Configuration Options

The ``OTELRNOptions`` object can include:

| Option        | Type   | Description                                   |
| ------------- | ------ | --------------------------------------------- |
| `serviceName` | string | Name of the service/app                       |
| `environment` | string | Optional environment (prod/dev)               |
| `endpoint`    | string | Optional OTLP/collector endpoint              |
| `exporter`    | string | Optional exporter type (OTLP HTTP/gRPC, etc.) |


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

```import { MTNOTel } from 'mtn-telemetry-sdk';

MTNOTel.init({
  serviceName: 'demo-app',
  environment: 'production'
});

// Custom span for API request
const span = MTNOTel.startSpan('fetch_users');
// ...fetch API
MTNOTel.endSpan(span);
```




