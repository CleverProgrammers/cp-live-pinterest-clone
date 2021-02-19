"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const clc = require("cli-color");
const error_1 = require("../../error");
const indexes_1 = require("../../firestore/indexes");
const logger = require("../../logger");
const utils = require("../../utils");
const rulesDeploy_1 = require("../../rulesDeploy");
async function deployRules(context) {
    const rulesDeploy = _.get(context, "firestore.rulesDeploy");
    if (!context.firestoreRules || !rulesDeploy) {
        return;
    }
    await rulesDeploy.createRulesets(rulesDeploy_1.RulesetServiceType.CLOUD_FIRESTORE);
}
async function deployIndexes(context, options) {
    if (!context.firestoreIndexes) {
        return;
    }
    const indexesFileName = _.get(context, "firestore.indexes.name");
    const indexesSrc = _.get(context, "firestore.indexes.content");
    if (!indexesSrc) {
        logger.debug("No Firestore indexes present.");
        return;
    }
    const indexes = indexesSrc.indexes;
    if (!indexes) {
        throw new error_1.FirebaseError(`Index file must contain an "indexes" property.`);
    }
    const fieldOverrides = indexesSrc.fieldOverrides || [];
    await new indexes_1.FirestoreIndexes().deploy(options, indexes, fieldOverrides);
    utils.logSuccess(`${clc.bold.green("firestore:")} deployed indexes in ${clc.bold(indexesFileName)} successfully`);
}
async function default_1(context, options) {
    await Promise.all([deployRules(context), deployIndexes(context, options)]);
}
exports.default = default_1;
