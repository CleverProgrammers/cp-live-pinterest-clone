"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("../command");
const logger = require("../logger");
const requireDatabaseInstance_1 = require("../requireDatabaseInstance");
const requirePermissions_1 = require("../requirePermissions");
const metadata = require("../database/metadata");
const types_1 = require("../emulator/types");
const commandUtils_1 = require("../emulator/commandUtils");
exports.default = new command_1.Command("database:rules:get <rulesetId>")
    .description("get a realtime database ruleset by id")
    .option("--instance <instance>", "use the database <instance>.firebaseio.com (if omitted, uses default database instance)")
    .before(requirePermissions_1.requirePermissions, ["firebasedatabase.instances.get"])
    .before(requireDatabaseInstance_1.requireDatabaseInstance)
    .before(commandUtils_1.warnEmulatorNotSupported, types_1.Emulators.DATABASE)
    .action(async (rulesetId, options) => {
    const ruleset = await metadata.getRuleset(options.instance, rulesetId);
    logger.info(`Ruleset ${ruleset.id} was created at ${ruleset.createdAt}`);
    logger.info(ruleset.source);
    return ruleset;
});
