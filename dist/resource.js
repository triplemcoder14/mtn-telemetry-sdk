"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildResource = buildResource;
const resources_1 = require("@opentelemetry/resources");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const react_native_device_info_1 = __importDefault(require("react-native-device-info"));
function buildResource(opts) {
    var _a, _b, _c, _d, _e, _f;
    const attrs = {
        [semantic_conventions_1.SEMRESATTRS_SERVICE_NAME]: opts.serviceName,
        [semantic_conventions_1.SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: (_a = opts.environment) !== null && _a !== void 0 ? _a : 'dev',
        [semantic_conventions_1.SEMRESATTRS_SERVICE_VERSION]: (_b = opts.release) !== null && _b !== void 0 ? _b : react_native_device_info_1.default.getVersion(),
        'device.manufacturer': (_d = (_c = react_native_device_info_1.default.getManufacturerSync) === null || _c === void 0 ? void 0 : _c.call(react_native_device_info_1.default)) !== null && _d !== void 0 ? _d : 'unknown',
        'device.model': react_native_device_info_1.default.getModel(),
        'device.os': `${react_native_device_info_1.default.getSystemName()} ${react_native_device_info_1.default.getSystemVersion()}`,
        'app.bundle': react_native_device_info_1.default.getBundleId(),
        'app.build': react_native_device_info_1.default.getBuildNumber(),
        'app.isEmulator': (_f = (_e = react_native_device_info_1.default.isEmulatorSync) === null || _e === void 0 ? void 0 : _e.call(react_native_device_info_1.default)) !== null && _f !== void 0 ? _f : false,
    };
    return new resources_1.Resource(attrs);
}
