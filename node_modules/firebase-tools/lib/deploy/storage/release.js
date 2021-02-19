"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const rulesDeploy_1 = require("../../rulesDeploy");
async function default_1(context, options) {
    const rules = lodash_1.get(context, "storage.rules", []);
    const rulesDeploy = lodash_1.get(context, "storage.rulesDeploy");
    if (!rules.length || !rulesDeploy) {
        return;
    }
    const toRelease = [];
    for (const ruleConfig of rules) {
        if (ruleConfig.target) {
            options.rc.target(options.project, "storage", ruleConfig.target).forEach((bucket) => {
                toRelease.push({ bucket: bucket, rules: ruleConfig.rules });
            });
        }
        else {
            toRelease.push({ bucket: ruleConfig.bucket, rules: ruleConfig.rules });
        }
    }
    await Promise.all(toRelease.map((release) => {
        return rulesDeploy.release(release.rules, rulesDeploy_1.RulesetServiceType.FIREBASE_STORAGE, release.bucket);
    }));
}
exports.default = default_1;
