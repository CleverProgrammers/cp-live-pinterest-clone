"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("../command");
const logger = require("../logger");
const requirePermissions_1 = require("../requirePermissions");
const commandUtils_1 = require("../emulator/commandUtils");
const types_1 = require("../emulator/types");
const database_1 = require("../management/database");
const getProjectId = require("../getProjectId");
const getDefaultDatabaseInstance_1 = require("../getDefaultDatabaseInstance");
const error_1 = require("../error");
const requireDatabaseInstance_1 = require("../requireDatabaseInstance");
exports.default = new command_1.Command("database:instances:create <instanceName>")
    .description("create a realtime database instance")
    .option("-l, --location <location>", "(optional) location for the database instance, defaults to us-central1")
    .before(requirePermissions_1.requirePermissions, ["firebasedatabase.instances.create"])
    .before(commandUtils_1.warnEmulatorNotSupported, types_1.Emulators.DATABASE)
    .action(async (instanceName, options) => {
    const projectId = getProjectId(options);
    const defaultDatabaseInstance = await getDefaultDatabaseInstance_1.getDefaultDatabaseInstance({ project: projectId });
    if (defaultDatabaseInstance === "") {
        throw new error_1.FirebaseError(requireDatabaseInstance_1.MISSING_DEFAULT_INSTANCE_ERROR_MESSAGE);
    }
    const location = database_1.parseDatabaseLocation(options.location, database_1.DatabaseLocation.US_CENTRAL1);
    const instance = await database_1.createInstance(projectId, instanceName, location, database_1.DatabaseInstanceType.USER_DATABASE);
    logger.info(`created database instance ${instance.name}`);
    return instance;
});
