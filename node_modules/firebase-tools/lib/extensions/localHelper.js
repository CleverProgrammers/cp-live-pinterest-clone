"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLocalExtension = exports.readFile = exports.findExtensionYaml = exports.getLocalExtensionSpec = void 0;
const fs = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
const fsutils_1 = require("../fsutils");
const error_1 = require("../error");
const logger = require("../logger");
const EXTENSIONS_SPEC_FILE = "extension.yaml";
const EXTENSIONS_PREINSTALL_FILE = "PREINSTALL.md";
async function getLocalExtensionSpec(directory) {
    const spec = await parseYAML(readFile(path.resolve(directory, EXTENSIONS_SPEC_FILE)));
    try {
        const preinstall = readFile(path.resolve(directory, EXTENSIONS_PREINSTALL_FILE));
        spec.preinstallContent = preinstall;
    }
    catch (err) {
        logger.debug(`No PREINSTALL.md found in directory ${directory}.`);
    }
    return spec;
}
exports.getLocalExtensionSpec = getLocalExtensionSpec;
function findExtensionYaml(directory) {
    while (!fsutils_1.fileExistsSync(path.resolve(directory, EXTENSIONS_SPEC_FILE))) {
        const parentDir = path.dirname(directory);
        if (parentDir === directory) {
            throw new error_1.FirebaseError("Couldn't find an extension.yaml file. Check that you are in the root directory of your extension.");
        }
        directory = parentDir;
    }
    return directory;
}
exports.findExtensionYaml = findExtensionYaml;
function readFile(pathToFile) {
    try {
        return fs.readFileSync(pathToFile, "utf8");
    }
    catch (err) {
        if (err.code === "ENOENT") {
            throw new error_1.FirebaseError(`Could not find "${pathToFile}""`, { original: err });
        }
        throw new error_1.FirebaseError(`Failed to read file at "${pathToFile}"`, { original: err });
    }
}
exports.readFile = readFile;
function isLocalExtension(extensionName) {
    try {
        fs.readdirSync(extensionName);
    }
    catch (err) {
        return false;
    }
    return true;
}
exports.isLocalExtension = isLocalExtension;
function parseYAML(source) {
    try {
        return yaml.safeLoad(source);
    }
    catch (err) {
        if (err instanceof yaml.YAMLException) {
            throw new error_1.FirebaseError(`YAML Error: ${err.message}`, { original: err });
        }
        throw new error_1.FirebaseError(err.message);
    }
}
