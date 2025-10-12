### MTN Telemetry SDK for React Native

### Resource Metadata

##### Each span includes environment and device details automatically:


| Attribute                | Example | 
|--------------------------|---------|
| `service.name`           | `mtn-mobile-demo` | 
| `deployment.environment` | `staging` | 
| `device.model`           | `Pixel 9` |
| `device.model`           | `Android` |
| `app.name`               | `1.0.0`   |


##### Version: 0.1.0
#### Purpose: Unified telemetry instrumentation for MTN mobile apps — powered by OpenTelemetry, integrated with Elastic.

### Overview

``
mtn-telemetry-sdk`` provides automatic and manual instrumentation for React Native applications.
It enables MTN engineering teams to capture end-to-end observability data — including:
`
* User journeys and interactions

* API calls and screen transitions

* Performance and error spans

* Device and environment metadata

#### The SDK automatically exports all collected telemetry to the MTN OpenTelemetry Collector Elastic APM.



### Architecture



### Installation

1. Install the SDK

``yarn add mtn-telemetry-sdk``

# Or

``npm install mtn-telemetry-sdk``

#### If you’re developing locally in a monorepo:

``
"dependencies": {
  "mtn-telemetry-sdk": "file:../../packages/mtn-telemetry-sdk"
}
``

2. Peer dependencies

### Ensure your project already includes:

``yarn add react-native-device-info``

### Initialization

### Initialize telemetry once when your app starts (e.g. in ``App.tsx``):


````
import React, { useEffect } from 'react';
import { initTelemetry } from 'mtn-telemetry-sdk';

export default function App() {
  useEffect(() => {
    initTelemetry({
      serviceName: 'mtn-mobile-demo',
      otlpEndpoint: 'http://localhost:4318/v1/traces', // local dev or collector endpoint
      environment: 'development',
    });
  }, []);
  return <MainNavigator />;
}
````

### Parameters

| key            | Type            | Description |
|----------------|-----------------|--------------|
| `serviceName`  | string          | Logical service name for the app |
| `otlpEndpoint` | string          | OpenTelemetry Collector OTLP endpoint |
| `environment`  | string (optional) | Deployment environment (default: `development`) |



### Features

1. Automatic Instrumentation


| Instrumentation | Description                         | 
|----|-------------------------------------|
| `FetchInstrumentation` | Automatically traces network requests made using ``fetch()`` | 
| `AppStateInstrumentation` | Tracks app foreground/background transitions                                    | 
| (Planned) React Navigation | Captures screen transitions                                    |

