"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doSetup = void 0;
const clc = require("cli-color");
const fs = require("fs");
const logger = require("../../logger");
const prompt_1 = require("../../prompt");
const ensureCloudResourceLocation_1 = require("../../ensureCloudResourceLocation");
const RULES_TEMPLATE = fs.readFileSync(__dirname + "/../../../templates/init/storage/storage.rules", "utf8");
async function doSetup(setup, config) {
    setup.config.storage = {};
    ensureCloudResourceLocation_1.ensureLocationSet(setup.projectLocation, "Cloud Storage");
    logger.info();
    logger.info("Firebase Storage Security Rules allow you to define how and when to allow");
    logger.info("uploads and downloads. You can keep these rules in your project directory");
    logger.info("and publish them with " + clc.bold("firebase deploy") + ".");
    logger.info();
    const storageRulesFile = await prompt_1.promptOnce({
        type: "input",
        name: "rules",
        message: "What file should be used for Storage Rules?",
        default: "storage.rules",
    });
    setup.config.storage.rules = storageRulesFile;
    config.writeProjectFile(setup.config.storage.rules, RULES_TEMPLATE);
}
exports.doSetup = doSetup;
