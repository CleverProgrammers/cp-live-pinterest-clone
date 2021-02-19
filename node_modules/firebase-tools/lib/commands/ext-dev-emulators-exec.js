"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const checkMinRequiredVersion_1 = require("../checkMinRequiredVersion");
const command_1 = require("../command");
const commandUtils = require("../emulator/commandUtils");
const optionsHelper = require("../extensions/emulator/optionsHelper");
module.exports = new command_1.Command("ext:dev:emulators:exec <script>")
    .description("emulate an extension, run a test script, then shut down the emulators")
    .before(commandUtils.setExportOnExitOptions)
    .option(commandUtils.FLAG_INSPECT_FUNCTIONS, commandUtils.DESC_INSPECT_FUNCTIONS)
    .option(commandUtils.FLAG_TEST_CONFIG, commandUtils.DESC_TEST_CONFIG)
    .option(commandUtils.FLAG_TEST_PARAMS, commandUtils.DESC_TEST_PARAMS)
    .option(commandUtils.FLAG_IMPORT, commandUtils.DESC_IMPORT)
    .option(commandUtils.FLAG_EXPORT_ON_EXIT, commandUtils.DESC_EXPORT_ON_EXIT)
    .option(commandUtils.FLAG_UI, commandUtils.DESC_UI)
    .before(checkMinRequiredVersion_1.checkMinRequiredVersion, "extDevMinVersion")
    .action(async (script, options) => {
    const emulatorOptions = await optionsHelper.buildOptions(options);
    commandUtils.beforeEmulatorCommand(emulatorOptions);
    await commandUtils.emulatorExec(script, emulatorOptions);
});
