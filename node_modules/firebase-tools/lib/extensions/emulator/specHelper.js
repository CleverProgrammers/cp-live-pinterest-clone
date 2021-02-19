"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNodeVersion = exports.getFunctionProperties = exports.getFunctionResourcesWithParamSubstitution = exports.readFileFromDirectory = exports.readExtensionYaml = void 0;
const yaml = require("js-yaml");
const _ = require("lodash");
const path = require("path");
const fs = require("fs-extra");
const error_1 = require("../../error");
const extensionsHelper_1 = require("../extensionsHelper");
const emulatorLogger_1 = require("../../emulator/emulatorLogger");
const types_1 = require("../../emulator/types");
const SPEC_FILE = "extension.yaml";
const validFunctionTypes = [
    "firebaseextensions.v1beta.function",
    "firebaseextensions.v1beta.scheduledFunction",
];
function wrappedSafeLoad(source) {
    try {
        return yaml.safeLoad(source);
    }
    catch (err) {
        if (err instanceof yaml.YAMLException) {
            throw new error_1.FirebaseError(`YAML Error: ${err.message}`, { original: err });
        }
        throw err;
    }
}
async function readExtensionYaml(directory) {
    const extensionYaml = await readFileFromDirectory(directory, SPEC_FILE);
    const source = extensionYaml.source;
    return wrappedSafeLoad(source);
}
exports.readExtensionYaml = readExtensionYaml;
function readFileFromDirectory(directory, file) {
    return new Promise((resolve, reject) => {
        fs.readFile(path.resolve(directory, file), "utf8", (err, data) => {
            if (err) {
                if (err.code === "ENOENT") {
                    return reject(new error_1.FirebaseError(`Could not find "${file}" in "${directory}"`, { original: err }));
                }
                reject(new error_1.FirebaseError(`Failed to read file "${file}" in "${directory}"`, { original: err }));
            }
            else {
                resolve(data);
            }
        });
    }).then((source) => {
        return {
            source,
            sourceDirectory: directory,
        };
    });
}
exports.readFileFromDirectory = readFileFromDirectory;
function getFunctionResourcesWithParamSubstitution(extensionSpec, params) {
    const rawResources = extensionSpec.resources.filter((resource) => validFunctionTypes.includes(resource.type));
    return extensionsHelper_1.substituteParams(rawResources, params);
}
exports.getFunctionResourcesWithParamSubstitution = getFunctionResourcesWithParamSubstitution;
function getFunctionProperties(resources) {
    return resources.map((r) => r.properties);
}
exports.getFunctionProperties = getFunctionProperties;
function getNodeVersion(resources) {
    const functionNamesWithoutRuntime = [];
    const versions = resources.map((r) => {
        var _a, _b;
        if (_.includes(r.type, "function")) {
            if ((_a = r.properties) === null || _a === void 0 ? void 0 : _a.runtime) {
                return (_b = r.properties) === null || _b === void 0 ? void 0 : _b.runtime;
            }
            else {
                functionNamesWithoutRuntime.push(r.name);
            }
        }
        return "nodejs8";
    });
    if (functionNamesWithoutRuntime.length) {
        emulatorLogger_1.EmulatorLogger.forEmulator(types_1.Emulators.FUNCTIONS).logLabeled("WARN", "extensions", `No 'runtime' property found for the following functions, defaulting to nodejs8: ${functionNamesWithoutRuntime.join(", ")}`);
    }
    const invalidRuntimes = _.filter(versions, (v) => {
        return !_.includes(v, "nodejs");
    });
    if (invalidRuntimes.length) {
        throw new error_1.FirebaseError(`The following runtimes are not supported by the Emulator Suite: ${invalidRuntimes.join(", ")}. \n Only Node runtimes are supported.`);
    }
    if (_.includes(versions, "nodejs10")) {
        return "10";
    }
    if (_.includes(versions, "nodejs6")) {
        emulatorLogger_1.EmulatorLogger.forEmulator(types_1.Emulators.FUNCTIONS).logLabeled("WARN", "extensions", "Node 6 is deprecated. We recommend upgrading to a newer version.");
        return "6";
    }
    return "8";
}
exports.getNodeVersion = getNodeVersion;
