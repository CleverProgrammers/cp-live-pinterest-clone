"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const clc = require("cli-color");
const command_1 = require("../command");
const getProjectId = require("../getProjectId");
const apps_1 = require("../management/apps");
const requireAuth_1 = require("../requireAuth");
const utils_1 = require("../utils");
module.exports = new command_1.Command("apps:android:sha:delete <appId> <shaId>")
    .description("delete a SHA certificate hash for a given app id.")
    .before(requireAuth_1.requireAuth)
    .action(async (appId = "", shaId = "", options) => {
    const projectId = getProjectId(options);
    await utils_1.promiseWithSpinner(async () => await apps_1.deleteAppAndroidSha(projectId, appId, shaId), `Deleting Android SHA certificate hash with SHA id ${clc.bold(shaId)} and Android app Id ${clc.bold(appId)}`);
});
