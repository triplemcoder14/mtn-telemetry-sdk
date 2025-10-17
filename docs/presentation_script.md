# MTN Telemetry SDK Presentation Script

## Slide 1 – Title & Opening
**Speaker Notes:**
- "Good [morning/afternoon/evening], I'm [Name], and I'm excited to walk you through the MTN Telemetry SDK."
- "This SDK is a focused integration layer that simplifies adopting OpenTelemetry in React and React Native apps."
- "I'll cover the motivation, the architecture, how the core modules fit together, and how we translate telemetry into business insights."

## Slide 2 – Problem & Motivation
**Speaker Notes:**
- "Modern mobile and web apps need visibility into user journeys and app health, but wiring OpenTelemetry from scratch is time-consuming."
- "Teams often reinvent the same boilerplate: configuring providers, adding device metadata, and instrumenting navigation or fetch calls."
- "MTN Telemetry SDK removes that overhead. It delivers a plug-and-play telemetry foundation built around React Native realities." 

## Slide 3 – High-Level Architecture Overview
**Speaker Notes:**
- "Here is the big picture that you can see on the draw.io diagram." 
- "On the left, the host app passes an `OTelRNOptions` config into `MTNOTel.init`."
- "`MTNOTel` orchestrates the setup: it builds a resource, wires providers, and conditionally enables instrumentations."
- "On the right, the OTLP exporters deliver traces and metrics to any compliant backend such as Jaeger, Tempo, or Honeycomb."

## Slide 4 – Initialization Flow (`MTNOTel.init`)
**Speaker Notes:**
- "Initialization is a one-line call—`MTNOTel.init(options)`—but under the hood it handles several steps."
- "First, it normalizes feature flags and ensures idempotence so repeated calls won’t double-instrument."
- "It builds a shutdown registry, so every module can register cleanup callbacks that we later invoke via `flushAndShutdown`."
- "Then it sequentially invokes resource building, provider setup, and instrumentation attachment." 

## Slide 5 – Resource Enrichment
**Speaker Notes:**
- "Resource building lives in `src/sdk/resource.ts`."
- "We pull device and app metadata using `react-native-device-info`, merge it with the service identity from options, and include any custom attributes the app passes."
- "This ensures every span contains context like device model, OS version, app version, and environment."
- "If device info is unavailable (e.g., on web), the builder gracefully skips those fields." 

## Slide 6 – Provider Bundle
**Speaker Notes:**
- "`buildProviders` (in `src/sdk/providers.ts`) constructs the telemetry providers."
- "The tracer provider uses a parent-based sampler with a trace-id ratio sampler to control sampling probability." 
- "We register a `BatchSpanProcessor` with an OTLP HTTP exporter for traces."
- "If metrics configuration is provided, we also register a `PeriodicExportingMetricReader` with its own OTLP exporter."
- "A unified `shutdown` function flushes and closes both providers, propagating any errors." 

## Slide 7 – Built-in Instrumentations
**Speaker Notes:**
- "Based on feature flags, `MTNOTel` attaches our built-in instrumentations: fetch, navigation, and AppState." 
- "Fetch instrumentation wraps `globalThis.fetch`, starts spans for each request, injects W3C trace headers, and records errors or non-OK statuses."
- "Navigation instrumentation listens to React Navigation events, creating spans per screen transition and capturing route names."
- "AppState instrumentation tracks foreground/background transitions, emitting spans and metrics counters for lifecycle changes."
- "Each instrumentation returns a teardown function so we can detach cleanly during shutdown." 

## Slide 8 – Business Journey Layer
**Speaker Notes:**
- "The SDK goes beyond raw technical spans with the `BusinessTracer` utility (see `src/business/BusinessTracer.ts`)."
- "Product teams can mark journeys—start, step, complete—and attach business metadata like feature names or user tiers."
- "`TrackedPressable` is a helper component that logs journey steps automatically when users tap UI elements."
- "These abstractions let stakeholders correlate telemetry with user outcomes, not just API timings." 

## Slide 9 – Helper APIs & Lifecycle Management
**Speaker Notes:**
- "`MTNOTel` exposes helpers like `attachNavigation`, `detachNavigation`, and `flushAndShutdown`."
- "`attachNavigation` supports scenarios where the navigation ref becomes available after initialization."
- "`flushAndShutdown` ensures we drain any pending telemetry—useful in test suites or before app termination." 

## Slide 10 – Integration Steps for Developers
**Speaker Notes:**
- "To adopt the SDK:"
  1. "Install the package and create an `OTelRNOptions` object with service name, environment, and OTLP endpoints."
  2. "Call `MTNOTel.init(options)` early in your app’s bootstrap (e.g., in the root component)."
  3. "Enable the instrumentations you need via feature flags."
  4. "Use `BusinessTracer` and helper APIs to enrich telemetry with domain insights."
  5. "Optionally call `flushAndShutdown` when the app exits or in integration tests." 

## Slide 11 – Extensibility & Customization
**Speaker Notes:**
- "Because the SDK sits on top of OpenTelemetry, we can plug in additional exporters or span processors without changing app code."
- "Developers can add custom attributes or instrumentations by following the same pattern: create a module that returns a cleanup function and register it during init." 
- "Sampling, resource attributes, and exporter endpoints are all configurable through `OTelRNOptions`."

## Slide 12 – Q&A Talking Points
**Speaker Notes:**
- "If asked 'Why OpenTelemetry?': emphasize vendor-neutrality and interoperability."
- "If asked about performance: mention batching exporters, sampling controls, and detachable instrumentations."
- "For data privacy questions: highlight that teams control which attributes they attach and where telemetry is sent."
- "For roadmap questions: discuss potential for additional instrumentations (e.g., Redux actions, performance profiling)."

## Slide 13 – Closing
**Speaker Notes:**
- "Reiterate: MTN Telemetry SDK streamlines observability for React Native by packaging OpenTelemetry best practices."
- "Invite questions and deeper dives into specific modules if time allows."
- "Thank the audience for their attention." 

---

### Appendix – Key Files to Reference During Live Demos
- `src/sdk/MTNOTel.ts`: Core orchestrator with init logic and helper methods.
- `src/sdk/resource.ts`: Resource builder merging device/app metadata.
- `src/sdk/providers.ts`: Tracer/meter provider setup and shutdown aggregator.
- `src/instrumentation/fetch.ts`: Fetch instrumentation implementation.
- `src/instrumentation/navigation.ts`: React Navigation instrumentation.
- `src/instrumentation/appState.ts`: AppState instrumentation.
- `src/business/BusinessTracer.ts`: Business journey API.

Use this appendix for quick file callouts if you open the codebase live during the presentation.
