"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireDatabaseInstance = exports.MISSING_DEFAULT_INSTANCE_ERROR_MESSAGE = void 0;
const clc = require("cli-color");
const error_1 = require("./error");
const getDefaultDatabaseInstance_1 = require("./getDefaultDatabaseInstance");
exports.MISSING_DEFAULT_INSTANCE_ERROR_MESSAGE = `It looks like you haven't created a Realtime Database instance in this project before. Please run ${clc.bold.underline("firebase init database")} to create your default Realtime Database instance.`;
async function requireDatabaseInstance(options) {
    if (options.instance) {
        return;
    }
    let instance;
    try {
        instance = await getDefaultDatabaseInstance_1.getDefaultDatabaseInstance(options);
    }
    catch (err) {
        throw new error_1.FirebaseError(`Failed to get details for project: ${options.project}.`, {
            original: err,
        });
    }
    if (instance === "") {
        throw new error_1.FirebaseError(exports.MISSING_DEFAULT_INSTANCE_ERROR_MESSAGE);
    }
    options.instance = instance;
}
exports.requireDatabaseInstance = requireDatabaseInstance;
