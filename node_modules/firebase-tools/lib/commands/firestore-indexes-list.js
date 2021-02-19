"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("../command");
const clc = require("cli-color");
const fsi = require("../firestore/indexes");
const logger = require("../logger");
const requirePermissions_1 = require("../requirePermissions");
const types_1 = require("../emulator/types");
const commandUtils_1 = require("../emulator/commandUtils");
module.exports = new command_1.Command("firestore:indexes")
    .description("List indexes in your project's Cloud Firestore database.")
    .option("--pretty", "Pretty print. When not specified the indexes are printed in the " +
    "JSON specification format.")
    .before(requirePermissions_1.requirePermissions, ["datastore.indexes.list"])
    .before(commandUtils_1.warnEmulatorNotSupported, types_1.Emulators.FIRESTORE)
    .action(async (options) => {
    const indexApi = new fsi.FirestoreIndexes();
    const indexes = await indexApi.listIndexes(options.project);
    const fieldOverrides = await indexApi.listFieldOverrides(options.project);
    const indexSpec = indexApi.makeIndexSpec(indexes, fieldOverrides);
    if (options.pretty) {
        logger.info(clc.bold.white("Compound Indexes"));
        indexApi.prettyPrintIndexes(indexes);
        if (fieldOverrides) {
            logger.info();
            logger.info(clc.bold.white("Field Overrides"));
            indexApi.printFieldOverrides(fieldOverrides);
        }
    }
    else {
        logger.info(JSON.stringify(indexSpec, undefined, 2));
    }
    return indexSpec;
});
