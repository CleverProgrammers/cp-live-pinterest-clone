"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("../command");
const error_1 = require("../error");
const prompt_1 = require("../prompt");
const requireAuth_1 = require("../requireAuth");
const rollback_1 = require("../remoteconfig/rollback");
const requirePermissions_1 = require("../requirePermissions");
const versionslist_1 = require("../remoteconfig/versionslist");
const getProjectId = require("../getProjectId");
module.exports = new command_1.Command("remoteconfig:rollback")
    .description("roll back a project's published Remote Config template to the one specified by the provided version number")
    .before(requireAuth_1.requireAuth)
    .before(requirePermissions_1.requirePermissions, ["cloudconfig.configs.get", "cloudconfig.configs.update"])
    .option("-v, --version-number <versionNumber>", "rollback to the specified version of the template")
    .option("--force", "rollback template to the specified version without confirmation")
    .action(async (options) => {
    var _a;
    const templateVersion = await versionslist_1.getVersions(getProjectId(options), 1);
    let targetVersion = 0;
    if (options.versionNumber) {
        targetVersion = options.versionNumber;
    }
    else {
        if ((_a = templateVersion === null || templateVersion === void 0 ? void 0 : templateVersion.versions[0]) === null || _a === void 0 ? void 0 : _a.versionNumber) {
            const latestVersion = templateVersion.versions[0].versionNumber.toString();
            const previousVersion = parseInt(latestVersion) - 1;
            targetVersion = previousVersion;
        }
    }
    if (targetVersion <= 0) {
        throw new error_1.FirebaseError(`Failed to rollback Firebase Remote Config template for project to version` +
            targetVersion +
            `. ` +
            `Invalid Version Number`);
    }
    if (!options.force) {
        const { confirm } = await prompt_1.prompt(options, [
            {
                type: "confirm",
                name: "confirm",
                message: "Proceed to rollback template to version " + targetVersion + "?",
                default: false,
            },
        ]);
        if (!confirm) {
            return;
        }
    }
    return rollback_1.rollbackTemplate(getProjectId(options), targetVersion);
});
