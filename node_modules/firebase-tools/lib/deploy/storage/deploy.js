"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const rulesDeploy_1 = require("../../rulesDeploy");
async function default_1(context) {
    const rulesDeploy = lodash_1.get(context, "storage.rulesDeploy");
    if (!rulesDeploy) {
        return;
    }
    await rulesDeploy.createRulesets(rulesDeploy_1.RulesetServiceType.FIREBASE_STORAGE);
}
exports.default = default_1;
