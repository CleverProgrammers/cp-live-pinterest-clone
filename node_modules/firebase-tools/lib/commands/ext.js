"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const clc = require("cli-color");
const checkMinRequiredVersion_1 = require("../checkMinRequiredVersion");
const command_1 = require("../command");
const getProjectId = require("../getProjectId");
const extensionsHelper_1 = require("../extensions/extensionsHelper");
const listExtensions_1 = require("../extensions/listExtensions");
const requirePermissions_1 = require("../requirePermissions");
const logger = require("../logger");
const utils = require("../utils");
module.exports = new command_1.Command("ext")
    .description("display information on how to use ext commands and extensions installed to your project")
    .before(checkMinRequiredVersion_1.checkMinRequiredVersion, "extMinVersion")
    .action(async (options) => {
    utils.logLabeledBullet(extensionsHelper_1.logPrefix, "list of extensions commands:");
    const firebaseTools = require("../");
    const commandNames = [
        "ext:install",
        "ext:info",
        "ext:list",
        "ext:configure",
        "ext:update",
        "ext:uninstall",
    ];
    _.forEach(commandNames, (commandName) => {
        const command = firebaseTools.getCommand(commandName);
        logger.info(clc.bold("\n" + command.name()));
        command.outputHelp();
    });
    logger.info();
    try {
        await requirePermissions_1.requirePermissions(options, ["firebaseextensions.instances.list"]);
        const projectId = getProjectId(options);
        return listExtensions_1.listExtensions(projectId);
    }
    catch (err) {
        return;
    }
});
