"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doSetup = void 0;
const clc = require("cli-color");
const api = require("../../api");
const prompt_1 = require("../../prompt");
const logger = require("../../logger");
const utils = require("../../utils");
const fsutils = require("../../fsutils");
const database_1 = require("../../management/database");
const ora = require("ora");
const ensureApiEnabled_1 = require("../../ensureApiEnabled");
const getDefaultDatabaseInstance_1 = require("../../getDefaultDatabaseInstance");
const error_1 = require("../../error");
const DEFAULT_RULES = JSON.stringify({ rules: { ".read": "auth != null", ".write": "auth != null" } }, null, 2);
async function getDBRules(instanceDetails) {
    if (!instanceDetails || !instanceDetails.name) {
        return DEFAULT_RULES;
    }
    const response = await api.request("GET", "/.settings/rules.json", {
        auth: true,
        origin: instanceDetails.databaseUrl,
    });
    return response.body;
}
function writeDBRules(rules, logMessagePrefix, filename, config) {
    config.writeProjectFile(filename, rules);
    utils.logSuccess(`${logMessagePrefix} have been written to ${clc.bold(filename)}.`);
    logger.info(`Future modifications to ${clc.bold(filename)} will update Realtime Database Security Rules when you run`);
    logger.info(clc.bold("firebase deploy") + ".");
}
async function createDefaultDatabaseInstance(project) {
    const selectedLocation = await prompt_1.promptOnce({
        type: "list",
        message: "Please choose the location for your default Realtime Database instance:",
        choices: [
            { name: "us-central1", value: database_1.DatabaseLocation.US_CENTRAL1 },
            { name: "europe-west1", value: database_1.DatabaseLocation.EUROPE_WEST1 },
        ],
    });
    let instanceName = `${project}-default-rtdb`;
    const checkOutput = await database_1.checkInstanceNameAvailable(project, instanceName, database_1.DatabaseInstanceType.DEFAULT_DATABASE, selectedLocation);
    if (!checkOutput.available) {
        if (!checkOutput.suggestedIds || checkOutput.suggestedIds.length === 0) {
            logger.debug(`No instance names were suggested instead of conventional instance name: ${instanceName}`);
            throw new error_1.FirebaseError("Failed to create default RTDB instance");
        }
        instanceName = checkOutput.suggestedIds[0];
        logger.info(`${clc.yellow("WARNING:")} your project ID has the legacy name format, so your default Realtime Database instance will be named differently: ${instanceName}`);
    }
    const spinner = ora(`Creating your default Realtime Database instance: ${instanceName}`).start();
    try {
        const createdInstance = await database_1.createInstance(project, instanceName, selectedLocation, database_1.DatabaseInstanceType.DEFAULT_DATABASE);
        spinner.succeed();
        return createdInstance;
    }
    catch (err) {
        spinner.fail();
        throw err;
    }
}
async function doSetup(setup, config) {
    setup.config = {};
    await ensureApiEnabled_1.ensure(setup.projectId, "firebasedatabase.googleapis.com", "database", false);
    logger.info();
    setup.instance =
        setup.instance || (await getDefaultDatabaseInstance_1.getDefaultDatabaseInstance({ project: setup.projectId }));
    let instanceDetails;
    if (setup.instance !== "") {
        instanceDetails = await database_1.getDatabaseInstanceDetails(setup.projectId, setup.instance);
    }
    else {
        const confirm = await prompt_1.promptOnce({
            type: "confirm",
            name: "confirm",
            default: true,
            message: "It seems like you haven’t initialized Realtime Database in your project yet. Do you want to set it up?",
        });
        if (confirm) {
            instanceDetails = await createDefaultDatabaseInstance(setup.projectId);
        }
    }
    setup.config.database = setup.config.database || {};
    logger.info();
    logger.info("Firebase Realtime Database Security Rules allow you to define how your data should be");
    logger.info("structured and when your data can be read from and written to.");
    logger.info();
    await prompt_1.prompt(setup.config.database, [
        {
            type: "input",
            name: "rules",
            message: "What file should be used for Realtime Database Security Rules?",
            default: "database.rules.json",
        },
    ]);
    const filename = setup.config.database.rules;
    if (!filename) {
        throw new error_1.FirebaseError("Must specify location for Realtime Database rules file.");
    }
    let writeRules = true;
    if (fsutils.fileExistsSync(filename)) {
        const msg = `File ${clc.bold(filename)} already exists. Do you want to overwrite it with ${instanceDetails
            ? `the Realtime Database Security Rules for ${clc.bold(instanceDetails.name)} from the Firebase Console?`
            : `default rules?`}`;
        writeRules = await prompt_1.promptOnce({
            type: "confirm",
            message: msg,
            default: false,
        });
    }
    if (writeRules) {
        if (instanceDetails) {
            writeDBRules(await getDBRules(instanceDetails), `Database Rules for ${instanceDetails.name}`, filename, config);
            return;
        }
        writeDBRules(DEFAULT_RULES, "Default rules", filename, config);
        return;
    }
    logger.info("Skipping overwrite of Realtime Database Security Rules.");
    logger.info(`The security rules defined in ${clc.bold(filename)} will be published when you run ${clc.bold("firebase deploy")}.`);
    return;
}
exports.doSetup = doSetup;
