"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessTracer = void 0;
exports.TrackedPressable = TrackedPressable;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const api_1 = require("@opentelemetry/api");
/**
 * BusinessTracer — captures business journeys and steps
 */
class BusinessTracer {
    /**
     * Start a business journey (e.g. "UserOnboarding", "PurchaseFlow")
     */
    static start(journeyName, attrs = {}) {
        const tracer = api_1.trace.getTracer('mtn-sdk:business');
        const span = tracer.startSpan(`Journey ${journeyName}`, {
            kind: api_1.SpanKind.INTERNAL,
            attributes: {
                'business.journey': journeyName,
                ...attrs,
            },
        });
        this.currentJourney = { name: journeyName, startTime: Date.now() };
        span.end(); // parent marker span; steps are separate child spans
    }
    /**
     * Record a business step within a journey (e.g. "PaymentAuthorized")
     */
    static step(stepName, attrs = {}) {
        var _a, _b;
        const tracer = api_1.trace.getTracer('mtn-sdk:business');
        const journey = (_b = (_a = this.currentJourney) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : 'unknown';
        const span = tracer.startSpan(`Step ${stepName}`, {
            kind: api_1.SpanKind.INTERNAL,
            attributes: {
                'business.journey': journey,
                'business.step': stepName,
                ...attrs,
            },
        });
        span.end();
    }
    /**
     * Complete a business journey
     */
    static complete(attrs = {}) {
        var _a, _b;
        const tracer = api_1.trace.getTracer('mtn-sdk:business');
        const journey = (_b = (_a = this.currentJourney) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : 'unknown';
        const dur = this.currentJourney
            ? Date.now() - this.currentJourney.startTime
            : undefined;
        const span = tracer.startSpan(`Journey ${journey} Complete`, {
            kind: api_1.SpanKind.INTERNAL,
            attributes: {
                'business.journey': journey,
                'business.completed': true,
                'business.duration_ms': dur,
                ...attrs,
            },
        });
        span.end();
        this.currentJourney = undefined;
    }
}
exports.BusinessTracer = BusinessTracer;
/**
 * TrackedPressable — wraps a Pressable and records user interactions as steps
 */
function TrackedPressable({ onPress, accessibilityLabel, children, ...rest }) {
    const label = accessibilityLabel ||
        (typeof children === 'string' ? children : 'pressable');
    const handlePress = (e) => {
        BusinessTracer.step(`tap:${label}`);
        onPress === null || onPress === void 0 ? void 0 : onPress(e);
    };
    return ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { ...rest, onPress: handlePress, children: children }));
}
