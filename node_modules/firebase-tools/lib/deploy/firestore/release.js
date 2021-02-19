"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const rulesDeploy_1 = require("../../rulesDeploy");
async function default_1(context, options) {
    const rulesDeploy = _.get(context, "firestore.rulesDeploy");
    if (!context.firestoreRules || !rulesDeploy) {
        return;
    }
    await rulesDeploy.release(options.config.get("firestore.rules"), rulesDeploy_1.RulesetServiceType.CLOUD_FIRESTORE);
}
exports.default = default_1;
