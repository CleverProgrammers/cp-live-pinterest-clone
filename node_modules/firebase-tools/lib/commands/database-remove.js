"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("../command");
const requireDatabaseInstance_1 = require("../requireDatabaseInstance");
const requirePermissions_1 = require("../requirePermissions");
const remove_1 = require("../database/remove");
const types_1 = require("../emulator/types");
const commandUtils_1 = require("../emulator/commandUtils");
const database_1 = require("../management/database");
const api_1 = require("../database/api");
const utils = require("../utils");
const prompt_1 = require("../prompt");
const clc = require("cli-color");
const _ = require("lodash");
module.exports = new command_1.Command("database:remove <path>")
    .description("remove data from your Firebase at the specified path")
    .option("-y, --confirm", "pass this option to bypass confirmation prompt")
    .option("--instance <instance>", "use the database <instance>.firebaseio.com (if omitted, use default database instance)")
    .before(requirePermissions_1.requirePermissions, ["firebasedatabase.instances.update"])
    .before(requireDatabaseInstance_1.requireDatabaseInstance)
    .before(database_1.populateInstanceDetails)
    .before(commandUtils_1.warnEmulatorNotSupported, types_1.Emulators.DATABASE)
    .action((path, options) => {
    if (!_.startsWith(path, "/")) {
        return utils.reject("Path must begin with /", { exit: 1 });
    }
    const origin = api_1.realtimeOriginOrEmulatorOrCustomUrl(options.instanceDetails.databaseUrl);
    const databaseUrl = utils.getDatabaseUrl(origin, options.instance, path);
    return prompt_1.prompt(options, [
        {
            type: "confirm",
            name: "confirm",
            default: false,
            message: "You are about to remove all data at " + clc.cyan(databaseUrl) + ". Are you sure?",
        },
    ]).then(() => {
        if (!options.confirm) {
            return utils.reject("Command aborted.", { exit: 1 });
        }
        const removeOps = new remove_1.default(options.instance, path, origin);
        return removeOps.execute().then(() => {
            utils.logSuccess("Data removed successfully");
        });
    });
});
