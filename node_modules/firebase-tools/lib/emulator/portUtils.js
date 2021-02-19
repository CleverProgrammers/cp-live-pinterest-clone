"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForPortClosed = exports.checkPortOpen = exports.findAvailablePort = exports.suggestUnrestricted = exports.isRestricted = void 0;
const pf = require("portfinder");
const tcpport = require("tcp-port-used");
const error_1 = require("../error");
const logger = require("../logger");
const RESTRICTED_PORTS = [
    1,
    7,
    9,
    11,
    13,
    15,
    17,
    19,
    20,
    21,
    22,
    23,
    25,
    37,
    42,
    43,
    53,
    77,
    79,
    87,
    95,
    101,
    102,
    103,
    104,
    109,
    110,
    111,
    113,
    115,
    117,
    119,
    123,
    135,
    139,
    143,
    179,
    389,
    427,
    465,
    512,
    513,
    514,
    515,
    526,
    530,
    531,
    532,
    540,
    548,
    556,
    563,
    587,
    601,
    636,
    993,
    995,
    2049,
    3659,
    4045,
    6000,
    6665,
    6666,
    6667,
    6668,
    6669,
    6697,
];
function isRestricted(port) {
    return RESTRICTED_PORTS.includes(port);
}
exports.isRestricted = isRestricted;
function suggestUnrestricted(port) {
    if (!isRestricted(port)) {
        return port;
    }
    let newPort = port;
    while (isRestricted(newPort)) {
        newPort++;
    }
    return newPort;
}
exports.suggestUnrestricted = suggestUnrestricted;
async function findAvailablePort(host, start, avoidRestricted = true) {
    const openPort = await pf.getPortPromise({ host, port: start });
    if (avoidRestricted && isRestricted(openPort)) {
        logger.debug(`portUtils: skipping restricted port ${openPort}`);
        return findAvailablePort(host, suggestUnrestricted(openPort), avoidRestricted);
    }
    return openPort;
}
exports.findAvailablePort = findAvailablePort;
async function checkPortOpen(port, host) {
    try {
        const inUse = await tcpport.check(port, host);
        return !inUse;
    }
    catch (e) {
        logger.debug(`port check error: ${e}`);
        return false;
    }
}
exports.checkPortOpen = checkPortOpen;
async function waitForPortClosed(port, host) {
    const interval = 250;
    const timeout = 30000;
    try {
        await tcpport.waitUntilUsedOnHost(port, host, interval, timeout);
    }
    catch (e) {
        throw new error_1.FirebaseError(`TIMEOUT: Port ${port} on ${host} was not active within ${timeout}ms`);
    }
}
exports.waitForPortClosed = waitForPortClosed;
