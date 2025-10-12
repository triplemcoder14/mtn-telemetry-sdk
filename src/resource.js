"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildResource = buildResource;
var resources_1 = require("@opentelemetry/resources");
var semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
var react_native_device_info_1 = require("react-native-device-info");
function buildResource(opts) {
    var _a;
    var _b, _c, _d, _e, _f, _g;
    var attrs = (_a = {},
        _a[semantic_conventions_1.SEMRESATTRS_SERVICE_NAME] = opts.serviceName,
        _a[semantic_conventions_1.SEMRESATTRS_DEPLOYMENT_ENVIRONMENT] = (_b = opts.environment) !== null && _b !== void 0 ? _b : 'dev',
        _a[semantic_conventions_1.SEMRESATTRS_SERVICE_VERSION] = (_c = opts.release) !== null && _c !== void 0 ? _c : react_native_device_info_1.default.getVersion(),
        _a['device.manufacturer'] = (_e = (_d = react_native_device_info_1.default.getManufacturerSync) === null || _d === void 0 ? void 0 : _d.call(react_native_device_info_1.default)) !== null && _e !== void 0 ? _e : 'unknown',
        _a['device.model'] = react_native_device_info_1.default.getModel(),
        _a['device.os'] = "".concat(react_native_device_info_1.default.getSystemName(), " ").concat(react_native_device_info_1.default.getSystemVersion()),
        _a['app.bundle'] = react_native_device_info_1.default.getBundleId(),
        _a['app.build'] = react_native_device_info_1.default.getBuildNumber(),
        _a['app.isEmulator'] = (_g = (_f = react_native_device_info_1.default.isEmulatorSync) === null || _f === void 0 ? void 0 : _f.call(react_native_device_info_1.default)) !== null && _g !== void 0 ? _g : false,
        _a);
    return new resources_1.Resource(attrs);
}
