"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const clc = require("cli-color");
const ora = require("ora");
const Table = require("cli-table");
const command_1 = require("../command");
const getProjectId = require("../getProjectId");
const apps_1 = require("../management/apps");
const requireAuth_1 = require("../requireAuth");
const logger = require("../logger");
const NOT_SPECIFIED = clc.yellow("[Not specified]");
function logAppsList(apps) {
    if (apps.length === 0) {
        logger.info(clc.bold("No apps found."));
        return;
    }
    const tableHead = ["App Display Name", "App ID", "Platform"];
    const table = new Table({ head: tableHead, style: { head: ["green"] } });
    apps.forEach(({ appId, displayName, platform }) => {
        table.push([displayName || NOT_SPECIFIED, appId, platform]);
    });
    logger.info(table.toString());
}
function logAppCount(count = 0) {
    if (count === 0) {
        return;
    }
    logger.info("");
    logger.info(`${count} app(s) total.`);
}
module.exports = new command_1.Command("apps:list [platform]")
    .description("list the registered apps of a Firebase project. " +
    "Optionally filter apps by [platform]: IOS, ANDROID or WEB (case insensitive)")
    .before(requireAuth_1.requireAuth)
    .action(async (platform, options) => {
    const projectId = getProjectId(options);
    const appPlatform = apps_1.getAppPlatform(platform || "");
    let apps;
    const spinner = ora("Preparing the list of your Firebase " +
        `${appPlatform === apps_1.AppPlatform.ANY ? "" : appPlatform + " "}apps`).start();
    try {
        apps = await apps_1.listFirebaseApps(projectId, appPlatform);
    }
    catch (err) {
        spinner.fail();
        throw err;
    }
    spinner.succeed();
    logAppsList(apps);
    logAppCount(apps.length);
    return apps;
});
