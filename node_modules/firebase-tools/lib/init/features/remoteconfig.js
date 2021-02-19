"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doSetup = void 0;
const logger = require("../../logger");
const prompt_1 = require("../../prompt");
const fsutils = require("../../fsutils");
const clc = require("cli-color");
async function doSetup(setup, config) {
    setup.config.remoteconfig = {};
    const jsonFilePath = await prompt_1.promptOnce({
        type: "input",
        name: "template",
        message: "What file should be used for your Remote Config template?",
        default: "remoteconfig.template.json",
    });
    if (fsutils.fileExistsSync(jsonFilePath)) {
        const msg = "File " +
            clc.bold(jsonFilePath) +
            " already exists." +
            " Do you want to overwrite the existing Remote Config template?";
        const overwrite = await prompt_1.promptOnce({
            type: "confirm",
            message: msg,
            default: false,
        });
        if (overwrite == true) {
            setup.config.remoteconfig.template = jsonFilePath;
            logger.info(setup.config.remoteconfig.template);
        }
        else {
            setup.config.remoteconfig.template = jsonFilePath;
        }
    }
    setup.config.remoteconfig.template = jsonFilePath;
    config.writeProjectFile(setup.config.remoteconfig.template, "");
}
exports.doSetup = doSetup;
