# MTN Telemetry SDK Code Review

## Summary
This document captures key findings from reviewing the current SDK implementation. See in-line comments for file-level concerns.

## Major Issues
1. **Node-only SDK in React Native context** – `buildProviders` wires up `@opentelemetry/sdk-node` together with Node exporters/readers, but React Native and browser builds cannot load those Node modules (they depend on `fs`, `process`, TLS, etc.). Attempting to bundle this file into a mobile app will fail at build-time or runtime. Consider using the web/OTLP exporters designed for React Native instead of the Node SDK stack.【F:src/providers.ts†L1-L35】
2. **Resource factory uses internal module path** – `buildResource` requires `@opentelemetry/resources/build/src/Resource`. Bundlers such as Metro or Webpack tree shake/resolve based on the public entry points; importing from the package's build output is unsupported and will break with future releases. Use the public `Resource` export instead.【F:src/resource.ts†L1-L38】
3. **Device info hard dependency** – The resource builder requires `react-native-device-info` at module load and calls synchronous APIs. This adds a heavy peer/native dependency for any consumer (including React web). Exposing an abstraction that accepts device/app metadata via options would keep the SDK platform-agnostic.【F:src/resource.ts†L21-L38】
4. **Fetch instrumentation mutates requests unsafely** – Wrapping `fetch` spreads a `Request` instance into a plain object; spreading drops prototype methods like `arrayBuffer()` and can throw for body streams. The header injection should clone the `Request` via the `Request` constructor instead of `{ ...input, headers }`. Otherwise any consumer that passes a `Request` object will see broken requests.【F:src/instrumentations/fetch.ts†L10-L37】
5. **React Navigation hook never attaches** – The navigation instrumentation only assigns an `attach` function on `globalThis`, but nothing in `MTNOTel.init` calls it or documents how the app should supply its navigation ref. Without calling `__MTN_OTEL_ATTACH_NAV__`, no spans are produced.【F:src/instrumentations/react-nav.ts†L9-L23】
6. **Options shape mismatch with README** – `OTelRNOptions` makes the `otlp` block mandatory, yet the README examples call `MTNOTel.init` without it. Either the type is wrong or the docs are; as-is the example will not compile and leads to runtime crashes when `opts.otlp` is `undefined`.【F:src/types.ts†L1-L22】【F:README.md†L24-L87】

## Additional Observations
- `MTNOTel.init` creates tracers/meters via the global API but never waits for the Node SDK to finish starting; when used in environments with async initialization this can race the provider registration.【F:src/index.ts†L13-L46】
- `installAppStateInstrumentation` imports `AppState` directly; this module does not exist in React web builds. If web support is desired, guard the import or lazy-require inside the function.【F:src/instrumentations/app-state.ts†L1-L34】
- The README promises automatic navigation and API instrumentation but the feature flags default to `undefined`/false, so nothing happens unless users set them explicitly. Consider defaulting them to `true` or documenting the flags.【F:src/index.ts†L27-L35】【F:README.md†L24-L87】

## Recommendations
- Replace the Node SDK stack with the OTLP fetch exporter + web/tracing SDK compatible with React Native (e.g., `@opentelemetry/sdk-trace-web` or community RN providers).
- Expose configuration hooks instead of hardcoding device info lookups so the SDK can run in both native and web environments.
- Rewrite the fetch/navigation instrumentations with safe cloning and a documented integration pattern.
- Align the public documentation with the actual option contract and provide runtime validation to surface misconfiguration early.

