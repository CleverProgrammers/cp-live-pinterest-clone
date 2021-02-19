"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doSetup = void 0;
const clc = require("cli-color");
const _ = require("lodash");
const utils = require("../../utils");
const prompt_1 = require("../../prompt");
const types_1 = require("../../emulator/types");
const constants_1 = require("../../emulator/constants");
const downloadableEmulators_1 = require("../../emulator/downloadableEmulators");
async function doSetup(setup, config) {
    const choices = types_1.ALL_SERVICE_EMULATORS.map((e) => {
        return {
            value: e,
            name: constants_1.Constants.description(e),
            checked: config && (config.has(e) || config.has(`emulators.${e}`)),
        };
    });
    const selections = {};
    await prompt_1.prompt(selections, [
        {
            type: "checkbox",
            name: "emulators",
            message: "Which Firebase emulators do you want to set up? " +
                "Press Space to select emulators, then Enter to confirm your choices.",
            choices: choices,
        },
    ]);
    if (!selections.emulators) {
        return;
    }
    setup.config.emulators = setup.config.emulators || {};
    for (const selected of selections.emulators) {
        setup.config.emulators[selected] = setup.config.emulators[selected] || {};
        const currentPort = setup.config.emulators[selected].port;
        if (currentPort) {
            utils.logBullet(`Port for ${selected} already configured: ${clc.cyan(currentPort)}`);
        }
        else {
            await prompt_1.prompt(setup.config.emulators[selected], [
                {
                    type: "number",
                    name: "port",
                    message: `Which port do you want to use for the ${clc.underline(selected)} emulator?`,
                    default: constants_1.Constants.getDefaultPort(selected),
                },
            ]);
        }
    }
    if (selections.emulators.length) {
        const uiDesc = constants_1.Constants.description(types_1.Emulators.UI);
        if (setup.config.emulators.ui && setup.config.emulators.ui.enabled !== false) {
            const currentPort = setup.config.emulators.ui.port || "(automatic)";
            utils.logBullet(`${uiDesc} already enabled with port: ${clc.cyan(currentPort)}`);
        }
        else {
            const ui = setup.config.emulators.ui || {};
            setup.config.emulators.ui = ui;
            await prompt_1.prompt(ui, [
                {
                    name: "enabled",
                    type: "confirm",
                    message: `Would you like to enable the ${uiDesc}?`,
                    default: true,
                },
            ]);
            if (ui.enabled) {
                await prompt_1.prompt(ui, [
                    {
                        type: "input",
                        name: "port",
                        message: `Which port do you want to use for the ${clc.underline(uiDesc)} (leave empty to use any available port)?`,
                    },
                ]);
                const portNum = Number.parseInt(ui.port);
                ui.port = isNaN(portNum) ? undefined : portNum;
            }
        }
        await prompt_1.prompt(selections, [
            {
                name: "download",
                type: "confirm",
                message: "Would you like to download the emulators now?",
                default: false,
            },
        ]);
    }
    if (selections.download) {
        for (const selected of selections.emulators) {
            if (types_1.isDownloadableEmulator(selected)) {
                await downloadableEmulators_1.downloadIfNecessary(selected);
            }
        }
        if (_.get(setup, "config.emulators.ui.enabled")) {
            downloadableEmulators_1.downloadIfNecessary(types_1.Emulators.UI);
        }
    }
}
exports.doSetup = doSetup;
