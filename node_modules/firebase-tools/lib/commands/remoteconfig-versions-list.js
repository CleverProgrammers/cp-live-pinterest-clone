"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger = require("../logger");
const rcVersion = require("../remoteconfig/versionslist");
const command_1 = require("../command");
const getProjectId = require("../getProjectId");
const requireAuth_1 = require("../requireAuth");
const requirePermissions_1 = require("../requirePermissions");
const Table = require("cli-table");
const tableHead = ["Update User", "Version Number", "Update Time"];
function pushTableContents(table, version) {
    var _a;
    return table.push([(_a = version === null || version === void 0 ? void 0 : version.updateUser) === null || _a === void 0 ? void 0 : _a.email, version === null || version === void 0 ? void 0 : version.versionNumber, version === null || version === void 0 ? void 0 : version.updateTime]);
}
module.exports = new command_1.Command("remoteconfig:versions:list")
    .description("get a list of Remote Config template versions that have been published for a Firebase project")
    .option("--limit <maxResults>", "limit the number of versions being returned. Pass '0' to fetch all versions.")
    .before(requireAuth_1.requireAuth)
    .before(requirePermissions_1.requirePermissions, ["cloudconfig.configs.get"])
    .action(async (options) => {
    const versionsList = await rcVersion.getVersions(getProjectId(options), options.limit);
    const table = new Table({ head: tableHead, style: { head: ["green"] } });
    for (let item = 0; item < versionsList.versions.length; item++) {
        pushTableContents(table, versionsList.versions[item]);
    }
    logger.info(table.toString());
    return versionsList;
});
