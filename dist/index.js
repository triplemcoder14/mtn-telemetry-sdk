"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MTNOTel = void 0;
const providers_1 = require("./providers");
const resource_1 = require("./resource");
const fetch_1 = require("./instrumentations/fetch");
const react_nav_1 = require("./instrumentations/react-nav");
// import { installReactNavigationInstrumentation } from './instrumentations/react-navigation';
const app_state_1 = require("./instrumentations/app-state");
class MTNOTel {
    constructor() {
        this.shutdownFns = [];
    }
    static init(opts) {
        var _a;
        if (MTNOTel._instance)
            return MTNOTel._instance;
        const resource = (0, resource_1.buildResource)(opts);
        const { tracerProvider, meterProvider, shutdown } = (0, providers_1.buildProviders)({
            resource,
            tracesUrl: opts.otlp.tracesUrl,
            metricsUrl: opts.otlp.metricsUrl,
            headers: opts.otlp.headers,
            samplingRatio: (_a = opts.samplingRatio) !== null && _a !== void 0 ? _a : 1.0,
        });
        const sdk = new MTNOTel();
        sdk.shutdownFns.push(shutdown);
        if (opts.enableFetch) {
            sdk.shutdownFns.push((0, fetch_1.installFetchInstrumentation)(tracerProvider));
        }
        if (opts.enableNavigation) {
            sdk.shutdownFns.push((0, react_nav_1.installReactNavigationInstrumentation)(tracerProvider));
        }
        if (opts.enableAppState) {
            sdk.shutdownFns.push((0, app_state_1.installAppStateInstrumentation)(tracerProvider, meterProvider));
        }
        MTNOTel._instance = sdk;
        return sdk;
    }
    async flushAndShutdown() {
        for (const fn of this.shutdownFns.reverse()) {
            try {
                await fn();
            }
            catch { }
        }
        MTNOTel._instance = null;
    }
}
exports.MTNOTel = MTNOTel;
MTNOTel._instance = null;
__exportStar(require("./types"), exports);
__exportStar(require("./context"), exports);
__exportStar(require("./business"), exports);
