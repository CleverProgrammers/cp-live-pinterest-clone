"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("../command");
const extensionsHelper_1 = require("../extensions/extensionsHelper");
const extensionsApi_1 = require("../extensions/extensionsApi");
const localHelper_1 = require("../extensions/localHelper");
const requireAuth_1 = require("../requireAuth");
const clc = require("cli-color");
const error_1 = require("../error");
exports.default = new command_1.Command("ext:dev:publish <extensionRef>")
    .description(`publish a new version of an extension`)
    .help("if you have not previously published a version of this extension, this will " +
    "create the extension. If you have previously published a version of this extension, this version must " +
    "be greater than previous versions.")
    .before(requireAuth_1.requireAuth)
    .action(async (extensionRef) => {
    const { publisherId, extensionId, version } = extensionsApi_1.parseRef(extensionRef);
    if (version) {
        throw new error_1.FirebaseError(`The input extension reference must be of the format ${clc.bold("<publisherId>/<extensionId>")}. Version should not be supplied and will be inferred directly from extension.yaml. Please increment the version in extension.yaml if you would like to bump/specify a version.`);
    }
    if (!publisherId || !extensionId) {
        throw new error_1.FirebaseError(`Error parsing publisher ID and extension ID from extension reference '${clc.bold(extensionRef)}'. Please use the format '${clc.bold("<publisherId>/<extensionId>")}'.`);
    }
    const extensionYamlDirectory = localHelper_1.findExtensionYaml(process.cwd());
    const res = await extensionsHelper_1.publishExtensionVersionFromLocalSource(publisherId, extensionId, extensionYamlDirectory);
    return res;
});
