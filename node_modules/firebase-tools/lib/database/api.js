"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.realtimeOriginOrCustomUrl = exports.realtimeOriginOrEmulatorOrCustomUrl = void 0;
const utils_1 = require("../utils");
const constants_1 = require("../emulator/constants");
function realtimeOriginOrEmulatorOrCustomUrl(host) {
    return utils_1.envOverride(constants_1.Constants.FIREBASE_DATABASE_EMULATOR_HOST, utils_1.envOverride("FIREBASE_REALTIME_URL", host), addHttpIfRequired);
}
exports.realtimeOriginOrEmulatorOrCustomUrl = realtimeOriginOrEmulatorOrCustomUrl;
function realtimeOriginOrCustomUrl(host) {
    return utils_1.envOverride("FIREBASE_REALTIME_URL", host);
}
exports.realtimeOriginOrCustomUrl = realtimeOriginOrCustomUrl;
function addHttpIfRequired(val) {
    if (val.startsWith("http")) {
        return val;
    }
    return `http://${val}`;
}
